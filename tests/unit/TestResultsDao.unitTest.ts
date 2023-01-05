import { TestTypeParams } from '../../src/models';
import { TestResultsDAO } from '../../src/models/TestResultsDAO';
import { LambdaService } from '../../src/services/LambdaService';
import { ITestResultFilters } from '../../src/models/ITestResultFilter';

jest.mock('../../src/services/LambdaService');

describe('Test Results DAO', () => {
  const dao = new TestResultsDAO();

  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  describe('GetBySystemNumber function', () => {
    it('builds correct query', () => {
      const daoStub = jest.fn().mockImplementation(() => ({
        promise: () => {
          Promise.resolve(undefined);
        },
      }));
      (TestResultsDAO as any).docClient.query = daoStub;
      const filter: ITestResultFilters = {
        systemNumber: 'abc123',
        fromDateTime: new Date('2021-02-01'),
        toDateTime: new Date('2021-09-01'),
        testStationPNumber: '123QWE',
      };
      dao.getBySystemNumber(filter);

      expect(
        daoStub.mock.calls[0][0].ExpressionAttributeValues[':systemNumber'],
      ).toBe('abc123');
      expect(
        daoStub.mock.calls[0][0].ExpressionAttributeValues[
          ':testStartTimestamp'
        ],
      ).toBe('2021-02-01T00:00:00.000Z');
      expect(
        daoStub.mock.calls[0][0].ExpressionAttributeValues[':testEndTimestamp'],
      ).toBe('2021-09-01T00:00:00.000Z');
      expect(
        daoStub.mock.calls[0][0].ExpressionAttributeValues[
          ':testStationPNumber'
        ],
      ).toBe('123QWE');
    });
  });

  describe('getByTesterStaffId function', () => {
    it('builds correct query', () => {
      const daoStub = jest.fn().mockImplementation(() => ({
        promise: () => {
          Promise.resolve(undefined);
        },
      }));
      (TestResultsDAO as any).docClient.query = daoStub;

      const filter: ITestResultFilters = {
        testerStaffId: 'abc123',
        fromDateTime: new Date('2021-02-01'),
        toDateTime: new Date('2021-09-01'),
        testStationPNumber: '123QWE',
      };
      dao.getByTesterStaffId(filter);

      expect(
        daoStub.mock.calls[0][0].ExpressionAttributeValues[':testerStaffId'],
      ).toBe('abc123');
      expect(
        daoStub.mock.calls[0][0].ExpressionAttributeValues[
          ':testStartTimestamp'
        ],
      ).toBe('2021-02-01T00:00:00.000Z');
      expect(
        daoStub.mock.calls[0][0].ExpressionAttributeValues[':testEndTimestamp'],
      ).toBe('2021-09-01T00:00:00.000Z');
      expect(
        daoStub.mock.calls[0][0].ExpressionAttributeValues[
          ':testStationPNumber'
        ],
      ).toBe('123QWE');
    });

    it('will query dynamodb using the pagination until there are no more results left', async () => {
      let queryResponse: any = {
        Items: [{ id: 1 }, { id: 2 }],
        LastEvaluatedKey: 123,
      };

      const queryStub = jest.fn().mockImplementation(() => ({
        promise: () => {
          // docClient.query will return an object containing LastEvaluatedKey when called for the first time
          // and will remove it in the next calls
          const promiseToReturn = Promise.resolve(queryResponse);
          queryResponse = { ...queryResponse };
          delete queryResponse.LastEvaluatedKey;
          return promiseToReturn;
        },
      }));
      (TestResultsDAO as any).docClient.query = queryStub;

      const filter: ITestResultFilters = {
        testerStaffId: 'abc123',
        fromDateTime: new Date('2021-02-01'),
        toDateTime: new Date('2021-09-01'),
        testStationPNumber: '123QWE',
      };
      const results = await dao.getByTesterStaffId(filter);
      expect(results).toHaveLength(4);
      expect(queryStub).toHaveBeenCalledTimes(2);
    });

    it('will query dynamodb using the pagination and the nested objects will be merged correctly', async () => {
      const complexObject = {
        id: 1,
        nestedObject: {
          nestedProperty: 'test',
        },
      };
      const simpleObject = { id: 2 };

      let queryResponse: any = {
        Items: [complexObject, simpleObject],
        LastEvaluatedKey: 123,
      };

      const queryStub = jest.fn().mockImplementation(() => ({
        promise: () => {
          // docClient.query will return an object containing LastEvaluatedKey when called for the first time
          // and will remove it in the next calls
          const promiseToReturn = Promise.resolve(queryResponse);
          queryResponse = { ...queryResponse };
          delete queryResponse.LastEvaluatedKey;
          return promiseToReturn;
        },
      }));
      (TestResultsDAO as any).docClient.query = queryStub;

      const filter: ITestResultFilters = {
        testerStaffId: 'abc123',
        fromDateTime: new Date('2021-02-01'),
        toDateTime: new Date('2021-09-01'),
        testStationPNumber: '123QWE',
      };
      const results = await dao.getByTesterStaffId(filter);
      expect(results).toHaveLength(4);
      expect(results[0]).toEqual(complexObject);
      expect(results[1]).toEqual(simpleObject);
      expect(results[2]).toEqual(complexObject);
      expect(results[3]).toEqual(simpleObject);
    });
  });

  describe('createSingle function', () => {
    it('builds correct query', () => {
      const daoStub = jest.fn().mockImplementation(() => ({
        promise: () => {
          Promise.resolve(undefined);
        },
      }));
      (TestResultsDAO as any).docClient.put = daoStub;

      const payload = { testResultId: 'abc123' };
      // @ts-ignore
      dao.createSingle(payload);

      expect(
        daoStub.mock.calls[0][0].ExpressionAttributeValues[':testResultIdVal'],
      ).toBe('abc123');
      expect(daoStub.mock.calls[0][0].Item).toEqual(payload);
    });
  });

  describe('createMultiple function', () => {
    it('builds correct query', () => {
      const daoStub = jest.fn().mockImplementation(() => ({
        promise: () => {
          Promise.resolve(undefined);
        },
      }));
      (TestResultsDAO as any).docClient.batchWrite = daoStub;

      const payload = [{ testResultId: 'abc123' }, { testResultId: 'def456' }];
      // @ts-ignore
      dao.createMultiple(payload);
      const callArgs =
        daoStub.mock.calls[0][0].RequestItems[(dao as any).tableName];
      expect(callArgs).toHaveLength(2);
      expect(callArgs[0].PutRequest.Item).toEqual(payload[0]);
      expect(callArgs[1].PutRequest.Item).toEqual(payload[1]);
    });
  });

  describe('deleteMultiple function', () => {
    it('builds correct query', () => {
      const daoStub = jest.fn().mockImplementation(() => ({
        promise: () => {
          Promise.resolve(undefined);
        },
      }));
      (TestResultsDAO as any).docClient.batchWrite = daoStub;

      const payload = [{ sysNumabc: 'abc123' }, { sysNumdef: 'def456' }];
      // @ts-ignore
      dao.deleteMultiple(payload);
      const callArgs =
        daoStub.mock.calls[0][0].RequestItems[(dao as any).tableName];
      expect(callArgs).toHaveLength(2);
      expect(callArgs[0].DeleteRequest.Key).toEqual({
        systemNumber: 'sysNumabc',
        testResultId: 'abc123',
      });
      expect(callArgs[1].DeleteRequest.Key).toEqual({
        systemNumber: 'sysNumdef',
        testResultId: 'def456',
      });
    });
  });

  describe('getTestCodesAndClassificationFromTestTypes function', () => {
    it('builds default query if fields are not passed in', () => {
      const lambdaStub = jest.fn().mockReturnValue(undefined);
      LambdaService.invoke = lambdaStub;
      const params: TestTypeParams = {
        vehicleType: 'vehicleTypeVal',
        vehicleSize: 'vehicleSizeVal',
        vehicleConfiguration: 'vehicleConfigurationVal',
        vehicleWheels: 17,
        vehicleAxles: null,
        vehicleClass: null,
        vehicleSubclass: null,
        euVehicleCategory: null,
      };
      dao.getTestCodesAndClassificationFromTestTypes('testTypeIdVal', params);

      const callEvent = lambdaStub.mock.calls[0][1];
      expect(callEvent.path).toBe('/test-types/testTypeIdVal');
      const expectsQueryParams = {
        euVehicleCategory: null,
        vehicleClass: null,
        vehicleSubclass: null,
        vehicleWheels: 17,
        vehicleType: 'vehicleTypeVal',
        vehicleSize: 'vehicleSizeVal',
        vehicleConfiguration: 'vehicleConfigurationVal',
        vehicleAxles: null,
        fields: 'defaultTestCode,linkedTestCode,testTypeClassification',
      };
      expect(callEvent.queryStringParameters).toEqual(expectsQueryParams);
      expect(callEvent.pathParameters.id).toBe('testTypeIdVal');
    });

    it('builds custom query if fields are passed in', () => {
      const lambdaStub = jest.fn().mockReturnValue(undefined);
      LambdaService.invoke = lambdaStub;
      const params: TestTypeParams = {
        vehicleType: 'vehicleTypeVal',
        vehicleSize: 'vehicleSizeVal',
        vehicleConfiguration: 'vehicleConfigurationVal',
        vehicleWheels: 17,
        vehicleAxles: null,
        vehicleClass: null,
        vehicleSubclass: null,
        euVehicleCategory: null,
      };
      const fields =
        'defaultTestCode,name,linkedTestCode,testTypeClassification,testTypeName';
      dao.getTestCodesAndClassificationFromTestTypes(
        'testTypeIdVal',
        params,
        fields,
      );

      const callEvent = lambdaStub.mock.calls[0][1];
      expect(callEvent.path).toBe('/test-types/testTypeIdVal');
      const expectsQueryParams = {
        ...params,
        fields,
      };
      expect(callEvent.queryStringParameters).toEqual(expectsQueryParams);
      expect(callEvent.pathParameters.id).toBe('testTypeIdVal');
    });
  });

  describe('getTestNumber function', () => {
    it('builds correct query', () => {
      const lambdaStub = jest.fn().mockReturnValue(undefined);
      LambdaService.invoke = lambdaStub;

      dao.createTestNumber();

      const callEvent = lambdaStub.mock.calls[0][1];
      expect(callEvent.path).toBe('/test-number/');
      expect(callEvent.httpMethod).toBe('POST');
    });
  });
});
