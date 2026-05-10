import { parseIPv4, parseIPv6 } from "@chainsafe/is-ip/parse";
import { IPv4Len, IPv6Len, maskIp } from "./ip.js";

export function parseCidr(s: string): {
  network: Uint8Array;
  mask: Uint8Array;
} {
  const [address, maskString] = s.split("/");
  if (!address || !maskString)
    throw new Error("Failed to parse given CIDR: " + s);
  let ipLength = IPv4Len;
  let ip = parseIPv4(address);
  if (ip == null) {
    ipLength = IPv6Len;
    ip = parseIPv6(address);
    if (ip == null) throw new Error("Failed to parse given CIDR: " + s);
  }
  const m = parseInt(maskString, 10);
  if (
    Number.isNaN(m) ||
    String(m).length !== maskString.length ||
    m < 0 ||
    m > ipLength * 8
  ) {
    throw new Error("Failed to parse given CIDR: " + s);
  }
  const mask = cidrMask(m, 8 * ipLength);
  return {
    network: maskIp(ip, mask),
    mask,
  };
}

export function cidrMask(ones: number, bits: number): Uint8Array {
  if (bits !== 8 * IPv4Len && bits !== 8 * IPv6Len)
    throw new Error("Invalid CIDR mask");
  if (ones < 0 || ones > bits) throw new Error("Invalid CIDR mask");
  const l = bits / 8;
  const m = new Uint8Array(l);
  for (let i = 0; i < l; i++) {
    if (ones >= 8) {
      m[i] = 0xff;
      ones -= 8;
      continue;
    }
    m[i] = 255 - (0xff >> ones);
    ones = 0;
  }
  return m;
}
