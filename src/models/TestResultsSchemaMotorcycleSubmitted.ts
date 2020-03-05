import * as Joi from "joi";
import {testTypesCommonSchemaSpecialistTestsSubmitted, testResultsCommonSchemaSpecialistTestsSubmitted} from "./SpecialistTestsCommonSchemaSubmitted";

const testResultsSchema = Joi.object().keys({
    ...testResultsCommonSchemaSpecialistTestsSubmitted,
    euVehicleCategory: Joi.any().only(["l1e-a", "l1e", "l2e", "l3e", "l4e", "l5e", "l6e", "l7e"]).required().allow(null),
    testTypes: Joi.array().items(Joi.object().keys({
        ...testTypesCommonSchemaSpecialistTestsSubmitted
    })).required()
});

export default testResultsSchema;
