import moment from "moment";

import { ITestResultPayload } from "../models/ITestResultPayload";
import { TEST_STATUS, TEST_TYPE_CLASSIFICATION, TEST_RESULT, COIF_EXPIRY_TEST_TYPES, VEHICLE_TYPES, HGV_TRL_ROADWORTHINESS_TEST_TYPES, TEST_CODES_FOR_CALCULATING_EXPIRY, MESSAGES, ERRORS, TEST_VERSION } from "../assets/Enums";
import { HTTPError } from "../models/HTTPError";
import { GetTestResults } from "../utils/GetTestResults";
import { ITestResultFilters } from "../models/ITestResultFilter";
import { TestResultsDAO } from "../models/TestResultsDAO";
import { ITestResultData } from "../models/ITestResultData";

export function generateExpiryDate(payload: ITestResultPayload, testResultsDAO: TestResultsDAO ) {
    moment.tz.setDefault("UTC");
    if (payload.testStatus !== TEST_STATUS.SUBMITTED) {
      return Promise.resolve(payload);
    } else {
      return getMostRecentExpiryDateOnAllTestTypesBySystemNumber(payload.systemNumber, testResultsDAO)
        .then((mostRecentExpiryDateOnAllTestTypesBySystemNumber) => { // fetch max date for annual test types
          payload.testTypes.forEach((testType: any, index: number) => {
            if (testType.testTypeClassification === TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE &&
              (testType.testResult === TEST_RESULT.PASS || testType.testResult === TEST_RESULT.PRS)) {
              if (payload.vehicleType === VEHICLE_TYPES.PSV) {
                if (COIF_EXPIRY_TEST_TYPES.IDS.includes(payload.testTypes[index].testTypeId)) {
                  testType.testExpiryDate = addOneYearMinusOneDay(new Date());
                } else if (isMostRecentExpiryNotFound(mostRecentExpiryDateOnAllTestTypesBySystemNumber) && isValidDate(payload.regnDate)) {
                  const registrationAnniversary = moment(payload.regnDate).add(1, "years");
                  if (registrationAnniversary.isBetween(moment(new Date()), moment(new Date()).add(2, "months"), "days", "[)")) {
                    testType.testExpiryDate = addOneYear(registrationAnniversary.toDate());
                  } else {
                    testType.testExpiryDate = addOneYearMinusOneDay(new Date());
                  }
                  // Generates the expiry if there is no regnDate && the test isnt A COIF test type - CVSB-11509 AC4
                } else if (isMostRecentExpiryNotFound(mostRecentExpiryDateOnAllTestTypesBySystemNumber) && !isValidDate(payload.regnDate)) {
                  testType.testExpiryDate = addOneYearMinusOneDay(new Date());
                } else if (moment(mostRecentExpiryDateOnAllTestTypesBySystemNumber).isBetween(moment(new Date()), moment(new Date()).add(2, "months"), "days", "[]")) {
                  testType.testExpiryDate = addOneYear(mostRecentExpiryDateOnAllTestTypesBySystemNumber);
                } else {
                  testType.testExpiryDate = addOneYearMinusOneDay(new Date());
                }
              } else if (payload.vehicleType === VEHICLE_TYPES.HGV || payload.vehicleType === VEHICLE_TYPES.TRL) {
                let regOrFirstUseDate: string | undefined = payload.vehicleType === VEHICLE_TYPES.HGV ? payload.regnDate : payload.firstUseDate;
                if (!isValidDate(regOrFirstUseDate)) {
                  regOrFirstUseDate = undefined;
                }
                // preparaing compare date for CVSB-9187 to compare first test/retest conducted after anniversary date
                const firstTestAfterAnvCompareDate = moment(regOrFirstUseDate).add(1, "years").startOf("month");
                // Checks for testType = First test or First test Retest AND test date is 1 year from the month of first use or registration date
                if (isFirstTestRetestTestType(testType) && moment(new Date()).isAfter(firstTestAfterAnvCompareDate, "days")) {
                  testType.testExpiryDate = lastDayOfMonthInNextYear(new Date());
                } else if (isFirstTestRetestTestType(testType) && isMostRecentExpiryNotFound(mostRecentExpiryDateOnAllTestTypesBySystemNumber)) {
                  const anvDateForCompare = isValidDate(regOrFirstUseDate) ? lastDayOfMonthInNextYear(moment(regOrFirstUseDate).toDate()) : undefined;
                  // If anniversaryDate is not populated in tech-records OR test date is 2 months or more before the Registration/First Use Anniversary for HGV/TRL
                  console.log(`Current date: ${new Date()}, annv Date: ${anvDateForCompare}`);
                  if (!anvDateForCompare || moment(new Date()).isBefore(moment(anvDateForCompare).subtract(2, "months"), "days")) { // anniversary is more than 2 months further than today
                    testType.testExpiryDate = lastDayOfMonthInNextYear(new Date());
                  } else {
                    // less than 2 months then set expiryDate 1 year after the Registration/First Use Anniversary date
                    testType.testExpiryDate = addOneYear(moment(anvDateForCompare).toDate());
                  }
                } else if (isAnnualTestRetestTestType(testType) && isMostRecentExpiryNotFound(mostRecentExpiryDateOnAllTestTypesBySystemNumber)) {
                  if (!isValidDate(regOrFirstUseDate)) {
                    testType.testExpiryDate = lastDayOfMonthInNextYear(new Date());
                  } else {
                    const registrationFirstUseAnniversaryDate = moment(regOrFirstUseDate).add(1, "years").endOf("month").toDate();
                    if (isWithinTwoMonthsFromToday(registrationFirstUseAnniversaryDate)) {
                      testType.testExpiryDate = lastDayOfMonthInNextYear(registrationFirstUseAnniversaryDate);
                    } else {
                      testType.testExpiryDate = lastDayOfMonthInNextYear(new Date());
                    }
                  }
                } else {
                  const monthOfMostRecentExpiryDate = moment(mostRecentExpiryDateOnAllTestTypesBySystemNumber).endOf("month");
                  if (monthOfMostRecentExpiryDate.isBetween(moment(new Date()), moment(new Date()).add(2, "months"), "days", "[)")) {
                    testType.testExpiryDate = lastDayOfMonthInNextYear(mostRecentExpiryDateOnAllTestTypesBySystemNumber);
                  } else {
                    testType.testExpiryDate = lastDayOfMonthInNextYear(new Date());
                  }
                }
              }
            }
          });
          console.log("generateExpiryDate payload", payload.testTypes);
          return Promise.resolve(payload);
        }).catch((error) => {
          console.error("Error in error generateExpiryDate > getMostRecentExpiryDateOnAllTestTypesBySystemNumber", error);
          throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
        });
    }
  }


/**
 * To check the whether the value provided is a valid date
 * @param input date value
 */
function isValidDate(input: string | Date | number | undefined): boolean {
    return input !== undefined && moment(input).isValid() && moment(input).isAfter(new Date(0));
  }

  /**
   * Important: The local timezone in AWS lambda is GMT for all the regions.
   * dateFns only uses local timezones and therefore generates different hours when running locally or deployed in AWS.
   *
   * new Date(string) considers the ambiguous parsed string as UTC
   * new Date() creates a new date based on the local timezone
   */
function lastDayOfMonthInNextYear(inputDate: Date): string {
    return moment(inputDate).add(1, "year").endOf("month").startOf("day").toISOString();
  }

function addOneYearMinusOneDay(inputDate: Date): string {
    return moment(inputDate).add(1, "year").subtract(1, "day").startOf("day").toISOString();
  }

function addOneYear(inputDate: Date): string {
    return moment(inputDate).add(1, "year").startOf("day").toISOString();
  }

function isFirstTestRetestTestType(testType: any): boolean {
    const adrTestTypeIds = ["41", "64", "65", "66", "67", "95", "102", "103", "104"];
    return adrTestTypeIds.includes(testType.testTypeId);
  }

function isAnnualTestRetestTestType(testType: any): boolean {
    const annualTestRetestIds = ["94", "40", "53", "54", "98", "99", "70", "76", "79", "107", "113", "116"];
    return annualTestRetestIds.includes(testType.testTypeId);
  }
function getMostRecentExpiryDateOnAllTestTypesBySystemNumber(systemNumber: any, testResultsDAO: TestResultsDAO): Promise<Date> {
    let maxDate = new Date(1970, 1, 1);
    return getTestResults({
      systemNumber,
      testStatus: TEST_STATUS.SUBMITTED,
      fromDateTime: new Date(1970, 1, 1),
      toDateTime: new Date()
    }, testResultsDAO)
      .then((testResults) => {
        const filteredTestTypeDates: any[] = [];
        testResults.forEach((testResult: { testTypes: any; vehicleType: any; vehicleSize: any; vehicleConfiguration: any; noOfAxles: any; }) => {
          testResult.testTypes.forEach((testType: { testExpiryDate: string; testCode: string; }) => {
            // prepare a list of annualTestTypes with expiry.
            if (isValidTestCodeForExpiryCalculation(testType.testCode.toUpperCase()) && isValidDate(testType.testExpiryDate)) {
              filteredTestTypeDates.push(moment(testType.testExpiryDate));
            }
          });
        });
        return filteredTestTypeDates;
      }).then((annualTestTypeDates) => {
        // fetch maxDate for annualTestTypes
        if (annualTestTypeDates && annualTestTypeDates.length > 0) {
          maxDate = moment.max(annualTestTypeDates).toDate();
        }
        return maxDate;
      }).catch((err) => {
        console.error("Something went wrong in generateExpiryDate > getMostRecentExpiryDateOnAllTestTypesBySystemNumber > getTestResults. Returning default test date and logging error:", err);
        return maxDate;
      });
  }
  //#region Private Static Functions
function isHGVTRLRoadworthinessTest(testTypeId: string): boolean {
    return HGV_TRL_ROADWORTHINESS_TEST_TYPES.IDS.includes(testTypeId);
   }
function isHgvOrTrl(vehicleType: string): boolean {
    return vehicleType === VEHICLE_TYPES.HGV || vehicleType === VEHICLE_TYPES.TRL;
  }

function isPassedRoadworthinessTestForHgvTrl(vehicleType: string, testTypeId: string, testResult: string): boolean {
    return isHgvOrTrl(vehicleType) && isHGVTRLRoadworthinessTest(testTypeId) && testResult === TEST_RESULT.PASS;
  }

function isAnnualTestTypeClassificationWithoutAbandonedResult(testTypeClassification: string, testResult: string): boolean {
    return testTypeClassification === TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE && testResult !== TEST_RESULT.ABANDONED;
  }

function isValidTestCodeForExpiryCalculation(testCode: string): boolean {
    return TEST_CODES_FOR_CALCULATING_EXPIRY.CODES.includes(testCode);
  }

function isMostRecentExpiryNotFound(mostRecentExpiryDate: Date): boolean {
    return moment(mostRecentExpiryDate).isSame(new Date(1970, 1, 1));
  }
function isWithinTwoMonthsFromToday(date: Date): boolean {
    return moment(date).utc().isBetween(moment(new Date()).utc(), moment(new Date()).utc().add(2, "months"), "days", "()");
  }

async function  getTestResults(filters: ITestResultFilters, testResultsDAO: TestResultsDAO ): Promise < any > {
    if (filters) {
      if (Object.keys(filters).length !== 0) {
        if (filters.fromDateTime && filters.toDateTime) {
          if (!GetTestResults.validateDates(filters.fromDateTime, filters.toDateTime)) {
            console.log("Invalid Filter Dates");
            return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST));
          }
        }
        if (filters.systemNumber) {
          return testResultsDAO.getBySystemNumber(filters.systemNumber).then((result) => {
             const response: ITestResultData = {Count: result.Count, Items: result.Items};
             return applyTestResultsFilters(response, filters);
          }).catch((error: HTTPError) => {
            if (!(error instanceof HTTPError)) {
              console.log(error);
              error = new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
            }
            throw error;
          });
        } else if (filters.testerStaffId) {
          const results = await testResultsDAO.getByTesterStaffId(filters.testerStaffId)
            .catch((error: HTTPError) => {
              if (!(error instanceof HTTPError)) {
                console.log(error);
                error = new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
              }
              throw error;
            });
          const response: ITestResultData = {Count: results.Count, Items: results.Items};
          return applyTestResultsFilters(response, filters);
        } else {
          console.log("Filters object invalid");
          return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST));
        }
      } else {
        console.log("Filters object empty");
        return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST));
      }
    } else {
      console.log("Missing filters object");
      return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST));
    }
  }


function applyTestResultsFilters(data: ITestResultData, filters: ITestResultFilters) {
    let testResults = checkTestResults(data);
    testResults = GetTestResults.filterTestResultByDate(testResults, filters.fromDateTime, filters.toDateTime);
    if (filters.testStatus) {
      testResults = GetTestResults.filterTestResultsByParam(testResults, "testStatus", filters.testStatus);
    }
    if (filters.testStationPNumber) {
      testResults = GetTestResults.filterTestResultsByParam(testResults, "testStationPNumber", filters.testStationPNumber);
    }
    testResults = GetTestResults.filterTestResultsByDeletionFlag(testResults);
    testResults = GetTestResults.filterTestTypesByDeletionFlag(testResults);
    if (filters.testResultId) {
      testResults = GetTestResults.filterTestResultsByParam(testResults, "testResultId", filters.testResultId);
      if (filters.testVersion) {
        testResults = GetTestResults.filterTestResultsByTestVersion(testResults, filters.testVersion);
      }
    } else {
      testResults = GetTestResults.filterTestResultsByTestVersion(testResults, TEST_VERSION.CURRENT);
      testResults = GetTestResults.removeTestHistory(testResults);
    }
    if (testResults.length === 0) {
      throw new HTTPError(404, ERRORS.NoResourceMatch);
    }
    return testResults;
  }

function checkTestResults(data: ITestResultData) {
    if (data) {
      if (!data.Count) {
        throw new HTTPError(404, ERRORS.NoResourceMatch);
      }
    }
    return data.Items;
  }
