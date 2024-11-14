import { any, string, ValidationResult } from 'joi';
import { isDate } from 'lodash';
import { TestTypeHelper } from '@dvsa/cvs-microservice-common/classes/testTypes/testTypeHelper';
import {
  ADR_TEST,
  CENTRAL_DOCS_TEST,
  HGV_TRL_RWT_TEST,
  IVA_TEST,
  LEC_TEST,
  MSVA_TEST,
  TIR_TEST,
} from '@dvsa/cvs-microservice-common/classes/testTypes/Constants';
import {
  TestResultSchema,
  TestTypeSchema,
} from '@dvsa/cvs-type-definitions/types/v1/test-result';
import { TestResults } from '@dvsa/cvs-type-definitions/types/v1/enums/testResult.enum';
import * as enums from '../assets/Enums';
import * as models from '../models';
import * as validators from '../models/validators';
import { MappingUtil } from './mappingUtil';

export class ValidationUtil {
  // #region [rgba(52, 152, 219, 0.15)]  Public Functions
  public static getTestResultItems(data?: models.ITestResultData) {
    if (!data || !data.Count) {
      throw new models.HTTPError(404, enums.ERRORS.NoResourceMatch);
    }
    return data.Items as TestResultSchema[];
  }

  public static validateGetTestResultFilters(
    filters: models.ITestResultFilters,
  ) {
    const result =
      filters &&
      ValidationUtil.validateDates(
        filters.fromDateTime as Date,
        filters.toDateTime as Date,
      );
    if (!result) {
      console.log(
        'ValidationUtil.validateGetTestResultFilters: Invalid Filter -> ',
        filters,
      );
    }
    return result;
  }

  public static validateInsertTestResultPayload(payload: TestResultSchema) {
    if (!Object.keys(payload).length) {
      throw new models.HTTPError(400, enums.ERRORS.PayloadCannotBeEmpty);
    }
    const validationSchema = ValidationUtil.getValidationSchema(
      payload.vehicleType,
      payload.testStatus,
    );

    // TODO COMMENTED OUT UNTIL FEATURE TEAMS COMPLETE IVA DEFECT WORK
    // if (this.isIvaTest(payload.testTypes)) {
    //   this.ivaFailedHasRequiredFields(payload.testTypes);
    // }

    this.validateCentralDocs(payload.testTypes);

    const validation: ValidationResult<any> | any | null = validationSchema
      ? validationSchema.validate(payload)
      : null;

    if (
      !ValidationUtil.reasonForAbandoningPresentOnAllAbandonedTests(payload)
    ) {
      throw new models.HTTPError(
        400,
        enums.MESSAGES.REASON_FOR_ABANDONING_NOT_PRESENT,
      );
    }

    const fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory =
      ValidationUtil.fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(
        payload,
      );
    if (fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory) {
      throw new models.HTTPError(
        400,
        fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory,
      );
    }
    const missingFieldsForLecTestType: string[] =
      ValidationUtil.validateLecTestTypeFields(payload);
    if (missingFieldsForLecTestType && missingFieldsForLecTestType.length > 0) {
      throw new models.HTTPError(400, { errors: missingFieldsForLecTestType });
    }
    if (ValidationUtil.isMissingRequiredCertificateNumberOnAdr(payload)) {
      throw new models.HTTPError(400, enums.ERRORS.NoCertificateNumberOnAdr);
    }
    if (ValidationUtil.isMissingRequiredCertificateNumberOnTir(payload)) {
      throw new models.HTTPError(400, enums.ERRORS.NoCertificateNumberOnTir);
    }
    if (ValidationUtil.isPassAdrTestTypeWithoutExpiryDate(payload)) {
      throw new models.HTTPError(400, enums.ERRORS.NoExpiryDate);
    }
    if (ValidationUtil.isFailLecTestTypeWithoutCertificateNumber(payload)) {
      throw new models.HTTPError(400, enums.ERRORS.NoCertificateNumberOnLec);
    }

    const missingMandatoryTestResultFields: string[] =
      ValidationUtil.validateMandatoryTestResultFields(payload);
    if (missingMandatoryTestResultFields.length > 0) {
      throw new models.HTTPError(400, {
        errors: missingMandatoryTestResultFields,
      });
    }

    if (validation !== null && validation.error) {
      throw new models.HTTPError(400, {
        errors: MappingUtil.mapErrorMessage(validation),
      });
    }
    return true;
  }

  public static validateUpdateTestResult(payload: TestResultSchema) {
    // TODO COMMENTED OUT UNTIL FEATURE TEAMS COMPLETE IVA DEFECT WORK
    // if (payload.testTypes && this.isIvaTest(payload.testTypes)) {
    //   this.ivaFailedHasRequiredFields(payload.testTypes);
    // }

    const validationErrors = this.validateTestTypes(payload);
    // to testTypes are deleted to avoid validation on testTypes again
    delete payload.testTypes;
    // validate all other attributes except test types
    validationErrors.push(...this.validateTestResultAttributes(payload));
    return validationErrors;
  }

  public static isPassedRoadworthinessTestForHgvTrl(
    vehicleType: string,
    testTypeId: string,
    testResult: string,
  ): boolean {
    return (
      ValidationUtil.isHgvOrTrl(vehicleType) &&
      ValidationUtil.isHGVTRLRoadworthinessTest(testTypeId) &&
      testResult === TestResults.PASS
    );
  }

  public static isAnnualTestTypeClassificationWithoutAbandonedResult(
    testTypeClassification: string,
    testResult: string,
  ): boolean {
    return (
      testTypeClassification ===
        enums.TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE &&
      testResult !== TestResults.ABANDONED
    );
  }

  public static isValidTestCodeForExpiryCalculation(
    testCode?: string,
  ): boolean {
    return (
      !!testCode &&
      enums.TEST_CODES_FOR_CALCULATING_EXPIRY.CODES.includes(
        testCode.toUpperCase(),
      )
    );
  }

  public static isNotAllowedVehicleTypeForExpiry(vehicleType: string) {
    return [
      enums.VEHICLE_TYPES.CAR,
      enums.VEHICLE_TYPES.LGV,
      enums.VEHICLE_TYPES.MOTORCYCLE,
    ].includes(vehicleType);
  }

  public static isAllowedTestTypeForExpiry(testType: TestTypeSchema) {
    const { testTypeClassification, testResult, testTypeId } = testType;
    return (
      testTypeClassification ===
        enums.TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE &&
      [TestResults.PASS, TestResults.PRS].includes(testResult as TestResults) &&
      !ValidationUtil.isHGVTRLRoadworthinessTest(testTypeId)
    );
  }

  public static isTestTypeLec(testType: any): boolean {
    return TestTypeHelper.validateTestTypeIdInList(
      LEC_TEST,
      testType.testTypeId,
    );
  }

  public static isTestTypeAdr(testType: TestTypeSchema): boolean {
    return TestTypeHelper.validateTestTypeIdInList(
      ADR_TEST,
      testType.testTypeId,
    );
  }

  // #endregion
  private static validateTestResultAttributes(payload: TestResultSchema) {
    // all other attributes except test types
    const validationErrors: string[] = [];
    let validationSchema = this.getValidationSchema(
      payload.vehicleType,
      payload.testStatus,
    );
    validationSchema = validationSchema!.keys({
      countryOfRegistration: string()
        .valid(...enums.COUNTRY_OF_REGISTRATION)
        .required()
        .allow('', null),
      testTypes: any().forbidden(),
    });
    validationSchema = validationSchema.fork(
      ['testEndTimestamp', 'systemNumber', 'vin'],
      (schema) => schema.optional(),
    );

    const validation: ValidationResult<any> | any | null =
      validationSchema?.validate(payload);

    if (validation !== null && validation.error) {
      validationErrors.push(...MappingUtil.mapErrorMessage(validation));
    }

    return validationErrors;
  }

  private static validateDates(
    fromDateTime: string | number | Date,
    toDateTime: string | number | Date,
  ) {
    return (
      fromDateTime !== undefined &&
      toDateTime !== undefined &&
      isDate(new Date(fromDateTime)) &&
      isDate(new Date(toDateTime)) &&
      isFinite(new Date(fromDateTime).getTime()) &&
      isFinite(new Date(toDateTime).getTime())
    );
  }

  private static validateLecTestTypeFields(
    payload: TestResultSchema,
  ): string[] {
    const missingFields: string[] = [];
    const { testTypes, testStatus } = payload;
    testTypes
      .filter((testType) => ValidationUtil.isTestTypeLec(testType))
      .filter(
        (testType) =>
          testType.testResult === TestResults.PASS &&
          testStatus === enums.TEST_STATUS.SUBMITTED,
      )
      .forEach((testType) => {
        const {
          testExpiryDate,
          certificateNumber,
          modType,
          emissionStandard,
          fuelType,
          smokeTestKLimitApplied,
        } = testType;
        if (!testExpiryDate) {
          missingFields.push(enums.ERRORS.NoLECExpiryDate);
        }
        if (!certificateNumber) {
          missingFields.push(enums.ERRORS.NoCertificateNumberOnLec);
        }
        if (!modType) {
          missingFields.push(enums.ERRORS.NoModificationType);
        }
        if (!emissionStandard) {
          missingFields.push(enums.ERRORS.NoEmissionStandard);
        }
        if (!fuelType) {
          missingFields.push(enums.ERRORS.NoFuelType);
        }
        if (!smokeTestKLimitApplied) {
          missingFields.push(enums.ERRORS.NoSmokeTestKLimitApplied);
        }
      });
    return missingFields;
  }

  private static isIvaTest(tests: TestTypeSchema[]): boolean {
    return tests.every((test: TestTypeSchema) =>
      TestTypeHelper.validateTestTypeIdInLists(
        [IVA_TEST, MSVA_TEST],
        test.testTypeId,
      ),
    );
  }

  private static validateMandatoryTestResultFields(
    payload: TestResultSchema,
  ): string[] {
    const missingMandatoryFields: string[] = [];
    const {
      testTypes,
      testStatus,
      countryOfRegistration,
      euVehicleCategory,
      vehicleType,
      odometerReading,
      odometerReadingUnits,
      typeOfTest,
    } = payload;
    if (
      testStatus !== enums.TEST_STATUS.SUBMITTED ||
      enums.TYPE_OF_TEST.DESK_BASED === typeOfTest ||
      testTypes.every(
        (testType: TestTypeSchema) =>
          testType.testResult === TestResults.ABANDONED,
      )
    ) {
      return missingMandatoryFields;
    }

    if (!countryOfRegistration) {
      missingMandatoryFields.push(enums.ERRORS.CountryOfRegistrationMandatory);
    }
    if (!euVehicleCategory) {
      missingMandatoryFields.push(enums.ERRORS.EuVehicleCategoryMandatory);
    }

    if (vehicleType === enums.VEHICLE_TYPES.TRL) {
      return missingMandatoryFields;
    }
    // odometerReading and odoMeterReadingUnits are not required for TRL
    if (
      !ValidationUtil.isIvaTest(testTypes) &&
      (odometerReading === undefined || odometerReading === null)
    ) {
      missingMandatoryFields.push(enums.ERRORS.OdometerReadingMandatory);
    }
    if (!ValidationUtil.isIvaTest(testTypes) && !odometerReadingUnits) {
      missingMandatoryFields.push(enums.ERRORS.OdometerReadingUnitsMandatory);
    }

    return missingMandatoryFields;
  }

  private static getValidationSchema(vehicleType: string, testStatus: string) {
    if (!(vehicleType && testStatus)) {
      return null;
    }
    const validator =
      vehicleType + testStatus.charAt(0).toUpperCase() + testStatus.slice(1);
    if (validator in validators) {
      return validators[validator as keyof typeof validators];
    }
    return null;
  }

  public static validateTestTypes(testResult: TestResultSchema) {
    const validationErrors: string[] = [];
    let validation: ValidationResult<any> | any;
    const invalidTestType = {
      error: {
        details: [{ message: 'Unknown testTypeId' }],
      },
    };
    const options = {
      abortEarly: false,
      context: { hasTestResult: false },
      stripUnknown: true,
    };
    validation = validators.testTypesArray.validate({
      testTypes: testResult.testTypes,
    });
    if (validation.error) {
      return MappingUtil.mapErrorMessage(validation);
    }
    for (const testType of testResult.testTypes) {
      options.context.hasTestResult = !!testType.testResult;
      const validator = this.getTestGroup(testType.testTypeId);
      validation = validator
        ? validator.validate(
            { ...testType, vehicleType: testResult.vehicleType },
            options,
          )
        : invalidTestType;
      if (validation.error) {
        validationErrors.push(...MappingUtil.mapErrorMessage(validation));
      }
    }
    return validationErrors;
  }

  private static getTestGroup(testTypeId: string) {
    // tslint:disable-next-line: forin
    for (const groupName in enums.TEST_TYPES) {
      if (
        enums.TEST_TYPES[groupName as keyof typeof enums.TEST_TYPES].includes(
          testTypeId,
        )
      ) {
        return validators[groupName as keyof typeof validators];
      }
    }
  }

  private static isMissingRequiredCertificateNumberOnAdr(
    payload: TestResultSchema,
  ): boolean {
    return ValidationUtil.isMissingRequiredCertificateNumber(
      ValidationUtil.isTestTypeAdr,
      payload,
    );
  }

  private static isMissingRequiredCertificateNumberOnTir(
    payload: TestResultSchema,
  ): boolean {
    return ValidationUtil.isMissingRequiredCertificateNumber(
      ValidationUtil.isTestTypeTir,
      payload,
    );
  }

  private static isMissingRequiredCertificateNumber(
    typeFunc: (testType: TestTypeSchema) => boolean,
    payload: TestResultSchema,
  ): boolean {
    const { testTypes, testStatus } = payload;
    return testTypes
      ? testTypes.some(
          (testType) =>
            typeFunc(testType) &&
            testType.testResult === TestResults.PASS &&
            !testType.certificateNumber &&
            testStatus === enums.TEST_STATUS.SUBMITTED,
        )
      : false;
  }

  private static isPassAdrTestTypeWithoutExpiryDate(
    payload: TestResultSchema,
  ): boolean {
    const { testTypes, testStatus } = payload;
    return testTypes
      ? testTypes.some(
          (testType) =>
            ValidationUtil.isTestTypeAdr(testType) &&
            testType.testResult === TestResults.PASS &&
            !testType.testExpiryDate &&
            testStatus === enums.TEST_STATUS.SUBMITTED,
        )
      : false;
  }

  private static isFailLecTestTypeWithoutCertificateNumber(
    payload: TestResultSchema,
  ): boolean {
    const { testTypes, testStatus } = payload;
    return testTypes
      ? testTypes.some(
          (testType) =>
            ValidationUtil.isTestTypeLec(testType) &&
            testType.testResult === TestResults.FAIL &&
            !testType.certificateNumber &&
            testStatus === enums.TEST_STATUS.SUBMITTED,
        )
      : false;
  }

  private static isHGVTRLRoadworthinessTest(testTypeId: string): boolean {
    return TestTypeHelper.validateTestTypeIdInList(
      HGV_TRL_RWT_TEST,
      testTypeId,
    );
  }

  private static isHgvOrTrl(vehicleType: string): boolean {
    return [enums.VEHICLE_TYPES.HGV, enums.VEHICLE_TYPES.TRL].includes(
      vehicleType,
    );
  }

  private static isTestTypeTir(testType: TestTypeSchema): boolean {
    return TestTypeHelper.validateTestTypeIdInList(
      TIR_TEST,
      testType.testTypeId,
    );
  }

  private static fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(
    payload: TestResultSchema,
  ) {
    // let bool = false;
    let missingFieldsString = '';
    const { testTypes } = payload;
    if (!testTypes) {
      return missingFieldsString;
    }
    testTypes.map((testType) => {
      if (!testType.defects) {
        return missingFieldsString;
      }
      testType.defects.forEach((defect) => {
        const {
          deficiencyCategory,
          deficiencyText,
          stdForProhibition,
          additionalInformation,
        } = defect;
        if (deficiencyCategory === 'advisory') {
          return missingFieldsString;
        }
        if (additionalInformation.location === null) {
          missingFieldsString += '/location';
        }
        if (deficiencyText === null) {
          missingFieldsString += '/deficiencyText';
        }
        if (stdForProhibition === null) {
          missingFieldsString += '/stdForProhibition';
        }
      });
    });

    return missingFieldsString
      ? missingFieldsString.concat(
          ' are null for a defect with deficiency category other than advisory',
        )
      : missingFieldsString;
  }

  public static reasonForAbandoningPresentOnAllAbandonedTests(
    payload: TestResultSchema,
  ) {
    const { testTypes } = payload;
    return !testTypes || !testTypes.length
      ? true
      : !testTypes.some(
          (testType) =>
            testType.testResult === TestResults.ABANDONED &&
            !testType.reasonForAbandoning,
        );
  }

  // TODO COMMENTED OUT UNTIL FEATURE TEAMS COMPLETE IVA DEFECT WORK
  public static ivaFailedHasRequiredFields(testTypes: TestTypeSchema[]) {
    const allFailWithoutDefects = testTypes.every(
      (test) =>
        test.testResult === 'fail' &&
        (test.requiredStandards?.length === 0 ||
          test.requiredStandards === undefined),
    );

    //   if (allFailWithoutDefects) {
    //     throw new models.HTTPError(400, 'Failed IVA tests must have IVA Defects');
    //   }
  }

  /**
   * Validates central docs for an array of test types
   * @param testTypes TestType[]
   * @throws HTTPError with status 400 if validation fails
   */
  public static validateCentralDocs(testTypes: TestTypeSchema[]): void {
    testTypes.forEach((testType) => {
      // if centralDocs is not present, then no object to validate immediately return true
      if (!testType.centralDocs) {
        return true;
      }

      // if centralDocs is present, does the test type id exist in the list of central docs test types
      const validTestTypeId = TestTypeHelper.validateTestTypeIdInList(
        CENTRAL_DOCS_TEST,
        testType.testTypeId,
      );

      // if the test type is not in the list of central docs test types, throw an error
      if (!validTestTypeId) {
        throw new models.HTTPError(
          400,
          `${enums.MESSAGES.CENTRAL_DOCS_NOT_AVAILABLE_FOR_TEST_TYPE} ${testType.testTypeId}`,
        );
      }
    });
  }
}
