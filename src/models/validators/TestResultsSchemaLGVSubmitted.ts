import { string, array } from 'joi';
import {
  defectsCommonSchemaSpecialistTestsSubmitted,
  testResultsCommonSchemaSpecialistTestsSubmitted,
  testTypesCommonSchemaSpecialistTestsSubmitted,
} from './SpecialistTestsCommonSchemaSubmitted';
import { requiredStandardsSchema } from './CommonSchema';

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
          requiredStandards: array().items(requiredStandardsSchema.required()).optional(),
        }),
      )
      .required(),
  });
