/**
 * @typedef {import('../../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/object/patch').API<HTTPClientExtraOptions>} ObjectPatchAPI
 */
export const createAddLink: import("../../lib/configure.js").Factory<(cid: CID<unknown, number, number, import("multiformats/cid").Version>, link: import("@ipld/dag-pb/dist/src/interface.js").PBLink, options?: (import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) | undefined) => Promise<CID<unknown, number, number, import("multiformats/cid").Version>>>;
export type HTTPClientExtraOptions = import('../../types').HTTPClientExtraOptions;
export type ObjectPatchAPI = import('ipfs-core-types/src/object/patch').API<HTTPClientExtraOptions>;
//# sourceMappingURL=add-link.d.ts.map