"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExceedsLengthError = exports.InvalidHrpError = exports.MixedCaseError = exports.InvalidPaddingError = exports.InvalidCharacterError = exports.InvalidChecksumError = exports.NoSeparatorError = void 0;
exports.encode = encode;
exports.decode = decode;
const Errors_js_1 = require("./Errors.js");
function encode(hrp, data, options = {}) {
    const { limit = 90 } = options;
    hrp = hrp.toLowerCase();
    if (hrp.length === 0)
        throw new InvalidHrpError();
    for (let i = 0; i < hrp.length; i++) {
        const c = hrp.charCodeAt(i);
        if (c < 33 || c > 126)
            throw new InvalidHrpError();
    }
    const data5 = convertBits(data, 8, 5, true);
    if (hrp.length + 1 + data5.length + 6 > limit)
        throw new ExceedsLengthError({ limit });
    const checksum = createChecksum(hrp, data5);
    let result = hrp + '1';
    for (const d of data5.concat(checksum))
        result += alphabet[d];
    return result;
}
function decode(str, options = {}) {
    const { limit = 90 } = options;
    if (str.length > limit)
        throw new ExceedsLengthError({ limit });
    if (str !== str.toLowerCase() && str !== str.toUpperCase())
        throw new MixedCaseError();
    const lower = str.toLowerCase();
    const pos = lower.lastIndexOf('1');
    if (pos === -1)
        throw new NoSeparatorError();
    if (pos === 0)
        throw new InvalidHrpError();
    if (pos + 7 > lower.length)
        throw new InvalidChecksumError();
    const hrp = lower.slice(0, pos);
    for (let i = 0; i < hrp.length; i++) {
        const c = hrp.charCodeAt(i);
        if (c < 33 || c > 126)
            throw new InvalidHrpError();
    }
    const dataChars = lower.slice(pos + 1);
    const data5 = [];
    for (const c of dataChars) {
        const v = alphabetMap[c];
        if (v === undefined)
            throw new InvalidCharacterError({ character: c });
        data5.push(v);
    }
    if (!verifyChecksum(hrp, data5))
        throw new InvalidChecksumError();
    const data8 = convertBits(data5.slice(0, -6), 5, 8, false);
    return { hrp, data: new Uint8Array(data8) };
}
class NoSeparatorError extends Errors_js_1.BaseError {
    constructor() {
        super('Bech32m string has no separator.');
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Bech32m.NoSeparatorError'
        });
    }
}
exports.NoSeparatorError = NoSeparatorError;
class InvalidChecksumError extends Errors_js_1.BaseError {
    constructor() {
        super('Invalid bech32m checksum.');
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Bech32m.InvalidChecksumError'
        });
    }
}
exports.InvalidChecksumError = InvalidChecksumError;
class InvalidCharacterError extends Errors_js_1.BaseError {
    constructor({ character }) {
        super(`Invalid bech32m character: "${character}".`);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Bech32m.InvalidCharacterError'
        });
    }
}
exports.InvalidCharacterError = InvalidCharacterError;
class InvalidPaddingError extends Errors_js_1.BaseError {
    constructor() {
        super('Invalid padding in bech32m data.');
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Bech32m.InvalidPaddingError'
        });
    }
}
exports.InvalidPaddingError = InvalidPaddingError;
class MixedCaseError extends Errors_js_1.BaseError {
    constructor() {
        super('Bech32m string must not contain mixed case.');
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Bech32m.MixedCaseError'
        });
    }
}
exports.MixedCaseError = MixedCaseError;
class InvalidHrpError extends Errors_js_1.BaseError {
    constructor() {
        super('Invalid bech32m human-readable part (HRP). Must be 1+ characters in ASCII range 33-126.');
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Bech32m.InvalidHrpError'
        });
    }
}
exports.InvalidHrpError = InvalidHrpError;
class ExceedsLengthError extends Errors_js_1.BaseError {
    constructor({ limit }) {
        super(`Bech32m string exceeds length limit of ${limit}.`);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Bech32m.ExceedsLengthError'
        });
    }
}
exports.ExceedsLengthError = ExceedsLengthError;
const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const alphabetMap = (() => {
    const map = {};
    for (let i = 0; i < alphabet.length; i++)
        map[alphabet[i]] = i;
    return map;
})();
const BECH32M_CONST = 0x2bc830a3;
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
function polymod(values) {
    let chk = 1;
    for (const v of values) {
        const b = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ v;
        for (let i = 0; i < 5; i++)
            if ((b >> i) & 1)
                chk ^= GEN[i];
    }
    return chk;
}
function hrpExpand(hrp) {
    const ret = [];
    for (let i = 0; i < hrp.length; i++)
        ret.push(hrp.charCodeAt(i) >> 5);
    ret.push(0);
    for (let i = 0; i < hrp.length; i++)
        ret.push(hrp.charCodeAt(i) & 31);
    return ret;
}
function createChecksum(hrp, data) {
    const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
    const mod = polymod(values) ^ BECH32M_CONST;
    const ret = [];
    for (let i = 0; i < 6; i++)
        ret.push((mod >> (5 * (5 - i))) & 31);
    return ret;
}
function verifyChecksum(hrp, data) {
    return polymod(hrpExpand(hrp).concat(data)) === BECH32M_CONST;
}
function convertBits(data, fromBits, toBits, pad) {
    let acc = 0;
    let bits = 0;
    const maxv = (1 << toBits) - 1;
    const ret = [];
    for (const value of data) {
        acc = (acc << fromBits) | value;
        bits += fromBits;
        while (bits >= toBits) {
            bits -= toBits;
            ret.push((acc >> bits) & maxv);
        }
    }
    if (pad) {
        if (bits > 0)
            ret.push((acc << (toBits - bits)) & maxv);
    }
    else if (bits >= fromBits || (acc << (toBits - bits)) & maxv) {
        throw new InvalidPaddingError();
    }
    return ret;
}
//# sourceMappingURL=Bech32m.js.map