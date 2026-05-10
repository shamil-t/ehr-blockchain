/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as html from '../ml_parser/ast';
import { ParseTreeResult } from '../ml_parser/parser';
import * as i18n from './i18n_ast';
import { createI18nMessageFactory } from './i18n_parser';
import { I18nError } from './parse_util';
const _I18N_ATTR = 'i18n';
const _I18N_ATTR_PREFIX = 'i18n-';
const _I18N_COMMENT_PREFIX_REGEXP = /^i18n:?/;
const MEANING_SEPARATOR = '|';
const ID_SEPARATOR = '@@';
let i18nCommentsWarned = false;
/**
 * Extract translatable messages from an html AST
 */
export function extractMessages(nodes, interpolationConfig, implicitTags, implicitAttrs) {
    const visitor = new _Visitor(implicitTags, implicitAttrs);
    return visitor.extract(nodes, interpolationConfig);
}
export function mergeTranslations(nodes, translations, interpolationConfig, implicitTags, implicitAttrs) {
    const visitor = new _Visitor(implicitTags, implicitAttrs);
    return visitor.merge(nodes, translations, interpolationConfig);
}
export class ExtractionResult {
    constructor(messages, errors) {
        this.messages = messages;
        this.errors = errors;
    }
}
var _VisitorMode;
(function (_VisitorMode) {
    _VisitorMode[_VisitorMode["Extract"] = 0] = "Extract";
    _VisitorMode[_VisitorMode["Merge"] = 1] = "Merge";
})(_VisitorMode || (_VisitorMode = {}));
/**
 * This Visitor is used:
 * 1. to extract all the translatable strings from an html AST (see `extract()`),
 * 2. to replace the translatable strings with the actual translations (see `merge()`)
 *
 * @internal
 */
class _Visitor {
    constructor(_implicitTags, _implicitAttrs) {
        this._implicitTags = _implicitTags;
        this._implicitAttrs = _implicitAttrs;
    }
    /**
     * Extracts the messages from the tree
     */
    extract(nodes, interpolationConfig) {
        this._init(_VisitorMode.Extract, interpolationConfig);
        nodes.forEach(node => node.visit(this, null));
        if (this._inI18nBlock) {
            this._reportError(nodes[nodes.length - 1], 'Unclosed block');
        }
        return new ExtractionResult(this._messages, this._errors);
    }
    /**
     * Returns a tree where all translatable nodes are translated
     */
    merge(nodes, translations, interpolationConfig) {
        this._init(_VisitorMode.Merge, interpolationConfig);
        this._translations = translations;
        // Construct a single fake root element
        const wrapper = new html.Element('wrapper', [], nodes, undefined, undefined, undefined);
        const translatedNode = wrapper.visit(this, null);
        if (this._inI18nBlock) {
            this._reportError(nodes[nodes.length - 1], 'Unclosed block');
        }
        return new ParseTreeResult(translatedNode.children, this._errors);
    }
    visitExpansionCase(icuCase, context) {
        // Parse cases for translatable html attributes
        const expression = html.visitAll(this, icuCase.expression, context);
        if (this._mode === _VisitorMode.Merge) {
            return new html.ExpansionCase(icuCase.value, expression, icuCase.sourceSpan, icuCase.valueSourceSpan, icuCase.expSourceSpan);
        }
    }
    visitExpansion(icu, context) {
        this._mayBeAddBlockChildren(icu);
        const wasInIcu = this._inIcu;
        if (!this._inIcu) {
            // nested ICU messages should not be extracted but top-level translated as a whole
            if (this._isInTranslatableSection) {
                this._addMessage([icu]);
            }
            this._inIcu = true;
        }
        const cases = html.visitAll(this, icu.cases, context);
        if (this._mode === _VisitorMode.Merge) {
            icu = new html.Expansion(icu.switchValue, icu.type, cases, icu.sourceSpan, icu.switchValueSourceSpan);
        }
        this._inIcu = wasInIcu;
        return icu;
    }
    visitComment(comment, context) {
        const isOpening = _isOpeningComment(comment);
        if (isOpening && this._isInTranslatableSection) {
            this._reportError(comment, 'Could not start a block inside a translatable section');
            return;
        }
        const isClosing = _isClosingComment(comment);
        if (isClosing && !this._inI18nBlock) {
            this._reportError(comment, 'Trying to close an unopened block');
            return;
        }
        if (!this._inI18nNode && !this._inIcu) {
            if (!this._inI18nBlock) {
                if (isOpening) {
                    // deprecated from v5 you should use <ng-container i18n> instead of i18n comments
                    if (!i18nCommentsWarned && console && console.warn) {
                        i18nCommentsWarned = true;
                        const details = comment.sourceSpan.details ? `, ${comment.sourceSpan.details}` : '';
                        // TODO(ocombe): use a log service once there is a public one available
                        console.warn(`I18n comments are deprecated, use an <ng-container> element instead (${comment.sourceSpan.start}${details})`);
                    }
                    this._inI18nBlock = true;
                    this._blockStartDepth = this._depth;
                    this._blockChildren = [];
                    this._blockMeaningAndDesc =
                        comment.value.replace(_I18N_COMMENT_PREFIX_REGEXP, '').trim();
                    this._openTranslatableSection(comment);
                }
            }
            else {
                if (isClosing) {
                    if (this._depth == this._blockStartDepth) {
                        this._closeTranslatableSection(comment, this._blockChildren);
                        this._inI18nBlock = false;
                        const message = this._addMessage(this._blockChildren, this._blockMeaningAndDesc);
                        // merge attributes in sections
                        const nodes = this._translateMessage(comment, message);
                        return html.visitAll(this, nodes);
                    }
                    else {
                        this._reportError(comment, 'I18N blocks should not cross element boundaries');
                        return;
                    }
                }
            }
        }
    }
    visitText(text, context) {
        if (this._isInTranslatableSection) {
            this._mayBeAddBlockChildren(text);
        }
        return text;
    }
    visitElement(el, context) {
        this._mayBeAddBlockChildren(el);
        this._depth++;
        const wasInI18nNode = this._inI18nNode;
        const wasInImplicitNode = this._inImplicitNode;
        let childNodes = [];
        let translatedChildNodes = undefined;
        // Extract:
        // - top level nodes with the (implicit) "i18n" attribute if not already in a section
        // - ICU messages
        const i18nAttr = _getI18nAttr(el);
        const i18nMeta = i18nAttr ? i18nAttr.value : '';
        const isImplicit = this._implicitTags.some(tag => el.name === tag) && !this._inIcu &&
            !this._isInTranslatableSection;
        const isTopLevelImplicit = !wasInImplicitNode && isImplicit;
        this._inImplicitNode = wasInImplicitNode || isImplicit;
        if (!this._isInTranslatableSection && !this._inIcu) {
            if (i18nAttr || isTopLevelImplicit) {
                this._inI18nNode = true;
                const message = this._addMessage(el.children, i18nMeta);
                translatedChildNodes = this._translateMessage(el, message);
            }
            if (this._mode == _VisitorMode.Extract) {
                const isTranslatable = i18nAttr || isTopLevelImplicit;
                if (isTranslatable)
                    this._openTranslatableSection(el);
                html.visitAll(this, el.children);
                if (isTranslatable)
                    this._closeTranslatableSection(el, el.children);
            }
        }
        else {
            if (i18nAttr || isTopLevelImplicit) {
                this._reportError(el, 'Could not mark an element as translatable inside a translatable section');
            }
            if (this._mode == _VisitorMode.Extract) {
                // Descend into child nodes for extraction
                html.visitAll(this, el.children);
            }
        }
        if (this._mode === _VisitorMode.Merge) {
            const visitNodes = translatedChildNodes || el.children;
            visitNodes.forEach(child => {
                const visited = child.visit(this, context);
                if (visited && !this._isInTranslatableSection) {
                    // Do not add the children from translatable sections (= i18n blocks here)
                    // They will be added later in this loop when the block closes (i.e. on `<!-- /i18n -->`)
                    childNodes = childNodes.concat(visited);
                }
            });
        }
        this._visitAttributesOf(el);
        this._depth--;
        this._inI18nNode = wasInI18nNode;
        this._inImplicitNode = wasInImplicitNode;
        if (this._mode === _VisitorMode.Merge) {
            const translatedAttrs = this._translateAttributes(el);
            return new html.Element(el.name, translatedAttrs, childNodes, el.sourceSpan, el.startSourceSpan, el.endSourceSpan);
        }
        return null;
    }
    visitAttribute(attribute, context) {
        throw new Error('unreachable code');
    }
    visitBlockGroup(group, context) {
        html.visitAll(this, group.blocks, context);
    }
    visitBlock(block, context) {
        html.visitAll(this, block.children, context);
    }
    visitBlockParameter(parameter, context) { }
    _init(mode, interpolationConfig) {
        this._mode = mode;
        this._inI18nBlock = false;
        this._inI18nNode = false;
        this._depth = 0;
        this._inIcu = false;
        this._msgCountAtSectionStart = undefined;
        this._errors = [];
        this._messages = [];
        this._inImplicitNode = false;
        this._createI18nMessage = createI18nMessageFactory(interpolationConfig);
    }
    // looks for translatable attributes
    _visitAttributesOf(el) {
        const explicitAttrNameToValue = {};
        const implicitAttrNames = this._implicitAttrs[el.name] || [];
        el.attrs.filter(attr => attr.name.startsWith(_I18N_ATTR_PREFIX))
            .forEach(attr => explicitAttrNameToValue[attr.name.slice(_I18N_ATTR_PREFIX.length)] =
            attr.value);
        el.attrs.forEach(attr => {
            if (attr.name in explicitAttrNameToValue) {
                this._addMessage([attr], explicitAttrNameToValue[attr.name]);
            }
            else if (implicitAttrNames.some(name => attr.name === name)) {
                this._addMessage([attr]);
            }
        });
    }
    // add a translatable message
    _addMessage(ast, msgMeta) {
        if (ast.length == 0 ||
            ast.length == 1 && ast[0] instanceof html.Attribute && !ast[0].value) {
            // Do not create empty messages
            return null;
        }
        const { meaning, description, id } = _parseMessageMeta(msgMeta);
        const message = this._createI18nMessage(ast, meaning, description, id);
        this._messages.push(message);
        return message;
    }
    // Translates the given message given the `TranslationBundle`
    // This is used for translating elements / blocks - see `_translateAttributes` for attributes
    // no-op when called in extraction mode (returns [])
    _translateMessage(el, message) {
        if (message && this._mode === _VisitorMode.Merge) {
            const nodes = this._translations.get(message);
            if (nodes) {
                return nodes;
            }
            this._reportError(el, `Translation unavailable for message id="${this._translations.digest(message)}"`);
        }
        return [];
    }
    // translate the attributes of an element and remove i18n specific attributes
    _translateAttributes(el) {
        const attributes = el.attrs;
        const i18nParsedMessageMeta = {};
        attributes.forEach(attr => {
            if (attr.name.startsWith(_I18N_ATTR_PREFIX)) {
                i18nParsedMessageMeta[attr.name.slice(_I18N_ATTR_PREFIX.length)] =
                    _parseMessageMeta(attr.value);
            }
        });
        const translatedAttributes = [];
        attributes.forEach((attr) => {
            if (attr.name === _I18N_ATTR || attr.name.startsWith(_I18N_ATTR_PREFIX)) {
                // strip i18n specific attributes
                return;
            }
            if (attr.value && attr.value != '' && i18nParsedMessageMeta.hasOwnProperty(attr.name)) {
                const { meaning, description, id } = i18nParsedMessageMeta[attr.name];
                const message = this._createI18nMessage([attr], meaning, description, id);
                const nodes = this._translations.get(message);
                if (nodes) {
                    if (nodes.length == 0) {
                        translatedAttributes.push(new html.Attribute(attr.name, '', attr.sourceSpan, undefined /* keySpan */, undefined /* valueSpan */, undefined /* valueTokens */, undefined /* i18n */));
                    }
                    else if (nodes[0] instanceof html.Text) {
                        const value = nodes[0].value;
                        translatedAttributes.push(new html.Attribute(attr.name, value, attr.sourceSpan, undefined /* keySpan */, undefined /* valueSpan */, undefined /* valueTokens */, undefined /* i18n */));
                    }
                    else {
                        this._reportError(el, `Unexpected translation for attribute "${attr.name}" (id="${id || this._translations.digest(message)}")`);
                    }
                }
                else {
                    this._reportError(el, `Translation unavailable for attribute "${attr.name}" (id="${id || this._translations.digest(message)}")`);
                }
            }
            else {
                translatedAttributes.push(attr);
            }
        });
        return translatedAttributes;
    }
    /**
     * Add the node as a child of the block when:
     * - we are in a block,
     * - we are not inside a ICU message (those are handled separately),
     * - the node is a "direct child" of the block
     */
    _mayBeAddBlockChildren(node) {
        if (this._inI18nBlock && !this._inIcu && this._depth == this._blockStartDepth) {
            this._blockChildren.push(node);
        }
    }
    /**
     * Marks the start of a section, see `_closeTranslatableSection`
     */
    _openTranslatableSection(node) {
        if (this._isInTranslatableSection) {
            this._reportError(node, 'Unexpected section start');
        }
        else {
            this._msgCountAtSectionStart = this._messages.length;
        }
    }
    /**
     * A translatable section could be:
     * - the content of translatable element,
     * - nodes between `<!-- i18n -->` and `<!-- /i18n -->` comments
     */
    get _isInTranslatableSection() {
        return this._msgCountAtSectionStart !== void 0;
    }
    /**
     * Terminates a section.
     *
     * If a section has only one significant children (comments not significant) then we should not
     * keep the message from this children:
     *
     * `<p i18n="meaning|description">{ICU message}</p>` would produce two messages:
     * - one for the <p> content with meaning and description,
     * - another one for the ICU message.
     *
     * In this case the last message is discarded as it contains less information (the AST is
     * otherwise identical).
     *
     * Note that we should still keep messages extracted from attributes inside the section (ie in the
     * ICU message here)
     */
    _closeTranslatableSection(node, directChildren) {
        if (!this._isInTranslatableSection) {
            this._reportError(node, 'Unexpected section end');
            return;
        }
        const startIndex = this._msgCountAtSectionStart;
        const significantChildren = directChildren.reduce((count, node) => count + (node instanceof html.Comment ? 0 : 1), 0);
        if (significantChildren == 1) {
            for (let i = this._messages.length - 1; i >= startIndex; i--) {
                const ast = this._messages[i].nodes;
                if (!(ast.length == 1 && ast[0] instanceof i18n.Text)) {
                    this._messages.splice(i, 1);
                    break;
                }
            }
        }
        this._msgCountAtSectionStart = undefined;
    }
    _reportError(node, msg) {
        this._errors.push(new I18nError(node.sourceSpan, msg));
    }
}
function _isOpeningComment(n) {
    return !!(n instanceof html.Comment && n.value && n.value.startsWith('i18n'));
}
function _isClosingComment(n) {
    return !!(n instanceof html.Comment && n.value && n.value === '/i18n');
}
function _getI18nAttr(p) {
    return p.attrs.find(attr => attr.name === _I18N_ATTR) || null;
}
function _parseMessageMeta(i18n) {
    if (!i18n)
        return { meaning: '', description: '', id: '' };
    const idIndex = i18n.indexOf(ID_SEPARATOR);
    const descIndex = i18n.indexOf(MEANING_SEPARATOR);
    const [meaningAndDesc, id] = (idIndex > -1) ? [i18n.slice(0, idIndex), i18n.slice(idIndex + 2)] : [i18n, ''];
    const [meaning, description] = (descIndex > -1) ?
        [meaningAndDesc.slice(0, descIndex), meaningAndDesc.slice(descIndex + 1)] :
        ['', meaningAndDesc];
    return { meaning, description, id: id.trim() };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cmFjdG9yX21lcmdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9pMThuL2V4dHJhY3Rvcl9tZXJnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxLQUFLLElBQUksTUFBTSxrQkFBa0IsQ0FBQztBQUV6QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFcEQsT0FBTyxLQUFLLElBQUksTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFDLHdCQUF3QixFQUFxQixNQUFNLGVBQWUsQ0FBQztBQUMzRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBR3ZDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQztBQUMxQixNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQztBQUNsQyxNQUFNLDJCQUEyQixHQUFHLFNBQVMsQ0FBQztBQUM5QyxNQUFNLGlCQUFpQixHQUFHLEdBQUcsQ0FBQztBQUM5QixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDMUIsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7QUFFL0I7O0dBRUc7QUFDSCxNQUFNLFVBQVUsZUFBZSxDQUMzQixLQUFrQixFQUFFLG1CQUF3QyxFQUFFLFlBQXNCLEVBQ3BGLGFBQXNDO0lBQ3hDLE1BQU0sT0FBTyxHQUFHLElBQUksUUFBUSxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztJQUMxRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDLENBQUM7QUFDckQsQ0FBQztBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FDN0IsS0FBa0IsRUFBRSxZQUErQixFQUFFLG1CQUF3QyxFQUM3RixZQUFzQixFQUFFLGFBQXNDO0lBQ2hFLE1BQU0sT0FBTyxHQUFHLElBQUksUUFBUSxDQUFDLFlB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Z2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGh0bWwgZnJvbSAnLi4vbWxfcGFyc2VyL2FzdCc7XG5pbXBvcnQge0ludGVycG9sYXRpb25Db25maWd9IGZyb20gJy4uL21sX3BhcnNlci9pbnRlcnBvbGF0aW9uX2NvbmZpZyc7XG5pbXBvcnQge1BhcnNlVHJlZVJlc3VsdH0gZnJvbSAnLi4vbWxfcGFyc2VyL3BhcnNlcic7XG5cbmltcG9ydCAqIGFzIGkxOG4gZnJvbSAnLi9pMThuX2FzdCc7XG5pbXBvcnQge2NyZWF0ZUkxOG5NZXNzYWdlRmFjdG9yeSwgSTE4bk1lc3NhZ2VGYWN0b3J5fSBmcm9tICcuL2kxOG5fcGFyc2VyJztcbmltcG9ydCB7STE4bkVycm9yfSBmcm9tICcuL3BhcnNlX3V0aWwnO1xuaW1wb3J0IHtUcmFuc2xhdGlvbkJ1bmRsZX0gZnJvbSAnLi90cmFuc2xhdGlvbl9idW5kbGUnO1xuXG5jb25zdCBfSTE4Tl9BVFRSID0gJ2kxOG4nO1xuY29uc3QgX0kxOE5fQVRUUl9QUkVGSVggPSAnaTE4bi0nO1xuY29uc3QgX0kxOE5fQ09NTUVOVF9QUkVGSVhfUkVHRVhQID0gL15pMThuOj8vO1xuY29uc3QgTUVBTklOR19TRVBBUkFUT1IgPSAnfCc7XG5jb25zdCBJRF9TRVBBUkFUT1IgPSAnQEAnO1xubGV0IGkxOG5Db21tZW50c1dhcm5lZCA9IGZhbHNlO1xuXG4vKipcbiAqIEV4dHJhY3QgdHJhbnNsYXRhYmxlIG1lc3NhZ2VzIGZyb20gYW4gaHRtbCBBU1RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RNZXNzYWdlcyhcbiAgICBub2RlczogaHRtbC5Ob2RlW10sIGludGVycG9sYXRpb25Db25maWc6IEludGVycG9sYXRpb25Db25maWcsIGltcGxpY2l0VGFnczogc3RyaW5nW10sXG4gICAgaW1wbGljaXRBdHRyczoge1trOiBzdHJpbmddOiBzdHJpbmdbXX0pOiBFeHRyYWN0aW9uUmVzdWx0IHtcbiAgY29uc3QgdmlzaXRvciA9IG5ldyBfVmlzaXRvcihpbXBsaWNpdFRhZ3MsIGltcGxpY2l0QXR0cnMpO1xuICByZXR1cm4gdmlzaXRvci5leHRyYWN0KG5vZGVzLCBpbnRlcnBvbGF0aW9uQ29uZmlnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlVHJhbnNsYXRpb25zKFxuICAgIG5vZGVzOiBodG1sLk5vZGVbXSwgdHJhbnNsYXRpb25zOiBUcmFuc2xhdGlvbkJ1bmRsZSwgaW50ZXJwb2xhdGlvbkNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZyxcbiAgICBpbXBsaWNpdFRhZ3M6IHN0cmluZ1tdLCBpbXBsaWNpdEF0dHJzOiB7W2s6IHN0cmluZ106IHN0cmluZ1tdfSk6IFBhcnNlVHJlZVJlc3VsdCB7XG4gIGNvbnN0IHZpc2l0b3IgPSBuZXcgX1Zpc2l0b3IoaW1wbGljaXRUYWdzLCBpbXBsaWNpdEF0dHJzKTtcbiAgcmV0dXJuIHZpc2l0b3IubWVyZ2Uobm9kZXMsIHRyYW5zbGF0aW9ucywgaW50ZXJwb2xhdGlvbkNvbmZpZyk7XG59XG5cbmV4cG9ydCBjbGFzcyBFeHRyYWN0aW9uUmVzdWx0IHtcbiAgY29uc3RydWN0b3IocHVibGljIG1lc3NhZ2VzOiBpMThuLk1lc3NhZ2VbXSwgcHVibGljIGVycm9yczogSTE4bkVycm9yW10pIHt9XG59XG5cbmVudW0gX1Zpc2l0b3JNb2RlIHtcbiAgRXh0cmFjdCxcbiAgTWVyZ2Vcbn1cblxuLyoqXG4gKiBUaGlzIFZpc2l0b3IgaXMgdXNlZDpcbiAqIDEuIHRvIGV4dHJhY3QgYWxsIHRoZSB0cmFuc2xhdGFibGUgc3RyaW5ncyBmcm9tIGFuIGh0bWwgQVNUIChzZWUgYGV4dHJhY3QoKWApLFxuICogMi4gdG8gcmVwbGFjZSB0aGUgdHJhbnNsYXRhYmxlIHN0cmluZ3Mgd2l0aCB0aGUgYWN0dWFsIHRyYW5zbGF0aW9ucyAoc2VlIGBtZXJnZSgpYClcbiAqXG4gKiBAaW50ZXJuYWxcbiAqL1xuY2xhc3MgX1Zpc2l0b3IgaW1wbGVtZW50cyBodG1sLlZpc2l0b3Ige1xuICAvLyBVc2luZyBub24tbnVsbCBhc3NlcnRpb25zIGJlY2F1c2UgYWxsIHZhcmlhYmxlcyBhcmUgKHJlKXNldCBpbiBpbml0KClcblxuICBwcml2YXRlIF9kZXB0aCE6IG51bWJlcjtcblxuICAvLyA8ZWwgaTE4bj4uLi48L2VsPlxuICBwcml2YXRlIF9pbkkxOG5Ob2RlITogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfaW5JbXBsaWNpdE5vZGUhOiBib29sZWFuO1xuXG4gIC8vIDwhLS1pMThuLS0+Li4uPCEtLS9pMThuLS0+XG4gIHByaXZhdGUgX2luSTE4bkJsb2NrITogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfYmxvY2tNZWFuaW5nQW5kRGVzYyE6IHN0cmluZztcbiAgcHJpdmF0ZSBfYmxvY2tDaGlsZHJlbiE6IGh0bWwuTm9kZVtdO1xuICBwcml2YXRlIF9ibG9ja1N0YXJ0RGVwdGghOiBudW1iZXI7XG5cbiAgLy8gezxpY3UgbWVzc2FnZT59XG4gIHByaXZhdGUgX2luSWN1ITogYm9vbGVhbjtcblxuICAvLyBzZXQgdG8gdm9pZCAwIHdoZW4gbm90IGluIGEgc2VjdGlvblxuICBwcml2YXRlIF9tc2dDb3VudEF0U2VjdGlvblN0YXJ0OiBudW1iZXJ8dW5kZWZpbmVkO1xuICBwcml2YXRlIF9lcnJvcnMhOiBJMThuRXJyb3JbXTtcbiAgcHJpdmF0ZSBfbW9kZSE6IF9WaXNpdG9yTW9kZTtcblxuICAvLyBfVmlzaXRvck1vZGUuRXh0cmFjdCBvbmx5XG4gIHByaXZhdGUgX21lc3NhZ2VzITogaTE4bi5NZXNzYWdlW107XG5cbiAgLy8gX1Zpc2l0b3JNb2RlLk1lcmdlIG9ubHlcbiAgcHJpdmF0ZSBfdHJhbnNsYXRpb25zITogVHJhbnNsYXRpb25CdW5kbGU7XG4gIHByaXZhdGUgX2NyZWF0ZUkxOG5NZXNzYWdlITogSTE4bk1lc3NhZ2VGYWN0b3J5O1xuXG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfaW1wbGljaXRUYWdzOiBzdHJpbmdbXSwgcHJpdmF0ZSBfaW1wbGljaXRBdHRyczoge1trOiBzdHJpbmddOiBzdHJpbmdbXX0pIHt9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3RzIHRoZSBtZXNzYWdlcyBmcm9tIHRoZSB0cmVlXG4gICAqL1xuICBleHRyYWN0KG5vZGVzOiBodG1sLk5vZGVbXSwgaW50ZXJwb2xhdGlvbkNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZyk6IEV4dHJhY3Rpb25SZXN1bHQge1xuICAgIHRoaXMuX2luaXQoX1Zpc2l0b3JNb2RlLkV4dHJhY3QsIGludGVycG9sYXRpb25Db25maWcpO1xuXG4gICAgbm9kZXMuZm9yRWFjaChub2RlID0+IG5vZGUudmlzaXQodGhpcywgbnVsbCkpO1xuXG4gICAgaWYgKHRoaXMuX2luSTE4bkJsb2NrKSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihub2Rlc1tub2Rlcy5sZW5ndGggLSAxXSwgJ1VuY2xvc2VkIGJsb2NrJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBFeHRyYWN0aW9uUmVzdWx0KHRoaXMuX21lc3NhZ2VzLCB0aGlzLl9lcnJvcnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB0cmVlIHdoZXJlIGFsbCB0cmFuc2xhdGFibGUgbm9kZXMgYXJlIHRyYW5zbGF0ZWRcbiAgICovXG4gIG1lcmdlKFxuICAgICAgbm9kZXM6IGh0bWwuTm9kZVtdLCB0cmFuc2xhdGlvbnM6IFRyYW5zbGF0aW9uQnVuZGxlLFxuICAgICAgaW50ZXJwb2xhdGlvbkNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZyk6IFBhcnNlVHJlZVJlc3VsdCB7XG4gICAgdGhpcy5faW5pdChfVmlzaXRvck1vZGUuTWVyZ2UsIGludGVycG9sYXRpb25Db25maWcpO1xuICAgIHRoaXMuX3RyYW5zbGF0aW9ucyA9IHRyYW5zbGF0aW9ucztcblxuICAgIC8vIENvbnN0cnVjdCBhIHNpbmdsZSBmYWtlIHJvb3QgZWxlbWVudFxuICAgIGNvbnN0IHdyYXBwZXIgPSBuZXcgaHRtbC5FbGVtZW50KCd3cmFwcGVyJywgW10sIG5vZGVzLCB1bmRlZmluZWQhLCB1bmRlZmluZWQhLCB1bmRlZmluZWQpO1xuXG4gICAgY29uc3QgdHJhbnNsYXRlZE5vZGUgPSB3cmFwcGVyLnZpc2l0KHRoaXMsIG51bGwpO1xuXG4gICAgaWYgKHRoaXMuX2luSTE4bkJsb2NrKSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihub2Rlc1tub2Rlcy5sZW5ndGggLSAxXSwgJ1VuY2xvc2VkIGJsb2NrJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQYXJzZVRyZWVSZXN1bHQodHJhbnNsYXRlZE5vZGUuY2hpbGRyZW4sIHRoaXMuX2Vycm9ycyk7XG4gIH1cblxuICB2aXNpdEV4cGFuc2lvbkNhc2UoaWN1Q2FzZTogaHRtbC5FeHBhbnNpb25DYXNlLCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIC8vIFBhcnNlIGNhc2VzIGZvciB0cmFuc2xhdGFibGUgaHRtbCBhdHRyaWJ1dGVzXG4gICAgY29uc3QgZXhwcmVzc2lvbiA9IGh0bWwudmlzaXRBbGwodGhpcywgaWN1Q2FzZS5leHByZXNzaW9uLCBjb250ZXh0KTtcblxuICAgIGlmICh0aGlzLl9tb2RlID09PSBfVmlzaXRvck1vZGUuTWVyZ2UpIHtcbiAgICAgIHJldHVybiBuZXcgaHRtbC5FeHBhbnNpb25DYXNlKFxuICAgICAgICAgIGljdUNhc2UudmFsdWUsIGV4cHJlc3Npb24sIGljdUNhc2Uuc291cmNlU3BhbiwgaWN1Q2FzZS52YWx1ZVNvdXJjZVNwYW4sXG4gICAgICAgICAgaWN1Q2FzZS5leHBTb3VyY2VTcGFuKTtcbiAgICB9XG4gIH1cblxuICB2aXNpdEV4cGFuc2lvbihpY3U6IGh0bWwuRXhwYW5zaW9uLCBjb250ZXh0OiBhbnkpOiBodG1sLkV4cGFuc2lvbiB7XG4gICAgdGhpcy5fbWF5QmVBZGRCbG9ja0NoaWxkcmVuKGljdSk7XG5cbiAgICBjb25zdCB3YXNJbkljdSA9IHRoaXMuX2luSWN1O1xuXG4gICAgaWYgKCF0aGlzLl9pbkljdSkge1xuICAgICAgLy8gbmVzdGVkIElDVSBtZXNzYWdlcyBzaG91bGQgbm90IGJlIGV4dHJhY3RlZCBidXQgdG9wLWxldmVsIHRyYW5zbGF0ZWQgYXMgYSB3aG9sZVxuICAgICAgaWYgKHRoaXMuX2lzSW5UcmFuc2xhdGFibGVTZWN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2FkZE1lc3NhZ2UoW2ljdV0pO1xuICAgICAgfVxuICAgICAgdGhpcy5faW5JY3UgPSB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGNhc2VzID0gaHRtbC52aXNpdEFsbCh0aGlzLCBpY3UuY2FzZXMsIGNvbnRleHQpO1xuXG4gICAgaWYgKHRoaXMuX21vZGUgPT09IF9WaXNpdG9yTW9kZS5NZXJnZSkge1xuICAgICAgaWN1ID0gbmV3IGh0bWwuRXhwYW5zaW9uKFxuICAgICAgICAgIGljdS5zd2l0Y2hWYWx1ZSwgaWN1LnR5cGUsIGNhc2VzLCBpY3Uuc291cmNlU3BhbiwgaWN1LnN3aXRjaFZhbHVlU291cmNlU3Bhbik7XG4gICAgfVxuXG4gICAgdGhpcy5faW5JY3UgPSB3YXNJbkljdTtcblxuICAgIHJldHVybiBpY3U7XG4gIH1cblxuICB2aXNpdENvbW1lbnQoY29tbWVudDogaHRtbC5Db21tZW50LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IGlzT3BlbmluZyA9IF9pc09wZW5pbmdDb21tZW50KGNvbW1lbnQpO1xuXG4gICAgaWYgKGlzT3BlbmluZyAmJiB0aGlzLl9pc0luVHJhbnNsYXRhYmxlU2VjdGlvbikge1xuICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoY29tbWVudCwgJ0NvdWxkIG5vdCBzdGFydCBhIGJsb2NrIGluc2lkZSBhIHRyYW5zbGF0YWJsZSBzZWN0aW9uJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNDbG9zaW5nID0gX2lzQ2xvc2luZ0NvbW1lbnQoY29tbWVudCk7XG5cbiAgICBpZiAoaXNDbG9zaW5nICYmICF0aGlzLl9pbkkxOG5CbG9jaykge1xuICAgICAgdGhpcy5fcmVwb3J0RXJyb3IoY29tbWVudCwgJ1RyeWluZyB0byBjbG9zZSBhbiB1bm9wZW5lZCBibG9jaycpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5faW5JMThuTm9kZSAmJiAhdGhpcy5faW5JY3UpIHtcbiAgICAgIGlmICghdGhpcy5faW5JMThuQmxvY2spIHtcbiAgICAgICAgaWYgKGlzT3BlbmluZykge1xuICAgICAgICAgIC8vIGRlcHJlY2F0ZWQgZnJvbSB2NSB5b3Ugc2hvdWxkIHVzZSA8bmctY29udGFpbmVyIGkxOG4+IGluc3RlYWQgb2YgaTE4biBjb21tZW50c1xuICAgICAgICAgIGlmICghaTE4bkNvbW1lbnRzV2FybmVkICYmIDxhbnk+Y29uc29sZSAmJiA8YW55PmNvbnNvbGUud2Fybikge1xuICAgICAgICAgICAgaTE4bkNvbW1lbnRzV2FybmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0IGRldGFpbHMgPSBjb21tZW50LnNvdXJjZVNwYW4uZGV0YWlscyA/IGAsICR7Y29tbWVudC5zb3VyY2VTcGFuLmRldGFpbHN9YCA6ICcnO1xuICAgICAgICAgICAgLy8gVE9ETyhvY29tYmUpOiB1c2UgYSBsb2cgc2VydmljZSBvbmNlIHRoZXJlIGlzIGEgcHVibGljIG9uZSBhdmFpbGFibGVcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgSTE4biBjb21tZW50cyBhcmUgZGVwcmVjYXRlZCwgdXNlIGFuIDxuZy1jb250YWluZXI+IGVsZW1lbnQgaW5zdGVhZCAoJHtcbiAgICAgICAgICAgICAgICBjb21tZW50LnNvdXJjZVNwYW4uc3RhcnR9JHtkZXRhaWxzfSlgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5faW5JMThuQmxvY2sgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuX2Jsb2NrU3RhcnREZXB0aCA9IHRoaXMuX2RlcHRoO1xuICAgICAgICAgIHRoaXMuX2Jsb2NrQ2hpbGRyZW4gPSBbXTtcbiAgICAgICAgICB0aGlzLl9ibG9ja01lYW5pbmdBbmREZXNjID1cbiAgICAgICAgICAgICAgY29tbWVudC52YWx1ZSEucmVwbGFjZShfSTE4Tl9DT01NRU5UX1BSRUZJWF9SRUdFWFAsICcnKS50cmltKCk7XG4gICAgICAgICAgdGhpcy5fb3BlblRyYW5zbGF0YWJsZVNlY3Rpb24oY29tbWVudCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpc0Nsb3NpbmcpIHtcbiAgICAgICAgICBpZiAodGhpcy5fZGVwdGggPT0gdGhpcy5fYmxvY2tTdGFydERlcHRoKSB7XG4gICAgICAgICAgICB0aGlzLl9jbG9zZVRyYW5zbGF0YWJsZVNlY3Rpb24oY29tbWVudCwgdGhpcy5fYmxvY2tDaGlsZHJlbik7XG4gICAgICAgICAgICB0aGlzLl9pbkkxOG5CbG9jayA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuX2FkZE1lc3NhZ2UodGhpcy5fYmxvY2tDaGlsZHJlbiwgdGhpcy5fYmxvY2tNZWFuaW5nQW5kRGVzYykhO1xuICAgICAgICAgICAgLy8gbWVyZ2UgYXR0cmlidXRlcyBpbiBzZWN0aW9uc1xuICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSB0aGlzLl90cmFuc2xhdGVNZXNzYWdlKGNvbW1lbnQsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgcmV0dXJuIGh0bWwudmlzaXRBbGwodGhpcywgbm9kZXMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZXBvcnRFcnJvcihjb21tZW50LCAnSTE4TiBibG9ja3Mgc2hvdWxkIG5vdCBjcm9zcyBlbGVtZW50IGJvdW5kYXJpZXMnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB2aXNpdFRleHQodGV4dDogaHRtbC5UZXh0LCBjb250ZXh0OiBhbnkpOiBodG1sLlRleHQge1xuICAgIGlmICh0aGlzLl9pc0luVHJhbnNsYXRhYmxlU2VjdGlvbikge1xuICAgICAgdGhpcy5fbWF5QmVBZGRCbG9ja0NoaWxkcmVuKHRleHQpO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuXG4gIHZpc2l0RWxlbWVudChlbDogaHRtbC5FbGVtZW50LCBjb250ZXh0OiBhbnkpOiBodG1sLkVsZW1lbnR8bnVsbCB7XG4gICAgdGhpcy5fbWF5QmVBZGRCbG9ja0NoaWxkcmVuKGVsKTtcbiAgICB0aGlzLl9kZXB0aCsrO1xuICAgIGNvbnN0IHdhc0luSTE4bk5vZGUgPSB0aGlzLl9pbkkxOG5Ob2RlO1xuICAgIGNvbnN0IHdhc0luSW1wbGljaXROb2RlID0gdGhpcy5faW5JbXBsaWNpdE5vZGU7XG4gICAgbGV0IGNoaWxkTm9kZXM6IGh0bWwuTm9kZVtdID0gW107XG4gICAgbGV0IHRyYW5zbGF0ZWRDaGlsZE5vZGVzOiBodG1sLk5vZGVbXSA9IHVuZGVmaW5lZCE7XG5cbiAgICAvLyBFeHRyYWN0OlxuICAgIC8vIC0gdG9wIGxldmVsIG5vZGVzIHdpdGggdGhlIChpbXBsaWNpdCkgXCJpMThuXCIgYXR0cmlidXRlIGlmIG5vdCBhbHJlYWR5IGluIGEgc2VjdGlvblxuICAgIC8vIC0gSUNVIG1lc3NhZ2VzXG4gICAgY29uc3QgaTE4bkF0dHIgPSBfZ2V0STE4bkF0dHIoZWwpO1xuICAgIGNvbnN0IGkxOG5NZXRhID0gaTE4bkF0dHIgPyBpMThuQXR0ci52YWx1ZSA6ICcnO1xuICAgIGNvbnN0IGlzSW1wbGljaXQgPSB0aGlzLl9pbXBsaWNpdFRhZ3Muc29tZSh0YWcgPT4gZWwubmFtZSA9PT0gdGFnKSAmJiAhdGhpcy5faW5JY3UgJiZcbiAgICAgICAgIXRoaXMuX2lzSW5UcmFuc2xhdGFibGVTZWN0aW9uO1xuICAgIGNvbnN0IGlzVG9wTGV2ZWxJbXBsaWNpdCA9ICF3YXNJbkltcGxpY2l0Tm9kZSAmJiBpc0ltcGxpY2l0O1xuICAgIHRoaXMuX2luSW1wbGljaXROb2RlID0gd2FzSW5JbXBsaWNpdE5vZGUgfHwgaXNJbXBsaWNpdDtcblxuICAgIGlmICghdGhpcy5faXNJblRyYW5zbGF0YWJsZVNlY3Rpb24gJiYgIXRoaXMuX2luSWN1KSB7XG4gICAgICBpZiAoaTE4bkF0dHIgfHwgaXNUb3BMZXZlbEltcGxpY2l0KSB7XG4gICAgICAgIHRoaXMuX2luSTE4bk5vZGUgPSB0cnVlO1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5fYWRkTWVzc2FnZShlbC5jaGlsZHJlbiwgaTE4bk1ldGEpITtcbiAgICAgICAgdHJhbnNsYXRlZENoaWxkTm9kZXMgPSB0aGlzLl90cmFuc2xhdGVNZXNzYWdlKGVsLCBtZXNzYWdlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX21vZGUgPT0gX1Zpc2l0b3JNb2RlLkV4dHJhY3QpIHtcbiAgICAgICAgY29uc3QgaXNUcmFuc2xhdGFibGUgPSBpMThuQXR0ciB8fCBpc1RvcExldmVsSW1wbGljaXQ7XG4gICAgICAgIGlmIChpc1RyYW5zbGF0YWJsZSkgdGhpcy5fb3BlblRyYW5zbGF0YWJsZVNlY3Rpb24oZWwpO1xuICAgICAgICBodG1sLnZpc2l0QWxsKHRoaXMsIGVsLmNoaWxkcmVuKTtcbiAgICAgICAgaWYgKGlzVHJhbnNsYXRhYmxlKSB0aGlzLl9jbG9zZVRyYW5zbGF0YWJsZVNlY3Rpb24oZWwsIGVsLmNoaWxkcmVuKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGkxOG5BdHRyIHx8IGlzVG9wTGV2ZWxJbXBsaWNpdCkge1xuICAgICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICAgIGVsLCAnQ291bGQgbm90IG1hcmsgYW4gZWxlbWVudCBhcyB0cmFuc2xhdGFibGUgaW5zaWRlIGEgdHJhbnNsYXRhYmxlIHNlY3Rpb24nKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX21vZGUgPT0gX1Zpc2l0b3JNb2RlLkV4dHJhY3QpIHtcbiAgICAgICAgLy8gRGVzY2VuZCBpbnRvIGNoaWxkIG5vZGVzIGZvciBleHRyYWN0aW9uXG4gICAgICAgIGh0bWwudmlzaXRBbGwodGhpcywgZWwuY2hpbGRyZW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLl9tb2RlID09PSBfVmlzaXRvck1vZGUuTWVyZ2UpIHtcbiAgICAgIGNvbnN0IHZpc2l0Tm9kZXMgPSB0cmFuc2xhdGVkQ2hpbGROb2RlcyB8fCBlbC5jaGlsZHJlbjtcbiAgICAgIHZpc2l0Tm9kZXMuZm9yRWFjaChjaGlsZCA9PiB7XG4gICAgICAgIGNvbnN0IHZpc2l0ZWQgPSBjaGlsZC52aXNpdCh0aGlzLCBjb250ZXh0KTtcbiAgICAgICAgaWYgKHZpc2l0ZWQgJiYgIXRoaXMuX2lzSW5UcmFuc2xhdGFibGVTZWN0aW9uKSB7XG4gICAgICAgICAgLy8gRG8gbm90IGFkZCB0aGUgY2hpbGRyZW4gZnJvbSB0cmFuc2xhdGFibGUgc2VjdGlvbnMgKD0gaTE4biBibG9ja3MgaGVyZSlcbiAgICAgICAgICAvLyBUaGV5IHdpbGwgYmUgYWRkZWQgbGF0ZXIgaW4gdGhpcyBsb29wIHdoZW4gdGhlIGJsb2NrIGNsb3NlcyAoaS5lLiBvbiBgPCEtLSAvaTE4biAtLT5gKVxuICAgICAgICAgIGNoaWxkTm9kZXMgPSBjaGlsZE5vZGVzLmNvbmNhdCh2aXNpdGVkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5fdmlzaXRBdHRyaWJ1dGVzT2YoZWwpO1xuXG4gICAgdGhpcy5fZGVwdGgtLTtcbiAgICB0aGlzLl9pbkkxOG5Ob2RlID0gd2FzSW5JMThuTm9kZTtcbiAgICB0aGlzLl9pbkltcGxpY2l0Tm9kZSA9IHdhc0luSW1wbGljaXROb2RlO1xuXG4gICAgaWYgKHRoaXMuX21vZGUgPT09IF9WaXNpdG9yTW9kZS5NZXJnZSkge1xuICAgICAgY29uc3QgdHJhbnNsYXRlZEF0dHJzID0gdGhpcy5fdHJhbnNsYXRlQXR0cmlidXRlcyhlbCk7XG4gICAgICByZXR1cm4gbmV3IGh0bWwuRWxlbWVudChcbiAgICAgICAgICBlbC5uYW1lLCB0cmFuc2xhdGVkQXR0cnMsIGNoaWxkTm9kZXMsIGVsLnNvdXJjZVNwYW4sIGVsLnN0YXJ0U291cmNlU3BhbixcbiAgICAgICAgICBlbC5lbmRTb3VyY2VTcGFuKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB2aXNpdEF0dHJpYnV0ZShhdHRyaWJ1dGU6IGh0bWwuQXR0cmlidXRlLCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIHRocm93IG5ldyBFcnJvcigndW5yZWFjaGFibGUgY29kZScpO1xuICB9XG5cbiAgdmlzaXRCbG9ja0dyb3VwKGdyb3VwOiBodG1sLkJsb2NrR3JvdXAsIGNvbnRleHQ6IGFueSkge1xuICAgIGh0bWwudmlzaXRBbGwodGhpcywgZ3JvdXAuYmxvY2tzLCBjb250ZXh0KTtcbiAgfVxuXG4gIHZpc2l0QmxvY2soYmxvY2s6IGh0bWwuQmxvY2ssIGNvbnRleHQ6IGFueSkge1xuICAgIGh0bWwudmlzaXRBbGwodGhpcywgYmxvY2suY2hpbGRyZW4sIGNvbnRleHQpO1xuICB9XG5cbiAgdmlzaXRCbG9ja1BhcmFtZXRlcihwYXJhbWV0ZXI6IGh0bWwuQmxvY2tQYXJhbWV0ZXIsIGNvbnRleHQ6IGFueSkge31cblxuICBwcml2YXRlIF9pbml0KG1vZGU6IF9WaXNpdG9yTW9kZSwgaW50ZXJwb2xhdGlvbkNvbmZpZzogSW50ZXJwb2xhdGlvbkNvbmZpZyk6IHZvaWQge1xuICAgIHRoaXMuX21vZGUgPSBtb2RlO1xuICAgIHRoaXMuX2luSTE4bkJsb2NrID0gZmFsc2U7XG4gICAgdGhpcy5faW5JMThuTm9kZSA9IGZhbHNlO1xuICAgIHRoaXMuX2RlcHRoID0gMDtcbiAgICB0aGlzLl9pbkljdSA9IGZhbHNlO1xuICAgIHRoaXMuX21zZ0NvdW50QXRTZWN0aW9uU3RhcnQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fZXJyb3JzID0gW107XG4gICAgdGhpcy5fbWVzc2FnZXMgPSBbXTtcbiAgICB0aGlzLl9pbkltcGxpY2l0Tm9kZSA9IGZhbHNlO1xuICAgIHRoaXMuX2NyZWF0ZUkxOG5NZXNzYWdlID0gY3JlYXRlSTE4bk1lc3NhZ2VGYWN0b3J5KGludGVycG9sYXRpb25Db25maWcpO1xuICB9XG5cbiAgLy8gbG9va3MgZm9yIHRyYW5zbGF0YWJsZSBhdHRyaWJ1dGVzXG4gIHByaXZhdGUgX3Zpc2l0QXR0cmlidXRlc09mKGVsOiBodG1sLkVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBleHBsaWNpdEF0dHJOYW1lVG9WYWx1ZToge1trOiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gICAgY29uc3QgaW1wbGljaXRBdHRyTmFtZXM6IHN0cmluZ1tdID0gdGhpcy5faW1wbGljaXRBdHRyc1tlbC5uYW1lXSB8fCBbXTtcblxuICAgIGVsLmF0dHJzLmZpbHRlcihhdHRyID0+IGF0dHIubmFtZS5zdGFydHNXaXRoKF9JMThOX0FUVFJfUFJFRklYKSlcbiAgICAgICAgLmZvckVhY2goXG4gICAgICAgICAgICBhdHRyID0+IGV4cGxpY2l0QXR0ck5hbWVUb1ZhbHVlW2F0dHIubmFtZS5zbGljZShfSTE4Tl9BVFRSX1BSRUZJWC5sZW5ndGgpXSA9XG4gICAgICAgICAgICAgICAgYXR0ci52YWx1ZSk7XG5cbiAgICBlbC5hdHRycy5mb3JFYWNoKGF0dHIgPT4ge1xuICAgICAgaWYgKGF0dHIubmFtZSBpbiBleHBsaWNpdEF0dHJOYW1lVG9WYWx1ZSkge1xuICAgICAgICB0aGlzLl9hZGRNZXNzYWdlKFthdHRyXSwgZXhwbGljaXRBdHRyTmFtZVRvVmFsdWVbYXR0ci5uYW1lXSk7XG4gICAgICB9IGVsc2UgaWYgKGltcGxpY2l0QXR0ck5hbWVzLnNvbWUobmFtZSA9PiBhdHRyLm5hbWUgPT09IG5hbWUpKSB7XG4gICAgICAgIHRoaXMuX2FkZE1lc3NhZ2UoW2F0dHJdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIGFkZCBhIHRyYW5zbGF0YWJsZSBtZXNzYWdlXG4gIHByaXZhdGUgX2FkZE1lc3NhZ2UoYXN0OiBodG1sLk5vZGVbXSwgbXNnTWV0YT86IHN0cmluZyk6IGkxOG4uTWVzc2FnZXxudWxsIHtcbiAgICBpZiAoYXN0Lmxlbmd0aCA9PSAwIHx8XG4gICAgICAgIGFzdC5sZW5ndGggPT0gMSAmJiBhc3RbMF0gaW5zdGFuY2VvZiBodG1sLkF0dHJpYnV0ZSAmJiAhKDxodG1sLkF0dHJpYnV0ZT5hc3RbMF0pLnZhbHVlKSB7XG4gICAgICAvLyBEbyBub3QgY3JlYXRlIGVtcHR5IG1lc3NhZ2VzXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCB7bWVhbmluZywgZGVzY3JpcHRpb24sIGlkfSA9IF9wYXJzZU1lc3NhZ2VNZXRhKG1zZ01ldGEpO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLl9jcmVhdGVJMThuTWVzc2FnZShhc3QsIG1lYW5pbmcsIGRlc2NyaXB0aW9uLCBpZCk7XG4gICAgdGhpcy5fbWVzc2FnZXMucHVzaChtZXNzYWdlKTtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxuXG4gIC8vIFRyYW5zbGF0ZXMgdGhlIGdpdmVuIG1lc3NhZ2UgZ2l2ZW4gdGhlIGBUcmFuc2xhdGlvbkJ1bmRsZWBcbiAgLy8gVGhpcyBpcyB1c2VkIGZvciB0cmFuc2xhdGluZyBlbGVtZW50cyAvIGJsb2NrcyAtIHNlZSBgX3RyYW5zbGF0ZUF0dHJpYnV0ZXNgIGZvciBhdHRyaWJ1dGVzXG4gIC8vIG5vLW9wIHdoZW4gY2FsbGVkIGluIGV4dHJhY3Rpb24gbW9kZSAocmV0dXJucyBbXSlcbiAgcHJpdmF0ZSBfdHJhbnNsYXRlTWVzc2FnZShlbDogaHRtbC5Ob2RlLCBtZXNzYWdlOiBpMThuLk1lc3NhZ2UpOiBodG1sLk5vZGVbXSB7XG4gICAgaWYgKG1lc3NhZ2UgJiYgdGhpcy5fbW9kZSA9PT0gX1Zpc2l0b3JNb2RlLk1lcmdlKSB7XG4gICAgICBjb25zdCBub2RlcyA9IHRoaXMuX3RyYW5zbGF0aW9ucy5nZXQobWVzc2FnZSk7XG5cbiAgICAgIGlmIChub2Rlcykge1xuICAgICAgICByZXR1cm4gbm9kZXM7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3JlcG9ydEVycm9yKFxuICAgICAgICAgIGVsLCBgVHJhbnNsYXRpb24gdW5hdmFpbGFibGUgZm9yIG1lc3NhZ2UgaWQ9XCIke3RoaXMuX3RyYW5zbGF0aW9ucy5kaWdlc3QobWVzc2FnZSl9XCJgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvLyB0cmFuc2xhdGUgdGhlIGF0dHJpYnV0ZXMgb2YgYW4gZWxlbWVudCBhbmQgcmVtb3ZlIGkxOG4gc3BlY2lmaWMgYXR0cmlidXRlc1xuICBwcml2YXRlIF90cmFuc2xhdGVBdHRyaWJ1dGVzKGVsOiBodG1sLkVsZW1lbnQpOiBodG1sLkF0dHJpYnV0ZVtdIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gZWwuYXR0cnM7XG4gICAgY29uc3QgaTE4blBhcnNlZE1lc3NhZ2VNZXRhOlxuICAgICAgICB7W25hbWU6IHN0cmluZ106IHttZWFuaW5nOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcsIGlkOiBzdHJpbmd9fSA9IHt9O1xuXG4gICAgYXR0cmlidXRlcy5mb3JFYWNoKGF0dHIgPT4ge1xuICAgICAgaWYgKGF0dHIubmFtZS5zdGFydHNXaXRoKF9JMThOX0FUVFJfUFJFRklYKSkge1xuICAgICAgICBpMThuUGFyc2VkTWVzc2FnZU1ldGFbYXR0ci5uYW1lLnNsaWNlKF9JMThOX0FUVFJfUFJFRklYLmxlbmd0aCldID1cbiAgICAgICAgICAgIF9wYXJzZU1lc3NhZ2VNZXRhKGF0dHIudmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgdHJhbnNsYXRlZEF0dHJpYnV0ZXM6IGh0bWwuQXR0cmlidXRlW10gPSBbXTtcblxuICAgIGF0dHJpYnV0ZXMuZm9yRWFjaCgoYXR0cikgPT4ge1xuICAgICAgaWYgKGF0dHIubmFtZSA9PT0gX0kxOE5fQVRUUiB8fCBhdHRyLm5hbWUuc3RhcnRzV2l0aChfSTE4Tl9BVFRSX1BSRUZJWCkpIHtcbiAgICAgICAgLy8gc3RyaXAgaTE4biBzcGVjaWZpYyBhdHRyaWJ1dGVzXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGF0dHIudmFsdWUgJiYgYXR0ci52YWx1ZSAhPSAnJyAmJiBpMThuUGFyc2VkTWVzc2FnZU1ldGEuaGFzT3duUHJvcGVydHkoYXR0ci5uYW1lKSkge1xuICAgICAgICBjb25zdCB7bWVhbmluZywgZGVzY3JpcHRpb24sIGlkfSA9IGkxOG5QYXJzZWRNZXNzYWdlTWV0YVthdHRyLm5hbWVdO1xuICAgICAgICBjb25zdCBtZXNzYWdlOiBpMThuLk1lc3NhZ2UgPSB0aGlzLl9jcmVhdGVJMThuTWVzc2FnZShbYXR0cl0sIG1lYW5pbmcsIGRlc2NyaXB0aW9uLCBpZCk7XG4gICAgICAgIGNvbnN0IG5vZGVzID0gdGhpcy5fdHJhbnNsYXRpb25zLmdldChtZXNzYWdlKTtcbiAgICAgICAgaWYgKG5vZGVzKSB7XG4gICAgICAgICAgaWYgKG5vZGVzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICB0cmFuc2xhdGVkQXR0cmlidXRlcy5wdXNoKG5ldyBodG1sLkF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICBhdHRyLm5hbWUsICcnLCBhdHRyLnNvdXJjZVNwYW4sIHVuZGVmaW5lZCAvKiBrZXlTcGFuICovLCB1bmRlZmluZWQgLyogdmFsdWVTcGFuICovLFxuICAgICAgICAgICAgICAgIHVuZGVmaW5lZCAvKiB2YWx1ZVRva2VucyAqLywgdW5kZWZpbmVkIC8qIGkxOG4gKi8pKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG5vZGVzWzBdIGluc3RhbmNlb2YgaHRtbC5UZXh0KSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IChub2Rlc1swXSBhcyBodG1sLlRleHQpLnZhbHVlO1xuICAgICAgICAgICAgdHJhbnNsYXRlZEF0dHJpYnV0ZXMucHVzaChuZXcgaHRtbC5BdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgYXR0ci5uYW1lLCB2YWx1ZSwgYXR0ci5zb3VyY2VTcGFuLCB1bmRlZmluZWQgLyoga2V5U3BhbiAqLyxcbiAgICAgICAgICAgICAgICB1bmRlZmluZWQgLyogdmFsdWVTcGFuICovLCB1bmRlZmluZWQgLyogdmFsdWVUb2tlbnMgKi8sIHVuZGVmaW5lZCAvKiBpMThuICovKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlcG9ydEVycm9yKFxuICAgICAgICAgICAgICAgIGVsLFxuICAgICAgICAgICAgICAgIGBVbmV4cGVjdGVkIHRyYW5zbGF0aW9uIGZvciBhdHRyaWJ1dGUgXCIke2F0dHIubmFtZX1cIiAoaWQ9XCIke1xuICAgICAgICAgICAgICAgICAgICBpZCB8fCB0aGlzLl90cmFuc2xhdGlvbnMuZGlnZXN0KG1lc3NhZ2UpfVwiKWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9yZXBvcnRFcnJvcihcbiAgICAgICAgICAgICAgZWwsXG4gICAgICAgICAgICAgIGBUcmFuc2xhdGlvbiB1bmF2YWlsYWJsZSBmb3IgYXR0cmlidXRlIFwiJHthdHRyLm5hbWV9XCIgKGlkPVwiJHtcbiAgICAgICAgICAgICAgICAgIGlkIHx8IHRoaXMuX3RyYW5zbGF0aW9ucy5kaWdlc3QobWVzc2FnZSl9XCIpYCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyYW5zbGF0ZWRBdHRyaWJ1dGVzLnB1c2goYXR0cik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdHJhbnNsYXRlZEF0dHJpYnV0ZXM7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBBZGQgdGhlIG5vZGUgYXMgYSBjaGlsZCBvZiB0aGUgYmxvY2sgd2hlbjpcbiAgICogLSB3ZSBhcmUgaW4gYSBibG9jayxcbiAgICogLSB3ZSBhcmUgbm90IGluc2lkZSBhIElDVSBtZXNzYWdlICh0aG9zZSBhcmUgaGFuZGxlZCBzZXBhcmF0ZWx5KSxcbiAgICogLSB0aGUgbm9kZSBpcyBhIFwiZGlyZWN0IGNoaWxkXCIgb2YgdGhlIGJsb2NrXG4gICAqL1xuICBwcml2YXRlIF9tYXlCZUFkZEJsb2NrQ2hpbGRyZW4obm9kZTogaHRtbC5Ob2RlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2luSTE4bkJsb2NrICYmICF0aGlzLl9pbkljdSAmJiB0aGlzLl9kZXB0aCA9PSB0aGlzLl9ibG9ja1N0YXJ0RGVwdGgpIHtcbiAgICAgIHRoaXMuX2Jsb2NrQ2hpbGRyZW4ucHVzaChub2RlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFya3MgdGhlIHN0YXJ0IG9mIGEgc2VjdGlvbiwgc2VlIGBfY2xvc2VUcmFuc2xhdGFibGVTZWN0aW9uYFxuICAgKi9cbiAgcHJpdmF0ZSBfb3BlblRyYW5zbGF0YWJsZVNlY3Rpb24obm9kZTogaHRtbC5Ob2RlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2lzSW5UcmFuc2xhdGFibGVTZWN0aW9uKSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihub2RlLCAnVW5leHBlY3RlZCBzZWN0aW9uIHN0YXJ0Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX21zZ0NvdW50QXRTZWN0aW9uU3RhcnQgPSB0aGlzLl9tZXNzYWdlcy5sZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEEgdHJhbnNsYXRhYmxlIHNlY3Rpb24gY291bGQgYmU6XG4gICAqIC0gdGhlIGNvbnRlbnQgb2YgdHJhbnNsYXRhYmxlIGVsZW1lbnQsXG4gICAqIC0gbm9kZXMgYmV0d2VlbiBgPCEtLSBpMThuIC0tPmAgYW5kIGA8IS0tIC9pMThuIC0tPmAgY29tbWVudHNcbiAgICovXG4gIHByaXZhdGUgZ2V0IF9pc0luVHJhbnNsYXRhYmxlU2VjdGlvbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fbXNnQ291bnRBdFNlY3Rpb25TdGFydCAhPT0gdm9pZCAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFRlcm1pbmF0ZXMgYSBzZWN0aW9uLlxuICAgKlxuICAgKiBJZiBhIHNlY3Rpb24gaGFzIG9ubHkgb25lIHNpZ25pZmljYW50IGNoaWxkcmVuIChjb21tZW50cyBub3Qgc2lnbmlmaWNhbnQpIHRoZW4gd2Ugc2hvdWxkIG5vdFxuICAgKiBrZWVwIHRoZSBtZXNzYWdlIGZyb20gdGhpcyBjaGlsZHJlbjpcbiAgICpcbiAgICogYDxwIGkxOG49XCJtZWFuaW5nfGRlc2NyaXB0aW9uXCI+e0lDVSBtZXNzYWdlfTwvcD5gIHdvdWxkIHByb2R1Y2UgdHdvIG1lc3NhZ2VzOlxuICAgKiAtIG9uZSBmb3IgdGhlIDxwPiBjb250ZW50IHdpdGggbWVhbmluZyBhbmQgZGVzY3JpcHRpb24sXG4gICAqIC0gYW5vdGhlciBvbmUgZm9yIHRoZSBJQ1UgbWVzc2FnZS5cbiAgICpcbiAgICogSW4gdGhpcyBjYXNlIHRoZSBsYXN0IG1lc3NhZ2UgaXMgZGlzY2FyZGVkIGFzIGl0IGNvbnRhaW5zIGxlc3MgaW5mb3JtYXRpb24gKHRoZSBBU1QgaXNcbiAgICogb3RoZXJ3aXNlIGlkZW50aWNhbCkuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB3ZSBzaG91bGQgc3RpbGwga2VlcCBtZXNzYWdlcyBleHRyYWN0ZWQgZnJvbSBhdHRyaWJ1dGVzIGluc2lkZSB0aGUgc2VjdGlvbiAoaWUgaW4gdGhlXG4gICAqIElDVSBtZXNzYWdlIGhlcmUpXG4gICAqL1xuICBwcml2YXRlIF9jbG9zZVRyYW5zbGF0YWJsZVNlY3Rpb24obm9kZTogaHRtbC5Ob2RlLCBkaXJlY3RDaGlsZHJlbjogaHRtbC5Ob2RlW10pOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzSW5UcmFuc2xhdGFibGVTZWN0aW9uKSB7XG4gICAgICB0aGlzLl9yZXBvcnRFcnJvcihub2RlLCAnVW5leHBlY3RlZCBzZWN0aW9uIGVuZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0SW5kZXggPSB0aGlzLl9tc2dDb3VudEF0U2VjdGlvblN0YXJ0O1xuICAgIGNvbnN0IHNpZ25pZmljYW50Q2hpbGRyZW46IG51bWJlciA9IGRpcmVjdENoaWxkcmVuLnJlZHVjZShcbiAgICAgICAgKGNvdW50OiBudW1iZXIsIG5vZGU6IGh0bWwuTm9kZSk6IG51bWJlciA9PiBjb3VudCArIChub2RlIGluc3RhbmNlb2YgaHRtbC5Db21tZW50ID8gMCA6IDEpLFxuICAgICAgICAwKTtcblxuICAgIGlmIChzaWduaWZpY2FudENoaWxkcmVuID09IDEpIHtcbiAgICAgIGZvciAobGV0IGkgPSB0aGlzLl9tZXNzYWdlcy5sZW5ndGggLSAxOyBpID49IHN0YXJ0SW5kZXghOyBpLS0pIHtcbiAgICAgICAgY29uc3QgYXN0ID0gdGhpcy5fbWVzc2FnZXNbaV0ubm9kZXM7XG4gICAgICAgIGlmICghKGFzdC5sZW5ndGggPT0gMSAmJiBhc3RbMF0gaW5zdGFuY2VvZiBpMThuLlRleHQpKSB7XG4gICAgICAgICAgdGhpcy5fbWVzc2FnZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fbXNnQ291bnRBdFNlY3Rpb25TdGFydCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgX3JlcG9ydEVycm9yKG5vZGU6IGh0bWwuTm9kZSwgbXNnOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLl9lcnJvcnMucHVzaChuZXcgSTE4bkVycm9yKG5vZGUuc291cmNlU3BhbiwgbXNnKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2lzT3BlbmluZ0NvbW1lbnQobjogaHRtbC5Ob2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIShuIGluc3RhbmNlb2YgaHRtbC5Db21tZW50ICYmIG4udmFsdWUgJiYgbi52YWx1ZS5zdGFydHNXaXRoKCdpMThuJykpO1xufVxuXG5mdW5jdGlvbiBfaXNDbG9zaW5nQ29tbWVudChuOiBodG1sLk5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhKG4gaW5zdGFuY2VvZiBodG1sLkNvbW1lbnQgJiYgbi52YWx1ZSAmJiBuLnZhbHVlID09PSAnL2kxOG4nKTtcbn1cblxuZnVuY3Rpb24gX2dldEkxOG5BdHRyKHA6IGh0bWwuRWxlbWVudCk6IGh0bWwuQXR0cmlidXRlfG51bGwge1xuICByZXR1cm4gcC5hdHRycy5maW5kKGF0dHIgPT4gYXR0ci5uYW1lID09PSBfSTE4Tl9BVFRSKSB8fCBudWxsO1xufVxuXG5mdW5jdGlvbiBfcGFyc2VNZXNzYWdlTWV0YShpMThuPzogc3RyaW5nKToge21lYW5pbmc6IHN0cmluZywgZGVzY3JpcHRpb246IHN0cmluZywgaWQ6IHN0cmluZ30ge1xuICBpZiAoIWkxOG4pIHJldHVybiB7bWVhbmluZzogJycsIGRlc2NyaXB0aW9uOiAnJywgaWQ6ICcnfTtcblxuICBjb25zdCBpZEluZGV4ID0gaTE4bi5pbmRleE9mKElEX1NFUEFSQVRPUik7XG4gIGNvbnN0IGRlc2NJbmRleCA9IGkxOG4uaW5kZXhPZihNRUFOSU5HX1NFUEFSQVRPUik7XG4gIGNvbnN0IFttZWFuaW5nQW5kRGVzYywgaWRdID1cbiAgICAgIChpZEluZGV4ID4gLTEpID8gW2kxOG4uc2xpY2UoMCwgaWRJbmRleCksIGkxOG4uc2xpY2UoaWRJbmRleCArIDIpXSA6IFtpMThuLCAnJ107XG4gIGNvbnN0IFttZWFuaW5nLCBkZXNjcmlwdGlvbl0gPSAoZGVzY0luZGV4ID4gLTEpID9cbiAgICAgIFttZWFuaW5nQW5kRGVzYy5zbGljZSgwLCBkZXNjSW5kZXgpLCBtZWFuaW5nQW5kRGVzYy5zbGljZShkZXNjSW5kZXggKyAxKV0gOlxuICAgICAgWycnLCBtZWFuaW5nQW5kRGVzY107XG5cbiAgcmV0dXJuIHttZWFuaW5nLCBkZXNjcmlwdGlvbiwgaWQ6IGlkLnRyaW0oKX07XG59XG4iXX0=