"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.strategy = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const api_1 = require("./api");
// eslint-disable-next-line @typescript-eslint/no-namespace
var strategy;
(function (strategy) {
    /**
     * Creates a JobStrategy that serializes every call. This strategy can be mixed between jobs.
     */
    function serialize() {
        let latest = (0, rxjs_1.of)();
        return (handler, options) => {
            const newHandler = (argument, context) => {
                const previous = latest;
                latest = (0, rxjs_1.concat)(previous.pipe((0, rxjs_1.ignoreElements)()), new rxjs_1.Observable((o) => handler(argument, context).subscribe(o))).pipe((0, rxjs_1.shareReplay)(0));
                return latest;
            };
            return Object.assign(newHandler, {
                jobDescription: Object.assign({}, handler.jobDescription, options),
            });
        };
    }
    strategy.serialize = serialize;
    /**
     * Creates a JobStrategy that will always reuse a running job, and restart it if the job ended.
     * @param replayMessages Replay ALL messages if a job is reused, otherwise just hook up where it
     * is.
     */
    function reuse(replayMessages = false) {
        let inboundBus = new rxjs_1.Subject();
        let run = null;
        let state = null;
        return (handler, options) => {
            const newHandler = (argument, context) => {
                // Forward inputs.
                const subscription = context.inboundBus.subscribe(inboundBus);
                if (run) {
                    return (0, rxjs_1.concat)(
                    // Update state.
                    (0, rxjs_1.of)(state), run).pipe((0, rxjs_1.finalize)(() => subscription.unsubscribe()));
                }
                run = handler(argument, { ...context, inboundBus: inboundBus.asObservable() }).pipe((0, rxjs_1.tap)((message) => {
                    if (message.kind == api_1.JobOutboundMessageKind.Start ||
                        message.kind == api_1.JobOutboundMessageKind.OnReady ||
                        message.kind == api_1.JobOutboundMessageKind.End) {
                        state = message;
                    }
                }, undefined, () => {
                    subscription.unsubscribe();
                    inboundBus = new rxjs_1.Subject();
                    run = null;
                }), replayMessages ? (0, rxjs_1.shareReplay)() : (0, rxjs_1.share)());
                return run;
            };
            return Object.assign(newHandler, handler, options || {});
        };
    }
    strategy.reuse = reuse;
    /**
     * Creates a JobStrategy that will reuse a running job if the argument matches.
     * @param replayMessages Replay ALL messages if a job is reused, otherwise just hook up where it
     * is.
     */
    function memoize(replayMessages = false) {
        const runs = new Map();
        return (handler, options) => {
            const newHandler = (argument, context) => {
                const argumentJson = JSON.stringify((0, core_1.isJsonObject)(argument)
                    ? Object.keys(argument)
                        .sort()
                        .reduce((result, key) => {
                        result[key] = argument[key];
                        return result;
                    }, {})
                    : argument);
                const maybeJob = runs.get(argumentJson);
                if (maybeJob) {
                    return maybeJob;
                }
                const run = handler(argument, context).pipe(replayMessages ? (0, rxjs_1.shareReplay)() : (0, rxjs_1.share)());
                runs.set(argumentJson, run);
                return run;
            };
            return Object.assign(newHandler, handler, options || {});
        };
    }
    strategy.memoize = memoize;
})(strategy || (exports.strategy = strategy = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9hcmNoaXRlY3Qvc3JjL2pvYnMvc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBQTJFO0FBQzNFLCtCQVVjO0FBQ2QsK0JBT2U7QUFFZiwyREFBMkQ7QUFDM0QsSUFBaUIsUUFBUSxDQW9JeEI7QUFwSUQsV0FBaUIsUUFBUTtJQVV2Qjs7T0FFRztJQUNILFNBQWdCLFNBQVM7UUFLdkIsSUFBSSxNQUFNLEdBQXNDLElBQUEsU0FBRSxHQUFFLENBQUM7UUFFckQsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUMxQixNQUFNLFVBQVUsR0FBRyxDQUFDLFFBQVcsRUFBRSxPQUFtQyxFQUFFLEVBQUU7Z0JBQ3RFLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQztnQkFDeEIsTUFBTSxHQUFHLElBQUEsYUFBTSxFQUNiLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBQSxxQkFBYyxHQUFFLENBQUMsRUFDL0IsSUFBSSxpQkFBVSxDQUF3QixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDdEYsQ0FBQyxJQUFJLENBQUMsSUFBQSxrQkFBVyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXZCLE9BQU8sTUFBTSxDQUFDO1lBQ2hCLENBQUMsQ0FBQztZQUVGLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUU7Z0JBQy9CLGNBQWMsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQzthQUNuRSxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUM7SUFDSixDQUFD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LFlBQVksQ0FBQyxDQUFDO2dCQUV4QyxJQUFJLFFBQVEsRUFBRTtvQkFDWixPQUFPLFFBQVEsQ0FBQztpQkFDakI7Z0JBRUQsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFBLGtCQUFXLEdBQUUsQ0FBQyxDQUFDLENBQUMsSUFBQSxZQUFLLEdBQUUsQ0FBQyxDQUFDO2dCQUN0RixJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFFNUIsT0FBTyxHQUFHLENBQUM7WUFDYixDQUFDLENBQUM7WUFFRixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxPQUFPLElBQUksRUFBRSxDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQWxDZSxnQkFBTyxVQWtDdEIsQ0FBQTtBQUNILENBQUMsRUFwSWdCLFFBQVEsd0JBQVIsUUFBUSxRQW9JeEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgSnNvbk9iamVjdCwgSnNvblZhbHVlLCBpc0pzb25PYmplY3QgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1xuICBPYnNlcnZhYmxlLFxuICBTdWJqZWN0LFxuICBjb25jYXQsXG4gIGZpbmFsaXplLFxuICBpZ25vcmVFbGVtZW50cyxcbiAgb2YsXG4gIHNoYXJlLFxuICBzaGFyZVJlcGxheSxcbiAgdGFwLFxufSBmcm9tICdyeGpzJztcbmltcG9ydCB7XG4gIEpvYkRlc2NyaXB0aW9uLFxuICBKb2JIYW5kbGVyLFxuICBKb2JIYW5kbGVyQ29udGV4dCxcbiAgSm9iSW5ib3VuZE1lc3NhZ2UsXG4gIEpvYk91dGJvdW5kTWVzc2FnZSxcbiAgSm9iT3V0Ym91bmRNZXNzYWdlS2luZCxcbn0gZnJvbSAnLi9hcGknO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5hbWVzcGFjZVxuZXhwb3J0IG5hbWVzcGFjZSBzdHJhdGVneSB7XG4gIGV4cG9ydCB0eXBlIEpvYlN0cmF0ZWd5PFxuICAgIEEgZXh0ZW5kcyBKc29uVmFsdWUgPSBKc29uVmFsdWUsXG4gICAgSSBleHRlbmRzIEpzb25WYWx1ZSA9IEpzb25WYWx1ZSxcbiAgICBPIGV4dGVuZHMgSnNvblZhbHVlID0gSnNvblZhbHVlLFxuICA+ID0gKFxuICAgIGhhbmRsZXI6IEpvYkhhbmRsZXI8QSwgSSwgTz4sXG4gICAgb3B0aW9ucz86IFBhcnRpYWw8UmVhZG9ubHk8Sm9iRGVzY3JpcHRpb24+PixcbiAgKSA9PiBKb2JIYW5kbGVyPEEsIEksIE8+O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgSm9iU3RyYXRlZ3kgdGhhdCBzZXJpYWxpemVzIGV2ZXJ5IGNhbGwuIFRoaXMgc3RyYXRlZ3kgY2FuIGJlIG1peGVkIGJldHdlZW4gam9icy5cbiAgICovXG4gIGV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemU8XG4gICAgQSBleHRlbmRzIEpzb25WYWx1ZSA9IEpzb25WYWx1ZSxcbiAgICBJIGV4dGVuZHMgSnNvblZhbHVlID0gSnNvblZhbHVlLFxuICAgIE8gZXh0ZW5kcyBKc29uVmFsdWUgPSBKc29uVmFsdWUsXG4gID4oKTogSm9iU3RyYXRlZ3k8QSwgSSwgTz4ge1xuICAgIGxldCBsYXRlc3Q6IE9ic2VydmFibGU8Sm9iT3V0Ym91bmRNZXNzYWdlPE8+PiA9IG9mKCk7XG5cbiAgICByZXR1cm4gKGhhbmRsZXIsIG9wdGlvbnMpID0+IHtcbiAgICAgIGNvbnN0IG5ld0hhbmRsZXIgPSAoYXJndW1lbnQ6IEEsIGNvbnRleHQ6IEpvYkhhbmRsZXJDb250ZXh0PEEsIEksIE8+KSA9PiB7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzID0gbGF0ZXN0O1xuICAgICAgICBsYXRlc3QgPSBjb25jYXQoXG4gICAgICAgICAgcHJldmlvdXMucGlwZShpZ25vcmVFbGVtZW50cygpKSxcbiAgICAgICAgICBuZXcgT2JzZXJ2YWJsZTxKb2JPdXRib3VuZE1lc3NhZ2U8Tz4+KChvKSA9PiBoYW5kbGVyKGFyZ3VtZW50LCBjb250ZXh0KS5zdWJzY3JpYmUobykpLFxuICAgICAgICApLnBpcGUoc2hhcmVSZXBsYXkoMCkpO1xuXG4gICAgICAgIHJldHVybiBsYXRlc3Q7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihuZXdIYW5kbGVyLCB7XG4gICAgICAgIGpvYkRlc2NyaXB0aW9uOiBPYmplY3QuYXNzaWduKHt9LCBoYW5kbGVyLmpvYkRlc2NyaXB0aW9uLCBvcHRpb25zKSxcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIEpvYlN0cmF0ZWd5IHRoYXQgd2lsbCBhbHdheXMgcmV1c2UgYSBydW5uaW5nIGpvYiwgYW5kIHJlc3RhcnQgaXQgaWYgdGhlIGpvYiBlbmRlZC5cbiAgICogQHBhcmFtIHJlcGxheU1lc3NhZ2VzIFJlcGxheSBBTEwgbWVzc2FnZXMgaWYgYSBqb2IgaXMgcmV1c2VkLCBvdGhlcndpc2UganVzdCBob29rIHVwIHdoZXJlIGl0XG4gICAqIGlzLlxuICAgKi9cbiAgZXhwb3J0IGZ1bmN0aW9uIHJldXNlPFxuICAgIEEgZXh0ZW5kcyBKc29uVmFsdWUgPSBKc29uVmFsdWUsXG4gICAgSSBleHRlbmRzIEpzb25WYWx1ZSA9IEpzb25WYWx1ZSxcbiAgICBPIGV4dGVuZHMgSnNvblZhbHVlID0gSnNvblZhbHVlLFxuICA+KHJlcGxheU1lc3NhZ2VzID0gZmFsc2UpOiBKb2JTdHJhdGVneTxBLCBJLCBPPiB7XG4gICAgbGV0IGluYm91bmRCdXMgPSBuZXcgU3ViamVjdDxKb2JJbmJvdW5kTWVzc2FnZTxJPj4oKTtcbiAgICBsZXQgcnVuOiBPYnNlcnZhYmxlPEpvYk91dGJvdW5kTWVzc2FnZTxPPj4gfCBudWxsID0gbnVsbDtcbiAgICBsZXQgc3RhdGU6IEpvYk91dGJvdW5kTWVzc2FnZTxPPiB8IG51bGwgPSBudWxsO1xuXG4gICAgcmV0dXJuIChoYW5kbGVyLCBvcHRpb25zKSA9PiB7XG4gICAgICBjb25zdCBuZXdIYW5kbGVyID0gKGFyZ3VtZW50OiBBLCBjb250ZXh0OiBKb2JIYW5kbGVyQ29udGV4dDxBLCBJLCBPPikgPT4ge1xuICAgICAgICAvLyBGb3J3YXJkIGlucHV0cy5cbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gY29udGV4dC5pbmJvdW5kQnVzLnN1YnNjcmliZShpbmJvdW5kQnVzKTtcblxuICAgICAgICBpZiAocnVuKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbmNhdChcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBzdGF0ZS5cbiAgICAgICAgICAgIG9mKHN0YXRlKSxcbiAgICAgICAgICAgIHJ1bixcbiAgICAgICAgICApLnBpcGUoZmluYWxpemUoKCkgPT4gc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1biA9IGhhbmRsZXIoYXJndW1lbnQsIHsgLi4uY29udGV4dCwgaW5ib3VuZEJ1czogaW5ib3VuZEJ1cy5hc09ic2VydmFibGUoKSB9KS5waXBlKFxuICAgICAgICAgIHRhcChcbiAgICAgICAgICAgIChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBtZXNzYWdlLmtpbmQgPT0gSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5TdGFydCB8fFxuICAgICAgICAgICAgICAgIG1lc3NhZ2Uua2luZCA9PSBKb2JPdXRib3VuZE1lc3NhZ2VLaW5kLk9uUmVhZHkgfHxcbiAgICAgICAgICAgICAgICBtZXNzYWdlLmtpbmQgPT0gSm9iT3V0Ym91bmRNZXNzYWdlS2luZC5FbmRcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUgPSBtZXNzYWdlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgaW5ib3VuZEJ1cyA9IG5ldyBTdWJqZWN0PEpvYkluYm91bmRNZXNzYWdlPEk+PigpO1xuICAgICAgICAgICAgICBydW4gPSBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICApLFxuICAgICAgICAgIHJlcGxheU1lc3NhZ2VzID8gc2hhcmVSZXBsYXkoKSA6IHNoYXJlKCksXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKG5ld0hhbmRsZXIsIGhhbmRsZXIsIG9wdGlvbnMgfHwge30pO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIEpvYlN0cmF0ZWd5IHRoYXQgd2lsbCByZXVzZSBhIHJ1bm5pbmcgam9iIGlmIHRoZSBhcmd1bWVudCBtYXRjaGVzLlxuICAgKiBAcGFyYW0gcmVwbGF5TWVzc2FnZXMgUmVwbGF5IEFMTCBtZXNzYWdlcyBpZiBhIGpvYiBpcyByZXVzZWQsIG90aGVyd2lzZSBqdXN0IGhvb2sgdXAgd2hlcmUgaXRcbiAgICogaXMuXG4gICAqL1xuICBleHBvcnQgZnVuY3Rpb24gbWVtb2l6ZTxcbiAgICBBIGV4dGVuZHMgSnNvblZhbHVlID0gSnNvblZhbHVlLFxuICAgIEkgZXh0ZW5kcyBKc29uVmFsdWUgPSBKc29uVmFsdWUsXG4gICAgTyBleHRlbmRzIEpzb25WYWx1ZSA9IEpzb25WYWx1ZSxcbiAgPihyZXBsYXlNZXNzYWdlcyA9IGZhbHNlKTogSm9iU3RyYXRlZ3k8QSwgSSwgTz4ge1xuICAgIGNvbnN0IHJ1bnMgPSBuZXcgTWFwPHN0cmluZywgT2JzZXJ2YWJsZTxKb2JPdXRib3VuZE1lc3NhZ2U8Tz4+PigpO1xuXG4gICAgcmV0dXJuIChoYW5kbGVyLCBvcHRpb25zKSA9PiB7XG4gICAgICBjb25zdCBuZXdIYW5kbGVyID0gKGFyZ3VtZW50OiBBLCBjb250ZXh0OiBKb2JIYW5kbGVyQ29udGV4dDxBLCBJLCBPPikgPT4ge1xuICAgICAgICBjb25zdCBhcmd1bWVudEpzb24gPSBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICBpc0pzb25PYmplY3QoYXJndW1lbnQpXG4gICAgICAgICAgICA/IE9iamVjdC5rZXlzKGFyZ3VtZW50KVxuICAgICAgICAgICAgICAgIC5zb3J0KClcbiAgICAgICAgICAgICAgICAucmVkdWNlKChyZXN1bHQsIGtleSkgPT4ge1xuICAgICAgICAgICAgICAgICAgcmVzdWx0W2tleV0gPSBhcmd1bWVudFtrZXldO1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH0sIHt9IGFzIEpzb25PYmplY3QpXG4gICAgICAgICAgICA6IGFyZ3VtZW50LFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBtYXliZUpvYiA9IHJ1bnMuZ2V0KGFyZ3VtZW50SnNvbik7XG5cbiAgICAgICAgaWYgKG1heWJlSm9iKSB7XG4gICAgICAgICAgcmV0dXJuIG1heWJlSm9iO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcnVuID0gaGFuZGxlcihhcmd1bWVudCwgY29udGV4dCkucGlwZShyZXBsYXlNZXNzYWdlcyA/IHNoYXJlUmVwbGF5KCkgOiBzaGFyZSgpKTtcbiAgICAgICAgcnVucy5zZXQoYXJndW1lbnRKc29uLCBydW4pO1xuXG4gICAgICAgIHJldHVybiBydW47XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihuZXdIYW5kbGVyLCBoYW5kbGVyLCBvcHRpb25zIHx8IHt9KTtcbiAgICB9O1xuICB9XG59XG4iXX0=