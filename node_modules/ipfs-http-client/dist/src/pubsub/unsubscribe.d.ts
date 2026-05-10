export function createUnsubscribe(options: Options, subsTracker: import('./subscription-tracker').SubscriptionTracker): (topic: string, handler?: import("@libp2p/interfaces/dist/src/events").EventHandler<import("@libp2p/interface-pubsub").Message> | undefined, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type PubsubAPI = import('ipfs-core-types/src/pubsub').API<HTTPClientExtraOptions>;
export type Options = import('../types').Options;
//# sourceMappingURL=unsubscribe.d.ts.map