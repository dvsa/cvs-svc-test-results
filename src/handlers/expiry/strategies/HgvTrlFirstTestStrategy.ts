import { DateProvider } from '../providers/DateProvider';
import { IExpiryDateStrategy } from '../IExpiryDateStrategy';
import { TestTypeForExpiry } from '../../../models/TestTypeforExpiry';

export class HgvTrlFirstTestStrategy implements IExpiryDateStrategy {
  constructor(
    public testTypeForExpiry: TestTypeForExpiry,
    public dateProvider: DateProvider,
  ) {}

  public getExpiryDate(): string {
    const { regnOrFirstUseDate } = this.testTypeForExpiry;
    const isValidRegn = DateProvider.isValidDate(regnOrFirstUseDate);
    const testDate = this.dateProvider.getTestDate();
    const regnAnniversaryEndOfMonth = DateProvider.addOneYearEndOfMonth(
      regnOrFirstUseDate as string,
    );
    console.log(`regnAnniversaryEndOfMonth ${regnAnniversaryEndOfMonth}`);
    console.log(`testDate ${testDate}`);
    if (
      isValidRegn &&
      DateProvider.isBetweenTwoMonths(regnAnniversaryEndOfMonth, testDate, '[)')
    ) {
      return DateProvider.addOneYearStartOfDayISOString(
        regnAnniversaryEndOfMonth,
      );
    }
    return DateProvider.getLastDayOfMonthInNextYearISOString(testDate);
  }
}
