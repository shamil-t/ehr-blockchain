/**
 * Get the futures from a module, including its submodules.
 * No ordering is enforced.
 */
export function getFuturesFromModule(module) {
    return [...module.futures].concat(Array.from(module.submodules).flatMap((sub) => getFuturesFromModule(sub)));
}
//# sourceMappingURL=get-futures-from-module.js.map