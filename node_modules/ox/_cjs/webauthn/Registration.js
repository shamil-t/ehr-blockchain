"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFailedError = exports.VerifyError = exports.createChallenge = void 0;
exports.create = create;
exports.getOptions = getOptions;
exports.serializeResponse = serializeResponse;
exports.serializeOptions = serializeOptions;
exports.deserializeOptions = deserializeOptions;
exports.deserializeResponse = deserializeResponse;
exports.verify = verify;
const Base64 = require("../core/Base64.js");
const Bytes = require("../core/Bytes.js");
const Cbor = require("../core/Cbor.js");
const CoseKey = require("../core/CoseKey.js");
const Errors = require("../core/Errors.js");
const Hash = require("../core/Hash.js");
const Hex = require("../core/Hex.js");
const internal = require("../core/internal/webauthn.js");
const P256 = require("../core/P256.js");
const PublicKey = require("../core/PublicKey.js");
const Signature = require("../core/Signature.js");
const utils_js_1 = require("./internal/utils.js");
exports.createChallenge = Uint8Array.from([
    105, 171, 180, 181, 160, 222, 75, 198, 42, 42, 32, 31, 141, 37, 186, 233,
]);
async function create(options) {
    const { createFn = (opts) => window.navigator.credentials.create(opts), ...rest } = options;
    const creationOptions = 'publicKey' in rest
        ? rest
        : getOptions(rest);
    try {
        const credential = (await createFn(creationOptions));
        if (!credential)
            throw new CreateFailedError();
        const response = credential.response;
        const attestationObject = response.attestationObject;
        const clientDataJSON = response.clientDataJSON;
        const id = credential.id;
        const publicKey = await internal.parseCredentialPublicKey(response, attestationObject);
        return {
            attestationObject,
            clientDataJSON,
            id,
            publicKey,
            raw: credential,
        };
    }
    catch (error) {
        throw new CreateFailedError({
            cause: error,
        });
    }
}
function getOptions(options) {
    const { attestation = 'none', authenticatorSelection = {
        residentKey: 'preferred',
        requireResidentKey: false,
        userVerification: 'required',
    }, challenge = exports.createChallenge, excludeCredentialIds, extensions, name: name_, rp = {
        id: window.location.hostname,
        name: window.document.title,
    }, user, } = options;
    const name = (user?.name ?? name_);
    return {
        publicKey: {
            attestation,
            authenticatorSelection,
            challenge: typeof challenge === 'string' ? Bytes.fromHex(challenge) : challenge,
            ...(excludeCredentialIds
                ? {
                    excludeCredentials: excludeCredentialIds?.map((id) => ({
                        id: Base64.toBytes(id),
                        type: 'public-key',
                    })),
                }
                : {}),
            pubKeyCredParams: [
                {
                    type: 'public-key',
                    alg: -7,
                },
            ],
            rp,
            user: {
                id: user?.id ?? Hash.keccak256(Bytes.fromString(name), { as: 'Bytes' }),
                name,
                displayName: user?.displayName ?? name,
            },
            ...(extensions && { extensions }),
        },
    };
}
function serializeResponse(response) {
    const { credential, ...rest } = response;
    const rawResponse = {};
    for (const key of utils_js_1.responseKeys) {
        const r = credential.raw.response;
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
        ...rest,
        credential: {
            attestationObject: Base64.fromBytes(new Uint8Array(credential.attestationObject), utils_js_1.base64UrlOptions),
            clientDataJSON: Base64.fromBytes(new Uint8Array(credential.clientDataJSON), utils_js_1.base64UrlOptions),
            id: credential.id,
            publicKey: PublicKey.toHex(credential.publicKey),
            raw: {
                id: credential.raw.id,
                type: credential.raw.type,
                authenticatorAttachment: credential.raw.authenticatorAttachment,
                rawId: Base64.fromBytes((0, utils_js_1.bufferSourceToBytes)(credential.raw.rawId), utils_js_1.base64UrlOptions),
                response: rawResponse,
            },
        },
    };
}
function serializeOptions(options) {
    const publicKey = options.publicKey;
    if (!publicKey)
        return {};
    const { challenge, excludeCredentials, extensions, user, ...rest } = publicKey;
    return {
        publicKey: {
            ...rest,
            challenge: Hex.fromBytes((0, utils_js_1.bufferSourceToBytes)(challenge)),
            ...(excludeCredentials && {
                excludeCredentials: excludeCredentials.map(({ id, ...rest }) => ({
                    ...rest,
                    id: Base64.fromBytes((0, utils_js_1.bufferSourceToBytes)(id), utils_js_1.base64UrlOptions),
                })),
            }),
            ...(extensions && {
                extensions: (0, utils_js_1.serializeExtensions)(extensions),
            }),
            user: {
                ...user,
                id: Base64.fromBytes((0, utils_js_1.bufferSourceToBytes)(user.id), utils_js_1.base64UrlOptions),
            },
        },
    };
}
function deserializeOptions(options) {
    const publicKey = options.publicKey;
    if (!publicKey)
        return {};
    const { challenge, excludeCredentials, extensions, user, ...rest } = publicKey;
    return {
        publicKey: {
            ...rest,
            challenge: Bytes.fromHex(challenge),
            ...(excludeCredentials && {
                excludeCredentials: excludeCredentials.map(({ id, ...rest }) => ({
                    ...rest,
                    id: Base64.toBytes(id),
                })),
            }),
            ...(extensions && {
                extensions: (0, utils_js_1.deserializeExtensions)(extensions),
            }),
            user: {
                ...user,
                id: Base64.toBytes(user.id),
            },
        },
    };
}
function deserializeResponse(response) {
    const { credential, ...rest } = response;
    const rawResponse = {};
    for (const [key, value] of Object.entries(credential.raw.response))
        rawResponse[key] = (0, utils_js_1.bytesToArrayBuffer)(Base64.toBytes(value));
    return {
        ...rest,
        credential: {
            attestationObject: (0, utils_js_1.bytesToArrayBuffer)(Base64.toBytes(credential.attestationObject)),
            clientDataJSON: (0, utils_js_1.bytesToArrayBuffer)(Base64.toBytes(credential.clientDataJSON)),
            id: credential.id,
            publicKey: PublicKey.from(credential.publicKey),
            raw: {
                id: credential.raw.id,
                type: credential.raw.type,
                authenticatorAttachment: credential.raw.authenticatorAttachment,
                rawId: (0, utils_js_1.bytesToArrayBuffer)(Base64.toBytes(credential.raw.rawId)),
                response: rawResponse,
                getClientExtensionResults: () => ({}),
            },
        },
    };
}
function verify(options) {
    const { attestation = 'none', credential, origin, rpId, userVerification = 'required', } = options;
    const clientDataJSONBytes = new Uint8Array(credential.clientDataJSON);
    const clientDataJSON = Bytes.toString(clientDataJSONBytes);
    const clientData = JSON.parse(clientDataJSON);
    if (clientData.type !== 'webauthn.create')
        throw new VerifyError(`Expected clientData.type "webauthn.create", got "${clientData.type}"`);
    const challengeResult = (() => {
        if (typeof options.challenge === 'function')
            return options.challenge(clientData.challenge);
        const challengeBytes = typeof options.challenge === 'string'
            ? Bytes.fromHex(options.challenge)
            : options.challenge;
        const challenge = Base64.fromBytes(challengeBytes, utils_js_1.base64UrlOptions);
        return clientData.challenge === challenge;
    })();
    if (!challengeResult)
        throw new VerifyError('Challenge mismatch');
    const origins = Array.isArray(origin) ? origin : [origin];
    if (!origins.includes(clientData.origin))
        throw new VerifyError(`Origin mismatch: expected ${JSON.stringify(origin)}, got "${clientData.origin}"`);
    const attestationObjectBytes = new Uint8Array(credential.attestationObject);
    const attestation_ = Cbor.decode(attestationObjectBytes);
    const authData = attestation_.authData;
    const rpIdHash = authData.slice(0, 32);
    const expectedRpIdHash = Hash.sha256(Hex.fromString(rpId), { as: 'Bytes' });
    if (!Bytes.isEqual(rpIdHash, expectedRpIdHash))
        throw new VerifyError('rpId hash mismatch');
    const flags = authData[32];
    const up = (flags & 0x01) !== 0;
    const uv = (flags & 0x04) !== 0;
    const at = (flags & 0x40) !== 0;
    const be = (flags & 0x08) !== 0;
    const bs = (flags & 0x10) !== 0;
    if (!up)
        throw new VerifyError('User presence flag not set');
    if (!at)
        throw new VerifyError('Attested credential data flag not set');
    if (userVerification === 'required' && !uv)
        throw new VerifyError('User verification flag not set');
    if (!be && bs)
        throw new VerifyError('Backup state (BS) flag is set but backup eligibility (BE) flag is not');
    if (authData.length < 55)
        throw new VerifyError('authData too short for attested credential data');
    const counter = ((authData[33] << 24) |
        (authData[34] << 16) |
        (authData[35] << 8) |
        authData[36]) >>>
        0;
    const credIdLen = (authData[53] << 8) | authData[54];
    if (55 + credIdLen > authData.length)
        throw new VerifyError('credIdLen exceeds authData bounds');
    const credentialId = authData.slice(55, 55 + credIdLen);
    if (credential.id !== undefined) {
        const expectedId = Base64.fromBytes(credentialId, utils_js_1.base64UrlOptions);
        if (credential.id !== expectedId)
            throw new VerifyError(`Credential ID mismatch: supplied "${credential.id}" does not match authData "${expectedId}"`);
    }
    const ed = (flags & 0x80) !== 0;
    const coseKeyBytes = authData.slice(55 + credIdLen);
    const coseKeyHex = Hex.fromBytes(coseKeyBytes);
    const coseKeyData = Cbor.decode(coseKeyHex);
    if (coseKeyData['1'] !== 2 ||
        coseKeyData['3'] !== -7 ||
        coseKeyData['-1'] !== 1)
        throw new VerifyError('COSE key must be EC2 (kty=2) with ES256 algorithm (alg=-7) on P-256 curve (crv=1)');
    const publicKey = CoseKey.toPublicKey(coseKeyHex);
    const expectedCoseKeyLen = Bytes.fromHex(CoseKey.fromPublicKey(publicKey)).length;
    const trailingBytes = coseKeyBytes.length - expectedCoseKeyLen;
    if (trailingBytes > 0 && !ed)
        throw new VerifyError(`authData contains ${trailingBytes} unexpected trailing byte(s) after COSE key`);
    const clientDataHash = Hash.sha256(Bytes.fromString(clientDataJSON), {
        as: 'Bytes',
    });
    const verificationData = Bytes.concat(authData, clientDataHash);
    const { fmt, attStmt } = attestation_;
    if (fmt === 'none') {
        if (attestation === 'required')
            throw new VerifyError('Attestation format is "none" but attestation verification is required. ' +
                'Set `attestation: "none"` to accept unattested credentials.');
    }
    else if (fmt === 'packed') {
        const sig = attStmt.sig;
        const alg = attStmt.alg;
        if (!(sig instanceof Uint8Array) || typeof alg !== 'number')
            throw new VerifyError('Invalid packed attestation statement: missing sig or alg');
        if (alg !== -7)
            throw new VerifyError(`Unsupported attestation algorithm: ${alg} (expected -7 / ES256)`);
        if (attStmt.x5c) {
            throw new VerifyError('Packed attestation with x5c certificate chain is not supported. ' +
                'Use self attestation (no x5c) or set `attestation: "none"`.');
        }
        const attSignature = Signature.fromDerBytes(sig);
        const verified = P256.verify({
            hash: true,
            payload: verificationData,
            publicKey,
            signature: attSignature,
        });
        if (!verified)
            throw new VerifyError('Attestation signature verification failed');
    }
    else {
        throw new VerifyError(`Unsupported attestation format: "${fmt}"`);
    }
    const id = credential.id ?? Base64.fromBytes(credentialId, utils_js_1.base64UrlOptions);
    const raw = credential.raw ?? {
        authenticatorAttachment: null,
        getClientExtensionResults: () => ({}),
        id,
        rawId: (0, utils_js_1.bytesToArrayBuffer)(credentialId),
        response: {
            attestationObject: credential.attestationObject,
            clientDataJSON: credential.clientDataJSON,
        },
        type: 'public-key',
    };
    return {
        credential: {
            attestationObject: credential.attestationObject,
            clientDataJSON: credential.clientDataJSON,
            id,
            publicKey,
            raw,
        },
        counter,
        ...(uv ? { userVerified: true } : {}),
        ...(be ? { backedUp: bs } : {}),
        ...(be
            ? {
                deviceType: bs ? 'multiDevice' : 'singleDevice',
            }
            : {}),
    };
}
class VerifyError extends Errors.BaseError {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Registration.VerifyError'
        });
    }
}
exports.VerifyError = VerifyError;
class CreateFailedError extends Errors.BaseError {
    constructor({ cause } = {}) {
        super('Failed to create credential.', {
            cause,
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Registration.CreateFailedError'
        });
    }
}
exports.CreateFailedError = CreateFailedError;
//# sourceMappingURL=Registration.js.map