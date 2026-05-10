/**
 * @typedef {import('./types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/root').API<HTTPClientExtraOptions>} RootAPI
 */
/**
 * @param {import('./types').Options} options
 */
export function createAdd(options: import('./types').Options): (entry: import("ipfs-core-types/src/utils.js").ImportCandidate, options?: (import("ipfs-core-types/src/root").AddOptions & import("./types").HTTPClientExtraOptions) | undefined) => Promise<import("ipfs-core-types/src/root").AddResult>;
export type HTTPClientExtraOptions = import('./types').HTTPClientExtraOptions;
export type RootAPI = import('ipfs-core-types/src/root').API<HTTPClientExtraOptions>;
//# sourceMappingURL=add.d.ts.map