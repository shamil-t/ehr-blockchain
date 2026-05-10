/**
 * @license Angular v16.2.12
 * (c) 2010-2022 Google LLC. https://angular.io/
 * License: MIT
 */

import { assertInInjectionContext, inject, DestroyRef, Injector, effect, untracked as untracked$1, signal as signal$1, computed as computed$1 } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Operator which completes the Observable when the calling context (component, directive, service,
 * etc) is destroyed.
 *
 * @param destroyRef optionally, the `DestroyRef` representing the current context. This can be
 *     passed explicitly to use `takeUntilDestroyed` outside of an [injection
 * context](guide/dependency-injection-context). Otherwise, the current `DestroyRef` is injected.
 *
 * @developerPreview
 */
function takeUntilDestroyed(destroyRef) {
    if (!destroyRef) {
        assertInInjectionContext(takeUntilDestroyed);
        destroyRef = inject(DestroyRef);
    }
    const destroyed$ = new Observable(observer => {
        const unregisterFn = destroyRef.onDestroy(observer.next.bind(observer));
        return unregisterFn;
    });
    return (source) => {
        return source.pipe(takeUntil(destroyed$));
    };
}

/**
 * Exposes the value of an Angular `Signal` as an RxJS `Observable`.
 *
 * The signal's value will be propagated into the `Observable`'s subscribers using an `effect`.
 *
 * `toObservable` must be called in an injection context unless an injector is provided via options.
 *
 * @developerPreview
 */
function toObservable(source, options) {
    !options?.injector && assertInInjectionContext(toObservable);
    const injector = options?.injector ?? inject(Injector);
    const subject = new ReplaySubject(1);
    const watcher = effect(() => {
        let value;
        try {
            value = source();
        }
        catch (err) {
            untracked$1(() => subject.error(err));
            return;
        }
        untracked$1(() => subject.next(value));
    }, { injector, manualCleanup: true });
    injector.get(DestroyRef).onDestroy(() => {
        watcher.destroy();
        subject.complete();
    });
    return subject.asObservable();
}

/**
 * Base URL for the error details page.
 *
 * Keep this constant in sync across:
 *  - packages/compiler-cli/src/ngtsc/diagnostics/src/error_details_base_url.ts
 *  - packages/core/src/error_details_base_url.ts
 */
const ERROR_DETAILS_PAGE_BASE_URL = 'https://angular.io/errors';
/**
 * URL for the XSS security documentation.
 */
const XSS_SECURITY_URL = 'https://g.co/ng/security#xss';

/**
 * Class that represents a runtime error.
 * Formats and outputs the error message in a consistent way.
 *
 * Example:
 * ```
 *  throw new RuntimeError(
 *    RuntimeErrorCode.INJECTOR_ALREADY_DESTROYED,
 *    ngDevMode && 'Injector has already been destroyed.');
 * ```
 *
 * Note: the `message` argument contains a descriptive error message as a string in development
 * mode (when the `ngDevMode` is defined). In production mode (after tree-shaking pass), the
 * `message` argument becomes `false`, thus we account for it in the typings and the runtime
 * logic.
 */
class RuntimeError extends Error {
    constructor(code, message) {
        super(formatRuntimeError(code, message));
        this.code = code;
    }
}
/**
 * Called to format a runtime error.
 * See additional info on the `message` argument type in the `RuntimeError` class description.
 */
function formatRuntimeError(code, message) {
    // Error code might be a negative number, which is a special marker that instructs the logic to
    // generate a link to the error details page on angular.io.
    // We also prepend `0` to non-compile-time errors.
    const fullCode = `NG0${Math.abs(code)}`;
    let errorMessage = `${fullCode}${message ? ': ' + message : ''}`;
    if (ngDevMode && code < 0) {
        const addPeriodSeparator = !errorMessage.match(/[.,;!?\n]$/);
        const separator = addPeriodSeparator ? '.' : '';
        errorMessage =
            `${errorMessage}${separator} Find more at ${ERROR_DETAILS_PAGE_BASE_URL}/${fullCode}`;
    }
    return errorMessage;
}

/**
 * Symbol used to tell `Signal`s apart from other functions.
 *
 * This can be used to auto-unwrap signals in various cases, or to auto-wrap non-signal values.
 */
const SIGNAL = /* @__PURE__ */ Symbol('SIGNAL');
/**
 * Checks if the given `value` is a reactive `Signal`.
 *
 * @developerPreview
 */
function isSignal(value) {
    return typeof value === 'function' && value[SIGNAL] !== undefined;
}
/**
 * The default equality function used for `signal` and `computed`, which treats objects and arrays
 * as never equal, and all other primitive values using identity semantics.
 *
 * This allows signals to hold non-primitive values (arrays, objects, other collections) and still
 * propagate change notification upon explicit mutation without identity change.
 *
 * @developerPreview
 */
function defaultEquals(a, b) {
    // `Object.is` compares two values using identity semantics which is desired behavior for
    // primitive values. If `Object.is` determines two values to be equal we need to make sure that
    // those don't represent objects (we want to make sure that 2 objects are always considered
    // "unequal"). The null check is needed for the special case of JavaScript reporting null values
    // as objects (`typeof null === 'object'`).
    return (a === null || typeof a !== 'object') && Object.is(a, b);
}

const _global = globalThis;

function ngDevModeResetPerfCounters() {
    const locationString = typeof location !== 'undefined' ? location.toString() : '';
    const newCounters = {
        namedConstructors: locationString.indexOf('ngDevMode=namedConstructors') != -1,
        firstCreatePass: 0,
        tNode: 0,
        tView: 0,
        rendererCreateTextNode: 0,
        rendererSetText: 0,
        rendererCreateElement: 0,
        rendererAddEventListener: 0,
        rendererSetAttribute: 0,
        rendererRemoveAttribute: 0,
        rendererSetProperty: 0,
        rendererSetClassName: 0,
        rendererAddClass: 0,
        rendererRemoveClass: 0,
        rendererSetStyle: 0,
        rendererRemoveStyle: 0,
        rendererDestroy: 0,
        rendererDestroyNode: 0,
        rendererMoveNode: 0,
        rendererRemoveNode: 0,
        rendererAppendChild: 0,
        rendererInsertBefore: 0,
        rendererCreateComment: 0,
        hydratedNodes: 0,
        hydratedComponents: 0,
        dehydratedViewsRemoved: 0,
        dehydratedViewsCleanupRuns: 0,
        componentsSkippedHydration: 0,
    };
    // Make sure to refer to ngDevMode as ['ngDevMode'] for closure.
    const allowNgDevModeTrue = locationString.indexOf('ngDevMode=false') === -1;
    _global['ngDevMode'] = allowNgDevModeTrue && newCounters;
    return newCounters;
}
/**
 * This function checks to see if the `ngDevMode` has been set. If yes,
 * then we honor it, otherwise we default to dev mode with additional checks.
 *
 * The idea is that unless we are doing production build where we explicitly
 * set `ngDevMode == false` we should be helping the developer by providing
 * as much early warning and errors as possible.
 *
 * `ɵɵdefineComponent` is guaranteed to have been called before any component template functions
 * (and thus Ivy instructions), so a single initialization there is sufficient to ensure ngDevMode
 * is defined for the entire instruction set.
 *
 * When checking `ngDevMode` on toplevel, always init it before referencing it
 * (e.g. `((typeof ngDevMode === 'undefined' || ngDevMode) && initNgDevMode())`), otherwise you can
 *  get a `ReferenceError` like in https://github.com/angular/angular/issues/31595.
 *
 * Details on possible values for `ngDevMode` can be found on its docstring.
 *
 * NOTE:
 * - changes to the `ngDevMode` name must be synced with `compiler-cli/src/tooling.ts`.
 */
function initNgDevMode() {
    // The below checks are to ensure that calling `initNgDevMode` multiple times does not
    // reset the counters.
    // If the `ngDevMode` is not an object, then it means we have not created the perf counters
    // yet.
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
        if (typeof ngDevMode !== 'object') {
            ngDevModeResetPerfCounters();
        }
        return typeof ngDevMode !== 'undefined' && !!ngDevMode;
    }
    return false;
}

// Required as the signals library is in a separate package, so we need to explicitly ensure the
/**
 * The currently active consumer `ReactiveNode`, if running code in a reactive context.
 *
 * Change this via `setActiveConsumer`.
 */
let activeConsumer = null;
let inNotificationPhase = false;
function setActiveConsumer(consumer) {
    const prev = activeConsumer;
    activeConsumer = consumer;
    return prev;
}
const REACTIVE_NODE = {
    version: 0,
    dirty: false,
    producerNode: undefined,
    producerLastReadVersion: undefined,
    producerIndexOfThis: undefined,
    nextProducerIndex: 0,
    liveConsumerNode: undefined,
    liveConsumerIndexOfThis: undefined,
    consumerAllowSignalWrites: false,
    consumerIsAlwaysLive: false,
    producerMustRecompute: () => false,
    producerRecomputeValue: () => { },
    consumerMarkedDirty: () => { },
};
/**
 * Called by implementations when a producer's signal is read.
 */
function producerAccessed(node) {
    if (inNotificationPhase) {
        throw new Error(typeof ngDevMode !== 'undefined' && ngDevMode ?
            `Assertion error: signal read during notification phase` :
            '');
    }
    if (activeConsumer === null) {
        // Accessed outside of a reactive context, so nothing to record.
        return;
    }
    // This producer is the `idx`th dependency of `activeConsumer`.
    const idx = activeConsumer.nextProducerIndex++;
    assertConsumerNode(activeConsumer);
    if (idx < activeConsumer.producerNode.length && activeConsumer.producerNode[idx] !== node) {
        // There's been a change in producers since the last execution of `activeConsumer`.
        // `activeConsumer.producerNode[idx]` holds a stale dependency which will be be removed and
        // replaced with `this`.
        //
        // If `activeConsumer` isn't live, then this is a no-op, since we can replace the producer in
        // `activeConsumer.producerNode` directly. However, if `activeConsumer` is live, then we need
        // to remove it from the stale producer's `liveConsumer`s.
        if (consumerIsLive(activeConsumer)) {
            const staleProducer = activeConsumer.producerNode[idx];
            producerRemoveLiveConsumerAtIndex(staleProducer, activeConsumer.producerIndexOfThis[idx]);
            // At this point, the only record of `staleProducer` is the reference at
            // `activeConsumer.producerNode[idx]` which will be overwritten below.
        }
    }
    if (activeConsumer.producerNode[idx] !== node) {
        // We're a new dependency of the consumer (at `idx`).
        activeConsumer.producerNode[idx] = node;
        // If the active consumer is live, then add it as a live consumer. If not, then use 0 as a
        // placeholder value.
        activeConsumer.producerIndexOfThis[idx] =
            consumerIsLive(activeConsumer) ? producerAddLiveConsumer(node, activeConsumer, idx) : 0;
    }
    activeConsumer.producerLastReadVersion[idx] = node.version;
}
/**
 * Ensure this producer's `version` is up-to-date.
 */
function producerUpdateValueVersion(node) {
    if (consumerIsLive(node) && !node.dirty) {
        // A live consumer will be marked dirty by producers, so a clean state means that its version
        // is guaranteed to be up-to-date.
        return;
    }
    if (!node.producerMustRecompute(node) && !consumerPollProducersForChange(node)) {
        // None of our producers report a change since the last time they were read, so no
        // recomputation of our value is necessary, and we can consider ourselves clean.
        node.dirty = false;
        return;
    }
    node.producerRecomputeValue(node);
    // After recomputing the value, we're no longer dirty.
    node.dirty = false;
}
/**
 * Propagate a dirty notification to live consumers of this producer.
 */
function producerNotifyConsumers(node) {
    if (node.liveConsumerNode === undefined) {
        return;
    }
    // Prevent signal reads when we're updating the graph
    const prev = inNotificationPhase;
    inNotificationPhase = true;
    try {
        for (const consumer of node.liveConsumerNode) {
            if (!consumer.dirty) {
                consumerMarkDirty(consumer);
            }
        }
    }
    finally {
        inNotificationPhase = prev;
    }
}
/**
 * Whether this `ReactiveNode` in its producer capacity is currently allowed to initiate updates,
 * based on the current consumer context.
 */
function producerUpdatesAllowed() {
    return activeConsumer?.consumerAllowSignalWrites !== false;
}
function consumerMarkDirty(node) {
    node.dirty = true;
    producerNotifyConsumers(node);
    node.consumerMarkedDirty?.(node);
}
/**
 * Prepare this consumer to run a computation in its reactive context.
 *
 * Must be called by subclasses which represent reactive computations, before those computations
 * begin.
 */
function consumerBeforeComputation(node) {
    node && (node.nextProducerIndex = 0);
    return setActiveConsumer(node);
}
/**
 * Finalize this consumer's state after a reactive computation has run.
 *
 * Must be called by subclasses which represent reactive computations, after those computations
 * have finished.
 */
function consumerAfterComputation(node, prevConsumer) {
    setActiveConsumer(prevConsumer);
    if (!node || node.producerNode === undefined || node.producerIndexOfThis === undefined ||
        node.producerLastReadVersion === undefined) {
        return;
    }
    if (consumerIsLive(node)) {
        // For live consumers, we need to remove the producer -> consumer edge for any stale producers
        // which weren't dependencies after the recomputation.
        for (let i = node.nextProducerIndex; i < node.producerNode.length; i++) {
            producerRemoveLiveConsumerAtIndex(node.producerNode[i], node.producerIndexOfThis[i]);
        }
    }
    // Truncate the producer tracking arrays.
    // Perf note: this is essentially truncating the length to `node.nextProducerIndex`, but
    // benchmarking has shown that individual pop operations are faster.
    while (node.producerNode.length > node.nextProducerIndex) {
        node.producerNode.pop();
        node.producerLastReadVersion.pop();
        node.producerIndexOfThis.pop();
    }
}
/**
 * Determine whether this consumer has any dependencies which have changed since the last time
 * they were read.
 */
function consumerPollProducersForChange(node) {
    assertConsumerNode(node);
    // Poll producers for change.
    for (let i = 0; i < node.producerNode.length; i++) {
        const producer = node.producerNode[i];
        const seenVersion = node.producerLastReadVersion[i];
        // First check the versions. A mismatch means that the producer's value is known to have
        // changed since the last time we read it.
        if (seenVersion !== producer.version) {
            return true;
        }
        // The producer's version is the same as the last time we read it, but it might itself be
        // stale. Force the producer to recompute its version (calculating a new value if necessary).
        producerUpdateValueVersion(producer);
        // Now when we do this check, `producer.version` is guaranteed to be up to date, so if the
        // versions still match then it has not changed since the last time we read it.
        if (seenVersion !== producer.version) {
            return true;
        }
    }
    return false;
}
/**
 * Disconnect this consumer from the graph.
 */
function consumerDestroy(node) {
    assertConsumerNode(node);
    if (consumerIsLive(node)) {
        // Drop all connections from the graph to this node.
        for (let i = 0; i < node.producerNode.length; i++) {
            producerRemoveLiveConsumerAtIndex(node.producerNode[i], node.producerIndexOfThis[i]);
        }
    }
    // Truncate all the arrays to drop all connection from this node to the graph.
    node.producerNode.length = node.producerLastReadVersion.length = node.producerIndexOfThis.length =
        0;
    if (node.liveConsumerNode) {
        node.liveConsumerNode.length = node.liveConsumerIndexOfThis.length = 0;
    }
}
/**
 * Add `consumer` as a live consumer of this node.
 *
 * Note that this operation is potentially transitive. If this node becomes live, then it becomes
 * a live consumer of all of its current producers.
 */
function producerAddLiveConsumer(node, consumer, indexOfThis) {
    assertProducerNode(node);
    assertConsumerNode(node);
    if (node.liveConsumerNode.length === 0) {
        // When going from 0 to 1 live consumers, we become a live consumer to our producers.
        for (let i = 0; i < node.producerNode.length; i++) {
            node.producerIndexOfThis[i] = producerAddLiveConsumer(node.producerNode[i], node, i);
        }
    }
    node.liveConsumerIndexOfThis.push(indexOfThis);
    return node.liveConsumerNode.push(consumer) - 1;
}
/**
 * Remove the live consumer at `idx`.
 */
function producerRemoveLiveConsumerAtIndex(node, idx) {
    assertProducerNode(node);
    assertConsumerNode(node);
    if (typeof ngDevMode !== 'undefined' && ngDevMode && idx >= node.liveConsumerNode.length) {
        throw new Error(`Assertion error: active consumer index ${idx} is out of bounds of ${node.liveConsumerNode.length} consumers)`);
    }
    if (node.liveConsumerNode.length === 1) {
        // When removing the last live consumer, we will no longer be live. We need to remove
        // ourselves from our producers' tracking (which may cause consumer-producers to lose
        // liveness as well).
        for (let i = 0; i < node.producerNode.length; i++) {
            producerRemoveLiveConsumerAtIndex(node.producerNode[i], node.producerIndexOfThis[i]);
        }
    }
    // Move the last value of `liveConsumers` into `idx`. Note that if there's only a single
    // live consumer, this is a no-op.
    const lastIdx = node.liveConsumerNode.length - 1;
    node.liveConsumerNode[idx] = node.liveConsumerNode[lastIdx];
    node.liveConsumerIndexOfThis[idx] = node.liveConsumerIndexOfThis[lastIdx];
    // Truncate the array.
    node.liveConsumerNode.length--;
    node.liveConsumerIndexOfThis.length--;
    // If the index is still valid, then we need to fix the index pointer from the producer to this
    // consumer, and update it from `lastIdx` to `idx` (accounting for the move above).
    if (idx < node.liveConsumerNode.length) {
        const idxProducer = node.liveConsumerIndexOfThis[idx];
        const consumer = node.liveConsumerNode[idx];
        assertConsumerNode(consumer);
        consumer.producerIndexOfThis[idxProducer] = idx;
    }
}
function consumerIsLive(node) {
    return node.consumerIsAlwaysLive || (node?.liveConsumerNode?.length ?? 0) > 0;
}
function assertConsumerNode(node) {
    node.producerNode ??= [];
    node.producerIndexOfThis ??= [];
    node.producerLastReadVersion ??= [];
}
function assertProducerNode(node) {
    node.liveConsumerNode ??= [];
    node.liveConsumerIndexOfThis ??= [];
}

/**
 * Create a computed `Signal` which derives a reactive value from an expression.
 *
 * @developerPreview
 */
function computed(computation, options) {
    const node = Object.create(COMPUTED_NODE);
    node.computation = computation;
    options?.equal && (node.equal = options.equal);
    const computed = () => {
        // Check if the value needs updating before returning it.
        producerUpdateValueVersion(node);
        // Record that someone looked at this signal.
        producerAccessed(node);
        if (node.value === ERRORED) {
            throw node.error;
        }
        return node.value;
    };
    computed[SIGNAL] = node;
    return computed;
}
/**
 * A dedicated symbol used before a computed value has been calculated for the first time.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
const UNSET = /* @__PURE__ */ Symbol('UNSET');
/**
 * A dedicated symbol used in place of a computed signal value to indicate that a given computation
 * is in progress. Used to detect cycles in computation chains.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
const COMPUTING = /* @__PURE__ */ Symbol('COMPUTING');
/**
 * A dedicated symbol used in place of a computed signal value to indicate that a given computation
 * failed. The thrown error is cached until the computation gets dirty again.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
const ERRORED = /* @__PURE__ */ Symbol('ERRORED');
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `COMPUTED_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
const COMPUTED_NODE = /* @__PURE__ */ (() => {
    return {
        ...REACTIVE_NODE,
        value: UNSET,
        dirty: true,
        error: null,
        equal: defaultEquals,
        producerMustRecompute(node) {
            // Force a recomputation if there's no current value, or if the current value is in the
            // process of being calculated (which should throw an error).
            return node.value === UNSET || node.value === COMPUTING;
        },
        producerRecomputeValue(node) {
            if (node.value === COMPUTING) {
                // Our computation somehow led to a cyclic read of itself.
                throw new Error('Detected cycle in computations.');
            }
            const oldValue = node.value;
            node.value = COMPUTING;
            const prevConsumer = consumerBeforeComputation(node);
            let newValue;
            try {
                newValue = node.computation();
            }
            catch (err) {
                newValue = ERRORED;
                node.error = err;
            }
            finally {
                consumerAfterComputation(node, prevConsumer);
            }
            if (oldValue !== UNSET && oldValue !== ERRORED && newValue !== ERRORED &&
                node.equal(oldValue, newValue)) {
                // No change to `valueVersion` - old and new values are
                // semantically equivalent.
                node.value = oldValue;
                return;
            }
            node.value = newValue;
            node.version++;
        },
    };
})();

function defaultThrowError() {
    throw new Error();
}
let throwInvalidWriteToSignalErrorFn = defaultThrowError;
function throwInvalidWriteToSignalError() {
    throwInvalidWriteToSignalErrorFn();
}
function setThrowInvalidWriteToSignalError(fn) {
    throwInvalidWriteToSignalErrorFn = fn;
}

/**
 * If set, called after `WritableSignal`s are updated.
 *
 * This hook can be used to achieve various effects, such as running effects synchronously as part
 * of setting a signal.
 */
let postSignalSetFn = null;
/**
 * Create a `Signal` that can be set or updated directly.
 *
 * @developerPreview
 */
function signal(initialValue, options) {
    const node = Object.create(SIGNAL_NODE);
    node.value = initialValue;
    options?.equal && (node.equal = options.equal);
    function signalFn() {
        producerAccessed(node);
        return node.value;
    }
    signalFn.set = signalSetFn;
    signalFn.update = signalUpdateFn;
    signalFn.mutate = signalMutateFn;
    signalFn.asReadonly = signalAsReadonlyFn;
    signalFn[SIGNAL] = node;
    return signalFn;
}
function setPostSignalSetFn(fn) {
    const prev = postSignalSetFn;
    postSignalSetFn = fn;
    return prev;
}
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `COMPUTED_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
const SIGNAL_NODE = /* @__PURE__ */ (() => {
    return {
        ...REACTIVE_NODE,
        equal: defaultEquals,
        readonlyFn: undefined,
    };
})();
function signalValueChanged(node) {
    node.version++;
    producerNotifyConsumers(node);
    postSignalSetFn?.();
}
function signalSetFn(newValue) {
    const node = this[SIGNAL];
    if (!producerUpdatesAllowed()) {
        throwInvalidWriteToSignalError();
    }
    if (!node.equal(node.value, newValue)) {
        node.value = newValue;
        signalValueChanged(node);
    }
}
function signalUpdateFn(updater) {
    if (!producerUpdatesAllowed()) {
        throwInvalidWriteToSignalError();
    }
    signalSetFn.call(this, updater(this[SIGNAL].value));
}
function signalMutateFn(mutator) {
    const node = this[SIGNAL];
    if (!producerUpdatesAllowed()) {
        throwInvalidWriteToSignalError();
    }
    // Mutate bypasses equality checks as it's by definition changing the value.
    mutator(node.value);
    signalValueChanged(node);
}
function signalAsReadonlyFn() {
    const node = this[SIGNAL];
    if (node.readonlyFn === undefined) {
        const readonlyFn = () => this();
        readonlyFn[SIGNAL] = node;
        node.readonlyFn = readonlyFn;
    }
    return node.readonlyFn;
}

/**
 * Execute an arbitrary function in a non-reactive (non-tracking) context. The executed function
 * can, optionally, return a value.
 *
 * @developerPreview
 */
function untracked(nonReactiveReadsFn) {
    const prevConsumer = setActiveConsumer(null);
    // We are not trying to catch any particular errors here, just making sure that the consumers
    // stack is restored in case of errors.
    try {
        return nonReactiveReadsFn();
    }
    finally {
        setActiveConsumer(prevConsumer);
    }
}

function watch(fn, schedule, allowSignalWrites) {
    const node = Object.create(WATCH_NODE);
    if (allowSignalWrites) {
        node.consumerAllowSignalWrites = true;
    }
    node.fn = fn;
    node.schedule = schedule;
    const registerOnCleanup = (cleanupFn) => {
        node.cleanupFn = cleanupFn;
    };
    const run = () => {
        node.dirty = false;
        if (node.hasRun && !consumerPollProducersForChange(node)) {
            return;
        }
        node.hasRun = true;
        const prevConsumer = consumerBeforeComputation(node);
        try {
            node.cleanupFn();
            node.cleanupFn = NOOP_CLEANUP_FN;
            node.fn(registerOnCleanup);
        }
        finally {
            consumerAfterComputation(node, prevConsumer);
        }
    };
    node.ref = {
        notify: () => consumerMarkDirty(node),
        run,
        cleanup: () => node.cleanupFn(),
    };
    return node.ref;
}
const NOOP_CLEANUP_FN = () => { };
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `COMPUTED_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
const WATCH_NODE = /* @__PURE__ */ (() => {
    return {
        ...REACTIVE_NODE,
        consumerIsAlwaysLive: true,
        consumerAllowSignalWrites: false,
        consumerMarkedDirty: (node) => {
            node.schedule(node.ref);
        },
        hasRun: false,
        cleanupFn: NOOP_CLEANUP_FN,
    };
})();

function setAlternateWeakRefImpl(impl) {
    // TODO: remove this function
}

function toSignal(source, options) {
    const requiresCleanup = !options?.manualCleanup;
    requiresCleanup && !options?.injector && assertInInjectionContext(toSignal);
    const cleanupRef = requiresCleanup ? options?.injector?.get(DestroyRef) ?? inject(DestroyRef) : null;
    // Note: T is the Observable value type, and U is the initial value type. They don't have to be
    // the same - the returned signal gives values of type `T`.
    let state;
    if (options?.requireSync) {
        // Initially the signal is in a `NoValue` state.
        state = signal$1({ kind: 0 /* StateKind.NoValue */ });
    }
    else {
        // If an initial value was passed, use it. Otherwise, use `undefined` as the initial value.
        state = signal$1({ kind: 1 /* StateKind.Value */, value: options?.initialValue });
    }
    untracked(() => {
        const sub = source.subscribe({
            next: value => state.set({ kind: 1 /* StateKind.Value */, value }),
            error: error => state.set({ kind: 2 /* StateKind.Error */, error }),
            // Completion of the Observable is meaningless to the signal. Signals don't have a concept of
            // "complete".
        });
        if (ngDevMode && options?.requireSync && state().kind === 0 /* StateKind.NoValue */) {
            throw new RuntimeError(601 /* RuntimeErrorCode.REQUIRE_SYNC_WITHOUT_SYNC_EMIT */, '`toSignal()` called with `requireSync` but `Observable` did not emit synchronously.');
        }
        // Unsubscribe when the current context is destroyed, if requested.
        cleanupRef?.onDestroy(sub.unsubscribe.bind(sub));
    });
    // The actual returned signal is a `computed` of the `State` signal, which maps the various states
    // to either values or errors.
    return computed$1(() => {
        const current = state();
        switch (current.kind) {
            case 1 /* StateKind.Value */:
                return current.value;
            case 2 /* StateKind.Error */:
                throw current.error;
            case 0 /* StateKind.NoValue */:
                // This shouldn't really happen because the error is thrown on creation.
                // TODO(alxhub): use a RuntimeError when we finalize the error semantics
                throw new RuntimeError(601 /* RuntimeErrorCode.REQUIRE_SYNC_WITHOUT_SYNC_EMIT */, '`toSignal()` called with `requireSync` but `Observable` did not emit synchronously.');
        }
    });
}

/**
 * Generated bundle index. Do not edit.
 */

export { takeUntilDestroyed, toObservable, toSignal };
//# sourceMappingURL=rxjs-interop.mjs.map
