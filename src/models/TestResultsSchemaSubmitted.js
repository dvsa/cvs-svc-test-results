const Joi = require('joi')

const defectsSchema = Joi.object().keys({
  imNumber: Joi.number().required(),
  imDescription: Joi.string().required(),
  additionalInformation: Joi.object().keys({
    location: Joi.object().keys({
      vertical: Joi.any().only(['upper', 'lower']).allow(null),
      horizontal: Joi.any().only(['inner', 'outer']).allow(null),
      lateral: Joi.any().only(['nearside', 'centre', 'offside']).allow(null),
      longitudinal: Joi.any().only(['front', 'rear']).allow(null),
      rowNumber: Joi.number().max(20).allow(null),
      seatNumber: Joi.number().max(6).allow(null),
      axleNumber: Joi.number().max(10).allow(null)
    }),
    notes: Joi.string().max(500)
  }),
  itemNumber: Joi.number().required(),
  itemDescription: Joi.string().required(),
  deficiencyRef: Joi.string().required(),
  deficiencyId: Joi.string().regex(/^[a-z]+$/).max(1).allow(null),
  deficiencySubId: Joi.string().regex(/^[mdclxvi]+$/).allow(null),
  deficiencyCategory: Joi.any().only(['advisory', 'dangerous', 'major', 'minor', 'prs']).required(),
  deficiencyText: Joi.string().required(),
  stdForProhibition: Joi.boolean(),
  prs: Joi.boolean()
})

const testTypesSchema = Joi.object().keys({
  name: Joi.string().required(),
  testTypeName: Joi.string().required(),
  testTypeId: Joi.string().required(),
  testNumber: Joi.string(),
  certificateNumber: Joi.string(),
  certificateLink: Joi.string(),
  testTypeStartTimestamp: Joi.date().iso().required(),
  testTypeEndTimestamp: Joi.date().iso().required(),
  numberOfSeatbeltsFitted: Joi.number(),
  lastSeatbeltInstallationCheckDate: Joi.date(),
  seatbeltInstallationCheckDate: Joi.boolean(),
  testResult: Joi.any().only(['fail', 'pass', 'prs', 'abandoned']).required(),
  prohibitionIssued: Joi.boolean(),
  reasonForAbandoning: Joi.string().max(500),
  additionalNotesRecorded: Joi.string().max(500),
  additionalCommentsForAbandon: Joi.string().max(500),
  defects: Joi.array().items(defectsSchema)
})

const testResultsSchema = Joi.object().keys({
  testResultId: Joi.string().required(),
  vrm: Joi.string().alphanum().min(1).max(8).required(),
  vin: Joi.string().alphanum().min(1).max(21).required(),
  testStationName: Joi.string().max(999).required(),
  testStationPNumber: Joi.string().max(20).required(),
  testStationType: Joi.any().only(['atf', 'gvts', 'hq']).required(),
  testerName: Joi.string().max(60).required(),
  testerEmailAddress: Joi.string().max(60).required(),
  testerStaffId: Joi.string().max(9).required(),
  testStartTimestamp: Joi.date().iso().required(),
  testEndTimestamp: Joi.date().iso().required(),
  testStatus: Joi.any().only(['submitted', 'cancelled']).required(),
  vehicleClass: Joi.object().keys({
    code: Joi.any().only(['1', '2', '3', 'n', 't', 'l', 's', 'v']).required(),
    description: Joi.any().only(['over 200cc or with a sidecar', 'not applicable', 'small psv (ie: less than or equal to 22 seats)', 'motorbikes up to 200cc', 'trailer', 'large psv(ie: greater than 23 seats)', '3 wheelers', 'heavy goods vehicle']).required()
  }),
  vehicleType: Joi.any().only(['psv', 'hgv', 'trl']).required(),
  numberOfSeats: Joi.number().required(),
  vehicleConfiguration: Joi.any().only(['rigid', 'articulated']).required(),
  odometerReading: Joi.number().required(),
  odometerReadingUnits: Joi.any().only(['kilometres', 'miles']).required(),
  preparerId: Joi.string().allow(null).required(),
  preparerName: Joi.string().required(),
  euVehicleCategory: Joi.any().only(['m1', 'm2', 'm3', 'n1', 'n2', 'n3', 'o1', 'o2', 'o3', 'o4']).required(),
  countryOfRegistration: Joi.string().required(),
  testTypes: Joi.array().items(testTypesSchema).required(),
  vehicleSize: Joi.any().only(['small', 'large']).required(),
  reasonForCancellation: Joi.string().max(500)
})

module.exports = testResultsSchema
