import {cloneDeep} from "lodash";
import { VehicleTestController } from "../../src/handlers/VehicleTestController";
import * as testResultsPostMock from "../resources/test-results-post.json";
import { ITestResultPayload } from "../../src/models";

describe("VehicleTestController calling AssignCertificateNumberToTestTypes", () => {

    context("when inserting a testResult that is a vehicleType of hgv or trl and it contains at least one Roadworthiness test type and the test result on the Roadworthiness test type is pass", () => {
        it("then a testNumber is generated and the inserted test result should set the testNumber as the certificateNumber.", () => {
            const testPassedResultWithRoadworthinessTestType = cloneDeep(testResultsPostMock[6] as ITestResultPayload);
            testPassedResultWithRoadworthinessTestType.testTypes[0].testTypeId = "122";
            testPassedResultWithRoadworthinessTestType.testTypes[0].testNumber = "W01A00209";
            testPassedResultWithRoadworthinessTestType.testTypes[0].testResult = "pass";

            expect.assertions(2);
            // @ts-ignore
            const updatedResult =  VehicleTestController.AssignCertificateNumberToTestTypes(testPassedResultWithRoadworthinessTestType);
            expect(updatedResult.testTypes[0].testTypeId).toEqual("122");
            expect(updatedResult.testTypes[0].certificateNumber).toEqual("W01A00209");
        });
    });

    context("when inserting a testResult that is a vehicleType of trl and it contains at least one Roadworthiness test type and the test result on the Roadworthiness test type is pass", () => {
        it("then a testNumber is generated and the inserted test result should set the testNumber as the certificateNumber.", () => {
            const testPassedResultWithRoadworthinessTestType = cloneDeep(testResultsPostMock[6] as ITestResultPayload);
            testPassedResultWithRoadworthinessTestType.testTypes[0].testTypeId = "91";
            testPassedResultWithRoadworthinessTestType.testTypes[0].testNumber = "W01A00209";
            testPassedResultWithRoadworthinessTestType.testTypes[0].testResult = "pass";

            expect.assertions(2);
            // @ts-ignore
            const updatedResult =  VehicleTestController.AssignCertificateNumberToTestTypes(testPassedResultWithRoadworthinessTestType);
            expect(updatedResult.testTypes[0].testTypeId).toEqual("91");
            expect(updatedResult.testTypes[0].certificateNumber).toEqual("W01A00209");
        });
    });

});
