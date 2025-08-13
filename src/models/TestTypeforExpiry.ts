import { TestResultTestTypeSchema } from '@dvsa/cvs-type-definitions/types/v1/test-result-test-type';
import { VEHICLE_TYPE } from '../assets/Enums';

export interface TestTypeForExpiry {
  testType: TestResultTestTypeSchema;
  vehicleType: VEHICLE_TYPE;
  recentExpiry: Date;
  regnOrFirstUseDate?: string;
  hasHistory: boolean;
  hasRegistration: boolean;
}
