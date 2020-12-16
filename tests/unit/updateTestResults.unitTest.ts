import {TestResultsService} from "../../src/services/TestResultsService";
import {HTTPError} from "../../src/models/HTTPError";
import testResults from "../resources/test-results.json";
import {ERRORS, MESSAGES} from "../../src/assets/Enums";
import {cloneDeep} from "lodash";
import { MappingUtil } from "../../src/utils/mappingUtil";
import { ValidationUtil } from "../../src/utils/validationUtil";

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
                            getActivity: () => {
                                return Promise.resolve([{
                                    startTime: "2018-03-22",
                                    endTime: "2020-04-22"
                                }]);
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

                context("when changing an attribute that requires new testCode", () => {
                    context("when changing an attribute on the test-type", () => {
                        it("should call getTestCodesAndClassificationFromTestTypes and return the new testCode", () => {
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    updateTestResult: () => {
                                        return Promise.resolve({});
                                    },
                                    getActivity: () => {
                                        return Promise.resolve([{
                                            startTime: "2018-03-22",
                                            endTime: "2020-04-22"
                                        }]);
                                    },
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: Array.of(cloneDeep(testToUpdate)),
                                            Count: 1
                                        });
                                    },
                                    getTestCodesAndClassificationFromTestTypes: () => {
                                        return Promise.resolve({
                                            defaultTestCode: "bde",
                                            testTypeClassification: "Annual With Certificate"
                                        });
                                    }
                                };
                            });

                            testResultsService = new TestResultsService(new MockTestResultsDAO());
                            const updatedPayload: any = cloneDeep(testResultsMockDB[30]);
                            updatedPayload.testTypes[0].testTypeName = "Another test type name";
                            expect.assertions(4);
                            return testResultsService.updateTestResult(updatedPayload.systemNumber, updatedPayload, msUserDetails)
                              .then((returnedRecord: any) => {
                                  expect(returnedRecord).not.toEqual(undefined);
                                  expect(returnedRecord).not.toEqual({});
                                  expect(returnedRecord.testTypes[0].testCode).toEqual("bde");
                                  expect(returnedRecord.testTypes[0].testTypeClassification).toEqual("Annual With Certificate");
                              });
                        });
                    });

                    context("when changing an attribute on the test-result object regarding vehicle details", () => {
                        it("should call getTestCodesAndClassificationFromTestTypes and return the new testCode", () => {
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    updateTestResult: () => {
                                        return Promise.resolve({});
                                    },
                                    getActivity: () => {
                                        return Promise.resolve([{
                                            startTime: "2018-03-22",
                                            endTime: "2020-04-22"
                                        }]);
                                    },
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: Array.of(cloneDeep(testToUpdate)),
                                            Count: 1
                                        });
                                    },
                                    getTestCodesAndClassificationFromTestTypes: () => {
                                        return Promise.resolve({
                                            defaultTestCode: "lbp",
                                            testTypeClassification: "Annual No Certificate"
                                        });
                                    }
                                };
                            });

                            testResultsService = new TestResultsService(new MockTestResultsDAO());
                            const updatedPayload: any = cloneDeep(testResultsMockDB[30]);
                            updatedPayload.euVehicleCategory = "n3";
                            updatedPayload.vehicleSize = "large";
                            updatedPayload.noOfAxles = "4";
                            expect.assertions(4);
                            return testResultsService.updateTestResult(updatedPayload.systemNumber, updatedPayload, msUserDetails)
                              .then((returnedRecord: any) => {
                                  expect(returnedRecord).not.toEqual(undefined);
                                  expect(returnedRecord).not.toEqual({});
                                  expect(returnedRecord.testTypes[0].testCode).toEqual("lbp");
                                  expect(returnedRecord.testTypes[0].testTypeClassification).toEqual("Annual No Certificate");
                              });
                        });
                    });

                });

                context("and when changing testTypeStartTimestamp", () => {
                    const errorMessageEndTime = "The testTypeEndTimestamp must be within the visit, between 2019-01-14T10:36:33.987Z and 2019-01-14T20:00:33.987Z";
                    const errorMessageStartTime = "The testTypeStartTimestamp must be within the visit, between 2019-01-14T10:36:33.987Z and 2019-01-14T20:00:33.987Z";
                    context("and the testTypeStartTimestamp is before the visit startTime", () => {
                        it("should return error 400 testTypeStartTimestamp must be within the visit", () => {
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getActivity: () => {
                                        return Promise.resolve([{
                                            startTime: "2019-01-14T10:36:33.987Z",
                                            endTime: "2019-01-14T20:00:33.987Z"
                                        }]);
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
                            testToUpdate.testTypes[0].testTypeStartTimestamp = "2019-01-13T08:36:33.987Z";
                            expect.assertions(3);
                            return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                              .catch((errorResponse: { statusCode: any; body: any; }) => {
                                  expect(errorResponse).toBeInstanceOf(HTTPError);
                                  expect(errorResponse.statusCode).toEqual(400);
                                  expect(errorResponse.body).toEqual(errorMessageStartTime);
                              });
                        });
                    });

                    context("and the testTypeStartTimestamp is after the visit endTime", () => {
                        it("should return error 400 testTypeStartTimestamp must be within the visit", () => {
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getActivity: () => {
                                        return Promise.resolve([{
                                            startTime: "2019-01-14T10:36:33.987Z",
                                            endTime: "2019-01-14T20:00:33.987Z"
                                        }]);
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
                            testToUpdate.testTypes[0].testTypeStartTimestamp = "2019-01-14T21:00:33.987Z";
                            expect.assertions(3);
                            return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                              .catch((errorResponse: { statusCode: any; body: any; }) => {
                                  expect(errorResponse).toBeInstanceOf(HTTPError);
                                  expect(errorResponse.statusCode).toEqual(400);
                                  expect(errorResponse.body).toEqual(errorMessageStartTime);
                              });
                        });
                    });

                    context("and the testTypeEndTimestamp is before the visit startTime", () => {
                        it("should return error 400 testTypeStartTimestamp must be within the visit", () => {
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getActivity: () => {
                                        return Promise.resolve([{
                                            startTime: "2019-01-14T10:36:33.987Z",
                                            endTime: "2019-01-14T20:00:33.987Z"
                                        }]);
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
                            testToUpdate.testTypes[0].testTypeEndTimestamp = "2019-01-13T18:00:33.987Z";
                            expect.assertions(3);
                            return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                              .catch((errorResponse: { statusCode: any; body: any; }) => {
                                  expect(errorResponse).toBeInstanceOf(HTTPError);
                                  expect(errorResponse.statusCode).toEqual(400);
                                  expect(errorResponse.body).toEqual(errorMessageEndTime);
                              });
                        });
                    });

                    context("and the testTypeEndTimestamp is after the visit endTime", () => {
                        it("should return error 400 testTypeStartTimestamp must be within the visit", () => {
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getActivity: () => {
                                        return Promise.resolve([{
                                            startTime: "2019-01-14T10:36:33.987Z",
                                            endTime: "2019-01-14T20:00:33.987Z"
                                        }]);
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
                            testToUpdate.testTypes[0].testTypeEndTimestamp = "2019-01-15T18:00:33.987Z";
                            expect.assertions(3);
                            return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                              .catch((errorResponse: { statusCode: any; body: any; }) => {
                                  expect(errorResponse).toBeInstanceOf(HTTPError);
                                  expect(errorResponse.statusCode).toEqual(400);
                                  expect(errorResponse.body).toEqual(errorMessageEndTime);
                              });
                        });
                    });

                    context("and the testTypeStartTimestamp is after the testTypeStartTimestamp", () => {
                        it("should return error 400 testTypeStartTimestamp must be before testTypeEndTimestamp", () => {
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getActivity: () => {
                                        return Promise.resolve([{
                                            startTime: "2019-01-14T10:36:33.987Z",
                                            endTime: "2019-01-14T20:00:33.987Z"
                                        }]);
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
                            testToUpdate.testTypes[0].testTypeEndTimestamp = "2019-01-14T16:00:33.987Z";
                            testToUpdate.testTypes[0].testTypeStartTimestamp = "2019-01-14T18:00:33.987Z";
                            expect.assertions(3);
                            return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                              .catch((errorResponse: { statusCode: any; body: any; }) => {
                                  expect(errorResponse).toBeInstanceOf(HTTPError);
                                  expect(errorResponse.statusCode).toEqual(400);
                                  expect(errorResponse.body).toEqual(ERRORS.StartTimeBeforeEndTime);
                              });
                        });
                    });

                    context("and the getActivity function returns more than one activity", () => {
                        it("should return error 500 No unique activity found", () => {
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getActivity: () => {
                                        return Promise.resolve(["firstActivity", "secondActivity"]);
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
                            expect.assertions(3);
                            return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                              .catch((errorResponse: { statusCode: any; body: any; }) => {
                                  expect(errorResponse).toBeInstanceOf(HTTPError);
                                  expect(errorResponse.statusCode).toEqual(500);
                                  expect(errorResponse.body).toEqual(ERRORS.NoUniqueActivityFound);
                              });
                        });
                    });

                    context("and the getActivity function throws an error different from 404", () => {
                        it("should return Error Activities microservice error", () => {
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getActivity: () => {
                                        return Promise.reject({statusCode: 400, body: ERRORS.EventIsEmpty});
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
                            expect.assertions(3);
                            return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                              .catch((errorResponse: { statusCode: any; body: any; }) => {
                                  expect(errorResponse).toBeInstanceOf(HTTPError);
                                  expect(errorResponse.statusCode).toEqual(400);
                                  expect(errorResponse.body).toEqual(`Activities microservice error: ${ERRORS.EventIsEmpty}`);
                              });
                        });
                    });

                    context("and the getActivity function throws a 404 Not Found error", () => {
                        it("should skip the validation for testTypeStart/EndTimestamp and accept the values from the payload", () => {
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getActivity: () => {
                                        return Promise.reject({statusCode: 404, body: ERRORS.NoResourceMatch});
                                    },
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: Array.of(cloneDeep(testToUpdate)),
                                            Count: 1
                                        });
                                    },
                                    updateTestResult: () => {
                                        return Promise.resolve({});
                                    },
                                    getTestCodesAndClassificationFromTestTypes: () => {
                                        return Promise.resolve({
                                            defaultTestCode: "lbp",
                                            testTypeClassification: "Annual No Certificate"
                                        });
                                    }
                                };
                            });

                            testResultsService = new TestResultsService(new MockTestResultsDAO());
                            const expectedTestTypeStartTimestamp = "2020-12-28T09:26:58.477Z";
                            const expectedTestTypeEndTimestamp = "2020-12-28T18:00:00.000Z";
                            testToUpdate.testTypes[0].testTypeStartTimestamp = expectedTestTypeStartTimestamp;
                            testToUpdate.testTypes[0].testTypeEndTimestamp = expectedTestTypeEndTimestamp;
                            expect.assertions(4);
                            return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                              .then((returnedRecord: any) => {
                                  expect(returnedRecord).not.toEqual(undefined);
                                  expect(returnedRecord).not.toEqual({});
                                  expect(returnedRecord.testTypes[0].testTypeStartTimestamp).toEqual(expectedTestTypeStartTimestamp);
                                  expect(returnedRecord.testTypes[0].testTypeEndTimestamp).toEqual(expectedTestTypeEndTimestamp);
                              });
                        });
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
                            getActivity: () => {
                                return Promise.resolve([{
                                    startTime: "2018-03-22",
                                    endTime: "2020-04-22"
                                }]);
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
                    testToUpdate = cloneDeep(testResultsMockDB[1]);
                    expect.assertions(4);
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                      .catch((errorResponse: { statusCode: any; body: any; }) => {
                          expect(errorResponse).toBeInstanceOf(HTTPError);
                          expect(errorResponse.statusCode).toEqual(400);
                          expect(errorResponse.body.errors).toContain("\"prohibitionIssued\" is not allowed");
                          expect(errorResponse.body.errors).toContain("\"certificateNumber\" is not allowed");
                      });
                });
            });

            context("and when the testTypeId is unknown", () => {
                it("should return validation Error 400", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation();

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    testToUpdate.testTypes[0].testTypeId = "unknown";
                    expect.assertions(3);
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                      .catch((errorResponse: { statusCode: any; body: any; }) => {
                          expect(errorResponse).toBeInstanceOf(HTTPError);
                          expect(errorResponse.statusCode).toEqual(400);
                          expect(errorResponse.body.errors).toContain("Unknown testTypeId");
                      });
                });
            });

            context("and the test types are invalid", () => {
                it("should apply the correct validation schema and return an array of validation errors", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation();

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    // testTypeId from each of the test-types groupings
                    const testTypeIds = ["1", "15", "38", "56", "62", "59", "76", "117", "39", "125", "142", "143", "147", "153"];
                    testToUpdate = cloneDeep(testResultsMockDB[1]);
                    for (const testTypeId of testTypeIds) {
                        testToUpdate.testTypes[0].testTypeId = testTypeId;
                        const validationResponse = ValidationUtil.validateTestTypes(testToUpdate);
                        expect(validationResponse).toBeDefined();
                        expect(validationResponse.length).not.toEqual(0);
                    }
                });
            });

            context("and when testTypes attribute is not present on the payload", () => {
                it("should return validation Error 400", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation();

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    delete testToUpdate.testTypes;
                    expect.assertions(3);
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                      .catch((errorResponse: { statusCode: any; body: any; }) => {
                          expect(errorResponse).toBeInstanceOf(HTTPError);
                          expect(errorResponse.statusCode).toEqual(400);
                          expect(errorResponse.body.errors).toContain("\"testTypes\" is required");
                      });
                });
            });

            context("and the test is a specialist test", () => {
                it("should set the defects attribute as an empty array", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation();

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    // testTypeId from each of the specialist test-types groupings
                    const testTypeIds = ["125", "142", "143", "147", "153"];
                    testToUpdate = cloneDeep(testResultsMockDB[1]);
                    for (const testTypeId of testTypeIds) {
                        testToUpdate.testTypes[0].testTypeId = testTypeId;
                        delete testToUpdate.testTypes[0].defects;
                        // FIXME: move to a separate test
                        MappingUtil.cleanDefectsArrayForSpecialistTests(testToUpdate);
                        expect(testToUpdate.testTypes[0].defects).toBeDefined();
                        expect(testToUpdate.testTypes[0].defects).toEqual([]);
                    }
                });
            });

            it("should remove the attributes that are not updatable from the payload", () => {
                MockTestResultsDAO = jest.fn().mockImplementation();

                // testResultsService = new TestResultsService(new MockTestResultsDAO());
                // FIXME: move to a separate test
                MappingUtil.removeNonEditableAttributes(testToUpdate);
                expect(testToUpdate).not.toHaveProperty("systemNumber");
                expect(testToUpdate).not.toHaveProperty("vin");
                expect(testToUpdate).not.toHaveProperty("vehicleId");
                expect(testToUpdate).not.toHaveProperty("testEndTimestamp");
                expect(testToUpdate).not.toHaveProperty("testVersion");
                expect(testToUpdate).toHaveProperty("testerEmailAddress");
                expect(testToUpdate).toHaveProperty("testStationType");
            });
        });
    });
});
