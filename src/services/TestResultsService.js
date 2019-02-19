'use strict'

const HTTPError = require('../models/HTTPError')
const testResultsSchemaSubmitted = require('../models/TestResultsSchemaSubmitted')
const testResultsSchemaCancelled = require('../models/TestResultsSchemaCancelled')
const uuidv4 = require('uuid/v4')
const Joi = require('joi')
const dateFns = require('../../node_modules/date-fns')

/**
 * Service for retrieving and creating Test Results from/into the db
 * @returns Promise
 */
class TestResultsService {
  constructor (testResultsDAO) {
    this.testResultsDAO = testResultsDAO
  }

  getTestResultsByVinAndStatus (vin, status, fromDateTime, toDateTime) {
    return this.testResultsDAO.getByVin(vin)
      .then(data => {
        if (data.Count === 0) {
          throw new HTTPError(404, 'No resources match the search criteria')
        }

        const testResults = data.Items

        // filter by status
        if (testResults !== null) {
          var filteredTestResults = testResults.filter(
            function (testResult) { return testResult.testStatus === status }
          )
          // filter by date
          for (let i = 0; i < filteredTestResults.length; i++) {
            filteredTestResults[i].testTypes = filteredTestResults[i].testTypes.filter(
              function (testType) {
                return (!(dateFns.isAfter(testType.createdAt, toDateTime) || dateFns.isBefore(testType.createdAt, fromDateTime)))
              })
          }

          // if after filtering, there are any testResult items that contain no testType, remove the whole testResult from response
          filteredTestResults = filteredTestResults.filter(
            function (testResult) {
              return testResult.testTypes.length !== 0
            })

          if (filteredTestResults.length === 0) {
            throw new HTTPError(404, 'No resources match the search criteria')
          }
        }
        // remove testResultId property from objects
        for (let i = 0; i < filteredTestResults.length; i++) { delete filteredTestResults[i].testResultId }

        return filteredTestResults
      })
      .catch(error => {
        if (!(error instanceof HTTPError)) {
          console.error(error)
          error = new HTTPError(500, 'Internal Server Error')
        }
        throw error
      })
  }

  async insertTestResult (payload) {
    Object.assign(payload, { testResultId: uuidv4() })
    let validation = null
    if (payload.testStatus === 'submitted') {
      validation = Joi.validate(payload, testResultsSchemaSubmitted)
    } else if (payload.testStatus === 'cancelled') {
      validation = Joi.validate(payload, testResultsSchemaCancelled)
    }

    if (!this.reasonForAbandoningPresentOnAllAbandonedTests) {
      return Promise.reject(new HTTPError(400, 'Reason for Abandoning not present on all abandoned tests'))
    }
    if (validation !== null && validation.error) {
      return Promise.reject(new HTTPError(400, {
        errors: validation.error.details.map((details) => {
          return details.message
        })
      }))
    }
    payload = this.setCreatedAtAndLastUpdatedAtDates(payload)
    this.getTestTypesWithTestCodesAndClassification(payload.testTypes, payload.vehicleType, payload.vehicleSize, payload.vehicleConfiguration)
      .then((testTypesWithTestCodesAndClassification) => {
        payload.testTypes = testTypesWithTestCodesAndClassification
      })
      .then(() => {
        return this.setExpiryDate(payload)
          .then((payloadWithExpiryDate) => {
            let payloadWithoutClassification = this.removeVehicleClassification(payloadWithExpiryDate)
            payloadWithoutClassification = this.setAnniversaryDate(payloadWithoutClassification)
            payloadWithoutClassification = this.setVehicleId(payloadWithoutClassification)
            return this.testResultsDAO.createSingle(payloadWithoutClassification)
              .catch((error) => {
                throw new HTTPError(error.statusCode, error.message)
              })
          })
      })
  }
  reasonForAbandoningPresentOnAllAbandonedTests (payload) {
    if (payload.testType) {
      payload.testTypes.forEach(testType => {
        if (testType.testResult === 'abandoned' && !testType.reasonForAbandoning) {
          return false
        }
      })
    }
  }
  setCreatedAtAndLastUpdatedAtDates (payload) {
    if (payload.testTypes) {
      payload.testTypes.forEach(testType => {
        Object.assign(testType,
          {
            createdAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString()
          })
      })
    }
    return payload
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

  setExpiryDate (payload) {
    return this.getMostRecentExpiryDateOnAllTestTypesByVin(payload.vin)
      .then((mostRecentExpiryDateOnAllTestTypesByVin) => {
        if (this.atLeastOneTestTypeWithTestTypeClassificationAnnualWithCertificate(payload.testTypes)) {
          payload.testTypes.forEach((testType) => {
            if ((testType.testResult === 'pass' || testType.testResult === 'prs')) {
              if (mostRecentExpiryDateOnAllTestTypesByVin === new Date(1970, 1, 1) || dateFns.isBefore(mostRecentExpiryDateOnAllTestTypesByVin, new Date()) || dateFns.isAfter(mostRecentExpiryDateOnAllTestTypesByVin, dateFns.addMonths(new Date(), 2))) {
                testType.testExpiryDate = dateFns.subDays(dateFns.addYears(new Date(), 1), 1).toISOString()
              } else if (dateFns.isEqual(mostRecentExpiryDateOnAllTestTypesByVin, new Date())) {
                testType.testExpiryDate = dateFns.addYears(new Date(), 1).toISOString()
              } else if (dateFns.isBefore(mostRecentExpiryDateOnAllTestTypesByVin, dateFns.addMonths(new Date(), 2)) && dateFns.isAfter(mostRecentExpiryDateOnAllTestTypesByVin, new Date())) {
                testType.testExpiryDate = dateFns.addYears(mostRecentExpiryDateOnAllTestTypesByVin, 1).toISOString()
              }
            }
          })
        }
        return payload
      }).catch(error => console.error(error))
  }
  getMostRecentExpiryDateOnAllTestTypesByVin (vin) {
    let maxDate = new Date(1970, 1, 1)
    return this.getTestResultsByVinAndStatus(vin, 'submitted', new Date(1970, 1, 1), new Date())
      .then((testResults) => {
        var testTypes = []

        testResults.forEach((testResult) => {
          this.getTestTypesWithTestCodesAndClassification(testResult.testTypes, testResult.vehicleType, testResult.vehicleSize, testResult.vehicleConfiguration)
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

  getTestTypesWithTestCodesAndClassification (testTypes, vehicleType, vehicleSize, vehicleConfiguration) {
    let promiseArray = []
    let allTestCodesAndClassifications = []
    if (testTypes === undefined) {
      testTypes = []
    }
    for (let i = 0; i < testTypes.length; i++) {
      const promise = this.testResultsDAO.getTestCodesAndClassificationFromTestTypes(testTypes[i].testTypeId, vehicleType, vehicleSize, vehicleConfiguration)
        .then((currentTestCodesAndClassification) => {
          allTestCodesAndClassifications.push(currentTestCodesAndClassification)
        }).catch(error => {
          console.error(error)
          throw error
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
    }).catch((err) => {
      console.error(err)
      throw err
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
          throw new HTTPError(500, 'Internal ServerError')
        }
      })
  }
}

module.exports = TestResultsService
