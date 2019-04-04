const HTTPError = require('../../src/models/HTTPError')

class TestResultsDaoMock {
  constructor () {
    this.testResultsResponseMock = null
    this.unprocessedItems = null
    this.numberOfrecords = null
    this.numberOfScannedRecords = null
    this.isDatabaseOn = true
    this.tableName = 'cvs-local-test-results'
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
    if (!this.isDatabaseOn) { return Promise.reject(new HTTPError(500, 'Internal Server Error')) }
    return Promise.resolve(payload)
  }

  getTestCodesAndClassificationFromTestTypes (testTypeId, vehicleType, vehicleSize, vehicleConfiguration) {
    let testCodeAndClassificationResponse = {
      linkedTestCode: 'wde',
      defaultTestCode: 'bde',
      testTypeClassification: 'Annual With Certificate'
    }

    return Promise.resolve(testCodeAndClassificationResponse)
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
}

module.exports = TestResultsDaoMock
