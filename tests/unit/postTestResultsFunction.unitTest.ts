import { postTestResults } from '../../src/functions/postTestResults';
import { TestResultsService } from '../../src/services/TestResultsService';
import { HTTPResponse } from '../../src/models/HTTPResponse';
import { HTTPError } from '../../src/models/HTTPError';
import { MESSAGES } from '../../src/assets/Enums';

jest.mock('../../src/services/TestResultsService');

describe('postTestResults Function', () => {
  context('when testResult object is not present on the body', () => {
    it('should return Error 400 Body is not a valid JSON', async () => {
      const testResultsMock = jest.fn().mockResolvedValue('Failure');
      TestResultsService.prototype.insertTestResult = testResultsMock;

      expect.assertions(3);
      const result = await postTestResults({} as any);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(JSON.stringify(MESSAGES.INVALID_JSON));
    });
  });

  context('Service call fails', () => {
    it('returns Error', async () => {
      const myError = new HTTPError(418, 'It Broke!');
      TestResultsService.prototype.insertTestResult = jest
        .fn()
        .mockRejectedValue(myError);

      expect.assertions(3);
      const result = await postTestResults({ body: 'something' });
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toBe(418);
      expect(result.body).toEqual(JSON.stringify('It Broke!'));
    });
  });

  context('Service call succeeds', () => {
    it('returns 200 + data', async () => {
      const testResultsMock = jest.fn().mockResolvedValue('Success');
      TestResultsService.prototype.insertTestResult = testResultsMock;

      expect.assertions(3);
      const result = await postTestResults({ body: 'something' });
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toBe(201);
      expect(result.body).toEqual(JSON.stringify('Test records created'));
    });
  });
});
