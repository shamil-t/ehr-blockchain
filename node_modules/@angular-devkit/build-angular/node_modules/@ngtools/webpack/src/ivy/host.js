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
exports.augmentHostWithCaching = exports.augmentProgramWithVersioning = exports.augmentHostWithVersioning = exports.augmentHostWithSubstitutions = exports.augmentHostWithReplacements = exports.augmentHostWithDependencyCollection = exports.augmentHostWithResources = void 0;
const crypto_1 = require("crypto");
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
const paths_1 = require("./paths");
function augmentHostWithResources(host, resourceLoader, options = {}) {
    const resourceHost = host;
    resourceHost.readResource = function (fileName) {
        const filePath = (0, paths_1.normalizePath)(fileName);
        if (options.directTemplateLoading &&
            (filePath.endsWith('.html') || filePath.endsWith('.svg'))) {
            const content = this.readFile(filePath);
            if (content === undefined) {
                throw new Error('Unable to locate component resource: ' + fileName);
            }
            resourceLoader.setAffectedResources(filePath, [filePath]);
            return content;
        }
        else {
            return resourceLoader.get(filePath);
        }
    };
    resourceHost.resourceNameToFileName = function (resourceName, containingFile) {
        return path.join(path.dirname(containingFile), resourceName);
    };
    resourceHost.getModifiedResourceFiles = function () {
        return resourceLoader.getModifiedResourceFiles();
    };
    resourceHost.transformResource = async function (data, context) {
        // Only inline style resources are supported currently
        if (context.resourceFile || context.type !== 'style') {
            return null;
        }
        if (options.inlineStyleFileExtension) {
            const content = await resourceLoader.process(data, options.inlineStyleFileExtension, context.type, context.containingFile);
            return { content };
        }
        return null;
    };
}
exports.augmentHostWithResources = augmentHostWithResources;
function augmentResolveModuleNames(host, resolvedModuleModifier, moduleResolutionCache) {
    if (host.resolveModuleNames) {
        const baseResolveModuleNames = host.resolveModuleNames;
        host.resolveModuleNames = function (moduleNames, ...parameters) {
            return moduleNames.map((name) => {
                const result = baseResolveModuleNames.call(host, [name], ...parameters);
                return resolvedModuleModifier(result[0], name);
            });
        };
    }
    else {
        host.resolveModuleNames = function (moduleNames, containingFile, _reusedNames, redirectedReference, options) {
            return moduleNames.map((name) => {
                const result = ts.resolveModuleName(name, containingFile, options, host, moduleResolutionCache, redirectedReference).resolvedModule;
                return resolvedModuleModifier(result, name);
            });
        };
    }
}
/**
 * Augments a TypeScript Compiler Host's resolveModuleNames function to collect dependencies
 * of the containing file passed to the resolveModuleNames function. This process assumes
 * that consumers of the Compiler Host will only call resolveModuleNames with modules that are
 * actually present in a containing file.
 * This process is a workaround for gathering a TypeScript SourceFile's dependencies as there
 * is no currently exposed public method to do so. A BuilderProgram does have a `getAllDependencies`
 * function. However, that function returns all transitive dependencies as well which can cause
 * excessive Webpack rebuilds.
 *
 * @param host The CompilerHost to augment.
 * @param dependencies A Map which will be used to store file dependencies.
 * @param moduleResolutionCache An optional resolution cache to use when the host resolves a module.
 */
function augmentHostWithDependencyCollection(host, dependencies, moduleResolutionCache) {
    if (host.resolveModuleNames) {
        const baseResolveModuleNames = host.resolveModuleNames;
        host.resolveModuleNames = function (moduleNames, containingFile, ...parameters) {
            const results = baseResolveModuleNames.call(host, moduleNames, containingFile, ...parameters);
            const containingFilePath = (0, paths_1.normalizePath)(containingFile);
            for (const result of results) {
                if (result) {
                    const containingFileDependencies = dependencies.get(containingFilePath);
                    if (containingFileDependencies) {
                        containingFileDependencies.add(result.resolvedFileName);
                    }
                    else {
                        dependencies.set(containingFilePath, new Set([result.resolvedFileName]));
                    }
                }
            }
            return results;
        };
    }
    else {
        host.resolveModuleNames = function (moduleNames, containingFile, _reusedNames, redirectedReference, options) {
            return moduleNames.map((name) => {
                const result = ts.resolveModuleName(name, containingFile, options, host, moduleResolutionCache, redirectedReference).resolvedModule;
                if (result) {
                    const containingFilePath = (0, paths_1.normalizePath)(containingFile);
                    const containingFileDependencies = dependencies.get(containingFilePath);
                    if (containingFileDependencies) {
                        containingFileDependencies.add(result.resolvedFileName);
                    }
                    else {
                        dependencies.set(containingFilePath, new Set([result.resolvedFileName]));
                    }
                }
                return result;
            });
        };
    }
}
exports.augmentHostWithDependencyCollection = augmentHostWithDependencyCollection;
function augmentHostWithReplacements(host, replacements, moduleResolutionCache) {
    if (Object.keys(replacements).length === 0) {
        return;
    }
    const normalizedReplacements = {};
    for (const [key, value] of Object.entries(replacements)) {
        normalizedReplacements[(0, paths_1.normalizePath)(key)] = (0, paths_1.normalizePath)(value);
    }
    const tryReplace = (resolvedModule) => {
        const replacement = resolvedModule && normalizedReplacements[resolvedModule.resolvedFileName];
        if (replacement) {
            return {
                resolvedFileName: replacement,
                isExternalLibraryImport: /[/\\]node_modules[/\\]/.test(replacement),
            };
        }
        else {
            return resolvedModule;
        }
    };
    augmentResolveModuleNames(host, tryReplace, moduleResolutionCache);
}
exports.augmentHostWithReplacements = augmentHostWithReplacements;
function augmentHostWithSubstitutions(host, substitutions) {
    const regexSubstitutions = [];
    for (const [key, value] of Object.entries(substitutions)) {
        regexSubstitutions.push([new RegExp(`\\b${key}\\b`, 'g'), value]);
    }
    if (regexSubstitutions.length === 0) {
        return;
    }
    const baseReadFile = host.readFile;
    host.readFile = function (...parameters) {
        let file = baseReadFile.call(host, ...parameters);
        if (file) {
            for (const entry of regexSubstitutions) {
                file = file.replace(entry[0], entry[1]);
            }
        }
        return file;
    };
}
exports.augmentHostWithSubstitutions = augmentHostWithSubstitutions;
function augmentHostWithVersioning(host) {
    const baseGetSourceFile = host.getSourceFile;
    host.getSourceFile = function (...parameters) {
        const file = baseGetSourceFile.call(host, ...parameters);
        if (file && file.version === undefined) {
            file.version = (0, crypto_1.createHash)('sha256').update(file.text).digest('hex');
        }
        return file;
    };
}
exports.augmentHostWithVersioning = augmentHostWithVersioning;
function augmentProgramWithVersioning(program) {
    const baseGetSourceFiles = program.getSourceFiles;
    program.getSourceFiles = function (...parameters) {
        const files = baseGetSourceFiles(...parameters);
        for (const file of files) {
            if (file.version === undefined) {
                file.version = (0, crypto_1.createHash)('sha256').update(file.text).digest('hex');
            }
        }
        return files;
    };
}
exports.augmentProgramWithVersioning = augmentProgramWithVersioning;
function augmentHostWithCaching(host, cache) {
    const baseGetSourceFile = host.getSourceFile;
    host.getSourceFile = function (fileName, languageVersion, onError, shouldCreateNewSourceFile, ...parameters) {
        if (!shouldCreateNewSourceFile && cache.has(fileName)) {
            return cache.get(fileName);
        }
        const file = baseGetSourceFile.call(host, fileName, languageVersion, onError, true, ...parameters);
        if (file) {
            cache.set(fileName, file);
        }
        return file;
    };
}
exports.augmentHostWithCaching = augmentHostWithCaching;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvaXZ5L2hvc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJSCxtQ0FBb0M7QUFDcEMsMkNBQTZCO0FBQzdCLCtDQUFpQztBQUVqQyxtQ0FBd0M7QUFFeEMsU0FBZ0Isd0JBQXdCLENBQ3RDLElBQXFCLEVBQ3JCLGNBQXFDLEVBQ3JDLFVBR0ksRUFBRTtJQUVOLE1BQU0sWUFBWSxHQUFHLElBQW9CLENBQUM7SUFFMUMsWUFBWSxDQUFDLFlBQVksR0FBRyxVQUFVLFFBQWdCO1FBQ3BELE1BQU0sUUFBUSxHQUFHLElBQUEscUJBQWEsRUFBQyxRQUFRLENBQUMsQ0FBQztRQUV6QyxJQUNFLE9BQU8sQ0FBQyxxQkFBcUI7WUFDN0IsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFDekQ7WUFDQSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hDLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRTtnQkFDekIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsR0FBRyxRQUFRLENBQUMsQ0FBQzthQUNyRTtZQUVELGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRTFELE9BQU8sT0FBTyxDQUFDO1NBQ2hCO2FBQU07WUFDTCxPQUFPLGNBQWMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDckM7SUFDSCxDQUFDLENBQUM7SUFFRixZQUFZLENBQUMsc0JBQXNCLEdBQUcsVUFBVSxZQUFvQixFQUFFLGNBQXNCO1FBQzFGLE9BQU8s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ZixPQUFPLEVBQ1AsSUFBSSxFQUNKLEdBQUcsVUFBVSxDQUNkLENBQUM7UUFFRixJQUFJLElBQUksRUFBRTtZQUNSLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzNCO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDLENBQUM7QUFDSixDQUFDO0FBL0JELHdEQStCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvdW5ib3VuZC1tZXRob2QgKi9cbmltcG9ydCB0eXBlIHsgQ29tcGlsZXJIb3N0IH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJztcbmltcG9ydCB7IGNyZWF0ZUhhc2ggfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgV2VicGFja1Jlc291cmNlTG9hZGVyIH0gZnJvbSAnLi4vcmVzb3VyY2VfbG9hZGVyJztcbmltcG9ydCB7IG5vcm1hbGl6ZVBhdGggfSBmcm9tICcuL3BhdGhzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRIb3N0V2l0aFJlc291cmNlcyhcbiAgaG9zdDogdHMuQ29tcGlsZXJIb3N0LFxuICByZXNvdXJjZUxvYWRlcjogV2VicGFja1Jlc291cmNlTG9hZGVyLFxuICBvcHRpb25zOiB7XG4gICAgZGlyZWN0VGVtcGxhdGVMb2FkaW5nPzogYm9vbGVhbjtcbiAgICBpbmxpbmVTdHlsZUZpbGVFeHRlbnNpb24/OiBzdHJpbmc7XG4gIH0gPSB7fSxcbikge1xuICBjb25zdCByZXNvdXJjZUhvc3QgPSBob3N0IGFzIENvbXBpbGVySG9zdDtcblxuICByZXNvdXJjZUhvc3QucmVhZFJlc291cmNlID0gZnVuY3Rpb24gKGZpbGVOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IG5vcm1hbGl6ZVBhdGgoZmlsZU5hbWUpO1xuXG4gICAgaWYgKFxuICAgICAgb3B0aW9ucy5kaXJlY3RUZW1wbGF0ZUxvYWRpbmcgJiZcbiAgICAgIChmaWxlUGF0aC5lbmRzV2l0aCgnLmh0bWwnKSB8fCBmaWxlUGF0aC5lbmRzV2l0aCgnLnN2ZycpKVxuICAgICkge1xuICAgICAgY29uc3QgY29udGVudCA9IHRoaXMucmVhZEZpbGUoZmlsZVBhdGgpO1xuICAgICAgaWYgKGNvbnRlbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBsb2NhdGUgY29tcG9uZW50IHJlc291cmNlOiAnICsgZmlsZU5hbWUpO1xuICAgICAgfVxuXG4gICAgICByZXNvdXJjZUxvYWRlci5zZXRBZmZlY3RlZFJlc291cmNlcyhmaWxlUGF0aCwgW2ZpbGVQYXRoXSk7XG5cbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcmVzb3VyY2VMb2FkZXIuZ2V0KGZpbGVQYXRoKTtcbiAgICB9XG4gIH07XG5cbiAgcmVzb3VyY2VIb3N0LnJlc291cmNlTmFtZVRvRmlsZU5hbWUgPSBmdW5jdGlvbiAocmVzb3VyY2VOYW1lOiBzdHJpbmcsIGNvbnRhaW5pbmdGaWxlOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gcGF0aC5qb2luKHBhdGguZGlybmFtZShjb250YWluaW5nRmlsZSksIHJlc291cmNlTmFtZSk7XG4gIH07XG5cbiAgcmVzb3VyY2VIb3N0LmdldE1vZGlmaWVkUmVzb3VyY2VGaWxlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gcmVzb3VyY2VMb2FkZXIuZ2V0TW9kaWZpZWRSZXNvdXJjZUZpbGVzKCk7XG4gIH07XG5cbiAgcmVzb3VyY2VIb3N0LnRyYW5zZm9ybVJlc291cmNlID0gYXN5bmMgZnVuY3Rpb24gKGRhdGEsIGNvbnRleHQpIHtcbiAgICAvLyBPbmx5IGlubGluZSBzdHlsZSByZXNvdXJjZXMgYXJlIHN1cHBvcnRlZCBjdXJyZW50bHlcbiAgICBpZiAoY29udGV4dC5yZXNvdXJjZUZpbGUgfHwgY29udGV4dC50eXBlICE9PSAnc3R5bGUnKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5pbmxpbmVTdHlsZUZpbGVFeHRlbnNpb24pIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCByZXNvdXJjZUxvYWRlci5wcm9jZXNzKFxuICAgICAgICBkYXRhLFxuICAgICAgICBvcHRpb25zLmlubGluZVN0eWxlRmlsZUV4dGVuc2lvbixcbiAgICAgICAgY29udGV4dC50eXBlLFxuICAgICAgICBjb250ZXh0LmNvbnRhaW5pbmdGaWxlLFxuICAgICAgKTtcblxuICAgICAgcmV0dXJuIHsgY29udGVudCB9O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9O1xufVxuXG5mdW5jdGlvbiBhdWdtZW50UmVzb2x2ZU1vZHVsZU5hbWVzKFxuICBob3N0OiB0cy5Db21waWxlckhvc3QsXG4gIHJlc29sdmVkTW9kdWxlTW9kaWZpZXI6IChcbiAgICByZXNvbHZlZE1vZHVsZTogdHMuUmVzb2x2ZWRNb2R1bGUgfCB1bmRlZmluZWQsXG4gICAgbW9kdWxlTmFtZTogc3RyaW5nLFxuICApID0+IHRzLlJlc29sdmVkTW9kdWxlIHwgdW5kZWZpbmVkLFxuICBtb2R1bGVSZXNvbHV0aW9uQ2FjaGU/OiB0cy5Nb2R1bGVSZXNvbHV0aW9uQ2FjaGUsXG4pOiB2b2lkIHtcbiAgaWYgKGhvc3QucmVzb2x2ZU1vZHVsZU5hbWVzKSB7XG4gICAgY29uc3QgYmFzZVJlc29sdmVNb2R1bGVOYW1lcyA9IGhvc3QucmVzb2x2ZU1vZHVsZU5hbWVzO1xuICAgIGhvc3QucmVzb2x2ZU1vZHVsZU5hbWVzID0gZnVuY3Rpb24gKG1vZHVsZU5hbWVzOiBzdHJpbmdbXSwgLi4ucGFyYW1ldGVycykge1xuICAgICAgcmV0dXJuIG1vZHVsZU5hbWVzLm1hcCgobmFtZSkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBiYXNlUmVzb2x2ZU1vZHVsZU5hbWVzLmNhbGwoaG9zdCwgW25hbWVdLCAuLi5wYXJhbWV0ZXJzKTtcblxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRNb2R1bGVNb2RpZmllcihyZXN1bHRbMF0sIG5hbWUpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBob3N0LnJlc29sdmVNb2R1bGVOYW1lcyA9IGZ1bmN0aW9uIChcbiAgICAgIG1vZHVsZU5hbWVzOiBzdHJpbmdbXSxcbiAgICAgIGNvbnRhaW5pbmdGaWxlOiBzdHJpbmcsXG4gICAgICBfcmV1c2VkTmFtZXM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuICAgICAgcmVkaXJlY3RlZFJlZmVyZW5jZTogdHMuUmVzb2x2ZWRQcm9qZWN0UmVmZXJlbmNlIHwgdW5kZWZpbmVkLFxuICAgICAgb3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zLFxuICAgICkge1xuICAgICAgcmV0dXJuIG1vZHVsZU5hbWVzLm1hcCgobmFtZSkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0cy5yZXNvbHZlTW9kdWxlTmFtZShcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIGNvbnRhaW5pbmdGaWxlLFxuICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgaG9zdCxcbiAgICAgICAgICBtb2R1bGVSZXNvbHV0aW9uQ2FjaGUsXG4gICAgICAgICAgcmVkaXJlY3RlZFJlZmVyZW5jZSxcbiAgICAgICAgKS5yZXNvbHZlZE1vZHVsZTtcblxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRNb2R1bGVNb2RpZmllcihyZXN1bHQsIG5hbWUpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIEF1Z21lbnRzIGEgVHlwZVNjcmlwdCBDb21waWxlciBIb3N0J3MgcmVzb2x2ZU1vZHVsZU5hbWVzIGZ1bmN0aW9uIHRvIGNvbGxlY3QgZGVwZW5kZW5jaWVzXG4gKiBvZiB0aGUgY29udGFpbmluZyBmaWxlIHBhc3NlZCB0byB0aGUgcmVzb2x2ZU1vZHVsZU5hbWVzIGZ1bmN0aW9uLiBUaGlzIHByb2Nlc3MgYXNzdW1lc1xuICogdGhhdCBjb25zdW1lcnMgb2YgdGhlIENvbXBpbGVyIEhvc3Qgd2lsbCBvbmx5IGNhbGwgcmVzb2x2ZU1vZHVsZU5hbWVzIHdpdGggbW9kdWxlcyB0aGF0IGFyZVxuICogYWN0dWFsbHkgcHJlc2VudCBpbiBhIGNvbnRhaW5pbmcgZmlsZS5cbiAqIFRoaXMgcHJvY2VzcyBpcyBhIHdvcmthcm91bmQgZm9yIGdhdGhlcmluZyBhIFR5cGVTY3JpcHQgU291cmNlRmlsZSdzIGRlcGVuZGVuY2llcyBhcyB0aGVyZVxuICogaXMgbm8gY3VycmVudGx5IGV4cG9zZWQgcHVibGljIG1ldGhvZCB0byBkbyBzby4gQSBCdWlsZGVyUHJvZ3JhbSBkb2VzIGhhdmUgYSBgZ2V0QWxsRGVwZW5kZW5jaWVzYFxuICogZnVuY3Rpb24uIEhvd2V2ZXIsIHRoYXQgZnVuY3Rpb24gcmV0dXJucyBhbGwgdHJhbnNpdGl2ZSBkZXBlbmRlbmNpZXMgYXMgd2VsbCB3aGljaCBjYW4gY2F1c2VcbiAqIGV4Y2Vzc2l2ZSBXZWJwYWNrIHJlYnVpbGRzLlxuICpcbiAqIEBwYXJhbSBob3N0IFRoZSBDb21waWxlckhvc3QgdG8gYXVnbWVudC5cbiAqIEBwYXJhbSBkZXBlbmRlbmNpZXMgQSBNYXAgd2hpY2ggd2lsbCBiZSB1c2VkIHRvIHN0b3JlIGZpbGUgZGVwZW5kZW5jaWVzLlxuICogQHBhcmFtIG1vZHVsZVJlc29sdXRpb25DYWNoZSBBbiBvcHRpb25hbCByZXNvbHV0aW9uIGNhY2hlIHRvIHVzZSB3aGVuIHRoZSBob3N0IHJlc29sdmVzIGEgbW9kdWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudEhvc3RXaXRoRGVwZW5kZW5jeUNvbGxlY3Rpb24oXG4gIGhvc3Q6IHRzLkNvbXBpbGVySG9zdCxcbiAgZGVwZW5kZW5jaWVzOiBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4sXG4gIG1vZHVsZVJlc29sdXRpb25DYWNoZT86IHRzLk1vZHVsZVJlc29sdXRpb25DYWNoZSxcbik6IHZvaWQge1xuICBpZiAoaG9zdC5yZXNvbHZlTW9kdWxlTmFtZXMpIHtcbiAgICBjb25zdCBiYXNlUmVzb2x2ZU1vZHVsZU5hbWVzID0gaG9zdC5yZXNvbHZlTW9kdWxlTmFtZXM7XG4gICAgaG9zdC5yZXNvbHZlTW9kdWxlTmFtZXMgPSBmdW5jdGlvbiAoXG4gICAgICBtb2R1bGVOYW1lczogc3RyaW5nW10sXG4gICAgICBjb250YWluaW5nRmlsZTogc3RyaW5nLFxuICAgICAgLi4ucGFyYW1ldGVyc1xuICAgICkge1xuICAgICAgY29uc3QgcmVzdWx0cyA9IGJhc2VSZXNvbHZlTW9kdWxlTmFtZXMuY2FsbChob3N0LCBtb2R1bGVOYW1lcywgY29udGFpbmluZ0ZpbGUsIC4uLnBhcmFtZXRlcnMpO1xuXG4gICAgICBjb25zdCBjb250YWluaW5nRmlsZVBhdGggPSBub3JtYWxpemVQYXRoKGNvbnRhaW5pbmdGaWxlKTtcbiAgICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIHJlc3VsdHMpIHtcbiAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgIGNvbnN0IGNvbnRhaW5pbmdGaWxlRGVwZW5kZW5jaWVzID0gZGVwZW5kZW5jaWVzLmdldChjb250YWluaW5nRmlsZVBhdGgpO1xuICAgICAgICAgIGlmIChjb250YWluaW5nRmlsZURlcGVuZGVuY2llcykge1xuICAgICAgICAgICAgY29udGFpbmluZ0ZpbGVEZXBlbmRlbmNpZXMuYWRkKHJlc3VsdC5yZXNvbHZlZEZpbGVOYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzLnNldChjb250YWluaW5nRmlsZVBhdGgsIG5ldyBTZXQoW3Jlc3VsdC5yZXNvbHZlZEZpbGVOYW1lXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGhvc3QucmVzb2x2ZU1vZHVsZU5hbWVzID0gZnVuY3Rpb24gKFxuICAgICAgbW9kdWxlTmFtZXM6IHN0cmluZ1tdLFxuICAgICAgY29udGFpbmluZ0ZpbGU6IHN0cmluZyxcbiAgICAgIF9yZXVzZWROYW1lczogc3RyaW5nW10gfCB1bmRlZmluZWQsXG4gICAgICByZWRpcmVjdGVkUmVmZXJlbmNlOiB0cy5SZXNvbHZlZFByb2plY3RSZWZlcmVuY2UgfCB1bmRlZmluZWQsXG4gICAgICBvcHRpb25zOiB0cy5Db21waWxlck9wdGlvbnMsXG4gICAgKSB7XG4gICAgICByZXR1cm4gbW9kdWxlTmFtZXMubWFwKChuYW1lKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRzLnJlc29sdmVNb2R1bGVOYW1lKFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgY29udGFpbmluZ0ZpbGUsXG4gICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICBob3N0LFxuICAgICAgICAgIG1vZHVsZVJlc29sdXRpb25DYWNoZSxcbiAgICAgICAgICByZWRpcmVjdGVkUmVmZXJlbmNlLFxuICAgICAgICApLnJlc29sdmVkTW9kdWxlO1xuXG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICBjb25zdCBjb250YWluaW5nRmlsZVBhdGggPSBub3JtYWxpemVQYXRoKGNvbnRhaW5pbmdGaWxlKTtcbiAgICAgICAgICBjb25zdCBjb250YWluaW5nRmlsZURlcGVuZGVuY2llcyA9IGRlcGVuZGVuY2llcy5nZXQoY29udGFpbmluZ0ZpbGVQYXRoKTtcbiAgICAgICAgICBpZiAoY29udGFpbmluZ0ZpbGVEZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgICAgIGNvbnRhaW5pbmdGaWxlRGVwZW5kZW5jaWVzLmFkZChyZXN1bHQucmVzb2x2ZWRGaWxlTmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlcGVuZGVuY2llcy5zZXQoY29udGFpbmluZ0ZpbGVQYXRoLCBuZXcgU2V0KFtyZXN1bHQucmVzb2x2ZWRGaWxlTmFtZV0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudEhvc3RXaXRoUmVwbGFjZW1lbnRzKFxuICBob3N0OiB0cy5Db21waWxlckhvc3QsXG4gIHJlcGxhY2VtZW50czogUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbiAgbW9kdWxlUmVzb2x1dGlvbkNhY2hlPzogdHMuTW9kdWxlUmVzb2x1dGlvbkNhY2hlLFxuKTogdm9pZCB7XG4gIGlmIChPYmplY3Qua2V5cyhyZXBsYWNlbWVudHMpLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG5vcm1hbGl6ZWRSZXBsYWNlbWVudHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocmVwbGFjZW1lbnRzKSkge1xuICAgIG5vcm1hbGl6ZWRSZXBsYWNlbWVudHNbbm9ybWFsaXplUGF0aChrZXkpXSA9IG5vcm1hbGl6ZVBhdGgodmFsdWUpO1xuICB9XG5cbiAgY29uc3QgdHJ5UmVwbGFjZSA9IChyZXNvbHZlZE1vZHVsZTogdHMuUmVzb2x2ZWRNb2R1bGUgfCB1bmRlZmluZWQpID0+IHtcbiAgICBjb25zdCByZXBsYWNlbWVudCA9IHJlc29sdmVkTW9kdWxlICYmIG5vcm1hbGl6ZWRSZXBsYWNlbWVudHNbcmVzb2x2ZWRNb2R1bGUucmVzb2x2ZWRGaWxlTmFtZV07XG4gICAgaWYgKHJlcGxhY2VtZW50KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXNvbHZlZEZpbGVOYW1lOiByZXBsYWNlbWVudCxcbiAgICAgICAgaXNFeHRlcm5hbExpYnJhcnlJbXBvcnQ6IC9bL1xcXFxdbm9kZV9tb2R1bGVzWy9cXFxcXS8udGVzdChyZXBsYWNlbWVudCksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZWRNb2R1bGU7XG4gICAgfVxuICB9O1xuXG4gIGF1Z21lbnRSZXNvbHZlTW9kdWxlTmFtZXMoaG9zdCwgdHJ5UmVwbGFjZSwgbW9kdWxlUmVzb2x1dGlvbkNhY2hlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRIb3N0V2l0aFN1YnN0aXR1dGlvbnMoXG4gIGhvc3Q6IHRzLkNvbXBpbGVySG9zdCxcbiAgc3Vic3RpdHV0aW9uczogUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbik6IHZvaWQge1xuICBjb25zdCByZWdleFN1YnN0aXR1dGlvbnM6IFtSZWdFeHAsIHN0cmluZ11bXSA9IFtdO1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzdWJzdGl0dXRpb25zKSkge1xuICAgIHJlZ2V4U3Vic3RpdHV0aW9ucy5wdXNoKFtuZXcgUmVnRXhwKGBcXFxcYiR7a2V5fVxcXFxiYCwgJ2cnKSwgdmFsdWVdKTtcbiAgfVxuXG4gIGlmIChyZWdleFN1YnN0aXR1dGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgYmFzZVJlYWRGaWxlID0gaG9zdC5yZWFkRmlsZTtcbiAgaG9zdC5yZWFkRmlsZSA9IGZ1bmN0aW9uICguLi5wYXJhbWV0ZXJzKSB7XG4gICAgbGV0IGZpbGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IGJhc2VSZWFkRmlsZS5jYWxsKGhvc3QsIC4uLnBhcmFtZXRlcnMpO1xuICAgIGlmIChmaWxlKSB7XG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHJlZ2V4U3Vic3RpdHV0aW9ucykge1xuICAgICAgICBmaWxlID0gZmlsZS5yZXBsYWNlKGVudHJ5WzBdLCBlbnRyeVsxXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbGU7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhdWdtZW50SG9zdFdpdGhWZXJzaW9uaW5nKGhvc3Q6IHRzLkNvbXBpbGVySG9zdCk6IHZvaWQge1xuICBjb25zdCBiYXNlR2V0U291cmNlRmlsZSA9IGhvc3QuZ2V0U291cmNlRmlsZTtcbiAgaG9zdC5nZXRTb3VyY2VGaWxlID0gZnVuY3Rpb24gKC4uLnBhcmFtZXRlcnMpIHtcbiAgICBjb25zdCBmaWxlOiAodHMuU291cmNlRmlsZSAmIHsgdmVyc2lvbj86IHN0cmluZyB9KSB8IHVuZGVmaW5lZCA9IGJhc2VHZXRTb3VyY2VGaWxlLmNhbGwoXG4gICAgICBob3N0LFxuICAgICAgLi4ucGFyYW1ldGVycyxcbiAgICApO1xuICAgIGlmIChmaWxlICYmIGZpbGUudmVyc2lvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBmaWxlLnZlcnNpb24gPSBjcmVhdGVIYXNoKCdzaGEyNTYnKS51cGRhdGUoZmlsZS50ZXh0KS5kaWdlc3QoJ2hleCcpO1xuICAgIH1cblxuICAgIHJldHVybiBmaWxlO1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudFByb2dyYW1XaXRoVmVyc2lvbmluZyhwcm9ncmFtOiB0cy5Qcm9ncmFtKTogdm9pZCB7XG4gIGNvbnN0IGJhc2VHZXRTb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0U291cmNlRmlsZXM7XG4gIHByb2dyYW0uZ2V0U291cmNlRmlsZXMgPSBmdW5jdGlvbiAoLi4ucGFyYW1ldGVycykge1xuICAgIGNvbnN0IGZpbGVzOiByZWFkb25seSAodHMuU291cmNlRmlsZSAmIHsgdmVyc2lvbj86IHN0cmluZyB9KVtdID0gYmFzZUdldFNvdXJjZUZpbGVzKFxuICAgICAgLi4ucGFyYW1ldGVycyxcbiAgICApO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICBpZiAoZmlsZS52ZXJzaW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZmlsZS52ZXJzaW9uID0gY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKGZpbGUudGV4dCkuZGlnZXN0KCdoZXgnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmlsZXM7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhdWdtZW50SG9zdFdpdGhDYWNoaW5nKFxuICBob3N0OiB0cy5Db21waWxlckhvc3QsXG4gIGNhY2hlOiBNYXA8c3RyaW5nLCB0cy5Tb3VyY2VGaWxlPixcbik6IHZvaWQge1xuICBjb25zdCBiYXNlR2V0U291cmNlRmlsZSA9IGhvc3QuZ2V0U291cmNlRmlsZTtcbiAgaG9zdC5nZXRTb3VyY2VGaWxlID0gZnVuY3Rpb24gKFxuICAgIGZpbGVOYW1lLFxuICAgIGxhbmd1YWdlVmVyc2lvbixcbiAgICBvbkVycm9yLFxuICAgIHNob3VsZENyZWF0ZU5ld1NvdXJjZUZpbGUsXG4gICAgLi4ucGFyYW1ldGVyc1xuICApIHtcbiAgICBpZiAoIXNob3VsZENyZWF0ZU5ld1NvdXJjZUZpbGUgJiYgY2FjaGUuaGFzKGZpbGVOYW1lKSkge1xuICAgICAgcmV0dXJuIGNhY2hlLmdldChmaWxlTmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9IGJhc2VHZXRTb3VyY2VGaWxlLmNhbGwoXG4gICAgICBob3N0LFxuICAgICAgZmlsZU5hbWUsXG4gICAgICBsYW5ndWFnZVZlcnNpb24sXG4gICAgICBvbkVycm9yLFxuICAgICAgdHJ1ZSxcbiAgICAgIC4uLnBhcmFtZXRlcnMsXG4gICAgKTtcblxuICAgIGlmIChmaWxlKSB7XG4gICAgICBjYWNoZS5zZXQoZmlsZU5hbWUsIGZpbGUpO1xuICAgIH1cblxuICAgIHJldHVybiBmaWxlO1xuICB9O1xufVxuIl19