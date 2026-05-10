/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as chars from '../chars';
import { ParseError, ParseLocation, ParseSourceFile, ParseSourceSpan } from '../parse_util';
import { NAMED_ENTITIES } from './entities';
import { DEFAULT_INTERPOLATION_CONFIG } from './interpolation_config';
import { TagContentType } from './tags';
export class TokenError extends ParseError {
    constructor(errorMsg, tokenType, span) {
        super(span, errorMsg);
        this.tokenType = tokenType;
    }
}
export class TokenizeResult {
    constructor(tokens, errors, nonNormalizedIcuExpressions) {
        this.tokens = tokens;
        this.errors = errors;
        this.nonNormalizedIcuExpressions = nonNormalizedIcuExpressions;
    }
}
export function tokenize(source, url, getTagDefinition, options = {}) {
    const tokenizer = new _Tokenizer(new ParseSourceFile(source, url), getTagDefinition, options);
    tokenizer.tokenize();
    return new TokenizeResult(mergeTextTokens(tokenizer.tokens), tokenizer.errors, tokenizer.nonNormalizedIcuExpressions);
}
const _CR_OR_CRLF_REGEXP = /\r\n?/g;
function _unexpectedCharacterErrorMsg(charCode) {
    const char = charCode === chars.$EOF ? 'EOF' : String.fromCharCode(charCode);
    return `Unexpected character "${char}"`;
}
function _unknownEntityErrorMsg(entitySrc) {
    return `Unknown entity "${entitySrc}" - use the "&#<decimal>;" or  "&#x<hex>;" syntax`;
}
function _unparsableEntityErrorMsg(type, entityStr) {
    return `Unable to parse entity "${entityStr}" - ${type} character reference entities must end with ";"`;
}
var CharacterReferenceType;
(function (CharacterReferenceType) {
    CharacterReferenceType["HEX"] = "hexadecimal";
    CharacterReferenceType["DEC"] = "decimal";
})(CharacterReferenceType || (CharacterReferenceType = {}));
class _ControlFlowError {
    constructor(error) {
        this.error = error;
    }
}
// See https://www.w3.org/TR/html51/syntax.html#writing-html-documents
class _Tokenizer {
    /**
     * @param _file The html source file being tokenized.
     * @param _getTagDefinition A function that will retrieve a tag definition for a given tag name.
     * @param options Configuration of the tokenization.
     */
    constructor(_file, _getTagDefinition, options) {
        this._getTagDefinition = _getTagDefinition;
        this._currentTokenStart = null;
        this._currentTokenType = null;
        this._expansionCaseStack = [];
        this._inInterpolation = false;
        this.tokens = [];
        this.errors = [];
        this.nonNormalizedIcuExpressions = [];
        this._tokenizeIcu = options.tokenizeExpansionForms || false;
        this._interpolationConfig = options.interpolationConfig || DEFAULT_INTERPOLATION_CONFIG;
        this._leadingTriviaCodePoints =
            options.leadingTriviaChars && options.leadingTriviaChars.map(c => c.codePointAt(0) || 0);
        const range = options.range || { endPos: _file.content.length, startPos: 0, startLine: 0, startCol: 0 };
        this._cursor = options.escapedString ? new EscapedCharacterCursor(_file, range) :
            new PlainCharacterCursor(_file, range);
        this._preserveLineEndings = options.preserveLineEndings || false;
        this._i18nNormalizeLineEndingsInICUs = options.i18nNormalizeLineEndingsInICUs || false;
        this._tokenizeBlocks = options.tokenizeBlocks || false;
        try {
            this._cursor.init();
        }
        catch (e) {
            this.handleError(e);
        }
    }
    _processCarriageReturns(content) {
        if (this._preserveLineEndings) {
            return content;
        }
        // https://www.w3.org/TR/html51/syntax.html#preprocessing-the-input-stream
        // In order to keep the original position in the source, we can not
        // pre-process it.
        // Instead CRs are processed right before instantiating the tokens.
        return content.replace(_CR_OR_CRLF_REGEXP, '\n');
    }
    tokenize() {
        while (this._cursor.peek() !== chars.$EOF) {
            const start = this._cursor.clone();
            try {
                if (this._attemptCharCode(chars.$LT)) {
                    if (this._attemptCharCode(chars.$BANG)) {
                        if (this._attemptCharCode(chars.$LBRACKET)) {
                            this._consumeCdata(start);
                        }
                        else if (this._attemptCharCode(chars.$MINUS)) {
                            this._consumeComment(start);
                        }
                        else {
                            this._consumeDocType(start);
                        }
                    }
                    else if (this._attemptCharCode(chars.$SLASH)) {
                        this._consumeTagClose(start);
                    }
                    else {
                        this._consumeTagOpen(start);
                    }
                }
                else if (this._tokenizeBlocks && this._attemptStr('{#')) {
                    this._consumeBlockGroupOpen(start);
                }
                else if (this._tokenizeBlocks && this._attemptStr('{/')) {
                    this._consumeBlockGroupClose(start);
                }
                else if (this._tokenizeBlocks && this._attemptStr('{:')) {
                    this._consumeBlock(start);
                }
                else if (!(this._tokenizeIcu && this._tokenizeExpansionForm())) {
                    // In (possibly interpolated) text the end of the text is given by `isTextEnd()`, while
                    // the premature end of an interpolation is given by the start of a new HTML element.
                    this._consumeWithInterpolation(5 /* TokenType.TEXT */, 8 /* TokenType.INTERPOLATION */, () => this._isTextEnd(), () => this._isTagStart());
                }
            }
            catch (e) {
                this.handleError(e);
            }
        }
        this._beginToken(24 /* TokenType.EOF */);
        this._endToken([]);
    }
    _consumeBlockGroupOpen(start) {
        this._beginToken(25 /* TokenType.BLOCK_GROUP_OPEN_START */, start);
        const nameCursor = this._cursor.clone();
        this._attemptCharCodeUntilFn(code => !isBlockNameChar(code));
        this._endToken([this._cursor.getChars(nameCursor)]);
        this._consumeBlockParameters();
        this._beginToken(26 /* TokenType.BLOCK_GROUP_OPEN_END */);
        this._requireCharCode(chars.$RBRACE);
        this._endToken([]);
    }
    _consumeBlockGroupClose(start) {
        this._beginToken(27 /* TokenType.BLOCK_GROUP_CLOSE */, start);
        const nameCursor = this._cursor.clone();
        this._attemptCharCodeUntilFn(code => !isBlockNameChar(code));
        const name = this._cursor.getChars(nameCursor);
        this._requireCharCode(chars.$RBRACE);
        this._endToken([name]);
    }
    _consumeBlock(start) {
        this._beginToken(29 /* TokenType.BLOCK_OPEN_START */, start);
        const nameCursor = this._cursor.clone();
        this._attemptCharCodeUntilFn(code => !isBlockNameChar(code));
        this._endToken([this._cursor.getChars(nameCursor)]);
        this._consumeBlockParameters();
        this._beginToken(30 /* TokenType.BLOCK_OPEN_END */);
        this._requireCharCode(chars.$RBRACE);
        this._endToken([]);
    }
    _consumeBlockParameters() {
        // Trim the whitespace until the first parameter.
        this._attemptCharCodeUntilFn(isBlockParameterChar);
        while (this._cursor.peek() !== chars.$RBRACE && this._cursor.peek() !== chars.$EOF) {
            this._beginToken(28 /* TokenType.BLOCK_PARAMETER */);
            const start = this._cursor.clone();
            let inQuote = null;
            let openBraces = 0;
            // Consume the parameter until the next semicolon or brace.
            // Note that we skip over semicolons/braces inside of strings.
            while ((this._cursor.peek() !== chars.$SEMICOLON && this._cursor.peek() !== chars.$EOF) ||
                inQuote !== null) {
                const char = this._cursor.peek();
                // Skip to the next character if it was escaped.
                if (char === chars.$BACKSLASH) {
                    this._cursor.advance();
                }
                else if (char === inQuote) {
                    inQuote = null;
                }
                else if (inQuote === null && chars.isQuote(char)) {
                    inQuote = char;
                }
                else if (char === chars.$LBRACE && inQuote === null) {
                    openBraces++;
                }
                else if (char === chars.$RBRACE && inQuote === null) {
                    if (openBraces === 0) {
                        break;
                    }
                    else if (openBraces > 0) {
                        openBraces--;
                    }
                }
                this._cursor.advance();
            }
            this._endToken([this._cursor.getChars(start)]);
            // Skip to the next parameter.
            this._attemptCharCodeUntilFn(isBlockParameterChar);
        }
    }
    /**
     * @returns whether an ICU token has been created
     * @internal
     */
    _tokenizeExpansionForm() {
        if (this.isExpansionFormStart()) {
            this._consumeExpansionFormStart();
            return true;
        }
        if (isExpansionCaseStart(this._cursor.peek()) && this._isInExpansionForm()) {
            this._consumeExpansionCaseStart();
            return true;
        }
        if (this._cursor.peek() === chars.$RBRACE) {
            if (this._isInExpansionCase()) {
                this._consumeExpansionCaseEnd();
                return true;
            }
            if (this._isInExpansionForm()) {
                this._consumeExpansionFormEnd();
                return true;
            }
        }
        return false;
    }
    _beginToken(type, start = this._cursor.clone()) {
        this._currentTokenStart = start;
        this._currentTokenType = type;
    }
    _endToken(parts, end) {
        if (this._currentTokenStart === null) {
            throw new TokenError('Programming error - attempted to end a token when there was no start to the token', this._currentTokenType, this._cursor.getSpan(end));
        }
        if (this._currentTokenType === null) {
            throw new TokenError('Programming error - attempted to end a token which has no token type', null, this._cursor.getSpan(this._currentTokenStart));
        }
        const token = {
            type: this._currentTokenType,
            parts,
            sourceSpan: (end ?? this._cursor).getSpan(this._currentTokenStart, this._leadingTriviaCodePoints),
        };
        this.tokens.push(token);
        this._currentTokenStart = null;
        this._currentTokenType = null;
        return token;
    }
    _createError(msg, span) {
        if (this._isInExpansionForm()) {
            msg += ` (Do you have an unescaped "{" in your template? Use "{{ '{' }}") to escape it.)`;
        }
        const error = new TokenError(msg, this._currentTokenType, span);
        this._currentTokenStart = null;
        this._currentTokenType = null;
        return new _ControlFlowError(error);
    }
    handleError(e) {
        if (e instanceof CursorError) {
            e = this._createError(e.msg, this._cursor.getSpan(e.cursor));
        }
        if (e instanceof _ControlFlowError) {
            this.errors.push(e.error);
        }
        else {
            throw e;
        }
    }
    _attemptCharCode(charCode) {
        if (this._cursor.peek() === charCode) {
            this._cursor.advance();
            return true;
        }
        return false;
    }
    _attemptCharCodeCaseInsensitive(charCode) {
        if (compareCharCodeCaseInsensitive(this._cursor.peek(), charCode)) {
            this._cursor.advance();
            return true;
        }
        return false;
    }
    _requireCharCode(charCode) {
        const location = this._cursor.clone();
        if (!this._attemptCharCode(charCode)) {
            throw this._createError(_unexpectedCharacterErrorMsg(this._cursor.peek()), this._cursor.getSpan(location));
        }
    }
    _attemptStr(chars) {
        const len = chars.length;
        if (this._cursor.charsLeft() < len) {
            return false;
        }
        const initialPosition = this._cursor.clone();
        for (let i = 0; i < len; i++) {
            if (!this._attemptCharCode(chars.charCodeAt(i))) {
                // If attempting to parse the string fails, we want to reset the parser
                // to where it was before the attempt
                this._cursor = initialPosition;
                return false;
            }
        }
        return true;
    }
    _attemptStrCaseInsensitive(chars) {
        for (let i = 0; i < chars.length; i++) {
            if (!this._attemptCharCodeCaseInsensitive(chars.charCodeAt(i))) {
                return false;
            }
        }
        return true;
    }
    _requireStr(chars) {
        const location = this._cursor.clone();
        if (!this._attemptStr(chars)) {
            throw this._createError(_unexpectedCharacterErrorMsg(this._cursor.peek()), this._cursor.getSpan(location));
        }
    }
    _attemptCharCodeUntilFn(predicate) {
        while (!predicate(this._cursor.peek())) {
            this._cursor.advance();
        }
    }
    _requireCharCodeUntilFn(predicate, len) {
        const start = this._cursor.clone();
        this._attemptCharCodeUntilFn(predicate);
        if (this._cursor.diff(start) < len) {
            throw this._createError(_unexpectedCharacterErrorMsg(this._cursor.peek()), this._cursor.getSpan(start));
        }
    }
    _attemptUntilChar(char) {
        while (this._cursor.peek() !== char) {
            this._cursor.advance();
        }
    }
    _readChar() {
        // Don't rely upon reading directly from `_input` as the actual char value
        // may have been generated from an escape sequence.
        const char = String.fromCodePoint(this._cursor.peek());
        this._cursor.advance();
        return char;
    }
    _consumeEntity(textTokenType) {
        this._beginToken(9 /* TokenType.ENCODED_ENTITY */);
        const start = this._cursor.clone();
        this._cursor.advance();
        if (this._attemptCharCode(chars.$HASH)) {
            const isHex = this._attemptCharCode(chars.$x) || this._attemptCharCode(chars.$X);
            const codeStart = this._cursor.clone();
            this._attemptCharCodeUntilFn(isDigitEntityEnd);
            if (this._cursor.peek() != chars.$SEMICOLON) {
                // Advance cursor to include the peeked character in the string provided to the error
                // message.
                this._cursor.advance();
                const entityType = isHex ? CharacterReferenceType.HEX : CharacterReferenceType.DEC;
                throw this._createError(_unparsableEntityErrorMsg(entityType, this._cursor.getChars(start)), this._cursor.getSpan());
            }
            const strNum = this._cursor.getChars(codeStart);
            this._cursor.advance();
            try {
                const charCode = parseInt(strNum, isHex ? 16 : 10);
                this._endToken([String.fromCharCode(charCode), this._cursor.getChars(start)]);
            }
            catch {
                throw this._createError(_unknownEntityErrorMsg(this._cursor.getChars(start)), this._cursor.getSpan());
            }
        }
        else {
            const nameStart = this._cursor.clone();
            this._attemptCharCodeUntilFn(isNamedEntityEnd);
            if (this._cursor.peek() != chars.$SEMICOLON) {
                // No semicolon was found so abort the encoded entity token that was in progress, and treat
                // this as a text token
                this._beginToken(textTokenType, start);
                this._cursor = nameStart;
                this._endToken(['&']);
            }
            else {
                const name = this._cursor.getChars(nameStart);
                this._cursor.advance();
                const char = NAMED_ENTITIES[name];
                if (!char) {
                    throw this._createError(_unknownEntityErrorMsg(name), this._cursor.getSpan(start));
                }
                this._endToken([char, `&${name};`]);
            }
        }
    }
    _consumeRawText(consumeEntities, endMarkerPredicate) {
        this._beginToken(consumeEntities ? 6 /* TokenType.ESCAPABLE_RAW_TEXT */ : 7 /* TokenType.RAW_TEXT */);
        const parts = [];
        while (true) {
            const tagCloseStart = this._cursor.clone();
            const foundEndMarker = endMarkerPredicate();
            this._cursor = tagCloseStart;
            if (foundEndMarker) {
                break;
            }
            if (consumeEntities && this._cursor.peek() === chars.$AMPERSAND) {
                this._endToken([this._processCarriageReturns(parts.join(''))]);
                parts.length = 0;
                this._consumeEntity(6 /* TokenType.ESCAPABLE_RAW_TEXT */);
                this._beginToken(6 /* TokenType.ESCAPABLE_RAW_TEXT */);
            }
            else {
                parts.push(this._readChar());
            }
        }
        this._endToken([this._processCarriageReturns(parts.join(''))]);
    }
    _consumeComment(start) {
        this._beginToken(10 /* TokenType.COMMENT_START */, start);
        this._requireCharCode(chars.$MINUS);
        this._endToken([]);
        this._consumeRawText(false, () => this._attemptStr('-->'));
        this._beginToken(11 /* TokenType.COMMENT_END */);
        this._requireStr('-->');
        this._endToken([]);
    }
    _consumeCdata(start) {
        this._beginToken(12 /* TokenType.CDATA_START */, start);
        this._requireStr('CDATA[');
        this._endToken([]);
        this._consumeRawText(false, () => this._attemptStr(']]>'));
        this._beginToken(13 /* TokenType.CDATA_END */);
        this._requireStr(']]>');
        this._endToken([]);
    }
    _consumeDocType(start) {
        this._beginToken(18 /* TokenType.DOC_TYPE */, start);
        const contentStart = this._cursor.clone();
        this._attemptUntilChar(chars.$GT);
        const content = this._cursor.getChars(contentStart);
        this._cursor.advance();
        this._endToken([content]);
    }
    _consumePrefixAndName() {
        const nameOrPrefixStart = this._cursor.clone();
        let prefix = '';
        while (this._cursor.peek() !== chars.$COLON && !isPrefixEnd(this._cursor.peek())) {
            this._cursor.advance();
        }
        let nameStart;
        if (this._cursor.peek() === chars.$COLON) {
            prefix = this._cursor.getChars(nameOrPrefixStart);
            this._cursor.advance();
            nameStart = this._cursor.clone();
        }
        else {
            nameStart = nameOrPrefixStart;
        }
        this._requireCharCodeUntilFn(isNameEnd, prefix === '' ? 0 : 1);
        const name = this._cursor.getChars(nameStart);
        return [prefix, name];
    }
    _consumeTagOpen(start) {
        let tagName;
        let prefix;
        let openTagToken;
        try {
            if (!chars.isAsciiLetter(this._cursor.peek())) {
                throw this._createError(_unexpectedCharacterErrorMsg(this._cursor.peek()), this._cursor.getSpan(start));
            }
            openTagToken = this._consumeTagOpenStart(start);
            prefix = openTagToken.parts[0];
            tagName = openTagToken.parts[1];
            this._attemptCharCodeUntilFn(isNotWhitespace);
            while (this._cursor.peek() !== chars.$SLASH && this._cursor.peek() !== chars.$GT &&
                this._cursor.peek() !== chars.$LT && this._cursor.peek() !== chars.$EOF) {
                this._consumeAttributeName();
                this._attemptCharCodeUntilFn(isNotWhitespace);
                if (this._attemptCharCode(chars.$EQ)) {
                    this._attemptCharCodeUntilFn(isNotWhitespace);
                    this._consumeAttributeValue();
                }
                this._attemptCharCodeUntilFn(isNotWhitespace);
            }
            this._consumeTagOpenEnd();
        }
        catch (e) {
            if (e instanceof _ControlFlowError) {
                if (openTagToken) {
                    // We errored before we could close the opening tag, so it is incomplete.
                    openTagToken.type = 4 /* TokenType.INCOMPLETE_TAG_OPEN */;
                }
                else {
                    // When the start tag is invalid, assume we want a "<" as text.
                    // Back to back text tokens are merged at the end.
                    this._beginToken(5 /* TokenType.TEXT */, start);
                    this._endToken(['<']);
                }
                return;
            }
            throw e;
        }
        const contentTokenType = this._getTagDefinition(tagName).getContentType(prefix);
        if (contentTokenType === TagContentType.RAW_TEXT) {
            this._consumeRawTextWithTagClose(prefix, tagName, false);
        }
        else if (contentTokenType === TagContentType.ESCAPABLE_RAW_TEXT) {
            this._consumeRawTextWithTagClose(prefix, tagName, true);
        }
    }
    _consumeRawTextWithTagClose(prefix, tagName, consumeEntities) {
        this._consumeRawText(consumeEntities, () => {
            if (!this._attemptCharCode(chars.$LT))
                return false;
            if (!this._attemptCharCode(chars.$SLASH))
                return false;
            this._attemptCharCodeUntilFn(isNotWhitespace);
            if (!this._attemptStrCaseInsensitive(tagName))
                return false;
            this._attemptCharCodeUntilFn(isNotWhitespace);
            return this._attemptCharCode(chars.$GT);
        });
        this._beginToken(3 /* TokenType.TAG_CLOSE */);
        this._requireCharCodeUntilFn(code => code === chars.$GT, 3);
        this._cursor.advance(); // Consume the `>`
        this._endToken([prefix, tagName]);
    }
    _consumeTagOpenStart(start) {
        this._beginToken(0 /* TokenType.TAG_OPEN_START */, start);
        const parts = this._consumePrefixAndName();
        return this._endToken(parts);
    }
    _consumeAttributeName() {
        const attrNameStart = this._cursor.peek();
        if (attrNameStart === chars.$SQ || attrNameStart === chars.$DQ) {
            throw this._createError(_unexpectedCharacterErrorMsg(attrNameStart), this._cursor.getSpan());
        }
        this._beginToken(14 /* TokenType.ATTR_NAME */);
        const prefixAndName = this._consumePrefixAndName();
        this._endToken(prefixAndName);
    }
    _consumeAttributeValue() {
        if (this._cursor.peek() === chars.$SQ || this._cursor.peek() === chars.$DQ) {
            const quoteChar = this._cursor.peek();
            this._consumeQuote(quoteChar);
            // In an attribute then end of the attribute value and the premature end to an interpolation
            // are both triggered by the `quoteChar`.
            const endPredicate = () => this._cursor.peek() === quoteChar;
            this._consumeWithInterpolation(16 /* TokenType.ATTR_VALUE_TEXT */, 17 /* TokenType.ATTR_VALUE_INTERPOLATION */, endPredicate, endPredicate);
            this._consumeQuote(quoteChar);
        }
        else {
            const endPredicate = () => isNameEnd(this._cursor.peek());
            this._consumeWithInterpolation(16 /* TokenType.ATTR_VALUE_TEXT */, 17 /* TokenType.ATTR_VALUE_INTERPOLATION */, endPredicate, endPredicate);
        }
    }
    _consumeQuote(quoteChar) {
        this._beginToken(15 /* TokenType.ATTR_QUOTE */);
        this._requireCharCode(quoteChar);
        this._endToken([String.fromCodePoint(quoteChar)]);
    }
    _consumeTagOpenEnd() {
        const tokenType = this._attemptCharCode(chars.$SLASH) ? 2 /* TokenType.TAG_OPEN_END_VOID */ : 1 /* TokenType.TAG_OPEN_END */;
        this._beginToken(tokenType);
        this._requireCharCode(chars.$GT);
        this._endToken([]);
    }
    _consumeTagClose(start) {
        this._beginToken(3 /* TokenType.TAG_CLOSE */, start);
        this._attemptCharCodeUntilFn(isNotWhitespace);
        const prefixAndName = this._consumePrefixAndName();
        this._attemptCharCodeUntilFn(isNotWhitespace);
        this._requireCharCode(chars.$GT);
        this._endToken(prefixAndName);
    }
    _consumeExpansionFormStart() {
        this._beginToken(19 /* TokenType.EXPANSION_FORM_START */);
        this._requireCharCode(chars.$LBRACE);
        this._endToken([]);
        this._expansionCaseStack.push(19 /* TokenType.EXPANSION_FORM_START */);
        this._beginToken(7 /* TokenType.RAW_TEXT */);
        const condition = this._readUntil(chars.$COMMA);
        const normalizedCondition = this._processCarriageReturns(condition);
        if (this._i18nNormalizeLineEndingsInICUs) {
            // We explicitly want to normalize line endings for this text.
            this._endToken([normalizedCondition]);
        }
        else {
            // We are not normalizing line endings.
            const conditionToken = this._endToken([condition]);
            if (normalizedCondition !== condition) {
                this.nonNormalizedIcuExpressions.push(conditionToken);
            }
        }
        this._requireCharCode(chars.$COMMA);
        this._attemptCharCodeUntilFn(isNotWhitespace);
        this._beginToken(7 /* TokenType.RAW_TEXT */);
        const type = this._readUntil(chars.$COMMA);
        this._endToken([type]);
        this._requireCharCode(chars.$COMMA);
        this._attemptCharCodeUntilFn(isNotWhitespace);
    }
    _consumeExpansionCaseStart() {
        this._beginToken(20 /* TokenType.EXPANSION_CASE_VALUE */);
        const value = this._readUntil(chars.$LBRACE).trim();
        this._endToken([value]);
        this._attemptCharCodeUntilFn(isNotWhitespace);
        this._beginToken(21 /* TokenType.EXPANSION_CASE_EXP_START */);
        this._requireCharCode(chars.$LBRACE);
        this._endToken([]);
        this._attemptCharCodeUntilFn(isNotWhitespace);
        this._expansionCaseStack.push(21 /* TokenType.EXPANSION_CASE_EXP_START */);
    }
    _consumeExpansionCaseEnd() {
        this._beginToken(22 /* TokenType.EXPANSION_CASE_EXP_END */);
        this._requireCharCode(chars.$RBRACE);
        this._endToken([]);
        this._attemptCharCodeUntilFn(isNotWhitespace);
        this._expansionCaseStack.pop();
    }
    _consumeExpansionFormEnd() {
        this._beginToken(23 /* TokenType.EXPANSION_FORM_END */);
        this._requireCharCode(chars.$RBRACE);
        this._endToken([]);
        this._expansionCaseStack.pop();
    }
    /**
     * Consume a string that may contain interpolation expressions.
     *
     * The first token consumed will be of `tokenType` and then there will be alternating
     * `interpolationTokenType` and `tokenType` tokens until the `endPredicate()` returns true.
     *
     * If an interpolation token ends prematurely it will have no end marker in its `parts` array.
     *
     * @param textTokenType the kind of tokens to interleave around interpolation tokens.
     * @param interpolationTokenType the kind of tokens that contain interpolation.
     * @param endPredicate a function that should return true when we should stop consuming.
     * @param endInterpolation a function that should return true if there is a premature end to an
     *     interpolation expression - i.e. before we get to the normal interpolation closing marker.
     */
    _consumeWithInterpolation(textTokenType, interpolationTokenType, endPredicate, endInterpolation) {
        this._beginToken(textTokenType);
        const parts = [];
        while (!endPredicate()) {
            const current = this._cursor.clone();
            if (this._interpolationConfig && this._attemptStr(this._interpolationConfig.start)) {
                this._endToken([this._processCarriageReturns(parts.join(''))], current);
                parts.length = 0;
                this._consumeInterpolation(interpolationTokenType, current, endInterpolation);
                this._beginToken(textTokenType);
            }
            else if (this._cursor.peek() === chars.$AMPERSAND) {
                this._endToken([this._processCarriageReturns(parts.join(''))]);
                parts.length = 0;
                this._consumeEntity(textTokenType);
                this._beginToken(textTokenType);
            }
            else {
                parts.push(this._readChar());
            }
        }
        // It is possible that an interpolation was started but not ended inside this text token.
        // Make sure that we reset the state of the lexer correctly.
        this._inInterpolation = false;
        this._endToken([this._processCarriageReturns(parts.join(''))]);
    }
    /**
     * Consume a block of text that has been interpreted as an Angular interpolation.
     *
     * @param interpolationTokenType the type of the interpolation token to generate.
     * @param interpolationStart a cursor that points to the start of this interpolation.
     * @param prematureEndPredicate a function that should return true if the next characters indicate
     *     an end to the interpolation before its normal closing marker.
     */
    _consumeInterpolation(interpolationTokenType, interpolationStart, prematureEndPredicate) {
        const parts = [];
        this._beginToken(interpolationTokenType, interpolationStart);
        parts.push(this._interpolationConfig.start);
        // Find the end of the interpolation, ignoring content inside quotes.
        const expressionStart = this._cursor.clone();
        let inQuote = null;
        let inComment = false;
        while (this._cursor.peek() !== chars.$EOF &&
            (prematureEndPredicate === null || !prematureEndPredicate())) {
            const current = this._cursor.clone();
            if (this._isTagStart()) {
                // We are starting what looks like an HTML element in the middle of this interpolation.
                // Reset the cursor to before the `<` character and end the interpolation token.
                // (This is actually wrong but here for backward compatibility).
                this._cursor = current;
                parts.push(this._getProcessedChars(expressionStart, current));
                this._endToken(parts);
                return;
            }
            if (inQuote === null) {
                if (this._attemptStr(this._interpolationConfig.end)) {
                    // We are not in a string, and we hit the end interpolation marker
                    parts.push(this._getProcessedChars(expressionStart, current));
                    parts.push(this._interpolationConfig.end);
                    this._endToken(parts);
                    return;
                }
                else if (this._attemptStr('//')) {
                    // Once we are in a comment we ignore any quotes
                    inComment = true;
                }
            }
            const char = this._cursor.peek();
            this._cursor.advance();
            if (char === chars.$BACKSLASH) {
                // Skip the next character because it was escaped.
                this._cursor.advance();
            }
            else if (char === inQuote) {
                // Exiting the current quoted string
                inQuote = null;
            }
            else if (!inComment && inQuote === null && chars.isQuote(char)) {
                // Entering a new quoted string
                inQuote = char;
            }
        }
        // We hit EOF without finding a closing interpolation marker
        parts.push(this._getProcessedChars(expressionStart, this._cursor));
        this._endToken(parts);
    }
    _getProcessedChars(start, end) {
        return this._processCarriageReturns(end.getChars(start));
    }
    _isTextEnd() {
        if (this._isTagStart() || this._isBlockStart() || this._cursor.peek() === chars.$EOF) {
            return true;
        }
        if (this._tokenizeIcu && !this._inInterpolation) {
            if (this.isExpansionFormStart()) {
                // start of an expansion form
                return true;
            }
            if (this._cursor.peek() === chars.$RBRACE && this._isInExpansionCase()) {
                // end of and expansion case
                return true;
            }
        }
        return false;
    }
    /**
     * Returns true if the current cursor is pointing to the start of a tag
     * (opening/closing/comments/cdata/etc).
     */
    _isTagStart() {
        if (this._cursor.peek() === chars.$LT) {
            // We assume that `<` followed by whitespace is not the start of an HTML element.
            const tmp = this._cursor.clone();
            tmp.advance();
            // If the next character is alphabetic, ! nor / then it is a tag start
            const code = tmp.peek();
            if ((chars.$a <= code && code <= chars.$z) || (chars.$A <= code && code <= chars.$Z) ||
                code === chars.$SLASH || code === chars.$BANG) {
                return true;
            }
        }
        return false;
    }
    _isBlockStart() {
        if (this._tokenizeBlocks && this._cursor.peek() === chars.$LBRACE) {
            const tmp = this._cursor.clone();
            // Check that the cursor is on a `{#`, `{/` or `{:`.
            tmp.advance();
            const next = tmp.peek();
            if (next !== chars.$BANG && next !== chars.$SLASH && next !== chars.$COLON) {
                return false;
            }
            // If it is, also verify that the next character is a valid block identifier.
            tmp.advance();
            if (isBlockNameChar(tmp.peek())) {
                return true;
            }
        }
        return false;
    }
    _readUntil(char) {
        const start = this._cursor.clone();
        this._attemptUntilChar(char);
        return this._cursor.getChars(start);
    }
    _isInExpansionCase() {
        return this._expansionCaseStack.length > 0 &&
            this._expansionCaseStack[this._expansionCaseStack.length - 1] ===
                21 /* TokenType.EXPANSION_CASE_EXP_START */;
    }
    _isInExpansionForm() {
        return this._expansionCaseStack.length > 0 &&
            this._expansionCaseStack[this._expansionCaseStack.length - 1] ===
                19 /* TokenType.EXPANSION_FORM_START */;
    }
    isExpansionFormStart() {
        if (this._cursor.peek() !== chars.$LBRACE) {
            return false;
        }
        if (this._interpolationConfig) {
            const start = this._cursor.clone();
            const isInterpolation = this._attemptStr(this._interpolationConfig.start);
            this._cursor = start;
            return !isInterpolation;
        }
        return true;
    }
}
function isNotWhitespace(code) {
    return !chars.isWhitespace(code) || code === chars.$EOF;
}
function isNameEnd(code) {
    return chars.isWhitespace(code) || code === chars.$GT || code === chars.$LT ||
        code === chars.$SLASH || code === chars.$SQ || code === chars.$DQ || code === chars.$EQ ||
        code === chars.$EOF;
}
function isPrefixEnd(code) {
    return (code < chars.$a || chars.$z < code) && (code < chars.$A || chars.$Z < code) &&
        (code < chars.$0 || code > chars.$9);
}
function isDigitEntityEnd(code) {
    return code === chars.$SEMICOLON || code === chars.$EOF || !chars.isAsciiHexDigit(code);
}
function isNamedEntityEnd(code) {
    return code === chars.$SEMICOLON || code === chars.$EOF || !chars.isAsciiLetter(code);
}
function isExpansionCaseStart(peek) {
    return peek !== chars.$RBRACE;
}
function compareCharCodeCaseInsensitive(code1, code2) {
    return toUpperCaseCharCode(code1) === toUpperCaseCharCode(code2);
}
function toUpperCaseCharCode(code) {
    return code >= chars.$a && code <= chars.$z ? code - chars.$a + chars.$A : code;
}
function isBlockNameChar(code) {
    return chars.isAsciiLetter(code) || chars.isDigit(code) || code === chars.$_;
}
function isBlockParameterChar(code) {
    return code !== chars.$SEMICOLON && isNotWhitespace(code);
}
function mergeTextTokens(srcTokens) {
    const dstTokens = [];
    let lastDstToken = undefined;
    for (let i = 0; i < srcTokens.length; i++) {
        const token = srcTokens[i];
        if ((lastDstToken && lastDstToken.type === 5 /* TokenType.TEXT */ && token.type === 5 /* TokenType.TEXT */) ||
            (lastDstToken && lastDstToken.type === 16 /* TokenType.ATTR_VALUE_TEXT */ &&
                token.type === 16 /* TokenType.ATTR_VALUE_TEXT */)) {
            lastDstToken.parts[0] += token.parts[0];
            lastDstToken.sourceSpan.end = token.sourceSpan.end;
        }
        else {
            lastDstToken = token;
            dstTokens.push(lastDstToken);
        }
    }
    return dstTokens;
}
class PlainCharacterCursor {
    constructor(fileOrCursor, range) {
        if (fileOrCursor instanceof PlainCharacterCursor) {
            this.file = fileOrCursor.file;
            this.input = fileOrCursor.input;
            this.end = fileOrCursor.end;
            const state = fileOrCursor.state;
            // Note: avoid using `{...fileOrCursor.state}` here as that has a severe performance penalty.
            // In ES5 bundles the object spread operator is translated into the `__assign` helper, which
            // is not optimized by VMs as efficiently as a raw object literal. Since this constructor is
            // called in tight loops, this difference matters.
            this.state = {
                peek: state.peek,
                offset: state.offset,
                line: state.line,
                column: state.column,
            };
        }
        else {
            if (!range) {
                throw new Error('Programming error: the range argument must be provided with a file argument.');
            }
            this.file = fileOrCursor;
            this.input = fileOrCursor.content;
            this.end = range.endPos;
            this.state = {
                peek: -1,
                offset: range.startPos,
                line: range.startLine,
                column: range.startCol,
            };
        }
    }
    clone() {
        return new PlainCharacterCursor(this);
    }
    peek() {
        return this.state.peek;
    }
    charsLeft() {
        return this.end - this.state.offset;
    }
    diff(other) {
        return this.state.offset - other.state.offset;
    }
    advance() {
        this.advanceState(this.state);
    }
    init() {
        this.updatePeek(this.state);
    }
    getSpan(start, leadingTriviaCodePoints) {
        start = start || this;
        let fullStart = start;
        if (leadingTriviaCodePoints) {
            while (this.diff(start) > 0 && leadingTriviaCodePoints.indexOf(start.peek()) !== -1) {
                if (fullStart === start) {
                    start = start.clone();
                }
                start.advance();
            }
        }
        const startLocation = this.locationFromCursor(start);
        const endLocation = this.locationFromCursor(this);
        const fullStartLocation = fullStart !== start ? this.locationFromCursor(fullStart) : startLocation;
        return new ParseSourceSpan(startLocation, endLocation, fullStartLocation);
    }
    getChars(start) {
        return this.input.substring(start.state.offset, this.state.offset);
    }
    charAt(pos) {
        return this.input.charCodeAt(pos);
    }
    advanceState(state) {
        if (state.offset >= this.end) {
            this.state = state;
            throw new CursorError('Unexpected character "EOF"', this);
        }
        const currentChar = this.charAt(state.offset);
        if (currentChar === chars.$LF) {
            state.line++;
            state.column = 0;
        }
        else if (!chars.isNewLine(currentChar)) {
            state.column++;
        }
        state.offset++;
        this.updatePeek(state);
    }
    updatePeek(state) {
        state.peek = state.offset >= this.end ? chars.$EOF : this.charAt(state.offset);
    }
    locationFromCursor(cursor) {
        return new ParseLocation(cursor.file, cursor.state.offset, cursor.state.line, cursor.state.column);
    }
}
class EscapedCharacterCursor extends PlainCharacterCursor {
    constructor(fileOrCursor, range) {
        if (fileOrCursor instanceof EscapedCharacterCursor) {
            super(fileOrCursor);
            this.internalState = { ...fileOrCursor.internalState };
        }
        else {
            super(fileOrCursor, range);
            this.internalState = this.state;
        }
    }
    advance() {
        this.state = this.internalState;
        super.advance();
        this.processEscapeSequence();
    }
    init() {
        super.init();
        this.processEscapeSequence();
    }
    clone() {
        return new EscapedCharacterCursor(this);
    }
    getChars(start) {
        const cursor = start.clone();
        let chars = '';
        while (cursor.internalState.offset < this.internalState.offset) {
            chars += String.fromCodePoint(cursor.peek());
            cursor.advance();
        }
        return chars;
    }
    /**
     * Process the escape sequence that starts at the current position in the text.
     *
     * This method is called to ensure that `peek` has the unescaped value of escape sequences.
     */
    processEscapeSequence() {
        const peek = () => this.internalState.peek;
        if (peek() === chars.$BACKSLASH) {
            // We have hit an escape sequence so we need the internal state to become independent
            // of the external state.
            this.internalState = { ...this.state };
            // Move past the backslash
            this.advanceState(this.internalState);
            // First check for standard control char sequences
            if (peek() === chars.$n) {
                this.state.peek = chars.$LF;
            }
            else if (peek() === chars.$r) {
                this.state.peek = chars.$CR;
            }
            else if (peek() === chars.$v) {
                this.state.peek = chars.$VTAB;
            }
            else if (peek() === chars.$t) {
                this.state.peek = chars.$TAB;
            }
            else if (peek() === chars.$b) {
                this.state.peek = chars.$BSPACE;
            }
            else if (peek() === chars.$f) {
                this.state.peek = chars.$FF;
            }
            // Now consider more complex sequences
            else if (peek() === chars.$u) {
                // Unicode code-point sequence
                this.advanceState(this.internalState); // advance past the `u` char
                if (peek() === chars.$LBRACE) {
                    // Variable length Unicode, e.g. `\x{123}`
                    this.advanceState(this.internalState); // advance past the `{` char
                    // Advance past the variable number of hex digits until we hit a `}` char
                    const digitStart = this.clone();
                    let length = 0;
                    while (peek() !== chars.$RBRACE) {
                        this.advanceState(this.internalState);
                        length++;
                    }
                    this.state.peek = this.decodeHexDigits(digitStart, length);
                }
                else {
                    // Fixed length Unicode, e.g. `\u1234`
                    const digitStart = this.clone();
                    this.advanceState(this.internalState);
                    this.advanceState(this.internalState);
                    this.advanceState(this.internalState);
                    this.state.peek = this.decodeHexDigits(digitStart, 4);
                }
            }
            else if (peek() === chars.$x) {
                // Hex char code, e.g. `\x2F`
                this.advanceState(this.internalState); // advance past the `x` char
                const digitStart = this.clone();
                this.advanceState(this.internalState);
                this.state.peek = this.decodeHexDigits(digitStart, 2);
            }
            else if (chars.isOctalDigit(peek())) {
                // Octal char code, e.g. `\012`,
                let octal = '';
                let length = 0;
                let previous = this.clone();
                while (chars.isOctalDigit(peek()) && length < 3) {
                    previous = this.clone();
                    octal += String.fromCodePoint(peek());
                    this.advanceState(this.internalState);
                    length++;
                }
                this.state.peek = parseInt(octal, 8);
                // Backup one char
                this.internalState = previous.internalState;
            }
            else if (chars.isNewLine(this.internalState.peek)) {
                // Line continuation `\` followed by a new line
                this.advanceState(this.internalState); // advance over the newline
                this.state = this.internalState;
            }
            else {
                // If none of the `if` blocks were executed then we just have an escaped normal character.
                // In that case we just, effectively, skip the backslash from the character.
                this.state.peek = this.internalState.peek;
            }
        }
    }
    decodeHexDigits(start, length) {
        const hex = this.input.slice(start.internalState.offset, start.internalState.offset + length);
        const charCode = parseInt(hex, 16);
        if (!isNaN(charCode)) {
            return charCode;
        }
        else {
            start.state = start.internalState;
            throw new CursorError('Invalid hexadecimal escape sequence', start);
        }
    }
}
export class CursorError {
    constructor(msg, cursor) {
        this.msg = msg;
        this.cursor = cursor;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvbWxfcGFyc2VyL2xleGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sS0FBSyxLQUFLLE1BQU0sVUFBVSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxVQUFVLEVBQUUsYUFBYSxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFMUYsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUMxQyxPQUFPLEVBQUMsNEJBQTRCLEVBQXNCLE1BQU0sd0JBQXdCLENBQUM7QUFDekYsT0FBTyxFQUFDLGNBQWMsRUFBZ0IsTUFBTSxRQUFRLENBQUM7QUFHckQsTUFBTSxPQUFPLFVBQVcsU0FBUSxVQUFVO0lBQ3hDLFlBQVksUUFBZ0IsRUFBUyxTQUF5QixFQUFFLElBQXFCO1FBQ25GLEtBQUssQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFEYSxjQUFTLEdBQVQsU0FBUyxDQUFnQjtJQUU5RCxDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8sY0FBYztJQUN6QixZQUNXLE1BQWUsRUFBUyxNQUFvQixFQUM1QywyQkFBb0M7UUFEcEMsV0FBTSxHQUFOLE1BQU0sQ0FBUztRQUFTLFdBQU0sR0FBTixNQUFNLENBQWM7UUFDNUMsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUFTO0lBQUcsQ0FBQztDQUNwRDtBQXlFRCxNQUFNLFVBQVUsUUFBUSxDQUNwQixNQUFjLEVBQUUsR0FBVyxFQUFFLGdCQUFvRCxFQUNqRixVQUEyQixFQUFFO0lBQy9CLE1BQU0sU0FBUyxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksZUFBZSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM5RixTQUFTLENBQUMsUUFB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QUVJO2dCQUNILDBGQUEwRjtnQkFDMUYsNEVBQTRFO2dCQUM1RSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQzthQUMzQztTQUNGO0lBQ0gsQ0FBQztJQUVTLGVBQWUsQ0FBQyxLQUE2QixFQUFFLE1BQWM7UUFDckUsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUM7UUFDOUYsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3BCLE9BQU8sUUFBUSxDQUFDO1NBQ2pCO2FBQU07WUFDTCxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUM7WUFDbEMsTUFBTSxJQUFJLFdBQVcsQ0FBQyxxQ0FBcUMsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNyRTtJQUNILENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxXQUFXO0lBQ3RCLFlBQW1CLEdBQVcsRUFBUyxNQUF1QjtRQUEzQyxRQUFHLEdBQUgsR0FBRyxDQUFRO1FBQVMsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7SUFBRyxDQUFDO0NBQ25FIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGNoYXJzIGZyb20gJy4uL2NoYXJzJztcbmltcG9ydCB7UGFyc2VFcnJvciwgUGFyc2VMb2NhdGlvbiwgUGFyc2VTb3VyY2VGaWxlLCBQYXJzZVNvdXJjZVNwYW59IGZyb20gJy4uL3BhcnNlX3V0aWwnO1xuXG5pbXBvcnQge05BTUVEX0VOVElUSUVTfSBmcm9tICcuL2VudGl0aWVzJztcbmltcG9ydCB7REVGQVVMVF9JTlRFUlBPTEFUSU9OX0NPTkZJRywgSW50ZXJwb2xhdGlvbkNvbmZpZ30gZnJvbSAnLi9pbnRlcnBvbGF0aW9uX2NvbmZpZyc7XG5pbXBvcnQge1RhZ0NvbnRlbnRUeXBlLCBUYWdEZWZpbml0aW9ufSBmcm9tICcuL3RhZ3MnO1xuaW1wb3J0IHtJbmNvbXBsZXRlVGFnT3BlblRva2VuLCBUYWdPcGVuU3RhcnRUb2tlbiwgVG9rZW4sIFRva2VuVHlwZX0gZnJvbSAnLi90b2tlbnMnO1xuXG5leHBvcnQgY2xhc3MgVG9rZW5FcnJvciBleHRlbmRzIFBhcnNlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihlcnJvck1zZzogc3RyaW5nLCBwdWJsaWMgdG9rZW5UeXBlOiBUb2tlblR5cGV8bnVsbCwgc3BhbjogUGFyc2VTb3VyY2VTcGFuKSB7XG4gICAgc3VwZXIoc3BhbiwgZXJyb3JNc2cpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUb2tlbml6ZVJlc3VsdCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHRva2VuczogVG9rZW5bXSwgcHVibGljIGVycm9yczogVG9rZW5FcnJvcltdLFxuICAgICAgcHVibGljIG5vbk5vcm1hbGl6ZWRJY3VFeHByZXNzaW9uczogVG9rZW5bXSkge31cbn1cblxuZXhwb3J0IGludGVyZmFjZSBMZXhlclJhbmdlIHtcbiAgc3RhcnRQb3M6IG51bWJlcjtcbiAgc3RhcnRMaW5lOiBudW1iZXI7XG4gIHN0YXJ0Q29sOiBudW1iZXI7XG4gIGVuZFBvczogbnVtYmVyO1xufVxuXG4vKipcbiAqIE9wdGlvbnMgdGhhdCBtb2RpZnkgaG93IHRoZSB0ZXh0IGlzIHRva2VuaXplZC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUb2tlbml6ZU9wdGlvbnMge1xuICAvKiogV2hldGhlciB0byB0b2tlbml6ZSBJQ1UgbWVzc2FnZXMgKGNvbnNpZGVyZWQgYXMgdGV4dCBub2RlcyB3aGVuIGZhbHNlKS4gKi9cbiAgdG9rZW5pemVFeHBhbnNpb25Gb3Jtcz86IGJvb2xlYW47XG4gIC8qKiBIb3cgdG8gdG9rZW5pemUgaW50ZXJwb2xhdGlvbiBtYXJrZXJzLiAqL1xuICBpbnRlcnBvbGF0aW9uQ29uZmlnPzogSW50ZXJwb2xhdGlvbkNvbmZpZztcbiAgLyoqXG4gICAqIFRoZSBzdGFydCBhbmQgZW5kIHBvaW50IG9mIHRoZSB0ZXh0IHRvIHBhcnNlIHdpdGhpbiB0aGUgYHNvdXJjZWAgc3RyaW5nLlxuICAgKiBUaGUgZW50aXJlIGBzb3VyY2VgIHN0cmluZyBpcyBwYXJzZWQgaWYgdGhpcyBpcyBub3QgcHJvdmlkZWQuXG4gICAqICovXG4gIHJhbmdlPzogTGV4ZXJSYW5nZTtcbiAgLyoqXG4gICAqIElmIHRoaXMgdGV4dCBpcyBzdG9yZWQgaW4gYSBKYXZhU2NyaXB0IHN0cmluZywgdGhlbiB3ZSBoYXZlIHRvIGRlYWwgd2l0aCBlc2NhcGUgc2VxdWVuY2VzLlxuICAgKlxuICAgKiAqKkV4YW1wbGUgMToqKlxuICAgKlxuICAgKiBgYGBcbiAgICogXCJhYmNcXFwiZGVmXFxuZ2hpXCJcbiAgICogYGBgXG4gICAqXG4gICAqIC0gVGhlIGBcXFwiYCBtdXN0IGJlIGNvbnZlcnRlZCB0byBgXCJgLlxuICAgKiAtIFRoZSBgXFxuYCBtdXN0IGJlIGNvbnZlcnRlZCB0byBhIG5ldyBsaW5lIGNoYXJhY3RlciBpbiBhIHRva2VuLFxuICAgKiAgIGJ1dCBpdCBzaG91bGQgbm90IGluY3JlbWVudCB0aGUgY3VycmVudCBsaW5lIGZvciBzb3VyY2UgbWFwcGluZy5cbiAgICpcbiAgICogKipFeGFtcGxlIDI6KipcbiAgICpcbiAgICogYGBgXG4gICAqIFwiYWJjXFxcbiAgICogIGRlZlwiXG4gICAqIGBgYFxuICAgKlxuICAgKiBUaGUgbGluZSBjb250aW51YXRpb24gKGBcXGAgZm9sbG93ZWQgYnkgYSBuZXdsaW5lKSBzaG91bGQgYmUgcmVtb3ZlZCBmcm9tIGEgdG9rZW5cbiAgICogYnV0IHRoZSBuZXcgbGluZSBzaG91bGQgaW5jcmVtZW50IHRoZSBjdXJyZW50IGxpbmUgZm9yIHNvdXJjZSBtYXBwaW5nLlxuICAgKi9cbiAgZXNjYXBlZFN0cmluZz86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBJZiB0aGlzIHRleHQgaXMgc3RvcmVkIGluIGFuIGV4dGVybmFsIHRlbXBsYXRlIChlLmcuIHZpYSBgdGVtcGxhdGVVcmxgKSB0aGVuIHdlIG5lZWQgdG8gZGVjaWRlXG4gICAqIHdoZXRoZXIgb3Igbm90IHRvIG5vcm1hbGl6ZSB0aGUgbGluZS1lbmRpbmdzIChmcm9tIGBcXHJcXG5gIHRvIGBcXG5gKSB3aGVuIHByb2Nlc3NpbmcgSUNVXG4gICAqIGV4cHJlc3Npb25zLlxuICAgKlxuICAgKiBJZiBgdHJ1ZWAgdGhlbiB3ZSB3aWxsIG5vcm1hbGl6ZSBJQ1UgZXhwcmVzc2lvbiBsaW5lIGVuZGluZ3MuXG4gICAqIFRoZSBkZWZhdWx0IGlzIGBmYWxzZWAsIGJ1dCB0aGlzIHdpbGwgYmUgc3dpdGNoZWQgaW4gYSBmdXR1cmUgbWFqb3IgcmVsZWFzZS5cbiAgICovXG4gIGkxOG5Ob3JtYWxpemVMaW5lRW5kaW5nc0luSUNVcz86IGJvb2xlYW47XG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBjaGFyYWN0ZXJzIHRoYXQgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYXMgbGVhZGluZyB0cml2aWEuXG4gICAqIExlYWRpbmcgdHJpdmlhIGFyZSBjaGFyYWN0ZXJzIHRoYXQgYXJlIG5vdCBpbXBvcnRhbnQgdG8gdGhlIGRldmVsb3BlciwgYW5kIHNvIHNob3VsZCBub3QgYmVcbiAgICogaW5jbHVkZWQgaW4gc291cmNlLW1hcCBzZWdtZW50cy4gIEEgY29tbW9uIGV4YW1wbGUgaXMgd2hpdGVzcGFjZS5cbiAgICovXG4gIGxlYWRpbmdUcml2aWFDaGFycz86IHN0cmluZ1tdO1xuICAvKipcbiAgICogSWYgdHJ1ZSwgZG8gbm90IGNvbnZlcnQgQ1JMRiB0byBMRi5cbiAgICovXG4gIHByZXNlcnZlTGluZUVuZGluZ3M/OiBib29sZWFuO1xuXG4gIC8vIFRPRE8oY3Jpc2JldG8pOiB0ZW1wb3Jhcnkgb3B0aW9uIHRvIGxpbWl0IGFjY2VzcyB0byB0aGUgYmxvY2sgc3ludGF4LlxuICAvKipcbiAgICogV2hldGhlciB0aGUgYmxvY2sgc3ludGF4IGlzIGVuYWJsZWQgYXQgdGhlIGNvbXBpbGVyIGxldmVsLlxuICAgKi9cbiAgdG9rZW5pemVCbG9ja3M/OiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9rZW5pemUoXG4gICAgc291cmNlOiBzdHJpbmcsIHVybDogc3RyaW5nLCBnZXRUYWdEZWZpbml0aW9uOiAodGFnTmFtZTogc3RyaW5nKSA9PiBUYWdEZWZpbml0aW9uLFxuICAgIG9wdGlvbnM6IFRva2VuaXplT3B0aW9ucyA9IHt9KTogVG9rZW5pemVSZXN1bHQge1xuICBjb25zdCB0b2tlbml6ZXIgPSBuZXcgX1Rva2VuaXplcihuZXcgUGFyc2VTb3VyY2VGaWxlKHNvdXJjZSwgdXJsKSwgZ2V0VGFnRGVmaW5pdGlvbiwgb3B0aW9ucyk7XG4gIHRva2VuaXplci50b2tlbml6ZSgpO1xuICByZXR1cm4gbmV3IFRva2VuaXplUmVzdWx0KFxuICAgICAgbWVyZ2VUZXh0VG9rZW5zKHRva2VuaXplci50b2tlbnMpLCB0b2tlbml6ZXIuZXJyb3JzLCB0b2tlbml6ZXIubm9uTm9ybWFsaXplZEljdUV4cHJlc3Npb25zKTtcbn1cblxuY29uc3QgX0NSX09SX0NSTEZfUkVHRVhQID0gL1xcclxcbj8vZztcblxuZnVuY3Rpb24gX3VuZXhwZWN0ZWRDaGFyYWN0ZXJFcnJvck1zZyhjaGFyQ29kZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgY2hhciA9IGNoYXJDb2RlID09PSBjaGFycy4kRU9GID8gJ0VPRicgOiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNoYXJDb2RlKTtcbiAgcmV0dXJuIGBVbmV4cGVjdGVkIGNoYXJhY3RlciBcIiR7Y2hhcn1cImA7XG59XG5cbmZ1bmN0aW9uIF91bmtub3duRW50aXR5RXJyb3JNc2coZW50aXR5U3JjOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYFVua25vd24gZW50aXR5IFwiJHtlbnRpdHlTcmN9XCIgLSB1c2UgdGhlIFwiJiM8ZGVjaW1hbD47XCIgb3IgIFwiJiN4PGhleD47XCIgc3ludGF4YDtcbn1cblxuZnVuY3Rpb24gX3VucGFyc2FibGVFbnRpdHlFcnJvck1zZyh0eXBlOiBDaGFyYWN0ZXJSZWZlcmVuY2VUeXBlLCBlbnRpdHlTdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgVW5hYmxlIHRvIHBhcnNlIGVudGl0eSBcIiR7ZW50aXR5U3RyfVwiIC0gJHtcbiAgICAgIHR5cGV9IGNoYXJhY3RlciByZWZlcmVuY2UgZW50aXRpZXMgbXVzdCBlbmQgd2l0aCBcIjtcImA7XG59XG5cbmVudW0gQ2hhcmFjdGVyUmVmZXJlbmNlVHlwZSB7XG4gIEhFWCA9ICdoZXhhZGVjaW1hbCcsXG4gIERFQyA9ICdkZWNpbWFsJyxcbn1cblxuY2xhc3MgX0NvbnRyb2xGbG93RXJyb3Ige1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgZXJyb3I6IFRva2VuRXJyb3IpIHt9XG59XG5cbi8vIFNlZSBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUxL3N5bnRheC5odG1sI3dyaXRpbmctaHRtbC1kb2N1bWVudHNcbmNsYXNzIF9Ub2tlbml6ZXIge1xuICBwcml2YXRlIF9jdXJzb3I6IENoYXJhY3RlckN1cnNvcjtcbiAgcHJpdmF0ZSBfdG9rZW5pemVJY3U6IGJvb2xlYW47XG4gIHByaXZhdGUgX2ludGVycG9sYXRpb25Db25maWc6IEludGVycG9sYXRpb25Db25maWc7XG4gIHByaXZhdGUgX2xlYWRpbmdUcml2aWFDb2RlUG9pbnRzOiBudW1iZXJbXXx1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2N1cnJlbnRUb2tlblN0YXJ0OiBDaGFyYWN0ZXJDdXJzb3J8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2N1cnJlbnRUb2tlblR5cGU6IFRva2VuVHlwZXxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfZXhwYW5zaW9uQ2FzZVN0YWNrOiBUb2tlblR5cGVbXSA9IFtdO1xuICBwcml2YXRlIF9pbkludGVycG9sYXRpb246IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBfcHJlc2VydmVMaW5lRW5kaW5nczogYm9vbGVhbjtcbiAgcHJpdmF0ZSByZWFkb25seSBfaTE4bk5vcm1hbGl6ZUxpbmVFbmRpbmdzSW5JQ1VzOiBib29sZWFuO1xuICBwcml2YXRlIHJlYWRvbmx5IF90b2tlbml6ZUJsb2NrczogYm9vbGVhbjtcbiAgdG9rZW5zOiBUb2tlbltdID0gW107XG4gIGVycm9yczogVG9rZW5FcnJvcltdID0gW107XG4gIG5vbk5vcm1hbGl6ZWRJY3VFeHByZXNzaW9uczogVG9rZW5bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gX2ZpbGUgVGhlIGh0bWwgc291cmNlIGZpbGUgYmVpbmcgdG9rZW5pemVkLlxuICAgKiBAcGFyYW0gX2dldFRhZ0RlZmluaXRpb24gQSBmdW5jdGlvbiB0aGF0IHdpbGwgcmV0cmlldmUgYSB0YWcgZGVmaW5pdGlvbiBmb3IgYSBnaXZlbiB0YWcgbmFtZS5cbiAgICogQHBhcmFtIG9wdGlvbnMgQ29uZmlndXJhdGlvbiBvZiB0aGUgdG9rZW5pemF0aW9uLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgICBfZmlsZTogUGFyc2VTb3VyY2VGaWxlLCBwcml2YXRlIF9nZXRUYWdEZWZpbml0aW9uOiAodGFnTmFtZTogc3RyaW5nKSA9PiBUYWdEZWZpbml0aW9uLFxuICAgICAgb3B0aW9uczogVG9rZW5pemVPcHRpb25zKSB7XG4gICAgdGhpcy5fdG9rZW5pemVJY3UgPSBvcHRpb25zLnRva2VuaXplRXhwYW5zaW9uRm9ybXMgfHwgZmFsc2U7XG4gICAgdGhpcy5faW50ZXJwb2xhdGlvbkNvbmZpZyA9IG9wdGlvbnMuaW50ZXJwb2xhdGlvbkNvbmZpZyB8fCBERUZBVUxUX0lOVEVSUE9MQVRJT05fQ09ORklHO1xuICAgIHRoaXMuX2xlYWRpbmdUcml2aWFDb2RlUG9pbnRzID1cbiAgICAgICAgb3B0aW9ucy5sZWFkaW5nVHJpdmlhQ2hhcnMgJiYgb3B0aW9ucy5sZWFkaW5nVHJpdmlhQ2hhcnMubWFwKGMgPT4gYy5jb2RlUG9pbnRBdCgwKSB8fCAwKTtcbiAgICBjb25zdCByYW5nZSA9XG4gICAgICAgIG9wdGlvbnMucmFuZ2UgfHwge2VuZFBvczogX2ZpbGUuY29udGVudC5sZW5ndGgsIHN0YXJ0UG9zOiAwLCBzdGFydExpbmU6IDAsIHN0YXJ0Q29sOiAwfTtcbiAgICB0aGlzLl9jdXJzb3IgPSBvcHRpb25zLmVzY2FwZWRTdHJpbmcgPyBuZXcgRXNjYXBlZENoYXJhY3RlckN1cnNvcihfZmlsZSwgcmFuZ2UpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgUGxhaW5DaGFyYWN0ZXJDdXJzb3IoX2ZpbGUsIHJhbmdlKTtcbiAgICB0aGlzLl9wcmVzZXJ2ZUxpbmVFbmRpbmdzID0gb3B0aW9ucy5wcmVzZXJ2ZUxpbmVFbmRpbmdzIHx8IGZhbHNlO1xuICAgIHRoaXMuX2kxOG5Ob3JtYWxpemVMaW5lRW5kaW5nc0luSUNVcyA9IG9wdGlvbnMuaTE4bk5vcm1hbGl6ZUxpbmVFbmRpbmdzSW5JQ1VzIHx8IGZhbHNlO1xuICAgIHRoaXMuX3Rva2VuaXplQmxvY2tzID0gb3B0aW9ucy50b2tlbml6ZUJsb2NrcyB8fCBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5fY3Vyc29yLmluaXQoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLmhhbmRsZUVycm9yKGUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3Byb2Nlc3NDYXJyaWFnZVJldHVybnMoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy5fcHJlc2VydmVMaW5lRW5kaW5ncykge1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICAgIC8vIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9odG1sNTEvc3ludGF4Lmh0bWwjcHJlcHJvY2Vzc2luZy10aGUtaW5wdXQtc3RyZWFtXG4gICAgLy8gSW4gb3JkZXIgdG8ga2VlcCB0aGUgb3JpZ2luYWwgcG9zaXRpb24gaW4gdGhlIHNvdXJjZSwgd2UgY2FuIG5vdFxuICAgIC8vIHByZS1wcm9jZXNzIGl0LlxuICAgIC8vIEluc3RlYWQgQ1JzIGFyZSBwcm9jZXNzZWQgcmlnaHQgYmVmb3JlIGluc3RhbnRpYXRpbmcgdGhlIHRva2Vucy5cbiAgICByZXR1cm4gY29udGVudC5yZXBsYWNlKF9DUl9PUl9DUkxGX1JFR0VYUCwgJ1xcbicpO1xuICB9XG5cbiAgdG9rZW5pemUoKTogdm9pZCB7XG4gICAgd2hpbGUgKHRoaXMuX2N1cnNvci5wZWVrKCkgIT09IGNoYXJzLiRFT0YpIHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5fY3Vyc29yLmNsb25lKCk7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAodGhpcy5fYXR0ZW1wdENoYXJDb2RlKGNoYXJzLiRMVCkpIHtcbiAgICAgICAgICBpZiAodGhpcy5fYXR0ZW1wdENoYXJDb2RlKGNoYXJzLiRCQU5HKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2F0dGVtcHRDaGFyQ29kZShjaGFycy4kTEJSQUNLRVQpKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2NvbnN1bWVDZGF0YShzdGFydCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2F0dGVtcHRDaGFyQ29kZShjaGFycy4kTUlOVVMpKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2NvbnN1bWVDb21tZW50KHN0YXJ0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuX2NvbnN1bWVEb2NUeXBlKHN0YXJ0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2F0dGVtcHRDaGFyQ29kZShjaGFycy4kU0xBU0gpKSB7XG4gICAgICAgICAgICB0aGlzLl9jb25zdW1lVGFnQ2xvc2Uoc3RhcnQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jb25zdW1lVGFnT3BlbihzdGFydCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3Rva2VuaXplQmxvY2tzICYmIHRoaXMuX2F0dGVtcHRTdHIoJ3sjJykpIHtcbiAgICAgICAgICB0aGlzLl9jb25zdW1lQmxvY2tHcm91cE9wZW4oc3RhcnQpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3Rva2VuaXplQmxvY2tzICYmIHRoaXMuX2F0dGVtcHRTdHIoJ3svJykpIHtcbiAgICAgICAgICB0aGlzLl9jb25zdW1lQmxvY2tHcm91cENsb3NlKHN0YXJ0KTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl90b2tlbml6ZUJsb2NrcyAmJiB0aGlzLl9hdHRlbXB0U3RyKCd7OicpKSB7XG4gICAgICAgICAgdGhpcy5fY29uc3VtZUJsb2NrKHN0YXJ0KTtcbiAgICAgICAgfSBlbHNlIGlmICghKHRoaXMuX3Rva2VuaXplSWN1ICYmIHRoaXMuX3Rva2VuaXplRXhwYW5zaW9uRm9ybSgpKSkge1xuICAgICAgICAgIC8vIEluIChwb3NzaWJseSBpbnRlcnBvbGF0ZWQpIHRleHQgdGhlIGVuZCBvZiB0aGUgdGV4dCBpcyBnaXZlbiBieSBgaXNUZXh0RW5kKClgLCB3aGlsZVxuICAgICAgICAgIC8vIHRoZSBwcmVtYXR1cmUgZW5kIG9mIGFuIGludGVycG9sYXRpb24gaXMgZ2l2ZW4gYnkgdGhlIHN0YXJ0IG9mIGEgbmV3IEhUTUwgZWxlbWVudC5cbiAgICAgICAgICB0aGlzLl9jb25zdW1lV2l0aEludGVycG9sYXRpb24oXG4gICAgICAgICAgICAgIFRva2VuVHlwZS5URVhULCBUb2tlblR5cGUuSU5URVJQT0xBVElPTiwgKCkgPT4gdGhpcy5faXNUZXh0RW5kKCksXG4gICAgICAgICAgICAgICgpID0+IHRoaXMuX2lzVGFnU3RhcnQoKSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVFcnJvcihlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuRU9GKTtcbiAgICB0aGlzLl9lbmRUb2tlbihbXSk7XG4gIH1cblxuICBwcml2YXRlIF9jb25zdW1lQmxvY2tHcm91cE9wZW4oc3RhcnQ6IENoYXJhY3RlckN1cnNvcikge1xuICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLkJMT0NLX0dST1VQX09QRU5fU1RBUlQsIHN0YXJ0KTtcbiAgICBjb25zdCBuYW1lQ3Vyc29yID0gdGhpcy5fY3Vyc29yLmNsb25lKCk7XG4gICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihjb2RlID0+ICFpc0Jsb2NrTmFtZUNoYXIoY29kZSkpO1xuICAgIHRoaXMuX2VuZFRva2VuKFt0aGlzLl9jdXJzb3IuZ2V0Q2hhcnMobmFtZUN1cnNvcildKTtcbiAgICB0aGlzLl9jb25zdW1lQmxvY2tQYXJhbWV0ZXJzKCk7XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuQkxPQ0tfR1JPVVBfT1BFTl9FTkQpO1xuICAgIHRoaXMuX3JlcXVpcmVDaGFyQ29kZShjaGFycy4kUkJSQUNFKTtcbiAgICB0aGlzLl9lbmRUb2tlbihbXSk7XG4gIH1cblxuICBwcml2YXRlIF9jb25zdW1lQmxvY2tHcm91cENsb3NlKHN0YXJ0OiBDaGFyYWN0ZXJDdXJzb3IpIHtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5CTE9DS19HUk9VUF9DTE9TRSwgc3RhcnQpO1xuICAgIGNvbnN0IG5hbWVDdXJzb3IgPSB0aGlzLl9jdXJzb3IuY2xvbmUoKTtcbiAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGNvZGUgPT4gIWlzQmxvY2tOYW1lQ2hhcihjb2RlKSk7XG4gICAgY29uc3QgbmFtZSA9IHRoaXMuX2N1cnNvci5nZXRDaGFycyhuYW1lQ3Vyc29yKTtcbiAgICB0aGlzLl9yZXF1aXJlQ2hhckNvZGUoY2hhcnMuJFJCUkFDRSk7XG4gICAgdGhpcy5fZW5kVG9rZW4oW25hbWVdKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVCbG9jayhzdGFydDogQ2hhcmFjdGVyQ3Vyc29yKSB7XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuQkxPQ0tfT1BFTl9TVEFSVCwgc3RhcnQpO1xuICAgIGNvbnN0IG5hbWVDdXJzb3IgPSB0aGlzLl9jdXJzb3IuY2xvbmUoKTtcbiAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGNvZGUgPT4gIWlzQmxvY2tOYW1lQ2hhcihjb2RlKSk7XG4gICAgdGhpcy5fZW5kVG9rZW4oW3RoaXMuX2N1cnNvci5nZXRDaGFycyhuYW1lQ3Vyc29yKV0pO1xuICAgIHRoaXMuX2NvbnN1bWVCbG9ja1BhcmFtZXRlcnMoKTtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5CTE9DS19PUEVOX0VORCk7XG4gICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlKGNoYXJzLiRSQlJBQ0UpO1xuICAgIHRoaXMuX2VuZFRva2VuKFtdKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVCbG9ja1BhcmFtZXRlcnMoKSB7XG4gICAgLy8gVHJpbSB0aGUgd2hpdGVzcGFjZSB1bnRpbCB0aGUgZmlyc3QgcGFyYW1ldGVyLlxuICAgIHRoaXMuX2F0dGVtcHRDaGFyQ29kZVVudGlsRm4oaXNCbG9ja1BhcmFtZXRlckNoYXIpO1xuXG4gICAgd2hpbGUgKHRoaXMuX2N1cnNvci5wZWVrKCkgIT09IGNoYXJzLiRSQlJBQ0UgJiYgdGhpcy5fY3Vyc29yLnBlZWsoKSAhPT0gY2hhcnMuJEVPRikge1xuICAgICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuQkxPQ0tfUEFSQU1FVEVSKTtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5fY3Vyc29yLmNsb25lKCk7XG4gICAgICBsZXQgaW5RdW90ZTogbnVtYmVyfG51bGwgPSBudWxsO1xuICAgICAgbGV0IG9wZW5CcmFjZXMgPSAwO1xuXG4gICAgICAvLyBDb25zdW1lIHRoZSBwYXJhbWV0ZXIgdW50aWwgdGhlIG5leHQgc2VtaWNvbG9uIG9yIGJyYWNlLlxuICAgICAgLy8gTm90ZSB0aGF0IHdlIHNraXAgb3ZlciBzZW1pY29sb25zL2JyYWNlcyBpbnNpZGUgb2Ygc3RyaW5ncy5cbiAgICAgIHdoaWxlICgodGhpcy5fY3Vyc29yLnBlZWsoKSAhPT0gY2hhcnMuJFNFTUlDT0xPTiAmJiB0aGlzLl9jdXJzb3IucGVlaygpICE9PSBjaGFycy4kRU9GKSB8fFxuICAgICAgICAgICAgIGluUXVvdGUgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgY2hhciA9IHRoaXMuX2N1cnNvci5wZWVrKCk7XG5cbiAgICAgICAgLy8gU2tpcCB0byB0aGUgbmV4dCBjaGFyYWN0ZXIgaWYgaXQgd2FzIGVzY2FwZWQuXG4gICAgICAgIGlmIChjaGFyID09PSBjaGFycy4kQkFDS1NMQVNIKSB7XG4gICAgICAgICAgdGhpcy5fY3Vyc29yLmFkdmFuY2UoKTtcbiAgICAgICAgfSBlbHNlIGlmIChjaGFyID09PSBpblF1b3RlKSB7XG4gICAgICAgICAgaW5RdW90ZSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5RdW90ZSA9PT0gbnVsbCAmJiBjaGFycy5pc1F1b3RlKGNoYXIpKSB7XG4gICAgICAgICAgaW5RdW90ZSA9IGNoYXI7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hhciA9PT0gY2hhcnMuJExCUkFDRSAmJiBpblF1b3RlID09PSBudWxsKSB7XG4gICAgICAgICAgb3BlbkJyYWNlcysrO1xuICAgICAgICB9IGVsc2UgaWYgKGNoYXIgPT09IGNoYXJzLiRSQlJBQ0UgJiYgaW5RdW90ZSA9PT0gbnVsbCkge1xuICAgICAgICAgIGlmIChvcGVuQnJhY2VzID09PSAwKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2UgaWYgKG9wZW5CcmFjZXMgPiAwKSB7XG4gICAgICAgICAgICBvcGVuQnJhY2VzLS07XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY3Vyc29yLmFkdmFuY2UoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fZW5kVG9rZW4oW3RoaXMuX2N1cnNvci5nZXRDaGFycyhzdGFydCldKTtcblxuICAgICAgLy8gU2tpcCB0byB0aGUgbmV4dCBwYXJhbWV0ZXIuXG4gICAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGlzQmxvY2tQYXJhbWV0ZXJDaGFyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgd2hldGhlciBhbiBJQ1UgdG9rZW4gaGFzIGJlZW4gY3JlYXRlZFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgX3Rva2VuaXplRXhwYW5zaW9uRm9ybSgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5pc0V4cGFuc2lvbkZvcm1TdGFydCgpKSB7XG4gICAgICB0aGlzLl9jb25zdW1lRXhwYW5zaW9uRm9ybVN0YXJ0KCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoaXNFeHBhbnNpb25DYXNlU3RhcnQodGhpcy5fY3Vyc29yLnBlZWsoKSkgJiYgdGhpcy5faXNJbkV4cGFuc2lvbkZvcm0oKSkge1xuICAgICAgdGhpcy5fY29uc3VtZUV4cGFuc2lvbkNhc2VTdGFydCgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2N1cnNvci5wZWVrKCkgPT09IGNoYXJzLiRSQlJBQ0UpIHtcbiAgICAgIGlmICh0aGlzLl9pc0luRXhwYW5zaW9uQ2FzZSgpKSB7XG4gICAgICAgIHRoaXMuX2NvbnN1bWVFeHBhbnNpb25DYXNlRW5kKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5faXNJbkV4cGFuc2lvbkZvcm0oKSkge1xuICAgICAgICB0aGlzLl9jb25zdW1lRXhwYW5zaW9uRm9ybUVuZCgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9iZWdpblRva2VuKHR5cGU6IFRva2VuVHlwZSwgc3RhcnQgPSB0aGlzLl9jdXJzb3IuY2xvbmUoKSkge1xuICAgIHRoaXMuX2N1cnJlbnRUb2tlblN0YXJ0ID0gc3RhcnQ7XG4gICAgdGhpcy5fY3VycmVudFRva2VuVHlwZSA9IHR5cGU7XG4gIH1cblxuICBwcml2YXRlIF9lbmRUb2tlbihwYXJ0czogc3RyaW5nW10sIGVuZD86IENoYXJhY3RlckN1cnNvcik6IFRva2VuIHtcbiAgICBpZiAodGhpcy5fY3VycmVudFRva2VuU3RhcnQgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBUb2tlbkVycm9yKFxuICAgICAgICAgICdQcm9ncmFtbWluZyBlcnJvciAtIGF0dGVtcHRlZCB0byBlbmQgYSB0b2tlbiB3aGVuIHRoZXJlIHdhcyBubyBzdGFydCB0byB0aGUgdG9rZW4nLFxuICAgICAgICAgIHRoaXMuX2N1cnJlbnRUb2tlblR5cGUsIHRoaXMuX2N1cnNvci5nZXRTcGFuKGVuZCkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fY3VycmVudFRva2VuVHlwZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFRva2VuRXJyb3IoXG4gICAgICAgICAgJ1Byb2dyYW1taW5nIGVycm9yIC0gYXR0ZW1wdGVkIHRvIGVuZCBhIHRva2VuIHdoaWNoIGhhcyBubyB0b2tlbiB0eXBlJywgbnVsbCxcbiAgICAgICAgICB0aGlzLl9jdXJzb3IuZ2V0U3Bhbih0aGlzLl9jdXJyZW50VG9rZW5TdGFydCkpO1xuICAgIH1cbiAgICBjb25zdCB0b2tlbiA9IHtcbiAgICAgIHR5cGU6IHRoaXMuX2N1cnJlbnRUb2tlblR5cGUsXG4gICAgICBwYXJ0cyxcbiAgICAgIHNvdXJjZVNwYW46XG4gICAgICAgICAgKGVuZCA/PyB0aGlzLl9jdXJzb3IpLmdldFNwYW4odGhpcy5fY3VycmVudFRva2VuU3RhcnQsIHRoaXMuX2xlYWRpbmdUcml2aWFDb2RlUG9pbnRzKSxcbiAgICB9IGFzIFRva2VuO1xuICAgIHRoaXMudG9rZW5zLnB1c2godG9rZW4pO1xuICAgIHRoaXMuX2N1cnJlbnRUb2tlblN0YXJ0ID0gbnVsbDtcbiAgICB0aGlzLl9jdXJyZW50VG9rZW5UeXBlID0gbnVsbDtcbiAgICByZXR1cm4gdG9rZW47XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVFcnJvcihtc2c6IHN0cmluZywgc3BhbjogUGFyc2VTb3VyY2VTcGFuKTogX0NvbnRyb2xGbG93RXJyb3Ige1xuICAgIGlmICh0aGlzLl9pc0luRXhwYW5zaW9uRm9ybSgpKSB7XG4gICAgICBtc2cgKz0gYCAoRG8geW91IGhhdmUgYW4gdW5lc2NhcGVkIFwie1wiIGluIHlvdXIgdGVtcGxhdGU/IFVzZSBcInt7ICd7JyB9fVwiKSB0byBlc2NhcGUgaXQuKWA7XG4gICAgfVxuICAgIGNvbnN0IGVycm9yID0gbmV3IFRva2VuRXJyb3IobXNnLCB0aGlzLl9jdXJyZW50VG9rZW5UeXBlLCBzcGFuKTtcbiAgICB0aGlzLl9jdXJyZW50VG9rZW5TdGFydCA9IG51bGw7XG4gICAgdGhpcy5fY3VycmVudFRva2VuVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIG5ldyBfQ29udHJvbEZsb3dFcnJvcihlcnJvcik7XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZUVycm9yKGU6IGFueSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgQ3Vyc29yRXJyb3IpIHtcbiAgICAgIGUgPSB0aGlzLl9jcmVhdGVFcnJvcihlLm1zZywgdGhpcy5fY3Vyc29yLmdldFNwYW4oZS5jdXJzb3IpKTtcbiAgICB9XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBfQ29udHJvbEZsb3dFcnJvcikge1xuICAgICAgdGhpcy5lcnJvcnMucHVzaChlLmVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hdHRlbXB0Q2hhckNvZGUoY2hhckNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9jdXJzb3IucGVlaygpID09PSBjaGFyQ29kZSkge1xuICAgICAgdGhpcy5fY3Vyc29yLmFkdmFuY2UoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9hdHRlbXB0Q2hhckNvZGVDYXNlSW5zZW5zaXRpdmUoY2hhckNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmIChjb21wYXJlQ2hhckNvZGVDYXNlSW5zZW5zaXRpdmUodGhpcy5fY3Vyc29yLnBlZWsoKSwgY2hhckNvZGUpKSB7XG4gICAgICB0aGlzLl9jdXJzb3IuYWR2YW5jZSgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlcXVpcmVDaGFyQ29kZShjaGFyQ29kZTogbnVtYmVyKSB7XG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLl9jdXJzb3IuY2xvbmUoKTtcbiAgICBpZiAoIXRoaXMuX2F0dGVtcHRDaGFyQ29kZShjaGFyQ29kZSkpIHtcbiAgICAgIHRocm93IHRoaXMuX2NyZWF0ZUVycm9yKFxuICAgICAgICAgIF91bmV4cGVjdGVkQ2hhcmFjdGVyRXJyb3JNc2codGhpcy5fY3Vyc29yLnBlZWsoKSksIHRoaXMuX2N1cnNvci5nZXRTcGFuKGxvY2F0aW9uKSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfYXR0ZW1wdFN0cihjaGFyczogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbGVuID0gY2hhcnMubGVuZ3RoO1xuICAgIGlmICh0aGlzLl9jdXJzb3IuY2hhcnNMZWZ0KCkgPCBsZW4pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgaW5pdGlhbFBvc2l0aW9uID0gdGhpcy5fY3Vyc29yLmNsb25lKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgaWYgKCF0aGlzLl9hdHRlbXB0Q2hhckNvZGUoY2hhcnMuY2hhckNvZGVBdChpKSkpIHtcbiAgICAgICAgLy8gSWYgYXR0ZW1wdGluZyB0byBwYXJzZSB0aGUgc3RyaW5nIGZhaWxzLCB3ZSB3YW50IHRvIHJlc2V0IHRoZSBwYXJzZXJcbiAgICAgICAgLy8gdG8gd2hlcmUgaXQgd2FzIGJlZm9yZSB0aGUgYXR0ZW1wdFxuICAgICAgICB0aGlzLl9jdXJzb3IgPSBpbml0aWFsUG9zaXRpb247XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9hdHRlbXB0U3RyQ2FzZUluc2Vuc2l0aXZlKGNoYXJzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIXRoaXMuX2F0dGVtcHRDaGFyQ29kZUNhc2VJbnNlbnNpdGl2ZShjaGFycy5jaGFyQ29kZUF0KGkpKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVxdWlyZVN0cihjaGFyczogc3RyaW5nKSB7XG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLl9jdXJzb3IuY2xvbmUoKTtcbiAgICBpZiAoIXRoaXMuX2F0dGVtcHRTdHIoY2hhcnMpKSB7XG4gICAgICB0aHJvdyB0aGlzLl9jcmVhdGVFcnJvcihcbiAgICAgICAgICBfdW5leHBlY3RlZENoYXJhY3RlckVycm9yTXNnKHRoaXMuX2N1cnNvci5wZWVrKCkpLCB0aGlzLl9jdXJzb3IuZ2V0U3Bhbihsb2NhdGlvbikpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2F0dGVtcHRDaGFyQ29kZVVudGlsRm4ocHJlZGljYXRlOiAoY29kZTogbnVtYmVyKSA9PiBib29sZWFuKSB7XG4gICAgd2hpbGUgKCFwcmVkaWNhdGUodGhpcy5fY3Vyc29yLnBlZWsoKSkpIHtcbiAgICAgIHRoaXMuX2N1cnNvci5hZHZhbmNlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfcmVxdWlyZUNoYXJDb2RlVW50aWxGbihwcmVkaWNhdGU6IChjb2RlOiBudW1iZXIpID0+IGJvb2xlYW4sIGxlbjogbnVtYmVyKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLl9jdXJzb3IuY2xvbmUoKTtcbiAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKHByZWRpY2F0ZSk7XG4gICAgaWYgKHRoaXMuX2N1cnNvci5kaWZmKHN0YXJ0KSA8IGxlbikge1xuICAgICAgdGhyb3cgdGhpcy5fY3JlYXRlRXJyb3IoXG4gICAgICAgICAgX3VuZXhwZWN0ZWRDaGFyYWN0ZXJFcnJvck1zZyh0aGlzLl9jdXJzb3IucGVlaygpKSwgdGhpcy5fY3Vyc29yLmdldFNwYW4oc3RhcnQpKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hdHRlbXB0VW50aWxDaGFyKGNoYXI6IG51bWJlcikge1xuICAgIHdoaWxlICh0aGlzLl9jdXJzb3IucGVlaygpICE9PSBjaGFyKSB7XG4gICAgICB0aGlzLl9jdXJzb3IuYWR2YW5jZSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3JlYWRDaGFyKCk6IHN0cmluZyB7XG4gICAgLy8gRG9uJ3QgcmVseSB1cG9uIHJlYWRpbmcgZGlyZWN0bHkgZnJvbSBgX2lucHV0YCBhcyB0aGUgYWN0dWFsIGNoYXIgdmFsdWVcbiAgICAvLyBtYXkgaGF2ZSBiZWVuIGdlbmVyYXRlZCBmcm9tIGFuIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICBjb25zdCBjaGFyID0gU3RyaW5nLmZyb21Db2RlUG9pbnQodGhpcy5fY3Vyc29yLnBlZWsoKSk7XG4gICAgdGhpcy5fY3Vyc29yLmFkdmFuY2UoKTtcbiAgICByZXR1cm4gY2hhcjtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVFbnRpdHkodGV4dFRva2VuVHlwZTogVG9rZW5UeXBlKTogdm9pZCB7XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuRU5DT0RFRF9FTlRJVFkpO1xuICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5fY3Vyc29yLmNsb25lKCk7XG4gICAgdGhpcy5fY3Vyc29yLmFkdmFuY2UoKTtcbiAgICBpZiAodGhpcy5fYXR0ZW1wdENoYXJDb2RlKGNoYXJzLiRIQVNIKSkge1xuICAgICAgY29uc3QgaXNIZXggPSB0aGlzLl9hdHRlbXB0Q2hhckNvZGUoY2hhcnMuJHgpIHx8IHRoaXMuX2F0dGVtcHRDaGFyQ29kZShjaGFycy4kWCk7XG4gICAgICBjb25zdCBjb2RlU3RhcnQgPSB0aGlzLl9jdXJzb3IuY2xvbmUoKTtcbiAgICAgIHRoaXMuX2F0dGVtcHRDaGFyQ29kZVVudGlsRm4oaXNEaWdpdEVudGl0eUVuZCk7XG4gICAgICBpZiAodGhpcy5fY3Vyc29yLnBlZWsoKSAhPSBjaGFycy4kU0VNSUNPTE9OKSB7XG4gICAgICAgIC8vIEFkdmFuY2UgY3Vyc29yIHRvIGluY2x1ZGUgdGhlIHBlZWtlZCBjaGFyYWN0ZXIgaW4gdGhlIHN0cmluZyBwcm92aWRlZCB0byB0aGUgZXJyb3JcbiAgICAgICAgLy8gbWVzc2FnZS5cbiAgICAgICAgdGhpcy5fY3Vyc29yLmFkdmFuY2UoKTtcbiAgICAgICAgY29uc3QgZW50aXR5VHlwZSA9IGlzSGV4ID8gQ2hhcmFjdGVyUmVmZXJlbmNlVHlwZS5IRVggOiBDaGFyYWN0ZXJSZWZlcmVuY2VUeXBlLkRFQztcbiAgICAgICAgdGhyb3cgdGhpcy5fY3JlYXRlRXJyb3IoXG4gICAgICAgICAgICBfdW5wYXJzYWJsZUVudGl0eUVycm9yTXNnKGVudGl0eVR5cGUsIHRoaXMuX2N1cnNvci5nZXRDaGFycyhzdGFydCkpLFxuICAgICAgICAgICAgdGhpcy5fY3Vyc29yLmdldFNwYW4oKSk7XG4gICAgICB9XG4gICAgICBjb25zdCBzdHJOdW0gPSB0aGlzLl9jdXJzb3IuZ2V0Q2hhcnMoY29kZVN0YXJ0KTtcbiAgICAgIHRoaXMuX2N1cnNvci5hZHZhbmNlKCk7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjaGFyQ29kZSA9IHBhcnNlSW50KHN0ck51bSwgaXNIZXggPyAxNiA6IDEwKTtcbiAgICAgICAgdGhpcy5fZW5kVG9rZW4oW1N0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGUpLCB0aGlzLl9jdXJzb3IuZ2V0Q2hhcnMoc3RhcnQpXSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgdGhyb3cgdGhpcy5fY3JlYXRlRXJyb3IoXG4gICAgICAgICAgICBfdW5rbm93bkVudGl0eUVycm9yTXNnKHRoaXMuX2N1cnNvci5nZXRDaGFycyhzdGFydCkpLCB0aGlzLl9jdXJzb3IuZ2V0U3BhbigpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbmFtZVN0YXJ0ID0gdGhpcy5fY3Vyc29yLmNsb25lKCk7XG4gICAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGlzTmFtZWRFbnRpdHlFbmQpO1xuICAgICAgaWYgKHRoaXMuX2N1cnNvci5wZWVrKCkgIT0gY2hhcnMuJFNFTUlDT0xPTikge1xuICAgICAgICAvLyBObyBzZW1pY29sb24gd2FzIGZvdW5kIHNvIGFib3J0IHRoZSBlbmNvZGVkIGVudGl0eSB0b2tlbiB0aGF0IHdhcyBpbiBwcm9ncmVzcywgYW5kIHRyZWF0XG4gICAgICAgIC8vIHRoaXMgYXMgYSB0ZXh0IHRva2VuXG4gICAgICAgIHRoaXMuX2JlZ2luVG9rZW4odGV4dFRva2VuVHlwZSwgc3RhcnQpO1xuICAgICAgICB0aGlzLl9jdXJzb3IgPSBuYW1lU3RhcnQ7XG4gICAgICAgIHRoaXMuX2VuZFRva2VuKFsnJiddKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLl9jdXJzb3IuZ2V0Q2hhcnMobmFtZVN0YXJ0KTtcbiAgICAgICAgdGhpcy5fY3Vyc29yLmFkdmFuY2UoKTtcbiAgICAgICAgY29uc3QgY2hhciA9IE5BTUVEX0VOVElUSUVTW25hbWVdO1xuICAgICAgICBpZiAoIWNoYXIpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLl9jcmVhdGVFcnJvcihfdW5rbm93bkVudGl0eUVycm9yTXNnKG5hbWUpLCB0aGlzLl9jdXJzb3IuZ2V0U3BhbihzdGFydCkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2VuZFRva2VuKFtjaGFyLCBgJiR7bmFtZX07YF0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVSYXdUZXh0KGNvbnN1bWVFbnRpdGllczogYm9vbGVhbiwgZW5kTWFya2VyUHJlZGljYXRlOiAoKSA9PiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihjb25zdW1lRW50aXRpZXMgPyBUb2tlblR5cGUuRVNDQVBBQkxFX1JBV19URVhUIDogVG9rZW5UeXBlLlJBV19URVhUKTtcbiAgICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgdGFnQ2xvc2VTdGFydCA9IHRoaXMuX2N1cnNvci5jbG9uZSgpO1xuICAgICAgY29uc3QgZm91bmRFbmRNYXJrZXIgPSBlbmRNYXJrZXJQcmVkaWNhdGUoKTtcbiAgICAgIHRoaXMuX2N1cnNvciA9IHRhZ0Nsb3NlU3RhcnQ7XG4gICAgICBpZiAoZm91bmRFbmRNYXJrZXIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoY29uc3VtZUVudGl0aWVzICYmIHRoaXMuX2N1cnNvci5wZWVrKCkgPT09IGNoYXJzLiRBTVBFUlNBTkQpIHtcbiAgICAgICAgdGhpcy5fZW5kVG9rZW4oW3RoaXMuX3Byb2Nlc3NDYXJyaWFnZVJldHVybnMocGFydHMuam9pbignJykpXSk7XG4gICAgICAgIHBhcnRzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuX2NvbnN1bWVFbnRpdHkoVG9rZW5UeXBlLkVTQ0FQQUJMRV9SQVdfVEVYVCk7XG4gICAgICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLkVTQ0FQQUJMRV9SQVdfVEVYVCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJ0cy5wdXNoKHRoaXMuX3JlYWRDaGFyKCkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9lbmRUb2tlbihbdGhpcy5fcHJvY2Vzc0NhcnJpYWdlUmV0dXJucyhwYXJ0cy5qb2luKCcnKSldKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVDb21tZW50KHN0YXJ0OiBDaGFyYWN0ZXJDdXJzb3IpIHtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5DT01NRU5UX1NUQVJULCBzdGFydCk7XG4gICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlKGNoYXJzLiRNSU5VUyk7XG4gICAgdGhpcy5fZW5kVG9rZW4oW10pO1xuICAgIHRoaXMuX2NvbnN1bWVSYXdUZXh0KGZhbHNlLCAoKSA9PiB0aGlzLl9hdHRlbXB0U3RyKCctLT4nKSk7XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuQ09NTUVOVF9FTkQpO1xuICAgIHRoaXMuX3JlcXVpcmVTdHIoJy0tPicpO1xuICAgIHRoaXMuX2VuZFRva2VuKFtdKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVDZGF0YShzdGFydDogQ2hhcmFjdGVyQ3Vyc29yKSB7XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuQ0RBVEFfU1RBUlQsIHN0YXJ0KTtcbiAgICB0aGlzLl9yZXF1aXJlU3RyKCdDREFUQVsnKTtcbiAgICB0aGlzLl9lbmRUb2tlbihbXSk7XG4gICAgdGhpcy5fY29uc3VtZVJhd1RleHQoZmFsc2UsICgpID0+IHRoaXMuX2F0dGVtcHRTdHIoJ11dPicpKTtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5DREFUQV9FTkQpO1xuICAgIHRoaXMuX3JlcXVpcmVTdHIoJ11dPicpO1xuICAgIHRoaXMuX2VuZFRva2VuKFtdKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVEb2NUeXBlKHN0YXJ0OiBDaGFyYWN0ZXJDdXJzb3IpIHtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5ET0NfVFlQRSwgc3RhcnQpO1xuICAgIGNvbnN0IGNvbnRlbnRTdGFydCA9IHRoaXMuX2N1cnNvci5jbG9uZSgpO1xuICAgIHRoaXMuX2F0dGVtcHRVbnRpbENoYXIoY2hhcnMuJEdUKTtcbiAgICBjb25zdCBjb250ZW50ID0gdGhpcy5fY3Vyc29yLmdldENoYXJzKGNvbnRlbnRTdGFydCk7XG4gICAgdGhpcy5fY3Vyc29yLmFkdmFuY2UoKTtcbiAgICB0aGlzLl9lbmRUb2tlbihbY29udGVudF0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZVByZWZpeEFuZE5hbWUoKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IG5hbWVPclByZWZpeFN0YXJ0ID0gdGhpcy5fY3Vyc29yLmNsb25lKCk7XG4gICAgbGV0IHByZWZpeDogc3RyaW5nID0gJyc7XG4gICAgd2hpbGUgKHRoaXMuX2N1cnNvci5wZWVrKCkgIT09IGNoYXJzLiRDT0xPTiAmJiAhaXNQcmVmaXhFbmQodGhpcy5fY3Vyc29yLnBlZWsoKSkpIHtcbiAgICAgIHRoaXMuX2N1cnNvci5hZHZhbmNlKCk7XG4gICAgfVxuICAgIGxldCBuYW1lU3RhcnQ6IENoYXJhY3RlckN1cnNvcjtcbiAgICBpZiAodGhpcy5fY3Vyc29yLnBlZWsoKSA9PT0gY2hhcnMuJENPTE9OKSB7XG4gICAgICBwcmVmaXggPSB0aGlzLl9jdXJzb3IuZ2V0Q2hhcnMobmFtZU9yUHJlZml4U3RhcnQpO1xuICAgICAgdGhpcy5fY3Vyc29yLmFkdmFuY2UoKTtcbiAgICAgIG5hbWVTdGFydCA9IHRoaXMuX2N1cnNvci5jbG9uZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lU3RhcnQgPSBuYW1lT3JQcmVmaXhTdGFydDtcbiAgICB9XG4gICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlVW50aWxGbihpc05hbWVFbmQsIHByZWZpeCA9PT0gJycgPyAwIDogMSk7XG4gICAgY29uc3QgbmFtZSA9IHRoaXMuX2N1cnNvci5nZXRDaGFycyhuYW1lU3RhcnQpO1xuICAgIHJldHVybiBbcHJlZml4LCBuYW1lXTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVUYWdPcGVuKHN0YXJ0OiBDaGFyYWN0ZXJDdXJzb3IpIHtcbiAgICBsZXQgdGFnTmFtZTogc3RyaW5nO1xuICAgIGxldCBwcmVmaXg6IHN0cmluZztcbiAgICBsZXQgb3BlblRhZ1Rva2VuOiBUYWdPcGVuU3RhcnRUb2tlbnxJbmNvbXBsZXRlVGFnT3BlblRva2VufHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgaWYgKCFjaGFycy5pc0FzY2lpTGV0dGVyKHRoaXMuX2N1cnNvci5wZWVrKCkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuX2NyZWF0ZUVycm9yKFxuICAgICAgICAgICAgX3VuZXhwZWN0ZWRDaGFyYWN0ZXJFcnJvck1zZyh0aGlzLl9jdXJzb3IucGVlaygpKSwgdGhpcy5fY3Vyc29yLmdldFNwYW4oc3RhcnQpKTtcbiAgICAgIH1cblxuICAgICAgb3BlblRhZ1Rva2VuID0gdGhpcy5fY29uc3VtZVRhZ09wZW5TdGFydChzdGFydCk7XG4gICAgICBwcmVmaXggPSBvcGVuVGFnVG9rZW4ucGFydHNbMF07XG4gICAgICB0YWdOYW1lID0gb3BlblRhZ1Rva2VuLnBhcnRzWzFdO1xuICAgICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihpc05vdFdoaXRlc3BhY2UpO1xuICAgICAgd2hpbGUgKHRoaXMuX2N1cnNvci5wZWVrKCkgIT09IGNoYXJzLiRTTEFTSCAmJiB0aGlzLl9jdXJzb3IucGVlaygpICE9PSBjaGFycy4kR1QgJiZcbiAgICAgICAgICAgICB0aGlzLl9jdXJzb3IucGVlaygpICE9PSBjaGFycy4kTFQgJiYgdGhpcy5fY3Vyc29yLnBlZWsoKSAhPT0gY2hhcnMuJEVPRikge1xuICAgICAgICB0aGlzLl9jb25zdW1lQXR0cmlidXRlTmFtZSgpO1xuICAgICAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGlzTm90V2hpdGVzcGFjZSk7XG4gICAgICAgIGlmICh0aGlzLl9hdHRlbXB0Q2hhckNvZGUoY2hhcnMuJEVRKSkge1xuICAgICAgICAgIHRoaXMuX2F0dGVtcHRDaGFyQ29kZVVudGlsRm4oaXNOb3RXaGl0ZXNwYWNlKTtcbiAgICAgICAgICB0aGlzLl9jb25zdW1lQXR0cmlidXRlVmFsdWUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGlzTm90V2hpdGVzcGFjZSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9jb25zdW1lVGFnT3BlbkVuZCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgX0NvbnRyb2xGbG93RXJyb3IpIHtcbiAgICAgICAgaWYgKG9wZW5UYWdUb2tlbikge1xuICAgICAgICAgIC8vIFdlIGVycm9yZWQgYmVmb3JlIHdlIGNvdWxkIGNsb3NlIHRoZSBvcGVuaW5nIHRhZywgc28gaXQgaXMgaW5jb21wbGV0ZS5cbiAgICAgICAgICBvcGVuVGFnVG9rZW4udHlwZSA9IFRva2VuVHlwZS5JTkNPTVBMRVRFX1RBR19PUEVOO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFdoZW4gdGhlIHN0YXJ0IHRhZyBpcyBpbnZhbGlkLCBhc3N1bWUgd2Ugd2FudCBhIFwiPFwiIGFzIHRleHQuXG4gICAgICAgICAgLy8gQmFjayB0byBiYWNrIHRleHQgdG9rZW5zIGFyZSBtZXJnZWQgYXQgdGhlIGVuZC5cbiAgICAgICAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5URVhULCBzdGFydCk7XG4gICAgICAgICAgdGhpcy5fZW5kVG9rZW4oWyc8J10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZW50VG9rZW5UeXBlID0gdGhpcy5fZ2V0VGFnRGVmaW5pdGlvbih0YWdOYW1lKS5nZXRDb250ZW50VHlwZShwcmVmaXgpO1xuXG4gICAgaWYgKGNvbnRlbnRUb2tlblR5cGUgPT09IFRhZ0NvbnRlbnRUeXBlLlJBV19URVhUKSB7XG4gICAgICB0aGlzLl9jb25zdW1lUmF3VGV4dFdpdGhUYWdDbG9zZShwcmVmaXgsIHRhZ05hbWUsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGNvbnRlbnRUb2tlblR5cGUgPT09IFRhZ0NvbnRlbnRUeXBlLkVTQ0FQQUJMRV9SQVdfVEVYVCkge1xuICAgICAgdGhpcy5fY29uc3VtZVJhd1RleHRXaXRoVGFnQ2xvc2UocHJlZml4LCB0YWdOYW1lLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9jb25zdW1lUmF3VGV4dFdpdGhUYWdDbG9zZShwcmVmaXg6IHN0cmluZywgdGFnTmFtZTogc3RyaW5nLCBjb25zdW1lRW50aXRpZXM6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9jb25zdW1lUmF3VGV4dChjb25zdW1lRW50aXRpZXMsICgpID0+IHtcbiAgICAgIGlmICghdGhpcy5fYXR0ZW1wdENoYXJDb2RlKGNoYXJzLiRMVCkpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICghdGhpcy5fYXR0ZW1wdENoYXJDb2RlKGNoYXJzLiRTTEFTSCkpIHJldHVybiBmYWxzZTtcbiAgICAgIHRoaXMuX2F0dGVtcHRDaGFyQ29kZVVudGlsRm4oaXNOb3RXaGl0ZXNwYWNlKTtcbiAgICAgIGlmICghdGhpcy5fYXR0ZW1wdFN0ckNhc2VJbnNlbnNpdGl2ZSh0YWdOYW1lKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihpc05vdFdoaXRlc3BhY2UpO1xuICAgICAgcmV0dXJuIHRoaXMuX2F0dGVtcHRDaGFyQ29kZShjaGFycy4kR1QpO1xuICAgIH0pO1xuICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLlRBR19DTE9TRSk7XG4gICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlVW50aWxGbihjb2RlID0+IGNvZGUgPT09IGNoYXJzLiRHVCwgMyk7XG4gICAgdGhpcy5fY3Vyc29yLmFkdmFuY2UoKTsgIC8vIENvbnN1bWUgdGhlIGA+YFxuICAgIHRoaXMuX2VuZFRva2VuKFtwcmVmaXgsIHRhZ05hbWVdKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVUYWdPcGVuU3RhcnQoc3RhcnQ6IENoYXJhY3RlckN1cnNvcik6IFRhZ09wZW5TdGFydFRva2VuIHtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5UQUdfT1BFTl9TVEFSVCwgc3RhcnQpO1xuICAgIGNvbnN0IHBhcnRzID0gdGhpcy5fY29uc3VtZVByZWZpeEFuZE5hbWUoKTtcbiAgICByZXR1cm4gdGhpcy5fZW5kVG9rZW4ocGFydHMpIGFzIFRhZ09wZW5TdGFydFRva2VuO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZUF0dHJpYnV0ZU5hbWUoKSB7XG4gICAgY29uc3QgYXR0ck5hbWVTdGFydCA9IHRoaXMuX2N1cnNvci5wZWVrKCk7XG4gICAgaWYgKGF0dHJOYW1lU3RhcnQgPT09IGNoYXJzLiRTUSB8fCBhdHRyTmFtZVN0YXJ0ID09PSBjaGFycy4kRFEpIHtcbiAgICAgIHRocm93IHRoaXMuX2NyZWF0ZUVycm9yKF91bmV4cGVjdGVkQ2hhcmFjdGVyRXJyb3JNc2coYXR0ck5hbWVTdGFydCksIHRoaXMuX2N1cnNvci5nZXRTcGFuKCkpO1xuICAgIH1cbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5BVFRSX05BTUUpO1xuICAgIGNvbnN0IHByZWZpeEFuZE5hbWUgPSB0aGlzLl9jb25zdW1lUHJlZml4QW5kTmFtZSgpO1xuICAgIHRoaXMuX2VuZFRva2VuKHByZWZpeEFuZE5hbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZUF0dHJpYnV0ZVZhbHVlKCkge1xuICAgIGlmICh0aGlzLl9jdXJzb3IucGVlaygpID09PSBjaGFycy4kU1EgfHwgdGhpcy5fY3Vyc29yLnBlZWsoKSA9PT0gY2hhcnMuJERRKSB7XG4gICAgICBjb25zdCBxdW90ZUNoYXIgPSB0aGlzLl9jdXJzb3IucGVlaygpO1xuICAgICAgdGhpcy5fY29uc3VtZVF1b3RlKHF1b3RlQ2hhcik7XG4gICAgICAvLyBJbiBhbiBhdHRyaWJ1dGUgdGhlbiBlbmQgb2YgdGhlIGF0dHJpYnV0ZSB2YWx1ZSBhbmQgdGhlIHByZW1hdHVyZSBlbmQgdG8gYW4gaW50ZXJwb2xhdGlvblxuICAgICAgLy8gYXJlIGJvdGggdHJpZ2dlcmVkIGJ5IHRoZSBgcXVvdGVDaGFyYC5cbiAgICAgIGNvbnN0IGVuZFByZWRpY2F0ZSA9ICgpID0+IHRoaXMuX2N1cnNvci5wZWVrKCkgPT09IHF1b3RlQ2hhcjtcbiAgICAgIHRoaXMuX2NvbnN1bWVXaXRoSW50ZXJwb2xhdGlvbihcbiAgICAgICAgICBUb2tlblR5cGUuQVRUUl9WQUxVRV9URVhULCBUb2tlblR5cGUuQVRUUl9WQUxVRV9JTlRFUlBPTEFUSU9OLCBlbmRQcmVkaWNhdGUsXG4gICAgICAgICAgZW5kUHJlZGljYXRlKTtcbiAgICAgIHRoaXMuX2NvbnN1bWVRdW90ZShxdW90ZUNoYXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBlbmRQcmVkaWNhdGUgPSAoKSA9PiBpc05hbWVFbmQodGhpcy5fY3Vyc29yLnBlZWsoKSk7XG4gICAgICB0aGlzLl9jb25zdW1lV2l0aEludGVycG9sYXRpb24oXG4gICAgICAgICAgVG9rZW5UeXBlLkFUVFJfVkFMVUVfVEVYVCwgVG9rZW5UeXBlLkFUVFJfVkFMVUVfSU5URVJQT0xBVElPTiwgZW5kUHJlZGljYXRlLFxuICAgICAgICAgIGVuZFByZWRpY2F0ZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZVF1b3RlKHF1b3RlQ2hhcjogbnVtYmVyKSB7XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuQVRUUl9RVU9URSk7XG4gICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlKHF1b3RlQ2hhcik7XG4gICAgdGhpcy5fZW5kVG9rZW4oW1N0cmluZy5mcm9tQ29kZVBvaW50KHF1b3RlQ2hhcildKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVUYWdPcGVuRW5kKCkge1xuICAgIGNvbnN0IHRva2VuVHlwZSA9XG4gICAgICAgIHRoaXMuX2F0dGVtcHRDaGFyQ29kZShjaGFycy4kU0xBU0gpID8gVG9rZW5UeXBlLlRBR19PUEVOX0VORF9WT0lEIDogVG9rZW5UeXBlLlRBR19PUEVOX0VORDtcbiAgICB0aGlzLl9iZWdpblRva2VuKHRva2VuVHlwZSk7XG4gICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlKGNoYXJzLiRHVCk7XG4gICAgdGhpcy5fZW5kVG9rZW4oW10pO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZVRhZ0Nsb3NlKHN0YXJ0OiBDaGFyYWN0ZXJDdXJzb3IpIHtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5UQUdfQ0xPU0UsIHN0YXJ0KTtcbiAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGlzTm90V2hpdGVzcGFjZSk7XG4gICAgY29uc3QgcHJlZml4QW5kTmFtZSA9IHRoaXMuX2NvbnN1bWVQcmVmaXhBbmROYW1lKCk7XG4gICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihpc05vdFdoaXRlc3BhY2UpO1xuICAgIHRoaXMuX3JlcXVpcmVDaGFyQ29kZShjaGFycy4kR1QpO1xuICAgIHRoaXMuX2VuZFRva2VuKHByZWZpeEFuZE5hbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZUV4cGFuc2lvbkZvcm1TdGFydCgpIHtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5FWFBBTlNJT05fRk9STV9TVEFSVCk7XG4gICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlKGNoYXJzLiRMQlJBQ0UpO1xuICAgIHRoaXMuX2VuZFRva2VuKFtdKTtcblxuICAgIHRoaXMuX2V4cGFuc2lvbkNhc2VTdGFjay5wdXNoKFRva2VuVHlwZS5FWFBBTlNJT05fRk9STV9TVEFSVCk7XG5cbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5SQVdfVEVYVCk7XG4gICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5fcmVhZFVudGlsKGNoYXJzLiRDT01NQSk7XG4gICAgY29uc3Qgbm9ybWFsaXplZENvbmRpdGlvbiA9IHRoaXMuX3Byb2Nlc3NDYXJyaWFnZVJldHVybnMoY29uZGl0aW9uKTtcbiAgICBpZiAodGhpcy5faTE4bk5vcm1hbGl6ZUxpbmVFbmRpbmdzSW5JQ1VzKSB7XG4gICAgICAvLyBXZSBleHBsaWNpdGx5IHdhbnQgdG8gbm9ybWFsaXplIGxpbmUgZW5kaW5ncyBmb3IgdGhpcyB0ZXh0LlxuICAgICAgdGhpcy5fZW5kVG9rZW4oW25vcm1hbGl6ZWRDb25kaXRpb25dKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2UgYXJlIG5vdCBub3JtYWxpemluZyBsaW5lIGVuZGluZ3MuXG4gICAgICBjb25zdCBjb25kaXRpb25Ub2tlbiA9IHRoaXMuX2VuZFRva2VuKFtjb25kaXRpb25dKTtcbiAgICAgIGlmIChub3JtYWxpemVkQ29uZGl0aW9uICE9PSBjb25kaXRpb24pIHtcbiAgICAgICAgdGhpcy5ub25Ob3JtYWxpemVkSWN1RXhwcmVzc2lvbnMucHVzaChjb25kaXRpb25Ub2tlbik7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3JlcXVpcmVDaGFyQ29kZShjaGFycy4kQ09NTUEpO1xuICAgIHRoaXMuX2F0dGVtcHRDaGFyQ29kZVVudGlsRm4oaXNOb3RXaGl0ZXNwYWNlKTtcblxuICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLlJBV19URVhUKTtcbiAgICBjb25zdCB0eXBlID0gdGhpcy5fcmVhZFVudGlsKGNoYXJzLiRDT01NQSk7XG4gICAgdGhpcy5fZW5kVG9rZW4oW3R5cGVdKTtcbiAgICB0aGlzLl9yZXF1aXJlQ2hhckNvZGUoY2hhcnMuJENPTU1BKTtcbiAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGlzTm90V2hpdGVzcGFjZSk7XG4gIH1cblxuICBwcml2YXRlIF9jb25zdW1lRXhwYW5zaW9uQ2FzZVN0YXJ0KCkge1xuICAgIHRoaXMuX2JlZ2luVG9rZW4oVG9rZW5UeXBlLkVYUEFOU0lPTl9DQVNFX1ZBTFVFKTtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuX3JlYWRVbnRpbChjaGFycy4kTEJSQUNFKS50cmltKCk7XG4gICAgdGhpcy5fZW5kVG9rZW4oW3ZhbHVlXSk7XG4gICAgdGhpcy5fYXR0ZW1wdENoYXJDb2RlVW50aWxGbihpc05vdFdoaXRlc3BhY2UpO1xuXG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuRVhQQU5TSU9OX0NBU0VfRVhQX1NUQVJUKTtcbiAgICB0aGlzLl9yZXF1aXJlQ2hhckNvZGUoY2hhcnMuJExCUkFDRSk7XG4gICAgdGhpcy5fZW5kVG9rZW4oW10pO1xuICAgIHRoaXMuX2F0dGVtcHRDaGFyQ29kZVVudGlsRm4oaXNOb3RXaGl0ZXNwYWNlKTtcblxuICAgIHRoaXMuX2V4cGFuc2lvbkNhc2VTdGFjay5wdXNoKFRva2VuVHlwZS5FWFBBTlNJT05fQ0FTRV9FWFBfU1RBUlQpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZUV4cGFuc2lvbkNhc2VFbmQoKSB7XG4gICAgdGhpcy5fYmVnaW5Ub2tlbihUb2tlblR5cGUuRVhQQU5TSU9OX0NBU0VfRVhQX0VORCk7XG4gICAgdGhpcy5fcmVxdWlyZUNoYXJDb2RlKGNoYXJzLiRSQlJBQ0UpO1xuICAgIHRoaXMuX2VuZFRva2VuKFtdKTtcbiAgICB0aGlzLl9hdHRlbXB0Q2hhckNvZGVVbnRpbEZuKGlzTm90V2hpdGVzcGFjZSk7XG5cbiAgICB0aGlzLl9leHBhbnNpb25DYXNlU3RhY2sucG9wKCk7XG4gIH1cblxuICBwcml2YXRlIF9jb25zdW1lRXhwYW5zaW9uRm9ybUVuZCgpIHtcbiAgICB0aGlzLl9iZWdpblRva2VuKFRva2VuVHlwZS5FWFBBTlNJT05fRk9STV9FTkQpO1xuICAgIHRoaXMuX3JlcXVpcmVDaGFyQ29kZShjaGFycy4kUkJSQUNFKTtcbiAgICB0aGlzLl9lbmRUb2tlbihbXSk7XG5cbiAgICB0aGlzLl9leHBhbnNpb25DYXNlU3RhY2sucG9wKCk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3VtZSBhIHN0cmluZyB0aGF0IG1heSBjb250YWluIGludGVycG9sYXRpb24gZXhwcmVzc2lvbnMuXG4gICAqXG4gICAqIFRoZSBmaXJzdCB0b2tlbiBjb25zdW1lZCB3aWxsIGJlIG9mIGB0b2tlblR5cGVgIGFuZCB0aGVuIHRoZXJlIHdpbGwgYmUgYWx0ZXJuYXRpbmdcbiAgICogYGludGVycG9sYXRpb25Ub2tlblR5cGVgIGFuZCBgdG9rZW5UeXBlYCB0b2tlbnMgdW50aWwgdGhlIGBlbmRQcmVkaWNhdGUoKWAgcmV0dXJucyB0cnVlLlxuICAgKlxuICAgKiBJZiBhbiBpbnRlcnBvbGF0aW9uIHRva2VuIGVuZHMgcHJlbWF0dXJlbHkgaXQgd2lsbCBoYXZlIG5vIGVuZCBtYXJrZXIgaW4gaXRzIGBwYXJ0c2AgYXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSB0ZXh0VG9rZW5UeXBlIHRoZSBraW5kIG9mIHRva2VucyB0byBpbnRlcmxlYXZlIGFyb3VuZCBpbnRlcnBvbGF0aW9uIHRva2Vucy5cbiAgICogQHBhcmFtIGludGVycG9sYXRpb25Ub2tlblR5cGUgdGhlIGtpbmQgb2YgdG9rZW5zIHRoYXQgY29udGFpbiBpbnRlcnBvbGF0aW9uLlxuICAgKiBAcGFyYW0gZW5kUHJlZGljYXRlIGEgZnVuY3Rpb24gdGhhdCBzaG91bGQgcmV0dXJuIHRydWUgd2hlbiB3ZSBzaG91bGQgc3RvcCBjb25zdW1pbmcuXG4gICAqIEBwYXJhbSBlbmRJbnRlcnBvbGF0aW9uIGEgZnVuY3Rpb24gdGhhdCBzaG91bGQgcmV0dXJuIHRydWUgaWYgdGhlcmUgaXMgYSBwcmVtYXR1cmUgZW5kIHRvIGFuXG4gICAqICAgICBpbnRlcnBvbGF0aW9uIGV4cHJlc3Npb24gLSBpLmUuIGJlZm9yZSB3ZSBnZXQgdG8gdGhlIG5vcm1hbCBpbnRlcnBvbGF0aW9uIGNsb3NpbmcgbWFya2VyLlxuICAgKi9cbiAgcHJpdmF0ZSBfY29uc3VtZVdpdGhJbnRlcnBvbGF0aW9uKFxuICAgICAgdGV4dFRva2VuVHlwZTogVG9rZW5UeXBlLCBpbnRlcnBvbGF0aW9uVG9rZW5UeXBlOiBUb2tlblR5cGUsIGVuZFByZWRpY2F0ZTogKCkgPT4gYm9vbGVhbixcbiAgICAgIGVuZEludGVycG9sYXRpb246ICgpID0+IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9iZWdpblRva2VuKHRleHRUb2tlblR5cGUpO1xuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgd2hpbGUgKCFlbmRQcmVkaWNhdGUoKSkge1xuICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMuX2N1cnNvci5jbG9uZSgpO1xuICAgICAgaWYgKHRoaXMuX2ludGVycG9sYXRpb25Db25maWcgJiYgdGhpcy5fYXR0ZW1wdFN0cih0aGlzLl9pbnRlcnBvbGF0aW9uQ29uZmlnLnN0YXJ0KSkge1xuICAgICAgICB0aGlzLl9lbmRUb2tlbihbdGhpcy5fcHJvY2Vzc0NhcnJpYWdlUmV0dXJucyhwYXJ0cy5qb2luKCcnKSldLCBjdXJyZW50KTtcbiAgICAgICAgcGFydHMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5fY29uc3VtZUludGVycG9sYXRpb24oaW50ZXJwb2xhdGlvblRva2VuVHlwZSwgY3VycmVudCwgZW5kSW50ZXJwb2xhdGlvbik7XG4gICAgICAgIHRoaXMuX2JlZ2luVG9rZW4odGV4dFRva2VuVHlwZSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2N1cnNvci5wZWVrKCkgPT09IGNoYXJzLiRBTVBFUlNBTkQpIHtcbiAgICAgICAgdGhpcy5fZW5kVG9rZW4oW3RoaXMuX3Byb2Nlc3NDYXJyaWFnZVJldHVybnMocGFydHMuam9pbignJykpXSk7XG4gICAgICAgIHBhcnRzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuX2NvbnN1bWVFbnRpdHkodGV4dFRva2VuVHlwZSk7XG4gICAgICAgIHRoaXMuX2JlZ2luVG9rZW4odGV4dFRva2VuVHlwZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJ0cy5wdXNoKHRoaXMuX3JlYWRDaGFyKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRoYXQgYW4gaW50ZXJwb2xhdGlvbiB3YXMgc3RhcnRlZCBidXQgbm90IGVuZGVkIGluc2lkZSB0aGlzIHRleHQgdG9rZW4uXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgd2UgcmVzZXQgdGhlIHN0YXRlIG9mIHRoZSBsZXhlciBjb3JyZWN0bHkuXG4gICAgdGhpcy5faW5JbnRlcnBvbGF0aW9uID0gZmFsc2U7XG5cbiAgICB0aGlzLl9lbmRUb2tlbihbdGhpcy5fcHJvY2Vzc0NhcnJpYWdlUmV0dXJucyhwYXJ0cy5qb2luKCcnKSldKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdW1lIGEgYmxvY2sgb2YgdGV4dCB0aGF0IGhhcyBiZWVuIGludGVycHJldGVkIGFzIGFuIEFuZ3VsYXIgaW50ZXJwb2xhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGludGVycG9sYXRpb25Ub2tlblR5cGUgdGhlIHR5cGUgb2YgdGhlIGludGVycG9sYXRpb24gdG9rZW4gdG8gZ2VuZXJhdGUuXG4gICAqIEBwYXJhbSBpbnRlcnBvbGF0aW9uU3RhcnQgYSBjdXJzb3IgdGhhdCBwb2ludHMgdG8gdGhlIHN0YXJ0IG9mIHRoaXMgaW50ZXJwb2xhdGlvbi5cbiAgICogQHBhcmFtIHByZW1hdHVyZUVuZFByZWRpY2F0ZSBhIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIHJldHVybiB0cnVlIGlmIHRoZSBuZXh0IGNoYXJhY3RlcnMgaW5kaWNhdGVcbiAgICogICAgIGFuIGVuZCB0byB0aGUgaW50ZXJwb2xhdGlvbiBiZWZvcmUgaXRzIG5vcm1hbCBjbG9zaW5nIG1hcmtlci5cbiAgICovXG4gIHByaXZhdGUgX2NvbnN1bWVJbnRlcnBvbGF0aW9uKFxuICAgICAgaW50ZXJwb2xhdGlvblRva2VuVHlwZTogVG9rZW5UeXBlLCBpbnRlcnBvbGF0aW9uU3RhcnQ6IENoYXJhY3RlckN1cnNvcixcbiAgICAgIHByZW1hdHVyZUVuZFByZWRpY2F0ZTogKCgpID0+IGJvb2xlYW4pfG51bGwpOiB2b2lkIHtcbiAgICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgICB0aGlzLl9iZWdpblRva2VuKGludGVycG9sYXRpb25Ub2tlblR5cGUsIGludGVycG9sYXRpb25TdGFydCk7XG4gICAgcGFydHMucHVzaCh0aGlzLl9pbnRlcnBvbGF0aW9uQ29uZmlnLnN0YXJ0KTtcblxuICAgIC8vIEZpbmQgdGhlIGVuZCBvZiB0aGUgaW50ZXJwb2xhdGlvbiwgaWdub3JpbmcgY29udGVudCBpbnNpZGUgcXVvdGVzLlxuICAgIGNvbnN0IGV4cHJlc3Npb25TdGFydCA9IHRoaXMuX2N1cnNvci5jbG9uZSgpO1xuICAgIGxldCBpblF1b3RlOiBudW1iZXJ8bnVsbCA9IG51bGw7XG4gICAgbGV0IGluQ29tbWVudCA9IGZhbHNlO1xuICAgIHdoaWxlICh0aGlzLl9jdXJzb3IucGVlaygpICE9PSBjaGFycy4kRU9GICYmXG4gICAgICAgICAgIChwcmVtYXR1cmVFbmRQcmVkaWNhdGUgPT09IG51bGwgfHwgIXByZW1hdHVyZUVuZFByZWRpY2F0ZSgpKSkge1xuICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMuX2N1cnNvci5jbG9uZSgpO1xuXG4gICAgICBpZiAodGhpcy5faXNUYWdTdGFydCgpKSB7XG4gICAgICAgIC8vIFdlIGFyZSBzdGFydGluZyB3aGF0IGxvb2tzIGxpa2UgYW4gSFRNTCBlbGVtZW50IGluIHRoZSBtaWRkbGUgb2YgdGhpcyBpbnRlcnBvbGF0aW9uLlxuICAgICAgICAvLyBSZXNldCB0aGUgY3Vyc29yIHRvIGJlZm9yZSB0aGUgYDxgIGNoYXJhY3RlciBhbmQgZW5kIHRoZSBpbnRlcnBvbGF0aW9uIHRva2VuLlxuICAgICAgICAvLyAoVGhpcyBpcyBhY3R1YWxseSB3cm9uZyBidXQgaGVyZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSkuXG4gICAgICAgIHRoaXMuX2N1cnNvciA9IGN1cnJlbnQ7XG4gICAgICAgIHBhcnRzLnB1c2godGhpcy5fZ2V0UHJvY2Vzc2VkQ2hhcnMoZXhwcmVzc2lvblN0YXJ0LCBjdXJyZW50KSk7XG4gICAgICAgIHRoaXMuX2VuZFRva2VuKHBhcnRzKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaW5RdW90ZSA9PT0gbnVsbCkge1xuICAgICAgICBpZiAodGhpcy5fYXR0ZW1wdFN0cih0aGlzLl9pbnRlcnBvbGF0aW9uQ29uZmlnLmVuZCkpIHtcbiAgICAgICAgICAvLyBXZSBhcmUgbm90IGluIGEgc3RyaW5nLCBhbmQgd2UgaGl0IHRoZSBlbmQgaW50ZXJwb2xhdGlvbiBtYXJrZXJcbiAgICAgICAgICBwYXJ0cy5wdXNoKHRoaXMuX2dldFByb2Nlc3NlZENoYXJzKGV4cHJlc3Npb25TdGFydCwgY3VycmVudCkpO1xuICAgICAgICAgIHBhcnRzLnB1c2godGhpcy5faW50ZXJwb2xhdGlvbkNvbmZpZy5lbmQpO1xuICAgICAgICAgIHRoaXMuX2VuZFRva2VuKHBhcnRzKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYXR0ZW1wdFN0cignLy8nKSkge1xuICAgICAgICAgIC8vIE9uY2Ugd2UgYXJlIGluIGEgY29tbWVudCB3ZSBpZ25vcmUgYW55IHF1b3Rlc1xuICAgICAgICAgIGluQ29tbWVudCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgY2hhciA9IHRoaXMuX2N1cnNvci5wZWVrKCk7XG4gICAgICB0aGlzLl9jdXJzb3IuYWR2YW5jZSgpO1xuICAgICAgaWYgKGNoYXIgPT09IGNoYXJzLiRCQUNLU0xBU0gpIHtcbiAgICAgICAgLy8gU2tpcCB0aGUgbmV4dCBjaGFyYWN0ZXIgYmVjYXVzZSBpdCB3YXMgZXNjYXBlZC5cbiAgICAgICAgdGhpcy5fY3Vyc29yLmFkdmFuY2UoKTtcbiAgICAgIH0gZWxzZSBpZiAoY2hhciA9PT0gaW5RdW90ZSkge1xuICAgICAgICAvLyBFeGl0aW5nIHRoZSBjdXJyZW50IHF1b3RlZCBzdHJpbmdcbiAgICAgICAgaW5RdW90ZSA9IG51bGw7XG4gICAgICB9IGVsc2UgaWYgKCFpbkNvbW1lbnQgJiYgaW5RdW90ZSA9PT0gbnVsbCAmJiBjaGFycy5pc1F1b3RlKGNoYXIpKSB7XG4gICAgICAgIC8vIEVudGVyaW5nIGEgbmV3IHF1b3RlZCBzdHJpbmdcbiAgICAgICAgaW5RdW90ZSA9IGNoYXI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gV2UgaGl0IEVPRiB3aXRob3V0IGZpbmRpbmcgYSBjbG9zaW5nIGludGVycG9sYXRpb24gbWFya2VyXG4gICAgcGFydHMucHVzaCh0aGlzLl9nZXRQcm9jZXNzZWRDaGFycyhleHByZXNzaW9uU3RhcnQsIHRoaXMuX2N1cnNvcikpO1xuICAgIHRoaXMuX2VuZFRva2VuKHBhcnRzKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldFByb2Nlc3NlZENoYXJzKHN0YXJ0OiBDaGFyYWN0ZXJDdXJzb3IsIGVuZDogQ2hhcmFjdGVyQ3Vyc29yKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fcHJvY2Vzc0NhcnJpYWdlUmV0dXJucyhlbmQuZ2V0Q2hhcnMoc3RhcnQpKTtcbiAgfVxuXG4gIHByaXZhdGUgX2lzVGV4dEVuZCgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5faXNUYWdTdGFydCgpIHx8IHRoaXMuX2lzQmxvY2tTdGFydCgpIHx8IHRoaXMuX2N1cnNvci5wZWVrKCkgPT09IGNoYXJzLiRFT0YpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl90b2tlbml6ZUljdSAmJiAhdGhpcy5faW5JbnRlcnBvbGF0aW9uKSB7XG4gICAgICBpZiAodGhpcy5pc0V4cGFuc2lvbkZvcm1TdGFydCgpKSB7XG4gICAgICAgIC8vIHN0YXJ0IG9mIGFuIGV4cGFuc2lvbiBmb3JtXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fY3Vyc29yLnBlZWsoKSA9PT0gY2hhcnMuJFJCUkFDRSAmJiB0aGlzLl9pc0luRXhwYW5zaW9uQ2FzZSgpKSB7XG4gICAgICAgIC8vIGVuZCBvZiBhbmQgZXhwYW5zaW9uIGNhc2VcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgY3VycmVudCBjdXJzb3IgaXMgcG9pbnRpbmcgdG8gdGhlIHN0YXJ0IG9mIGEgdGFnXG4gICAqIChvcGVuaW5nL2Nsb3NpbmcvY29tbWVudHMvY2RhdGEvZXRjKS5cbiAgICovXG4gIHByaXZhdGUgX2lzVGFnU3RhcnQoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX2N1cnNvci5wZWVrKCkgPT09IGNoYXJzLiRMVCkge1xuICAgICAgLy8gV2UgYXNzdW1lIHRoYXQgYDxgIGZvbGxvd2VkIGJ5IHdoaXRlc3BhY2UgaXMgbm90IHRoZSBzdGFydCBvZiBhbiBIVE1MIGVsZW1lbnQuXG4gICAgICBjb25zdCB0bXAgPSB0aGlzLl9jdXJzb3IuY2xvbmUoKTtcbiAgICAgIHRtcC5hZHZhbmNlKCk7XG4gICAgICAvLyBJZiB0aGUgbmV4dCBjaGFyYWN0ZXIgaXMgYWxwaGFiZXRpYywgISBub3IgLyB0aGVuIGl0IGlzIGEgdGFnIHN0YXJ0XG4gICAgICBjb25zdCBjb2RlID0gdG1wLnBlZWsoKTtcbiAgICAgIGlmICgoY2hhcnMuJGEgPD0gY29kZSAmJiBjb2RlIDw9IGNoYXJzLiR6KSB8fCAoY2hhcnMuJEEgPD0gY29kZSAmJiBjb2RlIDw9IGNoYXJzLiRaKSB8fFxuICAgICAgICAgIGNvZGUgPT09IGNoYXJzLiRTTEFTSCB8fCBjb2RlID09PSBjaGFycy4kQkFORykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBfaXNCbG9ja1N0YXJ0KCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl90b2tlbml6ZUJsb2NrcyAmJiB0aGlzLl9jdXJzb3IucGVlaygpID09PSBjaGFycy4kTEJSQUNFKSB7XG4gICAgICBjb25zdCB0bXAgPSB0aGlzLl9jdXJzb3IuY2xvbmUoKTtcblxuICAgICAgLy8gQ2hlY2sgdGhhdCB0aGUgY3Vyc29yIGlzIG9uIGEgYHsjYCwgYHsvYCBvciBgezpgLlxuICAgICAgdG1wLmFkdmFuY2UoKTtcbiAgICAgIGNvbnN0IG5leHQgPSB0bXAucGVlaygpO1xuICAgICAgaWYgKG5leHQgIT09IGNoYXJzLiRCQU5HICYmIG5leHQgIT09IGNoYXJzLiRTTEFTSCAmJiBuZXh0ICE9PSBjaGFycy4kQ09MT04pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBpdCBpcywgYWxzbyB2ZXJpZnkgdGhhdCB0aGUgbmV4dCBjaGFyYWN0ZXIgaXMgYSB2YWxpZCBibG9jayBpZGVudGlmaWVyLlxuICAgICAgdG1wLmFkdmFuY2UoKTtcbiAgICAgIGlmIChpc0Jsb2NrTmFtZUNoYXIodG1wLnBlZWsoKSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlYWRVbnRpbChjaGFyOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5fY3Vyc29yLmNsb25lKCk7XG4gICAgdGhpcy5fYXR0ZW1wdFVudGlsQ2hhcihjaGFyKTtcbiAgICByZXR1cm4gdGhpcy5fY3Vyc29yLmdldENoYXJzKHN0YXJ0KTtcbiAgfVxuXG4gIHByaXZhdGUgX2lzSW5FeHBhbnNpb25DYXNlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9leHBhbnNpb25DYXNlU3RhY2subGVuZ3RoID4gMCAmJlxuICAgICAgICB0aGlzLl9leHBhbnNpb25DYXNlU3RhY2tbdGhpcy5fZXhwYW5zaW9uQ2FzZVN0YWNrLmxlbmd0aCAtIDFdID09PVxuICAgICAgICBUb2tlblR5cGUuRVhQQU5TSU9OX0NBU0VfRVhQX1NUQVJUO1xuICB9XG5cbiAgcHJpdmF0ZSBfaXNJbkV4cGFuc2lvbkZvcm0oKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2V4cGFuc2lvbkNhc2VTdGFjay5sZW5ndGggPiAwICYmXG4gICAgICAgIHRoaXMuX2V4cGFuc2lvbkNhc2VTdGFja1t0aGlzLl9leHBhbnNpb25DYXNlU3RhY2subGVuZ3RoIC0gMV0gPT09XG4gICAgICAgIFRva2VuVHlwZS5FWFBBTlNJT05fRk9STV9TVEFSVDtcbiAgfVxuXG4gIHByaXZhdGUgaXNFeHBhbnNpb25Gb3JtU3RhcnQoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX2N1cnNvci5wZWVrKCkgIT09IGNoYXJzLiRMQlJBQ0UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2ludGVycG9sYXRpb25Db25maWcpIHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy5fY3Vyc29yLmNsb25lKCk7XG4gICAgICBjb25zdCBpc0ludGVycG9sYXRpb24gPSB0aGlzLl9hdHRlbXB0U3RyKHRoaXMuX2ludGVycG9sYXRpb25Db25maWcuc3RhcnQpO1xuICAgICAgdGhpcy5fY3Vyc29yID0gc3RhcnQ7XG4gICAgICByZXR1cm4gIWlzSW50ZXJwb2xhdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNOb3RXaGl0ZXNwYWNlKGNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gIWNoYXJzLmlzV2hpdGVzcGFjZShjb2RlKSB8fCBjb2RlID09PSBjaGFycy4kRU9GO1xufVxuXG5mdW5jdGlvbiBpc05hbWVFbmQoY29kZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBjaGFycy5pc1doaXRlc3BhY2UoY29kZSkgfHwgY29kZSA9PT0gY2hhcnMuJEdUIHx8IGNvZGUgPT09IGNoYXJzLiRMVCB8fFxuICAgICAgY29kZSA9PT0gY2hhcnMuJFNMQVNIIHx8IGNvZGUgPT09IGNoYXJzLiRTUSB8fCBjb2RlID09PSBjaGFycy4kRFEgfHwgY29kZSA9PT0gY2hhcnMuJEVRIHx8XG4gICAgICBjb2RlID09PSBjaGFycy4kRU9GO1xufVxuXG5mdW5jdGlvbiBpc1ByZWZpeEVuZChjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIChjb2RlIDwgY2hhcnMuJGEgfHwgY2hhcnMuJHogPCBjb2RlKSAmJiAoY29kZSA8IGNoYXJzLiRBIHx8IGNoYXJzLiRaIDwgY29kZSkgJiZcbiAgICAgIChjb2RlIDwgY2hhcnMuJDAgfHwgY29kZSA+IGNoYXJzLiQ5KTtcbn1cblxuZnVuY3Rpb24gaXNEaWdpdEVudGl0eUVuZChjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvZGUgPT09IGNoYXJzLiRTRU1JQ09MT04gfHwgY29kZSA9PT0gY2hhcnMuJEVPRiB8fCAhY2hhcnMuaXNBc2NpaUhleERpZ2l0KGNvZGUpO1xufVxuXG5mdW5jdGlvbiBpc05hbWVkRW50aXR5RW5kKGNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gY29kZSA9PT0gY2hhcnMuJFNFTUlDT0xPTiB8fCBjb2RlID09PSBjaGFycy4kRU9GIHx8ICFjaGFycy5pc0FzY2lpTGV0dGVyKGNvZGUpO1xufVxuXG5mdW5jdGlvbiBpc0V4cGFuc2lvbkNhc2VTdGFydChwZWVrOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIHBlZWsgIT09IGNoYXJzLiRSQlJBQ0U7XG59XG5cbmZ1bmN0aW9uIGNvbXBhcmVDaGFyQ29kZUNhc2VJbnNlbnNpdGl2ZShjb2RlMTogbnVtYmVyLCBjb2RlMjogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiB0b1VwcGVyQ2FzZUNoYXJDb2RlKGNvZGUxKSA9PT0gdG9VcHBlckNhc2VDaGFyQ29kZShjb2RlMik7XG59XG5cbmZ1bmN0aW9uIHRvVXBwZXJDYXNlQ2hhckNvZGUoY29kZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIGNvZGUgPj0gY2hhcnMuJGEgJiYgY29kZSA8PSBjaGFycy4keiA/IGNvZGUgLSBjaGFycy4kYSArIGNoYXJzLiRBIDogY29kZTtcbn1cblxuZnVuY3Rpb24gaXNCbG9ja05hbWVDaGFyKGNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gY2hhcnMuaXNBc2NpaUxldHRlcihjb2RlKSB8fCBjaGFycy5pc0RpZ2l0KGNvZGUpIHx8IGNvZGUgPT09IGNoYXJzLiRfO1xufVxuXG5mdW5jdGlvbiBpc0Jsb2NrUGFyYW1ldGVyQ2hhcihjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvZGUgIT09IGNoYXJzLiRTRU1JQ09MT04gJiYgaXNOb3RXaGl0ZXNwYWNlKGNvZGUpO1xufVxuXG5mdW5jdGlvbiBtZXJnZVRleHRUb2tlbnMoc3JjVG9rZW5zOiBUb2tlbltdKTogVG9rZW5bXSB7XG4gIGNvbnN0IGRzdFRva2VuczogVG9rZW5bXSA9IFtdO1xuICBsZXQgbGFzdERzdFRva2VuOiBUb2tlbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3JjVG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdG9rZW4gPSBzcmNUb2tlbnNbaV07XG4gICAgaWYgKChsYXN0RHN0VG9rZW4gJiYgbGFzdERzdFRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5URVhUICYmIHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5URVhUKSB8fFxuICAgICAgICAobGFzdERzdFRva2VuICYmIGxhc3REc3RUb2tlbi50eXBlID09PSBUb2tlblR5cGUuQVRUUl9WQUxVRV9URVhUICYmXG4gICAgICAgICB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuQVRUUl9WQUxVRV9URVhUKSkge1xuICAgICAgbGFzdERzdFRva2VuLnBhcnRzWzBdISArPSB0b2tlbi5wYXJ0c1swXTtcbiAgICAgIGxhc3REc3RUb2tlbi5zb3VyY2VTcGFuLmVuZCA9IHRva2VuLnNvdXJjZVNwYW4uZW5kO1xuICAgIH0gZWxzZSB7XG4gICAgICBsYXN0RHN0VG9rZW4gPSB0b2tlbjtcbiAgICAgIGRzdFRva2Vucy5wdXNoKGxhc3REc3RUb2tlbik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRzdFRva2Vucztcbn1cblxuXG4vKipcbiAqIFRoZSBfVG9rZW5pemVyIHVzZXMgb2JqZWN0cyBvZiB0aGlzIHR5cGUgdG8gbW92ZSB0aHJvdWdoIHRoZSBpbnB1dCB0ZXh0LFxuICogZXh0cmFjdGluZyBcInBhcnNlZCBjaGFyYWN0ZXJzXCIuIFRoZXNlIGNvdWxkIGJlIG1vcmUgdGhhbiBvbmUgYWN0dWFsIGNoYXJhY3RlclxuICogaWYgdGhlIHRleHQgY29udGFpbnMgZXNjYXBlIHNlcXVlbmNlcy5cbiAqL1xuaW50ZXJmYWNlIENoYXJhY3RlckN1cnNvciB7XG4gIC8qKiBJbml0aWFsaXplIHRoZSBjdXJzb3IuICovXG4gIGluaXQoKTogdm9pZDtcbiAgLyoqIFRoZSBwYXJzZWQgY2hhcmFjdGVyIGF0IHRoZSBjdXJyZW50IGN1cnNvciBwb3NpdGlvbi4gKi9cbiAgcGVlaygpOiBudW1iZXI7XG4gIC8qKiBBZHZhbmNlIHRoZSBjdXJzb3IgYnkgb25lIHBhcnNlZCBjaGFyYWN0ZXIuICovXG4gIGFkdmFuY2UoKTogdm9pZDtcbiAgLyoqIEdldCBhIHNwYW4gZnJvbSB0aGUgbWFya2VkIHN0YXJ0IHBvaW50IHRvIHRoZSBjdXJyZW50IHBvaW50LiAqL1xuICBnZXRTcGFuKHN0YXJ0PzogdGhpcywgbGVhZGluZ1RyaXZpYUNvZGVQb2ludHM/OiBudW1iZXJbXSk6IFBhcnNlU291cmNlU3BhbjtcbiAgLyoqIEdldCB0aGUgcGFyc2VkIGNoYXJhY3RlcnMgZnJvbSB0aGUgbWFya2VkIHN0YXJ0IHBvaW50IHRvIHRoZSBjdXJyZW50IHBvaW50LiAqL1xuICBnZXRDaGFycyhzdGFydDogdGhpcyk6IHN0cmluZztcbiAgLyoqIFRoZSBudW1iZXIgb2YgY2hhcmFjdGVycyBsZWZ0IGJlZm9yZSB0aGUgZW5kIG9mIHRoZSBjdXJzb3IuICovXG4gIGNoYXJzTGVmdCgpOiBudW1iZXI7XG4gIC8qKiBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgYmV0d2VlbiBgdGhpc2AgY3Vyc29yIGFuZCBgb3RoZXJgIGN1cnNvci4gKi9cbiAgZGlmZihvdGhlcjogdGhpcyk6IG51bWJlcjtcbiAgLyoqIE1ha2UgYSBjb3B5IG9mIHRoaXMgY3Vyc29yICovXG4gIGNsb25lKCk6IENoYXJhY3RlckN1cnNvcjtcbn1cblxuaW50ZXJmYWNlIEN1cnNvclN0YXRlIHtcbiAgcGVlazogbnVtYmVyO1xuICBvZmZzZXQ6IG51bWJlcjtcbiAgbGluZTogbnVtYmVyO1xuICBjb2x1bW46IG51bWJlcjtcbn1cblxuY2xhc3MgUGxhaW5DaGFyYWN0ZXJDdXJzb3IgaW1wbGVtZW50cyBDaGFyYWN0ZXJDdXJzb3Ige1xuICBwcm90ZWN0ZWQgc3RhdGU6IEN1cnNvclN0YXRlO1xuICBwcm90ZWN0ZWQgZmlsZTogUGFyc2VTb3VyY2VGaWxlO1xuICBwcm90ZWN0ZWQgaW5wdXQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIGVuZDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKGZpbGVPckN1cnNvcjogUGxhaW5DaGFyYWN0ZXJDdXJzb3IpO1xuICBjb25zdHJ1Y3RvcihmaWxlT3JDdXJzb3I6IFBhcnNlU291cmNlRmlsZSwgcmFuZ2U6IExleGVyUmFuZ2UpO1xuICBjb25zdHJ1Y3RvcihmaWxlT3JDdXJzb3I6IFBhcnNlU291cmNlRmlsZXxQbGFpbkNoYXJhY3RlckN1cnNvciwgcmFuZ2U/OiBMZXhlclJhbmdlKSB7XG4gICAgaWYgKGZpbGVPckN1cnNvciBpbnN0YW5jZW9mIFBsYWluQ2hhcmFjdGVyQ3Vyc29yKSB7XG4gICAgICB0aGlzLmZpbGUgPSBmaWxlT3JDdXJzb3IuZmlsZTtcbiAgICAgIHRoaXMuaW5wdXQgPSBmaWxlT3JDdXJzb3IuaW5wdXQ7XG4gICAgICB0aGlzLmVuZCA9IGZpbGVPckN1cnNvci5lbmQ7XG5cbiAgICAgIGNvbnN0IHN0YXRlID0gZmlsZU9yQ3Vyc29yLnN0YXRlO1xuICAgICAgLy8gTm90ZTogYXZvaWQgdXNpbmcgYHsuLi5maWxlT3JDdXJzb3Iuc3RhdGV9YCBoZXJlIGFzIHRoYXQgaGFzIGEgc2V2ZXJlIHBlcmZvcm1hbmNlIHBlbmFsdHkuXG4gICAgICAvLyBJbiBFUzUgYnVuZGxlcyB0aGUgb2JqZWN0IHNwcmVhZCBvcGVyYXRvciBpcyB0cmFuc2xhdGVkIGludG8gdGhlIGBfX2Fzc2lnbmAgaGVscGVyLCB3aGljaFxuICAgICAgLy8gaXMgbm90IG9wdGltaXplZCBieSBWTXMgYXMgZWZmaWNpZW50bHkgYXMgYSByYXcgb2JqZWN0IGxpdGVyYWwuIFNpbmNlIHRoaXMgY29uc3RydWN0b3IgaXNcbiAgICAgIC8vIGNhbGxlZCBpbiB0aWdodCBsb29wcywgdGhpcyBkaWZmZXJlbmNlIG1hdHRlcnMuXG4gICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICBwZWVrOiBzdGF0ZS5wZWVrLFxuICAgICAgICBvZmZzZXQ6IHN0YXRlLm9mZnNldCxcbiAgICAgICAgbGluZTogc3RhdGUubGluZSxcbiAgICAgICAgY29sdW1uOiBzdGF0ZS5jb2x1bW4sXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXJhbmdlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICdQcm9ncmFtbWluZyBlcnJvcjogdGhlIHJhbmdlIGFyZ3VtZW50IG11c3QgYmUgcHJvdmlkZWQgd2l0aCBhIGZpbGUgYXJndW1lbnQuJyk7XG4gICAgICB9XG4gICAgICB0aGlzLmZpbGUgPSBmaWxlT3JDdXJzb3I7XG4gICAgICB0aGlzLmlucHV0ID0gZmlsZU9yQ3Vyc29yLmNvbnRlbnQ7XG4gICAgICB0aGlzLmVuZCA9IHJhbmdlLmVuZFBvcztcbiAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgIHBlZWs6IC0xLFxuICAgICAgICBvZmZzZXQ6IHJhbmdlLnN0YXJ0UG9zLFxuICAgICAgICBsaW5lOiByYW5nZS5zdGFydExpbmUsXG4gICAgICAgIGNvbHVtbjogcmFuZ2Uuc3RhcnRDb2wsXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIGNsb25lKCk6IFBsYWluQ2hhcmFjdGVyQ3Vyc29yIHtcbiAgICByZXR1cm4gbmV3IFBsYWluQ2hhcmFjdGVyQ3Vyc29yKHRoaXMpO1xuICB9XG5cbiAgcGVlaygpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5wZWVrO1xuICB9XG4gIGNoYXJzTGVmdCgpIHtcbiAgICByZXR1cm4gdGhpcy5lbmQgLSB0aGlzLnN0YXRlLm9mZnNldDtcbiAgfVxuICBkaWZmKG90aGVyOiB0aGlzKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUub2Zmc2V0IC0gb3RoZXIuc3RhdGUub2Zmc2V0O1xuICB9XG5cbiAgYWR2YW5jZSgpOiB2b2lkIHtcbiAgICB0aGlzLmFkdmFuY2VTdGF0ZSh0aGlzLnN0YXRlKTtcbiAgfVxuXG4gIGluaXQoKTogdm9pZCB7XG4gICAgdGhpcy51cGRhdGVQZWVrKHRoaXMuc3RhdGUpO1xuICB9XG5cbiAgZ2V0U3BhbihzdGFydD86IHRoaXMsIGxlYWRpbmdUcml2aWFDb2RlUG9pbnRzPzogbnVtYmVyW10pOiBQYXJzZVNvdXJjZVNwYW4ge1xuICAgIHN0YXJ0ID0gc3RhcnQgfHwgdGhpcztcbiAgICBsZXQgZnVsbFN0YXJ0ID0gc3RhcnQ7XG4gICAgaWYgKGxlYWRpbmdUcml2aWFDb2RlUG9pbnRzKSB7XG4gICAgICB3aGlsZSAodGhpcy5kaWZmKHN0YXJ0KSA+IDAgJiYgbGVhZGluZ1RyaXZpYUNvZGVQb2ludHMuaW5kZXhPZihzdGFydC5wZWVrKCkpICE9PSAtMSkge1xuICAgICAgICBpZiAoZnVsbFN0YXJ0ID09PSBzdGFydCkge1xuICAgICAgICAgIHN0YXJ0ID0gc3RhcnQuY2xvbmUoKSBhcyB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHN0YXJ0LmFkdmFuY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgc3RhcnRMb2NhdGlvbiA9IHRoaXMubG9jYXRpb25Gcm9tQ3Vyc29yKHN0YXJ0KTtcbiAgICBjb25zdCBlbmRMb2NhdGlvbiA9IHRoaXMubG9jYXRpb25Gcm9tQ3Vyc29yKHRoaXMpO1xuICAgIGNvbnN0IGZ1bGxTdGFydExvY2F0aW9uID1cbiAgICAgICAgZnVsbFN0YXJ0ICE9PSBzdGFydCA/IHRoaXMubG9jYXRpb25Gcm9tQ3Vyc29yKGZ1bGxTdGFydCkgOiBzdGFydExvY2F0aW9uO1xuICAgIHJldHVybiBuZXcgUGFyc2VTb3VyY2VTcGFuKHN0YXJ0TG9jYXRpb24sIGVuZExvY2F0aW9uLCBmdWxsU3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBnZXRDaGFycyhzdGFydDogdGhpcyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuaW5wdXQuc3Vic3RyaW5nKHN0YXJ0LnN0YXRlLm9mZnNldCwgdGhpcy5zdGF0ZS5vZmZzZXQpO1xuICB9XG5cbiAgY2hhckF0KHBvczogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5pbnB1dC5jaGFyQ29kZUF0KHBvcyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYWR2YW5jZVN0YXRlKHN0YXRlOiBDdXJzb3JTdGF0ZSkge1xuICAgIGlmIChzdGF0ZS5vZmZzZXQgPj0gdGhpcy5lbmQpIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICAgIHRocm93IG5ldyBDdXJzb3JFcnJvcignVW5leHBlY3RlZCBjaGFyYWN0ZXIgXCJFT0ZcIicsIHRoaXMpO1xuICAgIH1cbiAgICBjb25zdCBjdXJyZW50Q2hhciA9IHRoaXMuY2hhckF0KHN0YXRlLm9mZnNldCk7XG4gICAgaWYgKGN1cnJlbnRDaGFyID09PSBjaGFycy4kTEYpIHtcbiAgICAgIHN0YXRlLmxpbmUrKztcbiAgICAgIHN0YXRlLmNvbHVtbiA9IDA7XG4gICAgfSBlbHNlIGlmICghY2hhcnMuaXNOZXdMaW5lKGN1cnJlbnRDaGFyKSkge1xuICAgICAgc3RhdGUuY29sdW1uKys7XG4gICAgfVxuICAgIHN0YXRlLm9mZnNldCsrO1xuICAgIHRoaXMudXBkYXRlUGVlayhzdGF0ZSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgdXBkYXRlUGVlayhzdGF0ZTogQ3Vyc29yU3RhdGUpOiB2b2lkIHtcbiAgICBzdGF0ZS5wZWVrID0gc3RhdGUub2Zmc2V0ID49IHRoaXMuZW5kID8gY2hhcnMuJEVPRiA6IHRoaXMuY2hhckF0KHN0YXRlLm9mZnNldCk7XG4gIH1cblxuICBwcml2YXRlIGxvY2F0aW9uRnJvbUN1cnNvcihjdXJzb3I6IHRoaXMpOiBQYXJzZUxvY2F0aW9uIHtcbiAgICByZXR1cm4gbmV3IFBhcnNlTG9jYXRpb24oXG4gICAgICAgIGN1cnNvci5maWxlLCBjdXJzb3Iuc3RhdGUub2Zmc2V0LCBjdXJzb3Iuc3RhdGUubGluZSwgY3Vyc29yLnN0YXRlLmNvbHVtbik7XG4gIH1cbn1cblxuY2xhc3MgRXNjYXBlZENoYXJhY3RlckN1cnNvciBleHRlbmRzIFBsYWluQ2hhcmFjdGVyQ3Vyc29yIHtcbiAgcHJvdGVjdGVkIGludGVybmFsU3RhdGU6IEN1cnNvclN0YXRlO1xuXG4gIGNvbnN0cnVjdG9yKGZpbGVPckN1cnNvcjogRXNjYXBlZENoYXJhY3RlckN1cnNvcik7XG4gIGNvbnN0cnVjdG9yKGZpbGVPckN1cnNvcjogUGFyc2VTb3VyY2VGaWxlLCByYW5nZTogTGV4ZXJSYW5nZSk7XG4gIGNvbnN0cnVjdG9yKGZpbGVPckN1cnNvcjogUGFyc2VTb3VyY2VGaWxlfEVzY2FwZWRDaGFyYWN0ZXJDdXJzb3IsIHJhbmdlPzogTGV4ZXJSYW5nZSkge1xuICAgIGlmIChmaWxlT3JDdXJzb3IgaW5zdGFuY2VvZiBFc2NhcGVkQ2hhcmFjdGVyQ3Vyc29yKSB7XG4gICAgICBzdXBlcihmaWxlT3JDdXJzb3IpO1xuICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gey4uLmZpbGVPckN1cnNvci5pbnRlcm5hbFN0YXRlfTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3VwZXIoZmlsZU9yQ3Vyc29yLCByYW5nZSEpO1xuICAgICAgdGhpcy5pbnRlcm5hbFN0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBhZHZhbmNlKCk6IHZvaWQge1xuICAgIHRoaXMuc3RhdGUgPSB0aGlzLmludGVybmFsU3RhdGU7XG4gICAgc3VwZXIuYWR2YW5jZSgpO1xuICAgIHRoaXMucHJvY2Vzc0VzY2FwZVNlcXVlbmNlKCk7XG4gIH1cblxuICBvdmVycmlkZSBpbml0KCk6IHZvaWQge1xuICAgIHN1cGVyLmluaXQoKTtcbiAgICB0aGlzLnByb2Nlc3NFc2NhcGVTZXF1ZW5jZSgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgY2xvbmUoKTogRXNjYXBlZENoYXJhY3RlckN1cnNvciB7XG4gICAgcmV0dXJuIG5ldyBFc2NhcGVkQ2hhcmFjdGVyQ3Vyc29yKHRoaXMpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0Q2hhcnMoc3RhcnQ6IHRoaXMpOiBzdHJpbmcge1xuICAgIGNvbnN0IGN1cnNvciA9IHN0YXJ0LmNsb25lKCk7XG4gICAgbGV0IGNoYXJzID0gJyc7XG4gICAgd2hpbGUgKGN1cnNvci5pbnRlcm5hbFN0YXRlLm9mZnNldCA8IHRoaXMuaW50ZXJuYWxTdGF0ZS5vZmZzZXQpIHtcbiAgICAgIGNoYXJzICs9IFN0cmluZy5mcm9tQ29kZVBvaW50KGN1cnNvci5wZWVrKCkpO1xuICAgICAgY3Vyc29yLmFkdmFuY2UoKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoYXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb2Nlc3MgdGhlIGVzY2FwZSBzZXF1ZW5jZSB0aGF0IHN0YXJ0cyBhdCB0aGUgY3VycmVudCBwb3NpdGlvbiBpbiB0aGUgdGV4dC5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIHRvIGVuc3VyZSB0aGF0IGBwZWVrYCBoYXMgdGhlIHVuZXNjYXBlZCB2YWx1ZSBvZiBlc2NhcGUgc2VxdWVuY2VzLlxuICAgKi9cbiAgcHJvdGVjdGVkIHByb2Nlc3NFc2NhcGVTZXF1ZW5jZSgpOiB2b2lkIHtcbiAgICBjb25zdCBwZWVrID0gKCkgPT4gdGhpcy5pbnRlcm5hbFN0YXRlLnBlZWs7XG5cbiAgICBpZiAocGVlaygpID09PSBjaGFycy4kQkFDS1NMQVNIKSB7XG4gICAgICAvLyBXZSBoYXZlIGhpdCBhbiBlc2NhcGUgc2VxdWVuY2Ugc28gd2UgbmVlZCB0aGUgaW50ZXJuYWwgc3RhdGUgdG8gYmVjb21lIGluZGVwZW5kZW50XG4gICAgICAvLyBvZiB0aGUgZXh0ZXJuYWwgc3RhdGUuXG4gICAgICB0aGlzLmludGVybmFsU3RhdGUgPSB7Li4udGhpcy5zdGF0ZX07XG5cbiAgICAgIC8vIE1vdmUgcGFzdCB0aGUgYmFja3NsYXNoXG4gICAgICB0aGlzLmFkdmFuY2VTdGF0ZSh0aGlzLmludGVybmFsU3RhdGUpO1xuXG4gICAgICAvLyBGaXJzdCBjaGVjayBmb3Igc3RhbmRhcmQgY29udHJvbCBjaGFyIHNlcXVlbmNlc1xuICAgICAgaWYgKHBlZWsoKSA9PT0gY2hhcnMuJG4pIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5wZWVrID0gY2hhcnMuJExGO1xuICAgICAgfSBlbHNlIGlmIChwZWVrKCkgPT09IGNoYXJzLiRyKSB7XG4gICAgICAgIHRoaXMuc3RhdGUucGVlayA9IGNoYXJzLiRDUjtcbiAgICAgIH0gZWxzZSBpZiAocGVlaygpID09PSBjaGFycy4kdikge1xuICAgICAgICB0aGlzLnN0YXRlLnBlZWsgPSBjaGFycy4kVlRBQjtcbiAgICAgIH0gZWxzZSBpZiAocGVlaygpID09PSBjaGFycy4kdCkge1xuICAgICAgICB0aGlzLnN0YXRlLnBlZWsgPSBjaGFycy4kVEFCO1xuICAgICAgfSBlbHNlIGlmIChwZWVrKCkgPT09IGNoYXJzLiRiKSB7XG4gICAgICAgIHRoaXMuc3RhdGUucGVlayA9IGNoYXJzLiRCU1BBQ0U7XG4gICAgICB9IGVsc2UgaWYgKHBlZWsoKSA9PT0gY2hhcnMuJGYpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5wZWVrID0gY2hhcnMuJEZGO1xuICAgICAgfVxuXG4gICAgICAvLyBOb3cgY29uc2lkZXIgbW9yZSBjb21wbGV4IHNlcXVlbmNlc1xuICAgICAgZWxzZSBpZiAocGVlaygpID09PSBjaGFycy4kdSkge1xuICAgICAgICAvLyBVbmljb2RlIGNvZGUtcG9pbnQgc2VxdWVuY2VcbiAgICAgICAgdGhpcy5hZHZhbmNlU3RhdGUodGhpcy5pbnRlcm5hbFN0YXRlKTsgIC8vIGFkdmFuY2UgcGFzdCB0aGUgYHVgIGNoYXJcbiAgICAgICAgaWYgKHBlZWsoKSA9PT0gY2hhcnMuJExCUkFDRSkge1xuICAgICAgICAgIC8vIFZhcmlhYmxlIGxlbmd0aCBVbmljb2RlLCBlLmcuIGBcXHh7MTIzfWBcbiAgICAgICAgICB0aGlzLmFkdmFuY2VTdGF0ZSh0aGlzLmludGVybmFsU3RhdGUpOyAgLy8gYWR2YW5jZSBwYXN0IHRoZSBge2AgY2hhclxuICAgICAgICAgIC8vIEFkdmFuY2UgcGFzdCB0aGUgdmFyaWFibGUgbnVtYmVyIG9mIGhleCBkaWdpdHMgdW50aWwgd2UgaGl0IGEgYH1gIGNoYXJcbiAgICAgICAgICBjb25zdCBkaWdpdFN0YXJ0ID0gdGhpcy5jbG9uZSgpO1xuICAgICAgICAgIGxldCBsZW5ndGggPSAwO1xuICAgICAgICAgIHdoaWxlIChwZWVrKCkgIT09IGNoYXJzLiRSQlJBQ0UpIHtcbiAgICAgICAgICAgIHRoaXMuYWR2YW5jZVN0YXRlKHRoaXMuaW50ZXJuYWxTdGF0ZSk7XG4gICAgICAgICAgICBsZW5ndGgrKztcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zdGF0ZS5wZWVrID0gdGhpcy5kZWNvZGVIZXhEaWdpdHMoZGlnaXRTdGFydCwgbGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBGaXhlZCBsZW5ndGggVW5pY29kZSwgZS5nLiBgXFx1MTIzNGBcbiAgICAgICAgICBjb25zdCBkaWdpdFN0YXJ0ID0gdGhpcy5jbG9uZSgpO1xuICAgICAgICAgIHRoaXMuYWR2YW5jZVN0YXRlKHRoaXMuaW50ZXJuYWxTdGF0ZSk7XG4gICAgICAgICAgdGhpcy5hZHZhbmNlU3RhdGUodGhpcy5pbnRlcm5hbFN0YXRlKTtcbiAgICAgICAgICB0aGlzLmFkdmFuY2VTdGF0ZSh0aGlzLmludGVybmFsU3RhdGUpO1xuICAgICAgICAgIHRoaXMuc3RhdGUucGVlayA9IHRoaXMuZGVjb2RlSGV4RGlnaXRzKGRpZ2l0U3RhcnQsIDQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGVsc2UgaWYgKHBlZWsoKSA9PT0gY2hhcnMuJHgpIHtcbiAgICAgICAgLy8gSGV4IGNoYXIgY29kZSwgZS5nLiBgXFx4MkZgXG4gICAgICAgIHRoaXMuYWR2YW5jZVN0YXRlKHRoaXMuaW50ZXJuYWxTdGF0ZSk7ICAvLyBhZHZhbmNlIHBhc3QgdGhlIGB4YCBjaGFyXG4gICAgICAgIGNvbnN0IGRpZ2l0U3RhcnQgPSB0aGlzLmNsb25lKCk7XG4gICAgICAgIHRoaXMuYWR2YW5jZVN0YXRlKHRoaXMuaW50ZXJuYWxTdGF0ZSk7XG4gICAgICAgIHRoaXMuc3RhdGUucGVlayA9IHRoaXMuZGVjb2RlSGV4RGlnaXRzKGRpZ2l0U3RhcnQsIDIpO1xuICAgICAgfVxuXG4gICAgICBlbHNlIGlmIChjaGFycy5pc09jdGFsRGlnaXQocGVlaygpKSkge1xuICAgICAgICAvLyBPY3RhbCBjaGFyIGNvZGUsIGUuZy4gYFxcMDEyYCxcbiAgICAgICAgbGV0IG9jdGFsID0gJyc7XG4gICAgICAgIGxldCBsZW5ndGggPSAwO1xuICAgICAgICBsZXQgcHJldmlvdXMgPSB0aGlzLmNsb25lKCk7XG4gICAgICAgIHdoaWxlIChjaGFycy5pc09jdGFsRGlnaXQocGVlaygpKSAmJiBsZW5ndGggPCAzKSB7XG4gICAgICAgICAgcHJldmlvdXMgPSB0aGlzLmNsb25lKCk7XG4gICAgICAgICAgb2N0YWwgKz0gU3RyaW5nLmZyb21Db2RlUG9pbnQocGVlaygpKTtcbiAgICAgICAgICB0aGlzLmFkdmFuY2VTdGF0ZSh0aGlzLmludGVybmFsU3RhdGUpO1xuICAgICAgICAgIGxlbmd0aCsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhdGUucGVlayA9IHBhcnNlSW50KG9jdGFsLCA4KTtcbiAgICAgICAgLy8gQmFja3VwIG9uZSBjaGFyXG4gICAgICAgIHRoaXMuaW50ZXJuYWxTdGF0ZSA9IHByZXZpb3VzLmludGVybmFsU3RhdGU7XG4gICAgICB9XG5cbiAgICAgIGVsc2UgaWYgKGNoYXJzLmlzTmV3TGluZSh0aGlzLmludGVybmFsU3RhdGUucGVlaykpIHtcbiAgICAgICAgLy8gTGluZSBjb250aW51YXRpb24gYFxcYCBmb2xsb3dlZCBieSBhIG5ldyBsaW5lXG4gICAgICAgIHRoaXMuYWR2YW5jZVN0YXRlKHRoaXMuaW50ZXJuYWxTdGF0ZSk7ICAvLyBhZHZhbmNlIG92ZXIgdGhlIG5ld2xpbmVcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMuaW50ZXJuYWxTdGF0ZTtcbiAgICAgIH1cblxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIElmIG5vbmUgb2YgdGhlIGBpZmAgYmxvY2tzIHdlcmUgZXhlY3V0ZWQgdGhlbiB3ZSBqdXN0IGhhdmUgYW4gZXNjYXBlZCBub3JtYWwgY2hhcmFjdGVyLlxuICAgICAgICAvLyBJbiB0aGF0IGNhc2Ugd2UganVzdCwgZWZmZWN0aXZlbHksIHNraXAgdGhlIGJhY2tzbGFzaCBmcm9tIHRoZSBjaGFyYWN0ZXIuXG4gICAgICAgIHRoaXMuc3RhdGUucGVlayA9IHRoaXMuaW50ZXJuYWxTdGF0ZS5wZWVrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBkZWNvZGVIZXhEaWdpdHMoc3RhcnQ6IEVzY2FwZWRDaGFyYWN0ZXJDdXJzb3IsIGxlbmd0aDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBoZXggPSB0aGlzLmlucHV0LnNsaWNlKHN0YXJ0LmludGVybmFsU3RhdGUub2Zmc2V0LCBzdGFydC5pbnRlcm5hbFN0YXRlLm9mZnNldCArIGxlbmd0aCk7XG4gICAgY29uc3QgY2hhckNvZGUgPSBwYXJzZUludChoZXgsIDE2KTtcbiAgICBpZiAoIWlzTmFOKGNoYXJDb2RlKSkge1xuICAgICAgcmV0dXJuIGNoYXJDb2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydC5zdGF0ZSA9IHN0YXJ0LmludGVybmFsU3RhdGU7XG4gICAgICB0aHJvdyBuZXcgQ3Vyc29yRXJyb3IoJ0ludmFsaWQgaGV4YWRlY2ltYWwgZXNjYXBlIHNlcXVlbmNlJywgc3RhcnQpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ3Vyc29yRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbXNnOiBzdHJpbmcsIHB1YmxpYyBjdXJzb3I6IENoYXJhY3RlckN1cnNvcikge31cbn1cbiJdfQ==