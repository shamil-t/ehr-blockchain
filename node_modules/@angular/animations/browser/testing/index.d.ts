/**
 * @license Angular v16.2.12
 * (c) 2010-2022 Google LLC. https://angular.io/
 * License: MIT
 */


import { AnimationDriver } from '@angular/animations/browser';
import { AnimationPlayer } from '@angular/animations';
import { NoopAnimationPlayer } from '@angular/animations';
import { ɵStyleDataMap } from '@angular/animations';

/**
 * @publicApi
 */
export declare class MockAnimationDriver implements AnimationDriver {
    static log: AnimationPlayer[];
    validateStyleProperty(prop: string): boolean;
    validateAnimatableStyleProperty(prop: string): boolean;
    matchesElement(_element: any, _selector: string): boolean;
    containsElement(elm1: any, elm2: any): boolean;
    getParentElement(element: unknown): unknown;
    query(element: any, selector: string, multi: boolean): any[];
    computeStyle(element: any, prop: string, defaultValue?: string): string;
    animate(element: any, keyframes: Array<ɵStyleDataMap>, duration: number, delay: number, easing: string, previousPlayers?: any[]): MockAnimationPlayer;
}

/**
 * @publicApi
 */
export declare class MockAnimationPlayer extends NoopAnimationPlayer {
    element: any;
    keyframes: Array<ɵStyleDataMap>;
    duration: number;
    delay: number;
    easing: string;
    previousPlayers: any[];
    private __finished;
    private __started;
    previousStyles: ɵStyleDataMap;
    private _onInitFns;
    currentSnapshot: ɵStyleDataMap;
    private _keyframes;
    constructor(element: any, keyframes: Array<ɵStyleDataMap>, duration: number, delay: number, easing: string, previousPlayers: any[]);
    reset(): void;
    finish(): void;
    destroy(): void;
    play(): void;
    hasStarted(): boolean;
    beforeDestroy(): void;
}

export { }
