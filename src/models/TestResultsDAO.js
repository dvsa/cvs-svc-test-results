const AWS = require('aws-sdk')
const generateConfig = require('../config/generateConfig')
const config = generateConfig()
const dbClient = new AWS.DynamoDB.DocumentClient(config.DYNAMODB_DOCUMENTCLIENT_PARAMS)
const HTTPError = require('../models/HTTPError')
const rp = require('request-promise')

class TestResultsDAO {
  constructor () {
    this.tableName = config.DYNAMODB_TABLE_NAME
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
    let options = {
      uri: `${config.TEST_TYPES_ENDPOINT}/${testTypeId}?vehicleType=${vehicleType}&vehicleSize=${vehicleSize}&vehicleConfiguration=${vehicleConfiguration}&fields=${fields}`,
      json: true,
      port: 3006
    }

    return rp(options).then(testCodeAndClassificationResponse => {
      return testCodeAndClassificationResponse
    }).catch(err => {
      console.error(err)
      throw new HTTPError(500, 'Internal Server Error')
    })
  }
}

module.exports = TestResultsDAO
