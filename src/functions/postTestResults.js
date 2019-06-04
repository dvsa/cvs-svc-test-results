'use strict'
const AWSXray = require('aws-xray-sdk')

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')

const postTestResults = async (event) => {
  let segment = AWSXray.getSegment()
  AWSXray.capturePromise();
  let subseg;
  if (segment) {
    subseg = segment.addNewSubsegment('postTestResults');
  }
  const testResultsDAO = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDAO)

  let payload = event.body

  if (!payload) {
    if (subseg) { subseg.addError('Body is not valid JSON'); }
    return Promise.resolve(new HTTPResponse(400, 'Body is not a valid JSON.'))
  }

  try {
    await testResultsService.insertTestResult(payload).catch((error) => {
      subseg.addError(error);
      console.log('DDDDDDDD Came to error catch', error)
      return new HTTPResponse(error.statusCode, error.body)
    })

    return new HTTPResponse(201, 'Test records created')
  } finally {
    if (subseg) {
      subseg.close();
    }
  }
}

module.exports.postTestResults = postTestResults
