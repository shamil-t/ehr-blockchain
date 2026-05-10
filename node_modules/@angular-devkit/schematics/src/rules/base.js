"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyToSubtree = exports.composeFileOperators = exports.forEach = exports.partitionApplyMerge = exports.when = exports.branchAndMerge = exports.asSource = exports.filter = exports.noop = exports.mergeWith = exports.apply = exports.chain = exports.empty = exports.source = void 0;
const rxjs_1 = require("rxjs");
const exception_1 = require("../exception/exception");
const host_tree_1 = require("../tree/host-tree");
const interface_1 = require("../tree/interface");
const scoped_1 = require("../tree/scoped");
const static_1 = require("../tree/static");
const call_1 = require("./call");
/**
 * A Source that returns an tree as its single value.
 */
function source(tree) {
    return () => tree;
}
exports.source = source;
/**
 * A source that returns an empty tree.
 */
function empty() {
    return () => (0, static_1.empty)();
}
exports.empty = empty;
/**
 * Chain multiple rules into a single rule.
 */
function chain(rules) {
    return async (initialTree, context) => {
        let intermediateTree;
        for await (const rule of rules) {
            intermediateTree = (0, call_1.callRule)(rule, intermediateTree ?? initialTree, context);
        }
        return () => intermediateTree;
    };
}
exports.chain = chain;
/**
 * Apply multiple rules to a source, and returns the source transformed.
 */
function apply(source, rules) {
    return (context) => (0, call_1.callRule)(chain(rules), (0, call_1.callSource)(source, context), context);
}
exports.apply = apply;
/**
 * Merge an input tree with the source passed in.
 */
function mergeWith(source, strategy = interface_1.MergeStrategy.Default) {
    return (tree, context) => {
        return (0, call_1.callSource)(source, context).pipe((0, rxjs_1.map)((sourceTree) => tree.merge(sourceTree, strategy || context.strategy)), (0, rxjs_1.mapTo)(tree));
    };
}
exports.mergeWith = mergeWith;
function noop() {
    return () => { };
}
exports.noop = noop;
function filter(predicate) {
    return (tree) => {
        if (host_tree_1.HostTree.isHostTree(tree)) {
            return new host_tree_1.FilterHostTree(tree, predicate);
        }
        else {
            throw new exception_1.SchematicsException('Tree type is not supported.');
        }
    };
}
exports.filter = filter;
function asSource(rule) {
    return (context) => (0, call_1.callRule)(rule, (0, static_1.empty)(), context);
}
exports.asSource = asSource;
function branchAndMerge(rule, strategy = interface_1.MergeStrategy.Default) {
    return (tree, context) => {
        return (0, call_1.callRule)(rule, tree.branch(), context).pipe((0, rxjs_1.map)((branch) => tree.merge(branch, strategy || context.strategy)), (0, rxjs_1.mapTo)(tree));
    };
}
exports.branchAndMerge = branchAndMerge;
function when(predicate, operator) {
    return (entry) => {
        if (predicate(entry.path, entry)) {
            return operator(entry);
        }
        else {
            return entry;
        }
    };
}
exports.when = when;
function partitionApplyMerge(predicate, ruleYes, ruleNo) {
    return (tree, context) => {
        const [yes, no] = (0, static_1.partition)(tree, predicate);
        return (0, rxjs_1.concat)((0, call_1.callRule)(ruleYes, yes, context), (0, call_1.callRule)(ruleNo || noop(), no, context)).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)(([yesTree, noTree]) => {
            yesTree.merge(noTree, context.strategy);
            return yesTree;
        }));
    };
}
exports.partitionApplyMerge = partitionApplyMerge;
function forEach(operator) {
    return (tree) => {
        tree.visit((path, entry) => {
            if (!entry) {
                return;
            }
            const newEntry = operator(entry);
            if (newEntry === entry) {
                return;
            }
            if (newEntry === null) {
                tree.delete(path);
                return;
            }
            if (newEntry.path != path) {
                tree.rename(path, newEntry.path);
            }
            if (!newEntry.content.equals(entry.content)) {
                tree.overwrite(newEntry.path, newEntry.content);
            }
        });
    };
}
exports.forEach = forEach;
function composeFileOperators(operators) {
    return (entry) => {
        let current = entry;
        for (const op of operators) {
            current = op(current);
            if (current === null) {
                // Deleted, just return.
                return null;
            }
        }
        return current;
    };
}
exports.composeFileOperators = composeFileOperators;
function applyToSubtree(path, rules) {
    return (tree, context) => {
        const scoped = new scoped_1.ScopedTree(tree, path);
        return (0, call_1.callRule)(chain(rules), scoped, context).pipe((0, rxjs_1.map)((result) => {
            if (result === scoped) {
                return tree;
            }
            else {
                throw new exception_1.SchematicsException('Original tree must be returned from all rules when using "applyToSubtree".');
            }
        }));
    };
}
exports.applyToSubtree = applyToSubtree;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3J1bGVzL2Jhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0JBQStEO0FBRS9ELHNEQUE2RDtBQUM3RCxpREFBNkQ7QUFDN0QsaURBQWtGO0FBQ2xGLDJDQUE0QztBQUM1QywyQ0FBaUU7QUFDakUsaUNBQThDO0FBRTlDOztHQUVHO0FBQ0gsU0FBZ0IsTUFBTSxDQUFDLElBQVU7SUFDL0IsT0FBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7QUFDcEIsQ0FBQztBQUZELHdCQUVDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixLQUFLO0lBQ25CLE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBQSxjQUFXLEdBQUUsQ0FBQztBQUM3QixDQUFDO0FBRkQsc0JBRUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLEtBQUssQ0FBQyxLQUEyQztJQUMvRCxPQUFPLEtBQUssRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLEVBQUU7UUFDcEMsSUFBSSxnQkFBOEMsQ0FBQztRQUNuRCxJQUFJLEtBQUssRUFBRSxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7WUFDOUIsZ0JBQWdCLEdBQUcsSUFBQSxlQUFRLEVBQUMsSUFBSSxFQUFFLGdCQUFnQixJQUFJLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM3RTtRQUVELE9BQU8sR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQUM7SUFDaEMsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVRELHNCQVNDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixLQUFLLENBQUMsTUFBYyxFQUFFLEtBQWE7SUFDakQsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBQSxlQUFRLEVBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUEs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QUVELFNBQWdCLG9CQUFvQixDQUFDLFNBQXlCO0lBQzVELE9BQU8sQ0FBQyxLQUFnQixFQUFFLEVBQUU7UUFDMUIsSUFBSSxPQUFPLEdBQXFCLEtBQUssQ0FBQztRQUN0QyxLQUFLLE1BQU0sRUFBRSxJQUFJLFNBQVMsRUFBRTtZQUMxQixPQUFPLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXRCLElBQUksT0FBTyxLQUFLLElBQUksRUFBRTtnQkFDcEIsd0JBQXdCO2dCQUN4QixPQUFPLElBQUksQ0FBQzthQUNiO1NBQ0Y7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDLENBQUM7QUFDSixDQUFDO0FBZEQsb0RBY0M7QUFFRCxTQUFnQixjQUFjLENBQUMsSUFBWSxFQUFFLEtBQWE7SUFDeEQsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRTtRQUN2QixNQUFNLE1BQU0sR0FBRyxJQUFJLG1CQUFVLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTFDLE9BQU8sSUFBQSxlQUFRLEVBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQ2pELElBQUEsVUFBRyxFQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDYixJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7Z0JBQ3JCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7aUJBQU07Z0JBQ0wsTUFBTSxJQUFJLCtCQUFtQixDQUMzQiw0RUFBNEUsQ0FDN0UsQ0FBQzthQUNIO1FBQ0gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUMsQ0FBQztBQUNKLENBQUM7QUFoQkQsd0NBZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IE9ic2VydmFibGUsIGNvbmNhdCwgbWFwLCBtYXBUbywgdG9BcnJheSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgRmlsZU9wZXJhdG9yLCBSdWxlLCBTb3VyY2UgfSBmcm9tICcuLi9lbmdpbmUvaW50ZXJmYWNlJztcbmltcG9ydCB7IFNjaGVtYXRpY3NFeGNlcHRpb24gfSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7IEZpbHRlckhvc3RUcmVlLCBIb3N0VHJlZSB9IGZyb20gJy4uL3RyZWUvaG9zdC10cmVlJztcbmltcG9ydCB7IEZpbGVFbnRyeSwgRmlsZVByZWRpY2F0ZSwgTWVyZ2VTdHJhdGVneSwgVHJlZSB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7IFNjb3BlZFRyZWUgfSBmcm9tICcuLi90cmVlL3Njb3BlZCc7XG5pbXBvcnQgeyBwYXJ0aXRpb24sIGVtcHR5IGFzIHN0YXRpY0VtcHR5IH0gZnJvbSAnLi4vdHJlZS9zdGF0aWMnO1xuaW1wb3J0IHsgY2FsbFJ1bGUsIGNhbGxTb3VyY2UgfSBmcm9tICcuL2NhbGwnO1xuXG4vKipcbiAqIEEgU291cmNlIHRoYXQgcmV0dXJucyBhbiB0cmVlIGFzIGl0cyBzaW5nbGUgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzb3VyY2UodHJlZTogVHJlZSk6IFNvdXJjZSB7XG4gIHJldHVybiAoKSA9PiB0cmVlO1xufVxuXG4vKipcbiAqIEEgc291cmNlIHRoYXQgcmV0dXJucyBhbiBlbXB0eSB0cmVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW1wdHkoKTogU291cmNlIHtcbiAgcmV0dXJuICgpID0+IHN0YXRpY0VtcHR5KCk7XG59XG5cbi8qKlxuICogQ2hhaW4gbXVsdGlwbGUgcnVsZXMgaW50byBhIHNpbmdsZSBydWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hhaW4ocnVsZXM6IEl0ZXJhYmxlPFJ1bGU+IHwgQXN5bmNJdGVyYWJsZTxSdWxlPik6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKGluaXRpYWxUcmVlLCBjb250ZXh0KSA9PiB7XG4gICAgbGV0IGludGVybWVkaWF0ZVRyZWU6IE9ic2VydmFibGU8VHJlZT4gfCB1bmRlZmluZWQ7XG4gICAgZm9yIGF3YWl0IChjb25zdCBydWxlIG9mIHJ1bGVzKSB7XG4gICAgICBpbnRlcm1lZGlhdGVUcmVlID0gY2FsbFJ1bGUocnVsZSwgaW50ZXJtZWRpYXRlVHJlZSA/PyBpbml0aWFsVHJlZSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuICgpID0+IGludGVybWVkaWF0ZVRyZWU7XG4gIH07XG59XG5cbi8qKlxuICogQXBwbHkgbXVsdGlwbGUgcnVsZXMgdG8gYSBzb3VyY2UsIGFuZCByZXR1cm5zIHRoZSBzb3VyY2UgdHJhbnNmb3JtZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseShzb3VyY2U6IFNvdXJjZSwgcnVsZXM6IFJ1bGVbXSk6IFNvdXJjZSB7XG4gIHJldHVybiAoY29udGV4dCkgPT4gY2FsbFJ1bGUoY2hhaW4ocnVsZXMpLCBjYWxsU291cmNlKHNvdXJjZSwgY29udGV4dCksIGNvbnRleHQpO1xufVxuXG4vKipcbiAqIE1lcmdlIGFuIGlucHV0IHRyZWUgd2l0aCB0aGUgc291cmNlIHBhc3NlZCBpbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlV2l0aChzb3VyY2U6IFNvdXJjZSwgc3RyYXRlZ3k6IE1lcmdlU3RyYXRlZ3kgPSBNZXJnZVN0cmF0ZWd5LkRlZmF1bHQpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlLCBjb250ZXh0KSA9PiB7XG4gICAgcmV0dXJuIGNhbGxTb3VyY2Uoc291cmNlLCBjb250ZXh0KS5waXBlKFxuICAgICAgbWFwKChzb3VyY2VUcmVlKSA9PiB0cmVlLm1lcmdlKHNvdXJjZVRyZWUsIHN0cmF0ZWd5IHx8IGNvbnRleHQuc3RyYXRlZ3kpKSxcbiAgICAgIG1hcFRvKHRyZWUpLFxuICAgICk7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub29wKCk6IFJ1bGUge1xuICByZXR1cm4gKCkgPT4ge307XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXIocHJlZGljYXRlOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+KTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSkgPT4ge1xuICAgIGlmIChIb3N0VHJlZS5pc0hvc3RUcmVlKHRyZWUpKSB7XG4gICAgICByZXR1cm4gbmV3IEZpbHRlckhvc3RUcmVlKHRyZWUsIHByZWRpY2F0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdUcmVlIHR5cGUgaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc1NvdXJjZShydWxlOiBSdWxlKTogU291cmNlIHtcbiAgcmV0dXJuIChjb250ZXh0KSA9PiBjYWxsUnVsZShydWxlLCBzdGF0aWNFbXB0eSgpLCBjb250ZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJyYW5jaEFuZE1lcmdlKHJ1bGU6IFJ1bGUsIHN0cmF0ZWd5ID0gTWVyZ2VTdHJhdGVneS5EZWZhdWx0KTogUnVsZSB7XG4gIHJldHVybiAodHJlZSwgY29udGV4dCkgPT4ge1xuICAgIHJldHVybiBjYWxsUnVsZShydWxlLCB0cmVlLmJyYW5jaCgpLCBjb250ZXh0KS5waXBlKFxuICAgICAgbWFwKChicmFuY2gpID0+IHRyZWUubWVyZ2UoYnJhbmNoLCBzdHJhdGVneSB8fCBjb250ZXh0LnN0cmF0ZWd5KSksXG4gICAgICBtYXBUbyh0cmVlKSxcbiAgICApO1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd2hlbihwcmVkaWNhdGU6IEZpbGVQcmVkaWNhdGU8Ym9vbGVhbj4sIG9wZXJhdG9yOiBGaWxlT3BlcmF0b3IpOiBGaWxlT3BlcmF0b3Ige1xuICByZXR1cm4gKGVudHJ5OiBGaWxlRW50cnkpID0+IHtcbiAgICBpZiAocHJlZGljYXRlKGVudHJ5LnBhdGgsIGVudHJ5KSkge1xuICAgICAgcmV0dXJuIG9wZXJhdG9yKGVudHJ5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGVudHJ5O1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnRpdGlvbkFwcGx5TWVyZ2UoXG4gIHByZWRpY2F0ZTogRmlsZVByZWRpY2F0ZTxib29sZWFuPixcbiAgcnVsZVllczogUnVsZSxcbiAgcnVsZU5vPzogUnVsZSxcbik6IFJ1bGUge1xuICByZXR1cm4gKHRyZWUsIGNvbnRleHQpID0+IHtcbiAgICBjb25zdCBbeWVzLCBub10gPSBwYXJ0aXRpb24odHJlZSwgcHJlZGljYXRlKTtcblxuICAgIHJldHVybiBjb25jYXQoY2FsbFJ1bGUocnVsZVllcywgeWVzLCBjb250ZXh0KSwgY2FsbFJ1bGUocnVsZU5vIHx8IG5vb3AoKSwgbm8sIGNvbnRleHQpKS5waXBlKFxuICAgICAgdG9BcnJheSgpLFxuICAgICAgbWFwKChbeWVzVHJlZSwgbm9UcmVlXSkgPT4ge1xuICAgICAgICB5ZXNUcmVlLm1lcmdlKG5vVHJlZSwgY29udGV4dC5zdHJhdGVneSk7XG5cbiAgICAgICAgcmV0dXJuIHllc1RyZWU7XG4gICAgICB9KSxcbiAgICApO1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9yRWFjaChvcGVyYXRvcjogRmlsZU9wZXJhdG9yKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSkgPT4ge1xuICAgIHRyZWUudmlzaXQoKHBhdGgsIGVudHJ5KSA9PiB7XG4gICAgICBpZiAoIWVudHJ5KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5ld0VudHJ5ID0gb3BlcmF0b3IoZW50cnkpO1xuICAgICAgaWYgKG5ld0VudHJ5ID09PSBlbnRyeSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAobmV3RW50cnkgPT09IG51bGwpIHtcbiAgICAgICAgdHJlZS5kZWxldGUocGF0aCk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKG5ld0VudHJ5LnBhdGggIT0gcGF0aCkge1xuICAgICAgICB0cmVlLnJlbmFtZShwYXRoLCBuZXdFbnRyeS5wYXRoKTtcbiAgICAgIH1cbiAgICAgIGlmICghbmV3RW50cnkuY29udGVudC5lcXVhbHMoZW50cnkuY29udGVudCkpIHtcbiAgICAgICAgdHJlZS5vdmVyd3JpdGUobmV3RW50cnkucGF0aCwgbmV3RW50cnkuY29udGVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wb3NlRmlsZU9wZXJhdG9ycyhvcGVyYXRvcnM6IEZpbGVPcGVyYXRvcltdKTogRmlsZU9wZXJhdG9yIHtcbiAgcmV0dXJuIChlbnRyeTogRmlsZUVudHJ5KSA9PiB7XG4gICAgbGV0IGN1cnJlbnQ6IEZpbGVFbnRyeSB8IG51bGwgPSBlbnRyeTtcbiAgICBmb3IgKGNvbnN0IG9wIG9mIG9wZXJhdG9ycykge1xuICAgICAgY3VycmVudCA9IG9wKGN1cnJlbnQpO1xuXG4gICAgICBpZiAoY3VycmVudCA9PT0gbnVsbCkge1xuICAgICAgICAvLyBEZWxldGVkLCBqdXN0IHJldHVybi5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1cnJlbnQ7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVRvU3VidHJlZShwYXRoOiBzdHJpbmcsIHJ1bGVzOiBSdWxlW10pOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlLCBjb250ZXh0KSA9PiB7XG4gICAgY29uc3Qgc2NvcGVkID0gbmV3IFNjb3BlZFRyZWUodHJlZSwgcGF0aCk7XG5cbiAgICByZXR1cm4gY2FsbFJ1bGUoY2hhaW4ocnVsZXMpLCBzY29wZWQsIGNvbnRleHQpLnBpcGUoXG4gICAgICBtYXAoKHJlc3VsdCkgPT4ge1xuICAgICAgICBpZiAocmVzdWx0ID09PSBzY29wZWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJlZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAgICdPcmlnaW5hbCB0cmVlIG11c3QgYmUgcmV0dXJuZWQgZnJvbSBhbGwgcnVsZXMgd2hlbiB1c2luZyBcImFwcGx5VG9TdWJ0cmVlXCIuJyxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICApO1xuICB9O1xufVxuIl19