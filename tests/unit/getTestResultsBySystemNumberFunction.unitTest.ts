import moment from 'moment';
import { getTestResultsBySystemNumber } from '../../src/functions/getTestResultsBySystemNumber';
import { TestResultsService } from '../../src/services/TestResultsService';
import { HTTPResponse } from '../../src/models/HTTPResponse';
import { HTTPRESPONSE, MESSAGES } from '../../src/assets/Enums';
import { HTTPError } from '../../src/models/HTTPError';

describe('getTestResultsBySystemNumber Function', () => {
  const minimalEvent = {
    pathParameters: {
      systemNumber: '1',
    },
  };
  context('receiving minimal Event, and successful service call', () => {
    it('invokes testResultsService with default filters, and returns 200 + data', async () => {
      const testResultsMock = jest.fn().mockResolvedValue('Success');
      TestResultsService.prototype.getTestResultBySystemNumber =
        testResultsMock;

      const expectedFilters = {
        systemNumber: '1',
        testStatus: undefined,
        testVersion: 'current',
        toDateTime: new Date(2300, 1, 1),
        fromDateTime: moment().subtract(2, 'years').endOf('day').toDate(),
      };

      expect.assertions(4);
      // @ts-ignore
      const result = await getTestResultsBySystemNumber(minimalEvent);
      expect(testResultsMock).toHaveBeenCalledWith(expectedFilters);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toBe(200);
      expect(result.body).toEqual(JSON.stringify('Success'));
    });
  });
  context('Service call fails', () => {
    it('returns Error', async () => {
      const myError = new HTTPError(418, 'It Broke!');
      TestResultsService.prototype.getTestResultBySystemNumber = jest
        .fn()
        .mockRejectedValue(myError);

      expect.assertions(3);
      // @ts-ignore
      const result = await getTestResultsBySystemNumber(minimalEvent);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toBe(418);
      expect(result.body).toEqual(JSON.stringify('It Broke!'));
    });
  });
  context('receiving event with queryParams', () => {
    context('with empty toDateTime', () => {
      it('returns 400 Bad Request', async () => {
        const myEvent = {
          ...minimalEvent,
          queryStringParameters: {
            toDateTime: '',
          },
        };

        // @ts-ignore
        const result = await getTestResultsBySystemNumber(myEvent);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(JSON.stringify(MESSAGES.BAD_REQUEST));
      });
    });
    context('with empty fromDateTime', () => {
      it('returns 400 Bad Request', async () => {
        const myEvent = {
          ...minimalEvent,
          queryStringParameters: {
            fromDateTime: '',
          },
        };

        // @ts-ignore
        const result = await getTestResultsBySystemNumber(myEvent);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(JSON.stringify(MESSAGES.BAD_REQUEST));
      });
    });
    context('with non-empty toDateTime', () => {
      it('invokes testResultsService with custom filters', async () => {
        const testResultsMock = jest.fn().mockResolvedValue('Success');
        TestResultsService.prototype.getTestResultBySystemNumber =
          testResultsMock;

        const myEvent = {
          ...minimalEvent,
          queryStringParameters: {
            toDateTime: '01-01-2010',
          },
        };

        const expectedFilters = {
          systemNumber: '1',
          testVersion: 'current',
          toDateTime: new Date('01-01-2010'),
          fromDateTime: moment().subtract(2, 'years').endOf('day').toDate(),
        };

        expect.assertions(4);
        // @ts-ignore
        const result = await getTestResultsBySystemNumber(myEvent);
        expect(testResultsMock).toHaveBeenCalledWith(expectedFilters);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual(JSON.stringify('Success'));
      });
    });
    context('with non-empty fromDateTime', () => {
      it('invokes testResultsService with custom filters', async () => {
        const testResultsMock = jest.fn().mockResolvedValue('Success');
        TestResultsService.prototype.getTestResultBySystemNumber =
          testResultsMock;

        const myEvent = {
          ...minimalEvent,
          queryStringParameters: {
            fromDateTime: '01-01-2010',
          },
        };

        const expectedFilters = {
          systemNumber: '1',
          testResultId: undefined,
          testStationPNumber: undefined,
          testStatus: undefined,
          testVersion: 'current',
          toDateTime: moment(new Date(2300, 1, 1)).toDate(),
          fromDateTime: new Date('01-01-2010'),
        };

        expect.assertions(4);
        // @ts-ignore
        const result = await getTestResultsBySystemNumber(myEvent);
        expect(testResultsMock).toHaveBeenCalledWith(expectedFilters);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual(JSON.stringify('Success'));
      });
    });
    context('with non-empty status', () => {
      it('invokes testResultsService with custom filters', async () => {
        const testResultsMock = jest.fn().mockResolvedValue('Success');
        TestResultsService.prototype.getTestResultBySystemNumber =
          testResultsMock;

        const myEvent = {
          ...minimalEvent,
          queryStringParameters: {
            status: 'cheese',
          },
        };

        const expectedFilters = {
          systemNumber: '1',
          testVersion: 'current',
          testStatus: 'cheese',
          testResultId: undefined,
          testStationPNumber: undefined,
          toDateTime: moment(new Date(2300, 1, 1)).toDate(),
          fromDateTime: moment().subtract(2, 'years').endOf('day').toDate(),
        };

        expect.assertions(4);
        // @ts-ignore
        const result = await getTestResultsBySystemNumber(myEvent);
        expect(testResultsMock).toHaveBeenCalledWith(expectedFilters);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual(JSON.stringify('Success'));
      });
    });

    context('with non-empty test version', () => {
      it('invokes testResultsService with custom filters', async () => {
        const testResultsMock = jest.fn().mockResolvedValue('Success');
        TestResultsService.prototype.getTestResultBySystemNumber =
          testResultsMock;

        const myEvent = {
          ...minimalEvent,
          queryStringParameters: {
            version: 'archived',
          },
        };

        const expectedFilters = {
          systemNumber: '1',
          testVersion: 'archived',
          toDateTime: moment(new Date(2300, 1, 1)).toDate(),
          fromDateTime: moment().subtract(2, 'years').endOf('day').toDate(),
        };

        expect.assertions(4);
        // @ts-ignore
        const result = await getTestResultsBySystemNumber(myEvent);
        expect(testResultsMock).toHaveBeenCalledWith(expectedFilters);
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual(JSON.stringify('Success'));
      });
    });
  });

  context('receiving event with', () => {
    it('undefined system number, should return bad request', async () => {
      const testResultsMock = jest.fn().mockResolvedValue('Success');
      TestResultsService.prototype.getTestResultBySystemNumber =
        testResultsMock;

      const myEvent = {
        pathParameters: {
          systemNumber: undefined,
        },
      };

      expect.assertions(3);
      // @ts-ignore
      const result = await getTestResultsBySystemNumber(myEvent);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(
        JSON.stringify(HTTPRESPONSE.MISSING_PARAMETERS),
      );
    });

    it('null system number, should return bad request', async () => {
      const testResultsMock = jest.fn().mockResolvedValue('Success');
      TestResultsService.prototype.getTestResultBySystemNumber =
        testResultsMock;

      const myEvent = {
        pathParameters: {
          systemNumber: null,
        },
      };

      expect.assertions(3);
      // @ts-ignore
      const result = await getTestResultsBySystemNumber(myEvent);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(
        JSON.stringify(HTTPRESPONSE.MISSING_PARAMETERS),
      );
    });

    it('empty string system number, should return bad request', async () => {
      const testResultsMock = jest.fn().mockResolvedValue('Success');
      TestResultsService.prototype.getTestResultBySystemNumber =
        testResultsMock;

      const myEvent = {
        pathParameters: {
          systemNumber: ' ',
        },
      };

      expect.assertions(3);
      // @ts-ignore
      const result = await getTestResultsBySystemNumber(myEvent);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(
        JSON.stringify(HTTPRESPONSE.MISSING_PARAMETERS),
      );
    });
    it('null path parameter, should return bad request', async () => {
      const testResultsMock = jest.fn().mockResolvedValue('Success');
      TestResultsService.prototype.getTestResultBySystemNumber =
        testResultsMock;

      const myEvent = {
        pathParameters: null,
      };

      expect.assertions(3);
      // @ts-ignore
      const result = await getTestResultsBySystemNumber(myEvent);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toBe(400);
      expect(result.body).toEqual(
        JSON.stringify(HTTPRESPONSE.MISSING_PARAMETERS),
      );
    });
  });
});
