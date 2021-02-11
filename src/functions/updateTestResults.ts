import { TestResultsDAO } from "../models/TestResultsDAO";
import { TestResultsService } from "../services/TestResultsService";
import { HTTPResponse } from "../models/HTTPResponse";
import { MESSAGES } from "../assets/Enums";
import { MappingUtil } from "../utils/mappingUtil";

export async function updateTestResults(event: {
  pathParameters: { systemNumber: any };
  body: any;
}) {
  const subseg = MappingUtil.getSubSegment("updateTestResults");
  const testResultsDAO = new TestResultsDAO();
  const testResultsService = new TestResultsService(testResultsDAO);

  const systemNumber = event.pathParameters.systemNumber;
  const testResult = event.body.testResult;
  const msUserDetails = event.body.msUserDetails;

  try {
    if (!testResult) {
      const errorMessage = MESSAGES.BAD_REQUEST + " testResult not provided";
      if (subseg) {
        subseg.addError(errorMessage);
      }
      return Promise.resolve(new HTTPResponse(400, errorMessage));
    }
    if (!msUserDetails || !msUserDetails.msUser || !msUserDetails.msOid) {
      const errorMessage = MESSAGES.BAD_REQUEST + " msUserDetails not provided";
      if (subseg) {
        subseg.addError(errorMessage);
      }
      return Promise.resolve(new HTTPResponse(400, errorMessage));
    }

    try {
      const data = await testResultsService.updateTestResult(
        systemNumber,
        testResult,
        msUserDetails
      );
      return new HTTPResponse(200, data);
    } catch (error) {
      console.log("Error in updateTestResults > updateTestResults: ", error);
      if (subseg) {
        subseg.addError(error.body);
      }
      return new HTTPResponse(error.statusCode, error.body);
    }
  } finally {
    if (subseg) {
      subseg.close();
    }
  }
}
