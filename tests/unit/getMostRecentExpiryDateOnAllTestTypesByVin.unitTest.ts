import { TestResultsService } from "../../src/services/TestResultsService";
import fs from "fs";
import path from "path";
import {cloneDeep} from "lodash";
import { IMaxDates } from "../../src/models/IMaxDates";

describe("generateExpiryDate calling getMostRecentExpiryDateOnAllTestTypesByVin", () => {
    let testResultsService: TestResultsService | any;
    let MockTestResultsDAO: jest.Mock;
    let testResultsMockDB: any;

    beforeEach(() => {
        testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
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
    /*
    * AC-1 of CVSB-11396
    */
    context("When performing an annual test on a trl and the result is passed and the expiry has to be automatically calculated", () => {
        it("should fetch the most recent expiry from test history and populate maxDateForAnnualTestTypes", () => {

            const trlTestResult1 = cloneDeep(testResultsMockDB[17]);
            // set test code
            trlTestResult1.testTypes[0].testCode = "aat1";
            trlTestResult1.testTypes[0].testResult = "pass";
            trlTestResult1.testTypes[0].testExpiryDate = new Date(2020, 11, 20);

            // set expiry
            const trlTestResult2 = cloneDeep(testResultsMockDB[17]);
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
            const expectedDates: IMaxDates = { maxDateForAllTestTypes: new Date(1970, 1, 1), maxDateForAnnualTestTypes: new Date(2020, 11, 20) };
            return testResultsService.getMostRecentExpiryDateOnAllTestTypesByVin(vin)
                .then((response: any) => {
                    expect(response).toEqual(expectedDates);
                });
        });
    });

    /*
    * AC-2 of CVSB-11396
    */
    context("When performing an annual test on a hgv and the result is passed and the expiry has to be automatically calculated", () => {
    it("should fetch the most recent expiry from test history and populate maxDateForAnnualTestTypes", () => {

        const trlTestResult1 = cloneDeep(testResultsMockDB[16]);
        // set test code
        trlTestResult1.testTypes[0].testCode = "ffv2";
        trlTestResult1.testTypes[0].testResult = "pass";
        trlTestResult1.testTypes[0].testExpiryDate = new Date(2020, 11, 20);

        // set expiry
        const trlTestResult2 = cloneDeep(testResultsMockDB[16]);
        trlTestResult2.testTypes[0].testCode = "p1v2";
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
        const expectedDates: IMaxDates = { maxDateForAllTestTypes: new Date(1970, 1, 1), maxDateForAnnualTestTypes: new Date(2020, 11, 20) };
        return testResultsService.getMostRecentExpiryDateOnAllTestTypesByVin(vin)
            .then((response: any) => {
                expect(response).toEqual(expectedDates);
            });
    });
});

    /*
    * AC-3 of CVSB-11396
    */
    context("When performing an annual test on a psv  and the result is passed and the expiry has to be automatically calculated", () => {
    it("should fetch the most recent expiry from test history based and populate maxDateForAnnualTestTypes", () => {

        const trlTestResult1 = cloneDeep(testResultsMockDB[14]);

        trlTestResult1.testTypes[0].testCode = "aal";
        trlTestResult1.testTypes[0].testResult = "pass";
        trlTestResult1.testTypes[0].testExpiryDate = new Date(2020, 11, 20);


        const trlTestResult2 = cloneDeep(testResultsMockDB[14]);
        trlTestResult2.testTypes[0].testCode = "p1l";
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
        const expectedDates: IMaxDates = { maxDateForAllTestTypes: new Date(1970, 1, 1), maxDateForAnnualTestTypes: new Date(2020, 11, 20) };
        return testResultsService.getMostRecentExpiryDateOnAllTestTypesByVin(vin)
            .then((response: any) => {
                expect(response).toEqual(expectedDates);
            });
    });

    /*
    * Non annual test type
    */
    context("When performing a non-annual test on a psv and the result is passed and the expiry has to be automatically calculated", () => {
    it("should fetch the most recent expiry from test history and populate maxDateForAllTestTypes", () => {

        const trlTestResult1 = cloneDeep(testResultsMockDB[14]);
        // set test code
        trlTestResult1.testTypes[0].testCode = "mda";
        trlTestResult1.testTypes[0].testResult = "pass";
        trlTestResult1.testTypes[0].testExpiryDate = new Date(2020, 11, 20);

        // set expiry
        const trlTestResult2 = cloneDeep(testResultsMockDB[14]);
        trlTestResult2.testTypes[0].testCode = "qal";
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
        const expectedDates: IMaxDates = { maxDateForAllTestTypes: new Date(2020, 11, 20), maxDateForAnnualTestTypes: new Date(1970, 1, 1) };
        return testResultsService.getMostRecentExpiryDateOnAllTestTypesByVin(vin)
            .then((response: any) => {
                expect(response).toEqual(expectedDates);
            });
    });
});
});
});
