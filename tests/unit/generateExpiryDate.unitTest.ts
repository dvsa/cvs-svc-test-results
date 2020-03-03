import { TestResultsService } from "../../src/services/TestResultsService";
import fs from "fs";
import path from "path";
import * as dateFns from "date-fns";
import {cloneDeep} from "lodash";

describe("TestResultsService calling generateExpiryDate", () => {
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

    context("submitted test", () => {
        context("for psv vehicle type", () => {
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
        });

        context("for hgv and trl vehicle types", () => {
            context("when there is no certificate issued for this vehicle", () => {
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

                    const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1);
                    return testResultsService.generateExpiryDate(hgvTestResult)
                        .then((hgvTestResultWithExpiryDate: any) => {
                            expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
                        });
                });
            });

            context("when there is a certificate issued for this vehicle that expired", () => {
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

                    const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1);
                    return testResultsService.generateExpiryDate(hgvTestResult)
                        .then((hgvTestResultWithExpiryDate: any) => {
                            expect((hgvTestResultWithExpiryDate.testTypes[0].testExpiryDate).split("T")[0]).toEqual(expectedExpiryDate.toISOString().split("T")[0]);
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
                    const hgvTestResult = cloneDeep(testResultsMockDB[16]);
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

                    const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1);
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

                    const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1);
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

                    const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1);
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

                    const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1);
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
                it("should set the expiry date to 1 year after the aniversary regDate", () => {
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

                const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1);
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
                const expectedExpiryDate = dateFns.addYears(dateFns.lastDayOfMonth(new Date()), 1);
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

