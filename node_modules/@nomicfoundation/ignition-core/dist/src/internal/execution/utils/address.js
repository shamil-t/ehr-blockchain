import { isAddress as ethersIsAddress, getAddress } from "ethers/address";
import { assertIgnitionInvariant } from "../../utils/assertions.js";
/**
 * Is the string a valid ethereum address?
 */
export function isAddress(address) {
    return ethersIsAddress(address);
}
/**
 * Returns a normalized and checksummed address for the given address.
 *
 * @param address - the address to reformat
 * @returns checksummed address
 */
export function toChecksumFormat(address) {
    assertIgnitionInvariant(isAddress(address), `Expected ${address} to be an address`);
    return getAddress(address);
}
/**
 * Determine if two addresses are equal ignoring case (which is a consideration
 * because of checksumming).
 */
export function equalAddresses(leftAddress, rightAddress) {
    return toChecksumFormat(leftAddress) === toChecksumFormat(rightAddress);
}
//# sourceMappingURL=address.js.map