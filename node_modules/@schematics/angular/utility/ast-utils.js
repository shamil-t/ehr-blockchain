"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasTopLevelIdentifier = exports.addRouteDeclarationToModule = exports.getRouterModuleDeclaration = exports.isImported = exports.addBootstrapToModule = exports.addExportToModule = exports.addProviderToModule = exports.addImportToModule = exports.addDeclarationToModule = exports.addSymbolToNgModuleMetadata = exports.getMetadataField = exports.getDecoratorMetadata = exports.insertAfterLastOccurrence = exports.findNode = exports.getSourceNodes = exports.findNodes = exports.insertImport = void 0;
const core_1 = require("@angular-devkit/core");
const ts = __importStar(require("../third_party/github.com/Microsoft/TypeScript/lib/typescript"));
const change_1 = require("./change");
/**
 * Add Import `import { symbolName } from fileName` if the import doesn't exit
 * already. Assumes fileToEdit can be resolved and accessed.
 * @param fileToEdit File we want to add import to.
 * @param symbolName Item to import.
 * @param fileName Path to the file.
 * @param isDefault If true, import follows style for importing default exports.
 * @param alias Alias that the symbol should be inserted under.
 * @return Change
 */
function insertImport(source, fileToEdit, symbolName, fileName, isDefault = false, alias) {
    const rootNode = source;
    const allImports = findNodes(rootNode, ts.isImportDeclaration);
    const importExpression = alias ? `${symbolName} as ${alias}` : symbolName;
    // get nodes that map to import statements from the file fileName
    const relevantImports = allImports.filter((node) => {
        return ts.isStringLiteralLike(node.moduleSpecifier) && node.moduleSpecifier.text === fileName;
    });
    if (relevantImports.length > 0) {
        const hasNamespaceImport = relevantImports.some((node) => {
            return node.importClause?.namedBindings?.kind === ts.SyntaxKind.NamespaceImport;
        });
        // if imports * from fileName, don't add symbolName
        if (hasNamespaceImport) {
            return new change_1.NoopChange();
        }
        const imports = relevantImports.flatMap((node) => {
            return node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)
                ? node.importClause.namedBindings.elements
                : [];
        });
        // insert import if it's not there
        if (!imports.some((node) => (node.propertyName || node.name).text === symbolName)) {
            const fallbackPos = findNodes(relevantImports[0], ts.SyntaxKind.CloseBraceToken)[0].getStart() ||
                findNodes(relevantImports[0], ts.SyntaxKind.FromKeyword)[0].getStart();
            return insertAfterLastOccurrence(imports, `, ${importExpression}`, fileToEdit, fallbackPos);
        }
        return new change_1.NoopChange();
    }
    // no such import declaration exists
    const useStrict = findNodes(rootNode, ts.isStringLiteral).filter((n) => n.text === 'use strict');
    let fallbackPos = 0;
    if (useStrict.length > 0) {
        fallbackPos = useStrict[0].end;
    }
    const open = isDefault ? '' : '{ ';
    const close = isDefault ? '' : ' }';
    // if there are no imports or 'use strict' statement, insert import at beginning of file
    const insertAtBeginning = allImports.length === 0 && useStrict.length === 0;
    const separator = insertAtBeginning ? '' : ';\n';
    const toInsert = `${separator}import ${open}${importExpression}${close}` +
        ` from '${fileName}'${insertAtBeginning ? ';\n' : ''}`;
    return insertAfterLastOccurrence(allImports, toInsert, fileToEdit, fallbackPos, ts.SyntaxKind.StringLiteral);
}
exports.insertImport = insertImport;
function findNodes(node, kindOrGuard, max = Infinity, recursive = false) {
    if (!node || max == 0) {
        return [];
    }
    const test = typeof kindOrGuard === 'function'
        ? kindOrGuard
        : (node) => node.kind === kindOrGuard;
    const arr = [];
    if (test(node)) {
        arr.push(node);
        max--;
    }
    if (max > 0 && (recursive || !test(node))) {
        for (const child of node.getChildren()) {
            findNodes(child, test, max, recursive).forEach((node) => {
                if (max > 0) {
                    arr.push(node);
                }
                max--;
            });
            if (max <= 0) {
                break;
            }
        }
    }
    return arr;
}
exports.findNodes = findNodes;
/**
 * Get all the nodes from a source.
 * @param sourceFile The source file object.
 * @returns {Array<ts.Node>} An array of all the nodes in the source.
 */
function getSourceNodes(sourceFile) {
    const nodes = [sourceFile];
    const result = [];
    while (nodes.length > 0) {
        const node = nodes.shift();
        if (node) {
            result.push(node);
            if (node.getChildCount(sourceFile) >= 0) {
                nodes.unshift(...node.getChildren());
            }
        }
    }
    return result;
}
exports.getSourceNodes = getSourceNodes;
function findNode(node, kind, text) {
    if (node.kind === kind && node.getText() === text) {
        return node;
    }
    let foundNode = null;
    ts.forEachChild(node, (childNode) => {
        foundNode = foundNode || findNode(childNode, kind, text);
    });
    return foundNode;
}
exports.findNode = findNode;
/**
 * Helper for sorting nodes.
 * @return function to sort nodes in increasing order of position in sourceFile
 */
function nodesByPosition(first, second) {
    return first.getStart() - second.getStart();
}
/**
 * Insert `toInsert` after the last occurence of `ts.SyntaxKind[nodes[i].kind]`
 * or after the last of occurence of `syntaxKind` if the last occurence is a sub child
 * of ts.SyntaxKind[nodes[i].kind] and save the changes in file.
 *
 * @param nodes insert after the last occurence of nodes
 * @param toInsert string to insert
 * @param file file to insert changes into
 * @param fallbackPos position to insert if toInsert happens to be the first occurence
 * @param syntaxKind the ts.SyntaxKind of the subchildren to insert after
 * @return Change instance
 * @throw Error if toInsert is first occurence but fall back is not set
 */
function insertAfterLastOccurrence(nodes, toInsert, file, fallbackPos, syntaxKind) {
    let lastItem;
    for (const node of nodes) {
        if (!lastItem || lastItem.getStart() < node.getStart()) {
            lastItem = node;
        }
    }
    if (syntaxKind && lastItem) {
        lastItem = findNodes(lastItem, syntaxKind).sort(nodesByPosition).pop();
    }
    if (!lastItem && fallbackPos == undefined) {
        throw new Error(`tried to insert ${toInsert} as first occurence with no fallback position`);
    }
    const lastItemPosition = lastItem ? lastItem.getEnd() : fallbackPos;
    return new change_1.InsertChange(file, lastItemPosition, toInsert);
}
exports.insertAfterLastOccurrence = insertAfterLastOccurrence;
function _angularImportsFromNode(node) {
    const ms = node.moduleSpecifier;
    let modulePath;
    switch (ms.kind) {
        case ts.SyntaxKind.StringLiteral:
            modulePath = ms.text;
            break;
        default:
            return {};
    }
    if (!modulePath.startsWith('@angular/')) {
        return {};
    }
    if (node.importClause) {
        if (node.importClause.name) {
            // This is of the form `import Name from 'path'`. Ignore.
            return {};
        }
        else if (node.importClause.namedBindings) {
            const nb = node.importClause.namedBindings;
            if (nb.kind == ts.SyntaxKind.NamespaceImport) {
                // This is of the form `import * as name from 'path'`. Return `name.`.
                return {
                    [nb.name.text + '.']: modulePath,
                };
            }
            else {
                // This is of the form `import {a,b,c} from 'path'`
                const namedImports = nb;
                return namedImports.elements
                    .map((is) => (is.propertyName ? is.propertyName.text : is.name.text))
                    .reduce((acc, curr) => {
                    acc[curr] = modulePath;
                    return acc;
                }, {});
            }
        }
        return {};
    }
    else {
        // This is of the form `import 'path';`. Nothing to do.
        return {};
    }
}
function getDecoratorMetadata(source, identifier, module) {
    const angularImports = findNodes(source, ts.isImportDeclaration)
        .map((node) => _angularImportsFromNode(node))
        .reduce((acc, current) => {
        for (const key of Object.keys(current)) {
            acc[key] = current[key];
        }
        return acc;
    }, {});
    return getSourceNodes(source)
        .filter((node) => {
        return (node.kind == ts.SyntaxKind.Decorator &&
            node.expression.kind == ts.SyntaxKind.CallExpression);
    })
        .map((node) => node.expression)
        .filter((expr) => {
        if (expr.expression.kind == ts.SyntaxKind.Identifier) {
            const id = expr.expression;
            return id.text == identifier && angularImports[id.text] === module;
        }
        else if (expr.expression.kind == ts.SyntaxKind.PropertyAccessExpression) {
            // This covers foo.NgModule when importing * as foo.
            const paExpr = expr.expression;
            // If the left expression is not an identifier, just give up at that point.
            if (paExpr.expression.kind !== ts.SyntaxKind.Identifier) {
                return false;
            }
            const id = paExpr.name.text;
            const moduleId = paExpr.expression.text;
            return id === identifier && angularImports[moduleId + '.'] === module;
        }
        return false;
    })
        .filter((expr) => expr.arguments[0] && expr.arguments[0].kind == ts.SyntaxKind.ObjectLiteralExpression)
        .map((expr) => expr.arguments[0]);
}
exports.getDecoratorMetadata = getDecoratorMetadata;
function getMetadataField(node, metadataField) {
    return (node.properties
        .filter(ts.isPropertyAssignment)
        // Filter out every fields that's not "metadataField". Also handles string literals
        // (but not expressions).
        .filter(({ name }) => {
        return (ts.isIdentifier(name) || ts.isStringLiteral(name)) && name.text === metadataField;
    }));
}
exports.getMetadataField = getMetadataField;
function addSymbolToNgModuleMetadata(source, ngModulePath, metadataField, symbolName, importPath = null) {
    const nodes = getDecoratorMetadata(source, 'NgModule', '@angular/core');
    const node = nodes[0];
    // Find the decorator declaration.
    if (!node || !ts.isObjectLiteralExpression(node)) {
        return [];
    }
    // Get all the children property assignment of object literals.
    const matchingProperties = getMetadataField(node, metadataField);
    if (matchingProperties.length == 0) {
        // We haven't found the field in the metadata declaration. Insert a new field.
        let position;
        let toInsert;
        if (node.properties.length == 0) {
            position = node.getEnd() - 1;
            toInsert = `\n  ${metadataField}: [\n${core_1.tags.indentBy(4) `${symbolName}`}\n  ]\n`;
        }
        else {
            const childNode = node.properties[node.properties.length - 1];
            position = childNode.getEnd();
            // Get the indentation of the last element, if any.
            const text = childNode.getFullText(source);
            const matches = text.match(/^(\r?\n)(\s*)/);
            if (matches) {
                toInsert =
                    `,${matches[0]}${metadataField}: [${matches[1]}` +
                        `${core_1.tags.indentBy(matches[2].length + 2) `${symbolName}`}${matches[0]}]`;
            }
            else {
                toInsert = `, ${metadataField}: [${symbolName}]`;
            }
        }
        if (importPath !== null) {
            return [
                new change_1.InsertChange(ngModulePath, position, toInsert),
                insertImport(source, ngModulePath, symbolName.replace(/\..*$/, ''), importPath),
            ];
        }
        else {
            return [new change_1.InsertChange(ngModulePath, position, toInsert)];
        }
    }
    const assignment = matchingProperties[0];
    // If it's not an array, nothing we can do really.
    if (!ts.isPropertyAssignment(assignment) ||
        !ts.isArrayLiteralExpression(assignment.initializer)) {
        return [];
    }
    let expresssion;
    const assignmentInit = assignment.initializer;
    const elements = assignmentInit.elements;
    if (elements.length) {
        const symbolsArray = elements.map((node) => core_1.tags.oneLine `${node.getText()}`);
        if (symbolsArray.includes(core_1.tags.oneLine `${symbolName}`)) {
            return [];
        }
        expresssion = elements[elements.length - 1];
    }
    else {
        expresssion = assignmentInit;
    }
    let toInsert;
    let position = expresssion.getEnd();
    if (ts.isArrayLiteralExpression(expresssion)) {
        // We found the field but it's empty. Insert it just before the `]`.
        position--;
        toInsert = `\n${core_1.tags.indentBy(4) `${symbolName}`}\n  `;
    }
    else {
        // Get the indentation of the last element, if any.
        const text = expresssion.getFullText(source);
        const matches = text.match(/^(\r?\n)(\s*)/);
        if (matches) {
            toInsert = `,${matches[1]}${core_1.tags.indentBy(matches[2].length) `${symbolName}`}`;
        }
        else {
            toInsert = `, ${symbolName}`;
        }
    }
    if (importPath !== null) {
        return [
            new change_1.InsertChange(ngModulePath, position, toInsert),
            insertImport(source, ngModulePath, symbolName.replace(/\..*$/, ''), importPath),
        ];
    }
    return [new change_1.InsertChange(ngModulePath, position, toInsert)];
}
exports.addSymbolToNgModuleMetadata = addSymbolToNgModuleMetadata;
/**
 * Custom function to insert a declaration (component, pipe, directive)
 * into NgModule declarations. It also imports the component.
 */
function addDeclarationToModule(source, modulePath, classifiedName, importPath) {
    return addSymbolToNgModuleMetadata(source, modulePath, 'declarations', classifiedName, importPath);
}
exports.addDeclarationToModule = addDeclarationToModule;
/**
 * Custom function to insert an NgModule into NgModule imports. It also imports the module.
 */
function addImportToModule(source, modulePath, classifiedName, importPath) {
    return addSymbolToNgModuleMetadata(source, modulePath, 'imports', classifiedName, importPath);
}
exports.addImportToModule = addImportToModule;
/**
 * Custom function to insert a provider into NgModule. It also imports it.
 */
function addProviderToModule(source, modulePath, classifiedName, importPath) {
    return addSymbolToNgModuleMetadata(source, modulePath, 'providers', classifiedName, importPath);
}
exports.addProviderToModule = addProviderToModule;
/**
 * Custom function to insert an export into NgModule. It also imports it.
 */
function addExportToModule(source, modulePath, classifiedName, importPath) {
    return addSymbolToNgModuleMetadata(source, modulePath, 'exports', classifiedName, importPath);
}
exports.addExportToModule = addExportToModule;
/**
 * Custom function to insert an export into NgModule. It also imports it.
 */
function addBootstrapToModule(source, modulePath, classifiedName, importPath) {
    return addSymbolToNgModuleMetadata(source, modulePath, 'bootstrap', classifiedName, importPath);
}
exports.addBootstrapToModule = addBootstrapToModule;
/**
 * Determine if an import already exists.
 */
function isImported(source, classifiedName, importPath) {
    const allNodes = getSourceNodes(source);
    const matchingNodes = allNodes
        .filter(ts.isImportDeclaration)
        .filter((imp) => ts.isStringLiteral(imp.moduleSpecifier) && imp.moduleSpecifier.text === importPath)
        .filter((imp) => {
        if (!imp.importClause) {
            return false;
        }
        const nodes = findNodes(imp.importClause, ts.isImportSpecifier).filter((n) => n.getText() === classifiedName);
        return nodes.length > 0;
    });
    return matchingNodes.length > 0;
}
exports.isImported = isImported;
/**
 * Returns the RouterModule declaration from NgModule metadata, if any.
 */
function getRouterModuleDeclaration(source) {
    const result = getDecoratorMetadata(source, 'NgModule', '@angular/core');
    const node = result[0];
    if (!node || !ts.isObjectLiteralExpression(node)) {
        return undefined;
    }
    const matchingProperties = getMetadataField(node, 'imports');
    if (!matchingProperties) {
        return;
    }
    const assignment = matchingProperties[0];
    if (assignment.initializer.kind !== ts.SyntaxKind.ArrayLiteralExpression) {
        return;
    }
    const arrLiteral = assignment.initializer;
    return arrLiteral.elements
        .filter((el) => el.kind === ts.SyntaxKind.CallExpression)
        .find((el) => el.getText().startsWith('RouterModule'));
}
exports.getRouterModuleDeclaration = getRouterModuleDeclaration;
/**
 * Adds a new route declaration to a router module (i.e. has a RouterModule declaration)
 */
function addRouteDeclarationToModule(source, fileToAdd, routeLiteral) {
    const routerModuleExpr = getRouterModuleDeclaration(source);
    if (!routerModuleExpr) {
        throw new Error(`Couldn't find a route declaration in ${fileToAdd}.\n` +
            `Use the '--module' option to specify a different routing module.`);
    }
    const scopeConfigMethodArgs = routerModuleExpr.arguments;
    if (!scopeConfigMethodArgs.length) {
        const { line } = source.getLineAndCharacterOfPosition(routerModuleExpr.getStart());
        throw new Error(`The router module method doesn't have arguments ` + `at line ${line} in ${fileToAdd}`);
    }
    let routesArr;
    const routesArg = scopeConfigMethodArgs[0];
    // Check if the route declarations array is
    // an inlined argument of RouterModule or a standalone variable
    if (ts.isArrayLiteralExpression(routesArg)) {
        routesArr = routesArg;
    }
    else {
        const routesVarName = routesArg.getText();
        let routesVar;
        if (routesArg.kind === ts.SyntaxKind.Identifier) {
            routesVar = source.statements.filter(ts.isVariableStatement).find((v) => {
                return v.declarationList.declarations[0].name.getText() === routesVarName;
            });
        }
        if (!routesVar) {
            const { line } = source.getLineAndCharacterOfPosition(routesArg.getStart());
            throw new Error(`No route declaration array was found that corresponds ` +
                `to router module at line ${line} in ${fileToAdd}`);
        }
        routesArr = findNodes(routesVar, ts.SyntaxKind.ArrayLiteralExpression, 1)[0];
    }
    const occurrencesCount = routesArr.elements.length;
    const text = routesArr.getFullText(source);
    let route = routeLiteral;
    let insertPos = routesArr.elements.pos;
    if (occurrencesCount > 0) {
        const lastRouteLiteral = [...routesArr.elements].pop();
        const lastRouteIsWildcard = ts.isObjectLiteralExpression(lastRouteLiteral) &&
            lastRouteLiteral.properties.some((n) => ts.isPropertyAssignment(n) &&
                ts.isIdentifier(n.name) &&
                n.name.text === 'path' &&
                ts.isStringLiteral(n.initializer) &&
                n.initializer.text === '**');
        const indentation = text.match(/\r?\n(\r?)\s*/) || [];
        const routeText = `${indentation[0] || ' '}${routeLiteral}`;
        // Add the new route before the wildcard route
        // otherwise we'll always redirect to the wildcard route
        if (lastRouteIsWildcard) {
            insertPos = lastRouteLiteral.pos;
            route = `${routeText},`;
        }
        else {
            insertPos = lastRouteLiteral.end;
            route = `,${routeText}`;
        }
    }
    return new change_1.InsertChange(fileToAdd, insertPos, route);
}
exports.addRouteDeclarationToModule = addRouteDeclarationToModule;
/** Asserts if the specified node is a named declaration (e.g. class, interface). */
function isNamedNode(node) {
    return !!node.name && ts.isIdentifier(node.name);
}
/**
 * Determines if a SourceFile has a top-level declaration whose name matches a specific symbol.
 * Can be used to avoid conflicts when inserting new imports into a file.
 * @param sourceFile File in which to search.
 * @param symbolName Name of the symbol to search for.
 * @param skipModule Path of the module that the symbol may have been imported from. Used to
 * avoid false positives where the same symbol we're looking for may have been imported.
 */
function hasTopLevelIdentifier(sourceFile, symbolName, skipModule = null) {
    for (const node of sourceFile.statements) {
        if (isNamedNode(node) && node.name.text === symbolName) {
            return true;
        }
        if (ts.isVariableStatement(node) &&
            node.declarationList.declarations.some((decl) => {
                return isNamedNode(decl) && decl.name.text === symbolName;
            })) {
            return true;
        }
        if (ts.isImportDeclaration(node) &&
            ts.isStringLiteralLike(node.moduleSpecifier) &&
            node.moduleSpecifier.text !== skipModule &&
            node.importClause?.namedBindings &&
            ts.isNamedImports(node.importClause.namedBindings) &&
            node.importClause.namedBindings.elements.some((el) => el.name.text === symbolName)) {
            return true;
        }
    }
    return false;
}
exports.hasTopLevelIdentifier = hasTopLevelIdentifier;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvc2NoZW1hdGljcy9hbmd1bGFyL3V0aWxpdHkvYXN0LXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0NBQTRDO0FBQzVDLGtHQUFvRjtBQUNwRixxQ0FBNEQ7QUFFNUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsU0FBZ0IsWUFBWSxDQUMxQixNQUFxQixFQUNyQixVQUFrQixFQUNsQixVQUFrQixFQUNsQixRQUFnQixFQUNoQixTQUFTLEdBQUcsS0FBSyxFQUNqQixLQUFjO0lBRWQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDO0lBQ3hCLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDL0QsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxPQUFPLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7SUFFMUUsaUVBQWlFO0lBQ2pFLE1BQU0sZUFBZSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUNqRCxPQUFPLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO0lBQ2hHLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxlQUFlLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUM5QixNQUFNLGtCQUFrQixHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUN2RCxPQUFPLElBQUksQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLElBQUksS0FBSyxFQUFFLENBQUMs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QyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7WUFDdEQsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELElBQ0UsRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQztZQUM1QixJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDOUMsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDO1lBQzVELENBQUMsQ0FBQyxFQUNGO1lBQ0EsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELElBQ0UsRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQztZQUM1QixFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUM1QyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksS0FBSyxVQUFVO1lBQ3hDLElBQUksQ0FBQyxZQUFZLEVBQUUsYUFBYTtZQUNoQyxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDO1lBQ2xELElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxFQUNsRjtZQUNBLE9BQU8sSUFBSSxDQUFDO1NBQ2I7S0FDRjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQWhDRCxzREFnQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgdGFncyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJy4uL3RoaXJkX3BhcnR5L2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvbGliL3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgQ2hhbmdlLCBJbnNlcnRDaGFuZ2UsIE5vb3BDaGFuZ2UgfSBmcm9tICcuL2NoYW5nZSc7XG5cbi8qKlxuICogQWRkIEltcG9ydCBgaW1wb3J0IHsgc3ltYm9sTmFtZSB9IGZyb20gZmlsZU5hbWVgIGlmIHRoZSBpbXBvcnQgZG9lc24ndCBleGl0XG4gKiBhbHJlYWR5LiBBc3N1bWVzIGZpbGVUb0VkaXQgY2FuIGJlIHJlc29sdmVkIGFuZCBhY2Nlc3NlZC5cbiAqIEBwYXJhbSBmaWxlVG9FZGl0IEZpbGUgd2Ugd2FudCB0byBhZGQgaW1wb3J0IHRvLlxuICogQHBhcmFtIHN5bWJvbE5hbWUgSXRlbSB0byBpbXBvcnQuXG4gKiBAcGFyYW0gZmlsZU5hbWUgUGF0aCB0byB0aGUgZmlsZS5cbiAqIEBwYXJhbSBpc0RlZmF1bHQgSWYgdHJ1ZSwgaW1wb3J0IGZvbGxvd3Mgc3R5bGUgZm9yIGltcG9ydGluZyBkZWZhdWx0IGV4cG9ydHMuXG4gKiBAcGFyYW0gYWxpYXMgQWxpYXMgdGhhdCB0aGUgc3ltYm9sIHNob3VsZCBiZSBpbnNlcnRlZCB1bmRlci5cbiAqIEByZXR1cm4gQ2hhbmdlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRJbXBvcnQoXG4gIHNvdXJjZTogdHMuU291cmNlRmlsZSxcbiAgZmlsZVRvRWRpdDogc3RyaW5nLFxuICBzeW1ib2xOYW1lOiBzdHJpbmcsXG4gIGZpbGVOYW1lOiBzdHJpbmcsXG4gIGlzRGVmYXVsdCA9IGZhbHNlLFxuICBhbGlhcz86IHN0cmluZyxcbik6IENoYW5nZSB7XG4gIGNvbnN0IHJvb3ROb2RlID0gc291cmNlO1xuICBjb25zdCBhbGxJbXBvcnRzID0gZmluZE5vZGVzKHJvb3ROb2RlLCB0cy5pc0ltcG9ydERlY2xhcmF0aW9uKTtcbiAgY29uc3QgaW1wb3J0RXhwcmVzc2lvbiA9IGFsaWFzID8gYCR7c3ltYm9sTmFtZX0gYXMgJHthbGlhc31gIDogc3ltYm9sTmFtZTtcblxuICAvLyBnZXQgbm9kZXMgdGhhdCBtYXAgdG8gaW1wb3J0IHN0YXRlbWVudHMgZnJvbSB0aGUgZmlsZSBmaWxlTmFtZVxuICBjb25zdCByZWxldmFudEltcG9ydHMgPSBhbGxJbXBvcnRzLmZpbHRlcigobm9kZSkgPT4ge1xuICAgIHJldHVybiB0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKG5vZGUubW9kdWxlU3BlY2lmaWVyKSAmJiBub2RlLm1vZHVsZVNwZWNpZmllci50ZXh0ID09PSBmaWxlTmFtZTtcbiAgfSk7XG5cbiAgaWYgKHJlbGV2YW50SW1wb3J0cy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgaGFzTmFtZXNwYWNlSW1wb3J0ID0gcmVsZXZhbnRJbXBvcnRzLnNvbWUoKG5vZGUpID0+IHtcbiAgICAgIHJldHVybiBub2RlLmltcG9ydENsYXVzZT8ubmFtZWRCaW5kaW5ncz8ua2luZCA9PT0gdHMuU3ludGF4S2luZC5OYW1lc3BhY2VJbXBvcnQ7XG4gICAgfSk7XG5cbiAgICAvLyBpZiBpbXBvcnRzICogZnJvbSBmaWxlTmFtZSwgZG9uJ3QgYWRkIHN5bWJvbE5hbWVcbiAgICBpZiAoaGFzTmFtZXNwYWNlSW1wb3J0KSB7XG4gICAgICByZXR1cm4gbmV3IE5vb3BDaGFuZ2UoKTtcbiAgICB9XG5cbiAgICBjb25zdCBpbXBvcnRzID0gcmVsZXZhbnRJbXBvcnRzLmZsYXRNYXAoKG5vZGUpID0+IHtcbiAgICAgIHJldHVybiBub2RlLmltcG9ydENsYXVzZT8ubmFtZWRCaW5kaW5ncyAmJiB0cy5pc05hbWVkSW1wb3J0cyhub2RlLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzKVxuICAgICAgICA/IG5vZGUuaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3MuZWxlbWVudHNcbiAgICAgICAgOiBbXTtcbiAgICB9KTtcblxuICAgIC8vIGluc2VydCBpbXBvcnQgaWYgaXQncyBub3QgdGhlcmVcbiAgICBpZiAoIWltcG9ydHMuc29tZSgobm9kZSkgPT4gKG5vZGUucHJvcGVydHlOYW1lIHx8IG5vZGUubmFtZSkudGV4dCA9PT0gc3ltYm9sTmFtZSkpIHtcbiAgICAgIGNvbnN0IGZhbGxiYWNrUG9zID1cbiAgICAgICAgZmluZE5vZGVzKHJlbGV2YW50SW1wb3J0c1swXSwgdHMuU3ludGF4S2luZC5DbG9zZUJyYWNlVG9rZW4pWzBdLmdldFN0YXJ0KCkgfHxcbiAgICAgICAgZmluZE5vZGVzKHJlbGV2YW50SW1wb3J0c1swXSwgdHMuU3ludGF4S2luZC5Gcm9tS2V5d29yZClbMF0uZ2V0U3RhcnQoKTtcblxuICAgICAgcmV0dXJuIGluc2VydEFmdGVyTGFzdE9jY3VycmVuY2UoaW1wb3J0cywgYCwgJHtpbXBvcnRFeHByZXNzaW9ufWAsIGZpbGVUb0VkaXQsIGZhbGxiYWNrUG9zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE5vb3BDaGFuZ2UoKTtcbiAgfVxuXG4gIC8vIG5vIHN1Y2ggaW1wb3J0IGRlY2xhcmF0aW9uIGV4aXN0c1xuICBjb25zdCB1c2VTdHJpY3QgPSBmaW5kTm9kZXMocm9vdE5vZGUsIHRzLmlzU3RyaW5nTGl0ZXJhbCkuZmlsdGVyKChuKSA9PiBuLnRleHQgPT09ICd1c2Ugc3RyaWN0Jyk7XG4gIGxldCBmYWxsYmFja1BvcyA9IDA7XG4gIGlmICh1c2VTdHJpY3QubGVuZ3RoID4gMCkge1xuICAgIGZhbGxiYWNrUG9zID0gdXNlU3RyaWN0WzBdLmVuZDtcbiAgfVxuICBjb25zdCBvcGVuID0gaXNEZWZhdWx0ID8gJycgOiAneyAnO1xuICBjb25zdCBjbG9zZSA9IGlzRGVmYXVsdCA/ICcnIDogJyB9JztcbiAgLy8gaWYgdGhlcmUgYXJlIG5vIGltcG9ydHMgb3IgJ3VzZSBzdHJpY3QnIHN0YXRlbWVudCwgaW5zZXJ0IGltcG9ydCBhdCBiZWdpbm5pbmcgb2YgZmlsZVxuICBjb25zdCBpbnNlcnRBdEJlZ2lubmluZyA9IGFsbEltcG9ydHMubGVuZ3RoID09PSAwICYmIHVzZVN0cmljdC5sZW5ndGggPT09IDA7XG4gIGNvbnN0IHNlcGFyYXRvciA9IGluc2VydEF0QmVnaW5uaW5nID8gJycgOiAnO1xcbic7XG4gIGNvbnN0IHRvSW5zZXJ0ID1cbiAgICBgJHtzZXBhcmF0b3J9aW1wb3J0ICR7b3Blbn0ke2ltcG9ydEV4cHJlc3Npb259JHtjbG9zZX1gICtcbiAgICBgIGZyb20gJyR7ZmlsZU5hbWV9JyR7aW5zZXJ0QXRCZWdpbm5pbmcgPyAnO1xcbicgOiAnJ31gO1xuXG4gIHJldHVybiBpbnNlcnRBZnRlckxhc3RPY2N1cnJlbmNlKFxuICAgIGFsbEltcG9ydHMsXG4gICAgdG9JbnNlcnQsXG4gICAgZmlsZVRvRWRpdCxcbiAgICBmYWxsYmFja1BvcyxcbiAgICB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWwsXG4gICk7XG59XG5cbi8qKlxuICogRmluZCBhbGwgbm9kZXMgZnJvbSB0aGUgQVNUIGluIHRoZSBzdWJ0cmVlIG9mIG5vZGUgb2YgU3ludGF4S2luZCBraW5kLlxuICogQHBhcmFtIG5vZGVcbiAqIEBwYXJhbSBraW5kXG4gKiBAcGFyYW0gbWF4IFRoZSBtYXhpbXVtIG51bWJlciBvZiBpdGVtcyB0byByZXR1cm4uXG4gKiBAcGFyYW0gcmVjdXJzaXZlIENvbnRpbnVlIGxvb2tpbmcgZm9yIG5vZGVzIG9mIGtpbmQgcmVjdXJzaXZlIHVudGlsIGVuZFxuICogdGhlIGxhc3QgY2hpbGQgZXZlbiB3aGVuIG5vZGUgb2Yga2luZCBoYXMgYmVlbiBmb3VuZC5cbiAqIEByZXR1cm4gYWxsIG5vZGVzIG9mIGtpbmQsIG9yIFtdIGlmIG5vbmUgaXMgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmROb2RlcyhcbiAgbm9kZTogdHMuTm9kZSxcbiAga2luZDogdHMuU3ludGF4S2luZCxcbiAgbWF4PzogbnVtYmVyLFxuICByZWN1cnNpdmU/OiBib29sZWFuLFxuKTogdHMuTm9kZVtdO1xuXG4vKipcbiAqIEZpbmQgYWxsIG5vZGVzIGZyb20gdGhlIEFTVCBpbiB0aGUgc3VidHJlZSB0aGF0IHNhdGlzZnkgYSB0eXBlIGd1YXJkLlxuICogQHBhcmFtIG5vZGVcbiAqIEBwYXJhbSBndWFyZFxuICogQHBhcmFtIG1heCBUaGUgbWF4aW11bSBudW1iZXIgb2YgaXRlbXMgdG8gcmV0dXJuLlxuICogQHBhcmFtIHJlY3Vyc2l2ZSBDb250aW51ZSBsb29raW5nIGZvciBub2RlcyBvZiBraW5kIHJlY3Vyc2l2ZSB1bnRpbCBlbmRcbiAqIHRoZSBsYXN0IGNoaWxkIGV2ZW4gd2hlbiBub2RlIG9mIGtpbmQgaGFzIGJlZW4gZm91bmQuXG4gKiBAcmV0dXJuIGFsbCBub2RlcyB0aGF0IHNhdGlzZnkgdGhlIHR5cGUgZ3VhcmQsIG9yIFtdIGlmIG5vbmUgaXMgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmROb2RlczxUIGV4dGVuZHMgdHMuTm9kZT4oXG4gIG5vZGU6IHRzLk5vZGUsXG4gIGd1YXJkOiAobm9kZTogdHMuTm9kZSkgPT4gbm9kZSBpcyBULFxuICBtYXg/OiBudW1iZXIsXG4gIHJlY3Vyc2l2ZT86IGJvb2xlYW4sXG4pOiBUW107XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTm9kZXM8VCBleHRlbmRzIHRzLk5vZGU+KFxuICBub2RlOiB0cy5Ob2RlLFxuICBraW5kT3JHdWFyZDogdHMuU3ludGF4S2luZCB8ICgobm9kZTogdHMuTm9kZSkgPT4gbm9kZSBpcyBUKSxcbiAgbWF4ID0gSW5maW5pdHksXG4gIHJlY3Vyc2l2ZSA9IGZhbHNlLFxuKTogVFtdIHtcbiAgaWYgKCFub2RlIHx8IG1heCA9PSAwKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgY29uc3QgdGVzdCA9XG4gICAgdHlwZW9mIGtpbmRPckd1YXJkID09PSAnZnVuY3Rpb24nXG4gICAgICA/IGtpbmRPckd1YXJkXG4gICAgICA6IChub2RlOiB0cy5Ob2RlKTogbm9kZSBpcyBUID0+IG5vZGUua2luZCA9PT0ga2luZE9yR3VhcmQ7XG5cbiAgY29uc3QgYXJyOiBUW10gPSBbXTtcbiAgaWYgKHRlc3Qobm9kZSkpIHtcbiAgICBhcnIucHVzaChub2RlKTtcbiAgICBtYXgtLTtcbiAgfVxuICBpZiAobWF4ID4gMCAmJiAocmVjdXJzaXZlIHx8ICF0ZXN0KG5vZGUpKSkge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5nZXRDaGlsZHJlbigpKSB7XG4gICAgICBmaW5kTm9kZXMoY2hpbGQsIHRlc3QsIG1heCwgcmVjdXJzaXZlKS5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgIGlmIChtYXggPiAwKSB7XG4gICAgICAgICAgYXJyLnB1c2gobm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgbWF4LS07XG4gICAgICB9KTtcblxuICAgICAgaWYgKG1heCA8PSAwKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhcnI7XG59XG5cbi8qKlxuICogR2V0IGFsbCB0aGUgbm9kZXMgZnJvbSBhIHNvdXJjZS5cbiAqIEBwYXJhbSBzb3VyY2VGaWxlIFRoZSBzb3VyY2UgZmlsZSBvYmplY3QuXG4gKiBAcmV0dXJucyB7QXJyYXk8dHMuTm9kZT59IEFuIGFycmF5IG9mIGFsbCB0aGUgbm9kZXMgaW4gdGhlIHNvdXJjZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNvdXJjZU5vZGVzKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiB0cy5Ob2RlW10ge1xuICBjb25zdCBub2RlczogdHMuTm9kZVtdID0gW3NvdXJjZUZpbGVdO1xuICBjb25zdCByZXN1bHQ6IHRzLk5vZGVbXSA9IFtdO1xuXG4gIHdoaWxlIChub2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVzLnNoaWZ0KCk7XG5cbiAgICBpZiAobm9kZSkge1xuICAgICAgcmVzdWx0LnB1c2gobm9kZSk7XG4gICAgICBpZiAobm9kZS5nZXRDaGlsZENvdW50KHNvdXJjZUZpbGUpID49IDApIHtcbiAgICAgICAgbm9kZXMudW5zaGlmdCguLi5ub2RlLmdldENoaWxkcmVuKCkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTm9kZShub2RlOiB0cy5Ob2RlLCBraW5kOiB0cy5TeW50YXhLaW5kLCB0ZXh0OiBzdHJpbmcpOiB0cy5Ob2RlIHwgbnVsbCB7XG4gIGlmIChub2RlLmtpbmQgPT09IGtpbmQgJiYgbm9kZS5nZXRUZXh0KCkgPT09IHRleHQpIHtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIGxldCBmb3VuZE5vZGU6IHRzLk5vZGUgfCBudWxsID0gbnVsbDtcbiAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIChjaGlsZE5vZGUpID0+IHtcbiAgICBmb3VuZE5vZGUgPSBmb3VuZE5vZGUgfHwgZmluZE5vZGUoY2hpbGROb2RlLCBraW5kLCB0ZXh0KTtcbiAgfSk7XG5cbiAgcmV0dXJuIGZvdW5kTm9kZTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZm9yIHNvcnRpbmcgbm9kZXMuXG4gKiBAcmV0dXJuIGZ1bmN0aW9uIHRvIHNvcnQgbm9kZXMgaW4gaW5jcmVhc2luZyBvcmRlciBvZiBwb3NpdGlvbiBpbiBzb3VyY2VGaWxlXG4gKi9cbmZ1bmN0aW9uIG5vZGVzQnlQb3NpdGlvbihmaXJzdDogdHMuTm9kZSwgc2Vjb25kOiB0cy5Ob2RlKTogbnVtYmVyIHtcbiAgcmV0dXJuIGZpcnN0LmdldFN0YXJ0KCkgLSBzZWNvbmQuZ2V0U3RhcnQoKTtcbn1cblxuLyoqXG4gKiBJbnNlcnQgYHRvSW5zZXJ0YCBhZnRlciB0aGUgbGFzdCBvY2N1cmVuY2Ugb2YgYHRzLlN5bnRheEtpbmRbbm9kZXNbaV0ua2luZF1gXG4gKiBvciBhZnRlciB0aGUgbGFzdCBvZiBvY2N1cmVuY2Ugb2YgYHN5bnRheEtpbmRgIGlmIHRoZSBsYXN0IG9jY3VyZW5jZSBpcyBhIHN1YiBjaGlsZFxuICogb2YgdHMuU3ludGF4S2luZFtub2Rlc1tpXS5raW5kXSBhbmQgc2F2ZSB0aGUgY2hhbmdlcyBpbiBmaWxlLlxuICpcbiAqIEBwYXJhbSBub2RlcyBpbnNlcnQgYWZ0ZXIgdGhlIGxhc3Qgb2NjdXJlbmNlIG9mIG5vZGVzXG4gKiBAcGFyYW0gdG9JbnNlcnQgc3RyaW5nIHRvIGluc2VydFxuICogQHBhcmFtIGZpbGUgZmlsZSB0byBpbnNlcnQgY2hhbmdlcyBpbnRvXG4gKiBAcGFyYW0gZmFsbGJhY2tQb3MgcG9zaXRpb24gdG8gaW5zZXJ0IGlmIHRvSW5zZXJ0IGhhcHBlbnMgdG8gYmUgdGhlIGZpcnN0IG9jY3VyZW5jZVxuICogQHBhcmFtIHN5bnRheEtpbmQgdGhlIHRzLlN5bnRheEtpbmQgb2YgdGhlIHN1YmNoaWxkcmVuIHRvIGluc2VydCBhZnRlclxuICogQHJldHVybiBDaGFuZ2UgaW5zdGFuY2VcbiAqIEB0aHJvdyBFcnJvciBpZiB0b0luc2VydCBpcyBmaXJzdCBvY2N1cmVuY2UgYnV0IGZhbGwgYmFjayBpcyBub3Qgc2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRBZnRlckxhc3RPY2N1cnJlbmNlKFxuICBub2RlczogdHMuTm9kZVtdIHwgdHMuTm9kZUFycmF5PHRzLk5vZGU+LFxuICB0b0luc2VydDogc3RyaW5nLFxuICBmaWxlOiBzdHJpbmcsXG4gIGZhbGxiYWNrUG9zOiBudW1iZXIsXG4gIHN5bnRheEtpbmQ/OiB0cy5TeW50YXhLaW5kLFxuKTogQ2hhbmdlIHtcbiAgbGV0IGxhc3RJdGVtOiB0cy5Ob2RlIHwgdW5kZWZpbmVkO1xuICBmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZXMpIHtcbiAgICBpZiAoIWxhc3RJdGVtIHx8IGxhc3RJdGVtLmdldFN0YXJ0KCkgPCBub2RlLmdldFN0YXJ0KCkpIHtcbiAgICAgIGxhc3RJdGVtID0gbm9kZTtcbiAgICB9XG4gIH1cbiAgaWYgKHN5bnRheEtpbmQgJiYgbGFzdEl0ZW0pIHtcbiAgICBsYXN0SXRlbSA9IGZpbmROb2RlcyhsYXN0SXRlbSwgc3ludGF4S2luZCkuc29ydChub2Rlc0J5UG9zaXRpb24pLnBvcCgpO1xuICB9XG4gIGlmICghbGFzdEl0ZW0gJiYgZmFsbGJhY2tQb3MgPT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGB0cmllZCB0byBpbnNlcnQgJHt0b0luc2VydH0gYXMgZmlyc3Qgb2NjdXJlbmNlIHdpdGggbm8gZmFsbGJhY2sgcG9zaXRpb25gKTtcbiAgfVxuICBjb25zdCBsYXN0SXRlbVBvc2l0aW9uOiBudW1iZXIgPSBsYXN0SXRlbSA/IGxhc3RJdGVtLmdldEVuZCgpIDogZmFsbGJhY2tQb3M7XG5cbiAgcmV0dXJuIG5ldyBJbnNlcnRDaGFuZ2UoZmlsZSwgbGFzdEl0ZW1Qb3NpdGlvbiwgdG9JbnNlcnQpO1xufVxuXG5mdW5jdGlvbiBfYW5ndWxhckltcG9ydHNGcm9tTm9kZShub2RlOiB0cy5JbXBvcnREZWNsYXJhdGlvbik6IHsgW25hbWU6IHN0cmluZ106IHN0cmluZyB9IHtcbiAgY29uc3QgbXMgPSBub2RlLm1vZHVsZVNwZWNpZmllcjtcbiAgbGV0IG1vZHVsZVBhdGg6IHN0cmluZztcbiAgc3dpdGNoIChtcy5raW5kKSB7XG4gICAgY2FzZSB0cy5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWw6XG4gICAgICBtb2R1bGVQYXRoID0gKG1zIGFzIHRzLlN0cmluZ0xpdGVyYWwpLnRleHQ7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgaWYgKCFtb2R1bGVQYXRoLnN0YXJ0c1dpdGgoJ0Bhbmd1bGFyLycpKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgaWYgKG5vZGUuaW1wb3J0Q2xhdXNlKSB7XG4gICAgaWYgKG5vZGUuaW1wb3J0Q2xhdXNlLm5hbWUpIHtcbiAgICAgIC8vIFRoaXMgaXMgb2YgdGhlIGZvcm0gYGltcG9ydCBOYW1lIGZyb20gJ3BhdGgnYC4gSWdub3JlLlxuICAgICAgcmV0dXJuIHt9O1xuICAgIH0gZWxzZSBpZiAobm9kZS5pbXBvcnRDbGF1c2UubmFtZWRCaW5kaW5ncykge1xuICAgICAgY29uc3QgbmIgPSBub2RlLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzO1xuICAgICAgaWYgKG5iLmtpbmQgPT0gdHMuU3ludGF4S2luZC5OYW1lc3BhY2VJbXBvcnQpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBvZiB0aGUgZm9ybSBgaW1wb3J0ICogYXMgbmFtZSBmcm9tICdwYXRoJ2AuIFJldHVybiBgbmFtZS5gLlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIFtuYi5uYW1lLnRleHQgKyAnLiddOiBtb2R1bGVQYXRoLFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBvZiB0aGUgZm9ybSBgaW1wb3J0IHthLGIsY30gZnJvbSAncGF0aCdgXG4gICAgICAgIGNvbnN0IG5hbWVkSW1wb3J0cyA9IG5iO1xuXG4gICAgICAgIHJldHVybiBuYW1lZEltcG9ydHMuZWxlbWVudHNcbiAgICAgICAgICAubWFwKChpczogdHMuSW1wb3J0U3BlY2lmaWVyKSA9PiAoaXMucHJvcGVydHlOYW1lID8gaXMucHJvcGVydHlOYW1lLnRleHQgOiBpcy5uYW1lLnRleHQpKVxuICAgICAgICAgIC5yZWR1Y2UoKGFjYzogeyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH0sIGN1cnI6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgYWNjW2N1cnJdID0gbW9kdWxlUGF0aDtcblxuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICB9LCB7fSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHt9O1xuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgaXMgb2YgdGhlIGZvcm0gYGltcG9ydCAncGF0aCc7YC4gTm90aGluZyB0byBkby5cbiAgICByZXR1cm4ge307XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlY29yYXRvck1ldGFkYXRhKFxuICBzb3VyY2U6IHRzLlNvdXJjZUZpbGUsXG4gIGlkZW50aWZpZXI6IHN0cmluZyxcbiAgbW9kdWxlOiBzdHJpbmcsXG4pOiB0cy5Ob2RlW10ge1xuICBjb25zdCBhbmd1bGFySW1wb3J0cyA9IGZpbmROb2Rlcyhzb3VyY2UsIHRzLmlzSW1wb3J0RGVjbGFyYXRpb24pXG4gICAgLm1hcCgobm9kZSkgPT4gX2FuZ3VsYXJJbXBvcnRzRnJvbU5vZGUobm9kZSkpXG4gICAgLnJlZHVjZSgoYWNjLCBjdXJyZW50KSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhjdXJyZW50KSkge1xuICAgICAgICBhY2Nba2V5XSA9IGN1cnJlbnRba2V5XTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSk7XG5cbiAgcmV0dXJuIGdldFNvdXJjZU5vZGVzKHNvdXJjZSlcbiAgICAuZmlsdGVyKChub2RlKSA9PiB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICBub2RlLmtpbmQgPT0gdHMuU3ludGF4S2luZC5EZWNvcmF0b3IgJiZcbiAgICAgICAgKG5vZGUgYXMgdHMuRGVjb3JhdG9yKS5leHByZXNzaW9uLmtpbmQgPT0gdHMuU3ludGF4S2luZC5DYWxsRXhwcmVzc2lvblxuICAgICAgKTtcbiAgICB9KVxuICAgIC5tYXAoKG5vZGUpID0+IChub2RlIGFzIHRzLkRlY29yYXRvcikuZXhwcmVzc2lvbiBhcyB0cy5DYWxsRXhwcmVzc2lvbilcbiAgICAuZmlsdGVyKChleHByKSA9PiB7XG4gICAgICBpZiAoZXhwci5leHByZXNzaW9uLmtpbmQgPT0gdHMuU3ludGF4S2luZC5JZGVudGlmaWVyKSB7XG4gICAgICAgIGNvbnN0IGlkID0gZXhwci5leHByZXNzaW9uIGFzIHRzLklkZW50aWZpZXI7XG5cbiAgICAgICAgcmV0dXJuIGlkLnRleHQgPT0gaWRlbnRpZmllciAmJiBhbmd1bGFySW1wb3J0c1tpZC50ZXh0XSA9PT0gbW9kdWxlO1xuICAgICAgfSBlbHNlIGlmIChleHByLmV4cHJlc3Npb24ua2luZCA9PSB0cy5TeW50YXhLaW5kLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbikge1xuICAgICAgICAvLyBUaGlzIGNvdmVycyBmb28uTmdNb2R1bGUgd2hlbiBpbXBvcnRpbmcgKiBhcyBmb28uXG4gICAgICAgIGNvbnN0IHBhRXhwciA9IGV4cHIuZXhwcmVzc2lvbiBhcyB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb247XG4gICAgICAgIC8vIElmIHRoZSBsZWZ0IGV4cHJlc3Npb24gaXMgbm90IGFuIGlkZW50aWZpZXIsIGp1c3QgZ2l2ZSB1cCBhdCB0aGF0IHBvaW50LlxuICAgICAgICBpZiAocGFFeHByLmV4cHJlc3Npb24ua2luZCAhPT0gdHMuU3ludGF4S2luZC5JZGVudGlmaWVyKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaWQgPSBwYUV4cHIubmFtZS50ZXh0O1xuICAgICAgICBjb25zdCBtb2R1bGVJZCA9IChwYUV4cHIuZXhwcmVzc2lvbiBhcyB0cy5JZGVudGlmaWVyKS50ZXh0O1xuXG4gICAgICAgIHJldHVybiBpZCA9PT0gaWRlbnRpZmllciAmJiBhbmd1bGFySW1wb3J0c1ttb2R1bGVJZCArICcuJ10gPT09IG1vZHVsZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pXG4gICAgLmZpbHRlcihcbiAgICAgIChleHByKSA9PlxuICAgICAgICBleHByLmFyZ3VtZW50c1swXSAmJiBleHByLmFyZ3VtZW50c1swXS5raW5kID09IHRzLlN5bnRheEtpbmQuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24sXG4gICAgKVxuICAgIC5tYXAoKGV4cHIpID0+IGV4cHIuYXJndW1lbnRzWzBdIGFzIHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1ldGFkYXRhRmllbGQoXG4gIG5vZGU6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uLFxuICBtZXRhZGF0YUZpZWxkOiBzdHJpbmcsXG4pOiB0cy5PYmplY3RMaXRlcmFsRWxlbWVudFtdIHtcbiAgcmV0dXJuIChcbiAgICBub2RlLnByb3BlcnRpZXNcbiAgICAgIC5maWx0ZXIodHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQpXG4gICAgICAvLyBGaWx0ZXIgb3V0IGV2ZXJ5IGZpZWxkcyB0aGF0J3Mgbm90IFwibWV0YWRhdGFGaWVsZFwiLiBBbHNvIGhhbmRsZXMgc3RyaW5nIGxpdGVyYWxzXG4gICAgICAvLyAoYnV0IG5vdCBleHByZXNzaW9ucykuXG4gICAgICAuZmlsdGVyKCh7IG5hbWUgfSkgPT4ge1xuICAgICAgICByZXR1cm4gKHRzLmlzSWRlbnRpZmllcihuYW1lKSB8fCB0cy5pc1N0cmluZ0xpdGVyYWwobmFtZSkpICYmIG5hbWUudGV4dCA9PT0gbWV0YWRhdGFGaWVsZDtcbiAgICAgIH0pXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRTeW1ib2xUb05nTW9kdWxlTWV0YWRhdGEoXG4gIHNvdXJjZTogdHMuU291cmNlRmlsZSxcbiAgbmdNb2R1bGVQYXRoOiBzdHJpbmcsXG4gIG1ldGFkYXRhRmllbGQ6IHN0cmluZyxcbiAgc3ltYm9sTmFtZTogc3RyaW5nLFxuICBpbXBvcnRQYXRoOiBzdHJpbmcgfCBudWxsID0gbnVsbCxcbik6IENoYW5nZVtdIHtcbiAgY29uc3Qgbm9kZXMgPSBnZXREZWNvcmF0b3JNZXRhZGF0YShzb3VyY2UsICdOZ01vZHVsZScsICdAYW5ndWxhci9jb3JlJyk7XG4gIGNvbnN0IG5vZGUgPSBub2Rlc1swXTtcblxuICAvLyBGaW5kIHRoZSBkZWNvcmF0b3IgZGVjbGFyYXRpb24uXG4gIGlmICghbm9kZSB8fCAhdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihub2RlKSkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8vIEdldCBhbGwgdGhlIGNoaWxkcmVuIHByb3BlcnR5IGFzc2lnbm1lbnQgb2Ygb2JqZWN0IGxpdGVyYWxzLlxuICBjb25zdCBtYXRjaGluZ1Byb3BlcnRpZXMgPSBnZXRNZXRhZGF0YUZpZWxkKG5vZGUsIG1ldGFkYXRhRmllbGQpO1xuXG4gIGlmIChtYXRjaGluZ1Byb3BlcnRpZXMubGVuZ3RoID09IDApIHtcbiAgICAvLyBXZSBoYXZlbid0IGZvdW5kIHRoZSBmaWVsZCBpbiB0aGUgbWV0YWRhdGEgZGVjbGFyYXRpb24uIEluc2VydCBhIG5ldyBmaWVsZC5cbiAgICBsZXQgcG9zaXRpb246IG51bWJlcjtcbiAgICBsZXQgdG9JbnNlcnQ6IHN0cmluZztcbiAgICBpZiAobm9kZS5wcm9wZXJ0aWVzLmxlbmd0aCA9PSAwKSB7XG4gICAgICBwb3NpdGlvbiA9IG5vZGUuZ2V0RW5kKCkgLSAxO1xuICAgICAgdG9JbnNlcnQgPSBgXFxuICAke21ldGFkYXRhRmllbGR9OiBbXFxuJHt0YWdzLmluZGVudEJ5KDQpYCR7c3ltYm9sTmFtZX1gfVxcbiAgXVxcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNoaWxkTm9kZSA9IG5vZGUucHJvcGVydGllc1tub2RlLnByb3BlcnRpZXMubGVuZ3RoIC0gMV07XG4gICAgICBwb3NpdGlvbiA9IGNoaWxkTm9kZS5nZXRFbmQoKTtcbiAgICAgIC8vIEdldCB0aGUgaW5kZW50YXRpb24gb2YgdGhlIGxhc3QgZWxlbWVudCwgaWYgYW55LlxuICAgICAgY29uc3QgdGV4dCA9IGNoaWxkTm9kZS5nZXRGdWxsVGV4dChzb3VyY2UpO1xuICAgICAgY29uc3QgbWF0Y2hlcyA9IHRleHQubWF0Y2goL14oXFxyP1xcbikoXFxzKikvKTtcbiAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgIHRvSW5zZXJ0ID1cbiAgICAgICAgICBgLCR7bWF0Y2hlc1swXX0ke21ldGFkYXRhRmllbGR9OiBbJHttYXRjaGVzWzFdfWAgK1xuICAgICAgICAgIGAke3RhZ3MuaW5kZW50QnkobWF0Y2hlc1syXS5sZW5ndGggKyAyKWAke3N5bWJvbE5hbWV9YH0ke21hdGNoZXNbMF19XWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0b0luc2VydCA9IGAsICR7bWV0YWRhdGFGaWVsZH06IFske3N5bWJvbE5hbWV9XWA7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpbXBvcnRQYXRoICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICBuZXcgSW5zZXJ0Q2hhbmdlKG5nTW9kdWxlUGF0aCwgcG9zaXRpb24sIHRvSW5zZXJ0KSxcbiAgICAgICAgaW5zZXJ0SW1wb3J0KHNvdXJjZSwgbmdNb2R1bGVQYXRoLCBzeW1ib2xOYW1lLnJlcGxhY2UoL1xcLi4qJC8sICcnKSwgaW1wb3J0UGF0aCksXG4gICAgICBdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW25ldyBJbnNlcnRDaGFuZ2UobmdNb2R1bGVQYXRoLCBwb3NpdGlvbiwgdG9JbnNlcnQpXTtcbiAgICB9XG4gIH1cbiAgY29uc3QgYXNzaWdubWVudCA9IG1hdGNoaW5nUHJvcGVydGllc1swXTtcblxuICAvLyBJZiBpdCdzIG5vdCBhbiBhcnJheSwgbm90aGluZyB3ZSBjYW4gZG8gcmVhbGx5LlxuICBpZiAoXG4gICAgIXRzLmlzUHJvcGVydHlBc3NpZ25tZW50KGFzc2lnbm1lbnQpIHx8XG4gICAgIXRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihhc3NpZ25tZW50LmluaXRpYWxpemVyKVxuICApIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBsZXQgZXhwcmVzc3Npb246IHRzLkV4cHJlc3Npb24gfCB0cy5BcnJheUxpdGVyYWxFeHByZXNzaW9uO1xuICBjb25zdCBhc3NpZ25tZW50SW5pdCA9IGFzc2lnbm1lbnQuaW5pdGlhbGl6ZXI7XG4gIGNvbnN0IGVsZW1lbnRzID0gYXNzaWdubWVudEluaXQuZWxlbWVudHM7XG5cbiAgaWYgKGVsZW1lbnRzLmxlbmd0aCkge1xuICAgIGNvbnN0IHN5bWJvbHNBcnJheSA9IGVsZW1lbnRzLm1hcCgobm9kZSkgPT4gdGFncy5vbmVMaW5lYCR7bm9kZS5nZXRUZXh0KCl9YCk7XG4gICAgaWYgKHN5bWJvbHNBcnJheS5pbmNsdWRlcyh0YWdzLm9uZUxpbmVgJHtzeW1ib2xOYW1lfWApKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgZXhwcmVzc3Npb24gPSBlbGVtZW50c1tlbGVtZW50cy5sZW5ndGggLSAxXTtcbiAgfSBlbHNlIHtcbiAgICBleHByZXNzc2lvbiA9IGFzc2lnbm1lbnRJbml0O1xuICB9XG5cbiAgbGV0IHRvSW5zZXJ0OiBzdHJpbmc7XG4gIGxldCBwb3NpdGlvbiA9IGV4cHJlc3NzaW9uLmdldEVuZCgpO1xuICBpZiAodHMuaXNBcnJheUxpdGVyYWxFeHByZXNzaW9uKGV4cHJlc3NzaW9uKSkge1xuICAgIC8vIFdlIGZvdW5kIHRoZSBmaWVsZCBidXQgaXQncyBlbXB0eS4gSW5zZXJ0IGl0IGp1c3QgYmVmb3JlIHRoZSBgXWAuXG4gICAgcG9zaXRpb24tLTtcbiAgICB0b0luc2VydCA9IGBcXG4ke3RhZ3MuaW5kZW50QnkoNClgJHtzeW1ib2xOYW1lfWB9XFxuICBgO1xuICB9IGVsc2Uge1xuICAgIC8vIEdldCB0aGUgaW5kZW50YXRpb24gb2YgdGhlIGxhc3QgZWxlbWVudCwgaWYgYW55LlxuICAgIGNvbnN0IHRleHQgPSBleHByZXNzc2lvbi5nZXRGdWxsVGV4dChzb3VyY2UpO1xuICAgIGNvbnN0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKC9eKFxccj9cXG4pKFxccyopLyk7XG4gICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgIHRvSW5zZXJ0ID0gYCwke21hdGNoZXNbMV19JHt0YWdzLmluZGVudEJ5KG1hdGNoZXNbMl0ubGVuZ3RoKWAke3N5bWJvbE5hbWV9YH1gO1xuICAgIH0gZWxzZSB7XG4gICAgICB0b0luc2VydCA9IGAsICR7c3ltYm9sTmFtZX1gO1xuICAgIH1cbiAgfVxuXG4gIGlmIChpbXBvcnRQYXRoICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIG5ldyBJbnNlcnRDaGFuZ2UobmdNb2R1bGVQYXRoLCBwb3NpdGlvbiwgdG9JbnNlcnQpLFxuICAgICAgaW5zZXJ0SW1wb3J0KHNvdXJjZSwgbmdNb2R1bGVQYXRoLCBzeW1ib2xOYW1lLnJlcGxhY2UoL1xcLi4qJC8sICcnKSwgaW1wb3J0UGF0aCksXG4gICAgXTtcbiAgfVxuXG4gIHJldHVybiBbbmV3IEluc2VydENoYW5nZShuZ01vZHVsZVBhdGgsIHBvc2l0aW9uLCB0b0luc2VydCldO1xufVxuXG4vKipcbiAqIEN1c3RvbSBmdW5jdGlvbiB0byBpbnNlcnQgYSBkZWNsYXJhdGlvbiAoY29tcG9uZW50LCBwaXBlLCBkaXJlY3RpdmUpXG4gKiBpbnRvIE5nTW9kdWxlIGRlY2xhcmF0aW9ucy4gSXQgYWxzbyBpbXBvcnRzIHRoZSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGREZWNsYXJhdGlvblRvTW9kdWxlKFxuICBzb3VyY2U6IHRzLlNvdXJjZUZpbGUsXG4gIG1vZHVsZVBhdGg6IHN0cmluZyxcbiAgY2xhc3NpZmllZE5hbWU6IHN0cmluZyxcbiAgaW1wb3J0UGF0aDogc3RyaW5nLFxuKTogQ2hhbmdlW10ge1xuICByZXR1cm4gYWRkU3ltYm9sVG9OZ01vZHVsZU1ldGFkYXRhKFxuICAgIHNvdXJjZSxcbiAgICBtb2R1bGVQYXRoLFxuICAgICdkZWNsYXJhdGlvbnMnLFxuICAgIGNsYXNzaWZpZWROYW1lLFxuICAgIGltcG9ydFBhdGgsXG4gICk7XG59XG5cbi8qKlxuICogQ3VzdG9tIGZ1bmN0aW9uIHRvIGluc2VydCBhbiBOZ01vZHVsZSBpbnRvIE5nTW9kdWxlIGltcG9ydHMuIEl0IGFsc28gaW1wb3J0cyB0aGUgbW9kdWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkSW1wb3J0VG9Nb2R1bGUoXG4gIHNvdXJjZTogdHMuU291cmNlRmlsZSxcbiAgbW9kdWxlUGF0aDogc3RyaW5nLFxuICBjbGFzc2lmaWVkTmFtZTogc3RyaW5nLFxuICBpbXBvcnRQYXRoOiBzdHJpbmcsXG4pOiBDaGFuZ2VbXSB7XG4gIHJldHVybiBhZGRTeW1ib2xUb05nTW9kdWxlTWV0YWRhdGEoc291cmNlLCBtb2R1bGVQYXRoLCAnaW1wb3J0cycsIGNsYXNzaWZpZWROYW1lLCBpbXBvcnRQYXRoKTtcbn1cblxuLyoqXG4gKiBDdXN0b20gZnVuY3Rpb24gdG8gaW5zZXJ0IGEgcHJvdmlkZXIgaW50byBOZ01vZHVsZS4gSXQgYWxzbyBpbXBvcnRzIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkUHJvdmlkZXJUb01vZHVsZShcbiAgc291cmNlOiB0cy5Tb3VyY2VGaWxlLFxuICBtb2R1bGVQYXRoOiBzdHJpbmcsXG4gIGNsYXNzaWZpZWROYW1lOiBzdHJpbmcsXG4gIGltcG9ydFBhdGg6IHN0cmluZyxcbik6IENoYW5nZVtdIHtcbiAgcmV0dXJuIGFkZFN5bWJvbFRvTmdNb2R1bGVNZXRhZGF0YShzb3VyY2UsIG1vZHVsZVBhdGgsICdwcm92aWRlcnMnLCBjbGFzc2lmaWVkTmFtZSwgaW1wb3J0UGF0aCk7XG59XG5cbi8qKlxuICogQ3VzdG9tIGZ1bmN0aW9uIHRvIGluc2VydCBhbiBleHBvcnQgaW50byBOZ01vZHVsZS4gSXQgYWxzbyBpbXBvcnRzIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkRXhwb3J0VG9Nb2R1bGUoXG4gIHNvdXJjZTogdHMuU291cmNlRmlsZSxcbiAgbW9kdWxlUGF0aDogc3RyaW5nLFxuICBjbGFzc2lmaWVkTmFtZTogc3RyaW5nLFxuICBpbXBvcnRQYXRoOiBzdHJpbmcsXG4pOiBDaGFuZ2VbXSB7XG4gIHJldHVybiBhZGRTeW1ib2xUb05nTW9kdWxlTWV0YWRhdGEoc291cmNlLCBtb2R1bGVQYXRoLCAnZXhwb3J0cycsIGNsYXNzaWZpZWROYW1lLCBpbXBvcnRQYXRoKTtcbn1cblxuLyoqXG4gKiBDdXN0b20gZnVuY3Rpb24gdG8gaW5zZXJ0IGFuIGV4cG9ydCBpbnRvIE5nTW9kdWxlLiBJdCBhbHNvIGltcG9ydHMgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRCb290c3RyYXBUb01vZHVsZShcbiAgc291cmNlOiB0cy5Tb3VyY2VGaWxlLFxuICBtb2R1bGVQYXRoOiBzdHJpbmcsXG4gIGNsYXNzaWZpZWROYW1lOiBzdHJpbmcsXG4gIGltcG9ydFBhdGg6IHN0cmluZyxcbik6IENoYW5nZVtdIHtcbiAgcmV0dXJuIGFkZFN5bWJvbFRvTmdNb2R1bGVNZXRhZGF0YShzb3VyY2UsIG1vZHVsZVBhdGgsICdib290c3RyYXAnLCBjbGFzc2lmaWVkTmFtZSwgaW1wb3J0UGF0aCk7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGFuIGltcG9ydCBhbHJlYWR5IGV4aXN0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzSW1wb3J0ZWQoXG4gIHNvdXJjZTogdHMuU291cmNlRmlsZSxcbiAgY2xhc3NpZmllZE5hbWU6IHN0cmluZyxcbiAgaW1wb3J0UGF0aDogc3RyaW5nLFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFsbE5vZGVzID0gZ2V0U291cmNlTm9kZXMoc291cmNlKTtcbiAgY29uc3QgbWF0Y2hpbmdOb2RlcyA9IGFsbE5vZGVzXG4gICAgLmZpbHRlcih0cy5pc0ltcG9ydERlY2xhcmF0aW9uKVxuICAgIC5maWx0ZXIoXG4gICAgICAoaW1wKSA9PiB0cy5pc1N0cmluZ0xpdGVyYWwoaW1wLm1vZHVsZVNwZWNpZmllcikgJiYgaW1wLm1vZHVsZVNwZWNpZmllci50ZXh0ID09PSBpbXBvcnRQYXRoLFxuICAgIClcbiAgICAuZmlsdGVyKChpbXApID0+IHtcbiAgICAgIGlmICghaW1wLmltcG9ydENsYXVzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjb25zdCBub2RlcyA9IGZpbmROb2RlcyhpbXAuaW1wb3J0Q2xhdXNlLCB0cy5pc0ltcG9ydFNwZWNpZmllcikuZmlsdGVyKFxuICAgICAgICAobikgPT4gbi5nZXRUZXh0KCkgPT09IGNsYXNzaWZpZWROYW1lLFxuICAgICAgKTtcblxuICAgICAgcmV0dXJuIG5vZGVzLmxlbmd0aCA+IDA7XG4gICAgfSk7XG5cbiAgcmV0dXJuIG1hdGNoaW5nTm9kZXMubGVuZ3RoID4gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBSb3V0ZXJNb2R1bGUgZGVjbGFyYXRpb24gZnJvbSBOZ01vZHVsZSBtZXRhZGF0YSwgaWYgYW55LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um91dGVyTW9kdWxlRGVjbGFyYXRpb24oc291cmNlOiB0cy5Tb3VyY2VGaWxlKTogdHMuRXhwcmVzc2lvbiB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IHJlc3VsdCA9IGdldERlY29yYXRvck1ldGFkYXRhKHNvdXJjZSwgJ05nTW9kdWxlJywgJ0Bhbmd1bGFyL2NvcmUnKTtcbiAgY29uc3Qgbm9kZSA9IHJlc3VsdFswXTtcbiAgaWYgKCFub2RlIHx8ICF0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IG1hdGNoaW5nUHJvcGVydGllcyA9IGdldE1ldGFkYXRhRmllbGQobm9kZSwgJ2ltcG9ydHMnKTtcbiAgaWYgKCFtYXRjaGluZ1Byb3BlcnRpZXMpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBhc3NpZ25tZW50ID0gbWF0Y2hpbmdQcm9wZXJ0aWVzWzBdIGFzIHRzLlByb3BlcnR5QXNzaWdubWVudDtcblxuICBpZiAoYXNzaWdubWVudC5pbml0aWFsaXplci5raW5kICE9PSB0cy5TeW50YXhLaW5kLkFycmF5TGl0ZXJhbEV4cHJlc3Npb24pIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBhcnJMaXRlcmFsID0gYXNzaWdubWVudC5pbml0aWFsaXplciBhcyB0cy5BcnJheUxpdGVyYWxFeHByZXNzaW9uO1xuXG4gIHJldHVybiBhcnJMaXRlcmFsLmVsZW1lbnRzXG4gICAgLmZpbHRlcigoZWwpID0+IGVsLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuQ2FsbEV4cHJlc3Npb24pXG4gICAgLmZpbmQoKGVsKSA9PiAoZWwgYXMgdHMuSWRlbnRpZmllcikuZ2V0VGV4dCgpLnN0YXJ0c1dpdGgoJ1JvdXRlck1vZHVsZScpKTtcbn1cblxuLyoqXG4gKiBBZGRzIGEgbmV3IHJvdXRlIGRlY2xhcmF0aW9uIHRvIGEgcm91dGVyIG1vZHVsZSAoaS5lLiBoYXMgYSBSb3V0ZXJNb2R1bGUgZGVjbGFyYXRpb24pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRSb3V0ZURlY2xhcmF0aW9uVG9Nb2R1bGUoXG4gIHNvdXJjZTogdHMuU291cmNlRmlsZSxcbiAgZmlsZVRvQWRkOiBzdHJpbmcsXG4gIHJvdXRlTGl0ZXJhbDogc3RyaW5nLFxuKTogQ2hhbmdlIHtcbiAgY29uc3Qgcm91dGVyTW9kdWxlRXhwciA9IGdldFJvdXRlck1vZHVsZURlY2xhcmF0aW9uKHNvdXJjZSk7XG4gIGlmICghcm91dGVyTW9kdWxlRXhwcikge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBDb3VsZG4ndCBmaW5kIGEgcm91dGUgZGVjbGFyYXRpb24gaW4gJHtmaWxlVG9BZGR9LlxcbmAgK1xuICAgICAgICBgVXNlIHRoZSAnLS1tb2R1bGUnIG9wdGlvbiB0byBzcGVjaWZ5IGEgZGlmZmVyZW50IHJvdXRpbmcgbW9kdWxlLmAsXG4gICAgKTtcbiAgfVxuICBjb25zdCBzY29wZUNvbmZpZ01ldGhvZEFyZ3MgPSAocm91dGVyTW9kdWxlRXhwciBhcyB0cy5DYWxsRXhwcmVzc2lvbikuYXJndW1lbnRzO1xuICBpZiAoIXNjb3BlQ29uZmlnTWV0aG9kQXJncy5sZW5ndGgpIHtcbiAgICBjb25zdCB7IGxpbmUgfSA9IHNvdXJjZS5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihyb3V0ZXJNb2R1bGVFeHByLmdldFN0YXJ0KCkpO1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBUaGUgcm91dGVyIG1vZHVsZSBtZXRob2QgZG9lc24ndCBoYXZlIGFyZ3VtZW50cyBgICsgYGF0IGxpbmUgJHtsaW5lfSBpbiAke2ZpbGVUb0FkZH1gLFxuICAgICk7XG4gIH1cblxuICBsZXQgcm91dGVzQXJyOiB0cy5BcnJheUxpdGVyYWxFeHByZXNzaW9uIHwgdW5kZWZpbmVkO1xuICBjb25zdCByb3V0ZXNBcmcgPSBzY29wZUNvbmZpZ01ldGhvZEFyZ3NbMF07XG5cbiAgLy8gQ2hlY2sgaWYgdGhlIHJvdXRlIGRlY2xhcmF0aW9ucyBhcnJheSBpc1xuICAvLyBhbiBpbmxpbmVkIGFyZ3VtZW50IG9mIFJvdXRlck1vZHVsZSBvciBhIHN0YW5kYWxvbmUgdmFyaWFibGVcbiAgaWYgKHRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihyb3V0ZXNBcmcpKSB7XG4gICAgcm91dGVzQXJyID0gcm91dGVzQXJnO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJvdXRlc1Zhck5hbWUgPSByb3V0ZXNBcmcuZ2V0VGV4dCgpO1xuICAgIGxldCByb3V0ZXNWYXI7XG4gICAgaWYgKHJvdXRlc0FyZy5raW5kID09PSB0cy5TeW50YXhLaW5kLklkZW50aWZpZXIpIHtcbiAgICAgIHJvdXRlc1ZhciA9IHNvdXJjZS5zdGF0ZW1lbnRzLmZpbHRlcih0cy5pc1ZhcmlhYmxlU3RhdGVtZW50KS5maW5kKCh2KSA9PiB7XG4gICAgICAgIHJldHVybiB2LmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnNbMF0ubmFtZS5nZXRUZXh0KCkgPT09IHJvdXRlc1Zhck5hbWU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXJvdXRlc1Zhcikge1xuICAgICAgY29uc3QgeyBsaW5lIH0gPSBzb3VyY2UuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24ocm91dGVzQXJnLmdldFN0YXJ0KCkpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgTm8gcm91dGUgZGVjbGFyYXRpb24gYXJyYXkgd2FzIGZvdW5kIHRoYXQgY29ycmVzcG9uZHMgYCArXG4gICAgICAgICAgYHRvIHJvdXRlciBtb2R1bGUgYXQgbGluZSAke2xpbmV9IGluICR7ZmlsZVRvQWRkfWAsXG4gICAgICApO1xuICAgIH1cblxuICAgIHJvdXRlc0FyciA9IGZpbmROb2RlcyhcbiAgICAgIHJvdXRlc1ZhcixcbiAgICAgIHRzLlN5bnRheEtpbmQuQXJyYXlMaXRlcmFsRXhwcmVzc2lvbixcbiAgICAgIDEsXG4gICAgKVswXSBhcyB0cy5BcnJheUxpdGVyYWxFeHByZXNzaW9uO1xuICB9XG5cbiAgY29uc3Qgb2NjdXJyZW5jZXNDb3VudCA9IHJvdXRlc0Fyci5lbGVtZW50cy5sZW5ndGg7XG4gIGNvbnN0IHRleHQgPSByb3V0ZXNBcnIuZ2V0RnVsbFRleHQoc291cmNlKTtcblxuICBsZXQgcm91dGU6IHN0cmluZyA9IHJvdXRlTGl0ZXJhbDtcbiAgbGV0IGluc2VydFBvcyA9IHJvdXRlc0Fyci5lbGVtZW50cy5wb3M7XG5cbiAgaWYgKG9jY3VycmVuY2VzQ291bnQgPiAwKSB7XG4gICAgY29uc3QgbGFzdFJvdXRlTGl0ZXJhbCA9IFsuLi5yb3V0ZXNBcnIuZWxlbWVudHNdLnBvcCgpIGFzIHRzLkV4cHJlc3Npb247XG4gICAgY29uc3QgbGFzdFJvdXRlSXNXaWxkY2FyZCA9XG4gICAgICB0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKGxhc3RSb3V0ZUxpdGVyYWwpICYmXG4gICAgICBsYXN0Um91dGVMaXRlcmFsLnByb3BlcnRpZXMuc29tZShcbiAgICAgICAgKG4pID0+XG4gICAgICAgICAgdHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQobikgJiZcbiAgICAgICAgICB0cy5pc0lkZW50aWZpZXIobi5uYW1lKSAmJlxuICAgICAgICAgIG4ubmFtZS50ZXh0ID09PSAncGF0aCcgJiZcbiAgICAgICAgICB0cy5pc1N0cmluZ0xpdGVyYWwobi5pbml0aWFsaXplcikgJiZcbiAgICAgICAgICBuLmluaXRpYWxpemVyLnRleHQgPT09ICcqKicsXG4gICAgICApO1xuXG4gICAgY29uc3QgaW5kZW50YXRpb24gPSB0ZXh0Lm1hdGNoKC9cXHI/XFxuKFxccj8pXFxzKi8pIHx8IFtdO1xuICAgIGNvbnN0IHJvdXRlVGV4dCA9IGAke2luZGVudGF0aW9uWzBdIHx8ICcgJ30ke3JvdXRlTGl0ZXJhbH1gO1xuXG4gICAgLy8gQWRkIHRoZSBuZXcgcm91dGUgYmVmb3JlIHRoZSB3aWxkY2FyZCByb3V0ZVxuICAgIC8vIG90aGVyd2lzZSB3ZSdsbCBhbHdheXMgcmVkaXJlY3QgdG8gdGhlIHdpbGRjYXJkIHJvdXRlXG4gICAgaWYgKGxhc3RSb3V0ZUlzV2lsZGNhcmQpIHtcbiAgICAgIGluc2VydFBvcyA9IGxhc3RSb3V0ZUxpdGVyYWwucG9zO1xuICAgICAgcm91dGUgPSBgJHtyb3V0ZVRleHR9LGA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc2VydFBvcyA9IGxhc3RSb3V0ZUxpdGVyYWwuZW5kO1xuICAgICAgcm91dGUgPSBgLCR7cm91dGVUZXh0fWA7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBJbnNlcnRDaGFuZ2UoZmlsZVRvQWRkLCBpbnNlcnRQb3MsIHJvdXRlKTtcbn1cblxuLyoqIEFzc2VydHMgaWYgdGhlIHNwZWNpZmllZCBub2RlIGlzIGEgbmFtZWQgZGVjbGFyYXRpb24gKGUuZy4gY2xhc3MsIGludGVyZmFjZSkuICovXG5mdW5jdGlvbiBpc05hbWVkTm9kZShcbiAgbm9kZTogdHMuTm9kZSAmIHsgbmFtZT86IHRzLk5vZGUgfSxcbik6IG5vZGUgaXMgdHMuTm9kZSAmIHsgbmFtZTogdHMuSWRlbnRpZmllciB9IHtcbiAgcmV0dXJuICEhbm9kZS5uYW1lICYmIHRzLmlzSWRlbnRpZmllcihub2RlLm5hbWUpO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBTb3VyY2VGaWxlIGhhcyBhIHRvcC1sZXZlbCBkZWNsYXJhdGlvbiB3aG9zZSBuYW1lIG1hdGNoZXMgYSBzcGVjaWZpYyBzeW1ib2wuXG4gKiBDYW4gYmUgdXNlZCB0byBhdm9pZCBjb25mbGljdHMgd2hlbiBpbnNlcnRpbmcgbmV3IGltcG9ydHMgaW50byBhIGZpbGUuXG4gKiBAcGFyYW0gc291cmNlRmlsZSBGaWxlIGluIHdoaWNoIHRvIHNlYXJjaC5cbiAqIEBwYXJhbSBzeW1ib2xOYW1lIE5hbWUgb2YgdGhlIHN5bWJvbCB0byBzZWFyY2ggZm9yLlxuICogQHBhcmFtIHNraXBNb2R1bGUgUGF0aCBvZiB0aGUgbW9kdWxlIHRoYXQgdGhlIHN5bWJvbCBtYXkgaGF2ZSBiZWVuIGltcG9ydGVkIGZyb20uIFVzZWQgdG9cbiAqIGF2b2lkIGZhbHNlIHBvc2l0aXZlcyB3aGVyZSB0aGUgc2FtZSBzeW1ib2wgd2UncmUgbG9va2luZyBmb3IgbWF5IGhhdmUgYmVlbiBpbXBvcnRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc1RvcExldmVsSWRlbnRpZmllcihcbiAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSxcbiAgc3ltYm9sTmFtZTogc3RyaW5nLFxuICBza2lwTW9kdWxlOiBzdHJpbmcgfCBudWxsID0gbnVsbCxcbik6IGJvb2xlYW4ge1xuICBmb3IgKGNvbnN0IG5vZGUgb2Ygc291cmNlRmlsZS5zdGF0ZW1lbnRzKSB7XG4gICAgaWYgKGlzTmFtZWROb2RlKG5vZGUpICYmIG5vZGUubmFtZS50ZXh0ID09PSBzeW1ib2xOYW1lKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICB0cy5pc1ZhcmlhYmxlU3RhdGVtZW50KG5vZGUpICYmXG4gICAgICBub2RlLmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnMuc29tZSgoZGVjbCkgPT4ge1xuICAgICAgICByZXR1cm4gaXNOYW1lZE5vZGUoZGVjbCkgJiYgZGVjbC5uYW1lLnRleHQgPT09IHN5bWJvbE5hbWU7XG4gICAgICB9KVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdHMuaXNJbXBvcnREZWNsYXJhdGlvbihub2RlKSAmJlxuICAgICAgdHMuaXNTdHJpbmdMaXRlcmFsTGlrZShub2RlLm1vZHVsZVNwZWNpZmllcikgJiZcbiAgICAgIG5vZGUubW9kdWxlU3BlY2lmaWVyLnRleHQgIT09IHNraXBNb2R1bGUgJiZcbiAgICAgIG5vZGUuaW1wb3J0Q2xhdXNlPy5uYW1lZEJpbmRpbmdzICYmXG4gICAgICB0cy5pc05hbWVkSW1wb3J0cyhub2RlLmltcG9ydENsYXVzZS5uYW1lZEJpbmRpbmdzKSAmJlxuICAgICAgbm9kZS5pbXBvcnRDbGF1c2UubmFtZWRCaW5kaW5ncy5lbGVtZW50cy5zb21lKChlbCkgPT4gZWwubmFtZS50ZXh0ID09PSBzeW1ib2xOYW1lKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19