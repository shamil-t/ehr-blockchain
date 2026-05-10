/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ParseError, ParseSourceSpan } from '../parse_util';
import * as html from './ast';
import { NAMED_ENTITIES } from './entities';
import { tokenize } from './lexer';
import { getNsPrefix, mergeNsAndName, splitNsName } from './tags';
export class TreeError extends ParseError {
    static create(elementName, span, msg) {
        return new TreeError(elementName, span, msg);
    }
    constructor(elementName, span, msg) {
        super(span, msg);
        this.elementName = elementName;
    }
}
export class ParseTreeResult {
    constructor(rootNodes, errors) {
        this.rootNodes = rootNodes;
        this.errors = errors;
    }
}
export class Parser {
    constructor(getTagDefinition) {
        this.getTagDefinition = getTagDefinition;
    }
    parse(source, url, options) {
        const tokenizeResult = tokenize(source, url, this.getTagDefinition, options);
        const parser = new _TreeBuilder(tokenizeResult.tokens, this.getTagDefinition);
        parser.build();
        return new ParseTreeResult(parser.rootNodes, tokenizeResult.errors.concat(parser.errors));
    }
}
class _TreeBuilder {
    constructor(tokens, getTagDefinition) {
        this.tokens = tokens;
        this.getTagDefinition = getTagDefinition;
        this._index = -1;
        this._containerStack = [];
        this.rootNodes = [];
        this.errors = [];
        this._advance();
    }
    build() {
        while (this._peek.type !== 24 /* TokenType.EOF */) {
            if (this._peek.type === 0 /* TokenType.TAG_OPEN_START */ ||
                this._peek.type === 4 /* TokenType.INCOMPLETE_TAG_OPEN */) {
                this._consumeStartTag(this._advance());
            }
            else if (this._peek.type === 3 /* TokenType.TAG_CLOSE */) {
                this._consumeEndTag(this._advance());
            }
            else if (this._peek.type === 12 /* TokenType.CDATA_START */) {
                this._closeVoidElement();
                this._consumeCdata(this._advance());
            }
            else if (this._peek.type === 10 /* TokenType.COMMENT_START */) {
                this._closeVoidElement();
                this._consumeComment(this._advance());
            }
            else if (this._peek.type === 5 /* TokenType.TEXT */ || this._peek.type === 7 /* TokenType.RAW_TEXT */ ||
                this._peek.type === 6 /* TokenType.ESCAPABLE_RAW_TEXT */) {
                this._closeVoidElement();
                this._consumeText(this._advance());
            }
            else if (this._peek.type === 19 /* TokenType.EXPANSION_FORM_START */) {
                this._consumeExpansion(this._advance());
            }
            else if (this._peek.type === 25 /* TokenType.BLOCK_GROUP_OPEN_START */) {
                this._closeVoidElement();
                this._consumeBlockGroupOpen(this._advance());
            }
            else if (this._peek.type === 29 /* TokenType.BLOCK_OPEN_START */) {
                this._closeVoidElement();
                this._consumeBlock(this._advance(), 30 /* TokenType.BLOCK_OPEN_END */);
            }
            else if (this._peek.type === 27 /* TokenType.BLOCK_GROUP_CLOSE */) {
                this._closeVoidElement();
                this._consumeBlockGroupClose(this._advance());
            }
            else {
                // Skip all other tokens...
                this._advance();
            }
        }
    }
    _advance() {
        const prev = this._peek;
        if (this._index < this.tokens.length - 1) {
            // Note: there is always an EOF token at the end
            this._index++;
        }
        this._peek = this.tokens[this._index];
        return prev;
    }
    _advanceIf(type) {
        if (this._peek.type === type) {
            return this._advance();
        }
        return null;
    }
    _consumeCdata(_startToken) {
        this._consumeText(this._advance());
        this._advanceIf(13 /* TokenType.CDATA_END */);
    }
    _consumeComment(token) {
        const text = this._advanceIf(7 /* TokenType.RAW_TEXT */);
        const endToken = this._advanceIf(11 /* TokenType.COMMENT_END */);
        const value = text != null ? text.parts[0].trim() : null;
        const sourceSpan = endToken == null ?
            token.sourceSpan :
            new ParseSourceSpan(token.sourceSpan.start, endToken.sourceSpan.end, token.sourceSpan.fullStart);
        this._addToParent(new html.Comment(value, sourceSpan));
    }
    _consumeExpansion(token) {
        const switchValue = this._advance();
        const type = this._advance();
        const cases = [];
        // read =
        while (this._peek.type === 20 /* TokenType.EXPANSION_CASE_VALUE */) {
            const expCase = this._parseExpansionCase();
            if (!expCase)
                return; // error
            cases.push(expCase);
        }
        // read the final }
        if (this._peek.type !== 23 /* TokenType.EXPANSION_FORM_END */) {
            this.errors.push(TreeError.create(null, this._peek.sourceSpan, `Invalid ICU message. Missing '}'.`));
            return;
        }
        const sourceSpan = new ParseSourceSpan(token.sourceSpan.start, this._peek.sourceSpan.end, token.sourceSpan.fullStart);
        this._addToParent(new html.Expansion(switchValue.parts[0], type.parts[0], cases, sourceSpan, switchValue.sourceSpan));
        this._advance();
    }
    _parseExpansionCase() {
        const value = this._advance();
        // read {
        if (this._peek.type !== 21 /* TokenType.EXPANSION_CASE_EXP_START */) {
            this.errors.push(TreeError.create(null, this._peek.sourceSpan, `Invalid ICU message. Missing '{'.`));
            return null;
        }
        // read until }
        const start = this._advance();
        const exp = this._collectExpansionExpTokens(start);
        if (!exp)
            return null;
        const end = this._advance();
        exp.push({ type: 24 /* TokenType.EOF */, parts: [], sourceSpan: end.sourceSpan });
        // parse everything in between { and }
        const expansionCaseParser = new _TreeBuilder(exp, this.getTagDefinition);
        expansionCaseParser.build();
        if (expansionCaseParser.errors.length > 0) {
            this.errors = this.errors.concat(expansionCaseParser.errors);
            return null;
        }
        const sourceSpan = new ParseSourceSpan(value.sourceSpan.start, end.sourceSpan.end, value.sourceSpan.fullStart);
        const expSourceSpan = new ParseSourceSpan(start.sourceSpan.start, end.sourceSpan.end, start.sourceSpan.fullStart);
        return new html.ExpansionCase(value.parts[0], expansionCaseParser.rootNodes, sourceSpan, value.sourceSpan, expSourceSpan);
    }
    _collectExpansionExpTokens(start) {
        const exp = [];
        const expansionFormStack = [21 /* TokenType.EXPANSION_CASE_EXP_START */];
        while (true) {
            if (this._peek.type === 19 /* TokenType.EXPANSION_FORM_START */ ||
                this._peek.type === 21 /* TokenType.EXPANSION_CASE_EXP_START */) {
                expansionFormStack.push(this._peek.type);
            }
            if (this._peek.type === 22 /* TokenType.EXPANSION_CASE_EXP_END */) {
                if (lastOnStack(expansionFormStack, 21 /* TokenType.EXPANSION_CASE_EXP_START */)) {
                    expansionFormStack.pop();
                    if (expansionFormStack.length === 0)
                        return exp;
                }
                else {
                    this.errors.push(TreeError.create(null, start.sourceSpan, `Invalid ICU message. Missing '}'.`));
                    return null;
                }
            }
            if (this._peek.type === 23 /* TokenType.EXPANSION_FORM_END */) {
                if (lastOnStack(expansionFormStack, 19 /* TokenType.EXPANSION_FORM_START */)) {
                    expansionFormStack.pop();
                }
                else {
                    this.errors.push(TreeError.create(null, start.sourceSpan, `Invalid ICU message. Missing '}'.`));
                    return null;
                }
            }
            if (this._peek.type === 24 /* TokenType.EOF */) {
                this.errors.push(TreeError.create(null, start.sourceSpan, `Invalid ICU message. Missing '}'.`));
                return null;
            }
            exp.push(this._advance());
        }
    }
    _consumeText(token) {
        const tokens = [token];
        const startSpan = token.sourceSpan;
        let text = token.parts[0];
        if (text.length > 0 && text[0] === '\n') {
            const parent = this._getContainer();
            // This is unlikely to happen, but we have an assertion just in case.
            if (parent instanceof html.BlockGroup) {
                this.errors.push(TreeError.create(null, startSpan, 'Text cannot be placed directly inside of a block group.'));
                return null;
            }
            if (parent != null && parent.children.length === 0 &&
                this.getTagDefinition(parent.name).ignoreFirstLf) {
                text = text.substring(1);
                tokens[0] = { type: token.type, sourceSpan: token.sourceSpan, parts: [text] };
            }
        }
        while (this._peek.type === 8 /* TokenType.INTERPOLATION */ || this._peek.type === 5 /* TokenType.TEXT */ ||
            this._peek.type === 9 /* TokenType.ENCODED_ENTITY */) {
            token = this._advance();
            tokens.push(token);
            if (token.type === 8 /* TokenType.INTERPOLATION */) {
                // For backward compatibility we decode HTML entities that appear in interpolation
                // expressions. This is arguably a bug, but it could be a considerable breaking change to
                // fix it. It should be addressed in a larger project to refactor the entire parser/lexer
                // chain after View Engine has been removed.
                text += token.parts.join('').replace(/&([^;]+);/g, decodeEntity);
            }
            else if (token.type === 9 /* TokenType.ENCODED_ENTITY */) {
                text += token.parts[0];
            }
            else {
                text += token.parts.join('');
            }
        }
        if (text.length > 0) {
            const endSpan = token.sourceSpan;
            this._addToParent(new html.Text(text, new ParseSourceSpan(startSpan.start, endSpan.end, startSpan.fullStart, startSpan.details), tokens));
        }
    }
    _closeVoidElement() {
        const el = this._getContainer();
        if (el instanceof html.Element && this.getTagDefinition(el.name).isVoid) {
            this._containerStack.pop();
        }
    }
    _consumeStartTag(startTagToken) {
        const [prefix, name] = startTagToken.parts;
        const attrs = [];
        while (this._peek.type === 14 /* TokenType.ATTR_NAME */) {
            attrs.push(this._consumeAttr(this._advance()));
        }
        const fullName = this._getElementFullName(prefix, name, this._getClosestParentElement());
        let selfClosing = false;
        // Note: There could have been a tokenizer error
        // so that we don't get a token for the end tag...
        if (this._peek.type === 2 /* TokenType.TAG_OPEN_END_VOID */) {
            this._advance();
            selfClosing = true;
            const tagDef = this.getTagDefinition(fullName);
            if (!(tagDef.canSelfClose || getNsPrefix(fullName) !== null || tagDef.isVoid)) {
                this.errors.push(TreeError.create(fullName, startTagToken.sourceSpan, `Only void, custom and foreign elements can be self closed "${startTagToken.parts[1]}"`));
            }
        }
        else if (this._peek.type === 1 /* TokenType.TAG_OPEN_END */) {
            this._advance();
            selfClosing = false;
        }
        const end = this._peek.sourceSpan.fullStart;
        const span = new ParseSourceSpan(startTagToken.sourceSpan.start, end, startTagToken.sourceSpan.fullStart);
        // Create a separate `startSpan` because `span` will be modified when there is an `end` span.
        const startSpan = new ParseSourceSpan(startTagToken.sourceSpan.start, end, startTagToken.sourceSpan.fullStart);
        const el = new html.Element(fullName, attrs, [], span, startSpan, undefined);
        const parentEl = this._getContainer();
        this._pushContainer(el, parentEl instanceof html.Element &&
            this.getTagDefinition(parentEl.name).isClosedByChild(el.name));
        if (selfClosing) {
            // Elements that are self-closed have their `endSourceSpan` set to the full span, as the
            // element start tag also represents the end tag.
            this._popContainer(fullName, html.Element, span);
        }
        else if (startTagToken.type === 4 /* TokenType.INCOMPLETE_TAG_OPEN */) {
            // We already know the opening tag is not complete, so it is unlikely it has a corresponding
            // close tag. Let's optimistically parse it as a full element and emit an error.
            this._popContainer(fullName, html.Element, null);
            this.errors.push(TreeError.create(fullName, span, `Opening tag "${fullName}" not terminated.`));
        }
    }
    _pushContainer(node, isClosedByChild) {
        if (isClosedByChild) {
            this._containerStack.pop();
        }
        this._addToParent(node);
        this._containerStack.push(node);
    }
    _consumeEndTag(endTagToken) {
        const fullName = this._getElementFullName(endTagToken.parts[0], endTagToken.parts[1], this._getClosestParentElement());
        if (this.getTagDefinition(fullName).isVoid) {
            this.errors.push(TreeError.create(fullName, endTagToken.sourceSpan, `Void elements do not have end tags "${endTagToken.parts[1]}"`));
        }
        else if (!this._popContainer(fullName, html.Element, endTagToken.sourceSpan)) {
            const errMsg = `Unexpected closing tag "${fullName}". It may happen when the tag has already been closed by another tag. For more info see https://www.w3.org/TR/html5/syntax.html#closing-elements-that-have-implied-end-tags`;
            this.errors.push(TreeError.create(fullName, endTagToken.sourceSpan, errMsg));
        }
    }
    /**
     * Closes the nearest element with the tag name `fullName` in the parse tree.
     * `endSourceSpan` is the span of the closing tag, or null if the element does
     * not have a closing tag (for example, this happens when an incomplete
     * opening tag is recovered).
     */
    _popContainer(fullName, expectedType, endSourceSpan) {
        let unexpectedCloseTagDetected = false;
        for (let stackIndex = this._containerStack.length - 1; stackIndex >= 0; stackIndex--) {
            const node = this._containerStack[stackIndex];
            const name = node instanceof html.BlockGroup ? node.blocks[0]?.name : node.name;
            if (name === fullName && node instanceof expectedType) {
                // Record the parse span with the element that is being closed. Any elements that are
                // removed from the element stack at this point are closed implicitly, so they won't get
                // an end source span (as there is no explicit closing element).
                node.endSourceSpan = endSourceSpan;
                node.sourceSpan.end = endSourceSpan !== null ? endSourceSpan.end : node.sourceSpan.end;
                this._containerStack.splice(stackIndex, this._containerStack.length - stackIndex);
                return !unexpectedCloseTagDetected;
            }
            // Blocks are self-closing while block groups and (most times) elements are not.
            if (node instanceof html.BlockGroup ||
                node instanceof html.Element && !this.getTagDefinition(node.name).closedByParent) {
                // Note that we encountered an unexpected close tag but continue processing the element
                // stack so we can assign an `endSourceSpan` if there is a corresponding start tag for this
                // end tag in the stack.
                unexpectedCloseTagDetected = true;
            }
        }
        return false;
    }
    _consumeAttr(attrName) {
        const fullName = mergeNsAndName(attrName.parts[0], attrName.parts[1]);
        let attrEnd = attrName.sourceSpan.end;
        // Consume any quote
        if (this._peek.type === 15 /* TokenType.ATTR_QUOTE */) {
            this._advance();
        }
        // Consume the attribute value
        let value = '';
        const valueTokens = [];
        let valueStartSpan = undefined;
        let valueEnd = undefined;
        // NOTE: We need to use a new variable `nextTokenType` here to hide the actual type of
        // `_peek.type` from TS. Otherwise TS will narrow the type of `_peek.type` preventing it from
        // being able to consider `ATTR_VALUE_INTERPOLATION` as an option. This is because TS is not
        // able to see that `_advance()` will actually mutate `_peek`.
        const nextTokenType = this._peek.type;
        if (nextTokenType === 16 /* TokenType.ATTR_VALUE_TEXT */) {
            valueStartSpan = this._peek.sourceSpan;
            valueEnd = this._peek.sourceSpan.end;
            while (this._peek.type === 16 /* TokenType.ATTR_VALUE_TEXT */ ||
                this._peek.type === 17 /* TokenType.ATTR_VALUE_INTERPOLATION */ ||
                this._peek.type === 9 /* TokenType.ENCODED_ENTITY */) {
                const valueToken = this._advance();
                valueTokens.push(valueToken);
                if (valueToken.type === 17 /* TokenType.ATTR_VALUE_INTERPOLATION */) {
                    // For backward compatibility we decode HTML entities that appear in interpolation
                    // expressions. This is arguably a bug, but it could be a considerable breaking change to
                    // fix it. It should be addressed in a larger project to refactor the entire parser/lexer
                    // chain after View Engine has been removed.
                    value += valueToken.parts.join('').replace(/&([^;]+);/g, decodeEntity);
                }
                else if (valueToken.type === 9 /* TokenType.ENCODED_ENTITY */) {
                    value += valueToken.parts[0];
                }
                else {
                    value += valueToken.parts.join('');
                }
                valueEnd = attrEnd = valueToken.sourceSpan.end;
            }
        }
        // Consume any quote
        if (this._peek.type === 15 /* TokenType.ATTR_QUOTE */) {
            const quoteToken = this._advance();
            attrEnd = quoteToken.sourceSpan.end;
        }
        const valueSpan = valueStartSpan && valueEnd &&
            new ParseSourceSpan(valueStartSpan.start, valueEnd, valueStartSpan.fullStart);
        return new html.Attribute(fullName, value, new ParseSourceSpan(attrName.sourceSpan.start, attrEnd, attrName.sourceSpan.fullStart), attrName.sourceSpan, valueSpan, valueTokens.length > 0 ? valueTokens : undefined, undefined);
    }
    _consumeBlockGroupOpen(token) {
        const end = this._peek.sourceSpan.fullStart;
        const span = new ParseSourceSpan(token.sourceSpan.start, end, token.sourceSpan.fullStart);
        // Create a separate `startSpan` because `span` will be modified when there is an `end` span.
        const startSpan = new ParseSourceSpan(token.sourceSpan.start, end, token.sourceSpan.fullStart);
        const blockGroup = new html.BlockGroup([], span, startSpan, null);
        this._pushContainer(blockGroup, false);
        const implicitBlock = this._consumeBlock(token, 26 /* TokenType.BLOCK_GROUP_OPEN_END */);
        // Block parameters are consumed as a part of the implicit block so we need to expand the
        // start source span once the block is parsed to include the full opening tag.
        startSpan.end = implicitBlock.startSourceSpan.end;
    }
    _consumeBlock(token, closeToken) {
        // The start of a block implicitly closes the previous block.
        this._conditionallyClosePreviousBlock();
        const parameters = [];
        while (this._peek.type === 28 /* TokenType.BLOCK_PARAMETER */) {
            const paramToken = this._advance();
            parameters.push(new html.BlockParameter(paramToken.parts[0], paramToken.sourceSpan));
        }
        if (this._peek.type === closeToken) {
            this._advance();
        }
        const end = this._peek.sourceSpan.fullStart;
        const span = new ParseSourceSpan(token.sourceSpan.start, end, token.sourceSpan.fullStart);
        // Create a separate `startSpan` because `span` will be modified when there is an `end` span.
        const startSpan = new ParseSourceSpan(token.sourceSpan.start, end, token.sourceSpan.fullStart);
        const block = new html.Block(token.parts[0], parameters, [], span, startSpan);
        const parent = this._getContainer();
        if (!(parent instanceof html.BlockGroup)) {
            this.errors.push(TreeError.create(block.name, block.sourceSpan, 'Blocks can only be placed inside of block groups.'));
        }
        else {
            parent.blocks.push(block);
            this._containerStack.push(block);
        }
        return block;
    }
    _consumeBlockGroupClose(token) {
        const name = token.parts[0];
        const previousContainer = this._getContainer();
        // Blocks are implcitly closed by the block group.
        this._conditionallyClosePreviousBlock();
        if (!this._popContainer(name, html.BlockGroup, token.sourceSpan)) {
            const context = previousContainer instanceof html.Element ?
                `There is an unclosed "${previousContainer.name}" HTML tag named that may have to be closed first.` :
                `The block may have been closed earlier.`;
            this.errors.push(TreeError.create(name, token.sourceSpan, `Unexpected closing block "${name}". ${context}`));
        }
    }
    _conditionallyClosePreviousBlock() {
        const container = this._getContainer();
        if (container instanceof html.Block) {
            // Blocks don't have an explicit closing tag, they're closed either by the next block or
            // the end of the block group. Infer the end span from the last child node.
            const lastChild = container.children.length ? container.children[container.children.length - 1] : null;
            const endSpan = lastChild === null ?
                null :
                new ParseSourceSpan(lastChild.sourceSpan.end, lastChild.sourceSpan.end);
            this._popContainer(container.name, html.Block, endSpan);
        }
    }
    _getContainer() {
        return this._containerStack.length > 0 ? this._containerStack[this._containerStack.length - 1] :
            null;
    }
    _getClosestParentElement() {
        for (let i = this._containerStack.length - 1; i > -1; i--) {
            if (this._containerStack[i] instanceof html.Element) {
                return this._containerStack[i];
            }
        }
        return null;
    }
    _addToParent(node) {
        const parent = this._getContainer();
        if (parent === null) {
            this.rootNodes.push(node);
        }
        else if (parent instanceof html.BlockGroup) {
            // Due to how parsing is set up, we're unlikely to hit this code path, but we
            // have the assertion here just in case and to satisfy the type checker.
            this.errors.push(TreeError.create(null, node.sourceSpan, 'Block groups can only contain blocks.'));
        }
        else {
            parent.children.push(node);
        }
    }
    _getElementFullName(prefix, localName, parentElement) {
        if (prefix === '') {
            prefix = this.getTagDefinition(localName).implicitNamespacePrefix || '';
            if (prefix === '' && parentElement != null) {
                const parentTagName = splitNsName(parentElement.name)[1];
                const parentTagDefinition = this.getTagDefinition(parentTagName);
                if (!parentTagDefinition.preventNamespaceInheritance) {
                    prefix = getNsPrefix(parentElement.name);
                }
            }
        }
        return mergeNsAndName(prefix, localName);
    }
}
function lastOnStack(stack, element) {
    return stack.length > 0 && stack[stack.length - 1] === element;
}
/**
 * Decode the `entity` string, which we believe is the contents of an HTML entity.
 *
 * If the string is not actually a valid/known entity then just return the original `match` string.
 */
function decodeEntity(match, entity) {
    if (NAMED_ENTITIES[entity] !== undefined) {
        return NAMED_ENTITIES[entity] || match;
    }
    if (/^#x[a-f0-9]+$/i.test(entity)) {
        return String.fromCodePoint(parseInt(entity.slice(2), 16));
    }
    if (/^#\d+$/.test(entity)) {
        return String.fromCodePoint(parseInt(entity.slice(1), 10));
    }
    return match;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL21sX3BhcnNlci9wYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBaUIsZUFBZSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXpFLE9BQU8sS0FBSyxJQUFJLE1BQU0sT0FBTyxDQUFDO0FBQzlCLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDMUMsT0FBTyxFQUFDLFFBQVEsRUFBa0IsTUFBTSxTQUFTLENBQUM7QUFDbEQsT0FBTyxFQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFnQixNQUFNLFFBQVEsQ0FBQztBQVcvRSxNQUFNLE9BQU8sU0FBVSxTQUFRLFVBQVU7SUFDdkMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUF3QixFQUFFLElBQXFCLEVBQUUsR0FBVztRQUN4RSxPQUFPLElBQUksU0FBUyxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELFlBQW1CLFdBQXdCLEVBQUUsSUFBcUIsRUFBRSxHQUFXO1FBQzdFLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFEQSxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtJQUUzQyxDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8sZUFBZTtJQUMxQixZQUFtQixTQUFzQixFQUFTLE1BQW9CO1FBQW5ELGNBQVMsR0FBVCxTQUFTLENBQWE7UUFBUyxXQUFNLEdBQU4sTUFBTSxDQUFjO0lBQUcsQ0FBQztDQUMzRTtBQUVELE1BQU0sT0FBTyxNQUFNO0lBQ2pCLFlBQW1CLGdCQUFvRDtRQUFwRCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW9DO0lBQUcsQ0FBQztJQUUzRSxLQUFLLENBQUMsTUFBYyxFQUFFLEdBQVcs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QUFXLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUMxQzthQUNGO1NBQ0Y7UUFFRCxPQUFPLGNBQWMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDM0MsQ0FBQztDQUNGO0FBRUQsU0FBUyxXQUFXLENBQUMsS0FBWSxFQUFFLE9BQVk7SUFDN0MsT0FBTyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxPQUFPLENBQUM7QUFDakUsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLFlBQVksQ0FBQyxLQUFhLEVBQUUsTUFBYztJQUNqRCxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxTQUFTLEVBQUU7UUFDeEMsT0FBTyxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDO0tBQ3hDO0lBQ0QsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDakMsT0FBTyxNQUFNLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDNUQ7SUFDRCxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDekIsT0FBTyxNQUFNLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDNUQ7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQYXJzZUVycm9yLCBQYXJzZUxvY2F0aW9uLCBQYXJzZVNvdXJjZVNwYW59IGZyb20gJy4uL3BhcnNlX3V0aWwnO1xuXG5pbXBvcnQgKiBhcyBodG1sIGZyb20gJy4vYXN0JztcbmltcG9ydCB7TkFNRURfRU5USVRJRVN9IGZyb20gJy4vZW50aXRpZXMnO1xuaW1wb3J0IHt0b2tlbml6ZSwgVG9rZW5pemVPcHRpb25zfSBmcm9tICcuL2xleGVyJztcbmltcG9ydCB7Z2V0TnNQcmVmaXgsIG1lcmdlTnNBbmROYW1lLCBzcGxpdE5zTmFtZSwgVGFnRGVmaW5pdGlvbn0gZnJvbSAnLi90YWdzJztcbmltcG9ydCB7QXR0cmlidXRlTmFtZVRva2VuLCBBdHRyaWJ1dGVRdW90ZVRva2VuLCBCbG9ja0dyb3VwQ2xvc2VUb2tlbiwgQmxvY2tHcm91cE9wZW5TdGFydFRva2VuLCBCbG9ja09wZW5TdGFydFRva2VuLCBCbG9ja1BhcmFtZXRlclRva2VuLCBDZGF0YVN0YXJ0VG9rZW4sIENvbW1lbnRTdGFydFRva2VuLCBFeHBhbnNpb25DYXNlRXhwcmVzc2lvbkVuZFRva2VuLCBFeHBhbnNpb25DYXNlRXhwcmVzc2lvblN0YXJ0VG9rZW4sIEV4cGFuc2lvbkNhc2VWYWx1ZVRva2VuLCBFeHBhbnNpb25Gb3JtU3RhcnRUb2tlbiwgSW5jb21wbGV0ZVRhZ09wZW5Ub2tlbiwgSW50ZXJwb2xhdGVkQXR0cmlidXRlVG9rZW4sIEludGVycG9sYXRlZFRleHRUb2tlbiwgVGFnQ2xvc2VUb2tlbiwgVGFnT3BlblN0YXJ0VG9rZW4sIFRleHRUb2tlbiwgVG9rZW4sIFRva2VuVHlwZX0gZnJvbSAnLi90b2tlbnMnO1xuXG4vKiogTm9kZXMgdGhhdCBjYW4gY29udGFpbiBvdGhlciBub2Rlcy4gKi9cbnR5cGUgTm9kZUNvbnRhaW5lciA9IGh0bWwuRWxlbWVudHxodG1sLkJsb2NrfGh0bWwuQmxvY2tHcm91cDtcblxuLyoqIENsYXNzIHRoYXQgY2FuIGNvbnN0cnVjdCBhIGBOb2RlQ29udGFpbmVyYC4gKi9cbmludGVyZmFjZSBOb2RlQ29udGFpbmVyQ29uc3RydWN0b3IgZXh0ZW5kcyBGdW5jdGlvbiB7XG4gIG5ldyguLi5hcmdzOiBhbnlbXSk6IE5vZGVDb250YWluZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBUcmVlRXJyb3IgZXh0ZW5kcyBQYXJzZUVycm9yIHtcbiAgc3RhdGljIGNyZWF0ZShlbGVtZW50TmFtZTogc3RyaW5nfG51bGwsIHNwYW46IFBhcnNlU291cmNlU3BhbiwgbXNnOiBzdHJpbmcpOiBUcmVlRXJyb3Ige1xuICAgIHJldHVybiBuZXcgVHJlZUVycm9yKGVsZW1lbnROYW1lLCBzcGFuLCBtc2cpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHVibGljIGVsZW1lbnROYW1lOiBzdHJpbmd8bnVsbCwgc3BhbjogUGFyc2VTb3VyY2VTcGFuLCBtc2c6IHN0cmluZykge1xuICAgIHN1cGVyKHNwYW4sIG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBhcnNlVHJlZVJlc3VsdCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByb290Tm9kZXM6IGh0bWwuTm9kZVtdLCBwdWJsaWMgZXJyb3JzOiBQYXJzZUVycm9yW10pIHt9XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXIge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgZ2V0VGFnRGVmaW5pdGlvbjogKHRhZ05hbWU6IHN0cmluZykgPT4gVGFnRGVmaW5pdGlvbikge31cblxuICBwYXJzZShzb3VyY2U6IHN0cmluZywgdXJsOiBzdHJpbmcsIG9wdGlvbnM/OiBUb2tlbml6ZU9wdGlvbnMpOiBQYXJzZVRyZWVSZXN1bHQge1xuICAgIGNvbnN0IHRva2VuaXplUmVzdWx0ID0gdG9rZW5pemUoc291cmNlLCB1cmwsIHRoaXMuZ2V0VGFnRGVmaW5pdGlvbiwgb3B0aW9ucyk7XG4gICAgY29uc3QgcGFyc2VyID0gbmV3IF9UcmVlQnVpbGRlcih0b2tlbml6ZVJlc3VsdC50b2tlbnMsIHRoaXMuZ2V0VGFnRGVmaW5pdGlvbik7XG4gICAgcGFyc2VyLmJ1aWxkKCk7XG4gICAgcmV0dXJuIG5ldyBQYXJzZVRyZWVSZXN1bHQoXG4gICAgICAgIHBhcnNlci5yb290Tm9kZXMsXG4gICAgICAgICh0b2tlbml6ZVJlc3VsdC5lcnJvcnMgYXMgUGFyc2VFcnJvcltdKS5jb25jYXQocGFyc2VyLmVycm9ycyksXG4gICAgKTtcbiAgfVxufVxuXG5jbGFzcyBfVHJlZUJ1aWxkZXIge1xuICBwcml2YXRlIF9pbmRleDogbnVtYmVyID0gLTE7XG4gIC8vIGBfcGVla2Agd2lsbCBiZSBpbml0aWFsaXplZCBieSB0aGUgY2FsbCB0byBgX2FkdmFuY2UoKWAgaW4gdGhlIGNvbnN0cnVjdG9yLlxuICBwcml2YXRlIF9wZWVrITogVG9rZW47XG4gIHByaXZhdGUgX2NvbnRhaW5lclN0YWNrOiBOb2RlQ29udGFpbmVyW10gPSBbXTtcblxuICByb290Tm9kZXM6IGh0bWwuTm9kZVtdID0gW107XG4gIGVycm9yczogVHJlZUVycm9yW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgdG9rZW5zOiBUb2tlbltdLCBwcml2YXRlIGdldFRhZ0RlZmluaXRpb246ICh0YWdOYW1lOiBzdHJpbmcpID0+IFRhZ0RlZmluaXRpb24pIHtcbiAgICB0aGlzLl9hZHZhbmNlKCk7XG4gIH1cblxuICBidWlsZCgpOiB2b2lkIHtcbiAgICB3aGlsZSAodGhpcy5fcGVlay50eXBlICE9PSBUb2tlblR5cGUuRU9GKSB7XG4gICAgICBpZiAodGhpcy5fcGVlay50eXBlID09PSBUb2tlblR5cGUuVEFHX09QRU5fU1RBUlQgfHxcbiAgICAgICAgICB0aGlzLl9wZWVrLnR5cGUgPT09IFRva2VuVHlwZS5JTkNPTVBMRVRFX1RBR19PUEVOKSB7XG4gICAgICAgIHRoaXMuX2NvbnN1bWVTdGFydFRhZyh0aGlzLl9hZHZhbmNlPFRhZ09wZW5TdGFydFRva2VufEluY29tcGxldGVUYWdPcGVuVG9rZW4+KCkpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl9wZWVrLnR5cGUgPT09IFRva2VuVHlwZS5UQUdfQ0xPU0UpIHtcbiAgICAgICAgdGhpcy5fY29uc3VtZUVuZFRhZyh0aGlzLl9hZHZhbmNlPFRhZ0Nsb3NlVG9rZW4+KCkpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl9wZWVrLnR5cGUgPT09IFRva2VuVHlwZS5DREFUQV9TVEFSVCkge1xuICAgICAgICB0aGlzLl9jbG9zZVZvaWRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuX2NvbnN1bWVDZGF0YSh0aGlzLl9hZHZhbmNlPENkYXRhU3RhcnRUb2tlbj4oKSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX3BlZWsudHlwZSA9PT0gVG9rZW5UeXBlLkNPTU1FTlRfU1RBUlQpIHtcbiAgICAgICAgdGhpcy5fY2xvc2VWb2lkRWxlbWVudCgpO1xuICAgICAgICB0aGlzLl9jb25zdW1lQ29tbWVudCh0aGlzLl9hZHZhbmNlPENvbW1lbnRTdGFydFRva2VuPigpKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgdGhpcy5fcGVlay50eXBlID09PSBUb2tlblR5cGUuVEVYVCB8fCB0aGlzLl9wZWVrLnR5cGUgPT09IFRva2VuVHlwZS5SQVdfVEVYVCB8fFxuICAgICAgICAgIHRoaXMuX3BlZWsudHlwZSA9PT0gVG9rZW5UeXBlLkVTQ0FQQUJMRV9SQVdfVEVYVCkge1xuICAgICAgICB0aGlzLl9jbG9zZVZvaWRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuX2NvbnN1bWVUZXh0KHRoaXMuX2FkdmFuY2U8VGV4dFRva2VuPigpKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fcGVlay50eXBlID09PSBUb2tlblR5cGUuRVhQQU5TSU9OX0ZPUk1fU1RBUlQpIHtcbiAgICAgICAgdGhpcy5fY29uc3VtZUV4cGFuc2lvbih0aGlzLl9hZHZhbmNlPEV4cGFuc2lvbkZvcm1TdGFydFRva2VuPigpKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fcGVlay50eXBlID09PSBUb2tlblR5cGUuQkxPQ0tfR1JPVVBfT1BFTl9TVEFSVCkge1xuICAgICAgICB0aGlzLl9jbG9zZVZvaWRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuX2NvbnN1bWVCbG9ja0dyb3VwT3Blbih0aGlzLl9hZHZhbmNlPEJsb2NrR3JvdXBPcGVuU3RhcnRUb2tlbj4oKSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX3BlZWsudHlwZSA9PT0gVG9rZW5UeXBlLkJMT0NLX09QRU5fU1RBUlQpIHtcbiAgICAgICAgdGhpcy5fY2xvc2VWb2lkRWxlbWVudCgpO1xuICAgICAgICB0aGlzLl9jb25zdW1lQmxvY2sodGhpcy5fYWR2YW5jZTxCbG9ja09wZW5TdGFydFRva2VuPigpLCBUb2tlblR5cGUuQkxPQ0tfT1BFTl9FTkQpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl9wZWVrLnR5cGUgPT09IFRva2VuVHlwZS5CTE9DS19HUk9VUF9DTE9TRSkge1xuICAgICAgICB0aGlzLl9jbG9zZVZvaWRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuX2NvbnN1bWVCbG9ja0dyb3VwQ2xvc2UodGhpcy5fYWR2YW5jZTxCbG9ja0dyb3VwQ2xvc2VUb2tlbj4oKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTa2lwIGFsbCBvdGhlciB0b2tlbnMuLi5cbiAgICAgICAgdGhpcy5fYWR2YW5jZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2FkdmFuY2U8VCBleHRlbmRzIFRva2VuPigpOiBUIHtcbiAgICBjb25zdCBwcmV2ID0gdGhpcy5fcGVlaztcbiAgICBpZiAodGhpcy5faW5kZXggPCB0aGlzLnRva2Vucy5sZW5ndGggLSAxKSB7XG4gICAgICAvLyBOb3RlOiB0aGVyZSBpcyBhbHdheXMgYW4gRU9GIHRva2VuIGF0IHRoZSBlbmRcbiAgICAgIHRoaXMuX2luZGV4Kys7XG4gICAgfVxuICAgIHRoaXMuX3BlZWsgPSB0aGlzLnRva2Vuc1t0aGlzLl9pbmRleF07XG4gICAgcmV0dXJuIHByZXYgYXMgVDtcbiAgfVxuXG4gIHByaXZhdGUgX2FkdmFuY2VJZjxUIGV4dGVuZHMgVG9rZW5UeXBlPih0eXBlOiBUKTogKFRva2VuJnt0eXBlOiBUfSl8bnVsbCB7XG4gICAgaWYgKHRoaXMuX3BlZWsudHlwZSA9PT0gdHlwZSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2FkdmFuY2U8VG9rZW4me3R5cGU6IFR9PigpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVDZGF0YShfc3RhcnRUb2tlbjogQ2RhdGFTdGFydFRva2VuKSB7XG4gICAgdGhpcy5fY29uc3VtZVRleHQodGhpcy5fYWR2YW5jZTxUZXh0VG9rZW4+KCkpO1xuICAgIHRoaXMuX2FkdmFuY2VJZihUb2tlblR5cGUuQ0RBVEFfRU5EKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVDb21tZW50KHRva2VuOiBDb21tZW50U3RhcnRUb2tlbikge1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLl9hZHZhbmNlSWYoVG9rZW5UeXBlLlJBV19URVhUKTtcbiAgICBjb25zdCBlbmRUb2tlbiA9IHRoaXMuX2FkdmFuY2VJZihUb2tlblR5cGUuQ09NTUVOVF9FTkQpO1xuICAgIGNvbnN0IHZhbHVlID0gdGV4dCAhPSBudWxsID8gdGV4dC5wYXJ0c1swXS50cmltKCkgOiBudWxsO1xuICAgIGNvbnN0IHNvdXJjZVNwYW4gPSBlbmRUb2tlbiA9PSBudWxsID9cbiAgICAgICAgdG9rZW4uc291cmNlU3BhbiA6XG4gICAgICAgIG5ldyBQYXJzZVNvdXJjZVNwYW4oXG4gICAgICAgICAgICB0b2tlbi5zb3VyY2VTcGFuLnN0YXJ0LCBlbmRUb2tlbi5zb3VyY2VTcGFuLmVuZCwgdG9rZW4uc291cmNlU3Bhbi5mdWxsU3RhcnQpO1xuICAgIHRoaXMuX2FkZFRvUGFyZW50KG5ldyBodG1sLkNvbW1lbnQodmFsdWUsIHNvdXJjZVNwYW4pKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVFeHBhbnNpb24odG9rZW46IEV4cGFuc2lvbkZvcm1TdGFydFRva2VuKSB7XG4gICAgY29uc3Qgc3dpdGNoVmFsdWUgPSB0aGlzLl9hZHZhbmNlPFRleHRUb2tlbj4oKTtcblxuICAgIGNvbnN0IHR5cGUgPSB0aGlzLl9hZHZhbmNlPFRleHRUb2tlbj4oKTtcbiAgICBjb25zdCBjYXNlczogaHRtbC5FeHBhbnNpb25DYXNlW10gPSBbXTtcblxuICAgIC8vIHJlYWQgPVxuICAgIHdoaWxlICh0aGlzLl9wZWVrLnR5cGUgPT09IFRva2VuVHlwZS5FWFBBTlNJT05fQ0FTRV9WQUxVRSkge1xuICAgICAgY29uc3QgZXhwQ2FzZSA9IHRoaXMuX3BhcnNlRXhwYW5zaW9uQ2FzZSgpO1xuICAgICAgaWYgKCFleHBDYXNlKSByZXR1cm47ICAvLyBlcnJvclxuICAgICAgY2FzZXMucHVzaChleHBDYXNlKTtcbiAgICB9XG5cbiAgICAvLyByZWFkIHRoZSBmaW5hbCB9XG4gICAgaWYgKHRoaXMuX3BlZWsudHlwZSAhPT0gVG9rZW5UeXBlLkVYUEFOU0lPTl9GT1JNX0VORCkge1xuICAgICAgdGhpcy5lcnJvcnMucHVzaChcbiAgICAgICAgICBUcmVlRXJyb3IuY3JlYXRlKG51bGwsIHRoaXMuX3BlZWsuc291cmNlU3BhbiwgYEludmFsaWQgSUNVIG1lc3NhZ2UuIE1pc3NpbmcgJ30nLmApKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc291cmNlU3BhbiA9IG5ldyBQYXJzZVNvdXJjZVNwYW4oXG4gICAgICAgIHRva2VuLnNvdXJjZVNwYW4uc3RhcnQsIHRoaXMuX3BlZWsuc291cmNlU3Bhbi5lbmQsIHRva2VuLnNvdXJjZVNwYW4uZnVsbFN0YXJ0KTtcbiAgICB0aGlzLl9hZGRUb1BhcmVudChuZXcgaHRtbC5FeHBhbnNpb24oXG4gICAgICAgIHN3aXRjaFZhbHVlLnBhcnRzWzBdLCB0eXBlLnBhcnRzWzBdLCBjYXNlcywgc291cmNlU3Bhbiwgc3dpdGNoVmFsdWUuc291cmNlU3BhbikpO1xuXG4gICAgdGhpcy5fYWR2YW5jZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcGFyc2VFeHBhbnNpb25DYXNlKCk6IGh0bWwuRXhwYW5zaW9uQ2FzZXxudWxsIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuX2FkdmFuY2U8RXhwYW5zaW9uQ2FzZVZhbHVlVG9rZW4+KCk7XG5cbiAgICAvLyByZWFkIHtcbiAgICBpZiAodGhpcy5fcGVlay50eXBlICE9PSBUb2tlblR5cGUuRVhQQU5TSU9OX0NBU0VfRVhQX1NUQVJUKSB7XG4gICAgICB0aGlzLmVycm9ycy5wdXNoKFxuICAgICAgICAgIFRyZWVFcnJvci5jcmVhdGUobnVsbCwgdGhpcy5fcGVlay5zb3VyY2VTcGFuLCBgSW52YWxpZCBJQ1UgbWVzc2FnZS4gTWlzc2luZyAneycuYCkpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gcmVhZCB1bnRpbCB9XG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLl9hZHZhbmNlPEV4cGFuc2lvbkNhc2VFeHByZXNzaW9uU3RhcnRUb2tlbj4oKTtcblxuICAgIGNvbnN0IGV4cCA9IHRoaXMuX2NvbGxlY3RFeHBhbnNpb25FeHBUb2tlbnMoc3RhcnQpO1xuICAgIGlmICghZXhwKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IGVuZCA9IHRoaXMuX2FkdmFuY2U8RXhwYW5zaW9uQ2FzZUV4cHJlc3Npb25FbmRUb2tlbj4oKTtcbiAgICBleHAucHVzaCh7dHlwZTogVG9rZW5UeXBlLkVPRiwgcGFydHM6IFtdLCBzb3VyY2VTcGFuOiBlbmQuc291cmNlU3Bhbn0pO1xuXG4gICAgLy8gcGFyc2UgZXZlcnl0aGluZyBpbiBiZXR3ZWVuIHsgYW5kIH1cbiAgICBjb25zdCBleHBhbnNpb25DYXNlUGFyc2VyID0gbmV3IF9UcmVlQnVpbGRlcihleHAsIHRoaXMuZ2V0VGFnRGVmaW5pdGlvbik7XG4gICAgZXhwYW5zaW9uQ2FzZVBhcnNlci5idWlsZCgpO1xuICAgIGlmIChleHBhbnNpb25DYXNlUGFyc2VyLmVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmVycm9ycyA9IHRoaXMuZXJyb3JzLmNvbmNhdChleHBhbnNpb25DYXNlUGFyc2VyLmVycm9ycyk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBzb3VyY2VTcGFuID1cbiAgICAgICAgbmV3IFBhcnNlU291cmNlU3Bhbih2YWx1ZS5zb3VyY2VTcGFuLnN0YXJ0LCBlbmQuc291cmNlU3Bhbi5lbmQsIHZhbHVlLnNvdXJjZVNwYW4uZnVsbFN0YXJ0KTtcbiAgICBjb25zdCBleHBTb3VyY2VTcGFuID1cbiAgICAgICAgbmV3IFBhcnNlU291cmNlU3BhbihzdGFydC5zb3VyY2VTcGFuLnN0YXJ0LCBlbmQuc291cmNlU3Bhbi5lbmQsIHN0YXJ0LnNvdXJjZVNwYW4uZnVsbFN0YXJ0KTtcbiAgICByZXR1cm4gbmV3IGh0bWwuRXhwYW5zaW9uQ2FzZShcbiAgICAgICAgdmFsdWUucGFydHNbMF0sIGV4cGFuc2lvbkNhc2VQYXJzZXIucm9vdE5vZGVzLCBzb3VyY2VTcGFuLCB2YWx1ZS5zb3VyY2VTcGFuLCBleHBTb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbGxlY3RFeHBhbnNpb25FeHBUb2tlbnMoc3RhcnQ6IFRva2VuKTogVG9rZW5bXXxudWxsIHtcbiAgICBjb25zdCBleHA6IFRva2VuW10gPSBbXTtcbiAgICBjb25zdCBleHBhbnNpb25Gb3JtU3RhY2sgPSBbVG9rZW5UeXBlLkVYUEFOU0lPTl9DQVNFX0VYUF9TVEFSVF07XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKHRoaXMuX3BlZWsudHlwZSA9PT0gVG9rZW5UeXBlLkVYUEFOU0lPTl9GT1JNX1NUQVJUIHx8XG4gICAgICAgICAgdGhpcy5fcGVlay50eXBlID09PSBUb2tlblR5cGUuRVhQQU5TSU9OX0NBU0VfRVhQX1NUQVJUKSB7XG4gICAgICAgIGV4cGFuc2lvbkZvcm1TdGFjay5wdXNoKHRoaXMuX3BlZWsudHlwZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9wZWVrLnR5cGUgPT09IFRva2VuVHlwZS5FWFBBTlNJT05fQ0FTRV9FWFBfRU5EKSB7XG4gICAgICAgIGlmIChsYXN0T25TdGFjayhleHBhbnNpb25Gb3JtU3RhY2ssIFRva2VuVHlwZS5FWFBBTlNJT05fQ0FTRV9FWFBfU1RBUlQpKSB7XG4gICAgICAgICAgZXhwYW5zaW9uRm9ybVN0YWNrLnBvcCgpO1xuICAgICAgICAgIGlmIChleHBhbnNpb25Gb3JtU3RhY2subGVuZ3RoID09PSAwKSByZXR1cm4gZXhwO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5lcnJvcnMucHVzaChcbiAgICAgICAgICAgICAgVHJlZUVycm9yLmNyZWF0ZShudWxsLCBzdGFydC5zb3VyY2VTcGFuLCBgSW52YWxpZCBJQ1UgbWVzc2FnZS4gTWlzc2luZyAnfScuYCkpO1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9wZWVrLnR5cGUgPT09IFRva2VuVHlwZS5FWFBBTlNJT05fRk9STV9FTkQpIHtcbiAgICAgICAgaWYgKGxhc3RPblN0YWNrKGV4cGFuc2lvbkZvcm1TdGFjaywgVG9rZW5UeXBlLkVYUEFOU0lPTl9GT1JNX1NUQVJUKSkge1xuICAgICAgICAgIGV4cGFuc2lvbkZvcm1TdGFjay5wb3AoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmVycm9ycy5wdXNoKFxuICAgICAgICAgICAgICBUcmVlRXJyb3IuY3JlYXRlKG51bGwsIHN0YXJ0LnNvdXJjZVNwYW4sIGBJbnZhbGlkIElDVSBtZXNzYWdlLiBNaXNzaW5nICd9Jy5gKSk7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX3BlZWsudHlwZSA9PT0gVG9rZW5UeXBlLkVPRikge1xuICAgICAgICB0aGlzLmVycm9ycy5wdXNoKFxuICAgICAgICAgICAgVHJlZUVycm9yLmNyZWF0ZShudWxsLCBzdGFydC5zb3VyY2VTcGFuLCBgSW52YWxpZCBJQ1UgbWVzc2FnZS4gTWlzc2luZyAnfScuYCkpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgZXhwLnB1c2godGhpcy5fYWR2YW5jZSgpKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9jb25zdW1lVGV4dCh0b2tlbjogSW50ZXJwb2xhdGVkVGV4dFRva2VuKSB7XG4gICAgY29uc3QgdG9rZW5zID0gW3Rva2VuXTtcbiAgICBjb25zdCBzdGFydFNwYW4gPSB0b2tlbi5zb3VyY2VTcGFuO1xuICAgIGxldCB0ZXh0ID0gdG9rZW4ucGFydHNbMF07XG4gICAgaWYgKHRleHQubGVuZ3RoID4gMCAmJiB0ZXh0WzBdID09PSAnXFxuJykge1xuICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fZ2V0Q29udGFpbmVyKCk7XG5cbiAgICAgIC8vIFRoaXMgaXMgdW5saWtlbHkgdG8gaGFwcGVuLCBidXQgd2UgaGF2ZSBhbiBhc3NlcnRpb24ganVzdCBpbiBjYXNlLlxuICAgICAgaWYgKHBhcmVudCBpbnN0YW5jZW9mIGh0bWwuQmxvY2tHcm91cCkge1xuICAgICAgICB0aGlzLmVycm9ycy5wdXNoKFRyZWVFcnJvci5jcmVhdGUoXG4gICAgICAgICAgICBudWxsLCBzdGFydFNwYW4sICdUZXh0IGNhbm5vdCBiZSBwbGFjZWQgZGlyZWN0bHkgaW5zaWRlIG9mIGEgYmxvY2sgZ3JvdXAuJykpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKHBhcmVudCAhPSBudWxsICYmIHBhcmVudC5jaGlsZHJlbi5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICB0aGlzLmdldFRhZ0RlZmluaXRpb24ocGFyZW50Lm5hbWUpLmlnbm9yZUZpcnN0TGYpIHtcbiAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDEpO1xuICAgICAgICB0b2tlbnNbMF0gPSB7dHlwZTogdG9rZW4udHlwZSwgc291cmNlU3BhbjogdG9rZW4uc291cmNlU3BhbiwgcGFydHM6IFt0ZXh0XX0gYXMgdHlwZW9mIHRva2VuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHdoaWxlICh0aGlzLl9wZWVrLnR5cGUgPT09IFRva2VuVHlwZS5JTlRFUlBPTEFUSU9OIHx8IHRoaXMuX3BlZWsudHlwZSA9PT0gVG9rZW5UeXBlLlRFWFQgfHxcbiAgICAgICAgICAgdGhpcy5fcGVlay50eXBlID09PSBUb2tlblR5cGUuRU5DT0RFRF9FTlRJVFkpIHtcbiAgICAgIHRva2VuID0gdGhpcy5fYWR2YW5jZSgpO1xuICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5JTlRFUlBPTEFUSU9OKSB7XG4gICAgICAgIC8vIEZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IHdlIGRlY29kZSBIVE1MIGVudGl0aWVzIHRoYXQgYXBwZWFyIGluIGludGVycG9sYXRpb25cbiAgICAgICAgLy8gZXhwcmVzc2lvbnMuIFRoaXMgaXMgYXJndWFibHkgYSBidWcsIGJ1dCBpdCBjb3VsZCBiZSBhIGNvbnNpZGVyYWJsZSBicmVha2luZyBjaGFuZ2UgdG9cbiAgICAgICAgLy8gZml4IGl0LiBJdCBzaG91bGQgYmUgYWRkcmVzc2VkIGluIGEgbGFyZ2VyIHByb2plY3QgdG8gcmVmYWN0b3IgdGhlIGVudGlyZSBwYXJzZXIvbGV4ZXJcbiAgICAgICAgLy8gY2hhaW4gYWZ0ZXIgVmlldyBFbmdpbmUgaGFzIGJlZW4gcmVtb3ZlZC5cbiAgICAgICAgdGV4dCArPSB0b2tlbi5wYXJ0cy5qb2luKCcnKS5yZXBsYWNlKC8mKFteO10rKTsvZywgZGVjb2RlRW50aXR5KTtcbiAgICAgIH0gZWxzZSBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkVOQ09ERURfRU5USVRZKSB7XG4gICAgICAgIHRleHQgKz0gdG9rZW4ucGFydHNbMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0ZXh0ICs9IHRva2VuLnBhcnRzLmpvaW4oJycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0ZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGVuZFNwYW4gPSB0b2tlbi5zb3VyY2VTcGFuO1xuICAgICAgdGhpcy5fYWRkVG9QYXJlbnQobmV3IGh0bWwuVGV4dChcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIG5ldyBQYXJzZVNvdXJjZVNwYW4oc3RhcnRTcGFuLnN0YXJ0LCBlbmRTcGFuLmVuZCwgc3RhcnRTcGFuLmZ1bGxTdGFydCwgc3RhcnRTcGFuLmRldGFpbHMpLFxuICAgICAgICAgIHRva2VucykpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2Nsb3NlVm9pZEVsZW1lbnQoKTogdm9pZCB7XG4gICAgY29uc3QgZWwgPSB0aGlzLl9nZXRDb250YWluZXIoKTtcbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBodG1sLkVsZW1lbnQgJiYgdGhpcy5nZXRUYWdEZWZpbml0aW9uKGVsLm5hbWUpLmlzVm9pZCkge1xuICAgICAgdGhpcy5fY29udGFpbmVyU3RhY2sucG9wKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZVN0YXJ0VGFnKHN0YXJ0VGFnVG9rZW46IFRhZ09wZW5TdGFydFRva2VufEluY29tcGxldGVUYWdPcGVuVG9rZW4pIHtcbiAgICBjb25zdCBbcHJlZml4LCBuYW1lXSA9IHN0YXJ0VGFnVG9rZW4ucGFydHM7XG4gICAgY29uc3QgYXR0cnM6IGh0bWwuQXR0cmlidXRlW10gPSBbXTtcbiAgICB3aGlsZSAodGhpcy5fcGVlay50eXBlID09PSBUb2tlblR5cGUuQVRUUl9OQU1FKSB7XG4gICAgICBhdHRycy5wdXNoKHRoaXMuX2NvbnN1bWVBdHRyKHRoaXMuX2FkdmFuY2U8QXR0cmlidXRlTmFtZVRva2VuPigpKSk7XG4gICAgfVxuICAgIGNvbnN0IGZ1bGxOYW1lID0gdGhpcy5fZ2V0RWxlbWVudEZ1bGxOYW1lKHByZWZpeCwgbmFtZSwgdGhpcy5fZ2V0Q2xvc2VzdFBhcmVudEVsZW1lbnQoKSk7XG4gICAgbGV0IHNlbGZDbG9zaW5nID0gZmFsc2U7XG4gICAgLy8gTm90ZTogVGhlcmUgY291bGQgaGF2ZSBiZWVuIGEgdG9rZW5pemVyIGVycm9yXG4gICAgLy8gc28gdGhhdCB3ZSBkb24ndCBnZXQgYSB0b2tlbiBmb3IgdGhlIGVuZCB0YWcuLi5cbiAgICBpZiAodGhpcy5fcGVlay50eXBlID09PSBUb2tlblR5cGUuVEFHX09QRU5fRU5EX1ZPSUQpIHtcbiAgICAgIHRoaXMuX2FkdmFuY2UoKTtcbiAgICAgIHNlbGZDbG9zaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnN0IHRhZ0RlZiA9IHRoaXMuZ2V0VGFnRGVmaW5pdGlvbihmdWxsTmFtZSk7XG4gICAgICBpZiAoISh0YWdEZWYuY2FuU2VsZkNsb3NlIHx8IGdldE5zUHJlZml4KGZ1bGxOYW1lKSAhPT0gbnVsbCB8fCB0YWdEZWYuaXNWb2lkKSkge1xuICAgICAgICB0aGlzLmVycm9ycy5wdXNoKFRyZWVFcnJvci5jcmVhdGUoXG4gICAgICAgICAgICBmdWxsTmFtZSwgc3RhcnRUYWdUb2tlbi5zb3VyY2VTcGFuLFxuICAgICAgICAgICAgYE9ubHkgdm9pZCwgY3VzdG9tIGFuZCBmb3JlaWduIGVsZW1lbnRzIGNhbiBiZSBzZWxmIGNsb3NlZCBcIiR7XG4gICAgICAgICAgICAgICAgc3RhcnRUYWdUb2tlbi5wYXJ0c1sxXX1cImApKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuX3BlZWsudHlwZSA9PT0gVG9rZW5UeXBlLlRBR19PUEVOX0VORCkge1xuICAgICAgdGhpcy5fYWR2YW5jZSgpO1xuICAgICAgc2VsZkNsb3NpbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgZW5kID0gdGhpcy5fcGVlay5zb3VyY2VTcGFuLmZ1bGxTdGFydDtcbiAgICBjb25zdCBzcGFuID0gbmV3IFBhcnNlU291cmNlU3BhbihcbiAgICAgICAgc3RhcnRUYWdUb2tlbi5zb3VyY2VTcGFuLnN0YXJ0LCBlbmQsIHN0YXJ0VGFnVG9rZW4uc291cmNlU3Bhbi5mdWxsU3RhcnQpO1xuICAgIC8vIENyZWF0ZSBhIHNlcGFyYXRlIGBzdGFydFNwYW5gIGJlY2F1c2UgYHNwYW5gIHdpbGwgYmUgbW9kaWZpZWQgd2hlbiB0aGVyZSBpcyBhbiBgZW5kYCBzcGFuLlxuICAgIGNvbnN0IHN0YXJ0U3BhbiA9IG5ldyBQYXJzZVNvdXJjZVNwYW4oXG4gICAgICAgIHN0YXJ0VGFnVG9rZW4uc291cmNlU3Bhbi5zdGFydCwgZW5kLCBzdGFydFRhZ1Rva2VuLnNvdXJjZVNwYW4uZnVsbFN0YXJ0KTtcbiAgICBjb25zdCBlbCA9IG5ldyBodG1sLkVsZW1lbnQoZnVsbE5hbWUsIGF0dHJzLCBbXSwgc3Bhbiwgc3RhcnRTcGFuLCB1bmRlZmluZWQpO1xuICAgIGNvbnN0IHBhcmVudEVsID0gdGhpcy5fZ2V0Q29udGFpbmVyKCk7XG4gICAgdGhpcy5fcHVzaENvbnRhaW5lcihcbiAgICAgICAgZWwsXG4gICAgICAgIHBhcmVudEVsIGluc3RhbmNlb2YgaHRtbC5FbGVtZW50ICYmXG4gICAgICAgICAgICB0aGlzLmdldFRhZ0RlZmluaXRpb24ocGFyZW50RWwubmFtZSkuaXNDbG9zZWRCeUNoaWxkKGVsLm5hbWUpKTtcbiAgICBpZiAoc2VsZkNsb3NpbmcpIHtcbiAgICAgIC8vIEVsZW1lbnRzIHRoYXQgYXJlIHNlbGYtY2xvc2VkIGhhdmUgdGhlaXIgYGVuZFNvdXJjZVNwYW5gIHNldCB0byB0aGUgZnVsbCBzcGFuLCBhcyB0aGVcbiAgICAgIC8vIGVsZW1lbnQgc3RhcnQgdGFnIGFsc28gcmVwcmVzZW50cyB0aGUgZW5kIHRhZy5cbiAgICAgIHRoaXMuX3BvcENvbnRhaW5lcihmdWxsTmFtZSwgaHRtbC5FbGVtZW50LCBzcGFuKTtcbiAgICB9IGVsc2UgaWYgKHN0YXJ0VGFnVG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLklOQ09NUExFVEVfVEFHX09QRU4pIHtcbiAgICAgIC8vIFdlIGFscmVhZHkga25vdyB0aGUgb3BlbmluZyB0YWcgaXMgbm90IGNvbXBsZXRlLCBzbyBpdCBpcyB1bmxpa2VseSBpdCBoYXMgYSBjb3JyZXNwb25kaW5nXG4gICAgICAvLyBjbG9zZSB0YWcuIExldCdzIG9wdGltaXN0aWNhbGx5IHBhcnNlIGl0IGFzIGEgZnVsbCBlbGVtZW50IGFuZCBlbWl0IGFuIGVycm9yLlxuICAgICAgdGhpcy5fcG9wQ29udGFpbmVyKGZ1bGxOYW1lLCBodG1sLkVsZW1lbnQsIG51bGwpO1xuICAgICAgdGhpcy5lcnJvcnMucHVzaChcbiAgICAgICAgICBUcmVlRXJyb3IuY3JlYXRlKGZ1bGxOYW1lLCBzcGFuLCBgT3BlbmluZyB0YWcgXCIke2Z1bGxOYW1lfVwiIG5vdCB0ZXJtaW5hdGVkLmApKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9wdXNoQ29udGFpbmVyKG5vZGU6IE5vZGVDb250YWluZXIsIGlzQ2xvc2VkQnlDaGlsZDogYm9vbGVhbikge1xuICAgIGlmIChpc0Nsb3NlZEJ5Q2hpbGQpIHtcbiAgICAgIHRoaXMuX2NvbnRhaW5lclN0YWNrLnBvcCgpO1xuICAgIH1cblxuICAgIHRoaXMuX2FkZFRvUGFyZW50KG5vZGUpO1xuICAgIHRoaXMuX2NvbnRhaW5lclN0YWNrLnB1c2gobm9kZSk7XG4gIH1cblxuICBwcml2YXRlIF9jb25zdW1lRW5kVGFnKGVuZFRhZ1Rva2VuOiBUYWdDbG9zZVRva2VuKSB7XG4gICAgY29uc3QgZnVsbE5hbWUgPSB0aGlzLl9nZXRFbGVtZW50RnVsbE5hbWUoXG4gICAgICAgIGVuZFRhZ1Rva2VuLnBhcnRzWzBdLCBlbmRUYWdUb2tlbi5wYXJ0c1sxXSwgdGhpcy5fZ2V0Q2xvc2VzdFBhcmVudEVsZW1lbnQoKSk7XG5cbiAgICBpZiAodGhpcy5nZXRUYWdEZWZpbml0aW9uKGZ1bGxOYW1lKS5pc1ZvaWQpIHtcbiAgICAgIHRoaXMuZXJyb3JzLnB1c2goVHJlZUVycm9yLmNyZWF0ZShcbiAgICAgICAgICBmdWxsTmFtZSwgZW5kVGFnVG9rZW4uc291cmNlU3BhbixcbiAgICAgICAgICBgVm9pZCBlbGVtZW50cyBkbyBub3QgaGF2ZSBlbmQgdGFncyBcIiR7ZW5kVGFnVG9rZW4ucGFydHNbMV19XCJgKSk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5fcG9wQ29udGFpbmVyKGZ1bGxOYW1lLCBodG1sLkVsZW1lbnQsIGVuZFRhZ1Rva2VuLnNvdXJjZVNwYW4pKSB7XG4gICAgICBjb25zdCBlcnJNc2cgPSBgVW5leHBlY3RlZCBjbG9zaW5nIHRhZyBcIiR7XG4gICAgICAgICAgZnVsbE5hbWV9XCIuIEl0IG1heSBoYXBwZW4gd2hlbiB0aGUgdGFnIGhhcyBhbHJlYWR5IGJlZW4gY2xvc2VkIGJ5IGFub3RoZXIgdGFnLiBGb3IgbW9yZSBpbmZvIHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUvc3ludGF4Lmh0bWwjY2xvc2luZy1lbGVtZW50cy10aGF0LWhhdmUtaW1wbGllZC1lbmQtdGFnc2A7XG4gICAgICB0aGlzLmVycm9ycy5wdXNoKFRyZWVFcnJvci5jcmVhdGUoZnVsbE5hbWUsIGVuZFRhZ1Rva2VuLnNvdXJjZVNwYW4sIGVyck1zZykpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIG5lYXJlc3QgZWxlbWVudCB3aXRoIHRoZSB0YWcgbmFtZSBgZnVsbE5hbWVgIGluIHRoZSBwYXJzZSB0cmVlLlxuICAgKiBgZW5kU291cmNlU3BhbmAgaXMgdGhlIHNwYW4gb2YgdGhlIGNsb3NpbmcgdGFnLCBvciBudWxsIGlmIHRoZSBlbGVtZW50IGRvZXNcbiAgICogbm90IGhhdmUgYSBjbG9zaW5nIHRhZyAoZm9yIGV4YW1wbGUsIHRoaXMgaGFwcGVucyB3aGVuIGFuIGluY29tcGxldGVcbiAgICogb3BlbmluZyB0YWcgaXMgcmVjb3ZlcmVkKS5cbiAgICovXG4gIHByaXZhdGUgX3BvcENvbnRhaW5lcihcbiAgICAgIGZ1bGxOYW1lOiBzdHJpbmcsIGV4cGVjdGVkVHlwZTogTm9kZUNvbnRhaW5lckNvbnN0cnVjdG9yLFxuICAgICAgZW5kU291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFufG51bGwpOiBib29sZWFuIHtcbiAgICBsZXQgdW5leHBlY3RlZENsb3NlVGFnRGV0ZWN0ZWQgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBzdGFja0luZGV4ID0gdGhpcy5fY29udGFpbmVyU3RhY2subGVuZ3RoIC0gMTsgc3RhY2tJbmRleCA+PSAwOyBzdGFja0luZGV4LS0pIHtcbiAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9jb250YWluZXJTdGFja1tzdGFja0luZGV4XTtcbiAgICAgIGNvbnN0IG5hbWUgPSBub2RlIGluc3RhbmNlb2YgaHRtbC5CbG9ja0dyb3VwID8gbm9kZS5ibG9ja3NbMF0/Lm5hbWUgOiBub2RlLm5hbWU7XG5cbiAgICAgIGlmIChuYW1lID09PSBmdWxsTmFtZSAmJiBub2RlIGluc3RhbmNlb2YgZXhwZWN0ZWRUeXBlKSB7XG4gICAgICAgIC8vIFJlY29yZCB0aGUgcGFyc2Ugc3BhbiB3aXRoIHRoZSBlbGVtZW50IHRoYXQgaXMgYmVpbmcgY2xvc2VkLiBBbnkgZWxlbWVudHMgdGhhdCBhcmVcbiAgICAgICAgLy8gcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50IHN0YWNrIGF0IHRoaXMgcG9pbnQgYXJlIGNsb3NlZCBpbXBsaWNpdGx5LCBzbyB0aGV5IHdvbid0IGdldFxuICAgICAgICAvLyBhbiBlbmQgc291cmNlIHNwYW4gKGFzIHRoZXJlIGlzIG5vIGV4cGxpY2l0IGNsb3NpbmcgZWxlbWVudCkuXG4gICAgICAgIG5vZGUuZW5kU291cmNlU3BhbiA9IGVuZFNvdXJjZVNwYW47XG4gICAgICAgIG5vZGUuc291cmNlU3Bhbi5lbmQgPSBlbmRTb3VyY2VTcGFuICE9PSBudWxsID8gZW5kU291cmNlU3Bhbi5lbmQgOiBub2RlLnNvdXJjZVNwYW4uZW5kO1xuICAgICAgICB0aGlzLl9jb250YWluZXJTdGFjay5zcGxpY2Uoc3RhY2tJbmRleCwgdGhpcy5fY29udGFpbmVyU3RhY2subGVuZ3RoIC0gc3RhY2tJbmRleCk7XG4gICAgICAgIHJldHVybiAhdW5leHBlY3RlZENsb3NlVGFnRGV0ZWN0ZWQ7XG4gICAgICB9XG5cbiAgICAgIC8vIEJsb2NrcyBhcmUgc2VsZi1jbG9zaW5nIHdoaWxlIGJsb2NrIGdyb3VwcyBhbmQgKG1vc3QgdGltZXMpIGVsZW1lbnRzIGFyZSBub3QuXG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIGh0bWwuQmxvY2tHcm91cCB8fFxuICAgICAgICAgIG5vZGUgaW5zdGFuY2VvZiBodG1sLkVsZW1lbnQgJiYgIXRoaXMuZ2V0VGFnRGVmaW5pdGlvbihub2RlLm5hbWUpLmNsb3NlZEJ5UGFyZW50KSB7XG4gICAgICAgIC8vIE5vdGUgdGhhdCB3ZSBlbmNvdW50ZXJlZCBhbiB1bmV4cGVjdGVkIGNsb3NlIHRhZyBidXQgY29udGludWUgcHJvY2Vzc2luZyB0aGUgZWxlbWVudFxuICAgICAgICAvLyBzdGFjayBzbyB3ZSBjYW4gYXNzaWduIGFuIGBlbmRTb3VyY2VTcGFuYCBpZiB0aGVyZSBpcyBhIGNvcnJlc3BvbmRpbmcgc3RhcnQgdGFnIGZvciB0aGlzXG4gICAgICAgIC8vIGVuZCB0YWcgaW4gdGhlIHN0YWNrLlxuICAgICAgICB1bmV4cGVjdGVkQ2xvc2VUYWdEZXRlY3RlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVBdHRyKGF0dHJOYW1lOiBBdHRyaWJ1dGVOYW1lVG9rZW4pOiBodG1sLkF0dHJpYnV0ZSB7XG4gICAgY29uc3QgZnVsbE5hbWUgPSBtZXJnZU5zQW5kTmFtZShhdHRyTmFtZS5wYXJ0c1swXSwgYXR0ck5hbWUucGFydHNbMV0pO1xuICAgIGxldCBhdHRyRW5kID0gYXR0ck5hbWUuc291cmNlU3Bhbi5lbmQ7XG5cbiAgICAvLyBDb25zdW1lIGFueSBxdW90ZVxuICAgIGlmICh0aGlzLl9wZWVrLnR5cGUgPT09IFRva2VuVHlwZS5BVFRSX1FVT1RFKSB7XG4gICAgICB0aGlzLl9hZHZhbmNlKCk7XG4gICAgfVxuXG4gICAgLy8gQ29uc3VtZSB0aGUgYXR0cmlidXRlIHZhbHVlXG4gICAgbGV0IHZhbHVlID0gJyc7XG4gICAgY29uc3QgdmFsdWVUb2tlbnM6IEludGVycG9sYXRlZEF0dHJpYnV0ZVRva2VuW10gPSBbXTtcbiAgICBsZXQgdmFsdWVTdGFydFNwYW46IFBhcnNlU291cmNlU3Bhbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgbGV0IHZhbHVlRW5kOiBQYXJzZUxvY2F0aW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAvLyBOT1RFOiBXZSBuZWVkIHRvIHVzZSBhIG5ldyB2YXJpYWJsZSBgbmV4dFRva2VuVHlwZWAgaGVyZSB0byBoaWRlIHRoZSBhY3R1YWwgdHlwZSBvZlxuICAgIC8vIGBfcGVlay50eXBlYCBmcm9tIFRTLiBPdGhlcndpc2UgVFMgd2lsbCBuYXJyb3cgdGhlIHR5cGUgb2YgYF9wZWVrLnR5cGVgIHByZXZlbnRpbmcgaXQgZnJvbVxuICAgIC8vIGJlaW5nIGFibGUgdG8gY29uc2lkZXIgYEFUVFJfVkFMVUVfSU5URVJQT0xBVElPTmAgYXMgYW4gb3B0aW9uLiBUaGlzIGlzIGJlY2F1c2UgVFMgaXMgbm90XG4gICAgLy8gYWJsZSB0byBzZWUgdGhhdCBgX2FkdmFuY2UoKWAgd2lsbCBhY3R1YWxseSBtdXRhdGUgYF9wZWVrYC5cbiAgICBjb25zdCBuZXh0VG9rZW5UeXBlID0gdGhpcy5fcGVlay50eXBlIGFzIFRva2VuVHlwZTtcbiAgICBpZiAobmV4dFRva2VuVHlwZSA9PT0gVG9rZW5UeXBlLkFUVFJfVkFMVUVfVEVYVCkge1xuICAgICAgdmFsdWVTdGFydFNwYW4gPSB0aGlzLl9wZWVrLnNvdXJjZVNwYW47XG4gICAgICB2YWx1ZUVuZCA9IHRoaXMuX3BlZWsuc291cmNlU3Bhbi5lbmQ7XG4gICAgICB3aGlsZSAodGhpcy5fcGVlay50eXBlID09PSBUb2tlblR5cGUuQVRUUl9WQUxVRV9URVhUIHx8XG4gICAgICAgICAgICAgdGhpcy5fcGVlay50eXBlID09PSBUb2tlblR5cGUuQVRUUl9WQUxVRV9JTlRFUlBPTEFUSU9OIHx8XG4gICAgICAgICAgICAgdGhpcy5fcGVlay50eXBlID09PSBUb2tlblR5cGUuRU5DT0RFRF9FTlRJVFkpIHtcbiAgICAgICAgY29uc3QgdmFsdWVUb2tlbiA9IHRoaXMuX2FkdmFuY2U8SW50ZXJwb2xhdGVkQXR0cmlidXRlVG9rZW4+KCk7XG4gICAgICAgIHZhbHVlVG9rZW5zLnB1c2godmFsdWVUb2tlbik7XG4gICAgICAgIGlmICh2YWx1ZVRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5BVFRSX1ZBTFVFX0lOVEVSUE9MQVRJT04pIHtcbiAgICAgICAgICAvLyBGb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSB3ZSBkZWNvZGUgSFRNTCBlbnRpdGllcyB0aGF0IGFwcGVhciBpbiBpbnRlcnBvbGF0aW9uXG4gICAgICAgICAgLy8gZXhwcmVzc2lvbnMuIFRoaXMgaXMgYXJndWFibHkgYSBidWcsIGJ1dCBpdCBjb3VsZCBiZSBhIGNvbnNpZGVyYWJsZSBicmVha2luZyBjaGFuZ2UgdG9cbiAgICAgICAgICAvLyBmaXggaXQuIEl0IHNob3VsZCBiZSBhZGRyZXNzZWQgaW4gYSBsYXJnZXIgcHJvamVjdCB0byByZWZhY3RvciB0aGUgZW50aXJlIHBhcnNlci9sZXhlclxuICAgICAgICAgIC8vIGNoYWluIGFmdGVyIFZpZXcgRW5naW5lIGhhcyBiZWVuIHJlbW92ZWQuXG4gICAgICAgICAgdmFsdWUgKz0gdmFsdWVUb2tlbi5wYXJ0cy5qb2luKCcnKS5yZXBsYWNlKC8mKFteO10rKTsvZywgZGVjb2RlRW50aXR5KTtcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZVRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5FTkNPREVEX0VOVElUWSkge1xuICAgICAgICAgIHZhbHVlICs9IHZhbHVlVG9rZW4ucGFydHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgKz0gdmFsdWVUb2tlbi5wYXJ0cy5qb2luKCcnKTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZUVuZCA9IGF0dHJFbmQgPSB2YWx1ZVRva2VuLnNvdXJjZVNwYW4uZW5kO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENvbnN1bWUgYW55IHF1b3RlXG4gICAgaWYgKHRoaXMuX3BlZWsudHlwZSA9PT0gVG9rZW5UeXBlLkFUVFJfUVVPVEUpIHtcbiAgICAgIGNvbnN0IHF1b3RlVG9rZW4gPSB0aGlzLl9hZHZhbmNlPEF0dHJpYnV0ZVF1b3RlVG9rZW4+KCk7XG4gICAgICBhdHRyRW5kID0gcXVvdGVUb2tlbi5zb3VyY2VTcGFuLmVuZDtcbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZVNwYW4gPSB2YWx1ZVN0YXJ0U3BhbiAmJiB2YWx1ZUVuZCAmJlxuICAgICAgICBuZXcgUGFyc2VTb3VyY2VTcGFuKHZhbHVlU3RhcnRTcGFuLnN0YXJ0LCB2YWx1ZUVuZCwgdmFsdWVTdGFydFNwYW4uZnVsbFN0YXJ0KTtcbiAgICByZXR1cm4gbmV3IGh0bWwuQXR0cmlidXRlKFxuICAgICAgICBmdWxsTmFtZSwgdmFsdWUsXG4gICAgICAgIG5ldyBQYXJzZVNvdXJjZVNwYW4oYXR0ck5hbWUuc291cmNlU3Bhbi5zdGFydCwgYXR0ckVuZCwgYXR0ck5hbWUuc291cmNlU3Bhbi5mdWxsU3RhcnQpLFxuICAgICAgICBhdHRyTmFtZS5zb3VyY2VTcGFuLCB2YWx1ZVNwYW4sIHZhbHVlVG9rZW5zLmxlbmd0aCA+IDAgPyB2YWx1ZVRva2VucyA6IHVuZGVmaW5lZCxcbiAgICAgICAgdW5kZWZpbmVkKTtcbiAgfVxuXG5cbiAgcHJpdmF0ZSBfY29uc3VtZUJsb2NrR3JvdXBPcGVuKHRva2VuOiBCbG9ja0dyb3VwT3BlblN0YXJ0VG9rZW4pIHtcbiAgICBjb25zdCBlbmQgPSB0aGlzLl9wZWVrLnNvdXJjZVNwYW4uZnVsbFN0YXJ0O1xuICAgIGNvbnN0IHNwYW4gPSBuZXcgUGFyc2VTb3VyY2VTcGFuKHRva2VuLnNvdXJjZVNwYW4uc3RhcnQsIGVuZCwgdG9rZW4uc291cmNlU3Bhbi5mdWxsU3RhcnQpO1xuICAgIC8vIENyZWF0ZSBhIHNlcGFyYXRlIGBzdGFydFNwYW5gIGJlY2F1c2UgYHNwYW5gIHdpbGwgYmUgbW9kaWZpZWQgd2hlbiB0aGVyZSBpcyBhbiBgZW5kYCBzcGFuLlxuICAgIGNvbnN0IHN0YXJ0U3BhbiA9IG5ldyBQYXJzZVNvdXJjZVNwYW4odG9rZW4uc291cmNlU3Bhbi5zdGFydCwgZW5kLCB0b2tlbi5zb3VyY2VTcGFuLmZ1bGxTdGFydCk7XG4gICAgY29uc3QgYmxvY2tHcm91cCA9IG5ldyBodG1sLkJsb2NrR3JvdXAoW10sIHNwYW4sIHN0YXJ0U3BhbiwgbnVsbCk7XG4gICAgdGhpcy5fcHVzaENvbnRhaW5lcihibG9ja0dyb3VwLCBmYWxzZSk7XG4gICAgY29uc3QgaW1wbGljaXRCbG9jayA9IHRoaXMuX2NvbnN1bWVCbG9jayh0b2tlbiwgVG9rZW5UeXBlLkJMT0NLX0dST1VQX09QRU5fRU5EKTtcblxuICAgIC8vIEJsb2NrIHBhcmFtZXRlcnMgYXJlIGNvbnN1bWVkIGFzIGEgcGFydCBvZiB0aGUgaW1wbGljaXQgYmxvY2sgc28gd2UgbmVlZCB0byBleHBhbmQgdGhlXG4gICAgLy8gc3RhcnQgc291cmNlIHNwYW4gb25jZSB0aGUgYmxvY2sgaXMgcGFyc2VkIHRvIGluY2x1ZGUgdGhlIGZ1bGwgb3BlbmluZyB0YWcuXG4gICAgc3RhcnRTcGFuLmVuZCA9IGltcGxpY2l0QmxvY2suc3RhcnRTb3VyY2VTcGFuLmVuZDtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnN1bWVCbG9jayhcbiAgICAgIHRva2VuOiBCbG9ja09wZW5TdGFydFRva2VufEJsb2NrR3JvdXBPcGVuU3RhcnRUb2tlbiwgY2xvc2VUb2tlbjogVG9rZW5UeXBlKSB7XG4gICAgLy8gVGhlIHN0YXJ0IG9mIGEgYmxvY2sgaW1wbGljaXRseSBjbG9zZXMgdGhlIHByZXZpb3VzIGJsb2NrLlxuICAgIHRoaXMuX2NvbmRpdGlvbmFsbHlDbG9zZVByZXZpb3VzQmxvY2soKTtcblxuICAgIGNvbnN0IHBhcmFtZXRlcnM6IGh0bWwuQmxvY2tQYXJhbWV0ZXJbXSA9IFtdO1xuXG4gICAgd2hpbGUgKHRoaXMuX3BlZWsudHlwZSA9PT0gVG9rZW5UeXBlLkJMT0NLX1BBUkFNRVRFUikge1xuICAgICAgY29uc3QgcGFyYW1Ub2tlbiA9IHRoaXMuX2FkdmFuY2U8QmxvY2tQYXJhbWV0ZXJUb2tlbj4oKTtcbiAgICAgIHBhcmFtZXRlcnMucHVzaChuZXcgaHRtbC5CbG9ja1BhcmFtZXRlcihwYXJhbVRva2VuLnBhcnRzWzBdLCBwYXJhbVRva2VuLnNvdXJjZVNwYW4pKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcGVlay50eXBlID09PSBjbG9zZVRva2VuKSB7XG4gICAgICB0aGlzLl9hZHZhbmNlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgZW5kID0gdGhpcy5fcGVlay5zb3VyY2VTcGFuLmZ1bGxTdGFydDtcbiAgICBjb25zdCBzcGFuID0gbmV3IFBhcnNlU291cmNlU3Bhbih0b2tlbi5zb3VyY2VTcGFuLnN0YXJ0LCBlbmQsIHRva2VuLnNvdXJjZVNwYW4uZnVsbFN0YXJ0KTtcbiAgICAvLyBDcmVhdGUgYSBzZXBhcmF0ZSBgc3RhcnRTcGFuYCBiZWNhdXNlIGBzcGFuYCB3aWxsIGJlIG1vZGlmaWVkIHdoZW4gdGhlcmUgaXMgYW4gYGVuZGAgc3Bhbi5cbiAgICBjb25zdCBzdGFydFNwYW4gPSBuZXcgUGFyc2VTb3VyY2VTcGFuKHRva2VuLnNvdXJjZVNwYW4uc3RhcnQsIGVuZCwgdG9rZW4uc291cmNlU3Bhbi5mdWxsU3RhcnQpO1xuICAgIGNvbnN0IGJsb2NrID0gbmV3IGh0bWwuQmxvY2sodG9rZW4ucGFydHNbMF0sIHBhcmFtZXRlcnMsIFtdLCBzcGFuLCBzdGFydFNwYW4pO1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX2dldENvbnRhaW5lcigpO1xuXG4gICAgaWYgKCEocGFyZW50IGluc3RhbmNlb2YgaHRtbC5CbG9ja0dyb3VwKSkge1xuICAgICAgdGhpcy5lcnJvcnMucHVzaChUcmVlRXJyb3IuY3JlYXRlKFxuICAgICAgICAgIGJsb2NrLm5hbWUsIGJsb2NrLnNvdXJjZVNwYW4sICdCbG9ja3MgY2FuIG9ubHkgYmUgcGxhY2VkIGluc2lkZSBvZiBibG9jayBncm91cHMuJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJlbnQuYmxvY2tzLnB1c2goYmxvY2spO1xuICAgICAgdGhpcy5fY29udGFpbmVyU3RhY2sucHVzaChibG9jayk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJsb2NrO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29uc3VtZUJsb2NrR3JvdXBDbG9zZSh0b2tlbjogQmxvY2tHcm91cENsb3NlVG9rZW4pIHtcbiAgICBjb25zdCBuYW1lID0gdG9rZW4ucGFydHNbMF07XG4gICAgY29uc3QgcHJldmlvdXNDb250YWluZXIgPSB0aGlzLl9nZXRDb250YWluZXIoKTtcblxuICAgIC8vIEJsb2NrcyBhcmUgaW1wbGNpdGx5IGNsb3NlZCBieSB0aGUgYmxvY2sgZ3JvdXAuXG4gICAgdGhpcy5fY29uZGl0aW9uYWxseUNsb3NlUHJldmlvdXNCbG9jaygpO1xuXG4gICAgaWYgKCF0aGlzLl9wb3BDb250YWluZXIobmFtZSwgaHRtbC5CbG9ja0dyb3VwLCB0b2tlbi5zb3VyY2VTcGFuKSkge1xuICAgICAgY29uc3QgY29udGV4dCA9IHByZXZpb3VzQ29udGFpbmVyIGluc3RhbmNlb2YgaHRtbC5FbGVtZW50ID9cbiAgICAgICAgICBgVGhlcmUgaXMgYW4gdW5jbG9zZWQgXCIke1xuICAgICAgICAgICAgICBwcmV2aW91c0NvbnRhaW5lci5uYW1lfVwiIEhUTUwgdGFnIG5hbWVkIHRoYXQgbWF5IGhhdmUgdG8gYmUgY2xvc2VkIGZpcnN0LmAgOlxuICAgICAgICAgIGBUaGUgYmxvY2sgbWF5IGhhdmUgYmVlbiBjbG9zZWQgZWFybGllci5gO1xuICAgICAgdGhpcy5lcnJvcnMucHVzaChUcmVlRXJyb3IuY3JlYXRlKFxuICAgICAgICAgIG5hbWUsIHRva2VuLnNvdXJjZVNwYW4sIGBVbmV4cGVjdGVkIGNsb3NpbmcgYmxvY2sgXCIke25hbWV9XCIuICR7Y29udGV4dH1gKSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY29uZGl0aW9uYWxseUNsb3NlUHJldmlvdXNCbG9jaygpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLl9nZXRDb250YWluZXIoKTtcblxuICAgIGlmIChjb250YWluZXIgaW5zdGFuY2VvZiBodG1sLkJsb2NrKSB7XG4gICAgICAvLyBCbG9ja3MgZG9uJ3QgaGF2ZSBhbiBleHBsaWNpdCBjbG9zaW5nIHRhZywgdGhleSdyZSBjbG9zZWQgZWl0aGVyIGJ5IHRoZSBuZXh0IGJsb2NrIG9yXG4gICAgICAvLyB0aGUgZW5kIG9mIHRoZSBibG9jayBncm91cC4gSW5mZXIgdGhlIGVuZCBzcGFuIGZyb20gdGhlIGxhc3QgY2hpbGQgbm9kZS5cbiAgICAgIGNvbnN0IGxhc3RDaGlsZCA9XG4gICAgICAgICAgY29udGFpbmVyLmNoaWxkcmVuLmxlbmd0aCA/IGNvbnRhaW5lci5jaGlsZHJlbltjb250YWluZXIuY2hpbGRyZW4ubGVuZ3RoIC0gMV0gOiBudWxsO1xuICAgICAgY29uc3QgZW5kU3BhbiA9IGxhc3RDaGlsZCA9PT0gbnVsbCA/XG4gICAgICAgICAgbnVsbCA6XG4gICAgICAgICAgbmV3IFBhcnNlU291cmNlU3BhbihsYXN0Q2hpbGQuc291cmNlU3Bhbi5lbmQsIGxhc3RDaGlsZC5zb3VyY2VTcGFuLmVuZCk7XG5cbiAgICAgIHRoaXMuX3BvcENvbnRhaW5lcihjb250YWluZXIubmFtZSwgaHRtbC5CbG9jaywgZW5kU3Bhbik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0Q29udGFpbmVyKCk6IE5vZGVDb250YWluZXJ8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lclN0YWNrLmxlbmd0aCA+IDAgPyB0aGlzLl9jb250YWluZXJTdGFja1t0aGlzLl9jb250YWluZXJTdGFjay5sZW5ndGggLSAxXSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0Q2xvc2VzdFBhcmVudEVsZW1lbnQoKTogaHRtbC5FbGVtZW50fG51bGwge1xuICAgIGZvciAobGV0IGkgPSB0aGlzLl9jb250YWluZXJTdGFjay5sZW5ndGggLSAxOyBpID4gLTE7IGktLSkge1xuICAgICAgaWYgKHRoaXMuX2NvbnRhaW5lclN0YWNrW2ldIGluc3RhbmNlb2YgaHRtbC5FbGVtZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250YWluZXJTdGFja1tpXSBhcyBodG1sLkVsZW1lbnQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIF9hZGRUb1BhcmVudChub2RlOiBodG1sLk5vZGUpIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9nZXRDb250YWluZXIoKTtcblxuICAgIGlmIChwYXJlbnQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMucm9vdE5vZGVzLnB1c2gobm9kZSk7XG4gICAgfSBlbHNlIGlmIChwYXJlbnQgaW5zdGFuY2VvZiBodG1sLkJsb2NrR3JvdXApIHtcbiAgICAgIC8vIER1ZSB0byBob3cgcGFyc2luZyBpcyBzZXQgdXAsIHdlJ3JlIHVubGlrZWx5IHRvIGhpdCB0aGlzIGNvZGUgcGF0aCwgYnV0IHdlXG4gICAgICAvLyBoYXZlIHRoZSBhc3NlcnRpb24gaGVyZSBqdXN0IGluIGNhc2UgYW5kIHRvIHNhdGlzZnkgdGhlIHR5cGUgY2hlY2tlci5cbiAgICAgIHRoaXMuZXJyb3JzLnB1c2goXG4gICAgICAgICAgVHJlZUVycm9yLmNyZWF0ZShudWxsLCBub2RlLnNvdXJjZVNwYW4sICdCbG9jayBncm91cHMgY2FuIG9ubHkgY29udGFpbiBibG9ja3MuJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJlbnQuY2hpbGRyZW4ucHVzaChub2RlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRFbGVtZW50RnVsbE5hbWUocHJlZml4OiBzdHJpbmcsIGxvY2FsTmFtZTogc3RyaW5nLCBwYXJlbnRFbGVtZW50OiBodG1sLkVsZW1lbnR8bnVsbCk6XG4gICAgICBzdHJpbmcge1xuICAgIGlmIChwcmVmaXggPT09ICcnKSB7XG4gICAgICBwcmVmaXggPSB0aGlzLmdldFRhZ0RlZmluaXRpb24obG9jYWxOYW1lKS5pbXBsaWNpdE5hbWVzcGFjZVByZWZpeCB8fCAnJztcbiAgICAgIGlmIChwcmVmaXggPT09ICcnICYmIHBhcmVudEVsZW1lbnQgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBwYXJlbnRUYWdOYW1lID0gc3BsaXROc05hbWUocGFyZW50RWxlbWVudC5uYW1lKVsxXTtcbiAgICAgICAgY29uc3QgcGFyZW50VGFnRGVmaW5pdGlvbiA9IHRoaXMuZ2V0VGFnRGVmaW5pdGlvbihwYXJlbnRUYWdOYW1lKTtcbiAgICAgICAgaWYgKCFwYXJlbnRUYWdEZWZpbml0aW9uLnByZXZlbnROYW1lc3BhY2VJbmhlcml0YW5jZSkge1xuICAgICAgICAgIHByZWZpeCA9IGdldE5zUHJlZml4KHBhcmVudEVsZW1lbnQubmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbWVyZ2VOc0FuZE5hbWUocHJlZml4LCBsb2NhbE5hbWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGxhc3RPblN0YWNrKHN0YWNrOiBhbnlbXSwgZWxlbWVudDogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBzdGFjay5sZW5ndGggPiAwICYmIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdID09PSBlbGVtZW50O1xufVxuXG4vKipcbiAqIERlY29kZSB0aGUgYGVudGl0eWAgc3RyaW5nLCB3aGljaCB3ZSBiZWxpZXZlIGlzIHRoZSBjb250ZW50cyBvZiBhbiBIVE1MIGVudGl0eS5cbiAqXG4gKiBJZiB0aGUgc3RyaW5nIGlzIG5vdCBhY3R1YWxseSBhIHZhbGlkL2tub3duIGVudGl0eSB0aGVuIGp1c3QgcmV0dXJuIHRoZSBvcmlnaW5hbCBgbWF0Y2hgIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gZGVjb2RlRW50aXR5KG1hdGNoOiBzdHJpbmcsIGVudGl0eTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKE5BTUVEX0VOVElUSUVTW2VudGl0eV0gIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBOQU1FRF9FTlRJVElFU1tlbnRpdHldIHx8IG1hdGNoO1xuICB9XG4gIGlmICgvXiN4W2EtZjAtOV0rJC9pLnRlc3QoZW50aXR5KSkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNvZGVQb2ludChwYXJzZUludChlbnRpdHkuc2xpY2UoMiksIDE2KSk7XG4gIH1cbiAgaWYgKC9eI1xcZCskLy50ZXN0KGVudGl0eSkpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21Db2RlUG9pbnQocGFyc2VJbnQoZW50aXR5LnNsaWNlKDEpLCAxMCkpO1xuICB9XG4gIHJldHVybiBtYXRjaDtcbn1cbiJdfQ==