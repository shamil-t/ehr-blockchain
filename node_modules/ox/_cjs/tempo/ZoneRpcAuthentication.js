"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingSignatureError = exports.InvalidSerializedError = exports.version = exports.fieldsSize = exports.magicBytes = exports.headerName = void 0;
exports.from = from;
exports.deserialize = deserialize;
exports.getFields = getFields;
exports.getSignPayload = getSignPayload;
exports.hash = hash;
exports.serialize = serialize;
const Errors = require("../core/Errors.js");
const Hash = require("../core/Hash.js");
const Hex = require("../core/Hex.js");
const SignatureEnvelope = require("./SignatureEnvelope.js");
const TempoAddress = require("./TempoAddress.js");
exports.headerName = 'X-Authorization-Token';
exports.magicBytes = '0x54656d706f5a6f6e655250430000000000000000000000000000000000000000';
exports.fieldsSize = 29;
exports.version = 0;
function from(authentication, options = {}) {
    const auth = authentication;
    const resolved = {
        ...auth,
        version: exports.version,
    };
    if (options.signature)
        return {
            ...resolved,
            signature: SignatureEnvelope.from(options.signature),
        };
    return resolved;
}
function deserialize(serialized) {
    const size = Hex.size(serialized);
    if (size <= exports.fieldsSize)
        throw new InvalidSerializedError({
            reason: `Serialized authentication must be longer than ${exports.fieldsSize} bytes.`,
            serialized,
        });
    const fieldsOffset = size - exports.fieldsSize;
    const signature = Hex.slice(serialized, 0, fieldsOffset);
    const fields = Hex.slice(serialized, fieldsOffset);
    const parsedVersion = Hex.toNumber(Hex.slice(fields, 0, 1), { size: 1 });
    if (parsedVersion !== exports.version)
        throw new InvalidSerializedError({
            reason: `Unsupported authentication version "${parsedVersion}". Expected "${exports.version}".`,
            serialized,
        });
    return {
        chainId: Hex.toNumber(Hex.slice(fields, 5, 13), { size: 8 }),
        expiresAt: Hex.toNumber(Hex.slice(fields, 21, 29), { size: 8 }),
        issuedAt: Hex.toNumber(Hex.slice(fields, 13, 21), { size: 8 }),
        signature: SignatureEnvelope.deserialize(signature),
        version: exports.version,
        zoneId: Hex.toNumber(Hex.slice(fields, 1, 5), { size: 4 }),
    };
}
function getFields(authentication) {
    return Hex.concat(Hex.fromNumber(exports.version, { size: 1 }), Hex.fromNumber(authentication.zoneId, { size: 4 }), Hex.fromNumber(authentication.chainId, { size: 8 }), Hex.fromNumber(authentication.issuedAt, { size: 8 }), Hex.fromNumber(authentication.expiresAt, { size: 8 }));
}
function getSignPayload(authentication, options = {}) {
    const authHash = hash(authentication);
    if (options.userAddress)
        return Hash.keccak256(Hex.concat('0x04', authHash, TempoAddress.resolve(options.userAddress)));
    return authHash;
}
function hash(authentication) {
    return Hash.keccak256(Hex.concat(exports.magicBytes, getFields(authentication)));
}
function serialize(authentication, options = {}) {
    const signature = options.signature || authentication.signature;
    if (!signature)
        throw new MissingSignatureError();
    return Hex.concat(SignatureEnvelope.serialize(SignatureEnvelope.from(signature)), getFields(authentication));
}
class InvalidSerializedError extends Errors.BaseError {
    constructor({ reason, serialized }) {
        super(`Unable to deserialize Zone RPC authentication: ${reason}`, {
            metaMessages: [`Serialized: ${serialized}`],
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'ZoneRpcAuthentication.InvalidSerializedError'
        });
    }
}
exports.InvalidSerializedError = InvalidSerializedError;
class MissingSignatureError extends Errors.BaseError {
    constructor() {
        super('Zone RPC authentication is missing a signature.');
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'ZoneRpcAuthentication.MissingSignatureError'
        });
    }
}
exports.MissingSignatureError = MissingSignatureError;
//# sourceMappingURL=ZoneRpcAuthentication.js.map