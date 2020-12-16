import { ValidationResult, validate } from "joi";
import { filter, isDate } from "lodash";
import { MappingUtil } from "./mappingUtil";
import * as validators from "../models/validators";
import * as enums from "../assets/Enums";
import * as models from "../models/";

export class ValidationUtil {
  public static getTestResultItems(data: models.ITestResultData) {
    if (!data || !data.Count) {
      throw new models.HTTPError(404, enums.ERRORS.NoResourceMatch);
    }
    return data.Items as models.ITestResult[];
  }

  public static validateGetTestResultFilters(
    filters: models.ITestResultFilters
  ) {
    const result = (
      filters &&
      ValidationUtil.validateDates(filters.fromDateTime, filters.toDateTime)
    );
    if (!result) {
      console.log(
        "ValidationUtil.validateGetTestResultFilters: Invalid Filter -> ",
        filters
      );
    }
    return result;
  }

  private static validateDates(
    fromDateTime: string | number | Date,
    toDateTime: string | number | Date
  ) {
    // TODO: Discuss date validation to add validation fromDate cannot be greater than toDate.
    return (
      fromDateTime !== undefined &&
      toDateTime !== undefined &&
      isDate(new Date(fromDateTime)) &&
      isDate(new Date(toDateTime)) &&
      isFinite(new Date(fromDateTime).getTime()) &&
      isFinite(new Date(toDateTime).getTime())
    );
  }

  public static isMissingRequiredCertificateNumberOnAdr(
    payload: models.ITestResultPayload
  ): boolean {
    return ValidationUtil.isMissingRequiredCertificateNumber(
      ValidationUtil.isTestTypeAdr,
      payload
    );
  }

  public static isMissingRequiredCertificateNumberOnTir(
    payload: models.ITestResultPayload
  ): boolean {
    return ValidationUtil.isMissingRequiredCertificateNumber(
      ValidationUtil.isTestTypeTir,
      payload
    );
  }

  public static isMissingRequiredCertificateNumber(
    typeFunc: (testType: models.TestType) => boolean,
    payload: models.ITestResultPayload
  ): boolean {
    const { testTypes, testStatus } = payload;
    return testTypes
      ? testTypes.some(
          (testType) =>
            typeFunc(testType) &&
            testType.testResult === enums.TEST_RESULT.PASS &&
            !testType.certificateNumber &&
            testStatus === enums.TEST_STATUS.SUBMITTED
        )
      : false;
  }

  public static isPassAdrTestTypeWithoutExpiryDate(
    payload: models.ITestResultPayload
  ): boolean {
    const { testTypes, testStatus } = payload;
    return testTypes
      ? testTypes.some(
          (testType) =>
            ValidationUtil.isTestTypeAdr(testType) &&
            testType.testResult === enums.TEST_RESULT.PASS &&
            !testType.testExpiryDate &&
            testStatus === enums.TEST_STATUS.SUBMITTED
        )
      : false;
  }

  public static validateLecTestTypeFields(
    payload: models.ITestResultPayload
  ): string[] {
    const missingFields: string[] = [];
    const { testTypes, testStatus } = payload;
    testTypes
      .filter((testType) => ValidationUtil.isTestTypeLec(testType))
      .filter(
        (testType) =>
          testType.testResult === enums.TEST_RESULT.PASS &&
          testStatus === enums.TEST_STATUS.SUBMITTED
      )
      .forEach((testType) => {
        const {
          testExpiryDate,
          modType,
          emissionStandard,
          fuelType,
          smokeTestKLimitApplied,
        } = testType;
        if (!testExpiryDate) {
          missingFields.push(enums.ERRORS.NoLECExpiryDate);
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

  public static validateMandatoryTestResultFields(
    payload: models.ITestResultPayload
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
    } = payload;
    if (
      testTypes.every(
        (testType: models.TestType) =>
          testType.testResult === enums.TEST_RESULT.ABANDONED
      ) ||
      testStatus !== enums.TEST_STATUS.SUBMITTED
    ) {
      return missingMandatoryFields;
    }

    if (!countryOfRegistration) {
      missingMandatoryFields.push(enums.ERRORS.CountryOfRegistrationMandatory);
    }
    if (!euVehicleCategory) {
      missingMandatoryFields.push(enums.ERRORS.EuVehicleCategoryMandatory);
    }

    if (
      ![enums.VEHICLE_TYPES.HGV, enums.VEHICLE_TYPES.PSV].includes(vehicleType)
    ) {
      return missingMandatoryFields;
    }
    // odometerReading and odoMeterReadingUnits are required only for HGV and PSV
    if (!odometerReading) {
      missingMandatoryFields.push(enums.ERRORS.OdometerReadingMandatory);
    }
    if (!odometerReadingUnits) {
      missingMandatoryFields.push(enums.ERRORS.OdometerReadingUnitsMandatory);
    }
    return missingMandatoryFields;
  }

  public static isHGVTRLRoadworthinessTest(testTypeId: string): boolean {
    return enums.HGV_TRL_ROADWORTHINESS_TEST_TYPES.IDS.includes(testTypeId);
  }
  public static isHgvOrTrl(vehicleType: string): boolean {
    return [enums.VEHICLE_TYPES.HGV, enums.VEHICLE_TYPES.TRL].includes(
      vehicleType
    );
  }

  public static isPassedRoadworthinessTestForHgvTrl(
    vehicleType: string,
    testTypeId: string,
    testResult: string
  ): boolean {
    return (
      ValidationUtil.isHgvOrTrl(vehicleType) &&
      ValidationUtil.isHGVTRLRoadworthinessTest(testTypeId) &&
      testResult !== enums.TEST_RESULT.FAIL
    );
  }

  public static isAnnualTestTypeClassificationWithoutAbandonedResult(
    testTypeClassification: string,
    testResult: string
  ): boolean {
    return (
      testTypeClassification ===
        enums.TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE &&
      testResult !== enums.TEST_RESULT.ABANDONED
    );
  }
  public static isValidTestCodeForExpiryCalculation(
    testCode?: string
  ): boolean {
    return (
      !!testCode &&
      enums.TEST_CODES_FOR_CALCULATING_EXPIRY.CODES.includes(
        testCode.toUpperCase()
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

  public static isTestTypeTir(testType: models.TestType): boolean {
    return enums.TIR_TEST_TYPES.IDS.includes(testType.testTypeId);
  }

  public static fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(
    payload: models.ITestResultPayload
  ) {
    // let bool = false;
    let missingFieldsString = "";
    const { testTypes } = payload;
    if (!testTypes) {
      return missingFieldsString;
    }
    (testTypes as models.TestType[]).map((testType) => {
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
        if (deficiencyCategory === "advisory") {
          return missingFieldsString;
        }
        if (additionalInformation.location === null) {
          missingFieldsString = missingFieldsString + "/location";
        }
        if (deficiencyText === null) {
          missingFieldsString = missingFieldsString + "/deficiencyText";
        }
        if (stdForProhibition === null) {
          missingFieldsString = missingFieldsString + "/stdForProhibition";
        }

      });
    });

    return missingFieldsString ? missingFieldsString.concat(
      " are null for a defect with deficiency category other than advisory"
    ) : missingFieldsString;
  }

  public static reasonForAbandoningPresentOnAllAbandonedTests(
    payload: models.ITestResultPayload
  ) {
    const { testTypes } = payload;
    return !testTypes || !testTypes.length
      ? true
      : !(testTypes as models.TestType[]).some(
          (testType) =>
            testType.testResult === enums.TEST_RESULT.ABANDONED &&
            !testType.reasonForAbandoning
        );
  }

  public static getValidationSchema(vehicleType: string, testStatus: string) {
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

  public static validateInsertTestResultPayload(
    payload: models.ITestResultPayload
  ) {
     if (Object.keys(payload).length === 0) {
       throw new models.HTTPError(400, enums.ERRORS.PayloadCannotBeEmpty);
     }
     const validationSchema = ValidationUtil.getValidationSchema(
      payload.vehicleType,
      payload.testStatus
    );
     const validation: ValidationResult<any> | any | null = validationSchema ? validate(
      payload,
      validationSchema
    ) : null;

     if (
      !ValidationUtil.reasonForAbandoningPresentOnAllAbandonedTests(payload)
    ) {
      throw new models.HTTPError(
        400,
        enums.MESSAGES.REASON_FOR_ABANDONING_NOT_PRESENT
      );
    }

     const fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory = ValidationUtil.fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(
      payload
    );
     if (fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory) {
      throw new models.HTTPError(
        400,
        fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory
      );
    }
     const missingFieldsForLecTestType: string[] = ValidationUtil.validateLecTestTypeFields(
      payload
    );
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

     const missingMandatoryTestResultFields: string[] = ValidationUtil.validateMandatoryTestResultFields(
      payload
    );
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
  }

  public static validateTestTypes(testResult: models.ITestResult) {
    let validationErrors;
    let validation: ValidationResult<any> | any;
    validation = validators.testTypesArray.validate({
      testTypes: testResult.testTypes,
    });
    if (validation.error) {
      validationErrors = MappingUtil.mapErrorMessage(validation);
      return validationErrors;
    }
    for (const testType of testResult.testTypes) {
      const options = {
        abortEarly: false,
        context: { hasTestResult: testType.testResult },
      };
      if (enums.TEST_TYPES_GROUP1.includes(testType.testTypeId)) {
        // tests for PSV - Annual test, Class 6A seatbelt installation check, Paid/Part paid annual test retest, Prohibition clearance
        validation = validators.testTypesGroup1.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP2.includes(testType.testTypeId)) {
        // tests for PSV - Paid/Part paid prohibition clearance(full/partial/retest without cert)
        validation = validators.testTypesGroup2.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP3_4_8.includes(testType.testTypeId)) {
        // Notifiable alteration and voluntary tests for HGV, PSV and TRL
        validation = validators.testTypesGroup5And13.validate(
          testType,
          options
        );
      } else if (enums.TEST_TYPES_GROUP5_13.includes(testType.testTypeId)) {
        // TIR tests for TRL and HGV
        validation = validators.testTypesGroup5And13.validate(
          testType,
          options
        );
      } else if (enums.TEST_TYPES_GROUP6_11.includes(testType.testTypeId)) {
        // HGV and TRL - Paid/Part paid roadworthiness retest, Voluntary roadworthiness test
        validation = validators.testTypesGroup6And11.validate(
          testType,
          options
        );
      } else if (enums.TEST_TYPES_GROUP7.includes(testType.testTypeId)) {
        // ADR tests for HGV and TRL
        validation = validators.testTypesGroup7.validate(testType, options);
      } else if (enums.TEST_TYPES_GROUP9_10.includes(testType.testTypeId)) {
        // tests for HGV and TRL - Annual tests, First tests, Annual retests, Paid/Part paid prohibition clearance
        validation = validators.testTypesGroup9And10.validate(
          testType,
          options
        );
      } else if (enums.TEST_TYPES_GROUP12_14.includes(testType.testTypeId)) {
        // tests for TRL - Paid/Part paid prohibition clearance(retest, full inspection, part inspection, without cert)
        validation = validators.testTypesGroup12And14.validate(
          testType,
          options
        );
      } else if (enums.TEST_TYPES_GROUP15_16.includes(testType.testTypeId)) {
        // LEC tests for HGV and PSV
        validation = validators.testTypesGroup15And16.validate(
          testType,
          options
        );
      } else if (
        enums.TEST_TYPES_GROUP1_SPEC_TEST.includes(testType.testTypeId)
      ) {
        // Test/Retest - Free/Paid - IVA inspection, MSVA inspection
        validation = validators.testTypesSpecialistGroup1.validate(
          testType,
          options
        );
      } else if (
        enums.TEST_TYPES_GROUP2_SPEC_TEST.includes(testType.testTypeId)
      ) {
        // Test/Retest COIF with annual test, Seatbelt installation check COIF with annual test
        validation = validators.testTypesSpecialistGroup2.validate(
          testType,
          options
        );
      } else if (
        enums.TEST_TYPES_GROUP3_SPEC_TEST.includes(testType.testTypeId)
      ) {
        // Test/Retest COIF without annual test, Type approved to bus directive COIF, Annex 7 COIF, TILT COIF retest
        validation = validators.testTypesSpecialistGroup3.validate(
          testType,
          options
        );
      } else if (
        enums.TEST_TYPES_GROUP4_SPEC_TEST.includes(testType.testTypeId)
      ) {
        // Test Seatbelt installation check COIF without annual test
        validation = validators.testTypesSpecialistGroup4.validate(
          testType,
          options
        );
      } else if (
        enums.TEST_TYPES_GROUP5_SPEC_TEST.includes(testType.testTypeId)
      ) {
        // Test/Retest Normal/Basic voluntary IVA inspection
        validation = validators.testTypesSpecialistGroup5.validate(
          testType,
          options
        );
      } else {
        validation = {
          error: {
            details: [{ message: "Unknown testTypeId" }],
          },
        };
      }
      if (validation.error) {
        validationErrors = MappingUtil.mapErrorMessage(validation);
        break;
      }
    }
    return validationErrors;
  }
}
