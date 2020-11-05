import { DateProvider } from "../providers/DateProvider";
import { IExpiryDateStrategy } from "../IExpiryDateStrategy";
import { TestTypeForExpiry } from "../../../models/TestTypeforExpiry";

export class PsvMostRecentExpiryStrategy implements IExpiryDateStrategy {

  constructor(public testTypeForExpiry: TestTypeForExpiry, public dateProvider: DateProvider) {}

  public getExpiryDate(): string {
    const { recentExpiry } = this.testTypeForExpiry;
    const testDate = this.dateProvider.getTestDate();
    console.log(`recentExpiry: ${recentExpiry}`);
    console.log(`testDate: ${testDate}`);
    if (DateProvider.isBetweenTwoMonths(recentExpiry, testDate, "[)")) {
      return DateProvider.addOneYearISOString(recentExpiry);
    }
    return DateProvider.addOneYearMinusOneDayISOString(testDate);
  }
}
