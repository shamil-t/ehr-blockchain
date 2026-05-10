/**
 * @typedef {import('./types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/root').API<HTTPClientExtraOptions>} RootAPI
 */
export const createGet: import("./lib/configure.js").Factory<(ipfsPath: import("ipfs-core-types/src/utils.js").IPFSPath, options?: (import("ipfs-core-types/src/root").GetOptions & import("./types").HTTPClientExtraOptions) | undefined) => AsyncIterable<Uint8Array>>;
export type HTTPClientExtraOptions = import('./types').HTTPClientExtraOptions;
export type RootAPI = import('ipfs-core-types/src/root').API<HTTPClientExtraOptions>;
//# sourceMappingURL=get.d.ts.map