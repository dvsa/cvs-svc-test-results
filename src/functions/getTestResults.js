'use strict'

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')
const dateFns = require('../../node_modules/date-fns')

const getTestResults = (event) => {
  const testResultsDao = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDao)

  const vin = event.pathParameters.vin
  var testStatus = 'submitted'
  var toDateTime = dateFns.endOfToday()
  var fromDateTime = dateFns.subYears(toDateTime, 2)

  if (event.queryStringParameters) {
    if (event.queryStringParameters.status) { testStatus = event.queryStringParameters.status }
    if (event.queryStringParameters.toDateTime) { toDateTime = new Date(event.queryStringParameters.toDateTime) }
    if (event.queryStringParameters.fromDateTime) { fromDateTime = new Date(event.queryStringParameters.fromDateTime) }
  }
  return testResultsService.getTestResultsByVinAndStatus(vin, testStatus, fromDateTime, toDateTime)
    .then((data) => {
      return new HTTPResponse(200, data)
    })
    .catch((error) => {
      console.error(error)
      return new HTTPResponse(error.statusCode, error.body)
    })
}

module.exports = getTestResults
