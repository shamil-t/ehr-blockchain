/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import type { OutputFile } from 'esbuild';
import { ApplicationBuilderInternalOptions } from './options';
import { Schema as ApplicationBuilderOptions } from './schema';
export declare function buildApplicationInternal(options: ApplicationBuilderInternalOptions, context: BuilderContext, infrastructureSettings?: {
    write?: boolean;
}): AsyncIterable<BuilderOutput & {
    outputFiles?: OutputFile[];
    assetFiles?: {
        source: string;
        destination: string;
    }[];
}>;
export declare function buildApplication(options: ApplicationBuilderOptions, context: BuilderContext): AsyncIterable<BuilderOutput & {
    outputFiles?: OutputFile[];
    assetFiles?: {
        source: string;
        destination: string;
    }[];
}>;
declare const _default: import("../../../../architect/src/internal").Builder<ApplicationBuilderOptions & import("../../../../core/src").JsonObject>;
export default _default;
