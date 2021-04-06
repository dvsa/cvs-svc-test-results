import { cloneDeep, mergeWith, isEqual, differenceWith } from "lodash";

// import { ITestDataProvider } from "./src/handlers/expiry/providers/ITestDataProvider";
// import * as models from "./src/models";
// import { Service } from "./src/models/injector/ServiceDecorator";

// @Service()
// class TestDataProvider implements ITestDataProvider {
//   constructor() {}
//   public testResultsDAO: models.TestResultsDAO | undefined;

//   public async getTestTypesWithTestCodesAndClassification(
//     testTypes: models.TestType[] = [],
//     testTypeParams: models.TestTypeParams
//   ) {
//     this.testResultsDAO = this.testResultsDAO as models.TestResultsDAO;

//     const promise = await this.testResultsDAO.getTestCodesAndClassificationFromTestTypes(
//       "123",
//       testTypeParams
//     );
//     console.log({ promise });
//   }

//   public async getMostRecentExpiryDate(systemNumber: string): Promise<any> {}
//   public async getTestHistory(systemNumber: string): Promise<any> {}
// }

// const Toto = new TestDataProvider();
// const params = {
//   vehicleType: "hgv",
//   vehicleSize: undefined,
//   vehicleConfiguration: "articulated",
//   vehicleAxles: 8,
//   euVehicleCategory: "n3",
//   vehicleClass: "v",
//   vehicleSubclass: undefined,
//   vehicleWheels: null,
// };
// console.log(Toto);
// console.log(TestDataProvider);
// Toto.getTestTypesWithTestCodesAndClassification([], params);
// class Foo

// "2021-02-21T13:28:12.567Z";
const testTypes = [
  {
    name: "Voluntary test",
    testTypeName: "Voluntary roadworthiness test",
    testTypeId: "122",
    certificateNumber: null,
    testTypeStartTimestamp: "2019-12-12T14:15:06.792Z",
    testTypeEndTimestamp: "2019-12-12T14:15:36.921Z",
    modType: null,
    emissionStandard: null,
    fuelType: null,
    smokeTestKLimitApplied: null,
    particulateTrapFitted: null,
    particulateTrapSerialNumber: null,
    modificationTypeUsed: null,
    testExpiryDate: null,
    testResult: "fail",
    prohibitionIssued: false,
    reasonForAbandoning: null,
    additionalCommentsForAbandon: null,
    additionalNotesRecorded: null,
    defects: [[Object]],
    customDefects: [],
    secondaryCertificateNumber: "123456",
    createdAt: "2021-02-15T11:05:10.578Z",
    lastUpdatedAt: "2021-02-15T11:05:10.578Z",
  },
  {
    name: "Voluntary test",
    testTypeName: "Voluntary roadworthiness test",
    testTypeId: "122",
    certificateNumber: null,
    testTypeStartTimestamp: "2019-12-12T14:15:06.792Z",
    testTypeEndTimestamp: "2019-12-12T14:15:36.921Z",
    modType: null,
    emissionStandard: null,
    fuelType: null,
    smokeTestKLimitApplied: null,
    particulateTrapFitted: null,
    particulateTrapSerialNumber: null,
    modificationTypeUsed: null,
    testExpiryDate: null,
    testResult: "fail",
    prohibitionIssued: false,
    reasonForAbandoning: null,
    additionalCommentsForAbandon: null,
    additionalNotesRecorded: null,
    defects: [[Object]],
    customDefects: [],
    secondaryCertificateNumber: "123456",
    createdAt: "2021-02-15T11:05:10.578Z",
    lastUpdatedAt: "2021-02-15T11:05:10.578Z",
  },
];

const myPromise = () => Promise.resolve("promiseD");

const modifyTestType = async (item: any) => {
  // pull test currentTestCodesAndClassification

  // 1 ?
  //  -> testCode=defaultTestCode
  //  -> testTypeClassification
  //
  // othger
  //   --> testTypeCLassification
  //   --> defaultTestCode

  /**
   * {
   *  ...item,
   *  testTypeCLassification,
   *  testCode: linkedTestCode ? linkedTestCode : linkedTestCode
   * }
   */
  return {
    ...item,
    testCode: await myPromise(),
  };
};

const createNewTestTypes = async (list: any) => {
  return Promise.all(list.map(modifyTestType));
};

async function run() {
  const newArray = await createNewTestTypes(testTypes);
  console.log(newArray);
}
run();

// PUT oayload (aka testResults)

// oldTestResult

// new

// call shouldGenerateNewTestCodeRe

function shouldGenerateNewTestCodeRe(oldTestResult: any, newTestResult: any) {
  console.log({ oldTestResult });
  console.log({ newTestResult });
  const attributesToCheck = [
    "vehicleType",
    "vehicleSize",
    "euVehicleCategory",
    "vehicleConfiguration",
    "noOfAxles",
    "numberOfWheelsDriven",
  ];
  let bool;
  if (
    differenceWith(oldTestResult.testTypes, newTestResult.testTypes, isEqual)
      .length
  ) {
    console.log("in differenceWith");
    console.log(bool);
    bool = true;
    return bool;
  }

  for (const attributeToCheck of attributesToCheck) {
    console.log("in for of loop....");
    if (
      oldTestResult[attributeToCheck as keyof typeof oldTestResult] !==
      newTestResult[attributeToCheck as keyof typeof newTestResult]
    ) {
      bool = true;
      console.log("in attributesToCheck");
      console.log(bool);
      return bool;
    }
  }
  bool = false;
  console.log({ bool });
  return bool;
}
