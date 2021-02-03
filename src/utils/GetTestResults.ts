import {isDate, isFinite} from "lodash";
import {TEST_VERSION} from "../assets/Enums";
import {ITestResult} from "../models/ITestResult";
import moment from "moment";


export class GetTestResults {

  public static filterTestResultsByParam(testResults: { filter: (arg0: (testResult: any) => boolean) => void; }, filterName: string | number, filterValue: any) {
    return testResults.filter((testResult) => {
      return testResult[filterName] === filterValue;
    });
  }

  public static filterTestResultsByTestVersion(testResults: ITestResult[], testVersion: string = TEST_VERSION.CURRENT): ITestResult[] {
    let result: ITestResult[] = [];
    if (testVersion === TEST_VERSION.ALL) {
      return testResults;
    }
    for (const testResult of testResults) {
      if (testVersion === TEST_VERSION.CURRENT && (testResult.testVersion === TEST_VERSION.CURRENT || !testResult.testVersion)) {
        delete testResult.testHistory;
        result.push(testResult);
      } else if (testVersion === TEST_VERSION.ARCHIVED) {
        if (testResult.testVersion === TEST_VERSION.ARCHIVED) {
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

  public static removeTestHistory(testResults: ITestResult[]) {
    for (const testResult of testResults) {
      delete testResult.testHistory;
    }
    return testResults;
  }

  public static filterTestResultsByDeletionFlag(testResults: { filter: (arg0: (testResult: any) => boolean) => void; }) {
    return testResults.filter((testResult) => {
      return !testResult.deletionFlag === true;
    });
  }

  public static filterTestTypesByDeletionFlag(testResults: { forEach: (arg0: (testResult: any) => void) => void; }) {
    testResults.forEach((testResult) => {
      const filteredTestTypes = testResult.testTypes.filter((testType: { deletionFlag: any; }) => {
        return !testType.deletionFlag === true;
      });
      testResult.testTypes = filteredTestTypes;
    });
    return testResults;
  }
}
