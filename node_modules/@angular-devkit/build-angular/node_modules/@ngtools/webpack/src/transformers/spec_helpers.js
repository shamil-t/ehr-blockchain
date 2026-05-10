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
exports.transformTypescript = exports.createTypescriptContext = void 0;
const path_1 = require("path");
const ts = __importStar(require("typescript"));
// Test transform helpers.
const basefileName = 'test-file.ts';
function createTypescriptContext(content, additionalFiles, useLibs = false, extraCompilerOptions = {}, jsxFile = false) {
    const fileName = basefileName + (jsxFile ? 'x' : '');
    // Set compiler options.
    const compilerOptions = {
        noEmitOnError: useLibs,
        allowJs: true,
        newLine: ts.NewLineKind.LineFeed,
        moduleResolution: ts.ModuleResolutionKind.Node10,
        module: ts.ModuleKind.ES2020,
        target: ts.ScriptTarget.ES2020,
        skipLibCheck: true,
        sourceMap: false,
        importHelpers: true,
        experimentalDecorators: true,
        types: [],
        ...extraCompilerOptions,
    };
    // Create compiler host.
    const compilerHost = ts.createCompilerHost(compilerOptions, true);
    const baseFileExists = compilerHost.fileExists;
    compilerHost.fileExists = function (compilerFileName) {
        return (compilerFileName === fileName ||
            !!additionalFiles?.[(0, path_1.basename)(compilerFileName)] ||
            baseFileExists(compilerFileName));
    };
    const baseReadFile = compilerHost.readFile;
    compilerHost.readFile = function (compilerFileName) {
        if (compilerFileName === fileName) {
            return content;
        }
        else if (additionalFiles?.[(0, path_1.basename)(compilerFileName)]) {
            return additionalFiles[(0, path_1.basename)(compilerFileName)];
        }
        else {
            return baseReadFile(compilerFileName);
        }
    };
    // Create the TypeScript program.
    const program = ts.createProgram([fileName], compilerOptions, compilerHost);
    return { compilerHost, program };
}
exports.createTypescriptContext = createTypescriptContext;
function transformTypescript(content, transformers, program, compilerHost) {
    // Use given context or create a new one.
    if (content !== undefined) {
        const typescriptContext = createTypescriptContext(content);
        if (!program) {
            program = typescriptContext.program;
        }
        if (!compilerHost) {
            compilerHost = typescriptContext.compilerHost;
        }
    }
    else if (!program || !compilerHost) {
        throw new Error('transformTypescript needs either `content` or a `program` and `compilerHost');
    }
    const outputFileName = basefileName.replace(/\.tsx?$/, '.js');
    let outputContent;
    // Emit.
    const { emitSkipped, diagnostics } = program.emit(undefined, (filename, data) => {
        if (filename === outputFileName) {
            outputContent = data;
        }
    }, undefined, undefined, { before: transformers });
    // Throw error with diagnostics if emit wasn't successfull.
    if (emitSkipped) {
        throw new Error(ts.formatDiagnostics(diagnostics, compilerHost));
    }
    // Return the transpiled js.
    return outputContent;
}
exports.transformTypescript = transformTypescript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlY19oZWxwZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbmd0b29scy93ZWJwYWNrL3NyYy90cmFuc2Zvcm1lcnMvc3BlY19oZWxwZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0JBQWdDO0FBQ2hDLCtDQUFpQztBQUVqQywwQkFBMEI7QUFDMUIsTUFBTSxZQUFZLEdBQUcsY0FBYyxDQUFDO0FBRXBDLFNBQWdCLHVCQUF1QixDQUNyQyxPQUFlLEVBQ2YsZUFBd0MsRUFDeEMsT0FBTyxHQUFHLEtBQUssRUFDZix1QkFBMkMsRUFBRSxFQUM3QyxPQUFPLEdBQUcsS0FBSztJQUVmLE1BQU0sUUFBUSxHQUFHLFlBQVksR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNyRCx3QkFBd0I7SUFDeEIsTUFBTSxlQUFlLEdBQXVCO1FBQzFDLGFBQWEsRUFBRSxPQUFPO1FBQ3RCLE9BQU8sRUFBRSxJQUFJO1FBQ2IsT0FBTyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUTtRQUNoQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsb0JBQW9CLENBQUMsTUFBTTtRQUNoRCxNQUFNLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNO1FBQzVCLE1BQU0sRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU07UUFDOUIsWUFBWSxFQUFFLElBQUk7UUFDbEIsU0FBUyxFQUFFLEtBQUs7UUFDaEIsYUFBYSxFQUFFLElBQUk7UUFDbkIsc0JBQXNCLEVBQUUsSUFBSTtRQUM1QixLQUFLLEVBQUUsRUFBRTtRQUNULEdBQUcsb0JBQW9CO0tBQ3hCLENBQUM7SUFFRix3QkFBd0I7SUFDeEIsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUVsRSxNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDO0lBQy9DLFlBQVksQ0FBQyxVQUFVLEdBQUcsVUFBVSxnQkFBd0I7UUFDMUQsT0FBTyxDQUNMLGdCQUFnQixLQUFLLFFBQVE7WUFDN0IsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUEsZUFBUSxFQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDL0MsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQ2pDLENBQUM7SUFDSixDQUFDLENBQUM7SUFFRixNQUFNLFlBQVksR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDO0lBQzNDLFlBQVksQ0FBQyxRQUFRLEdBQUcsVUFBVSxnQkFBd0I7UUFDeEQsSUFBSSxnQkFBZ0IsS0FBSyxRQUFRLEVBQUU7WUFDakMsT0FBTyxPQUFPLENBQUM7U0FDaEI7YUFBTSxJQUFJLGVBQWUsRUFBRSxDQUFDLElBQUEsZUFBUSxFQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRTtZQUN4RCxPQUFPLGVBQWUsQ0FBQyxJQUFBLGVBQVEsRUFBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7U0FDcEQ7YUFBTTtZQUNMLE9BQU8sWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDdkM7SUFDSCxDQUFDLENBQUM7SUFFRixpQ0FBaUM7SUFDakMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUU1RSxPQUFPLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDO0FBQ25DLENBQUM7QUFuREQsMERBbURDO0FBRUQsU0FBZ0IsbUJBQW1CLENBQ2pDLE9BQTJCLEVBQzNCLFlBQW9ELEVBQ3BELE9BQW9CLEVBQ3BCLFlBQThCO0lBRTlCLHlDQUF5QztJQUN6QyxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7UUFDekIsTUFBTSxpQkFBaUIsR0FBRyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osT0FBTyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQztTQUNyQztRQUNELElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDakIsWUFBWSxHQUFHLGlCQUFpQixDQUFDLFlBQVksQ0FBQztTQUMvQztLQUNGO1NBQU0sSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLFlBQVksRUFBRTtRQUNwQyxNQUFNLElBQUksS0FBSyxDQUFDLDZFQUE2RSxDQUFDLENBQUM7S0FDaEc7SUFFRCxNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM5RCxJQUFJLGFBQWEsQ0FBQztJQUNsQixRQUFRO0lBQ1IsTUFBTSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUMvQyxTQUFTLEVBQ1QsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLEVBQUU7UUFDakIsSUFBSSxRQUFRLEtBQUssY0FBYyxFQUFFO1lBQy9CLGFBQWEsR0FBRyxJQUFJLENBQUM7U0FDdEI7SUFDSCxDQUFDLEVBQ0QsU0FBUyxFQUNULFNBQVMsRUFDVCxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsQ0FDekIsQ0FBQztJQUVGLDJEQUEyRDtJQUMzRCxJQUFJLFdBQVcsRUFBRTtRQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO0tBQ2xFO0lBRUQsNEJBQTRCO0lBQzVCLE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUF6Q0Qsa0RBeUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGJhc2VuYW1lIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuLy8gVGVzdCB0cmFuc2Zvcm0gaGVscGVycy5cbmNvbnN0IGJhc2VmaWxlTmFtZSA9ICd0ZXN0LWZpbGUudHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHlwZXNjcmlwdENvbnRleHQoXG4gIGNvbnRlbnQ6IHN0cmluZyxcbiAgYWRkaXRpb25hbEZpbGVzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbiAgdXNlTGlicyA9IGZhbHNlLFxuICBleHRyYUNvbXBpbGVyT3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zID0ge30sXG4gIGpzeEZpbGUgPSBmYWxzZSxcbikge1xuICBjb25zdCBmaWxlTmFtZSA9IGJhc2VmaWxlTmFtZSArIChqc3hGaWxlID8gJ3gnIDogJycpO1xuICAvLyBTZXQgY29tcGlsZXIgb3B0aW9ucy5cbiAgY29uc3QgY29tcGlsZXJPcHRpb25zOiB0cy5Db21waWxlck9wdGlvbnMgPSB7XG4gICAgbm9FbWl0T25FcnJvcjogdXNlTGlicyxcbiAgICBhbGxvd0pzOiB0cnVlLFxuICAgIG5ld0xpbmU6IHRzLk5ld0xpbmVLaW5kLkxpbmVGZWVkLFxuICAgIG1vZHVsZVJlc29sdXRpb246IHRzLk1vZHVsZVJlc29sdXRpb25LaW5kLk5vZGUxMCxcbiAgICBtb2R1bGU6IHRzLk1vZHVsZUtpbmQuRVMyMDIwLFxuICAgIHRhcmdldDogdHMuU2NyaXB0VGFyZ2V0LkVTMjAyMCxcbiAgICBza2lwTGliQ2hlY2s6IHRydWUsXG4gICAgc291cmNlTWFwOiBmYWxzZSxcbiAgICBpbXBvcnRIZWxwZXJzOiB0cnVlLFxuICAgIGV4cGVyaW1lbnRhbERlY29yYXRvcnM6IHRydWUsXG4gICAgdHlwZXM6IFtdLFxuICAgIC4uLmV4dHJhQ29tcGlsZXJPcHRpb25zLFxuICB9O1xuXG4gIC8vIENyZWF0ZSBjb21waWxlciBob3N0LlxuICBjb25zdCBjb21waWxlckhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QoY29tcGlsZXJPcHRpb25zLCB0cnVlKTtcblxuICBjb25zdCBiYXNlRmlsZUV4aXN0cyA9IGNvbXBpbGVySG9zdC5maWxlRXhpc3RzO1xuICBjb21waWxlckhvc3QuZmlsZUV4aXN0cyA9IGZ1bmN0aW9uIChjb21waWxlckZpbGVOYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gKFxuICAgICAgY29tcGlsZXJGaWxlTmFtZSA9PT0gZmlsZU5hbWUgfHxcbiAgICAgICEhYWRkaXRpb25hbEZpbGVzPy5bYmFzZW5hbWUoY29tcGlsZXJGaWxlTmFtZSldIHx8XG4gICAgICBiYXNlRmlsZUV4aXN0cyhjb21waWxlckZpbGVOYW1lKVxuICAgICk7XG4gIH07XG5cbiAgY29uc3QgYmFzZVJlYWRGaWxlID0gY29tcGlsZXJIb3N0LnJlYWRGaWxlO1xuICBjb21waWxlckhvc3QucmVhZEZpbGUgPSBmdW5jdGlvbiAoY29tcGlsZXJGaWxlTmFtZTogc3RyaW5nKSB7XG4gICAgaWYgKGNvbXBpbGVyRmlsZU5hbWUgPT09IGZpbGVOYW1lKSB7XG4gICAgICByZXR1cm4gY29udGVudDtcbiAgICB9IGVsc2UgaWYgKGFkZGl0aW9uYWxGaWxlcz8uW2Jhc2VuYW1lKGNvbXBpbGVyRmlsZU5hbWUpXSkge1xuICAgICAgcmV0dXJuIGFkZGl0aW9uYWxGaWxlc1tiYXNlbmFtZShjb21waWxlckZpbGVOYW1lKV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBiYXNlUmVhZEZpbGUoY29tcGlsZXJGaWxlTmFtZSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIENyZWF0ZSB0aGUgVHlwZVNjcmlwdCBwcm9ncmFtLlxuICBjb25zdCBwcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShbZmlsZU5hbWVdLCBjb21waWxlck9wdGlvbnMsIGNvbXBpbGVySG9zdCk7XG5cbiAgcmV0dXJuIHsgY29tcGlsZXJIb3N0LCBwcm9ncmFtIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1UeXBlc2NyaXB0KFxuICBjb250ZW50OiBzdHJpbmcgfCB1bmRlZmluZWQsXG4gIHRyYW5zZm9ybWVyczogdHMuVHJhbnNmb3JtZXJGYWN0b3J5PHRzLlNvdXJjZUZpbGU+W10sXG4gIHByb2dyYW0/OiB0cy5Qcm9ncmFtLFxuICBjb21waWxlckhvc3Q/OiB0cy5Db21waWxlckhvc3QsXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAvLyBVc2UgZ2l2ZW4gY29udGV4dCBvciBjcmVhdGUgYSBuZXcgb25lLlxuICBpZiAoY29udGVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgdHlwZXNjcmlwdENvbnRleHQgPSBjcmVhdGVUeXBlc2NyaXB0Q29udGV4dChjb250ZW50KTtcbiAgICBpZiAoIXByb2dyYW0pIHtcbiAgICAgIHByb2dyYW0gPSB0eXBlc2NyaXB0Q29udGV4dC5wcm9ncmFtO1xuICAgIH1cbiAgICBpZiAoIWNvbXBpbGVySG9zdCkge1xuICAgICAgY29tcGlsZXJIb3N0ID0gdHlwZXNjcmlwdENvbnRleHQuY29tcGlsZXJIb3N0O1xuICAgIH1cbiAgfSBlbHNlIGlmICghcHJvZ3JhbSB8fCAhY29tcGlsZXJIb3N0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd0cmFuc2Zvcm1UeXBlc2NyaXB0IG5lZWRzIGVpdGhlciBgY29udGVudGAgb3IgYSBgcHJvZ3JhbWAgYW5kIGBjb21waWxlckhvc3QnKTtcbiAgfVxuXG4gIGNvbnN0IG91dHB1dEZpbGVOYW1lID0gYmFzZWZpbGVOYW1lLnJlcGxhY2UoL1xcLnRzeD8kLywgJy5qcycpO1xuICBsZXQgb3V0cHV0Q29udGVudDtcbiAgLy8gRW1pdC5cbiAgY29uc3QgeyBlbWl0U2tpcHBlZCwgZGlhZ25vc3RpY3MgfSA9IHByb2dyYW0uZW1pdChcbiAgICB1bmRlZmluZWQsXG4gICAgKGZpbGVuYW1lLCBkYXRhKSA9PiB7XG4gICAgICBpZiAoZmlsZW5hbWUgPT09IG91dHB1dEZpbGVOYW1lKSB7XG4gICAgICAgIG91dHB1dENvbnRlbnQgPSBkYXRhO1xuICAgICAgfVxuICAgIH0sXG4gICAgdW5kZWZpbmVkLFxuICAgIHVuZGVmaW5lZCxcbiAgICB7IGJlZm9yZTogdHJhbnNmb3JtZXJzIH0sXG4gICk7XG5cbiAgLy8gVGhyb3cgZXJyb3Igd2l0aCBkaWFnbm9zdGljcyBpZiBlbWl0IHdhc24ndCBzdWNjZXNzZnVsbC5cbiAgaWYgKGVtaXRTa2lwcGVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHRzLmZvcm1hdERpYWdub3N0aWNzKGRpYWdub3N0aWNzLCBjb21waWxlckhvc3QpKTtcbiAgfVxuXG4gIC8vIFJldHVybiB0aGUgdHJhbnNwaWxlZCBqcy5cbiAgcmV0dXJuIG91dHB1dENvbnRlbnQ7XG59XG4iXX0=