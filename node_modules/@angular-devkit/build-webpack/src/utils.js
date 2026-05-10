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
exports.getWebpackConfig = exports.getEmittedFiles = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const url_1 = require("url");
function getEmittedFiles(compilation) {
    const files = [];
    const chunkFileNames = new Set();
    // adds all chunks to the list of emitted files such as lazy loaded modules
    for (const chunk of compilation.chunks) {
        for (const file of chunk.files) {
            if (chunkFileNames.has(file)) {
                continue;
            }
            chunkFileNames.add(file);
            files.push({
                id: chunk.id?.toString(),
                name: chunk.name,
                file,
                extension: path.extname(file),
                initial: chunk.isOnlyInitial(),
            });
        }
    }
    // add all other files
    for (const file of Object.keys(compilation.assets)) {
        // Chunk files have already been added to the files list above
        if (chunkFileNames.has(file)) {
            continue;
        }
        files.push({ file, extension: path.extname(file), initial: false, asset: true });
    }
    return files;
}
exports.getEmittedFiles = getEmittedFiles;
/**
 * This uses a dynamic import to load a module which may be ESM.
 * CommonJS code can load ESM code via a dynamic import. Unfortunately, TypeScript
 * will currently, unconditionally downlevel dynamic import into a require call.
 * require calls cannot load ESM code and will result in a runtime error. To workaround
 * this, a Function constructor is used to prevent TypeScript from changing the dynamic import.
 * Once TypeScript provides support for keeping the dynamic import this workaround can
 * be dropped.
 *
 * @param modulePath The path of the module to load.
 * @returns A Promise that resolves to the dynamically imported module.
 */
function loadEsmModule(modulePath) {
    return new Function('modulePath', `return import(modulePath);`)(modulePath);
}
async function getWebpackConfig(configPath) {
    if (!(0, fs_1.existsSync)(configPath)) {
        throw new Error(`Webpack configuration file ${configPath} does not exist.`);
    }
    switch (path.extname(configPath)) {
        case '.mjs':
            // Load the ESM configuration file using the TypeScript dynamic import workaround.
            // Once TypeScript provides support for keeping the dynamic import this workaround can be
            // changed to a direct dynamic import.
            return (await loadEsmModule((0, url_1.pathToFileURL)(configPath))).default;
        case '.cjs':
            return require(configPath);
        default:
            // The file could be either CommonJS or ESM.
            // CommonJS is tried first then ESM if loading fails.
            try {
                return require(configPath);
            }
            catch (e) {
                if (e.code === 'ERR_REQUIRE_ESM') {
                    // Load the ESM configuration file using the TypeScript dynamic import workaround.
                    // Once TypeScript provides support for keeping the dynamic import this workaround can be
                    // changed to a direct dynamic import.
                    return (await loadEsmModule((0, url_1.pathToFileURL)(configPath)))
                        .default;
                }
                throw e;
            }
    }
}
exports.getWebpackConfig = getWebpackConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF93ZWJwYWNrL3NyYy91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILDJCQUFnQztBQUNoQywyQ0FBNkI7QUFDN0IsNkJBQXlDO0FBWXpDLFNBQWdCLGVBQWUsQ0FBQyxXQUF3QjtJQUN0RCxNQUFNLEtBQUssR0FBbUIsRUFBRSxDQUFDO0lBQ2pDLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7SUFFekMsMkVBQTJFO0lBQzNFLEtBQUssTUFBTSxLQUFLLElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRTtRQUN0QyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7WUFDOUIsSUFBSSxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM1QixTQUFTO2FBQ1Y7WUFFRCxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pCLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ1QsRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFO2dCQUN4QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7Z0JBQ2hCLElBQUk7Z0JBQ0osU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUM3QixPQUFPLEVBQUUsS0FBSyxDQUFDLGFBQWEsRUFBRTthQUMvQixDQUFDLENBQUM7U0FDSjtLQUNGO0lBRUQsc0JBQXNCO0lBQ3RCLEtBQUssTUFBTSxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDbEQsOERBQThEO1FBQzlELElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM1QixTQUFTO1NBQ1Y7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7S0FDbEY7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFqQ0QsMENBaUNDO0FBRUQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxTQUFTLGFBQWEsQ0FBSSxVQUF3QjtJQUNoRCxPQUFPLElBQUksUUFBUSxDQUFDLFlBQVksRUFBRSw0QkFBNEIsQ0FBQyxDQUFDLFVBQVUsQ0FBZSxDQUFDO0FBQzVGLENBQUM7QUFFTSxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsVUFBa0I7SUFDdkQsSUFBSSxDQUFDLElBQUEsZUFBVSxFQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLFVBQVUsa0JBQWtCLENBQUMsQ0FBQztLQUM3RTtJQUVELFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUNoQyxLQUFLLE1BQU07WUFDVCxrRkFBa0Y7WUFDbEYseUZBQXlGO1lBQ3pGLHNDQUFzQztZQUN0QyxPQUFPLENBQUMsTUFBTSxhQUFhLENBQTZCLElBQUEsbUJBQWEsRUFBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQzlGLEtBQUssTUFBTTtZQUNULE9BQU8sT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzdCO1lBQ0UsNENBQTRDO1lBQzVDLHFEQUFxRDtZQUNyRCxJQUFJO2dCQUNGLE9BQU8sT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQzVCO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1YsSUFBSyxDQUEyQixDQUFDLElBQUksS0FBSyxpQkFBaUIsRUFBRTtvQkFDM0Qsa0ZBQWtGO29CQUNsRix5RkFBeUY7b0JBQ3pGLHNDQUFzQztvQkFDdEMsT0FBTyxDQUFDLE1BQU0sYUFBYSxDQUE2QixJQUFBLG1CQUFhLEVBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzt5QkFDaEYsT0FBTyxDQUFDO2lCQUNaO2dCQUVELE1BQU0sQ0FBQyxDQUFDO2FBQ1Q7S0FDSjtBQUNILENBQUM7QUE5QkQsNENBOEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgVVJMLCBwYXRoVG9GaWxlVVJMIH0gZnJvbSAndXJsJztcbmltcG9ydCB7IENvbXBpbGF0aW9uLCBDb25maWd1cmF0aW9uIH0gZnJvbSAnd2VicGFjayc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW1pdHRlZEZpbGVzIHtcbiAgaWQ/OiBzdHJpbmc7XG4gIG5hbWU/OiBzdHJpbmc7XG4gIGZpbGU6IHN0cmluZztcbiAgaW5pdGlhbDogYm9vbGVhbjtcbiAgYXNzZXQ/OiBib29sZWFuO1xuICBleHRlbnNpb246IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVtaXR0ZWRGaWxlcyhjb21waWxhdGlvbjogQ29tcGlsYXRpb24pOiBFbWl0dGVkRmlsZXNbXSB7XG4gIGNvbnN0IGZpbGVzOiBFbWl0dGVkRmlsZXNbXSA9IFtdO1xuICBjb25zdCBjaHVua0ZpbGVOYW1lcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIC8vIGFkZHMgYWxsIGNodW5rcyB0byB0aGUgbGlzdCBvZiBlbWl0dGVkIGZpbGVzIHN1Y2ggYXMgbGF6eSBsb2FkZWQgbW9kdWxlc1xuICBmb3IgKGNvbnN0IGNodW5rIG9mIGNvbXBpbGF0aW9uLmNodW5rcykge1xuICAgIGZvciAoY29uc3QgZmlsZSBvZiBjaHVuay5maWxlcykge1xuICAgICAgaWYgKGNodW5rRmlsZU5hbWVzLmhhcyhmaWxlKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY2h1bmtGaWxlTmFtZXMuYWRkKGZpbGUpO1xuICAgICAgZmlsZXMucHVzaCh7XG4gICAgICAgIGlkOiBjaHVuay5pZD8udG9TdHJpbmcoKSxcbiAgICAgICAgbmFtZTogY2h1bmsubmFtZSxcbiAgICAgICAgZmlsZSxcbiAgICAgICAgZXh0ZW5zaW9uOiBwYXRoLmV4dG5hbWUoZmlsZSksXG4gICAgICAgIGluaXRpYWw6IGNodW5rLmlzT25seUluaXRpYWwoKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIGFkZCBhbGwgb3RoZXIgZmlsZXNcbiAgZm9yIChjb25zdCBmaWxlIG9mIE9iamVjdC5rZXlzKGNvbXBpbGF0aW9uLmFzc2V0cykpIHtcbiAgICAvLyBDaHVuayBmaWxlcyBoYXZlIGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGUgZmlsZXMgbGlzdCBhYm92ZVxuICAgIGlmIChjaHVua0ZpbGVOYW1lcy5oYXMoZmlsZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGZpbGVzLnB1c2goeyBmaWxlLCBleHRlbnNpb246IHBhdGguZXh0bmFtZShmaWxlKSwgaW5pdGlhbDogZmFsc2UsIGFzc2V0OiB0cnVlIH0pO1xuICB9XG5cbiAgcmV0dXJuIGZpbGVzO1xufVxuXG4vKipcbiAqIFRoaXMgdXNlcyBhIGR5bmFtaWMgaW1wb3J0IHRvIGxvYWQgYSBtb2R1bGUgd2hpY2ggbWF5IGJlIEVTTS5cbiAqIENvbW1vbkpTIGNvZGUgY2FuIGxvYWQgRVNNIGNvZGUgdmlhIGEgZHluYW1pYyBpbXBvcnQuIFVuZm9ydHVuYXRlbHksIFR5cGVTY3JpcHRcbiAqIHdpbGwgY3VycmVudGx5LCB1bmNvbmRpdGlvbmFsbHkgZG93bmxldmVsIGR5bmFtaWMgaW1wb3J0IGludG8gYSByZXF1aXJlIGNhbGwuXG4gKiByZXF1aXJlIGNhbGxzIGNhbm5vdCBsb2FkIEVTTSBjb2RlIGFuZCB3aWxsIHJlc3VsdCBpbiBhIHJ1bnRpbWUgZXJyb3IuIFRvIHdvcmthcm91bmRcbiAqIHRoaXMsIGEgRnVuY3Rpb24gY29uc3RydWN0b3IgaXMgdXNlZCB0byBwcmV2ZW50IFR5cGVTY3JpcHQgZnJvbSBjaGFuZ2luZyB0aGUgZHluYW1pYyBpbXBvcnQuXG4gKiBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhblxuICogYmUgZHJvcHBlZC5cbiAqXG4gKiBAcGFyYW0gbW9kdWxlUGF0aCBUaGUgcGF0aCBvZiB0aGUgbW9kdWxlIHRvIGxvYWQuXG4gKiBAcmV0dXJucyBBIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgZHluYW1pY2FsbHkgaW1wb3J0ZWQgbW9kdWxlLlxuICovXG5mdW5jdGlvbiBsb2FkRXNtTW9kdWxlPFQ+KG1vZHVsZVBhdGg6IHN0cmluZyB8IFVSTCk6IFByb21pc2U8VD4ge1xuICByZXR1cm4gbmV3IEZ1bmN0aW9uKCdtb2R1bGVQYXRoJywgYHJldHVybiBpbXBvcnQobW9kdWxlUGF0aCk7YCkobW9kdWxlUGF0aCkgYXMgUHJvbWlzZTxUPjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFdlYnBhY2tDb25maWcoY29uZmlnUGF0aDogc3RyaW5nKTogUHJvbWlzZTxDb25maWd1cmF0aW9uPiB7XG4gIGlmICghZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgV2VicGFjayBjb25maWd1cmF0aW9uIGZpbGUgJHtjb25maWdQYXRofSBkb2VzIG5vdCBleGlzdC5gKTtcbiAgfVxuXG4gIHN3aXRjaCAocGF0aC5leHRuYW1lKGNvbmZpZ1BhdGgpKSB7XG4gICAgY2FzZSAnLm1qcyc6XG4gICAgICAvLyBMb2FkIHRoZSBFU00gY29uZmlndXJhdGlvbiBmaWxlIHVzaW5nIHRoZSBUeXBlU2NyaXB0IGR5bmFtaWMgaW1wb3J0IHdvcmthcm91bmQuXG4gICAgICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZVxuICAgICAgLy8gY2hhbmdlZCB0byBhIGRpcmVjdCBkeW5hbWljIGltcG9ydC5cbiAgICAgIHJldHVybiAoYXdhaXQgbG9hZEVzbU1vZHVsZTx7IGRlZmF1bHQ6IENvbmZpZ3VyYXRpb24gfT4ocGF0aFRvRmlsZVVSTChjb25maWdQYXRoKSkpLmRlZmF1bHQ7XG4gICAgY2FzZSAnLmNqcyc6XG4gICAgICByZXR1cm4gcmVxdWlyZShjb25maWdQYXRoKTtcbiAgICBkZWZhdWx0OlxuICAgICAgLy8gVGhlIGZpbGUgY291bGQgYmUgZWl0aGVyIENvbW1vbkpTIG9yIEVTTS5cbiAgICAgIC8vIENvbW1vbkpTIGlzIHRyaWVkIGZpcnN0IHRoZW4gRVNNIGlmIGxvYWRpbmcgZmFpbHMuXG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gcmVxdWlyZShjb25maWdQYXRoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKChlIGFzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbikuY29kZSA9PT0gJ0VSUl9SRVFVSVJFX0VTTScpIHtcbiAgICAgICAgICAvLyBMb2FkIHRoZSBFU00gY29uZmlndXJhdGlvbiBmaWxlIHVzaW5nIHRoZSBUeXBlU2NyaXB0IGR5bmFtaWMgaW1wb3J0IHdvcmthcm91bmQuXG4gICAgICAgICAgLy8gT25jZSBUeXBlU2NyaXB0IHByb3ZpZGVzIHN1cHBvcnQgZm9yIGtlZXBpbmcgdGhlIGR5bmFtaWMgaW1wb3J0IHRoaXMgd29ya2Fyb3VuZCBjYW4gYmVcbiAgICAgICAgICAvLyBjaGFuZ2VkIHRvIGEgZGlyZWN0IGR5bmFtaWMgaW1wb3J0LlxuICAgICAgICAgIHJldHVybiAoYXdhaXQgbG9hZEVzbU1vZHVsZTx7IGRlZmF1bHQ6IENvbmZpZ3VyYXRpb24gfT4ocGF0aFRvRmlsZVVSTChjb25maWdQYXRoKSkpXG4gICAgICAgICAgICAuZGVmYXVsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gIH1cbn1cbiJdfQ==