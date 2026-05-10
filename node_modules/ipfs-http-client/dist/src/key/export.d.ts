/**
 * @typedef {import('../types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('ipfs-core-types/src/key').API<HTTPClientExtraOptions>} KeyAPI
 */
export const createExport: import("../lib/configure.js").Factory<(name: string, password: string, options?: (import("ipfs-core-types").AbortOptions & import("../types").HTTPClientExtraOptions) | undefined) => Promise<string>>;
export type HTTPClientExtraOptions = import('../types').HTTPClientExtraOptions;
export type KeyAPI = import('ipfs-core-types/src/key').API<HTTPClientExtraOptions>;
//# sourceMappingURL=export.d.ts.map