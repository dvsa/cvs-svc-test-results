import { TestResultsService } from "../../src/services/TestResultsService";
import testResultsMockDB from "../resources/test-results.json";
import {cloneDeep} from "lodash";
import { ITestResultPayload } from "../../src/models/ITestResultPayload";

describe("generateExpiryDate calling getMostRecentExpiryDateOnAnnualTestTypesByVin", () => {
    let testResultsService: TestResultsService | any;
    let MockTestResultsDAO: jest.Mock;
    // let testResultsMockDB: any;

    beforeEach(() => {
        // testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {};
        });
        testResultsService = new TestResultsService(new MockTestResultsDAO());
    });

    afterEach(() => {
        // testResultsMockDB = null;
        testResultsService = null;
        MockTestResultsDAO.mockReset();
    });

    context("When performing an annual test on a vehicle and the result is passed and the expiry has to be automatically calculated", () => {
        it("should fetch the most recent expiry from test history based on the annual test codes", () => {

            const trlTestResult1 = cloneDeep<ITestResultPayload>(testResultsMockDB[17]);
            // set annual test code 1
            trlTestResult1.testTypes[0].testCode = "aat1";
            trlTestResult1.testTypes[0].testResult = "pass";
            trlTestResult1.testTypes[0].testExpiryDate = new Date(2020, 11, 20);
            // set annual test code 2
            const trlTestResult2 = cloneDeep<ITestResultPayload>(testResultsMockDB[17]);
            trlTestResult2.testTypes[0].testCode = "p6t1";
            trlTestResult2.testTypes[0].testResult = "pass";
            trlTestResult2.testTypes[0].testExpiryDate = new Date(2020, 3, 10);

            const mockData: any[] = [];
            mockData.push(trlTestResult1);
            mockData.push(trlTestResult2);

            const vin = trlTestResult1.vin;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getByVin: () => {
                        return Promise.resolve({
                            Items: mockData,
                            Count: 2,
                            ScannedCount: 2
                        });
                    }
                };
            });
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            const expectedDate: Date = new Date(2020, 11, 20);
            return testResultsService.getMostRecentExpiryDateOnAnnualTestTypesByVin(vin)
                .then((response: any) => {
                    expect(response).toEqual(expectedDate);
                });
        });
    });

});
