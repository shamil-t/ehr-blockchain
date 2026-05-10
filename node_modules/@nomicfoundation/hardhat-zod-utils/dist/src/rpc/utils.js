export function isRpcQuantityString(u) {
    return (typeof u === "string" && /^0x(?:0|(?:[1-9a-fA-F][0-9a-fA-F]*))$/.test(u));
}
export function isRpcDataString(u) {
    return typeof u === "string" && /^0x(?:[0-9a-fA-F]{2})*$/.test(u);
}
//# sourceMappingURL=utils.js.map