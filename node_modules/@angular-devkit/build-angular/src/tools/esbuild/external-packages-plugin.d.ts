/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { Plugin } from 'esbuild';
/**
 * Creates a plugin that marks any resolved path as external if it is within a node modules directory.
 * This is used instead of the esbuild `packages` option to avoid marking bare specifiers that use
 * tsconfig path mapping to resolve to a workspace relative path. This is common for monorepos that
 * contain libraries that are built along with the application. These libraries should not be considered
 *
 * @returns An esbuild plugin.
 */
export declare function createExternalPackagesPlugin(): Plugin;
