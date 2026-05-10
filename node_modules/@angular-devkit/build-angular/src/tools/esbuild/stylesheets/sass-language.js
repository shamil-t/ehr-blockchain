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
exports.SassStylesheetLanguage = exports.shutdownSassWorkerPool = void 0;
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
let sassWorkerPool;
let sassWorkerPoolPromise;
function isSassException(error) {
    return !!error && typeof error === 'object' && 'sassMessage' in error;
}
function shutdownSassWorkerPool() {
    if (sassWorkerPool) {
        sassWorkerPool.close();
        sassWorkerPool = undefined;
    }
    else if (sassWorkerPoolPromise) {
        void sassWorkerPoolPromise.then(shutdownSassWorkerPool);
    }
    sassWorkerPoolPromise = undefined;
}
exports.shutdownSassWorkerPool = shutdownSassWorkerPool;
exports.SassStylesheetLanguage = Object.freeze({
    name: 'sass',
    componentFilter: /^s[ac]ss;/,
    fileFilter: /\.s[ac]ss$/,
    process(data, file, format, options, build) {
        const syntax = format === 'sass' ? 'indented' : 'scss';
        const resolveUrl = async (url, options) => {
            let result = await build.resolve(url, {
                kind: 'import-rule',
                // Use the provided resolve directory from the custom Sass service if available
                resolveDir: options.resolveDir ?? build.initialOptions.absWorkingDir,
            });
            // If a resolve directory is provided, no additional speculative resolutions are required
            if (options.resolveDir) {
                return result;
            }
            // Workaround to support Yarn PnP and pnpm without access to the importer file from Sass
            if (!result.path && options.previousResolvedModules?.size) {
                for (const previous of options.previousResolvedModules) {
                    result = await build.resolve(url, {
                        kind: 'import-rule',
                        resolveDir: previous,
                    });
                    if (result.path) {
                        break;
                    }
                }
            }
            return result;
        };
        return compileString(data, file, syntax, options, resolveUrl);
    },
});
function parsePackageName(url) {
    const parts = url.split('/');
    const hasScope = parts.length >= 2 && parts[0].startsWith('@');
    const [nameOrScope, nameOrFirstPath, ...pathPart] = parts;
    const packageName = hasScope ? `${nameOrScope}/${nameOrFirstPath}` : nameOrScope;
    return {
        packageName,
        get pathSegments() {
            return !hasScope && nameOrFirstPath ? [nameOrFirstPath, ...pathPart] : pathPart;
        },
    };
}
class Cache extends Map {
    async getOrCreate(key, creator) {
        let value = this.get(key);
        if (value === undefined) {
            value = await creator();
            this.set(key, value);
        }
        return value;
    }
}
async function compileString(data, filePath, syntax, options, resolveUrl) {
    // Lazily load Sass when a Sass file is found
    if (sassWorkerPool === undefined) {
        if (sassWorkerPoolPromise === undefined) {
            sassWorkerPoolPromise = Promise.resolve().then(() => __importStar(require('../../sass/sass-service'))).then((sassService) => new sassService.SassWorkerImplementation(true));
        }
        sassWorkerPool = await sassWorkerPoolPromise;
    }
    // Cache is currently local to individual compile requests.
    // Caching follows Sass behavior where a given url will always resolve to the same value
    // regardless of its importer's path.
    // A null value indicates that the cached resolution attempt failed to find a location and
    // later stage resolution should be attempted. This avoids potentially expensive repeat
    // failing resolution attempts.
    const resolutionCache = new Cache();
    const packageRootCache = new Cache();
    const warnings = [];
    try {
        const { css, sourceMap, loadedUrls } = await sassWorkerPool.compileStringAsync(data, {
            url: (0, node_url_1.pathToFileURL)(filePath),
            style: 'expanded',
            syntax,
            loadPaths: options.includePaths,
            sourceMap: options.sourcemap,
            sourceMapIncludeSources: options.sourcemap,
            quietDeps: true,
            importers: [
                {
                    findFileUrl: (url, options) => resolutionCache.getOrCreate(url, async () => {
                        const result = await resolveUrl(url, options);
                        if (result.path) {
                            return (0, node_url_1.pathToFileURL)(result.path);
                        }
                        // Check for package deep imports
                        const { packageName, pathSegments } = parsePackageName(url);
                        // Caching package root locations is particularly beneficial for `@material/*` packages
                        // which extensively use deep imports.
                        const packageRoot = await packageRootCache.getOrCreate(packageName, async () => {
                            // Use the required presence of a package root `package.json` file to resolve the location
                            const packageResult = await resolveUrl(packageName + '/package.json', options);
                            return packageResult.path ? (0, node_path_1.dirname)(packageResult.path) : null;
                        });
                        // Package not found could be because of an error or the specifier is intended to be found
                        // via a later stage of the resolution process (`loadPaths`, etc.).
                        // Errors are reported after the full completion of the resolution process. Exceptions for
                        // not found packages should not be raised here.
                        if (packageRoot) {
                            return (0, node_url_1.pathToFileURL)((0, node_path_1.join)(packageRoot, ...pathSegments));
                        }
                        // Not found
                        return null;
                    }),
                },
            ],
            logger: {
                warn: (text, { deprecation, span }) => {
                    warnings.push({
                        text: deprecation ? 'Deprecation' : text,
                        location: span && {
                            file: span.url && (0, node_url_1.fileURLToPath)(span.url),
                            lineText: span.context,
                            // Sass line numbers are 0-based while esbuild's are 1-based
                            line: span.start.line + 1,
                            column: span.start.column,
                        },
                        notes: deprecation ? [{ text }] : undefined,
                    });
                },
            },
        });
        return {
            loader: 'css',
            contents: sourceMap ? `${css}\n${sourceMapToUrlComment(sourceMap, (0, node_path_1.dirname)(filePath))}` : css,
            watchFiles: loadedUrls.map((url) => (0, node_url_1.fileURLToPath)(url)),
            warnings,
        };
    }
    catch (error) {
        if (isSassException(error)) {
            const file = error.span.url ? (0, node_url_1.fileURLToPath)(error.span.url) : undefined;
            return {
                loader: 'css',
                errors: [
                    {
                        text: error.message,
                    },
                ],
                warnings,
                watchFiles: file ? [file] : undefined,
            };
        }
        throw error;
    }
}
function sourceMapToUrlComment(sourceMap, root) {
    // Remove `file` protocol from all sourcemap sources and adjust to be relative to the input file.
    // This allows esbuild to correctly process the paths.
    sourceMap.sources = sourceMap.sources.map((source) => (0, node_path_1.relative)(root, (0, node_url_1.fileURLToPath)(source)));
    const urlSourceMap = Buffer.from(JSON.stringify(sourceMap), 'utf-8').toString('base64');
    return `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,${urlSourceMap} */`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy1sYW5ndWFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Rvb2xzL2VzYnVpbGQvc3R5bGVzaGVldHMvc2Fzcy1sYW5ndWFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdILHlDQUFvRDtBQUNwRCx1Q0FBd0Q7QUFReEQsSUFBSSxjQUFvRCxDQUFDO0FBQ3pELElBQUkscUJBQW9FLENBQUM7QUFFekUsU0FBUyxlQUFlLENBQUMsS0FBYztJQUNyQyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLGFBQWEsSUFBSSxLQUFLLENBQUM7QUFDeEUsQ0FBQztBQUVELFNBQWdCLHNCQUFzQjtJQUNwQyxJQUFJLGNBQWMsRUFBRTtRQUNsQixjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkIsY0FBYyxHQUFHLFNBQVMsQ0FBQztLQUM1QjtTQUFNLElBQUkscUJBQXFCLEVBQUU7UUFDaEMsS0FBSyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztLQUN6RDtJQUNELHFCQUFxQixHQUFHLFNBQVMsQ0FBQztBQUNwQyxDQUFDO0FBUkQsd0RBUUM7QUFFWSxRQUFBLHNCQUFzQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQXFCO0lBQ3RFLElBQUksRUFBRSxNQUFNO0lBQ1osZUFBZSxFQUFFLFdBQVc7SUFDNUIsVUFBVSxFQUFFLFlBQVk7SUFDeEIsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLO1FBQ3hDLE1BQU0sTUFBTSxHQUFHLE1BQU0sS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFB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WixpR0FBaUc7SUFDakcsc0RBQXNEO0lBQ3RELFNBQVMsQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUEsb0JBQVEsRUFBQyxJQUFJLEVBQUUsSUFBQSx3QkFBYSxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU3RixNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRXhGLE9BQU8sbUVBQW1FLFlBQVksS0FBSyxDQUFDO0FBQzlGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBPbkxvYWRSZXN1bHQsIFBhcnRpYWxNZXNzYWdlLCBSZXNvbHZlUmVzdWx0IH0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgeyBkaXJuYW1lLCBqb2luLCByZWxhdGl2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBwYXRoVG9GaWxlVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHR5cGUgeyBDb21waWxlUmVzdWx0LCBFeGNlcHRpb24sIFN5bnRheCB9IGZyb20gJ3Nhc3MnO1xuaW1wb3J0IHR5cGUge1xuICBGaWxlSW1wb3J0ZXJXaXRoUmVxdWVzdENvbnRleHRPcHRpb25zLFxuICBTYXNzV29ya2VySW1wbGVtZW50YXRpb24sXG59IGZyb20gJy4uLy4uL3Nhc3Mvc2Fzcy1zZXJ2aWNlJztcbmltcG9ydCB7IFN0eWxlc2hlZXRMYW5ndWFnZSwgU3R5bGVzaGVldFBsdWdpbk9wdGlvbnMgfSBmcm9tICcuL3N0eWxlc2hlZXQtcGx1Z2luLWZhY3RvcnknO1xuXG5sZXQgc2Fzc1dvcmtlclBvb2w6IFNhc3NXb3JrZXJJbXBsZW1lbnRhdGlvbiB8IHVuZGVmaW5lZDtcbmxldCBzYXNzV29ya2VyUG9vbFByb21pc2U6IFByb21pc2U8U2Fzc1dvcmtlckltcGxlbWVudGF0aW9uPiB8IHVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNTYXNzRXhjZXB0aW9uKGVycm9yOiB1bmtub3duKTogZXJyb3IgaXMgRXhjZXB0aW9uIHtcbiAgcmV0dXJuICEhZXJyb3IgJiYgdHlwZW9mIGVycm9yID09PSAnb2JqZWN0JyAmJiAnc2Fzc01lc3NhZ2UnIGluIGVycm9yO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2h1dGRvd25TYXNzV29ya2VyUG9vbCgpOiB2b2lkIHtcbiAgaWYgKHNhc3NXb3JrZXJQb29sKSB7XG4gICAgc2Fzc1dvcmtlclBvb2wuY2xvc2UoKTtcbiAgICBzYXNzV29ya2VyUG9vbCA9IHVuZGVmaW5lZDtcbiAgfSBlbHNlIGlmIChzYXNzV29ya2VyUG9vbFByb21pc2UpIHtcbiAgICB2b2lkIHNhc3NXb3JrZXJQb29sUHJvbWlzZS50aGVuKHNodXRkb3duU2Fzc1dvcmtlclBvb2wpO1xuICB9XG4gIHNhc3NXb3JrZXJQb29sUHJvbWlzZSA9IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGNvbnN0IFNhc3NTdHlsZXNoZWV0TGFuZ3VhZ2UgPSBPYmplY3QuZnJlZXplPFN0eWxlc2hlZXRMYW5ndWFnZT4oe1xuICBuYW1lOiAnc2FzcycsXG4gIGNvbXBvbmVudEZpbHRlcjogL15zW2FjXXNzOy8sXG4gIGZpbGVGaWx0ZXI6IC9cXC5zW2FjXXNzJC8sXG4gIHByb2Nlc3MoZGF0YSwgZmlsZSwgZm9ybWF0LCBvcHRpb25zLCBidWlsZCkge1xuICAgIGNvbnN0IHN5bnRheCA9IGZvcm1hdCA9PT0gJ3Nhc3MnID8gJ2luZGVudGVkJyA6ICdzY3NzJztcbiAgICBjb25zdCByZXNvbHZlVXJsID0gYXN5bmMgKHVybDogc3RyaW5nLCBvcHRpb25zOiBGaWxlSW1wb3J0ZXJXaXRoUmVxdWVzdENvbnRleHRPcHRpb25zKSA9PiB7XG4gICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgYnVpbGQucmVzb2x2ZSh1cmwsIHtcbiAgICAgICAga2luZDogJ2ltcG9ydC1ydWxlJyxcbiAgICAgICAgLy8gVXNlIHRoZSBwcm92aWRlZCByZXNvbHZlIGRpcmVjdG9yeSBmcm9tIHRoZSBjdXN0b20gU2FzcyBzZXJ2aWNlIGlmIGF2YWlsYWJsZVxuICAgICAgICByZXNvbHZlRGlyOiBvcHRpb25zLnJlc29sdmVEaXIgPz8gYnVpbGQuaW5pdGlhbE9wdGlvbnMuYWJzV29ya2luZ0RpcixcbiAgICAgIH0pO1xuXG4gICAgICAvLyBJZiBhIHJlc29sdmUgZGlyZWN0b3J5IGlzIHByb3ZpZGVkLCBubyBhZGRpdGlvbmFsIHNwZWN1bGF0aXZlIHJlc29sdXRpb25zIGFyZSByZXF1aXJlZFxuICAgICAgaWYgKG9wdGlvbnMucmVzb2x2ZURpcikge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuXG4gICAgICAvLyBXb3JrYXJvdW5kIHRvIHN1cHBvcnQgWWFybiBQblAgYW5kIHBucG0gd2l0aG91dCBhY2Nlc3MgdG8gdGhlIGltcG9ydGVyIGZpbGUgZnJvbSBTYXNzXG4gICAgICBpZiAoIXJlc3VsdC5wYXRoICYmIG9wdGlvbnMucHJldmlvdXNSZXNvbHZlZE1vZHVsZXM/LnNpemUpIHtcbiAgICAgICAgZm9yIChjb25zdCBwcmV2aW91cyBvZiBvcHRpb25zLnByZXZpb3VzUmVzb2x2ZWRNb2R1bGVzKSB7XG4gICAgICAgICAgcmVzdWx0ID0gYXdhaXQgYnVpbGQucmVzb2x2ZSh1cmwsIHtcbiAgICAgICAgICAgIGtpbmQ6ICdpbXBvcnQtcnVsZScsXG4gICAgICAgICAgICByZXNvbHZlRGlyOiBwcmV2aW91cyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAocmVzdWx0LnBhdGgpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICByZXR1cm4gY29tcGlsZVN0cmluZyhkYXRhLCBmaWxlLCBzeW50YXgsIG9wdGlvbnMsIHJlc29sdmVVcmwpO1xuICB9LFxufSk7XG5cbmZ1bmN0aW9uIHBhcnNlUGFja2FnZU5hbWUodXJsOiBzdHJpbmcpOiB7IHBhY2thZ2VOYW1lOiBzdHJpbmc7IHJlYWRvbmx5IHBhdGhTZWdtZW50czogc3RyaW5nW10gfSB7XG4gIGNvbnN0IHBhcnRzID0gdXJsLnNwbGl0KCcvJyk7XG4gIGNvbnN0IGhhc1Njb3BlID0gcGFydHMubGVuZ3RoID49IDIgJiYgcGFydHNbMF0uc3RhcnRzV2l0aCgnQCcpO1xuICBjb25zdCBbbmFtZU9yU2NvcGUsIG5hbWVPckZpcnN0UGF0aCwgLi4ucGF0aFBhcnRdID0gcGFydHM7XG4gIGNvbnN0IHBhY2thZ2VOYW1lID0gaGFzU2NvcGUgPyBgJHtuYW1lT3JTY29wZX0vJHtuYW1lT3JGaXJzdFBhdGh9YCA6IG5hbWVPclNjb3BlO1xuXG4gIHJldHVybiB7XG4gICAgcGFja2FnZU5hbWUsXG4gICAgZ2V0IHBhdGhTZWdtZW50cygpIHtcbiAgICAgIHJldHVybiAhaGFzU2NvcGUgJiYgbmFtZU9yRmlyc3RQYXRoID8gW25hbWVPckZpcnN0UGF0aCwgLi4ucGF0aFBhcnRdIDogcGF0aFBhcnQ7XG4gICAgfSxcbiAgfTtcbn1cblxuY2xhc3MgQ2FjaGU8SywgVj4gZXh0ZW5kcyBNYXA8SywgVj4ge1xuICBhc3luYyBnZXRPckNyZWF0ZShrZXk6IEssIGNyZWF0b3I6ICgpID0+IFYgfCBQcm9taXNlPFY+KTogUHJvbWlzZTxWPiB7XG4gICAgbGV0IHZhbHVlID0gdGhpcy5nZXQoa2V5KTtcblxuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB2YWx1ZSA9IGF3YWl0IGNyZWF0b3IoKTtcbiAgICAgIHRoaXMuc2V0KGtleSwgdmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjb21waWxlU3RyaW5nKFxuICBkYXRhOiBzdHJpbmcsXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIHN5bnRheDogU3ludGF4LFxuICBvcHRpb25zOiBTdHlsZXNoZWV0UGx1Z2luT3B0aW9ucyxcbiAgcmVzb2x2ZVVybDogKFxuICAgIHVybDogc3RyaW5nLFxuICAgIG9wdGlvbnM6IEZpbGVJbXBvcnRlcldpdGhSZXF1ZXN0Q29udGV4dE9wdGlvbnMsXG4gICkgPT4gUHJvbWlzZTxSZXNvbHZlUmVzdWx0Pixcbik6IFByb21pc2U8T25Mb2FkUmVzdWx0PiB7XG4gIC8vIExhemlseSBsb2FkIFNhc3Mgd2hlbiBhIFNhc3MgZmlsZSBpcyBmb3VuZFxuICBpZiAoc2Fzc1dvcmtlclBvb2wgPT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChzYXNzV29ya2VyUG9vbFByb21pc2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgc2Fzc1dvcmtlclBvb2xQcm9taXNlID0gaW1wb3J0KCcuLi8uLi9zYXNzL3Nhc3Mtc2VydmljZScpLnRoZW4oXG4gICAgICAgIChzYXNzU2VydmljZSkgPT4gbmV3IHNhc3NTZXJ2aWNlLlNhc3NXb3JrZXJJbXBsZW1lbnRhdGlvbih0cnVlKSxcbiAgICAgICk7XG4gICAgfVxuICAgIHNhc3NXb3JrZXJQb29sID0gYXdhaXQgc2Fzc1dvcmtlclBvb2xQcm9taXNlO1xuICB9XG5cbiAgLy8gQ2FjaGUgaXMgY3VycmVudGx5IGxvY2FsIHRvIGluZGl2aWR1YWwgY29tcGlsZSByZXF1ZXN0cy5cbiAgLy8gQ2FjaGluZyBmb2xsb3dzIFNhc3MgYmVoYXZpb3Igd2hlcmUgYSBnaXZlbiB1cmwgd2lsbCBhbHdheXMgcmVzb2x2ZSB0byB0aGUgc2FtZSB2YWx1ZVxuICAvLyByZWdhcmRsZXNzIG9mIGl0cyBpbXBvcnRlcidzIHBhdGguXG4gIC8vIEEgbnVsbCB2YWx1ZSBpbmRpY2F0ZXMgdGhhdCB0aGUgY2FjaGVkIHJlc29sdXRpb24gYXR0ZW1wdCBmYWlsZWQgdG8gZmluZCBhIGxvY2F0aW9uIGFuZFxuICAvLyBsYXRlciBzdGFnZSByZXNvbHV0aW9uIHNob3VsZCBiZSBhdHRlbXB0ZWQuIFRoaXMgYXZvaWRzIHBvdGVudGlhbGx5IGV4cGVuc2l2ZSByZXBlYXRcbiAgLy8gZmFpbGluZyByZXNvbHV0aW9uIGF0dGVtcHRzLlxuICBjb25zdCByZXNvbHV0aW9uQ2FjaGUgPSBuZXcgQ2FjaGU8c3RyaW5nLCBVUkwgfCBudWxsPigpO1xuICBjb25zdCBwYWNrYWdlUm9vdENhY2hlID0gbmV3IENhY2hlPHN0cmluZywgc3RyaW5nIHwgbnVsbD4oKTtcblxuICBjb25zdCB3YXJuaW5nczogUGFydGlhbE1lc3NhZ2VbXSA9IFtdO1xuICB0cnkge1xuICAgIGNvbnN0IHsgY3NzLCBzb3VyY2VNYXAsIGxvYWRlZFVybHMgfSA9IGF3YWl0IHNhc3NXb3JrZXJQb29sLmNvbXBpbGVTdHJpbmdBc3luYyhkYXRhLCB7XG4gICAgICB1cmw6IHBhdGhUb0ZpbGVVUkwoZmlsZVBhdGgpLFxuICAgICAgc3R5bGU6ICdleHBhbmRlZCcsXG4gICAgICBzeW50YXgsXG4gICAgICBsb2FkUGF0aHM6IG9wdGlvbnMuaW5jbHVkZVBhdGhzLFxuICAgICAgc291cmNlTWFwOiBvcHRpb25zLnNvdXJjZW1hcCxcbiAgICAgIHNvdXJjZU1hcEluY2x1ZGVTb3VyY2VzOiBvcHRpb25zLnNvdXJjZW1hcCxcbiAgICAgIHF1aWV0RGVwczogdHJ1ZSxcbiAgICAgIGltcG9ydGVyczogW1xuICAgICAgICB7XG4gICAgICAgICAgZmluZEZpbGVVcmw6ICh1cmwsIG9wdGlvbnM6IEZpbGVJbXBvcnRlcldpdGhSZXF1ZXN0Q29udGV4dE9wdGlvbnMpID0+XG4gICAgICAgICAgICByZXNvbHV0aW9uQ2FjaGUuZ2V0T3JDcmVhdGUodXJsLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc29sdmVVcmwodXJsLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgaWYgKHJlc3VsdC5wYXRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhUb0ZpbGVVUkwocmVzdWx0LnBhdGgpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHBhY2thZ2UgZGVlcCBpbXBvcnRzXG4gICAgICAgICAgICAgIGNvbnN0IHsgcGFja2FnZU5hbWUsIHBhdGhTZWdtZW50cyB9ID0gcGFyc2VQYWNrYWdlTmFtZSh1cmwpO1xuXG4gICAgICAgICAgICAgIC8vIENhY2hpbmcgcGFja2FnZSByb290IGxvY2F0aW9ucyBpcyBwYXJ0aWN1bGFybHkgYmVuZWZpY2lhbCBmb3IgYEBtYXRlcmlhbC8qYCBwYWNrYWdlc1xuICAgICAgICAgICAgICAvLyB3aGljaCBleHRlbnNpdmVseSB1c2UgZGVlcCBpbXBvcnRzLlxuICAgICAgICAgICAgICBjb25zdCBwYWNrYWdlUm9vdCA9IGF3YWl0IHBhY2thZ2VSb290Q2FjaGUuZ2V0T3JDcmVhdGUocGFja2FnZU5hbWUsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgdGhlIHJlcXVpcmVkIHByZXNlbmNlIG9mIGEgcGFja2FnZSByb290IGBwYWNrYWdlLmpzb25gIGZpbGUgdG8gcmVzb2x2ZSB0aGUgbG9jYXRpb25cbiAgICAgICAgICAgICAgICBjb25zdCBwYWNrYWdlUmVzdWx0ID0gYXdhaXQgcmVzb2x2ZVVybChwYWNrYWdlTmFtZSArICcvcGFja2FnZS5qc29uJywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcGFja2FnZVJlc3VsdC5wYXRoID8gZGlybmFtZShwYWNrYWdlUmVzdWx0LnBhdGgpIDogbnVsbDtcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgLy8gUGFja2FnZSBub3QgZm91bmQgY291bGQgYmUgYmVjYXVzZSBvZiBhbiBlcnJvciBvciB0aGUgc3BlY2lmaWVyIGlzIGludGVuZGVkIHRvIGJlIGZvdW5kXG4gICAgICAgICAgICAgIC8vIHZpYSBhIGxhdGVyIHN0YWdlIG9mIHRoZSByZXNvbHV0aW9uIHByb2Nlc3MgKGBsb2FkUGF0aHNgLCBldGMuKS5cbiAgICAgICAgICAgICAgLy8gRXJyb3JzIGFyZSByZXBvcnRlZCBhZnRlciB0aGUgZnVsbCBjb21wbGV0aW9uIG9mIHRoZSByZXNvbHV0aW9uIHByb2Nlc3MuIEV4Y2VwdGlvbnMgZm9yXG4gICAgICAgICAgICAgIC8vIG5vdCBmb3VuZCBwYWNrYWdlcyBzaG91bGQgbm90IGJlIHJhaXNlZCBoZXJlLlxuICAgICAgICAgICAgICBpZiAocGFja2FnZVJvb3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aFRvRmlsZVVSTChqb2luKHBhY2thZ2VSb290LCAuLi5wYXRoU2VnbWVudHMpKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIE5vdCBmb3VuZFxuICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGxvZ2dlcjoge1xuICAgICAgICB3YXJuOiAodGV4dCwgeyBkZXByZWNhdGlvbiwgc3BhbiB9KSA9PiB7XG4gICAgICAgICAgd2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICB0ZXh0OiBkZXByZWNhdGlvbiA/ICdEZXByZWNhdGlvbicgOiB0ZXh0LFxuICAgICAgICAgICAgbG9jYXRpb246IHNwYW4gJiYge1xuICAgICAgICAgICAgICBmaWxlOiBzcGFuLnVybCAmJiBmaWxlVVJMVG9QYXRoKHNwYW4udXJsKSxcbiAgICAgICAgICAgICAgbGluZVRleHQ6IHNwYW4uY29udGV4dCxcbiAgICAgICAgICAgICAgLy8gU2FzcyBsaW5lIG51bWJlcnMgYXJlIDAtYmFzZWQgd2hpbGUgZXNidWlsZCdzIGFyZSAxLWJhc2VkXG4gICAgICAgICAgICAgIGxpbmU6IHNwYW4uc3RhcnQubGluZSArIDEsXG4gICAgICAgICAgICAgIGNvbHVtbjogc3Bhbi5zdGFydC5jb2x1bW4sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbm90ZXM6IGRlcHJlY2F0aW9uID8gW3sgdGV4dCB9XSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgbG9hZGVyOiAnY3NzJyxcbiAgICAgIGNvbnRlbnRzOiBzb3VyY2VNYXAgPyBgJHtjc3N9XFxuJHtzb3VyY2VNYXBUb1VybENvbW1lbnQoc291cmNlTWFwLCBkaXJuYW1lKGZpbGVQYXRoKSl9YCA6IGNzcyxcbiAgICAgIHdhdGNoRmlsZXM6IGxvYWRlZFVybHMubWFwKCh1cmwpID0+IGZpbGVVUkxUb1BhdGgodXJsKSksXG4gICAgICB3YXJuaW5ncyxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChpc1Nhc3NFeGNlcHRpb24oZXJyb3IpKSB7XG4gICAgICBjb25zdCBmaWxlID0gZXJyb3Iuc3Bhbi51cmwgPyBmaWxlVVJMVG9QYXRoKGVycm9yLnNwYW4udXJsKSA6IHVuZGVmaW5lZDtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZGVyOiAnY3NzJyxcbiAgICAgICAgZXJyb3JzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB3YXJuaW5ncyxcbiAgICAgICAgd2F0Y2hGaWxlczogZmlsZSA/IFtmaWxlXSA6IHVuZGVmaW5lZCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxuZnVuY3Rpb24gc291cmNlTWFwVG9VcmxDb21tZW50KFxuICBzb3VyY2VNYXA6IEV4Y2x1ZGU8Q29tcGlsZVJlc3VsdFsnc291cmNlTWFwJ10sIHVuZGVmaW5lZD4sXG4gIHJvb3Q6IHN0cmluZyxcbik6IHN0cmluZyB7XG4gIC8vIFJlbW92ZSBgZmlsZWAgcHJvdG9jb2wgZnJvbSBhbGwgc291cmNlbWFwIHNvdXJjZXMgYW5kIGFkanVzdCB0byBiZSByZWxhdGl2ZSB0byB0aGUgaW5wdXQgZmlsZS5cbiAgLy8gVGhpcyBhbGxvd3MgZXNidWlsZCB0byBjb3JyZWN0bHkgcHJvY2VzcyB0aGUgcGF0aHMuXG4gIHNvdXJjZU1hcC5zb3VyY2VzID0gc291cmNlTWFwLnNvdXJjZXMubWFwKChzb3VyY2UpID0+IHJlbGF0aXZlKHJvb3QsIGZpbGVVUkxUb1BhdGgoc291cmNlKSkpO1xuXG4gIGNvbnN0IHVybFNvdXJjZU1hcCA9IEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KHNvdXJjZU1hcCksICd1dGYtOCcpLnRvU3RyaW5nKCdiYXNlNjQnKTtcblxuICByZXR1cm4gYC8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCwke3VybFNvdXJjZU1hcH0gKi9gO1xufVxuIl19