import { DateProvider } from './providers/DateProvider';
import { TestTypeForExpiry } from '../../models/TestTypeforExpiry';

export interface IExpiryDateStrategy {
  testTypeForExpiry: TestTypeForExpiry;
  dateProvider: DateProvider;
  getExpiryDate(): string;
}
