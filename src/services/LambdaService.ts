import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { toUint8Array } from "@smithy/util-utf8";
import { Configuration } from '../utils/Configuration';
import { validateInvocationResponse } from '../utils/validateInvocationResponse';
/**
 * Helper service for interactions with other lambdas
*/
export class LambdaService {
  public static async invoke(lambdaName: any, lambdaEvent: any) {
    const lambdaInvokeEndpoints = Configuration.getInstance().getEndpoints();
    let AWS: any;
    if (process.env._X_AMZN_TRACE_ID) {
      AWS = require('aws-xray-sdk').captureAWS(new LambdaClient(lambdaInvokeEndpoints));
    } else {
      console.log('Serverless Offline detected; skipping AWS X-Ray setup');
      AWS = new LambdaClient(lambdaInvokeEndpoints);
    }

    const returned = await AWS.send(new InvokeCommand({
      FunctionName: lambdaName,
      InvocationType: 'RequestResponse',
      Payload: toUint8Array(JSON.stringify(lambdaEvent)),
    }))

    const payload = validateInvocationResponse(returned);
    const body = JSON.parse(payload.body);
    return body;
  }
}
