import { isIPv4, isIPv6 } from '@chainsafe/is-ip';
export { isIP } from '@chainsafe/is-ip';
export declare const isV4: typeof isIPv4;
export declare const isV6: typeof isIPv6;
export declare const toBytes: (ip: string) => Uint8Array;
export declare const toString: (buf: Uint8Array, offset?: number, length?: number) => string;
//# sourceMappingURL=ip.d.ts.map