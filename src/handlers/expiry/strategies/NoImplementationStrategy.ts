import { IExpiryDateStrategy } from "../IExpiryDateStrategy";
import { TestTypeForExpiry } from "../../../models/TestTypeforExpiry";
import { DateProvider } from "../providers/DateProvider";

export class NoImplementationStrategy implements IExpiryDateStrategy {

  constructor(public testTypeForExpiry: TestTypeForExpiry, public dateProvider: DateProvider) {}

  public getExpiryDate(): string {
    throw new Error("Method not implemented.");
  }
}
