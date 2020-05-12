import {TestResultsDAO} from "../models/TestResultsDAO";
import {TestResultsService} from "../services/TestResultsService";
import {HTTPResponse} from "../models/HTTPResponse";
import * as dateFns from "date-fns";
import {MESSAGES, TEST_VERSION} from "../assets/Enums";
import {ISubSeg} from "../models/ISubSeg";
/* workaround AWSXRay.captureAWS(...) call obscures types provided by the AWS sdk.
https://github.com/aws/aws-xray-sdk-node/issues/14
*/
/* tslint:disable */
let AWS: any;
if (process.env._X_AMZN_TRACE_ID) {
    /* tslint:disable */
    AWS = require("aws-xray-sdk");
} else {
    console.log("Serverless Offline detected; skipping AWS X-Ray setup");
}
/* tslint:enable */

export const getTestResultsBySystemNumber = async (event: {
    pathParameters: { systemNumber: any; };
    queryStringParameters: { toDateTime: string | number | Date; fromDateTime: string | number | Date; status: string; testResultId: string; version: string; }; }) => {
    let subseg: ISubSeg | null = null;
    if (process.env._X_AMZN_TRACE_ID) {
        const segment = AWS.getSegment();
        AWS.capturePromise();
        if (segment) {
            subseg = segment.addNewSubsegment("getTestResultsBySystemNumber");
        }
    }
    const testResultsDAO = new TestResultsDAO();
    const testResultsService = new TestResultsService(testResultsDAO);

    const systemNumber = event.pathParameters.systemNumber;
    let testResultId;
    let testStatus = "submitted";
    let testVersion = TEST_VERSION.CURRENT;
    let toDateTime = dateFns.endOfToday();
    let fromDateTime = dateFns.subYears(toDateTime, 2);

    try {
        if (event.queryStringParameters) {
            if (event.queryStringParameters.toDateTime === "") {
                if (subseg) {
                    subseg.addError("Bad Request - toDate empty");
                }
                console.log("Bad Request in getTestResultsBySystemNumber - toDate empty");
                return Promise.resolve(new HTTPResponse(400, MESSAGES.BAD_REQUEST));
            } else if (event.queryStringParameters.fromDateTime === "") {
                if (subseg) {
                    subseg.addError("Bad Request - fromDate empty");
                }
                console.log("Bad request in getTestResultsBySystemNumber - fromDate empty");
                return Promise.resolve(new HTTPResponse(400, MESSAGES.BAD_REQUEST));
            } else {
                if (event.queryStringParameters.status) {
                    testStatus = event.queryStringParameters.status;
                }
                if (event.queryStringParameters.toDateTime) {
                    toDateTime = new Date(event.queryStringParameters.toDateTime);
                }
                if (event.queryStringParameters.fromDateTime) {
                    fromDateTime = new Date(event.queryStringParameters.fromDateTime);
                }
                if (event.queryStringParameters.testResultId) {
                    testResultId = event.queryStringParameters.testResultId;
                }
                if (event.queryStringParameters.version) {
                    testVersion = event.queryStringParameters.version;
                }
            }
        }
        return testResultsService.getTestResults({systemNumber, testStatus, fromDateTime, toDateTime, testResultId, testVersion})
            .then((data) => {
                return new HTTPResponse(200, data);
            })
            .catch((error) => {
                if (subseg) {
                    subseg.addError(error.body);
                    subseg.close();
                }
                console.log("Error in getTestResultsBySystemNumber > getTestResults: ", error);
                return new HTTPResponse(error.statusCode, error.body);
            });
    } finally {
        if (subseg) {
            subseg.close();
        }
    }
};
