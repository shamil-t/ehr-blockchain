export const symbol = Symbol.for('@libp2p/peer-id');
export function isPeerId(other) {
    return other != null && Boolean(other[symbol]);
}
//# sourceMappingURL=index.js.map