/**
 * CoverageSummary provides a summary of code coverage . It exposes 4 properties,
 * `lines`, `statements`, `branches`, and `functions`. Each of these properties
 * is an object that has 4 keys `total`, `covered`, `skipped` and `pct`.
 * `pct` is a percentage number (0-100).
 */
export class CoverageSummary {
    /**
     * @constructor
     * @param {Object|CoverageSummary} [obj=undefined] an optional data object or
     * another coverage summary to initialize this object with.
     */
    constructor(obj?: Object | CoverageSummary);
    data: Object | undefined;
    /**
     * merges a second summary coverage object into this one
     * @param {CoverageSummary} obj - another coverage summary object
     */
    merge(obj: CoverageSummary): this;
    /**
     * returns a POJO that is JSON serializable. May be used to get the raw
     * summary object.
     */
    toJSON(): Object | undefined;
    /**
     * return true if summary has no lines of code
     */
    isEmpty(): boolean;
}
//# sourceMappingURL=coverage-summary.d.cts.map