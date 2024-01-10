import * as Joi from 'joi';
import {
  defectsCommonSchema,
  testResultsCommonSchema,
  testTypesCommonSchema,
} from './CommonSchema';

export const ivaDefectSchema = Joi.object({
  sectionNumber: Joi.string().required(),
  sectionDescription: Joi.string().required(),
  additionalInformation: Joi.object({
    notes: Joi.string().required(),
  }).optional(),
  requiredStandards: Joi.array()
    .items(
      Joi.object({
        rsNumber: Joi.number().required(),
        requiredStandard: Joi.string().required(),
        refCalculation: Joi.string().required(),
        additionalInfo: Joi.boolean().required(),
        inspectionTypes: Joi.array()
          .items(Joi.string().valid('basic', 'normal'))
          .required(),
      }),
    )
    .required(),
});

export const testTypesIVADefectCommonSchemaSpecialistTestsSubmitted =
  testTypesCommonSchema.keys({
    testTypeEndTimestamp: Joi.date().iso().required(),
    testResult: Joi.any().only(['fail', 'pass', 'prs', 'abandoned']).required(),
    ivaDefects: Joi.array().items(ivaDefectSchema).optional(),
  });

export const defectsCommonSchemaSpecialistTestsSubmitted =
  defectsCommonSchema.keys({
    additionalInformation: Joi.object()
      .keys({
        location: Joi.object()
          .keys({
            vertical: Joi.any().only(['upper', 'lower']).required().allow(null),
            horizontal: Joi.any()
              .only(['inner', 'outer'])
              .required()
              .allow(null),
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

export const testTypesCommonSchemaSpecialistTestsSubmitted =
  testTypesCommonSchema.keys({
    testTypeEndTimestamp: Joi.date().iso().required(),
    testResult: Joi.any().only(['fail', 'pass', 'prs', 'abandoned']).required(),
    defects: Joi.array()
      .items(defectsCommonSchemaSpecialistTestsSubmitted)
      .required(),
    ivaDefects: Joi.array().items(ivaDefectSchema).required(),
  });

export const testResultsCommonSchemaSpecialistTestsSubmitted =
  testResultsCommonSchema.keys({
    vrm: Joi.string().alphanum().min(1).max(8).required(),
    countryOfRegistration: Joi.string().required().allow('', null),
    odometerReading: Joi.number().required().allow(null),
    odometerReadingUnits: Joi.any()
      .only(['kilometres', 'miles'])
      .required()
      .allow(null),
    reasonForCancellation: Joi.string().max(500).required().allow('', null),
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
      .required()
      .allow(null),
    testTypes: Joi.array()
      .items(testTypesCommonSchemaSpecialistTestsSubmitted)
      .required(),
  });
