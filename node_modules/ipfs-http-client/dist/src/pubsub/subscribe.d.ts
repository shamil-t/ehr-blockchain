export function createSubscribe(options: Options, subsTracker: import('./subscription-tracker').SubscriptionTracker): (topic: string, handler: import("@libp2p/interfaces/dist/src/events.js").EventHandler<import("@libp2p/interface-pubsub").Message>, options?: (import("ipfs-core-types/src/pubsub").SubscribeOptions & import("../types").HTTPClientExtraOptions & {
    onError?: ErrorHandlerFn | undefined;
}) | undefined) => Promise<void>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type Message = import('@libp2p/interface-pubsub').Message;
export type ErrorHandlerFn = (err: Error, fatal: boolean, msg?: Message) => void;
export type PubsubAPI = import('ipfs-core-types/src/pubsub').API<HTTPClientExtraOptions & {
    onError?: ErrorHandlerFn;
}>;
export type Options = import('../types').Options;
//# sourceMappingURL=subscribe.d.ts.map