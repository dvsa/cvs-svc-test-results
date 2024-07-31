import * as Joi from 'joi';
import { defectsCommonSchemaSpecialistTestsSubmitted } from '../SpecialistTestsCommonSchemaSubmitted';
import { requiredStandardsSchema } from '../CommonSchema';

export const testTypesCommonSchemaSpecialistTests = Joi.object()
  .keys({
    name: Joi.string().required(),
    testTypeName: Joi.string().required(),
    testTypeId: Joi.string().required(),
    testTypeStartTimestamp: Joi.date().iso().required(),
    testTypeEndTimestamp: Joi.date().iso().required(),
    testResult: Joi.string()
      .valid('fail', 'pass', 'prs', 'abandoned')
      .required(),
    prohibitionIssued: Joi.boolean().required(),
    reasonForAbandoning: Joi.string().when('$hasTestResult', {
      is: 'abandoned',
      then: Joi.string().required(),
      otherwise: Joi.string().optional().allow(null),
    }),
    additionalNotesRecorded: Joi.string().max(500).allow('', null),
    additionalCommentsForAbandon: Joi.string().max(500).allow('', null),
    customDefects: Joi.array()
      .items(
        Joi.object().keys({
          referenceNumber: Joi.string().max(10).optional(),
          defectName: Joi.string().max(200).required(),
          defectNotes: Joi.string().max(200).required(),
        }),
      )
      .required(),
    testCode: Joi.string().required(),
    testNumber: Joi.string().required(),
    createdAt: Joi.string().optional(),
    lastUpdatedAt: Joi.string().optional(),
    certificateLink: Joi.string().optional(),
    testTypeClassification: Joi.string().required(),
  })
  .required();

export const testTypesSpecialistGroup1 =
  testTypesCommonSchemaSpecialistTests.keys({
    certificateNumber: Joi.string().when('$hasTestResult', {
      is: 'pass',
      then: Joi.string().required(),
      otherwise: Joi.string().optional().allow('', null),
    }),
    defects: Joi.array()
      .items(defectsCommonSchemaSpecialistTestsSubmitted)
      .optional(),
    requiredStandards: Joi.array()
      .items(requiredStandardsSchema.required())
      .optional(),
  });

export const testTypesSpecialistGroup2 =
  testTypesCommonSchemaSpecialistTests.keys({
    certificateNumber: Joi.string().when('$hasTestResult', {
      is: 'pass',
      then: Joi.string().required(),
      otherwise: Joi.string().optional().allow('', null),
    }),

    secondaryCertificateNumber: Joi.string().when('$hasTestResult', {
      is: 'pass',
      then: Joi.string().alphanum().max(20).required(),
      otherwise: Joi.string().allow('', null),
    }),

    testExpiryDate: Joi.date().when('$hasTestResult', {
      is: 'pass',
      then: Joi.date().iso().required(),
      otherwise: Joi.date().iso().optional().allow('', null),
    }),

    testAnniversaryDate: Joi.date().when('$hasTestResult', {
      is: 'pass',
      then: Joi.date().iso().required(),
      otherwise: Joi.date().iso().optional().allow('', null),
    }),

    numberOfSeatbeltsFitted: Joi.number().required().allow(null),
    lastSeatbeltInstallationCheckDate: Joi.date().required().allow(null),
    seatbeltInstallationCheckDate: Joi.boolean().required().allow(null),
  });

export const testTypesSpecialistGroup3 =
  testTypesCommonSchemaSpecialistTests.keys({
    secondaryCertificateNumber: Joi.string().when('$hasTestResult', {
      is: 'pass',
      then: Joi.string().alphanum().max(20).required(),
      otherwise: Joi.string().allow('', null),
    }),
  });

export const testTypesSpecialistGroup4 =
  testTypesCommonSchemaSpecialistTests.keys({
    secondaryCertificateNumber: Joi.string().when('$hasTestResult', {
      is: 'pass',
      then: Joi.string().alphanum().max(20).required(),
      otherwise: Joi.string().allow('', null),
    }),
    numberOfSeatbeltsFitted: Joi.number().required().allow(null),
    lastSeatbeltInstallationCheckDate: Joi.date().required().allow(null),
    seatbeltInstallationCheckDate: Joi.boolean().required().allow(null),
  });

export const testTypesSpecialistGroup5 =
  testTypesCommonSchemaSpecialistTests.keys({
    defects: Joi.array()
      .items(defectsCommonSchemaSpecialistTestsSubmitted)
      .optional(),
    requiredStandards: Joi.array()
      .items(requiredStandardsSchema.required())
      .optional(),
  });
