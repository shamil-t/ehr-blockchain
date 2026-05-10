export declare type EncoderResult = {
    dynamic: boolean;
    encoded: Uint8Array;
};
export declare type DecoderResult<T = unknown> = {
    result: T;
    encoded: Uint8Array;
    consumed: number;
};
export declare type NumberType = {
    signed: boolean;
    byteLength: number;
};
export declare type BytesType = {
    size?: number;
};
//# sourceMappingURL=types.d.ts.map