/**
 * Converts a Uint8Array to a bigint.
 *
 * @param bytes The Uint8Array to convert.
 * @returns The converted bigint.
 */
export declare function bytesToBigInt(bytes: Uint8Array): bigint;
/**
 * Converts a Uint8Array to a number.
 *
 * @param bytes The Uint8Array to convert.
 * @returns The converted number.
 */
export declare function bytesToNumber(bytes: Uint8Array): number;
/**
 * Converts a non-negative safe integer or bigint to a Uint8Array.
 *
 * @param value The number or bigint to convert.
 * @returns The converted Uint8Array.
 * @throws InvalidParameterError If the input is not a safe integer or is negative.
 */
export declare function numberToBytes(value: number | bigint): Uint8Array;
//# sourceMappingURL=number.d.ts.map