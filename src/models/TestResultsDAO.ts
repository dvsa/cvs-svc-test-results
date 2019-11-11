import { Configuration } from "../utils/Configuration";
import { IDBConfig } from "./IDBConfig";
import {ITestResult} from "./ITestResult";
import {LambdaService} from "../services/LambdaService";
import { ITestResultPayload } from "./ITestResultPayload";
import { PromiseResult } from "aws-sdk/lib/request";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import {AWSError} from "aws-sdk/lib/error";
/* tslint:disable */
let AWS: { DynamoDB: { DocumentClient: new (arg0: any) => DocumentClient; }; };
if (process.env._X_AMZN_TRACE_ID) {
  AWS = require("aws-xray-sdk").captureAWS(require("aws-sdk"));
} else {
  console.log("Serverless Offline detected; skipping AWS X-Ray setup")
  AWS = require("aws-sdk");
}
/* tslint:enable */

export class TestResultsDAO {
  private readonly tableName: string;
  private static docClient: DocumentClient;
  private static lambdaInvokeEndpoints: any;

  constructor() {
    const config: IDBConfig = Configuration.getInstance().getDynamoDBConfig();

    this.tableName = config.table;
    if (!TestResultsDAO.docClient) {
      TestResultsDAO.docClient = new AWS.DynamoDB.DocumentClient(config.params);
    }
    if (!TestResultsDAO.lambdaInvokeEndpoints) {
      TestResultsDAO.lambdaInvokeEndpoints = Configuration.getInstance().getEndpoints();
    }
  }

  public getByVin(vin: any) {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "#vin = :vin",
      ExpressionAttributeNames: {
        "#vin": "vin"
      },
      ExpressionAttributeValues: {
        ":vin": vin
      }
    };
    return TestResultsDAO.docClient.query(params).promise();
  }

  public getByTesterStaffId(testerStaffId: any) {
    const params = {
      TableName: this.tableName,
      IndexName: "TesterStaffIdIndex",
      KeyConditionExpression: "#testerStaffId = :testerStaffId",
      ExpressionAttributeNames: {
        "#testerStaffId": "testerStaffId"
      },
      ExpressionAttributeValues: {
        ":testerStaffId": testerStaffId
      }
    };

    return TestResultsDAO.docClient.query(params).promise();
  }

  public createSingle(payload: ITestResultPayload) {
    const query = {
      TableName: this.tableName,
      Item: payload,
      ConditionExpression: "testResultId <> :testResultIdVal",
      ExpressionAttributeValues: {
        ":testResultIdVal": payload.testResultId
      }
    };
    return TestResultsDAO.docClient.put(query).promise();
  }

  public createMultiple(testResultsItems: ITestResult[] ): Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWSError>>  {
    const params = this.generateBatchWritePartialParams();

    testResultsItems.forEach((testResultItem: ITestResult) => {
      params.RequestItems[this.tableName].push(
        {
          PutRequest:
            {
              Item: testResultItem
            }
        });
    });

    return TestResultsDAO.docClient.batchWrite(params).promise();
  }

  public deleteMultiple(vinIdPairsToBeDeleted: any[]): Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWSError>>  {
    const params = this.generateBatchWritePartialParams();

    vinIdPairsToBeDeleted.forEach((vinIdPairToBeDeleted: any) => {
      const vinToBeDeleted: string = Object.keys(vinIdPairToBeDeleted)[0];
      const testResultIdToBeDeleted: string = vinIdPairToBeDeleted[vinToBeDeleted];

      params.RequestItems[this.tableName].push(
        {
          DeleteRequest:
          {
            Key:
            {
              vin: vinToBeDeleted,
              testResultId: testResultIdToBeDeleted
            }
          }
        }
      );
    });

    return TestResultsDAO.docClient.batchWrite(params).promise();
  }

  public generateBatchWritePartialParams(): any {
    return {
      RequestItems:
      {
        [this.tableName]: Array()
      }
    };
  }

  public getTestCodesAndClassificationFromTestTypes(testTypeId: string, vehicleType: any, vehicleSize: any, vehicleConfiguration: any, noOfAxles: any) {
    const fields = "defaultTestCode,linkedTestCode,testTypeClassification";

    const event = {
      path: "/test-types/" + testTypeId,
      queryStringParameters: {
        vehicleType,
        vehicleSize,
        vehicleConfiguration,
        vehicleAxles: noOfAxles,
        fields
      },
      pathParameters: {
        id: testTypeId
      },
      httpMethod: "GET",
      resource: "/test-types/{id}"
    };

    return LambdaService.invoke(TestResultsDAO.lambdaInvokeEndpoints.functions.getTestTypesById.name, event);
  }

  public getTestNumber(): any {
    const event = {
      path: "/test-number/",
      httpMethod: "POST",
      resource: "/test-number/"
    };

    return LambdaService.invoke(TestResultsDAO.lambdaInvokeEndpoints.functions.getTestNumber.name, event);
  }
}
