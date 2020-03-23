import {TestResultsService} from "../../src/services/TestResultsService";
import {HTTPError} from "../../src/models/HTTPError";
import testResults from "../resources/test-results.json";
import {MESSAGES} from "../../src/assets/Enums";
import {cloneDeep} from "lodash";

describe("updateTestResults", () => {
    let testResultsService: TestResultsService | any;
    let MockTestResultsDAO: jest.Mock;
    let testResultsMockDB: any;
    let testToUpdate: any;
    const msUserDetails = {
        msUser: "dorel",
        msOid: "123456"
    };
    beforeEach(() => {
        testResultsMockDB = testResults;
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {};
        });
        testResultsService = new TestResultsService(new MockTestResultsDAO());
        testToUpdate = cloneDeep(testResultsMockDB[30]);
        testToUpdate.countryOfRegistration = "gb";
        delete testToUpdate.testTypes[0].testTypeClassification;
    });

    afterEach(() => {
        testResultsMockDB = null;
        testResultsService = null;
        testToUpdate = null;
        MockTestResultsDAO.mockReset();
    });

    context("when trying to update a test-result", () => {
        context("and the payload is valid", () => {
            context("and the test-result is found", () => {
                it("should return the updated test-result", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            updateTestResult: () => {
                                return Promise.resolve({});
                            },
                            getBySystemNumber: () => {
                                return Promise.resolve({
                                    Items: Array.of(cloneDeep(testToUpdate)),
                                    Count: 1
                                });
                            }
                        };
                    });

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    expect.assertions(9);
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                        .then((returnedRecord: any) => {
                            expect(returnedRecord).not.toEqual(undefined);
                            expect(returnedRecord).not.toEqual({});
                            expect(returnedRecord).toHaveProperty("createdAt");
                            expect(returnedRecord).toHaveProperty("createdById");
                            expect(returnedRecord).toHaveProperty("createdByName");
                            expect(returnedRecord).toHaveProperty("testVersion");
                            expect(returnedRecord.testVersion).toEqual("current");
                            expect(returnedRecord).toHaveProperty("testHistory");
                            expect(returnedRecord.testHistory[0].testVersion).toEqual("archived");
                        });
                });
            });

            context("when updateTestResultDAO throws error", () => {
                it("should throw an error 500-Internal Error", () => {
                    const existingTest = cloneDeep(testToUpdate);
                    existingTest.testHistory = ["previously archived test"];
                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            updateTestResult: () => {
                                return Promise.reject({statusCode: 500, message: MESSAGES.INTERNAL_SERVER_ERROR});
                            },
                            getBySystemNumber: () => {
                                return Promise.resolve({
                                    Items: Array.of(existingTest),
                                    Count: 1
                                });
                            }
                        };
                    });

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    expect.assertions(3);
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                        .catch((errorResponse: { statusCode: any; body: any; }) => {
                            expect(errorResponse).toBeInstanceOf(HTTPError);
                            expect(errorResponse.statusCode).toEqual(500);
                            expect(errorResponse.body).toEqual(MESSAGES.INTERNAL_SERVER_ERROR);
                        });
                });
            });

            context("when no data was found", () => {
                it("should throw an error 404-No resources match the search criteria", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            getBySystemNumber: () => {
                                return Promise.resolve({
                                    Items: [],
                                    Count: 0
                                });
                            }
                        };
                    });

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    expect.assertions(3);
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                        .catch((errorResponse: { statusCode: any; body: any; }) => {
                            expect(errorResponse).toBeInstanceOf(HTTPError);
                            expect(errorResponse.statusCode).toEqual(404);
                            expect(errorResponse.body).toEqual("No resources match the search criteria");
                        });
                });
            });

            context("when could not uniquely identify the test to update", () => {
                it("should throw an error 404-No resources match the search criteria", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            getBySystemNumber: () => {
                                return Promise.resolve({
                                    Items: Array.of(testResultsMockDB[0]),
                                    Count: 1
                                });
                            }
                        };
                    });

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    expect.assertions(3);
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                        .catch((errorResponse: { statusCode: any; body: any; }) => {
                            expect(errorResponse).toBeInstanceOf(HTTPError);
                            expect(errorResponse.statusCode).toEqual(404);
                            expect(errorResponse.body).toEqual("No resources match the search criteria");
                        });
                });
            });
        });

        context("and the payload is invalid", () => {
            context("and an attempt to update a test without a mandatory field is done", () => {
                it("should return error 400 Invalid payload", () => {
                MockTestResultsDAO = jest.fn().mockImplementation(() => {
                    return {
                        updateTestResult: () => {
                            return Promise.resolve({});
                        },
                        getBySystemNumber: () => {
                            return Promise.resolve({
                                Items: Array.of(testToUpdate),
                                Count: 1
                            });
                        }
                    };
                });

                testResultsService = new TestResultsService(new MockTestResultsDAO());
                testToUpdate.vehicleType = "trl";
                return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                    .catch((errorResponse: { statusCode: any; body: any; }) => {
                        expect(errorResponse).toBeInstanceOf(HTTPError);
                        expect(errorResponse.statusCode).toEqual(400);
                        expect(errorResponse.body).toEqual({errors: ["\"trailerId\" is required"]});
                    });
                });
            });
            context("and an attempt to update a test with invalid values is done", () => {
                it("should return error 400 Invalid payload", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            updateTestResult: () => {
                                return Promise.resolve({});
                            },
                            getBySystemNumber: () => {
                                return Promise.resolve({
                                    Items: Array.of(testToUpdate),
                                    Count: 1
                                });
                            }
                        };
                    });

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    testToUpdate.euVehicleCategory = "invalid value";
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                      .catch((errorResponse: { statusCode: any; body: any; }) => {
                          expect(errorResponse).toBeInstanceOf(HTTPError);
                          expect(errorResponse.statusCode).toEqual(400);
                          expect(errorResponse.body).toEqual({errors: ["\"euVehicleCategory\" must be one of [m1, m2, m3, n1, n2, n3, o1, o2, o3, o4, l1e-a, l1e, l2e, l3e, l4e, l5e, l6e, l7e, null]"]});
                      });
                });
            });
            context("and an attempt to update a test with a field exceeding min/max length limit is done", () => {
                it("should return error 400 Invalid payload", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            updateTestResult: () => {
                                return Promise.resolve({});
                            },
                            getBySystemNumber: () => {
                                return Promise.resolve({
                                    Items: Array.of(testToUpdate),
                                    Count: 1
                                });
                            }
                        };
                    });

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    testToUpdate.testerStaffId = "invalid value exceeding size limit 123456789012343454";
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                      .catch((errorResponse: { statusCode: any; body: any; }) => {
                          expect(errorResponse).toBeInstanceOf(HTTPError);
                          expect(errorResponse.statusCode).toEqual(400);
                          expect(errorResponse.body).toEqual({errors: ["\"testerStaffId\" length must be less than or equal to 36 characters long"]});
                      });
                });
            });
        });

        context("and when validating test types", () => {
            context("and the test type contains a field that is not applicable", () => {
                it("should return validation Error 400", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation();

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    testToUpdate = testResultsMockDB[1];
                    expect.assertions(3);
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                      .catch((errorResponse: { statusCode: any; body: any; }) => {
                          expect(errorResponse).toBeInstanceOf(HTTPError);
                          expect(errorResponse.statusCode).toEqual(400);
                          expect(errorResponse.body.errors[0]).toEqual(["\"prohibitionIssued\" is not allowed", "\"certificateNumber\" is not allowed"]);
                      });
                });
            });

            context("and when the testTypeId is unknown", () => {
                it("should return validation Error 400", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation();

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    testToUpdate = testResultsMockDB[30];
                    testToUpdate.testTypes[0].testTypeId = "unknown";
                    expect.assertions(3);
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                      .catch((errorResponse: { statusCode: any; body: any; }) => {
                          expect(errorResponse).toBeInstanceOf(HTTPError);
                          expect(errorResponse.statusCode).toEqual(400);
                          expect(errorResponse.body.errors[0]).toEqual(["Unknown testTypeId"]);
                      });
                });
            });
        });
    });
});
