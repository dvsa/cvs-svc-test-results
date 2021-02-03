import * as Joi from "joi";
import {testResultsCommonSchemaSpecialistTestsSubmitted} from "./SpecialistTestsCommonSchemaSubmitted";

export const carSubmitted = testResultsCommonSchemaSpecialistTestsSubmitted.keys({
    vehicleSubclass: Joi.array().items(Joi.string()).required().allow(null)
});
