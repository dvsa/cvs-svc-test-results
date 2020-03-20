import * as Joi from "joi";
import {defectsCommonSchema} from "../CommonSchema";

const additionalInformationSchema = Joi.object().keys({
  location: Joi.object().keys({
    vertical: Joi.any().only(["upper", "lower"]).required().allow(null),
    horizontal: Joi.any().only(["inner", "outer"]).required().allow(null),
    lateral: Joi.any().only(["nearside", "centre", "offside"]).required().allow(null),
    longitudinal: Joi.any().only(["front", "rear"]).required().allow(null),
    rowNumber: Joi.number().max(20).required().allow(null),
    seatNumber: Joi.number().max(6).required().allow(null),
    axleNumber: Joi.number().max(10).required().allow(null)
  }).required().allow(null),
  notes: Joi.string().max(500).required().allow("", null)
});

export const defectsSchemaPut = defectsCommonSchema.keys({
  additionalInformation: Joi.object().when("$isSubmitted", {
    is: "submitted",
    then: additionalInformationSchema.required().allow(null),
    otherwise: additionalInformationSchema.optional()
  })
});

export const testTypesCommonSchema = Joi.object().keys({
  name: Joi.string().required(),
  testTypeName: Joi.string().required(),
  testTypeId: Joi.string().required(),
  testTypeStartTimestamp: Joi.date().iso().required(),
  testTypeEndTimestamp: Joi.date().iso().required().allow(null),
  testResult: Joi.any().only(["fail", "pass", "prs", "abandoned"]).required().allow(null),
  reasonForAbandoning: Joi.string().required().allow("", null),
  additionalNotesRecorded: Joi.string().max(500).required().allow("", null),
  additionalCommentsForAbandon: Joi.string().max(500).required().allow("", null),
  secondaryCertificateNumber: Joi.string().alphanum().max(20).required().allow(null),
  customDefects: Joi.array().items(Joi.object().keys({
    referenceNumber: Joi.string().max(10).required(),
    defectName: Joi.string().max(200).required(),
    defectNotes: Joi.string().max(200).required().allow(null)
  })).required().allow(null)
});

export const testTypesSchemaGroup1 = testTypesCommonSchema.keys({
  certificateNumber: Joi.string().required().allow("", null),
  testExpiryDate: Joi.date().when("isPassed", {
    is: "pass",
    then: Joi.date().iso().allow(null),
    otherwise: Joi.date().forbidden()
  }).allow(null),
  testAnniversaryDate: Joi.date().iso().required().allow(null),
  numberOfSeatbeltsFitted: Joi.number().required().allow(null),
  lastSeatbeltInstallationCheckDate: Joi.date().required().allow(null),
  seatbeltInstallationCheckDate: Joi.boolean().required().allow(null),
  defects: Joi.array().items(defectsSchemaPut).required()
});

export const testTypesSchemaGroup2 = testTypesCommonSchema.keys({
  numberOfSeatbeltsFitted: Joi.number().required().allow(null),
  lastSeatbeltInstallationCheckDate: Joi.date().required().allow(null),
  seatbeltInstallationCheckDate: Joi.boolean().required().allow(null),
  defects: Joi.array().items(defectsSchemaPut).required()
});

export const testTypesSchemaGroup3And4And5And10 = testTypesCommonSchema.keys({
  prohibitionIssued: Joi.boolean().required().allow(null)
});

export const testTypesSchemaGroup6And7And8 = testTypesCommonSchema.keys({
  certificateNumber: Joi.string().required().allow("", null),
  testExpiryDate: Joi.date().when("$isPassed", {
    is: "pass",
    then: Joi.date().iso().allow(null),
    otherwise: Joi.date().forbidden()
  }).allow(null),
  testAnniversaryDate: Joi.date().iso().required().allow(null),
  defects: Joi.array().items(defectsSchemaPut).required()
});

export const testTypesSchemaGroup9And11 = testTypesCommonSchema.keys({
  defects: Joi.array().items(defectsSchemaPut).required()
});

export const testTypesSchemaGroup12And13 = testTypesCommonSchema.keys({
  modType: Joi.object().keys({
    code: Joi.any().only(["p", "m", "g"]),
    description: Joi.any().only(["particulate trap", "modification or change of engine", "gas engine"])
  }).allow(null),
  emissionStandard: Joi.any().only(["0.10 g/kWh Euro 3 PM", "0.03 g/kWh Euro IV PM", "Euro 3", "Euro 4", "Euro 6", "Euro VI", "Full Electric"]).allow(null),
  fuelType: Joi.any().only(["diesel", "gas-cng", "gas-lng", "gas-lpg", "petrol", "fuel cell", "full electric"]).allow(null),
  particulateTrapSerialNumber: Joi.string().max(100).allow(null),
  modificationTypeUsed: Joi.string().max(100).allow(null),
  particulateTrapFitted: Joi.string().max(100).allow(null),
  smokeTestKLimitApplied: Joi.string().max(100).allow(null),
  prohibitionIssued: Joi.boolean().required().allow(null)
});
