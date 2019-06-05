'use strict'
const AWSXray = require('aws-xray-sdk')

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')
const MESSAGES = require('../utils/enum')

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
    if (subseg) { subseg.addError(MESSAGES.INVALID_JSON); }
    return Promise.resolve(new HTTPResponse(400, MESSAGES.INVALID_JSON))
  }

  try {
    let result = new Promise.reject(new HTTPError(500,MESSAGES.INTERNAL_SERVER_ERROR)); //Default to failure
    AWSXray.captureAsyncFunction('insertTestResult', () => {
      result = testResultsService.insertTestResult(payload);
    })
    return result.then(() => {
        return new HTTPResponse(201, MESSAGES.RECORD_CREATED)
      })
      .catch((error) => {
        subseg.addError(error.body);
        subseg.close();
        return new HTTPResponse(error.statusCode, error.body)
      })
  } finally {
    if (subseg) {
      subseg.close();
    }
  }
}

module.exports.postTestResults = postTestResults
