import { BodyTypeModel, TestType } from './ITestResult';

export interface ITestResultPayload {
  systemNumber: string;
  vehicleClass?: any | null;
  vehicleSubclass?: any;
  numberOfWheelsDriven: any;
  testStatus: string;
  testTypes: TestType[];
  vehicleType: any;
  vehicleSize?: any;
  vehicleConfiguration: any;
  noOfAxles: any;
  vin?: any;
  testResultId?: string;
  vehicleId?: string;
  vrm?: string;
  regnDate?: string;
  firstUseDate?: string;
  countryOfRegistration?: string | null;
  euVehicleCategory: string | null;
  odometerReading: number | null;
  odometerReadingUnits: string | null;
  createdByName?: string;
  createdById?: string;
  createdAt?: string | Date;
  testerStaffId: string;
  testerName: string;
  testStartTimestamp?: string | Date;
  testEndTimestamp?: string | Date;
  testVersion?: string;
  reasonForCreation?: string;
  contingencyTestNumber?: string;
  typeOfTest?: string;
  source?: string;
  make?: string;
  model?: string;
  bodyType?: BodyTypeModel;
}
