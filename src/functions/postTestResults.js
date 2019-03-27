'use strict'

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')

const postTestResults = (event) => {
  const testResultsDAO = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDAO)

  let payload = event.body

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

module.exports.postTestResults = postTestResults
