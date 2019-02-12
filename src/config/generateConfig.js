const config = require('./config.json')

function generateConfig () {
  var BRANCH = process.env.BRANCH

  var localConfig =
  {
    DYNAMODB_DOCUMENTCLIENT_PARAMS:
    {
      region: config.region,
      endpoint: config.localDB
    },
    DYNAMODB_TABLE_NAME: 'cvs-' + BRANCH + '-test-results',
    TEST_TYPES_ENDPOINT: config.localEndpoint
  }

  var pipelineConfig =
  {
    DYNAMODB_DOCUMENTCLIENT_PARAMS: {},
    DYNAMODB_TABLE_NAME: 'cvs-' + BRANCH + '-test-results',
    TEST_TYPES_ENDPOINT: config.localEndpoint
  }

  var nonprodConfig =
    {
      DYNAMODB_DOCUMENTCLIENT_PARAMS: {},
      DYNAMODB_TABLE_NAME: 'cvs-' + BRANCH + '-test-results',
      TEST_TYPES_ENDPOINT: config.nonprodConfig
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
