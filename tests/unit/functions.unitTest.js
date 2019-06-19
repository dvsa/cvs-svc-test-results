const sinon = require('sinon').createSandbox()
const expect = require('chai').expect
const getTestResultsByTesterStaffId = require('../../src/functions/getTestResultsByTesterStaffId').getTestResultsByTesterStaffId
const getTestResultsByVin = require('../../src/functions/getTestResultsByVin').getTestResultsByVin
const postTestResults = require('../../src/functions/postTestResults').postTestResults
const TestResultsService = require('../../src/services/TestResultsService')
const HTTPResponse = require('../../src/models/HTTPResponse')
const HTTPError = require('../../src/models/HTTPError')
const Enum = require('../../src/utils/Enum')
const path = require('path')
const fs = require('fs')
const AWSXray = require('aws-xray-sdk')

const SUCCESS = 'It Works'
const FAIL = 'It Broke'

describe('getTestResultsByTesterStaffId', () => {
  afterEach(() => {
    sinon.restore()
  })

  context('with correct input', () => {
    it('should return 200 + data on successful submission', async () => {
      const event = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/get-event-pass.json'), 'utf8'))

      let fakeSubsegment = sinon.fake()
      let fakeSegment = sinon.fake.returns({ addNewSubsegment: fakeSubsegment })
      sinon.replace(AWSXray, 'getSegment', fakeSegment)

      let fake = sinon.fake.returns(Promise.resolve(SUCCESS))
      sinon.replace(TestResultsService.prototype, 'getTestResults', fake)

      let res = await getTestResultsByTesterStaffId(event)
      // eslint-disable-next-line no-unused-expressions
      expect(res instanceof HTTPResponse).to.be.true
      expect(res.body).to.equal(JSON.stringify(SUCCESS))
      expect(res.statusCode).to.equal(200)

      // Expect subsegment to have been initialised with function name
      expect(fakeSubsegment.firstCall.args[0]).to.equal('getTestResultsByTesterStaffId')
    })

    it('should return the thrown error if service fails', async () => {
      const event = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/get-event-pass.json'), 'utf8'))

      let fakeSubsegment = sinon.fake()
      let fakeSegment = sinon.fake.returns({ addNewSubsegment: fakeSubsegment })
      sinon.replace(AWSXray, 'getSegment', fakeSegment)

      let error = new HTTPError(418, FAIL)
      let fake = sinon.fake.returns(Promise.reject(error))
      sinon.replace(TestResultsService.prototype, 'getTestResults', fake)

      let res = await getTestResultsByTesterStaffId(event)
      // eslint-disable-next-line no-unused-expressions
      expect(res instanceof HTTPResponse).to.be.true
      expect(res.body).to.equal(JSON.stringify(error.body))
      expect(res.statusCode).to.equal(error.statusCode)
    })
  })

  context('with incorrect input', () => {
    it('should return a 400 bad request', async () => {
      let event = {}

      let fakeSubsegment = sinon.fake()
      let fakeSegment = sinon.fake.returns({ addNewSubsegment: fakeSubsegment })
      sinon.replace(AWSXray, 'getSegment', fakeSegment)

      let res = await getTestResultsByTesterStaffId(event)
      // eslint-disable-next-line no-unused-expressions
      expect(res instanceof HTTPResponse).to.be.true
      expect(res.body).to.equal(JSON.stringify(Enum.BAD_REQUEST))
      expect(res.statusCode).to.equal(400)
    })
  })
})

describe('getTestResultsByVin', () => {
  afterEach(() => {
    sinon.restore()
  })

  context('with correct input, and filters', () => {
    it('should return 200 + data on successful submission', async () => {
      const event = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/get-event-pass.json'), 'utf8'))

      let fakeSubsegment = sinon.fake()
      let fakeSegment = sinon.fake.returns({ addNewSubsegment: fakeSubsegment })
      sinon.replace(AWSXray, 'getSegment', fakeSegment)

      let fake = sinon.fake.returns(Promise.resolve(SUCCESS))
      sinon.replace(TestResultsService.prototype, 'getTestResults', fake)

      let res = await getTestResultsByVin(event)
      // eslint-disable-next-line no-unused-expressions
      expect(res instanceof HTTPResponse).to.be.true
      expect(res.body).to.equal(JSON.stringify(SUCCESS))
      expect(res.statusCode).to.equal(200)

      // Expect subsegment to have been initialised with function name
      expect(fakeSubsegment.firstCall.args[0]).to.equal('getTestResultsByVin')
    })

    it('should return the thrown error if service fails', async () => {
      const event = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/get-event-pass.json'), 'utf8'))

      let fakeSubsegment = sinon.fake()
      let fakeSegment = sinon.fake.returns({ addNewSubsegment: fakeSubsegment })
      sinon.replace(AWSXray, 'getSegment', fakeSegment)

      let error = new HTTPError(418, FAIL)
      let fake = sinon.fake.returns(Promise.reject(error))
      sinon.replace(TestResultsService.prototype, 'getTestResults', fake)

      let res = await getTestResultsByVin(event)
      // eslint-disable-next-line no-unused-expressions
      expect(res instanceof HTTPResponse).to.be.true
      expect(res.body).to.equal(JSON.stringify(error.body))
      expect(res.statusCode).to.equal(error.statusCode)
    })
  })

  context('with correct input, and no filters', () => {
    it('should be fine, and return 200 + data on successful submission', async () => {
      const event = { pathParameters: { vin: 'mr magoo' } }

      let fake = sinon.fake.returns(Promise.resolve(SUCCESS))
      sinon.replace(TestResultsService.prototype, 'getTestResults', fake)

      let res = await getTestResultsByVin(event)
      // eslint-disable-next-line no-unused-expressions
      expect(res instanceof HTTPResponse).to.be.true
      expect(res.body).to.equal(JSON.stringify(SUCCESS))
      expect(res.statusCode).to.equal(200)
    })
  })

  context('with incorrect input', () => {
    context('empty toDateTime', () => {
      it('should return a 400 bad request', async () => {
        const event = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/get-event-pass.json'), 'utf8'))
        event.queryStringParameters.toDateTime = ''

        let fakeSubsegment = sinon.fake()
        let fakeSegment = sinon.fake.returns({ addNewSubsegment: fakeSubsegment })
        sinon.replace(AWSXray, 'getSegment', fakeSegment)

        let res = await getTestResultsByVin(event)
        // eslint-disable-next-line no-unused-expressions
        expect(res instanceof HTTPResponse).to.be.true
        expect(res.body).to.equal(JSON.stringify(Enum.BAD_REQUEST))
        expect(res.statusCode).to.equal(400)
      })
    })

    context('empty fromDateTime', () => {
      it('should also return a 400 bad request', async () => {
        const event = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/get-event-pass.json'), 'utf8'))
        event.queryStringParameters.fromDateTime = ''

        let fakeSubsegment = sinon.fake()
        let fakeSegment = sinon.fake.returns({ addNewSubsegment: fakeSubsegment })
        sinon.replace(AWSXray, 'getSegment', fakeSegment)

        let res = await getTestResultsByVin(event)
        // eslint-disable-next-line no-unused-expressions
        expect(res instanceof HTTPResponse).to.be.true
        expect(res.body).to.equal(JSON.stringify(Enum.BAD_REQUEST))
        expect(res.statusCode).to.equal(400)
      })
    })
  })
})

describe('postTestResults', () => {
  afterEach(() => {
    sinon.restore()
  })

  context('with correct input', () => {
    it('should return 201 + message on successful submission', async () => {
      let event = require('../resources/post-event-pass')

      let fakeSubsegment = sinon.fake()
      let fakeSegment = sinon.fake.returns({ addNewSubsegment: fakeSubsegment })
      sinon.replace(AWSXray, 'getSegment', fakeSegment)

      let fake = sinon.fake.returns(Promise.resolve(SUCCESS))
      sinon.replace(TestResultsService.prototype, 'insertTestResult', fake)

      let res = await postTestResults(event)
      // eslint-disable-next-line no-unused-expressions
      expect(res instanceof HTTPResponse).to.be.true
      expect(res.body).to.equal(JSON.stringify(Enum.RECORD_CREATED))
      expect(res.statusCode).to.equal(201)

      // Expect subsegment to have been initialised with function name
      expect(fakeSubsegment.firstCall.args[0]).to.equal('postTestResults')
    })

    it('should return the thrown error if service fails', async () => {
      const event = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/post-event-pass.json'), 'utf8'))

      let fakeSubsegment = sinon.fake()
      let fakeSegment = sinon.fake.returns({ addNewSubsegment: fakeSubsegment })
      sinon.replace(AWSXray, 'getSegment', fakeSegment)

      let error = new HTTPError(418, FAIL)
      let fake = sinon.fake.returns(Promise.reject(error))
      sinon.replace(TestResultsService.prototype, 'insertTestResult', fake)

      let res = await postTestResults(event)
      // eslint-disable-next-line no-unused-expressions
      expect(res instanceof HTTPResponse).to.be.true
      expect(res.body).to.equal(JSON.stringify(error.body))
      expect(res.statusCode).to.equal(error.statusCode)
    })
  })

  context('with incorrect input', () => {
    context('missing payload body', () => {
      it('should return a 400 bad request', async () => {
        let event = {}

        let fakeSubsegment = sinon.fake()
        let fakeSegment = sinon.fake.returns({ addNewSubsegment: fakeSubsegment })
        sinon.replace(AWSXray, 'getSegment', fakeSegment)

        let res = await postTestResults(event)
        // eslint-disable-next-line no-unused-expressions
        expect(res instanceof HTTPResponse).to.be.true
        expect(res.body).to.equal(JSON.stringify(Enum.INVALID_JSON))
        expect(res.statusCode).to.equal(400)
      })
    })
  })
})