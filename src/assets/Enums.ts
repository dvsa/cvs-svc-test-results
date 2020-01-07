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
    FuelTypeInvalid = "\"fuelType\" must be one of [diesel, gas, petrol, null]",
    ModTypeDescriptionInvalid = "\"description\" must be one of [particulate trap, modification or change of engine, gas engine]",
    EmissionStandardInvalid= "\"emissionStandard\" must be one of [0.16 g/kWh Euro 3 PM, 0.08 g/kWh Euro 3 PM, 0.03 g/kWh Euro 4 PM, null]",
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
