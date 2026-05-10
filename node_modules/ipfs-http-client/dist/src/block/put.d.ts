/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/block').API<HTTPClientExtraOptions>} BlockAPI
 */
export const createPut: import("../lib/configure.js").Factory<(block: Uint8Array, options?: (import("ipfs-core-types/src/block").PutOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<CID<unknown, number, number, import("multiformats/cid").Version>>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type BlockAPI = import('ipfs-core-types/src/block').API<HTTPClientExtraOptions>;
//# sourceMappingURL=put.d.ts.map