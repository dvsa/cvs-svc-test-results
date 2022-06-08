import {getTestResultsBySystemNumber} from "../../src/functions/getTestResultsBySystemNumber";
import {TestResultsService} from "../../src/services/TestResultsService";
import {HTTPResponse} from "../../src/models/HTTPResponse";
import {MESSAGES} from "../../src/assets/Enums";
import {HTTPError} from "../../src/models/HTTPError";
import moment from "moment";

describe("getTestResultsBySystemNumber Function", () => {
  const minimalEvent =  {
    pathParameters: {
      systemNumber: 1
    }
  };
  context("receiving minimal Event, and successful service call", () => {
    it("invokes testResultsService with default filters, and returns 200 + data", async () => {
      const testResultsMock = jest.fn().mockResolvedValue("Success");
      TestResultsService.prototype.getTestResultBySystemNumber = testResultsMock;

      const expectedFilters = {
        systemNumber: 1,
        testVersion: "current",
        testStatus: "submitted",
        toDateTime: moment().endOf("day").toDate(),
        fromDateTime: moment().subtract(2, "years").endOf("day").toDate()
      };

      expect.assertions(4);
      // @ts-ignore
      const result = await getTestResultsBySystemNumber(minimalEvent);
      expect(testResultsMock).toHaveBeenCalledWith(expectedFilters);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toEqual(200);
      expect(result.body).toEqual(JSON.stringify("Success"));
    });
  });
  context("Service call fails", () => {
    it("returns Error", async () => {
      const myError = new HTTPError(418, "It Broke!");
      TestResultsService.prototype.getTestResultBySystemNumber = jest.fn().mockRejectedValue(myError);

      expect.assertions(3);
      // @ts-ignore
      const result = await getTestResultsBySystemNumber(minimalEvent);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toEqual(418);
      expect(result.body).toEqual(JSON.stringify("It Broke!"));
    });
  });
  context("receiving event with queryParams", () => {
    context("with empty toDateTime", () => {
      it("returns 400 Bad Request", async () => {
        const myEvent = {
          ...minimalEvent,
          queryStringParameters: {
            toDateTime: ""
          }
        };

        // @ts-ignore
        const result = await getTestResultsBySystemNumber(myEvent);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(JSON.stringify(MESSAGES.BAD_REQUEST));
      });
    });
    context("with empty fromDateTime", () => {
      it("returns 400 Bad Request", async () => {
        const myEvent = {
          ...minimalEvent,
          queryStringParameters: {
            fromDateTime: ""
          }
        };

        // @ts-ignore
        const result = await getTestResultsBySystemNumber(myEvent);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(JSON.stringify(MESSAGES.BAD_REQUEST));
      });
    });
    context("with non-empty toDateTime", () => {
      it("invokes testResultsService with custom filters", async () => {
        const testResultsMock = jest.fn().mockResolvedValue("Success");
        TestResultsService.prototype.getTestResultBySystemNumber = testResultsMock;

        const myEvent = {
          ...minimalEvent,
          queryStringParameters: {
            toDateTime: "01-01-2010"
          }
        };

        const expectedFilters = {
          systemNumber: 1,
          testVersion: "current",
          testStatus: "submitted",
          toDateTime: new Date("01-01-2010"),
          fromDateTime: moment(new Date("01-01-2010")).subtract(2, "years").endOf("day").toDate()
        };

        expect.assertions(4);
        // @ts-ignore
        const result = await getTestResultsBySystemNumber(myEvent);
        expect(testResultsMock).toHaveBeenCalledWith(expectedFilters);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify("Success"));
      });
    });
    context("with non-empty fromDateTime", () => {
      it("invokes testResultsService with custom filters", async () => {
        const testResultsMock = jest.fn().mockResolvedValue("Success");
        TestResultsService.prototype.getTestResultBySystemNumber = testResultsMock;

        const myEvent = {
          ...minimalEvent,
          queryStringParameters: {
            fromDateTime: "01-01-2010"
          }
        };

        const expectedFilters = {
          systemNumber: 1,
          testVersion: "current",
          testStatus: "submitted",
          toDateTime: moment().endOf("day").toDate(),
          fromDateTime: new Date("01-01-2010")
        };

        expect.assertions(4);
        // @ts-ignore
        const result = await getTestResultsBySystemNumber(myEvent);
        expect(testResultsMock).toHaveBeenCalledWith(expectedFilters);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify("Success"));
      });
    });
    context("with non-empty status", () => {
      it("invokes testResultsService with custom filters", async () => {
        const testResultsMock = jest.fn().mockResolvedValue("Success");
        TestResultsService.prototype.getTestResultBySystemNumber = testResultsMock;

        const myEvent = {
          ...minimalEvent,
          queryStringParameters: {
            status: "cheese"
          }
        };

        const expectedFilters = {
          systemNumber: 1,
          testVersion: "current",
          testStatus: "cheese",
          toDateTime: moment().endOf("day").toDate(),
          fromDateTime: moment().subtract(2, "years").endOf("day").toDate()
        };

        expect.assertions(4);
        // @ts-ignore
        const result = await getTestResultsBySystemNumber(myEvent);
        expect(testResultsMock).toHaveBeenCalledWith(expectedFilters);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify("Success"));
      });
    });

    context("with non-empty test version", () => {
      it("invokes testResultsService with custom filters", async () => {
        const testResultsMock = jest.fn().mockResolvedValue("Success");
        TestResultsService.prototype.getTestResultBySystemNumber = testResultsMock;

        const myEvent = {
          ...minimalEvent,
          queryStringParameters: {
            version: "archived"
          }
        };

        const expectedFilters = {
          systemNumber: 1,
          testVersion: "archived",
          testStatus: "submitted",
          toDateTime: moment().endOf("day").toDate(),
          fromDateTime: moment().subtract(2, "years").endOf("day").toDate()
        };

        expect.assertions(4);
        // @ts-ignore
        const result = await getTestResultsBySystemNumber(myEvent);
        expect(testResultsMock).toHaveBeenCalledWith(expectedFilters);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(JSON.stringify("Success"));
      });
    });
  });

  context("receiving event with", () => {
    it("undefined system number, should return bad request", async () => {
      const testResultsMock = jest.fn().mockResolvedValue("Success");
      TestResultsService.prototype.getTestResultBySystemNumber = testResultsMock;

      const myEvent = {
        pathParameters: {
          systemNumber: undefined
        },
        queryStringParameters: {
          toDateTime: "01-01-2010"
        }
      };

      expect.assertions(3);
      // @ts-ignore
      const result = await getTestResultsBySystemNumber(myEvent);
      expect(result).toBeInstanceOf(HTTPError);
      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual("Request missing system number")
    });

    it("null system number, should return bad request", async () => {
      const testResultsMock = jest.fn().mockResolvedValue("Success");
      TestResultsService.prototype.getTestResultBySystemNumber = testResultsMock;

      const myEvent = {
        pathParameters: {
          systemNumber: null
        },
        queryStringParameters: {
          toDateTime: "01-01-2010"
        }
      };

      expect.assertions(3);
      // @ts-ignore
      const result = await getTestResultsBySystemNumber(myEvent);
      expect(result).toBeInstanceOf(HTTPError);
      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual("Request missing system number");
    });
  });
});
