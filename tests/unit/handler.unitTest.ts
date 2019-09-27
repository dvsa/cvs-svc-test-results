import sinon from "sinon";
import {expect} from "chai";
import {handler} from "../../src/handler";
import {Configuration} from "../../src/utils/Configuration";
import {HTTPResponse} from "../../src/models/HTTPResponse";
import mockContext from "aws-lambda-mock-context";
import eventWithStaffId from "../resources/event-getTestResultsByTesterStaffId.json";
import eventWithVin from "../resources/event-getTestResultsByVin.json";
import * as getTestResultsByTesterStaffId from "../../src/functions/getTestResultsByTesterStaffId";
import * as getTestResultsByVin from "../../src/functions/getTestResultsByVin";
const sandbox = sinon.createSandbox();

describe("The lambda function handler", () => {
    const ctx = mockContext();
    afterAll(() => {
        sandbox.restore();
    });
    context("With correct Config", () => {
        context("should correctly handle incoming events", () => {
            it("should call getTestResultsByTesterStaffId function with correct event payload", async () => {
                // Stub out the actual functions
                const getTestResultsByTesterStaffIdStub = sandbox.stub(getTestResultsByTesterStaffId);
                getTestResultsByTesterStaffIdStub.getTestResultsByTesterStaffId.resolves(new HTTPResponse(200, {}));

                const result = await handler(eventWithStaffId, ctx, () => {
                    return;
                });
                expect(result.statusCode).to.equal(200);
                sandbox.assert.called(getTestResultsByTesterStaffIdStub.getTestResultsByTesterStaffId);
            });

            it("should call getTestResultsByVin function with correct event payload", async () => {
                // Stub out the actual functions
                const functionStub = sandbox.stub(getTestResultsByVin);
                functionStub.getTestResultsByVin.resolves(new HTTPResponse(200, {}));

                const result = await handler(eventWithVin, ctx, () => {
                    return;
                });
                expect(result.statusCode).to.equal(200);
                sandbox.assert.called(functionStub.getTestResultsByVin);
            });

            it("should return error on empty event", async () => {
                const result = await handler(null, ctx, () => {
                    return;
                });

                expect(result).to.be.instanceOf(HTTPResponse);
                expect(result.statusCode).to.equal(400);
                expect(result.body).to.equal(JSON.stringify("AWS event is empty. Check your test event."));
            });

            it("should return error on invalid body json", async () => {
                const invalidBodyEvent = Object.assign({}, eventWithStaffId);
                invalidBodyEvent.body = '{"hello":}';

                const result = await handler(invalidBodyEvent, ctx, () => {
                    return;
                });
                expect(result).to.be.instanceOf(HTTPResponse);
                expect(result.statusCode).to.equal(400);
                expect(result.body).to.equal(JSON.stringify("Body is not a valid JSON."));
            });

            it("should return a Route Not Found error on invalid path", async () => {
                const invalidPathEvent = Object.assign({}, eventWithStaffId);
                // invalidPathEvent.body = ""
                invalidPathEvent.path = "/vehicles/123/doesntExist";

                const result = await handler(invalidPathEvent, ctx, () => {
                    return;
                });
                expect(result.statusCode).to.equal(400);
                expect(result.body).to.deep.equals(JSON.stringify({error: `Route ${invalidPathEvent.httpMethod} ${invalidPathEvent.path} was not found.`}));
            });
        });
    });
});
