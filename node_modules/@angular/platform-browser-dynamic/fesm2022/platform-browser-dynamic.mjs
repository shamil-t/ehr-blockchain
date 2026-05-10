/**
 * @license Angular v16.2.12
 * (c) 2010-2022 Google LLC. https://angular.io/
 * License: MIT
 */

import { CompilerConfig, ResourceLoader } from '@angular/compiler';
import * as i0 from '@angular/core';
import { Compiler, ViewEncapsulation, MissingTranslationStrategy, Injector, createPlatformFactory, platformCore, COMPILER_OPTIONS, CompilerFactory, Injectable, PLATFORM_ID, ɵglobal, Version } from '@angular/core';
import { ɵPLATFORM_BROWSER_ID } from '@angular/common';
import { ɵINTERNAL_BROWSER_PLATFORM_PROVIDERS } from '@angular/platform-browser';

const COMPILER_PROVIDERS = [{ provide: Compiler, useFactory: () => new Compiler() }];
/**
 * @publicApi
 *
 * @deprecated
 * Ivy JIT mode doesn't require accessing this symbol.
 * See [JIT API changes due to ViewEngine deprecation](guide/deprecations#jit-api-changes) for
 * additional context.
 */
class JitCompilerFactory {
    /** @internal */
    constructor(defaultOptions) {
        const compilerOptions = {
            useJit: true,
            defaultEncapsulation: ViewEncapsulation.Emulated,
            missingTranslation: MissingTranslationStrategy.Warning,
        };
        this._defaultOptions = [compilerOptions, ...defaultOptions];
    }
    createCompiler(options = []) {
        const opts = _mergeOptions(this._defaultOptions.concat(options));
        const injector = Injector.create({
            providers: [
                COMPILER_PROVIDERS, {
                    provide: CompilerConfig,
                    useFactory: () => {
                        return new CompilerConfig({
                            // let explicit values from the compiler options overwrite options
                            // from the app providers
                            useJit: opts.useJit,
                            // let explicit values from the compiler options overwrite options
                            // from the app providers
                            defaultEncapsulation: opts.defaultEncapsulation,
                            missingTranslation: opts.missingTranslation,
                            preserveWhitespaces: opts.preserveWhitespaces,
                        });
                    },
                    deps: []
                },
                opts.providers
            ]
        });
        return injector.get(Compiler);
    }
}
function _mergeOptions(optionsArr) {
    return {
        useJit: _lastDefined(optionsArr.map(options => options.useJit)),
        defaultEncapsulation: _lastDefined(optionsArr.map(options => options.defaultEncapsulation)),
        providers: _mergeArrays(optionsArr.map(options => options.providers)),
        missingTranslation: _lastDefined(optionsArr.map(options => options.missingTranslation)),
        preserveWhitespaces: _lastDefined(optionsArr.map(options => options.preserveWhitespaces)),
    };
}
function _lastDefined(args) {
    for (let i = args.length - 1; i >= 0; i--) {
        if (args[i] !== undefined) {
            return args[i];
        }
    }
    return undefined;
}
function _mergeArrays(parts) {
    const result = [];
    parts.forEach((part) => part && result.push(...part));
    return result;
}

/**
 * A platform that included corePlatform and the compiler.
 *
 * @publicApi
 */
const platformCoreDynamic = createPlatformFactory(platformCore, 'coreDynamic', [
    { provide: COMPILER_OPTIONS, useValue: {}, multi: true },
    { provide: CompilerFactory, useClass: JitCompilerFactory, deps: [COMPILER_OPTIONS] },
]);

class ResourceLoaderImpl extends ResourceLoader {
    get(url) {
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'text';
        xhr.onload = function () {
            const response = xhr.response;
            let status = xhr.status;
            // fix status code when it is 0 (0 status is undocumented).
            // Occurs when accessing file resources or on Android 4.1 stock browser
            // while retrieving files from application cache.
            if (status === 0) {
                status = response ? 200 : 0;
            }
            if (200 <= status && status <= 300) {
                resolve(response);
            }
            else {
                reject(`Failed to load ${url}`);
            }
        };
        xhr.onerror = function () {
            reject(`Failed to load ${url}`);
        };
        xhr.send();
        return promise;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: ResourceLoaderImpl, deps: null, target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: ResourceLoaderImpl }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.12", ngImport: i0, type: ResourceLoaderImpl, decorators: [{
            type: Injectable
        }] });

/**
 * @publicApi
 */
const INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS = [
    ɵINTERNAL_BROWSER_PLATFORM_PROVIDERS,
    {
        provide: COMPILER_OPTIONS,
        useValue: { providers: [{ provide: ResourceLoader, useClass: ResourceLoaderImpl, deps: [] }] },
        multi: true
    },
    { provide: PLATFORM_ID, useValue: ɵPLATFORM_BROWSER_ID },
];

/**
 * An implementation of ResourceLoader that uses a template cache to avoid doing an actual
 * ResourceLoader.
 *
 * The template cache needs to be built and loaded into window.$templateCache
 * via a separate mechanism.
 *
 * @publicApi
 *
 * @deprecated This was previously necessary in some cases to test AOT-compiled components with View
 *     Engine, but is no longer since Ivy.
 */
class CachedResourceLoader extends ResourceLoader {
    constructor() {
        super();
        this._cache = ɵglobal.$templateCache;
        if (this._cache == null) {
            throw new Error('CachedResourceLoader: Template cache was not found in $templateCache.');
        }
    }
    get(url) {
        if (this._cache.hasOwnProperty(url)) {
            return Promise.resolve(this._cache[url]);
        }
        else {
            return Promise.reject('CachedResourceLoader: Did not find cached template for ' + url);
        }
    }
}

/**
 * @module
 * @description
 * Entry point for all public APIs of the platform-browser-dynamic package.
 */
/**
 * @publicApi
 */
const VERSION = new Version('16.2.12');

/**
 * @publicApi
 *
 * @deprecated This was previously necessary in some cases to test AOT-compiled components with View
 *     Engine, but is no longer since Ivy.

 */
const RESOURCE_CACHE_PROVIDER = [{ provide: ResourceLoader, useClass: CachedResourceLoader, deps: [] }];
/**
 * @publicApi
 */
const platformBrowserDynamic = createPlatformFactory(platformCoreDynamic, 'browserDynamic', INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS);

/**
 * @module
 * @description
 * Entry point for all public APIs of this package.
 */
// This file only reexports content of the `src` folder. Keep it that way.

// This file is not used to build this module. It is only used during editing

/**
 * Generated bundle index. Do not edit.
 */

export { JitCompilerFactory, RESOURCE_CACHE_PROVIDER, VERSION, platformBrowserDynamic, INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS as ɵINTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS, platformCoreDynamic as ɵplatformCoreDynamic };
//# sourceMappingURL=platform-browser-dynamic.mjs.map
