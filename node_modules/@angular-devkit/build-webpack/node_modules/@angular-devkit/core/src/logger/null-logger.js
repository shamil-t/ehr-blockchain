"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullLogger = void 0;
const rxjs_1 = require("rxjs");
const logger_1 = require("./logger");
class NullLogger extends logger_1.Logger {
    constructor(parent = null) {
        super('', parent);
        this._observable = rxjs_1.EMPTY;
    }
    asApi() {
        return {
            createChild: () => new NullLogger(this),
            log() { },
            debug() { },
            info() { },
            warn() { },
            error() { },
            fatal() { },
        };
    }
}
exports.NullLogger = NullLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbC1sb2dnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy9sb2dnZXIvbnVsbC1sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0JBQTZCO0FBQzdCLHFDQUE2QztBQUU3QyxNQUFhLFVBQVcsU0FBUSxlQUFNO0lBQ3BDLFlBQVksU0FBd0IsSUFBSTtRQUN0QyxLQUFLLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxXQUFXLEdBQUcsWUFBSyxDQUFDO0lBQzNCLENBQUM7SUFFUSxLQUFLO1FBQ1osT0FBTztZQUNMLFdBQVcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUM7WUFDdkMsR0FBRyxLQUFJLENBQUM7WUFDUixLQUFLLEtBQUksQ0FBQztZQUNWLElBQUksS0FBSSxDQUFDO1lBQ1QsSUFBSSxLQUFJLENBQUM7WUFDVCxLQUFLLEtBQUksQ0FBQztZQUNWLEtBQUssS0FBSSxDQUFDO1NBQ0UsQ0FBQztJQUNqQixDQUFDO0NBQ0Y7QUFqQkQsZ0NBaUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEVNUFRZIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBMb2dnZXIsIExvZ2dlckFwaSB9IGZyb20gJy4vbG9nZ2VyJztcblxuZXhwb3J0IGNsYXNzIE51bGxMb2dnZXIgZXh0ZW5kcyBMb2dnZXIge1xuICBjb25zdHJ1Y3RvcihwYXJlbnQ6IExvZ2dlciB8IG51bGwgPSBudWxsKSB7XG4gICAgc3VwZXIoJycsIHBhcmVudCk7XG4gICAgdGhpcy5fb2JzZXJ2YWJsZSA9IEVNUFRZO1xuICB9XG5cbiAgb3ZlcnJpZGUgYXNBcGkoKTogTG9nZ2VyQXBpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY3JlYXRlQ2hpbGQ6ICgpID0+IG5ldyBOdWxsTG9nZ2VyKHRoaXMpLFxuICAgICAgbG9nKCkge30sXG4gICAgICBkZWJ1ZygpIHt9LFxuICAgICAgaW5mbygpIHt9LFxuICAgICAgd2FybigpIHt9LFxuICAgICAgZXJyb3IoKSB7fSxcbiAgICAgIGZhdGFsKCkge30sXG4gICAgfSBhcyBMb2dnZXJBcGk7XG4gIH1cbn1cbiJdfQ==