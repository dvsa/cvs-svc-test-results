const Joi = require('joi')

const defectsSchema = Joi.object().keys({
  imNumber: Joi.number().required(),
  imDescription: Joi.string().required(),
  forVehicleType: Joi.array().items(
    Joi.any().only([ 'psv', 'hgv', 'trl' ])
  ).required(),
  additionalInformation: Joi.object().keys({
    location: Joi.object().keys({
      vertical: Joi.any().only([ 'upper', 'lower' ]).allow(null).required(),
      horizontal: Joi.any().only([ 'inner', 'outer' ]).allow(null).required(),
      lateral: Joi.any().only([ 'nearside', 'centre', 'offside' ]).allow(null).required(),
      longitudinal: Joi.any().only([ 'front', 'rear' ]).allow(null).required(),
      rowNumber: Joi.number().min(1).max(20).allow(null).required(),
      seatNumber: Joi.number().min(1).max(6).allow(null).required(),
      axleNumber: Joi.number().min(1).max(10).allow(null).required()
    }).required(),
    notes: Joi.string().min(1).max(500).required()
  }),
  item: Joi.object().keys({
    itemNumber: Joi.number().required(),
    itemDescription: Joi.string().required(),
    forVehicleType: Joi.array().items(
      Joi.any().only([ 'psv', 'hgv', 'trl' ])
    ).required(),
    deficiency: Joi.object().keys({
      ref: Joi.string().required(),
      deficiencyId: Joi.string().regex(/^[a-z]+$/).min(1).max(1).allow(null).required(),
      deficiencySubId: Joi.string().regex(/^[mdclxvi]+$/).allow(null).required(),
      deficiencyCategory: Joi.any().only([ 'advisory', 'dangerous', 'major', 'minor', 'prs' ]).required(),
      deficiencyText: Joi.string().required(),
      stdForProhibition: Joi.boolean().required(),
      prs: Joi.boolean().required(),
      forVehicleType: Joi.array().items(
        Joi.any().only([ 'psv', 'hgv', 'trl' ])
      ).required()
    })
  }).required()
})

const testTypesSchema = Joi.object().keys({
  createdAt: Joi.date().iso().required(),
  lastUpdatedAt: Joi.date().iso().required(),
  testCode: Joi.string().min(3).max(3).required(),
  testTypeName: Joi.string().required(),
  testId: Joi.string().required(),
  certificateNumber: Joi.string().required(),
  testExpiryDate: Joi.date().required(),
  testTypeStartTimestamp: Joi.date().iso().required(),
  testTypeEndTimestamp: Joi.date().iso().required(),
  numberOfSeatbeltsFitted: Joi.number().max(4).required(),
  lastSeatbeltInstallationCheckDate: Joi.date().required(),
  seatbeltInstallationCheckDate: Joi.boolean().required(),
  testResult: Joi.any().only([ 'failure', 'pass', 'prs', 'abandonned', 'successful', 'unsuccessful' ]).required(),
  prohibitionIssued: Joi.any().only([ 'yes', 'no' ]).required(),
  reasonForAbandoning: Joi.string().min(1).max(500).required(),
  additionalNotesRecorded: Joi.string().min(1).max(500).required(),
  defects: Joi.array().items(defectsSchema).required()
})

const testResultsSchema = Joi.object().keys({
  testResultId: Joi.string().required(),
  vrm: Joi.string().alphanum().min(1).max(8).required(),
  vin: Joi.string().alphanum().min(1).max(21).required(),
  testStationName: Joi.string().max(999).required(),
  testStationPNumber: Joi.string().max(20).required(),
  locationType: Joi.any().only(['atf', 'gvts', 'tass', 'potf']).required(),
  testerName: Joi.string().min(1).max(60).required(),
  testerStaffId: Joi.string().min(1).max(9).required(),
  testStartTimestamp: Joi.date().iso().required(),
  testEndTimestamp: Joi.date().iso().required(),
  testStatus: Joi.any().only([ 'submitted', 'canceled' ]).required(),
  reasonForCancellation: Joi.string().max(500).required(),
  vehicleClass: Joi.any().only(['2', 's', '1', 't', 'l', '3', 'v']).required(),
  vehicleType: Joi.any().only(['psv', 'hgv', 'trl']).required(),
  numberOfSeats: Joi.number().min(1).max(4).required(),
  vehicleStatus: Joi.any().only(['1', '2', '3']).required(),
  vehicleConfiguration: Joi.any().only(['rigid', 'articulated']).required(),
  odometerReading: Joi.number().min(1).max(7).required(),
  odometerReadingUnits: Joi.any().only(['kilometers', 'miles']).required(),
  preparerId: Joi.string().required(),
  preparerName: Joi.string().required(),
  euVehicleCategory: Joi.any().only(['m1', 'm2', 'm3', 'n1', 'n2', 'n3', 'o1', 'o2', 'o3', 'o4']).required(),
  countryOfRegistration: Joi.string().required(),
  testTypes: Joi.array().items(testTypesSchema).required(),
  vehicleSize: Joi.any().only(['small', 'large']).required()
})

module.exports = testResultsSchema
