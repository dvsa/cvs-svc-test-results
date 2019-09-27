import { expect } from "chai";
import { TestResultsService } from "../../src/services/TestResultsService";
import fs, { promises } from "fs";
import path from "path";
import { HTTPError } from "../../src/models/HTTPError";
import { MESSAGES, ERRORS } from "../../src/assets/Enums";
import { ITestResultPayload } from "../../src/models/ITestResultPayload";
import { HTTPResponse } from "../../src/models/HTTPResponse";
import * as dateFns from "date-fns";

describe("TestResultsService calling setExpiryDateAndCertificateNumber", () => {
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

    context("cancelled test", () => {
        it("should return the payload", () => {
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            const mockData = testResultsMockDB[2];

            return testResultsService.setExpiryDateAndCertificateNumber(mockData)
                .then((response: any) => {
                    expect(response).to.deep.equal(mockData);
                });
        });

        it("should return the payload with expiry date prolonged by 1 year", () => {
            const mockData = testResultsMockDB[6];
            mockData.testTypes[0].testExpiryDate = new Date();
            const mockPayload = testResultsPostMock[3];
            mockPayload.testTypes[0].testTypeClassification = "Annual With Certificate";
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getByVin: () => {
                        return Promise.resolve({
                            Items: Array.of(mockData),
                            Count: 1,
                            ScannedCount: 1
                        });
                    },
                    getByTesterStaffId: () => {
                        return Promise.resolve({
                            Items: Array.of(mockData),
                            Count: 1,
                            ScannedCount: 1
                        });
                    },
                    getTestNumber: () => {
                        return Promise.resolve(mockData.testNumber);
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });
            testResultsService = new TestResultsService(new MockTestResultsDAO());

            const expectedExpiryDate = new Date();
            expectedExpiryDate.setFullYear(new Date().getFullYear() + 1);
            return testResultsService.setExpiryDateAndCertificateNumber(mockPayload)
                .then((response: any) => {
                    console.log("response", response.testTypes);
                    expect((response.testTypes[0].testExpiryDate).split("T")[0]).to.equal(dateFns.addYears(new Date(), 1).toISOString().split("T")[0]);
                });
        });
    });

    context("submitted test", () => {
        it('should set the expiryDate and the certificateNumber for "Annual With Certificate" testTypes with testResult "pass", "fail" or "prs"', () => {
            const mockData = testResultsMockDB[0];
            mockData.testTypes[2].testResult = "";
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            return testResultsService.setExpiryDateAndCertificateNumber(mockData)
                .then((response: ITestResultPayload) => {
                    const expectedExpiryDate = new Date();
                    expectedExpiryDate.setFullYear(new Date().getFullYear() + 1);
                    expectedExpiryDate.setDate(new Date().getDate() - 1);
                    expect((response.testTypes[0].testExpiryDate).split("T")[0]).to.equal(expectedExpiryDate.toISOString().split("T")[0]);
                    expect(response.testTypes[0].certificateNumber).to.equal(response.testTypes[0].testNumber);
                    expect(response.testTypes[1].testExpiryDate).to.equal(undefined);
                    expect(response.testTypes[1].certificateNumber).to.equal(undefined);
                    expect(response.testTypes[2].testExpiryDate).to.equal(undefined);
                    expect(response.testTypes[2].certificateNumber).to.equal(undefined);
                });
        });
    });

    context("no testTypes", () => {
        it("should throw an error", () => {
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            const mockData = {};

            return testResultsService.setExpiryDateAndCertificateNumber(mockData)
                .then(() => { expect.fail(); })
                .catch((error: any) => {
                    expect(error).to.not.equal(undefined);
                });
        });
    });
});

