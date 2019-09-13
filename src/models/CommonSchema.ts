import * as Joi from "joi";

export const defectsCommonSchema = {
    imNumber: Joi.number().required(),
    imDescription: Joi.string().required().allow(""),
    itemNumber: Joi.number().required(),
    itemDescription: Joi.string().required().allow(""),
    deficiencyRef: Joi.string().required().allow(""),
    deficiencyId: Joi.string().regex(/^[a-z]+$/).max(1).required().allow(null),
    deficiencySubId: Joi.string().regex(/^[mdclxvi]+$/).required().allow(null),
    deficiencyCategory: Joi.any().only(["advisory", "dangerous", "major", "minor"]).required(),
    deficiencyText: Joi.string().required().allow("", null),
    stdForProhibition: Joi.boolean().required().allow(null),
    prohibitionIssued: Joi.boolean().required().allow(null),
    prs: Joi.boolean().required().allow(null)
};

export const testTypesCommonSchema = {
    name: Joi.string().required(),
    testTypeName: Joi.string().required().allow(""),
    testTypeId: Joi.string().required().allow(""),
    testTypeStartTimestamp: Joi.date().iso().required(),
    certificateNumber: Joi.string().required().allow("", null),
    prohibitionIssued: Joi.boolean().required().allow(null),
    reasonForAbandoning: Joi.string().required().allow("", null),
    additionalNotesRecorded: Joi.string().max(500).required().allow("", null),
    additionalCommentsForAbandon: Joi.string().max(500).required().allow("", null)
};

export const testResultsCommonSchema = {
    testResultId: Joi.string().required(),
    vin: Joi.string().alphanum().min(1).max(21).required(),
    testStationName: Joi.string().max(999).required().allow(""),
    testStationPNumber: Joi.string().max(20).required().allow(""),
    testStationType: Joi.any().only(["atf", "gvts", "hq"]).required(),
    testerName: Joi.string().max(60).required().allow(""),
    testerEmailAddress: Joi.string().max(60).required().allow(""),
    testerStaffId: Joi.string().max(36).required().allow(""),
    testStartTimestamp: Joi.date().iso().required(),
    testEndTimestamp: Joi.date().iso().required(),
    testStatus: Joi.any().only(["submitted", "cancelled"]).required(),
    vehicleClass: Joi.object().keys({
        code: Joi.any().only(["1", "2", "3", "n", "t", "l", "s", "v"]).required(),
        description: Joi.any().only(["motorbikes over 200cc or with a sidecar", "not applicable", "small psv (ie: less than or equal to 22 seats)", "motorbikes up to 200cc", "trailer", "large psv(ie: greater than 23 seats)", "3 wheelers", "heavy goods vehicle"]).required()
    }).required(),
    vehicleType: Joi.any().only(["psv", "hgv", "trl"]).required(),
    noOfAxles: Joi.number().max(99).required(),
    vehicleConfiguration: Joi.any().only(["rigid", "articulated"]).required(),
    preparerId: Joi.string().required().allow(""),
    preparerName: Joi.string().required().allow("")
};
