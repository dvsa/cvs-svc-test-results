import { HTTPError } from '../models/HTTPError';
/**
 * Validates the invocation response
 * @param response - the invocation response
 */
export const validateInvocationResponse = (response: any) => {
  if (
    (!response.Payload || response.Payload === '') &&
    response.StatusCode &&
    response.StatusCode < 400
  ) {
    throw new HTTPError(
      response.StatusCode,
      `Lambda invocation returned error: ${response.StatusCode} with empty payload.`,
    );
  }

  let payload: any;

  try {
    const string = Buffer.from(response.Payload).toString();
    console.log(string);
    console.log(typeof string);
    payload = JSON.parse(string);
  } catch (error) {
    console.log('validateInvocationResponse response parse error', response);
    throw new HTTPError(
      500,
      `Lambda invocation returned bad data: ${response.Payload}`,
    );
  }

  if (payload.statusCode >= 400) {
    console.log(
      'validateInvocationResponse response statusCode >= 400',
      response,
    );
    throw new HTTPError(
      payload.statusCode,
      `Lambda invocation returned error: ${payload.statusCode} ${payload.body}`,
    );
  }

  return payload;
};
