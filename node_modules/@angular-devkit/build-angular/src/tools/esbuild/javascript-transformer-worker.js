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
const core_1 = require("@babel/core");
const promises_1 = require("node:fs/promises");
const application_1 = __importStar(require("../../tools/babel/presets/application"));
const load_esm_1 = require("../../utils/load-esm");
async function transformJavaScript(request) {
    request.data ?? (request.data = await (0, promises_1.readFile)(request.filename, 'utf-8'));
    const transformedData = await transformWithBabel(request);
    return Buffer.from(transformedData, 'utf-8');
}
exports.default = transformJavaScript;
let linkerPluginCreator;
async function transformWithBabel({ filename, data, ...options }) {
    const shouldLink = !options.skipLinker && (await (0, application_1.requiresLinking)(filename, data));
    const useInputSourcemap = options.sourcemap &&
        (!!options.thirdPartySourcemaps || !/[\\/]node_modules[\\/]/.test(filename));
    // If no additional transformations are needed, return the data directly
    if (!options.advancedOptimizations && !shouldLink) {
        // Strip sourcemaps if they should not be used
        return useInputSourcemap ? data : data.replace(/^\/\/# sourceMappingURL=[^\r\n]*/gm, '');
    }
    // @angular/platform-server/init entry-point has side-effects.
    const safeAngularPackage = /[\\/]node_modules[\\/]@angular[\\/]/.test(filename) &&
        !/@angular[\\/]platform-server[\\/]f?esm2022[\\/]init/.test(filename);
    // Lazy load the linker plugin only when linking is required
    if (shouldLink) {
        linkerPluginCreator ?? (linkerPluginCreator = (await (0, load_esm_1.loadEsmModule)('@angular/compiler-cli/linker/babel')).createEs2015LinkerPlugin);
    }
    const result = await (0, core_1.transformAsync)(data, {
        filename,
        inputSourceMap: (useInputSourcemap ? undefined : false),
        sourceMaps: useInputSourcemap ? 'inline' : false,
        compact: false,
        configFile: false,
        babelrc: false,
        browserslistConfigFile: false,
        plugins: [],
        presets: [
            [
                application_1.default,
                {
                    angularLinker: linkerPluginCreator && {
                        shouldLink,
                        jitMode: options.jit,
                        linkerPluginCreator,
                    },
                    optimize: options.advancedOptimizations && {
                        pureTopLevel: safeAngularPackage,
                    },
                },
            ],
        ],
    });
    const outputCode = result?.code ?? data;
    // Strip sourcemaps if they should not be used.
    // Babel will keep the original comments even if sourcemaps are disabled.
    return useInputSourcemap
        ? outputCode
        : outputCode.replace(/^\/\/# sourceMappingURL=[^\r\n]*/gm, '');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamF2YXNjcmlwdC10cmFuc2Zvcm1lci13b3JrZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9lc2J1aWxkL2phdmFzY3JpcHQtdHJhbnNmb3JtZXItd29ya2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxzQ0FBNkM7QUFDN0MsK0NBQTRDO0FBQzVDLHFGQUFrRztBQUNsRyxtREFBcUQ7QUFZdEMsS0FBSyxVQUFVLG1CQUFtQixDQUMvQyxPQUFtQztJQUVuQyxPQUFPLENBQUMsSUFBSSxLQUFaLE9BQU8sQ0FBQyxJQUFJLEdBQUssTUFBTSxJQUFBLG1CQUFRLEVBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsRUFBQztJQUMzRCxNQUFNLGVBQWUsR0FBRyxNQUFNLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRTFELE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQVBELHNDQU9DO0FBRUQsSUFBSSxtQkFFUyxDQUFDO0FBRWQsS0FBSyxVQUFVLGtCQUFrQixDQUFDLEVBQ2hDLFFBQVEsRUFDUixJQUFJLEVBQ0osR0FBRyxPQUFPLEVBQ2lCO0lBQzNCLE1BQU0sVUFBVSxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsSUFBSSxDQUFDLE1BQU0sSUFBQSw2QkFBZSxFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2xGLE1BQU0saUJBQWlCLEdBQ3JCLE9BQU8sQ0FBQyxTQUFTO1FBQ2pCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBRS9FLHdFQUF3RTtJQUN4RSxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixJQUFJLENBQUMsVUFBVSxFQUFFO1FBQ2pELDhDQUE4QztRQUM5QyxPQUFPLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsb0NBQW9DLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDMUY7SUFFRCw4REFBOEQ7SUFDOUQsTUFBTSxrQkFBa0IsR0FDdEIscUNBQXFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUNwRCxDQUFDLHFEQUFxRCxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV4RSw0REFBNEQ7SUFDNUQsSUFBSSxVQUFVLEVBQUU7UUFDZCxtQkFBbUIsS0FBbkIsbUJBQW1CLEdBQUssQ0FDdEIsTUFBTSxJQUFBLHdCQUFhLEVBQ2pCLG9DQUFvQyxDQUNyQyxDQUNGLENBQUMsd0JBQXdCLEVBQUM7S0FDNUI7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEscUJBQWMsRUFBQyxJQUFJLEVBQUU7UUFDeEMsUUFBUTtRQUNSLGNBQWMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBYztRQUNwRSxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSztRQUNoRCxPQUFPLEVBQUUsS0FBSztRQUNkLFVBQVUsRUFBRSxLQUFLO1FBQ2pCLE9BQU8sRUFBRSxLQUFLO1FBQ2Qsc0JBQXNCLEVBQUUsS0FBSztRQUM3QixPQUFPLEVBQUUsRUFBRTtRQUNYLE9BQU8sRUFBRTtZQUNQO2dCQUNFLHFCQUF3QjtnQkFDeEI7b0JBQ0UsYUFBYSxFQUFFLG1CQUFtQixJQUFJO3dCQUNwQyxVQUFVO3dCQUNWLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRzt3QkFDcEIsbUJBQW1CO3FCQUNwQjtvQkFDRCxRQUFRLEVBQUUsT0FBTyxDQUFDLHFCQUFxQixJQUFJO3dCQUN6QyxZQUFZLEVBQUUsa0JBQWtCO3FCQUNqQztpQkFDRjthQUNGO1NBQ0Y7S0FDRixDQUFDLENBQUM7SUFFSCxNQUFNLFVBQVUsR0FBRyxNQUFNLEVBQUUsSUFBSSxJQUFJLElBQUksQ0FBQztJQUV4QywrQ0FBK0M7SUFDL0MseUVBQXlFO0lBQ3pFLE9BQU8saUJBQWlCO1FBQ3RCLENBQUMsQ0FBQyxVQUFVO1FBQ1osQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsb0NBQW9DLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDbkUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyB0cmFuc2Zvcm1Bc3luYyB9IGZyb20gJ0BiYWJlbC9jb3JlJztcbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgYW5ndWxhckFwcGxpY2F0aW9uUHJlc2V0LCB7IHJlcXVpcmVzTGlua2luZyB9IGZyb20gJy4uLy4uL3Rvb2xzL2JhYmVsL3ByZXNldHMvYXBwbGljYXRpb24nO1xuaW1wb3J0IHsgbG9hZEVzbU1vZHVsZSB9IGZyb20gJy4uLy4uL3V0aWxzL2xvYWQtZXNtJztcblxuaW50ZXJmYWNlIEphdmFTY3JpcHRUcmFuc2Zvcm1SZXF1ZXN0IHtcbiAgZmlsZW5hbWU6IHN0cmluZztcbiAgZGF0YTogc3RyaW5nO1xuICBzb3VyY2VtYXA6IGJvb2xlYW47XG4gIHRoaXJkUGFydHlTb3VyY2VtYXBzOiBib29sZWFuO1xuICBhZHZhbmNlZE9wdGltaXphdGlvbnM6IGJvb2xlYW47XG4gIHNraXBMaW5rZXI6IGJvb2xlYW47XG4gIGppdDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gdHJhbnNmb3JtSmF2YVNjcmlwdChcbiAgcmVxdWVzdDogSmF2YVNjcmlwdFRyYW5zZm9ybVJlcXVlc3QsXG4pOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgcmVxdWVzdC5kYXRhID8/PSBhd2FpdCByZWFkRmlsZShyZXF1ZXN0LmZpbGVuYW1lLCAndXRmLTgnKTtcbiAgY29uc3QgdHJhbnNmb3JtZWREYXRhID0gYXdhaXQgdHJhbnNmb3JtV2l0aEJhYmVsKHJlcXVlc3QpO1xuXG4gIHJldHVybiBCdWZmZXIuZnJvbSh0cmFuc2Zvcm1lZERhdGEsICd1dGYtOCcpO1xufVxuXG5sZXQgbGlua2VyUGx1Z2luQ3JlYXRvcjpcbiAgfCB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlci1jbGkvbGlua2VyL2JhYmVsJykuY3JlYXRlRXMyMDE1TGlua2VyUGx1Z2luXG4gIHwgdW5kZWZpbmVkO1xuXG5hc3luYyBmdW5jdGlvbiB0cmFuc2Zvcm1XaXRoQmFiZWwoe1xuICBmaWxlbmFtZSxcbiAgZGF0YSxcbiAgLi4ub3B0aW9uc1xufTogSmF2YVNjcmlwdFRyYW5zZm9ybVJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBzaG91bGRMaW5rID0gIW9wdGlvbnMuc2tpcExpbmtlciAmJiAoYXdhaXQgcmVxdWlyZXNMaW5raW5nKGZpbGVuYW1lLCBkYXRhKSk7XG4gIGNvbnN0IHVzZUlucHV0U291cmNlbWFwID1cbiAgICBvcHRpb25zLnNvdXJjZW1hcCAmJlxuICAgICghIW9wdGlvbnMudGhpcmRQYXJ0eVNvdXJjZW1hcHMgfHwgIS9bXFxcXC9dbm9kZV9tb2R1bGVzW1xcXFwvXS8udGVzdChmaWxlbmFtZSkpO1xuXG4gIC8vIElmIG5vIGFkZGl0aW9uYWwgdHJhbnNmb3JtYXRpb25zIGFyZSBuZWVkZWQsIHJldHVybiB0aGUgZGF0YSBkaXJlY3RseVxuICBpZiAoIW9wdGlvbnMuYWR2YW5jZWRPcHRpbWl6YXRpb25zICYmICFzaG91bGRMaW5rKSB7XG4gICAgLy8gU3RyaXAgc291cmNlbWFwcyBpZiB0aGV5IHNob3VsZCBub3QgYmUgdXNlZFxuICAgIHJldHVybiB1c2VJbnB1dFNvdXJjZW1hcCA/IGRhdGEgOiBkYXRhLnJlcGxhY2UoL15cXC9cXC8jIHNvdXJjZU1hcHBpbmdVUkw9W15cXHJcXG5dKi9nbSwgJycpO1xuICB9XG5cbiAgLy8gQGFuZ3VsYXIvcGxhdGZvcm0tc2VydmVyL2luaXQgZW50cnktcG9pbnQgaGFzIHNpZGUtZWZmZWN0cy5cbiAgY29uc3Qgc2FmZUFuZ3VsYXJQYWNrYWdlID1cbiAgICAvW1xcXFwvXW5vZGVfbW9kdWxlc1tcXFxcL11AYW5ndWxhcltcXFxcL10vLnRlc3QoZmlsZW5hbWUpICYmXG4gICAgIS9AYW5ndWxhcltcXFxcL11wbGF0Zm9ybS1zZXJ2ZXJbXFxcXC9dZj9lc20yMDIyW1xcXFwvXWluaXQvLnRlc3QoZmlsZW5hbWUpO1xuXG4gIC8vIExhenkgbG9hZCB0aGUgbGlua2VyIHBsdWdpbiBvbmx5IHdoZW4gbGlua2luZyBpcyByZXF1aXJlZFxuICBpZiAoc2hvdWxkTGluaykge1xuICAgIGxpbmtlclBsdWdpbkNyZWF0b3IgPz89IChcbiAgICAgIGF3YWl0IGxvYWRFc21Nb2R1bGU8dHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXItY2xpL2xpbmtlci9iYWJlbCcpPihcbiAgICAgICAgJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9saW5rZXIvYmFiZWwnLFxuICAgICAgKVxuICAgICkuY3JlYXRlRXMyMDE1TGlua2VyUGx1Z2luO1xuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdHJhbnNmb3JtQXN5bmMoZGF0YSwge1xuICAgIGZpbGVuYW1lLFxuICAgIGlucHV0U291cmNlTWFwOiAodXNlSW5wdXRTb3VyY2VtYXAgPyB1bmRlZmluZWQgOiBmYWxzZSkgYXMgdW5kZWZpbmVkLFxuICAgIHNvdXJjZU1hcHM6IHVzZUlucHV0U291cmNlbWFwID8gJ2lubGluZScgOiBmYWxzZSxcbiAgICBjb21wYWN0OiBmYWxzZSxcbiAgICBjb25maWdGaWxlOiBmYWxzZSxcbiAgICBiYWJlbHJjOiBmYWxzZSxcbiAgICBicm93c2Vyc2xpc3RDb25maWdGaWxlOiBmYWxzZSxcbiAgICBwbHVnaW5zOiBbXSxcbiAgICBwcmVzZXRzOiBbXG4gICAgICBbXG4gICAgICAgIGFuZ3VsYXJBcHBsaWNhdGlvblByZXNldCxcbiAgICAgICAge1xuICAgICAgICAgIGFuZ3VsYXJMaW5rZXI6IGxpbmtlclBsdWdpbkNyZWF0b3IgJiYge1xuICAgICAgICAgICAgc2hvdWxkTGluayxcbiAgICAgICAgICAgIGppdE1vZGU6IG9wdGlvbnMuaml0LFxuICAgICAgICAgICAgbGlua2VyUGx1Z2luQ3JlYXRvcixcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9wdGltaXplOiBvcHRpb25zLmFkdmFuY2VkT3B0aW1pemF0aW9ucyAmJiB7XG4gICAgICAgICAgICBwdXJlVG9wTGV2ZWw6IHNhZmVBbmd1bGFyUGFja2FnZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICBdLFxuICB9KTtcblxuICBjb25zdCBvdXRwdXRDb2RlID0gcmVzdWx0Py5jb2RlID8/IGRhdGE7XG5cbiAgLy8gU3RyaXAgc291cmNlbWFwcyBpZiB0aGV5IHNob3VsZCBub3QgYmUgdXNlZC5cbiAgLy8gQmFiZWwgd2lsbCBrZWVwIHRoZSBvcmlnaW5hbCBjb21tZW50cyBldmVuIGlmIHNvdXJjZW1hcHMgYXJlIGRpc2FibGVkLlxuICByZXR1cm4gdXNlSW5wdXRTb3VyY2VtYXBcbiAgICA/IG91dHB1dENvZGVcbiAgICA6IG91dHB1dENvZGUucmVwbGFjZSgvXlxcL1xcLyMgc291cmNlTWFwcGluZ1VSTD1bXlxcclxcbl0qL2dtLCAnJyk7XG59XG4iXX0=