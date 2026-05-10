"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseWorkflow = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const engine_1 = require("../engine");
const exception_1 = require("../exception/exception");
const formats_1 = require("../formats");
const dryrun_1 = require("../sink/dryrun");
const host_1 = require("../sink/host");
const host_tree_1 = require("../tree/host-tree");
/**
 * Base class for workflows. Even without abstract methods, this class should not be used without
 * surrounding some initialization for the registry and host. This class only adds life cycle and
 * dryrun/force support. You need to provide any registry and task executors that you need to
 * support.
 * See {@see NodeWorkflow} implementation for how to make a specialized subclass of this.
 * TODO: add default set of CoreSchemaRegistry transforms. Once the job refactor is done, use that
 *       as the support for tasks.
 *
 * @public
 */
class BaseWorkflow {
    constructor(options) {
        this._reporter = new rxjs_1.Subject();
        this._lifeCycle = new rxjs_1.Subject();
        this._host = options.host;
        this._engineHost = options.engineHost;
        if (options.registry) {
            this._registry = options.registry;
        }
        else {
            this._registry = new core_1.schema.CoreSchemaRegistry(formats_1.standardFormats);
            this._registry.addPostTransform(core_1.schema.transforms.addUndefinedDefaults);
        }
        this._engine = new engine_1.SchematicEngine(this._engineHost, this);
        this._context = [];
        this._force = options.force || false;
        this._dryRun = options.dryRun || false;
    }
    get context() {
        const maybeContext = this._context[this._context.length - 1];
        if (!maybeContext) {
            throw new Error('Cannot get context when workflow is not executing...');
        }
        return maybeContext;
    }
    get engine() {
        return this._engine;
    }
    get engineHost() {
        return this._engineHost;
    }
    get registry() {
        return this._registry;
    }
    get reporter() {
        return this._reporter.asObservable();
    }
    get lifeCycle() {
        return this._lifeCycle.asObservable();
    }
    _createSinks() {
        let error = false;
        const dryRunSink = new dryrun_1.DryRunSink(this._host, this._force);
        const dryRunSubscriber = dryRunSink.reporter.subscribe((event) => {
            this._reporter.next(event);
            error = error || event.kind == 'error';
        });
        // We need two sinks if we want to output what will happen, and actually do the work.
        return [
            dryRunSink,
            // Add a custom sink that clean ourselves and throws an error if an error happened.
            {
                commit() {
                    dryRunSubscriber.unsubscribe();
                    if (error) {
                        return (0, rxjs_1.throwError)(new exception_1.UnsuccessfulWorkflowExecution());
                    }
                    return (0, rxjs_1.of)();
                },
            },
            // Only add a HostSink if this is not a dryRun.
            ...(!this._dryRun ? [new host_1.HostSink(this._host, this._force)] : []),
        ];
    }
    execute(options) {
        const parentContext = this._context[this._context.length - 1];
        if (!parentContext) {
            this._lifeCycle.next({ kind: 'start' });
        }
        /** Create the collection and the schematic. */
        const collection = this._engine.createCollection(options.collection);
        // Only allow private schematics if called from the same collection.
        const allowPrivate = options.allowPrivate || (parentContext && parentContext.collection === options.collection);
        const schematic = collection.createSchematic(options.schematic, allowPrivate);
        const sinks = this._createSinks();
        this._lifeCycle.next({ kind: 'workflow-start' });
        const context = {
            ...options,
            debug: options.debug || false,
            logger: options.logger || (parentContext && parentContext.logger) || new core_1.logging.NullLogger(),
            parentContext,
        };
        this._context.push(context);
        return schematic
            .call(options.options, (0, rxjs_1.of)(new host_tree_1.HostTree(this._host)), { logger: context.logger })
            .pipe((0, rxjs_1.concatMap)((tree) => {
            // Process all sinks.
            return (0, rxjs_1.concat)((0, rxjs_1.from)(sinks).pipe((0, rxjs_1.concatMap)((sink) => sink.commit(tree)), (0, rxjs_1.ignoreElements)()), (0, rxjs_1.of)(tree));
        }), (0, rxjs_1.concatMap)(() => {
            if (this._dryRun) {
                return rxjs_1.EMPTY;
            }
            this._lifeCycle.next({ kind: 'post-tasks-start' });
            return this._engine
                .executePostTasks()
                .pipe((0, rxjs_1.tap)({ complete: () => this._lifeCycle.next({ kind: 'post-tasks-end' }) }), (0, rxjs_1.defaultIfEmpty)(undefined), (0, rxjs_1.last)());
        }), (0, rxjs_1.tap)({
            complete: () => {
                this._lifeCycle.next({ kind: 'workflow-end' });
                this._context.pop();
                if (this._context.length == 0) {
                    this._lifeCycle.next({ kind: 'end' });
                }
            },
        }));
    }
}
exports.BaseWorkflow = BaseWorkflow;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3dvcmtmbG93L2Jhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBQWtFO0FBQ2xFLCtCQWFjO0FBQ2Qsc0NBQWdFO0FBQ2hFLHNEQUF1RTtBQUN2RSx3Q0FBNkM7QUFDN0MsMkNBQXlEO0FBQ3pELHVDQUF3QztBQUV4QyxpREFBNkM7QUFrQjdDOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFzQixZQUFZO0lBZWhDLFlBQVksT0FBNEI7UUFSOUIsY0FBUyxHQUF5QixJQUFJLGNBQU8sRUFBRSxDQUFDO1FBQ2hELGVBQVUsR0FBNEIsSUFBSSxjQUFPLEVBQUUsQ0FBQztRQVE1RCxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDMUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBRXRDLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRTtZQUNwQixJQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7U0FDbkM7YUFBTTtZQUNMLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxhQUFNLENBQUMsa0JBQWtCLENBQUMseUJBQWUsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsYUFBTSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1NBQ3pFO1FBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLHdCQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUzRCxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUVuQixJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxLQUFLLElBQUksS0FB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O1lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO1lBRW5ELE9BQU8sSUFBSSxDQUFDLE9BQU87aUJBQ2hCLGdCQUFnQixFQUFFO2lCQUNsQixJQUFJLENBQ0gsSUFBQSxVQUFHLEVBQUMsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDekUsSUFBQSxxQkFBYyxFQUFDLFNBQVMsQ0FBQyxFQUN6QixJQUFBLFdBQUksR0FBRSxDQUNQLENBQUM7UUFDTixDQUFDLENBQUMsRUFDRixJQUFBLFVBQUcsRUFBQztZQUNGLFFBQVEsRUFBRSxHQUFHLEVBQUU7Z0JBQ2IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFFcEIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7b0JBQzdCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7aUJBQ3ZDO1lBQ0gsQ0FBQztTQUNGLENBQUMsQ0FDSCxDQUFDO0lBQ04sQ0FBQztDQUNGO0FBM0pELG9DQTJKQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBsb2dnaW5nLCBzY2hlbWEsIHZpcnR1YWxGcyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7XG4gIEVNUFRZLFxuICBPYnNlcnZhYmxlLFxuICBTdWJqZWN0LFxuICBjb25jYXQsXG4gIGNvbmNhdE1hcCxcbiAgZGVmYXVsdElmRW1wdHksXG4gIGZyb20sXG4gIGlnbm9yZUVsZW1lbnRzLFxuICBsYXN0LFxuICBvZixcbiAgdGFwLFxuICB0aHJvd0Vycm9yLFxufSBmcm9tICdyeGpzJztcbmltcG9ydCB7IEVuZ2luZSwgRW5naW5lSG9zdCwgU2NoZW1hdGljRW5naW5lIH0gZnJvbSAnLi4vZW5naW5lJztcbmltcG9ydCB7IFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uIH0gZnJvbSAnLi4vZXhjZXB0aW9uL2V4Y2VwdGlvbic7XG5pbXBvcnQgeyBzdGFuZGFyZEZvcm1hdHMgfSBmcm9tICcuLi9mb3JtYXRzJztcbmltcG9ydCB7IERyeVJ1bkV2ZW50LCBEcnlSdW5TaW5rIH0gZnJvbSAnLi4vc2luay9kcnlydW4nO1xuaW1wb3J0IHsgSG9zdFNpbmsgfSBmcm9tICcuLi9zaW5rL2hvc3QnO1xuaW1wb3J0IHsgU2luayB9IGZyb20gJy4uL3Npbmsvc2luayc7XG5pbXBvcnQgeyBIb3N0VHJlZSB9IGZyb20gJy4uL3RyZWUvaG9zdC10cmVlJztcbmltcG9ydCB7IFRyZWUgfSBmcm9tICcuLi90cmVlL2ludGVyZmFjZSc7XG5pbXBvcnQge1xuICBMaWZlQ3ljbGVFdmVudCxcbiAgUmVxdWlyZWRXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQsXG4gIFdvcmtmbG93LFxuICBXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQsXG59IGZyb20gJy4vaW50ZXJmYWNlJztcblxuZXhwb3J0IGludGVyZmFjZSBCYXNlV29ya2Zsb3dPcHRpb25zIHtcbiAgaG9zdDogdmlydHVhbEZzLkhvc3Q7XG4gIGVuZ2luZUhvc3Q6IEVuZ2luZUhvc3Q8e30sIHt9PjtcbiAgcmVnaXN0cnk/OiBzY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5O1xuXG4gIGZvcmNlPzogYm9vbGVhbjtcbiAgZHJ5UnVuPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciB3b3JrZmxvd3MuIEV2ZW4gd2l0aG91dCBhYnN0cmFjdCBtZXRob2RzLCB0aGlzIGNsYXNzIHNob3VsZCBub3QgYmUgdXNlZCB3aXRob3V0XG4gKiBzdXJyb3VuZGluZyBzb21lIGluaXRpYWxpemF0aW9uIGZvciB0aGUgcmVnaXN0cnkgYW5kIGhvc3QuIFRoaXMgY2xhc3Mgb25seSBhZGRzIGxpZmUgY3ljbGUgYW5kXG4gKiBkcnlydW4vZm9yY2Ugc3VwcG9ydC4gWW91IG5lZWQgdG8gcHJvdmlkZSBhbnkgcmVnaXN0cnkgYW5kIHRhc2sgZXhlY3V0b3JzIHRoYXQgeW91IG5lZWQgdG9cbiAqIHN1cHBvcnQuXG4gKiBTZWUge0BzZWUgTm9kZVdvcmtmbG93fSBpbXBsZW1lbnRhdGlvbiBmb3IgaG93IHRvIG1ha2UgYSBzcGVjaWFsaXplZCBzdWJjbGFzcyBvZiB0aGlzLlxuICogVE9ETzogYWRkIGRlZmF1bHQgc2V0IG9mIENvcmVTY2hlbWFSZWdpc3RyeSB0cmFuc2Zvcm1zLiBPbmNlIHRoZSBqb2IgcmVmYWN0b3IgaXMgZG9uZSwgdXNlIHRoYXRcbiAqICAgICAgIGFzIHRoZSBzdXBwb3J0IGZvciB0YXNrcy5cbiAqXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlV29ya2Zsb3cgaW1wbGVtZW50cyBXb3JrZmxvdyB7XG4gIHByb3RlY3RlZCBfZW5naW5lOiBFbmdpbmU8e30sIHt9PjtcbiAgcHJvdGVjdGVkIF9lbmdpbmVIb3N0OiBFbmdpbmVIb3N0PHt9LCB7fT47XG4gIHByb3RlY3RlZCBfcmVnaXN0cnk6IHNjaGVtYS5Db3JlU2NoZW1hUmVnaXN0cnk7XG5cbiAgcHJvdGVjdGVkIF9ob3N0OiB2aXJ0dWFsRnMuSG9zdDtcblxuICBwcm90ZWN0ZWQgX3JlcG9ydGVyOiBTdWJqZWN0PERyeVJ1bkV2ZW50PiA9IG5ldyBTdWJqZWN0KCk7XG4gIHByb3RlY3RlZCBfbGlmZUN5Y2xlOiBTdWJqZWN0PExpZmVDeWNsZUV2ZW50PiA9IG5ldyBTdWJqZWN0KCk7XG5cbiAgcHJvdGVjdGVkIF9jb250ZXh0OiBXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHRbXTtcblxuICBwcm90ZWN0ZWQgX2ZvcmNlOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgX2RyeVJ1bjogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBCYXNlV29ya2Zsb3dPcHRpb25zKSB7XG4gICAgdGhpcy5faG9zdCA9IG9wdGlvbnMuaG9zdDtcbiAgICB0aGlzLl9lbmdpbmVIb3N0ID0gb3B0aW9ucy5lbmdpbmVIb3N0O1xuXG4gICAgaWYgKG9wdGlvbnMucmVnaXN0cnkpIHtcbiAgICAgIHRoaXMuX3JlZ2lzdHJ5ID0gb3B0aW9ucy5yZWdpc3RyeTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVnaXN0cnkgPSBuZXcgc2NoZW1hLkNvcmVTY2hlbWFSZWdpc3RyeShzdGFuZGFyZEZvcm1hdHMpO1xuICAgICAgdGhpcy5fcmVnaXN0cnkuYWRkUG9zdFRyYW5zZm9ybShzY2hlbWEudHJhbnNmb3Jtcy5hZGRVbmRlZmluZWREZWZhdWx0cyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZW5naW5lID0gbmV3IFNjaGVtYXRpY0VuZ2luZSh0aGlzLl9lbmdpbmVIb3N0LCB0aGlzKTtcblxuICAgIHRoaXMuX2NvbnRleHQgPSBbXTtcblxuICAgIHRoaXMuX2ZvcmNlID0gb3B0aW9ucy5mb3JjZSB8fCBmYWxzZTtcbiAgICB0aGlzLl9kcnlSdW4gPSBvcHRpb25zLmRyeVJ1biB8fCBmYWxzZTtcbiAgfVxuXG4gIGdldCBjb250ZXh0KCk6IFJlYWRvbmx5PFdvcmtmbG93RXhlY3V0aW9uQ29udGV4dD4ge1xuICAgIGNvbnN0IG1heWJlQ29udGV4dCA9IHRoaXMuX2NvbnRleHRbdGhpcy5fY29udGV4dC5sZW5ndGggLSAxXTtcbiAgICBpZiAoIW1heWJlQ29udGV4dCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZ2V0IGNvbnRleHQgd2hlbiB3b3JrZmxvdyBpcyBub3QgZXhlY3V0aW5nLi4uJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1heWJlQ29udGV4dDtcbiAgfVxuICBnZXQgZW5naW5lKCk6IEVuZ2luZTx7fSwge30+IHtcbiAgICByZXR1cm4gdGhpcy5fZW5naW5lO1xuICB9XG4gIGdldCBlbmdpbmVIb3N0KCk6IEVuZ2luZUhvc3Q8e30sIHt9PiB7XG4gICAgcmV0dXJuIHRoaXMuX2VuZ2luZUhvc3Q7XG4gIH1cbiAgZ2V0IHJlZ2lzdHJ5KCk6IHNjaGVtYS5TY2hlbWFSZWdpc3RyeSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlZ2lzdHJ5O1xuICB9XG4gIGdldCByZXBvcnRlcigpOiBPYnNlcnZhYmxlPERyeVJ1bkV2ZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX3JlcG9ydGVyLmFzT2JzZXJ2YWJsZSgpO1xuICB9XG4gIGdldCBsaWZlQ3ljbGUoKTogT2JzZXJ2YWJsZTxMaWZlQ3ljbGVFdmVudD4ge1xuICAgIHJldHVybiB0aGlzLl9saWZlQ3ljbGUuYXNPYnNlcnZhYmxlKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX2NyZWF0ZVNpbmtzKCk6IFNpbmtbXSB7XG4gICAgbGV0IGVycm9yID0gZmFsc2U7XG5cbiAgICBjb25zdCBkcnlSdW5TaW5rID0gbmV3IERyeVJ1blNpbmsodGhpcy5faG9zdCwgdGhpcy5fZm9yY2UpO1xuICAgIGNvbnN0IGRyeVJ1blN1YnNjcmliZXIgPSBkcnlSdW5TaW5rLnJlcG9ydGVyLnN1YnNjcmliZSgoZXZlbnQpID0+IHtcbiAgICAgIHRoaXMuX3JlcG9ydGVyLm5leHQoZXZlbnQpO1xuICAgICAgZXJyb3IgPSBlcnJvciB8fCBldmVudC5raW5kID09ICdlcnJvcic7XG4gICAgfSk7XG5cbiAgICAvLyBXZSBuZWVkIHR3byBzaW5rcyBpZiB3ZSB3YW50IHRvIG91dHB1dCB3aGF0IHdpbGwgaGFwcGVuLCBhbmQgYWN0dWFsbHkgZG8gdGhlIHdvcmsuXG4gICAgcmV0dXJuIFtcbiAgICAgIGRyeVJ1blNpbmssXG4gICAgICAvLyBBZGQgYSBjdXN0b20gc2luayB0aGF0IGNsZWFuIG91cnNlbHZlcyBhbmQgdGhyb3dzIGFuIGVycm9yIGlmIGFuIGVycm9yIGhhcHBlbmVkLlxuICAgICAge1xuICAgICAgICBjb21taXQoKSB7XG4gICAgICAgICAgZHJ5UnVuU3Vic2NyaWJlci51bnN1YnNjcmliZSgpO1xuICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IobmV3IFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uKCkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBvZigpO1xuICAgICAgICB9LFxuICAgICAgfSxcblxuICAgICAgLy8gT25seSBhZGQgYSBIb3N0U2luayBpZiB0aGlzIGlzIG5vdCBhIGRyeVJ1bi5cbiAgICAgIC4uLighdGhpcy5fZHJ5UnVuID8gW25ldyBIb3N0U2luayh0aGlzLl9ob3N0LCB0aGlzLl9mb3JjZSldIDogW10pLFxuICAgIF07XG4gIH1cblxuICBleGVjdXRlKFxuICAgIG9wdGlvbnM6IFBhcnRpYWw8V29ya2Zsb3dFeGVjdXRpb25Db250ZXh0PiAmIFJlcXVpcmVkV29ya2Zsb3dFeGVjdXRpb25Db250ZXh0LFxuICApOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICBjb25zdCBwYXJlbnRDb250ZXh0ID0gdGhpcy5fY29udGV4dFt0aGlzLl9jb250ZXh0Lmxlbmd0aCAtIDFdO1xuXG4gICAgaWYgKCFwYXJlbnRDb250ZXh0KSB7XG4gICAgICB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICdzdGFydCcgfSk7XG4gICAgfVxuXG4gICAgLyoqIENyZWF0ZSB0aGUgY29sbGVjdGlvbiBhbmQgdGhlIHNjaGVtYXRpYy4gKi9cbiAgICBjb25zdCBjb2xsZWN0aW9uID0gdGhpcy5fZW5naW5lLmNyZWF0ZUNvbGxlY3Rpb24ob3B0aW9ucy5jb2xsZWN0aW9uKTtcbiAgICAvLyBPbmx5IGFsbG93IHByaXZhdGUgc2NoZW1hdGljcyBpZiBjYWxsZWQgZnJvbSB0aGUgc2FtZSBjb2xsZWN0aW9uLlxuICAgIGNvbnN0IGFsbG93UHJpdmF0ZSA9XG4gICAgICBvcHRpb25zLmFsbG93UHJpdmF0ZSB8fCAocGFyZW50Q29udGV4dCAmJiBwYXJlbnRDb250ZXh0LmNvbGxlY3Rpb24gPT09IG9wdGlvbnMuY29sbGVjdGlvbik7XG4gICAgY29uc3Qgc2NoZW1hdGljID0gY29sbGVjdGlvbi5jcmVhdGVTY2hlbWF0aWMob3B0aW9ucy5zY2hlbWF0aWMsIGFsbG93UHJpdmF0ZSk7XG5cbiAgICBjb25zdCBzaW5rcyA9IHRoaXMuX2NyZWF0ZVNpbmtzKCk7XG5cbiAgICB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICd3b3JrZmxvdy1zdGFydCcgfSk7XG5cbiAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIGRlYnVnOiBvcHRpb25zLmRlYnVnIHx8IGZhbHNlLFxuICAgICAgbG9nZ2VyOiBvcHRpb25zLmxvZ2dlciB8fCAocGFyZW50Q29udGV4dCAmJiBwYXJlbnRDb250ZXh0LmxvZ2dlcikgfHwgbmV3IGxvZ2dpbmcuTnVsbExvZ2dlcigpLFxuICAgICAgcGFyZW50Q29udGV4dCxcbiAgICB9O1xuICAgIHRoaXMuX2NvbnRleHQucHVzaChjb250ZXh0KTtcblxuICAgIHJldHVybiBzY2hlbWF0aWNcbiAgICAgIC5jYWxsKG9wdGlvbnMub3B0aW9ucywgb2YobmV3IEhvc3RUcmVlKHRoaXMuX2hvc3QpKSwgeyBsb2dnZXI6IGNvbnRleHQubG9nZ2VyIH0pXG4gICAgICAucGlwZShcbiAgICAgICAgY29uY2F0TWFwKCh0cmVlOiBUcmVlKSA9PiB7XG4gICAgICAgICAgLy8gUHJvY2VzcyBhbGwgc2lua3MuXG4gICAgICAgICAgcmV0dXJuIGNvbmNhdChcbiAgICAgICAgICAgIGZyb20oc2lua3MpLnBpcGUoXG4gICAgICAgICAgICAgIGNvbmNhdE1hcCgoc2luaykgPT4gc2luay5jb21taXQodHJlZSkpLFxuICAgICAgICAgICAgICBpZ25vcmVFbGVtZW50cygpLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIG9mKHRyZWUpLFxuICAgICAgICAgICk7XG4gICAgICAgIH0pLFxuICAgICAgICBjb25jYXRNYXAoKCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLl9kcnlSdW4pIHtcbiAgICAgICAgICAgIHJldHVybiBFTVBUWTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLl9saWZlQ3ljbGUubmV4dCh7IGtpbmQ6ICdwb3N0LXRhc2tzLXN0YXJ0JyB9KTtcblxuICAgICAgICAgIHJldHVybiB0aGlzLl9lbmdpbmVcbiAgICAgICAgICAgIC5leGVjdXRlUG9zdFRhc2tzKClcbiAgICAgICAgICAgIC5waXBlKFxuICAgICAgICAgICAgICB0YXAoeyBjb21wbGV0ZTogKCkgPT4gdGhpcy5fbGlmZUN5Y2xlLm5leHQoeyBraW5kOiAncG9zdC10YXNrcy1lbmQnIH0pIH0pLFxuICAgICAgICAgICAgICBkZWZhdWx0SWZFbXB0eSh1bmRlZmluZWQpLFxuICAgICAgICAgICAgICBsYXN0KCksXG4gICAgICAgICAgICApO1xuICAgICAgICB9KSxcbiAgICAgICAgdGFwKHtcbiAgICAgICAgICBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fbGlmZUN5Y2xlLm5leHQoeyBraW5kOiAnd29ya2Zsb3ctZW5kJyB9KTtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRleHQucG9wKCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9jb250ZXh0Lmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2xpZmVDeWNsZS5uZXh0KHsga2luZDogJ2VuZCcgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICApO1xuICB9XG59XG4iXX0=