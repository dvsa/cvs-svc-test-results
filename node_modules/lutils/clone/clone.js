"use strict";
// tslint:disable:no-console
Object.defineProperty(exports, "__esModule", { value: true });
var typeOf_1 = require("../typeOf");
var Clone = (function () {
    function Clone(options) {
        var _this = this;
        this.depth = 10;
        this.types = { object: true, array: true };
        this.usingDefaultDepth = true;
        /**
         * Clones an object by traversing over object-like values.
         * - Cloned: **Array**, **Object**
         * - Referenced: **Function**, **{}.\_\_proto\_\_**
         */
        this.clone = function (source) {
            if (!source) {
                throw new Error('[ERROR clone] Invalid parameters');
            }
            var subject = _this.skeletonize(source);
            return _this.traverse(subject, source, _this.depth);
        };
        if (options) {
            Object.keys(options).forEach(function (key) { return _this[key] = options[key]; });
            this.usingDefaultDepth = !('depth' in options);
        }
    }
    Clone.prototype.traverse = function (subject, source, depth) {
        var _this = this;
        if (--depth < 0) {
            this.depthWarning();
            return subject;
        }
        if (!subject) {
            subject = source;
        }
        Object.keys(source).forEach(function (key) {
            var value = source[key];
            var type = typeOf_1.typeOf(value);
            if (_this.types[type]) {
                var nextSubject = _this.skeletonize(value, type);
                value = _this.traverse(nextSubject, value, depth);
            }
            subject[key] = value;
        });
        return subject;
    };
    Clone.prototype.skeletonize = function (value, type) {
        if (!type) {
            type = typeOf_1.typeOf(value);
        }
        if (!this.types[type]) {
            return;
        }
        if (type === 'object') {
            return value.__proto__
                ? Object.create(value.__proto__)
                : {};
        }
        else if (type === 'array') {
            return [];
        }
    };
    Clone.prototype.depthWarning = function () {
        if (this.usingDefaultDepth) {
            var stack = new Error().stack;
            console.warn("[WARNING clone] default depth of " + this.depth + " reached. Be explicit, set this manually");
            console.warn(stack);
        }
    };
    return Clone;
}());
exports.Clone = Clone;
exports.clone = new Clone().clone;
//# sourceMappingURL=clone.js.map