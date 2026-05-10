export = SummarizerFactory;
declare class SummarizerFactory {
    constructor(coverageMap: any, defaultSummarizer?: string);
    _coverageMap: any;
    _defaultSummarizer: string;
    _initialList: any;
    _commonParent: any;
    get defaultSummarizer(): any;
    get flat(): ReportTree;
    _flat: ReportTree | undefined;
    _createPkg(): ReportTree;
    get pkg(): ReportTree;
    _pkg: ReportTree | undefined;
    _createNested(): ReportTree;
    get nested(): ReportTree;
    _nested: ReportTree | undefined;
}
declare class ReportTree extends BaseTree {
    constructor(root: any, childPrefix: any);
}
import { BaseTree } from "./tree.cjs";
//# sourceMappingURL=summarizer-factory.d.cts.map