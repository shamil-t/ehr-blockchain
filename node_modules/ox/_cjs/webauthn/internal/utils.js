"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseKeys = exports.base64UrlOptions = void 0;
exports.bytesToArrayBuffer = bytesToArrayBuffer;
exports.bufferSourceToBytes = bufferSourceToBytes;
exports.serializeExtensions = serializeExtensions;
exports.deserializeExtensions = deserializeExtensions;
const Base64 = require("../../core/Base64.js");
exports.base64UrlOptions = { url: true, pad: false };
exports.responseKeys = [
    'attestationObject',
    'authenticatorData',
    'clientDataJSON',
    'signature',
    'userHandle',
];
function bytesToArrayBuffer(bytes) {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
function bufferSourceToBytes(source) {
    if (source instanceof Uint8Array)
        return source;
    if (source instanceof ArrayBuffer)
        return new Uint8Array(source);
    return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
}
function serializeExtensions(extensions) {
    const { prf, ...rest } = extensions;
    return {
        ...rest,
        ...(prf && {
            prf: {
                eval: {
                    first: Base64.fromBytes(prf.eval.first, exports.base64UrlOptions),
                },
            },
        }),
    };
}
function deserializeExtensions(extensions) {
    const { prf, ...rest } = extensions;
    return {
        ...rest,
        ...(prf && {
            prf: {
                eval: {
                    first: Base64.toBytes(prf.eval.first),
                },
            },
        }),
    };
}
//# sourceMappingURL=utils.js.map