/**
 * @param {import('../types').Options} config
 */
export function createBootstrap(config: import('../types').Options): {
    add: (addr: import("@multiformats/multiaddr").Multiaddr, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<{
        Peers: import("@multiformats/multiaddr").Multiaddr[];
    }>;
    clear: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<{
        Peers: import("@multiformats/multiaddr").Multiaddr[];
    }>;
    list: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<{
        Peers: import("@multiformats/multiaddr").Multiaddr[];
    }>;
    reset: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<{
        Peers: import("@multiformats/multiaddr").Multiaddr[];
    }>;
    rm: (addr: import("@multiformats/multiaddr").Multiaddr, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<{
        Peers: import("@multiformats/multiaddr").Multiaddr[];
    }>;
};
//# sourceMappingURL=index.d.ts.map