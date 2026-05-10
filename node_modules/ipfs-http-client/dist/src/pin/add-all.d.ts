/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/pin').API<HTTPClientExtraOptions>} PinAPI
 */
export const createAddAll: import("../lib/configure.js").Factory<(source: import("ipfs-core-types").AwaitIterable<import("ipfs-core-types/src/pin").AddInput>, options?: (import("ipfs-core-types/src/pin").AddAllOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<CID<unknown, number, number, import("multiformats/cid").Version>>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type PinAPI = import('ipfs-core-types/src/pin').API<HTTPClientExtraOptions>;
//# sourceMappingURL=add-all.d.ts.map