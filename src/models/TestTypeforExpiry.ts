import { TestType } from './ITestResult';
import { VEHICLE_TYPE } from '../assets/Enums';

export interface TestTypeForExpiry {
  testType: TestType;
  vehicleType: VEHICLE_TYPE;
  recentExpiry: Date;
  regnOrFirstUseDate?: string;
  hasHistory: boolean;
  hasRegistration: boolean;
}
