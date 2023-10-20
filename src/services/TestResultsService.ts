import * as enums from '../assets/Enums';
import * as models from '../models';
import { VehicleTestController } from '../handlers/VehicleTestController';
import { TestDataProvider } from '../handlers/expiry/providers/TestDataProvider';
import { DateProvider } from '../handlers/expiry/providers/DateProvider';

/**
 * Service for retrieving and creating Test Results from/into the db
 * @returns Promise
 */
export class TestResultsService {
  public readonly testResultsDAO: models.TestResultsDAO;

  public vehicleTestController: VehicleTestController;

  constructor(testResultsDAO: models.TestResultsDAO) {
    this.testResultsDAO = testResultsDAO;
    this.vehicleTestController = models.Injector.resolve<VehicleTestController>(
      VehicleTestController,
      [TestDataProvider, DateProvider],
    );
    this.vehicleTestController.dataProvider.testResultsDAO =
      this.testResultsDAO;
  }

  // #region [rgba(52, 152, 219, 0.15)] Public functions

  public async getTestResultBySystemNumber(
    filters: models.ITestResultFilters,
  ): Promise<models.ITestResult[]> {
    try {
      return await this.vehicleTestController.getTestResultBySystemNumber(
        filters,
      );
    } catch (error) {
      return TestResultsService.handleError(error);
    }
  }

  public async getTestResultsByTesterStaffId(
    filters: models.ITestResultFilters,
  ): Promise<any> {
    try {
      return await this.vehicleTestController.getTestResultByTestStaffId(
        filters,
      );
    } catch (error) {
      return TestResultsService.handleError(error);
    }
  }

  public async updateTestResult(
    systemNumber: string,
    payload: models.ITestResult,
    msUserDetails: models.IMsUserDetails,
  ) {
    console.log(JSON.stringify(payload))
    try {
      const result = await this.vehicleTestController.updateTestResult(
        systemNumber,
        payload,
        msUserDetails,
      );
      return result;
    } catch (error) {
      console.error('TestResultService.updateTestResult ->', error);
      return Promise.reject(error);
    }
  }

  public async insertTestResult(payload: models.ITestResultPayload) {
    try {
      const result = await this.vehicleTestController.insertTestResult(payload);
      return result;
    } catch (error) {
      console.error('TestResultService.insertTestResult ->', error);
      const rejection = [201, 400].includes(error.statusCode)
        ? error
        : new models.HTTPError(500, enums.MESSAGES.INTERNAL_SERVER_ERROR);
      return Promise.reject(rejection);
    }
  }
  // #endregion

  private static handleError(error: any) {
    console.error(error);
    const httpError = error as models.HTTPError;
    if (!(httpError && [400, 404].includes(httpError.statusCode))) {
      return Promise.reject(
        new models.HTTPError(500, enums.MESSAGES.INTERNAL_SERVER_ERROR),
      );
    }
    return Promise.reject(error);
  }
}
