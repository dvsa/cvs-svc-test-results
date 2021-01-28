import { PromiseResult } from "aws-sdk/lib/request";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import { AWSError } from "aws-sdk/lib/error";
import * as models from "../models";
import { Configuration } from "../utils/Configuration";
import { LambdaService } from "../services/LambdaService";

/* tslint:disable */
let AWS: { DynamoDB: { DocumentClient: new (arg0: any) => DocumentClient } };
if (process.env._X_AMZN_TRACE_ID) {
  AWS = require("aws-xray-sdk").captureAWS(require("aws-sdk"));
} else {
  console.log("Serverless Offline detected; skipping AWS X-Ray setup");
  AWS = require("aws-sdk");
}
/* tslint:enable */

export class TestResultsDAO {
  private readonly tableName: string;
  private static docClient: DocumentClient;
  private static lambdaInvokeEndpoints: any;

  constructor() {
    const config: models.IDBConfig = Configuration.getInstance().getDynamoDBConfig();

    this.tableName = config.table;
    if (!TestResultsDAO.docClient) {
      TestResultsDAO.docClient = new AWS.DynamoDB.DocumentClient(config.params);
    }
    if (!TestResultsDAO.lambdaInvokeEndpoints) {
      TestResultsDAO.lambdaInvokeEndpoints = Configuration.getInstance().getEndpoints();
    }
  }

  public getBySystemNumber(systemNumber: any) {
    const params = {
      TableName: this.tableName,
      IndexName: "SysNumIndex",
      KeyConditionExpression: "#systemNumber = :systemNumber",
      ExpressionAttributeNames: {
        "#systemNumber": "systemNumber",
      },
      ExpressionAttributeValues: {
        ":systemNumber": systemNumber,
      },
    };
    console.log("getBySystemNumber: PARAMS ->", params);
    return TestResultsDAO.docClient.query(params).promise();
  }

  public getByTesterStaffId(
    testerStaffId: string
  ): Promise<models.ITestResult[]> {
    const params = {
      TableName: this.tableName,
      IndexName: "TesterStaffIdIndex",
      KeyConditionExpression: "#testerStaffId = :testerStaffId",
      ExpressionAttributeNames: {
        "#testerStaffId": "testerStaffId",
      },
      ExpressionAttributeValues: {
        ":testerStaffId": testerStaffId,
      },
    };
    console.log("getByTesterStaffId: PARAMS ->", params);
    return this.queryAllData(params);
  }

  public createSingle(payload: models.ITestResultPayload) {
    const query = {
      TableName: this.tableName,
      Item: payload,
      ConditionExpression: "testResultId <> :testResultIdVal",
      ExpressionAttributeValues: {
        ":testResultIdVal": payload.testResultId,
      },
    };
    return TestResultsDAO.docClient.put(query).promise();
  }

  public createMultiple(
    testResultsItems: models.ITestResult[]
  ): Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWSError>> {
    const params = this.generateBatchWritePartialParams();

    testResultsItems.forEach((testResultItem: models.ITestResult) => {
      params.RequestItems[this.tableName].push({
        PutRequest: {
          Item: testResultItem,
        },
      });
    });

    return TestResultsDAO.docClient.batchWrite(params).promise();
  }

  public deleteMultiple(
    systemNumberIdPairsToBeDeleted: any[]
  ): Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWSError>> {
    const params = this.generateBatchWritePartialParams();

    systemNumberIdPairsToBeDeleted.forEach(
      (systemNumberIdPairToBeDeleted: any) => {
        const systemNumberToBeDeleted: string = Object.keys(
          systemNumberIdPairToBeDeleted
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
      }
    );

    return TestResultsDAO.docClient.batchWrite(params).promise();
  }

  public generateBatchWritePartialParams(): any {
    return {
      RequestItems: {
        [this.tableName]: Array(),
      },
    };
  }

  public getTestCodesAndClassificationFromTestTypes(
    testTypeId: string,
    testTypeParams: models.TestTypeParams
  ) {
    const fields = "defaultTestCode,linkedTestCode,testTypeClassification";
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
      path: "/test-types/" + testTypeId,
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
      httpMethod: "GET",
      resource: "/test-types/{id}",
    };

    console.log("queryString for get Test: ", event);
    return LambdaService.invoke(
      TestResultsDAO.lambdaInvokeEndpoints.functions.getTestTypesById.name,
      event
    );
  }

  public getTestNumber(): any {
    const event = {
      path: "/test-number/",
      httpMethod: "POST",
      resource: "/test-number/",
    };

    return LambdaService.invoke(
      TestResultsDAO.lambdaInvokeEndpoints.functions.getTestNumber.name,
      event
    );
  }

  public getActivity(filters: models.ActivityParams): any {
    const event = {
      path: "/activities/details",
      queryStringParameters: {
        fromStartTime: filters.fromStartTime,
        toStartTime: filters.toStartTime,
        activityType: filters.activityType,
        testStationPNumber: filters.testStationPNumber,
        testerStaffId: filters.testerStaffId,
      },
      httpMethod: "GET",
      resource: "/activities/details",
    };

    return LambdaService.invoke(
      TestResultsDAO.lambdaInvokeEndpoints.functions.getActivity.name,
      event
    );
  }

  public updateTestResult(
    updatedTestResult: models.ITestResult
  ): Promise<PromiseResult<DocumentClient.TransactWriteItemsOutput, AWSError>> {
    const query: DocumentClient.TransactWriteItemsInput = {
      TransactItems: [
        {
          Put: {
            TableName: this.tableName,
            Item: updatedTestResult,
            ConditionExpression:
              "systemNumber = :systemNumber AND testResultId = :oldTestResultId AND vin = :vin",
            ExpressionAttributeValues: {
              ":systemNumber": updatedTestResult.systemNumber,
              ":vin": updatedTestResult.vin,
              ":oldTestResultId": updatedTestResult.testResultId,
            },
          },
        },
      ],
    };
    return TestResultsDAO.docClient.transactWrite(query).promise();
  }

  private async queryAllData(
    params: any,
    allData: models.ITestResult[] = []
  ): Promise<models.ITestResult[]> {
    const data: PromiseResult<
      DocumentClient.QueryOutput,
      AWSError
    > = await TestResultsDAO.docClient.query(params).promise();

    if (data.Items && data.Items.length > 0) {
      allData = [...allData, ...(data.Items as models.ITestResult[])];
    }

    if (data.LastEvaluatedKey) {
      params.ExclusiveStartKey = data.LastEvaluatedKey;
      return this.queryAllData(params, allData);
    } else {
      return allData;
    }
  }
}
