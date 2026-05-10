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
exports.LessStylesheetLanguage = void 0;
const promises_1 = require("node:fs/promises");
/**
 * The lazy-loaded instance of the less stylesheet preprocessor.
 * It is only imported and initialized if a less stylesheet is used.
 */
let lessPreprocessor;
function isLessException(error) {
    return !!error && typeof error === 'object' && 'column' in error;
}
exports.LessStylesheetLanguage = Object.freeze({
    name: 'less',
    componentFilter: /^less;/,
    fileFilter: /\.less$/,
    process(data, file, _, options, build) {
        return compileString(data, file, options, build.resolve.bind(build));
    },
});
async function compileString(data, filename, options, resolver) {
    const less = (lessPreprocessor ?? (lessPreprocessor = (await Promise.resolve().then(() => __importStar(require('less')))).default));
    const resolverPlugin = {
        install({ FileManager }, pluginManager) {
            const resolverFileManager = new (class extends FileManager {
                supportsSync() {
                    return false;
                }
                supports() {
                    return true;
                }
                async loadFile(filename, currentDirectory, options, environment) {
                    // Attempt direct loading as a relative path to avoid resolution overhead
                    try {
                        return await super.loadFile(filename, currentDirectory, options, environment);
                    }
                    catch (error) {
                        // Attempt a full resolution if not found
                        const fullResult = await resolver(filename, {
                            kind: 'import-rule',
                            resolveDir: currentDirectory,
                        });
                        if (fullResult.path) {
                            return {
                                filename: fullResult.path,
                                contents: await (0, promises_1.readFile)(fullResult.path, 'utf-8'),
                            };
                        }
                        // Otherwise error by throwing the failing direct result
                        throw error;
                    }
                }
            })();
            pluginManager.addFileManager(resolverFileManager);
        },
    };
    try {
        const result = await less.render(data, {
            filename,
            paths: options.includePaths,
            plugins: [resolverPlugin],
            rewriteUrls: 'all',
            sourceMap: options.sourcemap
                ? {
                    sourceMapFileInline: true,
                    outputSourceFiles: true,
                }
                : undefined,
        });
        return {
            contents: result.css,
            loader: 'css',
            watchFiles: [filename, ...result.imports],
        };
    }
    catch (error) {
        if (isLessException(error)) {
            return {
                errors: [
                    {
                        text: error.message,
                        location: {
                            file: error.filename,
                            line: error.line,
                            column: error.column,
                            // Middle element represents the line containing the error
                            lineText: error.extract && error.extract[Math.trunc(error.extract.length / 2)],
                        },
                    },
                ],
                loader: 'css',
            };
        }
        throw error;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVzcy1sYW5ndWFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Rvb2xzL2VzYnVpbGQvc3R5bGVzaGVldHMvbGVzcy1sYW5ndWFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdILCtDQUE0QztBQUc1Qzs7O0dBR0c7QUFDSCxJQUFJLGdCQUFtRCxDQUFDO0FBU3hELFNBQVMsZUFBZSxDQUFDLEtBQWM7SUFDckMsT0FBTyxDQUFDLENBQUMsS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxRQUFRLElBQUksS0FBSyxDQUFDO0FBQ25FLENBQUM7QUFFWSxRQUFBLHNCQUFzQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQXFCO0lBQ3RFLElBQUksRUFBRSxNQUFNO0lBQ1osZUFBZSxFQUFFLFFBQVE7SUFDekIsVUFBVSxFQUFFLFNBQVM7SUFDckIsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLO1FBQ25DLE9BQU8sYUFBYSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDdkUsQ0FBQztDQUNGLENBQUMsQ0FBQztBQUVILEtBQUssVUFBVSxhQUFhLENBQzFCLElBQVksRUFDWixRQUFnQixFQUNoQixPQUFnQyxFQUNoQyxRQUFnQztJQUVoQyxNQUFNLElBQUksR0FBRyxDQUFDLGdCQUFnQixLQUFoQixnQkFBZ0IsR0FBSyxDQUFDLHdEQUFhLE1BQU0sR0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUM7SUFFbkUsTUFBTSxjQUFjLEdBQWdCO1FBQ2xDLE9BQU8sQ0FBQyxFQUFFLFdBQVcsRUFBRSxFQUFFLGFBQWE7WUFDcEMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsS0FBTSxTQUFRLFdBQVc7Z0JBQy9DLFlBQVk7b0JBQ25CLE9BQU8sS0FBSyxDQUFDO2dCQUNmLENBQUM7Z0JBRVEsUUFBUTtvQkFDZixPQUFPLElBQUksQ0FBQztnQkFDZCxDQUFDO2dCQUVRLEtBQUssQ0FBQyxRQUFRLENBQ3JCLFFBQWdCLEVBQ2hCLGdCQUF3QixFQUN4QixPQUE2QixFQUM3QixXQUE2QjtvQkFFN0IseUVBQXlFO29CQUN6RSxJQUFJO3dCQUNGLE9BQU8sTUFBTSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7cUJBQy9FO29CQUFDLE9BQU8sS0FBSyxFQUFFO3dCQUNkLHlDQUF5Qzt3QkFDekMsTUFBTSxVQUFVLEdBQUcsTUFBTSxRQUFRLENBQUMsUUFBUSxFQUFFOzRCQUMxQyxJQUFJLEVBQUUsYUFBYTs0QkFDbkIsVUFBVSxFQUFFLGdCQUFnQjt5QkFDN0IsQ0FBQyxDQUFDO3dCQUNILElBQUksVUFBVSxDQUFDLElBQUksRUFBRTs0QkFDbkIsT0FBTztnQ0FDTCxRQUFRLEVBQUUsVUFBVSxDQUFDLElBQUk7Z0NBQ3pCLFFBQVEsRUFBRSxNQUFNLElBQUEsbUJBQVEsRUFBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQzs2QkFDbkQsQ0FBQzt5QkFDSDt3QkFDRCx3REFBd0Q7d0JBQ3hELE1BQU0sS0FBSyxDQUFDO3FCQUNiO2dCQUNILENBQUM7YUFDRixDQUFDLEVBQUUsQ0FBQztZQUVMLGFBQWEsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUNwRCxDQUFDO0tBQ0YsQ0FBQztJQUVGLElBQUk7UUFDRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO1lBQ3JDLFFBQVE7WUFDUixLQUFLLEVBQUUsT0FBTyxDQUFDLFlBQVk7WUFDM0IsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDO1lBQ3pCLFdBQVcsRUFBRSxLQUFLO1lBQ2xCLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztnQkFDMUIsQ0FBQyxDQUFDO29CQUNFLG1CQUFtQixFQUFFLElBQUk7b0JBQ3pCLGlCQUFpQixFQUFFLElBQUk7aUJBQ3hCO2dCQUNILENBQUMsQ0FBQyxTQUFTO1NBQ0UsQ0FBQyxDQUFDO1FBRW5CLE9BQU87WUFDTCxRQUFRLEVBQUUsTUFBTSxDQUFDLEdBQUc7WUFDcEIsTUFBTSxFQUFFLEtBQUs7WUFDYixVQUFVLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1NBQzFDLENBQUM7S0FDSDtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDMUIsT0FBTztnQkFDTCxNQUFNLEVBQUU7b0JBQ047d0JBQ0UsSUFBSSxFQUFFLEtBQUssQ0FBQyxPQUFPO3dCQUNuQixRQUFRLEVBQUU7NEJBQ1IsSUFBSSxFQUFFLEtBQUssQ0FBQyxRQUFROzRCQUNwQixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7NEJBQ2hCLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTTs0QkFDcEIsMERBQTBEOzRCQUMxRCxRQUFRLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7eUJBQy9FO3FCQUNGO2lCQUNGO2dCQUNELE1BQU0sRUFBRSxLQUFLO2FBQ2QsQ0FBQztTQUNIO1FBRUQsTUFBTSxLQUFLLENBQUM7S0FDYjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBPbkxvYWRSZXN1bHQsIFBsdWdpbkJ1aWxkIH0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgU3R5bGVzaGVldExhbmd1YWdlLCBTdHlsZXNoZWV0UGx1Z2luT3B0aW9ucyB9IGZyb20gJy4vc3R5bGVzaGVldC1wbHVnaW4tZmFjdG9yeSc7XG5cbi8qKlxuICogVGhlIGxhenktbG9hZGVkIGluc3RhbmNlIG9mIHRoZSBsZXNzIHN0eWxlc2hlZXQgcHJlcHJvY2Vzc29yLlxuICogSXQgaXMgb25seSBpbXBvcnRlZCBhbmQgaW5pdGlhbGl6ZWQgaWYgYSBsZXNzIHN0eWxlc2hlZXQgaXMgdXNlZC5cbiAqL1xubGV0IGxlc3NQcmVwcm9jZXNzb3I6IHR5cGVvZiBpbXBvcnQoJ2xlc3MnKSB8IHVuZGVmaW5lZDtcblxuaW50ZXJmYWNlIExlc3NFeGNlcHRpb24gZXh0ZW5kcyBFcnJvciB7XG4gIGZpbGVuYW1lOiBzdHJpbmc7XG4gIGxpbmU6IG51bWJlcjtcbiAgY29sdW1uOiBudW1iZXI7XG4gIGV4dHJhY3Q/OiBzdHJpbmdbXTtcbn1cblxuZnVuY3Rpb24gaXNMZXNzRXhjZXB0aW9uKGVycm9yOiB1bmtub3duKTogZXJyb3IgaXMgTGVzc0V4Y2VwdGlvbiB7XG4gIHJldHVybiAhIWVycm9yICYmIHR5cGVvZiBlcnJvciA9PT0gJ29iamVjdCcgJiYgJ2NvbHVtbicgaW4gZXJyb3I7XG59XG5cbmV4cG9ydCBjb25zdCBMZXNzU3R5bGVzaGVldExhbmd1YWdlID0gT2JqZWN0LmZyZWV6ZTxTdHlsZXNoZWV0TGFuZ3VhZ2U+KHtcbiAgbmFtZTogJ2xlc3MnLFxuICBjb21wb25lbnRGaWx0ZXI6IC9ebGVzczsvLFxuICBmaWxlRmlsdGVyOiAvXFwubGVzcyQvLFxuICBwcm9jZXNzKGRhdGEsIGZpbGUsIF8sIG9wdGlvbnMsIGJ1aWxkKSB7XG4gICAgcmV0dXJuIGNvbXBpbGVTdHJpbmcoZGF0YSwgZmlsZSwgb3B0aW9ucywgYnVpbGQucmVzb2x2ZS5iaW5kKGJ1aWxkKSk7XG4gIH0sXG59KTtcblxuYXN5bmMgZnVuY3Rpb24gY29tcGlsZVN0cmluZyhcbiAgZGF0YTogc3RyaW5nLFxuICBmaWxlbmFtZTogc3RyaW5nLFxuICBvcHRpb25zOiBTdHlsZXNoZWV0UGx1Z2luT3B0aW9ucyxcbiAgcmVzb2x2ZXI6IFBsdWdpbkJ1aWxkWydyZXNvbHZlJ10sXG4pOiBQcm9taXNlPE9uTG9hZFJlc3VsdD4ge1xuICBjb25zdCBsZXNzID0gKGxlc3NQcmVwcm9jZXNzb3IgPz89IChhd2FpdCBpbXBvcnQoJ2xlc3MnKSkuZGVmYXVsdCk7XG5cbiAgY29uc3QgcmVzb2x2ZXJQbHVnaW46IExlc3MuUGx1Z2luID0ge1xuICAgIGluc3RhbGwoeyBGaWxlTWFuYWdlciB9LCBwbHVnaW5NYW5hZ2VyKTogdm9pZCB7XG4gICAgICBjb25zdCByZXNvbHZlckZpbGVNYW5hZ2VyID0gbmV3IChjbGFzcyBleHRlbmRzIEZpbGVNYW5hZ2VyIHtcbiAgICAgICAgb3ZlcnJpZGUgc3VwcG9ydHNTeW5jKCk6IGJvb2xlYW4ge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIG92ZXJyaWRlIHN1cHBvcnRzKCk6IGJvb2xlYW4ge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgb3ZlcnJpZGUgYXN5bmMgbG9hZEZpbGUoXG4gICAgICAgICAgZmlsZW5hbWU6IHN0cmluZyxcbiAgICAgICAgICBjdXJyZW50RGlyZWN0b3J5OiBzdHJpbmcsXG4gICAgICAgICAgb3B0aW9uczogTGVzcy5Mb2FkRmlsZU9wdGlvbnMsXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IExlc3MuRW52aXJvbm1lbnQsXG4gICAgICAgICk6IFByb21pc2U8TGVzcy5GaWxlTG9hZFJlc3VsdD4ge1xuICAgICAgICAgIC8vIEF0dGVtcHQgZGlyZWN0IGxvYWRpbmcgYXMgYSByZWxhdGl2ZSBwYXRoIHRvIGF2b2lkIHJlc29sdXRpb24gb3ZlcmhlYWRcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHN1cGVyLmxvYWRGaWxlKGZpbGVuYW1lLCBjdXJyZW50RGlyZWN0b3J5LCBvcHRpb25zLCBlbnZpcm9ubWVudCk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIEF0dGVtcHQgYSBmdWxsIHJlc29sdXRpb24gaWYgbm90IGZvdW5kXG4gICAgICAgICAgICBjb25zdCBmdWxsUmVzdWx0ID0gYXdhaXQgcmVzb2x2ZXIoZmlsZW5hbWUsIHtcbiAgICAgICAgICAgICAga2luZDogJ2ltcG9ydC1ydWxlJyxcbiAgICAgICAgICAgICAgcmVzb2x2ZURpcjogY3VycmVudERpcmVjdG9yeSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGZ1bGxSZXN1bHQucGF0aCkge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBmdWxsUmVzdWx0LnBhdGgsXG4gICAgICAgICAgICAgICAgY29udGVudHM6IGF3YWl0IHJlYWRGaWxlKGZ1bGxSZXN1bHQucGF0aCwgJ3V0Zi04JyksXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBPdGhlcndpc2UgZXJyb3IgYnkgdGhyb3dpbmcgdGhlIGZhaWxpbmcgZGlyZWN0IHJlc3VsdFxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSgpO1xuXG4gICAgICBwbHVnaW5NYW5hZ2VyLmFkZEZpbGVNYW5hZ2VyKHJlc29sdmVyRmlsZU1hbmFnZXIpO1xuICAgIH0sXG4gIH07XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBsZXNzLnJlbmRlcihkYXRhLCB7XG4gICAgICBmaWxlbmFtZSxcbiAgICAgIHBhdGhzOiBvcHRpb25zLmluY2x1ZGVQYXRocyxcbiAgICAgIHBsdWdpbnM6IFtyZXNvbHZlclBsdWdpbl0sXG4gICAgICByZXdyaXRlVXJsczogJ2FsbCcsXG4gICAgICBzb3VyY2VNYXA6IG9wdGlvbnMuc291cmNlbWFwXG4gICAgICAgID8ge1xuICAgICAgICAgICAgc291cmNlTWFwRmlsZUlubGluZTogdHJ1ZSxcbiAgICAgICAgICAgIG91dHB1dFNvdXJjZUZpbGVzOiB0cnVlLFxuICAgICAgICAgIH1cbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgfSBhcyBMZXNzLk9wdGlvbnMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnRzOiByZXN1bHQuY3NzLFxuICAgICAgbG9hZGVyOiAnY3NzJyxcbiAgICAgIHdhdGNoRmlsZXM6IFtmaWxlbmFtZSwgLi4ucmVzdWx0LmltcG9ydHNdLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGlzTGVzc0V4Y2VwdGlvbihlcnJvcikpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGVycm9yczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgICAgICBmaWxlOiBlcnJvci5maWxlbmFtZSxcbiAgICAgICAgICAgICAgbGluZTogZXJyb3IubGluZSxcbiAgICAgICAgICAgICAgY29sdW1uOiBlcnJvci5jb2x1bW4sXG4gICAgICAgICAgICAgIC8vIE1pZGRsZSBlbGVtZW50IHJlcHJlc2VudHMgdGhlIGxpbmUgY29udGFpbmluZyB0aGUgZXJyb3JcbiAgICAgICAgICAgICAgbGluZVRleHQ6IGVycm9yLmV4dHJhY3QgJiYgZXJyb3IuZXh0cmFjdFtNYXRoLnRydW5jKGVycm9yLmV4dHJhY3QubGVuZ3RoIC8gMildLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBsb2FkZXI6ICdjc3MnLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuIl19