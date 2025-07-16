import { cloneDeep } from 'lodash';
import { TestResultTestTypeSchema } from '@dvsa/cvs-type-definitions/types/v1/test-result-test-type';

import { TestResults } from '@dvsa/cvs-type-definitions/types/v1/enums/testResult.enum';
import testResults from '../../resources/test-results.json';
import { PsvDefaultExpiryStrategy } from '../../../src/handlers/expiry/strategies/PsvDefaultExpiryStrategy';
import { StrategyMock } from '../../util/expiryStrategyUtil';

describe('For PsvRegistrationAnniversaryStrategy', () => {
  let testResultsMockDB: any;
  let psvDefaultExpiryStrategy: PsvDefaultExpiryStrategy;

  beforeEach(() => {
    testResultsMockDB = cloneDeep(testResults);
  });

  afterEach(() => {
    // reset date to current date
    psvDefaultExpiryStrategy.dateProvider.setTestDate(new Date());
  });

  context('for psv vehicle type', () => {
    describe('test psvDefaultExpiryStrategy with multiple scenarios', () => {
      test.each`
        inputRecentExpiryDate | inputTestDate   | ExpectedExpiryDate
        ${undefined}          | ${'2019-11-04'} | ${'2020-11-03'}
      `(
        'The expiry Date $ExpectedExpiryDate is calculated given a test date of $inputTestDate and a recent expiry date of $inputRecentExpiryDate',
        ({ inputRecentExpiryDate, inputTestDate, ExpectedExpiryDate }) => {
          const psvTestResult = cloneDeep(testResultsMockDB[4]);
          psvTestResult.testTypes.forEach((type: TestResultTestTypeSchema) => {
            type.testTypeId = '142';
            type.testResult = TestResults.PASS;
          });
          psvTestResult.regnDate = undefined;
          psvDefaultExpiryStrategy = StrategyMock.setupStrategy(
            psvTestResult,
            inputRecentExpiryDate,
            new Date(inputTestDate),
          );

          expect(psvDefaultExpiryStrategy.getExpiryDate()).toEqual(
            new Date(ExpectedExpiryDate).toISOString(),
          );
        },
      );
    });
  });
});
