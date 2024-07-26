import * as Joi from 'joi';
import { array, string } from 'joi';
import {
  defectsCommonSchema,
  testTypesCommonSchema,
  testResultsCommonSchema,
  requiredStandardsSchema,
} from './CommonSchema';

const defectsSchema = defectsCommonSchema.keys({
  additionalInformation: Joi.object().keys({
    location: Joi.object()
      .keys({
        vertical: Joi.string().valid('upper', 'lower').required().allow(null),
        horizontal: Joi.string().valid('inner', 'outer').required().allow(null),
        lateral: Joi.any()
          .valid('nearside', 'centre', 'offside')
          .required()
          .allow(null),
        longitudinal: Joi.string()
          .valid('front', 'rear')
          .required()
          .allow(null),
        rowNumber: Joi.number().max(20).required().allow(null),
        seatNumber: Joi.number().max(6).required().allow(null),
        axleNumber: Joi.number().max(10).required().allow(null),
      })
      .required()
      .allow(null),
    notes: Joi.string().max(500).required().allow('', null),
  }),
});

const testTypesSchema = testTypesCommonSchema.keys({
  testTypeEndTimestamp: Joi.date().iso().required().allow(null),
  numberOfSeatbeltsFitted: Joi.number().required().allow(null),
  lastSeatbeltInstallationCheckDate: Joi.date().required().allow(null),
  seatbeltInstallationCheckDate: Joi.boolean().required().allow(null),
  testResult: Joi.any()
    .valid('fail', 'pass', 'prs', 'abandoned')
    .required()
    .allow(null),
  defects: Joi.array().items(defectsSchema).required(),
  requiredStandards: array()
    .items(requiredStandardsSchema.required())
    .optional(),
  modType: Joi.object({
    code: Joi.string().valid('p', 'm', 'g'),
    description: Joi.string().valid(
      'particulate trap',
      'modification or change of engine',
      'gas engine',
    ),
  }).allow(null),
  particulateTrapSerialNumber: Joi.string().max(100).allow(null),
  smokeTestKLimitApplied: Joi.string().max(100).allow(null),
  modificationTypeUsed: Joi.string().max(100).allow(null),
  particulateTrapFitted: Joi.string().max(100).allow(null),
  reapplicationDate: Joi.date().optional().allow(null, ''),
  centralDocs: Joi.object()
    .keys({
      issueRequired: Joi.boolean().required(),
      notes: Joi.string().optional(),
      reasonsForIssue: Joi.array().items(string().optional()).required(),
    })
    .optional(),
});

export const psvCancelled = testResultsCommonSchema.keys({
  vrm: Joi.string().alphanum().min(1).max(9).required(),
  reasonForCancellation: Joi.string().max(500).required().allow('', null),
  numberOfSeats: Joi.number().required(),
  odometerReading: Joi.number().required().allow(null),
  odometerReadingUnits: Joi.any()
    .valid('kilometres', 'miles')
    .required()
    .allow(null),
  vehicleConfiguration: Joi.string().valid('rigid', 'articulated').required(),
  countryOfRegistration: Joi.string().required().allow('', null),
  vehicleSize: Joi.string().valid('small', 'large').required(),
  testTypes: Joi.array().items(testTypesSchema).required(),
});
