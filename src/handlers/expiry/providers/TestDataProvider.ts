import { Service } from '../../../models/injector/ServiceDecorator';
import * as enums from '../../../assets/Enums';
import * as models from '../../../models';
import * as utils from '../../../utils';
import { DateProvider } from './DateProvider';
import { ITestDataProvider } from './ITestDataProvider';

@Service()
export class TestDataProvider implements ITestDataProvider {
  public testResultsDAO = new models.TestResultsDAO();

  // #region [rgba(52, 152, 219, 0.15)] Public functions
  /**
   * To fetch test results by systemNumber
   * @param filters filters used to search the database
   */
  public async getTestResultBySystemNumber(
    filters: models.ITestResultFilters,
  ): Promise<models.ITestResult[]> {
    try {
      const testResults = await this.testResultsDAO.getBySystemNumber(filters);
      if (!testResults.length) {
        throw new models.HTTPError(404, enums.ERRORS.NoResourceMatch);
      }
      return TestDataProvider.applyTestResultsFilters(testResults, filters);
    } catch (error) {
      console.error(
        'TestDataProvider.getTestResultBySystemNumber: error-> ',
        error,
      );
      throw error;
    }
  }

  public async getTestResultByTesterStaffId(
    filters: models.ITestResultFilters,
  ): Promise<models.ITestResult[]> {
    try {
      const result = await this.testResultsDAO.getByTesterStaffId(filters);
      if (result && !result.length) {
        return result;
      }
      return TestDataProvider.applyTestResultsFilters(result, filters);
    } catch (error) {
      console.error(
        'TestDataProvider.getTestResultBySystemNumber: error-> ',
        error,
      );
      throw error;
    }
  }

  public async getTestHistory(
    systemNumber: string,
  ): Promise<models.ITestResult[]> {
    const fromDateTime = new Date(1970, 1, 1);
    const toDateTime = new Date(2040, 1, 1);
    let result: models.ITestResult[] = [];
    try {
      const filters: models.ITestResultFilters = {
        systemNumber,
        fromDateTime,
        toDateTime,
      };
      result = await this.testResultsDAO.getBySystemNumber(filters);
      console.log(`getTestHistory: Data Count -> ${result.length}`);
      if (!result.length) {
        return result;
      }
      return result.filter(
        (test) => test.testStatus === enums.TEST_STATUS.SUBMITTED,
      );
    } catch (error) {
      console.log('TestDataProvider.getTestHistory: error -> ', error);
      throw error;
    }
  }

  public async getBySystemNumber(systemNumber: string) {
    const filters: models.ITestResultFilters = { systemNumber };
    const data = await this.testResultsDAO.getBySystemNumber(filters);
    console.log(data);
    return data;
  }

  public async getMostRecentExpiryDate(systemNumber: string): Promise<Date> {
    let maxDate = DateProvider.getEpoc();
    const testResults = await this.getTestHistory(systemNumber);
    console.log(
      `getMostRecentExpiryDate: Filtered Data Count -> ${testResults?.length}`,
    );

    const filteredTestTypeDates: any[] = [];
    testResults.forEach(({ testTypes }) => {
      testTypes.forEach(({ testCode, testExpiryDate }) => {
        if (
          testCode &&
          TestDataProvider.isValidTestCodeForExpiryCalculation(
            testCode.toUpperCase(),
          ) &&
          testExpiryDate &&
          DateProvider.isValidDate(testExpiryDate)
        ) {
          console.log(
            `getMostRecentExpiryDate: Filtered Date -> ${testExpiryDate}`,
          );
          filteredTestTypeDates.push(DateProvider.getInstance(testExpiryDate));
        }
        if (testExpiryDate && !DateProvider.isValidDate(testExpiryDate)) {
          console.warn(
            `getMostRecentExpiryDate: Invalid Expiry Date -> systemNumber: ${systemNumber} testExpiryDate: ${testExpiryDate}`,
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
    testCode: string,
  ): boolean {
    return enums.TEST_CODES_FOR_CALCULATING_EXPIRY.CODES.includes(testCode);
  }

  private static applyTestResultsFilters(
    testResults: models.ITestResult[],
    filters: models.ITestResultFilters,
  ): models.ITestResult[] {
    const { testStatus, testResultId, testVersion } = filters;
    testResults = this.filterTestResultsByDeletionFlag(testResults);
    testResults = this.filterTestTypesByDeletionFlag(testResults);
    testResults = this.filterTestResultsByParam(
      testResults,
      'testStatus',
      testStatus,
    );

    if (!testResultId) {
      testResults = this.filterTestResultsByTestVersion(
        testResults,
        enums.TEST_VERSION.CURRENT,
      );
      testResults = this.removeTestHistory(testResults);
      return testResults;
    }

    testResults = this.filterTestResultsByParam(
      testResults,
      'testResultId',
      testResultId,
    );

    testResults = this.filterTestResultsByTestVersion(testResults, testVersion);

    return testResults;
  }

  public async getTestTypesWithTestCodesAndClassification(
    testTypes: models.TestType[] = [],
    testTypeParams: models.TestTypeParams,
  ) {
    return this.createNewTestTypes(testTypes, testTypeParams);
  }

  private async createNewTestTypes(list: any, params: any) {
    return Promise.all(
      list.map(
        utils.MappingUtil.addTestcodeToTestTypes(this.testResultsDAO, params),
      ),
    );
  }

  public async updateTestTypeDetails(
    testTypes: models.TestType[],
    testTypeParams: models.TestTypeParams,
  ): Promise<models.TestType[]> {
    return Promise.all(
      testTypes.map(async (testType) => {
        const { testTypeId } = testType;
        const fields =
          'defaultTestCode,linkedTestCode,testTypeClassification,name,testTypeName';
        const {
          defaultTestCode,
          linkedTestCode,
          testTypeClassification,
          name,
          testTypeName,
        } = await this.testResultsDAO.getTestCodesAndClassificationFromTestTypes(
          testTypeId,
          testTypeParams,
          fields,
        );
        return {
          ...testType,
          testTypeClassification,
          testCode:
            testTypes.length > 1 && linkedTestCode
              ? linkedTestCode
              : defaultTestCode,
          name,
          testTypeName,
        };
      }),
    );
  }

  public async setTestNumberForEachTestType(
    payload: models.ITestResultPayload,
  ) {
    const { testTypes } = payload;

    if (!testTypes) {
      return payload;
    }

    return this.createNewTestNumber(testTypes);
  }

  private async createNewTestNumber(
    list: models.TestType[],
  ): Promise<models.TestType[]> {
    return Promise.all(
      list.map(async (testType) => {
        const { testNumber } = await this.testResultsDAO.createTestNumber();
        return {
          ...testType,
          testNumber,
        } as models.TestType;
      }),
    );
  }

  public async insertTestResult(payload: models.ITestResultPayload) {
    try {
      const result = await this.testResultsDAO.createSingle(payload);
      utils.LoggingUtil.logDefectsReporting(payload);
      return result.Attributes as models.ITestResult[];
    } catch (error) {
      console.error('TestDataProvider.insertTestResult -> ', error);
      throw error;
    }
  }

  public async updateTestResult(payload: models.ITestResult) {
    try {
      return await this.testResultsDAO?.updateTestResult(payload);
    } catch (error) {
      console.error('TestDataProvider.updateTestResult -> ', error);
      throw error;
    }
  }

  // #endregion
  // #region [rgba(0, 205, 30, 0.1)] Private Static functions
  private static filterTestResultsByParam(
    testResults: models.ITestResult[],
    filterName: string,
    filterValue: any,
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
    toDateTime: string | number | Date,
  ): models.ITestResult[] {
    return testResults.filter((testResult) =>
      DateProvider.isBetweenDates(
        testResult.testStartTimestamp,
        testResult.testEndTimestamp,
        fromDateTime,
        toDateTime,
      ),
    );
  }

  private static filterTestResultsByTestVersion(
    testResults: models.ITestResult[],
    testVersion: string = enums.TEST_VERSION.CURRENT,
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
    testResults: models.ITestResult[],
  ) {
    return testResults.filter(
      (testResult) => !testResult.deletionFlag === true,
    );
  }

  private static filterTestTypesByDeletionFlag(
    testResults: models.ITestResult[],
  ) {
    testResults.forEach((testResult) => {
      const filteredTestTypes = testResult.testTypes.filter(
        (testType) => !testType.deletionFlag === true,
      );
      testResult.testTypes = filteredTestTypes;
    });
    return testResults;
  }
  // #endregion
}
