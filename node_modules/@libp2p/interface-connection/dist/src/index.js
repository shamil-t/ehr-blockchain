export const symbol = Symbol.for('@libp2p/connection');
export function isConnection(other) {
    return other != null && Boolean(other[symbol]);
}
//# sourceMappingURL=index.js.map