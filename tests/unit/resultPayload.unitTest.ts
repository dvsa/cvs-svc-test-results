import { ValidationUtil } from "../../src/utils/validationUtil";
import * as testResultsMockDB from "../resources/test-results.json";

describe("ValidationUtil", () => {
    context("calling fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryresultsPayload having defects other than advisory", () => {
        it("should add missing fields to defects", () => {
            const mockData = testResultsMockDB[4];
            // @ts-ignore
            const result = ValidationUtil.fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(mockData);
            expect(result).toContain("are null for a defect with deficiency category other than advisory");
        });
    });

    context("calling reasonForAbandoningPresentOnAllAbandonedTests with abandoned testTypes", () => {
        it("should return whether all have reasonForAbandoning or not", () => {
            const mockData = testResultsMockDB[5];
            // @ts-ignore
            const result = ValidationUtil.reasonForAbandoningPresentOnAllAbandonedTests(mockData);
            expect(result).toEqual(false);
        });
    });
});

