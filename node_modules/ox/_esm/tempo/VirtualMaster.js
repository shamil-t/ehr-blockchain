import { keccak_256 } from '@noble/hashes/sha3';
import * as Address from '../core/Address.js';
import * as Bytes from '../core/Bytes.js';
import * as Errors from '../core/Errors.js';
import * as Hash from '../core/Hash.js';
import * as Hex from '../core/Hex.js';
import * as VirtualMasterPool from './internal/virtualMasterPool.js';
import * as TempoAddress from './TempoAddress.js';
import * as VirtualAddress from './VirtualAddress.js';
const tip20Prefix = '0x20c000000000000000000000';
const zeroAddress = '0x0000000000000000000000000000000000000000';
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
export function getRegistrationHash(value) {
    return Hash.keccak256(Hex.concat(resolveAddress(value.address), toFixedHex(value.salt, 32)));
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
export function getMasterId(value) {
    return Hex.slice(getRegistrationHash(value), 4, 8);
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
export function validateSalt(value) {
    try {
        return hasProofOfWork(Hash.keccak256(Hex.concat(resolveAddress(value.address), toFixedHex(value.salt, 32)), { as: 'Bytes' }));
    }
    catch {
        return false;
    }
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
export function mineSalt(value) {
    const count = value.count ?? 2 ** 32;
    assertCount(count);
    const addressBytes = Bytes.fromHex(resolveAddress(value.address));
    const input = new Uint8Array(addressBytes.length + 32);
    input.set(addressBytes);
    // Salt is a view into input — increment mutates input directly, no copy.
    const saltView = input.subarray(addressBytes.length);
    saltView.set(toFixedBytes(value.start ?? 0n, 32));
    for (let i = 0; i < count; i++) {
        const hash = keccak_256(input);
        if (hash[0] === 0 && hash[1] === 0 && hash[2] === 0 && hash[3] === 0) {
            return {
                masterId: Hex.fromBytes(hash.subarray(4, 8)),
                registrationHash: Hex.fromBytes(hash),
                salt: Hex.fromBytes(saltView),
            };
        }
        if (i < count - 1 && !increment(saltView))
            break;
    }
    return undefined;
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
export async function mineSaltAsync(parameters) {
    const { chunkSize = 100_000, count = 2 ** 32, onProgress, signal, start: start_ = 0n, workers = getDefaultWorkerCount(), } = parameters;
    const address = resolveAddress(parameters.address);
    const start = toFixedHex(start_, 32);
    assertCount(count);
    if (workers !== undefined)
        assertWorkers(workers);
    throwIfAborted(signal);
    const workerCount = Math.max(1, Math.min(workers, Math.ceil(count / chunkSize)));
    if (workerCount <= 1)
        return mineSaltAsyncFallback({
            address,
            chunkSize,
            count,
            onProgress,
            signal,
            start,
        });
    const pool = await VirtualMasterPool.resolve();
    if (!pool)
        return mineSaltAsyncFallback({
            address,
            chunkSize,
            count,
            onProgress,
            signal,
            start,
        });
    return mineSaltWithWorkerPool({
        address,
        chunkSize,
        count,
        onProgress,
        pool,
        signal,
        start,
        workerCount,
    });
}
/**
 * Runs parallel salt mining across a worker pool.
 *
 * @internal
 */
// biome-ignore lint/correctness/noUnusedVariables: _
function mineSaltWithWorkerPool(value) {
    const startedAt = Date.now();
    return new Promise((resolve, reject) => {
        let settled = false;
        let attempts = 0;
        let completedWorkers = 0;
        const handles = [];
        const emitProgress = () => {
            if (!value.onProgress)
                return;
            const elapsed = Date.now() - startedAt;
            const seconds = elapsed / 1000;
            value.onProgress({
                attempts,
                chunkSize: value.chunkSize,
                count: value.count,
                elapsed,
                progress: Math.min(1, attempts / value.count),
                rate: seconds === 0 ? 0 : attempts / seconds,
                workers: value.workerCount,
            });
        };
        const terminateAll = () => {
            for (const h of handles)
                h.terminate();
        };
        const succeed = (result) => {
            if (settled)
                return;
            settled = true;
            value.signal?.removeEventListener('abort', onAbort);
            terminateAll();
            resolve(result);
        };
        const fail = (error) => {
            if (settled)
                return;
            settled = true;
            value.signal?.removeEventListener('abort', onAbort);
            terminateAll();
            reject(error instanceof Error
                ? error
                : new Errors.BaseError('Failed to mine virtual master salt.'));
        };
        const onMessage = (msg) => {
            if (settled)
                return;
            switch (msg.type) {
                case 'found':
                    succeed(msg.result);
                    return;
                case 'progress':
                    attempts += msg.attempts;
                    emitProgress();
                    return;
                case 'done':
                    completedWorkers++;
                    if (completedWorkers === value.workerCount)
                        succeed(undefined);
                    return;
                case 'error':
                    fail(new Errors.BaseError(msg.message));
                    return;
            }
        };
        const onAbort = () => fail(getAbortError(value.signal));
        value.signal?.addEventListener('abort', onAbort, { once: true });
        for (let i = 0; i < value.workerCount; i++) {
            const handle = value.pool.spawn(i, onMessage, fail);
            handles.push(handle);
            handle.postMessage({
                type: 'start',
                address: value.address,
                chunkSize: value.chunkSize,
                count: value.count,
                start: value.start,
                workerCount: value.workerCount,
                workerIndex: i,
            });
        }
    });
}
/**
 * Single-threaded chunked fallback when no worker pool is available.
 *
 * @internal
 */
// biome-ignore lint/correctness/noUnusedVariables: _
async function mineSaltAsyncFallback(value) {
    const startedAt = Date.now();
    const startBigInt = BigInt(value.start);
    for (let offset = 0; offset < value.count; offset += value.chunkSize) {
        throwIfAborted(value.signal);
        const count = Math.min(value.chunkSize, value.count - offset);
        const result = mineSalt({
            address: value.address,
            count,
            start: startBigInt + BigInt(offset),
        });
        if (value.onProgress) {
            const attempts = Math.min(value.count, offset + count);
            const elapsed = Date.now() - startedAt;
            const seconds = elapsed / 1000;
            value.onProgress({
                attempts,
                chunkSize: value.chunkSize,
                count: value.count,
                elapsed,
                progress: Math.min(1, attempts / value.count),
                rate: seconds === 0 ? 0 : attempts / seconds,
                workers: 1,
            });
        }
        if (result)
            return result;
        // Yield to the event loop between chunks.
        await new Promise((r) => setTimeout(r, 0));
    }
    return undefined;
}
/**
 * Asserts that `workers` is a non-negative safe integer.
 *
 * @internal
 */
function assertWorkers(workers) {
    if (Number.isSafeInteger(workers) && workers >= 0)
        return;
    throw new Errors.BaseError(`Workers "${workers}" is invalid. Expected a non-negative safe integer.`);
}
/**
 * Extracts or creates an error from an `AbortSignal`.
 *
 * @internal
 */
function getAbortError(signal) {
    const reason = signal?.reason;
    if (reason instanceof Error)
        return reason;
    return new Errors.BaseError('The operation was aborted.');
}
/**
 * Returns the default number of workers for the current platform.
 *
 * @internal
 */
function getDefaultWorkerCount() {
    if (typeof navigator !== 'undefined') {
        const c = navigator.hardwareConcurrency;
        if (c && c > 1)
            return c - 1;
    }
    return 1;
}
/**
 * Throws the signal's abort reason if the signal is aborted.
 *
 * @internal
 */
function throwIfAborted(signal) {
    if (!signal?.aborted)
        return;
    throw getAbortError(signal);
}
/**
 * Returns `true` if the first 4 bytes of a hash are zero.
 *
 * @internal
 */
function hasProofOfWork(hash) {
    return hash[0] === 0 && hash[1] === 0 && hash[2] === 0 && hash[3] === 0;
}
/**
 * Asserts that `count` is a positive safe integer.
 *
 * @internal
 */
function assertCount(count) {
    if (Number.isSafeInteger(count) && count > 0)
        return;
    throw new Errors.BaseError(`Count "${count}" is invalid. Expected a positive safe integer.`);
}
/**
 * Increments a big-endian byte array by one. Returns `false` on overflow.
 *
 * @internal
 */
function increment(bytes) {
    for (let i = bytes.length - 1; i >= 0; i--) {
        const value = bytes[i];
        if (value === 0xff) {
            bytes[i] = 0;
            continue;
        }
        bytes[i] = value + 1;
        return true;
    }
    return false;
}
/**
 * Resolves a Tempo or hex address, validates it as a valid master.
 *
 * @internal
 */
function resolveAddress(address) {
    const resolved = TempoAddress.resolve(address);
    Address.assert(resolved, { strict: false });
    assertValidMasterAddress(resolved);
    return resolved;
}
/**
 * Throws if the address is zero, virtual, or a TIP-20 token.
 *
 * @internal
 */
function assertValidMasterAddress(address) {
    const normalized = address.toLowerCase();
    if (normalized === zeroAddress)
        throw new Errors.BaseError('Virtual master address cannot be the zero address.');
    if (VirtualAddress.isVirtual(address))
        throw new Errors.BaseError('Virtual master address cannot itself be a virtual address.');
    if (normalized.startsWith(tip20Prefix))
        throw new Errors.BaseError('Virtual master address cannot be a TIP-20 token address.');
}
/**
 * Converts a salt to a fixed-size byte array.
 *
 * @internal
 */
function toFixedBytes(value, size) {
    return Bytes.fromHex(toFixedHex(value, size));
}
/**
 * Converts a salt to a zero-padded hex string of the given size.
 *
 * @internal
 */
function toFixedHex(value, size) {
    if (typeof value === 'number' || typeof value === 'bigint')
        return Hex.fromNumber(value, { size });
    if (typeof value === 'string') {
        Hex.assert(value, { strict: true });
        return Hex.padLeft(value, size);
    }
    return Hex.fromBytes(Bytes.padLeft(value, size));
}
//# sourceMappingURL=VirtualMaster.js.map