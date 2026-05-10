"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.z_TxEnvelopeTempo = exports.z_SignatureEnvelope = exports.z_KeyAuthorization = void 0;
exports.from = from;
exports.fromHeadlessWebAuthn = fromHeadlessWebAuthn;
exports.fromP256 = fromP256;
exports.fromSecp256k1 = fromSecp256k1;
exports.fromWebAuthnP256 = fromWebAuthnP256;
exports.fromWebCryptoP256 = fromWebCryptoP256;
exports.signKeyAuthorization = signKeyAuthorization;
exports.resolveAccessKey = resolveAccessKey;
const Address = require("ox/Address");
const Hex = require("ox/Hex");
const P256 = require("ox/P256");
const PublicKey = require("ox/PublicKey");
const Secp256k1 = require("ox/Secp256k1");
const Signature = require("ox/Signature");
const tempo_1 = require("ox/tempo");
const WebAuthnP256 = require("ox/WebAuthnP256");
const WebCryptoP256 = require("ox/WebCryptoP256");
const parseAccount_js_1 = require("../accounts/utils/parseAccount.js");
const hashAuthorization_js_1 = require("../utils/authorization/hashAuthorization.js");
const keccak256_js_1 = require("../utils/hash/keccak256.js");
const hashMessage_js_1 = require("../utils/signature/hashMessage.js");
const hashTypedData_js_1 = require("../utils/signature/hashTypedData.js");
const Transaction = require("./Transaction.js");
function from(parameters) {
    const { access } = parameters;
    if (access)
        return fromAccessKey(parameters);
    return fromRoot(parameters);
}
function fromHeadlessWebAuthn(privateKey, options) {
    const { access, rpId, origin, internal_version } = options;
    const publicKey = P256.getPublicKey({ privateKey });
    return from({
        access,
        internal_version,
        keyType: 'webAuthn',
        publicKey,
        async sign({ hash }) {
            const { metadata, payload } = WebAuthnP256.getSignPayload({
                ...options,
                challenge: hash,
                rpId,
                origin,
            });
            const signature = P256.sign({
                payload,
                privateKey,
                hash: true,
            });
            return tempo_1.SignatureEnvelope.serialize({
                metadata,
                signature,
                publicKey,
                type: 'webAuthn',
            });
        },
    });
}
function fromP256(privateKey, options = {}) {
    const { access, internal_version } = options;
    const publicKey = P256.getPublicKey({ privateKey });
    return from({
        access,
        internal_version,
        keyType: 'p256',
        publicKey,
        async sign({ hash }) {
            const signature = P256.sign({ payload: hash, privateKey });
            return tempo_1.SignatureEnvelope.serialize({
                signature,
                publicKey,
                type: 'p256',
            });
        },
    });
}
function fromSecp256k1(privateKey, options = {}) {
    const { access, internal_version } = options;
    const publicKey = Secp256k1.getPublicKey({ privateKey });
    return from({
        access,
        internal_version,
        keyType: 'secp256k1',
        publicKey,
        async sign(parameters) {
            const { hash } = parameters;
            const signature = Secp256k1.sign({ payload: hash, privateKey });
            return Signature.toHex(signature);
        },
    });
}
function fromWebAuthnP256(credential, options = {}) {
    const { id } = credential;
    const publicKey = PublicKey.fromHex(credential.publicKey);
    return from({
        keyType: 'webAuthn',
        publicKey,
        async sign({ hash }) {
            const { metadata, signature } = await WebAuthnP256.sign({
                ...options,
                challenge: hash,
                credentialId: id,
            });
            return tempo_1.SignatureEnvelope.serialize({
                publicKey,
                metadata,
                signature,
                type: 'webAuthn',
            });
        },
    });
}
function fromWebCryptoP256(keyPair, options = {}) {
    const { access, internal_version } = options;
    const { publicKey, privateKey } = keyPair;
    return from({
        access,
        internal_version,
        keyType: 'p256',
        publicKey,
        async sign({ hash }) {
            const signature = await WebCryptoP256.sign({ payload: hash, privateKey });
            return tempo_1.SignatureEnvelope.serialize({
                signature,
                prehash: true,
                publicKey,
                type: 'p256',
            });
        },
    });
}
async function signKeyAuthorization(account, parameters) {
    const { chainId, key, expiry, limits, scopes } = parameters;
    const { accessKeyAddress, keyType: type } = resolveAccessKey(key);
    const signature = await account.sign({
        hash: tempo_1.KeyAuthorization.getSignPayload({
            address: accessKeyAddress,
            chainId,
            expiry,
            limits,
            scopes,
            type,
        }),
    });
    return tempo_1.KeyAuthorization.from({
        address: accessKeyAddress,
        chainId,
        expiry,
        limits,
        scopes,
        signature: tempo_1.SignatureEnvelope.from(signature),
        type,
    });
}
function fromBase(parameters) {
    const { keyType = 'secp256k1', parentAddress, source = 'privateKey', internal_version = 'v2', } = parameters;
    const address = parentAddress ?? Address.fromPublicKey(parameters.publicKey);
    const publicKey = PublicKey.toHex(parameters.publicKey, {
        includePrefix: false,
    });
    async function sign({ hash }) {
        const innerHash = parentAddress && internal_version === 'v2'
            ? (0, keccak256_js_1.keccak256)(Hex.concat('0x04', hash, parentAddress))
            : hash;
        const signature = await parameters.sign({ hash: innerHash });
        if (parentAddress)
            return tempo_1.SignatureEnvelope.serialize(tempo_1.SignatureEnvelope.from({
                userAddress: parentAddress,
                inner: tempo_1.SignatureEnvelope.from(signature),
                type: 'keychain',
                version: internal_version,
            }));
        return signature;
    }
    return {
        address: Address.checksum(address),
        keyType,
        sign,
        async signAuthorization(parameters) {
            const { chainId, nonce } = parameters;
            const address = parameters.contractAddress ?? parameters.address;
            const signature = await sign({
                hash: (0, hashAuthorization_js_1.hashAuthorization)({ address, chainId, nonce }),
            });
            const envelope = tempo_1.SignatureEnvelope.from(signature);
            if (envelope.type !== 'secp256k1')
                throw new Error('Unsupported signature type. Expected `secp256k1` but got `' +
                    envelope.type +
                    '`.');
            const { r, s, yParity } = envelope.signature;
            return {
                address,
                chainId,
                nonce,
                r: Hex.fromNumber(r, { size: 32 }),
                s: Hex.fromNumber(s, { size: 32 }),
                yParity,
            };
        },
        async signMessage(parameters) {
            const { message } = parameters;
            return await sign({ hash: (0, hashMessage_js_1.hashMessage)(message) });
        },
        async signTransaction(transaction, options) {
            const { serializer = Transaction.serialize } = options ?? {};
            const presign = (() => {
                if ('feePayerSignature' in transaction && transaction.feePayerSignature)
                    return { ...transaction, feePayerSignature: null };
                return transaction;
            })();
            const signature = await sign({
                hash: (0, keccak256_js_1.keccak256)(await serializer(presign)),
            });
            const envelope = tempo_1.SignatureEnvelope.from(signature);
            return await serializer(transaction, envelope);
        },
        async signTypedData(typedData) {
            return await sign({ hash: (0, hashTypedData_js_1.hashTypedData)(typedData) });
        },
        publicKey,
        source,
        type: 'local',
    };
}
function fromRoot(parameters) {
    const account = fromBase(parameters);
    return {
        ...account,
        source: 'root',
        async signKeyAuthorization(key, parameters) {
            const { chainId, expiry, limits, scopes } = parameters;
            const { accessKeyAddress, keyType: type } = resolveAccessKey(key);
            const signature = await account.sign({
                hash: tempo_1.KeyAuthorization.getSignPayload({
                    address: accessKeyAddress,
                    chainId,
                    expiry,
                    limits,
                    scopes,
                    type,
                }),
            });
            const keyAuthorization = tempo_1.KeyAuthorization.from({
                address: accessKeyAddress,
                chainId,
                expiry,
                limits,
                scopes,
                signature: tempo_1.SignatureEnvelope.from(signature),
                type,
            });
            return keyAuthorization;
        },
    };
}
function fromAccessKey(parameters) {
    const { access } = parameters;
    const { address: parentAddress } = (0, parseAccount_js_1.parseAccount)(access);
    const account = fromBase({ ...parameters, parentAddress });
    return {
        ...account,
        accessKeyAddress: Address.fromPublicKey(parameters.publicKey),
        source: 'accessKey',
    };
}
function resolveAccessKey(accessKey) {
    if ('accessKeyAddress' in accessKey)
        return {
            accessKeyAddress: accessKey.accessKeyAddress,
            keyType: accessKey.keyType,
        };
    if ('publicKey' in accessKey && accessKey.publicKey)
        return {
            accessKeyAddress: Address.fromPublicKey(PublicKey.fromHex(accessKey.publicKey)),
            keyType: accessKey.type,
        };
    return {
        accessKeyAddress: accessKey.address,
        keyType: accessKey.type,
    };
}
var tempo_2 = require("ox/tempo");
Object.defineProperty(exports, "z_KeyAuthorization", { enumerable: true, get: function () { return tempo_2.KeyAuthorization; } });
Object.defineProperty(exports, "z_SignatureEnvelope", { enumerable: true, get: function () { return tempo_2.SignatureEnvelope; } });
Object.defineProperty(exports, "z_TxEnvelopeTempo", { enumerable: true, get: function () { return tempo_2.TxEnvelopeTempo; } });
//# sourceMappingURL=Account.js.map