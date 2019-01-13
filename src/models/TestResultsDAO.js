const AWS = require('aws-sdk')
const generateConfig = require('../config/generateConfig')
const config = generateConfig()
const dbClient = new AWS.DynamoDB.DocumentClient(config.DYNAMODB_DOCUMENTCLIENT_PARAMS)

class TestResultsDAO {
  constructor () {
    this.tableName = config.DYNAMODB_TABLE_NAME
  }

  getAll () {
    return dbClient.scan({ TableName: this.tableName }).promise()
  }

  getByVin (vin) {
    var params = this.generateReadPartialParams()
    params.RequestItems[this.tableName].Keys.push(
      {
        vin: vin
      }
    )
    return dbClient.batchGet(params).promise()
  }

  createMultiple (testResultsItems) {
    var params = this.generateWritePartialParams()

    testResultsItems.forEach(testResultsItem => {
      params.RequestItems[this.tableName].push(
        {
          PutRequest:
            {
              Item: testResultsItem
            }
        })
    })

    return dbClient.batchWrite(params).promise()
  }

  deleteMultiple (vinsToBeDeleted) {
    var params = this.generateWritePartialParams()

    vinsToBeDeleted.forEach(vinToBeDeleted => {
      params.RequestItems[this.tableName].push(
        {
          DeleteRequest:
          {
            Key:
            {
              vin: vinToBeDeleted
            }
          }
        }
      )
    })
    return dbClient.batchWrite(params).promise()
  }

  generateWritePartialParams () {
    return {
      RequestItems:
      {
        [this.tableName]: []
      }
    }
  }

  generateReadPartialParams () {
    return {
      RequestItems:
      {
        [this.tableName]: {
          Keys: []
        }
      }
    }
  }
}

module.exports = TestResultsDAO
