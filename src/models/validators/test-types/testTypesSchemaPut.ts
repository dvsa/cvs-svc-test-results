import * as Joi from "joi";
import {defectsCommonSchema} from "../CommonSchema";

const additionalInformationSchema = Joi.object().keys({
  location: Joi.object().keys({
    vertical: Joi.any().only(["upper", "lower"]).allow(null),
    horizontal: Joi.any().only(["inner", "outer"]).allow(null),
    lateral: Joi.any().only(["nearside", "centre", "offside"]).allow(null),
    longitudinal: Joi.any().only(["front", "rear"]).allow(null),
    rowNumber: Joi.number().max(20).allow(null),
    seatNumber: Joi.number().max(6).allow(null),
    axleNumber: Joi.number().max(10).allow(null)
  }).optional().allow(null),
  notes: Joi.string().max(500).allow("", null)
});

export const defectsSchemaPut = defectsCommonSchema.keys({
  additionalInformation: additionalInformationSchema.optional().allow(null)
});

export const testTypesArray = Joi.object().keys({
  testTypes: Joi.array().min(1).required()
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
  })).required().allow(null),
  testCode: Joi.string().required(),
  testNumber: Joi.string().required(),
  createdAt: Joi.string().optional().allow(null),
  lastUpdatedAt: Joi.string().optional().allow(null),
  certificateLink: Joi.string().optional().allow(null),
  testTypeClassification: Joi.string().required(),
  deletionFlag: Joi.boolean().optional()
}).required();

export const testTypesGroup1 = testTypesCommonSchema.keys({
  certificateNumber: Joi.string().required().allow("", null),
  testExpiryDate: Joi.date().iso().allow(null),
  testAnniversaryDate: Joi.date().iso().required().allow(null),
  numberOfSeatbeltsFitted: Joi.number().required().allow(null),
  lastSeatbeltInstallationCheckDate: Joi.date().required().allow(null),
  seatbeltInstallationCheckDate: Joi.boolean().required().allow(null),
  defects: Joi.array().items(defectsSchemaPut).required()
});

export const testTypesGroup2 = testTypesCommonSchema.keys({
  numberOfSeatbeltsFitted: Joi.number().required().allow(null),
  lastSeatbeltInstallationCheckDate: Joi.date().required().allow(null),
  seatbeltInstallationCheckDate: Joi.boolean().required().allow(null),
  defects: Joi.array().items(defectsSchemaPut).required()
});

export const testTypesGroup3And4And8 = testTypesCommonSchema.keys({
  prohibitionIssued: Joi.boolean().required().allow(null)
});

export const testTypesGroup5And13 = testTypesCommonSchema.keys({
  certificateNumber: Joi.string().required().allow("", null),
  prohibitionIssued: Joi.boolean().required().allow(null)
});

export const testTypesGroup6And11 = testTypesCommonSchema.keys({
  certificateNumber: Joi.string().required().allow("", null),
  defects: Joi.array().items(defectsSchemaPut).required()
});

export const testTypesGroup7 = testTypesCommonSchema.keys({
  certificateNumber: Joi.string().required().allow("", null),
  testExpiryDate: Joi.date().iso().allow(null),
  prohibitionIssued: Joi.boolean().required().allow(null)
});

export const testTypesGroup9And10 = testTypesCommonSchema.keys({
  certificateNumber: Joi.string().required().allow("", null),
  testExpiryDate: Joi.date().iso().allow(null),
  testAnniversaryDate: Joi.date().iso().required().allow(null),
  defects: Joi.array().items(defectsSchemaPut).required()
});

export const testTypesGroup12And14 = testTypesCommonSchema.keys({
  defects: Joi.array().items(defectsSchemaPut).required()
});

export const testTypesGroup15And16 = testTypesCommonSchema.keys({
  certificateNumber: Joi.string().required().allow("", null),
  testExpiryDate: Joi.date().iso().allow(null),
  modType: Joi.object().keys({
    code: Joi.any().only(["p", "m", "g"]),
    description: Joi.any().only(["particulate trap", "modification or change of engine", "gas engine"])
  }).required().allow(null),
  emissionStandard: Joi.any().only(["0.10 g/kWh Euro 3 PM", "0.03 g/kWh Euro IV PM", "Euro 3", "Euro 4", "Euro 6", "Euro VI", "Full Electric"]).required().allow(null),
  fuelType: Joi.any().only(["diesel", "gas-cng", "gas-lng", "gas-lpg", "petrol", "fuel cell", "full electric"]).required().allow(null),
  particulateTrapSerialNumber: Joi.string().max(100).required().allow(null),
  modificationTypeUsed: Joi.string().max(100).required().allow(null),
  particulateTrapFitted: Joi.string().max(100).required().allow(null),
  smokeTestKLimitApplied: Joi.string().max(100).required().allow(null),
  prohibitionIssued: Joi.boolean().required().required().allow(null)
});
