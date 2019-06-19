const expect = require('chai').expect
const TestResultsDAO = require('../../src/models/TestResultsDAO')
const lambdaService = require('../../src/services/LambdaService')
const sinon = require('sinon').createSandbox()
const AWS = require('aws-sdk')
const config = require('../../src/utils/Configuration').getInstance()

describe('TestResultsDAO', () => {
  afterEach(() => {
    sinon.restore()
  })

  context('getByVin', () => {
    it('should construct valid query', async () => {
      let expectedCall = {
        'TableName': 'cvs-local-test-results',
        'KeyConditionExpression': '#vin = :vin',
        'ExpressionAttributeNames': {
          '#vin': 'vin'
        },
        'ExpressionAttributeValues': {
          ':vin': { 'S': 'XMGDE02FS0H012345' }
        }
      }

      let dao = new TestResultsDAO()
      let req = await dao.getByVin('XMGDE02FS0H012345')

      expect(getRequestBody(req)).to.deep.equal(JSON.stringify(expectedCall))
    })
  })

  context('getByTesterStaffId', () => {
    it('should construct valid query', async () => {
      let expectedCall = {
        'TableName': 'cvs-local-test-results',
        'IndexName': 'TesterStaffIdIndex',
        'KeyConditionExpression': '#testerStaffId = :testerStaffId',
        'ExpressionAttributeNames': {
          '#testerStaffId': 'testerStaffId'
        },
        'ExpressionAttributeValues': {
          ':testerStaffId': { 'S': '1' }
        }
      }

      let dao = new TestResultsDAO()
      let req = await dao.getByTesterStaffId('1')

      expect(getRequestBody(req)).to.deep.equal(JSON.stringify(expectedCall))
    })
  })

  context('createSingle', () => {
    it('should construct valid query', async () => {
      let testPayload = {
        'testResultId': '1111'
      }

      let expectedCall = {
        'TableName': 'cvs-local-test-results',
        'Item': testPayload,
        'ConditionExpression': 'testResultId <> :testResultIdVal',
        'ExpressionAttributeValues': {
          ':testResultIdVal': '1111'
        }
      }

      let fake = sinon.fake.returns({ promise: () => { return 'IT WORKS' } })
      sinon.replace(AWS.DynamoDB.DocumentClient.prototype, 'put', fake)

      let dao = new TestResultsDAO()
      dao.createSingle(testPayload)

      expect(fake.getCall(0).args[0]).to.deep.equal(expectedCall)
    })
  })

  context('createMultiple', () => {
    it('should construct valid query', async () => {
      let testPayload = [{
        'testResultId': '1111'
      }]

      let expectedCall = {
        'RequestItems': {
          'cvs-local-test-results': [
            {
              'PutRequest': {
                'Item': {
                  'testResultId': '1111'
                }
              }
            }
          ]
        }
      }

      let fake = sinon.fake.returns({ promise: () => {} })
      sinon.replace(AWS.DynamoDB.DocumentClient.prototype, 'batchWrite', fake)

      let dao = new TestResultsDAO()
      dao.createMultiple(testPayload)

      expect(fake.getCall(0).args[0]).to.deep.equal(expectedCall)
    })
  })

  context('deleteMultiple', () => {
    it('should construct valid query', async () => {
      let testPayload = [{
        'ABC123': '1111'
      }]

      let expectedCall = {
        'RequestItems': {
          'cvs-local-test-results': [
            {
              'DeleteRequest': {
                'Key': {
                  'testResultId': '1111',
                  'vin': 'ABC123'
                }
              }
            }
          ]
        }
      }

      let fake = sinon.fake.returns({ promise: () => {} })
      sinon.replace(AWS.DynamoDB.DocumentClient.prototype, 'batchWrite', fake)

      let dao = new TestResultsDAO()
      dao.deleteMultiple(testPayload)

      expect(fake.getCall(0).args[0]).to.deep.equal(expectedCall)
    })
  })

  context('getTestCodesAndClassificationFromTestTypes', () => {
    it('Calls lambda with expected params', () => {
      let expectedEndpoint = config.getEndpoints().functions.getTestTypesById.name
      let expectedEvent = {
        path: '/test-types/abc',
        queryStringParameters: {
          vehicleType: 'hovercraft',
          vehicleSize: 'huuuge',
          vehicleConfiguration: 'wobbly',
          vehicleAxles: '0',
          fields: 'defaultTestCode,linkedTestCode,testTypeClassification'
        },
        pathParameters: {
          id: 'abc'
        },
        httpMethod: 'GET',
        resource: '/test-types/{id}'
      }

      let fake = sinon.fake()
      sinon.replace(lambdaService, 'invoke', fake)

      let dao = new TestResultsDAO()
      dao.getTestCodesAndClassificationFromTestTypes('abc', 'hovercraft', 'huuuge', 'wobbly', '0')

      expect(fake.getCall(0).args[0]).to.deep.equal(expectedEndpoint)
      expect(fake.getCall(0).args[1]).to.deep.equal(expectedEvent)
    })
  })

  // A dumb, circular test for coverage purposes only
  context('getTestNumber', () => {
    it('Calls lambda with expected params', () => {
      let expectedCall = config.getEndpoints().functions.getTestNumber.name

      let fake = sinon.fake()
      sinon.replace(lambdaService, 'invoke', fake)

      let dao = new TestResultsDAO()
      dao.getTestNumber()

      expect(fake.getCall(0).args[0]).to.deep.equal(expectedCall)
    })
  })
})

let getRequestBody = (dao) => {
  return dao.$response.request.httpRequest.body
}
