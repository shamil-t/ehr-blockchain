/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/name').API<HTTPClientExtraOptions>} NameAPI
 */
export const createResolve: import("../lib/configure.js").Factory<(value: string | import("@libp2p/interface-peer-id").PeerId, options?: (import("ipfs-core-types/src/name").ResolveOptions & import("../types").HTTPClientExtraOptions) | undefined) => AsyncIterable<string>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type NameAPI = import('ipfs-core-types/src/name').API<HTTPClientExtraOptions>;
//# sourceMappingURL=resolve.d.ts.map