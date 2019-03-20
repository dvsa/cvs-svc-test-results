/* global describe context it */
const expect = require('chai').expect
const lambdaService = require('../../src/services/LambdaService')
const Configuration = require('../../src/utils/Configuration')
const lambdaInvokeEndpoints = Configuration.getInstance().getEndpoints()

describe('invoke', () => {
  context('when calling the getTestTypesById lambda', () => {
    it('should return the details of a test type', () => {
      const fields = 'defaultTestCode,linkedTestCode,testTypeClassification'

      var event = {
        path: '/test-types/' + 1,
        queryStringParameters: {
          vehicleType: 'psv',
          vehicleSize: 'small',
          vehicleConfiguration: 'rigid',
          fields: fields
        },
        pathParameters: {
          id: 1
        },
        httpMethod: 'GET',
        resource: '/test-types/{id}'
      }
      return lambdaService.invoke(lambdaInvokeEndpoints.functions.getTestTypesById.name, event).then((response) => {
        expect(response.id).to.equal('1')
      })
    })
  })
})
