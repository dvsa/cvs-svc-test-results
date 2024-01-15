import * as Joi from 'joi';
import { array } from 'joi';
import {
  defectsCommonSchema,
  testTypesCommonSchema,
  testResultsCommonSchema,
  ivaDefectSchema,
} from './CommonSchema';

const defectsSchema = defectsCommonSchema.keys({
  additionalInformation: Joi.object().keys({
    location: Joi.object()
      .keys({
        vertical: Joi.any().only(['upper', 'lower']).required().allow(null),
        horizontal: Joi.any().only(['inner', 'outer']).required().allow(null),
        lateral: Joi.any()
          .only(['nearside', 'centre', 'offside'])
          .required()
          .allow(null),
        longitudinal: Joi.any().only(['front', 'rear']).required().allow(null),
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
  testResult: Joi.any()
    .only(['fail', 'pass', 'prs', 'abandoned'])
    .required()
    .allow(null),
  defects: Joi.array().items(defectsSchema).required(),
  ivaDefects: array().items(ivaDefectSchema.required()).optional(),
});

export const trlCancelled = testResultsCommonSchema.keys({
  reasonForCancellation: Joi.string().max(500).required().allow('', null),
  countryOfRegistration: Joi.string().required().allow('', null),
  vehicleConfiguration: Joi.any()
    .only([
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
    ])
    .required(),
  trailerId: Joi.string().required(),
  testTypes: Joi.array().items(testTypesSchema).required(),
  firstUseDate: Joi.string().allow('', null),
});
