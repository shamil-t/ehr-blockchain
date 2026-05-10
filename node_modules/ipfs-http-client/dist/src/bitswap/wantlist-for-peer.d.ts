/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/bitswap').API<HTTPClientExtraOptions>} BitswapAPI
 */
export const createWantlistForPeer: import("../lib/configure.js").Factory<(peerId: import("@libp2p/interface-peer-id").PeerId, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<CID<unknown, number, number, import("multiformats/cid").Version>[]>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type BitswapAPI = import('ipfs-core-types/src/bitswap').API<HTTPClientExtraOptions>;
//# sourceMappingURL=wantlist-for-peer.d.ts.map