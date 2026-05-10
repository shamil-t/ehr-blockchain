import { CustomError } from "../error.js";
export class PackageJsonNotFoundError extends CustomError {
    constructor(filePathOrUrl, cause) {
        super(`No package.json found for ${filePathOrUrl}`, cause);
    }
}
export class PackageJsonReadError extends CustomError {
    constructor(packageJsonPath, cause) {
        super(`Failed to read package.json at ${packageJsonPath}`, cause);
    }
}
//# sourceMappingURL=package.js.map