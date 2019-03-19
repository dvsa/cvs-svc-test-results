/* global describe context it */
const expect = require('chai').expect
const validateInvocationResponse = require('../../src/utils/validateInvocationResponse')

describe('validateInvocationResponse', () => {
  context('when response payload is missing', () => {
    it('should throw an error', () => {
      try {
        validateInvocationResponse({
          StatusCode: 500,
          Payload: ''
        })
      } catch (error) {
        expect(error.statusCode).to.equal(500)
      }
    })
  })

  context('when payload is not a valid JSON', () => {
    it('should throw a 500 error', () => {
      try {
        validateInvocationResponse({
          Payload: '{"headers:123}'
        })
      } catch (error) {
        expect(error.statusCode).to.equal(500)
        expect(error.body).to.equal('Lambda invocation returned bad data: {"headers:123}.')
      }
    })
  })

  context('when payload status code is >= 400', () => {
    it('should throw an error', () => {
      try {
        validateInvocationResponse({
          StatusCode: 200,
          Payload: '{"statusCode":404,"body":"No resources match the search criteria"}'
        })
      } catch (error) {
        expect(error.statusCode).to.equal(404)
        expect(error.body).to.equal('Lambda invocation returned error: 404 No resources match the search criteria')
      }
    })
  })

  context('when payload is valid', () => {
    it('should return the payload parsed', () => {
      let parsedPayload = validateInvocationResponse({
        StatusCode: 200,
        Payload: '{"statusCode":200,"body":"{}"}'
      })
      expect(parsedPayload.statusCode).to.equal(200)
    })
  })
})
