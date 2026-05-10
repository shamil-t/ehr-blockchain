import * as Base64 from '../../core/Base64.js';
/** @internal */
export const base64UrlOptions = { url: true, pad: false };
/** @internal */
export const responseKeys = [
    'attestationObject',
    'authenticatorData',
    'clientDataJSON',
    'signature',
    'userHandle',
];
/** @internal */
export function bytesToArrayBuffer(bytes) {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
/** @internal */
export function bufferSourceToBytes(source) {
    if (source instanceof Uint8Array)
        return source;
    if (source instanceof ArrayBuffer)
        return new Uint8Array(source);
    return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
}
/** @internal */
export function serializeExtensions(extensions) {
    const { prf, ...rest } = extensions;
    return {
        ...rest,
        ...(prf && {
            prf: {
                eval: {
                    first: Base64.fromBytes(prf.eval.first, base64UrlOptions),
                },
            },
        }),
    };
}
/** @internal */
export function deserializeExtensions(extensions) {
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