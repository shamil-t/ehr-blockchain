/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const _SELECTOR_REGEXP = new RegExp('(\\:not\\()|' + // 1: ":not("
    '(([\\.\\#]?)[-\\w]+)|' + // 2: "tag"; 3: "."/"#";
    // "-" should appear first in the regexp below as FF31 parses "[.-\w]" as a range
    // 4: attribute; 5: attribute_string; 6: attribute_value
    '(?:\\[([-.\\w*\\\\$]+)(?:=([\"\']?)([^\\]\"\']*)\\5)?\\])|' + // "[name]", "[name=value]",
    // "[name="value"]",
    // "[name='value']"
    '(\\))|' + // 7: ")"
    '(\\s*,\\s*)', // 8: ","
'g');
/**
 * A css selector contains an element name,
 * css classes and attribute/value pairs with the purpose
 * of selecting subsets out of them.
 */
export class CssSelector {
    constructor() {
        this.element = null;
        this.classNames = [];
        /**
         * The selectors are encoded in pairs where:
         * - even locations are attribute names
         * - odd locations are attribute values.
         *
         * Example:
         * Selector: `[key1=value1][key2]` would parse to:
         * ```
         * ['key1', 'value1', 'key2', '']
         * ```
         */
        this.attrs = [];
        this.notSelectors = [];
    }
    static parse(selector) {
        const results = [];
        const _addResult = (res, cssSel) => {
            if (cssSel.notSelectors.length > 0 && !cssSel.element && cssSel.classNames.length == 0 &&
                cssSel.attrs.length == 0) {
                cssSel.element = '*';
            }
            res.push(cssSel);
        };
        let cssSelector = new CssSelector();
        let match;
        let current = cssSelector;
        let inNot = false;
        _SELECTOR_REGEXP.lastIndex = 0;
        while (match = _SELECTOR_REGEXP.exec(selector)) {
            if (match[1 /* SelectorRegexp.NOT */]) {
                if (inNot) {
                    throw new Error('Nesting :not in a selector is not allowed');
                }
                inNot = true;
                current = new CssSelector();
                cssSelector.notSelectors.push(current);
            }
            const tag = match[2 /* SelectorRegexp.TAG */];
            if (tag) {
                const prefix = match[3 /* SelectorRegexp.PREFIX */];
                if (prefix === '#') {
                    // #hash
                    current.addAttribute('id', tag.slice(1));
                }
                else if (prefix === '.') {
                    // Class
                    current.addClassName(tag.slice(1));
                }
                else {
                    // Element
                    current.setElement(tag);
                }
            }
            const attribute = match[4 /* SelectorRegexp.ATTRIBUTE */];
            if (attribute) {
                current.addAttribute(current.unescapeAttribute(attribute), match[6 /* SelectorRegexp.ATTRIBUTE_VALUE */]);
            }
            if (match[7 /* SelectorRegexp.NOT_END */]) {
                inNot = false;
                current = cssSelector;
            }
            if (match[8 /* SelectorRegexp.SEPARATOR */]) {
                if (inNot) {
                    throw new Error('Multiple selectors in :not are not supported');
                }
                _addResult(results, cssSelector);
                cssSelector = current = new CssSelector();
            }
        }
        _addResult(results, cssSelector);
        return results;
    }
    /**
     * Unescape `\$` sequences from the CSS attribute selector.
     *
     * This is needed because `$` can have a special meaning in CSS selectors,
     * but we might want to match an attribute that contains `$`.
     * [MDN web link for more
     * info](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors).
     * @param attr the attribute to unescape.
     * @returns the unescaped string.
     */
    unescapeAttribute(attr) {
        let result = '';
        let escaping = false;
        for (let i = 0; i < attr.length; i++) {
            const char = attr.charAt(i);
            if (char === '\\') {
                escaping = true;
                continue;
            }
            if (char === '$' && !escaping) {
                throw new Error(`Error in attribute selector "${attr}". ` +
                    `Unescaped "$" is not supported. Please escape with "\\$".`);
            }
            escaping = false;
            result += char;
        }
        return result;
    }
    /**
     * Escape `$` sequences from the CSS attribute selector.
     *
     * This is needed because `$` can have a special meaning in CSS selectors,
     * with this method we are escaping `$` with `\$'.
     * [MDN web link for more
     * info](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors).
     * @param attr the attribute to escape.
     * @returns the escaped string.
     */
    escapeAttribute(attr) {
        return attr.replace(/\\/g, '\\\\').replace(/\$/g, '\\$');
    }
    isElementSelector() {
        return this.hasElementSelector() && this.classNames.length == 0 && this.attrs.length == 0 &&
            this.notSelectors.length === 0;
    }
    hasElementSelector() {
        return !!this.element;
    }
    setElement(element = null) {
        this.element = element;
    }
    getAttrs() {
        const result = [];
        if (this.classNames.length > 0) {
            result.push('class', this.classNames.join(' '));
        }
        return result.concat(this.attrs);
    }
    addAttribute(name, value = '') {
        this.attrs.push(name, value && value.toLowerCase() || '');
    }
    addClassName(name) {
        this.classNames.push(name.toLowerCase());
    }
    toString() {
        let res = this.element || '';
        if (this.classNames) {
            this.classNames.forEach(klass => res += `.${klass}`);
        }
        if (this.attrs) {
            for (let i = 0; i < this.attrs.length; i += 2) {
                const name = this.escapeAttribute(this.attrs[i]);
                const value = this.attrs[i + 1];
                res += `[${name}${value ? '=' + value : ''}]`;
            }
        }
        this.notSelectors.forEach(notSelector => res += `:not(${notSelector})`);
        return res;
    }
}
/**
 * Reads a list of CssSelectors and allows to calculate which ones
 * are contained in a given CssSelector.
 */
export class SelectorMatcher {
    constructor() {
        this._elementMap = new Map();
        this._elementPartialMap = new Map();
        this._classMap = new Map();
        this._classPartialMap = new Map();
        this._attrValueMap = new Map();
        this._attrValuePartialMap = new Map();
        this._listContexts = [];
    }
    static createNotMatcher(notSelectors) {
        const notMatcher = new SelectorMatcher();
        notMatcher.addSelectables(notSelectors, null);
        return notMatcher;
    }
    addSelectables(cssSelectors, callbackCtxt) {
        let listContext = null;
        if (cssSelectors.length > 1) {
            listContext = new SelectorListContext(cssSelectors);
            this._listContexts.push(listContext);
        }
        for (let i = 0; i < cssSelectors.length; i++) {
            this._addSelectable(cssSelectors[i], callbackCtxt, listContext);
        }
    }
    /**
     * Add an object that can be found later on by calling `match`.
     * @param cssSelector A css selector
     * @param callbackCtxt An opaque object that will be given to the callback of the `match` function
     */
    _addSelectable(cssSelector, callbackCtxt, listContext) {
        let matcher = this;
        const element = cssSelector.element;
        const classNames = cssSelector.classNames;
        const attrs = cssSelector.attrs;
        const selectable = new SelectorContext(cssSelector, callbackCtxt, listContext);
        if (element) {
            const isTerminal = attrs.length === 0 && classNames.length === 0;
            if (isTerminal) {
                this._addTerminal(matcher._elementMap, element, selectable);
            }
            else {
                matcher = this._addPartial(matcher._elementPartialMap, element);
            }
        }
        if (classNames) {
            for (let i = 0; i < classNames.length; i++) {
                const isTerminal = attrs.length === 0 && i === classNames.length - 1;
                const className = classNames[i];
                if (isTerminal) {
                    this._addTerminal(matcher._classMap, className, selectable);
                }
                else {
                    matcher = this._addPartial(matcher._classPartialMap, className);
                }
            }
        }
        if (attrs) {
            for (let i = 0; i < attrs.length; i += 2) {
                const isTerminal = i === attrs.length - 2;
                const name = attrs[i];
                const value = attrs[i + 1];
                if (isTerminal) {
                    const terminalMap = matcher._attrValueMap;
                    let terminalValuesMap = terminalMap.get(name);
                    if (!terminalValuesMap) {
                        terminalValuesMap = new Map();
                        terminalMap.set(name, terminalValuesMap);
                    }
                    this._addTerminal(terminalValuesMap, value, selectable);
                }
                else {
                    const partialMap = matcher._attrValuePartialMap;
                    let partialValuesMap = partialMap.get(name);
                    if (!partialValuesMap) {
                        partialValuesMap = new Map();
                        partialMap.set(name, partialValuesMap);
                    }
                    matcher = this._addPartial(partialValuesMap, value);
                }
            }
        }
    }
    _addTerminal(map, name, selectable) {
        let terminalList = map.get(name);
        if (!terminalList) {
            terminalList = [];
            map.set(name, terminalList);
        }
        terminalList.push(selectable);
    }
    _addPartial(map, name) {
        let matcher = map.get(name);
        if (!matcher) {
            matcher = new SelectorMatcher();
            map.set(name, matcher);
        }
        return matcher;
    }
    /**
     * Find the objects that have been added via `addSelectable`
     * whose css selector is contained in the given css selector.
     * @param cssSelector A css selector
     * @param matchedCallback This callback will be called with the object handed into `addSelectable`
     * @return boolean true if a match was found
     */
    match(cssSelector, matchedCallback) {
        let result = false;
        const element = cssSelector.element;
        const classNames = cssSelector.classNames;
        const attrs = cssSelector.attrs;
        for (let i = 0; i < this._listContexts.length; i++) {
            this._listContexts[i].alreadyMatched = false;
        }
        result = this._matchTerminal(this._elementMap, element, cssSelector, matchedCallback) || result;
        result = this._matchPartial(this._elementPartialMap, element, cssSelector, matchedCallback) ||
            result;
        if (classNames) {
            for (let i = 0; i < classNames.length; i++) {
                const className = classNames[i];
                result =
                    this._matchTerminal(this._classMap, className, cssSelector, matchedCallback) || result;
                result =
                    this._matchPartial(this._classPartialMap, className, cssSelector, matchedCallback) ||
                        result;
            }
        }
        if (attrs) {
            for (let i = 0; i < attrs.length; i += 2) {
                const name = attrs[i];
                const value = attrs[i + 1];
                const terminalValuesMap = this._attrValueMap.get(name);
                if (value) {
                    result =
                        this._matchTerminal(terminalValuesMap, '', cssSelector, matchedCallback) || result;
                }
                result =
                    this._matchTerminal(terminalValuesMap, value, cssSelector, matchedCallback) || result;
                const partialValuesMap = this._attrValuePartialMap.get(name);
                if (value) {
                    result = this._matchPartial(partialValuesMap, '', cssSelector, matchedCallback) || result;
                }
                result =
                    this._matchPartial(partialValuesMap, value, cssSelector, matchedCallback) || result;
            }
        }
        return result;
    }
    /** @internal */
    _matchTerminal(map, name, cssSelector, matchedCallback) {
        if (!map || typeof name !== 'string') {
            return false;
        }
        let selectables = map.get(name) || [];
        const starSelectables = map.get('*');
        if (starSelectables) {
            selectables = selectables.concat(starSelectables);
        }
        if (selectables.length === 0) {
            return false;
        }
        let selectable;
        let result = false;
        for (let i = 0; i < selectables.length; i++) {
            selectable = selectables[i];
            result = selectable.finalize(cssSelector, matchedCallback) || result;
        }
        return result;
    }
    /** @internal */
    _matchPartial(map, name, cssSelector, matchedCallback) {
        if (!map || typeof name !== 'string') {
            return false;
        }
        const nestedSelector = map.get(name);
        if (!nestedSelector) {
            return false;
        }
        // TODO(perf): get rid of recursion and measure again
        // TODO(perf): don't pass the whole selector into the recursion,
        // but only the not processed parts
        return nestedSelector.match(cssSelector, matchedCallback);
    }
}
export class SelectorListContext {
    constructor(selectors) {
        this.selectors = selectors;
        this.alreadyMatched = false;
    }
}
// Store context to pass back selector and context when a selector is matched
export class SelectorContext {
    constructor(selector, cbContext, listContext) {
        this.selector = selector;
        this.cbContext = cbContext;
        this.listContext = listContext;
        this.notSelectors = selector.notSelectors;
    }
    finalize(cssSelector, callback) {
        let result = true;
        if (this.notSelectors.length > 0 && (!this.listContext || !this.listContext.alreadyMatched)) {
            const notMatcher = SelectorMatcher.createNotMatcher(this.notSelectors);
            result = !notMatcher.match(cssSelector, null);
        }
        if (result && callback && (!this.listContext || !this.listContext.alreadyMatched)) {
            if (this.listContext) {
                this.listContext.alreadyMatched = true;
            }
            callback(this.selector, this.cbContext);
        }
        return result;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvc2VsZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FDL0IsY0FBYyxHQUFpQixhQUFhO0lBQ3hDLHVCQUF1QixHQUFJLHdCQUF3QjtJQUNuRCxpRkFBaUY7SUFDakYsd0RBQXdEO0lBQ3hELDREQUE0RCxHQUFJLDRCQUE0QjtJQUM1QixvQkFBb0I7SUFDcEIsbUJBQW1CO0lBQ25GLFFBQVEsR0FBd0QsU0FBUztJQUN6RSxhQUFhLEVBQW1ELFNBQVM7QUFDN0UsR0FBRyxDQUFDLENBQUM7QUFnQlQ7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxXQUFXO0lBQXhCO1FBQ0UsWUFBTyxHQUFnQixJQUFJLENBQUM7UUFDNUIsZUFBVSxHQUFhLEVBQUUsQ0FBQztRQUMxQjs7Ozs7Ozs7OztXQVVHO1FBQ0gsVUFBSyxHQUFhLEVBQUUsQ0FBQztRQUNyQixpQkFBWSxHQUFrQixFQUFFLENBQUM7SUFxSm5DLENBQUM7SUFuSkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFnQjtRQUMzQixNQUFNLE9BQU8sR0FBa0IsRUFBRSxDQUFDO1FBQ2xDLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxNQUFtQixFQUFFLEVBQUU7WUFDN0QsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQ2xGLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtnQkFDNUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7YUFDdEI7WUFDRCxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0s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WSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7SUFDNUMsQ0FBQztJQUVELFFBQVEsQ0FBQyxXQUF3QixFQUFFLFFBQStDO1FBQ2hGLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLEVBQUU7WUFDM0YsTUFBTSxVQUFVLEdBQUcsZUFBZSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN2RSxNQUFNLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMvQztRQUNELElBQUksTUFBTSxJQUFJLFFBQVEsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLEVBQUU7WUFDakYsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7YUFDeEM7WUFDRCxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDekM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuY29uc3QgX1NFTEVDVE9SX1JFR0VYUCA9IG5ldyBSZWdFeHAoXG4gICAgJyhcXFxcOm5vdFxcXFwoKXwnICsgICAgICAgICAgICAgICAvLyAxOiBcIjpub3QoXCJcbiAgICAgICAgJygoW1xcXFwuXFxcXCNdPylbLVxcXFx3XSspfCcgKyAgLy8gMjogXCJ0YWdcIjsgMzogXCIuXCIvXCIjXCI7XG4gICAgICAgIC8vIFwiLVwiIHNob3VsZCBhcHBlYXIgZmlyc3QgaW4gdGhlIHJlZ2V4cCBiZWxvdyBhcyBGRjMxIHBhcnNlcyBcIlsuLVxcd11cIiBhcyBhIHJhbmdlXG4gICAgICAgIC8vIDQ6IGF0dHJpYnV0ZTsgNTogYXR0cmlidXRlX3N0cmluZzsgNjogYXR0cmlidXRlX3ZhbHVlXG4gICAgICAgICcoPzpcXFxcWyhbLS5cXFxcdypcXFxcXFxcXCRdKykoPzo9KFtcXFwiXFwnXT8pKFteXFxcXF1cXFwiXFwnXSopXFxcXDUpP1xcXFxdKXwnICsgIC8vIFwiW25hbWVdXCIsIFwiW25hbWU9dmFsdWVdXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBcIltuYW1lPVwidmFsdWVcIl1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFwiW25hbWU9J3ZhbHVlJ11cIlxuICAgICAgICAnKFxcXFwpKXwnICsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyA3OiBcIilcIlxuICAgICAgICAnKFxcXFxzKixcXFxccyopJywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDg6IFwiLFwiXG4gICAgJ2cnKTtcblxuLyoqXG4gKiBUaGVzZSBvZmZzZXRzIHNob3VsZCBtYXRjaCB0aGUgbWF0Y2gtZ3JvdXBzIGluIGBfU0VMRUNUT1JfUkVHRVhQYCBvZmZzZXRzLlxuICovXG5jb25zdCBlbnVtIFNlbGVjdG9yUmVnZXhwIHtcbiAgQUxMID0gMCwgIC8vIFRoZSB3aG9sZSBtYXRjaFxuICBOT1QgPSAxLFxuICBUQUcgPSAyLFxuICBQUkVGSVggPSAzLFxuICBBVFRSSUJVVEUgPSA0LFxuICBBVFRSSUJVVEVfU1RSSU5HID0gNSxcbiAgQVRUUklCVVRFX1ZBTFVFID0gNixcbiAgTk9UX0VORCA9IDcsXG4gIFNFUEFSQVRPUiA9IDgsXG59XG4vKipcbiAqIEEgY3NzIHNlbGVjdG9yIGNvbnRhaW5zIGFuIGVsZW1lbnQgbmFtZSxcbiAqIGNzcyBjbGFzc2VzIGFuZCBhdHRyaWJ1dGUvdmFsdWUgcGFpcnMgd2l0aCB0aGUgcHVycG9zZVxuICogb2Ygc2VsZWN0aW5nIHN1YnNldHMgb3V0IG9mIHRoZW0uXG4gKi9cbmV4cG9ydCBjbGFzcyBDc3NTZWxlY3RvciB7XG4gIGVsZW1lbnQ6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgY2xhc3NOYW1lczogc3RyaW5nW10gPSBbXTtcbiAgLyoqXG4gICAqIFRoZSBzZWxlY3RvcnMgYXJlIGVuY29kZWQgaW4gcGFpcnMgd2hlcmU6XG4gICAqIC0gZXZlbiBsb2NhdGlvbnMgYXJlIGF0dHJpYnV0ZSBuYW1lc1xuICAgKiAtIG9kZCBsb2NhdGlvbnMgYXJlIGF0dHJpYnV0ZSB2YWx1ZXMuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIFNlbGVjdG9yOiBgW2tleTE9dmFsdWUxXVtrZXkyXWAgd291bGQgcGFyc2UgdG86XG4gICAqIGBgYFxuICAgKiBbJ2tleTEnLCAndmFsdWUxJywgJ2tleTInLCAnJ11cbiAgICogYGBgXG4gICAqL1xuICBhdHRyczogc3RyaW5nW10gPSBbXTtcbiAgbm90U2VsZWN0b3JzOiBDc3NTZWxlY3RvcltdID0gW107XG5cbiAgc3RhdGljIHBhcnNlKHNlbGVjdG9yOiBzdHJpbmcpOiBDc3NTZWxlY3RvcltdIHtcbiAgICBjb25zdCByZXN1bHRzOiBDc3NTZWxlY3RvcltdID0gW107XG4gICAgY29uc3QgX2FkZFJlc3VsdCA9IChyZXM6IENzc1NlbGVjdG9yW10sIGNzc1NlbDogQ3NzU2VsZWN0b3IpID0+IHtcbiAgICAgIGlmIChjc3NTZWwubm90U2VsZWN0b3JzLmxlbmd0aCA+IDAgJiYgIWNzc1NlbC5lbGVtZW50ICYmIGNzc1NlbC5jbGFzc05hbWVzLmxlbmd0aCA9PSAwICYmXG4gICAgICAgICAgY3NzU2VsLmF0dHJzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGNzc1NlbC5lbGVtZW50ID0gJyonO1xuICAgICAgfVxuICAgICAgcmVzLnB1c2goY3NzU2VsKTtcbiAgICB9O1xuICAgIGxldCBjc3NTZWxlY3RvciA9IG5ldyBDc3NTZWxlY3RvcigpO1xuICAgIGxldCBtYXRjaDogc3RyaW5nW118bnVsbDtcbiAgICBsZXQgY3VycmVudCA9IGNzc1NlbGVjdG9yO1xuICAgIGxldCBpbk5vdCA9IGZhbHNlO1xuICAgIF9TRUxFQ1RPUl9SRUdFWFAubGFzdEluZGV4ID0gMDtcbiAgICB3aGlsZSAobWF0Y2ggPSBfU0VMRUNUT1JfUkVHRVhQLmV4ZWMoc2VsZWN0b3IpKSB7XG4gICAgICBpZiAobWF0Y2hbU2VsZWN0b3JSZWdleHAuTk9UXSkge1xuICAgICAgICBpZiAoaW5Ob3QpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05lc3RpbmcgOm5vdCBpbiBhIHNlbGVjdG9yIGlzIG5vdCBhbGxvd2VkJyk7XG4gICAgICAgIH1cbiAgICAgICAgaW5Ob3QgPSB0cnVlO1xuICAgICAgICBjdXJyZW50ID0gbmV3IENzc1NlbGVjdG9yKCk7XG4gICAgICAgIGNzc1NlbGVjdG9yLm5vdFNlbGVjdG9ycy5wdXNoKGN1cnJlbnQpO1xuICAgICAgfVxuICAgICAgY29uc3QgdGFnID0gbWF0Y2hbU2VsZWN0b3JSZWdleHAuVEFHXTtcbiAgICAgIGlmICh0YWcpIHtcbiAgICAgICAgY29uc3QgcHJlZml4ID0gbWF0Y2hbU2VsZWN0b3JSZWdleHAuUFJFRklYXTtcbiAgICAgICAgaWYgKHByZWZpeCA9PT0gJyMnKSB7XG4gICAgICAgICAgLy8gI2hhc2hcbiAgICAgICAgICBjdXJyZW50LmFkZEF0dHJpYnV0ZSgnaWQnLCB0YWcuc2xpY2UoMSkpO1xuICAgICAgICB9IGVsc2UgaWYgKHByZWZpeCA9PT0gJy4nKSB7XG4gICAgICAgICAgLy8gQ2xhc3NcbiAgICAgICAgICBjdXJyZW50LmFkZENsYXNzTmFtZSh0YWcuc2xpY2UoMSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEVsZW1lbnRcbiAgICAgICAgICBjdXJyZW50LnNldEVsZW1lbnQodGFnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgYXR0cmlidXRlID0gbWF0Y2hbU2VsZWN0b3JSZWdleHAuQVRUUklCVVRFXTtcblxuICAgICAgaWYgKGF0dHJpYnV0ZSkge1xuICAgICAgICBjdXJyZW50LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgIGN1cnJlbnQudW5lc2NhcGVBdHRyaWJ1dGUoYXR0cmlidXRlKSwgbWF0Y2hbU2VsZWN0b3JSZWdleHAuQVRUUklCVVRFX1ZBTFVFXSk7XG4gICAgICB9XG4gICAgICBpZiAobWF0Y2hbU2VsZWN0b3JSZWdleHAuTk9UX0VORF0pIHtcbiAgICAgICAgaW5Ob3QgPSBmYWxzZTtcbiAgICAgICAgY3VycmVudCA9IGNzc1NlbGVjdG9yO1xuICAgICAgfVxuICAgICAgaWYgKG1hdGNoW1NlbGVjdG9yUmVnZXhwLlNFUEFSQVRPUl0pIHtcbiAgICAgICAgaWYgKGluTm90KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNdWx0aXBsZSBzZWxlY3RvcnMgaW4gOm5vdCBhcmUgbm90IHN1cHBvcnRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIF9hZGRSZXN1bHQocmVzdWx0cywgY3NzU2VsZWN0b3IpO1xuICAgICAgICBjc3NTZWxlY3RvciA9IGN1cnJlbnQgPSBuZXcgQ3NzU2VsZWN0b3IoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgX2FkZFJlc3VsdChyZXN1bHRzLCBjc3NTZWxlY3Rvcik7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICAvKipcbiAgICogVW5lc2NhcGUgYFxcJGAgc2VxdWVuY2VzIGZyb20gdGhlIENTUyBhdHRyaWJ1dGUgc2VsZWN0b3IuXG4gICAqXG4gICAqIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgYCRgIGNhbiBoYXZlIGEgc3BlY2lhbCBtZWFuaW5nIGluIENTUyBzZWxlY3RvcnMsXG4gICAqIGJ1dCB3ZSBtaWdodCB3YW50IHRvIG1hdGNoIGFuIGF0dHJpYnV0ZSB0aGF0IGNvbnRhaW5zIGAkYC5cbiAgICogW01ETiB3ZWIgbGluayBmb3IgbW9yZVxuICAgKiBpbmZvXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvQXR0cmlidXRlX3NlbGVjdG9ycykuXG4gICAqIEBwYXJhbSBhdHRyIHRoZSBhdHRyaWJ1dGUgdG8gdW5lc2NhcGUuXG4gICAqIEByZXR1cm5zIHRoZSB1bmVzY2FwZWQgc3RyaW5nLlxuICAgKi9cbiAgdW5lc2NhcGVBdHRyaWJ1dGUoYXR0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgbGV0IGVzY2FwaW5nID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjaGFyID0gYXR0ci5jaGFyQXQoaSk7XG4gICAgICBpZiAoY2hhciA9PT0gJ1xcXFwnKSB7XG4gICAgICAgIGVzY2FwaW5nID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoY2hhciA9PT0gJyQnICYmICFlc2NhcGluZykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgRXJyb3IgaW4gYXR0cmlidXRlIHNlbGVjdG9yIFwiJHthdHRyfVwiLiBgICtcbiAgICAgICAgICAgIGBVbmVzY2FwZWQgXCIkXCIgaXMgbm90IHN1cHBvcnRlZC4gUGxlYXNlIGVzY2FwZSB3aXRoIFwiXFxcXCRcIi5gKTtcbiAgICAgIH1cbiAgICAgIGVzY2FwaW5nID0gZmFsc2U7XG4gICAgICByZXN1bHQgKz0gY2hhcjtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFc2NhcGUgYCRgIHNlcXVlbmNlcyBmcm9tIHRoZSBDU1MgYXR0cmlidXRlIHNlbGVjdG9yLlxuICAgKlxuICAgKiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIGAkYCBjYW4gaGF2ZSBhIHNwZWNpYWwgbWVhbmluZyBpbiBDU1Mgc2VsZWN0b3JzLFxuICAgKiB3aXRoIHRoaXMgbWV0aG9kIHdlIGFyZSBlc2NhcGluZyBgJGAgd2l0aCBgXFwkJy5cbiAgICogW01ETiB3ZWIgbGluayBmb3IgbW9yZVxuICAgKiBpbmZvXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvQXR0cmlidXRlX3NlbGVjdG9ycykuXG4gICAqIEBwYXJhbSBhdHRyIHRoZSBhdHRyaWJ1dGUgdG8gZXNjYXBlLlxuICAgKiBAcmV0dXJucyB0aGUgZXNjYXBlZCBzdHJpbmcuwqBcbiAgICovXG4gIGVzY2FwZUF0dHJpYnV0ZShhdHRyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBhdHRyLnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJykucmVwbGFjZSgvXFwkL2csICdcXFxcJCcpO1xuICB9XG5cbiAgaXNFbGVtZW50U2VsZWN0b3IoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzRWxlbWVudFNlbGVjdG9yKCkgJiYgdGhpcy5jbGFzc05hbWVzLmxlbmd0aCA9PSAwICYmIHRoaXMuYXR0cnMubGVuZ3RoID09IDAgJiZcbiAgICAgICAgdGhpcy5ub3RTZWxlY3RvcnMubGVuZ3RoID09PSAwO1xuICB9XG5cbiAgaGFzRWxlbWVudFNlbGVjdG9yKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuZWxlbWVudDtcbiAgfVxuXG4gIHNldEVsZW1lbnQoZWxlbWVudDogc3RyaW5nfG51bGwgPSBudWxsKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgfVxuXG4gIGdldEF0dHJzKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHRoaXMuY2xhc3NOYW1lcy5sZW5ndGggPiAwKSB7XG4gICAgICByZXN1bHQucHVzaCgnY2xhc3MnLCB0aGlzLmNsYXNzTmFtZXMuam9pbignICcpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC5jb25jYXQodGhpcy5hdHRycyk7XG4gIH1cblxuICBhZGRBdHRyaWJ1dGUobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nID0gJycpIHtcbiAgICB0aGlzLmF0dHJzLnB1c2gobmFtZSwgdmFsdWUgJiYgdmFsdWUudG9Mb3dlckNhc2UoKSB8fCAnJyk7XG4gIH1cblxuICBhZGRDbGFzc05hbWUobmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5jbGFzc05hbWVzLnB1c2gobmFtZS50b0xvd2VyQ2FzZSgpKTtcbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgbGV0IHJlczogc3RyaW5nID0gdGhpcy5lbGVtZW50IHx8ICcnO1xuICAgIGlmICh0aGlzLmNsYXNzTmFtZXMpIHtcbiAgICAgIHRoaXMuY2xhc3NOYW1lcy5mb3JFYWNoKGtsYXNzID0+IHJlcyArPSBgLiR7a2xhc3N9YCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmF0dHJzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYXR0cnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMuZXNjYXBlQXR0cmlidXRlKHRoaXMuYXR0cnNbaV0pO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuYXR0cnNbaSArIDFdO1xuICAgICAgICByZXMgKz0gYFske25hbWV9JHt2YWx1ZSA/ICc9JyArIHZhbHVlIDogJyd9XWA7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubm90U2VsZWN0b3JzLmZvckVhY2gobm90U2VsZWN0b3IgPT4gcmVzICs9IGA6bm90KCR7bm90U2VsZWN0b3J9KWApO1xuICAgIHJldHVybiByZXM7XG4gIH1cbn1cblxuLyoqXG4gKiBSZWFkcyBhIGxpc3Qgb2YgQ3NzU2VsZWN0b3JzIGFuZCBhbGxvd3MgdG8gY2FsY3VsYXRlIHdoaWNoIG9uZXNcbiAqIGFyZSBjb250YWluZWQgaW4gYSBnaXZlbiBDc3NTZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGNsYXNzIFNlbGVjdG9yTWF0Y2hlcjxUID0gYW55PiB7XG4gIHN0YXRpYyBjcmVhdGVOb3RNYXRjaGVyKG5vdFNlbGVjdG9yczogQ3NzU2VsZWN0b3JbXSk6IFNlbGVjdG9yTWF0Y2hlcjxudWxsPiB7XG4gICAgY29uc3Qgbm90TWF0Y2hlciA9IG5ldyBTZWxlY3Rvck1hdGNoZXI8bnVsbD4oKTtcbiAgICBub3RNYXRjaGVyLmFkZFNlbGVjdGFibGVzKG5vdFNlbGVjdG9ycywgbnVsbCk7XG4gICAgcmV0dXJuIG5vdE1hdGNoZXI7XG4gIH1cblxuICBwcml2YXRlIF9lbGVtZW50TWFwID0gbmV3IE1hcDxzdHJpbmcsIFNlbGVjdG9yQ29udGV4dDxUPltdPigpO1xuICBwcml2YXRlIF9lbGVtZW50UGFydGlhbE1hcCA9IG5ldyBNYXA8c3RyaW5nLCBTZWxlY3Rvck1hdGNoZXI8VD4+KCk7XG4gIHByaXZhdGUgX2NsYXNzTWFwID0gbmV3IE1hcDxzdHJpbmcsIFNlbGVjdG9yQ29udGV4dDxUPltdPigpO1xuICBwcml2YXRlIF9jbGFzc1BhcnRpYWxNYXAgPSBuZXcgTWFwPHN0cmluZywgU2VsZWN0b3JNYXRjaGVyPFQ+PigpO1xuICBwcml2YXRlIF9hdHRyVmFsdWVNYXAgPSBuZXcgTWFwPHN0cmluZywgTWFwPHN0cmluZywgU2VsZWN0b3JDb250ZXh0PFQ+W10+PigpO1xuICBwcml2YXRlIF9hdHRyVmFsdWVQYXJ0aWFsTWFwID0gbmV3IE1hcDxzdHJpbmcsIE1hcDxzdHJpbmcsIFNlbGVjdG9yTWF0Y2hlcjxUPj4+KCk7XG4gIHByaXZhdGUgX2xpc3RDb250ZXh0czogU2VsZWN0b3JMaXN0Q29udGV4dFtdID0gW107XG5cbiAgYWRkU2VsZWN0YWJsZXMoY3NzU2VsZWN0b3JzOiBDc3NTZWxlY3RvcltdLCBjYWxsYmFja0N0eHQ/OiBUKSB7XG4gICAgbGV0IGxpc3RDb250ZXh0OiBTZWxlY3Rvckxpc3RDb250ZXh0ID0gbnVsbCE7XG4gICAgaWYgKGNzc1NlbGVjdG9ycy5sZW5ndGggPiAxKSB7XG4gICAgICBsaXN0Q29udGV4dCA9IG5ldyBTZWxlY3Rvckxpc3RDb250ZXh0KGNzc1NlbGVjdG9ycyk7XG4gICAgICB0aGlzLl9saXN0Q29udGV4dHMucHVzaChsaXN0Q29udGV4dCk7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY3NzU2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLl9hZGRTZWxlY3RhYmxlKGNzc1NlbGVjdG9yc1tpXSwgY2FsbGJhY2tDdHh0IGFzIFQsIGxpc3RDb250ZXh0KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIG9iamVjdCB0aGF0IGNhbiBiZSBmb3VuZCBsYXRlciBvbiBieSBjYWxsaW5nIGBtYXRjaGAuXG4gICAqIEBwYXJhbSBjc3NTZWxlY3RvciBBIGNzcyBzZWxlY3RvclxuICAgKiBAcGFyYW0gY2FsbGJhY2tDdHh0IEFuIG9wYXF1ZSBvYmplY3QgdGhhdCB3aWxsIGJlIGdpdmVuIHRvIHRoZSBjYWxsYmFjayBvZiB0aGUgYG1hdGNoYCBmdW5jdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBfYWRkU2VsZWN0YWJsZShcbiAgICAgIGNzc1NlbGVjdG9yOiBDc3NTZWxlY3RvciwgY2FsbGJhY2tDdHh0OiBULCBsaXN0Q29udGV4dDogU2VsZWN0b3JMaXN0Q29udGV4dCkge1xuICAgIGxldCBtYXRjaGVyOiBTZWxlY3Rvck1hdGNoZXI8VD4gPSB0aGlzO1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjc3NTZWxlY3Rvci5lbGVtZW50O1xuICAgIGNvbnN0IGNsYXNzTmFtZXMgPSBjc3NTZWxlY3Rvci5jbGFzc05hbWVzO1xuICAgIGNvbnN0IGF0dHJzID0gY3NzU2VsZWN0b3IuYXR0cnM7XG4gICAgY29uc3Qgc2VsZWN0YWJsZSA9IG5ldyBTZWxlY3RvckNvbnRleHQoY3NzU2VsZWN0b3IsIGNhbGxiYWNrQ3R4dCwgbGlzdENvbnRleHQpO1xuXG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGlzVGVybWluYWwgPSBhdHRycy5sZW5ndGggPT09IDAgJiYgY2xhc3NOYW1lcy5sZW5ndGggPT09IDA7XG4gICAgICBpZiAoaXNUZXJtaW5hbCkge1xuICAgICAgICB0aGlzLl9hZGRUZXJtaW5hbChtYXRjaGVyLl9lbGVtZW50TWFwLCBlbGVtZW50LCBzZWxlY3RhYmxlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hdGNoZXIgPSB0aGlzLl9hZGRQYXJ0aWFsKG1hdGNoZXIuX2VsZW1lbnRQYXJ0aWFsTWFwLCBlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY2xhc3NOYW1lcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGFzc05hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGlzVGVybWluYWwgPSBhdHRycy5sZW5ndGggPT09IDAgJiYgaSA9PT0gY2xhc3NOYW1lcy5sZW5ndGggLSAxO1xuICAgICAgICBjb25zdCBjbGFzc05hbWUgPSBjbGFzc05hbWVzW2ldO1xuICAgICAgICBpZiAoaXNUZXJtaW5hbCkge1xuICAgICAgICAgIHRoaXMuX2FkZFRlcm1pbmFsKG1hdGNoZXIuX2NsYXNzTWFwLCBjbGFzc05hbWUsIHNlbGVjdGFibGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXIgPSB0aGlzLl9hZGRQYXJ0aWFsKG1hdGNoZXIuX2NsYXNzUGFydGlhbE1hcCwgY2xhc3NOYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChhdHRycykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICBjb25zdCBpc1Rlcm1pbmFsID0gaSA9PT0gYXR0cnMubGVuZ3RoIC0gMjtcbiAgICAgICAgY29uc3QgbmFtZSA9IGF0dHJzW2ldO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGF0dHJzW2kgKyAxXTtcbiAgICAgICAgaWYgKGlzVGVybWluYWwpIHtcbiAgICAgICAgICBjb25zdCB0ZXJtaW5hbE1hcCA9IG1hdGNoZXIuX2F0dHJWYWx1ZU1hcDtcbiAgICAgICAgICBsZXQgdGVybWluYWxWYWx1ZXNNYXAgPSB0ZXJtaW5hbE1hcC5nZXQobmFtZSk7XG4gICAgICAgICAgaWYgKCF0ZXJtaW5hbFZhbHVlc01hcCkge1xuICAgICAgICAgICAgdGVybWluYWxWYWx1ZXNNYXAgPSBuZXcgTWFwPHN0cmluZywgU2VsZWN0b3JDb250ZXh0PFQ+W10+KCk7XG4gICAgICAgICAgICB0ZXJtaW5hbE1hcC5zZXQobmFtZSwgdGVybWluYWxWYWx1ZXNNYXApO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9hZGRUZXJtaW5hbCh0ZXJtaW5hbFZhbHVlc01hcCwgdmFsdWUsIHNlbGVjdGFibGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHBhcnRpYWxNYXAgPSBtYXRjaGVyLl9hdHRyVmFsdWVQYXJ0aWFsTWFwO1xuICAgICAgICAgIGxldCBwYXJ0aWFsVmFsdWVzTWFwID0gcGFydGlhbE1hcC5nZXQobmFtZSk7XG4gICAgICAgICAgaWYgKCFwYXJ0aWFsVmFsdWVzTWFwKSB7XG4gICAgICAgICAgICBwYXJ0aWFsVmFsdWVzTWFwID0gbmV3IE1hcDxzdHJpbmcsIFNlbGVjdG9yTWF0Y2hlcjxUPj4oKTtcbiAgICAgICAgICAgIHBhcnRpYWxNYXAuc2V0KG5hbWUsIHBhcnRpYWxWYWx1ZXNNYXApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtYXRjaGVyID0gdGhpcy5fYWRkUGFydGlhbChwYXJ0aWFsVmFsdWVzTWFwLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hZGRUZXJtaW5hbChcbiAgICAgIG1hcDogTWFwPHN0cmluZywgU2VsZWN0b3JDb250ZXh0PFQ+W10+LCBuYW1lOiBzdHJpbmcsIHNlbGVjdGFibGU6IFNlbGVjdG9yQ29udGV4dDxUPikge1xuICAgIGxldCB0ZXJtaW5hbExpc3QgPSBtYXAuZ2V0KG5hbWUpO1xuICAgIGlmICghdGVybWluYWxMaXN0KSB7XG4gICAgICB0ZXJtaW5hbExpc3QgPSBbXTtcbiAgICAgIG1hcC5zZXQobmFtZSwgdGVybWluYWxMaXN0KTtcbiAgICB9XG4gICAgdGVybWluYWxMaXN0LnB1c2goc2VsZWN0YWJsZSk7XG4gIH1cblxuICBwcml2YXRlIF9hZGRQYXJ0aWFsKG1hcDogTWFwPHN0cmluZywgU2VsZWN0b3JNYXRjaGVyPFQ+PiwgbmFtZTogc3RyaW5nKTogU2VsZWN0b3JNYXRjaGVyPFQ+IHtcbiAgICBsZXQgbWF0Y2hlciA9IG1hcC5nZXQobmFtZSk7XG4gICAgaWYgKCFtYXRjaGVyKSB7XG4gICAgICBtYXRjaGVyID0gbmV3IFNlbGVjdG9yTWF0Y2hlcjxUPigpO1xuICAgICAgbWFwLnNldChuYW1lLCBtYXRjaGVyKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoZXI7XG4gIH1cblxuICAvKipcbiAgICogRmluZCB0aGUgb2JqZWN0cyB0aGF0IGhhdmUgYmVlbiBhZGRlZCB2aWEgYGFkZFNlbGVjdGFibGVgXG4gICAqIHdob3NlIGNzcyBzZWxlY3RvciBpcyBjb250YWluZWQgaW4gdGhlIGdpdmVuIGNzcyBzZWxlY3Rvci5cbiAgICogQHBhcmFtIGNzc1NlbGVjdG9yIEEgY3NzIHNlbGVjdG9yXG4gICAqIEBwYXJhbSBtYXRjaGVkQ2FsbGJhY2sgVGhpcyBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCB3aXRoIHRoZSBvYmplY3QgaGFuZGVkIGludG8gYGFkZFNlbGVjdGFibGVgXG4gICAqIEByZXR1cm4gYm9vbGVhbiB0cnVlIGlmIGEgbWF0Y2ggd2FzIGZvdW5kXG4gICAqL1xuICBtYXRjaChjc3NTZWxlY3RvcjogQ3NzU2VsZWN0b3IsIG1hdGNoZWRDYWxsYmFjazogKChjOiBDc3NTZWxlY3RvciwgYTogVCkgPT4gdm9pZCl8bnVsbCk6IGJvb2xlYW4ge1xuICAgIGxldCByZXN1bHQgPSBmYWxzZTtcbiAgICBjb25zdCBlbGVtZW50ID0gY3NzU2VsZWN0b3IuZWxlbWVudCE7XG4gICAgY29uc3QgY2xhc3NOYW1lcyA9IGNzc1NlbGVjdG9yLmNsYXNzTmFtZXM7XG4gICAgY29uc3QgYXR0cnMgPSBjc3NTZWxlY3Rvci5hdHRycztcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fbGlzdENvbnRleHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLl9saXN0Q29udGV4dHNbaV0uYWxyZWFkeU1hdGNoZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXN1bHQgPSB0aGlzLl9tYXRjaFRlcm1pbmFsKHRoaXMuX2VsZW1lbnRNYXAsIGVsZW1lbnQsIGNzc1NlbGVjdG9yLCBtYXRjaGVkQ2FsbGJhY2spIHx8IHJlc3VsdDtcbiAgICByZXN1bHQgPSB0aGlzLl9tYXRjaFBhcnRpYWwodGhpcy5fZWxlbWVudFBhcnRpYWxNYXAsIGVsZW1lbnQsIGNzc1NlbGVjdG9yLCBtYXRjaGVkQ2FsbGJhY2spIHx8XG4gICAgICAgIHJlc3VsdDtcblxuICAgIGlmIChjbGFzc05hbWVzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsYXNzTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gY2xhc3NOYW1lc1tpXTtcbiAgICAgICAgcmVzdWx0ID1cbiAgICAgICAgICAgIHRoaXMuX21hdGNoVGVybWluYWwodGhpcy5fY2xhc3NNYXAsIGNsYXNzTmFtZSwgY3NzU2VsZWN0b3IsIG1hdGNoZWRDYWxsYmFjaykgfHwgcmVzdWx0O1xuICAgICAgICByZXN1bHQgPVxuICAgICAgICAgICAgdGhpcy5fbWF0Y2hQYXJ0aWFsKHRoaXMuX2NsYXNzUGFydGlhbE1hcCwgY2xhc3NOYW1lLCBjc3NTZWxlY3RvciwgbWF0Y2hlZENhbGxiYWNrKSB8fFxuICAgICAgICAgICAgcmVzdWx0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChhdHRycykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICBjb25zdCBuYW1lID0gYXR0cnNbaV07XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXR0cnNbaSArIDFdO1xuXG4gICAgICAgIGNvbnN0IHRlcm1pbmFsVmFsdWVzTWFwID0gdGhpcy5fYXR0clZhbHVlTWFwLmdldChuYW1lKSE7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIHJlc3VsdCA9XG4gICAgICAgICAgICAgIHRoaXMuX21hdGNoVGVybWluYWwodGVybWluYWxWYWx1ZXNNYXAsICcnLCBjc3NTZWxlY3RvciwgbWF0Y2hlZENhbGxiYWNrKSB8fCByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID1cbiAgICAgICAgICAgIHRoaXMuX21hdGNoVGVybWluYWwodGVybWluYWxWYWx1ZXNNYXAsIHZhbHVlLCBjc3NTZWxlY3RvciwgbWF0Y2hlZENhbGxiYWNrKSB8fCByZXN1bHQ7XG5cbiAgICAgICAgY29uc3QgcGFydGlhbFZhbHVlc01hcCA9IHRoaXMuX2F0dHJWYWx1ZVBhcnRpYWxNYXAuZ2V0KG5hbWUpITtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgcmVzdWx0ID0gdGhpcy5fbWF0Y2hQYXJ0aWFsKHBhcnRpYWxWYWx1ZXNNYXAsICcnLCBjc3NTZWxlY3RvciwgbWF0Y2hlZENhbGxiYWNrKSB8fCByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID1cbiAgICAgICAgICAgIHRoaXMuX21hdGNoUGFydGlhbChwYXJ0aWFsVmFsdWVzTWFwLCB2YWx1ZSwgY3NzU2VsZWN0b3IsIG1hdGNoZWRDYWxsYmFjaykgfHwgcmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbWF0Y2hUZXJtaW5hbChcbiAgICAgIG1hcDogTWFwPHN0cmluZywgU2VsZWN0b3JDb250ZXh0PFQ+W10+LCBuYW1lOiBzdHJpbmcsIGNzc1NlbGVjdG9yOiBDc3NTZWxlY3RvcixcbiAgICAgIG1hdGNoZWRDYWxsYmFjazogKChjOiBDc3NTZWxlY3RvciwgYTogYW55KSA9PiB2b2lkKXxudWxsKTogYm9vbGVhbiB7XG4gICAgaWYgKCFtYXAgfHwgdHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHNlbGVjdGFibGVzOiBTZWxlY3RvckNvbnRleHQ8VD5bXSA9IG1hcC5nZXQobmFtZSkgfHwgW107XG4gICAgY29uc3Qgc3RhclNlbGVjdGFibGVzOiBTZWxlY3RvckNvbnRleHQ8VD5bXSA9IG1hcC5nZXQoJyonKSE7XG4gICAgaWYgKHN0YXJTZWxlY3RhYmxlcykge1xuICAgICAgc2VsZWN0YWJsZXMgPSBzZWxlY3RhYmxlcy5jb25jYXQoc3RhclNlbGVjdGFibGVzKTtcbiAgICB9XG4gICAgaWYgKHNlbGVjdGFibGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBsZXQgc2VsZWN0YWJsZTogU2VsZWN0b3JDb250ZXh0PFQ+O1xuICAgIGxldCByZXN1bHQgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdGFibGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzZWxlY3RhYmxlID0gc2VsZWN0YWJsZXNbaV07XG4gICAgICByZXN1bHQgPSBzZWxlY3RhYmxlLmZpbmFsaXplKGNzc1NlbGVjdG9yLCBtYXRjaGVkQ2FsbGJhY2spIHx8IHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX21hdGNoUGFydGlhbChcbiAgICAgIG1hcDogTWFwPHN0cmluZywgU2VsZWN0b3JNYXRjaGVyPFQ+PiwgbmFtZTogc3RyaW5nLCBjc3NTZWxlY3RvcjogQ3NzU2VsZWN0b3IsXG4gICAgICBtYXRjaGVkQ2FsbGJhY2s6ICgoYzogQ3NzU2VsZWN0b3IsIGE6IGFueSkgPT4gdm9pZCl8bnVsbCk6IGJvb2xlYW4ge1xuICAgIGlmICghbWFwIHx8IHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IG5lc3RlZFNlbGVjdG9yID0gbWFwLmdldChuYW1lKTtcbiAgICBpZiAoIW5lc3RlZFNlbGVjdG9yKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIFRPRE8ocGVyZik6IGdldCByaWQgb2YgcmVjdXJzaW9uIGFuZCBtZWFzdXJlIGFnYWluXG4gICAgLy8gVE9ETyhwZXJmKTogZG9uJ3QgcGFzcyB0aGUgd2hvbGUgc2VsZWN0b3IgaW50byB0aGUgcmVjdXJzaW9uLFxuICAgIC8vIGJ1dCBvbmx5IHRoZSBub3QgcHJvY2Vzc2VkIHBhcnRzXG4gICAgcmV0dXJuIG5lc3RlZFNlbGVjdG9yLm1hdGNoKGNzc1NlbGVjdG9yLCBtYXRjaGVkQ2FsbGJhY2spO1xuICB9XG59XG5cblxuZXhwb3J0IGNsYXNzIFNlbGVjdG9yTGlzdENvbnRleHQge1xuICBhbHJlYWR5TWF0Y2hlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBzZWxlY3RvcnM6IENzc1NlbGVjdG9yW10pIHt9XG59XG5cbi8vIFN0b3JlIGNvbnRleHQgdG8gcGFzcyBiYWNrIHNlbGVjdG9yIGFuZCBjb250ZXh0IHdoZW4gYSBzZWxlY3RvciBpcyBtYXRjaGVkXG5leHBvcnQgY2xhc3MgU2VsZWN0b3JDb250ZXh0PFQgPSBhbnk+IHtcbiAgbm90U2VsZWN0b3JzOiBDc3NTZWxlY3RvcltdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHNlbGVjdG9yOiBDc3NTZWxlY3RvciwgcHVibGljIGNiQ29udGV4dDogVCwgcHVibGljIGxpc3RDb250ZXh0OiBTZWxlY3Rvckxpc3RDb250ZXh0KSB7XG4gICAgdGhpcy5ub3RTZWxlY3RvcnMgPSBzZWxlY3Rvci5ub3RTZWxlY3RvcnM7XG4gIH1cblxuICBmaW5hbGl6ZShjc3NTZWxlY3RvcjogQ3NzU2VsZWN0b3IsIGNhbGxiYWNrOiAoKGM6IENzc1NlbGVjdG9yLCBhOiBUKSA9PiB2b2lkKXxudWxsKTogYm9vbGVhbiB7XG4gICAgbGV0IHJlc3VsdCA9IHRydWU7XG4gICAgaWYgKHRoaXMubm90U2VsZWN0b3JzLmxlbmd0aCA+IDAgJiYgKCF0aGlzLmxpc3RDb250ZXh0IHx8ICF0aGlzLmxpc3RDb250ZXh0LmFscmVhZHlNYXRjaGVkKSkge1xuICAgICAgY29uc3Qgbm90TWF0Y2hlciA9IFNlbGVjdG9yTWF0Y2hlci5jcmVhdGVOb3RNYXRjaGVyKHRoaXMubm90U2VsZWN0b3JzKTtcbiAgICAgIHJlc3VsdCA9ICFub3RNYXRjaGVyLm1hdGNoKGNzc1NlbGVjdG9yLCBudWxsKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdCAmJiBjYWxsYmFjayAmJiAoIXRoaXMubGlzdENvbnRleHQgfHwgIXRoaXMubGlzdENvbnRleHQuYWxyZWFkeU1hdGNoZWQpKSB7XG4gICAgICBpZiAodGhpcy5saXN0Q29udGV4dCkge1xuICAgICAgICB0aGlzLmxpc3RDb250ZXh0LmFscmVhZHlNYXRjaGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrKHRoaXMuc2VsZWN0b3IsIHRoaXMuY2JDb250ZXh0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuIl19