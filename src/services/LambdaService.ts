/* tslint:disable */
let AWS: any;
// if (process.env._X_AMZN_TRACE_ID) {
//   AWS = require("aws-xray-sdk").captureAWS(require("aws-sdk"));
// } else {
//   console.log("Serverless Offline detected; skipping AWS X-Ray setup");
//   AWS = require("aws-sdk");
// }
AWS = require("aws-sdk");
/* tslint:enable */
import { Configuration } from "../utils/Configuration";
import { validateInvocationResponse } from "../utils/validateInvocationResponse";

const lambdaInvokeEndpoints = Configuration.getInstance().getEndpoints();

/**
 * Helper service for interactions with other lambdas
 */
export class LambdaService {
  public static invoke(lambdaName: any, lambdaEvent: any) {
    console.log("LambdaService")
    console.log("LAMBDA created is:\n", lambdaInvokeEndpoints.params)

    // TODO: Change cfg for localstack and develop locally local-global should go away in fact
    const lambda = new AWS.Lambda(lambdaInvokeEndpoints.params);
    console.log("FunctionName to be invoked:\n", lambdaName)
    console.log("Payload: \n", JSON.stringify(lambdaEvent))

    return lambda
      .invoke({
        FunctionName: lambdaName,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify(lambdaEvent),
      })
      .promise()
      .then((data: any) => {
        console.log("data back:\n")
        console.log(data)
        const payload = validateInvocationResponse(data);
        const body = JSON.parse(payload.body);
        return body;
      });
  }
}
