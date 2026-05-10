/**
 * Returns the minimum of two bigints.
 *
 * @param x The first number to compare.
 * @param y The second number to compare.
 * @returns The smaller of the two numbers.
 */
export declare function min(x: bigint, y: bigint): bigint;
/**
 * Returns the maximum of two bigints.
 *
 * @param x The first number to compare.
 * @param y The second number to compare.
 * @returns The larger of the two numbers.
 */
export declare function max(x: bigint, y: bigint): bigint;
/**
 * Converts a value to a bigint.
 *
 * This function supports several types of input:
 * - `number`: Must be an integer and a safe integer. If it's not, an error is thrown.
 * - `bigint`: Returned as is.
 * - `string`: Converted to a bigint using the BigInt constructor.
 *
 * If the input is of an unsupported type, an error is thrown.
 *
 * @param value The value to convert to a bigint.
 * @returns The input value converted to a bigint.
 * @throws InvalidParameterError If the input value cannot be converted to a bigint.
 */
export declare function toBigInt(value: number | string | bigint): bigint;
//# sourceMappingURL=bigint.d.ts.map