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
exports.runEsBuildBuildAction = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const sass_language_1 = require("../../tools/esbuild/stylesheets/sass-language");
const utils_1 = require("../../tools/esbuild/utils");
const error_1 = require("../../utils/error");
async function* runEsBuildBuildAction(action, options) {
    const { writeToFileSystem = true, watch, poll, logger, deleteOutputPath, cacheOptions, outputPath, verbose, projectRoot, workspaceRoot, progress, } = options;
    if (writeToFileSystem) {
        // Clean output path if enabled
        if (deleteOutputPath) {
            if (outputPath === workspaceRoot) {
                logger.error('Output path MUST not be workspace root directory!');
                return;
            }
            await promises_1.default.rm(outputPath, { force: true, recursive: true, maxRetries: 3 });
        }
        // Create output directory if needed
        try {
            await promises_1.default.mkdir(outputPath, { recursive: true });
        }
        catch (e) {
            (0, error_1.assertIsError)(e);
            logger.error('Unable to create output directory: ' + e.message);
            return;
        }
    }
    const withProgress = progress ? utils_1.withSpinner : utils_1.withNoProgress;
    // Initial build
    let result;
    try {
        result = await withProgress('Building...', () => action());
        if (writeToFileSystem) {
            // Write output files
            await (0, utils_1.writeResultFiles)(result.outputFiles, result.assetFiles, outputPath);
            yield result.output;
        }
        else {
            // Requires casting due to unneeded `JsonObject` requirement. Remove once fixed.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            yield result.outputWithFiles;
        }
        // Finish if watch mode is not enabled
        if (!watch) {
            return;
        }
    }
    finally {
        // Ensure Sass workers are shutdown if not watching
        if (!watch) {
            (0, sass_language_1.shutdownSassWorkerPool)();
        }
    }
    if (progress) {
        logger.info('Watch mode enabled. Watching for file changes...');
    }
    // Setup a watcher
    const { createWatcher } = await Promise.resolve().then(() => __importStar(require('../../tools/esbuild/watcher')));
    const watcher = createWatcher({
        polling: typeof poll === 'number',
        interval: poll,
        ignored: [
            // Ignore the output and cache paths to avoid infinite rebuild cycles
            outputPath,
            cacheOptions.basePath,
            // Ignore all node modules directories to avoid excessive file watchers.
            // Package changes are handled below by watching manifest and lock files.
            '**/node_modules/**',
            '**/.*/**',
        ],
    });
    // Temporarily watch the entire project
    watcher.add(projectRoot);
    // Watch workspace for package manager changes
    const packageWatchFiles = [
        // manifest can affect module resolution
        'package.json',
        // npm lock file
        'package-lock.json',
        // pnpm lock file
        'pnpm-lock.yaml',
        // yarn lock file including Yarn PnP manifest files (https://yarnpkg.com/advanced/pnp-spec/)
        'yarn.lock',
        '.pnp.cjs',
        '.pnp.data.json',
    ];
    watcher.add(packageWatchFiles.map((file) => node_path_1.default.join(workspaceRoot, file)));
    // Watch locations provided by the initial build result
    let previousWatchFiles = new Set(result.watchFiles);
    watcher.add(result.watchFiles);
    // Wait for changes and rebuild as needed
    try {
        for await (const changes of watcher) {
            if (verbose) {
                logger.info(changes.toDebugString());
            }
            result = await withProgress('Changes detected. Rebuilding...', () => action(result.createRebuildState(changes)));
            // Update watched locations provided by the new build result.
            // Add any new locations
            watcher.add(result.watchFiles.filter((watchFile) => !previousWatchFiles.has(watchFile)));
            const newWatchFiles = new Set(result.watchFiles);
            // Remove any old locations
            watcher.remove([...previousWatchFiles].filter((watchFile) => !newWatchFiles.has(watchFile)));
            previousWatchFiles = newWatchFiles;
            if (writeToFileSystem) {
                // Write output files
                await (0, utils_1.writeResultFiles)(result.outputFiles, result.assetFiles, outputPath);
                yield result.output;
            }
            else {
                // Requires casting due to unneeded `JsonObject` requirement. Remove once fixed.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                yield result.outputWithFiles;
            }
        }
    }
    finally {
        // Stop the watcher and cleanup incremental rebuild state
        await Promise.allSettled([watcher.close(), result.dispose()]);
        (0, sass_language_1.shutdownSassWorkerPool)();
    }
}
exports.runEsBuildBuildAction = runEsBuildBuildAction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtYWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYnVpbGRlcnMvYXBwbGljYXRpb24vYnVpbGQtYWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUgsZ0VBQWtDO0FBQ2xDLDBEQUE2QjtBQUU3QixpRkFBdUY7QUFDdkYscURBQTBGO0FBQzFGLDZDQUFrRDtBQUczQyxLQUFLLFNBQVMsQ0FBQyxDQUFDLHFCQUFxQixDQUMxQyxNQUFtRixFQUNuRixPQVlDO0lBRUQsTUFBTSxFQUNKLGlCQUFpQixHQUFHLElBQUksRUFDeEIsS0FBSyxFQUNMLElBQUksRUFDSixNQUFNLEVBQ04sZ0JBQWdCLEVBQ2hCLFlBQVksRUFDWixVQUFVLEVBQ1YsT0FBTyxFQUNQLFdBQVcsRUFDWCxhQUFhLEVBQ2IsUUFBUSxHQUNULEdBQUcsT0FBTyxDQUFDO0lBRVosSUFBSSxpQkFBaUIsRUFBRTtRQUNyQiwrQkFBK0I7UUFDL0IsSUFBSSxnQkFBZ0IsRUFBRTtZQUNwQixJQUFJLFVBQVUsS0FBSyxhQUFhLEVBQUU7Z0JBQ2hDLE1BQU0sQ0FBQyxLQUFLLENBQUMsbURBQW1ELENBQUMsQ0FBQztnQkFFbEUsT0FBTzthQUNSO1lBRUQsTUFBTSxrQkFBRSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDMUU7UUFFRCxvQ0FBb0M7UUFDcEMsSUFBSTtZQUNGLE1BQU0sa0JBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDakQ7UUFBQyxP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N0Qsd0JBQXdCO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RixNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDakQsMkJBQTJCO1lBQzNCLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdGLGtCQUFrQixHQUFHLGFBQWEsQ0FBQztZQUVuQyxJQUFJLGlCQUFpQixFQUFFO2dCQUNyQixxQkFBcUI7Z0JBQ3JCLE1BQU0sSUFBQSx3QkFBZ0IsRUFBQyxNQUFNLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRTFFLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQzthQUNyQjtpQkFBTTtnQkFDTCxnRkFBZ0Y7Z0JBQ2hGLDhEQUE4RDtnQkFDOUQsTUFBTSxNQUFNLENBQUMsZUFBc0IsQ0FBQzthQUNyQztTQUNGO0tBQ0Y7WUFBUztRQUNSLHlEQUF5RDtRQUN6RCxNQUFNLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUU5RCxJQUFBLHNDQUFzQixHQUFFLENBQUM7S0FDMUI7QUFDSCxDQUFDO0FBaktELHNEQWlLQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCdWlsZGVyT3V0cHV0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdCc7XG5pbXBvcnQgdHlwZSB7IGxvZ2dpbmcgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgRXhlY3V0aW9uUmVzdWx0LCBSZWJ1aWxkU3RhdGUgfSBmcm9tICcuLi8uLi90b29scy9lc2J1aWxkL2J1bmRsZXItZXhlY3V0aW9uLXJlc3VsdCc7XG5pbXBvcnQgeyBzaHV0ZG93blNhc3NXb3JrZXJQb29sIH0gZnJvbSAnLi4vLi4vdG9vbHMvZXNidWlsZC9zdHlsZXNoZWV0cy9zYXNzLWxhbmd1YWdlJztcbmltcG9ydCB7IHdpdGhOb1Byb2dyZXNzLCB3aXRoU3Bpbm5lciwgd3JpdGVSZXN1bHRGaWxlcyB9IGZyb20gJy4uLy4uL3Rvb2xzL2VzYnVpbGQvdXRpbHMnO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxzL2Vycm9yJztcbmltcG9ydCB7IE5vcm1hbGl6ZWRDYWNoZWRPcHRpb25zIH0gZnJvbSAnLi4vLi4vdXRpbHMvbm9ybWFsaXplLWNhY2hlJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiBydW5Fc0J1aWxkQnVpbGRBY3Rpb24oXG4gIGFjdGlvbjogKHJlYnVpbGRTdGF0ZT86IFJlYnVpbGRTdGF0ZSkgPT4gRXhlY3V0aW9uUmVzdWx0IHwgUHJvbWlzZTxFeGVjdXRpb25SZXN1bHQ+LFxuICBvcHRpb25zOiB7XG4gICAgd29ya3NwYWNlUm9vdDogc3RyaW5nO1xuICAgIHByb2plY3RSb290OiBzdHJpbmc7XG4gICAgb3V0cHV0UGF0aDogc3RyaW5nO1xuICAgIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGk7XG4gICAgY2FjaGVPcHRpb25zOiBOb3JtYWxpemVkQ2FjaGVkT3B0aW9ucztcbiAgICB3cml0ZVRvRmlsZVN5c3RlbT86IGJvb2xlYW47XG4gICAgd2F0Y2g/OiBib29sZWFuO1xuICAgIHZlcmJvc2U/OiBib29sZWFuO1xuICAgIHByb2dyZXNzPzogYm9vbGVhbjtcbiAgICBkZWxldGVPdXRwdXRQYXRoPzogYm9vbGVhbjtcbiAgICBwb2xsPzogbnVtYmVyO1xuICB9LFxuKTogQXN5bmNJdGVyYWJsZTwoRXhlY3V0aW9uUmVzdWx0WydvdXRwdXRXaXRoRmlsZXMnXSB8IEV4ZWN1dGlvblJlc3VsdFsnb3V0cHV0J10pICYgQnVpbGRlck91dHB1dD4ge1xuICBjb25zdCB7XG4gICAgd3JpdGVUb0ZpbGVTeXN0ZW0gPSB0cnVlLFxuICAgIHdhdGNoLFxuICAgIHBvbGwsXG4gICAgbG9nZ2VyLFxuICAgIGRlbGV0ZU91dHB1dFBhdGgsXG4gICAgY2FjaGVPcHRpb25zLFxuICAgIG91dHB1dFBhdGgsXG4gICAgdmVyYm9zZSxcbiAgICBwcm9qZWN0Um9vdCxcbiAgICB3b3Jrc3BhY2VSb290LFxuICAgIHByb2dyZXNzLFxuICB9ID0gb3B0aW9ucztcblxuICBpZiAod3JpdGVUb0ZpbGVTeXN0ZW0pIHtcbiAgICAvLyBDbGVhbiBvdXRwdXQgcGF0aCBpZiBlbmFibGVkXG4gICAgaWYgKGRlbGV0ZU91dHB1dFBhdGgpIHtcbiAgICAgIGlmIChvdXRwdXRQYXRoID09PSB3b3Jrc3BhY2VSb290KSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignT3V0cHV0IHBhdGggTVVTVCBub3QgYmUgd29ya3NwYWNlIHJvb3QgZGlyZWN0b3J5IScpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgZnMucm0ob3V0cHV0UGF0aCwgeyBmb3JjZTogdHJ1ZSwgcmVjdXJzaXZlOiB0cnVlLCBtYXhSZXRyaWVzOiAzIH0pO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBvdXRwdXQgZGlyZWN0b3J5IGlmIG5lZWRlZFxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5ta2RpcihvdXRwdXRQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBhc3NlcnRJc0Vycm9yKGUpO1xuICAgICAgbG9nZ2VyLmVycm9yKCdVbmFibGUgdG8gY3JlYXRlIG91dHB1dCBkaXJlY3Rvcnk6ICcgKyBlLm1lc3NhZ2UpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgd2l0aFByb2dyZXNzOiB0eXBlb2Ygd2l0aFNwaW5uZXIgPSBwcm9ncmVzcyA/IHdpdGhTcGlubmVyIDogd2l0aE5vUHJvZ3Jlc3M7XG5cbiAgLy8gSW5pdGlhbCBidWlsZFxuICBsZXQgcmVzdWx0OiBFeGVjdXRpb25SZXN1bHQ7XG4gIHRyeSB7XG4gICAgcmVzdWx0ID0gYXdhaXQgd2l0aFByb2dyZXNzKCdCdWlsZGluZy4uLicsICgpID0+IGFjdGlvbigpKTtcblxuICAgIGlmICh3cml0ZVRvRmlsZVN5c3RlbSkge1xuICAgICAgLy8gV3JpdGUgb3V0cHV0IGZpbGVzXG4gICAgICBhd2FpdCB3cml0ZVJlc3VsdEZpbGVzKHJlc3VsdC5vdXRwdXRGaWxlcywgcmVzdWx0LmFzc2V0RmlsZXMsIG91dHB1dFBhdGgpO1xuXG4gICAgICB5aWVsZCByZXN1bHQub3V0cHV0O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZXF1aXJlcyBjYXN0aW5nIGR1ZSB0byB1bm5lZWRlZCBgSnNvbk9iamVjdGAgcmVxdWlyZW1lbnQuIFJlbW92ZSBvbmNlIGZpeGVkLlxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIHlpZWxkIHJlc3VsdC5vdXRwdXRXaXRoRmlsZXMgYXMgYW55O1xuICAgIH1cblxuICAgIC8vIEZpbmlzaCBpZiB3YXRjaCBtb2RlIGlzIG5vdCBlbmFibGVkXG4gICAgaWYgKCF3YXRjaCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBFbnN1cmUgU2FzcyB3b3JrZXJzIGFyZSBzaHV0ZG93biBpZiBub3Qgd2F0Y2hpbmdcbiAgICBpZiAoIXdhdGNoKSB7XG4gICAgICBzaHV0ZG93blNhc3NXb3JrZXJQb29sKCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHByb2dyZXNzKSB7XG4gICAgbG9nZ2VyLmluZm8oJ1dhdGNoIG1vZGUgZW5hYmxlZC4gV2F0Y2hpbmcgZm9yIGZpbGUgY2hhbmdlcy4uLicpO1xuICB9XG5cbiAgLy8gU2V0dXAgYSB3YXRjaGVyXG4gIGNvbnN0IHsgY3JlYXRlV2F0Y2hlciB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi90b29scy9lc2J1aWxkL3dhdGNoZXInKTtcbiAgY29uc3Qgd2F0Y2hlciA9IGNyZWF0ZVdhdGNoZXIoe1xuICAgIHBvbGxpbmc6IHR5cGVvZiBwb2xsID09PSAnbnVtYmVyJyxcbiAgICBpbnRlcnZhbDogcG9sbCxcbiAgICBpZ25vcmVkOiBbXG4gICAgICAvLyBJZ25vcmUgdGhlIG91dHB1dCBhbmQgY2FjaGUgcGF0aHMgdG8gYXZvaWQgaW5maW5pdGUgcmVidWlsZCBjeWNsZXNcbiAgICAgIG91dHB1dFBhdGgsXG4gICAgICBjYWNoZU9wdGlvbnMuYmFzZVBhdGgsXG4gICAgICAvLyBJZ25vcmUgYWxsIG5vZGUgbW9kdWxlcyBkaXJlY3RvcmllcyB0byBhdm9pZCBleGNlc3NpdmUgZmlsZSB3YXRjaGVycy5cbiAgICAgIC8vIFBhY2thZ2UgY2hhbmdlcyBhcmUgaGFuZGxlZCBiZWxvdyBieSB3YXRjaGluZyBtYW5pZmVzdCBhbmQgbG9jayBmaWxlcy5cbiAgICAgICcqKi9ub2RlX21vZHVsZXMvKionLFxuICAgICAgJyoqLy4qLyoqJyxcbiAgICBdLFxuICB9KTtcblxuICAvLyBUZW1wb3JhcmlseSB3YXRjaCB0aGUgZW50aXJlIHByb2plY3RcbiAgd2F0Y2hlci5hZGQocHJvamVjdFJvb3QpO1xuXG4gIC8vIFdhdGNoIHdvcmtzcGFjZSBmb3IgcGFja2FnZSBtYW5hZ2VyIGNoYW5nZXNcbiAgY29uc3QgcGFja2FnZVdhdGNoRmlsZXMgPSBbXG4gICAgLy8gbWFuaWZlc3QgY2FuIGFmZmVjdCBtb2R1bGUgcmVzb2x1dGlvblxuICAgICdwYWNrYWdlLmpzb24nLFxuICAgIC8vIG5wbSBsb2NrIGZpbGVcbiAgICAncGFja2FnZS1sb2NrLmpzb24nLFxuICAgIC8vIHBucG0gbG9jayBmaWxlXG4gICAgJ3BucG0tbG9jay55YW1sJyxcbiAgICAvLyB5YXJuIGxvY2sgZmlsZSBpbmNsdWRpbmcgWWFybiBQblAgbWFuaWZlc3QgZmlsZXMgKGh0dHBzOi8veWFybnBrZy5jb20vYWR2YW5jZWQvcG5wLXNwZWMvKVxuICAgICd5YXJuLmxvY2snLFxuICAgICcucG5wLmNqcycsXG4gICAgJy5wbnAuZGF0YS5qc29uJyxcbiAgXTtcblxuICB3YXRjaGVyLmFkZChwYWNrYWdlV2F0Y2hGaWxlcy5tYXAoKGZpbGUpID0+IHBhdGguam9pbih3b3Jrc3BhY2VSb290LCBmaWxlKSkpO1xuXG4gIC8vIFdhdGNoIGxvY2F0aW9ucyBwcm92aWRlZCBieSB0aGUgaW5pdGlhbCBidWlsZCByZXN1bHRcbiAgbGV0IHByZXZpb3VzV2F0Y2hGaWxlcyA9IG5ldyBTZXQocmVzdWx0LndhdGNoRmlsZXMpO1xuICB3YXRjaGVyLmFkZChyZXN1bHQud2F0Y2hGaWxlcyk7XG5cbiAgLy8gV2FpdCBmb3IgY2hhbmdlcyBhbmQgcmVidWlsZCBhcyBuZWVkZWRcbiAgdHJ5IHtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGNoYW5nZXMgb2Ygd2F0Y2hlcikge1xuICAgICAgaWYgKHZlcmJvc2UpIHtcbiAgICAgICAgbG9nZ2VyLmluZm8oY2hhbmdlcy50b0RlYnVnU3RyaW5nKCkpO1xuICAgICAgfVxuXG4gICAgICByZXN1bHQgPSBhd2FpdCB3aXRoUHJvZ3Jlc3MoJ0NoYW5nZXMgZGV0ZWN0ZWQuIFJlYnVpbGRpbmcuLi4nLCAoKSA9PlxuICAgICAgICBhY3Rpb24ocmVzdWx0LmNyZWF0ZVJlYnVpbGRTdGF0ZShjaGFuZ2VzKSksXG4gICAgICApO1xuXG4gICAgICAvLyBVcGRhdGUgd2F0Y2hlZCBsb2NhdGlvbnMgcHJvdmlkZWQgYnkgdGhlIG5ldyBidWlsZCByZXN1bHQuXG4gICAgICAvLyBBZGQgYW55IG5ldyBsb2NhdGlvbnNcbiAgICAgIHdhdGNoZXIuYWRkKHJlc3VsdC53YXRjaEZpbGVzLmZpbHRlcigod2F0Y2hGaWxlKSA9PiAhcHJldmlvdXNXYXRjaEZpbGVzLmhhcyh3YXRjaEZpbGUpKSk7XG4gICAgICBjb25zdCBuZXdXYXRjaEZpbGVzID0gbmV3IFNldChyZXN1bHQud2F0Y2hGaWxlcyk7XG4gICAgICAvLyBSZW1vdmUgYW55IG9sZCBsb2NhdGlvbnNcbiAgICAgIHdhdGNoZXIucmVtb3ZlKFsuLi5wcmV2aW91c1dhdGNoRmlsZXNdLmZpbHRlcigod2F0Y2hGaWxlKSA9PiAhbmV3V2F0Y2hGaWxlcy5oYXMod2F0Y2hGaWxlKSkpO1xuICAgICAgcHJldmlvdXNXYXRjaEZpbGVzID0gbmV3V2F0Y2hGaWxlcztcblxuICAgICAgaWYgKHdyaXRlVG9GaWxlU3lzdGVtKSB7XG4gICAgICAgIC8vIFdyaXRlIG91dHB1dCBmaWxlc1xuICAgICAgICBhd2FpdCB3cml0ZVJlc3VsdEZpbGVzKHJlc3VsdC5vdXRwdXRGaWxlcywgcmVzdWx0LmFzc2V0RmlsZXMsIG91dHB1dFBhdGgpO1xuXG4gICAgICAgIHlpZWxkIHJlc3VsdC5vdXRwdXQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBSZXF1aXJlcyBjYXN0aW5nIGR1ZSB0byB1bm5lZWRlZCBgSnNvbk9iamVjdGAgcmVxdWlyZW1lbnQuIFJlbW92ZSBvbmNlIGZpeGVkLlxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgICB5aWVsZCByZXN1bHQub3V0cHV0V2l0aEZpbGVzIGFzIGFueTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgLy8gU3RvcCB0aGUgd2F0Y2hlciBhbmQgY2xlYW51cCBpbmNyZW1lbnRhbCByZWJ1aWxkIHN0YXRlXG4gICAgYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKFt3YXRjaGVyLmNsb3NlKCksIHJlc3VsdC5kaXNwb3NlKCldKTtcblxuICAgIHNodXRkb3duU2Fzc1dvcmtlclBvb2woKTtcbiAgfVxufVxuIl19