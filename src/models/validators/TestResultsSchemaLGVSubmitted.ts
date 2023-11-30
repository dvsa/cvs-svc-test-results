import { string, array } from 'joi';
import {
  defectsCommonSchemaSpecialistTestsSubmitted,
  testResultsCommonSchemaSpecialistTestsSubmitted,
  testResultsIVADefectCommonSchemaSpecialistTestsSubmitted,
  testTypesCommonSchemaSpecialistTestsSubmitted,
} from './SpecialistTestsCommonSchemaSubmitted';

export const lgvSubmitted =
  testResultsCommonSchemaSpecialistTestsSubmitted.keys({
    vehicleSubclass: array().items(string()).required().allow(null),
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
