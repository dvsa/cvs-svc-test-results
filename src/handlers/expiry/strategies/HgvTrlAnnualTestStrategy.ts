import { DateProvider } from "../providers/DateProvider";
import { IExpiryDateStrategy } from "../IExpiryDateStrategy";
import { TestTypeForExpiry } from "../../../models/TestTypeforExpiry";

export class HgvTrlAnnualTestStrategy implements IExpiryDateStrategy {
  constructor(public testTypeForExpiry: TestTypeForExpiry, public dateProvider: DateProvider) {}

  public getExpiryDate(): string {
    const {regnDate} = this.testTypeForExpiry;
    const isValidRegn = DateProvider.isValidDate(regnDate);
    const testDate = this.dateProvider.getTestDate();
    const regnAnniversary = DateProvider.addOneYearEndOfMonth(regnDate as string);
    console.log(`regnDate: ${regnDate}`);
    console.log(`regnAnniversary: ${regnAnniversary}`);
    console.log(`testDate: ${testDate}`);
    if (isValidRegn && DateProvider.isBetweenTwoMonths(regnAnniversary, testDate, "()")) {
      return DateProvider.getLastDayOfMonthInNextYearISOString(regnAnniversary);
      }
    return DateProvider.getLastDayOfMonthInNextYearISOString(testDate);
  }
}
