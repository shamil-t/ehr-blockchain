/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/dht').API<HTTPClientExtraOptions>} DHTAPI
 */
export const createQuery: import("../lib/configure.js").Factory<(peerId: import("multiformats").CID<unknown, number, number, import("multiformats").Version> | import("@libp2p/interface-peer-id").PeerId, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/dht").QueryEvent>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type DHTAPI = import('ipfs-core-types/src/dht').API<HTTPClientExtraOptions>;
//# sourceMappingURL=query.d.ts.map