import * as Base64 from '../core/Base64.js';
import * as Bytes from '../core/Bytes.js';
import * as Errors from '../core/Errors.js';
import * as Hash from '../core/Hash.js';
import * as Hex from '../core/Hex.js';
import * as internal from '../core/internal/webauthn.js';
import * as P256 from '../core/P256.js';
import * as Signature from '../core/Signature.js';
import { getAuthenticatorData, getClientDataJSON } from './Authenticator.js';
import { base64UrlOptions, bufferSourceToBytes, bytesToArrayBuffer, deserializeExtensions, responseKeys, serializeExtensions, } from './internal/utils.js';
/**
 * Deserializes credential request options that can be passed to
 * `navigator.credentials.get()`.
 *
 * @example
 * ```ts twoslash
 * import { Authentication } from 'ox/webauthn'
 *
 * const options = Authentication.getOptions({
 *   challenge: '0xdeadbeef',
 * })
 * const serialized = Authentication.serializeOptions(options)
 *
 * // ... send to server and back ...
 *
 * const deserialized = Authentication.deserializeOptions(serialized) // [!code focus]
 * const credential = await window.navigator.credentials.get(deserialized)
 * ```
 *
 * @param options - The serialized credential request options.
 * @returns The deserialized credential request options.
 */
export function deserializeOptions(options) {
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
                extensions: deserializeExtensions(extensions),
            }),
        },
    };
}
/**
 * Deserializes a serialized authentication response.
 *
 * @example
 * ```ts twoslash
 * import { Authentication } from 'ox/webauthn'
 *
 * const response = Authentication.deserializeResponse({ // [!code focus]
 *   id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs', // [!code focus]
 *   metadata: { // [!code focus]
 *     authenticatorData: '0x49960de5...', // [!code focus]
 *     clientDataJSON: '{"type":"webauthn.get",...}', // [!code focus]
 *     challengeIndex: 23, // [!code focus]
 *     typeIndex: 1, // [!code focus]
 *     userVerificationRequired: true, // [!code focus]
 *   }, // [!code focus]
 *   raw: { // [!code focus]
 *     id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs', // [!code focus]
 *     type: 'public-key', // [!code focus]
 *     authenticatorAttachment: 'platform', // [!code focus]
 *     rawId: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs', // [!code focus]
 *     response: { clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0In0' }, // [!code focus]
 *   }, // [!code focus]
 *   signature: '0x...', // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param response - The serialized authentication response.
 * @returns The deserialized authentication response.
 */
export function deserializeResponse(response) {
    const { id, metadata, raw, signature } = response;
    const rawResponse = {};
    for (const [key, value] of Object.entries(raw.response))
        rawResponse[key] = bytesToArrayBuffer(Base64.toBytes(value));
    return {
        id,
        metadata,
        raw: {
            id: raw.id,
            type: raw.type,
            authenticatorAttachment: raw.authenticatorAttachment,
            rawId: bytesToArrayBuffer(Base64.toBytes(raw.rawId)),
            response: rawResponse,
            getClientExtensionResults: () => ({}),
        },
        signature: Signature.from(signature),
    };
}
/**
 * Returns the request options to sign a challenge with the Web Authentication API.
 *
 * @example
 * ```ts twoslash
 * import { Authentication } from 'ox/webauthn'
 *
 * const options = Authentication.getOptions({
 *   challenge: '0xdeadbeef',
 * })
 *
 * const credential = await window.navigator.credentials.get(options)
 * ```
 *
 * @param options - Options.
 * @returns The credential request options.
 */
export function getOptions(options) {
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
/**
 * Constructs the final digest that was signed and computed by the authenticator. This payload includes
 * the cryptographic `challenge`, as well as authenticator metadata (`authenticatorData` + `clientDataJSON`).
 * This value can be also used with raw P256 verification (such as `P256.verify` or
 * `WebCryptoP256.verify`).
 *
 * :::warning
 *
 * This function is mainly for testing purposes or for manually constructing
 * signing payloads. In most cases you will not need this function and
 * instead use `Authentication.sign`.
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { Authentication } from 'ox/webauthn'
 * import { WebCryptoP256 } from 'ox'
 *
 * const { metadata, payload } = Authentication.getSignPayload({ // [!code focus]
 *   challenge: '0xdeadbeef', // [!code focus]
 * }) // [!code focus]
 *
 * const { publicKey, privateKey } = await WebCryptoP256.createKeyPair()
 *
 * const signature = await WebCryptoP256.sign({
 *   payload,
 *   privateKey,
 * })
 * ```
 *
 * @param options - Options to construct the signing payload.
 * @returns The signing payload.
 */
export function getSignPayload(options) {
    const { challenge, crossOrigin, extraClientData, flag, origin, rpId, signCount, userVerification = 'required', } = options;
    const authenticatorData = getAuthenticatorData({
        flag,
        rpId,
        signCount,
    });
    const clientDataJSON = getClientDataJSON({
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
/**
 * Serializes credential request options into a JSON-serializable
 * format, converting `BufferSource` fields to base64url strings.
 *
 * @example
 * ```ts twoslash
 * import { Authentication } from 'ox/webauthn'
 *
 * const options = Authentication.getOptions({
 *   challenge: '0xdeadbeef',
 * })
 *
 * const serialized = Authentication.serializeOptions(options) // [!code focus]
 *
 * // `serialized` is JSON-serializable — send it to a server, store it, etc.
 * const json = JSON.stringify(serialized)
 * ```
 *
 * @param options - The credential request options to serialize.
 * @returns The serialized credential request options.
 */
export function serializeOptions(options) {
    const { publicKey, signal: _, ...rest } = options;
    if (!publicKey)
        return { ...rest };
    const { allowCredentials, challenge, extensions, ...publicKeyRest } = publicKey;
    return {
        ...rest,
        publicKey: {
            ...publicKeyRest,
            challenge: Hex.fromBytes(bufferSourceToBytes(challenge)),
            ...(allowCredentials && {
                allowCredentials: allowCredentials.map(({ id, ...rest }) => ({
                    ...rest,
                    id: Base64.fromBytes(bufferSourceToBytes(id), base64UrlOptions),
                })),
            }),
            ...(extensions && {
                extensions: serializeExtensions(extensions),
            }),
        },
    };
}
/**
 * Serializes an authentication response into a JSON-serializable
 * format, converting `BufferSource` fields to base64url strings
 * and the signature to a hex string.
 *
 * @example
 * ```ts twoslash
 * import { Authentication } from 'ox/webauthn'
 *
 * const response = await Authentication.sign({
 *   challenge: '0xdeadbeef',
 * })
 *
 * const serialized = Authentication.serializeResponse(response) // [!code focus]
 *
 * // `serialized` is JSON-serializable — send it to a server, store it, etc.
 * const json = JSON.stringify(serialized)
 * ```
 *
 * @param response - The authentication response to serialize.
 * @returns The serialized authentication response.
 */
export function serializeResponse(response) {
    const { id, metadata, raw, signature } = response;
    const rawResponse = {};
    for (const key of responseKeys) {
        const r = raw.response;
        let value = r[key];
        if (!(value instanceof ArrayBuffer)) {
            const getter = `get${key[0].toUpperCase()}${key.slice(1)}`;
            const fn = r[getter];
            if (typeof fn === 'function')
                value = fn.call(r);
        }
        if (value instanceof ArrayBuffer)
            rawResponse[key] = Base64.fromBytes(new Uint8Array(value), base64UrlOptions);
    }
    return {
        id,
        metadata,
        raw: {
            id: raw.id,
            type: raw.type,
            authenticatorAttachment: raw.authenticatorAttachment,
            rawId: Base64.fromBytes(bufferSourceToBytes(raw.rawId), base64UrlOptions),
            response: rawResponse,
        },
        signature: Signature.toHex(signature),
    };
}
/**
 * Signs a challenge using a stored WebAuthn P256 Credential. If no Credential is provided,
 * a prompt will be displayed for the user to select an existing Credential
 * that was previously registered.
 *
 * @example
 * ```ts twoslash
 * import { Registration, Authentication } from 'ox/webauthn'
 *
 * const credential = await Registration.create({
 *   name: 'Example',
 * })
 *
 * const { metadata, signature } = await Authentication.sign({ // [!code focus]
 *   credentialId: credential.id, // [!code focus]
 *   challenge: '0xdeadbeef', // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   metadata: {
 * // @log:     authenticatorData: '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
 * // @log:     clientDataJSON: '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
 * // @log:     challengeIndex: 23,
 * // @log:     typeIndex: 1,
 * // @log:     userVerificationRequired: true,
 * // @log:   },
 * // @log:   signature: { r: 51231...4215n, s: 12345...6789n },
 * // @log: }
 * ```
 *
 * @param options - Options.
 * @returns The signature.
 */
export async function sign(options) {
    const { getFn = (opts) => window.navigator.credentials.get(opts), ...rest } = options;
    const requestOptions = 'publicKey' in rest
        ? rest
        : getOptions(rest);
    try {
        const credential = (await getFn(requestOptions));
        if (!credential)
            throw new SignFailedError();
        const response = credential.response;
        // Eagerly copy ArrayBuffer data to avoid cross-origin access errors
        // when browser extensions (e.g. 1Password on Firefox) replace
        // `navigator.credentials` with a cross-compartment proxy.
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
/** Thrown when a WebAuthn P256 credential request fails. */
export class SignFailedError extends Errors.BaseError {
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
/**
 * Verifies a signature using the Credential's public key and the challenge which was signed.
 *
 * @example
 * ```ts twoslash
 * import { Registration, Authentication } from 'ox/webauthn'
 *
 * const credential = await Registration.create({
 *   name: 'Example',
 * })
 *
 * const { metadata, signature } = await Authentication.sign({
 *   credentialId: credential.id,
 *   challenge: '0xdeadbeef',
 * })
 *
 * const result = Authentication.verify({ // [!code focus]
 *   metadata, // [!code focus]
 *   challenge: '0xdeadbeef', // [!code focus]
 *   publicKey: credential.publicKey, // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * // @log: true
 * ```
 *
 * @param options - Options.
 * @returns Whether the signature is valid.
 */
export function verify(options) {
    const { challenge, metadata, origin, publicKey, rpId, signature } = options;
    const { authenticatorData, clientDataJSON, userVerificationRequired } = metadata;
    const authenticatorDataBytes = Bytes.fromHex(authenticatorData);
    // Check length of `authenticatorData`.
    if (authenticatorDataBytes.length < 37)
        return false;
    // If rpId is provided, validate the rpIdHash in authenticatorData.
    if (rpId !== undefined) {
        const rpIdHash = authenticatorDataBytes.slice(0, 32);
        const expectedRpIdHash = Hash.sha256(Hex.fromString(rpId), { as: 'Bytes' });
        if (!Bytes.isEqual(rpIdHash, expectedRpIdHash))
            return false;
    }
    const flag = authenticatorDataBytes[32];
    // Verify that the UP bit of the flags in authData is set.
    if ((flag & 0x01) !== 0x01)
        return false;
    // If user verification was determined to be required, verify that
    // the UV bit of the flags in authData is set. Otherwise, ignore the
    // value of the UV flag.
    if (userVerificationRequired && (flag & 0x04) !== 0x04)
        return false;
    // If the BE bit of the flags in authData is not set, verify that
    // the BS bit is not set.
    if ((flag & 0x08) !== 0x08 && (flag & 0x10) === 0x10)
        return false;
    // Parse clientDataJSON for validation.
    const clientData = JSON.parse(clientDataJSON);
    // Verify that response is for an authentication assertion.
    if (clientData.type !== 'webauthn.get')
        return false;
    // Validate the challenge in the clientDataJSON.
    if (!clientData.challenge ||
        Hex.fromBytes(Base64.toBytes(clientData.challenge)) !== challenge)
        return false;
    // If origin is provided, validate origin.
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