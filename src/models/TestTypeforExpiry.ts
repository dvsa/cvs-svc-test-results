import { TestTypeSchema } from '@dvsa/cvs-type-definitions/types/v1/test-result';
import { VEHICLE_TYPE } from '../assets/Enums';

export interface TestTypeForExpiry {
  testType: TestTypeSchema;
  vehicleType: VEHICLE_TYPE;
  recentExpiry: Date;
  regnOrFirstUseDate?: string;
  hasHistory: boolean;
  hasRegistration: boolean;
}
