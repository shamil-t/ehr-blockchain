import Context = require("./lib/context.cjs");
import ReportBase = require("./lib/report-base.cjs");
/**
 * returns a reporting context for the supplied options
 * @param {Object} [opts=null] opts
 * @returns {Context}
 */
export declare function createContext(opts?: Object): Context;
/**
 * returns the default watermarks that would be used when not
 * overridden
 * @returns {Object} an object with `statements`, `functions`, `branches`,
 *  and `line` keys. Each value is a 2 element array that has the low and
 *  high watermark as percentages.
 */
export declare function getDefaultWatermarks(): Object;
export { ReportBase };
//# sourceMappingURL=index.d.cts.map