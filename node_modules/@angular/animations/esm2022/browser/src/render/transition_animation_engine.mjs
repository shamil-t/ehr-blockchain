/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AUTO_STYLE, NoopAnimationPlayer, ɵAnimationGroupPlayer as AnimationGroupPlayer, ɵPRE_STYLE as PRE_STYLE } from '@angular/animations';
import { ElementInstructionMap } from '../dsl/element_instruction_map';
import { missingEvent, missingTrigger, transitionFailed, triggerTransitionsFailed, unregisteredTrigger, unsupportedTriggerEvent } from '../error_helpers';
import { copyObj, ENTER_CLASSNAME, eraseStyles, LEAVE_CLASSNAME, NG_ANIMATING_CLASSNAME, NG_ANIMATING_SELECTOR, NG_TRIGGER_CLASSNAME, NG_TRIGGER_SELECTOR, setStyles } from '../util';
import { getOrSetDefaultValue, listenOnPlayer, makeAnimationEvent, normalizeKeyframes, optimizeGroupPlayer } from './shared';
const QUEUED_CLASSNAME = 'ng-animate-queued';
const QUEUED_SELECTOR = '.ng-animate-queued';
const DISABLED_CLASSNAME = 'ng-animate-disabled';
const DISABLED_SELECTOR = '.ng-animate-disabled';
const STAR_CLASSNAME = 'ng-star-inserted';
const STAR_SELECTOR = '.ng-star-inserted';
const EMPTY_PLAYER_ARRAY = [];
const NULL_REMOVAL_STATE = {
    namespaceId: '',
    setForRemoval: false,
    setForMove: false,
    hasAnimation: false,
    removedBeforeQueried: false
};
const NULL_REMOVED_QUERIED_STATE = {
    namespaceId: '',
    setForMove: false,
    setForRemoval: false,
    hasAnimation: false,
    removedBeforeQueried: true
};
export const REMOVAL_FLAG = '__ng_removed';
export class StateValue {
    get params() {
        return this.options.params;
    }
    constructor(input, namespaceId = '') {
        this.namespaceId = namespaceId;
        const isObj = input && input.hasOwnProperty('value');
        const value = isObj ? input['value'] : input;
        this.value = normalizeTriggerValue(value);
        if (isObj) {
            const options = copyObj(input);
            delete options['value'];
            this.options = options;
        }
        else {
            this.options = {};
        }
        if (!this.options.params) {
            this.options.params = {};
        }
    }
    absorbOptions(options) {
        const newParams = options.params;
        if (newParams) {
            const oldParams = this.options.params;
            Object.keys(newParams).forEach(prop => {
                if (oldParams[prop] == null) {
                    oldParams[prop] = newParams[prop];
                }
            });
        }
    }
}
export const VOID_VALUE = 'void';
export const DEFAULT_STATE_VALUE = new StateValue(VOID_VALUE);
export class AnimationTransitionNamespace {
    constructor(id, hostElement, _engine) {
        this.id = id;
        this.hostElement = hostElement;
        this._engine = _engine;
        this.players = [];
        this._triggers = new Map();
        this._queue = [];
        this._elementListeners = new Map();
        this._hostClassName = 'ng-tns-' + id;
        addClass(hostElement, this._hostClassName);
    }
    listen(element, name, phase, callback) {
        if (!this._triggers.has(name)) {
            throw missingTrigger(phase, name);
        }
        if (phase == null || phase.length == 0) {
            throw missingEvent(name);
        }
        if (!isTriggerEventValid(phase)) {
            throw unsupportedTriggerEvent(phase, name);
        }
        const listeners = getOrSetDefaultValue(this._elementListeners, element, []);
        const data = { name, phase, callback };
        listeners.push(data);
        const triggersWithStates = getOrSetDefaultValue(this._engine.statesByElement, element, new Map());
        if (!triggersWithStates.has(name)) {
            addClass(element, NG_TRIGGER_CLASSNAME);
            addClass(element, NG_TRIGGER_CLASSNAME + '-' + name);
            triggersWithStates.set(name, DEFAULT_STATE_VALUE);
        }
        return () => {
            // the event listener is removed AFTER the flush has occurred such
            // that leave animations callbacks can fire (otherwise if the node
            // is removed in between then the listeners would be deregistered)
            this._engine.afterFlush(() => {
                const index = listeners.indexOf(data);
                if (index >= 0) {
                    listeners.splice(index, 1);
                }
                if (!this._triggers.has(name)) {
                    triggersWithStates.delete(name);
                }
            });
        };
    }
    register(name, ast) {
        if (this._triggers.has(name)) {
            // throw
            return false;
        }
        else {
            this._triggers.set(name, ast);
            return true;
        }
    }
    _getTrigger(name) {
        const trigger = this._triggers.get(name);
        if (!trigger) {
            throw unregisteredTrigger(name);
        }
        return trigger;
    }
    trigger(element, triggerName, value, defaultToFallback = true) {
        const trigger = this._getTrigger(triggerName);
        const player = new TransitionAnimationPlayer(this.id, triggerName, element);
        let triggersWithStates = this._engine.statesByElement.get(element);
        if (!triggersWithStates) {
            addClass(element, NG_TRIGGER_CLASSNAME);
            addClass(element, NG_TRIGGER_CLASSNAME + '-' + triggerName);
            this._engine.statesByElement.set(element, triggersWithStates = new Map());
        }
        let fromState = triggersWithStates.get(triggerName);
        const toState = new StateValue(value, this.id);
        const isObj = value && value.hasOwnProperty('value');
        if (!isObj && fromState) {
            toState.absorbOptions(fromState.options);
        }
        triggersWithStates.set(triggerName, toState);
        if (!fromState) {
            fromState = DEFAULT_STATE_VALUE;
        }
        const isRemoval = toState.value === VOID_VALUE;
        // normally this isn't reached by here, however, if an object expression
        // is passed in then it may be a new object each time. Comparing the value
        // is important since that will stay the same despite there being a new object.
        // The removal arc here is special cased because the same element is triggered
        // twice in the event that it contains animations on the outer/inner portions
        // of the host container
        if (!isRemoval && fromState.value === toState.value) {
            // this means that despite the value not changing, some inner params
            // have changed which means that the animation final styles need to be applied
            if (!objEquals(fromState.params, toState.params)) {
                const errors = [];
                const fromStyles = trigger.matchStyles(fromState.value, fromState.params, errors);
                const toStyles = trigger.matchStyles(toState.value, toState.params, errors);
                if (errors.length) {
                    this._engine.reportError(errors);
                }
                else {
                    this._engine.afterFlush(() => {
                        eraseStyles(element, fromStyles);
                        setStyles(element, toStyles);
                    });
                }
            }
            return;
        }
        const playersOnElement = getOrSetDefaultValue(this._engine.playersByElement, element, []);
        playersOnElement.forEach(player => {
            // only remove the player if it is queued on the EXACT same trigger/namespace
            // we only also deal with queued players here because if the animation has
            // started then we want to keep the player alive until the flush happens
            // (which is where the previousPlayers are passed into the new player)
            if (player.namespaceId == this.id && player.triggerName == triggerName && player.queued) {
                player.destroy();
            }
        });
        let transition = trigger.matchTransition(fromState.value, toState.value, element, toState.params);
        let isFallbackTransition = false;
        if (!transition) {
            if (!defaultToFallback)
                return;
            transition = trigger.fallbackTransition;
            isFallbackTransition = true;
        }
        this._engine.totalQueuedPlayers++;
        this._queue.push({ element, triggerName, transition, fromState, toState, player, isFallbackTransition });
        if (!isFallbackTransition) {
            addClass(element, QUEUED_CLASSNAME);
            player.onStart(() => {
                removeClass(element, QUEUED_CLASSNAME);
            });
        }
        player.onDone(() => {
            let index = this.players.indexOf(player);
            if (index >= 0) {
                this.players.splice(index, 1);
            }
            const players = this._engine.playersByElement.get(element);
            if (players) {
                let index = players.indexOf(player);
                if (index >= 0) {
                    players.splice(index, 1);
                }
            }
        });
        this.players.push(player);
        playersOnElement.push(player);
        return player;
    }
    deregister(name) {
        this._triggers.delete(name);
        this._engine.statesByElement.forEach(stateMap => stateMap.delete(name));
        this._elementListeners.forEach((listeners, element) => {
            this._elementListeners.set(element, listeners.filter(entry => {
                return entry.name != name;
            }));
        });
    }
    clearElementCache(element) {
        this._engine.statesByElement.delete(element);
        this._elementListeners.delete(element);
        const elementPlayers = this._engine.playersByElement.get(element);
        if (elementPlayers) {
            elementPlayers.forEach(player => player.destroy());
            this._engine.playersByElement.delete(element);
        }
    }
    _signalRemovalForInnerTriggers(rootElement, context) {
        const elements = this._engine.driver.query(rootElement, NG_TRIGGER_SELECTOR, true);
        // emulate a leave animation for all inner nodes within this node.
        // If there are no animations found for any of the nodes then clear the cache
        // for the element.
        elements.forEach(elm => {
            // this means that an inner remove() operation has already kicked off
            // the animation on this element...
            if (elm[REMOVAL_FLAG])
                return;
            const namespaces = this._engine.fetchNamespacesByElement(elm);
            if (namespaces.size) {
                namespaces.forEach(ns => ns.triggerLeaveAnimation(elm, context, false, true));
            }
            else {
                this.clearElementCache(elm);
            }
        });
        // If the child elements were removed along with the parent, their animations might not
        // have completed. Clear all the elements from the cache so we don't end up with a memory leak.
        this._engine.afterFlushAnimationsDone(() => elements.forEach(elm => this.clearElementCache(elm)));
    }
    triggerLeaveAnimation(element, context, destroyAfterComplete, defaultToFallback) {
        const triggerStates = this._engine.statesByElement.get(element);
        const previousTriggersValues = new Map();
        if (triggerStates) {
            const players = [];
            triggerStates.forEach((state, triggerName) => {
                previousTriggersValues.set(triggerName, state.value);
                // this check is here in the event that an element is removed
                // twice (both on the host level and the component level)
                if (this._triggers.has(triggerName)) {
                    const player = this.trigger(element, triggerName, VOID_VALUE, defaultToFallback);
                    if (player) {
                        players.push(player);
                    }
                }
            });
            if (players.length) {
                this._engine.markElementAsRemoved(this.id, element, true, context, previousTriggersValues);
                if (destroyAfterComplete) {
                    optimizeGroupPlayer(players).onDone(() => this._engine.processLeaveNode(element));
                }
                return true;
            }
        }
        return false;
    }
    prepareLeaveAnimationListeners(element) {
        const listeners = this._elementListeners.get(element);
        const elementStates = this._engine.statesByElement.get(element);
        // if this statement fails then it means that the element was picked up
        // by an earlier flush (or there are no listeners at all to track the leave).
        if (listeners && elementStates) {
            const visitedTriggers = new Set();
            listeners.forEach(listener => {
                const triggerName = listener.name;
                if (visitedTriggers.has(triggerName))
                    return;
                visitedTriggers.add(triggerName);
                const trigger = this._triggers.get(triggerName);
                const transition = trigger.fallbackTransition;
                const fromState = elementStates.get(triggerName) || DEFAULT_STATE_VALUE;
                const toState = new StateValue(VOID_VALUE);
                const player = new TransitionAnimationPlayer(this.id, triggerName, element);
                this._engine.totalQueuedPlayers++;
                this._queue.push({
                    element,
                    triggerName,
                    transition,
                    fromState,
                    toState,
                    player,
                    isFallbackTransition: true
                });
            });
        }
    }
    removeNode(element, context) {
        const engine = this._engine;
        if (element.childElementCount) {
            this._signalRemovalForInnerTriggers(element, context);
        }
        // this means that a * => VOID animation was detected and kicked off
        if (this.triggerLeaveAnimation(element, context, true))
            return;
        // find the player that is animating and make sure that the
        // removal is delayed until that player has completed
        let containsPotentialParentTransition = false;
        if (engine.totalAnimations) {
            const currentPlayers = engine.players.length ? engine.playersByQueriedElement.get(element) : [];
            // when this `if statement` does not continue forward it means that
            // a previous animation query has selected the current element and
            // is animating it. In this situation want to continue forwards and
            // allow the element to be queued up for animation later.
            if (currentPlayers && currentPlayers.length) {
                containsPotentialParentTransition = true;
            }
            else {
                let parent = element;
                while (parent = parent.parentNode) {
                    const triggers = engine.statesByElement.get(parent);
                    if (triggers) {
                        containsPotentialParentTransition = true;
                        break;
                    }
                }
            }
        }
        // at this stage we know that the element will either get removed
        // during flush or will be picked up by a parent query. Either way
        // we need to fire the listeners for this element when it DOES get
        // removed (once the query parent animation is done or after flush)
        this.prepareLeaveAnimationListeners(element);
        // whether or not a parent has an animation we need to delay the deferral of the leave
        // operation until we have more information (which we do after flush() has been called)
        if (containsPotentialParentTransition) {
            engine.markElementAsRemoved(this.id, element, false, context);
        }
        else {
            const removalFlag = element[REMOVAL_FLAG];
            if (!removalFlag || removalFlag === NULL_REMOVAL_STATE) {
                // we do this after the flush has occurred such
                // that the callbacks can be fired
                engine.afterFlush(() => this.clearElementCache(element));
                engine.destroyInnerAnimations(element);
                engine._onRemovalComplete(element, context);
            }
        }
    }
    insertNode(element, parent) {
        addClass(element, this._hostClassName);
    }
    drainQueuedTransitions(microtaskId) {
        const instructions = [];
        this._queue.forEach(entry => {
            const player = entry.player;
            if (player.destroyed)
                return;
            const element = entry.element;
            const listeners = this._elementListeners.get(element);
            if (listeners) {
                listeners.forEach((listener) => {
                    if (listener.name == entry.triggerName) {
                        const baseEvent = makeAnimationEvent(element, entry.triggerName, entry.fromState.value, entry.toState.value);
                        baseEvent['_data'] = microtaskId;
                        listenOnPlayer(entry.player, listener.phase, baseEvent, listener.callback);
                    }
                });
            }
            if (player.markedForDestroy) {
                this._engine.afterFlush(() => {
                    // now we can destroy the element properly since the event listeners have
                    // been bound to the player
                    player.destroy();
                });
            }
            else {
                instructions.push(entry);
            }
        });
        this._queue = [];
        return instructions.sort((a, b) => {
            // if depCount == 0 them move to front
            // otherwise if a contains b then move back
            const d0 = a.transition.ast.depCount;
            const d1 = b.transition.ast.depCount;
            if (d0 == 0 || d1 == 0) {
                return d0 - d1;
            }
            return this._engine.driver.containsElement(a.element, b.element) ? 1 : -1;
        });
    }
    destroy(context) {
        this.players.forEach(p => p.destroy());
        this._signalRemovalForInnerTriggers(this.hostElement, context);
    }
}
export class TransitionAnimationEngine {
    /** @internal */
    _onRemovalComplete(element, context) {
        this.onRemovalComplete(element, context);
    }
    constructor(bodyNode, driver, _normalizer) {
        this.bodyNode = bodyNode;
        this.driver = driver;
        this._normalizer = _normalizer;
        this.players = [];
        this.newHostElements = new Map();
        this.playersByElement = new Map();
        this.playersByQueriedElement = new Map();
        this.statesByElement = new Map();
        this.disabledNodes = new Set();
        this.totalAnimations = 0;
        this.totalQueuedPlayers = 0;
        this._namespaceLookup = {};
        this._namespaceList = [];
        this._flushFns = [];
        this._whenQuietFns = [];
        this.namespacesByHostElement = new Map();
        this.collectedEnterElements = [];
        this.collectedLeaveElements = [];
        // this method is designed to be overridden by the code that uses this engine
        this.onRemovalComplete = (element, context) => { };
    }
    get queuedPlayers() {
        const players = [];
        this._namespaceList.forEach(ns => {
            ns.players.forEach(player => {
                if (player.queued) {
                    players.push(player);
                }
            });
        });
        return players;
    }
    createNamespace(namespaceId, hostElement) {
        const ns = new AnimationTransitionNamespace(namespaceId, hostElement, this);
        if (this.bodyNode && this.driver.containsElement(this.bodyNode, hostElement)) {
            this._balanceNamespaceList(ns, hostElement);
        }
        else {
            // defer this later until flush during when the host element has
            // been inserted so that we know exactly where to place it in
            // the namespace list
            this.newHostElements.set(hostElement, ns);
            // given that this host element is a part of the animation code, it
            // may or may not be inserted by a parent node that is of an
            // animation renderer type. If this happens then we can still have
            // access to this item when we query for :enter nodes. If the parent
            // is a renderer then the set data-structure will normalize the entry
            this.collectEnterElement(hostElement);
        }
        return this._namespaceLookup[namespaceId] = ns;
    }
    _balanceNamespaceList(ns, hostElement) {
        const namespaceList = this._namespaceList;
        const namespacesByHostElement = this.namespacesByHostElement;
        const limit = namespaceList.length - 1;
        if (limit >= 0) {
            let found = false;
            // Find the closest ancestor with an existing namespace so we can then insert `ns` after it,
            // establishing a top-down ordering of namespaces in `this._namespaceList`.
            let ancestor = this.driver.getParentElement(hostElement);
            while (ancestor) {
                const ancestorNs = namespacesByHostElement.get(ancestor);
                if (ancestorNs) {
                    // An animation namespace has been registered for this ancestor, so we insert `ns`
                    // right after it to establish top-down ordering of animation namespaces.
                    const index = namespaceList.indexOf(ancestorNs);
                    namespaceList.splice(index + 1, 0, ns);
                    found = true;
                    break;
                }
                ancestor = this.driver.getParentElement(ancestor);
            }
            if (!found) {
                // No namespace exists that is an ancestor of `ns`, so `ns` is inserted at the front to
                // ensure that any existing descendants are ordered after `ns`, retaining the desired
                // top-down ordering.
                namespaceList.unshift(ns);
            }
        }
        else {
            namespaceList.push(ns);
        }
        namespacesByHostElement.set(hostElement, ns);
        return ns;
    }
    register(namespaceId, hostElement) {
        let ns = this._namespaceLookup[namespaceId];
        if (!ns) {
            ns = this.createNamespace(namespaceId, hostElement);
        }
        return ns;
    }
    registerTrigger(namespaceId, name, trigger) {
        let ns = this._namespaceLookup[namespaceId];
        if (ns && ns.register(name, trigger)) {
            this.totalAnimations++;
        }
    }
    destroy(namespaceId, context) {
        if (!namespaceId)
            return;
        this.afterFlush(() => { });
        this.afterFlushAnimationsDone(() => {
            const ns = this._fetchNamespace(namespaceId);
            this.namespacesByHostElement.delete(ns.hostElement);
            const index = this._namespaceList.indexOf(ns);
            if (index >= 0) {
                this._namespaceList.splice(index, 1);
            }
            ns.destroy(context);
            delete this._namespaceLookup[namespaceId];
        });
    }
    _fetchNamespace(id) {
        return this._namespaceLookup[id];
    }
    fetchNamespacesByElement(element) {
        // normally there should only be one namespace per element, however
        // if @triggers are placed on both the component element and then
        // its host element (within the component code) then there will be
        // two namespaces returned. We use a set here to simply deduplicate
        // the namespaces in case (for the reason described above) there are multiple triggers
        const namespaces = new Set();
        const elementStates = this.statesByElement.get(element);
        if (elementStates) {
            for (let stateValue of elementStates.values()) {
                if (stateValue.namespaceId) {
                    const ns = this._fetchNamespace(stateValue.namespaceId);
                    if (ns) {
                        namespaces.add(ns);
                    }
                }
            }
        }
        return namespaces;
    }
    trigger(namespaceId, element, name, value) {
        if (isElementNode(element)) {
            const ns = this._fetchNamespace(namespaceId);
            if (ns) {
                ns.trigger(element, name, value);
                return true;
            }
        }
        return false;
    }
    insertNode(namespaceId, element, parent, insertBefore) {
        if (!isElementNode(element))
            return;
        // special case for when an element is removed and reinserted (move operation)
        // when this occurs we do not want to use the element for deletion later
        const details = element[REMOVAL_FLAG];
        if (details && details.setForRemoval) {
            details.setForRemoval = false;
            details.setForMove = true;
            const index = this.collectedLeaveElements.indexOf(element);
            if (index >= 0) {
                this.collectedLeaveElements.splice(index, 1);
            }
        }
        // in the event that the namespaceId is blank then the caller
        // code does not contain any animation code in it, but it is
        // just being called so that the node is marked as being inserted
        if (namespaceId) {
            const ns = this._fetchNamespace(namespaceId);
            // This if-statement is a workaround for router issue #21947.
            // The router sometimes hits a race condition where while a route
            // is being instantiated a new navigation arrives, triggering leave
            // animation of DOM that has not been fully initialized, until this
            // is resolved, we need to handle the scenario when DOM is not in a
            // consistent state during the animation.
            if (ns) {
                ns.insertNode(element, parent);
            }
        }
        // only *directives and host elements are inserted before
        if (insertBefore) {
            this.collectEnterElement(element);
        }
    }
    collectEnterElement(element) {
        this.collectedEnterElements.push(element);
    }
    markElementAsDisabled(element, value) {
        if (value) {
            if (!this.disabledNodes.has(element)) {
                this.disabledNodes.add(element);
                addClass(element, DISABLED_CLASSNAME);
            }
        }
        else if (this.disabledNodes.has(element)) {
            this.disabledNodes.delete(element);
            removeClass(element, DISABLED_CLASSNAME);
        }
    }
    removeNode(namespaceId, element, context) {
        if (isElementNode(element)) {
            const ns = namespaceId ? this._fetchNamespace(namespaceId) : null;
            if (ns) {
                ns.removeNode(element, context);
            }
            else {
                this.markElementAsRemoved(namespaceId, element, false, context);
            }
            const hostNS = this.namespacesByHostElement.get(element);
            if (hostNS && hostNS.id !== namespaceId) {
                hostNS.removeNode(element, context);
            }
        }
        else {
            this._onRemovalComplete(element, context);
        }
    }
    markElementAsRemoved(namespaceId, element, hasAnimation, context, previousTriggersValues) {
        this.collectedLeaveElements.push(element);
        element[REMOVAL_FLAG] = {
            namespaceId,
            setForRemoval: context,
            hasAnimation,
            removedBeforeQueried: false,
            previousTriggersValues
        };
    }
    listen(namespaceId, element, name, phase, callback) {
        if (isElementNode(element)) {
            return this._fetchNamespace(namespaceId).listen(element, name, phase, callback);
        }
        return () => { };
    }
    _buildInstruction(entry, subTimelines, enterClassName, leaveClassName, skipBuildAst) {
        return entry.transition.build(this.driver, entry.element, entry.fromState.value, entry.toState.value, enterClassName, leaveClassName, entry.fromState.options, entry.toState.options, subTimelines, skipBuildAst);
    }
    destroyInnerAnimations(containerElement) {
        let elements = this.driver.query(containerElement, NG_TRIGGER_SELECTOR, true);
        elements.forEach(element => this.destroyActiveAnimationsForElement(element));
        if (this.playersByQueriedElement.size == 0)
            return;
        elements = this.driver.query(containerElement, NG_ANIMATING_SELECTOR, true);
        elements.forEach(element => this.finishActiveQueriedAnimationOnElement(element));
    }
    destroyActiveAnimationsForElement(element) {
        const players = this.playersByElement.get(element);
        if (players) {
            players.forEach(player => {
                // special case for when an element is set for destruction, but hasn't started.
                // in this situation we want to delay the destruction until the flush occurs
                // so that any event listeners attached to the player are triggered.
                if (player.queued) {
                    player.markedForDestroy = true;
                }
                else {
                    player.destroy();
                }
            });
        }
    }
    finishActiveQueriedAnimationOnElement(element) {
        const players = this.playersByQueriedElement.get(element);
        if (players) {
            players.forEach(player => player.finish());
        }
    }
    whenRenderingDone() {
        return new Promise(resolve => {
            if (this.players.length) {
                return optimizeGroupPlayer(this.players).onDone(() => resolve());
            }
            else {
                resolve();
            }
        });
    }
    processLeaveNode(element) {
        const details = element[REMOVAL_FLAG];
        if (details && details.setForRemoval) {
            // this will prevent it from removing it twice
            element[REMOVAL_FLAG] = NULL_REMOVAL_STATE;
            if (details.namespaceId) {
                this.destroyInnerAnimations(element);
                const ns = this._fetchNamespace(details.namespaceId);
                if (ns) {
                    ns.clearElementCache(element);
                }
            }
            this._onRemovalComplete(element, details.setForRemoval);
        }
        if (element.classList?.contains(DISABLED_CLASSNAME)) {
            this.markElementAsDisabled(element, false);
        }
        this.driver.query(element, DISABLED_SELECTOR, true).forEach(node => {
            this.markElementAsDisabled(node, false);
        });
    }
    flush(microtaskId = -1) {
        let players = [];
        if (this.newHostElements.size) {
            this.newHostElements.forEach((ns, element) => this._balanceNamespaceList(ns, element));
            this.newHostElements.clear();
        }
        if (this.totalAnimations && this.collectedEnterElements.length) {
            for (let i = 0; i < this.collectedEnterElements.length; i++) {
                const elm = this.collectedEnterElements[i];
                addClass(elm, STAR_CLASSNAME);
            }
        }
        if (this._namespaceList.length &&
            (this.totalQueuedPlayers || this.collectedLeaveElements.length)) {
            const cleanupFns = [];
            try {
                players = this._flushAnimations(cleanupFns, microtaskId);
            }
            finally {
                for (let i = 0; i < cleanupFns.length; i++) {
                    cleanupFns[i]();
                }
            }
        }
        else {
            for (let i = 0; i < this.collectedLeaveElements.length; i++) {
                const element = this.collectedLeaveElements[i];
                this.processLeaveNode(element);
            }
        }
        this.totalQueuedPlayers = 0;
        this.collectedEnterElements.length = 0;
        this.collectedLeaveElements.length = 0;
        this._flushFns.forEach(fn => fn());
        this._flushFns = [];
        if (this._whenQuietFns.length) {
            // we move these over to a variable so that
            // if any new callbacks are registered in another
            // flush they do not populate the existing set
            const quietFns = this._whenQuietFns;
            this._whenQuietFns = [];
            if (players.length) {
                optimizeGroupPlayer(players).onDone(() => {
                    quietFns.forEach(fn => fn());
                });
            }
            else {
                quietFns.forEach(fn => fn());
            }
        }
    }
    reportError(errors) {
        throw triggerTransitionsFailed(errors);
    }
    _flushAnimations(cleanupFns, microtaskId) {
        const subTimelines = new ElementInstructionMap();
        const skippedPlayers = [];
        const skippedPlayersMap = new Map();
        const queuedInstructions = [];
        const queriedElements = new Map();
        const allPreStyleElements = new Map();
        const allPostStyleElements = new Map();
        const disabledElementsSet = new Set();
        this.disabledNodes.forEach(node => {
            disabledElementsSet.add(node);
            const nodesThatAreDisabled = this.driver.query(node, QUEUED_SELECTOR, true);
            for (let i = 0; i < nodesThatAreDisabled.length; i++) {
                disabledElementsSet.add(nodesThatAreDisabled[i]);
            }
        });
        const bodyNode = this.bodyNode;
        const allTriggerElements = Array.from(this.statesByElement.keys());
        const enterNodeMap = buildRootMap(allTriggerElements, this.collectedEnterElements);
        // this must occur before the instructions are built below such that
        // the :enter queries match the elements (since the timeline queries
        // are fired during instruction building).
        const enterNodeMapIds = new Map();
        let i = 0;
        enterNodeMap.forEach((nodes, root) => {
            const className = ENTER_CLASSNAME + i++;
            enterNodeMapIds.set(root, className);
            nodes.forEach(node => addClass(node, className));
        });
        const allLeaveNodes = [];
        const mergedLeaveNodes = new Set();
        const leaveNodesWithoutAnimations = new Set();
        for (let i = 0; i < this.collectedLeaveElements.length; i++) {
            const element = this.collectedLeaveElements[i];
            const details = element[REMOVAL_FLAG];
            if (details && details.setForRemoval) {
                allLeaveNodes.push(element);
                mergedLeaveNodes.add(element);
                if (details.hasAnimation) {
                    this.driver.query(element, STAR_SELECTOR, true).forEach(elm => mergedLeaveNodes.add(elm));
                }
                else {
                    leaveNodesWithoutAnimations.add(element);
                }
            }
        }
        const leaveNodeMapIds = new Map();
        const leaveNodeMap = buildRootMap(allTriggerElements, Array.from(mergedLeaveNodes));
        leaveNodeMap.forEach((nodes, root) => {
            const className = LEAVE_CLASSNAME + i++;
            leaveNodeMapIds.set(root, className);
            nodes.forEach(node => addClass(node, className));
        });
        cleanupFns.push(() => {
            enterNodeMap.forEach((nodes, root) => {
                const className = enterNodeMapIds.get(root);
                nodes.forEach(node => removeClass(node, className));
            });
            leaveNodeMap.forEach((nodes, root) => {
                const className = leaveNodeMapIds.get(root);
                nodes.forEach(node => removeClass(node, className));
            });
            allLeaveNodes.forEach(element => {
                this.processLeaveNode(element);
            });
        });
        const allPlayers = [];
        const erroneousTransitions = [];
        for (let i = this._namespaceList.length - 1; i >= 0; i--) {
            const ns = this._namespaceList[i];
            ns.drainQueuedTransitions(microtaskId).forEach(entry => {
                const player = entry.player;
                const element = entry.element;
                allPlayers.push(player);
                if (this.collectedEnterElements.length) {
                    const details = element[REMOVAL_FLAG];
                    // animations for move operations (elements being removed and reinserted,
                    // e.g. when the order of an *ngFor list changes) are currently not supported
                    if (details && details.setForMove) {
                        if (details.previousTriggersValues &&
                            details.previousTriggersValues.has(entry.triggerName)) {
                            const previousValue = details.previousTriggersValues.get(entry.triggerName);
                            // we need to restore the previous trigger value since the element has
                            // only been moved and hasn't actually left the DOM
                            const triggersWithStates = this.statesByElement.get(entry.element);
                            if (triggersWithStates && triggersWithStates.has(entry.triggerName)) {
                                const state = triggersWithStates.get(entry.triggerName);
                                state.value = previousValue;
                                triggersWithStates.set(entry.triggerName, state);
                            }
                        }
                        player.destroy();
                        return;
                    }
                }
                const nodeIsOrphaned = !bodyNode || !this.driver.containsElement(bodyNode, element);
                const leaveClassName = leaveNodeMapIds.get(element);
                const enterClassName = enterNodeMapIds.get(element);
                const instruction = this._buildInstruction(entry, subTimelines, enterClassName, leaveClassName, nodeIsOrphaned);
                if (instruction.errors && instruction.errors.length) {
                    erroneousTransitions.push(instruction);
                    return;
                }
                // even though the element may not be in the DOM, it may still
                // be added at a later point (due to the mechanics of content
                // projection and/or dynamic component insertion) therefore it's
                // important to still style the element.
                if (nodeIsOrphaned) {
                    player.onStart(() => eraseStyles(element, instruction.fromStyles));
                    player.onDestroy(() => setStyles(element, instruction.toStyles));
                    skippedPlayers.push(player);
                    return;
                }
                // if an unmatched transition is queued and ready to go
                // then it SHOULD NOT render an animation and cancel the
                // previously running animations.
                if (entry.isFallbackTransition) {
                    player.onStart(() => eraseStyles(element, instruction.fromStyles));
                    player.onDestroy(() => setStyles(element, instruction.toStyles));
                    skippedPlayers.push(player);
                    return;
                }
                // this means that if a parent animation uses this animation as a sub-trigger
                // then it will instruct the timeline builder not to add a player delay, but
                // instead stretch the first keyframe gap until the animation starts. This is
                // important in order to prevent extra initialization styles from being
                // required by the user for the animation.
                const timelines = [];
                instruction.timelines.forEach(tl => {
                    tl.stretchStartingKeyframe = true;
                    if (!this.disabledNodes.has(tl.element)) {
                        timelines.push(tl);
                    }
                });
                instruction.timelines = timelines;
                subTimelines.append(element, instruction.timelines);
                const tuple = { instruction, player, element };
                queuedInstructions.push(tuple);
                instruction.queriedElements.forEach(element => getOrSetDefaultValue(queriedElements, element, []).push(player));
                instruction.preStyleProps.forEach((stringMap, element) => {
                    if (stringMap.size) {
                        let setVal = allPreStyleElements.get(element);
                        if (!setVal) {
                            allPreStyleElements.set(element, setVal = new Set());
                        }
                        stringMap.forEach((_, prop) => setVal.add(prop));
                    }
                });
                instruction.postStyleProps.forEach((stringMap, element) => {
                    let setVal = allPostStyleElements.get(element);
                    if (!setVal) {
                        allPostStyleElements.set(element, setVal = new Set());
                    }
                    stringMap.forEach((_, prop) => setVal.add(prop));
                });
            });
        }
        if (erroneousTransitions.length) {
            const errors = [];
            erroneousTransitions.forEach(instruction => {
                errors.push(transitionFailed(instruction.triggerName, instruction.errors));
            });
            allPlayers.forEach(player => player.destroy());
            this.reportError(errors);
        }
        const allPreviousPlayersMap = new Map();
        // this map tells us which element in the DOM tree is contained by
        // which animation. Further down this map will get populated once
        // the players are built and in doing so we can use it to efficiently
        // figure out if a sub player is skipped due to a parent player having priority.
        const animationElementMap = new Map();
        queuedInstructions.forEach(entry => {
            const element = entry.element;
            if (subTimelines.has(element)) {
                animationElementMap.set(element, element);
                this._beforeAnimationBuild(entry.player.namespaceId, entry.instruction, allPreviousPlayersMap);
            }
        });
        skippedPlayers.forEach(player => {
            const element = player.element;
            const previousPlayers = this._getPreviousPlayers(element, false, player.namespaceId, player.triggerName, null);
            previousPlayers.forEach(prevPlayer => {
                getOrSetDefaultValue(allPreviousPlayersMap, element, []).push(prevPlayer);
                prevPlayer.destroy();
            });
        });
        // this is a special case for nodes that will be removed either by
        // having their own leave animations or by being queried in a container
        // that will be removed once a parent animation is complete. The idea
        // here is that * styles must be identical to ! styles because of
        // backwards compatibility (* is also filled in by default in many places).
        // Otherwise * styles will return an empty value or "auto" since the element
        // passed to getComputedStyle will not be visible (since * === destination)
        const replaceNodes = allLeaveNodes.filter(node => {
            return replacePostStylesAsPre(node, allPreStyleElements, allPostStyleElements);
        });
        // POST STAGE: fill the * styles
        const postStylesMap = new Map();
        const allLeaveQueriedNodes = cloakAndComputeStyles(postStylesMap, this.driver, leaveNodesWithoutAnimations, allPostStyleElements, AUTO_STYLE);
        allLeaveQueriedNodes.forEach(node => {
            if (replacePostStylesAsPre(node, allPreStyleElements, allPostStyleElements)) {
                replaceNodes.push(node);
            }
        });
        // PRE STAGE: fill the ! styles
        const preStylesMap = new Map();
        enterNodeMap.forEach((nodes, root) => {
            cloakAndComputeStyles(preStylesMap, this.driver, new Set(nodes), allPreStyleElements, PRE_STYLE);
        });
        replaceNodes.forEach(node => {
            const post = postStylesMap.get(node);
            const pre = preStylesMap.get(node);
            postStylesMap.set(node, new Map([...(post?.entries() ?? []), ...(pre?.entries() ?? [])]));
        });
        const rootPlayers = [];
        const subPlayers = [];
        const NO_PARENT_ANIMATION_ELEMENT_DETECTED = {};
        queuedInstructions.forEach(entry => {
            const { element, player, instruction } = entry;
            // this means that it was never consumed by a parent animation which
            // means that it is independent and therefore should be set for animation
            if (subTimelines.has(element)) {
                if (disabledElementsSet.has(element)) {
                    player.onDestroy(() => setStyles(element, instruction.toStyles));
                    player.disabled = true;
                    player.overrideTotalTime(instruction.totalTime);
                    skippedPlayers.push(player);
                    return;
                }
                // this will flow up the DOM and query the map to figure out
                // if a parent animation has priority over it. In the situation
                // that a parent is detected then it will cancel the loop. If
                // nothing is detected, or it takes a few hops to find a parent,
                // then it will fill in the missing nodes and signal them as having
                // a detected parent (or a NO_PARENT value via a special constant).
                let parentWithAnimation = NO_PARENT_ANIMATION_ELEMENT_DETECTED;
                if (animationElementMap.size > 1) {
                    let elm = element;
                    const parentsToAdd = [];
                    while (elm = elm.parentNode) {
                        const detectedParent = animationElementMap.get(elm);
                        if (detectedParent) {
                            parentWithAnimation = detectedParent;
                            break;
                        }
                        parentsToAdd.push(elm);
                    }
                    parentsToAdd.forEach(parent => animationElementMap.set(parent, parentWithAnimation));
                }
                const innerPlayer = this._buildAnimation(player.namespaceId, instruction, allPreviousPlayersMap, skippedPlayersMap, preStylesMap, postStylesMap);
                player.setRealPlayer(innerPlayer);
                if (parentWithAnimation === NO_PARENT_ANIMATION_ELEMENT_DETECTED) {
                    rootPlayers.push(player);
                }
                else {
                    const parentPlayers = this.playersByElement.get(parentWithAnimation);
                    if (parentPlayers && parentPlayers.length) {
                        player.parentPlayer = optimizeGroupPlayer(parentPlayers);
                    }
                    skippedPlayers.push(player);
                }
            }
            else {
                eraseStyles(element, instruction.fromStyles);
                player.onDestroy(() => setStyles(element, instruction.toStyles));
                // there still might be a ancestor player animating this
                // element therefore we will still add it as a sub player
                // even if its animation may be disabled
                subPlayers.push(player);
                if (disabledElementsSet.has(element)) {
                    skippedPlayers.push(player);
                }
            }
        });
        // find all of the sub players' corresponding inner animation players
        subPlayers.forEach(player => {
            // even if no players are found for a sub animation it
            // will still complete itself after the next tick since it's Noop
            const playersForElement = skippedPlayersMap.get(player.element);
            if (playersForElement && playersForElement.length) {
                const innerPlayer = optimizeGroupPlayer(playersForElement);
                player.setRealPlayer(innerPlayer);
            }
        });
        // the reason why we don't actually play the animation is
        // because all that a skipped player is designed to do is to
        // fire the start/done transition callback events
        skippedPlayers.forEach(player => {
            if (player.parentPlayer) {
                player.syncPlayerEvents(player.parentPlayer);
            }
            else {
                player.destroy();
            }
        });
        // run through all of the queued removals and see if they
        // were picked up by a query. If not then perform the removal
        // operation right away unless a parent animation is ongoing.
        for (let i = 0; i < allLeaveNodes.length; i++) {
            const element = allLeaveNodes[i];
            const details = element[REMOVAL_FLAG];
            removeClass(element, LEAVE_CLASSNAME);
            // this means the element has a removal animation that is being
            // taken care of and therefore the inner elements will hang around
            // until that animation is over (or the parent queried animation)
            if (details && details.hasAnimation)
                continue;
            let players = [];
            // if this element is queried or if it contains queried children
            // then we want for the element not to be removed from the page
            // until the queried animations have finished
            if (queriedElements.size) {
                let queriedPlayerResults = queriedElements.get(element);
                if (queriedPlayerResults && queriedPlayerResults.length) {
                    players.push(...queriedPlayerResults);
                }
                let queriedInnerElements = this.driver.query(element, NG_ANIMATING_SELECTOR, true);
                for (let j = 0; j < queriedInnerElements.length; j++) {
                    let queriedPlayers = queriedElements.get(queriedInnerElements[j]);
                    if (queriedPlayers && queriedPlayers.length) {
                        players.push(...queriedPlayers);
                    }
                }
            }
            const activePlayers = players.filter(p => !p.destroyed);
            if (activePlayers.length) {
                removeNodesAfterAnimationDone(this, element, activePlayers);
            }
            else {
                this.processLeaveNode(element);
            }
        }
        // this is required so the cleanup method doesn't remove them
        allLeaveNodes.length = 0;
        rootPlayers.forEach(player => {
            this.players.push(player);
            player.onDone(() => {
                player.destroy();
                const index = this.players.indexOf(player);
                this.players.splice(index, 1);
            });
            player.play();
        });
        return rootPlayers;
    }
    afterFlush(callback) {
        this._flushFns.push(callback);
    }
    afterFlushAnimationsDone(callback) {
        this._whenQuietFns.push(callback);
    }
    _getPreviousPlayers(element, isQueriedElement, namespaceId, triggerName, toStateValue) {
        let players = [];
        if (isQueriedElement) {
            const queriedElementPlayers = this.playersByQueriedElement.get(element);
            if (queriedElementPlayers) {
                players = queriedElementPlayers;
            }
        }
        else {
            const elementPlayers = this.playersByElement.get(element);
            if (elementPlayers) {
                const isRemovalAnimation = !toStateValue || toStateValue == VOID_VALUE;
                elementPlayers.forEach(player => {
                    if (player.queued)
                        return;
                    if (!isRemovalAnimation && player.triggerName != triggerName)
                        return;
                    players.push(player);
                });
            }
        }
        if (namespaceId || triggerName) {
            players = players.filter(player => {
                if (namespaceId && namespaceId != player.namespaceId)
                    return false;
                if (triggerName && triggerName != player.triggerName)
                    return false;
                return true;
            });
        }
        return players;
    }
    _beforeAnimationBuild(namespaceId, instruction, allPreviousPlayersMap) {
        const triggerName = instruction.triggerName;
        const rootElement = instruction.element;
        // when a removal animation occurs, ALL previous players are collected
        // and destroyed (even if they are outside of the current namespace)
        const targetNameSpaceId = instruction.isRemovalTransition ? undefined : namespaceId;
        const targetTriggerName = instruction.isRemovalTransition ? undefined : triggerName;
        for (const timelineInstruction of instruction.timelines) {
            const element = timelineInstruction.element;
            const isQueriedElement = element !== rootElement;
            const players = getOrSetDefaultValue(allPreviousPlayersMap, element, []);
            const previousPlayers = this._getPreviousPlayers(element, isQueriedElement, targetNameSpaceId, targetTriggerName, instruction.toState);
            previousPlayers.forEach(player => {
                const realPlayer = player.getRealPlayer();
                if (realPlayer.beforeDestroy) {
                    realPlayer.beforeDestroy();
                }
                player.destroy();
                players.push(player);
            });
        }
        // this needs to be done so that the PRE/POST styles can be
        // computed properly without interfering with the previous animation
        eraseStyles(rootElement, instruction.fromStyles);
    }
    _buildAnimation(namespaceId, instruction, allPreviousPlayersMap, skippedPlayersMap, preStylesMap, postStylesMap) {
        const triggerName = instruction.triggerName;
        const rootElement = instruction.element;
        // we first run this so that the previous animation player
        // data can be passed into the successive animation players
        const allQueriedPlayers = [];
        const allConsumedElements = new Set();
        const allSubElements = new Set();
        const allNewPlayers = instruction.timelines.map(timelineInstruction => {
            const element = timelineInstruction.element;
            allConsumedElements.add(element);
            // FIXME (matsko): make sure to-be-removed animations are removed properly
            const details = element[REMOVAL_FLAG];
            if (details && details.removedBeforeQueried)
                return new NoopAnimationPlayer(timelineInstruction.duration, timelineInstruction.delay);
            const isQueriedElement = element !== rootElement;
            const previousPlayers = flattenGroupPlayers((allPreviousPlayersMap.get(element) || EMPTY_PLAYER_ARRAY)
                .map(p => p.getRealPlayer()))
                .filter(p => {
                // the `element` is not apart of the AnimationPlayer definition, but
                // Mock/WebAnimations
                // use the element within their implementation. This will be added in Angular5 to
                // AnimationPlayer
                const pp = p;
                return pp.element ? pp.element === element : false;
            });
            const preStyles = preStylesMap.get(element);
            const postStyles = postStylesMap.get(element);
            const keyframes = normalizeKeyframes(this._normalizer, timelineInstruction.keyframes, preStyles, postStyles);
            const player = this._buildPlayer(timelineInstruction, keyframes, previousPlayers);
            // this means that this particular player belongs to a sub trigger. It is
            // important that we match this player up with the corresponding (@trigger.listener)
            if (timelineInstruction.subTimeline && skippedPlayersMap) {
                allSubElements.add(element);
            }
            if (isQueriedElement) {
                const wrappedPlayer = new TransitionAnimationPlayer(namespaceId, triggerName, element);
                wrappedPlayer.setRealPlayer(player);
                allQueriedPlayers.push(wrappedPlayer);
            }
            return player;
        });
        allQueriedPlayers.forEach(player => {
            getOrSetDefaultValue(this.playersByQueriedElement, player.element, []).push(player);
            player.onDone(() => deleteOrUnsetInMap(this.playersByQueriedElement, player.element, player));
        });
        allConsumedElements.forEach(element => addClass(element, NG_ANIMATING_CLASSNAME));
        const player = optimizeGroupPlayer(allNewPlayers);
        player.onDestroy(() => {
            allConsumedElements.forEach(element => removeClass(element, NG_ANIMATING_CLASSNAME));
            setStyles(rootElement, instruction.toStyles);
        });
        // this basically makes all of the callbacks for sub element animations
        // be dependent on the upper players for when they finish
        allSubElements.forEach(element => {
            getOrSetDefaultValue(skippedPlayersMap, element, []).push(player);
        });
        return player;
    }
    _buildPlayer(instruction, keyframes, previousPlayers) {
        if (keyframes.length > 0) {
            return this.driver.animate(instruction.element, keyframes, instruction.duration, instruction.delay, instruction.easing, previousPlayers);
        }
        // special case for when an empty transition|definition is provided
        // ... there is no point in rendering an empty animation
        return new NoopAnimationPlayer(instruction.duration, instruction.delay);
    }
}
export class TransitionAnimationPlayer {
    constructor(namespaceId, triggerName, element) {
        this.namespaceId = namespaceId;
        this.triggerName = triggerName;
        this.element = element;
        this._player = new NoopAnimationPlayer();
        this._containsRealPlayer = false;
        this._queuedCallbacks = new Map();
        this.destroyed = false;
        this.parentPlayer = null;
        this.markedForDestroy = false;
        this.disabled = false;
        this.queued = true;
        this.totalTime = 0;
    }
    setRealPlayer(player) {
        if (this._containsRealPlayer)
            return;
        this._player = player;
        this._queuedCallbacks.forEach((callbacks, phase) => {
            callbacks.forEach(callback => listenOnPlayer(player, phase, undefined, callback));
        });
        this._queuedCallbacks.clear();
        this._containsRealPlayer = true;
        this.overrideTotalTime(player.totalTime);
        this.queued = false;
    }
    getRealPlayer() {
        return this._player;
    }
    overrideTotalTime(totalTime) {
        this.totalTime = totalTime;
    }
    syncPlayerEvents(player) {
        const p = this._player;
        if (p.triggerCallback) {
            player.onStart(() => p.triggerCallback('start'));
        }
        player.onDone(() => this.finish());
        player.onDestroy(() => this.destroy());
    }
    _queueEvent(name, callback) {
        getOrSetDefaultValue(this._queuedCallbacks, name, []).push(callback);
    }
    onDone(fn) {
        if (this.queued) {
            this._queueEvent('done', fn);
        }
        this._player.onDone(fn);
    }
    onStart(fn) {
        if (this.queued) {
            this._queueEvent('start', fn);
        }
        this._player.onStart(fn);
    }
    onDestroy(fn) {
        if (this.queued) {
            this._queueEvent('destroy', fn);
        }
        this._player.onDestroy(fn);
    }
    init() {
        this._player.init();
    }
    hasStarted() {
        return this.queued ? false : this._player.hasStarted();
    }
    play() {
        !this.queued && this._player.play();
    }
    pause() {
        !this.queued && this._player.pause();
    }
    restart() {
        !this.queued && this._player.restart();
    }
    finish() {
        this._player.finish();
    }
    destroy() {
        this.destroyed = true;
        this._player.destroy();
    }
    reset() {
        !this.queued && this._player.reset();
    }
    setPosition(p) {
        if (!this.queued) {
            this._player.setPosition(p);
        }
    }
    getPosition() {
        return this.queued ? 0 : this._player.getPosition();
    }
    /** @internal */
    triggerCallback(phaseName) {
        const p = this._player;
        if (p.triggerCallback) {
            p.triggerCallback(phaseName);
        }
    }
}
function deleteOrUnsetInMap(map, key, value) {
    let currentValues = map.get(key);
    if (currentValues) {
        if (currentValues.length) {
            const index = currentValues.indexOf(value);
            currentValues.splice(index, 1);
        }
        if (currentValues.length == 0) {
            map.delete(key);
        }
    }
    return currentValues;
}
function normalizeTriggerValue(value) {
    // we use `!= null` here because it's the most simple
    // way to test against a "falsy" value without mixing
    // in empty strings or a zero value. DO NOT OPTIMIZE.
    return value != null ? value : null;
}
function isElementNode(node) {
    return node && node['nodeType'] === 1;
}
function isTriggerEventValid(eventName) {
    return eventName == 'start' || eventName == 'done';
}
function cloakElement(element, value) {
    const oldValue = element.style.display;
    element.style.display = value != null ? value : 'none';
    return oldValue;
}
function cloakAndComputeStyles(valuesMap, driver, elements, elementPropsMap, defaultStyle) {
    const cloakVals = [];
    elements.forEach(element => cloakVals.push(cloakElement(element)));
    const failedElements = [];
    elementPropsMap.forEach((props, element) => {
        const styles = new Map();
        props.forEach(prop => {
            const value = driver.computeStyle(element, prop, defaultStyle);
            styles.set(prop, value);
            // there is no easy way to detect this because a sub element could be removed
            // by a parent animation element being detached.
            if (!value || value.length == 0) {
                element[REMOVAL_FLAG] = NULL_REMOVED_QUERIED_STATE;
                failedElements.push(element);
            }
        });
        valuesMap.set(element, styles);
    });
    // we use a index variable here since Set.forEach(a, i) does not return
    // an index value for the closure (but instead just the value)
    let i = 0;
    elements.forEach(element => cloakElement(element, cloakVals[i++]));
    return failedElements;
}
/*
Since the Angular renderer code will return a collection of inserted
nodes in all areas of a DOM tree, it's up to this algorithm to figure
out which nodes are roots for each animation @trigger.

By placing each inserted node into a Set and traversing upwards, it
is possible to find the @trigger elements and well any direct *star
insertion nodes, if a @trigger root is found then the enter element
is placed into the Map[@trigger] spot.
 */
function buildRootMap(roots, nodes) {
    const rootMap = new Map();
    roots.forEach(root => rootMap.set(root, []));
    if (nodes.length == 0)
        return rootMap;
    const NULL_NODE = 1;
    const nodeSet = new Set(nodes);
    const localRootMap = new Map();
    function getRoot(node) {
        if (!node)
            return NULL_NODE;
        let root = localRootMap.get(node);
        if (root)
            return root;
        const parent = node.parentNode;
        if (rootMap.has(parent)) { // ngIf inside @trigger
            root = parent;
        }
        else if (nodeSet.has(parent)) { // ngIf inside ngIf
            root = NULL_NODE;
        }
        else { // recurse upwards
            root = getRoot(parent);
        }
        localRootMap.set(node, root);
        return root;
    }
    nodes.forEach(node => {
        const root = getRoot(node);
        if (root !== NULL_NODE) {
            rootMap.get(root).push(node);
        }
    });
    return rootMap;
}
function addClass(element, className) {
    element.classList?.add(className);
}
function removeClass(element, className) {
    element.classList?.remove(className);
}
function removeNodesAfterAnimationDone(engine, element, players) {
    optimizeGroupPlayer(players).onDone(() => engine.processLeaveNode(element));
}
function flattenGroupPlayers(players) {
    const finalPlayers = [];
    _flattenGroupPlayersRecur(players, finalPlayers);
    return finalPlayers;
}
function _flattenGroupPlayersRecur(players, finalPlayers) {
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (player instanceof AnimationGroupPlayer) {
            _flattenGroupPlayersRecur(player.players, finalPlayers);
        }
        else {
            finalPlayers.push(player);
        }
    }
}
function objEquals(a, b) {
    const k1 = Object.keys(a);
    const k2 = Object.keys(b);
    if (k1.length != k2.length)
        return false;
    for (let i = 0; i < k1.length; i++) {
        const prop = k1[i];
        if (!b.hasOwnProperty(prop) || a[prop] !== b[prop])
            return false;
    }
    return true;
}
function replacePostStylesAsPre(element, allPreStyleElements, allPostStyleElements) {
    const postEntry = allPostStyleElements.get(element);
    if (!postEntry)
        return false;
    let preEntry = allPreStyleElements.get(element);
    if (preEntry) {
        postEntry.forEach(data => preEntry.add(data));
    }
    else {
        allPreStyleElements.set(element, postEntry);
    }
    allPostStyleElements.delete(element);
    return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNpdGlvbl9hbmltYXRpb25fZW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5pbWF0aW9ucy9icm93c2VyL3NyYy9yZW5kZXIvdHJhbnNpdGlvbl9hbmltYXRpb25fZW5naW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFBb0MsVUFBVSxFQUFFLG1CQUFtQixFQUFFLHFCQUFxQixJQUFJLG9CQUFvQixFQUFFLFVBQVUsSUFBSSxTQUFTLEVBQWdCLE1BQU0scUJBQXFCLENBQUM7QUFNOUwsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFFckUsT0FBTyxFQUFDLFlBQVksRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLEVBQUUsd0JBQXdCLEVBQUUsbUJBQW1CLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUN4SixPQUFPLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUdwTCxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRTNILE1BQU0sZ0JBQWdCLEdBQUcsbUJBQW1CLENBQUM7QUFDN0MsTUFBTSxlQUFlLEdBQUcsb0JBQW9CLENBQUM7QUFDN0MsTUFBTSxrQkFBa0IsR0FBRyxxQkFBcUIsQ0FBQztBQUNqRCxNQUFNLGlCQUFpQixHQUFHLHNCQUFzQixDQUFDO0FBQ2pELE1BQU0sY0FBYyxHQUFHLGtCQUFrQixDQUFDO0FBQzFDLE1BQU0sYUFBYSxHQUFHLG1CQUFtQixDQUFDO0FBRTFDLE1BQU0sa0JBQWtC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LENBQUMsQ0FBQyxDQUFDO0lBQzFCLElBQUksRUFBRSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsTUFBTTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ3pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2xDLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQixJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQztZQUFFLE9BQU8sS0FBSyxDQUFDO0tBQ2xFO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBUyxzQkFBc0IsQ0FDM0IsT0FBWSxFQUFFLG1CQUEwQyxFQUN4RCxvQkFBMkM7SUFDN0MsTUFBTSxTQUFTLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3BELElBQUksQ0FBQyxTQUFTO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFFN0IsSUFBSSxRQUFRLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hELElBQUksUUFBUSxFQUFFO1FBQ1osU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztLQUNoRDtTQUFNO1FBQ0wsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM3QztJQUVELG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNyQyxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7QW5pbWF0aW9uT3B0aW9ucywgQW5pbWF0aW9uUGxheWVyLCBBVVRPX1NUWUxFLCBOb29wQW5pbWF0aW9uUGxheWVyLCDJtUFuaW1hdGlvbkdyb3VwUGxheWVyIGFzIEFuaW1hdGlvbkdyb3VwUGxheWVyLCDJtVBSRV9TVFlMRSBhcyBQUkVfU1RZTEUsIMm1U3R5bGVEYXRhTWFwfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcblxuaW1wb3J0IHtBbmltYXRpb25UaW1lbGluZUluc3RydWN0aW9ufSBmcm9tICcuLi9kc2wvYW5pbWF0aW9uX3RpbWVsaW5lX2luc3RydWN0aW9uJztcbmltcG9ydCB7QW5pbWF0aW9uVHJhbnNpdGlvbkZhY3Rvcnl9IGZyb20gJy4uL2RzbC9hbmltYXRpb25fdHJhbnNpdGlvbl9mYWN0b3J5JztcbmltcG9ydCB7QW5pbWF0aW9uVHJhbnNpdGlvbkluc3RydWN0aW9ufSBmcm9tICcuLi9kc2wvYW5pbWF0aW9uX3RyYW5zaXRpb25faW5zdHJ1Y3Rpb24nO1xuaW1wb3J0IHtBbmltYXRpb25UcmlnZ2VyfSBmcm9tICcuLi9kc2wvYW5pbWF0aW9uX3RyaWdnZXInO1xuaW1wb3J0IHtFbGVtZW50SW5zdHJ1Y3Rpb25NYXB9IGZyb20gJy4uL2RzbC9lbGVtZW50X2luc3RydWN0aW9uX21hcCc7XG5pbXBvcnQge0FuaW1hdGlvblN0eWxlTm9ybWFsaXplcn0gZnJvbSAnLi4vZHNsL3N0eWxlX25vcm1hbGl6YXRpb24vYW5pbWF0aW9uX3N0eWxlX25vcm1hbGl6ZXInO1xuaW1wb3J0IHttaXNzaW5nRXZlbnQsIG1pc3NpbmdUcmlnZ2VyLCB0cmFuc2l0aW9uRmFpbGVkLCB0cmlnZ2VyVHJhbnNpdGlvbnNGYWlsZWQsIHVucmVnaXN0ZXJlZFRyaWdnZXIsIHVuc3VwcG9ydGVkVHJpZ2dlckV2ZW50fSBmcm9tICcuLi9lcnJvcl9oZWxwZXJzJztcbmltcG9ydCB7Y29weU9iaiwgRU5URVJfQ0xBU1NOQU1FLCBlcmFzZVN0eWxlcywgTEVBVkVfQ0xBU1NOQU1FLCBOR19BTklNQVRJTkdfQ0xBU1NOQU1FLCBOR19BTklNQVRJTkdfU0VMRUNUT1IsIE5HX1RSSUdHRVJfQ0xBU1NOQU1FLCBOR19UUklHR0VSX1NFTEVDVE9SLCBzZXRTdHlsZXN9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge0FuaW1hdGlvbkRyaXZlcn0gZnJvbSAnLi9hbmltYXRpb25fZHJpdmVyJztcbmltcG9ydCB7Z2V0T3JTZXREZWZhdWx0VmFsdWUsIGxpc3Rlbk9uUGxheWVyLCBtYWtlQW5pbWF0aW9uRXZlbnQsIG5vcm1hbGl6ZUtleWZyYW1lcywgb3B0aW1pemVHcm91cFBsYXllcn0gZnJvbSAnLi9zaGFyZWQnO1xuXG5jb25zdCBRVUVVRURfQ0xBU1NOQU1FID0gJ25nLWFuaW1hdGUtcXVldWVkJztcbmNvbnN0IFFVRVVFRF9TRUxFQ1RPUiA9ICcubmctYW5pbWF0ZS1xdWV1ZWQnO1xuY29uc3QgRElTQUJMRURfQ0xBU1NOQU1FID0gJ25nLWFuaW1hdGUtZGlzYWJsZWQnO1xuY29uc3QgRElTQUJMRURfU0VMRUNUT1IgPSAnLm5nLWFuaW1hdGUtZGlzYWJsZWQnO1xuY29uc3QgU1RBUl9DTEFTU05BTUUgPSAnbmctc3Rhci1pbnNlcnRlZCc7XG5jb25zdCBTVEFSX1NFTEVDVE9SID0gJy5uZy1zdGFyLWluc2VydGVkJztcblxuY29uc3QgRU1QVFlfUExBWUVSX0FSUkFZOiBUcmFuc2l0aW9uQW5pbWF0aW9uUGxheWVyW10gPSBbXTtcbmNvbnN0IE5VTExfUkVNT1ZBTF9TVEFURTogRWxlbWVudEFuaW1hdGlvblN0YXRlID0ge1xuICBuYW1lc3BhY2VJZDogJycsXG4gIHNldEZvclJlbW92YWw6IGZhbHNlLFxuICBzZXRGb3JNb3ZlOiBmYWxzZSxcbiAgaGFzQW5pbWF0aW9uOiBmYWxzZSxcbiAgcmVtb3ZlZEJlZm9yZVF1ZXJpZWQ6IGZhbHNlXG59O1xuY29uc3QgTlVMTF9SRU1PVkVEX1FVRVJJRURfU1RBVEU6IEVsZW1lbnRBbmltYXRpb25TdGF0ZSA9IHtcbiAgbmFtZXNwYWNlSWQ6ICcnLFxuICBzZXRGb3JNb3ZlOiBmYWxzZSxcbiAgc2V0Rm9yUmVtb3ZhbDogZmFsc2UsXG4gIGhhc0FuaW1hdGlvbjogZmFsc2UsXG4gIHJlbW92ZWRCZWZvcmVRdWVyaWVkOiB0cnVlXG59O1xuXG5pbnRlcmZhY2UgVHJpZ2dlckxpc3RlbmVyIHtcbiAgbmFtZTogc3RyaW5nO1xuICBwaGFzZTogc3RyaW5nO1xuICBjYWxsYmFjazogKGV2ZW50OiBhbnkpID0+IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBRdWV1ZUluc3RydWN0aW9uIHtcbiAgZWxlbWVudDogYW55O1xuICB0cmlnZ2VyTmFtZTogc3RyaW5nO1xuICBmcm9tU3RhdGU6IFN0YXRlVmFsdWU7XG4gIHRvU3RhdGU6IFN0YXRlVmFsdWU7XG4gIHRyYW5zaXRpb246IEFuaW1hdGlvblRyYW5zaXRpb25GYWN0b3J5O1xuICBwbGF5ZXI6IFRyYW5zaXRpb25BbmltYXRpb25QbGF5ZXI7XG4gIGlzRmFsbGJhY2tUcmFuc2l0aW9uOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgUkVNT1ZBTF9GTEFHID0gJ19fbmdfcmVtb3ZlZCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRWxlbWVudEFuaW1hdGlvblN0YXRlIHtcbiAgc2V0Rm9yUmVtb3ZhbDogYm9vbGVhbjtcbiAgc2V0Rm9yTW92ZTogYm9vbGVhbjtcbiAgaGFzQW5pbWF0aW9uOiBib29sZWFuO1xuICBuYW1lc3BhY2VJZDogc3RyaW5nO1xuICByZW1vdmVkQmVmb3JlUXVlcmllZDogYm9vbGVhbjtcbiAgcHJldmlvdXNUcmlnZ2Vyc1ZhbHVlcz86IE1hcDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBTdGF0ZVZhbHVlIHtcbiAgcHVibGljIHZhbHVlOiBzdHJpbmc7XG4gIHB1YmxpYyBvcHRpb25zOiBBbmltYXRpb25PcHRpb25zO1xuXG4gIGdldCBwYXJhbXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMucGFyYW1zIGFzIHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICB9XG5cbiAgY29uc3RydWN0b3IoaW5wdXQ6IGFueSwgcHVibGljIG5hbWVzcGFjZUlkOiBzdHJpbmcgPSAnJykge1xuICAgIGNvbnN0IGlzT2JqID0gaW5wdXQgJiYgaW5wdXQuaGFzT3duUHJvcGVydHkoJ3ZhbHVlJyk7XG4gICAgY29uc3QgdmFsdWUgPSBpc09iaiA/IGlucHV0Wyd2YWx1ZSddIDogaW5wdXQ7XG4gICAgdGhpcy52YWx1ZSA9IG5vcm1hbGl6ZVRyaWdnZXJWYWx1ZSh2YWx1ZSk7XG4gICAgaWYgKGlzT2JqKSB7XG4gICAgICBjb25zdCBvcHRpb25zID0gY29weU9iaihpbnB1dCBhcyBhbnkpO1xuICAgICAgZGVsZXRlIG9wdGlvbnNbJ3ZhbHVlJ107XG4gICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIGFzIEFuaW1hdGlvbk9wdGlvbnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5wYXJhbXMpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5wYXJhbXMgPSB7fTtcbiAgICB9XG4gIH1cblxuICBhYnNvcmJPcHRpb25zKG9wdGlvbnM6IEFuaW1hdGlvbk9wdGlvbnMpIHtcbiAgICBjb25zdCBuZXdQYXJhbXMgPSBvcHRpb25zLnBhcmFtcztcbiAgICBpZiAobmV3UGFyYW1zKSB7XG4gICAgICBjb25zdCBvbGRQYXJhbXMgPSB0aGlzLm9wdGlvbnMucGFyYW1zITtcbiAgICAgIE9iamVjdC5rZXlzKG5ld1BhcmFtcykuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgICAgaWYgKG9sZFBhcmFtc1twcm9wXSA9PSBudWxsKSB7XG4gICAgICAgICAgb2xkUGFyYW1zW3Byb3BdID0gbmV3UGFyYW1zW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFZPSURfVkFMVUUgPSAndm9pZCc7XG5leHBvcnQgY29uc3QgREVGQVVMVF9TVEFURV9WQUxVRSA9IG5ldyBTdGF0ZVZhbHVlKFZPSURfVkFMVUUpO1xuXG5leHBvcnQgY2xhc3MgQW5pbWF0aW9uVHJhbnNpdGlvbk5hbWVzcGFjZSB7XG4gIHB1YmxpYyBwbGF5ZXJzOiBUcmFuc2l0aW9uQW5pbWF0aW9uUGxheWVyW10gPSBbXTtcblxuICBwcml2YXRlIF90cmlnZ2VycyA9IG5ldyBNYXA8c3RyaW5nLCBBbmltYXRpb25UcmlnZ2VyPigpO1xuICBwcml2YXRlIF9xdWV1ZTogUXVldWVJbnN0cnVjdGlvbltdID0gW107XG5cbiAgcHJpdmF0ZSBfZWxlbWVudExpc3RlbmVycyA9IG5ldyBNYXA8YW55LCBUcmlnZ2VyTGlzdGVuZXJbXT4oKTtcblxuICBwcml2YXRlIF9ob3N0Q2xhc3NOYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgaWQ6IHN0cmluZywgcHVibGljIGhvc3RFbGVtZW50OiBhbnksIHByaXZhdGUgX2VuZ2luZTogVHJhbnNpdGlvbkFuaW1hdGlvbkVuZ2luZSkge1xuICAgIHRoaXMuX2hvc3RDbGFzc05hbWUgPSAnbmctdG5zLScgKyBpZDtcbiAgICBhZGRDbGFzcyhob3N0RWxlbWVudCwgdGhpcy5faG9zdENsYXNzTmFtZSk7XG4gIH1cblxuICBsaXN0ZW4oZWxlbWVudDogYW55LCBuYW1lOiBzdHJpbmcsIHBoYXNlOiBzdHJpbmcsIGNhbGxiYWNrOiAoZXZlbnQ6IGFueSkgPT4gYm9vbGVhbik6ICgpID0+IGFueSB7XG4gICAgaWYgKCF0aGlzLl90cmlnZ2Vycy5oYXMobmFtZSkpIHtcbiAgICAgIHRocm93IG1pc3NpbmdUcmlnZ2VyKHBoYXNlLCBuYW1lKTtcbiAgICB9XG5cbiAgICBpZiAocGhhc2UgPT0gbnVsbCB8fCBwaGFzZS5sZW5ndGggPT0gMCkge1xuICAgICAgdGhyb3cgbWlzc2luZ0V2ZW50KG5hbWUpO1xuICAgIH1cblxuICAgIGlmICghaXNUcmlnZ2VyRXZlbnRWYWxpZChwaGFzZSkpIHtcbiAgICAgIHRocm93IHVuc3VwcG9ydGVkVHJpZ2dlckV2ZW50KHBoYXNlLCBuYW1lKTtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPSBnZXRPclNldERlZmF1bHRWYWx1ZSh0aGlzLl9lbGVtZW50TGlzdGVuZXJzLCBlbGVtZW50LCBbXSk7XG4gICAgY29uc3QgZGF0YSA9IHtuYW1lLCBwaGFzZSwgY2FsbGJhY2t9O1xuICAgIGxpc3RlbmVycy5wdXNoKGRhdGEpO1xuXG4gICAgY29uc3QgdHJpZ2dlcnNXaXRoU3RhdGVzID1cbiAgICAgICAgZ2V0T3JTZXREZWZhdWx0VmFsdWUodGhpcy5fZW5naW5lLnN0YXRlc0J5RWxlbWVudCwgZWxlbWVudCwgbmV3IE1hcDxzdHJpbmcsIFN0YXRlVmFsdWU+KCkpO1xuICAgIGlmICghdHJpZ2dlcnNXaXRoU3RhdGVzLmhhcyhuYW1lKSkge1xuICAgICAgYWRkQ2xhc3MoZWxlbWVudCwgTkdfVFJJR0dFUl9DTEFTU05BTUUpO1xuICAgICAgYWRkQ2xhc3MoZWxlbWVudCwgTkdfVFJJR0dFUl9DTEFTU05BTUUgKyAnLScgKyBuYW1lKTtcbiAgICAgIHRyaWdnZXJzV2l0aFN0YXRlcy5zZXQobmFtZSwgREVGQVVMVF9TVEFURV9WQUxVRSk7XG4gICAgfVxuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIC8vIHRoZSBldmVudCBsaXN0ZW5lciBpcyByZW1vdmVkIEFGVEVSIHRoZSBmbHVzaCBoYXMgb2NjdXJyZWQgc3VjaFxuICAgICAgLy8gdGhhdCBsZWF2ZSBhbmltYXRpb25zIGNhbGxiYWNrcyBjYW4gZmlyZSAob3RoZXJ3aXNlIGlmIHRoZSBub2RlXG4gICAgICAvLyBpcyByZW1vdmVkIGluIGJldHdlZW4gdGhlbiB0aGUgbGlzdGVuZXJzIHdvdWxkIGJlIGRlcmVnaXN0ZXJlZClcbiAgICAgIHRoaXMuX2VuZ2luZS5hZnRlckZsdXNoKCgpID0+IHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBsaXN0ZW5lcnMuaW5kZXhPZihkYXRhKTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5fdHJpZ2dlcnMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgdHJpZ2dlcnNXaXRoU3RhdGVzLmRlbGV0ZShuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG4gIHJlZ2lzdGVyKG5hbWU6IHN0cmluZywgYXN0OiBBbmltYXRpb25UcmlnZ2VyKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3RyaWdnZXJzLmhhcyhuYW1lKSkge1xuICAgICAgLy8gdGhyb3dcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdHJpZ2dlcnMuc2V0KG5hbWUsIGFzdCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRUcmlnZ2VyKG5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IHRyaWdnZXIgPSB0aGlzLl90cmlnZ2Vycy5nZXQobmFtZSk7XG4gICAgaWYgKCF0cmlnZ2VyKSB7XG4gICAgICB0aHJvdyB1bnJlZ2lzdGVyZWRUcmlnZ2VyKG5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gdHJpZ2dlcjtcbiAgfVxuXG4gIHRyaWdnZXIoZWxlbWVudDogYW55LCB0cmlnZ2VyTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCBkZWZhdWx0VG9GYWxsYmFjazogYm9vbGVhbiA9IHRydWUpOlxuICAgICAgVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcnx1bmRlZmluZWQge1xuICAgIGNvbnN0IHRyaWdnZXIgPSB0aGlzLl9nZXRUcmlnZ2VyKHRyaWdnZXJOYW1lKTtcbiAgICBjb25zdCBwbGF5ZXIgPSBuZXcgVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcih0aGlzLmlkLCB0cmlnZ2VyTmFtZSwgZWxlbWVudCk7XG5cbiAgICBsZXQgdHJpZ2dlcnNXaXRoU3RhdGVzID0gdGhpcy5fZW5naW5lLnN0YXRlc0J5RWxlbWVudC5nZXQoZWxlbWVudCk7XG4gICAgaWYgKCF0cmlnZ2Vyc1dpdGhTdGF0ZXMpIHtcbiAgICAgIGFkZENsYXNzKGVsZW1lbnQsIE5HX1RSSUdHRVJfQ0xBU1NOQU1FKTtcbiAgICAgIGFkZENsYXNzKGVsZW1lbnQsIE5HX1RSSUdHRVJfQ0xBU1NOQU1FICsgJy0nICsgdHJpZ2dlck5hbWUpO1xuICAgICAgdGhpcy5fZW5naW5lLnN0YXRlc0J5RWxlbWVudC5zZXQoZWxlbWVudCwgdHJpZ2dlcnNXaXRoU3RhdGVzID0gbmV3IE1hcDxzdHJpbmcsIFN0YXRlVmFsdWU+KCkpO1xuICAgIH1cblxuICAgIGxldCBmcm9tU3RhdGUgPSB0cmlnZ2Vyc1dpdGhTdGF0ZXMuZ2V0KHRyaWdnZXJOYW1lKTtcbiAgICBjb25zdCB0b1N0YXRlID0gbmV3IFN0YXRlVmFsdWUodmFsdWUsIHRoaXMuaWQpO1xuICAgIGNvbnN0IGlzT2JqID0gdmFsdWUgJiYgdmFsdWUuaGFzT3duUHJvcGVydHkoJ3ZhbHVlJyk7XG4gICAgaWYgKCFpc09iaiAmJiBmcm9tU3RhdGUpIHtcbiAgICAgIHRvU3RhdGUuYWJzb3JiT3B0aW9ucyhmcm9tU3RhdGUub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgdHJpZ2dlcnNXaXRoU3RhdGVzLnNldCh0cmlnZ2VyTmFtZSwgdG9TdGF0ZSk7XG5cbiAgICBpZiAoIWZyb21TdGF0ZSkge1xuICAgICAgZnJvbVN0YXRlID0gREVGQVVMVF9TVEFURV9WQUxVRTtcbiAgICB9XG5cbiAgICBjb25zdCBpc1JlbW92YWwgPSB0b1N0YXRlLnZhbHVlID09PSBWT0lEX1ZBTFVFO1xuXG4gICAgLy8gbm9ybWFsbHkgdGhpcyBpc24ndCByZWFjaGVkIGJ5IGhlcmUsIGhvd2V2ZXIsIGlmIGFuIG9iamVjdCBleHByZXNzaW9uXG4gICAgLy8gaXMgcGFzc2VkIGluIHRoZW4gaXQgbWF5IGJlIGEgbmV3IG9iamVjdCBlYWNoIHRpbWUuIENvbXBhcmluZyB0aGUgdmFsdWVcbiAgICAvLyBpcyBpbXBvcnRhbnQgc2luY2UgdGhhdCB3aWxsIHN0YXkgdGhlIHNhbWUgZGVzcGl0ZSB0aGVyZSBiZWluZyBhIG5ldyBvYmplY3QuXG4gICAgLy8gVGhlIHJlbW92YWwgYXJjIGhlcmUgaXMgc3BlY2lhbCBjYXNlZCBiZWNhdXNlIHRoZSBzYW1lIGVsZW1lbnQgaXMgdHJpZ2dlcmVkXG4gICAgLy8gdHdpY2UgaW4gdGhlIGV2ZW50IHRoYXQgaXQgY29udGFpbnMgYW5pbWF0aW9ucyBvbiB0aGUgb3V0ZXIvaW5uZXIgcG9ydGlvbnNcbiAgICAvLyBvZiB0aGUgaG9zdCBjb250YWluZXJcbiAgICBpZiAoIWlzUmVtb3ZhbCAmJiBmcm9tU3RhdGUudmFsdWUgPT09IHRvU3RhdGUudmFsdWUpIHtcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCBkZXNwaXRlIHRoZSB2YWx1ZSBub3QgY2hhbmdpbmcsIHNvbWUgaW5uZXIgcGFyYW1zXG4gICAgICAvLyBoYXZlIGNoYW5nZWQgd2hpY2ggbWVhbnMgdGhhdCB0aGUgYW5pbWF0aW9uIGZpbmFsIHN0eWxlcyBuZWVkIHRvIGJlIGFwcGxpZWRcbiAgICAgIGlmICghb2JqRXF1YWxzKGZyb21TdGF0ZS5wYXJhbXMsIHRvU3RhdGUucGFyYW1zKSkge1xuICAgICAgICBjb25zdCBlcnJvcnM6IEVycm9yW10gPSBbXTtcbiAgICAgICAgY29uc3QgZnJvbVN0eWxlcyA9IHRyaWdnZXIubWF0Y2hTdHlsZXMoZnJvbVN0YXRlLnZhbHVlLCBmcm9tU3RhdGUucGFyYW1zLCBlcnJvcnMpO1xuICAgICAgICBjb25zdCB0b1N0eWxlcyA9IHRyaWdnZXIubWF0Y2hTdHlsZXModG9TdGF0ZS52YWx1ZSwgdG9TdGF0ZS5wYXJhbXMsIGVycm9ycyk7XG4gICAgICAgIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5fZW5naW5lLnJlcG9ydEVycm9yKGVycm9ycyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fZW5naW5lLmFmdGVyRmx1c2goKCkgPT4ge1xuICAgICAgICAgICAgZXJhc2VTdHlsZXMoZWxlbWVudCwgZnJvbVN0eWxlcyk7XG4gICAgICAgICAgICBzZXRTdHlsZXMoZWxlbWVudCwgdG9TdHlsZXMpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGxheWVyc09uRWxlbWVudDogVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcltdID1cbiAgICAgICAgZ2V0T3JTZXREZWZhdWx0VmFsdWUodGhpcy5fZW5naW5lLnBsYXllcnNCeUVsZW1lbnQsIGVsZW1lbnQsIFtdKTtcbiAgICBwbGF5ZXJzT25FbGVtZW50LmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgIC8vIG9ubHkgcmVtb3ZlIHRoZSBwbGF5ZXIgaWYgaXQgaXMgcXVldWVkIG9uIHRoZSBFWEFDVCBzYW1lIHRyaWdnZXIvbmFtZXNwYWNlXG4gICAgICAvLyB3ZSBvbmx5IGFsc28gZGVhbCB3aXRoIHF1ZXVlZCBwbGF5ZXJzIGhlcmUgYmVjYXVzZSBpZiB0aGUgYW5pbWF0aW9uIGhhc1xuICAgICAgLy8gc3RhcnRlZCB0aGVuIHdlIHdhbnQgdG8ga2VlcCB0aGUgcGxheWVyIGFsaXZlIHVudGlsIHRoZSBmbHVzaCBoYXBwZW5zXG4gICAgICAvLyAod2hpY2ggaXMgd2hlcmUgdGhlIHByZXZpb3VzUGxheWVycyBhcmUgcGFzc2VkIGludG8gdGhlIG5ldyBwbGF5ZXIpXG4gICAgICBpZiAocGxheWVyLm5hbWVzcGFjZUlkID09IHRoaXMuaWQgJiYgcGxheWVyLnRyaWdnZXJOYW1lID09IHRyaWdnZXJOYW1lICYmIHBsYXllci5xdWV1ZWQpIHtcbiAgICAgICAgcGxheWVyLmRlc3Ryb3koKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGxldCB0cmFuc2l0aW9uID1cbiAgICAgICAgdHJpZ2dlci5tYXRjaFRyYW5zaXRpb24oZnJvbVN0YXRlLnZhbHVlLCB0b1N0YXRlLnZhbHVlLCBlbGVtZW50LCB0b1N0YXRlLnBhcmFtcyk7XG4gICAgbGV0IGlzRmFsbGJhY2tUcmFuc2l0aW9uID0gZmFsc2U7XG4gICAgaWYgKCF0cmFuc2l0aW9uKSB7XG4gICAgICBpZiAoIWRlZmF1bHRUb0ZhbGxiYWNrKSByZXR1cm47XG4gICAgICB0cmFuc2l0aW9uID0gdHJpZ2dlci5mYWxsYmFja1RyYW5zaXRpb247XG4gICAgICBpc0ZhbGxiYWNrVHJhbnNpdGlvbiA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5fZW5naW5lLnRvdGFsUXVldWVkUGxheWVycysrO1xuICAgIHRoaXMuX3F1ZXVlLnB1c2goXG4gICAgICAgIHtlbGVtZW50LCB0cmlnZ2VyTmFtZSwgdHJhbnNpdGlvbiwgZnJvbVN0YXRlLCB0b1N0YXRlLCBwbGF5ZXIsIGlzRmFsbGJhY2tUcmFuc2l0aW9ufSk7XG5cbiAgICBpZiAoIWlzRmFsbGJhY2tUcmFuc2l0aW9uKSB7XG4gICAgICBhZGRDbGFzcyhlbGVtZW50LCBRVUVVRURfQ0xBU1NOQU1FKTtcbiAgICAgIHBsYXllci5vblN0YXJ0KCgpID0+IHtcbiAgICAgICAgcmVtb3ZlQ2xhc3MoZWxlbWVudCwgUVVFVUVEX0NMQVNTTkFNRSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwbGF5ZXIub25Eb25lKCgpID0+IHtcbiAgICAgIGxldCBpbmRleCA9IHRoaXMucGxheWVycy5pbmRleE9mKHBsYXllcik7XG4gICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICB0aGlzLnBsYXllcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcGxheWVycyA9IHRoaXMuX2VuZ2luZS5wbGF5ZXJzQnlFbGVtZW50LmdldChlbGVtZW50KTtcbiAgICAgIGlmIChwbGF5ZXJzKSB7XG4gICAgICAgIGxldCBpbmRleCA9IHBsYXllcnMuaW5kZXhPZihwbGF5ZXIpO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIHBsYXllcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5wbGF5ZXJzLnB1c2gocGxheWVyKTtcbiAgICBwbGF5ZXJzT25FbGVtZW50LnB1c2gocGxheWVyKTtcblxuICAgIHJldHVybiBwbGF5ZXI7XG4gIH1cblxuICBkZXJlZ2lzdGVyKG5hbWU6IHN0cmluZykge1xuICAgIHRoaXMuX3RyaWdnZXJzLmRlbGV0ZShuYW1lKTtcblxuICAgIHRoaXMuX2VuZ2luZS5zdGF0ZXNCeUVsZW1lbnQuZm9yRWFjaChzdGF0ZU1hcCA9PiBzdGF0ZU1hcC5kZWxldGUobmFtZSkpO1xuXG4gICAgdGhpcy5fZWxlbWVudExpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcnMsIGVsZW1lbnQpID0+IHtcbiAgICAgIHRoaXMuX2VsZW1lbnRMaXN0ZW5lcnMuc2V0KGVsZW1lbnQsIGxpc3RlbmVycy5maWx0ZXIoZW50cnkgPT4ge1xuICAgICAgICByZXR1cm4gZW50cnkubmFtZSAhPSBuYW1lO1xuICAgICAgfSkpO1xuICAgIH0pO1xuICB9XG5cbiAgY2xlYXJFbGVtZW50Q2FjaGUoZWxlbWVudDogYW55KSB7XG4gICAgdGhpcy5fZW5naW5lLnN0YXRlc0J5RWxlbWVudC5kZWxldGUoZWxlbWVudCk7XG4gICAgdGhpcy5fZWxlbWVudExpc3RlbmVycy5kZWxldGUoZWxlbWVudCk7XG4gICAgY29uc3QgZWxlbWVudFBsYXllcnMgPSB0aGlzLl9lbmdpbmUucGxheWVyc0J5RWxlbWVudC5nZXQoZWxlbWVudCk7XG4gICAgaWYgKGVsZW1lbnRQbGF5ZXJzKSB7XG4gICAgICBlbGVtZW50UGxheWVycy5mb3JFYWNoKHBsYXllciA9PiBwbGF5ZXIuZGVzdHJveSgpKTtcbiAgICAgIHRoaXMuX2VuZ2luZS5wbGF5ZXJzQnlFbGVtZW50LmRlbGV0ZShlbGVtZW50KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9zaWduYWxSZW1vdmFsRm9ySW5uZXJUcmlnZ2Vycyhyb290RWxlbWVudDogYW55LCBjb250ZXh0OiBhbnkpIHtcbiAgICBjb25zdCBlbGVtZW50cyA9IHRoaXMuX2VuZ2luZS5kcml2ZXIucXVlcnkocm9vdEVsZW1lbnQsIE5HX1RSSUdHRVJfU0VMRUNUT1IsIHRydWUpO1xuXG4gICAgLy8gZW11bGF0ZSBhIGxlYXZlIGFuaW1hdGlvbiBmb3IgYWxsIGlubmVyIG5vZGVzIHdpdGhpbiB0aGlzIG5vZGUuXG4gICAgLy8gSWYgdGhlcmUgYXJlIG5vIGFuaW1hdGlvbnMgZm91bmQgZm9yIGFueSBvZiB0aGUgbm9kZXMgdGhlbiBjbGVhciB0aGUgY2FjaGVcbiAgICAvLyBmb3IgdGhlIGVsZW1lbnQuXG4gICAgZWxlbWVudHMuZm9yRWFjaChlbG0gPT4ge1xuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IGFuIGlubmVyIHJlbW92ZSgpIG9wZXJhdGlvbiBoYXMgYWxyZWFkeSBraWNrZWQgb2ZmXG4gICAgICAvLyB0aGUgYW5pbWF0aW9uIG9uIHRoaXMgZWxlbWVudC4uLlxuICAgICAgaWYgKGVsbVtSRU1PVkFMX0ZMQUddKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IG5hbWVzcGFjZXMgPSB0aGlzLl9lbmdpbmUuZmV0Y2hOYW1lc3BhY2VzQnlFbGVtZW50KGVsbSk7XG4gICAgICBpZiAobmFtZXNwYWNlcy5zaXplKSB7XG4gICAgICAgIG5hbWVzcGFjZXMuZm9yRWFjaChucyA9PiBucy50cmlnZ2VyTGVhdmVBbmltYXRpb24oZWxtLCBjb250ZXh0LCBmYWxzZSwgdHJ1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jbGVhckVsZW1lbnRDYWNoZShlbG0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSWYgdGhlIGNoaWxkIGVsZW1lbnRzIHdlcmUgcmVtb3ZlZCBhbG9uZyB3aXRoIHRoZSBwYXJlbnQsIHRoZWlyIGFuaW1hdGlvbnMgbWlnaHQgbm90XG4gICAgLy8gaGF2ZSBjb21wbGV0ZWQuIENsZWFyIGFsbCB0aGUgZWxlbWVudHMgZnJvbSB0aGUgY2FjaGUgc28gd2UgZG9uJ3QgZW5kIHVwIHdpdGggYSBtZW1vcnkgbGVhay5cbiAgICB0aGlzLl9lbmdpbmUuYWZ0ZXJGbHVzaEFuaW1hdGlvbnNEb25lKFxuICAgICAgICAoKSA9PiBlbGVtZW50cy5mb3JFYWNoKGVsbSA9PiB0aGlzLmNsZWFyRWxlbWVudENhY2hlKGVsbSkpKTtcbiAgfVxuXG4gIHRyaWdnZXJMZWF2ZUFuaW1hdGlvbihcbiAgICAgIGVsZW1lbnQ6IGFueSwgY29udGV4dDogYW55LCBkZXN0cm95QWZ0ZXJDb21wbGV0ZT86IGJvb2xlYW4sXG4gICAgICBkZWZhdWx0VG9GYWxsYmFjaz86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICBjb25zdCB0cmlnZ2VyU3RhdGVzID0gdGhpcy5fZW5naW5lLnN0YXRlc0J5RWxlbWVudC5nZXQoZWxlbWVudCk7XG4gICAgY29uc3QgcHJldmlvdXNUcmlnZ2Vyc1ZhbHVlcyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gICAgaWYgKHRyaWdnZXJTdGF0ZXMpIHtcbiAgICAgIGNvbnN0IHBsYXllcnM6IFRyYW5zaXRpb25BbmltYXRpb25QbGF5ZXJbXSA9IFtdO1xuICAgICAgdHJpZ2dlclN0YXRlcy5mb3JFYWNoKChzdGF0ZSwgdHJpZ2dlck5hbWUpID0+IHtcbiAgICAgICAgcHJldmlvdXNUcmlnZ2Vyc1ZhbHVlcy5zZXQodHJpZ2dlck5hbWUsIHN0YXRlLnZhbHVlKTtcbiAgICAgICAgLy8gdGhpcyBjaGVjayBpcyBoZXJlIGluIHRoZSBldmVudCB0aGF0IGFuIGVsZW1lbnQgaXMgcmVtb3ZlZFxuICAgICAgICAvLyB0d2ljZSAoYm90aCBvbiB0aGUgaG9zdCBsZXZlbCBhbmQgdGhlIGNvbXBvbmVudCBsZXZlbClcbiAgICAgICAgaWYgKHRoaXMuX3RyaWdnZXJzLmhhcyh0cmlnZ2VyTmFtZSkpIHtcbiAgICAgICAgICBjb25zdCBwbGF5ZXIgPSB0aGlzLnRyaWdnZXIoZWxlbWVudCwgdHJpZ2dlck5hbWUsIFZPSURfVkFMVUUsIGRlZmF1bHRUb0ZhbGxiYWNrKTtcbiAgICAgICAgICBpZiAocGxheWVyKSB7XG4gICAgICAgICAgICBwbGF5ZXJzLnB1c2gocGxheWVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAocGxheWVycy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5fZW5naW5lLm1hcmtFbGVtZW50QXNSZW1vdmVkKHRoaXMuaWQsIGVsZW1lbnQsIHRydWUsIGNvbnRleHQsIHByZXZpb3VzVHJpZ2dlcnNWYWx1ZXMpO1xuICAgICAgICBpZiAoZGVzdHJveUFmdGVyQ29tcGxldGUpIHtcbiAgICAgICAgICBvcHRpbWl6ZUdyb3VwUGxheWVyKHBsYXllcnMpLm9uRG9uZSgoKSA9PiB0aGlzLl9lbmdpbmUucHJvY2Vzc0xlYXZlTm9kZShlbGVtZW50KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByZXBhcmVMZWF2ZUFuaW1hdGlvbkxpc3RlbmVycyhlbGVtZW50OiBhbnkpIHtcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9lbGVtZW50TGlzdGVuZXJzLmdldChlbGVtZW50KTtcbiAgICBjb25zdCBlbGVtZW50U3RhdGVzID0gdGhpcy5fZW5naW5lLnN0YXRlc0J5RWxlbWVudC5nZXQoZWxlbWVudCk7XG5cbiAgICAvLyBpZiB0aGlzIHN0YXRlbWVudCBmYWlscyB0aGVuIGl0IG1lYW5zIHRoYXQgdGhlIGVsZW1lbnQgd2FzIHBpY2tlZCB1cFxuICAgIC8vIGJ5IGFuIGVhcmxpZXIgZmx1c2ggKG9yIHRoZXJlIGFyZSBubyBsaXN0ZW5lcnMgYXQgYWxsIHRvIHRyYWNrIHRoZSBsZWF2ZSkuXG4gICAgaWYgKGxpc3RlbmVycyAmJiBlbGVtZW50U3RhdGVzKSB7XG4gICAgICBjb25zdCB2aXNpdGVkVHJpZ2dlcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IHtcbiAgICAgICAgY29uc3QgdHJpZ2dlck5hbWUgPSBsaXN0ZW5lci5uYW1lO1xuICAgICAgICBpZiAodmlzaXRlZFRyaWdnZXJzLmhhcyh0cmlnZ2VyTmFtZSkpIHJldHVybjtcbiAgICAgICAgdmlzaXRlZFRyaWdnZXJzLmFkZCh0cmlnZ2VyTmFtZSk7XG5cbiAgICAgICAgY29uc3QgdHJpZ2dlciA9IHRoaXMuX3RyaWdnZXJzLmdldCh0cmlnZ2VyTmFtZSkhO1xuICAgICAgICBjb25zdCB0cmFuc2l0aW9uID0gdHJpZ2dlci5mYWxsYmFja1RyYW5zaXRpb247XG4gICAgICAgIGNvbnN0IGZyb21TdGF0ZSA9IGVsZW1lbnRTdGF0ZXMuZ2V0KHRyaWdnZXJOYW1lKSB8fCBERUZBVUxUX1NUQVRFX1ZBTFVFO1xuICAgICAgICBjb25zdCB0b1N0YXRlID0gbmV3IFN0YXRlVmFsdWUoVk9JRF9WQUxVRSk7XG4gICAgICAgIGNvbnN0IHBsYXllciA9IG5ldyBUcmFuc2l0aW9uQW5pbWF0aW9uUGxheWVyKHRoaXMuaWQsIHRyaWdnZXJOYW1lLCBlbGVtZW50KTtcblxuICAgICAgICB0aGlzLl9lbmdpbmUudG90YWxRdWV1ZWRQbGF5ZXJzKys7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2goe1xuICAgICAgICAgIGVsZW1lbnQsXG4gICAgICAgICAgdHJpZ2dlck5hbWUsXG4gICAgICAgICAgdHJhbnNpdGlvbixcbiAgICAgICAgICBmcm9tU3RhdGUsXG4gICAgICAgICAgdG9TdGF0ZSxcbiAgICAgICAgICBwbGF5ZXIsXG4gICAgICAgICAgaXNGYWxsYmFja1RyYW5zaXRpb246IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZW1vdmVOb2RlKGVsZW1lbnQ6IGFueSwgY29udGV4dDogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZW5naW5lID0gdGhpcy5fZW5naW5lO1xuICAgIGlmIChlbGVtZW50LmNoaWxkRWxlbWVudENvdW50KSB7XG4gICAgICB0aGlzLl9zaWduYWxSZW1vdmFsRm9ySW5uZXJUcmlnZ2VycyhlbGVtZW50LCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyB0aGlzIG1lYW5zIHRoYXQgYSAqID0+IFZPSUQgYW5pbWF0aW9uIHdhcyBkZXRlY3RlZCBhbmQga2lja2VkIG9mZlxuICAgIGlmICh0aGlzLnRyaWdnZXJMZWF2ZUFuaW1hdGlvbihlbGVtZW50LCBjb250ZXh0LCB0cnVlKSkgcmV0dXJuO1xuXG4gICAgLy8gZmluZCB0aGUgcGxheWVyIHRoYXQgaXMgYW5pbWF0aW5nIGFuZCBtYWtlIHN1cmUgdGhhdCB0aGVcbiAgICAvLyByZW1vdmFsIGlzIGRlbGF5ZWQgdW50aWwgdGhhdCBwbGF5ZXIgaGFzIGNvbXBsZXRlZFxuICAgIGxldCBjb250YWluc1BvdGVudGlhbFBhcmVudFRyYW5zaXRpb24gPSBmYWxzZTtcbiAgICBpZiAoZW5naW5lLnRvdGFsQW5pbWF0aW9ucykge1xuICAgICAgY29uc3QgY3VycmVudFBsYXllcnMgPVxuICAgICAgICAgIGVuZ2luZS5wbGF5ZXJzLmxlbmd0aCA/IGVuZ2luZS5wbGF5ZXJzQnlRdWVyaWVkRWxlbWVudC5nZXQoZWxlbWVudCkgOiBbXTtcblxuICAgICAgLy8gd2hlbiB0aGlzIGBpZiBzdGF0ZW1lbnRgIGRvZXMgbm90IGNvbnRpbnVlIGZvcndhcmQgaXQgbWVhbnMgdGhhdFxuICAgICAgLy8gYSBwcmV2aW91cyBhbmltYXRpb24gcXVlcnkgaGFzIHNlbGVjdGVkIHRoZSBjdXJyZW50IGVsZW1lbnQgYW5kXG4gICAgICAvLyBpcyBhbmltYXRpbmcgaXQuIEluIHRoaXMgc2l0dWF0aW9uIHdhbnQgdG8gY29udGludWUgZm9yd2FyZHMgYW5kXG4gICAgICAvLyBhbGxvdyB0aGUgZWxlbWVudCB0byBiZSBxdWV1ZWQgdXAgZm9yIGFuaW1hdGlvbiBsYXRlci5cbiAgICAgIGlmIChjdXJyZW50UGxheWVycyAmJiBjdXJyZW50UGxheWVycy5sZW5ndGgpIHtcbiAgICAgICAgY29udGFpbnNQb3RlbnRpYWxQYXJlbnRUcmFuc2l0aW9uID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBwYXJlbnQgPSBlbGVtZW50O1xuICAgICAgICB3aGlsZSAocGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICBjb25zdCB0cmlnZ2VycyA9IGVuZ2luZS5zdGF0ZXNCeUVsZW1lbnQuZ2V0KHBhcmVudCk7XG4gICAgICAgICAgaWYgKHRyaWdnZXJzKSB7XG4gICAgICAgICAgICBjb250YWluc1BvdGVudGlhbFBhcmVudFRyYW5zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gYXQgdGhpcyBzdGFnZSB3ZSBrbm93IHRoYXQgdGhlIGVsZW1lbnQgd2lsbCBlaXRoZXIgZ2V0IHJlbW92ZWRcbiAgICAvLyBkdXJpbmcgZmx1c2ggb3Igd2lsbCBiZSBwaWNrZWQgdXAgYnkgYSBwYXJlbnQgcXVlcnkuIEVpdGhlciB3YXlcbiAgICAvLyB3ZSBuZWVkIHRvIGZpcmUgdGhlIGxpc3RlbmVycyBmb3IgdGhpcyBlbGVtZW50IHdoZW4gaXQgRE9FUyBnZXRcbiAgICAvLyByZW1vdmVkIChvbmNlIHRoZSBxdWVyeSBwYXJlbnQgYW5pbWF0aW9uIGlzIGRvbmUgb3IgYWZ0ZXIgZmx1c2gpXG4gICAgdGhpcy5wcmVwYXJlTGVhdmVBbmltYXRpb25MaXN0ZW5lcnMoZWxlbWVudCk7XG5cbiAgICAvLyB3aGV0aGVyIG9yIG5vdCBhIHBhcmVudCBoYXMgYW4gYW5pbWF0aW9uIHdlIG5lZWQgdG8gZGVsYXkgdGhlIGRlZmVycmFsIG9mIHRoZSBsZWF2ZVxuICAgIC8vIG9wZXJhdGlvbiB1bnRpbCB3ZSBoYXZlIG1vcmUgaW5mb3JtYXRpb24gKHdoaWNoIHdlIGRvIGFmdGVyIGZsdXNoKCkgaGFzIGJlZW4gY2FsbGVkKVxuICAgIGlmIChjb250YWluc1BvdGVudGlhbFBhcmVudFRyYW5zaXRpb24pIHtcbiAgICAgIGVuZ2luZS5tYXJrRWxlbWVudEFzUmVtb3ZlZCh0aGlzLmlkLCBlbGVtZW50LCBmYWxzZSwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlbW92YWxGbGFnID0gZWxlbWVudFtSRU1PVkFMX0ZMQUddO1xuICAgICAgaWYgKCFyZW1vdmFsRmxhZyB8fCByZW1vdmFsRmxhZyA9PT0gTlVMTF9SRU1PVkFMX1NUQVRFKSB7XG4gICAgICAgIC8vIHdlIGRvIHRoaXMgYWZ0ZXIgdGhlIGZsdXNoIGhhcyBvY2N1cnJlZCBzdWNoXG4gICAgICAgIC8vIHRoYXQgdGhlIGNhbGxiYWNrcyBjYW4gYmUgZmlyZWRcbiAgICAgICAgZW5naW5lLmFmdGVyRmx1c2goKCkgPT4gdGhpcy5jbGVhckVsZW1lbnRDYWNoZShlbGVtZW50KSk7XG4gICAgICAgIGVuZ2luZS5kZXN0cm95SW5uZXJBbmltYXRpb25zKGVsZW1lbnQpO1xuICAgICAgICBlbmdpbmUuX29uUmVtb3ZhbENvbXBsZXRlKGVsZW1lbnQsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGluc2VydE5vZGUoZWxlbWVudDogYW55LCBwYXJlbnQ6IGFueSk6IHZvaWQge1xuICAgIGFkZENsYXNzKGVsZW1lbnQsIHRoaXMuX2hvc3RDbGFzc05hbWUpO1xuICB9XG5cbiAgZHJhaW5RdWV1ZWRUcmFuc2l0aW9ucyhtaWNyb3Rhc2tJZDogbnVtYmVyKTogUXVldWVJbnN0cnVjdGlvbltdIHtcbiAgICBjb25zdCBpbnN0cnVjdGlvbnM6IFF1ZXVlSW5zdHJ1Y3Rpb25bXSA9IFtdO1xuICAgIHRoaXMuX3F1ZXVlLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgY29uc3QgcGxheWVyID0gZW50cnkucGxheWVyO1xuICAgICAgaWYgKHBsYXllci5kZXN0cm95ZWQpIHJldHVybjtcblxuICAgICAgY29uc3QgZWxlbWVudCA9IGVudHJ5LmVsZW1lbnQ7XG4gICAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9lbGVtZW50TGlzdGVuZXJzLmdldChlbGVtZW50KTtcbiAgICAgIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBUcmlnZ2VyTGlzdGVuZXIpID0+IHtcbiAgICAgICAgICBpZiAobGlzdGVuZXIubmFtZSA9PSBlbnRyeS50cmlnZ2VyTmFtZSkge1xuICAgICAgICAgICAgY29uc3QgYmFzZUV2ZW50ID0gbWFrZUFuaW1hdGlvbkV2ZW50KFxuICAgICAgICAgICAgICAgIGVsZW1lbnQsIGVudHJ5LnRyaWdnZXJOYW1lLCBlbnRyeS5mcm9tU3RhdGUudmFsdWUsIGVudHJ5LnRvU3RhdGUudmFsdWUpO1xuICAgICAgICAgICAgKGJhc2VFdmVudCBhcyBhbnkpWydfZGF0YSddID0gbWljcm90YXNrSWQ7XG4gICAgICAgICAgICBsaXN0ZW5PblBsYXllcihlbnRyeS5wbGF5ZXIsIGxpc3RlbmVyLnBoYXNlLCBiYXNlRXZlbnQsIGxpc3RlbmVyLmNhbGxiYWNrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAocGxheWVyLm1hcmtlZEZvckRlc3Ryb3kpIHtcbiAgICAgICAgdGhpcy5fZW5naW5lLmFmdGVyRmx1c2goKCkgPT4ge1xuICAgICAgICAgIC8vIG5vdyB3ZSBjYW4gZGVzdHJveSB0aGUgZWxlbWVudCBwcm9wZXJseSBzaW5jZSB0aGUgZXZlbnQgbGlzdGVuZXJzIGhhdmVcbiAgICAgICAgICAvLyBiZWVuIGJvdW5kIHRvIHRoZSBwbGF5ZXJcbiAgICAgICAgICBwbGF5ZXIuZGVzdHJveSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluc3RydWN0aW9ucy5wdXNoKGVudHJ5KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuX3F1ZXVlID0gW107XG5cbiAgICByZXR1cm4gaW5zdHJ1Y3Rpb25zLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIC8vIGlmIGRlcENvdW50ID09IDAgdGhlbSBtb3ZlIHRvIGZyb250XG4gICAgICAvLyBvdGhlcndpc2UgaWYgYSBjb250YWlucyBiIHRoZW4gbW92ZSBiYWNrXG4gICAgICBjb25zdCBkMCA9IGEudHJhbnNpdGlvbi5hc3QuZGVwQ291bnQ7XG4gICAgICBjb25zdCBkMSA9IGIudHJhbnNpdGlvbi5hc3QuZGVwQ291bnQ7XG4gICAgICBpZiAoZDAgPT0gMCB8fCBkMSA9PSAwKSB7XG4gICAgICAgIHJldHVybiBkMCAtIGQxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2VuZ2luZS5kcml2ZXIuY29udGFpbnNFbGVtZW50KGEuZWxlbWVudCwgYi5lbGVtZW50KSA/IDEgOiAtMTtcbiAgICB9KTtcbiAgfVxuXG4gIGRlc3Ryb3koY29udGV4dDogYW55KSB7XG4gICAgdGhpcy5wbGF5ZXJzLmZvckVhY2gocCA9PiBwLmRlc3Ryb3koKSk7XG4gICAgdGhpcy5fc2lnbmFsUmVtb3ZhbEZvcklubmVyVHJpZ2dlcnModGhpcy5ob3N0RWxlbWVudCwgY29udGV4dCk7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBRdWV1ZWRUcmFuc2l0aW9uIHtcbiAgZWxlbWVudDogYW55O1xuICBpbnN0cnVjdGlvbjogQW5pbWF0aW9uVHJhbnNpdGlvbkluc3RydWN0aW9uO1xuICBwbGF5ZXI6IFRyYW5zaXRpb25BbmltYXRpb25QbGF5ZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBUcmFuc2l0aW9uQW5pbWF0aW9uRW5naW5lIHtcbiAgcHVibGljIHBsYXllcnM6IFRyYW5zaXRpb25BbmltYXRpb25QbGF5ZXJbXSA9IFtdO1xuICBwdWJsaWMgbmV3SG9zdEVsZW1lbnRzID0gbmV3IE1hcDxhbnksIEFuaW1hdGlvblRyYW5zaXRpb25OYW1lc3BhY2U+KCk7XG4gIHB1YmxpYyBwbGF5ZXJzQnlFbGVtZW50ID0gbmV3IE1hcDxhbnksIFRyYW5zaXRpb25BbmltYXRpb25QbGF5ZXJbXT4oKTtcbiAgcHVibGljIHBsYXllcnNCeVF1ZXJpZWRFbGVtZW50ID0gbmV3IE1hcDxhbnksIFRyYW5zaXRpb25BbmltYXRpb25QbGF5ZXJbXT4oKTtcbiAgcHVibGljIHN0YXRlc0J5RWxlbWVudCA9IG5ldyBNYXA8YW55LCBNYXA8c3RyaW5nLCBTdGF0ZVZhbHVlPj4oKTtcbiAgcHVibGljIGRpc2FibGVkTm9kZXMgPSBuZXcgU2V0PGFueT4oKTtcblxuICBwdWJsaWMgdG90YWxBbmltYXRpb25zID0gMDtcbiAgcHVibGljIHRvdGFsUXVldWVkUGxheWVycyA9IDA7XG5cbiAgcHJpdmF0ZSBfbmFtZXNwYWNlTG9va3VwOiB7W2lkOiBzdHJpbmddOiBBbmltYXRpb25UcmFuc2l0aW9uTmFtZXNwYWNlfSA9IHt9O1xuICBwcml2YXRlIF9uYW1lc3BhY2VMaXN0OiBBbmltYXRpb25UcmFuc2l0aW9uTmFtZXNwYWNlW10gPSBbXTtcbiAgcHJpdmF0ZSBfZmx1c2hGbnM6ICgoKSA9PiBhbnkpW10gPSBbXTtcbiAgcHJpdmF0ZSBfd2hlblF1aWV0Rm5zOiAoKCkgPT4gYW55KVtdID0gW107XG5cbiAgcHVibGljIG5hbWVzcGFjZXNCeUhvc3RFbGVtZW50ID0gbmV3IE1hcDxhbnksIEFuaW1hdGlvblRyYW5zaXRpb25OYW1lc3BhY2U+KCk7XG4gIHB1YmxpYyBjb2xsZWN0ZWRFbnRlckVsZW1lbnRzOiBhbnlbXSA9IFtdO1xuICBwdWJsaWMgY29sbGVjdGVkTGVhdmVFbGVtZW50czogYW55W10gPSBbXTtcblxuICAvLyB0aGlzIG1ldGhvZCBpcyBkZXNpZ25lZCB0byBiZSBvdmVycmlkZGVuIGJ5IHRoZSBjb2RlIHRoYXQgdXNlcyB0aGlzIGVuZ2luZVxuICBwdWJsaWMgb25SZW1vdmFsQ29tcGxldGUgPSAoZWxlbWVudDogYW55LCBjb250ZXh0OiBhbnkpID0+IHt9O1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX29uUmVtb3ZhbENvbXBsZXRlKGVsZW1lbnQ6IGFueSwgY29udGV4dDogYW55KSB7XG4gICAgdGhpcy5vblJlbW92YWxDb21wbGV0ZShlbGVtZW50LCBjb250ZXh0KTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGJvZHlOb2RlOiBhbnksIHB1YmxpYyBkcml2ZXI6IEFuaW1hdGlvbkRyaXZlcixcbiAgICAgIHByaXZhdGUgX25vcm1hbGl6ZXI6IEFuaW1hdGlvblN0eWxlTm9ybWFsaXplcikge31cblxuICBnZXQgcXVldWVkUGxheWVycygpOiBUcmFuc2l0aW9uQW5pbWF0aW9uUGxheWVyW10ge1xuICAgIGNvbnN0IHBsYXllcnM6IFRyYW5zaXRpb25BbmltYXRpb25QbGF5ZXJbXSA9IFtdO1xuICAgIHRoaXMuX25hbWVzcGFjZUxpc3QuZm9yRWFjaChucyA9PiB7XG4gICAgICBucy5wbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgaWYgKHBsYXllci5xdWV1ZWQpIHtcbiAgICAgICAgICBwbGF5ZXJzLnB1c2gocGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHBsYXllcnM7XG4gIH1cblxuICBjcmVhdGVOYW1lc3BhY2UobmFtZXNwYWNlSWQ6IHN0cmluZywgaG9zdEVsZW1lbnQ6IGFueSkge1xuICAgIGNvbnN0IG5zID0gbmV3IEFuaW1hdGlvblRyYW5zaXRpb25OYW1lc3BhY2UobmFtZXNwYWNlSWQsIGhvc3RFbGVtZW50LCB0aGlzKTtcbiAgICBpZiAodGhpcy5ib2R5Tm9kZSAmJiB0aGlzLmRyaXZlci5jb250YWluc0VsZW1lbnQodGhpcy5ib2R5Tm9kZSwgaG9zdEVsZW1lbnQpKSB7XG4gICAgICB0aGlzLl9iYWxhbmNlTmFtZXNwYWNlTGlzdChucywgaG9zdEVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBkZWZlciB0aGlzIGxhdGVyIHVudGlsIGZsdXNoIGR1cmluZyB3aGVuIHRoZSBob3N0IGVsZW1lbnQgaGFzXG4gICAgICAvLyBiZWVuIGluc2VydGVkIHNvIHRoYXQgd2Uga25vdyBleGFjdGx5IHdoZXJlIHRvIHBsYWNlIGl0IGluXG4gICAgICAvLyB0aGUgbmFtZXNwYWNlIGxpc3RcbiAgICAgIHRoaXMubmV3SG9zdEVsZW1lbnRzLnNldChob3N0RWxlbWVudCwgbnMpO1xuXG4gICAgICAvLyBnaXZlbiB0aGF0IHRoaXMgaG9zdCBlbGVtZW50IGlzIGEgcGFydCBvZiB0aGUgYW5pbWF0aW9uIGNvZGUsIGl0XG4gICAgICAvLyBtYXkgb3IgbWF5IG5vdCBiZSBpbnNlcnRlZCBieSBhIHBhcmVudCBub2RlIHRoYXQgaXMgb2YgYW5cbiAgICAgIC8vIGFuaW1hdGlvbiByZW5kZXJlciB0eXBlLiBJZiB0aGlzIGhhcHBlbnMgdGhlbiB3ZSBjYW4gc3RpbGwgaGF2ZVxuICAgICAgLy8gYWNjZXNzIHRvIHRoaXMgaXRlbSB3aGVuIHdlIHF1ZXJ5IGZvciA6ZW50ZXIgbm9kZXMuIElmIHRoZSBwYXJlbnRcbiAgICAgIC8vIGlzIGEgcmVuZGVyZXIgdGhlbiB0aGUgc2V0IGRhdGEtc3RydWN0dXJlIHdpbGwgbm9ybWFsaXplIHRoZSBlbnRyeVxuICAgICAgdGhpcy5jb2xsZWN0RW50ZXJFbGVtZW50KGhvc3RFbGVtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX25hbWVzcGFjZUxvb2t1cFtuYW1lc3BhY2VJZF0gPSBucztcbiAgfVxuXG4gIHByaXZhdGUgX2JhbGFuY2VOYW1lc3BhY2VMaXN0KG5zOiBBbmltYXRpb25UcmFuc2l0aW9uTmFtZXNwYWNlLCBob3N0RWxlbWVudDogYW55KSB7XG4gICAgY29uc3QgbmFtZXNwYWNlTGlzdCA9IHRoaXMuX25hbWVzcGFjZUxpc3Q7XG4gICAgY29uc3QgbmFtZXNwYWNlc0J5SG9zdEVsZW1lbnQgPSB0aGlzLm5hbWVzcGFjZXNCeUhvc3RFbGVtZW50O1xuICAgIGNvbnN0IGxpbWl0ID0gbmFtZXNwYWNlTGlzdC5sZW5ndGggLSAxO1xuICAgIGlmIChsaW1pdCA+PSAwKSB7XG4gICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgIC8vIEZpbmQgdGhlIGNsb3Nlc3QgYW5jZXN0b3Igd2l0aCBhbiBleGlzdGluZyBuYW1lc3BhY2Ugc28gd2UgY2FuIHRoZW4gaW5zZXJ0IGBuc2AgYWZ0ZXIgaXQsXG4gICAgICAvLyBlc3RhYmxpc2hpbmcgYSB0b3AtZG93biBvcmRlcmluZyBvZiBuYW1lc3BhY2VzIGluIGB0aGlzLl9uYW1lc3BhY2VMaXN0YC5cbiAgICAgIGxldCBhbmNlc3RvciA9IHRoaXMuZHJpdmVyLmdldFBhcmVudEVsZW1lbnQoaG9zdEVsZW1lbnQpO1xuICAgICAgd2hpbGUgKGFuY2VzdG9yKSB7XG4gICAgICAgIGNvbnN0IGFuY2VzdG9yTnMgPSBuYW1lc3BhY2VzQnlIb3N0RWxlbWVudC5nZXQoYW5jZXN0b3IpO1xuICAgICAgICBpZiAoYW5jZXN0b3JOcykge1xuICAgICAgICAgIC8vIEFuIGFuaW1hdGlvbiBuYW1lc3BhY2UgaGFzIGJlZW4gcmVnaXN0ZXJlZCBmb3IgdGhpcyBhbmNlc3Rvciwgc28gd2UgaW5zZXJ0IGBuc2BcbiAgICAgICAgICAvLyByaWdodCBhZnRlciBpdCB0byBlc3RhYmxpc2ggdG9wLWRvd24gb3JkZXJpbmcgb2YgYW5pbWF0aW9uIG5hbWVzcGFjZXMuXG4gICAgICAgICAgY29uc3QgaW5kZXggPSBuYW1lc3BhY2VMaXN0LmluZGV4T2YoYW5jZXN0b3JOcyk7XG4gICAgICAgICAgbmFtZXNwYWNlTGlzdC5zcGxpY2UoaW5kZXggKyAxLCAwLCBucyk7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGFuY2VzdG9yID0gdGhpcy5kcml2ZXIuZ2V0UGFyZW50RWxlbWVudChhbmNlc3Rvcik7XG4gICAgICB9XG4gICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIC8vIE5vIG5hbWVzcGFjZSBleGlzdHMgdGhhdCBpcyBhbiBhbmNlc3RvciBvZiBgbnNgLCBzbyBgbnNgIGlzIGluc2VydGVkIGF0IHRoZSBmcm9udCB0b1xuICAgICAgICAvLyBlbnN1cmUgdGhhdCBhbnkgZXhpc3RpbmcgZGVzY2VuZGFudHMgYXJlIG9yZGVyZWQgYWZ0ZXIgYG5zYCwgcmV0YWluaW5nIHRoZSBkZXNpcmVkXG4gICAgICAgIC8vIHRvcC1kb3duIG9yZGVyaW5nLlxuICAgICAgICBuYW1lc3BhY2VMaXN0LnVuc2hpZnQobnMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lc3BhY2VMaXN0LnB1c2gobnMpO1xuICAgIH1cblxuICAgIG5hbWVzcGFjZXNCeUhvc3RFbGVtZW50LnNldChob3N0RWxlbWVudCwgbnMpO1xuICAgIHJldHVybiBucztcbiAgfVxuXG4gIHJlZ2lzdGVyKG5hbWVzcGFjZUlkOiBzdHJpbmcsIGhvc3RFbGVtZW50OiBhbnkpIHtcbiAgICBsZXQgbnMgPSB0aGlzLl9uYW1lc3BhY2VMb29rdXBbbmFtZXNwYWNlSWRdO1xuICAgIGlmICghbnMpIHtcbiAgICAgIG5zID0gdGhpcy5jcmVhdGVOYW1lc3BhY2UobmFtZXNwYWNlSWQsIGhvc3RFbGVtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIG5zO1xuICB9XG5cbiAgcmVnaXN0ZXJUcmlnZ2VyKG5hbWVzcGFjZUlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgdHJpZ2dlcjogQW5pbWF0aW9uVHJpZ2dlcikge1xuICAgIGxldCBucyA9IHRoaXMuX25hbWVzcGFjZUxvb2t1cFtuYW1lc3BhY2VJZF07XG4gICAgaWYgKG5zICYmIG5zLnJlZ2lzdGVyKG5hbWUsIHRyaWdnZXIpKSB7XG4gICAgICB0aGlzLnRvdGFsQW5pbWF0aW9ucysrO1xuICAgIH1cbiAgfVxuXG4gIGRlc3Ryb3kobmFtZXNwYWNlSWQ6IHN0cmluZywgY29udGV4dDogYW55KSB7XG4gICAgaWYgKCFuYW1lc3BhY2VJZCkgcmV0dXJuO1xuICAgIHRoaXMuYWZ0ZXJGbHVzaCgoKSA9PiB7fSk7XG5cbiAgICB0aGlzLmFmdGVyRmx1c2hBbmltYXRpb25zRG9uZSgoKSA9PiB7XG4gICAgICBjb25zdCBucyA9IHRoaXMuX2ZldGNoTmFtZXNwYWNlKG5hbWVzcGFjZUlkKTtcbiAgICAgIHRoaXMubmFtZXNwYWNlc0J5SG9zdEVsZW1lbnQuZGVsZXRlKG5zLmhvc3RFbGVtZW50KTtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fbmFtZXNwYWNlTGlzdC5pbmRleE9mKG5zKTtcbiAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIHRoaXMuX25hbWVzcGFjZUxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH1cbiAgICAgIG5zLmRlc3Ryb3koY29udGV4dCk7XG4gICAgICBkZWxldGUgdGhpcy5fbmFtZXNwYWNlTG9va3VwW25hbWVzcGFjZUlkXTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX2ZldGNoTmFtZXNwYWNlKGlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlTG9va3VwW2lkXTtcbiAgfVxuXG4gIGZldGNoTmFtZXNwYWNlc0J5RWxlbWVudChlbGVtZW50OiBhbnkpOiBTZXQ8QW5pbWF0aW9uVHJhbnNpdGlvbk5hbWVzcGFjZT4ge1xuICAgIC8vIG5vcm1hbGx5IHRoZXJlIHNob3VsZCBvbmx5IGJlIG9uZSBuYW1lc3BhY2UgcGVyIGVsZW1lbnQsIGhvd2V2ZXJcbiAgICAvLyBpZiBAdHJpZ2dlcnMgYXJlIHBsYWNlZCBvbiBib3RoIHRoZSBjb21wb25lbnQgZWxlbWVudCBhbmQgdGhlblxuICAgIC8vIGl0cyBob3N0IGVsZW1lbnQgKHdpdGhpbiB0aGUgY29tcG9uZW50IGNvZGUpIHRoZW4gdGhlcmUgd2lsbCBiZVxuICAgIC8vIHR3byBuYW1lc3BhY2VzIHJldHVybmVkLiBXZSB1c2UgYSBzZXQgaGVyZSB0byBzaW1wbHkgZGVkdXBsaWNhdGVcbiAgICAvLyB0aGUgbmFtZXNwYWNlcyBpbiBjYXNlIChmb3IgdGhlIHJlYXNvbiBkZXNjcmliZWQgYWJvdmUpIHRoZXJlIGFyZSBtdWx0aXBsZSB0cmlnZ2Vyc1xuICAgIGNvbnN0IG5hbWVzcGFjZXMgPSBuZXcgU2V0PEFuaW1hdGlvblRyYW5zaXRpb25OYW1lc3BhY2U+KCk7XG4gICAgY29uc3QgZWxlbWVudFN0YXRlcyA9IHRoaXMuc3RhdGVzQnlFbGVtZW50LmdldChlbGVtZW50KTtcbiAgICBpZiAoZWxlbWVudFN0YXRlcykge1xuICAgICAgZm9yIChsZXQgc3RhdGVWYWx1ZSBvZiBlbGVtZW50U3RhdGVzLnZhbHVlcygpKSB7XG4gICAgICAgIGlmIChzdGF0ZVZhbHVlLm5hbWVzcGFjZUlkKSB7XG4gICAgICAgICAgY29uc3QgbnMgPSB0aGlzLl9mZXRjaE5hbWVzcGFjZShzdGF0ZVZhbHVlLm5hbWVzcGFjZUlkKTtcbiAgICAgICAgICBpZiAobnMpIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZXMuYWRkKG5zKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzcGFjZXM7XG4gIH1cblxuICB0cmlnZ2VyKG5hbWVzcGFjZUlkOiBzdHJpbmcsIGVsZW1lbnQ6IGFueSwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gICAgaWYgKGlzRWxlbWVudE5vZGUoZWxlbWVudCkpIHtcbiAgICAgIGNvbnN0IG5zID0gdGhpcy5fZmV0Y2hOYW1lc3BhY2UobmFtZXNwYWNlSWQpO1xuICAgICAgaWYgKG5zKSB7XG4gICAgICAgIG5zLnRyaWdnZXIoZWxlbWVudCwgbmFtZSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaW5zZXJ0Tm9kZShuYW1lc3BhY2VJZDogc3RyaW5nLCBlbGVtZW50OiBhbnksIHBhcmVudDogYW55LCBpbnNlcnRCZWZvcmU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoIWlzRWxlbWVudE5vZGUoZWxlbWVudCkpIHJldHVybjtcblxuICAgIC8vIHNwZWNpYWwgY2FzZSBmb3Igd2hlbiBhbiBlbGVtZW50IGlzIHJlbW92ZWQgYW5kIHJlaW5zZXJ0ZWQgKG1vdmUgb3BlcmF0aW9uKVxuICAgIC8vIHdoZW4gdGhpcyBvY2N1cnMgd2UgZG8gbm90IHdhbnQgdG8gdXNlIHRoZSBlbGVtZW50IGZvciBkZWxldGlvbiBsYXRlclxuICAgIGNvbnN0IGRldGFpbHMgPSBlbGVtZW50W1JFTU9WQUxfRkxBR10gYXMgRWxlbWVudEFuaW1hdGlvblN0YXRlO1xuICAgIGlmIChkZXRhaWxzICYmIGRldGFpbHMuc2V0Rm9yUmVtb3ZhbCkge1xuICAgICAgZGV0YWlscy5zZXRGb3JSZW1vdmFsID0gZmFsc2U7XG4gICAgICBkZXRhaWxzLnNldEZvck1vdmUgPSB0cnVlO1xuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmNvbGxlY3RlZExlYXZlRWxlbWVudHMuaW5kZXhPZihlbGVtZW50KTtcbiAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIHRoaXMuY29sbGVjdGVkTGVhdmVFbGVtZW50cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGluIHRoZSBldmVudCB0aGF0IHRoZSBuYW1lc3BhY2VJZCBpcyBibGFuayB0aGVuIHRoZSBjYWxsZXJcbiAgICAvLyBjb2RlIGRvZXMgbm90IGNvbnRhaW4gYW55IGFuaW1hdGlvbiBjb2RlIGluIGl0LCBidXQgaXQgaXNcbiAgICAvLyBqdXN0IGJlaW5nIGNhbGxlZCBzbyB0aGF0IHRoZSBub2RlIGlzIG1hcmtlZCBhcyBiZWluZyBpbnNlcnRlZFxuICAgIGlmIChuYW1lc3BhY2VJZCkge1xuICAgICAgY29uc3QgbnMgPSB0aGlzLl9mZXRjaE5hbWVzcGFjZShuYW1lc3BhY2VJZCk7XG4gICAgICAvLyBUaGlzIGlmLXN0YXRlbWVudCBpcyBhIHdvcmthcm91bmQgZm9yIHJvdXRlciBpc3N1ZSAjMjE5NDcuXG4gICAgICAvLyBUaGUgcm91dGVyIHNvbWV0aW1lcyBoaXRzIGEgcmFjZSBjb25kaXRpb24gd2hlcmUgd2hpbGUgYSByb3V0ZVxuICAgICAgLy8gaXMgYmVpbmcgaW5zdGFudGlhdGVkIGEgbmV3IG5hdmlnYXRpb24gYXJyaXZlcywgdHJpZ2dlcmluZyBsZWF2ZVxuICAgICAgLy8gYW5pbWF0aW9uIG9mIERPTSB0aGF0IGhhcyBub3QgYmVlbiBmdWxseSBpbml0aWFsaXplZCwgdW50aWwgdGhpc1xuICAgICAgLy8gaXMgcmVzb2x2ZWQsIHdlIG5lZWQgdG8gaGFuZGxlIHRoZSBzY2VuYXJpbyB3aGVuIERPTSBpcyBub3QgaW4gYVxuICAgICAgLy8gY29uc2lzdGVudCBzdGF0ZSBkdXJpbmcgdGhlIGFuaW1hdGlvbi5cbiAgICAgIGlmIChucykge1xuICAgICAgICBucy5pbnNlcnROb2RlKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gb25seSAqZGlyZWN0aXZlcyBhbmQgaG9zdCBlbGVtZW50cyBhcmUgaW5zZXJ0ZWQgYmVmb3JlXG4gICAgaWYgKGluc2VydEJlZm9yZSkge1xuICAgICAgdGhpcy5jb2xsZWN0RW50ZXJFbGVtZW50KGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIGNvbGxlY3RFbnRlckVsZW1lbnQoZWxlbWVudDogYW55KSB7XG4gICAgdGhpcy5jb2xsZWN0ZWRFbnRlckVsZW1lbnRzLnB1c2goZWxlbWVudCk7XG4gIH1cblxuICBtYXJrRWxlbWVudEFzRGlzYWJsZWQoZWxlbWVudDogYW55LCB2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKCF0aGlzLmRpc2FibGVkTm9kZXMuaGFzKGVsZW1lbnQpKSB7XG4gICAgICAgIHRoaXMuZGlzYWJsZWROb2Rlcy5hZGQoZWxlbWVudCk7XG4gICAgICAgIGFkZENsYXNzKGVsZW1lbnQsIERJU0FCTEVEX0NMQVNTTkFNRSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLmRpc2FibGVkTm9kZXMuaGFzKGVsZW1lbnQpKSB7XG4gICAgICB0aGlzLmRpc2FibGVkTm9kZXMuZGVsZXRlKGVsZW1lbnQpO1xuICAgICAgcmVtb3ZlQ2xhc3MoZWxlbWVudCwgRElTQUJMRURfQ0xBU1NOQU1FKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmVOb2RlKG5hbWVzcGFjZUlkOiBzdHJpbmcsIGVsZW1lbnQ6IGFueSwgY29udGV4dDogYW55KTogdm9pZCB7XG4gICAgaWYgKGlzRWxlbWVudE5vZGUoZWxlbWVudCkpIHtcbiAgICAgIGNvbnN0IG5zID0gbmFtZXNwYWNlSWQgPyB0aGlzLl9mZXRjaE5hbWVzcGFjZShuYW1lc3BhY2VJZCkgOiBudWxsO1xuICAgICAgaWYgKG5zKSB7XG4gICAgICAgIG5zLnJlbW92ZU5vZGUoZWxlbWVudCwgY29udGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1hcmtFbGVtZW50QXNSZW1vdmVkKG5hbWVzcGFjZUlkLCBlbGVtZW50LCBmYWxzZSwgY29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGhvc3ROUyA9IHRoaXMubmFtZXNwYWNlc0J5SG9zdEVsZW1lbnQuZ2V0KGVsZW1lbnQpO1xuICAgICAgaWYgKGhvc3ROUyAmJiBob3N0TlMuaWQgIT09IG5hbWVzcGFjZUlkKSB7XG4gICAgICAgIGhvc3ROUy5yZW1vdmVOb2RlKGVsZW1lbnQsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9vblJlbW92YWxDb21wbGV0ZShlbGVtZW50LCBjb250ZXh0KTtcbiAgICB9XG4gIH1cblxuICBtYXJrRWxlbWVudEFzUmVtb3ZlZChcbiAgICAgIG5hbWVzcGFjZUlkOiBzdHJpbmcsIGVsZW1lbnQ6IGFueSwgaGFzQW5pbWF0aW9uPzogYm9vbGVhbiwgY29udGV4dD86IGFueSxcbiAgICAgIHByZXZpb3VzVHJpZ2dlcnNWYWx1ZXM/OiBNYXA8c3RyaW5nLCBzdHJpbmc+KSB7XG4gICAgdGhpcy5jb2xsZWN0ZWRMZWF2ZUVsZW1lbnRzLnB1c2goZWxlbWVudCk7XG4gICAgZWxlbWVudFtSRU1PVkFMX0ZMQUddID0ge1xuICAgICAgbmFtZXNwYWNlSWQsXG4gICAgICBzZXRGb3JSZW1vdmFsOiBjb250ZXh0LFxuICAgICAgaGFzQW5pbWF0aW9uLFxuICAgICAgcmVtb3ZlZEJlZm9yZVF1ZXJpZWQ6IGZhbHNlLFxuICAgICAgcHJldmlvdXNUcmlnZ2Vyc1ZhbHVlc1xuICAgIH07XG4gIH1cblxuICBsaXN0ZW4oXG4gICAgICBuYW1lc3BhY2VJZDogc3RyaW5nLCBlbGVtZW50OiBhbnksIG5hbWU6IHN0cmluZywgcGhhc2U6IHN0cmluZyxcbiAgICAgIGNhbGxiYWNrOiAoZXZlbnQ6IGFueSkgPT4gYm9vbGVhbik6ICgpID0+IGFueSB7XG4gICAgaWYgKGlzRWxlbWVudE5vZGUoZWxlbWVudCkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9mZXRjaE5hbWVzcGFjZShuYW1lc3BhY2VJZCkubGlzdGVuKGVsZW1lbnQsIG5hbWUsIHBoYXNlLCBjYWxsYmFjayk7XG4gICAgfVxuICAgIHJldHVybiAoKSA9PiB7fTtcbiAgfVxuXG4gIHByaXZhdGUgX2J1aWxkSW5zdHJ1Y3Rpb24oXG4gICAgICBlbnRyeTogUXVldWVJbnN0cnVjdGlvbiwgc3ViVGltZWxpbmVzOiBFbGVtZW50SW5zdHJ1Y3Rpb25NYXAsIGVudGVyQ2xhc3NOYW1lOiBzdHJpbmcsXG4gICAgICBsZWF2ZUNsYXNzTmFtZTogc3RyaW5nLCBza2lwQnVpbGRBc3Q/OiBib29sZWFuKSB7XG4gICAgcmV0dXJuIGVudHJ5LnRyYW5zaXRpb24uYnVpbGQoXG4gICAgICAgIHRoaXMuZHJpdmVyLCBlbnRyeS5lbGVtZW50LCBlbnRyeS5mcm9tU3RhdGUudmFsdWUsIGVudHJ5LnRvU3RhdGUudmFsdWUsIGVudGVyQ2xhc3NOYW1lLFxuICAgICAgICBsZWF2ZUNsYXNzTmFtZSwgZW50cnkuZnJvbVN0YXRlLm9wdGlvbnMsIGVudHJ5LnRvU3RhdGUub3B0aW9ucywgc3ViVGltZWxpbmVzLCBza2lwQnVpbGRBc3QpO1xuICB9XG5cbiAgZGVzdHJveUlubmVyQW5pbWF0aW9ucyhjb250YWluZXJFbGVtZW50OiBhbnkpIHtcbiAgICBsZXQgZWxlbWVudHMgPSB0aGlzLmRyaXZlci5xdWVyeShjb250YWluZXJFbGVtZW50LCBOR19UUklHR0VSX1NFTEVDVE9SLCB0cnVlKTtcbiAgICBlbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4gdGhpcy5kZXN0cm95QWN0aXZlQW5pbWF0aW9uc0ZvckVsZW1lbnQoZWxlbWVudCkpO1xuXG4gICAgaWYgKHRoaXMucGxheWVyc0J5UXVlcmllZEVsZW1lbnQuc2l6ZSA9PSAwKSByZXR1cm47XG5cbiAgICBlbGVtZW50cyA9IHRoaXMuZHJpdmVyLnF1ZXJ5KGNvbnRhaW5lckVsZW1lbnQsIE5HX0FOSU1BVElOR19TRUxFQ1RPUiwgdHJ1ZSk7XG4gICAgZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHRoaXMuZmluaXNoQWN0aXZlUXVlcmllZEFuaW1hdGlvbk9uRWxlbWVudChlbGVtZW50KSk7XG4gIH1cblxuICBkZXN0cm95QWN0aXZlQW5pbWF0aW9uc0ZvckVsZW1lbnQoZWxlbWVudDogYW55KSB7XG4gICAgY29uc3QgcGxheWVycyA9IHRoaXMucGxheWVyc0J5RWxlbWVudC5nZXQoZWxlbWVudCk7XG4gICAgaWYgKHBsYXllcnMpIHtcbiAgICAgIHBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAvLyBzcGVjaWFsIGNhc2UgZm9yIHdoZW4gYW4gZWxlbWVudCBpcyBzZXQgZm9yIGRlc3RydWN0aW9uLCBidXQgaGFzbid0IHN0YXJ0ZWQuXG4gICAgICAgIC8vIGluIHRoaXMgc2l0dWF0aW9uIHdlIHdhbnQgdG8gZGVsYXkgdGhlIGRlc3RydWN0aW9uIHVudGlsIHRoZSBmbHVzaCBvY2N1cnNcbiAgICAgICAgLy8gc28gdGhhdCBhbnkgZXZlbnQgbGlzdGVuZXJzIGF0dGFjaGVkIHRvIHRoZSBwbGF5ZXIgYXJlIHRyaWdnZXJlZC5cbiAgICAgICAgaWYgKHBsYXllci5xdWV1ZWQpIHtcbiAgICAgICAgICBwbGF5ZXIubWFya2VkRm9yRGVzdHJveSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGxheWVyLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZmluaXNoQWN0aXZlUXVlcmllZEFuaW1hdGlvbk9uRWxlbWVudChlbGVtZW50OiBhbnkpIHtcbiAgICBjb25zdCBwbGF5ZXJzID0gdGhpcy5wbGF5ZXJzQnlRdWVyaWVkRWxlbWVudC5nZXQoZWxlbWVudCk7XG4gICAgaWYgKHBsYXllcnMpIHtcbiAgICAgIHBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4gcGxheWVyLmZpbmlzaCgpKTtcbiAgICB9XG4gIH1cblxuICB3aGVuUmVuZGVyaW5nRG9uZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlID0+IHtcbiAgICAgIGlmICh0aGlzLnBsYXllcnMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBvcHRpbWl6ZUdyb3VwUGxheWVyKHRoaXMucGxheWVycykub25Eb25lKCgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcm9jZXNzTGVhdmVOb2RlKGVsZW1lbnQ6IGFueSkge1xuICAgIGNvbnN0IGRldGFpbHMgPSBlbGVtZW50W1JFTU9WQUxfRkxBR10gYXMgRWxlbWVudEFuaW1hdGlvblN0YXRlO1xuICAgIGlmIChkZXRhaWxzICYmIGRldGFpbHMuc2V0Rm9yUmVtb3ZhbCkge1xuICAgICAgLy8gdGhpcyB3aWxsIHByZXZlbnQgaXQgZnJvbSByZW1vdmluZyBpdCB0d2ljZVxuICAgICAgZWxlbWVudFtSRU1PVkFMX0ZMQUddID0gTlVMTF9SRU1PVkFMX1NUQVRFO1xuICAgICAgaWYgKGRldGFpbHMubmFtZXNwYWNlSWQpIHtcbiAgICAgICAgdGhpcy5kZXN0cm95SW5uZXJBbmltYXRpb25zKGVsZW1lbnQpO1xuICAgICAgICBjb25zdCBucyA9IHRoaXMuX2ZldGNoTmFtZXNwYWNlKGRldGFpbHMubmFtZXNwYWNlSWQpO1xuICAgICAgICBpZiAobnMpIHtcbiAgICAgICAgICBucy5jbGVhckVsZW1lbnRDYWNoZShlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fb25SZW1vdmFsQ29tcGxldGUoZWxlbWVudCwgZGV0YWlscy5zZXRGb3JSZW1vdmFsKTtcbiAgICB9XG5cbiAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3Q/LmNvbnRhaW5zKERJU0FCTEVEX0NMQVNTTkFNRSkpIHtcbiAgICAgIHRoaXMubWFya0VsZW1lbnRBc0Rpc2FibGVkKGVsZW1lbnQsIGZhbHNlKTtcbiAgICB9XG5cbiAgICB0aGlzLmRyaXZlci5xdWVyeShlbGVtZW50LCBESVNBQkxFRF9TRUxFQ1RPUiwgdHJ1ZSkuZm9yRWFjaChub2RlID0+IHtcbiAgICAgIHRoaXMubWFya0VsZW1lbnRBc0Rpc2FibGVkKG5vZGUsIGZhbHNlKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZsdXNoKG1pY3JvdGFza0lkOiBudW1iZXIgPSAtMSkge1xuICAgIGxldCBwbGF5ZXJzOiBBbmltYXRpb25QbGF5ZXJbXSA9IFtdO1xuICAgIGlmICh0aGlzLm5ld0hvc3RFbGVtZW50cy5zaXplKSB7XG4gICAgICB0aGlzLm5ld0hvc3RFbGVtZW50cy5mb3JFYWNoKChucywgZWxlbWVudCkgPT4gdGhpcy5fYmFsYW5jZU5hbWVzcGFjZUxpc3QobnMsIGVsZW1lbnQpKTtcbiAgICAgIHRoaXMubmV3SG9zdEVsZW1lbnRzLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudG90YWxBbmltYXRpb25zICYmIHRoaXMuY29sbGVjdGVkRW50ZXJFbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jb2xsZWN0ZWRFbnRlckVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGVsbSA9IHRoaXMuY29sbGVjdGVkRW50ZXJFbGVtZW50c1tpXTtcbiAgICAgICAgYWRkQ2xhc3MoZWxtLCBTVEFSX0NMQVNTTkFNRSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX25hbWVzcGFjZUxpc3QubGVuZ3RoICYmXG4gICAgICAgICh0aGlzLnRvdGFsUXVldWVkUGxheWVycyB8fCB0aGlzLmNvbGxlY3RlZExlYXZlRWxlbWVudHMubGVuZ3RoKSkge1xuICAgICAgY29uc3QgY2xlYW51cEZuczogRnVuY3Rpb25bXSA9IFtdO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGxheWVycyA9IHRoaXMuX2ZsdXNoQW5pbWF0aW9ucyhjbGVhbnVwRm5zLCBtaWNyb3Rhc2tJZCk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsZWFudXBGbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjbGVhbnVwRm5zW2ldKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbGxlY3RlZExlYXZlRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuY29sbGVjdGVkTGVhdmVFbGVtZW50c1tpXTtcbiAgICAgICAgdGhpcy5wcm9jZXNzTGVhdmVOb2RlKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudG90YWxRdWV1ZWRQbGF5ZXJzID0gMDtcbiAgICB0aGlzLmNvbGxlY3RlZEVudGVyRWxlbWVudHMubGVuZ3RoID0gMDtcbiAgICB0aGlzLmNvbGxlY3RlZExlYXZlRWxlbWVudHMubGVuZ3RoID0gMDtcbiAgICB0aGlzLl9mbHVzaEZucy5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgIHRoaXMuX2ZsdXNoRm5zID0gW107XG5cbiAgICBpZiAodGhpcy5fd2hlblF1aWV0Rm5zLmxlbmd0aCkge1xuICAgICAgLy8gd2UgbW92ZSB0aGVzZSBvdmVyIHRvIGEgdmFyaWFibGUgc28gdGhhdFxuICAgICAgLy8gaWYgYW55IG5ldyBjYWxsYmFja3MgYXJlIHJlZ2lzdGVyZWQgaW4gYW5vdGhlclxuICAgICAgLy8gZmx1c2ggdGhleSBkbyBub3QgcG9wdWxhdGUgdGhlIGV4aXN0aW5nIHNldFxuICAgICAgY29uc3QgcXVpZXRGbnMgPSB0aGlzLl93aGVuUXVpZXRGbnM7XG4gICAgICB0aGlzLl93aGVuUXVpZXRGbnMgPSBbXTtcblxuICAgICAgaWYgKHBsYXllcnMubGVuZ3RoKSB7XG4gICAgICAgIG9wdGltaXplR3JvdXBQbGF5ZXIocGxheWVycykub25Eb25lKCgpID0+IHtcbiAgICAgICAgICBxdWlldEZucy5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHF1aWV0Rm5zLmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVwb3J0RXJyb3IoZXJyb3JzOiBFcnJvcltdKSB7XG4gICAgdGhyb3cgdHJpZ2dlclRyYW5zaXRpb25zRmFpbGVkKGVycm9ycyk7XG4gIH1cblxuICBwcml2YXRlIF9mbHVzaEFuaW1hdGlvbnMoY2xlYW51cEZuczogRnVuY3Rpb25bXSwgbWljcm90YXNrSWQ6IG51bWJlcik6XG4gICAgICBUcmFuc2l0aW9uQW5pbWF0aW9uUGxheWVyW10ge1xuICAgIGNvbnN0IHN1YlRpbWVsaW5lcyA9IG5ldyBFbGVtZW50SW5zdHJ1Y3Rpb25NYXAoKTtcbiAgICBjb25zdCBza2lwcGVkUGxheWVyczogVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcltdID0gW107XG4gICAgY29uc3Qgc2tpcHBlZFBsYXllcnNNYXAgPSBuZXcgTWFwPGFueSwgQW5pbWF0aW9uUGxheWVyW10+KCk7XG4gICAgY29uc3QgcXVldWVkSW5zdHJ1Y3Rpb25zOiBRdWV1ZWRUcmFuc2l0aW9uW10gPSBbXTtcbiAgICBjb25zdCBxdWVyaWVkRWxlbWVudHMgPSBuZXcgTWFwPGFueSwgVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcltdPigpO1xuICAgIGNvbnN0IGFsbFByZVN0eWxlRWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU2V0PHN0cmluZz4+KCk7XG4gICAgY29uc3QgYWxsUG9zdFN0eWxlRWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU2V0PHN0cmluZz4+KCk7XG5cbiAgICBjb25zdCBkaXNhYmxlZEVsZW1lbnRzU2V0ID0gbmV3IFNldDxhbnk+KCk7XG4gICAgdGhpcy5kaXNhYmxlZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBkaXNhYmxlZEVsZW1lbnRzU2V0LmFkZChub2RlKTtcbiAgICAgIGNvbnN0IG5vZGVzVGhhdEFyZURpc2FibGVkID0gdGhpcy5kcml2ZXIucXVlcnkobm9kZSwgUVVFVUVEX1NFTEVDVE9SLCB0cnVlKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXNUaGF0QXJlRGlzYWJsZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGlzYWJsZWRFbGVtZW50c1NldC5hZGQobm9kZXNUaGF0QXJlRGlzYWJsZWRbaV0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgYm9keU5vZGUgPSB0aGlzLmJvZHlOb2RlO1xuICAgIGNvbnN0IGFsbFRyaWdnZXJFbGVtZW50cyA9IEFycmF5LmZyb20odGhpcy5zdGF0ZXNCeUVsZW1lbnQua2V5cygpKTtcbiAgICBjb25zdCBlbnRlck5vZGVNYXAgPSBidWlsZFJvb3RNYXAoYWxsVHJpZ2dlckVsZW1lbnRzLCB0aGlzLmNvbGxlY3RlZEVudGVyRWxlbWVudHMpO1xuXG4gICAgLy8gdGhpcyBtdXN0IG9jY3VyIGJlZm9yZSB0aGUgaW5zdHJ1Y3Rpb25zIGFyZSBidWlsdCBiZWxvdyBzdWNoIHRoYXRcbiAgICAvLyB0aGUgOmVudGVyIHF1ZXJpZXMgbWF0Y2ggdGhlIGVsZW1lbnRzIChzaW5jZSB0aGUgdGltZWxpbmUgcXVlcmllc1xuICAgIC8vIGFyZSBmaXJlZCBkdXJpbmcgaW5zdHJ1Y3Rpb24gYnVpbGRpbmcpLlxuICAgIGNvbnN0IGVudGVyTm9kZU1hcElkcyA9IG5ldyBNYXA8YW55LCBzdHJpbmc+KCk7XG4gICAgbGV0IGkgPSAwO1xuICAgIGVudGVyTm9kZU1hcC5mb3JFYWNoKChub2Rlcywgcm9vdCkgPT4ge1xuICAgICAgY29uc3QgY2xhc3NOYW1lID0gRU5URVJfQ0xBU1NOQU1FICsgaSsrO1xuICAgICAgZW50ZXJOb2RlTWFwSWRzLnNldChyb290LCBjbGFzc05hbWUpO1xuICAgICAgbm9kZXMuZm9yRWFjaChub2RlID0+IGFkZENsYXNzKG5vZGUsIGNsYXNzTmFtZSkpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgYWxsTGVhdmVOb2RlczogYW55W10gPSBbXTtcbiAgICBjb25zdCBtZXJnZWRMZWF2ZU5vZGVzID0gbmV3IFNldDxhbnk+KCk7XG4gICAgY29uc3QgbGVhdmVOb2Rlc1dpdGhvdXRBbmltYXRpb25zID0gbmV3IFNldDxhbnk+KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbGxlY3RlZExlYXZlRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLmNvbGxlY3RlZExlYXZlRWxlbWVudHNbaV07XG4gICAgICBjb25zdCBkZXRhaWxzID0gZWxlbWVudFtSRU1PVkFMX0ZMQUddIGFzIEVsZW1lbnRBbmltYXRpb25TdGF0ZTtcbiAgICAgIGlmIChkZXRhaWxzICYmIGRldGFpbHMuc2V0Rm9yUmVtb3ZhbCkge1xuICAgICAgICBhbGxMZWF2ZU5vZGVzLnB1c2goZWxlbWVudCk7XG4gICAgICAgIG1lcmdlZExlYXZlTm9kZXMuYWRkKGVsZW1lbnQpO1xuICAgICAgICBpZiAoZGV0YWlscy5oYXNBbmltYXRpb24pIHtcbiAgICAgICAgICB0aGlzLmRyaXZlci5xdWVyeShlbGVtZW50LCBTVEFSX1NFTEVDVE9SLCB0cnVlKS5mb3JFYWNoKGVsbSA9PiBtZXJnZWRMZWF2ZU5vZGVzLmFkZChlbG0pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZWF2ZU5vZGVzV2l0aG91dEFuaW1hdGlvbnMuYWRkKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbGVhdmVOb2RlTWFwSWRzID0gbmV3IE1hcDxhbnksIHN0cmluZz4oKTtcbiAgICBjb25zdCBsZWF2ZU5vZGVNYXAgPSBidWlsZFJvb3RNYXAoYWxsVHJpZ2dlckVsZW1lbnRzLCBBcnJheS5mcm9tKG1lcmdlZExlYXZlTm9kZXMpKTtcbiAgICBsZWF2ZU5vZGVNYXAuZm9yRWFjaCgobm9kZXMsIHJvb3QpID0+IHtcbiAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IExFQVZFX0NMQVNTTkFNRSArIGkrKztcbiAgICAgIGxlYXZlTm9kZU1hcElkcy5zZXQocm9vdCwgY2xhc3NOYW1lKTtcbiAgICAgIG5vZGVzLmZvckVhY2gobm9kZSA9PiBhZGRDbGFzcyhub2RlLCBjbGFzc05hbWUpKTtcbiAgICB9KTtcblxuICAgIGNsZWFudXBGbnMucHVzaCgoKSA9PiB7XG4gICAgICBlbnRlck5vZGVNYXAuZm9yRWFjaCgobm9kZXMsIHJvb3QpID0+IHtcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gZW50ZXJOb2RlTWFwSWRzLmdldChyb290KSE7XG4gICAgICAgIG5vZGVzLmZvckVhY2gobm9kZSA9PiByZW1vdmVDbGFzcyhub2RlLCBjbGFzc05hbWUpKTtcbiAgICAgIH0pO1xuXG4gICAgICBsZWF2ZU5vZGVNYXAuZm9yRWFjaCgobm9kZXMsIHJvb3QpID0+IHtcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gbGVhdmVOb2RlTWFwSWRzLmdldChyb290KSE7XG4gICAgICAgIG5vZGVzLmZvckVhY2gobm9kZSA9PiByZW1vdmVDbGFzcyhub2RlLCBjbGFzc05hbWUpKTtcbiAgICAgIH0pO1xuXG4gICAgICBhbGxMZWF2ZU5vZGVzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIHRoaXMucHJvY2Vzc0xlYXZlTm9kZShlbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgY29uc3QgYWxsUGxheWVyczogVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcltdID0gW107XG4gICAgY29uc3QgZXJyb25lb3VzVHJhbnNpdGlvbnM6IEFuaW1hdGlvblRyYW5zaXRpb25JbnN0cnVjdGlvbltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IHRoaXMuX25hbWVzcGFjZUxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IG5zID0gdGhpcy5fbmFtZXNwYWNlTGlzdFtpXTtcbiAgICAgIG5zLmRyYWluUXVldWVkVHJhbnNpdGlvbnMobWljcm90YXNrSWQpLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICBjb25zdCBwbGF5ZXIgPSBlbnRyeS5wbGF5ZXI7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBlbnRyeS5lbGVtZW50O1xuICAgICAgICBhbGxQbGF5ZXJzLnB1c2gocGxheWVyKTtcblxuICAgICAgICBpZiAodGhpcy5jb2xsZWN0ZWRFbnRlckVsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnN0IGRldGFpbHMgPSBlbGVtZW50W1JFTU9WQUxfRkxBR10gYXMgRWxlbWVudEFuaW1hdGlvblN0YXRlO1xuICAgICAgICAgIC8vIGFuaW1hdGlvbnMgZm9yIG1vdmUgb3BlcmF0aW9ucyAoZWxlbWVudHMgYmVpbmcgcmVtb3ZlZCBhbmQgcmVpbnNlcnRlZCxcbiAgICAgICAgICAvLyBlLmcuIHdoZW4gdGhlIG9yZGVyIG9mIGFuICpuZ0ZvciBsaXN0IGNoYW5nZXMpIGFyZSBjdXJyZW50bHkgbm90IHN1cHBvcnRlZFxuICAgICAgICAgIGlmIChkZXRhaWxzICYmIGRldGFpbHMuc2V0Rm9yTW92ZSkge1xuICAgICAgICAgICAgaWYgKGRldGFpbHMucHJldmlvdXNUcmlnZ2Vyc1ZhbHVlcyAmJlxuICAgICAgICAgICAgICAgIGRldGFpbHMucHJldmlvdXNUcmlnZ2Vyc1ZhbHVlcy5oYXMoZW50cnkudHJpZ2dlck5hbWUpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzVmFsdWUgPSBkZXRhaWxzLnByZXZpb3VzVHJpZ2dlcnNWYWx1ZXMuZ2V0KGVudHJ5LnRyaWdnZXJOYW1lKSBhcyBzdHJpbmc7XG5cbiAgICAgICAgICAgICAgLy8gd2UgbmVlZCB0byByZXN0b3JlIHRoZSBwcmV2aW91cyB0cmlnZ2VyIHZhbHVlIHNpbmNlIHRoZSBlbGVtZW50IGhhc1xuICAgICAgICAgICAgICAvLyBvbmx5IGJlZW4gbW92ZWQgYW5kIGhhc24ndCBhY3R1YWxseSBsZWZ0IHRoZSBET01cbiAgICAgICAgICAgICAgY29uc3QgdHJpZ2dlcnNXaXRoU3RhdGVzID0gdGhpcy5zdGF0ZXNCeUVsZW1lbnQuZ2V0KGVudHJ5LmVsZW1lbnQpO1xuICAgICAgICAgICAgICBpZiAodHJpZ2dlcnNXaXRoU3RhdGVzICYmIHRyaWdnZXJzV2l0aFN0YXRlcy5oYXMoZW50cnkudHJpZ2dlck5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSB0cmlnZ2Vyc1dpdGhTdGF0ZXMuZ2V0KGVudHJ5LnRyaWdnZXJOYW1lKSE7XG4gICAgICAgICAgICAgICAgc3RhdGUudmFsdWUgPSBwcmV2aW91c1ZhbHVlO1xuICAgICAgICAgICAgICAgIHRyaWdnZXJzV2l0aFN0YXRlcy5zZXQoZW50cnkudHJpZ2dlck5hbWUsIHN0YXRlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwbGF5ZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5vZGVJc09ycGhhbmVkID0gIWJvZHlOb2RlIHx8ICF0aGlzLmRyaXZlci5jb250YWluc0VsZW1lbnQoYm9keU5vZGUsIGVsZW1lbnQpO1xuICAgICAgICBjb25zdCBsZWF2ZUNsYXNzTmFtZSA9IGxlYXZlTm9kZU1hcElkcy5nZXQoZWxlbWVudCkhO1xuICAgICAgICBjb25zdCBlbnRlckNsYXNzTmFtZSA9IGVudGVyTm9kZU1hcElkcy5nZXQoZWxlbWVudCkhO1xuICAgICAgICBjb25zdCBpbnN0cnVjdGlvbiA9IHRoaXMuX2J1aWxkSW5zdHJ1Y3Rpb24oXG4gICAgICAgICAgICBlbnRyeSwgc3ViVGltZWxpbmVzLCBlbnRlckNsYXNzTmFtZSwgbGVhdmVDbGFzc05hbWUsIG5vZGVJc09ycGhhbmVkKSE7XG4gICAgICAgIGlmIChpbnN0cnVjdGlvbi5lcnJvcnMgJiYgaW5zdHJ1Y3Rpb24uZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgIGVycm9uZW91c1RyYW5zaXRpb25zLnB1c2goaW5zdHJ1Y3Rpb24pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGV2ZW4gdGhvdWdoIHRoZSBlbGVtZW50IG1heSBub3QgYmUgaW4gdGhlIERPTSwgaXQgbWF5IHN0aWxsXG4gICAgICAgIC8vIGJlIGFkZGVkIGF0IGEgbGF0ZXIgcG9pbnQgKGR1ZSB0byB0aGUgbWVjaGFuaWNzIG9mIGNvbnRlbnRcbiAgICAgICAgLy8gcHJvamVjdGlvbiBhbmQvb3IgZHluYW1pYyBjb21wb25lbnQgaW5zZXJ0aW9uKSB0aGVyZWZvcmUgaXQnc1xuICAgICAgICAvLyBpbXBvcnRhbnQgdG8gc3RpbGwgc3R5bGUgdGhlIGVsZW1lbnQuXG4gICAgICAgIGlmIChub2RlSXNPcnBoYW5lZCkge1xuICAgICAgICAgIHBsYXllci5vblN0YXJ0KCgpID0+IGVyYXNlU3R5bGVzKGVsZW1lbnQsIGluc3RydWN0aW9uLmZyb21TdHlsZXMpKTtcbiAgICAgICAgICBwbGF5ZXIub25EZXN0cm95KCgpID0+IHNldFN0eWxlcyhlbGVtZW50LCBpbnN0cnVjdGlvbi50b1N0eWxlcykpO1xuICAgICAgICAgIHNraXBwZWRQbGF5ZXJzLnB1c2gocGxheWVyKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBhbiB1bm1hdGNoZWQgdHJhbnNpdGlvbiBpcyBxdWV1ZWQgYW5kIHJlYWR5IHRvIGdvXG4gICAgICAgIC8vIHRoZW4gaXQgU0hPVUxEIE5PVCByZW5kZXIgYW4gYW5pbWF0aW9uIGFuZCBjYW5jZWwgdGhlXG4gICAgICAgIC8vIHByZXZpb3VzbHkgcnVubmluZyBhbmltYXRpb25zLlxuICAgICAgICBpZiAoZW50cnkuaXNGYWxsYmFja1RyYW5zaXRpb24pIHtcbiAgICAgICAgICBwbGF5ZXIub25TdGFydCgoKSA9PiBlcmFzZVN0eWxlcyhlbGVtZW50LCBpbnN0cnVjdGlvbi5mcm9tU3R5bGVzKSk7XG4gICAgICAgICAgcGxheWVyLm9uRGVzdHJveSgoKSA9PiBzZXRTdHlsZXMoZWxlbWVudCwgaW5zdHJ1Y3Rpb24udG9TdHlsZXMpKTtcbiAgICAgICAgICBza2lwcGVkUGxheWVycy5wdXNoKHBsYXllcik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IGlmIGEgcGFyZW50IGFuaW1hdGlvbiB1c2VzIHRoaXMgYW5pbWF0aW9uIGFzIGEgc3ViLXRyaWdnZXJcbiAgICAgICAgLy8gdGhlbiBpdCB3aWxsIGluc3RydWN0IHRoZSB0aW1lbGluZSBidWlsZGVyIG5vdCB0byBhZGQgYSBwbGF5ZXIgZGVsYXksIGJ1dFxuICAgICAgICAvLyBpbnN0ZWFkIHN0cmV0Y2ggdGhlIGZpcnN0IGtleWZyYW1lIGdhcCB1bnRpbCB0aGUgYW5pbWF0aW9uIHN0YXJ0cy4gVGhpcyBpc1xuICAgICAgICAvLyBpbXBvcnRhbnQgaW4gb3JkZXIgdG8gcHJldmVudCBleHRyYSBpbml0aWFsaXphdGlvbiBzdHlsZXMgZnJvbSBiZWluZ1xuICAgICAgICAvLyByZXF1aXJlZCBieSB0aGUgdXNlciBmb3IgdGhlIGFuaW1hdGlvbi5cbiAgICAgICAgY29uc3QgdGltZWxpbmVzOiBBbmltYXRpb25UaW1lbGluZUluc3RydWN0aW9uW10gPSBbXTtcbiAgICAgICAgaW5zdHJ1Y3Rpb24udGltZWxpbmVzLmZvckVhY2godGwgPT4ge1xuICAgICAgICAgIHRsLnN0cmV0Y2hTdGFydGluZ0tleWZyYW1lID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZWROb2Rlcy5oYXModGwuZWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRpbWVsaW5lcy5wdXNoKHRsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpbnN0cnVjdGlvbi50aW1lbGluZXMgPSB0aW1lbGluZXM7XG5cbiAgICAgICAgc3ViVGltZWxpbmVzLmFwcGVuZChlbGVtZW50LCBpbnN0cnVjdGlvbi50aW1lbGluZXMpO1xuXG4gICAgICAgIGNvbnN0IHR1cGxlID0ge2luc3RydWN0aW9uLCBwbGF5ZXIsIGVsZW1lbnR9O1xuXG4gICAgICAgIHF1ZXVlZEluc3RydWN0aW9ucy5wdXNoKHR1cGxlKTtcblxuICAgICAgICBpbnN0cnVjdGlvbi5xdWVyaWVkRWxlbWVudHMuZm9yRWFjaChcbiAgICAgICAgICAgIGVsZW1lbnQgPT4gZ2V0T3JTZXREZWZhdWx0VmFsdWUocXVlcmllZEVsZW1lbnRzLCBlbGVtZW50LCBbXSkucHVzaChwbGF5ZXIpKTtcblxuICAgICAgICBpbnN0cnVjdGlvbi5wcmVTdHlsZVByb3BzLmZvckVhY2goKHN0cmluZ01hcCwgZWxlbWVudCkgPT4ge1xuICAgICAgICAgIGlmIChzdHJpbmdNYXAuc2l6ZSkge1xuICAgICAgICAgICAgbGV0IHNldFZhbDogU2V0PHN0cmluZz4gPSBhbGxQcmVTdHlsZUVsZW1lbnRzLmdldChlbGVtZW50KSE7XG4gICAgICAgICAgICBpZiAoIXNldFZhbCkge1xuICAgICAgICAgICAgICBhbGxQcmVTdHlsZUVsZW1lbnRzLnNldChlbGVtZW50LCBzZXRWYWwgPSBuZXcgU2V0PHN0cmluZz4oKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHJpbmdNYXAuZm9yRWFjaCgoXywgcHJvcCkgPT4gc2V0VmFsLmFkZChwcm9wKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpbnN0cnVjdGlvbi5wb3N0U3R5bGVQcm9wcy5mb3JFYWNoKChzdHJpbmdNYXAsIGVsZW1lbnQpID0+IHtcbiAgICAgICAgICBsZXQgc2V0VmFsOiBTZXQ8c3RyaW5nPiA9IGFsbFBvc3RTdHlsZUVsZW1lbnRzLmdldChlbGVtZW50KSE7XG4gICAgICAgICAgaWYgKCFzZXRWYWwpIHtcbiAgICAgICAgICAgIGFsbFBvc3RTdHlsZUVsZW1lbnRzLnNldChlbGVtZW50LCBzZXRWYWwgPSBuZXcgU2V0PHN0cmluZz4oKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0cmluZ01hcC5mb3JFYWNoKChfLCBwcm9wKSA9PiBzZXRWYWwuYWRkKHByb3ApKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoZXJyb25lb3VzVHJhbnNpdGlvbnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBlcnJvcnM6IEVycm9yW10gPSBbXTtcbiAgICAgIGVycm9uZW91c1RyYW5zaXRpb25zLmZvckVhY2goaW5zdHJ1Y3Rpb24gPT4ge1xuICAgICAgICBlcnJvcnMucHVzaCh0cmFuc2l0aW9uRmFpbGVkKGluc3RydWN0aW9uLnRyaWdnZXJOYW1lLCBpbnN0cnVjdGlvbi5lcnJvcnMhKSk7XG4gICAgICB9KTtcblxuICAgICAgYWxsUGxheWVycy5mb3JFYWNoKHBsYXllciA9PiBwbGF5ZXIuZGVzdHJveSgpKTtcbiAgICAgIHRoaXMucmVwb3J0RXJyb3IoZXJyb3JzKTtcbiAgICB9XG5cbiAgICBjb25zdCBhbGxQcmV2aW91c1BsYXllcnNNYXAgPSBuZXcgTWFwPGFueSwgVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcltdPigpO1xuICAgIC8vIHRoaXMgbWFwIHRlbGxzIHVzIHdoaWNoIGVsZW1lbnQgaW4gdGhlIERPTSB0cmVlIGlzIGNvbnRhaW5lZCBieVxuICAgIC8vIHdoaWNoIGFuaW1hdGlvbi4gRnVydGhlciBkb3duIHRoaXMgbWFwIHdpbGwgZ2V0IHBvcHVsYXRlZCBvbmNlXG4gICAgLy8gdGhlIHBsYXllcnMgYXJlIGJ1aWx0IGFuZCBpbiBkb2luZyBzbyB3ZSBjYW4gdXNlIGl0IHRvIGVmZmljaWVudGx5XG4gICAgLy8gZmlndXJlIG91dCBpZiBhIHN1YiBwbGF5ZXIgaXMgc2tpcHBlZCBkdWUgdG8gYSBwYXJlbnQgcGxheWVyIGhhdmluZyBwcmlvcml0eS5cbiAgICBjb25zdCBhbmltYXRpb25FbGVtZW50TWFwID0gbmV3IE1hcDxhbnksIGFueT4oKTtcbiAgICBxdWV1ZWRJbnN0cnVjdGlvbnMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gZW50cnkuZWxlbWVudDtcbiAgICAgIGlmIChzdWJUaW1lbGluZXMuaGFzKGVsZW1lbnQpKSB7XG4gICAgICAgIGFuaW1hdGlvbkVsZW1lbnRNYXAuc2V0KGVsZW1lbnQsIGVsZW1lbnQpO1xuICAgICAgICB0aGlzLl9iZWZvcmVBbmltYXRpb25CdWlsZChcbiAgICAgICAgICAgIGVudHJ5LnBsYXllci5uYW1lc3BhY2VJZCwgZW50cnkuaW5zdHJ1Y3Rpb24sIGFsbFByZXZpb3VzUGxheWVyc01hcCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBza2lwcGVkUGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gcGxheWVyLmVsZW1lbnQ7XG4gICAgICBjb25zdCBwcmV2aW91c1BsYXllcnMgPVxuICAgICAgICAgIHRoaXMuX2dldFByZXZpb3VzUGxheWVycyhlbGVtZW50LCBmYWxzZSwgcGxheWVyLm5hbWVzcGFjZUlkLCBwbGF5ZXIudHJpZ2dlck5hbWUsIG51bGwpO1xuICAgICAgcHJldmlvdXNQbGF5ZXJzLmZvckVhY2gocHJldlBsYXllciA9PiB7XG4gICAgICAgIGdldE9yU2V0RGVmYXVsdFZhbHVlKGFsbFByZXZpb3VzUGxheWVyc01hcCwgZWxlbWVudCwgW10pLnB1c2gocHJldlBsYXllcik7XG4gICAgICAgIHByZXZQbGF5ZXIuZGVzdHJveSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyB0aGlzIGlzIGEgc3BlY2lhbCBjYXNlIGZvciBub2RlcyB0aGF0IHdpbGwgYmUgcmVtb3ZlZCBlaXRoZXIgYnlcbiAgICAvLyBoYXZpbmcgdGhlaXIgb3duIGxlYXZlIGFuaW1hdGlvbnMgb3IgYnkgYmVpbmcgcXVlcmllZCBpbiBhIGNvbnRhaW5lclxuICAgIC8vIHRoYXQgd2lsbCBiZSByZW1vdmVkIG9uY2UgYSBwYXJlbnQgYW5pbWF0aW9uIGlzIGNvbXBsZXRlLiBUaGUgaWRlYVxuICAgIC8vIGhlcmUgaXMgdGhhdCAqIHN0eWxlcyBtdXN0IGJlIGlkZW50aWNhbCB0byAhIHN0eWxlcyBiZWNhdXNlIG9mXG4gICAgLy8gYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgKCogaXMgYWxzbyBmaWxsZWQgaW4gYnkgZGVmYXVsdCBpbiBtYW55IHBsYWNlcykuXG4gICAgLy8gT3RoZXJ3aXNlICogc3R5bGVzIHdpbGwgcmV0dXJuIGFuIGVtcHR5IHZhbHVlIG9yIFwiYXV0b1wiIHNpbmNlIHRoZSBlbGVtZW50XG4gICAgLy8gcGFzc2VkIHRvIGdldENvbXB1dGVkU3R5bGUgd2lsbCBub3QgYmUgdmlzaWJsZSAoc2luY2UgKiA9PT0gZGVzdGluYXRpb24pXG4gICAgY29uc3QgcmVwbGFjZU5vZGVzID0gYWxsTGVhdmVOb2Rlcy5maWx0ZXIobm9kZSA9PiB7XG4gICAgICByZXR1cm4gcmVwbGFjZVBvc3RTdHlsZXNBc1ByZShub2RlLCBhbGxQcmVTdHlsZUVsZW1lbnRzLCBhbGxQb3N0U3R5bGVFbGVtZW50cyk7XG4gICAgfSk7XG5cbiAgICAvLyBQT1NUIFNUQUdFOiBmaWxsIHRoZSAqIHN0eWxlc1xuICAgIGNvbnN0IHBvc3RTdHlsZXNNYXAgPSBuZXcgTWFwPGFueSwgybVTdHlsZURhdGFNYXA+KCk7XG4gICAgY29uc3QgYWxsTGVhdmVRdWVyaWVkTm9kZXMgPSBjbG9ha0FuZENvbXB1dGVTdHlsZXMoXG4gICAgICAgIHBvc3RTdHlsZXNNYXAsIHRoaXMuZHJpdmVyLCBsZWF2ZU5vZGVzV2l0aG91dEFuaW1hdGlvbnMsIGFsbFBvc3RTdHlsZUVsZW1lbnRzLCBBVVRPX1NUWUxFKTtcblxuICAgIGFsbExlYXZlUXVlcmllZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBpZiAocmVwbGFjZVBvc3RTdHlsZXNBc1ByZShub2RlLCBhbGxQcmVTdHlsZUVsZW1lbnRzLCBhbGxQb3N0U3R5bGVFbGVtZW50cykpIHtcbiAgICAgICAgcmVwbGFjZU5vZGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBQUkUgU1RBR0U6IGZpbGwgdGhlICEgc3R5bGVzXG4gICAgY29uc3QgcHJlU3R5bGVzTWFwID0gbmV3IE1hcDxhbnksIMm1U3R5bGVEYXRhTWFwPigpO1xuICAgIGVudGVyTm9kZU1hcC5mb3JFYWNoKChub2Rlcywgcm9vdCkgPT4ge1xuICAgICAgY2xvYWtBbmRDb21wdXRlU3R5bGVzKFxuICAgICAgICAgIHByZVN0eWxlc01hcCwgdGhpcy5kcml2ZXIsIG5ldyBTZXQobm9kZXMpLCBhbGxQcmVTdHlsZUVsZW1lbnRzLCBQUkVfU1RZTEUpO1xuICAgIH0pO1xuXG4gICAgcmVwbGFjZU5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBjb25zdCBwb3N0ID0gcG9zdFN0eWxlc01hcC5nZXQobm9kZSk7XG4gICAgICBjb25zdCBwcmUgPSBwcmVTdHlsZXNNYXAuZ2V0KG5vZGUpO1xuICAgICAgcG9zdFN0eWxlc01hcC5zZXQobm9kZSwgbmV3IE1hcChbLi4uKHBvc3Q/LmVudHJpZXMoKSA/PyBbXSksIC4uLihwcmU/LmVudHJpZXMoKSA/PyBbXSldKSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCByb290UGxheWVyczogVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcltdID0gW107XG4gICAgY29uc3Qgc3ViUGxheWVyczogVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcltdID0gW107XG4gICAgY29uc3QgTk9fUEFSRU5UX0FOSU1BVElPTl9FTEVNRU5UX0RFVEVDVEVEID0ge307XG4gICAgcXVldWVkSW5zdHJ1Y3Rpb25zLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgY29uc3Qge2VsZW1lbnQsIHBsYXllciwgaW5zdHJ1Y3Rpb259ID0gZW50cnk7XG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgaXQgd2FzIG5ldmVyIGNvbnN1bWVkIGJ5IGEgcGFyZW50IGFuaW1hdGlvbiB3aGljaFxuICAgICAgLy8gbWVhbnMgdGhhdCBpdCBpcyBpbmRlcGVuZGVudCBhbmQgdGhlcmVmb3JlIHNob3VsZCBiZSBzZXQgZm9yIGFuaW1hdGlvblxuICAgICAgaWYgKHN1YlRpbWVsaW5lcy5oYXMoZWxlbWVudCkpIHtcbiAgICAgICAgaWYgKGRpc2FibGVkRWxlbWVudHNTZXQuaGFzKGVsZW1lbnQpKSB7XG4gICAgICAgICAgcGxheWVyLm9uRGVzdHJveSgoKSA9PiBzZXRTdHlsZXMoZWxlbWVudCwgaW5zdHJ1Y3Rpb24udG9TdHlsZXMpKTtcbiAgICAgICAgICBwbGF5ZXIuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIHBsYXllci5vdmVycmlkZVRvdGFsVGltZShpbnN0cnVjdGlvbi50b3RhbFRpbWUpO1xuICAgICAgICAgIHNraXBwZWRQbGF5ZXJzLnB1c2gocGxheWVyKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGlzIHdpbGwgZmxvdyB1cCB0aGUgRE9NIGFuZCBxdWVyeSB0aGUgbWFwIHRvIGZpZ3VyZSBvdXRcbiAgICAgICAgLy8gaWYgYSBwYXJlbnQgYW5pbWF0aW9uIGhhcyBwcmlvcml0eSBvdmVyIGl0LiBJbiB0aGUgc2l0dWF0aW9uXG4gICAgICAgIC8vIHRoYXQgYSBwYXJlbnQgaXMgZGV0ZWN0ZWQgdGhlbiBpdCB3aWxsIGNhbmNlbCB0aGUgbG9vcC4gSWZcbiAgICAgICAgLy8gbm90aGluZyBpcyBkZXRlY3RlZCwgb3IgaXQgdGFrZXMgYSBmZXcgaG9wcyB0byBmaW5kIGEgcGFyZW50LFxuICAgICAgICAvLyB0aGVuIGl0IHdpbGwgZmlsbCBpbiB0aGUgbWlzc2luZyBub2RlcyBhbmQgc2lnbmFsIHRoZW0gYXMgaGF2aW5nXG4gICAgICAgIC8vIGEgZGV0ZWN0ZWQgcGFyZW50IChvciBhIE5PX1BBUkVOVCB2YWx1ZSB2aWEgYSBzcGVjaWFsIGNvbnN0YW50KS5cbiAgICAgICAgbGV0IHBhcmVudFdpdGhBbmltYXRpb246IGFueSA9IE5PX1BBUkVOVF9BTklNQVRJT05fRUxFTUVOVF9ERVRFQ1RFRDtcbiAgICAgICAgaWYgKGFuaW1hdGlvbkVsZW1lbnRNYXAuc2l6ZSA+IDEpIHtcbiAgICAgICAgICBsZXQgZWxtID0gZWxlbWVudDtcbiAgICAgICAgICBjb25zdCBwYXJlbnRzVG9BZGQ6IGFueVtdID0gW107XG4gICAgICAgICAgd2hpbGUgKGVsbSA9IGVsbS5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBjb25zdCBkZXRlY3RlZFBhcmVudCA9IGFuaW1hdGlvbkVsZW1lbnRNYXAuZ2V0KGVsbSk7XG4gICAgICAgICAgICBpZiAoZGV0ZWN0ZWRQYXJlbnQpIHtcbiAgICAgICAgICAgICAgcGFyZW50V2l0aEFuaW1hdGlvbiA9IGRldGVjdGVkUGFyZW50O1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhcmVudHNUb0FkZC5wdXNoKGVsbSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBhcmVudHNUb0FkZC5mb3JFYWNoKHBhcmVudCA9PiBhbmltYXRpb25FbGVtZW50TWFwLnNldChwYXJlbnQsIHBhcmVudFdpdGhBbmltYXRpb24pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlubmVyUGxheWVyID0gdGhpcy5fYnVpbGRBbmltYXRpb24oXG4gICAgICAgICAgICBwbGF5ZXIubmFtZXNwYWNlSWQsIGluc3RydWN0aW9uLCBhbGxQcmV2aW91c1BsYXllcnNNYXAsIHNraXBwZWRQbGF5ZXJzTWFwLCBwcmVTdHlsZXNNYXAsXG4gICAgICAgICAgICBwb3N0U3R5bGVzTWFwKTtcblxuICAgICAgICBwbGF5ZXIuc2V0UmVhbFBsYXllcihpbm5lclBsYXllcik7XG5cbiAgICAgICAgaWYgKHBhcmVudFdpdGhBbmltYXRpb24gPT09IE5PX1BBUkVOVF9BTklNQVRJT05fRUxFTUVOVF9ERVRFQ1RFRCkge1xuICAgICAgICAgIHJvb3RQbGF5ZXJzLnB1c2gocGxheWVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBwYXJlbnRQbGF5ZXJzID0gdGhpcy5wbGF5ZXJzQnlFbGVtZW50LmdldChwYXJlbnRXaXRoQW5pbWF0aW9uKTtcbiAgICAgICAgICBpZiAocGFyZW50UGxheWVycyAmJiBwYXJlbnRQbGF5ZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgcGxheWVyLnBhcmVudFBsYXllciA9IG9wdGltaXplR3JvdXBQbGF5ZXIocGFyZW50UGxheWVycyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNraXBwZWRQbGF5ZXJzLnB1c2gocGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJhc2VTdHlsZXMoZWxlbWVudCwgaW5zdHJ1Y3Rpb24uZnJvbVN0eWxlcyk7XG4gICAgICAgIHBsYXllci5vbkRlc3Ryb3koKCkgPT4gc2V0U3R5bGVzKGVsZW1lbnQsIGluc3RydWN0aW9uLnRvU3R5bGVzKSk7XG4gICAgICAgIC8vIHRoZXJlIHN0aWxsIG1pZ2h0IGJlIGEgYW5jZXN0b3IgcGxheWVyIGFuaW1hdGluZyB0aGlzXG4gICAgICAgIC8vIGVsZW1lbnQgdGhlcmVmb3JlIHdlIHdpbGwgc3RpbGwgYWRkIGl0IGFzIGEgc3ViIHBsYXllclxuICAgICAgICAvLyBldmVuIGlmIGl0cyBhbmltYXRpb24gbWF5IGJlIGRpc2FibGVkXG4gICAgICAgIHN1YlBsYXllcnMucHVzaChwbGF5ZXIpO1xuICAgICAgICBpZiAoZGlzYWJsZWRFbGVtZW50c1NldC5oYXMoZWxlbWVudCkpIHtcbiAgICAgICAgICBza2lwcGVkUGxheWVycy5wdXNoKHBsYXllcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGZpbmQgYWxsIG9mIHRoZSBzdWIgcGxheWVycycgY29ycmVzcG9uZGluZyBpbm5lciBhbmltYXRpb24gcGxheWVyc1xuICAgIHN1YlBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgLy8gZXZlbiBpZiBubyBwbGF5ZXJzIGFyZSBmb3VuZCBmb3IgYSBzdWIgYW5pbWF0aW9uIGl0XG4gICAgICAvLyB3aWxsIHN0aWxsIGNvbXBsZXRlIGl0c2VsZiBhZnRlciB0aGUgbmV4dCB0aWNrIHNpbmNlIGl0J3MgTm9vcFxuICAgICAgY29uc3QgcGxheWVyc0ZvckVsZW1lbnQgPSBza2lwcGVkUGxheWVyc01hcC5nZXQocGxheWVyLmVsZW1lbnQpO1xuICAgICAgaWYgKHBsYXllcnNGb3JFbGVtZW50ICYmIHBsYXllcnNGb3JFbGVtZW50Lmxlbmd0aCkge1xuICAgICAgICBjb25zdCBpbm5lclBsYXllciA9IG9wdGltaXplR3JvdXBQbGF5ZXIocGxheWVyc0ZvckVsZW1lbnQpO1xuICAgICAgICBwbGF5ZXIuc2V0UmVhbFBsYXllcihpbm5lclBsYXllcik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyB0aGUgcmVhc29uIHdoeSB3ZSBkb24ndCBhY3R1YWxseSBwbGF5IHRoZSBhbmltYXRpb24gaXNcbiAgICAvLyBiZWNhdXNlIGFsbCB0aGF0IGEgc2tpcHBlZCBwbGF5ZXIgaXMgZGVzaWduZWQgdG8gZG8gaXMgdG9cbiAgICAvLyBmaXJlIHRoZSBzdGFydC9kb25lIHRyYW5zaXRpb24gY2FsbGJhY2sgZXZlbnRzXG4gICAgc2tpcHBlZFBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgaWYgKHBsYXllci5wYXJlbnRQbGF5ZXIpIHtcbiAgICAgICAgcGxheWVyLnN5bmNQbGF5ZXJFdmVudHMocGxheWVyLnBhcmVudFBsYXllcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbGF5ZXIuZGVzdHJveSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gcnVuIHRocm91Z2ggYWxsIG9mIHRoZSBxdWV1ZWQgcmVtb3ZhbHMgYW5kIHNlZSBpZiB0aGV5XG4gICAgLy8gd2VyZSBwaWNrZWQgdXAgYnkgYSBxdWVyeS4gSWYgbm90IHRoZW4gcGVyZm9ybSB0aGUgcmVtb3ZhbFxuICAgIC8vIG9wZXJhdGlvbiByaWdodCBhd2F5IHVubGVzcyBhIHBhcmVudCBhbmltYXRpb24gaXMgb25nb2luZy5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFsbExlYXZlTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBhbGxMZWF2ZU5vZGVzW2ldO1xuICAgICAgY29uc3QgZGV0YWlscyA9IGVsZW1lbnRbUkVNT1ZBTF9GTEFHXSBhcyBFbGVtZW50QW5pbWF0aW9uU3RhdGU7XG4gICAgICByZW1vdmVDbGFzcyhlbGVtZW50LCBMRUFWRV9DTEFTU05BTUUpO1xuXG4gICAgICAvLyB0aGlzIG1lYW5zIHRoZSBlbGVtZW50IGhhcyBhIHJlbW92YWwgYW5pbWF0aW9uIHRoYXQgaXMgYmVpbmdcbiAgICAgIC8vIHRha2VuIGNhcmUgb2YgYW5kIHRoZXJlZm9yZSB0aGUgaW5uZXIgZWxlbWVudHMgd2lsbCBoYW5nIGFyb3VuZFxuICAgICAgLy8gdW50aWwgdGhhdCBhbmltYXRpb24gaXMgb3ZlciAob3IgdGhlIHBhcmVudCBxdWVyaWVkIGFuaW1hdGlvbilcbiAgICAgIGlmIChkZXRhaWxzICYmIGRldGFpbHMuaGFzQW5pbWF0aW9uKSBjb250aW51ZTtcblxuICAgICAgbGV0IHBsYXllcnM6IFRyYW5zaXRpb25BbmltYXRpb25QbGF5ZXJbXSA9IFtdO1xuXG4gICAgICAvLyBpZiB0aGlzIGVsZW1lbnQgaXMgcXVlcmllZCBvciBpZiBpdCBjb250YWlucyBxdWVyaWVkIGNoaWxkcmVuXG4gICAgICAvLyB0aGVuIHdlIHdhbnQgZm9yIHRoZSBlbGVtZW50IG5vdCB0byBiZSByZW1vdmVkIGZyb20gdGhlIHBhZ2VcbiAgICAgIC8vIHVudGlsIHRoZSBxdWVyaWVkIGFuaW1hdGlvbnMgaGF2ZSBmaW5pc2hlZFxuICAgICAgaWYgKHF1ZXJpZWRFbGVtZW50cy5zaXplKSB7XG4gICAgICAgIGxldCBxdWVyaWVkUGxheWVyUmVzdWx0cyA9IHF1ZXJpZWRFbGVtZW50cy5nZXQoZWxlbWVudCk7XG4gICAgICAgIGlmIChxdWVyaWVkUGxheWVyUmVzdWx0cyAmJiBxdWVyaWVkUGxheWVyUmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICBwbGF5ZXJzLnB1c2goLi4ucXVlcmllZFBsYXllclJlc3VsdHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHF1ZXJpZWRJbm5lckVsZW1lbnRzID0gdGhpcy5kcml2ZXIucXVlcnkoZWxlbWVudCwgTkdfQU5JTUFUSU5HX1NFTEVDVE9SLCB0cnVlKTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBxdWVyaWVkSW5uZXJFbGVtZW50cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGxldCBxdWVyaWVkUGxheWVycyA9IHF1ZXJpZWRFbGVtZW50cy5nZXQocXVlcmllZElubmVyRWxlbWVudHNbal0pO1xuICAgICAgICAgIGlmIChxdWVyaWVkUGxheWVycyAmJiBxdWVyaWVkUGxheWVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHBsYXllcnMucHVzaCguLi5xdWVyaWVkUGxheWVycyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGFjdGl2ZVBsYXllcnMgPSBwbGF5ZXJzLmZpbHRlcihwID0+ICFwLmRlc3Ryb3llZCk7XG4gICAgICBpZiAoYWN0aXZlUGxheWVycy5sZW5ndGgpIHtcbiAgICAgICAgcmVtb3ZlTm9kZXNBZnRlckFuaW1hdGlvbkRvbmUodGhpcywgZWxlbWVudCwgYWN0aXZlUGxheWVycyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnByb2Nlc3NMZWF2ZU5vZGUoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gdGhpcyBpcyByZXF1aXJlZCBzbyB0aGUgY2xlYW51cCBtZXRob2QgZG9lc24ndCByZW1vdmUgdGhlbVxuICAgIGFsbExlYXZlTm9kZXMubGVuZ3RoID0gMDtcblxuICAgIHJvb3RQbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgIHRoaXMucGxheWVycy5wdXNoKHBsYXllcik7XG4gICAgICBwbGF5ZXIub25Eb25lKCgpID0+IHtcbiAgICAgICAgcGxheWVyLmRlc3Ryb3koKTtcblxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMucGxheWVycy5pbmRleE9mKHBsYXllcik7XG4gICAgICAgIHRoaXMucGxheWVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgfSk7XG4gICAgICBwbGF5ZXIucGxheSgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJvb3RQbGF5ZXJzO1xuICB9XG5cbiAgYWZ0ZXJGbHVzaChjYWxsYmFjazogKCkgPT4gYW55KSB7XG4gICAgdGhpcy5fZmx1c2hGbnMucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICBhZnRlckZsdXNoQW5pbWF0aW9uc0RvbmUoY2FsbGJhY2s6ICgpID0+IGFueSkge1xuICAgIHRoaXMuX3doZW5RdWlldEZucy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldFByZXZpb3VzUGxheWVycyhcbiAgICAgIGVsZW1lbnQ6IHN0cmluZywgaXNRdWVyaWVkRWxlbWVudDogYm9vbGVhbiwgbmFtZXNwYWNlSWQ/OiBzdHJpbmcsIHRyaWdnZXJOYW1lPzogc3RyaW5nLFxuICAgICAgdG9TdGF0ZVZhbHVlPzogYW55KTogVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcltdIHtcbiAgICBsZXQgcGxheWVyczogVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcltdID0gW107XG4gICAgaWYgKGlzUXVlcmllZEVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHF1ZXJpZWRFbGVtZW50UGxheWVycyA9IHRoaXMucGxheWVyc0J5UXVlcmllZEVsZW1lbnQuZ2V0KGVsZW1lbnQpO1xuICAgICAgaWYgKHF1ZXJpZWRFbGVtZW50UGxheWVycykge1xuICAgICAgICBwbGF5ZXJzID0gcXVlcmllZEVsZW1lbnRQbGF5ZXJzO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBlbGVtZW50UGxheWVycyA9IHRoaXMucGxheWVyc0J5RWxlbWVudC5nZXQoZWxlbWVudCk7XG4gICAgICBpZiAoZWxlbWVudFBsYXllcnMpIHtcbiAgICAgICAgY29uc3QgaXNSZW1vdmFsQW5pbWF0aW9uID0gIXRvU3RhdGVWYWx1ZSB8fCB0b1N0YXRlVmFsdWUgPT0gVk9JRF9WQUxVRTtcbiAgICAgICAgZWxlbWVudFBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgIGlmIChwbGF5ZXIucXVldWVkKSByZXR1cm47XG4gICAgICAgICAgaWYgKCFpc1JlbW92YWxBbmltYXRpb24gJiYgcGxheWVyLnRyaWdnZXJOYW1lICE9IHRyaWdnZXJOYW1lKSByZXR1cm47XG4gICAgICAgICAgcGxheWVycy5wdXNoKHBsYXllcik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobmFtZXNwYWNlSWQgfHwgdHJpZ2dlck5hbWUpIHtcbiAgICAgIHBsYXllcnMgPSBwbGF5ZXJzLmZpbHRlcihwbGF5ZXIgPT4ge1xuICAgICAgICBpZiAobmFtZXNwYWNlSWQgJiYgbmFtZXNwYWNlSWQgIT0gcGxheWVyLm5hbWVzcGFjZUlkKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICh0cmlnZ2VyTmFtZSAmJiB0cmlnZ2VyTmFtZSAhPSBwbGF5ZXIudHJpZ2dlck5hbWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHBsYXllcnM7XG4gIH1cblxuICBwcml2YXRlIF9iZWZvcmVBbmltYXRpb25CdWlsZChcbiAgICAgIG5hbWVzcGFjZUlkOiBzdHJpbmcsIGluc3RydWN0aW9uOiBBbmltYXRpb25UcmFuc2l0aW9uSW5zdHJ1Y3Rpb24sXG4gICAgICBhbGxQcmV2aW91c1BsYXllcnNNYXA6IE1hcDxhbnksIFRyYW5zaXRpb25BbmltYXRpb25QbGF5ZXJbXT4pIHtcbiAgICBjb25zdCB0cmlnZ2VyTmFtZSA9IGluc3RydWN0aW9uLnRyaWdnZXJOYW1lO1xuICAgIGNvbnN0IHJvb3RFbGVtZW50ID0gaW5zdHJ1Y3Rpb24uZWxlbWVudDtcblxuICAgIC8vIHdoZW4gYSByZW1vdmFsIGFuaW1hdGlvbiBvY2N1cnMsIEFMTCBwcmV2aW91cyBwbGF5ZXJzIGFyZSBjb2xsZWN0ZWRcbiAgICAvLyBhbmQgZGVzdHJveWVkIChldmVuIGlmIHRoZXkgYXJlIG91dHNpZGUgb2YgdGhlIGN1cnJlbnQgbmFtZXNwYWNlKVxuICAgIGNvbnN0IHRhcmdldE5hbWVTcGFjZUlkOiBzdHJpbmd8dW5kZWZpbmVkID1cbiAgICAgICAgaW5zdHJ1Y3Rpb24uaXNSZW1vdmFsVHJhbnNpdGlvbiA/IHVuZGVmaW5lZCA6IG5hbWVzcGFjZUlkO1xuICAgIGNvbnN0IHRhcmdldFRyaWdnZXJOYW1lOiBzdHJpbmd8dW5kZWZpbmVkID1cbiAgICAgICAgaW5zdHJ1Y3Rpb24uaXNSZW1vdmFsVHJhbnNpdGlvbiA/IHVuZGVmaW5lZCA6IHRyaWdnZXJOYW1lO1xuXG4gICAgZm9yIChjb25zdCB0aW1lbGluZUluc3RydWN0aW9uIG9mIGluc3RydWN0aW9uLnRpbWVsaW5lcykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IHRpbWVsaW5lSW5zdHJ1Y3Rpb24uZWxlbWVudDtcbiAgICAgIGNvbnN0IGlzUXVlcmllZEVsZW1lbnQgPSBlbGVtZW50ICE9PSByb290RWxlbWVudDtcbiAgICAgIGNvbnN0IHBsYXllcnMgPSBnZXRPclNldERlZmF1bHRWYWx1ZShhbGxQcmV2aW91c1BsYXllcnNNYXAsIGVsZW1lbnQsIFtdKTtcbiAgICAgIGNvbnN0IHByZXZpb3VzUGxheWVycyA9IHRoaXMuX2dldFByZXZpb3VzUGxheWVycyhcbiAgICAgICAgICBlbGVtZW50LCBpc1F1ZXJpZWRFbGVtZW50LCB0YXJnZXROYW1lU3BhY2VJZCwgdGFyZ2V0VHJpZ2dlck5hbWUsIGluc3RydWN0aW9uLnRvU3RhdGUpO1xuICAgICAgcHJldmlvdXNQbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgY29uc3QgcmVhbFBsYXllciA9IChwbGF5ZXIgYXMgVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcikuZ2V0UmVhbFBsYXllcigpIGFzIGFueTtcbiAgICAgICAgaWYgKHJlYWxQbGF5ZXIuYmVmb3JlRGVzdHJveSkge1xuICAgICAgICAgIHJlYWxQbGF5ZXIuYmVmb3JlRGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIHBsYXllci5kZXN0cm95KCk7XG4gICAgICAgIHBsYXllcnMucHVzaChwbGF5ZXIpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gdGhpcyBuZWVkcyB0byBiZSBkb25lIHNvIHRoYXQgdGhlIFBSRS9QT1NUIHN0eWxlcyBjYW4gYmVcbiAgICAvLyBjb21wdXRlZCBwcm9wZXJseSB3aXRob3V0IGludGVyZmVyaW5nIHdpdGggdGhlIHByZXZpb3VzIGFuaW1hdGlvblxuICAgIGVyYXNlU3R5bGVzKHJvb3RFbGVtZW50LCBpbnN0cnVjdGlvbi5mcm9tU3R5bGVzKTtcbiAgfVxuXG4gIHByaXZhdGUgX2J1aWxkQW5pbWF0aW9uKFxuICAgICAgbmFtZXNwYWNlSWQ6IHN0cmluZywgaW5zdHJ1Y3Rpb246IEFuaW1hdGlvblRyYW5zaXRpb25JbnN0cnVjdGlvbixcbiAgICAgIGFsbFByZXZpb3VzUGxheWVyc01hcDogTWFwPGFueSwgVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllcltdPixcbiAgICAgIHNraXBwZWRQbGF5ZXJzTWFwOiBNYXA8YW55LCBBbmltYXRpb25QbGF5ZXJbXT4sIHByZVN0eWxlc01hcDogTWFwPGFueSwgybVTdHlsZURhdGFNYXA+LFxuICAgICAgcG9zdFN0eWxlc01hcDogTWFwPGFueSwgybVTdHlsZURhdGFNYXA+KTogQW5pbWF0aW9uUGxheWVyIHtcbiAgICBjb25zdCB0cmlnZ2VyTmFtZSA9IGluc3RydWN0aW9uLnRyaWdnZXJOYW1lO1xuICAgIGNvbnN0IHJvb3RFbGVtZW50ID0gaW5zdHJ1Y3Rpb24uZWxlbWVudDtcblxuICAgIC8vIHdlIGZpcnN0IHJ1biB0aGlzIHNvIHRoYXQgdGhlIHByZXZpb3VzIGFuaW1hdGlvbiBwbGF5ZXJcbiAgICAvLyBkYXRhIGNhbiBiZSBwYXNzZWQgaW50byB0aGUgc3VjY2Vzc2l2ZSBhbmltYXRpb24gcGxheWVyc1xuICAgIGNvbnN0IGFsbFF1ZXJpZWRQbGF5ZXJzOiBUcmFuc2l0aW9uQW5pbWF0aW9uUGxheWVyW10gPSBbXTtcbiAgICBjb25zdCBhbGxDb25zdW1lZEVsZW1lbnRzID0gbmV3IFNldDxhbnk+KCk7XG4gICAgY29uc3QgYWxsU3ViRWxlbWVudHMgPSBuZXcgU2V0PGFueT4oKTtcbiAgICBjb25zdCBhbGxOZXdQbGF5ZXJzID0gaW5zdHJ1Y3Rpb24udGltZWxpbmVzLm1hcCh0aW1lbGluZUluc3RydWN0aW9uID0+IHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aW1lbGluZUluc3RydWN0aW9uLmVsZW1lbnQ7XG4gICAgICBhbGxDb25zdW1lZEVsZW1lbnRzLmFkZChlbGVtZW50KTtcblxuICAgICAgLy8gRklYTUUgKG1hdHNrbyk6IG1ha2Ugc3VyZSB0by1iZS1yZW1vdmVkIGFuaW1hdGlvbnMgYXJlIHJlbW92ZWQgcHJvcGVybHlcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBlbGVtZW50W1JFTU9WQUxfRkxBR107XG4gICAgICBpZiAoZGV0YWlscyAmJiBkZXRhaWxzLnJlbW92ZWRCZWZvcmVRdWVyaWVkKVxuICAgICAgICByZXR1cm4gbmV3IE5vb3BBbmltYXRpb25QbGF5ZXIodGltZWxpbmVJbnN0cnVjdGlvbi5kdXJhdGlvbiwgdGltZWxpbmVJbnN0cnVjdGlvbi5kZWxheSk7XG4gICAgICBjb25zdCBpc1F1ZXJpZWRFbGVtZW50ID0gZWxlbWVudCAhPT0gcm9vdEVsZW1lbnQ7XG4gICAgICBjb25zdCBwcmV2aW91c1BsYXllcnMgPVxuICAgICAgICAgIGZsYXR0ZW5Hcm91cFBsYXllcnMoKGFsbFByZXZpb3VzUGxheWVyc01hcC5nZXQoZWxlbWVudCkgfHwgRU1QVFlfUExBWUVSX0FSUkFZKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAocCA9PiBwLmdldFJlYWxQbGF5ZXIoKSkpXG4gICAgICAgICAgICAgIC5maWx0ZXIocCA9PiB7XG4gICAgICAgICAgICAgICAgLy8gdGhlIGBlbGVtZW50YCBpcyBub3QgYXBhcnQgb2YgdGhlIEFuaW1hdGlvblBsYXllciBkZWZpbml0aW9uLCBidXRcbiAgICAgICAgICAgICAgICAvLyBNb2NrL1dlYkFuaW1hdGlvbnNcbiAgICAgICAgICAgICAgICAvLyB1c2UgdGhlIGVsZW1lbnQgd2l0aGluIHRoZWlyIGltcGxlbWVudGF0aW9uLiBUaGlzIHdpbGwgYmUgYWRkZWQgaW4gQW5ndWxhcjUgdG9cbiAgICAgICAgICAgICAgICAvLyBBbmltYXRpb25QbGF5ZXJcbiAgICAgICAgICAgICAgICBjb25zdCBwcCA9IHAgYXMgYW55O1xuICAgICAgICAgICAgICAgIHJldHVybiBwcC5lbGVtZW50ID8gcHAuZWxlbWVudCA9PT0gZWxlbWVudCA6IGZhbHNlO1xuICAgICAgICAgICAgICB9KTtcblxuICAgICAgY29uc3QgcHJlU3R5bGVzID0gcHJlU3R5bGVzTWFwLmdldChlbGVtZW50KTtcbiAgICAgIGNvbnN0IHBvc3RTdHlsZXMgPSBwb3N0U3R5bGVzTWFwLmdldChlbGVtZW50KTtcblxuICAgICAgY29uc3Qga2V5ZnJhbWVzID0gbm9ybWFsaXplS2V5ZnJhbWVzKFxuICAgICAgICAgIHRoaXMuX25vcm1hbGl6ZXIsIHRpbWVsaW5lSW5zdHJ1Y3Rpb24ua2V5ZnJhbWVzLCBwcmVTdHlsZXMsIHBvc3RTdHlsZXMpO1xuICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5fYnVpbGRQbGF5ZXIodGltZWxpbmVJbnN0cnVjdGlvbiwga2V5ZnJhbWVzLCBwcmV2aW91c1BsYXllcnMpO1xuXG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhpcyBwYXJ0aWN1bGFyIHBsYXllciBiZWxvbmdzIHRvIGEgc3ViIHRyaWdnZXIuIEl0IGlzXG4gICAgICAvLyBpbXBvcnRhbnQgdGhhdCB3ZSBtYXRjaCB0aGlzIHBsYXllciB1cCB3aXRoIHRoZSBjb3JyZXNwb25kaW5nIChAdHJpZ2dlci5saXN0ZW5lcilcbiAgICAgIGlmICh0aW1lbGluZUluc3RydWN0aW9uLnN1YlRpbWVsaW5lICYmIHNraXBwZWRQbGF5ZXJzTWFwKSB7XG4gICAgICAgIGFsbFN1YkVsZW1lbnRzLmFkZChlbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzUXVlcmllZEVsZW1lbnQpIHtcbiAgICAgICAgY29uc3Qgd3JhcHBlZFBsYXllciA9IG5ldyBUcmFuc2l0aW9uQW5pbWF0aW9uUGxheWVyKG5hbWVzcGFjZUlkLCB0cmlnZ2VyTmFtZSwgZWxlbWVudCk7XG4gICAgICAgIHdyYXBwZWRQbGF5ZXIuc2V0UmVhbFBsYXllcihwbGF5ZXIpO1xuICAgICAgICBhbGxRdWVyaWVkUGxheWVycy5wdXNoKHdyYXBwZWRQbGF5ZXIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGxheWVyO1xuICAgIH0pO1xuXG4gICAgYWxsUXVlcmllZFBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgZ2V0T3JTZXREZWZhdWx0VmFsdWUodGhpcy5wbGF5ZXJzQnlRdWVyaWVkRWxlbWVudCwgcGxheWVyLmVsZW1lbnQsIFtdKS5wdXNoKHBsYXllcik7XG4gICAgICBwbGF5ZXIub25Eb25lKCgpID0+IGRlbGV0ZU9yVW5zZXRJbk1hcCh0aGlzLnBsYXllcnNCeVF1ZXJpZWRFbGVtZW50LCBwbGF5ZXIuZWxlbWVudCwgcGxheWVyKSk7XG4gICAgfSk7XG5cbiAgICBhbGxDb25zdW1lZEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiBhZGRDbGFzcyhlbGVtZW50LCBOR19BTklNQVRJTkdfQ0xBU1NOQU1FKSk7XG4gICAgY29uc3QgcGxheWVyID0gb3B0aW1pemVHcm91cFBsYXllcihhbGxOZXdQbGF5ZXJzKTtcbiAgICBwbGF5ZXIub25EZXN0cm95KCgpID0+IHtcbiAgICAgIGFsbENvbnN1bWVkRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHJlbW92ZUNsYXNzKGVsZW1lbnQsIE5HX0FOSU1BVElOR19DTEFTU05BTUUpKTtcbiAgICAgIHNldFN0eWxlcyhyb290RWxlbWVudCwgaW5zdHJ1Y3Rpb24udG9TdHlsZXMpO1xuICAgIH0pO1xuXG4gICAgLy8gdGhpcyBiYXNpY2FsbHkgbWFrZXMgYWxsIG9mIHRoZSBjYWxsYmFja3MgZm9yIHN1YiBlbGVtZW50IGFuaW1hdGlvbnNcbiAgICAvLyBiZSBkZXBlbmRlbnQgb24gdGhlIHVwcGVyIHBsYXllcnMgZm9yIHdoZW4gdGhleSBmaW5pc2hcbiAgICBhbGxTdWJFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgZ2V0T3JTZXREZWZhdWx0VmFsdWUoc2tpcHBlZFBsYXllcnNNYXAsIGVsZW1lbnQsIFtdKS5wdXNoKHBsYXllcik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcGxheWVyO1xuICB9XG5cbiAgcHJpdmF0ZSBfYnVpbGRQbGF5ZXIoXG4gICAgICBpbnN0cnVjdGlvbjogQW5pbWF0aW9uVGltZWxpbmVJbnN0cnVjdGlvbiwga2V5ZnJhbWVzOiBBcnJheTzJtVN0eWxlRGF0YU1hcD4sXG4gICAgICBwcmV2aW91c1BsYXllcnM6IEFuaW1hdGlvblBsYXllcltdKTogQW5pbWF0aW9uUGxheWVyIHtcbiAgICBpZiAoa2V5ZnJhbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiB0aGlzLmRyaXZlci5hbmltYXRlKFxuICAgICAgICAgIGluc3RydWN0aW9uLmVsZW1lbnQsIGtleWZyYW1lcywgaW5zdHJ1Y3Rpb24uZHVyYXRpb24sIGluc3RydWN0aW9uLmRlbGF5LFxuICAgICAgICAgIGluc3RydWN0aW9uLmVhc2luZywgcHJldmlvdXNQbGF5ZXJzKTtcbiAgICB9XG5cbiAgICAvLyBzcGVjaWFsIGNhc2UgZm9yIHdoZW4gYW4gZW1wdHkgdHJhbnNpdGlvbnxkZWZpbml0aW9uIGlzIHByb3ZpZGVkXG4gICAgLy8gLi4uIHRoZXJlIGlzIG5vIHBvaW50IGluIHJlbmRlcmluZyBhbiBlbXB0eSBhbmltYXRpb25cbiAgICByZXR1cm4gbmV3IE5vb3BBbmltYXRpb25QbGF5ZXIoaW5zdHJ1Y3Rpb24uZHVyYXRpb24sIGluc3RydWN0aW9uLmRlbGF5KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVHJhbnNpdGlvbkFuaW1hdGlvblBsYXllciBpbXBsZW1lbnRzIEFuaW1hdGlvblBsYXllciB7XG4gIHByaXZhdGUgX3BsYXllcjogQW5pbWF0aW9uUGxheWVyID0gbmV3IE5vb3BBbmltYXRpb25QbGF5ZXIoKTtcbiAgcHJpdmF0ZSBfY29udGFpbnNSZWFsUGxheWVyID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBfcXVldWVkQ2FsbGJhY2tzID0gbmV3IE1hcDxzdHJpbmcsICgoZXZlbnQ6IGFueSkgPT4gYW55KVtdPigpO1xuICBwdWJsaWMgcmVhZG9ubHkgZGVzdHJveWVkID0gZmFsc2U7XG4gIHB1YmxpYyBwYXJlbnRQbGF5ZXI6IEFuaW1hdGlvblBsYXllcnxudWxsID0gbnVsbDtcblxuICBwdWJsaWMgbWFya2VkRm9yRGVzdHJveTogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgZGlzYWJsZWQgPSBmYWxzZTtcblxuICByZWFkb25seSBxdWV1ZWQ6IGJvb2xlYW4gPSB0cnVlO1xuICBwdWJsaWMgcmVhZG9ubHkgdG90YWxUaW1lOiBudW1iZXIgPSAwO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lc3BhY2VJZDogc3RyaW5nLCBwdWJsaWMgdHJpZ2dlck5hbWU6IHN0cmluZywgcHVibGljIGVsZW1lbnQ6IGFueSkge31cblxuICBzZXRSZWFsUGxheWVyKHBsYXllcjogQW5pbWF0aW9uUGxheWVyKSB7XG4gICAgaWYgKHRoaXMuX2NvbnRhaW5zUmVhbFBsYXllcikgcmV0dXJuO1xuXG4gICAgdGhpcy5fcGxheWVyID0gcGxheWVyO1xuICAgIHRoaXMuX3F1ZXVlZENhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFja3MsIHBoYXNlKSA9PiB7XG4gICAgICBjYWxsYmFja3MuZm9yRWFjaChjYWxsYmFjayA9PiBsaXN0ZW5PblBsYXllcihwbGF5ZXIsIHBoYXNlLCB1bmRlZmluZWQsIGNhbGxiYWNrKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9xdWV1ZWRDYWxsYmFja3MuY2xlYXIoKTtcbiAgICB0aGlzLl9jb250YWluc1JlYWxQbGF5ZXIgPSB0cnVlO1xuICAgIHRoaXMub3ZlcnJpZGVUb3RhbFRpbWUocGxheWVyLnRvdGFsVGltZSk7XG4gICAgKHRoaXMgYXMge3F1ZXVlZDogYm9vbGVhbn0pLnF1ZXVlZCA9IGZhbHNlO1xuICB9XG5cbiAgZ2V0UmVhbFBsYXllcigpIHtcbiAgICByZXR1cm4gdGhpcy5fcGxheWVyO1xuICB9XG5cbiAgb3ZlcnJpZGVUb3RhbFRpbWUodG90YWxUaW1lOiBudW1iZXIpIHtcbiAgICAodGhpcyBhcyBhbnkpLnRvdGFsVGltZSA9IHRvdGFsVGltZTtcbiAgfVxuXG4gIHN5bmNQbGF5ZXJFdmVudHMocGxheWVyOiBBbmltYXRpb25QbGF5ZXIpIHtcbiAgICBjb25zdCBwID0gdGhpcy5fcGxheWVyIGFzIGFueTtcbiAgICBpZiAocC50cmlnZ2VyQ2FsbGJhY2spIHtcbiAgICAgIHBsYXllci5vblN0YXJ0KCgpID0+IHAudHJpZ2dlckNhbGxiYWNrISgnc3RhcnQnKSk7XG4gICAgfVxuICAgIHBsYXllci5vbkRvbmUoKCkgPT4gdGhpcy5maW5pc2goKSk7XG4gICAgcGxheWVyLm9uRGVzdHJveSgoKSA9PiB0aGlzLmRlc3Ryb3koKSk7XG4gIH1cblxuICBwcml2YXRlIF9xdWV1ZUV2ZW50KG5hbWU6IHN0cmluZywgY2FsbGJhY2s6IChldmVudDogYW55KSA9PiBhbnkpOiB2b2lkIHtcbiAgICBnZXRPclNldERlZmF1bHRWYWx1ZSh0aGlzLl9xdWV1ZWRDYWxsYmFja3MsIG5hbWUsIFtdKS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIG9uRG9uZShmbjogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnF1ZXVlZCkge1xuICAgICAgdGhpcy5fcXVldWVFdmVudCgnZG9uZScsIGZuKTtcbiAgICB9XG4gICAgdGhpcy5fcGxheWVyLm9uRG9uZShmbik7XG4gIH1cblxuICBvblN0YXJ0KGZuOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucXVldWVkKSB7XG4gICAgICB0aGlzLl9xdWV1ZUV2ZW50KCdzdGFydCcsIGZuKTtcbiAgICB9XG4gICAgdGhpcy5fcGxheWVyLm9uU3RhcnQoZm4pO1xuICB9XG5cbiAgb25EZXN0cm95KGZuOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucXVldWVkKSB7XG4gICAgICB0aGlzLl9xdWV1ZUV2ZW50KCdkZXN0cm95JywgZm4pO1xuICAgIH1cbiAgICB0aGlzLl9wbGF5ZXIub25EZXN0cm95KGZuKTtcbiAgfVxuXG4gIGluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5fcGxheWVyLmluaXQoKTtcbiAgfVxuXG4gIGhhc1N0YXJ0ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucXVldWVkID8gZmFsc2UgOiB0aGlzLl9wbGF5ZXIuaGFzU3RhcnRlZCgpO1xuICB9XG5cbiAgcGxheSgpOiB2b2lkIHtcbiAgICAhdGhpcy5xdWV1ZWQgJiYgdGhpcy5fcGxheWVyLnBsYXkoKTtcbiAgfVxuXG4gIHBhdXNlKCk6IHZvaWQge1xuICAgICF0aGlzLnF1ZXVlZCAmJiB0aGlzLl9wbGF5ZXIucGF1c2UoKTtcbiAgfVxuXG4gIHJlc3RhcnQoKTogdm9pZCB7XG4gICAgIXRoaXMucXVldWVkICYmIHRoaXMuX3BsYXllci5yZXN0YXJ0KCk7XG4gIH1cblxuICBmaW5pc2goKTogdm9pZCB7XG4gICAgdGhpcy5fcGxheWVyLmZpbmlzaCgpO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICAodGhpcyBhcyB7ZGVzdHJveWVkOiBib29sZWFufSkuZGVzdHJveWVkID0gdHJ1ZTtcbiAgICB0aGlzLl9wbGF5ZXIuZGVzdHJveSgpO1xuICB9XG5cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgIXRoaXMucXVldWVkICYmIHRoaXMuX3BsYXllci5yZXNldCgpO1xuICB9XG5cbiAgc2V0UG9zaXRpb24ocDogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnF1ZXVlZCkge1xuICAgICAgdGhpcy5fcGxheWVyLnNldFBvc2l0aW9uKHApO1xuICAgIH1cbiAgfVxuXG4gIGdldFBvc2l0aW9uKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMucXVldWVkID8gMCA6IHRoaXMuX3BsYXllci5nZXRQb3NpdGlvbigpO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICB0cmlnZ2VyQ2FsbGJhY2socGhhc2VOYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5fcGxheWVyIGFzIGFueTtcbiAgICBpZiAocC50cmlnZ2VyQ2FsbGJhY2spIHtcbiAgICAgIHAudHJpZ2dlckNhbGxiYWNrKHBoYXNlTmFtZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRlbGV0ZU9yVW5zZXRJbk1hcDxULCBWPihtYXA6IE1hcDxULCBWW10+LCBrZXk6IFQsIHZhbHVlOiBWKSB7XG4gIGxldCBjdXJyZW50VmFsdWVzID0gbWFwLmdldChrZXkpO1xuICBpZiAoY3VycmVudFZhbHVlcykge1xuICAgIGlmIChjdXJyZW50VmFsdWVzLmxlbmd0aCkge1xuICAgICAgY29uc3QgaW5kZXggPSBjdXJyZW50VmFsdWVzLmluZGV4T2YodmFsdWUpO1xuICAgICAgY3VycmVudFZhbHVlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICBpZiAoY3VycmVudFZhbHVlcy5sZW5ndGggPT0gMCkge1xuICAgICAgbWFwLmRlbGV0ZShrZXkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY3VycmVudFZhbHVlcztcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVHJpZ2dlclZhbHVlKHZhbHVlOiBhbnkpOiBhbnkge1xuICAvLyB3ZSB1c2UgYCE9IG51bGxgIGhlcmUgYmVjYXVzZSBpdCdzIHRoZSBtb3N0IHNpbXBsZVxuICAvLyB3YXkgdG8gdGVzdCBhZ2FpbnN0IGEgXCJmYWxzeVwiIHZhbHVlIHdpdGhvdXQgbWl4aW5nXG4gIC8vIGluIGVtcHR5IHN0cmluZ3Mgb3IgYSB6ZXJvIHZhbHVlLiBETyBOT1QgT1BUSU1JWkUuXG4gIHJldHVybiB2YWx1ZSAhPSBudWxsID8gdmFsdWUgOiBudWxsO1xufVxuXG5mdW5jdGlvbiBpc0VsZW1lbnROb2RlKG5vZGU6IGFueSkge1xuICByZXR1cm4gbm9kZSAmJiBub2RlWydub2RlVHlwZSddID09PSAxO1xufVxuXG5mdW5jdGlvbiBpc1RyaWdnZXJFdmVudFZhbGlkKGV2ZW50TmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBldmVudE5hbWUgPT0gJ3N0YXJ0JyB8fCBldmVudE5hbWUgPT0gJ2RvbmUnO1xufVxuXG5mdW5jdGlvbiBjbG9ha0VsZW1lbnQoZWxlbWVudDogYW55LCB2YWx1ZT86IHN0cmluZykge1xuICBjb25zdCBvbGRWYWx1ZSA9IGVsZW1lbnQuc3R5bGUuZGlzcGxheTtcbiAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gdmFsdWUgIT0gbnVsbCA/IHZhbHVlIDogJ25vbmUnO1xuICByZXR1cm4gb2xkVmFsdWU7XG59XG5cbmZ1bmN0aW9uIGNsb2FrQW5kQ29tcHV0ZVN0eWxlcyhcbiAgICB2YWx1ZXNNYXA6IE1hcDxhbnksIMm1U3R5bGVEYXRhTWFwPiwgZHJpdmVyOiBBbmltYXRpb25Ecml2ZXIsIGVsZW1lbnRzOiBTZXQ8YW55PixcbiAgICBlbGVtZW50UHJvcHNNYXA6IE1hcDxhbnksIFNldDxzdHJpbmc+PiwgZGVmYXVsdFN0eWxlOiBzdHJpbmcpOiBhbnlbXSB7XG4gIGNvbnN0IGNsb2FrVmFsczogc3RyaW5nW10gPSBbXTtcbiAgZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IGNsb2FrVmFscy5wdXNoKGNsb2FrRWxlbWVudChlbGVtZW50KSkpO1xuXG4gIGNvbnN0IGZhaWxlZEVsZW1lbnRzOiBhbnlbXSA9IFtdO1xuXG4gIGVsZW1lbnRQcm9wc01hcC5mb3JFYWNoKChwcm9wczogU2V0PHN0cmluZz4sIGVsZW1lbnQ6IGFueSkgPT4ge1xuICAgIGNvbnN0IHN0eWxlczogybVTdHlsZURhdGFNYXAgPSBuZXcgTWFwKCk7XG4gICAgcHJvcHMuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gZHJpdmVyLmNvbXB1dGVTdHlsZShlbGVtZW50LCBwcm9wLCBkZWZhdWx0U3R5bGUpO1xuICAgICAgc3R5bGVzLnNldChwcm9wLCB2YWx1ZSk7XG5cbiAgICAgIC8vIHRoZXJlIGlzIG5vIGVhc3kgd2F5IHRvIGRldGVjdCB0aGlzIGJlY2F1c2UgYSBzdWIgZWxlbWVudCBjb3VsZCBiZSByZW1vdmVkXG4gICAgICAvLyBieSBhIHBhcmVudCBhbmltYXRpb24gZWxlbWVudCBiZWluZyBkZXRhY2hlZC5cbiAgICAgIGlmICghdmFsdWUgfHwgdmFsdWUubGVuZ3RoID09IDApIHtcbiAgICAgICAgZWxlbWVudFtSRU1PVkFMX0ZMQUddID0gTlVMTF9SRU1PVkVEX1FVRVJJRURfU1RBVEU7XG4gICAgICAgIGZhaWxlZEVsZW1lbnRzLnB1c2goZWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdmFsdWVzTWFwLnNldChlbGVtZW50LCBzdHlsZXMpO1xuICB9KTtcblxuICAvLyB3ZSB1c2UgYSBpbmRleCB2YXJpYWJsZSBoZXJlIHNpbmNlIFNldC5mb3JFYWNoKGEsIGkpIGRvZXMgbm90IHJldHVyblxuICAvLyBhbiBpbmRleCB2YWx1ZSBmb3IgdGhlIGNsb3N1cmUgKGJ1dCBpbnN0ZWFkIGp1c3QgdGhlIHZhbHVlKVxuICBsZXQgaSA9IDA7XG4gIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiBjbG9ha0VsZW1lbnQoZWxlbWVudCwgY2xvYWtWYWxzW2krK10pKTtcblxuICByZXR1cm4gZmFpbGVkRWxlbWVudHM7XG59XG5cbi8qXG5TaW5jZSB0aGUgQW5ndWxhciByZW5kZXJlciBjb2RlIHdpbGwgcmV0dXJuIGEgY29sbGVjdGlvbiBvZiBpbnNlcnRlZFxubm9kZXMgaW4gYWxsIGFyZWFzIG9mIGEgRE9NIHRyZWUsIGl0J3MgdXAgdG8gdGhpcyBhbGdvcml0aG0gdG8gZmlndXJlXG5vdXQgd2hpY2ggbm9kZXMgYXJlIHJvb3RzIGZvciBlYWNoIGFuaW1hdGlvbiBAdHJpZ2dlci5cblxuQnkgcGxhY2luZyBlYWNoIGluc2VydGVkIG5vZGUgaW50byBhIFNldCBhbmQgdHJhdmVyc2luZyB1cHdhcmRzLCBpdFxuaXMgcG9zc2libGUgdG8gZmluZCB0aGUgQHRyaWdnZXIgZWxlbWVudHMgYW5kIHdlbGwgYW55IGRpcmVjdCAqc3RhclxuaW5zZXJ0aW9uIG5vZGVzLCBpZiBhIEB0cmlnZ2VyIHJvb3QgaXMgZm91bmQgdGhlbiB0aGUgZW50ZXIgZWxlbWVudFxuaXMgcGxhY2VkIGludG8gdGhlIE1hcFtAdHJpZ2dlcl0gc3BvdC5cbiAqL1xuZnVuY3Rpb24gYnVpbGRSb290TWFwKHJvb3RzOiBhbnlbXSwgbm9kZXM6IGFueVtdKTogTWFwPGFueSwgYW55W10+IHtcbiAgY29uc3Qgcm9vdE1hcCA9IG5ldyBNYXA8YW55LCBhbnlbXT4oKTtcbiAgcm9vdHMuZm9yRWFjaChyb290ID0+IHJvb3RNYXAuc2V0KHJvb3QsIFtdKSk7XG5cbiAgaWYgKG5vZGVzLmxlbmd0aCA9PSAwKSByZXR1cm4gcm9vdE1hcDtcblxuICBjb25zdCBOVUxMX05PREUgPSAxO1xuICBjb25zdCBub2RlU2V0ID0gbmV3IFNldChub2Rlcyk7XG4gIGNvbnN0IGxvY2FsUm9vdE1hcCA9IG5ldyBNYXA8YW55LCBhbnk+KCk7XG5cbiAgZnVuY3Rpb24gZ2V0Um9vdChub2RlOiBhbnkpOiBhbnkge1xuICAgIGlmICghbm9kZSkgcmV0dXJuIE5VTExfTk9ERTtcblxuICAgIGxldCByb290ID0gbG9jYWxSb290TWFwLmdldChub2RlKTtcbiAgICBpZiAocm9vdCkgcmV0dXJuIHJvb3Q7XG5cbiAgICBjb25zdCBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgaWYgKHJvb3RNYXAuaGFzKHBhcmVudCkpIHsgIC8vIG5nSWYgaW5zaWRlIEB0cmlnZ2VyXG4gICAgICByb290ID0gcGFyZW50O1xuICAgIH0gZWxzZSBpZiAobm9kZVNldC5oYXMocGFyZW50KSkgeyAgLy8gbmdJZiBpbnNpZGUgbmdJZlxuICAgICAgcm9vdCA9IE5VTExfTk9ERTtcbiAgICB9IGVsc2UgeyAgLy8gcmVjdXJzZSB1cHdhcmRzXG4gICAgICByb290ID0gZ2V0Um9vdChwYXJlbnQpO1xuICAgIH1cblxuICAgIGxvY2FsUm9vdE1hcC5zZXQobm9kZSwgcm9vdCk7XG4gICAgcmV0dXJuIHJvb3Q7XG4gIH1cblxuICBub2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgIGNvbnN0IHJvb3QgPSBnZXRSb290KG5vZGUpO1xuICAgIGlmIChyb290ICE9PSBOVUxMX05PREUpIHtcbiAgICAgIHJvb3RNYXAuZ2V0KHJvb3QpIS5wdXNoKG5vZGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHJvb3RNYXA7XG59XG5cbmZ1bmN0aW9uIGFkZENsYXNzKGVsZW1lbnQ6IGFueSwgY2xhc3NOYW1lOiBzdHJpbmcpIHtcbiAgZWxlbWVudC5jbGFzc0xpc3Q/LmFkZChjbGFzc05hbWUpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVDbGFzcyhlbGVtZW50OiBhbnksIGNsYXNzTmFtZTogc3RyaW5nKSB7XG4gIGVsZW1lbnQuY2xhc3NMaXN0Py5yZW1vdmUoY2xhc3NOYW1lKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlTm9kZXNBZnRlckFuaW1hdGlvbkRvbmUoXG4gICAgZW5naW5lOiBUcmFuc2l0aW9uQW5pbWF0aW9uRW5naW5lLCBlbGVtZW50OiBhbnksIHBsYXllcnM6IEFuaW1hdGlvblBsYXllcltdKSB7XG4gIG9wdGltaXplR3JvdXBQbGF5ZXIocGxheWVycykub25Eb25lKCgpID0+IGVuZ2luZS5wcm9jZXNzTGVhdmVOb2RlKGVsZW1lbnQpKTtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbkdyb3VwUGxheWVycyhwbGF5ZXJzOiBBbmltYXRpb25QbGF5ZXJbXSk6IEFuaW1hdGlvblBsYXllcltdIHtcbiAgY29uc3QgZmluYWxQbGF5ZXJzOiBBbmltYXRpb25QbGF5ZXJbXSA9IFtdO1xuICBfZmxhdHRlbkdyb3VwUGxheWVyc1JlY3VyKHBsYXllcnMsIGZpbmFsUGxheWVycyk7XG4gIHJldHVybiBmaW5hbFBsYXllcnM7XG59XG5cbmZ1bmN0aW9uIF9mbGF0dGVuR3JvdXBQbGF5ZXJzUmVjdXIocGxheWVyczogQW5pbWF0aW9uUGxheWVyW10sIGZpbmFsUGxheWVyczogQW5pbWF0aW9uUGxheWVyW10pIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgcGxheWVyID0gcGxheWVyc1tpXTtcbiAgICBpZiAocGxheWVyIGluc3RhbmNlb2YgQW5pbWF0aW9uR3JvdXBQbGF5ZXIpIHtcbiAgICAgIF9mbGF0dGVuR3JvdXBQbGF5ZXJzUmVjdXIocGxheWVyLnBsYXllcnMsIGZpbmFsUGxheWVycyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpbmFsUGxheWVycy5wdXNoKHBsYXllcik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIG9iakVxdWFscyhhOiB7W2tleTogc3RyaW5nXTogYW55fSwgYjoge1trZXk6IHN0cmluZ106IGFueX0pOiBib29sZWFuIHtcbiAgY29uc3QgazEgPSBPYmplY3Qua2V5cyhhKTtcbiAgY29uc3QgazIgPSBPYmplY3Qua2V5cyhiKTtcbiAgaWYgKGsxLmxlbmd0aCAhPSBrMi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrMS5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHByb3AgPSBrMVtpXTtcbiAgICBpZiAoIWIuaGFzT3duUHJvcGVydHkocHJvcCkgfHwgYVtwcm9wXSAhPT0gYltwcm9wXSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlUG9zdFN0eWxlc0FzUHJlKFxuICAgIGVsZW1lbnQ6IGFueSwgYWxsUHJlU3R5bGVFbGVtZW50czogTWFwPGFueSwgU2V0PHN0cmluZz4+LFxuICAgIGFsbFBvc3RTdHlsZUVsZW1lbnRzOiBNYXA8YW55LCBTZXQ8c3RyaW5nPj4pOiBib29sZWFuIHtcbiAgY29uc3QgcG9zdEVudHJ5ID0gYWxsUG9zdFN0eWxlRWxlbWVudHMuZ2V0KGVsZW1lbnQpO1xuICBpZiAoIXBvc3RFbnRyeSkgcmV0dXJuIGZhbHNlO1xuXG4gIGxldCBwcmVFbnRyeSA9IGFsbFByZVN0eWxlRWxlbWVudHMuZ2V0KGVsZW1lbnQpO1xuICBpZiAocHJlRW50cnkpIHtcbiAgICBwb3N0RW50cnkuZm9yRWFjaChkYXRhID0+IHByZUVudHJ5IS5hZGQoZGF0YSkpO1xuICB9IGVsc2Uge1xuICAgIGFsbFByZVN0eWxlRWxlbWVudHMuc2V0KGVsZW1lbnQsIHBvc3RFbnRyeSk7XG4gIH1cblxuICBhbGxQb3N0U3R5bGVFbGVtZW50cy5kZWxldGUoZWxlbWVudCk7XG4gIHJldHVybiB0cnVlO1xufVxuIl19