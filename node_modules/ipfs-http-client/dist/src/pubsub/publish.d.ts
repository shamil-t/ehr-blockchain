/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/pubsub').API<HTTPClientExtraOptions>} PubsubAPI
 */
export const createPublish: import("../lib/configure.js").Factory<(topic: string, data: Uint8Array, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<void>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type PubsubAPI = import('ipfs-core-types/src/pubsub').API<HTTPClientExtraOptions>;
//# sourceMappingURL=publish.d.ts.map