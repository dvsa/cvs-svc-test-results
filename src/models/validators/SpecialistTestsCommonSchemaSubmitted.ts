import Joi, { string } from 'joi';
import {
  defectsCommonSchema,
  requiredStandardsSchema,
  testResultsCommonSchema,
  testTypesSpecialistSchema,
} from './CommonSchema';

export const testTypesRequiredStandardCommonSchemaSpecialistTestsSubmitted =
  testTypesSpecialistSchema.keys({
    testTypeEndTimestamp: Joi.date().iso().required(),
    testResult: Joi.string()
      .valid('fail', 'pass', 'prs', 'abandoned')
      .required(),
    requiredStandards: Joi.array()
      .items(requiredStandardsSchema.required())
      .optional(),
  });

export const defectsCommonSchemaSpecialistTestsSubmitted =
  defectsCommonSchema.keys({
    additionalInformation: Joi.object()
      .keys({
        location: Joi.object()
          .keys({
            vertical: Joi.string()
              .valid('upper', 'lower')
              .required()
              .allow(null),
            horizontal: Joi.any()
              .valid('inner', 'outer')
              .required()
              .allow(null),
            lateral: Joi.any()
              .valid('nearside', 'centre', 'offside')
              .required()
              .allow(null),
            longitudinal: Joi.any()
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
      })
      .required()
      .allow(null),
  });

export const testTypesCommonSchemaSpecialistTestsSubmitted =
  testTypesSpecialistSchema.keys({
    testTypeEndTimestamp: Joi.date().iso().required(),
    testResult: Joi.string()
      .valid('fail', 'pass', 'prs', 'abandoned')
      .required(),
    defects: Joi.array()
      .items(defectsCommonSchemaSpecialistTestsSubmitted)
      .required(),
    requiredStandards: Joi.array().items(requiredStandardsSchema).optional(),
    reapplicationDate: Joi.date().optional().allow(null, ''),
    centralDocs: Joi.object()
      .keys({
        issueRequired: Joi.boolean().required(),
        notes: Joi.string().optional(),
        reasonsForIssue: Joi.array().items(string()).optional(),
      })
      .optional(),
  });

export const testResultsCommonSchemaSpecialistTestsSubmitted =
  testResultsCommonSchema.keys({
    vrm: Joi.string().alphanum().min(1).max(8).required(),
    countryOfRegistration: Joi.string().required().allow('', null),
    odometerReading: Joi.number().required().allow(null),
    odometerReadingUnits: Joi.any()
      .valid('kilometres', 'miles')
      .required()
      .allow(null),
    reasonForCancellation: Joi.string().max(500).required().allow('', null),
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
      .required()
      .allow(null),
    testTypes: Joi.array()
      .items(testTypesCommonSchemaSpecialistTestsSubmitted)
      .required(),
  });
