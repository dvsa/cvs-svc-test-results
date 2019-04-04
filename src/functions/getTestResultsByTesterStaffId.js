'use strict'

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')

const getTestResultsByTesterStaffId = (event) => {
  const testResultsDAO = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDAO)

  const testerStaffId = event.queryStringParameters.testerStaffId
  const testStationPNumber = event.queryStringParameters.testStationPNumber
  const toDateTime = new Date(event.queryStringParameters.toDateTime)
  const fromDateTime = new Date(event.queryStringParameters.fromDateTime)

  if (!event.queryStringParameters) {
    if (event.queryStringParameters.testerStaffId && event.queryStringParameters.testStationPNumber && event.queryStringParameters.toDateTime && event.queryStringParameters.fromDateTime) {
      return Promise.resolve(new HTTPResponse(400, 'Bad Request'))
    }
  }

  return testResultsService.getTestResults({ testerStaffId: testerStaffId, testStationPNumber: testStationPNumber, fromDateTime: fromDateTime, toDateTime: toDateTime })
    .then((data) => {
      return new HTTPResponse(200, data)
    })
    .catch((error) => {
      return new HTTPResponse(error.statusCode, error.body)
    })
}

module.exports.getTestResultsByTesterStaffId = getTestResultsByTesterStaffId
