import { Configuration } from '../../src/utils/Configuration';

describe('The configuration service', () => {
  context('with good config file', () => {
    it('should return local versions of the config if specified', () => {
      process.env.BRANCH = 'local';
      const configService = Configuration.getInstance();
      const functions = configService.getFunctions();
      expect(functions).toHaveLength(4);
      expect(functions[0].name).toBe('postTestResults');
      expect(functions[1].name).toBe('getTestResultsBySystemNumber');
      expect(functions[2].name).toBe('getTestResultsByTesterStaffId');
      expect(functions[3].name).toBe('updateTestResults');

      const DBConfig = configService.getDynamoDBConfig();
      expect(DBConfig).toEqual(configService.getConfig().dynamodb.local);

      // No Endpoints for this service
    });

    it('should return local-global versions of the config if specified', () => {
      process.env.BRANCH = 'local-global';
      const configService = Configuration.getInstance();
      const functions = configService.getFunctions();
      expect(functions).toHaveLength(4);
      expect(functions[0].name).toBe('postTestResults');
      expect(functions[1].name).toBe('getTestResultsBySystemNumber');
      expect(functions[2].name).toBe('getTestResultsByTesterStaffId');
      expect(functions[3].name).toBe('updateTestResults');

      const DBConfig = configService.getDynamoDBConfig();
      expect(DBConfig).toEqual(
        configService.getConfig().dynamodb['local-global'],
      );

      // No Endpoints for this service
    });

    it('should return remote versions of the config by default', () => {
      process.env.BRANCH = 'CVSB-XXX';
      const configService = Configuration.getInstance();
      const functions = configService.getFunctions();
      expect(functions).toHaveLength(4);
      expect(functions[0].name).toBe('postTestResults');
      expect(functions[1].name).toBe('getTestResultsBySystemNumber');
      expect(functions[2].name).toBe('getTestResultsByTesterStaffId');
      expect(functions[3].name).toBe('updateTestResults');

      const DBConfig = configService.getDynamoDBConfig();
      expect(DBConfig).toEqual(configService.getConfig().dynamodb.remote);

      // No Endpoints for this service
    });
  });

  context('with bad config file', () => {
    it('should return an error for missing functions from getFunctions', () => {
      const config = new Configuration('../../tests/resources/badConfig.yml');
      try {
        config.getFunctions();
      } catch (e) {
        expect(e.message).toBe(
          'Functions were not defined in the config file.',
        );
      }
    });

    it('should return an error for missing DB Config from getDynamoDBConfig', () => {
      const config = new Configuration('../../tests/resources/badConfig.yml');
      try {
        config.getDynamoDBConfig();
      } catch (e) {
        expect(e.message).toBe(
          'DynamoDB config is not defined in the config file.',
        );
      }
    });
  });
});
