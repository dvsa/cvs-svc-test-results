'use strict'

class HTTPResponse {
  /**
       * Constructor for the HTTPResponse class
       * @param statusCode the HTTP status code
       * @param body - the response body
       * @param headers - optional - the response headers
       */
  constructor (statusCode, body, headers = {}) {
    if (headers) this.headers = headers
    this.headers['Access-Control-Allow-Origin'] = '*'
    this.headers['Access-Control-Allow-Credentials'] = true
    this.headers['X-Content-Type-Options'] = 'nosniff'
    this.headers['Vary'] = 'Origin'
    this.headers['X-XSS-Protection'] = '1; mode=block'
    this.statusCode = statusCode
    this.body = JSON.stringify(body)
  }
}

module.exports = HTTPResponse
