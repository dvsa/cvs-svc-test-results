import { default as unwrappedAWS } from "aws-sdk";
/* tslint:disable */
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(unwrappedAWS);
/* tslint:enable */
import { Configuration } from "../utils/Configuration";
import {validateInvocationResponse} from "../utils/validateInvocationResponse";


const lambdaInvokeEndpoints = Configuration.getInstance().getEndpoints();

/**
 * Helper service for interactions with other lambdas
 */
export class LambdaService {
  public static invoke(lambdaName: any, lambdaEvent: any) {
    const lambda = new AWS.Lambda(lambdaInvokeEndpoints.params);

    return lambda.invoke({
      FunctionName: lambdaName,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(lambdaEvent)
    }).promise().then((data: any) => {
      const payload = validateInvocationResponse(data);
      const body = JSON.parse(payload.body);
      return body;
    });
  }
}
