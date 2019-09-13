import { expect } from "chai";
import { TestResultsService } from "../../src/services/TestResultsService";
import fs from "fs";
import path from "path";
import { ITestResultPayload } from "../../src/models/ITestResultPayload";
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

    context('submitted test', () => {
        context('for psv vehicle type', () => {
            it('should set the expiryDate and the certificateNumber for "Annual With Certificate" testTypes with testResult "pass", "fail" or "prs"', () => {
                let psvTestResult = testResultsMockDB[0]
                let getByVinResponse = testResultsMockDB[0]

                MockTestResultsDAO = jest.fn().mockImplementation(() => {
                    return {
                        getByVin: () => {
                            return Promise.resolve({
                                Items: Array.of(getByVinResponse),
                                Count: 1,
                                ScannedCount: 1
                            });
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
                expectedExpiryDate.setDate(new Date().getDate() - 1);
                return testResultsService.setExpiryDateAndCertificateNumber(psvTestResult)
                    .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                        expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split('T')[0]).to.equal(expectedExpiryDate.toISOString().split('T')[0]);
                        expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[0].certificateNumber).to.equal(psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testNumber);
                    });
            })
        })

        context('for hgv and trl vehicle types', () => {
            context('when there is no certificate issued for this vehicle', () => {
                it('should set the expiry date to last day of current month + 1 year', () => {
                    let hgvTestResult = testResultsMockDB[15]
                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            getByVin: () => {
                                return Promise.resolve({
                                    Items: [],
                                    Count: 0,
                                    ScannedCount: 0
                                });
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

                    const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1);
                    return testResultsService.setExpiryDateAndCertificateNumber(hgvTestResult)
                        .then((hgvTestResultWithExpiryDate: any) => {
                            expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).to.equal(expectedExpiryDate.toISOString().split("T")[0])
                        })
                })
            })

            context('when there is a certificate issued for this vehicle that expired', () => {
                it('should set the expiry date to last day of current month + 1 year', () => {
                    let hgvTestResult = testResultsMockDB[15]
                    const pastExpiryDate = dateFns.subMonths(new Date(), 1);
                    const testResultExpiredCertificateWithSameVin = testResultsMockDB[15];
                    testResultExpiredCertificateWithSameVin.testTypes[0].testExpiryDate = pastExpiryDate

                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            getByVin: (vin: any) => {
                                return Promise.resolve({
                                    Items: Array.of(testResultExpiredCertificateWithSameVin),
                                    Count: 1,
                                    ScannedCount: 1
                                });
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

                const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1)
                return testResultsService.setExpiryDateAndCertificateNumber(hgvTestResult)
                    .then((hgvTestResultWithExpiryDate: any) => {
                        expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).to.equal(expectedExpiryDate.toISOString().split("T")[0])
                    })
                });
            })
        })
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
