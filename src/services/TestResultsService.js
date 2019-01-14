'use strict'

const HTTPError = require('../models/HTTPError')
const testResultsSchema = require('../models/TestResultsSchema')
const uuidv4 = require('uuid/v4')
const Joi = require('joi')
const dateFns = require('../../node_modules/date-fns')

/**
 * Fetches the entire list of Technical Records from the database.
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

    return this.testResultsDAO.createSingle(payload)
      .catch((error) => {
        throw new HTTPError(error.statusCode, error.message)
      })
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

  deleteTestResultsList (testResultsVins) {
    return this.testResultsDAO.deleteMultiple(testResultsVins)
      .then((data) => {
        if (data.UnprocessedItems) { return data.UnprocessedItems }
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
