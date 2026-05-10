/**
 * @param {import('../types').Options} config
 */
export function createName(config: import('../types').Options): {
    publish: (value: string | import("multiformats").CID<unknown, number, number, import("multiformats").Version>, options?: (import("ipfs-core-types/src/name/index.js").PublishOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/name/index.js").PublishResult>;
    resolve: (value: string | import("@libp2p/interface-peer-id").PeerId, options?: (import("ipfs-core-types/src/name/index.js").ResolveOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<string>;
    pubsub: {
        cancel: (name: string, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/name/pubsub/index.js").PubsubCancelResult>;
        state: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/name/pubsub/index.js").PubsubStateResult>;
        subs: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<string[]>;
    };
};
//# sourceMappingURL=index.d.ts.map