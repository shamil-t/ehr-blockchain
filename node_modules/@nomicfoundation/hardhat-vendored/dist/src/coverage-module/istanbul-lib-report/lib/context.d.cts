export = Context;
/**
 * A reporting context that is passed to report implementations
 * @param {Object} [opts=null] opts options
 * @param {String} [opts.dir='coverage'] opts.dir the reporting directory
 * @param {Object} [opts.watermarks=null] opts.watermarks watermarks for
 *  statements, lines, branches and functions
 * @param {Function} [opts.sourceFinder=fsLookup] opts.sourceFinder a
 *  function that returns source code given a file path. Defaults to
 *  filesystem lookups based on path.
 * @constructor
 */
declare class Context {
    constructor(opts: any);
    dir: any;
    watermarks: {};
    sourceFinder: any;
    _summarizerFactory: SummarizerFactory;
    data: {};
    /**
     * returns a FileWriter implementation for reporting use. Also available
     * as the `writer` property on the context.
     * @returns {Writer}
     */
    getWriter(): Writer;
    /**
     * returns the source code for the specified file path or throws if
     * the source could not be found.
     * @param {String} filePath the file path as found in a file coverage object
     * @returns {String} the source code
     */
    getSource(filePath: string): string;
    /**
     * returns the coverage class given a coverage
     * types and a percentage value.
     * @param {String} type - the coverage type, one of `statements`, `functions`,
     *  `branches`, or `lines`
     * @param {Number} value - the percentage value
     * @returns {String} one of `high`, `medium` or `low`
     */
    classForPercent(type: string, value: number): string;
    /**
     * returns an XML writer for the supplied content writer
     * @param {ContentWriter} contentWriter the content writer to which the returned XML writer
     *  writes data
     * @returns {XMLWriter}
     */
    getXMLWriter(contentWriter: ContentWriter): XMLWriter;
    /**
     * returns a full visitor given a partial one.
     * @param {Object} partialVisitor a partial visitor only having the functions of
     *  interest to the caller. These functions are called with a scope that is the
     *  supplied object.
     * @returns {Visitor}
     */
    getVisitor(partialVisitor: Object): Visitor;
    getTree(name?: string): any;
    get writer(): any;
}
import SummarizerFactory = require("./summarizer-factory.cjs");
import XMLWriter = require("./xml-writer.cjs");
//# sourceMappingURL=context.d.cts.map