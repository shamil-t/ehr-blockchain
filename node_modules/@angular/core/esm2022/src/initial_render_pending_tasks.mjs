/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BehaviorSubject } from 'rxjs';
import { Injectable } from './di';
import * as i0 from "./r3_symbols";
/**
 * *Internal* service that keeps track of pending tasks happening in the system
 * during the initial rendering. No tasks are tracked after an initial
 * rendering.
 *
 * This information is needed to make sure that the serialization on the server
 * is delayed until all tasks in the queue (such as an initial navigation or a
 * pending HTTP request) are completed.
 */
export class InitialRenderPendingTasks {
    constructor() {
        this.taskId = 0;
        this.pendingTasks = new Set();
        this.hasPendingTasks = new BehaviorSubject(false);
    }
    add() {
        this.hasPendingTasks.next(true);
        const taskId = this.taskId++;
        this.pendingTasks.add(taskId);
        return taskId;
    }
    remove(taskId) {
        this.pendingTasks.delete(taskId);
        if (this.pendingTasks.size === 0) {
            this.hasPendingTasks.next(false);
        }
    }
    ngOnDestroy() {
        this.pendingTasks.clear();
        this.hasPendingTasks.next(false);
    }
    static { this.ɵfac = function InitialRenderPendingTasks_Factory(t) { return new (t || InitialRenderPendingTasks)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: InitialRenderPendingTasks, factory: InitialRenderPendingTasks.ɵfac, providedIn: 'root' }); }
}
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(InitialRenderPendingTasks, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdGlhbF9yZW5kZXJfcGVuZGluZ190YXNrcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2luaXRpYWxfcmVuZGVyX3BlbmRpbmdfdGFza3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUVyQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sTUFBTSxDQUFDOztBQUdoQzs7Ozs7Ozs7R0FRRztBQUVILE1BQU0sT0FBTyx5QkFBeUI7SUFEdEM7UUFFVSxXQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsaUJBQVksR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBQ3pDLG9CQUFlLEdBQUcsSUFBSSxlQUFlLENBQVUsS0FBSyxDQUFDLENBQUM7S0FvQnZEO0lBbEJDLEdBQUc7UUFDRCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUIsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFjO1FBQ25CLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ2hDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2xDO0lBQ0gsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25DLENBQUM7MEZBdEJVLHlCQUF5Qjt1RUFBekIseUJBQXlCLFdBQXpCLHlCQUF5QixtQkFEYixNQUFNOztzRkFDbEIseUJBQXlCO2NBRHJDLFVBQVU7ZUFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCZWhhdmlvclN1YmplY3R9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtPbkRlc3Ryb3l9IGZyb20gJy4vaW50ZXJmYWNlL2xpZmVjeWNsZV9ob29rcyc7XG5cbi8qKlxuICogKkludGVybmFsKiBzZXJ2aWNlIHRoYXQga2VlcHMgdHJhY2sgb2YgcGVuZGluZyB0YXNrcyBoYXBwZW5pbmcgaW4gdGhlIHN5c3RlbVxuICogZHVyaW5nIHRoZSBpbml0aWFsIHJlbmRlcmluZy4gTm8gdGFza3MgYXJlIHRyYWNrZWQgYWZ0ZXIgYW4gaW5pdGlhbFxuICogcmVuZGVyaW5nLlxuICpcbiAqIFRoaXMgaW5mb3JtYXRpb24gaXMgbmVlZGVkIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBzZXJpYWxpemF0aW9uIG9uIHRoZSBzZXJ2ZXJcbiAqIGlzIGRlbGF5ZWQgdW50aWwgYWxsIHRhc2tzIGluIHRoZSBxdWV1ZSAoc3VjaCBhcyBhbiBpbml0aWFsIG5hdmlnYXRpb24gb3IgYVxuICogcGVuZGluZyBIVFRQIHJlcXVlc3QpIGFyZSBjb21wbGV0ZWQuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEluaXRpYWxSZW5kZXJQZW5kaW5nVGFza3MgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIHRhc2tJZCA9IDA7XG4gIHByaXZhdGUgcGVuZGluZ1Rhc2tzID0gbmV3IFNldDxudW1iZXI+KCk7XG4gIGhhc1BlbmRpbmdUYXNrcyA9IG5ldyBCZWhhdmlvclN1YmplY3Q8Ym9vbGVhbj4oZmFsc2UpO1xuXG4gIGFkZCgpOiBudW1iZXIge1xuICAgIHRoaXMuaGFzUGVuZGluZ1Rhc2tzLm5leHQodHJ1ZSk7XG4gICAgY29uc3QgdGFza0lkID0gdGhpcy50YXNrSWQrKztcbiAgICB0aGlzLnBlbmRpbmdUYXNrcy5hZGQodGFza0lkKTtcbiAgICByZXR1cm4gdGFza0lkO1xuICB9XG5cbiAgcmVtb3ZlKHRhc2tJZDogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5wZW5kaW5nVGFza3MuZGVsZXRlKHRhc2tJZCk7XG4gICAgaWYgKHRoaXMucGVuZGluZ1Rhc2tzLnNpemUgPT09IDApIHtcbiAgICAgIHRoaXMuaGFzUGVuZGluZ1Rhc2tzLm5leHQoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMucGVuZGluZ1Rhc2tzLmNsZWFyKCk7XG4gICAgdGhpcy5oYXNQZW5kaW5nVGFza3MubmV4dChmYWxzZSk7XG4gIH1cbn1cbiJdfQ==