'use strict'

const TestResultsDAO = require('../models/TestResultsDAO')
const TestResultsService = require('../services/TestResultsService')
const HTTPResponse = require('../models/HTTPResponse')
const dateFns = require('date-fns')
const AWSXray = require('aws-xray-sdk')
const MESSAGES = require('../utils/Enum')

const getTestResultsByVin = async (event) => {
  let segment = AWSXray.getSegment()
  AWSXray.capturePromise()
  let subseg
  if (segment) {
    subseg = segment.addNewSubsegment('getTestResultsByVin')
  }
  const testResultsDAO = new TestResultsDAO()
  const testResultsService = new TestResultsService(testResultsDAO)

  const vin = event.pathParameters.vin
  let testStatus = 'submitted'
  let toDateTime = dateFns.endOfToday()
  let fromDateTime = dateFns.subYears(toDateTime, 2)

  try {
    if (event.queryStringParameters) {
      if (event.queryStringParameters.toDateTime === '') {
        if (subseg) { subseg.addError('Bad Request - toDate empty') }
        console.log('Bad Request in getTestResultsByVin - toDate empty')
        return Promise.resolve(new HTTPResponse(400, MESSAGES.BAD_REQUEST))
      } else if (event.queryStringParameters.fromDateTime === '') {
        if (subseg) { subseg.addError('Bad Request - fromDate empty') }
        console.log('Bad request in getTestResultsByVin - fromDate empty')
        return Promise.resolve(new HTTPResponse(400, MESSAGES.BAD_REQUEST))
      } else {
        if (event.queryStringParameters.status) { testStatus = event.queryStringParameters.status }
        if (event.queryStringParameters.toDateTime) { toDateTime = new Date(event.queryStringParameters.toDateTime) }
        if (event.queryStringParameters.fromDateTime) { fromDateTime = new Date(event.queryStringParameters.fromDateTime) }
      }
    }
    return testResultsService.getTestResults({ vin: vin, testStatus: testStatus, fromDateTime: fromDateTime, toDateTime: toDateTime })
      .then((data) => {
        return new HTTPResponse(200, data)
      })
      .catch((error) => {
        if (subseg) { subseg.addError(error.body); subseg.close() }
        console.log('Error in getTestResultsByVin > getTestResults: ', error)
        return new HTTPResponse(error.statusCode, error.body)
      })
  } finally {
    if (subseg) { subseg.close() }
  }
}

module.exports.getTestResultsByVin = getTestResultsByVin
