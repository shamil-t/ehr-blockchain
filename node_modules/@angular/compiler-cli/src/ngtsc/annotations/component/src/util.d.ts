/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationTriggerNames } from '@angular/compiler';
import ts from 'typescript';
import { Reference } from '../../../imports';
import { ForeignFunctionResolver, ResolvedValue } from '../../../partial_evaluator';
import { ClassDeclaration } from '../../../reflection';
/**
 * Collect the animation names from the static evaluation result.
 * @param value the static evaluation result of the animations
 * @param animationTriggerNames the animation names collected and whether some names could not be
 *     statically evaluated.
 */
export declare function collectAnimationNames(value: ResolvedValue, animationTriggerNames: AnimationTriggerNames): void;
export declare function isAngularAnimationsReference(reference: Reference, symbolName: string): boolean;
export declare const animationTriggerResolver: ForeignFunctionResolver;
export declare function validateAndFlattenComponentImports(imports: ResolvedValue, expr: ts.Expression): {
    imports: Reference<ClassDeclaration>[];
    diagnostics: ts.Diagnostic[];
};
