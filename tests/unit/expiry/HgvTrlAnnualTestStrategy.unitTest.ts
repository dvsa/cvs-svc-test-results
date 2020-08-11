import { cloneDeep } from "lodash";
import testResults from "../../resources/test-results.json";
import { DateProvider } from "../../../src/handlers/expiry/providers/DateProvider";
import { TestType } from "../../../src/models/ITestResult";
import { HgvTrlAnnualTestStrategy } from "../../../src/handlers/expiry/strategies/HgvTrlAnnualTestStrategy";
import { StrategyMock } from "../../util/expiryStrategyUtil";
import { VEHICLE_TYPES } from '../../../src/assets/Enums';

describe("HgvTrlAnnualTestStrategy", () => {
  let testResultsMockDB: any;
  let hgvTrlAnnualTestStrategy: HgvTrlAnnualTestStrategy;

  beforeEach(() => {
    testResultsMockDB = cloneDeep(testResults);
  });

  afterEach(() => {
    // reset date to current date
    hgvTrlAnnualTestStrategy.dateProvider.setTestDate(new Date());
  });

  context("for hgv vehicle type", () => {
    describe("with invalid registration date", () => {
      it("should set the Expiry last day of month + 1 year of testDate", () => {
        const hgvTestResult = cloneDeep(testResultsMockDB[4]);
        hgvTestResult.testTypes.forEach((type: TestType) => {
          type.testTypeId = "94";
        });
        hgvTestResult.vehicleType = VEHICLE_TYPES.HGV;
        hgvTestResult.regnDate = "2019-08";

        hgvTrlAnnualTestStrategy = StrategyMock.setupStrategy(hgvTestResult, 
                                                              DateProvider.getEpoc(),
                                                              new Date("2020-06-30"));

        const expectedExpiryDate = new Date("2021-06-30").toISOString();
        const actualExpiryDate = hgvTrlAnnualTestStrategy.getExpiryDate();
        expect.assertions(1);
        expect(actualExpiryDate).toEqual(expectedExpiryDate);
      });
    });
    describe("with missing registration date", () => {
      it("should set the Expiry last day of month + 1 year of testDate", () => {
        const hgvTestResult = cloneDeep(testResultsMockDB[4]);
        hgvTestResult.testTypes.forEach((type: TestType) => {
          type.testTypeId = "94";
        });
        hgvTestResult.vehicleType = VEHICLE_TYPES.HGV;
        delete hgvTestResult.regnDate;

        hgvTrlAnnualTestStrategy = StrategyMock.setupStrategy(hgvTestResult,
                                                              DateProvider.getEpoc(),
                                                              new Date("2020-06-30"));

        const expectedExpiryDate = new Date("2021-06-30").toISOString();
        const actualExpiryDate = hgvTrlAnnualTestStrategy.getExpiryDate();
        expect.assertions(1);
        expect(actualExpiryDate).toEqual(expectedExpiryDate);
      });
    });

    describe("with valid registration date", () => {
      describe("with a registration anniversary which is 1 before 2 months of test date", () => {
        it("should set the Expiry last day of month + 1 year of registration anniversary", () => {
          const hgvTestResult = cloneDeep(testResultsMockDB[4]);
          hgvTestResult.testTypes.forEach((type: TestType) => {
            type.testTypeId = "94";
          });
          hgvTestResult.vehicleType = VEHICLE_TYPES.HGV;
          hgvTestResult.regnDate = "2019-08-29";

          hgvTrlAnnualTestStrategy = StrategyMock.setupStrategy(hgvTestResult,
                                                                DateProvider.getEpoc(),
                                                                new Date("2020-07-01"));

          const expectedExpiryDate = new Date("2021-08-31").toISOString();
          const actualExpiryDate = hgvTrlAnnualTestStrategy.getExpiryDate();
          expect.assertions(1);
          expect(actualExpiryDate).toEqual(expectedExpiryDate);
        });
      });

      describe("with a registration anniversary which is exactly 2 months of test date", () => {
        it("should set the Expiry last day of month + 1 year of test date", () => {
          const hgvTestResult = cloneDeep(testResultsMockDB[4]);
          hgvTestResult.testTypes.forEach((type: TestType) => {
            type.testTypeId = "94";
          });
          hgvTestResult.vehicleType = VEHICLE_TYPES.HGV;
          hgvTestResult.regnDate = "2019-08-30";

          hgvTrlAnnualTestStrategy = StrategyMock.setupStrategy(hgvTestResult,
                                                                DateProvider.getEpoc(),
                                                                new Date("2020-06-30"));

          const expectedExpiryDate = new Date("2021-06-30").toISOString();
          const actualExpiryDate = hgvTrlAnnualTestStrategy.getExpiryDate();
          expect.assertions(1);
          expect(actualExpiryDate).toEqual(expectedExpiryDate);
        });
      });

      describe("with registration date on last day of Feb on leap year within 2 months of test date", () => {
        it("should set the Expiry last day of month + 1 year of regnAnniversary", () => {
          const hgvTestResult = cloneDeep(testResultsMockDB[4]);
          hgvTestResult.testTypes.forEach((type: TestType) => {
            type.testTypeId = "94";
          });
          hgvTestResult.vehicleType = VEHICLE_TYPES.HGV;
          hgvTestResult.regnDate = "2020-02-29";

          hgvTrlAnnualTestStrategy = StrategyMock.setupStrategy(hgvTestResult,
                                                                DateProvider.getEpoc(),
                                                                new Date("2021-01-01"));

          const expectedExpiryDate = new Date("2022-02-28").toISOString();
          const actualExpiryDate = hgvTrlAnnualTestStrategy.getExpiryDate();
          expect.assertions(1);
          expect(actualExpiryDate).toEqual(expectedExpiryDate);
        });
      });

      describe("with registration anniversary same  as test date", () => {
        it("should set the Expiry last day of month + 1 year of regnAnniversary", () => {
          const hgvTestResult = cloneDeep(testResultsMockDB[4]);
          hgvTestResult.testTypes.forEach((type: TestType) => {
            type.testTypeId = "94";
          });
          hgvTestResult.vehicleType = VEHICLE_TYPES.HGV;
          hgvTestResult.regnDate = "2019-03-10";

          hgvTrlAnnualTestStrategy = StrategyMock.setupStrategy(hgvTestResult,
                                                                DateProvider.getEpoc(),
                                                                new Date("2020-03-10"));

          const expectedExpiryDate = new Date("2021-03-31").toISOString();
          const actualExpiryDate = hgvTrlAnnualTestStrategy.getExpiryDate();
          expect.assertions(1);
          expect(actualExpiryDate).toEqual(expectedExpiryDate);
        });
      });
    });
  });
});
