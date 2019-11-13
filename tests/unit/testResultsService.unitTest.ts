import {TestResultsService} from "../../src/services/TestResultsService";
import {TEST_RESULT, TEST_STATUS, TEST_TYPE_CLASSIFICATION} from "../../src/assets/Enums";
import {cloneDeep} from "lodash";

describe("Test Results Service", () => {
  describe("generateCertificateNumber", () => {
    describe("with LEC test type", () => {
      describe("with TestTypeClassification = 'Annual with Certificate' and testResult not abandoned", () => {
        it("sets the certificateNumber to the testNumber", () => {
          // @ts-ignore
          const srv = new TestResultsService(null);

          const myPayload = {
            testStatus: TEST_STATUS.SUBMITTED,
            testTypes: [
              {
                testTypeId: "39", // an LEC test type
                testTypeClassification: TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE,
                testResult: TEST_RESULT.PASS,
                testNumber: "abc123"
              }
            ]
          };
          const output = srv.generateCertificateNumber(myPayload);
          expect(output.testTypes[0].certificateNumber).toEqual("abc123");
        });
      });
    });
    describe("with ADR test type", () => {
      describe("with TestTypeClassification = 'Annual with Certificate' and testResult not abandoned", () => {
        it("DOES NOT overwrite the certificateNumber", () => {
          // @ts-ignore
          const srv = new TestResultsService(null);

          const myPayload = {
            testStatus: TEST_STATUS.SUBMITTED,
            testTypes: [
              {
                testTypeId: "50", // an ADR test type
                testTypeClassification: TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE,
                testResult: TEST_RESULT.PASS,
                testNumber: "abc123",
                certificateNumber: "originalCertNumber"
              }
            ]
          };
          const output = srv.generateCertificateNumber(myPayload);
          expect(output.testTypes[0].certificateNumber).toEqual("originalCertNumber");
        });
      });
    });
  });
});
