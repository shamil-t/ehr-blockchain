import type { ParsedTokenInfo } from "./utils/types/parsedTokenInfo.js";
import type { ParsedElementInfo } from "./utils/types/parsedElementInfo.js";
export interface TokenParserOptions {
    paths?: string[];
    keepStack?: boolean;
    separator?: string;
    emitPartialValues?: boolean;
}
export declare class TokenParserError extends Error {
    constructor(message: string);
}
export default class TokenParser {
    private readonly paths?;
    private readonly keepStack;
    private readonly separator?;
    private state;
    private mode;
    private key;
    private value;
    private stack;
    constructor(opts?: TokenParserOptions);
    private shouldEmit;
    private push;
    private pop;
    private emit;
    private emitPartial;
    get isEnded(): boolean;
    write({ token, value, partial, }: Omit<ParsedTokenInfo, "offset">): void;
    error(err: Error): void;
    end(): void;
    onValue(parsedElementInfo: ParsedElementInfo): void;
    onError(err: Error): void;
    onEnd(): void;
}
//# sourceMappingURL=tokenparser.d.ts.map