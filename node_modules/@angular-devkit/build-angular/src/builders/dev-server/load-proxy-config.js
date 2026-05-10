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
exports.loadProxyConfiguration = void 0;
const fast_glob_1 = require("fast-glob");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
const picomatch_1 = require("picomatch");
const error_1 = require("../../utils/error");
const load_esm_1 = require("../../utils/load-esm");
async function loadProxyConfiguration(root, proxyConfig, normalize = false) {
    if (!proxyConfig) {
        return undefined;
    }
    const proxyPath = (0, node_path_1.resolve)(root, proxyConfig);
    if (!(0, node_fs_1.existsSync)(proxyPath)) {
        throw new Error(`Proxy configuration file ${proxyPath} does not exist.`);
    }
    let proxyConfiguration;
    switch ((0, node_path_1.extname)(proxyPath)) {
        case '.json': {
            const content = await (0, promises_1.readFile)(proxyPath, 'utf-8');
            const { parse, printParseErrorCode } = await Promise.resolve().then(() => __importStar(require('jsonc-parser')));
            const parseErrors = [];
            proxyConfiguration = parse(content, parseErrors, { allowTrailingComma: true });
            if (parseErrors.length > 0) {
                let errorMessage = `Proxy configuration file ${proxyPath} contains parse errors:`;
                for (const parseError of parseErrors) {
                    const { line, column } = getJsonErrorLineColumn(parseError.offset, content);
                    errorMessage += `\n[${line}, ${column}] ${printParseErrorCode(parseError.error)}`;
                }
                throw new Error(errorMessage);
            }
            break;
        }
        case '.mjs':
            // Load the ESM configuration file using the TypeScript dynamic import workaround.
            // Once TypeScript provides support for keeping the dynamic import this workaround can be
            // changed to a direct dynamic import.
            proxyConfiguration = (await (0, load_esm_1.loadEsmModule)((0, node_url_1.pathToFileURL)(proxyPath)))
                .default;
            break;
        case '.cjs':
            proxyConfiguration = require(proxyPath);
            break;
        default:
            // The file could be either CommonJS or ESM.
            // CommonJS is tried first then ESM if loading fails.
            try {
                proxyConfiguration = require(proxyPath);
                break;
            }
            catch (e) {
                (0, error_1.assertIsError)(e);
                if (e.code === 'ERR_REQUIRE_ESM') {
                    // Load the ESM configuration file using the TypeScript dynamic import workaround.
                    // Once TypeScript provides support for keeping the dynamic import this workaround can be
                    // changed to a direct dynamic import.
                    proxyConfiguration = (await (0, load_esm_1.loadEsmModule)((0, node_url_1.pathToFileURL)(proxyPath)))
                        .default;
                    break;
                }
                throw e;
            }
    }
    if (normalize) {
        proxyConfiguration = normalizeProxyConfiguration(proxyConfiguration);
    }
    return proxyConfiguration;
}
exports.loadProxyConfiguration = loadProxyConfiguration;
/**
 * Converts glob patterns to regular expressions to support Vite's proxy option.
 * Also converts the Webpack supported array form to an object form supported by both.
 *
 * @param proxy A proxy configuration object.
 */
function normalizeProxyConfiguration(proxy) {
    let normalizedProxy;
    if (Array.isArray(proxy)) {
        // Construct an object-form proxy configuration from the array
        normalizedProxy = {};
        for (const proxyEntry of proxy) {
            if (!('context' in proxyEntry)) {
                continue;
            }
            if (!Array.isArray(proxyEntry.context)) {
                continue;
            }
            // Array-form entries contain a context string array with the path(s)
            // to use for the configuration entry.
            const context = proxyEntry.context;
            delete proxyEntry.context;
            for (const contextEntry of context) {
                if (typeof contextEntry !== 'string') {
                    continue;
                }
                normalizedProxy[contextEntry] = proxyEntry;
            }
        }
    }
    else {
        normalizedProxy = proxy;
    }
    // TODO: Consider upstreaming glob support
    for (const key of Object.keys(normalizedProxy)) {
        if ((0, fast_glob_1.isDynamicPattern)(key)) {
            const { output } = (0, picomatch_1.parse)(key);
            normalizedProxy[`^${output}$`] = normalizedProxy[key];
            delete normalizedProxy[key];
        }
    }
    // Replace `pathRewrite` field with a `rewrite` function
    for (const proxyEntry of Object.values(normalizedProxy)) {
        if ('pathRewrite' in proxyEntry &&
            proxyEntry.pathRewrite &&
            typeof proxyEntry.pathRewrite === 'object') {
            // Preprocess path rewrite entries
            const pathRewriteEntries = [];
            for (const [pattern, value] of Object.entries(proxyEntry.pathRewrite)) {
                pathRewriteEntries.push([new RegExp(pattern), value]);
            }
            proxyEntry.rewrite = pathRewriter.bind(undefined, pathRewriteEntries);
            delete proxyEntry.pathRewrite;
        }
    }
    return normalizedProxy;
}
function pathRewriter(pathRewriteEntries, path) {
    for (const [pattern, value] of pathRewriteEntries) {
        const updated = path.replace(pattern, value);
        if (path !== updated) {
            return updated;
        }
    }
    return path;
}
/**
 * Calculates the line and column for an error offset in the content of a JSON file.
 * @param location The offset error location from the beginning of the content.
 * @param content The full content of the file containing the error.
 * @returns An object containing the line and column
 */
function getJsonErrorLineColumn(offset, content) {
    if (offset === 0) {
        return { line: 1, column: 1 };
    }
    let line = 0;
    let position = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        ++line;
        const nextNewline = content.indexOf('\n', position);
        if (nextNewline === -1 || nextNewline > offset) {
            break;
        }
        position = nextNewline + 1;
    }
    return { line, column: offset - position + 1 };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZC1wcm94eS1jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9kZXYtc2VydmVyL2xvYWQtcHJveHktY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgseUNBQTZDO0FBQzdDLHFDQUFxQztBQUNyQywrQ0FBNEM7QUFDNUMseUNBQTZDO0FBQzdDLHVDQUF5QztBQUN6Qyx5Q0FBK0M7QUFDL0MsNkNBQWtEO0FBQ2xELG1EQUFxRDtBQUU5QyxLQUFLLFVBQVUsc0JBQXNCLENBQzFDLElBQVksRUFDWixXQUErQixFQUMvQixTQUFTLEdBQUcsS0FBSztJQUVqQixJQUFJLENBQUMsV0FBVyxFQUFFO1FBQ2hCLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBQSxtQkFBTyxFQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztJQUU3QyxJQUFJLENBQUMsSUFBQSxvQkFBVSxFQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLFNBQVMsa0JBQWtCLENBQUMsQ0FBQztLQUMxRTtJQUVELElBQUksa0JBQWtCLENBQUM7SUFDdkIsUUFBUSxJQUFBLG1CQUFPLEVBQUMsU0FBUyxDQUFDLEVBQUU7UUFDMUIsS0FBSyxPQUFPLENBQUMsQ0FBQztZQUNaLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBQSxtQkFBUSxFQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVuRCxNQUFNLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLEdBQUcsd0RBQWEsY0FBYyxHQUFDLENBQUM7WUFDcEUsTUFBTSxXQUFXLEdBQXdDLEVBQUUsQ0FBQztZQUM1RCxrQkFB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QUFrQixFQUFFO1FBQ2pELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdDLElBQUksSUFBSSxLQUFLLE9BQU8sRUFBRTtZQUNwQixPQUFPLE9BQU8sQ0FBQztTQUNoQjtLQUNGO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLHNCQUFzQixDQUFDLE1BQWMsRUFBRSxPQUFlO0lBQzdELElBQUksTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNoQixPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUM7S0FDL0I7SUFFRCxJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7SUFDYixJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFDakIsaURBQWlEO0lBQ2pELE9BQU8sSUFBSSxFQUFFO1FBQ1gsRUFBRSxJQUFJLENBQUM7UUFFUCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwRCxJQUFJLFdBQVcsS0FBSyxDQUFDLENBQUMsSUFBSSxXQUFXLEdBQUcsTUFBTSxFQUFFO1lBQzlDLE1BQU07U0FDUDtRQUVELFFBQVEsR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDO0tBQzVCO0lBRUQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUNqRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGlzRHluYW1pY1BhdHRlcm4gfSBmcm9tICdmYXN0LWdsb2InO1xuaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB7IGV4dG5hbWUsIHJlc29sdmUgfSBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgcGF0aFRvRmlsZVVSTCB9IGZyb20gJ25vZGU6dXJsJztcbmltcG9ydCB7IHBhcnNlIGFzIHBhcnNlR2xvYiB9IGZyb20gJ3BpY29tYXRjaCc7XG5pbXBvcnQgeyBhc3NlcnRJc0Vycm9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvZXJyb3InO1xuaW1wb3J0IHsgbG9hZEVzbU1vZHVsZSB9IGZyb20gJy4uLy4uL3V0aWxzL2xvYWQtZXNtJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRQcm94eUNvbmZpZ3VyYXRpb24oXG4gIHJvb3Q6IHN0cmluZyxcbiAgcHJveHlDb25maWc6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgbm9ybWFsaXplID0gZmFsc2UsXG4pIHtcbiAgaWYgKCFwcm94eUNvbmZpZykge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBwcm94eVBhdGggPSByZXNvbHZlKHJvb3QsIHByb3h5Q29uZmlnKTtcblxuICBpZiAoIWV4aXN0c1N5bmMocHJveHlQYXRoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgUHJveHkgY29uZmlndXJhdGlvbiBmaWxlICR7cHJveHlQYXRofSBkb2VzIG5vdCBleGlzdC5gKTtcbiAgfVxuXG4gIGxldCBwcm94eUNvbmZpZ3VyYXRpb247XG4gIHN3aXRjaCAoZXh0bmFtZShwcm94eVBhdGgpKSB7XG4gICAgY2FzZSAnLmpzb24nOiB7XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgcmVhZEZpbGUocHJveHlQYXRoLCAndXRmLTgnKTtcblxuICAgICAgY29uc3QgeyBwYXJzZSwgcHJpbnRQYXJzZUVycm9yQ29kZSB9ID0gYXdhaXQgaW1wb3J0KCdqc29uYy1wYXJzZXInKTtcbiAgICAgIGNvbnN0IHBhcnNlRXJyb3JzOiBpbXBvcnQoJ2pzb25jLXBhcnNlcicpLlBhcnNlRXJyb3JbXSA9IFtdO1xuICAgICAgcHJveHlDb25maWd1cmF0aW9uID0gcGFyc2UoY29udGVudCwgcGFyc2VFcnJvcnMsIHsgYWxsb3dUcmFpbGluZ0NvbW1hOiB0cnVlIH0pO1xuXG4gICAgICBpZiAocGFyc2VFcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gYFByb3h5IGNvbmZpZ3VyYXRpb24gZmlsZSAke3Byb3h5UGF0aH0gY29udGFpbnMgcGFyc2UgZXJyb3JzOmA7XG4gICAgICAgIGZvciAoY29uc3QgcGFyc2VFcnJvciBvZiBwYXJzZUVycm9ycykge1xuICAgICAgICAgIGNvbnN0IHsgbGluZSwgY29sdW1uIH0gPSBnZXRKc29uRXJyb3JMaW5lQ29sdW1uKHBhcnNlRXJyb3Iub2Zmc2V0LCBjb250ZW50KTtcbiAgICAgICAgICBlcnJvck1lc3NhZ2UgKz0gYFxcblske2xpbmV9LCAke2NvbHVtbn1dICR7cHJpbnRQYXJzZUVycm9yQ29kZShwYXJzZUVycm9yLmVycm9yKX1gO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSAnLm1qcyc6XG4gICAgICAvLyBMb2FkIHRoZSBFU00gY29uZmlndXJhdGlvbiBmaWxlIHVzaW5nIHRoZSBUeXBlU2NyaXB0IGR5bmFtaWMgaW1wb3J0IHdvcmthcm91bmQuXG4gICAgICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZVxuICAgICAgLy8gY2hhbmdlZCB0byBhIGRpcmVjdCBkeW5hbWljIGltcG9ydC5cbiAgICAgIHByb3h5Q29uZmlndXJhdGlvbiA9IChhd2FpdCBsb2FkRXNtTW9kdWxlPHsgZGVmYXVsdDogdW5rbm93biB9PihwYXRoVG9GaWxlVVJMKHByb3h5UGF0aCkpKVxuICAgICAgICAuZGVmYXVsdDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJy5janMnOlxuICAgICAgcHJveHlDb25maWd1cmF0aW9uID0gcmVxdWlyZShwcm94eVBhdGgpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIFRoZSBmaWxlIGNvdWxkIGJlIGVpdGhlciBDb21tb25KUyBvciBFU00uXG4gICAgICAvLyBDb21tb25KUyBpcyB0cmllZCBmaXJzdCB0aGVuIEVTTSBpZiBsb2FkaW5nIGZhaWxzLlxuICAgICAgdHJ5IHtcbiAgICAgICAgcHJveHlDb25maWd1cmF0aW9uID0gcmVxdWlyZShwcm94eVBhdGgpO1xuICAgICAgICBicmVhaztcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgYXNzZXJ0SXNFcnJvcihlKTtcbiAgICAgICAgaWYgKGUuY29kZSA9PT0gJ0VSUl9SRVFVSVJFX0VTTScpIHtcbiAgICAgICAgICAvLyBMb2FkIHRoZSBFU00gY29uZmlndXJhdGlvbiBmaWxlIHVzaW5nIHRoZSBUeXBlU2NyaXB0IGR5bmFtaWMgaW1wb3J0IHdvcmthcm91bmQuXG4gICAgICAgICAgLy8gT25jZSBUeXBlU2NyaXB0IHByb3ZpZGVzIHN1cHBvcnQgZm9yIGtlZXBpbmcgdGhlIGR5bmFtaWMgaW1wb3J0IHRoaXMgd29ya2Fyb3VuZCBjYW4gYmVcbiAgICAgICAgICAvLyBjaGFuZ2VkIHRvIGEgZGlyZWN0IGR5bmFtaWMgaW1wb3J0LlxuICAgICAgICAgIHByb3h5Q29uZmlndXJhdGlvbiA9IChhd2FpdCBsb2FkRXNtTW9kdWxlPHsgZGVmYXVsdDogdW5rbm93biB9PihwYXRoVG9GaWxlVVJMKHByb3h5UGF0aCkpKVxuICAgICAgICAgICAgLmRlZmF1bHQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICB9XG5cbiAgaWYgKG5vcm1hbGl6ZSkge1xuICAgIHByb3h5Q29uZmlndXJhdGlvbiA9IG5vcm1hbGl6ZVByb3h5Q29uZmlndXJhdGlvbihwcm94eUNvbmZpZ3VyYXRpb24pO1xuICB9XG5cbiAgcmV0dXJuIHByb3h5Q29uZmlndXJhdGlvbjtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBnbG9iIHBhdHRlcm5zIHRvIHJlZ3VsYXIgZXhwcmVzc2lvbnMgdG8gc3VwcG9ydCBWaXRlJ3MgcHJveHkgb3B0aW9uLlxuICogQWxzbyBjb252ZXJ0cyB0aGUgV2VicGFjayBzdXBwb3J0ZWQgYXJyYXkgZm9ybSB0byBhbiBvYmplY3QgZm9ybSBzdXBwb3J0ZWQgYnkgYm90aC5cbiAqXG4gKiBAcGFyYW0gcHJveHkgQSBwcm94eSBjb25maWd1cmF0aW9uIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplUHJveHlDb25maWd1cmF0aW9uKFxuICBwcm94eTogUmVjb3JkPHN0cmluZywgb2JqZWN0PiB8IG9iamVjdFtdLFxuKTogUmVjb3JkPHN0cmluZywgb2JqZWN0PiB7XG4gIGxldCBub3JtYWxpemVkUHJveHk6IFJlY29yZDxzdHJpbmcsIG9iamVjdD4gfCB1bmRlZmluZWQ7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkocHJveHkpKSB7XG4gICAgLy8gQ29uc3RydWN0IGFuIG9iamVjdC1mb3JtIHByb3h5IGNvbmZpZ3VyYXRpb24gZnJvbSB0aGUgYXJyYXlcbiAgICBub3JtYWxpemVkUHJveHkgPSB7fTtcbiAgICBmb3IgKGNvbnN0IHByb3h5RW50cnkgb2YgcHJveHkpIHtcbiAgICAgIGlmICghKCdjb250ZXh0JyBpbiBwcm94eUVudHJ5KSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShwcm94eUVudHJ5LmNvbnRleHQpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBBcnJheS1mb3JtIGVudHJpZXMgY29udGFpbiBhIGNvbnRleHQgc3RyaW5nIGFycmF5IHdpdGggdGhlIHBhdGgocylcbiAgICAgIC8vIHRvIHVzZSBmb3IgdGhlIGNvbmZpZ3VyYXRpb24gZW50cnkuXG4gICAgICBjb25zdCBjb250ZXh0ID0gcHJveHlFbnRyeS5jb250ZXh0O1xuICAgICAgZGVsZXRlIHByb3h5RW50cnkuY29udGV4dDtcbiAgICAgIGZvciAoY29uc3QgY29udGV4dEVudHJ5IG9mIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb250ZXh0RW50cnkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBub3JtYWxpemVkUHJveHlbY29udGV4dEVudHJ5XSA9IHByb3h5RW50cnk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIG5vcm1hbGl6ZWRQcm94eSA9IHByb3h5O1xuICB9XG5cbiAgLy8gVE9ETzogQ29uc2lkZXIgdXBzdHJlYW1pbmcgZ2xvYiBzdXBwb3J0XG4gIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG5vcm1hbGl6ZWRQcm94eSkpIHtcbiAgICBpZiAoaXNEeW5hbWljUGF0dGVybihrZXkpKSB7XG4gICAgICBjb25zdCB7IG91dHB1dCB9ID0gcGFyc2VHbG9iKGtleSk7XG4gICAgICBub3JtYWxpemVkUHJveHlbYF4ke291dHB1dH0kYF0gPSBub3JtYWxpemVkUHJveHlba2V5XTtcbiAgICAgIGRlbGV0ZSBub3JtYWxpemVkUHJveHlba2V5XTtcbiAgICB9XG4gIH1cblxuICAvLyBSZXBsYWNlIGBwYXRoUmV3cml0ZWAgZmllbGQgd2l0aCBhIGByZXdyaXRlYCBmdW5jdGlvblxuICBmb3IgKGNvbnN0IHByb3h5RW50cnkgb2YgT2JqZWN0LnZhbHVlcyhub3JtYWxpemVkUHJveHkpKSB7XG4gICAgaWYgKFxuICAgICAgJ3BhdGhSZXdyaXRlJyBpbiBwcm94eUVudHJ5ICYmXG4gICAgICBwcm94eUVudHJ5LnBhdGhSZXdyaXRlICYmXG4gICAgICB0eXBlb2YgcHJveHlFbnRyeS5wYXRoUmV3cml0ZSA9PT0gJ29iamVjdCdcbiAgICApIHtcbiAgICAgIC8vIFByZXByb2Nlc3MgcGF0aCByZXdyaXRlIGVudHJpZXNcbiAgICAgIGNvbnN0IHBhdGhSZXdyaXRlRW50cmllczogW1JlZ0V4cCwgc3RyaW5nXVtdID0gW107XG4gICAgICBmb3IgKGNvbnN0IFtwYXR0ZXJuLCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoXG4gICAgICAgIHByb3h5RW50cnkucGF0aFJld3JpdGUgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbiAgICAgICkpIHtcbiAgICAgICAgcGF0aFJld3JpdGVFbnRyaWVzLnB1c2goW25ldyBSZWdFeHAocGF0dGVybiksIHZhbHVlXSk7XG4gICAgICB9XG5cbiAgICAgIChwcm94eUVudHJ5IGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KS5yZXdyaXRlID0gcGF0aFJld3JpdGVyLmJpbmQoXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgcGF0aFJld3JpdGVFbnRyaWVzLFxuICAgICAgKTtcblxuICAgICAgZGVsZXRlIHByb3h5RW50cnkucGF0aFJld3JpdGU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5vcm1hbGl6ZWRQcm94eTtcbn1cblxuZnVuY3Rpb24gcGF0aFJld3JpdGVyKHBhdGhSZXdyaXRlRW50cmllczogW1JlZ0V4cCwgc3RyaW5nXVtdLCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBmb3IgKGNvbnN0IFtwYXR0ZXJuLCB2YWx1ZV0gb2YgcGF0aFJld3JpdGVFbnRyaWVzKSB7XG4gICAgY29uc3QgdXBkYXRlZCA9IHBhdGgucmVwbGFjZShwYXR0ZXJuLCB2YWx1ZSk7XG4gICAgaWYgKHBhdGggIT09IHVwZGF0ZWQpIHtcbiAgICAgIHJldHVybiB1cGRhdGVkO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXRoO1xufVxuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGxpbmUgYW5kIGNvbHVtbiBmb3IgYW4gZXJyb3Igb2Zmc2V0IGluIHRoZSBjb250ZW50IG9mIGEgSlNPTiBmaWxlLlxuICogQHBhcmFtIGxvY2F0aW9uIFRoZSBvZmZzZXQgZXJyb3IgbG9jYXRpb24gZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBjb250ZW50LlxuICogQHBhcmFtIGNvbnRlbnQgVGhlIGZ1bGwgY29udGVudCBvZiB0aGUgZmlsZSBjb250YWluaW5nIHRoZSBlcnJvci5cbiAqIEByZXR1cm5zIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBsaW5lIGFuZCBjb2x1bW5cbiAqL1xuZnVuY3Rpb24gZ2V0SnNvbkVycm9yTGluZUNvbHVtbihvZmZzZXQ6IG51bWJlciwgY29udGVudDogc3RyaW5nKSB7XG4gIGlmIChvZmZzZXQgPT09IDApIHtcbiAgICByZXR1cm4geyBsaW5lOiAxLCBjb2x1bW46IDEgfTtcbiAgfVxuXG4gIGxldCBsaW5lID0gMDtcbiAgbGV0IHBvc2l0aW9uID0gMDtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnN0YW50LWNvbmRpdGlvblxuICB3aGlsZSAodHJ1ZSkge1xuICAgICsrbGluZTtcblxuICAgIGNvbnN0IG5leHROZXdsaW5lID0gY29udGVudC5pbmRleE9mKCdcXG4nLCBwb3NpdGlvbik7XG4gICAgaWYgKG5leHROZXdsaW5lID09PSAtMSB8fCBuZXh0TmV3bGluZSA+IG9mZnNldCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcG9zaXRpb24gPSBuZXh0TmV3bGluZSArIDE7XG4gIH1cblxuICByZXR1cm4geyBsaW5lLCBjb2x1bW46IG9mZnNldCAtIHBvc2l0aW9uICsgMSB9O1xufVxuIl19