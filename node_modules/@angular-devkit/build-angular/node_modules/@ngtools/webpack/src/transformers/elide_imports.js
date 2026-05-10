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
exports.elideImports = void 0;
const ts = __importStar(require("typescript"));
// Remove imports for which all identifiers have been removed.
// Needs type checker, and works even if it's not the first transformer.
// Works by removing imports for symbols whose identifiers have all been removed.
// Doesn't use the `symbol.declarations` because that previous transforms might have removed nodes
// but the type checker doesn't know.
// See https://github.com/Microsoft/TypeScript/issues/17552 for more information.
function elideImports(sourceFile, removedNodes, getTypeChecker, compilerOptions) {
    const importNodeRemovals = new Set();
    if (removedNodes.length === 0) {
        return importNodeRemovals;
    }
    const typeChecker = getTypeChecker();
    // Collect all imports and used identifiers
    const usedSymbols = new Set();
    const imports = [];
    ts.forEachChild(sourceFile, function visit(node) {
        // Skip removed nodes.
        if (removedNodes.includes(node)) {
            return;
        }
        // Consider types for 'implements' as unused.
        // A HeritageClause token can also be an 'AbstractKeyword'
        // which in that case we should not elide the import.
        if (ts.isHeritageClause(node) && node.token === ts.SyntaxKind.ImplementsKeyword) {
            return;
        }
        // Record import and skip
        if (ts.isImportDeclaration(node)) {
            if (!node.importClause?.isTypeOnly) {
                imports.push(node);
            }
            return;
        }
        // Type reference imports do not need to be emitted when emitDecoratorMetadata is disabled.
        if (ts.isTypeReferenceNode(node) && !compilerOptions.emitDecoratorMetadata) {
            return;
        }
        let symbol;
        switch (node.kind) {
            case ts.SyntaxKind.Identifier:
                const parent = node.parent;
                if (parent && ts.isShorthandPropertyAssignment(parent)) {
                    const shorthandSymbol = typeChecker.getShorthandAssignmentValueSymbol(parent);
                    if (shorthandSymbol) {
                        symbol = shorthandSymbol;
                    }
                }
                else {
                    symbol = typeChecker.getSymbolAtLocation(node);
                }
                break;
            case ts.SyntaxKind.ExportSpecifier:
                symbol = typeChecker.getExportSpecifierLocalTargetSymbol(node);
                break;
            case ts.SyntaxKind.ShorthandPropertyAssignment:
                symbol = typeChecker.getShorthandAssignmentValueSymbol(node);
                break;
        }
        if (symbol) {
            usedSymbols.add(symbol);
        }
        ts.forEachChild(node, visit);
    });
    if (imports.length === 0) {
        return importNodeRemovals;
    }
    const isUnused = (node) => {
        // Do not remove JSX factory imports
        if (node.text === compilerOptions.jsxFactory) {
            return false;
        }
        const symbol = typeChecker.getSymbolAtLocation(node);
        return symbol && !usedSymbols.has(symbol);
    };
    for (const node of imports) {
        if (!node.importClause) {
            // "import 'abc';"
            continue;
        }
        const namedBindings = node.importClause.namedBindings;
        if (namedBindings && ts.isNamespaceImport(namedBindings)) {
            // "import * as XYZ from 'abc';"
            if (isUnused(namedBindings.name)) {
                importNodeRemovals.add(node);
            }
        }
        else {
            const specifierNodeRemovals = [];
            let clausesCount = 0;
            // "import { XYZ, ... } from 'abc';"
            if (namedBindings && ts.isNamedImports(namedBindings)) {
                let removedClausesCount = 0;
                clausesCount += namedBindings.elements.length;
                for (const specifier of namedBindings.elements) {
                    if (specifier.isTypeOnly || isUnused(specifier.name)) {
                        removedClausesCount++;
                        // in case we don't have any more namedImports we should remove the parent ie the {}
                        const nodeToRemove = clausesCount === removedClausesCount ? specifier.parent : specifier;
                        specifierNodeRemovals.push(nodeToRemove);
                    }
                }
            }
            // "import XYZ from 'abc';"
            if (node.importClause.name) {
                clausesCount++;
                if (node.importClause.isTypeOnly || isUnused(node.importClause.name)) {
                    specifierNodeRemovals.push(node.importClause.name);
                }
            }
            if (specifierNodeRemovals.length === clausesCount) {
                importNodeRemovals.add(node);
            }
            else {
                for (const specifierNodeRemoval of specifierNodeRemovals) {
                    importNodeRemovals.add(specifierNodeRemoval);
                }
            }
        }
    }
    return importNodeRemovals;
}
exports.elideImports = elideImports;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxpZGVfaW1wb3J0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvdHJhbnNmb3JtZXJzL2VsaWRlX2ltcG9ydHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwrQ0FBaUM7QUFFakMsOERBQThEO0FBQzlELHdFQUF3RTtBQUN4RSxpRkFBaUY7QUFDakYsa0dBQWtHO0FBQ2xHLHFDQUFxQztBQUNyQyxpRkFBaUY7QUFDakYsU0FBZ0IsWUFBWSxDQUMxQixVQUF5QixFQUN6QixZQUF1QixFQUN2QixjQUFvQyxFQUNwQyxlQUFtQztJQUVuQyxNQUFNLGtCQUFrQixHQUFHLElBQUksR0FBRyxFQUFXLENBQUM7SUFFOUMsSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUM3QixPQUFPLGtCQUFrQixDQUFDO0tBQzNCO0lBRUQsTUFBTSxXQUFXLEdBQUcsY0FBYyxFQUFFLENBQUM7SUFFckMsMkNBQTJDO0lBQzNDLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxFQUFhLENBQUM7SUFDekMsTUFBTSxPQUFPLEdBQTJCLEVBQUUsQ0FBQztJQUUzQyxFQUFFLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxTQUFTLEtBQUssQ0FBQyxJQUFJO1FBQzdDLHNCQUFzQjtRQUN0QixJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDL0IsT0FBTztTQUNSO1FBRUQsNkNBQTZDO1FBQzdDLDBEQUEwRDtRQUMxRCxxREFBcUQ7UUFDckQsSUFBSSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLGlCQUFpQixFQUFFO1lBQy9FLE9BQU87U0FDUjtRQUVELHlCQUF5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ZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG4vLyBSZW1vdmUgaW1wb3J0cyBmb3Igd2hpY2ggYWxsIGlkZW50aWZpZXJzIGhhdmUgYmVlbiByZW1vdmVkLlxuLy8gTmVlZHMgdHlwZSBjaGVja2VyLCBhbmQgd29ya3MgZXZlbiBpZiBpdCdzIG5vdCB0aGUgZmlyc3QgdHJhbnNmb3JtZXIuXG4vLyBXb3JrcyBieSByZW1vdmluZyBpbXBvcnRzIGZvciBzeW1ib2xzIHdob3NlIGlkZW50aWZpZXJzIGhhdmUgYWxsIGJlZW4gcmVtb3ZlZC5cbi8vIERvZXNuJ3QgdXNlIHRoZSBgc3ltYm9sLmRlY2xhcmF0aW9uc2AgYmVjYXVzZSB0aGF0IHByZXZpb3VzIHRyYW5zZm9ybXMgbWlnaHQgaGF2ZSByZW1vdmVkIG5vZGVzXG4vLyBidXQgdGhlIHR5cGUgY2hlY2tlciBkb2Vzbid0IGtub3cuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xNzU1MiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbmV4cG9ydCBmdW5jdGlvbiBlbGlkZUltcG9ydHMoXG4gIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsXG4gIHJlbW92ZWROb2RlczogdHMuTm9kZVtdLFxuICBnZXRUeXBlQ2hlY2tlcjogKCkgPT4gdHMuVHlwZUNoZWNrZXIsXG4gIGNvbXBpbGVyT3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zLFxuKTogU2V0PHRzLk5vZGU+IHtcbiAgY29uc3QgaW1wb3J0Tm9kZVJlbW92YWxzID0gbmV3IFNldDx0cy5Ob2RlPigpO1xuXG4gIGlmIChyZW1vdmVkTm9kZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGltcG9ydE5vZGVSZW1vdmFscztcbiAgfVxuXG4gIGNvbnN0IHR5cGVDaGVja2VyID0gZ2V0VHlwZUNoZWNrZXIoKTtcblxuICAvLyBDb2xsZWN0IGFsbCBpbXBvcnRzIGFuZCB1c2VkIGlkZW50aWZpZXJzXG4gIGNvbnN0IHVzZWRTeW1ib2xzID0gbmV3IFNldDx0cy5TeW1ib2w+KCk7XG4gIGNvbnN0IGltcG9ydHM6IHRzLkltcG9ydERlY2xhcmF0aW9uW10gPSBbXTtcblxuICB0cy5mb3JFYWNoQ2hpbGQoc291cmNlRmlsZSwgZnVuY3Rpb24gdmlzaXQobm9kZSkge1xuICAgIC8vIFNraXAgcmVtb3ZlZCBub2Rlcy5cbiAgICBpZiAocmVtb3ZlZE5vZGVzLmluY2x1ZGVzKG5vZGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQ29uc2lkZXIgdHlwZXMgZm9yICdpbXBsZW1lbnRzJyBhcyB1bnVzZWQuXG4gICAgLy8gQSBIZXJpdGFnZUNsYXVzZSB0b2tlbiBjYW4gYWxzbyBiZSBhbiAnQWJzdHJhY3RLZXl3b3JkJ1xuICAgIC8vIHdoaWNoIGluIHRoYXQgY2FzZSB3ZSBzaG91bGQgbm90IGVsaWRlIHRoZSBpbXBvcnQuXG4gICAgaWYgKHRzLmlzSGVyaXRhZ2VDbGF1c2Uobm9kZSkgJiYgbm9kZS50b2tlbiA9PT0gdHMuU3ludGF4S2luZC5JbXBsZW1lbnRzS2V5d29yZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJlY29yZCBpbXBvcnQgYW5kIHNraXBcbiAgICBpZiAodHMuaXNJbXBvcnREZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgaWYgKCFub2RlLmltcG9ydENsYXVzZT8uaXNUeXBlT25seSkge1xuICAgICAgICBpbXBvcnRzLnB1c2gobm9kZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUeXBlIHJlZmVyZW5jZSBpbXBvcnRzIGRvIG5vdCBuZWVkIHRvIGJlIGVtaXR0ZWQgd2hlbiBlbWl0RGVjb3JhdG9yTWV0YWRhdGEgaXMgZGlzYWJsZWQuXG4gICAgaWYgKHRzLmlzVHlwZVJlZmVyZW5jZU5vZGUobm9kZSkgJiYgIWNvbXBpbGVyT3B0aW9ucy5lbWl0RGVjb3JhdG9yTWV0YWRhdGEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgc3ltYm9sOiB0cy5TeW1ib2wgfCB1bmRlZmluZWQ7XG4gICAgc3dpdGNoIChub2RlLmtpbmQpIHtcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5JZGVudGlmaWVyOlxuICAgICAgICBjb25zdCBwYXJlbnQgPSBub2RlLnBhcmVudDtcbiAgICAgICAgaWYgKHBhcmVudCAmJiB0cy5pc1Nob3J0aGFuZFByb3BlcnR5QXNzaWdubWVudChwYXJlbnQpKSB7XG4gICAgICAgICAgY29uc3Qgc2hvcnRoYW5kU3ltYm9sID0gdHlwZUNoZWNrZXIuZ2V0U2hvcnRoYW5kQXNzaWdubWVudFZhbHVlU3ltYm9sKHBhcmVudCk7XG4gICAgICAgICAgaWYgKHNob3J0aGFuZFN5bWJvbCkge1xuICAgICAgICAgICAgc3ltYm9sID0gc2hvcnRoYW5kU3ltYm9sO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzeW1ib2wgPSB0eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkV4cG9ydFNwZWNpZmllcjpcbiAgICAgICAgc3ltYm9sID0gdHlwZUNoZWNrZXIuZ2V0RXhwb3J0U3BlY2lmaWVyTG9jYWxUYXJnZXRTeW1ib2wobm9kZSBhcyB0cy5FeHBvcnRTcGVjaWZpZXIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5TaG9ydGhhbmRQcm9wZXJ0eUFzc2lnbm1lbnQ6XG4gICAgICAgIHN5bWJvbCA9IHR5cGVDaGVja2VyLmdldFNob3J0aGFuZEFzc2lnbm1lbnRWYWx1ZVN5bWJvbChub2RlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN5bWJvbCkge1xuICAgICAgdXNlZFN5bWJvbHMuYWRkKHN5bWJvbCk7XG4gICAgfVxuXG4gICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIHZpc2l0KTtcbiAgfSk7XG5cbiAgaWYgKGltcG9ydHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGltcG9ydE5vZGVSZW1vdmFscztcbiAgfVxuXG4gIGNvbnN0IGlzVW51c2VkID0gKG5vZGU6IHRzLklkZW50aWZpZXIpID0+IHtcbiAgICAvLyBEbyBub3QgcmVtb3ZlIEpTWCBmYWN0b3J5IGltcG9ydHNcbiAgICBpZiAobm9kZS50ZXh0ID09PSBjb21waWxlck9wdGlvbnMuanN4RmFjdG9yeSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHN5bWJvbCA9IHR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24obm9kZSk7XG5cbiAgICByZXR1cm4gc3ltYm9sICYmICF1c2VkU3ltYm9scy5oYXMoc3ltYm9sKTtcbiAgfTtcblxuICBmb3IgKGNvbnN0IG5vZGUgb2YgaW1wb3J0cykge1xuICAgIGlmICghbm9kZS5pbXBvcnRDbGF1c2UpIHtcbiAgICAgIC8vIFwiaW1wb3J0ICdhYmMnO1wiXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBuYW1lZEJpbmRpbmdzID0gbm9kZS5pbXBvcnRDbGF1c2UubmFtZWRCaW5kaW5ncztcblxuICAgIGlmIChuYW1lZEJpbmRpbmdzICYmIHRzLmlzTmFtZXNwYWNlSW1wb3J0KG5hbWVkQmluZGluZ3MpKSB7XG4gICAgICAvLyBcImltcG9ydCAqIGFzIFhZWiBmcm9tICdhYmMnO1wiXG4gICAgICBpZiAoaXNVbnVzZWQobmFtZWRCaW5kaW5ncy5uYW1lKSkge1xuICAgICAgICBpbXBvcnROb2RlUmVtb3ZhbHMuYWRkKG5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzcGVjaWZpZXJOb2RlUmVtb3ZhbHMgPSBbXTtcbiAgICAgIGxldCBjbGF1c2VzQ291bnQgPSAwO1xuXG4gICAgICAvLyBcImltcG9ydCB7IFhZWiwgLi4uIH0gZnJvbSAnYWJjJztcIlxuICAgICAgaWYgKG5hbWVkQmluZGluZ3MgJiYgdHMuaXNOYW1lZEltcG9ydHMobmFtZWRCaW5kaW5ncykpIHtcbiAgICAgICAgbGV0IHJlbW92ZWRDbGF1c2VzQ291bnQgPSAwO1xuICAgICAgICBjbGF1c2VzQ291bnQgKz0gbmFtZWRCaW5kaW5ncy5lbGVtZW50cy5sZW5ndGg7XG5cbiAgICAgICAgZm9yIChjb25zdCBzcGVjaWZpZXIgb2YgbmFtZWRCaW5kaW5ncy5lbGVtZW50cykge1xuICAgICAgICAgIGlmIChzcGVjaWZpZXIuaXNUeXBlT25seSB8fCBpc1VudXNlZChzcGVjaWZpZXIubmFtZSkpIHtcbiAgICAgICAgICAgIHJlbW92ZWRDbGF1c2VzQ291bnQrKztcbiAgICAgICAgICAgIC8vIGluIGNhc2Ugd2UgZG9uJ3QgaGF2ZSBhbnkgbW9yZSBuYW1lZEltcG9ydHMgd2Ugc2hvdWxkIHJlbW92ZSB0aGUgcGFyZW50IGllIHRoZSB7fVxuICAgICAgICAgICAgY29uc3Qgbm9kZVRvUmVtb3ZlID1cbiAgICAgICAgICAgICAgY2xhdXNlc0NvdW50ID09PSByZW1vdmVkQ2xhdXNlc0NvdW50ID8gc3BlY2lmaWVyLnBhcmVudCA6IHNwZWNpZmllcjtcblxuICAgICAgICAgICAgc3BlY2lmaWVyTm9kZVJlbW92YWxzLnB1c2gobm9kZVRvUmVtb3ZlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gXCJpbXBvcnQgWFlaIGZyb20gJ2FiYyc7XCJcbiAgICAgIGlmIChub2RlLmltcG9ydENsYXVzZS5uYW1lKSB7XG4gICAgICAgIGNsYXVzZXNDb3VudCsrO1xuXG4gICAgICAgIGlmIChub2RlLmltcG9ydENsYXVzZS5pc1R5cGVPbmx5IHx8IGlzVW51c2VkKG5vZGUuaW1wb3J0Q2xhdXNlLm5hbWUpKSB7XG4gICAgICAgICAgc3BlY2lmaWVyTm9kZVJlbW92YWxzLnB1c2gobm9kZS5pbXBvcnRDbGF1c2UubmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHNwZWNpZmllck5vZGVSZW1vdmFscy5sZW5ndGggPT09IGNsYXVzZXNDb3VudCkge1xuICAgICAgICBpbXBvcnROb2RlUmVtb3ZhbHMuYWRkKG5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChjb25zdCBzcGVjaWZpZXJOb2RlUmVtb3ZhbCBvZiBzcGVjaWZpZXJOb2RlUmVtb3ZhbHMpIHtcbiAgICAgICAgICBpbXBvcnROb2RlUmVtb3ZhbHMuYWRkKHNwZWNpZmllck5vZGVSZW1vdmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpbXBvcnROb2RlUmVtb3ZhbHM7XG59XG4iXX0=