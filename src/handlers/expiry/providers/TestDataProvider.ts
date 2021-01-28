import { Service } from "../../../models/injector/ServiceDecorator";
import * as enums from "../../../assets/Enums";
import * as models from "../../../models";
import * as utils from "../../../utils";
import { DateProvider } from "./DateProvider";
import { ITestDataProvider } from "./ITestDataProvider";

@Service()
export class TestDataProvider implements ITestDataProvider {
  public testResultsDAO: models.TestResultsDAO | undefined;

  //#region [rgba(52, 152, 219, 0.15)] Public functions
  /**
   * To fetch test results by systemNumber
   * @param filters filters used to search the database
   */
  public async getTestResultBySystemNumber(
    filters: models.ITestResultFilters
  ): Promise<models.ITestResult[]> {
    try {
      const result = await this.testResultsDAO?.getBySystemNumber(
        filters.systemNumber
      );
      const response: models.ITestResultData = {
        Count: result?.Count,
        Items: result?.Items,
      };
      const testResults: models.ITestResult[] = utils.ValidationUtil.getTestResultItems(
        response
      );
      return TestDataProvider.applyTestResultsFilters(testResults, filters);
    } catch (error) {
      console.error(
        "TestDataProvider.getTestResultBySystemNumber: error-> ",
        error
      );
      throw error;
    }
  }

  public async getTestResultByTesterStaffId(
    filters: models.ITestResultFilters
  ): Promise<models.ITestResult[]> {
    try {
      const result = await this.testResultsDAO?.getByTesterStaffId(
        filters.testerStaffId
      );
      if (result && !result.length) {
        return result;
      }
      return TestDataProvider.applyTestResultsFilters(result as models.ITestResult[], filters);
    } catch (error) {
      console.error(
        "TestDataProvider.getTestResultBySystemNumber: error-> ",
        error
      );
      throw error;
    }
  }

  public async getTestHistory(
    systemNumber: string
  ): Promise<models.ITestResult[]> {
    const fromDateTime = new Date(1970, 1, 1);
    const toDateTime = new Date();
    let result: models.ITestResult[] = [];
    try {
      const data = await this.testResultsDAO?.getBySystemNumber(systemNumber);
      console.log(`getTestHistory: Data Count -> ${data?.Count}`);
      if (!data?.Count) {
        return result;
      }
      result = data.Items as models.ITestResult[];
      return result
        .filter((test) => test.testStatus === enums.TEST_STATUS.SUBMITTED)
        .filter(
          (testResult: {
            testStartTimestamp: string | number | Date;
            testEndTimestamp: string | number | Date;
          }) => {
            const { testStartTimestamp, testEndTimestamp } = testResult;
            if (
              !DateProvider.isValidDate(testStartTimestamp) ||
              !DateProvider.isValidDate(testEndTimestamp)
            ) {
              console.warn(
                `getTestHistory: Invalid timestamp -> systemNumber: ${systemNumber}  testStartTimestamp: ${testStartTimestamp} testEndTimestamp: ${testEndTimestamp}`
              );
            }
            return DateProvider.isBetweenDates(
              testStartTimestamp,
              testEndTimestamp,
              fromDateTime,
              toDateTime
            );
          }
        );
    } catch (error) {
      console.log("TestDataProvider.getTestHistory: error -> ", error);
      throw error;
    }
  }

  public async getBySystemNumber(systemNumber: string) {
    const data = (await this.testResultsDAO?.getBySystemNumber(
      systemNumber
    )) as models.ITestResultData;
    const testResults: models.ITestResult[] = utils.ValidationUtil.getTestResultItems(
      data
    );
    return testResults;
  }

  public async getMostRecentExpiryDate(systemNumber: string): Promise<Date> {
    let maxDate = DateProvider.getEpoc();
    const testResults = await this.getTestHistory(systemNumber);
    console.log(
      `getMostRecentExpiryDate: Filtered Data Count -> ${testResults?.length}`
    );

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
          console.log(
            `getMostRecentExpiryDate: Filtered Date -> ${testExpiryDate}`
          );
          filteredTestTypeDates.push(DateProvider.getInstance(testExpiryDate));
        }
        if (testExpiryDate && !DateProvider.isValidDate(testExpiryDate)) {
          console.warn(
            `getMostRecentExpiryDate: Invalid Expiry Date -> systemNumber: ${systemNumber} testExpiryDate: ${testExpiryDate}`
          );
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

  private static applyTestResultsFilters(
    testResults: models.ITestResult[],
    filters: models.ITestResultFilters
  ): models.ITestResult[] {
    const {
      fromDateTime,
      toDateTime,
      testStatus,
      testStationPNumber,
      testResultId,
      testVersion,
    } = filters;
    testResults = this.filterTestResultsByDeletionFlag(testResults);
    testResults = this.filterTestTypesByDeletionFlag(testResults);
    testResults = TestDataProvider.filterTestResultByDate(
      testResults,
      fromDateTime,
      toDateTime
    );
    testResults = this.filterTestResultsByParam(
      testResults,
      "testStatus",
      testStatus
    );

    testResults = this.filterTestResultsByParam(
      testResults,
      "testStationPNumber",
      testStationPNumber
    );

    if (!testResultId) {
      testResults = this.filterTestResultsByTestVersion(
        testResults,
        enums.TEST_VERSION.CURRENT
      );
      testResults = this.removeTestHistory(testResults);
      return testResults;
    }

    testResults = this.filterTestResultsByParam(
      testResults,
      "testResultId",
      testResultId
    );

    testResults = this.filterTestResultsByTestVersion(testResults, testVersion);

    return testResults;
  }

  public async getTestTypesWithTestCodesAndClassification(
    testTypes: models.TestType[] = [],
    testTypeParams: models.TestTypeParams
  ) {
    testTypes.map(async (testType) => {
      const { testTypeId } = testType;
      const {
        defaultTestCode,
        linkedTestCode,
        testTypeClassification,
      } = await this.testResultsDAO?.getTestCodesAndClassificationFromTestTypes(
        testTypeId,
        testTypeParams
      );
      testType.testCode =
        testTypes.length > 1 && linkedTestCode ?
        linkedTestCode : defaultTestCode;
      testType.testTypeClassification = testTypeClassification;
      return testType;
    });
    return Promise.resolve(testTypes);
  }

  public async setTestNumberForEachTestType(payload: models.ITestResultPayload) {
    const {testTypes} = payload;
    if (!testTypes) {
      return payload;
    }
    payload.testTypes.forEach(async (testType: models.TestType) => {
      const result = await this.testResultsDAO?.getTestNumber();
      testType.testNumber = result.testNumber;
    });

    return payload;
  }

  public async insertTestResult(payload: models.ITestResultPayload) {
    try {
      const result = await this.testResultsDAO?.createSingle(payload);
      return result?.Attributes as models.ITestResult[];
    } catch (error) {
      console.error("TestDataProvider.insertTestResult -> ", error);
      throw error;
    }
  }

  public async updateTestResult(payload: models.ITestResult) {
    try {
      const result = await this.testResultsDAO?.updateTestResult(payload);
      return result?.$response.data as models.ITestResult;
    } catch (error) {
      console.error("TestDataProvider.updateTestResult -> ", error);
      throw error;
    }
  }

  public async getActivity(params: models.ActivityParams) {
    return this.testResultsDAO?.getActivity(params);
  }
  //#endregion
  //#region [rgba(0, 205, 30, 0.1)] Private Static functions
  private static filterTestResultsByParam(
    testResults: models.ITestResult[],
    filterName: string,
    filterValue: any
  ): models.ITestResult[] {
    return filterValue
      ? testResults.filter((testResult) => {
          const k = filterName as keyof typeof testResult;
          return testResult[k] === filterValue;
        })
      : testResults;
  }

  private static filterTestResultByDate(
    testResults: models.ITestResult[],
    fromDateTime: string | number | Date,
    toDateTime: string | number | Date
  ): models.ITestResult[] {
    return testResults.filter((testResult) =>
      DateProvider.isBetweenDates(
        testResult.testStartTimestamp,
        testResult.testEndTimestamp,
        fromDateTime,
        toDateTime
      )
    );
  }

  private static filterTestResultsByTestVersion(
    testResults: models.ITestResult[],
    testVersion: string = enums.TEST_VERSION.CURRENT
  ): models.ITestResult[] {
    let result: models.ITestResult[] = [];
    if (testVersion === enums.TEST_VERSION.ALL) {
      return testResults;
    }
    for (const testResult of testResults) {
      if (
        testVersion === enums.TEST_VERSION.CURRENT &&
        (testResult.testVersion === enums.TEST_VERSION.CURRENT ||
          !testResult.testVersion)
      ) {
        delete testResult.testHistory;
        result.push(testResult);
      } else if (testVersion === enums.TEST_VERSION.ARCHIVED) {
        if (testResult.testVersion === enums.TEST_VERSION.ARCHIVED) {
          result.push(testResult);
          if (testResult.testHistory) {
            result = result.concat(testResult.testHistory);
            delete testResult.testHistory;
          }
        } else {
          result = testResult.testHistory || [];
        }
      }
    }
    return result;
  }

  private static removeTestHistory(testResults: models.ITestResult[]) {
    for (const testResult of testResults) {
      delete testResult.testHistory;
    }
    return testResults;
  }

  private static filterTestResultsByDeletionFlag(
    testResults: models.ITestResult[]
  ) {
    return testResults.filter((testResult) => {
      return !testResult.deletionFlag === true;
    });
  }

  private static filterTestTypesByDeletionFlag(
    testResults: models.ITestResult[]
  ) {
    testResults.forEach((testResult) => {
      const filteredTestTypes = testResult.testTypes.filter((testType) => {
        return !testType.deletionFlag === true;
      });
      testResult.testTypes = filteredTestTypes;
    });
    return testResults;
  }
  //#endregion
}
