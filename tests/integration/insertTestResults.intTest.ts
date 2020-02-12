/* global describe context it before beforeEach after afterEach */
import supertest from "supertest";
const url = "http://localhost:3006/";
const request = supertest(url);

import {emptyDatabase, populateDatabase} from "../util/dbOperations";

describe("insertTestResults", () => {
    beforeAll(async () => {
        await emptyDatabase();
    });

    beforeEach(async () => {
        await populateDatabase();
    });

    afterEach(async () => {
        await emptyDatabase();
    });

    afterAll(async () => {
        await populateDatabase();
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
