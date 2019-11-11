import { HTTPError } from "../models/HTTPError";
import { TestResultsDAO } from "../models/TestResultsDAO";
import * as dateFns from "date-fns";
import { GetTestResults } from "../utils/GetTestResults";
import { MESSAGES, ERRORS, VEHICLE_TYPES, TEST_TYPE_CLASSIFICATION, TEST_RESULT, TEST_STATUS } from "../assets/Enums";
import testResultsSchemaHGVCancelled from "../models/TestResultsSchemaHGVCancelled";
import testResultsSchemaHGVSubmitted from "../models/TestResultsSchemaHGVSubmitted";
import testResultsSchemaPSVCancelled from "../models/TestResultsSchemaPSVCancelled";
import testResultsSchemaPSVSubmitted from "../models/TestResultsSchemaPSVSubmitted";
import testResultsSchemaTRLCancelled from "../models/TestResultsSchemaTRLCancelled";
import testResultsSchemaTRLSubmitted from "../models/TestResultsSchemaTRLSubmitted";
import { ITestResultPayload } from "../models/ITestResultPayload";
import { ITestResultData } from "../models/ITestResultData";
import { ITestResultFilters } from "../models/ITestResultFilter";
import { ITestResult } from "../models/ITestResult";
import { HTTPResponse } from "../models/HTTPResponse";
import {ValidationResult} from "joi";
import * as Joi from "joi";

/**
 * Service for retrieving and creating Test Results from/into the db
 * @returns Promise
 */
export class TestResultsService {
  public readonly testResultsDAO: TestResultsDAO;

  constructor(testResultsDAO: TestResultsDAO) {
    this.testResultsDAO = testResultsDAO;
  }

  public async getTestResults(filters: ITestResultFilters): Promise<any> {
    if (filters) {
      if (Object.keys(filters).length !== 0) {
        if (filters.fromDateTime && filters.toDateTime) {
          if (!GetTestResults.validateDates(filters.fromDateTime, filters.toDateTime)) {
            console.log("Invalid Filter Dates");
            return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST));
          }
        }
        if (filters.vin) {
          return this.testResultsDAO.getByVin(filters.vin).then((result) => {
             const response: ITestResultData = {Count: result.Count, Items: result.Items};
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
          const response: ITestResultData = {Count: results.Count, Items: results.Items};
          return this.applyTestResultsFilters(response, filters);
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
    let validationSchema = null;
    if (Object.keys(payload).length === 0) { // if empty object
      return Promise.reject(new HTTPError(400, ERRORS.PayloadCannotBeEmpty));
    }

    switch (payload.vehicleType + payload.testStatus) {
      case "psvsubmitted":
        validationSchema = testResultsSchemaPSVSubmitted;
        break;
      case "psvcancelled":
        validationSchema = testResultsSchemaPSVCancelled;
        break;
      case "hgvsubmitted":
        validationSchema = testResultsSchemaHGVSubmitted;
        break;
      case "hgvcancelled":
        validationSchema = testResultsSchemaHGVCancelled;
        break;
      case "trlsubmitted":
        validationSchema = testResultsSchemaTRLSubmitted;
        break;
      case "trlcancelled":
        validationSchema = testResultsSchemaTRLCancelled;
        break;
      default:
        validationSchema = null;
    }
    const validation: ValidationResult<any> | any | null = Joi.validate(payload, validationSchema);

    if (!this.reasonForAbandoningPresentOnAllAbandonedTests(payload)) {
      return Promise.reject(new HTTPError(400, MESSAGES.REASON_FOR_ABANDONING_NOT_PRESENT));
    }

    const fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse = this.fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(payload);
    if (fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse.result) {
      return Promise.reject(new HTTPError(400, fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse.missingFields + " are null for a defect with deficiency category other than advisory"));
    }

    // CVSB-7964: Fields Validation for LEC Test Types
    const missingFieldsForLecTestType: string[] = this.validateLecTestTypeFields(payload);
    if (missingFieldsForLecTestType && missingFieldsForLecTestType.length > 0) {
      return Promise.reject(new HTTPError(400,  {errors: missingFieldsForLecTestType} ));
    }

    if (this.isMissingRequiredCertificateNumberOnAdr(payload)) {
      return Promise.reject(new HTTPError(400, ERRORS.NoCertificateNumberOnAdr));
    }
    if (this.isPassAdrTestTypeWithoutExpiryDate(payload)) {
      return Promise.reject(new HTTPError(400, ERRORS.NoExpiryDate));
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
                return this.generateExpiryDate(payloadWithTestNumber)
                    .then((payloadWithExpiryDate: any) => {
                      const payloadWithCertificateNumber = this.generateCertificateNumber(payloadWithExpiryDate);
                      const payloadWithAnniversaryDate = this.setAnniversaryDate(payloadWithCertificateNumber);
                      const payloadWithVehicleId = this.setVehicleId(payloadWithAnniversaryDate);
                      return this.testResultsDAO.createSingle(payloadWithVehicleId);
                    });
              });
        }).catch((error) => {
          if (error.statusCode === 400 && error.message === MESSAGES.CONDITIONAL_REQUEST_FAILED) {
            console.log("Error in insertTestResult > getTestTypesWithTestCodesAndClassification: Test Result id already exists", error);
            return Promise.reject(new HTTPResponse(201, MESSAGES.ID_ALREADY_EXISTS));
          }
          console.log("Error in insertTestResult > getTestTypesWithTestCodesAndClassification", error);
          return Promise.reject(new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR));
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
          if (testType.testResult === TEST_RESULT.ABANDONED && !testType.reasonForAbandoning) {
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

  public generateExpiryDate(payload: ITestResultPayload) {
    if (payload.testStatus !== TEST_STATUS.SUBMITTED) {
      return Promise.resolve(payload);
    } else {
      return this.getMostRecentExpiryDateOnAllTestTypesByVin(payload.vin)
          .then((mostRecentExpiryDateOnAllTestTypesByVin) => {
            payload.testTypes.forEach((testType: any, index: number) => {
              if (testType.testTypeClassification === TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE &&
                  (testType.testResult === TEST_RESULT.PASS || testType.testResult === TEST_RESULT.PRS)) {
                  payload.testTypes[index] = testType;
                  if (payload.vehicleType === VEHICLE_TYPES.PSV) {
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
                  } else if (payload.vehicleType === VEHICLE_TYPES.HGV || payload.vehicleType === VEHICLE_TYPES.TRL) {
                    // Applying CVSB-8658 logic changes if vehicle doesn't currently have an existing expiry date
                    const regOrFirstUseDate = payload.vehicleType === VEHICLE_TYPES.HGV ? payload.regnDate : payload.firstUseDate;
                    // preparaing compare date for CVSB-9187 to compare first test/retest conducted after anniversary date
                    const firstTestAfterAnvCompareDate = dateFns.addYears(dateFns.startOfMonth(regOrFirstUseDate), 1);
                    // Checks for testType = First test or First test Retest AND test date is 1 year from the month of first use or registration date
                    if (this.isFirstTestRetestTestType(testType) && dateFns.isAfter(new Date(), firstTestAfterAnvCompareDate)) {
                        testType.testExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1).toISOString();
                    } else if (this.isFirstTestRetestTestType(testType) && dateFns.isEqual(mostRecentExpiryDateOnAllTestTypesByVin, new Date(1970, 1, 1))) {
                      const anvDateForCompare = regOrFirstUseDate ? dateFns.addYears(dateFns.lastDayOfMonth(regOrFirstUseDate), 1).toISOString() : undefined;
                      // If anniversaryDate is not populated in tech-records OR test date is 2 months or more before the Registration/First Use Anniversary for HGV/TRL
                      console.log(`Current date: ${new Date()}, annv Date: ${anvDateForCompare}`);
                      if (!anvDateForCompare || dateFns.isBefore(new  Date(), dateFns.subMonths(anvDateForCompare, 2))) {
                        testType.testExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1).toISOString();
                        console.log(`Setting expiryDate: ${testType.testExpiryDate}`);
                      } else {
                        // less than 2 months then set expiryDate 1 year after the Registration/First Use Anniversary date
                        testType.testExpiryDate = dateFns.addYears(anvDateForCompare, 1).toISOString();
                        console.log(`Setting expiryDate as 1yr from RegDate: ${testType.testExpiryDate}`);
                      }
                    } else {
                      if (dateFns.isAfter(mostRecentExpiryDateOnAllTestTypesByVin, new Date()) && dateFns.isBefore(mostRecentExpiryDateOnAllTestTypesByVin, dateFns.addMonths(new Date(), 2))) {
                        testType.testExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(mostRecentExpiryDateOnAllTestTypesByVin), 1).toISOString();
                      } else {
                        testType.testExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1).toISOString();
                      }
                    }
                  }

              }
            });
            console.log("generateExpiryDate payload", payload.testTypes);
            return Promise.resolve(payload);
          }).catch((error) => {
            console.log("Error in error generateExpiryDate > getMostRecentExpiryDateOnAllTestTypesByVin", error);
            throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
          });
    }
  }

  public isFirstTestRetestTestType(testType: any): boolean {
    const adrTestTypeIds = ["41", "64", "65", "66", "67", "95", "102", "103", "104"];
    return adrTestTypeIds.includes(testType.testTypeId);
  }
  public getMostRecentExpiryDateOnAllTestTypesByVin(vin: any) {
    let maxDate = new Date(1970, 1, 1);
    return this.getTestResults({
      vin,
      testStatus: TEST_STATUS.SUBMITTED,
      fromDateTime: new Date(1970, 1, 1),
      toDateTime: new Date()
    })
        .then((testResults) => {
          const promiseArray: Array<Promise<void>> = [];
          const filterTestTypes: any[] = [];
          testResults.forEach((testResult: { testTypes: any; vehicleType: any; vehicleSize: any; vehicleConfiguration: any; noOfAxles: any; }) => {
            const promise = this.getTestTypesWithTestCodesAndClassification(testResult.testTypes, testResult.vehicleType, testResult.vehicleSize, testResult.vehicleConfiguration, testResult.noOfAxles)
                .then((testTypes) => {
                  testTypes.forEach((testType: { testTypeClassification: string; }) => {
                    if (testType.testTypeClassification === TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE) {
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
    testTypes.forEach((testType, index) => {
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

  public isMissingRequiredCertificateNumberOnLec(payload: ITestResultPayload): boolean {
    let bool = false;
    if (payload.testTypes) {
      payload.testTypes.forEach((testType) => {
        if (this.isTestTypeLec(testType) && payload.testStatus === TEST_STATUS.SUBMITTED && !testType.certificateNumber) {
            bool = true;
        }
      });
    }
    return bool;
  }

  public isMissingRequiredCertificateNumberOnAdr(payload: ITestResultPayload): boolean {
    let bool = false;
    if (payload.testTypes) {
      payload.testTypes.forEach((testType) => {
        if ((this.isTestTypeAdr(testType) && testType.testResult === TEST_RESULT.PASS) && payload.testStatus === TEST_STATUS.SUBMITTED && !testType.certificateNumber) {
          bool = true;
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
        if (payload.vehicleType === VEHICLE_TYPES.PSV) {
          testType.testAnniversaryDate = dateFns.addDays(dateFns.subMonths(testType.testExpiryDate, 2), 1).toISOString();
        } else {
          testType.testAnniversaryDate = testType.testExpiryDate;
        }
      }
    });
    return payload;
  }

  public isTestTypeAdr(testType: any): boolean {
    const adrTestTypeIds = ["50", "59", "60"];

    return adrTestTypeIds.includes(testType.testTypeId);
  }

  public isTestTypeLec(testType: any): boolean {
    const lecTestTypeIds = ["39", "44", "45"];

    return lecTestTypeIds.includes(testType.testTypeId);
  }

  public isPassAdrTestTypeWithoutExpiryDate(payload: ITestResultPayload): boolean {
    let bool = false;
    if (payload.testTypes) {
      payload.testTypes.forEach((testType) => {
        if (this.isTestTypeAdr(testType) && testType.testResult === TEST_RESULT.PASS && payload.testStatus === TEST_STATUS.SUBMITTED && !testType.testExpiryDate) {
          bool = true;
        }
      });
    }
    return bool;
  }

  public generateCertificateNumber(payload: ITestResultPayload) {
    if (payload.testStatus === TEST_STATUS.SUBMITTED) {
      payload.testTypes.forEach((testType) => {
        if (testType.testTypeClassification === TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE && testType.testResult !== TEST_RESULT.ABANDONED && !this.isTestTypeAdr(testType) && !this.isTestTypeLec(testType)) {
          testType.certificateNumber = testType.testNumber;
        }
      });
    }
    return payload;
  }

  private validateLecTestTypeFields(payload: ITestResultPayload): string[] {
    const missingFields: string[] = [];
    if (payload.testTypes) {
      payload.testTypes.forEach((testType: { testTypeId: string; certificateNumber: string; expiryDate: Date; modType: any; emissionStandard: string; fuelType: string; testExpiryDate: any, testResult: string}) => {
        if (this.isTestTypeLec(testType) ) {
            if (!testType.certificateNumber) {
              missingFields.push( ERRORS.NoCertificateNumberOnLec);
            }
            if (testType.testResult === TEST_RESULT.PASS) {
            if (!testType.testExpiryDate) {
              missingFields.push(ERRORS.NoLECExpiryDate);
            }
            if (!testType.modType) {
              missingFields.push(ERRORS.NoModificationType);
            }
            if (!testType.emissionStandard) {
              missingFields.push(ERRORS.NoEmissionStandard);
            }
            if (!testType.fuelType) {
              missingFields.push(ERRORS.NoFuelType);
            }
          }
        }
      });

    }
    return missingFields;
  }
}
