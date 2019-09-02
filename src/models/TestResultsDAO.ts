import { default as unwrappedAWS } from "aws-sdk";
import { Configuration } from "../utils/Configuration";
import { IDBConfig } from "./IDBConfig";
import {ITestResult} from "./ITestResult";
import {LambdaService} from "../services/LambdaService";
import { ITestResultPayload } from "./ITestResultPayload";
import { PromiseResult } from "aws-sdk/lib/request";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
/* tslint:disable */
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(unwrappedAWS);
/* tslint:enable */

const dbConfig = Configuration.getInstance().getDynamoDBConfig();
const dbClient = new AWS.DynamoDB.DocumentClient(dbConfig.params);
const lambdaInvokeEndpoints = Configuration.getInstance().getEndpoints();


export class TestResultsDAO {
  private readonly tableName: string;
  constructor() {
    const config: IDBConfig = Configuration.getInstance().getDynamoDBConfig();
    this.tableName = dbConfig.table;
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
    return dbClient.query(params).promise();
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

    return dbClient.query(params).promise();
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
    return dbClient.put(query).promise();
  }

  public createMultiple(testResultsItems: ITestResult[] ): Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWS.AWSError>>  {
    const params = this.generateBatchWritePartialParams();

    testResultsItems.map((testResultItem: ITestResult) => {
      params.RequestItems[this.tableName].push(
        {
          PutRequest:
            {
              Item: testResultItem
            }
        });
    });

    return dbClient.batchWrite(params).promise();
  }

  public deleteMultiple(vinIdPairsToBeDeleted: any[]): Promise<PromiseResult<DocumentClient.BatchWriteItemOutput, AWS.AWSError>>  {
    let params = this.generateBatchWritePartialParams();

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

    return dbClient.batchWrite(params).promise();
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

    return LambdaService.invoke(lambdaInvokeEndpoints.functions.getTestTypesById.name, event);
  }

  public getTestNumber(): any {
    const event = {
      path: "/test-number/",
      httpMethod: "POST",
      resource: "/test-number/"
    };

    return LambdaService.invoke(lambdaInvokeEndpoints.functions.getTestNumber.name, event);
  }
}
