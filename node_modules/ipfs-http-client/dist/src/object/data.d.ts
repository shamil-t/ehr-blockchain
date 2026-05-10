/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/object').API<HTTPClientExtraOptions>} ObjectAPI
 */
export const createData: import("../lib/configure.js").Factory<(cid: CID<unknown, number, number, import("multiformats/cid").Version>, options?: (import("ipfs-core-types").AbortOptions & import("ipfs-core-types/src/utils.js").PreloadOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<Uint8Array>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type ObjectAPI = import('ipfs-core-types/src/object').API<HTTPClientExtraOptions>;
//# sourceMappingURL=data.d.ts.map