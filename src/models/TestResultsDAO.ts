import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  BatchWriteCommandOutput,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  QueryCommandOutput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  TransactWriteCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { ServiceException } from '@smithy/smithy-client';
import * as models from '.';
import { LambdaService } from '../services/LambdaService';
import { Configuration } from '../utils/Configuration';

export class TestResultsDAO {
  private readonly tableName: string;

  private static docClient: DynamoDBDocumentClient;

  private static lambdaInvokeEndpoints: any;

  constructor() {
    const config = Configuration.getInstance().getDynamoDBConfig();

    this.tableName = config.table;
    if (!TestResultsDAO.docClient) {
      const client = new DynamoDBClient(config.params);
      if (process.env._X_AMZN_TRACE_ID) {
        TestResultsDAO.docClient = require('aws-xray-sdk').captureAWSv3Client(
          DynamoDBDocumentClient.from(client)
        );
      } else {
        console.log('Serverless Offline detected; skipping AWS X-Ray setup');
        TestResultsDAO.docClient = DynamoDBDocumentClient.from(client);
      }
    }
  }

  public getBySystemNumber(filters: models.ITestResultFilters) {
    const { systemNumber, fromDateTime, toDateTime } = filters;
    const keyCondition = 'systemNumber = :systemNumber';
    let filterExpression = '';
    if (fromDateTime && toDateTime) {
      filterExpression =
        'testStartTimestamp > :testStartTimestamp AND  testEndTimestamp < :testEndTimestamp';
      filterExpression = this.getOptionalFilters(filterExpression, filters);
    }
    const keyExpressionAttribute = { ':systemNumber': systemNumber };
    const expressionAttributeValues = Object.assign(
      {},
      keyExpressionAttribute,
      ...this.mapFilterValues(filters),
    );
    const params = {
      TableName: this.tableName,
      IndexName: 'SysNumIndex',
      KeyConditionExpression: keyCondition,
      FilterExpression: filterExpression || undefined,
      ExpressionAttributeValues: {
        ...expressionAttributeValues,
      },
    };
    console.log('getBySystemNumber: PARAMS ->', params);
    return this.queryAllData(params);
  }

  public getByTesterStaffId(
    filters: models.ITestResultFilters,
  ): Promise<models.ITestResult[]> {
    const { testerStaffId } = filters;
    const keyCondition =
      'testerStaffId = :testerStaffId AND testStartTimestamp > :testStartTimestamp';
    let filterExpression = 'testEndTimestamp <= :testEndTimestamp';
    filterExpression = this.getOptionalFilters(filterExpression, filters);
    const keyExpressionAttribute = { ':testerStaffId': testerStaffId };
    const expressionAttributeValues = Object.assign(
      {},
      keyExpressionAttribute,
      ...this.mapFilterValues(filters),
    );
    const params = {
      TableName: this.tableName,
      IndexName: 'TesterStaffIdIndex',
      KeyConditionExpression: keyCondition,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: {
        ...expressionAttributeValues,
      },
    };
    console.log('getByTesterStaffId: PARAMS ->', params);
    return this.queryAllData(params);
  }

  public createSingle(payload: models.ITestResultPayload) {
    const query = {
      TableName: this.tableName,
      Item: payload,
      ConditionExpression: 'testResultId <> :testResultIdVal',
      ExpressionAttributeValues: {
        ':testResultIdVal': payload.testResultId,
      },
    };
    return TestResultsDAO.docClient.send(new PutCommand(query));
  }

  public createMultiple(
    testResultsItems: models.ITestResult[],
  ): Promise<BatchWriteCommandOutput | ServiceException> {
    const params = this.generateBatchWritePartialParams();

    testResultsItems.forEach((testResultItem: models.ITestResult) => {
      params.RequestItems[this.tableName].push({
        PutRequest: {
          Item: testResultItem,
        },
      });
    });

    return TestResultsDAO.docClient.send(new BatchWriteCommand(params));
  }

  public deleteMultiple(
    systemNumberIdPairsToBeDeleted: any[],
  ): Promise<BatchWriteCommandOutput | ServiceException> {
    const params = this.generateBatchWritePartialParams();

    systemNumberIdPairsToBeDeleted.forEach(
      (systemNumberIdPairToBeDeleted: any) => {
        const systemNumberToBeDeleted: string = Object.keys(
          systemNumberIdPairToBeDeleted,
        )[0];
        const testResultIdToBeDeleted: string =
          systemNumberIdPairToBeDeleted[systemNumberToBeDeleted];

        params.RequestItems[this.tableName].push({
          DeleteRequest: {
            Key: {
              systemNumber: systemNumberToBeDeleted,
              testResultId: testResultIdToBeDeleted,
            },
          },
        });
      },
    );

    return TestResultsDAO.docClient.send(new BatchWriteCommand(params));
  }

  public generateBatchWritePartialParams(): any {
    return {
      RequestItems: {
        [this.tableName]: [],
      },
    };
  }

  public async getTestCodesAndClassificationFromTestTypes(
    testTypeId: string,
    testTypeParams: models.TestTypeParams,
    fields = 'defaultTestCode,linkedTestCode,testTypeClassification',
  ) {
    const {
      vehicleType,
      vehicleSize,
      vehicleConfiguration,
      vehicleAxles,
      euVehicleCategory,
      vehicleClass,
      vehicleSubclass,
      vehicleWheels,
    } = testTypeParams;
    const event = {
      path: `/test-types/${testTypeId}`,
      queryStringParameters: {
        vehicleType,
        vehicleSize,
        vehicleConfiguration,
        vehicleAxles,
        euVehicleCategory,
        vehicleClass,
        vehicleSubclass,
        vehicleWheels,
        fields,
      },
      pathParameters: {
        id: testTypeId,
      },
      httpMethod: 'GET',
      resource: '/test-types/{id}',
    };

    const lambdaName =
      TestResultsDAO.lambdaInvokeEndpoints.functions.getTestTypesById.name;
    try {
      console.log('queryString for get Test: ', event);
      const lambdaResult = LambdaService.invoke(lambdaName, event);

      return await lambdaResult;
    } catch (error) {
      console.error(
        `error during lambda invocation: ${lambdaName} and ${event}, \nwith error:${error}`,
      );
    }

    // TODO Add Mocks CVSB-19153
    // return Promise.resolve({
    //   testTypeClassification: "foo",
    //   linkedTestCode: "linkedTestCode",
    //   defaultTestCode: "defaultTestCode",
    // });
  }

  public async createTestNumber(): Promise<any> {
    const event = {
      path: '/test-number/',
      httpMethod: 'POST',
      resource: '/test-number/',
    };

    const lambdaName =
      TestResultsDAO.lambdaInvokeEndpoints.functions.getTestNumber.name;
    try {
      const lambdaResult = LambdaService.invoke(lambdaName, event);
      return await lambdaResult;
    } catch (error) {
      console.error(
        `error during lambda invocation: ${lambdaName} and ${event}, \nwith error:${error}`,
      );
    }

    // TODO Add Mocks CVSB-19153
    // return Promise.resolve({
    //   id: "W01",
    //   certLetter: "A",
    //   sequenceNumber: "003",
    //   testNumber: "W01A00330",
    //   testNumberKey: 1,
    // });
  }

  public updateTestResult(
    updatedTestResult: models.ITestResult,
  ): Promise<TransactWriteCommandOutput | ServiceException> {
    const query: TransactWriteCommandInput = {
      TransactItems: [
        {
          Put: {
            TableName: this.tableName,
            Item: updatedTestResult,
            ConditionExpression:
              'systemNumber = :systemNumber AND testResultId = :oldTestResultId AND vin = :vin',
            ExpressionAttributeValues: {
              ':systemNumber': updatedTestResult.systemNumber,
              ':vin': updatedTestResult.vin,
              ':oldTestResultId': updatedTestResult.testResultId,
            },
          },
        },
      ],
    };
    return TestResultsDAO.docClient.send(new TransactWriteCommand(query));
  }

  private async queryAllData(
    params: any,
    allData: models.ITestResult[] = [],
  ): Promise<models.ITestResult[]> {
    const data: QueryCommandOutput | ServiceException =
      await TestResultsDAO.docClient.send(new QueryCommand(params));

    if (data.Items && data.Items.length > 0) {
      allData = [...allData, ...(data.Items as models.ITestResult[])];
    }

    if (data.LastEvaluatedKey) {
      params.ExclusiveStartKey = data.LastEvaluatedKey;
      return this.queryAllData(params, allData);
    }
    return allData;
  }

  private getOptionalFilters(
    filterExpress: string,
    filters: models.ITestResultFilters,
  ): string {
    const { testStationPNumber } = filters;
    filterExpress = testStationPNumber
      ? filterExpress.concat(' AND testStationPNumber= :testStationPNumber')
      : filterExpress;
    return filterExpress;
  }

  private mapFilterValues(filters: models.ITestResultFilters) {
    const filterValues: models.FilterValue[] = [];
    const { fromDateTime, toDateTime, testStationPNumber } = filters;

    if (fromDateTime) {
      filterValues.push({ ':testStartTimestamp': fromDateTime.toISOString() });
    }
    if (toDateTime) {
      filterValues.push({ ':testEndTimestamp': toDateTime.toISOString() });
    }
    if (testStationPNumber) {
      filterValues.push({ ':testStationPNumber': testStationPNumber });
    }
    return filterValues;
  }
}
