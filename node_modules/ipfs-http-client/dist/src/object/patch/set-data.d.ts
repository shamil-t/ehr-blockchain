/**
 * @typedef {import('../../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/object/patch').API<HTTPClientExtraOptions>} ObjectPatchAPI
 */
export const createSetData: import("../../lib/configure.js").Factory<(cid: CID<unknown, number, number, import("multiformats/cid").Version>, data: Uint8Array, options?: (import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) | undefined) => Promise<CID<unknown, number, number, import("multiformats/cid").Version>>>;
export type HTTPClientExtraOptions = import('../../types').HTTPClientExtraOptions;
export type ObjectPatchAPI = import('ipfs-core-types/src/object/patch').API<HTTPClientExtraOptions>;
//# sourceMappingURL=set-data.d.ts.map