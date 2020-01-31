export interface ITestResultPayload {
    systemNumber: string;
    testStatus: string;
    testTypes: any[];
    vehicleType: any;
    vehicleSize?: any;
    vehicleConfiguration: any;
    noOfAxles: any;
    vin?: any;
    testResultId?: string;
    vehicleId?: string;
    vrm?: string;
    regnDate?: Date;
    firstUseDate?: Date;
    countryOfRegistration: string | null;
    euVehicleCategory: string | null;
    odometerReading: number | null;
    odometerReadingUnits: string | null;
}
