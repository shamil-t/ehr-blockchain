import * as Bytes from '../core/Bytes.js';
import * as Cbor from '../core/Cbor.js';
import type * as Errors from '../core/Errors.js';
import * as Hex from '../core/Hex.js';
import type * as PublicKey from '../core/PublicKey.js';
import type * as Types from './Types.js';
/**
 * Gets the authenticator data which contains information about the
 * processing of an authenticator request (ie. from `Authentication.sign`).
 *
 * :::warning
 *
 * This function is mainly for testing purposes or for manually constructing
 * autenticator data. In most cases you will not need this function.
 * `authenticatorData` is typically returned as part of the
 * authenticator response.
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { Authenticator } from 'ox/webauthn'
 *
 * const authenticatorData = Authenticator.getAuthenticatorData({
 *   rpId: 'example.com',
 *   signCount: 420,
 * })
 * // @log: "0xa379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce194705000001a4"
 * ```
 *
 * @example
 * ### With Attested Credential Data
 *
 * Include a credential ID and public key in the authenticator data (for registration responses):
 *
 * ```ts twoslash
 * import { P256 } from 'ox'
 * import { Authenticator } from 'ox/webauthn'
 *
 * const { publicKey } = P256.createKeyPair()
 *
 * const authenticatorData = Authenticator.getAuthenticatorData({
 *   rpId: 'example.com',
 *   flag: 0x41, // UP + AT
 *   credential: {
 *     id: new Uint8Array(32),
 *     publicKey,
 *   },
 * })
 * ```
 *
 * @param options - Options to construct the authenticator data.
 * @returns The authenticator data.
 */
export declare function getAuthenticatorData(options?: getAuthenticatorData.Options): Hex.Hex;
export declare namespace getAuthenticatorData {
    type Options = {
        /** Attested credential data to include (credential ID + public key). When set, the AT flag (0x40) should also be set. */
        credential?: {
            /** The credential ID as raw bytes. */
            id: Uint8Array;
            /** The P256 public key associated with the credential. */
            publicKey: PublicKey.PublicKey;
        } | undefined;
        /** A bitfield that indicates various attributes that were asserted by the authenticator. [Read more](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API/Authenticator_data#flags) */
        flag?: number | undefined;
        /** The [Relying Party ID](https://w3c.github.io/webauthn/#relying-party-identifier) that the credential is scoped to. */
        rpId?: Types.PublicKeyCredentialRequestOptions['rpId'] | undefined;
        /** A signature counter, if supported by the authenticator (set to 0 otherwise). */
        signCount?: number | undefined;
    };
    type ErrorType = Errors.GlobalErrorType;
}
/**
 * Extracts the signature counter from the authenticator data.
 * The counter is a 4-byte big-endian unsigned integer at bytes 33–36.
 *
 * Useful for detecting cloned authenticators: if the counter is non-zero and
 * does not monotonically increase between assertions, it may indicate a cloned key.
 *
 * @example
 * ```ts twoslash
 * import { Authenticator } from 'ox/webauthn'
 *
 * const signCount = Authenticator.getSignCount(
 *   '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000001',
 * )
 * // @log: 1
 * ```
 *
 * @param authenticatorData - The authenticator data hex string.
 * @returns The signature counter.
 */
export declare function getSignCount(authenticatorData: Hex.Hex): number;
export declare namespace getSignCount {
    type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType;
}
/**
 * Constructs the Client Data in stringified JSON format which represents client data that
 * was passed to `credentials.get()` or `credentials.create()`.
 *
 * :::warning
 *
 * This function is mainly for testing purposes or for manually constructing
 * client data. In most cases you will not need this function.
 * `clientDataJSON` is typically returned as part of the authenticator response.
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { Authenticator } from 'ox/webauthn'
 *
 * const clientDataJSON = Authenticator.getClientDataJSON({
 *   challenge: '0xdeadbeef',
 *   origin: 'https://example.com',
 * })
 * // @log: "{"type":"webauthn.get","challenge":"3q2-7w","origin":"https://example.com","crossOrigin":false}"
 * ```
 *
 * @param options - Options to construct the client data.
 * @returns The client data.
 */
export declare function getClientDataJSON(options: getClientDataJSON.Options): string;
export declare namespace getClientDataJSON {
    type Options = {
        /** The challenge to sign. */
        challenge: Hex.Hex;
        /** If set to `true`, it means that the calling context is an `<iframe>` that is not same origin with its ancestor frames. */
        crossOrigin?: boolean | undefined;
        /** Additional client data to include in the client data JSON. */
        extraClientData?: Record<string, unknown> | undefined;
        /** The fully qualified origin of the relying party which has been given by the client/browser to the authenticator. */
        origin?: string | undefined;
        /** The WebAuthn ceremony type. @default 'webauthn.get' */
        type?: 'webauthn.create' | 'webauthn.get' | undefined;
    };
    type ErrorType = Errors.GlobalErrorType;
}
/**
 * Constructs a CBOR-encoded attestation object for testing WebAuthn registration
 * verification. Combines the authenticator data with an attestation statement.
 *
 * :::warning
 *
 * This function is mainly for testing purposes. In production, the attestation
 * object is returned by the authenticator during `navigator.credentials.create()`.
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 * import { Authenticator } from 'ox/webauthn'
 *
 * const { publicKey } = P256.createKeyPair()
 *
 * const attestationObject = Authenticator.getAttestationObject({
 *   authData: Authenticator.getAuthenticatorData({
 *     rpId: 'example.com',
 *     flag: 0x41,
 *     credential: { id: new Uint8Array(32), publicKey },
 *   }),
 * })
 * ```
 *
 * @param options - Options to construct the attestation object.
 * @returns The CBOR-encoded attestation object as a Hex string.
 */
export declare function getAttestationObject(options: getAttestationObject.Options): Hex.Hex;
export declare namespace getAttestationObject {
    type Options = {
        /** Attestation statement. */
        attStmt?: Record<string, unknown> | undefined;
        /** Authenticator data as a Hex string (from `Authenticator.getAuthenticatorData`). */
        authData: Hex.Hex;
        /** Attestation format. @default 'none' */
        fmt?: string | undefined;
    };
    type ErrorType = Cbor.encode.ErrorType | Errors.GlobalErrorType;
}
//# sourceMappingURL=Authenticator.d.ts.map