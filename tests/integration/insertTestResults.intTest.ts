/* global describe context it before beforeEach after afterEach */
import supertest from "supertest";
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

  beforeAll(async () => {
    testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
    testResultsPostMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-post.json"), "utf8"));
    testResultsDAO = new TestResultsDAO();
    testResultsService = new TestResultsService(testResultsDAO);
    await testResultsService.insertTestResultsList(testResultsMockDB);
  });

  afterAll(async () => {
    const object = await testResultsDAO.getByVin(testResultsPostMock[0].vin);
    const scheduledForDeletion: any = {};
    scheduledForDeletion[object.Items[0].vin] = object.Items[0].testResultId;
    testResultsService.deleteTestResultsList([scheduledForDeletion]);
    testResultsMockDB = null;
    testResultsService = null;
  });

  beforeEach(async () => {
    testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
    testResultsPostMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-post.json"), "utf8"));
    testResultsDAO = new TestResultsDAO();
    testResultsService = new TestResultsService(testResultsDAO);
    await testResultsService.insertTestResultsList(testResultsMockDB);
  });

  afterEach(async () => {
    const object = await testResultsDAO.getByVin(testResultsPostMock[0].vin);
    const scheduledForDeletion: any = {};
    scheduledForDeletion[object.Items[0].vin] = object.Items[0].testResultId;
    testResultsService.deleteTestResultsList([scheduledForDeletion]);
    testResultsMockDB = null;
    testResultsService = null;
  });

  /*context("POST /test-results with valid data", () => {
    it("responds with HTTP 201", async () => {
        const res = await request.post("test-results").send(testResultsPostMock[0]);
        expect(res.status).toEqual(201);
        expect(res.header["access-control-allow-origin"]).toEqual("*");
        expect(res.header["access-control-allow-credentials"]).toEqual("true");
    });
  });*/

  context("POST /test-results with empty body", () => {
    it("responds with HTTP 400", async () => {
        const res = await request.post("test-results").send();
        expect(res.status).toEqual(400);
        expect(res.header["access-control-allow-origin"]).toEqual("*");
        expect(res.header["access-control-allow-credentials"]).toEqual("true");
        expect(res.body).toStrictEqual("Body is not a valid JSON.");
    });
  });

  context("POST /test-results with bad JSON", () => {
    it("responds with HTTP 400", async () => {
        const res = await request.post("test-results").send("{ this is a bad json }");
        expect(res.status).toEqual(400);
        expect(res.header["access-control-allow-origin"]).toEqual("*");
        expect(res.header["access-control-allow-credentials"]).toEqual("true");
        expect(res.body).toStrictEqual("Body is not a valid JSON.");
    });
  });
});
