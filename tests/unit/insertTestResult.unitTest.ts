import { expect } from "chai";
import { TestResultsService } from "../../src/services/TestResultsService";
import fs, { promises } from "fs";
import path from "path";
import { HTTPError } from "../../src/models/HTTPError";
import { MESSAGES, ERRORS } from "../../src/assets/Enums";
import { ITestResultPayload } from "../../src/models/ITestResultPayload";
import { HTTPResponse } from "../../src/models/HTTPResponse";
import * as dateFns from "date-fns";

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

            return testResultsService.insertTestResult(mockData)
                .then(() => { expect.fail(); })
                .catch((error: { statusCode: any; body: { errors: any[]; }; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.equal(400);
                    expect(error.body).to.equal(ERRORS.PayloadCannotBeEmpty);
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
            return testResultsService.insertTestResult(mockData)
                .then(() => { expect.fail(); })
                .catch((error: any) => {
                    expect(error).to.not.equal(undefined);
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

            return testResultsService.insertTestResult(mockData)
                .then(() => { expect.fail(); })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error.statusCode).to.equal(400);
                    expect(error.body).to.equal(ERRORS.NoDeficiencyCategory);
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
                delete testType.testExpiryDate;
                delete testType.certificateLink;
                delete testType.testTypeClassification;
            }
            delete mockData.vehicleId;
            mockData.testResultId = "1";
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            return testResultsService.insertTestResult(mockData)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.equal(500);
                    expect(error.body).to.equal(MESSAGES.INTERNAL_SERVER_ERROR);
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
                delete testType.testExpiryDate;
                delete testType.certificateLink;
                delete testType.testTypeClassification;
              }
            delete mockData.vehicleId;
            mockData.testResultId = "1111";

            return testResultsService.insertTestResult(mockData)
                .then(() => { expect.fail(); })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPResponse);
                    expect(error.statusCode).to.be.equal(201);
                    expect(error.body).to.be.equal("\"" + MESSAGES.ID_ALREADY_EXISTS + "\"");
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

            return testResultsService.insertTestResult(mockData)
                .then(() => { expect.fail(); })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error.statusCode).to.equal(400);
                    expect(error.body).to.equal(MESSAGES.REASON_FOR_ABANDONING_NOT_PRESENT);
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

            return testResultsService.insertTestResult(mockData)
                .then((data: any) => {
                    expect(data).to.not.be.eql(undefined);
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

            return testResultsService.insertTestResult(mockData)
                .then((data: any) => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error.statusCode).to.be.eql(400);
                    expect(error.body).to.be.eql({ errors: ["\"prohibitionIssued\" is required"] });
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

            return testResultsService.insertTestResult(testResult)
                .then((data: any) => {
                    expect(data).to.not.be.eql(undefined);
                })
                .catch(() => {
                    expect.fail();
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

            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult).to.not.be.eql(undefined);
                })
                .catch(() => {
                    expect.fail();
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

            return testResultsService.insertTestResult(testResult)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult).to.not.be.eql(undefined);
                })
                .catch(() => {
                    expect.fail();
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

            return testResultsService.insertTestResult(testResult)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResult)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResult)
                .then((data: any) => {
                    expect(data).to.not.be.eql(undefined);
                })
                .catch(() => {
                    expect.fail();
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

            return testResultsService.insertTestResult(testResult)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResult)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResult)
                .then((data: any) => {
                    expect.fail();
                })
                .catch((error: any) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResult)
                .then((data: any) => {
                    expect(data).to.not.be.eql(undefined);
                })
                .catch(() => {
                    expect.fail();
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

            return testResultsService.insertTestResult(testResult)
                .then((data: any) => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResult)
                .then((data: any) => {
                    expect(data).to.not.be.eql(undefined);
                })
                .catch(() => {
                    expect.fail();
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

            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult).to.not.be.eql(undefined);
                })
                .catch(() => {
                    expect.fail();
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

            return testResultsService.insertTestResult(testResult)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResult)
                .then((insertedTestResult: any) => {
                    expect(insertedTestResult).to.not.be.eql(undefined);
                })
                .catch(() => {
                    expect.fail();
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

            return testResultsService.insertTestResult(testResult)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResult)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResult)
                .then((data: any) => {
                    expect(data).to.not.be.eql(undefined);
                })
                .catch(() => {
                    expect.fail();
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

            return testResultsService.insertTestResult(testResult)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResult)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResult)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
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

            return testResultsService.insertTestResult(testResultWithAdrTestType)
                .then((data: any) => {
                    expect(data).not.be.eql(undefined);
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect.fail();
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

            return testResultsService.insertTestResult(testResultWithAdrTestTypeWithoutExpiryDate)
                .then((data: any) => {
                    console.log("THIS IS THE DATA", data);
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    console.log("THIS IS THE ERROR", error);
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
                    expect(error.body).to.be.eql("Expiry date not present on ADR test type");
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

            return testResultsService.insertTestResult(testResultWithAdrTestTypeWithoutExpiryDate)
                .then(() => {
                    expect.fail();
                })
                .catch((error: { statusCode: any; body: any; }) => {
                    expect(error).to.be.instanceOf(HTTPError);
                    expect(error.statusCode).to.be.eql(400);
                    expect(error.body).to.be.eql(ERRORS.NoCertificateNumber);
                });
        });
    });
});
