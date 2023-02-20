export enum ERRORS {
  NotifyConfigNotDefined = 'The Notify config is not defined in the config file.',
  DynamoDBConfigNotDefined = 'DynamoDB config is not defined in the config file.',
  LambdaInvokeConfigNotDefined = 'Lambda Invoke config is not defined in the config file.',
  EventIsEmpty = 'Event is empty',
  NoBranch = 'Please define BRANCH environment variable',
  NoResourceMatch = 'No resources match the search criteria',
  MissingFieldsOnLEC = 'Mandatory fields missing on LEC test type',
  WrongVehicleTypeOnLEC = 'Wrong vehicle type for conducting a LEC test',
  NoCertificateNumberOnAdr = 'Certificate number not present on ADR test type',
  NoCertificateNumberOnTir = 'Certificate number not present on TIR test type',
  NoCertificateNumberOnLec = 'Certificate number not present on LEC test type',
  NoExpiryDate = 'Expiry date not present on ADR test type',
  IncorrectTestStatus = '"testStatus" should be one of ["submitted", "cancelled"]',
  PayloadCannotBeEmpty = 'Payload cannot be empty',
  NoLECExpiryDate = 'Expiry Date not present on LEC test type',
  NoModificationType = 'Modification type not present on LEC test type',
  NoEmissionStandard = 'Emission standard not present on LEC test type',
  NoFuelType = 'Fuel Type not present on LEC test type',
  NoSmokeTestKLimitApplied = 'Smoke Test K Limit Applied not present on LEC test type',
  CountryOfRegistrationMandatory = '"countryOfRegistration" is mandatory',
  EuVehicleCategoryMandatory = '"euVehicleCategory" is mandatory',
  NoUniqueActivityFound = 'More than one activity found',
  StartTimeBeforeEndTime = 'testTypeStartTimestamp must be before testTypeEndTimestamp',
  OdometerReadingMandatory = '"odometerReading" is mandatory',
  OdometerReadingUnitsMandatory = '"odometerReadingUnits" is mandatory',
  ExpiryConfigMissing = 'Invalid Expiry config!',
  MethodNotImplemented = 'Method not implemented.',
}

export enum TESTING_ERRORS {
  NoDeficiencyCategory = '/location/deficiencyText/stdForProhibition are null for a defect with deficiency category other than advisory',
  FuelTypeInvalid = '"fuelType" must be one of [diesel, gas-cng, gas-lng, gas-lpg, petrol, fuel cell, full electric, null]',
  ModTypeDescriptionInvalid = '"description" must be one of [particulate trap, modification or change of engine, gas engine]',
  EmissionStandardInvalid = '"emissionStandard" must be one of [0.10 g/kWh Euro 3 PM, 0.03 g/kWh Euro IV PM, Euro 3, Euro 4, Euro 6, Euro VI, Full Electric, null]',
  ModTypeCodeInvalid = '"code" must be one of [p, m, g]',
  VehicleSubclassIsNotAllowed = '"vehicleSubclass" is not allowed',
  VehicleSubclassIsRequired = '"vehicleSubclass" is required',
  EuVehicleCategoryMustBeOneOf = '"euVehicleCategory" must be one of [m1, null]',
  VehicleClassIsRequired = '"vehicleClass" is required',
  VehicleClassCodeIsInvalid = '"code" must be one of [1, 2, 3, n, s, t, l, v, 4, 5, 7, p, u]',
  VehicleClassInvalid = '"vehicleClass" must be an object',
}

export enum HTTPRESPONSE {
  AWS_EVENT_EMPTY = 'AWS event is empty. Check your test event.',
  NOT_VALID_JSON = 'Body is not a valid JSON.',
  MISSING_PARAMETERS = 'Missing parameter value.',
}

export enum HTTPMethods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export enum MESSAGES {
  INVALID_JSON = 'Body is not a valid JSON.',
  INTERNAL_SERVER_ERROR = 'Internal Server Error',
  RECORD_CREATED = 'Test records created',
  BAD_REQUEST = 'Bad request',
  ID_ALREADY_EXISTS = 'Test Result id already exists',
  CONDITIONAL_REQUEST_FAILED = 'The conditional request failed',
  REASON_FOR_ABANDONING_NOT_PRESENT = 'Reason for Abandoning not present on all abandoned tests',
}

export enum VEHICLE_TYPE {
  PSV = 'psv',
  HGV = 'hgv',
  TRL = 'trl',
}

export enum EXPIRY_STRATEGY {
  PSV_DEFAULT = 'PsvDefaultExpiryStrategy',
  PSV_MOST_RECENT = 'PsvMostRecentExpiryStrategy',
  PSV_REGN_ANNIVERSARY = 'PsvRegistrationAnniversaryStrategy',
  HGV_TRL_FIRST_TEST = 'HgvTrlFirstTestStrategy',
  HGV_TRL_ANNUAL_TEST = 'HgvTrlAnnualTestStrategy',
  HGV_TRL_MOST_RECENT = 'HgvTrlMostRecentExpiryStrategy',
}

export const VEHICLE_TYPES = {
  PSV: 'psv',
  HGV: 'hgv',
  TRL: 'trl',
  LGV: 'lgv',
  CAR: 'car',
  SMALL_TRL: 'small trl',
  MOTORCYCLE: 'motorcycle',
};

export const TEST_TYPE_CLASSIFICATION = {
  ANNUAL_WITH_CERTIFICATE: 'Annual With Certificate',
};

export const TEST_RESULT = {
  PASS: 'pass',
  FAIL: 'fail',
  ABANDONED: 'abandoned',
  PRS: 'prs',
};

export const TEST_STATUS = {
  SUBMITTED: 'submitted',
  CANCELLED: 'cancelled',
};

export const TEST_VERSION = {
  CURRENT: 'current',
  ARCHIVED: 'archived',
  ALL: 'all',
};

export const REASON_FOR_CREATION = {
  TEST_CONDUCTED: 'Test conducted',
};

export const TYPE_OF_TEST = {
  CONTINGENCY: 'contingency',
  DESK_BASED: 'desk-based',
  COMPLETION: 'completion',
};

export const HGV_TRL_ROADWORTHINESS_TEST_TYPES = {
  IDS: ['122', '91', '101', '62', '63'],
};

export const COIF_EXPIRY_TEST_TYPES = {
  IDS: ['142', '146', '175', '177'],
};

export const LEC_TEST_TYPES = {
  IDS: ['39', '201', '44', '45'],
};

export const ADR_TEST_TYPES = {
  IDS: ['50', '59', '60'],
};

export const TIR_TEST_TYPES = {
  IDS: ['49', '56', '57'],
};

export const COUNTRY_OF_REGISTRATION: string[] = [
  'gb',
  'gba',
  'gbg',
  'gbj',
  'gbm',
  'gbz',
  'a',
  'b',
  'bih',
  'bg',
  'hr',
  'cy',
  'cz',
  'dk',
  'est',
  'fin',
  'f',
  'd',
  'gr',
  'h',
  'irl',
  'i',
  'lv',
  'lt',
  'l',
  'm',
  'nl',
  'n',
  'pl',
  'p',
  'ro',
  'sk',
  'slo',
  'e',
  's',
  'ch',
  'non-eu',
  'not-known',
];

export const TEST_CODES_FOR_CALCULATING_EXPIRY = {
  CODES: [
    'AAT1',
    'AAT2',
    'AAT3',
    'AAT4',
    'AAT5',
    'FFT1',
    'FFT2',
    'FFT3',
    'FFT4',
    'FFT5',
    'RPT1',
    'RPT2',
    'RPT3',
    'RPT4',
    'RPT5',
    'RST1',
    'RST2',
    'RST3',
    'RST4',
    'RST5',
    'RGT1',
    'RGT2',
    'RGT3',
    'RGT4',
    'RGT5',
    'RIT1',
    'RIT2',
    'RIT3',
    'RIT4',
    'RIT5',
    'RHT',
    'P1T1',
    'P1T2',
    'P1T3',
    'P1T4',
    'P1T5',
    'P3T1',
    'P3T2',
    'P3T3',
    'P3T4',
    'P3T5',
    'P6T1',
    'P6T2',
    'P6T3',
    'P6T4',
    'P6T5',
    'P7T1',
    'P7T2',
    'P7T3',
    'P7T4',
    'P7T5',
    'P4T1',
    'P4T2',
    'P4T3',
    'P4T4',
    'P4T5',
    'AAV2',
    'AAV3',
    'AAV4',
    'AAV5',
    'FFV2',
    'FFV3',
    'FFV4',
    'FFV5',
    'RPV2',
    'RPV3',
    'RPV4',
    'RPV5',
    'RSV2',
    'RSV3',
    'RSV4',
    'RSV5',
    'RGV2',
    'RGV3',
    'RGV4',
    'RGV5',
    'RIV2',
    'RIV3',
    'RIV4',
    'RIV5',
    'P1V2',
    'P1V3',
    'P1V4',
    'P1V5',
    'P3V2',
    'P3V3',
    'P3V4',
    'P3V5',
    'P6V2',
    'P6V3',
    'P6V4',
    'P6V5',
    'P4V2',
    'P4V3',
    'P4V4',
    'P4V5',
    'P7V2',
    'P7V3',
    'P7V4',
    'P7V5',
    'AAL',
    'AAS',
    'ADL',
    'WDL',
    'WDS',
    'WBL',
    'WBS',
    'RHL',
    'RPL',
    'RPS',
    'WHL',
    'WHS',
    'RGL',
    'RSL',
    'RSS',
    'P1L',
    'P1S',
    'P8L',
    'P8S',
    'P6L',
    'P6S',
    'WIS',
    'WIL',
    'WFL',
    'WFS',
    'WEL',
    'WES',
    'CEL',
    'CES',
    'CHL',
    'CHS',
    'CKL',
    'CKS',
    'CML',
    'CMS',
  ],
};

// CVSB-10300 - the following constants are based on the grouping of the test-types in the excel "Use_for_dynamic_functionality - CVSB-10298 only" sheet

// tests for PSV - Annual test, Class 6A seatbelt installation check(annual test, first test), Paid/Part paid annual test retest
// Paid/Part paid prohibition clearance(full inspection, retest with certificate), Prohibition clearance(retest with/without class 6A seatbelt)
export const TEST_TYPES_GROUP1: string[] = [
  '1',
  '3',
  '4',
  '7',
  '8',
  '10',
  '14',
  '18',
  '21',
  '27',
  '28',
  '93',
];

// tests for PSV - Paid/Part paid prohibition clearance(full/partial/retest without cert)
export const TEST_TYPES_GROUP2: string[] = ['15', '16', '23', '19', '22'];

// 38 through 36 - tests for PSV - Notifiable alteration check, voluntary brake test, voluntary multi check, voluntary speed limiter check
// voluntary smoke test, voluntary headlamp aim test, vitesse 100 replacement, vitesse 100 application, voluntary tempo 100
// 86 through 90 - tests for HGV - voluntary multi-check, voluntary speed limiter check, voluntary smoke and headlamp aim test
// 87 through 85 - tests for HGV and TRL - voluntary shaker plate check, Free/Paid notifiable alteration, voluntary break test
export const TEST_TYPES_GROUP3_4_8: string[] = [
  '38',
  '30',
  '33',
  '34',
  '32',
  '31',
  '100',
  '121',
  '36',
  '86',
  '88',
  '89',
  '90',
  '87',
  '47',
  '48',
  '85',
];

// 56 and 49 - tests for HGV and TRL - Paid TIR retest, TIR test
// 57 - test for TRL - Free TIR retest
export const TEST_TYPES_GROUP5_13: string[] = ['56', '49', '57'];

// 62, 63, 122 - tests for HGV and TRL - Paid/Part paid roadworthiness retest, Voluntary roadworthiness test
// 101, 91 - tests for TRL - Paid roadworthiness retest, Voluntary roadworthiness test
export const TEST_TYPES_GROUP6_11: string[] = ['62', '63', '122', '101', '91'];

// ADR tests for HGV and TRL
export const TEST_TYPES_GROUP7: string[] = ['59', '60', '50'];

// tests for HGV and TRL - Annual tests, First tests, Annual retests, Paid/Part paid prohibition clearance
export const TEST_TYPES_GROUP9_10: string[] = [
  '76',
  '95',
  '94',
  '53',
  '54',
  '65',
  '66',
  '70',
  '79',
  '82',
  '83',
  '41',
  '40',
  '98',
  '99',
  '103',
  '104',
  '67',
  '107',
  '113',
  '116',
  '119',
  '120',
  '199',
];

// tests for TRL - Paid/Part paid prohibition clearance(retest, full inspection, part inspection, without cert)
export const TEST_TYPES_GROUP12_14: string[] = [
  '117',
  '108',
  '109',
  '110',
  '114',
  '71',
  '72',
  '73',
  '77',
  '80',
];

// 39 - LEC with annual test for PSV, 201 - LEC without annual test for PSV, 45 - LEC without annual test for HGV, 44 - LEC with annual test for HGV
export const TEST_TYPES_GROUP15_16: string[] = ['39', '201', '45', '44'];

// CVSB-10372 - the following constants are based on the grouping of the test-types for specialist tests in the excel "specialist test fields mapping"

// Test/Retest - Free/Paid - IVA inspection, MSVA inspection
export const TEST_TYPES_GROUP1_SPEC_TEST: string[] = [
  '125',
  '126',
  '186',
  '187',
  '128',
  '188',
  '189',
  '129',
  '130',
  '133',
  '134',
  '135',
  '136',
  '138',
  '139',
  '140',
  '150',
  '151',
  '158',
  '159',
  '161',
  '192',
  '193',
  '162',
  '194',
  '195',
  '163',
  '166',
  '167',
  '169',
  '170',
  '172',
  '173',
  '181',
  '182',
];

// Test/Retest COIF with annual test, Seatbelt installation check COIF with annual test
export const TEST_TYPES_GROUP2_SPEC_TEST: string[] = [
  '142',
  '146',
  '175',
  '177',
];

// Test/Retest COIF without annual test, Type approved to bus directive COIF, Annex 7 COIF, TILT COIF retest
export const TEST_TYPES_GROUP3_SPEC_TEST: string[] = [
  '143',
  '144',
  '148',
  '176',
  '178',
  '179',
];

// Test Seatbelt installation check COIF without annual test
export const TEST_TYPES_GROUP4_SPEC_TEST: string[] = ['147'];

// Test/Retest Normal/Basic voluntary IVA inspection
export const TEST_TYPES_GROUP5_SPEC_TEST: string[] = [
  '153',
  '190',
  '191',
  '154',
  '184',
  '196',
  '197',
  '185',
];

export const SPECIALIST_TEST_TYPE_IDS: string[] = [
  '125',
  '126',
  '186',
  '187',
  '128',
  '188',
  '189',
  '129',
  '130',
  '133',
  '134',
  '135',
  '136',
  '138',
  '139',
  '140',
  '150',
  '151',
  '158',
  '159',
  '161',
  '192',
  '193',
  '162',
  '194',
  '195',
  '163',
  '166',
  '167',
  '169',
  '170',
  '172',
  '173',
  '181',
  '182',
  '142',
  '146',
  '175',
  '177',
  '143',
  '144',
  '148',
  '176',
  '178',
  '179',
  '147',
  '153',
  '190',
  '191',
  '154',
  '184',
  '196',
  '197',
  '185',
];

export const TEST_TYPES_GROUP1_DESK_BASED_TEST: string[] = ['417', '418'];

export const TEST_TYPES_GROUP2_DESK_BASED_TEST: string[] = [
  '403',
  '404',
  '415',
];
export const TEST_TYPES_GROUP3_DESK_BASED_TEST: string[] = [
  '407',
  '408',
  '414',
  '420',
  '426',
];
export const TEST_TYPES_GROUP4_DESK_BASED_TEST: string[] = [
  '409',
  '411',
  '412',
  '423',
  '424',
  '425',
];

// ADR: ADRIIIa
export const TEST_TYPES_GROUP5_DESK_BASED_TEST: string[] = ['441', '442'];

export const TEST_TYPES = {
  testTypesGroup1: TEST_TYPES_GROUP1,
  testTypesGroup2: TEST_TYPES_GROUP2,
  testTypesGroup3And4And8: TEST_TYPES_GROUP3_4_8,
  testTypesGroup7: TEST_TYPES_GROUP7,
  testTypesGroup9And10: TEST_TYPES_GROUP9_10,
  testTypesGroup6And11: TEST_TYPES_GROUP6_11,
  testTypesGroup12And14: TEST_TYPES_GROUP12_14,
  testTypesGroup5And13: TEST_TYPES_GROUP5_13,
  testTypesGroup15And16: TEST_TYPES_GROUP15_16,
  testTypesSpecialistGroup1: TEST_TYPES_GROUP1_SPEC_TEST,
  testTypesSpecialistGroup2: TEST_TYPES_GROUP2_SPEC_TEST,
  testTypesSpecialistGroup3: TEST_TYPES_GROUP3_SPEC_TEST,
  testTypesSpecialistGroup4: TEST_TYPES_GROUP4_SPEC_TEST,
  testTypesSpecialistGroup5: TEST_TYPES_GROUP5_SPEC_TEST,
  testTypesDeskBasedGroup1: TEST_TYPES_GROUP1_DESK_BASED_TEST,
  testTypesDeskBasedGroup2: TEST_TYPES_GROUP2_DESK_BASED_TEST,
  testTypesDeskBasedGroup3: TEST_TYPES_GROUP3_DESK_BASED_TEST,
  testTypesDeskBasedGroup4: TEST_TYPES_GROUP4_DESK_BASED_TEST,
  testTypesDeskBasedGroup5: TEST_TYPES_GROUP5_DESK_BASED_TEST,
};
