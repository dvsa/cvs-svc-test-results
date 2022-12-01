import { APIGatewayProxyResult } from 'aws-lambda';

export class HTTPResponse implements APIGatewayProxyResult {
  public body: any;

  public statusCode: number;

  public readonly headers: any;

  /**
   * Constructor for the HTTPResponse class
   * @param statusCode the HTTP status code
   * @param body - the response body
   * @param headers - optional - the response headers
   */
  constructor(statusCode: number, body: any, headers = {}) {
    if (headers) {
      this.headers = headers;
    }
    this.headers['Access-Control-Allow-Origin'] = '*';
    this.headers['Access-Control-Allow-Credentials'] = true;
    this.headers['X-Content-Type-Options'] = 'nosniff';
    this.headers.Vary = 'Origin';
    this.headers['X-XSS-Protection'] = '1; mode=block';
    this.statusCode = statusCode;
    this.body = JSON.stringify(body);

    console.log(`HTTP STATUS CODE RETURNED: ${this.statusCode}`);
  }
}
