import { cloneDeep, mergeWith, differenceWith, isEqual } from "lodash";
import * as enums from "../assets/Enums";
import * as utils from "../utils";
import * as models from "../models";
import { IVehicleTestController } from "./IVehicleTestController";
import { IExpiryDateStrategy } from "./expiry/IExpiryDateStrategy";
import { ExpiryDateStrategyFactory } from "./expiry/ExpiryDateStrategyFactory";
import { TestTypeForExpiry } from "../models/TestTypeforExpiry";
import { Service } from "../models/injector/ServiceDecorator";
import { TestDataProvider } from "./expiry/providers/TestDataProvider";
import { DateProvider } from "./expiry/providers/DateProvider";
import { EPROTONOSUPPORT } from "constants";

@Service()
export class VehicleTestController implements IVehicleTestController {
  constructor(
    public dataProvider: TestDataProvider,
    public dateProvider: DateProvider
  ) {}

  //#region [rgba(52, 152, 219, 0.15)] Public functions
  /**
   * To fetch test results by SystemNumber
   * @param filters test results filters for search
   */
  public async getTestResultBySystemNumber(
    filters: models.ITestResultFilters
  ): Promise<models.ITestResult[]> {
    if (
      !filters.systemNumber ||
      !utils.ValidationUtil.validateGetTestResultFilters(filters)
    ) {
      throw new models.HTTPError(400, enums.MESSAGES.BAD_REQUEST);
    }
    const result = await this.dataProvider.getTestResultBySystemNumber(filters);
    if (result.length === 0) {
      throw new models.HTTPError(404, enums.ERRORS.NoResourceMatch);
    }
    return result;
  }

  /**
   * To fetch test results by Tester Staff Id
   * @param filters test results filters for search
   */
  public async getTestResultByTestStaffId(
    filters: models.ITestResultFilters
  ): Promise<models.ITestResult[]> {
    if (
      !filters.testerStaffId ||
      !utils.ValidationUtil.validateGetTestResultFilters(filters)
    ) {
      throw new models.HTTPError(400, enums.MESSAGES.BAD_REQUEST);
    }
    const result = await this.dataProvider.getTestResultByTesterStaffId(
      filters
    );
    if (result.length === 0) {
      throw new models.HTTPError(404, enums.ERRORS.NoResourceMatch);
    }
    return result;
  }

  /**
   * A factory method used to fetch a strategy for calculating expiry date based on a strategy mapping JSON file.
   * @param testTypeForExpiry an input object which is used to calculate expiry based on test type.
   */
  public getExpiryStrategy(
    testTestForExpiry: TestTypeForExpiry
  ): IExpiryDateStrategy {
    const selectedStrategy = ExpiryDateStrategyFactory.GetExpiryStrategy(
      testTestForExpiry,
      this.dateProvider
    );
    return selectedStrategy;
  }

  public async insertTestResult(payload: models.ITestResultPayload) {
    try {
      utils.ValidationUtil.validateInsertTestResultPayload(payload);
      console.info("validation is success");
      payload = utils.MappingUtil.setCreatedAtAndLastUpdatedAtDates(payload);
      const testTypeParams: models.TestTypeParams = {
        vehicleType: payload.vehicleType,
        vehicleSize: payload.vehicleSize,
        vehicleConfiguration: payload.vehicleConfiguration,
        vehicleAxles: payload.noOfAxles,
        euVehicleCategory: payload.euVehicleCategory,
        vehicleClass: payload.vehicleClass?.code,
        vehicleSubclass: payload.vehicleSubclass?.[0],
        vehicleWheels: payload.numberOfWheelsDriven,
      };
      const testTypesWithTestCodesAndClassification =
        await this.dataProvider.getTestTypesWithTestCodesAndClassification(
          payload.testTypes,
          testTypeParams
        );
      payload.testTypes = testTypesWithTestCodesAndClassification;

      const payloadWithTestNumber =
        await this.dataProvider.setTestNumberForEachTestType(payload);
      payload.testTypes = payloadWithTestNumber as models.TestType[];

      const payloadWithExpiryDate = await this.generateExpiryDate(payload);
      const payloadWithCertificateNumber =
        VehicleTestController.AssignCertificateNumberToTestTypes(
          payloadWithExpiryDate
        );
      const payloadWithAnniversaryDate =
        VehicleTestController.calculateAnniversaryDate(
          payloadWithCertificateNumber
        );
      payloadWithAnniversaryDate.vehicleId = payloadWithAnniversaryDate.vrm;
      const result = await this.dataProvider.insertTestResult(
        payloadWithAnniversaryDate
      );
      return result;
    } catch (error) {
      if (
        error.statusCode === 400 &&
        error.message === enums.MESSAGES.CONDITIONAL_REQUEST_FAILED
      ) {
        console.info(
          "TestResultService.insertTestResult: Test Result id already exists",
          error
        );
        error = new models.HTTPResponse(201, enums.MESSAGES.ID_ALREADY_EXISTS);
      }
      throw error;
    }
  }

  public async updateTestResult(
    systemNumber: string,
    payload: models.ITestResult,
    msUserDetails: models.IMsUserDetails
  ) {
    let newTestResult: models.ITestResult;
    try {
      const { testTypes } = payload;
      utils.MappingUtil.removeNonEditableAttributes(payload);
      const validationErrors =
        utils.ValidationUtil.validateUpdateTestResult(payload);
      if (validationErrors && validationErrors.length) {
        throw new models.HTTPError(400, {
          errors: validationErrors,
        });
      }
      // map testTypes back after validation
      payload.testTypes = testTypes;

      newTestResult = await this.mapOldTestResultToNew(
        systemNumber,
        payload,
        msUserDetails
      );
    } catch (error) {
      console.error("Error on update test result", error);
      throw new models.HTTPError(error.statusCode, error.body);
    }
    try {
      await this.dataProvider.updateTestResult(newTestResult);
      return newTestResult;
    } catch (dynamoError) {
      console.error("dynamoError", dynamoError);
      throw new models.HTTPError(500, dynamoError.message);
    }
  }

  //#endregion
  //#region [rgba(0, 205, 30, 0.1)] Private functions
  /**
   * Note: When performing actions on a moment instance, it gets mutated
   * Note: Expiry dates on the payload should be set at the UTC start of day.
   *
   * @param payload
   */
  private async generateExpiryDate(
    payload: models.ITestResultPayload
  ): Promise<models.ITestResultPayload> {
    try {
      if (
        payload.testStatus !== enums.TEST_STATUS.SUBMITTED ||
        utils.ValidationUtil.isNotAllowedVehicleTypeForExpiry(
          payload.vehicleType
        )
      ) {
        return payload;
      }
      const expiryTestTypes = payload.testTypes.filter((testType) =>
        utils.ValidationUtil.isAllowedTestTypeForExpiry(testType)
      );

      const recentExpiry = await this.dataProvider.getMostRecentExpiryDate(
        payload.systemNumber
      );

      expiryTestTypes.forEach((testType: any, index: number) => {
        const testTypeForExpiry: models.TestTypeForExpiry = {
          testType,
          vehicleType:
            enums.VEHICLE_TYPE[
              payload.vehicleType.toUpperCase() as keyof typeof enums.VEHICLE_TYPE
            ],
          recentExpiry,
          regnOrFirstUseDate:
            VehicleTestController.getRegistrationOrFirstUseDate(payload),
          hasHistory: !DateProvider.isSameAsEpoc(recentExpiry),
          hasRegistration: DateProvider.isValidDate(
            VehicleTestController.getRegistrationOrFirstUseDate(payload)
          ),
        };
        console.log("testTypeForExpiry");
        console.log(testTypeForExpiry);
        const strategy = this.getExpiryStrategy(testTypeForExpiry);
        console.log(strategy.constructor.name);
        testType.testExpiryDate = strategy.getExpiryDate();
      });
      console.log("generateExpiryDate: testTypes ->", payload.testTypes);
      return Promise.resolve(payload);
    } catch (error) {
      console.error("Error in error generateExpiryDate", error);
      throw new models.HTTPError(500, enums.MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }
  /**
   * This function will not remove the certificate number on the test types which already have it set
   */
  private static AssignCertificateNumberToTestTypes(
    payload: models.ITestResultPayload
  ) {
    if (payload.testStatus !== enums.TEST_STATUS.SUBMITTED) {
      return payload;
    }
    payload.testTypes.forEach((testType) => {
      if (this.shouldGenerateCertificateNumber(testType, payload.vehicleType)) {
        testType.certificateNumber = testType.testNumber;
      }
    });
    return payload;
  }

  private static calculateAnniversaryDate(payload: models.ITestResultPayload) {
    const { vehicleType } = payload;
    payload.testTypes.forEach((testType: models.TestType) => {
      const { testExpiryDate } = testType;
      if (!testExpiryDate) {
        return;
      }
      testType.testAnniversaryDate =
        vehicleType === enums.VEHICLE_TYPES.PSV
          ? DateProvider.getPsvAnniversaryDate(testExpiryDate)
          : testExpiryDate;
    });
    return payload;
  }

  private static getRegistrationOrFirstUseDate(
    payload: models.ITestResultPayload
  ) {
    return payload.vehicleType === enums.VEHICLE_TYPES.TRL
      ? payload.firstUseDate
      : payload.regnDate;
  }
  //#endregion
  public async mapOldTestResultToNew(
    systemNumber: string,
    payload: models.ITestResult,
    msUserDetails: models.IMsUserDetails
  ) {
    const testResults = await this.dataProvider.getBySystemNumber(systemNumber);
    const oldTestResult = VehicleTestController.getTestResultToArchive(
      testResults,
      payload.testResultId
    );
    const newTestResult = cloneDeep(oldTestResult);
    oldTestResult.testVersion = enums.TEST_VERSION.ARCHIVED;
    newTestResult.testVersion = enums.TEST_VERSION.CURRENT;
    mergeWith(newTestResult, payload, utils.MappingUtil.arrayCustomizer);
    // @ts-ignore
    newTestResult.testTypes = await this.generateNewTestCode(
      oldTestResult,
      newTestResult
    );
    await this.checkTestTypeStartAndEndTimestamp(newTestResult);
    utils.MappingUtil.cleanDefectsArrayForSpecialistTests(newTestResult);
    utils.MappingUtil.setAuditDetails(
      newTestResult,
      oldTestResult,
      msUserDetails
    );
    if (!newTestResult.testHistory) {
      newTestResult.testHistory = [oldTestResult];
    } else {
      delete oldTestResult.testHistory;
      newTestResult.testHistory.push(oldTestResult);
    }
    return newTestResult;
  }

  private async generateNewTestCode(
    oldTestResult: models.ITestResult,
    newTestResult: models.ITestResult
  ) {
    const {
      vehicleType,
      vehicleSize,
      vehicleConfiguration,
      euVehicleCategory,
      testTypes,
    } = newTestResult;
    if (
      !VehicleTestController.shouldGenerateNewTestCode(
        oldTestResult,
        newTestResult
      )
    ) {
      return testTypes;
    }
    const vehicleSubclass =
      newTestResult.vehicleSubclass && newTestResult.vehicleSubclass.length
        ? newTestResult.vehicleSubclass[0]
        : undefined;
    return await this.dataProvider.updateTestTypeDetails(
      testTypes,
      {
        vehicleType,
        vehicleSize,
        vehicleConfiguration,
        vehicleAxles: newTestResult.noOfAxles,
        euVehicleCategory,
        vehicleClass: newTestResult.vehicleClass.code,
        vehicleSubclass,
        vehicleWheels: newTestResult.numberOfWheelsDriven,
      }
    );
  }
  private static shouldGenerateNewTestCode(
    oldTestResult: models.ITestResult,
    newTestResult: models.ITestResult
  ) {
    const attributesToCheck = [
      "vehicleType",
      "euVehicleCategory",
      "vehicleSize",
      "vehicleConfiguration",
      "noOfAxles",
      "numberOfWheelsDriven",
    ];
    let result = false;
    result = !!differenceWith(
      oldTestResult.testTypes,
      newTestResult.testTypes,
      isEqual
    ).length;
    if (result) {
      return result;
    }
    result = attributesToCheck.some(
      (attributeToCheck) =>
        oldTestResult[attributeToCheck as keyof typeof oldTestResult] !==
        newTestResult[attributeToCheck as keyof typeof newTestResult]
    );
    return result;
  }

  public async checkTestTypeStartAndEndTimestamp(
    newTestResult: models.ITestResult
  ) {
    const { testTypes } = newTestResult;
    const isStartAfterEnd = testTypes.some((testType) => {
      const { testTypeStartTimestamp, testTypeEndTimestamp } = testType;
      return DateProvider.isAfterDate(
        testTypeStartTimestamp,
        testTypeEndTimestamp
      );
    });
    if (isStartAfterEnd) {
      throw new models.HTTPError(400, enums.ERRORS.StartTimeBeforeEndTime);
    }

  }

  private static getTestResultToArchive(
    testResults: models.ITestResult[],
    testResultId: string
  ): models.ITestResult {
    testResults = testResults.filter(
      (testResult) =>
        testResult.testResultId === testResultId &&
        (testResult.testVersion === enums.TEST_VERSION.CURRENT ||
          !testResult.testVersion)
    );
    if (testResults.length !== 1) {
      throw new models.HTTPError(404, enums.ERRORS.NoResourceMatch);
    }
    return testResults[0];
  }

  private static shouldGenerateCertificateNumber(
    testType: models.TestType,
    vehicleType: string
  ): boolean {
    if (
      testType.testTypeClassification ===
        enums.TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE &&
      testType.testResult !== enums.TEST_RESULT.ABANDONED
    ) {
      if (
        utils.ValidationUtil.isTestTypeAdr(testType) ||
        utils.ValidationUtil.isTestTypeLec(testType)
      ) {
        return false;
      }
      if (
        // @ts-ignore
        utils.ValidationUtil.isHGVTRLRoadworthinessTest(testType.testTypeId)
      ) {
        return (
          // @ts-ignore
          utils.ValidationUtil.isHgvOrTrl(vehicleType) &&
          testType.testResult !== enums.TEST_RESULT.FAIL
        );
      }
      return true;
    }
    return false;
  }
}
