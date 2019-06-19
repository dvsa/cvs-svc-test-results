const expect = require('chai').expect
const Configuration = require('../../src/utils/Configuration')

describe('The configuration service', () => {
  context('with good config file', () => {
    it('should return local versions of the config if specified', () => {
      process.env.BRANCH = 'local'
      let configService = Configuration.getInstance()
      let functions = configService.getFunctions()
      expect(functions.length).to.equal(3)
      expect(functions[0].name).to.equal('postTestResults')
      expect(functions[1].name).to.equal('getTestResultsByVin')
      expect(functions[2].name).to.equal('getTestResultsByTesterStaffId')

      let DBConfig = configService.getDynamoDBConfig()
      expect(DBConfig).to.equal(configService.config.dynamodb.local)

      let endpoints = configService.getEndpoints()
      expect(numberOfKeys(endpoints)).to.equal(2)
    })

    it('should return local-global versions of the config if specified', () => {
      process.env.BRANCH = 'local-global'
      let configService = Configuration.getInstance()
      let functions = configService.getFunctions()
      expect(functions.length).to.equal(3)
      expect(functions[0].name).to.equal('postTestResults')
      expect(functions[1].name).to.equal('getTestResultsByVin')
      expect(functions[2].name).to.equal('getTestResultsByTesterStaffId')

      let DBConfig = configService.getDynamoDBConfig()
      expect(DBConfig).to.equal(configService.config.dynamodb['local-global'])

      let endpoints = configService.getEndpoints()
      expect(numberOfKeys(endpoints)).to.equal(2)
    })

    it('should return remote versions of the config by default', () => {
      process.env.BRANCH = 'CVSB-XXX'
      let configService = Configuration.getInstance()
      let functions = configService.getFunctions()
      expect(functions.length).to.equal(3)
      expect(functions[0].name).to.equal('postTestResults')
      expect(functions[1].name).to.equal('getTestResultsByVin')
      expect(functions[2].name).to.equal('getTestResultsByTesterStaffId')

      let DBConfig = configService.getDynamoDBConfig()
      expect(DBConfig).to.equal(configService.config.dynamodb.remote)

      let endpoints = configService.getEndpoints()
      expect(numberOfKeys(endpoints)).to.equal(2)
    })

    it('should return raw config object on getConfig', () => {
      let configService = Configuration.getInstance()
      let config = configService.getConfig()
      expect(config).to.deep.equal(configService.config)
    })
  })

  context('with bad config file', () => {
    it('should return an error for missing functions from getFunctions', () => {
      let config = new Configuration('../../tests/resources/badConfig.yml')
      try {
        config.getFunctions()
      } catch (e) {
        expect(e.message).to.equal('Functions were not defined in the config file.')
      }
    })

    it('should return an error for missing DB Config from getDynamoDBConfig', () => {
      let config = new Configuration('../../tests/resources/badConfig.yml')
      try {
        config.getDynamoDBConfig()
      } catch (e) {
        expect(e.message).to.equal('DynamoDB config is not defined in the config file.')
      }
    })

    it('should return an error for missing Endpoints from getEndpoints', () => {
      let config = new Configuration('../../tests/resources/badConfig.yml')
      try {
        config.getEndpoints()
      } catch (e) {
        expect(e.message).to.equal('Endpoints were not defined in the config file.')
      }
    })
  })
})

let numberOfKeys = (obj) => {
  return Object.keys(obj).length
}
