import * as dateFns from "date-fns";
import * as _ from "lodash";


export class GetTestResultsUtils {
  public static validateDates(fromDateTime: string | number | Date, toDateTime: string | number | Date) {
    return _.isDate(new Date(fromDateTime)) && _.isDate( new Date(toDateTime)) && _.isFinite((new Date(fromDateTime)).getTime()) && _.isFinite((new Date(toDateTime)).getTime());
  }

  public static removeTestResultId(testResults: Array<{ testResultId: string | number; }>) {
    if (testResults.length > 0) {
      for (const [index, testResult] of testResults.entries()) {
        delete testResults[index].testResultId;
      }
    }
    return testResults;
  }

  public static filterTestResultsByParam(testResults: { filter: (arg0: (testResult: any) => boolean) => void; }, filterName: string | number, filterValue: any) {
    return testResults.filter((testResult) => {
      return testResult[filterName] === filterValue;
    });
  }

  public static filterTestResultByDate(testResults: any, fromDateTime: string | number | Date, toDateTime: string | number | Date) {

    return testResults.filter((testResult: { testStartTimestamp: string | number | Date; testEndTimestamp: string | number | Date; }) => {
      return dateFns.isAfter(testResult.testStartTimestamp, fromDateTime) && dateFns.isBefore(testResult.testEndTimestamp, toDateTime);
    });
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

  public static parseMissingQueryParams(queryStringParameters: any) {
    const queryParams = Object.assign({}, queryStringParameters);

    if (queryParams.vehicleAxles === "null") {
      queryParams.vehicleAxles = null;
    } else if ( queryParams.vehicleAxles !== undefined ) {
      queryParams.vehicleAxles = parseInt(queryParams.vehicleAxles, 10);
    }

    if (queryParams.vehicleSize === undefined) {
      queryParams.vehicleSize = null;
    }

    if (queryParams.vehicleConfiguration === "null") {
      queryParams.vehicleConfiguration = null;
    }
    return queryParams;
  }
}
