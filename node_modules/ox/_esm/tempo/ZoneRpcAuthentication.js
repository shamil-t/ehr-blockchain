import * as Errors from '../core/Errors.js';
import * as Hash from '../core/Hash.js';
import * as Hex from '../core/Hex.js';
import * as SignatureEnvelope from './SignatureEnvelope.js';
import * as TempoAddress from './TempoAddress.js';
/**
 * Header name used to transport Zone RPC authentication tokens.
 */
export const headerName = 'X-Authorization-Token';
/**
 * 32-byte domain separator used when hashing Zone RPC authentication tokens.
 */
export const magicBytes = '0x54656d706f5a6f6e655250430000000000000000000000000000000000000000';
/**
 * Size, in bytes, of the fixed Zone RPC authentication fields.
 */
export const fieldsSize = 29;
/** Current Zone RPC authentication version. */
export const version = 0;
/**
 * Instantiates a typed Zone RPC authentication token.
 *
 * @example
 * ```ts twoslash
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const authentication = ZoneRpcAuthentication.from({
 *   chainId: 4217000026,
 *   expiresAt: 1711235160,
 *   issuedAt: 1711234560,
 *   zoneId: 26,
 * })
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const authentication = ZoneRpcAuthentication.from({
 *   chainId: 4217000026,
 *   expiresAt: 1711235160,
 *   issuedAt: 1711234560,
 *   zoneId: 26,
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: ZoneRpcAuthentication.getSignPayload(authentication),
 *   privateKey: '0x...',
 * })
 *
 * const authentication_signed = ZoneRpcAuthentication.from(authentication, {
 *   signature,
 * })
 * ```
 *
 * @param authentication - Zone RPC authentication token fields.
 * @param options - Zone RPC authentication options.
 * @returns The instantiated Zone RPC authentication token.
 */
export function from(authentication, options = {}) {
    const auth = authentication;
    const resolved = {
        ...auth,
        version,
    };
    if (options.signature)
        return {
            ...resolved,
            signature: SignatureEnvelope.from(options.signature),
        };
    return resolved;
}
/**
 * Parses a serialized Zone RPC authentication token.
 *
 * The serialized format is `<signature><29-byte fields>`. The signature is parsed
 * from the prefix and the fixed-length fields are parsed from the suffix.
 *
 * @example
 * ```ts twoslash
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const authentication = ZoneRpcAuthentication.deserialize('0x...')
 * ```
 *
 * @param serialized - The serialized Zone RPC authentication token.
 * @returns The parsed Zone RPC authentication token.
 */
export function deserialize(serialized) {
    const size = Hex.size(serialized);
    if (size <= fieldsSize)
        throw new InvalidSerializedError({
            reason: `Serialized authentication must be longer than ${fieldsSize} bytes.`,
            serialized,
        });
    const fieldsOffset = size - fieldsSize;
    const signature = Hex.slice(serialized, 0, fieldsOffset);
    const fields = Hex.slice(serialized, fieldsOffset);
    const parsedVersion = Hex.toNumber(Hex.slice(fields, 0, 1), { size: 1 });
    if (parsedVersion !== version)
        throw new InvalidSerializedError({
            reason: `Unsupported authentication version "${parsedVersion}". Expected "${version}".`,
            serialized,
        });
    return {
        chainId: Hex.toNumber(Hex.slice(fields, 5, 13), { size: 8 }),
        expiresAt: Hex.toNumber(Hex.slice(fields, 21, 29), { size: 8 }),
        issuedAt: Hex.toNumber(Hex.slice(fields, 13, 21), { size: 8 }),
        signature: SignatureEnvelope.deserialize(signature),
        version,
        zoneId: Hex.toNumber(Hex.slice(fields, 1, 5), { size: 4 }),
    };
}
/**
 * Returns the 29-byte fixed field suffix for a Zone RPC authentication token.
 *
 * @example
 * ```ts twoslash
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const fields = ZoneRpcAuthentication.getFields({
 *   chainId: 4217000026,
 *   expiresAt: 1711235160,
 *   issuedAt: 1711234560,
 *   zoneId: 26,
 * })
 * ```
 *
 * @param authentication - The Zone RPC authentication token.
 * @returns The fixed 29-byte field suffix.
 */
export function getFields(authentication) {
    return Hex.concat(Hex.fromNumber(version, { size: 1 }), Hex.fromNumber(authentication.zoneId, { size: 4 }), Hex.fromNumber(authentication.chainId, { size: 8 }), Hex.fromNumber(authentication.issuedAt, { size: 8 }), Hex.fromNumber(authentication.expiresAt, { size: 8 }));
}
/**
 * Computes the sign payload for a Zone RPC authentication token.
 *
 * When `userAddress` is provided, the payload is wrapped as
 * `keccak256(0x04 || authHash || userAddress)` to match V2 keychain signing.
 *
 * @example
 * ```ts twoslash
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const authentication = ZoneRpcAuthentication.from({
 *   chainId: 4217000026,
 *   expiresAt: 1711235160,
 *   issuedAt: 1711234560,
 *   zoneId: 26,
 * })
 *
 * const payload = ZoneRpcAuthentication.getSignPayload(authentication)
 * ```
 *
 * @param authentication - The Zone RPC authentication token.
 * @param options - Options.
 * @returns The sign payload.
 */
export function getSignPayload(authentication, options = {}) {
    const authHash = hash(authentication);
    if (options.userAddress)
        return Hash.keccak256(Hex.concat('0x04', authHash, TempoAddress.resolve(options.userAddress)));
    return authHash;
}
/**
 * Computes the raw authorization hash for a Zone RPC authentication token.
 *
 * The hash is `keccak256(magicBytes || fields)`.
 *
 * @example
 * ```ts twoslash
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const authentication = ZoneRpcAuthentication.from({
 *   chainId: 4217000026,
 *   expiresAt: 1711235160,
 *   issuedAt: 1711234560,
 *   zoneId: 26,
 * })
 *
 * const hash = ZoneRpcAuthentication.hash(authentication)
 * ```
 *
 * @param authentication - The Zone RPC authentication token.
 * @returns The authorization hash.
 */
export function hash(authentication) {
    return Hash.keccak256(Hex.concat(magicBytes, getFields(authentication)));
}
/**
 * Serializes a Zone RPC authentication token to hex.
 *
 * The serialized format is `<signature><29-byte fields>`.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const authentication = ZoneRpcAuthentication.from({
 *   chainId: 4217000026,
 *   expiresAt: 1711235160,
 *   issuedAt: 1711234560,
 *   zoneId: 26,
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: ZoneRpcAuthentication.getSignPayload(authentication),
 *   privateKey: '0x...',
 * })
 *
 * const serialized = ZoneRpcAuthentication.serialize(authentication, {
 *   signature,
 * })
 * ```
 *
 * @param authentication - The Zone RPC authentication token.
 * @param options - Serialization options.
 * @returns The serialized authentication token.
 */
export function serialize(authentication, options = {}) {
    const signature = options.signature || authentication.signature;
    if (!signature)
        throw new MissingSignatureError();
    return Hex.concat(SignatureEnvelope.serialize(SignatureEnvelope.from(signature)), getFields(authentication));
}
/** Error thrown when a serialized authentication token cannot be deserialized. */
export class InvalidSerializedError extends Errors.BaseError {
    constructor({ reason, serialized }) {
        super(`Unable to deserialize Zone RPC authentication: ${reason}`, {
            metaMessages: [`Serialized: ${serialized}`],
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'ZoneRpcAuthentication.InvalidSerializedError'
        });
    }
}
/** Error thrown when serializing an authentication token without a signature. */
export class MissingSignatureError extends Errors.BaseError {
    constructor() {
        super('Zone RPC authentication is missing a signature.');
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'ZoneRpcAuthentication.MissingSignatureError'
        });
    }
}
//# sourceMappingURL=ZoneRpcAuthentication.js.map