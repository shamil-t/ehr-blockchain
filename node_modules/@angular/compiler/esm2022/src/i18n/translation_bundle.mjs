/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { MissingTranslationStrategy } from '../core';
import { HtmlParser } from '../ml_parser/html_parser';
import { I18nError } from './parse_util';
import { escapeXml } from './serializers/xml_helper';
/**
 * A container for translated messages
 */
export class TranslationBundle {
    constructor(_i18nNodesByMsgId = {}, locale, digest, mapperFactory, missingTranslationStrategy = MissingTranslationStrategy.Warning, console) {
        this._i18nNodesByMsgId = _i18nNodesByMsgId;
        this.digest = digest;
        this.mapperFactory = mapperFactory;
        this._i18nToHtml = new I18nToHtmlVisitor(_i18nNodesByMsgId, locale, digest, mapperFactory, missingTranslationStrategy, console);
    }
    // Creates a `TranslationBundle` by parsing the given `content` with the `serializer`.
    static load(content, url, serializer, missingTranslationStrategy, console) {
        const { locale, i18nNodesByMsgId } = serializer.load(content, url);
        const digestFn = (m) => serializer.digest(m);
        const mapperFactory = (m) => serializer.createNameMapper(m);
        return new TranslationBundle(i18nNodesByMsgId, locale, digestFn, mapperFactory, missingTranslationStrategy, console);
    }
    // Returns the translation as HTML nodes from the given source message.
    get(srcMsg) {
        const html = this._i18nToHtml.convert(srcMsg);
        if (html.errors.length) {
            throw new Error(html.errors.join('\n'));
        }
        return html.nodes;
    }
    has(srcMsg) {
        return this.digest(srcMsg) in this._i18nNodesByMsgId;
    }
}
class I18nToHtmlVisitor {
    constructor(_i18nNodesByMsgId = {}, _locale, _digest, _mapperFactory, _missingTranslationStrategy, _console) {
        this._i18nNodesByMsgId = _i18nNodesByMsgId;
        this._locale = _locale;
        this._digest = _digest;
        this._mapperFactory = _mapperFactory;
        this._missingTranslationStrategy = _missingTranslationStrategy;
        this._console = _console;
        this._errors = [];
        this._contextStack = [];
    }
    convert(srcMsg) {
        this._contextStack.length = 0;
        this._errors.length = 0;
        // i18n to text
        const text = this._convertToText(srcMsg);
        // text to html
        const url = srcMsg.nodes[0].sourceSpan.start.file.url;
        const html = new HtmlParser().parse(text, url, { tokenizeExpansionForms: true });
        return {
            nodes: html.rootNodes,
            errors: [...this._errors, ...html.errors],
        };
    }
    visitText(text, context) {
        // `convert()` uses an `HtmlParser` to return `html.Node`s
        // we should then make sure that any special characters are escaped
        return escapeXml(text.value);
    }
    visitContainer(container, context) {
        return container.children.map(n => n.visit(this)).join('');
    }
    visitIcu(icu, context) {
        const cases = Object.keys(icu.cases).map(k => `${k} {${icu.cases[k].visit(this)}}`);
        // TODO(vicb): Once all format switch to using expression placeholders
        // we should throw when the placeholder is not in the source message
        const exp = this._srcMsg.placeholders.hasOwnProperty(icu.expression) ?
            this._srcMsg.placeholders[icu.expression].text :
            icu.expression;
        return `{${exp}, ${icu.type}, ${cases.join(' ')}}`;
    }
    visitPlaceholder(ph, context) {
        const phName = this._mapper(ph.name);
        if (this._srcMsg.placeholders.hasOwnProperty(phName)) {
            return this._srcMsg.placeholders[phName].text;
        }
        if (this._srcMsg.placeholderToMessage.hasOwnProperty(phName)) {
            return this._convertToText(this._srcMsg.placeholderToMessage[phName]);
        }
        this._addError(ph, `Unknown placeholder "${ph.name}"`);
        return '';
    }
    // Loaded message contains only placeholders (vs tag and icu placeholders).
    // However when a translation can not be found, we need to serialize the source message
    // which can contain tag placeholders
    visitTagPlaceholder(ph, context) {
        const tag = `${ph.tag}`;
        const attrs = Object.keys(ph.attrs).map(name => `${name}="${ph.attrs[name]}"`).join(' ');
        if (ph.isVoid) {
            return `<${tag} ${attrs}/>`;
        }
        const children = ph.children.map((c) => c.visit(this)).join('');
        return `<${tag} ${attrs}>${children}</${tag}>`;
    }
    // Loaded message contains only placeholders (vs tag and icu placeholders).
    // However when a translation can not be found, we need to serialize the source message
    // which can contain tag placeholders
    visitIcuPlaceholder(ph, context) {
        // An ICU placeholder references the source message to be serialized
        return this._convertToText(this._srcMsg.placeholderToMessage[ph.name]);
    }
    /**
     * Convert a source message to a translated text string:
     * - text nodes are replaced with their translation,
     * - placeholders are replaced with their content,
     * - ICU nodes are converted to ICU expressions.
     */
    _convertToText(srcMsg) {
        const id = this._digest(srcMsg);
        const mapper = this._mapperFactory ? this._mapperFactory(srcMsg) : null;
        let nodes;
        this._contextStack.push({ msg: this._srcMsg, mapper: this._mapper });
        this._srcMsg = srcMsg;
        if (this._i18nNodesByMsgId.hasOwnProperty(id)) {
            // When there is a translation use its nodes as the source
            // And create a mapper to convert serialized placeholder names to internal names
            nodes = this._i18nNodesByMsgId[id];
            this._mapper = (name) => mapper ? mapper.toInternalName(name) : name;
        }
        else {
            // When no translation has been found
            // - report an error / a warning / nothing,
            // - use the nodes from the original message
            // - placeholders are already internal and need no mapper
            if (this._missingTranslationStrategy === MissingTranslationStrategy.Error) {
                const ctx = this._locale ? ` for locale "${this._locale}"` : '';
                this._addError(srcMsg.nodes[0], `Missing translation for message "${id}"${ctx}`);
            }
            else if (this._console &&
                this._missingTranslationStrategy === MissingTranslationStrategy.Warning) {
                const ctx = this._locale ? ` for locale "${this._locale}"` : '';
                this._console.warn(`Missing translation for message "${id}"${ctx}`);
            }
            nodes = srcMsg.nodes;
            this._mapper = (name) => name;
        }
        const text = nodes.map(node => node.visit(this)).join('');
        const context = this._contextStack.pop();
        this._srcMsg = context.msg;
        this._mapper = context.mapper;
        return text;
    }
    _addError(el, msg) {
        this._errors.push(new I18nError(el.sourceSpan, msg));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRpb25fYnVuZGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL2kxOG4vdHJhbnNsYXRpb25fYnVuZGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUVuRCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFJcEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUV2QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFHbkQ7O0dBRUc7QUFDSCxNQUFNLE9BQU8saUJBQWlCO0lBRzVCLFlBQ1ksb0JBQW9ELEVBQUUsRUFBRSxNQUFtQixFQUM1RSxNQUFtQyxFQUNuQyxhQUFzRCxFQUM3RCw2QkFBeUQsMEJBQTBCLENBQUMsT0FBTyxFQUMzRixPQUFpQjtRQUpULHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBcUM7UUFDdkQsV0FBTSxHQUFOLE1BQU0sQ0FBNkI7UUFDbkMsa0JBQWEsR0FBYixhQUFhLENBQXlDO1FBRy9ELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxpQkFBaUIsQ0FDcEMsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxhQUFjLEVBQUUsMEJBQTBCLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDOUYsQ0FBQztJQUVELHNGQUFzRjtJQUN0RixNQUFNLENBQUMsSUFBSSxDQUNQLE9BQWUsRUFBRSxHQUFXLEVBQUUsVUFBc0IsRUFDcEQsMEJBQXNELEVBQ3RELE9BQWlCO1FBQ25CLE1BQU0sRUFBQyxNQUFNLEVBQUUsZ0JBQWdCLEVBQUMsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNqRSxNQUFNLFFBQVEsR0FBRyxDQUFDLENB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QUFDLENBQUM7YUFDbEY7aUJBQU0sSUFDSCxJQUFJLENBQUMsUUFBUTtnQkFDYixJQUFJLENBQUMsMkJBQTJCLEtBQUssMEJBQTBCLENBQUMsT0FBTyxFQUFFO2dCQUMzRSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQzthQUNyRTtZQUNELEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQztTQUN2QztRQUNELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzFELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFHLENBQUM7UUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUM5QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTyxTQUFTLENBQUMsRUFBYSxFQUFFLEdBQVc7UUFDMUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge01pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5fSBmcm9tICcuLi9jb3JlJztcbmltcG9ydCAqIGFzIGh0bWwgZnJvbSAnLi4vbWxfcGFyc2VyL2FzdCc7XG5pbXBvcnQge0h0bWxQYXJzZXJ9IGZyb20gJy4uL21sX3BhcnNlci9odG1sX3BhcnNlcic7XG5pbXBvcnQge0NvbnNvbGV9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQgKiBhcyBpMThuIGZyb20gJy4vaTE4bl9hc3QnO1xuaW1wb3J0IHtJMThuRXJyb3J9IGZyb20gJy4vcGFyc2VfdXRpbCc7XG5pbXBvcnQge1BsYWNlaG9sZGVyTWFwcGVyLCBTZXJpYWxpemVyfSBmcm9tICcuL3NlcmlhbGl6ZXJzL3NlcmlhbGl6ZXInO1xuaW1wb3J0IHtlc2NhcGVYbWx9IGZyb20gJy4vc2VyaWFsaXplcnMveG1sX2hlbHBlcic7XG5cblxuLyoqXG4gKiBBIGNvbnRhaW5lciBmb3IgdHJhbnNsYXRlZCBtZXNzYWdlc1xuICovXG5leHBvcnQgY2xhc3MgVHJhbnNsYXRpb25CdW5kbGUge1xuICBwcml2YXRlIF9pMThuVG9IdG1sOiBJMThuVG9IdG1sVmlzaXRvcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2kxOG5Ob2Rlc0J5TXNnSWQ6IHtbbXNnSWQ6IHN0cmluZ106IGkxOG4uTm9kZVtdfSA9IHt9LCBsb2NhbGU6IHN0cmluZ3xudWxsLFxuICAgICAgcHVibGljIGRpZ2VzdDogKG06IGkxOG4uTWVzc2FnZSkgPT4gc3RyaW5nLFxuICAgICAgcHVibGljIG1hcHBlckZhY3Rvcnk/OiAobTogaTE4bi5NZXNzYWdlKSA9PiBQbGFjZWhvbGRlck1hcHBlcixcbiAgICAgIG1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5OiBNaXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneSA9IE1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5Lldhcm5pbmcsXG4gICAgICBjb25zb2xlPzogQ29uc29sZSkge1xuICAgIHRoaXMuX2kxOG5Ub0h0bWwgPSBuZXcgSTE4blRvSHRtbFZpc2l0b3IoXG4gICAgICAgIF9pMThuTm9kZXNCeU1zZ0lkLCBsb2NhbGUsIGRpZ2VzdCwgbWFwcGVyRmFjdG9yeSEsIG1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5LCBjb25zb2xlKTtcbiAgfVxuXG4gIC8vIENyZWF0ZXMgYSBgVHJhbnNsYXRpb25CdW5kbGVgIGJ5IHBhcnNpbmcgdGhlIGdpdmVuIGBjb250ZW50YCB3aXRoIHRoZSBgc2VyaWFsaXplcmAuXG4gIHN0YXRpYyBsb2FkKFxuICAgICAgY29udGVudDogc3RyaW5nLCB1cmw6IHN0cmluZywgc2VyaWFsaXplcjogU2VyaWFsaXplcixcbiAgICAgIG1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5OiBNaXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneSxcbiAgICAgIGNvbnNvbGU/OiBDb25zb2xlKTogVHJhbnNsYXRpb25CdW5kbGUge1xuICAgIGNvbnN0IHtsb2NhbGUsIGkxOG5Ob2Rlc0J5TXNnSWR9ID0gc2VyaWFsaXplci5sb2FkKGNvbnRlbnQsIHVybCk7XG4gICAgY29uc3QgZGlnZXN0Rm4gPSAobTogaTE4bi5NZXNzYWdlKSA9PiBzZXJpYWxpemVyLmRpZ2VzdChtKTtcbiAgICBjb25zdCBtYXBwZXJGYWN0b3J5ID0gKG06IGkxOG4uTWVzc2FnZSkgPT4gc2VyaWFsaXplci5jcmVhdGVOYW1lTWFwcGVyKG0pITtcbiAgICByZXR1cm4gbmV3IFRyYW5zbGF0aW9uQnVuZGxlKFxuICAgICAgICBpMThuTm9kZXNCeU1zZ0lkLCBsb2NhbGUsIGRpZ2VzdEZuLCBtYXBwZXJGYWN0b3J5LCBtaXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneSwgY29uc29sZSk7XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSB0cmFuc2xhdGlvbiBhcyBIVE1MIG5vZGVzIGZyb20gdGhlIGdpdmVuIHNvdXJjZSBtZXNzYWdlLlxuICBnZXQoc3JjTXNnOiBpMThuLk1lc3NhZ2UpOiBodG1sLk5vZGVbXSB7XG4gICAgY29uc3QgaHRtbCA9IHRoaXMuX2kxOG5Ub0h0bWwuY29udmVydChzcmNNc2cpO1xuXG4gICAgaWYgKGh0bWwuZXJyb3JzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGh0bWwuZXJyb3JzLmpvaW4oJ1xcbicpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaHRtbC5ub2RlcztcbiAgfVxuXG4gIGhhcyhzcmNNc2c6IGkxOG4uTWVzc2FnZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmRpZ2VzdChzcmNNc2cpIGluIHRoaXMuX2kxOG5Ob2Rlc0J5TXNnSWQ7XG4gIH1cbn1cblxuY2xhc3MgSTE4blRvSHRtbFZpc2l0b3IgaW1wbGVtZW50cyBpMThuLlZpc2l0b3Ige1xuICAvLyB1c2luZyBub24tbnVsbCBhc3NlcnRpb25zIGJlY2F1c2UgdGhleSdyZSAocmUpc2V0IGJ5IGNvbnZlcnQoKVxuICBwcml2YXRlIF9zcmNNc2chOiBpMThuLk1lc3NhZ2U7XG4gIHByaXZhdGUgX2Vycm9yczogSTE4bkVycm9yW10gPSBbXTtcbiAgcHJpdmF0ZSBfY29udGV4dFN0YWNrOiB7bXNnOiBpMThuLk1lc3NhZ2UsIG1hcHBlcjogKG5hbWU6IHN0cmluZykgPT4gc3RyaW5nfVtdID0gW107XG4gIHByaXZhdGUgX21hcHBlciE6IChuYW1lOiBzdHJpbmcpID0+IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2kxOG5Ob2Rlc0J5TXNnSWQ6IHtbbXNnSWQ6IHN0cmluZ106IGkxOG4uTm9kZVtdfSA9IHt9LCBwcml2YXRlIF9sb2NhbGU6IHN0cmluZ3xudWxsLFxuICAgICAgcHJpdmF0ZSBfZGlnZXN0OiAobTogaTE4bi5NZXNzYWdlKSA9PiBzdHJpbmcsXG4gICAgICBwcml2YXRlIF9tYXBwZXJGYWN0b3J5OiAobTogaTE4bi5NZXNzYWdlKSA9PiBQbGFjZWhvbGRlck1hcHBlcixcbiAgICAgIHByaXZhdGUgX21pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5OiBNaXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneSwgcHJpdmF0ZSBfY29uc29sZT86IENvbnNvbGUpIHtcbiAgfVxuXG4gIGNvbnZlcnQoc3JjTXNnOiBpMThuLk1lc3NhZ2UpOiB7bm9kZXM6IGh0bWwuTm9kZVtdLCBlcnJvcnM6IEkxOG5FcnJvcltdfSB7XG4gICAgdGhpcy5fY29udGV4dFN0YWNrLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5fZXJyb3JzLmxlbmd0aCA9IDA7XG5cbiAgICAvLyBpMThuIHRvIHRleHRcbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5fY29udmVydFRvVGV4dChzcmNNc2cpO1xuXG4gICAgLy8gdGV4dCB0byBodG1sXG4gICAgY29uc3QgdXJsID0gc3JjTXNnLm5vZGVzWzBdLnNvdXJjZVNwYW4uc3RhcnQuZmlsZS51cmw7XG4gICAgY29uc3QgaHRtbCA9IG5ldyBIdG1sUGFyc2VyKCkucGFyc2UodGV4dCwgdXJsLCB7dG9rZW5pemVFeHBhbnNpb25Gb3JtczogdHJ1ZX0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG5vZGVzOiBodG1sLnJvb3ROb2RlcyxcbiAgICAgIGVycm9yczogWy4uLnRoaXMuX2Vycm9ycywgLi4uaHRtbC5lcnJvcnNdLFxuICAgIH07XG4gIH1cblxuICB2aXNpdFRleHQodGV4dDogaTE4bi5UZXh0LCBjb250ZXh0PzogYW55KTogc3RyaW5nIHtcbiAgICAvLyBgY29udmVydCgpYCB1c2VzIGFuIGBIdG1sUGFyc2VyYCB0byByZXR1cm4gYGh0bWwuTm9kZWBzXG4gICAgLy8gd2Ugc2hvdWxkIHRoZW4gbWFrZSBzdXJlIHRoYXQgYW55IHNwZWNpYWwgY2hhcmFjdGVycyBhcmUgZXNjYXBlZFxuICAgIHJldHVybiBlc2NhcGVYbWwodGV4dC52YWx1ZSk7XG4gIH1cblxuICB2aXNpdENvbnRhaW5lcihjb250YWluZXI6IGkxOG4uQ29udGFpbmVyLCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICByZXR1cm4gY29udGFpbmVyLmNoaWxkcmVuLm1hcChuID0+IG4udmlzaXQodGhpcykpLmpvaW4oJycpO1xuICB9XG5cbiAgdmlzaXRJY3UoaWN1OiBpMThuLkljdSwgY29udGV4dD86IGFueSk6IGFueSB7XG4gICAgY29uc3QgY2FzZXMgPSBPYmplY3Qua2V5cyhpY3UuY2FzZXMpLm1hcChrID0+IGAke2t9IHske2ljdS5jYXNlc1trXS52aXNpdCh0aGlzKX19YCk7XG5cbiAgICAvLyBUT0RPKHZpY2IpOiBPbmNlIGFsbCBmb3JtYXQgc3dpdGNoIHRvIHVzaW5nIGV4cHJlc3Npb24gcGxhY2Vob2xkZXJzXG4gICAgLy8gd2Ugc2hvdWxkIHRocm93IHdoZW4gdGhlIHBsYWNlaG9sZGVyIGlzIG5vdCBpbiB0aGUgc291cmNlIG1lc3NhZ2VcbiAgICBjb25zdCBleHAgPSB0aGlzLl9zcmNNc2cucGxhY2Vob2xkZXJzLmhhc093blByb3BlcnR5KGljdS5leHByZXNzaW9uKSA/XG4gICAgICAgIHRoaXMuX3NyY01zZy5wbGFjZWhvbGRlcnNbaWN1LmV4cHJlc3Npb25dLnRleHQgOlxuICAgICAgICBpY3UuZXhwcmVzc2lvbjtcblxuICAgIHJldHVybiBgeyR7ZXhwfSwgJHtpY3UudHlwZX0sICR7Y2FzZXMuam9pbignICcpfX1gO1xuICB9XG5cbiAgdmlzaXRQbGFjZWhvbGRlcihwaDogaTE4bi5QbGFjZWhvbGRlciwgY29udGV4dD86IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgcGhOYW1lID0gdGhpcy5fbWFwcGVyKHBoLm5hbWUpO1xuICAgIGlmICh0aGlzLl9zcmNNc2cucGxhY2Vob2xkZXJzLmhhc093blByb3BlcnR5KHBoTmFtZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zcmNNc2cucGxhY2Vob2xkZXJzW3BoTmFtZV0udGV4dDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fc3JjTXNnLnBsYWNlaG9sZGVyVG9NZXNzYWdlLmhhc093blByb3BlcnR5KHBoTmFtZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9jb252ZXJ0VG9UZXh0KHRoaXMuX3NyY01zZy5wbGFjZWhvbGRlclRvTWVzc2FnZVtwaE5hbWVdKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hZGRFcnJvcihwaCwgYFVua25vd24gcGxhY2Vob2xkZXIgXCIke3BoLm5hbWV9XCJgKTtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICAvLyBMb2FkZWQgbWVzc2FnZSBjb250YWlucyBvbmx5IHBsYWNlaG9sZGVycyAodnMgdGFnIGFuZCBpY3UgcGxhY2Vob2xkZXJzKS5cbiAgLy8gSG93ZXZlciB3aGVuIGEgdHJhbnNsYXRpb24gY2FuIG5vdCBiZSBmb3VuZCwgd2UgbmVlZCB0byBzZXJpYWxpemUgdGhlIHNvdXJjZSBtZXNzYWdlXG4gIC8vIHdoaWNoIGNhbiBjb250YWluIHRhZyBwbGFjZWhvbGRlcnNcbiAgdmlzaXRUYWdQbGFjZWhvbGRlcihwaDogaTE4bi5UYWdQbGFjZWhvbGRlciwgY29udGV4dD86IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgdGFnID0gYCR7cGgudGFnfWA7XG4gICAgY29uc3QgYXR0cnMgPSBPYmplY3Qua2V5cyhwaC5hdHRycykubWFwKG5hbWUgPT4gYCR7bmFtZX09XCIke3BoLmF0dHJzW25hbWVdfVwiYCkuam9pbignICcpO1xuICAgIGlmIChwaC5pc1ZvaWQpIHtcbiAgICAgIHJldHVybiBgPCR7dGFnfSAke2F0dHJzfS8+YDtcbiAgICB9XG4gICAgY29uc3QgY2hpbGRyZW4gPSBwaC5jaGlsZHJlbi5tYXAoKGM6IGkxOG4uTm9kZSkgPT4gYy52aXNpdCh0aGlzKSkuam9pbignJyk7XG4gICAgcmV0dXJuIGA8JHt0YWd9ICR7YXR0cnN9PiR7Y2hpbGRyZW59PC8ke3RhZ30+YDtcbiAgfVxuXG4gIC8vIExvYWRlZCBtZXNzYWdlIGNvbnRhaW5zIG9ubHkgcGxhY2Vob2xkZXJzICh2cyB0YWcgYW5kIGljdSBwbGFjZWhvbGRlcnMpLlxuICAvLyBIb3dldmVyIHdoZW4gYSB0cmFuc2xhdGlvbiBjYW4gbm90IGJlIGZvdW5kLCB3ZSBuZWVkIHRvIHNlcmlhbGl6ZSB0aGUgc291cmNlIG1lc3NhZ2VcbiAgLy8gd2hpY2ggY2FuIGNvbnRhaW4gdGFnIHBsYWNlaG9sZGVyc1xuICB2aXNpdEljdVBsYWNlaG9sZGVyKHBoOiBpMThuLkljdVBsYWNlaG9sZGVyLCBjb250ZXh0PzogYW55KTogc3RyaW5nIHtcbiAgICAvLyBBbiBJQ1UgcGxhY2Vob2xkZXIgcmVmZXJlbmNlcyB0aGUgc291cmNlIG1lc3NhZ2UgdG8gYmUgc2VyaWFsaXplZFxuICAgIHJldHVybiB0aGlzLl9jb252ZXJ0VG9UZXh0KHRoaXMuX3NyY01zZy5wbGFjZWhvbGRlclRvTWVzc2FnZVtwaC5uYW1lXSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBhIHNvdXJjZSBtZXNzYWdlIHRvIGEgdHJhbnNsYXRlZCB0ZXh0IHN0cmluZzpcbiAgICogLSB0ZXh0IG5vZGVzIGFyZSByZXBsYWNlZCB3aXRoIHRoZWlyIHRyYW5zbGF0aW9uLFxuICAgKiAtIHBsYWNlaG9sZGVycyBhcmUgcmVwbGFjZWQgd2l0aCB0aGVpciBjb250ZW50LFxuICAgKiAtIElDVSBub2RlcyBhcmUgY29udmVydGVkIHRvIElDVSBleHByZXNzaW9ucy5cbiAgICovXG4gIHByaXZhdGUgX2NvbnZlcnRUb1RleHQoc3JjTXNnOiBpMThuLk1lc3NhZ2UpOiBzdHJpbmcge1xuICAgIGNvbnN0IGlkID0gdGhpcy5fZGlnZXN0KHNyY01zZyk7XG4gICAgY29uc3QgbWFwcGVyID0gdGhpcy5fbWFwcGVyRmFjdG9yeSA/IHRoaXMuX21hcHBlckZhY3Rvcnkoc3JjTXNnKSA6IG51bGw7XG4gICAgbGV0IG5vZGVzOiBpMThuLk5vZGVbXTtcblxuICAgIHRoaXMuX2NvbnRleHRTdGFjay5wdXNoKHttc2c6IHRoaXMuX3NyY01zZywgbWFwcGVyOiB0aGlzLl9tYXBwZXJ9KTtcbiAgICB0aGlzLl9zcmNNc2cgPSBzcmNNc2c7XG5cbiAgICBpZiAodGhpcy5faTE4bk5vZGVzQnlNc2dJZC5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgIC8vIFdoZW4gdGhlcmUgaXMgYSB0cmFuc2xhdGlvbiB1c2UgaXRzIG5vZGVzIGFzIHRoZSBzb3VyY2VcbiAgICAgIC8vIEFuZCBjcmVhdGUgYSBtYXBwZXIgdG8gY29udmVydCBzZXJpYWxpemVkIHBsYWNlaG9sZGVyIG5hbWVzIHRvIGludGVybmFsIG5hbWVzXG4gICAgICBub2RlcyA9IHRoaXMuX2kxOG5Ob2Rlc0J5TXNnSWRbaWRdO1xuICAgICAgdGhpcy5fbWFwcGVyID0gKG5hbWU6IHN0cmluZykgPT4gbWFwcGVyID8gbWFwcGVyLnRvSW50ZXJuYWxOYW1lKG5hbWUpISA6IG5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdoZW4gbm8gdHJhbnNsYXRpb24gaGFzIGJlZW4gZm91bmRcbiAgICAgIC8vIC0gcmVwb3J0IGFuIGVycm9yIC8gYSB3YXJuaW5nIC8gbm90aGluZyxcbiAgICAgIC8vIC0gdXNlIHRoZSBub2RlcyBmcm9tIHRoZSBvcmlnaW5hbCBtZXNzYWdlXG4gICAgICAvLyAtIHBsYWNlaG9sZGVycyBhcmUgYWxyZWFkeSBpbnRlcm5hbCBhbmQgbmVlZCBubyBtYXBwZXJcbiAgICAgIGlmICh0aGlzLl9taXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneSA9PT0gTWlzc2luZ1RyYW5zbGF0aW9uU3RyYXRlZ3kuRXJyb3IpIHtcbiAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5fbG9jYWxlID8gYCBmb3IgbG9jYWxlIFwiJHt0aGlzLl9sb2NhbGV9XCJgIDogJyc7XG4gICAgICAgIHRoaXMuX2FkZEVycm9yKHNyY01zZy5ub2Rlc1swXSwgYE1pc3NpbmcgdHJhbnNsYXRpb24gZm9yIG1lc3NhZ2UgXCIke2lkfVwiJHtjdHh9YCk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIHRoaXMuX2NvbnNvbGUgJiZcbiAgICAgICAgICB0aGlzLl9taXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneSA9PT0gTWlzc2luZ1RyYW5zbGF0aW9uU3RyYXRlZ3kuV2FybmluZykge1xuICAgICAgICBjb25zdCBjdHggPSB0aGlzLl9sb2NhbGUgPyBgIGZvciBsb2NhbGUgXCIke3RoaXMuX2xvY2FsZX1cImAgOiAnJztcbiAgICAgICAgdGhpcy5fY29uc29sZS53YXJuKGBNaXNzaW5nIHRyYW5zbGF0aW9uIGZvciBtZXNzYWdlIFwiJHtpZH1cIiR7Y3R4fWApO1xuICAgICAgfVxuICAgICAgbm9kZXMgPSBzcmNNc2cubm9kZXM7XG4gICAgICB0aGlzLl9tYXBwZXIgPSAobmFtZTogc3RyaW5nKSA9PiBuYW1lO1xuICAgIH1cbiAgICBjb25zdCB0ZXh0ID0gbm9kZXMubWFwKG5vZGUgPT4gbm9kZS52aXNpdCh0aGlzKSkuam9pbignJyk7XG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuX2NvbnRleHRTdGFjay5wb3AoKSE7XG4gICAgdGhpcy5fc3JjTXNnID0gY29udGV4dC5tc2c7XG4gICAgdGhpcy5fbWFwcGVyID0gY29udGV4dC5tYXBwZXI7XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICBwcml2YXRlIF9hZGRFcnJvcihlbDogaTE4bi5Ob2RlLCBtc2c6IHN0cmluZykge1xuICAgIHRoaXMuX2Vycm9ycy5wdXNoKG5ldyBJMThuRXJyb3IoZWwuc291cmNlU3BhbiwgbXNnKSk7XG4gIH1cbn1cbiJdfQ==