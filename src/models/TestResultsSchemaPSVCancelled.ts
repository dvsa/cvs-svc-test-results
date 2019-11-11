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
    })
});

const testTypesSchema = Joi.object().keys({
    ...testTypesCommonSchema,
    testTypeEndTimestamp: Joi.date().iso().required().allow(null),
    numberOfSeatbeltsFitted: Joi.number().required().allow(null),
    lastSeatbeltInstallationCheckDate: Joi.date().required().allow(null),
    seatbeltInstallationCheckDate: Joi.boolean().required().allow(null),
    testResult: Joi.any().only(["fail", "pass", "prs", "abandoned"]).required().allow(null),
    testExpiryDate:   Joi.date().when("testResult", {
        is: "pass",
        then:  Joi.date().iso(),
        otherwise: Joi.date().forbidden()
    }),
    defects: Joi.array().items(defectsSchema).required()
});

const testResultsSchema = Joi.object().keys({
    ...testResultsCommonSchema,
    vrm: Joi.string().alphanum().min(1).max(8).required(),
    reasonForCancellation: Joi.string().max(500).required().allow(""),
    numberOfSeats: Joi.number().required(),
    odometerReading: Joi.number().required().allow(null),
    odometerReadingUnits: Joi.any().only(["kilometres", "miles"]).required().allow(null),
    euVehicleCategory: Joi.any().only(["m1", "m2", "m3", "n1", "n2", "n3", "o1", "o2", "o3", "o4"]).required().allow(null),
    vehicleConfiguration: Joi.any().only(["rigid", "articulated"]).required(),
    countryOfRegistration: Joi.string().required().allow("", null),
    vehicleSize: Joi.any().only(["small", "large"]).required(),
    testTypes: Joi.array().items(testTypesSchema).required()
});

export default testResultsSchema;
