import { VEHICLE_TYPE, VEHICLE_TYPES } from "../../src/assets/Enums";
import { ITestResultPayload } from "../../src/models/ITestResultPayload";
import { IExpiryDateStrategy } from "../../src/handlers/expiry/IExpiryDateStrategy";
import { ExpiryDateStrategyFactory } from "../../src/handlers/expiry/ExpiryDateStrategyFactory";
import { TestTypeForExpiry } from "../../src/models/TestTypeforExpiry";
import { DateProvider } from "../../src/handlers/expiry/providers/DateProvider";

export class StrategyMock {

    public static setupStrategy = (testResult: ITestResultPayload, recentExpiry: Date, testDate: Date): IExpiryDateStrategy => {

    const testType = testResult.testTypes[0];

    const { vehicleType } = testResult;

    const testTypeForExpiry: TestTypeForExpiry = {
      testType,
      vehicleType:
        VEHICLE_TYPE[
            vehicleType.toUpperCase() as keyof typeof VEHICLE_TYPE
        ],
      hasHistory: !DateProvider.isSameAsEpoc(recentExpiry),
      hasRegistration: DateProvider.isValidDate(StrategyMock.getRegnDateByVehicleType(testResult)),
      recentExpiry,
      regnDate: StrategyMock.getRegnDateByVehicleType(testResult)
    };
    const expiryDateStrategy = ExpiryDateStrategyFactory.GetExpiryStrategy(
      testTypeForExpiry,
      new DateProvider()
    );

    console.log(expiryDateStrategy.constructor.name);

    expiryDateStrategy.dateProvider.setTestDate(testDate);

    return expiryDateStrategy;
  }

  private static getRegnDateByVehicleType(payload: ITestResultPayload) {
    return payload.vehicleType === VEHICLE_TYPES.TRL ? payload.firstUseDate : payload.regnDate;
    }
}
