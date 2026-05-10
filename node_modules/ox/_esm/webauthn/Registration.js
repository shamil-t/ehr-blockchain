import * as Base64 from '../core/Base64.js';
import * as Bytes from '../core/Bytes.js';
import * as Cbor from '../core/Cbor.js';
import * as CoseKey from '../core/CoseKey.js';
import * as Errors from '../core/Errors.js';
import * as Hash from '../core/Hash.js';
import * as Hex from '../core/Hex.js';
import * as internal from '../core/internal/webauthn.js';
import * as P256 from '../core/P256.js';
import * as PublicKey from '../core/PublicKey.js';
import * as Signature from '../core/Signature.js';
import { base64UrlOptions, bufferSourceToBytes, bytesToArrayBuffer, deserializeExtensions, responseKeys, serializeExtensions, } from './internal/utils.js';
export const createChallenge = Uint8Array.from([
    105, 171, 180, 181, 160, 222, 75, 198, 42, 42, 32, 31, 141, 37, 186, 233,
]);
/**
 * Creates a new WebAuthn P256 Credential, which can be stored and later used for signing.
 *
 * @example
 * ```ts twoslash
 * import { Registration } from 'ox/webauthn'
 *
 * const credential = await Registration.create({ name: 'Example' }) // [!code focus]
 * // @log: {
 * // @log:   id: 'oZ48...',
 * // @log:   publicKey: { x: 51421...5123n, y: 12345...6789n },
 * // @log:   raw: PublicKeyCredential {},
 * // @log: }
 * ```
 *
 * @param options - Credential creation options.
 * @returns A WebAuthn P256 credential.
 */
export async function create(options) {
    const { createFn = (opts) => window.navigator.credentials.create(opts), ...rest } = options;
    const creationOptions = 'publicKey' in rest
        ? rest
        : getOptions(rest);
    try {
        const credential = (await createFn(creationOptions));
        if (!credential)
            throw new CreateFailedError();
        const response = credential.response;
        // Eagerly copy ArrayBuffer data to avoid cross-origin access errors
        // when browser extensions (e.g. 1Password on Firefox) replace
        // `navigator.credentials` with a cross-compartment proxy.
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
/**
 * Returns the creation options for a P256 WebAuthn Credential to be used with
 * the Web Authentication API.
 *
 * @example
 * ```ts twoslash
 * import { Registration } from 'ox/webauthn'
 *
 * const options = Registration.getOptions({ name: 'Example' })
 *
 * const credential = await window.navigator.credentials.create(options)
 * ```
 *
 * @param options - Options.
 * @returns The credential creation options.
 */
export function getOptions(options) {
    const { attestation = 'none', authenticatorSelection = {
        residentKey: 'preferred',
        requireResidentKey: false,
        userVerification: 'required',
    }, challenge = createChallenge, excludeCredentialIds, extensions, name: name_, rp = {
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
                    alg: -7, // p256
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
/**
 * Serializes a registration response into a JSON-serializable
 * format, converting `ArrayBuffer` fields to base64url strings
 * and the public key to a hex string.
 *
 * @example
 * ```ts twoslash
 * import { Registration } from 'ox/webauthn'
 *
 * const credential = await Registration.create({ name: 'Example' })
 * const response = Registration.verify({
 *   credential,
 *   challenge: '0x...',
 *   origin: 'https://example.com',
 *   rpId: 'example.com',
 * })
 *
 * const serialized = Registration.serializeResponse(response) // [!code focus]
 *
 * // `serialized` is JSON-serializable — send it to a server, store it, etc.
 * const json = JSON.stringify(serialized)
 * ```
 *
 * @param response - The registration response to serialize.
 * @returns The serialized registration response.
 */
export function serializeResponse(response) {
    const { credential, ...rest } = response;
    const rawResponse = {};
    for (const key of responseKeys) {
        const r = credential.raw.response;
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
        ...rest,
        credential: {
            attestationObject: Base64.fromBytes(new Uint8Array(credential.attestationObject), base64UrlOptions),
            clientDataJSON: Base64.fromBytes(new Uint8Array(credential.clientDataJSON), base64UrlOptions),
            id: credential.id,
            publicKey: PublicKey.toHex(credential.publicKey),
            raw: {
                id: credential.raw.id,
                type: credential.raw.type,
                authenticatorAttachment: credential.raw.authenticatorAttachment,
                rawId: Base64.fromBytes(bufferSourceToBytes(credential.raw.rawId), base64UrlOptions),
                response: rawResponse,
            },
        },
    };
}
/**
 * Serializes credential creation options into a JSON-serializable
 * format, converting `BufferSource` fields to base64url strings.
 *
 * @example
 * ```ts twoslash
 * import { Registration } from 'ox/webauthn'
 *
 * const options = Registration.getOptions({ name: 'Example' })
 *
 * const serialized = Registration.serializeOptions(options) // [!code focus]
 *
 * // `serialized` is JSON-serializable — send it to a server, store it, etc.
 * const json = JSON.stringify(serialized)
 * ```
 *
 * @param options - The credential creation options to serialize.
 * @returns The serialized credential creation options.
 */
export function serializeOptions(options) {
    const publicKey = options.publicKey;
    if (!publicKey)
        return {};
    const { challenge, excludeCredentials, extensions, user, ...rest } = publicKey;
    return {
        publicKey: {
            ...rest,
            challenge: Hex.fromBytes(bufferSourceToBytes(challenge)),
            ...(excludeCredentials && {
                excludeCredentials: excludeCredentials.map(({ id, ...rest }) => ({
                    ...rest,
                    id: Base64.fromBytes(bufferSourceToBytes(id), base64UrlOptions),
                })),
            }),
            ...(extensions && {
                extensions: serializeExtensions(extensions),
            }),
            user: {
                ...user,
                id: Base64.fromBytes(bufferSourceToBytes(user.id), base64UrlOptions),
            },
        },
    };
}
/**
 * Deserializes credential creation options that can be passed to
 * `navigator.credentials.create()`.
 *
 * @example
 * ```ts twoslash
 * import { Registration } from 'ox/webauthn'
 *
 * const options = Registration.getOptions({ name: 'Example' })
 * const serialized = Registration.serializeOptions(options)
 *
 * // ... send to server and back ...
 *
 * const deserialized = Registration.deserializeOptions(serialized) // [!code focus]
 * const credential = await window.navigator.credentials.create(deserialized)
 * ```
 *
 * @param options - The serialized credential creation options.
 * @returns The deserialized credential creation options.
 */
export function deserializeOptions(options) {
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
                extensions: deserializeExtensions(extensions),
            }),
            user: {
                ...user,
                id: Base64.toBytes(user.id),
            },
        },
    };
}
/**
 * Deserializes a serialized registration response.
 *
 * @example
 * ```ts twoslash
 * import { Registration } from 'ox/webauthn'
 *
 * const response = Registration.deserializeResponse({ // [!code focus]
 *   credential: { // [!code focus]
 *     attestationObject: 'o2NmbXRkbm9uZQ...', // [!code focus]
 *     clientDataJSON: 'eyJ0eXBlIjoid2Vi...', // [!code focus]
 *     id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs', // [!code focus]
 *     publicKey: '0x04ab891400...', // [!code focus]
 *     raw: { id: '...', type: 'public-key', authenticatorAttachment: 'platform', rawId: '...', response: { clientDataJSON: 'eyJ0eXBlIjoid2Vi...' } }, // [!code focus]
 *   }, // [!code focus]
 *   counter: 0, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param response - The serialized registration response.
 * @returns The deserialized registration response.
 */
export function deserializeResponse(response) {
    const { credential, ...rest } = response;
    const rawResponse = {};
    for (const [key, value] of Object.entries(credential.raw.response))
        rawResponse[key] = bytesToArrayBuffer(Base64.toBytes(value));
    return {
        ...rest,
        credential: {
            attestationObject: bytesToArrayBuffer(Base64.toBytes(credential.attestationObject)),
            clientDataJSON: bytesToArrayBuffer(Base64.toBytes(credential.clientDataJSON)),
            id: credential.id,
            publicKey: PublicKey.from(credential.publicKey),
            raw: {
                id: credential.raw.id,
                type: credential.raw.type,
                authenticatorAttachment: credential.raw.authenticatorAttachment,
                rawId: bytesToArrayBuffer(Base64.toBytes(credential.raw.rawId)),
                response: rawResponse,
                getClientExtensionResults: () => ({}),
            },
        },
    };
}
/**
 * Verifies a WebAuthn registration (credential creation) response. Validates the
 * `clientDataJSON`, `attestationObject`, authenticator flags, challenge, origin, and
 * relying party ID, then extracts the credential ID and public key.
 *
 * @example
 * ```ts twoslash
 * import { Registration } from 'ox/webauthn'
 *
 * const credential = await Registration.create({ name: 'Example' })
 *
 * const result = Registration.verify({ // [!code focus]
 *   credential, // [!code focus]
 *   challenge: '0x69abb4b5a0de4bc62a2a201f8d25bae9', // [!code focus]
 *   origin: 'https://example.com', // [!code focus]
 *   rpId: 'example.com', // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   credential: {
 * // @log:     id: 'oZ48...',
 * // @log:     publicKey: { prefix: 4, x: 51421...5123n, y: 12345...6789n },
 * // @log:   },
 * // @log:   counter: 0,
 * // @log:   userVerified: true,
 * // @log: }
 * ```
 *
 * @param options - Verification options.
 * @returns The verified registration result.
 */
export function verify(options) {
    const { attestation = 'none', credential, origin, rpId, userVerification = 'required', } = options;
    // 1. Decode and validate clientDataJSON
    const clientDataJSONBytes = new Uint8Array(credential.clientDataJSON);
    const clientDataJSON = Bytes.toString(clientDataJSONBytes);
    const clientData = JSON.parse(clientDataJSON);
    if (clientData.type !== 'webauthn.create')
        throw new VerifyError(`Expected clientData.type "webauthn.create", got "${clientData.type}"`);
    // Validate challenge
    const challengeResult = (() => {
        if (typeof options.challenge === 'function')
            return options.challenge(clientData.challenge);
        const challengeBytes = typeof options.challenge === 'string'
            ? Bytes.fromHex(options.challenge)
            : options.challenge;
        const challenge = Base64.fromBytes(challengeBytes, base64UrlOptions);
        return clientData.challenge === challenge;
    })();
    if (!challengeResult)
        throw new VerifyError('Challenge mismatch');
    // Validate origin
    const origins = Array.isArray(origin) ? origin : [origin];
    if (!origins.includes(clientData.origin))
        throw new VerifyError(`Origin mismatch: expected ${JSON.stringify(origin)}, got "${clientData.origin}"`);
    // 2. Decode attestationObject via CBOR
    const attestationObjectBytes = new Uint8Array(credential.attestationObject);
    const attestation_ = Cbor.decode(attestationObjectBytes);
    // 3. Parse authenticatorData
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
    // If the BE bit is not set, the BS bit must not be set.
    if (!be && bs)
        throw new VerifyError('Backup state (BS) flag is set but backup eligibility (BE) flag is not');
    // Minimum authData length: 37 (rpIdHash + flags + counter) + 16 (AAGUID) + 2 (credIdLen)
    if (authData.length < 55)
        throw new VerifyError('authData too short for attested credential data');
    // Counter (4 bytes, big-endian, starting at offset 33)
    const counter = ((authData[33] << 24) |
        (authData[34] << 16) |
        (authData[35] << 8) |
        authData[36]) >>>
        0;
    // Credential ID length (2 bytes at offset 53, big-endian)
    const credIdLen = (authData[53] << 8) | authData[54];
    if (55 + credIdLen > authData.length)
        throw new VerifyError('credIdLen exceeds authData bounds');
    // Credential ID (variable length starting at offset 55)
    const credentialId = authData.slice(55, 55 + credIdLen);
    // Verify credential ID consistency if caller-supplied id is present
    if (credential.id !== undefined) {
        const expectedId = Base64.fromBytes(credentialId, base64UrlOptions);
        if (credential.id !== expectedId)
            throw new VerifyError(`Credential ID mismatch: supplied "${credential.id}" does not match authData "${expectedId}"`);
    }
    // 4. Parse and validate COSE public key
    const ed = (flags & 0x80) !== 0;
    const coseKeyBytes = authData.slice(55 + credIdLen);
    const coseKeyHex = Hex.fromBytes(coseKeyBytes);
    const coseKeyData = Cbor.decode(coseKeyHex);
    // Validate key type is EC2 (2), algorithm is ES256 (-7), and curve is P-256 (1)
    if (coseKeyData['1'] !== 2 ||
        coseKeyData['3'] !== -7 ||
        coseKeyData['-1'] !== 1)
        throw new VerifyError('COSE key must be EC2 (kty=2) with ES256 algorithm (alg=-7) on P-256 curve (crv=1)');
    const publicKey = CoseKey.toPublicKey(coseKeyHex);
    // Verify no unexpected trailing bytes after the COSE key.
    // Re-encode the extracted public key as a COSE key to determine its expected length.
    const expectedCoseKeyLen = Bytes.fromHex(CoseKey.fromPublicKey(publicKey)).length;
    const trailingBytes = coseKeyBytes.length - expectedCoseKeyLen;
    if (trailingBytes > 0 && !ed)
        throw new VerifyError(`authData contains ${trailingBytes} unexpected trailing byte(s) after COSE key`);
    // 5. Verify attestation statement (cryptographic binding of authData + clientDataJSON)
    const clientDataHash = Hash.sha256(Bytes.fromString(clientDataJSON), {
        as: 'Bytes',
    });
    const verificationData = Bytes.concat(authData, clientDataHash);
    const { fmt, attStmt } = attestation_;
    if (fmt === 'none') {
        // "none" format has no attestation signature; only accept if caller opts in
        if (attestation === 'required')
            throw new VerifyError('Attestation format is "none" but attestation verification is required. ' +
                'Set `attestation: "none"` to accept unattested credentials.');
    }
    else if (fmt === 'packed') {
        // Packed attestation: verify signature over authData || clientDataHash
        const sig = attStmt.sig;
        const alg = attStmt.alg;
        if (!(sig instanceof Uint8Array) || typeof alg !== 'number')
            throw new VerifyError('Invalid packed attestation statement: missing sig or alg');
        if (alg !== -7)
            throw new VerifyError(`Unsupported attestation algorithm: ${alg} (expected -7 / ES256)`);
        if (attStmt.x5c) {
            // Full attestation with certificate chain is not supported
            throw new VerifyError('Packed attestation with x5c certificate chain is not supported. ' +
                'Use self attestation (no x5c) or set `attestation: "none"`.');
        }
        // Self attestation: verify using the credential public key
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
    // 6. Build credential ID string
    const id = credential.id ?? Base64.fromBytes(credentialId, base64UrlOptions);
    // 7. Build raw credential
    const raw = credential.raw ?? {
        authenticatorAttachment: null,
        getClientExtensionResults: () => ({}),
        id,
        rawId: bytesToArrayBuffer(credentialId),
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
/** Thrown when WebAuthn registration verification fails. */
export class VerifyError extends Errors.BaseError {
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
/** Thrown when a WebAuthn P256 credential creation fails. */
export class CreateFailedError extends Errors.BaseError {
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
//# sourceMappingURL=Registration.js.map