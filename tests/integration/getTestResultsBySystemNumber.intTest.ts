/* global describe context it before beforeEach after afterEach */
import supertest from 'supertest';
import testResultsMockDB from '../resources/test-results.json';

const url = 'http://localhost:3006/';
const request = supertest(url);

describe('getTestResultsBySystemNumber', () => {
  context('when database is populated', () => {
    context('and when a search by systemNumber is done', () => {
      context('and no status is provided', () => {
        context('and toDateTime and fromDateTime are not provided', () => {
          context(
            "and there are test results for that systemNumber that have status 'submitted' and createdAt date value between two years ago and today",
            () => {
              it("should return the test results for that systemNumber with default status 'submitted' and default date interval which is from too years ago until today", async () => {
                const res = await request.get('test-results/11000002/');
                const expectedResponse = Array.of(testResultsMockDB[1]);
                expect(res.status).toBe(200);
                expect(res.header['access-control-allow-origin']).toBe('*');
                expect(res.header['access-control-allow-credentials']).toBe(
                  'true',
                );
                expect(res.body).toEqual(expectedResponse);
              });
            },
          );
        });
      });
    });

    context('and status is provided', () => {
      context('and toDateTime and fromDateTime are provided', () => {
        context(
          'and there are test results in the db that satisfy both conditions',
          () => {
            it("should return the test results for that systemNumber with status 'submitted' and that have createdAt value between 2021-01-01 and 2023-02-23", async () => {
              const res = await request.get(
                'test-results/11000002?status=submitted&fromDateTime=2021-01-01&toDateTime=2023-02-23',
              );
              expect(res.status).toBe(200);
              expect(res.header['access-control-allow-origin']).toBe('*');
              expect(res.header['access-control-allow-credentials']).toBe(
                'true',
              );
            });
          },
        );

        context(
          'but there are no test results in the date range specified',
          () => {
            it('should return 404', async () => {
              const res = await request.get(
                'test-results/1999?status=submitted&fromDateTime=2021-01-01&toDateTime=2022-02-23',
              );
              expect(res.status).toBe(404);
              expect(res.header['access-control-allow-origin']).toBe('*');
              expect(res.header['access-control-allow-credentials']).toBe(
                'true',
              );
              expect(res.body).toBe('No resources match the search criteria');
            });
          },
        );
      });
    });

    context(
      "and there are no test results for that systemNumber that have status 'cancelled'",
      () => {
        it('should return 404', async () => {
          const res = await request.get('test-results/1999?status=cancelled');
          expect(res.status).toBe(404);
          expect(res.header['access-control-allow-origin']).toBe('*');
          expect(res.header['access-control-allow-credentials']).toBe('true');
          expect(res.body).toBe('No resources match the search criteria');
        });
      },
    );
  });
});

context('when database is empty,', () => {
  it('should return error code 404', async () => {
    const res = await request.get('test-results');
    expect(res.status).toBe(404);
  });
});
