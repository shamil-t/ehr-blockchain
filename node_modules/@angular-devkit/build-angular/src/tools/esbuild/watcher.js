"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWatcher = exports.ChangedFiles = void 0;
const chokidar_1 = require("chokidar");
class ChangedFiles {
    constructor() {
        this.added = new Set();
        this.modified = new Set();
        this.removed = new Set();
    }
    toDebugString() {
        const content = {
            added: Array.from(this.added),
            modified: Array.from(this.modified),
            removed: Array.from(this.removed),
        };
        return JSON.stringify(content, null, 2);
    }
}
exports.ChangedFiles = ChangedFiles;
function createWatcher(options) {
    const watcher = new chokidar_1.FSWatcher({
        usePolling: options?.polling,
        interval: options?.interval,
        ignored: options?.ignored,
        disableGlobbing: true,
        ignoreInitial: true,
    });
    const nextQueue = [];
    let currentChanges;
    let nextWaitTimeout;
    watcher.on('all', (event, path) => {
        switch (event) {
            case 'add':
                currentChanges ?? (currentChanges = new ChangedFiles());
                currentChanges.added.add(path);
                break;
            case 'change':
                currentChanges ?? (currentChanges = new ChangedFiles());
                currentChanges.modified.add(path);
                break;
            case 'unlink':
                currentChanges ?? (currentChanges = new ChangedFiles());
                currentChanges.removed.add(path);
                break;
            default:
                return;
        }
        // Wait 250ms from next change to better capture groups of file save operations.
        if (!nextWaitTimeout) {
            nextWaitTimeout = setTimeout(() => {
                nextWaitTimeout = undefined;
                const next = nextQueue.shift();
                if (next) {
                    const value = currentChanges;
                    currentChanges = undefined;
                    next(value);
                }
            }, 250);
            nextWaitTimeout?.unref();
        }
    });
    return {
        [Symbol.asyncIterator]() {
            return this;
        },
        async next() {
            if (currentChanges && nextQueue.length === 0) {
                const result = { value: currentChanges };
                currentChanges = undefined;
                return result;
            }
            return new Promise((resolve) => {
                nextQueue.push((value) => resolve(value ? { value } : { done: true, value }));
            });
        },
        add(paths) {
            watcher.add(paths);
        },
        remove(paths) {
            watcher.unwatch(paths);
        },
        async close() {
            try {
                await watcher.close();
                if (nextWaitTimeout) {
                    clearTimeout(nextWaitTimeout);
                }
            }
            finally {
                let next;
                while ((next = nextQueue.shift()) !== undefined) {
                    next();
                }
            }
        },
    };
}
exports.createWatcher = createWatcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Rvb2xzL2VzYnVpbGQvd2F0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCx1Q0FBcUM7QUFFckMsTUFBYSxZQUFZO0lBQXpCO1FBQ1csVUFBSyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFDMUIsYUFBUSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFDN0IsWUFBTyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7SUFXdkMsQ0FBQztJQVRDLGFBQWE7UUFDWCxNQUFNLE9BQU8sR0FBRztZQUNkLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDN0IsUUFBUSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNuQyxPQUFPLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ2xDLENBQUM7UUFFRixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0NBQ0Y7QUFkRCxvQ0FjQztBQVFELFNBQWdCLGFBQWEsQ0FBQyxPQUk3QjtJQUNDLE1BQU0sT0FBTyxHQUFHLElBQUksb0JBQVMsQ0FBQztRQUM1QixVQUFVLEVBQUUsT0FBTyxFQUFFLE9BQU87UUFDNUIsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRO1FBQzNCLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTztRQUN6QixlQUFlLEVBQUUsSUFBSTtRQUNyQixhQUFhLEVBQUUsSUFBSTtLQUNwQixDQUFDLENBQUM7SUFFSCxNQUFNLFNBQVMsR0FBdUMsRUFBRSxDQUFDO0lBQ3pE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QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBGU1dhdGNoZXIgfSBmcm9tICdjaG9raWRhcic7XG5cbmV4cG9ydCBjbGFzcyBDaGFuZ2VkRmlsZXMge1xuICByZWFkb25seSBhZGRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICByZWFkb25seSBtb2RpZmllZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICByZWFkb25seSByZW1vdmVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgdG9EZWJ1Z1N0cmluZygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbnRlbnQgPSB7XG4gICAgICBhZGRlZDogQXJyYXkuZnJvbSh0aGlzLmFkZGVkKSxcbiAgICAgIG1vZGlmaWVkOiBBcnJheS5mcm9tKHRoaXMubW9kaWZpZWQpLFxuICAgICAgcmVtb3ZlZDogQXJyYXkuZnJvbSh0aGlzLnJlbW92ZWQpLFxuICAgIH07XG5cbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoY29udGVudCwgbnVsbCwgMik7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBCdWlsZFdhdGNoZXIgZXh0ZW5kcyBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8Q2hhbmdlZEZpbGVzPiB7XG4gIGFkZChwYXRoczogc3RyaW5nIHwgcmVhZG9ubHkgc3RyaW5nW10pOiB2b2lkO1xuICByZW1vdmUocGF0aHM6IHN0cmluZyB8IHJlYWRvbmx5IHN0cmluZ1tdKTogdm9pZDtcbiAgY2xvc2UoKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVdhdGNoZXIob3B0aW9ucz86IHtcbiAgcG9sbGluZz86IGJvb2xlYW47XG4gIGludGVydmFsPzogbnVtYmVyO1xuICBpZ25vcmVkPzogc3RyaW5nW107XG59KTogQnVpbGRXYXRjaGVyIHtcbiAgY29uc3Qgd2F0Y2hlciA9IG5ldyBGU1dhdGNoZXIoe1xuICAgIHVzZVBvbGxpbmc6IG9wdGlvbnM/LnBvbGxpbmcsXG4gICAgaW50ZXJ2YWw6IG9wdGlvbnM/LmludGVydmFsLFxuICAgIGlnbm9yZWQ6IG9wdGlvbnM/Lmlnbm9yZWQsXG4gICAgZGlzYWJsZUdsb2JiaW5nOiB0cnVlLFxuICAgIGlnbm9yZUluaXRpYWw6IHRydWUsXG4gIH0pO1xuXG4gIGNvbnN0IG5leHRRdWV1ZTogKCh2YWx1ZT86IENoYW5nZWRGaWxlcykgPT4gdm9pZClbXSA9IFtdO1xuICBsZXQgY3VycmVudENoYW5nZXM6IENoYW5nZWRGaWxlcyB8IHVuZGVmaW5lZDtcbiAgbGV0IG5leHRXYWl0VGltZW91dDogTm9kZUpTLlRpbWVvdXQgfCB1bmRlZmluZWQ7XG5cbiAgd2F0Y2hlci5vbignYWxsJywgKGV2ZW50LCBwYXRoKSA9PiB7XG4gICAgc3dpdGNoIChldmVudCkge1xuICAgICAgY2FzZSAnYWRkJzpcbiAgICAgICAgY3VycmVudENoYW5nZXMgPz89IG5ldyBDaGFuZ2VkRmlsZXMoKTtcbiAgICAgICAgY3VycmVudENoYW5nZXMuYWRkZWQuYWRkKHBhdGgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2NoYW5nZSc6XG4gICAgICAgIGN1cnJlbnRDaGFuZ2VzID8/PSBuZXcgQ2hhbmdlZEZpbGVzKCk7XG4gICAgICAgIGN1cnJlbnRDaGFuZ2VzLm1vZGlmaWVkLmFkZChwYXRoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd1bmxpbmsnOlxuICAgICAgICBjdXJyZW50Q2hhbmdlcyA/Pz0gbmV3IENoYW5nZWRGaWxlcygpO1xuICAgICAgICBjdXJyZW50Q2hhbmdlcy5yZW1vdmVkLmFkZChwYXRoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2FpdCAyNTBtcyBmcm9tIG5leHQgY2hhbmdlIHRvIGJldHRlciBjYXB0dXJlIGdyb3VwcyBvZiBmaWxlIHNhdmUgb3BlcmF0aW9ucy5cbiAgICBpZiAoIW5leHRXYWl0VGltZW91dCkge1xuICAgICAgbmV4dFdhaXRUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIG5leHRXYWl0VGltZW91dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgbmV4dCA9IG5leHRRdWV1ZS5zaGlmdCgpO1xuICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gY3VycmVudENoYW5nZXM7XG4gICAgICAgICAgY3VycmVudENoYW5nZXMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgbmV4dCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0sIDI1MCk7XG4gICAgICBuZXh0V2FpdFRpbWVvdXQ/LnVucmVmKCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4ge1xuICAgIFtTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgYXN5bmMgbmV4dCgpIHtcbiAgICAgIGlmIChjdXJyZW50Q2hhbmdlcyAmJiBuZXh0UXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgdmFsdWU6IGN1cnJlbnRDaGFuZ2VzIH07XG4gICAgICAgIGN1cnJlbnRDaGFuZ2VzID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICBuZXh0UXVldWUucHVzaCgodmFsdWUpID0+IHJlc29sdmUodmFsdWUgPyB7IHZhbHVlIH0gOiB7IGRvbmU6IHRydWUsIHZhbHVlIH0pKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBhZGQocGF0aHMpIHtcbiAgICAgIHdhdGNoZXIuYWRkKHBhdGhzKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlKHBhdGhzKSB7XG4gICAgICB3YXRjaGVyLnVud2F0Y2gocGF0aHMpO1xuICAgIH0sXG5cbiAgICBhc3luYyBjbG9zZSgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHdhdGNoZXIuY2xvc2UoKTtcbiAgICAgICAgaWYgKG5leHRXYWl0VGltZW91dCkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChuZXh0V2FpdFRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBsZXQgbmV4dDtcbiAgICAgICAgd2hpbGUgKChuZXh0ID0gbmV4dFF1ZXVlLnNoaWZ0KCkpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICB9O1xufVxuIl19