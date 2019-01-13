"use strict";
// tslint:disable:no-console
// tslint:disable:max-classes-per-file
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var typeOf_1 = require("../typeOf");
var tests = {
    merge: function (_a) {
        var isTraversal = _a.isTraversal, obj1 = _a.obj1, key = _a.key;
        return !isTraversal || key in obj1;
    },
    white: function (_a) {
        var isTraversal = _a.isTraversal, key = _a.key, obj2 = _a.obj2;
        return isTraversal || key in obj2;
    },
    black: function (_a) {
        var isTraversal = _a.isTraversal, key = _a.key, obj1 = _a.obj1;
        return isTraversal || !(key in obj1);
    },
};
var Merge = (function () {
    function Merge(options) {
        var _this = this;
        this.depth = 10;
        this.types = { object: true, array: true };
        this.test = tests.merge;
        this.traverseTargetKeys = false;
        this.usingDefaultDepth = true;
        /** Recursively merges `sources` objects into `subject` */
        this.merge = function (subject) {
            var sources = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                sources[_i - 1] = arguments[_i];
            }
            var len = sources.length;
            if (!subject || !sources.length) {
                throw new Error('[ERROR merge] Invalid parameters');
            }
            for (var i = 0; i < len; ++i) {
                _this.traverse(subject, sources[i], _this.depth);
            }
            return subject;
        };
        if (options) {
            Object.keys(options).forEach(function (key) { return _this[key] = options[key]; });
            // Used to emit warnings
            this.usingDefaultDepth = !('depth' in options);
        }
        // If there is no test, always pass
        this.alwaysPass = !this.test;
    }
    Merge.prototype.traverse = function (obj1, obj2, depth) {
        var _this = this;
        if (--depth < 0) {
            this.depthWarning();
            return obj1;
        }
        var target = this.traverseTargetKeys ? obj1 : obj2;
        Object.keys(target).forEach(function (key) {
            var nextObj1 = obj1[key];
            var nextObj2 = obj2[key];
            var obj1Type = typeOf_1.typeOf(nextObj1);
            var obj2Type = typeOf_1.typeOf(nextObj2);
            var isTraversal = _this.types[obj2Type] && _this.types[obj1Type];
            var isPassing = _this.alwaysPass || _this.test({
                merge: _this, key: key,
                obj1: obj1, obj2: obj2, isTraversal: isTraversal,
            });
            if (!isPassing) {
                return;
            }
            if (isTraversal) {
                _this.traverse(nextObj1, nextObj2, depth);
            }
            else {
                obj1[key] = obj2[key];
            }
        });
    };
    Merge.prototype.depthWarning = function () {
        if (this.usingDefaultDepth) {
            var stack = new Error().stack;
            console.warn("[WARNING merge] default depth of " + this.depth + " reached. Be explicit, set this manually");
            console.warn(stack);
        }
    };
    return Merge;
}());
exports.Merge = Merge;
var MergeWhite = (function (_super) {
    __extends(MergeWhite, _super);
    function MergeWhite() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.test = tests.white;
        _this.traverseTargetKeys = true;
        return _this;
    }
    return MergeWhite;
}(Merge));
exports.MergeWhite = MergeWhite;
var MergeBlack = (function (_super) {
    __extends(MergeBlack, _super);
    function MergeBlack() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.test = tests.black;
        return _this;
    }
    return MergeBlack;
}(Merge));
exports.MergeBlack = MergeBlack;
Merge.White = MergeWhite;
Merge.Black = MergeBlack;
exports.merge = new Merge().merge;
exports.merge.black = new MergeBlack().merge;
exports.merge.white = new MergeWhite().merge;
//# sourceMappingURL=merge.js.map