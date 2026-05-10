/**
 * abstract base class for a coverage tree.
 * @constructor
 */
export class BaseTree {
    constructor(root: any);
    root: any;
    /**
     * returns the root node of the tree
     */
    getRoot(): any;
    /**
     * visits the tree depth-first with the supplied partial visitor
     * @param visitor - a potentially partial visitor
     * @param state - the state to be passed around during tree traversal
     */
    visit(visitor: any, state: any): void;
}
export class BaseNode {
    isRoot(): boolean;
    /**
     * visit all nodes depth-first from this node down. Note that `onStart`
     * and `onEnd` are never called on the visitor even if the current
     * node is the root of the tree.
     * @param visitor a full visitor that is called during tree traversal
     * @param state optional state that is passed around
     */
    visit(visitor: any, state: any): void;
}
/**
 * An object with methods that are called during the traversal of the coverage tree.
 * A visitor has the following methods that are called during tree traversal.
 *
 *   * `onStart(root, state)` - called before traversal begins
 *   * `onSummary(node, state)` - called for every summary node
 *   * `onDetail(node, state)` - called for every detail node
 *   * `onSummaryEnd(node, state)` - called after all children have been visited for
 *      a summary node.
 *   * `onEnd(root, state)` - called after traversal ends
 *
 * @param delegate - a partial visitor that only implements the methods of interest
 *  The visitor object supplies the missing methods as noops. For example, reports
 *  that only need the final coverage summary need implement `onStart` and nothing
 *  else. Reports that use only detailed coverage information need implement `onDetail`
 *  and nothing else.
 * @constructor
 */
export class Visitor {
    constructor(delegate: any);
    delegate: any;
}
export class CompositeVisitor extends Visitor {
    visitors: any;
}
//# sourceMappingURL=tree.d.cts.map