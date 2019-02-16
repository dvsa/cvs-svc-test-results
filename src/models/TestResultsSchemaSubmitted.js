const Joi = require('joi')

const defectsSchema = Joi.object().keys({
  imNumber: Joi.number().required(),
  imDescription: Joi.string().required(),
  forVehicleType: Joi.array().items(
    Joi.any().only([ 'psv', 'hgv', 'trl' ])
  ),
  additionalInformation: Joi.object().keys({
    location: Joi.object().keys({
      vertical: Joi.any().only([ 'upper', 'lower' ]).allow(null),
      horizontal: Joi.any().only([ 'inner', 'outer' ]).allow(null),
      lateral: Joi.any().only([ 'nearside', 'centre', 'offside' ]).allow(null),
      longitudinal: Joi.any().only([ 'front', 'rear' ]).allow(null),
      rowNumber: Joi.number().min(1).max(20).allow(null),
      seatNumber: Joi.number().min(1).max(6).allow(null),
      axleNumber: Joi.number().min(1).max(10).allow(null)
    }),
    notes: Joi.string().min(1).max(500)
  }),
  item: Joi.object().keys({
    itemNumber: Joi.number().required(),
    itemDescription: Joi.string().required(),
    forVehicleType: Joi.array().items(
      Joi.any().only([ 'psv', 'hgv', 'trl' ])
    ),
    deficiency: Joi.object().keys({
      ref: Joi.string().required(),
      deficiencyId: Joi.string().regex(/^[a-z]+$/).min(1).max(1).allow(null),
      deficiencySubId: Joi.string().regex(/^[mdclxvi]+$/).allow(null),
      deficiencyCategory: Joi.any().only([ 'advisory', 'dangerous', 'major', 'minor', 'prs' ]).required(),
      deficiencyText: Joi.string().required(),
      stdForProhibition: Joi.boolean(),
      prs: Joi.boolean(),
      forVehicleType: Joi.array().items(
        Joi.any().only([ 'psv', 'hgv', 'trl' ])
      )
    })
  })
})

const testTypesSchema = Joi.object().keys({
  name: Joi.string().required(),
  testTypeName: Joi.string().required(),
  testTypeId: Joi.string().required(),
  certificateNumber: Joi.string(),
  testTypeStartTimestamp: Joi.date().iso().required(),
  testTypeEndTimestamp: Joi.date().iso().required(),
  numberOfSeatbeltsFitted: Joi.number().max(4),
  lastSeatbeltInstallationCheckDate: Joi.date(),
  seatbeltInstallationCheckDate: Joi.boolean(),
  testResult: Joi.any().only([ 'fail', 'pass', 'prs', 'abandoned', 'successful', 'unsuccessful' ]).required(),
  prohibitionIssued: Joi.boolean(),
  reasonForAbandoning: Joi.string().min(1).max(500),
  additionalNotesRecorded: Joi.string().min(1).max(500),
  additionalCommentsForAbandon: Joi.string().min(1).max(500),
  defects: Joi.array().items(defectsSchema)
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
  testStatus: Joi.any().only([ 'submitted', 'cancelled' ]).required(),
  vehicleClass: Joi.any().only(['2', 's', '1', 't', 'l', '3', 'v']).required(),
  vehicleType: Joi.any().only(['psv', 'hgv', 'trl']).required(),
  numberOfSeats: Joi.number().min(1).required(),
  vehicleStatus: Joi.any().only(['1', '2', '3']).required(),
  vehicleConfiguration: Joi.any().only(['rigid', 'articulated']).required(),
  odometerReading: Joi.number().min(1).required(),
  odometerReadingUnits: Joi.any().only(['kilometers', 'miles']).required(),
  preparerId: Joi.string().required(),
  preparerName: Joi.string().required(),
  euVehicleCategory: Joi.any().only(['m1', 'm2', 'm3', 'n1', 'n2', 'n3', 'o1', 'o2', 'o3', 'o4']).required(),
  countryOfRegistration: Joi.string().required(),
  testTypes: Joi.array().items(testTypesSchema).required(),
  vehicleSize: Joi.any().only(['small', 'large']).required(),
  reasonForCancellation: Joi.string().max(500).required()
})

module.exports = testResultsSchema
