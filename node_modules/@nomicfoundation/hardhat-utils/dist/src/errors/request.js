import { CustomError } from "../error.js";
import { sanitizeUrl } from "../internal/request.js";
import { isObject } from "../lang.js";
export class RequestError extends CustomError {
    constructor(url, type, cause) {
        super(`Failed to make ${type} request to ${sanitizeUrl(url)}`, cause);
    }
}
export class DownloadError extends CustomError {
    constructor(url, cause) {
        super(`Failed to download file from ${sanitizeUrl(url)}`, cause);
    }
}
export class DispatcherError extends CustomError {
    constructor(message, cause) {
        super(`Failed to create dispatcher: ${message}`, cause);
    }
}
export class RequestTimeoutError extends CustomError {
    constructor(url, cause) {
        super(`Request to ${sanitizeUrl(url)} timed out`, cause);
    }
}
export class ConnectionRefusedError extends CustomError {
    constructor(url, cause) {
        super(`Connection to ${sanitizeUrl(url)} was refused`, cause);
    }
}
export class ResponseStatusCodeError extends CustomError {
    statusCode;
    headers;
    body;
    constructor(url, cause) {
        super(`Received an unexpected status code from ${sanitizeUrl(url)}`, cause);
        this.statusCode =
            "statusCode" in cause && typeof cause.statusCode === "number"
                ? cause.statusCode
                : -1;
        this.headers = this.#extractHeaders(cause);
        this.body = "body" in cause && isObject(cause.body) ? cause.body : null;
    }
    #extractHeaders(cause) {
        if ("headers" in cause) {
            const headers = cause.headers;
            if (Array.isArray(headers)) {
                return headers;
            }
            else if (this.#isValidHeaders(headers)) {
                return headers;
            }
        }
        return null;
    }
    #isValidHeaders(headers) {
        if (!isObject(headers)) {
            return false;
        }
        return Object.values(headers).every((header) => typeof header === "string" ||
            (Array.isArray(header) &&
                header.every((item) => typeof item === "string")) ||
            header === undefined);
    }
}
//# sourceMappingURL=request.js.map