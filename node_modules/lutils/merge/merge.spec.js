"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var merge_1 = require("./merge");
describe('Merge', function () {
    it('basic merge', function () {
        var expected = {
            a: { b: {} },
            c: {},
            d: 2,
        };
        var merged = merge_1.merge({ c: 'overwriteMe', d: 'overwriteMe' }, expected);
        expect(merged).toEqual(expected);
        expect(merged.c).toBe(expected.c);
        expect(merged.d).toBe(expected.d);
    });
    it('basic merge 2', function () {
        var merged2 = merge_1.merge({ c: 'overwriteMe', d: 'overwriteMe' }, { c: 1, d: 1, a: { b: 1 }, f: 1 }, { a: { x: 1, b: 2 } });
        expect(merged2.c).toBe(1);
        expect(merged2.d).toBe(1);
        expect(merged2.a.x).toBe(1);
        expect(merged2.a.b).toBe(2);
        expect(merged2.f).toBe(1);
    });
    it('merges with depth limits', function () {
        var subject = { a: { b: 1 } };
        new merge_1.Merge({ depth: 0 }).merge(subject, { a: 1 });
        expect(subject.a).toBe(subject.a);
        new merge_1.Merge({ depth: 1 }).merge(subject, { a: 1 });
        expect(subject.a).toBe(1);
    });
    it('preserves references', function () {
        var subject = {
            a: { b: { c: 1 } },
        };
        var fragment = subject.a.b;
        merge_1.merge(subject, { a: { b: { c: 2 } } });
        expect(subject.a.b).toBe(fragment);
    });
    it('merge.white', function () {
        var obj1 = { a: { notIgnored: false } };
        var obj2 = { a: { notIgnored: true, ignored: true } };
        merge_1.merge.white(obj1, obj2);
        expect(obj1.a).not.toBe(obj2.a);
        expect(obj1.a.notIgnored).toBe(true);
        expect(obj1.a.ignored).toBe(undefined);
    });
    it('new Merge.White().merge', function () {
        var obj1 = { a: { notIgnored: false } };
        var obj2 = { a: { notIgnored: true, ignored: true } };
        new merge_1.Merge.White().merge(obj1, obj2);
        expect(obj1.a).not.toBe(obj2.a);
        expect(obj1.a.notIgnored).toBe(true);
        expect(obj1.a.ignored).toBe(undefined);
    });
    it('merge.black', function () {
        var obj1 = { a: { ignored: false } };
        var obj2 = { a: { ignored: true, notIgnored: true } };
        merge_1.merge.black(obj1, obj2);
        expect(obj1.a).not.toBe(obj2.a);
        expect(obj1.a.notIgnored).toBe(true);
        expect(obj1.a.ignored).toBe(false);
    });
});
//# sourceMappingURL=merge.spec.js.map