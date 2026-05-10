import type { CoverageMetadata } from "./types.js";
/**
 * Processes the raw EDR coverage information for a file and returns the executed and
 * non-executed statements and lines.
 *
 * @param fileContent The original file content being analyzed
 * @param metadata Coverage metadata received from EDR for this file
 * @param hitTags The coverage tags recorded as executed during the test run
 * for this specific file.
 *
 * @returns An object containing:
 * - statements: the executed and not-executed statements
 * - lines: the executed and not-executed line numbers
 */
export declare function getProcessedCoverageInfo(fileContent: string, metadata: CoverageMetadata, hitTags: Set<string>): {
    lines: {
        executed: Map<number, string>;
        unexecuted: Map<number, string>;
    };
};
//# sourceMappingURL=process-coverage.d.ts.map