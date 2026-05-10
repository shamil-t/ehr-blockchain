/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuildOptions, Message, Metafile, OutputFile } from 'esbuild';
export type BundleContextResult = {
    errors: Message[];
    warnings: Message[];
} | {
    errors: undefined;
    warnings: Message[];
    metafile: Metafile;
    outputFiles: OutputFile[];
    initialFiles: Map<string, InitialFileRecord>;
};
export interface InitialFileRecord {
    entrypoint: boolean;
    name?: string;
    type: 'script' | 'style';
    external?: boolean;
}
export declare class BundlerContext {
    #private;
    private workspaceRoot;
    private incremental;
    private initialFilter?;
    readonly watchFiles: Set<string>;
    constructor(workspaceRoot: string, incremental: boolean, options: BuildOptions, initialFilter?: ((initial: Readonly<InitialFileRecord>) => boolean) | undefined);
    static bundleAll(contexts: Iterable<BundlerContext>): Promise<BundleContextResult>;
    /**
     * Executes the esbuild build function and normalizes the build result in the event of a
     * build failure that results in no output being generated.
     * All builds use the `write` option with a value of `false` to allow for the output files
     * build result array to be populated.
     *
     * @returns If output files are generated, the full esbuild BuildResult; if not, the
     * warnings and errors for the attempted build.
     */
    bundle(): Promise<BundleContextResult>;
    /**
     * Disposes incremental build resources present in the context.
     *
     * @returns A promise that resolves when disposal is complete.
     */
    dispose(): Promise<void>;
}
