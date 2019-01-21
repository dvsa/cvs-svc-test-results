const configData = require('./config.json')

function generateConfig () {
  var BRANCH = process.env.BRANCH
  var LOCAL_DYNAMODB_DOCUMENTCLIENT_PARAMS =
  {
    region: configData.REGION,
    endpoint: 'http://localhost:8004'
  }

  var config =
  {
    DYNAMODB_DOCUMENTCLIENT_PARAMS: {},
    DYNAMODB_TABLE_NAME: 'cvs-' + BRANCH + '-test-results',
    TEST_TYPES_ENDPOINT: configData.TEST_TYPES_ENDPOINT
  }

  if (!BRANCH) {
    console.error('Please define BRANCH environment variable')
  } else if (BRANCH === 'local') {
    config.DYNAMODB_DOCUMENTCLIENT_PARAMS = LOCAL_DYNAMODB_DOCUMENTCLIENT_PARAMS
  }
  return config
}

module.exports = generateConfig
