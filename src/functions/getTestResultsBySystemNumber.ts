import { TestResultsDAO } from "../models/TestResultsDAO";
import { TestResultsService } from "../services/TestResultsService";
import { HTTPResponse } from "../models/HTTPResponse";
import { MappingUtil } from "../utils/mappingUtil";

export async function getTestResultsBySystemNumber(event: any) {
  const subSegment = MappingUtil.getSubSegment("getTestResultsBySystemNumber");
  const testResultsDAO = new TestResultsDAO();
  const testResultsService = new TestResultsService(testResultsDAO);

  try {
      const data = await testResultsService.getTestResultBySystemNumber( MappingUtil.getTestResultsBySystemNumberFilters(event, subSegment));
      return new HTTPResponse(200, data);
    } catch (error) {
      if (subSegment) {
        subSegment.addError(error.body);
      }
      console.log("Error in getTestResultsBySystemNumber: ", error);
      return new HTTPResponse(error.statusCode, error.body);
    } finally {
    if (subSegment) {
        subSegment.close();
    }
  }
}
