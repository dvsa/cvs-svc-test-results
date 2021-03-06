import {TestResultsService} from "../../src/services/TestResultsService";
import {HTTPError} from "../../src/models/HTTPError";
import fs from "fs";
import path from "path";
import { MESSAGES } from "../../src/assets/Enums";
import {cloneDeep} from "lodash";
import {ITestResult} from "../../src/models/ITestResult";

describe("getTestResultsByTesterStaffId path of TestResultsService", () => {
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

  context("no params are passed", () => {
    it("should throw error 400-Bad request", () => {
      expect.assertions(3);
      return testResultsService.getTestResultsByTesterStaffId({})
        .catch((errorResponse: { statusCode: any; body: any; }) => {
          expect(errorResponse).toBeInstanceOf(HTTPError);
          expect(errorResponse.statusCode).toEqual(400);
          expect(errorResponse.body).toEqual(MESSAGES.BAD_REQUEST);
        });
    });
  });

  context("when a record is found", () => {
    it("should return a populated response and status code 200", () => {
      MockTestResultsDAO = jest.fn().mockImplementation((testerStaffId) => {
        return {
          getByTesterStaffId: () => {
            return Promise.resolve([testResultsMockDB[0]]);
          }
        };
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      return testResultsService.getTestResultsByTesterStaffId({ testerStaffId: "1", testStationPNumber: "87-1369569", fromDateTime: "2015-02-22", toDateTime: "2019-02-22" })
        .then((returnedRecords: any) => {
          expect(returnedRecords).not.toEqual(undefined);
          expect(returnedRecords).not.toEqual({});
          expect(returnedRecords[0]).toEqual(testResultsMockDB[0]);
          expect(returnedRecords.length).toEqual(1);
        });
    });
  });

  context("when getByTesterStaffId throws error", () => {
    MockTestResultsDAO = jest.fn().mockImplementation(() => {
      return {
        getByTesterStaffId: () => {
          throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
        }
      };
    });

    const testResultsServiceMock = new TestResultsService(new MockTestResultsDAO());
    it("should throw an error 500-Internal Error", () => {
      expect.assertions(3);
      return testResultsServiceMock.getTestResultsByTesterStaffId({ testerStaffId: "5", testStationPNumber: "87-1369569", fromDateTime: "2015-02-22", toDateTime: "2019-02-22" })
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
          getByTesterStaffId: () => Promise.resolve([])
        };
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      expect.assertions(3);
      return testResultsService.getTestResultsByTesterStaffId({ testerStaffId: "1", testStationPNumber: "87-13695", fromDateTime: "2015-02-22", toDateTime: "2019-02-22" })
        .catch((errorResponse: { statusCode: any; body: any; }) => {
          expect(errorResponse).toBeInstanceOf(HTTPError);
          expect(errorResponse.statusCode).toEqual(404);
          expect(errorResponse.body).toEqual("No resources match the search criteria");
        });
    });
  });

  context("when using testStatus filter)", () => {
    it("should only return submitted tests, not cancelled", () => {
      const filteredTestResults = cloneDeep(testResultsMockDB).filter((test: ITestResult) => test.testerStaffId === "15");
      MockTestResultsDAO = jest.fn().mockImplementation((testerStaffId) => {
        return {
          getByTesterStaffId: () => {
            return Promise.resolve(filteredTestResults);
          }
        };
      });
      const expectedResult = cloneDeep(testResultsMockDB[1]);

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      expect.assertions(4);
      return testResultsService.getTestResultsByTesterStaffId({
        testerStaffId: "15",
        testStationPNumber: "84-926821",
        fromDateTime: "2015-02-22",
        toDateTime: "2020-02-22",
        testStatus: "submitted"
      })
        .then((returnedRecords: ITestResult[]) => {
          expect(returnedRecords).not.toEqual(undefined);
          expect(returnedRecords).not.toEqual({});
          expect(returnedRecords[0]).toEqual(expectedResult);
          expect(returnedRecords.length).toEqual(2);
        });
    });
  });
});
