/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { BuildOptions } from 'esbuild';
import type { NormalizedApplicationBuildOptions } from '../../builders/application/options';
import { SourceFileCache } from './angular/compiler-plugin';
export declare function createBrowserCodeBundleOptions(options: NormalizedApplicationBuildOptions, target: string[], sourceFileCache?: SourceFileCache): BuildOptions;
/**
 * Create an esbuild 'build' options object for the server bundle.
 * @param options The builder's user-provider normalized options.
 * @returns An esbuild BuildOptions object.
 */
export declare function createServerCodeBundleOptions(options: NormalizedApplicationBuildOptions, target: string[], sourceFileCache: SourceFileCache): BuildOptions;
