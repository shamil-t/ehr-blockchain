export declare const IPv4Len = 4;
export declare const IPv6Len = 16;
export declare const maxIPv6Octet: number;
export declare const ipv4Prefix: Uint8Array;
export interface IpNetRaw {
    network: Uint8Array;
    mask: Uint8Array;
}
export declare function maskIp(ip: Uint8Array, mask: Uint8Array): Uint8Array;
export declare function containsIp(net: IpNetRaw, ip: Uint8Array | number[] | string): boolean;
export declare function iPv4FromIPv6(ip: Uint8Array): Uint8Array;
export declare function isIPv4mappedIPv6(ip: Uint8Array | number[]): boolean;
//# sourceMappingURL=ip.d.ts.map