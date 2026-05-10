/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/swarm').API<HTTPClientExtraOptions>} SwarmAPI
 */
export const createDisconnect: import("../lib/configure.js").Factory<(multiaddrOrPeerId: import("@multiformats/multiaddr").Multiaddr | import("@libp2p/interface-peer-id").PeerId, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type SwarmAPI = import('ipfs-core-types/src/swarm').API<HTTPClientExtraOptions>;
//# sourceMappingURL=disconnect.d.ts.map