"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignPayload = exports.getCredentialRequestOptions = exports.getCredentialCreationOptions = exports.getAttestationObject = exports.getClientDataJSON = exports.getAuthenticatorData = exports.createChallenge = void 0;
exports.createCredential = createCredential;
exports.sign = sign;
exports.verify = verify;
const Authentication = require("../webauthn/Authentication.js");
const Authenticator = require("../webauthn/Authenticator.js");
const Registration = require("../webauthn/Registration.js");
exports.createChallenge = Registration.createChallenge;
async function createCredential(options) {
    return Registration.create(options);
}
exports.getAuthenticatorData = Authenticator.getAuthenticatorData;
exports.getClientDataJSON = Authenticator.getClientDataJSON;
exports.getAttestationObject = Authenticator.getAttestationObject;
exports.getCredentialCreationOptions = Registration.getOptions;
exports.getCredentialRequestOptions = Authentication.getOptions;
exports.getSignPayload = Authentication.getSignPayload;
async function sign(options) {
    return Authentication.sign(options);
}
function verify(options) {
    return Authentication.verify(options);
}
//# sourceMappingURL=WebAuthnP256.js.map