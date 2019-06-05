'use strict'

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')
const AWSXray = require('aws-xray-sdk')

const getTestResultsByTesterStaffId = async (event) => {
  let segment = AWSXray.getSegment()
  AWSXray.capturePromise();
  let subseg;
  if (segment) {
    subseg = segment.addNewSubsegment('getTestResultsByTesterStaffId');
  }
  const testResultsDAO = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDAO)

  const testerStaffId = event.queryStringParameters.testerStaffId
  const testStationPNumber = event.queryStringParameters.testStationPNumber
  const toDateTime = new Date(event.queryStringParameters.toDateTime)
  const fromDateTime = new Date(event.queryStringParameters.fromDateTime)

  if (!event.queryStringParameters) {
    if (event.queryStringParameters.testerStaffId && event.queryStringParameters.testStationPNumber && event.queryStringParameters.toDateTime && event.queryStringParameters.fromDateTime) {
      console.log('Bad request in getTestResultsByTesterStaffId - missing required parameters');
      if (subseg) subseg.addError('Bad request in getTestResultsByTesterStaffId - missing required parameters');
      return Promise.resolve(new HTTPResponse(400, 'Bad Request'))
    }
  }

  try {
    return testResultsService.getTestResults({ testerStaffId, testStationPNumber, fromDateTime, toDateTime })
      .then((data) => {
        return new HTTPResponse(200, data)
      })
      .catch((error) => {
        if (subseg) subseg.addError(error);
        console.log('Error in getTestResultsByTesterStaffId > getTestResults: ', error)
        return new HTTPResponse(error.statusCode, error.body)
      })
  } finally {
    if (subseg) subseg.close();
  }
}

module.exports.getTestResultsByTesterStaffId = getTestResultsByTesterStaffId
