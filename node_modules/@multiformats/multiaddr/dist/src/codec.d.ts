import type { StringTuple, Tuple, Protocol } from './index.js';
/**
 * string -> [[str name, str addr]... ]
 */
export declare function stringToStringTuples(str: string): string[][];
/**
 * [[str name, str addr]... ] -> string
 */
export declare function stringTuplesToString(tuples: StringTuple[]): string;
/**
 * [[str name, str addr]... ] -> [[int code, Uint8Array]... ]
 */
export declare function stringTuplesToTuples(tuples: Array<string[] | string>): Tuple[];
/**
 * Convert tuples to string tuples
 *
 * [[int code, Uint8Array]... ] -> [[int code, str addr]... ]
 */
export declare function tuplesToStringTuples(tuples: Tuple[]): StringTuple[];
/**
 * [[int code, Uint8Array ]... ] -> Uint8Array
 */
export declare function tuplesToBytes(tuples: Tuple[]): Uint8Array;
/**
 * For the passed address, return the serialized size
 */
export declare function sizeForAddr(p: Protocol, addr: Uint8Array | number[]): number;
export declare function bytesToTuples(buf: Uint8Array): Tuple[];
/**
 * Uint8Array -> String
 */
export declare function bytesToString(buf: Uint8Array): string;
/**
 * String -> Uint8Array
 */
export declare function stringToBytes(str: string): Uint8Array;
/**
 * String -> Uint8Array
 */
export declare function fromString(str: string): Uint8Array;
/**
 * Uint8Array -> Uint8Array
 */
export declare function fromBytes(buf: Uint8Array): Uint8Array;
export declare function validateBytes(buf: Uint8Array): Error | undefined;
export declare function isValidBytes(buf: Uint8Array): boolean;
export declare function cleanPath(str: string): string;
export declare function ParseError(str: string): Error;
export declare function protoFromTuple(tup: any[]): Protocol;
//# sourceMappingURL=codec.d.ts.map