/**
 * @license Angular v16.2.12
 * (c) 2010-2022 Google LLC. https://angular.io/
 * License: MIT
 */

import { ɵAnimationGroupPlayer, NoopAnimationPlayer, AUTO_STYLE, ɵPRE_STYLE, sequence } from '@angular/animations';
import { ɵvalidateStyleProperty, ɵcontainsElement, ɵgetParentElement, ɵinvokeQuery, ɵnormalizeKeyframes, ɵallowPreviousPlayerStylesMerge } from '@angular/animations/browser';
import { ɵRuntimeError } from '@angular/core';

const LINE_START = '\n - ';
function invalidTimingValue(exp) {
    return new ɵRuntimeError(3000 /* RuntimeErrorCode.INVALID_TIMING_VALUE */, ngDevMode && `The provided timing value "${exp}" is invalid.`);
}
function negativeStepValue() {
    return new ɵRuntimeError(3100 /* RuntimeErrorCode.NEGATIVE_STEP_VALUE */, ngDevMode && 'Duration values below 0 are not allowed for this animation step.');
}
function negativeDelayValue() {
    return new ɵRuntimeError(3101 /* RuntimeErrorCode.NEGATIVE_DELAY_VALUE */, ngDevMode && 'Delay values below 0 are not allowed for this animation step.');
}
function invalidStyleParams(varName) {
    return new ɵRuntimeError(3001 /* RuntimeErrorCode.INVALID_STYLE_PARAMS */, ngDevMode &&
        `Unable to resolve the local animation param ${varName} in the given list of values`);
}
function invalidParamValue(varName) {
    return new ɵRuntimeError(3003 /* RuntimeErrorCode.INVALID_PARAM_VALUE */, ngDevMode && `Please provide a value for the animation param ${varName}`);
}
function invalidNodeType(nodeType) {
    return new ɵRuntimeError(3004 /* RuntimeErrorCode.INVALID_NODE_TYPE */, ngDevMode && `Unable to resolve animation metadata node #${nodeType}`);
}
function invalidCssUnitValue(userProvidedProperty, value) {
    return new ɵRuntimeError(3005 /* RuntimeErrorCode.INVALID_CSS_UNIT_VALUE */, ngDevMode && `Please provide a CSS unit value for ${userProvidedProperty}:${value}`);
}
function invalidTrigger() {
    return new ɵRuntimeError(3006 /* RuntimeErrorCode.INVALID_TRIGGER */, ngDevMode &&
        'animation triggers cannot be prefixed with an `@` sign (e.g. trigger(\'@foo\', [...]))');
}
function invalidDefinition() {
    return new ɵRuntimeError(3007 /* RuntimeErrorCode.INVALID_DEFINITION */, ngDevMode && 'only state() and transition() definitions can sit inside of a trigger()');
}
function invalidState(metadataName, missingSubs) {
    return new ɵRuntimeError(3008 /* RuntimeErrorCode.INVALID_STATE */, ngDevMode &&
        `state("${metadataName}", ...) must define default values for all the following style substitutions: ${missingSubs.join(', ')}`);
}
function invalidStyleValue(value) {
    return new ɵRuntimeError(3002 /* RuntimeErrorCode.INVALID_STYLE_VALUE */, ngDevMode && `The provided style string value ${value} is not allowed.`);
}
function invalidProperty(prop) {
    return new ɵRuntimeError(3009 /* RuntimeErrorCode.INVALID_PROPERTY */, ngDevMode &&
        `The provided animation property "${prop}" is not a supported CSS property for animations`);
}
function invalidParallelAnimation(prop, firstStart, firstEnd, secondStart, secondEnd) {
    return new ɵRuntimeError(3010 /* RuntimeErrorCode.INVALID_PARALLEL_ANIMATION */, ngDevMode &&
        `The CSS property "${prop}" that exists between the times of "${firstStart}ms" and "${firstEnd}ms" is also being animated in a parallel animation between the times of "${secondStart}ms" and "${secondEnd}ms"`);
}
function invalidKeyframes() {
    return new ɵRuntimeError(3011 /* RuntimeErrorCode.INVALID_KEYFRAMES */, ngDevMode && `keyframes() must be placed inside of a call to animate()`);
}
function invalidOffset() {
    return new ɵRuntimeError(3012 /* RuntimeErrorCode.INVALID_OFFSET */, ngDevMode && `Please ensure that all keyframe offsets are between 0 and 1`);
}
function keyframeOffsetsOutOfOrder() {
    return new ɵRuntimeError(3200 /* RuntimeErrorCode.KEYFRAME_OFFSETS_OUT_OF_ORDER */, ngDevMode && `Please ensure that all keyframe offsets are in order`);
}
function keyframesMissingOffsets() {
    return new ɵRuntimeError(3202 /* RuntimeErrorCode.KEYFRAMES_MISSING_OFFSETS */, ngDevMode && `Not all style() steps within the declared keyframes() contain offsets`);
}
function invalidStagger() {
    return new ɵRuntimeError(3013 /* RuntimeErrorCode.INVALID_STAGGER */, ngDevMode && `stagger() can only be used inside of query()`);
}
function invalidQuery(selector) {
    return new ɵRuntimeError(3014 /* RuntimeErrorCode.INVALID_QUERY */, ngDevMode &&
        `\`query("${selector}")\` returned zero elements. (Use \`query("${selector}", { optional: true })\` if you wish to allow this.)`);
}
function invalidExpression(expr) {
    return new ɵRuntimeError(3015 /* RuntimeErrorCode.INVALID_EXPRESSION */, ngDevMode && `The provided transition expression "${expr}" is not supported`);
}
function invalidTransitionAlias(alias) {
    return new ɵRuntimeError(3016 /* RuntimeErrorCode.INVALID_TRANSITION_ALIAS */, ngDevMode && `The transition alias value "${alias}" is not supported`);
}
function validationFailed(errors) {
    return new ɵRuntimeError(3500 /* RuntimeErrorCode.VALIDATION_FAILED */, ngDevMode && `animation validation failed:\n${errors.map(err => err.message).join('\n')}`);
}
function buildingFailed(errors) {
    return new ɵRuntimeError(3501 /* RuntimeErrorCode.BUILDING_FAILED */, ngDevMode && `animation building failed:\n${errors.map(err => err.message).join('\n')}`);
}
function triggerBuildFailed(name, errors) {
    return new ɵRuntimeError(3404 /* RuntimeErrorCode.TRIGGER_BUILD_FAILED */, ngDevMode &&
        `The animation trigger "${name}" has failed to build due to the following errors:\n - ${errors.map(err => err.message).join('\n - ')}`);
}
function animationFailed(errors) {
    return new ɵRuntimeError(3502 /* RuntimeErrorCode.ANIMATION_FAILED */, ngDevMode &&
        `Unable to animate due to the following errors:${LINE_START}${errors.map(err => err.message).join(LINE_START)}`);
}
function registerFailed(errors) {
    return new ɵRuntimeError(3503 /* RuntimeErrorCode.REGISTRATION_FAILED */, ngDevMode &&
        `Unable to build the animation due to the following errors: ${errors.map(err => err.message).join('\n')}`);
}
function missingOrDestroyedAnimation() {
    return new ɵRuntimeError(3300 /* RuntimeErrorCode.MISSING_OR_DESTROYED_ANIMATION */, ngDevMode && 'The requested animation doesn\'t exist or has already been destroyed');
}
function createAnimationFailed(errors) {
    return new ɵRuntimeError(3504 /* RuntimeErrorCode.CREATE_ANIMATION_FAILED */, ngDevMode &&
        `Unable to create the animation due to the following errors:${errors.map(err => err.message).join('\n')}`);
}
function missingPlayer(id) {
    return new ɵRuntimeError(3301 /* RuntimeErrorCode.MISSING_PLAYER */, ngDevMode && `Unable to find the timeline player referenced by ${id}`);
}
function missingTrigger(phase, name) {
    return new ɵRuntimeError(3302 /* RuntimeErrorCode.MISSING_TRIGGER */, ngDevMode &&
        `Unable to listen on the animation trigger event "${phase}" because the animation trigger "${name}" doesn\'t exist!`);
}
function missingEvent(name) {
    return new ɵRuntimeError(3303 /* RuntimeErrorCode.MISSING_EVENT */, ngDevMode &&
        `Unable to listen on the animation trigger "${name}" because the provided event is undefined!`);
}
function unsupportedTriggerEvent(phase, name) {
    return new ɵRuntimeError(3400 /* RuntimeErrorCode.UNSUPPORTED_TRIGGER_EVENT */, ngDevMode &&
        `The provided animation trigger event "${phase}" for the animation trigger "${name}" is not supported!`);
}
function unregisteredTrigger(name) {
    return new ɵRuntimeError(3401 /* RuntimeErrorCode.UNREGISTERED_TRIGGER */, ngDevMode && `The provided animation trigger "${name}" has not been registered!`);
}
function triggerTransitionsFailed(errors) {
    return new ɵRuntimeError(3402 /* RuntimeErrorCode.TRIGGER_TRANSITIONS_FAILED */, ngDevMode &&
        `Unable to process animations due to the following failed trigger transitions\n ${errors.map(err => err.message).join('\n')}`);
}
function triggerParsingFailed(name, errors) {
    return new ɵRuntimeError(3403 /* RuntimeErrorCode.TRIGGER_PARSING_FAILED */, ngDevMode &&
        `Animation parsing for the ${name} trigger have failed:${LINE_START}${errors.map(err => err.message).join(LINE_START)}`);
}
function transitionFailed(name, errors) {
    return new ɵRuntimeError(3505 /* RuntimeErrorCode.TRANSITION_FAILED */, ngDevMode && `@${name} has failed due to:\n ${errors.map(err => err.message).join('\n- ')}`);
}

/**
 * Set of all animatable CSS properties
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animated_properties
 */
const ANIMATABLE_PROP_SET = new Set([
    '-moz-outline-radius',
    '-moz-outline-radius-bottomleft',
    '-moz-outline-radius-bottomright',
    '-moz-outline-radius-topleft',
    '-moz-outline-radius-topright',
    '-ms-grid-columns',
    '-ms-grid-rows',
    '-webkit-line-clamp',
    '-webkit-text-fill-color',
    '-webkit-text-stroke',
    '-webkit-text-stroke-color',
    'accent-color',
    'all',
    'backdrop-filter',
    'background',
    'background-color',
    'background-position',
    'background-size',
    'block-size',
    'border',
    'border-block-end',
    'border-block-end-color',
    'border-block-end-width',
    'border-block-start',
    'border-block-start-color',
    'border-block-start-width',
    'border-bottom',
    'border-bottom-color',
    'border-bottom-left-radius',
    'border-bottom-right-radius',
    'border-bottom-width',
    'border-color',
    'border-end-end-radius',
    'border-end-start-radius',
    'border-image-outset',
    'border-image-slice',
    'border-image-width',
    'border-inline-end',
    'border-inline-end-color',
    'border-inline-end-width',
    'border-inline-start',
    'border-inline-start-color',
    'border-inline-start-width',
    'border-left',
    'border-left-color',
    'border-left-width',
    'border-radius',
    'border-right',
    'border-right-color',
    'border-right-width',
    'border-start-end-radius',
    'border-start-start-radius',
    'border-top',
    'border-top-color',
    'border-top-left-radius',
    'border-top-right-radius',
    'border-top-width',
    'border-width',
    'bottom',
    'box-shadow',
    'caret-color',
    'clip',
    'clip-path',
    'color',
    'column-count',
    'column-gap',
    'column-rule',
    'column-rule-color',
    'column-rule-width',
    'column-width',
    'columns',
    'filter',
    'flex',
    'flex-basis',
    'flex-grow',
    'flex-shrink',
    'font',
    'font-size',
    'font-size-adjust',
    'font-stretch',
    'font-variation-settings',
    'font-weight',
    'gap',
    'grid-column-gap',
    'grid-gap',
    'grid-row-gap',
    'grid-template-columns',
    'grid-template-rows',
    'height',
    'inline-size',
    'input-security',
    'inset',
    'inset-block',
    'inset-block-end',
    'inset-block-start',
    'inset-inline',
    'inset-inline-end',
    'inset-inline-start',
    'left',
    'letter-spacing',
    'line-clamp',
    'line-height',
    'margin',
    'margin-block-end',
    'margin-block-start',
    'margin-bottom',
    'margin-inline-end',
    'margin-inline-start',
    'margin-left',
    'margin-right',
    'margin-top',
    'mask',
    'mask-border',
    'mask-position',
    'mask-size',
    'max-block-size',
    'max-height',
    'max-inline-size',
    'max-lines',
    'max-width',
    'min-block-size',
    'min-height',
    'min-inline-size',
    'min-width',
    'object-position',
    'offset',
    'offset-anchor',
    'offset-distance',
    'offset-path',
    'offset-position',
    'offset-rotate',
    'opacity',
    'order',
    'outline',
    'outline-color',
    'outline-offset',
    'outline-width',
    'padding',
    'padding-block-end',
    'padding-block-start',
    'padding-bottom',
    'padding-inline-end',
    'padding-inline-start',
    'padding-left',
    'padding-right',
    'padding-top',
    'perspective',
    'perspective-origin',
    'right',
    'rotate',
    'row-gap',
    'scale',
    'scroll-margin',
    'scroll-margin-block',
    'scroll-margin-block-end',
    'scroll-margin-block-start',
    'scroll-margin-bottom',
    'scroll-margin-inline',
    'scroll-margin-inline-end',
    'scroll-margin-inline-start',
    'scroll-margin-left',
    'scroll-margin-right',
    'scroll-margin-top',
    'scroll-padding',
    'scroll-padding-block',
    'scroll-padding-block-end',
    'scroll-padding-block-start',
    'scroll-padding-bottom',
    'scroll-padding-inline',
    'scroll-padding-inline-end',
    'scroll-padding-inline-start',
    'scroll-padding-left',
    'scroll-padding-right',
    'scroll-padding-top',
    'scroll-snap-coordinate',
    'scroll-snap-destination',
    'scrollbar-color',
    'shape-image-threshold',
    'shape-margin',
    'shape-outside',
    'tab-size',
    'text-decoration',
    'text-decoration-color',
    'text-decoration-thickness',
    'text-emphasis',
    'text-emphasis-color',
    'text-indent',
    'text-shadow',
    'text-underline-offset',
    'top',
    'transform',
    'transform-origin',
    'translate',
    'vertical-align',
    'visibility',
    'width',
    'word-spacing',
    'z-index',
    'zoom',
]);

function optimizeGroupPlayer(players) {
    switch (players.length) {
        case 0:
            return new NoopAnimationPlayer();
        case 1:
            return players[0];
        default:
            return new ɵAnimationGroupPlayer(players);
    }
}
function normalizeKeyframes$1(normalizer, keyframes, preStyles = new Map(), postStyles = new Map()) {
    const errors = [];
    const normalizedKeyframes = [];
    let previousOffset = -1;
    let previousKeyframe = null;
    keyframes.forEach(kf => {
        const offset = kf.get('offset');
        const isSameOffset = offset == previousOffset;
        const normalizedKeyframe = (isSameOffset && previousKeyframe) || new Map();
        kf.forEach((val, prop) => {
            let normalizedProp = prop;
            let normalizedValue = val;
            if (prop !== 'offset') {
                normalizedProp = normalizer.normalizePropertyName(normalizedProp, errors);
                switch (normalizedValue) {
                    case ɵPRE_STYLE:
                        normalizedValue = preStyles.get(prop);
                        break;
                    case AUTO_STYLE:
                        normalizedValue = postStyles.get(prop);
                        break;
                    default:
                        normalizedValue =
                            normalizer.normalizeStyleValue(prop, normalizedProp, normalizedValue, errors);
                        break;
                }
            }
            normalizedKeyframe.set(normalizedProp, normalizedValue);
        });
        if (!isSameOffset) {
            normalizedKeyframes.push(normalizedKeyframe);
        }
        previousKeyframe = normalizedKeyframe;
        previousOffset = offset;
    });
    if (errors.length) {
        throw animationFailed(errors);
    }
    return normalizedKeyframes;
}
function listenOnPlayer(player, eventName, event, callback) {
    switch (eventName) {
        case 'start':
            player.onStart(() => callback(event && copyAnimationEvent(event, 'start', player)));
            break;
        case 'done':
            player.onDone(() => callback(event && copyAnimationEvent(event, 'done', player)));
            break;
        case 'destroy':
            player.onDestroy(() => callback(event && copyAnimationEvent(event, 'destroy', player)));
            break;
    }
}
function copyAnimationEvent(e, phaseName, player) {
    const totalTime = player.totalTime;
    const disabled = player.disabled ? true : false;
    const event = makeAnimationEvent(e.element, e.triggerName, e.fromState, e.toState, phaseName || e.phaseName, totalTime == undefined ? e.totalTime : totalTime, disabled);
    const data = e['_data'];
    if (data != null) {
        event['_data'] = data;
    }
    return event;
}
function makeAnimationEvent(element, triggerName, fromState, toState, phaseName = '', totalTime = 0, disabled) {
    return { element, triggerName, fromState, toState, phaseName, totalTime, disabled: !!disabled };
}
function getOrSetDefaultValue(map, key, defaultValue) {
    let value = map.get(key);
    if (!value) {
        map.set(key, value = defaultValue);
    }
    return value;
}
function parseTimelineCommand(command) {
    const separatorPos = command.indexOf(':');
    const id = command.substring(1, separatorPos);
    const action = command.slice(separatorPos + 1);
    return [id, action];
}
const documentElement = 
/* @__PURE__ */ (() => typeof document === 'undefined' ? null : document.documentElement)();
function getParentElement(element) {
    const parent = element.parentNode || element.host || null; // consider host to support shadow DOM
    if (parent === documentElement) {
        return null;
    }
    return parent;
}
function containsVendorPrefix(prop) {
    // Webkit is the only real popular vendor prefix nowadays
    // cc: http://shouldiprefix.com/
    return prop.substring(1, 6) == 'ebkit'; // webkit or Webkit
}
let _CACHED_BODY = null;
let _IS_WEBKIT = false;
function validateStyleProperty(prop) {
    if (!_CACHED_BODY) {
        _CACHED_BODY = getBodyNode() || {};
        _IS_WEBKIT = _CACHED_BODY.style ? ('WebkitAppearance' in _CACHED_BODY.style) : false;
    }
    let result = true;
    if (_CACHED_BODY.style && !containsVendorPrefix(prop)) {
        result = prop in _CACHED_BODY.style;
        if (!result && _IS_WEBKIT) {
            const camelProp = 'Webkit' + prop.charAt(0).toUpperCase() + prop.slice(1);
            result = camelProp in _CACHED_BODY.style;
        }
    }
    return result;
}
function validateWebAnimatableStyleProperty(prop) {
    return ANIMATABLE_PROP_SET.has(prop);
}
function getBodyNode() {
    if (typeof document != 'undefined') {
        return document.body;
    }
    return null;
}
function containsElement(elm1, elm2) {
    while (elm2) {
        if (elm2 === elm1) {
            return true;
        }
        elm2 = getParentElement(elm2);
    }
    return false;
}
function invokeQuery(element, selector, multi) {
    if (multi) {
        return Array.from(element.querySelectorAll(selector));
    }
    const elem = element.querySelector(selector);
    return elem ? [elem] : [];
}
function hypenatePropsKeys(original) {
    const newMap = new Map();
    original.forEach((val, prop) => {
        const newProp = prop.replace(/([a-z])([A-Z])/g, '$1-$2');
        newMap.set(newProp, val);
    });
    return newMap;
}

const ONE_SECOND = 1000;
const SUBSTITUTION_EXPR_START = '{{';
const SUBSTITUTION_EXPR_END = '}}';
const ENTER_CLASSNAME = 'ng-enter';
const LEAVE_CLASSNAME = 'ng-leave';
const NG_TRIGGER_CLASSNAME = 'ng-trigger';
const NG_TRIGGER_SELECTOR = '.ng-trigger';
const NG_ANIMATING_CLASSNAME = 'ng-animating';
const NG_ANIMATING_SELECTOR = '.ng-animating';
function resolveTimingValue(value) {
    if (typeof value == 'number')
        return value;
    const matches = value.match(/^(-?[\.\d]+)(m?s)/);
    if (!matches || matches.length < 2)
        return 0;
    return _convertTimeValueToMS(parseFloat(matches[1]), matches[2]);
}
function _convertTimeValueToMS(value, unit) {
    switch (unit) {
        case 's':
            return value * ONE_SECOND;
        default: // ms or something else
            return value;
    }
}
function resolveTiming(timings, errors, allowNegativeValues) {
    return timings.hasOwnProperty('duration') ?
        timings :
        parseTimeExpression(timings, errors, allowNegativeValues);
}
function parseTimeExpression(exp, errors, allowNegativeValues) {
    const regex = /^(-?[\.\d]+)(m?s)(?:\s+(-?[\.\d]+)(m?s))?(?:\s+([-a-z]+(?:\(.+?\))?))?$/i;
    let duration;
    let delay = 0;
    let easing = '';
    if (typeof exp === 'string') {
        const matches = exp.match(regex);
        if (matches === null) {
            errors.push(invalidTimingValue(exp));
            return { duration: 0, delay: 0, easing: '' };
        }
        duration = _convertTimeValueToMS(parseFloat(matches[1]), matches[2]);
        const delayMatch = matches[3];
        if (delayMatch != null) {
            delay = _convertTimeValueToMS(parseFloat(delayMatch), matches[4]);
        }
        const easingVal = matches[5];
        if (easingVal) {
            easing = easingVal;
        }
    }
    else {
        duration = exp;
    }
    if (!allowNegativeValues) {
        let containsErrors = false;
        let startIndex = errors.length;
        if (duration < 0) {
            errors.push(negativeStepValue());
            containsErrors = true;
        }
        if (delay < 0) {
            errors.push(negativeDelayValue());
            containsErrors = true;
        }
        if (containsErrors) {
            errors.splice(startIndex, 0, invalidTimingValue(exp));
        }
    }
    return { duration, delay, easing };
}
function copyObj(obj, destination = {}) {
    Object.keys(obj).forEach(prop => {
        destination[prop] = obj[prop];
    });
    return destination;
}
function convertToMap(obj) {
    const styleMap = new Map();
    Object.keys(obj).forEach(prop => {
        const val = obj[prop];
        styleMap.set(prop, val);
    });
    return styleMap;
}
function normalizeKeyframes(keyframes) {
    if (!keyframes.length) {
        return [];
    }
    if (keyframes[0] instanceof Map) {
        return keyframes;
    }
    return keyframes.map(kf => convertToMap(kf));
}
function normalizeStyles(styles) {
    const normalizedStyles = new Map();
    if (Array.isArray(styles)) {
        styles.forEach(data => copyStyles(data, normalizedStyles));
    }
    else {
        copyStyles(styles, normalizedStyles);
    }
    return normalizedStyles;
}
function copyStyles(styles, destination = new Map(), backfill) {
    if (backfill) {
        for (let [prop, val] of backfill) {
            destination.set(prop, val);
        }
    }
    for (let [prop, val] of styles) {
        destination.set(prop, val);
    }
    return destination;
}
function setStyles(element, styles, formerStyles) {
    styles.forEach((val, prop) => {
        const camelProp = dashCaseToCamelCase(prop);
        if (formerStyles && !formerStyles.has(prop)) {
            formerStyles.set(prop, element.style[camelProp]);
        }
        element.style[camelProp] = val;
    });
}
function eraseStyles(element, styles) {
    styles.forEach((_, prop) => {
        const camelProp = dashCaseToCamelCase(prop);
        element.style[camelProp] = '';
    });
}
function normalizeAnimationEntry(steps) {
    if (Array.isArray(steps)) {
        if (steps.length == 1)
            return steps[0];
        return sequence(steps);
    }
    return steps;
}
function validateStyleParams(value, options, errors) {
    const params = options.params || {};
    const matches = extractStyleParams(value);
    if (matches.length) {
        matches.forEach(varName => {
            if (!params.hasOwnProperty(varName)) {
                errors.push(invalidStyleParams(varName));
            }
        });
    }
}
const PARAM_REGEX = new RegExp(`${SUBSTITUTION_EXPR_START}\\s*(.+?)\\s*${SUBSTITUTION_EXPR_END}`, 'g');
function extractStyleParams(value) {
    let params = [];
    if (typeof value === 'string') {
        let match;
        while (match = PARAM_REGEX.exec(value)) {
            params.push(match[1]);
        }
        PARAM_REGEX.lastIndex = 0;
    }
    return params;
}
function interpolateParams(value, params, errors) {
    const original = value.toString();
    const str = original.replace(PARAM_REGEX, (_, varName) => {
        let localVal = params[varName];
        // this means that the value was never overridden by the data passed in by the user
        if (localVal == null) {
            errors.push(invalidParamValue(varName));
            localVal = '';
        }
        return localVal.toString();
    });
    // we do this to assert that numeric values stay as they are
    return str == original ? value : str;
}
function iteratorToArray(iterator) {
    const arr = [];
    let item = iterator.next();
    while (!item.done) {
        arr.push(item.value);
        item = iterator.next();
    }
    return arr;
}
const DASH_CASE_REGEXP = /-+([a-z0-9])/g;
function dashCaseToCamelCase(input) {
    return input.replace(DASH_CASE_REGEXP, (...m) => m[1].toUpperCase());
}
function camelCaseToDashCase(input) {
    return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
function allowPreviousPlayerStylesMerge(duration, delay) {
    return duration === 0 || delay === 0;
}
function balancePreviousStylesIntoKeyframes(element, keyframes, previousStyles) {
    if (previousStyles.size && keyframes.length) {
        let startingKeyframe = keyframes[0];
        let missingStyleProps = [];
        previousStyles.forEach((val, prop) => {
            if (!startingKeyframe.has(prop)) {
                missingStyleProps.push(prop);
            }
            startingKeyframe.set(prop, val);
        });
        if (missingStyleProps.length) {
            for (let i = 1; i < keyframes.length; i++) {
                let kf = keyframes[i];
                missingStyleProps.forEach(prop => kf.set(prop, computeStyle(element, prop)));
            }
        }
    }
    return keyframes;
}
function visitDslNode(visitor, node, context) {
    switch (node.type) {
        case 7 /* AnimationMetadataType.Trigger */:
            return visitor.visitTrigger(node, context);
        case 0 /* AnimationMetadataType.State */:
            return visitor.visitState(node, context);
        case 1 /* AnimationMetadataType.Transition */:
            return visitor.visitTransition(node, context);
        case 2 /* AnimationMetadataType.Sequence */:
            return visitor.visitSequence(node, context);
        case 3 /* AnimationMetadataType.Group */:
            return visitor.visitGroup(node, context);
        case 4 /* AnimationMetadataType.Animate */:
            return visitor.visitAnimate(node, context);
        case 5 /* AnimationMetadataType.Keyframes */:
            return visitor.visitKeyframes(node, context);
        case 6 /* AnimationMetadataType.Style */:
            return visitor.visitStyle(node, context);
        case 8 /* AnimationMetadataType.Reference */:
            return visitor.visitReference(node, context);
        case 9 /* AnimationMetadataType.AnimateChild */:
            return visitor.visitAnimateChild(node, context);
        case 10 /* AnimationMetadataType.AnimateRef */:
            return visitor.visitAnimateRef(node, context);
        case 11 /* AnimationMetadataType.Query */:
            return visitor.visitQuery(node, context);
        case 12 /* AnimationMetadataType.Stagger */:
            return visitor.visitStagger(node, context);
        default:
            throw invalidNodeType(node.type);
    }
}
function computeStyle(element, prop) {
    return window.getComputedStyle(element)[prop];
}

/**
 * @publicApi
 */
class MockAnimationDriver {
    static { this.log = []; }
    validateStyleProperty(prop) {
        return ɵvalidateStyleProperty(prop);
    }
    validateAnimatableStyleProperty(prop) {
        const cssProp = camelCaseToDashCase(prop);
        return validateWebAnimatableStyleProperty(cssProp);
    }
    matchesElement(_element, _selector) {
        return false;
    }
    containsElement(elm1, elm2) {
        return ɵcontainsElement(elm1, elm2);
    }
    getParentElement(element) {
        return ɵgetParentElement(element);
    }
    query(element, selector, multi) {
        return ɵinvokeQuery(element, selector, multi);
    }
    computeStyle(element, prop, defaultValue) {
        return defaultValue || '';
    }
    animate(element, keyframes, duration, delay, easing, previousPlayers = []) {
        const player = new MockAnimationPlayer(element, keyframes, duration, delay, easing, previousPlayers);
        MockAnimationDriver.log.push(player);
        return player;
    }
}
/**
 * @publicApi
 */
class MockAnimationPlayer extends NoopAnimationPlayer {
    constructor(element, keyframes, duration, delay, easing, previousPlayers) {
        super(duration, delay);
        this.element = element;
        this.keyframes = keyframes;
        this.duration = duration;
        this.delay = delay;
        this.easing = easing;
        this.previousPlayers = previousPlayers;
        this.__finished = false;
        this.__started = false;
        this.previousStyles = new Map();
        this._onInitFns = [];
        this.currentSnapshot = new Map();
        this._keyframes = [];
        this._keyframes = ɵnormalizeKeyframes(keyframes);
        if (ɵallowPreviousPlayerStylesMerge(duration, delay)) {
            previousPlayers.forEach(player => {
                if (player instanceof MockAnimationPlayer) {
                    const styles = player.currentSnapshot;
                    styles.forEach((val, prop) => this.previousStyles.set(prop, val));
                }
            });
        }
    }
    /** @internal */
    onInit(fn) {
        this._onInitFns.push(fn);
    }
    /** @internal */
    init() {
        super.init();
        this._onInitFns.forEach(fn => fn());
        this._onInitFns = [];
    }
    reset() {
        super.reset();
        this.__started = false;
    }
    finish() {
        super.finish();
        this.__finished = true;
    }
    destroy() {
        super.destroy();
        this.__finished = true;
    }
    /** @internal */
    triggerMicrotask() { }
    play() {
        super.play();
        this.__started = true;
    }
    hasStarted() {
        return this.__started;
    }
    beforeDestroy() {
        const captures = new Map();
        this.previousStyles.forEach((val, prop) => captures.set(prop, val));
        if (this.hasStarted()) {
            // when assembling the captured styles, it's important that
            // we build the keyframe styles in the following order:
            // {other styles within keyframes, ... previousStyles }
            this._keyframes.forEach(kf => {
                for (let [prop, val] of kf) {
                    if (prop !== 'offset') {
                        captures.set(prop, this.__finished ? val : AUTO_STYLE);
                    }
                }
            });
        }
        this.currentSnapshot = captures;
    }
}

/**
 * @module
 * @description
 * Entry point for all public APIs of this package.
 */

// This file is not used to build this module. It is only used during editing

/**
 * Generated bundle index. Do not edit.
 */

export { MockAnimationDriver, MockAnimationPlayer };
//# sourceMappingURL=testing.mjs.map
