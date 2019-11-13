import { TestResultsService } from "../../src/services/TestResultsService";
import fs from "fs";
import path from "path";
import * as dateFns from "date-fns";
import {cloneDeep} from "lodash";

describe("TestResultsService calling generateExpiryDate", () => {
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

    context("when inserting a testResult that is a vehicleType of hgv or trl and it contains at least one Roadworthiness test type and the test result on the Roadworthiness test type is pass", () => {
        it("then a testNumber is generated and the inserted test result should set the testNumber as the certificateNumber.", () => {
            const testPassedResultWithRoadworthinessTestType = cloneDeep(testResultsPostMock[6]);
            testPassedResultWithRoadworthinessTestType.testTypes[0].testTypeId = "122";
            testPassedResultWithRoadworthinessTestType.testTypes[0].testNumber = "W01A00209";
            testPassedResultWithRoadworthinessTestType.testTypes[0].testResult = "pass";

            expect.assertions(2);
            const updatedResult =  testResultsService.generateCertificateNumber(testPassedResultWithRoadworthinessTestType);
            expect(updatedResult.testTypes[0].testTypeId).toEqual("122");
            expect(updatedResult.testTypes[0].certificateNumber).toEqual("W01A00209");
        });
    });

    context("when inserting a testResult that is a vehicleType of trl and it contains at least one Roadworthiness test type and the test result on the Roadworthiness test type is pass", () => {
        it("then a testNumber is generated and the inserted test result should set the testNumber as the certificateNumber.", () => {
            const testPassedResultWithRoadworthinessTestType = cloneDeep(testResultsPostMock[6]);
            testPassedResultWithRoadworthinessTestType.testTypes[0].testTypeId = "91";
            testPassedResultWithRoadworthinessTestType.testTypes[0].testNumber = "W01A00209";
            testPassedResultWithRoadworthinessTestType.testTypes[0].testResult = "pass";

            expect.assertions(2);
            const updatedResult =  testResultsService.generateCertificateNumber(testPassedResultWithRoadworthinessTestType);
            expect(updatedResult.testTypes[0].testTypeId).toEqual("91");
            expect(updatedResult.testTypes[0].certificateNumber).toEqual("W01A00209");
        });
    });

});
