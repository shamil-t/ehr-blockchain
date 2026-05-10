/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { BuildOptions } from 'esbuild';
import { NormalizedApplicationBuildOptions } from '../../builders/application/options';
import { LoadResultCache } from './load-result-cache';
export declare function createGlobalStylesBundleOptions(options: NormalizedApplicationBuildOptions, target: string[], initial: boolean, cache?: LoadResultCache): BuildOptions | undefined;
