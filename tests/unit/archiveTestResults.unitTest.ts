import {TestResultsService} from "../../src/services/TestResultsService";
import {HTTPError} from "../../src/models/HTTPError";
import testResults from "../resources/test-results.json";
import {ERRORS, MESSAGES} from "../../src/assets/Enums";
import {cloneDeep} from "lodash";

describe("archiveTestResults", () => {
  let testResultsService: TestResultsService | any;
  let MockTestResultsDAO: jest.Mock;
  let testResultsMockDB: any;
  let testToUpdate: any;
  let testType: any;
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
    testType = cloneDeep(testToUpdate.testTypes[0]);
    testType.testNumber = Date.now().toString();
    testToUpdate.testTypes[0].statusUpdatedFlag = true;
    testToUpdate.testTypes.push(testType);
  });

  afterEach(() => {
    testResultsMockDB = null;
    testResultsService = null;
    testToUpdate = null;
    testType = null;
    MockTestResultsDAO.mockReset();
  });

  context("when trying to archive a test-type", () => {
    it("should return the updated test-result without the archived testType", () => {
      MockTestResultsDAO = jest.fn().mockImplementation(() => {
        return {
          updateTestResult: () => {
            return Promise.resolve({});
          },
          getByTestResultId: () => {
            return Promise.resolve({
              Items: Array.of(cloneDeep(testToUpdate)),
              Count: 1
            });
          }
        };
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      return testResultsService.archiveTestResult(testToUpdate.testResultId, testToUpdate, msUserDetails)
        .then((returnedRecord: any) => {
          expect(returnedRecord).not.toEqual(undefined);
          expect(returnedRecord).not.toEqual({});
          expect(returnedRecord).toHaveProperty("createdAt");
          expect(returnedRecord).toHaveProperty("createdById");
          expect(returnedRecord).toHaveProperty("createdByName");
          expect(returnedRecord).toHaveProperty("testVersion");
          expect(returnedRecord).toHaveProperty("reasonForCreation");
          expect(returnedRecord.testVersion).toEqual("current");
          expect(returnedRecord.testTypes.length).toEqual(1);
          expect(returnedRecord).toHaveProperty("testHistory");
          expect(returnedRecord.testHistory[0].testVersion).toEqual("archived");
          expect(returnedRecord.testHistory[0].testTypes.length).toEqual(2);
          expect(returnedRecord.testHistory[0].testTypes[0]).toHaveProperty("statusUpdatedFlag");
          expect(returnedRecord.testHistory[0].testTypes[0].statusUpdatedFlag).toEqual(true);
          expect(returnedRecord.testHistory[0].testTypes[1]).not.toHaveProperty("statusUpdatedFlag");
        });
    });

    context("when we are archiving all test-types", () => {
      it("should remove all the test-types from the testType array and mark the test-result as ARCHIVED", () => {
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            updateTestResult: () => {
              return Promise.resolve({});
            },
            getByTestResultId: () => {
              return Promise.resolve({
                Items: Array.of(cloneDeep(testToUpdate)),
                Count: 1
              });
            }
          };
        });

        testResultsService = new TestResultsService(new MockTestResultsDAO());
        testToUpdate.testTypes[1].statusUpdatedFlag = true;
        return testResultsService.archiveTestResult(testToUpdate.testResultId, testToUpdate, msUserDetails)
          .then((returnedRecord: any) => {
            expect(returnedRecord).not.toEqual(undefined);
            expect(returnedRecord).not.toEqual({});
            expect(returnedRecord).toHaveProperty("createdAt");
            expect(returnedRecord).toHaveProperty("createdById");
            expect(returnedRecord).toHaveProperty("createdByName");
            expect(returnedRecord).toHaveProperty("testVersion");
            expect(returnedRecord).toHaveProperty("reasonForCreation");
            expect(returnedRecord.testVersion).toEqual("archived");
            expect(returnedRecord.testTypes.length).toEqual(0);
            expect(returnedRecord).toHaveProperty("testHistory");
            expect(returnedRecord.testHistory[0].testVersion).toEqual("archived");
            expect(returnedRecord.testHistory[0].testTypes.length).toEqual(2);
            expect(returnedRecord.testHistory[0].testTypes[0]).toHaveProperty("statusUpdatedFlag");
            expect(returnedRecord.testHistory[0].testTypes[0].statusUpdatedFlag).toEqual(true);
            expect(returnedRecord.testHistory[0].testTypes[1]).toHaveProperty("statusUpdatedFlag");
            expect(returnedRecord.testHistory[0].testTypes[1].statusUpdatedFlag).toEqual(true);
          });
      });
    });

    context("when trying to archive a test-type that's not found on the test-result object", () => {
      it("should throw an error 400 Test type to archive not found", () => {
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getByTestResultId: () => {
              return Promise.resolve({
                Items: Array.of(cloneDeep(testResultsMockDB[0])),
                Count: 1
              });
            }
          };
        });

        testResultsService = new TestResultsService(new MockTestResultsDAO());
        return testResultsService.archiveTestResult(testToUpdate.testResultId, testToUpdate, msUserDetails)
          .catch((errorResponse: { statusCode: any; body: any; }) => {
            expect(errorResponse).toBeInstanceOf(HTTPError);
            expect(errorResponse.statusCode).toEqual(400);
            expect(errorResponse.body).toEqual(ERRORS.TestTypeToArchiveNotFound);
          });
      });
    });

    context("when statusUpdatedFlag is not set to true on any of the test-types", () => {
      it("should throw an error 400 No test types to archive", () => {
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getByTestResultId: () => {
              return Promise.resolve({
                Items: Array.of(cloneDeep(testToUpdate)),
                Count: 1
              });
            }
          };
        });

        testResultsService = new TestResultsService(new MockTestResultsDAO());
        testToUpdate.testTypes[0].statusUpdatedFlag = false;
        return testResultsService.archiveTestResult(testToUpdate.testResultId, testToUpdate, msUserDetails)
          .catch((errorResponse: { statusCode: any; body: any; }) => {
            expect(errorResponse).toBeInstanceOf(HTTPError);
            expect(errorResponse.statusCode).toEqual(400);
            expect(errorResponse.body).toEqual(ERRORS.NoTestTypesToArchive);
          });
      });
    });

    context("when reasonForCreation is sent as empty string", () => {
      it("should throw an error 400 Reason for creation is invalid", () => {
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getByTestResultId: () => {
              return Promise.resolve({
                Items: Array.of(cloneDeep(testToUpdate)),
                Count: 1
              });
            }
          };
        });

        testResultsService = new TestResultsService(new MockTestResultsDAO());
        testToUpdate.reasonForCreation = "";
        return testResultsService.archiveTestResult(testToUpdate.testResultId, testToUpdate, msUserDetails)
          .catch((errorResponse: { statusCode: any; body: any; }) => {
            expect(errorResponse).toBeInstanceOf(HTTPError);
            expect(errorResponse.statusCode).toEqual(400);
            expect(errorResponse.body.errors).toContain("\"reasonForCreation\" is not allowed to be empty");
          });
      });
    });

    context("when updateTestResultDAO throws error", () => {
      it("should throw an error 500-Internal Error", () => {
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            updateTestResult: () => {
              return Promise.reject({statusCode: 500, message: MESSAGES.INTERNAL_SERVER_ERROR});
            },
            getByTestResultId: () => {
              return Promise.resolve({
                Items: Array.of(testToUpdate),
                Count: 1
              });
            }
          };
        });

        testResultsService = new TestResultsService(new MockTestResultsDAO());
        expect.assertions(3);
        return testResultsService.archiveTestResult(testToUpdate.testResultId, testToUpdate, msUserDetails)
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
            getByTestResultId: () => {
              return Promise.resolve({
                Items: [],
                Count: 0
              });
            }
          };
        });

        testResultsService = new TestResultsService(new MockTestResultsDAO());
        expect.assertions(3);
        return testResultsService.archiveTestResult(testToUpdate.testResultId, testToUpdate, msUserDetails)
          .catch((errorResponse: { statusCode: any; body: any; }) => {
            expect(errorResponse).toBeInstanceOf(HTTPError);
            expect(errorResponse.statusCode).toEqual(404);
            expect(errorResponse.body).toEqual(ERRORS.NoResourceMatch);
          });
      });
    });
  });
});
