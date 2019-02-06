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

  setTestCodeByCallingTestTypes (payload) {
    var vehicleType = payload.vehicleType
    var vehicleSize = payload.vehicleSize
    var vehicleConfiguration = payload.vehicleConfiguration
    var fields = 'defaultTestCode,linkedTestCode'
    if (payload.testTypes.length === 0) {
      return Promise.reject(new HTTPError(400, 'Bad request'))
    } else if (payload.testTypes.length === 1) {
      var testTypeId = payload.testTypes[0].testId
      let options = {
        uri: `${config.TEST_TYPES_ENDPOINT}/${testTypeId}?vehicleType=${vehicleType}&vehicleSize=${vehicleSize}&vehicleConfiguration=${vehicleConfiguration}&fields=${fields}`,
        json: true,
        port: 3006
      }

      return rp(options).then(testCodeResponse => {
        payload.testTypes[0].testCode = testCodeResponse.defaultTestCode
        return payload
      }).catch(err => {
        console.error(err)
        throw new HTTPError(500, 'Internal Server Error')
      })
    } else {
      var promiseArray = []
      var testCodes = []
      for (let i = 0; i < payload.testTypes.length; i++) {
        testTypeId = payload.testTypes[i].testId

        let options = {
          uri: `${config.TEST_TYPES_ENDPOINT}/${testTypeId}?vehicleType=${vehicleType}&vehicleSize=${vehicleSize}&vehicleConfiguration=${vehicleConfiguration}&fields=${fields}`,
          json: true,
          port: 3006
        }

        const promise = rp(options).then(testCodeResponse => {
          testCodes.push(testCodeResponse)
        }).catch((err) => {
          console.error(err)
          throw new HTTPError(500, 'Internal Server Error')
        })
        promiseArray.push(promise)
      }

      return Promise.all(promiseArray).then(() => {
        for (let i = 0; i < payload.testTypes.length; i++) {
          if (testCodes[i].linkedTestCode) {
            payload.testTypes[i].testCode = testCodes[i].linkedTestCode
          } else {
            payload.testTypes[i].testCode = testCodes[i].defaultTestCode
          }
        }
      }).then(() => {
        return payload
      })
    }
  }
}

module.exports = TestResultsDAO
