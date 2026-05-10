"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.from = from;
exports.fromAddress = fromAddress;
exports.toAddress = toAddress;
exports.compute = compute;
const AbiParameters = require("../core/AbiParameters.js");
const Address = require("../core/Address.js");
const Hash = require("../core/Hash.js");
const Hex = require("../core/Hex.js");
const TempoAddress = require("./TempoAddress.js");
const tip20Prefix = '0x20c0';
function from(tokenIdOrAddress) {
    if (typeof tokenIdOrAddress === 'bigint' ||
        typeof tokenIdOrAddress === 'number')
        return BigInt(tokenIdOrAddress);
    return fromAddress(tokenIdOrAddress);
}
function fromAddress(address) {
    const resolved = TempoAddress.resolve(address);
    if (!resolved.toLowerCase().startsWith(tip20Prefix))
        throw new Error('invalid tip20 address.');
    return Hex.toBigInt(Hex.slice(resolved, tip20Prefix.length));
}
function toAddress(tokenId) {
    if (typeof tokenId === 'string') {
        const resolved = TempoAddress.resolve(tokenId);
        Address.assert(resolved);
        return resolved;
    }
    const tokenIdHex = Hex.fromNumber(tokenId, { size: 18 });
    return Hex.concat(tip20Prefix, tokenIdHex);
}
function compute(value) {
    const hash = Hash.keccak256(AbiParameters.encode(AbiParameters.from('address, bytes32'), [
        TempoAddress.resolve(value.sender),
        value.salt,
    ]));
    return Hex.toBigInt(Hex.slice(hash, 0, 8));
}
//# sourceMappingURL=TokenId.js.map