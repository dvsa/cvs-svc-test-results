import { cloneDeep } from 'lodash';
import { TestResultSchema } from '@dvsa/cvs-type-definitions/types/v1/test-result';
import { TestResults } from '@dvsa/cvs-type-definitions/types/v1/enums/testResult.enum';
import { TestResultsService } from '../../src/services/TestResultsService';
import testResults from '../resources/test-results.json';
import postTestResults from '../resources/test-results-post.json';
import {
  TEST_TYPE_CLASSIFICATION,
  VEHICLE_TYPES,
} from '../../src/assets/Enums';
import { VehicleTestController } from '../../src/handlers/VehicleTestController';

describe('TestResultsService calling generateExpiryDate', () => {
  let testResultsService: TestResultsService;
  let MockTestResultsDAO: jest.Mock;
  let testResultsMockDB: any;
  let testResultsPostMock: any;
  let baseTestResult: TestResultSchema;

  beforeEach(() => {
    testResultsMockDB = testResults;
    testResultsPostMock = postTestResults;
    setupBaseTestResult();

    MockTestResultsDAO = jest.fn().mockImplementation(() => ({}));
    testResultsService = new TestResultsService(new MockTestResultsDAO());
  });

  function setupBaseTestResult() {
    baseTestResult = cloneDeep(testResultsPostMock[6]);
    baseTestResult.testTypes[0].testNumber = 'W01A00209';
    baseTestResult.testTypes[0].testTypeClassification =
      TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE;
    baseTestResult.testTypes[0].certificateNumber = null;
  }

  describe('When inserting a testResult with Annual With Certificate classification', () => {
    test.each`
      vehicleType          | testResult               | testTypeId | shouldSetCertificateNumber
      ${VEHICLE_TYPES.HGV} | ${TestResults.PASS}      | ${'122'}   | ${true}
      ${VEHICLE_TYPES.HGV} | ${TestResults.PRS}       | ${'122'}   | ${true}
      ${VEHICLE_TYPES.HGV} | ${TestResults.FAIL}      | ${'122'}   | ${false}
      ${VEHICLE_TYPES.HGV} | ${TestResults.ABANDONED} | ${'122'}   | ${false}
      ${VEHICLE_TYPES.PSV} | ${TestResults.PASS}      | ${'122'}   | ${false}
      ${VEHICLE_TYPES.TRL} | ${TestResults.PASS}      | ${'91'}    | ${true}
      ${VEHICLE_TYPES.TRL} | ${TestResults.PRS}       | ${'91'}    | ${true}
      ${VEHICLE_TYPES.TRL} | ${TestResults.FAIL}      | ${'91'}    | ${false}
      ${VEHICLE_TYPES.TRL} | ${TestResults.ABANDONED} | ${'91'}    | ${false}
      ${VEHICLE_TYPES.PSV} | ${TestResults.PASS}      | ${'91'}    | ${false}
      ${VEHICLE_TYPES.PSV} | ${TestResults.PASS}      | ${'1'}     | ${true}
      ${VEHICLE_TYPES.PSV} | ${TestResults.PRS}       | ${'1'}     | ${true}
      ${VEHICLE_TYPES.PSV} | ${TestResults.FAIL}      | ${'1'}     | ${true}
      ${VEHICLE_TYPES.PSV} | ${TestResults.ABANDONED} | ${'1'}     | ${false}
      ${VEHICLE_TYPES.HGV} | ${TestResults.PASS}      | ${'94'}    | ${true}
      ${VEHICLE_TYPES.HGV} | ${TestResults.PRS}       | ${'94'}    | ${true}
      ${VEHICLE_TYPES.HGV} | ${TestResults.FAIL}      | ${'94'}    | ${true}
      ${VEHICLE_TYPES.HGV} | ${TestResults.ABANDONED} | ${'94'}    | ${false}
      ${VEHICLE_TYPES.HGV} | ${TestResults.PASS}      | ${'50'}    | ${false}
      ${VEHICLE_TYPES.HGV} | ${TestResults.PRS}       | ${'50'}    | ${false}
      ${VEHICLE_TYPES.HGV} | ${TestResults.FAIL}      | ${'50'}    | ${false}
      ${VEHICLE_TYPES.HGV} | ${TestResults.ABANDONED} | ${'50'}    | ${false}
      ${VEHICLE_TYPES.PSV} | ${TestResults.PASS}      | ${'39'}    | ${false}
      ${VEHICLE_TYPES.PSV} | ${TestResults.PRS}       | ${'39'}    | ${false}
      ${VEHICLE_TYPES.PSV} | ${TestResults.FAIL}      | ${'39'}    | ${false}
      ${VEHICLE_TYPES.PSV} | ${TestResults.ABANDONED} | ${'39'}    | ${false}
    `(
      'for a $vehicleType with testResult $testResult and testTypeId $testTypeId it should generate a certificate: $shouldSetCertificateNumber',
      ({ vehicleType, testResult, testTypeId, shouldSetCertificateNumber }) => {
        baseTestResult.vehicleType = vehicleType;
        baseTestResult.testTypes[0].testResult = testResult;
        baseTestResult.testTypes[0].testTypeId = testTypeId;

        expect.assertions(2);
        // @ts-ignore
        // prettier-ignore
        const updatedResult = VehicleTestController.AssignCertificateNumberToTestTypes(
            baseTestResult,
          );
        expect(updatedResult.testTypes[0].certificateNumber === null).not.toBe(
          shouldSetCertificateNumber,
        );
        expect(
          updatedResult.testTypes[0].certificateNumber === 'W01A00209',
        ).toBe(shouldSetCertificateNumber);
      },
    );
  });
});
