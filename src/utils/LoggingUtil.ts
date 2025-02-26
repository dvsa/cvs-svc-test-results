import {
  TestResultSchema,
  TestTypeSchema,
} from '@dvsa/cvs-type-definitions/types/v1/test-result';
import { DefectDetailsSchema } from '@dvsa/cvs-type-definitions/types/v1/test';
import { TestStatus } from '@dvsa/cvs-type-definitions/types/v1/enums/testStatus.enum';
import { TestResults } from '@dvsa/cvs-type-definitions/types/v1/enums/testResult.enum';

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
  public static logDefectsReporting(testResult: TestResultSchema): void {
    if (testResult.testStatus === TestStatus.CANCELLED) {
      return;
    }

    testResult.testTypes.forEach((testType: TestTypeSchema) => {
      if (testType.testResult !== TestResults.ABANDONED) {
        testType.defects?.forEach((defect: DefectDetailsSchema) => {
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
