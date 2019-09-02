/* global describe context it before beforeEach after afterEach */
import supertest from "supertest";
import { expect } from "chai";
const url = "http://localhost:3006/";
const request = supertest(url);
import { TestResultsService } from "../../src/services/TestResultsService";
import { TestResultsDAO } from "../../src/models/TestResultsDAO";
import fs from "fs";
import path from "path";

describe("getTestResultsByVin", () => {
  let testResultsService: TestResultsService | any;
  let testResultsMockDB: any;
  let testResultsPostMock: any;

  beforeEach((done) => {
    testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
    testResultsPostMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-post.json"), "utf8"));
    testResultsService = new TestResultsService(new TestResultsDAO());
    testResultsService.insertTestResultsList(testResultsMockDB);
    done();
  });

  afterEach((done) => {
    testResultsMockDB = null;
    testResultsService.deleteTestResultsList([{ "1B7GG36N12S678410": "1" }, { "1B7GG36N12S678410": "2" }, { "1B7GG36N12S678425": "3" }]);
    testResultsService = null;
    done();
  });

  context("when database is populated", () => {
    context("and when a search by VIN is done", () => {
      context("and no status is provided", () => {
        context("and toDateTime and fromDateTime are not provided", () => {
          context("and there are test results for that VIN that have status 'submitted' and createdAt date value between two years ago and today", () => {
            it("should return the test results for that VIN with default status 'submitted' and default date interval which is from too years ago until today", (done) => {
              request.get("test-results/1B7GG36N12S678410/")
                .end((err: Error, res: any) => {
                  const expectedResponse = Array.of(testResultsMockDB[1]);
                  delete expectedResponse[0].testResultId;
                  if (err) { expect.fail(err); }
                  expect(res.statusCode).to.equal(200);
                  expect(res.headers["access-control-allow-origin"]).to.equal("*");
                  expect(res.headers["access-control-allow-credentials"]).to.equal("true");
                  done();
                });
            });
          });
        });
      });

      context("and status is provided", () => {
        context("and toDateTime and fromDateTime are provided", () => {
          context("and there are test results in the db that satisfy both conditions", () => {
            it("should return the test results for that VIN with status 'submitted' and that have createdAt value between 2017-01-01 and 2019-02-23", (done) => {
              request.get("test-results/1B7GG36N12S678410?status=submitted&fromDateTime=2017-01-01&toDateTime=2019-02-23")
                .end((err: Error, res: any) => {
                  if (err) { expect.fail(err); }
                  expect(res.statusCode).to.equal(200);
                  expect(res.headers["access-control-allow-origin"]).to.equal("*");
                  expect(res.headers["access-control-allow-credentials"]).to.equal("true");
                  done();
                });
            });
          });
          context("but there are no test results in the date range specified", () => {
            it("should return 404", (done) => {
              request.get("test-results/1B7GG36N12S678425?status=submitted&fromDateTime=2021-01-01&toDateTime=2022-02-23")
                .end((err: Error, res: any) => {
                  if (err) { expect.fail(err); }
                  expect(res.statusCode).to.equal(404);
                  expect(res.headers["access-control-allow-origin"]).to.equal("*");
                  expect(res.headers["access-control-allow-credentials"]).to.equal("true");
                  expect(res.body).to.equal("No resources match the search criteria");
                  done();
                });
            });
          });
        });
      });

      context("and there are no test results for that VIN that have status 'cancelled'", () => {
        it("should return 404", (done) => {
          request.get("test-results/1B7GG36N12S678425?status=cancelled")
            .end((err: Error, res: any) => {
              if (err) { expect.fail(err); }
              expect(res.statusCode).to.equal(404);
              expect(res.headers["access-control-allow-origin"]).to.equal("*");
              expect(res.headers["access-control-allow-credentials"]).to.equal("true");
              expect(res.body).to.equal("No resources match the search criteria");
              done();
            });
        });
      });
    });
  });

  context("when database is empty,", () => {
    it("should return error code 404", (done) => {
      request.get("test-results").expect(404, done);
      done();
    });
  });
});


describe("insertTestResults", () => {
  // let mockData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json')))
  // let testResultsService = null
  // let testResultsDAO = null
  // before((done) => {
  //   testResultsDAO = new TestResultsDAO()
  //   testResultsService = new TestResultsService(testResultsDAO)
  //   done()
  // })

  let testResultsService: TestResultsService | any;
  let testResultsMockDB: any;
  let testResultsPostMock: any;
  let testResultsDAO: TestResultsDAO | any;

  beforeEach((done) => {
    testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
    testResultsPostMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-post.json"), "utf8"));
    testResultsDAO = new TestResultsDAO();
    testResultsService = new TestResultsService(testResultsDAO);
    testResultsService.insertTestResultsList(testResultsMockDB);
    done();
  });

  afterEach((done) => {
    testResultsDAO.getByVin(testResultsPostMock[0].vin)
      .then((object: any) => {
        const scheduledForDeletion: any = {};
        console.log("scheduledForDeletion object.Items[0].testResultId , object.Items[0].vin", object.Items[0].testResultId, object.Items[0].vin);
        scheduledForDeletion[object.Items[0].vin] = object.Items[0].testResultId;
        testResultsService.deleteTestResultsList([scheduledForDeletion]);
      });
    testResultsMockDB = null;
    testResultsService = null;
    done();
  });

  // context('POST /test-results with valid data', () => {
  //   it('responds with HTTP 201', function (done) {
  //     request
  //       .post('test-results')
  //       .send(JSON.stringify(testResultsPostMock[0]))
  //       .end((err: Error, res: any) => {
  //         if (err) { expect.fail(err) }
  //         expect(res.statusCode).to.equal(201);
  //         expect(res.headers['access-control-allow-origin']).to.equal('*');
  //         expect(res.headers['access-control-allow-credentials']).to.equal('true');

  //         done();
  //       })
  //   })
  // })

  context("POST /test-results with empty body", () => {
    it("responds with HTTP 400", function(done) {
      request
        .post("test-results")
        .send()
        .end((err: Error, res: any) => {
          if (err) { expect.fail(err); }

          expect(res.statusCode).to.equal(400);
          expect(res.headers["access-control-allow-origin"]).to.equal("*");
          expect(res.headers["access-control-allow-credentials"]).to.equal("true");
          expect(res.body).to.deep.equals("Body is not a valid JSON.");
          done();
        });
    });
  });

  context("POST /test-results with bad JSON", () => {
    it("responds with HTTP 400", function(done) {
      request
        .post("test-results")
        .send("{ this is a bad json }")
        .end((err: Error, res: any) => {
          if (err) { expect.fail(err); }

          expect(res.statusCode).to.equal(400);
          expect(res.headers["access-control-allow-origin"]).to.equal("*");
          expect(res.headers["access-control-allow-credentials"]).to.equal("true");
          expect(res.body).to.deep.equal("Body is not a valid JSON.");
          done();
        });
    });
  });
});

