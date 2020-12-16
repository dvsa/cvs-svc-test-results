import { TestResultsService } from "../../src/services/TestResultsService";
import { cloneDeep } from "lodash";
import testResults from "../resources/test-results.json";
import postTestResults from "../resources/test-results-post.json";
import {
  TEST_TYPE_CLASSIFICATION,
  VEHICLE_TYPES,
  TEST_RESULT,
} from "../../src/assets/Enums";
import { ITestResultPayload } from "../../src/models/ITestResultPayload";
import { VehicleTestController } from "../../src/handlers/VehicleTestController";

describe("TestResultsService calling generateExpiryDate", () => {
  let testResultsService: TestResultsService;
  let MockTestResultsDAO: jest.Mock;
  let testResultsMockDB: any;
  let testResultsPostMock: any;
  let baseTestResult: ITestResultPayload;

  beforeEach(() => {
    testResultsMockDB = testResults;
    testResultsPostMock = postTestResults;
    setupBaseTestResult();

    MockTestResultsDAO = jest.fn().mockImplementation(() => {
      return {};
    });
    testResultsService = new TestResultsService(new MockTestResultsDAO());
  });

  function setupBaseTestResult() {
    baseTestResult = cloneDeep(testResultsPostMock[6]);
    baseTestResult.testTypes[0].testNumber = "W01A00209";
    baseTestResult.testTypes[0].testTypeClassification =
      TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE;
    baseTestResult.testTypes[0].certificateNumber = null;
  }

  describe("When inserting a testResult with Annual With Certificate classification", () => {
    test.each`
      vehicleType          | testResult               | testTypeId | shouldSetCertificateNumber
      ${VEHICLE_TYPES.HGV} | ${TEST_RESULT.PASS}      | ${"122"}   | ${true}
      ${VEHICLE_TYPES.HGV} | ${TEST_RESULT.PRS}       | ${"122"}   | ${true}
      ${VEHICLE_TYPES.HGV} | ${TEST_RESULT.FAIL}      | ${"122"}   | ${false}
      ${VEHICLE_TYPES.HGV} | ${TEST_RESULT.ABANDONED} | ${"122"}   | ${false}
      ${VEHICLE_TYPES.PSV} | ${TEST_RESULT.PASS}      | ${"122"}   | ${false}
      ${VEHICLE_TYPES.TRL} | ${TEST_RESULT.PASS}      | ${"91"}    | ${true}
      ${VEHICLE_TYPES.TRL} | ${TEST_RESULT.PRS}       | ${"91"}    | ${true}
      ${VEHICLE_TYPES.TRL} | ${TEST_RESULT.FAIL}      | ${"91"}    | ${false}
      ${VEHICLE_TYPES.TRL} | ${TEST_RESULT.ABANDONED} | ${"91"}    | ${false}
      ${VEHICLE_TYPES.PSV} | ${TEST_RESULT.PASS}      | ${"91"}    | ${false}
      ${VEHICLE_TYPES.PSV} | ${TEST_RESULT.PASS}      | ${"1"}     | ${true}
      ${VEHICLE_TYPES.PSV} | ${TEST_RESULT.PRS}       | ${"1"}     | ${true}
      ${VEHICLE_TYPES.PSV} | ${TEST_RESULT.FAIL}      | ${"1"}     | ${true}
      ${VEHICLE_TYPES.PSV} | ${TEST_RESULT.ABANDONED} | ${"1"}     | ${false}
      ${VEHICLE_TYPES.HGV} | ${TEST_RESULT.PASS}      | ${"94"}    | ${true}
      ${VEHICLE_TYPES.HGV} | ${TEST_RESULT.PRS}       | ${"94"}    | ${true}
      ${VEHICLE_TYPES.HGV} | ${TEST_RESULT.FAIL}      | ${"94"}    | ${true}
      ${VEHICLE_TYPES.HGV} | ${TEST_RESULT.ABANDONED} | ${"94"}    | ${false}
      ${VEHICLE_TYPES.HGV} | ${TEST_RESULT.PASS}      | ${"50"}    | ${false}
      ${VEHICLE_TYPES.HGV} | ${TEST_RESULT.PRS}       | ${"50"}    | ${false}
      ${VEHICLE_TYPES.HGV} | ${TEST_RESULT.FAIL}      | ${"50"}    | ${false}
      ${VEHICLE_TYPES.HGV} | ${TEST_RESULT.ABANDONED} | ${"50"}    | ${false}
      ${VEHICLE_TYPES.PSV} | ${TEST_RESULT.PASS}      | ${"39"}    | ${false}
      ${VEHICLE_TYPES.PSV} | ${TEST_RESULT.PRS}       | ${"39"}    | ${false}
      ${VEHICLE_TYPES.PSV} | ${TEST_RESULT.FAIL}      | ${"39"}    | ${false}
      ${VEHICLE_TYPES.PSV} | ${TEST_RESULT.ABANDONED} | ${"39"}    | ${false}
    `(
      "for a $vehicleType with testResult $testResult and testTypeId $testTypeId it should generate a certificate: $shouldSetCertificateNumber",
      ({ vehicleType, testResult, testTypeId, shouldSetCertificateNumber }) => {
        baseTestResult.vehicleType = vehicleType;
        baseTestResult.testTypes[0].testResult = testResult;
        baseTestResult.testTypes[0].testTypeId = testTypeId;

        expect.assertions(2);
        // @ts-ignore
        const updatedResult = VehicleTestController.AssignCertificateNumberToTestTypes(
          baseTestResult
        );
        expect(updatedResult.testTypes[0].certificateNumber === null).not.toBe(
          shouldSetCertificateNumber
        );
        expect(
          updatedResult.testTypes[0].certificateNumber === "W01A00209"
        ).toBe(shouldSetCertificateNumber);
      }
    );
  });
});
