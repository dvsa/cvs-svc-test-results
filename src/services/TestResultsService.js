'use strict'

const HTTPError = require('../models/HTTPError')
const testResultsSchema = require('../models/TestResultsSchema')
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

    let validation = Joi.validate(payload, testResultsSchema)

    if (validation.error) {
      return Promise.reject(new HTTPError(400, {
        errors: validation.error.details.map((details) => {
          return details.message
        })
      }))
    }

    this.getTestTypesWithTestCodesAndClassification(payload.testTypes, payload.vehicleType, payload.vehicleSize, payload.vehicleConfiguration)
      .then((newTestTypes) => {
        payload.testTypes = newTestTypes
      })
      .then(() => {
        payload = this.removeVehicleClassification(payload)
        return this.testResultsDAO.createSingle(payload)
          .catch((error) => {
            console.error(error)
            throw new HTTPError(error.statusCode, error.message)
          })
      }).catch(error => {
        console.error(error)
        throw error
      })
  }
  removeVehicleClassification (payload) {
    payload.testTypes.forEach((testType) => {
      delete testType.testTypeClassification
    })
    return payload
  }

  getTestTypesWithTestCodesAndClassification (testTypes, vehicleType, vehicleSize, vehicleConfiguration) {
    let promiseArray = []
    let allTestCodesAndClassifications = []
    for (let i = 0; i < testTypes.length; i++) {
      const promise = this.testResultsDAO.getTestCodesAndClassificationFromTestTypes(testTypes[i].testId, vehicleType, vehicleSize, vehicleConfiguration)
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
    }).then(() => {
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
