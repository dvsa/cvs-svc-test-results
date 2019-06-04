'use strict'
const AWSXray = require('aws-xray-sdk')

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')

const postTestResults = (event) => {
  console.log('XXXXX', AWSXray.getSegment())
  const testResultsDAO = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDAO)

  let payload = event.body

  if (!payload) {
    return Promise.resolve(new HTTPResponse(400, 'Body is not a valid JSON.'))
  }

  let insertTestResult;
  AWSXray.captureAsyncFunction('insertTestResults -- Kevin',() => {
    insertTestResult = testResultsService.insertTestResult(payload)
  })
  return insertTestResult
    .then(() => {
      return new HTTPResponse(201, 'Test records created')
    })
    .catch((error) => {
      return new HTTPResponse(error.statusCode, error.body)
    })
}

module.exports.postTestResults = postTestResults
