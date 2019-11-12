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
  describe("addMissingRequiredCertificateNumberOnLec", () => {
    describe("with LEC test type", () => {
      describe("with No certificateNumber field", () => {
        it("should modify the input to add a certificateNumber field", () => {
          // @ts-ignore
          const srv = new TestResultsService(null);

          const myPayload: any = {
            testStatus: TEST_STATUS.SUBMITTED,
            testTypes: [
              {
                testTypeId: "39", // an LEC test type
              }
            ]
          };
          const expectedToNotMatch = cloneDeep(myPayload);

          srv.addMissingRequiredCertificateNumberOnLec(myPayload);
          expect(myPayload).not.toEqual(expectedToNotMatch);
          expect(myPayload.testTypes[0].certificateNumber).toEqual("");
        });
      });
      describe("with existing certificateNumber field", () => {
        it("should NOT modify the input to add a certificateNumber field", () => {
          // @ts-ignore
          const srv = new TestResultsService(null);

          const myPayload = {
            testStatus: TEST_STATUS.SUBMITTED,
            testTypes: [
              {
                testTypeId: "39", // an LEC test type
                certificateNumber: "abc123"
              }
            ]
          };
          const expectedOutput = cloneDeep(myPayload);
          srv.addMissingRequiredCertificateNumberOnLec(myPayload);
          expect(myPayload).toEqual(expectedOutput);
        });
      });
    });
    describe("with non-LEC test type", () => {
      it("should NOT modify the input", () => {
        // @ts-ignore
        const srv = new TestResultsService(null);

        const myPayload = {
          testStatus: TEST_STATUS.SUBMITTED,
          testTypes: [
            {
              testTypeId: "11", // an non-LEC test type
              certificateNumber: "abc123"
            }
          ]
        };
        const expectedOutput = cloneDeep(myPayload);
        srv.addMissingRequiredCertificateNumberOnLec(myPayload);
        expect(expectedOutput).toEqual(myPayload);
      });
    });
  });
});
