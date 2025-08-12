import { cloneDeep } from 'lodash';
import { TestResultTestTypeSchema } from '@dvsa/cvs-type-definitions/types/v1/test-result-test-type';
import { TestResults } from '@dvsa/cvs-type-definitions/types/v1/enums/testResult.enum';
import testResults from '../../resources/test-results.json';
import { DateProvider } from '../../../src/handlers/expiry/providers/DateProvider';
import { PsvRegistrationAnniversaryStrategy } from '../../../src/handlers/expiry/strategies/PsvRegistrationAnniversaryStrategy';
import { StrategyMock } from '../../util/expiryStrategyUtil';

describe('For PsvRegistrationAnniversaryStrategy', () => {
  let testResultsMockDB: any;
  let psvRegistrationAnniversaryStrategy: PsvRegistrationAnniversaryStrategy;

  beforeEach(() => {
    testResultsMockDB = cloneDeep(testResults);
  });

  afterEach(() => {
    // reset date to current date
    psvRegistrationAnniversaryStrategy.dateProvider.setTestDate(new Date());
  });

  context('for psv vehicle type', () => {
    describe('test psvRegistrationAnniversaryStrategy with multiple scenarios', () => {
      test.each`
        inputRegistrationDate | inputTestDate   | ExpectedExpiryDate
        ${'2019-07-28'}       | ${'2020-05-28'} | ${'2021-05-27'}
        ${'2019-07-28'}       | ${'2020-05-29'} | ${'2021-07-28'}
        ${'2019-02-05'}       | ${'2020-02-29'} | ${'2021-02-28'}
        ${'2019-02-05'}       | ${'2020-03-01'} | ${'2021-02-28'}
        ${'2018-05-01'}       | ${'2020-11-05'} | ${'2021-11-04'}
        ${'2019-12-02'}       | ${'2020-10-05'} | ${'2021-12-02'}
        ${'2019'}             | ${'2020-06-28'} | ${'2021-06-27'}
        ${undefined}          | ${'2020-03-06'} | ${'2021-03-05'}
      `(
        'The expiry Date $ExpectedExpiryDate is calculated given a test date of $inputTestDate and a registration date of $inputRegistrationDate',
        ({ inputRegistrationDate, inputTestDate, ExpectedExpiryDate }) => {
          const psvTestResult = cloneDeep(testResultsMockDB[4]);
          psvTestResult.testTypes.forEach((type: TestResultTestTypeSchema) => {
            type.testTypeId = '1';
            type.testResult = TestResults.PASS;
          });
          psvTestResult.regnDate = inputRegistrationDate;
          psvRegistrationAnniversaryStrategy = StrategyMock.setupStrategy(
            psvTestResult,
            DateProvider.getEpoc(),
            new Date(inputTestDate),
          );

          expect(psvRegistrationAnniversaryStrategy.getExpiryDate()).toEqual(
            new Date(ExpectedExpiryDate).toISOString(),
          );
        },
      );
    });
  });
});
