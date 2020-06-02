import {TestResultsDAO} from "../models/TestResultsDAO";
import {TestResultsService} from "../services/TestResultsService";
import {HTTPResponse} from "../models/HTTPResponse";
import {MESSAGES} from "../assets/Enums";
import {ISubSeg} from "../models/ISubSeg";
import {formatErrorMessage} from "../utils/formatErrorMessage";

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

export const archiveTestResults = async (event: { pathParameters: { testResultId: any; }; body: any; }) => {
  let subseg: ISubSeg | null = null;
  if (process.env._X_AMZN_TRACE_ID) {
    const segment = AWS.getSegment();
    AWS.capturePromise();
    if (segment) {
      subseg = segment.addNewSubsegment("archiveTestResults");
    }
  }
  const testResultsDAO = new TestResultsDAO();
  const testResultsService = new TestResultsService(testResultsDAO);

  const testResultId = event.pathParameters.testResultId;
  const testResult = event.body.testResult;
  const msUserDetails = event.body.msUserDetails;

  try {
    if (!testResult) {
      const errorMessage = MESSAGES.BAD_REQUEST + " test-result object not provided";
      if (subseg) {
        subseg.addError(errorMessage);
      }
      return Promise.resolve(new HTTPResponse(400, formatErrorMessage(errorMessage)));
    }
    if (!testResult.vin) {
      const errorMessage = MESSAGES.BAD_REQUEST + " VIN not provided";
      if (subseg) {
        subseg.addError(errorMessage);
      }
      return Promise.resolve(new HTTPResponse(400, formatErrorMessage(errorMessage)));
    }
    if (!msUserDetails || !msUserDetails.msUser || !msUserDetails.msOid) {
      const errorMessage = MESSAGES.BAD_REQUEST + " msUserDetails not provided";
      if (subseg) {
        subseg.addError(errorMessage);
      }
      return Promise.resolve(new HTTPResponse(400, formatErrorMessage(errorMessage)));
    }

    return testResultsService.archiveTestResult(testResultId, testResult, msUserDetails)
      .then((data) => {
        return new HTTPResponse(200, data);
      })
      .catch((error) => {
        console.log("Error in archiveTestResults > archiveTestResults: ", error);
        if (subseg) {
          subseg.addError(error.body);
        }
        return new HTTPResponse(error.statusCode, error.body);
      });
  } finally {
    if (subseg) {
      subseg.close();
    }
  }
};
