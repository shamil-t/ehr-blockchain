"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileSync = exports.profileAsync = exports.logCumulativeDurations = exports.resetCumulativeDurations = void 0;
const environment_options_1 = require("../../utils/environment-options");
let cumulativeDurations;
function resetCumulativeDurations() {
    cumulativeDurations?.clear();
}
exports.resetCumulativeDurations = resetCumulativeDurations;
function logCumulativeDurations() {
    if (!environment_options_1.debugPerformance || !cumulativeDurations) {
        return;
    }
    for (const [name, durations] of cumulativeDurations) {
        let total = 0;
        let min;
        let max;
        for (const duration of durations) {
            total += duration;
            if (min === undefined || duration < min) {
                min = duration;
            }
            if (max === undefined || duration > max) {
                max = duration;
            }
        }
        const average = total / durations.length;
        // eslint-disable-next-line no-console
        console.log(`DURATION[${name}]: ${total.toFixed(9)}s [count: ${durations.length}; avg: ${average.toFixed(9)}s; min: ${min?.toFixed(9)}s; max: ${max?.toFixed(9)}s]`);
    }
}
exports.logCumulativeDurations = logCumulativeDurations;
function recordDuration(name, startTime, cumulative) {
    const duration = Number(process.hrtime.bigint() - startTime) / 10 ** 9;
    if (cumulative) {
        cumulativeDurations ?? (cumulativeDurations = new Map());
        const durations = cumulativeDurations.get(name) ?? [];
        durations.push(duration);
        cumulativeDurations.set(name, durations);
    }
    else {
        // eslint-disable-next-line no-console
        console.log(`DURATION[${name}]: ${duration.toFixed(9)}s`);
    }
}
async function profileAsync(name, action, cumulative) {
    if (!environment_options_1.debugPerformance) {
        return action();
    }
    const startTime = process.hrtime.bigint();
    try {
        return await action();
    }
    finally {
        recordDuration(name, startTime, cumulative);
    }
}
exports.profileAsync = profileAsync;
function profileSync(name, action, cumulative) {
    if (!environment_options_1.debugPerformance) {
        return action();
    }
    const startTime = process.hrtime.bigint();
    try {
        return action();
    }
    finally {
        recordDuration(name, startTime, cumulative);
    }
}
exports.profileSync = profileSync;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdG9vbHMvZXNidWlsZC9wcm9maWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgseUVBQW1FO0FBRW5FLElBQUksbUJBQXNELENBQUM7QUFFM0QsU0FBZ0Isd0JBQXdCO0lBQ3RDLG1CQUFtQixFQUFFLEtBQUssRUFBRSxDQUFDO0FBQy9CLENBQUM7QUFGRCw0REFFQztBQUVELFNBQWdCLHNCQUFzQjtJQUNwQyxJQUFJLENBQUMsc0NBQWdCLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtRQUM3QyxPQUFPO0tBQ1I7SUFFRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUksbUJBQW1CLEVBQUU7UUFDbkQsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsSUFBSSxHQUFHLENBQUM7UUFDUixJQUFJLEdBQUcsQ0FBQztRQUNSLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFO1lBQ2hDLEtBQUssSUFBSSxRQUFRLENBQUM7WUFDbEIsSUFBSSxHQUFHLEtBQUssU0FBUyxJQUFJLFFBQVEsR0FBRyxHQUFHLEVBQUU7Z0JBQ3ZDLEdBQUcsR0FBRyxRQUFRLENBQUM7YUFDaEI7WUFDRCxJQUFJLEdBQUcsS0FBSyxTQUFTLElBQUksUUFBUSxHQUFHLEdBQUcsRUFBRTtnQkFDdkMsR0FBRyxHQUFHLFFBQVEsQ0FBQzthQUNoQjtTQUNGO1FBQ0QsTUFBTSxPQUFPLEdBQUcsS0FBSyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7UUFDekMsc0NBQXNDO1FBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQ1QsWUFBWSxJQUFJLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsYUFBYSxTQUFTLENBQUMsTUFBTSxVQUFVLE9BQU8sQ0FBQyxPQUFPLENBQzFGLENBQUMsQ0FDRixXQUFXLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUMxRCxDQUFDO0tBQ0g7QUFDSCxDQUFDO0FBMUJELHdEQTBCQztBQUVELFNBQVMsY0FBYyxDQUFDLElBQVksRUFBRSxTQUFpQixFQUFFLFVBQW9CO0lBQzNFLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdkUsSUFBSSxVQUFVLEVBQUU7UUFDZCxtQkFBbUIsS0FBbkIsbUJBQW1CLEdBQUssSUFBSSxHQUFHLEVBQW9CLEVBQUM7UUFDcEQsTUFBTSxTQUFTLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0RCxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pCLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDMUM7U0FBTTtRQUNMLHNDQUFzQztRQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxNQUFNLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzNEO0FBQ0gsQ0FBQztBQUVNLEtBQUssVUFBVSxZQUFZLENBQ2hDLElBQVksRUFDWixNQUF3QixFQUN4QixVQUFvQjtJQUVwQixJQUFJLENBQUMsc0NBQWdCLEVBQUU7UUFDckIsT0FBTyxNQUFNLEVBQUUsQ0FBQztLQUNqQjtJQUVELE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDMUMsSUFBSTtRQUNGLE9BQU8sTUFBTSxNQUFNLEVBQUUsQ0FBQztLQUN2QjtZQUFTO1FBQ1IsY0FBYyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDN0M7QUFDSCxDQUFDO0FBZkQsb0NBZUM7QUFFRCxTQUFnQixXQUFXLENBQUksSUFBWSxFQUFFLE1BQWUsRUFBRSxVQUFvQjtJQUNoRixJQUFJLENBQUMsc0NBQWdCLEVBQUU7UUFDckIsT0FBTyxNQUFNLEVBQUUsQ0FBQztLQUNqQjtJQUVELE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDMUMsSUFBSTtRQUNGLE9BQU8sTUFBTSxFQUFFLENBQUM7S0FDakI7WUFBUztRQUNSLGNBQWMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQzdDO0FBQ0gsQ0FBQztBQVhELGtDQVdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGRlYnVnUGVyZm9ybWFuY2UgfSBmcm9tICcuLi8uLi91dGlscy9lbnZpcm9ubWVudC1vcHRpb25zJztcblxubGV0IGN1bXVsYXRpdmVEdXJhdGlvbnM6IE1hcDxzdHJpbmcsIG51bWJlcltdPiB8IHVuZGVmaW5lZDtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q3VtdWxhdGl2ZUR1cmF0aW9ucygpOiB2b2lkIHtcbiAgY3VtdWxhdGl2ZUR1cmF0aW9ucz8uY2xlYXIoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvZ0N1bXVsYXRpdmVEdXJhdGlvbnMoKTogdm9pZCB7XG4gIGlmICghZGVidWdQZXJmb3JtYW5jZSB8fCAhY3VtdWxhdGl2ZUR1cmF0aW9ucykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGZvciAoY29uc3QgW25hbWUsIGR1cmF0aW9uc10gb2YgY3VtdWxhdGl2ZUR1cmF0aW9ucykge1xuICAgIGxldCB0b3RhbCA9IDA7XG4gICAgbGV0IG1pbjtcbiAgICBsZXQgbWF4O1xuICAgIGZvciAoY29uc3QgZHVyYXRpb24gb2YgZHVyYXRpb25zKSB7XG4gICAgICB0b3RhbCArPSBkdXJhdGlvbjtcbiAgICAgIGlmIChtaW4gPT09IHVuZGVmaW5lZCB8fCBkdXJhdGlvbiA8IG1pbikge1xuICAgICAgICBtaW4gPSBkdXJhdGlvbjtcbiAgICAgIH1cbiAgICAgIGlmIChtYXggPT09IHVuZGVmaW5lZCB8fCBkdXJhdGlvbiA+IG1heCkge1xuICAgICAgICBtYXggPSBkdXJhdGlvbjtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgYXZlcmFnZSA9IHRvdGFsIC8gZHVyYXRpb25zLmxlbmd0aDtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYERVUkFUSU9OWyR7bmFtZX1dOiAke3RvdGFsLnRvRml4ZWQoOSl9cyBbY291bnQ6ICR7ZHVyYXRpb25zLmxlbmd0aH07IGF2ZzogJHthdmVyYWdlLnRvRml4ZWQoXG4gICAgICAgIDksXG4gICAgICApfXM7IG1pbjogJHttaW4/LnRvRml4ZWQoOSl9czsgbWF4OiAke21heD8udG9GaXhlZCg5KX1zXWAsXG4gICAgKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWNvcmREdXJhdGlvbihuYW1lOiBzdHJpbmcsIHN0YXJ0VGltZTogYmlnaW50LCBjdW11bGF0aXZlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBkdXJhdGlvbiA9IE51bWJlcihwcm9jZXNzLmhydGltZS5iaWdpbnQoKSAtIHN0YXJ0VGltZSkgLyAxMCAqKiA5O1xuICBpZiAoY3VtdWxhdGl2ZSkge1xuICAgIGN1bXVsYXRpdmVEdXJhdGlvbnMgPz89IG5ldyBNYXA8c3RyaW5nLCBudW1iZXJbXT4oKTtcbiAgICBjb25zdCBkdXJhdGlvbnMgPSBjdW11bGF0aXZlRHVyYXRpb25zLmdldChuYW1lKSA/PyBbXTtcbiAgICBkdXJhdGlvbnMucHVzaChkdXJhdGlvbik7XG4gICAgY3VtdWxhdGl2ZUR1cmF0aW9ucy5zZXQobmFtZSwgZHVyYXRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKGBEVVJBVElPTlske25hbWV9XTogJHtkdXJhdGlvbi50b0ZpeGVkKDkpfXNgKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJvZmlsZUFzeW5jPFQ+KFxuICBuYW1lOiBzdHJpbmcsXG4gIGFjdGlvbjogKCkgPT4gUHJvbWlzZTxUPixcbiAgY3VtdWxhdGl2ZT86IGJvb2xlYW4sXG4pOiBQcm9taXNlPFQ+IHtcbiAgaWYgKCFkZWJ1Z1BlcmZvcm1hbmNlKSB7XG4gICAgcmV0dXJuIGFjdGlvbigpO1xuICB9XG5cbiAgY29uc3Qgc3RhcnRUaW1lID0gcHJvY2Vzcy5ocnRpbWUuYmlnaW50KCk7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IGFjdGlvbigpO1xuICB9IGZpbmFsbHkge1xuICAgIHJlY29yZER1cmF0aW9uKG5hbWUsIHN0YXJ0VGltZSwgY3VtdWxhdGl2ZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb2ZpbGVTeW5jPFQ+KG5hbWU6IHN0cmluZywgYWN0aW9uOiAoKSA9PiBULCBjdW11bGF0aXZlPzogYm9vbGVhbik6IFQge1xuICBpZiAoIWRlYnVnUGVyZm9ybWFuY2UpIHtcbiAgICByZXR1cm4gYWN0aW9uKCk7XG4gIH1cblxuICBjb25zdCBzdGFydFRpbWUgPSBwcm9jZXNzLmhydGltZS5iaWdpbnQoKTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYWN0aW9uKCk7XG4gIH0gZmluYWxseSB7XG4gICAgcmVjb3JkRHVyYXRpb24obmFtZSwgc3RhcnRUaW1lLCBjdW11bGF0aXZlKTtcbiAgfVxufVxuIl19