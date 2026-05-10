"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.partition = exports.merge = exports.branch = exports.empty = void 0;
const exception_1 = require("../exception/exception");
const host_tree_1 = require("./host-tree");
const interface_1 = require("./interface");
function empty() {
    return new host_tree_1.HostTree();
}
exports.empty = empty;
function branch(tree) {
    return tree.branch();
}
exports.branch = branch;
function merge(tree, other, strategy = interface_1.MergeStrategy.Default) {
    tree.merge(other, strategy);
    return tree;
}
exports.merge = merge;
function partition(tree, predicate) {
    if (tree instanceof host_tree_1.HostTree) {
        return [
            new host_tree_1.FilterHostTree(tree, predicate),
            new host_tree_1.FilterHostTree(tree, (path, entry) => !predicate(path, entry)),
        ];
    }
    else {
        throw new exception_1.SchematicsException('Tree type is not supported.');
    }
}
exports.partition = partition;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvdHJlZS9zdGF0aWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsc0RBQTZEO0FBQzdELDJDQUF1RDtBQUN2RCwyQ0FBaUU7QUFFakUsU0FBZ0IsS0FBSztJQUNuQixPQUFPLElBQUksb0JBQVEsRUFBRSxDQUFDO0FBQ3hCLENBQUM7QUFGRCxzQkFFQztBQUVELFNBQWdCLE1BQU0sQ0FBQyxJQUFVO0lBQy9CLE9BQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3ZCLENBQUM7QUFGRCx3QkFFQztBQUVELFNBQWdCLEtBQUssQ0FBQyxJQUFVLEVBQUUsS0FBVyxFQUFFLFdBQTBCLHlCQUFhLENBQUMsT0FBTztJQUM1RixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUU1QixPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFKRCxzQkFJQztBQUVELFNBQWdCLFNBQVMsQ0FBQyxJQUFVLEVBQUUsU0FBaUM7SUFDckUsSUFBSSxJQUFJLFlBQVksb0JBQVEsRUFBRTtRQUM1QixPQUFPO1lBQ0wsSUFBSSwwQkFBYyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUM7WUFDbkMsSUFBSSwwQkFBYyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNuRSxDQUFDO0tBQ0g7U0FBTTtRQUNMLE1BQU0sSUFBSSwrQkFBbUIsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0tBQzlEO0FBQ0gsQ0FBQztBQVRELDhCQVNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFNjaGVtYXRpY3NFeGNlcHRpb24gfSBmcm9tICcuLi9leGNlcHRpb24vZXhjZXB0aW9uJztcbmltcG9ydCB7IEZpbHRlckhvc3RUcmVlLCBIb3N0VHJlZSB9IGZyb20gJy4vaG9zdC10cmVlJztcbmltcG9ydCB7IEZpbGVQcmVkaWNhdGUsIE1lcmdlU3RyYXRlZ3ksIFRyZWUgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBlbXB0eSgpIHtcbiAgcmV0dXJuIG5ldyBIb3N0VHJlZSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnJhbmNoKHRyZWU6IFRyZWUpIHtcbiAgcmV0dXJuIHRyZWUuYnJhbmNoKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZSh0cmVlOiBUcmVlLCBvdGhlcjogVHJlZSwgc3RyYXRlZ3k6IE1lcmdlU3RyYXRlZ3kgPSBNZXJnZVN0cmF0ZWd5LkRlZmF1bHQpIHtcbiAgdHJlZS5tZXJnZShvdGhlciwgc3RyYXRlZ3kpO1xuXG4gIHJldHVybiB0cmVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFydGl0aW9uKHRyZWU6IFRyZWUsIHByZWRpY2F0ZTogRmlsZVByZWRpY2F0ZTxib29sZWFuPik6IFtUcmVlLCBUcmVlXSB7XG4gIGlmICh0cmVlIGluc3RhbmNlb2YgSG9zdFRyZWUpIHtcbiAgICByZXR1cm4gW1xuICAgICAgbmV3IEZpbHRlckhvc3RUcmVlKHRyZWUsIHByZWRpY2F0ZSksXG4gICAgICBuZXcgRmlsdGVySG9zdFRyZWUodHJlZSwgKHBhdGgsIGVudHJ5KSA9PiAhcHJlZGljYXRlKHBhdGgsIGVudHJ5KSksXG4gICAgXTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignVHJlZSB0eXBlIGlzIG5vdCBzdXBwb3J0ZWQuJyk7XG4gIH1cbn1cbiJdfQ==