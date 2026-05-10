/**
 * @param {import('../types').Options} config
 */
export function createDht(config: import('../types').Options): {
    findPeer: (peerId: import("@libp2p/interface-peer-id").PeerId, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/dht/index.js").QueryEvent>;
    findProvs: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/dht/index.js").QueryEvent>;
    get: (key: string | Uint8Array, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/dht/index.js").QueryEvent>;
    provide: (cid: import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types/src/dht/index.js").DHTProvideOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/dht/index.js").QueryEvent>;
    put: (key: string | Uint8Array, value: Uint8Array, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/dht/index.js").QueryEvent>;
    query: (peerId: import("multiformats").CID<unknown, number, number, import("multiformats").Version> | import("@libp2p/interface-peer-id").PeerId, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<import("ipfs-core-types/src/dht/index.js").QueryEvent>;
};
//# sourceMappingURL=index.d.ts.map