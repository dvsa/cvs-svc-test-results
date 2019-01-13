/* global describe context it before beforeEach after afterEach */
const supertest = require('supertest')
const expect = require('chai').expect
const url = 'http://localhost:3006/'
const request = supertest(url)
const TestResultsService = require('../../src/services/TestResultsService')
const TestResultsDAO = require('../../src/models/TestResultsDAO')
var _ = require('lodash/core')

describe('testResults', () => {
  describe('getTestResultsByVin', () => {
    context('when database is populated', () => {
      var testResultsService = null
      var testResultsDAO = null
      const databaseSeed = require('../resources/test-results.json')

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
              it('should return the test results for that VIN with default status \'submitted\' and default date interval which is from to years ago until today', (done) => {
                request.get('test-results/1B7GG36N12S678410/')
                  .end((err, res) => {
                    const expectedResponse = Array.of(databaseSeed[0])
                    delete expectedResponse[0].testResultId
                    if (err) { expect.fail(err) }
                    expect(res.statusCode).to.equal(200)
                    expect(res.headers['access-control-allow-origin']).to.equal('*')
                    expect(res.headers['access-control-allow-credentials']).to.equal('true')
                    expect(_.isEqual(expectedResponse, res.body)).to.equal(true)
                    done()
                  })
              })
            })
          })
        })
        context('and status is provided', () => {
          context('and toDateTime and fromDateTime are provided', () => {
            context('and there are test results in the db that satisfy both conditions', () => {
              it('should return the test results for that VIN with status \'submitted\' and that have createdAt value between 2017-01-01 and 2019-01-15', (done) => {
                request.get('test-results/1B7GG36N12S678410?status=submitted&fromDateTime=2017-01-01&toDateTime=2019-01-15')
                  .end((err, res) => {
                    const expectedResponse = Array.of(databaseSeed[0])
                    if (err) { expect.fail(err) }
                    expect(res.statusCode).to.equal(200)
                    expect(res.headers['access-control-allow-origin']).to.equal('*')
                    expect(res.headers['access-control-allow-credentials']).to.equal('true')
                    expect(_.isEqual(expectedResponse, res.body)).to.equal(true)
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

        context('and toDateTime and fromDateTime are provided', () => {
          context('and there are no test results for that VIN that have createdAt date between 2015-01-01 and 2017-01-01 ', () => {
            it('should return 404', (done) => {
              request.get('test-results/1B7GG36N12S678410?fromDateTime=2015-01-01&toDateTime=2017-01-01')
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
      })

      after((done) => {
        testResultsService.deleteTestResultsList([{'1B7GG36N12S678410': '1'},{'1B7GG36N12S678410': '2'},{'1B7GG36N12S678425': '3'}])
        done()
      })
    })

    context('when database is empty,', () => {
      it('should return error code 404', (done) => {
        request.get('test-results').expect(404, done)
      })
    })
  })

  beforeEach((done) => {
    setTimeout(done, 500)
  })
  afterEach((done) => {
    setTimeout(done, 500)
  })
})
