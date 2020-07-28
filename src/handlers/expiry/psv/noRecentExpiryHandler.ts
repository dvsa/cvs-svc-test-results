import moment from "moment";

import { ExpiryBaseHandler } from "../expiryBaseHandler";
import { IExpiryDateHandler } from "../IExpiryDateHandler";
import { NoRecentNoRegExpiryHandler } from "./noRecentNoRegExpiryHandler";
import { RegAnniversaryHandler } from "./regAnniversaryHandler";



export class NoRecentExpiryHandler extends ExpiryBaseHandler implements IExpiryDateHandler {

    protected nextHandler: NoRecentNoRegExpiryHandler;
    protected childHandler: RegAnniversaryHandler;

    constructor() {
        super();
        this.nextHandler = new NoRecentNoRegExpiryHandler();
        this.childHandler = new RegAnniversaryHandler();
    }
    public calculateExpiry(testTypePayload: any): string {
        // TODO: do prerequisutes for registration anniversary
        if (this.isMostRecentExpiryNotFound(testTypePayload.recentExpiry) && this.isValidDate(testTypePayload.regnDate)) {
            return this.childHandler.calculateExpiry(testTypePayload);
        } else {
            return this.nextHandler.calculateExpiry(testTypePayload);
        }
    }

}
