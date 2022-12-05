import * as Joi from 'joi';
import { deskBasedTestCommonSchema } from './CommonSchema';

export const testTypesDeskBasedGroup1and2and3 = deskBasedTestCommonSchema.keys({
  odometerReading: Joi.number().required().allow('', null),
  odometerReadingUnits: Joi.any()
    .only(['kilometres', 'miles'])
    .required()
    .allow(null),
  certificateNumber: Joi.number().required(), // required for psv g1 but not hgv g1...
  testExpiryDate: Joi.date().required().allow('', null),
});

export const testTypesDeskBasedGroup4 = deskBasedTestCommonSchema.keys({
  odometerReading: Joi.number().required().allow('', null),
  odometerReadingUnits: Joi.any()
    .only(['kilometres', 'miles'])
    .required()
    .allow(null),
  certificateNumber: Joi.string().alphanum().required(),
  testExpiryDate: Joi.date().allow('', null), // psv
  trailerId: Joi.string()
    .alphanum()
    .when('$vehicleType', {
      is: 'trl',
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null),
    }),
});

// modType: Joi.object()
// .keys({
//   code: Joi.any().only(['p', 'm', 'g']),
//   description: Joi.any().only([
//     'particulate trap',
//     'modification or change of engine',
//     'gas engine',
//   ]),
// })
// .allow(null),
// emissionStandard: Joi.any()
// .only([
//   '0.10 g/kWh Euro 3 PM',
//   '0.03 g/kWh Euro IV PM',
//   'Euro 3',
//   'Euro 4',
//   'Euro 6',
//   'Euro VI',
//   'Full Electric',
// ])
// .allow(null),
// fuelType: Joi.any()
// .only([
//   'diesel',
//   'gas-cng',
//   'gas-lng',
//   'gas-lpg',
//   'petrol',
//   'fuel cell',
//   'full electric',
// ])
// .allow(null),
// particulateTrapSerialNumber: Joi.string().max(100).allow(null),
// smokeTestKLimitApplied: Joi.string().max(100).allow(null),
// modificationTypeUsed: Joi.string().max(100).allow(null),
// particulateTrapFitted: Joi.string().max(100).allow(null),
