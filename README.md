# cvs-svc-test-results

## Introduction

The test results microservice is used to capture and persist test results for a Vehicle submitted by the client (VTA/VTM). If the submitted test-result is applicable for test certificate, it triggers the generation of the certificate via dynamo streams of test result table.
The test result service also provides you with a view of historical test records.

## Dependencies

The project runs on node
18.x with typescript and serverless framework. For further details about project dependencies, please refer to the `package.json` file.
[nvm](https://github.com/nvm-sh/nvm/blob/master/README.md) is used to managed node versions and configuration explicitly done per project using an `.npmrc` file.

### Prerequisites

Please install and run the following securiy programs as part of your development process:

- [git-secrets](https://github.com/awslabs/git-secrets)
  After installing, do a one-time set up with `git secrets --register-aws`. Run with `git secrets --scan`.

These will be run as part of your projects hooks so you don't accidentally introduce any new security vulnerabilities.

## Architecture

Please refer to the the [docs](./docs/README.md) for the API specification and samples of postman requests.

### End to end design

[All in one view](https://wiki.dvsacloud.uk/pages/viewpage.action?pageId=79254695)

### Test result microservice

More information about technical designs can be found under the [Test Results Microservice](https://wiki.dvsacloud.uk/pages/viewpage.action?spaceKey=HVT&title=Test+Results+Microservice) section.

## Getting started

Set up your nodejs environment running `nvm use` and once the dependencies are installed using `npm i`, you can run the scripts from `package.json` to build your project.
This code repository uses [serverless framework](https://www.serverless.com/framework/docs/) to mock AWS capabilities for local development.
You will also require to install dynamodb serverless to run your project with by running the following command `npm run tools-setup` in your preferred shell.
Once dynamoDB is installed, you will need a local serverless profile to be created so that you can start developping locally.
The profiles are stored under `~/.aws/credentials`.

```sh
# ~/.aws/credentials

# Please not only serverless is used to develop locally, not deployment of services are done with this framework
# It might look like this
[default]
aws_access_key_id=<yourDummyAccesskey>
aws_secret_access_key=<yourDummySecret>

```

Please refer to the local development section to [configure your project locally](#developing-locally).

### Environmental variables

The `BRANCH` environment variable indicates in which environment is this application running. Use `BRANCH=local` for local deployment. This variable is required when starting the application or running tests.

### Configuration

The real lambda function of this repository can be found under `src/handler.ts`, and is a middleware function that calls lambda functions created by you according to the mapping declared in the configuration as a proxy integration pattern.

#### Branch

The configuration file can be found under `src/config/config.yml`.
Environment variable injection is possible with the syntax:
`${BRANCH}`, or you can specify a default value: `${BRANCH:local}`

### Scripts

Before running the start script, please make sure you have changed your dynamoDB to point locally.

Please refer to [developping locally](#developing-locally) section and also make sure you have dynamoDB credentials set up.

Please request the relevant credentials to be added locally to the `~/.aws/credentials` file.

- install deps; `npm install`
- install local dynamo-db: `npm run tools-setup`
- build: project: `npm run build`
- start webserver for local development: `npm run start`

### DynamoDB and seeding

You won't need to do anything.
However, if you want the database to be populated with mock data on start, in your `serverless.yml` file, you need to set `seed` to `true`. You can find this setting under `custom > dynamodb > start`.

If you choose to run the DynamoDB instance separately, you can send the seed command with the following command:

`sls dynamodb seed --seed=seed_name`

Under `custom > dynamodb > seed` you can define new seed operations with the following config:

```YML
custom:
    dynamodb:
        seed:
          seed_name:
            sources:
            - table: TABLE_TO_SEED
              sources: [./path/to/resource.json]
```

### Developing locally

You will not require to change the config to run the service locally.
The local dynamoDB config will be the following for seeding the table:

```yml
migrate: true
seed: true
noStart: false
```

### Debugging

The following environmental variables can be given to your serverless scripts to trace and debug your service:

```shell
AWS_XRAY_CONTEXT_MISSING = LOG_ERROR
SLS_DEBUG = *
BRANCH = local
```

## Testing

Jest is used for unit testing.
Please refer to the [Jest documentation](https://jestjs.io/docs/en/getting-started) for further details.

### Unit test

In order to test, you need to run the following:

```sh
npm run test # unit tests
```

### Integration test

In order to test, you need to run the following, with the service running locally:

```sh
npm run test-i # for integration tests
```

install and build if not done before

- install deps; `npm install`
- install local dynamo-db: `npm run tools-setup`
- build: project: `npm run build`

### End to end

- [Automation test repository](https://github.com/dvsa/cvs-auto-svc)
- [Java](https://docs.oracle.com/en/java/javase/11/)
- [Serenity Cucumber with Junit](https://serenity-bdd.github.io/theserenitybook/latest/junit-basic.html)

## Infrastructure

We follow a [gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) approach for development.
For the CI/CD and automation please refer to the following pages for further details:

- [Development process](https://wiki.dvsacloud.uk/display/HVT/CVS+Pipeline+Infrastructure)
- [Pipeline](https://wiki.dvsacloud.uk/pages/viewpage.action?pageId=36870584)

## Note on the `PUT` endpoint

If the record being amended only contains one item in the `testTypes` array, the default behaviour is to map the test types in the database which were not amended back onto the record. This behaviour was introduced as part of https://github.com/dvsa/cvs-svc-test-results/pull/268.

## Contributing

### Hooks and code standards

The projects has multiple hooks configured using [husky](https://github.com/typicode/husky#readme) which will execute the following scripts: `commit-msg`, `pre-commit`, and `prepush`.
The codebase uses [typescript clean code standards](https://github.com/labs42io/clean-code-typescript) as well as sonarqube for static analysis.

SonarQube is available locally, please follow the instructions below if you wish to run the service locally (brew is the preferred approach).

## SonarQube Scanning

SonarQube code coverage analysis has been added as part of the git prepush hook. This is to better align with what happens in the pipeline.  
To get it working locally, follow these steps:

- Ensure SonarQube is installed. Running in a [container](https://hub.docker.com/_/sonarqube) is a great option.
- Within SonarQube, Disable Force user authentication via Administration -> Configuration -> Security.
- Install jq with `sudo apt install jq` or `brew install jq`.
  When running `git push`, it will run tests followed by the SonarQube scan. If the scan fails or the unit test coverage is below 80%, the push is cancelled.
