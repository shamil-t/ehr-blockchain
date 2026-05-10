/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/files').API<HTTPClientExtraOptions>} FilesAPI
 */
export const createRead: import("../lib/configure.js").Factory<(ipfsPath: import("ipfs-core-types/src/utils.js").IPFSPath, options?: (import("ipfs-core-types/src/files").ReadOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<Uint8Array>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type FilesAPI = import('ipfs-core-types/src/files').API<HTTPClientExtraOptions>;
//# sourceMappingURL=read.d.ts.map