import { expect } from "chai";
import { TestResultsService } from "../../src/services/TestResultsService";
import fs, { promises } from "fs";
import path from "path";
import { HTTPError } from "../../src/models/HTTPError";
import { MESSAGES, ERRORS } from "../../src/assets/Enums";
import { ITestResultPayload } from "../../src/models/ITestResultPayload";
import { HTTPResponse } from "../../src/models/HTTPResponse";
import * as dateFns from "date-fns";

describe("TestResultsService calling deleteTestResultsList", () => {
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

    context("database call deletes items", () => {
      it("should return nothing", () => {
        const mockData = testResultsMockDB[6];
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            deleteMultiple: () => {
              return Promise.resolve({});
            }
          };
        });

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService.deleteTestResultsList(mockData)
          .then((data: any) => {
            expect(data).to.equal(undefined);
          });
      });

      it("should return the unprocessed items", () => {
        const mockData = testResultsMockDB[6];
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            deleteMultiple: () => {
              return Promise.resolve({
                UnprocessedItems: Array.of(testResultsMockDB[6])
              });
            }
          };
        });

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService.deleteTestResultsList(mockData)
          .then((data: { length: any; }) => {
            expect(data.length).to.equal(1);
          });
      });
    });

    context("database call fails deleting items", () => {
      it("should return error 500", () => {
        const mockData = testResultsMockDB[6];
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            deleteMultiple: () => {
              return Promise.reject({});
            }
          };
        });

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService.deleteTestResultsList(mockData)
          .catch((errorResponse: { statusCode: any; body: any; }) => {
            expect(errorResponse).to.be.instanceOf(HTTPError);
            expect(errorResponse.statusCode).to.be.equal(500);
            expect(errorResponse.body).to.equal("Internal Server Error");
          });
      });
    });
});
