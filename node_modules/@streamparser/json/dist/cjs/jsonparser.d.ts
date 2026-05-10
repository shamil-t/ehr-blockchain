import { type TokenizerOptions } from "./tokenizer.js";
import { type TokenParserOptions } from "./tokenparser.js";
import type { ParsedElementInfo } from "./utils/types/parsedElementInfo.js";
import type { ParsedTokenInfo } from "./utils/types/parsedTokenInfo.js";
export interface JSONParserOptions extends TokenizerOptions, TokenParserOptions {
}
export default class JSONParser {
    private tokenizer;
    private tokenParser;
    constructor(opts?: JSONParserOptions);
    get isEnded(): boolean;
    write(input: Iterable<number> | string): void;
    end(): void;
    set onToken(cb: (parsedTokenInfo: ParsedTokenInfo) => void);
    set onValue(cb: (parsedElementInfo: ParsedElementInfo) => void);
    set onError(cb: (err: Error) => void);
    set onEnd(cb: () => void);
}
//# sourceMappingURL=jsonparser.d.ts.map