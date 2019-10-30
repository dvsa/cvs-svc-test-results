import {GetTestResults} from "../../src/utils/GetTestResults";

describe("GetTestResult Util functions", () => {
  describe("filterTestResultsByParam", () => {
    it("filters passed object based on passed param having the passed value", () => {
      const myObject = [
        {
          param1: "thing"
        },
        {
          param1: "something else"
        }
      ];
      const result = GetTestResults.filterTestResultsByParam(myObject, "param1", "thing");
      expect(result).toEqual([{param1: "thing"}]);
    });
  });
});
