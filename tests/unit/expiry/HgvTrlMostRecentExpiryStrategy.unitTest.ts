import { cloneDeep } from 'lodash';
import testResults from '../../resources/test-results.json';
import { TestType } from '../../../src/models/ITestResult';
import { HgvTrlMostRecentExpiryStrategy } from '../../../src/handlers/expiry/strategies/HgvTrlMostRecentExpiryStrategy';
import { StrategyMock } from '../../util/expiryStrategyUtil';
import { VEHICLE_TYPES } from '../../../src/assets/Enums';

describe('HgvTrlMostRecentExpiryStrategy', () => {
  let testResultsMockDB: any;
  let hgvTrlMostRecentExpiryStrategy: HgvTrlMostRecentExpiryStrategy;

  beforeEach(() => {
    testResultsMockDB = cloneDeep(testResults);
  });

  afterEach(() => {
    // reset date to current date
    hgvTrlMostRecentExpiryStrategy.dateProvider.setTestDate(new Date());
  });

  context('for hgv vehicle type', () => {
    describe('test hgvTrlMostRecentExpiryStrategy with multiple scenarios', () => {
      test.each`
        inputRecentExpiryDate | inputTestDate   | ExpectedExpiryDate
        ${'2020-07-01'}       | ${'2020-05-01'} | ${'2021-05-31'}
        ${'2020-05-01'}       | ${'2020-05-01'} | ${'2021-05-31'}
        ${'2020-02-29'}       | ${'2020-02-29'} | ${'2021-02-28'}
      `(
        'The expiry Date $ExpectedExpiryDate is calculated given a test date of $inputTestDate and a recent expiry date of $inputRecentExpiryDate',
        ({ inputRecentExpiryDate, inputTestDate, ExpectedExpiryDate }) => {
          const hgvTestResult = cloneDeep(testResultsMockDB[4]);
          hgvTestResult.testTypes.forEach((type: TestType) => {
            type.testTypeId = '94';
          });
          hgvTestResult.vehicleType = VEHICLE_TYPES.HGV;

          hgvTrlMostRecentExpiryStrategy = StrategyMock.setupStrategy(
            hgvTestResult,
            inputRecentExpiryDate,
            new Date(inputTestDate),
          );

          expect(hgvTrlMostRecentExpiryStrategy.getExpiryDate()).toEqual(
            new Date(ExpectedExpiryDate).toISOString(),
          );
        },
      );
    });
  });
});
