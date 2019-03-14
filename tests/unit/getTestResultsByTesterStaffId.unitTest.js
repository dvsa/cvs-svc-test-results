/* global describe context it */
const expect = require('chai').expect
const TestResultsDAOMock = require('../models/TestResultsDAOMock')
const TestResultsService = require('../../src/services/TestResultsService')
const HTTPError = require('../../src/models/HTTPError')

describe('getTestResultsByTesterStaffId', () => {
  const testResultsDAOMock = new TestResultsDAOMock()
  const testResultsMockDB = require('../resources/test-results.json')

  context('no params are passed', () => {
    it('should throw error 400-Bad request', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[0])
      testResultsDAOMock.numberOfrecords = 1
      testResultsDAOMock.numberOfScannedRecords = 1
      let testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({})
        .then(() => {
          expect.fail()
        }).catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.equal(400)
          expect(errorResponse.body).to.equal('Bad request')
        })
    })
  })

  context('when a record is found', () => {
    it('should return a populated response and status code 200', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[0])
      testResultsDAOMock.numberOfrecords = 1
      testResultsDAOMock.numberOfScannedRecords = 1
      let testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({ testerStaffId: '1', testStationPNumber: '87-1369569', fromDateTime: '2015-02-22', toDateTime: '2019-02-22' })
        .then((returnedRecords) => {
          expect(returnedRecords).to.not.equal(undefined)
          expect(returnedRecords).to.not.equal({})
          expect(JSON.stringify(returnedRecords)).to.equal(JSON.stringify(testResultsDAOMock.testResultsResponseMock))
          expect(returnedRecords.length).to.be.equal(testResultsDAOMock.testResultsResponseMock.length)
        })
    })
  })

  context('when testerStaffId is missing', () => {
    it('should throw an error 500-Internal Error', () => {
      testResultsDAOMock.testResultsResponseMock = []
      testResultsDAOMock.numberOfrecords = 0
      testResultsDAOMock.numberOfScannedRecords = 0
      let testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({ testStationPNumber: '87-1369569', fromDateTime: '2015-02-22', toDateTime: '2019-02-22' })
        .then(() => {
          expect.fail()
        }).catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.equal(400)
          expect(errorResponse.body).to.equal('Bad request')
        })
    })
  })
  context('when no data was found', () => {
    it('should throw an error 404-No resources match the search criteria', () => {
      testResultsDAOMock.testResultsResponseMock = []
      testResultsDAOMock.numberOfrecords = 0
      testResultsDAOMock.numberOfScannedRecords = 0
      let testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({ testerStaffId: '1', testStationPNumber: '87-13695', fromDateTime: '2015-02-22', toDateTime: '2019-02-22' })
        .then(() => {
          expect.fail()
        }).catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.equal(404)
          expect(errorResponse.body).to.equal('No resources match the search criteria')
        })
    })
  })
})
