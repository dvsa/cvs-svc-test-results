import sinon from 'sinon';
import mockContext from 'aws-lambda-mock-context';
import { handler } from '../../src/handler';
import { HTTPResponse } from '../../src/models/HTTPResponse';
import eventWithStaffId from '../resources/event-getTestResultsByTesterStaffId.json';
import eventWithSystemNumber from '../resources/event-getTestResultsBySystemNumber.json';
import * as getTestResultsByTesterStaffId from '../../src/functions/getTestResultsByTesterStaffId';
import * as getTestResultsBySystemNumber from '../../src/functions/getTestResultsBySystemNumber';

const sandbox = sinon.createSandbox();

describe('The lambda function handler', () => {
  const ctx = mockContext();
  afterAll(() => {
    sandbox.restore();
  });
  context('With correct Config', () => {
    context('should correctly handle incoming events', () => {
      it('should call getTestResultsByTesterStaffId function with correct event payload', async () => {
        // Stub out the actual functions
        const getTestResultsByTesterStaffIdStub = sandbox.stub(
          getTestResultsByTesterStaffId,
        );
        getTestResultsByTesterStaffIdStub.getTestResultsByTesterStaffId.resolves(
          new HTTPResponse(200, {}),
        );

        const result = await handler(eventWithStaffId, ctx, () => {});
        expect(result.statusCode).toBe(200);
        sandbox.assert.called(
          getTestResultsByTesterStaffIdStub.getTestResultsByTesterStaffId,
        );
      });

      it('should call getTestResultsBySystemNumber function with correct event payload', async () => {
        // Stub out the actual functions
        const functionStub = sandbox.stub(getTestResultsBySystemNumber);
        functionStub.getTestResultsBySystemNumber.resolves(
          new HTTPResponse(200, {}),
        );

        const result = await handler(eventWithSystemNumber, ctx, () => {});
        expect(result.statusCode).toBe(200);
        sandbox.assert.called(functionStub.getTestResultsBySystemNumber);
      });

      it('should return error on empty event', async () => {
        const result = await handler(null, ctx, () => {});

        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(
          JSON.stringify('AWS event is empty. Check your test event.'),
        );
      });

      it('should return error on invalid body json', async () => {
        const invalidBodyEvent = Object.assign({}, eventWithStaffId);
        invalidBodyEvent.body = '{"hello":}';

        const result = await handler(invalidBodyEvent, ctx, () => {});
        expect(result).toBeInstanceOf(HTTPResponse);
        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(
          JSON.stringify('Body is not a valid JSON.'),
        );
      });

      it('should return a Route Not Found error on invalid path', async () => {
        const invalidPathEvent = Object.assign({}, eventWithStaffId);
        // invalidPathEvent.body = ""
        invalidPathEvent.path = '/vehicles/123/doesntExist';

        const result = await handler(invalidPathEvent, ctx, () => {});
        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(
          JSON.stringify({
            error: `Route ${invalidPathEvent.httpMethod} ${invalidPathEvent.path} was not found.`,
          }),
        );
      });
    });
  });
});
