import { VehicleTestController } from "../../src/handlers/VehicleTestController";

describe("VehicleTestController calling calculateAnniversaryDate", () => {
  context("if testResult is trl", () => {
    const hgvTestResultWithExpiryDate = JSON.parse(
      " {\n" +
        '    "testerStaffId": "1",\n' +
        '    "testResultId": "1115",\n' +
        '    "testStartTimestamp": "2019-01-14T10:36:33.987Z",\n' +
        '    "testEndTimestamp": "2019-01-14T10:36:33.987Z",\n' +
        '    "testStatus": "submitted",\n' +
        '    "noOfAxles": "2",\n' +
        '    "testTypes": [\n' +
        "      {\n" +
        '        "prohibitionIssued": false,\n' +
        '        "additionalCommentsForAbandon": "none",\n' +
        '        "testTypeEndTimestamp": "2019-01-14T10:36:33.987Z",\n' +
        '        "reasonForAbandoning": "none",\n' +
        '        "testTypeId": "1",\n' +
        '        "testExpiryDate": "2020-09-20T10:36:33.987Z",\n' +
        '        "testTypeStartTimestamp": "2019-01-14T10:36:33.987Z",\n' +
        '        "certificateNumber": "W01A00209",\n' +
        '        "testTypeName": "Annual test",\n' +
        '        "additionalNotesRecorded": "VEHICLE FRONT REGISTRATION PLATE MISSING",\n' +
        '        "defects": [\n' +
        "          {\n" +
        '            "prohibitionIssued": false,\n' +
        '            "deficiencyCategory": "major",\n' +
        '            "deficiencyText": "missing.",\n' +
        '            "prs": false,\n' +
        '            "additionalInformation": {\n' +
        '              "location": {\n' +
        '                "axleNumber": null,\n' +
        '                "horizontal": null,\n' +
        '                "vertical": null,\n' +
        '                "longitudinal": "front",\n' +
        '                "rowNumber": null,\n' +
        '                "lateral": null,\n' +
        '                "seatNumber": null\n' +
        "              },\n" +
        '              "notes": "None"\n' +
        "            },\n" +
        '            "itemNumber": 1,\n' +
        '            "deficiencyRef": "1.1.a",\n' +
        '            "stdForProhibition": false,\n' +
        '            "deficiencySubId": null,\n' +
        '            "imDescription": "Registration Plate",\n' +
        '            "deficiencyId": "a",\n' +
        '            "itemDescription": "A registration plate:",\n' +
        '            "imNumber": 1\n' +
        "          }\n" +
        "        ],\n" +
        '        "name": "Annual test",\n' +
        '        "testResult": "pass"\n' +
        "      }\n" +
        "    ],\n" +
        '    "vehicleClass": {\n' +
        '      "description": "motorbikes over 200cc or with a sidecar",\n' +
        '      "code": "2"\n' +
        "    },\n" +
        '    "vin": "XMGDE02FS0H012999",\n' +
        '    "testStationName": "Rowe, Wunsch and Wisoky",\n' +
        '    "noOfAxles": 2,\n' +
        '    "vehicleType": "trl",\n' +
        '    "countryOfRegistration": "united kingdom",\n' +
        '    "preparerId": "ak4434",\n' +
        '    "preparerName": "Durrell Vehicles Limited",\n' +
        '    "vehicleConfiguration": "rigid",\n' +
        '    "testStationType": "gvts",\n' +
        '    "reasonForCancellation": "none",\n' +
        '    "testerName": "Dorel",\n' +
        '    "testStationPNumber": "87-1369569",\n' +
        '    "testerEmailAddress": "dorel.popescu@dvsagov.uk",\n' +
        '    "euVehicleCategory": "m1",\n' +
        '    "trailerId": "abcd"\n' +
        "  }"
    );

    it("should set anniversary date the same as expiryDate", () => {
      // @ts-ignore
      const testResultWithAnniversaryDate = VehicleTestController.calculateAnniversaryDate(
        hgvTestResultWithExpiryDate
      );
      expect(
        testResultWithAnniversaryDate.testTypes[0].testAnniversaryDate
      ).not.toEqual(undefined);
      expect(
        testResultWithAnniversaryDate.testTypes[0].testAnniversaryDate
      ).toEqual(testResultWithAnniversaryDate.testTypes[0].testExpiryDate);
    });
  });

  context("if testResult is hgv", () => {
    const hgvTestResultWithExpiryDate = JSON.parse(
      " {\n" +
        '    "testerStaffId": "1",\n' +
        '    "testResultId": "1115",\n' +
        '    "testStartTimestamp": "2019-01-14T10:36:33.987Z",\n' +
        '    "testEndTimestamp": "2019-01-14T10:36:33.987Z",\n' +
        '    "testStatus": "submitted",\n' +
        '    "noOfAxles": "2",\n' +
        '    "testTypes": [\n' +
        "      {\n" +
        '        "prohibitionIssued": false,\n' +
        '        "additionalCommentsForAbandon": "none",\n' +
        '        "testTypeEndTimestamp": "2019-01-14T10:36:33.987Z",\n' +
        '        "reasonForAbandoning": "none",\n' +
        '        "testTypeId": "1",\n' +
        '        "testExpiryDate": "2020-09-20T10:36:33.987Z",\n' +
        '        "testTypeStartTimestamp": "2019-01-14T10:36:33.987Z",\n' +
        '        "certificateNumber": "W01A00209",\n' +
        '        "testTypeName": "Annual test",\n' +
        '        "additionalNotesRecorded": "VEHICLE FRONT REGISTRATION PLATE MISSING",\n' +
        '        "defects": [\n' +
        "          {\n" +
        '            "prohibitionIssued": false,\n' +
        '            "deficiencyCategory": "major",\n' +
        '            "deficiencyText": "missing.",\n' +
        '            "prs": false,\n' +
        '            "additionalInformation": {\n' +
        '              "location": {\n' +
        '                "axleNumber": null,\n' +
        '                "horizontal": null,\n' +
        '                "vertical": null,\n' +
        '                "longitudinal": "front",\n' +
        '                "rowNumber": null,\n' +
        '                "lateral": null,\n' +
        '                "seatNumber": null\n' +
        "              },\n" +
        '              "notes": "None"\n' +
        "            },\n" +
        '            "itemNumber": 1,\n' +
        '            "deficiencyRef": "1.1.a",\n' +
        '            "stdForProhibition": false,\n' +
        '            "deficiencySubId": null,\n' +
        '            "imDescription": "Registration Plate",\n' +
        '            "deficiencyId": "a",\n' +
        '            "itemDescription": "A registration plate:",\n' +
        '            "imNumber": 1\n' +
        "          }\n" +
        "        ],\n" +
        '        "name": "Annual test",\n' +
        '        "testResult": "pass"\n' +
        "      }\n" +
        "    ],\n" +
        '    "vehicleClass": {\n' +
        '      "description": "motorbikes over 200cc or with a sidecar",\n' +
        '      "code": "2"\n' +
        "    },\n" +
        '    "vin": "XMGDE02FS0H012999",\n' +
        '    "testStationName": "Rowe, Wunsch and Wisoky",\n' +
        '    "noOfAxles": 2,\n' +
        '    "vehicleType": "hgv",\n' +
        '    "countryOfRegistration": "united kingdom",\n' +
        '    "preparerId": "ak4434",\n' +
        '    "preparerName": "Durrell Vehicles Limited",\n' +
        '    "vehicleConfiguration": "rigid",\n' +
        '    "testStationType": "gvts",\n' +
        '    "reasonForCancellation": "none",\n' +
        '    "testerName": "Dorel",\n' +
        '    "testStationPNumber": "87-1369569",\n' +
        '    "testerEmailAddress": "dorel.popescu@dvsagov.uk",\n' +
        '    "euVehicleCategory": "m1",\n' +
        '    "trailerId": "abcd"\n' +
        "  }"
    );

    it("should set anniversary date the same as expiryDate", () => {
      // @ts-ignore
      const testResultWithAnniversaryDate = VehicleTestController.calculateAnniversaryDate(
        hgvTestResultWithExpiryDate
      );
      expect(
        testResultWithAnniversaryDate.testTypes[0].testAnniversaryDate
      ).not.toEqual(undefined);
      expect(
        testResultWithAnniversaryDate.testTypes[0].testAnniversaryDate
      ).toEqual(testResultWithAnniversaryDate.testTypes[0].testExpiryDate);
    });
  });

  context("if testResult is psv", () => {
    const psvTestResultWithExpiryDate = JSON.parse(
      " {\n" +
        '    "testerStaffId": "1",\n' +
        '    "testResultId": "1115",\n' +
        '    "testStartTimestamp": "2019-01-14T10:36:33.987Z",\n' +
        '    "testEndTimestamp": "2019-01-14T10:36:33.987Z",\n' +
        '    "testStatus": "submitted",\n' +
        '    "noOfAxles": "2",\n' +
        '    "testTypes": [\n' +
        "      {\n" +
        '        "prohibitionIssued": false,\n' +
        '        "additionalCommentsForAbandon": "none",\n' +
        '        "testTypeEndTimestamp": "2019-01-14T10:36:33.987Z",\n' +
        '        "reasonForAbandoning": "none",\n' +
        '        "testTypeId": "1",\n' +
        '        "testExpiryDate": "2020-09-20T10:36:33.987Z",\n' +
        '        "testTypeStartTimestamp": "2019-01-14T10:36:33.987Z",\n' +
        '        "certificateNumber": "W01A00209",\n' +
        '        "testTypeName": "Annual test",\n' +
        '        "additionalNotesRecorded": "VEHICLE FRONT REGISTRATION PLATE MISSING",\n' +
        '        "defects": [\n' +
        "          {\n" +
        '            "prohibitionIssued": false,\n' +
        '            "deficiencyCategory": "major",\n' +
        '            "deficiencyText": "missing.",\n' +
        '            "prs": false,\n' +
        '            "additionalInformation": {\n' +
        '              "location": {\n' +
        '                "axleNumber": null,\n' +
        '                "horizontal": null,\n' +
        '                "vertical": null,\n' +
        '                "longitudinal": "front",\n' +
        '                "rowNumber": null,\n' +
        '                "lateral": null,\n' +
        '                "seatNumber": null\n' +
        "              },\n" +
        '              "notes": "None"\n' +
        "            },\n" +
        '            "itemNumber": 1,\n' +
        '            "deficiencyRef": "1.1.a",\n' +
        '            "stdForProhibition": false,\n' +
        '            "deficiencySubId": null,\n' +
        '            "imDescription": "Registration Plate",\n' +
        '            "deficiencyId": "a",\n' +
        '            "itemDescription": "A registration plate:",\n' +
        '            "imNumber": 1\n' +
        "          }\n" +
        "        ],\n" +
        '        "name": "Annual test",\n' +
        '        "testResult": "pass"\n' +
        "      }\n" +
        "    ],\n" +
        '    "vehicleClass": {\n' +
        '      "description": "motorbikes over 200cc or with a sidecar",\n' +
        '      "code": "2"\n' +
        "    },\n" +
        '    "vin": "XMGDE02FS0H012999",\n' +
        '    "testStationName": "Rowe, Wunsch and Wisoky",\n' +
        '    "noOfAxles": 2,\n' +
        '    "vehicleType": "psv",\n' +
        '    "countryOfRegistration": "united kingdom",\n' +
        '    "preparerId": "ak4434",\n' +
        '    "preparerName": "Durrell Vehicles Limited",\n' +
        '    "vehicleConfiguration": "rigid",\n' +
        '    "testStationType": "gvts",\n' +
        '    "reasonForCancellation": "none",\n' +
        '    "testerName": "Dorel",\n' +
        '    "testStationPNumber": "87-1369569",\n' +
        '    "testerEmailAddress": "dorel.popescu@dvsagov.uk",\n' +
        '    "euVehicleCategory": "m1",\n' +
        '    "trailerId": "abcd"\n' +
        "  }"
    );

    it("should set anniversary date two months before expiryDate", () => {
      // @ts-ignore
      const testResultWithAnniversaryDate = VehicleTestController.calculateAnniversaryDate(
        psvTestResultWithExpiryDate
      );
      expect(
        testResultWithAnniversaryDate.testTypes[0].testAnniversaryDate
      ).not.toEqual(undefined);
      expect(
        testResultWithAnniversaryDate.testTypes[0].testAnniversaryDate
      ).toEqual("2020-07-21T10:36:33.987Z");
    });
  });
});
