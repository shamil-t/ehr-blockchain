import type * as Errors from './Errors.js';
import { BaseError } from './Errors.js';
/**
 * Encodes data bytes with a human-readable part (HRP) into a bech32m string (BIP-350).
 *
 * @example
 * ```ts twoslash
 * import { Bech32m } from 'ox'
 *
 * const encoded = Bech32m.encode('tempo', new Uint8Array(20))
 * // @log: 'tempo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwa7xtm'
 * ```
 *
 * @param hrp - The human-readable part (e.g. `"tempo"`, `"tempoz"`).
 * @param data - The data bytes to encode.
 * @returns The bech32m-encoded string.
 */
export declare function encode(hrp: string, data: Uint8Array, options?: encode.Options): string;
export declare namespace encode {
    type Options = {
        /** Maximum length of the encoded string. @default 90 */
        limit?: number | undefined;
    };
    type ErrorType = InvalidHrpError | ExceedsLengthError | Errors.GlobalErrorType;
}
/**
 * Decodes a bech32m string (BIP-350) into a human-readable part and data bytes.
 *
 * @example
 * ```ts twoslash
 * import { Bech32m } from 'ox'
 *
 * const { hrp, data } = Bech32m.decode('tempo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwa7xtm')
 * // @log: { hrp: 'tempo', data: Uint8Array(20) }
 * ```
 *
 * @param str - The bech32m-encoded string to decode.
 * @returns The decoded HRP and data bytes.
 */
export declare function decode(str: string, options?: decode.Options): decode.ReturnType;
export declare namespace decode {
    type Options = {
        /** Maximum length of the encoded string. @default 90 */
        limit?: number | undefined;
    };
    type ReturnType = {
        /** The human-readable part. */
        hrp: string;
        /** The decoded data bytes. */
        data: Uint8Array;
    };
    type ErrorType = NoSeparatorError | InvalidChecksumError | InvalidCharacterError | InvalidPaddingError | MixedCaseError | InvalidHrpError | ExceedsLengthError | Errors.GlobalErrorType;
}
/** Thrown when a bech32m string has no separator. */
export declare class NoSeparatorError extends BaseError {
    readonly name = "Bech32m.NoSeparatorError";
    constructor();
}
/** Thrown when a bech32m string has an invalid checksum. */
export declare class InvalidChecksumError extends BaseError {
    readonly name = "Bech32m.InvalidChecksumError";
    constructor();
}
/** Thrown when a bech32m string contains an invalid character. */
export declare class InvalidCharacterError extends BaseError {
    readonly name = "Bech32m.InvalidCharacterError";
    constructor({ character }: {
        character: string;
    });
}
/** Thrown when the padding bits are invalid during base32 conversion. */
export declare class InvalidPaddingError extends BaseError {
    readonly name = "Bech32m.InvalidPaddingError";
    constructor();
}
/** Thrown when a bech32m string contains mixed case. */
export declare class MixedCaseError extends BaseError {
    readonly name = "Bech32m.MixedCaseError";
    constructor();
}
/** Thrown when the HRP is invalid (empty or contains non-ASCII characters). */
export declare class InvalidHrpError extends BaseError {
    readonly name = "Bech32m.InvalidHrpError";
    constructor();
}
/** Thrown when the encoded string exceeds the length limit. */
export declare class ExceedsLengthError extends BaseError {
    readonly name = "Bech32m.ExceedsLengthError";
    constructor({ limit }: {
        limit: number;
    });
}
//# sourceMappingURL=Bech32m.d.ts.map