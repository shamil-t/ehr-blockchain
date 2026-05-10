/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import ts from 'typescript';
/**
 * Allows to register a symbol as deferrable and keep track of its usage.
 *
 * This information is later used to determine whether it's safe to drop
 * a regular import of this symbol (actually the entire import declaration)
 * in favor of using a dynamic import for cases when `{#defer}` blocks are used.
 */
export declare class DeferredSymbolTracker {
    private readonly typeChecker;
    private readonly imports;
    constructor(typeChecker: ts.TypeChecker);
    /**
     * Given an import declaration node, extract the names of all imported symbols
     * and return them as a map where each symbol is a key and `AssumeEager` is a value.
     *
     * The logic recognizes the following import shapes:
     *
     * Case 1: `import {a, b as B} from 'a'`
     * Case 2: `import X from 'a'`
     * Case 3: `import * as x from 'a'`
     */
    private extractImportedSymbols;
    /**
     * Marks a given identifier and an associated import declaration as a candidate
     * for defer loading.
     */
    markAsDeferrableCandidate(identifier: ts.Identifier, importDecl: ts.ImportDeclaration): void;
    /**
     * Whether all symbols from a given import declaration have no references
     * in a source file, thus it's safe to use dynamic imports.
     */
    canDefer(importDecl: ts.ImportDeclaration): boolean;
    /**
     * Returns a set of import declarations that is safe to remove
     * from the current source file and generate dynamic imports instead.
     */
    getDeferrableImportDecls(): Set<ts.ImportDeclaration>;
    private lookupIdentifiersInSourceFile;
}
