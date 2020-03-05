import {TestResultsService} from "../../src/services/TestResultsService";
import fs from "fs";
import path from "path";
import { HTTPError } from "../../src/models/HTTPError";

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

  context("when a record is found with deletionFlag false", () => {
    it("should return a populated response and status code 200", () => {
      MockTestResultsDAO = jest.fn().mockImplementation(() => {
        return {
          getBySystemNumber: () => {
            return Promise.resolve({
              Items: Array.of(testResultsMockDB[8]),
              Count: 1
            });
          }
        };
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      return testResultsService.getTestResults({ systemNumber: "1119", status: "submitted", fromDateTime: "2017-01-01", toDateTime: new Date().toString()})
        .then((returnedRecords: any) => {
          expect(returnedRecords).not.toEqual(undefined);
          expect(returnedRecords).not.toEqual({});
          expect(JSON.stringify(returnedRecords[0])).toEqual(JSON.stringify(testResultsMockDB[8]));
          expect(returnedRecords.length).toEqual(1);
          expect(returnedRecords[0].deletionFlag).toEqual(false);
        });
    });
  });

  context("when a record with one test type is found and the test type has deletionFlag true", () => {
    it("should not return that test type", () => {
      MockTestResultsDAO = jest.fn().mockImplementation(() => {
        return {
          getBySystemNumber: () => {
            return Promise.resolve({
              Items: Array.of(testResultsMockDB[9]),
              Count: 1
            });
          }
        };
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      return testResultsService.getTestResults({ systemNumber: "1120", status: "submitted", fromDateTime: "2017-01-01", toDateTime: new Date().toString() })
        .then((returnedRecords: Array<{ testTypes: { length: any; }; }>) => {
          expect(returnedRecords[0].testTypes.length).toEqual(0);
        });
    });
  });

  context("when only one record is found with deletionFlag true", () => {
    it("should return a 404 error", () => {
      MockTestResultsDAO = jest.fn().mockImplementation(() => {
        return {
          getBySystemNumber: () => {
            return Promise.resolve({
              Items: Array.of(testResultsMockDB[7]),
              Count: 1
            });
          }
        };
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      expect.assertions(3);
      return testResultsService.getTestResults({ systemNumber: "1118", status: "submitted", fromDateTime: "2017-01-01", toDateTime: new Date().toString() })
        .catch((errorResponse: { statusCode: any; body: any; }) => {
          expect(errorResponse).toBeInstanceOf(HTTPError);
          expect(errorResponse.statusCode).toEqual(404);
          expect(errorResponse.body).toEqual("No resources match the search criteria");
        });
    });
  });

  context("when a record with one test type is found and the test type has deletionFlag false", () => {
    it("should return a populated response", () => {
      MockTestResultsDAO = jest.fn().mockImplementation(() => {
        return {
          getBySystemNumber: () => {
            return Promise.resolve({
              Items: Array.of(testResultsMockDB[10]),
              Count: 1
            });
          }
        };
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      return testResultsService.getTestResults({ systemNumber: "1121", status: "submitted", fromDateTime: "2017-01-01", toDateTime: new Date().toString() })
        .then((returnedRecords: Array<{ testTypes: Array<{ deletionFlag: any; }>; }>) => {
          expect(returnedRecords[0].testTypes[0].deletionFlag).toEqual(false);
        });
    });
  });

});
