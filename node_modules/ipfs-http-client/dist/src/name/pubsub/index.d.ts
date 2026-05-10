/**
 * @param {import('../../types').Options} config
 */
export function createPubsub(config: import('../../types').Options): {
    cancel: (name: string, options?: (import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/name/pubsub/index.js").PubsubCancelResult>;
    state: (options?: (import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/name/pubsub/index.js").PubsubStateResult>;
    subs: (options?: (import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) | undefined) => Promise<string[]>;
};
//# sourceMappingURL=index.d.ts.map