import { parseIP } from "@chainsafe/is-ip/parse";
import { cidrMask, parseCidr } from "./cidr.js";
import { containsIp, maskIp } from "./ip.js";
import { ipToString, maskToHex, simpleMaskLength } from "./util.js";

export class IpNet {
  public readonly network: Uint8Array;
  public readonly mask: Uint8Array;

  /**
   *
   * @param ipOrCidr either network ip or full cidr address
   * @param mask in case ipOrCidr is network this can be either mask in decimal format or as ip address
   */
  constructor(ipOrCidr: string, mask?: string | number) {
    if (mask == null) {
      ({ network: this.network, mask: this.mask } = parseCidr(ipOrCidr));
    } else {
      const ipResult = parseIP(ipOrCidr);
      if (ipResult == null) {
        throw new Error("Failed to parse network");
      }
      mask = String(mask);
      const m = parseInt(mask, 10);
      if (
        Number.isNaN(m) ||
        String(m).length !== mask.length ||
        m < 0 ||
        m > ipResult.length * 8
      ) {
        const maskResult = parseIP(mask);
        if (maskResult == null) {
          throw new Error("Failed to parse mask");
        }
        this.mask = maskResult;
      } else {
        this.mask = cidrMask(m, 8 * ipResult.length);
      }
      this.network = maskIp(ipResult, this.mask);
    }
  }

  /**
   * Checks if netmask contains ip address
   * @param ip
   * @returns
   */
  contains(ip: Uint8Array | number[] | string): boolean {
    return containsIp({ network: this.network, mask: this.mask }, ip);
  }

  /**Serializes back to string format */
  toString(): string {
    const l = simpleMaskLength(this.mask);
    const mask = l !== -1 ? String(l) : maskToHex(this.mask);
    return ipToString(this.network) + "/" + mask;
  }
}
