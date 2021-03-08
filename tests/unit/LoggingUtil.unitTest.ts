import { LoggingUtil } from "../../src/utils/LoggingUtil";
import testResults from "../resources/test-results.json";
import { cloneDeep } from "lodash";
import { TEST_STATUS, TEST_RESULT } from "../../src/assets/Enums";

describe("Defects logging util", () => {
  let testResult: any;
  const consoleSpy = jest.spyOn(global.console, "info");

  beforeEach(() => {
    testResult = cloneDeep(testResults[1]);
    jest.resetAllMocks();
  });

  context("Having defects or advisories valid for logging", () => {
    it("should log when the defects are valid", async () => {
      testResult.testTypes[0].defects[0].deficiencyRef = "8.1.i";

      const expectedLogObject = {
        vin: testResult.vin,
        vrm: testResult.vrm,
        additionalNotesRecorded:
          testResult.testTypes[0].additionalNotesRecorded,
        deficiencyRef: testResult.testTypes[0].defects[0].deficiencyRef,
        deficiencyCategory:
          testResult.testTypes[0].defects[0].deficiencyCategory,
        defectNotes:
          testResult.testTypes[0].defects[0].additionalInformation.notes,
        ...testResult.testTypes[0].defects[0].additionalInformation.location,
      };

      LoggingUtil.logDefectsReporting(testResult);

      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Defects reporting: ",
        expectedLogObject
      );
    });

    it("should not log when the defects are valid but the test-result is cancelled", async () => {
      testResult.testTypes[0].defects[0].deficiencyRef = "8.1.i";
      testResult.testStatus = TEST_STATUS.CANCELLED;

      LoggingUtil.logDefectsReporting(testResult);

      expect(consoleSpy).toBeCalledTimes(0);
    });

    it("should not log when the defects are valid but the testType is abandoned", async () => {
      testResult.testTypes[0].defects[0].deficiencyRef = "8.1.i";
      testResult.testTypes[0].testResult = TEST_RESULT.ABANDONED;

      LoggingUtil.logDefectsReporting(testResult);

      expect(consoleSpy).toBeCalledTimes(0);
    });
  });

  context("when there are no defects or deficiencies to be logged", () => {
    it("should not call console.log when there are no valid defects", () => {
      LoggingUtil.logDefectsReporting(testResult);

      expect(consoleSpy).toBeCalledTimes(0);
    });

    it("should not call console.log when defects array is empty", () => {
      testResult.testTypes[0].defects = [];

      LoggingUtil.logDefectsReporting(testResult);

      expect(consoleSpy).toBeCalledTimes(0);
    });
  });
});
