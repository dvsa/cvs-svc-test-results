'use strict'

const HTTPError = require('../models/HTTPError')
const testResultsSchema = require('../models/TestResultsSchema')
const uuidv4 = require('uuid/v4')
const Joi = require('joi')
const dateFns = require('../../node_modules/date-fns')
const rp = require('request-promise')

/**
 * Service for retrieving and creating Test Results from/into the db
 * @returns Promise
 */
class TestResultsService {
  constructor (testResultsDAO) {
    this.testResultsDAO = testResultsDAO
  }

  getTestResultsByVinAndStatus (vin, status, fromDateTime, toDateTime) {
    return this.testResultsDAO.getByVin(vin)
      .then(data => {
        if (data.Count === 0) {
          throw new HTTPError(404, 'No resources match the search criteria')
        }

        const testResults = data.Items

        // filter by status
        var filteredTestResults = testResults.filter(
          function (testResult) { return testResult.testStatus === status }
        )

        // filter by date
        for (let i = 0; i < filteredTestResults.length; i++) {
          filteredTestResults[i].testTypes = filteredTestResults[i].testTypes.filter(
            function (testType) {
              return (!(dateFns.isAfter(testType.createdAt, toDateTime) || dateFns.isBefore(testType.createdAt, fromDateTime)))
            })
        }

        // if after filtering, there are any testResult items that contain no testType, remove the whole testResult from response
        filteredTestResults = filteredTestResults.filter(
          function (testResult) {
            return testResult.testTypes.length !== 0
          })

        if (filteredTestResults.length === 0) {
          throw new HTTPError(404, 'No resources match the search criteria')
        }

        // remove testResultId property from objects
        for (let i = 0; i < filteredTestResults.length; i++) { delete filteredTestResults[i].testResultId }

        return filteredTestResults
      })
      .catch(error => {
        if (!(error instanceof HTTPError)) {
          console.error(error)
          error = new HTTPError(500, 'Internal Server Error')
        }
        throw error
      })
  }

  insertTestResult (payload) {
    Object.assign(payload, { testResultId: uuidv4() })

    let validation = Joi.validate(payload, testResultsSchema)

    if (validation.error) {
      return Promise.reject(new HTTPError(400, {
        errors: validation.error.details.map((details) => {
          return details.message
        })
      }))
    }

    payload = this.setTestCode(payload)

    return this.testResultsDAO.createSingle(payload)
      .catch((error) => {
        throw new HTTPError(error.statusCode, error.message)
      })
  }

  setTestCode (payload) {
    var vehicleType = payload.vehicleType
    var vehicleSize = 'large'
    var vehicleConfiguration = payload.vehicleConfiguration

    if (payload.testTypes.length === 0) {
      return Promise.reject(new HTTPError(400, 'Bad request'))
    } else if (payload.testTypes.length === 1) {
      var testTypeId = payload.testTypes[0].testID
      let options = {
        uri: `http://localhost/${testTypeId}?vehicleType=${vehicleType}&vehicleSize=${vehicleSize}&vehicleConfiguration=${vehicleConfiguration}`,
        json: true
      }

      return rp(options)
        .then(testCodeResponse => {
          payload.testTypes[0].testCode = testCodeResponse.defaultTestCode
          return payload
        }).catch(err => {
          console.error(err)
          throw new HTTPError(500, 'Internal Server Error')
        })
    } else {
      for (let i = 0; i < payload.testTypes.length; i++) {
        testTypeId = payload.testTypes[i].testID

        let options = {
          uri: `http://localhost/${testTypeId}?vehicleType=${vehicleType}&vehicleSize=${vehicleSize}&vehicleConfiguration=${vehicleConfiguration}`,
          json: true
        }

        return rp(options)
          .then(testCodeResponse => {
            payload.testTypes[i].testCode = (testCodeResponse.linkedTestCode) ? testCodeResponse.linkedTestCode : testCodeResponse.defaultTestCode
            return payload
          }).catch(err => {
            console.error(err)
            throw new HTTPError(500, 'Internal Server Error')
          })
      }
    }
  }

  insertTestResultsList (testResultsItems) {
    return this.testResultsDAO.createMultiple(testResultsItems)
      .then(data => {
        if (data.UnprocessedItems) { return data.UnprocessedItems }
      })
      .catch((error) => {
        if (error) {
          console.error(error)
          throw new HTTPError(500, 'Internal Server Error')
        }
      })
  }

  deleteTestResultsList (testResultsVinIdPairs) {
    return this.testResultsDAO.deleteMultiple(testResultsVinIdPairs)
      .then((data) => {
        if (data.UnprocessedItems) {
          return data.UnprocessedItems
        }
      })
      .catch((error) => {
        if (error) {
          console.error(error)
          throw new HTTPError(500, 'Internal ServerError')
        }
      })
  }
}

module.exports = TestResultsService
