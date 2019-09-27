import { expect } from "chai";
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
          getByVin: () => {
            return Promise.resolve({
              Items: Array.of(testResultsMockDB[8]),
              Count: 1
            });
          }
        };
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      return testResultsService.getTestResults({ vin: "XMGDE02FS0H012302", status: "submitted", fromDateTime: "2017-01-01", toDateTime: new Date().toString()})
        .then((returnedRecords: any) => {
          expect(returnedRecords).to.not.equal(undefined);
          expect(returnedRecords).to.not.equal({});
          expect(JSON.stringify(returnedRecords[0])).to.equal(JSON.stringify(testResultsMockDB[8]));
          expect(returnedRecords.length).to.be.equal(1);
          expect(returnedRecords[0].deletionFlag).to.equal(false);
        });
    });
  });

  context("when a record with one test type is found and the test type has deletionFlag true", () => {
    it("should not return that test type", () => {
      MockTestResultsDAO = jest.fn().mockImplementation(() => {
        return {
          getByVin: () => {
            return Promise.resolve({
              Items: Array.of(testResultsMockDB[9]),
              Count: 1
            });
          }
        };
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      return testResultsService.getTestResults({ vin: "XMGDE02FS0H012303", status: "submitted", fromDateTime: "2017-01-01", toDateTime: new Date().toString() })
        .then((returnedRecords: Array<{ testTypes: { length: any; }; }>) => {
          expect(returnedRecords[0].testTypes.length).to.equal(0);
        });
    });
  });

  context("when only one record is found with deletionFlag true", () => {
    it("should return a 404 error", () => {
      MockTestResultsDAO = jest.fn().mockImplementation(() => {
        return {
          getByVin: () => {
            return Promise.resolve({
              Items: Array.of(testResultsMockDB[7]),
              Count: 1
            });
          }
        };
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      return testResultsService.getTestResults({ vin: "XMGDE02FS0H012301", status: "submitted", fromDateTime: "2017-01-01", toDateTime: new Date().toString() })
        .then(() => {
          expect.fail();
        }).catch((errorResponse: { statusCode: any; body: any; }) => {
          expect(errorResponse).to.be.instanceOf(HTTPError);
          expect(errorResponse.statusCode).to.equal(404);
          expect(errorResponse.body).to.equal("No resources match the search criteria");
        });
    });
  });

  context("when a record with one test type is found and the test type has deletionFlag false", () => {
    it("should return a populated response", () => {
      MockTestResultsDAO = jest.fn().mockImplementation(() => {
        return {
          getByVin: () => {
            return Promise.resolve({
              Items: Array.of(testResultsMockDB[10]),
              Count: 1
            });
          }
        };
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      return testResultsService.getTestResults({ vin: "XMGDE02FS0H012304", status: "submitted", fromDateTime: "2017-01-01", toDateTime: new Date().toString() })
        .then((returnedRecords: Array<{ testTypes: Array<{ deletionFlag: any; }>; }>) => {
          expect(returnedRecords[0].testTypes[0].deletionFlag).to.equal(false);
        });
    });
  });

});
