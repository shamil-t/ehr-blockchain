/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { ApplicationRef, Type } from '@angular/core';
import type { renderApplication, renderModule, ɵSERVER_CONTEXT } from '@angular/platform-server';
export interface RenderOptions {
    route: string;
    serverContext: ServerContext;
    outputFiles: Record<string, string>;
    document: string;
    inlineCriticalCss?: boolean;
    loadBundle?: (path: string) => Promise<MainServerBundleExports>;
}
export interface RenderResult {
    errors?: string[];
    warnings?: string[];
    content?: string;
}
export type ServerContext = 'app-shell' | 'ssg' | 'ssr';
interface MainServerBundleExports {
    /** An internal token that allows providing extra information about the server context. */
    ɵSERVER_CONTEXT: typeof ɵSERVER_CONTEXT;
    /** Render an NgModule application. */
    renderModule: typeof renderModule;
    /** Method to render a standalone application. */
    renderApplication: typeof renderApplication;
    /** Standalone application bootstrapping function. */
    default: (() => Promise<ApplicationRef>) | Type<unknown>;
}
/**
 * Renders each route in routes and writes them to <outputPath>/<route>/index.html.
 */
export declare function renderPage({ route, serverContext, document, inlineCriticalCss, outputFiles, loadBundle, }: RenderOptions): Promise<RenderResult>;
export {};
