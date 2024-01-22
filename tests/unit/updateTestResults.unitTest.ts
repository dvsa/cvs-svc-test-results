import { cloneDeep } from 'lodash';
import fs from 'fs';
import path from 'path';
import { TestResultsService } from '../../src/services/TestResultsService';
import { HTTPError } from '../../src/models/HTTPError';
import testResults from '../resources/test-results.json';
import { ERRORS, MESSAGES } from '../../src/assets/Enums';
import { MappingUtil } from '../../src/utils/mappingUtil';
import { ValidationUtil } from '../../src/utils/validationUtil';
import { VehicleTestController } from '../../src/handlers/VehicleTestController';
import { TestDataProvider } from '../../src/handlers/expiry/providers/TestDataProvider';
import { DateProvider } from '../../src/handlers/expiry/providers/DateProvider';
import {
  IMsUserDetails,
  ITestResult,
  TestType,
  ITestResultPayload,
} from '../../src/models';

describe('updateTestResults', () => {
  let testResultsService: TestResultsService | any;
  let MockTestResultsDAO: jest.Mock;
  let testResultsMockDB: any;
  let testToUpdate: any;

  const msUserDetails: IMsUserDetails = {
    msUser: 'dorelly',
    msOid: '654321',
    msEmailAddress: 'an@email.uk',
  };

  beforeEach(() => {
    testResultsMockDB = testResults;
    MockTestResultsDAO = jest.fn().mockImplementation(() => ({}));
    testResultsService = new TestResultsService(new MockTestResultsDAO());
    testToUpdate = cloneDeep(testResultsMockDB[30]);
  });

  afterEach(() => {
    testResultsMockDB = null;
    testResultsService = null;
    testToUpdate = null;
    MockTestResultsDAO.mockReset();
  });

  context('when trying to update a test-result', () => {
    context('and the payload is valid', () => {
      context('and the test-result is found', () => {
        it('should return the updated test-result', () => {
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            updateTestResult: () => Promise.resolve({}),
            getActivity: () =>
              Promise.resolve([
                {
                  startTime: '2018-03-22',
                  endTime: '2021-04-22',
                },
              ]),
            getBySystemNumber: () =>
              Promise.resolve(Array.of(cloneDeep(testToUpdate))),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());
          expect.assertions(9);
          return testResultsService
            .updateTestResult(
              testToUpdate.systemNumber,
              testToUpdate,
              msUserDetails,
            )
            .then((returnedRecord: any) => {
              expect(returnedRecord).toBeDefined();
              expect(returnedRecord).not.toEqual({});
              expect(returnedRecord).toHaveProperty('createdAt');
              expect(returnedRecord).toHaveProperty('createdById');
              expect(returnedRecord).toHaveProperty('createdByName');
              expect(returnedRecord).toHaveProperty('testVersion');
              expect(returnedRecord.testVersion).toBe('current');
              expect(returnedRecord).toHaveProperty('testHistory');
              expect(returnedRecord.testHistory[0].testVersion).toBe(
                'archived',
              );
            });
        });

        it('should map msUserDetails to the updated test-result', () => {
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            updateTestResult: () => Promise.resolve({}),
            getActivity: () =>
              Promise.resolve([
                {
                  startTime: '2018-03-22',
                  endTime: '2021-04-22',
                },
              ]),
            getBySystemNumber: () =>
              Promise.resolve(Array.of(cloneDeep(testToUpdate))),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());
          expect.assertions(6);
          return testResultsService
            .updateTestResult(
              testToUpdate.systemNumber,
              testToUpdate,
              msUserDetails,
            )
            .then((returnedRecord: any) => {
              expect(returnedRecord.createdById).toBe('654321');
              expect(returnedRecord.createdByName).toBe('dorelly');
              expect(returnedRecord.createdByEmailAddress).toBe('an@email.uk');
              expect(returnedRecord.testHistory[0].lastUpdatedById).toBe(
                '654321',
              );
              expect(returnedRecord.testHistory[0].lastUpdatedByName).toBe(
                'dorelly',
              );
              expect(
                returnedRecord.testHistory[0].lastUpdatedByEmailAddress,
              ).toBe('an@email.uk');
            });
        });

        it('should add the old test types onto the new test type if there is only one testType', async () => {
          const testResultMockDBWithUniqueTestNumbers = cloneDeep(
            testResultsMockDB[0],
          );
          testResultMockDBWithUniqueTestNumbers.testTypes[2].testNumber = '3';
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            updateTestResult: () => Promise.resolve({}),
            getActivity: () =>
              Promise.resolve([
                {
                  startTime: '2018-03-22',
                  endTime: '2021-04-22',
                },
              ]),
            getBySystemNumber: () =>
              Promise.resolve(Array.of(testResultMockDBWithUniqueTestNumbers)),
            getTestCodesAndClassificationFromTestTypes: () =>
              Promise.resolve({
                defaultTestCode: 'bde',
                testTypeClassification: 'Annual With Certificate',
                name: 'foo',
                testTypeName: 'bar',
              }),
          }));

          const testDataProvider = new TestDataProvider();
          testDataProvider.testResultsDAO = new MockTestResultsDAO();
          const vehicleTestController = new VehicleTestController(
            testDataProvider,
            new DateProvider(),
          );

          const updatedPayload: any = cloneDeep(
            testResultMockDBWithUniqueTestNumbers,
          );
          expect(updatedPayload.testTypes).toHaveLength(3);
          updatedPayload.testTypes = updatedPayload.testTypes.slice(0, 1);
          expect(updatedPayload.testTypes).toHaveLength(1);
          const returnedRecord =
            await vehicleTestController.mapOldTestResultToNew(
              updatedPayload.systemNumber,
              updatedPayload,
              msUserDetails,
            );
          expect(returnedRecord).toBeDefined();
          expect(returnedRecord).not.toEqual({});
          expect(returnedRecord.testTypes).toHaveLength(3);
        });

        it('should not add any test types onto the new test type if there is only one testType in payload and DB', async () => {
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            updateTestResult: () => Promise.resolve({}),
            getActivity: () =>
              Promise.resolve([
                {
                  startTime: '2018-03-22',
                  endTime: '2021-04-22',
                },
              ]),
            getBySystemNumber: () =>
              Promise.resolve(Array.of(cloneDeep(testResultsMockDB[30]))),
            getTestCodesAndClassificationFromTestTypes: () =>
              Promise.resolve({
                defaultTestCode: 'bde',
                testTypeClassification: 'Annual With Certificate',
                name: 'foo',
                testTypeName: 'bar',
              }),
          }));

          const testDataProvider = new TestDataProvider();
          testDataProvider.testResultsDAO = new MockTestResultsDAO();
          const vehicleTestController = new VehicleTestController(
            testDataProvider,
            new DateProvider(),
          );

          const updatedPayload: any = cloneDeep(testResultsMockDB[30]);
          expect(updatedPayload.testTypes).toHaveLength(1);
          const returnedRecord =
            await vehicleTestController.mapOldTestResultToNew(
              updatedPayload.systemNumber,
              updatedPayload,
              msUserDetails,
            );
          expect(returnedRecord).toBeDefined();
          expect(returnedRecord).not.toEqual({});
          expect(returnedRecord.testTypes).toHaveLength(1);
        });

        it('should add the old test types onto the new test type if there is only one testType', async () => {
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            updateTestResult: () => Promise.resolve({}),
            getActivity: () =>
              Promise.resolve([
                {
                  startTime: '2018-03-22',
                  endTime: '2021-04-22',
                },
              ]),
            getBySystemNumber: () =>
              Promise.resolve(Array.of(cloneDeep(testResultsMockDB[0]))),
            getTestCodesAndClassificationFromTestTypes: () =>
              Promise.resolve({
                defaultTestCode: 'bde',
                testTypeClassification: 'Annual With Certificate',
                name: 'foo',
                testTypeName: 'bar',
              }),
          }));

          const testDataProvider = new TestDataProvider();
          testDataProvider.testResultsDAO = new MockTestResultsDAO();
          const vehicleTestController = new VehicleTestController(
            testDataProvider,
            new DateProvider(),
          );

          const updatedPayload: any = cloneDeep(testResultsMockDB[0]);
          expect(updatedPayload.testTypes).toHaveLength(3);
          const returnedRecord =
            await vehicleTestController.mapOldTestResultToNew(
              updatedPayload.systemNumber,
              updatedPayload,
              msUserDetails,
            );
          expect(returnedRecord).toBeDefined();
          expect(returnedRecord).not.toEqual({});
          expect(returnedRecord.testTypes).toHaveLength(3);
        });

        context('when changing an attribute that requires new testCode', () => {
          context('when changing an attribute on the test-type', () => {
            it('should call getTestCodesAndClassificationFromTestTypes and return the new testCode', async () => {
              const systemNumber = testToUpdate.systemNumber;
              MockTestResultsDAO = jest.fn().mockImplementation(() => ({
                updateTestResult: () => Promise.resolve({}),
                getActivity: () =>
                  Promise.resolve([
                    {
                      startTime: '2018-03-22',
                      endTime: '2021-04-22',
                    },
                  ]),
                getBySystemNumber: () =>
                  Promise.resolve(Array.of(cloneDeep(testToUpdate))),
                getTestCodesAndClassificationFromTestTypes: () =>
                  Promise.resolve({
                    defaultTestCode: 'bde',
                    testTypeClassification: 'Annual With Certificate',
                    name: 'foo',
                    testTypeName: 'bar',
                  }),
              }));

              const testDataProvider = new TestDataProvider();
              testDataProvider.testResultsDAO = new MockTestResultsDAO();
              const vehicleTestController = new VehicleTestController(
                testDataProvider,
                new DateProvider(),
              );

              const updatedPayload: any = cloneDeep(testResultsMockDB[30]);
              updatedPayload.testTypes[0].testTypeName =
                'Another test type name';
              expect.assertions(6);
              // @ts-ignore
              const returnedRecord =
                await vehicleTestController.mapOldTestResultToNew(
                  updatedPayload.systemNumber,
                  updatedPayload,
                  msUserDetails,
                );
              expect(returnedRecord).toBeDefined();
              expect(returnedRecord).not.toEqual({});
              expect(returnedRecord.testTypes[0].testCode).toBe('bde');
              expect(returnedRecord.testTypes[0].testTypeClassification).toBe(
                'Annual With Certificate',
              );
              expect(returnedRecord.testTypes[0].name).toBe('foo');
              expect(returnedRecord.testTypes[0].testTypeName).toBe('bar');
            });
          });

          context(
            'when changing an attribute on the test-result object regarding vehicle details',
            () => {
              // it("should call getTestCodesAndClassificationFromTestTypes and return the new testCode", () => {
              //   MockTestResultsDAO = jest.fn().mockImplementation(() => {
              //     return {
              //       // updateTestResult: () => {
              //       //   return Promise.resolve({});
              //       // },
              //       getActivity: () => {
              //         return Promise.resolve([
              //           {
              //             startTime: "2018-03-22",
              //             endTime: "2021-04-22",
              //           },
              //         ]);
              //       },
              //       getBySystemNumber: () => {
              //         return Promise.resolve({
              //           Items: Array.of(cloneDeep(testToUpdate)),
              //           Count: 1,
              //         });
              //       },
              //       getTestCodesAndClassificationFromTestTypes: () => {
              //         return Promise.resolve({
              //           defaultTestCode: "lbp",
              //           testTypeClassification: "Annual No Certificate",
              //         });
              //       },
              //     };
              //   });
              //   testResultsService = new TestResultsService(
              //     new MockTestResultsDAO()
              //   );
              //   const updatedPayload: any = cloneDeep(testResultsMockDB[30]);
              //   updatedPayload.euVehicleCategory = "n3";
              //   updatedPayload.vehicleSize = "large";
              //   updatedPayload.noOfAxles = "4";
              //   expect.assertions(4);
              //   return testResultsService
              //     .updateTestResult(
              //       updatedPayload.systemNumber,
              //       updatedPayload,
              //       msUserDetails
              //     )
              //     .then((returnedRecord: any) => {
              //       expect(returnedRecord).not.toEqual(undefined);
              //       expect(returnedRecord).not.toEqual({});
              //       expect(returnedRecord.testTypes[0].testCode).toEqual("lbp");
              //       expect(
              //         returnedRecord.testTypes[0].testTypeClassification
              //       ).toEqual("Annual No Certificate");
              //     });
              // });
            },
          );
        });

        context('and when changing testTypeStartTimestamp', () => {
          context(
            'and the testTypeStartTimestamp is after the testTypeStartTimestamp',
            () => {
              it('should return error 400 testTypeStartTimestamp must be before testTypeEndTimestamp', () => {
                MockTestResultsDAO = jest.fn().mockImplementation(() => ({
                  getBySystemNumber: () =>
                    Promise.resolve(Array.of(cloneDeep(testToUpdate))),
                }));
                testResultsService = new TestResultsService(
                  new MockTestResultsDAO(),
                );
                testToUpdate.testTypes[0].testTypeEndTimestamp =
                  '2021-01-14T16:00:33.987Z';
                testToUpdate.testTypes[0].testTypeStartTimestamp =
                  '2021-01-14T18:00:33.987Z';
                expect.assertions(3);
                return testResultsService
                  .updateTestResult(
                    testToUpdate.systemNumber,
                    testToUpdate,
                    msUserDetails,
                  )
                  .catch((errorResponse: { statusCode: any; body: any }) => {
                    expect(errorResponse).toBeInstanceOf(HTTPError);
                    expect(errorResponse.statusCode).toBe(400);
                    expect(errorResponse.body).toEqual(
                      ERRORS.StartTimeBeforeEndTime,
                    );
                  });
              });
            },
          );
          context(
            'and the getActivity function throws a 404 Not Found error',
            () => {
              it('should skip the validation for testTypeStart/EndTimestamp and accept the values from the payload', () => {
                MockTestResultsDAO = jest.fn().mockImplementation(() => ({
                  getActivity: () =>
                    Promise.reject({
                      statusCode: 404,
                      body: ERRORS.NoResourceMatch,
                    }),
                  getBySystemNumber: () =>
                    Promise.resolve(Array.of(cloneDeep(testToUpdate))),
                  updateTestResult: () => Promise.resolve({}),
                  getTestCodesAndClassificationFromTestTypes: () =>
                    Promise.resolve({
                      defaultTestCode: 'lbp',
                      testTypeClassification: 'Annual No Certificate',
                    }),
                }));

                const dataProvider = new TestDataProvider();
                dataProvider.testResultsDAO = new MockTestResultsDAO();
                const vehicleTestController = new VehicleTestController(
                  dataProvider,
                  new DateProvider(),
                );
                const expectedTestTypeStartTimestamp =
                  '2021-12-28T09:26:58.477Z';
                const expectedTestTypeEndTimestamp = '2021-12-28T18:00:00.000Z';
                testToUpdate.testTypes[0].testTypeStartTimestamp =
                  expectedTestTypeStartTimestamp;
                testToUpdate.testTypes[0].testTypeEndTimestamp =
                  expectedTestTypeEndTimestamp;
                expect.assertions(4);
                // @ts-ignore
                return vehicleTestController
                  .mapOldTestResultToNew(
                    testToUpdate.systemNumber,
                    testToUpdate,
                    msUserDetails,
                  )
                  .then((returnedRecord: any) => {
                    expect(returnedRecord).toBeDefined();
                    expect(returnedRecord).not.toEqual({});
                    expect(
                      returnedRecord.testTypes[0].testTypeStartTimestamp,
                    ).toEqual(expectedTestTypeStartTimestamp);
                    expect(
                      returnedRecord.testTypes[0].testTypeEndTimestamp,
                    ).toEqual(expectedTestTypeEndTimestamp);
                  });
              });
            },
          );
        });
      });

      context('when updateTestResultDAO throws error', () => {
        it('should throw an error 500-Internal Error', () => {
          const existingTest = cloneDeep(testToUpdate);
          existingTest.testHistory = ['previously archived test'];
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            updateTestResult: () =>
              Promise.reject({
                statusCode: 500,
                message: MESSAGES.INTERNAL_SERVER_ERROR,
              }),
            getActivity: () =>
              Promise.resolve([
                {
                  startTime: '2018-03-22',
                  endTime: '2021-04-22',
                },
              ]),
            getBySystemNumber: () => Promise.resolve(Array.of(existingTest)),
          }));
          testResultsService = new TestResultsService(new MockTestResultsDAO());
          expect.assertions(3);
          return testResultsService
            .updateTestResult(
              testToUpdate.systemNumber,
              testToUpdate,
              msUserDetails,
            )
            .catch((errorResponse: { statusCode: any; body: any }) => {
              expect(errorResponse).toBeInstanceOf(HTTPError);
              expect(errorResponse.statusCode).toBe(500);
              expect(errorResponse.body).toEqual(
                MESSAGES.INTERNAL_SERVER_ERROR,
              );
            });
        });
      });

      context('when no data was found', () => {
        it('should throw an error 404-No resources match the search criteria', () => {
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            getBySystemNumber: () => Promise.resolve([]),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());
          expect.assertions(3);
          return testResultsService
            .updateTestResult(
              testToUpdate.systemNumber,
              testToUpdate,
              msUserDetails,
            )
            .catch((errorResponse: { statusCode: any; body: any }) => {
              expect(errorResponse).toBeInstanceOf(HTTPError);
              expect(errorResponse.statusCode).toBe(404);
              expect(errorResponse.body).toBe(
                'No resources match the search criteria',
              );
            });
        });
      });

      context('when could not uniquely identify the test to update', () => {
        it('should throw an error 404-No resources match the search criteria', () => {
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            getBySystemNumber: () =>
              Promise.resolve(Array.of(testResultsMockDB[0])),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());
          expect.assertions(3);
          return testResultsService
            .updateTestResult(
              testToUpdate.systemNumber,
              testToUpdate,
              msUserDetails,
            )
            .catch((errorResponse: { statusCode: any; body: any }) => {
              expect(errorResponse).toBeInstanceOf(HTTPError);
              expect(errorResponse.statusCode).toBe(404);
              expect(errorResponse.body).toBe(
                'No resources match the search criteria',
              );
            });
        });
      });
    });

    context('and the payload is invalid', () => {
      context(
        'and an attempt to update a test without a mandatory field is done',
        () => {
          it('should return error 400 Invalid payload', () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => ({
              updateTestResult: () => Promise.resolve({}),
              getBySystemNumber: () => Promise.resolve(Array.of(testToUpdate)),
            }));

            testResultsService = new TestResultsService(
              new MockTestResultsDAO(),
            );
            testToUpdate.vehicleType = 'trl';
            return testResultsService
              .updateTestResult(
                testToUpdate.systemNumber,
                testToUpdate,
                msUserDetails,
              )
              .catch((errorResponse: { statusCode: any; body: any }) => {
                expect(errorResponse).toBeInstanceOf(HTTPError);
                expect(errorResponse.statusCode).toBe(400);
                expect(errorResponse.body).toEqual({
                  errors: ['"trailerId" is required'],
                });
              });
          });
        },
      );
      context(
        'and an attempt to update a test with invalid values is done',
        () => {
          it('should return error 400 Invalid payload', () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => ({
              updateTestResult: () => Promise.resolve({}),
              getBySystemNumber: () => Promise.resolve(Array.of(testToUpdate)),
            }));

            testResultsService = new TestResultsService(
              new MockTestResultsDAO(),
            );
            testToUpdate.euVehicleCategory = 'invalid value';
            return testResultsService
              .updateTestResult(
                testToUpdate.systemNumber,
                testToUpdate,
                msUserDetails,
              )
              .catch((errorResponse: { statusCode: any; body: any }) => {
                expect(errorResponse).toBeInstanceOf(HTTPError);
                expect(errorResponse.statusCode).toBe(400);
                expect(errorResponse.body).toEqual({
                  errors: [
                    '"euVehicleCategory" must be one of [m1, m2, m3, n1, n2, n3, o1, o2, o3, o4, l1e-a, l1e, l2e, l3e, l4e, l5e, l6e, l7e, null]',
                  ],
                });
              });
          });
        },
      );
      context(
        'and an attempt to update a test with a field exceeding min/max length limit is done',
        () => {
          it('should return error 400 Invalid payload', () => {
            MockTestResultsDAO = jest.fn().mockImplementation(() => ({
              updateTestResult: () => Promise.resolve({}),
              getBySystemNumber: () => Promise.resolve(Array.of(testToUpdate)),
            }));

            testResultsService = new TestResultsService(
              new MockTestResultsDAO(),
            );
            testToUpdate.testerStaffId =
              'invalid value exceeding size limit 123456789012343454';
            return testResultsService
              .updateTestResult(
                testToUpdate.systemNumber,
                testToUpdate,
                msUserDetails,
              )
              .catch((errorResponse: { statusCode: any; body: any }) => {
                expect(errorResponse).toBeInstanceOf(HTTPError);
                expect(errorResponse.statusCode).toBe(400);
                expect(errorResponse.body).toEqual({
                  errors: [
                    '"testerStaffId" length must be less than or equal to 36 characters long',
                  ],
                });
              });
          });
        },
      );
    });

    context('and when validating test types', () => {
      context(
        'and the test type contains a field that is not applicable',
        () => {
          it('should return validation Error 400', () => {
            MockTestResultsDAO = jest.fn().mockImplementation();

            testResultsService = new TestResultsService(
              new MockTestResultsDAO(),
            );
            testToUpdate = cloneDeep(testResultsMockDB[1]);
            expect.assertions(2);
            return testResultsService
              .updateTestResult(
                testToUpdate.systemNumber,
                testToUpdate,
                msUserDetails,
              )
              .catch((errorResponse: { statusCode: any; body: any }) => {
                expect(errorResponse).toBeInstanceOf(HTTPError);
                expect(errorResponse.statusCode).toBe(400);
              });
          });
        },
      );

      context('and when the testTypeId is unknown', () => {
        it('should return validation Error 400', () => {
          MockTestResultsDAO = jest.fn().mockImplementation();

          testResultsService = new TestResultsService(new MockTestResultsDAO());
          testToUpdate.testTypes[0].testTypeId = 'unknown';
          expect.assertions(3);
          return testResultsService
            .updateTestResult(
              testToUpdate.systemNumber,
              testToUpdate,
              msUserDetails,
            )
            .catch((errorResponse: { statusCode: any; body: any }) => {
              expect(errorResponse).toBeInstanceOf(HTTPError);
              expect(errorResponse.statusCode).toBe(400);
              expect(errorResponse.body.errors).toContain('Unknown testTypeId');
            });
        });
      });

      context('and the test types are invalid', () => {
        it('should apply the correct validation schema and return an array of validation errors', () => {
          MockTestResultsDAO = jest.fn().mockImplementation();

          testResultsService = new TestResultsService(new MockTestResultsDAO());
          // testTypeId from each of the test-types groupings
          const testTypeIds = [
            '1',
            '15',
            '38',
            '56',
            '62',
            '59',
            '76',
            '117',
            '39',
            '125',
            '142',
            '143',
            '147',
            '153',
          ];
          testToUpdate = cloneDeep(testResultsMockDB[1]);
          for (const testTypeId of testTypeIds) {
            testToUpdate.testTypes[0].testTypeId = testTypeId;
            // @ts-ignore
            const validationResponse =
              ValidationUtil.validateTestTypes(testToUpdate);
            expect(validationResponse).toBeDefined();
          }
        });
      });

      context(
        'and when testTypes attribute is not present on the payload',
        () => {
          it('should return validation Error 400', () => {
            MockTestResultsDAO = jest.fn().mockImplementation();

            testResultsService = new TestResultsService(
              new MockTestResultsDAO(),
            );
            delete testToUpdate.testTypes;
            expect.assertions(3);
            return testResultsService
              .updateTestResult(
                testToUpdate.systemNumber,
                testToUpdate,
                msUserDetails,
              )
              .catch((errorResponse: { statusCode: any; body: any }) => {
                expect(errorResponse).toBeInstanceOf(HTTPError);
                expect(errorResponse.statusCode).toBe(400);
                expect(errorResponse.body.errors).toContain(
                  '"testTypes" is required',
                );
              });
          });
        },
      );

      context('and the test is a specialist test', () => {
        it('should set the defects attribute as an empty array', () => {
          MockTestResultsDAO = jest.fn().mockImplementation();

          testResultsService = new TestResultsService(new MockTestResultsDAO());
          // testTypeId from each of the specialist test-types groupings
          const testTypeIds = ['125', '142', '143', '147', '153'];
          testToUpdate = cloneDeep(testResultsMockDB[1]);
          for (const testTypeId of testTypeIds) {
            testToUpdate.testTypes[0].testTypeId = testTypeId;
            delete testToUpdate.testTypes[0].defects;
            // FIXME: move to a separate test
            MappingUtil.cleanDefectsArrayForSpecialistTests(testToUpdate);
            expect(testToUpdate.testTypes[0].defects).toBeDefined();
            expect(testToUpdate.testTypes[0].defects).toEqual([]);
          }
        });
      });

      it('should remove the attributes that are not updatable from the payload', () => {
        MockTestResultsDAO = jest.fn().mockImplementation();

        // testResultsService = new TestResultsService(new MockTestResultsDAO());
        // FIXME: move to a separate test
        MappingUtil.removeNonEditableAttributes(testToUpdate);
        expect(testToUpdate).not.toHaveProperty('systemNumber');
        expect(testToUpdate).not.toHaveProperty('vin');
        expect(testToUpdate).not.toHaveProperty('vehicleId');
        expect(testToUpdate).not.toHaveProperty('testEndTimestamp');
        expect(testToUpdate).not.toHaveProperty('testVersion');
        expect(testToUpdate).toHaveProperty('testerEmailAddress');
        expect(testToUpdate).toHaveProperty('testStationType');
      });
    });
  });

  context('when testing specialist test', () => {
    context(
      "when updating a 'fail' specialist test with blank certificate number",
      () => {
        it('should not return an error', () => {
          MockTestResultsDAO = jest.fn().mockImplementation(() => ({
            updateTestResult: () => Promise.resolve({}),
            getActivity: () =>
              Promise.resolve([
                {
                  startTime: '2018-03-22',
                  endTime: '2022-10-20',
                },
              ]),
            getBySystemNumber: () =>
              Promise.resolve(Array.of(cloneDeep(testToUpdate))),
          }));

          testResultsService = new TestResultsService(new MockTestResultsDAO());
          testToUpdate = cloneDeep(testResultsMockDB[64]);
          expect.assertions(2);
          return testResultsService
            .updateTestResult(
              testToUpdate.systemNumber,
              testToUpdate,
              msUserDetails,
            )
            .then((returnedRecord: any) => {
              expect(returnedRecord).toBeDefined();
              expect(returnedRecord).not.toEqual({});
            });
        });
      },
    );
  });

  describe('PUT for updating test records', () => {
    const testResultsPostMock = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../resources/test-results-post.json'),
        'utf8',
      ),
    );

    beforeEach(() => {
      testToUpdate = cloneDeep(testResultsPostMock[13] as ITestResult);
      MockTestResultsDAO = jest.fn().mockImplementation(() => ({
        updateTestResult: jest.fn().mockResolvedValue({} as ITestResult),
        getActivity: jest
          .fn()
          .mockResolvedValue([
            { startTime: '2018-03-22', endTime: '2022-10-20' },
          ]),
        getBySystemNumber: jest
          .fn()
          .mockResolvedValue([cloneDeep(testToUpdate)]),
      }));
      testResultsService = new TestResultsService(new MockTestResultsDAO());
    });
    afterEach(() => MockTestResultsDAO.mockReset());
    const setupTestTypes = (
      modificationCallback: (testType: TestType) => void,
    ) => {
      testToUpdate.testTypes.forEach(modificationCallback);
    };

    context('A failed IVA Test Record with IVA defects', () => {
      it('can be updated with IVA defects present', async () => {
        setupTestTypes((x) => {
          x.testTypeId = '125';
          x.ivaDefects = [
            {
              sectionNumber: '01',
              sectionDescription: 'Noise',
              rsNumber: 1,
              requiredStandard: 'The exhaust must be securely mounted.',
              refCalculation: '1.1',
              additionalInfo: true,
              inspectionTypes: ['basic', 'normal'],
              prs: false,
            },
          ];
          x.testTypeClassification = 'Annual With Certificate';
          x.testCode = 'cel';
          x.testNumber = '213213123';
          return x;
        });

        const returnedRecord = await testResultsService.updateTestResult(
          testToUpdate.systemNumber,
          testToUpdate,
          msUserDetails,
        );
        expect(returnedRecord).toBeDefined();
      });
    });

    context('A failed IVA Test Record without IVA defects', () => {
      it('cannot be updated without IVA defects present', async () => {
        setupTestTypes((x) => delete x.ivaDefects);

        try {
          await testResultsService.updateTestResult(
            testToUpdate.systemNumber,
            testToUpdate,
            msUserDetails,
          );
        } catch (errorResponse) {
          expect(errorResponse).toBeInstanceOf(HTTPError);
          expect(errorResponse.statusCode).toBe(400);
        }
      });
    });

    context('A non-IVA test', () => {
      it('can be updated without IVA defects present', async () => {
        setupTestTypes((x) => {
          x.testTypeClassification = 'Annual With Certificate';
          x.testCode = 'cel';
          x.testNumber = '213213123';
          delete x.ivaDefects;
          return x;
        });

        const returnedRecord = await testResultsService.updateTestResult(
          testToUpdate.systemNumber,
          testToUpdate,
          msUserDetails,
        );
        expect(returnedRecord).toBeDefined();
      });
    });

    context('A COIF test', () => {
      it('can be updated without IVA defects present', async () => {
        setupTestTypes((x) => {
          x.testTypeId = '142';
          x.testTypeName = 'COIF with annual test';
          x.testTypeClassification = 'Annual With Certificate';
          x.testCode = 'cel';
          x.testNumber = '213213123';
          delete x.ivaDefects;
          return x;
        });
        const returnedRecord = await testResultsService.updateTestResult(
          testToUpdate.systemNumber,
          testToUpdate,
          msUserDetails,
        );
        expect(returnedRecord).toBeDefined();
      });
    });

    context('When IVA defects are present in the payload', () => {
      it('IVA defects are not removed', async () => {
        setupTestTypes((x) => {
          x.testTypeId = '125';
          x.ivaDefects = [
            {
              sectionNumber: '01',
              sectionDescription: 'Noise',
              rsNumber: 1,
              requiredStandard: 'The exhaust must be securely mounted.',
              refCalculation: '1.1',
              additionalInfo: true,
              inspectionTypes: ['basic', 'normal'],
              prs: false,
            },
          ];
          x.testTypeClassification = 'Annual With Certificate';
          x.testCode = 'cel';
          x.testNumber = '213213123';
          return x;
        });

        const res: ITestResult = await testResultsService.updateTestResult(
          testToUpdate.systemNumber,
          testToUpdate,
          msUserDetails,
        );
        res.testTypes.forEach((testType) =>
          expect(testType.ivaDefects).toBeDefined(),
        );
      });
    });

    context('When IVA defects are not present in the payload', () => {
      it('IVA defects are removed', async () => {
        setupTestTypes((x) => {
          x.testTypeClassification = 'Annual With Certificate';
          x.testCode = 'cel';
          x.testNumber = '213213123';
          delete x.ivaDefects;
        });
        const res: ITestResult = await testResultsService.updateTestResult(
          testToUpdate.systemNumber,
          testToUpdate,
          msUserDetails,
        );
        res.testTypes.forEach((testType) => {
          const isIvaDefectsRemoved =
            testType.ivaDefects === undefined ||
            testType.ivaDefects.length === 0;
          expect(isIvaDefectsRemoved).toBe(true);
        });
      });
    });
  });
});
