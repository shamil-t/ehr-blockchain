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
exports.WebpackResourceLoader = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const node_buffer_1 = require("node:buffer");
const path = __importStar(require("node:path"));
const vm = __importStar(require("node:vm"));
const diagnostics_1 = require("./ivy/diagnostics");
const paths_1 = require("./ivy/paths");
const inline_resource_1 = require("./loaders/inline-resource");
const replace_resources_1 = require("./transformers/replace_resources");
class WebpackResourceLoader {
    constructor(shouldCache) {
        this._fileDependencies = new Map();
        this._reverseDependencies = new Map();
        this.modifiedResources = new Set();
        this.outputPathCounter = 1;
        this.inlineDataLoaderPath = inline_resource_1.InlineAngularResourceLoaderPath;
        if (shouldCache) {
            this.fileCache = new Map();
            this.assetCache = new Map();
        }
    }
    update(parentCompilation, changedFiles) {
        this._parentCompilation = parentCompilation;
        // Update resource cache and modified resources
        this.modifiedResources.clear();
        if (changedFiles) {
            for (const changedFile of changedFiles) {
                const changedFileNormalized = (0, paths_1.normalizePath)(changedFile);
                this.assetCache?.delete(changedFileNormalized);
                for (const affectedResource of this.getAffectedResources(changedFile)) {
                    const affectedResourceNormalized = (0, paths_1.normalizePath)(affectedResource);
                    this.fileCache?.delete(affectedResourceNormalized);
                    this.modifiedResources.add(affectedResource);
                    for (const effectedDependencies of this.getResourceDependencies(affectedResourceNormalized)) {
                        this.assetCache?.delete((0, paths_1.normalizePath)(effectedDependencies));
                    }
                }
            }
        }
        else {
            this.fileCache?.clear();
            this.assetCache?.clear();
        }
        // Re-emit all assets for un-effected files
        if (this.assetCache) {
            for (const [, { name, source, info }] of this.assetCache) {
                this._parentCompilation.emitAsset(name, source, info);
            }
        }
    }
    clearParentCompilation() {
        this._parentCompilation = undefined;
    }
    getModifiedResourceFiles() {
        return this.modifiedResources;
    }
    getResourceDependencies(filePath) {
        return this._fileDependencies.get(filePath) || [];
    }
    getAffectedResources(file) {
        return this._reverseDependencies.get(file) || [];
    }
    setAffectedResources(file, resources) {
        this._reverseDependencies.set(file, new Set(resources));
    }
    // eslint-disable-next-line max-lines-per-function
    async _compile(filePath, data, fileExtension, resourceType, containingFile) {
        if (!this._parentCompilation) {
            throw new Error('WebpackResourceLoader cannot be used without parentCompilation');
        }
        const { context, webpack } = this._parentCompilation.compiler;
        const { EntryPlugin, NormalModule, library, node, sources, util: { createHash }, } = webpack;
        const getEntry = () => {
            if (filePath) {
                return `${filePath}?${replace_resources_1.NG_COMPONENT_RESOURCE_QUERY}`;
            }
            else if (resourceType) {
                return (
                // app.component.ts-2.css?ngResource!=!@ngtools/webpack/src/loaders/inline-resource.js!app.component.ts
                `${containingFile}-${this.outputPathCounter}.${fileExtension}` +
                    `?${replace_resources_1.NG_COMPONENT_RESOURCE_QUERY}!=!${this.inlineDataLoaderPath}!${containingFile}`);
            }
            else if (data) {
                // Create a special URL for reading the resource from memory
                return `angular-resource:${resourceType},${createHash('xxhash64')
                    .update(data)
                    .digest('hex')}`;
            }
            throw new Error(`"filePath", "resourceType" or "data" must be specified.`);
        };
        const entry = getEntry();
        // Simple sanity check.
        if (filePath?.match(/\.[jt]s$/)) {
            throw new Error(`Cannot use a JavaScript or TypeScript file (${filePath}) in a component's styleUrls or templateUrl.`);
        }
        const outputFilePath = filePath ||
            `${containingFile}-angular-inline--${this.outputPathCounter++}.${resourceType === 'template' ? 'html' : 'css'}`;
        const outputOptions = {
            filename: outputFilePath,
            library: {
                type: 'var',
                name: 'resource',
            },
        };
        const childCompiler = this._parentCompilation.createChildCompiler('angular-compiler:resource', outputOptions, [
            new node.NodeTemplatePlugin(),
            new node.NodeTargetPlugin(),
            new EntryPlugin(context, entry, { name: 'resource' }),
            new library.EnableLibraryPlugin('var'),
        ]);
        childCompiler.hooks.thisCompilation.tap('angular-compiler', (compilation, { normalModuleFactory }) => {
            // If no data is provided, the resource will be read from the filesystem
            if (data !== undefined) {
                normalModuleFactory.hooks.resolveForScheme
                    .for('angular-resource')
                    .tap('angular-compiler', (resourceData) => {
                    if (filePath) {
                        resourceData.path = filePath;
                        resourceData.resource = filePath;
                    }
                    return true;
                });
                NormalModule.getCompilationHooks(compilation)
                    .readResourceForScheme.for('angular-resource')
                    .tap('angular-compiler', () => data);
                compilation[inline_resource_1.InlineAngularResourceSymbol] = data;
            }
            compilation.hooks.additionalAssets.tap('angular-compiler', () => {
                const asset = compilation.assets[outputFilePath];
                if (!asset) {
                    return;
                }
                try {
                    const output = this._evaluate(outputFilePath, asset.source().toString());
                    if (typeof output === 'string') {
                        compilation.assets[outputFilePath] = new sources.RawSource(output);
                    }
                }
                catch (error) {
                    (0, node_assert_1.default)(error instanceof Error, 'catch clause variable is not an Error instance');
                    // Use compilation errors, as otherwise webpack will choke
                    (0, diagnostics_1.addError)(compilation, error.message);
                }
            });
        });
        let finalContent;
        childCompiler.hooks.compilation.tap('angular-compiler', (childCompilation) => {
            childCompilation.hooks.processAssets.tap({ name: 'angular-compiler', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT }, () => {
                finalContent = childCompilation.assets[outputFilePath]?.source().toString();
                for (const { files } of childCompilation.chunks) {
                    for (const file of files) {
                        childCompilation.deleteAsset(file);
                    }
                }
            });
        });
        return new Promise((resolve, reject) => {
            childCompiler.runAsChild((error, _, childCompilation) => {
                if (error) {
                    reject(error);
                    return;
                }
                else if (!childCompilation) {
                    reject(new Error('Unknown child compilation error'));
                    return;
                }
                // Workaround to attempt to reduce memory usage of child compilations.
                // This removes the child compilation from the main compilation and manually propagates
                // all dependencies, warnings, and errors.
                const parent = childCompiler.parentCompilation;
                if (parent) {
                    parent.children = parent.children.filter((child) => child !== childCompilation);
                    let fileDependencies;
                    for (const dependency of childCompilation.fileDependencies) {
                        // Skip paths that do not appear to be files (have no extension).
                        // `fileDependencies` can contain directories and not just files which can
                        // cause incorrect cache invalidation on rebuilds.
                        if (!path.extname(dependency)) {
                            continue;
                        }
                        if (data && containingFile && dependency.endsWith(entry)) {
                            // use containing file if the resource was inline
                            parent.fileDependencies.add(containingFile);
                        }
                        else {
                            parent.fileDependencies.add(dependency);
                        }
                        // Save the dependencies for this resource.
                        if (filePath) {
                            const resolvedFile = (0, paths_1.normalizePath)(dependency);
                            const entry = this._reverseDependencies.get(resolvedFile);
                            if (entry) {
                                entry.add(filePath);
                            }
                            else {
                                this._reverseDependencies.set(resolvedFile, new Set([filePath]));
                            }
                            if (fileDependencies) {
                                fileDependencies.add(dependency);
                            }
                            else {
                                fileDependencies = new Set([dependency]);
                                this._fileDependencies.set(filePath, fileDependencies);
                            }
                        }
                    }
                    parent.contextDependencies.addAll(childCompilation.contextDependencies);
                    parent.missingDependencies.addAll(childCompilation.missingDependencies);
                    parent.buildDependencies.addAll(childCompilation.buildDependencies);
                    parent.warnings.push(...childCompilation.warnings);
                    parent.errors.push(...childCompilation.errors);
                    if (this.assetCache) {
                        for (const { info, name, source } of childCompilation.getAssets()) {
                            // Use the originating file as the cache key if present
                            // Otherwise, generate a cache key based on the generated name
                            const cacheKey = info.sourceFilename ?? `!![GENERATED]:${name}`;
                            this.assetCache.set(cacheKey, { info, name, source });
                        }
                    }
                }
                resolve({
                    content: finalContent ?? '',
                    success: childCompilation.errors?.length === 0,
                });
            });
        });
    }
    _evaluate(filename, source) {
        // Evaluate code
        // css-loader requires the btoa function to exist to correctly generate inline sourcemaps
        const context = {
            btoa(input) {
                return node_buffer_1.Buffer.from(input).toString('base64');
            },
        };
        try {
            vm.runInNewContext(source, context, { filename });
        }
        catch {
            // Error are propagated through the child compilation.
            return null;
        }
        if (typeof context.resource === 'string') {
            return context.resource;
        }
        else if (typeof context.resource?.default === 'string') {
            return context.resource.default;
        }
        throw new Error(`The loader "${filename}" didn't return a string.`);
    }
    async get(filePath) {
        const normalizedFile = (0, paths_1.normalizePath)(filePath);
        let compilationResult = this.fileCache?.get(normalizedFile);
        if (compilationResult === undefined) {
            // cache miss so compile resource
            compilationResult = await this._compile(filePath);
            // Only cache if compilation was successful
            if (this.fileCache && compilationResult.success) {
                this.fileCache.set(normalizedFile, compilationResult);
            }
        }
        return compilationResult.content;
    }
    async process(data, fileExtension, resourceType, containingFile) {
        if (data.trim().length === 0) {
            return '';
        }
        const compilationResult = await this._compile(undefined, data, fileExtension, resourceType, containingFile);
        return compilationResult.content;
    }
}
exports.WebpackResourceLoader = WebpackResourceLoader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VfbG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvbmd0b29scy93ZWJwYWNrL3NyYy9yZXNvdXJjZV9sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCw4REFBaUM7QUFDakMsNkNBQXFDO0FBQ3JDLGdEQUFrQztBQUNsQyw0Q0FBOEI7QUFFOUIsbURBQTZDO0FBQzdDLHVDQUE0QztBQUM1QywrREFJbUM7QUFDbkMsd0VBQStFO0FBUS9FLE1BQWEscUJBQXFCO0lBYWhDLFlBQVksV0FBb0I7UUFYeEIsc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7UUFDbkQseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7UUFLdEQsc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUN0QyxzQkFBaUIsR0FBRyxDQUFDLENBQUM7UUFFYix5QkFBb0IsR0FBRyxpREFBK0IsQ0FBQztRQUd0RSxJQUFJLFdBQVcsRUFBRTtZQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUMzQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7U0FDN0I7SUFDSCxDQUFDO0lBRUQsTUFBTSxDQUFDLGlCQUE4QixFQUFFLFlBQStCO1FBQ3BFLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxpQkFBaUIsQ0FBQztRQUU1QywrQ0FBK0M7UUFDL0MsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO1FBRS9CLElBQUksWUFBWSxFQUFFO1lBQ2hCLEtBQUssTUFBTSxXQUFXLElBQUksWUFBWSxFQUFFO2dCQUN0QyxNQUFNLHFCQUFxQixHQUFHLElBQUEscUJBQWEsRUFBQyxXQUFXLENBQUMsQ0FBQztnQkFDekQsSUFBSSxD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Q29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCBhc3NlcnQgZnJvbSAnbm9kZTphc3NlcnQnO1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnbm9kZTpidWZmZXInO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0ICogYXMgdm0gZnJvbSAnbm9kZTp2bSc7XG5pbXBvcnQgdHlwZSB7IEFzc2V0LCBDb21waWxhdGlvbiB9IGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0IHsgYWRkRXJyb3IgfSBmcm9tICcuL2l2eS9kaWFnbm9zdGljcyc7XG5pbXBvcnQgeyBub3JtYWxpemVQYXRoIH0gZnJvbSAnLi9pdnkvcGF0aHMnO1xuaW1wb3J0IHtcbiAgQ29tcGlsYXRpb25XaXRoSW5saW5lQW5ndWxhclJlc291cmNlLFxuICBJbmxpbmVBbmd1bGFyUmVzb3VyY2VMb2FkZXJQYXRoLFxuICBJbmxpbmVBbmd1bGFyUmVzb3VyY2VTeW1ib2wsXG59IGZyb20gJy4vbG9hZGVycy9pbmxpbmUtcmVzb3VyY2UnO1xuaW1wb3J0IHsgTkdfQ09NUE9ORU5UX1JFU09VUkNFX1FVRVJZIH0gZnJvbSAnLi90cmFuc2Zvcm1lcnMvcmVwbGFjZV9yZXNvdXJjZXMnO1xuXG5pbnRlcmZhY2UgQ29tcGlsYXRpb25PdXRwdXQge1xuICBjb250ZW50OiBzdHJpbmc7XG4gIG1hcD86IHN0cmluZztcbiAgc3VjY2VzczogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFdlYnBhY2tSZXNvdXJjZUxvYWRlciB7XG4gIHByaXZhdGUgX3BhcmVudENvbXBpbGF0aW9uPzogQ29tcGlsYXRpb247XG4gIHByaXZhdGUgX2ZpbGVEZXBlbmRlbmNpZXMgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KCk7XG4gIHByaXZhdGUgX3JldmVyc2VEZXBlbmRlbmNpZXMgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KCk7XG5cbiAgcHJpdmF0ZSBmaWxlQ2FjaGU/OiBNYXA8c3RyaW5nLCBDb21waWxhdGlvbk91dHB1dD47XG4gIHByaXZhdGUgYXNzZXRDYWNoZT86IE1hcDxzdHJpbmcsIEFzc2V0PjtcblxuICBwcml2YXRlIG1vZGlmaWVkUmVzb3VyY2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHByaXZhdGUgb3V0cHV0UGF0aENvdW50ZXIgPSAxO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgaW5saW5lRGF0YUxvYWRlclBhdGggPSBJbmxpbmVBbmd1bGFyUmVzb3VyY2VMb2FkZXJQYXRoO1xuXG4gIGNvbnN0cnVjdG9yKHNob3VsZENhY2hlOiBib29sZWFuKSB7XG4gICAgaWYgKHNob3VsZENhY2hlKSB7XG4gICAgICB0aGlzLmZpbGVDYWNoZSA9IG5ldyBNYXAoKTtcbiAgICAgIHRoaXMuYXNzZXRDYWNoZSA9IG5ldyBNYXAoKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGUocGFyZW50Q29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjaGFuZ2VkRmlsZXM/OiBJdGVyYWJsZTxzdHJpbmc+KSB7XG4gICAgdGhpcy5fcGFyZW50Q29tcGlsYXRpb24gPSBwYXJlbnRDb21waWxhdGlvbjtcblxuICAgIC8vIFVwZGF0ZSByZXNvdXJjZSBjYWNoZSBhbmQgbW9kaWZpZWQgcmVzb3VyY2VzXG4gICAgdGhpcy5tb2RpZmllZFJlc291cmNlcy5jbGVhcigpO1xuXG4gICAgaWYgKGNoYW5nZWRGaWxlcykge1xuICAgICAgZm9yIChjb25zdCBjaGFuZ2VkRmlsZSBvZiBjaGFuZ2VkRmlsZXMpIHtcbiAgICAgICAgY29uc3QgY2hhbmdlZEZpbGVOb3JtYWxpemVkID0gbm9ybWFsaXplUGF0aChjaGFuZ2VkRmlsZSk7XG4gICAgICAgIHRoaXMuYXNzZXRDYWNoZT8uZGVsZXRlKGNoYW5nZWRGaWxlTm9ybWFsaXplZCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBhZmZlY3RlZFJlc291cmNlIG9mIHRoaXMuZ2V0QWZmZWN0ZWRSZXNvdXJjZXMoY2hhbmdlZEZpbGUpKSB7XG4gICAgICAgICAgY29uc3QgYWZmZWN0ZWRSZXNvdXJjZU5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGFmZmVjdGVkUmVzb3VyY2UpO1xuICAgICAgICAgIHRoaXMuZmlsZUNhY2hlPy5kZWxldGUoYWZmZWN0ZWRSZXNvdXJjZU5vcm1hbGl6ZWQpO1xuICAgICAgICAgIHRoaXMubW9kaWZpZWRSZXNvdXJjZXMuYWRkKGFmZmVjdGVkUmVzb3VyY2UpO1xuXG4gICAgICAgICAgZm9yIChjb25zdCBlZmZlY3RlZERlcGVuZGVuY2llcyBvZiB0aGlzLmdldFJlc291cmNlRGVwZW5kZW5jaWVzKFxuICAgICAgICAgICAgYWZmZWN0ZWRSZXNvdXJjZU5vcm1hbGl6ZWQsXG4gICAgICAgICAgKSkge1xuICAgICAgICAgICAgdGhpcy5hc3NldENhY2hlPy5kZWxldGUobm9ybWFsaXplUGF0aChlZmZlY3RlZERlcGVuZGVuY2llcykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmZpbGVDYWNoZT8uY2xlYXIoKTtcbiAgICAgIHRoaXMuYXNzZXRDYWNoZT8uY2xlYXIoKTtcbiAgICB9XG5cbiAgICAvLyBSZS1lbWl0IGFsbCBhc3NldHMgZm9yIHVuLWVmZmVjdGVkIGZpbGVzXG4gICAgaWYgKHRoaXMuYXNzZXRDYWNoZSkge1xuICAgICAgZm9yIChjb25zdCBbLCB7IG5hbWUsIHNvdXJjZSwgaW5mbyB9XSBvZiB0aGlzLmFzc2V0Q2FjaGUpIHtcbiAgICAgICAgdGhpcy5fcGFyZW50Q29tcGlsYXRpb24uZW1pdEFzc2V0KG5hbWUsIHNvdXJjZSwgaW5mbyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY2xlYXJQYXJlbnRDb21waWxhdGlvbigpIHtcbiAgICB0aGlzLl9wYXJlbnRDb21waWxhdGlvbiA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGdldE1vZGlmaWVkUmVzb3VyY2VGaWxlcygpIHtcbiAgICByZXR1cm4gdGhpcy5tb2RpZmllZFJlc291cmNlcztcbiAgfVxuXG4gIGdldFJlc291cmNlRGVwZW5kZW5jaWVzKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5fZmlsZURlcGVuZGVuY2llcy5nZXQoZmlsZVBhdGgpIHx8IFtdO1xuICB9XG5cbiAgZ2V0QWZmZWN0ZWRSZXNvdXJjZXMoZmlsZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JldmVyc2VEZXBlbmRlbmNpZXMuZ2V0KGZpbGUpIHx8IFtdO1xuICB9XG5cbiAgc2V0QWZmZWN0ZWRSZXNvdXJjZXMoZmlsZTogc3RyaW5nLCByZXNvdXJjZXM6IEl0ZXJhYmxlPHN0cmluZz4pIHtcbiAgICB0aGlzLl9yZXZlcnNlRGVwZW5kZW5jaWVzLnNldChmaWxlLCBuZXcgU2V0KHJlc291cmNlcykpO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1saW5lcy1wZXItZnVuY3Rpb25cbiAgcHJpdmF0ZSBhc3luYyBfY29tcGlsZShcbiAgICBmaWxlUGF0aD86IHN0cmluZyxcbiAgICBkYXRhPzogc3RyaW5nLFxuICAgIGZpbGVFeHRlbnNpb24/OiBzdHJpbmcsXG4gICAgcmVzb3VyY2VUeXBlPzogJ3N0eWxlJyB8ICd0ZW1wbGF0ZScsXG4gICAgY29udGFpbmluZ0ZpbGU/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8Q29tcGlsYXRpb25PdXRwdXQ+IHtcbiAgICBpZiAoIXRoaXMuX3BhcmVudENvbXBpbGF0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dlYnBhY2tSZXNvdXJjZUxvYWRlciBjYW5ub3QgYmUgdXNlZCB3aXRob3V0IHBhcmVudENvbXBpbGF0aW9uJyk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBjb250ZXh0LCB3ZWJwYWNrIH0gPSB0aGlzLl9wYXJlbnRDb21waWxhdGlvbi5jb21waWxlcjtcbiAgICBjb25zdCB7XG4gICAgICBFbnRyeVBsdWdpbixcbiAgICAgIE5vcm1hbE1vZHVsZSxcbiAgICAgIGxpYnJhcnksXG4gICAgICBub2RlLFxuICAgICAgc291cmNlcyxcbiAgICAgIHV0aWw6IHsgY3JlYXRlSGFzaCB9LFxuICAgIH0gPSB3ZWJwYWNrO1xuXG4gICAgY29uc3QgZ2V0RW50cnkgPSAoKTogc3RyaW5nID0+IHtcbiAgICAgIGlmIChmaWxlUGF0aCkge1xuICAgICAgICByZXR1cm4gYCR7ZmlsZVBhdGh9PyR7TkdfQ09NUE9ORU5UX1JFU09VUkNFX1FVRVJZfWA7XG4gICAgICB9IGVsc2UgaWYgKHJlc291cmNlVHlwZSkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIC8vIGFwcC5jb21wb25lbnQudHMtMi5jc3M/bmdSZXNvdXJjZSE9IUBuZ3Rvb2xzL3dlYnBhY2svc3JjL2xvYWRlcnMvaW5saW5lLXJlc291cmNlLmpzIWFwcC5jb21wb25lbnQudHNcbiAgICAgICAgICBgJHtjb250YWluaW5nRmlsZX0tJHt0aGlzLm91dHB1dFBhdGhDb3VudGVyfS4ke2ZpbGVFeHRlbnNpb259YCArXG4gICAgICAgICAgYD8ke05HX0NPTVBPTkVOVF9SRVNPVVJDRV9RVUVSWX0hPSEke3RoaXMuaW5saW5lRGF0YUxvYWRlclBhdGh9ISR7Y29udGFpbmluZ0ZpbGV9YFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChkYXRhKSB7XG4gICAgICAgIC8vIENyZWF0ZSBhIHNwZWNpYWwgVVJMIGZvciByZWFkaW5nIHRoZSByZXNvdXJjZSBmcm9tIG1lbW9yeVxuICAgICAgICByZXR1cm4gYGFuZ3VsYXItcmVzb3VyY2U6JHtyZXNvdXJjZVR5cGV9LCR7Y3JlYXRlSGFzaCgneHhoYXNoNjQnKVxuICAgICAgICAgIC51cGRhdGUoZGF0YSlcbiAgICAgICAgICAuZGlnZXN0KCdoZXgnKX1gO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFwiZmlsZVBhdGhcIiwgXCJyZXNvdXJjZVR5cGVcIiBvciBcImRhdGFcIiBtdXN0IGJlIHNwZWNpZmllZC5gKTtcbiAgICB9O1xuXG4gICAgY29uc3QgZW50cnkgPSBnZXRFbnRyeSgpO1xuXG4gICAgLy8gU2ltcGxlIHNhbml0eSBjaGVjay5cbiAgICBpZiAoZmlsZVBhdGg/Lm1hdGNoKC9cXC5banRdcyQvKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQ2Fubm90IHVzZSBhIEphdmFTY3JpcHQgb3IgVHlwZVNjcmlwdCBmaWxlICgke2ZpbGVQYXRofSkgaW4gYSBjb21wb25lbnQncyBzdHlsZVVybHMgb3IgdGVtcGxhdGVVcmwuYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3Qgb3V0cHV0RmlsZVBhdGggPVxuICAgICAgZmlsZVBhdGggfHxcbiAgICAgIGAke2NvbnRhaW5pbmdGaWxlfS1hbmd1bGFyLWlubGluZS0tJHt0aGlzLm91dHB1dFBhdGhDb3VudGVyKyt9LiR7XG4gICAgICAgIHJlc291cmNlVHlwZSA9PT0gJ3RlbXBsYXRlJyA/ICdodG1sJyA6ICdjc3MnXG4gICAgICB9YDtcbiAgICBjb25zdCBvdXRwdXRPcHRpb25zID0ge1xuICAgICAgZmlsZW5hbWU6IG91dHB1dEZpbGVQYXRoLFxuICAgICAgbGlicmFyeToge1xuICAgICAgICB0eXBlOiAndmFyJyxcbiAgICAgICAgbmFtZTogJ3Jlc291cmNlJyxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGNvbnN0IGNoaWxkQ29tcGlsZXIgPSB0aGlzLl9wYXJlbnRDb21waWxhdGlvbi5jcmVhdGVDaGlsZENvbXBpbGVyKFxuICAgICAgJ2FuZ3VsYXItY29tcGlsZXI6cmVzb3VyY2UnLFxuICAgICAgb3V0cHV0T3B0aW9ucyxcbiAgICAgIFtcbiAgICAgICAgbmV3IG5vZGUuTm9kZVRlbXBsYXRlUGx1Z2luKCksXG4gICAgICAgIG5ldyBub2RlLk5vZGVUYXJnZXRQbHVnaW4oKSxcbiAgICAgICAgbmV3IEVudHJ5UGx1Z2luKGNvbnRleHQsIGVudHJ5LCB7IG5hbWU6ICdyZXNvdXJjZScgfSksXG4gICAgICAgIG5ldyBsaWJyYXJ5LkVuYWJsZUxpYnJhcnlQbHVnaW4oJ3ZhcicpLFxuICAgICAgXSxcbiAgICApO1xuXG4gICAgY2hpbGRDb21waWxlci5ob29rcy50aGlzQ29tcGlsYXRpb24udGFwKFxuICAgICAgJ2FuZ3VsYXItY29tcGlsZXInLFxuICAgICAgKGNvbXBpbGF0aW9uLCB7IG5vcm1hbE1vZHVsZUZhY3RvcnkgfSkgPT4ge1xuICAgICAgICAvLyBJZiBubyBkYXRhIGlzIHByb3ZpZGVkLCB0aGUgcmVzb3VyY2Ugd2lsbCBiZSByZWFkIGZyb20gdGhlIGZpbGVzeXN0ZW1cbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIG5vcm1hbE1vZHVsZUZhY3RvcnkuaG9va3MucmVzb2x2ZUZvclNjaGVtZVxuICAgICAgICAgICAgLmZvcignYW5ndWxhci1yZXNvdXJjZScpXG4gICAgICAgICAgICAudGFwKCdhbmd1bGFyLWNvbXBpbGVyJywgKHJlc291cmNlRGF0YSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZmlsZVBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXNvdXJjZURhdGEucGF0aCA9IGZpbGVQYXRoO1xuICAgICAgICAgICAgICAgIHJlc291cmNlRGF0YS5yZXNvdXJjZSA9IGZpbGVQYXRoO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICBOb3JtYWxNb2R1bGUuZ2V0Q29tcGlsYXRpb25Ib29rcyhjb21waWxhdGlvbilcbiAgICAgICAgICAgIC5yZWFkUmVzb3VyY2VGb3JTY2hlbWUuZm9yKCdhbmd1bGFyLXJlc291cmNlJylcbiAgICAgICAgICAgIC50YXAoJ2FuZ3VsYXItY29tcGlsZXInLCAoKSA9PiBkYXRhKTtcblxuICAgICAgICAgIChjb21waWxhdGlvbiBhcyBDb21waWxhdGlvbldpdGhJbmxpbmVBbmd1bGFyUmVzb3VyY2UpW0lubGluZUFuZ3VsYXJSZXNvdXJjZVN5bWJvbF0gPSBkYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgY29tcGlsYXRpb24uaG9va3MuYWRkaXRpb25hbEFzc2V0cy50YXAoJ2FuZ3VsYXItY29tcGlsZXInLCAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgYXNzZXQgPSBjb21waWxhdGlvbi5hc3NldHNbb3V0cHV0RmlsZVBhdGhdO1xuICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgb3V0cHV0ID0gdGhpcy5fZXZhbHVhdGUob3V0cHV0RmlsZVBhdGgsIGFzc2V0LnNvdXJjZSgpLnRvU3RyaW5nKCkpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG91dHB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgY29tcGlsYXRpb24uYXNzZXRzW291dHB1dEZpbGVQYXRoXSA9IG5ldyBzb3VyY2VzLlJhd1NvdXJjZShvdXRwdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBhc3NlcnQoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciwgJ2NhdGNoIGNsYXVzZSB2YXJpYWJsZSBpcyBub3QgYW4gRXJyb3IgaW5zdGFuY2UnKTtcbiAgICAgICAgICAgIC8vIFVzZSBjb21waWxhdGlvbiBlcnJvcnMsIGFzIG90aGVyd2lzZSB3ZWJwYWNrIHdpbGwgY2hva2VcbiAgICAgICAgICAgIGFkZEVycm9yKGNvbXBpbGF0aW9uLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuXG4gICAgbGV0IGZpbmFsQ29udGVudDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIGNoaWxkQ29tcGlsZXIuaG9va3MuY29tcGlsYXRpb24udGFwKCdhbmd1bGFyLWNvbXBpbGVyJywgKGNoaWxkQ29tcGlsYXRpb24pID0+IHtcbiAgICAgIGNoaWxkQ29tcGlsYXRpb24uaG9va3MucHJvY2Vzc0Fzc2V0cy50YXAoXG4gICAgICAgIHsgbmFtZTogJ2FuZ3VsYXItY29tcGlsZXInLCBzdGFnZTogd2VicGFjay5Db21waWxhdGlvbi5QUk9DRVNTX0FTU0VUU19TVEFHRV9SRVBPUlQgfSxcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIGZpbmFsQ29udGVudCA9IGNoaWxkQ29tcGlsYXRpb24uYXNzZXRzW291dHB1dEZpbGVQYXRoXT8uc291cmNlKCkudG9TdHJpbmcoKTtcblxuICAgICAgICAgIGZvciAoY29uc3QgeyBmaWxlcyB9IG9mIGNoaWxkQ29tcGlsYXRpb24uY2h1bmtzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgICAgICAgICAgY2hpbGRDb21waWxhdGlvbi5kZWxldGVBc3NldChmaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPENvbXBpbGF0aW9uT3V0cHV0PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjaGlsZENvbXBpbGVyLnJ1bkFzQ2hpbGQoKGVycm9yLCBfLCBjaGlsZENvbXBpbGF0aW9uKSA9PiB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSBpZiAoIWNoaWxkQ29tcGlsYXRpb24pIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdVbmtub3duIGNoaWxkIGNvbXBpbGF0aW9uIGVycm9yJykpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV29ya2Fyb3VuZCB0byBhdHRlbXB0IHRvIHJlZHVjZSBtZW1vcnkgdXNhZ2Ugb2YgY2hpbGQgY29tcGlsYXRpb25zLlxuICAgICAgICAvLyBUaGlzIHJlbW92ZXMgdGhlIGNoaWxkIGNvbXBpbGF0aW9uIGZyb20gdGhlIG1haW4gY29tcGlsYXRpb24gYW5kIG1hbnVhbGx5IHByb3BhZ2F0ZXNcbiAgICAgICAgLy8gYWxsIGRlcGVuZGVuY2llcywgd2FybmluZ3MsIGFuZCBlcnJvcnMuXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IGNoaWxkQ29tcGlsZXIucGFyZW50Q29tcGlsYXRpb247XG4gICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICBwYXJlbnQuY2hpbGRyZW4gPSBwYXJlbnQuY2hpbGRyZW4uZmlsdGVyKChjaGlsZCkgPT4gY2hpbGQgIT09IGNoaWxkQ29tcGlsYXRpb24pO1xuICAgICAgICAgIGxldCBmaWxlRGVwZW5kZW5jaWVzOiBTZXQ8c3RyaW5nPiB8IHVuZGVmaW5lZDtcblxuICAgICAgICAgIGZvciAoY29uc3QgZGVwZW5kZW5jeSBvZiBjaGlsZENvbXBpbGF0aW9uLmZpbGVEZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgICAgIC8vIFNraXAgcGF0aHMgdGhhdCBkbyBub3QgYXBwZWFyIHRvIGJlIGZpbGVzIChoYXZlIG5vIGV4dGVuc2lvbikuXG4gICAgICAgICAgICAvLyBgZmlsZURlcGVuZGVuY2llc2AgY2FuIGNvbnRhaW4gZGlyZWN0b3JpZXMgYW5kIG5vdCBqdXN0IGZpbGVzIHdoaWNoIGNhblxuICAgICAgICAgICAgLy8gY2F1c2UgaW5jb3JyZWN0IGNhY2hlIGludmFsaWRhdGlvbiBvbiByZWJ1aWxkcy5cbiAgICAgICAgICAgIGlmICghcGF0aC5leHRuYW1lKGRlcGVuZGVuY3kpKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZGF0YSAmJiBjb250YWluaW5nRmlsZSAmJiBkZXBlbmRlbmN5LmVuZHNXaXRoKGVudHJ5KSkge1xuICAgICAgICAgICAgICAvLyB1c2UgY29udGFpbmluZyBmaWxlIGlmIHRoZSByZXNvdXJjZSB3YXMgaW5saW5lXG4gICAgICAgICAgICAgIHBhcmVudC5maWxlRGVwZW5kZW5jaWVzLmFkZChjb250YWluaW5nRmlsZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwYXJlbnQuZmlsZURlcGVuZGVuY2llcy5hZGQoZGVwZW5kZW5jeSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNhdmUgdGhlIGRlcGVuZGVuY2llcyBmb3IgdGhpcyByZXNvdXJjZS5cbiAgICAgICAgICAgIGlmIChmaWxlUGF0aCkge1xuICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZEZpbGUgPSBub3JtYWxpemVQYXRoKGRlcGVuZGVuY3kpO1xuICAgICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuX3JldmVyc2VEZXBlbmRlbmNpZXMuZ2V0KHJlc29sdmVkRmlsZSk7XG4gICAgICAgICAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICAgICAgICAgIGVudHJ5LmFkZChmaWxlUGF0aCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmV2ZXJzZURlcGVuZGVuY2llcy5zZXQocmVzb2x2ZWRGaWxlLCBuZXcgU2V0KFtmaWxlUGF0aF0pKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChmaWxlRGVwZW5kZW5jaWVzKSB7XG4gICAgICAgICAgICAgICAgZmlsZURlcGVuZGVuY2llcy5hZGQoZGVwZW5kZW5jeSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmlsZURlcGVuZGVuY2llcyA9IG5ldyBTZXQoW2RlcGVuZGVuY3ldKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9maWxlRGVwZW5kZW5jaWVzLnNldChmaWxlUGF0aCwgZmlsZURlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwYXJlbnQuY29udGV4dERlcGVuZGVuY2llcy5hZGRBbGwoY2hpbGRDb21waWxhdGlvbi5jb250ZXh0RGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICBwYXJlbnQubWlzc2luZ0RlcGVuZGVuY2llcy5hZGRBbGwoY2hpbGRDb21waWxhdGlvbi5taXNzaW5nRGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICBwYXJlbnQuYnVpbGREZXBlbmRlbmNpZXMuYWRkQWxsKGNoaWxkQ29tcGlsYXRpb24uYnVpbGREZXBlbmRlbmNpZXMpO1xuXG4gICAgICAgICAgcGFyZW50Lndhcm5pbmdzLnB1c2goLi4uY2hpbGRDb21waWxhdGlvbi53YXJuaW5ncyk7XG4gICAgICAgICAgcGFyZW50LmVycm9ycy5wdXNoKC4uLmNoaWxkQ29tcGlsYXRpb24uZXJyb3JzKTtcblxuICAgICAgICAgIGlmICh0aGlzLmFzc2V0Q2FjaGUpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgeyBpbmZvLCBuYW1lLCBzb3VyY2UgfSBvZiBjaGlsZENvbXBpbGF0aW9uLmdldEFzc2V0cygpKSB7XG4gICAgICAgICAgICAgIC8vIFVzZSB0aGUgb3JpZ2luYXRpbmcgZmlsZSBhcyB0aGUgY2FjaGUga2V5IGlmIHByZXNlbnRcbiAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCBnZW5lcmF0ZSBhIGNhY2hlIGtleSBiYXNlZCBvbiB0aGUgZ2VuZXJhdGVkIG5hbWVcbiAgICAgICAgICAgICAgY29uc3QgY2FjaGVLZXkgPSBpbmZvLnNvdXJjZUZpbGVuYW1lID8/IGAhIVtHRU5FUkFURURdOiR7bmFtZX1gO1xuXG4gICAgICAgICAgICAgIHRoaXMuYXNzZXRDYWNoZS5zZXQoY2FjaGVLZXksIHsgaW5mbywgbmFtZSwgc291cmNlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgIGNvbnRlbnQ6IGZpbmFsQ29udGVudCA/PyAnJyxcbiAgICAgICAgICBzdWNjZXNzOiBjaGlsZENvbXBpbGF0aW9uLmVycm9ycz8ubGVuZ3RoID09PSAwLFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfZXZhbHVhdGUoZmlsZW5hbWU6IHN0cmluZywgc291cmNlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICAvLyBFdmFsdWF0ZSBjb2RlXG5cbiAgICAvLyBjc3MtbG9hZGVyIHJlcXVpcmVzIHRoZSBidG9hIGZ1bmN0aW9uIHRvIGV4aXN0IHRvIGNvcnJlY3RseSBnZW5lcmF0ZSBpbmxpbmUgc291cmNlbWFwc1xuICAgIGNvbnN0IGNvbnRleHQ6IHsgYnRvYTogKGlucHV0OiBzdHJpbmcpID0+IHN0cmluZzsgcmVzb3VyY2U/OiBzdHJpbmcgfCB7IGRlZmF1bHQ/OiBzdHJpbmcgfSB9ID0ge1xuICAgICAgYnRvYShpbnB1dCkge1xuICAgICAgICByZXR1cm4gQnVmZmVyLmZyb20oaW5wdXQpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICB2bS5ydW5Jbk5ld0NvbnRleHQoc291cmNlLCBjb250ZXh0LCB7IGZpbGVuYW1lIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gRXJyb3IgYXJlIHByb3BhZ2F0ZWQgdGhyb3VnaCB0aGUgY2hpbGQgY29tcGlsYXRpb24uXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNvbnRleHQucmVzb3VyY2UgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gY29udGV4dC5yZXNvdXJjZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb250ZXh0LnJlc291cmNlPy5kZWZhdWx0ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGNvbnRleHQucmVzb3VyY2UuZGVmYXVsdDtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSBsb2FkZXIgXCIke2ZpbGVuYW1lfVwiIGRpZG4ndCByZXR1cm4gYSBzdHJpbmcuYCk7XG4gIH1cblxuICBhc3luYyBnZXQoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgbm9ybWFsaXplZEZpbGUgPSBub3JtYWxpemVQYXRoKGZpbGVQYXRoKTtcbiAgICBsZXQgY29tcGlsYXRpb25SZXN1bHQgPSB0aGlzLmZpbGVDYWNoZT8uZ2V0KG5vcm1hbGl6ZWRGaWxlKTtcblxuICAgIGlmIChjb21waWxhdGlvblJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBjYWNoZSBtaXNzIHNvIGNvbXBpbGUgcmVzb3VyY2VcbiAgICAgIGNvbXBpbGF0aW9uUmVzdWx0ID0gYXdhaXQgdGhpcy5fY29tcGlsZShmaWxlUGF0aCk7XG5cbiAgICAgIC8vIE9ubHkgY2FjaGUgaWYgY29tcGlsYXRpb24gd2FzIHN1Y2Nlc3NmdWxcbiAgICAgIGlmICh0aGlzLmZpbGVDYWNoZSAmJiBjb21waWxhdGlvblJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgIHRoaXMuZmlsZUNhY2hlLnNldChub3JtYWxpemVkRmlsZSwgY29tcGlsYXRpb25SZXN1bHQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb21waWxhdGlvblJlc3VsdC5jb250ZW50O1xuICB9XG5cbiAgYXN5bmMgcHJvY2VzcyhcbiAgICBkYXRhOiBzdHJpbmcsXG4gICAgZmlsZUV4dGVuc2lvbjogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICAgIHJlc291cmNlVHlwZTogJ3RlbXBsYXRlJyB8ICdzdHlsZScsXG4gICAgY29udGFpbmluZ0ZpbGU/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKGRhdGEudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBpbGF0aW9uUmVzdWx0ID0gYXdhaXQgdGhpcy5fY29tcGlsZShcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIGRhdGEsXG4gICAgICBmaWxlRXh0ZW5zaW9uLFxuICAgICAgcmVzb3VyY2VUeXBlLFxuICAgICAgY29udGFpbmluZ0ZpbGUsXG4gICAgKTtcblxuICAgIHJldHVybiBjb21waWxhdGlvblJlc3VsdC5jb250ZW50O1xuICB9XG59XG4iXX0=