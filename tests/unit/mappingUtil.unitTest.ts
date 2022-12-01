import { MappingUtil } from '../../src/utils';
import * as models from '../../src/models';
import * as enums from '../../src/assets/Enums';
import dateMockUtils from '../util/dateMockUtils';

describe('setCreatedAtAndLastUpdatedAtDates', () => {
  const mockDate = '2020-02-01T10:00:00.000Z';
  beforeAll(() => {
    dateMockUtils.setupDateMock(mockDate);
  });
  afterAll(() => {
    dateMockUtils.restoreDateMock();
  });

  it('should set the audit details', () => {
    const payload = MappingUtil.setCreatedAtAndLastUpdatedAtDates({
      testerStaffId: 'foo',
      testerName: 'bar',
      testTypes: [{}],
    } as models.ITestResultPayload);
    expect(payload.createdAt).toEqual(mockDate);
    expect(payload.testVersion).toEqual(enums.TEST_VERSION.CURRENT);
    expect(payload.createdById).toBe('foo');
    expect(payload.createdByName).toBe('bar');
    expect(payload.reasonForCreation).toEqual(
      enums.REASON_FOR_CREATION.TEST_CONDUCTED,
    );
    expect(payload.testTypes[0].createdAt).toEqual(mockDate);
    expect(payload.testTypes[0].lastUpdatedAt).toEqual(mockDate);
  });

  it('should set the audit details for contingency test', () => {
    const payload = MappingUtil.setCreatedAtAndLastUpdatedAtDates({
      testerStaffId: 'foo',
      testerName: 'bar',
      createdByName: 'john',
      reasonForCreation: 'foobar',
      createdById: '1234',
      typeOfTest: enums.TYPE_OF_TEST.CONTINGENCY,
      testTypes: [{}],
    } as models.ITestResultPayload);
    expect(payload.createdAt).toEqual(mockDate);
    expect(payload.testVersion).toEqual(enums.TEST_VERSION.CURRENT);
    expect(payload.createdById).toBe('1234');
    expect(payload.createdByName).toBe('john');
    expect(payload.reasonForCreation).toBe('foobar');
    expect(payload.testTypes[0].createdAt).toEqual(mockDate);
    expect(payload.testTypes[0].lastUpdatedAt).toEqual(mockDate);
  });

  it('should set the audit details for contingency test', () => {
    const payload = MappingUtil.setCreatedAtAndLastUpdatedAtDates({
      testerStaffId: 'foo',
      testerName: 'bar',
      createdByName: 'john',
      reasonForCreation: '',
      createdById: '1234',
      typeOfTest: enums.TYPE_OF_TEST.DESK_BASED,
      testTypes: [{}],
    } as models.ITestResultPayload);
    expect(payload.createdAt).toEqual(mockDate);
    expect(payload.testVersion).toEqual(enums.TEST_VERSION.CURRENT);
    expect(payload.createdById).toBe('1234');
    expect(payload.createdByName).toBe('john');
    expect(payload.reasonForCreation).toEqual(
      enums.REASON_FOR_CREATION.TEST_CONDUCTED,
    );
    expect(payload.testTypes[0].createdAt).toEqual(mockDate);
    expect(payload.testTypes[0].lastUpdatedAt).toEqual(mockDate);
  });
});
