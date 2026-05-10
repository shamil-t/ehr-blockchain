/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Lexer as ExpressionLexer } from '../expression_parser/lexer';
import { Parser as ExpressionParser } from '../expression_parser/parser';
import * as html from '../ml_parser/ast';
import { getHtmlTagDefinition } from '../ml_parser/html_tags';
import { ParseSourceSpan } from '../parse_util';
import * as i18n from './i18n_ast';
import { PlaceholderRegistry } from './serializers/placeholder';
const _expParser = new ExpressionParser(new ExpressionLexer());
/**
 * Returns a function converting html nodes to an i18n Message given an interpolationConfig
 */
export function createI18nMessageFactory(interpolationConfig) {
    const visitor = new _I18nVisitor(_expParser, interpolationConfig);
    return (nodes, meaning, description, customId, visitNodeFn) => visitor.toI18nMessage(nodes, meaning, description, customId, visitNodeFn);
}
function noopVisitNodeFn(_html, i18n) {
    return i18n;
}
class _I18nVisitor {
    constructor(_expressionParser, _interpolationConfig) {
        this._expressionParser = _expressionParser;
        this._interpolationConfig = _interpolationConfig;
    }
    toI18nMessage(nodes, meaning = '', description = '', customId = '', visitNodeFn) {
        const context = {
            isIcu: nodes.length == 1 && nodes[0] instanceof html.Expansion,
            icuDepth: 0,
            placeholderRegistry: new PlaceholderRegistry(),
            placeholderToContent: {},
            placeholderToMessage: {},
            visitNodeFn: visitNodeFn || noopVisitNodeFn,
        };
        const i18nodes = html.visitAll(this, nodes, context);
        return new i18n.Message(i18nodes, context.placeholderToContent, context.placeholderToMessage, meaning, description, customId);
    }
    visitElement(el, context) {
        const children = html.visitAll(this, el.children, context);
        const attrs = {};
        el.attrs.forEach(attr => {
            // Do not visit the attributes, translatable ones are top-level ASTs
            attrs[attr.name] = attr.value;
        });
        const isVoid = getHtmlTagDefinition(el.name).isVoid;
        const startPhName = context.placeholderRegistry.getStartTagPlaceholderName(el.name, attrs, isVoid);
        context.placeholderToContent[startPhName] = {
            text: el.startSourceSpan.toString(),
            sourceSpan: el.startSourceSpan,
        };
        let closePhName = '';
        if (!isVoid) {
            closePhName = context.placeholderRegistry.getCloseTagPlaceholderName(el.name);
            context.placeholderToContent[closePhName] = {
                text: `</${el.name}>`,
                sourceSpan: el.endSourceSpan ?? el.sourceSpan,
            };
        }
        const node = new i18n.TagPlaceholder(el.name, attrs, startPhName, closePhName, children, isVoid, el.sourceSpan, el.startSourceSpan, el.endSourceSpan);
        return context.visitNodeFn(el, node);
    }
    visitAttribute(attribute, context) {
        const node = attribute.valueTokens === undefined || attribute.valueTokens.length === 1 ?
            new i18n.Text(attribute.value, attribute.valueSpan || attribute.sourceSpan) :
            this._visitTextWithInterpolation(attribute.valueTokens, attribute.valueSpan || attribute.sourceSpan, context, attribute.i18n);
        return context.visitNodeFn(attribute, node);
    }
    visitText(text, context) {
        const node = text.tokens.length === 1 ?
            new i18n.Text(text.value, text.sourceSpan) :
            this._visitTextWithInterpolation(text.tokens, text.sourceSpan, context, text.i18n);
        return context.visitNodeFn(text, node);
    }
    visitComment(comment, context) {
        return null;
    }
    visitExpansion(icu, context) {
        context.icuDepth++;
        const i18nIcuCases = {};
        const i18nIcu = new i18n.Icu(icu.switchValue, icu.type, i18nIcuCases, icu.sourceSpan);
        icu.cases.forEach((caze) => {
            i18nIcuCases[caze.value] = new i18n.Container(caze.expression.map((node) => node.visit(this, context)), caze.expSourceSpan);
        });
        context.icuDepth--;
        if (context.isIcu || context.icuDepth > 0) {
            // Returns an ICU node when:
            // - the message (vs a part of the message) is an ICU message, or
            // - the ICU message is nested.
            const expPh = context.placeholderRegistry.getUniquePlaceholder(`VAR_${icu.type}`);
            i18nIcu.expressionPlaceholder = expPh;
            context.placeholderToContent[expPh] = {
                text: icu.switchValue,
                sourceSpan: icu.switchValueSourceSpan,
            };
            return context.visitNodeFn(icu, i18nIcu);
        }
        // Else returns a placeholder
        // ICU placeholders should not be replaced with their original content but with the their
        // translations.
        // TODO(vicb): add a html.Node -> i18n.Message cache to avoid having to re-create the msg
        const phName = context.placeholderRegistry.getPlaceholderName('ICU', icu.sourceSpan.toString());
        context.placeholderToMessage[phName] = this.toI18nMessage([icu], '', '', '', undefined);
        const node = new i18n.IcuPlaceholder(i18nIcu, phName, icu.sourceSpan);
        return context.visitNodeFn(icu, node);
    }
    visitExpansionCase(_icuCase, _context) {
        throw new Error('Unreachable code');
    }
    visitBlockGroup(group, context) {
        const children = html.visitAll(this, group.blocks, context);
        const node = new i18n.Container(children, group.sourceSpan);
        return context.visitNodeFn(group, node);
    }
    visitBlock(block, context) {
        const children = html.visitAll(this, block.children, context);
        const node = new i18n.Container(children, block.sourceSpan);
        return context.visitNodeFn(block, node);
    }
    visitBlockParameter(_parameter, _context) { }
    /**
     * Convert, text and interpolated tokens up into text and placeholder pieces.
     *
     * @param tokens The text and interpolated tokens.
     * @param sourceSpan The span of the whole of the `text` string.
     * @param context The current context of the visitor, used to compute and store placeholders.
     * @param previousI18n Any i18n metadata associated with this `text` from a previous pass.
     */
    _visitTextWithInterpolation(tokens, sourceSpan, context, previousI18n) {
        // Return a sequence of `Text` and `Placeholder` nodes grouped in a `Container`.
        const nodes = [];
        // We will only create a container if there are actually interpolations,
        // so this flag tracks that.
        let hasInterpolation = false;
        for (const token of tokens) {
            switch (token.type) {
                case 8 /* TokenType.INTERPOLATION */:
                case 17 /* TokenType.ATTR_VALUE_INTERPOLATION */:
                    hasInterpolation = true;
                    const expression = token.parts[1];
                    const baseName = extractPlaceholderName(expression) || 'INTERPOLATION';
                    const phName = context.placeholderRegistry.getPlaceholderName(baseName, expression);
                    context.placeholderToContent[phName] = {
                        text: token.parts.join(''),
                        sourceSpan: token.sourceSpan
                    };
                    nodes.push(new i18n.Placeholder(expression, phName, token.sourceSpan));
                    break;
                default:
                    if (token.parts[0].length > 0) {
                        // This token is text or an encoded entity.
                        // If it is following on from a previous text node then merge it into that node
                        // Otherwise, if it is following an interpolation, then add a new node.
                        const previous = nodes[nodes.length - 1];
                        if (previous instanceof i18n.Text) {
                            previous.value += token.parts[0];
                            previous.sourceSpan = new ParseSourceSpan(previous.sourceSpan.start, token.sourceSpan.end, previous.sourceSpan.fullStart, previous.sourceSpan.details);
                        }
                        else {
                            nodes.push(new i18n.Text(token.parts[0], token.sourceSpan));
                        }
                    }
                    break;
            }
        }
        if (hasInterpolation) {
            // Whitespace removal may have invalidated the interpolation source-spans.
            reusePreviousSourceSpans(nodes, previousI18n);
            return new i18n.Container(nodes, sourceSpan);
        }
        else {
            return nodes[0];
        }
    }
}
/**
 * Re-use the source-spans from `previousI18n` metadata for the `nodes`.
 *
 * Whitespace removal can invalidate the source-spans of interpolation nodes, so we
 * reuse the source-span stored from a previous pass before the whitespace was removed.
 *
 * @param nodes The `Text` and `Placeholder` nodes to be processed.
 * @param previousI18n Any i18n metadata for these `nodes` stored from a previous pass.
 */
function reusePreviousSourceSpans(nodes, previousI18n) {
    if (previousI18n instanceof i18n.Message) {
        // The `previousI18n` is an i18n `Message`, so we are processing an `Attribute` with i18n
        // metadata. The `Message` should consist only of a single `Container` that contains the
        // parts (`Text` and `Placeholder`) to process.
        assertSingleContainerMessage(previousI18n);
        previousI18n = previousI18n.nodes[0];
    }
    if (previousI18n instanceof i18n.Container) {
        // The `previousI18n` is a `Container`, which means that this is a second i18n extraction pass
        // after whitespace has been removed from the AST nodes.
        assertEquivalentNodes(previousI18n.children, nodes);
        // Reuse the source-spans from the first pass.
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].sourceSpan = previousI18n.children[i].sourceSpan;
        }
    }
}
/**
 * Asserts that the `message` contains exactly one `Container` node.
 */
function assertSingleContainerMessage(message) {
    const nodes = message.nodes;
    if (nodes.length !== 1 || !(nodes[0] instanceof i18n.Container)) {
        throw new Error('Unexpected previous i18n message - expected it to consist of only a single `Container` node.');
    }
}
/**
 * Asserts that the `previousNodes` and `node` collections have the same number of elements and
 * corresponding elements have the same node type.
 */
function assertEquivalentNodes(previousNodes, nodes) {
    if (previousNodes.length !== nodes.length) {
        throw new Error('The number of i18n message children changed between first and second pass.');
    }
    if (previousNodes.some((node, i) => nodes[i].constructor !== node.constructor)) {
        throw new Error('The types of the i18n message children changed between first and second pass.');
    }
}
const _CUSTOM_PH_EXP = /\/\/[\s\S]*i18n[\s\S]*\([\s\S]*ph[\s\S]*=[\s\S]*("|')([\s\S]*?)\1[\s\S]*\)/g;
function extractPlaceholderName(input) {
    return input.split(_CUSTOM_PH_EXP)[2];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9wYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvaTE4bi9pMThuX3BhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsS0FBSyxJQUFJLGVBQWUsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxNQUFNLElBQUksZ0JBQWdCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUN2RSxPQUFPLEtBQUssSUFBSSxNQUFNLGtCQUFrQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRzVELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFOUMsT0FBTyxLQUFLLElBQUksTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFFOUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLGVBQWUsRUFBRSxDQUFDLENBQUM7QUFTL0Q7O0dBRUc7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsbUJBQXdDO0lBRS9FLE1BQU0sT0FBTyxHQUFHLElBQUksWUFBWSxDQUFDLFVBQVUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ2xFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FDbkQsT0FBTyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDdkYsQ0FBQztBQVdELFNBQVMsZUFBZSxDQUFDLEtBQWdCLEVBQUUsSUFBZTtJQUN4RCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLFlBQVk7SUFD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SUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7UUFDOUUsTUFBTSxJQUFJLEtBQUssQ0FDWCwrRUFBK0UsQ0FBQyxDQUFDO0tBQ3RGO0FBQ0gsQ0FBQztBQUVELE1BQU0sY0FBYyxHQUNoQiw2RUFBNkUsQ0FBQztBQUVsRixTQUFTLHNCQUFzQixDQUFDLEtBQWE7SUFDM0MsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtMZXhlciBhcyBFeHByZXNzaW9uTGV4ZXJ9IGZyb20gJy4uL2V4cHJlc3Npb25fcGFyc2VyL2xleGVyJztcbmltcG9ydCB7UGFyc2VyIGFzIEV4cHJlc3Npb25QYXJzZXJ9IGZyb20gJy4uL2V4cHJlc3Npb25fcGFyc2VyL3BhcnNlcic7XG5pbXBvcnQgKiBhcyBodG1sIGZyb20gJy4uL21sX3BhcnNlci9hc3QnO1xuaW1wb3J0IHtnZXRIdG1sVGFnRGVmaW5pdGlvbn0gZnJvbSAnLi4vbWxfcGFyc2VyL2h0bWxfdGFncyc7XG5pbXBvcnQge0ludGVycG9sYXRpb25Db25maWd9IGZyb20gJy4uL21sX3BhcnNlci9pbnRlcnBvbGF0aW9uX2NvbmZpZyc7XG5pbXBvcnQge0ludGVycG9sYXRlZEF0dHJpYnV0ZVRva2VuLCBJbnRlcnBvbGF0ZWRUZXh0VG9rZW4sIFRva2VuVHlwZX0gZnJvbSAnLi4vbWxfcGFyc2VyL3Rva2Vucyc7XG5pbXBvcnQge1BhcnNlU291cmNlU3Bhbn0gZnJvbSAnLi4vcGFyc2VfdXRpbCc7XG5cbmltcG9ydCAqIGFzIGkxOG4gZnJvbSAnLi9pMThuX2FzdCc7XG5pbXBvcnQge1BsYWNlaG9sZGVyUmVnaXN0cnl9IGZyb20gJy4vc2VyaWFsaXplcnMvcGxhY2Vob2xkZXInO1xuXG5jb25zdCBfZXhwUGFyc2VyID0gbmV3IEV4cHJlc3Npb25QYXJzZXIobmV3IEV4cHJlc3Npb25MZXhlcigpKTtcblxuZXhwb3J0IHR5cGUgVmlzaXROb2RlRm4gPSAoaHRtbDogaHRtbC5Ob2RlLCBpMThuOiBpMThuLk5vZGUpID0+IGkxOG4uTm9kZTtcblxuZXhwb3J0IGludGVyZmFjZSBJMThuTWVzc2FnZUZhY3Rvcnkge1xuICAobm9kZXM6IGh0bWwuTm9kZVtdLCBtZWFuaW5nOiBzdHJpbmd8dW5kZWZpbmVkLCBkZXNjcmlwdGlvbjogc3RyaW5nfHVuZGVmaW5lZCxcbiAgIGN1c3RvbUlkOiBzdHJpbmd8dW5kZWZpbmVkLCB2aXNpdE5vZGVGbj86IFZpc2l0Tm9kZUZuKTogaTE4bi5NZXNzYWdlO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBmdW5jdGlvbiBjb252ZXJ0aW5nIGh0bWwgbm9kZXMgdG8gYW4gaTE4biBNZXNzYWdlIGdpdmVuIGFuIGludGVycG9sYXRpb25Db25maWdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUkxOG5NZXNzYWdlRmFjdG9yeShpbnRlcnBvbGF0aW9uQ29uZmlnOiBJbnRlcnBvbGF0aW9uQ29uZmlnKTpcbiAgICBJMThuTWVzc2FnZUZhY3Rvcnkge1xuICBjb25zdCB2aXNpdG9yID0gbmV3IF9JMThuVmlzaXRvcihfZXhwUGFyc2VyLCBpbnRlcnBvbGF0aW9uQ29uZmlnKTtcbiAgcmV0dXJuIChub2RlcywgbWVhbmluZywgZGVzY3JpcHRpb24sIGN1c3RvbUlkLCB2aXNpdE5vZGVGbikgPT5cbiAgICAgICAgICAgICB2aXNpdG9yLnRvSTE4bk1lc3NhZ2Uobm9kZXMsIG1lYW5pbmcsIGRlc2NyaXB0aW9uLCBjdXN0b21JZCwgdmlzaXROb2RlRm4pO1xufVxuXG5pbnRlcmZhY2UgSTE4bk1lc3NhZ2VWaXNpdG9yQ29udGV4dCB7XG4gIGlzSWN1OiBib29sZWFuO1xuICBpY3VEZXB0aDogbnVtYmVyO1xuICBwbGFjZWhvbGRlclJlZ2lzdHJ5OiBQbGFjZWhvbGRlclJlZ2lzdHJ5O1xuICBwbGFjZWhvbGRlclRvQ29udGVudDoge1twaE5hbWU6IHN0cmluZ106IGkxOG4uTWVzc2FnZVBsYWNlaG9sZGVyfTtcbiAgcGxhY2Vob2xkZXJUb01lc3NhZ2U6IHtbcGhOYW1lOiBzdHJpbmddOiBpMThuLk1lc3NhZ2V9O1xuICB2aXNpdE5vZGVGbjogVmlzaXROb2RlRm47XG59XG5cbmZ1bmN0aW9uIG5vb3BWaXNpdE5vZGVGbihfaHRtbDogaHRtbC5Ob2RlLCBpMThuOiBpMThuLk5vZGUpOiBpMThuLk5vZGUge1xuICByZXR1cm4gaTE4bjtcbn1cblxuY2xhc3MgX0kxOG5WaXNpdG9yIGltcGxlbWVudHMgaHRtbC5WaXNpdG9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9leHByZXNzaW9uUGFyc2VyOiBFeHByZXNzaW9uUGFyc2VyLFxuICAgICAgcHJpdmF0ZSBfaW50ZXJwb2xhdGlvbkNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZykge31cblxuICBwdWJsaWMgdG9JMThuTWVzc2FnZShcbiAgICAgIG5vZGVzOiBodG1sLk5vZGVbXSwgbWVhbmluZyA9ICcnLCBkZXNjcmlwdGlvbiA9ICcnLCBjdXN0b21JZCA9ICcnLFxuICAgICAgdmlzaXROb2RlRm46IFZpc2l0Tm9kZUZufHVuZGVmaW5lZCk6IGkxOG4uTWVzc2FnZSB7XG4gICAgY29uc3QgY29udGV4dDogSTE4bk1lc3NhZ2VWaXNpdG9yQ29udGV4dCA9IHtcbiAgICAgIGlzSWN1OiBub2Rlcy5sZW5ndGggPT0gMSAmJiBub2Rlc1swXSBpbnN0YW5jZW9mIGh0bWwuRXhwYW5zaW9uLFxuICAgICAgaWN1RGVwdGg6IDAsXG4gICAgICBwbGFjZWhvbGRlclJlZ2lzdHJ5OiBuZXcgUGxhY2Vob2xkZXJSZWdpc3RyeSgpLFxuICAgICAgcGxhY2Vob2xkZXJUb0NvbnRlbnQ6IHt9LFxuICAgICAgcGxhY2Vob2xkZXJUb01lc3NhZ2U6IHt9LFxuICAgICAgdmlzaXROb2RlRm46IHZpc2l0Tm9kZUZuIHx8IG5vb3BWaXNpdE5vZGVGbixcbiAgICB9O1xuXG4gICAgY29uc3QgaTE4bm9kZXM6IGkxOG4uTm9kZVtdID0gaHRtbC52aXNpdEFsbCh0aGlzLCBub2RlcywgY29udGV4dCk7XG5cbiAgICByZXR1cm4gbmV3IGkxOG4uTWVzc2FnZShcbiAgICAgICAgaTE4bm9kZXMsIGNvbnRleHQucGxhY2Vob2xkZXJUb0NvbnRlbnQsIGNvbnRleHQucGxhY2Vob2xkZXJUb01lc3NhZ2UsIG1lYW5pbmcsIGRlc2NyaXB0aW9uLFxuICAgICAgICBjdXN0b21JZCk7XG4gIH1cblxuICB2aXNpdEVsZW1lbnQoZWw6IGh0bWwuRWxlbWVudCwgY29udGV4dDogSTE4bk1lc3NhZ2VWaXNpdG9yQ29udGV4dCk6IGkxOG4uTm9kZSB7XG4gICAgY29uc3QgY2hpbGRyZW4gPSBodG1sLnZpc2l0QWxsKHRoaXMsIGVsLmNoaWxkcmVuLCBjb250ZXh0KTtcbiAgICBjb25zdCBhdHRyczoge1trOiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gICAgZWwuYXR0cnMuZm9yRWFjaChhdHRyID0+IHtcbiAgICAgIC8vIERvIG5vdCB2aXNpdCB0aGUgYXR0cmlidXRlcywgdHJhbnNsYXRhYmxlIG9uZXMgYXJlIHRvcC1sZXZlbCBBU1RzXG4gICAgICBhdHRyc1thdHRyLm5hbWVdID0gYXR0ci52YWx1ZTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGlzVm9pZDogYm9vbGVhbiA9IGdldEh0bWxUYWdEZWZpbml0aW9uKGVsLm5hbWUpLmlzVm9pZDtcbiAgICBjb25zdCBzdGFydFBoTmFtZSA9XG4gICAgICAgIGNvbnRleHQucGxhY2Vob2xkZXJSZWdpc3RyeS5nZXRTdGFydFRhZ1BsYWNlaG9sZGVyTmFtZShlbC5uYW1lLCBhdHRycywgaXNWb2lkKTtcbiAgICBjb250ZXh0LnBsYWNlaG9sZGVyVG9Db250ZW50W3N0YXJ0UGhOYW1lXSA9IHtcbiAgICAgIHRleHQ6IGVsLnN0YXJ0U291cmNlU3Bhbi50b1N0cmluZygpLFxuICAgICAgc291cmNlU3BhbjogZWwuc3RhcnRTb3VyY2VTcGFuLFxuICAgIH07XG5cbiAgICBsZXQgY2xvc2VQaE5hbWUgPSAnJztcblxuICAgIGlmICghaXNWb2lkKSB7XG4gICAgICBjbG9zZVBoTmFtZSA9IGNvbnRleHQucGxhY2Vob2xkZXJSZWdpc3RyeS5nZXRDbG9zZVRhZ1BsYWNlaG9sZGVyTmFtZShlbC5uYW1lKTtcbiAgICAgIGNvbnRleHQucGxhY2Vob2xkZXJUb0NvbnRlbnRbY2xvc2VQaE5hbWVdID0ge1xuICAgICAgICB0ZXh0OiBgPC8ke2VsLm5hbWV9PmAsXG4gICAgICAgIHNvdXJjZVNwYW46IGVsLmVuZFNvdXJjZVNwYW4gPz8gZWwuc291cmNlU3BhbixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3Qgbm9kZSA9IG5ldyBpMThuLlRhZ1BsYWNlaG9sZGVyKFxuICAgICAgICBlbC5uYW1lLCBhdHRycywgc3RhcnRQaE5hbWUsIGNsb3NlUGhOYW1lLCBjaGlsZHJlbiwgaXNWb2lkLCBlbC5zb3VyY2VTcGFuLFxuICAgICAgICBlbC5zdGFydFNvdXJjZVNwYW4sIGVsLmVuZFNvdXJjZVNwYW4pO1xuICAgIHJldHVybiBjb250ZXh0LnZpc2l0Tm9kZUZuKGVsLCBub2RlKTtcbiAgfVxuXG4gIHZpc2l0QXR0cmlidXRlKGF0dHJpYnV0ZTogaHRtbC5BdHRyaWJ1dGUsIGNvbnRleHQ6IEkxOG5NZXNzYWdlVmlzaXRvckNvbnRleHQpOiBpMThuLk5vZGUge1xuICAgIGNvbnN0IG5vZGUgPSBhdHRyaWJ1dGUudmFsdWVUb2tlbnMgPT09IHVuZGVmaW5lZCB8fCBhdHRyaWJ1dGUudmFsdWVUb2tlbnMubGVuZ3RoID09PSAxID9cbiAgICAgICAgbmV3IGkxOG4uVGV4dChhdHRyaWJ1dGUudmFsdWUsIGF0dHJpYnV0ZS52YWx1ZVNwYW4gfHwgYXR0cmlidXRlLnNvdXJjZVNwYW4pIDpcbiAgICAgICAgdGhpcy5fdmlzaXRUZXh0V2l0aEludGVycG9sYXRpb24oXG4gICAgICAgICAgICBhdHRyaWJ1dGUudmFsdWVUb2tlbnMsIGF0dHJpYnV0ZS52YWx1ZVNwYW4gfHwgYXR0cmlidXRlLnNvdXJjZVNwYW4sIGNvbnRleHQsXG4gICAgICAgICAgICBhdHRyaWJ1dGUuaTE4bik7XG4gICAgcmV0dXJuIGNvbnRleHQudmlzaXROb2RlRm4oYXR0cmlidXRlLCBub2RlKTtcbiAgfVxuXG4gIHZpc2l0VGV4dCh0ZXh0OiBodG1sLlRleHQsIGNvbnRleHQ6IEkxOG5NZXNzYWdlVmlzaXRvckNvbnRleHQpOiBpMThuLk5vZGUge1xuICAgIGNvbnN0IG5vZGUgPSB0ZXh0LnRva2Vucy5sZW5ndGggPT09IDEgP1xuICAgICAgICBuZXcgaTE4bi5UZXh0KHRleHQudmFsdWUsIHRleHQuc291cmNlU3BhbikgOlxuICAgICAgICB0aGlzLl92aXNpdFRleHRXaXRoSW50ZXJwb2xhdGlvbih0ZXh0LnRva2VucywgdGV4dC5zb3VyY2VTcGFuLCBjb250ZXh0LCB0ZXh0LmkxOG4pO1xuICAgIHJldHVybiBjb250ZXh0LnZpc2l0Tm9kZUZuKHRleHQsIG5vZGUpO1xuICB9XG5cbiAgdmlzaXRDb21tZW50KGNvbW1lbnQ6IGh0bWwuQ29tbWVudCwgY29udGV4dDogSTE4bk1lc3NhZ2VWaXNpdG9yQ29udGV4dCk6IGkxOG4uTm9kZXxudWxsIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZpc2l0RXhwYW5zaW9uKGljdTogaHRtbC5FeHBhbnNpb24sIGNvbnRleHQ6IEkxOG5NZXNzYWdlVmlzaXRvckNvbnRleHQpOiBpMThuLk5vZGUge1xuICAgIGNvbnRleHQuaWN1RGVwdGgrKztcbiAgICBjb25zdCBpMThuSWN1Q2FzZXM6IHtbazogc3RyaW5nXTogaTE4bi5Ob2RlfSA9IHt9O1xuICAgIGNvbnN0IGkxOG5JY3UgPSBuZXcgaTE4bi5JY3UoaWN1LnN3aXRjaFZhbHVlLCBpY3UudHlwZSwgaTE4bkljdUNhc2VzLCBpY3Uuc291cmNlU3Bhbik7XG4gICAgaWN1LmNhc2VzLmZvckVhY2goKGNhemUpOiB2b2lkID0+IHtcbiAgICAgIGkxOG5JY3VDYXNlc1tjYXplLnZhbHVlXSA9IG5ldyBpMThuLkNvbnRhaW5lcihcbiAgICAgICAgICBjYXplLmV4cHJlc3Npb24ubWFwKChub2RlKSA9PiBub2RlLnZpc2l0KHRoaXMsIGNvbnRleHQpKSwgY2F6ZS5leHBTb3VyY2VTcGFuKTtcbiAgICB9KTtcbiAgICBjb250ZXh0LmljdURlcHRoLS07XG5cbiAgICBpZiAoY29udGV4dC5pc0ljdSB8fCBjb250ZXh0LmljdURlcHRoID4gMCkge1xuICAgICAgLy8gUmV0dXJucyBhbiBJQ1Ugbm9kZSB3aGVuOlxuICAgICAgLy8gLSB0aGUgbWVzc2FnZSAodnMgYSBwYXJ0IG9mIHRoZSBtZXNzYWdlKSBpcyBhbiBJQ1UgbWVzc2FnZSwgb3JcbiAgICAgIC8vIC0gdGhlIElDVSBtZXNzYWdlIGlzIG5lc3RlZC5cbiAgICAgIGNvbnN0IGV4cFBoID0gY29udGV4dC5wbGFjZWhvbGRlclJlZ2lzdHJ5LmdldFVuaXF1ZVBsYWNlaG9sZGVyKGBWQVJfJHtpY3UudHlwZX1gKTtcbiAgICAgIGkxOG5JY3UuZXhwcmVzc2lvblBsYWNlaG9sZGVyID0gZXhwUGg7XG4gICAgICBjb250ZXh0LnBsYWNlaG9sZGVyVG9Db250ZW50W2V4cFBoXSA9IHtcbiAgICAgICAgdGV4dDogaWN1LnN3aXRjaFZhbHVlLFxuICAgICAgICBzb3VyY2VTcGFuOiBpY3Uuc3dpdGNoVmFsdWVTb3VyY2VTcGFuLFxuICAgICAgfTtcbiAgICAgIHJldHVybiBjb250ZXh0LnZpc2l0Tm9kZUZuKGljdSwgaTE4bkljdSk7XG4gICAgfVxuXG4gICAgLy8gRWxzZSByZXR1cm5zIGEgcGxhY2Vob2xkZXJcbiAgICAvLyBJQ1UgcGxhY2Vob2xkZXJzIHNob3VsZCBub3QgYmUgcmVwbGFjZWQgd2l0aCB0aGVpciBvcmlnaW5hbCBjb250ZW50IGJ1dCB3aXRoIHRoZSB0aGVpclxuICAgIC8vIHRyYW5zbGF0aW9ucy5cbiAgICAvLyBUT0RPKHZpY2IpOiBhZGQgYSBodG1sLk5vZGUgLT4gaTE4bi5NZXNzYWdlIGNhY2hlIHRvIGF2b2lkIGhhdmluZyB0byByZS1jcmVhdGUgdGhlIG1zZ1xuICAgIGNvbnN0IHBoTmFtZSA9IGNvbnRleHQucGxhY2Vob2xkZXJSZWdpc3RyeS5nZXRQbGFjZWhvbGRlck5hbWUoJ0lDVScsIGljdS5zb3VyY2VTcGFuLnRvU3RyaW5nKCkpO1xuICAgIGNvbnRleHQucGxhY2Vob2xkZXJUb01lc3NhZ2VbcGhOYW1lXSA9IHRoaXMudG9JMThuTWVzc2FnZShbaWN1XSwgJycsICcnLCAnJywgdW5kZWZpbmVkKTtcbiAgICBjb25zdCBub2RlID0gbmV3IGkxOG4uSWN1UGxhY2Vob2xkZXIoaTE4bkljdSwgcGhOYW1lLCBpY3Uuc291cmNlU3Bhbik7XG4gICAgcmV0dXJuIGNvbnRleHQudmlzaXROb2RlRm4oaWN1LCBub2RlKTtcbiAgfVxuXG4gIHZpc2l0RXhwYW5zaW9uQ2FzZShfaWN1Q2FzZTogaHRtbC5FeHBhbnNpb25DYXNlLCBfY29udGV4dDogSTE4bk1lc3NhZ2VWaXNpdG9yQ29udGV4dCk6IGkxOG4uTm9kZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbnJlYWNoYWJsZSBjb2RlJyk7XG4gIH1cblxuICB2aXNpdEJsb2NrR3JvdXAoZ3JvdXA6IGh0bWwuQmxvY2tHcm91cCwgY29udGV4dDogSTE4bk1lc3NhZ2VWaXNpdG9yQ29udGV4dCkge1xuICAgIGNvbnN0IGNoaWxkcmVuID0gaHRtbC52aXNpdEFsbCh0aGlzLCBncm91cC5ibG9ja3MsIGNvbnRleHQpO1xuICAgIGNvbnN0IG5vZGUgPSBuZXcgaTE4bi5Db250YWluZXIoY2hpbGRyZW4sIGdyb3VwLnNvdXJjZVNwYW4pO1xuICAgIHJldHVybiBjb250ZXh0LnZpc2l0Tm9kZUZuKGdyb3VwLCBub2RlKTtcbiAgfVxuXG4gIHZpc2l0QmxvY2soYmxvY2s6IGh0bWwuQmxvY2ssIGNvbnRleHQ6IEkxOG5NZXNzYWdlVmlzaXRvckNvbnRleHQpIHtcbiAgICBjb25zdCBjaGlsZHJlbiA9IGh0bWwudmlzaXRBbGwodGhpcywgYmxvY2suY2hpbGRyZW4sIGNvbnRleHQpO1xuICAgIGNvbnN0IG5vZGUgPSBuZXcgaTE4bi5Db250YWluZXIoY2hpbGRyZW4sIGJsb2NrLnNvdXJjZVNwYW4pO1xuICAgIHJldHVybiBjb250ZXh0LnZpc2l0Tm9kZUZuKGJsb2NrLCBub2RlKTtcbiAgfVxuXG4gIHZpc2l0QmxvY2tQYXJhbWV0ZXIoX3BhcmFtZXRlcjogaHRtbC5CbG9ja1BhcmFtZXRlciwgX2NvbnRleHQ6IEkxOG5NZXNzYWdlVmlzaXRvckNvbnRleHQpIHt9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQsIHRleHQgYW5kIGludGVycG9sYXRlZCB0b2tlbnMgdXAgaW50byB0ZXh0IGFuZCBwbGFjZWhvbGRlciBwaWVjZXMuXG4gICAqXG4gICAqIEBwYXJhbSB0b2tlbnMgVGhlIHRleHQgYW5kIGludGVycG9sYXRlZCB0b2tlbnMuXG4gICAqIEBwYXJhbSBzb3VyY2VTcGFuIFRoZSBzcGFuIG9mIHRoZSB3aG9sZSBvZiB0aGUgYHRleHRgIHN0cmluZy5cbiAgICogQHBhcmFtIGNvbnRleHQgVGhlIGN1cnJlbnQgY29udGV4dCBvZiB0aGUgdmlzaXRvciwgdXNlZCB0byBjb21wdXRlIGFuZCBzdG9yZSBwbGFjZWhvbGRlcnMuXG4gICAqIEBwYXJhbSBwcmV2aW91c0kxOG4gQW55IGkxOG4gbWV0YWRhdGEgYXNzb2NpYXRlZCB3aXRoIHRoaXMgYHRleHRgIGZyb20gYSBwcmV2aW91cyBwYXNzLlxuICAgKi9cbiAgcHJpdmF0ZSBfdmlzaXRUZXh0V2l0aEludGVycG9sYXRpb24oXG4gICAgICB0b2tlbnM6IChJbnRlcnBvbGF0ZWRUZXh0VG9rZW58SW50ZXJwb2xhdGVkQXR0cmlidXRlVG9rZW4pW10sIHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3BhbixcbiAgICAgIGNvbnRleHQ6IEkxOG5NZXNzYWdlVmlzaXRvckNvbnRleHQsIHByZXZpb3VzSTE4bjogaTE4bi5JMThuTWV0YXx1bmRlZmluZWQpOiBpMThuLk5vZGUge1xuICAgIC8vIFJldHVybiBhIHNlcXVlbmNlIG9mIGBUZXh0YCBhbmQgYFBsYWNlaG9sZGVyYCBub2RlcyBncm91cGVkIGluIGEgYENvbnRhaW5lcmAuXG4gICAgY29uc3Qgbm9kZXM6IGkxOG4uTm9kZVtdID0gW107XG4gICAgLy8gV2Ugd2lsbCBvbmx5IGNyZWF0ZSBhIGNvbnRhaW5lciBpZiB0aGVyZSBhcmUgYWN0dWFsbHkgaW50ZXJwb2xhdGlvbnMsXG4gICAgLy8gc28gdGhpcyBmbGFnIHRyYWNrcyB0aGF0LlxuICAgIGxldCBoYXNJbnRlcnBvbGF0aW9uID0gZmFsc2U7XG4gICAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICAgIHN3aXRjaCAodG9rZW4udHlwZSkge1xuICAgICAgICBjYXNlIFRva2VuVHlwZS5JTlRFUlBPTEFUSU9OOlxuICAgICAgICBjYXNlIFRva2VuVHlwZS5BVFRSX1ZBTFVFX0lOVEVSUE9MQVRJT046XG4gICAgICAgICAgaGFzSW50ZXJwb2xhdGlvbiA9IHRydWU7XG4gICAgICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IHRva2VuLnBhcnRzWzFdO1xuICAgICAgICAgIGNvbnN0IGJhc2VOYW1lID0gZXh0cmFjdFBsYWNlaG9sZGVyTmFtZShleHByZXNzaW9uKSB8fCAnSU5URVJQT0xBVElPTic7XG4gICAgICAgICAgY29uc3QgcGhOYW1lID0gY29udGV4dC5wbGFjZWhvbGRlclJlZ2lzdHJ5LmdldFBsYWNlaG9sZGVyTmFtZShiYXNlTmFtZSwgZXhwcmVzc2lvbik7XG4gICAgICAgICAgY29udGV4dC5wbGFjZWhvbGRlclRvQ29udGVudFtwaE5hbWVdID0ge1xuICAgICAgICAgICAgdGV4dDogdG9rZW4ucGFydHMuam9pbignJyksXG4gICAgICAgICAgICBzb3VyY2VTcGFuOiB0b2tlbi5zb3VyY2VTcGFuXG4gICAgICAgICAgfTtcbiAgICAgICAgICBub2Rlcy5wdXNoKG5ldyBpMThuLlBsYWNlaG9sZGVyKGV4cHJlc3Npb24sIHBoTmFtZSwgdG9rZW4uc291cmNlU3BhbikpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICh0b2tlbi5wYXJ0c1swXS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyBUaGlzIHRva2VuIGlzIHRleHQgb3IgYW4gZW5jb2RlZCBlbnRpdHkuXG4gICAgICAgICAgICAvLyBJZiBpdCBpcyBmb2xsb3dpbmcgb24gZnJvbSBhIHByZXZpb3VzIHRleHQgbm9kZSB0aGVuIG1lcmdlIGl0IGludG8gdGhhdCBub2RlXG4gICAgICAgICAgICAvLyBPdGhlcndpc2UsIGlmIGl0IGlzIGZvbGxvd2luZyBhbiBpbnRlcnBvbGF0aW9uLCB0aGVuIGFkZCBhIG5ldyBub2RlLlxuICAgICAgICAgICAgY29uc3QgcHJldmlvdXMgPSBub2Rlc1tub2Rlcy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmIChwcmV2aW91cyBpbnN0YW5jZW9mIGkxOG4uVGV4dCkge1xuICAgICAgICAgICAgICBwcmV2aW91cy52YWx1ZSArPSB0b2tlbi5wYXJ0c1swXTtcbiAgICAgICAgICAgICAgcHJldmlvdXMuc291cmNlU3BhbiA9IG5ldyBQYXJzZVNvdXJjZVNwYW4oXG4gICAgICAgICAgICAgICAgICBwcmV2aW91cy5zb3VyY2VTcGFuLnN0YXJ0LCB0b2tlbi5zb3VyY2VTcGFuLmVuZCwgcHJldmlvdXMuc291cmNlU3Bhbi5mdWxsU3RhcnQsXG4gICAgICAgICAgICAgICAgICBwcmV2aW91cy5zb3VyY2VTcGFuLmRldGFpbHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbm9kZXMucHVzaChuZXcgaTE4bi5UZXh0KHRva2VuLnBhcnRzWzBdLCB0b2tlbi5zb3VyY2VTcGFuKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChoYXNJbnRlcnBvbGF0aW9uKSB7XG4gICAgICAvLyBXaGl0ZXNwYWNlIHJlbW92YWwgbWF5IGhhdmUgaW52YWxpZGF0ZWQgdGhlIGludGVycG9sYXRpb24gc291cmNlLXNwYW5zLlxuICAgICAgcmV1c2VQcmV2aW91c1NvdXJjZVNwYW5zKG5vZGVzLCBwcmV2aW91c0kxOG4pO1xuICAgICAgcmV0dXJuIG5ldyBpMThuLkNvbnRhaW5lcihub2Rlcywgc291cmNlU3Bhbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBub2Rlc1swXTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZS11c2UgdGhlIHNvdXJjZS1zcGFucyBmcm9tIGBwcmV2aW91c0kxOG5gIG1ldGFkYXRhIGZvciB0aGUgYG5vZGVzYC5cbiAqXG4gKiBXaGl0ZXNwYWNlIHJlbW92YWwgY2FuIGludmFsaWRhdGUgdGhlIHNvdXJjZS1zcGFucyBvZiBpbnRlcnBvbGF0aW9uIG5vZGVzLCBzbyB3ZVxuICogcmV1c2UgdGhlIHNvdXJjZS1zcGFuIHN0b3JlZCBmcm9tIGEgcHJldmlvdXMgcGFzcyBiZWZvcmUgdGhlIHdoaXRlc3BhY2Ugd2FzIHJlbW92ZWQuXG4gKlxuICogQHBhcmFtIG5vZGVzIFRoZSBgVGV4dGAgYW5kIGBQbGFjZWhvbGRlcmAgbm9kZXMgdG8gYmUgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHByZXZpb3VzSTE4biBBbnkgaTE4biBtZXRhZGF0YSBmb3IgdGhlc2UgYG5vZGVzYCBzdG9yZWQgZnJvbSBhIHByZXZpb3VzIHBhc3MuXG4gKi9cbmZ1bmN0aW9uIHJldXNlUHJldmlvdXNTb3VyY2VTcGFucyhub2RlczogaTE4bi5Ob2RlW10sIHByZXZpb3VzSTE4bjogaTE4bi5JMThuTWV0YXx1bmRlZmluZWQpOiB2b2lkIHtcbiAgaWYgKHByZXZpb3VzSTE4biBpbnN0YW5jZW9mIGkxOG4uTWVzc2FnZSkge1xuICAgIC8vIFRoZSBgcHJldmlvdXNJMThuYCBpcyBhbiBpMThuIGBNZXNzYWdlYCwgc28gd2UgYXJlIHByb2Nlc3NpbmcgYW4gYEF0dHJpYnV0ZWAgd2l0aCBpMThuXG4gICAgLy8gbWV0YWRhdGEuIFRoZSBgTWVzc2FnZWAgc2hvdWxkIGNvbnNpc3Qgb25seSBvZiBhIHNpbmdsZSBgQ29udGFpbmVyYCB0aGF0IGNvbnRhaW5zIHRoZVxuICAgIC8vIHBhcnRzIChgVGV4dGAgYW5kIGBQbGFjZWhvbGRlcmApIHRvIHByb2Nlc3MuXG4gICAgYXNzZXJ0U2luZ2xlQ29udGFpbmVyTWVzc2FnZShwcmV2aW91c0kxOG4pO1xuICAgIHByZXZpb3VzSTE4biA9IHByZXZpb3VzSTE4bi5ub2Rlc1swXTtcbiAgfVxuXG4gIGlmIChwcmV2aW91c0kxOG4gaW5zdGFuY2VvZiBpMThuLkNvbnRhaW5lcikge1xuICAgIC8vIFRoZSBgcHJldmlvdXNJMThuYCBpcyBhIGBDb250YWluZXJgLCB3aGljaCBtZWFucyB0aGF0IHRoaXMgaXMgYSBzZWNvbmQgaTE4biBleHRyYWN0aW9uIHBhc3NcbiAgICAvLyBhZnRlciB3aGl0ZXNwYWNlIGhhcyBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgQVNUIG5vZGVzLlxuICAgIGFzc2VydEVxdWl2YWxlbnROb2RlcyhwcmV2aW91c0kxOG4uY2hpbGRyZW4sIG5vZGVzKTtcblxuICAgIC8vIFJldXNlIHRoZSBzb3VyY2Utc3BhbnMgZnJvbSB0aGUgZmlyc3QgcGFzcy5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBub2Rlc1tpXS5zb3VyY2VTcGFuID0gcHJldmlvdXNJMThuLmNoaWxkcmVuW2ldLnNvdXJjZVNwYW47XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQXNzZXJ0cyB0aGF0IHRoZSBgbWVzc2FnZWAgY29udGFpbnMgZXhhY3RseSBvbmUgYENvbnRhaW5lcmAgbm9kZS5cbiAqL1xuZnVuY3Rpb24gYXNzZXJ0U2luZ2xlQ29udGFpbmVyTWVzc2FnZShtZXNzYWdlOiBpMThuLk1lc3NhZ2UpOiB2b2lkIHtcbiAgY29uc3Qgbm9kZXMgPSBtZXNzYWdlLm5vZGVzO1xuICBpZiAobm9kZXMubGVuZ3RoICE9PSAxIHx8ICEobm9kZXNbMF0gaW5zdGFuY2VvZiBpMThuLkNvbnRhaW5lcikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdVbmV4cGVjdGVkIHByZXZpb3VzIGkxOG4gbWVzc2FnZSAtIGV4cGVjdGVkIGl0IHRvIGNvbnNpc3Qgb2Ygb25seSBhIHNpbmdsZSBgQ29udGFpbmVyYCBub2RlLicpO1xuICB9XG59XG5cbi8qKlxuICogQXNzZXJ0cyB0aGF0IHRoZSBgcHJldmlvdXNOb2Rlc2AgYW5kIGBub2RlYCBjb2xsZWN0aW9ucyBoYXZlIHRoZSBzYW1lIG51bWJlciBvZiBlbGVtZW50cyBhbmRcbiAqIGNvcnJlc3BvbmRpbmcgZWxlbWVudHMgaGF2ZSB0aGUgc2FtZSBub2RlIHR5cGUuXG4gKi9cbmZ1bmN0aW9uIGFzc2VydEVxdWl2YWxlbnROb2RlcyhwcmV2aW91c05vZGVzOiBpMThuLk5vZGVbXSwgbm9kZXM6IGkxOG4uTm9kZVtdKTogdm9pZCB7XG4gIGlmIChwcmV2aW91c05vZGVzLmxlbmd0aCAhPT0gbm9kZXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgbnVtYmVyIG9mIGkxOG4gbWVzc2FnZSBjaGlsZHJlbiBjaGFuZ2VkIGJldHdlZW4gZmlyc3QgYW5kIHNlY29uZCBwYXNzLicpO1xuICB9XG4gIGlmIChwcmV2aW91c05vZGVzLnNvbWUoKG5vZGUsIGkpID0+IG5vZGVzW2ldLmNvbnN0cnVjdG9yICE9PSBub2RlLmNvbnN0cnVjdG9yKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ1RoZSB0eXBlcyBvZiB0aGUgaTE4biBtZXNzYWdlIGNoaWxkcmVuIGNoYW5nZWQgYmV0d2VlbiBmaXJzdCBhbmQgc2Vjb25kIHBhc3MuJyk7XG4gIH1cbn1cblxuY29uc3QgX0NVU1RPTV9QSF9FWFAgPVxuICAgIC9cXC9cXC9bXFxzXFxTXSppMThuW1xcc1xcU10qXFwoW1xcc1xcU10qcGhbXFxzXFxTXSo9W1xcc1xcU10qKFwifCcpKFtcXHNcXFNdKj8pXFwxW1xcc1xcU10qXFwpL2c7XG5cbmZ1bmN0aW9uIGV4dHJhY3RQbGFjZWhvbGRlck5hbWUoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5zcGxpdChfQ1VTVE9NX1BIX0VYUClbMl07XG59XG4iXX0=