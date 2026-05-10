import { type SupportedEncodings } from './util/bases.js';
export type { SupportedEncodings };
/**
 * Turns a `Uint8Array` into a string.
 *
 * Supports `utf8`, `utf-8` and any encoding supported by the multibase module.
 *
 * Also `ascii` which is similar to node's 'binary' encoding.
 */
export declare function toString(array: Uint8Array, encoding?: SupportedEncodings): string;
//# sourceMappingURL=to-string.d.ts.map