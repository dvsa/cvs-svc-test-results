/* global describe context it */
const expect = require('chai').expect
const TestResultsDAOMock = require('../models/TestResultsDAOMock')
const TestResultsService = require('../../src/services/TestResultsService')
const HTTPError = require('../../src/models/HTTPError')
const fs = require('fs')
const path = require('path')

describe('getTestResults', () => {
  const testResultsDAOMock = new TestResultsDAOMock()
  const testResultsMockDB = require('../resources/test-results.json')

  context('when a record is found', () => {
    it('should return a populated response and status code 200', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[0])
      testResultsDAOMock.numberOfrecords = 1
      testResultsDAOMock.numberOfScannedRecords = 1
      var testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({ vin: 'XMGDE02FS0H012345', status: 'submitted', fromDateTime: '2017-01-01', toDateTime: new Date().toString() })
        .then((returnedRecords) => {
          expect(returnedRecords).to.not.equal(undefined)
          expect(returnedRecords).to.not.equal({})
          expect(JSON.stringify(returnedRecords)).to.equal(JSON.stringify(testResultsDAOMock.testResultsResponseMock))
          expect(returnedRecords.length).to.be.equal(testResultsDAOMock.testResultsResponseMock.length)
        })
    })
  })

  context('when db returns undefined data', () => {
    it('should return 404-No resources match the search criteria if db return null data', () => {
      testResultsDAOMock.testResultsResponseMock = null
      testResultsDAOMock.numberOfrecords = 0
      testResultsDAOMock.numberOfScannedRecords = 0
      const testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults()
        .then(() => {
          expect.fail()
        }).catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.equal(400)
          expect(errorResponse.body).to.equal('Bad request')
        })
    })

    it('should return 404-No resources match the search criteria if testResults length is 0', () => {
      testResultsDAOMock.testResultsResponseMock = []
      testResultsDAOMock.numberOfrecords = 1
      testResultsDAOMock.numberOfScannedRecords = 1
      const testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({ vin: 'XMGDE02FS0H012345', status: 'submitted', fromDateTime: '2017-01-01', toDateTime: new Date().toString() })
        .then(() => {
          expect.fail()
        }).catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.equal(404)
          expect(errorResponse.body).to.equal('No resources match the search criteria')
        })
    })
  })

  context('when db returns empty data due to invalid toDateTime', () => {
    it('should return 400-Bad request', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[0])
      testResultsDAOMock.numberOfrecords = 1
      testResultsDAOMock.numberOfScannedRecords = 1
      var testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({ vin: 'XMGDE02FS0H012345', status: 'submitted', fromDateTime: '2017-01-01', toDateTime: 'qwerty' })
        .then(() => {
          expect.fail()
        })
        .catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.equal(400)
          expect(errorResponse.body).to.equal('Bad request')
        })
    })
  })

  context('when db returns empty data due to invalid fromDateTime', () => {
    it('should return 400-Bad request', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[0])
      testResultsDAOMock.numberOfrecords = 1
      testResultsDAOMock.numberOfScannedRecords = 1
      var testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({ vin: 'XMGDE02FS0H012345', status: 'submitted', fromDateTime: 'qwerty', toDateTime: new Date().toString() })
        .then(() => {
          expect.fail()
        })
        .catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.equal(400)
          expect(errorResponse.body).to.equal('Bad request')
        })
    })
  })
})

describe('insertTestResult', () => {
  const testResultsDAOMock = new TestResultsDAOMock()
  const testResultsMockDB = require('../resources/test-results.json')

  context('when inserting an empty test result', () => {
    it('should throw a validation error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      const mockData = {}

      return testResultsService.insertTestResult(mockData)
        .then(() => {})
        .catch((error) => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.equal(400)
          expect(error.body.errors[0]).to.equal('"testStatus" should be one of ["submitted", "cancelled"]')
        })
    })
  })

  context('when inserting a submitted testResult', () => {
    it('should return a 400 error when certificateNumber not present on lec', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = testResultsMockDB[2]

      for (let testType of mockData.testTypes) {
        delete testType.testCode
        delete testType.testNumber
        delete testType.lastUpdatedAt
        delete testType.testAnniversaryDate
        delete testType.createdAt
        delete testType.testExpiryDate
        delete testType.certificateLink
      }
      delete mockData.vehicleId

      return testResultsService.insertTestResult(mockData)
        .then(() => {})
        .catch(error => {
          expect(error).to.not.equal(undefined)
        })
    })

    it('should return a 400 error when fields null for advisory deficiency category', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = testResultsMockDB[4]

      for (let testType of mockData.testTypes) {
        delete testType.testCode
        delete testType.testNumber
        delete testType.lastUpdatedAt
        delete testType.testAnniversaryDate
        delete testType.createdAt
        delete testType.testExpiryDate
        delete testType.certificateLink
      }
      delete mockData.vehicleId

      return testResultsService.insertTestResult(mockData)
        .then(() => {})
        .catch(error => {
          expect(error.statusCode).to.equal(400)
          expect(error.body).to.equal('/location/deficiencyText/stdForProhibition/prs are null for a defect with deficiency category other than advisory')
        })
    })

    it('should throw an internal server error', () => {
      testResultsDAOMock.isDatabaseOn = false
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = testResultsMockDB[0]

      for (let testType of mockData.testTypes) {
        testType.certificateNumber = '1234'
        delete testType.testCode
        delete testType.testNumber
        delete testType.lastUpdatedAt
        delete testType.testAnniversaryDate
        delete testType.createdAt
        delete testType.testExpiryDate
        delete testType.certificateLink
        delete testType.testTypeClassification
      }
      delete mockData.vehicleId

      return testResultsService.insertTestResult(mockData)
        .then(() => {})
        .catch(error => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.be.equal(500)
          expect(error.body).to.equal('Internal server error')
        })
    })
  })

  context('when inserting a cancelled testResult', () => {
    it('should throw error 404 when reasonForAbandoning not present on all abandoned tests', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = testResultsMockDB[5]

      for (let testType of mockData.testTypes) {
        delete testType.testCode
        delete testType.testNumber
        delete testType.lastUpdatedAt
        delete testType.testAnniversaryDate
        delete testType.createdAt
        delete testType.testExpiryDate
        delete testType.certificateLink
      }
      delete mockData.vehicleId

      return testResultsService.insertTestResult(mockData)
        .then(() => {})
        .catch(error => {
          expect(error.statusCode).to.equal(400)
          expect(error.body).to.equal('Reason for Abandoning not present on all abandoned tests')
        })
    })
  })
})

describe('fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory', () => {
  const testResultsDAOMock = new TestResultsDAOMock()
  const testResultsMockDB = require('../resources/test-results.json')

  context('defects other than advisory', () => {
    it('should add missing fields to defects', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = testResultsMockDB[4]

      let result = testResultsService.fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(mockData)
      expect(result.result).to.equal(true)
    })
  })
})

describe('reasonForAbandoningPresentOnAllAbandonedTests', () => {
  const testResultsDAOMock = new TestResultsDAOMock()
  const testResultsMockDB = require('../resources/test-results.json')

  context('abandoned testTypes', () => {
    it('should return whether all have reasonForAbandoning or not', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = testResultsMockDB[5]

      let result = testResultsService.reasonForAbandoningPresentOnAllAbandonedTests(mockData)
      expect(result).to.equal(false)
    })
  })
})

describe('setExpiryDate', () => {
  const testResultsDAOMock = new TestResultsDAOMock()
  const testResultsMockDB = require('../resources/test-results.json')

  context('testType without expiry date', () => {
    it('should set expiry date', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[0])
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = testResultsMockDB[0]

      return testResultsService.setExpiryDate(mockData)
        .then(response => {
          expect(response).to.not.equal(undefined)
        })
    })
  })

  context('no testTypes', () => {
    it('should throw an error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = {}

      return testResultsService.setExpiryDate(mockData)
        .then(() => {})
        .catch(error => {
          expect(error).to.not.equal(undefined)
        })
    })
  })
})

describe('insertTestResultsList', () => {
  const testResultsDAOMock = new TestResultsDAOMock()

  context('database call inserts items', () => {
    it('should return nothing', () => {
      testResultsDAOMock.testResultsResponseMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results.json'), 'utf8'))
      const testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.insertTestResultsList(testResultsDAOMock.testResultsResponseMock)
        .then(data => {
          expect(data).to.equal(undefined)
        })
    })

    it('should return the unprocessed items', () => {
      testResultsDAOMock.unprocessedItems = testResultsDAOMock.testResultsResponseMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results.json'), 'utf8'))
      const testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.insertTestResultsList(testResultsDAOMock.testResultsResponseMock)
        .then(data => {
          expect(data.length).to.equal(6)
        })
    })
  })

  context('database call fails inserting items', () => {
    it('should return error 500', () => {
      testResultsDAOMock.testResultsResponseMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results.json'), 'utf8'))
      testResultsDAOMock.isDatabaseOn = false
      const testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.insertTestResultsList(testResultsDAOMock.testResultsResponseMock)
        .then(() => {})
        .catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.be.equal(500)
          expect(errorResponse.body).to.equal('Internal Server Error')
        })
    })
  })
})

describe('deleteTestResultsList', () => {
  const testResultsDAOMock = new TestResultsDAOMock()

  context('database call deletes items', () => {
    it('should return nothing', () => {
      testResultsDAOMock.testResultsResponseMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results.json'), 'utf8'))
      const testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.deleteTestResultsList(testResultsDAOMock.testResultsResponseMock)
        .then(data => {
          expect(data).to.equal(undefined)
        })
    })

    it('should return the unprocessed items', () => {
      testResultsDAOMock.unprocessedItems = testResultsDAOMock.testResultsResponseMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results.json'), 'utf8'))
      const testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.deleteTestResultsList(testResultsDAOMock.testResultsResponseMock)
        .then(data => {
          expect(data.length).to.equal(6)
        })
    })
  })

  context('database call fails deleting items', () => {
    it('should return error 500', () => {
      testResultsDAOMock.testResultsResponseMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results.json'), 'utf8'))
      testResultsDAOMock.isDatabaseOn = false
      const testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.deleteTestResultsList(testResultsDAOMock.testResultsResponseMock)
        .then(() => {})
        .catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.be.equal(500)
          expect(errorResponse.body).to.equal('Internal Server Error')
        })
    })
  })
})
