/**
 * @typedef {import('multiformats/codecs/interface').BlockCodec<any, any>} BlockCodec
 * @typedef {import('multiformats/hashes/interface').MultihashHasher} MultihashHasher
 * @typedef {import('multiformats/bases/interface').MultibaseCodec<any>} MultibaseCodec
 * @typedef {import('./types').Options} Options
 * @typedef {import('./types').LoadBaseFn} LoadBaseFn
 * @typedef {import('./types').LoadCodecFn} LoadCodecFn
 * @typedef {import('./types').LoadHasherFn} LoadHasherFn
 * @typedef {import('./types').IPLDOptions} IPLDOptions
 * @typedef {import('./types').HTTPClientExtraOptions} HTTPClientExtraOptions
 * @typedef {import('./types').EndpointConfig} EndpointConfig
 * @typedef {import('./types').IPFSHTTPClient} IPFSHTTPClient
 */
/**
 * @param {Options} options
 */
export function create(options?: Options): import("./types").IPFSHTTPClient;
export { CID } from "multiformats/cid";
export { multiaddr } from "@multiformats/multiaddr";
export { default as urlSource } from "ipfs-utils/src/files/url-source.js";
export const globSource: typeof globSourceImport;
export type BlockCodec = import('multiformats/codecs/interface').BlockCodec<any, any>;
export type MultihashHasher = import('multiformats/hashes/interface').MultihashHasher;
export type MultibaseCodec = import('multiformats/bases/interface').MultibaseCodec<any>;
export type Options = import('./types').Options;
export type LoadBaseFn = import('./types').LoadBaseFn;
export type LoadCodecFn = import('./types').LoadCodecFn;
export type LoadHasherFn = import('./types').LoadHasherFn;
export type IPLDOptions = import('./types').IPLDOptions;
export type HTTPClientExtraOptions = import('./types').HTTPClientExtraOptions;
export type EndpointConfig = import('./types').EndpointConfig;
export type IPFSHTTPClient = import('./types').IPFSHTTPClient;
import globSourceImport from "ipfs-utils/src/files/glob-source.js";
//# sourceMappingURL=index.d.ts.map