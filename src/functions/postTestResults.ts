import { TestResultsDAO } from '../models/TestResultsDAO';
import { TestResultsService } from '../services/TestResultsService';
import { HTTPResponse } from '../models/HTTPResponse';
import { MESSAGES } from '../assets/Enums';
import { MappingUtil } from '../utils/mappingUtil';

export async function postTestResults(event: { body: any }) {
  const subseg = MappingUtil.getSubSegment('postTestResults');
  const testResultsDAO = new TestResultsDAO();
  const testResultsService = new TestResultsService(testResultsDAO);

  const payload = event.body;
  try {
    if (!payload) {
      if (subseg) {
        subseg.addError(MESSAGES.INVALID_JSON);
      }
      return await Promise.resolve(
        new HTTPResponse(400, MESSAGES.INVALID_JSON),
      );
    }
    await testResultsService.insertTestResult(payload);
    return new HTTPResponse(201, MESSAGES.RECORD_CREATED);
  } catch (error) {
    console.log('Error in postTestResults > insertTestResults: ', error);
    if (subseg) {
      subseg.addError(error.body);
    }
    return new HTTPResponse(error.statusCode, error.body);
  } finally {
    if (subseg) {
      subseg.close();
    }
  }
}
