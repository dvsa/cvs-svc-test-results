import { ValidationResult, string, any, validate } from "joi";
import moment from "moment-timezone";
import { cloneDeep, mergeWith, isEqual, differenceWith } from "lodash";
import * as enums from "../assets/Enums";
import * as models from "../models";
import * as utils from "../utils";
import { VehicleTestController } from "../handlers/VehicleTestController";
import { TestDataProvider } from "../handlers/expiry/providers/TestDataProvider";
import { DateProvider } from "../handlers/expiry/providers/DateProvider";
import { MappingUtil } from "../utils/mappingUtil";

/**
 * Service for retrieving and creating Test Results from/into the db
 * @returns Promise
 */
export class TestResultsService {
  public readonly testResultsDAO: models.TestResultsDAO;
  public vehicleTestController: VehicleTestController;

  constructor(testResultsDAO: models.TestResultsDAO) {
    this.testResultsDAO = testResultsDAO;
    this.vehicleTestController = models.Injector.resolve<VehicleTestController>(
      VehicleTestController,
      [TestDataProvider, DateProvider]
    );
    this.vehicleTestController.dataProvider.testResultsDAO = this.testResultsDAO;
  }

  public async getTestResultBySystemNumber(
    filters: models.ITestResultFilters
  ): Promise<models.ITestResult[]> {
    try {
      return await this.vehicleTestController.getTestResultBySystemNumber(
        filters
      );
    } catch (error) {
      return TestResultsService.handleError(error);
    }
  }

  public async getTestResultsByTesterStaffId(
    filters: models.ITestResultFilters
  ): Promise<any> {
    try {
      return await this.vehicleTestController.getTestResultByTestStaffId(
        filters
      );
    } catch (error) {
      return TestResultsService.handleError(error);
    }
  }

  public async updateTestResult(
    systemNumber: string,
    payload: models.ITestResult,
    msUserDetails: models.IMsUserDetails
  ) {
    utils.MappingUtil.removeNonEditableAttributes(payload);
    let validationSchema = utils.ValidationUtil.getValidationSchema(
      payload.vehicleType,
      payload.testStatus
    );
    const testTypesValidationErrors = utils.ValidationUtil.validateTestTypes(
      payload
    );
    if (testTypesValidationErrors) {
      return Promise.reject(
        new models.HTTPError(400, { errors: testTypesValidationErrors })
      );
    }
    // temporarily remove testTypes to validate only vehicle details and append testTypes to the payload again after the validation
    const { testTypes } = payload;
    delete payload.testTypes;
    validationSchema = validationSchema!.keys({
      countryOfRegistration: string()
        .valid(enums.COUNTRY_OF_REGISTRATION)
        .required(),
      testTypes: any().forbidden(),
    });
    validationSchema = validationSchema.optionalKeys([
      "testEndTimestamp",
      "systemNumber",
      "vin",
    ]);
    const validation: ValidationResult<any> | any | null = validate(
      payload,
      validationSchema
    );

    if (validation !== null && validation.error) {
      return Promise.reject(
        new models.HTTPError(400, {
          errors: MappingUtil.mapErrorMessage(validation),
        })
      );
    }
    payload.testTypes = testTypes;
    try {
      const result = await this.testResultsDAO.getBySystemNumber(systemNumber);
      const response: models.ITestResultData = {
        Count: result.Count,
        Items: result.Items,
      };
      const testResults = utils.ValidationUtil.getTestResultItems(response);
      const oldTestResult = this.getTestResultToArchive(
        testResults,
        payload.testResultId
      );
      oldTestResult.testVersion = enums.TEST_VERSION.ARCHIVED;
      const newTestResult: models.ITestResult = cloneDeep(oldTestResult);
      newTestResult.testVersion = enums.TEST_VERSION.CURRENT;
      mergeWith(newTestResult, payload, MappingUtil.arrayCustomizer);
      if (this.shouldGenerateNewTestCodeRe(oldTestResult, newTestResult)) {
        const vehicleSubclass =
          newTestResult.vehicleSubclass && newTestResult.vehicleSubclass.length
            ? newTestResult.vehicleSubclass[0]
            : undefined;
        await this.vehicleTestController.dataProvider.getTestTypesWithTestCodesAndClassification(
          newTestResult.testTypes as any[],
          {
            vehicleType: newTestResult.vehicleType,
            vehicleSize: newTestResult.vehicleSize,
            vehicleConfiguration: newTestResult.vehicleConfiguration,
            vehicleAxles: newTestResult.noOfAxles,
            euVehicleCategory: newTestResult.euVehicleCategory,
            vehicleClass: newTestResult.vehicleClass.code,
            vehicleSubclass,
            vehicleWheels: newTestResult.numberOfWheelsDriven,
          }
        );
      }
      await this.checkTestTypeStartAndEndTimestamp(
        oldTestResult,
        newTestResult
      );
      MappingUtil.cleanDefectsArrayForSpecialistTests(newTestResult);
      MappingUtil.setAuditDetails(newTestResult, oldTestResult, msUserDetails);
      if (!newTestResult.testHistory) {
        newTestResult.testHistory = [oldTestResult];
      } else {
        delete oldTestResult.testHistory;
        newTestResult.testHistory.push(oldTestResult);
      }
      try {
        await this.testResultsDAO.updateTestResult(newTestResult);
        return newTestResult;
      } catch (dynamoError) {
        throw new models.HTTPError(500, dynamoError.message);
      }
    } catch (error) {
      throw new models.HTTPError(error.statusCode, error.body);
    }
  }

  public shouldGenerateNewTestCodeRe(
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
    if (
      differenceWith(oldTestResult.testTypes, newTestResult.testTypes, isEqual)
        .length
    ) {
      return true;
    }
    for (const attributeToCheck of attributesToCheck) {
      if (
        oldTestResult[attributeToCheck as keyof typeof oldTestResult] !==
        newTestResult[attributeToCheck as keyof typeof newTestResult]
      ) {
        return true;
      }
    }
    return false;
  }

  public async checkTestTypeStartAndEndTimestamp(
    oldTestResult: models.ITestResult,
    newTestResult: models.ITestResult
  ) {
    moment.tz.setDefault("UTC");
    const params = {
      fromStartTime: moment(oldTestResult.testStartTimestamp)
        .startOf("day")
        .toDate(),
      toStartTime: oldTestResult.testStartTimestamp,
      activityType: "visit",
      testStationPNumber: oldTestResult.testStationPNumber,
      testerStaffId: oldTestResult.testerStaffId,
    };
    try {
      const activities: [
        { startTime: Date; endTime: Date }
      ] = await this.testResultsDAO.getActivity(params);
      if (activities.length > 1) {
        return Promise.reject({
          statusCode: 500,
          body: enums.ERRORS.NoUniqueActivityFound,
        });
      }
      const activity = activities[0];
      for (const testType of newTestResult.testTypes) {
        if (
          moment(testType.testTypeStartTimestamp).isAfter(activity.endTime) ||
          moment(testType.testTypeStartTimestamp).isBefore(activity.startTime)
        ) {
          return Promise.reject({
            statusCode: 400,
            body: `The testTypeStartTimestamp must be within the visit, between ${activity.startTime} and ${activity.endTime}`,
          });
        }
        if (
          moment(testType.testTypeEndTimestamp).isAfter(activity.endTime) ||
          moment(testType.testTypeEndTimestamp).isBefore(activity.startTime)
        ) {
          return Promise.reject({
            statusCode: 400,
            body: `The testTypeEndTimestamp must be within the visit, between ${activity.startTime} and ${activity.endTime}`,
          });
        }
        if (
          moment(testType.testTypeStartTimestamp).isAfter(
            testType.testTypeEndTimestamp
          )
        ) {
          return Promise.reject({
            statusCode: 400,
            body: enums.ERRORS.StartTimeBeforeEndTime,
          });
        }
      }
    } catch (err) {
      if (err.statusCode !== 404) {
        return Promise.reject({
          statusCode: err.statusCode,
          body: `Activities microservice error: ${err.body}`,
        });
      }
    }
  }

  public getTestResultToArchive(
    testResults: models.ITestResult[],
    testResultId: string
  ): models.ITestResult {
    testResults = testResults.filter((testResult) => {
      return (
        testResult.testResultId === testResultId &&
        (testResult.testVersion === enums.TEST_VERSION.CURRENT ||
          !testResult.testVersion)
      );
    });
    if (testResults.length !== 1) {
      throw new models.HTTPError(404, enums.ERRORS.NoResourceMatch);
    }
    return testResults[0];
  }

  public async insertTestResult(payload: models.ITestResultPayload) {
    try {
      const result =  await this.vehicleTestController.insertTestResult(payload);
      return result;
    } catch (error) {
      console.error("TestResultService.insertTestResult ->", error);
      const rejection = [201, 400].includes(error.statusCode)
        ? error
        : new models.HTTPError(500, enums.MESSAGES.INTERNAL_SERVER_ERROR);
      return Promise.reject(rejection);
    }
  }

  private static handleError(error: any) {
    console.error(error);
    const httpError = error as models.HTTPError;
    if (!(httpError && [400, 404].includes(httpError.statusCode))) {
      return Promise.reject(
        new models.HTTPError(500, enums.MESSAGES.INTERNAL_SERVER_ERROR)
      );
    }
    return Promise.reject(error);
  }
  //#endregion
}
