"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndentLogger = void 0;
const rxjs_1 = require("rxjs");
const logger_1 = require("./logger");
/**
 * Keep an map of indentation => array of indentations based on the level.
 * This is to optimize calculating the prefix based on the indentation itself. Since most logs
 * come from similar levels, and with similar indentation strings, this will be shared by all
 * loggers. Also, string concatenation is expensive so performing concats for every log entries
 * is expensive; this alleviates it.
 */
const indentationMap = {};
class IndentLogger extends logger_1.Logger {
    constructor(name, parent = null, indentation = '  ') {
        super(name, parent);
        indentationMap[indentation] = indentationMap[indentation] || [''];
        const indentMap = indentationMap[indentation];
        this._observable = this._observable.pipe((0, rxjs_1.map)((entry) => {
            const l = entry.path.filter((x) => !!x).length;
            if (l >= indentMap.length) {
                let current = indentMap[indentMap.length - 1];
                while (l >= indentMap.length) {
                    current += indentation;
                    indentMap.push(current);
                }
            }
            entry.message = indentMap[l] + entry.message.split(/\n/).join('\n' + indentMap[l]);
            return entry;
        }));
    }
}
exports.IndentLogger = IndentLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvbG9nZ2VyL2luZGVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQkFBMkI7QUFDM0IscUNBQWtDO0FBRWxDOzs7Ozs7R0FNRztBQUNILE1BQU0sY0FBYyxHQUE0QyxFQUFFLENBQUM7QUFFbkUsTUFBYSxZQUFhLFNBQVEsZUFBTTtJQUN0QyxZQUFZLElBQVksRUFBRSxTQUF3QixJQUFJLEVBQUUsV0FBVyxHQUFHLElBQUk7UUFDeEUsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVwQixjQUFjLENBQUMsV0FBVyxDQUFDLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEUsTUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTlDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQ3RDLElBQUEsVUFBRyxFQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDWixNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUMvQyxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUN6QixJQUFJLE9BQU8sR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDOUMsT0FBTyxDQUFDLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRTtvQkFDNUIsT0FBTyxJQUFJLFdBQVcsQ0FBQztvQkFDdkIsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDekI7YUFDRjtZQUVELEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbkYsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBeEJELG9DQXdCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBtYXAgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4vbG9nZ2VyJztcblxuLyoqXG4gKiBLZWVwIGFuIG1hcCBvZiBpbmRlbnRhdGlvbiA9PiBhcnJheSBvZiBpbmRlbnRhdGlvbnMgYmFzZWQgb24gdGhlIGxldmVsLlxuICogVGhpcyBpcyB0byBvcHRpbWl6ZSBjYWxjdWxhdGluZyB0aGUgcHJlZml4IGJhc2VkIG9uIHRoZSBpbmRlbnRhdGlvbiBpdHNlbGYuIFNpbmNlIG1vc3QgbG9nc1xuICogY29tZSBmcm9tIHNpbWlsYXIgbGV2ZWxzLCBhbmQgd2l0aCBzaW1pbGFyIGluZGVudGF0aW9uIHN0cmluZ3MsIHRoaXMgd2lsbCBiZSBzaGFyZWQgYnkgYWxsXG4gKiBsb2dnZXJzLiBBbHNvLCBzdHJpbmcgY29uY2F0ZW5hdGlvbiBpcyBleHBlbnNpdmUgc28gcGVyZm9ybWluZyBjb25jYXRzIGZvciBldmVyeSBsb2cgZW50cmllc1xuICogaXMgZXhwZW5zaXZlOyB0aGlzIGFsbGV2aWF0ZXMgaXQuXG4gKi9cbmNvbnN0IGluZGVudGF0aW9uTWFwOiB7IFtpbmRlbnRhdGlvblR5cGU6IHN0cmluZ106IHN0cmluZ1tdIH0gPSB7fTtcblxuZXhwb3J0IGNsYXNzIEluZGVudExvZ2dlciBleHRlbmRzIExvZ2dlciB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgcGFyZW50OiBMb2dnZXIgfCBudWxsID0gbnVsbCwgaW5kZW50YXRpb24gPSAnICAnKSB7XG4gICAgc3VwZXIobmFtZSwgcGFyZW50KTtcblxuICAgIGluZGVudGF0aW9uTWFwW2luZGVudGF0aW9uXSA9IGluZGVudGF0aW9uTWFwW2luZGVudGF0aW9uXSB8fCBbJyddO1xuICAgIGNvbnN0IGluZGVudE1hcCA9IGluZGVudGF0aW9uTWFwW2luZGVudGF0aW9uXTtcblxuICAgIHRoaXMuX29ic2VydmFibGUgPSB0aGlzLl9vYnNlcnZhYmxlLnBpcGUoXG4gICAgICBtYXAoKGVudHJ5KSA9PiB7XG4gICAgICAgIGNvbnN0IGwgPSBlbnRyeS5wYXRoLmZpbHRlcigoeCkgPT4gISF4KS5sZW5ndGg7XG4gICAgICAgIGlmIChsID49IGluZGVudE1hcC5sZW5ndGgpIHtcbiAgICAgICAgICBsZXQgY3VycmVudCA9IGluZGVudE1hcFtpbmRlbnRNYXAubGVuZ3RoIC0gMV07XG4gICAgICAgICAgd2hpbGUgKGwgPj0gaW5kZW50TWFwLmxlbmd0aCkge1xuICAgICAgICAgICAgY3VycmVudCArPSBpbmRlbnRhdGlvbjtcbiAgICAgICAgICAgIGluZGVudE1hcC5wdXNoKGN1cnJlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVudHJ5Lm1lc3NhZ2UgPSBpbmRlbnRNYXBbbF0gKyBlbnRyeS5tZXNzYWdlLnNwbGl0KC9cXG4vKS5qb2luKCdcXG4nICsgaW5kZW50TWFwW2xdKTtcblxuICAgICAgICByZXR1cm4gZW50cnk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG59XG4iXX0=