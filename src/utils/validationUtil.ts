import { ValidationResult, any, string, validate } from 'joi';
import { isDate } from 'lodash';
import * as enums from '../assets/Enums';
import * as models from '../models';
import * as validators from '../models/validators';
import { MappingUtil } from './mappingUtil';
import { TestType } from '../models';

export class ValidationUtil {
  // #region [rgba(52, 152, 219, 0.15)]  Public Functions
  public static getTestResultItems(data?: models.ITestResultData) {
    if (!data || !data.Count) {
      throw new models.HTTPError(404, enums.ERRORS.NoResourceMatch);
    }
    return data.Items as models.ITestResult[];
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

  public static validateInsertTestResultPayload(
    payload: models.ITestResultPayload,
  ) {
    if (!Object.keys(payload).length) {
      throw new models.HTTPError(400, enums.ERRORS.PayloadCannotBeEmpty);
    }
    const validationSchema = ValidationUtil.getValidationSchema(
      payload.vehicleType,
      payload.testStatus,
    );

    if (this.isIvaTest(payload.testTypes)) {
      this.ivaFailedHasRequiredFields(payload.testTypes);
    }

    const validation: ValidationResult<any> | any | null = validationSchema
      ? validate(payload, validationSchema)
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

  public static validateUpdateTestResult(payload: models.ITestResult) {
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
      testResult === enums.TEST_RESULT.PASS
    );
  }

  public static isAnnualTestTypeClassificationWithoutAbandonedResult(
    testTypeClassification: string,
    testResult: string,
  ): boolean {
    return (
      testTypeClassification ===
        enums.TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE &&
      testResult !== enums.TEST_RESULT.ABANDONED
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

  public static isAllowedTestTypeForExpiry(testType: models.TestType) {
    const { testTypeClassification, testResult, testTypeId } = testType;
    return (
      testTypeClassification ===
        enums.TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE &&
      [enums.TEST_RESULT.PASS, enums.TEST_RESULT.PRS].includes(testResult) &&
      !ValidationUtil.isHGVTRLRoadworthinessTest(testTypeId)
    );
  }

  public static isTestTypeLec(testType: any): boolean {
    return enums.LEC_TEST_TYPES.IDS.includes(testType.testTypeId);
  }

  public static isTestTypeAdr(testType: models.TestType): boolean {
    return enums.ADR_TEST_TYPES.IDS.includes(testType.testTypeId);
  }

  // #endregion
  private static validateTestResultAttributes(payload: models.ITestResult) {
    // all other attributes except test types
    const validationErrors: string[] = [];
    let validationSchema = this.getValidationSchema(
      payload.vehicleType,
      payload.testStatus,
    );
    validationSchema = validationSchema!.keys({
      countryOfRegistration: string()
        .valid(enums.COUNTRY_OF_REGISTRATION)
        .required()
        .allow('', null),
      testTypes: any().forbidden(),
    });
    validationSchema = validationSchema.optionalKeys([
      'testEndTimestamp',
      'systemNumber',
      'vin',
    ]);
    const validation: ValidationResult<any> | any | null = validate(
      payload,
      validationSchema,
    );

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
    payload: models.ITestResultPayload,
  ): string[] {
    const missingFields: string[] = [];
    const { testTypes, testStatus } = payload;
    testTypes
      .filter((testType) => ValidationUtil.isTestTypeLec(testType))
      .filter(
        (testType) =>
          testType.testResult === enums.TEST_RESULT.PASS &&
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

  private static isIvaTest(tests: models.TestType[]): boolean {
    const ivaTests = [
      '125',
      '126',
      '128',
      '129',
      '130',
      '133',
      '134',
      '135',
      '136',
      '138',
      '139',
      '140',
      '153',
      '154',
      '158',
      '159',
      '162',
      '163',
      '166',
      '167',
      '169',
      '170',
      '172',
      '173',
      '184',
      '185',
      '186',
      '187',
      '188',
      '189',
      '190',
      '191',
      '192',
      '193',
      '194',
      '195',
      '196',
      '197',
    ];
    return tests.every((test: models.TestType) =>
      ivaTests.includes(test.testTypeId),
    );
  }

  private static validateMandatoryTestResultFields(
    payload: models.ITestResultPayload,
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
        (testType: models.TestType) =>
          testType.testResult === enums.TEST_RESULT.ABANDONED,
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

  public static validateTestTypes(testResult: models.ITestResult) {
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
    payload: models.ITestResultPayload,
  ): boolean {
    return ValidationUtil.isMissingRequiredCertificateNumber(
      ValidationUtil.isTestTypeAdr,
      payload,
    );
  }

  private static isMissingRequiredCertificateNumberOnTir(
    payload: models.ITestResultPayload,
  ): boolean {
    return ValidationUtil.isMissingRequiredCertificateNumber(
      ValidationUtil.isTestTypeTir,
      payload,
    );
  }

  private static isMissingRequiredCertificateNumber(
    typeFunc: (testType: models.TestType) => boolean,
    payload: models.ITestResultPayload,
  ): boolean {
    const { testTypes, testStatus } = payload;
    return testTypes
      ? testTypes.some(
          (testType) =>
            typeFunc(testType) &&
            testType.testResult === enums.TEST_RESULT.PASS &&
            !testType.certificateNumber &&
            testStatus === enums.TEST_STATUS.SUBMITTED,
        )
      : false;
  }

  private static isPassAdrTestTypeWithoutExpiryDate(
    payload: models.ITestResultPayload,
  ): boolean {
    const { testTypes, testStatus } = payload;
    return testTypes
      ? testTypes.some(
          (testType) =>
            ValidationUtil.isTestTypeAdr(testType) &&
            testType.testResult === enums.TEST_RESULT.PASS &&
            !testType.testExpiryDate &&
            testStatus === enums.TEST_STATUS.SUBMITTED,
        )
      : false;
  }

  private static isFailLecTestTypeWithoutCertificateNumber(
    payload: models.ITestResultPayload,
  ): boolean {
    const { testTypes, testStatus } = payload;
    return testTypes
      ? testTypes.some(
          (testType) =>
            ValidationUtil.isTestTypeLec(testType) &&
            testType.testResult === enums.TEST_RESULT.FAIL &&
            !testType.certificateNumber &&
            testStatus === enums.TEST_STATUS.SUBMITTED,
        )
      : false;
  }

  private static isHGVTRLRoadworthinessTest(testTypeId: string): boolean {
    return enums.HGV_TRL_ROADWORTHINESS_TEST_TYPES.IDS.includes(testTypeId);
  }

  private static isHgvOrTrl(vehicleType: string): boolean {
    return [enums.VEHICLE_TYPES.HGV, enums.VEHICLE_TYPES.TRL].includes(
      vehicleType,
    );
  }

  private static isTestTypeTir(testType: models.TestType): boolean {
    return enums.TIR_TEST_TYPES.IDS.includes(testType.testTypeId);
  }

  private static fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(
    payload: models.ITestResultPayload,
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
    payload: models.ITestResultPayload,
  ) {
    const { testTypes } = payload;
    return !testTypes || !testTypes.length
      ? true
      : !testTypes.some(
          (testType) =>
            testType.testResult === enums.TEST_RESULT.ABANDONED &&
            !testType.reasonForAbandoning,
        );
  }

  public static ivaFailedHasRequiredFields(testTypes: TestType[]) {
    const allFailWithoutDefects = testTypes.every(
      (test) =>
        test.testResult === 'fail' &&
        (test.ivaDefects?.length === 0 || test.ivaDefects === undefined),
    );

    if (allFailWithoutDefects) {
      throw new models.HTTPError(
        400,
        'Failed IVA tests must have IVA Defects',
      );
    }
  }
}
