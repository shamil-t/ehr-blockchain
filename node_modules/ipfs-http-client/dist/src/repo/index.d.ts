/**
 * @param {import('../types').Options} config
 */
export function createRepo(config: import('../types').Options): {
    gc: (options?: (import("ipfs-core-types/src/repo/index.js").GCOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/repo/index.js").GCResult>;
    stat: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/repo/index.js").StatResult>;
    version: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<number>;
};
//# sourceMappingURL=index.d.ts.map