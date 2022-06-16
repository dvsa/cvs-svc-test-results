import {TestResultsDAO} from "../models/TestResultsDAO";
import {TestResultsService} from "../services/TestResultsService";
import {HTTPResponse} from "../models/HTTPResponse";
import { MappingUtil } from "../utils/mappingUtil";
import {Validator} from "../utils/Validator";
import {HTTPRESPONSE} from "../assets/Enums";
import {HTTPError} from "../models";

export async function getTestResultsByTesterStaffId(event: any) {

  const subseg = MappingUtil.getSubSegment("getTestResultsByTesterStaffId");
  const testResultsDAO = new TestResultsDAO();
  const testResultsService = new TestResultsService(testResultsDAO);
  const check: Validator = new Validator();

  if (event.queryStringParameters) {
    if (!check.parametersAreValid(event.queryStringParameters)) {
      return Promise.reject(new HTTPError(400, HTTPRESPONSE.MISSING_PARAMETERS));
    }
  } else {
    return Promise.reject(new HTTPError(400, HTTPRESPONSE.MISSING_PARAMETERS));
  }

  try {
      const data = await testResultsService.getTestResultsByTesterStaffId(MappingUtil.getTestResultsByTesterStaffIdFilters(event, subseg));
      return new HTTPResponse(200, data);
    } catch (error) {
      if (subseg) { subseg.addError(error); }
      console.log("Error in getTestResultsByTesterStaffId: ", error);
      return new HTTPResponse(error.statusCode, error.body);
    } finally {
    if (subseg) { subseg.close(); }
  }
}
