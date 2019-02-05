def label = "jenkins-node-${UUID.randomUUID().toString()}"
podTemplate(label: label, containers: [
        containerTemplate(name: 'dynamodb',
                image: 'amazon/dynamodb-local',
                command: 'java -jar /home/dynamodblocal/DynamoDBLocal.jar -inMemory -sharedDb -port 8004',
                ports: [portMapping(name: 'dynamoport', containerPort: 8004, hostPort: 8004)]),
        containerTemplate(name: 'node', image: '086658912680.dkr.ecr.eu-west-1.amazonaws.com/cvs/nodejs-builder:latest', ttyEnabled: true, alwaysPullImage: true, command: 'cat'),]){
    node(label) {

        stage('checkout') {
            checkout scm
        }

        container('node'){

            withFolderProperties{
                LBRANCH="${env.BRANCH}".toLowerCase()
            }

            stage ("npm deps") {
                sh "npm install"
            }

            stage ("security") {
                sh "git secrets --register-aws"
                sh "git secrets --scan"
                sh "git log -p | scanrepo"
            }

            stage ("credentials") {
                withCredentials([usernamePassword(credentialsId: 'dummy-credentials', passwordVariable: 'SECRET', usernameVariable: 'KEY')]) {
                    sh "sls config credentials --provider aws --key ${KEY} --secret ${SECRET}"
                }
            }
            stage ("create-seed-table") {

                sh '''
                aws dynamodb create-table \
                --table-name cvs-local-test-results \
                --attribute-definitions \
                    AttributeName=vin,AttributeType=S AttributeName=testResultId,AttributeType=S \
                --key-schema AttributeName=vin,KeyType=HASH AttributeName=testResultID,KeyType=RANGE\
                --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 --region=eu-west-1 --endpoint-url http://localhost:8004
                '''

                sh "sls dynamodb seed --seed=defects"
            }
            stage ("sonar") {
                sh "npm run sonar-scanner"
            }

            stage ("unit test") {
                sh "npm run test"
            }

            stage ("integration test") {
                sh "BRANCH=local node_modules/gulp/bin/gulp.js start-serverless"
                sh "BRANCH=local node_modules/.bin/mocha tests/**/*.intTest.js"
            }

            stage("zip dir"){
                sh "rm -rf ./node_modules"
                sh "npm install --production"
                sh "mkdir ${LBRANCH}"
                sh "cp -r src/* ${LBRANCH}/"
                sh "cp -r node_modules ${LBRANCH}/node_modules"
                sh "zip -qr ${LBRANCH}.zip ${LBRANCH}"
            }

            stage("upload to s3") {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                                  accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                                  credentialsId: 'jenkins-iam',
                                  secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {

                    sh "aws s3 cp ${LBRANCH}.zip s3://cvs-services/test-results/${LBRANCH}.zip"
                }
            }
        }
    }
}
