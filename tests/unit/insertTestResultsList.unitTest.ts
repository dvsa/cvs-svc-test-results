import { TestResultsService } from "../../src/services/TestResultsService";
import fs, { promises } from "fs";
import path from "path";
import { HTTPError } from "../../src/models/HTTPError";
describe("TestResultsService calling insertTestResultsList", () => {
    let testResultsService: TestResultsService | any;
    let MockTestResultsDAO: jest.Mock;
    let testResultsMockDB: any;
    let testResultsPostMock: any;

    beforeEach(() => {
        testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
        testResultsPostMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-post.json"), "utf8"));
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {};
        });
        testResultsService = new TestResultsService(new MockTestResultsDAO());
    });

    afterEach(() => {
        testResultsMockDB = null;
        testResultsService = null;
        MockTestResultsDAO.mockReset();
    });

    context("database call inserts items", () => {
        it("should return nothing", () => {
            const mockData = testResultsMockDB[6];
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createMultiple: () => {
                        return Promise.resolve({});
                    }
                };
            });
            testResultsService = new TestResultsService(new MockTestResultsDAO());

            return testResultsService.insertTestResultsList(testResultsMockDB)
                .then((data: any) => {
                    expect(data).toEqual(undefined);
                });
        });

        it("should return the unprocessed items", () => {
            const mockData = testResultsMockDB[6];
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createMultiple: () => {
                        return Promise.resolve({
                            UnprocessedItems: Array.of(mockData)
                        });
                    }
                };
            });
            testResultsService = new TestResultsService(new MockTestResultsDAO());

            return testResultsService.insertTestResultsList(mockData)
                .then((data: { length: any; }) => {
                    expect(data.length).toEqual(1);
                });
        });
    });

    context("database call fails inserting items", () => {
        it("should return error 500", () => {
            const mockData = testResultsMockDB[6];
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createMultiple: () => {
                        return Promise.reject({});
                    }
                };
            });
            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.insertTestResultsList(mockData)
                .catch((errorResponse: { statusCode: any; body: any; }) => {
                    expect(errorResponse).toBeInstanceOf(HTTPError);
                    expect(errorResponse.statusCode).toEqual(500);
                    expect(errorResponse.body).toEqual("Internal Server Error");
                });
        });
    });
});
