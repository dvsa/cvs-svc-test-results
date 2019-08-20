const HTTPError = require('../../src/models/HTTPError')
const HTTPErrorMessageMock = require('../models/HTTPErrorMessageMock')

class TestResultsDaoMock {
  constructor () {
    this.testResultsResponseMock = null
    this.unprocessedItems = null
    this.numberOfrecords = null
    this.numberOfScannedRecords = null
    this.isDatabaseOn = true
    this.tableName = 'cvs-local-test-results'
    this.testNumber = null
    this.testCodeAndClassificationResponse = {
      linkedTestCode: 'wde',
      defaultTestCode: 'bde',
      testTypeClassification: 'Annual With Certificate'
    }
    this.getTestCodesAndClassificationResponseFailFlag = false;
  }

  getByVin (vin) {
    const responseObject = {
      Items: this.testResultsResponseMock,
      Count: this.numberOfScannedRecords,
      ScannedCount: this.numberOfScannedRecords
    }
    if (!this.isDatabaseOn) { return Promise.reject(new HTTPError(500, 'Internal Server Error')) }
    return Promise.resolve(responseObject)
  }

  getByTesterStaffId (testerStaffId) {
    const responseObject = {
      Items: this.testResultsResponseMock,
      Count: this.numberOfScannedRecords,
      ScannedCount: this.numberOfScannedRecords
    }
    if (!this.isDatabaseOn) { return Promise.reject(new HTTPError(500, 'Internal Server Error')) }
    return Promise.resolve(responseObject)
  }

  createSingle (payload) {
    if (payload.testResultId === '1111') { return Promise.reject(new HTTPErrorMessageMock(400, 'The conditional request failed')) }
    if (!this.isDatabaseOn) { return Promise.reject(new HTTPError(500, 'Internal Server Error')) }
    return Promise.resolve(payload)
  }

  getTestCodesAndClassificationFromTestTypes (testTypeId, vehicleType, vehicleSize, vehicleConfiguration) {
    if (!this.getTestCodesAndClassificationResponseFailFlag) {
      return Promise.resolve(this.testCodeAndClassificationResponse)
    } else {
      return Promise.reject(this.testCodeAndClassificationResponse)
    }
  }

  createMultiple () {
    const responseObject = { UnprocessedItems: this.unprocessedItems }

    if (!this.isDatabaseOn) return Promise.reject(responseObject)

    return Promise.resolve(responseObject)
  }

  deleteMultiple () {
    const responseObject = { UnprocessedItems: this.unprocessedItems }

    if (!this.isDatabaseOn) return Promise.reject(responseObject)

    return Promise.resolve(responseObject)
  }

  getTestNumber () {
    return Promise.resolve(this.testNumber)
  }
}

module.exports = TestResultsDaoMock
