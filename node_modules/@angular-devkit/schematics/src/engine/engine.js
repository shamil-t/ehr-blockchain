"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchematicEngine = exports.TaskScheduler = exports.CollectionImpl = exports.UnknownTaskDependencyException = exports.UnregisteredTaskException = exports.SchematicEngineConflictingException = exports.PrivateSchematicException = exports.UnknownSchematicException = exports.CircularCollectionException = exports.UnknownCollectionException = exports.UnknownUrlSourceProtocol = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const interface_1 = require("../tree/interface");
const null_1 = require("../tree/null");
const static_1 = require("../tree/static");
const schematic_1 = require("./schematic");
class UnknownUrlSourceProtocol extends core_1.BaseException {
    constructor(url) {
        super(`Unknown Protocol on url "${url}".`);
    }
}
exports.UnknownUrlSourceProtocol = UnknownUrlSourceProtocol;
class UnknownCollectionException extends core_1.BaseException {
    constructor(name) {
        super(`Unknown collection "${name}".`);
    }
}
exports.UnknownCollectionException = UnknownCollectionException;
class CircularCollectionException extends core_1.BaseException {
    constructor(name) {
        super(`Circular collection reference "${name}".`);
    }
}
exports.CircularCollectionException = CircularCollectionException;
class UnknownSchematicException extends core_1.BaseException {
    constructor(name, collection) {
        super(`Schematic "${name}" not found in collection "${collection.name}".`);
    }
}
exports.UnknownSchematicException = UnknownSchematicException;
class PrivateSchematicException extends core_1.BaseException {
    constructor(name, collection) {
        super(`Schematic "${name}" not found in collection "${collection.name}".`);
    }
}
exports.PrivateSchematicException = PrivateSchematicException;
class SchematicEngineConflictingException extends core_1.BaseException {
    constructor() {
        super(`A schematic was called from a different engine as its parent.`);
    }
}
exports.SchematicEngineConflictingException = SchematicEngineConflictingException;
class UnregisteredTaskException extends core_1.BaseException {
    constructor(name, schematic) {
        const addendum = schematic ? ` in schematic "${schematic.name}"` : '';
        super(`Unregistered task "${name}"${addendum}.`);
    }
}
exports.UnregisteredTaskException = UnregisteredTaskException;
class UnknownTaskDependencyException extends core_1.BaseException {
    constructor(id) {
        super(`Unknown task dependency [ID: ${id.id}].`);
    }
}
exports.UnknownTaskDependencyException = UnknownTaskDependencyException;
class CollectionImpl {
    constructor(_description, _engine, baseDescriptions) {
        this._description = _description;
        this._engine = _engine;
        this.baseDescriptions = baseDescriptions;
    }
    get description() {
        return this._description;
    }
    get name() {
        return this.description.name || '<unknown>';
    }
    createSchematic(name, allowPrivate = false) {
        return this._engine.createSchematic(name, this, allowPrivate);
    }
    listSchematicNames(includeHidden) {
        return this._engine.listSchematicNames(this, includeHidden);
    }
}
exports.CollectionImpl = CollectionImpl;
class TaskScheduler {
    constructor(_context) {
        this._context = _context;
        this._queue = new core_1.PriorityQueue((x, y) => x.priority - y.priority);
        this._taskIds = new Map();
    }
    _calculatePriority(dependencies) {
        if (dependencies.size === 0) {
            return 0;
        }
        const prio = [...dependencies].reduce((prio, task) => prio + task.priority, 1);
        return prio;
    }
    _mapDependencies(dependencies) {
        if (!dependencies) {
            return new Set();
        }
        const tasks = dependencies.map((dep) => {
            const task = this._taskIds.get(dep);
            if (!task) {
                throw new UnknownTaskDependencyException(dep);
            }
            return task;
        });
        return new Set(tasks);
    }
    schedule(taskConfiguration) {
        const dependencies = this._mapDependencies(taskConfiguration.dependencies);
        const priority = this._calculatePriority(dependencies);
        const task = {
            id: TaskScheduler._taskIdCounter++,
            priority,
            configuration: taskConfiguration,
            context: this._context,
        };
        this._queue.push(task);
        const id = { id: task.id };
        this._taskIds.set(id, task);
        return id;
    }
    finalize() {
        const tasks = this._queue.toArray();
        this._queue.clear();
        this._taskIds.clear();
        return tasks;
    }
}
exports.TaskScheduler = TaskScheduler;
TaskScheduler._taskIdCounter = 1;
class SchematicEngine {
    constructor(_host, _workflow) {
        this._host = _host;
        this._workflow = _workflow;
        this._collectionCache = new Map();
        this._schematicCache = new WeakMap();
        this._taskSchedulers = new Array();
    }
    get workflow() {
        return this._workflow || null;
    }
    get defaultMergeStrategy() {
        return this._host.defaultMergeStrategy || interface_1.MergeStrategy.Default;
    }
    createCollection(name, requester) {
        let collection = this._collectionCache.get(name);
        if (collection) {
            return collection;
        }
        const [description, bases] = this._createCollectionDescription(name, requester?.description);
        collection = new CollectionImpl(description, this, bases);
        this._collectionCache.set(name, collection);
        this._schematicCache.set(collection, new Map());
        return collection;
    }
    _createCollectionDescription(name, requester, parentNames) {
        const description = this._host.createCollectionDescription(name, requester);
        if (!description) {
            throw new UnknownCollectionException(name);
        }
        if (parentNames && parentNames.has(description.name)) {
            throw new CircularCollectionException(name);
        }
        const bases = new Array();
        if (description.extends) {
            parentNames = (parentNames || new Set()).add(description.name);
            for (const baseName of description.extends) {
                const [base, baseBases] = this._createCollectionDescription(baseName, description, new Set(parentNames));
                bases.unshift(base, ...baseBases);
            }
        }
        return [description, bases];
    }
    createContext(schematic, parent, executionOptions) {
        // Check for inconsistencies.
        if (parent && parent.engine && parent.engine !== this) {
            throw new SchematicEngineConflictingException();
        }
        let interactive = true;
        if (executionOptions && executionOptions.interactive != undefined) {
            interactive = executionOptions.interactive;
        }
        else if (parent && parent.interactive != undefined) {
            interactive = parent.interactive;
        }
        let context = {
            debug: (parent && parent.debug) || false,
            engine: this,
            logger: (parent && parent.logger && parent.logger.createChild(schematic.description.name)) ||
                new core_1.logging.NullLogger(),
            schematic,
            strategy: parent && parent.strategy !== undefined ? parent.strategy : this.defaultMergeStrategy,
            interactive,
            addTask,
        };
        const maybeNewContext = this._host.transformContext(context);
        if (maybeNewContext) {
            context = maybeNewContext;
        }
        const taskScheduler = new TaskScheduler(context);
        const host = this._host;
        this._taskSchedulers.push(taskScheduler);
        function addTask(task, dependencies) {
            const config = task.toConfiguration();
            if (!host.hasTaskExecutor(config.name)) {
                throw new UnregisteredTaskException(config.name, schematic.description);
            }
            config.dependencies = config.dependencies || [];
            if (dependencies) {
                config.dependencies.unshift(...dependencies);
            }
            return taskScheduler.schedule(config);
        }
        return context;
    }
    createSchematic(name, collection, allowPrivate = false) {
        const schematicMap = this._schematicCache.get(collection);
        let schematic = schematicMap?.get(name);
        if (schematic) {
            return schematic;
        }
        let collectionDescription = collection.description;
        let description = this._host.createSchematicDescription(name, collection.description);
        if (!description) {
            if (collection.baseDescriptions) {
                for (const base of collection.baseDescriptions) {
                    description = this._host.createSchematicDescription(name, base);
                    if (description) {
                        collectionDescription = base;
                        break;
                    }
                }
            }
            if (!description) {
                // Report the error for the top level schematic collection
                throw new UnknownSchematicException(name, collection.description);
            }
        }
        if (description.private && !allowPrivate) {
            throw new PrivateSchematicException(name, collection.description);
        }
        const factory = this._host.getSchematicRuleFactory(description, collectionDescription);
        schematic = new schematic_1.SchematicImpl(description, factory, collection, this);
        schematicMap?.set(name, schematic);
        return schematic;
    }
    listSchematicNames(collection, includeHidden) {
        const names = this._host.listSchematicNames(collection.description, includeHidden);
        if (collection.baseDescriptions) {
            for (const base of collection.baseDescriptions) {
                names.push(...this._host.listSchematicNames(base, includeHidden));
            }
        }
        // remove duplicates
        return [...new Set(names)].sort();
    }
    transformOptions(schematic, options, context) {
        return this._host.transformOptions(schematic.description, options, context);
    }
    createSourceFromUrl(url, context) {
        switch (url.protocol) {
            case 'null:':
                return () => new null_1.NullTree();
            case 'empty:':
                return () => (0, static_1.empty)();
            default:
                const hostSource = this._host.createSourceFromUrl(url, context);
                if (!hostSource) {
                    throw new UnknownUrlSourceProtocol(url.toString());
                }
                return hostSource;
        }
    }
    executePostTasks() {
        const executors = new Map();
        const taskObservable = (0, rxjs_1.from)(this._taskSchedulers).pipe((0, rxjs_1.concatMap)((scheduler) => scheduler.finalize()), (0, rxjs_1.concatMap)((task) => {
            const { name, options } = task.configuration;
            const executor = executors.get(name);
            if (executor) {
                return executor(options, task.context);
            }
            return this._host.createTaskExecutor(name).pipe((0, rxjs_1.concatMap)((executor) => {
                executors.set(name, executor);
                return executor(options, task.context);
            }));
        }));
        return taskObservable;
    }
}
exports.SchematicEngine = SchematicEngine;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvZW5naW5lL2VuZ2luZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBNkU7QUFDN0UsK0JBQXFFO0FBRXJFLGlEQUFrRDtBQUNsRCx1Q0FBd0M7QUFDeEMsMkNBQXVDO0FBbUJ2QywyQ0FBNEM7QUFFNUMsTUFBYSx3QkFBeUIsU0FBUSxvQkFBYTtJQUN6RCxZQUFZLEdBQVc7UUFDckIsS0FBSyxDQUFDLDRCQUE0QixHQUFHLElBQUksQ0FBQyxDQUFDO0lBQzdDLENBQUM7Q0FDRjtBQUpELDREQUlDO0FBRUQsTUFBYSwwQkFBMkIsU0FBUSxvQkFBYTtJQUMzRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLHVCQUF1QixJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ3pDLENBQUM7Q0FDRjtBQUpELGdFQUlDO0FBRUQsTUFBYSwyQkFBNEIsU0FBUSxvQkFBYTtJQUM1RCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGtDQUFrQyxJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ3BELENBQUM7Q0FDRjtBQUpELGtFQUlDO0FBRUQsTUFBYSx5QkFBMEIsU0FBUSxvQkFBYTtJQUMxRCxZQUFZLElBQVksRUFBRSxVQUFxQztRQUM3RCxLQUFLLENBQUMsY0FBYyxJQUFJLDhCQUE4QixVQUFVLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUM3RSxDQUFDO0NBQ0Y7QUFKRCw4REFJQztBQUVELE1BQWEseUJBQTBCLFNBQVEsb0JBQWE7SUFDMUQsWUFBWSxJQUFZLEVBQUUsVUFBcUM7UUFDN0QsS0FBSyxDQUFDLGNBQWMsSUFBSSw4QkFBOEIsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7SUFDN0UsQ0FBQztDQUNGO0FBSkQsOERBSUM7QUFFRCxN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SUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3hDO1lBRUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDN0MsSUFBQSxnQkFBUyxFQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7Z0JBQ3JCLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUU5QixPQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUNILENBQUM7UUFDSixDQUFDLENBQUMsQ0FDSCxDQUFDO1FBRUYsT0FBTyxjQUFjLENBQUM7SUFDeEIsQ0FBQztDQUNGO0FBMU9ELDBDQTBPQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uLCBQcmlvcml0eVF1ZXVlLCBsb2dnaW5nIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgY29uY2F0TWFwLCBmcm9tIGFzIG9ic2VydmFibGVGcm9tIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBVcmwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgTWVyZ2VTdHJhdGVneSB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcbmltcG9ydCB7IE51bGxUcmVlIH0gZnJvbSAnLi4vdHJlZS9udWxsJztcbmltcG9ydCB7IGVtcHR5IH0gZnJvbSAnLi4vdHJlZS9zdGF0aWMnO1xuaW1wb3J0IHsgV29ya2Zsb3cgfSBmcm9tICcuLi93b3JrZmxvdy9pbnRlcmZhY2UnO1xuaW1wb3J0IHtcbiAgQ29sbGVjdGlvbixcbiAgQ29sbGVjdGlvbkRlc2NyaXB0aW9uLFxuICBFbmdpbmUsXG4gIEVuZ2luZUhvc3QsXG4gIEV4ZWN1dGlvbk9wdGlvbnMsXG4gIFNjaGVtYXRpYyxcbiAgU2NoZW1hdGljQ29udGV4dCxcbiAgU2NoZW1hdGljRGVzY3JpcHRpb24sXG4gIFNvdXJjZSxcbiAgVGFza0NvbmZpZ3VyYXRpb24sXG4gIFRhc2tDb25maWd1cmF0aW9uR2VuZXJhdG9yLFxuICBUYXNrRXhlY3V0b3IsXG4gIFRhc2tJZCxcbiAgVGFza0luZm8sXG4gIFR5cGVkU2NoZW1hdGljQ29udGV4dCxcbn0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgU2NoZW1hdGljSW1wbCB9IGZyb20gJy4vc2NoZW1hdGljJztcblxuZXhwb3J0IGNsYXNzIFVua25vd25VcmxTb3VyY2VQcm90b2NvbCBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3Rvcih1cmw6IHN0cmluZykge1xuICAgIHN1cGVyKGBVbmtub3duIFByb3RvY29sIG9uIHVybCBcIiR7dXJsfVwiLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVbmtub3duQ29sbGVjdGlvbkV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgVW5rbm93biBjb2xsZWN0aW9uIFwiJHtuYW1lfVwiLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDaXJjdWxhckNvbGxlY3Rpb25FeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENpcmN1bGFyIGNvbGxlY3Rpb24gcmVmZXJlbmNlIFwiJHtuYW1lfVwiLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVbmtub3duU2NoZW1hdGljRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgY29sbGVjdGlvbjogQ29sbGVjdGlvbkRlc2NyaXB0aW9uPHt9Pikge1xuICAgIHN1cGVyKGBTY2hlbWF0aWMgXCIke25hbWV9XCIgbm90IGZvdW5kIGluIGNvbGxlY3Rpb24gXCIke2NvbGxlY3Rpb24ubmFtZX1cIi5gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUHJpdmF0ZVNjaGVtYXRpY0V4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGNvbGxlY3Rpb246IENvbGxlY3Rpb25EZXNjcmlwdGlvbjx7fT4pIHtcbiAgICBzdXBlcihgU2NoZW1hdGljIFwiJHtuYW1lfVwiIG5vdCBmb3VuZCBpbiBjb2xsZWN0aW9uIFwiJHtjb2xsZWN0aW9uLm5hbWV9XCIuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY0VuZ2luZUNvbmZsaWN0aW5nRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKGBBIHNjaGVtYXRpYyB3YXMgY2FsbGVkIGZyb20gYSBkaWZmZXJlbnQgZW5naW5lIGFzIGl0cyBwYXJlbnQuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVucmVnaXN0ZXJlZFRhc2tFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBzY2hlbWF0aWM/OiBTY2hlbWF0aWNEZXNjcmlwdGlvbjx7fSwge30+KSB7XG4gICAgY29uc3QgYWRkZW5kdW0gPSBzY2hlbWF0aWMgPyBgIGluIHNjaGVtYXRpYyBcIiR7c2NoZW1hdGljLm5hbWV9XCJgIDogJyc7XG4gICAgc3VwZXIoYFVucmVnaXN0ZXJlZCB0YXNrIFwiJHtuYW1lfVwiJHthZGRlbmR1bX0uYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVua25vd25UYXNrRGVwZW5kZW5jeUV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihpZDogVGFza0lkKSB7XG4gICAgc3VwZXIoYFVua25vd24gdGFzayBkZXBlbmRlbmN5IFtJRDogJHtpZC5pZH1dLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uSW1wbDxDb2xsZWN0aW9uVCBleHRlbmRzIG9iamVjdCwgU2NoZW1hdGljVCBleHRlbmRzIG9iamVjdD5cbiAgaW1wbGVtZW50cyBDb2xsZWN0aW9uPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPlxue1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9kZXNjcmlwdGlvbjogQ29sbGVjdGlvbkRlc2NyaXB0aW9uPENvbGxlY3Rpb25UPixcbiAgICBwcml2YXRlIF9lbmdpbmU6IFNjaGVtYXRpY0VuZ2luZTxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICAgcHVibGljIHJlYWRvbmx5IGJhc2VEZXNjcmlwdGlvbnM/OiBBcnJheTxDb2xsZWN0aW9uRGVzY3JpcHRpb248Q29sbGVjdGlvblQ+PixcbiAgKSB7fVxuXG4gIGdldCBkZXNjcmlwdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzY3JpcHRpb247XG4gIH1cbiAgZ2V0IG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGVzY3JpcHRpb24ubmFtZSB8fCAnPHVua25vd24+JztcbiAgfVxuXG4gIGNyZWF0ZVNjaGVtYXRpYyhuYW1lOiBzdHJpbmcsIGFsbG93UHJpdmF0ZSA9IGZhbHNlKTogU2NoZW1hdGljPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPiB7XG4gICAgcmV0dXJuIHRoaXMuX2VuZ2luZS5jcmVhdGVTY2hlbWF0aWMobmFtZSwgdGhpcywgYWxsb3dQcml2YXRlKTtcbiAgfVxuXG4gIGxpc3RTY2hlbWF0aWNOYW1lcyhpbmNsdWRlSGlkZGVuPzogYm9vbGVhbik6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5fZW5naW5lLmxpc3RTY2hlbWF0aWNOYW1lcyh0aGlzLCBpbmNsdWRlSGlkZGVuKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVGFza1NjaGVkdWxlciB7XG4gIHByaXZhdGUgX3F1ZXVlID0gbmV3IFByaW9yaXR5UXVldWU8VGFza0luZm8+KCh4LCB5KSA9PiB4LnByaW9yaXR5IC0geS5wcmlvcml0eSk7XG4gIHByaXZhdGUgX3Rhc2tJZHMgPSBuZXcgTWFwPFRhc2tJZCwgVGFza0luZm8+KCk7XG4gIHByaXZhdGUgc3RhdGljIF90YXNrSWRDb3VudGVyID0gMTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9jb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSB7fVxuXG4gIHByaXZhdGUgX2NhbGN1bGF0ZVByaW9yaXR5KGRlcGVuZGVuY2llczogU2V0PFRhc2tJbmZvPik6IG51bWJlciB7XG4gICAgaWYgKGRlcGVuZGVuY2llcy5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCBwcmlvID0gWy4uLmRlcGVuZGVuY2llc10ucmVkdWNlKChwcmlvLCB0YXNrKSA9PiBwcmlvICsgdGFzay5wcmlvcml0eSwgMSk7XG5cbiAgICByZXR1cm4gcHJpbztcbiAgfVxuXG4gIHByaXZhdGUgX21hcERlcGVuZGVuY2llcyhkZXBlbmRlbmNpZXM/OiBBcnJheTxUYXNrSWQ+KTogU2V0PFRhc2tJbmZvPiB7XG4gICAgaWYgKCFkZXBlbmRlbmNpZXMpIHtcbiAgICAgIHJldHVybiBuZXcgU2V0KCk7XG4gICAgfVxuXG4gICAgY29uc3QgdGFza3MgPSBkZXBlbmRlbmNpZXMubWFwKChkZXApID0+IHtcbiAgICAgIGNvbnN0IHRhc2sgPSB0aGlzLl90YXNrSWRzLmdldChkZXApO1xuICAgICAgaWYgKCF0YXNrKSB7XG4gICAgICAgIHRocm93IG5ldyBVbmtub3duVGFza0RlcGVuZGVuY3lFeGNlcHRpb24oZGVwKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRhc2s7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IFNldCh0YXNrcyk7XG4gIH1cblxuICBzY2hlZHVsZTxUIGV4dGVuZHMgb2JqZWN0Pih0YXNrQ29uZmlndXJhdGlvbjogVGFza0NvbmZpZ3VyYXRpb248VD4pOiBUYXNrSWQge1xuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IHRoaXMuX21hcERlcGVuZGVuY2llcyh0YXNrQ29uZmlndXJhdGlvbi5kZXBlbmRlbmNpZXMpO1xuICAgIGNvbnN0IHByaW9yaXR5ID0gdGhpcy5fY2FsY3VsYXRlUHJpb3JpdHkoZGVwZW5kZW5jaWVzKTtcblxuICAgIGNvbnN0IHRhc2sgPSB7XG4gICAgICBpZDogVGFza1NjaGVkdWxlci5fdGFza0lkQ291bnRlcisrLFxuICAgICAgcHJpb3JpdHksXG4gICAgICBjb25maWd1cmF0aW9uOiB0YXNrQ29uZmlndXJhdGlvbixcbiAgICAgIGNvbnRleHQ6IHRoaXMuX2NvbnRleHQsXG4gICAgfTtcblxuICAgIHRoaXMuX3F1ZXVlLnB1c2godGFzayk7XG5cbiAgICBjb25zdCBpZCA9IHsgaWQ6IHRhc2suaWQgfTtcbiAgICB0aGlzLl90YXNrSWRzLnNldChpZCwgdGFzayk7XG5cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICBmaW5hbGl6ZSgpOiBSZWFkb25seUFycmF5PFRhc2tJbmZvPiB7XG4gICAgY29uc3QgdGFza3MgPSB0aGlzLl9xdWV1ZS50b0FycmF5KCk7XG4gICAgdGhpcy5fcXVldWUuY2xlYXIoKTtcbiAgICB0aGlzLl90YXNrSWRzLmNsZWFyKCk7XG5cbiAgICByZXR1cm4gdGFza3M7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY0VuZ2luZTxDb2xsZWN0aW9uVCBleHRlbmRzIG9iamVjdCwgU2NoZW1hdGljVCBleHRlbmRzIG9iamVjdD5cbiAgaW1wbGVtZW50cyBFbmdpbmU8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+XG57XG4gIHByaXZhdGUgX2NvbGxlY3Rpb25DYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBDb2xsZWN0aW9uSW1wbDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4+KCk7XG4gIHByaXZhdGUgX3NjaGVtYXRpY0NhY2hlID0gbmV3IFdlYWtNYXA8XG4gICAgQ29sbGVjdGlvbjxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICAgTWFwPHN0cmluZywgU2NoZW1hdGljSW1wbDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4+XG4gID4oKTtcbiAgcHJpdmF0ZSBfdGFza1NjaGVkdWxlcnMgPSBuZXcgQXJyYXk8VGFza1NjaGVkdWxlcj4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9ob3N0OiBFbmdpbmVIb3N0PENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPiwgcHJvdGVjdGVkIF93b3JrZmxvdz86IFdvcmtmbG93KSB7fVxuXG4gIGdldCB3b3JrZmxvdygpIHtcbiAgICByZXR1cm4gdGhpcy5fd29ya2Zsb3cgfHwgbnVsbDtcbiAgfVxuICBnZXQgZGVmYXVsdE1lcmdlU3RyYXRlZ3koKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hvc3QuZGVmYXVsdE1lcmdlU3RyYXRlZ3kgfHwgTWVyZ2VTdHJhdGVneS5EZWZhdWx0O1xuICB9XG5cbiAgY3JlYXRlQ29sbGVjdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcmVxdWVzdGVyPzogQ29sbGVjdGlvbjxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICk6IENvbGxlY3Rpb248Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+IHtcbiAgICBsZXQgY29sbGVjdGlvbiA9IHRoaXMuX2NvbGxlY3Rpb25DYWNoZS5nZXQobmFtZSk7XG4gICAgaWYgKGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICAgIH1cblxuICAgIGNvbnN0IFtkZXNjcmlwdGlvbiwgYmFzZXNdID0gdGhpcy5fY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKG5hbWUsIHJlcXVlc3Rlcj8uZGVzY3JpcHRpb24pO1xuXG4gICAgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uSW1wbDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4oZGVzY3JpcHRpb24sIHRoaXMsIGJhc2VzKTtcbiAgICB0aGlzLl9jb2xsZWN0aW9uQ2FjaGUuc2V0KG5hbWUsIGNvbGxlY3Rpb24pO1xuICAgIHRoaXMuX3NjaGVtYXRpY0NhY2hlLnNldChjb2xsZWN0aW9uLCBuZXcgTWFwKCkpO1xuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVDb2xsZWN0aW9uRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHJlcXVlc3Rlcj86IENvbGxlY3Rpb25EZXNjcmlwdGlvbjxDb2xsZWN0aW9uVD4sXG4gICAgcGFyZW50TmFtZXM/OiBTZXQ8c3RyaW5nPixcbiAgKTogW0NvbGxlY3Rpb25EZXNjcmlwdGlvbjxDb2xsZWN0aW9uVD4sIEFycmF5PENvbGxlY3Rpb25EZXNjcmlwdGlvbjxDb2xsZWN0aW9uVD4+XSB7XG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLl9ob3N0LmNyZWF0ZUNvbGxlY3Rpb25EZXNjcmlwdGlvbihuYW1lLCByZXF1ZXN0ZXIpO1xuICAgIGlmICghZGVzY3JpcHRpb24pIHtcbiAgICAgIHRocm93IG5ldyBVbmtub3duQ29sbGVjdGlvbkV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG4gICAgaWYgKHBhcmVudE5hbWVzICYmIHBhcmVudE5hbWVzLmhhcyhkZXNjcmlwdGlvbi5uYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IENpcmN1bGFyQ29sbGVjdGlvbkV4Y2VwdGlvbihuYW1lKTtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlcyA9IG5ldyBBcnJheTxDb2xsZWN0aW9uRGVzY3JpcHRpb248Q29sbGVjdGlvblQ+PigpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5leHRlbmRzKSB7XG4gICAgICBwYXJlbnROYW1lcyA9IChwYXJlbnROYW1lcyB8fCBuZXcgU2V0PHN0cmluZz4oKSkuYWRkKGRlc2NyaXB0aW9uLm5hbWUpO1xuICAgICAgZm9yIChjb25zdCBiYXNlTmFtZSBvZiBkZXNjcmlwdGlvbi5leHRlbmRzKSB7XG4gICAgICAgIGNvbnN0IFtiYXNlLCBiYXNlQmFzZXNdID0gdGhpcy5fY3JlYXRlQ29sbGVjdGlvbkRlc2NyaXB0aW9uKFxuICAgICAgICAgIGJhc2VOYW1lLFxuICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgIG5ldyBTZXQocGFyZW50TmFtZXMpLFxuICAgICAgICApO1xuXG4gICAgICAgIGJhc2VzLnVuc2hpZnQoYmFzZSwgLi4uYmFzZUJhc2VzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gW2Rlc2NyaXB0aW9uLCBiYXNlc107XG4gIH1cblxuICBjcmVhdGVDb250ZXh0KFxuICAgIHNjaGVtYXRpYzogU2NoZW1hdGljPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPixcbiAgICBwYXJlbnQ/OiBQYXJ0aWFsPFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4+LFxuICAgIGV4ZWN1dGlvbk9wdGlvbnM/OiBQYXJ0aWFsPEV4ZWN1dGlvbk9wdGlvbnM+LFxuICApOiBUeXBlZFNjaGVtYXRpY0NvbnRleHQ8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+IHtcbiAgICAvLyBDaGVjayBmb3IgaW5jb25zaXN0ZW5jaWVzLlxuICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LmVuZ2luZSAmJiBwYXJlbnQuZW5naW5lICE9PSB0aGlzKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljRW5naW5lQ29uZmxpY3RpbmdFeGNlcHRpb24oKTtcbiAgICB9XG5cbiAgICBsZXQgaW50ZXJhY3RpdmUgPSB0cnVlO1xuICAgIGlmIChleGVjdXRpb25PcHRpb25zICYmIGV4ZWN1dGlvbk9wdGlvbnMuaW50ZXJhY3RpdmUgIT0gdW5kZWZpbmVkKSB7XG4gICAgICBpbnRlcmFjdGl2ZSA9IGV4ZWN1dGlvbk9wdGlvbnMuaW50ZXJhY3RpdmU7XG4gICAgfSBlbHNlIGlmIChwYXJlbnQgJiYgcGFyZW50LmludGVyYWN0aXZlICE9IHVuZGVmaW5lZCkge1xuICAgICAgaW50ZXJhY3RpdmUgPSBwYXJlbnQuaW50ZXJhY3RpdmU7XG4gICAgfVxuXG4gICAgbGV0IGNvbnRleHQ6IFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4gPSB7XG4gICAgICBkZWJ1ZzogKHBhcmVudCAmJiBwYXJlbnQuZGVidWcpIHx8IGZhbHNlLFxuICAgICAgZW5naW5lOiB0aGlzLFxuICAgICAgbG9nZ2VyOlxuICAgICAgICAocGFyZW50ICYmIHBhcmVudC5sb2dnZXIgJiYgcGFyZW50LmxvZ2dlci5jcmVhdGVDaGlsZChzY2hlbWF0aWMuZGVzY3JpcHRpb24ubmFtZSkpIHx8XG4gICAgICAgIG5ldyBsb2dnaW5nLk51bGxMb2dnZXIoKSxcbiAgICAgIHNjaGVtYXRpYyxcbiAgICAgIHN0cmF0ZWd5OlxuICAgICAgICBwYXJlbnQgJiYgcGFyZW50LnN0cmF0ZWd5ICE9PSB1bmRlZmluZWQgPyBwYXJlbnQuc3RyYXRlZ3kgOiB0aGlzLmRlZmF1bHRNZXJnZVN0cmF0ZWd5LFxuICAgICAgaW50ZXJhY3RpdmUsXG4gICAgICBhZGRUYXNrLFxuICAgIH07XG5cbiAgICBjb25zdCBtYXliZU5ld0NvbnRleHQgPSB0aGlzLl9ob3N0LnRyYW5zZm9ybUNvbnRleHQoY29udGV4dCk7XG4gICAgaWYgKG1heWJlTmV3Q29udGV4dCkge1xuICAgICAgY29udGV4dCA9IG1heWJlTmV3Q29udGV4dDtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrU2NoZWR1bGVyID0gbmV3IFRhc2tTY2hlZHVsZXIoY29udGV4dCk7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMuX2hvc3Q7XG4gICAgdGhpcy5fdGFza1NjaGVkdWxlcnMucHVzaCh0YXNrU2NoZWR1bGVyKTtcblxuICAgIGZ1bmN0aW9uIGFkZFRhc2s8VCBleHRlbmRzIG9iamVjdD4oXG4gICAgICB0YXNrOiBUYXNrQ29uZmlndXJhdGlvbkdlbmVyYXRvcjxUPixcbiAgICAgIGRlcGVuZGVuY2llcz86IEFycmF5PFRhc2tJZD4sXG4gICAgKTogVGFza0lkIHtcbiAgICAgIGNvbnN0IGNvbmZpZyA9IHRhc2sudG9Db25maWd1cmF0aW9uKCk7XG5cbiAgICAgIGlmICghaG9zdC5oYXNUYXNrRXhlY3V0b3IoY29uZmlnLm5hbWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBVbnJlZ2lzdGVyZWRUYXNrRXhjZXB0aW9uKGNvbmZpZy5uYW1lLCBzY2hlbWF0aWMuZGVzY3JpcHRpb24pO1xuICAgICAgfVxuXG4gICAgICBjb25maWcuZGVwZW5kZW5jaWVzID0gY29uZmlnLmRlcGVuZGVuY2llcyB8fCBbXTtcbiAgICAgIGlmIChkZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgY29uZmlnLmRlcGVuZGVuY2llcy51bnNoaWZ0KC4uLmRlcGVuZGVuY2llcyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0YXNrU2NoZWR1bGVyLnNjaGVkdWxlKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRleHQ7XG4gIH1cblxuICBjcmVhdGVTY2hlbWF0aWMoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGNvbGxlY3Rpb246IENvbGxlY3Rpb248Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+LFxuICAgIGFsbG93UHJpdmF0ZSA9IGZhbHNlLFxuICApOiBTY2hlbWF0aWM8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+IHtcbiAgICBjb25zdCBzY2hlbWF0aWNNYXAgPSB0aGlzLl9zY2hlbWF0aWNDYWNoZS5nZXQoY29sbGVjdGlvbik7XG5cbiAgICBsZXQgc2NoZW1hdGljID0gc2NoZW1hdGljTWFwPy5nZXQobmFtZSk7XG4gICAgaWYgKHNjaGVtYXRpYykge1xuICAgICAgcmV0dXJuIHNjaGVtYXRpYztcbiAgICB9XG5cbiAgICBsZXQgY29sbGVjdGlvbkRlc2NyaXB0aW9uID0gY29sbGVjdGlvbi5kZXNjcmlwdGlvbjtcbiAgICBsZXQgZGVzY3JpcHRpb24gPSB0aGlzLl9ob3N0LmNyZWF0ZVNjaGVtYXRpY0Rlc2NyaXB0aW9uKG5hbWUsIGNvbGxlY3Rpb24uZGVzY3JpcHRpb24pO1xuICAgIGlmICghZGVzY3JpcHRpb24pIHtcbiAgICAgIGlmIChjb2xsZWN0aW9uLmJhc2VEZXNjcmlwdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBiYXNlIG9mIGNvbGxlY3Rpb24uYmFzZURlc2NyaXB0aW9ucykge1xuICAgICAgICAgIGRlc2NyaXB0aW9uID0gdGhpcy5faG9zdC5jcmVhdGVTY2hlbWF0aWNEZXNjcmlwdGlvbihuYW1lLCBiYXNlKTtcbiAgICAgICAgICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIGNvbGxlY3Rpb25EZXNjcmlwdGlvbiA9IGJhc2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZGVzY3JpcHRpb24pIHtcbiAgICAgICAgLy8gUmVwb3J0IHRoZSBlcnJvciBmb3IgdGhlIHRvcCBsZXZlbCBzY2hlbWF0aWMgY29sbGVjdGlvblxuICAgICAgICB0aHJvdyBuZXcgVW5rbm93blNjaGVtYXRpY0V4Y2VwdGlvbihuYW1lLCBjb2xsZWN0aW9uLmRlc2NyaXB0aW9uKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZGVzY3JpcHRpb24ucHJpdmF0ZSAmJiAhYWxsb3dQcml2YXRlKSB7XG4gICAgICB0aHJvdyBuZXcgUHJpdmF0ZVNjaGVtYXRpY0V4Y2VwdGlvbihuYW1lLCBjb2xsZWN0aW9uLmRlc2NyaXB0aW9uKTtcbiAgICB9XG5cbiAgICBjb25zdCBmYWN0b3J5ID0gdGhpcy5faG9zdC5nZXRTY2hlbWF0aWNSdWxlRmFjdG9yeShkZXNjcmlwdGlvbiwgY29sbGVjdGlvbkRlc2NyaXB0aW9uKTtcbiAgICBzY2hlbWF0aWMgPSBuZXcgU2NoZW1hdGljSW1wbDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4oZGVzY3JpcHRpb24sIGZhY3RvcnksIGNvbGxlY3Rpb24sIHRoaXMpO1xuXG4gICAgc2NoZW1hdGljTWFwPy5zZXQobmFtZSwgc2NoZW1hdGljKTtcblxuICAgIHJldHVybiBzY2hlbWF0aWM7XG4gIH1cblxuICBsaXN0U2NoZW1hdGljTmFtZXMoXG4gICAgY29sbGVjdGlvbjogQ29sbGVjdGlvbjxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICAgaW5jbHVkZUhpZGRlbj86IGJvb2xlYW4sXG4gICk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBuYW1lcyA9IHRoaXMuX2hvc3QubGlzdFNjaGVtYXRpY05hbWVzKGNvbGxlY3Rpb24uZGVzY3JpcHRpb24sIGluY2x1ZGVIaWRkZW4pO1xuXG4gICAgaWYgKGNvbGxlY3Rpb24uYmFzZURlc2NyaXB0aW9ucykge1xuICAgICAgZm9yIChjb25zdCBiYXNlIG9mIGNvbGxlY3Rpb24uYmFzZURlc2NyaXB0aW9ucykge1xuICAgICAgICBuYW1lcy5wdXNoKC4uLnRoaXMuX2hvc3QubGlzdFNjaGVtYXRpY05hbWVzKGJhc2UsIGluY2x1ZGVIaWRkZW4pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByZW1vdmUgZHVwbGljYXRlc1xuICAgIHJldHVybiBbLi4ubmV3IFNldChuYW1lcyldLnNvcnQoKTtcbiAgfVxuXG4gIHRyYW5zZm9ybU9wdGlvbnM8T3B0aW9uVCBleHRlbmRzIG9iamVjdCwgUmVzdWx0VCBleHRlbmRzIG9iamVjdD4oXG4gICAgc2NoZW1hdGljOiBTY2hlbWF0aWM8Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+LFxuICAgIG9wdGlvbnM6IE9wdGlvblQsXG4gICAgY29udGV4dD86IFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICk6IE9ic2VydmFibGU8UmVzdWx0VD4ge1xuICAgIHJldHVybiB0aGlzLl9ob3N0LnRyYW5zZm9ybU9wdGlvbnM8T3B0aW9uVCwgUmVzdWx0VD4oc2NoZW1hdGljLmRlc2NyaXB0aW9uLCBvcHRpb25zLCBjb250ZXh0KTtcbiAgfVxuXG4gIGNyZWF0ZVNvdXJjZUZyb21VcmwodXJsOiBVcmwsIGNvbnRleHQ6IFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4pOiBTb3VyY2Uge1xuICAgIHN3aXRjaCAodXJsLnByb3RvY29sKSB7XG4gICAgICBjYXNlICdudWxsOic6XG4gICAgICAgIHJldHVybiAoKSA9PiBuZXcgTnVsbFRyZWUoKTtcbiAgICAgIGNhc2UgJ2VtcHR5Oic6XG4gICAgICAgIHJldHVybiAoKSA9PiBlbXB0eSgpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc3QgaG9zdFNvdXJjZSA9IHRoaXMuX2hvc3QuY3JlYXRlU291cmNlRnJvbVVybCh1cmwsIGNvbnRleHQpO1xuICAgICAgICBpZiAoIWhvc3RTb3VyY2UpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVW5rbm93blVybFNvdXJjZVByb3RvY29sKHVybC50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBob3N0U291cmNlO1xuICAgIH1cbiAgfVxuXG4gIGV4ZWN1dGVQb3N0VGFza3MoKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgY29uc3QgZXhlY3V0b3JzID0gbmV3IE1hcDxzdHJpbmcsIFRhc2tFeGVjdXRvcj4oKTtcblxuICAgIGNvbnN0IHRhc2tPYnNlcnZhYmxlID0gb2JzZXJ2YWJsZUZyb20odGhpcy5fdGFza1NjaGVkdWxlcnMpLnBpcGUoXG4gICAgICBjb25jYXRNYXAoKHNjaGVkdWxlcikgPT4gc2NoZWR1bGVyLmZpbmFsaXplKCkpLFxuICAgICAgY29uY2F0TWFwKCh0YXNrKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgbmFtZSwgb3B0aW9ucyB9ID0gdGFzay5jb25maWd1cmF0aW9uO1xuXG4gICAgICAgIGNvbnN0IGV4ZWN1dG9yID0gZXhlY3V0b3JzLmdldChuYW1lKTtcbiAgICAgICAgaWYgKGV4ZWN1dG9yKSB7XG4gICAgICAgICAgcmV0dXJuIGV4ZWN1dG9yKG9wdGlvbnMsIHRhc2suY29udGV4dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5faG9zdC5jcmVhdGVUYXNrRXhlY3V0b3IobmFtZSkucGlwZShcbiAgICAgICAgICBjb25jYXRNYXAoKGV4ZWN1dG9yKSA9PiB7XG4gICAgICAgICAgICBleGVjdXRvcnMuc2V0KG5hbWUsIGV4ZWN1dG9yKTtcblxuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dG9yKG9wdGlvbnMsIHRhc2suY29udGV4dCk7XG4gICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgcmV0dXJuIHRhc2tPYnNlcnZhYmxlO1xuICB9XG59XG4iXX0=