const HTTPError = require('../models/HTTPError')

/**
 * Validates the invocation response
 * @param response - the invocation response
 */
const validateInvocationResponse = (response) => {
  if (!response.Payload || response.Payload === '' || (response.StatusCode && response.StatusCode >= 400)) {
    throw new HTTPError(response.StatusCode, `Lambda invocation returned error: ${response.StatusCode} with empty payload.`)
  }

  let payload

  try {
    payload = JSON.parse(response.Payload)
  } catch (error) {
    throw new HTTPError(500, `Lambda invocation returned bad data: ${response.Payload}.`)
  }

  if (payload.statusCode >= 400) {
    throw new HTTPError(payload.statusCode, `Lambda invocation returned error: ${payload.statusCode} ${payload.body}`)
  }

  return payload
}

module.exports = validateInvocationResponse
