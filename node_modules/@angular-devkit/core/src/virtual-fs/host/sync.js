"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncDelegateHost = exports.SynchronousDelegateExpectedException = void 0;
const exception_1 = require("../../exception");
class SynchronousDelegateExpectedException extends exception_1.BaseException {
    constructor() {
        super(`Expected a synchronous delegate but got an asynchronous one.`);
    }
}
exports.SynchronousDelegateExpectedException = SynchronousDelegateExpectedException;
/**
 * Implement a synchronous-only host interface (remove the Observable parts).
 */
class SyncDelegateHost {
    constructor(_delegate) {
        this._delegate = _delegate;
        if (!_delegate.capabilities.synchronous) {
            throw new SynchronousDelegateExpectedException();
        }
    }
    _doSyncCall(observable) {
        let completed = false;
        let result = undefined;
        let errorResult = undefined;
        // Perf note: this is not using an observer object to avoid a performance penalty in RxJS.
        // See https://github.com/ReactiveX/rxjs/pull/5646 for details.
        observable.subscribe((x) => (result = x), (err) => (errorResult = err), () => (completed = true));
        if (errorResult !== undefined) {
            throw errorResult;
        }
        if (!completed) {
            throw new SynchronousDelegateExpectedException();
        }
        // The non-null operation is to work around `void` type. We don't allow to return undefined
        // but ResultT could be void, which is undefined in JavaScript, so this doesn't change the
        // behaviour.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return result;
    }
    get capabilities() {
        return this._delegate.capabilities;
    }
    get delegate() {
        return this._delegate;
    }
    write(path, content) {
        return this._doSyncCall(this._delegate.write(path, content));
    }
    read(path) {
        return this._doSyncCall(this._delegate.read(path));
    }
    delete(path) {
        return this._doSyncCall(this._delegate.delete(path));
    }
    rename(from, to) {
        return this._doSyncCall(this._delegate.rename(from, to));
    }
    list(path) {
        return this._doSyncCall(this._delegate.list(path));
    }
    exists(path) {
        return this._doSyncCall(this._delegate.exists(path));
    }
    isDirectory(path) {
        return this._doSyncCall(this._delegate.isDirectory(path));
    }
    isFile(path) {
        return this._doSyncCall(this._delegate.isFile(path));
    }
    // Some hosts may not support stat.
    stat(path) {
        const result = this._delegate.stat(path);
        if (result) {
            return this._doSyncCall(result);
        }
        else {
            return null;
        }
    }
    watch(path, options) {
        return this._delegate.watch(path, options);
    }
}
exports.SyncDelegateHost = SyncDelegateHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3luYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL3ZpcnR1YWwtZnMvaG9zdC9zeW5jLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUdILCtDQUFnRDtBQVloRCxNQUFhLG9DQUFxQyxTQUFRLHlCQUFhO0lBQ3JFO1FBQ0UsS0FBSyxDQUFDLDhEQUE4RCxDQUFDLENBQUM7SUFDeEUsQ0FBQztDQUNGO0FBSkQsb0ZBSUM7QUFFRDs7R0FFRztBQUNILE1BQWEsZ0JBQWdCO0lBQzNCLFlBQXNCLFNBQWtCO1FBQWxCLGNBQVMsR0FBVCxTQUFTLENBQVM7UUFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFO1lBQ3ZDLE1BQU0sSUFBSSxvQ0FBb0MsRUFBRSxDQUFDO1NBQ2xEO0lBQ0gsQ0FBQztJQUVTLFdBQVcsQ0FBVSxVQUErQjtRQUM1RCxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdEIsSUFBSSxNQUFNLEdBQXdCLFNBQVMsQ0FBQztRQUM1QyxJQUFJLFdBQVcsR0FBc0IsU0FBUyxDQUFDO1FBQy9DLDBGQUEwRjtRQUMxRiwrREFBK0Q7UUFDL0QsVUFBVSxDQUFDLFNBQVMsQ0FDbEIsQ0FBQyxDQUFVLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUM1QixDQUFDLEdBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLEVBQ25DLEdBQUcsRUFBRSxDQUFDLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUN6QixDQUFDO1FBRUYsSUFBSSxXQUFXLEtBQUssU0FBUyxFQUFFO1lBQzdCLE1BQU0sV0FBVyxDQUFDO1NBQ25CO1FBQ0QsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLE1BQU0sSUFBSSxvQ0FBb0MsRUFBRSxDQUFDO1NBQ2xEO1FBRUQsMkZBQTJGO1FBQzNGLDBGQUEwRjtRQUMxRixhQUFhO1FBQ2Isb0VBQW9FO1FBQ3BFLE9BQU8sTUFBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxJQUFJLFlBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDO0lBQ3JDLENBQUM7SUFDRCxJQUFJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDeEIsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFVLEVBQUUsT0FBdUI7UUFDdkMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFDRCxJQUFJLENBQUMsSUFBVTtRQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFDRCxNQUFNLENBQUMsSUFBVTtRQUNmLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFDRCxNQUFNLENBQUMsSUFBVSxFQUFFLEVBQVE7UUFDekIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRCxJQUFJLENBQUMsSUFBVTtRQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRCxNQUFNLENBQUMsSUFBVTtRQUNmLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFDRCxXQUFXLENBQUMsSUFBVTtRQUNwQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBQ0QsTUFBTSxDQUFDLElBQVU7UUFDZixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQsbUNBQW1DO0lBQ25DLElBQUksQ0FBQyxJQUFVO1FBQ2IsTUFBTSxNQUFNLEdBQXVDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTdFLElBQUksTUFBTSxFQUFFO1lBQ1YsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ2pDO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFVLEVBQUUsT0FBMEI7UUFDMUMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDN0MsQ0FBQztDQUNGO0FBakZELDRDQWlGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uIH0gZnJvbSAnLi4vLi4vZXhjZXB0aW9uJztcbmltcG9ydCB7IFBhdGgsIFBhdGhGcmFnbWVudCB9IGZyb20gJy4uL3BhdGgnO1xuaW1wb3J0IHtcbiAgRmlsZUJ1ZmZlcixcbiAgRmlsZUJ1ZmZlckxpa2UsXG4gIEhvc3QsXG4gIEhvc3RDYXBhYmlsaXRpZXMsXG4gIEhvc3RXYXRjaEV2ZW50LFxuICBIb3N0V2F0Y2hPcHRpb25zLFxuICBTdGF0cyxcbn0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuXG5leHBvcnQgY2xhc3MgU3luY2hyb25vdXNEZWxlZ2F0ZUV4cGVjdGVkRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKGBFeHBlY3RlZCBhIHN5bmNocm9ub3VzIGRlbGVnYXRlIGJ1dCBnb3QgYW4gYXN5bmNocm9ub3VzIG9uZS5gKTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudCBhIHN5bmNocm9ub3VzLW9ubHkgaG9zdCBpbnRlcmZhY2UgKHJlbW92ZSB0aGUgT2JzZXJ2YWJsZSBwYXJ0cykuXG4gKi9cbmV4cG9ydCBjbGFzcyBTeW5jRGVsZWdhdGVIb3N0PFQgZXh0ZW5kcyBvYmplY3QgPSB7fT4ge1xuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX2RlbGVnYXRlOiBIb3N0PFQ+KSB7XG4gICAgaWYgKCFfZGVsZWdhdGUuY2FwYWJpbGl0aWVzLnN5bmNocm9ub3VzKSB7XG4gICAgICB0aHJvdyBuZXcgU3luY2hyb25vdXNEZWxlZ2F0ZUV4cGVjdGVkRXhjZXB0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIF9kb1N5bmNDYWxsPFJlc3VsdFQ+KG9ic2VydmFibGU6IE9ic2VydmFibGU8UmVzdWx0VD4pOiBSZXN1bHRUIHtcbiAgICBsZXQgY29tcGxldGVkID0gZmFsc2U7XG4gICAgbGV0IHJlc3VsdDogUmVzdWx0VCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBsZXQgZXJyb3JSZXN1bHQ6IEVycm9yIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIC8vIFBlcmYgbm90ZTogdGhpcyBpcyBub3QgdXNpbmcgYW4gb2JzZXJ2ZXIgb2JqZWN0IHRvIGF2b2lkIGEgcGVyZm9ybWFuY2UgcGVuYWx0eSBpbiBSeEpTLlxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vUmVhY3RpdmVYL3J4anMvcHVsbC81NjQ2IGZvciBkZXRhaWxzLlxuICAgIG9ic2VydmFibGUuc3Vic2NyaWJlKFxuICAgICAgKHg6IFJlc3VsdFQpID0+IChyZXN1bHQgPSB4KSxcbiAgICAgIChlcnI6IEVycm9yKSA9PiAoZXJyb3JSZXN1bHQgPSBlcnIpLFxuICAgICAgKCkgPT4gKGNvbXBsZXRlZCA9IHRydWUpLFxuICAgICk7XG5cbiAgICBpZiAoZXJyb3JSZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgZXJyb3JSZXN1bHQ7XG4gICAgfVxuICAgIGlmICghY29tcGxldGVkKSB7XG4gICAgICB0aHJvdyBuZXcgU3luY2hyb25vdXNEZWxlZ2F0ZUV4cGVjdGVkRXhjZXB0aW9uKCk7XG4gICAgfVxuXG4gICAgLy8gVGhlIG5vbi1udWxsIG9wZXJhdGlvbiBpcyB0byB3b3JrIGFyb3VuZCBgdm9pZGAgdHlwZS4gV2UgZG9uJ3QgYWxsb3cgdG8gcmV0dXJuIHVuZGVmaW5lZFxuICAgIC8vIGJ1dCBSZXN1bHRUIGNvdWxkIGJlIHZvaWQsIHdoaWNoIGlzIHVuZGVmaW5lZCBpbiBKYXZhU2NyaXB0LCBzbyB0aGlzIGRvZXNuJ3QgY2hhbmdlIHRoZVxuICAgIC8vIGJlaGF2aW91ci5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgIHJldHVybiByZXN1bHQhO1xuICB9XG5cbiAgZ2V0IGNhcGFiaWxpdGllcygpOiBIb3N0Q2FwYWJpbGl0aWVzIHtcbiAgICByZXR1cm4gdGhpcy5fZGVsZWdhdGUuY2FwYWJpbGl0aWVzO1xuICB9XG4gIGdldCBkZWxlZ2F0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVsZWdhdGU7XG4gIH1cblxuICB3cml0ZShwYXRoOiBQYXRoLCBjb250ZW50OiBGaWxlQnVmZmVyTGlrZSk6IHZvaWQge1xuICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHRoaXMuX2RlbGVnYXRlLndyaXRlKHBhdGgsIGNvbnRlbnQpKTtcbiAgfVxuICByZWFkKHBhdGg6IFBhdGgpOiBGaWxlQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5fZG9TeW5jQ2FsbCh0aGlzLl9kZWxlZ2F0ZS5yZWFkKHBhdGgpKTtcbiAgfVxuICBkZWxldGUocGF0aDogUGF0aCk6IHZvaWQge1xuICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHRoaXMuX2RlbGVnYXRlLmRlbGV0ZShwYXRoKSk7XG4gIH1cbiAgcmVuYW1lKGZyb206IFBhdGgsIHRvOiBQYXRoKTogdm9pZCB7XG4gICAgcmV0dXJuIHRoaXMuX2RvU3luY0NhbGwodGhpcy5fZGVsZWdhdGUucmVuYW1lKGZyb20sIHRvKSk7XG4gIH1cblxuICBsaXN0KHBhdGg6IFBhdGgpOiBQYXRoRnJhZ21lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2RvU3luY0NhbGwodGhpcy5fZGVsZWdhdGUubGlzdChwYXRoKSk7XG4gIH1cblxuICBleGlzdHMocGF0aDogUGF0aCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHRoaXMuX2RlbGVnYXRlLmV4aXN0cyhwYXRoKSk7XG4gIH1cbiAgaXNEaXJlY3RvcnkocGF0aDogUGF0aCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHRoaXMuX2RlbGVnYXRlLmlzRGlyZWN0b3J5KHBhdGgpKTtcbiAgfVxuICBpc0ZpbGUocGF0aDogUGF0aCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kb1N5bmNDYWxsKHRoaXMuX2RlbGVnYXRlLmlzRmlsZShwYXRoKSk7XG4gIH1cblxuICAvLyBTb21lIGhvc3RzIG1heSBub3Qgc3VwcG9ydCBzdGF0LlxuICBzdGF0KHBhdGg6IFBhdGgpOiBTdGF0czxUPiB8IG51bGwge1xuICAgIGNvbnN0IHJlc3VsdDogT2JzZXJ2YWJsZTxTdGF0czxUPiB8IG51bGw+IHwgbnVsbCA9IHRoaXMuX2RlbGVnYXRlLnN0YXQocGF0aCk7XG5cbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICByZXR1cm4gdGhpcy5fZG9TeW5jQ2FsbChyZXN1bHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICB3YXRjaChwYXRoOiBQYXRoLCBvcHRpb25zPzogSG9zdFdhdGNoT3B0aW9ucyk6IE9ic2VydmFibGU8SG9zdFdhdGNoRXZlbnQ+IHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2RlbGVnYXRlLndhdGNoKHBhdGgsIG9wdGlvbnMpO1xuICB9XG59XG4iXX0=