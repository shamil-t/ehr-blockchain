/**
 * When this error is thrown it means an operation was aborted,
 * usually in response to the `abort` event being emitted by an
 * AbortSignal.
 */
export class AbortError extends Error {
    code;
    type;
    constructor(message = 'The operation was aborted') {
        super(message);
        this.code = AbortError.code;
        this.type = AbortError.type;
    }
    static code = 'ABORT_ERR';
    static type = 'aborted';
}
export class CodeError extends Error {
    code;
    props;
    constructor(message, code, props) {
        super(message);
        this.code = code;
        this.name = props?.name ?? 'CodeError';
        this.props = props ?? {}; // eslint-disable-line @typescript-eslint/consistent-type-assertions
    }
}
export class UnexpectedPeerError extends Error {
    code;
    constructor(message = 'Unexpected Peer') {
        super(message);
        this.code = UnexpectedPeerError.code;
    }
    static code = 'ERR_UNEXPECTED_PEER';
}
export class InvalidCryptoExchangeError extends Error {
    code;
    constructor(message = 'Invalid crypto exchange') {
        super(message);
        this.code = InvalidCryptoExchangeError.code;
    }
    static code = 'ERR_INVALID_CRYPTO_EXCHANGE';
}
export class InvalidCryptoTransmissionError extends Error {
    code;
    constructor(message = 'Invalid crypto transmission') {
        super(message);
        this.code = InvalidCryptoTransmissionError.code;
    }
    static code = 'ERR_INVALID_CRYPTO_TRANSMISSION';
}
// Error codes
export const ERR_TIMEOUT = 'ERR_TIMEOUT';
export const ERR_INVALID_PARAMETERS = 'ERR_INVALID_PARAMETERS';
export const ERR_NOT_FOUND = 'ERR_NOT_FOUND';
export const ERR_INVALID_MESSAGE = 'ERR_INVALID_MESSAGE';
//# sourceMappingURL=errors.js.map