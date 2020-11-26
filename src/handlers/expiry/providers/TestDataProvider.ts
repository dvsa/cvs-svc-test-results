import { HTTPError } from "../../../models/HTTPError";
import * as enums from "../../../assets/Enums";
import { ITestResult } from "../../../models/ITestResult";
import { TestResultsDAO } from "../../../models/TestResultsDAO";
import { DateProvider } from "./DateProvider";
import { ITestDataProvider } from "./ITestDataProvider";
import { Service } from "../../../models/injector/ServiceDecorator";

@Service()
export class TestDataProvider implements ITestDataProvider {
  public testResultsDAO: TestResultsDAO | undefined;

  public async getTestHistory(systemNumber: string): Promise<ITestResult[]> {
    const fromDateTime = new Date(1970, 1, 1);
    const toDateTime = new Date();
    let result: ITestResult[] = [];
    try {
      this.testResultsDAO = this.testResultsDAO as TestResultsDAO;
      const data = await this.testResultsDAO.getBySystemNumber(systemNumber);
      console.log(`getTestHistory: Data Count -> ${data?.Count}`);
      if (data?.Count) {
        result = data.Items as ITestResult[];
        return result
          .filter((test) => test.testStatus === enums.TEST_STATUS.SUBMITTED)
          .filter(
            (testResult: {
              testStartTimestamp: string | number | Date;
              testEndTimestamp: string | number | Date;
            }) => {
              const { testStartTimestamp, testEndTimestamp } = testResult;
              if (!DateProvider.isValidDate(testStartTimestamp) || !DateProvider.isValidDate(testEndTimestamp)) {
                throw new Error(`Invalid timestamp -> StartTimestamp: ${testStartTimestamp} EndTimeStamp: ${testEndTimestamp} `);
              }
              return DateProvider.isBetweenDates(
                testStartTimestamp,
                testEndTimestamp,
                fromDateTime,
                toDateTime
              );
            }
          );
      }
      return result;
    } catch (error) {
      console.error("getTestHistory: Error ", error);
      error = new HTTPError(500, enums.MESSAGES.INTERNAL_SERVER_ERROR);
      throw error;
    }
  }

  public async getMostRecentExpiryDate(systemNumber: string): Promise<Date> {
    let maxDate = DateProvider.getEpoc();
    const testResults = await this.getTestHistory(systemNumber);
    console.log( `getMostRecentExpiryDate: Filtered Data Count -> ${testResults?.length}`);

    const filteredTestTypeDates: any[] = [];
    testResults.forEach(({ testTypes }) => {
        testTypes.forEach(({ testCode, testExpiryDate }) => {

          if (testCode && TestDataProvider.isValidTestCodeForExpiryCalculation(testCode.toUpperCase()) && testExpiryDate) {
            if (!DateProvider.isValidDate(testExpiryDate)) {
                throw new Error(`Invalid Expiry Date: ${testExpiryDate}`);
              }
            console.log(`getMostRecentExpiryDate: Filtered Date -> ${testExpiryDate}`);
            filteredTestTypeDates.push(DateProvider.getInstance((testExpiryDate)));
          }

      });
        if (filteredTestTypeDates.length) {
        maxDate = DateProvider.getMaxDate(filteredTestTypeDates);
      }
    });
    console.log(`getMostRecentExpiryDate: Max Date -> ${maxDate.toString()}`);
    return maxDate;
  }

  private static isValidTestCodeForExpiryCalculation(
    testCode: string
  ): boolean {
    return enums.TEST_CODES_FOR_CALCULATING_EXPIRY.CODES.includes(testCode);
  }
}
