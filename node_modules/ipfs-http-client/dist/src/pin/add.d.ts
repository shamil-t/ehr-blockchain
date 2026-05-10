/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/pin').API<HTTPClientExtraOptions>} PinAPI
 */
/**
 * @param {import('../types').Options} config
 */
export function createAdd(config: import('../types').Options): (cid: string | import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types/src/pin").AddOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type PinAPI = import('ipfs-core-types/src/pin').API<HTTPClientExtraOptions>;
//# sourceMappingURL=add.d.ts.map