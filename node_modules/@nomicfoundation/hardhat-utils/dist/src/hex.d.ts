export type PrefixedHexString = `0x${string}`;
/**
 * Converts a non-negative safe integer or bigint to a hexadecimal string.
 *
 * @param value The number to convert.
 * @returns The hexadecimal representation of the number.
 * @throws InvalidParameterError If the input is not a safe integer or is negative.
 */
export declare function numberToHexString(value: number | bigint): PrefixedHexString;
/**
 * Converts a hexadecimal string to a bigint. The string must be a valid
 * hexadecimal string. The string may be prefixed with "0x" or not. The
 * empty string is considered a valid hexadecimal string, so is the string
 * "0x" and will be converted to 0.
 *
 * @param hexString The hexadecimal string to convert. It must be a valid
 * hexadecimal string.
 * @returns The bigint representation of the hexadecimal string.
 * @throws InvalidParameterError If the input is not a hexadecimal string.
 */
export declare function hexStringToBigInt(hexString: string): bigint;
/**
 * Converts a hexadecimal string to a number. The string must be a valid
 * hexadecimal string. The string may be prefixed with "0x" or not. The
 * empty string is considered a valid hexadecimal string, so is the string
 * "0x" and will be converted to 0.
 *
 * @param hexString The hexadecimal string to convert. It must be a valid
 * hexadecimal string.
 * @returns The number representation of the hexadecimal string.
 * @throws InvalidParameterError If the input is not a hexadecimal string or the value exceeds the Number.MAX_SAFE_INTEGER limit.
 */
export declare function hexStringToNumber(hexString: string): number;
/**
 * Converts a Uint8Array to a hexadecimal string.
 *
 * @param bytes The bytes to convert.
 * @returns PrefixedHexString The hexadecimal representation of the bytes.
 */
export declare function bytesToHexString(bytes: Uint8Array): PrefixedHexString;
/**
 * Converts a hexadecimal string to a Uint8Array. The string must be a valid
 * hexadecimal string. The string may be prefixed with "0x" or not. The empty
 * string is considered a valid hexadecimal string, so is the string "0x" and
 * will be converted to Uint8Array([0]).
 *
 * @param hexString The hexadecimal string to convert.
 * @returns The byte representation of the hexadecimal string.
 * @throws InvalidParameterError If the input is not a hexadecimal string.
 */
export declare function hexStringToBytes(hexString: string): Uint8Array;
/**
 * Normalizes and validates a string that represents a hexadecimal number.
 * The normalization process includes trimming any leading or trailing
 * whitespace, converting all characters to lowercase, and ensuring the string
 * has a "0x" prefix. The validation process checks if the string is a valid
 * hexadecimal string.
 *
 * @param hexString The hex string to normalize.
 * @returns The normalized hexadecimal string.
 */
export declare function normalizeHexString(hexString: string): PrefixedHexString;
/**
 * Checks if a string starts with "0x" (case-insensitive).
 * This function does not validate the input.
 *
 * @param hexString The string to check.
 * @returns True if the string starts with "0x", false otherwise.
 */
export declare function isPrefixedHexString(hexString: string): hexString is PrefixedHexString;
/**
 * Removes the "0x" prefix from a hexadecimal string.
 * If the string is not prefixed, it is returned as is.
 * This function does not validate the input.
 *
 * @param hexString The hexadecimal string.
 * @returns The hexadecimal string without the "0x" prefix.
 */
export declare function getUnprefixedHexString(hexString: string): string;
/**
 * Adds the "0x" prefix to a hexadecimal string.
 * If the string is already prefixed, it is returned as is.
 * This function does not validate the input.
 *
 * @param hexString The hexadecimal string.
 * @returns The hexadecimal string with the "0x" prefix.
 */
export declare function getPrefixedHexString(hexString: string): PrefixedHexString;
/**
 * Checks if a value is a hexadecimal string. The string may be prefixed with
 * "0x" or not. The empty string is considered a valid hexadecimal string, so
 * is the string "0x".
 *
 * @param value The value to check.
 * @returns True if the value is a hexadecimal string, false otherwise.
 */
export declare function isHexString(value: unknown): boolean;
/**
 * Removes leading zeros from a hexadecimal string, unless the string
 * represents the number zero ("0x0").
 * This function does not validate the input.
 *
 * @param hexString The hexadecimal string.
 * @returns The hexadecimal string without leading zeros.
 */
export declare function unpadHexString(hexString: string): string;
/**
 * Pads a hexadecimal string with zeros on the left to a specified length, or
 * truncates it from the left if it's too long.
 * This function does not validate the input.
 *
 * @param hexString The hexadecimal string to pad.
 * @param length The desired length of the hexadecimal string.
 * @returns The padded hexadecimal string.
 */
export declare function setLengthLeft(hexString: string, length: number): PrefixedHexString;
//# sourceMappingURL=hex.d.ts.map