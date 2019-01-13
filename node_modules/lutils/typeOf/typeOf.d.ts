export interface IIndexedObject {
    [key: string]: any;
}
export interface ITypeOf {
    (value: any): string;
    isBoolean: (value: any) => value is boolean;
    isNull: (value: any) => value is null;
    isUndefined: (value: any) => value is undefined;
    isString: (value: any) => value is string;
    isNumber: (value: any) => value is number;
    isSymbol: (value: any) => value is symbol;
    isFunction: (value: any) => value is Function;
    isArray: <O = any[]>(value: any) => value is O;
    isObject: <O = IIndexedObject>(value: any) => value is O;
    isRegExp: (value: any) => value is RegExp;
    isDate: (value: any) => value is Date;
}
export declare const isBoolean: (value: any) => value is boolean;
export declare const isNull: (value: any) => value is null;
export declare const isUndefined: (value: any) => value is undefined;
export declare const isString: (value: any) => value is string;
export declare const isNumber: (value: any) => value is number;
export declare const isSymbol: (value: any) => value is symbol;
export declare const isFunction: (value: any) => value is Function;
export declare const isArray: <O = any[]>(value: any) => value is O;
export declare const isObject: <O = IIndexedObject>(value: any) => value is O;
export declare const isRegExp: (value: any) => value is RegExp;
export declare const isDate: (value: any) => value is Date;
export declare const typeOf: ITypeOf;
