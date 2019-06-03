'use strict'

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')
const AWSXray = require('aws-xray-sdk')

const getTestResultsByTesterStaffId = async (event) => {
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

  let testResults = AWSXray.captureAsyncFunction('getTestResultsXXXXX', testResultsService.getTestResults({ testerStaffId, testStationPNumber, fromDateTime, toDateTime }))
  return testResults
    .then((data) => {
      return new HTTPResponse(200, data)
    })
    .catch((error) => {
      return new HTTPResponse(error.statusCode, error.body)
    })
}

// const getTestResultsByTesterStaffIdWrapped = () => {}

module.exports.getTestResultsByTesterStaffId = getTestResultsByTesterStaffId
