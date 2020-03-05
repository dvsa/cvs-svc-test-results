export enum ERRORS {
    NotifyConfigNotDefined = "The Notify config is not defined in the config file.",
    DynamoDBConfigNotDefined = "DynamoDB config is not defined in the config file.",
    LambdaInvokeConfigNotDefined = "Lambda Invoke config is not defined in the config file.",
    EventIsEmpty = "Event is empty",
    NoBranch = "Please define BRANCH environment variable",
    NoResourceMatch = "No resources match the search criteria",
    MissingFieldsOnLEC = "Mandatory fields missing on LEC test type",
    WrongVehicleTypeOnLEC = "Wrong vehicle type for conducting a LEC test",
    NoCertificateNumberOnAdr = "Certificate number not present on ADR test type",
    NoCertificateNumberOnTir = "Certificate number not present on TIR test type",
    NoExpiryDate = "Expiry date not present on ADR test type",
    IncorrectTestStatus = '"testStatus" should be one of ["submitted", "cancelled"]',
    NoDeficiencyCategory = "/location/deficiencyText/stdForProhibition are null for a defect with deficiency category other than advisory",
    PayloadCannotBeEmpty = "Payload cannot be empty",
    FuelTypeInvalid = "\"fuelType\" must be one of [diesel, gas-cng, gas-lng, gas-lpg, petrol, fuel cell, full electric, null]",
    ModTypeDescriptionInvalid = "\"description\" must be one of [particulate trap, modification or change of engine, gas engine]",
    EmissionStandardInvalid= "\"emissionStandard\" must be one of [0.10 g/kWh Euro 3 PM, 0.03 g/kWh Euro IV PM, Euro 3, Euro 4, Euro 6, Euro VI, Full Electric, null]",
    ModTypeCodeInvalid = "\"code\" must be one of [p, m, g]",
    NoLECExpiryDate = "Expiry Date not present on LEC test type",
    NoModificationType = "Modification type not present on LEC test type",
    NoEmissionStandard = "Emission standard not present on LEC test type",
    NoFuelType = "Fuel Type not present on LEC test type",
    NoSmokeTestKLimitApplied = "Smoke Test K Limit Applied not present on LEC test type",
    CountryOfRegistrationMandatory = "\"countryOfRegistration\" is mandatory",
    EuVehicleCategoryMandatory = "\"euVehicleCategory\" is mandatory",
    OdometerReadingMandatory = "\"odometerReading\" is mandatory",
    OdometerReadingUnitsMandatory = "\"odometerReadingUnits\" is mandatory"
}

export enum HTTPRESPONSE {
    AWS_EVENT_EMPTY = "AWS event is empty. Check your test event.",
    NOT_VALID_JSON = "Body is not a valid JSON.",
}

export enum HTTPMethods {
    GET = "GET",
      POST = "POST",
      PUT = "PUT",
      DELETE = "DELETE"
}

export enum MESSAGES {
    INVALID_JSON = "Body is not a valid JSON.",
    INTERNAL_SERVER_ERROR = "Internal Server Error",
    RECORD_CREATED = "Test records created",
    BAD_REQUEST = "Bad request",
    ID_ALREADY_EXISTS = "Test Result id already exists",
    CONDITIONAL_REQUEST_FAILED = "The conditional request failed",
    REASON_FOR_ABANDONING_NOT_PRESENT = "Reason for Abandoning not present on all abandoned tests"
}

export const VEHICLE_TYPES = {
    PSV: "psv",
    HGV: "hgv",
    TRL: "trl"
};

export const TEST_TYPE_CLASSIFICATION = {
    ANNUAL_WITH_CERTIFICATE: "Annual With Certificate"
};

export const TEST_RESULT = {
    PASS: "pass",
    FAIL: "fail",
    ABANDONED: "abandoned",
    PRS: "prs"
};

export const TEST_STATUS = {
    SUBMITTED: "submitted",
    CANCELLED: "cancelled"
};

export const HGV_TRL_ROADWORTHINESS_TEST_TYPES = {
    IDS: ["122", "91", "101", "62", "63"]
};

export const COIF_EXPIRY_TEST_TYPES = {
    IDS: ["142", "146", "175", "177"]
};

export const TEST_CODES_FOR_CALCULATING_EXPIRY = {
   CODES: [
        "AAT1", "AAT2", "AAT3", "AAT4", "AAT5",
        "FFT1", "FFT2", "FFT3", "FFT4", "FFT5",
        "RPT1", "RPT2", "RPT3", "RPT4", "RPT5",
        "RST1", "RST2", "RST3", "RST4", "RST5",
        "RGT1", "RGT2", "RGT3", "RGT4", "RGT5",
        "RIT1", "RIT2", "RIT3", "RIT4", "RIT5",
        "RHT",
        "P1T1", "P1T2", "P1T3", "P1T4", "P1T5",
        "P3T1", "P3T2", "P3T4", "P3T5",
        "P6T1", "P6T2", "P6T3", "P6T4", "P6T5",
        "P7T1", "P7T2", "P7T3", "P7T4", "P7T5",
        "P4T1", "P4T2", "P4T3", "P4T4", "P4T5",
        "AAV2", "AAV3", "AAV4", "AAV5",
        "FFV2", "FFV3", "FFV4", "FFV5",
        "RPV2", "RPV3", "RPV4", "RPV5",
        "RSV2", "RSV3", "RSV4", "RSV5",
        "RGV2", "RGV3", "RGV4", "RGV5",
        "RIV2", "RIV3", "RIV4", "RIV5",
        "P1V2", "P1V3", "P1V4", "P1V5",
        "P3V2", "P3V3", "P3V4", "P3V5",
        "P6V2", "P6V3", "P6V4", "P6V5",
        "P4V2", "P4V3", "P4V4", "P4V5",
        "P7V2", "P7V3", "P7V4", "P7V5",
        "AAL", "AAS", "ADL",
        "WDL", "WDS", "WBL", "WBS",
        "RHL", "RPL", "RPS",
        "WHL", "WHS",
        "RGL", "RSL", "RSS",
        "P1L", "P1S",
        "P8L", "P8S",
        "P6L", "P6S",
        "WIS", "WIL",
        "WFL", "WFS",
        "WEL", "WES",
        "CEL", "CES",
        "CHL", "CHS",
        "CKL", "CKS",
        "CML", "CMS"],
    COIF_CODES: [
        "CEL", "CES",
        "CHL", "CHS",
        "CKL", "CKS",
        "CML", "CMS"]
};
