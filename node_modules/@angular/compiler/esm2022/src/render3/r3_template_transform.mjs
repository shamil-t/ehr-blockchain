/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as html from '../ml_parser/ast';
import { replaceNgsp } from '../ml_parser/html_whitespaces';
import { isNgTemplate } from '../ml_parser/tags';
import { ParseError, ParseErrorLevel, ParseSourceSpan } from '../parse_util';
import { isStyleUrlResolvable } from '../style_url_resolver';
import { PreparsedElementType, preparseElement } from '../template_parser/template_preparser';
import * as t from './r3_ast';
import { createDeferredBlock } from './r3_deferred_blocks';
import { I18N_ICU_VAR_PREFIX, isI18nRootNode } from './view/i18n/util';
const BIND_NAME_REGEXP = /^(?:(bind-)|(let-)|(ref-|#)|(on-)|(bindon-)|(@))(.*)$/;
// Group 1 = "bind-"
const KW_BIND_IDX = 1;
// Group 2 = "let-"
const KW_LET_IDX = 2;
// Group 3 = "ref-/#"
const KW_REF_IDX = 3;
// Group 4 = "on-"
const KW_ON_IDX = 4;
// Group 5 = "bindon-"
const KW_BINDON_IDX = 5;
// Group 6 = "@"
const KW_AT_IDX = 6;
// Group 7 = the identifier after "bind-", "let-", "ref-/#", "on-", "bindon-" or "@"
const IDENT_KW_IDX = 7;
const BINDING_DELIMS = {
    BANANA_BOX: { start: '[(', end: ')]' },
    PROPERTY: { start: '[', end: ']' },
    EVENT: { start: '(', end: ')' },
};
const TEMPLATE_ATTR_PREFIX = '*';
export function htmlAstToRender3Ast(htmlNodes, bindingParser, options) {
    const transformer = new HtmlAstToIvyAst(bindingParser, options);
    const ivyNodes = html.visitAll(transformer, htmlNodes);
    // Errors might originate in either the binding parser or the html to ivy transformer
    const allErrors = bindingParser.errors.concat(transformer.errors);
    const result = {
        nodes: ivyNodes,
        errors: allErrors,
        styleUrls: transformer.styleUrls,
        styles: transformer.styles,
        ngContentSelectors: transformer.ngContentSelectors
    };
    if (options.collectCommentNodes) {
        result.commentNodes = transformer.commentNodes;
    }
    return result;
}
class HtmlAstToIvyAst {
    constructor(bindingParser, options) {
        this.bindingParser = bindingParser;
        this.options = options;
        this.errors = [];
        this.styles = [];
        this.styleUrls = [];
        this.ngContentSelectors = [];
        // This array will be populated if `Render3ParseOptions['collectCommentNodes']` is true
        this.commentNodes = [];
        this.inI18nBlock = false;
    }
    // HTML visitor
    visitElement(element) {
        const isI18nRootElement = isI18nRootNode(element.i18n);
        if (isI18nRootElement) {
            if (this.inI18nBlock) {
                this.reportError('Cannot mark an element as translatable inside of a translatable section. Please remove the nested i18n marker.', element.sourceSpan);
            }
            this.inI18nBlock = true;
        }
        const preparsedElement = preparseElement(element);
        if (preparsedElement.type === PreparsedElementType.SCRIPT) {
            return null;
        }
        else if (preparsedElement.type === PreparsedElementType.STYLE) {
            const contents = textContents(element);
            if (contents !== null) {
                this.styles.push(contents);
            }
            return null;
        }
        else if (preparsedElement.type === PreparsedElementType.STYLESHEET &&
            isStyleUrlResolvable(preparsedElement.hrefAttr)) {
            this.styleUrls.push(preparsedElement.hrefAttr);
            return null;
        }
        // Whether the element is a `<ng-template>`
        const isTemplateElement = isNgTemplate(element.name);
        const parsedProperties = [];
        const boundEvents = [];
        const variables = [];
        const references = [];
        const attributes = [];
        const i18nAttrsMeta = {};
        const templateParsedProperties = [];
        const templateVariables = [];
        // Whether the element has any *-attribute
        let elementHasInlineTemplate = false;
        for (const attribute of element.attrs) {
            let hasBinding = false;
            const normalizedName = normalizeAttributeName(attribute.name);
            // `*attr` defines template bindings
            let isTemplateBinding = false;
            if (attribute.i18n) {
                i18nAttrsMeta[attribute.name] = attribute.i18n;
            }
            if (normalizedName.startsWith(TEMPLATE_ATTR_PREFIX)) {
                // *-attributes
                if (elementHasInlineTemplate) {
                    this.reportError(`Can't have multiple template bindings on one element. Use only one attribute prefixed with *`, attribute.sourceSpan);
                }
                isTemplateBinding = true;
                elementHasInlineTemplate = true;
                const templateValue = attribute.value;
                const templateKey = normalizedName.substring(TEMPLATE_ATTR_PREFIX.length);
                const parsedVariables = [];
                const absoluteValueOffset = attribute.valueSpan ?
                    attribute.valueSpan.start.offset :
                    // If there is no value span the attribute does not have a value, like `attr` in
                    //`<div attr></div>`. In this case, point to one character beyond the last character of
                    // the attribute name.
                    attribute.sourceSpan.start.offset + attribute.name.length;
                this.bindingParser.parseInlineTemplateBinding(templateKey, templateValue, attribute.sourceSpan, absoluteValueOffset, [], templateParsedProperties, parsedVariables, true /* isIvyAst */);
                templateVariables.push(...parsedVariables.map(v => new t.Variable(v.name, v.value, v.sourceSpan, v.keySpan, v.valueSpan)));
            }
            else {
                // Check for variables, events, property bindings, interpolation
                hasBinding = this.parseAttribute(isTemplateElement, attribute, [], parsedProperties, boundEvents, variables, references);
            }
            if (!hasBinding && !isTemplateBinding) {
                // don't include the bindings as attributes as well in the AST
                attributes.push(this.visitAttribute(attribute));
            }
        }
        let children;
        if (preparsedElement.nonBindable) {
            // The `NonBindableVisitor` may need to return an array of nodes for block groups so we need
            // to flatten the array here. Avoid doing this for the `HtmlAstToIvyAst` since `flat` creates
            // a new array.
            children = html.visitAll(NON_BINDABLE_VISITOR, element.children).flat(Infinity);
        }
        else {
            children = html.visitAll(this, element.children);
        }
        let parsedElement;
        if (preparsedElement.type === PreparsedElementType.NG_CONTENT) {
            // `<ng-content>`
            if (element.children &&
                !element.children.every((node) => isEmptyTextNode(node) || isCommentNode(node))) {
                this.reportError(`<ng-content> element cannot have content.`, element.sourceSpan);
            }
            const selector = preparsedElement.selectAttr;
            const attrs = element.attrs.map(attr => this.visitAttribute(attr));
            parsedElement = new t.Content(selector, attrs, element.sourceSpan, element.i18n);
            this.ngContentSelectors.push(selector);
        }
        else if (isTemplateElement) {
            // `<ng-template>`
            const attrs = this.extractAttributes(element.name, parsedProperties, i18nAttrsMeta);
            parsedElement = new t.Template(element.name, attributes, attrs.bound, boundEvents, [ /* no template attributes */], children, references, variables, element.sourceSpan, element.startSourceSpan, element.endSourceSpan, element.i18n);
        }
        else {
            const attrs = this.extractAttributes(element.name, parsedProperties, i18nAttrsMeta);
            parsedElement = new t.Element(element.name, attributes, attrs.bound, boundEvents, children, references, element.sourceSpan, element.startSourceSpan, element.endSourceSpan, element.i18n);
        }
        if (elementHasInlineTemplate) {
            // If this node is an inline-template (e.g. has *ngFor) then we need to create a template
            // node that contains this node.
            // Moreover, if the node is an element, then we need to hoist its attributes to the template
            // node for matching against content projection selectors.
            const attrs = this.extractAttributes('ng-template', templateParsedProperties, i18nAttrsMeta);
            const templateAttrs = [];
            attrs.literal.forEach(attr => templateAttrs.push(attr));
            attrs.bound.forEach(attr => templateAttrs.push(attr));
            const hoistedAttrs = parsedElement instanceof t.Element ?
                {
                    attributes: parsedElement.attributes,
                    inputs: parsedElement.inputs,
                    outputs: parsedElement.outputs,
                } :
                { attributes: [], inputs: [], outputs: [] };
            // For <ng-template>s with structural directives on them, avoid passing i18n information to
            // the wrapping template to prevent unnecessary i18n instructions from being generated. The
            // necessary i18n meta information will be extracted from child elements.
            const i18n = isTemplateElement && isI18nRootElement ? undefined : element.i18n;
            const name = parsedElement instanceof t.Template ? null : parsedElement.name;
            parsedElement = new t.Template(name, hoistedAttrs.attributes, hoistedAttrs.inputs, hoistedAttrs.outputs, templateAttrs, [parsedElement], [ /* no references */], templateVariables, element.sourceSpan, element.startSourceSpan, element.endSourceSpan, i18n);
        }
        if (isI18nRootElement) {
            this.inI18nBlock = false;
        }
        return parsedElement;
    }
    visitAttribute(attribute) {
        return new t.TextAttribute(attribute.name, attribute.value, attribute.sourceSpan, attribute.keySpan, attribute.valueSpan, attribute.i18n);
    }
    visitText(text) {
        return this._visitTextWithInterpolation(text.value, text.sourceSpan, text.tokens, text.i18n);
    }
    visitExpansion(expansion) {
        if (!expansion.i18n) {
            // do not generate Icu in case it was created
            // outside of i18n block in a template
            return null;
        }
        if (!isI18nRootNode(expansion.i18n)) {
            throw new Error(`Invalid type "${expansion.i18n.constructor}" for "i18n" property of ${expansion.sourceSpan.toString()}. Expected a "Message"`);
        }
        const message = expansion.i18n;
        const vars = {};
        const placeholders = {};
        // extract VARs from ICUs - we process them separately while
        // assembling resulting message via goog.getMsg function, since
        // we need to pass them to top-level goog.getMsg call
        Object.keys(message.placeholders).forEach(key => {
            const value = message.placeholders[key];
            if (key.startsWith(I18N_ICU_VAR_PREFIX)) {
                // Currently when the `plural` or `select` keywords in an ICU contain trailing spaces (e.g.
                // `{count, select , ...}`), these spaces are also included into the key names in ICU vars
                // (e.g. "VAR_SELECT "). These trailing spaces are not desirable, since they will later be
                // converted into `_` symbols while normalizing placeholder names, which might lead to
                // mismatches at runtime (i.e. placeholder will not be replaced with the correct value).
                const formattedKey = key.trim();
                const ast = this.bindingParser.parseInterpolationExpression(value.text, value.sourceSpan);
                vars[formattedKey] = new t.BoundText(ast, value.sourceSpan);
            }
            else {
                placeholders[key] = this._visitTextWithInterpolation(value.text, value.sourceSpan, null);
            }
        });
        return new t.Icu(vars, placeholders, expansion.sourceSpan, message);
    }
    visitExpansionCase(expansionCase) {
        return null;
    }
    visitComment(comment) {
        if (this.options.collectCommentNodes) {
            this.commentNodes.push(new t.Comment(comment.value || '', comment.sourceSpan));
        }
        return null;
    }
    visitBlockGroup(group, context) {
        const primaryBlock = group.blocks[0];
        // The HTML parser ensures that we don't hit this case, but we have an assertion just in case.
        if (!primaryBlock) {
            this.reportError('Block group must have at least one block.', group.sourceSpan);
            return null;
        }
        if (primaryBlock.name === 'defer' && this.options.enabledBlockTypes.has(primaryBlock.name)) {
            const { node, errors } = createDeferredBlock(group, this, this.bindingParser);
            this.errors.push(...errors);
            return node;
        }
        this.reportError(`Unrecognized block "${primaryBlock.name}".`, primaryBlock.sourceSpan);
        return null;
    }
    visitBlock(block, context) { }
    visitBlockParameter(parameter, context) { }
    // convert view engine `ParsedProperty` to a format suitable for IVY
    extractAttributes(elementName, properties, i18nPropsMeta) {
        const bound = [];
        const literal = [];
        properties.forEach(prop => {
            const i18n = i18nPropsMeta[prop.name];
            if (prop.isLiteral) {
                literal.push(new t.TextAttribute(prop.name, prop.expression.source || '', prop.sourceSpan, prop.keySpan, prop.valueSpan, i18n));
            }
            else {
                // Note that validation is skipped and property mapping is disabled
                // due to the fact that we need to make sure a given prop is not an
                // input of a directive and directive matching happens at runtime.
                const bep = this.bindingParser.createBoundElementProperty(elementName, prop, /* skipValidation */ true, /* mapPropertyName */ false);
                bound.push(t.BoundAttribute.fromBoundElementProperty(bep, i18n));
            }
        });
        return { bound, literal };
    }
    parseAttribute(isTemplateElement, attribute, matchableAttributes, parsedProperties, boundEvents, variables, references) {
        const name = normalizeAttributeName(attribute.name);
        const value = attribute.value;
        const srcSpan = attribute.sourceSpan;
        const absoluteOffset = attribute.valueSpan ? attribute.valueSpan.start.offset : srcSpan.start.offset;
        function createKeySpan(srcSpan, prefix, identifier) {
            // We need to adjust the start location for the keySpan to account for the removed 'data-'
            // prefix from `normalizeAttributeName`.
            const normalizationAdjustment = attribute.name.length - name.length;
            const keySpanStart = srcSpan.start.moveBy(prefix.length + normalizationAdjustment);
            const keySpanEnd = keySpanStart.moveBy(identifier.length);
            return new ParseSourceSpan(keySpanStart, keySpanEnd, keySpanStart, identifier);
        }
        const bindParts = name.match(BIND_NAME_REGEXP);
        if (bindParts) {
            if (bindParts[KW_BIND_IDX] != null) {
                const identifier = bindParts[IDENT_KW_IDX];
                const keySpan = createKeySpan(srcSpan, bindParts[KW_BIND_IDX], identifier);
                this.bindingParser.parsePropertyBinding(identifier, value, false, srcSpan, absoluteOffset, attribute.valueSpan, matchableAttributes, parsedProperties, keySpan);
            }
            else if (bindParts[KW_LET_IDX]) {
                if (isTemplateElement) {
                    const identifier = bindParts[IDENT_KW_IDX];
                    const keySpan = createKeySpan(srcSpan, bindParts[KW_LET_IDX], identifier);
                    this.parseVariable(identifier, value, srcSpan, keySpan, attribute.valueSpan, variables);
                }
                else {
                    this.reportError(`"let-" is only supported on ng-template elements.`, srcSpan);
                }
            }
            else if (bindParts[KW_REF_IDX]) {
                const identifier = bindParts[IDENT_KW_IDX];
                const keySpan = createKeySpan(srcSpan, bindParts[KW_REF_IDX], identifier);
                this.parseReference(identifier, value, srcSpan, keySpan, attribute.valueSpan, references);
            }
            else if (bindParts[KW_ON_IDX]) {
                const events = [];
                const identifier = bindParts[IDENT_KW_IDX];
                const keySpan = createKeySpan(srcSpan, bindParts[KW_ON_IDX], identifier);
                this.bindingParser.parseEvent(identifier, value, /* isAssignmentEvent */ false, srcSpan, attribute.valueSpan || srcSpan, matchableAttributes, events, keySpan);
                addEvents(events, boundEvents);
            }
            else if (bindParts[KW_BINDON_IDX]) {
                const identifier = bindParts[IDENT_KW_IDX];
                const keySpan = createKeySpan(srcSpan, bindParts[KW_BINDON_IDX], identifier);
                this.bindingParser.parsePropertyBinding(identifier, value, false, srcSpan, absoluteOffset, attribute.valueSpan, matchableAttributes, parsedProperties, keySpan);
                this.parseAssignmentEvent(identifier, value, srcSpan, attribute.valueSpan, matchableAttributes, boundEvents, keySpan);
            }
            else if (bindParts[KW_AT_IDX]) {
                const keySpan = createKeySpan(srcSpan, '', name);
                this.bindingParser.parseLiteralAttr(name, value, srcSpan, absoluteOffset, attribute.valueSpan, matchableAttributes, parsedProperties, keySpan);
            }
            return true;
        }
        // We didn't see a kw-prefixed property binding, but we have not yet checked
        // for the []/()/[()] syntax.
        let delims = null;
        if (name.startsWith(BINDING_DELIMS.BANANA_BOX.start)) {
            delims = BINDING_DELIMS.BANANA_BOX;
        }
        else if (name.startsWith(BINDING_DELIMS.PROPERTY.start)) {
            delims = BINDING_DELIMS.PROPERTY;
        }
        else if (name.startsWith(BINDING_DELIMS.EVENT.start)) {
            delims = BINDING_DELIMS.EVENT;
        }
        if (delims !== null &&
            // NOTE: older versions of the parser would match a start/end delimited
            // binding iff the property name was terminated by the ending delimiter
            // and the identifier in the binding was non-empty.
            // TODO(ayazhafiz): update this to handle malformed bindings.
            name.endsWith(delims.end) && name.length > delims.start.length + delims.end.length) {
            const identifier = name.substring(delims.start.length, name.length - delims.end.length);
            const keySpan = createKeySpan(srcSpan, delims.start, identifier);
            if (delims.start === BINDING_DELIMS.BANANA_BOX.start) {
                this.bindingParser.parsePropertyBinding(identifier, value, false, srcSpan, absoluteOffset, attribute.valueSpan, matchableAttributes, parsedProperties, keySpan);
                this.parseAssignmentEvent(identifier, value, srcSpan, attribute.valueSpan, matchableAttributes, boundEvents, keySpan);
            }
            else if (delims.start === BINDING_DELIMS.PROPERTY.start) {
                this.bindingParser.parsePropertyBinding(identifier, value, false, srcSpan, absoluteOffset, attribute.valueSpan, matchableAttributes, parsedProperties, keySpan);
            }
            else {
                const events = [];
                this.bindingParser.parseEvent(identifier, value, /* isAssignmentEvent */ false, srcSpan, attribute.valueSpan || srcSpan, matchableAttributes, events, keySpan);
                addEvents(events, boundEvents);
            }
            return true;
        }
        // No explicit binding found.
        const keySpan = createKeySpan(srcSpan, '' /* prefix */, name);
        const hasBinding = this.bindingParser.parsePropertyInterpolation(name, value, srcSpan, attribute.valueSpan, matchableAttributes, parsedProperties, keySpan, attribute.valueTokens ?? null);
        return hasBinding;
    }
    _visitTextWithInterpolation(value, sourceSpan, interpolatedTokens, i18n) {
        const valueNoNgsp = replaceNgsp(value);
        const expr = this.bindingParser.parseInterpolation(valueNoNgsp, sourceSpan, interpolatedTokens);
        return expr ? new t.BoundText(expr, sourceSpan, i18n) : new t.Text(valueNoNgsp, sourceSpan);
    }
    parseVariable(identifier, value, sourceSpan, keySpan, valueSpan, variables) {
        if (identifier.indexOf('-') > -1) {
            this.reportError(`"-" is not allowed in variable names`, sourceSpan);
        }
        else if (identifier.length === 0) {
            this.reportError(`Variable does not have a name`, sourceSpan);
        }
        variables.push(new t.Variable(identifier, value, sourceSpan, keySpan, valueSpan));
    }
    parseReference(identifier, value, sourceSpan, keySpan, valueSpan, references) {
        if (identifier.indexOf('-') > -1) {
            this.reportError(`"-" is not allowed in reference names`, sourceSpan);
        }
        else if (identifier.length === 0) {
            this.reportError(`Reference does not have a name`, sourceSpan);
        }
        else if (references.some(reference => reference.name === identifier)) {
            this.reportError(`Reference "#${identifier}" is defined more than once`, sourceSpan);
        }
        references.push(new t.Reference(identifier, value, sourceSpan, keySpan, valueSpan));
    }
    parseAssignmentEvent(name, expression, sourceSpan, valueSpan, targetMatchableAttrs, boundEvents, keySpan) {
        const events = [];
        this.bindingParser.parseEvent(`${name}Change`, `${expression} =$event`, /* isAssignmentEvent */ true, sourceSpan, valueSpan || sourceSpan, targetMatchableAttrs, events, keySpan);
        addEvents(events, boundEvents);
    }
    reportError(message, sourceSpan, level = ParseErrorLevel.ERROR) {
        this.errors.push(new ParseError(sourceSpan, message, level));
    }
}
class NonBindableVisitor {
    visitElement(ast) {
        const preparsedElement = preparseElement(ast);
        if (preparsedElement.type === PreparsedElementType.SCRIPT ||
            preparsedElement.type === PreparsedElementType.STYLE ||
            preparsedElement.type === PreparsedElementType.STYLESHEET) {
            // Skipping <script> for security reasons
            // Skipping <style> and stylesheets as we already processed them
            // in the StyleCompiler
            return null;
        }
        const children = html.visitAll(this, ast.children, null);
        return new t.Element(ast.name, html.visitAll(this, ast.attrs), 
        /* inputs */ [], /* outputs */ [], children, /* references */ [], ast.sourceSpan, ast.startSourceSpan, ast.endSourceSpan);
    }
    visitComment(comment) {
        return null;
    }
    visitAttribute(attribute) {
        return new t.TextAttribute(attribute.name, attribute.value, attribute.sourceSpan, attribute.keySpan, attribute.valueSpan, attribute.i18n);
    }
    visitText(text) {
        return new t.Text(text.value, text.sourceSpan);
    }
    visitExpansion(expansion) {
        return null;
    }
    visitExpansionCase(expansionCase) {
        return null;
    }
    visitBlockGroup(group, context) {
        const nodes = html.visitAll(this, group.blocks);
        // We only need to do the end tag since the start will be added as a part of the primary block.
        if (group.endSourceSpan !== null) {
            nodes.push(new t.Text(group.endSourceSpan.toString(), group.endSourceSpan));
        }
        return nodes;
    }
    visitBlock(block, context) {
        return [
            // In an ngNonBindable context we treat the opening/closing tags of block as plain text.
            // This is the as if the `tokenizeBlocks` option was disabled.
            new t.Text(block.startSourceSpan.toString(), block.startSourceSpan),
            ...html.visitAll(this, block.children)
        ];
    }
    visitBlockParameter(parameter, context) {
        return null;
    }
}
const NON_BINDABLE_VISITOR = new NonBindableVisitor();
function normalizeAttributeName(attrName) {
    return /^data-/i.test(attrName) ? attrName.substring(5) : attrName;
}
function addEvents(events, boundEvents) {
    boundEvents.push(...events.map(e => t.BoundEvent.fromParsedEvent(e)));
}
function isEmptyTextNode(node) {
    return node instanceof html.Text && node.value.trim().length == 0;
}
function isCommentNode(node) {
    return node instanceof html.Comment;
}
function textContents(node) {
    if (node.children.length !== 1 || !(node.children[0] instanceof html.Text)) {
        return null;
    }
    else {
        return node.children[0].value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVtcGxhdGVfdHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3JlbmRlcjMvcjNfdGVtcGxhdGVfdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUlILE9BQU8sS0FBSyxJQUFJLE1BQU0sa0JBQWtCLENBQUM7QUFDekMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQzFELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUUvQyxPQUFPLEVBQUMsVUFBVSxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDM0UsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFM0QsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGVBQWUsRUFBQyxNQUFNLHVDQUF1QyxDQUFDO0FBRTVGLE9BQU8sS0FBSyxDQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzlCLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUVyRSxNQUFNLGdCQUFnQixHQUFHLHVEQUF1RCxDQUFDO0FBRWpGLG9CQUFvQjtBQUNwQixNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUM7QUFDdEIsbUJBQW1CO0FBQ25CLE1BQU0sVUFBVSxHQUFHLENBQUMsQ0FBQztBQUNyQixxQkFBcUI7QUFDckIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBQ3JCLGtCQUFrQjtBQUNsQixNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDcEIsc0JBQXNCO0FBQ3RCLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQztBQUN4QixnQkFBZ0I7QUFDaEIsTUFBTSxTQUFTLEdBQUcs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TUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsWUFBWSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDMUUsT0FBTyxJQUFJLENBQUM7S0FDYjtTQUFNO1FBQ0wsT0FBUSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBZSxDQUFDLEtBQUssQ0FBQztLQUM5QztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQYXJzZWRFdmVudCwgUGFyc2VkUHJvcGVydHksIFBhcnNlZFZhcmlhYmxlfSBmcm9tICcuLi9leHByZXNzaW9uX3BhcnNlci9hc3QnO1xuaW1wb3J0ICogYXMgaTE4biBmcm9tICcuLi9pMThuL2kxOG5fYXN0JztcbmltcG9ydCAqIGFzIGh0bWwgZnJvbSAnLi4vbWxfcGFyc2VyL2FzdCc7XG5pbXBvcnQge3JlcGxhY2VOZ3NwfSBmcm9tICcuLi9tbF9wYXJzZXIvaHRtbF93aGl0ZXNwYWNlcyc7XG5pbXBvcnQge2lzTmdUZW1wbGF0ZX0gZnJvbSAnLi4vbWxfcGFyc2VyL3RhZ3MnO1xuaW1wb3J0IHtJbnRlcnBvbGF0ZWRBdHRyaWJ1dGVUb2tlbiwgSW50ZXJwb2xhdGVkVGV4dFRva2VufSBmcm9tICcuLi9tbF9wYXJzZXIvdG9rZW5zJztcbmltcG9ydCB7UGFyc2VFcnJvciwgUGFyc2VFcnJvckxldmVsLCBQYXJzZVNvdXJjZVNwYW59IGZyb20gJy4uL3BhcnNlX3V0aWwnO1xuaW1wb3J0IHtpc1N0eWxlVXJsUmVzb2x2YWJsZX0gZnJvbSAnLi4vc3R5bGVfdXJsX3Jlc29sdmVyJztcbmltcG9ydCB7QmluZGluZ1BhcnNlcn0gZnJvbSAnLi4vdGVtcGxhdGVfcGFyc2VyL2JpbmRpbmdfcGFyc2VyJztcbmltcG9ydCB7UHJlcGFyc2VkRWxlbWVudFR5cGUsIHByZXBhcnNlRWxlbWVudH0gZnJvbSAnLi4vdGVtcGxhdGVfcGFyc2VyL3RlbXBsYXRlX3ByZXBhcnNlcic7XG5cbmltcG9ydCAqIGFzIHQgZnJvbSAnLi9yM19hc3QnO1xuaW1wb3J0IHtjcmVhdGVEZWZlcnJlZEJsb2NrfSBmcm9tICcuL3IzX2RlZmVycmVkX2Jsb2Nrcyc7XG5pbXBvcnQge0kxOE5fSUNVX1ZBUl9QUkVGSVgsIGlzSTE4blJvb3ROb2RlfSBmcm9tICcuL3ZpZXcvaTE4bi91dGlsJztcblxuY29uc3QgQklORF9OQU1FX1JFR0VYUCA9IC9eKD86KGJpbmQtKXwobGV0LSl8KHJlZi18Iyl8KG9uLSl8KGJpbmRvbi0pfChAKSkoLiopJC87XG5cbi8vIEdyb3VwIDEgPSBcImJpbmQtXCJcbmNvbnN0IEtXX0JJTkRfSURYID0gMTtcbi8vIEdyb3VwIDIgPSBcImxldC1cIlxuY29uc3QgS1dfTEVUX0lEWCA9IDI7XG4vLyBHcm91cCAzID0gXCJyZWYtLyNcIlxuY29uc3QgS1dfUkVGX0lEWCA9IDM7XG4vLyBHcm91cCA0ID0gXCJvbi1cIlxuY29uc3QgS1dfT05fSURYID0gNDtcbi8vIEdyb3VwIDUgPSBcImJpbmRvbi1cIlxuY29uc3QgS1dfQklORE9OX0lEWCA9IDU7XG4vLyBHcm91cCA2ID0gXCJAXCJcbmNvbnN0IEtXX0FUX0lEWCA9IDY7XG4vLyBHcm91cCA3ID0gdGhlIGlkZW50aWZpZXIgYWZ0ZXIgXCJiaW5kLVwiLCBcImxldC1cIiwgXCJyZWYtLyNcIiwgXCJvbi1cIiwgXCJiaW5kb24tXCIgb3IgXCJAXCJcbmNvbnN0IElERU5UX0tXX0lEWCA9IDc7XG5cbmNvbnN0IEJJTkRJTkdfREVMSU1TID0ge1xuICBCQU5BTkFfQk9YOiB7c3RhcnQ6ICdbKCcsIGVuZDogJyldJ30sXG4gIFBST1BFUlRZOiB7c3RhcnQ6ICdbJywgZW5kOiAnXSd9LFxuICBFVkVOVDoge3N0YXJ0OiAnKCcsIGVuZDogJyknfSxcbn07XG5cbmNvbnN0IFRFTVBMQVRFX0FUVFJfUFJFRklYID0gJyonO1xuXG4vLyBSZXN1bHQgb2YgdGhlIGh0bWwgQVNUIHRvIEl2eSBBU1QgdHJhbnNmb3JtYXRpb25cbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyM1BhcnNlUmVzdWx0IHtcbiAgbm9kZXM6IHQuTm9kZVtdO1xuICBlcnJvcnM6IFBhcnNlRXJyb3JbXTtcbiAgc3R5bGVzOiBzdHJpbmdbXTtcbiAgc3R5bGVVcmxzOiBzdHJpbmdbXTtcbiAgbmdDb250ZW50U2VsZWN0b3JzOiBzdHJpbmdbXTtcbiAgLy8gV2lsbCBiZSBkZWZpbmVkIGlmIGBSZW5kZXIzUGFyc2VPcHRpb25zWydjb2xsZWN0Q29tbWVudE5vZGVzJ11gIGlzIHRydWVcbiAgY29tbWVudE5vZGVzPzogdC5Db21tZW50W107XG59XG5cbmludGVyZmFjZSBSZW5kZXIzUGFyc2VPcHRpb25zIHtcbiAgY29sbGVjdENvbW1lbnROb2RlczogYm9vbGVhbjtcbiAgZW5hYmxlZEJsb2NrVHlwZXM6IFNldDxzdHJpbmc+O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaHRtbEFzdFRvUmVuZGVyM0FzdChcbiAgICBodG1sTm9kZXM6IGh0bWwuTm9kZVtdLCBiaW5kaW5nUGFyc2VyOiBCaW5kaW5nUGFyc2VyLFxuICAgIG9wdGlvbnM6IFJlbmRlcjNQYXJzZU9wdGlvbnMpOiBSZW5kZXIzUGFyc2VSZXN1bHQge1xuICBjb25zdCB0cmFuc2Zvcm1lciA9IG5ldyBIdG1sQXN0VG9JdnlBc3QoYmluZGluZ1BhcnNlciwgb3B0aW9ucyk7XG4gIGNvbnN0IGl2eU5vZGVzID0gaHRtbC52aXNpdEFsbCh0cmFuc2Zvcm1lciwgaHRtbE5vZGVzKTtcblxuICAvLyBFcnJvcnMgbWlnaHQgb3JpZ2luYXRlIGluIGVpdGhlciB0aGUgYmluZGluZyBwYXJzZXIgb3IgdGhlIGh0bWwgdG8gaXZ5IHRyYW5zZm9ybWVyXG4gIGNvbnN0IGFsbEVycm9ycyA9IGJpbmRpbmdQYXJzZXIuZXJyb3JzLmNvbmNhdCh0cmFuc2Zvcm1lci5lcnJvcnMpO1xuXG4gIGNvbnN0IHJlc3VsdDogUmVuZGVyM1BhcnNlUmVzdWx0ID0ge1xuICAgIG5vZGVzOiBpdnlOb2RlcyxcbiAgICBlcnJvcnM6IGFsbEVycm9ycyxcbiAgICBzdHlsZVVybHM6IHRyYW5zZm9ybWVyLnN0eWxlVXJscyxcbiAgICBzdHlsZXM6IHRyYW5zZm9ybWVyLnN0eWxlcyxcbiAgICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHRyYW5zZm9ybWVyLm5nQ29udGVudFNlbGVjdG9yc1xuICB9O1xuICBpZiAob3B0aW9ucy5jb2xsZWN0Q29tbWVudE5vZGVzKSB7XG4gICAgcmVzdWx0LmNvbW1lbnROb2RlcyA9IHRyYW5zZm9ybWVyLmNvbW1lbnROb2RlcztcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5jbGFzcyBIdG1sQXN0VG9JdnlBc3QgaW1wbGVtZW50cyBodG1sLlZpc2l0b3Ige1xuICBlcnJvcnM6IFBhcnNlRXJyb3JbXSA9IFtdO1xuICBzdHlsZXM6IHN0cmluZ1tdID0gW107XG4gIHN0eWxlVXJsczogc3RyaW5nW10gPSBbXTtcbiAgbmdDb250ZW50U2VsZWN0b3JzOiBzdHJpbmdbXSA9IFtdO1xuICAvLyBUaGlzIGFycmF5IHdpbGwgYmUgcG9wdWxhdGVkIGlmIGBSZW5kZXIzUGFyc2VPcHRpb25zWydjb2xsZWN0Q29tbWVudE5vZGVzJ11gIGlzIHRydWVcbiAgY29tbWVudE5vZGVzOiB0LkNvbW1lbnRbXSA9IFtdO1xuICBwcml2YXRlIGluSTE4bkJsb2NrOiBib29sZWFuID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBiaW5kaW5nUGFyc2VyOiBCaW5kaW5nUGFyc2VyLCBwcml2YXRlIG9wdGlvbnM6IFJlbmRlcjNQYXJzZU9wdGlvbnMpIHt9XG5cbiAgLy8gSFRNTCB2aXNpdG9yXG4gIHZpc2l0RWxlbWVudChlbGVtZW50OiBodG1sLkVsZW1lbnQpOiB0Lk5vZGV8bnVsbCB7XG4gICAgY29uc3QgaXNJMThuUm9vdEVsZW1lbnQgPSBpc0kxOG5Sb290Tm9kZShlbGVtZW50LmkxOG4pO1xuICAgIGlmIChpc0kxOG5Sb290RWxlbWVudCkge1xuICAgICAgaWYgKHRoaXMuaW5JMThuQmxvY2spIHtcbiAgICAgICAgdGhpcy5yZXBvcnRFcnJvcihcbiAgICAgICAgICAgICdDYW5ub3QgbWFyayBhbiBlbGVtZW50IGFzIHRyYW5zbGF0YWJsZSBpbnNpZGUgb2YgYSB0cmFuc2xhdGFibGUgc2VjdGlvbi4gUGxlYXNlIHJlbW92ZSB0aGUgbmVzdGVkIGkxOG4gbWFya2VyLicsXG4gICAgICAgICAgICBlbGVtZW50LnNvdXJjZVNwYW4pO1xuICAgICAgfVxuICAgICAgdGhpcy5pbkkxOG5CbG9jayA9IHRydWU7XG4gICAgfVxuICAgIGNvbnN0IHByZXBhcnNlZEVsZW1lbnQgPSBwcmVwYXJzZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgaWYgKHByZXBhcnNlZEVsZW1lbnQudHlwZSA9PT0gUHJlcGFyc2VkRWxlbWVudFR5cGUuU0NSSVBUKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2UgaWYgKHByZXBhcnNlZEVsZW1lbnQudHlwZSA9PT0gUHJlcGFyc2VkRWxlbWVudFR5cGUuU1RZTEUpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnRzID0gdGV4dENvbnRlbnRzKGVsZW1lbnQpO1xuICAgICAgaWYgKGNvbnRlbnRzICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuc3R5bGVzLnB1c2goY29udGVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgcHJlcGFyc2VkRWxlbWVudC50eXBlID09PSBQcmVwYXJzZWRFbGVtZW50VHlwZS5TVFlMRVNIRUVUICYmXG4gICAgICAgIGlzU3R5bGVVcmxSZXNvbHZhYmxlKHByZXBhcnNlZEVsZW1lbnQuaHJlZkF0dHIpKSB7XG4gICAgICB0aGlzLnN0eWxlVXJscy5wdXNoKHByZXBhcnNlZEVsZW1lbnQuaHJlZkF0dHIpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gV2hldGhlciB0aGUgZWxlbWVudCBpcyBhIGA8bmctdGVtcGxhdGU+YFxuICAgIGNvbnN0IGlzVGVtcGxhdGVFbGVtZW50ID0gaXNOZ1RlbXBsYXRlKGVsZW1lbnQubmFtZSk7XG5cbiAgICBjb25zdCBwYXJzZWRQcm9wZXJ0aWVzOiBQYXJzZWRQcm9wZXJ0eVtdID0gW107XG4gICAgY29uc3QgYm91bmRFdmVudHM6IHQuQm91bmRFdmVudFtdID0gW107XG4gICAgY29uc3QgdmFyaWFibGVzOiB0LlZhcmlhYmxlW10gPSBbXTtcbiAgICBjb25zdCByZWZlcmVuY2VzOiB0LlJlZmVyZW5jZVtdID0gW107XG4gICAgY29uc3QgYXR0cmlidXRlczogdC5UZXh0QXR0cmlidXRlW10gPSBbXTtcbiAgICBjb25zdCBpMThuQXR0cnNNZXRhOiB7W2tleTogc3RyaW5nXTogaTE4bi5JMThuTWV0YX0gPSB7fTtcblxuICAgIGNvbnN0IHRlbXBsYXRlUGFyc2VkUHJvcGVydGllczogUGFyc2VkUHJvcGVydHlbXSA9IFtdO1xuICAgIGNvbnN0IHRlbXBsYXRlVmFyaWFibGVzOiB0LlZhcmlhYmxlW10gPSBbXTtcblxuICAgIC8vIFdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIGFueSAqLWF0dHJpYnV0ZVxuICAgIGxldCBlbGVtZW50SGFzSW5saW5lVGVtcGxhdGUgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgYXR0cmlidXRlIG9mIGVsZW1lbnQuYXR0cnMpIHtcbiAgICAgIGxldCBoYXNCaW5kaW5nID0gZmFsc2U7XG4gICAgICBjb25zdCBub3JtYWxpemVkTmFtZSA9IG5vcm1hbGl6ZUF0dHJpYnV0ZU5hbWUoYXR0cmlidXRlLm5hbWUpO1xuXG4gICAgICAvLyBgKmF0dHJgIGRlZmluZXMgdGVtcGxhdGUgYmluZGluZ3NcbiAgICAgIGxldCBpc1RlbXBsYXRlQmluZGluZyA9IGZhbHNlO1xuXG4gICAgICBpZiAoYXR0cmlidXRlLmkxOG4pIHtcbiAgICAgICAgaTE4bkF0dHJzTWV0YVthdHRyaWJ1dGUubmFtZV0gPSBhdHRyaWJ1dGUuaTE4bjtcbiAgICAgIH1cblxuICAgICAgaWYgKG5vcm1hbGl6ZWROYW1lLnN0YXJ0c1dpdGgoVEVNUExBVEVfQVRUUl9QUkVGSVgpKSB7XG4gICAgICAgIC8vICotYXR0cmlidXRlc1xuICAgICAgICBpZiAoZWxlbWVudEhhc0lubGluZVRlbXBsYXRlKSB7XG4gICAgICAgICAgdGhpcy5yZXBvcnRFcnJvcihcbiAgICAgICAgICAgICAgYENhbid0IGhhdmUgbXVsdGlwbGUgdGVtcGxhdGUgYmluZGluZ3Mgb24gb25lIGVsZW1lbnQuIFVzZSBvbmx5IG9uZSBhdHRyaWJ1dGUgcHJlZml4ZWQgd2l0aCAqYCxcbiAgICAgICAgICAgICAgYXR0cmlidXRlLnNvdXJjZVNwYW4pO1xuICAgICAgICB9XG4gICAgICAgIGlzVGVtcGxhdGVCaW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgZWxlbWVudEhhc0lubGluZVRlbXBsYXRlID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVWYWx1ZSA9IGF0dHJpYnV0ZS52YWx1ZTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVLZXkgPSBub3JtYWxpemVkTmFtZS5zdWJzdHJpbmcoVEVNUExBVEVfQVRUUl9QUkVGSVgubGVuZ3RoKTtcblxuICAgICAgICBjb25zdCBwYXJzZWRWYXJpYWJsZXM6IFBhcnNlZFZhcmlhYmxlW10gPSBbXTtcbiAgICAgICAgY29uc3QgYWJzb2x1dGVWYWx1ZU9mZnNldCA9IGF0dHJpYnV0ZS52YWx1ZVNwYW4gP1xuICAgICAgICAgICAgYXR0cmlidXRlLnZhbHVlU3Bhbi5zdGFydC5vZmZzZXQgOlxuICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gdmFsdWUgc3BhbiB0aGUgYXR0cmlidXRlIGRvZXMgbm90IGhhdmUgYSB2YWx1ZSwgbGlrZSBgYXR0cmAgaW5cbiAgICAgICAgICAgIC8vYDxkaXYgYXR0cj48L2Rpdj5gLiBJbiB0aGlzIGNhc2UsIHBvaW50IHRvIG9uZSBjaGFyYWN0ZXIgYmV5b25kIHRoZSBsYXN0IGNoYXJhY3RlciBvZlxuICAgICAgICAgICAgLy8gdGhlIGF0dHJpYnV0ZSBuYW1lLlxuICAgICAgICAgICAgYXR0cmlidXRlLnNvdXJjZVNwYW4uc3RhcnQub2Zmc2V0ICsgYXR0cmlidXRlLm5hbWUubGVuZ3RoO1xuXG4gICAgICAgIHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZUlubGluZVRlbXBsYXRlQmluZGluZyhcbiAgICAgICAgICAgIHRlbXBsYXRlS2V5LCB0ZW1wbGF0ZVZhbHVlLCBhdHRyaWJ1dGUuc291cmNlU3BhbiwgYWJzb2x1dGVWYWx1ZU9mZnNldCwgW10sXG4gICAgICAgICAgICB0ZW1wbGF0ZVBhcnNlZFByb3BlcnRpZXMsIHBhcnNlZFZhcmlhYmxlcywgdHJ1ZSAvKiBpc0l2eUFzdCAqLyk7XG4gICAgICAgIHRlbXBsYXRlVmFyaWFibGVzLnB1c2goLi4ucGFyc2VkVmFyaWFibGVzLm1hcChcbiAgICAgICAgICAgIHYgPT4gbmV3IHQuVmFyaWFibGUodi5uYW1lLCB2LnZhbHVlLCB2LnNvdXJjZVNwYW4sIHYua2V5U3Bhbiwgdi52YWx1ZVNwYW4pKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDaGVjayBmb3IgdmFyaWFibGVzLCBldmVudHMsIHByb3BlcnR5IGJpbmRpbmdzLCBpbnRlcnBvbGF0aW9uXG4gICAgICAgIGhhc0JpbmRpbmcgPSB0aGlzLnBhcnNlQXR0cmlidXRlKFxuICAgICAgICAgICAgaXNUZW1wbGF0ZUVsZW1lbnQsIGF0dHJpYnV0ZSwgW10sIHBhcnNlZFByb3BlcnRpZXMsIGJvdW5kRXZlbnRzLCB2YXJpYWJsZXMsIHJlZmVyZW5jZXMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWhhc0JpbmRpbmcgJiYgIWlzVGVtcGxhdGVCaW5kaW5nKSB7XG4gICAgICAgIC8vIGRvbid0IGluY2x1ZGUgdGhlIGJpbmRpbmdzIGFzIGF0dHJpYnV0ZXMgYXMgd2VsbCBpbiB0aGUgQVNUXG4gICAgICAgIGF0dHJpYnV0ZXMucHVzaCh0aGlzLnZpc2l0QXR0cmlidXRlKGF0dHJpYnV0ZSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBjaGlsZHJlbjogdC5Ob2RlW107XG5cbiAgICBpZiAocHJlcGFyc2VkRWxlbWVudC5ub25CaW5kYWJsZSkge1xuICAgICAgLy8gVGhlIGBOb25CaW5kYWJsZVZpc2l0b3JgIG1heSBuZWVkIHRvIHJldHVybiBhbiBhcnJheSBvZiBub2RlcyBmb3IgYmxvY2sgZ3JvdXBzIHNvIHdlIG5lZWRcbiAgICAgIC8vIHRvIGZsYXR0ZW4gdGhlIGFycmF5IGhlcmUuIEF2b2lkIGRvaW5nIHRoaXMgZm9yIHRoZSBgSHRtbEFzdFRvSXZ5QXN0YCBzaW5jZSBgZmxhdGAgY3JlYXRlc1xuICAgICAgLy8gYSBuZXcgYXJyYXkuXG4gICAgICBjaGlsZHJlbiA9IGh0bWwudmlzaXRBbGwoTk9OX0JJTkRBQkxFX1ZJU0lUT1IsIGVsZW1lbnQuY2hpbGRyZW4pLmZsYXQoSW5maW5pdHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjaGlsZHJlbiA9IGh0bWwudmlzaXRBbGwodGhpcywgZWxlbWVudC5jaGlsZHJlbik7XG4gICAgfVxuXG4gICAgbGV0IHBhcnNlZEVsZW1lbnQ6IHQuQ29udGVudHx0LlRlbXBsYXRlfHQuRWxlbWVudHx1bmRlZmluZWQ7XG4gICAgaWYgKHByZXBhcnNlZEVsZW1lbnQudHlwZSA9PT0gUHJlcGFyc2VkRWxlbWVudFR5cGUuTkdfQ09OVEVOVCkge1xuICAgICAgLy8gYDxuZy1jb250ZW50PmBcbiAgICAgIGlmIChlbGVtZW50LmNoaWxkcmVuICYmXG4gICAgICAgICAgIWVsZW1lbnQuY2hpbGRyZW4uZXZlcnkoXG4gICAgICAgICAgICAgIChub2RlOiBodG1sLk5vZGUpID0+IGlzRW1wdHlUZXh0Tm9kZShub2RlKSB8fCBpc0NvbW1lbnROb2RlKG5vZGUpKSkge1xuICAgICAgICB0aGlzLnJlcG9ydEVycm9yKGA8bmctY29udGVudD4gZWxlbWVudCBjYW5ub3QgaGF2ZSBjb250ZW50LmAsIGVsZW1lbnQuc291cmNlU3Bhbik7XG4gICAgICB9XG4gICAgICBjb25zdCBzZWxlY3RvciA9IHByZXBhcnNlZEVsZW1lbnQuc2VsZWN0QXR0cjtcbiAgICAgIGNvbnN0IGF0dHJzOiB0LlRleHRBdHRyaWJ1dGVbXSA9IGVsZW1lbnQuYXR0cnMubWFwKGF0dHIgPT4gdGhpcy52aXNpdEF0dHJpYnV0ZShhdHRyKSk7XG4gICAgICBwYXJzZWRFbGVtZW50ID0gbmV3IHQuQ29udGVudChzZWxlY3RvciwgYXR0cnMsIGVsZW1lbnQuc291cmNlU3BhbiwgZWxlbWVudC5pMThuKTtcblxuICAgICAgdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMucHVzaChzZWxlY3Rvcik7XG4gICAgfSBlbHNlIGlmIChpc1RlbXBsYXRlRWxlbWVudCkge1xuICAgICAgLy8gYDxuZy10ZW1wbGF0ZT5gXG4gICAgICBjb25zdCBhdHRycyA9IHRoaXMuZXh0cmFjdEF0dHJpYnV0ZXMoZWxlbWVudC5uYW1lLCBwYXJzZWRQcm9wZXJ0aWVzLCBpMThuQXR0cnNNZXRhKTtcblxuICAgICAgcGFyc2VkRWxlbWVudCA9IG5ldyB0LlRlbXBsYXRlKFxuICAgICAgICAgIGVsZW1lbnQubmFtZSwgYXR0cmlidXRlcywgYXR0cnMuYm91bmQsIGJvdW5kRXZlbnRzLCBbLyogbm8gdGVtcGxhdGUgYXR0cmlidXRlcyAqL10sXG4gICAgICAgICAgY2hpbGRyZW4sIHJlZmVyZW5jZXMsIHZhcmlhYmxlcywgZWxlbWVudC5zb3VyY2VTcGFuLCBlbGVtZW50LnN0YXJ0U291cmNlU3BhbixcbiAgICAgICAgICBlbGVtZW50LmVuZFNvdXJjZVNwYW4sIGVsZW1lbnQuaTE4bik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGF0dHJzID0gdGhpcy5leHRyYWN0QXR0cmlidXRlcyhlbGVtZW50Lm5hbWUsIHBhcnNlZFByb3BlcnRpZXMsIGkxOG5BdHRyc01ldGEpO1xuICAgICAgcGFyc2VkRWxlbWVudCA9IG5ldyB0LkVsZW1lbnQoXG4gICAgICAgICAgZWxlbWVudC5uYW1lLCBhdHRyaWJ1dGVzLCBhdHRycy5ib3VuZCwgYm91bmRFdmVudHMsIGNoaWxkcmVuLCByZWZlcmVuY2VzLFxuICAgICAgICAgIGVsZW1lbnQuc291cmNlU3BhbiwgZWxlbWVudC5zdGFydFNvdXJjZVNwYW4sIGVsZW1lbnQuZW5kU291cmNlU3BhbiwgZWxlbWVudC5pMThuKTtcbiAgICB9XG5cbiAgICBpZiAoZWxlbWVudEhhc0lubGluZVRlbXBsYXRlKSB7XG4gICAgICAvLyBJZiB0aGlzIG5vZGUgaXMgYW4gaW5saW5lLXRlbXBsYXRlIChlLmcuIGhhcyAqbmdGb3IpIHRoZW4gd2UgbmVlZCB0byBjcmVhdGUgYSB0ZW1wbGF0ZVxuICAgICAgLy8gbm9kZSB0aGF0IGNvbnRhaW5zIHRoaXMgbm9kZS5cbiAgICAgIC8vIE1vcmVvdmVyLCBpZiB0aGUgbm9kZSBpcyBhbiBlbGVtZW50LCB0aGVuIHdlIG5lZWQgdG8gaG9pc3QgaXRzIGF0dHJpYnV0ZXMgdG8gdGhlIHRlbXBsYXRlXG4gICAgICAvLyBub2RlIGZvciBtYXRjaGluZyBhZ2FpbnN0IGNvbnRlbnQgcHJvamVjdGlvbiBzZWxlY3RvcnMuXG4gICAgICBjb25zdCBhdHRycyA9IHRoaXMuZXh0cmFjdEF0dHJpYnV0ZXMoJ25nLXRlbXBsYXRlJywgdGVtcGxhdGVQYXJzZWRQcm9wZXJ0aWVzLCBpMThuQXR0cnNNZXRhKTtcbiAgICAgIGNvbnN0IHRlbXBsYXRlQXR0cnM6ICh0LlRleHRBdHRyaWJ1dGV8dC5Cb3VuZEF0dHJpYnV0ZSlbXSA9IFtdO1xuICAgICAgYXR0cnMubGl0ZXJhbC5mb3JFYWNoKGF0dHIgPT4gdGVtcGxhdGVBdHRycy5wdXNoKGF0dHIpKTtcbiAgICAgIGF0dHJzLmJvdW5kLmZvckVhY2goYXR0ciA9PiB0ZW1wbGF0ZUF0dHJzLnB1c2goYXR0cikpO1xuICAgICAgY29uc3QgaG9pc3RlZEF0dHJzID0gcGFyc2VkRWxlbWVudCBpbnN0YW5jZW9mIHQuRWxlbWVudCA/XG4gICAgICAgICAge1xuICAgICAgICAgICAgYXR0cmlidXRlczogcGFyc2VkRWxlbWVudC5hdHRyaWJ1dGVzLFxuICAgICAgICAgICAgaW5wdXRzOiBwYXJzZWRFbGVtZW50LmlucHV0cyxcbiAgICAgICAgICAgIG91dHB1dHM6IHBhcnNlZEVsZW1lbnQub3V0cHV0cyxcbiAgICAgICAgICB9IDpcbiAgICAgICAgICB7YXR0cmlidXRlczogW10sIGlucHV0czogW10sIG91dHB1dHM6IFtdfTtcblxuICAgICAgLy8gRm9yIDxuZy10ZW1wbGF0ZT5zIHdpdGggc3RydWN0dXJhbCBkaXJlY3RpdmVzIG9uIHRoZW0sIGF2b2lkIHBhc3NpbmcgaTE4biBpbmZvcm1hdGlvbiB0b1xuICAgICAgLy8gdGhlIHdyYXBwaW5nIHRlbXBsYXRlIHRvIHByZXZlbnQgdW5uZWNlc3NhcnkgaTE4biBpbnN0cnVjdGlvbnMgZnJvbSBiZWluZyBnZW5lcmF0ZWQuIFRoZVxuICAgICAgLy8gbmVjZXNzYXJ5IGkxOG4gbWV0YSBpbmZvcm1hdGlvbiB3aWxsIGJlIGV4dHJhY3RlZCBmcm9tIGNoaWxkIGVsZW1lbnRzLlxuICAgICAgY29uc3QgaTE4biA9IGlzVGVtcGxhdGVFbGVtZW50ICYmIGlzSTE4blJvb3RFbGVtZW50ID8gdW5kZWZpbmVkIDogZWxlbWVudC5pMThuO1xuICAgICAgY29uc3QgbmFtZSA9IHBhcnNlZEVsZW1lbnQgaW5zdGFuY2VvZiB0LlRlbXBsYXRlID8gbnVsbCA6IHBhcnNlZEVsZW1lbnQubmFtZTtcblxuICAgICAgcGFyc2VkRWxlbWVudCA9IG5ldyB0LlRlbXBsYXRlKFxuICAgICAgICAgIG5hbWUsIGhvaXN0ZWRBdHRycy5hdHRyaWJ1dGVzLCBob2lzdGVkQXR0cnMuaW5wdXRzLCBob2lzdGVkQXR0cnMub3V0cHV0cywgdGVtcGxhdGVBdHRycyxcbiAgICAgICAgICBbcGFyc2VkRWxlbWVudF0sIFsvKiBubyByZWZlcmVuY2VzICovXSwgdGVtcGxhdGVWYXJpYWJsZXMsIGVsZW1lbnQuc291cmNlU3BhbixcbiAgICAgICAgICBlbGVtZW50LnN0YXJ0U291cmNlU3BhbiwgZWxlbWVudC5lbmRTb3VyY2VTcGFuLCBpMThuKTtcbiAgICB9XG4gICAgaWYgKGlzSTE4blJvb3RFbGVtZW50KSB7XG4gICAgICB0aGlzLmluSTE4bkJsb2NrID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBwYXJzZWRFbGVtZW50O1xuICB9XG5cbiAgdmlzaXRBdHRyaWJ1dGUoYXR0cmlidXRlOiBodG1sLkF0dHJpYnV0ZSk6IHQuVGV4dEF0dHJpYnV0ZSB7XG4gICAgcmV0dXJuIG5ldyB0LlRleHRBdHRyaWJ1dGUoXG4gICAgICAgIGF0dHJpYnV0ZS5uYW1lLCBhdHRyaWJ1dGUudmFsdWUsIGF0dHJpYnV0ZS5zb3VyY2VTcGFuLCBhdHRyaWJ1dGUua2V5U3BhbixcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlU3BhbiwgYXR0cmlidXRlLmkxOG4pO1xuICB9XG5cbiAgdmlzaXRUZXh0KHRleHQ6IGh0bWwuVGV4dCk6IHQuTm9kZSB7XG4gICAgcmV0dXJuIHRoaXMuX3Zpc2l0VGV4dFdpdGhJbnRlcnBvbGF0aW9uKHRleHQudmFsdWUsIHRleHQuc291cmNlU3BhbiwgdGV4dC50b2tlbnMsIHRleHQuaTE4bik7XG4gIH1cblxuICB2aXNpdEV4cGFuc2lvbihleHBhbnNpb246IGh0bWwuRXhwYW5zaW9uKTogdC5JY3V8bnVsbCB7XG4gICAgaWYgKCFleHBhbnNpb24uaTE4bikge1xuICAgICAgLy8gZG8gbm90IGdlbmVyYXRlIEljdSBpbiBjYXNlIGl0IHdhcyBjcmVhdGVkXG4gICAgICAvLyBvdXRzaWRlIG9mIGkxOG4gYmxvY2sgaW4gYSB0ZW1wbGF0ZVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICghaXNJMThuUm9vdE5vZGUoZXhwYW5zaW9uLmkxOG4pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdHlwZSBcIiR7ZXhwYW5zaW9uLmkxOG4uY29uc3RydWN0b3J9XCIgZm9yIFwiaTE4blwiIHByb3BlcnR5IG9mICR7XG4gICAgICAgICAgZXhwYW5zaW9uLnNvdXJjZVNwYW4udG9TdHJpbmcoKX0uIEV4cGVjdGVkIGEgXCJNZXNzYWdlXCJgKTtcbiAgICB9XG4gICAgY29uc3QgbWVzc2FnZSA9IGV4cGFuc2lvbi5pMThuO1xuICAgIGNvbnN0IHZhcnM6IHtbbmFtZTogc3RyaW5nXTogdC5Cb3VuZFRleHR9ID0ge307XG4gICAgY29uc3QgcGxhY2Vob2xkZXJzOiB7W25hbWU6IHN0cmluZ106IHQuVGV4dHx0LkJvdW5kVGV4dH0gPSB7fTtcbiAgICAvLyBleHRyYWN0IFZBUnMgZnJvbSBJQ1VzIC0gd2UgcHJvY2VzcyB0aGVtIHNlcGFyYXRlbHkgd2hpbGVcbiAgICAvLyBhc3NlbWJsaW5nIHJlc3VsdGluZyBtZXNzYWdlIHZpYSBnb29nLmdldE1zZyBmdW5jdGlvbiwgc2luY2VcbiAgICAvLyB3ZSBuZWVkIHRvIHBhc3MgdGhlbSB0byB0b3AtbGV2ZWwgZ29vZy5nZXRNc2cgY2FsbFxuICAgIE9iamVjdC5rZXlzKG1lc3NhZ2UucGxhY2Vob2xkZXJzKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG1lc3NhZ2UucGxhY2Vob2xkZXJzW2tleV07XG4gICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoSTE4Tl9JQ1VfVkFSX1BSRUZJWCkpIHtcbiAgICAgICAgLy8gQ3VycmVudGx5IHdoZW4gdGhlIGBwbHVyYWxgIG9yIGBzZWxlY3RgIGtleXdvcmRzIGluIGFuIElDVSBjb250YWluIHRyYWlsaW5nIHNwYWNlcyAoZS5nLlxuICAgICAgICAvLyBge2NvdW50LCBzZWxlY3QgLCAuLi59YCksIHRoZXNlIHNwYWNlcyBhcmUgYWxzbyBpbmNsdWRlZCBpbnRvIHRoZSBrZXkgbmFtZXMgaW4gSUNVIHZhcnNcbiAgICAgICAgLy8gKGUuZy4gXCJWQVJfU0VMRUNUIFwiKS4gVGhlc2UgdHJhaWxpbmcgc3BhY2VzIGFyZSBub3QgZGVzaXJhYmxlLCBzaW5jZSB0aGV5IHdpbGwgbGF0ZXIgYmVcbiAgICAgICAgLy8gY29udmVydGVkIGludG8gYF9gIHN5bWJvbHMgd2hpbGUgbm9ybWFsaXppbmcgcGxhY2Vob2xkZXIgbmFtZXMsIHdoaWNoIG1pZ2h0IGxlYWQgdG9cbiAgICAgICAgLy8gbWlzbWF0Y2hlcyBhdCBydW50aW1lIChpLmUuIHBsYWNlaG9sZGVyIHdpbGwgbm90IGJlIHJlcGxhY2VkIHdpdGggdGhlIGNvcnJlY3QgdmFsdWUpLlxuICAgICAgICBjb25zdCBmb3JtYXR0ZWRLZXkgPSBrZXkudHJpbSgpO1xuXG4gICAgICAgIGNvbnN0IGFzdCA9IHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZUludGVycG9sYXRpb25FeHByZXNzaW9uKHZhbHVlLnRleHQsIHZhbHVlLnNvdXJjZVNwYW4pO1xuXG4gICAgICAgIHZhcnNbZm9ybWF0dGVkS2V5XSA9IG5ldyB0LkJvdW5kVGV4dChhc3QsIHZhbHVlLnNvdXJjZVNwYW4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxhY2Vob2xkZXJzW2tleV0gPSB0aGlzLl92aXNpdFRleHRXaXRoSW50ZXJwb2xhdGlvbih2YWx1ZS50ZXh0LCB2YWx1ZS5zb3VyY2VTcGFuLCBudWxsKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IHQuSWN1KHZhcnMsIHBsYWNlaG9sZGVycywgZXhwYW5zaW9uLnNvdXJjZVNwYW4sIG1lc3NhZ2UpO1xuICB9XG5cbiAgdmlzaXRFeHBhbnNpb25DYXNlKGV4cGFuc2lvbkNhc2U6IGh0bWwuRXhwYW5zaW9uQ2FzZSk6IG51bGwge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdmlzaXRDb21tZW50KGNvbW1lbnQ6IGh0bWwuQ29tbWVudCk6IG51bGwge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuY29sbGVjdENvbW1lbnROb2Rlcykge1xuICAgICAgdGhpcy5jb21tZW50Tm9kZXMucHVzaChuZXcgdC5Db21tZW50KGNvbW1lbnQudmFsdWUgfHwgJycsIGNvbW1lbnQuc291cmNlU3BhbikpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZpc2l0QmxvY2tHcm91cChncm91cDogaHRtbC5CbG9ja0dyb3VwLCBjb250ZXh0OiBhbnkpOiB0Lk5vZGV8bnVsbCB7XG4gICAgY29uc3QgcHJpbWFyeUJsb2NrID0gZ3JvdXAuYmxvY2tzWzBdO1xuXG4gICAgLy8gVGhlIEhUTUwgcGFyc2VyIGVuc3VyZXMgdGhhdCB3ZSBkb24ndCBoaXQgdGhpcyBjYXNlLCBidXQgd2UgaGF2ZSBhbiBhc3NlcnRpb24ganVzdCBpbiBjYXNlLlxuICAgIGlmICghcHJpbWFyeUJsb2NrKSB7XG4gICAgICB0aGlzLnJlcG9ydEVycm9yKCdCbG9jayBncm91cCBtdXN0IGhhdmUgYXQgbGVhc3Qgb25lIGJsb2NrLicsIGdyb3VwLnNvdXJjZVNwYW4pO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHByaW1hcnlCbG9jay5uYW1lID09PSAnZGVmZXInICYmIHRoaXMub3B0aW9ucy5lbmFibGVkQmxvY2tUeXBlcy5oYXMocHJpbWFyeUJsb2NrLm5hbWUpKSB7XG4gICAgICBjb25zdCB7bm9kZSwgZXJyb3JzfSA9IGNyZWF0ZURlZmVycmVkQmxvY2soZ3JvdXAsIHRoaXMsIHRoaXMuYmluZGluZ1BhcnNlcik7XG4gICAgICB0aGlzLmVycm9ycy5wdXNoKC4uLmVycm9ycyk7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICB0aGlzLnJlcG9ydEVycm9yKGBVbnJlY29nbml6ZWQgYmxvY2sgXCIke3ByaW1hcnlCbG9jay5uYW1lfVwiLmAsIHByaW1hcnlCbG9jay5zb3VyY2VTcGFuKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZpc2l0QmxvY2soYmxvY2s6IGh0bWwuQmxvY2ssIGNvbnRleHQ6IGFueSkge31cblxuICB2aXNpdEJsb2NrUGFyYW1ldGVyKHBhcmFtZXRlcjogaHRtbC5CbG9ja1BhcmFtZXRlciwgY29udGV4dDogYW55KSB7fVxuXG4gIC8vIGNvbnZlcnQgdmlldyBlbmdpbmUgYFBhcnNlZFByb3BlcnR5YCB0byBhIGZvcm1hdCBzdWl0YWJsZSBmb3IgSVZZXG4gIHByaXZhdGUgZXh0cmFjdEF0dHJpYnV0ZXMoXG4gICAgICBlbGVtZW50TmFtZTogc3RyaW5nLCBwcm9wZXJ0aWVzOiBQYXJzZWRQcm9wZXJ0eVtdLFxuICAgICAgaTE4blByb3BzTWV0YToge1trZXk6IHN0cmluZ106IGkxOG4uSTE4bk1ldGF9KTpcbiAgICAgIHtib3VuZDogdC5Cb3VuZEF0dHJpYnV0ZVtdLCBsaXRlcmFsOiB0LlRleHRBdHRyaWJ1dGVbXX0ge1xuICAgIGNvbnN0IGJvdW5kOiB0LkJvdW5kQXR0cmlidXRlW10gPSBbXTtcbiAgICBjb25zdCBsaXRlcmFsOiB0LlRleHRBdHRyaWJ1dGVbXSA9IFtdO1xuXG4gICAgcHJvcGVydGllcy5mb3JFYWNoKHByb3AgPT4ge1xuICAgICAgY29uc3QgaTE4biA9IGkxOG5Qcm9wc01ldGFbcHJvcC5uYW1lXTtcbiAgICAgIGlmIChwcm9wLmlzTGl0ZXJhbCkge1xuICAgICAgICBsaXRlcmFsLnB1c2gobmV3IHQuVGV4dEF0dHJpYnV0ZShcbiAgICAgICAgICAgIHByb3AubmFtZSwgcHJvcC5leHByZXNzaW9uLnNvdXJjZSB8fCAnJywgcHJvcC5zb3VyY2VTcGFuLCBwcm9wLmtleVNwYW4sIHByb3AudmFsdWVTcGFuLFxuICAgICAgICAgICAgaTE4bikpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTm90ZSB0aGF0IHZhbGlkYXRpb24gaXMgc2tpcHBlZCBhbmQgcHJvcGVydHkgbWFwcGluZyBpcyBkaXNhYmxlZFxuICAgICAgICAvLyBkdWUgdG8gdGhlIGZhY3QgdGhhdCB3ZSBuZWVkIHRvIG1ha2Ugc3VyZSBhIGdpdmVuIHByb3AgaXMgbm90IGFuXG4gICAgICAgIC8vIGlucHV0IG9mIGEgZGlyZWN0aXZlIGFuZCBkaXJlY3RpdmUgbWF0Y2hpbmcgaGFwcGVucyBhdCBydW50aW1lLlxuICAgICAgICBjb25zdCBiZXAgPSB0aGlzLmJpbmRpbmdQYXJzZXIuY3JlYXRlQm91bmRFbGVtZW50UHJvcGVydHkoXG4gICAgICAgICAgICBlbGVtZW50TmFtZSwgcHJvcCwgLyogc2tpcFZhbGlkYXRpb24gKi8gdHJ1ZSwgLyogbWFwUHJvcGVydHlOYW1lICovIGZhbHNlKTtcbiAgICAgICAgYm91bmQucHVzaCh0LkJvdW5kQXR0cmlidXRlLmZyb21Cb3VuZEVsZW1lbnRQcm9wZXJ0eShiZXAsIGkxOG4pKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB7Ym91bmQsIGxpdGVyYWx9O1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZUF0dHJpYnV0ZShcbiAgICAgIGlzVGVtcGxhdGVFbGVtZW50OiBib29sZWFuLCBhdHRyaWJ1dGU6IGh0bWwuQXR0cmlidXRlLCBtYXRjaGFibGVBdHRyaWJ1dGVzOiBzdHJpbmdbXVtdLFxuICAgICAgcGFyc2VkUHJvcGVydGllczogUGFyc2VkUHJvcGVydHlbXSwgYm91bmRFdmVudHM6IHQuQm91bmRFdmVudFtdLCB2YXJpYWJsZXM6IHQuVmFyaWFibGVbXSxcbiAgICAgIHJlZmVyZW5jZXM6IHQuUmVmZXJlbmNlW10pIHtcbiAgICBjb25zdCBuYW1lID0gbm9ybWFsaXplQXR0cmlidXRlTmFtZShhdHRyaWJ1dGUubmFtZSk7XG4gICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGUudmFsdWU7XG4gICAgY29uc3Qgc3JjU3BhbiA9IGF0dHJpYnV0ZS5zb3VyY2VTcGFuO1xuICAgIGNvbnN0IGFic29sdXRlT2Zmc2V0ID1cbiAgICAgICAgYXR0cmlidXRlLnZhbHVlU3BhbiA/IGF0dHJpYnV0ZS52YWx1ZVNwYW4uc3RhcnQub2Zmc2V0IDogc3JjU3Bhbi5zdGFydC5vZmZzZXQ7XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVLZXlTcGFuKHNyY1NwYW46IFBhcnNlU291cmNlU3BhbiwgcHJlZml4OiBzdHJpbmcsIGlkZW50aWZpZXI6IHN0cmluZykge1xuICAgICAgLy8gV2UgbmVlZCB0byBhZGp1c3QgdGhlIHN0YXJ0IGxvY2F0aW9uIGZvciB0aGUga2V5U3BhbiB0byBhY2NvdW50IGZvciB0aGUgcmVtb3ZlZCAnZGF0YS0nXG4gICAgICAvLyBwcmVmaXggZnJvbSBgbm9ybWFsaXplQXR0cmlidXRlTmFtZWAuXG4gICAgICBjb25zdCBub3JtYWxpemF0aW9uQWRqdXN0bWVudCA9IGF0dHJpYnV0ZS5uYW1lLmxlbmd0aCAtIG5hbWUubGVuZ3RoO1xuICAgICAgY29uc3Qga2V5U3BhblN0YXJ0ID0gc3JjU3Bhbi5zdGFydC5tb3ZlQnkocHJlZml4Lmxlbmd0aCArIG5vcm1hbGl6YXRpb25BZGp1c3RtZW50KTtcbiAgICAgIGNvbnN0IGtleVNwYW5FbmQgPSBrZXlTcGFuU3RhcnQubW92ZUJ5KGlkZW50aWZpZXIubGVuZ3RoKTtcbiAgICAgIHJldHVybiBuZXcgUGFyc2VTb3VyY2VTcGFuKGtleVNwYW5TdGFydCwga2V5U3BhbkVuZCwga2V5U3BhblN0YXJ0LCBpZGVudGlmaWVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBiaW5kUGFydHMgPSBuYW1lLm1hdGNoKEJJTkRfTkFNRV9SRUdFWFApO1xuXG4gICAgaWYgKGJpbmRQYXJ0cykge1xuICAgICAgaWYgKGJpbmRQYXJ0c1tLV19CSU5EX0lEWF0gIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBpZGVudGlmaWVyID0gYmluZFBhcnRzW0lERU5UX0tXX0lEWF07XG4gICAgICAgIGNvbnN0IGtleVNwYW4gPSBjcmVhdGVLZXlTcGFuKHNyY1NwYW4sIGJpbmRQYXJ0c1tLV19CSU5EX0lEWF0sIGlkZW50aWZpZXIpO1xuICAgICAgICB0aGlzLmJpbmRpbmdQYXJzZXIucGFyc2VQcm9wZXJ0eUJpbmRpbmcoXG4gICAgICAgICAgICBpZGVudGlmaWVyLCB2YWx1ZSwgZmFsc2UsIHNyY1NwYW4sIGFic29sdXRlT2Zmc2V0LCBhdHRyaWJ1dGUudmFsdWVTcGFuLFxuICAgICAgICAgICAgbWF0Y2hhYmxlQXR0cmlidXRlcywgcGFyc2VkUHJvcGVydGllcywga2V5U3Bhbik7XG5cbiAgICAgIH0gZWxzZSBpZiAoYmluZFBhcnRzW0tXX0xFVF9JRFhdKSB7XG4gICAgICAgIGlmIChpc1RlbXBsYXRlRWxlbWVudCkge1xuICAgICAgICAgIGNvbnN0IGlkZW50aWZpZXIgPSBiaW5kUGFydHNbSURFTlRfS1dfSURYXTtcbiAgICAgICAgICBjb25zdCBrZXlTcGFuID0gY3JlYXRlS2V5U3BhbihzcmNTcGFuLCBiaW5kUGFydHNbS1dfTEVUX0lEWF0sIGlkZW50aWZpZXIpO1xuICAgICAgICAgIHRoaXMucGFyc2VWYXJpYWJsZShpZGVudGlmaWVyLCB2YWx1ZSwgc3JjU3Bhbiwga2V5U3BhbiwgYXR0cmlidXRlLnZhbHVlU3BhbiwgdmFyaWFibGVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnJlcG9ydEVycm9yKGBcImxldC1cIiBpcyBvbmx5IHN1cHBvcnRlZCBvbiBuZy10ZW1wbGF0ZSBlbGVtZW50cy5gLCBzcmNTcGFuKTtcbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2UgaWYgKGJpbmRQYXJ0c1tLV19SRUZfSURYXSkge1xuICAgICAgICBjb25zdCBpZGVudGlmaWVyID0gYmluZFBhcnRzW0lERU5UX0tXX0lEWF07XG4gICAgICAgIGNvbnN0IGtleVNwYW4gPSBjcmVhdGVLZXlTcGFuKHNyY1NwYW4sIGJpbmRQYXJ0c1tLV19SRUZfSURYXSwgaWRlbnRpZmllcik7XG4gICAgICAgIHRoaXMucGFyc2VSZWZlcmVuY2UoaWRlbnRpZmllciwgdmFsdWUsIHNyY1NwYW4sIGtleVNwYW4sIGF0dHJpYnV0ZS52YWx1ZVNwYW4sIHJlZmVyZW5jZXMpO1xuICAgICAgfSBlbHNlIGlmIChiaW5kUGFydHNbS1dfT05fSURYXSkge1xuICAgICAgICBjb25zdCBldmVudHM6IFBhcnNlZEV2ZW50W10gPSBbXTtcbiAgICAgICAgY29uc3QgaWRlbnRpZmllciA9IGJpbmRQYXJ0c1tJREVOVF9LV19JRFhdO1xuICAgICAgICBjb25zdCBrZXlTcGFuID0gY3JlYXRlS2V5U3BhbihzcmNTcGFuLCBiaW5kUGFydHNbS1dfT05fSURYXSwgaWRlbnRpZmllcik7XG4gICAgICAgIHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZUV2ZW50KFxuICAgICAgICAgICAgaWRlbnRpZmllciwgdmFsdWUsIC8qIGlzQXNzaWdubWVudEV2ZW50ICovIGZhbHNlLCBzcmNTcGFuLFxuICAgICAgICAgICAgYXR0cmlidXRlLnZhbHVlU3BhbiB8fCBzcmNTcGFuLCBtYXRjaGFibGVBdHRyaWJ1dGVzLCBldmVudHMsIGtleVNwYW4pO1xuICAgICAgICBhZGRFdmVudHMoZXZlbnRzLCBib3VuZEV2ZW50cyk7XG4gICAgICB9IGVsc2UgaWYgKGJpbmRQYXJ0c1tLV19CSU5ET05fSURYXSkge1xuICAgICAgICBjb25zdCBpZGVudGlmaWVyID0gYmluZFBhcnRzW0lERU5UX0tXX0lEWF07XG4gICAgICAgIGNvbnN0IGtleVNwYW4gPSBjcmVhdGVLZXlTcGFuKHNyY1NwYW4sIGJpbmRQYXJ0c1tLV19CSU5ET05fSURYXSwgaWRlbnRpZmllcik7XG4gICAgICAgIHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZVByb3BlcnR5QmluZGluZyhcbiAgICAgICAgICAgIGlkZW50aWZpZXIsIHZhbHVlLCBmYWxzZSwgc3JjU3BhbiwgYWJzb2x1dGVPZmZzZXQsIGF0dHJpYnV0ZS52YWx1ZVNwYW4sXG4gICAgICAgICAgICBtYXRjaGFibGVBdHRyaWJ1dGVzLCBwYXJzZWRQcm9wZXJ0aWVzLCBrZXlTcGFuKTtcbiAgICAgICAgdGhpcy5wYXJzZUFzc2lnbm1lbnRFdmVudChcbiAgICAgICAgICAgIGlkZW50aWZpZXIsIHZhbHVlLCBzcmNTcGFuLCBhdHRyaWJ1dGUudmFsdWVTcGFuLCBtYXRjaGFibGVBdHRyaWJ1dGVzLCBib3VuZEV2ZW50cyxcbiAgICAgICAgICAgIGtleVNwYW4pO1xuICAgICAgfSBlbHNlIGlmIChiaW5kUGFydHNbS1dfQVRfSURYXSkge1xuICAgICAgICBjb25zdCBrZXlTcGFuID0gY3JlYXRlS2V5U3BhbihzcmNTcGFuLCAnJywgbmFtZSk7XG4gICAgICAgIHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZUxpdGVyYWxBdHRyKFxuICAgICAgICAgICAgbmFtZSwgdmFsdWUsIHNyY1NwYW4sIGFic29sdXRlT2Zmc2V0LCBhdHRyaWJ1dGUudmFsdWVTcGFuLCBtYXRjaGFibGVBdHRyaWJ1dGVzLFxuICAgICAgICAgICAgcGFyc2VkUHJvcGVydGllcywga2V5U3Bhbik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBXZSBkaWRuJ3Qgc2VlIGEga3ctcHJlZml4ZWQgcHJvcGVydHkgYmluZGluZywgYnV0IHdlIGhhdmUgbm90IHlldCBjaGVja2VkXG4gICAgLy8gZm9yIHRoZSBbXS8oKS9bKCldIHN5bnRheC5cbiAgICBsZXQgZGVsaW1zOiB7c3RhcnQ6IHN0cmluZywgZW5kOiBzdHJpbmd9fG51bGwgPSBudWxsO1xuICAgIGlmIChuYW1lLnN0YXJ0c1dpdGgoQklORElOR19ERUxJTVMuQkFOQU5BX0JPWC5zdGFydCkpIHtcbiAgICAgIGRlbGltcyA9IEJJTkRJTkdfREVMSU1TLkJBTkFOQV9CT1g7XG4gICAgfSBlbHNlIGlmIChuYW1lLnN0YXJ0c1dpdGgoQklORElOR19ERUxJTVMuUFJPUEVSVFkuc3RhcnQpKSB7XG4gICAgICBkZWxpbXMgPSBCSU5ESU5HX0RFTElNUy5QUk9QRVJUWTtcbiAgICB9IGVsc2UgaWYgKG5hbWUuc3RhcnRzV2l0aChCSU5ESU5HX0RFTElNUy5FVkVOVC5zdGFydCkpIHtcbiAgICAgIGRlbGltcyA9IEJJTkRJTkdfREVMSU1TLkVWRU5UO1xuICAgIH1cbiAgICBpZiAoZGVsaW1zICE9PSBudWxsICYmXG4gICAgICAgIC8vIE5PVEU6IG9sZGVyIHZlcnNpb25zIG9mIHRoZSBwYXJzZXIgd291bGQgbWF0Y2ggYSBzdGFydC9lbmQgZGVsaW1pdGVkXG4gICAgICAgIC8vIGJpbmRpbmcgaWZmIHRoZSBwcm9wZXJ0eSBuYW1lIHdhcyB0ZXJtaW5hdGVkIGJ5IHRoZSBlbmRpbmcgZGVsaW1pdGVyXG4gICAgICAgIC8vIGFuZCB0aGUgaWRlbnRpZmllciBpbiB0aGUgYmluZGluZyB3YXMgbm9uLWVtcHR5LlxuICAgICAgICAvLyBUT0RPKGF5YXpoYWZpeik6IHVwZGF0ZSB0aGlzIHRvIGhhbmRsZSBtYWxmb3JtZWQgYmluZGluZ3MuXG4gICAgICAgIG5hbWUuZW5kc1dpdGgoZGVsaW1zLmVuZCkgJiYgbmFtZS5sZW5ndGggPiBkZWxpbXMuc3RhcnQubGVuZ3RoICsgZGVsaW1zLmVuZC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGlkZW50aWZpZXIgPSBuYW1lLnN1YnN0cmluZyhkZWxpbXMuc3RhcnQubGVuZ3RoLCBuYW1lLmxlbmd0aCAtIGRlbGltcy5lbmQubGVuZ3RoKTtcbiAgICAgIGNvbnN0IGtleVNwYW4gPSBjcmVhdGVLZXlTcGFuKHNyY1NwYW4sIGRlbGltcy5zdGFydCwgaWRlbnRpZmllcik7XG4gICAgICBpZiAoZGVsaW1zLnN0YXJ0ID09PSBCSU5ESU5HX0RFTElNUy5CQU5BTkFfQk9YLnN0YXJ0KSB7XG4gICAgICAgIHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZVByb3BlcnR5QmluZGluZyhcbiAgICAgICAgICAgIGlkZW50aWZpZXIsIHZhbHVlLCBmYWxzZSwgc3JjU3BhbiwgYWJzb2x1dGVPZmZzZXQsIGF0dHJpYnV0ZS52YWx1ZVNwYW4sXG4gICAgICAgICAgICBtYXRjaGFibGVBdHRyaWJ1dGVzLCBwYXJzZWRQcm9wZXJ0aWVzLCBrZXlTcGFuKTtcbiAgICAgICAgdGhpcy5wYXJzZUFzc2lnbm1lbnRFdmVudChcbiAgICAgICAgICAgIGlkZW50aWZpZXIsIHZhbHVlLCBzcmNTcGFuLCBhdHRyaWJ1dGUudmFsdWVTcGFuLCBtYXRjaGFibGVBdHRyaWJ1dGVzLCBib3VuZEV2ZW50cyxcbiAgICAgICAgICAgIGtleVNwYW4pO1xuICAgICAgfSBlbHNlIGlmIChkZWxpbXMuc3RhcnQgPT09IEJJTkRJTkdfREVMSU1TLlBST1BFUlRZLnN0YXJ0KSB7XG4gICAgICAgIHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZVByb3BlcnR5QmluZGluZyhcbiAgICAgICAgICAgIGlkZW50aWZpZXIsIHZhbHVlLCBmYWxzZSwgc3JjU3BhbiwgYWJzb2x1dGVPZmZzZXQsIGF0dHJpYnV0ZS52YWx1ZVNwYW4sXG4gICAgICAgICAgICBtYXRjaGFibGVBdHRyaWJ1dGVzLCBwYXJzZWRQcm9wZXJ0aWVzLCBrZXlTcGFuKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGV2ZW50czogUGFyc2VkRXZlbnRbXSA9IFtdO1xuICAgICAgICB0aGlzLmJpbmRpbmdQYXJzZXIucGFyc2VFdmVudChcbiAgICAgICAgICAgIGlkZW50aWZpZXIsIHZhbHVlLCAvKiBpc0Fzc2lnbm1lbnRFdmVudCAqLyBmYWxzZSwgc3JjU3BhbixcbiAgICAgICAgICAgIGF0dHJpYnV0ZS52YWx1ZVNwYW4gfHwgc3JjU3BhbiwgbWF0Y2hhYmxlQXR0cmlidXRlcywgZXZlbnRzLCBrZXlTcGFuKTtcbiAgICAgICAgYWRkRXZlbnRzKGV2ZW50cywgYm91bmRFdmVudHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBObyBleHBsaWNpdCBiaW5kaW5nIGZvdW5kLlxuICAgIGNvbnN0IGtleVNwYW4gPSBjcmVhdGVLZXlTcGFuKHNyY1NwYW4sICcnIC8qIHByZWZpeCAqLywgbmFtZSk7XG4gICAgY29uc3QgaGFzQmluZGluZyA9IHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZVByb3BlcnR5SW50ZXJwb2xhdGlvbihcbiAgICAgICAgbmFtZSwgdmFsdWUsIHNyY1NwYW4sIGF0dHJpYnV0ZS52YWx1ZVNwYW4sIG1hdGNoYWJsZUF0dHJpYnV0ZXMsIHBhcnNlZFByb3BlcnRpZXMsIGtleVNwYW4sXG4gICAgICAgIGF0dHJpYnV0ZS52YWx1ZVRva2VucyA/PyBudWxsKTtcbiAgICByZXR1cm4gaGFzQmluZGluZztcbiAgfVxuXG4gIHByaXZhdGUgX3Zpc2l0VGV4dFdpdGhJbnRlcnBvbGF0aW9uKFxuICAgICAgdmFsdWU6IHN0cmluZywgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuLFxuICAgICAgaW50ZXJwb2xhdGVkVG9rZW5zOiBJbnRlcnBvbGF0ZWRBdHRyaWJ1dGVUb2tlbltdfEludGVycG9sYXRlZFRleHRUb2tlbltdfG51bGwsXG4gICAgICBpMThuPzogaTE4bi5JMThuTWV0YSk6IHQuVGV4dHx0LkJvdW5kVGV4dCB7XG4gICAgY29uc3QgdmFsdWVOb05nc3AgPSByZXBsYWNlTmdzcCh2YWx1ZSk7XG4gICAgY29uc3QgZXhwciA9IHRoaXMuYmluZGluZ1BhcnNlci5wYXJzZUludGVycG9sYXRpb24odmFsdWVOb05nc3AsIHNvdXJjZVNwYW4sIGludGVycG9sYXRlZFRva2Vucyk7XG4gICAgcmV0dXJuIGV4cHIgPyBuZXcgdC5Cb3VuZFRleHQoZXhwciwgc291cmNlU3BhbiwgaTE4bikgOiBuZXcgdC5UZXh0KHZhbHVlTm9OZ3NwLCBzb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHByaXZhdGUgcGFyc2VWYXJpYWJsZShcbiAgICAgIGlkZW50aWZpZXI6IHN0cmluZywgdmFsdWU6IHN0cmluZywgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuLCBrZXlTcGFuOiBQYXJzZVNvdXJjZVNwYW4sXG4gICAgICB2YWx1ZVNwYW46IFBhcnNlU291cmNlU3Bhbnx1bmRlZmluZWQsIHZhcmlhYmxlczogdC5WYXJpYWJsZVtdKSB7XG4gICAgaWYgKGlkZW50aWZpZXIuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgIHRoaXMucmVwb3J0RXJyb3IoYFwiLVwiIGlzIG5vdCBhbGxvd2VkIGluIHZhcmlhYmxlIG5hbWVzYCwgc291cmNlU3Bhbik7XG4gICAgfSBlbHNlIGlmIChpZGVudGlmaWVyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5yZXBvcnRFcnJvcihgVmFyaWFibGUgZG9lcyBub3QgaGF2ZSBhIG5hbWVgLCBzb3VyY2VTcGFuKTtcbiAgICB9XG5cbiAgICB2YXJpYWJsZXMucHVzaChuZXcgdC5WYXJpYWJsZShpZGVudGlmaWVyLCB2YWx1ZSwgc291cmNlU3Bhbiwga2V5U3BhbiwgdmFsdWVTcGFuKSk7XG4gIH1cblxuICBwcml2YXRlIHBhcnNlUmVmZXJlbmNlKFxuICAgICAgaWRlbnRpZmllcjogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4sIGtleVNwYW46IFBhcnNlU291cmNlU3BhbixcbiAgICAgIHZhbHVlU3BhbjogUGFyc2VTb3VyY2VTcGFufHVuZGVmaW5lZCwgcmVmZXJlbmNlczogdC5SZWZlcmVuY2VbXSkge1xuICAgIGlmIChpZGVudGlmaWVyLmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICB0aGlzLnJlcG9ydEVycm9yKGBcIi1cIiBpcyBub3QgYWxsb3dlZCBpbiByZWZlcmVuY2UgbmFtZXNgLCBzb3VyY2VTcGFuKTtcbiAgICB9IGVsc2UgaWYgKGlkZW50aWZpZXIubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnJlcG9ydEVycm9yKGBSZWZlcmVuY2UgZG9lcyBub3QgaGF2ZSBhIG5hbWVgLCBzb3VyY2VTcGFuKTtcbiAgICB9IGVsc2UgaWYgKHJlZmVyZW5jZXMuc29tZShyZWZlcmVuY2UgPT4gcmVmZXJlbmNlLm5hbWUgPT09IGlkZW50aWZpZXIpKSB7XG4gICAgICB0aGlzLnJlcG9ydEVycm9yKGBSZWZlcmVuY2UgXCIjJHtpZGVudGlmaWVyfVwiIGlzIGRlZmluZWQgbW9yZSB0aGFuIG9uY2VgLCBzb3VyY2VTcGFuKTtcbiAgICB9XG5cbiAgICByZWZlcmVuY2VzLnB1c2gobmV3IHQuUmVmZXJlbmNlKGlkZW50aWZpZXIsIHZhbHVlLCBzb3VyY2VTcGFuLCBrZXlTcGFuLCB2YWx1ZVNwYW4pKTtcbiAgfVxuXG4gIHByaXZhdGUgcGFyc2VBc3NpZ25tZW50RXZlbnQoXG4gICAgICBuYW1lOiBzdHJpbmcsIGV4cHJlc3Npb246IHN0cmluZywgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuLFxuICAgICAgdmFsdWVTcGFuOiBQYXJzZVNvdXJjZVNwYW58dW5kZWZpbmVkLCB0YXJnZXRNYXRjaGFibGVBdHRyczogc3RyaW5nW11bXSxcbiAgICAgIGJvdW5kRXZlbnRzOiB0LkJvdW5kRXZlbnRbXSwga2V5U3BhbjogUGFyc2VTb3VyY2VTcGFuKSB7XG4gICAgY29uc3QgZXZlbnRzOiBQYXJzZWRFdmVudFtdID0gW107XG4gICAgdGhpcy5iaW5kaW5nUGFyc2VyLnBhcnNlRXZlbnQoXG4gICAgICAgIGAke25hbWV9Q2hhbmdlYCwgYCR7ZXhwcmVzc2lvbn0gPSRldmVudGAsIC8qIGlzQXNzaWdubWVudEV2ZW50ICovIHRydWUsIHNvdXJjZVNwYW4sXG4gICAgICAgIHZhbHVlU3BhbiB8fCBzb3VyY2VTcGFuLCB0YXJnZXRNYXRjaGFibGVBdHRycywgZXZlbnRzLCBrZXlTcGFuKTtcbiAgICBhZGRFdmVudHMoZXZlbnRzLCBib3VuZEV2ZW50cyk7XG4gIH1cblxuICBwcml2YXRlIHJlcG9ydEVycm9yKFxuICAgICAgbWVzc2FnZTogc3RyaW5nLCBzb3VyY2VTcGFuOiBQYXJzZVNvdXJjZVNwYW4sXG4gICAgICBsZXZlbDogUGFyc2VFcnJvckxldmVsID0gUGFyc2VFcnJvckxldmVsLkVSUk9SKSB7XG4gICAgdGhpcy5lcnJvcnMucHVzaChuZXcgUGFyc2VFcnJvcihzb3VyY2VTcGFuLCBtZXNzYWdlLCBsZXZlbCkpO1xuICB9XG59XG5cbmNsYXNzIE5vbkJpbmRhYmxlVmlzaXRvciBpbXBsZW1lbnRzIGh0bWwuVmlzaXRvciB7XG4gIHZpc2l0RWxlbWVudChhc3Q6IGh0bWwuRWxlbWVudCk6IHQuRWxlbWVudHxudWxsIHtcbiAgICBjb25zdCBwcmVwYXJzZWRFbGVtZW50ID0gcHJlcGFyc2VFbGVtZW50KGFzdCk7XG4gICAgaWYgKHByZXBhcnNlZEVsZW1lbnQudHlwZSA9PT0gUHJlcGFyc2VkRWxlbWVudFR5cGUuU0NSSVBUIHx8XG4gICAgICAgIHByZXBhcnNlZEVsZW1lbnQudHlwZSA9PT0gUHJlcGFyc2VkRWxlbWVudFR5cGUuU1RZTEUgfHxcbiAgICAgICAgcHJlcGFyc2VkRWxlbWVudC50eXBlID09PSBQcmVwYXJzZWRFbGVtZW50VHlwZS5TVFlMRVNIRUVUKSB7XG4gICAgICAvLyBTa2lwcGluZyA8c2NyaXB0PiBmb3Igc2VjdXJpdHkgcmVhc29uc1xuICAgICAgLy8gU2tpcHBpbmcgPHN0eWxlPiBhbmQgc3R5bGVzaGVldHMgYXMgd2UgYWxyZWFkeSBwcm9jZXNzZWQgdGhlbVxuICAgICAgLy8gaW4gdGhlIFN0eWxlQ29tcGlsZXJcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNoaWxkcmVuOiB0Lk5vZGVbXSA9IGh0bWwudmlzaXRBbGwodGhpcywgYXN0LmNoaWxkcmVuLCBudWxsKTtcbiAgICByZXR1cm4gbmV3IHQuRWxlbWVudChcbiAgICAgICAgYXN0Lm5hbWUsIGh0bWwudmlzaXRBbGwodGhpcywgYXN0LmF0dHJzKSBhcyB0LlRleHRBdHRyaWJ1dGVbXSxcbiAgICAgICAgLyogaW5wdXRzICovW10sIC8qIG91dHB1dHMgKi9bXSwgY2hpbGRyZW4sIC8qIHJlZmVyZW5jZXMgKi9bXSwgYXN0LnNvdXJjZVNwYW4sXG4gICAgICAgIGFzdC5zdGFydFNvdXJjZVNwYW4sIGFzdC5lbmRTb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHZpc2l0Q29tbWVudChjb21tZW50OiBodG1sLkNvbW1lbnQpOiBhbnkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdmlzaXRBdHRyaWJ1dGUoYXR0cmlidXRlOiBodG1sLkF0dHJpYnV0ZSk6IHQuVGV4dEF0dHJpYnV0ZSB7XG4gICAgcmV0dXJuIG5ldyB0LlRleHRBdHRyaWJ1dGUoXG4gICAgICAgIGF0dHJpYnV0ZS5uYW1lLCBhdHRyaWJ1dGUudmFsdWUsIGF0dHJpYnV0ZS5zb3VyY2VTcGFuLCBhdHRyaWJ1dGUua2V5U3BhbixcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlU3BhbiwgYXR0cmlidXRlLmkxOG4pO1xuICB9XG5cbiAgdmlzaXRUZXh0KHRleHQ6IGh0bWwuVGV4dCk6IHQuVGV4dCB7XG4gICAgcmV0dXJuIG5ldyB0LlRleHQodGV4dC52YWx1ZSwgdGV4dC5zb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHZpc2l0RXhwYW5zaW9uKGV4cGFuc2lvbjogaHRtbC5FeHBhbnNpb24pOiBhbnkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdmlzaXRFeHBhbnNpb25DYXNlKGV4cGFuc2lvbkNhc2U6IGh0bWwuRXhwYW5zaW9uQ2FzZSk6IGFueSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB2aXNpdEJsb2NrR3JvdXAoZ3JvdXA6IGh0bWwuQmxvY2tHcm91cCwgY29udGV4dDogYW55KSB7XG4gICAgY29uc3Qgbm9kZXMgPSBodG1sLnZpc2l0QWxsKHRoaXMsIGdyb3VwLmJsb2Nrcyk7XG5cbiAgICAvLyBXZSBvbmx5IG5lZWQgdG8gZG8gdGhlIGVuZCB0YWcgc2luY2UgdGhlIHN0YXJ0IHdpbGwgYmUgYWRkZWQgYXMgYSBwYXJ0IG9mIHRoZSBwcmltYXJ5IGJsb2NrLlxuICAgIGlmIChncm91cC5lbmRTb3VyY2VTcGFuICE9PSBudWxsKSB7XG4gICAgICBub2Rlcy5wdXNoKG5ldyB0LlRleHQoZ3JvdXAuZW5kU291cmNlU3Bhbi50b1N0cmluZygpLCBncm91cC5lbmRTb3VyY2VTcGFuKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGVzO1xuICB9XG5cbiAgdmlzaXRCbG9jayhibG9jazogaHRtbC5CbG9jaywgY29udGV4dDogYW55KSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIC8vIEluIGFuIG5nTm9uQmluZGFibGUgY29udGV4dCB3ZSB0cmVhdCB0aGUgb3BlbmluZy9jbG9zaW5nIHRhZ3Mgb2YgYmxvY2sgYXMgcGxhaW4gdGV4dC5cbiAgICAgIC8vIFRoaXMgaXMgdGhlIGFzIGlmIHRoZSBgdG9rZW5pemVCbG9ja3NgIG9wdGlvbiB3YXMgZGlzYWJsZWQuXG4gICAgICBuZXcgdC5UZXh0KGJsb2NrLnN0YXJ0U291cmNlU3Bhbi50b1N0cmluZygpLCBibG9jay5zdGFydFNvdXJjZVNwYW4pLFxuICAgICAgLi4uaHRtbC52aXNpdEFsbCh0aGlzLCBibG9jay5jaGlsZHJlbilcbiAgICBdO1xuICB9XG5cbiAgdmlzaXRCbG9ja1BhcmFtZXRlcihwYXJhbWV0ZXI6IGh0bWwuQmxvY2tQYXJhbWV0ZXIsIGNvbnRleHQ6IGFueSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmNvbnN0IE5PTl9CSU5EQUJMRV9WSVNJVE9SID0gbmV3IE5vbkJpbmRhYmxlVmlzaXRvcigpO1xuXG5mdW5jdGlvbiBub3JtYWxpemVBdHRyaWJ1dGVOYW1lKGF0dHJOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gL15kYXRhLS9pLnRlc3QoYXR0ck5hbWUpID8gYXR0ck5hbWUuc3Vic3RyaW5nKDUpIDogYXR0ck5hbWU7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50cyhldmVudHM6IFBhcnNlZEV2ZW50W10sIGJvdW5kRXZlbnRzOiB0LkJvdW5kRXZlbnRbXSkge1xuICBib3VuZEV2ZW50cy5wdXNoKC4uLmV2ZW50cy5tYXAoZSA9PiB0LkJvdW5kRXZlbnQuZnJvbVBhcnNlZEV2ZW50KGUpKSk7XG59XG5cbmZ1bmN0aW9uIGlzRW1wdHlUZXh0Tm9kZShub2RlOiBodG1sLk5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIG5vZGUgaW5zdGFuY2VvZiBodG1sLlRleHQgJiYgbm9kZS52YWx1ZS50cmltKCkubGVuZ3RoID09IDA7XG59XG5cbmZ1bmN0aW9uIGlzQ29tbWVudE5vZGUobm9kZTogaHRtbC5Ob2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiBub2RlIGluc3RhbmNlb2YgaHRtbC5Db21tZW50O1xufVxuXG5mdW5jdGlvbiB0ZXh0Q29udGVudHMobm9kZTogaHRtbC5FbGVtZW50KTogc3RyaW5nfG51bGwge1xuICBpZiAobm9kZS5jaGlsZHJlbi5sZW5ndGggIT09IDEgfHwgIShub2RlLmNoaWxkcmVuWzBdIGluc3RhbmNlb2YgaHRtbC5UZXh0KSkge1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAobm9kZS5jaGlsZHJlblswXSBhcyBodG1sLlRleHQpLnZhbHVlO1xuICB9XG59XG4iXX0=