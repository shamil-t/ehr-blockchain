/**
 * @param {import('../types').Options} config
 */
export function createFiles(config: import('../types').Options): {
    chmod: (path: string, mode: string | number, options?: (import("ipfs-core-types/src/files/index.js").ChmodOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    cp: (from: import("ipfs-core-types/src/utils.js").IPFSPath | import("ipfs-core-types/src/utils.js").IPFSPath[], to: string, options?: (import("ipfs-core-types/src/files/index.js").CpOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    flush: (ipfsPath: string, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
    ls: (ipfsPath: import("ipfs-core-types/src/utils.js").IPFSPath, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/files/index.js").MFSEntry>;
    mkdir: (path: string, options?: (import("ipfs-core-types/src/files/index.js").MkdirOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    mv: (from: string | string[], to: string, options?: (import("ipfs-core-types/src/files/index.js").MvOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    read: (ipfsPath: import("ipfs-core-types/src/utils.js").IPFSPath, options?: (import("ipfs-core-types/src/files/index.js").ReadOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<Uint8Array>;
    rm: (ipfsPaths: string | string[], options?: (import("ipfs-core-types/src/files/index.js").RmOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    stat: (ipfsPath: import("ipfs-core-types/src/utils.js").IPFSPath, options?: (import("ipfs-core-types/src/files/index.js").StatOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/files/index.js").StatResult>;
    touch: (ipfsPath: string, options?: (import("ipfs-core-types/src/files/index.js").TouchOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    write: (ipfsPath: string, content: string | Blob | Uint8Array | Iterable<Uint8Array> | AsyncIterable<Uint8Array>, options?: (import("ipfs-core-types/src/files/index.js").WriteOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map