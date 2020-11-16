import moment from "moment-timezone";
import { Service } from "../../../models/injector/ServiceDecorator";

/**
 * Important: The local timezone in AWS lambda is GMT for all the regions.
 * dateFns only uses local timezones and therefore generates different hours when running locally or deployed in AWS.
 *
 * new Date(string) considers the ambiguous parsed string as UTC
 * new Date() creates a new date based on the local timezone
 */
@Service()
export class DateProvider {
  private testDate: Date = moment(new Date()).startOf("day").toDate();

  constructor() {
    moment.tz.setDefault("UTC");
  }

  public getTestDate(): Date {
    return this.testDate;
  }

  public setTestDate(date: Date) {
    this.testDate = moment(date).startOf("day").toDate();
  }

  //#region Static Functions
  public static getEpoc(): Date {
    return moment(new Date(0)).startOf("day").toDate();
  }

  public static isSameAsEpoc(inputDate: Date): boolean {
    return moment(inputDate).isSame(DateProvider.getEpoc());
  }
  /**
   * Fetch end of date for the provided date.
   * @param inputDate The date for which end of day is needed. Default is today.
   */
  public static getEndOfDay(inputDate: Date = new Date()) {
    return moment(inputDate).endOf("day").toDate();
  }

  public static getTwoYearsFromDate(inputDate: Date) {
    return moment(inputDate).subtract(2, "years").endOf("day").toDate();
  }

  public static getInstance(dateValue: string | number | Date) {
    return moment(dateValue);
  }

  public static getMaxDate(arrayOfDates: moment.Moment[]) {
    return  moment.max(arrayOfDates).toDate();
  }
  /**
   * To validate whether provided input is a date. "undefined" is validated separately because moment(undefined) = new Date(). Strict validation is performed and only two date formats are acceptable YYYY-MM-DD and YYYY-MM-DDTHH:mm:ss.SSSZ.
   * @param input The input value which is validated.
   */
  public static isValidDate(
    input: string | Date | number | undefined
  ): boolean {
    return (
      input !== undefined &&
      (moment(input, "YYYY-MM-DDTHH:mm:ss.SSSSSSZ", true).isValid() || // Legacy format
        moment(input, "YYYY-MM-DDTHH:mm:ss.SSSZ", true).isValid() || //  Test result API format
        moment(input, "YYYY-MM-DD", true).isValid()) && // Tech Record dates e.g. regnDate
      moment(input).isAfter(new Date(0))
    );
  }
  /**
   * To compare whether input date is between two months of compare date. Inlcusivty parameter represents start and end of month.
   * @param inputDate the input date.
   * @param compareDate the date to compare with.
   * @param inclusivity []= start and end included, ()= start and end excluded, [)= start included end excluded, (]= start excluded and end included.
   */
  public static isBetweenTwoMonths(
    inputDate: Date,
    compareDate: Date,
    inclusivity: "[]" | "()" | "[)" | "(]" | undefined
  ): boolean {
    console.log(
      `compareDate+2 months: ${moment(compareDate)
        .add(2, "months")
        .toISOString()}`
    );
    return moment(inputDate).isBetween(
      moment(compareDate),
      moment(compareDate).add(2, "months"),
      "days",
      inclusivity
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
    compareFromDate: Date,
    compareToDate: Date
  ) {
    return (
      moment(fromDate).isAfter(compareFromDate) &&
      moment(toDate).isBefore(compareToDate)
    );
  }

  public static addOneYear(inputDate: Date | string): Date {
    return moment(inputDate).add(1, "years").startOf("day").toDate();
  }

  public static addOneYearEndOfMonth(inputDate: Date | string): Date {
    return moment(inputDate)
      .add(1, "year")
      .endOf("month")
      .startOf("day")
      .toDate();
  }

  public static getEndOfMonth(inputDate: Date | string): Date {
    return moment(inputDate).endOf("month").startOf("day").toDate();
  }

  public static addOneYearISOString(inputDate: Date | string): string {
    return moment(inputDate).add(1, "years").toISOString();
  }

  public static addOneYearStartOfDayISOString(
    inputDate: Date | string
  ): string {
    return moment(inputDate).add(1, "year").startOf("day").toISOString();
  }

  public static addOneYearMinusOneDayISOString(
    inputDate: Date | string
  ): string {
    return moment(inputDate)
      .add(1, "year")
      .subtract(1, "day")
      .startOf("day")
      .toISOString();
  }

  public static getLastDayOfMonthInNextYearISOString(
    inputDate: Date | string
  ): string {
    return moment(inputDate)
      .add(1, "year")
      .endOf("month")
      .startOf("day")
      .toISOString();
  }
  //#endregion
}
