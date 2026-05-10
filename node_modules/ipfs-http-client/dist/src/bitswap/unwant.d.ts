/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/bitswap').API<HTTPClientExtraOptions>} BitswapAPI
 */
export const createUnwant: import("../lib/configure.js").Factory<(cids: import("multiformats").CID<unknown, number, number, import("multiformats").Version> | import("multiformats").CID<unknown, number, number, import("multiformats").Version>[], options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type BitswapAPI = import('ipfs-core-types/src/bitswap').API<HTTPClientExtraOptions>;
//# sourceMappingURL=unwant.d.ts.map