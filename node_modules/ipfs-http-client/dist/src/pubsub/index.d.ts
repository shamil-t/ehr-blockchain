/**
 * @param {import('../types').Options} config
 */
export function createPubsub(config: import('../types').Options): {
    ls: (options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<string[]>;
    peers: (topic: string, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<import("@libp2p/interface-peer-id").PeerId[]>;
    publish: (topic: string, data: Uint8Array, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
    subscribe: (topic: string, handler: import("@libp2p/interfaces/dist/src/events.js").EventHandler<import("@libp2p/interface-pubsub").Message>, options?: (import("ipfs-core-types/src/pubsub/index.js").SubscribeOptions & import("../types").HTTPClientExtraOptions & {
        onError?: import("./subscribe.js").ErrorHandlerFn | undefined;
    }) | undefined) => Promise<void>;
    unsubscribe: (topic: string, handler?: import("@libp2p/interfaces/dist/src/events.js").EventHandler<import("@libp2p/interface-pubsub").Message> | undefined, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map