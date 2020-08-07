import { DateProvider } from "../providers/DateProvider";
import { IExpiryDateStrategy } from "../IExpiryDateStrategy";
import { TestTypeForExpiry } from "../../../models/TestTypeforExpiry";

export class PsvDefaultExpiryStrategy implements IExpiryDateStrategy {
  constructor(public testTypeForExpiry: TestTypeForExpiry, public dateProvider: DateProvider) {}

  public getExpiryDate(): string {
    return DateProvider.addOneYearMinusOneDayISOString(this.dateProvider.getTestDate());
  }
}
