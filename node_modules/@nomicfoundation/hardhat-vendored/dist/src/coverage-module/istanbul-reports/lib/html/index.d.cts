export = HtmlReport;
declare class HtmlReport extends ReportBase {
    constructor(opts: any);
    verbose: any;
    linkMapper: any;
    subdir: any;
    date: string;
    skipEmpty: any;
    getBreadcrumbHtml(node: any): string;
    fillTemplate(node: any, templateData: any, context: any): void;
    getTemplateData(): {
        datetime: string;
    };
    getWriter(context: any): any;
    onStart(root: any, context: any): void;
    onSummary(node: any, context: any): void;
    onDetail(node: any, context: any): void;
}
import ReportBase = require("../../../istanbul-lib-report/lib/report-base.cjs");
//# sourceMappingURL=index.d.cts.map