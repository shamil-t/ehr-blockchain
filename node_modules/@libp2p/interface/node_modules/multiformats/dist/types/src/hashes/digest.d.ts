export function create<Code extends number>(code: Code, digest: Uint8Array): Digest<Code, number>;
export function decode(multihash: Uint8Array): MultihashDigest;
export function equals(a: MultihashDigest, b: unknown): b is import("./interface.js").MultihashDigest<number>;
/**
 * @typedef {import('./interface.js').MultihashDigest} MultihashDigest
 */
/**
 * Represents a multihash digest which carries information about the
 * hashing algorithm and an actual hash digest.
 *
 * @template {number} Code
 * @template {number} Size
 * @class
 * @implements {MultihashDigest}
 */
export class Digest<Code extends number, Size extends number> implements MultihashDigest {
    /**
     * Creates a multihash digest.
     *
     * @param {Code} code
     * @param {Size} size
     * @param {Uint8Array} digest
     * @param {Uint8Array} bytes
     */
    constructor(code: Code, size: Size, digest: Uint8Array, bytes: Uint8Array);
    code: Code;
    size: Size;
    digest: Uint8Array;
    bytes: Uint8Array;
}
export type MultihashDigest = import('./interface.js').MultihashDigest;
//# sourceMappingURL=digest.d.ts.map