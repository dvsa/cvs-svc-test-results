'use strict'

const dateFns = require('date-fns')

class GetTestResults {
  static validateDates (fromDateTime, toDateTime) {
    let isToDatetimeValid = !isNaN(new Date(toDateTime))
    let isFromDateTimeValid = !isNaN(new Date(fromDateTime))

    return !(!isToDatetimeValid || !isFromDateTimeValid)
  }

  static removeTestResultId (testResults) {
    if (testResults) {
      for (let i = 0; i < testResults.length; i++) { delete testResults[i].testResultId }
    }
    return testResults
  }

  static filterTestResultsByParam (testResults, filterName, filterValue) {
    return testResults.filter((testResult) => {
      return testResult[filterName] === filterValue
    })
  }

  static filterTestResultByDate (testResults, fromDateTime, toDateTime) {
    return testResults.filter((testResult) => {
      return dateFns.isAfter(testResult.testStartTimestamp, fromDateTime) && dateFns.isBefore(testResult.testEndTimestamp, toDateTime)
    })
  }

  static filterTestResultsByDeleteFlag (testResults) {
    return testResults.filter((testResult) => {
      return !testResult.deleteFlag === true
    })
  }

  static filterTestTypesByDeleteFlag (testResults) {
    testResults.forEach(testResult => {
      let filteredTestTypes = testResult.testTypes.filter(testType => {
        return !testType.deleteFlag === true
      })
      testResult.testTypes = filteredTestTypes
    })
    return testResults
  }
}

module.exports = GetTestResults
