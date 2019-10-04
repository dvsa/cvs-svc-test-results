import {GetTestResultsUtils} from "../../src/utils/GetTestResultsUtils";

describe("parseMissingQueryParams", () => {
    context("if queryStringParameters does not contain vehicleSize", () => {
        it("vehicleSize should be returned as null", () => {

            const queryStringParametersWithoutVehicleSize = {
                vehicleAxles: 3,
                vehicleConfiguration: "rigid"
            };

            expect(GetTestResultsUtils.parseMissingQueryParams(queryStringParametersWithoutVehicleSize).vehicleSize).toEqual(null);
        });
    });

    context("if queryStringParameters.vehicleConfiguration is null string", () => {
        it("vehicleConfiguration should be returned as null value", () => {

            const queryStringParametersWithoutVehicleSize = {
                vehicleAxles: 3,
                vehicleSize: "small",
                vehicleConfiguration: "null"
            };

            expect(GetTestResultsUtils.parseMissingQueryParams(queryStringParametersWithoutVehicleSize).vehicleConfiguration).toEqual(null);
        });
    });

    context("if queryStringParameters.vehicleAxles is null string", () => {
        it("vehicleAxles should be returned as null value", () => {

            const queryStringParametersWithoutVehicleSize = {
                vehicleAxles: "null",
                vehicleSize: "small",
                vehicleConfiguration: "rigid"
            };

            expect(GetTestResultsUtils.parseMissingQueryParams(queryStringParametersWithoutVehicleSize).vehicleAxles).toEqual(null);
        });
    });

    context("if queryStringParameters.vehicleAxles is a string representing a number", () => {
        it("vehicleAxles should be parsed", () => {

            const queryStringParametersWithoutVehicleSize = {
                vehicleAxles: "3",
                vehicleSize: "small",
                vehicleConfiguration: "rigid"
            };

            expect(GetTestResultsUtils.parseMissingQueryParams(queryStringParametersWithoutVehicleSize).vehicleAxles).toEqual(3);
        });
    });

    context("if queryStringParameters does not contain vehicleAxles", () => {
        it("vehicleAxles should be returned null", () => {

            const queryStringParametersWithoutVehicleSize = {
                vehicleSize: "small",
                vehicleConfiguration: "rigid"
            };

            expect(GetTestResultsUtils.parseMissingQueryParams(queryStringParametersWithoutVehicleSize).vehicleAxles).toEqual(undefined);
        });
    });
});
