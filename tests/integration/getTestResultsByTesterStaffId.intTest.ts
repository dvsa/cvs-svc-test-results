/* global describe context it before beforeEach after afterEach */
import supertest from 'supertest';
import testResultsMockDB from '../resources/test-results.json';

const url = 'http://localhost:3006/';
const request = supertest(url);

describe('getTestResultsByTesterStaffId', () => {
  context('when database is populated', () => {
    context('and when a search by testerStaffId is done', () => {
      context(
        "and there are test results for that testerStaffId that have status 'submitted' and testStartTimestamp > fromDateTime and testEndTimestamp < toDateTime and testStaionPNumber exists",
        () => {
          it('should return the test results for that testerStaffId and the provided parameters', async () => {
            const res = await request.get(
              'test-results/getTestResultsByTesterStaffId?testerStaffId=15&fromDateTime=2021-01-13&toDateTime=2021-01-15&testStationPNumber=84-926821&testStatus=submitted',
            );
            const expectedResponse = Array.of(testResultsMockDB[19]);
            expect(res.status).toBe(200);
            expect(res.header['access-control-allow-origin']).toBe('*');
            expect(res.header['access-control-allow-credentials']).toBe('true');
            expect(res.body[0].testerStaffId).toEqual(
              expectedResponse[0].testerStaffId,
            );
            expect(res.body[0].testStationPNumber).toEqual(
              expectedResponse[0].testStationPNumber,
            );
          });
        },
      );
      context(
        'but there are no test results for the testerStaffId specified',
        () => {
          it('should return 404', async () => {
            const res = await request.get(
              'test-results/getTestResultsByTesterStaffId?testerStaffId=9999?&status=submitted&fromDateTime=2021-01-01&toDateTime=2022-02-23',
            );
            expect(res.status).toBe(404);
            expect(res.header['access-control-allow-origin']).toBe('*');
            expect(res.header['access-control-allow-credentials']).toBe('true');
            expect(res.body).toBe('No resources match the search criteria');
          });
        },
      );
    });
  });
});
