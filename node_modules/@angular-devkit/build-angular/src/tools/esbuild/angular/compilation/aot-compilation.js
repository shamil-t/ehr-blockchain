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
var _AotCompilation_state;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AotCompilation = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const typescript_1 = __importDefault(require("typescript"));
const profiling_1 = require("../../profiling");
const angular_host_1 = require("../angular-host");
const angular_compilation_1 = require("./angular-compilation");
// Temporary deep import for transformer support
// TODO: Move these to a private exports location or move the implementation into this package.
const { mergeTransformers, replaceBootstrap } = require('@ngtools/webpack/src/ivy/transformation');
class AngularCompilationState {
    constructor(angularProgram, compilerHost, typeScriptProgram, affectedFiles, templateDiagnosticsOptimization, diagnosticCache = new WeakMap()) {
        this.angularProgram = angularProgram;
        this.compilerHost = compilerHost;
        this.typeScriptProgram = typeScriptProgram;
        this.affectedFiles = affectedFiles;
        this.templateDiagnosticsOptimization = templateDiagnosticsOptimization;
        this.diagnosticCache = diagnosticCache;
    }
    get angularCompiler() {
        return this.angularProgram.compiler;
    }
}
class AotCompilation extends angular_compilation_1.AngularCompilation {
    constructor() {
        super(...arguments);
        _AotCompilation_state.set(this, void 0);
    }
    async initialize(tsconfig, hostOptions, compilerOptionsTransformer) {
        // Dynamically load the Angular compiler CLI package
        const { NgtscProgram, OptimizeFor } = await angular_compilation_1.AngularCompilation.loadCompilerCli();
        // Load the compiler configuration and transform as needed
        const { options: originalCompilerOptions, rootNames, errors: configurationDiagnostics, } = await this.loadConfiguration(tsconfig);
        const compilerOptions = compilerOptionsTransformer?.(originalCompilerOptions) ?? originalCompilerOptions;
        // Create Angular compiler host
        const host = (0, angular_host_1.createAngularCompilerHost)(compilerOptions, hostOptions);
        // Create the Angular specific program that contains the Angular compiler
        const angularProgram = (0, profiling_1.profileSync)('NG_CREATE_PROGRAM', () => new NgtscProgram(rootNames, compilerOptions, host, __classPrivateFieldGet(this, _AotCompilation_state, "f")?.angularProgram));
        const angularCompiler = angularProgram.compiler;
        const angularTypeScriptProgram = angularProgram.getTsProgram();
        (0, angular_host_1.ensureSourceFileVersions)(angularTypeScriptProgram);
        let oldProgram = __classPrivateFieldGet(this, _AotCompilation_state, "f")?.typeScriptProgram;
        let usingBuildInfo = false;
        if (!oldProgram) {
            oldProgram = typescript_1.default.readBuilderProgram(compilerOptions, host);
            usingBuildInfo = true;
        }
        const typeScriptProgram = typescript_1.default.createEmitAndSemanticDiagnosticsBuilderProgram(angularTypeScriptProgram, host, oldProgram, configurationDiagnostics);
        await (0, profiling_1.profileAsync)('NG_ANALYZE_PROGRAM', () => angularCompiler.analyzeAsync());
        const affectedFiles = (0, profiling_1.profileSync)('NG_FIND_AFFECTED', () => findAffectedFiles(typeScriptProgram, angularCompiler, usingBuildInfo));
        __classPrivateFieldSet(this, _AotCompilation_state, new AngularCompilationState(angularProgram, host, typeScriptProgram, affectedFiles, affectedFiles.size === 1 ? OptimizeFor.SingleFile : OptimizeFor.WholeProgram, __classPrivateFieldGet(this, _AotCompilation_state, "f")?.diagnosticCache), "f");
        const referencedFiles = typeScriptProgram
            .getSourceFiles()
            .filter((sourceFile) => !angularCompiler.ignoreForEmit.has(sourceFile))
            .flatMap((sourceFile) => [
            sourceFile.fileName,
            ...angularCompiler.getResourceDependencies(sourceFile),
        ]);
        return { affectedFiles, compilerOptions, referencedFiles };
    }
    *collectDiagnostics() {
        (0, node_assert_1.default)(__classPrivateFieldGet(this, _AotCompilation_state, "f"), 'Angular compilation must be initialized prior to collecting diagnostics.');
        const { affectedFiles, angularCompiler, diagnosticCache, templateDiagnosticsOptimization, typeScriptProgram, } = __classPrivateFieldGet(this, _AotCompilation_state, "f");
        // Collect program level diagnostics
        yield* typeScriptProgram.getConfigFileParsingDiagnostics();
        yield* angularCompiler.getOptionDiagnostics();
        yield* typeScriptProgram.getOptionsDiagnostics();
        yield* typeScriptProgram.getGlobalDiagnostics();
        // Collect source file specific diagnostics
        for (const sourceFile of typeScriptProgram.getSourceFiles()) {
            if (angularCompiler.ignoreForDiagnostics.has(sourceFile)) {
                continue;
            }
            // TypeScript will use cached diagnostics for files that have not been
            // changed or affected for this build when using incremental building.
            yield* (0, profiling_1.profileSync)('NG_DIAGNOSTICS_SYNTACTIC', () => typeScriptProgram.getSyntacticDiagnostics(sourceFile), true);
            yield* (0, profiling_1.profileSync)('NG_DIAGNOSTICS_SEMANTIC', () => typeScriptProgram.getSemanticDiagnostics(sourceFile), true);
            // Declaration files cannot have template diagnostics
            if (sourceFile.isDeclarationFile) {
                continue;
            }
            // Only request Angular template diagnostics for affected files to avoid
            // overhead of template diagnostics for unchanged files.
            if (affectedFiles.has(sourceFile)) {
                const angularDiagnostics = (0, profiling_1.profileSync)('NG_DIAGNOSTICS_TEMPLATE', () => angularCompiler.getDiagnosticsForFile(sourceFile, templateDiagnosticsOptimization), true);
                diagnosticCache.set(sourceFile, angularDiagnostics);
                yield* angularDiagnostics;
            }
            else {
                const angularDiagnostics = diagnosticCache.get(sourceFile);
                if (angularDiagnostics) {
                    yield* angularDiagnostics;
                }
            }
        }
    }
    emitAffectedFiles() {
        (0, node_assert_1.default)(__classPrivateFieldGet(this, _AotCompilation_state, "f"), 'Angular compilation must be initialized prior to emitting files.');
        const { angularCompiler, compilerHost, typeScriptProgram } = __classPrivateFieldGet(this, _AotCompilation_state, "f");
        const buildInfoFilename = typeScriptProgram.getCompilerOptions().tsBuildInfoFile ?? '.tsbuildinfo';
        const emittedFiles = new Map();
        const writeFileCallback = (filename, contents, _a, _b, sourceFiles) => {
            if (!sourceFiles?.length && filename.endsWith(buildInfoFilename)) {
                // Save builder info contents to specified location
                compilerHost.writeFile(filename, contents, false);
                return;
            }
            (0, node_assert_1.default)(sourceFiles?.length === 1, 'Invalid TypeScript program emit for ' + filename);
            const sourceFile = sourceFiles[0];
            if (angularCompiler.ignoreForEmit.has(sourceFile)) {
                return;
            }
            angularCompiler.incrementalCompilation.recordSuccessfulEmit(sourceFile);
            emittedFiles.set(sourceFile, { filename: sourceFile.fileName, contents });
        };
        const transformers = mergeTransformers(angularCompiler.prepareEmit().transformers, {
            before: [replaceBootstrap(() => typeScriptProgram.getProgram().getTypeChecker())],
        });
        // TypeScript will loop until there are no more affected files in the program
        while (typeScriptProgram.emitNextAffectedFile(writeFileCallback, undefined, undefined, transformers)) {
            /* empty */
        }
        // Angular may have files that must be emitted but TypeScript does not consider affected
        for (const sourceFile of typeScriptProgram.getSourceFiles()) {
            if (emittedFiles.has(sourceFile) || angularCompiler.ignoreForEmit.has(sourceFile)) {
                continue;
            }
            if (sourceFile.isDeclarationFile) {
                continue;
            }
            if (angularCompiler.incrementalCompilation.safeToSkipEmit(sourceFile)) {
                continue;
            }
            typeScriptProgram.emit(sourceFile, writeFileCallback, undefined, undefined, transformers);
        }
        return emittedFiles.values();
    }
}
exports.AotCompilation = AotCompilation;
_AotCompilation_state = new WeakMap();
function findAffectedFiles(builder, { ignoreForDiagnostics }, includeTTC) {
    const affectedFiles = new Set();
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const result = builder.getSemanticDiagnosticsOfNextAffectedFile(undefined, (sourceFile) => {
            // If the affected file is a TTC shim, add the shim's original source file.
            // This ensures that changes that affect TTC are typechecked even when the changes
            // are otherwise unrelated from a TS perspective and do not result in Ivy codegen changes.
            // For example, changing @Input property types of a directive used in another component's
            // template.
            // A TTC shim is a file that has been ignored for diagnostics and has a filename ending in `.ngtypecheck.ts`.
            if (ignoreForDiagnostics.has(sourceFile) && sourceFile.fileName.endsWith('.ngtypecheck.ts')) {
                // This file name conversion relies on internal compiler logic and should be converted
                // to an official method when available. 15 is length of `.ngtypecheck.ts`
                const originalFilename = sourceFile.fileName.slice(0, -15) + '.ts';
                const originalSourceFile = builder.getSourceFile(originalFilename);
                if (originalSourceFile) {
                    affectedFiles.add(originalSourceFile);
                }
                return true;
            }
            return false;
        });
        if (!result) {
            break;
        }
        affectedFiles.add(result.affected);
    }
    // Add all files with associated template type checking files.
    // Stored TS build info does not have knowledge of the AOT compiler or the typechecking state of the templates.
    // To ensure that errors are reported correctly, all AOT component diagnostics need to be analyzed even if build
    // info is present.
    if (includeTTC) {
        for (const sourceFile of builder.getSourceFiles()) {
            if (ignoreForDiagnostics.has(sourceFile) && sourceFile.fileName.endsWith('.ngtypecheck.ts')) {
                // This file name conversion relies on internal compiler logic and should be converted
                // to an official method when available. 15 is length of `.ngtypecheck.ts`
                const originalFilename = sourceFile.fileName.slice(0, -15) + '.ts';
                const originalSourceFile = builder.getSourceFile(originalFilename);
                if (originalSourceFile) {
                    affectedFiles.add(originalSourceFile);
                }
            }
        }
    }
    return affectedFiles;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW90LWNvbXBpbGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdG9vbHMvZXNidWlsZC9hbmd1bGFyL2NvbXBpbGF0aW9uL2FvdC1jb21waWxhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCw4REFBaUM7QUFDakMsNERBQTRCO0FBQzVCLCtDQUE0RDtBQUM1RCxrREFJeUI7QUFDekIsK0RBQTJFO0FBRTNFLGdEQUFnRDtBQUNoRCwrRkFBK0Y7QUFDL0YsTUFBTSxFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLEdBQUcsT0FBTyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7QUFFbkcsTUFBTSx1QkFBdUI7SUFDM0IsWUFDa0IsY0FBK0IsRUFDL0IsWUFBNkIsRUFDN0IsaUJBQThELEVBQzlELGFBQXlDLEVBQ3pDLCtCQUErQyxFQUMvQyxrQkFBa0IsSUFBSSxPQUFPLEVBQWtDO1FBTC9ELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtRQUMvQixpQkFBWSxHQUFaLFlBQVksQ0FBaUI7UUFDN0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUE2QztRQUM5RCxrQkFBYSxHQUFiLGFBQWEsQ0FBNEI7UUFDekMsb0NBQStCLEdBQS9CLCtCQUErQixDQUFnQjtRQUMvQyxvQkFBZSxHQUFmLGVBQWUsQ0FBZ0Q7SUFDOUUsQ0FBQztJQUVKLElBQUksZUFBZTtRQUNqQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDO0lBQ3RDLENBQUM7Q0FDRjtBQUVELE1BQWEsY0FBZSxTQUFRLHdDQUFrQjtJQUF0RDs7UUFDRSx3Q0FBaUM7SUEyTG5DLENBQUM7SUF6TEMsS0FBSyxDQUFDLFVBQVUsQ0FDZCxRQUFnQixFQUNoQixXQUErQixFQUMvQiww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QXlCLENBQUMsQ0FBQztLQUNyRDtJQUVELDhEQUE4RDtJQUM5RCwrR0FBK0c7SUFDL0csZ0hBQWdIO0lBQ2hILG1CQUFtQjtJQUNuQixJQUFJLFVBQVUsRUFBRTtRQUNkLEtBQUssTUFBTSxVQUFVLElBQUksT0FBTyxDQUFDLGNBQWMsRUFBRSxFQUFFO1lBQ2pELElBQUksb0JBQW9CLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7Z0JBQzNGLHNGQUFzRjtnQkFDdEYsMEVBQTBFO2dCQUMxRSxNQUFNLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDbkUsTUFBTSxrQkFBa0IsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQ25FLElBQUksa0JBQWtCLEVBQUU7b0JBQ3RCLGFBQWEsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztpQkFDdkM7YUFDRjtTQUNGO0tBQ0Y7SUFFRCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIG5nIGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaSc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ25vZGU6YXNzZXJ0JztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7IHByb2ZpbGVBc3luYywgcHJvZmlsZVN5bmMgfSBmcm9tICcuLi8uLi9wcm9maWxpbmcnO1xuaW1wb3J0IHtcbiAgQW5ndWxhckhvc3RPcHRpb25zLFxuICBjcmVhdGVBbmd1bGFyQ29tcGlsZXJIb3N0LFxuICBlbnN1cmVTb3VyY2VGaWxlVmVyc2lvbnMsXG59IGZyb20gJy4uL2FuZ3VsYXItaG9zdCc7XG5pbXBvcnQgeyBBbmd1bGFyQ29tcGlsYXRpb24sIEVtaXRGaWxlUmVzdWx0IH0gZnJvbSAnLi9hbmd1bGFyLWNvbXBpbGF0aW9uJztcblxuLy8gVGVtcG9yYXJ5IGRlZXAgaW1wb3J0IGZvciB0cmFuc2Zvcm1lciBzdXBwb3J0XG4vLyBUT0RPOiBNb3ZlIHRoZXNlIHRvIGEgcHJpdmF0ZSBleHBvcnRzIGxvY2F0aW9uIG9yIG1vdmUgdGhlIGltcGxlbWVudGF0aW9uIGludG8gdGhpcyBwYWNrYWdlLlxuY29uc3QgeyBtZXJnZVRyYW5zZm9ybWVycywgcmVwbGFjZUJvb3RzdHJhcCB9ID0gcmVxdWlyZSgnQG5ndG9vbHMvd2VicGFjay9zcmMvaXZ5L3RyYW5zZm9ybWF0aW9uJyk7XG5cbmNsYXNzIEFuZ3VsYXJDb21waWxhdGlvblN0YXRlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHJlYWRvbmx5IGFuZ3VsYXJQcm9ncmFtOiBuZy5OZ3RzY1Byb2dyYW0sXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbXBpbGVySG9zdDogbmcuQ29tcGlsZXJIb3N0LFxuICAgIHB1YmxpYyByZWFkb25seSB0eXBlU2NyaXB0UHJvZ3JhbTogdHMuRW1pdEFuZFNlbWFudGljRGlhZ25vc3RpY3NCdWlsZGVyUHJvZ3JhbSxcbiAgICBwdWJsaWMgcmVhZG9ubHkgYWZmZWN0ZWRGaWxlczogUmVhZG9ubHlTZXQ8dHMuU291cmNlRmlsZT4sXG4gICAgcHVibGljIHJlYWRvbmx5IHRlbXBsYXRlRGlhZ25vc3RpY3NPcHRpbWl6YXRpb246IG5nLk9wdGltaXplRm9yLFxuICAgIHB1YmxpYyByZWFkb25seSBkaWFnbm9zdGljQ2FjaGUgPSBuZXcgV2Vha01hcDx0cy5Tb3VyY2VGaWxlLCB0cy5EaWFnbm9zdGljW10+KCksXG4gICkge31cblxuICBnZXQgYW5ndWxhckNvbXBpbGVyKCkge1xuICAgIHJldHVybiB0aGlzLmFuZ3VsYXJQcm9ncmFtLmNvbXBpbGVyO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBb3RDb21waWxhdGlvbiBleHRlbmRzIEFuZ3VsYXJDb21waWxhdGlvbiB7XG4gICNzdGF0ZT86IEFuZ3VsYXJDb21waWxhdGlvblN0YXRlO1xuXG4gIGFzeW5jIGluaXRpYWxpemUoXG4gICAgdHNjb25maWc6IHN0cmluZyxcbiAgICBob3N0T3B0aW9uczogQW5ndWxhckhvc3RPcHRpb25zLFxuICAgIGNvbXBpbGVyT3B0aW9uc1RyYW5zZm9ybWVyPzogKGNvbXBpbGVyT3B0aW9uczogbmcuQ29tcGlsZXJPcHRpb25zKSA9PiBuZy5Db21waWxlck9wdGlvbnMsXG4gICk6IFByb21pc2U8e1xuICAgIGFmZmVjdGVkRmlsZXM6IFJlYWRvbmx5U2V0PHRzLlNvdXJjZUZpbGU+O1xuICAgIGNvbXBpbGVyT3B0aW9uczogbmcuQ29tcGlsZXJPcHRpb25zO1xuICAgIHJlZmVyZW5jZWRGaWxlczogcmVhZG9ubHkgc3RyaW5nW107XG4gIH0+IHtcbiAgICAvLyBEeW5hbWljYWxseSBsb2FkIHRoZSBBbmd1bGFyIGNvbXBpbGVyIENMSSBwYWNrYWdlXG4gICAgY29uc3QgeyBOZ3RzY1Byb2dyYW0sIE9wdGltaXplRm9yIH0gPSBhd2FpdCBBbmd1bGFyQ29tcGlsYXRpb24ubG9hZENvbXBpbGVyQ2xpKCk7XG5cbiAgICAvLyBMb2FkIHRoZSBjb21waWxlciBjb25maWd1cmF0aW9uIGFuZCB0cmFuc2Zvcm0gYXMgbmVlZGVkXG4gICAgY29uc3Qge1xuICAgICAgb3B0aW9uczogb3JpZ2luYWxDb21waWxlck9wdGlvbnMsXG4gICAgICByb290TmFtZXMsXG4gICAgICBlcnJvcnM6IGNvbmZpZ3VyYXRpb25EaWFnbm9zdGljcyxcbiAgICB9ID0gYXdhaXQgdGhpcy5sb2FkQ29uZmlndXJhdGlvbih0c2NvbmZpZyk7XG4gICAgY29uc3QgY29tcGlsZXJPcHRpb25zID1cbiAgICAgIGNvbXBpbGVyT3B0aW9uc1RyYW5zZm9ybWVyPy4ob3JpZ2luYWxDb21waWxlck9wdGlvbnMpID8/IG9yaWdpbmFsQ29tcGlsZXJPcHRpb25zO1xuXG4gICAgLy8gQ3JlYXRlIEFuZ3VsYXIgY29tcGlsZXIgaG9zdFxuICAgIGNvbnN0IGhvc3QgPSBjcmVhdGVBbmd1bGFyQ29tcGlsZXJIb3N0KGNvbXBpbGVyT3B0aW9ucywgaG9zdE9wdGlvbnMpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBBbmd1bGFyIHNwZWNpZmljIHByb2dyYW0gdGhhdCBjb250YWlucyB0aGUgQW5ndWxhciBjb21waWxlclxuICAgIGNvbnN0IGFuZ3VsYXJQcm9ncmFtID0gcHJvZmlsZVN5bmMoXG4gICAgICAnTkdfQ1JFQVRFX1BST0dSQU0nLFxuICAgICAgKCkgPT4gbmV3IE5ndHNjUHJvZ3JhbShyb290TmFtZXMsIGNvbXBpbGVyT3B0aW9ucywgaG9zdCwgdGhpcy4jc3RhdGU/LmFuZ3VsYXJQcm9ncmFtKSxcbiAgICApO1xuICAgIGNvbnN0IGFuZ3VsYXJDb21waWxlciA9IGFuZ3VsYXJQcm9ncmFtLmNvbXBpbGVyO1xuICAgIGNvbnN0IGFuZ3VsYXJUeXBlU2NyaXB0UHJvZ3JhbSA9IGFuZ3VsYXJQcm9ncmFtLmdldFRzUHJvZ3JhbSgpO1xuICAgIGVuc3VyZVNvdXJjZUZpbGVWZXJzaW9ucyhhbmd1bGFyVHlwZVNjcmlwdFByb2dyYW0pO1xuXG4gICAgbGV0IG9sZFByb2dyYW0gPSB0aGlzLiNzdGF0ZT8udHlwZVNjcmlwdFByb2dyYW07XG4gICAgbGV0IHVzaW5nQnVpbGRJbmZvID0gZmFsc2U7XG4gICAgaWYgKCFvbGRQcm9ncmFtKSB7XG4gICAgICBvbGRQcm9ncmFtID0gdHMucmVhZEJ1aWxkZXJQcm9ncmFtKGNvbXBpbGVyT3B0aW9ucywgaG9zdCk7XG4gICAgICB1c2luZ0J1aWxkSW5mbyA9IHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgdHlwZVNjcmlwdFByb2dyYW0gPSB0cy5jcmVhdGVFbWl0QW5kU2VtYW50aWNEaWFnbm9zdGljc0J1aWxkZXJQcm9ncmFtKFxuICAgICAgYW5ndWxhclR5cGVTY3JpcHRQcm9ncmFtLFxuICAgICAgaG9zdCxcbiAgICAgIG9sZFByb2dyYW0sXG4gICAgICBjb25maWd1cmF0aW9uRGlhZ25vc3RpY3MsXG4gICAgKTtcblxuICAgIGF3YWl0IHByb2ZpbGVBc3luYygnTkdfQU5BTFlaRV9QUk9HUkFNJywgKCkgPT4gYW5ndWxhckNvbXBpbGVyLmFuYWx5emVBc3luYygpKTtcbiAgICBjb25zdCBhZmZlY3RlZEZpbGVzID0gcHJvZmlsZVN5bmMoJ05HX0ZJTkRfQUZGRUNURUQnLCAoKSA9PlxuICAgICAgZmluZEFmZmVjdGVkRmlsZXModHlwZVNjcmlwdFByb2dyYW0sIGFuZ3VsYXJDb21waWxlciwgdXNpbmdCdWlsZEluZm8pLFxuICAgICk7XG5cbiAgICB0aGlzLiNzdGF0ZSA9IG5ldyBBbmd1bGFyQ29tcGlsYXRpb25TdGF0ZShcbiAgICAgIGFuZ3VsYXJQcm9ncmFtLFxuICAgICAgaG9zdCxcbiAgICAgIHR5cGVTY3JpcHRQcm9ncmFtLFxuICAgICAgYWZmZWN0ZWRGaWxlcyxcbiAgICAgIGFmZmVjdGVkRmlsZXMuc2l6ZSA9PT0gMSA/IE9wdGltaXplRm9yLlNpbmdsZUZpbGUgOiBPcHRpbWl6ZUZvci5XaG9sZVByb2dyYW0sXG4gICAgICB0aGlzLiNzdGF0ZT8uZGlhZ25vc3RpY0NhY2hlLFxuICAgICk7XG5cbiAgICBjb25zdCByZWZlcmVuY2VkRmlsZXMgPSB0eXBlU2NyaXB0UHJvZ3JhbVxuICAgICAgLmdldFNvdXJjZUZpbGVzKClcbiAgICAgIC5maWx0ZXIoKHNvdXJjZUZpbGUpID0+ICFhbmd1bGFyQ29tcGlsZXIuaWdub3JlRm9yRW1pdC5oYXMoc291cmNlRmlsZSkpXG4gICAgICAuZmxhdE1hcCgoc291cmNlRmlsZSkgPT4gW1xuICAgICAgICBzb3VyY2VGaWxlLmZpbGVOYW1lLFxuICAgICAgICAuLi5hbmd1bGFyQ29tcGlsZXIuZ2V0UmVzb3VyY2VEZXBlbmRlbmNpZXMoc291cmNlRmlsZSksXG4gICAgICBdKTtcblxuICAgIHJldHVybiB7IGFmZmVjdGVkRmlsZXMsIGNvbXBpbGVyT3B0aW9ucywgcmVmZXJlbmNlZEZpbGVzIH07XG4gIH1cblxuICAqY29sbGVjdERpYWdub3N0aWNzKCk6IEl0ZXJhYmxlPHRzLkRpYWdub3N0aWM+IHtcbiAgICBhc3NlcnQodGhpcy4jc3RhdGUsICdBbmd1bGFyIGNvbXBpbGF0aW9uIG11c3QgYmUgaW5pdGlhbGl6ZWQgcHJpb3IgdG8gY29sbGVjdGluZyBkaWFnbm9zdGljcy4nKTtcbiAgICBjb25zdCB7XG4gICAgICBhZmZlY3RlZEZpbGVzLFxuICAgICAgYW5ndWxhckNvbXBpbGVyLFxuICAgICAgZGlhZ25vc3RpY0NhY2hlLFxuICAgICAgdGVtcGxhdGVEaWFnbm9zdGljc09wdGltaXphdGlvbixcbiAgICAgIHR5cGVTY3JpcHRQcm9ncmFtLFxuICAgIH0gPSB0aGlzLiNzdGF0ZTtcblxuICAgIC8vIENvbGxlY3QgcHJvZ3JhbSBsZXZlbCBkaWFnbm9zdGljc1xuICAgIHlpZWxkKiB0eXBlU2NyaXB0UHJvZ3JhbS5nZXRDb25maWdGaWxlUGFyc2luZ0RpYWdub3N0aWNzKCk7XG4gICAgeWllbGQqIGFuZ3VsYXJDb21waWxlci5nZXRPcHRpb25EaWFnbm9zdGljcygpO1xuICAgIHlpZWxkKiB0eXBlU2NyaXB0UHJvZ3JhbS5nZXRPcHRpb25zRGlhZ25vc3RpY3MoKTtcbiAgICB5aWVsZCogdHlwZVNjcmlwdFByb2dyYW0uZ2V0R2xvYmFsRGlhZ25vc3RpY3MoKTtcblxuICAgIC8vIENvbGxlY3Qgc291cmNlIGZpbGUgc3BlY2lmaWMgZGlhZ25vc3RpY3NcbiAgICBmb3IgKGNvbnN0IHNvdXJjZUZpbGUgb2YgdHlwZVNjcmlwdFByb2dyYW0uZ2V0U291cmNlRmlsZXMoKSkge1xuICAgICAgaWYgKGFuZ3VsYXJDb21waWxlci5pZ25vcmVGb3JEaWFnbm9zdGljcy5oYXMoc291cmNlRmlsZSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFR5cGVTY3JpcHQgd2lsbCB1c2UgY2FjaGVkIGRpYWdub3N0aWNzIGZvciBmaWxlcyB0aGF0IGhhdmUgbm90IGJlZW5cbiAgICAgIC8vIGNoYW5nZWQgb3IgYWZmZWN0ZWQgZm9yIHRoaXMgYnVpbGQgd2hlbiB1c2luZyBpbmNyZW1lbnRhbCBidWlsZGluZy5cbiAgICAgIHlpZWxkKiBwcm9maWxlU3luYyhcbiAgICAgICAgJ05HX0RJQUdOT1NUSUNTX1NZTlRBQ1RJQycsXG4gICAgICAgICgpID0+IHR5cGVTY3JpcHRQcm9ncmFtLmdldFN5bnRhY3RpY0RpYWdub3N0aWNzKHNvdXJjZUZpbGUpLFxuICAgICAgICB0cnVlLFxuICAgICAgKTtcbiAgICAgIHlpZWxkKiBwcm9maWxlU3luYyhcbiAgICAgICAgJ05HX0RJQUdOT1NUSUNTX1NFTUFOVElDJyxcbiAgICAgICAgKCkgPT4gdHlwZVNjcmlwdFByb2dyYW0uZ2V0U2VtYW50aWNEaWFnbm9zdGljcyhzb3VyY2VGaWxlKSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICk7XG5cbiAgICAgIC8vIERlY2xhcmF0aW9uIGZpbGVzIGNhbm5vdCBoYXZlIHRlbXBsYXRlIGRpYWdub3N0aWNzXG4gICAgICBpZiAoc291cmNlRmlsZS5pc0RlY2xhcmF0aW9uRmlsZSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gT25seSByZXF1ZXN0IEFuZ3VsYXIgdGVtcGxhdGUgZGlhZ25vc3RpY3MgZm9yIGFmZmVjdGVkIGZpbGVzIHRvIGF2b2lkXG4gICAgICAvLyBvdmVyaGVhZCBvZiB0ZW1wbGF0ZSBkaWFnbm9zdGljcyBmb3IgdW5jaGFuZ2VkIGZpbGVzLlxuICAgICAgaWYgKGFmZmVjdGVkRmlsZXMuaGFzKHNvdXJjZUZpbGUpKSB7XG4gICAgICAgIGNvbnN0IGFuZ3VsYXJEaWFnbm9zdGljcyA9IHByb2ZpbGVTeW5jKFxuICAgICAgICAgICdOR19ESUFHTk9TVElDU19URU1QTEFURScsXG4gICAgICAgICAgKCkgPT4gYW5ndWxhckNvbXBpbGVyLmdldERpYWdub3N0aWNzRm9yRmlsZShzb3VyY2VGaWxlLCB0ZW1wbGF0ZURpYWdub3N0aWNzT3B0aW1pemF0aW9uKSxcbiAgICAgICAgICB0cnVlLFxuICAgICAgICApO1xuICAgICAgICBkaWFnbm9zdGljQ2FjaGUuc2V0KHNvdXJjZUZpbGUsIGFuZ3VsYXJEaWFnbm9zdGljcyk7XG4gICAgICAgIHlpZWxkKiBhbmd1bGFyRGlhZ25vc3RpY3M7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBhbmd1bGFyRGlhZ25vc3RpY3MgPSBkaWFnbm9zdGljQ2FjaGUuZ2V0KHNvdXJjZUZpbGUpO1xuICAgICAgICBpZiAoYW5ndWxhckRpYWdub3N0aWNzKSB7XG4gICAgICAgICAgeWllbGQqIGFuZ3VsYXJEaWFnbm9zdGljcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGVtaXRBZmZlY3RlZEZpbGVzKCk6IEl0ZXJhYmxlPEVtaXRGaWxlUmVzdWx0PiB7XG4gICAgYXNzZXJ0KHRoaXMuI3N0YXRlLCAnQW5ndWxhciBjb21waWxhdGlvbiBtdXN0IGJlIGluaXRpYWxpemVkIHByaW9yIHRvIGVtaXR0aW5nIGZpbGVzLicpO1xuICAgIGNvbnN0IHsgYW5ndWxhckNvbXBpbGVyLCBjb21waWxlckhvc3QsIHR5cGVTY3JpcHRQcm9ncmFtIH0gPSB0aGlzLiNzdGF0ZTtcbiAgICBjb25zdCBidWlsZEluZm9GaWxlbmFtZSA9XG4gICAgICB0eXBlU2NyaXB0UHJvZ3JhbS5nZXRDb21waWxlck9wdGlvbnMoKS50c0J1aWxkSW5mb0ZpbGUgPz8gJy50c2J1aWxkaW5mbyc7XG5cbiAgICBjb25zdCBlbWl0dGVkRmlsZXMgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIEVtaXRGaWxlUmVzdWx0PigpO1xuICAgIGNvbnN0IHdyaXRlRmlsZUNhbGxiYWNrOiB0cy5Xcml0ZUZpbGVDYWxsYmFjayA9IChmaWxlbmFtZSwgY29udGVudHMsIF9hLCBfYiwgc291cmNlRmlsZXMpID0+IHtcbiAgICAgIGlmICghc291cmNlRmlsZXM/Lmxlbmd0aCAmJiBmaWxlbmFtZS5lbmRzV2l0aChidWlsZEluZm9GaWxlbmFtZSkpIHtcbiAgICAgICAgLy8gU2F2ZSBidWlsZGVyIGluZm8gY29udGVudHMgdG8gc3BlY2lmaWVkIGxvY2F0aW9uXG4gICAgICAgIGNvbXBpbGVySG9zdC53cml0ZUZpbGUoZmlsZW5hbWUsIGNvbnRlbnRzLCBmYWxzZSk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhc3NlcnQoc291cmNlRmlsZXM/Lmxlbmd0aCA9PT0gMSwgJ0ludmFsaWQgVHlwZVNjcmlwdCBwcm9ncmFtIGVtaXQgZm9yICcgKyBmaWxlbmFtZSk7XG4gICAgICBjb25zdCBzb3VyY2VGaWxlID0gc291cmNlRmlsZXNbMF07XG4gICAgICBpZiAoYW5ndWxhckNvbXBpbGVyLmlnbm9yZUZvckVtaXQuaGFzKHNvdXJjZUZpbGUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYW5ndWxhckNvbXBpbGVyLmluY3JlbWVudGFsQ29tcGlsYXRpb24ucmVjb3JkU3VjY2Vzc2Z1bEVtaXQoc291cmNlRmlsZSk7XG4gICAgICBlbWl0dGVkRmlsZXMuc2V0KHNvdXJjZUZpbGUsIHsgZmlsZW5hbWU6IHNvdXJjZUZpbGUuZmlsZU5hbWUsIGNvbnRlbnRzIH0pO1xuICAgIH07XG4gICAgY29uc3QgdHJhbnNmb3JtZXJzID0gbWVyZ2VUcmFuc2Zvcm1lcnMoYW5ndWxhckNvbXBpbGVyLnByZXBhcmVFbWl0KCkudHJhbnNmb3JtZXJzLCB7XG4gICAgICBiZWZvcmU6IFtyZXBsYWNlQm9vdHN0cmFwKCgpID0+IHR5cGVTY3JpcHRQcm9ncmFtLmdldFByb2dyYW0oKS5nZXRUeXBlQ2hlY2tlcigpKV0sXG4gICAgfSk7XG5cbiAgICAvLyBUeXBlU2NyaXB0IHdpbGwgbG9vcCB1bnRpbCB0aGVyZSBhcmUgbm8gbW9yZSBhZmZlY3RlZCBmaWxlcyBpbiB0aGUgcHJvZ3JhbVxuICAgIHdoaWxlIChcbiAgICAgIHR5cGVTY3JpcHRQcm9ncmFtLmVtaXROZXh0QWZmZWN0ZWRGaWxlKHdyaXRlRmlsZUNhbGxiYWNrLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdHJhbnNmb3JtZXJzKVxuICAgICkge1xuICAgICAgLyogZW1wdHkgKi9cbiAgICB9XG5cbiAgICAvLyBBbmd1bGFyIG1heSBoYXZlIGZpbGVzIHRoYXQgbXVzdCBiZSBlbWl0dGVkIGJ1dCBUeXBlU2NyaXB0IGRvZXMgbm90IGNvbnNpZGVyIGFmZmVjdGVkXG4gICAgZm9yIChjb25zdCBzb3VyY2VGaWxlIG9mIHR5cGVTY3JpcHRQcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkpIHtcbiAgICAgIGlmIChlbWl0dGVkRmlsZXMuaGFzKHNvdXJjZUZpbGUpIHx8IGFuZ3VsYXJDb21waWxlci5pZ25vcmVGb3JFbWl0Lmhhcyhzb3VyY2VGaWxlKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNvdXJjZUZpbGUuaXNEZWNsYXJhdGlvbkZpbGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChhbmd1bGFyQ29tcGlsZXIuaW5jcmVtZW50YWxDb21waWxhdGlvbi5zYWZlVG9Ta2lwRW1pdChzb3VyY2VGaWxlKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdHlwZVNjcmlwdFByb2dyYW0uZW1pdChzb3VyY2VGaWxlLCB3cml0ZUZpbGVDYWxsYmFjaywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHRyYW5zZm9ybWVycyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVtaXR0ZWRGaWxlcy52YWx1ZXMoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kQWZmZWN0ZWRGaWxlcyhcbiAgYnVpbGRlcjogdHMuRW1pdEFuZFNlbWFudGljRGlhZ25vc3RpY3NCdWlsZGVyUHJvZ3JhbSxcbiAgeyBpZ25vcmVGb3JEaWFnbm9zdGljcyB9OiBuZy5OZ3RzY1Byb2dyYW1bJ2NvbXBpbGVyJ10sXG4gIGluY2x1ZGVUVEM6IGJvb2xlYW4sXG4pOiBTZXQ8dHMuU291cmNlRmlsZT4ge1xuICBjb25zdCBhZmZlY3RlZEZpbGVzID0gbmV3IFNldDx0cy5Tb3VyY2VGaWxlPigpO1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zdGFudC1jb25kaXRpb25cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCByZXN1bHQgPSBidWlsZGVyLmdldFNlbWFudGljRGlhZ25vc3RpY3NPZk5leHRBZmZlY3RlZEZpbGUodW5kZWZpbmVkLCAoc291cmNlRmlsZSkgPT4ge1xuICAgICAgLy8gSWYgdGhlIGFmZmVjdGVkIGZpbGUgaXMgYSBUVEMgc2hpbSwgYWRkIHRoZSBzaGltJ3Mgb3JpZ2luYWwgc291cmNlIGZpbGUuXG4gICAgICAvLyBUaGlzIGVuc3VyZXMgdGhhdCBjaGFuZ2VzIHRoYXQgYWZmZWN0IFRUQyBhcmUgdHlwZWNoZWNrZWQgZXZlbiB3aGVuIHRoZSBjaGFuZ2VzXG4gICAgICAvLyBhcmUgb3RoZXJ3aXNlIHVucmVsYXRlZCBmcm9tIGEgVFMgcGVyc3BlY3RpdmUgYW5kIGRvIG5vdCByZXN1bHQgaW4gSXZ5IGNvZGVnZW4gY2hhbmdlcy5cbiAgICAgIC8vIEZvciBleGFtcGxlLCBjaGFuZ2luZyBASW5wdXQgcHJvcGVydHkgdHlwZXMgb2YgYSBkaXJlY3RpdmUgdXNlZCBpbiBhbm90aGVyIGNvbXBvbmVudCdzXG4gICAgICAvLyB0ZW1wbGF0ZS5cbiAgICAgIC8vIEEgVFRDIHNoaW0gaXMgYSBmaWxlIHRoYXQgaGFzIGJlZW4gaWdub3JlZCBmb3IgZGlhZ25vc3RpY3MgYW5kIGhhcyBhIGZpbGVuYW1lIGVuZGluZyBpbiBgLm5ndHlwZWNoZWNrLnRzYC5cbiAgICAgIGlmIChpZ25vcmVGb3JEaWFnbm9zdGljcy5oYXMoc291cmNlRmlsZSkgJiYgc291cmNlRmlsZS5maWxlTmFtZS5lbmRzV2l0aCgnLm5ndHlwZWNoZWNrLnRzJykpIHtcbiAgICAgICAgLy8gVGhpcyBmaWxlIG5hbWUgY29udmVyc2lvbiByZWxpZXMgb24gaW50ZXJuYWwgY29tcGlsZXIgbG9naWMgYW5kIHNob3VsZCBiZSBjb252ZXJ0ZWRcbiAgICAgICAgLy8gdG8gYW4gb2ZmaWNpYWwgbWV0aG9kIHdoZW4gYXZhaWxhYmxlLiAxNSBpcyBsZW5ndGggb2YgYC5uZ3R5cGVjaGVjay50c2BcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxGaWxlbmFtZSA9IHNvdXJjZUZpbGUuZmlsZU5hbWUuc2xpY2UoMCwgLTE1KSArICcudHMnO1xuICAgICAgICBjb25zdCBvcmlnaW5hbFNvdXJjZUZpbGUgPSBidWlsZGVyLmdldFNvdXJjZUZpbGUob3JpZ2luYWxGaWxlbmFtZSk7XG4gICAgICAgIGlmIChvcmlnaW5hbFNvdXJjZUZpbGUpIHtcbiAgICAgICAgICBhZmZlY3RlZEZpbGVzLmFkZChvcmlnaW5hbFNvdXJjZUZpbGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBhZmZlY3RlZEZpbGVzLmFkZChyZXN1bHQuYWZmZWN0ZWQgYXMgdHMuU291cmNlRmlsZSk7XG4gIH1cblxuICAvLyBBZGQgYWxsIGZpbGVzIHdpdGggYXNzb2NpYXRlZCB0ZW1wbGF0ZSB0eXBlIGNoZWNraW5nIGZpbGVzLlxuICAvLyBTdG9yZWQgVFMgYnVpbGQgaW5mbyBkb2VzIG5vdCBoYXZlIGtub3dsZWRnZSBvZiB0aGUgQU9UIGNvbXBpbGVyIG9yIHRoZSB0eXBlY2hlY2tpbmcgc3RhdGUgb2YgdGhlIHRlbXBsYXRlcy5cbiAgLy8gVG8gZW5zdXJlIHRoYXQgZXJyb3JzIGFyZSByZXBvcnRlZCBjb3JyZWN0bHksIGFsbCBBT1QgY29tcG9uZW50IGRpYWdub3N0aWNzIG5lZWQgdG8gYmUgYW5hbHl6ZWQgZXZlbiBpZiBidWlsZFxuICAvLyBpbmZvIGlzIHByZXNlbnQuXG4gIGlmIChpbmNsdWRlVFRDKSB7XG4gICAgZm9yIChjb25zdCBzb3VyY2VGaWxlIG9mIGJ1aWxkZXIuZ2V0U291cmNlRmlsZXMoKSkge1xuICAgICAgaWYgKGlnbm9yZUZvckRpYWdub3N0aWNzLmhhcyhzb3VyY2VGaWxlKSAmJiBzb3VyY2VGaWxlLmZpbGVOYW1lLmVuZHNXaXRoKCcubmd0eXBlY2hlY2sudHMnKSkge1xuICAgICAgICAvLyBUaGlzIGZpbGUgbmFtZSBjb252ZXJzaW9uIHJlbGllcyBvbiBpbnRlcm5hbCBjb21waWxlciBsb2dpYyBhbmQgc2hvdWxkIGJlIGNvbnZlcnRlZFxuICAgICAgICAvLyB0byBhbiBvZmZpY2lhbCBtZXRob2Qgd2hlbiBhdmFpbGFibGUuIDE1IGlzIGxlbmd0aCBvZiBgLm5ndHlwZWNoZWNrLnRzYFxuICAgICAgICBjb25zdCBvcmlnaW5hbEZpbGVuYW1lID0gc291cmNlRmlsZS5maWxlTmFtZS5zbGljZSgwLCAtMTUpICsgJy50cyc7XG4gICAgICAgIGNvbnN0IG9yaWdpbmFsU291cmNlRmlsZSA9IGJ1aWxkZXIuZ2V0U291cmNlRmlsZShvcmlnaW5hbEZpbGVuYW1lKTtcbiAgICAgICAgaWYgKG9yaWdpbmFsU291cmNlRmlsZSkge1xuICAgICAgICAgIGFmZmVjdGVkRmlsZXMuYWRkKG9yaWdpbmFsU291cmNlRmlsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gYWZmZWN0ZWRGaWxlcztcbn1cbiJdfQ==