export const hardforks = [
    'genesis',
    't0',
    't1',
    't1a',
    't1b',
    't1c',
    't2',
    't3',
];
/** Returns `true` if `current` is before `target`. */
export function lt(current, target) {
    return hardforks.indexOf(current) < hardforks.indexOf(target);
}
//# sourceMappingURL=Hardfork.js.map