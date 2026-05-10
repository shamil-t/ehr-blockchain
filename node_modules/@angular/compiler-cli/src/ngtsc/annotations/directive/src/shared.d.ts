/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ParsedHostBindings, R3DirectiveMetadata, R3QueryMetadata } from '@angular/compiler';
import ts from 'typescript';
import { ReferenceEmitter } from '../../../imports';
import { ClassPropertyMapping, HostDirectiveMeta, InputMapping } from '../../../metadata';
import { PartialEvaluator } from '../../../partial_evaluator';
import { ClassDeclaration, ClassMember, Decorator, ReflectionHost } from '../../../reflection';
import { ReferencesRegistry } from '../../common';
/**
 * Helper function to extract metadata from a `Directive` or `Component`. `Directive`s without a
 * selector are allowed to be used for abstract base classes. These abstract directives should not
 * appear in the declarations of an `NgModule` and additional verification is done when processing
 * the module.
 */
export declare function extractDirectiveMetadata(clazz: ClassDeclaration, decorator: Readonly<Decorator | null>, reflector: ReflectionHost, evaluator: PartialEvaluator, refEmitter: ReferenceEmitter, referencesRegistry: ReferencesRegistry, isCore: boolean, annotateForClosureCompiler: boolean, defaultSelector?: string | null): {
    decorator: Map<string, ts.Expression>;
    metadata: R3DirectiveMetadata;
    inputs: ClassPropertyMapping<InputMapping>;
    outputs: ClassPropertyMapping;
    isStructural: boolean;
    hostDirectives: HostDirectiveMeta[] | null;
    rawHostDirectives: ts.Expression | null;
} | undefined;
export declare function extractQueryMetadata(exprNode: ts.Node, name: string, args: ReadonlyArray<ts.Expression>, propertyName: string, reflector: ReflectionHost, evaluator: PartialEvaluator): R3QueryMetadata;
export declare function extractHostBindings(members: ClassMember[], evaluator: PartialEvaluator, coreModule: string | undefined, metadata?: Map<string, ts.Expression>): ParsedHostBindings;
export declare function parseFieldStringArrayValue(directive: Map<string, ts.Expression>, field: string, evaluator: PartialEvaluator): null | string[];
