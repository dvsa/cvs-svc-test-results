const Joi = require('joi')
const defectsCommonSchema = require('./CommonSchema').defectsCommonSchema
const testTypesCommonSchema = require('./CommonSchema').testTypesCommonSchema
const testResultsCommonSchema = require('./CommonSchema').testResultsCommonSchema

const defectsSchema = Joi.object().keys({
  ...defectsCommonSchema,
  additionalInformation: Joi.object().keys({
    location: Joi.object().keys({
      vertical: Joi.any().only(['upper', 'lower']).required().allow(null),
      horizontal: Joi.any().only(['inner', 'outer']).required().allow(null),
      lateral: Joi.any().only(['nearside', 'centre', 'offside']).required().allow(null),
      longitudinal: Joi.any().only(['front', 'rear']).required().allow(null),
      rowNumber: Joi.number().max(20).required().allow(null),
      seatNumber: Joi.number().max(6).required().allow(null),
      axleNumber: Joi.number().max(10).required().allow(null)
    }).required().allow(null),
    notes: Joi.string().max(500).required().allow('', null)
  })
})

const testTypesSchema = Joi.object().keys({
  ...testTypesCommonSchema,
  testResult: Joi.any().only(['fail', 'pass', 'prs', 'abandoned']).required().allow(null),
  testTypeEndTimestamp: Joi.date().iso().required().allow(null),
  defects: Joi.array().items(defectsSchema).required()
})

const testResultsSchema = Joi.object().keys({
  ...testResultsCommonSchema,
  vrm: Joi.string().alphanum().min(1).max(8).required(),
  reasonForCancellation: Joi.string().max(500).required().allow(''),
  euVehicleCategory: Joi.any().only(['m1', 'm2', 'm3', 'n1', 'n2', 'n3', 'o1', 'o2', 'o3', 'o4']).required().allow(null),
  countryOfRegistration: Joi.string().required().allow('', null),
  testTypes: Joi.array().items(testTypesSchema).required()
})

module.exports = testResultsSchema
