/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/block').API<HTTPClientExtraOptions>} BlockAPI
 */
export const createGet: import("../lib/configure.js").Factory<(cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types").AbortOptions & import("ipfs-core-types/src/utils.js").PreloadOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<Uint8Array>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type BlockAPI = import('ipfs-core-types/src/block').API<HTTPClientExtraOptions>;
//# sourceMappingURL=get.d.ts.map