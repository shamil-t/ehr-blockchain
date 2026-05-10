import * as Bytes from './Bytes.js';
import * as Errors from './Errors.js';
import * as Hex from './Hex.js';
/**
 * Encodes a {@link ox#Bytes.Bytes} value to a Base32-encoded string (using the BIP-173 bech32 alphabet).
 *
 * @example
 * ```ts twoslash
 * import { Base32, Bytes } from 'ox'
 *
 * const value = Base32.fromBytes(new Uint8Array([0x00, 0xff, 0x00]))
 * ```
 *
 * @param value - The byte array to encode.
 * @returns The Base32 encoded string.
 */
export declare function fromBytes(value: Bytes.Bytes): string;
export declare namespace fromBytes {
    type ErrorType = Errors.GlobalErrorType;
}
/**
 * Encodes a {@link ox#Hex.Hex} value to a Base32-encoded string (using the BIP-173 bech32 alphabet).
 *
 * @example
 * ```ts twoslash
 * import { Base32 } from 'ox'
 *
 * const value = Base32.fromHex('0x00ff00')
 * ```
 *
 * @param value - The hex value to encode.
 * @returns The Base32 encoded string.
 */
export declare function fromHex(value: Hex.Hex): string;
export declare namespace fromHex {
    type ErrorType = fromBytes.ErrorType | Errors.GlobalErrorType;
}
/**
 * Decodes a Base32-encoded string (using the BIP-173 bech32 alphabet) to {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Base32 } from 'ox'
 *
 * const value = Base32.toBytes('qqsa0')
 * ```
 *
 * @param value - The Base32 encoded string.
 * @returns The decoded byte array.
 */
export declare function toBytes(value: string): Bytes.Bytes;
export declare namespace toBytes {
    type ErrorType = InvalidCharacterError | Errors.GlobalErrorType;
}
/**
 * Decodes a Base32-encoded string (using the BIP-173 bech32 alphabet) to {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Base32 } from 'ox'
 *
 * const value = Base32.toHex('qqsa0')
 * ```
 *
 * @param value - The Base32 encoded string.
 * @returns The decoded hex string.
 */
export declare function toHex(value: string): Hex.Hex;
export declare namespace toHex {
    type ErrorType = toBytes.ErrorType | Errors.GlobalErrorType;
}
/** Thrown when a Base32 string contains an invalid character. */
export declare class InvalidCharacterError extends Errors.BaseError {
    readonly name = "Base32.InvalidCharacterError";
    constructor({ character }: {
        character: string;
    });
}
//# sourceMappingURL=Base32.d.ts.map