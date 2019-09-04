/* global describe context it before beforeEach after afterEach */
import supertest from "supertest";
import { expect } from "chai";
const url = "http://localhost:3006/";
const request = supertest(url);
import { TestResultsService } from "../../src/services/TestResultsService";
import { TestResultsDAO } from "../../src/models/TestResultsDAO";
import fs from "fs";
import path from "path";

describe("insertTestResults", () => {
  let testResultsService: TestResultsService | any;
  let testResultsMockDB: any;
  let testResultsPostMock: any;
  let testResultsDAO: TestResultsDAO | any;

  beforeAll((done) => {
    testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
    testResultsPostMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-post.json"), "utf8"));
    testResultsDAO = new TestResultsDAO();
    testResultsService = new TestResultsService(testResultsDAO);
    testResultsService.insertTestResultsList(testResultsMockDB);
    done();
  });

  afterAll((done) => {
    testResultsDAO.getByVin(testResultsPostMock[0].vin)
      .then((object: any) => {
        const scheduledForDeletion: any = {};
        scheduledForDeletion[object.Items[0].vin] = object.Items[0].testResultId;
        testResultsService.deleteTestResultsList([scheduledForDeletion]);
        testResultsMockDB = null;
        testResultsService = null;
      });
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
    it("responds with HTTP 400", (done) => {
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
    it("responds with HTTP 400", (done) => {
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

