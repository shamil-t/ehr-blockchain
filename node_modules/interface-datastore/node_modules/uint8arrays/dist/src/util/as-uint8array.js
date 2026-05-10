/**
 * To guarantee Uint8Array semantics, convert nodejs Buffers
 * into vanilla Uint8Arrays
 */
export function asUint8Array(buf) {
    if (globalThis.Buffer != null) {
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    return buf;
}
//# sourceMappingURL=as-uint8array.js.map