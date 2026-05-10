import { IPv4Len, IPv6Len } from "./ip.js";

export function allFF(
  a: number[] | Uint8Array,
  from: number,
  to: number
): boolean {
  let i = 0;
  for (const e of a) {
    if (i < from) continue;
    if (i > to) break;
    if (e !== 0xff) return false;
    i++;
  }
  return true;
}

export function deepEqual(
  a: Uint8Array | number[],
  b: Uint8Array,
  from: number,
  to: number
): boolean {
  let i = 0;
  for (const e of a) {
    if (i < from) continue;
    if (i > to) break;
    if (e !== b[i]) return false;
    i++;
  }
  return true;
}

/***
 * Returns long ip format
 */
export function ipToString(ip: Uint8Array | number[]): string {
  switch (ip.length) {
    case IPv4Len: {
      return ip.join(".");
    }
    case IPv6Len: {
      const result = [] as string[];
      for (let i = 0; i < ip.length; i++) {
        if (i % 2 === 0) {
          result.push(
            ip[i].toString(16).padStart(2, "0") +
              ip[i + 1].toString(16).padStart(2, "0")
          );
        }
      }
      return result.join(":");
    }
    default: {
      throw new Error("Invalid ip length");
    }
  }
}

/**
 * If mask is a sequence of 1 bits followed by 0 bits, return number of 1 bits else -1
 */
export function simpleMaskLength(mask: Uint8Array): number {
  let ones = 0;
  // eslint-disable-next-line prefer-const
  for (let [index, byte] of mask.entries()) {
    if (byte === 0xff) {
      ones += 8;
      continue;
    }
    while ((byte & 0x80) != 0) {
      ones++;
      byte = byte << 1;
    }
    if ((byte & 0x80) != 0) {
      return -1;
    }
    for (let i = index + 1; i < mask.length; i++) {
      if (mask[i] != 0) {
        return -1;
      }
    }
    break;
  }
  return ones;
}

export function maskToHex(mask: Uint8Array): string {
  let hex = "0x";
  for (const byte of mask) {
    hex += (byte >> 4).toString(16) + (byte & 0x0f).toString(16);
  }
  return hex;
}
