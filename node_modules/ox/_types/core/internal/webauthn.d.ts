import * as Registration from '../../webauthn/Registration.js';
import type * as Errors from '../Errors.js';
import * as PublicKey from '../PublicKey.js';
/**
 * Parses an ASN.1 signature into a r and s value.
 *
 * @internal
 */
export declare function parseAsn1Signature(bytes: Uint8Array): {
    r: bigint;
    s: bigint;
};
/**
 * Parses a public key into x and y coordinates from the public key
 * defined on the credential.
 *
 * @internal
 */
export declare function parseCredentialPublicKey(response: AuthenticatorAttestationResponse, 
/** Pre-cloned attestationObject to use in the fallback path, avoiding
 *  cross-origin access on the proxy response object. */
attestationObject?: ArrayBuffer | ArrayBufferLike): Promise<PublicKey.PublicKey>;
export declare namespace parseCredentialPublicKey {
    type ErrorType = Registration.CreateFailedError | Errors.GlobalErrorType;
}
//# sourceMappingURL=webauthn.d.ts.map