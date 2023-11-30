import { any, array, object } from 'joi';
import {
  defectsCommonSchemaSpecialistTestsSubmitted,
  testResultsCommonSchemaSpecialistTestsSubmitted,
  testResultsIVADefectCommonSchemaSpecialistTestsSubmitted,
  testTypesCommonSchemaSpecialistTestsSubmitted,
} from './SpecialistTestsCommonSchemaSubmitted';

export const motorcycleSubmitted =
  testResultsCommonSchemaSpecialistTestsSubmitted.keys({
    vehicleClass: object()
      .keys({
        code: any()
          .only([
            '1',
            '2',
            '3',
            'n',
            's',
            't',
            'l',
            'v',
            '4',
            '5',
            '7',
            'p',
            'u',
          ])
          .required(),
        description: any().only([
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
        ]),
      })
      .required(),
    testTypes: array()
      .items(
        testTypesCommonSchemaSpecialistTestsSubmitted.keys({
          defects: array()
            .items(defectsCommonSchemaSpecialistTestsSubmitted)
            .optional(),
        }),
        testTypesCommonSchemaSpecialistTestsSubmitted.keys({
          ivaDefects: array()
            .items(testResultsIVADefectCommonSchemaSpecialistTestsSubmitted)
            .required(),
        }),
      )
      .required(),
  });
