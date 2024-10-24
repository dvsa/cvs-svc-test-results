import * as Joi from 'joi';
import { TestStationTypes } from "@dvsa/cvs-type-definitions/types/v1/enums/testStationType.enum";
import { VEHICLE_TYPES } from '../../assets/Enums';

const baseTestTypesCommonSchema = Joi.object().keys({
  name: Joi.string().required(),
  testTypeName: Joi.string().required().allow('', null),
  testTypeId: Joi.string().required().allow(''),
  testTypeStartTimestamp: Joi.date().iso().required(),
  certificateNumber: Joi.string().required().allow('', null),
  prohibitionIssued: Joi.boolean().required().allow(null),
  reasonForAbandoning: Joi.string().required().allow('', null),
  additionalNotesRecorded: Joi.string().max(500).required().allow('', null),
  additionalCommentsForAbandon: Joi.string()
    .max(500)
    .required()
    .allow('', null),
  testExpiryDate: Joi.date()
    .when('testResult', {
      is: 'pass',
      then: Joi.date().iso().allow(null),
      otherwise: Joi.date().allow(null, ''),
    })
    .allow(null),
  modType: Joi.object()
    .keys({
      code: Joi.string().valid('p', 'm', 'g'),
      description: Joi.string().valid(
        'particulate trap',
        'modification or change of engine',
        'gas engine',
      ),
    })
    .allow(null),
  secondaryCertificateNumber: Joi.string()
    .alphanum()
    .max(20)
    .required()
    .allow(null),
  emissionStandard: Joi.string()
    .valid(
      '0.10 g/kWh Euro 3 PM',
      '0.03 g/kWh Euro IV PM',
      'Euro 3',
      'Euro 4',
      'Euro 5',
      'Euro 6',
      'Euro V',
      'Euro VI',
      'Full Electric',
    )
    .allow(null),
  fuelType: Joi.string()
    .valid(
      'diesel',
      'gas-cng',
      'gas-lng',
      'gas-lpg',
      'petrol',
      'fuel cell',
      'full electric',
    )
    .allow(null),
  particulateTrapSerialNumber: Joi.string().max(100).allow(null),
  smokeTestKLimitApplied: Joi.string().max(100).allow(null),
  modificationTypeUsed: Joi.string().max(100).allow(null),
  particulateTrapFitted: Joi.string().max(100).allow(null),
});

export const requiredStandardsSchema = Joi.object({
  sectionNumber: Joi.string().required(),
  sectionDescription: Joi.string().required(),
  additionalNotes: Joi.string().allow('', null).optional(),
  rsNumber: Joi.number().required(),
  requiredStandard: Joi.string().required(),
  refCalculation: Joi.string().required(),
  additionalInfo: Joi.boolean().required(),
  inspectionTypes: Joi.array()
    .items(Joi.string().valid('basic', 'normal'))
    .max(2)
    .required(),
  prs: Joi.boolean().required(),
});

export const defectsCommonSchema = Joi.object().keys({
  imNumber: Joi.number().required(),
  imDescription: Joi.string().required().allow('', null),
  itemNumber: Joi.number().required(),
  itemDescription: Joi.string().required().allow('', null),
  deficiencyRef: Joi.string().required().allow('', null),
  deficiencyId: Joi.string()
    .regex(/^[a-z]+$/)
    .max(1)
    .required()
    .allow(null),
  deficiencySubId: Joi.string()
    .regex(/^[mdclxvi]+$/)
    .required()
    .allow(null),
  deficiencyCategory: Joi.string()
    .valid('advisory', 'dangerous', 'major', 'minor')
    .required(),
  deficiencyText: Joi.string().required().allow('', null),
  stdForProhibition: Joi.boolean().required().allow(null),
  prohibitionIssued: Joi.boolean().required().allow(null),
  prs: Joi.boolean().required().allow(null),
});

export const testTypesCommonSchema = baseTestTypesCommonSchema.keys({
  customDefects: Joi.array()
    .items(
      Joi.object().keys({
        referenceNumber: Joi.string().max(10).optional(),
        defectName: Joi.string().max(200).required(),
        defectNotes: Joi.string().max(200).required().allow(null),
      }),
    )
    .required()
    .allow(null),
});

export const testTypesSpecialistSchema = baseTestTypesCommonSchema.keys({
  customDefects: Joi.array()
    .items(
      Joi.object().keys({
        referenceNumber: Joi.string().max(10).optional(),
        defectName: Joi.string().max(200).required(),
        defectNotes: Joi.string().max(200).required().allow(null),
      }),
    )
    .required()
    .allow(null),
});

export const testResultsCommonSchema = Joi.object().keys({
  testResultId: Joi.string().required(),
  systemNumber: Joi.string().required(),
  vin: Joi.string().min(1).max(21).required(),
  testStationName: Joi.string().max(999).required().allow('', null),
  testStationPNumber: Joi.string().max(20).required().allow('', null),
  testStationType: Joi.string().valid(...Object.values(TestStationTypes)).required(),
  testerName: Joi.string().max(60).required().allow('', null),
  testerEmailAddress: Joi.string().max(60).required().allow('', null),
  testerStaffId: Joi.string().max(36).required().allow(''),
  testStartTimestamp: Joi.date().iso().required(),
  testEndTimestamp: Joi.date().iso().required(),
  testStatus: Joi.string().valid('submitted', 'cancelled').required(),
  vehicleClass: Joi.object()
    .keys({
      code: Joi.string()
        .valid('1', '2', '3', 'n', 's', 't', 'l', 'v', '4', '5', '7', 'p', 'u')
        .allow(null),
      description: Joi.string()
        .valid(
          'motorbikes up to 200cc',
          'motorbikes over 200cc or with a sidecar',
          '3 wheelers',
          'not applicable',
          'small psv (ie: less than or equal to 22 seats)',
          'trailer',
          'large psv(ie: greater than 23 seats)',
          'heavy goods vehicle',
          'MOT class 4',
          'MOT class 5',
          'MOT class 7',
          'PSV of unknown or unspecified size',
          'Not Known',
        )
        .allow(null),
    })
    .allow(null),
  vehicleType: Joi.string()
    .valid(...Object.values(VEHICLE_TYPES))
    .required(),
  noOfAxles: Joi.number().max(99).required(),
  preparerId: Joi.string().required().allow('', null),
  preparerName: Joi.string().required().allow('', null),
  numberOfWheelsDriven: Joi.number().required().allow('', null),
  regnDate: Joi.string().allow('', null),
  firstUseDate: Joi.string().allow('', null),
  euVehicleCategory: Joi.string()
    .valid(
      'm1',
      'm2',
      'm3',
      'n1',
      'n2',
      'n3',
      'o1',
      'o2',
      'o3',
      'o4',
      'l1e-a',
      'l1e',
      'l2e',
      'l3e',
      'l4e',
      'l5e',
      'l6e',
      'l7e',
    )
    .required()
    .allow(null),
  reasonForCreation: Joi.string().max(100).optional(),
  createdAt: Joi.string().optional().allow(null),
  createdByEmailAddress: Joi.string().optional(),
  createdByName: Joi.string().optional(),
  createdById: Joi.string().optional(),
  lastUpdatedAt: Joi.string().optional().allow(null),
  lastUpdatedByEmailAddress: Joi.string().optional(),
  lastUpdatedByName: Joi.string().optional(),
  lastUpdatedById: Joi.string().optional(),
  shouldEmailCertificate: Joi.string().optional(),
  contingencyTestNumber: Joi.string()
    .max(8)
    .min(6)
    .regex(/^\d{6,8}$/)
    .optional(),
  typeOfTest: Joi.string()
    .valid('contingency', 'desk-based', 'completion')
    .optional(),
  source: Joi.string().valid('vta', 'vtm').optional(),
  make: Joi.string().optional().allow(null),
  model: Joi.string().optional().allow(null),
  bodyType: Joi.object()
    .keys({
      code: Joi.string().optional().allow(null),
      description: Joi.string().optional().allow(null),
    })
    .optional()
    .allow(null),
});
