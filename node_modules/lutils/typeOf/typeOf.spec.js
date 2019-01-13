"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var typeOf_1 = require("./typeOf");
var samples = [
    [
        'isBoolean', 'boolean',
        [true], [null],
    ],
    [
        'isNull', 'null',
        [null], [false],
    ],
    [
        'isUndefined', 'undefined',
        [undefined], [null],
    ],
    [
        'isString', 'string',
        // tslint:disable-next-line:trailing-comma
        ['a'], [null],
    ],
    [
        'isNumber', 'number',
        [4, Infinity], [null, NaN],
    ],
    [
        'isSymbol', 'symbol',
        [Symbol('')], [null],
    ],
    [
        'isFunction', 'function',
        [function () { return 1; }, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, 1];
            }); }); }], [null],
    ],
    [
        'isArray', 'array',
        [[]], [null],
    ],
    [
        'isObject', 'object',
        [{}], [null],
    ],
    [
        'isRegExp', 'regexp',
        [new RegExp('')], [null],
    ],
    [
        'isDate', 'date',
        [new Date()], [null],
    ],
];
describe('typeOf', function () {
    samples.forEach(function (_a) {
        var fnKey = _a[0], type = _a[1], goodValues = _a[2], badValues = _a[3];
        it("typeOf." + fnKey, function () {
            goodValues.forEach(function (value) {
                expect(typeOf_1.typeOf(value)).toBe(type);
                expect((typeOf_1.typeOf[fnKey](value))).toBe(true);
            });
            badValues.forEach(function (value) {
                expect(typeOf_1.typeOf(value)).not.toBe(type);
                expect((typeOf_1.typeOf[fnKey](value))).toBe(false);
                samples.forEach(function (counterSample) {
                    if (counterSample[0] === fnKey) {
                        return;
                    }
                    var counterValues = counterSample[2];
                    counterValues.forEach(function (counterValue) {
                        expect(typeOf_1.typeOf(counterValue)).not.toBe(type);
                        expect((typeOf_1.typeOf[fnKey](counterValue))).toBe(false);
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=typeOf.spec.js.map