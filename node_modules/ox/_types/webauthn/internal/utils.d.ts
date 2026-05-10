import type * as Types from '../Types.js';
/** @internal */
export declare const base64UrlOptions: {
    readonly url: true;
    readonly pad: false;
};
/** @internal */
export declare const responseKeys: readonly ["attestationObject", "authenticatorData", "clientDataJSON", "signature", "userHandle"];
/** @internal */
export declare function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer;
/** @internal */
export declare function bufferSourceToBytes(source: Types.BufferSource): Uint8Array;
/** @internal */
export declare function serializeExtensions(extensions: Types.AuthenticationExtensionsClientInputs): Types.AuthenticationExtensionsClientInputs<true>;
/** @internal */
export declare function deserializeExtensions(extensions: Types.AuthenticationExtensionsClientInputs<true>): Types.AuthenticationExtensionsClientInputs;
//# sourceMappingURL=utils.d.ts.map