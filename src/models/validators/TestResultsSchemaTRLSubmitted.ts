import * as Joi from "joi";
import {defectsCommonSchema, testTypesCommonSchema, testResultsCommonSchema} from "./CommonSchema";

const defectsSchema = defectsCommonSchema.keys({
    additionalInformation: Joi.object().keys({
        location: Joi.object().keys({
            vertical: Joi.any().only(["upper", "lower"]).required().allow(null),
            horizontal: Joi.any().only(["inner", "outer"]).required().allow(null),
            lateral: Joi.any().only(["nearside", "centre", "offside", "rear"]).required().allow(null),
            longitudinal: Joi.any().only(["front", "rear"]).required().allow(null),
            rowNumber: Joi.number().max(20).required().allow(null),
            seatNumber: Joi.number().max(6).required().allow(null),
            axleNumber: Joi.number().max(10).required().allow(null)
        }).required().allow(null),
        notes: Joi.string().max(500).required().allow("", null)
    }).required().allow(null)
});

const testTypesSchema = testTypesCommonSchema.keys({
    testTypeEndTimestamp: Joi.date().iso().required(),
    testResult: Joi.any().only(["fail", "pass", "prs", "abandoned"]).required(),
    testExpiryDate: Joi.date().iso().allow(null),
    defects: Joi.array().items(defectsSchema).required()
});

export const trlSubmitted = testResultsCommonSchema.keys({
    reasonForCancellation: Joi.string().max(500).required().allow("", null),
    countryOfRegistration: Joi.string().required().allow("", null),
    vehicleConfiguration: Joi.any().only(["rigid", "articulated", "centre axle drawbar", "semi-car transporter", "semi-trailer", "low loader", "other", "drawbar", "four-in-line", "dolly", "full drawbar"]).required(),
    trailerId: Joi.string().required(),
    testTypes: Joi.array().items(testTypesSchema).required(),
    firstUseDate: Joi.string().allow("", null)
});
