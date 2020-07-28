import moment from "moment";
import { IExpiryDateHandler } from "./IExpiryDateHandler";


export abstract class ExpiryBaseHandler {
    protected nextHandler: IExpiryDateHandler | undefined;
    protected childHandler: IExpiryDateHandler | undefined;

    protected addOneYearMinusOneDay(inputDate: Date): string {
        return moment(inputDate).add(1, "year").subtract(1, "day").startOf("day").toISOString();
      }
    protected isMostRecentExpiryNotFound(mostRecentExpiryDate: Date): boolean {
        return moment(mostRecentExpiryDate).isSame(new Date(1970, 1, 1));
      }
    protected isValidDate(input: string | Date | number | undefined): boolean {
        return input !== undefined && moment(input).isValid() && moment(input).isAfter(new Date(0));
      }
    protected addOneYear(inputDate: Date): string {
        return moment(inputDate).add(1, "year").startOf("day").toISOString();
      }
}
