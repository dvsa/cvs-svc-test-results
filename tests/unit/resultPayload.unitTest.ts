import { expect } from "chai";
import { TestResultsService } from "../../src/services/TestResultsService";
import fs, { promises } from "fs";
import path from "path";
import { HTTPError } from "../../src/models/HTTPError";
import { MESSAGES, ERRORS } from "../../src/assets/Enums";
import { ITestResultPayload } from "../../src/models/ITestResultPayload";
import { HTTPResponse } from "../../src/models/HTTPResponse";

describe("TestResultsService", () => {
    let testResultsService: TestResultsService | any;
    let MockTestResultsDAO: jest.Mock;
    let testResultsMockDB: any;
    let testResultsPostMock: any;

    beforeEach(() => {
        testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
        testResultsPostMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-post.json"), "utf8"));
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {};
        });
        testResultsService = new TestResultsService(new MockTestResultsDAO());
    });

    afterEach(() => {
        testResultsMockDB = null;
        testResultsService = null;
        MockTestResultsDAO.mockReset();
    });

    context("calling fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryresultsPayload having defects other than advisory", () => {
        it("should add missing fields to defects", () => {
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            const mockData = testResultsMockDB[4];

            const result = testResultsService.fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(mockData);
            expect(result.result).to.equal(true);
        });
    });

    context("calling reasonForAbandoningPresentOnAllAbandonedTests with abandoned testTypes", () => {
        it("should return whether all have reasonForAbandoning or not", () => {
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            const mockData = testResultsMockDB[5];

            const result = testResultsService.reasonForAbandoningPresentOnAllAbandonedTests(mockData);
            expect(result).to.equal(false);
        });
    });
});

