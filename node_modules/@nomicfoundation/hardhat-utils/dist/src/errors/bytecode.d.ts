import type { LibraryAddresses, LibraryLink } from "../internal/bytecode.js";
import { CustomError } from "../error.js";
export declare class InvalidLibraryAddressError extends CustomError {
    constructor(libraries: LibraryAddresses);
}
export declare class AmbiguousLibraryNameError extends CustomError {
    constructor(libraries: Record<string, LibraryLink[]>);
}
export declare class UnnecessaryLibraryError extends CustomError {
    constructor(libraries: string[]);
}
export declare class OverlappingLibrariesError extends CustomError {
    constructor(libraries: string[]);
}
export declare class MissingLibrariesError extends CustomError {
    constructor(libraries: string[]);
}
//# sourceMappingURL=bytecode.d.ts.map