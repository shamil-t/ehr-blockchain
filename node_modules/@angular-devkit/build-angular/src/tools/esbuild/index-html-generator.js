"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIndexHtml = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const node_path_1 = __importDefault(require("node:path"));
const index_html_generator_1 = require("../../utils/index-file/index-html-generator");
const inline_critical_css_1 = require("../../utils/index-file/inline-critical-css");
async function generateIndexHtml(initialFiles, executionResult, buildOptions) {
    // Analyze metafile for initial link-based hints.
    // Skip if the internal externalPackages option is enabled since this option requires
    // dev server cooperation to properly resolve and fetch imports.
    const hints = [];
    const { indexHtmlOptions, externalPackages, optimizationOptions, crossOrigin, subresourceIntegrity, baseHref, } = buildOptions;
    (0, node_assert_1.default)(indexHtmlOptions, 'indexHtmlOptions cannot be undefined.');
    if (!externalPackages) {
        for (const [key, value] of initialFiles) {
            if (value.entrypoint) {
                // Entry points are already referenced in the HTML
                continue;
            }
            if (value.type === 'script') {
                hints.push({ url: key, mode: 'modulepreload' });
            }
            else if (value.type === 'style') {
                // Provide an "as" value of "style" to ensure external URLs which may not have a
                // file extension are treated as stylesheets.
                hints.push({ url: key, mode: 'preload', as: 'style' });
            }
        }
    }
    /** Virtual output path to support reading in-memory files. */
    const virtualOutputPath = '/';
    const readAsset = async function (filePath) {
        // Remove leading directory separator
        const relativefilePath = node_path_1.default.relative(virtualOutputPath, filePath);
        const file = executionResult.outputFiles.find((file) => file.path === relativefilePath);
        if (file) {
            return file.text;
        }
        throw new Error(`Output file does not exist: ${relativefilePath}`);
    };
    // Create an index HTML generator that reads from the in-memory output files
    const indexHtmlGenerator = new index_html_generator_1.IndexHtmlGenerator({
        indexPath: indexHtmlOptions.input,
        entrypoints: indexHtmlOptions.insertionOrder,
        sri: subresourceIntegrity,
        optimization: {
            ...optimizationOptions,
            styles: {
                ...optimizationOptions.styles,
                inlineCritical: false, // Disable critical css inline as for SSR and SSG this will be done during rendering.
            },
        },
        crossOrigin: crossOrigin,
    });
    indexHtmlGenerator.readAsset = readAsset;
    const transformResult = await indexHtmlGenerator.process({
        baseHref,
        lang: undefined,
        outputPath: virtualOutputPath,
        files: [...initialFiles].map(([file, record]) => ({
            name: record.name ?? '',
            file,
            extension: node_path_1.default.extname(file),
        })),
        hints,
    });
    const contentWithoutCriticalCssInlined = transformResult.content;
    if (!optimizationOptions.styles.inlineCritical) {
        return {
            ...transformResult,
            contentWithoutCriticalCssInlined,
        };
    }
    const inlineCriticalCssProcessor = new inline_critical_css_1.InlineCriticalCssProcessor({
        minify: false,
        readAsset,
    });
    const { content, errors, warnings } = await inlineCriticalCssProcessor.process(contentWithoutCriticalCssInlined, {
        outputPath: virtualOutputPath,
    });
    return {
        errors: [...transformResult.errors, ...errors],
        warnings: [...transformResult.warnings, ...warnings],
        content,
        contentWithoutCriticalCssInlined,
    };
}
exports.generateIndexHtml = generateIndexHtml;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgtaHRtbC1nZW5lcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9lc2J1aWxkL2luZGV4LWh0bWwtZ2VuZXJhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUVILDhEQUFpQztBQUNqQywwREFBNkI7QUFFN0Isc0ZBQWlGO0FBQ2pGLG9GQUF3RjtBQUlqRixLQUFLLFVBQVUsaUJBQWlCLENBQ3JDLFlBQTRDLEVBQzVDLGVBQWdDLEVBQ2hDLFlBQStDO0lBTy9DLGlEQUFpRDtJQUNqRCxxRkFBcUY7SUFDckYsZ0VBQWdFO0lBQ2hFLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUNqQixNQUFNLEVBQ0osZ0JBQWdCLEVBQ2hCLGdCQUFnQixFQUNoQixtQkFBbUIsRUFDbkIsV0FBVyxFQUNYLG9CQUFvQixFQUNwQixRQUFRLEdBQ1QsR0FBRyxZQUFZLENBQUM7SUFFakIsSUFBQSxxQkFBTSxFQUFDLGdCQUFnQixFQUFFLHVDQUF1QyxDQUFDLENBQUM7SUFFbEUsSUFBSSxDQUFDLGdCQUFnQixFQUFFO1FBQ3JCLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxZQUFZLEVBQUU7WUFDdkMsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO2dCQUNwQixrREFBa0Q7Z0JBQ2xELFNBQVM7YUFDVjtZQUNELElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7Z0JBQzNCLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxlQUF3QixFQUFFLENBQUMsQ0FBQzthQUMxRDtpQkFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFO2dCQUNqQyxnRkFBZ0Y7Z0JBQ2hGLDZD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aWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ25vZGU6YXNzZXJ0JztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBOb3JtYWxpemVkQXBwbGljYXRpb25CdWlsZE9wdGlvbnMgfSBmcm9tICcuLi8uLi9idWlsZGVycy9hcHBsaWNhdGlvbi9vcHRpb25zJztcbmltcG9ydCB7IEluZGV4SHRtbEdlbmVyYXRvciB9IGZyb20gJy4uLy4uL3V0aWxzL2luZGV4LWZpbGUvaW5kZXgtaHRtbC1nZW5lcmF0b3InO1xuaW1wb3J0IHsgSW5saW5lQ3JpdGljYWxDc3NQcm9jZXNzb3IgfSBmcm9tICcuLi8uLi91dGlscy9pbmRleC1maWxlL2lubGluZS1jcml0aWNhbC1jc3MnO1xuaW1wb3J0IHsgSW5pdGlhbEZpbGVSZWNvcmQgfSBmcm9tICcuL2J1bmRsZXItY29udGV4dCc7XG5pbXBvcnQgdHlwZSB7IEV4ZWN1dGlvblJlc3VsdCB9IGZyb20gJy4vYnVuZGxlci1leGVjdXRpb24tcmVzdWx0JztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlSW5kZXhIdG1sKFxuICBpbml0aWFsRmlsZXM6IE1hcDxzdHJpbmcsIEluaXRpYWxGaWxlUmVjb3JkPixcbiAgZXhlY3V0aW9uUmVzdWx0OiBFeGVjdXRpb25SZXN1bHQsXG4gIGJ1aWxkT3B0aW9uczogTm9ybWFsaXplZEFwcGxpY2F0aW9uQnVpbGRPcHRpb25zLFxuKTogUHJvbWlzZTx7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgY29udGVudFdpdGhvdXRDcml0aWNhbENzc0lubGluZWQ6IHN0cmluZztcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xuICBlcnJvcnM6IHN0cmluZ1tdO1xufT4ge1xuICAvLyBBbmFseXplIG1ldGFmaWxlIGZvciBpbml0aWFsIGxpbmstYmFzZWQgaGludHMuXG4gIC8vIFNraXAgaWYgdGhlIGludGVybmFsIGV4dGVybmFsUGFja2FnZXMgb3B0aW9uIGlzIGVuYWJsZWQgc2luY2UgdGhpcyBvcHRpb24gcmVxdWlyZXNcbiAgLy8gZGV2IHNlcnZlciBjb29wZXJhdGlvbiB0byBwcm9wZXJseSByZXNvbHZlIGFuZCBmZXRjaCBpbXBvcnRzLlxuICBjb25zdCBoaW50cyA9IFtdO1xuICBjb25zdCB7XG4gICAgaW5kZXhIdG1sT3B0aW9ucyxcbiAgICBleHRlcm5hbFBhY2thZ2VzLFxuICAgIG9wdGltaXphdGlvbk9wdGlvbnMsXG4gICAgY3Jvc3NPcmlnaW4sXG4gICAgc3VicmVzb3VyY2VJbnRlZ3JpdHksXG4gICAgYmFzZUhyZWYsXG4gIH0gPSBidWlsZE9wdGlvbnM7XG5cbiAgYXNzZXJ0KGluZGV4SHRtbE9wdGlvbnMsICdpbmRleEh0bWxPcHRpb25zIGNhbm5vdCBiZSB1bmRlZmluZWQuJyk7XG5cbiAgaWYgKCFleHRlcm5hbFBhY2thZ2VzKSB7XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgaW5pdGlhbEZpbGVzKSB7XG4gICAgICBpZiAodmFsdWUuZW50cnlwb2ludCkge1xuICAgICAgICAvLyBFbnRyeSBwb2ludHMgYXJlIGFscmVhZHkgcmVmZXJlbmNlZCBpbiB0aGUgSFRNTFxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWx1ZS50eXBlID09PSAnc2NyaXB0Jykge1xuICAgICAgICBoaW50cy5wdXNoKHsgdXJsOiBrZXksIG1vZGU6ICdtb2R1bGVwcmVsb2FkJyBhcyBjb25zdCB9KTtcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUudHlwZSA9PT0gJ3N0eWxlJykge1xuICAgICAgICAvLyBQcm92aWRlIGFuIFwiYXNcIiB2YWx1ZSBvZiBcInN0eWxlXCIgdG8gZW5zdXJlIGV4dGVybmFsIFVSTHMgd2hpY2ggbWF5IG5vdCBoYXZlIGFcbiAgICAgICAgLy8gZmlsZSBleHRlbnNpb24gYXJlIHRyZWF0ZWQgYXMgc3R5bGVzaGVldHMuXG4gICAgICAgIGhpbnRzLnB1c2goeyB1cmw6IGtleSwgbW9kZTogJ3ByZWxvYWQnIGFzIGNvbnN0LCBhczogJ3N0eWxlJyB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogVmlydHVhbCBvdXRwdXQgcGF0aCB0byBzdXBwb3J0IHJlYWRpbmcgaW4tbWVtb3J5IGZpbGVzLiAqL1xuICBjb25zdCB2aXJ0dWFsT3V0cHV0UGF0aCA9ICcvJztcbiAgY29uc3QgcmVhZEFzc2V0ID0gYXN5bmMgZnVuY3Rpb24gKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIC8vIFJlbW92ZSBsZWFkaW5nIGRpcmVjdG9yeSBzZXBhcmF0b3JcbiAgICBjb25zdCByZWxhdGl2ZWZpbGVQYXRoID0gcGF0aC5yZWxhdGl2ZSh2aXJ0dWFsT3V0cHV0UGF0aCwgZmlsZVBhdGgpO1xuICAgIGNvbnN0IGZpbGUgPSBleGVjdXRpb25SZXN1bHQub3V0cHV0RmlsZXMuZmluZCgoZmlsZSkgPT4gZmlsZS5wYXRoID09PSByZWxhdGl2ZWZpbGVQYXRoKTtcbiAgICBpZiAoZmlsZSkge1xuICAgICAgcmV0dXJuIGZpbGUudGV4dDtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYE91dHB1dCBmaWxlIGRvZXMgbm90IGV4aXN0OiAke3JlbGF0aXZlZmlsZVBhdGh9YCk7XG4gIH07XG5cbiAgLy8gQ3JlYXRlIGFuIGluZGV4IEhUTUwgZ2VuZXJhdG9yIHRoYXQgcmVhZHMgZnJvbSB0aGUgaW4tbWVtb3J5IG91dHB1dCBmaWxlc1xuICBjb25zdCBpbmRleEh0bWxHZW5lcmF0b3IgPSBuZXcgSW5kZXhIdG1sR2VuZXJhdG9yKHtcbiAgICBpbmRleFBhdGg6IGluZGV4SHRtbE9wdGlvbnMuaW5wdXQsXG4gICAgZW50cnlwb2ludHM6IGluZGV4SHRtbE9wdGlvbnMuaW5zZXJ0aW9uT3JkZXIsXG4gICAgc3JpOiBzdWJyZXNvdXJjZUludGVncml0eSxcbiAgICBvcHRpbWl6YXRpb246IHtcbiAgICAgIC4uLm9wdGltaXphdGlvbk9wdGlvbnMsXG4gICAgICBzdHlsZXM6IHtcbiAgICAgICAgLi4ub3B0aW1pemF0aW9uT3B0aW9ucy5zdHlsZXMsXG4gICAgICAgIGlubGluZUNyaXRpY2FsOiBmYWxzZSwgLy8gRGlzYWJsZSBjcml0aWNhbCBjc3MgaW5saW5lIGFzIGZvciBTU1IgYW5kIFNTRyB0aGlzIHdpbGwgYmUgZG9uZSBkdXJpbmcgcmVuZGVyaW5nLlxuICAgICAgfSxcbiAgICB9LFxuICAgIGNyb3NzT3JpZ2luOiBjcm9zc09yaWdpbixcbiAgfSk7XG5cbiAgaW5kZXhIdG1sR2VuZXJhdG9yLnJlYWRBc3NldCA9IHJlYWRBc3NldDtcblxuICBjb25zdCB0cmFuc2Zvcm1SZXN1bHQgPSBhd2FpdCBpbmRleEh0bWxHZW5lcmF0b3IucHJvY2Vzcyh7XG4gICAgYmFzZUhyZWYsXG4gICAgbGFuZzogdW5kZWZpbmVkLFxuICAgIG91dHB1dFBhdGg6IHZpcnR1YWxPdXRwdXRQYXRoLFxuICAgIGZpbGVzOiBbLi4uaW5pdGlhbEZpbGVzXS5tYXAoKFtmaWxlLCByZWNvcmRdKSA9PiAoe1xuICAgICAgbmFtZTogcmVjb3JkLm5hbWUgPz8gJycsXG4gICAgICBmaWxlLFxuICAgICAgZXh0ZW5zaW9uOiBwYXRoLmV4dG5hbWUoZmlsZSksXG4gICAgfSkpLFxuICAgIGhpbnRzLFxuICB9KTtcblxuICBjb25zdCBjb250ZW50V2l0aG91dENyaXRpY2FsQ3NzSW5saW5lZCA9IHRyYW5zZm9ybVJlc3VsdC5jb250ZW50O1xuICBpZiAoIW9wdGltaXphdGlvbk9wdGlvbnMuc3R5bGVzLmlubGluZUNyaXRpY2FsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnRyYW5zZm9ybVJlc3VsdCxcbiAgICAgIGNvbnRlbnRXaXRob3V0Q3JpdGljYWxDc3NJbmxpbmVkLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBpbmxpbmVDcml0aWNhbENzc1Byb2Nlc3NvciA9IG5ldyBJbmxpbmVDcml0aWNhbENzc1Byb2Nlc3Nvcih7XG4gICAgbWluaWZ5OiBmYWxzZSwgLy8gQ1NTIGhhcyBhbHJlYWR5IGJlZW4gbWluaWZpZWQgZHVyaW5nIHRoZSBidWlsZC5cbiAgICByZWFkQXNzZXQsXG4gIH0pO1xuXG4gIGNvbnN0IHsgY29udGVudCwgZXJyb3JzLCB3YXJuaW5ncyB9ID0gYXdhaXQgaW5saW5lQ3JpdGljYWxDc3NQcm9jZXNzb3IucHJvY2VzcyhcbiAgICBjb250ZW50V2l0aG91dENyaXRpY2FsQ3NzSW5saW5lZCxcbiAgICB7XG4gICAgICBvdXRwdXRQYXRoOiB2aXJ0dWFsT3V0cHV0UGF0aCxcbiAgICB9LFxuICApO1xuXG4gIHJldHVybiB7XG4gICAgZXJyb3JzOiBbLi4udHJhbnNmb3JtUmVzdWx0LmVycm9ycywgLi4uZXJyb3JzXSxcbiAgICB3YXJuaW5nczogWy4uLnRyYW5zZm9ybVJlc3VsdC53YXJuaW5ncywgLi4ud2FybmluZ3NdLFxuICAgIGNvbnRlbnQsXG4gICAgY29udGVudFdpdGhvdXRDcml0aWNhbENzc0lubGluZWQsXG4gIH07XG59XG4iXX0=