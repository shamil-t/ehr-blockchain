/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NormalizedApplicationBuildOptions } from '../../builders/application/options';
import type { SourceFileCache, createCompilerPlugin } from './angular/compiler-plugin';
type CreateCompilerPluginParameters = Parameters<typeof createCompilerPlugin>;
export declare function createCompilerPluginOptions(options: NormalizedApplicationBuildOptions, target: string[], sourceFileCache?: SourceFileCache): {
    pluginOptions: CreateCompilerPluginParameters[0];
    styleOptions: CreateCompilerPluginParameters[1];
};
export {};
