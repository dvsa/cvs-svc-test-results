import { IExpiryDateStrategy } from "./expiry/IExpiryDateStrategy";
import { TestTypeForExpiry } from "../models/TestTypeforExpiry";

export interface IVehicleTestController {
    getExpiryStrategy(testType: TestTypeForExpiry): IExpiryDateStrategy;
}
