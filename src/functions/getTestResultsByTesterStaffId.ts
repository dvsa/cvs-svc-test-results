import {TestResultsDAO} from "../models/TestResultsDAO";
import {TestResultsService} from "../services/TestResultsService";
import {HTTPResponse} from "../models/HTTPResponse";
import { MappingUtil } from "../utils/mappingUtil";

export async function getTestResultsByTesterStaffId(event: any) {

  const subseg = MappingUtil.getSubSegment("getTestResultsByTesterStaffId");
  const testResultsDAO = new TestResultsDAO();
  const testResultsService = new TestResultsService(testResultsDAO);

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
