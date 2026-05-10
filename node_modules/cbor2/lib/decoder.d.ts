import { D as DecodeOptions } from './options-BZO68bQ0.js';
import './sorts.js';

/**
 * Decode CBOR bytes to a JS value.
 *
 * @param src CBOR bytes to decode.
 * @param options Options for decoding.
 * @returns JS value decoded from cbor.
 * @throws {Error} No value found, decoding errors.
 */
declare function decode<T = unknown>(src: Uint8Array | string, options?: DecodeOptions): T;

export { decode };
