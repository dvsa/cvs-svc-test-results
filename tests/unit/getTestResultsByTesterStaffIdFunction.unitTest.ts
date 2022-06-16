import {getTestResultsByTesterStaffId} from "../../src/functions/getTestResultsByTesterStaffId";
import {TestResultsService} from "../../src/services/TestResultsService";
import {HTTPResponse} from "../../src/models/HTTPResponse";
import {HTTPError} from "../../src/models/HTTPError";
import {HTTPRESPONSE, MESSAGES} from "../../src/assets/Enums";
jest.mock("../../src/services/TestResultsService");

describe("getTestResultsByTesterStaffId Function", () => {
  const goodEvent = {
    queryStringParameters: {
      testerStaffId: "1",
      testStationPNumber: "abc123",
      toDateTime: "01-01-2010",
      fromDateTime: "01-01-2009",
      testStatus: "active"
    }
  };
  context("with good event", () => {
    it("should invoke testResultService with appropriately transformed filters, and on success return 200 + data", async () => {
      const testResultsMock = jest.fn().mockResolvedValue("Success");
      TestResultsService.prototype.getTestResultsByTesterStaffId = testResultsMock;

      const expectedFilters = {
        testerStaffId: "1",
        testStationPNumber: "abc123",
        toDateTime: new Date("01-01-2010"),
        fromDateTime: new Date("01-01-2009"),
        testStatus: "active"
      };

      expect.assertions(4);
      const result = await getTestResultsByTesterStaffId(goodEvent);
      expect(testResultsMock).toHaveBeenCalledWith(expectedFilters);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toEqual(200);
      expect(result.body).toEqual(JSON.stringify("Success"));
    });
    it("should invoke testResultService, and on failure return error details", async () => {
      const myError = new HTTPError(418, "It Broke!");
      TestResultsService.prototype.getTestResultsByTesterStaffId = jest.fn().mockRejectedValue(myError);

      expect.assertions(3);
      const result = await getTestResultsByTesterStaffId(goodEvent);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toEqual(418);
      expect(result.body).toEqual(JSON.stringify("It Broke!"));
    });
  });
  context("with incomplete event", () => {
    context("missing testStatus", () => {
      it("Should still call testResultsService, just without the testStatus filter", async () => {
        const myEvent = {...goodEvent};
        delete myEvent.queryStringParameters.testStatus;

        const testResultsMock = jest.fn().mockResolvedValue("Success");
        TestResultsService.prototype.getTestResultsByTesterStaffId = testResultsMock;

        const expectedFilters = {
          testerStaffId: "1",
          testStationPNumber: "abc123",
          toDateTime: new Date("01-01-2010"),
          fromDateTime: new Date("01-01-2009"),
        };

        expect.assertions(4);
        const result = await getTestResultsByTesterStaffId(myEvent);
        expect(testResultsMock).toHaveBeenCalledWith(expectedFilters);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify("Success"));
      });
    });
    context("missing testerStaffId", () => {
      it("Should throw error, and not invoke TestResultService", async () => {
        const myEvent = {...goodEvent};
        delete myEvent.queryStringParameters.testerStaffId;

        const testResultsMock = jest.fn();
        TestResultsService.prototype.getTestResultsByTesterStaffId = testResultsMock;

        expect.assertions(4);
        const result = await getTestResultsByTesterStaffId(myEvent);
        expect(testResultsMock).not.toBeCalled();
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(JSON.stringify(MESSAGES.BAD_REQUEST));
      });
    });
    context("missing testStationPNumber", () => {
      it("Should throw error, and not invoke TestResultService", async () => {
        const myEvent = {...goodEvent};
        delete myEvent.queryStringParameters.testStationPNumber;

        const testResultsMock = jest.fn();
        TestResultsService.prototype.getTestResultsByTesterStaffId = testResultsMock;

        expect.assertions(4);
        const result = await getTestResultsByTesterStaffId(myEvent);
        expect(testResultsMock).not.toBeCalled();
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(JSON.stringify(MESSAGES.BAD_REQUEST));
      });
    });
    context("missing toDateTime", () => {
      it("Should throw error, and not invoke TestResultService", async () => {
        const myEvent = {...goodEvent};
        delete myEvent.queryStringParameters.toDateTime;

        const testResultsMock = jest.fn();
        TestResultsService.prototype.getTestResultsByTesterStaffId = testResultsMock;

        expect.assertions(4);
        const result = await getTestResultsByTesterStaffId(myEvent);
        expect(testResultsMock).not.toBeCalled();
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(JSON.stringify(MESSAGES.BAD_REQUEST));
      });
    });
    context("missing fromDateTime", () => {
      it("Should throw error, and not invoke TestResultService", async () => {
        const myEvent = {...goodEvent};
        delete myEvent.queryStringParameters.fromDateTime;

        const testResultsMock = jest.fn();
        TestResultsService.prototype.getTestResultsByTesterStaffId = testResultsMock;

        expect.assertions(4);
        const result = await getTestResultsByTesterStaffId(myEvent);
        expect(testResultsMock).not.toBeCalled();
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(JSON.stringify(MESSAGES.BAD_REQUEST));
      });
    });
    context("with good event", () => {
      it("should trigger validation and throw 400 error when testerStaffId is null", async () => {
        const myEvent = {
          queryStringParameters: {
            testerStaffId: null,
            testStationPNumber: "abc123",
            toDateTime: "01-01-2010",
            fromDateTime: "01-01-2009",
            testStatus: "active"
          }
        }

        const testResultsMock = jest.fn();
        TestResultsService.prototype.getTestResultsByTesterStaffId = testResultsMock;

        try {
          await getTestResultsByTesterStaffId(myEvent);
        } catch (e) {
          expect.assertions(4);
          expect(testResultsMock).not.toBeCalled();
          expect(e).toBeInstanceOf(HTTPError);
          expect(e.statusCode).toEqual(400);
          expect(e.body).toEqual(HTTPRESPONSE.MISSING_PARAMETERS);
        }
      });

      it("should trigger validation and throw 400 error when testerStaffId is undefined", async () => {
        const myEvent = {
          queryStringParameters: {
            testerStaffId: undefined,
            testStationPNumber: "abc123",
            toDateTime: "01-01-2010",
            fromDateTime: "01-01-2009",
            testStatus: "active"
          }
        }

        const testResultsMock = jest.fn();
        TestResultsService.prototype.getTestResultsByTesterStaffId = testResultsMock;

        try {
          await getTestResultsByTesterStaffId(myEvent);
        } catch (e) {
          expect.assertions(4);
          expect(testResultsMock).not.toBeCalled();
          expect(e).toBeInstanceOf(HTTPError);
          expect(e.statusCode).toEqual(400);
          expect(e.body).toEqual(HTTPRESPONSE.MISSING_PARAMETERS);
        }
      });

      it("should trigger validation and throw 400 error when testerStaffId is an empty string", async () => {
        const myEvent = {
          queryStringParameters: {
            testerStaffId: " ",
            testStationPNumber: "abc123",
            toDateTime: "01-01-2010",
            fromDateTime: "01-01-2009",
            testStatus: "active"
          }
        }

        const testResultsMock = jest.fn();
        TestResultsService.prototype.getTestResultsByTesterStaffId = testResultsMock;

        try {
          await getTestResultsByTesterStaffId(myEvent);
        } catch (e) {
          expect.assertions(4);
          expect(testResultsMock).not.toBeCalled();
          expect(e).toBeInstanceOf(HTTPError);
          expect(e.statusCode).toEqual(400);
          expect(e.body).toEqual(HTTPRESPONSE.MISSING_PARAMETERS);
        }
      });
    })
  });
});
