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
export declare function toBytes(value: bigint | number): Bytes.Bytes;
export declare namespace toBytes {
    type ErrorType = NegativeValueError | Errors.GlobalErrorType;
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
export declare function toHex(value: bigint | number): Hex.Hex;
export declare namespace toHex {
    type ErrorType = toBytes.ErrorType | Errors.GlobalErrorType;
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
export declare function fromBytes(data: Bytes.Bytes): fromBytes.ReturnType;
export declare namespace fromBytes {
    type ReturnType = {
        /** The decoded integer value. */
        value: bigint;
        /** The number of bytes consumed. */
        size: number;
    };
    type ErrorType = InsufficientBytesError | Errors.GlobalErrorType;
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
export declare function fromHex(data: Hex.Hex): fromBytes.ReturnType;
export declare namespace fromHex {
    type ErrorType = fromBytes.ErrorType | Errors.GlobalErrorType;
}
/** Thrown when a CompactSize value is negative. */
export declare class NegativeValueError extends Errors.BaseError {
    readonly name = "CompactSize.NegativeValueError";
    constructor({ value }: {
        value: bigint;
    });
}
/** Thrown when there are insufficient bytes to decode a CompactSize value. */
export declare class InsufficientBytesError extends Errors.BaseError {
    readonly name = "CompactSize.InsufficientBytesError";
    constructor({ expected, actual }: {
        expected: number;
        actual: number;
    });
}
//# sourceMappingURL=CompactSize.d.ts.map