import * as Joi from "joi";
import {defectsCommonSchema, testTypesCommonSchema, testResultsCommonSchema} from "./CommonSchema";

const defectsSchema = Joi.object().keys({
    ...defectsCommonSchema,
    additionalInformation: Joi.object().keys({
        location: Joi.object().keys({
            vertical: Joi.any().only(["upper", "lower"]).required().allow(null),
            horizontal: Joi.any().only(["inner", "outer"]).required().allow(null),
            lateral: Joi.any().only(["nearside", "centre", "offside"]).required().allow(null),
            longitudinal: Joi.any().only(["front", "rear"]).required().allow(null),
            rowNumber: Joi.number().max(20).required().allow(null),
            seatNumber: Joi.number().max(6).required().allow(null),
            axleNumber: Joi.number().max(10).required().allow(null)
        }).required().allow(null),
        notes: Joi.string().max(500).required().allow("", null)
    }).required().allow(null)
});

const testTypesSchema = Joi.object().keys({
    ...testTypesCommonSchema,
    testTypeEndTimestamp: Joi.date().iso().required(),
    testResult: Joi.any().only(["fail", "pass", "prs", "abandoned"]).required(),
    testExpiryDate: Joi.date().iso().allow(null),
    defects: Joi.array().items(defectsSchema).required()
});

const testResultsSchema = Joi.object().keys({
    ...testResultsCommonSchema,
    reasonForCancellation: Joi.string().max(500).required().allow("", null),
    euVehicleCategory: Joi.any().only(["m1", "m2", "m3", "n1", "n2", "n3", "o1", "o2", "o3", "o4"]).required(),
    countryOfRegistration: Joi.string().required().allow(""),
    vehicleConfiguration: Joi.any().only(["rigid", "articulated", "centre axle drawbar", "semi-car transporter", "semi-trailer", "low loader", "other", "drawbar", "four-in-line", "dolly", "full drawbar"]).required(),
    trailerId: Joi.string().required(),
    testTypes: Joi.array().items(testTypesSchema).required(),
    firstUseDate: Joi.string().allow("", null)
});

export default testResultsSchema;
