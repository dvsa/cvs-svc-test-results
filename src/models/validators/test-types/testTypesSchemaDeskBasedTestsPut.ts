import * as Joi from 'joi';

export const testTypesCommonSchemaDeskBasedTests = Joi.object().keys({
  name: Joi.string(),
  testTypeName: Joi.string(),
  testTypeId: Joi.string().required(),
  testTypeStartTimestamp: Joi.date().iso().required(),
  testTypeEndTimestamp: Joi.date().iso().required(),
  testResult: Joi.any().only(['pass', 'fail']).required(),
  additionalNotesRecorded: Joi.string().max(500).allow('', null),
  testCode: Joi.string(),
  testNumber: Joi.string().required(),
  createdAt: Joi.string().optional(),
  lastUpdatedAt: Joi.string().optional(),
  certificateLink: Joi.string().optional(),
  testTypeClassification: Joi.string().required().allow('', null),
  defects: Joi.array().max(0).allow(null),
  customDefects: Joi.array().max(0).allow(null),
});

export const testTypesDeskBasedGroup1 =
  testTypesCommonSchemaDeskBasedTests.keys({
    certificateNumber: Joi.string().when('$vehicleType', {
      is: 'psv',
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null),
    }),
    testExpiryDate: Joi.date().when('$vehicleType', {
      is: 'psv',
      then: Joi.date().required().allow('', null),
      otherwise: Joi.date().allow(null),
    }),
    testAnniversaryDate: Joi.date().allow(null),
    secondaryCertificateNumber: Joi.string().allow('', null),
  });

export const testTypesDeskBasedGroup2 =
  testTypesCommonSchemaDeskBasedTests.keys({
    certificateNumber: Joi.string().required(),
    testExpiryDate: Joi.date().required().allow('', null),
    modType: Joi.object()
      .keys({
        code: Joi.any().only(['p', 'm', 'g']),
        description: Joi.any().only([
          'particulate trap',
          'modification or change of engine',
          'gas engine',
        ]),
      })
      .allow(null),
    emissionStandard: Joi.any()
      .only([
        '0.10 g/kWh Euro 3 PM',
        '0.03 g/kWh Euro IV PM',
        'Euro 3',
        'Euro 4',
        'Euro 6',
        'Euro VI',
        'Full Electric',
      ])
      .allow(null),
    fuelType: Joi.any()
      .only([
        'diesel',
        'gas-cng',
        'gas-lng',
        'gas-lpg',
        'petrol',
        'fuel cell',
        'full electric',
      ])
      .allow(null),
    particulateTrapSerialNumber: Joi.string().max(100).allow(null),
    smokeTestKLimitApplied: Joi.string().max(100).allow(null),
    modificationTypeUsed: Joi.string().max(100).allow(null),
    particulateTrapFitted: Joi.string().max(100).allow(null),
  });

export const testTypesDeskBasedGroup3 =
  testTypesCommonSchemaDeskBasedTests.keys({
    certificateNumber: Joi.string().required(),
    testExpiryDate: Joi.date().required().allow('', null),
  });

export const testTypesDeskBasedGroup4 =
  testTypesCommonSchemaDeskBasedTests.keys({
    certificateNumber: Joi.string().when('$vehicleType', {
      is: 'psv',
      then: Joi.string().required(),
      otherwise: Joi.string().allow('', null),
    }),
    secondaryCertificateNumber: Joi.any().when('$vehicleType', {
      is: 'psv',
      then: Joi.string().required(),
      otherwise: Joi.string().allow('', null),
    }),
    testExpiryDate: Joi.date().allow('', null),
    testAnniversaryDate: Joi.date().iso().allow(null),
  });

export const testTypesDeskBasedGroup5 =
  testTypesCommonSchemaDeskBasedTests.keys({
    certificateNumber: Joi.string().when('$vehicleType', {
      is: 'hgv',
      then: Joi.string().required(),
      otherwise: Joi.string().allow('', null),
    }),
    secondaryCertificateNumber: Joi.any().when('$vehicleType', {
      is: 'hgv',
      then: Joi.string().required(),
      otherwise: Joi.string().allow('', null),
    }),
    testExpiryDate: Joi.date().allow('', null),
  });
