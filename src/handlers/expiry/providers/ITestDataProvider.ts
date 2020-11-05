import { ITestResult } from "../../../models/ITestResult";

export interface ITestDataProvider {
    getTestHistory(systemNumber: string): Promise<ITestResult[]>;
    getMostRecentExpiryDate(systemNumber: string): Promise<Date>;
}
