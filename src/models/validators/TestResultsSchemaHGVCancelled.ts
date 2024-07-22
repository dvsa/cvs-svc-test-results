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
  testResult: Joi.any()
    .valid('fail', 'pass', 'prs', 'abandoned')
    .required()
    .allow(null),
  testTypeEndTimestamp: Joi.date().iso().required().allow(null),
  defects: Joi.array().items(defectsSchema).required(),
  requiredStandards: array()
    .items(requiredStandardsSchema.required())
    .optional(),
  reapplicationDate: Joi.date().optional().allow(null, ''),
  centralDocs: Joi.object()
    .keys({
      issueRequired: Joi.boolean().required(),
      notes: Joi.string().optional(),
      reasonsForIssue: Joi.array().items(string()).optional(),
    })
    .optional(),
});

export const hgvCancelled = testResultsCommonSchema.keys({
  vrm: Joi.string().alphanum().min(1).max(8).required(),
  reasonForCancellation: Joi.string().max(500).required().allow('', null),
  odometerReading: Joi.number().required().allow(null),
  odometerReadingUnits: Joi.any()
    .valid('kilometres', 'miles')
    .required()
    .allow(null),
  countryOfRegistration: Joi.string().required().allow('', null),
  vehicleConfiguration: Joi.any()
    .valid(
      'rigid',
      'articulated',
      'centre axle drawbar',
      'semi-car transporter',
      'semi-trailer',
      'long semi-trailer',
      'low loader',
      'other',
      'drawbar',
      'four-in-line',
      'dolly',
      'full drawbar',
    )
    .required(),
  testTypes: Joi.array().items(testTypesSchema).required(),
  regnDate: Joi.string().allow('', null),
});
