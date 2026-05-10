"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientBytesError = exports.NegativeValueError = void 0;
exports.toBytes = toBytes;
exports.toHex = toHex;
exports.fromBytes = fromBytes;
exports.fromHex = fromHex;
const Bytes = require("./Bytes.js");
const Errors = require("./Errors.js");
const Hex = require("./Hex.js");
function toBytes(value) {
    const n = BigInt(value);
    if (n < 0n)
        throw new NegativeValueError({ value: n });
    if (n <= 252n)
        return new Uint8Array([Number(n)]);
    if (n <= 0xffffn) {
        const buf = new Uint8Array(3);
        buf[0] = 0xfd;
        const view = new DataView(buf.buffer);
        view.setUint16(1, Number(n), true);
        return buf;
    }
    if (n <= 0xffffffffn) {
        const buf = new Uint8Array(5);
        buf[0] = 0xfe;
        const view = new DataView(buf.buffer);
        view.setUint32(1, Number(n), true);
        return buf;
    }
    const buf = new Uint8Array(9);
    buf[0] = 0xff;
    const view = new DataView(buf.buffer);
    view.setBigUint64(1, n, true);
    return buf;
}
function toHex(value) {
    return Hex.fromBytes(toBytes(value));
}
function fromBytes(data) {
    if (data.length === 0)
        throw new InsufficientBytesError({ expected: 1, actual: 0 });
    const first = data[0];
    if (first < 0xfd)
        return { value: BigInt(first), size: 1 };
    const view = new DataView(data.buffer, data.byteOffset);
    if (first === 0xfd) {
        if (data.length < 3)
            throw new InsufficientBytesError({ expected: 3, actual: data.length });
        return { value: BigInt(view.getUint16(1, true)), size: 3 };
    }
    if (first === 0xfe) {
        if (data.length < 5)
            throw new InsufficientBytesError({ expected: 5, actual: data.length });
        return { value: BigInt(view.getUint32(1, true)), size: 5 };
    }
    if (data.length < 9)
        throw new InsufficientBytesError({ expected: 9, actual: data.length });
    return {
        value: view.getBigUint64(1, true),
        size: 9,
    };
}
function fromHex(data) {
    return fromBytes(Bytes.fromHex(data));
}
class NegativeValueError extends Errors.BaseError {
    constructor({ value }) {
        super(`CompactSize value must be non-negative, got ${value}.`);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'CompactSize.NegativeValueError'
        });
    }
}
exports.NegativeValueError = NegativeValueError;
class InsufficientBytesError extends Errors.BaseError {
    constructor({ expected, actual }) {
        super(`Insufficient bytes for CompactSize decoding. Expected at least ${expected}, got ${actual}.`);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'CompactSize.InsufficientBytesError'
        });
    }
}
exports.InsufficientBytesError = InsufficientBytesError;
//# sourceMappingURL=CompactSize.js.map