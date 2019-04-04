/* global describe context it */
const expect = require('chai').expect
const TestResultsDAOMock = require('../models/TestResultsDAOMock')
const TestResultsService = require('../../src/services/TestResultsService')
const HTTPError = require('../../src/models/HTTPError')

describe('getTestResultsByVinAndStatus', () => {
  const testResultsDAOMock = new TestResultsDAOMock()
  const testResultsMockDB = require('../resources/test-results.json')

  context('when a record is found', () => {
    it('should return a populated response and status code 200', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[0])
      testResultsDAOMock.numberOfrecords = 1
      testResultsDAOMock.numberOfScannedRecords = 1
      var testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({ vin: 'XMGDE02FS0H012345', testStatus: 'submitted', fromDateTime: '2017-01-01', toDateTime: new Date().toString() })
        .then((returnedRecords) => {
          expect(returnedRecords).to.not.equal(undefined)
          expect(returnedRecords).to.not.equal({})
          expect(JSON.stringify(returnedRecords)).to.equal(JSON.stringify(testResultsDAOMock.testResultsResponseMock))
          expect(returnedRecords.length).to.be.equal(testResultsDAOMock.testResultsResponseMock.length)
        })
    })
  })

  context('when db returns empty data', () => {
    it('should return 400-Bad request', () => {
      var testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults('nonExistentVin', 'nonExistentStatus')
        .then(() => {
          expect.fail()
        }).catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.equal(400)
          expect(errorResponse.body).to.equal('Bad request')
        })
    })
  })
  context('when db return undifined data', () => {
    it('should return 404-No resources match the search criteria if db return null data', () => {
      testResultsDAOMock.testResultsResponseMock = undefined
      testResultsDAOMock.numberOfrecords = 0
      testResultsDAOMock.numberOfScannedRecords = 0
      var testResultsService = new TestResultsService(testResultsDAOMock)

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
})

describe('insertTestResult', () => {
  const testResultsDAOMock = new TestResultsDAOMock()

  context('when inserting an empty test result', () => {
    it('should throw a validation error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      const mockData = {}

      return testResultsService.insertTestResult(mockData)
        .catch((error) => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.equal(400)
          expect(error.body.errors[0]).to.equal('"testStatus" should be one of ["submitted", "cancelled"]')
        })
    })
  })
})
