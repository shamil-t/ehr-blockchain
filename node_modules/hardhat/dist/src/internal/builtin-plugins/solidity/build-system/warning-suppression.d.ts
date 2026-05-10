export declare const SUPPRESSED_WARNINGS: Array<{
    message: string;
    scope: "specific-file";
    filePath: string;
} | {
    message: string;
    scope: "test-files";
}>;
/**
 * Determines if a compiler warning should be suppressed based on the suppression rules.
 *
 * @param errorMessage - The formatted error message from the compiler
 * @param absoluteSolidityTestsPath - Absolute path to the Solidity test directory
 * @param absoluteProjectRoot - Absolute path to the project root
 * @returns true if the warning should be suppressed, false otherwise
 */
export declare function shouldSuppressWarning(errorMessage: string, absoluteSolidityTestsPath: string, absoluteProjectRoot: string): boolean;
//# sourceMappingURL=warning-suppression.d.ts.map