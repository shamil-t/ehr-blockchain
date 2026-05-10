"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidCharacterError = void 0;
exports.fromBytes = fromBytes;
exports.fromHex = fromHex;
exports.toBytes = toBytes;
exports.toHex = toHex;
const Bytes = require("./Bytes.js");
const Errors = require("./Errors.js");
const Hex = require("./Hex.js");
const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const alphabetMap = (() => {
    const map = {};
    for (let i = 0; i < alphabet.length; i++)
        map[alphabet[i]] = i;
    return map;
})();
function fromBytes(value) {
    let bits = 0;
    let acc = 0;
    let result = '';
    for (const byte of value) {
        acc = (acc << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            bits -= 5;
            result += alphabet[(acc >>> bits) & 0x1f];
        }
    }
    if (bits > 0)
        result += alphabet[(acc << (5 - bits)) & 0x1f];
    return result;
}
function fromHex(value) {
    return fromBytes(Bytes.fromHex(value));
}
function toBytes(value) {
    const values = [];
    for (const char of value) {
        const v = alphabetMap[char];
        if (v === undefined)
            throw new InvalidCharacterError({ character: char });
        values.push(v);
    }
    let bits = 0;
    let acc = 0;
    const bytes = [];
    for (const v of values) {
        acc = (acc << 5) | v;
        bits += 5;
        if (bits >= 8) {
            bits -= 8;
            bytes.push((acc >>> bits) & 0xff);
        }
    }
    return new Uint8Array(bytes);
}
function toHex(value) {
    return Hex.fromBytes(toBytes(value));
}
class InvalidCharacterError extends Errors.BaseError {
    constructor({ character }) {
        super(`Invalid bech32 base32 character: "${character}".`);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Base32.InvalidCharacterError'
        });
    }
}
exports.InvalidCharacterError = InvalidCharacterError;
//# sourceMappingURL=Base32.js.map