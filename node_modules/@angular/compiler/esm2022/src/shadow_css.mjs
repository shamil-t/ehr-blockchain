/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * The following set contains all keywords that can be used in the animation css shorthand
 * property and is used during the scoping of keyframes to make sure such keywords
 * are not modified.
 */
const animationKeywords = new Set([
    // global values
    'inherit', 'initial', 'revert', 'unset',
    // animation-direction
    'alternate', 'alternate-reverse', 'normal', 'reverse',
    // animation-fill-mode
    'backwards', 'both', 'forwards', 'none',
    // animation-play-state
    'paused', 'running',
    // animation-timing-function
    'ease', 'ease-in', 'ease-in-out', 'ease-out', 'linear', 'step-start', 'step-end',
    // `steps()` function
    'end', 'jump-both', 'jump-end', 'jump-none', 'jump-start', 'start'
]);
/**
 * The following class has its origin from a port of shadowCSS from webcomponents.js to TypeScript.
 * It has since diverge in many ways to tailor Angular's needs.
 *
 * Source:
 * https://github.com/webcomponents/webcomponentsjs/blob/4efecd7e0e/src/ShadowCSS/ShadowCSS.js
 *
 * The original file level comment is reproduced below
 */
/*
  This is a limited shim for ShadowDOM css styling.
  https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#styles

  The intention here is to support only the styling features which can be
  relatively simply implemented. The goal is to allow users to avoid the
  most obvious pitfalls and do so without compromising performance significantly.
  For ShadowDOM styling that's not covered here, a set of best practices
  can be provided that should allow users to accomplish more complex styling.

  The following is a list of specific ShadowDOM styling features and a brief
  discussion of the approach used to shim.

  Shimmed features:

  * :host, :host-context: ShadowDOM allows styling of the shadowRoot's host
  element using the :host rule. To shim this feature, the :host styles are
  reformatted and prefixed with a given scope name and promoted to a
  document level stylesheet.
  For example, given a scope name of .foo, a rule like this:

    :host {
        background: red;
      }
    }

  becomes:

    .foo {
      background: red;
    }

  * encapsulation: Styles defined within ShadowDOM, apply only to
  dom inside the ShadowDOM.
  The selectors are scoped by adding an attribute selector suffix to each
  simple selector that contains the host element tag name. Each element
  in the element's ShadowDOM template is also given the scope attribute.
  Thus, these rules match only elements that have the scope attribute.
  For example, given a scope name of x-foo, a rule like this:

    div {
      font-weight: bold;
    }

  becomes:

    div[x-foo] {
      font-weight: bold;
    }

  Note that elements that are dynamically added to a scope must have the scope
  selector added to them manually.

  * upper/lower bound encapsulation: Styles which are defined outside a
  shadowRoot should not cross the ShadowDOM boundary and should not apply
  inside a shadowRoot.

  This styling behavior is not emulated. Some possible ways to do this that
  were rejected due to complexity and/or performance concerns include: (1) reset
  every possible property for every possible selector for a given scope name;
  (2) re-implement css in javascript.

  As an alternative, users should make sure to use selectors
  specific to the scope in which they are working.

  * ::distributed: This behavior is not emulated. It's often not necessary
  to style the contents of a specific insertion point and instead, descendants
  of the host element can be styled selectively. Users can also create an
  extra node around an insertion point and style that node's contents
  via descendent selectors. For example, with a shadowRoot like this:

    <style>
      ::content(div) {
        background: red;
      }
    </style>
    <content></content>

  could become:

    <style>
      / *@polyfill .content-container div * /
      ::content(div) {
        background: red;
      }
    </style>
    <div class="content-container">
      <content></content>
    </div>

  Note the use of @polyfill in the comment above a ShadowDOM specific style
  declaration. This is a directive to the styling shim to use the selector
  in comments in lieu of the next selector when running under polyfill.
*/
export class ShadowCss {
    constructor() {
        /**
         * Regular expression used to extrapolate the possible keyframes from an
         * animation declaration (with possibly multiple animation definitions)
         *
         * The regular expression can be divided in three parts
         *  - (^|\s+)
         *    simply captures how many (if any) leading whitespaces are present
         *  - (?:(?:(['"])((?:\\\\|\\\2|(?!\2).)+)\2)|(-?[A-Za-z][\w\-]*))
         *    captures two different possible keyframes, ones which are quoted or ones which are valid css
         * idents (custom properties excluded)
         *  - (?=[,\s;]|$)
         *    simply matches the end of the possible keyframe, valid endings are: a comma, a space, a
         * semicolon or the end of the string
         */
        this._animationDeclarationKeyframesRe = /(^|\s+)(?:(?:(['"])((?:\\\\|\\\2|(?!\2).)+)\2)|(-?[A-Za-z][\w\-]*))(?=[,\s]|$)/g;
    }
    /*
     * Shim some cssText with the given selector. Returns cssText that can be included in the document
     *
     * The selector is the attribute added to all elements inside the host,
     * The hostSelector is the attribute added to the host itself.
     */
    shimCssText(cssText, selector, hostSelector = '') {
        // **NOTE**: Do not strip comments as this will cause component sourcemaps to break
        // due to shift in lines.
        // Collect comments and replace them with a placeholder, this is done to avoid complicating
        // the rule parsing RegExp and keep it safer.
        const comments = [];
        cssText = cssText.replace(_commentRe, (m) => {
            if (m.match(_commentWithHashRe)) {
                comments.push(m);
            }
            else {
                // Replace non hash comments with empty lines.
                // This is done so that we do not leak any senstive data in comments.
                const newLinesMatches = m.match(_newLinesRe);
                comments.push((newLinesMatches?.join('') ?? '') + '\n');
            }
            return COMMENT_PLACEHOLDER;
        });
        cssText = this._insertDirectives(cssText);
        const scopedCssText = this._scopeCssText(cssText, selector, hostSelector);
        // Add back comments at the original position.
        let commentIdx = 0;
        return scopedCssText.replace(_commentWithHashPlaceHolderRe, () => comments[commentIdx++]);
    }
    _insertDirectives(cssText) {
        cssText = this._insertPolyfillDirectivesInCssText(cssText);
        return this._insertPolyfillRulesInCssText(cssText);
    }
    /**
     * Process styles to add scope to keyframes.
     *
     * Modify both the names of the keyframes defined in the component styles and also the css
     * animation rules using them.
     *
     * Animation rules using keyframes defined elsewhere are not modified to allow for globally
     * defined keyframes.
     *
     * For example, we convert this css:
     *
     * ```
     * .box {
     *   animation: box-animation 1s forwards;
     * }
     *
     * @keyframes box-animation {
     *   to {
     *     background-color: green;
     *   }
     * }
     * ```
     *
     * to this:
     *
     * ```
     * .box {
     *   animation: scopeName_box-animation 1s forwards;
     * }
     *
     * @keyframes scopeName_box-animation {
     *   to {
     *     background-color: green;
     *   }
     * }
     * ```
     *
     * @param cssText the component's css text that needs to be scoped.
     * @param scopeSelector the component's scope selector.
     *
     * @returns the scoped css text.
     */
    _scopeKeyframesRelatedCss(cssText, scopeSelector) {
        const unscopedKeyframesSet = new Set();
        const scopedKeyframesCssText = processRules(cssText, rule => this._scopeLocalKeyframeDeclarations(rule, scopeSelector, unscopedKeyframesSet));
        return processRules(scopedKeyframesCssText, rule => this._scopeAnimationRule(rule, scopeSelector, unscopedKeyframesSet));
    }
    /**
     * Scopes local keyframes names, returning the updated css rule and it also
     * adds the original keyframe name to a provided set to collect all keyframes names
     * so that it can later be used to scope the animation rules.
     *
     * For example, it takes a rule such as:
     *
     * ```
     * @keyframes box-animation {
     *   to {
     *     background-color: green;
     *   }
     * }
     * ```
     *
     * and returns:
     *
     * ```
     * @keyframes scopeName_box-animation {
     *   to {
     *     background-color: green;
     *   }
     * }
     * ```
     * and as a side effect it adds "box-animation" to the `unscopedKeyframesSet` set
     *
     * @param cssRule the css rule to process.
     * @param scopeSelector the component's scope selector.
     * @param unscopedKeyframesSet the set of unscoped keyframes names (which can be
     * modified as a side effect)
     *
     * @returns the css rule modified with the scoped keyframes name.
     */
    _scopeLocalKeyframeDeclarations(rule, scopeSelector, unscopedKeyframesSet) {
        return {
            ...rule,
            selector: rule.selector.replace(/(^@(?:-webkit-)?keyframes(?:\s+))(['"]?)(.+)\2(\s*)$/, (_, start, quote, keyframeName, endSpaces) => {
                unscopedKeyframesSet.add(unescapeQuotes(keyframeName, quote));
                return `${start}${quote}${scopeSelector}_${keyframeName}${quote}${endSpaces}`;
            }),
        };
    }
    /**
     * Function used to scope a keyframes name (obtained from an animation declaration)
     * using an existing set of unscopedKeyframes names to discern if the scoping needs to be
     * performed (keyframes names of keyframes not defined in the component's css need not to be
     * scoped).
     *
     * @param keyframe the keyframes name to check.
     * @param scopeSelector the component's scope selector.
     * @param unscopedKeyframesSet the set of unscoped keyframes names.
     *
     * @returns the scoped name of the keyframe, or the original name is the name need not to be
     * scoped.
     */
    _scopeAnimationKeyframe(keyframe, scopeSelector, unscopedKeyframesSet) {
        return keyframe.replace(/^(\s*)(['"]?)(.+?)\2(\s*)$/, (_, spaces1, quote, name, spaces2) => {
            name = `${unscopedKeyframesSet.has(unescapeQuotes(name, quote)) ? scopeSelector + '_' : ''}${name}`;
            return `${spaces1}${quote}${name}${quote}${spaces2}`;
        });
    }
    /**
     * Scope an animation rule so that the keyframes mentioned in such rule
     * are scoped if defined in the component's css and left untouched otherwise.
     *
     * It can scope values of both the 'animation' and 'animation-name' properties.
     *
     * @param rule css rule to scope.
     * @param scopeSelector the component's scope selector.
     * @param unscopedKeyframesSet the set of unscoped keyframes names.
     *
     * @returns the updated css rule.
     **/
    _scopeAnimationRule(rule, scopeSelector, unscopedKeyframesSet) {
        let content = rule.content.replace(/((?:^|\s+|;)(?:-webkit-)?animation(?:\s*):(?:\s*))([^;]+)/g, (_, start, animationDeclarations) => start +
            animationDeclarations.replace(this._animationDeclarationKeyframesRe, (original, leadingSpaces, quote = '', quotedName, nonQuotedName) => {
                if (quotedName) {
                    return `${leadingSpaces}${this._scopeAnimationKeyframe(`${quote}${quotedName}${quote}`, scopeSelector, unscopedKeyframesSet)}`;
                }
                else {
                    return animationKeywords.has(nonQuotedName) ?
                        original :
                        `${leadingSpaces}${this._scopeAnimationKeyframe(nonQuotedName, scopeSelector, unscopedKeyframesSet)}`;
                }
            }));
        content = content.replace(/((?:^|\s+|;)(?:-webkit-)?animation-name(?:\s*):(?:\s*))([^;]+)/g, (_match, start, commaSeparatedKeyframes) => `${start}${commaSeparatedKeyframes.split(',')
            .map((keyframe) => this._scopeAnimationKeyframe(keyframe, scopeSelector, unscopedKeyframesSet))
            .join(',')}`);
        return { ...rule, content };
    }
    /*
     * Process styles to convert native ShadowDOM rules that will trip
     * up the css parser; we rely on decorating the stylesheet with inert rules.
     *
     * For example, we convert this rule:
     *
     * polyfill-next-selector { content: ':host menu-item'; }
     * ::content menu-item {
     *
     * to this:
     *
     * scopeName menu-item {
     *
     **/
    _insertPolyfillDirectivesInCssText(cssText) {
        return cssText.replace(_cssContentNextSelectorRe, function (...m) {
            return m[2] + '{';
        });
    }
    /*
     * Process styles to add rules which will only apply under the polyfill
     *
     * For example, we convert this rule:
     *
     * polyfill-rule {
     *   content: ':host menu-item';
     * ...
     * }
     *
     * to this:
     *
     * scopeName menu-item {...}
     *
     **/
    _insertPolyfillRulesInCssText(cssText) {
        return cssText.replace(_cssContentRuleRe, (...m) => {
            const rule = m[0].replace(m[1], '').replace(m[2], '');
            return m[4] + rule;
        });
    }
    /* Ensure styles are scoped. Pseudo-scoping takes a rule like:
     *
     *  .foo {... }
     *
     *  and converts this to
     *
     *  scopeName .foo { ... }
     */
    _scopeCssText(cssText, scopeSelector, hostSelector) {
        const unscopedRules = this._extractUnscopedRulesFromCssText(cssText);
        // replace :host and :host-context -shadowcsshost and -shadowcsshost respectively
        cssText = this._insertPolyfillHostInCssText(cssText);
        cssText = this._convertColonHost(cssText);
        cssText = this._convertColonHostContext(cssText);
        cssText = this._convertShadowDOMSelectors(cssText);
        if (scopeSelector) {
            cssText = this._scopeKeyframesRelatedCss(cssText, scopeSelector);
            cssText = this._scopeSelectors(cssText, scopeSelector, hostSelector);
        }
        cssText = cssText + '\n' + unscopedRules;
        return cssText.trim();
    }
    /*
     * Process styles to add rules which will only apply under the polyfill
     * and do not process via CSSOM. (CSSOM is destructive to rules on rare
     * occasions, e.g. -webkit-calc on Safari.)
     * For example, we convert this rule:
     *
     * @polyfill-unscoped-rule {
     *   content: 'menu-item';
     * ... }
     *
     * to this:
     *
     * menu-item {...}
     *
     **/
    _extractUnscopedRulesFromCssText(cssText) {
        let r = '';
        let m;
        _cssContentUnscopedRuleRe.lastIndex = 0;
        while ((m = _cssContentUnscopedRuleRe.exec(cssText)) !== null) {
            const rule = m[0].replace(m[2], '').replace(m[1], m[4]);
            r += rule + '\n\n';
        }
        return r;
    }
    /*
     * convert a rule like :host(.foo) > .bar { }
     *
     * to
     *
     * .foo<scopeName> > .bar
     */
    _convertColonHost(cssText) {
        return cssText.replace(_cssColonHostRe, (_, hostSelectors, otherSelectors) => {
            if (hostSelectors) {
                const convertedSelectors = [];
                const hostSelectorArray = hostSelectors.split(',').map((p) => p.trim());
                for (const hostSelector of hostSelectorArray) {
                    if (!hostSelector)
                        break;
                    const convertedSelector = _polyfillHostNoCombinator + hostSelector.replace(_polyfillHost, '') + otherSelectors;
                    convertedSelectors.push(convertedSelector);
                }
                return convertedSelectors.join(',');
            }
            else {
                return _polyfillHostNoCombinator + otherSelectors;
            }
        });
    }
    /*
     * convert a rule like :host-context(.foo) > .bar { }
     *
     * to
     *
     * .foo<scopeName> > .bar, .foo <scopeName> > .bar { }
     *
     * and
     *
     * :host-context(.foo:host) .bar { ... }
     *
     * to
     *
     * .foo<scopeName> .bar { ... }
     */
    _convertColonHostContext(cssText) {
        return cssText.replace(_cssColonHostContextReGlobal, (selectorText) => {
            // We have captured a selector that contains a `:host-context` rule.
            // For backward compatibility `:host-context` may contain a comma separated list of selectors.
            // Each context selector group will contain a list of host-context selectors that must match
            // an ancestor of the host.
            // (Normally `contextSelectorGroups` will only contain a single array of context selectors.)
            const contextSelectorGroups = [[]];
            // There may be more than `:host-context` in this selector so `selectorText` could look like:
            // `:host-context(.one):host-context(.two)`.
            // Execute `_cssColonHostContextRe` over and over until we have extracted all the
            // `:host-context` selectors from this selector.
            let match;
            while ((match = _cssColonHostContextRe.exec(selectorText))) {
                // `match` = [':host-context(<selectors>)<rest>', <selectors>, <rest>]
                // The `<selectors>` could actually be a comma separated list: `:host-context(.one, .two)`.
                const newContextSelectors = (match[1] ?? '').trim().split(',').map((m) => m.trim()).filter((m) => m !== '');
                // We must duplicate the current selector group for each of these new selectors.
                // For example if the current groups are:
                // ```
                // [
                //   ['a', 'b', 'c'],
                //   ['x', 'y', 'z'],
                // ]
                // ```
                // And we have a new set of comma separated selectors: `:host-context(m,n)` then the new
                // groups are:
                // ```
                // [
                //   ['a', 'b', 'c', 'm'],
                //   ['x', 'y', 'z', 'm'],
                //   ['a', 'b', 'c', 'n'],
                //   ['x', 'y', 'z', 'n'],
                // ]
                // ```
                const contextSelectorGroupsLength = contextSelectorGroups.length;
                repeatGroups(contextSelectorGroups, newContextSelectors.length);
                for (let i = 0; i < newContextSelectors.length; i++) {
                    for (let j = 0; j < contextSelectorGroupsLength; j++) {
                        contextSelectorGroups[j + i * contextSelectorGroupsLength].push(newContextSelectors[i]);
                    }
                }
                // Update the `selectorText` and see repeat to see if there are more `:host-context`s.
                selectorText = match[2];
            }
            // The context selectors now must be combined with each other to capture all the possible
            // selectors that `:host-context` can match. See `combineHostContextSelectors()` for more
            // info about how this is done.
            return contextSelectorGroups
                .map((contextSelectors) => combineHostContextSelectors(contextSelectors, selectorText))
                .join(', ');
        });
    }
    /*
     * Convert combinators like ::shadow and pseudo-elements like ::content
     * by replacing with space.
     */
    _convertShadowDOMSelectors(cssText) {
        return _shadowDOMSelectorsRe.reduce((result, pattern) => result.replace(pattern, ' '), cssText);
    }
    // change a selector like 'div' to 'name div'
    _scopeSelectors(cssText, scopeSelector, hostSelector) {
        return processRules(cssText, (rule) => {
            let selector = rule.selector;
            let content = rule.content;
            if (rule.selector[0] !== '@') {
                selector = this._scopeSelector(rule.selector, scopeSelector, hostSelector);
            }
            else if (rule.selector.startsWith('@media') || rule.selector.startsWith('@supports') ||
                rule.selector.startsWith('@document') || rule.selector.startsWith('@layer') ||
                rule.selector.startsWith('@container') || rule.selector.startsWith('@scope')) {
                content = this._scopeSelectors(rule.content, scopeSelector, hostSelector);
            }
            else if (rule.selector.startsWith('@font-face') || rule.selector.startsWith('@page')) {
                content = this._stripScopingSelectors(rule.content);
            }
            return new CssRule(selector, content);
        });
    }
    /**
     * Handle a css text that is within a rule that should not contain scope selectors by simply
     * removing them! An example of such a rule is `@font-face`.
     *
     * `@font-face` rules cannot contain nested selectors. Nor can they be nested under a selector.
     * Normally this would be a syntax error by the author of the styles. But in some rare cases, such
     * as importing styles from a library, and applying `:host ::ng-deep` to the imported styles, we
     * can end up with broken css if the imported styles happen to contain @font-face rules.
     *
     * For example:
     *
     * ```
     * :host ::ng-deep {
     *   import 'some/lib/containing/font-face';
     * }
     *
     * Similar logic applies to `@page` rules which can contain a particular set of properties,
     * as well as some specific at-rules. Since they can't be encapsulated, we have to strip
     * any scoping selectors from them. For more information: https://www.w3.org/TR/css-page-3
     * ```
     */
    _stripScopingSelectors(cssText) {
        return processRules(cssText, (rule) => {
            const selector = rule.selector.replace(_shadowDeepSelectors, ' ')
                .replace(_polyfillHostNoCombinatorRe, ' ');
            return new CssRule(selector, rule.content);
        });
    }
    _scopeSelector(selector, scopeSelector, hostSelector) {
        return selector.split(',')
            .map((part) => part.trim().split(_shadowDeepSelectors))
            .map((deepParts) => {
            const [shallowPart, ...otherParts] = deepParts;
            const applyScope = (shallowPart) => {
                if (this._selectorNeedsScoping(shallowPart, scopeSelector)) {
                    return this._applySelectorScope(shallowPart, scopeSelector, hostSelector);
                }
                else {
                    return shallowPart;
                }
            };
            return [applyScope(shallowPart), ...otherParts].join(' ');
        })
            .join(', ');
    }
    _selectorNeedsScoping(selector, scopeSelector) {
        const re = this._makeScopeMatcher(scopeSelector);
        return !re.test(selector);
    }
    _makeScopeMatcher(scopeSelector) {
        const lre = /\[/g;
        const rre = /\]/g;
        scopeSelector = scopeSelector.replace(lre, '\\[').replace(rre, '\\]');
        return new RegExp('^(' + scopeSelector + ')' + _selectorReSuffix, 'm');
    }
    // scope via name and [is=name]
    _applySimpleSelectorScope(selector, scopeSelector, hostSelector) {
        // In Android browser, the lastIndex is not reset when the regex is used in String.replace()
        _polyfillHostRe.lastIndex = 0;
        if (_polyfillHostRe.test(selector)) {
            const replaceBy = `[${hostSelector}]`;
            return selector
                .replace(_polyfillHostNoCombinatorRe, (hnc, selector) => {
                return selector.replace(/([^:]*)(:*)(.*)/, (_, before, colon, after) => {
                    return before + replaceBy + colon + after;
                });
            })
                .replace(_polyfillHostRe, replaceBy + ' ');
        }
        return scopeSelector + ' ' + selector;
    }
    // return a selector with [name] suffix on each simple selector
    // e.g. .foo.bar > .zot becomes .foo[name].bar[name] > .zot[name]  /** @internal */
    _applySelectorScope(selector, scopeSelector, hostSelector) {
        const isRe = /\[is=([^\]]*)\]/g;
        scopeSelector = scopeSelector.replace(isRe, (_, ...parts) => parts[0]);
        const attrName = '[' + scopeSelector + ']';
        const _scopeSelectorPart = (p) => {
            let scopedP = p.trim();
            if (!scopedP) {
                return '';
            }
            if (p.indexOf(_polyfillHostNoCombinator) > -1) {
                scopedP = this._applySimpleSelectorScope(p, scopeSelector, hostSelector);
            }
            else {
                // remove :host since it should be unnecessary
                const t = p.replace(_polyfillHostRe, '');
                if (t.length > 0) {
                    const matches = t.match(/([^:]*)(:*)(.*)/);
                    if (matches) {
                        scopedP = matches[1] + attrName + matches[2] + matches[3];
                    }
                }
            }
            return scopedP;
        };
        const safeContent = new SafeSelector(selector);
        selector = safeContent.content();
        let scopedSelector = '';
        let startIndex = 0;
        let res;
        const sep = /( |>|\+|~(?!=))\s*/g;
        // If a selector appears before :host it should not be shimmed as it
        // matches on ancestor elements and not on elements in the host's shadow
        // `:host-context(div)` is transformed to
        // `-shadowcsshost-no-combinatordiv, div -shadowcsshost-no-combinator`
        // the `div` is not part of the component in the 2nd selectors and should not be scoped.
        // Historically `component-tag:host` was matching the component so we also want to preserve
        // this behavior to avoid breaking legacy apps (it should not match).
        // The behavior should be:
        // - `tag:host` -> `tag[h]` (this is to avoid breaking legacy apps, should not match anything)
        // - `tag :host` -> `tag [h]` (`tag` is not scoped because it's considered part of a
        //   `:host-context(tag)`)
        const hasHost = selector.indexOf(_polyfillHostNoCombinator) > -1;
        // Only scope parts after the first `-shadowcsshost-no-combinator` when it is present
        let shouldScope = !hasHost;
        while ((res = sep.exec(selector)) !== null) {
            const separator = res[1];
            const part = selector.slice(startIndex, res.index).trim();
            // A space following an escaped hex value and followed by another hex character
            // (ie: ".\fc ber" for ".über") is not a separator between 2 selectors
            // also keep in mind that backslashes are replaced by a placeholder by SafeSelector
            // These escaped selectors happen for example when esbuild runs with optimization.minify.
            if (part.match(_placeholderRe) && selector[res.index + 1]?.match(/[a-fA-F\d]/)) {
                continue;
            }
            shouldScope = shouldScope || part.indexOf(_polyfillHostNoCombinator) > -1;
            const scopedPart = shouldScope ? _scopeSelectorPart(part) : part;
            scopedSelector += `${scopedPart} ${separator} `;
            startIndex = sep.lastIndex;
        }
        const part = selector.substring(startIndex);
        shouldScope = shouldScope || part.indexOf(_polyfillHostNoCombinator) > -1;
        scopedSelector += shouldScope ? _scopeSelectorPart(part) : part;
        // replace the placeholders with their original values
        return safeContent.restore(scopedSelector);
    }
    _insertPolyfillHostInCssText(selector) {
        return selector.replace(_colonHostContextRe, _polyfillHostContext)
            .replace(_colonHostRe, _polyfillHost);
    }
}
class SafeSelector {
    constructor(selector) {
        this.placeholders = [];
        this.index = 0;
        // Replaces attribute selectors with placeholders.
        // The WS in [attr="va lue"] would otherwise be interpreted as a selector separator.
        selector = this._escapeRegexMatches(selector, /(\[[^\]]*\])/g);
        // CSS allows for certain special characters to be used in selectors if they're escaped.
        // E.g. `.foo:blue` won't match a class called `foo:blue`, because the colon denotes a
        // pseudo-class, but writing `.foo\:blue` will match, because the colon was escaped.
        // Replace all escape sequences (`\` followed by a character) with a placeholder so
        // that our handling of pseudo-selectors doesn't mess with them.
        selector = this._escapeRegexMatches(selector, /(\\.)/g);
        // Replaces the expression in `:nth-child(2n + 1)` with a placeholder.
        // WS and "+" would otherwise be interpreted as selector separators.
        this._content = selector.replace(/(:nth-[-\w]+)(\([^)]+\))/g, (_, pseudo, exp) => {
            const replaceBy = `__ph-${this.index}__`;
            this.placeholders.push(exp);
            this.index++;
            return pseudo + replaceBy;
        });
    }
    restore(content) {
        return content.replace(_placeholderRe, (_ph, index) => this.placeholders[+index]);
    }
    content() {
        return this._content;
    }
    /**
     * Replaces all of the substrings that match a regex within a
     * special string (e.g. `__ph-0__`, `__ph-1__`, etc).
     */
    _escapeRegexMatches(content, pattern) {
        return content.replace(pattern, (_, keep) => {
            const replaceBy = `__ph-${this.index}__`;
            this.placeholders.push(keep);
            this.index++;
            return replaceBy;
        });
    }
}
const _cssContentNextSelectorRe = /polyfill-next-selector[^}]*content:[\s]*?(['"])(.*?)\1[;\s]*}([^{]*?){/gim;
const _cssContentRuleRe = /(polyfill-rule)[^}]*(content:[\s]*(['"])(.*?)\3)[;\s]*[^}]*}/gim;
const _cssContentUnscopedRuleRe = /(polyfill-unscoped-rule)[^}]*(content:[\s]*(['"])(.*?)\3)[;\s]*[^}]*}/gim;
const _polyfillHost = '-shadowcsshost';
// note: :host-context pre-processed to -shadowcsshostcontext.
const _polyfillHostContext = '-shadowcsscontext';
const _parenSuffix = '(?:\\((' +
    '(?:\\([^)(]*\\)|[^)(]*)+?' +
    ')\\))?([^,{]*)';
const _cssColonHostRe = new RegExp(_polyfillHost + _parenSuffix, 'gim');
const _cssColonHostContextReGlobal = new RegExp(_polyfillHostContext + _parenSuffix, 'gim');
const _cssColonHostContextRe = new RegExp(_polyfillHostContext + _parenSuffix, 'im');
const _polyfillHostNoCombinator = _polyfillHost + '-no-combinator';
const _polyfillHostNoCombinatorRe = /-shadowcsshost-no-combinator([^\s]*)/;
const _shadowDOMSelectorsRe = [
    /::shadow/g,
    /::content/g,
    // Deprecated selectors
    /\/shadow-deep\//g,
    /\/shadow\//g,
];
// The deep combinator is deprecated in the CSS spec
// Support for `>>>`, `deep`, `::ng-deep` is then also deprecated and will be removed in the future.
// see https://github.com/angular/angular/pull/17677
const _shadowDeepSelectors = /(?:>>>)|(?:\/deep\/)|(?:::ng-deep)/g;
const _selectorReSuffix = '([>\\s~+[.,{:][\\s\\S]*)?$';
const _polyfillHostRe = /-shadowcsshost/gim;
const _colonHostRe = /:host/gim;
const _colonHostContextRe = /:host-context/gim;
const _newLinesRe = /\r?\n/g;
const _commentRe = /\/\*[\s\S]*?\*\//g;
const _commentWithHashRe = /\/\*\s*#\s*source(Mapping)?URL=/g;
const COMMENT_PLACEHOLDER = '%COMMENT%';
const _commentWithHashPlaceHolderRe = new RegExp(COMMENT_PLACEHOLDER, 'g');
const _placeholderRe = /__ph-(\d+)__/g;
const BLOCK_PLACEHOLDER = '%BLOCK%';
const _ruleRe = new RegExp(`(\\s*(?:${COMMENT_PLACEHOLDER}\\s*)*)([^;\\{\\}]+?)(\\s*)((?:{%BLOCK%}?\\s*;?)|(?:\\s*;))`, 'g');
const CONTENT_PAIRS = new Map([['{', '}']]);
const COMMA_IN_PLACEHOLDER = '%COMMA_IN_PLACEHOLDER%';
const SEMI_IN_PLACEHOLDER = '%SEMI_IN_PLACEHOLDER%';
const COLON_IN_PLACEHOLDER = '%COLON_IN_PLACEHOLDER%';
const _cssCommaInPlaceholderReGlobal = new RegExp(COMMA_IN_PLACEHOLDER, 'g');
const _cssSemiInPlaceholderReGlobal = new RegExp(SEMI_IN_PLACEHOLDER, 'g');
const _cssColonInPlaceholderReGlobal = new RegExp(COLON_IN_PLACEHOLDER, 'g');
export class CssRule {
    constructor(selector, content) {
        this.selector = selector;
        this.content = content;
    }
}
export function processRules(input, ruleCallback) {
    const escaped = escapeInStrings(input);
    const inputWithEscapedBlocks = escapeBlocks(escaped, CONTENT_PAIRS, BLOCK_PLACEHOLDER);
    let nextBlockIndex = 0;
    const escapedResult = inputWithEscapedBlocks.escapedString.replace(_ruleRe, (...m) => {
        const selector = m[2];
        let content = '';
        let suffix = m[4];
        let contentPrefix = '';
        if (suffix && suffix.startsWith('{' + BLOCK_PLACEHOLDER)) {
            content = inputWithEscapedBlocks.blocks[nextBlockIndex++];
            suffix = suffix.substring(BLOCK_PLACEHOLDER.length + 1);
            contentPrefix = '{';
        }
        const rule = ruleCallback(new CssRule(selector, content));
        return `${m[1]}${rule.selector}${m[3]}${contentPrefix}${rule.content}${suffix}`;
    });
    return unescapeInStrings(escapedResult);
}
class StringWithEscapedBlocks {
    constructor(escapedString, blocks) {
        this.escapedString = escapedString;
        this.blocks = blocks;
    }
}
function escapeBlocks(input, charPairs, placeholder) {
    const resultParts = [];
    const escapedBlocks = [];
    let openCharCount = 0;
    let nonBlockStartIndex = 0;
    let blockStartIndex = -1;
    let openChar;
    let closeChar;
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (char === '\\') {
            i++;
        }
        else if (char === closeChar) {
            openCharCount--;
            if (openCharCount === 0) {
                escapedBlocks.push(input.substring(blockStartIndex, i));
                resultParts.push(placeholder);
                nonBlockStartIndex = i;
                blockStartIndex = -1;
                openChar = closeChar = undefined;
            }
        }
        else if (char === openChar) {
            openCharCount++;
        }
        else if (openCharCount === 0 && charPairs.has(char)) {
            openChar = char;
            closeChar = charPairs.get(char);
            openCharCount = 1;
            blockStartIndex = i + 1;
            resultParts.push(input.substring(nonBlockStartIndex, blockStartIndex));
        }
    }
    if (blockStartIndex !== -1) {
        escapedBlocks.push(input.substring(blockStartIndex));
        resultParts.push(placeholder);
    }
    else {
        resultParts.push(input.substring(nonBlockStartIndex));
    }
    return new StringWithEscapedBlocks(resultParts.join(''), escapedBlocks);
}
/**
 * Object containing as keys characters that should be substituted by placeholders
 * when found in strings during the css text parsing, and as values the respective
 * placeholders
 */
const ESCAPE_IN_STRING_MAP = {
    ';': SEMI_IN_PLACEHOLDER,
    ',': COMMA_IN_PLACEHOLDER,
    ':': COLON_IN_PLACEHOLDER
};
/**
 * Parse the provided css text and inside strings (meaning, inside pairs of unescaped single or
 * double quotes) replace specific characters with their respective placeholders as indicated
 * by the `ESCAPE_IN_STRING_MAP` map.
 *
 * For example convert the text
 *  `animation: "my-anim:at\"ion" 1s;`
 * to
 *  `animation: "my-anim%COLON_IN_PLACEHOLDER%at\"ion" 1s;`
 *
 * This is necessary in order to remove the meaning of some characters when found inside strings
 * (for example `;` indicates the end of a css declaration, `,` the sequence of values and `:` the
 * division between property and value during a declaration, none of these meanings apply when such
 * characters are within strings and so in order to prevent parsing issues they need to be replaced
 * with placeholder text for the duration of the css manipulation process).
 *
 * @param input the original css text.
 *
 * @returns the css text with specific characters in strings replaced by placeholders.
 **/
function escapeInStrings(input) {
    let result = input;
    let currentQuoteChar = null;
    for (let i = 0; i < result.length; i++) {
        const char = result[i];
        if (char === '\\') {
            i++;
        }
        else {
            if (currentQuoteChar !== null) {
                // index i is inside a quoted sub-string
                if (char === currentQuoteChar) {
                    currentQuoteChar = null;
                }
                else {
                    const placeholder = ESCAPE_IN_STRING_MAP[char];
                    if (placeholder) {
                        result = `${result.substr(0, i)}${placeholder}${result.substr(i + 1)}`;
                        i += placeholder.length - 1;
                    }
                }
            }
            else if (char === '\'' || char === '"') {
                currentQuoteChar = char;
            }
        }
    }
    return result;
}
/**
 * Replace in a string all occurrences of keys in the `ESCAPE_IN_STRING_MAP` map with their
 * original representation, this is simply used to revert the changes applied by the
 * escapeInStrings function.
 *
 * For example it reverts the text:
 *  `animation: "my-anim%COLON_IN_PLACEHOLDER%at\"ion" 1s;`
 * to it's original form of:
 *  `animation: "my-anim:at\"ion" 1s;`
 *
 * Note: For the sake of simplicity this function does not check that the placeholders are
 * actually inside strings as it would anyway be extremely unlikely to find them outside of strings.
 *
 * @param input the css text containing the placeholders.
 *
 * @returns the css text without the placeholders.
 */
function unescapeInStrings(input) {
    let result = input.replace(_cssCommaInPlaceholderReGlobal, ',');
    result = result.replace(_cssSemiInPlaceholderReGlobal, ';');
    result = result.replace(_cssColonInPlaceholderReGlobal, ':');
    return result;
}
/**
 * Unescape all quotes present in a string, but only if the string was actually already
 * quoted.
 *
 * This generates a "canonical" representation of strings which can be used to match strings
 * which would otherwise only differ because of differently escaped quotes.
 *
 * For example it converts the string (assumed to be quoted):
 *  `this \\"is\\" a \\'\\\\'test`
 * to:
 *  `this "is" a '\\\\'test`
 * (note that the latter backslashes are not removed as they are not actually escaping the single
 * quote)
 *
 *
 * @param input the string possibly containing escaped quotes.
 * @param isQuoted boolean indicating whether the string was quoted inside a bigger string (if not
 * then it means that it doesn't represent an inner string and thus no unescaping is required)
 *
 * @returns the string in the "canonical" representation without escaped quotes.
 */
function unescapeQuotes(str, isQuoted) {
    return !isQuoted ? str : str.replace(/((?:^|[^\\])(?:\\\\)*)\\(?=['"])/g, '$1');
}
/**
 * Combine the `contextSelectors` with the `hostMarker` and the `otherSelectors`
 * to create a selector that matches the same as `:host-context()`.
 *
 * Given a single context selector `A` we need to output selectors that match on the host and as an
 * ancestor of the host:
 *
 * ```
 * A <hostMarker>, A<hostMarker> {}
 * ```
 *
 * When there is more than one context selector we also have to create combinations of those
 * selectors with each other. For example if there are `A` and `B` selectors the output is:
 *
 * ```
 * AB<hostMarker>, AB <hostMarker>, A B<hostMarker>,
 * B A<hostMarker>, A B <hostMarker>, B A <hostMarker> {}
 * ```
 *
 * And so on...
 *
 * @param contextSelectors an array of context selectors that will be combined.
 * @param otherSelectors the rest of the selectors that are not context selectors.
 */
function combineHostContextSelectors(contextSelectors, otherSelectors) {
    const hostMarker = _polyfillHostNoCombinator;
    _polyfillHostRe.lastIndex = 0; // reset the regex to ensure we get an accurate test
    const otherSelectorsHasHost = _polyfillHostRe.test(otherSelectors);
    // If there are no context selectors then just output a host marker
    if (contextSelectors.length === 0) {
        return hostMarker + otherSelectors;
    }
    const combined = [contextSelectors.pop() || ''];
    while (contextSelectors.length > 0) {
        const length = combined.length;
        const contextSelector = contextSelectors.pop();
        for (let i = 0; i < length; i++) {
            const previousSelectors = combined[i];
            // Add the new selector as a descendant of the previous selectors
            combined[length * 2 + i] = previousSelectors + ' ' + contextSelector;
            // Add the new selector as an ancestor of the previous selectors
            combined[length + i] = contextSelector + ' ' + previousSelectors;
            // Add the new selector to act on the same element as the previous selectors
            combined[i] = contextSelector + previousSelectors;
        }
    }
    // Finally connect the selector to the `hostMarker`s: either acting directly on the host
    // (A<hostMarker>) or as an ancestor (A <hostMarker>).
    return combined
        .map(s => otherSelectorsHasHost ?
        `${s}${otherSelectors}` :
        `${s}${hostMarker}${otherSelectors}, ${s} ${hostMarker}${otherSelectors}`)
        .join(',');
}
/**
 * Mutate the given `groups` array so that there are `multiples` clones of the original array
 * stored.
 *
 * For example `repeatGroups([a, b], 3)` will result in `[a, b, a, b, a, b]` - but importantly the
 * newly added groups will be clones of the original.
 *
 * @param groups An array of groups of strings that will be repeated. This array is mutated
 *     in-place.
 * @param multiples The number of times the current groups should appear.
 */
export function repeatGroups(groups, multiples) {
    const length = groups.length;
    for (let i = 1; i < multiples; i++) {
        for (let j = 0; j < length; j++) {
            groups[j + (i * length)] = groups[j].slice(0);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhZG93X2Nzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9zaGFkb3dfY3NzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVIOzs7O0dBSUc7QUFDSCxNQUFNLGlCQUFpQixHQUFHLElBQUksR0FBRyxDQUFDO0lBQ2hDLGdCQUFnQjtJQUNoQixTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxPQUFPO0lBQ3ZDLHNCQUFzQjtJQUN0QixXQUFXLEVBQUUsbUJBQW1CLEVBQUUsUUFBUSxFQUFFLFNBQVM7SUFDckQsc0JBQXNCO0lBQ3RCLFdBQVcsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU07SUFDdkMsdUJBQXVCO0lBQ3ZCLFFBQVEsRUFBRSxTQUFTO0lBQ25CLDRCQUE0QjtJQUM1QixNQUFNLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxVQUFVO0lBQ2hGLHFCQUFxQjtJQUNyQixLQUFLLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLE9BQU87Q0FDbkUsQ0FBQyxDQUFDO0FBRUg7Ozs7Ozs7O0dBUUc7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBNkZFO0FBQ0YsTUFBTSxPQUFPLFNBQVM7SUFBdEI7UUErSkU7Ozs7Ozs7Ozs7Ozs7V0FhRztRQUNLLHFDQUFnQyxHQUNwQyxpRkFBaUYsQ0FBQztJQStheEYsQ0FBQztJQTVsQkM7Ozs7O09BS0c7SUFDSCxXQUFXLENBQUMsT0FBZSxFQUFFLFFBQWdCLEVBQUUsZUFBdUIsRUFBRTtRQUN0RSxtRkFBbUY7UUFDbkYseUJBQXlCO1FBRXpCLDJGQUEyRjtRQUMzRiw2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ZSxHQUFHLGlCQUFpQixDQUFDO1NBQ25EO0tBQ0Y7SUFDRCx3RkFBd0Y7SUFDeEYsc0RBQXNEO0lBQ3RELE9BQU8sUUFBUTtTQUNWLEdBQUcsQ0FDQSxDQUFDLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDeEIsR0FBRyxDQUFDLEdBQUcsY0FBYyxFQUFFLENBQUMsQ0FBQztRQUN6QixHQUFHLENBQUMsR0FBRyxVQUFVLEdBQUcsY0FBYyxLQUFLLENBQUMsSUFBSSxVQUFVLEdBQUcsY0FBYyxFQUFFLENBQUM7U0FDakYsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLENBQUM7QUFFRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FBQyxNQUFrQixFQUFFLFNBQWlCO0lBQ2hFLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDN0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNsQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQy9CLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQy9DO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogVGhlIGZvbGxvd2luZyBzZXQgY29udGFpbnMgYWxsIGtleXdvcmRzIHRoYXQgY2FuIGJlIHVzZWQgaW4gdGhlIGFuaW1hdGlvbiBjc3Mgc2hvcnRoYW5kXG4gKiBwcm9wZXJ0eSBhbmQgaXMgdXNlZCBkdXJpbmcgdGhlIHNjb3Bpbmcgb2Yga2V5ZnJhbWVzIHRvIG1ha2Ugc3VyZSBzdWNoIGtleXdvcmRzXG4gKiBhcmUgbm90IG1vZGlmaWVkLlxuICovXG5jb25zdCBhbmltYXRpb25LZXl3b3JkcyA9IG5ldyBTZXQoW1xuICAvLyBnbG9iYWwgdmFsdWVzXG4gICdpbmhlcml0JywgJ2luaXRpYWwnLCAncmV2ZXJ0JywgJ3Vuc2V0JyxcbiAgLy8gYW5pbWF0aW9uLWRpcmVjdGlvblxuICAnYWx0ZXJuYXRlJywgJ2FsdGVybmF0ZS1yZXZlcnNlJywgJ25vcm1hbCcsICdyZXZlcnNlJyxcbiAgLy8gYW5pbWF0aW9uLWZpbGwtbW9kZVxuICAnYmFja3dhcmRzJywgJ2JvdGgnLCAnZm9yd2FyZHMnLCAnbm9uZScsXG4gIC8vIGFuaW1hdGlvbi1wbGF5LXN0YXRlXG4gICdwYXVzZWQnLCAncnVubmluZycsXG4gIC8vIGFuaW1hdGlvbi10aW1pbmctZnVuY3Rpb25cbiAgJ2Vhc2UnLCAnZWFzZS1pbicsICdlYXNlLWluLW91dCcsICdlYXNlLW91dCcsICdsaW5lYXInLCAnc3RlcC1zdGFydCcsICdzdGVwLWVuZCcsXG4gIC8vIGBzdGVwcygpYCBmdW5jdGlvblxuICAnZW5kJywgJ2p1bXAtYm90aCcsICdqdW1wLWVuZCcsICdqdW1wLW5vbmUnLCAnanVtcC1zdGFydCcsICdzdGFydCdcbl0pO1xuXG4vKipcbiAqIFRoZSBmb2xsb3dpbmcgY2xhc3MgaGFzIGl0cyBvcmlnaW4gZnJvbSBhIHBvcnQgb2Ygc2hhZG93Q1NTIGZyb20gd2ViY29tcG9uZW50cy5qcyB0byBUeXBlU2NyaXB0LlxuICogSXQgaGFzIHNpbmNlIGRpdmVyZ2UgaW4gbWFueSB3YXlzIHRvIHRhaWxvciBBbmd1bGFyJ3MgbmVlZHMuXG4gKlxuICogU291cmNlOlxuICogaHR0cHM6Ly9naXRodWIuY29tL3dlYmNvbXBvbmVudHMvd2ViY29tcG9uZW50c2pzL2Jsb2IvNGVmZWNkN2UwZS9zcmMvU2hhZG93Q1NTL1NoYWRvd0NTUy5qc1xuICpcbiAqIFRoZSBvcmlnaW5hbCBmaWxlIGxldmVsIGNvbW1lbnQgaXMgcmVwcm9kdWNlZCBiZWxvd1xuICovXG5cbi8qXG4gIFRoaXMgaXMgYSBsaW1pdGVkIHNoaW0gZm9yIFNoYWRvd0RPTSBjc3Mgc3R5bGluZy5cbiAgaHR0cHM6Ly9kdmNzLnczLm9yZy9oZy93ZWJjb21wb25lbnRzL3Jhdy1maWxlL3RpcC9zcGVjL3NoYWRvdy9pbmRleC5odG1sI3N0eWxlc1xuXG4gIFRoZSBpbnRlbnRpb24gaGVyZSBpcyB0byBzdXBwb3J0IG9ubHkgdGhlIHN0eWxpbmcgZmVhdHVyZXMgd2hpY2ggY2FuIGJlXG4gIHJlbGF0aXZlbHkgc2ltcGx5IGltcGxlbWVudGVkLiBUaGUgZ29hbCBpcyB0byBhbGxvdyB1c2VycyB0byBhdm9pZCB0aGVcbiAgbW9zdCBvYnZpb3VzIHBpdGZhbGxzIGFuZCBkbyBzbyB3aXRob3V0IGNvbXByb21pc2luZyBwZXJmb3JtYW5jZSBzaWduaWZpY2FudGx5LlxuICBGb3IgU2hhZG93RE9NIHN0eWxpbmcgdGhhdCdzIG5vdCBjb3ZlcmVkIGhlcmUsIGEgc2V0IG9mIGJlc3QgcHJhY3RpY2VzXG4gIGNhbiBiZSBwcm92aWRlZCB0aGF0IHNob3VsZCBhbGxvdyB1c2VycyB0byBhY2NvbXBsaXNoIG1vcmUgY29tcGxleCBzdHlsaW5nLlxuXG4gIFRoZSBmb2xsb3dpbmcgaXMgYSBsaXN0IG9mIHNwZWNpZmljIFNoYWRvd0RPTSBzdHlsaW5nIGZlYXR1cmVzIGFuZCBhIGJyaWVmXG4gIGRpc2N1c3Npb24gb2YgdGhlIGFwcHJvYWNoIHVzZWQgdG8gc2hpbS5cblxuICBTaGltbWVkIGZlYXR1cmVzOlxuXG4gICogOmhvc3QsIDpob3N0LWNvbnRleHQ6IFNoYWRvd0RPTSBhbGxvd3Mgc3R5bGluZyBvZiB0aGUgc2hhZG93Um9vdCdzIGhvc3RcbiAgZWxlbWVudCB1c2luZyB0aGUgOmhvc3QgcnVsZS4gVG8gc2hpbSB0aGlzIGZlYXR1cmUsIHRoZSA6aG9zdCBzdHlsZXMgYXJlXG4gIHJlZm9ybWF0dGVkIGFuZCBwcmVmaXhlZCB3aXRoIGEgZ2l2ZW4gc2NvcGUgbmFtZSBhbmQgcHJvbW90ZWQgdG8gYVxuICBkb2N1bWVudCBsZXZlbCBzdHlsZXNoZWV0LlxuICBGb3IgZXhhbXBsZSwgZ2l2ZW4gYSBzY29wZSBuYW1lIG9mIC5mb28sIGEgcnVsZSBsaWtlIHRoaXM6XG5cbiAgICA6aG9zdCB7XG4gICAgICAgIGJhY2tncm91bmQ6IHJlZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgYmVjb21lczpcblxuICAgIC5mb28ge1xuICAgICAgYmFja2dyb3VuZDogcmVkO1xuICAgIH1cblxuICAqIGVuY2Fwc3VsYXRpb246IFN0eWxlcyBkZWZpbmVkIHdpdGhpbiBTaGFkb3dET00sIGFwcGx5IG9ubHkgdG9cbiAgZG9tIGluc2lkZSB0aGUgU2hhZG93RE9NLlxuICBUaGUgc2VsZWN0b3JzIGFyZSBzY29wZWQgYnkgYWRkaW5nIGFuIGF0dHJpYnV0ZSBzZWxlY3RvciBzdWZmaXggdG8gZWFjaFxuICBzaW1wbGUgc2VsZWN0b3IgdGhhdCBjb250YWlucyB0aGUgaG9zdCBlbGVtZW50IHRhZyBuYW1lLiBFYWNoIGVsZW1lbnRcbiAgaW4gdGhlIGVsZW1lbnQncyBTaGFkb3dET00gdGVtcGxhdGUgaXMgYWxzbyBnaXZlbiB0aGUgc2NvcGUgYXR0cmlidXRlLlxuICBUaHVzLCB0aGVzZSBydWxlcyBtYXRjaCBvbmx5IGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgc2NvcGUgYXR0cmlidXRlLlxuICBGb3IgZXhhbXBsZSwgZ2l2ZW4gYSBzY29wZSBuYW1lIG9mIHgtZm9vLCBhIHJ1bGUgbGlrZSB0aGlzOlxuXG4gICAgZGl2IHtcbiAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICAgIH1cblxuICBiZWNvbWVzOlxuXG4gICAgZGl2W3gtZm9vXSB7XG4gICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICB9XG5cbiAgTm90ZSB0aGF0IGVsZW1lbnRzIHRoYXQgYXJlIGR5bmFtaWNhbGx5IGFkZGVkIHRvIGEgc2NvcGUgbXVzdCBoYXZlIHRoZSBzY29wZVxuICBzZWxlY3RvciBhZGRlZCB0byB0aGVtIG1hbnVhbGx5LlxuXG4gICogdXBwZXIvbG93ZXIgYm91bmQgZW5jYXBzdWxhdGlvbjogU3R5bGVzIHdoaWNoIGFyZSBkZWZpbmVkIG91dHNpZGUgYVxuICBzaGFkb3dSb290IHNob3VsZCBub3QgY3Jvc3MgdGhlIFNoYWRvd0RPTSBib3VuZGFyeSBhbmQgc2hvdWxkIG5vdCBhcHBseVxuICBpbnNpZGUgYSBzaGFkb3dSb290LlxuXG4gIFRoaXMgc3R5bGluZyBiZWhhdmlvciBpcyBub3QgZW11bGF0ZWQuIFNvbWUgcG9zc2libGUgd2F5cyB0byBkbyB0aGlzIHRoYXRcbiAgd2VyZSByZWplY3RlZCBkdWUgdG8gY29tcGxleGl0eSBhbmQvb3IgcGVyZm9ybWFuY2UgY29uY2VybnMgaW5jbHVkZTogKDEpIHJlc2V0XG4gIGV2ZXJ5IHBvc3NpYmxlIHByb3BlcnR5IGZvciBldmVyeSBwb3NzaWJsZSBzZWxlY3RvciBmb3IgYSBnaXZlbiBzY29wZSBuYW1lO1xuICAoMikgcmUtaW1wbGVtZW50IGNzcyBpbiBqYXZhc2NyaXB0LlxuXG4gIEFzIGFuIGFsdGVybmF0aXZlLCB1c2VycyBzaG91bGQgbWFrZSBzdXJlIHRvIHVzZSBzZWxlY3RvcnNcbiAgc3BlY2lmaWMgdG8gdGhlIHNjb3BlIGluIHdoaWNoIHRoZXkgYXJlIHdvcmtpbmcuXG5cbiAgKiA6OmRpc3RyaWJ1dGVkOiBUaGlzIGJlaGF2aW9yIGlzIG5vdCBlbXVsYXRlZC4gSXQncyBvZnRlbiBub3QgbmVjZXNzYXJ5XG4gIHRvIHN0eWxlIHRoZSBjb250ZW50cyBvZiBhIHNwZWNpZmljIGluc2VydGlvbiBwb2ludCBhbmQgaW5zdGVhZCwgZGVzY2VuZGFudHNcbiAgb2YgdGhlIGhvc3QgZWxlbWVudCBjYW4gYmUgc3R5bGVkIHNlbGVjdGl2ZWx5LiBVc2VycyBjYW4gYWxzbyBjcmVhdGUgYW5cbiAgZXh0cmEgbm9kZSBhcm91bmQgYW4gaW5zZXJ0aW9uIHBvaW50IGFuZCBzdHlsZSB0aGF0IG5vZGUncyBjb250ZW50c1xuICB2aWEgZGVzY2VuZGVudCBzZWxlY3RvcnMuIEZvciBleGFtcGxlLCB3aXRoIGEgc2hhZG93Um9vdCBsaWtlIHRoaXM6XG5cbiAgICA8c3R5bGU+XG4gICAgICA6OmNvbnRlbnQoZGl2KSB7XG4gICAgICAgIGJhY2tncm91bmQ6IHJlZDtcbiAgICAgIH1cbiAgICA8L3N0eWxlPlxuICAgIDxjb250ZW50PjwvY29udGVudD5cblxuICBjb3VsZCBiZWNvbWU6XG5cbiAgICA8c3R5bGU+XG4gICAgICAvICpAcG9seWZpbGwgLmNvbnRlbnQtY29udGFpbmVyIGRpdiAqIC9cbiAgICAgIDo6Y29udGVudChkaXYpIHtcbiAgICAgICAgYmFja2dyb3VuZDogcmVkO1xuICAgICAgfVxuICAgIDwvc3R5bGU+XG4gICAgPGRpdiBjbGFzcz1cImNvbnRlbnQtY29udGFpbmVyXCI+XG4gICAgICA8Y29udGVudD48L2NvbnRlbnQ+XG4gICAgPC9kaXY+XG5cbiAgTm90ZSB0aGUgdXNlIG9mIEBwb2x5ZmlsbCBpbiB0aGUgY29tbWVudCBhYm92ZSBhIFNoYWRvd0RPTSBzcGVjaWZpYyBzdHlsZVxuICBkZWNsYXJhdGlvbi4gVGhpcyBpcyBhIGRpcmVjdGl2ZSB0byB0aGUgc3R5bGluZyBzaGltIHRvIHVzZSB0aGUgc2VsZWN0b3JcbiAgaW4gY29tbWVudHMgaW4gbGlldSBvZiB0aGUgbmV4dCBzZWxlY3RvciB3aGVuIHJ1bm5pbmcgdW5kZXIgcG9seWZpbGwuXG4qL1xuZXhwb3J0IGNsYXNzIFNoYWRvd0NzcyB7XG4gIC8qXG4gICAqIFNoaW0gc29tZSBjc3NUZXh0IHdpdGggdGhlIGdpdmVuIHNlbGVjdG9yLiBSZXR1cm5zIGNzc1RleHQgdGhhdCBjYW4gYmUgaW5jbHVkZWQgaW4gdGhlIGRvY3VtZW50XG4gICAqXG4gICAqIFRoZSBzZWxlY3RvciBpcyB0aGUgYXR0cmlidXRlIGFkZGVkIHRvIGFsbCBlbGVtZW50cyBpbnNpZGUgdGhlIGhvc3QsXG4gICAqIFRoZSBob3N0U2VsZWN0b3IgaXMgdGhlIGF0dHJpYnV0ZSBhZGRlZCB0byB0aGUgaG9zdCBpdHNlbGYuXG4gICAqL1xuICBzaGltQ3NzVGV4dChjc3NUZXh0OiBzdHJpbmcsIHNlbGVjdG9yOiBzdHJpbmcsIGhvc3RTZWxlY3Rvcjogc3RyaW5nID0gJycpOiBzdHJpbmcge1xuICAgIC8vICoqTk9URSoqOiBEbyBub3Qgc3RyaXAgY29tbWVudHMgYXMgdGhpcyB3aWxsIGNhdXNlIGNvbXBvbmVudCBzb3VyY2VtYXBzIHRvIGJyZWFrXG4gICAgLy8gZHVlIHRvIHNoaWZ0IGluIGxpbmVzLlxuXG4gICAgLy8gQ29sbGVjdCBjb21tZW50cyBhbmQgcmVwbGFjZSB0aGVtIHdpdGggYSBwbGFjZWhvbGRlciwgdGhpcyBpcyBkb25lIHRvIGF2b2lkIGNvbXBsaWNhdGluZ1xuICAgIC8vIHRoZSBydWxlIHBhcnNpbmcgUmVnRXhwIGFuZCBrZWVwIGl0IHNhZmVyLlxuICAgIGNvbnN0IGNvbW1lbnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNzc1RleHQgPSBjc3NUZXh0LnJlcGxhY2UoX2NvbW1lbnRSZSwgKG0pID0+IHtcbiAgICAgIGlmIChtLm1hdGNoKF9jb21tZW50V2l0aEhhc2hSZSkpIHtcbiAgICAgICAgY29tbWVudHMucHVzaChtKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJlcGxhY2Ugbm9uIGhhc2ggY29tbWVudHMgd2l0aCBlbXB0eSBsaW5lcy5cbiAgICAgICAgLy8gVGhpcyBpcyBkb25lIHNvIHRoYXQgd2UgZG8gbm90IGxlYWsgYW55IHNlbnN0aXZlIGRhdGEgaW4gY29tbWVudHMuXG4gICAgICAgIGNvbnN0IG5ld0xpbmVzTWF0Y2hlcyA9IG0ubWF0Y2goX25ld0xpbmVzUmUpO1xuICAgICAgICBjb21tZW50cy5wdXNoKChuZXdMaW5lc01hdGNoZXM/LmpvaW4oJycpID8/ICcnKSArICdcXG4nKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIENPTU1FTlRfUExBQ0VIT0xERVI7XG4gICAgfSk7XG5cbiAgICBjc3NUZXh0ID0gdGhpcy5faW5zZXJ0RGlyZWN0aXZlcyhjc3NUZXh0KTtcbiAgICBjb25zdCBzY29wZWRDc3NUZXh0ID0gdGhpcy5fc2NvcGVDc3NUZXh0KGNzc1RleHQsIHNlbGVjdG9yLCBob3N0U2VsZWN0b3IpO1xuICAgIC8vIEFkZCBiYWNrIGNvbW1lbnRzIGF0IHRoZSBvcmlnaW5hbCBwb3NpdGlvbi5cbiAgICBsZXQgY29tbWVudElkeCA9IDA7XG4gICAgcmV0dXJuIHNjb3BlZENzc1RleHQucmVwbGFjZShfY29tbWVudFdpdGhIYXNoUGxhY2VIb2xkZXJSZSwgKCkgPT4gY29tbWVudHNbY29tbWVudElkeCsrXSk7XG4gIH1cblxuICBwcml2YXRlIF9pbnNlcnREaXJlY3RpdmVzKGNzc1RleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY3NzVGV4dCA9IHRoaXMuX2luc2VydFBvbHlmaWxsRGlyZWN0aXZlc0luQ3NzVGV4dChjc3NUZXh0KTtcbiAgICByZXR1cm4gdGhpcy5faW5zZXJ0UG9seWZpbGxSdWxlc0luQ3NzVGV4dChjc3NUZXh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIHN0eWxlcyB0byBhZGQgc2NvcGUgdG8ga2V5ZnJhbWVzLlxuICAgKlxuICAgKiBNb2RpZnkgYm90aCB0aGUgbmFtZXMgb2YgdGhlIGtleWZyYW1lcyBkZWZpbmVkIGluIHRoZSBjb21wb25lbnQgc3R5bGVzIGFuZCBhbHNvIHRoZSBjc3NcbiAgICogYW5pbWF0aW9uIHJ1bGVzIHVzaW5nIHRoZW0uXG4gICAqXG4gICAqIEFuaW1hdGlvbiBydWxlcyB1c2luZyBrZXlmcmFtZXMgZGVmaW5lZCBlbHNld2hlcmUgYXJlIG5vdCBtb2RpZmllZCB0byBhbGxvdyBmb3IgZ2xvYmFsbHlcbiAgICogZGVmaW5lZCBrZXlmcmFtZXMuXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCB3ZSBjb252ZXJ0IHRoaXMgY3NzOlxuICAgKlxuICAgKiBgYGBcbiAgICogLmJveCB7XG4gICAqICAgYW5pbWF0aW9uOiBib3gtYW5pbWF0aW9uIDFzIGZvcndhcmRzO1xuICAgKiB9XG4gICAqXG4gICAqIEBrZXlmcmFtZXMgYm94LWFuaW1hdGlvbiB7XG4gICAqICAgdG8ge1xuICAgKiAgICAgYmFja2dyb3VuZC1jb2xvcjogZ3JlZW47XG4gICAqICAgfVxuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiB0byB0aGlzOlxuICAgKlxuICAgKiBgYGBcbiAgICogLmJveCB7XG4gICAqICAgYW5pbWF0aW9uOiBzY29wZU5hbWVfYm94LWFuaW1hdGlvbiAxcyBmb3J3YXJkcztcbiAgICogfVxuICAgKlxuICAgKiBAa2V5ZnJhbWVzIHNjb3BlTmFtZV9ib3gtYW5pbWF0aW9uIHtcbiAgICogICB0byB7XG4gICAqICAgICBiYWNrZ3JvdW5kLWNvbG9yOiBncmVlbjtcbiAgICogICB9XG4gICAqIH1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBjc3NUZXh0IHRoZSBjb21wb25lbnQncyBjc3MgdGV4dCB0aGF0IG5lZWRzIHRvIGJlIHNjb3BlZC5cbiAgICogQHBhcmFtIHNjb3BlU2VsZWN0b3IgdGhlIGNvbXBvbmVudCdzIHNjb3BlIHNlbGVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyB0aGUgc2NvcGVkIGNzcyB0ZXh0LlxuICAgKi9cbiAgcHJpdmF0ZSBfc2NvcGVLZXlmcmFtZXNSZWxhdGVkQ3NzKGNzc1RleHQ6IHN0cmluZywgc2NvcGVTZWxlY3Rvcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCB1bnNjb3BlZEtleWZyYW1lc1NldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IHNjb3BlZEtleWZyYW1lc0Nzc1RleHQgPSBwcm9jZXNzUnVsZXMoXG4gICAgICAgIGNzc1RleHQsXG4gICAgICAgIHJ1bGUgPT4gdGhpcy5fc2NvcGVMb2NhbEtleWZyYW1lRGVjbGFyYXRpb25zKHJ1bGUsIHNjb3BlU2VsZWN0b3IsIHVuc2NvcGVkS2V5ZnJhbWVzU2V0KSk7XG4gICAgcmV0dXJuIHByb2Nlc3NSdWxlcyhcbiAgICAgICAgc2NvcGVkS2V5ZnJhbWVzQ3NzVGV4dCxcbiAgICAgICAgcnVsZSA9PiB0aGlzLl9zY29wZUFuaW1hdGlvblJ1bGUocnVsZSwgc2NvcGVTZWxlY3RvciwgdW5zY29wZWRLZXlmcmFtZXNTZXQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY29wZXMgbG9jYWwga2V5ZnJhbWVzIG5hbWVzLCByZXR1cm5pbmcgdGhlIHVwZGF0ZWQgY3NzIHJ1bGUgYW5kIGl0IGFsc29cbiAgICogYWRkcyB0aGUgb3JpZ2luYWwga2V5ZnJhbWUgbmFtZSB0byBhIHByb3ZpZGVkIHNldCB0byBjb2xsZWN0IGFsbCBrZXlmcmFtZXMgbmFtZXNcbiAgICogc28gdGhhdCBpdCBjYW4gbGF0ZXIgYmUgdXNlZCB0byBzY29wZSB0aGUgYW5pbWF0aW9uIHJ1bGVzLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgaXQgdGFrZXMgYSBydWxlIHN1Y2ggYXM6XG4gICAqXG4gICAqIGBgYFxuICAgKiBAa2V5ZnJhbWVzIGJveC1hbmltYXRpb24ge1xuICAgKiAgIHRvIHtcbiAgICogICAgIGJhY2tncm91bmQtY29sb3I6IGdyZWVuO1xuICAgKiAgIH1cbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogYW5kIHJldHVybnM6XG4gICAqXG4gICAqIGBgYFxuICAgKiBAa2V5ZnJhbWVzIHNjb3BlTmFtZV9ib3gtYW5pbWF0aW9uIHtcbiAgICogICB0byB7XG4gICAqICAgICBiYWNrZ3JvdW5kLWNvbG9yOiBncmVlbjtcbiAgICogICB9XG4gICAqIH1cbiAgICogYGBgXG4gICAqIGFuZCBhcyBhIHNpZGUgZWZmZWN0IGl0IGFkZHMgXCJib3gtYW5pbWF0aW9uXCIgdG8gdGhlIGB1bnNjb3BlZEtleWZyYW1lc1NldGAgc2V0XG4gICAqXG4gICAqIEBwYXJhbSBjc3NSdWxlIHRoZSBjc3MgcnVsZSB0byBwcm9jZXNzLlxuICAgKiBAcGFyYW0gc2NvcGVTZWxlY3RvciB0aGUgY29tcG9uZW50J3Mgc2NvcGUgc2VsZWN0b3IuXG4gICAqIEBwYXJhbSB1bnNjb3BlZEtleWZyYW1lc1NldCB0aGUgc2V0IG9mIHVuc2NvcGVkIGtleWZyYW1lcyBuYW1lcyAod2hpY2ggY2FuIGJlXG4gICAqIG1vZGlmaWVkIGFzIGEgc2lkZSBlZmZlY3QpXG4gICAqXG4gICAqIEByZXR1cm5zIHRoZSBjc3MgcnVsZSBtb2RpZmllZCB3aXRoIHRoZSBzY29wZWQga2V5ZnJhbWVzIG5hbWUuXG4gICAqL1xuICBwcml2YXRlIF9zY29wZUxvY2FsS2V5ZnJhbWVEZWNsYXJhdGlvbnMoXG4gICAgICBydWxlOiBDc3NSdWxlLCBzY29wZVNlbGVjdG9yOiBzdHJpbmcsIHVuc2NvcGVkS2V5ZnJhbWVzU2V0OiBTZXQ8c3RyaW5nPik6IENzc1J1bGUge1xuICAgIHJldHVybiB7XG4gICAgICAuLi5ydWxlLFxuICAgICAgc2VsZWN0b3I6IHJ1bGUuc2VsZWN0b3IucmVwbGFjZShcbiAgICAgICAgICAvKF5AKD86LXdlYmtpdC0pP2tleWZyYW1lcyg/OlxccyspKShbJ1wiXT8pKC4rKVxcMihcXHMqKSQvLFxuICAgICAgICAgIChfLCBzdGFydCwgcXVvdGUsIGtleWZyYW1lTmFtZSwgZW5kU3BhY2VzKSA9PiB7XG4gICAgICAgICAgICB1bnNjb3BlZEtleWZyYW1lc1NldC5hZGQodW5lc2NhcGVRdW90ZXMoa2V5ZnJhbWVOYW1lLCBxdW90ZSkpO1xuICAgICAgICAgICAgcmV0dXJuIGAke3N0YXJ0fSR7cXVvdGV9JHtzY29wZVNlbGVjdG9yfV8ke2tleWZyYW1lTmFtZX0ke3F1b3RlfSR7ZW5kU3BhY2VzfWA7XG4gICAgICAgICAgfSksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB1c2VkIHRvIHNjb3BlIGEga2V5ZnJhbWVzIG5hbWUgKG9idGFpbmVkIGZyb20gYW4gYW5pbWF0aW9uIGRlY2xhcmF0aW9uKVxuICAgKiB1c2luZyBhbiBleGlzdGluZyBzZXQgb2YgdW5zY29wZWRLZXlmcmFtZXMgbmFtZXMgdG8gZGlzY2VybiBpZiB0aGUgc2NvcGluZyBuZWVkcyB0byBiZVxuICAgKiBwZXJmb3JtZWQgKGtleWZyYW1lcyBuYW1lcyBvZiBrZXlmcmFtZXMgbm90IGRlZmluZWQgaW4gdGhlIGNvbXBvbmVudCdzIGNzcyBuZWVkIG5vdCB0byBiZVxuICAgKiBzY29wZWQpLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5ZnJhbWUgdGhlIGtleWZyYW1lcyBuYW1lIHRvIGNoZWNrLlxuICAgKiBAcGFyYW0gc2NvcGVTZWxlY3RvciB0aGUgY29tcG9uZW50J3Mgc2NvcGUgc2VsZWN0b3IuXG4gICAqIEBwYXJhbSB1bnNjb3BlZEtleWZyYW1lc1NldCB0aGUgc2V0IG9mIHVuc2NvcGVkIGtleWZyYW1lcyBuYW1lcy5cbiAgICpcbiAgICogQHJldHVybnMgdGhlIHNjb3BlZCBuYW1lIG9mIHRoZSBrZXlmcmFtZSwgb3IgdGhlIG9yaWdpbmFsIG5hbWUgaXMgdGhlIG5hbWUgbmVlZCBub3QgdG8gYmVcbiAgICogc2NvcGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2NvcGVBbmltYXRpb25LZXlmcmFtZShcbiAgICAgIGtleWZyYW1lOiBzdHJpbmcsIHNjb3BlU2VsZWN0b3I6IHN0cmluZywgdW5zY29wZWRLZXlmcmFtZXNTZXQ6IFJlYWRvbmx5U2V0PHN0cmluZz4pOiBzdHJpbmcge1xuICAgIHJldHVybiBrZXlmcmFtZS5yZXBsYWNlKC9eKFxccyopKFsnXCJdPykoLis/KVxcMihcXHMqKSQvLCAoXywgc3BhY2VzMSwgcXVvdGUsIG5hbWUsIHNwYWNlczIpID0+IHtcbiAgICAgIG5hbWUgPSBgJHt1bnNjb3BlZEtleWZyYW1lc1NldC5oYXModW5lc2NhcGVRdW90ZXMobmFtZSwgcXVvdGUpKSA/IHNjb3BlU2VsZWN0b3IgKyAnXycgOiAnJ30ke1xuICAgICAgICAgIG5hbWV9YDtcbiAgICAgIHJldHVybiBgJHtzcGFjZXMxfSR7cXVvdGV9JHtuYW1lfSR7cXVvdGV9JHtzcGFjZXMyfWA7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gZXh0cmFwb2xhdGUgdGhlIHBvc3NpYmxlIGtleWZyYW1lcyBmcm9tIGFuXG4gICAqIGFuaW1hdGlvbiBkZWNsYXJhdGlvbiAod2l0aCBwb3NzaWJseSBtdWx0aXBsZSBhbmltYXRpb24gZGVmaW5pdGlvbnMpXG4gICAqXG4gICAqIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gY2FuIGJlIGRpdmlkZWQgaW4gdGhyZWUgcGFydHNcbiAgICogIC0gKF58XFxzKylcbiAgICogICAgc2ltcGx5IGNhcHR1cmVzIGhvdyBtYW55IChpZiBhbnkpIGxlYWRpbmcgd2hpdGVzcGFjZXMgYXJlIHByZXNlbnRcbiAgICogIC0gKD86KD86KFsnXCJdKSgoPzpcXFxcXFxcXHxcXFxcXFwyfCg/IVxcMikuKSspXFwyKXwoLT9bQS1aYS16XVtcXHdcXC1dKikpXG4gICAqICAgIGNhcHR1cmVzIHR3byBkaWZmZXJlbnQgcG9zc2libGUga2V5ZnJhbWVzLCBvbmVzIHdoaWNoIGFyZSBxdW90ZWQgb3Igb25lcyB3aGljaCBhcmUgdmFsaWQgY3NzXG4gICAqIGlkZW50cyAoY3VzdG9tIHByb3BlcnRpZXMgZXhjbHVkZWQpXG4gICAqICAtICg/PVssXFxzO118JClcbiAgICogICAgc2ltcGx5IG1hdGNoZXMgdGhlIGVuZCBvZiB0aGUgcG9zc2libGUga2V5ZnJhbWUsIHZhbGlkIGVuZGluZ3MgYXJlOiBhIGNvbW1hLCBhIHNwYWNlLCBhXG4gICAqIHNlbWljb2xvbiBvciB0aGUgZW5kIG9mIHRoZSBzdHJpbmdcbiAgICovXG4gIHByaXZhdGUgX2FuaW1hdGlvbkRlY2xhcmF0aW9uS2V5ZnJhbWVzUmUgPVxuICAgICAgLyhefFxccyspKD86KD86KFsnXCJdKSgoPzpcXFxcXFxcXHxcXFxcXFwyfCg/IVxcMikuKSspXFwyKXwoLT9bQS1aYS16XVtcXHdcXC1dKikpKD89WyxcXHNdfCQpL2c7XG5cbiAgLyoqXG4gICAqIFNjb3BlIGFuIGFuaW1hdGlvbiBydWxlIHNvIHRoYXQgdGhlIGtleWZyYW1lcyBtZW50aW9uZWQgaW4gc3VjaCBydWxlXG4gICAqIGFyZSBzY29wZWQgaWYgZGVmaW5lZCBpbiB0aGUgY29tcG9uZW50J3MgY3NzIGFuZCBsZWZ0IHVudG91Y2hlZCBvdGhlcndpc2UuXG4gICAqXG4gICAqIEl0IGNhbiBzY29wZSB2YWx1ZXMgb2YgYm90aCB0aGUgJ2FuaW1hdGlvbicgYW5kICdhbmltYXRpb24tbmFtZScgcHJvcGVydGllcy5cbiAgICpcbiAgICogQHBhcmFtIHJ1bGUgY3NzIHJ1bGUgdG8gc2NvcGUuXG4gICAqIEBwYXJhbSBzY29wZVNlbGVjdG9yIHRoZSBjb21wb25lbnQncyBzY29wZSBzZWxlY3Rvci5cbiAgICogQHBhcmFtIHVuc2NvcGVkS2V5ZnJhbWVzU2V0IHRoZSBzZXQgb2YgdW5zY29wZWQga2V5ZnJhbWVzIG5hbWVzLlxuICAgKlxuICAgKiBAcmV0dXJucyB0aGUgdXBkYXRlZCBjc3MgcnVsZS5cbiAgICoqL1xuICBwcml2YXRlIF9zY29wZUFuaW1hdGlvblJ1bGUoXG4gICAgICBydWxlOiBDc3NSdWxlLCBzY29wZVNlbGVjdG9yOiBzdHJpbmcsIHVuc2NvcGVkS2V5ZnJhbWVzU2V0OiBSZWFkb25seVNldDxzdHJpbmc+KTogQ3NzUnVsZSB7XG4gICAgbGV0IGNvbnRlbnQgPSBydWxlLmNvbnRlbnQucmVwbGFjZShcbiAgICAgICAgLygoPzpefFxccyt8OykoPzotd2Via2l0LSk/YW5pbWF0aW9uKD86XFxzKik6KD86XFxzKikpKFteO10rKS9nLFxuICAgICAgICAoXywgc3RhcnQsIGFuaW1hdGlvbkRlY2xhcmF0aW9ucykgPT4gc3RhcnQgK1xuICAgICAgICAgICAgYW5pbWF0aW9uRGVjbGFyYXRpb25zLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgdGhpcy5fYW5pbWF0aW9uRGVjbGFyYXRpb25LZXlmcmFtZXNSZSxcbiAgICAgICAgICAgICAgICAob3JpZ2luYWw6IHN0cmluZywgbGVhZGluZ1NwYWNlczogc3RyaW5nLCBxdW90ZSA9ICcnLCBxdW90ZWROYW1lOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgIG5vblF1b3RlZE5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKHF1b3RlZE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke2xlYWRpbmdTcGFjZXN9JHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njb3BlQW5pbWF0aW9uS2V5ZnJhbWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYCR7cXVvdGV9JHtxdW90ZWROYW1lfSR7cXVvdGV9YCwgc2NvcGVTZWxlY3RvciwgdW5zY29wZWRLZXlmcmFtZXNTZXQpfWA7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYW5pbWF0aW9uS2V5d29yZHMuaGFzKG5vblF1b3RlZE5hbWUpID9cbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGAke2xlYWRpbmdTcGFjZXN9JHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY29wZUFuaW1hdGlvbktleWZyYW1lKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub25RdW90ZWROYW1lLCBzY29wZVNlbGVjdG9yLCB1bnNjb3BlZEtleWZyYW1lc1NldCl9YDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShcbiAgICAgICAgLygoPzpefFxccyt8OykoPzotd2Via2l0LSk/YW5pbWF0aW9uLW5hbWUoPzpcXHMqKTooPzpcXHMqKSkoW147XSspL2csXG4gICAgICAgIChfbWF0Y2gsIHN0YXJ0LCBjb21tYVNlcGFyYXRlZEtleWZyYW1lcykgPT4gYCR7c3RhcnR9JHtcbiAgICAgICAgICAgIGNvbW1hU2VwYXJhdGVkS2V5ZnJhbWVzLnNwbGl0KCcsJylcbiAgICAgICAgICAgICAgICAubWFwKFxuICAgICAgICAgICAgICAgICAgICAoa2V5ZnJhbWU6IHN0cmluZykgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njb3BlQW5pbWF0aW9uS2V5ZnJhbWUoa2V5ZnJhbWUsIHNjb3BlU2VsZWN0b3IsIHVuc2NvcGVkS2V5ZnJhbWVzU2V0KSlcbiAgICAgICAgICAgICAgICAuam9pbignLCcpfWApO1xuICAgIHJldHVybiB7Li4ucnVsZSwgY29udGVudH07XG4gIH1cblxuICAvKlxuICAgKiBQcm9jZXNzIHN0eWxlcyB0byBjb252ZXJ0IG5hdGl2ZSBTaGFkb3dET00gcnVsZXMgdGhhdCB3aWxsIHRyaXBcbiAgICogdXAgdGhlIGNzcyBwYXJzZXI7IHdlIHJlbHkgb24gZGVjb3JhdGluZyB0aGUgc3R5bGVzaGVldCB3aXRoIGluZXJ0IHJ1bGVzLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgd2UgY29udmVydCB0aGlzIHJ1bGU6XG4gICAqXG4gICAqIHBvbHlmaWxsLW5leHQtc2VsZWN0b3IgeyBjb250ZW50OiAnOmhvc3QgbWVudS1pdGVtJzsgfVxuICAgKiA6OmNvbnRlbnQgbWVudS1pdGVtIHtcbiAgICpcbiAgICogdG8gdGhpczpcbiAgICpcbiAgICogc2NvcGVOYW1lIG1lbnUtaXRlbSB7XG4gICAqXG4gICAqKi9cbiAgcHJpdmF0ZSBfaW5zZXJ0UG9seWZpbGxEaXJlY3RpdmVzSW5Dc3NUZXh0KGNzc1RleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGNzc1RleHQucmVwbGFjZShfY3NzQ29udGVudE5leHRTZWxlY3RvclJlLCBmdW5jdGlvbiguLi5tOiBzdHJpbmdbXSkge1xuICAgICAgcmV0dXJuIG1bMl0gKyAneyc7XG4gICAgfSk7XG4gIH1cblxuICAvKlxuICAgKiBQcm9jZXNzIHN0eWxlcyB0byBhZGQgcnVsZXMgd2hpY2ggd2lsbCBvbmx5IGFwcGx5IHVuZGVyIHRoZSBwb2x5ZmlsbFxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgd2UgY29udmVydCB0aGlzIHJ1bGU6XG4gICAqXG4gICAqIHBvbHlmaWxsLXJ1bGUge1xuICAgKiAgIGNvbnRlbnQ6ICc6aG9zdCBtZW51LWl0ZW0nO1xuICAgKiAuLi5cbiAgICogfVxuICAgKlxuICAgKiB0byB0aGlzOlxuICAgKlxuICAgKiBzY29wZU5hbWUgbWVudS1pdGVtIHsuLi59XG4gICAqXG4gICAqKi9cbiAgcHJpdmF0ZSBfaW5zZXJ0UG9seWZpbGxSdWxlc0luQ3NzVGV4dChjc3NUZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBjc3NUZXh0LnJlcGxhY2UoX2Nzc0NvbnRlbnRSdWxlUmUsICguLi5tOiBzdHJpbmdbXSkgPT4ge1xuICAgICAgY29uc3QgcnVsZSA9IG1bMF0ucmVwbGFjZShtWzFdLCAnJykucmVwbGFjZShtWzJdLCAnJyk7XG4gICAgICByZXR1cm4gbVs0XSArIHJ1bGU7XG4gICAgfSk7XG4gIH1cblxuICAvKiBFbnN1cmUgc3R5bGVzIGFyZSBzY29wZWQuIFBzZXVkby1zY29waW5nIHRha2VzIGEgcnVsZSBsaWtlOlxuICAgKlxuICAgKiAgLmZvbyB7Li4uIH1cbiAgICpcbiAgICogIGFuZCBjb252ZXJ0cyB0aGlzIHRvXG4gICAqXG4gICAqICBzY29wZU5hbWUgLmZvbyB7IC4uLiB9XG4gICAqL1xuICBwcml2YXRlIF9zY29wZUNzc1RleHQoY3NzVGV4dDogc3RyaW5nLCBzY29wZVNlbGVjdG9yOiBzdHJpbmcsIGhvc3RTZWxlY3Rvcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCB1bnNjb3BlZFJ1bGVzID0gdGhpcy5fZXh0cmFjdFVuc2NvcGVkUnVsZXNGcm9tQ3NzVGV4dChjc3NUZXh0KTtcbiAgICAvLyByZXBsYWNlIDpob3N0IGFuZCA6aG9zdC1jb250ZXh0IC1zaGFkb3djc3Nob3N0IGFuZCAtc2hhZG93Y3NzaG9zdCByZXNwZWN0aXZlbHlcbiAgICBjc3NUZXh0ID0gdGhpcy5faW5zZXJ0UG9seWZpbGxIb3N0SW5Dc3NUZXh0KGNzc1RleHQpO1xuICAgIGNzc1RleHQgPSB0aGlzLl9jb252ZXJ0Q29sb25Ib3N0KGNzc1RleHQpO1xuICAgIGNzc1RleHQgPSB0aGlzLl9jb252ZXJ0Q29sb25Ib3N0Q29udGV4dChjc3NUZXh0KTtcbiAgICBjc3NUZXh0ID0gdGhpcy5fY29udmVydFNoYWRvd0RPTVNlbGVjdG9ycyhjc3NUZXh0KTtcbiAgICBpZiAoc2NvcGVTZWxlY3Rvcikge1xuICAgICAgY3NzVGV4dCA9IHRoaXMuX3Njb3BlS2V5ZnJhbWVzUmVsYXRlZENzcyhjc3NUZXh0LCBzY29wZVNlbGVjdG9yKTtcbiAgICAgIGNzc1RleHQgPSB0aGlzLl9zY29wZVNlbGVjdG9ycyhjc3NUZXh0LCBzY29wZVNlbGVjdG9yLCBob3N0U2VsZWN0b3IpO1xuICAgIH1cbiAgICBjc3NUZXh0ID0gY3NzVGV4dCArICdcXG4nICsgdW5zY29wZWRSdWxlcztcbiAgICByZXR1cm4gY3NzVGV4dC50cmltKCk7XG4gIH1cblxuICAvKlxuICAgKiBQcm9jZXNzIHN0eWxlcyB0byBhZGQgcnVsZXMgd2hpY2ggd2lsbCBvbmx5IGFwcGx5IHVuZGVyIHRoZSBwb2x5ZmlsbFxuICAgKiBhbmQgZG8gbm90IHByb2Nlc3MgdmlhIENTU09NLiAoQ1NTT00gaXMgZGVzdHJ1Y3RpdmUgdG8gcnVsZXMgb24gcmFyZVxuICAgKiBvY2Nhc2lvbnMsIGUuZy4gLXdlYmtpdC1jYWxjIG9uIFNhZmFyaS4pXG4gICAqIEZvciBleGFtcGxlLCB3ZSBjb252ZXJ0IHRoaXMgcnVsZTpcbiAgICpcbiAgICogQHBvbHlmaWxsLXVuc2NvcGVkLXJ1bGUge1xuICAgKiAgIGNvbnRlbnQ6ICdtZW51LWl0ZW0nO1xuICAgKiAuLi4gfVxuICAgKlxuICAgKiB0byB0aGlzOlxuICAgKlxuICAgKiBtZW51LWl0ZW0gey4uLn1cbiAgICpcbiAgICoqL1xuICBwcml2YXRlIF9leHRyYWN0VW5zY29wZWRSdWxlc0Zyb21Dc3NUZXh0KGNzc1RleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgbGV0IHIgPSAnJztcbiAgICBsZXQgbTogUmVnRXhwRXhlY0FycmF5fG51bGw7XG4gICAgX2Nzc0NvbnRlbnRVbnNjb3BlZFJ1bGVSZS5sYXN0SW5kZXggPSAwO1xuICAgIHdoaWxlICgobSA9IF9jc3NDb250ZW50VW5zY29wZWRSdWxlUmUuZXhlYyhjc3NUZXh0KSkgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHJ1bGUgPSBtWzBdLnJlcGxhY2UobVsyXSwgJycpLnJlcGxhY2UobVsxXSwgbVs0XSk7XG4gICAgICByICs9IHJ1bGUgKyAnXFxuXFxuJztcbiAgICB9XG4gICAgcmV0dXJuIHI7XG4gIH1cblxuICAvKlxuICAgKiBjb252ZXJ0IGEgcnVsZSBsaWtlIDpob3N0KC5mb28pID4gLmJhciB7IH1cbiAgICpcbiAgICogdG9cbiAgICpcbiAgICogLmZvbzxzY29wZU5hbWU+ID4gLmJhclxuICAgKi9cbiAgcHJpdmF0ZSBfY29udmVydENvbG9uSG9zdChjc3NUZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBjc3NUZXh0LnJlcGxhY2UoX2Nzc0NvbG9uSG9zdFJlLCAoXywgaG9zdFNlbGVjdG9yczogc3RyaW5nLCBvdGhlclNlbGVjdG9yczogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoaG9zdFNlbGVjdG9ycykge1xuICAgICAgICBjb25zdCBjb252ZXJ0ZWRTZWxlY3RvcnM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGhvc3RTZWxlY3RvckFycmF5ID0gaG9zdFNlbGVjdG9ycy5zcGxpdCgnLCcpLm1hcCgocCkgPT4gcC50cmltKCkpO1xuICAgICAgICBmb3IgKGNvbnN0IGhvc3RTZWxlY3RvciBvZiBob3N0U2VsZWN0b3JBcnJheSkge1xuICAgICAgICAgIGlmICghaG9zdFNlbGVjdG9yKSBicmVhaztcbiAgICAgICAgICBjb25zdCBjb252ZXJ0ZWRTZWxlY3RvciA9XG4gICAgICAgICAgICAgIF9wb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3IgKyBob3N0U2VsZWN0b3IucmVwbGFjZShfcG9seWZpbGxIb3N0LCAnJykgKyBvdGhlclNlbGVjdG9ycztcbiAgICAgICAgICBjb252ZXJ0ZWRTZWxlY3RvcnMucHVzaChjb252ZXJ0ZWRTZWxlY3Rvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbnZlcnRlZFNlbGVjdG9ycy5qb2luKCcsJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gX3BvbHlmaWxsSG9zdE5vQ29tYmluYXRvciArIG90aGVyU2VsZWN0b3JzO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLypcbiAgICogY29udmVydCBhIHJ1bGUgbGlrZSA6aG9zdC1jb250ZXh0KC5mb28pID4gLmJhciB7IH1cbiAgICpcbiAgICogdG9cbiAgICpcbiAgICogLmZvbzxzY29wZU5hbWU+ID4gLmJhciwgLmZvbyA8c2NvcGVOYW1lPiA+IC5iYXIgeyB9XG4gICAqXG4gICAqIGFuZFxuICAgKlxuICAgKiA6aG9zdC1jb250ZXh0KC5mb286aG9zdCkgLmJhciB7IC4uLiB9XG4gICAqXG4gICAqIHRvXG4gICAqXG4gICAqIC5mb288c2NvcGVOYW1lPiAuYmFyIHsgLi4uIH1cbiAgICovXG4gIHByaXZhdGUgX2NvbnZlcnRDb2xvbkhvc3RDb250ZXh0KGNzc1RleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGNzc1RleHQucmVwbGFjZShfY3NzQ29sb25Ib3N0Q29udGV4dFJlR2xvYmFsLCAoc2VsZWN0b3JUZXh0KSA9PiB7XG4gICAgICAvLyBXZSBoYXZlIGNhcHR1cmVkIGEgc2VsZWN0b3IgdGhhdCBjb250YWlucyBhIGA6aG9zdC1jb250ZXh0YCBydWxlLlxuXG4gICAgICAvLyBGb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSBgOmhvc3QtY29udGV4dGAgbWF5IGNvbnRhaW4gYSBjb21tYSBzZXBhcmF0ZWQgbGlzdCBvZiBzZWxlY3RvcnMuXG4gICAgICAvLyBFYWNoIGNvbnRleHQgc2VsZWN0b3IgZ3JvdXAgd2lsbCBjb250YWluIGEgbGlzdCBvZiBob3N0LWNvbnRleHQgc2VsZWN0b3JzIHRoYXQgbXVzdCBtYXRjaFxuICAgICAgLy8gYW4gYW5jZXN0b3Igb2YgdGhlIGhvc3QuXG4gICAgICAvLyAoTm9ybWFsbHkgYGNvbnRleHRTZWxlY3Rvckdyb3Vwc2Agd2lsbCBvbmx5IGNvbnRhaW4gYSBzaW5nbGUgYXJyYXkgb2YgY29udGV4dCBzZWxlY3RvcnMuKVxuICAgICAgY29uc3QgY29udGV4dFNlbGVjdG9yR3JvdXBzOiBzdHJpbmdbXVtdID0gW1tdXTtcblxuICAgICAgLy8gVGhlcmUgbWF5IGJlIG1vcmUgdGhhbiBgOmhvc3QtY29udGV4dGAgaW4gdGhpcyBzZWxlY3RvciBzbyBgc2VsZWN0b3JUZXh0YCBjb3VsZCBsb29rIGxpa2U6XG4gICAgICAvLyBgOmhvc3QtY29udGV4dCgub25lKTpob3N0LWNvbnRleHQoLnR3bylgLlxuICAgICAgLy8gRXhlY3V0ZSBgX2Nzc0NvbG9uSG9zdENvbnRleHRSZWAgb3ZlciBhbmQgb3ZlciB1bnRpbCB3ZSBoYXZlIGV4dHJhY3RlZCBhbGwgdGhlXG4gICAgICAvLyBgOmhvc3QtY29udGV4dGAgc2VsZWN0b3JzIGZyb20gdGhpcyBzZWxlY3Rvci5cbiAgICAgIGxldCBtYXRjaDogUmVnRXhwRXhlY0FycmF5fG51bGw7XG4gICAgICB3aGlsZSAoKG1hdGNoID0gX2Nzc0NvbG9uSG9zdENvbnRleHRSZS5leGVjKHNlbGVjdG9yVGV4dCkpKSB7XG4gICAgICAgIC8vIGBtYXRjaGAgPSBbJzpob3N0LWNvbnRleHQoPHNlbGVjdG9ycz4pPHJlc3Q+JywgPHNlbGVjdG9ycz4sIDxyZXN0Pl1cblxuICAgICAgICAvLyBUaGUgYDxzZWxlY3RvcnM+YCBjb3VsZCBhY3R1YWxseSBiZSBhIGNvbW1hIHNlcGFyYXRlZCBsaXN0OiBgOmhvc3QtY29udGV4dCgub25lLCAudHdvKWAuXG4gICAgICAgIGNvbnN0IG5ld0NvbnRleHRTZWxlY3RvcnMgPVxuICAgICAgICAgICAgKG1hdGNoWzFdID8/ICcnKS50cmltKCkuc3BsaXQoJywnKS5tYXAoKG0pID0+IG0udHJpbSgpKS5maWx0ZXIoKG0pID0+IG0gIT09ICcnKTtcblxuICAgICAgICAvLyBXZSBtdXN0IGR1cGxpY2F0ZSB0aGUgY3VycmVudCBzZWxlY3RvciBncm91cCBmb3IgZWFjaCBvZiB0aGVzZSBuZXcgc2VsZWN0b3JzLlxuICAgICAgICAvLyBGb3IgZXhhbXBsZSBpZiB0aGUgY3VycmVudCBncm91cHMgYXJlOlxuICAgICAgICAvLyBgYGBcbiAgICAgICAgLy8gW1xuICAgICAgICAvLyAgIFsnYScsICdiJywgJ2MnXSxcbiAgICAgICAgLy8gICBbJ3gnLCAneScsICd6J10sXG4gICAgICAgIC8vIF1cbiAgICAgICAgLy8gYGBgXG4gICAgICAgIC8vIEFuZCB3ZSBoYXZlIGEgbmV3IHNldCBvZiBjb21tYSBzZXBhcmF0ZWQgc2VsZWN0b3JzOiBgOmhvc3QtY29udGV4dChtLG4pYCB0aGVuIHRoZSBuZXdcbiAgICAgICAgLy8gZ3JvdXBzIGFyZTpcbiAgICAgICAgLy8gYGBgXG4gICAgICAgIC8vIFtcbiAgICAgICAgLy8gICBbJ2EnLCAnYicsICdjJywgJ20nXSxcbiAgICAgICAgLy8gICBbJ3gnLCAneScsICd6JywgJ20nXSxcbiAgICAgICAgLy8gICBbJ2EnLCAnYicsICdjJywgJ24nXSxcbiAgICAgICAgLy8gICBbJ3gnLCAneScsICd6JywgJ24nXSxcbiAgICAgICAgLy8gXVxuICAgICAgICAvLyBgYGBcbiAgICAgICAgY29uc3QgY29udGV4dFNlbGVjdG9yR3JvdXBzTGVuZ3RoID0gY29udGV4dFNlbGVjdG9yR3JvdXBzLmxlbmd0aDtcbiAgICAgICAgcmVwZWF0R3JvdXBzKGNvbnRleHRTZWxlY3Rvckdyb3VwcywgbmV3Q29udGV4dFNlbGVjdG9ycy5sZW5ndGgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5ld0NvbnRleHRTZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbnRleHRTZWxlY3Rvckdyb3Vwc0xlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBjb250ZXh0U2VsZWN0b3JHcm91cHNbaiArIGkgKiBjb250ZXh0U2VsZWN0b3JHcm91cHNMZW5ndGhdLnB1c2gobmV3Q29udGV4dFNlbGVjdG9yc1tpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBgc2VsZWN0b3JUZXh0YCBhbmQgc2VlIHJlcGVhdCB0byBzZWUgaWYgdGhlcmUgYXJlIG1vcmUgYDpob3N0LWNvbnRleHRgcy5cbiAgICAgICAgc2VsZWN0b3JUZXh0ID0gbWF0Y2hbMl07XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSBjb250ZXh0IHNlbGVjdG9ycyBub3cgbXVzdCBiZSBjb21iaW5lZCB3aXRoIGVhY2ggb3RoZXIgdG8gY2FwdHVyZSBhbGwgdGhlIHBvc3NpYmxlXG4gICAgICAvLyBzZWxlY3RvcnMgdGhhdCBgOmhvc3QtY29udGV4dGAgY2FuIG1hdGNoLiBTZWUgYGNvbWJpbmVIb3N0Q29udGV4dFNlbGVjdG9ycygpYCBmb3IgbW9yZVxuICAgICAgLy8gaW5mbyBhYm91dCBob3cgdGhpcyBpcyBkb25lLlxuICAgICAgcmV0dXJuIGNvbnRleHRTZWxlY3Rvckdyb3Vwc1xuICAgICAgICAgIC5tYXAoKGNvbnRleHRTZWxlY3RvcnMpID0+IGNvbWJpbmVIb3N0Q29udGV4dFNlbGVjdG9ycyhjb250ZXh0U2VsZWN0b3JzLCBzZWxlY3RvclRleHQpKVxuICAgICAgICAgIC5qb2luKCcsICcpO1xuICAgIH0pO1xuICB9XG5cbiAgLypcbiAgICogQ29udmVydCBjb21iaW5hdG9ycyBsaWtlIDo6c2hhZG93IGFuZCBwc2V1ZG8tZWxlbWVudHMgbGlrZSA6OmNvbnRlbnRcbiAgICogYnkgcmVwbGFjaW5nIHdpdGggc3BhY2UuXG4gICAqL1xuICBwcml2YXRlIF9jb252ZXJ0U2hhZG93RE9NU2VsZWN0b3JzKGNzc1RleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIF9zaGFkb3dET01TZWxlY3RvcnNSZS5yZWR1Y2UoKHJlc3VsdCwgcGF0dGVybikgPT4gcmVzdWx0LnJlcGxhY2UocGF0dGVybiwgJyAnKSwgY3NzVGV4dCk7XG4gIH1cblxuICAvLyBjaGFuZ2UgYSBzZWxlY3RvciBsaWtlICdkaXYnIHRvICduYW1lIGRpdidcbiAgcHJpdmF0ZSBfc2NvcGVTZWxlY3RvcnMoY3NzVGV4dDogc3RyaW5nLCBzY29wZVNlbGVjdG9yOiBzdHJpbmcsIGhvc3RTZWxlY3Rvcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcHJvY2Vzc1J1bGVzKGNzc1RleHQsIChydWxlOiBDc3NSdWxlKSA9PiB7XG4gICAgICBsZXQgc2VsZWN0b3IgPSBydWxlLnNlbGVjdG9yO1xuICAgICAgbGV0IGNvbnRlbnQgPSBydWxlLmNvbnRlbnQ7XG4gICAgICBpZiAocnVsZS5zZWxlY3RvclswXSAhPT0gJ0AnKSB7XG4gICAgICAgIHNlbGVjdG9yID0gdGhpcy5fc2NvcGVTZWxlY3RvcihydWxlLnNlbGVjdG9yLCBzY29wZVNlbGVjdG9yLCBob3N0U2VsZWN0b3IpO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICBydWxlLnNlbGVjdG9yLnN0YXJ0c1dpdGgoJ0BtZWRpYScpIHx8IHJ1bGUuc2VsZWN0b3Iuc3RhcnRzV2l0aCgnQHN1cHBvcnRzJykgfHxcbiAgICAgICAgICBydWxlLnNlbGVjdG9yLnN0YXJ0c1dpdGgoJ0Bkb2N1bWVudCcpIHx8IHJ1bGUuc2VsZWN0b3Iuc3RhcnRzV2l0aCgnQGxheWVyJykgfHxcbiAgICAgICAgICBydWxlLnNlbGVjdG9yLnN0YXJ0c1dpdGgoJ0Bjb250YWluZXInKSB8fCBydWxlLnNlbGVjdG9yLnN0YXJ0c1dpdGgoJ0BzY29wZScpKSB7XG4gICAgICAgIGNvbnRlbnQgPSB0aGlzLl9zY29wZVNlbGVjdG9ycyhydWxlLmNvbnRlbnQsIHNjb3BlU2VsZWN0b3IsIGhvc3RTZWxlY3Rvcik7XG4gICAgICB9IGVsc2UgaWYgKHJ1bGUuc2VsZWN0b3Iuc3RhcnRzV2l0aCgnQGZvbnQtZmFjZScpIHx8IHJ1bGUuc2VsZWN0b3Iuc3RhcnRzV2l0aCgnQHBhZ2UnKSkge1xuICAgICAgICBjb250ZW50ID0gdGhpcy5fc3RyaXBTY29waW5nU2VsZWN0b3JzKHJ1bGUuY29udGVudCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IENzc1J1bGUoc2VsZWN0b3IsIGNvbnRlbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBhIGNzcyB0ZXh0IHRoYXQgaXMgd2l0aGluIGEgcnVsZSB0aGF0IHNob3VsZCBub3QgY29udGFpbiBzY29wZSBzZWxlY3RvcnMgYnkgc2ltcGx5XG4gICAqIHJlbW92aW5nIHRoZW0hIEFuIGV4YW1wbGUgb2Ygc3VjaCBhIHJ1bGUgaXMgYEBmb250LWZhY2VgLlxuICAgKlxuICAgKiBgQGZvbnQtZmFjZWAgcnVsZXMgY2Fubm90IGNvbnRhaW4gbmVzdGVkIHNlbGVjdG9ycy4gTm9yIGNhbiB0aGV5IGJlIG5lc3RlZCB1bmRlciBhIHNlbGVjdG9yLlxuICAgKiBOb3JtYWxseSB0aGlzIHdvdWxkIGJlIGEgc3ludGF4IGVycm9yIGJ5IHRoZSBhdXRob3Igb2YgdGhlIHN0eWxlcy4gQnV0IGluIHNvbWUgcmFyZSBjYXNlcywgc3VjaFxuICAgKiBhcyBpbXBvcnRpbmcgc3R5bGVzIGZyb20gYSBsaWJyYXJ5LCBhbmQgYXBwbHlpbmcgYDpob3N0IDo6bmctZGVlcGAgdG8gdGhlIGltcG9ydGVkIHN0eWxlcywgd2VcbiAgICogY2FuIGVuZCB1cCB3aXRoIGJyb2tlbiBjc3MgaWYgdGhlIGltcG9ydGVkIHN0eWxlcyBoYXBwZW4gdG8gY29udGFpbiBAZm9udC1mYWNlIHJ1bGVzLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZTpcbiAgICpcbiAgICogYGBgXG4gICAqIDpob3N0IDo6bmctZGVlcCB7XG4gICAqICAgaW1wb3J0ICdzb21lL2xpYi9jb250YWluaW5nL2ZvbnQtZmFjZSc7XG4gICAqIH1cbiAgICpcbiAgICogU2ltaWxhciBsb2dpYyBhcHBsaWVzIHRvIGBAcGFnZWAgcnVsZXMgd2hpY2ggY2FuIGNvbnRhaW4gYSBwYXJ0aWN1bGFyIHNldCBvZiBwcm9wZXJ0aWVzLFxuICAgKiBhcyB3ZWxsIGFzIHNvbWUgc3BlY2lmaWMgYXQtcnVsZXMuIFNpbmNlIHRoZXkgY2FuJ3QgYmUgZW5jYXBzdWxhdGVkLCB3ZSBoYXZlIHRvIHN0cmlwXG4gICAqIGFueSBzY29waW5nIHNlbGVjdG9ycyBmcm9tIHRoZW0uIEZvciBtb3JlIGluZm9ybWF0aW9uOiBodHRwczovL3d3dy53My5vcmcvVFIvY3NzLXBhZ2UtM1xuICAgKiBgYGBcbiAgICovXG4gIHByaXZhdGUgX3N0cmlwU2NvcGluZ1NlbGVjdG9ycyhjc3NUZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBwcm9jZXNzUnVsZXMoY3NzVGV4dCwgKHJ1bGUpID0+IHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yID0gcnVsZS5zZWxlY3Rvci5yZXBsYWNlKF9zaGFkb3dEZWVwU2VsZWN0b3JzLCAnICcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShfcG9seWZpbGxIb3N0Tm9Db21iaW5hdG9yUmUsICcgJyk7XG4gICAgICByZXR1cm4gbmV3IENzc1J1bGUoc2VsZWN0b3IsIHJ1bGUuY29udGVudCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9zY29wZVNlbGVjdG9yKHNlbGVjdG9yOiBzdHJpbmcsIHNjb3BlU2VsZWN0b3I6IHN0cmluZywgaG9zdFNlbGVjdG9yOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBzZWxlY3Rvci5zcGxpdCgnLCcpXG4gICAgICAgIC5tYXAoKHBhcnQpID0+IHBhcnQudHJpbSgpLnNwbGl0KF9zaGFkb3dEZWVwU2VsZWN0b3JzKSlcbiAgICAgICAgLm1hcCgoZGVlcFBhcnRzKSA9PiB7XG4gICAgICAgICAgY29uc3QgW3NoYWxsb3dQYXJ0LCAuLi5vdGhlclBhcnRzXSA9IGRlZXBQYXJ0cztcbiAgICAgICAgICBjb25zdCBhcHBseVNjb3BlID0gKHNoYWxsb3dQYXJ0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zZWxlY3Rvck5lZWRzU2NvcGluZyhzaGFsbG93UGFydCwgc2NvcGVTZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2FwcGx5U2VsZWN0b3JTY29wZShzaGFsbG93UGFydCwgc2NvcGVTZWxlY3RvciwgaG9zdFNlbGVjdG9yKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBzaGFsbG93UGFydDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIHJldHVybiBbYXBwbHlTY29wZShzaGFsbG93UGFydCksIC4uLm90aGVyUGFydHNdLmpvaW4oJyAnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmpvaW4oJywgJyk7XG4gIH1cblxuICBwcml2YXRlIF9zZWxlY3Rvck5lZWRzU2NvcGluZyhzZWxlY3Rvcjogc3RyaW5nLCBzY29wZVNlbGVjdG9yOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCByZSA9IHRoaXMuX21ha2VTY29wZU1hdGNoZXIoc2NvcGVTZWxlY3Rvcik7XG4gICAgcmV0dXJuICFyZS50ZXN0KHNlbGVjdG9yKTtcbiAgfVxuXG4gIHByaXZhdGUgX21ha2VTY29wZU1hdGNoZXIoc2NvcGVTZWxlY3Rvcjogc3RyaW5nKTogUmVnRXhwIHtcbiAgICBjb25zdCBscmUgPSAvXFxbL2c7XG4gICAgY29uc3QgcnJlID0gL1xcXS9nO1xuICAgIHNjb3BlU2VsZWN0b3IgPSBzY29wZVNlbGVjdG9yLnJlcGxhY2UobHJlLCAnXFxcXFsnKS5yZXBsYWNlKHJyZSwgJ1xcXFxdJyk7XG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoJ14oJyArIHNjb3BlU2VsZWN0b3IgKyAnKScgKyBfc2VsZWN0b3JSZVN1ZmZpeCwgJ20nKTtcbiAgfVxuXG4gIC8vIHNjb3BlIHZpYSBuYW1lIGFuZCBbaXM9bmFtZV1cbiAgcHJpdmF0ZSBfYXBwbHlTaW1wbGVTZWxlY3RvclNjb3BlKHNlbGVjdG9yOiBzdHJpbmcsIHNjb3BlU2VsZWN0b3I6IHN0cmluZywgaG9zdFNlbGVjdG9yOiBzdHJpbmcpOlxuICAgICAgc3RyaW5nIHtcbiAgICAvLyBJbiBBbmRyb2lkIGJyb3dzZXIsIHRoZSBsYXN0SW5kZXggaXMgbm90IHJlc2V0IHdoZW4gdGhlIHJlZ2V4IGlzIHVzZWQgaW4gU3RyaW5nLnJlcGxhY2UoKVxuICAgIF9wb2x5ZmlsbEhvc3RSZS5sYXN0SW5kZXggPSAwO1xuICAgIGlmIChfcG9seWZpbGxIb3N0UmUudGVzdChzZWxlY3RvcikpIHtcbiAgICAgIGNvbnN0IHJlcGxhY2VCeSA9IGBbJHtob3N0U2VsZWN0b3J9XWA7XG4gICAgICByZXR1cm4gc2VsZWN0b3JcbiAgICAgICAgICAucmVwbGFjZShcbiAgICAgICAgICAgICAgX3BvbHlmaWxsSG9zdE5vQ29tYmluYXRvclJlLFxuICAgICAgICAgICAgICAoaG5jLCBzZWxlY3RvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxlY3Rvci5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICAvKFteOl0qKSg6KikoLiopLyxcbiAgICAgICAgICAgICAgICAgICAgKF86IHN0cmluZywgYmVmb3JlOiBzdHJpbmcsIGNvbG9uOiBzdHJpbmcsIGFmdGVyOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYmVmb3JlICsgcmVwbGFjZUJ5ICsgY29sb24gKyBhZnRlcjtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgLnJlcGxhY2UoX3BvbHlmaWxsSG9zdFJlLCByZXBsYWNlQnkgKyAnICcpO1xuICAgIH1cblxuICAgIHJldHVybiBzY29wZVNlbGVjdG9yICsgJyAnICsgc2VsZWN0b3I7XG4gIH1cblxuICAvLyByZXR1cm4gYSBzZWxlY3RvciB3aXRoIFtuYW1lXSBzdWZmaXggb24gZWFjaCBzaW1wbGUgc2VsZWN0b3JcbiAgLy8gZS5nLiAuZm9vLmJhciA+IC56b3QgYmVjb21lcyAuZm9vW25hbWVdLmJhcltuYW1lXSA+IC56b3RbbmFtZV0gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJpdmF0ZSBfYXBwbHlTZWxlY3RvclNjb3BlKHNlbGVjdG9yOiBzdHJpbmcsIHNjb3BlU2VsZWN0b3I6IHN0cmluZywgaG9zdFNlbGVjdG9yOiBzdHJpbmcpOlxuICAgICAgc3RyaW5nIHtcbiAgICBjb25zdCBpc1JlID0gL1xcW2lzPShbXlxcXV0qKVxcXS9nO1xuICAgIHNjb3BlU2VsZWN0b3IgPSBzY29wZVNlbGVjdG9yLnJlcGxhY2UoaXNSZSwgKF86IHN0cmluZywgLi4ucGFydHM6IHN0cmluZ1tdKSA9PiBwYXJ0c1swXSk7XG5cbiAgICBjb25zdCBhdHRyTmFtZSA9ICdbJyArIHNjb3BlU2VsZWN0b3IgKyAnXSc7XG5cbiAgICBjb25zdCBfc2NvcGVTZWxlY3RvclBhcnQgPSAocDogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgc2NvcGVkUCA9IHAudHJpbSgpO1xuXG4gICAgICBpZiAoIXNjb3BlZFApIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuXG4gICAgICBpZiAocC5pbmRleE9mKF9wb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3IpID4gLTEpIHtcbiAgICAgICAgc2NvcGVkUCA9IHRoaXMuX2FwcGx5U2ltcGxlU2VsZWN0b3JTY29wZShwLCBzY29wZVNlbGVjdG9yLCBob3N0U2VsZWN0b3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gcmVtb3ZlIDpob3N0IHNpbmNlIGl0IHNob3VsZCBiZSB1bm5lY2Vzc2FyeVxuICAgICAgICBjb25zdCB0ID0gcC5yZXBsYWNlKF9wb2x5ZmlsbEhvc3RSZSwgJycpO1xuICAgICAgICBpZiAodC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IHQubWF0Y2goLyhbXjpdKikoOiopKC4qKS8pO1xuICAgICAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgICAgICBzY29wZWRQID0gbWF0Y2hlc1sxXSArIGF0dHJOYW1lICsgbWF0Y2hlc1syXSArIG1hdGNoZXNbM107XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzY29wZWRQO1xuICAgIH07XG5cbiAgICBjb25zdCBzYWZlQ29udGVudCA9IG5ldyBTYWZlU2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgIHNlbGVjdG9yID0gc2FmZUNvbnRlbnQuY29udGVudCgpO1xuXG4gICAgbGV0IHNjb3BlZFNlbGVjdG9yID0gJyc7XG4gICAgbGV0IHN0YXJ0SW5kZXggPSAwO1xuICAgIGxldCByZXM6IFJlZ0V4cEV4ZWNBcnJheXxudWxsO1xuICAgIGNvbnN0IHNlcCA9IC8oIHw+fFxcK3x+KD8hPSkpXFxzKi9nO1xuXG4gICAgLy8gSWYgYSBzZWxlY3RvciBhcHBlYXJzIGJlZm9yZSA6aG9zdCBpdCBzaG91bGQgbm90IGJlIHNoaW1tZWQgYXMgaXRcbiAgICAvLyBtYXRjaGVzIG9uIGFuY2VzdG9yIGVsZW1lbnRzIGFuZCBub3Qgb24gZWxlbWVudHMgaW4gdGhlIGhvc3QncyBzaGFkb3dcbiAgICAvLyBgOmhvc3QtY29udGV4dChkaXYpYCBpcyB0cmFuc2Zvcm1lZCB0b1xuICAgIC8vIGAtc2hhZG93Y3NzaG9zdC1uby1jb21iaW5hdG9yZGl2LCBkaXYgLXNoYWRvd2Nzc2hvc3Qtbm8tY29tYmluYXRvcmBcbiAgICAvLyB0aGUgYGRpdmAgaXMgbm90IHBhcnQgb2YgdGhlIGNvbXBvbmVudCBpbiB0aGUgMm5kIHNlbGVjdG9ycyBhbmQgc2hvdWxkIG5vdCBiZSBzY29wZWQuXG4gICAgLy8gSGlzdG9yaWNhbGx5IGBjb21wb25lbnQtdGFnOmhvc3RgIHdhcyBtYXRjaGluZyB0aGUgY29tcG9uZW50IHNvIHdlIGFsc28gd2FudCB0byBwcmVzZXJ2ZVxuICAgIC8vIHRoaXMgYmVoYXZpb3IgdG8gYXZvaWQgYnJlYWtpbmcgbGVnYWN5IGFwcHMgKGl0IHNob3VsZCBub3QgbWF0Y2gpLlxuICAgIC8vIFRoZSBiZWhhdmlvciBzaG91bGQgYmU6XG4gICAgLy8gLSBgdGFnOmhvc3RgIC0+IGB0YWdbaF1gICh0aGlzIGlzIHRvIGF2b2lkIGJyZWFraW5nIGxlZ2FjeSBhcHBzLCBzaG91bGQgbm90IG1hdGNoIGFueXRoaW5nKVxuICAgIC8vIC0gYHRhZyA6aG9zdGAgLT4gYHRhZyBbaF1gIChgdGFnYCBpcyBub3Qgc2NvcGVkIGJlY2F1c2UgaXQncyBjb25zaWRlcmVkIHBhcnQgb2YgYVxuICAgIC8vICAgYDpob3N0LWNvbnRleHQodGFnKWApXG4gICAgY29uc3QgaGFzSG9zdCA9IHNlbGVjdG9yLmluZGV4T2YoX3BvbHlmaWxsSG9zdE5vQ29tYmluYXRvcikgPiAtMTtcbiAgICAvLyBPbmx5IHNjb3BlIHBhcnRzIGFmdGVyIHRoZSBmaXJzdCBgLXNoYWRvd2Nzc2hvc3Qtbm8tY29tYmluYXRvcmAgd2hlbiBpdCBpcyBwcmVzZW50XG4gICAgbGV0IHNob3VsZFNjb3BlID0gIWhhc0hvc3Q7XG5cbiAgICB3aGlsZSAoKHJlcyA9IHNlcC5leGVjKHNlbGVjdG9yKSkgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHNlcGFyYXRvciA9IHJlc1sxXTtcbiAgICAgIGNvbnN0IHBhcnQgPSBzZWxlY3Rvci5zbGljZShzdGFydEluZGV4LCByZXMuaW5kZXgpLnRyaW0oKTtcblxuICAgICAgLy8gQSBzcGFjZSBmb2xsb3dpbmcgYW4gZXNjYXBlZCBoZXggdmFsdWUgYW5kIGZvbGxvd2VkIGJ5IGFub3RoZXIgaGV4IGNoYXJhY3RlclxuICAgICAgLy8gKGllOiBcIi5cXGZjIGJlclwiIGZvciBcIi7DvGJlclwiKSBpcyBub3QgYSBzZXBhcmF0b3IgYmV0d2VlbiAyIHNlbGVjdG9yc1xuICAgICAgLy8gYWxzbyBrZWVwIGluIG1pbmQgdGhhdCBiYWNrc2xhc2hlcyBhcmUgcmVwbGFjZWQgYnkgYSBwbGFjZWhvbGRlciBieSBTYWZlU2VsZWN0b3JcbiAgICAgIC8vIFRoZXNlIGVzY2FwZWQgc2VsZWN0b3JzIGhhcHBlbiBmb3IgZXhhbXBsZSB3aGVuIGVzYnVpbGQgcnVucyB3aXRoIG9wdGltaXphdGlvbi5taW5pZnkuXG4gICAgICBpZiAocGFydC5tYXRjaChfcGxhY2Vob2xkZXJSZSkgJiYgc2VsZWN0b3JbcmVzLmluZGV4ICsgMV0/Lm1hdGNoKC9bYS1mQS1GXFxkXS8pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBzaG91bGRTY29wZSA9IHNob3VsZFNjb3BlIHx8IHBhcnQuaW5kZXhPZihfcG9seWZpbGxIb3N0Tm9Db21iaW5hdG9yKSA+IC0xO1xuICAgICAgY29uc3Qgc2NvcGVkUGFydCA9IHNob3VsZFNjb3BlID8gX3Njb3BlU2VsZWN0b3JQYXJ0KHBhcnQpIDogcGFydDtcbiAgICAgIHNjb3BlZFNlbGVjdG9yICs9IGAke3Njb3BlZFBhcnR9ICR7c2VwYXJhdG9yfSBgO1xuICAgICAgc3RhcnRJbmRleCA9IHNlcC5sYXN0SW5kZXg7XG4gICAgfVxuXG4gICAgY29uc3QgcGFydCA9IHNlbGVjdG9yLnN1YnN0cmluZyhzdGFydEluZGV4KTtcbiAgICBzaG91bGRTY29wZSA9IHNob3VsZFNjb3BlIHx8IHBhcnQuaW5kZXhPZihfcG9seWZpbGxIb3N0Tm9Db21iaW5hdG9yKSA+IC0xO1xuICAgIHNjb3BlZFNlbGVjdG9yICs9IHNob3VsZFNjb3BlID8gX3Njb3BlU2VsZWN0b3JQYXJ0KHBhcnQpIDogcGFydDtcblxuICAgIC8vIHJlcGxhY2UgdGhlIHBsYWNlaG9sZGVycyB3aXRoIHRoZWlyIG9yaWdpbmFsIHZhbHVlc1xuICAgIHJldHVybiBzYWZlQ29udGVudC5yZXN0b3JlKHNjb3BlZFNlbGVjdG9yKTtcbiAgfVxuXG4gIHByaXZhdGUgX2luc2VydFBvbHlmaWxsSG9zdEluQ3NzVGV4dChzZWxlY3Rvcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2VsZWN0b3IucmVwbGFjZShfY29sb25Ib3N0Q29udGV4dFJlLCBfcG9seWZpbGxIb3N0Q29udGV4dClcbiAgICAgICAgLnJlcGxhY2UoX2NvbG9uSG9zdFJlLCBfcG9seWZpbGxIb3N0KTtcbiAgfVxufVxuXG5jbGFzcyBTYWZlU2VsZWN0b3Ige1xuICBwcml2YXRlIHBsYWNlaG9sZGVyczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBpbmRleCA9IDA7XG4gIHByaXZhdGUgX2NvbnRlbnQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihzZWxlY3Rvcjogc3RyaW5nKSB7XG4gICAgLy8gUmVwbGFjZXMgYXR0cmlidXRlIHNlbGVjdG9ycyB3aXRoIHBsYWNlaG9sZGVycy5cbiAgICAvLyBUaGUgV1MgaW4gW2F0dHI9XCJ2YSBsdWVcIl0gd291bGQgb3RoZXJ3aXNlIGJlIGludGVycHJldGVkIGFzIGEgc2VsZWN0b3Igc2VwYXJhdG9yLlxuICAgIHNlbGVjdG9yID0gdGhpcy5fZXNjYXBlUmVnZXhNYXRjaGVzKHNlbGVjdG9yLCAvKFxcW1teXFxdXSpcXF0pL2cpO1xuXG4gICAgLy8gQ1NTIGFsbG93cyBmb3IgY2VydGFpbiBzcGVjaWFsIGNoYXJhY3RlcnMgdG8gYmUgdXNlZCBpbiBzZWxlY3RvcnMgaWYgdGhleSdyZSBlc2NhcGVkLlxuICAgIC8vIEUuZy4gYC5mb286Ymx1ZWAgd29uJ3QgbWF0Y2ggYSBjbGFzcyBjYWxsZWQgYGZvbzpibHVlYCwgYmVjYXVzZSB0aGUgY29sb24gZGVub3RlcyBhXG4gICAgLy8gcHNldWRvLWNsYXNzLCBidXQgd3JpdGluZyBgLmZvb1xcOmJsdWVgIHdpbGwgbWF0Y2gsIGJlY2F1c2UgdGhlIGNvbG9uIHdhcyBlc2NhcGVkLlxuICAgIC8vIFJlcGxhY2UgYWxsIGVzY2FwZSBzZXF1ZW5jZXMgKGBcXGAgZm9sbG93ZWQgYnkgYSBjaGFyYWN0ZXIpIHdpdGggYSBwbGFjZWhvbGRlciBzb1xuICAgIC8vIHRoYXQgb3VyIGhhbmRsaW5nIG9mIHBzZXVkby1zZWxlY3RvcnMgZG9lc24ndCBtZXNzIHdpdGggdGhlbS5cbiAgICBzZWxlY3RvciA9IHRoaXMuX2VzY2FwZVJlZ2V4TWF0Y2hlcyhzZWxlY3RvciwgLyhcXFxcLikvZyk7XG5cbiAgICAvLyBSZXBsYWNlcyB0aGUgZXhwcmVzc2lvbiBpbiBgOm50aC1jaGlsZCgybiArIDEpYCB3aXRoIGEgcGxhY2Vob2xkZXIuXG4gICAgLy8gV1MgYW5kIFwiK1wiIHdvdWxkIG90aGVyd2lzZSBiZSBpbnRlcnByZXRlZCBhcyBzZWxlY3RvciBzZXBhcmF0b3JzLlxuICAgIHRoaXMuX2NvbnRlbnQgPSBzZWxlY3Rvci5yZXBsYWNlKC8oOm50aC1bLVxcd10rKShcXChbXildK1xcKSkvZywgKF8sIHBzZXVkbywgZXhwKSA9PiB7XG4gICAgICBjb25zdCByZXBsYWNlQnkgPSBgX19waC0ke3RoaXMuaW5kZXh9X19gO1xuICAgICAgdGhpcy5wbGFjZWhvbGRlcnMucHVzaChleHApO1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgcmV0dXJuIHBzZXVkbyArIHJlcGxhY2VCeTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlc3RvcmUoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gY29udGVudC5yZXBsYWNlKF9wbGFjZWhvbGRlclJlLCAoX3BoLCBpbmRleCkgPT4gdGhpcy5wbGFjZWhvbGRlcnNbK2luZGV4XSk7XG4gIH1cblxuICBjb250ZW50KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRlbnQ7XG4gIH1cblxuICAvKipcbiAgICogUmVwbGFjZXMgYWxsIG9mIHRoZSBzdWJzdHJpbmdzIHRoYXQgbWF0Y2ggYSByZWdleCB3aXRoaW4gYVxuICAgKiBzcGVjaWFsIHN0cmluZyAoZS5nLiBgX19waC0wX19gLCBgX19waC0xX19gLCBldGMpLlxuICAgKi9cbiAgcHJpdmF0ZSBfZXNjYXBlUmVnZXhNYXRjaGVzKGNvbnRlbnQ6IHN0cmluZywgcGF0dGVybjogUmVnRXhwKTogc3RyaW5nIHtcbiAgICByZXR1cm4gY29udGVudC5yZXBsYWNlKHBhdHRlcm4sIChfLCBrZWVwKSA9PiB7XG4gICAgICBjb25zdCByZXBsYWNlQnkgPSBgX19waC0ke3RoaXMuaW5kZXh9X19gO1xuICAgICAgdGhpcy5wbGFjZWhvbGRlcnMucHVzaChrZWVwKTtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIHJldHVybiByZXBsYWNlQnk7XG4gICAgfSk7XG4gIH1cbn1cblxuY29uc3QgX2Nzc0NvbnRlbnROZXh0U2VsZWN0b3JSZSA9XG4gICAgL3BvbHlmaWxsLW5leHQtc2VsZWN0b3JbXn1dKmNvbnRlbnQ6W1xcc10qPyhbJ1wiXSkoLio/KVxcMVs7XFxzXSp9KFtee10qPyl7L2dpbTtcbmNvbnN0IF9jc3NDb250ZW50UnVsZVJlID0gLyhwb2x5ZmlsbC1ydWxlKVtefV0qKGNvbnRlbnQ6W1xcc10qKFsnXCJdKSguKj8pXFwzKVs7XFxzXSpbXn1dKn0vZ2ltO1xuY29uc3QgX2Nzc0NvbnRlbnRVbnNjb3BlZFJ1bGVSZSA9XG4gICAgLyhwb2x5ZmlsbC11bnNjb3BlZC1ydWxlKVtefV0qKGNvbnRlbnQ6W1xcc10qKFsnXCJdKSguKj8pXFwzKVs7XFxzXSpbXn1dKn0vZ2ltO1xuY29uc3QgX3BvbHlmaWxsSG9zdCA9ICctc2hhZG93Y3NzaG9zdCc7XG4vLyBub3RlOiA6aG9zdC1jb250ZXh0IHByZS1wcm9jZXNzZWQgdG8gLXNoYWRvd2Nzc2hvc3Rjb250ZXh0LlxuY29uc3QgX3BvbHlmaWxsSG9zdENvbnRleHQgPSAnLXNoYWRvd2Nzc2NvbnRleHQnO1xuY29uc3QgX3BhcmVuU3VmZml4ID0gJyg/OlxcXFwoKCcgK1xuICAgICcoPzpcXFxcKFteKShdKlxcXFwpfFteKShdKikrPycgK1xuICAgICcpXFxcXCkpPyhbXix7XSopJztcbmNvbnN0IF9jc3NDb2xvbkhvc3RSZSA9IG5ldyBSZWdFeHAoX3BvbHlmaWxsSG9zdCArIF9wYXJlblN1ZmZpeCwgJ2dpbScpO1xuY29uc3QgX2Nzc0NvbG9uSG9zdENvbnRleHRSZUdsb2JhbCA9IG5ldyBSZWdFeHAoX3BvbHlmaWxsSG9zdENvbnRleHQgKyBfcGFyZW5TdWZmaXgsICdnaW0nKTtcbmNvbnN0IF9jc3NDb2xvbkhvc3RDb250ZXh0UmUgPSBuZXcgUmVnRXhwKF9wb2x5ZmlsbEhvc3RDb250ZXh0ICsgX3BhcmVuU3VmZml4LCAnaW0nKTtcbmNvbnN0IF9wb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3IgPSBfcG9seWZpbGxIb3N0ICsgJy1uby1jb21iaW5hdG9yJztcbmNvbnN0IF9wb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3JSZSA9IC8tc2hhZG93Y3NzaG9zdC1uby1jb21iaW5hdG9yKFteXFxzXSopLztcbmNvbnN0IF9zaGFkb3dET01TZWxlY3RvcnNSZSA9IFtcbiAgLzo6c2hhZG93L2csXG4gIC86OmNvbnRlbnQvZyxcbiAgLy8gRGVwcmVjYXRlZCBzZWxlY3RvcnNcbiAgL1xcL3NoYWRvdy1kZWVwXFwvL2csXG4gIC9cXC9zaGFkb3dcXC8vZyxcbl07XG5cbi8vIFRoZSBkZWVwIGNvbWJpbmF0b3IgaXMgZGVwcmVjYXRlZCBpbiB0aGUgQ1NTIHNwZWNcbi8vIFN1cHBvcnQgZm9yIGA+Pj5gLCBgZGVlcGAsIGA6Om5nLWRlZXBgIGlzIHRoZW4gYWxzbyBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIGZ1dHVyZS5cbi8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3B1bGwvMTc2NzdcbmNvbnN0IF9zaGFkb3dEZWVwU2VsZWN0b3JzID0gLyg/Oj4+Pil8KD86XFwvZGVlcFxcLyl8KD86OjpuZy1kZWVwKS9nO1xuY29uc3QgX3NlbGVjdG9yUmVTdWZmaXggPSAnKFs+XFxcXHN+K1suLHs6XVtcXFxcc1xcXFxTXSopPyQnO1xuY29uc3QgX3BvbHlmaWxsSG9zdFJlID0gLy1zaGFkb3djc3Nob3N0L2dpbTtcbmNvbnN0IF9jb2xvbkhvc3RSZSA9IC86aG9zdC9naW07XG5jb25zdCBfY29sb25Ib3N0Q29udGV4dFJlID0gLzpob3N0LWNvbnRleHQvZ2ltO1xuXG5jb25zdCBfbmV3TGluZXNSZSA9IC9cXHI/XFxuL2c7XG5jb25zdCBfY29tbWVudFJlID0gL1xcL1xcKltcXHNcXFNdKj9cXCpcXC8vZztcbmNvbnN0IF9jb21tZW50V2l0aEhhc2hSZSA9IC9cXC9cXCpcXHMqI1xccypzb3VyY2UoTWFwcGluZyk/VVJMPS9nO1xuY29uc3QgQ09NTUVOVF9QTEFDRUhPTERFUiA9ICclQ09NTUVOVCUnO1xuY29uc3QgX2NvbW1lbnRXaXRoSGFzaFBsYWNlSG9sZGVyUmUgPSBuZXcgUmVnRXhwKENPTU1FTlRfUExBQ0VIT0xERVIsICdnJyk7XG5cbmNvbnN0IF9wbGFjZWhvbGRlclJlID0gL19fcGgtKFxcZCspX18vZztcblxuY29uc3QgQkxPQ0tfUExBQ0VIT0xERVIgPSAnJUJMT0NLJSc7XG5jb25zdCBfcnVsZVJlID0gbmV3IFJlZ0V4cChcbiAgICBgKFxcXFxzKig/OiR7Q09NTUVOVF9QTEFDRUhPTERFUn1cXFxccyopKikoW147XFxcXHtcXFxcfV0rPykoXFxcXHMqKSgoPzp7JUJMT0NLJX0/XFxcXHMqOz8pfCg/OlxcXFxzKjspKWAsXG4gICAgJ2cnKTtcbmNvbnN0IENPTlRFTlRfUEFJUlMgPSBuZXcgTWFwKFtbJ3snLCAnfSddXSk7XG5cbmNvbnN0IENPTU1BX0lOX1BMQUNFSE9MREVSID0gJyVDT01NQV9JTl9QTEFDRUhPTERFUiUnO1xuY29uc3QgU0VNSV9JTl9QTEFDRUhPTERFUiA9ICclU0VNSV9JTl9QTEFDRUhPTERFUiUnO1xuY29uc3QgQ09MT05fSU5fUExBQ0VIT0xERVIgPSAnJUNPTE9OX0lOX1BMQUNFSE9MREVSJSc7XG5cbmNvbnN0IF9jc3NDb21tYUluUGxhY2Vob2xkZXJSZUdsb2JhbCA9IG5ldyBSZWdFeHAoQ09NTUFfSU5fUExBQ0VIT0xERVIsICdnJyk7XG5jb25zdCBfY3NzU2VtaUluUGxhY2Vob2xkZXJSZUdsb2JhbCA9IG5ldyBSZWdFeHAoU0VNSV9JTl9QTEFDRUhPTERFUiwgJ2cnKTtcbmNvbnN0IF9jc3NDb2xvbkluUGxhY2Vob2xkZXJSZUdsb2JhbCA9IG5ldyBSZWdFeHAoQ09MT05fSU5fUExBQ0VIT0xERVIsICdnJyk7XG5cbmV4cG9ydCBjbGFzcyBDc3NSdWxlIHtcbiAgY29uc3RydWN0b3IocHVibGljIHNlbGVjdG9yOiBzdHJpbmcsIHB1YmxpYyBjb250ZW50OiBzdHJpbmcpIHt9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzUnVsZXMoaW5wdXQ6IHN0cmluZywgcnVsZUNhbGxiYWNrOiAocnVsZTogQ3NzUnVsZSkgPT4gQ3NzUnVsZSk6IHN0cmluZyB7XG4gIGNvbnN0IGVzY2FwZWQgPSBlc2NhcGVJblN0cmluZ3MoaW5wdXQpO1xuICBjb25zdCBpbnB1dFdpdGhFc2NhcGVkQmxvY2tzID0gZXNjYXBlQmxvY2tzKGVzY2FwZWQsIENPTlRFTlRfUEFJUlMsIEJMT0NLX1BMQUNFSE9MREVSKTtcbiAgbGV0IG5leHRCbG9ja0luZGV4ID0gMDtcbiAgY29uc3QgZXNjYXBlZFJlc3VsdCA9IGlucHV0V2l0aEVzY2FwZWRCbG9ja3MuZXNjYXBlZFN0cmluZy5yZXBsYWNlKF9ydWxlUmUsICguLi5tOiBzdHJpbmdbXSkgPT4ge1xuICAgIGNvbnN0IHNlbGVjdG9yID0gbVsyXTtcbiAgICBsZXQgY29udGVudCA9ICcnO1xuICAgIGxldCBzdWZmaXggPSBtWzRdO1xuICAgIGxldCBjb250ZW50UHJlZml4ID0gJyc7XG4gICAgaWYgKHN1ZmZpeCAmJiBzdWZmaXguc3RhcnRzV2l0aCgneycgKyBCTE9DS19QTEFDRUhPTERFUikpIHtcbiAgICAgIGNvbnRlbnQgPSBpbnB1dFdpdGhFc2NhcGVkQmxvY2tzLmJsb2Nrc1tuZXh0QmxvY2tJbmRleCsrXTtcbiAgICAgIHN1ZmZpeCA9IHN1ZmZpeC5zdWJzdHJpbmcoQkxPQ0tfUExBQ0VIT0xERVIubGVuZ3RoICsgMSk7XG4gICAgICBjb250ZW50UHJlZml4ID0gJ3snO1xuICAgIH1cbiAgICBjb25zdCBydWxlID0gcnVsZUNhbGxiYWNrKG5ldyBDc3NSdWxlKHNlbGVjdG9yLCBjb250ZW50KSk7XG4gICAgcmV0dXJuIGAke21bMV19JHtydWxlLnNlbGVjdG9yfSR7bVszXX0ke2NvbnRlbnRQcmVmaXh9JHtydWxlLmNvbnRlbnR9JHtzdWZmaXh9YDtcbiAgfSk7XG4gIHJldHVybiB1bmVzY2FwZUluU3RyaW5ncyhlc2NhcGVkUmVzdWx0KTtcbn1cblxuY2xhc3MgU3RyaW5nV2l0aEVzY2FwZWRCbG9ja3Mge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgZXNjYXBlZFN0cmluZzogc3RyaW5nLCBwdWJsaWMgYmxvY2tzOiBzdHJpbmdbXSkge31cbn1cblxuZnVuY3Rpb24gZXNjYXBlQmxvY2tzKFxuICAgIGlucHV0OiBzdHJpbmcsIGNoYXJQYWlyczogTWFwPHN0cmluZywgc3RyaW5nPiwgcGxhY2Vob2xkZXI6IHN0cmluZyk6IFN0cmluZ1dpdGhFc2NhcGVkQmxvY2tzIHtcbiAgY29uc3QgcmVzdWx0UGFydHM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGVzY2FwZWRCbG9ja3M6IHN0cmluZ1tdID0gW107XG4gIGxldCBvcGVuQ2hhckNvdW50ID0gMDtcbiAgbGV0IG5vbkJsb2NrU3RhcnRJbmRleCA9IDA7XG4gIGxldCBibG9ja1N0YXJ0SW5kZXggPSAtMTtcbiAgbGV0IG9wZW5DaGFyOiBzdHJpbmd8dW5kZWZpbmVkO1xuICBsZXQgY2xvc2VDaGFyOiBzdHJpbmd8dW5kZWZpbmVkO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXQubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjaGFyID0gaW5wdXRbaV07XG4gICAgaWYgKGNoYXIgPT09ICdcXFxcJykge1xuICAgICAgaSsrO1xuICAgIH0gZWxzZSBpZiAoY2hhciA9PT0gY2xvc2VDaGFyKSB7XG4gICAgICBvcGVuQ2hhckNvdW50LS07XG4gICAgICBpZiAob3BlbkNoYXJDb3VudCA9PT0gMCkge1xuICAgICAgICBlc2NhcGVkQmxvY2tzLnB1c2goaW5wdXQuc3Vic3RyaW5nKGJsb2NrU3RhcnRJbmRleCwgaSkpO1xuICAgICAgICByZXN1bHRQYXJ0cy5wdXNoKHBsYWNlaG9sZGVyKTtcbiAgICAgICAgbm9uQmxvY2tTdGFydEluZGV4ID0gaTtcbiAgICAgICAgYmxvY2tTdGFydEluZGV4ID0gLTE7XG4gICAgICAgIG9wZW5DaGFyID0gY2xvc2VDaGFyID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2hhciA9PT0gb3BlbkNoYXIpIHtcbiAgICAgIG9wZW5DaGFyQ291bnQrKztcbiAgICB9IGVsc2UgaWYgKG9wZW5DaGFyQ291bnQgPT09IDAgJiYgY2hhclBhaXJzLmhhcyhjaGFyKSkge1xuICAgICAgb3BlbkNoYXIgPSBjaGFyO1xuICAgICAgY2xvc2VDaGFyID0gY2hhclBhaXJzLmdldChjaGFyKTtcbiAgICAgIG9wZW5DaGFyQ291bnQgPSAxO1xuICAgICAgYmxvY2tTdGFydEluZGV4ID0gaSArIDE7XG4gICAgICByZXN1bHRQYXJ0cy5wdXNoKGlucHV0LnN1YnN0cmluZyhub25CbG9ja1N0YXJ0SW5kZXgsIGJsb2NrU3RhcnRJbmRleCkpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChibG9ja1N0YXJ0SW5kZXggIT09IC0xKSB7XG4gICAgZXNjYXBlZEJsb2Nrcy5wdXNoKGlucHV0LnN1YnN0cmluZyhibG9ja1N0YXJ0SW5kZXgpKTtcbiAgICByZXN1bHRQYXJ0cy5wdXNoKHBsYWNlaG9sZGVyKTtcbiAgfSBlbHNlIHtcbiAgICByZXN1bHRQYXJ0cy5wdXNoKGlucHV0LnN1YnN0cmluZyhub25CbG9ja1N0YXJ0SW5kZXgpKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgU3RyaW5nV2l0aEVzY2FwZWRCbG9ja3MocmVzdWx0UGFydHMuam9pbignJyksIGVzY2FwZWRCbG9ja3MpO1xufVxuXG4vKipcbiAqIE9iamVjdCBjb250YWluaW5nIGFzIGtleXMgY2hhcmFjdGVycyB0aGF0IHNob3VsZCBiZSBzdWJzdGl0dXRlZCBieSBwbGFjZWhvbGRlcnNcbiAqIHdoZW4gZm91bmQgaW4gc3RyaW5ncyBkdXJpbmcgdGhlIGNzcyB0ZXh0IHBhcnNpbmcsIGFuZCBhcyB2YWx1ZXMgdGhlIHJlc3BlY3RpdmVcbiAqIHBsYWNlaG9sZGVyc1xuICovXG5jb25zdCBFU0NBUEVfSU5fU1RSSU5HX01BUDoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7XG4gICc7JzogU0VNSV9JTl9QTEFDRUhPTERFUixcbiAgJywnOiBDT01NQV9JTl9QTEFDRUhPTERFUixcbiAgJzonOiBDT0xPTl9JTl9QTEFDRUhPTERFUlxufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgcHJvdmlkZWQgY3NzIHRleHQgYW5kIGluc2lkZSBzdHJpbmdzIChtZWFuaW5nLCBpbnNpZGUgcGFpcnMgb2YgdW5lc2NhcGVkIHNpbmdsZSBvclxuICogZG91YmxlIHF1b3RlcykgcmVwbGFjZSBzcGVjaWZpYyBjaGFyYWN0ZXJzIHdpdGggdGhlaXIgcmVzcGVjdGl2ZSBwbGFjZWhvbGRlcnMgYXMgaW5kaWNhdGVkXG4gKiBieSB0aGUgYEVTQ0FQRV9JTl9TVFJJTkdfTUFQYCBtYXAuXG4gKlxuICogRm9yIGV4YW1wbGUgY29udmVydCB0aGUgdGV4dFxuICogIGBhbmltYXRpb246IFwibXktYW5pbTphdFxcXCJpb25cIiAxcztgXG4gKiB0b1xuICogIGBhbmltYXRpb246IFwibXktYW5pbSVDT0xPTl9JTl9QTEFDRUhPTERFUiVhdFxcXCJpb25cIiAxcztgXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgaW4gb3JkZXIgdG8gcmVtb3ZlIHRoZSBtZWFuaW5nIG9mIHNvbWUgY2hhcmFjdGVycyB3aGVuIGZvdW5kIGluc2lkZSBzdHJpbmdzXG4gKiAoZm9yIGV4YW1wbGUgYDtgIGluZGljYXRlcyB0aGUgZW5kIG9mIGEgY3NzIGRlY2xhcmF0aW9uLCBgLGAgdGhlIHNlcXVlbmNlIG9mIHZhbHVlcyBhbmQgYDpgIHRoZVxuICogZGl2aXNpb24gYmV0d2VlbiBwcm9wZXJ0eSBhbmQgdmFsdWUgZHVyaW5nIGEgZGVjbGFyYXRpb24sIG5vbmUgb2YgdGhlc2UgbWVhbmluZ3MgYXBwbHkgd2hlbiBzdWNoXG4gKiBjaGFyYWN0ZXJzIGFyZSB3aXRoaW4gc3RyaW5ncyBhbmQgc28gaW4gb3JkZXIgdG8gcHJldmVudCBwYXJzaW5nIGlzc3VlcyB0aGV5IG5lZWQgdG8gYmUgcmVwbGFjZWRcbiAqIHdpdGggcGxhY2Vob2xkZXIgdGV4dCBmb3IgdGhlIGR1cmF0aW9uIG9mIHRoZSBjc3MgbWFuaXB1bGF0aW9uIHByb2Nlc3MpLlxuICpcbiAqIEBwYXJhbSBpbnB1dCB0aGUgb3JpZ2luYWwgY3NzIHRleHQuXG4gKlxuICogQHJldHVybnMgdGhlIGNzcyB0ZXh0IHdpdGggc3BlY2lmaWMgY2hhcmFjdGVycyBpbiBzdHJpbmdzIHJlcGxhY2VkIGJ5IHBsYWNlaG9sZGVycy5cbiAqKi9cbmZ1bmN0aW9uIGVzY2FwZUluU3RyaW5ncyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IHJlc3VsdCA9IGlucHV0O1xuICBsZXQgY3VycmVudFF1b3RlQ2hhcjogc3RyaW5nfG51bGwgPSBudWxsO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3VsdC5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoYXIgPSByZXN1bHRbaV07XG4gICAgaWYgKGNoYXIgPT09ICdcXFxcJykge1xuICAgICAgaSsrO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY3VycmVudFF1b3RlQ2hhciAhPT0gbnVsbCkge1xuICAgICAgICAvLyBpbmRleCBpIGlzIGluc2lkZSBhIHF1b3RlZCBzdWItc3RyaW5nXG4gICAgICAgIGlmIChjaGFyID09PSBjdXJyZW50UXVvdGVDaGFyKSB7XG4gICAgICAgICAgY3VycmVudFF1b3RlQ2hhciA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgcGxhY2Vob2xkZXI6IHN0cmluZ3x1bmRlZmluZWQgPSBFU0NBUEVfSU5fU1RSSU5HX01BUFtjaGFyXTtcbiAgICAgICAgICBpZiAocGxhY2Vob2xkZXIpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGAke3Jlc3VsdC5zdWJzdHIoMCwgaSl9JHtwbGFjZWhvbGRlcn0ke3Jlc3VsdC5zdWJzdHIoaSArIDEpfWA7XG4gICAgICAgICAgICBpICs9IHBsYWNlaG9sZGVyLmxlbmd0aCAtIDE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoYXIgPT09ICdcXCcnIHx8IGNoYXIgPT09ICdcIicpIHtcbiAgICAgICAgY3VycmVudFF1b3RlQ2hhciA9IGNoYXI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmVwbGFjZSBpbiBhIHN0cmluZyBhbGwgb2NjdXJyZW5jZXMgb2Yga2V5cyBpbiB0aGUgYEVTQ0FQRV9JTl9TVFJJTkdfTUFQYCBtYXAgd2l0aCB0aGVpclxuICogb3JpZ2luYWwgcmVwcmVzZW50YXRpb24sIHRoaXMgaXMgc2ltcGx5IHVzZWQgdG8gcmV2ZXJ0IHRoZSBjaGFuZ2VzIGFwcGxpZWQgYnkgdGhlXG4gKiBlc2NhcGVJblN0cmluZ3MgZnVuY3Rpb24uXG4gKlxuICogRm9yIGV4YW1wbGUgaXQgcmV2ZXJ0cyB0aGUgdGV4dDpcbiAqICBgYW5pbWF0aW9uOiBcIm15LWFuaW0lQ09MT05fSU5fUExBQ0VIT0xERVIlYXRcXFwiaW9uXCIgMXM7YFxuICogdG8gaXQncyBvcmlnaW5hbCBmb3JtIG9mOlxuICogIGBhbmltYXRpb246IFwibXktYW5pbTphdFxcXCJpb25cIiAxcztgXG4gKlxuICogTm90ZTogRm9yIHRoZSBzYWtlIG9mIHNpbXBsaWNpdHkgdGhpcyBmdW5jdGlvbiBkb2VzIG5vdCBjaGVjayB0aGF0IHRoZSBwbGFjZWhvbGRlcnMgYXJlXG4gKiBhY3R1YWxseSBpbnNpZGUgc3RyaW5ncyBhcyBpdCB3b3VsZCBhbnl3YXkgYmUgZXh0cmVtZWx5IHVubGlrZWx5IHRvIGZpbmQgdGhlbSBvdXRzaWRlIG9mIHN0cmluZ3MuXG4gKlxuICogQHBhcmFtIGlucHV0IHRoZSBjc3MgdGV4dCBjb250YWluaW5nIHRoZSBwbGFjZWhvbGRlcnMuXG4gKlxuICogQHJldHVybnMgdGhlIGNzcyB0ZXh0IHdpdGhvdXQgdGhlIHBsYWNlaG9sZGVycy5cbiAqL1xuZnVuY3Rpb24gdW5lc2NhcGVJblN0cmluZ3MoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCByZXN1bHQgPSBpbnB1dC5yZXBsYWNlKF9jc3NDb21tYUluUGxhY2Vob2xkZXJSZUdsb2JhbCwgJywnKTtcbiAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoX2Nzc1NlbWlJblBsYWNlaG9sZGVyUmVHbG9iYWwsICc7Jyk7XG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKF9jc3NDb2xvbkluUGxhY2Vob2xkZXJSZUdsb2JhbCwgJzonKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBVbmVzY2FwZSBhbGwgcXVvdGVzIHByZXNlbnQgaW4gYSBzdHJpbmcsIGJ1dCBvbmx5IGlmIHRoZSBzdHJpbmcgd2FzIGFjdHVhbGx5IGFscmVhZHlcbiAqIHF1b3RlZC5cbiAqXG4gKiBUaGlzIGdlbmVyYXRlcyBhIFwiY2Fub25pY2FsXCIgcmVwcmVzZW50YXRpb24gb2Ygc3RyaW5ncyB3aGljaCBjYW4gYmUgdXNlZCB0byBtYXRjaCBzdHJpbmdzXG4gKiB3aGljaCB3b3VsZCBvdGhlcndpc2Ugb25seSBkaWZmZXIgYmVjYXVzZSBvZiBkaWZmZXJlbnRseSBlc2NhcGVkIHF1b3Rlcy5cbiAqXG4gKiBGb3IgZXhhbXBsZSBpdCBjb252ZXJ0cyB0aGUgc3RyaW5nIChhc3N1bWVkIHRvIGJlIHF1b3RlZCk6XG4gKiAgYHRoaXMgXFxcXFwiaXNcXFxcXCIgYSBcXFxcJ1xcXFxcXFxcJ3Rlc3RgXG4gKiB0bzpcbiAqICBgdGhpcyBcImlzXCIgYSAnXFxcXFxcXFwndGVzdGBcbiAqIChub3RlIHRoYXQgdGhlIGxhdHRlciBiYWNrc2xhc2hlcyBhcmUgbm90IHJlbW92ZWQgYXMgdGhleSBhcmUgbm90IGFjdHVhbGx5IGVzY2FwaW5nIHRoZSBzaW5nbGVcbiAqIHF1b3RlKVxuICpcbiAqXG4gKiBAcGFyYW0gaW5wdXQgdGhlIHN0cmluZyBwb3NzaWJseSBjb250YWluaW5nIGVzY2FwZWQgcXVvdGVzLlxuICogQHBhcmFtIGlzUXVvdGVkIGJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBzdHJpbmcgd2FzIHF1b3RlZCBpbnNpZGUgYSBiaWdnZXIgc3RyaW5nIChpZiBub3RcbiAqIHRoZW4gaXQgbWVhbnMgdGhhdCBpdCBkb2Vzbid0IHJlcHJlc2VudCBhbiBpbm5lciBzdHJpbmcgYW5kIHRodXMgbm8gdW5lc2NhcGluZyBpcyByZXF1aXJlZClcbiAqXG4gKiBAcmV0dXJucyB0aGUgc3RyaW5nIGluIHRoZSBcImNhbm9uaWNhbFwiIHJlcHJlc2VudGF0aW9uIHdpdGhvdXQgZXNjYXBlZCBxdW90ZXMuXG4gKi9cbmZ1bmN0aW9uIHVuZXNjYXBlUXVvdGVzKHN0cjogc3RyaW5nLCBpc1F1b3RlZDogYm9vbGVhbik6IHN0cmluZyB7XG4gIHJldHVybiAhaXNRdW90ZWQgPyBzdHIgOiBzdHIucmVwbGFjZSgvKCg/Ol58W15cXFxcXSkoPzpcXFxcXFxcXCkqKVxcXFwoPz1bJ1wiXSkvZywgJyQxJyk7XG59XG5cbi8qKlxuICogQ29tYmluZSB0aGUgYGNvbnRleHRTZWxlY3RvcnNgIHdpdGggdGhlIGBob3N0TWFya2VyYCBhbmQgdGhlIGBvdGhlclNlbGVjdG9yc2BcbiAqIHRvIGNyZWF0ZSBhIHNlbGVjdG9yIHRoYXQgbWF0Y2hlcyB0aGUgc2FtZSBhcyBgOmhvc3QtY29udGV4dCgpYC5cbiAqXG4gKiBHaXZlbiBhIHNpbmdsZSBjb250ZXh0IHNlbGVjdG9yIGBBYCB3ZSBuZWVkIHRvIG91dHB1dCBzZWxlY3RvcnMgdGhhdCBtYXRjaCBvbiB0aGUgaG9zdCBhbmQgYXMgYW5cbiAqIGFuY2VzdG9yIG9mIHRoZSBob3N0OlxuICpcbiAqIGBgYFxuICogQSA8aG9zdE1hcmtlcj4sIEE8aG9zdE1hcmtlcj4ge31cbiAqIGBgYFxuICpcbiAqIFdoZW4gdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBjb250ZXh0IHNlbGVjdG9yIHdlIGFsc28gaGF2ZSB0byBjcmVhdGUgY29tYmluYXRpb25zIG9mIHRob3NlXG4gKiBzZWxlY3RvcnMgd2l0aCBlYWNoIG90aGVyLiBGb3IgZXhhbXBsZSBpZiB0aGVyZSBhcmUgYEFgIGFuZCBgQmAgc2VsZWN0b3JzIHRoZSBvdXRwdXQgaXM6XG4gKlxuICogYGBgXG4gKiBBQjxob3N0TWFya2VyPiwgQUIgPGhvc3RNYXJrZXI+LCBBIEI8aG9zdE1hcmtlcj4sXG4gKiBCIEE8aG9zdE1hcmtlcj4sIEEgQiA8aG9zdE1hcmtlcj4sIEIgQSA8aG9zdE1hcmtlcj4ge31cbiAqIGBgYFxuICpcbiAqIEFuZCBzbyBvbi4uLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0U2VsZWN0b3JzIGFuIGFycmF5IG9mIGNvbnRleHQgc2VsZWN0b3JzIHRoYXQgd2lsbCBiZSBjb21iaW5lZC5cbiAqIEBwYXJhbSBvdGhlclNlbGVjdG9ycyB0aGUgcmVzdCBvZiB0aGUgc2VsZWN0b3JzIHRoYXQgYXJlIG5vdCBjb250ZXh0IHNlbGVjdG9ycy5cbiAqL1xuZnVuY3Rpb24gY29tYmluZUhvc3RDb250ZXh0U2VsZWN0b3JzKGNvbnRleHRTZWxlY3RvcnM6IHN0cmluZ1tdLCBvdGhlclNlbGVjdG9yczogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgaG9zdE1hcmtlciA9IF9wb2x5ZmlsbEhvc3ROb0NvbWJpbmF0b3I7XG4gIF9wb2x5ZmlsbEhvc3RSZS5sYXN0SW5kZXggPSAwOyAgLy8gcmVzZXQgdGhlIHJlZ2V4IHRvIGVuc3VyZSB3ZSBnZXQgYW4gYWNjdXJhdGUgdGVzdFxuICBjb25zdCBvdGhlclNlbGVjdG9yc0hhc0hvc3QgPSBfcG9seWZpbGxIb3N0UmUudGVzdChvdGhlclNlbGVjdG9ycyk7XG5cbiAgLy8gSWYgdGhlcmUgYXJlIG5vIGNvbnRleHQgc2VsZWN0b3JzIHRoZW4ganVzdCBvdXRwdXQgYSBob3N0IG1hcmtlclxuICBpZiAoY29udGV4dFNlbGVjdG9ycy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gaG9zdE1hcmtlciArIG90aGVyU2VsZWN0b3JzO1xuICB9XG5cbiAgY29uc3QgY29tYmluZWQ6IHN0cmluZ1tdID0gW2NvbnRleHRTZWxlY3RvcnMucG9wKCkgfHwgJyddO1xuICB3aGlsZSAoY29udGV4dFNlbGVjdG9ycy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gY29tYmluZWQubGVuZ3RoO1xuICAgIGNvbnN0IGNvbnRleHRTZWxlY3RvciA9IGNvbnRleHRTZWxlY3RvcnMucG9wKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJldmlvdXNTZWxlY3RvcnMgPSBjb21iaW5lZFtpXTtcbiAgICAgIC8vIEFkZCB0aGUgbmV3IHNlbGVjdG9yIGFzIGEgZGVzY2VuZGFudCBvZiB0aGUgcHJldmlvdXMgc2VsZWN0b3JzXG4gICAgICBjb21iaW5lZFtsZW5ndGggKiAyICsgaV0gPSBwcmV2aW91c1NlbGVjdG9ycyArICcgJyArIGNvbnRleHRTZWxlY3RvcjtcbiAgICAgIC8vIEFkZCB0aGUgbmV3IHNlbGVjdG9yIGFzIGFuIGFuY2VzdG9yIG9mIHRoZSBwcmV2aW91cyBzZWxlY3RvcnNcbiAgICAgIGNvbWJpbmVkW2xlbmd0aCArIGldID0gY29udGV4dFNlbGVjdG9yICsgJyAnICsgcHJldmlvdXNTZWxlY3RvcnM7XG4gICAgICAvLyBBZGQgdGhlIG5ldyBzZWxlY3RvciB0byBhY3Qgb24gdGhlIHNhbWUgZWxlbWVudCBhcyB0aGUgcHJldmlvdXMgc2VsZWN0b3JzXG4gICAgICBjb21iaW5lZFtpXSA9IGNvbnRleHRTZWxlY3RvciArIHByZXZpb3VzU2VsZWN0b3JzO1xuICAgIH1cbiAgfVxuICAvLyBGaW5hbGx5IGNvbm5lY3QgdGhlIHNlbGVjdG9yIHRvIHRoZSBgaG9zdE1hcmtlcmBzOiBlaXRoZXIgYWN0aW5nIGRpcmVjdGx5IG9uIHRoZSBob3N0XG4gIC8vIChBPGhvc3RNYXJrZXI+KSBvciBhcyBhbiBhbmNlc3RvciAoQSA8aG9zdE1hcmtlcj4pLlxuICByZXR1cm4gY29tYmluZWRcbiAgICAgIC5tYXAoXG4gICAgICAgICAgcyA9PiBvdGhlclNlbGVjdG9yc0hhc0hvc3QgP1xuICAgICAgICAgICAgICBgJHtzfSR7b3RoZXJTZWxlY3RvcnN9YCA6XG4gICAgICAgICAgICAgIGAke3N9JHtob3N0TWFya2VyfSR7b3RoZXJTZWxlY3RvcnN9LCAke3N9ICR7aG9zdE1hcmtlcn0ke290aGVyU2VsZWN0b3JzfWApXG4gICAgICAuam9pbignLCcpO1xufVxuXG4vKipcbiAqIE11dGF0ZSB0aGUgZ2l2ZW4gYGdyb3Vwc2AgYXJyYXkgc28gdGhhdCB0aGVyZSBhcmUgYG11bHRpcGxlc2AgY2xvbmVzIG9mIHRoZSBvcmlnaW5hbCBhcnJheVxuICogc3RvcmVkLlxuICpcbiAqIEZvciBleGFtcGxlIGByZXBlYXRHcm91cHMoW2EsIGJdLCAzKWAgd2lsbCByZXN1bHQgaW4gYFthLCBiLCBhLCBiLCBhLCBiXWAgLSBidXQgaW1wb3J0YW50bHkgdGhlXG4gKiBuZXdseSBhZGRlZCBncm91cHMgd2lsbCBiZSBjbG9uZXMgb2YgdGhlIG9yaWdpbmFsLlxuICpcbiAqIEBwYXJhbSBncm91cHMgQW4gYXJyYXkgb2YgZ3JvdXBzIG9mIHN0cmluZ3MgdGhhdCB3aWxsIGJlIHJlcGVhdGVkLiBUaGlzIGFycmF5IGlzIG11dGF0ZWRcbiAqICAgICBpbi1wbGFjZS5cbiAqIEBwYXJhbSBtdWx0aXBsZXMgVGhlIG51bWJlciBvZiB0aW1lcyB0aGUgY3VycmVudCBncm91cHMgc2hvdWxkIGFwcGVhci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcGVhdEdyb3Vwcyhncm91cHM6IHN0cmluZ1tdW10sIG11bHRpcGxlczogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGxlbmd0aCA9IGdyb3Vwcy5sZW5ndGg7XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgbXVsdGlwbGVzOyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGxlbmd0aDsgaisrKSB7XG4gICAgICBncm91cHNbaiArIChpICogbGVuZ3RoKV0gPSBncm91cHNbal0uc2xpY2UoMCk7XG4gICAgfVxuICB9XG59XG4iXX0=