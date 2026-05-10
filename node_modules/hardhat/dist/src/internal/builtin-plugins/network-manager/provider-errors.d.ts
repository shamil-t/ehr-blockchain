import type { ProviderRpcError } from "../../../types/providers.js";
import { CustomError } from "@nomicfoundation/hardhat-utils/error";
export declare class ProviderError extends CustomError implements ProviderRpcError {
    code: number;
    data?: unknown;
    constructor(message: string, code: number, parentError?: Error);
    static isProviderError(other: unknown): other is ProviderError;
}
export declare class LimitExceededError extends ProviderError {
    static readonly CODE = -32005;
    constructor(message?: string, parent?: Error);
}
export declare class InvalidJsonInputError extends ProviderError {
    static readonly CODE = -32700;
    constructor(message?: string, parent?: Error);
}
export declare class InvalidRequestError extends ProviderError {
    static readonly CODE = -32600;
    constructor(message?: string, parent?: Error);
}
export declare class MethodNotFoundError extends ProviderError {
    static readonly CODE = -32601;
    constructor(message?: string, parent?: Error);
}
export declare class InvalidArgumentsError extends ProviderError {
    static readonly CODE = -32602;
    constructor(message?: string, parent?: Error);
}
export declare class InternalError extends ProviderError {
    static readonly CODE = -32603;
    constructor(message?: string, parent?: Error);
}
export declare class TransactionExecutionError extends ProviderError {
    static readonly CODE = -32003;
    constructor(message?: string, parent?: Error);
}
export declare class MethodNotSupportedError extends ProviderError {
    static readonly CODE = -32004;
    constructor(message?: string, parent?: Error);
}
export declare class InvalidResponseError extends ProviderError {
    static readonly CODE = -32999;
    constructor(message?: string, parent?: Error);
}
export declare class UnknownError extends ProviderError {
    static readonly CODE = -1;
    constructor(message?: string, parent?: Error);
}
//# sourceMappingURL=provider-errors.d.ts.map