import type UndiciT from "undici";
import { CustomError } from "../error.js";
export declare class RequestError extends CustomError {
    constructor(url: string, type: UndiciT.Dispatcher.HttpMethod, cause?: Error);
}
export declare class DownloadError extends CustomError {
    constructor(url: string, cause?: Error);
}
export declare class DispatcherError extends CustomError {
    constructor(message: string, cause?: Error);
}
export declare class RequestTimeoutError extends CustomError {
    constructor(url: string, cause?: Error);
}
export declare class ConnectionRefusedError extends CustomError {
    constructor(url: string, cause?: Error);
}
export declare class ResponseStatusCodeError extends CustomError {
    #private;
    readonly statusCode: number;
    readonly headers: string[] | Record<string, string | string[] | undefined> | null;
    readonly body: null | Record<string, any> | string;
    constructor(url: string, cause: Error);
}
//# sourceMappingURL=request.d.ts.map