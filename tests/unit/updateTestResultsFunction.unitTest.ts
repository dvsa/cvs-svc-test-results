import {updateTestResults} from "../../src/functions/updateTestResults";
import {TestResultsService} from "../../src/services/TestResultsService";
import {HTTPResponse} from "../../src/models/HTTPResponse";
import {HTTPError} from "../../src/models/HTTPError";
jest.mock("../../src/services/TestResultsService");

describe("updateTestResults Function", () => {
    let event: any;
    beforeEach(() => {
        event = {
            pathParameters: {
                testResultId: 1
            },
            body: {}
        };
    });

    afterEach(() => {
        event = null;
    });

    context("when testResult object is not present on the payload", () => {
        it("should return Error 400 Bad request test-result object not provided", async () => {
            const testResultsMock = jest.fn().mockResolvedValue("Failure");
            TestResultsService.prototype.updateTestResult = testResultsMock;

            expect.assertions(3);
            const result = await updateTestResults(event);
            expect(result).toBeInstanceOf(HTTPResponse);
            expect(result.statusCode).toEqual(400);
            expect(JSON.parse(result.body).errors).toContain("Bad request test-result object not provided");
        });
    });

    context("when msUserDetails object is not present on the payload", () => {
        it("should return Error 400 Bad request msUserDetails not provided", async () => {
            const testResultsMock = jest.fn().mockResolvedValue("Failure");
            TestResultsService.prototype.updateTestResult = testResultsMock;
            event.body.testResult = "something";

            expect.assertions(3);
            const result = await updateTestResults(event);
            expect(result).toBeInstanceOf(HTTPResponse);
            expect(result.statusCode).toEqual(400);
            expect(JSON.parse(result.body).errors).toContain("Bad request msUserDetails not provided");
        });
    });

    context("Service call fails", () => {
        it("returns Error", async () => {
            const myError = new HTTPError(418, "It Broke!");
            TestResultsService.prototype.updateTestResult = jest.fn().mockRejectedValue(myError);
            event.body.testResult = "something";
            event.body.msUserDetails = {msOid: "2", msUser: "dorel"};

            expect.assertions(3);
            const result = await updateTestResults(event);
            expect(result).toBeInstanceOf(HTTPResponse);
            expect(result.statusCode).toEqual(418);
            expect(result.body).toEqual(JSON.stringify("It Broke!"));
        });
    });

    context("Service call succeeds", () => {
        it("returns 200 + data", async () => {
            const testResultsMock = jest.fn().mockResolvedValue("Success");
            TestResultsService.prototype.updateTestResult = testResultsMock;

            event.body.testResult = "something";
            event.body.msUserDetails = {msOid: "2", msUser: "dorel"};

            expect.assertions(3);
            const result = await updateTestResults(event);
            expect(result).toBeInstanceOf(HTTPResponse);
            expect(result.statusCode).toEqual(200);
            expect(result.body).toEqual(JSON.stringify("Success"));
        });
    });
});
