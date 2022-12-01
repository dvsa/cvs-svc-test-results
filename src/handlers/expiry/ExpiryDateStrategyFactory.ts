import { VEHICLE_TYPE, ERRORS, EXPIRY_STRATEGY } from '../../assets/Enums';
import expiryMapping from '../../assets/strategy-mapping.json';
import { DateProvider } from './providers/DateProvider';
import { IExpiryDateStrategy } from './IExpiryDateStrategy';
import { TestTypeForExpiry } from '../../models/TestTypeforExpiry';
import { NoImplementationStrategy } from './strategies/NoImplementationStrategy';
import { PsvDefaultExpiryStrategy } from './strategies/PsvDefaultExpiryStrategy';
import { PsvMostRecentExpiryStrategy } from './strategies/PsvMostRecentExpiryStrategy';
import { PsvRegistrationAnniversaryStrategy } from './strategies/PsvRegistrationAnniversaryStrategy';
import { HgvTrlAnnualTestStrategy } from './strategies/HgvTrlAnnualTestStrategy';
import { HgvTrlMostRecentExpiryStrategy } from './strategies/HgvTrlMostRecentExpiryStrategy';
import { HgvTrlFirstTestStrategy } from './strategies/HgvTrlFirstTestStrategy';

export interface ExpiryConfig {
  isHistoryRequired: boolean;
  isRegistrationRequired: boolean;
  testTypes: string[];
  strategy: string;
}

export class ExpiryDateStrategyFactory {
  public static GetExpiryStrategy(
    testTypeForExpiry: TestTypeForExpiry,
    dateProvider: DateProvider,
  ): IExpiryDateStrategy {
    let strategiesFound = 0;
    let selectedStrategy: IExpiryDateStrategy = new NoImplementationStrategy(
      testTypeForExpiry,
      dateProvider,
    );
    const vehicleConfig = ExpiryDateStrategyFactory.getStrategyMapping(
      testTypeForExpiry.vehicleType,
      expiryMapping,
    );
    vehicleConfig.forEach((config) => {
      const { hasRegistration, hasHistory } = testTypeForExpiry;
      const { isHistoryRequired, isRegistrationRequired, strategy } = config;
      if (
        this.isEqualOrNull(hasHistory, isHistoryRequired) &&
        this.isEqualOrNull(hasRegistration, isRegistrationRequired) &&
        config.testTypes.includes(testTypeForExpiry.testType.testTypeId)
      ) {
        selectedStrategy = this.createStrategy(
          strategy,
          testTypeForExpiry,
          dateProvider,
        );
        strategiesFound++;
      }
    });
    if (strategiesFound > 1) {
      throw new Error('Multiple strategies found!');
    }
    return selectedStrategy;
  }

  private static isEqualOrNull(input: boolean, config: boolean): boolean {
    // if input or config does not exist then don't compare
    if (config === null) {
      return true;
    }
    return input === config;
  }

  private static createStrategy(
    strategy: string,
    testTypeForExpiry: TestTypeForExpiry,
    dateProvider: DateProvider,
  ): IExpiryDateStrategy {
    switch (strategy) {
      case EXPIRY_STRATEGY.PSV_DEFAULT:
        return new PsvDefaultExpiryStrategy(testTypeForExpiry, dateProvider);
      case EXPIRY_STRATEGY.PSV_MOST_RECENT:
        return new PsvMostRecentExpiryStrategy(testTypeForExpiry, dateProvider);
      case EXPIRY_STRATEGY.PSV_REGN_ANNIVERSARY:
        return new PsvRegistrationAnniversaryStrategy(
          testTypeForExpiry,
          dateProvider,
        );
      case EXPIRY_STRATEGY.HGV_TRL_FIRST_TEST:
        return new HgvTrlFirstTestStrategy(testTypeForExpiry, dateProvider);
      case EXPIRY_STRATEGY.HGV_TRL_ANNUAL_TEST:
        return new HgvTrlAnnualTestStrategy(testTypeForExpiry, dateProvider);
      case EXPIRY_STRATEGY.HGV_TRL_MOST_RECENT:
        return new HgvTrlMostRecentExpiryStrategy(
          testTypeForExpiry,
          dateProvider,
        );
      default:
        return new NoImplementationStrategy(testTypeForExpiry, dateProvider);
    }
  }

  private static getStrategyMapping(
    vehicleType: VEHICLE_TYPE,
    expiryConfig: any,
  ) {
    const vehicleConfig = expiryConfig[vehicleType] as ExpiryConfig[];

    if (!(vehicleConfig && vehicleConfig.length)) {
      throw new Error(ERRORS.ExpiryConfigMissing);
    }
    return vehicleConfig;
  }
}
