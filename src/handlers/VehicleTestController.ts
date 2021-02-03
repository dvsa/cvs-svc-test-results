import * as enums from "../assets/Enums";
import { IVehicleTestController } from "./IVehicleTestController";
import { IExpiryDateStrategy } from "./expiry/IExpiryDateStrategy";
import {
  ExpiryDateStrategyFactory
} from "./expiry/ExpiryDateStrategyFactory";
import { TestTypeForExpiry } from "../models/TestTypeforExpiry";
import { Service } from "../models/injector/ServiceDecorator";
import { TestDataProvider } from "./expiry/providers/TestDataProvider";
import { DateProvider } from "./expiry/providers/DateProvider";
import { ValidationUtil } from "../utils";
import * as models from "../models";

@Service()
export class VehicleTestController implements IVehicleTestController {

  constructor(public dataProvider: TestDataProvider, public dateProvider: DateProvider) {}

  /**
   * To fetch test results by SystemNumber
   * @param filters test results filters for search
   */
  public async getTestResultBySystemNumber(filters: models.ITestResultFilters): Promise<models.ITestResult[]> {
    if (!filters.systemNumber || !ValidationUtil.validateGetTestResultFilters(filters)) {
       throw new models.HTTPError(400, enums.MESSAGES.BAD_REQUEST);
      }
    const result = await this.dataProvider.getTestResultBySystemNumber(filters);
    if (result.length === 0) {
       throw new models.HTTPError(404, enums.ERRORS.NoResourceMatch);
     }
    return result;
  }

  /**
   * To fetch test results by Tester Staff Id
   * @param filters test results filters for search
   */
  public async getTestResultByTestStaffId(filters: models.ITestResultFilters): Promise<models.ITestResult[]> {
    if (!filters.testerStaffId || !ValidationUtil.validateGetTestResultFilters(filters)) {
      throw new models.HTTPError(400, enums.MESSAGES.BAD_REQUEST);
      }
    const result = await this.dataProvider.getTestResultByTesterStaffId(filters);
    console.log("testResults inside controller:", result);
    if (result.length === 0) {
      throw new models.HTTPError(404, enums.ERRORS.NoResourceMatch);
       }
    return result;
  }

  /**
   * A factory method used to fetch a strategy for calculating expiry date based on a strategy mapping JSON file.
   * @param testTypeForExpiry an input object which is used to calculate expiry based on test type.
   */
  public getExpiryStrategy(testTestForExpiry: TestTypeForExpiry): IExpiryDateStrategy {
    const selectedStrategy = ExpiryDateStrategyFactory.GetExpiryStrategy(testTestForExpiry, this.dateProvider);
    return selectedStrategy;
  }
}
