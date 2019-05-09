const AWSXRay = require('aws-xray-sdk')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const Configuration = require('../utils/Configuration')
const dbConfig = Configuration.getInstance().getDynamoDBConfig()
const dbClient = new AWS.DynamoDB.DocumentClient(dbConfig.params)
const lambdaInvokeEndpoints = Configuration.getInstance().getEndpoints()
const lambdaService = require('../services/LambdaService')

class TestResultsDAO {
  constructor () {
    this.tableName = dbConfig.table
  }

  getByVin (vin) {
    let params = {
      TableName: this.tableName,
      KeyConditionExpression: '#vin = :vin',
      ExpressionAttributeNames: {
        '#vin': 'vin'
      },
      ExpressionAttributeValues: {
        ':vin': vin
      }
    }
    return dbClient.query(params).promise()
  }

  getByTesterStaffId (testerStaffId) {
    let params = {
      TableName: this.tableName,
      IndexName: 'TesterStaffIdIndex',
      KeyConditionExpression: '#testerStaffId = :testerStaffId',
      ExpressionAttributeNames: {
        '#testerStaffId': 'testerStaffId'
      },
      ExpressionAttributeValues: {
        ':testerStaffId': testerStaffId
      }
    }

    return dbClient.query(params).promise()
  }

  createSingle (payload) {
    const query = {
      TableName: this.tableName,
      Item: payload,
      ConditionExpression: 'testResultId <> :testResultIdVal',
      ExpressionAttributeValues: {
        ':testResultIdVal': payload.testResultId
      }
    }
    return dbClient.put(query).promise()
  }

  createMultiple (testResultsItems) {
    var params = this.generateBatchWritePartialParams()

    testResultsItems.forEach(testResultItem => {
      params.RequestItems[this.tableName].push(
        {
          PutRequest:
            {
              Item: testResultItem
            }
        })
    })

    return dbClient.batchWrite(params).promise()
  }

  deleteMultiple (vinIdPairsToBeDeleted) {
    var params = this.generateBatchWritePartialParams()

    vinIdPairsToBeDeleted.forEach((vinIdPairToBeDeleted) => {
      var vinToBeDeleted = Object.keys(vinIdPairToBeDeleted)[0]
      var testResultIdToBeDeleted = vinIdPairToBeDeleted[vinToBeDeleted]

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
      )
    })

    return dbClient.batchWrite(params).promise()
  }

  generateBatchWritePartialParams () {
    return {
      RequestItems:
      {
        [this.tableName]: []
      }
    }
  }

  getTestCodesAndClassificationFromTestTypes (testTypeId, vehicleType, vehicleSize, vehicleConfiguration, noOfAxles) {
    const fields = 'defaultTestCode,linkedTestCode,testTypeClassification'

    var event = {
      path: '/test-types/' + testTypeId,
      queryStringParameters: {
        vehicleType: vehicleType,
        vehicleSize: vehicleSize,
        vehicleConfiguration: vehicleConfiguration,
        vehicleAxles: noOfAxles,
        fields: fields
      },
      pathParameters: {
        id: testTypeId
      },
      httpMethod: 'GET',
      resource: '/test-types/{id}'
    }

    return lambdaService.invoke(lambdaInvokeEndpoints.functions.getTestTypesById.name, event)
  }

  getTestNumber () {
    var event = {
      path: '/test-number/',
      httpMethod: 'POST',
      resource: '/test-number/'
    }

    return lambdaService.invoke(lambdaInvokeEndpoints.functions.getTestNumber.name, event)
  }
}

module.exports = TestResultsDAO
