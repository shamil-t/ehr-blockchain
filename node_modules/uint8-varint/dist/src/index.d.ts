import type { Uint8ArrayList } from 'uint8arraylist';
export declare function encodingLength(value: number): number;
export declare function encodeUint8Array(value: number, buf: Uint8Array, offset?: number): Uint8Array;
export declare function encodeUint8ArrayList(value: number, buf: Uint8ArrayList, offset?: number): Uint8ArrayList;
export declare function decodeUint8Array(buf: Uint8Array, offset: number): number;
export declare function decodeUint8ArrayList(buf: Uint8ArrayList, offset: number): number;
export declare function encode(value: number): Uint8Array;
export declare function encode(value: number, buf: Uint8Array, offset?: number): Uint8Array;
export declare function encode(value: number, buf: Uint8ArrayList, offset?: number): Uint8ArrayList;
export declare function decode(buf: Uint8ArrayList | Uint8Array, offset?: number): number;
//# sourceMappingURL=index.d.ts.map