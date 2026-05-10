"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegistrationHash = getRegistrationHash;
exports.getMasterId = getMasterId;
exports.validateSalt = validateSalt;
exports.mineSalt = mineSalt;
exports.mineSaltAsync = mineSaltAsync;
const sha3_1 = require("@noble/hashes/sha3");
const Address = require("../core/Address.js");
const Bytes = require("../core/Bytes.js");
const Errors = require("../core/Errors.js");
const Hash = require("../core/Hash.js");
const Hex = require("../core/Hex.js");
const VirtualMasterPool = require("./internal/virtualMasterPool.js");
const TempoAddress = require("./TempoAddress.js");
const VirtualAddress = require("./VirtualAddress.js");
const tip20Prefix = '0x20c000000000000000000000';
const zeroAddress = '0x0000000000000000000000000000000000000000';
function getRegistrationHash(value) {
    return Hash.keccak256(Hex.concat(resolveAddress(value.address), toFixedHex(value.salt, 32)));
}
function getMasterId(value) {
    return Hex.slice(getRegistrationHash(value), 4, 8);
}
function validateSalt(value) {
    try {
        return hasProofOfWork(Hash.keccak256(Hex.concat(resolveAddress(value.address), toFixedHex(value.salt, 32)), { as: 'Bytes' }));
    }
    catch {
        return false;
    }
}
function mineSalt(value) {
    const count = value.count ?? 2 ** 32;
    assertCount(count);
    const addressBytes = Bytes.fromHex(resolveAddress(value.address));
    const input = new Uint8Array(addressBytes.length + 32);
    input.set(addressBytes);
    const saltView = input.subarray(addressBytes.length);
    saltView.set(toFixedBytes(value.start ?? 0n, 32));
    for (let i = 0; i < count; i++) {
        const hash = (0, sha3_1.keccak_256)(input);
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
async function mineSaltAsync(parameters) {
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
        await new Promise((r) => setTimeout(r, 0));
    }
    return undefined;
}
function assertWorkers(workers) {
    if (Number.isSafeInteger(workers) && workers >= 0)
        return;
    throw new Errors.BaseError(`Workers "${workers}" is invalid. Expected a non-negative safe integer.`);
}
function getAbortError(signal) {
    const reason = signal?.reason;
    if (reason instanceof Error)
        return reason;
    return new Errors.BaseError('The operation was aborted.');
}
function getDefaultWorkerCount() {
    if (typeof navigator !== 'undefined') {
        const c = navigator.hardwareConcurrency;
        if (c && c > 1)
            return c - 1;
    }
    return 1;
}
function throwIfAborted(signal) {
    if (!signal?.aborted)
        return;
    throw getAbortError(signal);
}
function hasProofOfWork(hash) {
    return hash[0] === 0 && hash[1] === 0 && hash[2] === 0 && hash[3] === 0;
}
function assertCount(count) {
    if (Number.isSafeInteger(count) && count > 0)
        return;
    throw new Errors.BaseError(`Count "${count}" is invalid. Expected a positive safe integer.`);
}
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
function resolveAddress(address) {
    const resolved = TempoAddress.resolve(address);
    Address.assert(resolved, { strict: false });
    assertValidMasterAddress(resolved);
    return resolved;
}
function assertValidMasterAddress(address) {
    const normalized = address.toLowerCase();
    if (normalized === zeroAddress)
        throw new Errors.BaseError('Virtual master address cannot be the zero address.');
    if (VirtualAddress.isVirtual(address))
        throw new Errors.BaseError('Virtual master address cannot itself be a virtual address.');
    if (normalized.startsWith(tip20Prefix))
        throw new Errors.BaseError('Virtual master address cannot be a TIP-20 token address.');
}
function toFixedBytes(value, size) {
    return Bytes.fromHex(toFixedHex(value, size));
}
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