import { HTTPError } from "../models/HTTPError";
import { TestResultsDAO } from "../models/TestResultsDAO";
import * as Joi from "joi";
import * as dateFns from "date-fns";
import { GetTestResults } from "../utils/GetTestResults";
import { MESSAGES, ERRORS } from "../assets/Enums";
import * as testResultsSchemaSubmitted from "../models/TestResultsSchemaSubmitted";
import * as testResultsSchemaCancelled from "../models/TestResultsSchemaCancelled";
import { ValidationResult } from "joi";
import { ITestResultPayload } from "../models/ITestResultPayload";
import { ITestResultData } from "../models/ITestResultData";
import { ITestResultFilters } from "../models/ITestResultFilter";
import { ITestResult } from "../models/ITestResult";
import { HTTPResponse } from "../models/HTTPResponse";

/**
 * Service for retrieving and creating Test Results from/into the db
 * @returns Promise
 */
export class TestResultsService {
  public readonly testResultsDAO: TestResultsDAO;

  constructor(testResultsDAO: TestResultsDAO) {
    this.testResultsDAO = testResultsDAO;
  }

  public async getTestResults(filters: ITestResultFilters) {
    if (filters) {
      if (Object.keys(filters).length !== 0) {
        if (filters.fromDateTime && filters.toDateTime) {
          if (!GetTestResults.validateDates(filters.fromDateTime, filters.toDateTime)) {
            console.log("Invalid Filter Dates");
            return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST));
          }
        }
        if (filters.vin) {
          return this.testResultsDAO.getByVin(filters.vin).then((response: { Count: any; Items: any; }) => {
            return this.applyTestResultsFilters(response, filters);
          }).catch((error: HTTPError) => {
            if (!(error instanceof HTTPError)) {
              console.log(error);
              error = new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
            }
            throw error;
          });
        } else if (filters.testerStaffId) {
          const results = await this.testResultsDAO.getByTesterStaffId(filters.testerStaffId)
            .catch((error: HTTPError) => {
              if (!(error instanceof HTTPError)) {
                console.log(error);
                error = new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
              }
              throw error;
            });
          return this.applyTestResultsFilters(results, filters);
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

  public checkTestResults(data: ITestResultData) {
    if (data) {
      if (!data.Count) {
        throw new HTTPError(404, ERRORS.NoResourceMatch);
      }
    }
    return data.Items;
  }

  public applyTestResultsFilters(data: ITestResultData, filters: ITestResultFilters) {
    let testResults = this.checkTestResults(data);
    testResults = GetTestResults.filterTestResultByDate(testResults, filters.fromDateTime, filters.toDateTime);
    if (filters.testStatus) {
      testResults = GetTestResults.filterTestResultsByParam(testResults, "testStatus", filters.testStatus);
    }
    if (filters.testStationPNumber) {
      testResults = GetTestResults.filterTestResultsByParam(testResults, "testStationPNumber", filters.testStationPNumber);
    }
    testResults = GetTestResults.filterTestResultsByDeletionFlag(testResults);
    testResults = GetTestResults.filterTestTypesByDeletionFlag(testResults);

    if (testResults.length === 0) {
      throw new HTTPError(404, ERRORS.NoResourceMatch);
    }
    testResults = GetTestResults.removeTestResultId(testResults);
    testResults = testResults.map((testResult: any) => this.removeVehicleClassification(testResult));
    return testResults;
  }

  public insertTestResult(payload: ITestResultPayload) {
    let validation: any;

    if (payload.testStatus === "submitted") {
      validation = Joi.validate(payload, testResultsSchemaSubmitted).value;
    } else if (payload.testStatus === "cancelled") {
      validation = Joi.validate(payload, testResultsSchemaCancelled).value;
    } else {
      validation = {
        error: {
          details: [
            { message: '"testStatus" should be one of ["submitted", "cancelled"]' }
          ]
        }
      };
    }
    if (!this.reasonForAbandoningPresentOnAllAbandonedTests(payload)) {
      return Promise.reject(new HTTPError(400, "Reason for Abandoning not present on all abandoned tests"));
    }

    const fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse = this.fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(payload);
    if (fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse.result) {
      return Promise.reject(new HTTPError(400, fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse.missingFields + " are null for a defect with deficiency category other than advisory"));
    }
    if (this.lecTestTypeWithoutCertificateNumber(payload)) {
      return Promise.reject(new HTTPError(400, ERRORS.NoCertificateNumber));
    }
    if (validation !== null && validation.error) {
      return Promise.reject(new HTTPError(400,
        {
          errors: validation.error.details.map((detail: { message: string; }) => {
            return detail.message;
          })
        }));
    }

    payload = this.setCreatedAtAndLastUpdatedAtDates(payload);
    return this.getTestTypesWithTestCodesAndClassification(payload.testTypes, payload.vehicleType, payload.vehicleSize, payload.vehicleConfiguration, payload.noOfAxles)
      .then((testTypesWithTestCodesAndClassification) => {
        payload.testTypes = testTypesWithTestCodesAndClassification;
      })
      .then(() => {
        return this.setTestNumber(payload)
          .then((payloadWithTestNumber) => {
            return this.setExpiryDateAndCertificateNumber(payloadWithTestNumber)
              .then((payloadWithExpiryDate: any) => {
                const payloadWithAnniversaryDate = this.setAnniversaryDate(payloadWithExpiryDate);
                const payloadWithVehicleId = this.setVehicleId(payloadWithAnniversaryDate);
                return this.testResultsDAO.createSingle(payloadWithVehicleId);
              });
          });
      }).catch((error) => {
        if (error.statusCode === 400 && error.message === "The conditional request failed") {
          console.log("Error in insertTestResult > getTestTypesWithTestCodesAndClassification: Test Result id already exists", error);
          return Promise.reject(new HTTPResponse(201, "Test Result id already exists"));
        }
        console.log("Error in insertTestResult > getTestTypesWithTestCodesAndClassification", error);
        return Promise.reject(new HTTPError(500, "Internal server error"));
      });
  }

  public fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(payload: ITestResultPayload) {
    const missingFields: string[] = [];
    let bool = false;
    if (payload.testTypes) {
      payload.testTypes.forEach((testType: { defects: { forEach: (arg0: (defect: any) => void) => void; }; }) => {
        if (testType.defects) {
          testType.defects.forEach((defect) => {
            if (defect.deficiencyCategory !== "advisory") {
              if (defect.additionalInformation.location === null) {
                missingFields.push("location");
                bool = true;
              }
              if (defect.deficiencyText === null) {
                missingFields.push("deficiencyText");
                bool = true;
              }
              if (defect.stdForProhibition === null) {
                missingFields.push("stdForProhibition");
                bool = true;
              }
            }
          });
        }
      });
    }
    let missingFieldsString = "";
    missingFields.forEach((missingField) => {
      missingFieldsString = missingFieldsString + "/" + missingField;
    });
    return { result: bool, missingFields: missingFieldsString };
  }

  public setTestNumber(payload: ITestResultPayload) {
    const promiseArray: any[] = [];
    if (payload.testTypes) {
      payload.testTypes.forEach((testType: { testNumber: any; }) => {
        const promise = this.testResultsDAO.getTestNumber()
          .then((testNumberResponse: { testNumber: any; }) => {
            testType.testNumber = testNumberResponse.testNumber;
          });

        promiseArray.push(promise);
      });
      return Promise.all(promiseArray).then(() => {
        return payload;
      });
    } else {
      return Promise.resolve(payload);
    }
  }

  public reasonForAbandoningPresentOnAllAbandonedTests(payload: ITestResultPayload) {
    let bool = true;
    if (payload.testTypes) {
      if (payload.testTypes.length > 0) {
        payload.testTypes.forEach((testType: { testResult: string; reasonForAbandoning: any; }) => {
          if (testType.testResult === "abandoned" && !testType.reasonForAbandoning) {
            bool = false;
          }
        });
      }
    }
    return bool;
  }

  public setCreatedAtAndLastUpdatedAtDates(payload: ITestResultPayload): ITestResultPayload {
    if (payload.testTypes.length > 0) {
      payload.testTypes.forEach((testType: any) => {
        Object.assign(testType,
          {
            createdAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString()
          });
      });
    }
    return payload;
  }

  public setExpiryDateAndCertificateNumber(payload: ITestResultPayload) {
    if (payload.testStatus !== "submitted") {
      return Promise.resolve(payload);
    } else {
      return this.getMostRecentExpiryDateOnAllTestTypesByVin(payload.vin)
        .then((mostRecentExpiryDateOnAllTestTypesByVin) => {
          payload.testTypes.forEach((testType: any, index: number) => {
            if (testType.testTypeClassification === "Annual With Certificate" &&
              (testType.testResult === "pass" || testType.testResult === "prs" || testType.testResult === "fail")) {
              testType.certificateNumber = testType.testNumber;
              payload.testTypes[index] = testType;
              if (testType.testResult !== "fail") {
                if (dateFns.isEqual(mostRecentExpiryDateOnAllTestTypesByVin, new Date(1970, 1, 1))
                  || dateFns.isBefore(mostRecentExpiryDateOnAllTestTypesByVin, dateFns.startOfDay(new Date()))
                  || dateFns.isAfter(mostRecentExpiryDateOnAllTestTypesByVin, dateFns.addMonths(new Date(), 2))) {
                  testType.testExpiryDate = dateFns.subDays(dateFns.addYears(new Date(), 1), 1).toISOString();
                  payload.testTypes[index] = testType;
                } else if (dateFns.isToday(mostRecentExpiryDateOnAllTestTypesByVin)) {
                  testType.testExpiryDate = dateFns.addYears(new Date(), 1).toISOString();
                  payload.testTypes[index] = testType;
                } else if (dateFns.isBefore(mostRecentExpiryDateOnAllTestTypesByVin, dateFns.addMonths(new Date(), 2)) && dateFns.isAfter(mostRecentExpiryDateOnAllTestTypesByVin, new Date())) {
                  testType.testExpiryDate = dateFns.addYears(mostRecentExpiryDateOnAllTestTypesByVin, 1).toISOString();
                  payload.testTypes[index] = testType;
                }
              }
            }
          });
          console.log("setExpiryDateAndCertificateNumber payload", payload.testTypes);
          return Promise.resolve(payload);
        }).catch((error) => {
          console.log("Error in error setExpiryDateAndCertificateNumber > getMostRecentExpiryDateOnAllTestTypesByVin", error);
          throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
        });
    }
  }

  public getMostRecentExpiryDateOnAllTestTypesByVin(vin: any) {
    let maxDate = new Date(1970, 1, 1);
    return this.getTestResults({ vin, testStatus: "submitted", fromDateTime: new Date(1970, 1, 1), toDateTime: new Date() })
      .then((testResults) => {
        const promiseArray: Array<Promise<void>> = [];
        const filterTestTypes: any[] = [];
        testResults.forEach((testResult: { testTypes: any; vehicleType: any; vehicleSize: any; vehicleConfiguration: any; noOfAxles: any; }) => {
          const promise = this.getTestTypesWithTestCodesAndClassification(testResult.testTypes, testResult.vehicleType, testResult.vehicleSize, testResult.vehicleConfiguration, testResult.noOfAxles)
            .then((testTypes) => {
              testTypes.forEach((testType: { testTypeClassification: string; }) => {
                if (testType.testTypeClassification === "Annual With Certificate") {
                  filterTestTypes.push(testType);
                }
              });
            })
            .catch((error) => {
              console.log("Error in getMostRecentExpiryDateOnAllTestTypesByVin > getTestResults > getTestTypesWithTestCodesAndClassification: ", error);
            });
          promiseArray.push(promise);
        });
        return Promise.all(promiseArray).then(() => {
          return filterTestTypes;
        });
      })
      .then((testTypes) => {
        testTypes.forEach((testType) => {
          if (dateFns.isAfter(testType.testExpiryDate, maxDate) && testType.testTypeClassification === "Annual With Certificate") {
            maxDate = testType.testExpiryDate;
          }
        });
        return maxDate;
      }).catch(() => {
        console.log("Something went wrong in getMostRecentExpiryDateOnAllTestTypesByVin > getTestResults. Returning default test date.");
        return maxDate;
      });
  }

  public getTestTypesWithTestCodesAndClassification(testTypes: Array<{ testTypeClassification: any; testTypeId: any; testCode?: any; }>, vehicleType: any, vehicleSize: any, vehicleConfiguration: any, noOfAxles: any) {
    const promiseArray: any = [];
    if (testTypes === undefined) {
      testTypes = [];
    }
    // for (let i = 0; i < testTypes.length; i++) {
    testTypes.forEach((testType, index) => {
      // const promise = this.testResultsDAO.getTestCodesAndClassificationFromTestTypes(testTypes[i].testTypeId, vehicleType, vehicleSize, vehicleConfiguration, noOfAxles)
      const promise = this.testResultsDAO.getTestCodesAndClassificationFromTestTypes(testType.testTypeId, vehicleType, vehicleSize, vehicleConfiguration, noOfAxles)
        .then((currentTestCodesAndClassification: { defaultTestCode: any; testTypeClassification: any; linkedTestCode: any; }) => {
          if (testTypes.length === 1) {
            testTypes[index].testCode = currentTestCodesAndClassification.defaultTestCode;
            testTypes[index].testTypeClassification = currentTestCodesAndClassification.testTypeClassification;
          } else {
            if (currentTestCodesAndClassification.linkedTestCode) {
              testTypes[index].testCode = currentTestCodesAndClassification.linkedTestCode;
            } else {
              testTypes[index].testCode = currentTestCodesAndClassification.defaultTestCode;
            }
            testTypes[index].testTypeClassification = currentTestCodesAndClassification.testTypeClassification;
          }
        });
      promiseArray.push(promise);
    });
    return Promise.all(promiseArray).then(() => {
      return Promise.resolve(testTypes);
    });
  }

  public insertTestResultsList(testResultsItems: ITestResult[]) {
    return this.testResultsDAO.createMultiple(testResultsItems)
      .then((data: any) => {
        if (data.UnprocessedItems) { return data.UnprocessedItems; }
      })
      .catch((error: any) => {
        if (error) {
          console.log("Error in insertTestResultsList: ", error);
          throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
        }
      });
  }

  public deleteTestResultsList(testResultsVinIdPairs: any[]) {
    return this.testResultsDAO.deleteMultiple(testResultsVinIdPairs)
      .then((data: any) => {
        if (data.UnprocessedItems) {
          return data.UnprocessedItems;
        }
      })
      .catch((error: any) => {
        if (error) {
          console.log(error);
          throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
        }
      });
  }

  public lecTestTypeWithoutCertificateNumber(payload: { testStatus?: string; testTypes: any; vehicleType?: any; vehicleSize?: any; vehicleConfiguration?: any; noOfAxles?: any; }) {
    const bool = false;
    if (payload.testTypes) {
      payload.testTypes.forEach((testType: { testTypeId: string; certificateNumber: any; }) => {
        if (testType.testTypeId === "39" && !testType.certificateNumber) {
          return true;
        }
      });
    }
    return bool;
  }

  public removeVehicleClassification(payload: { testTypes: { forEach: (arg0: (testType: any) => void) => void; }; }) {
    payload.testTypes.forEach((testType) => {
      delete testType.testTypeClassification;
    });
    return payload;
  }

  public setVehicleId(payload: ITestResultPayload): ITestResultPayload {
    payload.vehicleId = payload.vrm;
    return payload;
  }

  public setAnniversaryDate(payload: ITestResultPayload) {
    payload.testTypes.forEach((testType) => {
      if (testType.testExpiryDate) {
        testType.testAnniversaryDate = dateFns.addDays(dateFns.subMonths(testType.testExpiryDate, 2), 1).toISOString();
      }
    });
    return payload;
  }
}
