"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBuilder = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const api_1 = require("./api");
const internal_1 = require("./internal");
const jobs_1 = require("./jobs");
const schedule_by_name_1 = require("./schedule-by-name");
// eslint-disable-next-line max-lines-per-function
function createBuilder(fn) {
    const cjh = jobs_1.createJobHandler;
    // eslint-disable-next-line max-lines-per-function
    const handler = cjh((options, context) => {
        const scheduler = context.scheduler;
        const progressChannel = context.createChannel('progress');
        const logChannel = context.createChannel('log');
        const addTeardown = context.addTeardown.bind(context);
        let currentState = api_1.BuilderProgressState.Stopped;
        let current = 0;
        let status = '';
        let total = 1;
        function log(entry) {
            logChannel.next(entry);
        }
        function progress(progress, context) {
            currentState = progress.state;
            if (progress.state === api_1.BuilderProgressState.Running) {
                current = progress.current;
                total = progress.total !== undefined ? progress.total : total;
                if (progress.status === undefined) {
                    progress.status = status;
                }
                else {
                    status = progress.status;
                }
            }
            progressChannel.next({
                ...progress,
                ...(context.target && { target: context.target }),
                ...(context.builder && { builder: context.builder }),
                id: context.id,
            });
        }
        return new rxjs_1.Observable((observer) => {
            const subscriptions = [];
            const inputSubscription = context.inboundBus.subscribe((i) => {
                switch (i.kind) {
                    case jobs_1.JobInboundMessageKind.Input:
                        onInput(i.value);
                        break;
                }
            });
            function onInput(i) {
                const builder = i.info;
                const loggerName = i.target
                    ? (0, api_1.targetStringFromTarget)(i.target)
                    : builder.builderName;
                const logger = new core_1.logging.Logger(loggerName);
                subscriptions.push(logger.subscribe((entry) => log(entry)));
                const context = {
                    builder,
                    workspaceRoot: i.workspaceRoot,
                    currentDirectory: i.currentDirectory,
                    target: i.target,
                    logger: logger,
                    id: i.id,
                    async scheduleTarget(target, overrides = {}, scheduleOptions = {}) {
                        const run = await (0, schedule_by_name_1.scheduleByTarget)(target, overrides, {
                            scheduler,
                            logger: scheduleOptions.logger || logger.createChild(''),
                            workspaceRoot: i.workspaceRoot,
                            currentDirectory: i.currentDirectory,
                        });
                        // We don't want to subscribe errors and complete.
                        subscriptions.push(run.progress.subscribe((event) => progressChannel.next(event)));
                        return run;
                    },
                    async scheduleBuilder(builderName, options = {}, scheduleOptions = {}) {
                        const run = await (0, schedule_by_name_1.scheduleByName)(builderName, options, {
                            scheduler,
                            target: scheduleOptions.target,
                            logger: scheduleOptions.logger || logger.createChild(''),
                            workspaceRoot: i.workspaceRoot,
                            currentDirectory: i.currentDirectory,
                        });
                        // We don't want to subscribe errors and complete.
                        subscriptions.push(run.progress.subscribe((event) => progressChannel.next(event)));
                        return run;
                    },
                    async getTargetOptions(target) {
                        return (0, rxjs_1.firstValueFrom)(scheduler.schedule('..getTargetOptions', target).output);
                    },
                    async getProjectMetadata(target) {
                        return (0, rxjs_1.firstValueFrom)(scheduler.schedule('..getProjectMetadata', target).output);
                    },
                    async getBuilderNameForTarget(target) {
                        return (0, rxjs_1.firstValueFrom)(scheduler.schedule('..getBuilderNameForTarget', target).output);
                    },
                    async validateOptions(options, builderName) {
                        return (0, rxjs_1.firstValueFrom)(scheduler.schedule('..validateOptions', [builderName, options]).output);
                    },
                    reportRunning() {
                        switch (currentState) {
                            case api_1.BuilderProgressState.Waiting:
                            case api_1.BuilderProgressState.Stopped:
                                progress({ state: api_1.BuilderProgressState.Running, current: 0, total }, context);
                                break;
                        }
                    },
                    reportStatus(status) {
                        switch (currentState) {
                            case api_1.BuilderProgressState.Running:
                                progress({ state: currentState, status, current, total }, context);
                                break;
                            case api_1.BuilderProgressState.Waiting:
                                progress({ state: currentState, status }, context);
                                break;
                        }
                    },
                    reportProgress(current, total, status) {
                        switch (currentState) {
                            case api_1.BuilderProgressState.Running:
                                progress({ state: currentState, current, total, status }, context);
                        }
                    },
                    addTeardown,
                };
                context.reportRunning();
                let result;
                try {
                    result = fn(i.options, context);
                    if ((0, api_1.isBuilderOutput)(result)) {
                        result = (0, rxjs_1.of)(result);
                    }
                    else if (!(0, rxjs_1.isObservable)(result) && isAsyncIterable(result)) {
                        result = (0, api_1.fromAsyncIterable)(result);
                    }
                    else {
                        result = (0, rxjs_1.from)(result);
                    }
                }
                catch (e) {
                    result = (0, rxjs_1.throwError)(e);
                }
                // Manage some state automatically.
                progress({ state: api_1.BuilderProgressState.Running, current: 0, total: 1 }, context);
                subscriptions.push(result
                    .pipe((0, rxjs_1.defaultIfEmpty)({ success: false }), (0, rxjs_1.tap)(() => {
                    progress({ state: api_1.BuilderProgressState.Running, current: total }, context);
                    progress({ state: api_1.BuilderProgressState.Stopped }, context);
                }), (0, rxjs_1.mergeMap)(async (value) => {
                    // Allow the log queue to flush
                    await new Promise(setImmediate);
                    return value;
                }))
                    .subscribe((message) => observer.next(message), (error) => observer.error(error), () => observer.complete()));
            }
            return () => {
                subscriptions.forEach((x) => x.unsubscribe());
                inputSubscription.unsubscribe();
            };
        });
    });
    return {
        handler,
        [internal_1.BuilderSymbol]: true,
        [internal_1.BuilderVersionSymbol]: require('../package.json').version,
    };
}
exports.createBuilder = createBuilder;
function isAsyncIterable(obj) {
    return !!obj && typeof obj[Symbol.asyncIterator] === 'function';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWJ1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9hcmNoaXRlY3Qvc3JjL2NyZWF0ZS1idWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUFxRDtBQUNyRCwrQkFXYztBQUNkLCtCQWFlO0FBQ2YseUNBQTBFO0FBQzFFLGlDQUFpRTtBQUNqRSx5REFBc0U7QUFFdEUsa0RBQWtEO0FBQ2xELFNBQWdCLGFBQWEsQ0FDM0IsRUFBMEI7SUFFMUIsTUFBTSxHQUFHLEdBQUcsdUJBQWdCLENBQUM7SUFDN0Isa0RBQWtEO0lBQ2xELE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBc0MsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUU7UUFDNUUsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUNwQyxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzFELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEQsSUFBSSxZQUFZLEdBQXlCLDBCQUFvQixDQUFDLE9BQU8sQ0FBQztRQUN0RSxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFDaEIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztRQUVkLFNBQVMsR0FBRyxDQUFDLEtBQXVCO1lBQ2xDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUNELFNBQVMsUUFBUSxDQUFDLFFBQThCLEVBQUUsT0FBdUI7WUFDdkUsWUFBWSxHQUFHLFFB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LEdBQUcsSUFBSSxPQUFRLEdBQXdCLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLFVBQVUsQ0FBQztBQUN4RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGpzb24sIGxvZ2dpbmcgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1xuICBPYnNlcnZhYmxlLFxuICBTdWJzY3JpcHRpb24sXG4gIGRlZmF1bHRJZkVtcHR5LFxuICBmaXJzdFZhbHVlRnJvbSxcbiAgZnJvbSxcbiAgaXNPYnNlcnZhYmxlLFxuICBtZXJnZU1hcCxcbiAgb2YsXG4gIHRhcCxcbiAgdGhyb3dFcnJvcixcbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge1xuICBCdWlsZGVyQ29udGV4dCxcbiAgQnVpbGRlckhhbmRsZXJGbixcbiAgQnVpbGRlckluZm8sXG4gIEJ1aWxkZXJJbnB1dCxcbiAgQnVpbGRlck91dHB1dCxcbiAgQnVpbGRlclByb2dyZXNzU3RhdGUsXG4gIFNjaGVkdWxlT3B0aW9ucyxcbiAgVGFyZ2V0LFxuICBUeXBlZEJ1aWxkZXJQcm9ncmVzcyxcbiAgZnJvbUFzeW5jSXRlcmFibGUsXG4gIGlzQnVpbGRlck91dHB1dCxcbiAgdGFyZ2V0U3RyaW5nRnJvbVRhcmdldCxcbn0gZnJvbSAnLi9hcGknO1xuaW1wb3J0IHsgQnVpbGRlciwgQnVpbGRlclN5bWJvbCwgQnVpbGRlclZlcnNpb25TeW1ib2wgfSBmcm9tICcuL2ludGVybmFsJztcbmltcG9ydCB7IEpvYkluYm91bmRNZXNzYWdlS2luZCwgY3JlYXRlSm9iSGFuZGxlciB9IGZyb20gJy4vam9icyc7XG5pbXBvcnQgeyBzY2hlZHVsZUJ5TmFtZSwgc2NoZWR1bGVCeVRhcmdldCB9IGZyb20gJy4vc2NoZWR1bGUtYnktbmFtZSc7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBtYXgtbGluZXMtcGVyLWZ1bmN0aW9uXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQnVpbGRlcjxPcHRUID0ganNvbi5Kc29uT2JqZWN0LCBPdXRUIGV4dGVuZHMgQnVpbGRlck91dHB1dCA9IEJ1aWxkZXJPdXRwdXQ+KFxuICBmbjogQnVpbGRlckhhbmRsZXJGbjxPcHRUPixcbik6IEJ1aWxkZXI8T3B0VCAmIGpzb24uSnNvbk9iamVjdD4ge1xuICBjb25zdCBjamggPSBjcmVhdGVKb2JIYW5kbGVyO1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuICBjb25zdCBoYW5kbGVyID0gY2poPGpzb24uSnNvbk9iamVjdCwgQnVpbGRlcklucHV0LCBPdXRUPigob3B0aW9ucywgY29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHNjaGVkdWxlciA9IGNvbnRleHQuc2NoZWR1bGVyO1xuICAgIGNvbnN0IHByb2dyZXNzQ2hhbm5lbCA9IGNvbnRleHQuY3JlYXRlQ2hhbm5lbCgncHJvZ3Jlc3MnKTtcbiAgICBjb25zdCBsb2dDaGFubmVsID0gY29udGV4dC5jcmVhdGVDaGFubmVsKCdsb2cnKTtcbiAgICBjb25zdCBhZGRUZWFyZG93biA9IGNvbnRleHQuYWRkVGVhcmRvd24uYmluZChjb250ZXh0KTtcbiAgICBsZXQgY3VycmVudFN0YXRlOiBCdWlsZGVyUHJvZ3Jlc3NTdGF0ZSA9IEJ1aWxkZXJQcm9ncmVzc1N0YXRlLlN0b3BwZWQ7XG4gICAgbGV0IGN1cnJlbnQgPSAwO1xuICAgIGxldCBzdGF0dXMgPSAnJztcbiAgICBsZXQgdG90YWwgPSAxO1xuXG4gICAgZnVuY3Rpb24gbG9nKGVudHJ5OiBsb2dnaW5nLkxvZ0VudHJ5KSB7XG4gICAgICBsb2dDaGFubmVsLm5leHQoZW50cnkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwcm9ncmVzcyhwcm9ncmVzczogVHlwZWRCdWlsZGVyUHJvZ3Jlc3MsIGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0KSB7XG4gICAgICBjdXJyZW50U3RhdGUgPSBwcm9ncmVzcy5zdGF0ZTtcbiAgICAgIGlmIChwcm9ncmVzcy5zdGF0ZSA9PT0gQnVpbGRlclByb2dyZXNzU3RhdGUuUnVubmluZykge1xuICAgICAgICBjdXJyZW50ID0gcHJvZ3Jlc3MuY3VycmVudDtcbiAgICAgICAgdG90YWwgPSBwcm9ncmVzcy50b3RhbCAhPT0gdW5kZWZpbmVkID8gcHJvZ3Jlc3MudG90YWwgOiB0b3RhbDtcblxuICAgICAgICBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBwcm9ncmVzcy5zdGF0dXMgPSBzdGF0dXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdHVzID0gcHJvZ3Jlc3Muc3RhdHVzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHByb2dyZXNzQ2hhbm5lbC5uZXh0KHtcbiAgICAgICAgLi4uKHByb2dyZXNzIGFzIGpzb24uSnNvbk9iamVjdCksXG4gICAgICAgIC4uLihjb250ZXh0LnRhcmdldCAmJiB7IHRhcmdldDogY29udGV4dC50YXJnZXQgfSksXG4gICAgICAgIC4uLihjb250ZXh0LmJ1aWxkZXIgJiYgeyBidWlsZGVyOiBjb250ZXh0LmJ1aWxkZXIgfSksXG4gICAgICAgIGlkOiBjb250ZXh0LmlkLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPE91dFQ+KChvYnNlcnZlcikgPT4ge1xuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uczogU3Vic2NyaXB0aW9uW10gPSBbXTtcblxuICAgICAgY29uc3QgaW5wdXRTdWJzY3JpcHRpb24gPSBjb250ZXh0LmluYm91bmRCdXMuc3Vic2NyaWJlKChpKSA9PiB7XG4gICAgICAgIHN3aXRjaCAoaS5raW5kKSB7XG4gICAgICAgICAgY2FzZSBKb2JJbmJvdW5kTWVzc2FnZUtpbmQuSW5wdXQ6XG4gICAgICAgICAgICBvbklucHV0KGkudmFsdWUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBmdW5jdGlvbiBvbklucHV0KGk6IEJ1aWxkZXJJbnB1dCkge1xuICAgICAgICBjb25zdCBidWlsZGVyID0gaS5pbmZvIGFzIEJ1aWxkZXJJbmZvO1xuICAgICAgICBjb25zdCBsb2dnZXJOYW1lID0gaS50YXJnZXRcbiAgICAgICAgICA/IHRhcmdldFN0cmluZ0Zyb21UYXJnZXQoaS50YXJnZXQgYXMgVGFyZ2V0KVxuICAgICAgICAgIDogYnVpbGRlci5idWlsZGVyTmFtZTtcbiAgICAgICAgY29uc3QgbG9nZ2VyID0gbmV3IGxvZ2dpbmcuTG9nZ2VyKGxvZ2dlck5hbWUpO1xuXG4gICAgICAgIHN1YnNjcmlwdGlvbnMucHVzaChsb2dnZXIuc3Vic2NyaWJlKChlbnRyeSkgPT4gbG9nKGVudHJ5KSkpO1xuXG4gICAgICAgIGNvbnN0IGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0ID0ge1xuICAgICAgICAgIGJ1aWxkZXIsXG4gICAgICAgICAgd29ya3NwYWNlUm9vdDogaS53b3Jrc3BhY2VSb290LFxuICAgICAgICAgIGN1cnJlbnREaXJlY3Rvcnk6IGkuY3VycmVudERpcmVjdG9yeSxcbiAgICAgICAgICB0YXJnZXQ6IGkudGFyZ2V0IGFzIFRhcmdldCxcbiAgICAgICAgICBsb2dnZXI6IGxvZ2dlcixcbiAgICAgICAgICBpZDogaS5pZCxcbiAgICAgICAgICBhc3luYyBzY2hlZHVsZVRhcmdldChcbiAgICAgICAgICAgIHRhcmdldDogVGFyZ2V0LFxuICAgICAgICAgICAgb3ZlcnJpZGVzOiBqc29uLkpzb25PYmplY3QgPSB7fSxcbiAgICAgICAgICAgIHNjaGVkdWxlT3B0aW9uczogU2NoZWR1bGVPcHRpb25zID0ge30sXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCBydW4gPSBhd2FpdCBzY2hlZHVsZUJ5VGFyZ2V0KHRhcmdldCwgb3ZlcnJpZGVzLCB7XG4gICAgICAgICAgICAgIHNjaGVkdWxlcixcbiAgICAgICAgICAgICAgbG9nZ2VyOiBzY2hlZHVsZU9wdGlvbnMubG9nZ2VyIHx8IGxvZ2dlci5jcmVhdGVDaGlsZCgnJyksXG4gICAgICAgICAgICAgIHdvcmtzcGFjZVJvb3Q6IGkud29ya3NwYWNlUm9vdCxcbiAgICAgICAgICAgICAgY3VycmVudERpcmVjdG9yeTogaS5jdXJyZW50RGlyZWN0b3J5LFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gc3Vic2NyaWJlIGVycm9ycyBhbmQgY29tcGxldGUuXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25zLnB1c2gocnVuLnByb2dyZXNzLnN1YnNjcmliZSgoZXZlbnQpID0+IHByb2dyZXNzQ2hhbm5lbC5uZXh0KGV2ZW50KSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYXN5bmMgc2NoZWR1bGVCdWlsZGVyKFxuICAgICAgICAgICAgYnVpbGRlck5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgIG9wdGlvbnM6IGpzb24uSnNvbk9iamVjdCA9IHt9LFxuICAgICAgICAgICAgc2NoZWR1bGVPcHRpb25zOiBTY2hlZHVsZU9wdGlvbnMgPSB7fSxcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnN0IHJ1biA9IGF3YWl0IHNjaGVkdWxlQnlOYW1lKGJ1aWxkZXJOYW1lLCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgIHNjaGVkdWxlcixcbiAgICAgICAgICAgICAgdGFyZ2V0OiBzY2hlZHVsZU9wdGlvbnMudGFyZ2V0LFxuICAgICAgICAgICAgICBsb2dnZXI6IHNjaGVkdWxlT3B0aW9ucy5sb2dnZXIgfHwgbG9nZ2VyLmNyZWF0ZUNoaWxkKCcnKSxcbiAgICAgICAgICAgICAgd29ya3NwYWNlUm9vdDogaS53b3Jrc3BhY2VSb290LFxuICAgICAgICAgICAgICBjdXJyZW50RGlyZWN0b3J5OiBpLmN1cnJlbnREaXJlY3RvcnksXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBzdWJzY3JpYmUgZXJyb3JzIGFuZCBjb21wbGV0ZS5cbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnMucHVzaChydW4ucHJvZ3Jlc3Muc3Vic2NyaWJlKChldmVudCkgPT4gcHJvZ3Jlc3NDaGFubmVsLm5leHQoZXZlbnQpKSk7XG5cbiAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhc3luYyBnZXRUYXJnZXRPcHRpb25zKHRhcmdldDogVGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyc3RWYWx1ZUZyb20oXG4gICAgICAgICAgICAgIHNjaGVkdWxlci5zY2hlZHVsZTxUYXJnZXQsIGpzb24uSnNvblZhbHVlLCBqc29uLkpzb25PYmplY3Q+KFxuICAgICAgICAgICAgICAgICcuLmdldFRhcmdldE9wdGlvbnMnLFxuICAgICAgICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICAgICAgKS5vdXRwdXQsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYXN5bmMgZ2V0UHJvamVjdE1ldGFkYXRhKHRhcmdldDogVGFyZ2V0IHwgc3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyc3RWYWx1ZUZyb20oXG4gICAgICAgICAgICAgIHNjaGVkdWxlci5zY2hlZHVsZTxUYXJnZXQgfCBzdHJpbmcsIGpzb24uSnNvblZhbHVlLCBqc29uLkpzb25PYmplY3Q+KFxuICAgICAgICAgICAgICAgICcuLmdldFByb2plY3RNZXRhZGF0YScsXG4gICAgICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgICApLm91dHB1dCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhc3luYyBnZXRCdWlsZGVyTmFtZUZvclRhcmdldCh0YXJnZXQ6IFRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpcnN0VmFsdWVGcm9tKFxuICAgICAgICAgICAgICBzY2hlZHVsZXIuc2NoZWR1bGU8VGFyZ2V0LCBqc29uLkpzb25WYWx1ZSwgc3RyaW5nPihcbiAgICAgICAgICAgICAgICAnLi5nZXRCdWlsZGVyTmFtZUZvclRhcmdldCcsXG4gICAgICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgICApLm91dHB1dCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhc3luYyB2YWxpZGF0ZU9wdGlvbnM8VCBleHRlbmRzIGpzb24uSnNvbk9iamVjdCA9IGpzb24uSnNvbk9iamVjdD4oXG4gICAgICAgICAgICBvcHRpb25zOiBqc29uLkpzb25PYmplY3QsXG4gICAgICAgICAgICBidWlsZGVyTmFtZTogc3RyaW5nLFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIGZpcnN0VmFsdWVGcm9tKFxuICAgICAgICAgICAgICBzY2hlZHVsZXIuc2NoZWR1bGU8W3N0cmluZywganNvbi5Kc29uT2JqZWN0XSwganNvbi5Kc29uVmFsdWUsIFQ+KFxuICAgICAgICAgICAgICAgICcuLnZhbGlkYXRlT3B0aW9ucycsXG4gICAgICAgICAgICAgICAgW2J1aWxkZXJOYW1lLCBvcHRpb25zXSxcbiAgICAgICAgICAgICAgKS5vdXRwdXQsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVwb3J0UnVubmluZygpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoY3VycmVudFN0YXRlKSB7XG4gICAgICAgICAgICAgIGNhc2UgQnVpbGRlclByb2dyZXNzU3RhdGUuV2FpdGluZzpcbiAgICAgICAgICAgICAgY2FzZSBCdWlsZGVyUHJvZ3Jlc3NTdGF0ZS5TdG9wcGVkOlxuICAgICAgICAgICAgICAgIHByb2dyZXNzKHsgc3RhdGU6IEJ1aWxkZXJQcm9ncmVzc1N0YXRlLlJ1bm5pbmcsIGN1cnJlbnQ6IDAsIHRvdGFsIH0sIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVwb3J0U3RhdHVzKHN0YXR1czogc3RyaW5nKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGN1cnJlbnRTdGF0ZSkge1xuICAgICAgICAgICAgICBjYXNlIEJ1aWxkZXJQcm9ncmVzc1N0YXRlLlJ1bm5pbmc6XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3MoeyBzdGF0ZTogY3VycmVudFN0YXRlLCBzdGF0dXMsIGN1cnJlbnQsIHRvdGFsIH0sIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEJ1aWxkZXJQcm9ncmVzc1N0YXRlLldhaXRpbmc6XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3MoeyBzdGF0ZTogY3VycmVudFN0YXRlLCBzdGF0dXMgfSwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXBvcnRQcm9ncmVzcyhjdXJyZW50OiBudW1iZXIsIHRvdGFsPzogbnVtYmVyLCBzdGF0dXM/OiBzdHJpbmcpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoY3VycmVudFN0YXRlKSB7XG4gICAgICAgICAgICAgIGNhc2UgQnVpbGRlclByb2dyZXNzU3RhdGUuUnVubmluZzpcbiAgICAgICAgICAgICAgICBwcm9ncmVzcyh7IHN0YXRlOiBjdXJyZW50U3RhdGUsIGN1cnJlbnQsIHRvdGFsLCBzdGF0dXMgfSwgY29udGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhZGRUZWFyZG93bixcbiAgICAgICAgfTtcblxuICAgICAgICBjb250ZXh0LnJlcG9ydFJ1bm5pbmcoKTtcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXN1bHQgPSBmbihpLm9wdGlvbnMgYXMgdW5rbm93biBhcyBPcHRULCBjb250ZXh0KTtcbiAgICAgICAgICBpZiAoaXNCdWlsZGVyT3V0cHV0KHJlc3VsdCkpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IG9mKHJlc3VsdCk7XG4gICAgICAgICAgfSBlbHNlIGlmICghaXNPYnNlcnZhYmxlKHJlc3VsdCkgJiYgaXNBc3luY0l0ZXJhYmxlKHJlc3VsdCkpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZyb21Bc3luY0l0ZXJhYmxlKHJlc3VsdCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZyb20ocmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICByZXN1bHQgPSB0aHJvd0Vycm9yKGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTWFuYWdlIHNvbWUgc3RhdGUgYXV0b21hdGljYWxseS5cbiAgICAgICAgcHJvZ3Jlc3MoeyBzdGF0ZTogQnVpbGRlclByb2dyZXNzU3RhdGUuUnVubmluZywgY3VycmVudDogMCwgdG90YWw6IDEgfSwgY29udGV4dCk7XG4gICAgICAgIHN1YnNjcmlwdGlvbnMucHVzaChcbiAgICAgICAgICByZXN1bHRcbiAgICAgICAgICAgIC5waXBlKFxuICAgICAgICAgICAgICBkZWZhdWx0SWZFbXB0eSh7IHN1Y2Nlc3M6IGZhbHNlIH0gYXMgdW5rbm93biksXG4gICAgICAgICAgICAgIHRhcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3MoeyBzdGF0ZTogQnVpbGRlclByb2dyZXNzU3RhdGUuUnVubmluZywgY3VycmVudDogdG90YWwgfSwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3MoeyBzdGF0ZTogQnVpbGRlclByb2dyZXNzU3RhdGUuU3RvcHBlZCB9LCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIG1lcmdlTWFwKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEFsbG93IHRoZSBsb2cgcXVldWUgdG8gZmx1c2hcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPihzZXRJbW1lZGlhdGUpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoXG4gICAgICAgICAgICAgIChtZXNzYWdlKSA9PiBvYnNlcnZlci5uZXh0KG1lc3NhZ2UgYXMgT3V0VCksXG4gICAgICAgICAgICAgIChlcnJvcikgPT4gb2JzZXJ2ZXIuZXJyb3IoZXJyb3IpLFxuICAgICAgICAgICAgICAoKSA9PiBvYnNlcnZlci5jb21wbGV0ZSgpLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgc3Vic2NyaXB0aW9ucy5mb3JFYWNoKCh4KSA9PiB4LnVuc3Vic2NyaWJlKCkpO1xuICAgICAgICBpbnB1dFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBoYW5kbGVyLFxuICAgIFtCdWlsZGVyU3ltYm9sXTogdHJ1ZSxcbiAgICBbQnVpbGRlclZlcnNpb25TeW1ib2xdOiByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKS52ZXJzaW9uLFxuICB9O1xufVxuXG5mdW5jdGlvbiBpc0FzeW5jSXRlcmFibGU8VD4ob2JqOiB1bmtub3duKTogb2JqIGlzIEFzeW5jSXRlcmFibGU8VD4ge1xuICByZXR1cm4gISFvYmogJiYgdHlwZW9mIChvYmogYXMgQXN5bmNJdGVyYWJsZTxUPilbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID09PSAnZnVuY3Rpb24nO1xufVxuIl19