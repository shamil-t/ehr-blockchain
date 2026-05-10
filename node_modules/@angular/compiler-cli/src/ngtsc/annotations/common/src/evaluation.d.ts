/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import ts from 'typescript';
import { Reference } from '../../../imports';
import { PartialEvaluator, ResolvedValue } from '../../../partial_evaluator';
import { ClassDeclaration, Decorator } from '../../../reflection';
export declare function resolveEnumValue(evaluator: PartialEvaluator, metadata: Map<string, ts.Expression>, field: string, enumSymbolName: string): number | null;
/** Determines if the result of an evaluation is a string array. */
export declare function isStringArray(resolvedValue: ResolvedValue): resolvedValue is string[];
export declare function isClassReferenceArray(resolvedValue: ResolvedValue): resolvedValue is Reference<ClassDeclaration>[];
export declare function isArray(value: ResolvedValue): value is Array<ResolvedValue>;
export declare function resolveLiteral(decorator: Decorator, literalCache: Map<Decorator, ts.ObjectLiteralExpression>): ts.ObjectLiteralExpression;
