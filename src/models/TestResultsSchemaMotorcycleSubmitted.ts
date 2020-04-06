import * as Joi from "joi";
import {testResultsCommonSchemaSpecialistTestsSubmitted} from "./SpecialistTestsCommonSchemaSubmitted";

const testResultsSchema = Joi.object().keys({
    ...testResultsCommonSchemaSpecialistTestsSubmitted,
    vehicleClass: testResultsCommonSchemaSpecialistTestsSubmitted.vehicleClass.required(),
});

export default testResultsSchema;
