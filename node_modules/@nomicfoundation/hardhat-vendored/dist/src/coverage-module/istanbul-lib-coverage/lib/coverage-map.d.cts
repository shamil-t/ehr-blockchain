/** CoverageMap is a map of `FileCoverage` objects keyed by file paths. */
export class CoverageMap {
    /**
     * @constructor
     * @param {Object} [obj=undefined] obj A coverage map from which to initialize this
     * map's contents. This can be the raw global coverage object.
     */
    constructor(obj?: Object);
    data: any;
    /**
     * merges a second coverage map into this one
     * @param {CoverageMap} obj - a CoverageMap or its raw data. Coverage is merged
     *  correctly for the same files and additional file coverage keys are created
     *  as needed.
     */
    merge(obj: CoverageMap): void;
    /**
     * filter the coveragemap based on the callback provided
     * @param {Function (filename)} callback - Returns true if the path
     *  should be included in the coveragemap. False if it should be
     *  removed.
     */
    filter(callback: any): void;
    /**
     * returns a JSON-serializable POJO for this coverage map
     * @returns {Object}
     */
    toJSON(): Object;
    /**
     * returns an array for file paths for which this map has coverage
     * @returns {Array{string}} - array of files
     */
    files(): any[];
    /**
     * returns the file coverage for the specified file.
     * @param {String} file
     * @returns {FileCoverage}
     */
    fileCoverageFor(file: string): FileCoverage;
    addFileCoverage(fc: any): void;
    /**
     * returns the coverage summary for all the file coverage objects in this map.
     * @returns {CoverageSummary}
     */
    getCoverageSummary(): CoverageSummary;
}
import { FileCoverage } from "./file-coverage.cjs";
import { CoverageSummary } from "./coverage-summary.cjs";
//# sourceMappingURL=coverage-map.d.cts.map