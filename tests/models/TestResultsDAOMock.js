const HTTPError = require('../../src/models/HTTPError')

class TestResultsDaoMock {
  constructor () {
    this.testResultsGetByVinResponseMock = null
    this.numberOfrecords = null
    this.numberOfScannedRecords = null
    this.isDatabaseOn = true
    this.tableName = 'cvs-local-test-results'
  }

  getByVin (vin) {
    const responseObject = {

      Responses: {
        'cvs-local-test-results': this.testResultsGetByVinResponseMock
      },
      UnprocessedKeys: {}
    }
    if (!this.isDatabaseOn) { return Promise.reject(new HTTPError(500, 'Internal Server Error')) }
    return Promise.resolve(responseObject)
  }
}

module.exports = TestResultsDaoMock
