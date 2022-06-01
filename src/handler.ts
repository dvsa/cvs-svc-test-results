import { HTTPRESPONSE } from "./assets/Enums";
import {APIGatewayProxyResult, Callback, Context, Handler} from "aws-lambda";
import Path from "path-parser";
import { Configuration } from "./utils/Configuration";
import { IFunctionEvent } from "./utils/IFunctionEvent";
import { HTTPResponse } from "./models/HTTPResponse";
import {ILogMessage} from "./models/ILogMessage";


const handler: Handler = async (event: any, context: Context, callback: Callback): Promise<APIGatewayProxyResult> => {
  // Request integrity checks
  if (!event) {
    return new HTTPResponse(400, HTTPRESPONSE.AWS_EVENT_EMPTY);
  }

  if (event.body) {
    let payload: any = {};

    try {
      payload = JSON.parse(event.body);
    } catch (e) {
      return new HTTPResponse(400, HTTPRESPONSE.NOT_VALID_JSON);
    }

    Object.assign(event, { body: payload });
  }

  // Finding an appropriate λ matching the request
  const config: Configuration = Configuration.getInstance();
  const functions: IFunctionEvent[] = config.getFunctions();
  const serverlessConfig: any = config.getConfig().serverless;

  let matchingLambdaEvents: IFunctionEvent[] = functions.filter((fn) => {
    // Find λ with matching httpMethod
    return event.httpMethod === fn.method;
  })
    .filter((fn) => {
      // Find λ with matching path
      const localPath: Path = new Path(fn.path);
      const remotePath = new Path(`${serverlessConfig.basePath}${fn.path}`); // Remote paths also have environment

      return (localPath.test(event.path) || remotePath.test(event.path));
    });

  // handle case of variable overloading e.g. "getTestResultByTesterStaffId" potentially being a vin
  if (matchingLambdaEvents.length > 1) {
    const exactMatch = matchingLambdaEvents.filter(fn => fn.path === event.path);
    if (exactMatch.length  === 1) {
      matchingLambdaEvents = exactMatch
    }
  }
  // Exactly one λ should match the above filtering.
  if (matchingLambdaEvents.length === 1) {
    const lambdaEvent: IFunctionEvent = matchingLambdaEvents[0];
    const lambdaFn: Handler = lambdaEvent.function;

    const localPath: Path = new Path(lambdaEvent.path);
    const remotePath: Path = new Path(`${serverlessConfig.basePath}${lambdaEvent.path}`); // Remote paths also have environment

    const lambdaPathParams: any = (localPath.test(event.path) || remotePath.test(event.path));

    Object.assign(event, { pathParameters: lambdaPathParams });

    const logMessage: ILogMessage = {
      HTTP: `${event.httpMethod} ${event.path} -> λ ${lambdaEvent.name}`,
      PATH_PARAMS: `${JSON.stringify(event.pathParameters)}`,
      QUERY_PARAMS: `${JSON.stringify(event.queryStringParameters)}`
    };

    console.log(logMessage);
    // Explicit conversion because typescript can't figure it out
    return lambdaFn(event, context, callback) as Promise<APIGatewayProxyResult>;
  }
  if (matchingLambdaEvents.length > 1) {
    console.error(`Error: More than one function identified for route ${event.httpMethod} ${event.path} matched ${matchingLambdaEvents.map((lambda) => lambda.name)}
    Dumping event:
    ${JSON.stringify(event)}
    Dumping context:
    ${JSON.stringify(context)}`);
  } else {
    // If filtering results in less or more λ functions than expected, we return an error.
    console.error(`Error: Route ${event.httpMethod} ${event.path} was not found.
    Dumping event:
    ${JSON.stringify(event)}
    Dumping context:
    ${JSON.stringify(context)}`);
  }



  return new HTTPResponse(400, { error: `Route ${event.httpMethod} ${event.path} was not found.` });
};

export { handler };

