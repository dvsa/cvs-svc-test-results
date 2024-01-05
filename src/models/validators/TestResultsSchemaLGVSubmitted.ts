import { string, array } from 'joi';
import {
  defectsCommonSchemaSpecialistTestsSubmitted,
  ivaDefectSchema,
  testResultsCommonSchemaSpecialistTestsSubmitted,
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
          ivaDefects: array().items(ivaDefectSchema).required(),
        }),
      )
      .required(),
  });
