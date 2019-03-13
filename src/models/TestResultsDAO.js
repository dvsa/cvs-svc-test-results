const AWSXRay = require('aws-xray-sdk')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const Configuration = require('../utils/Configuration')
const dbConfig = Configuration.getInstance().getDynamoDBConfig()
const dbClient = new AWS.DynamoDB.DocumentClient(dbConfig.params)
const lambdaInvokeEndpoints = Configuration.getInstance().getEndpoints()
const HTTPError = require('../models/HTTPError')

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

  createSingle (payload) {
    const query = {
      TableName: this.tableName,
      Item: payload
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
  getTestCodesAndClassificationFromTestTypes (testTypeId, vehicleType, vehicleSize, vehicleConfiguration) {
    const fields = 'defaultTestCode,linkedTestCode,testTypeClassification'
    
    let testTypesLambda = new AWS.Lambda(lambdaInvokeEndpoints.params)

    var event = {
      path: '/test-types/' + testTypeId,
      queryStringParameters: {
        vehicleType: vehicleType,
        vehicleSize: vehicleSize,
        vehicleConfiguration: vehicleConfiguration,
        fields: fields
      },
      pathParameters: {
        id: testTypeId
      },
      httpMethod: 'GET',
      resource: '/test-types/{id}'
    }
    return testTypesLambda.invoke({
      FunctionName: lambdaInvokeEndpoints.functions.getTestTypesById.name,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(event)
    }).promise().then((data) => {
      return data.Payload
    }).catch((error) => {
      return new HTTPError(error.StatusCode, error.body)
    })
  }

}

module.exports = TestResultsDAO
