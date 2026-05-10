"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardforks = void 0;
exports.lt = lt;
exports.hardforks = [
    'genesis',
    't0',
    't1',
    't1a',
    't1b',
    't1c',
    't2',
    't3',
];
function lt(current, target) {
    return exports.hardforks.indexOf(current) < exports.hardforks.indexOf(target);
}
//# sourceMappingURL=Hardfork.js.map