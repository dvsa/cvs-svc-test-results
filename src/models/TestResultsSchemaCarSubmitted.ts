import * as Joi from "joi";
import {testTypesCommonSchemaSpecialistTestsSubmitted, testResultsCommonSchemaSpecialistTestsSubmitted} from "./SpecialistTestsCommonSchemaSubmitted";

const testResultsSchema = Joi.object().keys({
    ...testResultsCommonSchemaSpecialistTestsSubmitted,
    vehicleSubclass: Joi.array().items(Joi.string()).required().allow(null),
    euVehicleCategory: Joi.any().only(["m1"]).required().allow(null),
    testTypes: Joi.array().items(Joi.object().keys({
        ...testTypesCommonSchemaSpecialistTestsSubmitted
    })).required()
});

export default testResultsSchema;
