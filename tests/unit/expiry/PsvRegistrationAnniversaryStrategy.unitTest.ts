import { cloneDeep } from "lodash";
import testResults from "../../resources/test-results.json";
import { TEST_RESULT } from "../../../src/assets/Enums";
import { DateProvider } from "../../../src/handlers/expiry/providers/DateProvider";
import { PsvRegistrationAnniversaryStrategy } from "../../../src/handlers/expiry/strategies/PsvRegistrationAnniversaryStrategy";
import { StrategyMock } from "../../util/expiryStrategyUtil";
import { TestType } from "../../../src/models/ITestResult";

describe("For PsvRegistrationAnniversaryStrategy", () => {
  let testResultsMockDB: any;
  let psvRegistrationAnniversaryStrategy: PsvRegistrationAnniversaryStrategy;

  beforeEach(() => {
    testResultsMockDB = cloneDeep(testResults);
  });

  afterEach(() => {
    // reset date to current date
    psvRegistrationAnniversaryStrategy.dateProvider.setTestDate(new Date());
  });

  context("for psv vehicle type", () => {
    describe("test PsvRegistrationAnniversaryStrategy with multiple scenarios", () => {
      test.each`
      inputRegistrationDate | inputTestDate   | ExpectedExpiryDate
      ${"2019-07-28"}       | ${"2020-05-28"} | ${"2021-05-27"}
      ${"2019-07-28"}       | ${"2020-05-29"} | ${"2021-07-28"}

      `("The expiry Date $ExpectedExpiryDate is calculated given a test date of $inputTestDate and a registration date of $inputRegistrationDate",
       ({inputRegistrationDate, inputTestDate, ExpectedExpiryDate}) => {
        const psvTestResult = cloneDeep(testResultsMockDB[4]);
        psvTestResult.testTypes.forEach((type: TestType) => {
          type.testTypeId = "1";
          type.testResult = TEST_RESULT.PASS;
        });
        psvTestResult.regnDate = inputRegistrationDate;
        psvRegistrationAnniversaryStrategy = StrategyMock.setupStrategy(
          psvTestResult,
          DateProvider.getEpoc(),
          new Date(inputTestDate)
          );

        expect(psvRegistrationAnniversaryStrategy.getExpiryDate()).toEqual(new Date(ExpectedExpiryDate).toISOString());
        });
      });
  });
});
