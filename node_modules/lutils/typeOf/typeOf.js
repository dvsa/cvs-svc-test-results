"use strict";
// tslint:disable:ban-types
Object.defineProperty(exports, "__esModule", { value: true });
// Primitives
exports.isBoolean = function (value) { return typeof value === 'boolean'; };
exports.isNull = function (value) { return value === null; };
exports.isUndefined = function (value) { return value === undefined; };
exports.isString = function (value) { return typeof value === 'string'; };
exports.isNumber = function (value) { return typeof value === 'number' && !isNaN(value); };
exports.isSymbol = function (value) { return typeof value === 'symbol'; };
// Object obfuscated types
exports.isFunction = function (value) { return typeof value === 'function'; };
exports.isArray = function (value) { return Array.isArray(value); };
exports.isObject = function (value) { return exports.typeOf(value) === 'object'; };
exports.isRegExp = function (value) { return exports.typeOf(value) === 'regexp'; };
exports.isDate = function (value) { return exports.typeOf(value) === 'date'; };
exports.typeOf = (function () {
    var toString = Object.prototype.toString;
    var fn = function (value) {
        // For performance
        if (typeof value === 'number' && isNaN(value)) {
            return 'nan';
        }
        var type = toString.call(value)
            .slice(8, -1)
            .toLowerCase();
        return type;
    };
    fn.isBoolean = exports.isBoolean;
    fn.isNull = exports.isNull;
    fn.isUndefined = exports.isUndefined;
    fn.isString = exports.isString;
    fn.isNumber = exports.isNumber;
    fn.isSymbol = exports.isSymbol;
    fn.isFunction = exports.isFunction;
    fn.isArray = exports.isArray;
    fn.isObject = exports.isObject;
    fn.isRegExp = exports.isRegExp;
    fn.isDate = exports.isDate;
    return fn;
})();
//# sourceMappingURL=typeOf.js.map