/** Check if `input` is IPv4. */
export declare function isIPv4(input: string): boolean;
/** Check if `input` is IPv6. */
export declare function isIPv6(input: string): boolean;
/** Check if `input` is IPv4 or IPv6. */
export declare function isIP(input: string): boolean;
/**
 * @returns `6` if `input` is IPv6, `4` if `input` is IPv4, or `undefined` if `input` is neither.
 */
export declare function ipVersion(input: string): 4 | 6 | undefined;
//# sourceMappingURL=is-ip.d.ts.map