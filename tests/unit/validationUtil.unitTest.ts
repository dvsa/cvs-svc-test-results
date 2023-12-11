import { ITestResult, TestType } from '../../src/models';
import { ValidationUtil } from '../../src/utils/validationUtil';

describe('validateTestTypes with desk based group 5', () => {
  it('fails validation with hgv and null certificateNumber', () => {
    const testResult = {
      testResultId: '32e9aa52-f10b-4619-bad1-044c5227f93c',
      vehicleType: 'hgv',
      typeOfTest: 'desk-based',
      source: 'vtm',
      testStatus: 'submitted',
      systemNumber: '10000001',
      testerStaffId: 'e12345650954260',
      testEndTimestamp: '2023-10-20T10:06:13.242Z',
      vehicleClass: {
        code: 'v',
        description: 'heavy goods vehicle',
      },
      noOfAxles: 1,
      numberOfWheelsDriven: null,
      regnDate: null,
      firstUseDate: null,
      createdByName: 'tester',
      createdById: 'e12345650954260',
      vehicleConfiguration: 'rigid',
      reasonForCancellation: null,
      testTypes: [
        {
          testTypeId: '441',
          name: 'Type approved tractor unit - Great Britain',
          secondaryCertificateNumber: null,
          createdAt: '2023-10-20T10:06:35.901Z',
          lastUpdatedAt: '2023-10-20T10:06:35.901Z',
          testTypeClassification: 'NON ANNUAL',
          testNumber: 'W01A00128',
          testCode: 'nft',
          testResult: 'pass',
          certificateNumber: null,
          testTypeStartTimestamp: '2023-10-20T10:06:13.242Z',
          testTypeEndTimestamp: '2023-10-20T10:06:13.242Z',
          additionalNotesRecorded: 'sdfgsdfg',
          defects: [],
          customDefects: [],
        },
      ],
      vin: 'ASDFGHJKL',
      countryOfRegistration: 'a',
      euVehicleCategory: 'm2',
      preparerName: 'asdfu',
      preparerId: 'gfdsf',
      testStartTimestamp: '2023-10-20T10:06:13.242Z',
      createdAt: '2023-10-20T10:29:29.343Z',
      testStationName: 'place',
      testStationPNumber: '14-7160003',
      testStationType: 'hq',
      testerName: 'tester',
      testerEmailAddress: 'user@test.com',
      reasonForCreation: 'sdfgh',
    } as unknown as ITestResult;
    const expected = ValidationUtil.validateTestTypes(testResult);

    expect(expected).toEqual(['"certificateNumber" must be a string']);
  });
});
describe('validateTestTypes with desk based group 4', () => {
  it('passes validation with a trl and null certificateNumber', () => {
    const testResult = {
      testResultId: '32e9aa52-f10b-4619-bad1-044c5227f93c',
      vehicleType: 'trl',
      typeOfTest: 'desk-based',
      source: 'vtm',
      testStatus: 'submitted',
      systemNumber: '10000001',
      testerStaffId: 'e12345650954260',
      testEndTimestamp: '2023-10-20T10:06:13.242Z',
      vehicleClass: {
        code: 't',
        description: 'trailer',
      },
      noOfAxles: 1,
      numberOfWheelsDriven: null,
      regnDate: null,
      firstUseDate: null,
      createdByName: 'tester',
      createdById: 'e12345650954260',
      vehicleConfiguration: 'rigid',
      reasonForCancellation: null,
      testTypes: [
        {
          testTypeId: '425',
          name: 'VTG10 Notifiable Alteration with MR only',
          secondaryCertificateNumber: null,
          createdAt: '2023-10-20T10:06:35.901Z',
          lastUpdatedAt: '2023-10-20T10:06:35.901Z',
          testTypeClassification: 'NON ANNUAL',
          testNumber: 'W01A00128',
          testCode: 'nft',
          testResult: 'pass',
          certificateNumber: null,
          testTypeStartTimestamp: '2023-10-20T10:06:13.242Z',
          testTypeEndTimestamp: '2023-10-20T10:06:13.242Z',
          additionalNotesRecorded: 'sdfgsdfg',
          defects: [],
          customDefects: [],
        },
      ],
      vin: 'ASDFGHJKL',
      trailerId: '123456',
      countryOfRegistration: 'a',
      euVehicleCategory: 'm2',
      preparerName: 'asdfu',
      preparerId: 'gfdsf',
      testStartTimestamp: '2023-10-20T10:06:13.242Z',
      createdAt: '2023-10-20T10:29:29.343Z',
      testStationName: 'place',
      testStationPNumber: '14-7160003',
      testStationType: 'hq',
      testerName: 'tester',
      testerEmailAddress: 'user@test.com',
      reasonForCreation: 'sdfgh',
    } as unknown as ITestResult;
    const expected = ValidationUtil.validateTestTypes(testResult);

    expect(expected).toEqual([]);
  });
  it('fails validation with psv and null certificateNumber', () => {
    const testResult = {
      testResultId: '32e9aa52-f10b-4619-bad1-044c5227f93c',
      vehicleType: 'psv',
      typeOfTest: 'desk-based',
      source: 'vtm',
      testStatus: 'submitted',
      systemNumber: '10000001',
      testerStaffId: 'e12345650954260',
      testEndTimestamp: '2023-10-20T10:06:13.242Z',
      vehicleClass: {
        code: 't',
        description: 'trailer',
      },
      noOfAxles: 1,
      numberOfWheelsDriven: null,
      regnDate: null,
      firstUseDate: null,
      createdByName: 'tester',
      createdById: 'e12345650954260',
      vehicleConfiguration: 'rigid',
      reasonForCancellation: null,
      testTypes: [
        {
          testTypeId: '425',
          name: 'VTG10 Notifiable Alteration with MR only',
          secondaryCertificateNumber: null,
          createdAt: '2023-10-20T10:06:35.901Z',
          lastUpdatedAt: '2023-10-20T10:06:35.901Z',
          testTypeClassification: 'NON ANNUAL',
          testNumber: 'W01A00128',
          testCode: 'nft',
          testResult: 'pass',
          certificateNumber: null,
          testTypeStartTimestamp: '2023-10-20T10:06:13.242Z',
          testTypeEndTimestamp: '2023-10-20T10:06:13.242Z',
          additionalNotesRecorded: 'sdfgsdfg',
          defects: [],
          customDefects: [],
        },
      ],
      vin: 'ASDFGHJKL',
      countryOfRegistration: 'a',
      euVehicleCategory: 'm2',
      preparerName: 'asdfu',
      preparerId: 'gfdsf',
      testStartTimestamp: '2023-10-20T10:06:13.242Z',
      createdAt: '2023-10-20T10:29:29.343Z',
      testStationName: 'place',
      testStationPNumber: '14-7160003',
      testStationType: 'hq',
      testerName: 'tester',
      testerEmailAddress: 'user@test.com',
      reasonForCreation: 'sdfgh',
    } as unknown as ITestResult;
    const expected = ValidationUtil.validateTestTypes(testResult);

    expect(expected).toEqual([
      '"certificateNumber" must be a string',
      '"secondaryCertificateNumber" must be a string',
    ]);
  });
});

describe('validateTestTypes with desk based group 3', () => {
  it('should pass validation with a certificate number', () => {
    const testResult = {
      testResultId: '32e9aa52-f10b-4619-bad1-044c5227f93c',
      vehicleType: 'psv',
      typeOfTest: 'desk-based',
      source: 'vtm',
      testStatus: 'submitted',
      systemNumber: '10000001',
      testerStaffId: 'e12345650954260',
      testEndTimestamp: '2023-10-20T10:06:13.242Z',
      vehicleClass: {
        code: 't',
        description: 'trailer',
      },
      noOfAxles: 1,
      numberOfWheelsDriven: null,
      regnDate: null,
      firstUseDate: null,
      createdByName: 'tester',
      createdById: 'e12345650954260',
      vehicleConfiguration: 'rigid',
      reasonForCancellation: null,
      testTypes: [
        {
          testTypeId: '420',
          name: 'VTG10 Notifiable Alteration with MR only',
          secondaryCertificateNumber: null,
          createdAt: '2023-10-20T10:06:35.901Z',
          lastUpdatedAt: '2023-10-20T10:06:35.901Z',
          testTypeClassification: 'NON ANNUAL',
          testNumber: 'W01A00128',
          testCode: 'nft',
          testResult: 'pass',
          certificateNumber: '1234',
          testTypeStartTimestamp: '2023-10-20T10:06:13.242Z',
          testTypeEndTimestamp: '2023-10-20T10:06:13.242Z',
          additionalNotesRecorded: 'sdfgsdfg',
          defects: [],
          customDefects: [],
          testExpiryDate: '2023-10-20T10:06:35.901Z',
        },
      ],
      vin: 'ASDFGHJKL',
      countryOfRegistration: 'a',
      euVehicleCategory: 'm2',
      preparerName: 'asdfu',
      preparerId: 'gfdsf',
      testStartTimestamp: '2023-10-20T10:06:13.242Z',
      createdAt: '2023-10-20T10:29:29.343Z',
      testStationName: 'place',
      testStationPNumber: '14-7160003',
      testStationType: 'hq',
      testerName: 'tester',
      testerEmailAddress: 'user@test.com',
      reasonForCreation: 'sdfgh',
    } as unknown as ITestResult;
    const result = ValidationUtil.validateTestTypes(testResult);
    expect(result).toEqual([]);
  });
  it('should fail validation without certificateNumber', () => {
    const testResult = {
      testResultId: '32e9aa52-f10b-4619-bad1-044c5227f93c',
      vehicleType: 'psv',
      typeOfTest: 'desk-based',
      source: 'vtm',
      testStatus: 'submitted',
      systemNumber: '10000001',
      testerStaffId: 'e12345650954260',
      testEndTimestamp: '2023-10-20T10:06:13.242Z',
      vehicleClass: {
        code: 't',
        description: 'trailer',
      },
      noOfAxles: 1,
      numberOfWheelsDriven: null,
      regnDate: null,
      firstUseDate: null,
      createdByName: 'tester',
      createdById: 'e12345650954260',
      vehicleConfiguration: 'rigid',
      reasonForCancellation: null,
      testTypes: [
        {
          testTypeId: '420',
          name: 'VTG10 Notifiable Alteration with MR only',
          secondaryCertificateNumber: null,
          createdAt: '2023-10-20T10:06:35.901Z',
          lastUpdatedAt: '2023-10-20T10:06:35.901Z',
          testTypeClassification: 'NON ANNUAL',
          testNumber: 'W01A00128',
          testCode: 'nft',
          testResult: 'pass',
          testTypeStartTimestamp: '2023-10-20T10:06:13.242Z',
          testTypeEndTimestamp: '2023-10-20T10:06:13.242Z',
          additionalNotesRecorded: 'sdfgsdfg',
          defects: [],
          customDefects: [],
          testExpiryDate: '2023-10-20T10:06:35.901Z',
        },
      ],
      vin: 'ASDFGHJKL',
      countryOfRegistration: 'a',
      euVehicleCategory: 'm2',
      preparerName: 'asdfu',
      preparerId: 'gfdsf',
      testStartTimestamp: '2023-10-20T10:06:13.242Z',
      createdAt: '2023-10-20T10:29:29.343Z',
      testStationName: 'place',
      testStationPNumber: '14-7160003',
      testStationType: 'hq',
      testerName: 'tester',
      testerEmailAddress: 'user@test.com',
      reasonForCreation: 'sdfgh',
    } as unknown as ITestResult;
    const result = ValidationUtil.validateTestTypes(testResult);
    expect(result).toEqual(['"certificateNumber" is required']);
  });

  describe('Is IVA test', () => {
    it('Should return true if given 1 IVA test', () => {
      const tests = [{ testTypeId: '125' }] as unknown as TestType[];

      const result = (ValidationUtil as any).isIvaTest(tests);

      expect(result).toBeTruthy();
    });
    it('Should return true if given 2 IVA tests', () => {
      const tests = [
        { testTypeId: '125' },
        { testTypeId: '126' },
      ] as unknown as TestType[];

      const result = (ValidationUtil as any).isIvaTest(tests);

      expect(result).toBeTruthy();
    });
    it('Should return false if given 1 non-IVA test', () => {
      const tests = [{ testTypeId: '94' }] as unknown as TestType[];

      const result = (ValidationUtil as any).isIvaTest(tests);

      expect(result).toBeFalsy();
    });
    it('Should return false if given 2 non-IVA tests', () => {
      const tests = [
        { testTypeId: '94' },
        { testTypeId: '95' },
      ] as unknown as TestType[];

      const result = (ValidationUtil as any).isIvaTest(tests);

      expect(result).toBeFalsy();
    });
    it('Should return false if given 1 IVA and 1 non-IVA test', () => {
      const tests = [
        { testTypeId: '94' },
        { testTypeId: '126' },
      ] as unknown as TestType[];

      const result = (ValidationUtil as any).isIvaTest(tests);

      expect(result).toBeFalsy();
    });
  });
});
