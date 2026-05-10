/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OutputFile } from 'esbuild';
interface PrerenderOptions {
    routesFile?: string;
    discoverRoutes?: boolean;
    routes?: string[];
}
interface AppShellOptions {
    route?: string;
}
export declare function prerenderPages(workspaceRoot: string, tsConfigPath: string, appShellOptions: AppShellOptions | undefined, prerenderOptions: PrerenderOptions | undefined, outputFiles: Readonly<OutputFile[]>, document: string, inlineCriticalCss?: boolean, maxThreads?: number): Promise<{
    output: Record<string, string>;
    warnings: string[];
    errors: string[];
}>;
export {};
