import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import {TestResultsDAO} from "../models/TestResultsDAO";
import {TestResultsService} from "../services/TestResultsService";
import {HTTPResponse} from "../models/HTTPResponse";
import { ISubSeg } from "./ISubSeg";
/* workaround AWSXRay.captureAWS(...) call obscures types provided by the AWS sdk.
https://github.com/aws/aws-xray-sdk-node/issues/14
*/
/* tslint:disable */
const AWSXRay = require('aws-xray-sdk');
let AWS: { DynamoDB: { DocumentClient: new (arg0: any) => DocumentClient; }; };
if (process.env._X_AMZN_TRACE_ID) {
  AWS = AWSXRay.captureAWS(require("aws-sdk"));
} else {
  console.log("Serverless Offline detected; skipping AWS X-Ray setup")
  AWS = require("aws-sdk");
}
/* tslint:enable */

export const getTestResultsByTesterStaffId = async (event: any) => {
  const segment = AWSXRay.getSegment();
  AWSXRay.capturePromise();
  let subseg: ISubSeg | null = null;
  if (segment) {
    subseg = segment.addNewSubsegment("getTestResultsByTesterStaffId");
  }
  const testResultsDAO = new TestResultsDAO();
  const testResultsService = new TestResultsService(testResultsDAO);

  const testerStaffId = event.queryStringParameters.testerStaffId;
  const testStationPNumber = event.queryStringParameters.testStationPNumber;
  const toDateTime = new Date(event.queryStringParameters.toDateTime);
  const fromDateTime = new Date(event.queryStringParameters.fromDateTime);

  const BAD_REQUEST_MISSING_FIELDS = "Bad request in getTestResultsByTesterStaffId - missing required parameters";

  try {
    if (!event.queryStringParameters) {
      if (event.queryStringParameters.testerStaffId && event.queryStringParameters.testStationPNumber && event.queryStringParameters.toDateTime && event.queryStringParameters.fromDateTime) {
        console.log(BAD_REQUEST_MISSING_FIELDS);
        if (subseg) { subseg.addError(BAD_REQUEST_MISSING_FIELDS); }
        return Promise.resolve(new HTTPResponse(400, "Bad Request"));
      }
    }

    return testResultsService.getTestResults({ testerStaffId, testStationPNumber, fromDateTime, toDateTime })
      .then((data: any) => {
        return new HTTPResponse(200, data);
      })
      .catch((error: { statusCode: any; body: any; }) => {
        if (subseg) { subseg.addError(error); }
        console.log("Error in getTestResultsByTesterStaffId > getTestResults: ", error);
        return new HTTPResponse(error.statusCode, error.body);
      });
  } finally {
    if (subseg) { subseg.close(); }
  }
};