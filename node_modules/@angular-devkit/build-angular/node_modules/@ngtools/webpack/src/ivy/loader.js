"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.angularWebpackLoader = void 0;
const path = __importStar(require("path"));
const symbol_1 = require("./symbol");
const JS_FILE_REGEXP = /\.[cm]?js$/;
function angularWebpackLoader(content, map) {
    const callback = this.async();
    if (!callback) {
        throw new Error('Invalid webpack version');
    }
    const fileEmitter = this[symbol_1.AngularPluginSymbol];
    if (!fileEmitter || typeof fileEmitter !== 'object') {
        if (JS_FILE_REGEXP.test(this.resourcePath)) {
            // Passthrough for JS files when no plugin is used
            this.callback(undefined, content, map);
            return;
        }
        callback(new Error('The Angular Webpack loader requires the AngularWebpackPlugin.'));
        return;
    }
    fileEmitter
        .emit(this.resourcePath)
        .then((result) => {
        if (!result) {
            if (JS_FILE_REGEXP.test(this.resourcePath)) {
                // Return original content for JS files if not compiled by TypeScript ("allowJs")
                this.callback(undefined, content, map);
            }
            else {
                // File is not part of the compilation
                const message = `${this.resourcePath} is missing from the TypeScript compilation. ` +
                    `Please make sure it is in your tsconfig via the 'files' or 'include' property.`;
                callback(new Error(message));
            }
            return;
        }
        result.dependencies.forEach((dependency) => this.addDependency(dependency));
        let resultContent = result.content || '';
        let resultMap;
        if (result.map) {
            resultContent = resultContent.replace(/^\/\/# sourceMappingURL=[^\r\n]*/gm, '');
            resultMap = JSON.parse(result.map);
            resultMap.sources = resultMap.sources.map((source) => path.join(path.dirname(this.resourcePath), source));
        }
        callback(undefined, resultContent, resultMap);
    })
        .catch((err) => {
        // The below is needed to hide stacktraces from users.
        const message = err instanceof Error ? err.message : err;
        callback(new Error(message));
    });
}
exports.angularWebpackLoader = angularWebpackLoader;
exports.default = angularWebpackLoader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbmd0b29scy93ZWJwYWNrL3NyYy9pdnkvbG9hZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsMkNBQTZCO0FBRTdCLHFDQUFzRTtBQUV0RSxNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUM7QUFFcEMsU0FBZ0Isb0JBQW9CLENBQStCLE9BQWUsRUFBRSxHQUFXO0lBQzdGLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUM5QixJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0tBQzVDO0lBRUQsTUFBTSxXQUFXLEdBQ2YsSUFDRCxDQUFDLDRCQUFtQixDQUFDLENBQUM7SUFDdkIsSUFBSSxDQUFDLFdBQVcsSUFBSSxPQUFPLFdBQVcsS0FBSyxRQUFRLEVBQUU7UUFDbkQsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUMxQyxrREFBa0Q7WUFDbEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRXZDLE9BQU87U0FDUjtRQUVELFFBQVEsQ0FBQyxJQUFJLEtBQUssQ0FBQywrREFBK0QsQ0FBQyxDQUFDLENBQUM7UUFFckYsT0FBTztLQUNSO0lBRUQsV0FBVztTQUNSLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO1NBQ3ZCLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQ2YsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUU7Z0JBQzFDLGlGQUFpRjtnQkFDakYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQ3hDO2lCQUFNO2dCQUNMLHNDQUFzQztnQkFDdEMsTUFBTSxPQUFPLEdBQ1gsR0FBRyxJQUFJLENBQUMsWUFBWSwrQ0FBK0M7b0JBQ25FLGdGQUFnRixDQUFDO2dCQUNuRixRQUFRLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzthQUM5QjtZQUVELE9BQU87U0FDUjtRQUVELE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFNUUsSUFBSSxhQUFhLEdBQUcsTUFBTSxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7UUFDekMsSUFBSSxTQUFTLENBQUM7UUFDZCxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUU7WUFDZCxhQUFhLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxvQ0FBb0MsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNoRixTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkMsU0FBUyxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQWMsRUFBRSxFQUFFLENBQzNELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQ25ELENBQUM7U0FDSDtRQUVELFFBQVEsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2hELENBQUMsQ0FBQztTQUNELEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQ2Isc0RBQXNEO1FBQ3RELE1BQU0sT0FBTyxHQUFHLEdBQUcsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUN6RCxRQUFRLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUMvQixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUEzREQsb0RBMkRDO0FBRWdDLHVDQUFPIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdHlwZSB7IExvYWRlckNvbnRleHQgfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IEFuZ3VsYXJQbHVnaW5TeW1ib2wsIEZpbGVFbWl0dGVyQ29sbGVjdGlvbiB9IGZyb20gJy4vc3ltYm9sJztcblxuY29uc3QgSlNfRklMRV9SRUdFWFAgPSAvXFwuW2NtXT9qcyQvO1xuXG5leHBvcnQgZnVuY3Rpb24gYW5ndWxhcldlYnBhY2tMb2FkZXIodGhpczogTG9hZGVyQ29udGV4dDx1bmtub3duPiwgY29udGVudDogc3RyaW5nLCBtYXA6IHN0cmluZykge1xuICBjb25zdCBjYWxsYmFjayA9IHRoaXMuYXN5bmMoKTtcbiAgaWYgKCFjYWxsYmFjaykge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB3ZWJwYWNrIHZlcnNpb24nKTtcbiAgfVxuXG4gIGNvbnN0IGZpbGVFbWl0dGVyID0gKFxuICAgIHRoaXMgYXMgTG9hZGVyQ29udGV4dDx1bmtub3duPiAmIHsgW0FuZ3VsYXJQbHVnaW5TeW1ib2xdPzogRmlsZUVtaXR0ZXJDb2xsZWN0aW9uIH1cbiAgKVtBbmd1bGFyUGx1Z2luU3ltYm9sXTtcbiAgaWYgKCFmaWxlRW1pdHRlciB8fCB0eXBlb2YgZmlsZUVtaXR0ZXIgIT09ICdvYmplY3QnKSB7XG4gICAgaWYgKEpTX0ZJTEVfUkVHRVhQLnRlc3QodGhpcy5yZXNvdXJjZVBhdGgpKSB7XG4gICAgICAvLyBQYXNzdGhyb3VnaCBmb3IgSlMgZmlsZXMgd2hlbiBubyBwbHVnaW4gaXMgdXNlZFxuICAgICAgdGhpcy5jYWxsYmFjayh1bmRlZmluZWQsIGNvbnRlbnQsIG1hcCk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ1RoZSBBbmd1bGFyIFdlYnBhY2sgbG9hZGVyIHJlcXVpcmVzIHRoZSBBbmd1bGFyV2VicGFja1BsdWdpbi4nKSk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICBmaWxlRW1pdHRlclxuICAgIC5lbWl0KHRoaXMucmVzb3VyY2VQYXRoKVxuICAgIC50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgIGlmIChKU19GSUxFX1JFR0VYUC50ZXN0KHRoaXMucmVzb3VyY2VQYXRoKSkge1xuICAgICAgICAgIC8vIFJldHVybiBvcmlnaW5hbCBjb250ZW50IGZvciBKUyBmaWxlcyBpZiBub3QgY29tcGlsZWQgYnkgVHlwZVNjcmlwdCAoXCJhbGxvd0pzXCIpXG4gICAgICAgICAgdGhpcy5jYWxsYmFjayh1bmRlZmluZWQsIGNvbnRlbnQsIG1hcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gRmlsZSBpcyBub3QgcGFydCBvZiB0aGUgY29tcGlsYXRpb25cbiAgICAgICAgICBjb25zdCBtZXNzYWdlID1cbiAgICAgICAgICAgIGAke3RoaXMucmVzb3VyY2VQYXRofSBpcyBtaXNzaW5nIGZyb20gdGhlIFR5cGVTY3JpcHQgY29tcGlsYXRpb24uIGAgK1xuICAgICAgICAgICAgYFBsZWFzZSBtYWtlIHN1cmUgaXQgaXMgaW4geW91ciB0c2NvbmZpZyB2aWEgdGhlICdmaWxlcycgb3IgJ2luY2x1ZGUnIHByb3BlcnR5LmA7XG4gICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKG1lc3NhZ2UpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0LmRlcGVuZGVuY2llcy5mb3JFYWNoKChkZXBlbmRlbmN5KSA9PiB0aGlzLmFkZERlcGVuZGVuY3koZGVwZW5kZW5jeSkpO1xuXG4gICAgICBsZXQgcmVzdWx0Q29udGVudCA9IHJlc3VsdC5jb250ZW50IHx8ICcnO1xuICAgICAgbGV0IHJlc3VsdE1hcDtcbiAgICAgIGlmIChyZXN1bHQubWFwKSB7XG4gICAgICAgIHJlc3VsdENvbnRlbnQgPSByZXN1bHRDb250ZW50LnJlcGxhY2UoL15cXC9cXC8jIHNvdXJjZU1hcHBpbmdVUkw9W15cXHJcXG5dKi9nbSwgJycpO1xuICAgICAgICByZXN1bHRNYXAgPSBKU09OLnBhcnNlKHJlc3VsdC5tYXApO1xuICAgICAgICByZXN1bHRNYXAuc291cmNlcyA9IHJlc3VsdE1hcC5zb3VyY2VzLm1hcCgoc291cmNlOiBzdHJpbmcpID0+XG4gICAgICAgICAgcGF0aC5qb2luKHBhdGguZGlybmFtZSh0aGlzLnJlc291cmNlUGF0aCksIHNvdXJjZSksXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgcmVzdWx0Q29udGVudCwgcmVzdWx0TWFwKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAvLyBUaGUgYmVsb3cgaXMgbmVlZGVkIHRvIGhpZGUgc3RhY2t0cmFjZXMgZnJvbSB1c2Vycy5cbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogZXJyO1xuICAgICAgY2FsbGJhY2sobmV3IEVycm9yKG1lc3NhZ2UpKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHsgYW5ndWxhcldlYnBhY2tMb2FkZXIgYXMgZGVmYXVsdCB9O1xuIl19