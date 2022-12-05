import * as Joi from 'joi';
import { testResultsCommonSchemaSpecialistTestsSubmitted } from './SpecialistTestsCommonSchemaSubmitted';

export const lgvSubmitted =
  testResultsCommonSchemaSpecialistTestsSubmitted.keys({
    vehicleSubclass: Joi.array().items(Joi.string()).required().allow(null),
  });
