import * as Joi from "joi";

export const defectsCommonSchema = Joi.object().keys({
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
});

export const testTypesCommonSchema = Joi.object().keys({
    name: Joi.string().required(),
    testTypeName: Joi.string().required().allow(""),
    testTypeId: Joi.string().required().allow(""),
    testTypeStartTimestamp: Joi.date().iso().required(),
    certificateNumber: Joi.string().required().allow("", null),
    prohibitionIssued: Joi.boolean().required().allow(null),
    reasonForAbandoning: Joi.string().required().allow("", null),
    additionalNotesRecorded: Joi.string().max(500).required().allow("", null),
    additionalCommentsForAbandon: Joi.string().max(500).required().allow("", null),
    testExpiryDate:   Joi.date().when("testResult", {
        is: "pass",
        then:  Joi.date().iso().allow(null),
        otherwise: Joi.date().forbidden()
    }).allow(null),
    modType: Joi.object().keys({
        code: Joi.any().only(["p", "m", "g"]),
        description: Joi.any().only(["particulate trap", "modification or change of engine", "gas engine"])
    }).allow(null),
    customDefects: Joi.array().items(Joi.object().keys({
        referenceNumber: Joi.string().max(10).required(),
        defectName: Joi.string().max(200).required(),
        defectNotes: Joi.string().max(200).required().allow(null)
    })).required().allow(null),
    secondaryCertificateNumber: Joi.string().alphanum().max(20).required().allow(null),
    emissionStandard: Joi.any().only(["0.10 g/kWh Euro 3 PM", "0.03 g/kWh Euro IV PM", "Euro 3", "Euro 4", "Euro 6", "Euro VI", "Full Electric"]).allow(null),
    fuelType: Joi.any().only(["diesel", "gas-cng", "gas-lng", "gas-lpg", "petrol", "fuel cell", "full electric"]).allow(null),
    particulateTrapSerialNumber: Joi.string().max(100).allow(null),
    smokeTestKLimitApplied: Joi.string().max(100).allow(null),
    modificationTypeUsed: Joi.string().max(100).allow(null),
    particulateTrapFitted: Joi.string().max(100).allow(null)
});

export const testResultsCommonSchema = Joi.object().keys({
    testResultId: Joi.string().required(),
    systemNumber: Joi.string().required(),
    vin: Joi.string().min(1).max(21).required(),
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
        code: Joi.any().only(["1", "2", "3", "n", "s", "t", "l", "v", "4", "5", "7", "p", "u"]).allow(null),
        description: Joi.any().only([
            "motorbikes up to 200cc",
            "motorbikes over 200cc or with a sidecar",
            "3 wheelers",
            "not applicable",
            "small psv (ie: less than or equal to 22 seats)",
            "trailer",
            "large psv(ie: greater than 23 seats)",
            "heavy goods vehicle",
            "MOT class 4",
            "MOT class 5",
            "MOT class 7",
            "PSV of unknown or unspecified size",
            "Not Known"
        ]).allow(null)
    }).allow(null),
    vehicleType: Joi.any().only(["psv", "hgv", "trl", "car", "lgv", "motorcycle"]).required(),
    noOfAxles: Joi.number().max(99).required(),
    preparerId: Joi.string().required().allow("", null),
    preparerName: Joi.string().required().allow("", null),
    numberOfWheelsDriven: Joi.number().required().allow(null),
    regnDate: Joi.string().allow("", null),
    firstUseDate: Joi.string().allow("", null),
    euVehicleCategory: Joi.any().only(["m1", "m2", "m3", "n1", "n2", "n3", "o1", "o2", "o3", "o4", "l1e-a", "l1e", "l2e", "l3e", "l4e", "l5e", "l6e", "l7e"]).required().allow(null),
    reasonForCreation: Joi.string().max(100).optional(),
    createdAt: Joi.string().optional().allow(null),
    createdByName: Joi.string().optional(),
    createdById: Joi.string().optional(),
    lastUpdatedAt: Joi.string().optional().allow(null),
    lastUpdatedByName: Joi.string().optional(),
    lastUpdatedById: Joi.string().optional(),
    shouldEmailCertificate: Joi.string().optional()
});

