function generateConfig () {
  var BRANCH = process.env.BRANCH

  var localConfig =
  {
    DYNAMODB_DOCUMENTCLIENT_PARAMS:
    {
      region: 'localhost',
      endpoint: 'http://localhost:8004/'
    },
    DYNAMODB_TABLE_NAME: 'cvs-' + BRANCH + '-test-results'
  }

  var pipelineConfig =
  {
    DYNAMODB_DOCUMENTCLIENT_PARAMS: {},
    DYNAMODB_TABLE_NAME: 'cvs-' + BRANCH + '-test-results'
  }

  if (!BRANCH) {
    console.error('Please define BRANCH environment variable')
  } else if (BRANCH === 'local') {
    return localConfig
  } else {
    return pipelineConfig
  }
}

module.exports = generateConfig
