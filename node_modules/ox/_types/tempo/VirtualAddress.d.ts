import * as Address from '../core/Address.js';
import * as Bytes from '../core/Bytes.js';
import * as Errors from '../core/Errors.js';
import * as Hex from '../core/Hex.js';
import * as TempoAddress from './TempoAddress.js';
/** Fixed 10-byte marker used by TIP-1022 virtual addresses. */
export declare const magic: "0xfdfdfdfdfdfdfdfdfdfd";
/** A fixed-width virtual address component. */
export type Part = Hex.Hex | Bytes.Bytes | number | bigint;
/**
 * Builds a TIP-1022 virtual address from a `masterId` and `userTag`.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * TIP-1022 encodes virtual addresses as:
 * `[4-byte masterId][10-byte VIRTUAL_MAGIC][6-byte userTag]`
 *
 * @example
 * ```ts twoslash
 * import { VirtualAddress } from 'ox/tempo'
 *
 * const address = VirtualAddress.from({
 *   masterId: '0x58e21090',
 *   userTag: '0x010203040506',
 * })
 *
 * address
 * // @log: '0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506'
 * ```
 *
 * @param value - The virtual address parts.
 * @returns The virtual address.
 */
export declare function from(value: from.Value): Address.Address;
export declare namespace from {
    type Value = {
        /** 4-byte master identifier. */
        masterId: Part;
        /** 6-byte opaque user tag. */
        userTag: Part;
    };
    type ErrorType = Address.from.ErrorType | Bytes.padLeft.ErrorType | Hex.assert.ErrorType | Hex.fromBytes.ErrorType | Hex.fromNumber.ErrorType | Hex.padLeft.ErrorType | Errors.GlobalErrorType;
}
/**
 * Checks whether an address matches the TIP-1022 virtual address format.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * This only checks the reserved byte layout, not whether the `masterId`
 * is registered onchain.
 *
 * @example
 * ```ts twoslash
 * import { VirtualAddress } from 'ox/tempo'
 *
 * const isVirtual = VirtualAddress.isVirtual(
 *   '0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506',
 * )
 *
 * isVirtual
 * // @log: true
 * ```
 *
 * @param address - Address to check.
 * @returns `true` if the address matches the virtual-address layout.
 */
export declare function isVirtual(address: string): boolean;
/**
 * Parses a TIP-1022 virtual address into its `masterId` and `userTag` parts.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * @example
 * ```ts twoslash
 * import { VirtualAddress } from 'ox/tempo'
 *
 * const parsed = VirtualAddress.parse(
 *   '0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506',
 * )
 *
 * parsed
 * // @log: { masterId: '0x58e21090', userTag: '0x010203040506' }
 * ```
 *
 * @param address - The virtual address to parse.
 * @returns The decoded virtual address components.
 */
export declare function parse(address: string): parse.ReturnType;
export declare namespace parse {
    type ReturnType = {
        /** 4-byte master identifier. */
        masterId: Hex.Hex;
        /** 6-byte opaque user tag. */
        userTag: Hex.Hex;
    };
    type ErrorType = Address.assert.ErrorType | InvalidMagicError | TempoAddress.parse.ErrorType | Errors.GlobalErrorType;
}
/**
 * Validates that an address matches the TIP-1022 virtual address format.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * This only validates the reserved byte layout, not whether the `masterId`
 * resolves to a registered master onchain.
 *
 * @example
 * ```ts twoslash
 * import { VirtualAddress } from 'ox/tempo'
 *
 * const valid = VirtualAddress.validate(
 *   '0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506',
 * )
 *
 * valid
 * // @log: true
 * ```
 *
 * @param address - Address to validate.
 * @returns `true` if the address has a valid virtual-address layout.
 */
export declare function validate(address: string): boolean;
/** Thrown when an address does not contain the TIP-1022 virtual marker. */
export declare class InvalidMagicError extends Errors.BaseError {
    readonly name = "VirtualAddress.InvalidMagicError";
    constructor({ address }: {
        address: string;
    });
}
//# sourceMappingURL=VirtualAddress.d.ts.map