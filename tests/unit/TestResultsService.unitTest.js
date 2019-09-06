/* global describe context it */
const expect = require('chai').expect
const TestResultsDAOMock = require('../models/TestResultsDAOMock')
const TestResultsService = require('../../src/services/TestResultsService')
const HTTPError = require('../../src/models/HTTPError')
const HTTPResponse = require('../../src/models/HTTPResponse')
const fs = require('fs')
const path = require('path')
const dateFns = require('date-fns')
const postObject = require('../resources/test-results-post.json')

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
  const testResultsMockDB = require('../resources/test-results.json')

  context('when inserting a cancelled HGV that has null values on the fields that are allowing them to be null', () => {
    it('should not throw error', () => {
      const postObject = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json'), 'utf8'))
      const testResultsDAOMock = new TestResultsDAOMock()
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][4]
      mockData.testStatus = 'cancelled'
      mockData.odometerReading = null
      mockData.odometerReadingUnits = null
      mockData.countryOfRegistration = null
      mockData.euVehicleCategory = null

      return testResultsService.insertTestResult(mockData)
        .then((data) => {
          expect(data).to.not.be.eql(undefined)
        })
        .catch(() => {
          expect.fail()
        })
    })
  })

  context('when inserting an empty test result', () => {
    it('should throw a validation error', () => {
      const testResultsDAOMock = new TestResultsDAOMock()
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
      const postObject = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json'), 'utf8'))
      const testResultsDAOMock = new TestResultsDAOMock()
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][4]

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
    it('should throw 400', () => {
      const postObject = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json'), 'utf8'))
      const testResultsDAOMock = new TestResultsDAOMock()
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][2]
      mockData.vehicleType = 'hgv'

      return testResultsService.insertTestResult(mockData)
        .then(() => {
        })
        .catch((error) => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.be.eql(400)
        })
    })
  })

  context('when inserting an TRL test result with fields applicable to this vehicleType', () => {
    it('should not throw error', () => {
      const postObject = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json'), 'utf8'))
      const testResultsDAOMock = new TestResultsDAOMock()
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][5]

      return testResultsService.insertTestResult(mockData)
        .then((insertedTestResult) => {
          expect(insertedTestResult).to.not.be.eql(undefined)
        })
        .catch(() => {
          expect.fail()
        })
    })
  })

  context('when inserting a TRL with fields corresponding to a PSV', () => {
    it('should throw 400', () => {
      const postObject = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json'), 'utf8'))
      const testResultsDAOMock = new TestResultsDAOMock()
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][2]
      mockData.vehicleType = 'trl'

      return testResultsService.insertTestResult(mockData)
        .then(() => {})
        .catch((error) => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.be.eql(400)
        })
    })
  })

  context('when inserting a submitted HGV that has null values on the fields that should be allowed null only when cancelled', () => {
    it('should throw 400', () => {
      const postObject = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json'), 'utf8'))
      const testResultsDAOMock = new TestResultsDAOMock()
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][4]
      mockData.odometerReading = null
      mockData.odometerReadingUnits = null
      mockData.countryOfRegistration = null
      mockData.euVehicleCategory = null

      return testResultsService.insertTestResult(mockData)
        .then(() => {
          expect.fail()
        })
        .catch((error) => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.be.eql(400)
        })
    })
  })

  context('when inserting a cancelled TRL that has null values on the fields that are allowing them to be null', () => {
    it('should not throw error', () => {
      const postObject = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json'), 'utf8'))
      const testResultsDAOMock = new TestResultsDAOMock()
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][5]
      mockData.testStatus = 'cancelled'
      mockData.countryOfRegistration = null
      mockData.euVehicleCategory = null

      return testResultsService.insertTestResult(mockData)
        .then((data) => {
          expect(data).to.not.be.eql(undefined)
        })
        .catch(() => {
          expect.fail()
        })
    })
  })

  context('when inserting a submitted TRL that has null values on the fields that should be allowed null only when cancelled', () => {
    it('should throw 400', () => {
      const postObject = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json'), 'utf8'))
      const testResultsDAOMock = new TestResultsDAOMock()
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][5]
      mockData.odometerReading = null
      mockData.odometerReadingUnits = null
      mockData.countryOfRegistration = null
      mockData.euVehicleCategory = null

      return testResultsService.insertTestResult(mockData)
        .then(() => {
          expect.fail()
        })
        .catch((error) => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.be.eql(400)
        })
    })
  })

  context('when inserting a submitted HGV that has null values on the fields that should be allowed null only when cancelled', () => {
    it('should throw 400', () => {
      const postObject = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json'), 'utf8'))
      const testResultsDAOMock = new TestResultsDAOMock()
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][4]
      mockData.odometerReading = null
      mockData.odometerReadingUnits = null
      mockData.countryOfRegistration = null
      mockData.euVehicleCategory = null

      return testResultsService.insertTestResult(mockData)
        .then(() => {})
        .catch((error) => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.be.eql(400)
        })
    })
  })

  context('when inserting a cancelled TRL with fields corresponding to a submitted TRL', () => {
    it('should throw 400', () => {
      const postObject = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json'), 'utf8'))
      const testResultsDAOMock = new TestResultsDAOMock()
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][5]
      mockData.testStatus = 'cancelled'

      return testResultsService.insertTestResult(mockData)
        .then((data) => {
          console.log(data)
        })
        .catch((error) => {
          expect(error).to.be.instanceOf(HTTPError)
          expect(error.statusCode).to.be.eql(400)
        })
    })
  })

  context('when inserting a submitted testResult', () => {
    it('should return a 400 error when certificateNumber not present on lec', () => {
      const testResultsDAOMock = new TestResultsDAOMock()
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
      const testResultsDAOMock = new TestResultsDAOMock()
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
      const testResultsDAOMock = new TestResultsDAOMock()
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
      const testResultsDAOMock = new TestResultsDAOMock()
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
      const testResultsDAOMock = new TestResultsDAOMock()
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
    const testResultsDAOMock = new TestResultsDAOMock()
    it('should not throw error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][0]
      mockData.testTypes[0].defects[0].prohibitionIssued = null

      return testResultsService.insertTestResult(mockData)
        .then((data) => {
          expect(data).to.not.be.eql(undefined)
        }).catch(() => {})
    })
  })

  context('when inserting a testResult with prohibitionIssued valid and not null', () => {
    const testResultsDAOMock = new TestResultsDAOMock()
    it('should not throw error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][0]

      return testResultsService.insertTestResult(mockData)
        .then((data) => {
          expect(data).to.not.be.eql(undefined)
        }).catch(() => {})
    })
  })

  context('when inserting a testResult with prohibitionIssued not present on defects', () => {
    const testResultsDAOMock = new TestResultsDAOMock()
    it('should throw validation error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      testResultsDAOMock.testNumber = { testNumber: 'W01A00209', id: 'W01', certLetter: 'A', sequenceNumber: '002' }
      let mockData = [...postObject][0]
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

describe('generateExpiryDate', () => {
  const testResultsDAOMock = new TestResultsDAOMock()
  const testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results.json'), 'utf8'))

  context('cancelled test', () => {
    it('should return the payload', () => {
      testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[2])
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = testResultsMockDB[2]

      return testResultsService.generateExpiryDate(mockData)
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
      return testResultsService.generateExpiryDate(mockData)
        .then(response => {
          expect((response.testTypes[0].testExpiryDate).split('T')[0]).to.equal(dateFns.addYears(new Date(), 1).toISOString().split('T')[0])
        })
    })
  })

  context('submitted test', () => {
    let testResultsList
    let testResultsDAOMock
    let testResultsService
    beforeEach(() => {
      testResultsList = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results.json'), 'utf8'))
      testResultsDAOMock = new TestResultsDAOMock()
      testResultsService = new TestResultsService(testResultsDAOMock)
    })
    afterEach(() => {
      testResultsList = null
      testResultsDAOMock = null
      testResultsService = null
    })
    context('for psv vehicle type', () => {
      it('should set the expiryDate for "Annual With Certificate" testTypes with testResult "pass", "fail" or "prs"', () => {
        testResultsDAOMock.testResultsResponseMock = Array.of(testResultsList[0])
        testResultsDAOMock.numberOfrecords = 1
        testResultsDAOMock.numberOfScannedRecords = 1
        let psvTestResult = testResultsList[0]
        const expectedExpiryDate = new Date()
        expectedExpiryDate.setFullYear(new Date().getFullYear() + 1)
        expectedExpiryDate.setDate(new Date().getDate() - 1)
        return testResultsService.generateExpiryDate(psvTestResult)
          .then(psvTestResultWithExpiryDateAndTestNumber => {
            expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split('T')[0]).to.equal(expectedExpiryDate.toISOString().split('T')[0])
          })
      })
    })
    context('for hgv and trl vehicle types', () => {
      context('when there is no certificate issued for this vehicle', () => {
        it('should set the expiry date to last day of current month + 1 year', () => {
          testResultsDAOMock.testResultsResponseMock = []
          testResultsDAOMock.numberOfrecords = 0
          testResultsDAOMock.numberOfScannedRecords = 0
          let hgvTestResult = testResultsList[15]
          const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1)
          return testResultsService.generateExpiryDate(hgvTestResult)
            .then(hgvTestResultWithExpiryDate => {
              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split('T')[0]).to.equal(expectedExpiryDate.toISOString().split('T')[0])
            })
        })
      })
      context('when there is a certificate issued for this vehicle that expired', () => {
        it('should set the expiry date to last day of current month + 1 year', () => {
          testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[15])
          testResultsDAOMock.numberOfrecords = 1
          testResultsDAOMock.numberOfScannedRecords = 1
          const pastExpiryDate = dateFns.subMonths(new Date(), 1)
          testResultsDAOMock.testResultsResponseMock[0].testTypes[0].testExpiryDate = pastExpiryDate
          let hgvTestResult = testResultsList[15]
          const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1)
          return testResultsService.generateExpiryDate(hgvTestResult)
            .then(hgvTestResultWithExpiryDate => {
              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split('T')[0]).to.equal(expectedExpiryDate.toISOString().split('T')[0])
            })
        })
      })
      context('when there is a certificate issued for this vehicle that is expiring more than two months in the future', () => {
        it('should set the expiry date to last day of current month + 1 year', () => {
          testResultsDAOMock.testResultsResponseMock = Array.of(testResultsMockDB[15])
          testResultsDAOMock.numberOfrecords = 1
          testResultsDAOMock.numberOfScannedRecords = 1
          const futureExpiryDate = dateFns.addMonths(new Date(), 3)
          testResultsDAOMock.testResultsResponseMock[0].testTypes[0].testExpiryDate = futureExpiryDate
          const testResultsService = new TestResultsService(testResultsDAOMock)
          let hgvTestResult = testResultsList[15]
          const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1)
          return testResultsService.generateExpiryDate(hgvTestResult)
            .then(hgvTestResultWithExpiryDate => {
              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split('T')[0]).to.equal(expectedExpiryDate.toISOString().split('T')[0])
            })
        })
      })
    })
  })

  context('no testTypes', () => {
    it('should throw an error', () => {
      const testResultsService = new TestResultsService(testResultsDAOMock)
      let mockData = {}

      return testResultsService.generateExpiryDate(mockData)
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
          expect(data.length).to.equal(16)
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
          expect(data.length).to.equal(16)
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
