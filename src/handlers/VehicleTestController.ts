import { IVehicleTestController } from "./IVehicleTestController";
import { IExpiryDateStrategy } from "./expiry/IExpiryDateStrategy";
import {
  ExpiryDateStrategyFactory
} from "./expiry/ExpiryDateStrategyFactory";
import { ITestDataProvider } from "./expiry/providers/ITestDataProvider";
import { TestTypeForExpiry } from "../models/TestTypeforExpiry";
import { Service } from "../models/injector/ServiceDecorator";
import { TestDataProvider } from "./expiry/providers/TestDataProvider";
import { DateProvider } from "./expiry/providers/DateProvider";

@Service()
export class VehicleTestController implements IVehicleTestController {

  constructor(public dataProvider: TestDataProvider, public dateProvider: DateProvider) {}

  /**
   * A factory method used to fetch a strategy for calculating expiry date based on a strategy mapping JSON file.
   * @param testTypeForExpiry an input object which is used to calculate expiry based on test type.
   */
  public getExpiryStrategy(testTestForExpiry: TestTypeForExpiry): IExpiryDateStrategy {
    const selectedStrategy = ExpiryDateStrategyFactory.GetExpiryStrategy(testTestForExpiry, this.dateProvider);
    return selectedStrategy;
  }
}
