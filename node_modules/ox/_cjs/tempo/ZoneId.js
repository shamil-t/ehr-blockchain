"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainIdBase = void 0;
exports.fromChainId = fromChainId;
exports.toChainId = toChainId;
exports.chainIdBase = 4_217_000_000;
function fromChainId(chainId) {
    return chainId - exports.chainIdBase;
}
function toChainId(zoneId) {
    return exports.chainIdBase + zoneId;
}
//# sourceMappingURL=ZoneId.js.map