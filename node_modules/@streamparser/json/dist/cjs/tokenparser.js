"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenParserError = void 0;
const tokenType_js_1 = __importDefault(require("./utils/types/tokenType.js"));
// Parser States
var TokenParserState;
(function (TokenParserState) {
    TokenParserState[TokenParserState["VALUE"] = 0] = "VALUE";
    TokenParserState[TokenParserState["KEY"] = 1] = "KEY";
    TokenParserState[TokenParserState["COLON"] = 2] = "COLON";
    TokenParserState[TokenParserState["COMMA"] = 3] = "COMMA";
    TokenParserState[TokenParserState["ENDED"] = 4] = "ENDED";
    TokenParserState[TokenParserState["ERROR"] = 5] = "ERROR";
    TokenParserState[TokenParserState["SEPARATOR"] = 6] = "SEPARATOR";
})(TokenParserState || (TokenParserState = {}));
function TokenParserStateToString(state) {
    return ["VALUE", "KEY", "COLON", "COMMA", "ENDED", "ERROR", "SEPARATOR"][state];
}
const defaultOpts = {
    paths: undefined,
    keepStack: true,
    separator: undefined,
    emitPartialValues: false,
};
class TokenParserError extends Error {
    constructor(message) {
        super(message);
        // Typescript is broken. This is a workaround
        Object.setPrototypeOf(this, TokenParserError.prototype);
    }
}
exports.TokenParserError = TokenParserError;
class TokenParser {
    constructor(opts) {
        this.state = 0 /* TokenParserState.VALUE */;
        this.mode = undefined;
        this.key = undefined;
        this.value = undefined;
        this.stack = [];
        opts = Object.assign(Object.assign({}, defaultOpts), opts);
        if (opts.paths) {
            this.paths = opts.paths.map((path) => {
                if (path === undefined || path === "$*")
                    return undefined;
                if (!path.startsWith("$"))
                    throw new TokenParserError(`Invalid selector "${path}". Should start with "$".`);
                const pathParts = path.split(".").slice(1);
                if (pathParts.includes(""))
                    throw new TokenParserError(`Invalid selector "${path}". ".." syntax not supported.`);
                return pathParts;
            });
        }
        this.keepStack = opts.keepStack || false;
        this.separator = opts.separator;
        if (!opts.emitPartialValues) {
            this.emitPartial = () => { };
        }
    }
    shouldEmit() {
        if (!this.paths)
            return true;
        return this.paths.some((path) => {
            var _a;
            if (path === undefined)
                return true;
            if (path.length !== this.stack.length)
                return false;
            for (let i = 0; i < path.length - 1; i++) {
                const selector = path[i];
                const key = this.stack[i + 1].key;
                if (selector === "*")
                    continue;
                if (selector !== (key === null || key === void 0 ? void 0 : key.toString()))
                    return false;
            }
            const selector = path[path.length - 1];
            if (selector === "*")
                return true;
            return selector === ((_a = this.key) === null || _a === void 0 ? void 0 : _a.toString());
        });
    }
    push() {
        this.stack.push({
            key: this.key,
            value: this.value,
            mode: this.mode,
            emit: this.shouldEmit(),
        });
    }
    pop() {
        const value = this.value;
        let emit;
        ({
            key: this.key,
            value: this.value,
            mode: this.mode,
            emit,
        } = this.stack.pop());
        this.state =
            this.mode !== undefined ? 3 /* TokenParserState.COMMA */ : 0 /* TokenParserState.VALUE */;
        this.emit(value, emit);
    }
    emit(value, emit) {
        if (!this.keepStack &&
            this.value &&
            this.stack.every((item) => !item.emit)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete this.value[this.key];
        }
        if (emit) {
            this.onValue({
                value: value,
                key: this.key,
                parent: this.value,
                stack: this.stack,
            });
        }
        if (this.stack.length === 0) {
            if (this.separator) {
                this.state = 6 /* TokenParserState.SEPARATOR */;
            }
            else if (this.separator === undefined) {
                this.end();
            }
            // else if separator === '', expect next JSON object.
        }
    }
    emitPartial(value) {
        if (!this.shouldEmit())
            return;
        if (this.state === 1 /* TokenParserState.KEY */) {
            this.onValue({
                value: undefined,
                key: value,
                parent: this.value,
                stack: this.stack,
                partial: true,
            });
            return;
        }
        this.onValue({
            value: value,
            key: this.key,
            parent: this.value,
            stack: this.stack,
            partial: true,
        });
    }
    get isEnded() {
        return this.state === 4 /* TokenParserState.ENDED */;
    }
    write({ token, value, partial, }) {
        try {
            if (partial) {
                this.emitPartial(value);
                return;
            }
            if (this.state === 0 /* TokenParserState.VALUE */) {
                if (token === tokenType_js_1.default.STRING ||
                    token === tokenType_js_1.default.NUMBER ||
                    token === tokenType_js_1.default.TRUE ||
                    token === tokenType_js_1.default.FALSE ||
                    token === tokenType_js_1.default.NULL) {
                    if (this.mode === 0 /* TokenParserMode.OBJECT */) {
                        this.value[this.key] = value;
                        this.state = 3 /* TokenParserState.COMMA */;
                    }
                    else if (this.mode === 1 /* TokenParserMode.ARRAY */) {
                        this.value.push(value);
                        this.state = 3 /* TokenParserState.COMMA */;
                    }
                    this.emit(value, this.shouldEmit());
                    return;
                }
                if (token === tokenType_js_1.default.LEFT_BRACE) {
                    this.push();
                    if (this.mode === 0 /* TokenParserMode.OBJECT */) {
                        this.value = this.value[this.key] = {};
                    }
                    else if (this.mode === 1 /* TokenParserMode.ARRAY */) {
                        const val = {};
                        this.value.push(val);
                        this.value = val;
                    }
                    else {
                        this.value = {};
                    }
                    this.mode = 0 /* TokenParserMode.OBJECT */;
                    this.state = 1 /* TokenParserState.KEY */;
                    this.key = undefined;
                    this.emitPartial();
                    return;
                }
                if (token === tokenType_js_1.default.LEFT_BRACKET) {
                    this.push();
                    if (this.mode === 0 /* TokenParserMode.OBJECT */) {
                        this.value = this.value[this.key] = [];
                    }
                    else if (this.mode === 1 /* TokenParserMode.ARRAY */) {
                        const val = [];
                        this.value.push(val);
                        this.value = val;
                    }
                    else {
                        this.value = [];
                    }
                    this.mode = 1 /* TokenParserMode.ARRAY */;
                    this.state = 0 /* TokenParserState.VALUE */;
                    this.key = 0;
                    this.emitPartial();
                    return;
                }
                if (this.mode === 1 /* TokenParserMode.ARRAY */ &&
                    token === tokenType_js_1.default.RIGHT_BRACKET &&
                    this.value.length === 0) {
                    this.pop();
                    return;
                }
            }
            if (this.state === 1 /* TokenParserState.KEY */) {
                if (token === tokenType_js_1.default.STRING) {
                    this.key = value;
                    this.state = 2 /* TokenParserState.COLON */;
                    this.emitPartial();
                    return;
                }
                if (token === tokenType_js_1.default.RIGHT_BRACE &&
                    Object.keys(this.value).length === 0) {
                    this.pop();
                    return;
                }
            }
            if (this.state === 2 /* TokenParserState.COLON */) {
                if (token === tokenType_js_1.default.COLON) {
                    this.state = 0 /* TokenParserState.VALUE */;
                    return;
                }
            }
            if (this.state === 3 /* TokenParserState.COMMA */) {
                if (token === tokenType_js_1.default.COMMA) {
                    if (this.mode === 1 /* TokenParserMode.ARRAY */) {
                        this.state = 0 /* TokenParserState.VALUE */;
                        this.key += 1;
                        return;
                    }
                    /* istanbul ignore else */
                    if (this.mode === 0 /* TokenParserMode.OBJECT */) {
                        this.state = 1 /* TokenParserState.KEY */;
                        return;
                    }
                }
                if ((token === tokenType_js_1.default.RIGHT_BRACE &&
                    this.mode === 0 /* TokenParserMode.OBJECT */) ||
                    (token === tokenType_js_1.default.RIGHT_BRACKET &&
                        this.mode === 1 /* TokenParserMode.ARRAY */)) {
                    this.pop();
                    return;
                }
            }
            if (this.state === 6 /* TokenParserState.SEPARATOR */) {
                if (token === tokenType_js_1.default.SEPARATOR && value === this.separator) {
                    this.state = 0 /* TokenParserState.VALUE */;
                    return;
                }
            }
            // Edge case in which the separator is just whitespace and it's found in the middle of the JSON
            if (token === tokenType_js_1.default.SEPARATOR &&
                this.state !== 6 /* TokenParserState.SEPARATOR */ &&
                Array.from(value)
                    .map((n) => n.charCodeAt(0))
                    .every((n) => n === 32 /* charset.SPACE */ ||
                    n === 10 /* charset.NEWLINE */ ||
                    n === 13 /* charset.CARRIAGE_RETURN */ ||
                    n === 9 /* charset.TAB */)) {
                // whitespace
                return;
            }
            throw new TokenParserError(`Unexpected ${tokenType_js_1.default[token]} (${JSON.stringify(value)}) in state ${TokenParserStateToString(this.state)}`);
        }
        catch (err) {
            this.error(err);
        }
    }
    error(err) {
        if (this.state !== 4 /* TokenParserState.ENDED */) {
            this.state = 5 /* TokenParserState.ERROR */;
        }
        this.onError(err);
    }
    end() {
        if ((this.state !== 0 /* TokenParserState.VALUE */ &&
            this.state !== 6 /* TokenParserState.SEPARATOR */) ||
            this.stack.length > 0) {
            this.error(new Error(`Parser ended in mid-parsing (state: ${TokenParserStateToString(this.state)}). Either not all the data was received or the data was invalid.`));
        }
        else {
            this.state = 4 /* TokenParserState.ENDED */;
            this.onEnd();
        }
    }
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    onValue(parsedElementInfo) {
        // Override me
        throw new TokenParserError('Can\'t emit data before the "onValue" callback has been set up.');
    }
    onError(err) {
        // Override me
        throw err;
    }
    onEnd() {
        // Override me
    }
}
exports.default = TokenParser;
//# sourceMappingURL=tokenparser.js.map