import supertest from 'supertest';
import { CENTRAL_DOCS_TEST } from '@dvsa/cvs-microservice-common/classes/testTypes/Constants';
import { ITestResultPayload } from '../../src/models';
import testResultsPostMock from '../resources/test-results-post.json';

const url = 'http://localhost:3006/';
const request = supertest(url);

describe('postTestResults', () => {
  context('when submitting a test result with central docs', () => {
    it('should return 400 when central docs are required but missing', async () => {
      const testResult =
        testResultsPostMock[15] as unknown as ITestResultPayload;

      testResult.testTypes[0].testTypeId = CENTRAL_DOCS_TEST.IDS[3];
      delete testResult.testTypes[0].centralDocs;

      const res = await request.post('test-results').send(testResult);

      expect(res.status).toBe(400);
      expect(res.body).toBe('Central docs required for test type 47');
    });
  });

  context('when submitting an invalid test result', () => {
    it('should return 400 for missing required fields', async () => {
      const testResult =
        testResultsPostMock[10] as unknown as ITestResultPayload;
      delete testResult.testResultId;
      const res = await request.post('test-results').send(testResult);

      console.log(res);
      expect(res.status).toBe(400);
      expect(res.body.errors).toContain('"testResultId" is required');
    });
  });
});
