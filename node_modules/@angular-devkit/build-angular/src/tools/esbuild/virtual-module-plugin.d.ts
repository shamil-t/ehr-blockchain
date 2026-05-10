/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { OnLoadArgs, Plugin, PluginBuild } from 'esbuild';
/**
 * Options for the createVirtualModulePlugin
 * @see createVirtualModulePlugin
 */
export interface VirtualModulePluginOptions {
    /** Namespace. Example: `angular:polyfills`. */
    namespace: string;
    /** If the generated module should be marked as external. */
    external?: boolean;
    /** Method to transform the onResolve path. */
    transformPath?: (path: string) => string;
    /** Method to provide the module content. */
    loadContent: (args: OnLoadArgs, build: PluginBuild) => ReturnType<Parameters<PluginBuild['onLoad']>[1]>;
}
/**
 * Creates an esbuild plugin that generated virtual modules.
 *
 * @returns An esbuild plugin.
 */
export declare function createVirtualModulePlugin(options: VirtualModulePluginOptions): Plugin;
