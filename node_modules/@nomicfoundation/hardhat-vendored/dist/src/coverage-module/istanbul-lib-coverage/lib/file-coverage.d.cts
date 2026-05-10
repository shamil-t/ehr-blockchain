/**
 * provides a read-only view of coverage for a single file.
 * The deep structure of this object is documented elsewhere. It has the following
 * properties:
 *
 * * `path` - the file path for which coverage is being tracked
 * * `statementMap` - map of statement locations keyed by statement index
 * * `fnMap` - map of function metadata keyed by function index
 * * `branchMap` - map of branch metadata keyed by branch index
 * * `s` - hit counts for statements
 * * `f` - hit count for functions
 * * `b` - hit count for branches
 */
export class FileCoverage {
    /**
     * @constructor
     * @param {Object|FileCoverage|String} pathOrObj is a string that initializes
     * and empty coverage object with the specified file path or a data object that
     * has all the required properties for a file coverage object.
     */
    constructor(pathOrObj: Object | FileCoverage | string, reportLogic?: boolean);
    data: Object | undefined;
    /**
     * returns computed line coverage from statement coverage.
     * This is a map of hits keyed by line number in the source.
     */
    getLineCoverage(): any;
    /**
     * returns an array of uncovered line numbers.
     * @returns {Array} an array of line numbers for which no hits have been
     *  collected.
     */
    getUncoveredLines(): any[];
    /**
     * returns a map of branch coverage by source line number.
     * @returns {Object} an object keyed by line number. Each object
     * has a `covered`, `total` and `coverage` (percentage) property.
     */
    getBranchCoverageByLine(): Object;
    /**
     * return a JSON-serializable POJO for this file coverage object
     */
    toJSON(): Object | undefined;
    /**
     * merges a second coverage object into this one, updating hit counts
     * @param {FileCoverage} other - the coverage object to be merged into this one.
     *  Note that the other object should have the same structure as this one (same file).
     */
    merge(other: FileCoverage): void;
    computeSimpleTotals(property: any): {
        total: number;
        covered: number;
        skipped: number;
    };
    computeBranchTotals(property: any): {
        total: number;
        covered: number;
        skipped: number;
    };
    /**
     * resets hit counts for all statements, functions and branches
     * in this coverage object resulting in zero coverage.
     */
    resetHits(): void;
    /**
     * returns a CoverageSummary for this file coverage object
     * @returns {CoverageSummary}
     */
    toSummary(): CoverageSummary;
}
export function findNearestContainer(item: any, map: any): string | null;
export function addHits(aHits: any, bHits: any): number | any[] | null;
export function addNearestContainerHits(item: any, itemHits: any, map: any, mapHits: any): any;
import { CoverageSummary } from "./coverage-summary.cjs";
//# sourceMappingURL=file-coverage.d.cts.map