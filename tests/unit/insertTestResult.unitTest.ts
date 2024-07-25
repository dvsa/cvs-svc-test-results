import fs from 'fs';
import { cloneDeep } from 'lodash';
import path from 'path';
import { CENTRAL_DOCS_TEST } from '@dvsa/cvs-microservice-common/classes/testTypes/Constants';
import {
  ERRORS,
  MESSAGES,
  TESTING_ERRORS,
  TEST_RESULT,
  TEST_STATUS,
  VEHICLE_TYPES,
} from '../../src/assets/Enums';
import { HTTPResponse, TestType } from '../../src/models';
import { HTTPError } from '../../src/models/HTTPError';
import { ITestResultPayload } from '../../src/models/ITestResultPayload';
import { TestResultsService } from '../../src/services/TestResultsService';
import { ValidationUtil } from '../../src/utils/validationUtil';

describe('insertTestResult', () => {
  const baseMockTestResultsDAO = {
    createSingle: () => Promise.resolve(Array.of()),
    createTestNumber: () =>
      Promise.resolve({
        testNumber: 'W01A00209',
        id: 'W01',
        certLetter: 'A',
        sequenceNumber: '002',
      }),
    getTestCodesAndClassificationFromTestTypes: () =>
      Promise.resolve({
        linkedTestCode: null,
        defaultTestCode: 'yf4',
        testTypeClassification: 'Annual NO CERTIFICATE',
      }),
  };
  const extendMockTestResultsDAO = (additionalMockedFunctions: {
    [key: string]: () => any;
  }) =>
    jest.fn().mockImplementation(() => ({
      ...baseMockTestResultsDAO,
      ...additionalMockedFunctions,
    }));

  let testResultsService: TestResultsService | any;
  let MockTestResultsDAO: jest.Mock;
  let testResultsMockDB: any;
  let testResultsPostMock: any;

  beforeEach(() => {
    testResultsMockDB = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../resources/test-results.json'),
        'utf8',
      ),
    );
    testResultsPostMock = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../resources/test-results-post.json'),
        'utf8',
      ),
    );
    MockTestResultsDAO = jest.fn().mockImplementation(() => ({}));
    testResultsService = new TestResultsService(new MockTestResultsDAO());
  });

  afterEach(() => {
    testResultsMockDB = null;
    testResultsService = null;
    MockTestResultsDAO.mockReset();
  });

  context('when inserting an empty test result', () => {
    it('should throw a validation error', () => {
      testResultsService = new TestResultsService(new MockTestResultsDAO());
      const mockData: ITestResultPayload | any = {};

      expect.assertions(3);
      return testResultsService
        .insertTestResult(mockData)
        .catch((error: { statusCode: any; body: { errors: any[] } }) => {
          expect(error).toBeInstanceOf(HTTPError);
          expect(error.statusCode).toBe(400);
          expect(error.body).toEqual(ERRORS.PayloadCannotBeEmpty);
        });
    });
  });

  context(
    'when inserting a submitted testResult without certificateNumber on lec',
    () => {
      it('should return 400-Bad request', () => {
        const mockData = testResultsMockDB[2];
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          insertTestResult: () => Promise.resolve(Array.of(mockData)),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());
        for (const testType of mockData.testTypes) {
          delete testType.testCode;
          delete testType.testNumber;
          delete testType.lastUpdatedAt;
          delete testType.testAnniversaryDate;
          delete testType.createdAt;
          delete testType.testExpiryDate;
          delete testType.certificateLink;
        }
        delete mockData.vehicleId;
        expect.assertions(1);
        return testResultsService
          .insertTestResult(mockData)
          .catch((error: any) => {
            expect(error).toBeDefined();
          });
      });
    },
  );
  context(
    'when inserting a submitted, passing testResult without certificateNumber on TIR  type',
    () => {
      it('should return 400-Bad request', () => {
        const mockData = cloneDeep(testResultsMockDB[17]);
        mockData.testTypes[0].testTypeId = '49';
        MockTestResultsDAO = jest.fn();
        testResultsService = new TestResultsService(new MockTestResultsDAO());
        expect.assertions(2);
        return testResultsService
          .insertTestResult(mockData)
          .catch((error: any) => {
            expect(error.body).toBe(
              'Certificate number not present on TIR test type',
            );
            expect(error.statusCode).toBe(400);
          });
      });
    },
  );

  context(
    'when inserting a submitted testResult with fields null for advisory deficiency category',
    () => {
      it('should return a 400 error', () => {
        const mockData = testResultsMockDB[4];
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          insertTestResult: () =>
            Promise.resolve({
              Items: Array.of(mockData),
              Count: 1,
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        for (const testType of mockData.testTypes) {
          delete testType.testCode;
          delete testType.testNumber;
          delete testType.lastUpdatedAt;
          delete testType.testAnniversaryDate;
          delete testType.createdAt;
          delete testType.testExpiryDate;
          delete testType.certificateLink;
        }
        delete mockData.vehicleId;

        expect.assertions(2);
        return testResultsService
          .insertTestResult(mockData)
          .catch((error: { statusCode: any; body: any }) => {
            expect(error.statusCode).toBe(400);
            expect(error.body).toEqual(TESTING_ERRORS.NoDeficiencyCategory);
          });
      });
    },
  );

  context('when database is down', () => {
    it('should throw an internal server error', () => {
      const mockData = testResultsMockDB[0];
      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        createMultiple: () => Promise.reject({}),
        getTestCodesAndClassificationFromTestTypes: () =>
          Promise.resolve({
            linkedTestCode: 'wde',
            defaultTestCode: 'bde',
            testTypeClassification: 'Annual With Certificate',
          }),
        createTestNumber: () =>
          Promise.resolve({
            testNumber: 'W01A00209',
            id: 'W01',
            certLetter: 'A',
            sequenceNumber: '002',
          }),
      }));

      mockData.testTypes.forEach((t: any) => {
        t.certificateNumber = 'abc';
      });
      for (const testType of mockData.testTypes) {
        testType.certificateNumber = '1234';
        delete testType.testCode;
        delete testType.testNumber;
        delete testType.lastUpdatedAt;
        delete testType.testAnniversaryDate;
        delete testType.createdAt;
        delete testType.certificateLink;
        delete testType.testTypeClassification;
      }
      delete mockData.vehicleId;
      mockData.testResultId = '1';
      testResultsService = new TestResultsService(new MockTestResultsDAO());
      expect.assertions(3);
      return testResultsService
        .insertTestResult(mockData)
        .catch((error: { statusCode: any; body: any }) => {
          expect(error).toBeInstanceOf(HTTPError);
          expect(error.statusCode).toBe(500);
          expect(error.body).toEqual(MESSAGES.INTERNAL_SERVER_ERROR);
        });
    });
  });

  context('when inserting duplicate test result', () => {
    it('should return 201 - Test Result id already exists', () => {
      const mockData = testResultsMockDB[0];
      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        createTestNumber: () =>
          Promise.resolve({
            testNumber: 'W01A00209',
            id: 'W01',
            certLetter: 'A',
            sequenceNumber: '002',
          }),
        getTestCodesAndClassificationFromTestTypes: () =>
          Promise.resolve({
            linkedTestCode: 'wde',
            defaultTestCode: 'bde',
            testTypeClassification: 'Annual With Certificate',
          }),
        getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        createSingle: () =>
          Promise.reject({
            $metadata: { httpStatusCode: 400 },
            message: MESSAGES.CONDITIONAL_REQUEST_FAILED,
          }),
      }));
      testResultsService = new TestResultsService(new MockTestResultsDAO());
      mockData.testTypes.pop(); // removing the second test in the array as the mock implementation makes this record invalid
      for (const testType of mockData.testTypes) {
        testType.certificateNumber = '1234';
        delete testType.testCode;
        delete testType.testNumber;
        delete testType.lastUpdatedAt;
        delete testType.testAnniversaryDate;
        delete testType.createdAt;
        delete testType.certificateLink;
        delete testType.testTypeClassification;
      }
      delete mockData.vehicleId;
      mockData.testResultId = '1111';

      expect.assertions(3);
      return testResultsService
        .insertTestResult(mockData)
        .catch((error: { statusCode: any; body: any }) => {
          expect(error).toBeInstanceOf(HTTPResponse);
          expect(error.statusCode).toBe(201);
          expect(error.body).toBe(`"${MESSAGES.ID_ALREADY_EXISTS}"`);
        });
    });
  });

  context('when inserting a cancelled testResult', () => {
    it('should throw error 404 when reasonForAbandoning not present on all abandoned tests', () => {
      const mockData = testResultsMockDB[5];
      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        createTestNumber: () => Promise.resolve(mockData.testNumber),
        getTestCodesAndClassificationFromTestTypes: () =>
          Promise.resolve({
            linkedTestCode: 'wde',
            defaultTestCode: 'bde',
            testTypeClassification: 'Annual With Certificate',
          }),
        createSingle: () =>
          Promise.reject({
            statusCode: 400,
            message: MESSAGES.CONDITIONAL_REQUEST_FAILED,
          }),
      }));
      testResultsService = new TestResultsService(new MockTestResultsDAO());

      expect.assertions(2);
      return testResultsService
        .insertTestResult(mockData)
        .catch((error: { statusCode: any; body: any }) => {
          expect(error.statusCode).toBe(400);
          expect(error.body).toEqual(
            MESSAGES.REASON_FOR_ABANDONING_NOT_PRESENT,
          );
        });
    });
  });

  context(
    'when inserting a testResult with prohibitionIssued valid and null',
    () => {
      it('should not throw error', () => {
        const mockData = testResultsPostMock[0];
        mockData.testTypes[0].defects[0].prohibitionIssued = null;
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
          createSingle: () => Promise.resolve({ Attributes: 'It worked' }),
        }));
        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(1);
        return testResultsService
          .insertTestResult(mockData)
          .then((data: any) => {
            expect(data).toBeDefined();
          });
      });
    },
  );

  context(
    'when inserting a testResult with prohibitionIssued not present on defects',
    () => {
      it('should throw validation error', () => {
        const mockData = testResultsPostMock[0];
        mockData.testNumber = {
          testNumber: 'W01A00209',
          id: 'W01',
          certLetter: 'A',
          sequenceNumber: '002',
        };
        delete mockData.testTypes[0].defects[0].prohibitionIssued;
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(mockData),
            }),
          createTestNumber: () => Promise.resolve(mockData.testNumber),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));
        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(mockData)
          .catch((error: { statusCode: any; body: any }) => {
            expect(error.statusCode).toBe(400);
            expect(error.body).toEqual({
              errors: [
                '"testTypes[0].defects[0].prohibitionIssued" is required',
              ],
            });
          });
      });
    },
  );

  // context(
  //   "when inserting a cancelled HGV that has null values on the fields that are allowing them to be null",
  //   () => {
  //     it("should not throw error", () => {
  //       const testResult = testResultsPostMock[4];
  //       testResult.testStatus = "cancelled";
  //       testResult.odometerReading = null;
  //       testResult.odometerReadingUnits = null;
  //       testResult.countryOfRegistration = null;
  //       testResult.euVehicleCategory = null;

  //       MockTestResultsDAO = jest.fn().mockImplementation(() => {
  //         return {
  //           createSingle: () =>
  //             Promise.resolve({
  //               Attributes: Array.of(testResult),
  //             }),
  //           createTestNumber: () => {
  //             return Promise.resolve({
  //               testNumber: "W01A00209",
  //               id: "W01",
  //               certLetter: "A",
  //               sequenceNumber: "002",
  //             });
  //           },
  //           getTestCodesAndClassificationFromTestTypes: () => {
  //             return Promise.resolve({
  //               linkedTestCode: "wde",
  //               defaultTestCode: "bde",
  //               testTypeClassification: "Annual With Certificate",
  //             });
  //           },
  //         };
  //       });

  //       testResultsService = new TestResultsService(new MockTestResultsDAO());

  //       expect.assertions(1);
  //       return testResultsService
  //         .insertTestResult(testResult)
  //         .then((data: any) => {
  //           expect(data).not.toEqual(undefined);
  //         });
  //     });
  //   }
  // );

  // context(
  //   "when inserting an HGV test result with fields applicable to this vehicleType",
  //   () => {
  //     it("should not throw error", () => {
  //       const testResult = testResultsPostMock[4];
  //       testResult.testTypes.forEach((type: any) => {
  //         type.testTypeId = "95";
  //       });
  //       MockTestResultsDAO = jest.fn().mockImplementation(() => {
  //         return {
  //           createSingle: () =>
  //             Promise.resolve({
  //               Attributes: Array.of(testResultsPostMock[4]),
  //             }),
  //           createTestNumber: () => {
  //             return Promise.resolve({
  //               testNumber: "W01A00209",
  //               id: "W01",
  //               certLetter: "A",
  //               sequenceNumber: "002",
  //             });
  //           },
  //           getTestCodesAndClassificationFromTestTypes: () => {
  //             return Promise.resolve({
  //               linkedTestCode: "wde",
  //               defaultTestCode: "bde",
  //               testTypeClassification: "Annual With Certificate",
  //             });
  //           },
  //           getBySystemNumber: (systemNumber: any) => Promise.resolve({}),
  //         };
  //       });

  //       testResultsService = new TestResultsService(new MockTestResultsDAO());

  //       expect.assertions(1);
  //       return testResultsService
  //         .insertTestResult(testResult)
  //         .then((insertedTestResult: any) => {
  //           expect(insertedTestResult).not.toEqual(undefined);
  //         });
  //     });
  //   }
  // );

  context('when inserting an HGV with fields corresponding to a PSV', () => {
    it('should throw 400', () => {
      const testResult = testResultsPostMock[2];
      testResult.vehicleType = 'hgv';

      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        createSingle: () =>
          Promise.resolve({
            Attributes: Array.of(testResultsPostMock[2]),
          }),
        createTestNumber: () =>
          Promise.resolve({
            testNumber: 'W01A00209',
            id: 'W01',
            certLetter: 'A',
            sequenceNumber: '002',
          }),
        getTestCodesAndClassificationFromTestTypes: () =>
          Promise.resolve({
            linkedTestCode: 'wde',
            defaultTestCode: 'bde',
            testTypeClassification: 'Annual With Certificate',
          }),
      }));

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      expect.assertions(2);
      return testResultsService
        .insertTestResult(testResult)
        .catch((error: { statusCode: any; body: any }) => {
          expect(error).toBeInstanceOf(HTTPError);
          expect(error.statusCode).toBe(400);
        });
    });
  });

  context(
    'when inserting an TRL test result with fields applicable to this vehicleType',
    () => {
      it('should not throw error', () => {
        const testResult = { ...testResultsPostMock[5] };
        testResult.testTypes.forEach((type: any) => {
          type.testTypeId = '95';
        });
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[5]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(1);
        return testResultsService
          .insertTestResult(testResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult).toBeDefined();
          });
      });
    },
  );

  context('when inserting a TRL with fields corresponding to a PSV', () => {
    it('should throw 400', () => {
      const testResult = testResultsPostMock[2];
      testResult.vehicleType = 'trl';

      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        createSingle: () =>
          Promise.resolve({
            Attributes: Array.of(testResultsPostMock[2]),
          }),
        createTestNumber: () =>
          Promise.resolve({
            testNumber: 'W01A00209',
            id: 'W01',
            certLetter: 'A',
            sequenceNumber: '002',
          }),
        getTestCodesAndClassificationFromTestTypes: () =>
          Promise.resolve({
            linkedTestCode: 'wde',
            defaultTestCode: 'bde',
            testTypeClassification: 'Annual With Certificate',
          }),
      }));

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      expect.assertions(2);
      return testResultsService
        .insertTestResult(testResult)
        .catch((error: { statusCode: any; body: any }) => {
          expect(error).toBeInstanceOf(HTTPError);
          expect(error.statusCode).toBe(400);
        });
    });
  });

  context(
    'when inserting a submitted HGV that has null values on the fields that should be allowed null only when cancelled',
    () => {
      it('should throw 400', () => {
        const testResult = testResultsPostMock[4];
        testResult.odometerReading = null;
        testResult.odometerReadingUnits = null;
        testResult.countryOfRegistration = null;
        testResult.euVehicleCategory = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[4]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResult)
          .catch((error: { statusCode: any; body: any }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
          });
      });
    },
  );

  context(
    'when inserting a cancelled TRL that has null values on the fields that are allowing them to be null',
    () => {
      it('should not throw error', () => {
        const testResult = { ...testResultsPostMock[5] };
        testResult.testStatus = 'cancelled';
        testResult.countryOfRegistration = null;
        testResult.euVehicleCategory = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[5]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(1);
        return testResultsService
          .insertTestResult(testResult)
          .then((data: any) => {
            expect(data).toBeDefined();
          });
      });
    },
  );

  context(
    'when inserting a submitted TRL that has null values on the fields that should be allowed null only when cancelled',
    () => {
      it('should throw 400', () => {
        const testResult = { ...testResultsPostMock[5] };
        testResult.odometerReading = null;
        testResult.odometerReadingUnits = null;
        testResult.countryOfRegistration = null;
        testResult.euVehicleCategory = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[5]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResult)
          .catch((error: { statusCode: any; body: any }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
          });
      });
    },
  );

  context(
    'when inserting a submitted HGV that has null values on the fields that should be allowed null only when cancelled',
    () => {
      it('should throw 400', () => {
        const testResult = testResultsPostMock[4];
        testResult.odometerReading = null;
        testResult.odometerReadingUnits = null;
        testResult.countryOfRegistration = null;
        testResult.euVehicleCategory = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[4]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResult)
          .catch((error: { statusCode: any; body: any }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
          });
      });
    },
  );

  context(
    'when inserting a cancelled TRL with fields corresponding to a submitted TRL(reasonForCancelletion = null)',
    () => {
      it('should return 200', () => {
        const testResult = { ...testResultsPostMock[5] };
        testResult.testStatus = 'cancelled';
        testResult.reasonForCancellation = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[5]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(1);
        return testResultsService
          .insertTestResult(testResult)
          .then((data: any) => {
            expect(data).toBeDefined();
          });
      });
    },
  );

  context(
    'when inserting a TRL with vehicleConfiguration centre axle drawbar',
    () => {
      it('should not throw error', () => {
        const testResult = { ...testResultsPostMock[5] };
        testResult.vehicleConfiguration = 'centre axle drawbar';
        testResult.testTypes.forEach((type: any) => {
          type.testTypeId = '95';
        });
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[5]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(1);
        return testResultsService
          .insertTestResult(testResult)
          .then((data: any) => {
            expect(data).toBeDefined();
          });
      });
    },
  );

  context(
    'when inserting a PSV with vehicleConfiguration centre axle drawbar',
    () => {
      it('should throw error 400', () => {
        const testResult = testResultsPostMock[0];
        testResult.vehicleConfiguration = 'centre axle drawbar';

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[0]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResult)
          .catch((error: { statusCode: any; body: any }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
          });
      });
    },
  );

  context(
    'when inserting a cancelled HGV that has null values on the fields that are allowing them to be null',
    () => {
      it('should not throw error', () => {
        const testResult = testResultsPostMock[4];
        testResult.testStatus = 'cancelled';
        testResult.odometerReading = null;
        testResult.odometerReadingUnits = null;
        testResult.countryOfRegistration = null;
        testResult.euVehicleCategory = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[4]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(1);
        return testResultsService
          .insertTestResult(testResult)
          .then((data: any) => {
            expect(data).toBeDefined();
          });
      });
    },
  );

  context(
    'when inserting an HGV test result with fields applicable to this vehicleType',
    () => {
      it('should not throw error', () => {
        const testResult = testResultsPostMock[4];
        testResult.testTypes.forEach((type: any) => {
          type.testTypeId = '95';
        });
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[4]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(1);
        return testResultsService
          .insertTestResult(testResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult).toBeDefined();
          });
      });
    },
  );

  context('when inserting an HGV with fields corresponding to a PSV', () => {
    it('should throw 400', () => {
      const testResult = testResultsPostMock[2];
      testResult.vehicleType = 'hgv';

      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        createSingle: () =>
          Promise.resolve({
            Attributes: Array.of(testResultsPostMock[2]),
          }),
        createTestNumber: () =>
          Promise.resolve({
            testNumber: 'W01A00209',
            id: 'W01',
            certLetter: 'A',
            sequenceNumber: '002',
          }),
        getTestCodesAndClassificationFromTestTypes: () =>
          Promise.resolve({
            linkedTestCode: 'wde',
            defaultTestCode: 'bde',
            testTypeClassification: 'Annual With Certificate',
          }),
      }));

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      expect.assertions(2);
      return testResultsService
        .insertTestResult(testResult)
        .catch((error: { statusCode: any; body: any }) => {
          expect(error).toBeInstanceOf(HTTPError);
          expect(error.statusCode).toBe(400);
        });
    });
  });

  context(
    'when inserting an TRL test result with fields applicable to this vehicleType',
    () => {
      it('should not throw error', () => {
        const testResult = { ...testResultsPostMock[5] };
        testResult.testTypes.forEach((type: any) => {
          type.testTypeId = '95';
        });
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[5]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(1);
        return testResultsService
          .insertTestResult(testResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult).toBeDefined();
          });
      });
    },
  );

  context('when inserting a TRL with fields corresponding to a PSV', () => {
    it('should throw 400', () => {
      const testResult = testResultsPostMock[2];
      testResult.vehicleType = 'trl';

      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        createSingle: () =>
          Promise.resolve({
            Attributes: Array.of(testResultsPostMock[2]),
          }),
        createTestNumber: () =>
          Promise.resolve({
            testNumber: 'W01A00209',
            id: 'W01',
            certLetter: 'A',
            sequenceNumber: '002',
          }),
        getTestCodesAndClassificationFromTestTypes: () =>
          Promise.resolve({
            linkedTestCode: 'wde',
            defaultTestCode: 'bde',
            testTypeClassification: 'Annual With Certificate',
          }),
      }));

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      expect.assertions(2);
      return testResultsService
        .insertTestResult(testResult)
        .catch((error: { statusCode: any; body: any }) => {
          expect(error).toBeInstanceOf(HTTPError);
          expect(error.statusCode).toBe(400);
        });
    });
  });

  context(
    'when inserting a submitted HGV that has null values on the fields that should be allowed null only when cancelled',
    () => {
      it('should throw 400', () => {
        const testResult = testResultsPostMock[4];
        testResult.odometerReading = null;
        testResult.odometerReadingUnits = null;
        testResult.countryOfRegistration = null;
        testResult.euVehicleCategory = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[4]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResult)
          .catch((error: { statusCode: any; body: any }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
          });
      });
    },
  );

  context(
    'when inserting a cancelled TRL that has null values on the fields that are allowing them to be null',
    () => {
      it('should not throw error', () => {
        const testResult = { ...testResultsPostMock[5] };
        testResult.testStatus = 'cancelled';
        testResult.countryOfRegistration = null;
        testResult.euVehicleCategory = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(1);
        return testResultsService
          .insertTestResult(testResult)
          .then((data: any) => {
            expect(data).toBeDefined();
          });
      });
    },
  );

  context(
    'when inserting a submitted TRL that has null values on the fields that should be allowed null only when cancelled',
    () => {
      it('should throw 400', () => {
        const testResult = { ...testResultsPostMock[5] };
        testResult.odometerReading = null;
        testResult.odometerReadingUnits = null;
        testResult.countryOfRegistration = null;
        testResult.euVehicleCategory = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[4]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResult)
          .catch((error: { statusCode: any; body: any }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
          });
      });
    },
  );

  context(
    'when inserting a submitted HGV that has null values on the fields that should be allowed null only when cancelled',
    () => {
      it('should throw 400', () => {
        const testResult = testResultsPostMock[4];
        testResult.odometerReading = null;
        testResult.odometerReadingUnits = null;
        testResult.countryOfRegistration = null;
        testResult.euVehicleCategory = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[4]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResult)
          .catch((error: { statusCode: any; body: any }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
          });
      });
    },
  );

  context(
    'when inserting a cancelled TRL with fields corresponding to a submitted TRL(reasonForCancelletion = null)',
    () => {
      it('should return 200', () => {
        const testResult = { ...testResultsPostMock[5] };
        testResult.testStatus = 'cancelled';
        testResult.reasonForCancellation = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[4]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(1);
        return testResultsService
          .insertTestResult(testResult)
          .then((data: any) => {
            expect(data).toBeDefined();
          });
      });
    },
  );
  // CVSB-7964: AC4 When inserting a test result for the submitted test with the required fields certificateNumber, expiryDate, modType, emissionStandard and fuelType populated for Pass tests

  context('when inserting an TRL test result with firstUseDate field', () => {
    it('should not throw error', () => {
      const testResult = cloneDeep(testResultsPostMock[7]);

      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        createSingle: () =>
          Promise.resolve({
            Attributes: Array.of(testResultsPostMock[7]),
          }),
        createTestNumber: () =>
          Promise.resolve({
            testNumber: 'W01A00209',
            id: 'W01',
            certLetter: 'A',
            sequenceNumber: '002',
          }),
        getTestCodesAndClassificationFromTestTypes: () =>
          Promise.resolve({
            linkedTestCode: 'wde',
            defaultTestCode: 'bde',
            testTypeClassification: 'Annual With Certificate',
          }),
        getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
      }));

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      expect.assertions(3);
      return testResultsService
        .insertTestResult(testResult)
        .then((insertedTestResult: any) => {
          expect(insertedTestResult[0].vehicleType).toBe('trl');
          expect(insertedTestResult[0].testResultId).toBe('195');
          expect(insertedTestResult[0].firstUseDate).toBe('2018-11-11');
        });
    });
  });

  context('when inserting a TRL test result with regnDate field', () => {
    it('should not throw error', () => {
      const testResult = cloneDeep(testResultsPostMock[5]);
      testResult.regnDate = '2019-10-11';
      testResult.testTypes.forEach((type: any) => {
        type.testTypeId = '95';
      });
      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        createSingle: () =>
          Promise.resolve({
            Attributes: Array.of(testResultsPostMock[5]),
          }),
        createTestNumber: () =>
          Promise.resolve({
            testNumber: 'W01A00209',
            id: 'W01',
            certLetter: 'A',
            sequenceNumber: '002',
          }),
        getTestCodesAndClassificationFromTestTypes: () =>
          Promise.resolve({
            linkedTestCode: 'wde',
            defaultTestCode: 'bde',
            testTypeClassification: 'Annual With Certificate',
          }),
        getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
      }));

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      expect.assertions(2);
      return testResultsService
        .insertTestResult(testResult)
        .then((insertedTestResult: any) => {
          expect(insertedTestResult[0].vehicleType).toBe('trl');
          expect(insertedTestResult[0].testResultId).toBe('1115');
        });
    });
  });

  context('when inserting an HGV test result with regnDate field', () => {
    it('should not throw error', () => {
      const testResult = { ...testResultsPostMock[4] };
      testResult.testTypes.forEach((type: any) => {
        type.testTypeId = '95';
      });

      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        createSingle: () =>
          Promise.resolve({
            Attributes: Array.of(testResultsPostMock[4]),
          }),
        createTestNumber: () =>
          Promise.resolve({
            testNumber: 'W01A00209',
            id: 'W01',
            certLetter: 'A',
            sequenceNumber: '002',
          }),
        getTestCodesAndClassificationFromTestTypes: () =>
          Promise.resolve({
            linkedTestCode: 'wde',
            defaultTestCode: 'bde',
            testTypeClassification: 'Annual With Certificate',
          }),
        getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
      }));

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      expect.assertions(3);
      return testResultsService
        .insertTestResult(testResult)
        .then((insertedTestResult: any) => {
          expect(insertedTestResult[0].vehicleType).toBe('hgv');
          expect(insertedTestResult[0].testResultId).toBe('1113');
          expect(insertedTestResult[0].regnDate).toBe('2018-10-10');
        });
    });
  });

  context(
    'when inserting a non-adr HGV with null expiry Date and null certificateNumber',
    () => {
      it('should not throw error', () => {
        const testResult = cloneDeep(testResultsPostMock[4]);
        testResult.testTypes.forEach((type: any) => {
          type.testTypeId = '95';
          type.testExpiryDate = null;
          type.certificateNumber = null;
        });

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[4]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('hgv');
            expect(insertedTestResult[0].testResultId).toBe('1113');
          });
      });
    },
  );

  context(
    'when inserting a non-adr TRL with null expiry Date and null certificateNumber',
    () => {
      it('should not throw error', () => {
        const testResult = cloneDeep(testResultsPostMock[5]);
        testResult.testTypes.forEach((type: any) => {
          type.testTypeId = '95';
          type.testExpiryDate = null;
          type.certificateNumber = null;
        });

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[5]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('trl');
            expect(insertedTestResult[0].testResultId).toBe('1115');
          });
      });
    },
  );

  context(
    'when inserting a cancelled adr HGV with null expiry Date and null certificateNumber',
    () => {
      it('should not throw error', () => {
        const testResult = cloneDeep(testResultsPostMock[4]);
        testResult.testTypes[0].testTypeId = '50';
        testResult.testStatus = TEST_STATUS.CANCELLED;
        testResult.testTypes[0].testExpiryDate = null;
        testResult.testTypes[0].certificateNumber = null;
        testResult.testTypes[0].centralDocs = {
          issueRequired: false,
          notes: 'notes',
          reasonsForIssue: ['issue reason'],
        };

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('hgv');
            expect(insertedTestResult[0].testResultId).toBe('1113');
          });
      });
    },
  );

  context(
    'when inserting a cancelled adr TRL with null expiry Date and null certificateNumber',
    () => {
      it('should not throw error', () => {
        const testResult = cloneDeep(testResultsPostMock[5]);
        testResult.testTypes[0].testTypeId = '50';
        testResult.testStatus = TEST_STATUS.CANCELLED;
        testResult.testTypes[0].testExpiryDate = null;
        testResult.testTypes[0].certificateNumber = null;
        testResult.testTypes[0].centralDocs = {
          issueRequired: false,
          notes: 'notes',
          reasonsForIssue: ['issue reason'],
        };

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[5]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('trl');
            expect(insertedTestResult[0].testResultId).toBe('1115');
          });
      });
    },
  );

  context('when inserting a HGV test result with firstUseDate field', () => {
    it('should not throw error', () => {
      const testResult = { ...testResultsPostMock[4] };
      testResult.firstUseDate = '2019-10-11';
      testResult.testTypes.forEach((type: any) => {
        type.testTypeId = '95';
      });
      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        createSingle: () =>
          Promise.resolve({
            Attributes: Array.of(testResultsPostMock[4]),
          }),
        createTestNumber: () =>
          Promise.resolve({
            testNumber: 'W01A00209',
            id: 'W01',
            certLetter: 'A',
            sequenceNumber: '002',
          }),
        getTestCodesAndClassificationFromTestTypes: () =>
          Promise.resolve({
            linkedTestCode: 'wde',
            defaultTestCode: 'bde',
            testTypeClassification: 'Annual With Certificate',
          }),
        getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
      }));

      testResultsService = new TestResultsService(new MockTestResultsDAO());

      expect.assertions(2);
      return testResultsService
        .insertTestResult(testResult)
        .then((insertedTestResult: any) => {
          expect(insertedTestResult[0].vehicleType).toBe('hgv');
          expect(insertedTestResult[0].testResultId).toBe('1113');
        });
    });
  });

  context(
    'when inserting a testResult that has an ADR testType with expiryDate and certificateNumber',
    () => {
      it('should not throw error', () => {
        const testResultWithAdrTestType = cloneDeep(testResultsPostMock[6]);

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[6]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: null,
              defaultTestCode: 'ddt',
              testTypeClassification: 'Annual NO CERTIFICATE',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(1);
        return testResultsService
          .insertTestResult(testResultWithAdrTestType)
          .then((data: any) => {
            expect(data).toBeDefined();
          });
      });
    },
  );

  context(
    'when inserting a testResult that has an ADR testType without expiryDate',
    () => {
      it('should throw 400 and descriptive error message', () => {
        const testResultWithAdrTestTypeWithoutExpiryDate = cloneDeep(
          testResultsPostMock[6],
        );
        delete testResultWithAdrTestTypeWithoutExpiryDate.testTypes[0]
          .testExpiryDate;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[6]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(3);
        return testResultsService
          .insertTestResult(testResultWithAdrTestTypeWithoutExpiryDate)
          .catch((error: { statusCode: any; body: any }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
            expect(error.body).toBe('Expiry date not present on ADR test type');
          });
      });
    },
  );

  context(
    'when inserting a testResult that has an ADR testType without a certificateNumber',
    () => {
      it('should throw 400 and descriptive error message', () => {
        const testResultWithAdrTestTypeWithoutExpiryDate = cloneDeep(
          testResultsPostMock[6],
        );
        delete testResultWithAdrTestTypeWithoutExpiryDate.testTypes[0]
          .certificateNumber;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultsPostMock[6]),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(3);
        return testResultsService
          .insertTestResult(testResultWithAdrTestTypeWithoutExpiryDate)
          .catch((error: { statusCode: any; body: any }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
            expect(error.body).toEqual(ERRORS.NoCertificateNumberOnAdr);
          });
      });
    },
  );

  context(
    'when inserting a testResult that has an testType other than ADR type with a certificateNumber',
    () => {
      it('then the inserted test result should set the testNumber as the certificateNumber.', () => {
        const testResultWithOtherTestTypeWithCertNum = cloneDeep(
          testResultsPostMock[6],
        );
        // Setting the testType to any other than ADR
        testResultWithOtherTestTypeWithCertNum.testTypes[0].testTypeId = '95';
        delete testResultWithOtherTestTypeWithCertNum.testTypes[0].centralDocs;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultWithOtherTestTypeWithCertNum),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResultWithOtherTestTypeWithCertNum)
          .then((insertedTestResult: any) => {
            console.log('insertedTestResult', insertedTestResult);
            expect(insertedTestResult[0].testTypes[0].testTypeId).toBe('95');
            expect(insertedTestResult[0].testTypes[0].certificateNumber).toBe(
              'W01A00209',
            );
          });
      });
    },
  );

  // CVSB-7964: AC4
  context(
    'when inserting an PSV test result for LEC test code with mandatory fields: expiryDate, modType, emissionStandard and fuelType populated for Pass tests',
    () => {
      it('test record should get created and should not throw error', () => {
        const testResultWithMandatoryFields = cloneDeep(testResultsPostMock[8]);
        testResultWithMandatoryFields.vehicleType = VEHICLE_TYPES.PSV;
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultWithMandatoryFields),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'lcp',
              defaultTestCode: 'lbp',
              testTypeClassification: 'NON ANNUAL',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());
        expect.assertions(6);
        return testResultsService
          .insertTestResult(testResultWithMandatoryFields)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('psv');
            expect(insertedTestResult[0].testTypes[0].fuelType).toBe('gas-cng');
            expect(insertedTestResult[0].testTypes[0].emissionStandard).toBe(
              '0.03 g/kWh Euro IV PM',
            );
            expect(insertedTestResult[0].testTypes[0].testExpiryDate).toBe(
              '2020-01-14',
            );
            expect(insertedTestResult[0].testTypes[0].modType.code).toBe('m');
            expect(insertedTestResult[0].testTypes[0].modType.description).toBe(
              'modification or change of engine',
            );
          });
      });
    },
  );

  context(
    'when inserting a test result for LEC test code with unacceptable value for fuelType',
    () => {
      it('should throw error', () => {
        const testResultInvalidFuelType = cloneDeep(testResultsPostMock[7]);
        // Update the fuelType to an unacceptable value
        testResultInvalidFuelType.testTypes[0].fuelType = 'gas1';

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultInvalidFuelType),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'lcp',
              defaultTestCode: 'lbp',
              testTypeClassification: 'NON ANNUAL',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(3);
        return testResultsService
          .insertTestResult(testResultInvalidFuelType)
          .catch((error: { statusCode: any; body: { errors: any[] } }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
            expect(error.body.errors[0]).toEqual(
              TESTING_ERRORS.FuelTypeInvalid,
            );
          });
      });
    },
  );

  context(
    'when inserting a test result for LEC test code with unacceptable value for emissionStandard',
    () => {
      it('should throw error', () => {
        const testResult = testResultsPostMock[9];
        const clonedTestResult = cloneDeep(testResult);
        clonedTestResult.testTypes[0].certificateNumber = '123456';
        // Update the emissionStandard to an unacceptable value
        clonedTestResult.testTypes[0].emissionStandard = 'testing';

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'lcp',
              defaultTestCode: 'lbp',
              testTypeClassification: 'NON ANNUAL',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(3);
        return (
          testResultsService
            .insertTestResult(clonedTestResult)
            // tslint:disable-next-line: no-empty
            .then((insertedTestResult: any) => {})
            .catch((error: { statusCode: any; body: { errors: any[] } }) => {
              expect(error).toBeInstanceOf(HTTPError);
              expect(error.statusCode).toBe(400);
              expect(error.body.errors[0]).toEqual(
                TESTING_ERRORS.EmissionStandardInvalid,
              );
            })
        );
      });
    },
  );

  context(
    'when inserting a test result for LEC test code with unacceptable value for modType description',
    () => {
      it('should throw error', () => {
        const testResult = testResultsPostMock[9];
        const clonedTestResult = cloneDeep(testResult);
        clonedTestResult.testTypes[0].certificateNumber = '123456';
        // Update the modType description to an unacceptable value
        clonedTestResult.testTypes[0].modType.description = 'engine change';

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'lcp',
              defaultTestCode: 'lbp',
              testTypeClassification: 'NON ANNUAL',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());
        // Update the modType description to an unacceptable value
        testResult.testTypes[0].modType.description = 'engine change';
        expect.assertions(3);
        return (
          testResultsService
            .insertTestResult(clonedTestResult)
            // tslint:disable-next-line: no-empty
            .then((insertedTestResult: any) => {})
            .catch((error: { statusCode: any; body: { errors: any[] } }) => {
              expect(error).toBeInstanceOf(HTTPError);
              expect(error.statusCode).toBe(400);
              expect(error.body.errors[0]).toEqual(
                TESTING_ERRORS.ModTypeDescriptionInvalid,
              );
            })
        );
      });
    },
  );

  context(
    'when inserting a test result for LEC test code with unacceptable value for modType code',
    () => {
      it('should throw error', () => {
        const testResult = testResultsPostMock[9];
        const clonedTestResult = cloneDeep(testResult);
        clonedTestResult.testTypes[0].certificateNumber = '123456';
        // Update the modType code to an unacceptable value
        clonedTestResult.testTypes[0].modType.code = 'e';

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'lcp',
              defaultTestCode: 'lbp',
              testTypeClassification: 'NON ANNUAL',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());
        // Update the modType code to an unacceptable value
        testResult.testTypes[0].modType.code = 'e';

        expect.assertions(3);
        return testResultsService
          .insertTestResult(clonedTestResult)
          .catch((error: { statusCode: any; body: { errors: any[] } }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
            expect(error.body.errors[0]).toBe(
              '"testTypes[0].modType.code" must be one of [p, m, g]',
            );
          });
      });
    },
  );

  context(
    'when inserting a cancelled LEC with null expiry and null certificateNumber',
    () => {
      it('should not throw error', () => {
        const testResult = testResultsPostMock[8];
        const clonedTestResult = cloneDeep(testResult);
        clonedTestResult.testTypes[0].testExpiryDate = null;
        clonedTestResult.testTypes[0].certificateNumber = null;
        clonedTestResult.testTypes[0].testResult = TEST_RESULT.ABANDONED;
        clonedTestResult.testStatus = TEST_STATUS.CANCELLED;
        delete clonedTestResult.testTypes[0].testStatus;
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'lcp',
              defaultTestCode: 'lbp',
              testTypeClassification: 'NON ANNUAL',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(clonedTestResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('psv');
            expect(insertedTestResult[0].testResultId).toBe('5');
          });
      });
    },
  );

  // CVSB-7964: AC5.1- LEC testType without sending a testExpiryDate
  context(
    "when inserting a test result for LEC test code without sending an testExpiryDate and the test status is 'pass'",
    () => {
      it('should throw error', () => {
        const testResult = testResultsPostMock[8];
        const clonedTestResult = cloneDeep(testResult);
        // Marking testExpiryDate field null for a LEC TestType
        clonedTestResult.testTypes[0].testExpiryDate = null;
        clonedTestResult.testTypes[0].testResult = 'pass';
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'lcp',
              defaultTestCode: 'lbp',
              testTypeClassification: 'NON ANNUAL',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(3);
        return (
          testResultsService
            .insertTestResult(clonedTestResult)
            // tslint:disable-next-line: no-empty
            .then((insertedTestResult: any) => {})
            .catch((error: { statusCode: any; body: { errors: string[] } }) => {
              expect(error).toBeInstanceOf(HTTPError);
              expect(error.statusCode).toBe(400);
              expect(error.body.errors[0]).toEqual(ERRORS.NoLECExpiryDate);
            })
        );
      });
    },
  );

  context(
    "when inserting a test result for LEC test code without sending a certificateNumber and the test status is 'pass'",
    () => {
      it('should throw error', () => {
        const testResult = testResultsPostMock[8];
        const clonedTestResult = cloneDeep(testResult);
        // Marking testExpiryDate field null for a LEC TestType
        clonedTestResult.testTypes[0].certificateNumber = null;
        clonedTestResult.testTypes[0].testResult = 'pass';
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'lcp',
              defaultTestCode: 'lbp',
              testTypeClassification: 'NON ANNUAL',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(3);
        return (
          testResultsService
            .insertTestResult(clonedTestResult)
            // tslint:disable-next-line: no-empty
            .then((insertedTestResult: any) => {})
            .catch((error: { statusCode: any; body: { errors: string[] } }) => {
              expect(error).toBeInstanceOf(HTTPError);
              expect(error.statusCode).toBe(400);
              expect(error.body.errors[0]).toEqual(
                ERRORS.NoCertificateNumberOnLec,
              );
            })
        );
      });
    },
  );

  // CVSB-7964: AC5.3- LEC testType without sending a modType
  context(
    "when inserting a test result for LEC test code without sending an modType and the test result 'pass'",
    () => {
      it('should throw error', () => {
        const testResult = testResultsPostMock[8];
        const clonedTestResult = cloneDeep(testResult);
        // Deleting modType field for a LEC TestType
        delete clonedTestResult.testTypes[0].modType;
        clonedTestResult.testTypes[0].testResult = 'pass';
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'lcp',
              defaultTestCode: 'lbp',
              testTypeClassification: 'NON ANNUAL',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(3);
        return (
          testResultsService
            .insertTestResult(clonedTestResult)
            // tslint:disable-next-line: no-empty
            .then((insertedTestResult: any) => {})
            .catch((error: { statusCode: any; body: { errors: string[] } }) => {
              expect(error).toBeInstanceOf(HTTPError);
              expect(error.statusCode).toBe(400);
              expect(error.body.errors[0]).toEqual(ERRORS.NoModificationType);
            })
        );
      });
    },
  );

  // CVSB-7964: AC5.4- LEC testType without sending a emissionStandard
  context(
    "when inserting a test result for LEC test code without sending an emissionStandard and the  test result is 'pass'",
    () => {
      it('should throw error', () => {
        const testResult = testResultsPostMock[8];
        const clonedTestResult = cloneDeep(testResult);
        // Deleting emissionStandard field for a LEC TestType
        delete clonedTestResult.testTypes[0].emissionStandard;
        clonedTestResult.testTypes[0].testResult = 'pass';
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'lcp',
              defaultTestCode: 'lbp',
              testTypeClassification: 'NON ANNUAL',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());
        return (
          testResultsService
            .insertTestResult(clonedTestResult)
            // tslint:disable-next-line: no-empty
            .then((insertedTestResult: any) => {})
            .catch((error: { statusCode: any; body: { errors: string[] } }) => {
              expect(error).toBeInstanceOf(HTTPError);
              expect(error.statusCode).toBe(400);
              expect(error.body.errors[0]).toEqual(ERRORS.NoEmissionStandard);
            })
        );
      });
    },
  );

  // CVSB-7964: AC5.5- LEC testType without sending a fuelType
  context(
    "when inserting a test result for LEC test code without sending an fuelType and the test result is 'pass'",
    () => {
      it('should throw error', () => {
        const testResult = testResultsPostMock[8];
        const clonedTestResult = cloneDeep(testResult);
        // Deleting fuelType field for a LEC TestType
        delete clonedTestResult.testTypes[0].fuelType;
        clonedTestResult.testTypes[0].testResult = 'pass';

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'lcp',
              defaultTestCode: 'lbp',
              testTypeClassification: 'NON ANNUAL',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(3);
        return (
          testResultsService
            .insertTestResult(clonedTestResult)
            // tslint:disable-next-line: no-empty
            .then((insertedTestResult: any) => {})
            .catch((error: { statusCode: any; body: { errors: string[] } }) => {
              console.log(error);
              expect(error).toBeInstanceOf(HTTPError);
              expect(error.statusCode).toBe(400);
              expect(error.body.errors[0]).toEqual(ERRORS.NoFuelType);
            })
        );
      });
    },
  );

  context(
    "when inserting a testResult containing 'pass' testTypes with missing mandatory fields",
    () => {
      it('should return an error containing all the missing fields', () => {
        const testResult = testResultsPostMock[0];
        const clonedTestResult: ITestResultPayload = cloneDeep(testResult);

        clonedTestResult.countryOfRegistration = null;
        clonedTestResult.euVehicleCategory = null;
        clonedTestResult.odometerReading = null;
        clonedTestResult.odometerReadingUnits = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(3);
        return testResultsService
          .insertTestResult(clonedTestResult)
          .catch((error: { statusCode: any; body: { errors: string[] } }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
            expect(error.body.errors).toEqual(
              expect.arrayContaining([
                ERRORS.CountryOfRegistrationMandatory,
                ERRORS.EuVehicleCategoryMandatory,
                ERRORS.OdometerReadingMandatory,
                ERRORS.OdometerReadingUnitsMandatory,
              ]),
            );
          });
      });
    },
  );

  context(
    "when inserting a test result for LEC test code without sending a certificateNumber and the test status is 'fail'",
    () => {
      it('should throw error', () => {
        const testResult = testResultsPostMock[8];
        const clonedTestResult = cloneDeep(testResult);
        clonedTestResult.testTypes[0].certificateNumber = null;
        clonedTestResult.testTypes[0].testResult = 'fail';
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'lcp',
              defaultTestCode: 'lbp',
              testTypeClassification: 'NON ANNUAL',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(3);
        return (
          testResultsService
            .insertTestResult(clonedTestResult)
            // tslint:disable-next-line: no-empty
            .then((insertedTestResult: any) => {})
            .catch((error: { statusCode: any; body: { errors: string[] } }) => {
              expect(error).toBeInstanceOf(HTTPError);
              expect(error.statusCode).toBe(400);
              expect(error.body).toEqual(ERRORS.NoCertificateNumberOnLec);
            })
        );
      });
    },
  );

  context(
    'when inserting a test with only abandoned testTypes and missing mandatory fields',
    () => {
      it('should insert the test correctly', () => {
        const testResult = testResultsPostMock[1];
        const clonedTestResult: ITestResultPayload = cloneDeep(testResult);

        clonedTestResult.countryOfRegistration = null;
        clonedTestResult.euVehicleCategory = null;
        clonedTestResult.odometerReading = null;
        clonedTestResult.odometerReadingUnits = null;

        clonedTestResult.testTypes[0].testResult = TEST_RESULT.ABANDONED;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(5);
        return testResultsService
          .insertTestResult(clonedTestResult)
          .then((data: any) => {
            expect(data).toBeDefined();
            expect(data[0].countryOfRegistration).toBeNull();
            expect(data[0].euVehicleCategory).toBeNull();
            expect(data[0].odometerReading).toBeNull();
            expect(data[0].odometerReadingUnits).toBeNull();
          });
      });
    },
  );

  context(
    'when inserting a testResult containing multiple testTypes (including abandoned testTypes) with missing mandatory fields',
    () => {
      it('should return an error containing only the missing fields', () => {
        const testResult = testResultsPostMock[0];
        const clonedTestResult: ITestResultPayload = cloneDeep(testResult);

        clonedTestResult.countryOfRegistration = null;
        clonedTestResult.euVehicleCategory = null;

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(3);
        return testResultsService
          .insertTestResult(clonedTestResult)
          .catch((error: { statusCode: any; body: { errors: string[] } }) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
            expect(error.body.errors).toEqual(
              expect.arrayContaining([
                ERRORS.CountryOfRegistrationMandatory,
                ERRORS.EuVehicleCategoryMandatory,
              ]),
            );
          });
      });
    },
  );

  context(
    'when inserting a testResult that is a vehicleType of hgv or trl and it contains at least one Roadworthiness test type and the test result on the Roadworthiness test type is pass',
    () => {
      it('then a testNumber is generated and the inserted test result should set the testNumber as the certificateNumber.', () => {
        const testResultWithOtherTestTypeWithCertNum = cloneDeep(
          testResultsPostMock[6],
        );
        testResultWithOtherTestTypeWithCertNum.testTypes[0].testTypeId = '122';
        delete testResultWithOtherTestTypeWithCertNum.testTypes[0].centralDocs;
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultWithOtherTestTypeWithCertNum),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: null,
              defaultTestCode: 'qjv3',
              testTypeClassification: 'Annual With Certificate',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResultWithOtherTestTypeWithCertNum)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].testTypes[0].testTypeId).toBe('122');
            expect(insertedTestResult[0].testTypes[0].certificateNumber).toBe(
              'W01A00209',
            );
          });
      });
    },
  );

  context(
    'when inserting a testResult that is a vehicleType of trl and it contains at least one Roadworthiness test type and the test result on the Roadworthiness test type is pass',
    () => {
      it('then a testNumber is generated and the inserted test result should set the testNumber as the certificateNumber.', () => {
        const testResultWithOtherTestTypeWithCertNum = cloneDeep(
          testResultsPostMock[6],
        );
        testResultWithOtherTestTypeWithCertNum.testTypes[0].testTypeId = '91';
        delete testResultWithOtherTestTypeWithCertNum.testTypes[0].centralDocs;
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(testResultWithOtherTestTypeWithCertNum),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: null,
              defaultTestCode: 'qjt1',
              testTypeClassification: 'Annual With Certificate',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(2);
        return testResultsService
          .insertTestResult(testResultWithOtherTestTypeWithCertNum)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].testTypes[0].testTypeId).toBe('91');
            expect(insertedTestResult[0].testTypes[0].certificateNumber).toBe(
              'W01A00209',
            );
          });
      });
    },
  );

  context(
    'when inserting a testResult with special characters in the VIN',
    () => {
      it('should insert the test correctly', () => {
        const testResult = testResultsPostMock[1];
        const clonedTestResult: ITestResultPayload = cloneDeep(testResult);

        clonedTestResult.vin = 'YV31ME00000 1/\\*-1';

        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(clonedTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: 'wde',
              defaultTestCode: 'bde',
              testTypeClassification: 'Annual With Certificate',
            }),
          getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        expect.assertions(1);
        return testResultsService
          .insertTestResult(clonedTestResult)
          .then((data: any) => {
            expect(data[0].vin).toBe(clonedTestResult.vin);
          });
      });
    },
  );

  context(
    'when inserting a testResult that is a vehicleType of lgv and the payload is valid',
    () => {
      it('should not throw error.', () => {
        const validLgvTestResult = cloneDeep(testResultsPostMock[11]);
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(validLgvTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: null,
              defaultTestCode: 'yf4',
              testTypeClassification: 'Annual NO CERTIFICATE',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .insertTestResult(validLgvTestResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('lgv');
            expect(insertedTestResult[0].testResultId).toBe('501');
          });
      });
    },
  );

  context(
    'when inserting a testResult that is a vehicleType of car and the payload is valid',
    () => {
      it('then it should not throw error.', () => {
        const validCarTestResult = cloneDeep(testResultsPostMock[10]);
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(validCarTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: null,
              defaultTestCode: 'yf4',
              testTypeClassification: 'Annual NO CERTIFICATE',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .insertTestResult(validCarTestResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('car');
            expect(insertedTestResult[0].testResultId).toBe('500');
          });
      });
    },
  );

  context(
    'when inserting a testResult that is a vehicleType of motorcycle and the payload is valid',
    () => {
      it('should not throw error', () => {
        const validMotorcycleTestResult = cloneDeep(testResultsPostMock[12]);
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(validMotorcycleTestResult),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: null,
              defaultTestCode: 'yf4',
              testTypeClassification: 'Annual NO CERTIFICATE',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .insertTestResult(validMotorcycleTestResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('motorcycle');
            expect(insertedTestResult[0].testResultId).toBe('502');
          });
      });
    },
  );

  context('when inserting a testResult for a motorcycle', () => {
    it('should fail if the vehicleClass is missing', () => {
      const motorcycleWithoutVehicleClass = cloneDeep(testResultsPostMock[12]);
      delete motorcycleWithoutVehicleClass.vehicleClass;

      MockTestResultsDAO = extendMockTestResultsDAO({
        createSingle: () =>
          Promise.resolve({
            Attributes: Array.of(motorcycleWithoutVehicleClass),
          }),
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      expect.assertions(3);
      return testResultsService
        .insertTestResult(motorcycleWithoutVehicleClass)
        .catch((error: any) => {
          expect(error).toBeInstanceOf(HTTPError);
          expect(error.statusCode).toBe(400);
          expect(error.body.errors).toEqual(
            expect.arrayContaining([TESTING_ERRORS.VehicleClassIsRequired]),
          );
        });
    });

    it('should fail if the vehicleClass is null', () => {
      const motorcycleWithoutVehicleClass = cloneDeep(testResultsPostMock[12]);
      motorcycleWithoutVehicleClass.vehicleClass = null;

      MockTestResultsDAO = extendMockTestResultsDAO({
        createSingle: () =>
          Promise.resolve({
            Attributes: Array.of(motorcycleWithoutVehicleClass),
          }),
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      expect.assertions(3);
      return testResultsService
        .insertTestResult(motorcycleWithoutVehicleClass)
        .catch((error: any) => {
          expect(error).toBeInstanceOf(HTTPError);
          expect(error.statusCode).toBe(400);
          expect(error.body.errors).toEqual(
            expect.arrayContaining([TESTING_ERRORS.VehicleClassInvalid]),
          );
        });
    });

    it('should fail if the vehicleClass is an object containing null values', () => {
      const motorcycleWithInvalidVehicleClass = cloneDeep(
        testResultsPostMock[12],
      );
      motorcycleWithInvalidVehicleClass.vehicleClass = {
        code: null,
        description: null,
      };

      MockTestResultsDAO = extendMockTestResultsDAO({
        createSingle: () =>
          Promise.resolve({
            Attributes: Array.of(motorcycleWithInvalidVehicleClass),
          }),
      });

      testResultsService = new TestResultsService(new MockTestResultsDAO());
      expect.assertions(3);
      return testResultsService
        .insertTestResult(motorcycleWithInvalidVehicleClass)
        .catch((error: any) => {
          expect(error).toBeInstanceOf(HTTPError);
          expect(error.statusCode).toBe(400);
          expect(error.body.errors).toEqual(
            expect.arrayContaining([TESTING_ERRORS.VehicleClassCodeIsInvalid]),
          );
        });
    });
  });

  context(
    'when inserting a testResult for a vehicle different than motorcycle',
    () => {
      it('should submit successfully is the vehicleClass is missing', () => {
        const validCarTestResult = cloneDeep(testResultsPostMock[10]);
        delete validCarTestResult.vehicleClass;
        MockTestResultsDAO = extendMockTestResultsDAO({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(validCarTestResult),
            }),
        });
        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .insertTestResult(validCarTestResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('car');
            expect(insertedTestResult[0].testResultId).toBe('500');
          });
      });

      it('should submit successfully if vehicleClass is null', () => {
        const validCarTestResult = cloneDeep(testResultsPostMock[10]);
        validCarTestResult.vehicleClass = null;
        MockTestResultsDAO = extendMockTestResultsDAO({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(validCarTestResult),
            }),
        });
        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .insertTestResult(validCarTestResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('car');
            expect(insertedTestResult[0].testResultId).toBe('500');
          });
      });

      it('should submit successfully if vehicleClass is an invalid object', () => {
        const validTestResult = cloneDeep(testResultsPostMock[0]);
        validTestResult.vehicleClass = {
          code: null,
          description: null,
        };
        MockTestResultsDAO = extendMockTestResultsDAO({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(validTestResult),
            }),
          getBySystemNumber: () => Promise.resolve([]),
        });
        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .insertTestResult(validTestResult)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('psv');
            expect(insertedTestResult[0].testResultId).toBe('1');
          });
      });
    },
  );

  context(
    'when inserting a testResult that is a vehicleType of motorcycle and the payload contains vehicleSubclass',
    () => {
      it('should throw error', () => {
        const motorCycleWithoutVehicleSubClass = cloneDeep(
          testResultsPostMock[12],
        );
        motorCycleWithoutVehicleSubClass.vehicleSubclass = ['string'];
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(motorCycleWithoutVehicleSubClass),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: null,
              defaultTestCode: 'yf4',
              testTypeClassification: 'Annual NO CERTIFICATE',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .insertTestResult(motorCycleWithoutVehicleSubClass)
          .catch((error: any) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
            expect(error.body.errors).toEqual(
              expect.arrayContaining([
                TESTING_ERRORS.VehicleSubclassIsNotAllowed,
              ]),
            );
          });
      });
    },
  );

  context(
    'when inserting a testResult that is a vehicleType of car and the payload does not contain vehicleSubclass',
    () => {
      it('should throw error', () => {
        const motorCycleWithoutVehicleSubClass = cloneDeep(
          testResultsPostMock[10],
        );
        delete motorCycleWithoutVehicleSubClass.vehicleSubclass;
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(motorCycleWithoutVehicleSubClass),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: null,
              defaultTestCode: 'yf4',
              testTypeClassification: 'Annual NO CERTIFICATE',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .insertTestResult(motorCycleWithoutVehicleSubClass)
          .catch((error: any) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
            expect(error.body.errors).toEqual(
              expect.arrayContaining([
                TESTING_ERRORS.VehicleSubclassIsRequired,
              ]),
            );
          });
      });
    },
  );

  context(
    'when inserting a testResult that is a vehicleType of car and the payload contains an invalid euVehicleCategory',
    () => {
      it('should throw error', () => {
        const motorCycleWithInvalidEuVehicleCategory = cloneDeep(
          testResultsPostMock[10],
        );
        motorCycleWithInvalidEuVehicleCategory.euVehicleCategory = 'm2';
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(motorCycleWithInvalidEuVehicleCategory),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: null,
              defaultTestCode: 'yf4',
              testTypeClassification: 'Annual NO CERTIFICATE',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .insertTestResult(motorCycleWithInvalidEuVehicleCategory)
          .catch((error: any) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
            expect(error.body.errors).toEqual(
              expect.arrayContaining([
                TESTING_ERRORS.EuVehicleCategoryMustBeOneOf,
              ]),
            );
          });
      });
    },
  );

  context(
    'when inserting a testResult that is a vehicleType of car and the payload contains an invalid euVehicleCategory',
    () => {
      it('should throw error', () => {
        const motorCycleWithInvalidEuVehicleCategory = cloneDeep(
          testResultsPostMock[10],
        );
        motorCycleWithInvalidEuVehicleCategory.euVehicleCategory = 'm2';
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(motorCycleWithInvalidEuVehicleCategory),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: null,
              defaultTestCode: 'yf4',
              testTypeClassification: 'Annual NO CERTIFICATE',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .insertTestResult(motorCycleWithInvalidEuVehicleCategory)
          .catch((error: any) => {
            expect(error).toBeInstanceOf(HTTPError);
            expect(error.statusCode).toBe(400);
            expect(error.body.errors).toEqual(
              expect.arrayContaining([
                TESTING_ERRORS.EuVehicleCategoryMustBeOneOf,
              ]),
            );
          });
      });
    },
  );

  context(
    'when inserting a testResult that is a vehicleType of car and the regnDate is not present',
    () => {
      it('should not throw error', () => {
        const motorCycleWithInvalidEuVehicleCategory = cloneDeep(
          testResultsPostMock[10],
        );
        delete motorCycleWithInvalidEuVehicleCategory.regnDate;
        MockTestResultsDAO = jest.fn().mockImplementation(() => ({
          createSingle: () =>
            Promise.resolve({
              Attributes: Array.of(motorCycleWithInvalidEuVehicleCategory),
            }),
          createTestNumber: () =>
            Promise.resolve({
              testNumber: 'W01A00209',
              id: 'W01',
              certLetter: 'A',
              sequenceNumber: '002',
            }),
          getTestCodesAndClassificationFromTestTypes: () =>
            Promise.resolve({
              linkedTestCode: null,
              defaultTestCode: 'yf4',
              testTypeClassification: 'Annual NO CERTIFICATE',
            }),
        }));

        testResultsService = new TestResultsService(new MockTestResultsDAO());

        return testResultsService
          .insertTestResult(motorCycleWithInvalidEuVehicleCategory)
          .then((insertedTestResult: any) => {
            expect(insertedTestResult[0].vehicleType).toBe('car');
            expect(insertedTestResult[0].testResultId).toBe('500');
          });
      });
    },
  );

  context(
    'when inserting an PSV test result with odometer reading as 0 and validating the object',
    () => {
      it('should not throw an error', () => {
        const testResult = cloneDeep(testResultsPostMock[8]);
        testResult.vehicleType = VEHICLE_TYPES.PSV;
        testResult.odometerReading = 0;
        expect.assertions(1);
        expect(ValidationUtil.validateInsertTestResultPayload(testResult)).toBe(
          true,
        );
      });
    },
  );

  context(
    'when inserting a submitted HGV that has 0 in odometer reading then',
    () => {
      it('should not throw an error', () => {
        const testResult = testResultsPostMock[4];
        testResult.testTypes.forEach((type: any) => {
          type.testTypeId = '95';
        });
        testResult.odometerReading = 0;
        expect.assertions(1);
        expect(ValidationUtil.validateInsertTestResultPayload(testResult)).toBe(
          true,
        );
      });
    },
  );

  context(
    'when inserting a submitted HGV that has null in odometer reading then',
    () => {
      it('should throw an error', () => {
        const testResult = testResultsPostMock[4];
        testResult.testTypes.forEach((type: any) => {
          type.testTypeId = '95';
        });
        testResult.odometerReading = null;
        expect.assertions(2);
        try {
          ValidationUtil.validateInsertTestResultPayload(testResult);
        } catch (err) {
          expect(err.statusCode).toBe(400);
          console.log(err);
          expect(err.body.errors[0]).toEqual(ERRORS.OdometerReadingMandatory);
        }
      });
    },
  );

  context(
    'when inserting a submitted HGV that has null in odometer reading then',
    () => {
      it('should throw an error', () => {
        const testResult = testResultsPostMock[4];
        testResult.testTypes.forEach((type: any) => {
          type.testTypeId = '95';
        });
        delete testResult.odometerReading;
        expect.assertions(2);
        try {
          ValidationUtil.validateInsertTestResultPayload(testResult);
        } catch (err) {
          expect(err.statusCode).toBe(400);
          console.log(err);
          expect(err.body.errors[0]).toEqual(ERRORS.OdometerReadingMandatory);
        }
      });
    },
  );
  describe('central docs', () => {
    let testResult: ITestResultPayload;

    beforeEach(() => {
      testResult = { ...testResultsPostMock[15] } as ITestResultPayload;
    });

    describe('validateInsertTestResultPayload', () => {
      describe('when submitting a valid test with central docs present', () => {
        it('should create the record successfully when reason for issue is present', () => {
          testResult.testTypes[0].centralDocs = {
            issueRequired: true,
            reasonsForIssue: ['reason'],
          };
          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });

        it('should create the record successfully when notes and reason for issue are present', () => {
          testResult.testTypes[0].centralDocs = {
            issueRequired: true,
            notes: 'notes',
            reasonsForIssue: ['reason'],
          };
          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });

        it('should throw a validation error when reason for issue is not present', () => {
          testResult.testTypes[0].centralDocs = {
            issueRequired: true,
            reasonsForIssue: ['reason'],
          };
          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });

        it('should throw a validation error when issue required is missing', () => {
          testResult.testTypes[0].centralDocs = {
            issueRequired: true,
            notes: 'notes',
          } as any;

          expect(() =>
            ValidationUtil.validateInsertTestResultPayload(testResult),
          ).toThrow(HTTPError);

          try {
            ValidationUtil.validateInsertTestResultPayload(testResult);
          } catch (err) {
            const error = err as HTTPError;
            expect(error.statusCode).toBe(400);
            expect(error.body.errors[0]).toBe(
              '"testTypes[0].centralDocs.reasonsForIssue" is required',
            );
          }
        });
      });

      describe('when submitting a valid test without central docs present', () => {
        it('should create the record successfully', () => {
          testResult.testTypes[0].testTypeId = '1';
          delete testResult.testTypes[0].centralDocs;
          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });
      });
    });

    describe('validateCentralDocs', () => {
      const createTestType = (
        testTypeId: string,
        centralDocs?: any,
      ): TestType => ({
        ...testResult.testTypes[0],
        testTypeId,
        centralDocs,
      });

      it('should not throw for valid central docs', () => {
        const testTypes = [
          createTestType(CENTRAL_DOCS_TEST.IDS[0], { issueRequired: true }),
          createTestType('non-central-doc-id'),
        ];
        console.log(testTypes);
        expect(() =>
          ValidationUtil.validateCentralDocs(testTypes),
        ).not.toThrow();
      });

      it('should not throw for non-central doc types', () => {
        const testTypes = [
          createTestType('non-central-doc-id-1'),
          createTestType('non-central-doc-id-2'),
        ];
        expect(() =>
          ValidationUtil.validateCentralDocs(testTypes),
        ).not.toThrow();
      });

      it('should not throw for an empty array', () => {
        const testTypes: TestType[] = [];
        expect(() =>
          ValidationUtil.validateCentralDocs(testTypes),
        ).not.toThrow();
      });

      it('should not throw for null or undefined centralDocs for non-central doc types', () => {
        const testTypes = [
          createTestType('non-central-doc-id-1', null),
          createTestType('non-central-doc-id-2', undefined),
        ];
        expect(() =>
          ValidationUtil.validateCentralDocs(testTypes),
        ).not.toThrow();
      });

      it('should throw for invalid central docs', () => {
        const testTypes = [
          createTestType(CENTRAL_DOCS_TEST.IDS[0], undefined),
          createTestType('non-central-doc-id'),
        ];
        expect(() => ValidationUtil.validateCentralDocs(testTypes)).toThrow(
          HTTPError,
        );
        try {
          ValidationUtil.validateCentralDocs(testTypes);
        } catch (error) {
          console.log();
          expect(error).toBeInstanceOf(HTTPError);
          expect(error.statusCode).toBe(400);
          expect(error.body).toBe(
            `Central docs required for test type ${CENTRAL_DOCS_TEST.IDS[0]}`,
          );
        }
      });

      it('should throw for mixed valid and invalid types', () => {
        const testTypes = [
          createTestType(CENTRAL_DOCS_TEST.IDS[0], { issueRequired: true }),
          createTestType(CENTRAL_DOCS_TEST.IDS[1], undefined),
          createTestType('non-central-doc-id'),
        ];
        expect(() => ValidationUtil.validateCentralDocs(testTypes)).toThrow(
          HTTPError,
        );
        try {
          ValidationUtil.validateCentralDocs(testTypes);
        } catch (error) {
          expect(error).toBeInstanceOf(HTTPError);
          expect(error.statusCode).toBe(400);
          expect(error.body).toBe(
            `Central docs required for test type ${CENTRAL_DOCS_TEST.IDS[1]}`,
          );
        }
      });
    });
  });
  describe('IVA Defects', () => {
    context('when creating an IVA failed test record with IVA defects', () => {
      it('should create the record successfully', () => {
        const testResult = { ...testResultsPostMock[13] } as ITestResultPayload;
        testResult.testTypes.forEach((x) => {
          x.testTypeId = '125';
          x.requiredStandards?.push({
            sectionNumber: '01',
            sectionDescription: 'Noise',
            rsNumber: 1,
            requiredStandard: 'The exhaust must be securely mounted.',
            refCalculation: '1.1',
            additionalInfo: true,
            inspectionTypes: ['basic', 'normal'],
            prs: false,
            additionalNotes: 'the exhaust was loose',
          });
          return x;
        });
        const validationResult =
          ValidationUtil.validateInsertTestResultPayload(testResult);
        expect(validationResult).toBe(true);
      });
    });

    context(
      'when creating an IVA failed test record with IVA defects and an empty string for additional notes',
      () => {
        it('should create the record successfully', () => {
          const testResult = {
            ...testResultsPostMock[13],
          } as ITestResultPayload;
          testResult.testTypes.forEach((x) => {
            x.testTypeId = '125';
            x.requiredStandards?.push({
              sectionNumber: '01',
              sectionDescription: 'Noise',
              rsNumber: 1,
              requiredStandard: 'The exhaust must be securely mounted.',
              refCalculation: '1.1',
              additionalInfo: true,
              inspectionTypes: ['basic', 'normal'],
              prs: false,
              additionalNotes: '',
            });
            return x;
          });
          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });
      },
    );
    it('should create the record successfully when reapplication date is provided', () => {
      const testResult = {
        ...testResultsPostMock[13],
      } as ITestResultPayload;
      testResult.testTypes.forEach((x) => {
        x.testTypeId = '125';
        x.requiredStandards?.push({
          sectionNumber: '01',
          sectionDescription: 'Noise',
          rsNumber: 1,
          requiredStandard: 'The exhaust must be securely mounted.',
          refCalculation: '1.1',
          additionalInfo: true,
          inspectionTypes: ['basic', 'normal'],
          prs: false,
          additionalNotes: '',
        });
        return x;
      });
      testResult.testTypes[0].reapplicationDate = '2024-06-21T13:21:16.417Z';

      const validationResult =
        ValidationUtil.validateInsertTestResultPayload(testResult);
      expect(validationResult).toBe(true);
    });
    // TODO COMMENTED OUT UNTIL FEATURE TEAMS COMPLETE IVA DEFECT WORK
    // context(
    //   'when creating an IVA failed test record without IVA defects',
    //   () => {
    //     it('should not create the record', () => {
    //       const testResult = {
    //         ...testResultsPostMock[13],
    //       } as ITestResultPayload;
    //       testResult.testTypes.forEach((x) => {
    //         x.testTypeId = '125';
    //         return x;
    //       });
    //       expect(() =>
    //         ValidationUtil.validateInsertTestResultPayload(testResult),
    //       ).toThrow();
    //     });
    //   },
    // );

    context('when creating a non IVA test record without IVA defects', () => {
      it('should create the record successfully', () => {
        const testResult = { ...testResultsPostMock[13] } as ITestResultPayload;
        testResult.testTypes.forEach((x) => delete x.requiredStandards);
        const validationResult =
          ValidationUtil.validateInsertTestResultPayload(testResult);
        expect(validationResult).toBe(true);
      });
    });

    context('when creating a COIF test without IVA defects', () => {
      it('should create the record successfully', () => {
        const testResult = { ...testResultsPostMock[13] } as ITestResultPayload;
        testResult.testTypes.forEach((x) => {
          x.testTypeId = '142';
          x.testTypeName = 'COIF with annual test';
          delete x.requiredStandards;
          return x;
        });
        const validationResult =
          ValidationUtil.validateInsertTestResultPayload(testResult);
        expect(validationResult).toBe(true);
      });
    });

    context(
      'when creating a test record for a non IVA test with a missing make',
      () => {
        it('should create the record succesfully', () => {
          const testResult = {
            ...testResultsPostMock[12],
          } as ITestResultPayload;
          delete testResult.make;

          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });
      },
    );

    context(
      'when creating a test record for a non IVA test with a missing model',
      () => {
        it('should create the record succesfully', () => {
          const testResult = {
            ...testResultsPostMock[12],
          } as ITestResultPayload;
          delete testResult.model;

          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });
      },
    );

    context(
      'when creating a test record for a non IVA test with a missing body type',
      () => {
        it('should create the record succesfully', () => {
          const testResult = {
            ...testResultsPostMock[12],
          } as ITestResultPayload;
          delete testResult.bodyType;

          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });
      },
    );

    context(
      'when creating a test record for a non IVA test with make, model and body type',
      () => {
        it('should create the record succesfully', () => {
          const testResult = {
            ...testResultsPostMock[12],
          } as ITestResultPayload;

          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });
      },
    );

    context(
      'when creating a test record for an IVA test with make, model and body type',
      () => {
        it('should create the record succesfully', () => {
          const testResult = {
            ...testResultsPostMock[13],
          } as ITestResultPayload;

          testResult.testTypes.forEach((x) => {
            x.testTypeId = '125';
            x.requiredStandards?.push({
              sectionNumber: '01',
              sectionDescription: 'Noise',
              rsNumber: 1,
              requiredStandard: 'The exhaust must be securely mounted.',
              refCalculation: '1.1',
              additionalInfo: true,
              inspectionTypes: ['basic', 'normal'],
              prs: false,
              additionalNotes: '',
            });
            return x;
          });

          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });
      },
    );

    context(
      'when creating a test record for an IVA test with make, model and body type and without reference number',
      () => {
        it('should create the record successfully', () => {
          const testResult = {
            ...testResultsPostMock[13],
          } as ITestResultPayload;

          testResult.testTypes.forEach((x) => {
            x.testTypeId = '125';
            x.customDefects = [
              {
                defectName: 'Some custom defect',
                defectNotes: 'some defect noe',
              },
            ];
            x.requiredStandards?.push({
              sectionNumber: '01',
              sectionDescription: 'Noise',
              rsNumber: 1,
              requiredStandard: 'The exhaust must be securely mounted.',
              refCalculation: '1.1',
              additionalInfo: true,
              inspectionTypes: ['basic', 'normal'],
              prs: false,
              additionalNotes: '',
            });

            return x;
          });

          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });
      },
    );

    context(
      'when creating a test record for an IVA test with a missing make',
      () => {
        it('should create the record succesfully', () => {
          const testResult = {
            ...testResultsPostMock[13],
          } as ITestResultPayload;

          testResult.testTypes.forEach((x) => {
            x.testTypeId = '125';
            x.requiredStandards?.push({
              sectionNumber: '01',
              sectionDescription: 'Noise',
              rsNumber: 1,
              requiredStandard: 'The exhaust must be securely mounted.',
              refCalculation: '1.1',
              additionalInfo: true,
              inspectionTypes: ['basic', 'normal'],
              prs: false,
              additionalNotes: '',
            });
            return x;
          });
          delete testResult.make;

          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });
      },
    );

    context(
      'when creating a test record for an IVA test with a missing model',
      () => {
        it('should create the record succesfully', () => {
          const testResult = {
            ...testResultsPostMock[13],
          } as ITestResultPayload;

          testResult.testTypes.forEach((x) => {
            x.testTypeId = '125';
            x.requiredStandards?.push({
              sectionNumber: '01',
              sectionDescription: 'Noise',
              rsNumber: 1,
              requiredStandard: 'The exhaust must be securely mounted.',
              refCalculation: '1.1',
              additionalInfo: true,
              inspectionTypes: ['basic', 'normal'],
              prs: false,
              additionalNotes: '',
            });
            return x;
          });
          delete testResult.model;

          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });
      },
    );

    context(
      'when creating a test record for an IVA test with a missing body type',
      () => {
        it('should create the record succesfully', () => {
          const testResult = {
            ...testResultsPostMock[13],
          } as ITestResultPayload;

          testResult.testTypes.forEach((x) => {
            x.testTypeId = '125';
            x.requiredStandards?.push({
              sectionNumber: '01',
              sectionDescription: 'Noise',
              rsNumber: 1,
              requiredStandard: 'The exhaust must be securely mounted.',
              refCalculation: '1.1',
              additionalInfo: true,
              inspectionTypes: ['basic', 'normal'],
              prs: false,
              additionalNotes: '',
            });
            return x;
          });
          delete testResult.bodyType;

          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });
      },
    );

    context(
      'when creating a test record for an IVA test with a defect with an empty inspectionType array',
      () => {
        it('should create the record succesfully', () => {
          const testResult = {
            ...testResultsPostMock[13],
          } as ITestResultPayload;

          testResult.testTypes.forEach((x) => {
            x.testTypeId = '125';
            x.requiredStandards?.push({
              sectionNumber: '01',
              sectionDescription: 'Noise',
              rsNumber: 1,
              requiredStandard: 'The exhaust must be securely mounted.',
              refCalculation: '1.1',
              additionalInfo: true,
              inspectionTypes: [],
              prs: false,
              additionalNotes: '',
            });
            return x;
          });
          delete testResult.bodyType;

          const validationResult =
            ValidationUtil.validateInsertTestResultPayload(testResult);
          expect(validationResult).toBe(true);
        });
      },
    );

    context(
      'when creating a test record for an IVA test with no certificate number',
      () => {
        it('should create the record succesfully and the certificate number should match the test number', () => {
          const testResult = cloneDeep(testResultsPostMock[13]);
          testResult.testTypes[0].testTypeId = '125';
          testResult.testTypes[0].requiredStandards?.push({
            sectionNumber: '01',
            sectionDescription: 'Noise',
            rsNumber: 1,
            requiredStandard: 'The exhaust must be securely mounted.',
            refCalculation: '1.1',
            additionalInfo: true,
            inspectionTypes: [],
            prs: false,
            additionalNotes: '',
          });
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            createSingle: () =>
              Promise.resolve({
                Attributes: Array.of(testResult),
              }),
            createTestNumber: () =>
              Promise.resolve({
                testNumber: 'W01A00209',
                id: 'W01',
                certLetter: 'A',
                sequenceNumber: '002',
              }),
            getTestCodesAndClassificationFromTestTypes: () =>
              Promise.resolve({
                linkedTestCode: null,
                defaultTestCode: 'qjt1',
                testTypeClassification: 'IVA With Certificate',
              }),
            getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());

          expect.assertions(2);
          return testResultsService
            .insertTestResult(testResult)
            .then((insertedTestResult: any) => {
              expect(insertedTestResult[0].testTypes[0].testTypeId).toBe('125');
              expect(insertedTestResult[0].testTypes[0].certificateNumber).toBe(
                'W01A00209',
              );
            });
        });
      },
    );

    context(
      'when creating a test record for an IVA test with a certificate number',
      () => {
        it('should create the record succesfully and the certificate number should match the one provided', () => {
          const testResult = cloneDeep(testResultsPostMock[13]);
          testResult.testTypes[0].testTypeId = '125';
          testResult.testTypes[0].certificateNumber = '12345';
          testResult.testTypes[0].requiredStandards?.push({
            sectionNumber: '01',
            sectionDescription: 'Noise',
            rsNumber: 1,
            requiredStandard: 'The exhaust must be securely mounted.',
            refCalculation: '1.1',
            additionalInfo: true,
            inspectionTypes: [],
            prs: false,
            additionalNotes: '',
          });
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            createSingle: () =>
              Promise.resolve({
                Attributes: Array.of(testResult),
              }),
            createTestNumber: () =>
              Promise.resolve({
                testNumber: 'W01A00209',
                id: 'W01',
                certLetter: 'A',
                sequenceNumber: '002',
              }),
            getTestCodesAndClassificationFromTestTypes: () =>
              Promise.resolve({
                linkedTestCode: null,
                defaultTestCode: 'qjt1',
                testTypeClassification: 'IVA With Certificate',
              }),
            getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());

          expect.assertions(2);
          return testResultsService
            .insertTestResult(testResult)
            .then((insertedTestResult: any) => {
              expect(insertedTestResult[0].testTypes[0].testTypeId).toBe('125');
              expect(insertedTestResult[0].testTypes[0].certificateNumber).toBe(
                '12345',
              );
            });
        });
      },
    );

    context(
      'when creating a test record for an IVA test with an empty certificate number',
      () => {
        it('should create the record succesfully and the certificate number should match the test number', () => {
          const testResult = cloneDeep(testResultsPostMock[13]);
          testResult.testTypes[0].testTypeId = '125';
          testResult.testTypes[0].certificateNumber = '';
          testResult.testTypes[0].requiredStandards?.push({
            sectionNumber: '01',
            sectionDescription: 'Noise',
            rsNumber: 1,
            requiredStandard: 'The exhaust must be securely mounted.',
            refCalculation: '1.1',
            additionalInfo: true,
            inspectionTypes: [],
            prs: false,
            additionalNotes: '',
          });
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            createSingle: () =>
              Promise.resolve({
                Attributes: Array.of(testResult),
              }),
            createTestNumber: () =>
              Promise.resolve({
                testNumber: 'W01A00209',
                id: 'W01',
                certLetter: 'A',
                sequenceNumber: '002',
              }),
            getTestCodesAndClassificationFromTestTypes: () =>
              Promise.resolve({
                linkedTestCode: null,
                defaultTestCode: 'qjt1',
                testTypeClassification: 'IVA With Certificate',
              }),
            getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());

          expect.assertions(2);
          return testResultsService
            .insertTestResult(testResult)
            .then((insertedTestResult: any) => {
              expect(insertedTestResult[0].testTypes[0].testTypeId).toBe('125');
              expect(insertedTestResult[0].testTypes[0].certificateNumber).toBe(
                'W01A00209',
              );
            });
        });
      },
    );

    context(
      'when creating a test record for an MSVA test with no certificate number',
      () => {
        it('should create the record succesfully and the certificate number should match the test number', () => {
          const testResult = cloneDeep(testResultsPostMock[13]);
          testResult.testTypes[0].testTypeId = '133';
          testResult.testTypes[0].requiredStandards?.push({
            sectionNumber: '4',
            sectionDescription: 'Speedometer',
            rsNumber: 1,
            requiredStandard:
              'A speedometer; does not indicate speed up to the design speed of the vehicle',
            refCalculation: '41.1c',
            additionalInfo: true,
            inspectionTypes: [],
            prs: false,
            additionalNotes: '',
          });
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            createSingle: () =>
              Promise.resolve({
                Attributes: Array.of(testResult),
              }),
            createTestNumber: () =>
              Promise.resolve({
                testNumber: 'W01A00209',
                id: 'W01',
                certLetter: 'A',
                sequenceNumber: '002',
              }),
            getTestCodesAndClassificationFromTestTypes: () =>
              Promise.resolve({
                linkedTestCode: null,
                defaultTestCode: 'qjt1',
                testTypeClassification: 'MSVA With Certificate',
              }),
            getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());

          expect.assertions(2);
          return testResultsService
            .insertTestResult(testResult)
            .then((insertedTestResult: any) => {
              expect(insertedTestResult[0].testTypes[0].testTypeId).toBe('133');
              expect(insertedTestResult[0].testTypes[0].certificateNumber).toBe(
                'W01A00209',
              );
            });
        });
      },
    );

    context(
      'when creating a test record for an MSVA test with an empty certificate number',
      () => {
        it('should create the record succesfully and the certificate number should match the test number', () => {
          const testResult = cloneDeep(testResultsPostMock[13]);
          testResult.testTypes[0].testTypeId = '133';
          testResult.testTypes[0].certificateNumber = '';
          testResult.testTypes[0].requiredStandards?.push({
            sectionNumber: '4',
            sectionDescription: 'Speedometer',
            rsNumber: 1,
            requiredStandard:
              'A speedometer; does not indicate speed up to the design speed of the vehicle',
            refCalculation: '41.1c',
            additionalInfo: true,
            inspectionTypes: [],
            prs: false,
            additionalNotes: '',
          });
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            createSingle: () =>
              Promise.resolve({
                Attributes: Array.of(testResult),
              }),
            createTestNumber: () =>
              Promise.resolve({
                testNumber: 'W01A00209',
                id: 'W01',
                certLetter: 'A',
                sequenceNumber: '002',
              }),
            getTestCodesAndClassificationFromTestTypes: () =>
              Promise.resolve({
                linkedTestCode: null,
                defaultTestCode: 'qjt1',
                testTypeClassification: 'MSVA With Certificate',
              }),
            getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());

          expect.assertions(2);
          return testResultsService
            .insertTestResult(testResult)
            .then((insertedTestResult: any) => {
              expect(insertedTestResult[0].testTypes[0].testTypeId).toBe('133');
              expect(insertedTestResult[0].testTypes[0].certificateNumber).toBe(
                'W01A00209',
              );
            });
        });
      },
    );

    context(
      'when creating a test record for an MSVA test with a certificate number',
      () => {
        it('should create the record succesfully and the certificate number should match the one provided', () => {
          const testResult = cloneDeep(testResultsPostMock[13]);
          testResult.testTypes[0].testTypeId = '133';
          testResult.testTypes[0].certificateNumber = '12345';
          testResult.testTypes[0].requiredStandards?.push({
            sectionNumber: '4',
            sectionDescription: 'Speedometer',
            rsNumber: 1,
            requiredStandard:
              'A speedometer; does not indicate speed up to the design speed of the vehicle',
            refCalculation: '41.1c',
            additionalInfo: true,
            inspectionTypes: [],
            prs: false,
            additionalNotes: '',
          });
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            createSingle: () =>
              Promise.resolve({
                Attributes: Array.of(testResult),
              }),
            createTestNumber: () =>
              Promise.resolve({
                testNumber: 'W01A00209',
                id: 'W01',
                certLetter: 'A',
                sequenceNumber: '002',
              }),
            getTestCodesAndClassificationFromTestTypes: () =>
              Promise.resolve({
                linkedTestCode: null,
                defaultTestCode: 'qjt1',
                testTypeClassification: 'MSVA With Certificate',
              }),
            getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());

          expect.assertions(2);
          return testResultsService
            .insertTestResult(testResult)
            .then((insertedTestResult: any) => {
              expect(insertedTestResult[0].testTypes[0].testTypeId).toBe('133');
              expect(insertedTestResult[0].testTypes[0].certificateNumber).toBe(
                '12345',
              );
            });
        });
        it('should create the record successfully when reapplication date is provided', () => {
          const testResult = cloneDeep(testResultsPostMock[13]);
          testResult.testTypes[0].testTypeId = '133';
          testResult.testTypes[0].certificateNumber = '12345';
          testResult.testTypes[0].requiredStandards?.push({
            sectionNumber: '4',
            sectionDescription: 'Speedometer',
            rsNumber: 1,
            requiredStandard:
              'A speedometer; does not indicate speed up to the design speed of the vehicle',
            refCalculation: '41.1c',
            additionalInfo: true,
            inspectionTypes: [],
            prs: false,
            additionalNotes: '',
          });
          testResult.testTypes[0].reapplicationDate =
            '2024-06-21T13:21:16.417Z';
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            createSingle: () =>
              Promise.resolve({
                Attributes: Array.of(testResult),
              }),
            createTestNumber: () =>
              Promise.resolve({
                testNumber: 'W01A00209',
                id: 'W01',
                certLetter: 'A',
                sequenceNumber: '002',
              }),
            getTestCodesAndClassificationFromTestTypes: () =>
              Promise.resolve({
                linkedTestCode: null,
                defaultTestCode: 'qjt1',
                testTypeClassification: 'MSVA With Certificate',
              }),
            getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());

          expect.assertions(2);
          return testResultsService
            .insertTestResult(testResult)
            .then((insertedTestResult: any) => {
              expect(insertedTestResult[0].testTypes[0].reapplicationDate).toBe(
                '2024-06-21T13:21:16.417Z',
              );
              expect(insertedTestResult[0].testTypes[0].certificateNumber).toBe(
                '12345',
              );
            });
        });
        it('should create the record successfully with the reapplication date blank', () => {
          const testResult = cloneDeep(testResultsPostMock[13]);
          testResult.testTypes[0].testTypeId = '133';
          testResult.testTypes[0].certificateNumber = '12345';
          testResult.testTypes[0].requiredStandards?.push({
            sectionNumber: '4',
            sectionDescription: 'Speedometer',
            rsNumber: 1,
            requiredStandard:
              'A speedometer; does not indicate speed up to the design speed of the vehicle',
            refCalculation: '41.1c',
            additionalInfo: true,
            inspectionTypes: [],
            prs: false,
            additionalNotes: '',
          });
          testResult.testTypes[0].reapplicationDate = '';
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            createSingle: () =>
              Promise.resolve({
                Attributes: Array.of(testResult),
              }),
            createTestNumber: () =>
              Promise.resolve({
                testNumber: 'W01A00209',
                id: 'W01',
                certLetter: 'A',
                sequenceNumber: '002',
              }),
            getTestCodesAndClassificationFromTestTypes: () =>
              Promise.resolve({
                linkedTestCode: null,
                defaultTestCode: 'qjt1',
                testTypeClassification: 'MSVA With Certificate',
              }),
            getBySystemNumber: (systemNumber: any) => Promise.resolve([]),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());

          expect.assertions(2);
          return testResultsService
            .insertTestResult(testResult)
            .then((insertedTestResult: any) => {
              expect(insertedTestResult[0].testTypes[0].reapplicationDate).toBe(
                '',
              );
              expect(insertedTestResult[0].testTypes[0].certificateNumber).toBe(
                '12345',
              );
            });
        });
      },
    );
  });
});
