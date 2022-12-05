import fs from 'fs';
import path from 'path';
import { cloneDeep } from 'lodash';
import { TestResultsService } from '../../src/services/TestResultsService';
import { HTTPError } from '../../src/models/HTTPError';
import { MESSAGES } from '../../src/assets/Enums';
import * as models from '../../src/models';

describe('getTestResultsByTesterStaffId path of TestResultsService', () => {
  let testResultsService: TestResultsService | any;
  let MockTestResultsDAO: jest.Mock;
  let testResultsMockDB: any;
  beforeEach(() => {
    testResultsMockDB = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../resources/test-results.json'),
        'utf8',
      ),
    );
    MockTestResultsDAO = jest.fn().mockImplementation(() => ({}));
    testResultsService = new TestResultsService(new MockTestResultsDAO());
  });

  afterEach(() => {
    testResultsMockDB = null;
    testResultsService = null;
    MockTestResultsDAO.mockReset();
  });

  context('no params are passed', () => {
    it('should throw error 400-Bad request', () => {
      expect.assertions(3);
      return testResultsService
        .getTestResultsByTesterStaffId({})
        .catch((errorResponse: { statusCode: any; body: any }) => {
          expect(errorResponse).toBeInstanceOf(HTTPError);
          expect(errorResponse.statusCode).toBe(400);
          expect(errorResponse.body).toEqual(MESSAGES.BAD_REQUEST);
        });
    });
  });

  context('when a record is found', () => {
    it('should return a populated response and status code 200', () => {
      MockTestResultsDAO = jest.fn().mockImplementation((testerStaffId) => ({
        getByTesterStaffId: () => Promise.resolve([testResultsMockDB[0]]),
      }));

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      return testResultsService
        .getTestResultsByTesterStaffId({
          testerStaffId: '1',
          testStationPNumber: '87-1369569',
          fromDateTime: '2015-02-22',
          toDateTime: '2021-02-22',
        })
        .then((returnedRecords: any) => {
          expect(returnedRecords).toBeDefined();
          expect(returnedRecords).not.toEqual({});
          expect(returnedRecords[0]).toEqual(testResultsMockDB[0]);
          expect(returnedRecords).toHaveLength(1);
        });
    });
  });

  context('when getByTesterStaffId throws error', () => {
    MockTestResultsDAO = jest.fn().mockImplementation(() => ({
      getByTesterStaffId: () => {
        throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
      },
    }));

    const testResultsServiceMock = new TestResultsService(
      new MockTestResultsDAO(),
    );
    it('should throw an error 500-Internal Error', () => {
      expect.assertions(3);
      return testResultsServiceMock
        .getTestResultsByTesterStaffId({
          testerStaffId: '5',
          testStationPNumber: '87-1369569',
          fromDateTime: '2015-02-22',
          toDateTime: '2021-02-22',
        })
        .catch((errorResponse: { statusCode: any; body: any }) => {
          expect(errorResponse).toBeInstanceOf(HTTPError);
          expect(errorResponse.statusCode).toBe(500);
          expect(errorResponse.body).toEqual(MESSAGES.INTERNAL_SERVER_ERROR);
        });
    });
  });

  context('when no data was found', () => {
    it('should throw an error 404-No resources match the search criteria', () => {
      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        getByTesterStaffId: () => Promise.resolve([]),
      }));

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      expect.assertions(3);
      return testResultsService
        .getTestResultsByTesterStaffId({
          testerStaffId: '1',
          testStationPNumber: '87-13695',
          fromDateTime: '2015-02-22',
          toDateTime: '2021-02-22',
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

  context('when using testStatus filter)', () => {
    it('should only return submitted tests, not cancelled', () => {
      const filters: models.ITestResultFilters = {
        testerStaffId: '15',
        testStationPNumber: '84-926821',
        fromDateTime: '2015-02-22',
        toDateTime: '2021-02-22',
        testStatus: 'submitted',
      };
      const filteredTestResults = cloneDeep(testResultsMockDB).filter(
        (test: models.ITestResult) =>
          test.testerStaffId === '15' &&
          test.testStationPNumber === filters.testStationPNumber &&
          test.testStartTimestamp > filters.fromDateTime &&
          test.testEndTimestamp < filters.toDateTime,
      );
      MockTestResultsDAO = jest.fn().mockImplementation((testerStaffId) => ({
        getByTesterStaffId: () => Promise.resolve(filteredTestResults),
      }));
      const expectedResult = cloneDeep(testResultsMockDB[1]);

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      expect.assertions(4);
      return testResultsService
        .getTestResultsByTesterStaffId(filters)
        .then((returnedRecords: models.ITestResult[]) => {
          expect(returnedRecords).toBeDefined();
          expect(returnedRecords).not.toEqual({});
          expect(returnedRecords[0]).toEqual(expectedResult);
          expect(returnedRecords).toHaveLength(2);
        });
    });
  });
});
