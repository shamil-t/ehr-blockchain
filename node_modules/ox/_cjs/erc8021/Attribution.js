"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ercSuffixSize = exports.ercSuffix = void 0;
exports.getSchemaId = getSchemaId;
exports.toDataSuffix = toDataSuffix;
exports.fromData = fromData;
const Cbor = require("../core/Cbor.js");
const Hex = require("../core/Hex.js");
exports.ercSuffix = '0x80218021802180218021802180218021';
exports.ercSuffixSize = Hex.size(exports.ercSuffix);
function getSchemaId(attribution) {
    if ('appCode' in attribution ||
        'walletCode' in attribution ||
        'serviceCodes' in attribution)
        return 2;
    if ('codeRegistry' in attribution)
        return 1;
    return 0;
}
function toDataSuffix(attribution) {
    const schemaId = getSchemaId(attribution);
    if (schemaId === 2) {
        const schema2 = attribution;
        return schema2ToDataSuffix(schema2);
    }
    const codesHex = Hex.fromString((attribution.codes ?? []).join(','));
    const codesLength = Hex.size(codesHex);
    const codesLengthHex = Hex.fromNumber(codesLength, { size: 1 });
    const schemaIdHex = Hex.fromNumber(schemaId, { size: 1 });
    if (schemaId === 1) {
        const schema1 = attribution;
        return Hex.concat(registryToData(schema1.codeRegistry), codesHex, codesLengthHex, schemaIdHex, exports.ercSuffix);
    }
    return Hex.concat(codesHex, codesLengthHex, schemaIdHex, exports.ercSuffix);
}
function fromData(data) {
    const minSize = exports.ercSuffixSize + 1 + 1;
    if (Hex.size(data) < minSize)
        return undefined;
    const suffix = Hex.slice(data, -exports.ercSuffixSize);
    if (suffix !== exports.ercSuffix)
        return undefined;
    const schemaIdHex = Hex.slice(data, -exports.ercSuffixSize - 1, -exports.ercSuffixSize);
    const schemaId = Hex.toNumber(schemaIdHex);
    if (schemaId === 0) {
        const codesLengthHex = Hex.slice(data, -exports.ercSuffixSize - 2, -exports.ercSuffixSize - 1);
        const codesLength = Hex.toNumber(codesLengthHex);
        const codesStart = -exports.ercSuffixSize - 2 - codesLength;
        const codesEnd = -exports.ercSuffixSize - 2;
        const codesHex = Hex.slice(data, codesStart, codesEnd);
        const codesString = Hex.toString(codesHex);
        const codes = codesString.length > 0 ? codesString.split(',') : [];
        return { codes, id: 0 };
    }
    if (schemaId === 1) {
        const codesLengthHex = Hex.slice(data, -exports.ercSuffixSize - 2, -exports.ercSuffixSize - 1);
        const codesLength = Hex.toNumber(codesLengthHex);
        const codesStart = -exports.ercSuffixSize - 2 - codesLength;
        const codesEnd = -exports.ercSuffixSize - 2;
        const codesHex = Hex.slice(data, codesStart, codesEnd);
        const codesString = Hex.toString(codesHex);
        const codes = codesString.length > 0 ? codesString.split(',') : [];
        const codeRegistry = registryFromData(Hex.slice(data, 0, codesStart));
        if (codeRegistry === undefined)
            return undefined;
        return {
            codes,
            codeRegistry,
            id: 1,
        };
    }
    if (schemaId === 2) {
        return schema2FromData(data);
    }
    return undefined;
}
function registryFromData(data) {
    const minRegistrySize = 20 + 1;
    if (Hex.size(data) < minRegistrySize)
        return undefined;
    const chainIdLenHex = Hex.slice(data, -1);
    const chainIdLen = Hex.toNumber(chainIdLenHex);
    if (chainIdLen === 0)
        return undefined;
    const totalRegistrySize = 20 + chainIdLen + 1;
    if (Hex.size(data) < totalRegistrySize)
        return undefined;
    const addressStart = -(chainIdLen + 1 + 20);
    const addressEnd = -(chainIdLen + 1);
    const addressHex = Hex.slice(data, addressStart, addressEnd);
    const chainIdHex = Hex.slice(data, -(chainIdLen + 1), -1);
    const codeRegistry = {
        address: addressHex,
        chainId: Hex.toNumber(chainIdHex),
    };
    return codeRegistry;
}
function registryToData(registry) {
    const chainIdAsHex = Hex.fromNumber(registry.chainId);
    const chainIdLen = Hex.size(chainIdAsHex);
    const paddedChainId = Hex.padLeft(chainIdAsHex, chainIdLen);
    return Hex.concat(registry.address, paddedChainId, Hex.fromNumber(chainIdLen, { size: 1 }));
}
function schema2ToDataSuffix(attribution) {
    const cborMap = {};
    if (attribution.appCode)
        cborMap.a = attribution.appCode;
    if (attribution.walletCode)
        cborMap.w = attribution.walletCode;
    if (attribution.serviceCodes && attribution.serviceCodes.length > 0)
        cborMap.s = [...attribution.serviceCodes];
    if (attribution.registries) {
        const r = {};
        if (attribution.registries.app) {
            r.a = {
                c: Hex.fromNumber(attribution.registries.app.chainId),
                a: attribution.registries.app.address,
            };
        }
        if (attribution.registries.wallet) {
            r.w = {
                c: Hex.fromNumber(attribution.registries.wallet.chainId),
                a: attribution.registries.wallet.address,
            };
        }
        if (r.a || r.w)
            cborMap.r = r;
    }
    if (attribution.metadata && Object.keys(attribution.metadata).length > 0)
        cborMap.m = attribution.metadata;
    const cborHex = Cbor.encode(cborMap);
    const cborBytes = Hex.size(cborHex);
    return Hex.concat(cborHex, Hex.fromNumber(cborBytes, { size: 2 }), Hex.fromNumber(2, { size: 1 }), exports.ercSuffix);
}
function schema2FromData(data) {
    const cborLengthHex = Hex.slice(data, -exports.ercSuffixSize - 1 - 2, -exports.ercSuffixSize - 1);
    const cborLength = Hex.toNumber(cborLengthHex);
    const cborStart = -exports.ercSuffixSize - 1 - 2 - cborLength;
    const cborEnd = -exports.ercSuffixSize - 1 - 2;
    const cborHex = Hex.slice(data, cborStart, cborEnd);
    const decoded = Cbor.decode(cborHex);
    const result = { id: 2 };
    if (typeof decoded.a === 'string')
        result.appCode = decoded.a;
    if (typeof decoded.w === 'string')
        result.walletCode = decoded.w;
    if (Array.isArray(decoded.s))
        result.serviceCodes = decoded.s;
    if (decoded.r) {
        const registries = {};
        if (decoded.r.a?.c && decoded.r.a?.a) {
            registries.app = {
                address: decoded.r.a.a,
                chainId: Hex.toNumber(decoded.r.a.c),
            };
        }
        if (decoded.r.w?.c && decoded.r.w?.a) {
            registries.wallet = {
                address: decoded.r.w.a,
                chainId: Hex.toNumber(decoded.r.w.c),
            };
        }
        if (registries.app || registries.wallet)
            result.registries = registries;
    }
    if (decoded.m && typeof decoded.m === 'object')
        result.metadata = decoded.m;
    return result;
}
//# sourceMappingURL=Attribution.js.map