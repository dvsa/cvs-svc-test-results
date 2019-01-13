"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var clone_1 = require("./clone");
describe('clone', function () {
    var regex;
    var Class;
    var payload = {
        z: { d: { b: 1 } },
        a: [
            {}, {
                b: regex = /aaa/i,
                c: (function () {
                    var fn;
                    fn = function () {
                        return true;
                    };
                    fn.b = function () {
                        return fn();
                    };
                    fn.o = {};
                    fn.o2 = {
                        x: { z: 1 },
                    };
                    return fn;
                })(),
                d: Class = (function () {
                    function Test() {
                        this.val = true;
                    }
                    Test.prototype.a = function () {
                        return this.val;
                    };
                    return Test;
                })(),
                e: new Class(),
            },
        ],
    };
    it('clones (default)', function () {
        var actual = clone_1.clone(payload);
        expect(actual).not.toBe(payload);
        expect(actual).toEqual(payload);
        // Arrays - cloned
        expect(actual.a).not.toBe(payload.a);
        // Objects - cloned
        expect(actual.a[1]).not.toBe(payload.a[1]);
        // Regex - reference
        expect(actual.a[1].b).toBe(payload.a[1].b);
        // Functions - reference
        expect(actual.a[1].c).toBe(payload.a[1].c);
        // Function props - reference
        expect(actual.a[1].c.o).toBe(payload.a[1].c.o);
        // Classes - cloned
        expect(actual.a[1].d).toBe(payload.a[1].d);
        expect(actual.a[1].e).not.toBe(payload.a[1].e);
        // __proto__ - referenced
        expect(actual.a[1].d.__proto__).toBe(payload.a[1].d.__proto__);
        expect(actual.a[1].e.__proto__).toBe(payload.a[1].e.__proto__);
    });
    it('clones at arbitrary depth');
    it('can be configured to not clone arrays', function () {
        var actual = new clone_1.Clone({
            types: { object: true, array: false },
        }).clone(payload);
        expect(actual).not.toBe(payload);
        expect(actual).toEqual(payload);
        expect(actual.a).toBe(payload.a);
        expect(actual.z).not.toBe(payload.z);
        expect(actual.z.d).not.toBe(payload.z.d);
    });
});
//# sourceMappingURL=clone.spec.js.map