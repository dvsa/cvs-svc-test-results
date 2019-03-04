'use strict'

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')
const dateFns = require('date-fns')

const getTestResults = (event) => {
  const testResultsDAO = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDAO)
  if (!event) {
    return Promise.resolve(new HTTPResponse(500, 'AWS Event is undefined.'))
  }

  switch (event.httpMethod) {
    case 'GET':
      const vin = (process.env.BRANCH === 'local') ? event.pathParameters.vin : event.pathParameters.proxy
      var testStatus = 'submitted'
      var toDateTime = dateFns.endOfToday()
      var fromDateTime = dateFns.subYears(toDateTime, 2)
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
    case 'POST':
      let payload = event.body

      try {
        payload = JSON.parse(event.body)
      } catch (e) {
        return Promise.resolve(new HTTPResponse(400, 'Body is not a valid JSON.'))
      }

      if (!payload) {
        return Promise.resolve(new HTTPResponse(400, 'Body is not a valid JSON.'))
      }

      return testResultsService.insertTestResult(payload)
        .then(() => {
          return new HTTPResponse(201, 'Test records created')
        })
        .catch((error) => {
          return new HTTPResponse(error.statusCode, error.body)
        })
  }
}

module.exports = getTestResults
