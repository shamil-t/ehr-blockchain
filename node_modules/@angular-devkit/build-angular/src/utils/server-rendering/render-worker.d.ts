/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RenderResult, ServerContext } from './render-page';
export interface WorkerData {
    outputFiles: Record<string, string>;
    document: string;
    inlineCriticalCss?: boolean;
}
export interface RenderOptions {
    route: string;
    serverContext: ServerContext;
}
export default function (options: RenderOptions): Promise<RenderResult>;
