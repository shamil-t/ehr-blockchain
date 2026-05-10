export { ipToString } from "./util.js";
export { maskIp, iPv4FromIPv6, isIPv4mappedIPv6 } from "./ip.js";
export { IpNet } from "./ipnet.js";
export { parseCidr } from "./cidr.js";
/**
 * Checks if cidr block contains ip address
 * @param cidr ipv4 or ipv6 formatted cidr . Example 198.51.100.14/24 or 2001:db8::/48
 * @param ip ipv4 or ipv6 address Example 198.51.100.14 or 2001:db8::
 *
 */
export declare function cidrContains(cidr: string, ip: string): boolean;
//# sourceMappingURL=index.d.ts.map