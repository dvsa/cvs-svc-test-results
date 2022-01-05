import { TestResultsService } from "../../src/services/TestResultsService";
import fs from "fs";
import path from "path";
import { HTTPError } from "../../src/models/HTTPError";
import {MESSAGES, ERRORS, TEST_VERSION} from "../../src/assets/Enums";
import {cloneDeep} from "lodash";

describe("getTestResultBySystemNumber", () => {
    let testResultsService: TestResultsService | null;
    let MockTestResultsDAO: jest.Mock;
    let testResultsMockDB: any;
    beforeEach(() => {
        testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
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

    context("when a record is found filtered for systemNumber", () => {
        it("should return a populated response and status code 200", () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getBySystemNumber: () => {
                        return Promise.resolve(Array.of(testResultsMockDB[0]));
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());
            return testResultsService.getTestResultBySystemNumber({ systemNumber: "1111", status: "submitted", fromDateTime: "2017-01-01", toDateTime: new Date().toString() })
                .then((returnedRecords: any) => {
                    expect(returnedRecords).not.toEqual(undefined);
                    expect(returnedRecords).not.toEqual({});
                    expect(JSON.stringify(returnedRecords[0])).toEqual(JSON.stringify(testResultsMockDB[0]));
                    expect(returnedRecords.length).toEqual(1);
                });
        });
    });

    context("when the testResultId is passed", () => {
        context("and testVersion query param is archived", () => {
            it("should return the testHistory array of a test-result", () => {
                const testResult = cloneDeep(testResultsMockDB[0]);
                testResult.testHistory = [testResultsMockDB[1], testResultsMockDB[2]];
                MockTestResultsDAO = jest.fn().mockImplementation(() => {
                    return {
                        getBySystemNumber: () => {
                            return Promise.resolve(Array.of(testResult));
                        }
                    };
                });
                testResultsService = new TestResultsService(new MockTestResultsDAO());

                return testResultsService.getTestResultBySystemNumber({
                    systemNumber: "1111",
                    fromDateTime: "2017-01-01",
                    toDateTime: new Date().toString(),
                    testVersion: TEST_VERSION.ARCHIVED,
                    testResultId: testResult.testResultId
                })
                .then((returnedRecords: any) => {
                    expect(returnedRecords).not.toEqual(undefined);
                    expect(returnedRecords).not.toEqual({});
                    expect(returnedRecords.length).toEqual(2);
                    expect(JSON.stringify(returnedRecords[0])).toEqual(JSON.stringify(testResultsMockDB[1]));
                    expect(JSON.stringify(returnedRecords[1])).toEqual(JSON.stringify(testResultsMockDB[2]));
                });
            });
        });
        context("and testVersion query param is current", () => {
            it("should return the test-result without the testHistory array", () => {
                const testResult = cloneDeep(testResultsMockDB[0]);
                testResult.testHistory = ["some archived test-result", "another archived test-result"];
                MockTestResultsDAO = jest.fn().mockImplementation(() => {
                    return {
                        getBySystemNumber: () => {
                            return Promise.resolve(Array.of(testResult));
                        }
                    };
                });
                testResultsService = new TestResultsService(new MockTestResultsDAO());

                return testResultsService.getTestResultBySystemNumber({ systemNumber: "1111",
                    testVersion: TEST_VERSION.CURRENT,
                    fromDateTime: "2017-01-01",
                    toDateTime: new Date().toString(),
                    testResultId: testResult.testResultId
                })
                  .then((returnedRecords: any) => {
                      expect(returnedRecords).not.toEqual(undefined);
                      expect(returnedRecords).not.toEqual({});
                      expect(returnedRecords.length).toEqual(1);
                      expect(returnedRecords[0]).not.toHaveProperty("testHistory");
                      expect(JSON.stringify(returnedRecords[0])).toEqual(JSON.stringify(testResultsMockDB[0]));
                  });
            });
        });

        context("when the testVersion filter is ALL", () => {
            it("should return all test-results (without testVersion, testVersion=current/archived)", () => {
                const testResult = cloneDeep(testResultsMockDB[0]);
                testResult.testHistory = ["some archived test-result"];

                MockTestResultsDAO = jest.fn().mockImplementation(() => {
                    return {
                        getBySystemNumber: () => {
                            return Promise.resolve(Array.of(testResult));
                        }
                    };
                });

                testResultsService = new TestResultsService(new MockTestResultsDAO());
                return testResultsService.getTestResultBySystemNumber({
                    systemNumber: "1111",
                    fromDateTime: "2017-01-01",
                    toDateTime: new Date().toString(),
                    testVersion: TEST_VERSION.ALL,
                    testResultId: testResult.testResultId
                })
                  .then((returnedRecords: any) => {
                      expect(returnedRecords).not.toEqual(undefined);
                      expect(returnedRecords).not.toEqual({});
                      expect(returnedRecords.length).toEqual(1);
                      expect(JSON.stringify(returnedRecords[0])).toEqual(JSON.stringify(testResult));
                  });
            });
        });
    });

    context("when db returns undefined data", () => {
        it("should return 404-No resources match the search criteria if db return null data", () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getBySystemNumber: () => {
                        return Promise.resolve([]);
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());
            expect.assertions(3);
            return testResultsService.getTestResultBySystemNumber({
                systemNumber: "1111"
            })
                .catch((errorResponse: { statusCode: any; body: any; }) => {
                    expect(errorResponse).toBeInstanceOf(HTTPError);
                    expect(errorResponse.statusCode).toEqual(400);
                    expect(errorResponse.body).toEqual(MESSAGES.BAD_REQUEST);
                });
        });

        it("should return 404-No resources match the search criteria if testResults length is 0", () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getBySystemNumber: () => {
                        return Promise.resolve([]);
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.getTestResultBySystemNumber({ systemNumber: "1111", status: "submitted", fromDateTime: "2017-01-01", toDateTime: new Date().toString() })
                .catch((errorResponse: { statusCode: any; body: any; }) => {
                    expect(errorResponse).toBeInstanceOf(HTTPError);
                    expect(errorResponse.statusCode).toEqual(404);
                    expect(errorResponse.body).toEqual(ERRORS.NoResourceMatch);
                });
        });
    });

    context("when db returns empty data due to invalid toDateTime", () => {
        it("should return 400-Bad request", () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getBySystemNumber: () => {
                        return Promise.resolve( Array.of(testResultsMockDB[0]));
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.getTestResultBySystemNumber({ systemNumber: "1111", status: "submitted", fromDateTime: "2017-01-01", toDateTime: "qwerty" })
                .catch((errorResponse: { statusCode: any; body: any; }) => {
                    expect(errorResponse).toBeInstanceOf(HTTPError);
                    expect(errorResponse.statusCode).toEqual(400);
                    expect(errorResponse.body).toEqual(MESSAGES.BAD_REQUEST);
                });
        });
    });

    context("when db returns empty data due to invalid fromDateTime", () => {
        it("should return 400-Bad request", () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getBySystemNumber: () => {
                        return Promise.resolve(Array.of(testResultsMockDB[0]));
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.getTestResultBySystemNumber({ systemNumber: "1111", status: "submitted", fromDateTime: "20", toDateTime: new Date().toString() })
                .catch((errorResponse: { statusCode: any; body: any; }) => {
                  expect(errorResponse).toBeInstanceOf(HTTPError);
                  expect(errorResponse.statusCode).toEqual(400);
                  expect(errorResponse.body).toEqual(MESSAGES.BAD_REQUEST);
                });
        });
      });

    // CVSB-7964: AC2- API Consumer retrieve the Test results for the input systemNumber
    context("when a record is found filtered for systemNumber with LEC test Type", () => {
        it("should return a populated response with new fields populated with non-null values and status code 200", () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getBySystemNumber: () => {
                        return Promise.resolve(Array.of(testResultsMockDB[19]));
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());
            return testResultsService.getTestResultBySystemNumber({ systemNumber: "1130", status: "submitted", fromDateTime: new Date("2017-01-01"), toDateTime: new Date() })
                .then((returnedRecords: any) => {
                    expect(returnedRecords.length).toEqual(1);
                    expect(returnedRecords[0].systemNumber).toEqual("1130");
                    expect(returnedRecords[0].testTypes[0].testExpiryDate).toEqual("2021-10-24");
                    expect(returnedRecords[0].testTypes[0].emissionStandard).toEqual("0.08 g/kWh Euro 3 PM");
                });
        });
    });
});
