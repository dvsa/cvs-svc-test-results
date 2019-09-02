export interface ITestResultPayload {
    testStatus: string;
    testTypes: any[];
    vehicleType: any;
    vehicleSize: any;
    vehicleConfiguration: any;
    noOfAxles: any;
    vin?: any;
    testResultId?: string;
    vehicleId?: string;
    vrm?: string;
}
