import { allocUnsafe } from './alloc.js';
import { asUint8Array } from './util/as-uint8array.js';
/**
 * Returns the xor distance between two arrays
 */
export function xor(a, b) {
    if (a.length !== b.length) {
        throw new Error('Inputs should have the same length');
    }
    const result = allocUnsafe(a.length);
    for (let i = 0; i < a.length; i++) {
        result[i] = a[i] ^ b[i];
    }
    return asUint8Array(result);
}
//# sourceMappingURL=xor.js.map