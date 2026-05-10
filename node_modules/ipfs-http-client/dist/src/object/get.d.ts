/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/object').API<HTTPClientExtraOptions>} ObjectAPI
 */
export const createGet: import("../lib/configure.js").Factory<(cid: CID<unknown, number, number, import("multiformats/cid").Version>, options?: (import("ipfs-core-types").AbortOptions & import("ipfs-core-types/src/utils.js").PreloadOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("@ipld/dag-pb/dist/src/interface.js").PBNode>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type ObjectAPI = import('ipfs-core-types/src/object').API<HTTPClientExtraOptions>;
//# sourceMappingURL=get.d.ts.map