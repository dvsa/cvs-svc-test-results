const AWS = require('aws-sdk')
const Configuration = require('../utils/Configuration')
const dbConfig = Configuration.getInstance().getDynamoDBConfig()
const dbClient = new AWS.DynamoDB.DocumentClient(dbConfig.params)
const lambdaInvokeEndpoints = Configuration.getInstance().getEndpoints()
const validateInvocationResponse = require('../utils/validateInvocationResponse')

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
      let payload = validateInvocationResponse(data)
      let body = JSON.parse(payload.body)
      return body
    })
  }

  getTestNumber () {
    let generateTestNumberLambda = new AWS.Lambda(lambdaInvokeEndpoints.params)

    var event = {
      path: '/test-number/',
      httpMethod: 'POST',
      resource: '/test-number/'
    }

    return generateTestNumberLambda.invoke({
      FunctionName: lambdaInvokeEndpoints.functions.getTestNumber.name,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(event)
    }).promise().then((data) => {
      let payload = validateInvocationResponse(data)
      let body = JSON.parse(payload.body)
      return body
    })
  }
}

module.exports = TestResultsDAO
