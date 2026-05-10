export = InsertionText;
declare function InsertionText(text: any, consumeBlanks: any): void;
declare class InsertionText {
    constructor(text: any, consumeBlanks: any);
    text: any;
    origLength: any;
    offsets: any[];
    consumeBlanks: any;
    startPos: number;
    endPos: any;
    findFirstNonBlank(): number;
    findLastNonBlank(): any;
    originalLength(): any;
    insertAt(col: any, str: any, insertBefore: any, consumeBlanks: any): this;
    findOffset(pos: any, len: any, insertBefore: any): number;
    wrap(startPos: any, startText: any, endPos: any, endText: any, consumeBlanks: any): this;
    wrapLine(startText: any, endText: any): void;
    toString(): any;
}
//# sourceMappingURL=insertion-text.d.cts.map