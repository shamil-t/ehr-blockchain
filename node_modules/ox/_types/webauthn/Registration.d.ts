import * as Base64 from '../core/Base64.js';
import * as Bytes from '../core/Bytes.js';
import * as Cbor from '../core/Cbor.js';
import * as CoseKey from '../core/CoseKey.js';
import * as Errors from '../core/Errors.js';
import * as Hash from '../core/Hash.js';
import * as Hex from '../core/Hex.js';
import type { OneOf } from '../core/internal/types.js';
import * as internal from '../core/internal/webauthn.js';
import * as P256 from '../core/P256.js';
import * as PublicKey from '../core/PublicKey.js';
import * as Signature from '../core/Signature.js';
import type * as Credential_ from './Credential.js';
import type * as Types from './Types.js';
export declare const createChallenge: Uint8Array;
/** Response from a WebAuthn registration ceremony. */
export type Response<serialized extends boolean = false> = {
    credential: Credential_.Credential<serialized>;
    counter: number;
    userVerified?: true | undefined;
    backedUp?: boolean | undefined;
    deviceType?: 'multiDevice' | 'singleDevice' | undefined;
};
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
export declare function create(options: create.Options): Promise<Credential_.Credential>;
export declare namespace create {
    type Options = OneOf<(getOptions.Options & {
        /**
         * Credential creation function. Useful for environments that do not support
         * the WebAuthn API natively (i.e. React Native or testing environments).
         *
         * @default window.navigator.credentials.create
         */
        createFn?: ((options?: Types.CredentialCreationOptions | undefined) => Promise<Types.Credential | null>) | undefined;
    }) | Types.CredentialCreationOptions>;
    type ErrorType = getOptions.ErrorType | internal.parseCredentialPublicKey.ErrorType | Errors.GlobalErrorType;
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
export declare function getOptions(options: getOptions.Options): Types.CredentialCreationOptions;
export declare namespace getOptions {
    type Options = {
        /**
         * A string specifying the relying party's preference for how the attestation statement
         * (i.e., provision of verifiable evidence of the authenticity of the authenticator and its data)
         * is conveyed during credential creation.
         */
        attestation?: Types.PublicKeyCredentialCreationOptions['attestation'] | undefined;
        /**
         * An object whose properties are criteria used to filter out the potential authenticators
         * for the credential creation operation.
         */
        authenticatorSelection?: Types.PublicKeyCredentialCreationOptions['authenticatorSelection'] | undefined;
        /**
         * An `ArrayBuffer`, `TypedArray`, or `DataView` used as a cryptographic challenge.
         */
        challenge?: Hex.Hex | Types.PublicKeyCredentialCreationOptions['challenge'] | undefined;
        /**
         * List of credential IDs to exclude from the creation. This property can be used
         * to prevent creation of a credential if it already exists.
         */
        excludeCredentialIds?: readonly string[] | undefined;
        /**
         * List of Web Authentication API credentials to use during creation or authentication.
         */
        extensions?: Types.PublicKeyCredentialCreationOptions['extensions'] | undefined;
        /**
         * An object describing the relying party that requested the credential creation
         */
        rp?: {
            id: string;
            name: string;
        } | undefined;
        /**
         * A numerical hint, in milliseconds, which indicates the time the calling web app is willing to wait for the creation operation to complete.
         */
        timeout?: Types.PublicKeyCredentialCreationOptions['timeout'] | undefined;
    } & OneOf<{
        /** Name for the credential (user.name). */
        name: string;
        user?: {
            displayName?: string;
            id?: Types.BufferSource;
            name: string;
        } | undefined;
    } | {
        name?: string | undefined;
        /**
         * An object describing the user account for which the credential is generated.
         */
        user: {
            displayName?: string;
            id?: Types.BufferSource;
            name: string;
        };
    }>;
    type ErrorType = Base64.toBytes.ErrorType | Hash.keccak256.ErrorType | Bytes.fromString.ErrorType | Errors.GlobalErrorType;
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
export declare function serializeResponse(response: Response): Response<true>;
export declare namespace serializeResponse {
    type ErrorType = Base64.fromBytes.ErrorType | PublicKey.toHex.ErrorType | Errors.GlobalErrorType;
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
export declare function serializeOptions(options: Types.CredentialCreationOptions): Types.CredentialCreationOptions<true>;
export declare namespace serializeOptions {
    type ErrorType = Base64.fromBytes.ErrorType | Errors.GlobalErrorType;
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
export declare function deserializeOptions(options: Types.CredentialCreationOptions<true>): Types.CredentialCreationOptions;
export declare namespace deserializeOptions {
    type ErrorType = Base64.toBytes.ErrorType | Errors.GlobalErrorType;
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
export declare function deserializeResponse(response: Response<true>): Response;
export declare namespace deserializeResponse {
    type ErrorType = Base64.toBytes.ErrorType | PublicKey.from.ErrorType | Errors.GlobalErrorType;
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
export declare function verify(options: verify.Options): verify.ReturnType;
export declare namespace verify {
    type Options = {
        /**
         * Attestation verification mode.
         * - `'required'` (default): attestation signature must be present and valid (`packed` self-attestation).
         * - `'none'`: accept `fmt: "none"` attestation (no cryptographic binding of authData to clientDataJSON).
         *
         * @default 'required'
         */
        attestation?: 'required' | 'none' | undefined;
        /** The credential response from `Registration.create()`. */
        credential: {
            attestationObject: Credential_.Credential['attestationObject'];
            clientDataJSON: Credential_.Credential['clientDataJSON'];
            id?: Credential_.Credential['id'] | undefined;
            raw?: Credential_.Credential['raw'] | undefined;
        };
        /**
         * Challenge to verify. Either the raw hex/bytes originally generated, or a
         * function that receives the base64url challenge string and returns whether
         * it is valid (for async/DB lookups).
         */
        challenge: Hex.Hex | Uint8Array | ((challenge: string) => boolean);
        /** Expected origin(s) (e.g. `"https://example.com"`). */
        origin: string | string[];
        /** Relying party ID (e.g. `"example.com"`). */
        rpId: string;
        /** The user verification requirement. @default 'required' */
        userVerification?: Types.UserVerificationRequirement | undefined;
    };
    type ReturnType = Response;
    type ErrorType = Base64.toBytes.ErrorType | Base64.fromBytes.ErrorType | Bytes.fromHex.ErrorType | Bytes.isEqual.ErrorType | Cbor.decode.ErrorType | CoseKey.toPublicKey.ErrorType | Hash.sha256.ErrorType | P256.verify.ErrorType | Signature.fromDerBytes.ErrorType | VerifyError | Errors.GlobalErrorType;
}
/** Thrown when WebAuthn registration verification fails. */
export declare class VerifyError extends Errors.BaseError {
    readonly name = "Registration.VerifyError";
}
/** Thrown when a WebAuthn P256 credential creation fails. */
export declare class CreateFailedError extends Errors.BaseError<Error> {
    readonly name = "Registration.CreateFailedError";
    constructor({ cause }?: {
        cause?: Error | undefined;
    });
}
//# sourceMappingURL=Registration.d.ts.map