/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Tree } from '@angular-devkit/schematics';
import ts from '../third_party/github.com/Microsoft/TypeScript/lib/typescript';
/**
 * Checks whether the providers from a module are being imported in a `bootstrapApplication` call.
 * @param tree File tree of the project.
 * @param filePath Path of the file in which to check.
 * @param className Class name of the module to search for.
 * @deprecated Private utility that will be removed. Use `addRootImport` or `addRootProvider` from
 * `@schematics/angular/utility` instead.
 */
export declare function importsProvidersFrom(tree: Tree, filePath: string, className: string): boolean;
/**
 * Checks whether a providers function is being called in a `bootstrapApplication` call.
 * @param tree File tree of the project.
 * @param filePath Path of the file in which to check.
 * @param functionName Name of the function to search for.
 * @deprecated Private utility that will be removed. Use `addRootImport` or `addRootProvider` from
 * `@schematics/angular/utility` instead.
 */
export declare function callsProvidersFunction(tree: Tree, filePath: string, functionName: string): boolean;
/**
 * Adds an `importProvidersFrom` call to the `bootstrapApplication` call.
 * @param tree File tree of the project.
 * @param filePath Path to the file that should be updated.
 * @param moduleName Name of the module that should be imported.
 * @param modulePath Path from which to import the module.
 * @deprecated Private utility that will be removed. Use `addRootImport` or `addRootProvider` from
 * `@schematics/angular/utility` instead.
 */
export declare function addModuleImportToStandaloneBootstrap(tree: Tree, filePath: string, moduleName: string, modulePath: string): void;
/**
 * Adds a providers function call to the `bootstrapApplication` call.
 * @param tree File tree of the project.
 * @param filePath Path to the file that should be updated.
 * @param functionName Name of the function that should be called.
 * @param importPath Path from which to import the function.
 * @param args Arguments to use when calling the function.
 * @returns The file path that the provider was added to.
 * @deprecated Private utility that will be removed. Use `addRootImport` or `addRootProvider` from
 * `@schematics/angular/utility` instead.
 */
export declare function addFunctionalProvidersToStandaloneBootstrap(tree: Tree, filePath: string, functionName: string, importPath: string, args?: ts.Expression[]): string;
/**
 * Finds the call to `bootstrapApplication` within a file.
 * @deprecated Private utility that will be removed. Use `addRootImport` or `addRootProvider` from
 * `@schematics/angular/utility` instead.
 */
export declare function findBootstrapApplicationCall(sourceFile: ts.SourceFile): ts.CallExpression | null;
