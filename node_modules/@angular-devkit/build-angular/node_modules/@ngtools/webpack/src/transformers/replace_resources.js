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
exports.getResourceUrl = exports.replaceResources = exports.NG_COMPONENT_RESOURCE_QUERY = void 0;
const ts = __importStar(require("typescript"));
const inline_resource_1 = require("../loaders/inline-resource");
exports.NG_COMPONENT_RESOURCE_QUERY = 'ngResource';
function replaceResources(shouldTransform, getTypeChecker, inlineStyleFileExtension) {
    return (context) => {
        const typeChecker = getTypeChecker();
        const resourceImportDeclarations = [];
        const moduleKind = context.getCompilerOptions().module;
        const nodeFactory = context.factory;
        const visitNode = (node) => {
            if (ts.isClassDeclaration(node)) {
                const decorators = ts.getDecorators(node);
                if (!decorators || decorators.length === 0) {
                    return node;
                }
                return nodeFactory.updateClassDeclaration(node, [
                    ...decorators.map((current) => visitDecorator(nodeFactory, current, typeChecker, resourceImportDeclarations, moduleKind, inlineStyleFileExtension)),
                    ...(ts.getModifiers(node) ?? []),
                ], node.name, node.typeParameters, node.heritageClauses, node.members);
            }
            return ts.visitEachChild(node, visitNode, context);
        };
        return (sourceFile) => {
            if (!shouldTransform(sourceFile.fileName)) {
                return sourceFile;
            }
            const updatedSourceFile = ts.visitNode(sourceFile, visitNode);
            if (resourceImportDeclarations.length) {
                // Add resource imports
                return context.factory.updateSourceFile(updatedSourceFile, ts.setTextRange(context.factory.createNodeArray([
                    ...resourceImportDeclarations,
                    ...updatedSourceFile.statements,
                ]), updatedSourceFile.statements));
            }
            return updatedSourceFile;
        };
    };
}
exports.replaceResources = replaceResources;
function visitDecorator(nodeFactory, node, typeChecker, resourceImportDeclarations, moduleKind, inlineStyleFileExtension) {
    if (!isComponentDecorator(node, typeChecker)) {
        return node;
    }
    if (!ts.isCallExpression(node.expression)) {
        return node;
    }
    const decoratorFactory = node.expression;
    const args = decoratorFactory.arguments;
    if (args.length !== 1 || !ts.isObjectLiteralExpression(args[0])) {
        // Unsupported component metadata
        return node;
    }
    const objectExpression = args[0];
    const styleReplacements = [];
    // visit all properties
    let properties = ts.visitNodes(objectExpression.properties, (node) => ts.isObjectLiteralElementLike(node)
        ? visitComponentMetadata(nodeFactory, node, styleReplacements, resourceImportDeclarations, moduleKind, inlineStyleFileExtension)
        : node);
    // replace properties with updated properties
    if (styleReplacements.length > 0) {
        const styleProperty = nodeFactory.createPropertyAssignment(nodeFactory.createIdentifier('styles'), nodeFactory.createArrayLiteralExpression(styleReplacements));
        properties = nodeFactory.createNodeArray([...properties, styleProperty]);
    }
    return nodeFactory.updateDecorator(node, nodeFactory.updateCallExpression(decoratorFactory, decoratorFactory.expression, decoratorFactory.typeArguments, [nodeFactory.updateObjectLiteralExpression(objectExpression, properties)]));
}
function visitComponentMetadata(nodeFactory, node, styleReplacements, resourceImportDeclarations, moduleKind = ts.ModuleKind.ES2015, inlineStyleFileExtension) {
    if (!ts.isPropertyAssignment(node) || ts.isComputedPropertyName(node.name)) {
        return node;
    }
    const name = node.name.text;
    switch (name) {
        case 'moduleId':
            return undefined;
        case 'templateUrl':
            const url = getResourceUrl(node.initializer);
            if (!url) {
                return node;
            }
            const importName = createResourceImport(nodeFactory, url, resourceImportDeclarations, moduleKind);
            if (!importName) {
                return node;
            }
            return nodeFactory.updatePropertyAssignment(node, nodeFactory.createIdentifier('template'), importName);
        case 'styles':
        case 'styleUrls':
            if (!ts.isArrayLiteralExpression(node.initializer)) {
                return node;
            }
            const isInlineStyle = name === 'styles';
            const styles = ts.visitNodes(node.initializer.elements, (node) => {
                if (!ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node)) {
                    return node;
                }
                let url;
                if (isInlineStyle) {
                    if (inlineStyleFileExtension) {
                        const data = Buffer.from(node.text).toString('base64');
                        const containingFile = node.getSourceFile().fileName;
                        // app.component.ts.css?ngResource!=!@ngtools/webpack/src/loaders/inline-resource.js?data=...!app.component.ts
                        url =
                            `${containingFile}.${inlineStyleFileExtension}?${exports.NG_COMPONENT_RESOURCE_QUERY}` +
                                `!=!${inline_resource_1.InlineAngularResourceLoaderPath}?data=${encodeURIComponent(data)}!${containingFile}`;
                    }
                    else {
                        return nodeFactory.createStringLiteral(node.text);
                    }
                }
                else {
                    url = getResourceUrl(node);
                }
                if (!url) {
                    return node;
                }
                return createResourceImport(nodeFactory, url, resourceImportDeclarations, moduleKind);
            });
            // Styles should be placed first
            if (isInlineStyle) {
                styleReplacements.unshift(...styles);
            }
            else {
                styleReplacements.push(...styles);
            }
            return undefined;
        default:
            return node;
    }
}
function getResourceUrl(node) {
    // only analyze strings
    if (!ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node)) {
        return null;
    }
    return `${/^\.?\.\//.test(node.text) ? '' : './'}${node.text}?${exports.NG_COMPONENT_RESOURCE_QUERY}`;
}
exports.getResourceUrl = getResourceUrl;
function isComponentDecorator(node, typeChecker) {
    if (!ts.isDecorator(node)) {
        return false;
    }
    const origin = getDecoratorOrigin(node, typeChecker);
    if (origin && origin.module === '@angular/core' && origin.name === 'Component') {
        return true;
    }
    return false;
}
function createResourceImport(nodeFactory, url, resourceImportDeclarations, moduleKind) {
    const urlLiteral = nodeFactory.createStringLiteral(url);
    if (moduleKind < ts.ModuleKind.ES2015) {
        return nodeFactory.createCallExpression(nodeFactory.createIdentifier('require'), [], [urlLiteral]);
    }
    else {
        const importName = nodeFactory.createIdentifier(`__NG_CLI_RESOURCE__${resourceImportDeclarations.length}`);
        resourceImportDeclarations.push(nodeFactory.createImportDeclaration(undefined, nodeFactory.createImportClause(false, importName, undefined), urlLiteral));
        return importName;
    }
}
function getDecoratorOrigin(decorator, typeChecker) {
    if (!ts.isCallExpression(decorator.expression)) {
        return null;
    }
    let identifier;
    let name = '';
    if (ts.isPropertyAccessExpression(decorator.expression.expression)) {
        identifier = decorator.expression.expression.expression;
        name = decorator.expression.expression.name.text;
    }
    else if (ts.isIdentifier(decorator.expression.expression)) {
        identifier = decorator.expression.expression;
    }
    else {
        return null;
    }
    // NOTE: resolver.getReferencedImportDeclaration would work as well but is internal
    const symbol = typeChecker.getSymbolAtLocation(identifier);
    if (symbol && symbol.declarations && symbol.declarations.length > 0) {
        const declaration = symbol.declarations[0];
        let module;
        if (ts.isImportSpecifier(declaration)) {
            name = (declaration.propertyName || declaration.name).text;
            module = declaration.parent.parent.parent.moduleSpecifier.text;
        }
        else if (ts.isNamespaceImport(declaration)) {
            // Use the name from the decorator namespace property access
            module = declaration.parent.parent.moduleSpecifier.text;
        }
        else if (ts.isImportClause(declaration)) {
            name = declaration.name.text;
            module = declaration.parent.moduleSpecifier.text;
        }
        else {
            return null;
        }
        return { name, module };
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZV9yZXNvdXJjZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9uZ3Rvb2xzL3dlYnBhY2svc3JjL3RyYW5zZm9ybWVycy9yZXBsYWNlX3Jlc291cmNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUFpQztBQUNqQyxnRUFBNkU7QUFFaEUsUUFBQSwyQkFBMkIsR0FBRyxZQUFZLENBQUM7QUFFeEQsU0FBZ0IsZ0JBQWdCLENBQzlCLGVBQThDLEVBQzlDLGNBQW9DLEVBQ3BDLHdCQUFpQztJQUVqQyxPQUFPLENBQUMsT0FBaUMsRUFBRSxFQUFFO1FBQzNDLE1BQU0sV0FBVyxHQUFHLGNBQWMsRUFBRSxDQUFDO1FBQ3JDLE1BQU0sMEJBQTBCLEdBQTJCLEVBQUUsQ0FBQztRQUM5RCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxNQUFNLENBQUM7UUFDdkQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUVwQyxNQUFNLFNBQVMsR0FBZSxDQUFDLElBQWEsRUFBRSxFQUFFO1lBQzlDLElBQUksRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUMvQixNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUUxQyxJQUFJLENBQUMsVUFBVSxJQUFJLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO29CQUMxQyxPQUFPLElBQUksQ0FBQztpQkFDYjtnQkFFRCxPQUFPLFdBQVcsQ0FBQyxzQkFBc0IsQ0FDdkMsSUFBSSxFQUNKO29CQUNFLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQzVCLGNBQWMsQ0FDWixXQUFXLEVBQ1gsT0FBTyxFQUNQ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RUFBRSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUN6QyxJQUFJLEdBQUksV0FBVyxDQUFDLElBQXNCLENBQUMsSUFBSSxDQUFDO1lBQ2hELE1BQU0sR0FBSSxXQUFXLENBQUMsTUFBTSxDQUFDLGVBQWlDLENBQUMsSUFBSSxDQUFDO1NBQ3JFO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQztLQUN6QjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7IElubGluZUFuZ3VsYXJSZXNvdXJjZUxvYWRlclBhdGggfSBmcm9tICcuLi9sb2FkZXJzL2lubGluZS1yZXNvdXJjZSc7XG5cbmV4cG9ydCBjb25zdCBOR19DT01QT05FTlRfUkVTT1VSQ0VfUVVFUlkgPSAnbmdSZXNvdXJjZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXBsYWNlUmVzb3VyY2VzKFxuICBzaG91bGRUcmFuc2Zvcm06IChmaWxlTmFtZTogc3RyaW5nKSA9PiBib29sZWFuLFxuICBnZXRUeXBlQ2hlY2tlcjogKCkgPT4gdHMuVHlwZUNoZWNrZXIsXG4gIGlubGluZVN0eWxlRmlsZUV4dGVuc2lvbj86IHN0cmluZyxcbik6IHRzLlRyYW5zZm9ybWVyRmFjdG9yeTx0cy5Tb3VyY2VGaWxlPiB7XG4gIHJldHVybiAoY29udGV4dDogdHMuVHJhbnNmb3JtYXRpb25Db250ZXh0KSA9PiB7XG4gICAgY29uc3QgdHlwZUNoZWNrZXIgPSBnZXRUeXBlQ2hlY2tlcigpO1xuICAgIGNvbnN0IHJlc291cmNlSW1wb3J0RGVjbGFyYXRpb25zOiB0cy5JbXBvcnREZWNsYXJhdGlvbltdID0gW107XG4gICAgY29uc3QgbW9kdWxlS2luZCA9IGNvbnRleHQuZ2V0Q29tcGlsZXJPcHRpb25zKCkubW9kdWxlO1xuICAgIGNvbnN0IG5vZGVGYWN0b3J5ID0gY29udGV4dC5mYWN0b3J5O1xuXG4gICAgY29uc3QgdmlzaXROb2RlOiB0cy5WaXNpdG9yID0gKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgY29uc3QgZGVjb3JhdG9ycyA9IHRzLmdldERlY29yYXRvcnMobm9kZSk7XG5cbiAgICAgICAgaWYgKCFkZWNvcmF0b3JzIHx8IGRlY29yYXRvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZUZhY3RvcnkudXBkYXRlQ2xhc3NEZWNsYXJhdGlvbihcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIFtcbiAgICAgICAgICAgIC4uLmRlY29yYXRvcnMubWFwKChjdXJyZW50KSA9PlxuICAgICAgICAgICAgICB2aXNpdERlY29yYXRvcihcbiAgICAgICAgICAgICAgICBub2RlRmFjdG9yeSxcbiAgICAgICAgICAgICAgICBjdXJyZW50LFxuICAgICAgICAgICAgICAgIHR5cGVDaGVja2VyLFxuICAgICAgICAgICAgICAgIHJlc291cmNlSW1wb3J0RGVjbGFyYXRpb25zLFxuICAgICAgICAgICAgICAgIG1vZHVsZUtpbmQsXG4gICAgICAgICAgICAgICAgaW5saW5lU3R5bGVGaWxlRXh0ZW5zaW9uLFxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIC4uLih0cy5nZXRNb2RpZmllcnMobm9kZSkgPz8gW10pLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgbm9kZS5uYW1lLFxuICAgICAgICAgIG5vZGUudHlwZVBhcmFtZXRlcnMsXG4gICAgICAgICAgbm9kZS5oZXJpdGFnZUNsYXVzZXMsXG4gICAgICAgICAgbm9kZS5tZW1iZXJzLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHMudmlzaXRFYWNoQ2hpbGQobm9kZSwgdmlzaXROb2RlLCBjb250ZXh0KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIChzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKSA9PiB7XG4gICAgICBpZiAoIXNob3VsZFRyYW5zZm9ybShzb3VyY2VGaWxlLmZpbGVOYW1lKSkge1xuICAgICAgICByZXR1cm4gc291cmNlRmlsZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdXBkYXRlZFNvdXJjZUZpbGUgPSB0cy52aXNpdE5vZGUoc291cmNlRmlsZSwgdmlzaXROb2RlKSBhcyB0cy5Tb3VyY2VGaWxlO1xuICAgICAgaWYgKHJlc291cmNlSW1wb3J0RGVjbGFyYXRpb25zLmxlbmd0aCkge1xuICAgICAgICAvLyBBZGQgcmVzb3VyY2UgaW1wb3J0c1xuICAgICAgICByZXR1cm4gY29udGV4dC5mYWN0b3J5LnVwZGF0ZVNvdXJjZUZpbGUoXG4gICAgICAgICAgdXBkYXRlZFNvdXJjZUZpbGUsXG4gICAgICAgICAgdHMuc2V0VGV4dFJhbmdlKFxuICAgICAgICAgICAgY29udGV4dC5mYWN0b3J5LmNyZWF0ZU5vZGVBcnJheShbXG4gICAgICAgICAgICAgIC4uLnJlc291cmNlSW1wb3J0RGVjbGFyYXRpb25zLFxuICAgICAgICAgICAgICAuLi51cGRhdGVkU291cmNlRmlsZS5zdGF0ZW1lbnRzLFxuICAgICAgICAgICAgXSksXG4gICAgICAgICAgICB1cGRhdGVkU291cmNlRmlsZS5zdGF0ZW1lbnRzLFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB1cGRhdGVkU291cmNlRmlsZTtcbiAgICB9O1xuICB9O1xufVxuXG5mdW5jdGlvbiB2aXNpdERlY29yYXRvcihcbiAgbm9kZUZhY3Rvcnk6IHRzLk5vZGVGYWN0b3J5LFxuICBub2RlOiB0cy5EZWNvcmF0b3IsXG4gIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgcmVzb3VyY2VJbXBvcnREZWNsYXJhdGlvbnM6IHRzLkltcG9ydERlY2xhcmF0aW9uW10sXG4gIG1vZHVsZUtpbmQ/OiB0cy5Nb2R1bGVLaW5kLFxuICBpbmxpbmVTdHlsZUZpbGVFeHRlbnNpb24/OiBzdHJpbmcsXG4pOiB0cy5EZWNvcmF0b3Ige1xuICBpZiAoIWlzQ29tcG9uZW50RGVjb3JhdG9yKG5vZGUsIHR5cGVDaGVja2VyKSkge1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgaWYgKCF0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbikpIHtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIGNvbnN0IGRlY29yYXRvckZhY3RvcnkgPSBub2RlLmV4cHJlc3Npb247XG4gIGNvbnN0IGFyZ3MgPSBkZWNvcmF0b3JGYWN0b3J5LmFyZ3VtZW50cztcbiAgaWYgKGFyZ3MubGVuZ3RoICE9PSAxIHx8ICF0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKGFyZ3NbMF0pKSB7XG4gICAgLy8gVW5zdXBwb3J0ZWQgY29tcG9uZW50IG1ldGFkYXRhXG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBjb25zdCBvYmplY3RFeHByZXNzaW9uID0gYXJnc1swXSBhcyB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbjtcbiAgY29uc3Qgc3R5bGVSZXBsYWNlbWVudHM6IHRzLkV4cHJlc3Npb25bXSA9IFtdO1xuXG4gIC8vIHZpc2l0IGFsbCBwcm9wZXJ0aWVzXG4gIGxldCBwcm9wZXJ0aWVzID0gdHMudmlzaXROb2RlcyhvYmplY3RFeHByZXNzaW9uLnByb3BlcnRpZXMsIChub2RlKSA9PlxuICAgIHRzLmlzT2JqZWN0TGl0ZXJhbEVsZW1lbnRMaWtlKG5vZGUpXG4gICAgICA/IHZpc2l0Q29tcG9uZW50TWV0YWRhdGEoXG4gICAgICAgICAgbm9kZUZhY3RvcnksXG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICBzdHlsZVJlcGxhY2VtZW50cyxcbiAgICAgICAgICByZXNvdXJjZUltcG9ydERlY2xhcmF0aW9ucyxcbiAgICAgICAgICBtb2R1bGVLaW5kLFxuICAgICAgICAgIGlubGluZVN0eWxlRmlsZUV4dGVuc2lvbixcbiAgICAgICAgKVxuICAgICAgOiBub2RlLFxuICApIGFzIHRzLk5vZGVBcnJheTx0cy5PYmplY3RMaXRlcmFsRWxlbWVudExpa2U+O1xuXG4gIC8vIHJlcGxhY2UgcHJvcGVydGllcyB3aXRoIHVwZGF0ZWQgcHJvcGVydGllc1xuICBpZiAoc3R5bGVSZXBsYWNlbWVudHMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHN0eWxlUHJvcGVydHkgPSBub2RlRmFjdG9yeS5jcmVhdGVQcm9wZXJ0eUFzc2lnbm1lbnQoXG4gICAgICBub2RlRmFjdG9yeS5jcmVhdGVJZGVudGlmaWVyKCdzdHlsZXMnKSxcbiAgICAgIG5vZGVGYWN0b3J5LmNyZWF0ZUFycmF5TGl0ZXJhbEV4cHJlc3Npb24oc3R5bGVSZXBsYWNlbWVudHMpLFxuICAgICk7XG5cbiAgICBwcm9wZXJ0aWVzID0gbm9kZUZhY3RvcnkuY3JlYXRlTm9kZUFycmF5KFsuLi5wcm9wZXJ0aWVzLCBzdHlsZVByb3BlcnR5XSk7XG4gIH1cblxuICByZXR1cm4gbm9kZUZhY3RvcnkudXBkYXRlRGVjb3JhdG9yKFxuICAgIG5vZGUsXG4gICAgbm9kZUZhY3RvcnkudXBkYXRlQ2FsbEV4cHJlc3Npb24oXG4gICAgICBkZWNvcmF0b3JGYWN0b3J5LFxuICAgICAgZGVjb3JhdG9yRmFjdG9yeS5leHByZXNzaW9uLFxuICAgICAgZGVjb3JhdG9yRmFjdG9yeS50eXBlQXJndW1lbnRzLFxuICAgICAgW25vZGVGYWN0b3J5LnVwZGF0ZU9iamVjdExpdGVyYWxFeHByZXNzaW9uKG9iamVjdEV4cHJlc3Npb24sIHByb3BlcnRpZXMpXSxcbiAgICApLFxuICApO1xufVxuXG5mdW5jdGlvbiB2aXNpdENvbXBvbmVudE1ldGFkYXRhKFxuICBub2RlRmFjdG9yeTogdHMuTm9kZUZhY3RvcnksXG4gIG5vZGU6IHRzLk9iamVjdExpdGVyYWxFbGVtZW50TGlrZSxcbiAgc3R5bGVSZXBsYWNlbWVudHM6IHRzLkV4cHJlc3Npb25bXSxcbiAgcmVzb3VyY2VJbXBvcnREZWNsYXJhdGlvbnM6IHRzLkltcG9ydERlY2xhcmF0aW9uW10sXG4gIG1vZHVsZUtpbmQ6IHRzLk1vZHVsZUtpbmQgPSB0cy5Nb2R1bGVLaW5kLkVTMjAxNSxcbiAgaW5saW5lU3R5bGVGaWxlRXh0ZW5zaW9uPzogc3RyaW5nLFxuKTogdHMuT2JqZWN0TGl0ZXJhbEVsZW1lbnRMaWtlIHwgdW5kZWZpbmVkIHtcbiAgaWYgKCF0cy5pc1Byb3BlcnR5QXNzaWdubWVudChub2RlKSB8fCB0cy5pc0NvbXB1dGVkUHJvcGVydHlOYW1lKG5vZGUubmFtZSkpIHtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIGNvbnN0IG5hbWUgPSBub2RlLm5hbWUudGV4dDtcbiAgc3dpdGNoIChuYW1lKSB7XG4gICAgY2FzZSAnbW9kdWxlSWQnOlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcblxuICAgIGNhc2UgJ3RlbXBsYXRlVXJsJzpcbiAgICAgIGNvbnN0IHVybCA9IGdldFJlc291cmNlVXJsKG5vZGUuaW5pdGlhbGl6ZXIpO1xuICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGltcG9ydE5hbWUgPSBjcmVhdGVSZXNvdXJjZUltcG9ydChcbiAgICAgICAgbm9kZUZhY3RvcnksXG4gICAgICAgIHVybCxcbiAgICAgICAgcmVzb3VyY2VJbXBvcnREZWNsYXJhdGlvbnMsXG4gICAgICAgIG1vZHVsZUtpbmQsXG4gICAgICApO1xuICAgICAgaWYgKCFpbXBvcnROYW1lKSB7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbm9kZUZhY3RvcnkudXBkYXRlUHJvcGVydHlBc3NpZ25tZW50KFxuICAgICAgICBub2RlLFxuICAgICAgICBub2RlRmFjdG9yeS5jcmVhdGVJZGVudGlmaWVyKCd0ZW1wbGF0ZScpLFxuICAgICAgICBpbXBvcnROYW1lLFxuICAgICAgKTtcbiAgICBjYXNlICdzdHlsZXMnOlxuICAgIGNhc2UgJ3N0eWxlVXJscyc6XG4gICAgICBpZiAoIXRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihub2RlLmluaXRpYWxpemVyKSkge1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXNJbmxpbmVTdHlsZSA9IG5hbWUgPT09ICdzdHlsZXMnO1xuICAgICAgY29uc3Qgc3R5bGVzID0gdHMudmlzaXROb2Rlcyhub2RlLmluaXRpYWxpemVyLmVsZW1lbnRzLCAobm9kZSkgPT4ge1xuICAgICAgICBpZiAoIXRzLmlzU3RyaW5nTGl0ZXJhbChub2RlKSAmJiAhdHMuaXNOb1N1YnN0aXR1dGlvblRlbXBsYXRlTGl0ZXJhbChub2RlKSkge1xuICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHVybDtcbiAgICAgICAgaWYgKGlzSW5saW5lU3R5bGUpIHtcbiAgICAgICAgICBpZiAoaW5saW5lU3R5bGVGaWxlRXh0ZW5zaW9uKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gQnVmZmVyLmZyb20obm9kZS50ZXh0KS50b1N0cmluZygnYmFzZTY0Jyk7XG4gICAgICAgICAgICBjb25zdCBjb250YWluaW5nRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpLmZpbGVOYW1lO1xuICAgICAgICAgICAgLy8gYXBwLmNvbXBvbmVudC50cy5jc3M/bmdSZXNvdXJjZSE9IUBuZ3Rvb2xzL3dlYnBhY2svc3JjL2xvYWRlcnMvaW5saW5lLXJlc291cmNlLmpzP2RhdGE9Li4uIWFwcC5jb21wb25lbnQudHNcbiAgICAgICAgICAgIHVybCA9XG4gICAgICAgICAgICAgIGAke2NvbnRhaW5pbmdGaWxlfS4ke2lubGluZVN0eWxlRmlsZUV4dGVuc2lvbn0/JHtOR19DT01QT05FTlRfUkVTT1VSQ0VfUVVFUll9YCArXG4gICAgICAgICAgICAgIGAhPSEke0lubGluZUFuZ3VsYXJSZXNvdXJjZUxvYWRlclBhdGh9P2RhdGE9JHtlbmNvZGVVUklDb21wb25lbnQoXG4gICAgICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgICAgKX0hJHtjb250YWluaW5nRmlsZX1gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZUZhY3RvcnkuY3JlYXRlU3RyaW5nTGl0ZXJhbChub2RlLnRleHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cmwgPSBnZXRSZXNvdXJjZVVybChub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXJsKSB7XG4gICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3JlYXRlUmVzb3VyY2VJbXBvcnQobm9kZUZhY3RvcnksIHVybCwgcmVzb3VyY2VJbXBvcnREZWNsYXJhdGlvbnMsIG1vZHVsZUtpbmQpO1xuICAgICAgfSkgYXMgdHMuTm9kZUFycmF5PHRzLkV4cHJlc3Npb24+O1xuXG4gICAgICAvLyBTdHlsZXMgc2hvdWxkIGJlIHBsYWNlZCBmaXJzdFxuICAgICAgaWYgKGlzSW5saW5lU3R5bGUpIHtcbiAgICAgICAgc3R5bGVSZXBsYWNlbWVudHMudW5zaGlmdCguLi5zdHlsZXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGVSZXBsYWNlbWVudHMucHVzaCguLi5zdHlsZXMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gbm9kZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzb3VyY2VVcmwobm9kZTogdHMuTm9kZSk6IHN0cmluZyB8IG51bGwge1xuICAvLyBvbmx5IGFuYWx5emUgc3RyaW5nc1xuICBpZiAoIXRzLmlzU3RyaW5nTGl0ZXJhbChub2RlKSAmJiAhdHMuaXNOb1N1YnN0aXR1dGlvblRlbXBsYXRlTGl0ZXJhbChub2RlKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGAkey9eXFwuP1xcLlxcLy8udGVzdChub2RlLnRleHQpID8gJycgOiAnLi8nfSR7bm9kZS50ZXh0fT8ke05HX0NPTVBPTkVOVF9SRVNPVVJDRV9RVUVSWX1gO1xufVxuXG5mdW5jdGlvbiBpc0NvbXBvbmVudERlY29yYXRvcihub2RlOiB0cy5Ob2RlLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiBub2RlIGlzIHRzLkRlY29yYXRvciB7XG4gIGlmICghdHMuaXNEZWNvcmF0b3Iobm9kZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBvcmlnaW4gPSBnZXREZWNvcmF0b3JPcmlnaW4obm9kZSwgdHlwZUNoZWNrZXIpO1xuICBpZiAob3JpZ2luICYmIG9yaWdpbi5tb2R1bGUgPT09ICdAYW5ndWxhci9jb3JlJyAmJiBvcmlnaW4ubmFtZSA9PT0gJ0NvbXBvbmVudCcpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVzb3VyY2VJbXBvcnQoXG4gIG5vZGVGYWN0b3J5OiB0cy5Ob2RlRmFjdG9yeSxcbiAgdXJsOiBzdHJpbmcsXG4gIHJlc291cmNlSW1wb3J0RGVjbGFyYXRpb25zOiB0cy5JbXBvcnREZWNsYXJhdGlvbltdLFxuICBtb2R1bGVLaW5kOiB0cy5Nb2R1bGVLaW5kLFxuKTogdHMuSWRlbnRpZmllciB8IHRzLkV4cHJlc3Npb24ge1xuICBjb25zdCB1cmxMaXRlcmFsID0gbm9kZUZhY3RvcnkuY3JlYXRlU3RyaW5nTGl0ZXJhbCh1cmwpO1xuXG4gIGlmIChtb2R1bGVLaW5kIDwgdHMuTW9kdWxlS2luZC5FUzIwMTUpIHtcbiAgICByZXR1cm4gbm9kZUZhY3RvcnkuY3JlYXRlQ2FsbEV4cHJlc3Npb24oXG4gICAgICBub2RlRmFjdG9yeS5jcmVhdGVJZGVudGlmaWVyKCdyZXF1aXJlJyksXG4gICAgICBbXSxcbiAgICAgIFt1cmxMaXRlcmFsXSxcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGltcG9ydE5hbWUgPSBub2RlRmFjdG9yeS5jcmVhdGVJZGVudGlmaWVyKFxuICAgICAgYF9fTkdfQ0xJX1JFU09VUkNFX18ke3Jlc291cmNlSW1wb3J0RGVjbGFyYXRpb25zLmxlbmd0aH1gLFxuICAgICk7XG4gICAgcmVzb3VyY2VJbXBvcnREZWNsYXJhdGlvbnMucHVzaChcbiAgICAgIG5vZGVGYWN0b3J5LmNyZWF0ZUltcG9ydERlY2xhcmF0aW9uKFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIG5vZGVGYWN0b3J5LmNyZWF0ZUltcG9ydENsYXVzZShmYWxzZSwgaW1wb3J0TmFtZSwgdW5kZWZpbmVkKSxcbiAgICAgICAgdXJsTGl0ZXJhbCxcbiAgICAgICksXG4gICAgKTtcblxuICAgIHJldHVybiBpbXBvcnROYW1lO1xuICB9XG59XG5cbmludGVyZmFjZSBEZWNvcmF0b3JPcmlnaW4ge1xuICBuYW1lOiBzdHJpbmc7XG4gIG1vZHVsZTogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZXREZWNvcmF0b3JPcmlnaW4oXG4gIGRlY29yYXRvcjogdHMuRGVjb3JhdG9yLFxuICB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4pOiBEZWNvcmF0b3JPcmlnaW4gfCBudWxsIHtcbiAgaWYgKCF0cy5pc0NhbGxFeHByZXNzaW9uKGRlY29yYXRvci5leHByZXNzaW9uKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgbGV0IGlkZW50aWZpZXI6IHRzLk5vZGU7XG4gIGxldCBuYW1lID0gJyc7XG5cbiAgaWYgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKGRlY29yYXRvci5leHByZXNzaW9uLmV4cHJlc3Npb24pKSB7XG4gICAgaWRlbnRpZmllciA9IGRlY29yYXRvci5leHByZXNzaW9uLmV4cHJlc3Npb24uZXhwcmVzc2lvbjtcbiAgICBuYW1lID0gZGVjb3JhdG9yLmV4cHJlc3Npb24uZXhwcmVzc2lvbi5uYW1lLnRleHQ7XG4gIH0gZWxzZSBpZiAodHMuaXNJZGVudGlmaWVyKGRlY29yYXRvci5leHByZXNzaW9uLmV4cHJlc3Npb24pKSB7XG4gICAgaWRlbnRpZmllciA9IGRlY29yYXRvci5leHByZXNzaW9uLmV4cHJlc3Npb247XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBOT1RFOiByZXNvbHZlci5nZXRSZWZlcmVuY2VkSW1wb3J0RGVjbGFyYXRpb24gd291bGQgd29yayBhcyB3ZWxsIGJ1dCBpcyBpbnRlcm5hbFxuICBjb25zdCBzeW1ib2wgPSB0eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKGlkZW50aWZpZXIpO1xuICBpZiAoc3ltYm9sICYmIHN5bWJvbC5kZWNsYXJhdGlvbnMgJiYgc3ltYm9sLmRlY2xhcmF0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgZGVjbGFyYXRpb24gPSBzeW1ib2wuZGVjbGFyYXRpb25zWzBdO1xuICAgIGxldCBtb2R1bGU6IHN0cmluZztcblxuICAgIGlmICh0cy5pc0ltcG9ydFNwZWNpZmllcihkZWNsYXJhdGlvbikpIHtcbiAgICAgIG5hbWUgPSAoZGVjbGFyYXRpb24ucHJvcGVydHlOYW1lIHx8IGRlY2xhcmF0aW9uLm5hbWUpLnRleHQ7XG4gICAgICBtb2R1bGUgPSAoZGVjbGFyYXRpb24ucGFyZW50LnBhcmVudC5wYXJlbnQubW9kdWxlU3BlY2lmaWVyIGFzIHRzLklkZW50aWZpZXIpLnRleHQ7XG4gICAgfSBlbHNlIGlmICh0cy5pc05hbWVzcGFjZUltcG9ydChkZWNsYXJhdGlvbikpIHtcbiAgICAgIC8vIFVzZSB0aGUgbmFtZSBmcm9tIHRoZSBkZWNvcmF0b3IgbmFtZXNwYWNlIHByb3BlcnR5IGFjY2Vzc1xuICAgICAgbW9kdWxlID0gKGRlY2xhcmF0aW9uLnBhcmVudC5wYXJlbnQubW9kdWxlU3BlY2lmaWVyIGFzIHRzLklkZW50aWZpZXIpLnRleHQ7XG4gICAgfSBlbHNlIGlmICh0cy5pc0ltcG9ydENsYXVzZShkZWNsYXJhdGlvbikpIHtcbiAgICAgIG5hbWUgPSAoZGVjbGFyYXRpb24ubmFtZSBhcyB0cy5JZGVudGlmaWVyKS50ZXh0O1xuICAgICAgbW9kdWxlID0gKGRlY2xhcmF0aW9uLnBhcmVudC5tb2R1bGVTcGVjaWZpZXIgYXMgdHMuSWRlbnRpZmllcikudGV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgbmFtZSwgbW9kdWxlIH07XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==