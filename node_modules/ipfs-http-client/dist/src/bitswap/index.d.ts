/**
 * @param {import('../types').Options} config
 */
export function createBitswap(config: import('../types').Options): {
    wantlist: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>[]>;
    wantlistForPeer: (peerId: import("@libp2p/interface-peer-id").PeerId, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("multiformats").CID<unknown, number, number, import("multiformats").Version>[]>;
    unwant: (cids: import("multiformats").CID<unknown, number, number, import("multiformats").Version> | import("multiformats").CID<unknown, number, number, import("multiformats").Version>[], options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    stat: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/bitswap/index.js").Stats>;
};
//# sourceMappingURL=index.d.ts.map