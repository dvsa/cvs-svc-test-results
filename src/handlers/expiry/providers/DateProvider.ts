import moment from 'moment-timezone';
import { Service } from '../../../models/injector/ServiceDecorator';

/**
 * Important: The local timezone in AWS lambda is GMT for all the regions.
 * dateFns only uses local timezones and therefore generates different hours when running locally or deployed in AWS.
 *
 * new Date(string) considers the ambiguous parsed string as UTC
 * new Date() creates a new date based on the local timezone
 */
@Service()
export class DateProvider {
  private testDate: Date = moment(new Date()).startOf('day').toDate();

  constructor() {
    moment.tz.setDefault('UTC');
  }

  public getTestDate(): Date {
    return this.testDate;
  }

  public setTestDate(date: Date) {
    this.testDate = moment(date).startOf('day').toDate();
  }

  // #region Static Functions
  public static getEpoc(): Date {
    return moment(new Date(0)).startOf('day').toDate();
  }

  public static isSameAsEpoc(inputDate: Date): boolean {
    return moment(inputDate).isSame(DateProvider.getEpoc());
  }

  /**
   * Fetch end of date for the provided date.
   * @param inputDate The date for which end of day is needed. Default is today.
   */
  public static getEndOfDay(inputDate: Date = new Date()) {
    return moment(inputDate).endOf('day').toDate();
  }

  public static getTwoYearsFromDate(inputDate: Date) {
    return moment(inputDate).subtract(2, 'years').endOf('day').toDate();
  }

  /**
   * Fetch start of day for the provided date.
   * @param inputDate The date for which start of day is needed. Default is today.
   */
  public static getStartOfDay(inputDate: string | Date) {
    return moment(inputDate).startOf('day').toDate();
  }

  public static getInstance(dateValue: string | number | Date) {
    return moment(dateValue);
  }

  public static getMaxDate(arrayOfDates: moment.Moment[]) {
    return moment.max(arrayOfDates).toDate();
  }

  public static getPsvAnniversaryDate(testExpiryDate: string | Date) {
    return moment(testExpiryDate)
      .utc()
      .subtract(2, 'months')
      .add(1, 'days')
      .toISOString();
  }

  /**
   * To validate whether provided input is a date. "undefined" is validated separately because moment(undefined) = new Date(). Strict validation is performed and only two date formats are acceptable YYYY-MM-DD and YYYY-MM-DDTHH:mm:ss.SSSZ.
   * @param input The input value which is validated.
   */
  public static isValidDate(
    input: string | Date | number | undefined,
  ): boolean {
    return (
      input !== undefined &&
      (moment(input, 'YYYY-MM-DDTHH:mm:ss.SSSSSSZ', true).isValid() || // Legacy format
        moment(input, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).isValid() || //  Test result API format
        moment(input, 'YYYY-MM-DD', true).isValid()) && // Tech Record dates e.g. regnDate
      moment(input).isAfter(new Date(0))
    );
  }

  /**
   * To compare whether input date is between two months of compare date. Inclusivity parameter represents start and end of month.
   * @param inputDate the input date.
   * @param compareDate the date to compare with.
   * @param inclusivity []= start and end included, ()= start and end excluded, [)= start included end excluded, (]= start excluded and end included.
   */
  public static isBetweenTwoMonths(
    inputDate: Date,
    compareDate: Date,
    inclusivity: '[]' | '()' | '[)' | '(]' | undefined,
  ): boolean {
    console.log(
      `compareDate+2 months: ${moment(compareDate)
        .add(2, 'months')
        .toISOString()}`,
    );
    return moment(inputDate).isBetween(
      moment(compareDate),
      moment(compareDate).add(2, 'months'),
      'days',
      inclusivity,
    );
  }

  /**
   * To compare whether dates fall between a comparison period.
   * @param fromDate the input from Date
   * @param toDate the input to date
   * @param compareFromDate the compare from Date
   * @param compareToDate the compare to Date
   */
  public static isBetweenDates(
    fromDate: string | number | Date,
    toDate: string | number | Date,
    compareFromDate: string | number | Date,
    compareToDate: string | number | Date,
  ) {
    return (
      moment(fromDate).isAfter(compareFromDate) &&
      moment(toDate).isBefore(compareToDate)
    );
  }

  /**
   * To compare whether dates fall between a comparison period.
   * @param dateToCompare the input Date
   * @param compareFromDate the start date of the period
   * @param compareToDate the end date of the period
   */
  public static isOutsideTimePeriod(
    dateToCompare: string | number | Date,
    compareToDate: string | number | Date,
    compareFromDate: string | number | Date,
  ) {
    return (
      moment(dateToCompare).isAfter(compareToDate) ||
      moment(dateToCompare).isBefore(compareFromDate)
    );
  }

  /**
   * To compare whether a date occurs after another date
   * @param date1 The date to compare
   * @param date2 The date which is used to check date1
   */
  public static isAfterDate(
    date1: string | number | Date,
    date2: string | number | Date,
  ) {
    return moment(date1).isAfter(date2);
  }

  /**
   * To check whether input date is February 29 on a leap year
   * @param inputDate
   */
  public static isFebruary29(inputDate: Date | string): boolean {
    return (
      moment(inputDate).isLeapYear() &&
      moment(inputDate).month() === 1 &&
      moment(inputDate).date() === 29
    );
  }

  public static addOneYear(inputDate: Date | string): Date {
    return moment(inputDate).add(1, 'years').startOf('day').toDate();
  }

  public static addOneYearEndOfMonth(inputDate: Date | string): Date {
    return moment(inputDate)
      .add(1, 'year')
      .endOf('month')
      .startOf('day')
      .toDate();
  }

  public static getEndOfMonth(inputDate: Date | string): Date {
    return moment(inputDate).endOf('month').startOf('day').toDate();
  }

  public static addOneYearISOString(inputDate: Date | string): string {
    return moment(inputDate).add(1, 'years').toISOString();
  }

  /**
   * Adds one calendar year minus one day as default. Logic has been added to handle the case of Feb 29 on a leap year.
   * @param inputDate
   */
  public static addOneYearMinusOneDayISOString(
    inputDate: Date | string,
  ): string {
    //
    const generateExpiryDate = (subtractDays = 1): string =>
      moment(inputDate)
        .add(1, 'year')
        .subtract(subtractDays, 'day')
        .startOf('day')
        .toISOString();

    return this.isFebruary29(inputDate)
      ? generateExpiryDate(0)
      : generateExpiryDate();
  }

  public static getLastDayOfMonthInNextYearISOString(
    inputDate: Date | string,
  ): string {
    return moment(inputDate)
      .add(1, 'year')
      .endOf('month')
      .startOf('day')
      .toISOString();
  }
  // #endregion
}
