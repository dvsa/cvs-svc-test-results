import * as Joi from "joi";
import {testResultsCommonSchemaSpecialistTestsSubmitted} from "./SpecialistTestsCommonSchemaSubmitted";

const testResultsSchema = Joi.object().keys({
    ...testResultsCommonSchemaSpecialistTestsSubmitted,
    vehicleSubclass: Joi.array().items(Joi.string()).required().allow(null),
    euVehicleCategory: Joi.any().only(["n1"]).required().allow(null)
});

export default testResultsSchema;
