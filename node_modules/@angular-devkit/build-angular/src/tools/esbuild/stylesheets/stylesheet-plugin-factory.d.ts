/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import type { OnLoadResult, Plugin, PluginBuild } from 'esbuild';
import { LoadResultCache } from '../load-result-cache';
/**
 * An object containing the plugin options to use when processing stylesheets.
 */
export interface StylesheetPluginOptions {
    /**
     * Controls the use and creation of sourcemaps when processing the stylesheets.
     * If true, sourcemap processing is enabled; if false, disabled.
     */
    sourcemap: boolean;
    /**
     * An optional array of paths that will be searched for stylesheets if the default
     * resolution process for the stylesheet language does not succeed.
     */
    includePaths?: string[];
    /**
     * Optional component data for any inline styles from Component decorator `styles` fields.
     * The key is an internal angular resource URI and the value is the stylesheet content.
     */
    inlineComponentData?: Record<string, string>;
    /**
     * Optional information used to load and configure Tailwind CSS. If present, the postcss
     * will be added to the stylesheet processing with the Tailwind plugin setup as provided
     * by the configuration file.
     */
    tailwindConfiguration?: {
        file: string;
        package: string;
    };
}
export interface StylesheetLanguage {
    name: string;
    componentFilter: RegExp;
    fileFilter: RegExp;
    process?(data: string, file: string, format: string, options: StylesheetPluginOptions, build: PluginBuild): OnLoadResult | Promise<OnLoadResult>;
}
export declare class StylesheetPluginFactory {
    private readonly options;
    private readonly cache?;
    private postcssProcessor?;
    constructor(options: StylesheetPluginOptions, cache?: LoadResultCache | undefined);
    create(language: Readonly<StylesheetLanguage>): Plugin;
}
