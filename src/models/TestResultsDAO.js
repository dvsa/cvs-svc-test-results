const AWS = require('aws-sdk')
const Configuration = require('../utils/Configuration')
const dbConfig = Configuration.getInstance().getDynamoDBConfig()
const dbClient = new AWS.DynamoDB.DocumentClient(dbConfig.params)
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
    let testTypesLambdaConfig = Configuration.getInstance().getEndpoints('getTestTypesById')
    const fields = 'defaultTestCode,linkedTestCode,testTypeClassification'
    let testTypesLambda = new AWS.Lambda({
      apiVersion: testTypesLambdaConfig.apiVersion
      // ,
      // region: testTypesLambdaConfig.region,
      // endpoint: testTypesLambdaConfig.endpoint
    })
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
      FunctionName: testTypesLambdaConfig.functionName,
      InvocationType: "Event",
      Payload: JSON.stringify(event)
    }).promise().then((data) => {
      return data.Payload
    }).catch((error) => {
      return new HTTPError(error.StatusCode, error.body)
    })
  }

  // TO BE REFACTORED...
  // getTestNumber () {
  //   let options = {
  //     uri: `${config.TEST_NUMBER_ENDPOINT}`,
  //     method: 'POST',
  //     json: true,
  //     port: 3008
  //   }
  //   return rp(options).then(testNumberResponse => {
  //     return testNumberResponse
  //   })
  // }
}

module.exports = TestResultsDAO
