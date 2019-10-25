/* global describe context it before beforeEach after afterEach */
import supertest from "supertest";

const url = "http://localhost:3006/";
const request = supertest(url);
import {TestResultsService} from "../../src/services/TestResultsService";
import {TestResultsDAO} from "../../src/models/TestResultsDAO";
import fs from "fs";
import path from "path";

describe("getTestResultsByVin", () => {
    let testResultsService: TestResultsService | any;
    let testResultsMockDB: any;
    let testResultsPostMock: any;

    beforeAll(async () => {
        testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
        testResultsPostMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-post.json"), "utf8"));
        testResultsService = new TestResultsService(new TestResultsDAO());
        await testResultsService.insertTestResultsList(testResultsMockDB);
    });

    afterAll(async () => {
        testResultsMockDB = null;
        testResultsService.deleteTestResultsList([{"1B7GG36N12S678410": "1"}, {"1B7GG36N12S678410": "2"}, {"1B7GG36N12S678425": "3"}]);
        testResultsService = null;
    });

    beforeEach(async () => {
        testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
        testResultsPostMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-post.json"), "utf8"));
        testResultsService = new TestResultsService(new TestResultsDAO());
        await testResultsService.insertTestResultsList(testResultsMockDB);
    });

    afterEach(async () => {
        testResultsMockDB = null;
        await testResultsService.deleteTestResultsList([{"1B7GG36N12S678410": "1"}, {"1B7GG36N12S678410": "2"}, {"1B7GG36N12S678425": "3"}]);
        testResultsService = null;
    });

    context("when database is populated", () => {
        context("and when a search by VIN is done", () => {
            context("and no status is provided", () => {
                context("and toDateTime and fromDateTime are not provided", () => {
                    context("and there are test results for that VIN that have status 'submitted' and createdAt date value between two years ago and today", () => {
                        it("should return the test results for that VIN with default status 'submitted' and default date interval which is from too years ago until today", async () => {
                            const res = await request.get("test-results/1B7GG36N12S678410/");
                            const expectedResponse = Array.of(testResultsMockDB[1]);
                            delete expectedResponse[0].testResultId;
                            expect(res.status).toEqual(200);
                            expect(res.header["access-control-allow-origin"]).toEqual("*");
                            expect(res.header["access-control-allow-credentials"]).toEqual("true");
                        });
                    });
                });
            });
        });

        context("and status is provided", () => {
            context("and toDateTime and fromDateTime are provided", () => {
                context("and there are test results in the db that satisfy both conditions", () => {
                    it("should return the test results for that VIN with status 'submitted' and that have createdAt value between 2017-01-01 and 2019-02-23", async () => {
                        const res = await request.get("test-results/1B7GG36N12S678410?status=submitted&fromDateTime=2017-01-01&toDateTime=2019-02-23");
                        expect(res.status).toEqual(200);
                        expect(res.header["access-control-allow-origin"]).toEqual("*");
                        expect(res.header["access-control-allow-credentials"]).toEqual("true");
                    });
                });

                context("but there are no test results in the date range specified", () => {
                    it("should return 404", async () => {
                        const res = await request.get("test-results/1B7GG36N12S678425?status=submitted&fromDateTime=2021-01-01&toDateTime=2022-02-23");
                        expect(res.status).toEqual(404);
                        expect(res.header["access-control-allow-origin"]).toEqual("*");
                        expect(res.header["access-control-allow-credentials"]).toEqual("true");
                        expect(res.body).toEqual("No resources match the search criteria");
                    });
                });
            });
        });

        context("and there are no test results for that VIN that have status 'cancelled'", () => {
            it("should return 404", async () => {
                const res = await request.get("test-results/1B7GG36N12S678425?status=cancelled");
                expect(res.status).toEqual(404);
                expect(res.header["access-control-allow-origin"]).toEqual("*");
                expect(res.header["access-control-allow-credentials"]).toEqual("true");
                expect(res.body).toEqual("No resources match the search criteria");
            });
        });
    });
});

context("when database is empty,", () => {
    it("should return error code 404", async () => {
        const res = await request.get("test-results");
        expect(res.status).toEqual(404);
    });
});
