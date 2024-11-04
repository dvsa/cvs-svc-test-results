import { TestResultSchema } from '@dvsa/cvs-type-definitions/types/v1/test-result';

export interface ITestDataProvider {
  getTestHistory(systemNumber: string): Promise<TestResultSchema[]>;
  getMostRecentExpiryDate(systemNumber: string): Promise<Date>;
}
