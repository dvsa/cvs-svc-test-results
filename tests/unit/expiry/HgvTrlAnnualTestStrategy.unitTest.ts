import { cloneDeep } from 'lodash';
import testResults from '../../resources/test-results.json';
import { DateProvider } from '../../../src/handlers/expiry/providers/DateProvider';
import { TestType } from '../../../src/models/ITestResult';
import { HgvTrlAnnualTestStrategy } from '../../../src/handlers/expiry/strategies/HgvTrlAnnualTestStrategy';
import { StrategyMock } from '../../util/expiryStrategyUtil';
import { VEHICLE_TYPES } from '../../../src/assets/Enums';

describe('HgvTrlAnnualTestStrategy', () => {
  let testResultsMockDB: any;
  let hgvTrlAnnualTestStrategy: HgvTrlAnnualTestStrategy;

  beforeEach(() => {
    testResultsMockDB = cloneDeep(testResults);
  });

  afterEach(() => {
    // reset date to current date
    hgvTrlAnnualTestStrategy.dateProvider.setTestDate(new Date());
  });

  context('for hgv vehicle type', () => {
    describe('test hgvTrlAnnualTestStrategy with multiple scenarios', () => {
      test.each`
        inputRegistrationDate | inputTestDate   | ExpectedExpiryDate
        ${'2018-07-31'}       | ${'2020-11-05'} | ${'2021-11-30'}
        ${'2019-08-29'}       | ${'2020-07-01'} | ${'2021-08-31'}
        ${'2019-08-30'}       | ${'2020-06-30'} | ${'2021-06-30'}
        ${'2020-02-29'}       | ${'2021-01-01'} | ${'2022-02-28'}
        ${'2020-02-29'}       | ${'2020-03-10'} | ${'2021-03-31'}
        ${'2019-06'}          | ${'2020-05-30'} | ${'2021-05-31'}
        ${undefined}          | ${'2020-05-30'} | ${'2021-05-31'}
      `(
        'The expiry Date $ExpectedExpiryDate is calculated given a test date of $inputTestDate and a registration date of $inputRegistrationDate',
        ({ inputRegistrationDate, inputTestDate, ExpectedExpiryDate }) => {
          const hgvTestResult = cloneDeep(testResultsMockDB[4]);
          hgvTestResult.testTypes.forEach((type: TestType) => {
            type.testTypeId = '94';
          });
          hgvTestResult.vehicleType = VEHICLE_TYPES.HGV;
          hgvTestResult.regnDate = inputRegistrationDate;

          hgvTrlAnnualTestStrategy = StrategyMock.setupStrategy(
            hgvTestResult,
            DateProvider.getEpoc(),
            new Date(inputTestDate),
          );

          expect(hgvTrlAnnualTestStrategy.getExpiryDate()).toEqual(
            new Date(ExpectedExpiryDate).toISOString(),
          );
        },
      );
    });
  });
});
