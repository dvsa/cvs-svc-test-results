import { TestResultsService } from "../../src/services/TestResultsService";
import fs from "fs";
import path from "path";
import { HTTPError } from "../../src/models/HTTPError";
import {MESSAGES, ERRORS, VEHICLE_TYPES, TEST_STATUS, TEST_RESULT} from "../../src/assets/Enums";
import { ITestResultPayload } from "../../src/models/ITestResultPayload";
import { HTTPResponse } from "../../src/models/HTTPResponse";
import {cloneDeep} from "lodash";
import { ITestResult } from "../../src/models/ITestResult";

describe("insertTestResult", () => {
    let testResultsService: TestResultsService | any;
    let MockTestResultsDAO: jest.Mock;
    let testResultsMockDB: any;
    let testResultsPostMock: any;

    beforeEach(() => {
        testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
        testResultsPostMock = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results-post.json"), "utf8"));
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {};
        });
        testResultsService = new TestResultsService(new MockTestResultsDAO());
    });

    afterEach(() => {
        testResultsMockDB = null;
        testResultsService = null;
        MockTestResultsDAO.mockReset();
    });

    context("when inserting an empty test result", () => {
        it("should throw a validation error", () => {
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            const mockData: ITestResultPayload | any = {};

            expect.assertions(3);
            return testResultsService.insertTestResult(mockData)
                .catch((error: { statusCode: any; body: { errors: any[]; }; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                    expect(error.body).toEqual(ERRORS.PayloadCannotBeEmpty);
                });
        });
    });

    context("when inserting a submitted testResult without certificateNumber on lec", () => {
        it("should return 400-Bad request", () => {
            const mockData = testResultsMockDB[2];
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    insertTestResult: () => {
                        return Promise.resolve({
                            Items: Array.of(mockData),
                            Count: 1
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());
            for (const testType of mockData.testTypes) {
                delete testType.testCode;
                delete testType.testNumber;
                delete testType.lastUpdatedAt;
                delete testType.testAnniversaryDate;
                delete testType.createdAt;
                delete testType.testExpiryDate;
                delete testType.certificateLink;
            }
            delete mockData.vehicleId;
            expect.assertions(1);
            return testResultsService.insertTestResult(mockData)
                .catch((error: any) => {
                    expect(error).not.toEqual(undefined);
                });
        });
    });

    context("when inserting a submitted testResult with fields null for advisory deficiency category", () => {
        it("should return a 400 error", () => {
            const mockData = testResultsMockDB[4];
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    insertTestResult: () => {
                        return Promise.resolve({
                            Items: Array.of(mockData),
                            Count: 1
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            for (const testType of mockData.testTypes) {
                delete testType.testCode;
                delete testType.testNumber;
                delete testType.lastUpdatedAt;
                delete testType.testAnniversaryDate;
                delete testType.createdAt;
                delete testType.testExpiryDate;
                delete testType.certificateLink;
            }
            delete mockData.vehicleId;

            expect.assertions(2);
            return testResultsService.insertTestResult(mockData)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error.statusCode).toEqual(400);
                    expect(error.body).toEqual(ERRORS.NoDeficiencyCategory);
                });
        });
    });

    context("when database is down", () => {
        it("should throw an internal server error", () => {
            const mockData = testResultsMockDB[0];
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createMultiple: () => {
                        return Promise.reject({});
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    }
                };
            });

            mockData.testTypes.forEach((t: any) => { t.certificateNumber = "abc"; });
            for (const testType of mockData.testTypes) {
                testType.certificateNumber = "1234";
                delete testType.testCode;
                delete testType.testNumber;
                delete testType.lastUpdatedAt;
                delete testType.testAnniversaryDate;
                delete testType.createdAt;
                delete testType.certificateLink;
                delete testType.testTypeClassification;
            }
            delete mockData.vehicleId;
            mockData.testResultId = "1";
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            expect.assertions(3);
            return testResultsService.insertTestResult(mockData)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(500);
                    expect(error.body).toEqual(MESSAGES.INTERNAL_SERVER_ERROR);
                });
        });
    });

    context("when inserting duplicate test result", () => {
        it("should return 201 - Test Result id already exists", () => {
            const mockData = testResultsMockDB[0];
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    },
                    createSingle: () => {
                        return Promise.reject(
                            {
                                statusCode: 400,
                                message: MESSAGES.CONDITIONAL_REQUEST_FAILED
                            });
                    }
                };
            });
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            for (const testType of mockData.testTypes) {
                testType.certificateNumber = "1234";
                delete testType.testCode;
                delete testType.testNumber;
                delete testType.lastUpdatedAt;
                delete testType.testAnniversaryDate;
                delete testType.createdAt;
                delete testType.certificateLink;
                delete testType.testTypeClassification;
              }
            delete mockData.vehicleId;
            mockData.testResultId = "1111";

            expect.assertions(3);
            return testResultsService.insertTestResult(mockData)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPResponse);
                    expect(error.statusCode).toEqual(201);
                    expect(error.body).toEqual("\"" + MESSAGES.ID_ALREADY_EXISTS + "\"");
                });
        });
    });

    context("when inserting a cancelled testResult", () => {
        it("should throw error 404 when reasonForAbandoning not present on all abandoned tests", () => {

            const mockData = testResultsMockDB[5];
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createMultiple: () => {
                        return Promise.reject({});
                    },
                    getTestNumber: () => {
                        return Promise.resolve(mockData.testNumber);
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    },
                    createSingle: () => {
                        return Promise.reject(
                            {
                                statusCode: 400,
                                message: MESSAGES.CONDITIONAL_REQUEST_FAILED
                            });
                    }
                };
            });
            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(mockData)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error.statusCode).toEqual(400);
                    expect(error.body).toEqual(MESSAGES.REASON_FOR_ABANDONING_NOT_PRESENT);
                });
        });
    });

    context("when inserting a testResult with prohibitionIssued valid and null", () => {
        it("should not throw error", () => {
            const mockData = testResultsPostMock[0];
            mockData.testTypes[0].defects[0].prohibitionIssued = null;
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    },
                    createSingle: () => {
                        return Promise.resolve("It worked");
                    }
                };
            });
            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(1);
            return testResultsService.insertTestResult(mockData)
                .then((data: any) => {
                    expect(data).not.toEqual(undefined);
                });
        });
    });

    context("when inserting a testResult with prohibitionIssued not present on defects", () => {
        it("should throw validation error", () => {
            const mockData = testResultsPostMock[0];
            mockData.testNumber = { testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" };
            delete mockData.testTypes[0].defects[0].prohibitionIssued;
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[0]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve(mockData.testNumber);
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });
            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(mockData)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error.statusCode).toEqual(400);
                    expect(error.body).toEqual({ errors: ["\"prohibitionIssued\" is required"] });
                });
        });
    });

    context("when inserting a cancelled HGV that has null values on the fields that are allowing them to be null", () => {
        it("should not throw error", () => {
            const testResult = testResultsPostMock[4];
            testResult.testStatus = "cancelled";
            testResult.odometerReading = null;
            testResult.odometerReadingUnits = null;
            testResult.countryOfRegistration = null;
            testResult.euVehicleCategory = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(1);
            return testResultsService.insertTestResult(testResult)
                .then((data: any) => {
                    expect(data).not.toEqual(undefined);
                });
        });
    });

    context("when inserting an HGV test result with fields applicable to this vehicleType", () => {
        it("should not throw error", () => {
            const testResult = testResultsPostMock[4];

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(1);
            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult).not.toEqual(undefined);
                });
        });
    });

    context("when inserting an HGV with fields corresponding to a PSV", () => {
        it("should throw 400", () => {
            const testResult = testResultsPostMock[2];
            testResult.vehicleType = "hgv";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });

    context("when inserting an TRL test result with fields applicable to this vehicleType", () => {
        it("should not throw error", () => {
            const testResult = {...testResultsPostMock[5]};

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(1);
            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult).not.toEqual(undefined);
                });
        });
    });

    context("when inserting a TRL with fields corresponding to a PSV", () => {
        it("should throw 400", () => {
            const testResult = testResultsPostMock[2];
            testResult.vehicleType = "trl";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });

    context("when inserting a submitted HGV that has null values on the fields that should be allowed null only when cancelled", () => {
        it("should throw 400", () => {
            const testResult = testResultsPostMock[4];
            testResult.odometerReading = null;
            testResult.odometerReadingUnits = null;
            testResult.countryOfRegistration = null;
            testResult.euVehicleCategory = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });

    context("when inserting a cancelled TRL that has null values on the fields that are allowing them to be null", () => {
        it("should not throw error", () => {
            const testResult = {...testResultsPostMock[5]};
            testResult.testStatus = "cancelled";
            testResult.countryOfRegistration = null;
            testResult.euVehicleCategory = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(1);
            return testResultsService.insertTestResult(testResult)
                .then((data: any) => {
                    expect(data).not.toEqual(undefined);
                });
        });
    });

    context("when inserting a submitted TRL that has null values on the fields that should be allowed null only when cancelled", () => {
        it("should throw 400", () => {
            const testResult = {...testResultsPostMock[5]};
            testResult.odometerReading = null;
            testResult.odometerReadingUnits = null;
            testResult.countryOfRegistration = null;
            testResult.euVehicleCategory = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });

    context("when inserting a submitted HGV that has null values on the fields that should be allowed null only when cancelled", () => {
        it("should throw 400", () => {
            const testResult = testResultsPostMock[4];
            testResult.odometerReading = null;
            testResult.odometerReadingUnits = null;
            testResult.countryOfRegistration = null;
            testResult.euVehicleCategory = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({
                            testNumber: "W01A00209",
                            id: "W01",
                            certLetter: "A",
                            sequenceNumber: "002"
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });

    });

    context("when inserting a cancelled TRL with fields corresponding to a submitted TRL(reasonForCancelletion = null)", () => {
        it("should throw 400", () => {
            const testResult = {...testResultsPostMock[5]};
            testResult.testStatus = "cancelled";
            testResult.reasonForCancellation = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({
                            testNumber: "W01A00209",
                            id: "W01",
                            certLetter: "A",
                            sequenceNumber: "002"
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: any) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });

    context("when inserting a TRL with vehicleConfiguration centre axle drawbar", () => {
        it("should not throw error", () => {
            const testResult = {...testResultsPostMock[5]};
            testResult.vehicleConfiguration = "centre axle drawbar";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({
                            testNumber: "W01A00209",
                            id: "W01",
                            certLetter: "A",
                            sequenceNumber: "002"
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(1);
            return testResultsService.insertTestResult(testResult)
                .then((data: any) => {
                    expect(data).not.toEqual(undefined);
                });
        });
    });

    context("when inserting a PSV with vehicleConfiguration centre axle drawbar", () => {
        it("should throw error 400", () => {
            const testResult = testResultsPostMock[0];
            testResult.vehicleConfiguration = "centre axle drawbar";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({
                            testNumber: "W01A00209",
                            id: "W01",
                            certLetter: "A",
                            sequenceNumber: "002"
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });

    context("when inserting a cancelled HGV that has null values on the fields that are allowing them to be null", () => {
        it("should not throw error", () => {
            const testResult = testResultsPostMock[4];
            testResult.testStatus = "cancelled";
            testResult.odometerReading = null;
            testResult.odometerReadingUnits = null;
            testResult.countryOfRegistration = null;
            testResult.euVehicleCategory = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(1);
            return testResultsService.insertTestResult(testResult)
                .then((data: any) => {
                    expect(data).not.toEqual(undefined);
                });
        });
    });

    context("when inserting an HGV test result with fields applicable to this vehicleType", () => {
        it("should not throw error", () => {
            const testResult = testResultsPostMock[4];

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(1);
            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult).not.toEqual(undefined);
                });
        });
    });

    context("when inserting an HGV with fields corresponding to a PSV", () => {
        it("should throw 400", () => {
            const testResult = testResultsPostMock[2];
            testResult.vehicleType = "hgv";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });

    context("when inserting an TRL test result with fields applicable to this vehicleType", () => {
        it("should not throw error", () => {
            const testResult = {...testResultsPostMock[5]};

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(1);
            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult).not.toEqual(undefined);
                });
        });
    });

    context("when inserting a TRL with fields corresponding to a PSV", () => {
        it("should throw 400", () => {
            const testResult = testResultsPostMock[2];
            testResult.vehicleType = "trl";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });

    context("when inserting a submitted HGV that has null values on the fields that should be allowed null only when cancelled", () => {
        it("should throw 400", () => {
            const testResult = testResultsPostMock[4];
            testResult.odometerReading = null;
            testResult.odometerReadingUnits = null;
            testResult.countryOfRegistration = null;
            testResult.euVehicleCategory = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });

    context("when inserting a cancelled TRL that has null values on the fields that are allowing them to be null", () => {
        it("should not throw error", () => {
            const testResult = {...testResultsPostMock[5]};
            testResult.testStatus = "cancelled";
            testResult.countryOfRegistration = null;
            testResult.euVehicleCategory = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(1);
            return testResultsService.insertTestResult(testResult)
                .then((data: any) => {
                    expect(data).not.toEqual(undefined);
                });
        });
    });

    context("when inserting a submitted TRL that has null values on the fields that should be allowed null only when cancelled", () => {
        it("should throw 400", () => {
            const testResult = {...testResultsPostMock[5]};
            testResult.odometerReading = null;
            testResult.odometerReadingUnits = null;
            testResult.countryOfRegistration = null;
            testResult.euVehicleCategory = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });

    context("when inserting a submitted HGV that has null values on the fields that should be allowed null only when cancelled", () => {
        it("should throw 400", () => {
            const testResult = testResultsPostMock[4];
            testResult.odometerReading = null;
            testResult.odometerReadingUnits = null;
            testResult.countryOfRegistration = null;
            testResult.euVehicleCategory = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({
                            testNumber: "W01A00209",
                            id: "W01",
                            certLetter: "A",
                            sequenceNumber: "002"
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });

    });

    context("when inserting a cancelled TRL with fields corresponding to a submitted TRL(reasonForCancelletion = null)", () => {
        it("should throw 400", () => {
            const testResult = {...testResultsPostMock[5]};
            testResult.testStatus = "cancelled";
            testResult.reasonForCancellation = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({
                            testNumber: "W01A00209",
                            id: "W01",
                            certLetter: "A",
                            sequenceNumber: "002"
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });
    // CVSB-7964: AC4 When inserting a test result for the submitted test with the required fields certificateNumber, expiryDate, modType, emissionStandard and fuelType populated for Pass tests

    context("when inserting an TRL test result with firstUseDate field", () => {
        it("should not throw error", () => {
            const testResult = {...testResultsPostMock[7]};

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[7]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult[0].vehicleType).toEqual("trl");
                    expect(insertedTestResult[0].testResultId).toEqual("195");
                    expect(insertedTestResult[0].firstUseDate).toEqual("2018-11-11");
                });
        });
    });

    context("when inserting a TRL test result with regnDate field)", () => {
        it("should throw 400", () => {
            const testResult = {...testResultsPostMock[5]};
            testResult.regnDate = "2019-10-11";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({
                            testNumber: "W01A00209",
                            id: "W01",
                            certLetter: "A",
                            sequenceNumber: "002"
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });

    context("when inserting an HGV test result with regnDate field", () => {
        it("should not throw error", () => {
            const testResult = {...testResultsPostMock[4]};

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult[0].vehicleType).toEqual("hgv");
                    expect(insertedTestResult[0].testResultId).toEqual("1113");
                    expect(insertedTestResult[0].regnDate).toEqual("2018-10-10");
                });
        });
    });

    context("when inserting a non-adr HGV with null expiry Date and null certificateNumber", () => {
        it("should not throw error", () => {
            const testResult = cloneDeep(testResultsPostMock[4]);
            testResult.testTypes[0].testExpiryDate = null;
            testResult.testTypes[0].certificateNumber = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult[0].vehicleType).toEqual("hgv");
                    expect(insertedTestResult[0].testResultId).toEqual("1113");
                });
        });
    });

    context("when inserting a non-adr TRL with null expiry Date and null certificateNumber", () => {
        it("should not throw error", () => {
            const testResult = cloneDeep(testResultsPostMock[5]);
            testResult.testTypes[0].testExpiryDate = null;
            testResult.testTypes[0].certificateNumber = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[5]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult[0].vehicleType).toEqual("trl");
                    expect(insertedTestResult[0].testResultId).toEqual("1115");
                });
        });
    });

    context("when inserting a cancelled adr HGV with null expiry Date and null certificateNumber", () => {
        it("should not throw error", () => {
            const testResult = cloneDeep(testResultsPostMock[4]);
            testResult.testTypes[0].testTypeId = "50";
            testResult.testStatus = TEST_STATUS.CANCELLED;
            testResult.testTypes[0].testExpiryDate = null;
            testResult.testTypes[0].certificateNumber = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResult));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult[0].vehicleType).toEqual("hgv");
                    expect(insertedTestResult[0].testResultId).toEqual("1113");
                });
        });
    });

    context("when inserting a cancelled adr TRL with null expiry Date and null certificateNumber", () => {
        it("should not throw error", () => {
            const testResult = cloneDeep(testResultsPostMock[5]);
            testResult.testTypes[0].testTypeId = "50";
            testResult.testStatus = TEST_STATUS.CANCELLED;
            testResult.testTypes[0].testExpiryDate = null;
            testResult.testTypes[0].certificateNumber = null;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[5]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult[0].vehicleType).toEqual("trl");
                    expect(insertedTestResult[0].testResultId).toEqual("1115");
                });
        });
    });

    context("when inserting a HGV test result with firstUseDate field", () => {
        it("should throw 400", () => {
            const testResult = {...testResultsPostMock[4]};
            testResult.firstUseDate = "2019-10-11";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[4]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({
                            testNumber: "W01A00209",
                            id: "W01",
                            certLetter: "A",
                            sequenceNumber: "002"
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResult)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                });
        });
    });

    context("when inserting a testResult that has an ADR testType with expiryDate and certificateNumber", () => {
        it("should not throw error", () => {
            const testResultWithAdrTestType = testResultsPostMock[6];

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[6]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({
                            testNumber: "W01A00209",
                            id: "W01",
                            certLetter: "A",
                            sequenceNumber: "002"
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(1);
            return testResultsService.insertTestResult(testResultWithAdrTestType)
                .then((data: any) => {
                    expect(data).not.toEqual(undefined);
                });
        });
    });

    context("when inserting a testResult that has an ADR testType without expiryDate", () => {
        it("should throw 400 and descriptive error message", () => {
            const testResultWithAdrTestTypeWithoutExpiryDate = testResultsPostMock[6];
            delete testResultWithAdrTestTypeWithoutExpiryDate.testTypes[0].testExpiryDate;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[6]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({
                            testNumber: "W01A00209",
                            id: "W01",
                            certLetter: "A",
                            sequenceNumber: "002"
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.insertTestResult(testResultWithAdrTestTypeWithoutExpiryDate)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                    expect(error.body).toEqual("Expiry date not present on ADR test type");
                });
        });
    });

    context("when inserting a testResult that has an ADR testType without a certificateNumber", () => {
        it("should throw 400 and descriptive error message", () => {
            const testResultWithAdrTestTypeWithoutExpiryDate = testResultsPostMock[6];
            delete testResultWithAdrTestTypeWithoutExpiryDate.testTypes[0].certificateNumber;

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultsPostMock[6]));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({
                            testNumber: "W01A00209",
                            id: "W01",
                            certLetter: "A",
                            sequenceNumber: "002"
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.insertTestResult(testResultWithAdrTestTypeWithoutExpiryDate)
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                    expect(error.body).toEqual(ERRORS.NoCertificateNumberOnAdr);
                });
        });
    });

    context("when inserting a testResult that has an testType other than ADR type with a certificateNumber", () => {
        it("then the inserted test result should set the testNumber as the certificateNumber.", () => {
            const testResultWithOtherTestTypeWithCertNum = cloneDeep(testResultsPostMock[6]);
            // Setting the testType to any other than ADR
            testResultWithOtherTestTypeWithCertNum.testTypes[0].testTypeId = "1";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultWithOtherTestTypeWithCertNum));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({
                            testNumber: "W01A00209",
                            id: "W01",
                            certLetter: "A",
                            sequenceNumber: "002"
                        });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "wde",
                            defaultTestCode: "bde",
                            testTypeClassification: "Annual With Certificate"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(2);
            return testResultsService.insertTestResult(testResultWithOtherTestTypeWithCertNum)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult[0].testTypes[0].testTypeId).toEqual("1");
                    expect(insertedTestResult[0].testTypes[0].certificateNumber).toEqual("W01A00209");
                });
        });
    });

    // CVSB-7964: AC4
    context("when inserting an PSV test result for LEC test code with mandatory fields: expiryDate, modType, emissionStandard and fuelType populated for Pass tests", () => {
        it("test record should get created and should not throw error", () => {
            const testResultWithMandatoryFields = cloneDeep(testResultsPostMock[8]);
            testResultWithMandatoryFields.vehicleType = VEHICLE_TYPES.PSV;
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultWithMandatoryFields));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "lcp",
                            defaultTestCode: "lbp",
                            testTypeClassification: "NON ANNUAL"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());
            expect.assertions(6);
            return testResultsService.insertTestResult(testResultWithMandatoryFields)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult[0].vehicleType).toEqual("psv");
                    expect(insertedTestResult[0].testTypes[0].fuelType).toEqual("gas");
                    expect(insertedTestResult[0].testTypes[0].emissionStandard).toEqual("0.08 g/kWh Euro 3 PM");
                    expect(insertedTestResult[0].testTypes[0].testExpiryDate).toEqual("2020-01-14");
                    expect(insertedTestResult[0].testTypes[0].modType.code).toEqual("m");
                    expect(insertedTestResult[0].testTypes[0].modType.description).toEqual("modification or change of engine");
                });
            });
    });

    context("when inserting a test result for LEC test code with unacceptable value for fuelType", () => {
        it("should throw error", () => {
            const testResultInvalidFuelType = cloneDeep(testResultsPostMock[7]);
            // Update the fuelType to an unacceptable value
            testResultInvalidFuelType.testTypes[0].fuelType = "gas1";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(testResultInvalidFuelType));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "lcp",
                            defaultTestCode: "lbp",
                            testTypeClassification: "NON ANNUAL"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.insertTestResult(testResultInvalidFuelType)
                .catch((error: { statusCode: any; body: { errors: any[]; }; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                    expect(error.body.errors[0]).toEqual(ERRORS.FuelTypeInvalid);
                });
        });
    });

    context("when inserting a test result for LEC test code with unacceptable value for emissionStandard", () => {
        it("should throw error", () => {
            const testResult = testResultsPostMock[9];
            const clonedTestResult = cloneDeep(testResult);
            // Update the emissionStandard to an unacceptable value
            clonedTestResult.testTypes[0].emissionStandard = "testing";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(clonedTestResult));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "lcp",
                            defaultTestCode: "lbp",
                            testTypeClassification: "NON ANNUAL"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.insertTestResult(clonedTestResult)
                // tslint:disable-next-line: no-empty
                .then((insertedTestResult: any) => {})
                .catch((error: { statusCode: any; body: { errors: any[]; }; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                    expect(error.body.errors[0]).toEqual(ERRORS.EmissionStandardInvalid);
                });
        });
    });

    context("when inserting a test result for LEC test code with unacceptable value for modType description", () => {
        it("should throw error", () => {
            const testResult = testResultsPostMock[9];
            const clonedTestResult = cloneDeep(testResult);
            // Update the modType description to an unacceptable value
            clonedTestResult.testTypes[0].modType.description = "engine change";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(clonedTestResult));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "lcp",
                            defaultTestCode: "lbp",
                            testTypeClassification: "NON ANNUAL"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());
            // Update the modType description to an unacceptable value
            testResult.testTypes[0].modType.description = "engine change";
            expect.assertions(3);
            return testResultsService.insertTestResult(clonedTestResult)
            // tslint:disable-next-line: no-empty
            .then((insertedTestResult: any) => {})
                .catch((error: { statusCode: any; body: { errors: any[]; }; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                    expect(error.body.errors[0]).toEqual(ERRORS.ModTypeDescriptionInvalid);
                });
        });
    });

    context("when inserting a test result for LEC test code with unacceptable value for modType code", () => {
        it("should throw error", () => {
            const testResult = testResultsPostMock[9];
            const clonedTestResult = cloneDeep(testResult);
            // Update the modType code to an unacceptable value
            clonedTestResult.testTypes[0].modType.code = "e";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(clonedTestResult));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "lcp",
                            defaultTestCode: "lbp",
                            testTypeClassification: "NON ANNUAL"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());
            // Update the modType code to an unacceptable value
            testResult.testTypes[0].modType.code = "e";

            expect.assertions(3);
            return testResultsService.insertTestResult(clonedTestResult)
                .catch((error: { statusCode: any; body: { errors: any[]; }; }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                    expect(error.body.errors[0]).toEqual(ERRORS.ModTypeCodeInvalid);
                });
        });
    });

    // CVSB-7964: AC5.1- LEC testType without sending a testExpiryDate
    context("when inserting a test result for LEC test code without sending an testExpiryDate and the test status is 'pass'", () => {
        it("should throw error", () => {
            const testResult = testResultsPostMock[8];
            const clonedTestResult = cloneDeep(testResult);
            // Marking testExpiryDate field null for a LEC TestType
            clonedTestResult.testTypes[0].testExpiryDate = null;
            clonedTestResult.testTypes[0].testResult = "pass";
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(clonedTestResult));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "lcp",
                            defaultTestCode: "lbp",
                            testTypeClassification: "NON ANNUAL"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.insertTestResult(clonedTestResult)
                // tslint:disable-next-line: no-empty
                .then((insertedTestResult: any) => { })
                .catch((error: { statusCode: any; body: {errors: string[]}  }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                    expect(error.body.errors[0]).toEqual(ERRORS.NoLECExpiryDate);
                });
        });
    });

    // CVSB-7964: AC5.3- LEC testType without sending a modType
    context("when inserting a test result for LEC test code without sending an modType and the test result 'pass'", () => {
        it("should throw error", () => {
            const testResult = testResultsPostMock[8];
            const clonedTestResult = cloneDeep(testResult);
            // Deleting modType field for a LEC TestType
            delete clonedTestResult.testTypes[0].modType;
            clonedTestResult.testTypes[0].testResult = "pass";
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(clonedTestResult));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "lcp",
                            defaultTestCode: "lbp",
                            testTypeClassification: "NON ANNUAL"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.insertTestResult(clonedTestResult)
                // tslint:disable-next-line: no-empty
                .then((insertedTestResult: any) => {})
                .catch((error: { statusCode: any; body: {errors: string[]}  }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                    expect(error.body.errors[0]).toEqual(ERRORS.NoModificationType);
                });
        });
    });

    // CVSB-7964: AC5.4- LEC testType without sending a emissionStandard
    context("when inserting a test result for LEC test code without sending an emissionStandard and the  test result is 'pass'", () => {
        it("should throw error", () => {
            const testResult = testResultsPostMock[8];
            const clonedTestResult = cloneDeep(testResult);
            // Deleting emissionStandard field for a LEC TestType
            delete clonedTestResult.testTypes[0].emissionStandard;
            clonedTestResult.testTypes[0].testResult = "pass";
            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(clonedTestResult));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "lcp",
                            defaultTestCode: "lbp",
                            testTypeClassification: "NON ANNUAL"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());
            return testResultsService.insertTestResult(clonedTestResult)
                // tslint:disable-next-line: no-empty
                .then((insertedTestResult: any) => {})
                .catch((error: { statusCode: any; body: {errors: string[]} }) => {
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                    expect(error.body.errors[0]).toEqual(ERRORS.NoEmissionStandard);
                });
        });
    });

    // CVSB-7964: AC5.5- LEC testType without sending a fuelType
    context("when inserting a test result for LEC test code without sending an fuelType and the test result is 'pass'", () => {
        it("should throw error", () => {
            const testResult = testResultsPostMock[8];
            const clonedTestResult = cloneDeep(testResult);
            // Deleting fuelType field for a LEC TestType
            delete clonedTestResult.testTypes[0].fuelType;
            clonedTestResult.testTypes[0].testResult = "pass";

            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                return {
                    createSingle: () => {
                        return Promise.resolve(Array.of(clonedTestResult));
                    },
                    getTestNumber: () => {
                        return Promise.resolve({ testNumber: "W01A00209", id: "W01", certLetter: "A", sequenceNumber: "002" });
                    },
                    getTestCodesAndClassificationFromTestTypes: () => {
                        return Promise.resolve({
                            linkedTestCode: "lcp",
                            defaultTestCode: "lbp",
                            testTypeClassification: "NON ANNUAL"
                        });
                    }
                };
            });

            testResultsService = new TestResultsService(new MockTestResultsDAO());

            expect.assertions(3);
            return testResultsService.insertTestResult(clonedTestResult)
                // tslint:disable-next-line: no-empty
                .then((insertedTestResult: any) => {})
                .catch((error: { statusCode: any; body: {errors: string[]} }) => {
                    console.log(error);
                    expect(error).toBeInstanceOf(HTTPError);
                    expect(error.statusCode).toEqual(400);
                    expect(error.body.errors[0]).toEqual(ERRORS.NoFuelType);
                });
        });
    });
});
