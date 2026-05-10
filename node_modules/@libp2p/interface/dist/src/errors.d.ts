/**
 * When this error is thrown it means an operation was aborted,
 * usually in response to the `abort` event being emitted by an
 * AbortSignal.
 */
export declare class AbortError extends Error {
    readonly code: string;
    readonly type: string;
    constructor(message?: string);
    static readonly code = "ABORT_ERR";
    static readonly type = "aborted";
}
export declare class CodeError<T extends Record<string, any> = Record<string, never>> extends Error {
    readonly code: string;
    readonly props: T;
    constructor(message: string, code: string, props?: T);
}
export declare class UnexpectedPeerError extends Error {
    code: string;
    constructor(message?: string);
    static readonly code = "ERR_UNEXPECTED_PEER";
}
export declare class InvalidCryptoExchangeError extends Error {
    code: string;
    constructor(message?: string);
    static readonly code = "ERR_INVALID_CRYPTO_EXCHANGE";
}
export declare class InvalidCryptoTransmissionError extends Error {
    code: string;
    constructor(message?: string);
    static readonly code = "ERR_INVALID_CRYPTO_TRANSMISSION";
}
export declare const ERR_TIMEOUT = "ERR_TIMEOUT";
export declare const ERR_INVALID_PARAMETERS = "ERR_INVALID_PARAMETERS";
export declare const ERR_NOT_FOUND = "ERR_NOT_FOUND";
export declare const ERR_INVALID_MESSAGE = "ERR_INVALID_MESSAGE";
//# sourceMappingURL=errors.d.ts.map