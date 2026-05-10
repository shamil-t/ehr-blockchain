"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignFailedError = void 0;
exports.deserializeOptions = deserializeOptions;
exports.deserializeResponse = deserializeResponse;
exports.getOptions = getOptions;
exports.getSignPayload = getSignPayload;
exports.serializeOptions = serializeOptions;
exports.serializeResponse = serializeResponse;
exports.sign = sign;
exports.verify = verify;
const Base64 = require("../core/Base64.js");
const Bytes = require("../core/Bytes.js");
const Errors = require("../core/Errors.js");
const Hash = require("../core/Hash.js");
const Hex = require("../core/Hex.js");
const internal = require("../core/internal/webauthn.js");
const P256 = require("../core/P256.js");
const Signature = require("../core/Signature.js");
const Authenticator_js_1 = require("./Authenticator.js");
const utils_js_1 = require("./internal/utils.js");
function deserializeOptions(options) {
    const { publicKey, ...rest } = options;
    if (!publicKey)
        return { ...rest };
    const { allowCredentials, challenge, extensions, ...publicKeyRest } = publicKey;
    return {
        ...rest,
        publicKey: {
            ...publicKeyRest,
            challenge: Bytes.fromHex(challenge),
            ...(allowCredentials && {
                allowCredentials: allowCredentials.map(({ id, ...rest }) => ({
                    ...rest,
                    id: Base64.toBytes(id),
                })),
            }),
            ...(extensions && {
                extensions: (0, utils_js_1.deserializeExtensions)(extensions),
            }),
        },
    };
}
function deserializeResponse(response) {
    const { id, metadata, raw, signature } = response;
    const rawResponse = {};
    for (const [key, value] of Object.entries(raw.response))
        rawResponse[key] = (0, utils_js_1.bytesToArrayBuffer)(Base64.toBytes(value));
    return {
        id,
        metadata,
        raw: {
            id: raw.id,
            type: raw.type,
            authenticatorAttachment: raw.authenticatorAttachment,
            rawId: (0, utils_js_1.bytesToArrayBuffer)(Base64.toBytes(raw.rawId)),
            response: rawResponse,
            getClientExtensionResults: () => ({}),
        },
        signature: Signature.from(signature),
    };
}
function getOptions(options) {
    const { credentialId, challenge, extensions, rpId = window.location.hostname, userVerification = 'required', } = options;
    return {
        publicKey: {
            ...(credentialId
                ? {
                    allowCredentials: Array.isArray(credentialId)
                        ? credentialId.map((id) => ({
                            id: Base64.toBytes(id),
                            type: 'public-key',
                        }))
                        : [
                            {
                                id: Base64.toBytes(credentialId),
                                type: 'public-key',
                            },
                        ],
                }
                : {}),
            challenge: Bytes.fromHex(challenge),
            ...(extensions && { extensions }),
            rpId,
            userVerification,
        },
    };
}
function getSignPayload(options) {
    const { challenge, crossOrigin, extraClientData, flag, origin, rpId, signCount, userVerification = 'required', } = options;
    const authenticatorData = (0, Authenticator_js_1.getAuthenticatorData)({
        flag,
        rpId,
        signCount,
    });
    const clientDataJSON = (0, Authenticator_js_1.getClientDataJSON)({
        challenge,
        crossOrigin,
        extraClientData,
        origin,
    });
    const clientDataJSONHash = Hash.sha256(Hex.fromString(clientDataJSON));
    const challengeIndex = clientDataJSON.indexOf('"challenge"');
    const typeIndex = clientDataJSON.indexOf('"type"');
    const metadata = {
        authenticatorData,
        clientDataJSON,
        challengeIndex,
        typeIndex,
        userVerificationRequired: userVerification === 'required',
    };
    const payload = Hex.concat(authenticatorData, clientDataJSONHash);
    return { metadata, payload };
}
function serializeOptions(options) {
    const { publicKey, signal: _, ...rest } = options;
    if (!publicKey)
        return { ...rest };
    const { allowCredentials, challenge, extensions, ...publicKeyRest } = publicKey;
    return {
        ...rest,
        publicKey: {
            ...publicKeyRest,
            challenge: Hex.fromBytes((0, utils_js_1.bufferSourceToBytes)(challenge)),
            ...(allowCredentials && {
                allowCredentials: allowCredentials.map(({ id, ...rest }) => ({
                    ...rest,
                    id: Base64.fromBytes((0, utils_js_1.bufferSourceToBytes)(id), utils_js_1.base64UrlOptions),
                })),
            }),
            ...(extensions && {
                extensions: (0, utils_js_1.serializeExtensions)(extensions),
            }),
        },
    };
}
function serializeResponse(response) {
    const { id, metadata, raw, signature } = response;
    const rawResponse = {};
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
            rawResponse[key] = Base64.fromBytes(new Uint8Array(value), utils_js_1.base64UrlOptions);
    }
    return {
        id,
        metadata,
        raw: {
            id: raw.id,
            type: raw.type,
            authenticatorAttachment: raw.authenticatorAttachment,
            rawId: Base64.fromBytes((0, utils_js_1.bufferSourceToBytes)(raw.rawId), utils_js_1.base64UrlOptions),
            response: rawResponse,
        },
        signature: Signature.toHex(signature),
    };
}
async function sign(options) {
    const { getFn = (opts) => window.navigator.credentials.get(opts), ...rest } = options;
    const requestOptions = 'publicKey' in rest
        ? rest
        : getOptions(rest);
    try {
        const credential = (await getFn(requestOptions));
        if (!credential)
            throw new SignFailedError();
        const response = credential.response;
        const clientDataJSONBytes = new Uint8Array(response.clientDataJSON);
        const authenticatorDataBytes = new Uint8Array(response.authenticatorData);
        const signatureBytes = new Uint8Array(response.signature);
        const id = credential.id;
        const clientDataJSON = String.fromCharCode(...clientDataJSONBytes);
        const challengeIndex = clientDataJSON.indexOf('"challenge"');
        const typeIndex = clientDataJSON.indexOf('"type"');
        const signature = internal.parseAsn1Signature(signatureBytes);
        return {
            id,
            metadata: {
                authenticatorData: Hex.fromBytes(authenticatorDataBytes),
                clientDataJSON,
                challengeIndex,
                typeIndex,
                userVerificationRequired: requestOptions.publicKey.userVerification === 'required',
            },
            signature,
            raw: credential,
        };
    }
    catch (error) {
        throw new SignFailedError({
            cause: error,
        });
    }
}
class SignFailedError extends Errors.BaseError {
    constructor({ cause } = {}) {
        super('Failed to request credential.', {
            cause,
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Authentication.SignFailedError'
        });
    }
}
exports.SignFailedError = SignFailedError;
function verify(options) {
    const { challenge, metadata, origin, publicKey, rpId, signature } = options;
    const { authenticatorData, clientDataJSON, userVerificationRequired } = metadata;
    const authenticatorDataBytes = Bytes.fromHex(authenticatorData);
    if (authenticatorDataBytes.length < 37)
        return false;
    if (rpId !== undefined) {
        const rpIdHash = authenticatorDataBytes.slice(0, 32);
        const expectedRpIdHash = Hash.sha256(Hex.fromString(rpId), { as: 'Bytes' });
        if (!Bytes.isEqual(rpIdHash, expectedRpIdHash))
            return false;
    }
    const flag = authenticatorDataBytes[32];
    if ((flag & 0x01) !== 0x01)
        return false;
    if (userVerificationRequired && (flag & 0x04) !== 0x04)
        return false;
    if ((flag & 0x08) !== 0x08 && (flag & 0x10) === 0x10)
        return false;
    const clientData = JSON.parse(clientDataJSON);
    if (clientData.type !== 'webauthn.get')
        return false;
    if (!clientData.challenge ||
        Hex.fromBytes(Base64.toBytes(clientData.challenge)) !== challenge)
        return false;
    if (origin !== undefined) {
        const origins = Array.isArray(origin) ? origin : [origin];
        if (!origins.includes(clientData.origin))
            return false;
    }
    const clientDataJSONHash = Hash.sha256(Bytes.fromString(clientDataJSON), {
        as: 'Bytes',
    });
    const payload = Bytes.concat(authenticatorDataBytes, clientDataJSONHash);
    return P256.verify({
        hash: true,
        payload,
        publicKey,
        signature,
    });
}
//# sourceMappingURL=Authentication.js.map