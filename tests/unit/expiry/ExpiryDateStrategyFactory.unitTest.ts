import { cloneDeep } from 'lodash';
import emptyConfig from '../../resources/empty.json';
import invalidConfig from '../../resources/invalid-mapping.json';
import duplicatedConfig from '../../resources/duplicated-mapping.json';
import strategyMapping from '../../../src/assets/strategy-mapping.json';
import { VEHICLE_TYPE, ERRORS } from '../../../src/assets/Enums';
import { ExpiryDateStrategyFactory } from '../../../src/handlers/expiry/ExpiryDateStrategyFactory';
import { TestTypeForExpiry } from '../../../src/models/TestTypeforExpiry';
import { TestType } from '../../../src/models/ITestResult';
import { DateProvider } from '../../../src/handlers/expiry/providers/DateProvider';
import { PsvMostRecentExpiryStrategy } from '../../../src/handlers/expiry/strategies/PsvMostRecentExpiryStrategy';
import { PsvRegistrationAnniversaryStrategy } from '../../../src/handlers/expiry/strategies/PsvRegistrationAnniversaryStrategy';
import { PsvDefaultExpiryStrategy } from '../../../src/handlers/expiry/strategies/PsvDefaultExpiryStrategy';
import { NoImplementationStrategy } from '../../../src/handlers/expiry/strategies/NoImplementationStrategy';
import { HgvTrlFirstTestStrategy } from '../../../src/handlers/expiry/strategies/HgvTrlFirstTestStrategy';
import { HgvTrlAnnualTestStrategy } from '../../../src/handlers/expiry/strategies/HgvTrlAnnualTestStrategy';
import { HgvTrlMostRecentExpiryStrategy } from '../../../src/handlers/expiry/strategies/HgvTrlMostRecentExpiryStrategy';

describe('ExpiryDateStrategyFactory', () => {
  let strategyConfig: any;
  // let expiryDateStrategyFactory: ExpiryDateStrategyFactory;

  beforeEach(() => {
    strategyConfig = cloneDeep(strategyMapping);
    jest.restoreAllMocks();
  });

  context('for invalid strategy mapping', () => {
    describe('when strategy mapping is empty', () => {
      it('should throw error', () => {
        expect.assertions(1);
        try {
          //  @ts-ignore
          ExpiryDateStrategyFactory.getStrategyMapping(
            VEHICLE_TYPE.HGV,
            emptyConfig,
          );
        } catch (error) {
          expect(error).toEqual(new Error(ERRORS.ExpiryConfigMissing));
        }
      });
    });
    describe('when strategy mapping has missing vehicle', () => {
      expect.assertions(1);
      it('should throw error', () => {
        try {
          //  @ts-ignore
          ExpiryDateStrategyFactory.getStrategyMapping(
            VEHICLE_TYPE.HGV,
            invalidConfig,
          );
        } catch (error) {
          expect(error).toEqual(new Error(ERRORS.ExpiryConfigMissing));
        }
      });
    });

    describe('when valid test type id is passed and more than one strategy is returned', () => {
      it('should throw an appropriate error', () => {
        expect.assertions(1);
        try {
          //  @ts-ignore
          // prettier-ignore
          jest.spyOn(ExpiryDateStrategyFactory, 'getStrategyMapping')
            .mockReturnValue(duplicatedConfig.psv);

          const testTypeForExpiry: TestTypeForExpiry = {
            testType: { testTypeId: '3' } as TestType,
            vehicleType: VEHICLE_TYPE.PSV,
            recentExpiry: new Date(0),
            hasHistory: true,
            hasRegistration: true,
          };
          ExpiryDateStrategyFactory.GetExpiryStrategy(
            testTypeForExpiry,
            new DateProvider(),
          );
        } catch (error) {
          expect(error).toEqual(new Error('Multiple strategies found!'));
        }
      });
    });

    describe('Resolving correct strategies', () => {
      test.each`
        hasHistory | hasRegistration | testTypeId | vehicleType         | expectedStrategy
        ${true}    | ${false}        | ${'3'}     | ${VEHICLE_TYPE.PSV} | ${PsvMostRecentExpiryStrategy}
        ${true}    | ${true}         | ${'3'}     | ${VEHICLE_TYPE.PSV} | ${PsvMostRecentExpiryStrategy}
        ${false}   | ${true}         | ${'3'}     | ${VEHICLE_TYPE.PSV} | ${PsvRegistrationAnniversaryStrategy}
        ${false}   | ${false}        | ${'3'}     | ${VEHICLE_TYPE.PSV} | ${PsvDefaultExpiryStrategy}
        ${true}    | ${false}        | ${'100'}   | ${VEHICLE_TYPE.HGV} | ${NoImplementationStrategy}
        ${true}    | ${false}        | ${'100'}   | ${VEHICLE_TYPE.TRL} | ${NoImplementationStrategy}
        ${true}    | ${true}         | ${'146'}   | ${VEHICLE_TYPE.PSV} | ${PsvDefaultExpiryStrategy}
        ${true}    | ${false}        | ${'146'}   | ${VEHICLE_TYPE.PSV} | ${PsvDefaultExpiryStrategy}
        ${false}   | ${true}         | ${'146'}   | ${VEHICLE_TYPE.PSV} | ${PsvDefaultExpiryStrategy}
        ${false}   | ${false}        | ${'146'}   | ${VEHICLE_TYPE.PSV} | ${PsvDefaultExpiryStrategy}
        ${false}   | ${true}         | ${'64'}    | ${VEHICLE_TYPE.HGV} | ${HgvTrlFirstTestStrategy}
        ${false}   | ${false}        | ${'64'}    | ${VEHICLE_TYPE.HGV} | ${HgvTrlFirstTestStrategy}
        ${false}   | ${true}         | ${'54'}    | ${VEHICLE_TYPE.TRL} | ${HgvTrlAnnualTestStrategy}
        ${false}   | ${false}        | ${'54'}    | ${VEHICLE_TYPE.TRL} | ${HgvTrlAnnualTestStrategy}
        ${false}   | ${true}         | ${'54'}    | ${VEHICLE_TYPE.HGV} | ${HgvTrlAnnualTestStrategy}
        ${false}   | ${false}        | ${'54'}    | ${VEHICLE_TYPE.HGV} | ${HgvTrlAnnualTestStrategy}
        ${true}    | ${true}         | ${'54'}    | ${VEHICLE_TYPE.HGV} | ${HgvTrlMostRecentExpiryStrategy}
        ${true}    | ${false}        | ${'54'}    | ${VEHICLE_TYPE.HGV} | ${HgvTrlMostRecentExpiryStrategy}
        ${false}   | ${false}        | ${'65'}    | ${VEHICLE_TYPE.TRL} | ${HgvTrlFirstTestStrategy}
        ${false}   | ${true}         | ${'65'}    | ${VEHICLE_TYPE.TRL} | ${HgvTrlFirstTestStrategy}
        ${true}    | ${true}         | ${'65'}    | ${VEHICLE_TYPE.TRL} | ${HgvTrlMostRecentExpiryStrategy}
        ${true}    | ${false}        | ${'65'}    | ${VEHICLE_TYPE.TRL} | ${HgvTrlMostRecentExpiryStrategy}
        ${false}   | ${false}        | ${'199'}   | ${VEHICLE_TYPE.TRL} | ${HgvTrlFirstTestStrategy}
        ${false}   | ${true}         | ${'199'}   | ${VEHICLE_TYPE.TRL} | ${HgvTrlFirstTestStrategy}
        ${true}    | ${true}         | ${'199'}   | ${VEHICLE_TYPE.TRL} | ${HgvTrlMostRecentExpiryStrategy}
        ${true}    | ${false}        | ${'199'}   | ${VEHICLE_TYPE.TRL} | ${HgvTrlMostRecentExpiryStrategy}
      `(
        'for a $vehicleType with hasHistory $hasHistory, hasRegistration $hasRegistration and testTypeId $testTypeId it should return $expectedStrategy',
        ({
          hasHistory,
          hasRegistration,
          testTypeId,
          vehicleType,
          expectedStrategy,
        }) => {
          expect.assertions(1);
          const testTypeForExpiry: TestTypeForExpiry = {
            testType: { testTypeId } as TestType,
            vehicleType,
            recentExpiry: new Date(0),
            hasHistory,
            hasRegistration,
          };
          const resolvedStrategy = ExpiryDateStrategyFactory.GetExpiryStrategy(
            testTypeForExpiry,
            new DateProvider(),
          );
          expect(resolvedStrategy).toBeInstanceOf(expectedStrategy);
        },
      );
    });
  });
});
