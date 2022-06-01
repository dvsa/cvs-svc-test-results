export class Validator {
  // tslint:disable-next-line: no-empty
  public constructor() {}

  /**
   * Validate query or path parameter provided in the request
   * @param parameter Query or path parameter provided
   * @returns boolean Result of logic determining validity
   */
  public parameterIsValid(parameter: string): boolean {
    return parameter ? parameter !== "undefined" && parameter !== "null" : false;
  }
}
