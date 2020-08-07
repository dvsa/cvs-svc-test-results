import { cloneDeep } from "lodash";
import emptyConfig from "../../resources/empty.json";
import invalidConfig from "../../resources/invalid-mapping.json";
import strategyMapping from "../../../src/assets/strategy-mapping.json";
import { VEHICLE_TYPE, ERRORS } from "../../../src/assets/Enums";
import { ExpiryDateStrategyFactory } from "../../../src/handlers/expiry/ExpiryDateStrategyFactory";
import { TestTypeForExpiry } from "../../../src/models/TestTypeforExpiry";
import { TestType } from "../../../src/models/ITestResult";
import { DateProvider } from "../../../src/handlers/expiry/providers/DateProvider";

describe("ExpiryDateStrategyFactory", () => {
  let strategyConfig: any;
  // let expiryDateStrategyFactory: ExpiryDateStrategyFactory;

  beforeEach(() => {
    strategyConfig = cloneDeep(strategyMapping);
  });

  context("for invalid strategy mapping", () => {
    describe("when strategy mapping is empty", () => {
      it("should throw error", () => {
        try {
          //  @ts-ignore
          ExpiryDateStrategyFactory.getStrategyMapping(
            VEHICLE_TYPE.HGV,
            emptyConfig
          );
        } catch (error) {
          expect.assertions(1);
          expect(error).toEqual(new Error(ERRORS.ExpiryConfigMissing));
        }
      });
    });
    describe("when strategy mapping has missing vehicle", () => {
      it("should throw error", () => {
        try {
          //  @ts-ignore
          ExpiryDateStrategyFactory.getStrategyMapping(
            VEHICLE_TYPE.HGV,
            invalidConfig
          );
        } catch (error) {
          expect.assertions(1);
          expect(error).toEqual(new Error(ERRORS.ExpiryConfigMissing));
        }
      });
    });

    describe("when valid test type id is passed and more than one strategy is returned", () => {
      it("should throw error", () => {
        try {
          const testTypeForExpiry: TestTypeForExpiry = {
            testType: { testTypeId: "3" } as TestType,
            vehicleType: VEHICLE_TYPE.PSV,
            recentExpiry: new Date(0),
            hasHistory: true,
            hasRegistration: false
          };
          ExpiryDateStrategyFactory.GetExpiryStrategy(
            testTypeForExpiry,
            new DateProvider()
          );
        } catch (error) {
          expect.assertions(1);
          expect(error).toEqual(new Error("Multiple strategies found!"));
        }
      });
    });
  });
  context("for valid strategy mapping", () => {
    describe("when wrong test type id is passed", () => {
      it("should return error on getExpiryDate", () => {
        try {
          const testTypeForExpiry: TestTypeForExpiry = {
            testType: { testTypeId: "100" } as TestType,
            vehicleType: VEHICLE_TYPE.HGV,
            recentExpiry: new Date(0),
            hasHistory: true,
            hasRegistration: false
          };
          ExpiryDateStrategyFactory.GetExpiryStrategy(
            testTypeForExpiry,
            new DateProvider()
          ).getExpiryDate();
        } catch (error) {
          expect.assertions(1);
          expect(error).toEqual(new Error(ERRORS.MethodNotImplemented));
        }
      });
    });

    describe("when correct test type id is passed", () => {
      it("should return correct strategy", () => {
          const testTypeForExpiry: TestTypeForExpiry = {
            testType: { testTypeId: "3" } as TestType,
            vehicleType: VEHICLE_TYPE.PSV,
            recentExpiry: new Date(0),
            hasHistory: false,
            hasRegistration: false
          };
          const strategy = ExpiryDateStrategyFactory.GetExpiryStrategy(
            testTypeForExpiry,
            new DateProvider()
          );
          expect.assertions(1);
          expect(strategy.constructor.name).toEqual("PsvDefaultExpiryStrategy");
      });
    });
  });
});
