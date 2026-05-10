/**
 * @typedef {import('./types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/root').API<HTTPClientExtraOptions>} RootAPI
 */
export const createLs: import("./lib/configure.js").Factory<(ipfsPath: import("ipfs-core-types/src/utils.js").IPFSPath, options?: (import("ipfs-core-types/src/root").ListOptions & import("./types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/root").IPFSEntry>>;
export type HTTPClientExtraOptions = import('./types').HTTPClientExtraOptions;
export type RootAPI = import('ipfs-core-types/src/root').API<HTTPClientExtraOptions>;
//# sourceMappingURL=ls.d.ts.map