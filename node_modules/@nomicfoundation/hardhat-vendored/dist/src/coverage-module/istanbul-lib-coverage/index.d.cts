import { CoverageSummary } from "./lib/coverage-summary.cjs";
import { CoverageMap } from "./lib/coverage-map.cjs";
import { FileCoverage } from "./lib/file-coverage.cjs";
/**
 * creates a coverage summary object
 * @param {Object} obj an argument with the same semantics
 *  as the one passed to the `CoverageSummary` constructor
 * @returns {CoverageSummary}
 */
export function createCoverageSummary(obj: Object): CoverageSummary;
/**
 * creates a CoverageMap object
 * @param {Object} obj optional - an argument with the same semantics
 *  as the one passed to the CoverageMap constructor.
 * @returns {CoverageMap}
 */
export function createCoverageMap(obj: Object): CoverageMap;
/**
 * creates a FileCoverage object
 * @param {Object} obj optional - an argument with the same semantics
 *  as the one passed to the FileCoverage constructor.
 * @returns {FileCoverage}
 */
export function createFileCoverage(obj: Object): FileCoverage;
export namespace classes {
    export { FileCoverage };
}
//# sourceMappingURL=index.d.cts.map