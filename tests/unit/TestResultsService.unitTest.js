/* global describe context it */
const expect = require('chai').expect
const TestResultsDAOMock = require('../models/TestResultsDAOMock')
const TestResultsService = require('../../src/services/TestResultsService')
const HTTPError = require('../../src/models/HTTPError')

describe('getTestResultsByVinAndStatus', () => {
  var testResultsDAOMock = new TestResultsDAOMock()

  context('when a record is found', () => {
    it('should return a populated response and status code 200', () => {
      testResultsDAOMock.testResultsGetByVinResponseMock = require('../resources/test-results-getByVinDAOResponse.json')
      var testResultsService = new TestResultsService(testResultsDAOMock)
      const getByVinStatusServiceResponseMock = require('../resources/../resources/test-results-getByVinAndStatusServiceResponse.json')
      return testResultsService.getTestResultsByVinAndStatus('12345', 'submitted', '2017-01-01', '2019-01-01')
        .then((returnedRecords) => {
          expect(returnedRecords).to.not.equal(undefined)
          expect(returnedRecords).to.not.equal({})
          expect(JSON.stringify(returnedRecords)).to.equal(JSON.stringify(getByVinStatusServiceResponseMock))
          expect(returnedRecords.length).to.be.equal(getByVinStatusServiceResponseMock.length)
        })
    })
  })

  context('when db returns empty data', () => {
    it('should return 404-No resources match the search criteria', () => {
      var testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResultsByVinAndStatus('nonExistentVin', 'nonExistentStatus')
        .then(() => {
          expect.fail()
        }).catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.equal(404)
          expect(errorResponse.body).to.equal('No resources match the search criteria')
        })
    })
  })
  context('when db return undifined data', () => {
    it('should return 404-No resources match the search criteria if db return null data', () => {
      testResultsDAOMock.techRecordsMock = undefined
      testResultsDAOMock.numberOfrecords = 0
      testResultsDAOMock.numberOfScannedRecords = 0
      var testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResultsByVinAndStatus()
        .then(() => {
          expect.fail()
        }).catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.equal(404)
          expect(errorResponse.body).to.equal('No resources match the search criteria')
        })
    })
  })

  context('when db does not return response', () => {
    it('should return 500-Internal Server Error', () => {
      testResultsDAOMock.isDatabaseOn = false
      var testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResultsByVinAndStatus()
        .then(() => {
          expect.fail()
        })
        .catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.be.equal(500)
          expect(errorResponse.body).to.equal('Internal Server Error')
        })
    })
  })
})
