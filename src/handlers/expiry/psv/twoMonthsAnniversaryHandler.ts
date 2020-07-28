import moment from "moment";

import { ExpiryBaseHandler } from "../expiryBaseHandler";
import { IExpiryDateHandler } from "../IExpiryDateHandler";

export class TwoMonthsAnniversaryHandler extends ExpiryBaseHandler implements IExpiryDateHandler {
    constructor() {
        super();
    }

    public calculateExpiry(testTypePayload: any): string {
        if (testTypePayload.registrationAnniversary.isBetween(moment(new Date()), moment(new Date()).add(2, "months"), "days", "[)")) {
            return this.addOneYear(testTypePayload.registrationAnniversary.toDate());
        } else {
            return this.addOneYearMinusOneDay(new Date());
        }
    }

}
