declare class RandomBytesGenerator {
    #private;
    private constructor();
    static create(seed: string): Promise<RandomBytesGenerator>;
    next(): Promise<Uint8Array>;
}
export declare function getHashGenerator(): Promise<RandomBytesGenerator>;
export declare function getAddressGenerator(): Promise<RandomBytesGenerator>;
/**
 * Checks if a value is an Ethereum address and if the checksum is valid.
 * This method is a a an adaptation of the ethereumjs methods at this link:
 * https://github.com/ethereumjs/ethereumjs-monorepo/blob/47f388bfeec553519d11259fee7e7161a77b29b2/packages/util/src/account.ts#L440-L478
 * The main differences are:
 * - the two methods have been merged into one
 * - tha `eip1191ChainId` parameter has been removed.
 * - the code has been modified to use the `hardhat-utils` methods
 *
 */
export declare function isValidChecksum(hexAddress: string): Promise<boolean>;
export {};
//# sourceMappingURL=eth.d.ts.map