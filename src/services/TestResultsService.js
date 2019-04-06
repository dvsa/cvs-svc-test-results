'use strict'

const HTTPError = require('../models/HTTPError')
const testResultsSchemaSubmitted = require('../models/TestResultsSchemaSubmitted')
const testResultsSchemaCancelled = require('../models/TestResultsSchemaCancelled')
const uuidv4 = require('uuid/v4')
const Joi = require('joi')
const dateFns = require('date-fns')
const GetTestResults = require('../utils/GetTestResults')

/**
 * Service for retrieving and creating Test Results from/into the db
 * @returns Promise
 */
class TestResultsService {
  constructor (testResultsDAO) {
    this.testResultsDAO = testResultsDAO
  }

  getTestResults (filters) {
    if (filters) {
      if (Object.keys(filters).length !== 0) {
        if (filters.fromDateTime && filters.toDateTime) {
          if (!GetTestResults.validateDates(filters.fromDateTime, filters.toDateTime)) {
            return Promise.reject(new HTTPError(400, 'Bad request'))
          }
        }
        if (filters.vin) {
          return this.testResultsDAO.getByVin(filters.vin).then(response => {
            return this.applyTestResultsFilters(response, filters)
          }).catch(error => {
            if (!(error instanceof HTTPError)) {
              console.error(error)
              error = new HTTPError(500, 'Internal Server Error')
            }
            throw error
          })
        } else if (filters.testerStaffId) {
          return this.testResultsDAO.getByTesterStaffId(filters.testerStaffId).then(data => {
            return this.applyTestResultsFilters(data, filters)
          }).catch(error => {
            if (!(error instanceof HTTPError)) {
              console.error(error)
              error = new HTTPError(500, 'Internal Server Error')
            }
            throw error
          })
        } else {
          return Promise.reject(new HTTPError(400, 'Bad request'))
        }
      } else {
        return Promise.reject(new HTTPError(400, 'Bad request'))
      }
    } else {
      return Promise.reject(new HTTPError(400, 'Bad request'))
    }
  }
  checkTestResults (data) {
    if (data) {
      if (!data.Count) {
        throw new HTTPError(404, 'No resources match the search criteria')
      }
    }
    return data.Items
  }

  applyTestResultsFilters (data, filters) {
    let testResults
    testResults = this.checkTestResults(data)
    testResults = GetTestResults.filterTestResultByDate(testResults, filters.fromDateTime, filters.toDateTime)
    if (filters.testStatus) {
      testResults = GetTestResults.filterTestResultsByParam(testResults, 'testStatus', filters.testStatus)
    }
    if (filters.testStationPNumber) {
      testResults = GetTestResults.filterTestResultsByParam(testResults, 'testStationPNumber', filters.testStationPNumber)
    }
    if (testResults.length === 0) {
      throw new HTTPError(404, 'No resources match the search criteria')
    }
    testResults = GetTestResults.removeTestResultId(testResults)
    testResults = testResults.map((testResult) => this.removeVehicleClassification(testResult))
    return testResults
  }

  insertTestResult (payload) {
    Object.assign(payload, { testResultId: uuidv4() })
    let validation = null

    if (payload.testStatus === 'submitted') {
      validation = Joi.validate(payload, testResultsSchemaSubmitted)
    } else if (payload.testStatus === 'cancelled') {
      validation = Joi.validate(payload, testResultsSchemaCancelled)
    } else {
      validation = {
        error: {
          details: [
            { message: '"testStatus" should be one of ["submitted", "cancelled"]' }
          ]
        }
      }
    }
    if (!this.reasonForAbandoningPresentOnAllAbandonedTests(payload)) {
      return Promise.reject(new HTTPError(400, 'Reason for Abandoning not present on all abandoned tests'))
    }

    let fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse = this.fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(payload)
    if (fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse.result) {
      return Promise.reject(new HTTPError(400, fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse.missingFields + ' are null for a defect with deficiency category other than advisory'))
    }
    if (this.lecTestTypeWithoutCertificateNumber(payload)) {
      return Promise.reject(new HTTPError(400, 'Certificate number not present on LEC test type'))
    }
    if (validation !== null && validation.error) {
      return Promise.reject(new HTTPError(400, {
        errors: validation.error.details.map((details) => {
          return details.message
        })
      }))
    }
    payload = this.setCreatedAtAndLastUpdatedAtDates(payload)
    return this.getTestTypesWithTestCodesAndClassification(payload.testTypes, payload.vehicleType, payload.vehicleSize, payload.vehicleConfiguration, payload.noOfAxles)
      .then((testTypesWithTestCodesAndClassification) => {
        payload.testTypes = testTypesWithTestCodesAndClassification
      })
      .then(() => {
        return this.setTestNumber(payload)
          .then((payloadWithTestNumber) => {
            return this.setExpiryDateAndTestNumber(payloadWithTestNumber)
              .then((payloadWithExpiryDate) => {
                let payloadWithAnniversaryDate = this.setAnniversaryDate(payloadWithExpiryDate)
                let payloadWithVehicleId = this.setVehicleId(payloadWithAnniversaryDate)
                return this.testResultsDAO.createSingle(payloadWithVehicleId)
              })
          })
      }).catch((error) => {
        console.error(error)
        return Promise.reject(new HTTPError(500, 'Internal server error'))
      })
  }

  fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory (payload) {
    let missingFields = []
    let bool = false
    if (payload.testTypes) {
      payload.testTypes.forEach(testType => {
        if (testType.defects) {
          testType.defects.forEach(defect => {
            if (defect.deficiencyCategory !== 'advisory') {
              if (defect.additionalInformation.location === null) {
                missingFields.push('location')
                bool = true
              }
              if (defect.deficiencyText === null) {
                missingFields.push('deficiencyText')
                bool = true
              }
              if (defect.stdForProhibition === null) {
                missingFields.push('stdForProhibition')
                bool = true
              }
              if (defect.prs === null) {
                missingFields.push('prs')
                bool = true
              }
            }
          })
        }
      })
    }
    let missingFieldsString = ''
    missingFields.forEach(missingField => {
      missingFieldsString = missingFieldsString + '/' + missingField
    })
    return { result: bool, missingFields: missingFieldsString }
  }

  setTestNumber (payload) {
    let promiseArray = []

    if (payload.testTypes) {
      payload.testTypes.forEach(testType => {
        let promise = this.testResultsDAO.getTestNumber()
          .then((testNumberResponse) => {
            testType.testNumber = testNumberResponse.testNumber
          })

        promiseArray.push(promise)
      })
      return Promise.all(promiseArray).then(() => {
        return payload
      })
    } else {
      return Promise.resolve(payload)
    }
  }

  reasonForAbandoningPresentOnAllAbandonedTests (payload) {
    let bool = true
    if (payload.testTypes) {
      if (payload.testTypes.length > 0) {
        payload.testTypes.forEach(testType => {
          if (testType.testResult === 'abandoned' && !testType.reasonForAbandoning) {
            bool = false
          }
        })
      }
    }
    return bool
  }

  setCreatedAtAndLastUpdatedAtDates (payload) {
    if (payload.testTypes.length > 0) {
      payload.testTypes.forEach(testType => {
        Object.assign(testType,
          {
            createdAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString()
          })
      })
    }
    return payload
  }

  setExpiryDateAndTestNumber (payload) {
    return this.getMostRecentExpiryDateOnAllTestTypesByVin(payload.vin)
      .then((mostRecentExpiryDateOnAllTestTypesByVin) => {
        if (this.atLeastOneTestTypeWithTestTypeClassificationAnnualWithCertificate(payload.testTypes)) {
          payload.testTypes.forEach((testType) => {
            if (testType.testResult === 'pass' || testType.testResult === 'prs' || testType.testResult === 'fail') {
              testType.certificateNumber = testType.testNumber
              if (testType.testResult !== 'fail') {
                if (mostRecentExpiryDateOnAllTestTypesByVin === new Date(1970, 1, 1) || dateFns.isBefore(mostRecentExpiryDateOnAllTestTypesByVin, new Date()) || dateFns.isAfter(mostRecentExpiryDateOnAllTestTypesByVin, dateFns.addMonths(new Date(), 2))) {
                  testType.testExpiryDate = dateFns.subDays(dateFns.addYears(new Date(), 1), 1).toISOString()
                } else if (dateFns.isEqual(mostRecentExpiryDateOnAllTestTypesByVin, new Date())) {
                  testType.testExpiryDate = dateFns.addYears(new Date(), 1).toISOString()
                } else if (dateFns.isBefore(mostRecentExpiryDateOnAllTestTypesByVin, dateFns.addMonths(new Date(), 2)) && dateFns.isAfter(mostRecentExpiryDateOnAllTestTypesByVin, new Date())) {
                  testType.testExpiryDate = dateFns.addYears(mostRecentExpiryDateOnAllTestTypesByVin, 1).toISOString()
                }
              }
            }
          })
        }
        return payload
      }).catch(error => console.error(error))
  }

  getMostRecentExpiryDateOnAllTestTypesByVin (vin) {
    let maxDate = new Date(1970, 1, 1)
    return this.getTestResults({ vin: vin, testStatus: 'submitted', fromDateTime: new Date(1970, 1, 1), toDateTime: new Date() })
      .then((testResults) => {
        var testTypes = []

        testResults.forEach((testResult) => {
          this.getTestTypesWithTestCodesAndClassification(testResult.testTypes, testResult.vehicleType, testResult.vehicleSize, testResult.vehicleConfiguration, testResult.noOfAxles)
            .then((testTypes) => {
              if (testTypes.testTypeClassification) {
                testTypes.filter(testTypes.testTypeClassification === 'Annual With Certificate')
              }
            })
        })
        return testTypes
      })
      .then((testTypes) => {
        testTypes.forEach((testType) => {
          if (dateFns.isAfter(testType.testExpiryDate, maxDate) && testType.testTypeClassification === 'Annual With Certificate') {
            maxDate = testType.testExpiryDate
          }
        })
        return maxDate
      }).catch(() => {
        return maxDate
      })
  }

  atLeastOneTestTypeWithTestTypeClassificationAnnualWithCertificate (testTypes) {
    let bool = false
    testTypes.forEach((testType) => {
      if (testType.testTypeClassification === 'Annual With Certificate') {
        bool = true
      }
    })
    return bool
  }

  getTestTypesWithTestCodesAndClassification (testTypes, vehicleType, vehicleSize, vehicleConfiguration, noOfAxles) {
    let promiseArray = []
    let allTestCodesAndClassifications = []
    if (testTypes === undefined) {
      testTypes = []
    }
    for (let i = 0; i < testTypes.length; i++) {
      const promise = this.testResultsDAO.getTestCodesAndClassificationFromTestTypes(testTypes[i].testTypeId, vehicleType, vehicleSize, vehicleConfiguration, noOfAxles)
        .then((currentTestCodesAndClassification) => {
          allTestCodesAndClassifications.push(currentTestCodesAndClassification)
        })
      promiseArray.push(promise)
    }
    return Promise.all(promiseArray).then(() => {
      if (testTypes.length === 1) {
        testTypes[0].testCode = allTestCodesAndClassifications[0].defaultTestCode
        testTypes[0].testTypeClassification = allTestCodesAndClassifications[0].testTypeClassification
      } else {
        for (let i = 0; i < testTypes.length; i++) {
          if (allTestCodesAndClassifications[i].linkedTestCode) {
            testTypes[i].testCode = allTestCodesAndClassifications[i].linkedTestCode
          } else {
            testTypes[i].testCode = allTestCodesAndClassifications[i].defaultTestCode
          }
          testTypes[i].testTypeClassification = allTestCodesAndClassifications[i].testTypeClassification
        }
      }
      return testTypes
    })
  }

  insertTestResultsList (testResultsItems) {
    return this.testResultsDAO.createMultiple(testResultsItems)
      .then(data => {
        if (data.UnprocessedItems) { return data.UnprocessedItems }
      })
      .catch((error) => {
        if (error) {
          console.error(error)
          throw new HTTPError(500, 'Internal Server Error')
        }
      })
  }

  deleteTestResultsList (testResultsVinIdPairs) {
    return this.testResultsDAO.deleteMultiple(testResultsVinIdPairs)
      .then((data) => {
        if (data.UnprocessedItems) {
          return data.UnprocessedItems
        }
      })
      .catch((error) => {
        if (error) {
          console.error(error)
          throw new HTTPError(500, 'Internal Server Error')
        }
      })
  }

  lecTestTypeWithoutCertificateNumber (payload) {
    let bool = false
    if (payload.testTypes) {
      payload.testTypes.forEach(testType => {
        if (testType.testTypeId === '39' && !testType.certificateNumber) {
          return true
        }
      })
    }
    return bool
  }

  removeVehicleClassification (payload) {
    payload.testTypes.forEach((testType) => {
      delete testType.testTypeClassification
    })
    return payload
  }

  setVehicleId (payload) {
    payload.vehicleId = payload.vrm
    return payload
  }

  setAnniversaryDate (payload) {
    payload.testTypes.forEach(testType => {
      if (testType.testExpiryDate) {
        testType.testAnniversaryDate = dateFns.addDays(dateFns.subMonths(testType.testExpiryDate, 2), 1).toISOString()
      }
    })
    return payload
  }
}

module.exports = TestResultsService
