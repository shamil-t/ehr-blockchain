import { CustomError } from "../error.js";
export declare class FileSystemAccessError extends CustomError {
}
export declare class FileNotFoundError extends CustomError {
    constructor(filePath: string, cause?: Error);
}
export declare class FileAlreadyExistsError extends CustomError {
    constructor(filePath: string, cause?: Error);
}
export declare class InvalidFileFormatError extends CustomError {
    constructor(filePath: string, cause: Error);
}
export declare class JsonSerializationError extends CustomError {
    constructor(filePath: string, cause: Error);
}
export declare class NotADirectoryError extends CustomError {
    constructor(filePath: string, cause: Error);
}
export declare class IsDirectoryError extends CustomError {
    constructor(filePath: string, cause: Error | undefined);
}
export declare class DirectoryNotEmptyError extends CustomError {
    constructor(filePath: string, cause: Error);
}
//# sourceMappingURL=fs.d.ts.map