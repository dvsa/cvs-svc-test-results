import { VEHICLE_TYPES } from "../../../assets/Enums";

import { ExpiryBaseHandler } from "../expiryBaseHandler";
import { IExpiryDateHandler } from "../IExpiryDateHandler";
import { CoifExpiryHandler } from "./coifExpiryHandler";
import { HgvTrlExpiryHandler } from "../hgv-trl/hgvExpiryHandler";


export class PsvExpiryHandler extends ExpiryBaseHandler implements IExpiryDateHandler {
    protected nextHandler: HgvTrlExpiryHandler;
    protected childHandler: CoifExpiryHandler;

   constructor() {
       super();
       this.nextHandler = new HgvTrlExpiryHandler();
       this.childHandler = new CoifExpiryHandler();
   }

    public calculateExpiry(testTypePayload: any): string {
       if (testTypePayload.vehicleType === VEHICLE_TYPES.PSV) {
          return this.childHandler.calculateExpiry(testTypePayload);
       } else {
          return this.nextHandler.calculateExpiry(testTypePayload);
       }
    }
}
