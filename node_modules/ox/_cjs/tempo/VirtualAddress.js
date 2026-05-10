"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidMagicError = exports.magic = void 0;
exports.from = from;
exports.isVirtual = isVirtual;
exports.parse = parse;
exports.validate = validate;
const Address = require("../core/Address.js");
const Bytes = require("../core/Bytes.js");
const Errors = require("../core/Errors.js");
const Hex = require("../core/Hex.js");
const TempoAddress = require("./TempoAddress.js");
exports.magic = '0xfdfdfdfdfdfdfdfdfdfd';
function from(value) {
    return Address.from(Hex.concat(toFixedHex(value.masterId, 4), exports.magic, toFixedHex(value.userTag, 6)));
}
function isVirtual(address) {
    try {
        const resolved = resolveAddress(address);
        return Hex.slice(resolved, 4, 14).toLowerCase() === exports.magic;
    }
    catch {
        return false;
    }
}
function parse(address) {
    const resolved = resolveAddress(address);
    if (Hex.slice(resolved, 4, 14).toLowerCase() !== exports.magic)
        throw new InvalidMagicError({ address: resolved });
    return {
        masterId: Hex.slice(resolved, 0, 4),
        userTag: Hex.slice(resolved, 14, 20),
    };
}
function validate(address) {
    try {
        parse(address);
        return true;
    }
    catch {
        return false;
    }
}
class InvalidMagicError extends Errors.BaseError {
    constructor({ address }) {
        super(`Address "${address}" does not contain the TIP-1022 virtual address marker.`);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'VirtualAddress.InvalidMagicError'
        });
    }
}
exports.InvalidMagicError = InvalidMagicError;
function resolveAddress(address) {
    const resolved = TempoAddress.resolve(address);
    Address.assert(resolved, { strict: false });
    return resolved;
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
//# sourceMappingURL=VirtualAddress.js.map