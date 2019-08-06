/* global describe context it */
const expect = require('chai').expect
const TestResultsDAOMock = require('../models/TestResultsDAOMock')
const TestResultsService = require('../../src/services/TestResultsService')
const HTTPError = require('../../src/models/HTTPError')
const HTTPResponse = require('../../src/models/HTTPResponse')
const fs = require('fs')
const path = require('path')
const dateFns = require('date-fns')

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

  context('when a record is found with deletionFlag false', () => {
    it('should return a populated response', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[8])
      testResultsDAOMock.numberOfrecords = 1
      testResultsDAOMock.numberOfScannedRecords = 1
      var testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({ vin: 'XMGDE02FS0H012302', status: 'submitted', fromDateTime: '2017-01-01', toDateTime: new Date().toString() })
        .then((returnedRecords) => {
          expect(returnedRecords[0].deletionFlag).to.equal(false)
        })
    })
  })

  context('when only one record is found with deletionFlag true', () => {
    it('should return a 404 error', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[7])
      testResultsDAOMock.numberOfrecords = 1
      testResultsDAOMock.numberOfScannedRecords = 1
      var testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({ vin: 'XMGDE02FS0H012301', status: 'submitted', fromDateTime: '2017-01-01', toDateTime: new Date().toString() })
        .then((returnedRecords) => {
          expect.fail()
        }).catch((errorResponse) => {
          expect(errorResponse).to.be.instanceOf(HTTPError)
          expect(errorResponse.statusCode).to.equal(404)
          expect(errorResponse.body).to.equal('No resources match the search criteria')
        })
    })
  })

  context('when a record with one test type is found and the test type has deletionFlag false', () => {
    it('should return a populated response', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[10])
      testResultsDAOMock.numberOfrecords = 1
      testResultsDAOMock.numberOfScannedRecords = 1
      var testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({ vin: 'XMGDE02FS0H012304', status: 'submitted', fromDateTime: '2017-01-01', toDateTime: new Date().toString() })
        .then((returnedRecords) => {
          expect(returnedRecords[0].testTypes[0].deletionFlag).to.equal(false)
        })
    })
  })

  context('when a record with one test type is found and the test type has deletionFlag true', () => {
    it('should not return that test type', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[9])
      testResultsDAOMock.numberOfrecords = 1
      testResultsDAOMock.numberOfScannedRecords = 1
      var testResultsService = new TestResultsService(testResultsDAOMock)

      return testResultsService.getTestResults({ vin: 'XMGDE02FS0H012303', status: 'submitted', fromDateTime: '2017-01-01', toDateTime: new Date().toString() })
        .then((returnedRecords) => {
          expect(returnedRecords[0].testTypes.length).to.equal(0)
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
  const testResultsPostMock = require('../resources/test-results-post.json')

  context('when inserting an empty test result', () => {
    it('should throw a validation error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      const mockData = {}

      return testResultsService.insertTestResult(mockData)
        .then(() => {})
        .catch((error) => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.equal(400)
          expect(error.body).to.equal('Payload cannot be empty')
        })
    })
  })

  context('when inserting an HGV test result with fields applicable to this vehicleType', () => {
    it('should not throw error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = testResultsPostMock[4]

      return testResultsService.insertTestResult(mockData)
        .then((insertedTestResult) => {
          expect(insertedTestResult).to.not.be.eql(undefined)
        })
        .catch(() => {
          expect.fail()
        })
    })
  })

  context('when inserting an HGV with fields corresponding to a PSV', () => {
    it('should throw 400 - and a message specifying the fields that should not be in the request payload', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = testResultsPostMock[2]
      mockData.vehicleType = 'hgv'

      return testResultsService.insertTestResult(mockData)
        .then(() => {})
        .catch((error) => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.be.eql(400)
          expect(error.body.errors).to.be.eql(['"numberOfSeatbeltsFitted" is not allowed', '"lastSeatbeltInstallationCheckDate" is not allowed', '"seatbeltInstallationCheckDate" is not allowed'])
        })
    })
  })

  context('when inserting an TRL test result with fields applicable to this vehicleType', () => {
    it('should not throw error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = testResultsPostMock[5]

      return testResultsService.insertTestResult(mockData)
        .then((insertedTestResult) => {
          expect(insertedTestResult).to.not.be.eql(undefined)
        })
        .catch(() => {
          expect.fail()
        })
    })
  })

  context('when inserting an HGV with fields corresponding to a PSV', () => {
    it('should throw 400 - and a message specifying the fields that should not be in the request payload', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = testResultsPostMock[2]
      mockData.vehicleType = 'trl'

      return testResultsService.insertTestResult(mockData)
        .then(() => {})
        .catch((error) => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.be.eql(400)
          expect(error.body.errors).to.be.eql(['"numberOfSeatbeltsFitted" is not allowed', '"lastSeatbeltInstallationCheckDate" is not allowed', '"seatbeltInstallationCheckDate" is not allowed'])
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
          expect(error.body).to.equal('/location/deficiencyText/stdForProhibition are null for a defect with deficiency category other than advisory')
        })
    })

    it('should throw an internal server error', () => {
      testResultsDAOMock.isDatabaseOn = false
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
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
      mockData.testResultId = '1'
      return testResultsService.insertTestResult(mockData)
        .then(() => {})
        .catch(error => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.be.equal(500)
          expect(error.body).to.equal('Internal server error')
        })
    })

    it('should return 201 - Test Result id already exists\'', () => {
      testResultsDAOMock.isDatabaseOn = false
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
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
      mockData.testResultId = '1111'
      return testResultsService.insertTestResult(mockData)
        .then().catch(error => {
          expect(error).to.be.instanceOf(HTTPResponse)
          expect(error.statusCode).to.be.equal(201)
          expect(error.body).to.be.equal('"Test Result id already exists"')
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

  context('when inserting a testResult with prohibitionIssued valid and null', () => {
    it('should not throw error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = testResultsPostMock[0]
      mockData.testTypes[0].defects[0].prohibitionIssued = null

      return testResultsService.insertTestResult(mockData)
        .then((data) => {
          expect(data).to.not.be.eql(undefined)
        }).catch(() => {})
    })
  })

  context('when inserting a testResult with prohibitionIssued valid and not null', () => {
    it('should not throw error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = testResultsPostMock[0]

      return testResultsService.insertTestResult(mockData)
        .then((data) => {
          expect(data).to.not.be.eql(undefined)
        }).catch(() => {})
    })
  })

  context('when inserting a testResult with prohibitionIssued not present on defects', () => {
    it('should throw validation error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = testResultsPostMock[0]
      delete mockData.testTypes[0].defects[0].prohibitionIssued

      return testResultsService.insertTestResult(mockData)
        .then(() => {})
        .catch((error) => {
          expect(error.statusCode).to.be.eql(400)
          expect(error.body).to.be.eql({ errors: [ '"prohibitionIssued" is required' ] })
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

describe('setExpiryDateAndCertificateNumber', () => {
  const testResultsDAOMock = new TestResultsDAOMock()
  const testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results.json'), 'utf8'))

  context('cancelled test', () => {
    it('should return the payload', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[2])
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = testResultsMockDB[2]

      return testResultsService.setExpiryDateAndCertificateNumber(mockData)
        .then(response => {
          expect(response).to.deep.equal(mockData)
        })
    })
    it('should return the payload with expiry date prolonged by 1 year', () => {
      const testResultsMockPostPayload = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json'), 'utf8'))
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[6])
      testResultsDAOMock.numberOfrecords = 1
      testResultsDAOMock.numberOfScannedRecords = 1
      testResultsDAOMock.testResultsResponseMock[0].testTypes[0].testExpiryDate = new Date()
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = testResultsMockPostPayload[3]
      mockData.testTypes[0].testTypeClassification = 'Annual With Certificate'
      const expectedExpiryDate = new Date()
      expectedExpiryDate.setFullYear(new Date().getFullYear() + 1)
      return testResultsService.setExpiryDateAndCertificateNumber(mockData)
        .then(response => {
          expect((response.testTypes[0].testExpiryDate).split('T')[0]).to.equal(dateFns.addYears(new Date(), 1).toISOString().split('T')[0])
        })
    })
  })

  context('submitted test', () => {
    it('should set the expiryDate and the certificateNumber for "Annual With Certificate" testTypes with testResult "pass", "fail" or "prs"', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[0])
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = testResultsMockDB[0]
      testResultsDAOMock.numberOfrecords = ''
      testResultsDAOMock.numberOfScannedRecords = ''
      mockData.testTypes[2].testResult = ''
      return testResultsService.setExpiryDateAndCertificateNumber(mockData)
        .then(response => {
          const expectedExpiryDate = new Date()
          expectedExpiryDate.setFullYear(new Date().getFullYear() + 1)
          expectedExpiryDate.setDate(new Date().getDate() - 1)
          expect((response.testTypes[0].testExpiryDate).split('T')[0]).to.equal(expectedExpiryDate.toISOString().split('T')[0])
          expect(response.testTypes[0].certificateNumber).to.equal(response.testTypes[0].testNumber)
          expect(response.testTypes[1].testExpiryDate).to.equal(undefined)
          expect(response.testTypes[1].certificateNumber).to.equal(undefined)
          expect(response.testTypes[2].testExpiryDate).to.equal(undefined)
          expect(response.testTypes[2].certificateNumber).to.equal(undefined)
        })
    })
  })

  context('no testTypes', () => {
    it('should throw an error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = {}

      return testResultsService.setExpiryDateAndCertificateNumber(mockData)
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
          expect(data.length).to.equal(15)
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
          expect(data.length).to.equal(15)
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
