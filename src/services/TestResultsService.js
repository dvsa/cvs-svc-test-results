'use strict'

const HTTPError = require('../models/HTTPError')
const dateFns = require('../../node_modules/date-fns')
/**
 * Fetches the entire list of Technical Records from the database.
 * @returns Promise
 */
class TestResultsService {
  constructor (testResultsDAO) {
    this.testResultsDAO = testResultsDAO
  }

  getTestResultsByVinAndStatus (vin, testStatus, fromDateTime, toDateTime) {
    return this.testResultsDAO.getByVin(vin)
      .then(data => {
        if (data.UnprocessedKeys > 0) {
          throw new HTTPError(501, 'Unprocessed Items')
        } else if ((data.Responses[this.testResultsDAO.tableName]).length === 0) {
          throw new HTTPError(404, 'No resources match the search criteria')
        }

        var testResults = data.Responses[this.testResultsDAO.tableName][0].testResults
        // filter by status
        var filteredTestResults = testResults.filter(
          function (testResult) { return testResult.testStatus === testStatus }
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
