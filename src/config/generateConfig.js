function generateConfig () {
  var BRANCH = process.env.BRANCH

  var localConfig =
  {
    DYNAMODB_DOCUMENTCLIENT_PARAMS:
    {
      region: 'localhost',
      endpoint: 'http://localhost:8004/'
    },
    DYNAMODB_TABLE_NAME: 'cvs-' + BRANCH + '-test-results',
    TEST_TYPES_ENDPOINT: 'http://localhost:3002/test-types'
  }

  var pipelineConfig =
  {
    DYNAMODB_DOCUMENTCLIENT_PARAMS: {},
    DYNAMODB_TABLE_NAME: 'cvs-' + BRANCH + '-test-results',
    TEST_TYPES_ENDPOINT: 'http://localhost:3002/test-types'
  }

  var nonprodConfig =
    {
      DYNAMODB_DOCUMENTCLIENT_PARAMS: {},
      DYNAMODB_TABLE_NAME: 'cvs-' + BRANCH + '-test-results',
      TEST_TYPES_ENDPOINT: 'https://api.nonprod.cvs.dvsacloud.uk/test/test-types/'
    }

  if (!BRANCH) {
    console.error('Please define BRANCH environment variable')
  } else if (BRANCH === 'local') {
    return localConfig
  } else if (BRANCH === 'nonprod') {
    return nonprodConfig
  } else {
    return pipelineConfig
  }
}

module.exports = generateConfig
