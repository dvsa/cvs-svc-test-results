'use strict'

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')
const dateFns = require('../../node_modules/date-fns')

const testResultsLambda = (event) => {
  const testResultsDAO = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDAO)

  if (event && event.httpMethod === 'POST') {
    let payload = event.body

    try {
      payload = JSON.parse(event.body)
    } catch (e) {
      return new HTTPResponse(400, 'Body is not a valid JSON.')
    }

    return testResultsService.insertTestResult(payload)
      .then(() => {
        return new HTTPResponse(201, 'Test records created')
      })
      .catch((error) => {
        console.error(error)
        return new HTTPResponse(error.statusCode, error.body)
      })
  } else
  if (event && event.httpMethod === 'GET') {
    const vin = (process.env.BRANCH === 'local') ? event.pathParameters.vin : (event.pathParameters.proxy).substr(14, (event.pathParameters.proxy).length)
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
        return new HTTPResponse(error.statusCode, error.body)
      })
  }
}

module.exports = testResultsLambda
