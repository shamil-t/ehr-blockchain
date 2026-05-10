/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/name').API<HTTPClientExtraOptions>} NameAPI
 */
export const createPublish: import("../lib/configure.js").Factory<(value: string | import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types/src/name").PublishOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/name").PublishResult>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type NameAPI = import('ipfs-core-types/src/name').API<HTTPClientExtraOptions>;
//# sourceMappingURL=publish.d.ts.map