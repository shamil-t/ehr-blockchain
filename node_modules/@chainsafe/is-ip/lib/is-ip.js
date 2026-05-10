import { parseIP, parseIPv4, parseIPv6 } from "./parse.js";
/** Check if `input` is IPv4. */
export function isIPv4(input) {
    return Boolean(parseIPv4(input));
}
/** Check if `input` is IPv6. */
export function isIPv6(input) {
    return Boolean(parseIPv6(input));
}
/** Check if `input` is IPv4 or IPv6. */
export function isIP(input) {
    return Boolean(parseIP(input));
}
/**
 * @returns `6` if `input` is IPv6, `4` if `input` is IPv4, or `undefined` if `input` is neither.
 */
export function ipVersion(input) {
    if (isIPv4(input)) {
        return 4;
    }
    else if (isIPv6(input)) {
        return 6;
    }
    else {
        return undefined;
    }
}
//# sourceMappingURL=is-ip.js.map