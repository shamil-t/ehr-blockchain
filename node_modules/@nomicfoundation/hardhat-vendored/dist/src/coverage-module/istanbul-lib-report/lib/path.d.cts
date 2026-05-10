export = Path;
declare class Path {
    static compare(a: any, b: any): 0 | 1 | -1;
    constructor(strOrArray: any);
    v: any[];
    toString(): string;
    hasParent(): boolean;
    parent(): Path;
    elements(): any[];
    name(): any;
    contains(other: any): boolean;
    ancestorOf(other: any): any;
    descendantOf(other: any): boolean;
    commonPrefixPath(other: any): Path;
    get length(): any;
}
declare namespace Path {
    namespace tester {
        function setParserAndSep(p: any, sep: any): void;
        function reset(): void;
    }
}
//# sourceMappingURL=path.d.cts.map