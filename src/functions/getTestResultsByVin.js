'use strict'

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')
const dateFns = require('date-fns')

const getTestResultsByVin = (event) => {
  const testResultsDAO = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDAO)

  const vin = event.pathParameters.vin;
  let testStatus = 'submitted'
  let toDateTime = dateFns.endOfToday()
  let fromDateTime = dateFns.subYears(toDateTime, 2)

  if (event.queryStringParameters) {
    if (event.queryStringParameters.toDateTime === '') {
      return Promise.resolve(new HTTPResponse(400, 'Bad Request'))
    } else if (event.queryStringParameters.fromDateTime === '') {
      return Promise.resolve(new HTTPResponse(400, 'Bad Request'))
    } else {
      if (event.queryStringParameters.status) { testStatus = event.queryStringParameters.status }
      if (event.queryStringParameters.toDateTime) { toDateTime = new Date(event.queryStringParameters.toDateTime) }
      if (event.queryStringParameters.fromDateTime) { fromDateTime = new Date(event.queryStringParameters.fromDateTime) }
    }
  }

  return testResultsService.getTestResultsByVinAndStatus(vin, testStatus, fromDateTime, toDateTime)
    .then((data) => {
      return new HTTPResponse(200, data)
    })
    .catch((error) => {
      return new HTTPResponse(error.statusCode, error.body)
    })
}

module.exports.getTestResultsByVin = getTestResultsByVin
