import * as Joi from "joi";
import {testResultsCommonSchemaSpecialistTestsSubmitted} from "./SpecialistTestsCommonSchemaSubmitted";

const testResultsSchema = testResultsCommonSchemaSpecialistTestsSubmitted.keys({
    vehicleSubclass: Joi.array().items(Joi.string()).required().allow(null)
});

export default testResultsSchema;
