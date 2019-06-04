'use strict'
const AWSXray = require('aws-xray-sdk')

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')

const postTestResults = (event) => {
  let segment = AWSXray.getSegment()
  AWSXray.capturePromise();
  let subseg;
  if (segment) {
    subseg = segment.addNewSubsegment('postTestResults');
    console.log('XXXXX', subseg)
  }
  const testResultsDAO = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDAO)

  let payload = event.body

  if (!payload) {
    subseg.addError(new Error('Body is not valid JSON'));
    return Promise.resolve(new HTTPResponse(400, 'Body is not a valid JSON.'))
  }

  try {
    return testResultsService.insertTestResult(payload)
      .then(() => {
        return new HTTPResponse(201, 'Test records created')
      })
      .catch((error) => {
        subseg.addError(error);
        return new HTTPResponse(error.statusCode, error.body)
      })
  } finally {
    if (subseg) {
      subseg.close();
    }
  }
}

module.exports.postTestResults = postTestResults
