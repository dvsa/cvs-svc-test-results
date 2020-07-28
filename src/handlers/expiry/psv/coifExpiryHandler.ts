import { COIF_EXPIRY_TEST_TYPES } from "../../../assets/Enums";

import { ExpiryBaseHandler } from "../expiryBaseHandler";
import { IExpiryDateHandler } from "../IExpiryDateHandler";
import { NoRecentExpiryHandler } from "./noRecentExpiryHandler";

export class CoifExpiryHandler extends ExpiryBaseHandler implements IExpiryDateHandler {

    protected nextHandler: NoRecentExpiryHandler;

    constructor() {
        super();
        this.nextHandler = new NoRecentExpiryHandler();
    }

    public calculateExpiry(testTypePayload: any): string {
        if (COIF_EXPIRY_TEST_TYPES.IDS.includes(testTypePayload.testTypeId)) {
            return this.addOneYearMinusOneDay(new Date());
        } else {
            return this.nextHandler.calculateExpiry(testTypePayload);
        }
    }

}
