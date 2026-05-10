import * as Bytes from './Bytes.js';
import * as Errors from './Errors.js';
import * as Hex from './Hex.js';
/**
 * Encodes an integer using Bitcoin's CompactSize variable-length encoding.
 *
 * | Range | Encoding | Bytes |
 * |---|---|---|
 * | 0–252 | Direct value | 1 |
 * | 253–65,535 | `0xFD` + 2 bytes LE | 3 |
 * | 65,536–4,294,967,295 | `0xFE` + 4 bytes LE | 5 |
 * | \> 4,294,967,295 | `0xFF` + 8 bytes LE | 9 |
 *
 * @example
 * ```ts twoslash
 * import { CompactSize } from 'ox'
 *
 * const bytes = CompactSize.toBytes(252)
 * // Uint8Array [252]
 *
 * const bytes2 = CompactSize.toBytes(253)
 * // Uint8Array [253, 253, 0]
 * ```
 *
 * @param value - The integer to encode.
 * @returns The CompactSize-encoded bytes.
 */
export function toBytes(value) {
    const n = BigInt(value);
    if (n < 0n)
        throw new NegativeValueError({ value: n });
    if (n <= 252n)
        return new Uint8Array([Number(n)]);
    if (n <= 0xffffn) {
        const buf = new Uint8Array(3);
        buf[0] = 0xfd;
        const view = new DataView(buf.buffer);
        view.setUint16(1, Number(n), true);
        return buf;
    }
    if (n <= 0xffffffffn) {
        const buf = new Uint8Array(5);
        buf[0] = 0xfe;
        const view = new DataView(buf.buffer);
        view.setUint32(1, Number(n), true);
        return buf;
    }
    const buf = new Uint8Array(9);
    buf[0] = 0xff;
    const view = new DataView(buf.buffer);
    view.setBigUint64(1, n, true);
    return buf;
}
/**
 * Encodes an integer using Bitcoin's CompactSize variable-length encoding and returns it as {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { CompactSize } from 'ox'
 *
 * const hex = CompactSize.toHex(252)
 * // '0xfc'
 * ```
 *
 * @param value - The integer to encode.
 * @returns The CompactSize-encoded hex string.
 */
export function toHex(value) {
    return Hex.fromBytes(toBytes(value));
}
/**
 * Decodes a CompactSize-encoded value from {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { CompactSize } from 'ox'
 *
 * const result = CompactSize.fromBytes(new Uint8Array([0xfd, 0x00, 0x01]))
 * // { value: 256, size: 3 }
 * ```
 *
 * @param data - The bytes to decode from.
 * @returns The decoded value and number of bytes consumed.
 */
export function fromBytes(data) {
    if (data.length === 0)
        throw new InsufficientBytesError({ expected: 1, actual: 0 });
    const first = data[0];
    if (first < 0xfd)
        return { value: BigInt(first), size: 1 };
    const view = new DataView(data.buffer, data.byteOffset);
    if (first === 0xfd) {
        if (data.length < 3)
            throw new InsufficientBytesError({ expected: 3, actual: data.length });
        return { value: BigInt(view.getUint16(1, true)), size: 3 };
    }
    if (first === 0xfe) {
        if (data.length < 5)
            throw new InsufficientBytesError({ expected: 5, actual: data.length });
        return { value: BigInt(view.getUint32(1, true)), size: 5 };
    }
    if (data.length < 9)
        throw new InsufficientBytesError({ expected: 9, actual: data.length });
    return {
        value: view.getBigUint64(1, true),
        size: 9,
    };
}
/**
 * Decodes a CompactSize-encoded value from {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { CompactSize } from 'ox'
 *
 * const result = CompactSize.fromHex('0xfd0001')
 * // { value: 256, size: 3 }
 * ```
 *
 * @param data - The hex string to decode from.
 * @returns The decoded value and number of bytes consumed.
 */
export function fromHex(data) {
    return fromBytes(Bytes.fromHex(data));
}
/** Thrown when a CompactSize value is negative. */
export class NegativeValueError extends Errors.BaseError {
    constructor({ value }) {
        super(`CompactSize value must be non-negative, got ${value}.`);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'CompactSize.NegativeValueError'
        });
    }
}
/** Thrown when there are insufficient bytes to decode a CompactSize value. */
export class InsufficientBytesError extends Errors.BaseError {
    constructor({ expected, actual }) {
        super(`Insufficient bytes for CompactSize decoding. Expected at least ${expected}, got ${actual}.`);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'CompactSize.InsufficientBytesError'
        });
    }
}
//# sourceMappingURL=CompactSize.js.map