import { cloneDeep } from 'lodash';
import testResults from '../../resources/test-results.json';
import { HgvTrlFirstTestStrategy } from '../../../src/handlers/expiry/strategies/HgvTrlFirstTestStrategy';
import { DateProvider } from '../../../src/handlers/expiry/providers/DateProvider';
import { TestType } from '../../../src/models/ITestResult';
import { StrategyMock } from '../../util/expiryStrategyUtil';
import { VEHICLE_TYPES } from '../../../src/assets/Enums';

describe('HgvTrlFirstTestStrategy', () => {
  let testResultsMockDB: any;
  let hgvTrlFirstTestStrategy: HgvTrlFirstTestStrategy;

  beforeEach(() => {
    testResultsMockDB = cloneDeep(testResults);
  });

  afterEach(() => {
    // reset date to current date
    hgvTrlFirstTestStrategy.dateProvider.setTestDate(new Date());
  });

  context('for hgv vehicle type', () => {
    describe('with valid registration date', () => {
      describe('test HgvTrlFirstTestStrategy with multiple scenarios', () => {
        test.each`
          inputRegistrationDate | inputTestDate   | ExpectedExpiryDate
          ${'2019-08-06'}       | ${'2020-06-30'} | ${'2021-06-30'}
          ${'2019-08-30'}       | ${'2020-07-01'} | ${'2021-08-31'}
          ${'2018-12-05'}       | ${'2020-02-29'} | ${'2021-02-28'}
          ${'2019-02-05'}       | ${'2020-02-29'} | ${'2021-02-28'}
          ${'2019-03-05'}       | ${'2020-03-29'} | ${'2021-03-31'}
          ${'2020-02-29'}       | ${'2021-02-15'} | ${'2022-02-28'}
          ${'2020-02-29'}       | ${'2021-02-28'} | ${'2022-02-28'}
          ${'2020-02-29'}       | ${'2021-03-15'} | ${'2022-03-31'}
          ${'2022-02-05'}       | ${'2023-01-15'} | ${'2024-02-29'}
          ${'2022-02-05'}       | ${'2023-02-28'} | ${'2024-02-29'}
          ${'2022-02-05'}       | ${'2023-03-15'} | ${'2024-03-31'}
          ${'2018-07-31'}       | ${'2020-11-05'} | ${'2021-11-30'}
          ${'2019'}             | ${'2020-05-30'} | ${'2021-05-31'}
          ${undefined}          | ${'2020-05-30'} | ${'2021-05-31'}
        `(
          'The expiry Date $ExpectedExpiryDate is calculated given a test date of $inputTestDate and a registration date of $inputRegistrationDate',
          ({ inputRegistrationDate, inputTestDate, ExpectedExpiryDate }) => {
            const hgvTestResult = cloneDeep(testResultsMockDB[4]);
            hgvTestResult.testTypes.forEach((type: TestType) => {
              type.testTypeId = '64';
            });
            hgvTestResult.vehicleType = VEHICLE_TYPES.HGV;
            hgvTestResult.regnDate = inputRegistrationDate;

            hgvTrlFirstTestStrategy = StrategyMock.setupStrategy(
              hgvTestResult,
              DateProvider.getEpoc(),
              new Date(inputTestDate),
            );

            expect(hgvTrlFirstTestStrategy.getExpiryDate()).toEqual(
              new Date(ExpectedExpiryDate).toISOString(),
            );
          },
        );
      });
    });
  });
});
