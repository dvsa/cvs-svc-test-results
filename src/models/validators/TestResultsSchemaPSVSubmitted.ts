import * as Joi from 'joi';
import {
  defectsCommonSchema,
  testTypesCommonSchema,
  testResultsCommonSchema,
} from './CommonSchema';

const defectsSchema = defectsCommonSchema.keys({
  additionalInformation: Joi.object()
    .keys({
      location: Joi.object()
        .keys({
          vertical: Joi.any().only(['upper', 'lower']).required().allow(null),
          horizontal: Joi.any().only(['inner', 'outer']).required().allow(null),
          lateral: Joi.any()
            .only(['nearside', 'centre', 'offside'])
            .required()
            .allow(null),
          longitudinal: Joi.any()
            .only(['front', 'rear'])
            .required()
            .allow(null),
          rowNumber: Joi.number().max(20).required().allow(null),
          seatNumber: Joi.number().max(6).required().allow(null),
          axleNumber: Joi.number().max(10).required().allow(null),
        })
        .required()
        .allow(null),
      notes: Joi.string().max(500).required().allow('', null),
    })
    .required()
    .allow(null),
});

const testTypesSchema = testTypesCommonSchema.keys({
  testTypeEndTimestamp: Joi.date().iso().required(),
  numberOfSeatbeltsFitted: Joi.number().required().allow(null),
  lastSeatbeltInstallationCheckDate: Joi.date().required().allow(null),
  seatbeltInstallationCheckDate: Joi.boolean().required().allow(null),
  testResult: Joi.any().only(['fail', 'pass', 'prs', 'abandoned']).required(),
  defects: Joi.array().items(defectsSchema).required(),
  modType: Joi.object({
    code: Joi.string().only(['p', 'm', 'g']),
    description: Joi.string().only([
      'particulate trap',
      'modification or change of engine',
      'gas engine',
    ]),
  }).allow(null),
  particulateTrapSerialNumber: Joi.string().max(100).allow(null),
  smokeTestKLimitApplied: Joi.string().max(100).allow(null),
  modificationTypeUsed: Joi.string().max(100).allow(null),
  particulateTrapFitted: Joi.string().max(100).allow(null),
});

export const psvSubmitted = testResultsCommonSchema.keys({
  vrm: Joi.string().alphanum().min(1).max(8).required(),
  numberOfSeats: Joi.number().required(),
  odometerReading: Joi.number().required().allow(null),
  odometerReadingUnits: Joi.any()
    .only(['kilometres', 'miles'])
    .required()
    .allow(null),
  vehicleConfiguration: Joi.any().only(['rigid', 'articulated']).required(),
  countryOfRegistration: Joi.string().required().allow('', null),
  vehicleSize: Joi.any().only(['small', 'large']).required(),
  reasonForCancellation: Joi.string().max(500).required().allow('', null),
  testTypes: Joi.array().items(testTypesSchema).required(),
});
