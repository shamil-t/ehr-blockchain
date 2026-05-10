export declare function allFF(a: number[] | Uint8Array, from: number, to: number): boolean;
export declare function deepEqual(a: Uint8Array | number[], b: Uint8Array, from: number, to: number): boolean;
/***
 * Returns long ip format
 */
export declare function ipToString(ip: Uint8Array | number[]): string;
/**
 * If mask is a sequence of 1 bits followed by 0 bits, return number of 1 bits else -1
 */
export declare function simpleMaskLength(mask: Uint8Array): number;
export declare function maskToHex(mask: Uint8Array): string;
//# sourceMappingURL=util.d.ts.map