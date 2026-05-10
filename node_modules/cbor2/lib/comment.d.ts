import { C as CommentOptions } from './options-BZO68bQ0.js';
import './sorts.js';

/**
 * Create a string that describes the input CBOR.
 *
 * @param src CBOR-encoded string or byte array.
 * @param options Options for decoding.
 * @returns Comment string.
 * @throws On invalid CBOR.
 */
declare function comment(src: Uint8Array | string, options?: CommentOptions): string;

export { comment };
