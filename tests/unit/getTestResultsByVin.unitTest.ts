import { expect } from "chai";
import { TestResultsService } from "../../src/services/TestResultsService";
import fs from "fs";
import path from "path";
import { HTTPError } from "../../src/models/HTTPError";
import { MESSAGES, ERRORS } from "../../src/assets/Enums";

describe("getTestResults", () => {
    let testResultsService: TestResultsService | any;
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

    context("when a record is found filtered for vin", () => {
        it("should return a populated response and status code 200", () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getByVin: () => {
                        return Promise.resolve({
                            Items: Array.of(testResultsMockDB[0]),
                            Count: 1
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());
            return testResultsService.getTestResults({ vin: "XMGDE02FS0H012345", status: "submitted", fromDateTime: "2017-01-01", toDateTime: new Date().toString() })
                .then((returnedRecords: any) => {
                    expect(returnedRecords).to.not.equal(undefined);
                    expect(returnedRecords).to.not.equal({});
                    expect(JSON.stringify(returnedRecords[0])).to.equal(JSON.stringify(testResultsMockDB[0]));
                    expect(returnedRecords.length).to.be.equal(1);
                });
        });
    });

    context("when db returns undefined data", () => {
        it("should return 404-No resources match the search criteria if db return null data", () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getByVin: () => {
                        return Promise.resolve({
                            Items: null,
                            Count: 0
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            return testResultsService.getTestResults()
                .then(() => {
                    expect.fail();
                }).catch((errorResponse: { statusCode: any; body: any; }) => {
                    expect(errorResponse).to.be.instanceOf(HTTPError);
                    expect(errorResponse.statusCode).to.equal(400);
                    expect(errorResponse.body).to.equal(MESSAGES.BAD_REQUEST);
                });
        });

        it("should return 404-No resources match the search criteria if testResults length is 0", () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getByVin: () => {
                        return Promise.resolve({
                            Items: [],
                            Count: 0
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            return testResultsService.getTestResults({ vin: "XMGDE02FS0H012345", status: "submitted", fromDateTime: "2017-01-01", toDateTime: new Date().toString() })
                .then(() => {
                    expect.fail();
                }).catch((errorResponse: { statusCode: any; body: any; }) => {
                    expect(errorResponse).to.be.instanceOf(HTTPError);
                    expect(errorResponse.statusCode).to.equal(404);
                    expect(errorResponse.body).to.equal(ERRORS.NoResourceMatch);
                });
        });
    });

    context("when db returns empty data due to invalid toDateTime", () => {
        it("should return 400-Bad request", () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getByVin: () => {
                        return Promise.resolve({
                            Items: Array.of(testResultsMockDB[0]),
                            Count: 1
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            return testResultsService.getTestResults({ vin: "XMGDE02FS0H012345", status: "submitted", fromDateTime: "2017-01-01", toDateTime: "qwerty" })
                .then(() => {
                    expect.fail();
                })
                .catch((errorResponse: { statusCode: any; body: any; }) => {
                    expect(errorResponse).to.be.instanceOf(HTTPError);
                    expect(errorResponse.statusCode).to.equal(400);
                    expect(errorResponse.body).to.equal(MESSAGES.BAD_REQUEST);
                });
        });
    });

    context("when db returns empty data due to invalid fromDateTime", () => {
        it("should return 400-Bad request", () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getByVin: () => {
                        return Promise.resolve({
                            Items: Array.of(testResultsMockDB[0]),
                            Count: 1
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            return testResultsService.getTestResults({ vin: "XMGDE02FS0H012345", status: "submitted", fromDateTime: "qwerty", toDateTime: new Date().toString() })
            .then(() => {
              expect.fail();
            })
            .catch((errorResponse: { statusCode: any; body: any; }) => {
              expect(errorResponse).to.be.instanceOf(HTTPError);
              expect(errorResponse.statusCode).to.equal(400);
              expect(errorResponse.body).to.equal(MESSAGES.BAD_REQUEST);
            });
        });
      });
});
