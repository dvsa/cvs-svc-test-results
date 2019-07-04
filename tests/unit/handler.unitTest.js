const expect = require('chai').expect
const sinon = require('sinon').createSandbox()
const proxyquire = require('proxyquire')
let stub = sinon.stub()
const handler = proxyquire('../../src/handler', { 'lambda-warmer': stub })

describe('test-results handler', () => {
  context('receives a warming event', () => {
    it('returns "warmed"', async () => {
      // Next step checks for body, and returns 400 if not present.
      stub.returns(true)
      let event = { warmer: true }
      let res = await handler.handler(event)
      expect(res).to.equal('warmed')
    })
  })

  context('receives a non-warming event', () => {
    it('carries on past the warmer check', async () => {
      // Next step checks for body, and returns 400 if not present.
      stub.returns(false)
      let event = { body: 'fail' }
      let res = await handler.handler(event)
      expect(res.statusCode).to.equal(400)
    })
  })
})
