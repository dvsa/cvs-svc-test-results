export interface IExpiryDateHandler {
    calculateExpiry(testTypePayload: any): string;
}