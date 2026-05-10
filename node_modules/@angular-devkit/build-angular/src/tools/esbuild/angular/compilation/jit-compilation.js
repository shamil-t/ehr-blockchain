"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _JitCompilation_state;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JitCompilation = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const typescript_1 = __importDefault(require("typescript"));
const profiling_1 = require("../../profiling");
const angular_host_1 = require("../angular-host");
const jit_resource_transformer_1 = require("../jit-resource-transformer");
const angular_compilation_1 = require("./angular-compilation");
class JitCompilationState {
    constructor(compilerHost, typeScriptProgram, constructorParametersDownlevelTransform, replaceResourcesTransform) {
        this.compilerHost = compilerHost;
        this.typeScriptProgram = typeScriptProgram;
        this.constructorParametersDownlevelTransform = constructorParametersDownlevelTransform;
        this.replaceResourcesTransform = replaceResourcesTransform;
    }
}
class JitCompilation extends angular_compilation_1.AngularCompilation {
    constructor() {
        super(...arguments);
        _JitCompilation_state.set(this, void 0);
    }
    async initialize(tsconfig, hostOptions, compilerOptionsTransformer) {
        // Dynamically load the Angular compiler CLI package
        const { constructorParametersDownlevelTransform } = await angular_compilation_1.AngularCompilation.loadCompilerCli();
        // Load the compiler configuration and transform as needed
        const { options: originalCompilerOptions, rootNames, errors: configurationDiagnostics, } = await this.loadConfiguration(tsconfig);
        const compilerOptions = compilerOptionsTransformer?.(originalCompilerOptions) ?? originalCompilerOptions;
        // Create Angular compiler host
        const host = (0, angular_host_1.createAngularCompilerHost)(compilerOptions, hostOptions);
        // Create the TypeScript Program
        const typeScriptProgram = (0, profiling_1.profileSync)('TS_CREATE_PROGRAM', () => typescript_1.default.createEmitAndSemanticDiagnosticsBuilderProgram(rootNames, compilerOptions, host, __classPrivateFieldGet(this, _JitCompilation_state, "f")?.typeScriptProgram ?? typescript_1.default.readBuilderProgram(compilerOptions, host), configurationDiagnostics));
        const affectedFiles = (0, profiling_1.profileSync)('TS_FIND_AFFECTED', () => findAffectedFiles(typeScriptProgram));
        __classPrivateFieldSet(this, _JitCompilation_state, new JitCompilationState(host, typeScriptProgram, constructorParametersDownlevelTransform(typeScriptProgram.getProgram()), (0, jit_resource_transformer_1.createJitResourceTransformer)(() => typeScriptProgram.getProgram().getTypeChecker())), "f");
        const referencedFiles = typeScriptProgram
            .getSourceFiles()
            .map((sourceFile) => sourceFile.fileName);
        return { affectedFiles, compilerOptions, referencedFiles };
    }
    *collectDiagnostics() {
        (0, node_assert_1.default)(__classPrivateFieldGet(this, _JitCompilation_state, "f"), 'Compilation must be initialized prior to collecting diagnostics.');
        const { typeScriptProgram } = __classPrivateFieldGet(this, _JitCompilation_state, "f");
        // Collect program level diagnostics
        yield* typeScriptProgram.getConfigFileParsingDiagnostics();
        yield* typeScriptProgram.getOptionsDiagnostics();
        yield* typeScriptProgram.getGlobalDiagnostics();
        yield* (0, profiling_1.profileSync)('NG_DIAGNOSTICS_SYNTACTIC', () => typeScriptProgram.getSyntacticDiagnostics());
        yield* (0, profiling_1.profileSync)('NG_DIAGNOSTICS_SEMANTIC', () => typeScriptProgram.getSemanticDiagnostics());
    }
    emitAffectedFiles() {
        (0, node_assert_1.default)(__classPrivateFieldGet(this, _JitCompilation_state, "f"), 'Compilation must be initialized prior to emitting files.');
        const { compilerHost, typeScriptProgram, constructorParametersDownlevelTransform, replaceResourcesTransform, } = __classPrivateFieldGet(this, _JitCompilation_state, "f");
        const buildInfoFilename = typeScriptProgram.getCompilerOptions().tsBuildInfoFile ?? '.tsbuildinfo';
        const emittedFiles = [];
        const writeFileCallback = (filename, contents, _a, _b, sourceFiles) => {
            if (!sourceFiles?.length && filename.endsWith(buildInfoFilename)) {
                // Save builder info contents to specified location
                compilerHost.writeFile(filename, contents, false);
                return;
            }
            (0, node_assert_1.default)(sourceFiles?.length === 1, 'Invalid TypeScript program emit for ' + filename);
            emittedFiles.push({ filename: sourceFiles[0].fileName, contents });
        };
        const transformers = {
            before: [replaceResourcesTransform, constructorParametersDownlevelTransform],
        };
        // TypeScript will loop until there are no more affected files in the program
        while (typeScriptProgram.emitNextAffectedFile(writeFileCallback, undefined, undefined, transformers)) {
            /* empty */
        }
        return emittedFiles;
    }
}
exports.JitCompilation = JitCompilation;
_JitCompilation_state = new WeakMap();
function findAffectedFiles(builder) {
    const affectedFiles = new Set();
    let result;
    while ((result = builder.getSemanticDiagnosticsOfNextAffectedFile())) {
        affectedFiles.add(result.affected);
    }
    return affectedFiles;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaml0LWNvbXBpbGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdG9vbHMvZXNidWlsZC9hbmd1bGFyL2NvbXBpbGF0aW9uL2ppdC1jb21waWxhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCw4REFBaUM7QUFDakMsNERBQTRCO0FBQzVCLCtDQUE4QztBQUM5QyxrREFBZ0Y7QUFDaEYsMEVBQTJFO0FBQzNFLCtEQUEyRTtBQUUzRSxNQUFNLG1CQUFtQjtJQUN2QixZQUNrQixZQUE2QixFQUM3QixpQkFBOEQsRUFDOUQsdUNBQTZFLEVBQzdFLHlCQUErRDtRQUgvRCxpQkFBWSxHQUFaLFlBQVksQ0FBaUI7UUFDN0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUE2QztRQUM5RCw0Q0FBdUMsR0FBdkMsdUNBQXVDLENBQXNDO1FBQzdFLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBc0M7SUFDOUUsQ0FBQztDQUNMO0FBRUQsTUFBYSxjQUFlLFNBQVEsd0NBQWtCO0lBQXREOztRQUNFLHdDQUE2QjtJQTBHL0IsQ0FBQztJQXhHQyxLQUFLLENBQUMsVUFBVSxDQUNkLFFBQWdCLEVBQ2hCLFdBQStCLEVBQy9CLDBCQUF3RjtRQU14RixvREFBb0Q7UUFDcEQsTUFBTSxFQUFFLHVDQUF1QyxFQUFFLEdBQUcsTUFBTSx3Q0FBa0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUUvRiwwREFBMEQ7UUFDMUQsTUFBTSxFQUNKLE9BQU8sRUFBRSx1QkFBdUIsRUFDaEMsU0FBUyxFQUNULE1BQU0sRUFBRSx3QkFBd0IsR0FDakMsR0FBRyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzQyxNQUFNLGVBQWUsR0FDbkIsMEJBQTBC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RUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBRWxELE9BQU87YUFDUjtZQUVELElBQUEscUJBQU0sRUFBQyxXQUFXLEVBQUUsTUFBTSxLQUFLLENBQUMsRUFBRSxzQ0FBc0MsR0FBRyxRQUFRLENBQUMsQ0FBQztZQUVyRixZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNyRSxDQUFDLENBQUM7UUFDRixNQUFNLFlBQVksR0FBRztZQUNuQixNQUFNLEVBQUUsQ0FBQyx5QkFBeUIsRUFBRSx1Q0FBdUMsQ0FBQztTQUM3RSxDQUFDO1FBRUYsNkVBQTZFO1FBQzdFLE9BQ0UsaUJBQWlCLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxZQUFZLENBQUMsRUFDN0Y7WUFDQSxXQUFXO1NBQ1o7UUFFRCxPQUFPLFlBQVksQ0FBQztJQUN0QixDQUFDO0NBQ0Y7QUEzR0Qsd0NBMkdDOztBQUVELFNBQVMsaUJBQWlCLENBQ3hCLE9BQW9EO0lBRXBELE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxFQUFpQixDQUFDO0lBRS9DLElBQUksTUFBTSxDQUFDO0lBQ1gsT0FBTyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsd0NBQXdDLEVBQUUsQ0FBQyxFQUFFO1FBQ3BFLGFBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQXlCLENBQUMsQ0FBQztLQUNyRDtJQUVELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgbmcgZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnbm9kZTphc3NlcnQnO1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgcHJvZmlsZVN5bmMgfSBmcm9tICcuLi8uLi9wcm9maWxpbmcnO1xuaW1wb3J0IHsgQW5ndWxhckhvc3RPcHRpb25zLCBjcmVhdGVBbmd1bGFyQ29tcGlsZXJIb3N0IH0gZnJvbSAnLi4vYW5ndWxhci1ob3N0JztcbmltcG9ydCB7IGNyZWF0ZUppdFJlc291cmNlVHJhbnNmb3JtZXIgfSBmcm9tICcuLi9qaXQtcmVzb3VyY2UtdHJhbnNmb3JtZXInO1xuaW1wb3J0IHsgQW5ndWxhckNvbXBpbGF0aW9uLCBFbWl0RmlsZVJlc3VsdCB9IGZyb20gJy4vYW5ndWxhci1jb21waWxhdGlvbic7XG5cbmNsYXNzIEppdENvbXBpbGF0aW9uU3RhdGUge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29tcGlsZXJIb3N0OiBuZy5Db21waWxlckhvc3QsXG4gICAgcHVibGljIHJlYWRvbmx5IHR5cGVTY3JpcHRQcm9ncmFtOiB0cy5FbWl0QW5kU2VtYW50aWNEaWFnbm9zdGljc0J1aWxkZXJQcm9ncmFtLFxuICAgIHB1YmxpYyByZWFkb25seSBjb25zdHJ1Y3RvclBhcmFtZXRlcnNEb3dubGV2ZWxUcmFuc2Zvcm06IHRzLlRyYW5zZm9ybWVyRmFjdG9yeTx0cy5Tb3VyY2VGaWxlPixcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVwbGFjZVJlc291cmNlc1RyYW5zZm9ybTogdHMuVHJhbnNmb3JtZXJGYWN0b3J5PHRzLlNvdXJjZUZpbGU+LFxuICApIHt9XG59XG5cbmV4cG9ydCBjbGFzcyBKaXRDb21waWxhdGlvbiBleHRlbmRzIEFuZ3VsYXJDb21waWxhdGlvbiB7XG4gICNzdGF0ZT86IEppdENvbXBpbGF0aW9uU3RhdGU7XG5cbiAgYXN5bmMgaW5pdGlhbGl6ZShcbiAgICB0c2NvbmZpZzogc3RyaW5nLFxuICAgIGhvc3RPcHRpb25zOiBBbmd1bGFySG9zdE9wdGlvbnMsXG4gICAgY29tcGlsZXJPcHRpb25zVHJhbnNmb3JtZXI/OiAoY29tcGlsZXJPcHRpb25zOiBuZy5Db21waWxlck9wdGlvbnMpID0+IG5nLkNvbXBpbGVyT3B0aW9ucyxcbiAgKTogUHJvbWlzZTx7XG4gICAgYWZmZWN0ZWRGaWxlczogUmVhZG9ubHlTZXQ8dHMuU291cmNlRmlsZT47XG4gICAgY29tcGlsZXJPcHRpb25zOiBuZy5Db21waWxlck9wdGlvbnM7XG4gICAgcmVmZXJlbmNlZEZpbGVzOiByZWFkb25seSBzdHJpbmdbXTtcbiAgfT4ge1xuICAgIC8vIER5bmFtaWNhbGx5IGxvYWQgdGhlIEFuZ3VsYXIgY29tcGlsZXIgQ0xJIHBhY2thZ2VcbiAgICBjb25zdCB7IGNvbnN0cnVjdG9yUGFyYW1ldGVyc0Rvd25sZXZlbFRyYW5zZm9ybSB9ID0gYXdhaXQgQW5ndWxhckNvbXBpbGF0aW9uLmxvYWRDb21waWxlckNsaSgpO1xuXG4gICAgLy8gTG9hZCB0aGUgY29tcGlsZXIgY29uZmlndXJhdGlvbiBhbmQgdHJhbnNmb3JtIGFzIG5lZWRlZFxuICAgIGNvbnN0IHtcbiAgICAgIG9wdGlvbnM6IG9yaWdpbmFsQ29tcGlsZXJPcHRpb25zLFxuICAgICAgcm9vdE5hbWVzLFxuICAgICAgZXJyb3JzOiBjb25maWd1cmF0aW9uRGlhZ25vc3RpY3MsXG4gICAgfSA9IGF3YWl0IHRoaXMubG9hZENvbmZpZ3VyYXRpb24odHNjb25maWcpO1xuICAgIGNvbnN0IGNvbXBpbGVyT3B0aW9ucyA9XG4gICAgICBjb21waWxlck9wdGlvbnNUcmFuc2Zvcm1lcj8uKG9yaWdpbmFsQ29tcGlsZXJPcHRpb25zKSA/PyBvcmlnaW5hbENvbXBpbGVyT3B0aW9ucztcblxuICAgIC8vIENyZWF0ZSBBbmd1bGFyIGNvbXBpbGVyIGhvc3RcbiAgICBjb25zdCBob3N0ID0gY3JlYXRlQW5ndWxhckNvbXBpbGVySG9zdChjb21waWxlck9wdGlvbnMsIGhvc3RPcHRpb25zKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgVHlwZVNjcmlwdCBQcm9ncmFtXG4gICAgY29uc3QgdHlwZVNjcmlwdFByb2dyYW0gPSBwcm9maWxlU3luYygnVFNfQ1JFQVRFX1BST0dSQU0nLCAoKSA9PlxuICAgICAgdHMuY3JlYXRlRW1pdEFuZFNlbWFudGljRGlhZ25vc3RpY3NCdWlsZGVyUHJvZ3JhbShcbiAgICAgICAgcm9vdE5hbWVzLFxuICAgICAgICBjb21waWxlck9wdGlvbnMsXG4gICAgICAgIGhvc3QsXG4gICAgICAgIHRoaXMuI3N0YXRlPy50eXBlU2NyaXB0UHJvZ3JhbSA/PyB0cy5yZWFkQnVpbGRlclByb2dyYW0oY29tcGlsZXJPcHRpb25zLCBob3N0KSxcbiAgICAgICAgY29uZmlndXJhdGlvbkRpYWdub3N0aWNzLFxuICAgICAgKSxcbiAgICApO1xuXG4gICAgY29uc3QgYWZmZWN0ZWRGaWxlcyA9IHByb2ZpbGVTeW5jKCdUU19GSU5EX0FGRkVDVEVEJywgKCkgPT5cbiAgICAgIGZpbmRBZmZlY3RlZEZpbGVzKHR5cGVTY3JpcHRQcm9ncmFtKSxcbiAgICApO1xuXG4gICAgdGhpcy4jc3RhdGUgPSBuZXcgSml0Q29tcGlsYXRpb25TdGF0ZShcbiAgICAgIGhvc3QsXG4gICAgICB0eXBlU2NyaXB0UHJvZ3JhbSxcbiAgICAgIGNvbnN0cnVjdG9yUGFyYW1ldGVyc0Rvd25sZXZlbFRyYW5zZm9ybSh0eXBlU2NyaXB0UHJvZ3JhbS5nZXRQcm9ncmFtKCkpLFxuICAgICAgY3JlYXRlSml0UmVzb3VyY2VUcmFuc2Zvcm1lcigoKSA9PiB0eXBlU2NyaXB0UHJvZ3JhbS5nZXRQcm9ncmFtKCkuZ2V0VHlwZUNoZWNrZXIoKSksXG4gICAgKTtcblxuICAgIGNvbnN0IHJlZmVyZW5jZWRGaWxlcyA9IHR5cGVTY3JpcHRQcm9ncmFtXG4gICAgICAuZ2V0U291cmNlRmlsZXMoKVxuICAgICAgLm1hcCgoc291cmNlRmlsZSkgPT4gc291cmNlRmlsZS5maWxlTmFtZSk7XG5cbiAgICByZXR1cm4geyBhZmZlY3RlZEZpbGVzLCBjb21waWxlck9wdGlvbnMsIHJlZmVyZW5jZWRGaWxlcyB9O1xuICB9XG5cbiAgKmNvbGxlY3REaWFnbm9zdGljcygpOiBJdGVyYWJsZTx0cy5EaWFnbm9zdGljPiB7XG4gICAgYXNzZXJ0KHRoaXMuI3N0YXRlLCAnQ29tcGlsYXRpb24gbXVzdCBiZSBpbml0aWFsaXplZCBwcmlvciB0byBjb2xsZWN0aW5nIGRpYWdub3N0aWNzLicpO1xuICAgIGNvbnN0IHsgdHlwZVNjcmlwdFByb2dyYW0gfSA9IHRoaXMuI3N0YXRlO1xuXG4gICAgLy8gQ29sbGVjdCBwcm9ncmFtIGxldmVsIGRpYWdub3N0aWNzXG4gICAgeWllbGQqIHR5cGVTY3JpcHRQcm9ncmFtLmdldENvbmZpZ0ZpbGVQYXJzaW5nRGlhZ25vc3RpY3MoKTtcbiAgICB5aWVsZCogdHlwZVNjcmlwdFByb2dyYW0uZ2V0T3B0aW9uc0RpYWdub3N0aWNzKCk7XG4gICAgeWllbGQqIHR5cGVTY3JpcHRQcm9ncmFtLmdldEdsb2JhbERpYWdub3N0aWNzKCk7XG4gICAgeWllbGQqIHByb2ZpbGVTeW5jKCdOR19ESUFHTk9TVElDU19TWU5UQUNUSUMnLCAoKSA9PlxuICAgICAgdHlwZVNjcmlwdFByb2dyYW0uZ2V0U3ludGFjdGljRGlhZ25vc3RpY3MoKSxcbiAgICApO1xuICAgIHlpZWxkKiBwcm9maWxlU3luYygnTkdfRElBR05PU1RJQ1NfU0VNQU5USUMnLCAoKSA9PiB0eXBlU2NyaXB0UHJvZ3JhbS5nZXRTZW1hbnRpY0RpYWdub3N0aWNzKCkpO1xuICB9XG5cbiAgZW1pdEFmZmVjdGVkRmlsZXMoKTogSXRlcmFibGU8RW1pdEZpbGVSZXN1bHQ+IHtcbiAgICBhc3NlcnQodGhpcy4jc3RhdGUsICdDb21waWxhdGlvbiBtdXN0IGJlIGluaXRpYWxpemVkIHByaW9yIHRvIGVtaXR0aW5nIGZpbGVzLicpO1xuICAgIGNvbnN0IHtcbiAgICAgIGNvbXBpbGVySG9zdCxcbiAgICAgIHR5cGVTY3JpcHRQcm9ncmFtLFxuICAgICAgY29uc3RydWN0b3JQYXJhbWV0ZXJzRG93bmxldmVsVHJhbnNmb3JtLFxuICAgICAgcmVwbGFjZVJlc291cmNlc1RyYW5zZm9ybSxcbiAgICB9ID0gdGhpcy4jc3RhdGU7XG4gICAgY29uc3QgYnVpbGRJbmZvRmlsZW5hbWUgPVxuICAgICAgdHlwZVNjcmlwdFByb2dyYW0uZ2V0Q29tcGlsZXJPcHRpb25zKCkudHNCdWlsZEluZm9GaWxlID8/ICcudHNidWlsZGluZm8nO1xuXG4gICAgY29uc3QgZW1pdHRlZEZpbGVzOiBFbWl0RmlsZVJlc3VsdFtdID0gW107XG4gICAgY29uc3Qgd3JpdGVGaWxlQ2FsbGJhY2s6IHRzLldyaXRlRmlsZUNhbGxiYWNrID0gKGZpbGVuYW1lLCBjb250ZW50cywgX2EsIF9iLCBzb3VyY2VGaWxlcykgPT4ge1xuICAgICAgaWYgKCFzb3VyY2VGaWxlcz8ubGVuZ3RoICYmIGZpbGVuYW1lLmVuZHNXaXRoKGJ1aWxkSW5mb0ZpbGVuYW1lKSkge1xuICAgICAgICAvLyBTYXZlIGJ1aWxkZXIgaW5mbyBjb250ZW50cyB0byBzcGVjaWZpZWQgbG9jYXRpb25cbiAgICAgICAgY29tcGlsZXJIb3N0LndyaXRlRmlsZShmaWxlbmFtZSwgY29udGVudHMsIGZhbHNlKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGFzc2VydChzb3VyY2VGaWxlcz8ubGVuZ3RoID09PSAxLCAnSW52YWxpZCBUeXBlU2NyaXB0IHByb2dyYW0gZW1pdCBmb3IgJyArIGZpbGVuYW1lKTtcblxuICAgICAgZW1pdHRlZEZpbGVzLnB1c2goeyBmaWxlbmFtZTogc291cmNlRmlsZXNbMF0uZmlsZU5hbWUsIGNvbnRlbnRzIH0pO1xuICAgIH07XG4gICAgY29uc3QgdHJhbnNmb3JtZXJzID0ge1xuICAgICAgYmVmb3JlOiBbcmVwbGFjZVJlc291cmNlc1RyYW5zZm9ybSwgY29uc3RydWN0b3JQYXJhbWV0ZXJzRG93bmxldmVsVHJhbnNmb3JtXSxcbiAgICB9O1xuXG4gICAgLy8gVHlwZVNjcmlwdCB3aWxsIGxvb3AgdW50aWwgdGhlcmUgYXJlIG5vIG1vcmUgYWZmZWN0ZWQgZmlsZXMgaW4gdGhlIHByb2dyYW1cbiAgICB3aGlsZSAoXG4gICAgICB0eXBlU2NyaXB0UHJvZ3JhbS5lbWl0TmV4dEFmZmVjdGVkRmlsZSh3cml0ZUZpbGVDYWxsYmFjaywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHRyYW5zZm9ybWVycylcbiAgICApIHtcbiAgICAgIC8qIGVtcHR5ICovXG4gICAgfVxuXG4gICAgcmV0dXJuIGVtaXR0ZWRGaWxlcztcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kQWZmZWN0ZWRGaWxlcyhcbiAgYnVpbGRlcjogdHMuRW1pdEFuZFNlbWFudGljRGlhZ25vc3RpY3NCdWlsZGVyUHJvZ3JhbSxcbik6IFNldDx0cy5Tb3VyY2VGaWxlPiB7XG4gIGNvbnN0IGFmZmVjdGVkRmlsZXMgPSBuZXcgU2V0PHRzLlNvdXJjZUZpbGU+KCk7XG5cbiAgbGV0IHJlc3VsdDtcbiAgd2hpbGUgKChyZXN1bHQgPSBidWlsZGVyLmdldFNlbWFudGljRGlhZ25vc3RpY3NPZk5leHRBZmZlY3RlZEZpbGUoKSkpIHtcbiAgICBhZmZlY3RlZEZpbGVzLmFkZChyZXN1bHQuYWZmZWN0ZWQgYXMgdHMuU291cmNlRmlsZSk7XG4gIH1cblxuICByZXR1cm4gYWZmZWN0ZWRGaWxlcztcbn1cbiJdfQ==