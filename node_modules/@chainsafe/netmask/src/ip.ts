import { parseIP } from "@chainsafe/is-ip/parse";
import { allFF, deepEqual } from "./util.js";

export const IPv4Len = 4;
export const IPv6Len = 16;

export const maxIPv6Octet = parseInt("0xFFFF", 16);
export const ipv4Prefix = new Uint8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255,
]);

export interface IpNetRaw {
  network: Uint8Array;
  mask: Uint8Array;
}

export function maskIp(ip: Uint8Array, mask: Uint8Array): Uint8Array {
  if (mask.length === IPv6Len && ip.length === IPv4Len && allFF(mask, 0, 11)) {
    mask = mask.slice(12);
  }
  if (
    mask.length === IPv4Len &&
    ip.length === IPv6Len &&
    deepEqual(ip, ipv4Prefix, 0, 11)
  ) {
    ip = ip.slice(12);
  }
  const n = ip.length;
  if (n != mask.length) {
    throw new Error("Failed to mask ip");
  }
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = ip[i] & mask[i];
  }
  return out;
}

export function containsIp(
  net: IpNetRaw,
  ip: Uint8Array | number[] | string
): boolean {
  if (typeof ip === "string") {
    ip = parseIP(ip)!;
  }
  if (ip == null) throw new Error("Invalid ip");
  if (ip.length !== net.network.length) {
    return false;
  }
  for (let i = 0; i < ip.length; i++) {
    if ((net.network[i] & net.mask[i]) !== (ip[i] & net.mask[i])) {
      return false;
    }
  }
  return true;
}

export function iPv4FromIPv6(ip: Uint8Array): Uint8Array {
  if (!isIPv4mappedIPv6(ip)) {
    throw new Error("Must have 0xffff prefix");
  }
  return ip.slice(12);
}

export function isIPv4mappedIPv6(ip: Uint8Array | number[]): boolean {
  return deepEqual(ip, ipv4Prefix, 0, 11);
}
