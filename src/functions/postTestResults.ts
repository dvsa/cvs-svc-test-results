import {TestResultsDAO} from "../models/TestResultsDAO";
import {TestResultsService} from "../services/TestResultsService";
import {HTTPResponse} from "../models/HTTPResponse";
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

export const postTestResults = async (event: { body: any; }) => {
  let subseg: ISubSeg | null = null;
  if (process.env._X_AMZN_TRACE_ID) {
  const segment = AWS.getSegment();
  AWS.capturePromise();
  if (segment) {
    subseg = segment.addNewSubsegment("postTestResults");
  }}
  const testResultsDAO = new TestResultsDAO();
  const testResultsService = new TestResultsService(testResultsDAO);

  const payload = event.body;

  try {
    if (!payload) {
      if (subseg) { subseg.addError(MESSAGES.INVALID_JSON); }
      return Promise.resolve(new HTTPResponse(400, MESSAGES.INVALID_JSON));
    }

    return testResultsService.insertTestResult(payload)
      .then(() => {
        return new HTTPResponse(201, MESSAGES.RECORD_CREATED);
      })
      .catch((error) => {
        console.log("Error in postTestResults > insertTestResults: ", error);
        if (subseg) { subseg.addError(error.body); }
        return new HTTPResponse(error.statusCode, error.body);
      });
  } finally {
    if (subseg) {
      subseg.close();
    }
  }
};
