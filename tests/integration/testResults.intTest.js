/* global describe context it before beforeEach after afterEach */
const supertest = require('supertest')
const expect = require('chai').expect
const url = 'http://localhost:3006/'
const request = supertest(url)
const TestResultsService = require('../../src/services/TestResultsService')
const TestResultsDAO = require('../../src/models/TestResultsDAO')
const fs = require('fs')
const path = require('path')
const _ = require('lodash/core')

describe('getTestResultsByVin', () => {
  context('when database is populated', () => {
    var testResultsService = null
    var testResultsDAO = null
    const databaseSeed = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results.json')))

    // Populating the database
    before((done) => {
      testResultsDAO = new TestResultsDAO()
      testResultsService = new TestResultsService(testResultsDAO)
      testResultsService.insertTestResultsList(databaseSeed)
      done()
    })

    context('and when a search by VIN is done', () => {
      context('and no status is provided', () => {
        context('and toDateTime and fromDateTime are not provided', () => {
          context('and there are test results for that VIN that have status \'submitted\' and createdAt date value between two years ago and today', () => {
            it('should return the test results for that VIN with default status \'submitted\' and default date interval which is from too years ago until today', (done) => {
              request.get('test-results/1B7GG36N12S678410/')
                .end((err, res) => {
                  const expectedResponse = Array.of(databaseSeed[1])
                  delete expectedResponse[0].testResultId
                  if (err) { expect.fail(err) }
                  expect(res.statusCode).to.equal(200)
                  expect(res.headers['access-control-allow-origin']).to.equal('*')
                  expect(res.headers['access-control-allow-credentials']).to.equal('true')
                  done()
                })
            })
          })
        })
      })
      context('and status is provided', () => {
        context('and toDateTime and fromDateTime are provided', () => {
          context('and there are test results in the db that satisfy both conditions', () => {
            it('should return the test results for that VIN with status \'submitted\' and that have createdAt value between 2017-01-01 and 2019-02-23', (done) => {
              request.get('test-results/1B7GG36N12S678410?status=submitted&fromDateTime=2017-01-01&toDateTime=2019-02-23')
                .end((err, res) => {
                  if (err) { expect.fail(err) }
                  expect(res.statusCode).to.equal(200)
                  expect(res.headers['access-control-allow-origin']).to.equal('*')
                  expect(res.headers['access-control-allow-credentials']).to.equal('true')
                  done()
                })
            })
          })
        })
      })

      context('and there are no test results for that VIN that have status \'cancelled\'', () => {
        it('should return 404', (done) => {
          request.get('test-results/1B7GG36N12S678425?status=cancelled')
            .end((err, res) => {
              if (err) { expect.fail(err) }
              expect(res.statusCode).to.equal(404)
              expect(res.headers['access-control-allow-origin']).to.equal('*')
              expect(res.headers['access-control-allow-credentials']).to.equal('true')
              expect(res.body).to.equal('No resources match the search criteria')
              done()
            })
        })
      })
    })

    after((done) => {
      testResultsService.deleteTestResultsList([{ '1B7GG36N12S678410': '1' }, { '1B7GG36N12S678410': '2' }, { '1B7GG36N12S678425': '3' }])
      done()
    })
  })

  context('when database is empty,', () => {
    it('should return error code 404', (done) => {
      request.get('test-results').expect(404, done)
    })
  })

  beforeEach((done) => {
    setTimeout(done, 500)
  })
  afterEach((done) => {
    setTimeout(done, 500)
  })
})

describe('insertTestResults', () => {
  let mockData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../resources/test-results-post.json')))
  let testResultsService = null
  let testResultsDAO = null
  before((done) => {
    testResultsDAO = new TestResultsDAO()
    testResultsService = new TestResultsService(testResultsDAO)
    done()
  })

  // context('POST /test-results with valid data', () => {
  //   it('responds with HTTP 201', function (done) {
  //     request
  //       .post('test-results')
  //       .send(JSON.stringify(mockData[0]))
  //       .end((err, res) => {
  //         if (err) { expect.fail(err) }
  //         expect(res.statusCode).to.equal(201)
  //         expect(res.headers['access-control-allow-origin']).to.equal('*')
  //         expect(res.headers['access-control-allow-credentials']).to.equal('true')

  //         done()
  //       })
  //   })
  // })

  context('POST /test-results with empty body', () => {
    it('responds with HTTP 400', function (done) {
      request
        .post('test-results')
        .send()
        .end((err, res) => {
          if (err) { expect.fail(err) }

          expect(res.statusCode).to.equal(400)
          expect(res.headers['access-control-allow-origin']).to.equal('*')
          expect(res.headers['access-control-allow-credentials']).to.equal('true')
          expect(_.isEqual('Body is not a valid JSON.', res.body)).to.equal(true)
          done()
        })
    })
  })

  context('POST /test-results with bad JSON', () => {
    it('responds with HTTP 400', function (done) {
      request
        .post('test-results')
        .send('{ this is a bad json }')
        .end((err, res) => {
          if (err) { expect.fail(err) }

          expect(res.statusCode).to.equal(400)
          expect(res.headers['access-control-allow-origin']).to.equal('*')
          expect(res.headers['access-control-allow-credentials']).to.equal('true')
          expect(_.isEqual('Body is not a valid JSON.', res.body)).to.equal(true)
          done()
        })
    })
  })

  after((done) => {
    testResultsDAO.getByVin(mockData[0].vin)
      .then((object) => {
        let scheduledForDeletion = {}
        scheduledForDeletion[object.Items[0].vin] = object.Items[0].testResultId
        testResultsService.deleteTestResultsList([scheduledForDeletion])
      })

    done()
  })

  beforeEach((done) => {
    setTimeout(done, 500)
  })
  afterEach((done) => {
    setTimeout(done, 500)
  })
})
