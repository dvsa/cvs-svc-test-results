import * as Joi from "joi";
import {testResultsCommonSchemaSpecialistTestsCancelled} from "./SpecialistTestsCommonSchemaCancelled";

const testResultsSchema = Joi.object().keys({
    ...testResultsCommonSchemaSpecialistTestsCancelled,
    euVehicleCategory: Joi.any().only(["l1e-a", "l1e", "l2e", "l3e", "l4e", "l5e", "l6e", "l7e"]).required().allow(null)
});

export default testResultsSchema;
