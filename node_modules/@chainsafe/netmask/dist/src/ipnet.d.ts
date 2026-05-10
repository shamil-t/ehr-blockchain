export declare class IpNet {
    readonly network: Uint8Array;
    readonly mask: Uint8Array;
    /**
     *
     * @param ipOrCidr either network ip or full cidr address
     * @param mask in case ipOrCidr is network this can be either mask in decimal format or as ip address
     */
    constructor(ipOrCidr: string, mask?: string | number);
    /**
     * Checks if netmask contains ip address
     * @param ip
     * @returns
     */
    contains(ip: Uint8Array | number[] | string): boolean;
    /**Serializes back to string format */
    toString(): string;
}
//# sourceMappingURL=ipnet.d.ts.map