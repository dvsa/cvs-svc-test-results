import * as enums from "../../../src/assets/Enums";
import * as models from "../../../src/models";
import * as utils from "../../../src/utils";

import { DateProvider } from "../../../src/handlers/expiry/providers/DateProvider";
import { TestDataProvider } from "../../../src/handlers/expiry/providers/TestDataProvider";

describe("TestDataProvider", () => {
  let testDataProvider: TestDataProvider;
  let MockTestResultsDAO: jest.Mock;

  context("for getTestHistory", () => {
    describe("when getBySystemNumber returns error", () => {
      it("should throw error", async () => {
        expect.assertions(1);
        try {
          testDataProvider = new TestDataProvider();
          MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {
              getBySystemNumber: () => {
                throw new Error("some error");
              },
            };
          });
          testDataProvider.testResultsDAO = new MockTestResultsDAO();
          await testDataProvider.getTestHistory("123");
        } catch (error) {
          expect.assertions(1);
          expect(error).toEqual(new Error("some error"));
        }
      });
    });
    describe("when getBySystemNumber returns test results with invalid testEndTimestamp", () => {
      it("should return the filtered data", async () => {
        testDataProvider = new TestDataProvider();
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getBySystemNumber: () => Promise.resolve([
              {
                testStartTimestamp: "2019-03-10T08:47:59.269Z",
                testEndTimestamp: "2019-03",
                testTypes: [
                  {
                    testCode: "fft1",
                    testExpiryDate: "2019-02-10T08:47:59.261009Z",
                  },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
            ]),
          };
        });
        expect.assertions(2);
        testDataProvider.testResultsDAO = new MockTestResultsDAO();
        const result = await testDataProvider.getTestHistory("123");
        expect(result.length).toEqual(1);
        expect(result[0].testEndTimestamp).toEqual("2019-03");
      });
    });
    describe("when getBySystemNumber returns invalid testStartTimestamp", () => {
      it("should return the filtered data", async () => {
        testDataProvider = new TestDataProvider();
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getBySystemNumber: () => Promise.resolve([
              {
                testStartTimestamp: "2019-03",
                testEndTimestamp: "2019-03-10T08:47:59.269Z",
                testTypes: [
                  {
                    testCode: "fft1",
                    testExpiryDate: "2019-02-10T08:47:59.261009Z",
                  },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
            ]),
          };
        });
        expect.assertions(2);
        testDataProvider.testResultsDAO = new MockTestResultsDAO();
        const result = await testDataProvider.getTestHistory("123");
        expect(result.length).toEqual(1);
        expect(result[0].testStartTimestamp).toEqual("2019-03");
      });
    });
    describe("when getBySystemNumber returns array of valid data", () => {
      it("should return the filtered data", async () => {
        expect.assertions(1);
        testDataProvider = new TestDataProvider();
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getBySystemNumber: () => Promise.resolve([
              {
                testStartTimestamp: "2019-03-10T08:47:59.269Z",
                testEndTimestamp: "2019-03-10T09:30:59.269Z",
                testTypes: [
                  {
                    testCode: "fft1",
                    testExpiryDate: "2019-02-10T08:47:59.261Z",
                  },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
              {
                testStartTimestamp: "2019-01-10T08:47:59.269000Z",
                testEndTimestamp: "2019-01-10T09:30:59.269000Z",
                testTypes: [
                  {
                    testCode: "rpt1",
                    testExpiryDate: "2020-12-10T08:47:59.269000Z",
                  },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
            ]),
          };
        });
        testDataProvider.testResultsDAO = new MockTestResultsDAO();
        const result = await testDataProvider.getTestHistory("123");
        expect(result.length).toEqual(2);
      });
    });
  });
  context("for getMostRecentExpiryDate", () => {
    describe("when getBySystemNumber returns error", () => {
      it("should throw error", async () => {
        expect.assertions(1);
        try {
          testDataProvider = new TestDataProvider();
          MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {
              getBySystemNumber: () => {
                throw new Error("some error");
              },
            };
          });
          testDataProvider.testResultsDAO = new MockTestResultsDAO();
          await testDataProvider.getMostRecentExpiryDate("123");
        } catch (error) {
          expect.assertions(1);
          expect(error).toEqual(new Error("some error"));
        }
      });
    });
    describe("when getBySystemNumber returns invalid recent expiry", () => {
      it("should return EPOC as recent expiry", async () => {
        testDataProvider = new TestDataProvider();
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getBySystemNumber: () => Promise.resolve([ {
              testStartTimestamp: "2019-10-10T08:47:59.269Z",
              testEndTimestamp: "2019-10-10T09:30:59.269Z",
              testTypes: [{ testCode: "aat1", testExpiryDate: "2020-01" }],
            }]),
          };
        });
        testDataProvider.testResultsDAO = new MockTestResultsDAO();
        const expiry = await testDataProvider.getMostRecentExpiryDate("123");
        expect(expiry).toEqual(DateProvider.getEpoc());
      });
    });

    describe("when getBySystemNumber returns an array of valid recent expiry short dates", () => {
      it("should return the most recent expiry", async () => {
        testDataProvider = new TestDataProvider();
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getBySystemNumber: () => Promise.resolve([
              {
                testStartTimestamp: "2019-02-10T08:47:59.269Z",
                testEndTimestamp: "2019-02-10T09:30:59.269Z",
                testTypes: [
                  { testCode: "aat1", testExpiryDate: "2020-01-05" },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
              {
                testStartTimestamp: "2019-03-10T08:47:59.269Z",
                testEndTimestamp: "2019-03-10T09:30:59.269Z",
                testTypes: [
                  { testCode: "fft1", testExpiryDate: "2020-02-15" },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
              {
                testStartTimestamp: "2019-01-10T08:47:59.269Z",
                testEndTimestamp: "2019-01-10T09:30:59.269Z",
                testTypes: [
                  { testCode: "rpt1", testExpiryDate: "2020-01-04" },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
            ]),
          };
        });
        testDataProvider.testResultsDAO = new MockTestResultsDAO();
        const expiry = await testDataProvider.getMostRecentExpiryDate("123");
        const expectedDate = new Date("2020-02-15");
        expect(expiry).toEqual(expectedDate);
      });
    });

    describe("when getBySystemNumber returns an array of invalid expiry dates including undefined", () => {
      it("should return the valid most recent expiry", async () => {
        testDataProvider = new TestDataProvider();
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getBySystemNumber: () => Promise.resolve([
              {
                testStartTimestamp: "2019-02-10T08:47:59.269Z",
                testEndTimestamp: "2019-02-10T09:30:59.269Z",
                testTypes: [
                  { testCode: "aat1", testExpiryDate: "2020-01-05" },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
              {
                testStartTimestamp: "2019-03-10T08:47:59.269Z",
                testEndTimestamp: "2019-03-10T09:30:59.269Z",
                testTypes: [
                  { testCode: "fft1", testExpiryDate: "2020-02-15" },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
              {
                testStartTimestamp: "2019-03-10T08:47:59.269Z",
                testEndTimestamp: "2019-03-10T09:30:59.269Z",
                testTypes: [
                  { testCode: "fft1", testExpiryDate: undefined },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
              {
                testStartTimestamp: "2019-01-10T08:47:59.269Z",
                testEndTimestamp: "2019-01-10T09:30:59.269Z",
                testTypes: [
                  { testCode: "rpt1", testExpiryDate: "2020-01" },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
            ]),
          };
        });
        testDataProvider.testResultsDAO = new MockTestResultsDAO();
        expect.assertions(1);
        const result = await testDataProvider.getMostRecentExpiryDate("123");
        expect(result).toEqual(new Date("2020-02-15"));
      });
    });

    describe("when getBySystemNumber returns an array of valid long dates with 6 digit milliseconds and 3 digit milliseconds in history", () => {
      it("should return the valid most recent expiry", async () => {
        testDataProvider = new TestDataProvider();
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getBySystemNumber: () => Promise.resolve( [
              {
                testStartTimestamp: "2019-02-10T08:47:59.269Z",
                testEndTimestamp: "2019-02-10T09:30:59.269Z",
                testTypes: [
                  {
                    testCode: "aat1",
                    testExpiryDate: "2018-02-10T08:47:59.269Z",
                  },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
              {
                testStartTimestamp: "2019-03-10T08:47:59.269Z",
                testEndTimestamp: "2019-03-10T09:30:59.269Z",
                testTypes: [
                  {
                    testCode: "fft1",
                    testExpiryDate: "2019-02-10T08:47:59.261009Z",
                  },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
              {
                testStartTimestamp: "2019-01-10T08:47:59.269Z",
                testEndTimestamp: "2019-01-10T09:30:59.269Z",
                testTypes: [
                  {
                    testCode: "rpt1",
                    testExpiryDate: "2020-12-10T08:47:59.129000Z",
                  },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
            ]),
          };
        });
        expect.assertions(1);
        testDataProvider.testResultsDAO = new MockTestResultsDAO();
        const expiry = await testDataProvider.getMostRecentExpiryDate("123");
        const expectedDate = new Date("2020-12-10T08:47:59.129000Z");
        expect(expiry).toEqual(expectedDate);
      });
    });

    describe("when getBySystemNumber returns an array of valid long dates with valid 3 digit milliseconds in history", () => {
      it("should return the valid most recent expiry", async () => {
        testDataProvider = new TestDataProvider();
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getBySystemNumber: () => Promise.resolve([
              {
                testStartTimestamp: "2019-02-10T08:47:59.269Z",
                testEndTimestamp: "2019-02-10T09:30:59.269Z",
                testTypes: [
                  {
                    testCode: "aat1",
                    testExpiryDate: "2018-02-10T08:47:59.269Z",
                  },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
              {
                testStartTimestamp: "2019-03-10T08:47:59.269Z",
                testEndTimestamp: "2019-03-10T09:30:59.269Z",
                testTypes: [
                  {
                    testCode: "fft1",
                    testExpiryDate: "2019-02-10T08:47:59.261Z",
                  },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
              {
                testStartTimestamp: "2019-01-10T08:47:59.269Z",
                testEndTimestamp: "2019-01-10T09:30:59.269Z",
                testTypes: [
                  {
                    testCode: "rpt1",
                    testExpiryDate: "2020-12-10T08:47:59.129Z",
                  },
                ],
                testStatus: enums.TEST_STATUS.SUBMITTED,
              },
            ]),
          };
        });
        expect.assertions(1);
        testDataProvider.testResultsDAO = new MockTestResultsDAO();
        const expiry = await testDataProvider.getMostRecentExpiryDate("123");
        const expectedDate = new Date("2020-12-10T08:47:59.129000Z");
        expect(expiry).toEqual(expectedDate);
      });
    });
  });
  context("for insertTestResult", () => {
    it("should call the 'testResultDAO.createSingle' method and 'logDefectsReporting'", async () => {
      testDataProvider = new TestDataProvider();
      MockTestResultsDAO = jest.fn().mockImplementation(() => {
        return {
          createSingle: (something: any) => {
            return Promise.resolve({});
          },
        };
      });
      testDataProvider.testResultsDAO = new MockTestResultsDAO();
      const logDefectsReportingSpy = spyOn(
        utils.LoggingUtil,
        "logDefectsReporting"
      );
      expect(logDefectsReportingSpy).not.toHaveBeenCalled();
      await testDataProvider.insertTestResult({} as models.ITestResultPayload);
      expect(logDefectsReportingSpy).toHaveBeenCalledTimes(1);
    });

    it("should throw the error once it fails", async () => {
      testDataProvider = new TestDataProvider();
      const errorMsg = "boom";
      MockTestResultsDAO = jest.fn().mockImplementation(() => {
        return {
          createSingle: (something: any) => Promise.reject(errorMsg),
        };
      });

      testDataProvider.testResultsDAO = new MockTestResultsDAO();
      try {
        await testDataProvider.insertTestResult(
          {} as models.ITestResultPayload
        );
      } catch (e) {
        expect(e).toBe(errorMsg);
      }
    });
  });
});
