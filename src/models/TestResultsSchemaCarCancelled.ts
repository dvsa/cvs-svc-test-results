import * as Joi from "joi";
import {testResultsCommonSchemaSpecialistTestsCancelled} from "./SpecialistTestsCommonSchemaCancelled";


const testResultsSchema = Joi.object().keys({
    ...testResultsCommonSchemaSpecialistTestsCancelled,
    vehicleSubclass: Joi.array().items(Joi.string()).required().allow(null),
    euVehicleCategory: Joi.any().only(["m1"]).required().allow(null)
});

export default testResultsSchema;
