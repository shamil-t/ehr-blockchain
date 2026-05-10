import { CustomError } from "../error.js";
export declare class BaseMultiProcessMutexError extends CustomError {
    constructor(message: string, cause?: Error);
}
export declare class InvalidMultiProcessMutexPathError extends BaseMultiProcessMutexError {
    constructor(mutexPath: string);
}
export declare class MultiProcessMutexError extends BaseMultiProcessMutexError {
    constructor(lockPath: string, cause: Error);
}
export declare class MultiProcessMutexTimeoutError extends BaseMultiProcessMutexError {
    constructor(lockPath: string, timeoutMs: number);
}
export declare class StaleMultiProcessMutexError extends BaseMultiProcessMutexError {
    constructor(lockPath: string, ownerUid: number | undefined, cause: Error);
}
export declare class IncompatibleMultiProcessMutexError extends BaseMultiProcessMutexError {
    constructor(message: string);
}
export declare class IncompatibleHostnameMultiProcessMutexError extends IncompatibleMultiProcessMutexError {
    constructor(lockPath: string, foreignHostname: string, currentHostname: string);
}
export declare class IncompatiblePlatformMultiProcessMutexError extends IncompatibleMultiProcessMutexError {
    constructor(lockPath: string, foreignPlatform: string, currentPlatform: string);
}
export declare class IncompatibleUidMultiProcessMutexError extends IncompatibleMultiProcessMutexError {
    constructor(lockPath: string, foreignUid: number, currentUid: number);
}
//# sourceMappingURL=synchronization.d.ts.map