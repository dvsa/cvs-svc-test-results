import moment from "moment";

import { ExpiryBaseHandler } from "../expiryBaseHandler";
import { IExpiryDateHandler } from "../IExpiryDateHandler";
import { NoRecentNoRegExpiryHandler } from "./noRecentNoRegExpiryHandler";
import { TwoMonthsExpiryHandler } from "./twoMonthsExpiryHandler";



export class RegAnniversaryHandler extends ExpiryBaseHandler implements IExpiryDateHandler {

    protected nextHandler: NoRecentNoRegExpiryHandler;
    protected childHandler: TwoMonthsExpiryHandler;

    constructor() {
        super();
        this.nextHandler = new NoRecentNoRegExpiryHandler();
        this.childHandler = new TwoMonthsExpiryHandler();
    }
    public calculateExpiry(testTypePayload: any): string {
        // TODO: do prerequisutes for registration anniversary
        if (testTypePayload.registrationAnniversary.isBetween(moment(new Date()), moment(new Date()).add(2, "months"), "days", "[)")) {
            return this.addOneYear(testTypePayload.registrationAnniversary.toDate());
        } else {
            return this.addOneYearMinusOneDay(new Date());
        }
    }

}
