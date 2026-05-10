"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidPrefixError = void 0;
exports.resolve = resolve;
exports.format = format;
exports.parse = parse;
exports.validate = validate;
const core_Address = require("../core/Address.js");
const Errors = require("../core/Errors.js");
const Hex = require("../core/Hex.js");
function resolve(address) {
    if (address.startsWith('tempo'))
        return parse(address).address;
    return address;
}
function format(address) {
    const resolved = resolve(address);
    return `tempox${resolved.toLowerCase()}`;
}
function parse(tempoAddress) {
    if (!tempoAddress.startsWith('tempox'))
        throw new InvalidPrefixError({ address: tempoAddress });
    const hex = tempoAddress.slice('tempox'.length);
    Hex.assert(hex, { strict: true });
    const address = core_Address.checksum(hex);
    return { address };
}
function validate(tempoAddress) {
    try {
        parse(tempoAddress);
        return true;
    }
    catch {
        return false;
    }
}
class InvalidPrefixError extends Errors.BaseError {
    constructor({ address }) {
        super(`Tempo address "${address}" has an invalid prefix. Expected "tempox".`);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'TempoAddress.InvalidPrefixError'
        });
    }
}
exports.InvalidPrefixError = InvalidPrefixError;
//# sourceMappingURL=TempoAddress.js.map