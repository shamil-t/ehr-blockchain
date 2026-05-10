/**
 * @packageDocumentation
 *
 * Provides methods for converting
 */
/**
 * converts (serializes) addresses
 */
export declare function convert(proto: string, a: string): Uint8Array;
export declare function convert(proto: string, a: Uint8Array): string;
/**
 * Convert [code,Uint8Array] to string
 */
export declare function convertToString(proto: number | string, buf: Uint8Array): string;
export declare function convertToBytes(proto: string | number, str: string): Uint8Array;
//# sourceMappingURL=convert.d.ts.map