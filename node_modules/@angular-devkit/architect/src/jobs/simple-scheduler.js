"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleScheduler = exports.JobOutputSchemaValidationError = exports.JobInboundMessageSchemaValidationError = exports.JobArgumentSchemaValidationError = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const api_1 = require("./api");
const exception_1 = require("./exception");
class JobArgumentSchemaValidationError extends core_1.schema.SchemaValidationException {
    constructor(errors) {
        super(errors, 'Job Argument failed to validate. Errors: ');
    }
}
exports.JobArgumentSchemaValidationError = JobArgumentSchemaValidationError;
class JobInboundMessageSchemaValidationError extends core_1.schema.SchemaValidationException {
    constructor(errors) {
        super(errors, 'Job Inbound Message failed to validate. Errors: ');
    }
}
exports.JobInboundMessageSchemaValidationError = JobInboundMessageSchemaValidationError;
class JobOutputSchemaValidationError extends core_1.schema.SchemaValidationException {
    constructor(errors) {
        super(errors, 'Job Output failed to validate. Errors: ');
    }
}
exports.JobOutputSchemaValidationError = JobOutputSchemaValidationError;
function _jobShare() {
    // This is the same code as a `shareReplay()` operator, but uses a dumber Subject rather than a
    // ReplaySubject.
    return (source) => {
        let refCount = 0;
        let subject;
        let hasError = false;
        let isComplete = false;
        let subscription;
        return new rxjs_1.Observable((subscriber) => {
            let innerSub;
            refCount++;
            if (!subject) {
                subject = new rxjs_1.Subject();
                innerSub = subject.subscribe(subscriber);
                subscription = source.subscribe({
                    next(value) {
                        subject.next(value);
                    },
                    error(err) {
                        hasError = true;
                        subject.error(err);
                    },
                    complete() {
                        isComplete = true;
                        subject.complete();
                    },
                });
            }
            else {
                innerSub = subject.subscribe(subscriber);
            }
            return () => {
                refCount--;
                innerSub.unsubscribe();
                if (subscription && refCount === 0 && (isComplete || hasError)) {
                    subscription.unsubscribe();
                }
            };
        });
    };
}
/**
 * Simple scheduler. Should be the base of all registries and schedulers.
 */
class SimpleScheduler {
    constructor(_jobRegistry, _schemaRegistry = new core_1.schema.CoreSchemaRegistry()) {
        this._jobRegistry = _jobRegistry;
        this._schemaRegistry = _schemaRegistry;
        this._internalJobDescriptionMap = new Map();
        this._queue = [];
        this._pauseCounter = 0;
    }
    _getInternalDescription(name) {
        const maybeHandler = this._internalJobDescriptionMap.get(name);
        if (maybeHandler !== undefined) {
            return (0, rxjs_1.of)(maybeHandler);
        }
        const handler = this._jobRegistry.get(name);
        return handler.pipe((0, rxjs_1.switchMap)((handler) => {
            if (handler === null) {
                return (0, rxjs_1.of)(null);
            }
            const description = {
                // Make a copy of it to be sure it's proper JSON.
                ...JSON.parse(JSON.stringify(handler.jobDescription)),
                name: handler.jobDescription.name || name,
                argument: handler.jobDescription.argument || true,
                input: handler.jobDescription.input || true,
                output: handler.jobDescription.output || true,
                channels: handler.jobDescription.channels || {},
            };
            const handlerWithExtra = Object.assign(handler.bind(undefined), {
                jobDescription: description,
                argumentV: this._schemaRegistry.compile(description.argument),
                inputV: this._schemaRegistry.compile(description.input),
                outputV: this._schemaRegistry.compile(description.output),
            });
            this._internalJobDescriptionMap.set(name, handlerWithExtra);
            return (0, rxjs_1.of)(handlerWithExtra);
        }));
    }
    /**
     * Get a job description for a named job.
     *
     * @param name The name of the job.
     * @returns A description, or null if the job is not registered.
     */
    getDescription(name) {
        return (0, rxjs_1.concat)(this._getInternalDescription(name).pipe((0, rxjs_1.map)((x) => x && x.jobDescription)), (0, rxjs_1.of)(null)).pipe((0, rxjs_1.first)());
    }
    /**
     * Returns true if the job name has been registered.
     * @param name The name of the job.
     * @returns True if the job exists, false otherwise.
     */
    has(name) {
        return this.getDescription(name).pipe((0, rxjs_1.map)((x) => x !== null));
    }
    /**
     * Pause the scheduler, temporary queueing _new_ jobs. Returns a resume function that should be
     * used to resume execution. If multiple `pause()` were called, all their resume functions must
     * be called before the Scheduler actually starts new jobs. Additional calls to the same resume
     * function will have no effect.
     *
     * Jobs already running are NOT paused. This is pausing the scheduler only.
     */
    pause() {
        let called = false;
        this._pauseCounter++;
        return () => {
            if (!called) {
                called = true;
                if (--this._pauseCounter == 0) {
                    // Resume the queue.
                    const q = this._queue;
                    this._queue = [];
                    q.forEach((fn) => fn());
                }
            }
        };
    }
    /**
     * Schedule a job to be run, using its name.
     * @param name The name of job to be run.
     * @param argument The argument to send to the job when starting it.
     * @param options Scheduling options.
     * @returns The Job being run.
     */
    schedule(name, argument, options) {
        if (this._pauseCounter > 0) {
            const waitable = new rxjs_1.Subject();
            this._queue.push(() => waitable.complete());
            return this._scheduleJob(name, argument, options || {}, waitable);
        }
        return this._scheduleJob(name, argument, options || {}, rxjs_1.EMPTY);
    }
    /**
     * Filter messages.
     * @private
     */
    _filterJobOutboundMessages(message, state) {
        switch (message.kind) {
            case api_1.JobOutboundMessageKind.OnReady:
                return state == api_1.JobState.Queued;
            case api_1.JobOutboundMessageKind.Start:
                return state == api_1.JobState.Ready;
            case api_1.JobOutboundMessageKind.End:
                return state == api_1.JobState.Started || state == api_1.JobState.Ready;
        }
        return true;
    }
    /**
     * Return a new state. This is just to simplify the reading of the _createJob method.
     * @private
     */
    _updateState(message, state) {
        switch (message.kind) {
            case api_1.JobOutboundMessageKind.OnReady:
                return api_1.JobState.Ready;
            case api_1.JobOutboundMessageKind.Start:
                return api_1.JobState.Started;
            case api_1.JobOutboundMessageKind.End:
                return api_1.JobState.Ended;
        }
        return state;
    }
    /**
     * Create the job.
     * @private
     */
    // eslint-disable-next-line max-lines-per-function
    _createJob(name, argument, handler, inboundBus, outboundBus) {
        const schemaRegistry = this._schemaRegistry;
        const channelsSubject = new Map();
        const channels = new Map();
        let state = api_1.JobState.Queued;
        let pingId = 0;
        // Create the input channel by having a filter.
        const input = new rxjs_1.Subject();
        input
            .pipe((0, rxjs_1.concatMap)((message) => handler.pipe((0, rxjs_1.switchMap)(async (handler) => {
            if (handler === null) {
                throw new exception_1.JobDoesNotExistException(name);
            }
            const validator = await handler.inputV;
            return validator(message);
        }))), (0, rxjs_1.filter)((result) => result.success), (0, rxjs_1.map)((result) => result.data))
            .subscribe((value) => inboundBus.next({ kind: api_1.JobInboundMessageKind.Input, value }));
        outboundBus = (0, rxjs_1.concat)(outboundBus, 
        // Add an End message at completion. This will be filtered out if the job actually send an
        // End.
        handler.pipe((0, rxjs_1.switchMap)((handler) => {
            if (handler) {
                return (0, rxjs_1.of)({
                    kind: api_1.JobOutboundMessageKind.End,
                    description: handler.jobDescription,
                });
            }
            else {
                return rxjs_1.EMPTY;
            }
        }))).pipe((0, rxjs_1.filter)((message) => this._filterJobOutboundMessages(message, state)), 
        // Update internal logic and Job<> members.
        (0, rxjs_1.tap)((message) => {
            // Update the state.
            state = this._updateState(message, state);
            switch (message.kind) {
                case api_1.JobOutboundMessageKind.ChannelCreate: {
                    const maybeSubject = channelsSubject.get(message.name);
                    // If it doesn't exist or it's closed on the other end.
                    if (!maybeSubject) {
                        const s = new rxjs_1.Subject();
                        channelsSubject.set(message.name, s);
                        channels.set(message.name, s.asObservable());
                    }
                    break;
                }
                case api_1.JobOutboundMessageKind.ChannelMessage: {
                    const maybeSubject = channelsSubject.get(message.name);
                    if (maybeSubject) {
                        maybeSubject.next(message.message);
                    }
                    break;
                }
                case api_1.JobOutboundMessageKind.ChannelComplete: {
                    const maybeSubject = channelsSubject.get(message.name);
                    if (maybeSubject) {
                        maybeSubject.complete();
                        channelsSubject.delete(message.name);
                    }
                    break;
                }
                case api_1.JobOutboundMessageKind.ChannelError: {
                    const maybeSubject = channelsSubject.get(message.name);
                    if (maybeSubject) {
                        maybeSubject.error(message.error);
                        channelsSubject.delete(message.name);
                    }
                    break;
                }
            }
        }, () => {
            state = api_1.JobState.Errored;
        }), 
        // Do output validation (might include default values so this might have side
        // effects). We keep all messages in order.
        (0, rxjs_1.concatMap)((message) => {
            if (message.kind !== api_1.JobOutboundMessageKind.Output) {
                return (0, rxjs_1.of)(message);
            }
            return handler.pipe((0, rxjs_1.switchMap)(async (handler) => {
                if (handler === null) {
                    throw new exception_1.JobDoesNotExistException(name);
                }
                const validate = await handler.outputV;
                const output = await validate(message.value);
                if (!output.success) {
                    throw new JobOutputSchemaValidationError(output.errors);
                }
                return {
                    ...message,
                    output: output.data,
                };
            }));
        }), _jobShare());
        const output = outboundBus.pipe((0, rxjs_1.filter)((x) => x.kind == api_1.JobOutboundMessageKind.Output), (0, rxjs_1.map)((x) => x.value), (0, rxjs_1.shareReplay)(1));
        // Return the Job.
        return {
            get state() {
                return state;
            },
            argument,
            description: handler.pipe((0, rxjs_1.switchMap)((handler) => {
                if (handler === null) {
                    throw new exception_1.JobDoesNotExistException(name);
                }
                else {
                    return (0, rxjs_1.of)(handler.jobDescription);
                }
            })),
            output,
            getChannel(name, schema = true) {
                let maybeObservable = channels.get(name);
                if (!maybeObservable) {
                    const s = new rxjs_1.Subject();
                    channelsSubject.set(name, s);
                    channels.set(name, s.asObservable());
                    maybeObservable = s.asObservable();
                }
                return maybeObservable.pipe(
                // Keep the order of messages.
                (0, rxjs_1.concatMap)((message) => {
                    return (0, rxjs_1.from)(schemaRegistry.compile(schema)).pipe((0, rxjs_1.switchMap)((validate) => validate(message)), (0, rxjs_1.filter)((x) => x.success), (0, rxjs_1.map)((x) => x.data));
                }));
            },
            ping() {
                const id = pingId++;
                inboundBus.next({ kind: api_1.JobInboundMessageKind.Ping, id });
                return outboundBus.pipe((0, rxjs_1.filter)((x) => x.kind === api_1.JobOutboundMessageKind.Pong && x.id == id), (0, rxjs_1.first)(), (0, rxjs_1.ignoreElements)());
            },
            stop() {
                inboundBus.next({ kind: api_1.JobInboundMessageKind.Stop });
            },
            input,
            inboundBus,
            outboundBus,
        };
    }
    _scheduleJob(name, argument, options, waitable) {
        // Get handler first, since this can error out if there's no handler for the job name.
        const handler = this._getInternalDescription(name);
        const optionsDeps = (options && options.dependencies) || [];
        const dependencies = Array.isArray(optionsDeps) ? optionsDeps : [optionsDeps];
        const inboundBus = new rxjs_1.Subject();
        const outboundBus = (0, rxjs_1.concat)(
        // Wait for dependencies, make sure to not report messages from dependencies. Subscribe to
        // all dependencies at the same time so they run concurrently.
        (0, rxjs_1.merge)(...dependencies.map((x) => x.outboundBus)).pipe((0, rxjs_1.ignoreElements)()), 
        // Wait for pause() to clear (if necessary).
        waitable, (0, rxjs_1.from)(handler).pipe((0, rxjs_1.switchMap)((handler) => new rxjs_1.Observable((subscriber) => {
            if (!handler) {
                throw new exception_1.JobDoesNotExistException(name);
            }
            // Validate the argument.
            return (0, rxjs_1.from)(handler.argumentV)
                .pipe((0, rxjs_1.switchMap)((validate) => validate(argument)), (0, rxjs_1.switchMap)((output) => {
                if (!output.success) {
                    throw new JobArgumentSchemaValidationError(output.errors);
                }
                const argument = output.data;
                const description = handler.jobDescription;
                subscriber.next({ kind: api_1.JobOutboundMessageKind.OnReady, description });
                const context = {
                    description,
                    dependencies: [...dependencies],
                    inboundBus: inboundBus.asObservable(),
                    scheduler: this,
                };
                return handler(argument, context);
            }))
                .subscribe(subscriber);
        }))));
        return this._createJob(name, argument, handler, inboundBus, outboundBus);
    }
}
exports.SimpleScheduler = SimpleScheduler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlLXNjaGVkdWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2FyY2hpdGVjdC9zcmMvam9icy9zaW1wbGUtc2NoZWR1bGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUF5RDtBQUN6RCwrQkFtQmM7QUFDZCwrQkFjZTtBQUNmLDJDQUF1RDtBQUV2RCxNQUFhLGdDQUFpQyxTQUFRLGFBQU0sQ0FBQyx5QkFBeUI7SUFDcEYsWUFBWSxNQUFzQztRQUNoRCxLQUFLLENBQUMsTUFBTSxFQUFFLDJDQUEyQyxDQUFDLENBQUM7SUFDN0QsQ0FBQztDQUNGO0FBSkQsNEVBSUM7QUFDRCxNQUFhLHNDQUF1QyxTQUFRLGFBQU0sQ0FBQyx5QkFBeUI7SUFDMUYsWUFBWSxNQUFzQztRQUNoRCxLQUFLLENBQUMsTUFBTSxFQUFFLGtEQUFrRCxDQUFDLENBQUM7SUFDcEUsQ0FBQztDQUNGO0FBSkQsd0ZBSUM7QUFDRCxNQUFhLDhCQUErQixTQUFRLGFBQU0sQ0FBQyx5QkFBeUI7SUFDbEYsWUFBWSxNQUFzQztRQUNoRCxLQUFLLENBQUMsTUFBTSxFQUFFLHlDQUF5QyxDQUFDLENBQUM7SUFDM0QsQ0FBQztDQUNGO0FBSkQsd0VBSUM7QUFVRCxTQUFTLFNBQVM7SUFDaEIsK0ZBQStGO0lBQy9GLGlCQUFpQjtJQUNqQixPQUFPLENBQUMsTUFBcUIsRUFBaUIsRUFBRTtRQUM5QyxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFDakIsSUFBSSxPQUFtQixDQUFDO1FBQ3hCLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQztRQUNyQixJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxZQUEwQixDQUFDO1FBRS9CLE9BQU8sSUFBSSxpQkFBVSxDQUFJLENBQUMsVUFBVSxFQUFFLEVBQUU7WUFDdEMsSUFBSSxRQUFz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dCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgSnNvblZhbHVlLCBzY2hlbWEgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1xuICBFTVBUWSxcbiAgTW9ub1R5cGVPcGVyYXRvckZ1bmN0aW9uLFxuICBPYnNlcnZhYmxlLFxuICBPYnNlcnZlcixcbiAgU3ViamVjdCxcbiAgU3Vic2NyaXB0aW9uLFxuICBjb25jYXQsXG4gIGNvbmNhdE1hcCxcbiAgZmlsdGVyLFxuICBmaXJzdCxcbiAgZnJvbSxcbiAgaWdub3JlRWxlbWVudHMsXG4gIG1hcCxcbiAgbWVyZ2UsXG4gIG9mLFxuICBzaGFyZVJlcGxheSxcbiAgc3dpdGNoTWFwLFxuICB0YXAsXG59IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtcbiAgSm9iLFxuICBKb2JEZXNjcmlwdGlvbixcbiAgSm9iSGFuZGxlcixcbiAgSm9iSW5ib3VuZE1lc3NhZ2UsXG4gIEpvYkluYm91bmRNZXNzYWdlS2luZCxcbiAgSm9iTmFtZSxcbiAgSm9iT3V0Ym91bmRNZXNzYWdlLFxuICBKb2JPdXRib3VuZE1lc3NhZ2VLaW5kLFxuICBKb2JPdXRib3VuZE1lc3NhZ2VPdXRwdXQsXG4gIEpvYlN0YXRlLFxuICBSZWdpc3RyeSxcbiAgU2NoZWR1bGVKb2JPcHRpb25zLFxuICBTY2hlZHVsZXIsXG59IGZyb20gJy4vYXBpJztcbmltcG9ydCB7IEpvYkRvZXNOb3RFeGlzdEV4Y2VwdGlvbiB9IGZyb20gJy4vZXhjZXB0aW9uJztcblxuZXhwb3J0IGNsYXNzIEpvYkFyZ3VtZW50U2NoZW1hVmFsaWRhdGlvbkVycm9yIGV4dGVuZHMgc2NoZW1hLlNjaGVtYVZhbGlkYXRpb25FeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihlcnJvcnM/OiBzY2hlbWEuU2NoZW1hVmFsaWRhdG9yRXJyb3JbXSkge1xuICAgIHN1cGVyKGVycm9ycywgJ0pvYiBBcmd1bWVudCBmYWlsZWQgdG8gdmFsaWRhdGUuIEVycm9yczogJyk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBKb2JJbmJvdW5kTWVzc2FnZVNjaGVtYVZhbGlkYXRpb25FcnJvciBleHRlbmRzIHNjaGVtYS5TY2hlbWFWYWxpZGF0aW9uRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IoZXJyb3JzPzogc2NoZW1hLlNjaGVtYVZhbGlkYXRvckVycm9yW10pIHtcbiAgICBzdXBlcihlcnJvcnMsICdKb2IgSW5ib3VuZCBNZXNzYWdlIGZhaWxlZCB0byB2YWxpZGF0ZS4gRXJyb3JzOiAnKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEpvYk91dHB1dFNjaGVtYVZhbGlkYXRpb25FcnJvciBleHRlbmRzIHNjaGVtYS5TY2hlbWFWYWxpZGF0aW9uRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IoZXJyb3JzPzogc2NoZW1hLlNjaGVtYVZhbGlkYXRvckVycm9yW10pIHtcbiAgICBzdXBlcihlcnJvcnMsICdKb2IgT3V0cHV0IGZhaWxlZCB0byB2YWxpZGF0ZS4gRXJyb3JzOiAnKTtcbiAgfVxufVxuXG5pbnRlcmZhY2UgSm9iSGFuZGxlcldpdGhFeHRyYSBleHRlbmRzIEpvYkhhbmRsZXI8SnNvblZhbHVlLCBKc29uVmFsdWUsIEpzb25WYWx1ZT4ge1xuICBqb2JEZXNjcmlwdGlvbjogSm9iRGVzY3JpcHRpb247XG5cbiAgYXJndW1lbnRWOiBQcm9taXNlPHNjaGVtYS5TY2hlbWFWYWxpZGF0b3I+O1xuICBvdXRwdXRWOiBQcm9taXNlPHNjaGVtYS5TY2hlbWFWYWxpZGF0b3I+O1xuICBpbnB1dFY6IFByb21pc2U8c2NoZW1hLlNjaGVtYVZhbGlkYXRvcj47XG59XG5cbmZ1bmN0aW9uIF9qb2JTaGFyZTxUPigpOiBNb25vVHlwZU9wZXJhdG9yRnVuY3Rpb248VD4ge1xuICAvLyBUaGlzIGlzIHRoZSBzYW1lIGNvZGUgYXMgYSBgc2hhcmVSZXBsYXkoKWAgb3BlcmF0b3IsIGJ1dCB1c2VzIGEgZHVtYmVyIFN1YmplY3QgcmF0aGVyIHRoYW4gYVxuICAvLyBSZXBsYXlTdWJqZWN0LlxuICByZXR1cm4gKHNvdXJjZTogT2JzZXJ2YWJsZTxUPik6IE9ic2VydmFibGU8VD4gPT4ge1xuICAgIGxldCByZWZDb3VudCA9IDA7XG4gICAgbGV0IHN1YmplY3Q6IFN1YmplY3Q8VD47XG4gICAgbGV0IGhhc0Vycm9yID0gZmFsc2U7XG4gICAgbGV0IGlzQ29tcGxldGUgPSBmYWxzZTtcbiAgICBsZXQgc3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG5cbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGU8VD4oKHN1YnNjcmliZXIpID0+IHtcbiAgICAgIGxldCBpbm5lclN1YjogU3Vic2NyaXB0aW9uO1xuICAgICAgcmVmQ291bnQrKztcbiAgICAgIGlmICghc3ViamVjdCkge1xuICAgICAgICBzdWJqZWN0ID0gbmV3IFN1YmplY3Q8VD4oKTtcblxuICAgICAgICBpbm5lclN1YiA9IHN1YmplY3Quc3Vic2NyaWJlKHN1YnNjcmliZXIpO1xuICAgICAgICBzdWJzY3JpcHRpb24gPSBzb3VyY2Uuc3Vic2NyaWJlKHtcbiAgICAgICAgICBuZXh0KHZhbHVlKSB7XG4gICAgICAgICAgICBzdWJqZWN0Lm5leHQodmFsdWUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZXJyb3IoZXJyKSB7XG4gICAgICAgICAgICBoYXNFcnJvciA9IHRydWU7XG4gICAgICAgICAgICBzdWJqZWN0LmVycm9yKGVycik7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb21wbGV0ZSgpIHtcbiAgICAgICAgICAgIGlzQ29tcGxldGUgPSB0cnVlO1xuICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5uZXJTdWIgPSBzdWJqZWN0LnN1YnNjcmliZShzdWJzY3JpYmVyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgcmVmQ291bnQtLTtcbiAgICAgICAgaW5uZXJTdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgaWYgKHN1YnNjcmlwdGlvbiAmJiByZWZDb3VudCA9PT0gMCAmJiAoaXNDb21wbGV0ZSB8fCBoYXNFcnJvcikpIHtcbiAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcbn1cblxuLyoqXG4gKiBTaW1wbGUgc2NoZWR1bGVyLiBTaG91bGQgYmUgdGhlIGJhc2Ugb2YgYWxsIHJlZ2lzdHJpZXMgYW5kIHNjaGVkdWxlcnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBTaW1wbGVTY2hlZHVsZXI8XG4gIE1pbmltdW1Bcmd1bWVudFQgZXh0ZW5kcyBKc29uVmFsdWUgPSBKc29uVmFsdWUsXG4gIE1pbmltdW1JbnB1dFQgZXh0ZW5kcyBKc29uVmFsdWUgPSBKc29uVmFsdWUsXG4gIE1pbmltdW1PdXRwdXRUIGV4dGVuZHMgSnNvblZhbHVlID0gSnNvblZhbHVlLFxuPiBpbXBsZW1lbnRzIFNjaGVkdWxlcjxNaW5pbXVtQXJndW1lbnRULCBNaW5pbXVtSW5wdXRULCBNaW5pbXVtT3V0cHV0VD5cbntcbiAgcHJpdmF0ZSBfaW50ZXJuYWxKb2JEZXNjcmlwdGlvbk1hcCA9IG5ldyBNYXA8Sm9iTmFtZSwgSm9iSGFuZGxlcldpdGhFeHRyYT4oKTtcbiAgcHJpdmF0ZSBfcXVldWU6ICgoKSA9PiB2b2lkKVtdID0gW107XG4gIHByaXZhdGUgX3BhdXNlQ291bnRlciA9IDA7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJvdGVjdGVkIF9qb2JSZWdpc3RyeTogUmVnaXN0cnk8TWluaW11bUFyZ3VtZW50VCwgTWluaW11bUlucHV0VCwgTWluaW11bU91dHB1dFQ+LFxuICAgIHByb3RlY3RlZCBfc2NoZW1hUmVnaXN0cnk6IHNjaGVtYS5TY2hlbWFSZWdpc3RyeSA9IG5ldyBzY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5KCksXG4gICkge31cblxuICBwcml2YXRlIF9nZXRJbnRlcm5hbERlc2NyaXB0aW9uKG5hbWU6IEpvYk5hbWUpOiBPYnNlcnZhYmxlPEpvYkhhbmRsZXJXaXRoRXh0cmEgfCBudWxsPiB7XG4gICAgY29uc3QgbWF5YmVIYW5kbGVyID0gdGhpcy5faW50ZXJuYWxKb2JEZXNjcmlwdGlvbk1hcC5nZXQobmFtZSk7XG4gICAgaWYgKG1heWJlSGFuZGxlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gb2YobWF5YmVIYW5kbGVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5fam9iUmVnaXN0cnkuZ2V0PE1pbmltdW1Bcmd1bWVudFQsIE1pbmltdW1JbnB1dFQsIE1pbmltdW1PdXRwdXRUPihuYW1lKTtcblxuICAgIHJldHVybiBoYW5kbGVyLnBpcGUoXG4gICAgICBzd2l0Y2hNYXAoKGhhbmRsZXIpID0+IHtcbiAgICAgICAgaWYgKGhhbmRsZXIgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gb2YobnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZXNjcmlwdGlvbjogSm9iRGVzY3JpcHRpb24gPSB7XG4gICAgICAgICAgLy8gTWFrZSBhIGNvcHkgb2YgaXQgdG8gYmUgc3VyZSBpdCdzIHByb3BlciBKU09OLlxuICAgICAgICAgIC4uLkpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoaGFuZGxlci5qb2JEZXNjcmlwdGlvbikpLFxuICAgICAgICAgIG5hbWU6IGhhbmRsZXIuam9iRGVzY3JpcHRpb24ubmFtZSB8fCBuYW1lLFxuICAgICAgICAgIGFyZ3VtZW50OiBoYW5kbGVyLmpvYkRlc2NyaXB0aW9uLmFyZ3VtZW50IHx8IHRydWUsXG4gICAgICAgICAgaW5wdXQ6IGhhbmRsZXIuam9iRGVzY3JpcHRpb24uaW5wdXQgfHwgdHJ1ZSxcbiAgICAgICAgICBvdXRwdXQ6IGhhbmRsZXIuam9iRGVzY3JpcHRpb24ub3V0cHV0IHx8IHRydWUsXG4gICAgICAgICAgY2hhbm5lbHM6IGhhbmRsZXIuam9iRGVzY3JpcHRpb24uY2hhbm5lbHMgfHwge30sXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgaGFuZGxlcldpdGhFeHRyYSA9IE9iamVjdC5hc3NpZ24oaGFuZGxlci5iaW5kKHVuZGVmaW5lZCksIHtcbiAgICAgICAgICBqb2JEZXNjcmlwdGlvbjogZGVzY3JpcHRpb24sXG4gICAgICAgICAgYXJndW1lbnRWOiB0aGlzLl9zY2hlbWFSZWdpc3RyeS5jb21waWxlKGRlc2NyaXB0aW9uLmFyZ3VtZW50KSxcbiAgICAgICAgICBpbnB1dFY6IHRoaXMuX3NjaGVtYVJlZ2lzdHJ5LmNvbXBpbGUoZGVzY3JpcHRpb24uaW5wdXQpLFxuICAgICAgICAgIG91dHB1dFY6IHRoaXMuX3NjaGVtYVJlZ2lzdHJ5LmNvbXBpbGUoZGVzY3JpcHRpb24ub3V0cHV0KSxcbiAgICAgICAgfSkgYXMgSm9iSGFuZGxlcldpdGhFeHRyYTtcbiAgICAgICAgdGhpcy5faW50ZXJuYWxKb2JEZXNjcmlwdGlvbk1hcC5zZXQobmFtZSwgaGFuZGxlcldpdGhFeHRyYSk7XG5cbiAgICAgICAgcmV0dXJuIG9mKGhhbmRsZXJXaXRoRXh0cmEpO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBqb2IgZGVzY3JpcHRpb24gZm9yIGEgbmFtZWQgam9iLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgam9iLlxuICAgKiBAcmV0dXJucyBBIGRlc2NyaXB0aW9uLCBvciBudWxsIGlmIHRoZSBqb2IgaXMgbm90IHJlZ2lzdGVyZWQuXG4gICAqL1xuICBnZXREZXNjcmlwdGlvbihuYW1lOiBKb2JOYW1lKSB7XG4gICAgcmV0dXJuIGNvbmNhdChcbiAgICAgIHRoaXMuX2dldEludGVybmFsRGVzY3JpcHRpb24obmFtZSkucGlwZShtYXAoKHgpID0+IHggJiYgeC5qb2JEZXNjcmlwdGlvbikpLFxuICAgICAgb2YobnVsbCksXG4gICAgKS5waXBlKGZpcnN0KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgam9iIG5hbWUgaGFzIGJlZW4gcmVnaXN0ZXJlZC5cbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGpvYi5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgam9iIGV4aXN0cywgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cbiAgaGFzKG5hbWU6IEpvYk5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5nZXREZXNjcmlwdGlvbihuYW1lKS5waXBlKG1hcCgoeCkgPT4geCAhPT0gbnVsbCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhdXNlIHRoZSBzY2hlZHVsZXIsIHRlbXBvcmFyeSBxdWV1ZWluZyBfbmV3XyBqb2JzLiBSZXR1cm5zIGEgcmVzdW1lIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIGJlXG4gICAqIHVzZWQgdG8gcmVzdW1lIGV4ZWN1dGlvbi4gSWYgbXVsdGlwbGUgYHBhdXNlKClgIHdlcmUgY2FsbGVkLCBhbGwgdGhlaXIgcmVzdW1lIGZ1bmN0aW9ucyBtdXN0XG4gICAqIGJlIGNhbGxlZCBiZWZvcmUgdGhlIFNjaGVkdWxlciBhY3R1YWxseSBzdGFydHMgbmV3IGpvYnMuIEFkZGl0aW9uYWwgY2FsbHMgdG8gdGhlIHNhbWUgcmVzdW1lXG4gICAqIGZ1bmN0aW9uIHdpbGwgaGF2ZSBubyBlZmZlY3QuXG4gICAqXG4gICAqIEpvYnMgYWxyZWFkeSBydW5uaW5nIGFyZSBOT1QgcGF1c2VkLiBUaGlzIGlzIHBhdXNpbmcgdGhlIHNjaGVkdWxlciBvbmx5LlxuICAgKi9cbiAgcGF1c2UoKSB7XG4gICAgbGV0IGNhbGxlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3BhdXNlQ291bnRlcisrO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGlmICghY2FsbGVkKSB7XG4gICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgIGlmICgtLXRoaXMuX3BhdXNlQ291bnRlciA9PSAwKSB7XG4gICAgICAgICAgLy8gUmVzdW1lIHRoZSBxdWV1ZS5cbiAgICAgICAgICBjb25zdCBxID0gdGhpcy5fcXVldWU7XG4gICAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgICAgICBxLmZvckVhY2goKGZuKSA9PiBmbigpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2NoZWR1bGUgYSBqb2IgdG8gYmUgcnVuLCB1c2luZyBpdHMgbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2Ygam9iIHRvIGJlIHJ1bi5cbiAgICogQHBhcmFtIGFyZ3VtZW50IFRoZSBhcmd1bWVudCB0byBzZW5kIHRvIHRoZSBqb2Igd2hlbiBzdGFydGluZyBpdC5cbiAgICogQHBhcmFtIG9wdGlvbnMgU2NoZWR1bGluZyBvcHRpb25zLlxuICAgKiBAcmV0dXJucyBUaGUgSm9iIGJlaW5nIHJ1bi5cbiAgICovXG4gIHNjaGVkdWxlPEEgZXh0ZW5kcyBNaW5pbXVtQXJndW1lbnRULCBJIGV4dGVuZHMgTWluaW11bUlucHV0VCwgTyBleHRlbmRzIE1pbmltdW1PdXRwdXRUPihcbiAgICBuYW1lOiBKb2JOYW1lLFxuICAgIGFyZ3VtZW50OiBBLFxuICAgIG9wdGlvbnM/OiBTY2hlZHVsZUpvYk9wdGlvbnMsXG4gICk6IEpvYjxBLCBJLCBPPiB7XG4gICAgaWYgKHRoaXMuX3BhdXNlQ291bnRlciA+IDApIHtcbiAgICAgIGNvbnN0IHdhaXRhYmxlID0gbmV3IFN1YmplY3Q8bmV2ZXI+KCk7XG4gICAgICB0aGlzLl9xdWV1ZS5wdXNoKCgpID0+IHdhaXRhYmxlLmNvbXBsZXRlKCkpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fc2NoZWR1bGVKb2I8QSwgSSwgTz4obmFtZSwgYXJndW1lbnQsIG9wdGlvbnMgfHwge30sIHdhaXRhYmxlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fc2NoZWR1bGVKb2I8QSwgSSwgTz4obmFtZSwgYXJndW1lbnQsIG9wdGlvbnMgfHwge30sIEVNUFRZKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWx0ZXIgbWVzc2FnZXMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9maWx0ZXJKb2JPdXRib3VuZE1lc3NhZ2VzPE8gZXh0ZW5kcyBNaW5pbXVtT3V0cHV0VD4oXG4gICAgbWVzc2FnZTogSm9iT3V0Ym91bmRNZXNzYWdlPE8+LFxuICAgIHN0YXRlOiBKb2JTdGF0ZSxcbiAgKSB7XG4gICAgc3dpdGNoIChtZXNzYWdlLmtpbmQpIHtcbiAgICAgIGNhc2UgSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5PblJlYWR5OlxuICAgICAgICByZXR1cm4gc3RhdGUgPT0gSm9iU3RhdGUuUXVldWVkO1xuICAgICAgY2FzZSBKb2JPdXRib3VuZE1lc3NhZ2VLaW5kLlN0YXJ0OlxuICAgICAgICByZXR1cm4gc3RhdGUgPT0gSm9iU3RhdGUuUmVhZHk7XG5cbiAgICAgIGNhc2UgSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5FbmQ6XG4gICAgICAgIHJldHVybiBzdGF0ZSA9PSBKb2JTdGF0ZS5TdGFydGVkIHx8IHN0YXRlID09IEpvYlN0YXRlLlJlYWR5O1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBhIG5ldyBzdGF0ZS4gVGhpcyBpcyBqdXN0IHRvIHNpbXBsaWZ5IHRoZSByZWFkaW5nIG9mIHRoZSBfY3JlYXRlSm9iIG1ldGhvZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX3VwZGF0ZVN0YXRlPE8gZXh0ZW5kcyBNaW5pbXVtT3V0cHV0VD4oXG4gICAgbWVzc2FnZTogSm9iT3V0Ym91bmRNZXNzYWdlPE8+LFxuICAgIHN0YXRlOiBKb2JTdGF0ZSxcbiAgKTogSm9iU3RhdGUge1xuICAgIHN3aXRjaCAobWVzc2FnZS5raW5kKSB7XG4gICAgICBjYXNlIEpvYk91dGJvdW5kTWVzc2FnZUtpbmQuT25SZWFkeTpcbiAgICAgICAgcmV0dXJuIEpvYlN0YXRlLlJlYWR5O1xuICAgICAgY2FzZSBKb2JPdXRib3VuZE1lc3NhZ2VLaW5kLlN0YXJ0OlxuICAgICAgICByZXR1cm4gSm9iU3RhdGUuU3RhcnRlZDtcbiAgICAgIGNhc2UgSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5FbmQ6XG4gICAgICAgIHJldHVybiBKb2JTdGF0ZS5FbmRlZDtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhdGU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIHRoZSBqb2IuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuICBwcml2YXRlIF9jcmVhdGVKb2I8QSBleHRlbmRzIE1pbmltdW1Bcmd1bWVudFQsIEkgZXh0ZW5kcyBNaW5pbXVtSW5wdXRULCBPIGV4dGVuZHMgTWluaW11bU91dHB1dFQ+KFxuICAgIG5hbWU6IEpvYk5hbWUsXG4gICAgYXJndW1lbnQ6IEEsXG4gICAgaGFuZGxlcjogT2JzZXJ2YWJsZTxKb2JIYW5kbGVyV2l0aEV4dHJhIHwgbnVsbD4sXG4gICAgaW5ib3VuZEJ1czogT2JzZXJ2ZXI8Sm9iSW5ib3VuZE1lc3NhZ2U8ST4+LFxuICAgIG91dGJvdW5kQnVzOiBPYnNlcnZhYmxlPEpvYk91dGJvdW5kTWVzc2FnZTxPPj4sXG4gICk6IEpvYjxBLCBJLCBPPiB7XG4gICAgY29uc3Qgc2NoZW1hUmVnaXN0cnkgPSB0aGlzLl9zY2hlbWFSZWdpc3RyeTtcblxuICAgIGNvbnN0IGNoYW5uZWxzU3ViamVjdCA9IG5ldyBNYXA8c3RyaW5nLCBTdWJqZWN0PEpzb25WYWx1ZT4+KCk7XG4gICAgY29uc3QgY2hhbm5lbHMgPSBuZXcgTWFwPHN0cmluZywgT2JzZXJ2YWJsZTxKc29uVmFsdWU+PigpO1xuXG4gICAgbGV0IHN0YXRlID0gSm9iU3RhdGUuUXVldWVkO1xuICAgIGxldCBwaW5nSWQgPSAwO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBpbnB1dCBjaGFubmVsIGJ5IGhhdmluZyBhIGZpbHRlci5cbiAgICBjb25zdCBpbnB1dCA9IG5ldyBTdWJqZWN0PEpzb25WYWx1ZT4oKTtcbiAgICBpbnB1dFxuICAgICAgLnBpcGUoXG4gICAgICAgIGNvbmNhdE1hcCgobWVzc2FnZSkgPT5cbiAgICAgICAgICBoYW5kbGVyLnBpcGUoXG4gICAgICAgICAgICBzd2l0Y2hNYXAoYXN5bmMgKGhhbmRsZXIpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGhhbmRsZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSm9iRG9lc05vdEV4aXN0RXhjZXB0aW9uKG5hbWUpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgdmFsaWRhdG9yID0gYXdhaXQgaGFuZGxlci5pbnB1dFY7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHZhbGlkYXRvcihtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICksXG4gICAgICAgICksXG4gICAgICAgIGZpbHRlcigocmVzdWx0KSA9PiByZXN1bHQuc3VjY2VzcyksXG4gICAgICAgIG1hcCgocmVzdWx0KSA9PiByZXN1bHQuZGF0YSBhcyBJKSxcbiAgICAgIClcbiAgICAgIC5zdWJzY3JpYmUoKHZhbHVlKSA9PiBpbmJvdW5kQnVzLm5leHQoeyBraW5kOiBKb2JJbmJvdW5kTWVzc2FnZUtpbmQuSW5wdXQsIHZhbHVlIH0pKTtcblxuICAgIG91dGJvdW5kQnVzID0gY29uY2F0KFxuICAgICAgb3V0Ym91bmRCdXMsXG4gICAgICAvLyBBZGQgYW4gRW5kIG1lc3NhZ2UgYXQgY29tcGxldGlvbi4gVGhpcyB3aWxsIGJlIGZpbHRlcmVkIG91dCBpZiB0aGUgam9iIGFjdHVhbGx5IHNlbmQgYW5cbiAgICAgIC8vIEVuZC5cbiAgICAgIGhhbmRsZXIucGlwZShcbiAgICAgICAgc3dpdGNoTWFwKChoYW5kbGVyKSA9PiB7XG4gICAgICAgICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBvZjxKb2JPdXRib3VuZE1lc3NhZ2U8Tz4+KHtcbiAgICAgICAgICAgICAga2luZDogSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5FbmQsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBoYW5kbGVyLmpvYkRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBFTVBUWSBhcyBPYnNlcnZhYmxlPEpvYk91dGJvdW5kTWVzc2FnZTxPPj47XG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICksXG4gICAgKS5waXBlKFxuICAgICAgZmlsdGVyKChtZXNzYWdlKSA9PiB0aGlzLl9maWx0ZXJKb2JPdXRib3VuZE1lc3NhZ2VzKG1lc3NhZ2UsIHN0YXRlKSksXG4gICAgICAvLyBVcGRhdGUgaW50ZXJuYWwgbG9naWMgYW5kIEpvYjw+IG1lbWJlcnMuXG4gICAgICB0YXAoXG4gICAgICAgIChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgLy8gVXBkYXRlIHRoZSBzdGF0ZS5cbiAgICAgICAgICBzdGF0ZSA9IHRoaXMuX3VwZGF0ZVN0YXRlKG1lc3NhZ2UsIHN0YXRlKTtcblxuICAgICAgICAgIHN3aXRjaCAobWVzc2FnZS5raW5kKSB7XG4gICAgICAgICAgICBjYXNlIEpvYk91dGJvdW5kTWVzc2FnZUtpbmQuQ2hhbm5lbENyZWF0ZToge1xuICAgICAgICAgICAgICBjb25zdCBtYXliZVN1YmplY3QgPSBjaGFubmVsc1N1YmplY3QuZ2V0KG1lc3NhZ2UubmFtZSk7XG4gICAgICAgICAgICAgIC8vIElmIGl0IGRvZXNuJ3QgZXhpc3Qgb3IgaXQncyBjbG9zZWQgb24gdGhlIG90aGVyIGVuZC5cbiAgICAgICAgICAgICAgaWYgKCFtYXliZVN1YmplY3QpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gbmV3IFN1YmplY3Q8SnNvblZhbHVlPigpO1xuICAgICAgICAgICAgICAgIGNoYW5uZWxzU3ViamVjdC5zZXQobWVzc2FnZS5uYW1lLCBzKTtcbiAgICAgICAgICAgICAgICBjaGFubmVscy5zZXQobWVzc2FnZS5uYW1lLCBzLmFzT2JzZXJ2YWJsZSgpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FzZSBKb2JPdXRib3VuZE1lc3NhZ2VLaW5kLkNoYW5uZWxNZXNzYWdlOiB7XG4gICAgICAgICAgICAgIGNvbnN0IG1heWJlU3ViamVjdCA9IGNoYW5uZWxzU3ViamVjdC5nZXQobWVzc2FnZS5uYW1lKTtcbiAgICAgICAgICAgICAgaWYgKG1heWJlU3ViamVjdCkge1xuICAgICAgICAgICAgICAgIG1heWJlU3ViamVjdC5uZXh0KG1lc3NhZ2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhc2UgSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5DaGFubmVsQ29tcGxldGU6IHtcbiAgICAgICAgICAgICAgY29uc3QgbWF5YmVTdWJqZWN0ID0gY2hhbm5lbHNTdWJqZWN0LmdldChtZXNzYWdlLm5hbWUpO1xuICAgICAgICAgICAgICBpZiAobWF5YmVTdWJqZWN0KSB7XG4gICAgICAgICAgICAgICAgbWF5YmVTdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgY2hhbm5lbHNTdWJqZWN0LmRlbGV0ZShtZXNzYWdlLm5hbWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYXNlIEpvYk91dGJvdW5kTWVzc2FnZUtpbmQuQ2hhbm5lbEVycm9yOiB7XG4gICAgICAgICAgICAgIGNvbnN0IG1heWJlU3ViamVjdCA9IGNoYW5uZWxzU3ViamVjdC5nZXQobWVzc2FnZS5uYW1lKTtcbiAgICAgICAgICAgICAgaWYgKG1heWJlU3ViamVjdCkge1xuICAgICAgICAgICAgICAgIG1heWJlU3ViamVjdC5lcnJvcihtZXNzYWdlLmVycm9yKTtcbiAgICAgICAgICAgICAgICBjaGFubmVsc1N1YmplY3QuZGVsZXRlKG1lc3NhZ2UubmFtZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgc3RhdGUgPSBKb2JTdGF0ZS5FcnJvcmVkO1xuICAgICAgICB9LFxuICAgICAgKSxcblxuICAgICAgLy8gRG8gb3V0cHV0IHZhbGlkYXRpb24gKG1pZ2h0IGluY2x1ZGUgZGVmYXVsdCB2YWx1ZXMgc28gdGhpcyBtaWdodCBoYXZlIHNpZGVcbiAgICAgIC8vIGVmZmVjdHMpLiBXZSBrZWVwIGFsbCBtZXNzYWdlcyBpbiBvcmRlci5cbiAgICAgIGNvbmNhdE1hcCgobWVzc2FnZSkgPT4ge1xuICAgICAgICBpZiAobWVzc2FnZS5raW5kICE9PSBKb2JPdXRib3VuZE1lc3NhZ2VLaW5kLk91dHB1dCkge1xuICAgICAgICAgIHJldHVybiBvZihtZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBoYW5kbGVyLnBpcGUoXG4gICAgICAgICAgc3dpdGNoTWFwKGFzeW5jIChoYW5kbGVyKSA9PiB7XG4gICAgICAgICAgICBpZiAoaGFuZGxlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgSm9iRG9lc05vdEV4aXN0RXhjZXB0aW9uKG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdmFsaWRhdGUgPSBhd2FpdCBoYW5kbGVyLm91dHB1dFY7XG4gICAgICAgICAgICBjb25zdCBvdXRwdXQgPSBhd2FpdCB2YWxpZGF0ZShtZXNzYWdlLnZhbHVlKTtcbiAgICAgICAgICAgIGlmICghb3V0cHV0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEpvYk91dHB1dFNjaGVtYVZhbGlkYXRpb25FcnJvcihvdXRwdXQuZXJyb3JzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgLi4ubWVzc2FnZSxcbiAgICAgICAgICAgICAgb3V0cHV0OiBvdXRwdXQuZGF0YSBhcyBPLFxuICAgICAgICAgICAgfSBhcyBKb2JPdXRib3VuZE1lc3NhZ2VPdXRwdXQ8Tz47XG4gICAgICAgICAgfSksXG4gICAgICAgICkgYXMgT2JzZXJ2YWJsZTxKb2JPdXRib3VuZE1lc3NhZ2U8Tz4+O1xuICAgICAgfSksXG4gICAgICBfam9iU2hhcmUoKSxcbiAgICApO1xuXG4gICAgY29uc3Qgb3V0cHV0ID0gb3V0Ym91bmRCdXMucGlwZShcbiAgICAgIGZpbHRlcigoeCkgPT4geC5raW5kID09IEpvYk91dGJvdW5kTWVzc2FnZUtpbmQuT3V0cHV0KSxcbiAgICAgIG1hcCgoeCkgPT4gKHggYXMgSm9iT3V0Ym91bmRNZXNzYWdlT3V0cHV0PE8+KS52YWx1ZSksXG4gICAgICBzaGFyZVJlcGxheSgxKSxcbiAgICApO1xuXG4gICAgLy8gUmV0dXJuIHRoZSBKb2IuXG4gICAgcmV0dXJuIHtcbiAgICAgIGdldCBzdGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgfSxcbiAgICAgIGFyZ3VtZW50LFxuICAgICAgZGVzY3JpcHRpb246IGhhbmRsZXIucGlwZShcbiAgICAgICAgc3dpdGNoTWFwKChoYW5kbGVyKSA9PiB7XG4gICAgICAgICAgaWYgKGhhbmRsZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBKb2JEb2VzTm90RXhpc3RFeGNlcHRpb24obmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBvZihoYW5kbGVyLmpvYkRlc2NyaXB0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgKSxcbiAgICAgIG91dHB1dCxcbiAgICAgIGdldENoYW5uZWw8VCBleHRlbmRzIEpzb25WYWx1ZT4oXG4gICAgICAgIG5hbWU6IEpvYk5hbWUsXG4gICAgICAgIHNjaGVtYTogc2NoZW1hLkpzb25TY2hlbWEgPSB0cnVlLFxuICAgICAgKTogT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIGxldCBtYXliZU9ic2VydmFibGUgPSBjaGFubmVscy5nZXQobmFtZSk7XG4gICAgICAgIGlmICghbWF5YmVPYnNlcnZhYmxlKSB7XG4gICAgICAgICAgY29uc3QgcyA9IG5ldyBTdWJqZWN0PFQ+KCk7XG4gICAgICAgICAgY2hhbm5lbHNTdWJqZWN0LnNldChuYW1lLCBzIGFzIHVua25vd24gYXMgU3ViamVjdDxKc29uVmFsdWU+KTtcbiAgICAgICAgICBjaGFubmVscy5zZXQobmFtZSwgcy5hc09ic2VydmFibGUoKSk7XG5cbiAgICAgICAgICBtYXliZU9ic2VydmFibGUgPSBzLmFzT2JzZXJ2YWJsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1heWJlT2JzZXJ2YWJsZS5waXBlKFxuICAgICAgICAgIC8vIEtlZXAgdGhlIG9yZGVyIG9mIG1lc3NhZ2VzLlxuICAgICAgICAgIGNvbmNhdE1hcCgobWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGZyb20oc2NoZW1hUmVnaXN0cnkuY29tcGlsZShzY2hlbWEpKS5waXBlKFxuICAgICAgICAgICAgICBzd2l0Y2hNYXAoKHZhbGlkYXRlKSA9PiB2YWxpZGF0ZShtZXNzYWdlKSksXG4gICAgICAgICAgICAgIGZpbHRlcigoeCkgPT4geC5zdWNjZXNzKSxcbiAgICAgICAgICAgICAgbWFwKCh4KSA9PiB4LmRhdGEgYXMgVCksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgfSxcbiAgICAgIHBpbmcoKSB7XG4gICAgICAgIGNvbnN0IGlkID0gcGluZ0lkKys7XG4gICAgICAgIGluYm91bmRCdXMubmV4dCh7IGtpbmQ6IEpvYkluYm91bmRNZXNzYWdlS2luZC5QaW5nLCBpZCB9KTtcblxuICAgICAgICByZXR1cm4gb3V0Ym91bmRCdXMucGlwZShcbiAgICAgICAgICBmaWx0ZXIoKHgpID0+IHgua2luZCA9PT0gSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5Qb25nICYmIHguaWQgPT0gaWQpLFxuICAgICAgICAgIGZpcnN0KCksXG4gICAgICAgICAgaWdub3JlRWxlbWVudHMoKSxcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgICBzdG9wKCkge1xuICAgICAgICBpbmJvdW5kQnVzLm5leHQoeyBraW5kOiBKb2JJbmJvdW5kTWVzc2FnZUtpbmQuU3RvcCB9KTtcbiAgICAgIH0sXG4gICAgICBpbnB1dCxcbiAgICAgIGluYm91bmRCdXMsXG4gICAgICBvdXRib3VuZEJ1cyxcbiAgICB9O1xuICB9XG5cbiAgcHJvdGVjdGVkIF9zY2hlZHVsZUpvYjxcbiAgICBBIGV4dGVuZHMgTWluaW11bUFyZ3VtZW50VCxcbiAgICBJIGV4dGVuZHMgTWluaW11bUlucHV0VCxcbiAgICBPIGV4dGVuZHMgTWluaW11bU91dHB1dFQsXG4gID4oXG4gICAgbmFtZTogSm9iTmFtZSxcbiAgICBhcmd1bWVudDogQSxcbiAgICBvcHRpb25zOiBTY2hlZHVsZUpvYk9wdGlvbnMsXG4gICAgd2FpdGFibGU6IE9ic2VydmFibGU8bmV2ZXI+LFxuICApOiBKb2I8QSwgSSwgTz4ge1xuICAgIC8vIEdldCBoYW5kbGVyIGZpcnN0LCBzaW5jZSB0aGlzIGNhbiBlcnJvciBvdXQgaWYgdGhlcmUncyBubyBoYW5kbGVyIGZvciB0aGUgam9iIG5hbWUuXG4gICAgY29uc3QgaGFuZGxlciA9IHRoaXMuX2dldEludGVybmFsRGVzY3JpcHRpb24obmFtZSk7XG5cbiAgICBjb25zdCBvcHRpb25zRGVwcyA9IChvcHRpb25zICYmIG9wdGlvbnMuZGVwZW5kZW5jaWVzKSB8fCBbXTtcbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBBcnJheS5pc0FycmF5KG9wdGlvbnNEZXBzKSA/IG9wdGlvbnNEZXBzIDogW29wdGlvbnNEZXBzXTtcblxuICAgIGNvbnN0IGluYm91bmRCdXMgPSBuZXcgU3ViamVjdDxKb2JJbmJvdW5kTWVzc2FnZTxJPj4oKTtcbiAgICBjb25zdCBvdXRib3VuZEJ1cyA9IGNvbmNhdChcbiAgICAgIC8vIFdhaXQgZm9yIGRlcGVuZGVuY2llcywgbWFrZSBzdXJlIHRvIG5vdCByZXBvcnQgbWVzc2FnZXMgZnJvbSBkZXBlbmRlbmNpZXMuIFN1YnNjcmliZSB0b1xuICAgICAgLy8gYWxsIGRlcGVuZGVuY2llcyBhdCB0aGUgc2FtZSB0aW1lIHNvIHRoZXkgcnVuIGNvbmN1cnJlbnRseS5cbiAgICAgIG1lcmdlKC4uLmRlcGVuZGVuY2llcy5tYXAoKHgpID0+IHgub3V0Ym91bmRCdXMpKS5waXBlKGlnbm9yZUVsZW1lbnRzKCkpLFxuXG4gICAgICAvLyBXYWl0IGZvciBwYXVzZSgpIHRvIGNsZWFyIChpZiBuZWNlc3NhcnkpLlxuICAgICAgd2FpdGFibGUsXG5cbiAgICAgIGZyb20oaGFuZGxlcikucGlwZShcbiAgICAgICAgc3dpdGNoTWFwKFxuICAgICAgICAgIChoYW5kbGVyKSA9PlxuICAgICAgICAgICAgbmV3IE9ic2VydmFibGU8Sm9iT3V0Ym91bmRNZXNzYWdlPE8+Pigoc3Vic2NyaWJlcjogT2JzZXJ2ZXI8Sm9iT3V0Ym91bmRNZXNzYWdlPE8+PikgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSm9iRG9lc05vdEV4aXN0RXhjZXB0aW9uKG5hbWUpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gVmFsaWRhdGUgdGhlIGFyZ3VtZW50LlxuICAgICAgICAgICAgICByZXR1cm4gZnJvbShoYW5kbGVyLmFyZ3VtZW50VilcbiAgICAgICAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgICAgICAgIHN3aXRjaE1hcCgodmFsaWRhdGUpID0+IHZhbGlkYXRlKGFyZ3VtZW50KSksXG4gICAgICAgICAgICAgICAgICBzd2l0Y2hNYXAoKG91dHB1dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW91dHB1dC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEpvYkFyZ3VtZW50U2NoZW1hVmFsaWRhdGlvbkVycm9yKG91dHB1dC5lcnJvcnMpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJndW1lbnQ6IEEgPSBvdXRwdXQuZGF0YSBhcyBBO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IGhhbmRsZXIuam9iRGVzY3JpcHRpb247XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXIubmV4dCh7IGtpbmQ6IEpvYk91dGJvdW5kTWVzc2FnZUtpbmQuT25SZWFkeSwgZGVzY3JpcHRpb24gfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IFsuLi5kZXBlbmRlbmNpZXNdLFxuICAgICAgICAgICAgICAgICAgICAgIGluYm91bmRCdXM6IGluYm91bmRCdXMuYXNPYnNlcnZhYmxlKCksXG4gICAgICAgICAgICAgICAgICAgICAgc2NoZWR1bGVyOiB0aGlzIGFzIFNjaGVkdWxlcjxNaW5pbXVtQXJndW1lbnRULCBNaW5pbXVtSW5wdXRULCBNaW5pbXVtT3V0cHV0VD4sXG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIoYXJndW1lbnQsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoc3Vic2NyaWJlciBhcyBPYnNlcnZlcjxKb2JPdXRib3VuZE1lc3NhZ2U8SnNvblZhbHVlPj4pO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICksXG4gICAgICApLFxuICAgICk7XG5cbiAgICByZXR1cm4gdGhpcy5fY3JlYXRlSm9iKG5hbWUsIGFyZ3VtZW50LCBoYW5kbGVyLCBpbmJvdW5kQnVzLCBvdXRib3VuZEJ1cyk7XG4gIH1cbn1cbiJdfQ==