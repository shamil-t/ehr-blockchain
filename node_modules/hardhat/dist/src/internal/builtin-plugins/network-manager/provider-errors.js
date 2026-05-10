import { CustomError } from "@nomicfoundation/hardhat-utils/error";
import { isObject } from "@nomicfoundation/hardhat-utils/lang";
const IS_PROVIDER_ERROR_PROPERTY_NAME = "_isProviderError";
// Codes taken from: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1474.md#error-codes
//
// Code	  Message	              Meaning	                            Category
//
// -32600	Invalid request	      JSON is not a valid request object  standard
// -32601	Method not found	    Method does not exist	              standard
// -32602	Invalid params	      Invalid method parameters	          standard
// -32603	Internal error	      Internal JSON-RPC error	            standard
// -32700	Parse error	          Invalid JSON	                      standard
//
// -32003	Transaction rejected	Transaction creation failed	        non-standard
// -32004	Method not supported	Method is not implemented	          non-standard
// -32005	Limit exceeded	      Request exceeds defined limit	      non-standard
//
// -32999 Invalid response      The server returned a JSON-RPC      hardhat-specific
//                              response, but the result is not
//                              in the expected format
export class ProviderError extends CustomError {
    code;
    data;
    constructor(message, code, parentError) {
        super(message, parentError);
        this.code = code;
        Object.defineProperty(this, IS_PROVIDER_ERROR_PROPERTY_NAME, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: true,
        });
    }
    static isProviderError(other) {
        if (!isObject(other)) {
            return false;
        }
        const isProviderErrorProperty = Object.getOwnPropertyDescriptor(other, IS_PROVIDER_ERROR_PROPERTY_NAME);
        return isProviderErrorProperty?.value === true;
    }
}
export class LimitExceededError extends ProviderError {
    static CODE = -32005;
    constructor(message = "Limit exceeded", parent) {
        super(message, LimitExceededError.CODE, parent);
    }
}
export class InvalidJsonInputError extends ProviderError {
    static CODE = -32700;
    constructor(message = "Parse error", parent) {
        super(message, InvalidJsonInputError.CODE, parent);
    }
}
export class InvalidRequestError extends ProviderError {
    static CODE = -32600;
    constructor(message = "Invalid request", parent) {
        super(message, InvalidRequestError.CODE, parent);
    }
}
// TODO: not used, should we remove it?
export class MethodNotFoundError extends ProviderError {
    static CODE = -32601;
    constructor(message = "Method not found", parent) {
        super(message, MethodNotFoundError.CODE, parent);
    }
}
export class InvalidArgumentsError extends ProviderError {
    static CODE = -32602;
    constructor(message = "Invalid params", parent) {
        super(message, InvalidArgumentsError.CODE, parent);
    }
}
export class InternalError extends ProviderError {
    static CODE = -32603;
    constructor(message = "Internal error", parent) {
        super(message, InternalError.CODE, parent);
    }
}
// TODO: not used, should we remove it?
export class TransactionExecutionError extends ProviderError {
    static CODE = -32003;
    constructor(message = "Transaction rejected", parent) {
        super(message, TransactionExecutionError.CODE, parent);
    }
}
// TODO: not used, should we remove it?
export class MethodNotSupportedError extends ProviderError {
    static CODE = -32004;
    constructor(message = "Method not supported", parent) {
        super(message, MethodNotSupportedError.CODE, parent);
    }
}
// TODO: not used, should we remove it?
export class InvalidResponseError extends ProviderError {
    static CODE = -32999;
    constructor(message = "Invalid response", parent) {
        super(message, InvalidResponseError.CODE, parent);
    }
}
export class UnknownError extends ProviderError {
    static CODE = -1;
    constructor(message = "Unknown error", parent) {
        super(message, UnknownError.CODE, parent);
    }
}
//# sourceMappingURL=provider-errors.js.map