"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.from = from;
exports.fromRpc = fromRpc;
exports.fromTuple = fromTuple;
exports.getSignPayload = getSignPayload;
exports.deserialize = deserialize;
exports.hash = hash;
exports.serialize = serialize;
exports.toRpc = toRpc;
exports.toTuple = toTuple;
const AbiItem = require("../core/AbiItem.js");
const Hash = require("../core/Hash.js");
const Hex = require("../core/Hex.js");
const Rlp = require("../core/Rlp.js");
const SignatureEnvelope = require("./SignatureEnvelope.js");
const TempoAddress = require("./TempoAddress.js");
function from(authorization, options = {}) {
    if ('keyId' in authorization)
        return fromRpc(authorization);
    const auth = authorization;
    const resolved = {
        ...auth,
        address: TempoAddress.resolve(auth.address),
        ...(auth.limits
            ? {
                limits: auth.limits.map((l) => ({
                    ...l,
                    token: TempoAddress.resolve(l.token),
                })),
            }
            : {}),
        ...(auth.scopes
            ? {
                scopes: auth.scopes.map((scope) => ({
                    ...scope,
                    address: TempoAddress.resolve(scope.address),
                    selector: resolveSelector(scope.selector),
                    ...(scope.recipients
                        ? {
                            recipients: scope.recipients.map((r) => TempoAddress.resolve(r)),
                        }
                        : {}),
                })),
            }
            : {}),
    };
    if (options.signature)
        return {
            ...resolved,
            signature: SignatureEnvelope.from(options.signature),
        };
    return resolved;
}
function fromRpc(authorization) {
    const { allowedCalls, chainId, keyId, expiry, limits, keyType } = authorization;
    const signature = SignatureEnvelope.fromRpc(authorization.signature);
    const scopes = allowedCalls
        ? allowedCalls.flatMap((callScope) => {
            if (!callScope.selectorRules || callScope.selectorRules.length === 0)
                return [{ address: callScope.target }];
            return callScope.selectorRules.map((rule) => ({
                address: callScope.target,
                selector: normalizeSelector(rule.selector),
                ...(rule.recipients && rule.recipients.length > 0
                    ? { recipients: rule.recipients }
                    : {}),
            }));
        })
        : undefined;
    return {
        address: keyId,
        chainId: chainId === '0x' ? 0n : Hex.toBigInt(chainId),
        ...(expiry != null ? { expiry: Number(expiry) } : {}),
        limits: limits?.map((limit) => ({
            token: limit.token,
            limit: BigInt(limit.limit),
            ...(limit.period && hexToNumber(limit.period) > 0
                ? { period: hexToNumber(limit.period) }
                : {}),
        })),
        ...(scopes ? { scopes } : {}),
        signature,
        type: keyType,
    };
}
function fromTuple(tuple) {
    const [authorization, signatureSerialized] = tuple;
    const [chainId, keyType_hex, keyId, expiry, limits, scopes] = authorization;
    const keyType = (() => {
        switch (keyType_hex) {
            case '0x':
            case '0x00':
                return 'secp256k1';
            case '0x01':
                return 'p256';
            case '0x02':
                return 'webAuthn';
            default:
                throw new Error(`Invalid key type: ${keyType_hex}`);
        }
    })();
    const args = {
        address: keyId,
        expiry: typeof expiry !== 'undefined'
            ? hexToNumber(expiry) || undefined
            : undefined,
        type: keyType,
        chainId: chainId === '0x' ? 0n : Hex.toBigInt(chainId),
        ...(typeof expiry !== 'undefined'
            ? { expiry: hexToNumber(expiry) || undefined }
            : {}),
        ...(typeof limits !== 'undefined' &&
            Array.isArray(limits) &&
            limits.length > 0
            ? {
                limits: limits.map((limitTuple) => {
                    const [token, limit, period] = limitTuple;
                    return {
                        token,
                        limit: hexToBigint(limit),
                        ...(typeof period !== 'undefined'
                            ? { period: hexToNumber(period) }
                            : {}),
                    };
                }),
            }
            : {}),
        ...(typeof scopes !== 'undefined' && Array.isArray(scopes)
            ? {
                scopes: scopes.flatMap((scopeTuple) => {
                    const [address, selectorRules] = scopeTuple;
                    if (!Array.isArray(selectorRules) || selectorRules.length === 0)
                        return [{ address }];
                    return selectorRules.map((ruleTuple) => {
                        const [selector, recipients] = ruleTuple;
                        return {
                            address,
                            selector,
                            ...(Array.isArray(recipients) && recipients.length > 0
                                ? { recipients }
                                : {}),
                        };
                    });
                }),
            }
            : {}),
    };
    if (signatureSerialized)
        args.signature = SignatureEnvelope.deserialize(signatureSerialized);
    return from(args);
}
function getSignPayload(authorization) {
    return hash(authorization);
}
function deserialize(serialized) {
    const tuple = Rlp.toHex(serialized);
    return fromTuple(tuple);
}
function hash(authorization) {
    const [authorizationTuple] = toTuple(authorization);
    const serialized = Rlp.fromHex(authorizationTuple);
    return Hash.keccak256(serialized);
}
function serialize(authorization) {
    const tuple = toTuple(authorization);
    return Rlp.fromHex(tuple);
}
function toRpc(authorization) {
    const { address, scopes, chainId, expiry, limits, type, signature } = authorization;
    const allowedCalls = (() => {
        if (!scopes)
            return undefined;
        const grouped = new Map();
        for (const scope of scopes) {
            const key = scope.address;
            if (!grouped.has(key))
                grouped.set(key, []);
            if (scope.selector) {
                grouped.get(key).push({
                    selector: resolveSelector(scope.selector),
                    ...(scope.recipients && scope.recipients.length > 0
                        ? { recipients: scope.recipients }
                        : {}),
                });
            }
        }
        return [...grouped.entries()].map(([target, selectorRules]) => ({
            target: target,
            ...(selectorRules.length > 0 ? { selectorRules } : {}),
        }));
    })();
    return {
        chainId: chainId === 0n ? '0x' : Hex.fromNumber(chainId),
        expiry: typeof expiry === 'number' ? Hex.fromNumber(expiry) : null,
        keyId: TempoAddress.resolve(address),
        keyType: type,
        limits: limits?.map(({ token, limit, period }) => ({
            token,
            limit: Hex.fromNumber(limit),
            ...(period ? { period: numberToHex(period) } : {}),
        })),
        signature: SignatureEnvelope.toRpc(signature),
        ...(allowedCalls ? { allowedCalls } : {}),
    };
}
function toTuple(authorization) {
    const { address, chainId, scopes, expiry, limits } = authorization;
    const signature = authorization.signature
        ? SignatureEnvelope.serialize(authorization.signature)
        : undefined;
    const type = (() => {
        switch (authorization.type) {
            case 'secp256k1':
                return '0x';
            case 'p256':
                return '0x01';
            case 'webAuthn':
                return '0x02';
            default:
                throw new Error(`Invalid key type: ${authorization.type}`);
        }
    })();
    const limitsValue = limits?.map((limit) => {
        const tuple = [limit.token, bigintToHex(limit.limit)];
        if (limit.period && limit.period > 0)
            tuple.push(numberToHex(limit.period));
        return tuple;
    });
    const callsValue = (() => {
        if (!scopes)
            return undefined;
        const grouped = new Map();
        for (const scope of scopes) {
            const key = scope.address;
            if (!grouped.has(key))
                grouped.set(key, []);
            if (scope.selector) {
                grouped
                    .get(key)
                    .push([
                    resolveSelector(scope.selector),
                    (scope.recipients ??
                        []),
                ]);
            }
        }
        return [...grouped.entries()].map(([address, selectorRules]) => [
            address,
            selectorRules.map(([selector, recipients]) => [selector, recipients]),
        ]);
    })();
    const authorizationTuple = [
        bigintToHex(chainId),
        type,
        address,
        (expiry !== null && expiry !== undefined && expiry !== 0) ||
            limitsValue ||
            callsValue
            ? numberToHex(expiry ?? 0)
            : undefined,
        limitsValue || callsValue ? (limitsValue ?? []) : undefined,
        callsValue,
    ].filter((x) => typeof x !== 'undefined');
    return [authorizationTuple, ...(signature ? [signature] : [])];
}
function bigintToHex(value) {
    return value === 0n ? '0x' : Hex.fromNumber(value);
}
function numberToHex(value) {
    return value === 0 ? '0x' : Hex.fromNumber(value);
}
function hexToBigint(hex) {
    return hex === '0x' ? 0n : BigInt(hex);
}
function hexToNumber(hex) {
    return hex === '0x' ? 0 : Hex.toNumber(hex);
}
function normalizeSelector(selector) {
    if (typeof selector === 'string')
        return selector;
    if (Array.isArray(selector))
        return Hex.fromBytes(new Uint8Array(selector));
    return selector;
}
function resolveSelector(selector) {
    if (!selector)
        return undefined;
    if (selector.startsWith('0x'))
        return selector;
    return AbiItem.getSelector(selector);
}
//# sourceMappingURL=KeyAuthorization.js.map