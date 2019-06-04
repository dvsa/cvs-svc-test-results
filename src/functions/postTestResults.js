'use strict'
const AWSXray = require('aws-xray-sdk')

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')

const postTestResults = (event) => {
  let subseg = AWSXray.getSegment().addNewSubsegment('postTestResults')
  console.log('XXXXX', subseg)
  const testResultsDAO = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDAO)

  let payload = event.body

  if (!payload) {
    return Promise.resolve(new HTTPResponse(400, 'Body is not a valid JSON.'))
  }

  let insertTestResult = testResultsService.insertTestResult(payload).then(() => {
      return new HTTPResponse(201, 'Test records created')
    })
    .catch((error) => {
      return new HTTPResponse(error.statusCode, error.body)
    })
  subseg.close()
  return insertTestResult

}

module.exports.postTestResults = postTestResults
