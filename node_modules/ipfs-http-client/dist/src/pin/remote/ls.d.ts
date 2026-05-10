/**
 * @typedef {import('../../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/pin/remote').API<HTTPClientExtraOptions>} RemotePiningAPI
 */
/**
 * @param {import('../../lib/core').Client} client
 */
export function createLs(client: import('../../lib/core').Client): (query: import("ipfs-core-types/src/pin/remote").Query & import("ipfs-core-types").AbortOptions & import("../../types").HTTPClientExtraOptions) => AsyncIterable<import("ipfs-core-types/src/pin/remote").Pin>;
export type HTTPClientExtraOptions = import('../../types').HTTPClientExtraOptions;
export type RemotePiningAPI = import('ipfs-core-types/src/pin/remote').API<HTTPClientExtraOptions>;
//# sourceMappingURL=ls.d.ts.map