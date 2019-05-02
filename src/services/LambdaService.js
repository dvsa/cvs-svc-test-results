'use strict'

const AWSXRay = require('aws-xray-sdk')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const Configuration = require('../utils/Configuration')
const lambdaInvokeEndpoints = Configuration.getInstance().getEndpoints()
const validateInvocationResponse = require('../utils/validateInvocationResponse')

/**
 * Helper service for interactions with other lambdas
 */
class LambdaService {
  static invoke (lambdaName, lambdaEvent) {
    let lambda = new AWS.Lambda(lambdaInvokeEndpoints.params)

    return lambda.invoke({
      FunctionName: lambdaName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(lambdaEvent)
    }).promise().then((data) => {
      let payload = validateInvocationResponse(data)
      let body = JSON.parse(payload.body)
      return body
    })
  }
}

module.exports = LambdaService
