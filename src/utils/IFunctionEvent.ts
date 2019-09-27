import {Handler} from "aws-lambda";
import { HTTPMethods } from "../assets/Enums";
/**
 * Configuration class for retrieving project config
 */
export interface IFunctionEvent {
  name: string;
  method: HTTPMethods;
  path: string;
  function: Handler;
}
