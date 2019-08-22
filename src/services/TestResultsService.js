'use strict'

const HTTPError = require('../models/HTTPError')
const HTTPResponse = require('../models/HTTPResponse')
const testResultsSchemaSubmitted = require('../models/TestResultsSchemaSubmitted')
const testResultsSchemaCancelled = require('../models/TestResultsSchemaCancelled')
const Joi = require('joi')
const dateFns = require('date-fns')
const GetTestResults = require('../utils/GetTestResults')
const MESSAGES = require('../utils/Enum')

/**
 * Service for retrieving and creating Test Results from/into the db
 * @returns Promise
 */
class TestResultsService {
  constructor (testResultsDAO) {
    this.testResultsDAO = testResultsDAO
  }

  async getTestResults (filters) {
    if (filters) {
      if (Object.keys(filters).length !== 0) {
        if (filters.fromDateTime && filters.toDateTime) {
          if (!GetTestResults.validateDates(filters.fromDateTime, filters.toDateTime)) {
            console.log('Invalid Filter Dates')
            return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST))
          }
        }
        if (filters.vin) {
          return this.testResultsDAO.getByVin(filters.vin).then(response => {
            return this.applyTestResultsFilters(response, filters)
          }).catch(error => {
            if (!(error instanceof HTTPError)) {
              console.log(error)
              error = new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR)
            }
            throw error
          })
        } else if (filters.testerStaffId) {
          let results = await this.testResultsDAO.getByTesterStaffId(filters.testerStaffId)
            .catch(error => {
              if (!(error instanceof HTTPError)) {
                console.log(error)
                error = new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR)
              }
              throw error
            })
          return this.applyTestResultsFilters(results, filters)
        } else {
          console.log('Filters object invalid')
          return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST))
        }
      } else {
        console.log('Filters object empty')
        return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST))
      }
    } else {
      console.log('Missing filters object')
      return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST))
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
    testResults = GetTestResults.filterTestResultsByDeletionFlag(testResults)
    testResults = GetTestResults.filterTestTypesByDeletionFlag(testResults)

    if (testResults.length === 0) {
      throw new HTTPError(404, 'No resources match the search criteria')
    }
    testResults = GetTestResults.removeTestResultId(testResults)
    testResults = testResults.map((testResult) => this.removeVehicleClassification(testResult))
    return testResults
  }

  insertTestResult (payload) {
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
            return this.setExpiryDateAndCertificateNumber(payloadWithTestNumber)
              .then((payloadWithExpiryDate) => {
                let payloadWithAnniversaryDate = this.setAnniversaryDate(payloadWithExpiryDate)
                let payloadWithVehicleId = this.setVehicleId(payloadWithAnniversaryDate)
                return this.testResultsDAO.createSingle(payloadWithVehicleId)
              })
          })
      }).catch((error) => {
        if (error.statusCode === 400 && error.message === 'The conditional request failed') {
          console.log('Error in insertTestResult > getTestTypesWithTestCodesAndClassification: Test Result id already exists', error)
          return Promise.reject(new HTTPResponse(201, 'Test Result id already exists'))
        } else if (error.statusCode === 404 && error.body === 'No resources match the search criteria.') {
          console.log('ERROR CHECK HERE', error)
          return Promise.reject(new HTTPResponse(404, 'Test types not found'))
        }
        console.log('Error in insertTestResult > getTestTypesWithTestCodesAndClassification', error)
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

  setExpiryDateAndCertificateNumber (payload) {
    if (payload.testStatus !== 'submitted') {
      return Promise.resolve(payload)
    } else {
      return this.getMostRecentExpiryDateOnAllTestTypesByVin(payload.vin)
        .then((mostRecentExpiryDateOnAllTestTypesByVin) => {
          payload.testTypes.forEach((testType) => {
            if (testType.testTypeClassification === 'Annual With Certificate' && (testType.testResult === 'pass' || testType.testResult === 'prs' || testType.testResult === 'fail')) {
              testType.certificateNumber = testType.testNumber
              if (testType.testResult !== 'fail') {
                if (dateFns.isEqual(mostRecentExpiryDateOnAllTestTypesByVin, new Date(1970, 1, 1)) || dateFns.isBefore(mostRecentExpiryDateOnAllTestTypesByVin, dateFns.startOfDay(new Date())) || dateFns.isAfter(mostRecentExpiryDateOnAllTestTypesByVin, dateFns.addMonths(new Date(), 2))) {
                  testType.testExpiryDate = dateFns.subDays(dateFns.addYears(new Date(), 1), 1).toISOString()
                } else if (dateFns.isToday(mostRecentExpiryDateOnAllTestTypesByVin)) {
                  testType.testExpiryDate = dateFns.addYears(new Date(), 1).toISOString()
                } else if (dateFns.isBefore(mostRecentExpiryDateOnAllTestTypesByVin, dateFns.addMonths(new Date(), 2)) && dateFns.isAfter(mostRecentExpiryDateOnAllTestTypesByVin, new Date())) {
                  testType.testExpiryDate = dateFns.addYears(mostRecentExpiryDateOnAllTestTypesByVin, 1).toISOString()
                }
              }
            }
          })
          return payload
        }).catch(error => {
          console.log('Error in error setExpiryDateAndCertificateNumber > getMostRecentExpiryDateOnAllTestTypesByVin', error)
          throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR)
        })
    }
  }

  getMostRecentExpiryDateOnAllTestTypesByVin (vin) {
    let maxDate = new Date(1970, 1, 1)
    return this.getTestResults({ vin: vin, testStatus: 'submitted', fromDateTime: new Date(1970, 1, 1), toDateTime: new Date() })
      .then((testResults) => {
        let promiseArray = []
        let filterTestTypes = []
        testResults.forEach((testResult) => {
          let promise = this.getTestTypesWithTestCodesAndClassification(testResult.testTypes, testResult.vehicleType, testResult.vehicleSize, testResult.vehicleConfiguration, testResult.noOfAxles)
            .then((testTypes) => {
              testTypes.forEach((testType) => {
                if (testType.testTypeClassification === 'Annual With Certificate') {
                  filterTestTypes.push(testType)
                }
              })
            })
            .catch(error => {
              console.log('Error in getMostRecentExpiryDateOnAllTestTypesByVin > getTestResults > getTestTypesWithTestCodesAndClassification: ', error)
            })
          promiseArray.push(promise)
        })
        return Promise.all(promiseArray).then(() => {
          return filterTestTypes
        })
      })
      .then((testTypes) => {
        testTypes.forEach((testType) => {
          if (dateFns.isAfter(testType.testExpiryDate, maxDate) && testType.testTypeClassification === 'Annual With Certificate') {
            maxDate = testType.testExpiryDate
          }
        })
        return maxDate
      }).catch(() => {
        console.log('Something went wrong in getMostRecentExpiryDateOnAllTestTypesByVin > getTestResults. Returning default test date.')
        return maxDate
      })
  }

  getTestTypesWithTestCodesAndClassification (testTypes, vehicleType, vehicleSize, vehicleConfiguration, noOfAxles) {
    let promiseArray = []

    if (testTypes === undefined) {
      testTypes = []
    }
    for (let i = 0; i < testTypes.length; i++) {
      const promise = this.testResultsDAO.getTestCodesAndClassificationFromTestTypes(testTypes[i].testTypeId, vehicleType, vehicleSize, vehicleConfiguration, noOfAxles)
        .then((currentTestCodesAndClassification) => {
          if (testTypes.length === 1) {
            testTypes[i].testCode = currentTestCodesAndClassification.defaultTestCode
            testTypes[i].testTypeClassification = currentTestCodesAndClassification.testTypeClassification
          } else {
            if (currentTestCodesAndClassification.linkedTestCode) {
              testTypes[i].testCode = currentTestCodesAndClassification.linkedTestCode
            } else {
              testTypes[i].testCode = currentTestCodesAndClassification.defaultTestCode
            }
            testTypes[i].testTypeClassification = currentTestCodesAndClassification.testTypeClassification
          }
        })
      promiseArray.push(promise)
    }
    return Promise.all(promiseArray).then(() => {
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
          console.log('Error in insertTestResultsList: ', error)
          throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR)
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
          console.log(error)
          throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR)
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
