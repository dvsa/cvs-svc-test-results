import * as Joi from "joi";
import {testTypesCommonSchemaSpecialistTestsCancelled, testResultsCommonSchemaSpecialistTestsCancelled} from "./SpecialistTestsCommonSchemaCancelled";


const testResultsSchema = Joi.object().keys({
    ...testResultsCommonSchemaSpecialistTestsCancelled,
    vehicleSubclass: Joi.array().items(Joi.string()).required().allow(null),
    euVehicleCategory: Joi.any().only(["m1"]).required().allow(null),
    testTypes: Joi.array().items(Joi.object().keys({
        ...testTypesCommonSchemaSpecialistTestsCancelled
    })).required()
});

export default testResultsSchema;
