import { CustomError } from "../error.js";
export class SubprocessFileNotFoundError extends CustomError {
    constructor(filePath) {
        super(`Cannot find the subprocess file to execute, invalid file path: ${filePath}`);
    }
}
export class SubprocessPathIsDirectoryError extends CustomError {
    constructor(path) {
        super(`The provided path is a directory, only files are accepted. Path: ${path}`);
    }
}
//# sourceMappingURL=subprocess.js.map