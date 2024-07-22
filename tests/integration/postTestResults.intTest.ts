import supertest from 'supertest';
import { ITestResultPayload } from '../../src/models';
import testResultsPostMock from '../resources/test-results-post.json';
import { CENTRAL_DOCS_TEST_TYPES } from '../../src/assets/Enums';

const url = 'http://localhost:3006/';
const request = supertest(url);

describe('postTestResults', () => {
  let testResult: ITestResultPayload;
  beforeEach(() => {
    testResult = testResultsPostMock[15] as unknown as ITestResultPayload;
    jest.resetAllMocks();
  });

  context('when submitting a test result with central docs', () => {
    it('should return 400 when central docs are required but missing', async () => {
      testResult.testTypes[0].testTypeId = CENTRAL_DOCS_TEST_TYPES[3];
      delete testResult.testTypes[0].centralDocs;

      const res = await request.post('test-results').send(testResult);

      expect(res.status).toBe(400);
      expect(res.body).toBe('Central docs required for test type 142');
    });
  });

  context('when submitting an invalid test result', () => {
    it('should return 400 for missing required fields', async () => {
      testResult.testTypes[0].centralDocs = {
        issueRequired: false,
        notes: 'notes',
        reasonsForIssue: ['issue reason'],
      };
      delete testResult.testResultId;

      const res = await request.post('test-results').send(testResult);

      expect(res.status).toBe(400);
      expect(res.body.errors).toContain('"testResultId" is required');
    });
  });
});
