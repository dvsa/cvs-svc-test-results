import { IExpiryDateHandler } from "../IExpiryDateHandler";
import { ExpiryBaseHandler } from "../expiryBaseHandler";

export class HgvTrlExpiryHandler extends ExpiryBaseHandler implements IExpiryDateHandler {
    public calculateExpiry(testTypePayload: any): string {
        // COIF_EXPIRY_TEST_TYPES.IDS.includes(testTypePayload.testTypeId);

        return "";
    }
}
