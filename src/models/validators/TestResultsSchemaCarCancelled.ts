import * as Joi from 'joi';
import { testResultsCommonSchemaSpecialistTestsCancelled } from './SpecialistTestsCommonSchemaCancelled';

export const carCancelled =
  testResultsCommonSchemaSpecialistTestsCancelled.keys({
    vehicleSubclass: Joi.array().items(Joi.string()).required().allow(null),
  });
