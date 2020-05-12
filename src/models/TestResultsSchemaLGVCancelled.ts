import * as Joi from "joi";
import {testResultsCommonSchemaSpecialistTestsCancelled} from "./SpecialistTestsCommonSchemaCancelled";

const testResultsSchema = testResultsCommonSchemaSpecialistTestsCancelled.keys({
    vehicleSubclass: Joi.array().items(Joi.string()).required().allow(null)
});

export default testResultsSchema;
