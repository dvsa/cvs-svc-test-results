import { TEST_STATUS, TEST_RESULT } from '../assets/Enums';
import { Defect, TestType } from '../models/ITestResult';
import { ITestResultPayload } from '../models/ITestResultPayload';

export class LoggingUtil {
  private static readonly reportingDeficiencyRef = [
    '8.1.i',
    '8.1.j.i',
    '8.1.j.ii',
    '8.1',
    '8.2',
  ];

  /**
   * Function to log certain defects and advisory silently
   *
   * To be removed with CVSB-19020
   */
  public static logDefectsReporting(testResult: ITestResultPayload): void {
    if (testResult.testStatus === TEST_STATUS.CANCELLED) {
      return;
    }

    testResult.testTypes.forEach((testType: TestType) => {
      if (testType.testResult !== TEST_RESULT.ABANDONED) {
        testType.defects.forEach((defect: Defect) => {
          if (
            LoggingUtil.reportingDeficiencyRef.includes(defect.deficiencyRef)
          ) {
            const logObject = {
              vin: testResult.vin,
              vrm: testResult.vrm,
              additionalNotesRecorded: testType.additionalNotesRecorded,
              deficiencyRef: defect.deficiencyRef,
              deficiencyCategory: defect.deficiencyCategory,
              defectNotes: defect?.additionalInformation?.notes,
              ...defect?.additionalInformation?.location,
            };
            console.info('Defects reporting: ', logObject);
          }
        });
      }
    });
  }
}
