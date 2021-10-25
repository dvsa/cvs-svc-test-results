import { cloneDeep } from "lodash";
import testResults from "../../resources/test-results.json";
import { PsvMostRecentExpiryStrategy } from "../../../src/handlers/expiry/strategies/PsvMostRecentExpiryStrategy";
import { StrategyMock } from "../../util/expiryStrategyUtil";
import { TEST_RESULT } from "../../../src/assets/Enums";
import { TestType } from "../../../src/models/ITestResult";

describe("For PsvMostRecentExpiryStrategy", () => {
  let testResultsMockDB: any;
  let psvMostRecentExpiryStrategy: PsvMostRecentExpiryStrategy;

  beforeEach(() => {
    testResultsMockDB = cloneDeep(testResults);
  });

  afterEach(() => {
    // reset date to current date
    psvMostRecentExpiryStrategy.dateProvider.setTestDate(new Date());
  });

  context("for psv vehicle type", () => {
    describe("test psvMostRecentExpiryStrategy with multiple scenarios", () => {
      test.each`
      inputRecentExpiryDate | inputTestDate   | ExpectedExpiryDate
      ${"2020-07-28"}       | ${"2020-05-28"} | ${"2021-05-27"}
      ${"2020-07-28"}       | ${"2020-05-29"} | ${"2021-07-28"}

      `("The expiry Date $ExpectedExpiryDate is calculated given a test date of $inputTestDate and a recent expiry date of $inputRecentExpiryDate",
       ({inputRecentExpiryDate, inputTestDate, ExpectedExpiryDate}) => {
        const psvTestResult = cloneDeep(testResultsMockDB[4]);
        psvTestResult.testTypes.forEach((type: TestType) => {
          type.testTypeId = "1";
          type.testResult = TEST_RESULT.PASS;
        });

        psvMostRecentExpiryStrategy = StrategyMock.setupStrategy(
          psvTestResult,
          inputRecentExpiryDate,
          new Date(inputTestDate)
          );

        expect(psvMostRecentExpiryStrategy.getExpiryDate()).toEqual(new Date(ExpectedExpiryDate).toISOString());
        });
      });
  });
});
