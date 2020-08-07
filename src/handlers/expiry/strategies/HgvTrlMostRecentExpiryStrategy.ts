import { DateProvider } from "../providers/DateProvider";
import { IExpiryDateStrategy } from "../IExpiryDateStrategy";
import { TestTypeForExpiry } from "../../../models/TestTypeforExpiry";

export class HgvTrlMostRecentExpiryStrategy implements IExpiryDateStrategy {
  constructor(public testTypeForExpiry: TestTypeForExpiry, public dateProvider: DateProvider) {}

  public getExpiryDate(): string {
    const { recentExpiry } = this.testTypeForExpiry;
    const monthOfMostRecentExpiryDate = DateProvider.getEndOfMonth(recentExpiry);
    const testDate = this.dateProvider.getTestDate();
    console.log(`recentExpiry: ${recentExpiry}`);
    console.log(`testDate: ${testDate}`);

    if (DateProvider.isBetweenTwoMonths(monthOfMostRecentExpiryDate, testDate, "[)")) {
      return DateProvider.getLastDayOfMonthInNextYearISOString(recentExpiry);
    }
    return DateProvider.getLastDayOfMonthInNextYearISOString(testDate);
  }
}
