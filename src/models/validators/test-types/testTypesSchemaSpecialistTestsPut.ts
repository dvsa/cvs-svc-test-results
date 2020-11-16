import * as Joi from "joi";

export const testTypesCommonSchemaSpecialistTests = Joi.object().keys({
  name: Joi.string().required(),
  testTypeName: Joi.string().required(),
  testTypeId: Joi.string().required(),
  testTypeStartTimestamp: Joi.date().iso().required(),
  testTypeEndTimestamp: Joi.date().iso().required(),
  testResult: Joi.any().only(["fail", "pass", "prs", "abandoned"]).required(),
  prohibitionIssued: Joi.boolean().required(),
  reasonForAbandoning: Joi.string().when("$hasTestResult", {
    is: "abandoned",
    then:  Joi.string().required(),
    otherwise: Joi.string().optional().allow(null)
  }),
  additionalNotesRecorded: Joi.string().max(500).allow("", null),
  additionalCommentsForAbandon: Joi.string().max(500).allow("", null),
  customDefects: Joi.array().items(Joi.object().keys({
    referenceNumber: Joi.string().max(10).required(),
    defectName: Joi.string().max(200).required(),
    defectNotes: Joi.string().max(200).required()
  })).required(),
  testCode: Joi.string().required(),
  testNumber: Joi.string().required(),
  createdAt: Joi.string().optional(),
  lastUpdatedAt: Joi.string().optional(),
  certificateLink: Joi.string().optional(),
  testTypeClassification: Joi.string().required()
}).required();

export const testTypesSpecialistGroup1 = testTypesCommonSchemaSpecialistTests.keys({
  certificateNumber: Joi.string().required()
});

export const testTypesSpecialistGroup2 = testTypesCommonSchemaSpecialistTests.keys({
  certificateNumber: Joi.string().required(),
  secondaryCertificateNumber: Joi.string().alphanum().max(20).required(),
  testExpiryDate: Joi.date().iso().required(),
  testAnniversaryDate: Joi.date().iso().required(),
  numberOfSeatbeltsFitted: Joi.number().required(),
  lastSeatbeltInstallationCheckDate: Joi.date().required(),
  seatbeltInstallationCheckDate: Joi.boolean().required()
});

export const testTypesSpecialistGroup3 = testTypesCommonSchemaSpecialistTests.keys({
  secondaryCertificateNumber: Joi.string().alphanum().max(20).required()
});

export const testTypesSpecialistGroup4 = testTypesCommonSchemaSpecialistTests.keys({
  secondaryCertificateNumber: Joi.string().alphanum().max(20).required(),
  numberOfSeatbeltsFitted: Joi.number().required(),
  lastSeatbeltInstallationCheckDate: Joi.date().required(),
  seatbeltInstallationCheckDate: Joi.boolean().required()
});

export const testTypesSpecialistGroup5 = testTypesCommonSchemaSpecialistTests;
