import { cloneDeep } from "lodash";
import testResults from "../../resources/test-results.json";
import { TEST_RESULT } from "../../../src/assets/Enums";
import { DateProvider } from "../../../src/handlers/expiry/providers/DateProvider";
import { PsvDefaultExpiryStrategy } from "../../../src/handlers/expiry/strategies/PsvDefaultExpiryStrategy";
import { StrategyMock } from "../../util/expiryStrategyUtil";
import { TestType } from "../../../src/models/ITestResult";

describe("For PsvRegistrationAnniversaryStrategy", () => {
  let testResultsMockDB: any;
  let psvDefaultExpiryStrategy: PsvDefaultExpiryStrategy;

  beforeEach(() => {
    testResultsMockDB = cloneDeep(testResults);
  });

  afterEach(() => {
    // reset date to current date
    psvDefaultExpiryStrategy.dateProvider.setTestDate(new Date());
  });

  context("for psv vehicle type", () => {
    describe("test psvDefaultExpiryStrategy with multiple scenarios", () => {
      test.each`
      inputRecentExpiryDate | inputTestDate   | ExpectedExpiryDate
      ${undefined}          | ${"2019-11-04"} | ${"2020-11-03"}


      `("The expiry Date $ExpectedExpiryDate is calculated given a test date of $inputTestDate and a recent expiry date of $inputRecentExpiryDate",
       ({inputRecentExpiryDate, inputTestDate, ExpectedExpiryDate}) => {
        const psvTestResult = cloneDeep(testResultsMockDB[4]);
        psvTestResult.testTypes.forEach((type: TestType) => {
          type.testTypeId = "142";
          type.testResult = TEST_RESULT.PASS;
        });
        psvTestResult.regnDate = undefined;
        psvDefaultExpiryStrategy = StrategyMock.setupStrategy(
          psvTestResult,
          inputRecentExpiryDate,
          new Date(inputTestDate)
          );

        expect(psvDefaultExpiryStrategy.getExpiryDate()).toEqual(new Date(ExpectedExpiryDate).toISOString());
        });
      });
  });
});
