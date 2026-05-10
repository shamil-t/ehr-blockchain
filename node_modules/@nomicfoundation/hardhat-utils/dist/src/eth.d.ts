import type { PrefixedHexString } from "./hex.js";
/**
 * Checks if a value is an Ethereum address.
 *
 * @param value The value to check.
 * @returns True if the value is an Ethereum address, false otherwise.
 */
export declare function isAddress(value: unknown): value is PrefixedHexString;
/**
 * Checks if a value is an Ethereum address and if the checksum is valid.
 *
 * @param value The value to check.
 * @returns True if the value is an Ethereum address with a valid checksum, false otherwise.
 */
export declare function isValidChecksumAddress(value: unknown): Promise<boolean>;
/**
 * Checks if a value is an Ethereum hash.
 *
 * @param value The value to check.
 * @returns True if the value is an Ethereum hash, false otherwise.
 */
export declare function isHash(value: unknown): value is PrefixedHexString;
/**
 * Converts a number to a hexadecimal string with a length of 32 bytes.
 *
 * @param value The number to convert.
 * @returns The hexadecimal representation of the number padded to 32 bytes.
 * @throws InvalidParameterError If the input is not a safe integer or is negative.
 */
export declare function toEvmWord(value: bigint | number): PrefixedHexString;
/**
 * Generates a pseudo-random sequence of hash bytes.
 *
 * @returns A pseudo-random sequence of hash bytes.
 */
export declare function generateHashBytes(): Promise<Uint8Array>;
/**
 * Generates a pseudo-random hash.
 *
 * @returns A pseudo-random hash.
 */
export declare function randomHash(): Promise<PrefixedHexString>;
/**
 * Generates a pseudo-random sequence of hash bytes that can be used as an
 * address.
 *
 * @returns A pseudo-random sequence of hash bytes.
 */
export declare function generateAddressBytes(): Promise<Uint8Array>;
/**
 * Generates a pseudo-random address.
 *
 * @returns A pseudo-random address.
 */
export declare function randomAddress(): Promise<PrefixedHexString>;
//# sourceMappingURL=eth.d.ts.map