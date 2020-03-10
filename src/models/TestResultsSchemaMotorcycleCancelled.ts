import * as Joi from "joi";
import {testResultsCommonSchemaSpecialistTestsCancelled} from "./SpecialistTestsCommonSchemaCancelled";

const testResultsSchema = Joi.object().keys({
    ...testResultsCommonSchemaSpecialistTestsCancelled,
});

export default testResultsSchema;
