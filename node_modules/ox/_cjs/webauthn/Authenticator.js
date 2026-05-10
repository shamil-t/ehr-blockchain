"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthenticatorData = getAuthenticatorData;
exports.getSignCount = getSignCount;
exports.getClientDataJSON = getClientDataJSON;
exports.getAttestationObject = getAttestationObject;
const Base64 = require("../core/Base64.js");
const Bytes = require("../core/Bytes.js");
const Cbor = require("../core/Cbor.js");
const CoseKey = require("../core/CoseKey.js");
const Hash = require("../core/Hash.js");
const Hex = require("../core/Hex.js");
function getAuthenticatorData(options = {}) {
    const { credential, flag = 5, rpId = window.location.hostname, signCount = 0, } = options;
    const rpIdHash = Hash.sha256(Hex.fromString(rpId));
    const flag_bytes = Hex.fromNumber(flag, { size: 1 });
    const signCount_bytes = Hex.fromNumber(signCount, { size: 4 });
    const base = Hex.concat(rpIdHash, flag_bytes, signCount_bytes);
    if (!credential)
        return base;
    const aaguid = Hex.fromBytes(new Uint8Array(16));
    const credentialId = Hex.fromBytes(credential.id);
    const credIdLen = Hex.fromNumber(credential.id.length, { size: 2 });
    const coseKey = CoseKey.fromPublicKey(credential.publicKey);
    return Hex.concat(base, aaguid, credIdLen, credentialId, coseKey);
}
function getSignCount(authenticatorData) {
    const bytes = Bytes.fromHex(authenticatorData);
    if (bytes.length < 37)
        return 0;
    return (((bytes[33] << 24) |
        (bytes[34] << 16) |
        (bytes[35] << 8) |
        bytes[36]) >>>
        0);
}
function getClientDataJSON(options) {
    const { challenge, crossOrigin = false, extraClientData, origin = window.location.origin, type = 'webauthn.get', } = options;
    return JSON.stringify({
        type,
        challenge: Base64.fromHex(challenge, { url: true, pad: false }),
        origin,
        crossOrigin,
        ...extraClientData,
    });
}
function getAttestationObject(options) {
    const { attStmt = {}, authData, fmt = 'none' } = options;
    return Cbor.encode({
        fmt,
        attStmt,
        authData: Hex.toBytes(authData),
    });
}
//# sourceMappingURL=Authenticator.js.map