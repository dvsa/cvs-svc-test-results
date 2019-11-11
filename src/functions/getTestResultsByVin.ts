import {TestResultsDAO} from "../models/TestResultsDAO";
import {TestResultsService} from "../services/TestResultsService";
import {HTTPResponse} from "../models/HTTPResponse";
import * as dateFns from "date-fns";
import { MESSAGES } from "../assets/Enums";
import { ISubSeg } from "../models/ISubSeg";
/* workaround AWSXRay.captureAWS(...) call obscures types provided by the AWS sdk.
https://github.com/aws/aws-xray-sdk-node/issues/14
*/
/* tslint:disable */
let AWS:any;
if (process.env._X_AMZN_TRACE_ID) {
  /* tslint:disable */
   AWS = require("aws-xray-sdk");
} else {
  console.log("Serverless Offline detected; skipping AWS X-Ray setup")
  AWS = require("aws-sdk");
}
/* tslint:enable */

export const getTestResultsByVin = async (event: { pathParameters: { vin: any; }; queryStringParameters: { toDateTime: string | number | Date; fromDateTime: string | number | Date; status: string; }; }) => {
    let subseg: ISubSeg | null = null;
    if (process.env._X_AMZN_TRACE_ID) {
    const segment = AWS.getSegment();
    AWS.capturePromise();
    if (segment) {
        subseg = segment.addNewSubsegment("getTestResultsByVin");
    }}
    const testResultsDAO = new TestResultsDAO();
    const testResultsService = new TestResultsService(testResultsDAO);

    const vin = event.pathParameters.vin;
    let testStatus = "submitted";
    let toDateTime = dateFns.endOfToday();
    let fromDateTime = dateFns.subYears(toDateTime, 2);

    try {
        if (event.queryStringParameters) {
            if (event.queryStringParameters.toDateTime === "") {
                if (subseg) { subseg.addError("Bad Request - toDate empty"); }
                console.log("Bad Request in getTestResultsByVin - toDate empty");
                return Promise.resolve(new HTTPResponse(400, MESSAGES.BAD_REQUEST));
            } else if (event.queryStringParameters.fromDateTime === "") {
                if (subseg) { subseg.addError("Bad Request - fromDate empty"); }
                console.log("Bad request in getTestResultsByVin - fromDate empty");
                return Promise.resolve(new HTTPResponse(400, MESSAGES.BAD_REQUEST));
            } else {
                if (event.queryStringParameters.status) { testStatus = event.queryStringParameters.status; }
                if (event.queryStringParameters.toDateTime) { toDateTime = new Date(event.queryStringParameters.toDateTime); }
                if (event.queryStringParameters.fromDateTime) { fromDateTime = new Date(event.queryStringParameters.fromDateTime); }
            }
        }
        return testResultsService.getTestResults({ vin, testStatus, fromDateTime, toDateTime })
            .then((data) => {
                return new HTTPResponse(200, data);
            })
            .catch((error) => {
                if (subseg) { subseg.addError(error.body); subseg.close(); }
                console.log("Error in getTestResultsByVin > getTestResults: ", error);
                return new HTTPResponse(error.statusCode, error.body);
            });
    } finally {
        if (subseg) { subseg.close(); }
    }
};
