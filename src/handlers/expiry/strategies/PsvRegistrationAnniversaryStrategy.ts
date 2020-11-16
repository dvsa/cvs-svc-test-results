import { DateProvider } from "../providers/DateProvider";
import { IExpiryDateStrategy } from "../IExpiryDateStrategy";
import { TestTypeForExpiry } from "../../../models/TestTypeforExpiry";

export class PsvRegistrationAnniversaryStrategy implements IExpiryDateStrategy {
  constructor(public testTypeForExpiry: TestTypeForExpiry, public dateProvider: DateProvider) {}

  public getExpiryDate(): string {
    const { regnOrFirstUseDate } = this.testTypeForExpiry;
    const registrationAnniversary = DateProvider.addOneYear(regnOrFirstUseDate as string);
    const testDate = this.dateProvider.getTestDate();
    console.log(`registrationAnniversary: ${registrationAnniversary}`);
    console.log(`testDate: ${testDate}`);
    if (DateProvider.isBetweenTwoMonths(registrationAnniversary, testDate, "[)")) {
      return DateProvider.addOneYearISOString(registrationAnniversary);
    }
    return DateProvider.addOneYearMinusOneDayISOString(testDate);
  }
}
