import * as Joi from 'joi';
import { testResultsCommonSchemaSpecialistTestsCancelled } from './SpecialistTestsCommonSchemaCancelled';

export const lgvCancelled =
  testResultsCommonSchemaSpecialistTestsCancelled.keys({
    vehicleSubclass: Joi.array().items(Joi.string()).required().allow(null),
  });
