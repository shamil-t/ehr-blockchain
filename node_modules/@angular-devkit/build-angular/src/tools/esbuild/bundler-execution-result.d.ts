/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OutputFile } from 'esbuild';
import type { ChangedFiles } from '../../tools/esbuild/watcher';
import type { SourceFileCache } from './angular/compiler-plugin';
import type { BundlerContext } from './bundler-context';
export interface RebuildState {
    rebuildContexts: BundlerContext[];
    codeBundleCache?: SourceFileCache;
    fileChanges: ChangedFiles;
}
/**
 * Represents the result of a single builder execute call.
 */
export declare class ExecutionResult {
    private rebuildContexts;
    private codeBundleCache?;
    readonly outputFiles: OutputFile[];
    readonly assetFiles: {
        source: string;
        destination: string;
    }[];
    constructor(rebuildContexts: BundlerContext[], codeBundleCache?: SourceFileCache | undefined);
    addOutputFile(path: string, content: string): void;
    get output(): {
        success: boolean;
    };
    get outputWithFiles(): {
        success: boolean;
        outputFiles: OutputFile[];
        assetFiles: {
            source: string;
            destination: string;
        }[];
    };
    get watchFiles(): string[];
    createRebuildState(fileChanges: ChangedFiles): RebuildState;
    dispose(): Promise<void>;
}
