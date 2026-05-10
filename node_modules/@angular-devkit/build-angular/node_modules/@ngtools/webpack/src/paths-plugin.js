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
exports.TypeScriptPathsPlugin = void 0;
const path = __importStar(require("path"));
class TypeScriptPathsPlugin {
    constructor(options) {
        if (options) {
            this.update(options);
        }
    }
    /**
     * Update the plugin with new path mapping option values.
     * The options will also be preprocessed to reduce the overhead of individual resolve actions
     * during a build.
     *
     * @param options The `paths` and `baseUrl` options from TypeScript's `CompilerOptions`.
     */
    update(options) {
        this.baseUrl = options.baseUrl;
        this.patterns = undefined;
        if (options.paths) {
            for (const [pattern, potentials] of Object.entries(options.paths)) {
                // Ignore any entries that would not result in a new mapping
                if (potentials.length === 0 || potentials.every((potential) => potential === '*')) {
                    continue;
                }
                const starIndex = pattern.indexOf('*');
                let prefix = pattern;
                let suffix;
                if (starIndex > -1) {
                    prefix = pattern.slice(0, starIndex);
                    if (starIndex < pattern.length - 1) {
                        suffix = pattern.slice(starIndex + 1);
                    }
                }
                this.patterns ?? (this.patterns = []);
                this.patterns.push({
                    starIndex,
                    prefix,
                    suffix,
                    potentials: potentials.map((potential) => {
                        const potentialStarIndex = potential.indexOf('*');
                        if (potentialStarIndex === -1) {
                            return { hasStar: false, prefix: potential };
                        }
                        return {
                            hasStar: true,
                            prefix: potential.slice(0, potentialStarIndex),
                            suffix: potentialStarIndex < potential.length - 1
                                ? potential.slice(potentialStarIndex + 1)
                                : undefined,
                        };
                    }),
                });
            }
            // Sort patterns so that exact matches take priority then largest prefix match
            this.patterns?.sort((a, b) => {
                if (a.starIndex === -1) {
                    return -1;
                }
                else if (b.starIndex === -1) {
                    return 1;
                }
                else {
                    return b.starIndex - a.starIndex;
                }
            });
        }
    }
    apply(resolver) {
        const target = resolver.ensureHook('resolve');
        // To support synchronous resolvers this hook cannot be promise based.
        // Webpack supports synchronous resolution with `tap` and `tapAsync` hooks.
        resolver
            .getHook('described-resolve')
            .tapAsync('TypeScriptPathsPlugin', (request, resolveContext, callback) => {
            // Preprocessing of the options will ensure that `patterns` is either undefined or has elements to check
            if (!this.patterns) {
                callback();
                return;
            }
            if (!request || request.typescriptPathMapped) {
                callback();
                return;
            }
            const originalRequest = request.request || request.path;
            if (!originalRequest) {
                callback();
                return;
            }
            // Only work on Javascript/TypeScript issuers.
            if (!request?.context?.issuer?.match(/\.[cm]?[jt]sx?$/)) {
                callback();
                return;
            }
            // Absolute requests are not mapped
            if (path.isAbsolute(originalRequest)) {
                callback();
                return;
            }
            switch (originalRequest[0]) {
                case '.':
                    // Relative requests are not mapped
                    callback();
                    return;
                case '!':
                    // Ignore all webpack special requests
                    if (originalRequest.length > 1 && originalRequest[1] === '!') {
                        callback();
                        return;
                    }
                    break;
            }
            // A generator is used to limit the amount of replacements requests that need to be created.
            // For example, if the first one resolves, any others are not needed and do not need
            // to be created.
            const requests = this.createReplacementRequests(request, originalRequest);
            const tryResolve = () => {
                const next = requests.next();
                if (next.done) {
                    callback();
                    return;
                }
                resolver.doResolve(target, next.value, '', resolveContext, (error, result) => {
                    if (error) {
                        callback(error);
                    }
                    else if (result) {
                        callback(undefined, result);
                    }
                    else {
                        tryResolve();
                    }
                });
            };
            tryResolve();
        });
    }
    *findReplacements(originalRequest) {
        if (!this.patterns) {
            return;
        }
        // check if any path mapping rules are relevant
        for (const { starIndex, prefix, suffix, potentials } of this.patterns) {
            let partial;
            if (starIndex === -1) {
                // No star means an exact match is required
                if (prefix === originalRequest) {
                    partial = '';
                }
            }
            else if (starIndex === 0 && !suffix) {
                // Everything matches a single wildcard pattern ("*")
                partial = originalRequest;
            }
            else if (!suffix) {
                // No suffix means the star is at the end of the pattern
                if (originalRequest.startsWith(prefix)) {
                    partial = originalRequest.slice(prefix.length);
                }
            }
            else {
                // Star was in the middle of the pattern
                if (originalRequest.startsWith(prefix) && originalRequest.endsWith(suffix)) {
                    partial = originalRequest.substring(prefix.length, originalRequest.length - suffix.length);
                }
            }
            // If request was not matched, move on to the next pattern
            if (partial === undefined) {
                continue;
            }
            // Create the full replacement values based on the original request and the potentials
            // for the successfully matched pattern.
            for (const { hasStar, prefix, suffix } of potentials) {
                let replacement = prefix;
                if (hasStar) {
                    replacement += partial;
                    if (suffix) {
                        replacement += suffix;
                    }
                }
                yield replacement;
            }
        }
    }
    *createReplacementRequests(request, originalRequest) {
        for (const replacement of this.findReplacements(originalRequest)) {
            const targetPath = path.resolve(this.baseUrl ?? '', replacement);
            // Resolution in the original callee location, but with the updated request
            // to point to the mapped target location.
            yield {
                ...request,
                request: targetPath,
                typescriptPathMapped: true,
            };
            // If there is no extension. i.e. the target does not refer to an explicit
            // file, then this is a candidate for module/package resolution.
            const canBeModule = path.extname(targetPath) === '';
            if (canBeModule) {
                // Resolution in the target location, preserving the original request.
                // This will work with the `resolve-in-package` resolution hook, supporting
                // package exports for e.g. locally-built APF libraries.
                yield {
                    ...request,
                    path: targetPath,
                    typescriptPathMapped: true,
                };
            }
        }
    }
}
exports.TypeScriptPathsPlugin = TypeScriptPathsPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aHMtcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbmd0b29scy93ZWJwYWNrL3NyYy9wYXRocy1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwyQ0FBNkI7QUF3QjdCLE1BQWEscUJBQXFCO0lBSWhDLFlBQVksT0FBc0M7UUFDaEQsSUFBSSxPQUFPLEVBQUU7WUFDWCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3RCO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILE1BQU0sQ0FBQyxPQUFxQztRQUMxQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7UUFFMUIsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFO1lBQ2pCLEtBQUssTUFBTSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDakUsNERBQTREO2dCQUM1RCxJQUFJLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLFNBQVMsS0FBSyxHQUFHLENBQUMsRUFBRTtvQkFDakYsU0FBUztpQkFDVjtnQkFFRCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUM7Z0JBQ3JCLElBQUksTUFBTSxDQUFDO2dCQUNYLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxFQUFFO29CQUNsQixNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUs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QU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxVQUFVLEVBQUU7Z0JBQ3BELElBQUksV0FBVyxHQUFHLE1BQU0sQ0FBQztnQkFFekIsSUFBSSxPQUFPLEVBQUU7b0JBQ1gsV0FBVyxJQUFJLE9BQU8sQ0FBQztvQkFDdkIsSUFBSSxNQUFNLEVBQUU7d0JBQ1YsV0FBVyxJQUFJLE1BQU0sQ0FBQztxQkFDdkI7aUJBQ0Y7Z0JBRUQsTUFBTSxXQUFXLENBQUM7YUFDbkI7U0FDRjtJQUNILENBQUM7SUFFRCxDQUFDLHlCQUF5QixDQUN4QixPQUFrQyxFQUNsQyxlQUF1QjtRQUV2QixLQUFLLE1BQU0sV0FBVyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUNoRSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2pFLDJFQUEyRTtZQUMzRSwwQ0FBMEM7WUFDMUMsTUFBTTtnQkFDSixHQUFHLE9BQU87Z0JBQ1YsT0FBTyxFQUFFLFVBQVU7Z0JBQ25CLG9CQUFvQixFQUFFLElBQUk7YUFDM0IsQ0FBQztZQUVGLDBFQUEwRTtZQUMxRSxnRUFBZ0U7WUFDaEUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDcEQsSUFBSSxXQUFXLEVBQUU7Z0JBQ2Ysc0VBQXNFO2dCQUN0RSwyRUFBMkU7Z0JBQzNFLHdEQUF3RDtnQkFDeEQsTUFBTTtvQkFDSixHQUFHLE9BQU87b0JBQ1YsSUFBSSxFQUFFLFVBQVU7b0JBQ2hCLG9CQUFvQixFQUFFLElBQUk7aUJBQzNCLENBQUM7YUFDSDtTQUNGO0lBQ0gsQ0FBQztDQUNGO0FBNVBELHNEQTRQQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQ29tcGlsZXJPcHRpb25zIH0gZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgdHlwZSB7IFJlc29sdmVyIH0gZnJvbSAnd2VicGFjayc7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZW1wdHktaW50ZXJmYWNlXG5leHBvcnQgaW50ZXJmYWNlIFR5cGVTY3JpcHRQYXRoc1BsdWdpbk9wdGlvbnMgZXh0ZW5kcyBQaWNrPENvbXBpbGVyT3B0aW9ucywgJ3BhdGhzJyB8ICdiYXNlVXJsJz4ge31cblxuLy8gRXh0cmFjdCBSZXNvbHZlclJlcXVlc3QgdHlwZSBmcm9tIFdlYnBhY2sgdHlwZXMgc2luY2UgaXQgaXMgbm90IGRpcmVjdGx5IGV4cG9ydGVkXG50eXBlIFJlc29sdmVyUmVxdWVzdCA9IE5vbk51bGxhYmxlPFBhcmFtZXRlcnM8UGFyYW1ldGVyczxSZXNvbHZlclsncmVzb2x2ZSddPls0XT5bMl0+O1xuXG5pbnRlcmZhY2UgUGF0aFBsdWdpblJlc29sdmVyUmVxdWVzdCBleHRlbmRzIFJlc29sdmVyUmVxdWVzdCB7XG4gIGNvbnRleHQ/OiB7XG4gICAgaXNzdWVyPzogc3RyaW5nO1xuICB9O1xuICB0eXBlc2NyaXB0UGF0aE1hcHBlZD86IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBQYXRoUGF0dGVybiB7XG4gIHN0YXJJbmRleDogbnVtYmVyO1xuICBwcmVmaXg6IHN0cmluZztcbiAgc3VmZml4Pzogc3RyaW5nO1xuICBwb3RlbnRpYWxzOiB7IGhhc1N0YXI6IGJvb2xlYW47IHByZWZpeDogc3RyaW5nOyBzdWZmaXg/OiBzdHJpbmcgfVtdO1xufVxuXG5leHBvcnQgY2xhc3MgVHlwZVNjcmlwdFBhdGhzUGx1Z2luIHtcbiAgcHJpdmF0ZSBiYXNlVXJsPzogc3RyaW5nO1xuICBwcml2YXRlIHBhdHRlcm5zPzogUGF0aFBhdHRlcm5bXTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zPzogVHlwZVNjcmlwdFBhdGhzUGx1Z2luT3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICB0aGlzLnVwZGF0ZShvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwbHVnaW4gd2l0aCBuZXcgcGF0aCBtYXBwaW5nIG9wdGlvbiB2YWx1ZXMuXG4gICAqIFRoZSBvcHRpb25zIHdpbGwgYWxzbyBiZSBwcmVwcm9jZXNzZWQgdG8gcmVkdWNlIHRoZSBvdmVyaGVhZCBvZiBpbmRpdmlkdWFsIHJlc29sdmUgYWN0aW9uc1xuICAgKiBkdXJpbmcgYSBidWlsZC5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnMgVGhlIGBwYXRoc2AgYW5kIGBiYXNlVXJsYCBvcHRpb25zIGZyb20gVHlwZVNjcmlwdCdzIGBDb21waWxlck9wdGlvbnNgLlxuICAgKi9cbiAgdXBkYXRlKG9wdGlvbnM6IFR5cGVTY3JpcHRQYXRoc1BsdWdpbk9wdGlvbnMpOiB2b2lkIHtcbiAgICB0aGlzLmJhc2VVcmwgPSBvcHRpb25zLmJhc2VVcmw7XG4gICAgdGhpcy5wYXR0ZXJucyA9IHVuZGVmaW5lZDtcblxuICAgIGlmIChvcHRpb25zLnBhdGhzKSB7XG4gICAgICBmb3IgKGNvbnN0IFtwYXR0ZXJuLCBwb3RlbnRpYWxzXSBvZiBPYmplY3QuZW50cmllcyhvcHRpb25zLnBhdGhzKSkge1xuICAgICAgICAvLyBJZ25vcmUgYW55IGVudHJpZXMgdGhhdCB3b3VsZCBub3QgcmVzdWx0IGluIGEgbmV3IG1hcHBpbmdcbiAgICAgICAgaWYgKHBvdGVudGlhbHMubGVuZ3RoID09PSAwIHx8IHBvdGVudGlhbHMuZXZlcnkoKHBvdGVudGlhbCkgPT4gcG90ZW50aWFsID09PSAnKicpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdGFySW5kZXggPSBwYXR0ZXJuLmluZGV4T2YoJyonKTtcbiAgICAgICAgbGV0IHByZWZpeCA9IHBhdHRlcm47XG4gICAgICAgIGxldCBzdWZmaXg7XG4gICAgICAgIGlmIChzdGFySW5kZXggPiAtMSkge1xuICAgICAgICAgIHByZWZpeCA9IHBhdHRlcm4uc2xpY2UoMCwgc3RhckluZGV4KTtcbiAgICAgICAgICBpZiAoc3RhckluZGV4IDwgcGF0dGVybi5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBzdWZmaXggPSBwYXR0ZXJuLnNsaWNlKHN0YXJJbmRleCArIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGF0dGVybnMgPz89IFtdO1xuICAgICAgICB0aGlzLnBhdHRlcm5zLnB1c2goe1xuICAgICAgICAgIHN0YXJJbmRleCxcbiAgICAgICAgICBwcmVmaXgsXG4gICAgICAgICAgc3VmZml4LFxuICAgICAgICAgIHBvdGVudGlhbHM6IHBvdGVudGlhbHMubWFwKChwb3RlbnRpYWwpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBvdGVudGlhbFN0YXJJbmRleCA9IHBvdGVudGlhbC5pbmRleE9mKCcqJyk7XG4gICAgICAgICAgICBpZiAocG90ZW50aWFsU3RhckluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICByZXR1cm4geyBoYXNTdGFyOiBmYWxzZSwgcHJlZml4OiBwb3RlbnRpYWwgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgaGFzU3RhcjogdHJ1ZSxcbiAgICAgICAgICAgICAgcHJlZml4OiBwb3RlbnRpYWwuc2xpY2UoMCwgcG90ZW50aWFsU3RhckluZGV4KSxcbiAgICAgICAgICAgICAgc3VmZml4OlxuICAgICAgICAgICAgICAgIHBvdGVudGlhbFN0YXJJbmRleCA8IHBvdGVudGlhbC5sZW5ndGggLSAxXG4gICAgICAgICAgICAgICAgICA/IHBvdGVudGlhbC5zbGljZShwb3RlbnRpYWxTdGFySW5kZXggKyAxKVxuICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gU29ydCBwYXR0ZXJucyBzbyB0aGF0IGV4YWN0IG1hdGNoZXMgdGFrZSBwcmlvcml0eSB0aGVuIGxhcmdlc3QgcHJlZml4IG1hdGNoXG4gICAgICB0aGlzLnBhdHRlcm5zPy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIGlmIChhLnN0YXJJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0gZWxzZSBpZiAoYi5zdGFySW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGIuc3RhckluZGV4IC0gYS5zdGFySW5kZXg7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGFwcGx5KHJlc29sdmVyOiBSZXNvbHZlcik6IHZvaWQge1xuICAgIGNvbnN0IHRhcmdldCA9IHJlc29sdmVyLmVuc3VyZUhvb2soJ3Jlc29sdmUnKTtcblxuICAgIC8vIFRvIHN1cHBvcnQgc3luY2hyb25vdXMgcmVzb2x2ZXJzIHRoaXMgaG9vayBjYW5ub3QgYmUgcHJvbWlzZSBiYXNlZC5cbiAgICAvLyBXZWJwYWNrIHN1cHBvcnRzIHN5bmNocm9ub3VzIHJlc29sdXRpb24gd2l0aCBgdGFwYCBhbmQgYHRhcEFzeW5jYCBob29rcy5cbiAgICByZXNvbHZlclxuICAgICAgLmdldEhvb2soJ2Rlc2NyaWJlZC1yZXNvbHZlJylcbiAgICAgIC50YXBBc3luYyhcbiAgICAgICAgJ1R5cGVTY3JpcHRQYXRoc1BsdWdpbicsXG4gICAgICAgIChyZXF1ZXN0OiBQYXRoUGx1Z2luUmVzb2x2ZXJSZXF1ZXN0LCByZXNvbHZlQ29udGV4dCwgY2FsbGJhY2spID0+IHtcbiAgICAgICAgICAvLyBQcmVwcm9jZXNzaW5nIG9mIHRoZSBvcHRpb25zIHdpbGwgZW5zdXJlIHRoYXQgYHBhdHRlcm5zYCBpcyBlaXRoZXIgdW5kZWZpbmVkIG9yIGhhcyBlbGVtZW50cyB0byBjaGVja1xuICAgICAgICAgIGlmICghdGhpcy5wYXR0ZXJucykge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghcmVxdWVzdCB8fCByZXF1ZXN0LnR5cGVzY3JpcHRQYXRoTWFwcGVkKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgb3JpZ2luYWxSZXF1ZXN0ID0gcmVxdWVzdC5yZXF1ZXN0IHx8IHJlcXVlc3QucGF0aDtcbiAgICAgICAgICBpZiAoIW9yaWdpbmFsUmVxdWVzdCkge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIE9ubHkgd29yayBvbiBKYXZhc2NyaXB0L1R5cGVTY3JpcHQgaXNzdWVycy5cbiAgICAgICAgICBpZiAoIXJlcXVlc3Q/LmNvbnRleHQ/Lmlzc3Vlcj8ubWF0Y2goL1xcLltjbV0/W2p0XXN4PyQvKSkge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFic29sdXRlIHJlcXVlc3RzIGFyZSBub3QgbWFwcGVkXG4gICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShvcmlnaW5hbFJlcXVlc3QpKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc3dpdGNoIChvcmlnaW5hbFJlcXVlc3RbMF0pIHtcbiAgICAgICAgICAgIGNhc2UgJy4nOlxuICAgICAgICAgICAgICAvLyBSZWxhdGl2ZSByZXF1ZXN0cyBhcmUgbm90IG1hcHBlZFxuICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuXG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgJyEnOlxuICAgICAgICAgICAgICAvLyBJZ25vcmUgYWxsIHdlYnBhY2sgc3BlY2lhbCByZXF1ZXN0c1xuICAgICAgICAgICAgICBpZiAob3JpZ2luYWxSZXF1ZXN0Lmxlbmd0aCA+IDEgJiYgb3JpZ2luYWxSZXF1ZXN0WzFdID09PSAnIScpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEEgZ2VuZXJhdG9yIGlzIHVzZWQgdG8gbGltaXQgdGhlIGFtb3VudCBvZiByZXBsYWNlbWVudHMgcmVxdWVzdHMgdGhhdCBuZWVkIHRvIGJlIGNyZWF0ZWQuXG4gICAgICAgICAgLy8gRm9yIGV4YW1wbGUsIGlmIHRoZSBmaXJzdCBvbmUgcmVzb2x2ZXMsIGFueSBvdGhlcnMgYXJlIG5vdCBuZWVkZWQgYW5kIGRvIG5vdCBuZWVkXG4gICAgICAgICAgLy8gdG8gYmUgY3JlYXRlZC5cbiAgICAgICAgICBjb25zdCByZXF1ZXN0cyA9IHRoaXMuY3JlYXRlUmVwbGFjZW1lbnRSZXF1ZXN0cyhyZXF1ZXN0LCBvcmlnaW5hbFJlcXVlc3QpO1xuXG4gICAgICAgICAgY29uc3QgdHJ5UmVzb2x2ZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5leHQgPSByZXF1ZXN0cy5uZXh0KCk7XG4gICAgICAgICAgICBpZiAobmV4dC5kb25lKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNvbHZlci5kb1Jlc29sdmUoXG4gICAgICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICAgICAgbmV4dC52YWx1ZSxcbiAgICAgICAgICAgICAgJycsXG4gICAgICAgICAgICAgIHJlc29sdmVDb250ZXh0LFxuICAgICAgICAgICAgICAoZXJyb3I6IEVycm9yIHwgbnVsbCB8IHVuZGVmaW5lZCwgcmVzdWx0OiBSZXNvbHZlclJlcXVlc3QgfCBudWxsIHwgdW5kZWZpbmVkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnJvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdHJ5UmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHRyeVJlc29sdmUoKTtcbiAgICAgICAgfSxcbiAgICAgICk7XG4gIH1cblxuICAqZmluZFJlcGxhY2VtZW50cyhvcmlnaW5hbFJlcXVlc3Q6IHN0cmluZyk6IEl0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPiB7XG4gICAgaWYgKCF0aGlzLnBhdHRlcm5zKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgaWYgYW55IHBhdGggbWFwcGluZyBydWxlcyBhcmUgcmVsZXZhbnRcbiAgICBmb3IgKGNvbnN0IHsgc3RhckluZGV4LCBwcmVmaXgsIHN1ZmZpeCwgcG90ZW50aWFscyB9IG9mIHRoaXMucGF0dGVybnMpIHtcbiAgICAgIGxldCBwYXJ0aWFsO1xuXG4gICAgICBpZiAoc3RhckluZGV4ID09PSAtMSkge1xuICAgICAgICAvLyBObyBzdGFyIG1lYW5zIGFuIGV4YWN0IG1hdGNoIGlzIHJlcXVpcmVkXG4gICAgICAgIGlmIChwcmVmaXggPT09IG9yaWdpbmFsUmVxdWVzdCkge1xuICAgICAgICAgIHBhcnRpYWwgPSAnJztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzdGFySW5kZXggPT09IDAgJiYgIXN1ZmZpeCkge1xuICAgICAgICAvLyBFdmVyeXRoaW5nIG1hdGNoZXMgYSBzaW5nbGUgd2lsZGNhcmQgcGF0dGVybiAoXCIqXCIpXG4gICAgICAgIHBhcnRpYWwgPSBvcmlnaW5hbFJlcXVlc3Q7XG4gICAgICB9IGVsc2UgaWYgKCFzdWZmaXgpIHtcbiAgICAgICAgLy8gTm8gc3VmZml4IG1lYW5zIHRoZSBzdGFyIGlzIGF0IHRoZSBlbmQgb2YgdGhlIHBhdHRlcm5cbiAgICAgICAgaWYgKG9yaWdpbmFsUmVxdWVzdC5zdGFydHNXaXRoKHByZWZpeCkpIHtcbiAgICAgICAgICBwYXJ0aWFsID0gb3JpZ2luYWxSZXF1ZXN0LnNsaWNlKHByZWZpeC5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTdGFyIHdhcyBpbiB0aGUgbWlkZGxlIG9mIHRoZSBwYXR0ZXJuXG4gICAgICAgIGlmIChvcmlnaW5hbFJlcXVlc3Quc3RhcnRzV2l0aChwcmVmaXgpICYmIG9yaWdpbmFsUmVxdWVzdC5lbmRzV2l0aChzdWZmaXgpKSB7XG4gICAgICAgICAgcGFydGlhbCA9IG9yaWdpbmFsUmVxdWVzdC5zdWJzdHJpbmcoXG4gICAgICAgICAgICBwcmVmaXgubGVuZ3RoLFxuICAgICAgICAgICAgb3JpZ2luYWxSZXF1ZXN0Lmxlbmd0aCAtIHN1ZmZpeC5sZW5ndGgsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiByZXF1ZXN0IHdhcyBub3QgbWF0Y2hlZCwgbW92ZSBvbiB0byB0aGUgbmV4dCBwYXR0ZXJuXG4gICAgICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgdGhlIGZ1bGwgcmVwbGFjZW1lbnQgdmFsdWVzIGJhc2VkIG9uIHRoZSBvcmlnaW5hbCByZXF1ZXN0IGFuZCB0aGUgcG90ZW50aWFsc1xuICAgICAgLy8gZm9yIHRoZSBzdWNjZXNzZnVsbHkgbWF0Y2hlZCBwYXR0ZXJuLlxuICAgICAgZm9yIChjb25zdCB7IGhhc1N0YXIsIHByZWZpeCwgc3VmZml4IH0gb2YgcG90ZW50aWFscykge1xuICAgICAgICBsZXQgcmVwbGFjZW1lbnQgPSBwcmVmaXg7XG5cbiAgICAgICAgaWYgKGhhc1N0YXIpIHtcbiAgICAgICAgICByZXBsYWNlbWVudCArPSBwYXJ0aWFsO1xuICAgICAgICAgIGlmIChzdWZmaXgpIHtcbiAgICAgICAgICAgIHJlcGxhY2VtZW50ICs9IHN1ZmZpeDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB5aWVsZCByZXBsYWNlbWVudDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAqY3JlYXRlUmVwbGFjZW1lbnRSZXF1ZXN0cyhcbiAgICByZXF1ZXN0OiBQYXRoUGx1Z2luUmVzb2x2ZXJSZXF1ZXN0LFxuICAgIG9yaWdpbmFsUmVxdWVzdDogc3RyaW5nLFxuICApOiBJdGVyYWJsZUl0ZXJhdG9yPFBhdGhQbHVnaW5SZXNvbHZlclJlcXVlc3Q+IHtcbiAgICBmb3IgKGNvbnN0IHJlcGxhY2VtZW50IG9mIHRoaXMuZmluZFJlcGxhY2VtZW50cyhvcmlnaW5hbFJlcXVlc3QpKSB7XG4gICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5yZXNvbHZlKHRoaXMuYmFzZVVybCA/PyAnJywgcmVwbGFjZW1lbnQpO1xuICAgICAgLy8gUmVzb2x1dGlvbiBpbiB0aGUgb3JpZ2luYWwgY2FsbGVlIGxvY2F0aW9uLCBidXQgd2l0aCB0aGUgdXBkYXRlZCByZXF1ZXN0XG4gICAgICAvLyB0byBwb2ludCB0byB0aGUgbWFwcGVkIHRhcmdldCBsb2NhdGlvbi5cbiAgICAgIHlpZWxkIHtcbiAgICAgICAgLi4ucmVxdWVzdCxcbiAgICAgICAgcmVxdWVzdDogdGFyZ2V0UGF0aCxcbiAgICAgICAgdHlwZXNjcmlwdFBhdGhNYXBwZWQ6IHRydWUsXG4gICAgICB9O1xuXG4gICAgICAvLyBJZiB0aGVyZSBpcyBubyBleHRlbnNpb24uIGkuZS4gdGhlIHRhcmdldCBkb2VzIG5vdCByZWZlciB0byBhbiBleHBsaWNpdFxuICAgICAgLy8gZmlsZSwgdGhlbiB0aGlzIGlzIGEgY2FuZGlkYXRlIGZvciBtb2R1bGUvcGFja2FnZSByZXNvbHV0aW9uLlxuICAgICAgY29uc3QgY2FuQmVNb2R1bGUgPSBwYXRoLmV4dG5hbWUodGFyZ2V0UGF0aCkgPT09ICcnO1xuICAgICAgaWYgKGNhbkJlTW9kdWxlKSB7XG4gICAgICAgIC8vIFJlc29sdXRpb24gaW4gdGhlIHRhcmdldCBsb2NhdGlvbiwgcHJlc2VydmluZyB0aGUgb3JpZ2luYWwgcmVxdWVzdC5cbiAgICAgICAgLy8gVGhpcyB3aWxsIHdvcmsgd2l0aCB0aGUgYHJlc29sdmUtaW4tcGFja2FnZWAgcmVzb2x1dGlvbiBob29rLCBzdXBwb3J0aW5nXG4gICAgICAgIC8vIHBhY2thZ2UgZXhwb3J0cyBmb3IgZS5nLiBsb2NhbGx5LWJ1aWx0IEFQRiBsaWJyYXJpZXMuXG4gICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAuLi5yZXF1ZXN0LFxuICAgICAgICAgIHBhdGg6IHRhcmdldFBhdGgsXG4gICAgICAgICAgdHlwZXNjcmlwdFBhdGhNYXBwZWQ6IHRydWUsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=