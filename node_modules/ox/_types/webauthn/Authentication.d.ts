import * as Base64 from '../core/Base64.js';
import * as Bytes from '../core/Bytes.js';
import * as Errors from '../core/Errors.js';
import * as Hash from '../core/Hash.js';
import * as Hex from '../core/Hex.js';
import type { OneOf } from '../core/internal/types.js';
import * as P256 from '../core/P256.js';
import type * as PublicKey from '../core/PublicKey.js';
import * as Signature from '../core/Signature.js';
import type * as Credential_ from './Credential.js';
import type * as Types from './Types.js';
/** Response from a WebAuthn authentication ceremony. */
export type Response<serialized extends boolean = false> = {
    id: string;
    metadata: Credential_.SignMetadata;
    raw: Types.PublicKeyCredential<serialized>;
    signature: serialized extends true ? Hex.Hex : Signature.Signature<false>;
};
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
export declare function deserializeOptions(options: Types.CredentialRequestOptions<true>): Types.CredentialRequestOptions;
export declare namespace deserializeOptions {
    type ErrorType = Base64.toBytes.ErrorType | Errors.GlobalErrorType;
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
export declare function deserializeResponse(response: Response<true>): Response;
export declare namespace deserializeResponse {
    type ErrorType = Base64.toBytes.ErrorType | Signature.from.ErrorType | Errors.GlobalErrorType;
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
export declare function getOptions(options: getOptions.Options): Types.CredentialRequestOptions;
export declare namespace getOptions {
    type Options = {
        /** The credential ID to use. */
        credentialId?: string | string[] | undefined;
        /** The challenge to sign. */
        challenge: Hex.Hex;
        /** List of Web Authentication API credentials to use during creation or authentication. */
        extensions?: Types.PublicKeyCredentialRequestOptions['extensions'] | undefined;
        /** The relying party identifier to use. */
        rpId?: Types.PublicKeyCredentialRequestOptions['rpId'] | undefined;
        /** The user verification requirement. */
        userVerification?: Types.PublicKeyCredentialRequestOptions['userVerification'] | undefined;
    };
    type ErrorType = Bytes.fromHex.ErrorType | Base64.toBytes.ErrorType | Errors.GlobalErrorType;
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
export declare function getSignPayload(options: getSignPayload.Options): getSignPayload.ReturnType;
export declare namespace getSignPayload {
    type Options = {
        /** The challenge to sign. */
        challenge: Hex.Hex;
        /** If set to `true`, it means that the calling context is an `<iframe>` that is not same origin with its ancestor frames. */
        crossOrigin?: boolean | undefined;
        /** Additional client data to include in the client data JSON. */
        extraClientData?: Record<string, unknown> | undefined;
        /** If set to `true`, the payload will be hashed before being returned. */
        hash?: boolean | undefined;
        /** A bitfield that indicates various attributes that were asserted by the authenticator. [Read more](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API/Authenticator_data#flags) */
        flag?: number | undefined;
        /** The fully qualified origin of the relying party which has been given by the client/browser to the authenticator. */
        origin?: string | undefined;
        /** The [Relying Party ID](https://w3c.github.io/webauthn/#relying-party-identifier) that the credential is scoped to. */
        rpId?: Types.PublicKeyCredentialRequestOptions['rpId'] | undefined;
        /** A signature counter, if supported by the authenticator (set to 0 otherwise). */
        signCount?: number | undefined;
        /** The user verification requirement that the authenticator will enforce. */
        userVerification?: Types.PublicKeyCredentialRequestOptions['userVerification'] | undefined;
    };
    type ReturnType = {
        metadata: Credential_.SignMetadata;
        payload: Hex.Hex;
    };
    type ErrorType = Hash.sha256.ErrorType | Hex.concat.ErrorType | Hex.fromString.ErrorType | Errors.GlobalErrorType;
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
export declare function serializeOptions(options: Types.CredentialRequestOptions): Types.CredentialRequestOptions<true>;
export declare namespace serializeOptions {
    type ErrorType = Base64.fromBytes.ErrorType | Errors.GlobalErrorType;
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
export declare function serializeResponse(response: Response): Response<true>;
export declare namespace serializeResponse {
    type ErrorType = Base64.fromBytes.ErrorType | Signature.toHex.ErrorType | Errors.GlobalErrorType;
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
export declare function sign(options: sign.Options): Promise<sign.ReturnType>;
export declare namespace sign {
    type Options = OneOf<(getOptions.Options & {
        /**
         * Credential request function. Useful for environments that do not support
         * the WebAuthn API natively (i.e. React Native or testing environments).
         *
         * @default window.navigator.credentials.get
         */
        getFn?: ((options?: Types.CredentialRequestOptions | undefined) => Promise<Types.Credential | null>) | undefined;
    }) | Types.CredentialRequestOptions>;
    type ReturnType = Response;
    type ErrorType = Hex.fromBytes.ErrorType | getOptions.ErrorType | Errors.GlobalErrorType;
}
/** Thrown when a WebAuthn P256 credential request fails. */
export declare class SignFailedError extends Errors.BaseError<Error> {
    readonly name = "Authentication.SignFailedError";
    constructor({ cause }?: {
        cause?: Error | undefined;
    });
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
export declare function verify(options: verify.Options): boolean;
export declare namespace verify {
    type Options = {
        /** The challenge to verify. */
        challenge: Hex.Hex;
        /** The public key to verify the signature with. */
        publicKey: PublicKey.PublicKey;
        /** The signature to verify. */
        signature: Signature.Signature<false>;
        /** The metadata to verify the signature with. */
        metadata: Credential_.SignMetadata;
        /** Expected origin(s). If provided, the `clientDataJSON` origin will be validated. */
        origin?: string | string[] | undefined;
        /** Expected relying party ID. If provided, the `rpIdHash` in `authenticatorData` will be validated. */
        rpId?: string | undefined;
    };
    type ErrorType = Base64.toBytes.ErrorType | Bytes.concat.ErrorType | Bytes.fromHex.ErrorType | Bytes.isEqual.ErrorType | Hash.sha256.ErrorType | Hex.fromString.ErrorType | P256.verify.ErrorType | Errors.GlobalErrorType;
}
//# sourceMappingURL=Authentication.d.ts.map