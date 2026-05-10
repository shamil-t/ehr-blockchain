/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderOutput } from '@angular-devkit/architect';
import type { logging } from '@angular-devkit/core';
import { ExecutionResult, RebuildState } from '../../tools/esbuild/bundler-execution-result';
import { NormalizedCachedOptions } from '../../utils/normalize-cache';
export declare function runEsBuildBuildAction(action: (rebuildState?: RebuildState) => ExecutionResult | Promise<ExecutionResult>, options: {
    workspaceRoot: string;
    projectRoot: string;
    outputPath: string;
    logger: logging.LoggerApi;
    cacheOptions: NormalizedCachedOptions;
    writeToFileSystem?: boolean;
    watch?: boolean;
    verbose?: boolean;
    progress?: boolean;
    deleteOutputPath?: boolean;
    poll?: number;
}): AsyncIterable<(ExecutionResult['outputWithFiles'] | ExecutionResult['output']) & BuilderOutput>;
