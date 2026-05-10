"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = serialize;
exports.deserialize = deserialize;
const Base64 = require("../core/Base64.js");
const Cbor = require("../core/Cbor.js");
const PublicKey = require("../core/PublicKey.js");
const utils_js_1 = require("./internal/utils.js");
function serialize(credential) {
    const { attestationObject, clientDataJSON, id, publicKey, raw } = credential;
    const response = {};
    for (const key of utils_js_1.responseKeys) {
        const r = raw.response;
        let value = r[key];
        if (!(value instanceof ArrayBuffer)) {
            const getter = `get${key[0].toUpperCase()}${key.slice(1)}`;
            const fn = r[getter];
            if (typeof fn === 'function')
                value = fn.call(r);
        }
        if (value instanceof ArrayBuffer)
            response[key] = Base64.fromBytes(new Uint8Array(value), utils_js_1.base64UrlOptions);
    }
    if (!response.authenticatorData) {
        const attestation = Cbor.decode(new Uint8Array(attestationObject));
        if (attestation.authData)
            response.authenticatorData = Base64.fromBytes(attestation.authData, utils_js_1.base64UrlOptions);
    }
    return {
        attestationObject: Base64.fromBytes(new Uint8Array(attestationObject), utils_js_1.base64UrlOptions),
        clientDataJSON: Base64.fromBytes(new Uint8Array(clientDataJSON), utils_js_1.base64UrlOptions),
        id,
        publicKey: PublicKey.toHex(publicKey),
        raw: {
            id: raw.id,
            type: raw.type,
            authenticatorAttachment: raw.authenticatorAttachment,
            rawId: Base64.fromBytes((0, utils_js_1.bufferSourceToBytes)(raw.rawId), utils_js_1.base64UrlOptions),
            response: response,
        },
    };
}
function deserialize(credential) {
    const { attestationObject, clientDataJSON, id, publicKey, raw } = credential;
    const response = Object.create(null);
    for (const key of utils_js_1.responseKeys) {
        const value = raw.response[key];
        if (value)
            response[key] = (0, utils_js_1.bytesToArrayBuffer)(Base64.toBytes(value));
    }
    return {
        attestationObject: (0, utils_js_1.bytesToArrayBuffer)(Base64.toBytes(attestationObject)),
        clientDataJSON: (0, utils_js_1.bytesToArrayBuffer)(Base64.toBytes(clientDataJSON)),
        id,
        publicKey: PublicKey.from(publicKey),
        raw: {
            id: raw.id,
            type: raw.type,
            authenticatorAttachment: raw.authenticatorAttachment,
            rawId: (0, utils_js_1.bytesToArrayBuffer)(Base64.toBytes(raw.rawId)),
            response: response,
            getClientExtensionResults: () => ({}),
        },
    };
}
//# sourceMappingURL=Credential.js.map