"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noble = void 0;
exports.createKeyPair = createKeyPair;
exports.getPublicKey = getPublicKey;
exports.randomPrivateKey = randomPrivateKey;
exports.sign = sign;
exports.verify = verify;
exports.toX25519PublicKey = toX25519PublicKey;
exports.toX25519PrivateKey = toX25519PrivateKey;
const ed25519_1 = require("@noble/curves/ed25519");
const Bytes = require("./Bytes.js");
const Hex = require("./Hex.js");
exports.noble = ed25519_1.ed25519;
function createKeyPair(options = {}) {
    const { as = 'Hex' } = options;
    const privateKey = randomPrivateKey({ as });
    const publicKey = getPublicKey({ privateKey, as });
    return {
        privateKey: privateKey,
        publicKey: publicKey,
    };
}
function getPublicKey(options) {
    const { as = 'Hex', privateKey } = options;
    const privateKeyBytes = Bytes.from(privateKey);
    const publicKeyBytes = ed25519_1.ed25519.getPublicKey(privateKeyBytes);
    if (as === 'Hex')
        return Hex.fromBytes(publicKeyBytes);
    return publicKeyBytes;
}
function randomPrivateKey(options = {}) {
    const { as = 'Hex' } = options;
    const bytes = ed25519_1.ed25519.utils.randomPrivateKey();
    if (as === 'Hex')
        return Hex.fromBytes(bytes);
    return bytes;
}
function sign(options) {
    const { as = 'Hex', payload, privateKey } = options;
    const payloadBytes = Bytes.from(payload);
    const privateKeyBytes = Bytes.from(privateKey);
    const signatureBytes = ed25519_1.ed25519.sign(payloadBytes, privateKeyBytes);
    if (as === 'Hex')
        return Hex.fromBytes(signatureBytes);
    return signatureBytes;
}
function verify(options) {
    const { payload, publicKey, signature } = options;
    const payloadBytes = Bytes.from(payload);
    const publicKeyBytes = Bytes.from(publicKey);
    const signatureBytes = Bytes.from(signature);
    return ed25519_1.ed25519.verify(signatureBytes, payloadBytes, publicKeyBytes);
}
function toX25519PublicKey(options) {
    const { as = 'Hex', publicKey } = options;
    const publicKeyBytes = Bytes.from(publicKey);
    const x25519PublicKeyBytes = (0, ed25519_1.edwardsToMontgomeryPub)(publicKeyBytes);
    if (as === 'Hex')
        return Hex.fromBytes(x25519PublicKeyBytes);
    return x25519PublicKeyBytes;
}
function toX25519PrivateKey(options) {
    const { as = 'Hex', privateKey } = options;
    const privateKeyBytes = Bytes.from(privateKey);
    const x25519PrivateKeyBytes = (0, ed25519_1.edwardsToMontgomeryPriv)(privateKeyBytes);
    if (as === 'Hex')
        return Hex.fromBytes(x25519PrivateKeyBytes);
    return x25519PrivateKeyBytes;
}
//# sourceMappingURL=Ed25519.js.map