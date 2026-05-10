/**
 * @param {import('../types').Options} config
 */
export function createBlock(config: import('../types').Options): {
    get: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types").AbortOptions & import("ipfs-core-types/src/utils.js").PreloadOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<Uint8Array>;
    put: (block: Uint8Array, options?: (import("ipfs-core-types/src/block/index.js").PutOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
    rm: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version> | import("multiformats").CID<unknown, number, number, import("multiformats").Version>[], options?: (import("ipfs-core-types/src/block/index.js").RmOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/block/index.js").RmResult>;
    stat: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types").AbortOptions & import("ipfs-core-types/src/utils.js").PreloadOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/block/index.js").StatResult>;
};
//# sourceMappingURL=index.d.ts.map