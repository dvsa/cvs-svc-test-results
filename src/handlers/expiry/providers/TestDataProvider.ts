import moment from "moment";
import { HTTPError } from "../../../models/HTTPError";
import {
  TEST_STATUS,
  MESSAGES,
  TEST_CODES_FOR_CALCULATING_EXPIRY
} from "../../../assets/Enums";
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
      if (data?.Count) {
        result = data.Items as ITestResult[];
        return result
          .filter((test) => test.testStatus === TEST_STATUS.SUBMITTED)
          .filter(
            (testResult: {
              testStartTimestamp: string | number | Date;
              testEndTimestamp: string | number | Date;
            }) => {
              return (
                moment(testResult.testStartTimestamp).isAfter(fromDateTime) &&
                moment(testResult.testEndTimestamp).isBefore(toDateTime)
              );
            }
          );
      }
      return result;
    } catch (error) {
      if (!(error instanceof HTTPError)) {
        console.log(error);
        error = new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
      }
      throw error;
    }
  }

  public async getMostRecentExpiryDate(systemNumber: string): Promise<Date> {
    let maxDate = DateProvider.getEpoc();
    const testResults = await this.getTestHistory(systemNumber);
    if (testResults && testResults.length) {
      const filteredTestTypeDates: any[] = [];
      testResults.forEach(({ testTypes }) => {
        testTypes.forEach(({ testCode, testExpiryDate }) => {
          if (
            testCode &&
            TestDataProvider.isValidTestCodeForExpiryCalculation(
              testCode.toUpperCase()
            ) &&
            testExpiryDate &&
            DateProvider.isValidDate(testExpiryDate)
          ) {
            filteredTestTypeDates.push(moment(testExpiryDate));
          }
        });
      });
      if (filteredTestTypeDates.length) {
        maxDate = moment.max(filteredTestTypeDates).toDate();
      }
    }
    return maxDate;
  }

  private static isValidTestCodeForExpiryCalculation(
    testCode: string
  ): boolean {
    return TEST_CODES_FOR_CALCULATING_EXPIRY.CODES.includes(testCode);
  }
}
