import * as Joi from "joi";
import {ValidationResult} from "joi";
import moment from "moment-timezone";
import {cloneDeep, mergeWith, isEqual, differenceWith} from "lodash";
import * as enums from "../assets/Enums";
import * as models from "../models";
import * as validators from "../models/validators";
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
    this.vehicleTestController = models.Injector.resolve<VehicleTestController>(VehicleTestController, [TestDataProvider, DateProvider]);
    this.vehicleTestController.dataProvider.testResultsDAO = this.testResultsDAO;
  }

  public async getTestResultBySystemNumber(filters: models.ITestResultFilters): Promise<models.ITestResult[]> {
    try {
    return await this.vehicleTestController.getTestResultBySystemNumber(filters);
  } catch (error) {
    return TestResultsService.handleError(error);
  }
  }

  public async getTestResultsByTesterStaffId(filters: models.ITestResultFilters): Promise<any> {
    try {
      return await this.vehicleTestController.getTestResultByTestStaffId(filters);
    } catch (error) {
      return TestResultsService.handleError(error);
    }
  }

  public async updateTestResult(systemNumber: string, payload: models.ITestResult, msUserDetails: models.IMsUserDetails) {
    utils.MappingUtil.removeNonEditableAttributes(payload);
    let validationSchema = utils.MappingUtil.getValidationSchema(payload.vehicleType, payload.testStatus);
    const testTypesValidationErrors = this.validateTestTypes(payload);
    if (testTypesValidationErrors) {
      return Promise.reject(new models.HTTPError(400, {errors: testTypesValidationErrors}));
    }
    // temporarily remove testTypes to validate only vehicle details and append testTypes to the payload again after the validation
    const {testTypes} = payload;
    delete payload.testTypes;
    validationSchema = validationSchema!.keys({
      countryOfRegistration: Joi.string().valid(enums.COUNTRY_OF_REGISTRATION).required(),
      testTypes: Joi.any().forbidden()
    });
    validationSchema = validationSchema.optionalKeys(["testEndTimestamp", "systemNumber", "vin"]);
    const validation: ValidationResult<any> | any | null = Joi.validate(payload, validationSchema);

    if (validation !== null && validation.error) {
      return Promise.reject(new models.HTTPError(400,
        {
          errors: MappingUtil.mapErrorMessage(validation)
        }));
    }
    payload.testTypes = testTypes;
    try {
      const result = await this.testResultsDAO.getBySystemNumber(systemNumber);
      const response: models.ITestResultData = { Count: result.Count, Items: result.Items };
      const testResults = utils.ValidationUtil.getTestResultItems(response);
      const oldTestResult = this.getTestResultToArchive(testResults, payload.testResultId);
      oldTestResult.testVersion = enums.TEST_VERSION.ARCHIVED;
      const newTestResult: models.ITestResult = cloneDeep(oldTestResult);
      newTestResult.testVersion = enums.TEST_VERSION.CURRENT;
      mergeWith(newTestResult, payload, MappingUtil.arrayCustomizer);
      if (this.shouldGenerateNewTestCodeRe(oldTestResult, newTestResult)) {
        const vehicleSubclass = newTestResult.vehicleSubclass && newTestResult.vehicleSubclass.length ? newTestResult.vehicleSubclass[0] : undefined;
        await this.getTestTypesWithTestCodesAndClassification((newTestResult.testTypes as any[]),
          newTestResult.vehicleType, newTestResult.vehicleSize, newTestResult.vehicleConfiguration,
          newTestResult.noOfAxles, newTestResult.euVehicleCategory, newTestResult.vehicleClass.code,
          vehicleSubclass, newTestResult.numberOfWheelsDriven);
      }
      await this.checkTestTypeStartAndEndTimestamp(oldTestResult, newTestResult);
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

  public shouldGenerateNewTestCodeRe(oldTestResult: models.ITestResult, newTestResult: models.ITestResult) {
    const attributesToCheck = ["vehicleType", "euVehicleCategory", "vehicleSize", "vehicleConfiguration", "noOfAxles", "numberOfWheelsDriven"];
    if (differenceWith(oldTestResult.testTypes, newTestResult.testTypes, isEqual).length) {
      return true;
    }
    for (const attributeToCheck of attributesToCheck) {
      if (oldTestResult[attributeToCheck as keyof typeof oldTestResult] !== newTestResult[attributeToCheck as keyof typeof newTestResult]) {
        return true;
      }
    }
    return false;
  }

  public async checkTestTypeStartAndEndTimestamp(oldTestResult: models.ITestResult, newTestResult: models.ITestResult) {
    moment.tz.setDefault("UTC");
    const params = {
      fromStartTime: moment(oldTestResult.testStartTimestamp).startOf("day").toDate(),
      toStartTime: oldTestResult.testStartTimestamp,
      activityType: "visit",
      testStationPNumber: oldTestResult.testStationPNumber,
      testerStaffId: oldTestResult.testerStaffId
    };
    try {
      const activities: [{startTime: Date, endTime: Date}] = await this.testResultsDAO.getActivity(params);
      if (activities.length > 1) {
        return Promise.reject({statusCode: 500, body: enums.ERRORS.NoUniqueActivityFound});
      }
      const activity = activities[0];
      for (const testType of newTestResult.testTypes) {
        if (moment(testType.testTypeStartTimestamp).isAfter(activity.endTime) || moment(testType.testTypeStartTimestamp).isBefore(activity.startTime)) {
          return Promise.reject({
            statusCode: 400,
            body: `The testTypeStartTimestamp must be within the visit, between ${activity.startTime} and ${activity.endTime}`
          });
        }
        if (moment(testType.testTypeEndTimestamp).isAfter(activity.endTime) || moment(testType.testTypeEndTimestamp).isBefore(activity.startTime)) {
          return Promise.reject({
            statusCode: 400,
            body: `The testTypeEndTimestamp must be within the visit, between ${activity.startTime} and ${activity.endTime}`
          });
        }
        if (moment(testType.testTypeStartTimestamp).isAfter(testType.testTypeEndTimestamp)) {
          return Promise.reject({statusCode: 400, body: enums.ERRORS.StartTimeBeforeEndTime});
        }
      }
    } catch (err) {
      if (err.statusCode !== 404) {
        return Promise.reject({statusCode: err.statusCode, body: `Activities microservice error: ${err.body}`});
      }
    }
  }

  public validateTestTypes(testResult: models.ITestResult) {
    let validationErrors;
    let validation: ValidationResult<any> | any;
    validation = validators.testTypesArray.validate({testTypes: testResult.testTypes});
    if (validation.error) {
      validationErrors = MappingUtil.mapErrorMessage(validation);
      return validationErrors;
    }
    for (const testType of testResult.testTypes) {
      const options = {abortEarly: false, context: {hasTestResult: testType.testResult}};
      if (enums.TEST_TYPES_GROUP1.includes(testType.testTypeId)) {
        // tests for PSV - Annual test, Class 6A seatbelt installation check, Paid/Part paid annual test retest, Prohibition clearance
        validation = validators.testTypesGroup1.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP2.includes(testType.testTypeId)) {
        // tests for PSV - Paid/Part paid prohibition clearance(full/partial/retest without cert)
        validation = validators.testTypesGroup2.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP3_4_8.includes(testType.testTypeId)) {
        // Notifiable alteration and voluntary tests for HGV, PSV and TRL
        validation = validators.testTypesGroup3And4And8.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP5_13.includes(testType.testTypeId)) {
        // TIR tests for TRL and HGV
        validation = validators.testTypesGroup5And13.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP6_11.includes(testType.testTypeId)) {
        // HGV and TRL - Paid/Part paid roadworthiness retest, Voluntary roadworthiness test
        validation = validators.testTypesGroup6And11.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP7.includes(testType.testTypeId)) {
        // ADR tests for HGV and TRL
        validation = validators.testTypesGroup7.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP9_10.includes(testType.testTypeId)) {
        // tests for HGV and TRL - Annual tests, First tests, Annual retests, Paid/Part paid prohibition clearance
        validation = validators.testTypesGroup9And10.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP12_14.includes(testType.testTypeId)) {
        // tests for TRL - Paid/Part paid prohibition clearance(retest, full inspection, part inspection, without cert)
        validation = validators.testTypesGroup12And14.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP15_16.includes(testType.testTypeId)) {
        // LEC tests for HGV and PSV
        validation = validators.testTypesGroup15And16.validate(testType, options);
      }  else if (enums.TEST_TYPES_GROUP1_SPEC_TEST.includes(testType.testTypeId)) {
        // Test/Retest - Free/Paid - IVA inspection, MSVA inspection
        validation = validators.testTypesSpecialistGroup1.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP2_SPEC_TEST.includes(testType.testTypeId)) {
        // Test/Retest COIF with annual test, Seatbelt installation check COIF with annual test
        validation = validators.testTypesSpecialistGroup2.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP3_SPEC_TEST.includes(testType.testTypeId)) {
        // Test/Retest COIF without annual test, Type approved to bus directive COIF, Annex 7 COIF, TILT COIF retest
        validation = validators.testTypesSpecialistGroup3.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP4_SPEC_TEST.includes(testType.testTypeId)) {
        // Test Seatbelt installation check COIF without annual test
        validation = validators.testTypesSpecialistGroup4.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP5_SPEC_TEST.includes(testType.testTypeId)) {
        // Test/Retest Normal/Basic voluntary IVA inspection
        validation = validators.testTypesSpecialistGroup5.validate(testType, options);
      } else {
        validation = {
          error: {
            details: [{message: "Unknown testTypeId"}]
          }
        };
      }
      if (validation.error) {
        validationErrors = MappingUtil.mapErrorMessage(validation);
        break;
      }
    }
    return validationErrors;
  }

  public getTestResultToArchive(testResults: models.ITestResult[], testResultId: string): models.ITestResult {
    testResults = testResults.filter((testResult) => {
      return testResult.testResultId === testResultId && (testResult.testVersion === enums.TEST_VERSION.CURRENT || !testResult.testVersion);
    });
    if (testResults.length !== 1) {
      throw new models.HTTPError(404, enums.ERRORS.NoResourceMatch);
    }
    return testResults[0];
  }

  public async insertTestResult(payload: models.ITestResultPayload) {
    // TODO: CVSB-18782 move all validation logic to validationUtil
    if (Object.keys(payload).length === 0) { // if empty object
      return Promise.reject(new models.HTTPError(400, enums.ERRORS.PayloadCannotBeEmpty));
    }
    const validationSchema = utils.MappingUtil.getValidationSchema(payload.vehicleType, payload.testStatus);

    const validation: ValidationResult<any> | any | null = Joi.validate(payload, validationSchema);

    if (!this.reasonForAbandoningPresentOnAllAbandonedTests(payload)) {
      return Promise.reject(new models.HTTPError(400, enums.MESSAGES.REASON_FOR_ABANDONING_NOT_PRESENT));
    }

    const fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse = utils.ValidationUtil.fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(payload);
    if (fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse.result) {
      return Promise.reject(new models.HTTPError(400, fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse.missingFields + " are null for a defect with deficiency category other than advisory"));
    }

    // CVSB-7964: Fields Validation for LEC Test Types
    const missingFieldsForLecTestType: string[] = utils.ValidationUtil.validateLecTestTypeFields(payload);
    if (missingFieldsForLecTestType && missingFieldsForLecTestType.length > 0) {
      return Promise.reject(new models.HTTPError(400,  {errors: missingFieldsForLecTestType} ));
    }
    if (utils.ValidationUtil.isMissingRequiredCertificateNumberOnAdr(payload)) {
      return Promise.reject(new models.HTTPError(400, enums.ERRORS.NoCertificateNumberOnAdr));
    }
    if (utils.ValidationUtil.isMissingRequiredCertificateNumberOnTir(payload)) {
      return Promise.reject(new models.HTTPError(400, enums.ERRORS.NoCertificateNumberOnTir));
    }
    if (utils.ValidationUtil.isPassAdrTestTypeWithoutExpiryDate(payload)) {
      return Promise.reject(new models.HTTPError(400, enums.ERRORS.NoExpiryDate));
    }

    const missingMandatoryTestResultFields: string[] = utils.ValidationUtil.validateMandatoryTestResultFields(payload);
    if (missingMandatoryTestResultFields.length > 0) {
      return Promise.reject(new models.HTTPError(400,  {errors: missingMandatoryTestResultFields} ));
    }

    if (validation !== null && validation.error) {
      return Promise.reject(new models.HTTPError(400,
        {
          errors: MappingUtil.mapErrorMessage(validation)
        }));
    }

    payload = MappingUtil.setCreatedAtAndLastUpdatedAtDates(payload);
    try {
      const testTypesWithTestCodesAndClassification = await this.getTestTypesWithTestCodesAndClassification(payload.testTypes, payload.vehicleType, payload.vehicleSize, payload.vehicleConfiguration,
        payload.noOfAxles, payload.euVehicleCategory, payload?.vehicleClass?.code, payload?.vehicleSubclass?.[0], payload.numberOfWheelsDriven);
      payload.testTypes = testTypesWithTestCodesAndClassification;
      const payloadWithTestNumber = await this.setTestNumber(payload);
      const payloadWithExpiryDate = await this.generateExpiryDate(payloadWithTestNumber);
      const payloadWithCertificateNumber = this.generateCertificateNumber(payloadWithExpiryDate);
      const payloadWithAnniversaryDate = this.calculateAnniversaryDate(payloadWithCertificateNumber);
      const payloadWithVehicleId = this.setVehicleIdToVRM(payloadWithAnniversaryDate);
      return await this.testResultsDAO.createSingle(payloadWithVehicleId);
    } catch (error) {
      if (error.statusCode === 400 && error.message === enums.MESSAGES.CONDITIONAL_REQUEST_FAILED) {
        console.log("Error in insertTestResult > getTestTypesWithTestCodesAndClassification: Test Result id already exists", error);
        return Promise.reject(new models.HTTPResponse(201, enums.MESSAGES.ID_ALREADY_EXISTS));
      }
      console.log("Error in insertTestResult > getTestTypesWithTestCodesAndClassification", error);
      return Promise.reject(new models.HTTPError(500, enums.MESSAGES.INTERNAL_SERVER_ERROR));
    }
  }

  public async setTestNumber(payload: models.ITestResultPayload) {
    const promiseArray: any[] = [];
    if (payload.testTypes) {
      payload.testTypes.forEach((testType: { testNumber: any; }) => {
        const promise = this.testResultsDAO.getTestNumber()
          .then((testNumberResponse: { testNumber: any; }) => {
            testType.testNumber = testNumberResponse.testNumber;
          });

        promiseArray.push(promise);
      });
      await Promise.all(promiseArray);
      return payload;
    } else {
      return Promise.resolve(payload);
    }
  }

  public reasonForAbandoningPresentOnAllAbandonedTests(payload: models.ITestResultPayload) {
    let bool = true;
    if (payload.testTypes) {
      if (payload.testTypes.length > 0) {
        payload.testTypes.forEach((testType: { testResult: string; reasonForAbandoning: any; }) => {
          if (testType.testResult === enums.TEST_RESULT.ABANDONED && !testType.reasonForAbandoning) {
            bool = false;
          }
        });
      }
    }
    return bool;
  }

  /**
   * Note: When performing actions on a moment instance, it gets mutated
   * Note: Expiry dates on the payload should be set at the UTC start of day.
   *
   * @param payload
   */
  public async generateExpiryDate(payload: models.ITestResultPayload): Promise<models.ITestResultPayload> {
    moment.tz.setDefault("UTC");
    try {
      if (payload.testStatus !== enums.TEST_STATUS.SUBMITTED ||
          utils.ValidationUtil.isNotAllowedVehicleTypeForExpiry(payload.vehicleType)) {
        return Promise.resolve(payload);
      }
      const expiryTestTypes = payload.testTypes.filter((testType) => utils.ValidationUtil.isAllowedTestTypeForExpiry(testType));

      const recentExpiry =  await this.vehicleTestController.dataProvider.getMostRecentExpiryDate(payload.systemNumber);

      expiryTestTypes.forEach((testType: any, index: number) => {
          const testTypeForExpiry: models.TestTypeForExpiry = {
            testType,
            vehicleType: enums.VEHICLE_TYPE[payload.vehicleType.toUpperCase() as keyof typeof enums.VEHICLE_TYPE],
            recentExpiry,
            regnOrFirstUseDate: this.getRegistrationOrFirstUseDate(payload),
            hasHistory: !DateProvider.isSameAsEpoc(recentExpiry),
            hasRegistration: DateProvider.isValidDate(this.getRegistrationOrFirstUseDate(payload))
          };
          console.log(testTypeForExpiry);
          const strategy = this.vehicleTestController.getExpiryStrategy(testTypeForExpiry);
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

  private getRegistrationOrFirstUseDate(payload: models.ITestResultPayload) {
  return payload.vehicleType === enums.VEHICLE_TYPES.TRL ? payload.firstUseDate : payload.regnDate;
  }

  public async getMostRecentExpiryDateOnAllTestTypesBySystemNumber(systemNumber: any): Promise<Date> {
    let maxDate = new Date(1970, 1, 1);
    try {
      const testResults = await this.getTestResultBySystemNumber({
        systemNumber,
        testStatus: enums.TEST_STATUS.SUBMITTED,
        fromDateTime: new Date(1970, 1, 1),
        toDateTime: new Date()
      });
      const filteredTestTypeDates: any[] = [];
      testResults.forEach((testResult) => {
        testResult.testTypes.forEach((testType) => {
          // prepare a list of annualTestTypes with expiry.
          if (utils.ValidationUtil.isValidTestCodeForExpiryCalculation(testType.testCode) && DateProvider.isValidDate(testType.testExpiryDate)) {
            filteredTestTypeDates.push(moment(testType.testExpiryDate));
          }
        });
      });
      const annualTestTypeDates = filteredTestTypeDates;
      // fetch maxDate for annualTestTypes
      if (annualTestTypeDates && annualTestTypeDates.length > 0) {
        maxDate = moment.max(annualTestTypeDates).toDate();
      }
      return maxDate;
    } catch (err) {
      console.error("Something went wrong in generateExpiryDate > getMostRecentExpiryDateOnAllTestTypesBySystemNumber > getTestResultBySystemNumber. Returning default test date and logging error:", err);
      return maxDate;
    }
  }

  // TODO: CVSB-18782 set default value as empty array for testTypes
  public async getTestTypesWithTestCodesAndClassification(testTypes: Array<{ testTypeClassification: any; testTypeId: any; testCode?: any; }> = [], vehicleType: any, vehicleSize: any, vehicleConfiguration: any, noOfAxles: any,
                                                          euVehicleCategory: any, vehicleClass: any, vehicleSubclass: any, numberOfWheelsDriven: any) {
    const promiseArray: any = [];
    if (testTypes === undefined) {
      testTypes = [];
    }
    // TODO: CVSB-18782 flatten promise and refactor code
    testTypes.forEach((testType, index) => {
      const promise = this.testResultsDAO.getTestCodesAndClassificationFromTestTypes(testType.testTypeId, vehicleType, vehicleSize, vehicleConfiguration, noOfAxles, euVehicleCategory, vehicleClass, vehicleSubclass, numberOfWheelsDriven)
        .then((currentTestCodesAndClassification: { defaultTestCode: any; testTypeClassification: any; linkedTestCode: any; }) => {
          if (testTypes.length === 1) {
            testTypes[index].testCode = currentTestCodesAndClassification.defaultTestCode;
            testTypes[index].testTypeClassification = currentTestCodesAndClassification.testTypeClassification;
          } else {
            if (currentTestCodesAndClassification.linkedTestCode) {
              testTypes[index].testCode = currentTestCodesAndClassification.linkedTestCode;
            } else {
              testTypes[index].testCode = currentTestCodesAndClassification.defaultTestCode;
            }
            testTypes[index].testTypeClassification = currentTestCodesAndClassification.testTypeClassification;
          }
        });
      promiseArray.push(promise);
    });
    await Promise.all(promiseArray);
    return Promise.resolve(testTypes);
  }

  public removeVehicleClassification(payload: { testTypes: { forEach: (arg0: (testType: any) => void) => void; }; }) {
    payload.testTypes.forEach((testType) => {
      delete testType.testTypeClassification;
    });
    return payload;
  }

  public setVehicleIdToVRM(payload: models.ITestResultPayload): models.ITestResultPayload {
    payload.vehicleId = payload.vrm;
    return payload;
  }

  public calculateAnniversaryDate(payload: models.ITestResultPayload) {
    payload.testTypes.forEach((testType) => {
      if (testType.testExpiryDate) {
        if (payload.vehicleType === enums.VEHICLE_TYPES.PSV) {
          testType.testAnniversaryDate = moment(testType.testExpiryDate).utc().subtract(2, "months").add(1, "days").toISOString();
        } else {
          testType.testAnniversaryDate = testType.testExpiryDate;
        }
      }
    });
    return payload;
  }



  /**
   * This function will not remove the certificate number on the test types which already have it set
   */
  public generateCertificateNumber(payload: models.ITestResultPayload) {
    if (payload.testStatus === enums.TEST_STATUS.SUBMITTED) {
      payload.testTypes.forEach((testType) => {
        if (this.shouldGenerateCertificateNumber(testType, payload.vehicleType)) {
          testType.certificateNumber = testType.testNumber;
        }
      });
  }
    return payload;
}
  private shouldGenerateCertificateNumber(testType: models.TestType, vehicleType: string): boolean {
    if (testType.testTypeClassification === enums.TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE && testType.testResult !== enums.TEST_RESULT.ABANDONED) {
      if (utils.ValidationUtil.isTestTypeAdr(testType) || utils.ValidationUtil.isTestTypeLec(testType)) {
        return false;
      }
      if (TestResultsService.isHGVTRLRoadworthinessTest(testType.testTypeId)) {
        return (TestResultsService.isHgvOrTrl(vehicleType) && testType.testResult !== enums.TEST_RESULT.FAIL);
      }
      return true;
    }
    return false;
  }


  //#region Private Static Functions
  private static isHGVTRLRoadworthinessTest(testTypeId: string): boolean {
    return enums.HGV_TRL_ROADWORTHINESS_TEST_TYPES.IDS.includes(testTypeId);
   }

  private static isHgvOrTrl(vehicleType: string): boolean {
    return vehicleType === enums.VEHICLE_TYPES.HGV || vehicleType === enums.VEHICLE_TYPES.TRL;
  }

  private static handleError(error: any) {
    console.error("TestResultsService.getTestResultBySystemNumber: error -> ", error);
    const httpError = error as models.HTTPError;
    if (!(httpError && [400, 404].includes(httpError.statusCode))) {
      return Promise.reject(new models.HTTPError(500, enums.MESSAGES.INTERNAL_SERVER_ERROR));
    }
    return Promise.reject(error);
  }
  //#endregion
}
