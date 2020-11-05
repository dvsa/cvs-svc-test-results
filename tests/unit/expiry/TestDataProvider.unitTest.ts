import { MESSAGES, TEST_STATUS } from "../../../src/assets/Enums";
import { DateProvider } from "../../../src/handlers/expiry/providers/DateProvider";
import { TestDataProvider } from "../../../src/handlers/expiry/providers/TestDataProvider";
import { HTTPError } from "../../../src/models/HTTPError";

describe("TestDataProvider", () => {
  let testDataProvider: TestDataProvider;
  let MockTestResultsDAO: jest.Mock;

  context("for getTestHistory", () => {
    describe("when getBySystemNumber returns error", () => {
      it("should throw error", async () => {
        try {
          testDataProvider = new TestDataProvider();
          MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {
              getBySystemNumber: () => {
                throw new Error("some error");
              }
            };
          });
          testDataProvider.testResultsDAO = new MockTestResultsDAO();
          await testDataProvider.getTestHistory("123");
        } catch (error) {
          expect.assertions(1);
          expect(error).toEqual(
            new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR)
          );
        }
      });
    });
    describe("when getBySystemNumber returns invalid testEndTimestamp", () => {
      it("should throw error", async () => {
        try {
          testDataProvider = new TestDataProvider();
          MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {
              getBySystemNumber: () => {
                return {
                  testStartTimestamp: "2019-10-10T08:47:59.269Z",
                  testEndTimestamp: "2019-10",
                  testTypes: [
                    { testCode: "aat1", testExpiryDate: "2020-10-10" }
                  ]
                };
              }
            };
          });
          testDataProvider.testResultsDAO = new MockTestResultsDAO();
          await testDataProvider.getTestHistory("123");
        } catch (error) {
          expect.assertions(1);
          expect(error).toEqual(
            new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR)
          );
        }
      });
    });
  });
  context("for getMostRecentExpiryDate", () => {
    describe("when getBySystemNumber returns error", () => {
      it("should throw error", async () => {
        try {
          testDataProvider = new TestDataProvider();
          MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {
              getBySystemNumber: () => {
                throw new Error("some error");
              }
            };
          });
          testDataProvider.testResultsDAO = new MockTestResultsDAO();
          await testDataProvider.getMostRecentExpiryDate("123");
        } catch (error) {
          expect.assertions(1);
          expect(error).toEqual(
            new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR)
          );
        }
      });
    });
    describe("when getBySystemNumber returns invalid recent expiry", () => {
      it("should return EPOC as recent expiry", async () => {
        testDataProvider = new TestDataProvider();
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getBySystemNumber: () => {
              {
                return {
                  testStartTimestamp: "2019-10-10T08:47:59.269Z",
                  testEndTimestamp: "2019-10-10T09:30:59.269Z",
                  testTypes: [{ testCode: "aat1", testExpiryDate: "2020-01" }]
                };
              }
            }
          };
        });
        testDataProvider.testResultsDAO = new MockTestResultsDAO();
        const expiry = await testDataProvider.getMostRecentExpiryDate("123");
        expect(expiry).toEqual(DateProvider.getEpoc());
      });
    });

    describe("when getBySystemNumber returns an array of valid recent expiry dates", () => {
      it("should return the most recent expiry", async () => {
        testDataProvider = new TestDataProvider();
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getBySystemNumber: () => {
              {
                return {
                  Count: 3,
                  Items: [
                    {
                      testStartTimestamp: "2019-02-10T08:47:59.269Z",
                      testEndTimestamp: "2019-02-10T09:30:59.269Z",
                      testTypes: [
                        { testCode: "aat1", testExpiryDate: "2020-01-05" }
                      ],
                      testStatus: TEST_STATUS.SUBMITTED
                    },
                    {
                      testStartTimestamp: "2019-03-10T08:47:59.269Z",
                      testEndTimestamp: "2019-03-10T09:30:59.269Z",
                      testTypes: [
                        { testCode: "fft1", testExpiryDate: "2020-02-15" }
                      ],
                      testStatus: TEST_STATUS.SUBMITTED
                    },
                    {
                      testStartTimestamp: "2019-01-10T08:47:59.269Z",
                      testEndTimestamp: "2019-01-10T09:30:59.269Z",
                      testTypes: [
                        { testCode: "rpt1", testExpiryDate: "2020-01-04" }
                      ],
                      testStatus: TEST_STATUS.SUBMITTED
                    }
                  ]
                };
              }
            }
          };
        });
        testDataProvider.testResultsDAO = new MockTestResultsDAO();
        const expiry = await testDataProvider.getMostRecentExpiryDate("123");
        const expectedDate = new Date("2020-02-15");
        expect(expiry).toEqual(expectedDate);
      });
    });

    describe("when getBySystemNumber returns an array of valid and invalid recent expiry dates", () => {
      it("should return the valid most recent expiry", async () => {
        testDataProvider = new TestDataProvider();
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getBySystemNumber: () => {
              {
                return {
                  Count: 3,
                  Items: [
                    {
                      testStartTimestamp: "2019-02-10T08:47:59.269Z",
                      testEndTimestamp: "2019-02-10T09:30:59.269Z",
                      testTypes: [
                        { testCode: "aat1", testExpiryDate: "2020-01-05" }
                      ],
                      testStatus: TEST_STATUS.SUBMITTED
                    },
                    {
                      testStartTimestamp: "2019-03-10T08:47:59.269Z",
                      testEndTimestamp: "2019-03-10T09:30:59.269Z",
                      testTypes: [
                        { testCode: "fft1", testExpiryDate: "2020-02-15" }
                      ],
                      testStatus: TEST_STATUS.SUBMITTED
                    },
                    {
                      testStartTimestamp: "2019-01-10T08:47:59.269Z",
                      testEndTimestamp: "2019-01-10T09:30:59.269Z",
                      testTypes: [
                        { testCode: "rpt1", testExpiryDate: "2020-01" }
                      ],
                      testStatus: TEST_STATUS.SUBMITTED
                    }
                  ]
                };
              }
            }
          };
        });
        testDataProvider.testResultsDAO = new MockTestResultsDAO();
        const expiry = await testDataProvider.getMostRecentExpiryDate("123");
        const expectedDate = new Date("2020-02-15");
        expect(expiry).toEqual(expectedDate);
      });
    });
  });
});
