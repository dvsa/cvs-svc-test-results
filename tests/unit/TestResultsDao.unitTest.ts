import { TestTypeParams } from "../../src/models";
import { TestResultsDAO } from "../../src/models/TestResultsDAO";
import { LambdaService } from "../../src/services/LambdaService";
jest.mock("../../src/services/LambdaService");

describe("Test Results DAO", () => {
  const dao = new TestResultsDAO();

  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModuleRegistry();
  });
  describe("GetBySystemNumber function", () => {
    it("builds correct query", () => {
      const daoStub = jest.fn().mockImplementation(() => {
        return {
          promise: () => {
            Promise.resolve(undefined);
          },
        };
      });
      (TestResultsDAO as any).docClient.query = daoStub;

      dao.getBySystemNumber("abc123");

      expect(
        daoStub.mock.calls[0][0].ExpressionAttributeValues[":systemNumber"]
      ).toEqual("abc123");
    });
  });

  describe("getByTesterStaffId function", () => {
    it("builds correct query", () => {
      const daoStub = jest.fn().mockImplementation(() => {
        return {
          promise: () => {
            Promise.resolve(undefined);
          },
        };
      });
      (TestResultsDAO as any).docClient.query = daoStub;

      dao.getByTesterStaffId("abc123");

      expect(
        daoStub.mock.calls[0][0].ExpressionAttributeValues[":testerStaffId"]
      ).toEqual("abc123");
    });

    it("will query dynamodb using the pagination until there are no more results left", async () => {
      let queryResponse: any = {
        Items: [{ id: 1 }, { id: 2 }],
        LastEvaluatedKey: 123,
      };

      const queryStub = jest.fn().mockImplementation(() => {
        return {
          promise: () => {
            // docClient.query will return an object containing LastEvaluatedKey when called for the first time
            // and will remove it in the next calls
            const promiseToReturn = Promise.resolve(queryResponse);
            queryResponse = Object.assign({}, queryResponse);
            delete queryResponse.LastEvaluatedKey;
            return promiseToReturn;
          },
        };
      });
      (TestResultsDAO as any).docClient.query = queryStub;

      const results = await dao.getByTesterStaffId("abc123");
      expect(results.length).toBe(4);
      expect(queryStub).toHaveBeenCalledTimes(2);
    });

    it("will query dynamodb using the pagination and the nested objects will be merged correctly", async () => {
      const complexObject = {
        id: 1,
        nestedObject: {
          nestedProperty: "test",
        },
      };
      const simpleObject = { id: 2 };

      let queryResponse: any = {
        Items: [complexObject, simpleObject],
        LastEvaluatedKey: 123,
      };

      const queryStub = jest.fn().mockImplementation(() => {
        return {
          promise: () => {
            // docClient.query will return an object containing LastEvaluatedKey when called for the first time
            // and will remove it in the next calls
            const promiseToReturn = Promise.resolve(queryResponse);
            queryResponse = Object.assign({}, queryResponse);
            delete queryResponse.LastEvaluatedKey;
            return promiseToReturn;
          },
        };
      });
      (TestResultsDAO as any).docClient.query = queryStub;

      const results = await dao.getByTesterStaffId("abc123");
      expect(results.length).toBe(4);
      expect(results[0]).toEqual(complexObject);
      expect(results[1]).toEqual(simpleObject);
      expect(results[2]).toEqual(complexObject);
      expect(results[3]).toEqual(simpleObject);
    });
  });

  describe("createSingle function", () => {
    it("builds correct query", () => {
      const daoStub = jest.fn().mockImplementation(() => {
        return {
          promise: () => {
            Promise.resolve(undefined);
          },
        };
      });
      (TestResultsDAO as any).docClient.put = daoStub;

      const payload = { testResultId: "abc123" };
      // @ts-ignore
      dao.createSingle(payload);

      expect(
        daoStub.mock.calls[0][0].ExpressionAttributeValues[":testResultIdVal"]
      ).toEqual("abc123");
      expect(daoStub.mock.calls[0][0].Item).toEqual(payload);
    });
  });

  describe("createMultiple function", () => {
    it("builds correct query", () => {
      const daoStub = jest.fn().mockImplementation(() => {
        return {
          promise: () => {
            Promise.resolve(undefined);
          },
        };
      });
      (TestResultsDAO as any).docClient.batchWrite = daoStub;

      const payload = [{ testResultId: "abc123" }, { testResultId: "def456" }];
      // @ts-ignore
      dao.createMultiple(payload);
      const callArgs =
        daoStub.mock.calls[0][0].RequestItems[(dao as any).tableName];
      expect(callArgs).toHaveLength(2);
      expect(callArgs[0].PutRequest.Item).toEqual(payload[0]);
      expect(callArgs[1].PutRequest.Item).toEqual(payload[1]);
    });
  });

  describe("deleteMultiple function", () => {
    it("builds correct query", () => {
      const daoStub = jest.fn().mockImplementation(() => {
        return {
          promise: () => {
            Promise.resolve(undefined);
          },
        };
      });
      (TestResultsDAO as any).docClient.batchWrite = daoStub;

      const payload = [{ sysNumabc: "abc123" }, { sysNumdef: "def456" }];
      // @ts-ignore
      dao.deleteMultiple(payload);
      const callArgs =
        daoStub.mock.calls[0][0].RequestItems[(dao as any).tableName];
      expect(callArgs).toHaveLength(2);
      expect(callArgs[0].DeleteRequest.Key).toEqual({
        systemNumber: "sysNumabc",
        testResultId: "abc123",
      });
      expect(callArgs[1].DeleteRequest.Key).toEqual({
        systemNumber: "sysNumdef",
        testResultId: "def456",
      });
    });
  });

  describe("getTestCodesAndClassificationFromTestTypes function", () => {
    it("builds correct query", () => {
      const lambdaStub = jest.fn().mockReturnValue(undefined);
      LambdaService.invoke = lambdaStub;
      const params: TestTypeParams = {
        vehicleType: "vehicleTypeVal",
        vehicleSize: "vehicleSizeVal",
        vehicleConfiguration: "vehicleConfigurationVal",
        vehicleWheels: 17,
        vehicleAxles: null,
        vehicleClass: null,
        vehicleSubclass: null,
        euVehicleCategory: null,
      };
      dao.getTestCodesAndClassificationFromTestTypes("testTypeIdVal", params);

      const callEvent = lambdaStub.mock.calls[0][1];
      expect(callEvent.path).toEqual("/test-types/testTypeIdVal");
      const expectsQueryParams = {
        euVehicleCategory: null,
        vehicleClass: null,
        vehicleSubclass: null,
        vehicleWheels: 17,
        vehicleType: "vehicleTypeVal",
        vehicleSize: "vehicleSizeVal",
        vehicleConfiguration: "vehicleConfigurationVal",
        vehicleAxles: null,
        fields: "defaultTestCode,linkedTestCode,testTypeClassification",
      };
      expect(callEvent.queryStringParameters).toEqual(expectsQueryParams);
      expect(callEvent.pathParameters.id).toEqual("testTypeIdVal");
    });
  });

  describe("getTestNumber function", () => {
    it("builds correct query", () => {
      const lambdaStub = jest.fn().mockReturnValue(undefined);
      LambdaService.invoke = lambdaStub;

      dao.createTestNumber();

      const callEvent = lambdaStub.mock.calls[0][1];
      expect(callEvent.path).toEqual("/test-number/");
      expect(callEvent.httpMethod).toEqual("POST");
    });
  });
});
