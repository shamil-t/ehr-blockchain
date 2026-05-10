/**
 * @license Angular v16.2.12
 * (c) 2010-2022 Google LLC. https://angular.io/
 * License: MIT
 */


import { AnimationMetadata } from '@angular/animations';
import { AnimationOptions } from '@angular/animations';
import { AnimationPlayer } from '@angular/animations';
import { AnimationTriggerMetadata } from '@angular/animations';
import * as i0 from '@angular/core';
import { ɵStyleData } from '@angular/animations';
import { ɵStyleDataMap } from '@angular/animations';

/**
 * @publicApi
 */
export declare abstract class AnimationDriver {
    static NOOP: AnimationDriver;
    abstract validateStyleProperty(prop: string): boolean;
    abstract validateAnimatableStyleProperty?: (prop: string) => boolean;
    /**
     * @deprecated No longer in use. Will be removed.
     */
    abstract matchesElement(element: any, selector: string): boolean;
    abstract containsElement(elm1: any, elm2: any): boolean;
    /**
     * Obtains the parent element, if any. `null` is returned if the element does not have a parent.
     */
    abstract getParentElement(element: unknown): unknown;
    abstract query(element: any, selector: string, multi: boolean): any[];
    abstract computeStyle(element: any, prop: string, defaultValue?: string): string;
    abstract animate(element: any, keyframes: Array<Map<string, string | number>>, duration: number, delay: number, easing?: string | null, previousPlayers?: any[], scrubberAccessRequested?: boolean): any;
}

declare interface AnimationEngineInstruction {
    type: AnimationTransitionInstructionType;
}

declare interface AnimationTimelineInstruction extends AnimationEngineInstruction {
    element: any;
    keyframes: Array<ɵStyleDataMap>;
    preStyleProps: string[];
    postStyleProps: string[];
    duration: number;
    delay: number;
    totalTime: number;
    easing: string | null;
    stretchStartingKeyframe?: boolean;
    subTimeline: boolean;
}


declare const enum AnimationTransitionInstructionType {
    TransitionAnimation = 0,
    TimelineAnimation = 1
}

declare class ElementInstructionMap {
    private _map;
    get(element: any): AnimationTimelineInstruction[];
    append(element: any, instructions: AnimationTimelineInstruction[]): void;
    has(element: any): boolean;
    clear(): void;
}

/**
 * Designed to be executed during a keyframe-based animation to apply any special-cased styles.
 *
 * When started (when the `start()` method is run) then the provided `startStyles`
 * will be applied. When finished (when the `finish()` method is called) the
 * `endStyles` will be applied as well any any starting styles. Finally when
 * `destroy()` is called then all styles will be removed.
 */
declare class SpecialCasedStyles {
    private _element;
    private _startStyles;
    private _endStyles;
    static initialStylesByElement: WeakMap<any, ɵStyleDataMap>;
    private _state;
    private _initialStyles;
    constructor(_element: any, _startStyles: ɵStyleDataMap | null, _endStyles: ɵStyleDataMap | null);
    start(): void;
    finish(): void;
    destroy(): void;
}

export declare function ɵallowPreviousPlayerStylesMerge(duration: number, delay: number): boolean;

export declare class ɵAnimation {
    private _driver;
    private _animationAst;
    constructor(_driver: AnimationDriver, input: AnimationMetadata | AnimationMetadata[]);
    buildTimelines(element: any, startingStyles: ɵStyleDataMap | Array<ɵStyleDataMap>, destinationStyles: ɵStyleDataMap | Array<ɵStyleDataMap>, options: AnimationOptions, subInstructions?: ElementInstructionMap): AnimationTimelineInstruction[];
}

export declare class ɵAnimationEngine {
    private bodyNode;
    private _driver;
    private _normalizer;
    private _transitionEngine;
    private _timelineEngine;
    private _triggerCache;
    onRemovalComplete: (element: any, context: any) => void;
    constructor(bodyNode: any, _driver: AnimationDriver, _normalizer: ɵAnimationStyleNormalizer);
    registerTrigger(componentId: string, namespaceId: string, hostElement: any, name: string, metadata: AnimationTriggerMetadata): void;
    register(namespaceId: string, hostElement: any): void;
    destroy(namespaceId: string, context: any): void;
    onInsert(namespaceId: string, element: any, parent: any, insertBefore: boolean): void;
    onRemove(namespaceId: string, element: any, context: any): void;
    disableAnimations(element: any, disable: boolean): void;
    process(namespaceId: string, element: any, property: string, value: any): void;
    listen(namespaceId: string, element: any, eventName: string, eventPhase: string, callback: (event: any) => any): () => any;
    flush(microtaskId?: number): void;
    get players(): AnimationPlayer[];
    whenRenderingDone(): Promise<any>;
    afterFlushAnimationsDone(cb: VoidFunction): void;
}


/**
 * @publicApi
 */
export declare abstract class ɵAnimationStyleNormalizer {
    abstract normalizePropertyName(propertyName: string, errors: Error[]): string;
    abstract normalizeStyleValue(userProvidedProperty: string, normalizedProperty: string, value: string | number, errors: Error[]): string;
}

export declare function ɵcontainsElement(elm1: any, elm2: any): boolean;

export declare function ɵgetParentElement(element: any): unknown | null;

export declare function ɵinvokeQuery(element: any, selector: string, multi: boolean): any[];

/**
 * @publicApi
 */
export declare class ɵNoopAnimationDriver implements AnimationDriver {
    validateStyleProperty(prop: string): boolean;
    matchesElement(_element: any, _selector: string): boolean;
    containsElement(elm1: any, elm2: any): boolean;
    getParentElement(element: unknown): unknown;
    query(element: any, selector: string, multi: boolean): any[];
    computeStyle(element: any, prop: string, defaultValue?: string): string;
    animate(element: any, keyframes: Array<Map<string, string | number>>, duration: number, delay: number, easing: string, previousPlayers?: any[], scrubberAccessRequested?: boolean): AnimationPlayer;
    static ɵfac: i0.ɵɵFactoryDeclaration<ɵNoopAnimationDriver, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ɵNoopAnimationDriver>;
}

/**
 * @publicApi
 */
export declare class ɵNoopAnimationStyleNormalizer {
    normalizePropertyName(propertyName: string, errors: Error[]): string;
    normalizeStyleValue(userProvidedProperty: string, normalizedProperty: string, value: string | number, errors: Error[]): string;
}

export declare function ɵnormalizeKeyframes(keyframes: Array<ɵStyleData> | Array<ɵStyleDataMap>): Array<ɵStyleDataMap>;

export declare function ɵvalidateStyleProperty(prop: string): boolean;

export declare class ɵWebAnimationsDriver implements AnimationDriver {
    validateStyleProperty(prop: string): boolean;
    validateAnimatableStyleProperty(prop: string): boolean;
    matchesElement(_element: any, _selector: string): boolean;
    containsElement(elm1: any, elm2: any): boolean;
    getParentElement(element: unknown): unknown;
    query(element: any, selector: string, multi: boolean): any[];
    computeStyle(element: any, prop: string, defaultValue?: string): string;
    animate(element: any, keyframes: Array<Map<string, string | number>>, duration: number, delay: number, easing: string, previousPlayers?: AnimationPlayer[]): AnimationPlayer;
}

export declare class ɵWebAnimationsPlayer implements AnimationPlayer {
    element: any;
    keyframes: Array<ɵStyleDataMap>;
    options: {
        [key: string]: string | number;
    };
    private _specialStyles?;
    private _onDoneFns;
    private _onStartFns;
    private _onDestroyFns;
    private _duration;
    private _delay;
    private _initialized;
    private _finished;
    private _started;
    private _destroyed;
    private _finalKeyframe?;
    private _originalOnDoneFns;
    private _originalOnStartFns;
    readonly domPlayer: Animation;
    time: number;
    parentPlayer: AnimationPlayer | null;
    currentSnapshot: ɵStyleDataMap;
    constructor(element: any, keyframes: Array<ɵStyleDataMap>, options: {
        [key: string]: string | number;
    }, _specialStyles?: SpecialCasedStyles | null | undefined);
    private _onFinish;
    init(): void;
    private _buildPlayer;
    private _preparePlayerBeforeStart;
    private _convertKeyframesToObject;
    onStart(fn: () => void): void;
    onDone(fn: () => void): void;
    onDestroy(fn: () => void): void;
    play(): void;
    pause(): void;
    finish(): void;
    reset(): void;
    private _resetDomPlayerState;
    restart(): void;
    hasStarted(): boolean;
    destroy(): void;
    setPosition(p: number): void;
    getPosition(): number;
    get totalTime(): number;
    beforeDestroy(): void;
}

export declare class ɵWebAnimationsStyleNormalizer extends ɵAnimationStyleNormalizer {
    normalizePropertyName(propertyName: string, errors: Error[]): string;
    normalizeStyleValue(userProvidedProperty: string, normalizedProperty: string, value: string | number, errors: Error[]): string;
}

export { }
