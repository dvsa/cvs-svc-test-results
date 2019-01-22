'use strict'

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')
const dateFns = require('date-fns')
const Path = require('path-parser').default

const getTestResults = (event) => {
  const testResultsDAO = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDAO)

  const basePath = '/test-results'
  const path = (process.env.BRANCH === 'local') ? event.path : `${basePath}/${event.pathParameters.proxy}`

  if (!event) {
    return Promise.resolve(new HTTPResponse(500, 'AWS Event is undefined.'))
  }

  switch (event.httpMethod) {
    case 'GET':
      const getTestResultsByVIN = new Path('/test-results/:vin')

      if (getTestResultsByVIN.test(path)) {
        const vin = getTestResultsByVIN.test(path).vin
        let testStatus = 'Submitted'
        let toDateTime = dateFns.endOfToday()
        let fromDateTime = dateFns.subYears(toDateTime, 2)

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
      break
    case 'POST':
      const postTestResults = new Path('/test-results')

      if (postTestResults.test(path)) {
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

  // If you get to this point, your URL is bad
  console.log(event)
  return Promise.resolve(new HTTPResponse(400, `Cannot GET ${path}`))
}

module.exports = getTestResults
