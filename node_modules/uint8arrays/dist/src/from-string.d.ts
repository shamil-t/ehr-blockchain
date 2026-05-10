import { type SupportedEncodings } from './util/bases.js';
export type { SupportedEncodings };
/**
 * Create a `Uint8Array` from the passed string
 *
 * Supports `utf8`, `utf-8`, `hex`, and any encoding supported by the multiformats module.
 *
 * Also `ascii` which is similar to node's 'binary' encoding.
 */
export declare function fromString(string: string, encoding?: SupportedEncodings): Uint8Array;
//# sourceMappingURL=from-string.d.ts.map