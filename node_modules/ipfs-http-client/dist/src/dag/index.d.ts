/**
 * @param {import('ipfs-core-utils/multicodecs').Multicodecs} codecs
 * @param {import('../types').Options} config
 */
export function createDag(codecs: import('ipfs-core-utils/multicodecs').Multicodecs, config: import('../types').Options): {
    export: (root: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types/src/dag/index.js").ExportOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<Uint8Array>;
    get: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types/src/dag/index.js").GetOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/dag/index.js").GetResult>;
    import: (sources: Iterable<Uint8Array> | AsyncIterable<Uint8Array> | AsyncIterable<AsyncIterable<Uint8Array>> | Iterable<AsyncIterable<Uint8Array>>, options?: (import("ipfs-core-types/src/dag/index.js").ImportOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/dag/index.js").ImportResult>;
    put: (node: any, options?: (import("ipfs-core-types/src/dag/index.js").PutOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
    resolve: (ipfsPath: import("ipfs-core-types/src/utils.js").IPFSPath, options?: (import("ipfs-core-types/src/dag/index.js").ResolveOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/dag/index.js").ResolveResult>;
};
//# sourceMappingURL=index.d.ts.map