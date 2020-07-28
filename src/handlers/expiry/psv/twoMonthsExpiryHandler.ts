import moment from "moment";

import { ExpiryBaseHandler } from "../expiryBaseHandler";
import { IExpiryDateHandler } from "../IExpiryDateHandler";

export class TwoMonthsExpiryHandler extends ExpiryBaseHandler implements IExpiryDateHandler {
    constructor() {
        super();
    }

    public calculateExpiry(testTypePayload: any): string {
        // TODO: prerequisite for recentExpiry
        if (moment(testTypePayload.recentExpiry).isBetween(moment(new Date()), moment(new Date()).add(2, "months"), "days", "[]")) {
            return this.addOneYear(testTypePayload.recentExpiry.toDate());
        } else {
            return this.addOneYearMinusOneDay(new Date());
        }
    }

}
