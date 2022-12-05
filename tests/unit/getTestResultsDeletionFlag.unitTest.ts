import { TestResultsService } from '../../src/services/TestResultsService';
import { HTTPError } from '../../src/models/HTTPError';
import testResults from '../resources/test-results.json';

describe('getTestResults', () => {
  let testResultsService: TestResultsService | any;
  let MockTestResultsDAO: jest.Mock;
  let testResultsMockDB: any;
  beforeEach(() => {
    testResultsMockDB = testResults;
    MockTestResultsDAO = jest.fn().mockImplementation(() => ({}));
    testResultsService = new TestResultsService(new MockTestResultsDAO());
  });

  afterEach(() => {
    testResultsMockDB = null;
    testResultsService = null;
    MockTestResultsDAO.mockReset();
  });

  context('when a record is found with deletionFlag false', () => {
    it('should return a populated response and status code 200', () => {
      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        getBySystemNumber: () => Array.of(testResultsMockDB[8]),
      }));

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      return testResultsService
        .getTestResultBySystemNumber({
          systemNumber: '1119',
          status: 'submitted',
          fromDateTime: '2017-01-01',
          toDateTime: new Date().toString(),
        })
        .then((returnedRecords: any) => {
          expect(returnedRecords).toBeDefined();
          expect(returnedRecords).not.toEqual({});
          expect(JSON.stringify(returnedRecords[0])).toEqual(
            JSON.stringify(testResultsMockDB[8]),
          );
          expect(returnedRecords).toHaveLength(1);
          expect(returnedRecords[0].deletionFlag).toBe(false);
        });
    });
  });

  context(
    'when a record with one test type is found and the test type has deletionFlag true',
    () => {
      it('should not return that test type', () => {
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          getBySystemNumber: () => Array.of(testResultsMockDB[9]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .getTestResultBySystemNumber({
            systemNumber: '1120',
            status: 'submitted',
            fromDateTime: '2017-01-01',
            toDateTime: new Date().toString(),
          })
          .then((returnedRecords: Array<{ testTypes: { length: any } }>) => {
            expect(returnedRecords[0].testTypes).toHaveLength(0);
          });
      });
    },
  );

  context('when only one record is found with deletionFlag true', () => {
    it('should return a 404 error', () => {
      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        getBySystemNumber: () => Array.of(testResultsMockDB[7]),
      }));

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      expect.assertions(3);
      return testResultsService
        .getTestResultBySystemNumber({
          systemNumber: '1118',
          status: 'submitted',
          fromDateTime: '2017-01-01',
          toDateTime: new Date().toString(),
        })
        .catch((errorResponse: { statusCode: any; body: any }) => {
          expect(errorResponse).toBeInstanceOf(HTTPError);
          expect(errorResponse.statusCode).toBe(404);
          expect(errorResponse.body).toBe(
            'No resources match the search criteria',
          );
        });
    });
  });

  context(
    'when a record with one test type is found and the test type has deletionFlag false',
    () => {
      it('should return a populated response', () => {
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          getBySystemNumber: () => Array.of(testResultsMockDB[10]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .getTestResultBySystemNumber({
            systemNumber: '1121',
            status: 'submitted',
            fromDateTime: '2017-01-01',
            toDateTime: new Date().toString(),
          })
          .then(
            (
              returnedRecords: Array<{
                testTypes: Array<{ deletionFlag: any }>;
              }>,
            ) => {
              expect(returnedRecords[0].testTypes[0].deletionFlag).toBe(false);
            },
          );
      });
    },
  );
});
