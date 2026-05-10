"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLoggerJob = exports.createJobFactory = exports.createJobHandler = exports.ChannelAlreadyExistException = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const api_1 = require("./api");
class ChannelAlreadyExistException extends core_1.BaseException {
    constructor(name) {
        super(`Channel ${JSON.stringify(name)} already exist.`);
    }
}
exports.ChannelAlreadyExistException = ChannelAlreadyExistException;
/**
 * Make a simple job handler that sets start and end from a function that's synchronous.
 *
 * @param fn The function to create a handler for.
 * @param options An optional set of properties to set on the handler. Some fields might be
 *   required by registry or schedulers.
 */
function createJobHandler(fn, options = {}) {
    const handler = (argument, context) => {
        const description = context.description;
        const inboundBus = context.inboundBus;
        const inputChannel = new rxjs_1.Subject();
        let subscription;
        const teardownLogics = [];
        let tearingDown = false;
        return new rxjs_1.Observable((subject) => {
            function complete() {
                if (subscription) {
                    subscription.unsubscribe();
                }
                subject.next({ kind: api_1.JobOutboundMessageKind.End, description });
                subject.complete();
                inputChannel.complete();
            }
            // Handle input.
            const inboundSub = inboundBus.subscribe((message) => {
                switch (message.kind) {
                    case api_1.JobInboundMessageKind.Ping:
                        subject.next({ kind: api_1.JobOutboundMessageKind.Pong, description, id: message.id });
                        break;
                    case api_1.JobInboundMessageKind.Stop:
                        // Run teardown logic then complete.
                        tearingDown = true;
                        if (teardownLogics.length) {
                            Promise.all(teardownLogics.map((fn) => fn())).then(() => complete(), () => complete());
                        }
                        else {
                            complete();
                        }
                        break;
                    case api_1.JobInboundMessageKind.Input:
                        if (!tearingDown) {
                            inputChannel.next(message.value);
                        }
                        break;
                }
            });
            // Execute the function with the additional context.
            const channels = new Map();
            const newContext = {
                ...context,
                input: inputChannel.asObservable(),
                addTeardown(teardown) {
                    teardownLogics.push(teardown);
                },
                createChannel(name) {
                    if (channels.has(name)) {
                        throw new ChannelAlreadyExistException(name);
                    }
                    const channelSubject = new rxjs_1.Subject();
                    const channelSub = channelSubject.subscribe((message) => {
                        subject.next({
                            kind: api_1.JobOutboundMessageKind.ChannelMessage,
                            description,
                            name,
                            message,
                        });
                    }, (error) => {
                        subject.next({ kind: api_1.JobOutboundMessageKind.ChannelError, description, name, error });
                        // This can be reopened.
                        channels.delete(name);
                    }, () => {
                        subject.next({ kind: api_1.JobOutboundMessageKind.ChannelComplete, description, name });
                        // This can be reopened.
                        channels.delete(name);
                    });
                    channels.set(name, channelSubject);
                    if (subscription) {
                        subscription.add(channelSub);
                    }
                    return channelSubject;
                },
            };
            subject.next({ kind: api_1.JobOutboundMessageKind.Start, description });
            let result = fn(argument, newContext);
            // If the result is a promise, simply wait for it to complete before reporting the result.
            if ((0, core_1.isPromise)(result)) {
                result = (0, rxjs_1.from)(result);
            }
            else if (!(0, rxjs_1.isObservable)(result)) {
                result = (0, rxjs_1.of)(result);
            }
            subscription = result.subscribe((value) => subject.next({ kind: api_1.JobOutboundMessageKind.Output, description, value }), (error) => subject.error(error), () => complete());
            subscription.add(inboundSub);
            return subscription;
        });
    };
    return Object.assign(handler, { jobDescription: options });
}
exports.createJobHandler = createJobHandler;
/**
 * Lazily create a job using a function.
 * @param loader A factory function that returns a promise/observable of a JobHandler.
 * @param options Same options as createJob.
 */
function createJobFactory(loader, options = {}) {
    const handler = (argument, context) => {
        return (0, rxjs_1.from)(loader()).pipe((0, rxjs_1.switchMap)((fn) => fn(argument, context)));
    };
    return Object.assign(handler, { jobDescription: options });
}
exports.createJobFactory = createJobFactory;
/**
 * Creates a job that logs out input/output messages of another Job. The messages are still
 * propagated to the other job.
 */
function createLoggerJob(job, logger) {
    const handler = (argument, context) => {
        context.inboundBus
            .pipe((0, rxjs_1.tap)((message) => logger.info(`Input: ${JSON.stringify(message)}`)))
            .subscribe();
        return job(argument, context).pipe((0, rxjs_1.tap)((message) => logger.info(`Message: ${JSON.stringify(message)}`), (error) => logger.warn(`Error: ${JSON.stringify(error)}`), () => logger.info(`Completed`)));
    };
    return Object.assign(handler, job);
}
exports.createLoggerJob = createLoggerJob;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWpvYi1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYXJjaGl0ZWN0L3NyYy9qb2JzL2NyZWF0ZS1qb2ItaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBb0Y7QUFDcEYsK0JBVWM7QUFDZCwrQkFPZTtBQUVmLE1BQWEsNEJBQTZCLFNBQVEsb0JBQWE7SUFDN0QsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyxXQUFXLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDMUQsQ0FBQztDQUNGO0FBSkQsb0VBSUM7QUEwQkQ7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsZ0JBQWdCLENBQzlCLEVBQStCLEVBQy9CLFVBQW1DLEVBQUU7SUFFckMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxRQUFXLEVBQUUsT0FBbUMsRUFBRSxFQUFFO1FBQ25FLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFDeEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUN0QyxNQUFNLFlBQVksR0FBRyxJQUFJLGNBQU8sRUFBSyxDQUFDO1FBQ3RDLElBQUksWUFBMEIsQ0FBQztRQUMvQixNQUFNLGNBQWMsR0FBMEMsRUFBRSxDQUFDO1FBQ2pFLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztRQUV4QixPQUFPLElBQUksaUJBQVUsQ0FBd0IsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUN2RCxTQUFTLFFBQVE7Z0JBQ2YsSUFBSSxZQUFZLEVBQUU7b0JBQ2hCLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQztpQkFDNUI7Z0JBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSw0QkFBc0IsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLENB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Q0FBQyxFQUN6RCxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUMvQixDQUNGLENBQUM7SUFDSixDQUFDLENBQUM7SUFFRixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFuQkQsMENBbUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24sIEpzb25WYWx1ZSwgaXNQcm9taXNlLCBsb2dnaW5nIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtcbiAgT2JzZXJ2YWJsZSxcbiAgT2JzZXJ2ZXIsXG4gIFN1YmplY3QsXG4gIFN1YnNjcmlwdGlvbixcbiAgZnJvbSxcbiAgaXNPYnNlcnZhYmxlLFxuICBvZixcbiAgc3dpdGNoTWFwLFxuICB0YXAsXG59IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtcbiAgSm9iRGVzY3JpcHRpb24sXG4gIEpvYkhhbmRsZXIsXG4gIEpvYkhhbmRsZXJDb250ZXh0LFxuICBKb2JJbmJvdW5kTWVzc2FnZUtpbmQsXG4gIEpvYk91dGJvdW5kTWVzc2FnZSxcbiAgSm9iT3V0Ym91bmRNZXNzYWdlS2luZCxcbn0gZnJvbSAnLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgQ2hhbm5lbEFscmVhZHlFeGlzdEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ2hhbm5lbCAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSBhbHJlYWR5IGV4aXN0LmApO1xuICB9XG59XG5cbi8qKlxuICogSW50ZXJmYWNlIGZvciB0aGUgSm9iSGFuZGxlciBjb250ZXh0IHRoYXQgaXMgdXNlZCB3aGVuIHVzaW5nIGBjcmVhdGVKb2JIYW5kbGVyKClgLiBJdCBleHRlbmRzXG4gKiB0aGUgYmFzaWMgYEpvYkhhbmRsZXJDb250ZXh0YCB3aXRoIGFkZGl0aW9uYWwgZnVuY3Rpb25hbGl0eS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTaW1wbGVKb2JIYW5kbGVyQ29udGV4dDxcbiAgQSBleHRlbmRzIEpzb25WYWx1ZSxcbiAgSSBleHRlbmRzIEpzb25WYWx1ZSxcbiAgTyBleHRlbmRzIEpzb25WYWx1ZSxcbj4gZXh0ZW5kcyBKb2JIYW5kbGVyQ29udGV4dDxBLCBJLCBPPiB7XG4gIGNyZWF0ZUNoYW5uZWw6IChuYW1lOiBzdHJpbmcpID0+IE9ic2VydmVyPEpzb25WYWx1ZT47XG4gIGlucHV0OiBPYnNlcnZhYmxlPEk+O1xuICBhZGRUZWFyZG93bih0ZWFyZG93bjogKCkgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQpOiB2b2lkO1xufVxuXG4vKipcbiAqIEEgc2ltcGxlIHZlcnNpb24gb2YgdGhlIEpvYkhhbmRsZXIuIFRoaXMgc2ltcGxpZmllcyBhIGxvdCBvZiB0aGUgaW50ZXJhY3Rpb24gd2l0aCB0aGUgam9iXG4gKiBzY2hlZHVsZXIgYW5kIHJlZ2lzdHJ5LiBGb3IgZXhhbXBsZSwgaW5zdGVhZCBvZiByZXR1cm5pbmcgYSBKb2JPdXRib3VuZE1lc3NhZ2Ugb2JzZXJ2YWJsZSwgeW91XG4gKiBjYW4gZGlyZWN0bHkgcmV0dXJuIGFuIG91dHB1dC5cbiAqL1xuZXhwb3J0IHR5cGUgU2ltcGxlSm9iSGFuZGxlckZuPEEgZXh0ZW5kcyBKc29uVmFsdWUsIEkgZXh0ZW5kcyBKc29uVmFsdWUsIE8gZXh0ZW5kcyBKc29uVmFsdWU+ID0gKFxuICBpbnB1dDogQSxcbiAgY29udGV4dDogU2ltcGxlSm9iSGFuZGxlckNvbnRleHQ8QSwgSSwgTz4sXG4pID0+IE8gfCBQcm9taXNlPE8+IHwgT2JzZXJ2YWJsZTxPPjtcblxuLyoqXG4gKiBNYWtlIGEgc2ltcGxlIGpvYiBoYW5kbGVyIHRoYXQgc2V0cyBzdGFydCBhbmQgZW5kIGZyb20gYSBmdW5jdGlvbiB0aGF0J3Mgc3luY2hyb25vdXMuXG4gKlxuICogQHBhcmFtIGZuIFRoZSBmdW5jdGlvbiB0byBjcmVhdGUgYSBoYW5kbGVyIGZvci5cbiAqIEBwYXJhbSBvcHRpb25zIEFuIG9wdGlvbmFsIHNldCBvZiBwcm9wZXJ0aWVzIHRvIHNldCBvbiB0aGUgaGFuZGxlci4gU29tZSBmaWVsZHMgbWlnaHQgYmVcbiAqICAgcmVxdWlyZWQgYnkgcmVnaXN0cnkgb3Igc2NoZWR1bGVycy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUpvYkhhbmRsZXI8QSBleHRlbmRzIEpzb25WYWx1ZSwgSSBleHRlbmRzIEpzb25WYWx1ZSwgTyBleHRlbmRzIEpzb25WYWx1ZT4oXG4gIGZuOiBTaW1wbGVKb2JIYW5kbGVyRm48QSwgSSwgTz4sXG4gIG9wdGlvbnM6IFBhcnRpYWw8Sm9iRGVzY3JpcHRpb24+ID0ge30sXG4pOiBKb2JIYW5kbGVyPEEsIEksIE8+IHtcbiAgY29uc3QgaGFuZGxlciA9IChhcmd1bWVudDogQSwgY29udGV4dDogSm9iSGFuZGxlckNvbnRleHQ8QSwgSSwgTz4pID0+IHtcbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IGNvbnRleHQuZGVzY3JpcHRpb247XG4gICAgY29uc3QgaW5ib3VuZEJ1cyA9IGNvbnRleHQuaW5ib3VuZEJ1cztcbiAgICBjb25zdCBpbnB1dENoYW5uZWwgPSBuZXcgU3ViamVjdDxJPigpO1xuICAgIGxldCBzdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcbiAgICBjb25zdCB0ZWFyZG93bkxvZ2ljczogQXJyYXk8KCkgPT4gUHJvbWlzZUxpa2U8dm9pZD4gfCB2b2lkPiA9IFtdO1xuICAgIGxldCB0ZWFyaW5nRG93biA9IGZhbHNlO1xuXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlPEpvYk91dGJvdW5kTWVzc2FnZTxPPj4oKHN1YmplY3QpID0+IHtcbiAgICAgIGZ1bmN0aW9uIGNvbXBsZXRlKCkge1xuICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH1cbiAgICAgICAgc3ViamVjdC5uZXh0KHsga2luZDogSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5FbmQsIGRlc2NyaXB0aW9uIH0pO1xuICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICAgIGlucHV0Q2hhbm5lbC5jb21wbGV0ZSgpO1xuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgaW5wdXQuXG4gICAgICBjb25zdCBpbmJvdW5kU3ViID0gaW5ib3VuZEJ1cy5zdWJzY3JpYmUoKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgc3dpdGNoIChtZXNzYWdlLmtpbmQpIHtcbiAgICAgICAgICBjYXNlIEpvYkluYm91bmRNZXNzYWdlS2luZC5QaW5nOlxuICAgICAgICAgICAgc3ViamVjdC5uZXh0KHsga2luZDogSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5Qb25nLCBkZXNjcmlwdGlvbiwgaWQ6IG1lc3NhZ2UuaWQgfSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgSm9iSW5ib3VuZE1lc3NhZ2VLaW5kLlN0b3A6XG4gICAgICAgICAgICAvLyBSdW4gdGVhcmRvd24gbG9naWMgdGhlbiBjb21wbGV0ZS5cbiAgICAgICAgICAgIHRlYXJpbmdEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh0ZWFyZG93bkxvZ2ljcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgUHJvbWlzZS5hbGwodGVhcmRvd25Mb2dpY3MubWFwKChmbikgPT4gZm4oKSkpLnRoZW4oXG4gICAgICAgICAgICAgICAgKCkgPT4gY29tcGxldGUoKSxcbiAgICAgICAgICAgICAgICAoKSA9PiBjb21wbGV0ZSgpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29tcGxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBKb2JJbmJvdW5kTWVzc2FnZUtpbmQuSW5wdXQ6XG4gICAgICAgICAgICBpZiAoIXRlYXJpbmdEb3duKSB7XG4gICAgICAgICAgICAgIGlucHV0Q2hhbm5lbC5uZXh0KG1lc3NhZ2UudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBFeGVjdXRlIHRoZSBmdW5jdGlvbiB3aXRoIHRoZSBhZGRpdGlvbmFsIGNvbnRleHQuXG4gICAgICBjb25zdCBjaGFubmVscyA9IG5ldyBNYXA8c3RyaW5nLCBTdWJqZWN0PEpzb25WYWx1ZT4+KCk7XG5cbiAgICAgIGNvbnN0IG5ld0NvbnRleHQ6IFNpbXBsZUpvYkhhbmRsZXJDb250ZXh0PEEsIEksIE8+ID0ge1xuICAgICAgICAuLi5jb250ZXh0LFxuICAgICAgICBpbnB1dDogaW5wdXRDaGFubmVsLmFzT2JzZXJ2YWJsZSgpLFxuICAgICAgICBhZGRUZWFyZG93bih0ZWFyZG93bjogKCkgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgICB0ZWFyZG93bkxvZ2ljcy5wdXNoKHRlYXJkb3duKTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlQ2hhbm5lbChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICBpZiAoY2hhbm5lbHMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ2hhbm5lbEFscmVhZHlFeGlzdEV4Y2VwdGlvbihuYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgY2hhbm5lbFN1YmplY3QgPSBuZXcgU3ViamVjdDxKc29uVmFsdWU+KCk7XG4gICAgICAgICAgY29uc3QgY2hhbm5lbFN1YiA9IGNoYW5uZWxTdWJqZWN0LnN1YnNjcmliZShcbiAgICAgICAgICAgIChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICAgIHN1YmplY3QubmV4dCh7XG4gICAgICAgICAgICAgICAga2luZDogSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5DaGFubmVsTWVzc2FnZSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQoeyBraW5kOiBKb2JPdXRib3VuZE1lc3NhZ2VLaW5kLkNoYW5uZWxFcnJvciwgZGVzY3JpcHRpb24sIG5hbWUsIGVycm9yIH0pO1xuICAgICAgICAgICAgICAvLyBUaGlzIGNhbiBiZSByZW9wZW5lZC5cbiAgICAgICAgICAgICAgY2hhbm5lbHMuZGVsZXRlKG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHsga2luZDogSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5DaGFubmVsQ29tcGxldGUsIGRlc2NyaXB0aW9uLCBuYW1lIH0pO1xuICAgICAgICAgICAgICAvLyBUaGlzIGNhbiBiZSByZW9wZW5lZC5cbiAgICAgICAgICAgICAgY2hhbm5lbHMuZGVsZXRlKG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY2hhbm5lbHMuc2V0KG5hbWUsIGNoYW5uZWxTdWJqZWN0KTtcbiAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICBzdWJzY3JpcHRpb24uYWRkKGNoYW5uZWxTdWIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBjaGFubmVsU3ViamVjdDtcbiAgICAgICAgfSxcbiAgICAgIH07XG5cbiAgICAgIHN1YmplY3QubmV4dCh7IGtpbmQ6IEpvYk91dGJvdW5kTWVzc2FnZUtpbmQuU3RhcnQsIGRlc2NyaXB0aW9uIH0pO1xuICAgICAgbGV0IHJlc3VsdCA9IGZuKGFyZ3VtZW50LCBuZXdDb250ZXh0KTtcbiAgICAgIC8vIElmIHRoZSByZXN1bHQgaXMgYSBwcm9taXNlLCBzaW1wbHkgd2FpdCBmb3IgaXQgdG8gY29tcGxldGUgYmVmb3JlIHJlcG9ydGluZyB0aGUgcmVzdWx0LlxuICAgICAgaWYgKGlzUHJvbWlzZShyZXN1bHQpKSB7XG4gICAgICAgIHJlc3VsdCA9IGZyb20ocmVzdWx0KTtcbiAgICAgIH0gZWxzZSBpZiAoIWlzT2JzZXJ2YWJsZShyZXN1bHQpKSB7XG4gICAgICAgIHJlc3VsdCA9IG9mKHJlc3VsdCBhcyBPKTtcbiAgICAgIH1cblxuICAgICAgc3Vic2NyaXB0aW9uID0gKHJlc3VsdCBhcyBPYnNlcnZhYmxlPE8+KS5zdWJzY3JpYmUoXG4gICAgICAgICh2YWx1ZTogTykgPT4gc3ViamVjdC5uZXh0KHsga2luZDogSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5PdXRwdXQsIGRlc2NyaXB0aW9uLCB2YWx1ZSB9KSxcbiAgICAgICAgKGVycm9yKSA9PiBzdWJqZWN0LmVycm9yKGVycm9yKSxcbiAgICAgICAgKCkgPT4gY29tcGxldGUoKSxcbiAgICAgICk7XG4gICAgICBzdWJzY3JpcHRpb24uYWRkKGluYm91bmRTdWIpO1xuXG4gICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBPYmplY3QuYXNzaWduKGhhbmRsZXIsIHsgam9iRGVzY3JpcHRpb246IG9wdGlvbnMgfSk7XG59XG5cbi8qKlxuICogTGF6aWx5IGNyZWF0ZSBhIGpvYiB1c2luZyBhIGZ1bmN0aW9uLlxuICogQHBhcmFtIGxvYWRlciBBIGZhY3RvcnkgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgcHJvbWlzZS9vYnNlcnZhYmxlIG9mIGEgSm9iSGFuZGxlci5cbiAqIEBwYXJhbSBvcHRpb25zIFNhbWUgb3B0aW9ucyBhcyBjcmVhdGVKb2IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVKb2JGYWN0b3J5PEEgZXh0ZW5kcyBKc29uVmFsdWUsIEkgZXh0ZW5kcyBKc29uVmFsdWUsIE8gZXh0ZW5kcyBKc29uVmFsdWU+KFxuICBsb2FkZXI6ICgpID0+IFByb21pc2U8Sm9iSGFuZGxlcjxBLCBJLCBPPj4sXG4gIG9wdGlvbnM6IFBhcnRpYWw8Sm9iRGVzY3JpcHRpb24+ID0ge30sXG4pOiBKb2JIYW5kbGVyPEEsIEksIE8+IHtcbiAgY29uc3QgaGFuZGxlciA9IChhcmd1bWVudDogQSwgY29udGV4dDogSm9iSGFuZGxlckNvbnRleHQ8QSwgSSwgTz4pID0+IHtcbiAgICByZXR1cm4gZnJvbShsb2FkZXIoKSkucGlwZShzd2l0Y2hNYXAoKGZuKSA9PiBmbihhcmd1bWVudCwgY29udGV4dCkpKTtcbiAgfTtcblxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihoYW5kbGVyLCB7IGpvYkRlc2NyaXB0aW9uOiBvcHRpb25zIH0pO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBqb2IgdGhhdCBsb2dzIG91dCBpbnB1dC9vdXRwdXQgbWVzc2FnZXMgb2YgYW5vdGhlciBKb2IuIFRoZSBtZXNzYWdlcyBhcmUgc3RpbGxcbiAqIHByb3BhZ2F0ZWQgdG8gdGhlIG90aGVyIGpvYi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxvZ2dlckpvYjxBIGV4dGVuZHMgSnNvblZhbHVlLCBJIGV4dGVuZHMgSnNvblZhbHVlLCBPIGV4dGVuZHMgSnNvblZhbHVlPihcbiAgam9iOiBKb2JIYW5kbGVyPEEsIEksIE8+LFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKTogSm9iSGFuZGxlcjxBLCBJLCBPPiB7XG4gIGNvbnN0IGhhbmRsZXIgPSAoYXJndW1lbnQ6IEEsIGNvbnRleHQ6IEpvYkhhbmRsZXJDb250ZXh0PEEsIEksIE8+KSA9PiB7XG4gICAgY29udGV4dC5pbmJvdW5kQnVzXG4gICAgICAucGlwZSh0YXAoKG1lc3NhZ2UpID0+IGxvZ2dlci5pbmZvKGBJbnB1dDogJHtKU09OLnN0cmluZ2lmeShtZXNzYWdlKX1gKSkpXG4gICAgICAuc3Vic2NyaWJlKCk7XG5cbiAgICByZXR1cm4gam9iKGFyZ3VtZW50LCBjb250ZXh0KS5waXBlKFxuICAgICAgdGFwKFxuICAgICAgICAobWVzc2FnZSkgPT4gbG9nZ2VyLmluZm8oYE1lc3NhZ2U6ICR7SlNPTi5zdHJpbmdpZnkobWVzc2FnZSl9YCksXG4gICAgICAgIChlcnJvcikgPT4gbG9nZ2VyLndhcm4oYEVycm9yOiAke0pTT04uc3RyaW5naWZ5KGVycm9yKX1gKSxcbiAgICAgICAgKCkgPT4gbG9nZ2VyLmluZm8oYENvbXBsZXRlZGApLFxuICAgICAgKSxcbiAgICApO1xuICB9O1xuXG4gIHJldHVybiBPYmplY3QuYXNzaWduKGhhbmRsZXIsIGpvYik7XG59XG4iXX0=