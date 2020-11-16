import { ValidationResult } from "joi";
import { isArray } from "lodash";

import * as enums from "../assets/Enums";
import * as models from "../models";
import { ISubSeg } from "../models/ISubSeg";
import * as validators from "../models/validators";
import { HTTPError } from "../models/HTTPError";
import { DateProvider } from "../handlers/expiry/providers/DateProvider";


export class MappingUtil {

  public static getSubSegment(newSubSegment: string): ISubSeg | null {
    let subSegment: ISubSeg | null = null;
    if (!process.env._X_AMZN_TRACE_ID) {
    console.log("Serverless Offline detected; skipping AWS X-Ray setup");
    return subSegment;
    }
    const AWS = require("aws-xray-sdk");
    const segment = AWS.getSegment();
    AWS.capturePromise();
    if (segment) {
      subSegment = segment.addNewSubsegment(newSubSegment);
    }
    return subSegment;
  }

  public static getTestResultsBySystemNumberFilters(event: any, subSegment: ISubSeg | null) {
    let toDate = DateProvider.getEndOfDay();
    let fromDate = DateProvider.getTwoYearsFromDate(toDate);
    let testStatus = enums.TEST_STATUS.SUBMITTED;
    let testVersion = enums.TEST_VERSION.CURRENT;
    let resultId;
    if (event.queryStringParameters) {
      const { toDateTime, fromDateTime, status, testResultId, version } = event.queryStringParameters;
      if ( toDateTime === "" || fromDateTime === "") {
        const errorDate = toDateTime === "" ? "toDate" : "fromDate";
        if (subSegment) {
          subSegment.addError(`Bad Request - ${errorDate} empty`);
        }
        console.log(`Bad Request in getTestResultsBySystemNumber - ${errorDate} empty`);
        throw new HTTPError(400, enums.MESSAGES.BAD_REQUEST);
      }
      toDate = toDateTime ? new Date(toDateTime) : DateProvider.getEndOfDay();
      fromDate = fromDateTime ? new Date(fromDateTime) : DateProvider.getTwoYearsFromDate(toDateTime);
      if (status) {
        testStatus = status;
      }
      if (testResultId) {
        resultId = testResultId;
      }
      if (version) {
          testVersion = version;
      }
    }
    const filters: models.ITestResultFilters =  {
      systemNumber: event.pathParameters.systemNumber,
      testStatus,
      toDateTime: toDate,
      fromDateTime: fromDate,
      testResultId: resultId,
      testVersion
    };
    return filters;
  }

  public static getTestResultsByTesterStaffIdFilters(event: any, subSegment: ISubSeg | null) {
    const BAD_REQUEST_MISSING_FIELDS = "Bad request in getTestResultsByTesterStaffId - missing required parameters";
    if (!event.queryStringParameters) {
      throw new HTTPError(400, enums.MESSAGES.BAD_REQUEST);
    }
    const {testerStaffId, toDateTime, fromDateTime, testStationPNumber, testStatus} = event.queryStringParameters;
    if (!testerStaffId || !toDateTime || !fromDateTime) {
      console.log(BAD_REQUEST_MISSING_FIELDS);
      if (subSegment) {
        subSegment.addError(BAD_REQUEST_MISSING_FIELDS);
      }
      throw new HTTPError(400, enums.MESSAGES.BAD_REQUEST);
    }

    const filters: models.ITestResultFilters =  {
      testerStaffId,
      testStatus,
      testStationPNumber,
      toDateTime: new Date(toDateTime),
      fromDateTime: new Date(fromDateTime),
    };
    return filters;
  }

  public static cleanDefectsArrayForSpecialistTests(testResult: models.ITestResult) {
    testResult.testTypes.forEach((testType: models.TestType) => {
      if (enums.SPECIALIST_TEST_TYPE_IDS.includes(testType.testTypeId)) {
        testType.defects = [];
      }
    });
  }

    public static setCreatedAtAndLastUpdatedAtDates(payload: models.ITestResultPayload): models.ITestResultPayload {
        const createdAtDate = new Date().toISOString();
        payload.createdAt = createdAtDate;
        payload.createdById = payload.testerStaffId;
        payload.createdByName = payload.testerName;
        payload.testVersion = enums.TEST_VERSION.CURRENT;
        payload.reasonForCreation = enums.REASON_FOR_CREATION.TEST_CONDUCTED;
        if (payload.testTypes.length > 0) {
          payload.testTypes.forEach((testType: any) => {
            Object.assign(testType,
              {
                createdAt: createdAtDate, lastUpdatedAt: createdAtDate
              });
          });
        }
        return payload;
      }

    public static setAuditDetails(newTestResult: models.ITestResult, oldTestResult: models.ITestResult, msUserDetails: models.IMsUserDetails) {
        const date = new Date().toISOString();
        newTestResult.createdAt = date;
        newTestResult.createdByName = msUserDetails.msUser;
        newTestResult.createdById = msUserDetails.msOid;
        delete newTestResult.lastUpdatedAt;
        delete newTestResult.lastUpdatedById;
        delete newTestResult.lastUpdatedByName;

        oldTestResult.lastUpdatedAt = date;
        oldTestResult.lastUpdatedByName = msUserDetails.msUser;
        oldTestResult.lastUpdatedById = msUserDetails.msOid;

        newTestResult.shouldEmailCertificate = "false";
        oldTestResult.shouldEmailCertificate = "false;";
      }

    public static arrayCustomizer(objValue: any, srcValue: any) {
        if (isArray(objValue) && isArray(srcValue)) {
          return srcValue;
        }
      }

    public static removeNonEditableAttributes(testResult: models.ITestResult) {
        delete testResult.vehicleId;
        delete testResult.testEndTimestamp;
        delete testResult.testVersion;
        delete testResult.systemNumber;
        delete testResult.vin;
      }

    public static getValidationSchema(vehicleType: string, testStatus: string) {
    switch (vehicleType + testStatus) {
        case "psvsubmitted":
        return validators.psvSubmitted;
        case "psvcancelled":
        return validators.psvCancelled;
        case "hgvsubmitted":
        return validators.hgvSubmitted;
        case "hgvcancelled":
        return validators.hgvCancelled;
        case "trlsubmitted":
        return validators.trlSubmitted;
        case "trlcancelled":
        return validators.trlCancelled;
        case "lgvsubmitted":
        return validators.lgvSubmitted;
        case "lgvcancelled":
        return validators.lgvCancelled;
        case "carsubmitted":
        return validators.carSubmitted;
        case "carcancelled":
        return validators.carCancelled;
        case "motorcyclesubmitted":
        return validators.motorcycleSubmitted;
        case "motorcyclecancelled":
        return validators.motorcycleCancelled;
        default:
        return null;
    }
    }

    public static mapErrorMessage(validation: ValidationResult<any> | any ) {
        return validation.error.details.map((detail: { message: string; }) => {
          return detail.message;
        });
      }

}
