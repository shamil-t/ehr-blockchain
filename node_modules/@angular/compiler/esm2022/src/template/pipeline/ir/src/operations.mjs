/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OpKind } from './enums';
/**
 * A linked list of `Op` nodes of a given subtype.
 *
 * @param OpT specific subtype of `Op` nodes which this list contains.
 */
export class OpList {
    static { this.nextListId = 0; }
    constructor() {
        /**
         * Debug ID of this `OpList` instance.
         */
        this.debugListId = OpList.nextListId++;
        // OpList uses static head/tail nodes of a special `ListEnd` type.
        // This avoids the need for special casing of the first and last list
        // elements in all list operations.
        this.head = {
            kind: OpKind.ListEnd,
            next: null,
            prev: null,
            debugListId: this.debugListId,
        };
        this.tail = {
            kind: OpKind.ListEnd,
            next: null,
            prev: null,
            debugListId: this.debugListId,
        };
        // Link `head` and `tail` together at the start (list is empty).
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }
    /**
     * Push a new operation to the tail of the list.
     */
    push(op) {
        OpList.assertIsNotEnd(op);
        OpList.assertIsUnowned(op);
        op.debugListId = this.debugListId;
        // The old "previous" node (which might be the head, if the list is empty).
        const oldLast = this.tail.prev;
        // Insert `op` following the old last node.
        op.prev = oldLast;
        oldLast.next = op;
        // Connect `op` with the list tail.
        op.next = this.tail;
        this.tail.prev = op;
    }
    /**
     * Prepend one or more nodes to the start of the list.
     */
    prepend(ops) {
        if (ops.length === 0) {
            return;
        }
        for (const op of ops) {
            OpList.assertIsNotEnd(op);
            OpList.assertIsUnowned(op);
            op.debugListId = this.debugListId;
        }
        const first = this.head.next;
        let prev = this.head;
        for (const op of ops) {
            prev.next = op;
            op.prev = prev;
            prev = op;
        }
        prev.next = first;
        first.prev = prev;
    }
    /**
     * `OpList` is iterable via the iteration protocol.
     *
     * It's safe to mutate the part of the list that has already been returned by the iterator, up to
     * and including the last operation returned. Mutations beyond that point _may_ be safe, but may
     * also corrupt the iteration position and should be avoided.
     */
    *[Symbol.iterator]() {
        let current = this.head.next;
        while (current !== this.tail) {
            // Guards against corruption of the iterator state by mutations to the tail of the list during
            // iteration.
            OpList.assertIsOwned(current, this.debugListId);
            const next = current.next;
            yield current;
            current = next;
        }
    }
    *reversed() {
        let current = this.tail.prev;
        while (current !== this.head) {
            OpList.assertIsOwned(current, this.debugListId);
            const prev = current.prev;
            yield current;
            current = prev;
        }
    }
    /**
     * Replace `oldOp` with `newOp` in the list.
     */
    static replace(oldOp, newOp) {
        OpList.assertIsNotEnd(oldOp);
        OpList.assertIsNotEnd(newOp);
        OpList.assertIsOwned(oldOp);
        OpList.assertIsUnowned(newOp);
        newOp.debugListId = oldOp.debugListId;
        if (oldOp.prev !== null) {
            oldOp.prev.next = newOp;
            newOp.prev = oldOp.prev;
        }
        if (oldOp.next !== null) {
            oldOp.next.prev = newOp;
            newOp.next = oldOp.next;
        }
        oldOp.debugListId = null;
        oldOp.prev = null;
        oldOp.next = null;
    }
    /**
     * Replace `oldOp` with some number of new operations in the list (which may include `oldOp`).
     */
    static replaceWithMany(oldOp, newOps) {
        if (newOps.length === 0) {
            // Replacing with an empty list -> pure removal.
            OpList.remove(oldOp);
            return;
        }
        OpList.assertIsNotEnd(oldOp);
        OpList.assertIsOwned(oldOp);
        const listId = oldOp.debugListId;
        oldOp.debugListId = null;
        for (const newOp of newOps) {
            OpList.assertIsNotEnd(newOp);
            // `newOp` might be `oldOp`, but at this point it's been marked as unowned.
            OpList.assertIsUnowned(newOp);
        }
        // It should be safe to reuse `oldOp` in the `newOps` list - maybe you want to sandwich an
        // operation between two new ops.
        const { prev: oldPrev, next: oldNext } = oldOp;
        oldOp.prev = null;
        oldOp.next = null;
        let prev = oldPrev;
        for (const newOp of newOps) {
            this.assertIsUnowned(newOp);
            newOp.debugListId = listId;
            prev.next = newOp;
            newOp.prev = prev;
            // This _should_ be the case, but set it just in case.
            newOp.next = null;
            prev = newOp;
        }
        // At the end of iteration, `prev` holds the last node in the list.
        const first = newOps[0];
        const last = prev;
        // Replace `oldOp` with the chain `first` -> `last`.
        if (oldPrev !== null) {
            oldPrev.next = first;
            first.prev = oldOp.prev;
        }
        if (oldNext !== null) {
            oldNext.prev = last;
            last.next = oldNext;
        }
    }
    /**
     * Remove the given node from the list which contains it.
     */
    static remove(op) {
        OpList.assertIsNotEnd(op);
        OpList.assertIsOwned(op);
        op.prev.next = op.next;
        op.next.prev = op.prev;
        // Break any link between the node and this list to safeguard against its usage in future
        // operations.
        op.debugListId = null;
        op.prev = null;
        op.next = null;
    }
    /**
     * Insert `op` before `target`.
     */
    static insertBefore(op, target) {
        OpList.assertIsOwned(target);
        if (target.prev === null) {
            throw new Error(`AssertionError: illegal operation on list start`);
        }
        OpList.assertIsNotEnd(op);
        OpList.assertIsUnowned(op);
        op.debugListId = target.debugListId;
        // Just in case.
        op.prev = null;
        target.prev.next = op;
        op.prev = target.prev;
        op.next = target;
        target.prev = op;
    }
    /**
     * Insert `op` after `target`.
     */
    static insertAfter(op, target) {
        OpList.assertIsOwned(target);
        if (target.next === null) {
            throw new Error(`AssertionError: illegal operation on list end`);
        }
        OpList.assertIsNotEnd(op);
        OpList.assertIsUnowned(op);
        op.debugListId = target.debugListId;
        target.next.prev = op;
        op.next = target.next;
        op.prev = target;
        target.next = op;
    }
    /**
     * Asserts that `op` does not currently belong to a list.
     */
    static assertIsUnowned(op) {
        if (op.debugListId !== null) {
            throw new Error(`AssertionError: illegal operation on owned node: ${OpKind[op.kind]}`);
        }
    }
    /**
     * Asserts that `op` currently belongs to a list. If `byList` is passed, `op` is asserted to
     * specifically belong to that list.
     */
    static assertIsOwned(op, byList) {
        if (op.debugListId === null) {
            throw new Error(`AssertionError: illegal operation on unowned node: ${OpKind[op.kind]}`);
        }
        else if (byList !== undefined && op.debugListId !== byList) {
            throw new Error(`AssertionError: node belongs to the wrong list (expected ${byList}, actual ${op.debugListId})`);
        }
    }
    /**
     * Asserts that `op` is not a special `ListEnd` node.
     */
    static assertIsNotEnd(op) {
        if (op.kind === OpKind.ListEnd) {
            throw new Error(`AssertionError: illegal operation on list head or tail`);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlcmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy90ZW1wbGF0ZS9waXBlbGluZS9pci9zcmMvb3BlcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBeUMvQjs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLE1BQU07YUFDVixlQUFVLEdBQUcsQ0FBQyxBQUFKLENBQUs7SUF5QnRCO1FBdkJBOztXQUVHO1FBQ00sZ0JBQVcsR0FBRyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7UUFFM0Msa0VBQWtFO1FBQ2xFLHFFQUFxRTtRQUNyRSxtQ0FBbUM7UUFDMUIsU0FBSSxHQUFRO1lBQ25CLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTztZQUNwQixJQUFJLEVBQUUsSUFBSTtZQUNWLElBQUksRUFBRSxJQUFJO1lBQ1YsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1NBQ3ZCLENBQUM7UUFFQSxTQUFJLEdBQUc7WUFDZCxJQUFJLEVBQUUsTUFBTSxDQUFDLE9BQU87WUFDcEIsSUFBSSxFQUFFLElBQUk7WUFDVixJQUFJLEVBQUUsSUFBSTtZQUNWLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztTQUN2QixDQUFDO1FBSVAsZ0VBQWdFO1FBQ2hFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLENBQUMsRUFBTztRQUNWLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FB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LElBQUksS0FBSyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7U0FDM0U7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7T3BLaW5kfSBmcm9tICcuL2VudW1zJztcblxuLyoqXG4gKiBCcmFuZGVkIHR5cGUgZm9yIGEgY3Jvc3MtcmVmZXJlbmNlIElELiBEdXJpbmcgaW5nZXN0LCBgWHJlZklkYHMgYXJlIGdlbmVyYXRlZCB0byBsaW5rIHRvZ2V0aGVyXG4gKiBkaWZmZXJlbnQgSVIgb3BlcmF0aW9ucyB3aGljaCBuZWVkIHRvIHJlZmVyZW5jZSBlYWNoIG90aGVyLlxuICovXG5leHBvcnQgdHlwZSBYcmVmSWQgPSBudW1iZXIme19fYnJhbmQ6ICdYcmVmSWQnfTtcblxuLyoqXG4gKiBCYXNlIGludGVyZmFjZSBmb3Igc2VtYW50aWMgb3BlcmF0aW9ucyBiZWluZyBwZXJmb3JtZWQgd2l0aGluIGEgdGVtcGxhdGUuXG4gKlxuICogQHBhcmFtIE9wVCBhIHNwZWNpZmljIG5hcnJvd2VyIHR5cGUgb2YgYE9wYCAoZm9yIGV4YW1wbGUsIGNyZWF0aW9uIG9wZXJhdGlvbnMpIHdoaWNoIHRoaXNcbiAqICAgICBzcGVjaWZpYyBzdWJ0eXBlIG9mIGBPcGAgY2FuIGJlIGxpbmtlZCB3aXRoIGluIGEgbGlua2VkIGxpc3QuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3A8T3BUIGV4dGVuZHMgT3A8T3BUPj4ge1xuICAvKipcbiAgICogQWxsIG9wZXJhdGlvbnMgaGF2ZSBhIGRpc3RpbmN0IGtpbmQuXG4gICAqL1xuICBraW5kOiBPcEtpbmQ7XG5cbiAgLyoqXG4gICAqIFRoZSBwcmV2aW91cyBvcGVyYXRpb24gaW4gdGhlIGxpbmtlZCBsaXN0LCBpZiBhbnkuXG4gICAqXG4gICAqIFRoaXMgaXMgYG51bGxgIGZvciBvcGVyYXRpb24gbm9kZXMgbm90IGN1cnJlbnRseSBpbiBhIGxpc3QsIG9yIGZvciB0aGUgc3BlY2lhbCBoZWFkL3RhaWwgbm9kZXMuXG4gICAqL1xuICBwcmV2OiBPcFR8bnVsbDtcblxuICAvKipcbiAgICogVGhlIG5leHQgb3BlcmF0aW9uIGluIHRoZSBsaW5rZWQgbGlzdCwgaWYgYW55LlxuICAgKlxuICAgKiBUaGlzIGlzIGBudWxsYCBmb3Igb3BlcmF0aW9uIG5vZGVzIG5vdCBjdXJyZW50bHkgaW4gYSBsaXN0LCBvciBmb3IgdGhlIHNwZWNpYWwgaGVhZC90YWlsIG5vZGVzLlxuICAgKi9cbiAgbmV4dDogT3BUfG51bGw7XG5cbiAgLyoqXG4gICAqIERlYnVnIGlkIG9mIHRoZSBsaXN0IHRvIHdoaWNoIHRoaXMgbm9kZSBjdXJyZW50bHkgYmVsb25ncywgb3IgYG51bGxgIGlmIHRoaXMgbm9kZSBpcyBub3QgcGFydFxuICAgKiBvZiBhIGxpc3QuXG4gICAqL1xuICBkZWJ1Z0xpc3RJZDogbnVtYmVyfG51bGw7XG59XG5cbi8qKlxuICogQSBsaW5rZWQgbGlzdCBvZiBgT3BgIG5vZGVzIG9mIGEgZ2l2ZW4gc3VidHlwZS5cbiAqXG4gKiBAcGFyYW0gT3BUIHNwZWNpZmljIHN1YnR5cGUgb2YgYE9wYCBub2RlcyB3aGljaCB0aGlzIGxpc3QgY29udGFpbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBPcExpc3Q8T3BUIGV4dGVuZHMgT3A8T3BUPj4ge1xuICBzdGF0aWMgbmV4dExpc3RJZCA9IDA7XG5cbiAgLyoqXG4gICAqIERlYnVnIElEIG9mIHRoaXMgYE9wTGlzdGAgaW5zdGFuY2UuXG4gICAqL1xuICByZWFkb25seSBkZWJ1Z0xpc3RJZCA9IE9wTGlzdC5uZXh0TGlzdElkKys7XG5cbiAgLy8gT3BMaXN0IHVzZXMgc3RhdGljIGhlYWQvdGFpbCBub2RlcyBvZiBhIHNwZWNpYWwgYExpc3RFbmRgIHR5cGUuXG4gIC8vIFRoaXMgYXZvaWRzIHRoZSBuZWVkIGZvciBzcGVjaWFsIGNhc2luZyBvZiB0aGUgZmlyc3QgYW5kIGxhc3QgbGlzdFxuICAvLyBlbGVtZW50cyBpbiBhbGwgbGlzdCBvcGVyYXRpb25zLlxuICByZWFkb25seSBoZWFkOiBPcFQgPSB7XG4gICAga2luZDogT3BLaW5kLkxpc3RFbmQsXG4gICAgbmV4dDogbnVsbCxcbiAgICBwcmV2OiBudWxsLFxuICAgIGRlYnVnTGlzdElkOiB0aGlzLmRlYnVnTGlzdElkLFxuICB9IGFzIE9wVDtcblxuICByZWFkb25seSB0YWlsID0ge1xuICAgIGtpbmQ6IE9wS2luZC5MaXN0RW5kLFxuICAgIG5leHQ6IG51bGwsXG4gICAgcHJldjogbnVsbCxcbiAgICBkZWJ1Z0xpc3RJZDogdGhpcy5kZWJ1Z0xpc3RJZCxcbiAgfSBhcyBPcFQ7XG5cblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBMaW5rIGBoZWFkYCBhbmQgYHRhaWxgIHRvZ2V0aGVyIGF0IHRoZSBzdGFydCAobGlzdCBpcyBlbXB0eSkuXG4gICAgdGhpcy5oZWFkLm5leHQgPSB0aGlzLnRhaWw7XG4gICAgdGhpcy50YWlsLnByZXYgPSB0aGlzLmhlYWQ7XG4gIH1cblxuICAvKipcbiAgICogUHVzaCBhIG5ldyBvcGVyYXRpb24gdG8gdGhlIHRhaWwgb2YgdGhlIGxpc3QuXG4gICAqL1xuICBwdXNoKG9wOiBPcFQpOiB2b2lkIHtcbiAgICBPcExpc3QuYXNzZXJ0SXNOb3RFbmQob3ApO1xuICAgIE9wTGlzdC5hc3NlcnRJc1Vub3duZWQob3ApO1xuXG4gICAgb3AuZGVidWdMaXN0SWQgPSB0aGlzLmRlYnVnTGlzdElkO1xuXG4gICAgLy8gVGhlIG9sZCBcInByZXZpb3VzXCIgbm9kZSAod2hpY2ggbWlnaHQgYmUgdGhlIGhlYWQsIGlmIHRoZSBsaXN0IGlzIGVtcHR5KS5cbiAgICBjb25zdCBvbGRMYXN0ID0gdGhpcy50YWlsLnByZXYhO1xuXG4gICAgLy8gSW5zZXJ0IGBvcGAgZm9sbG93aW5nIHRoZSBvbGQgbGFzdCBub2RlLlxuICAgIG9wLnByZXYgPSBvbGRMYXN0O1xuICAgIG9sZExhc3QubmV4dCA9IG9wO1xuXG4gICAgLy8gQ29ubmVjdCBgb3BgIHdpdGggdGhlIGxpc3QgdGFpbC5cbiAgICBvcC5uZXh0ID0gdGhpcy50YWlsO1xuICAgIHRoaXMudGFpbC5wcmV2ID0gb3A7XG4gIH1cblxuICAvKipcbiAgICogUHJlcGVuZCBvbmUgb3IgbW9yZSBub2RlcyB0byB0aGUgc3RhcnQgb2YgdGhlIGxpc3QuXG4gICAqL1xuICBwcmVwZW5kKG9wczogT3BUW10pOiB2b2lkIHtcbiAgICBpZiAob3BzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgb3Agb2Ygb3BzKSB7XG4gICAgICBPcExpc3QuYXNzZXJ0SXNOb3RFbmQob3ApO1xuICAgICAgT3BMaXN0LmFzc2VydElzVW5vd25lZChvcCk7XG5cbiAgICAgIG9wLmRlYnVnTGlzdElkID0gdGhpcy5kZWJ1Z0xpc3RJZDtcbiAgICB9XG5cbiAgICBjb25zdCBmaXJzdCA9IHRoaXMuaGVhZC5uZXh0ITtcblxuICAgIGxldCBwcmV2ID0gdGhpcy5oZWFkO1xuICAgIGZvciAoY29uc3Qgb3Agb2Ygb3BzKSB7XG4gICAgICBwcmV2Lm5leHQgPSBvcDtcbiAgICAgIG9wLnByZXYgPSBwcmV2O1xuXG4gICAgICBwcmV2ID0gb3A7XG4gICAgfVxuXG4gICAgcHJldi5uZXh0ID0gZmlyc3Q7XG4gICAgZmlyc3QucHJldiA9IHByZXY7XG4gIH1cblxuICAvKipcbiAgICogYE9wTGlzdGAgaXMgaXRlcmFibGUgdmlhIHRoZSBpdGVyYXRpb24gcHJvdG9jb2wuXG4gICAqXG4gICAqIEl0J3Mgc2FmZSB0byBtdXRhdGUgdGhlIHBhcnQgb2YgdGhlIGxpc3QgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIHJldHVybmVkIGJ5IHRoZSBpdGVyYXRvciwgdXAgdG9cbiAgICogYW5kIGluY2x1ZGluZyB0aGUgbGFzdCBvcGVyYXRpb24gcmV0dXJuZWQuIE11dGF0aW9ucyBiZXlvbmQgdGhhdCBwb2ludCBfbWF5XyBiZSBzYWZlLCBidXQgbWF5XG4gICAqIGFsc28gY29ycnVwdCB0aGUgaXRlcmF0aW9uIHBvc2l0aW9uIGFuZCBzaG91bGQgYmUgYXZvaWRlZC5cbiAgICovXG4gICogW1N5bWJvbC5pdGVyYXRvcl0oKTogR2VuZXJhdG9yPE9wVD4ge1xuICAgIGxldCBjdXJyZW50ID0gdGhpcy5oZWFkLm5leHQhO1xuICAgIHdoaWxlIChjdXJyZW50ICE9PSB0aGlzLnRhaWwpIHtcbiAgICAgIC8vIEd1YXJkcyBhZ2FpbnN0IGNvcnJ1cHRpb24gb2YgdGhlIGl0ZXJhdG9yIHN0YXRlIGJ5IG11dGF0aW9ucyB0byB0aGUgdGFpbCBvZiB0aGUgbGlzdCBkdXJpbmdcbiAgICAgIC8vIGl0ZXJhdGlvbi5cbiAgICAgIE9wTGlzdC5hc3NlcnRJc093bmVkKGN1cnJlbnQsIHRoaXMuZGVidWdMaXN0SWQpO1xuXG4gICAgICBjb25zdCBuZXh0ID0gY3VycmVudC5uZXh0ITtcbiAgICAgIHlpZWxkIGN1cnJlbnQ7XG4gICAgICBjdXJyZW50ID0gbmV4dDtcbiAgICB9XG4gIH1cblxuICAqIHJldmVyc2VkKCk6IEdlbmVyYXRvcjxPcFQ+IHtcbiAgICBsZXQgY3VycmVudCA9IHRoaXMudGFpbC5wcmV2ITtcbiAgICB3aGlsZSAoY3VycmVudCAhPT0gdGhpcy5oZWFkKSB7XG4gICAgICBPcExpc3QuYXNzZXJ0SXNPd25lZChjdXJyZW50LCB0aGlzLmRlYnVnTGlzdElkKTtcblxuICAgICAgY29uc3QgcHJldiA9IGN1cnJlbnQucHJldiE7XG4gICAgICB5aWVsZCBjdXJyZW50O1xuICAgICAgY3VycmVudCA9IHByZXY7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlcGxhY2UgYG9sZE9wYCB3aXRoIGBuZXdPcGAgaW4gdGhlIGxpc3QuXG4gICAqL1xuICBzdGF0aWMgcmVwbGFjZTxPcFQgZXh0ZW5kcyBPcDxPcFQ+PihvbGRPcDogT3BULCBuZXdPcDogT3BUKTogdm9pZCB7XG4gICAgT3BMaXN0LmFzc2VydElzTm90RW5kKG9sZE9wKTtcbiAgICBPcExpc3QuYXNzZXJ0SXNOb3RFbmQobmV3T3ApO1xuXG4gICAgT3BMaXN0LmFzc2VydElzT3duZWQob2xkT3ApO1xuICAgIE9wTGlzdC5hc3NlcnRJc1Vub3duZWQobmV3T3ApO1xuXG4gICAgbmV3T3AuZGVidWdMaXN0SWQgPSBvbGRPcC5kZWJ1Z0xpc3RJZDtcbiAgICBpZiAob2xkT3AucHJldiAhPT0gbnVsbCkge1xuICAgICAgb2xkT3AucHJldi5uZXh0ID0gbmV3T3A7XG4gICAgICBuZXdPcC5wcmV2ID0gb2xkT3AucHJldjtcbiAgICB9XG4gICAgaWYgKG9sZE9wLm5leHQgIT09IG51bGwpIHtcbiAgICAgIG9sZE9wLm5leHQucHJldiA9IG5ld09wO1xuICAgICAgbmV3T3AubmV4dCA9IG9sZE9wLm5leHQ7XG4gICAgfVxuICAgIG9sZE9wLmRlYnVnTGlzdElkID0gbnVsbDtcbiAgICBvbGRPcC5wcmV2ID0gbnVsbDtcbiAgICBvbGRPcC5uZXh0ID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXBsYWNlIGBvbGRPcGAgd2l0aCBzb21lIG51bWJlciBvZiBuZXcgb3BlcmF0aW9ucyBpbiB0aGUgbGlzdCAod2hpY2ggbWF5IGluY2x1ZGUgYG9sZE9wYCkuXG4gICAqL1xuICBzdGF0aWMgcmVwbGFjZVdpdGhNYW55PE9wVCBleHRlbmRzIE9wPE9wVD4+KG9sZE9wOiBPcFQsIG5ld09wczogT3BUW10pOiB2b2lkIHtcbiAgICBpZiAobmV3T3BzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gUmVwbGFjaW5nIHdpdGggYW4gZW1wdHkgbGlzdCAtPiBwdXJlIHJlbW92YWwuXG4gICAgICBPcExpc3QucmVtb3ZlKG9sZE9wKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBPcExpc3QuYXNzZXJ0SXNOb3RFbmQob2xkT3ApO1xuICAgIE9wTGlzdC5hc3NlcnRJc093bmVkKG9sZE9wKTtcblxuICAgIGNvbnN0IGxpc3RJZCA9IG9sZE9wLmRlYnVnTGlzdElkO1xuICAgIG9sZE9wLmRlYnVnTGlzdElkID0gbnVsbDtcblxuICAgIGZvciAoY29uc3QgbmV3T3Agb2YgbmV3T3BzKSB7XG4gICAgICBPcExpc3QuYXNzZXJ0SXNOb3RFbmQobmV3T3ApO1xuXG4gICAgICAvLyBgbmV3T3BgIG1pZ2h0IGJlIGBvbGRPcGAsIGJ1dCBhdCB0aGlzIHBvaW50IGl0J3MgYmVlbiBtYXJrZWQgYXMgdW5vd25lZC5cbiAgICAgIE9wTGlzdC5hc3NlcnRJc1Vub3duZWQobmV3T3ApO1xuICAgIH1cblxuICAgIC8vIEl0IHNob3VsZCBiZSBzYWZlIHRvIHJldXNlIGBvbGRPcGAgaW4gdGhlIGBuZXdPcHNgIGxpc3QgLSBtYXliZSB5b3Ugd2FudCB0byBzYW5kd2ljaCBhblxuICAgIC8vIG9wZXJhdGlvbiBiZXR3ZWVuIHR3byBuZXcgb3BzLlxuICAgIGNvbnN0IHtwcmV2OiBvbGRQcmV2LCBuZXh0OiBvbGROZXh0fSA9IG9sZE9wO1xuICAgIG9sZE9wLnByZXYgPSBudWxsO1xuICAgIG9sZE9wLm5leHQgPSBudWxsO1xuXG4gICAgbGV0IHByZXY6IE9wVCA9IG9sZFByZXYhO1xuICAgIGZvciAoY29uc3QgbmV3T3Agb2YgbmV3T3BzKSB7XG4gICAgICB0aGlzLmFzc2VydElzVW5vd25lZChuZXdPcCk7XG4gICAgICBuZXdPcC5kZWJ1Z0xpc3RJZCA9IGxpc3RJZDtcblxuICAgICAgcHJldiEubmV4dCA9IG5ld09wO1xuICAgICAgbmV3T3AucHJldiA9IHByZXY7XG5cbiAgICAgIC8vIFRoaXMgX3Nob3VsZF8gYmUgdGhlIGNhc2UsIGJ1dCBzZXQgaXQganVzdCBpbiBjYXNlLlxuICAgICAgbmV3T3AubmV4dCA9IG51bGw7XG5cbiAgICAgIHByZXYgPSBuZXdPcDtcbiAgICB9XG4gICAgLy8gQXQgdGhlIGVuZCBvZiBpdGVyYXRpb24sIGBwcmV2YCBob2xkcyB0aGUgbGFzdCBub2RlIGluIHRoZSBsaXN0LlxuICAgIGNvbnN0IGZpcnN0ID0gbmV3T3BzWzBdITtcbiAgICBjb25zdCBsYXN0ID0gcHJldiE7XG5cbiAgICAvLyBSZXBsYWNlIGBvbGRPcGAgd2l0aCB0aGUgY2hhaW4gYGZpcnN0YCAtPiBgbGFzdGAuXG4gICAgaWYgKG9sZFByZXYgIT09IG51bGwpIHtcbiAgICAgIG9sZFByZXYubmV4dCA9IGZpcnN0O1xuICAgICAgZmlyc3QucHJldiA9IG9sZE9wLnByZXY7XG4gICAgfVxuXG4gICAgaWYgKG9sZE5leHQgIT09IG51bGwpIHtcbiAgICAgIG9sZE5leHQucHJldiA9IGxhc3Q7XG4gICAgICBsYXN0Lm5leHQgPSBvbGROZXh0O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIGdpdmVuIG5vZGUgZnJvbSB0aGUgbGlzdCB3aGljaCBjb250YWlucyBpdC5cbiAgICovXG4gIHN0YXRpYyByZW1vdmU8T3BUIGV4dGVuZHMgT3A8T3BUPj4ob3A6IE9wVCk6IHZvaWQge1xuICAgIE9wTGlzdC5hc3NlcnRJc05vdEVuZChvcCk7XG4gICAgT3BMaXN0LmFzc2VydElzT3duZWQob3ApO1xuXG4gICAgb3AucHJldiEubmV4dCA9IG9wLm5leHQ7XG4gICAgb3AubmV4dCEucHJldiA9IG9wLnByZXY7XG5cbiAgICAvLyBCcmVhayBhbnkgbGluayBiZXR3ZWVuIHRoZSBub2RlIGFuZCB0aGlzIGxpc3QgdG8gc2FmZWd1YXJkIGFnYWluc3QgaXRzIHVzYWdlIGluIGZ1dHVyZVxuICAgIC8vIG9wZXJhdGlvbnMuXG4gICAgb3AuZGVidWdMaXN0SWQgPSBudWxsO1xuICAgIG9wLnByZXYgPSBudWxsO1xuICAgIG9wLm5leHQgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydCBgb3BgIGJlZm9yZSBgdGFyZ2V0YC5cbiAgICovXG4gIHN0YXRpYyBpbnNlcnRCZWZvcmU8T3BUIGV4dGVuZHMgT3A8T3BUPj4ob3A6IE9wVCwgdGFyZ2V0OiBPcFQpOiB2b2lkIHtcbiAgICBPcExpc3QuYXNzZXJ0SXNPd25lZCh0YXJnZXQpO1xuICAgIGlmICh0YXJnZXQucHJldiA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3NlcnRpb25FcnJvcjogaWxsZWdhbCBvcGVyYXRpb24gb24gbGlzdCBzdGFydGApO1xuICAgIH1cblxuICAgIE9wTGlzdC5hc3NlcnRJc05vdEVuZChvcCk7XG5cbiAgICBPcExpc3QuYXNzZXJ0SXNVbm93bmVkKG9wKTtcblxuICAgIG9wLmRlYnVnTGlzdElkID0gdGFyZ2V0LmRlYnVnTGlzdElkO1xuXG4gICAgLy8gSnVzdCBpbiBjYXNlLlxuICAgIG9wLnByZXYgPSBudWxsO1xuXG4gICAgdGFyZ2V0LnByZXYhLm5leHQgPSBvcDtcbiAgICBvcC5wcmV2ID0gdGFyZ2V0LnByZXY7XG5cbiAgICBvcC5uZXh0ID0gdGFyZ2V0O1xuICAgIHRhcmdldC5wcmV2ID0gb3A7XG4gIH1cblxuICAvKipcbiAgICogSW5zZXJ0IGBvcGAgYWZ0ZXIgYHRhcmdldGAuXG4gICAqL1xuICBzdGF0aWMgaW5zZXJ0QWZ0ZXI8T3BUIGV4dGVuZHMgT3A8T3BUPj4ob3A6IE9wVCwgdGFyZ2V0OiBPcFQpOiB2b2lkIHtcbiAgICBPcExpc3QuYXNzZXJ0SXNPd25lZCh0YXJnZXQpO1xuICAgIGlmICh0YXJnZXQubmV4dCA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3NlcnRpb25FcnJvcjogaWxsZWdhbCBvcGVyYXRpb24gb24gbGlzdCBlbmRgKTtcbiAgICB9XG5cbiAgICBPcExpc3QuYXNzZXJ0SXNOb3RFbmQob3ApO1xuXG4gICAgT3BMaXN0LmFzc2VydElzVW5vd25lZChvcCk7XG5cbiAgICBvcC5kZWJ1Z0xpc3RJZCA9IHRhcmdldC5kZWJ1Z0xpc3RJZDtcblxuICAgIHRhcmdldC5uZXh0LnByZXYgPSBvcDtcbiAgICBvcC5uZXh0ID0gdGFyZ2V0Lm5leHQ7XG5cbiAgICBvcC5wcmV2ID0gdGFyZ2V0O1xuICAgIHRhcmdldC5uZXh0ID0gb3A7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IGBvcGAgZG9lcyBub3QgY3VycmVudGx5IGJlbG9uZyB0byBhIGxpc3QuXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0SXNVbm93bmVkPE9wVCBleHRlbmRzIE9wPE9wVD4+KG9wOiBPcFQpOiB2b2lkIHtcbiAgICBpZiAob3AuZGVidWdMaXN0SWQgIT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXJ0aW9uRXJyb3I6IGlsbGVnYWwgb3BlcmF0aW9uIG9uIG93bmVkIG5vZGU6ICR7T3BLaW5kW29wLmtpbmRdfWApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgYG9wYCBjdXJyZW50bHkgYmVsb25ncyB0byBhIGxpc3QuIElmIGBieUxpc3RgIGlzIHBhc3NlZCwgYG9wYCBpcyBhc3NlcnRlZCB0b1xuICAgKiBzcGVjaWZpY2FsbHkgYmVsb25nIHRvIHRoYXQgbGlzdC5cbiAgICovXG4gIHN0YXRpYyBhc3NlcnRJc093bmVkPE9wVCBleHRlbmRzIE9wPE9wVD4+KG9wOiBPcFQsIGJ5TGlzdD86IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChvcC5kZWJ1Z0xpc3RJZCA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3NlcnRpb25FcnJvcjogaWxsZWdhbCBvcGVyYXRpb24gb24gdW5vd25lZCBub2RlOiAke09wS2luZFtvcC5raW5kXX1gKTtcbiAgICB9IGVsc2UgaWYgKGJ5TGlzdCAhPT0gdW5kZWZpbmVkICYmIG9wLmRlYnVnTGlzdElkICE9PSBieUxpc3QpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXJ0aW9uRXJyb3I6IG5vZGUgYmVsb25ncyB0byB0aGUgd3JvbmcgbGlzdCAoZXhwZWN0ZWQgJHtieUxpc3R9LCBhY3R1YWwgJHtcbiAgICAgICAgICBvcC5kZWJ1Z0xpc3RJZH0pYCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCBgb3BgIGlzIG5vdCBhIHNwZWNpYWwgYExpc3RFbmRgIG5vZGUuXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0SXNOb3RFbmQ8T3BUIGV4dGVuZHMgT3A8T3BUPj4ob3A6IE9wVCk6IHZvaWQge1xuICAgIGlmIChvcC5raW5kID09PSBPcEtpbmQuTGlzdEVuZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3NlcnRpb25FcnJvcjogaWxsZWdhbCBvcGVyYXRpb24gb24gbGlzdCBoZWFkIG9yIHRhaWxgKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==