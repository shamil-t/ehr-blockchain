/**
 * @param {import('../types').Options} config
 */
export function createSwarm(config: import('../types').Options): {
    addrs: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/swarm/index.js").AddrsResult[]>;
    connect: (multiaddrOrPeerId: import("@multiformats/multiaddr").Multiaddr | import("@libp2p/interface-peer-id").PeerId, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    disconnect: (multiaddrOrPeerId: import("@multiformats/multiaddr").Multiaddr | import("@libp2p/interface-peer-id").PeerId, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    localAddrs: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("@multiformats/multiaddr").Multiaddr[]>;
    peers: (options?: (import("ipfs-core-types/src/swarm/index.js").PeersOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/swarm/index.js").PeersResult[]>;
};
//# sourceMappingURL=index.d.ts.map