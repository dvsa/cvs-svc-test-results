# cvs-svc-test-results

#### Run AWS Lambda node functions locally with a mock API Gateway and DynamoDB to test against

Before running the start script, please make sure you have changed your dynamoDB to point locally.

Please refer to [Local Running](#Local-Running) section and also make sure you have dynamoDB credentials set up.

Please request the relevant credentials to be added locally to the `~/.aws/credentials` file.

- `nvm use`
- `npm install`
- `node_modules/.bin/sls dynamodb install`
- `npm run build`
- `npm run start`

### Git Hooks

Please set up the following prepush git hook in .git/hooks/pre-push

```
#!/bin/sh
npm run prepush && git log -p | scanrepo

```

#### Security

Please install and run the following securiy programs as part of your testing process:

https://github.com/awslabs/git-secrets

- After installing, do a one-time set up with `git secrets --register-aws`. Run with `git secrets --scan`.

https://github.com/UKHomeOffice/repo-security-scanner

- After installing, run with `git log -p | scanrepo`.

These will be run as part of prepush so please make sure you set up the git hook above so you don't accidentally introduce any new security vulnerabilities.

### DynamoDB
If you want the database to be populated with mock data on start, in your `serverless.yml` file, you need to set `seed` to `true`. You can find this setting under `custom > dynamodb > start`.

If you choose to run the DynamoDB instance separately, you can send the seed command with the following command:

```sls dynamodb seed --seed=seed_name```

Under `custom > dynamodb > seed` you can define new seed operations with the following config:
```
custom:
    dynamodb:
        seed:
          seed_name:
            sources:
            - table: TABLE_TO_SEED
              sources: [./path/to/resource.json]
```

### Testing
In order to test, you need to run the following:
- `npm run test` for unit tests
- `npm run test-i` for integration tests


### Environmental variables

- The `BRANCH` environment variable indicates in which environment is this application running. Use `BRANCH=local` for local deployment. This variable is required when starting the application or running tests.

### Local Running

To run this locally, add the following environment variables to your run configuration(s):
* AWS_XRAY_CONTEXT_MISSING = LOG_ERROR
* SLS_DEBUG = *
* BRANCH = LOCAL

and change the serverless.yml so that Custom > DynamoDB >
*      migrate: true
       seed: true
       noStart: false

**NB: Do not push these changes. They are for local running only**
