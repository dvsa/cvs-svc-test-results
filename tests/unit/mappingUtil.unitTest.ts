import { MappingUtil } from "../../src/utils";
import * as models from "../../src/models";
import * as enums from "../../src/assets/Enums";
import dateMockUtils from "../util/dateMockUtils";

describe("setCreatedAtAndLastUpdatedAtDates", () => {
  const mockDate = "2020-02-01T10:00:00.000Z";
  beforeAll(() => {
    dateMockUtils.setupDateMock(mockDate);
  });
  afterAll(() => {
    dateMockUtils.restoreDateMock();
  });

  it("should set the audit details", () => {
    const payload = MappingUtil.setCreatedAtAndLastUpdatedAtDates({
      testerStaffId: "foo",
      testerName: "bar",
      testTypes: [{}],
    } as models.ITestResultPayload);
    expect(payload.createdAt).toEqual(mockDate);
    expect(payload.testVersion).toEqual(enums.TEST_VERSION.CURRENT);
    expect(payload.createdById).toEqual("foo");
    expect(payload.createdByName).toEqual("bar");
    expect(payload.reasonForCreation).toEqual(
      enums.REASON_FOR_CREATION.TEST_CONDUCTED
    );
    expect(payload.testTypes[0].createdAt).toEqual(mockDate);
    expect(payload.testTypes[0].lastUpdatedAt).toEqual(mockDate);
  });

  it("should set the audit details for contingency test", () => {
    const payload = MappingUtil.setCreatedAtAndLastUpdatedAtDates({
      testerStaffId: "foo",
      testerName: "bar",
      createdByName: "john",
      reasonForCreation: "foobar",
      createdById: "1234",
      typeOfTest: "contingency",
      testTypes: [{}],
    } as models.ITestResultPayload);
    expect(payload.createdAt).toEqual(mockDate);
    expect(payload.testVersion).toEqual(enums.TEST_VERSION.CURRENT);
    expect(payload.createdById).toEqual("1234");
    expect(payload.createdByName).toEqual("john");
    expect(payload.reasonForCreation).toEqual("foobar");
    expect(payload.testTypes[0].createdAt).toEqual(mockDate);
    expect(payload.testTypes[0].lastUpdatedAt).toEqual(mockDate);
  });
});
