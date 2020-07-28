import { ExpiryBaseHandler } from "../expiryBaseHandler";
import { IExpiryDateHandler } from "../IExpiryDateHandler";
import { TwoMonthsExpiryHandler } from "./twoMonthsExpiryHandler";


export class NoRecentNoRegExpiryHandler extends ExpiryBaseHandler implements IExpiryDateHandler {

    protected nextHandler: TwoMonthsExpiryHandler;

    constructor() {
        super();
        this.nextHandler = new TwoMonthsExpiryHandler();
    }

    public calculateExpiry(testTypePayload: any): string {
        if (this.isMostRecentExpiryNotFound(testTypePayload.recentExpiry) && !this.isValidDate(testTypePayload.regnDate)) {
            return this.addOneYearMinusOneDay(new Date());
          } else {
            return this.nextHandler.calculateExpiry(testTypePayload);
        }
    }

}
