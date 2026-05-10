/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/pubsub').API<HTTPClientExtraOptions>} PubsubAPI
 */
export const createPeers: import("../lib/configure.js").Factory<(topic: string, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("@libp2p/interface-peer-id").PeerId[]>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type PubsubAPI = import('ipfs-core-types/src/pubsub').API<HTTPClientExtraOptions>;
//# sourceMappingURL=peers.d.ts.map