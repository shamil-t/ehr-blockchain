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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StylesheetPluginFactory = void 0;
const fast_glob_1 = __importDefault(require("fast-glob"));
const node_assert_1 = __importDefault(require("node:assert"));
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const load_result_cache_1 = require("../load-result-cache");
/**
 * The lazy-loaded instance of the postcss stylesheet postprocessor.
 * It is only imported and initialized if postcss is needed.
 */
let postcss;
/**
 * An array of keywords that indicate Tailwind CSS processing is required for a stylesheet.
 *
 * Based on https://tailwindcss.com/docs/functions-and-directives
 */
const TAILWIND_KEYWORDS = ['@tailwind', '@layer', '@apply', '@config', 'theme(', 'screen('];
class StylesheetPluginFactory {
    constructor(options, cache) {
        this.options = options;
        this.cache = cache;
    }
    create(language) {
        // Return a noop plugin if no load actions are required
        if (!language.process && !this.options.tailwindConfiguration) {
            return {
                name: 'angular-' + language.name,
                setup() { },
            };
        }
        const { cache, options } = this;
        const setupPostcss = async () => {
            // Return already created processor if present
            if (this.postcssProcessor) {
                return this.postcssProcessor;
            }
            if (options.tailwindConfiguration) {
                postcss ?? (postcss = (await Promise.resolve().then(() => __importStar(require('postcss')))).default);
                const tailwind = await Promise.resolve(`${options.tailwindConfiguration.package}`).then(s => __importStar(require(s)));
                this.postcssProcessor = postcss().use(tailwind.default({ config: options.tailwindConfiguration.file }));
            }
            return this.postcssProcessor;
        };
        return {
            name: 'angular-' + language.name,
            async setup(build) {
                // Setup postcss if needed
                const postcssProcessor = await setupPostcss();
                // Add a load callback to support inline Component styles
                build.onLoad({ filter: language.componentFilter, namespace: 'angular:styles/component' }, (0, load_result_cache_1.createCachedLoad)(cache, (args) => {
                    const data = options.inlineComponentData?.[args.path];
                    (0, node_assert_1.default)(typeof data === 'string', `component style name should always be found [${args.path}]`);
                    const [format, , filename] = args.path.split(';', 3);
                    // Only use postcss if Tailwind processing is required.
                    // NOTE: If postcss is used for more than just Tailwind in the future this check MUST
                    // be updated to account for the additional use.
                    // TODO: use better search algorithm for keywords
                    const needsPostcss = !!postcssProcessor && TAILWIND_KEYWORDS.some((keyword) => data.includes(keyword));
                    return processStylesheet(language, data, filename, format, options, build, needsPostcss ? postcssProcessor : undefined);
                }));
                // Add a load callback to support files from disk
                build.onLoad({ filter: language.fileFilter }, (0, load_result_cache_1.createCachedLoad)(cache, async (args) => {
                    const data = await (0, promises_1.readFile)(args.path, 'utf-8');
                    const needsPostcss = !!postcssProcessor && TAILWIND_KEYWORDS.some((keyword) => data.includes(keyword));
                    return processStylesheet(language, data, args.path, (0, node_path_1.extname)(args.path).toLowerCase().slice(1), options, build, needsPostcss ? postcssProcessor : undefined);
                }));
            },
        };
    }
}
exports.StylesheetPluginFactory = StylesheetPluginFactory;
async function processStylesheet(language, data, filename, format, options, build, postcssProcessor) {
    let result;
    // Process the input data if the language requires preprocessing
    if (language.process) {
        result = await language.process(data, filename, format, options, build);
    }
    else {
        result = {
            contents: data,
            loader: 'css',
            watchFiles: [filename],
        };
    }
    // Transform with postcss if needed and there are no errors
    if (postcssProcessor && result.contents && !result.errors?.length) {
        const postcssResult = await compileString(typeof result.contents === 'string'
            ? result.contents
            : Buffer.from(result.contents).toString('utf-8'), filename, postcssProcessor, options);
        // Merge results
        if (postcssResult.errors?.length) {
            delete result.contents;
        }
        if (result.warnings && postcssResult.warnings) {
            postcssResult.warnings.unshift(...result.warnings);
        }
        if (result.watchFiles && postcssResult.watchFiles) {
            postcssResult.watchFiles.unshift(...result.watchFiles);
        }
        if (result.watchDirs && postcssResult.watchDirs) {
            postcssResult.watchDirs.unshift(...result.watchDirs);
        }
        result = {
            ...result,
            ...postcssResult,
        };
    }
    return result;
}
/**
 * Compiles the provided CSS stylesheet data using a provided postcss processor and provides an
 * esbuild load result that can be used directly by an esbuild Plugin.
 * @param data The stylesheet content to process.
 * @param filename The name of the file that contains the data.
 * @param postcssProcessor A postcss processor instance to use.
 * @param options The plugin options to control the processing.
 * @returns An esbuild OnLoaderResult object with the processed content, warnings, and/or errors.
 */
async function compileString(data, filename, postcssProcessor, options) {
    try {
        const postcssResult = await postcssProcessor.process(data, {
            from: filename,
            to: filename,
            map: options.sourcemap && {
                inline: true,
                sourcesContent: true,
            },
        });
        const loadResult = {
            contents: postcssResult.css,
            loader: 'css',
        };
        const rawWarnings = postcssResult.warnings();
        if (rawWarnings.length > 0) {
            const lineMappings = new Map();
            loadResult.warnings = rawWarnings.map((warning) => {
                const file = warning.node.source?.input.file;
                if (file === undefined) {
                    return { text: warning.text };
                }
                let lines = lineMappings.get(file);
                if (lines === undefined) {
                    lines = warning.node.source?.input.css.split(/\r?\n/);
                    lineMappings.set(file, lines ?? null);
                }
                return {
                    text: warning.text,
                    location: {
                        file,
                        line: warning.line,
                        column: warning.column - 1,
                        lineText: lines?.[warning.line - 1],
                    },
                };
            });
        }
        for (const resultMessage of postcssResult.messages) {
            if (resultMessage.type === 'dependency' && typeof resultMessage['file'] === 'string') {
                loadResult.watchFiles ?? (loadResult.watchFiles = []);
                loadResult.watchFiles.push(resultMessage['file']);
            }
            else if (resultMessage.type === 'dir-dependency' &&
                typeof resultMessage['dir'] === 'string' &&
                typeof resultMessage['glob'] === 'string') {
                loadResult.watchFiles ?? (loadResult.watchFiles = []);
                const dependencies = await (0, fast_glob_1.default)(resultMessage['glob'], {
                    absolute: true,
                    cwd: resultMessage['dir'],
                });
                loadResult.watchFiles.push(...dependencies);
            }
        }
        return loadResult;
    }
    catch (error) {
        postcss ?? (postcss = (await Promise.resolve().then(() => __importStar(require('postcss')))).default);
        if (error instanceof postcss.CssSyntaxError) {
            const lines = error.source?.split(/\r?\n/);
            return {
                errors: [
                    {
                        text: error.reason,
                        location: {
                            file: error.file,
                            line: error.line,
                            column: error.column && error.column - 1,
                            lineText: error.line === undefined ? undefined : lines?.[error.line - 1],
                        },
                    },
                ],
            };
        }
        throw error;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVzaGVldC1wbHVnaW4tZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Rvb2xzL2VzYnVpbGQvc3R5bGVzaGVldHMvc3R5bGVzaGVldC1wbHVnaW4tZmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdILDBEQUE2QjtBQUM3Qiw4REFBaUM7QUFDakMsK0NBQTRDO0FBQzVDLHlDQUFvQztBQUNwQyw0REFBeUU7QUFFekU7OztHQUdHO0FBQ0gsSUFBSSxPQUF3RCxDQUFDO0FBZ0M3RDs7OztHQUlHO0FBQ0gsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFlNUYsTUFBYSx1QkFBdUI7SUFHbEMsWUFDbUIsT0FBZ0MsRUFDaEMsS0FBdUI7UUFEdkIsWUFBTyxHQUFQLE9BQU8sQ0FBeUI7UUFDaEMsVUFBSyxHQUFMLEtBQUssQ0FBa0I7SUFDdkMsQ0FBQztJQUVKLE1BQU0sQ0FBQyxRQUFzQztRQUMzQyx1REFBdUQ7UUFDdkQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFO1lBQzVELE9BQU87Z0JBQ0wsSUFBSSxFQUFFLFVBQVUsR0FBRyxRQUFRLENBQUMsSUFBSTtnQkFDaEMsS0FBSyxLQUFJLENBQUM7YUFDWCxDQUFDO1NBQ0g7UUFFRCxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztRQUNoQyxNQUFNLFlBQVksR0FBRyxLQUFLLElBQUksRUFBRTtZQUM5Qiw4Q0FBOEM7WUFDOUMsSUFBSSxJ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QUksRUFBRSxLQUFLLENBQUMsSUFBSTs0QkFDaEIsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJOzRCQUNoQixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUM7NEJBQ3hDLFFBQVEsRUFBRSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQzt5QkFDekU7cUJBQ0Y7aUJBQ0Y7YUFDRixDQUFDO1NBQ0g7UUFFRCxNQUFNLEtBQUssQ0FBQztLQUNiO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IE9uTG9hZFJlc3VsdCwgUGx1Z2luLCBQbHVnaW5CdWlsZCB9IGZyb20gJ2VzYnVpbGQnO1xuaW1wb3J0IGdsb2IgZnJvbSAnZmFzdC1nbG9iJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnbm9kZTphc3NlcnQnO1xuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB7IGV4dG5hbWUgfSBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgTG9hZFJlc3VsdENhY2hlLCBjcmVhdGVDYWNoZWRMb2FkIH0gZnJvbSAnLi4vbG9hZC1yZXN1bHQtY2FjaGUnO1xuXG4vKipcbiAqIFRoZSBsYXp5LWxvYWRlZCBpbnN0YW5jZSBvZiB0aGUgcG9zdGNzcyBzdHlsZXNoZWV0IHBvc3Rwcm9jZXNzb3IuXG4gKiBJdCBpcyBvbmx5IGltcG9ydGVkIGFuZCBpbml0aWFsaXplZCBpZiBwb3N0Y3NzIGlzIG5lZWRlZC5cbiAqL1xubGV0IHBvc3Rjc3M6IHR5cGVvZiBpbXBvcnQoJ3Bvc3Rjc3MnKVsnZGVmYXVsdCddIHwgdW5kZWZpbmVkO1xuXG4vKipcbiAqIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBwbHVnaW4gb3B0aW9ucyB0byB1c2Ugd2hlbiBwcm9jZXNzaW5nIHN0eWxlc2hlZXRzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0eWxlc2hlZXRQbHVnaW5PcHRpb25zIHtcbiAgLyoqXG4gICAqIENvbnRyb2xzIHRoZSB1c2UgYW5kIGNyZWF0aW9uIG9mIHNvdXJjZW1hcHMgd2hlbiBwcm9jZXNzaW5nIHRoZSBzdHlsZXNoZWV0cy5cbiAgICogSWYgdHJ1ZSwgc291cmNlbWFwIHByb2Nlc3NpbmcgaXMgZW5hYmxlZDsgaWYgZmFsc2UsIGRpc2FibGVkLlxuICAgKi9cbiAgc291cmNlbWFwOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBhcnJheSBvZiBwYXRocyB0aGF0IHdpbGwgYmUgc2VhcmNoZWQgZm9yIHN0eWxlc2hlZXRzIGlmIHRoZSBkZWZhdWx0XG4gICAqIHJlc29sdXRpb24gcHJvY2VzcyBmb3IgdGhlIHN0eWxlc2hlZXQgbGFuZ3VhZ2UgZG9lcyBub3Qgc3VjY2VlZC5cbiAgICovXG4gIGluY2x1ZGVQYXRocz86IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbCBjb21wb25lbnQgZGF0YSBmb3IgYW55IGlubGluZSBzdHlsZXMgZnJvbSBDb21wb25lbnQgZGVjb3JhdG9yIGBzdHlsZXNgIGZpZWxkcy5cbiAgICogVGhlIGtleSBpcyBhbiBpbnRlcm5hbCBhbmd1bGFyIHJlc291cmNlIFVSSSBhbmQgdGhlIHZhbHVlIGlzIHRoZSBzdHlsZXNoZWV0IGNvbnRlbnQuXG4gICAqL1xuICBpbmxpbmVDb21wb25lbnREYXRhPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblxuICAvKipcbiAgICogT3B0aW9uYWwgaW5mb3JtYXRpb24gdXNlZCB0byBsb2FkIGFuZCBjb25maWd1cmUgVGFpbHdpbmQgQ1NTLiBJZiBwcmVzZW50LCB0aGUgcG9zdGNzc1xuICAgKiB3aWxsIGJlIGFkZGVkIHRvIHRoZSBzdHlsZXNoZWV0IHByb2Nlc3Npbmcgd2l0aCB0aGUgVGFpbHdpbmQgcGx1Z2luIHNldHVwIGFzIHByb3ZpZGVkXG4gICAqIGJ5IHRoZSBjb25maWd1cmF0aW9uIGZpbGUuXG4gICAqL1xuICB0YWlsd2luZENvbmZpZ3VyYXRpb24/OiB7IGZpbGU6IHN0cmluZzsgcGFja2FnZTogc3RyaW5nIH07XG59XG5cbi8qKlxuICogQW4gYXJyYXkgb2Yga2V5d29yZHMgdGhhdCBpbmRpY2F0ZSBUYWlsd2luZCBDU1MgcHJvY2Vzc2luZyBpcyByZXF1aXJlZCBmb3IgYSBzdHlsZXNoZWV0LlxuICpcbiAqIEJhc2VkIG9uIGh0dHBzOi8vdGFpbHdpbmRjc3MuY29tL2RvY3MvZnVuY3Rpb25zLWFuZC1kaXJlY3RpdmVzXG4gKi9cbmNvbnN0IFRBSUxXSU5EX0tFWVdPUkRTID0gWydAdGFpbHdpbmQnLCAnQGxheWVyJywgJ0BhcHBseScsICdAY29uZmlnJywgJ3RoZW1lKCcsICdzY3JlZW4oJ107XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGVzaGVldExhbmd1YWdlIHtcbiAgbmFtZTogc3RyaW5nO1xuICBjb21wb25lbnRGaWx0ZXI6IFJlZ0V4cDtcbiAgZmlsZUZpbHRlcjogUmVnRXhwO1xuICBwcm9jZXNzPyhcbiAgICBkYXRhOiBzdHJpbmcsXG4gICAgZmlsZTogc3RyaW5nLFxuICAgIGZvcm1hdDogc3RyaW5nLFxuICAgIG9wdGlvbnM6IFN0eWxlc2hlZXRQbHVnaW5PcHRpb25zLFxuICAgIGJ1aWxkOiBQbHVnaW5CdWlsZCxcbiAgKTogT25Mb2FkUmVzdWx0IHwgUHJvbWlzZTxPbkxvYWRSZXN1bHQ+O1xufVxuXG5leHBvcnQgY2xhc3MgU3R5bGVzaGVldFBsdWdpbkZhY3Rvcnkge1xuICBwcml2YXRlIHBvc3Rjc3NQcm9jZXNzb3I/OiBpbXBvcnQoJ3Bvc3Rjc3MnKS5Qcm9jZXNzb3I7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBTdHlsZXNoZWV0UGx1Z2luT3B0aW9ucyxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNhY2hlPzogTG9hZFJlc3VsdENhY2hlLFxuICApIHt9XG5cbiAgY3JlYXRlKGxhbmd1YWdlOiBSZWFkb25seTxTdHlsZXNoZWV0TGFuZ3VhZ2U+KTogUGx1Z2luIHtcbiAgICAvLyBSZXR1cm4gYSBub29wIHBsdWdpbiBpZiBubyBsb2FkIGFjdGlvbnMgYXJlIHJlcXVpcmVkXG4gICAgaWYgKCFsYW5ndWFnZS5wcm9jZXNzICYmICF0aGlzLm9wdGlvbnMudGFpbHdpbmRDb25maWd1cmF0aW9uKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiAnYW5ndWxhci0nICsgbGFuZ3VhZ2UubmFtZSxcbiAgICAgICAgc2V0dXAoKSB7fSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyBjYWNoZSwgb3B0aW9ucyB9ID0gdGhpcztcbiAgICBjb25zdCBzZXR1cFBvc3Rjc3MgPSBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBSZXR1cm4gYWxyZWFkeSBjcmVhdGVkIHByb2Nlc3NvciBpZiBwcmVzZW50XG4gICAgICBpZiAodGhpcy5wb3N0Y3NzUHJvY2Vzc29yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvc3Rjc3NQcm9jZXNzb3I7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLnRhaWx3aW5kQ29uZmlndXJhdGlvbikge1xuICAgICAgICBwb3N0Y3NzID8/PSAoYXdhaXQgaW1wb3J0KCdwb3N0Y3NzJykpLmRlZmF1bHQ7XG4gICAgICAgIGNvbnN0IHRhaWx3aW5kID0gYXdhaXQgaW1wb3J0KG9wdGlvbnMudGFpbHdpbmRDb25maWd1cmF0aW9uLnBhY2thZ2UpO1xuICAgICAgICB0aGlzLnBvc3Rjc3NQcm9jZXNzb3IgPSBwb3N0Y3NzKCkudXNlKFxuICAgICAgICAgIHRhaWx3aW5kLmRlZmF1bHQoeyBjb25maWc6IG9wdGlvbnMudGFpbHdpbmRDb25maWd1cmF0aW9uLmZpbGUgfSksXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLnBvc3Rjc3NQcm9jZXNzb3I7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiAnYW5ndWxhci0nICsgbGFuZ3VhZ2UubmFtZSxcbiAgICAgIGFzeW5jIHNldHVwKGJ1aWxkKSB7XG4gICAgICAgIC8vIFNldHVwIHBvc3Rjc3MgaWYgbmVlZGVkXG4gICAgICAgIGNvbnN0IHBvc3Rjc3NQcm9jZXNzb3IgPSBhd2FpdCBzZXR1cFBvc3Rjc3MoKTtcblxuICAgICAgICAvLyBBZGQgYSBsb2FkIGNhbGxiYWNrIHRvIHN1cHBvcnQgaW5saW5lIENvbXBvbmVudCBzdHlsZXNcbiAgICAgICAgYnVpbGQub25Mb2FkKFxuICAgICAgICAgIHsgZmlsdGVyOiBsYW5ndWFnZS5jb21wb25lbnRGaWx0ZXIsIG5hbWVzcGFjZTogJ2FuZ3VsYXI6c3R5bGVzL2NvbXBvbmVudCcgfSxcbiAgICAgICAgICBjcmVhdGVDYWNoZWRMb2FkKGNhY2hlLCAoYXJncykgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IG9wdGlvbnMuaW5saW5lQ29tcG9uZW50RGF0YT8uW2FyZ3MucGF0aF07XG4gICAgICAgICAgICBhc3NlcnQoXG4gICAgICAgICAgICAgIHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgYGNvbXBvbmVudCBzdHlsZSBuYW1lIHNob3VsZCBhbHdheXMgYmUgZm91bmQgWyR7YXJncy5wYXRofV1gLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgY29uc3QgW2Zvcm1hdCwgLCBmaWxlbmFtZV0gPSBhcmdzLnBhdGguc3BsaXQoJzsnLCAzKTtcbiAgICAgICAgICAgIC8vIE9ubHkgdXNlIHBvc3Rjc3MgaWYgVGFpbHdpbmQgcHJvY2Vzc2luZyBpcyByZXF1aXJlZC5cbiAgICAgICAgICAgIC8vIE5PVEU6IElmIHBvc3Rjc3MgaXMgdXNlZCBmb3IgbW9yZSB0aGFuIGp1c3QgVGFpbHdpbmQgaW4gdGhlIGZ1dHVyZSB0aGlzIGNoZWNrIE1VU1RcbiAgICAgICAgICAgIC8vIGJlIHVwZGF0ZWQgdG8gYWNjb3VudCBmb3IgdGhlIGFkZGl0aW9uYWwgdXNlLlxuICAgICAgICAgICAgLy8gVE9ETzogdXNlIGJldHRlciBzZWFyY2ggYWxnb3JpdGhtIGZvciBrZXl3b3Jkc1xuICAgICAgICAgICAgY29uc3QgbmVlZHNQb3N0Y3NzID1cbiAgICAgICAgICAgICAgISFwb3N0Y3NzUHJvY2Vzc29yICYmIFRBSUxXSU5EX0tFWVdPUkRTLnNvbWUoKGtleXdvcmQpID0+IGRhdGEuaW5jbHVkZXMoa2V5d29yZCkpO1xuXG4gICAgICAgICAgICByZXR1cm4gcHJvY2Vzc1N0eWxlc2hlZXQoXG4gICAgICAgICAgICAgIGxhbmd1YWdlLFxuICAgICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgICBmaWxlbmFtZSxcbiAgICAgICAgICAgICAgZm9ybWF0LFxuICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICBidWlsZCxcbiAgICAgICAgICAgICAgbmVlZHNQb3N0Y3NzID8gcG9zdGNzc1Byb2Nlc3NvciA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSksXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gQWRkIGEgbG9hZCBjYWxsYmFjayB0byBzdXBwb3J0IGZpbGVzIGZyb20gZGlza1xuICAgICAgICBidWlsZC5vbkxvYWQoXG4gICAgICAgICAgeyBmaWx0ZXI6IGxhbmd1YWdlLmZpbGVGaWx0ZXIgfSxcbiAgICAgICAgICBjcmVhdGVDYWNoZWRMb2FkKGNhY2hlLCBhc3luYyAoYXJncykgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlYWRGaWxlKGFyZ3MucGF0aCwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICBjb25zdCBuZWVkc1Bvc3Rjc3MgPVxuICAgICAgICAgICAgICAhIXBvc3Rjc3NQcm9jZXNzb3IgJiYgVEFJTFdJTkRfS0VZV09SRFMuc29tZSgoa2V5d29yZCkgPT4gZGF0YS5pbmNsdWRlcyhrZXl3b3JkKSk7XG5cbiAgICAgICAgICAgIHJldHVybiBwcm9jZXNzU3R5bGVzaGVldChcbiAgICAgICAgICAgICAgbGFuZ3VhZ2UsXG4gICAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICAgIGFyZ3MucGF0aCxcbiAgICAgICAgICAgICAgZXh0bmFtZShhcmdzLnBhdGgpLnRvTG93ZXJDYXNlKCkuc2xpY2UoMSksXG4gICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgIGJ1aWxkLFxuICAgICAgICAgICAgICBuZWVkc1Bvc3Rjc3MgPyBwb3N0Y3NzUHJvY2Vzc29yIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBwcm9jZXNzU3R5bGVzaGVldChcbiAgbGFuZ3VhZ2U6IFJlYWRvbmx5PFN0eWxlc2hlZXRMYW5ndWFnZT4sXG4gIGRhdGE6IHN0cmluZyxcbiAgZmlsZW5hbWU6IHN0cmluZyxcbiAgZm9ybWF0OiBzdHJpbmcsXG4gIG9wdGlvbnM6IFN0eWxlc2hlZXRQbHVnaW5PcHRpb25zLFxuICBidWlsZDogUGx1Z2luQnVpbGQsXG4gIHBvc3Rjc3NQcm9jZXNzb3I6IGltcG9ydCgncG9zdGNzcycpLlByb2Nlc3NvciB8IHVuZGVmaW5lZCxcbikge1xuICBsZXQgcmVzdWx0OiBPbkxvYWRSZXN1bHQ7XG5cbiAgLy8gUHJvY2VzcyB0aGUgaW5wdXQgZGF0YSBpZiB0aGUgbGFuZ3VhZ2UgcmVxdWlyZXMgcHJlcHJvY2Vzc2luZ1xuICBpZiAobGFuZ3VhZ2UucHJvY2Vzcykge1xuICAgIHJlc3VsdCA9IGF3YWl0IGxhbmd1YWdlLnByb2Nlc3MoZGF0YSwgZmlsZW5hbWUsIGZvcm1hdCwgb3B0aW9ucywgYnVpbGQpO1xuICB9IGVsc2Uge1xuICAgIHJlc3VsdCA9IHtcbiAgICAgIGNvbnRlbnRzOiBkYXRhLFxuICAgICAgbG9hZGVyOiAnY3NzJyxcbiAgICAgIHdhdGNoRmlsZXM6IFtmaWxlbmFtZV0sXG4gICAgfTtcbiAgfVxuXG4gIC8vIFRyYW5zZm9ybSB3aXRoIHBvc3Rjc3MgaWYgbmVlZGVkIGFuZCB0aGVyZSBhcmUgbm8gZXJyb3JzXG4gIGlmIChwb3N0Y3NzUHJvY2Vzc29yICYmIHJlc3VsdC5jb250ZW50cyAmJiAhcmVzdWx0LmVycm9ycz8ubGVuZ3RoKSB7XG4gICAgY29uc3QgcG9zdGNzc1Jlc3VsdCA9IGF3YWl0IGNvbXBpbGVTdHJpbmcoXG4gICAgICB0eXBlb2YgcmVzdWx0LmNvbnRlbnRzID09PSAnc3RyaW5nJ1xuICAgICAgICA/IHJlc3VsdC5jb250ZW50c1xuICAgICAgICA6IEJ1ZmZlci5mcm9tKHJlc3VsdC5jb250ZW50cykudG9TdHJpbmcoJ3V0Zi04JyksXG4gICAgICBmaWxlbmFtZSxcbiAgICAgIHBvc3Rjc3NQcm9jZXNzb3IsXG4gICAgICBvcHRpb25zLFxuICAgICk7XG5cbiAgICAvLyBNZXJnZSByZXN1bHRzXG4gICAgaWYgKHBvc3Rjc3NSZXN1bHQuZXJyb3JzPy5sZW5ndGgpIHtcbiAgICAgIGRlbGV0ZSByZXN1bHQuY29udGVudHM7XG4gICAgfVxuICAgIGlmIChyZXN1bHQud2FybmluZ3MgJiYgcG9zdGNzc1Jlc3VsdC53YXJuaW5ncykge1xuICAgICAgcG9zdGNzc1Jlc3VsdC53YXJuaW5ncy51bnNoaWZ0KC4uLnJlc3VsdC53YXJuaW5ncyk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQud2F0Y2hGaWxlcyAmJiBwb3N0Y3NzUmVzdWx0LndhdGNoRmlsZXMpIHtcbiAgICAgIHBvc3Rjc3NSZXN1bHQud2F0Y2hGaWxlcy51bnNoaWZ0KC4uLnJlc3VsdC53YXRjaEZpbGVzKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC53YXRjaERpcnMgJiYgcG9zdGNzc1Jlc3VsdC53YXRjaERpcnMpIHtcbiAgICAgIHBvc3Rjc3NSZXN1bHQud2F0Y2hEaXJzLnVuc2hpZnQoLi4ucmVzdWx0LndhdGNoRGlycyk7XG4gICAgfVxuICAgIHJlc3VsdCA9IHtcbiAgICAgIC4uLnJlc3VsdCxcbiAgICAgIC4uLnBvc3Rjc3NSZXN1bHQsXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQ29tcGlsZXMgdGhlIHByb3ZpZGVkIENTUyBzdHlsZXNoZWV0IGRhdGEgdXNpbmcgYSBwcm92aWRlZCBwb3N0Y3NzIHByb2Nlc3NvciBhbmQgcHJvdmlkZXMgYW5cbiAqIGVzYnVpbGQgbG9hZCByZXN1bHQgdGhhdCBjYW4gYmUgdXNlZCBkaXJlY3RseSBieSBhbiBlc2J1aWxkIFBsdWdpbi5cbiAqIEBwYXJhbSBkYXRhIFRoZSBzdHlsZXNoZWV0IGNvbnRlbnQgdG8gcHJvY2Vzcy5cbiAqIEBwYXJhbSBmaWxlbmFtZSBUaGUgbmFtZSBvZiB0aGUgZmlsZSB0aGF0IGNvbnRhaW5zIHRoZSBkYXRhLlxuICogQHBhcmFtIHBvc3Rjc3NQcm9jZXNzb3IgQSBwb3N0Y3NzIHByb2Nlc3NvciBpbnN0YW5jZSB0byB1c2UuXG4gKiBAcGFyYW0gb3B0aW9ucyBUaGUgcGx1Z2luIG9wdGlvbnMgdG8gY29udHJvbCB0aGUgcHJvY2Vzc2luZy5cbiAqIEByZXR1cm5zIEFuIGVzYnVpbGQgT25Mb2FkZXJSZXN1bHQgb2JqZWN0IHdpdGggdGhlIHByb2Nlc3NlZCBjb250ZW50LCB3YXJuaW5ncywgYW5kL29yIGVycm9ycy5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gY29tcGlsZVN0cmluZyhcbiAgZGF0YTogc3RyaW5nLFxuICBmaWxlbmFtZTogc3RyaW5nLFxuICBwb3N0Y3NzUHJvY2Vzc29yOiBpbXBvcnQoJ3Bvc3Rjc3MnKS5Qcm9jZXNzb3IsXG4gIG9wdGlvbnM6IFN0eWxlc2hlZXRQbHVnaW5PcHRpb25zLFxuKTogUHJvbWlzZTxPbkxvYWRSZXN1bHQ+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwb3N0Y3NzUmVzdWx0ID0gYXdhaXQgcG9zdGNzc1Byb2Nlc3Nvci5wcm9jZXNzKGRhdGEsIHtcbiAgICAgIGZyb206IGZpbGVuYW1lLFxuICAgICAgdG86IGZpbGVuYW1lLFxuICAgICAgbWFwOiBvcHRpb25zLnNvdXJjZW1hcCAmJiB7XG4gICAgICAgIGlubGluZTogdHJ1ZSxcbiAgICAgICAgc291cmNlc0NvbnRlbnQ6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgbG9hZFJlc3VsdDogT25Mb2FkUmVzdWx0ID0ge1xuICAgICAgY29udGVudHM6IHBvc3Rjc3NSZXN1bHQuY3NzLFxuICAgICAgbG9hZGVyOiAnY3NzJyxcbiAgICB9O1xuXG4gICAgY29uc3QgcmF3V2FybmluZ3MgPSBwb3N0Y3NzUmVzdWx0Lndhcm5pbmdzKCk7XG4gICAgaWYgKHJhd1dhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGxpbmVNYXBwaW5ncyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmdbXSB8IG51bGw+KCk7XG4gICAgICBsb2FkUmVzdWx0Lndhcm5pbmdzID0gcmF3V2FybmluZ3MubWFwKCh3YXJuaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB3YXJuaW5nLm5vZGUuc291cmNlPy5pbnB1dC5maWxlO1xuICAgICAgICBpZiAoZmlsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuIHsgdGV4dDogd2FybmluZy50ZXh0IH07XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbGluZXMgPSBsaW5lTWFwcGluZ3MuZ2V0KGZpbGUpO1xuICAgICAgICBpZiAobGluZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGxpbmVzID0gd2FybmluZy5ub2RlLnNvdXJjZT8uaW5wdXQuY3NzLnNwbGl0KC9cXHI/XFxuLyk7XG4gICAgICAgICAgbGluZU1hcHBpbmdzLnNldChmaWxlLCBsaW5lcyA/PyBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdGV4dDogd2FybmluZy50ZXh0LFxuICAgICAgICAgIGxvY2F0aW9uOiB7XG4gICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICAgbGluZTogd2FybmluZy5saW5lLFxuICAgICAgICAgICAgY29sdW1uOiB3YXJuaW5nLmNvbHVtbiAtIDEsXG4gICAgICAgICAgICBsaW5lVGV4dDogbGluZXM/Llt3YXJuaW5nLmxpbmUgLSAxXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCByZXN1bHRNZXNzYWdlIG9mIHBvc3Rjc3NSZXN1bHQubWVzc2FnZXMpIHtcbiAgICAgIGlmIChyZXN1bHRNZXNzYWdlLnR5cGUgPT09ICdkZXBlbmRlbmN5JyAmJiB0eXBlb2YgcmVzdWx0TWVzc2FnZVsnZmlsZSddID09PSAnc3RyaW5nJykge1xuICAgICAgICBsb2FkUmVzdWx0LndhdGNoRmlsZXMgPz89IFtdO1xuICAgICAgICBsb2FkUmVzdWx0LndhdGNoRmlsZXMucHVzaChyZXN1bHRNZXNzYWdlWydmaWxlJ10pO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgcmVzdWx0TWVzc2FnZS50eXBlID09PSAnZGlyLWRlcGVuZGVuY3knICYmXG4gICAgICAgIHR5cGVvZiByZXN1bHRNZXNzYWdlWydkaXInXSA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgdHlwZW9mIHJlc3VsdE1lc3NhZ2VbJ2dsb2InXSA9PT0gJ3N0cmluZydcbiAgICAgICkge1xuICAgICAgICBsb2FkUmVzdWx0LndhdGNoRmlsZXMgPz89IFtdO1xuICAgICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBnbG9iKHJlc3VsdE1lc3NhZ2VbJ2dsb2InXSwge1xuICAgICAgICAgIGFic29sdXRlOiB0cnVlLFxuICAgICAgICAgIGN3ZDogcmVzdWx0TWVzc2FnZVsnZGlyJ10sXG4gICAgICAgIH0pO1xuICAgICAgICBsb2FkUmVzdWx0LndhdGNoRmlsZXMucHVzaCguLi5kZXBlbmRlbmNpZXMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBsb2FkUmVzdWx0O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHBvc3Rjc3MgPz89IChhd2FpdCBpbXBvcnQoJ3Bvc3Rjc3MnKSkuZGVmYXVsdDtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBwb3N0Y3NzLkNzc1N5bnRheEVycm9yKSB7XG4gICAgICBjb25zdCBsaW5lcyA9IGVycm9yLnNvdXJjZT8uc3BsaXQoL1xccj9cXG4vKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZXJyb3JzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogZXJyb3IucmVhc29uLFxuICAgICAgICAgICAgbG9jYXRpb246IHtcbiAgICAgICAgICAgICAgZmlsZTogZXJyb3IuZmlsZSxcbiAgICAgICAgICAgICAgbGluZTogZXJyb3IubGluZSxcbiAgICAgICAgICAgICAgY29sdW1uOiBlcnJvci5jb2x1bW4gJiYgZXJyb3IuY29sdW1uIC0gMSxcbiAgICAgICAgICAgICAgbGluZVRleHQ6IGVycm9yLmxpbmUgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGxpbmVzPy5bZXJyb3IubGluZSAtIDFdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuIl19