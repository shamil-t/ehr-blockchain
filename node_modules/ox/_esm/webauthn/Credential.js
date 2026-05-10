import * as Base64 from '../core/Base64.js';
import * as Cbor from '../core/Cbor.js';
import * as PublicKey from '../core/PublicKey.js';
import { base64UrlOptions, bufferSourceToBytes, bytesToArrayBuffer, responseKeys, } from './internal/utils.js';
/**
 * Serializes a credential into a JSON-serializable
 * format.
 *
 * @example
 * ```ts twoslash
 * import { Registration, Credential } from 'ox/webauthn'
 *
 * const credential = await Registration.create({ name: 'Example' })
 *
 * const serialized = Credential.serialize(credential) // [!code focus]
 *
 * // `serialized` is JSON-serializable — send it to a server, store it, etc.
 * const json = JSON.stringify(serialized)
 * ```
 *
 * @param credential - The credential to serialize.
 * @returns The serialized credential.
 */
export function serialize(credential) {
    const { attestationObject, clientDataJSON, id, publicKey, raw } = credential;
    const response = {};
    for (const key of responseKeys) {
        const r = raw.response;
        let value = r[key];
        // Some properties (e.g. `authenticatorData`) are only accessible via
        // getter methods (e.g. `getAuthenticatorData()`) in certain browsers
        // and passkey providers.
        if (!(value instanceof ArrayBuffer)) {
            const getter = `get${key[0].toUpperCase()}${key.slice(1)}`;
            const fn = r[getter];
            if (typeof fn === 'function')
                value = fn.call(r);
        }
        if (value instanceof ArrayBuffer)
            response[key] = Base64.fromBytes(new Uint8Array(value), base64UrlOptions);
    }
    // Some browsers/passkey providers (e.g. Firefox + 1Password) don't expose
    // `authenticatorData` on the response object. Fall back to extracting it
    // from the CBOR-encoded `attestationObject` which always contains `authData`.
    if (!response.authenticatorData) {
        const attestation = Cbor.decode(new Uint8Array(attestationObject));
        if (attestation.authData)
            response.authenticatorData = Base64.fromBytes(attestation.authData, base64UrlOptions);
    }
    return {
        attestationObject: Base64.fromBytes(new Uint8Array(attestationObject), base64UrlOptions),
        clientDataJSON: Base64.fromBytes(new Uint8Array(clientDataJSON), base64UrlOptions),
        id,
        publicKey: PublicKey.toHex(publicKey),
        raw: {
            id: raw.id,
            type: raw.type,
            authenticatorAttachment: raw.authenticatorAttachment,
            rawId: Base64.fromBytes(bufferSourceToBytes(raw.rawId), base64UrlOptions),
            response: response,
        },
    };
}
/**
 * Deserializes a serialized credential.
 *
 * @example
 * ```ts twoslash
 * import { Credential } from 'ox/webauthn'
 *
 * const credential = Credential.deserialize({ // [!code focus]
 *   attestationObject: 'o2NmbXRkbm9uZQ...', // [!code focus]
 *   clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIn0', // [!code focus]
 *   id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs', // [!code focus]
 *   publicKey: '0x04ab891400140fc4f8e941ce0ff90e419de9470acaca613bbd717a4775435031a7d884318e919fd3b3e5a631d866d8a380b44063e70f0c381ee16e0652f7f97554', // [!code focus]
 *   raw: { // [!code focus]
 *     id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs', // [!code focus]
 *     type: 'public-key', // [!code focus]
 *     authenticatorAttachment: 'platform', // [!code focus]
 *     rawId: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs', // [!code focus]
 *     response: { // [!code focus]
 *       clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIn0', // [!code focus]
 *     }, // [!code focus]
 *   }, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param credential - The serialized credential.
 * @returns The deserialized credential.
 */
export function deserialize(credential) {
    const { attestationObject, clientDataJSON, id, publicKey, raw } = credential;
    const response = Object.create(null);
    for (const key of responseKeys) {
        const value = raw.response[key];
        if (value)
            response[key] = bytesToArrayBuffer(Base64.toBytes(value));
    }
    return {
        attestationObject: bytesToArrayBuffer(Base64.toBytes(attestationObject)),
        clientDataJSON: bytesToArrayBuffer(Base64.toBytes(clientDataJSON)),
        id,
        publicKey: PublicKey.from(publicKey),
        raw: {
            id: raw.id,
            type: raw.type,
            authenticatorAttachment: raw.authenticatorAttachment,
            rawId: bytesToArrayBuffer(Base64.toBytes(raw.rawId)),
            response: response,
            getClientExtensionResults: () => ({}),
        },
    };
}
//# sourceMappingURL=Credential.js.map