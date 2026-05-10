import { CustomError } from "../error.js";
export declare class PackageJsonNotFoundError extends CustomError {
    constructor(filePathOrUrl: string, cause?: Error);
}
export declare class PackageJsonReadError extends CustomError {
    constructor(packageJsonPath: string, cause?: Error);
}
//# sourceMappingURL=package.d.ts.map