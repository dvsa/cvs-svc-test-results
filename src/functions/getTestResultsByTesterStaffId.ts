import {TestResultsDAO} from "../models/TestResultsDAO";
import {TestResultsService} from "../services/TestResultsService";
import {HTTPResponse} from "../models/HTTPResponse";
import { ISubSeg } from "../models/ISubSeg";
import {MESSAGES} from "../assets/Enums";
/* workaround AWSXRay.captureAWS(...) call obscures types provided by the AWS sdk.
https://github.com/aws/aws-xray-sdk-node/issues/14
*/
/* tslint:disable */
let AWS:any;
if (process.env._X_AMZN_TRACE_ID) {
  /* tslint:disable */
   AWS = require("aws-xray-sdk");
} else {
  console.log("Serverless Offline detected; skipping AWS X-Ray setup");
}
/* tslint:enable */
export const getTestResultsByTesterStaffId = async (event: any) => {
  let subseg: ISubSeg | null = null;
  if (process.env._X_AMZN_TRACE_ID) {
  const segment = AWS.getSegment();
  AWS.capturePromise();

  if (segment) {
    subseg = segment.addNewSubsegment("getTestResultsByTesterStaffId");
  }}
  const testResultsDAO = new TestResultsDAO();
  const testResultsService = new TestResultsService(testResultsDAO);

  const testerStaffId = event.queryStringParameters.testerStaffId;
  const testStationPNumber = event.queryStringParameters.testStationPNumber;
  const toDateTime = new Date(event.queryStringParameters.toDateTime);
  const fromDateTime = new Date(event.queryStringParameters.fromDateTime);

  const BAD_REQUEST_MISSING_FIELDS = "Bad request in getTestResultsByTesterStaffId - missing required parameters";

  try {
    if (!event.queryStringParameters || !(event.queryStringParameters.testerStaffId && event.queryStringParameters.toDateTime && event.queryStringParameters.fromDateTime)) {
      console.log(BAD_REQUEST_MISSING_FIELDS);
      if (subseg) { subseg.addError(BAD_REQUEST_MISSING_FIELDS); }
      return Promise.resolve(new HTTPResponse(400, MESSAGES.BAD_REQUEST));
    }

    const filters: any = { testerStaffId, testStationPNumber, fromDateTime, toDateTime };
    if (event.queryStringParameters.testStatus) {
      filters.testStatus = event.queryStringParameters.testStatus;
    }
    return testResultsService.getTestResults(filters)
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
