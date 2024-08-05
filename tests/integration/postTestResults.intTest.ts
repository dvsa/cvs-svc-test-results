import supertest from 'supertest';
import { ITestResultPayload } from '../../src/models';
import testResultsPostMock from '../resources/test-results-post.json';

const url = 'http://localhost:3006/';
const request = supertest(url);

describe('postTestResults', () => {
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
