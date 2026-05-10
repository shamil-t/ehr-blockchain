import { allocUnsafe } from './alloc.js';
import { asUint8Array } from './util/as-uint8array.js';
/**
 * Returns a new Uint8Array created by concatenating the passed ArrayLikes
 */
export function concat(arrays, length) {
    if (length == null) {
        length = arrays.reduce((acc, curr) => acc + curr.length, 0);
    }
    const output = allocUnsafe(length);
    let offset = 0;
    for (const arr of arrays) {
        output.set(arr, offset);
        offset += arr.length;
    }
    return asUint8Array(output);
}
//# sourceMappingURL=concat.js.map