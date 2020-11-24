import { isDate } from "lodash";
import * as enums from "../assets/Enums";
import * as models from "../models/";


export class ValidationUtil {

  public static getTestResultItems(data: models.ITestResultData) {
    if (!data || !data.Count) {
      throw new models.HTTPError(404, enums.ERRORS.NoResourceMatch);
    }
    return data.Items as models.ITestResult[];
  }

  public static validateGetTestResultFilters(filters: models.ITestResultFilters) {
    if (!(filters && ValidationUtil.validateDates(filters.fromDateTime, filters.toDateTime))) {
      console.log("ValidationUtil.validateGetTestResultFilters: Invalid Filter -> ", filters);
      return false;
    }
    return true;
  }

  private static validateDates(fromDateTime: string | number | Date, toDateTime: string | number | Date) {
    // TODO: Discuss date validation to add validation fromDate cannot be greater than toDate.
    return fromDateTime !== undefined && toDateTime !== undefined && isDate(new Date(fromDateTime)) && isDate(new Date(toDateTime)) && isFinite((new Date(fromDateTime)).getTime()) && isFinite((new Date(toDateTime)).getTime());
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
    let bool = false;
    if (payload.testTypes) {
      payload.testTypes.forEach((testType) => {
        if (
          typeFunc(testType) &&
          testType.testResult === enums.TEST_RESULT.PASS &&
          payload.testStatus === enums.TEST_STATUS.SUBMITTED &&
          !testType.certificateNumber
        ) {
          bool = true;
        }
      });
    }
    return bool;
  }

  public static isPassAdrTestTypeWithoutExpiryDate(
    payload: models.ITestResultPayload
  ): boolean {
    let bool = false;
    if (payload.testTypes) {
      payload.testTypes.forEach((testType) => {
        if (
          ValidationUtil.isTestTypeAdr(testType) &&
          testType.testResult === enums.TEST_RESULT.PASS &&
          payload.testStatus === enums.TEST_STATUS.SUBMITTED &&
          !testType.testExpiryDate
        ) {
          bool = true;
        }
      });
    }
    return bool;
  }

  public static validateLecTestTypeFields(
    payload: models.ITestResultPayload
  ): string[] {
    const missingFields: string[] = [];
    if (payload.testTypes) {
      payload.testTypes.forEach(
        (testType: {
          testTypeId: string;
          certificateNumber: string;
          expiryDate: Date;
          modType: any;
          emissionStandard: string;
          fuelType: string;
          testExpiryDate: any;
          testResult: string;
          smokeTestKLimitApplied: any;
        }) => {
          if (ValidationUtil.isTestTypeLec(testType)) {
            if (
              testType.testResult === enums.TEST_RESULT.PASS &&
              payload.testStatus === enums.TEST_STATUS.SUBMITTED
            ) {
              if (!testType.testExpiryDate) {
                missingFields.push(enums.ERRORS.NoLECExpiryDate);
              }
              if (!testType.modType) {
                missingFields.push(enums.ERRORS.NoModificationType);
              }
              if (!testType.emissionStandard) {
                missingFields.push(enums.ERRORS.NoEmissionStandard);
              }
              if (!testType.fuelType) {
                missingFields.push(enums.ERRORS.NoFuelType);
              }
              if (!testType.smokeTestKLimitApplied) {
                missingFields.push(enums.ERRORS.NoSmokeTestKLimitApplied);
              }
            }
          }
        }
      );
    }
    return missingFields;
  }

  public static validateMandatoryTestResultFields(
    payload: models.ITestResultPayload
  ): string[] {
    const missingMandatoryFields: string[] = [];
    if (
      payload.testTypes.some(
        (testType: models.TestType) =>
          testType.testResult !== enums.TEST_RESULT.ABANDONED
      ) &&
      payload.testStatus === enums.TEST_STATUS.SUBMITTED
    ) {
      if (!payload.countryOfRegistration) {
        missingMandatoryFields.push(
          enums.ERRORS.CountryOfRegistrationMandatory
        );
      }
      if (!payload.euVehicleCategory) {
        missingMandatoryFields.push(enums.ERRORS.EuVehicleCategoryMandatory);
      }

      if (
        payload.vehicleType === enums.VEHICLE_TYPES.HGV ||
        payload.vehicleType === enums.VEHICLE_TYPES.PSV
      ) {
        if (!payload.odometerReading) {
          missingMandatoryFields.push(enums.ERRORS.OdometerReadingMandatory);
        }
        if (!payload.odometerReadingUnits) {
          missingMandatoryFields.push(
            enums.ERRORS.OdometerReadingUnitsMandatory
          );
        }
      }
    }
    return missingMandatoryFields;
  }

  public static isHGVTRLRoadworthinessTest(testTypeId: string): boolean {
    return enums.HGV_TRL_ROADWORTHINESS_TEST_TYPES.IDS.includes(testTypeId);
  }
  private static isHgvOrTrl(vehicleType: string): boolean {
    return (
      vehicleType === enums.VEHICLE_TYPES.HGV ||
      vehicleType === enums.VEHICLE_TYPES.TRL
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
      testResult === enums.TEST_RESULT.PASS
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
    return !!testCode && enums.TEST_CODES_FOR_CALCULATING_EXPIRY.CODES.includes(testCode.toUpperCase());
  }

  public static isNotAllowedVehicleTypeForExpiry(vehicleType: string) {
    return vehicleType === enums.VEHICLE_TYPES.CAR ||
           vehicleType === enums.VEHICLE_TYPES.LGV ||
           vehicleType === enums.VEHICLE_TYPES.MOTORCYCLE;
  }

  public static isAllowedTestTypeForExpiry(testType: models.TestType) {
   return testType.testTypeClassification === enums.TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE &&
      (testType.testResult === enums.TEST_RESULT.PASS || testType.testResult === enums.TEST_RESULT.PRS) &&
      !ValidationUtil.isHGVTRLRoadworthinessTest(testType.testTypeId);
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

  public static fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(payload: models.ITestResultPayload) {
    const missingFields: string[] = [];
    let bool = false;
    if (payload.testTypes) {
      payload.testTypes.forEach((testType: { defects: { forEach: (arg0: (defect: any) => void) => void; }; }) => {
        if (testType.defects) {
          testType.defects.forEach((defect) => {
            if (defect.deficiencyCategory !== "advisory") {
              if (defect.additionalInformation.location === null) {
                missingFields.push("location");
                bool = true;
              }
              if (defect.deficiencyText === null) {
                missingFields.push("deficiencyText");
                bool = true;
              }
              if (defect.stdForProhibition === null) {
                missingFields.push("stdForProhibition");
                bool = true;
              }
            }
          });
        }
      });
    }
    let missingFieldsString = "";
    missingFields.forEach((missingField) => {
      missingFieldsString = missingFieldsString + "/" + missingField;
    });
    return { result: bool, missingFields: missingFieldsString };
  }
}
