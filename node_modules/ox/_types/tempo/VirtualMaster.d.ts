import * as Address from '../core/Address.js';
import * as Bytes from '../core/Bytes.js';
import * as Errors from '../core/Errors.js';
import * as Hash from '../core/Hash.js';
import * as Hex from '../core/Hex.js';
import * as TempoAddress from './TempoAddress.js';
/** A valid salt input for TIP-1022 master registration. */
export type Salt = Hex.Hex | Bytes.Bytes | number | bigint;
/**
 * Computes the TIP-1022 registration hash for a master address and salt.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * The registration hash is `keccak256(masterAddress || salt)` where `salt`
 * is encoded as a 32-byte value.
 *
 * Master addresses must satisfy TIP-1022 registration constraints: they cannot
 * be the zero address, another virtual address, or a TIP-20 token address.
 *
 * @example
 * ```ts twoslash
 * import { Address, Hex } from 'ox'
 * import { VirtualMaster } from 'ox/tempo'
 *
 * const hash = VirtualMaster.getRegistrationHash({
 *   address: Address.from('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'),
 *   salt: Hex.from('0x00000000000000000000000000000000000000000000000000000000abf52baf'),
 * })
 *
 * hash
 * // @log: '0x0000000058e21090d8f4bee424b90cddc2378aefa1bbbfa1443631a929ae966d'
 * ```
 *
 * @param value - Master address and salt.
 * @returns The registration hash.
 */
export declare function getRegistrationHash(value: getRegistrationHash.Value): Hex.Hex;
export declare namespace getRegistrationHash {
    type Value = {
        /** Master address. Accepts both hex and Tempo addresses. */
        address: TempoAddress.Address;
        /** 32-byte salt used for registration. */
        salt: Salt;
    };
    type ErrorType = Address.assert.ErrorType | Bytes.padLeft.ErrorType | Errors.BaseError | Hash.keccak256.ErrorType | Hex.assert.ErrorType | Hex.fromBytes.ErrorType | Hex.fromNumber.ErrorType | Hex.padLeft.ErrorType | TempoAddress.parse.ErrorType | Errors.GlobalErrorType;
}
/**
 * Derives the 4-byte TIP-1022 `masterId` from a master address and salt.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * This returns bytes `[4:8]` of the registration hash, regardless of whether the
 * salt satisfies the proof-of-work requirement.
 *
 * Master addresses must satisfy TIP-1022 registration constraints: they cannot
 * be the zero address, another virtual address, or a TIP-20 token address.
 *
 * @example
 * ```ts twoslash
 * import { Address, Hex } from 'ox'
 * import { VirtualMaster } from 'ox/tempo'
 *
 * const masterId = VirtualMaster.getMasterId({
 *   address: Address.from('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'),
 *   salt: Hex.from('0x00000000000000000000000000000000000000000000000000000000abf52baf'),
 * })
 *
 * masterId
 * // @log: '0x58e21090'
 * ```
 *
 * @param value - Master address and salt.
 * @returns The derived master identifier.
 */
export declare function getMasterId(value: getMasterId.Value): Hex.Hex;
export declare namespace getMasterId {
    type Value = getRegistrationHash.Value;
    type ErrorType = getRegistrationHash.ErrorType | Errors.GlobalErrorType;
}
/**
 * Validates that a salt satisfies the TIP-1022 32-bit proof-of-work requirement.
 *
 * [TIP-1022](https://docs.tempo.xyz/protocol/tips/tip-1022)
 *
 * Returns `false` for invalid master addresses, including the zero address,
 * virtual addresses, and TIP-20 token addresses.
 *
 * @example
 * ```ts twoslash
 * import { Address, Hex } from 'ox'
 * import { VirtualMaster } from 'ox/tempo'
 *
 * const valid = VirtualMaster.validateSalt({
 *   address: Address.from('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'),
 *   salt: Hex.from('0x00000000000000000000000000000000000000000000000000000000abf52baf'),
 * })
 *
 * valid
 * // @log: true
 * ```
 *
 * @param value - Master address and salt.
 * @returns `true` if the first 4 bytes of the registration hash are zero.
 */
export declare function validateSalt(value: validateSalt.Value): boolean;
export declare namespace validateSalt {
    type Value = getRegistrationHash.Value;
}
/**
 * Searches a bounded range of salts for the first value that satisfies TIP-1022 PoW.
 *
 * [TIP-1022](https://tips.sh/1022)
 *
 * This is intentionally a small, deterministic primitive. It does not coordinate
 * workers or async execution. Callers that need large searches can shard ranges
 * externally.
 *
 * Master addresses must satisfy TIP-1022 registration constraints: they cannot
 * be the zero address, another virtual address, or a TIP-20 token address.
 *
 * :::warning
 *
 * It is strongly recommended to use {@link ox#VirtualMaster.(mineSaltAsync:function)} instead of this
 * function. `mineSaltAsync` uses WASM-accelerated keccak256 with parallel
 * workers and is a lot faster than the pure JS implementation used here.
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 * import { VirtualMaster } from 'ox/tempo'
 *
 * const result = VirtualMaster.mineSalt({
 *   address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 * })
 *
 * result?.salt
 * // @log: '0x00000000000000000000000000000000000000000000000000000000abf52baf'
 * ```
 *
 * @param value - Search range parameters.
 * @returns The first matching salt in the range, if any.
 */
export declare function mineSalt(value: mineSalt.Value): mineSalt.ReturnType | undefined;
export declare namespace mineSalt {
    type Value = {
        /** Master address. Accepts both hex and Tempo addresses. */
        address: TempoAddress.Address;
        /** Number of consecutive salts to try. */
        count?: number | undefined;
        /** Starting salt value. @default 0n */
        start?: Salt | undefined;
    };
    type ReturnType = {
        /** The 4-byte master identifier derived from the matching salt. */
        masterId: Hex.Hex;
        /** The matching registration hash. */
        registrationHash: Hex.Hex;
        /** The discovered 32-byte salt. */
        salt: Hex.Hex;
    };
    type ErrorType = Address.assert.ErrorType | Bytes.fromHex.ErrorType | Bytes.padLeft.ErrorType | Errors.BaseError | Hash.keccak256.ErrorType | Hex.assert.ErrorType | Hex.fromBytes.ErrorType | Hex.fromNumber.ErrorType | Hex.padLeft.ErrorType | TempoAddress.parse.ErrorType | Errors.GlobalErrorType;
}
/**
 * Searches for a salt that satisfies TIP-1022 PoW using parallel workers and
 * WASM-accelerated keccak256.
 *
 * [TIP-1022](https://tips.sh/1022)
 *
 * Uses WASM-accelerated keccak256 with parallel
 * workers when available. Falls back to chunked single-threaded mining in
 * environments without worker support.
 *
 * - **Node.js / Bun / Deno**: Spawns `worker_threads` with inline WASM keccak256.
 * - **Browsers**: Spawns Web Workers via Blob URLs with inline WASM keccak256.
 *
 * @example
 * ```ts twoslash
 * import { Address } from 'ox'
 * import { VirtualMaster } from 'ox/tempo'
 *
 * const result = await VirtualMaster.mineSaltAsync({
 *   address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 * })
 * ```
 *
 * @param parameters - Search parameters.
 * @returns The first matching salt, if any.
 */
export declare function mineSaltAsync(parameters: mineSaltAsync.Parameters): Promise<mineSalt.ReturnType | undefined>;
export declare namespace mineSaltAsync {
    type Parameters = {
        /** Master address. Accepts both hex and Tempo addresses. */
        address: TempoAddress.Address;
        /**
         * Number of salts each worker processes before sending a progress update.
         *
         * @default 100_000
         */
        chunkSize?: number | undefined;
        /** Number of consecutive salts to try. @default 2 ** 32 */
        count?: number | undefined;
        /** Progress callback invoked after each completed chunk. */
        onProgress?: ((progress: Progress) => void) | undefined;
        /** AbortSignal for cancellation. */
        signal?: AbortSignal | undefined;
        /** Starting salt value. @default 0n */
        start?: Salt | undefined;
        /**
         * Number of workers to use.
         *
         * Set to `0` or `1` to disable worker parallelism.
         *
         * @default os.availableParallelism() - 1
         */
        workers?: number | undefined;
    };
    type Progress = {
        /** Total attempts so far. */
        attempts: number;
        /** Configured chunk size. */
        chunkSize: number;
        /** Total count requested. */
        count: number;
        /** Elapsed time in milliseconds. */
        elapsed: number;
        /** Fraction complete (0–1). */
        progress: number;
        /** Hashes per second. */
        rate: number;
        /** Number of workers in use. */
        workers: number;
    };
    type ErrorType = mineSalt.ErrorType | Errors.BaseError | Errors.GlobalErrorType;
}
//# sourceMappingURL=VirtualMaster.d.ts.map