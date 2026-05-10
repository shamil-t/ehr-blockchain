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
exports.prerenderPages = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
const piscina_1 = __importDefault(require("piscina"));
async function prerenderPages(workspaceRoot, tsConfigPath, appShellOptions = {}, prerenderOptions = {}, outputFiles, document, inlineCriticalCss, maxThreads = 1) {
    const allRoutes = await getAllRoutes(tsConfigPath, appShellOptions, prerenderOptions);
    const outputFilesForWorker = {};
    for (const { text, path } of outputFiles) {
        switch ((0, node_path_1.extname)(path)) {
            case '.mjs': // Contains the server runnable application code.
            case '.css': // Global styles for critical CSS inlining.
                outputFilesForWorker[path] = text;
                break;
        }
    }
    const renderWorker = new piscina_1.default({
        filename: require.resolve('./render-worker'),
        maxThreads: Math.min(allRoutes.size, maxThreads),
        workerData: {
            workspaceRoot,
            outputFiles: outputFilesForWorker,
            inlineCriticalCss,
            document,
        },
        execArgv: [
            '--no-warnings',
            '--loader',
            (0, node_url_1.pathToFileURL)((0, node_path_1.join)(__dirname, 'esm-in-memory-file-loader.js')).href, // Loader cannot be an absolute path on Windows.
        ],
    });
    const output = {};
    const warnings = [];
    const errors = [];
    try {
        const renderingPromises = [];
        for (const route of allRoutes) {
            const isAppShellRoute = appShellOptions.route === route;
            const serverContext = isAppShellRoute ? 'app-shell' : 'ssg';
            const render = renderWorker.run({ route, serverContext });
            const renderResult = render.then(({ content, warnings, errors }) => {
                if (content !== undefined) {
                    const outPath = isAppShellRoute
                        ? 'index.html'
                        : node_path_1.posix.join(route.startsWith('/') ? route.slice(1) /* Remove leading slash */ : route, 'index.html');
                    output[outPath] = content;
                }
                if (warnings) {
                    warnings.push(...warnings);
                }
                if (errors) {
                    errors.push(...errors);
                }
            });
            renderingPromises.push(renderResult);
        }
        await Promise.all(renderingPromises);
    }
    finally {
        void renderWorker.destroy();
    }
    return {
        errors,
        warnings,
        output,
    };
}
exports.prerenderPages = prerenderPages;
async function getAllRoutes(tsConfigPath, appShellOptions, prerenderOptions) {
    const { routesFile, discoverRoutes, routes: existingRoutes } = prerenderOptions;
    const routes = new Set(existingRoutes);
    const { route: appShellRoute } = appShellOptions;
    if (appShellRoute !== undefined) {
        routes.add(appShellRoute);
    }
    if (routesFile) {
        const routesFromFile = (await (0, promises_1.readFile)(routesFile, 'utf8')).split(/\r?\n/);
        for (let route of routesFromFile) {
            route = route.trim();
            if (route) {
                routes.add(route);
            }
        }
    }
    if (discoverRoutes) {
        const { parseAngularRoutes } = await Promise.resolve().then(() => __importStar(require('guess-parser')));
        for (const { path } of parseAngularRoutes(tsConfigPath)) {
            // Exclude dynamic routes as these cannot be pre-rendered.
            if (!/[*:]/.test(path)) {
                routes.add(path);
            }
        }
    }
    return routes;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlcmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvc2VydmVyLXJlbmRlcmluZy9wcmVyZW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCwrQ0FBNEM7QUFDNUMseUNBQWlEO0FBQ2pELHVDQUF5QztBQUN6QyxzREFBOEI7QUFjdkIsS0FBSyxVQUFVLGNBQWMsQ0FDbEMsYUFBcUIsRUFDckIsWUFBb0IsRUFDcEIsa0JBQW1DLEVBQUUsRUFDckMsbUJBQXFDLEVBQUUsRUFDdkMsV0FBbUMsRUFDbkMsUUFBZ0IsRUFDaEIsaUJBQTJCLEVBQzNCLFVBQVUsR0FBRyxDQUFDO0lBTWQsTUFBTSxTQUFTLEdBQUcsTUFBTSxZQUFZLENBQUMsWUFBWSxFQUFFLGVBQWUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3RGLE1BQU0sb0JBQW9CLEdBQTJCLEVBQUUsQ0FBQztJQUV4RCxLQUFLLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksV0FBVyxFQUFFO1FBQ3hDLFFBQVEsSUFBQSxtQkFBTyxFQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3JCLEtBQUssTUFBTSxDQUFDLENBQUMsaURBQWlEO1lBQzlELEtBQUssTUFBTSxFQUFFLDJDQUEyQztnQkFDdEQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUNsQyxNQUFNO1NBQ1Q7S0FDRjtJQUVELE1BQU0sWUFBWSxHQUFHLElBQUksaUJBQU8sQ0FBQztRQUMvQixRQUFRLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztRQUM1QyxVQUFVLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFVB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Q0FBQztRQUMzRSxLQUFLLElBQUksS0FBSyxJQUFJLGNBQWMsRUFBRTtZQUNoQyxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3JCLElBQUksS0FBSyxFQUFFO2dCQUNULE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDbkI7U0FDRjtLQUNGO0lBRUQsSUFBSSxjQUFjLEVBQUU7UUFDbEIsTUFBTSxFQUFFLGtCQUFrQixFQUFFLEdBQUcsd0RBQWEsY0FBYyxHQUFDLENBQUM7UUFDNUQsS0FBSyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksa0JBQWtCLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDdkQsMERBQTBEO1lBQzFELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN0QixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ2xCO1NBQ0Y7S0FDRjtJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgT3V0cHV0RmlsZSB9IGZyb20gJ2VzYnVpbGQnO1xuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB7IGV4dG5hbWUsIGpvaW4sIHBvc2l4IH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHBhdGhUb0ZpbGVVUkwgfSBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgUGlzY2luYSBmcm9tICdwaXNjaW5hJztcbmltcG9ydCB0eXBlIHsgUmVuZGVyUmVzdWx0LCBTZXJ2ZXJDb250ZXh0IH0gZnJvbSAnLi9yZW5kZXItcGFnZSc7XG5pbXBvcnQgdHlwZSB7IFdvcmtlckRhdGEgfSBmcm9tICcuL3JlbmRlci13b3JrZXInO1xuXG5pbnRlcmZhY2UgUHJlcmVuZGVyT3B0aW9ucyB7XG4gIHJvdXRlc0ZpbGU/OiBzdHJpbmc7XG4gIGRpc2NvdmVyUm91dGVzPzogYm9vbGVhbjtcbiAgcm91dGVzPzogc3RyaW5nW107XG59XG5cbmludGVyZmFjZSBBcHBTaGVsbE9wdGlvbnMge1xuICByb3V0ZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByZXJlbmRlclBhZ2VzKFxuICB3b3Jrc3BhY2VSb290OiBzdHJpbmcsXG4gIHRzQ29uZmlnUGF0aDogc3RyaW5nLFxuICBhcHBTaGVsbE9wdGlvbnM6IEFwcFNoZWxsT3B0aW9ucyA9IHt9LFxuICBwcmVyZW5kZXJPcHRpb25zOiBQcmVyZW5kZXJPcHRpb25zID0ge30sXG4gIG91dHB1dEZpbGVzOiBSZWFkb25seTxPdXRwdXRGaWxlW10+LFxuICBkb2N1bWVudDogc3RyaW5nLFxuICBpbmxpbmVDcml0aWNhbENzcz86IGJvb2xlYW4sXG4gIG1heFRocmVhZHMgPSAxLFxuKTogUHJvbWlzZTx7XG4gIG91dHB1dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xuICBlcnJvcnM6IHN0cmluZ1tdO1xufT4ge1xuICBjb25zdCBhbGxSb3V0ZXMgPSBhd2FpdCBnZXRBbGxSb3V0ZXModHNDb25maWdQYXRoLCBhcHBTaGVsbE9wdGlvbnMsIHByZXJlbmRlck9wdGlvbnMpO1xuICBjb25zdCBvdXRwdXRGaWxlc0ZvcldvcmtlcjogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gIGZvciAoY29uc3QgeyB0ZXh0LCBwYXRoIH0gb2Ygb3V0cHV0RmlsZXMpIHtcbiAgICBzd2l0Y2ggKGV4dG5hbWUocGF0aCkpIHtcbiAgICAgIGNhc2UgJy5tanMnOiAvLyBDb250YWlucyB0aGUgc2VydmVyIHJ1bm5hYmxlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAgICBjYXNlICcuY3NzJzogLy8gR2xvYmFsIHN0eWxlcyBmb3IgY3JpdGljYWwgQ1NTIGlubGluaW5nLlxuICAgICAgICBvdXRwdXRGaWxlc0ZvcldvcmtlcltwYXRoXSA9IHRleHQ7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHJlbmRlcldvcmtlciA9IG5ldyBQaXNjaW5hKHtcbiAgICBmaWxlbmFtZTogcmVxdWlyZS5yZXNvbHZlKCcuL3JlbmRlci13b3JrZXInKSxcbiAgICBtYXhUaHJlYWRzOiBNYXRoLm1pbihhbGxSb3V0ZXMuc2l6ZSwgbWF4VGhyZWFkcyksXG4gICAgd29ya2VyRGF0YToge1xuICAgICAgd29ya3NwYWNlUm9vdCxcbiAgICAgIG91dHB1dEZpbGVzOiBvdXRwdXRGaWxlc0ZvcldvcmtlcixcbiAgICAgIGlubGluZUNyaXRpY2FsQ3NzLFxuICAgICAgZG9jdW1lbnQsXG4gICAgfSBhcyBXb3JrZXJEYXRhLFxuICAgIGV4ZWNBcmd2OiBbXG4gICAgICAnLS1uby13YXJuaW5ncycsIC8vIFN1cHByZXNzIGBFeHBlcmltZW50YWxXYXJuaW5nOiBDdXN0b20gRVNNIExvYWRlcnMgaXMgYW4gZXhwZXJpbWVudGFsIGZlYXR1cmUuLi5gLlxuICAgICAgJy0tbG9hZGVyJyxcbiAgICAgIHBhdGhUb0ZpbGVVUkwoam9pbihfX2Rpcm5hbWUsICdlc20taW4tbWVtb3J5LWZpbGUtbG9hZGVyLmpzJykpLmhyZWYsIC8vIExvYWRlciBjYW5ub3QgYmUgYW4gYWJzb2x1dGUgcGF0aCBvbiBXaW5kb3dzLlxuICAgIF0sXG4gIH0pO1xuXG4gIGNvbnN0IG91dHB1dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVuZGVyaW5nUHJvbWlzZXM6IFByb21pc2U8dm9pZD5bXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCByb3V0ZSBvZiBhbGxSb3V0ZXMpIHtcbiAgICAgIGNvbnN0IGlzQXBwU2hlbGxSb3V0ZSA9IGFwcFNoZWxsT3B0aW9ucy5yb3V0ZSA9PT0gcm91dGU7XG4gICAgICBjb25zdCBzZXJ2ZXJDb250ZXh0OiBTZXJ2ZXJDb250ZXh0ID0gaXNBcHBTaGVsbFJvdXRlID8gJ2FwcC1zaGVsbCcgOiAnc3NnJztcblxuICAgICAgY29uc3QgcmVuZGVyOiBQcm9taXNlPFJlbmRlclJlc3VsdD4gPSByZW5kZXJXb3JrZXIucnVuKHsgcm91dGUsIHNlcnZlckNvbnRleHQgfSk7XG4gICAgICBjb25zdCByZW5kZXJSZXN1bHQ6IFByb21pc2U8dm9pZD4gPSByZW5kZXIudGhlbigoeyBjb250ZW50LCB3YXJuaW5ncywgZXJyb3JzIH0pID0+IHtcbiAgICAgICAgaWYgKGNvbnRlbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbnN0IG91dFBhdGggPSBpc0FwcFNoZWxsUm91dGVcbiAgICAgICAgICAgID8gJ2luZGV4Lmh0bWwnXG4gICAgICAgICAgICA6IHBvc2l4LmpvaW4oXG4gICAgICAgICAgICAgICAgcm91dGUuc3RhcnRzV2l0aCgnLycpID8gcm91dGUuc2xpY2UoMSkgLyogUmVtb3ZlIGxlYWRpbmcgc2xhc2ggKi8gOiByb3V0ZSxcbiAgICAgICAgICAgICAgICAnaW5kZXguaHRtbCcsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgb3V0cHV0W291dFBhdGhdID0gY29udGVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh3YXJuaW5ncykge1xuICAgICAgICAgIHdhcm5pbmdzLnB1c2goLi4ud2FybmluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVycm9ycykge1xuICAgICAgICAgIGVycm9ycy5wdXNoKC4uLmVycm9ycyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZW5kZXJpbmdQcm9taXNlcy5wdXNoKHJlbmRlclJlc3VsdCk7XG4gICAgfVxuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwocmVuZGVyaW5nUHJvbWlzZXMpO1xuICB9IGZpbmFsbHkge1xuICAgIHZvaWQgcmVuZGVyV29ya2VyLmRlc3Ryb3koKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZXJyb3JzLFxuICAgIHdhcm5pbmdzLFxuICAgIG91dHB1dCxcbiAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0QWxsUm91dGVzKFxuICB0c0NvbmZpZ1BhdGg6IHN0cmluZyxcbiAgYXBwU2hlbGxPcHRpb25zOiBBcHBTaGVsbE9wdGlvbnMsXG4gIHByZXJlbmRlck9wdGlvbnM6IFByZXJlbmRlck9wdGlvbnMsXG4pOiBQcm9taXNlPFNldDxzdHJpbmc+PiB7XG4gIGNvbnN0IHsgcm91dGVzRmlsZSwgZGlzY292ZXJSb3V0ZXMsIHJvdXRlczogZXhpc3RpbmdSb3V0ZXMgfSA9IHByZXJlbmRlck9wdGlvbnM7XG4gIGNvbnN0IHJvdXRlcyA9IG5ldyBTZXQoZXhpc3RpbmdSb3V0ZXMpO1xuXG4gIGNvbnN0IHsgcm91dGU6IGFwcFNoZWxsUm91dGUgfSA9IGFwcFNoZWxsT3B0aW9ucztcbiAgaWYgKGFwcFNoZWxsUm91dGUgIT09IHVuZGVmaW5lZCkge1xuICAgIHJvdXRlcy5hZGQoYXBwU2hlbGxSb3V0ZSk7XG4gIH1cblxuICBpZiAocm91dGVzRmlsZSkge1xuICAgIGNvbnN0IHJvdXRlc0Zyb21GaWxlID0gKGF3YWl0IHJlYWRGaWxlKHJvdXRlc0ZpbGUsICd1dGY4JykpLnNwbGl0KC9cXHI/XFxuLyk7XG4gICAgZm9yIChsZXQgcm91dGUgb2Ygcm91dGVzRnJvbUZpbGUpIHtcbiAgICAgIHJvdXRlID0gcm91dGUudHJpbSgpO1xuICAgICAgaWYgKHJvdXRlKSB7XG4gICAgICAgIHJvdXRlcy5hZGQocm91dGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChkaXNjb3ZlclJvdXRlcykge1xuICAgIGNvbnN0IHsgcGFyc2VBbmd1bGFyUm91dGVzIH0gPSBhd2FpdCBpbXBvcnQoJ2d1ZXNzLXBhcnNlcicpO1xuICAgIGZvciAoY29uc3QgeyBwYXRoIH0gb2YgcGFyc2VBbmd1bGFyUm91dGVzKHRzQ29uZmlnUGF0aCkpIHtcbiAgICAgIC8vIEV4Y2x1ZGUgZHluYW1pYyByb3V0ZXMgYXMgdGhlc2UgY2Fubm90IGJlIHByZS1yZW5kZXJlZC5cbiAgICAgIGlmICghL1sqOl0vLnRlc3QocGF0aCkpIHtcbiAgICAgICAgcm91dGVzLmFkZChwYXRoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcm91dGVzO1xufVxuIl19