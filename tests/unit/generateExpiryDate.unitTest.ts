import {TestResultsService} from "../../src/services/TestResultsService";
import fs from "fs";
import path from "path";
import * as dateFns from "date-fns";
import {cloneDeep} from "lodash";
import dateMockUtils from "../util/dateMockUtils";
import {ITestResult} from "../../src/models/ITestResult";
import testResults from "../resources/test-results.json";

describe("TestResultsService calling generateExpiryDate", () => {
    let testResultsService: TestResultsService | any;
    let MockTestResultsDAO: jest.Mock;
    let testResultsMockDB: any;
    let testResultsPostMock: any;

    beforeEach(() => {
        testResultsMockDB = cloneDeep(testResults);
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
        dateMockUtils.restoreDateMock();
    });

    context("submitted test", () => {
        afterEach(() => {
            dateMockUtils.restoreDateMock();
        });
        context("for psv vehicle type", () => {
            describe("with good dates in test history", () => {
                it("should set the expiryDate for Annual With Certificate testTypes with testResult pass, fail or prs", () => {
                    const psvTestResult = cloneDeep(testResultsMockDB[0]);
                    const getBySystemNumberResponse = cloneDeep(testResultsMockDB[0]);

                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            getBySystemNumber: () => {
                                return Promise.resolve({
                                    Items: Array.of(getBySystemNumberResponse),
                                    Count: 1,
                                    ScannedCount: 1
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

                    const expectedExpiryDate = new Date();
                    expectedExpiryDate.setFullYear(new Date().getFullYear() + 1);
                    expectedExpiryDate.setDate(new Date().getDate() - 1);
                    return testResultsService.generateExpiryDate(psvTestResult)
                      .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                          expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                      });
                });
                describe("Annual Tests testTypes with ", () => {
                    describe("with no previous expiry, anniversary or registration date", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });

                        it("should set the expiryDate to 1 day prior to one year from \"now\" for Pass results - not for PRS and Fail", () => {
                            const test: ITestResult = cloneDeep(testResultsMockDB[0]);
                            delete test.regnDate;
                            test.testTypes.forEach((type) => {
                                delete type.testExpiryDate;
                                delete type.testAnniversaryDate;
                                return type;
                            });
                            const psvTestResult = test;
                            const getBySystemNumberResponse = test;

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: Array.of(getBySystemNumberResponse),
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-01-31");
                            return testResultsService.generateExpiryDate(psvTestResult)
                              .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                                  expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[1].testExpiryDate).toBeUndefined();
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[2].testExpiryDate).toBeUndefined();
                              });
                        });
                    });
                    describe("with no previous expiry date, and today is >2 months before registration anniversary", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });

                        it("should set the expiryDate to 1 day prior to one year from \"now\" for Pass results - not for PRS and Fail", () => {
                            const test: ITestResult = cloneDeep(testResultsMockDB[0]);
                            test.regnDate = new Date("2019-08-01");
                            test.testTypes.forEach((type) => {
                                delete type.testExpiryDate;
                                delete type.testAnniversaryDate;
                                return type;
                            });
                            const psvTestResult = test;
                            const getBySystemNumberResponse = test;

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: Array.of(getBySystemNumberResponse),
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-01-31");
                            return testResultsService.generateExpiryDate(psvTestResult)
                              .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                                  expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[1].testExpiryDate).toBeUndefined();
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[2].testExpiryDate).toBeUndefined();
                              });
                        });
                    });
                    describe("with no previous expiry date, and today is 2 months before registration anniversary", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });

                        it("should set the expiryDate to 1 day prior to one year from \"now\" for Pass results - not for PRS and Fail", () => {
                            const test: ITestResult = cloneDeep(testResultsMockDB[0]);
                            test.regnDate = new Date("2019-04-01");
                            test.testTypes.forEach((type) => {
                                delete type.testExpiryDate;
                                delete type.testAnniversaryDate;
                                return type;
                            });
                            const psvTestResult = test;
                            const getBySystemNumberResponse = test;

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: Array.of(getBySystemNumberResponse),
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-01-31");
                            return testResultsService.generateExpiryDate(psvTestResult)
                              .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                                  expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[1].testExpiryDate).toBeUndefined();
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[2].testExpiryDate).toBeUndefined();
                              });
                        });
                    });
                    // describe("with no previous expiry date, and today is <2 months before registration anniversary", () => {
                    //   beforeAll(() => {
                    //     dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z")
                    //   });
                    //   afterAll(() => {
                    //     dateMockUtils.restoreDateMock();
                    //   });
                    //
                    //   it("should set the expiryDate to Registration Date + 2 years (Regn Anniversary + 1 year) for Pass results - not for PRS and Fail", () => {
                    //     const test: ITestResult = cloneDeep(testResultsMockDB[0]);
                    //     test.regnDate = new Date("2019-02-02T10:00:00.000Z");
                    //     test.testTypes.forEach((type) => {
                    //       delete type.testExpiryDate;
                    //       delete type.testAnniversaryDate;
                    //       return type
                    //     });
                    //     const psvTestResult = test;
                    //     const getBySystemNumberResponse = test;
                    //
                    //     MockTestResultsDAO = jest.fn().mockImplementation(() => {
                    //       return {
                    //         getBySystemNumber: () => {
                    //           return Promise.resolve({
                    //             Items: Array.of(getBySystemNumberResponse),
                    //             Count: 1,
                    //             ScannedCount: 1
                    //           });
                    //         },
                    //         getTestCodesAndClassificationFromTestTypes: () => {
                    //           return Promise.resolve({
                    //             linkedTestCode: "wde",
                    //             defaultTestCode: "bde",
                    //             testTypeClassification: "Annual With Certificate"
                    //           });
                    //         }
                    //       };
                    //     });
                    //     testResultsService = new TestResultsService(new MockTestResultsDAO());
                    //
                    //     const expectedExpiryDate = new Date("2021-02-02");
                    //     return testResultsService.generateExpiryDate(psvTestResult)
                    //       .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                    //         expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                    //         expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[1].testExpiryDate).toBeUndefined();
                    //         expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[2].testExpiryDate).toBeUndefined();
                    //       });
                    //   });
                    // });
                    // describe("with no previous expiry date, and today is the day of the registration anniversary", () => {
                    //   beforeAll(() => {
                    //     dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z")
                    //   });
                    //   afterAll(() => {
                    //     dateMockUtils.restoreDateMock();
                    //   });
                    //
                    //   it("should set the expiryDate to Registration Date + 2 years (Regn Anniversary + 1 year) for Pass results - not for PRS and Fail", () => {
                    //     const test: ITestResult = cloneDeep(testResultsMockDB[0]);
                    //     test.regnDate = new Date("2019-02-01");
                    //     test.testTypes.forEach((type) => {
                    //       delete type.testExpiryDate;
                    //       delete type.testAnniversaryDate;
                    //       return type
                    //     });
                    //     const psvTestResult = test;
                    //     const getBySystemNumberResponse = test;
                    //
                    //     MockTestResultsDAO = jest.fn().mockImplementation(() => {
                    //       return {
                    //         getBySystemNumber: () => {
                    //           return Promise.resolve({
                    //             Items: Array.of(getBySystemNumberResponse),
                    //             Count: 1,
                    //             ScannedCount: 1
                    //           });
                    //         },
                    //         getTestCodesAndClassificationFromTestTypes: () => {
                    //           return Promise.resolve({
                    //             linkedTestCode: "wde",
                    //             defaultTestCode: "bde",
                    //             testTypeClassification: "Annual With Certificate"
                    //           });
                    //         }
                    //       };
                    //     });
                    //     testResultsService = new TestResultsService(new MockTestResultsDAO());
                    //
                    //     const expectedExpiryDate = new Date("2021-03-01");
                    //     return testResultsService.generateExpiryDate(psvTestResult)
                    //       .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                    //         expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                    //         expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[1].testExpiryDate).toBeUndefined();
                    //         expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[2].testExpiryDate).toBeUndefined();
                    //       });
                    //   });
                    // });
                    // describe("with no previous expiry date, and today is after the registration anniversary", () => {
                    //   beforeAll(() => {
                    //     dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z")
                    //   });
                    //   afterAll(() => {
                    //     dateMockUtils.restoreDateMock();
                    //   });
                    //
                    //   it("should set the expiryDate to 1 day prior to one year from \"now\" for Pass results - not for PRS and Fail", () => {
                    //     const test: ITestResult = cloneDeep(testResultsMockDB[0]);
                    //     test.regnDate = new Date("2019-01-31");
                    //     test.testTypes.forEach((type) => {
                    //       delete type.testExpiryDate;
                    //       delete type.testAnniversaryDate;
                    //       return type
                    //     });
                    //     const psvTestResult = test;
                    //     const getBySystemNumberResponse = test;
                    //
                    //     MockTestResultsDAO = jest.fn().mockImplementation(() => {
                    //       return {
                    //         getBySystemNumber: () => {
                    //           return Promise.resolve({
                    //             Items: Array.of(getBySystemNumberResponse),
                    //             Count: 1,
                    //             ScannedCount: 1
                    //           });
                    //         },
                    //         getTestCodesAndClassificationFromTestTypes: () => {
                    //           return Promise.resolve({
                    //             linkedTestCode: "wde",
                    //             defaultTestCode: "bde",
                    //             testTypeClassification: "Annual With Certificate"
                    //           });
                    //         }
                    //       };
                    //     });
                    //     testResultsService = new TestResultsService(new MockTestResultsDAO());
                    //
                    //     const expectedExpiryDate = new Date("2021-03-01");
                    //     return testResultsService.generateExpiryDate(psvTestResult)
                    //       .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                    //         expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                    //         expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[1].testExpiryDate).toBeUndefined();
                    //         expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[2].testExpiryDate).toBeUndefined();
                    //       });
                    //   });
                    // });
                    describe("with previous expiry date, and today >2 months before the previous expiry date>", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });

                        it("should set the expiryDate to 1 day prior to one year from \"now\" for Pass results - not for PRS and Fail", () => {
                            const test: ITestResult = cloneDeep(testResultsMockDB[0]);
                            test.testTypes.forEach((type) => {
                                if (type.testResult === "pass") {
                                    type.testExpiryDate = new Date("2020-04-02");
                                }
                                delete type.testAnniversaryDate;
                                return type;
                            });
                            const psvTestResult = test;
                            const getBySystemNumberResponse = test;

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: Array.of(getBySystemNumberResponse),
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-01-31");
                            return testResultsService.generateExpiryDate(psvTestResult)
                              .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                                  expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[1].testExpiryDate).toBeUndefined();
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[2].testExpiryDate).toBeUndefined();
                              });
                        });
                    });
                    describe("with previous expiry date, and today 2 months before the previous expiry date>", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });

                        it("should set the expiryDate to one year from previous expiry date for Pass results - not for PRS and Fail", () => {
                            const test: ITestResult = cloneDeep(testResultsMockDB[0]);
                            test.testTypes.forEach((type) => {
                                if (type.testResult === "pass") {
                                    type.testExpiryDate = new Date("2020-04-01");
                                }
                                delete type.testAnniversaryDate;
                                return type;
                            });
                            const psvTestResult = test;
                            const getBySystemNumberResponse = test;

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: Array.of(getBySystemNumberResponse),
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-04-01");
                            return testResultsService.generateExpiryDate(psvTestResult)
                              .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                                  expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[1].testExpiryDate).toBeUndefined();
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[2].testExpiryDate).toBeUndefined();
                              });
                        });
                    });
                    describe("with previous expiry date, and today <2 months before the previous expiry date>", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });

                        it("should set the expiryDate to one year from previous expiry date for Pass results - not for PRS and Fail", () => {
                            const test: ITestResult = cloneDeep(testResultsMockDB[0]);
                            test.testTypes.forEach((type) => {
                                if (type.testResult === "pass") {
                                    type.testExpiryDate = new Date("2020-03-31");
                                }
                                delete type.testAnniversaryDate;
                                return type;
                            });
                            const psvTestResult = test;
                            const getBySystemNumberResponse = test;

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: Array.of(getBySystemNumberResponse),
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-03-31");
                            return testResultsService.generateExpiryDate(psvTestResult)
                              .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                                  expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[1].testExpiryDate).toBeUndefined();
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[2].testExpiryDate).toBeUndefined();
                              });
                        });
                    });
                    describe("with previous expiry date, and today is after the previous expiry date>", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });

                        it("should set the expiryDate to 1 day before one year from today for Pass results - not for PRS and Fail", () => {
                            const test: ITestResult = cloneDeep(testResultsMockDB[0]);
                            test.testTypes.forEach((type) => {
                                if (type.testResult === "pass") {
                                    type.testExpiryDate = new Date("2020-01-21");
                                }
                                delete type.testAnniversaryDate;
                                return type;
                            });
                            const psvTestResult = test;
                            const getBySystemNumberResponse = test;

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: Array.of(getBySystemNumberResponse),
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-01-31");
                            return testResultsService.generateExpiryDate(psvTestResult)
                              .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                                  expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[1].testExpiryDate).toBeUndefined();
                                  expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[2].testExpiryDate).toBeUndefined();
                              });
                        });
                    });
                });
                // describe("COIF with Annual Test", () => {
                //   // it("should set the expiryDate to 1 day prior to one year from \"now\" for ALL Pass results - not for PRS and Fail", () => {
                //   //       const test: ITestResult = cloneDeep(testResultsMockDB[0]);
                //   //       test.regnDate = new Date("2019-08-01");
                //   //       test.testTypes.forEach((type) => {
                //   //           delete type.testExpiryDate;
                //   //           delete type.testAnniversaryDate;
                //   //           return type
                //   //       });
                //   //       const psvTestResult = test;
                //   //       const getBySystemNumberResponse = test;
                //   //
                //   //       MockTestResultsDAO = jest.fn().mockImplementation(() => {
                //   //           return {
                //   //               getBySystemNumber: () => {
                //   //                   return Promise.resolve({
                //   //                       Items: Array.of(getBySystemNumberResponse),
                //   //                       Count: 1,
                //   //                       ScannedCount: 1
                //   //                   });
                //   //               },
                //   //               getTestCodesAndClassificationFromTestTypes: () => {
                //   //                   return Promise.resolve({
                //   //                       linkedTestCode: "wde",
                //   //                       defaultTestCode: "bde",
                //   //                       testTypeClassification: "Annual With Certificate"
                //   //                   });
                //   //               }
                //   //           };
                //   //       });
                //   //       testResultsService = new TestResultsService(new MockTestResultsDAO());
                //   //
                //   //       const expectedExpiryDate = new Date("2021-01-31");
                //   //       return testResultsService.generateExpiryDate(psvTestResult)
                //   //         .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                //   //             expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                //   //             expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[1].testExpiryDate).toBeUndefined();
                //   //             expect(psvTestResultWithExpiryDateAndTestNumber.testTypes[2].testExpiryDate).toBeUndefined();
                //   //         });
                //   //   });
                // })
            });

            describe("with only bad dates in the test history", () => {
                it("should ignore the bad dates and set the expiry to 1 day short of a year from today", () => {
                    const psvTestResult = cloneDeep(testResultsMockDB[0]);
                    const getBySystemNumberResponse = cloneDeep(testResultsMockDB[0]) as ITestResult;
                    getBySystemNumberResponse.testTypes.forEach((test) => {
                        test.testExpiryDate = new Date("2020-0"); // Invalid Date object
                        return test;
                    });
                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            getBySystemNumber: () => {
                                return Promise.resolve({
                                    Items: Array.of(getBySystemNumberResponse),
                                    Count: 1,
                                    ScannedCount: 1
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

                    const expectedExpiryDate = new Date();
                    expectedExpiryDate.setFullYear(new Date().getFullYear() + 1);
                    expectedExpiryDate.setDate(new Date().getDate() - 1);
                    return testResultsService.generateExpiryDate(psvTestResult)
                      .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                          expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                      });
                });
            });
            describe("with some bad dates in the test history, and an 'imminent' expiry date", () => {
                it("should ignore the bad dates and set the expiry to 1 year from the last valid expiry", () => {
                    const psvTestResult = cloneDeep(testResultsMockDB[0]);
                    const getBySystemNumberResponse = cloneDeep(testResultsMockDB[0]) as ITestResult;
                    const goodExpiry = dateFns.addDays(new Date(), 5);
                    getBySystemNumberResponse.testTypes[0].testExpiryDate = goodExpiry;
                    getBySystemNumberResponse.testTypes[1].testExpiryDate = new Date("2020-0");
                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            getBySystemNumber: () => {
                                return Promise.resolve({
                                    Items: Array.of(getBySystemNumberResponse),
                                    Count: 1,
                                    ScannedCount: 1
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

                    const expectedExpiryDate = cloneDeep(goodExpiry);
                    expectedExpiryDate.setFullYear(goodExpiry.getFullYear() + 1);
                    return testResultsService.generateExpiryDate(psvTestResult)
                      .then((psvTestResultWithExpiryDateAndTestNumber: any) => {
                          expect((psvTestResultWithExpiryDateAndTestNumber.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                      });
                });
            });
        });

        context("for hgv and trl vehicle types", () => {
            context("when there is no certificate issued for this vehicle", () => {
                describe("with good regn/first use date strings", () => {
                    it("should set the expiry date to last day of current month + 1 year", () => {
                        const hgvTestResult = cloneDeep(testResultsMockDB[15]);
                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getBySystemNumber: () => {
                                    return Promise.resolve({
                                        Items: [],
                                        Count: 0,
                                        ScannedCount: 0
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

                        const expectedExpiryDate = dateFns.endOfDay(dateFns.lastDayOfMonth(dateFns.addYears(new Date(), 1)));
                        return testResultsService.generateExpiryDate(hgvTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });
                describe("with invalid regn/first use date strings", () => {
                    it("should STILL set the expiry date to last day of current month + 1 year", () => {
                        const hgvTestResult = cloneDeep(testResultsMockDB[15]);
                        hgvTestResult.regnDate = "2020-0";
                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getBySystemNumber: () => {
                                    return Promise.resolve({
                                        Items: [],
                                        Count: 0,
                                        ScannedCount: 0
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

                        const expectedExpiryDate = dateFns.addHours(dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1), 3);
                        return testResultsService.generateExpiryDate(hgvTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });
            });

            context("when there is a certificate issued for this vehicle that expired", () => {
                describe("and the previous expiry date is a valid date", () => {
                    it("should set the expiry date to last day of current month + 1 year", () => {
                        const hgvTestResult = cloneDeep(testResultsMockDB[15]);
                        const pastExpiryDate = dateFns.subMonths(new Date(), 1);
                        const testResultExpiredCertificateWithSameSystemNumber = testResultsMockDB[15];
                        testResultExpiredCertificateWithSameSystemNumber.testTypes[0].testExpiryDate = pastExpiryDate;

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getBySystemNumber: (systemNumber: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(testResultExpiredCertificateWithSameSystemNumber),
                                        Count: 1,
                                        ScannedCount: 1
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

                        const expectedExpiryDate = dateFns.endOfDay(dateFns.lastDayOfMonth(dateFns.addYears(new Date(), 1)));
                        return testResultsService.generateExpiryDate(hgvTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });
                describe("and the previous expiry date is malformed", () => {
                    it("should still set the expiry date to last day of current month + 1 year", () => {
                        const hgvTestResult = cloneDeep(testResultsMockDB[15]);
                        const pastExpiryDate = "2020-0";
                        const testResultExpiredCertificateWithSameSystemNumber = cloneDeep(testResultsMockDB[15]);
                        testResultExpiredCertificateWithSameSystemNumber.testTypes[0].testExpiryDate = pastExpiryDate;

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getBySystemNumber: (systemNumber: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(testResultExpiredCertificateWithSameSystemNumber),
                                        Count: 1,
                                        ScannedCount: 1
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

                        const expectedExpiryDate = dateFns.addHours(dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1), 3);
                        return testResultsService.generateExpiryDate(hgvTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });
                describe("First test types", () => {
                    const hgvTestResult = cloneDeep(testResults[15]) as ITestResult;
                    hgvTestResult.testTypes.forEach((type) => {
                        type.testTypeId = "41";
                        delete type.testExpiryDate;
                        delete type.testAnniversaryDate;
                        return type;
                    });
                    describe("with no previous expiry, anniversary or registration date", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to 1 day before one year from today for Pass results - not for PRS and Fail", () => {
                            delete hgvTestResult.regnDate;
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [],
                                            Count: 0,
                                            ScannedCount: 0
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

                            const expectedExpiryDate = new Date("2021-02-28");
                            return testResultsService.generateExpiryDate(hgvTestResult)
                              .then((hgvTestResultWithExpiryDate: any) => {
                                  expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with no previous expiry date, and today is >2 months before registration anniversary", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to 1 day before one year from today for Pass results - not for PRS and Fail", () => {
                            hgvTestResult.regnDate = new Date("2019-04-02");

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [],
                                            Count: 0,
                                            ScannedCount: 0
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

                            const expectedExpiryDate = new Date("2021-02-28");
                            return testResultsService.generateExpiryDate(hgvTestResult)
                              .then((hgvTestResultWithExpiryDate: any) => {
                                  expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });

                    // The Registration Anniversary is treated as the last day of the month of regnDate + 1 year
                    describe("with no previous expiry date, and today is <2 months before (regnDate + 1 year) but >2 months before END OF registration anniversary MONTH", () => {
                        beforeAll(() => {
                            // "Today"
                            dateMockUtils.setupDateMock("2020-02-20T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to 1 day before one year from today for Pass results - not for PRS and Fail", () => {
                            hgvTestResult.regnDate = new Date("2019-04-01");

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [],
                                            Count: 0,
                                            ScannedCount: 0
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

                            const expectedExpiryDate = new Date("2021-02-28");
                            return testResultsService.generateExpiryDate(hgvTestResult)
                              .then((hgvTestResultWithExpiryDate: any) => {
                                  expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with no previous expiry date, and today is in the month before registration anniversary", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-03-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to the last day of the month of the RegnAnniversary plus 1 year (RegnDate + 2 years)", () => {
                            hgvTestResult.regnDate = new Date("2019-04-02");

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [],
                                            Count: 0,
                                            ScannedCount: 0
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

                            const expectedExpiryDate = new Date("2021-04-30");
                            return testResultsService.generateExpiryDate(hgvTestResult)
                              .then((hgvTestResultWithExpiryDate: any) => {
                                  expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with no previous expiry date, and today is in the month of registration anniversary", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-04-10T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to the last day of the month of the RegnAnniversary plus 1 year (RegnDate + 2 years)", () => {
                            hgvTestResult.regnDate = "2019-04-02T00:00:000Z";

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [],
                                            Count: 0,
                                            ScannedCount: 0
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

                            const expectedExpiryDate = new Date("2021-04-30");
                            return testResultsService.generateExpiryDate(hgvTestResult)
                              .then((hgvTestResultWithExpiryDate: any) => {
                                  expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with no previous expiry date, and today is after the month of registration anniversary", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-05-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to the last day of the month of the RegnAnniversary plus 1 year (RegnDate + 2 years)", () => {
                            hgvTestResult.regnDate = "2019-04-02T00:00:000Z";

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [],
                                            Count: 0,
                                            ScannedCount: 0
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

                            const expectedExpiryDate = new Date("2021-05-31");
                            return testResultsService.generateExpiryDate(hgvTestResult)
                              .then((hgvTestResultWithExpiryDate: any) => {
                                  expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                });

                describe("Non-First-Test Types", () => {
                    const hgvTestResult = cloneDeep(testResults[15]) as ITestResult;
                    describe("with Today >2 months before previous expiry date", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2019-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to last day of current month + 1 year for Pass results - nothing for PRS and Fail", () => {
                            hgvTestResult.testTypes.forEach((type) => {
                                type.testExpiryDate = "2020-05-01T10:00:00.000Z";
                            });
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [hgvTestResult],
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2020-02-29");
                            return testResultsService.generateExpiryDate(hgvTestResult)
                              .then((hgvTestResultWithExpiryDate: any) => {
                                  expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with Today <2 months before previous expiry date, but >2 months before end of expiry date month", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-10T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to last day of CURRENT month + 1 year for Pass results - nothing for PRS and Fail", () => {
                            hgvTestResult.testTypes.forEach((type) => {
                                type.testExpiryDate = "2020-04-01T10:00:00.000Z";
                            });
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [hgvTestResult],
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-02-28");
                            return testResultsService.generateExpiryDate(hgvTestResult)
                              .then((hgvTestResultWithExpiryDate: any) => {
                                  expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with Today in month prior to month of expiry date month", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-03-10T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to last day of EXPIRY month + 1 year for Pass results - nothing for PRS and Fail", () => {
                            hgvTestResult.testTypes.forEach((type) => {
                                type.testExpiryDate = "2020-04-01T10:00:00.000Z";
                            });
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [hgvTestResult],
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-04-30");
                            return testResultsService.generateExpiryDate(hgvTestResult)
                              .then((hgvTestResultWithExpiryDate: any) => {
                                  expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with Today after expiry date, but in month of expiry date", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-03-31T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to last day of EXPIRY month + 1 year for Pass results - nothing for PRS and Fail", () => {
                            hgvTestResult.testTypes.forEach((type) => {
                                type.testExpiryDate = "2020-03-01T10:00:00.000Z";
                            });
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [hgvTestResult],
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-03-31");
                            return testResultsService.generateExpiryDate(hgvTestResult)
                              .then((hgvTestResultWithExpiryDate: any) => {
                                  expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with Today after month of expiry date", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-04-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to last day of current month + 1 year for Pass results - nothing for PRS and Fail", () => {
                            hgvTestResult.testTypes.forEach((type) => {
                                type.testExpiryDate = "2020-03-01T10:00:00.000Z";
                            });
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [hgvTestResult],
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-04-30");
                            return testResultsService.generateExpiryDate(hgvTestResult)
                              .then((hgvTestResultWithExpiryDate: any) => {
                                  expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });

                });

            });

            describe("for TRL vehicles", () => {
                describe("First test types", () => {
                    const trlTestResult = cloneDeep(testResults[17]) as ITestResult;
                    trlTestResult.testTypes.forEach((type) => {
                        type.testTypeId = "95";
                        delete type.testExpiryDate;
                        delete type.testAnniversaryDate;
                        return type;
                    });
                    describe("with no previous expiry, anniversary or registration date", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to 1 day before one year from today for Pass results - not for PRS and Fail", () => {
                            delete trlTestResult.firstUseDate;
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [],
                                            Count: 0,
                                            ScannedCount: 0
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

                            const expectedExpiryDate = new Date("2021-02-28");
                            return testResultsService.generateExpiryDate(trlTestResult)
                              .then((trlTestResultWithExpiryDate: any) => {
                                  expect((trlTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with no previous expiry date, and today is >2 months before registration anniversary", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to 1 day before one year from today for Pass results - not for PRS and Fail", () => {
                            trlTestResult.firstUseDate = new Date("2019-04-02");

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [],
                                            Count: 0,
                                            ScannedCount: 0
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

                            const expectedExpiryDate = new Date("2021-02-28");
                            return testResultsService.generateExpiryDate(trlTestResult)
                              .then((trlTestResultWithExpiryDate: any) => {
                                  expect((trlTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });

                    // The Registration Anniversary is treated as the last day of the month of regnDate + 1 year
                    describe("with no previous expiry date, and today is <2 months before (regnDate + 1 year) but >2 months before END OF registration anniversary MONTH", () => {
                        beforeAll(() => {
                            // "Today"
                            dateMockUtils.setupDateMock("2020-02-20T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to 1 day before one year from today for Pass results - not for PRS and Fail", () => {
                            trlTestResult.firstUseDate = new Date("2019-04-01");

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [],
                                            Count: 0,
                                            ScannedCount: 0
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

                            const expectedExpiryDate = new Date("2021-02-28");
                            return testResultsService.generateExpiryDate(trlTestResult)
                              .then((trlTestResultWithExpiryDate: any) => {
                                  expect((trlTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with no previous expiry date, and today is in the month before registration anniversary", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-03-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to the last day of the month of the RegnAnniversary plus 1 year (RegnDate + 2 years)", () => {
                            trlTestResult.firstUseDate = new Date("2019-04-02");

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [],
                                            Count: 0,
                                            ScannedCount: 0
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

                            const expectedExpiryDate = new Date("2021-04-30");
                            return testResultsService.generateExpiryDate(trlTestResult)
                              .then((trlTestResultWithExpiryDate: any) => {
                                  expect((trlTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with no previous expiry date, and today is in the month of registration anniversary", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-04-10T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to the last day of the month of the RegnAnniversary plus 1 year (RegnDate + 2 years)", () => {
                            trlTestResult.firstUseDate = "2019-04-02T00:00:000Z";

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [],
                                            Count: 0,
                                            ScannedCount: 0
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

                            const expectedExpiryDate = new Date("2021-04-30");
                            return testResultsService.generateExpiryDate(trlTestResult)
                              .then((trlTestResultWithExpiryDate: any) => {
                                  expect((trlTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with no previous expiry date, and today is after the month of registration anniversary", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-05-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to the last day of the month of the RegnAnniversary plus 1 year (RegnDate + 2 years)", () => {
                            trlTestResult.firstUseDate = "2019-04-02T00:00:000Z";

                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [],
                                            Count: 0,
                                            ScannedCount: 0
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

                            const expectedExpiryDate = new Date("2021-05-31");
                            return testResultsService.generateExpiryDate(trlTestResult)
                              .then((trlTestResultWithExpiryDate: any) => {
                                  expect((trlTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                });

                describe("Non-First-Test Types", () => {
                    const trlTestResult = cloneDeep(testResults[15]) as ITestResult;
                    trlTestResult.testTypes.forEach((type) => {
                        type.testTypeId = "1";
                    });
                    describe("with Today >2 months before previous expiry date", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2019-02-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to last day of current month + 1 year for Pass results - nothing for PRS and Fail", () => {
                            trlTestResult.testTypes.forEach((type) => {
                                type.testExpiryDate = "2020-05-01T10:00:00.000Z";
                            });
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [trlTestResult],
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2020-02-29");
                            return testResultsService.generateExpiryDate(trlTestResult)
                              .then((trlTestResultWithExpiryDate: any) => {
                                  expect((trlTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with Today <2 months before previous expiry date, but >2 months before end of expiry date month", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-02-10T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to last day of CURRENT month + 1 year for Pass results - nothing for PRS and Fail", () => {
                            trlTestResult.testTypes.forEach((type) => {
                                type.testExpiryDate = "2020-04-01T10:00:00.000Z";
                            });
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [trlTestResult],
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-02-28");
                            return testResultsService.generateExpiryDate(trlTestResult)
                              .then((trlTestResultWithExpiryDate: any) => {
                                  expect((trlTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with Today in month prior to month of expiry date month", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-03-10T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to last day of EXPIRY month + 1 year for Pass results - nothing for PRS and Fail", () => {
                            trlTestResult.testTypes.forEach((type) => {
                                type.testExpiryDate = "2020-04-01T10:00:00.000Z";
                            });
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [trlTestResult],
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-04-30");
                            return testResultsService.generateExpiryDate(trlTestResult)
                              .then((trlTestResultWithExpiryDate: any) => {
                                  expect((trlTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with Today after expiry date, but in month of expiry date", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-03-31T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to last day of EXPIRY month + 1 year for Pass results - nothing for PRS and Fail", () => {
                            trlTestResult.testTypes.forEach((type) => {
                                type.testExpiryDate = "2020-03-01T10:00:00.000Z";
                            });
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [trlTestResult],
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-03-31");
                            return testResultsService.generateExpiryDate(trlTestResult)
                              .then((trlTestResultWithExpiryDate: any) => {
                                  expect((trlTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });
                    describe("with Today after month of expiry date", () => {
                        beforeAll(() => {
                            dateMockUtils.setupDateMock("2020-04-01T10:00:00.000Z");
                        });
                        afterAll(() => {
                            dateMockUtils.restoreDateMock();
                        });
                        it("should set the expiryDate to last day of current month + 1 year for Pass results - nothing for PRS and Fail", () => {
                            trlTestResult.testTypes.forEach((type) => {
                                type.testExpiryDate = "2020-03-01T10:00:00.000Z";
                            });
                            MockTestResultsDAO = jest.fn().mockImplementation(() => {
                                return {
                                    getBySystemNumber: () => {
                                        return Promise.resolve({
                                            Items: [trlTestResult],
                                            Count: 1,
                                            ScannedCount: 1
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

                            const expectedExpiryDate = new Date("2021-04-30");
                            return testResultsService.generateExpiryDate(trlTestResult)
                              .then((trlTestResultWithExpiryDate: any) => {
                                  expect((trlTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                              });
                        });
                    });

                });
            });

            /*
             * AC-1 of CVSB-8658
             */
            context("expiryDate for hgv vehicle type", () => {
                context("when there is a First Test Type with no existing expiryDate and testDate is 2 months or more before Registration Anniversary date.", () => {
                    it("should set the expiry date to last day of test date month + 1 year", () => {
                        const hgvTestResult = cloneDeep(testResults[16]) as ITestResult;
                        // Setting regnDate to a year older + 2 months
                        hgvTestResult.regnDate = dateFns.subYears(dateFns.addMonths(new Date(), 2), 1);

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getBySystemNumber: (systemNumber: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(hgvTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "ffv2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());

                        const expectedExpiryDate = dateFns.endOfDay(dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1));
                        return testResultsService.generateExpiryDate(hgvTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });
            });

            /* AC-4 of CVSB-8658
             */
            context("expiryDate for hgv vehicle type", () => {
                context("when there is a First Test Type with no existing expiryDate and regnDate also not populated", () => {
                    it("should set the expiry date to last day of test date month + 1 year", () => {
                        const hgvTestResult = cloneDeep(testResultsMockDB[16]);
                        delete hgvTestResult.regnDate;

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getBySystemNumber: (systemNumber: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(hgvTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "ffv2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());

                        const expectedExpiryDate = dateFns.endOfDay(dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1));
                        return testResultsService.generateExpiryDate(hgvTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });
            });

            /*
             * AC-2 of CVSB-8658
             */
            context("expiryDate for hgv vehicle type", () => {
                context("when there is a First Test Type with no existing expiryDate and testDate is less than 2 months before Registration Anniversary date.", () => {
                    it("should set the expiry date to 1 year after the Registration Anniversary day", () => {
                        const hgvTestResult = cloneDeep(testResultsMockDB[16]);
                        // Setting regnDate to a year older + 1 month
                        hgvTestResult.regnDate = dateFns.lastDayOfMonth(dateFns.subYears(dateFns.addMonths(new Date(), 1), 1));

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getBySystemNumber: (systemNumber: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(hgvTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "ffv2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());

                        const anniversaryDate = dateFns.addYears(hgvTestResult.regnDate, 1).toISOString();
                        const expectedExpiryDate = dateFns.setHours(dateFns.lastDayOfMonth(dateFns.addYears(anniversaryDate, 1)), 12);
                        return testResultsService.generateExpiryDate(hgvTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });

                context("when there is an Annual Test Type with no existing expiryDate and testDate is 2 months or more before Registration Anniversary date.", () => {
                    it("should set the expiry date to the last day of the test's month + 1 year", () => {
                        const hgvTestResult = cloneDeep(testResultsMockDB[16]);
                        hgvTestResult.testTypes[0].testTypeId = "94";
                        hgvTestResult.regnDate = new Date().toISOString();

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getByVin: (vin: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(hgvTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "aav2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());

                        const expectedExpiryDate = dateFns.setHours(dateFns.lastDayOfMonth(dateFns.addYears(new Date(), 1)), 12);
                        return testResultsService.generateExpiryDate(hgvTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });

                context("when there is an Annual Test Type with no existing expiryDate and testDate is exactly 2 months before Registration Anniversary date.", () => {
                    it("should set the expiry date to the last day of the test's month + 1 year", () => {
                        const hgvTestResult = cloneDeep(testResultsMockDB[16]);
                        hgvTestResult.testTypes[0].testTypeId = "94";
                        hgvTestResult.regnDate = dateFns.addMonths(new Date(), 2).toISOString();

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getByVin: (vin: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(hgvTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "aav2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());

                        const expectedExpiryDate = dateFns.setHours(dateFns.lastDayOfMonth(dateFns.addYears(new Date(), 1)), 12);
                        return testResultsService.generateExpiryDate(hgvTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });

                context("when there is an Annual Test Type with no existing expiryDate and testDate is less than 2 months before Registration Anniversary date.", () => {
                    it("should set the expiry date to 1 year after the aniversary regDate", () => {
                        const hgvTestResult = cloneDeep(testResultsMockDB[16]);
                        hgvTestResult.testTypes[0].testTypeId = "94";
                        hgvTestResult.regnDate = dateFns.subMonths(new Date(), 11).toISOString();

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getByVin: (vin: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(hgvTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "aav2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());

                        const registrationAnniversaryDate = dateFns.addYears(dateFns.lastDayOfMonth(hgvTestResult.regnDate), 1).toISOString();
                        const expectedExpiryDate = dateFns.setHours(dateFns.addYears(registrationAnniversaryDate, 1), 12);
                        return testResultsService.generateExpiryDate(hgvTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });
            });

            /*
             * AC-1 for TRL vehicle type of CVSB-8658
             */
            context("expiryDate for trl vehicle type", () => {
                context("when there is a First Test Type with no existing expiryDate and testDate is 2 months or more before First Use Anniversary date.", () => {
                    it("should set the expiry date to last day of test date month + 1 year", () => {
                        const trlTestResult = cloneDeep(testResultsMockDB[16]);
                        // Setting vehicleType to trl
                        trlTestResult.vehicleType = "trl";
                        // Setting firstUseDate to a year older + 2 months
                        trlTestResult.firstUseDate = dateFns.subYears(dateFns.addMonths(new Date(), 2), 1);

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getBySystemNumber: (systemNumber: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(trlTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "ffv2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());

                        const expectedExpiryDate = dateFns.endOfDay(dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1));
                        return testResultsService.generateExpiryDate(trlTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });
            });

            /*
             * AC-5 of CVSB-8658
             */
            context("expiryDate for trl vehicle type", () => {
                context("when there is a First Test Type with no existing expiryDate and firstUseDate also not populated", () => {
                    it("should set the expiry date to last day of test date month + 1 year", () => {
                        const trlTestResult = cloneDeep(testResultsMockDB[16]);
                        // not setting firstUseDate with any value
                        // Setting vehicleType to trl
                        trlTestResult.vehicleType = "trl";

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getBySystemNumber: (systemNumber: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(trlTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "ffv2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());

                        const expectedExpiryDate = dateFns.endOfDay(dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1));
                        return testResultsService.generateExpiryDate(trlTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });
            });

            /*
             * AC-3 of CVSB-8658
             */
            context("expiryDate for trl vehicle type", () => {
                context("when there is a First Test Type with no existing expiryDate and testDate is less than 2 months before First Use Anniversary date.", () => {
                    it("should set the expiry date to 1 year after the First Use Anniversary day", () => {
                        const trlTestResult = cloneDeep(testResultsMockDB[16]);
                        // Setting vehicleType to trl
                        trlTestResult.vehicleType = "trl";
                        // not regnDate to a year older + 1 month
                        trlTestResult.firstUseDate = dateFns.subYears(dateFns.addMonths(new Date(), 1), 1);

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getBySystemNumber: (systemNumber: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(trlTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "ffv2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());

                        const anniversaryDate = dateFns.addYears(trlTestResult.firstUseDate, 1).toISOString();
                        const expectedExpiryDate = dateFns.setHours(dateFns.lastDayOfMonth(dateFns.addYears(anniversaryDate, 1)), 12);
                        return testResultsService.generateExpiryDate(trlTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });

                context("when there is an Annual Test Type with no existing expiryDate and testDate is less than 2 months before first use Anniversary date.", () => {
                    it("should set the expiry date to 1 year after the anniversary regDate", () => {
                        const trlTestResult = cloneDeep(testResultsMockDB[16]);
                        trlTestResult.vehicleType = "trl";
                        trlTestResult.testTypes[0].testTypeId = "94";
                        trlTestResult.firstUseDate = dateFns.subMonths(new Date(), 11).toISOString();

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getByVin: (vin: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(trlTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "aav2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());

                        const firstUseAnniversaryDate = dateFns.addYears(dateFns.lastDayOfMonth(trlTestResult.firstUseDate), 1).toISOString();
                        const expectedExpiryDate = dateFns.setHours(dateFns.addYears(firstUseAnniversaryDate, 1), 12);
                        return testResultsService.generateExpiryDate(trlTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });

                context("when there is an Annual Test Type with no existing expiryDate and no first Use Anniversary date.", () => {
                    it("should set the expiry date to 1 year after the aniversary regDate", () => {
                        const trlTestResult = cloneDeep(testResultsMockDB[16]);
                        trlTestResult.vehicleType = "trl";
                        trlTestResult.testTypes[0].testTypeId = "94";
                        delete trlTestResult.firstUseDate;

                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getByVin: (vin: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(trlTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "aav2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());

                        const expectedExpiryDate = dateFns.setHours(dateFns.lastDayOfMonth(dateFns.addYears(new Date(), 1)), 12);
                        return testResultsService.generateExpiryDate(trlTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });
            });
            /*
                * AC1 - CVSB-9187
                */
            context("expiryDate for hgv vehicle type", () => {
                context("when there is a First Test Type and the test is conducted after the anniversary date", () => {
                    it("should set the expiry date to 1 year from the month of Registration Date", () => {
                        const hgvTestResult = cloneDeep(testResultsMockDB[16]);
                        // // Setting vehicleType to hgv
                        // hgvTestResult.vehicleType = "hgv";
                        hgvTestResult.regnDate = "2018-10-04";
                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getBySystemNumber: (systemNumber: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(hgvTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "ffv2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());

                        const expectedExpiryDate = dateFns.endOfDay(dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1));
                        return testResultsService.generateExpiryDate(hgvTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });
            });
            /*
            * AC2 - CVSB-9187
            */
            context("expiryDate for trl vehicle type", () => {
                context("when there is a First Test Type and the test is conducted after the anniversary date.", () => {
                    it("should set the expiry date to 1 year from the month of Registration Date", () => {
                        const trlTestResult = cloneDeep(testResultsMockDB[17]);
                        trlTestResult.firstUseDate = "2018-09-04";
                        MockTestResultsDAO = jest.fn().mockImplementation(() => {
                            return {
                                getBySystemNumber: (systemNumber: any) => {
                                    return Promise.resolve({
                                        Items: Array.of(trlTestResult),
                                        Count: 1,
                                        ScannedCount: 1
                                    });
                                },
                                getTestCodesAndClassificationFromTestTypes: () => {
                                    return Promise.resolve({
                                        linkedTestCode: "ffv2",
                                        defaultTestCode: null,
                                        testTypeClassification: "Annual With Certificate"
                                    });
                                }
                            };
                        });
                        testResultsService = new TestResultsService(new MockTestResultsDAO());
                        const expectedExpiryDate = dateFns.endOfDay(dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1));
                        return testResultsService.generateExpiryDate(trlTestResult)
                          .then((hgvTestResultWithExpiryDate: any) => {
                              expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                          });
                    });
                });
            });
        });

        context("no testTypes", () => {
            it("should treat like non-submitted test and return original data", () => {
                testResultsService = new TestResultsService(new MockTestResultsDAO());
                const mockData = {};
                expect.assertions(1);
                return testResultsService.generateExpiryDate(mockData)
                  .then((data: any) => {
                      expect(data).toEqual(mockData);
                  });
            });
        });
    });
});
