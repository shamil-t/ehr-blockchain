/**
 * @param {import('../types').Options} config
 */
export function createStats(config: import('../types').Options): {
    bitswap: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/bitswap/index.js").Stats>;
    repo: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/repo/index.js").StatResult>;
    bw: (options?: (import("ipfs-core-types/src/stats/index.js").BWOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/stats/index.js").BWResult>;
};
//# sourceMappingURL=index.d.ts.map