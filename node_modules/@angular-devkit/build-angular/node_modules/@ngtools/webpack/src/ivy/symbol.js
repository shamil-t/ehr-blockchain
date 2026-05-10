"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _FileEmitterRegistration_fileEmitter, _FileEmitterCollection_registrations;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileEmitterCollection = exports.FileEmitterRegistration = exports.AngularPluginSymbol = void 0;
exports.AngularPluginSymbol = Symbol.for('@ngtools/webpack[angular-compiler]');
class FileEmitterRegistration {
    constructor() {
        _FileEmitterRegistration_fileEmitter.set(this, void 0);
    }
    update(emitter) {
        __classPrivateFieldSet(this, _FileEmitterRegistration_fileEmitter, emitter, "f");
    }
    emit(file) {
        if (!__classPrivateFieldGet(this, _FileEmitterRegistration_fileEmitter, "f")) {
            throw new Error('Emit attempted before Angular Webpack plugin initialization.');
        }
        return __classPrivateFieldGet(this, _FileEmitterRegistration_fileEmitter, "f").call(this, file);
    }
}
exports.FileEmitterRegistration = FileEmitterRegistration;
_FileEmitterRegistration_fileEmitter = new WeakMap();
class FileEmitterCollection {
    constructor() {
        _FileEmitterCollection_registrations.set(this, []);
    }
    register() {
        const registration = new FileEmitterRegistration();
        __classPrivateFieldGet(this, _FileEmitterCollection_registrations, "f").push(registration);
        return registration;
    }
    async emit(file) {
        if (__classPrivateFieldGet(this, _FileEmitterCollection_registrations, "f").length === 1) {
            return __classPrivateFieldGet(this, _FileEmitterCollection_registrations, "f")[0].emit(file);
        }
        for (const registration of __classPrivateFieldGet(this, _FileEmitterCollection_registrations, "f")) {
            const result = await registration.emit(file);
            if (result) {
                return result;
            }
        }
    }
}
exports.FileEmitterCollection = FileEmitterCollection;
_FileEmitterCollection_registrations = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ltYm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbmd0b29scy93ZWJwYWNrL3NyYy9pdnkvc3ltYm9sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7OztBQUVVLFFBQUEsbUJBQW1CLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO0FBV3BGLE1BQWEsdUJBQXVCO0lBQXBDO1FBQ0UsdURBQTJCO0lBYTdCLENBQUM7SUFYQyxNQUFNLENBQUMsT0FBb0I7UUFDekIsdUJBQUEsSUFBSSx3Q0FBZ0IsT0FBTyxNQUFBLENBQUM7SUFDOUIsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFZO1FBQ2YsSUFBSSxDQUFDLHVCQUFBLElBQUksNENBQWEsRUFBRTtZQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLDhEQUE4RCxDQUFDLENBQUM7U0FDakY7UUFFRCxPQUFPLHVCQUFBLElBQUksNENBQWEsTUFBakIsSUFBSSxFQUFjLElBQUksQ0FBQyxDQUFDO0lBQ2pDLENBQUM7Q0FDRjtBQWRELDBEQWNDOztBQUVELE1BQWEscUJBQXFCO0lBQWxDO1FBQ0UsK0NBQTRDLEVBQUUsRUFBQztJQXFCakQsQ0FBQztJQW5CQyxRQUFRO1FBQ04sTUFBTSxZQUFZLEdBQUcsSUFBSSx1QkFBdUIsRUFBRSxDQUFDO1FBQ25ELHVCQUFBLElBQUksNENBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFdkMsT0FBTyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWTtRQUNyQixJQUFJLHVCQUFBLElBQUksNENBQWUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3BDLE9BQU8sdUJBQUEsSUFBSSw0Q0FBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMxQztRQUVELEtBQUssTUFBTSxZQUFZLElBQUksdUJBQUEsSUFBSSw0Q0FBZSxFQUFFO1lBQzlDLE1BQU0sTUFBTSxHQUFHLE1BQU0sWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxJQUFJLE1BQU0sRUFBRTtnQkFDVixPQUFPLE1BQU0sQ0FBQzthQUNmO1NBQ0Y7SUFDSCxDQUFDO0NBQ0Y7QUF0QkQsc0RBc0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmV4cG9ydCBjb25zdCBBbmd1bGFyUGx1Z2luU3ltYm9sID0gU3ltYm9sLmZvcignQG5ndG9vbHMvd2VicGFja1thbmd1bGFyLWNvbXBpbGVyXScpO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVtaXRGaWxlUmVzdWx0IHtcbiAgY29udGVudD86IHN0cmluZztcbiAgbWFwPzogc3RyaW5nO1xuICBkZXBlbmRlbmNpZXM6IHJlYWRvbmx5IHN0cmluZ1tdO1xuICBoYXNoPzogVWludDhBcnJheTtcbn1cblxuZXhwb3J0IHR5cGUgRmlsZUVtaXR0ZXIgPSAoZmlsZTogc3RyaW5nKSA9PiBQcm9taXNlPEVtaXRGaWxlUmVzdWx0IHwgdW5kZWZpbmVkPjtcblxuZXhwb3J0IGNsYXNzIEZpbGVFbWl0dGVyUmVnaXN0cmF0aW9uIHtcbiAgI2ZpbGVFbWl0dGVyPzogRmlsZUVtaXR0ZXI7XG5cbiAgdXBkYXRlKGVtaXR0ZXI6IEZpbGVFbWl0dGVyKTogdm9pZCB7XG4gICAgdGhpcy4jZmlsZUVtaXR0ZXIgPSBlbWl0dGVyO1xuICB9XG5cbiAgZW1pdChmaWxlOiBzdHJpbmcpOiBQcm9taXNlPEVtaXRGaWxlUmVzdWx0IHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKCF0aGlzLiNmaWxlRW1pdHRlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFbWl0IGF0dGVtcHRlZCBiZWZvcmUgQW5ndWxhciBXZWJwYWNrIHBsdWdpbiBpbml0aWFsaXphdGlvbi4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy4jZmlsZUVtaXR0ZXIoZmlsZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZpbGVFbWl0dGVyQ29sbGVjdGlvbiB7XG4gICNyZWdpc3RyYXRpb25zOiBGaWxlRW1pdHRlclJlZ2lzdHJhdGlvbltdID0gW107XG5cbiAgcmVnaXN0ZXIoKTogRmlsZUVtaXR0ZXJSZWdpc3RyYXRpb24ge1xuICAgIGNvbnN0IHJlZ2lzdHJhdGlvbiA9IG5ldyBGaWxlRW1pdHRlclJlZ2lzdHJhdGlvbigpO1xuICAgIHRoaXMuI3JlZ2lzdHJhdGlvbnMucHVzaChyZWdpc3RyYXRpb24pO1xuXG4gICAgcmV0dXJuIHJlZ2lzdHJhdGlvbjtcbiAgfVxuXG4gIGFzeW5jIGVtaXQoZmlsZTogc3RyaW5nKTogUHJvbWlzZTxFbWl0RmlsZVJlc3VsdCB8IHVuZGVmaW5lZD4ge1xuICAgIGlmICh0aGlzLiNyZWdpc3RyYXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIHRoaXMuI3JlZ2lzdHJhdGlvbnNbMF0uZW1pdChmaWxlKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHJlZ2lzdHJhdGlvbiBvZiB0aGlzLiNyZWdpc3RyYXRpb25zKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZWdpc3RyYXRpb24uZW1pdChmaWxlKTtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==