const dateFns = require('date-fns')

class PutTestResults {
  static lecTestTypeWithoutCertificateNumber (payload) {
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
  static fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory (payload) {
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

  static setTestNumber (payload) {
    if (payload.testTypes) {
      return this.testResultsDAO.getTestNumber()
        .then((testNumberResponse) => {
          payload.testTypes.forEach(testType => {
            testType.testNumber = testNumberResponse.testNumber
          })
          return payload
        })
    } else {
      return Promise.resolve(payload)
    }
  }
  static reasonForAbandoningPresentOnAllAbandonedTests (payload) {
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
  static setCreatedAtAndLastUpdatedAtDates (payload) {
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

  static removeVehicleClassification (payload) {
    payload.testTypes.forEach((testType) => {
      delete testType.testTypeClassification
    })
    return payload
  }

  static setVehicleId (payload) {
    payload.vehicleId = payload.vrm
    return payload
  }

  static setAnniversaryDate (payload) {
    payload.testTypes.forEach(testType => {
      if (testType.testExpiryDate) {
        testType.testAnniversaryDate = dateFns.addDays(dateFns.subMonths(testType.testExpiryDate, 2), 1).toISOString()
      }
    })
    return payload
  }

  static setExpiryDate (payload) {
    return this.getMostRecentExpiryDateOnAllTestTypesByVin(payload.vin)
      .then((mostRecentExpiryDateOnAllTestTypesByVin) => {
        if (this.atLeastOneTestTypeWithTestTypeClassificationAnnualWithCertificate(payload.testTypes)) {
          payload.testTypes.forEach((testType) => {
            if ((testType.testResult === 'pass' || testType.testResult === 'prs')) {
              testType.certificateNumber = testType.testNumber
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
  static getMostRecentExpiryDateOnAllTestTypesByVin (vin) {
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
  static atLeastOneTestTypeWithTestTypeClassificationAnnualWithCertificate (testTypes) {
    let bool = false
    testTypes.forEach((testType) => {
      if (testType.testTypeClassification === 'Annual With Certificate') {
        bool = true
      }
    })
    return bool
  }

  static getTestTypesWithTestCodesAndClassification (testTypes, vehicleType, vehicleSize, vehicleConfiguration) {
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
}

module.exports = PutTestResults
