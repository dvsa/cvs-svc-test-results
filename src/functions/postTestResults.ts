import { default as unwrappedAWS } from "aws-sdk";
/* tslint:disable */
const AWSXRay = require("aws-xray-sdk");
const AWS = AWSXRay.captureAWS(unwrappedAWS);
/* tslint:enable */
import {TestResultsDAO} from "../models/TestResultsDAO";
import {TestResultsService} from "../services/TestResultsService";
import {HTTPResponse} from "../models/HTTPResponse";
import { MESSAGES } from "../assets/Enums";

export const postTestResults = async (event: { body: any; }) => {
  const segment = AWSXRay.getSegment();
  AWSXRay.capturePromise();
  let subseg: { addError: { (arg0: any): void; (arg0: any): void; }; close: () => void; } | null = null;
  if (segment) {
    subseg = segment.addNewSubsegment("postTestResults");
  }
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
