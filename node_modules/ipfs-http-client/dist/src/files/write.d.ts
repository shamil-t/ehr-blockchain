/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/files').API<HTTPClientExtraOptions>} FilesAPI
 */
export const createWrite: import("../lib/configure.js").Factory<(ipfsPath: string, content: string | Blob | Uint8Array | Iterable<Uint8Array> | AsyncIterable<Uint8Array>, options?: (import("ipfs-core-types/src/files").WriteOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type FilesAPI = import('ipfs-core-types/src/files').API<HTTPClientExtraOptions>;
//# sourceMappingURL=write.d.ts.map