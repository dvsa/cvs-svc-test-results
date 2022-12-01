import { DateProvider } from '../providers/DateProvider';
import { IExpiryDateStrategy } from '../IExpiryDateStrategy';
import { TestTypeForExpiry } from '../../../models/TestTypeforExpiry';

export class HgvTrlAnnualTestStrategy implements IExpiryDateStrategy {
  constructor(
    public testTypeForExpiry: TestTypeForExpiry,
    public dateProvider: DateProvider,
  ) {}

  public getExpiryDate(): string {
    const { regnOrFirstUseDate } = this.testTypeForExpiry;
    const isValidRegn = DateProvider.isValidDate(regnOrFirstUseDate);
    const testDate = this.dateProvider.getTestDate();
    const regnAnniversary = DateProvider.addOneYearEndOfMonth(
      regnOrFirstUseDate as string,
    );
    console.log(`regnOrFirstUseDate: ${regnOrFirstUseDate}`);
    console.log(`regnAnniversary: ${regnAnniversary}`);
    console.log(`testDate: ${testDate}`);
    if (
      isValidRegn &&
      DateProvider.isBetweenTwoMonths(regnAnniversary, testDate, '()')
    ) {
      return DateProvider.getLastDayOfMonthInNextYearISOString(regnAnniversary);
    }
    return DateProvider.getLastDayOfMonthInNextYearISOString(testDate);
  }
}
