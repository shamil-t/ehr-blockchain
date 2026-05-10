"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sassBindWorkaround = exports.LoadPathsUrlRebasingImporter = exports.ModuleUrlRebasingImporter = exports.RelativeUrlRebasingImporter = void 0;
const magic_string_1 = __importDefault(require("magic-string"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
const lexer_1 = require("./lexer");
/**
 * A prefix that is added to import and use directive specifiers that should be resolved
 * as modules and that will contain added resolve directory information.
 *
 * This functionality is used to workaround the Sass limitation that it does not provide the
 * importer file to custom resolution plugins.
 */
const MODULE_RESOLUTION_PREFIX = '__NG_PACKAGE__';
function packModuleSpecifier(specifier, resolveDir) {
    const packed = MODULE_RESOLUTION_PREFIX +
        ';' +
        // Encode the resolve directory to prevent unsupported characters from being present when
        // Sass processes the URL. This is important on Windows which can contain drive letters
        // and colons which would otherwise be interpreted as a URL scheme.
        encodeURIComponent(resolveDir) +
        ';' +
        // Escape characters instead of encoding to provide more friendly not found error messages.
        // Unescaping is automatically handled by Sass.
        // https://developer.mozilla.org/en-US/docs/Web/CSS/url#syntax
        specifier.replace(/[()\s'"]/g, '\\$&');
    return packed;
}
function unpackModuleSpecifier(specifier) {
    if (!specifier.startsWith(`${MODULE_RESOLUTION_PREFIX};`)) {
        return { specifier };
    }
    const values = specifier.split(';', 3);
    return {
        specifier: values[2],
        resolveDir: decodeURIComponent(values[1]),
    };
}
/**
 * A Sass Importer base class that provides the load logic to rebase all `url()` functions
 * within a stylesheet. The rebasing will ensure that the URLs in the output of the Sass compiler
 * reflect the final filesystem location of the output CSS file.
 *
 * This class provides the core of the rebasing functionality. To ensure that each file is processed
 * by this importer's load implementation, the Sass compiler requires the importer's canonicalize
 * function to return a non-null value with the resolved location of the requested stylesheet.
 * Concrete implementations of this class must provide this canonicalize functionality for rebasing
 * to be effective.
 */
class UrlRebasingImporter {
    /**
     * @param entryDirectory The directory of the entry stylesheet that was passed to the Sass compiler.
     * @param rebaseSourceMaps When provided, rebased files will have an intermediate sourcemap added to the Map
     * which can be used to generate a final sourcemap that contains original sources.
     */
    constructor(entryDirectory, rebaseSourceMaps) {
        this.entryDirectory = entryDirectory;
        this.rebaseSourceMaps = rebaseSourceMaps;
    }
    load(canonicalUrl) {
        const stylesheetPath = (0, node_url_1.fileURLToPath)(canonicalUrl);
        const stylesheetDirectory = (0, node_path_1.dirname)(stylesheetPath);
        let contents = (0, node_fs_1.readFileSync)(stylesheetPath, 'utf-8');
        // Rebase any URLs that are found
        let updatedContents;
        for (const { start, end, value } of (0, lexer_1.findUrls)(contents)) {
            // Skip if value is empty or a Sass variable
            if (value.length === 0 || value.startsWith('$')) {
                continue;
            }
            // Skip if root-relative, absolute or protocol relative url
            if (/^((?:\w+:)?\/\/|data:|chrome:|#|\/)/.test(value)) {
                continue;
            }
            const rebasedPath = (0, node_path_1.relative)(this.entryDirectory, (0, node_path_1.join)(stylesheetDirectory, value));
            // Normalize path separators and escape characters
            // https://developer.mozilla.org/en-US/docs/Web/CSS/url#syntax
            const rebasedUrl = './' + rebasedPath.replace(/\\/g, '/').replace(/[()\s'"]/g, '\\$&');
            updatedContents ?? (updatedContents = new magic_string_1.default(contents));
            updatedContents.update(start, end, rebasedUrl);
        }
        // Add resolution directory information to module specifiers to facilitate resolution
        for (const { start, end, specifier } of (0, lexer_1.findImports)(contents)) {
            // Currently only provide directory information for known/common packages:
            // * `@material/`
            // * `@angular/`
            //
            // Comprehensive pre-resolution support may be added in the future. This is complicated by CSS/Sass not
            // requiring a `./` or `../` prefix to signify relative paths. A bare specifier could be either relative
            // or a module specifier. To differentiate, a relative resolution would need to be attempted first.
            if (!specifier.startsWith('@angular/') && !specifier.startsWith('@material/')) {
                continue;
            }
            updatedContents ?? (updatedContents = new magic_string_1.default(contents));
            updatedContents.update(start, end, `"${packModuleSpecifier(specifier, stylesheetDirectory)}"`);
        }
        if (updatedContents) {
            contents = updatedContents.toString();
            if (this.rebaseSourceMaps) {
                // Generate an intermediate source map for the rebasing changes
                const map = updatedContents.generateMap({
                    hires: true,
                    includeContent: true,
                    source: canonicalUrl.href,
                });
                this.rebaseSourceMaps.set(canonicalUrl.href, map);
            }
        }
        let syntax;
        switch ((0, node_path_1.extname)(stylesheetPath).toLowerCase()) {
            case '.css':
                syntax = 'css';
                break;
            case '.sass':
                syntax = 'indented';
                break;
            default:
                syntax = 'scss';
                break;
        }
        return {
            contents,
            syntax,
            sourceMapUrl: canonicalUrl,
        };
    }
}
/**
 * Provides the Sass importer logic to resolve relative stylesheet imports via both import and use rules
 * and also rebase any `url()` function usage within those stylesheets. The rebasing will ensure that
 * the URLs in the output of the Sass compiler reflect the final filesystem location of the output CSS file.
 */
class RelativeUrlRebasingImporter extends UrlRebasingImporter {
    constructor(entryDirectory, directoryCache = new Map(), rebaseSourceMaps) {
        super(entryDirectory, rebaseSourceMaps);
        this.directoryCache = directoryCache;
    }
    canonicalize(url, options) {
        return this.resolveImport(url, options.fromImport, true);
    }
    /**
     * Attempts to resolve a provided URL to a stylesheet file using the Sass compiler's resolution algorithm.
     * Based on https://github.com/sass/dart-sass/blob/44d6bb6ac72fe6b93f5bfec371a1fffb18e6b76d/lib/src/importer/utils.dart
     * @param url The file protocol URL to resolve.
     * @param fromImport If true, URL was from an import rule; otherwise from a use rule.
     * @param checkDirectory If true, try checking for a directory with the base name containing an index file.
     * @returns A full resolved URL of the stylesheet file or `null` if not found.
     */
    resolveImport(url, fromImport, checkDirectory) {
        let stylesheetPath;
        try {
            stylesheetPath = (0, node_url_1.fileURLToPath)(url);
        }
        catch {
            // Only file protocol URLs are supported by this importer
            return null;
        }
        const directory = (0, node_path_1.dirname)(stylesheetPath);
        const extension = (0, node_path_1.extname)(stylesheetPath);
        const hasStyleExtension = extension === '.scss' || extension === '.sass' || extension === '.css';
        // Remove the style extension if present to allow adding the `.import` suffix
        const filename = (0, node_path_1.basename)(stylesheetPath, hasStyleExtension ? extension : undefined);
        const importPotentials = new Set();
        const defaultPotentials = new Set();
        if (hasStyleExtension) {
            if (fromImport) {
                importPotentials.add(filename + '.import' + extension);
                importPotentials.add('_' + filename + '.import' + extension);
            }
            defaultPotentials.add(filename + extension);
            defaultPotentials.add('_' + filename + extension);
        }
        else {
            if (fromImport) {
                importPotentials.add(filename + '.import.scss');
                importPotentials.add(filename + '.import.sass');
                importPotentials.add(filename + '.import.css');
                importPotentials.add('_' + filename + '.import.scss');
                importPotentials.add('_' + filename + '.import.sass');
                importPotentials.add('_' + filename + '.import.css');
            }
            defaultPotentials.add(filename + '.scss');
            defaultPotentials.add(filename + '.sass');
            defaultPotentials.add(filename + '.css');
            defaultPotentials.add('_' + filename + '.scss');
            defaultPotentials.add('_' + filename + '.sass');
            defaultPotentials.add('_' + filename + '.css');
        }
        let foundDefaults;
        let foundImports;
        let hasPotentialIndex = false;
        let cachedEntries = this.directoryCache.get(directory);
        if (cachedEntries) {
            // If there is a preprocessed cache of the directory, perform an intersection of the potentials
            // and the directory files.
            const { files, directories } = cachedEntries;
            foundDefaults = [...defaultPotentials].filter((potential) => files.has(potential));
            foundImports = [...importPotentials].filter((potential) => files.has(potential));
            hasPotentialIndex = checkDirectory && !hasStyleExtension && directories.has(filename);
        }
        else {
            // If no preprocessed cache exists, get the entries from the file system and, while searching,
            // generate the cache for later requests.
            let entries;
            try {
                entries = (0, node_fs_1.readdirSync)(directory, { withFileTypes: true });
            }
            catch {
                return null;
            }
            foundDefaults = [];
            foundImports = [];
            cachedEntries = { files: new Set(), directories: new Set() };
            for (const entry of entries) {
                const isDirectory = entry.isDirectory();
                if (isDirectory) {
                    cachedEntries.directories.add(entry.name);
                }
                // Record if the name should be checked as a directory with an index file
                if (checkDirectory && !hasStyleExtension && entry.name === filename && isDirectory) {
                    hasPotentialIndex = true;
                }
                if (!entry.isFile()) {
                    continue;
                }
                cachedEntries.files.add(entry.name);
                if (importPotentials.has(entry.name)) {
                    foundImports.push(entry.name);
                }
                if (defaultPotentials.has(entry.name)) {
                    foundDefaults.push(entry.name);
                }
            }
            this.directoryCache.set(directory, cachedEntries);
        }
        // `foundImports` will only contain elements if `options.fromImport` is true
        const result = this.checkFound(foundImports) ?? this.checkFound(foundDefaults);
        if (result !== null) {
            return (0, node_url_1.pathToFileURL)((0, node_path_1.join)(directory, result));
        }
        if (hasPotentialIndex) {
            // Check for index files using filename as a directory
            return this.resolveImport(url + '/index', fromImport, false);
        }
        return null;
    }
    /**
     * Checks an array of potential stylesheet files to determine if there is a valid
     * stylesheet file. More than one discovered file may indicate an error.
     * @param found An array of discovered stylesheet files.
     * @returns A fully resolved path for a stylesheet file or `null` if not found.
     * @throws If there are ambiguous files discovered.
     */
    checkFound(found) {
        if (found.length === 0) {
            // Not found
            return null;
        }
        // More than one found file may be an error
        if (found.length > 1) {
            // Presence of CSS files alongside a Sass file does not cause an error
            const foundWithoutCss = found.filter((element) => (0, node_path_1.extname)(element) !== '.css');
            // If the length is zero then there are two or more css files
            // If the length is more than one than there are two or more sass/scss files
            if (foundWithoutCss.length !== 1) {
                throw new Error('Ambiguous import detected.');
            }
            // Return the non-CSS file (sass/scss files have priority)
            // https://github.com/sass/dart-sass/blob/44d6bb6ac72fe6b93f5bfec371a1fffb18e6b76d/lib/src/importer/utils.dart#L44-L47
            return foundWithoutCss[0];
        }
        return found[0];
    }
}
exports.RelativeUrlRebasingImporter = RelativeUrlRebasingImporter;
/**
 * Provides the Sass importer logic to resolve module (npm package) stylesheet imports via both import and
 * use rules and also rebase any `url()` function usage within those stylesheets. The rebasing will ensure that
 * the URLs in the output of the Sass compiler reflect the final filesystem location of the output CSS file.
 */
class ModuleUrlRebasingImporter extends RelativeUrlRebasingImporter {
    constructor(entryDirectory, directoryCache, rebaseSourceMaps, finder) {
        super(entryDirectory, directoryCache, rebaseSourceMaps);
        this.finder = finder;
    }
    canonicalize(url, options) {
        if (url.startsWith('file://')) {
            return super.canonicalize(url, options);
        }
        const { specifier, resolveDir } = unpackModuleSpecifier(url);
        let result = this.finder(specifier, { ...options, resolveDir });
        result && (result = super.canonicalize(result.href, options));
        return result;
    }
}
exports.ModuleUrlRebasingImporter = ModuleUrlRebasingImporter;
/**
 * Provides the Sass importer logic to resolve load paths located stylesheet imports via both import and
 * use rules and also rebase any `url()` function usage within those stylesheets. The rebasing will ensure that
 * the URLs in the output of the Sass compiler reflect the final filesystem location of the output CSS file.
 */
class LoadPathsUrlRebasingImporter extends RelativeUrlRebasingImporter {
    constructor(entryDirectory, directoryCache, rebaseSourceMaps, loadPaths) {
        super(entryDirectory, directoryCache, rebaseSourceMaps);
        this.loadPaths = loadPaths;
    }
    canonicalize(url, options) {
        if (url.startsWith('file://')) {
            return super.canonicalize(url, options);
        }
        let result = null;
        for (const loadPath of this.loadPaths) {
            result = super.canonicalize((0, node_url_1.pathToFileURL)((0, node_path_1.join)(loadPath, url)).href, options);
            if (result !== null) {
                break;
            }
        }
        return result;
    }
}
exports.LoadPathsUrlRebasingImporter = LoadPathsUrlRebasingImporter;
/**
 * Workaround for Sass not calling instance methods with `this`.
 * The `canonicalize` and `load` methods will be bound to the class instance.
 * @param importer A Sass importer to bind.
 * @returns The bound Sass importer.
 */
function sassBindWorkaround(importer) {
    importer.canonicalize = importer.canonicalize.bind(importer);
    importer.load = importer.load.bind(importer);
    return importer;
}
exports.sassBindWorkaround = sassBindWorkaround;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmViYXNpbmctaW1wb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9zYXNzL3JlYmFzaW5nLWltcG9ydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUdILGdFQUF1QztBQUN2QyxxQ0FBb0Q7QUFDcEQseUNBQXVFO0FBQ3ZFLHVDQUF3RDtBQUV4RCxtQ0FBZ0Q7QUFXaEQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSx3QkFBd0IsR0FBRyxnQkFBZ0IsQ0FBQztBQUVsRCxTQUFTLG1CQUFtQixDQUFDLFNBQWlCLEVBQUUsVUFBa0I7SUFDaEUsTUFBTSxNQUFNLEdBQ1Ysd0JBQXdCO1FBQ3hCLEdBQUc7UUFDSCx5RkFBeUY7UUFDekYsdUZBQXVGO1FBQ3ZGLG1FQUFtRTtRQUNuRSxrQkFBa0IsQ0FBQyxVQUFVLENBQUM7UUFDOUIsR0FBRztRQUNILDJGQUEyRjtRQUMzRiwrQ0FBK0M7UUFDL0MsOERBQThEO1FBQzlELFNBQVMsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRXpDLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUFDLFNBQWlCO0lBQzlDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQUcsd0JBQXdCLEdBQUcsQ0FBQyxFQUFFO1FBQ3pELE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQztLQUN0QjtJQUVELE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXZDLE9BQU87UUFDTCxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNwQixVQUFVLEVBQUUsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFD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MkI7SUFDM0UsWUFDRSxjQUFzQixFQUN0QixjQUEyQyxFQUMzQyxnQkFBdUQsRUFDL0MsU0FBMkI7UUFFbkMsS0FBSyxDQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUZoRCxjQUFTLEdBQVQsU0FBUyxDQUFrQjtJQUdyQyxDQUFDO0lBRVEsWUFBWSxDQUFDLEdBQVcsRUFBRSxPQUFnQztRQUNqRSxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDN0IsT0FBTyxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN6QztRQUVELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQztRQUNsQixLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDckMsTUFBTSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBQSx3QkFBYSxFQUFDLElBQUEsZ0JBQUksRUFBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUUsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO2dCQUNuQixNQUFNO2FBQ1A7U0FDRjtRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7Q0FDRjtBQXpCRCxvRUF5QkM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLGtCQUFrQixDQUFxQixRQUFXO0lBQ2hFLFFBQVEsQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDN0QsUUFBUSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUU3QyxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDO0FBTEQsZ0RBS0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgUmF3U291cmNlTWFwIH0gZnJvbSAnQGFtcHByb2plY3QvcmVtYXBwaW5nJztcbmltcG9ydCBNYWdpY1N0cmluZyBmcm9tICdtYWdpYy1zdHJpbmcnO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jLCByZWFkZGlyU3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHsgYmFzZW5hbWUsIGRpcm5hbWUsIGV4dG5hbWUsIGpvaW4sIHJlbGF0aXZlIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIHBhdGhUb0ZpbGVVUkwgfSBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgdHlwZSB7IEltcG9ydGVyLCBJbXBvcnRlclJlc3VsdCwgU3ludGF4IH0gZnJvbSAnc2Fzcyc7XG5pbXBvcnQgeyBmaW5kSW1wb3J0cywgZmluZFVybHMgfSBmcm9tICcuL2xleGVyJztcblxuLyoqXG4gKiBBIHByZXByb2Nlc3NlZCBjYWNoZSBlbnRyeSBmb3IgdGhlIGZpbGVzIGFuZCBkaXJlY3RvcmllcyB3aXRoaW4gYSBwcmV2aW91c2x5IHNlYXJjaGVkXG4gKiBkaXJlY3Rvcnkgd2hlbiBwZXJmb3JtaW5nIFNhc3MgaW1wb3J0IHJlc29sdXRpb24uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGlyZWN0b3J5RW50cnkge1xuICBmaWxlczogU2V0PHN0cmluZz47XG4gIGRpcmVjdG9yaWVzOiBTZXQ8c3RyaW5nPjtcbn1cblxuLyoqXG4gKiBBIHByZWZpeCB0aGF0IGlzIGFkZGVkIHRvIGltcG9ydCBhbmQgdXNlIGRpcmVjdGl2ZSBzcGVjaWZpZXJzIHRoYXQgc2hvdWxkIGJlIHJlc29sdmVkXG4gKiBhcyBtb2R1bGVzIGFuZCB0aGF0IHdpbGwgY29udGFpbiBhZGRlZCByZXNvbHZlIGRpcmVjdG9yeSBpbmZvcm1hdGlvbi5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uYWxpdHkgaXMgdXNlZCB0byB3b3JrYXJvdW5kIHRoZSBTYXNzIGxpbWl0YXRpb24gdGhhdCBpdCBkb2VzIG5vdCBwcm92aWRlIHRoZVxuICogaW1wb3J0ZXIgZmlsZSB0byBjdXN0b20gcmVzb2x1dGlvbiBwbHVnaW5zLlxuICovXG5jb25zdCBNT0RVTEVfUkVTT0xVVElPTl9QUkVGSVggPSAnX19OR19QQUNLQUdFX18nO1xuXG5mdW5jdGlvbiBwYWNrTW9kdWxlU3BlY2lmaWVyKHNwZWNpZmllcjogc3RyaW5nLCByZXNvbHZlRGlyOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBwYWNrZWQgPVxuICAgIE1PRFVMRV9SRVNPTFVUSU9OX1BSRUZJWCArXG4gICAgJzsnICtcbiAgICAvLyBFbmNvZGUgdGhlIHJlc29sdmUgZGlyZWN0b3J5IHRvIHByZXZlbnQgdW5zdXBwb3J0ZWQgY2hhcmFjdGVycyBmcm9tIGJlaW5nIHByZXNlbnQgd2hlblxuICAgIC8vIFNhc3MgcHJvY2Vzc2VzIHRoZSBVUkwuIFRoaXMgaXMgaW1wb3J0YW50IG9uIFdpbmRvd3Mgd2hpY2ggY2FuIGNvbnRhaW4gZHJpdmUgbGV0dGVyc1xuICAgIC8vIGFuZCBjb2xvbnMgd2hpY2ggd291bGQgb3RoZXJ3aXNlIGJlIGludGVycHJldGVkIGFzIGEgVVJMIHNjaGVtZS5cbiAgICBlbmNvZGVVUklDb21wb25lbnQocmVzb2x2ZURpcikgK1xuICAgICc7JyArXG4gICAgLy8gRXNjYXBlIGNoYXJhY3RlcnMgaW5zdGVhZCBvZiBlbmNvZGluZyB0byBwcm92aWRlIG1vcmUgZnJpZW5kbHkgbm90IGZvdW5kIGVycm9yIG1lc3NhZ2VzLlxuICAgIC8vIFVuZXNjYXBpbmcgaXMgYXV0b21hdGljYWxseSBoYW5kbGVkIGJ5IFNhc3MuXG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL3VybCNzeW50YXhcbiAgICBzcGVjaWZpZXIucmVwbGFjZSgvWygpXFxzJ1wiXS9nLCAnXFxcXCQmJyk7XG5cbiAgcmV0dXJuIHBhY2tlZDtcbn1cblxuZnVuY3Rpb24gdW5wYWNrTW9kdWxlU3BlY2lmaWVyKHNwZWNpZmllcjogc3RyaW5nKTogeyBzcGVjaWZpZXI6IHN0cmluZzsgcmVzb2x2ZURpcj86IHN0cmluZyB9IHtcbiAgaWYgKCFzcGVjaWZpZXIuc3RhcnRzV2l0aChgJHtNT0RVTEVfUkVTT0xVVElPTl9QUkVGSVh9O2ApKSB7XG4gICAgcmV0dXJuIHsgc3BlY2lmaWVyIH07XG4gIH1cblxuICBjb25zdCB2YWx1ZXMgPSBzcGVjaWZpZXIuc3BsaXQoJzsnLCAzKTtcblxuICByZXR1cm4ge1xuICAgIHNwZWNpZmllcjogdmFsdWVzWzJdLFxuICAgIHJlc29sdmVEaXI6IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZXNbMV0pLFxuICB9O1xufVxuXG4vKipcbiAqIEEgU2FzcyBJbXBvcnRlciBiYXNlIGNsYXNzIHRoYXQgcHJvdmlkZXMgdGhlIGxvYWQgbG9naWMgdG8gcmViYXNlIGFsbCBgdXJsKClgIGZ1bmN0aW9uc1xuICogd2l0aGluIGEgc3R5bGVzaGVldC4gVGhlIHJlYmFzaW5nIHdpbGwgZW5zdXJlIHRoYXQgdGhlIFVSTHMgaW4gdGhlIG91dHB1dCBvZiB0aGUgU2FzcyBjb21waWxlclxuICogcmVmbGVjdCB0aGUgZmluYWwgZmlsZXN5c3RlbSBsb2NhdGlvbiBvZiB0aGUgb3V0cHV0IENTUyBmaWxlLlxuICpcbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgdGhlIGNvcmUgb2YgdGhlIHJlYmFzaW5nIGZ1bmN0aW9uYWxpdHkuIFRvIGVuc3VyZSB0aGF0IGVhY2ggZmlsZSBpcyBwcm9jZXNzZWRcbiAqIGJ5IHRoaXMgaW1wb3J0ZXIncyBsb2FkIGltcGxlbWVudGF0aW9uLCB0aGUgU2FzcyBjb21waWxlciByZXF1aXJlcyB0aGUgaW1wb3J0ZXIncyBjYW5vbmljYWxpemVcbiAqIGZ1bmN0aW9uIHRvIHJldHVybiBhIG5vbi1udWxsIHZhbHVlIHdpdGggdGhlIHJlc29sdmVkIGxvY2F0aW9uIG9mIHRoZSByZXF1ZXN0ZWQgc3R5bGVzaGVldC5cbiAqIENvbmNyZXRlIGltcGxlbWVudGF0aW9ucyBvZiB0aGlzIGNsYXNzIG11c3QgcHJvdmlkZSB0aGlzIGNhbm9uaWNhbGl6ZSBmdW5jdGlvbmFsaXR5IGZvciByZWJhc2luZ1xuICogdG8gYmUgZWZmZWN0aXZlLlxuICovXG5hYnN0cmFjdCBjbGFzcyBVcmxSZWJhc2luZ0ltcG9ydGVyIGltcGxlbWVudHMgSW1wb3J0ZXI8J3N5bmMnPiB7XG4gIC8qKlxuICAgKiBAcGFyYW0gZW50cnlEaXJlY3RvcnkgVGhlIGRpcmVjdG9yeSBvZiB0aGUgZW50cnkgc3R5bGVzaGVldCB0aGF0IHdhcyBwYXNzZWQgdG8gdGhlIFNhc3MgY29tcGlsZXIuXG4gICAqIEBwYXJhbSByZWJhc2VTb3VyY2VNYXBzIFdoZW4gcHJvdmlkZWQsIHJlYmFzZWQgZmlsZXMgd2lsbCBoYXZlIGFuIGludGVybWVkaWF0ZSBzb3VyY2VtYXAgYWRkZWQgdG8gdGhlIE1hcFxuICAgKiB3aGljaCBjYW4gYmUgdXNlZCB0byBnZW5lcmF0ZSBhIGZpbmFsIHNvdXJjZW1hcCB0aGF0IGNvbnRhaW5zIG9yaWdpbmFsIHNvdXJjZXMuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIGVudHJ5RGlyZWN0b3J5OiBzdHJpbmcsXG4gICAgcHJpdmF0ZSByZWJhc2VTb3VyY2VNYXBzPzogTWFwPHN0cmluZywgUmF3U291cmNlTWFwPixcbiAgKSB7fVxuXG4gIGFic3RyYWN0IGNhbm9uaWNhbGl6ZSh1cmw6IHN0cmluZywgb3B0aW9uczogeyBmcm9tSW1wb3J0OiBib29sZWFuIH0pOiBVUkwgfCBudWxsO1xuXG4gIGxvYWQoY2Fub25pY2FsVXJsOiBVUkwpOiBJbXBvcnRlclJlc3VsdCB8IG51bGwge1xuICAgIGNvbnN0IHN0eWxlc2hlZXRQYXRoID0gZmlsZVVSTFRvUGF0aChjYW5vbmljYWxVcmwpO1xuICAgIGNvbnN0IHN0eWxlc2hlZXREaXJlY3RvcnkgPSBkaXJuYW1lKHN0eWxlc2hlZXRQYXRoKTtcbiAgICBsZXQgY29udGVudHMgPSByZWFkRmlsZVN5bmMoc3R5bGVzaGVldFBhdGgsICd1dGYtOCcpO1xuXG4gICAgLy8gUmViYXNlIGFueSBVUkxzIHRoYXQgYXJlIGZvdW5kXG4gICAgbGV0IHVwZGF0ZWRDb250ZW50cztcbiAgICBmb3IgKGNvbnN0IHsgc3RhcnQsIGVuZCwgdmFsdWUgfSBvZiBmaW5kVXJscyhjb250ZW50cykpIHtcbiAgICAgIC8vIFNraXAgaWYgdmFsdWUgaXMgZW1wdHkgb3IgYSBTYXNzIHZhcmlhYmxlXG4gICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAwIHx8IHZhbHVlLnN0YXJ0c1dpdGgoJyQnKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gU2tpcCBpZiByb290LXJlbGF0aXZlLCBhYnNvbHV0ZSBvciBwcm90b2NvbCByZWxhdGl2ZSB1cmxcbiAgICAgIGlmICgvXigoPzpcXHcrOik/XFwvXFwvfGRhdGE6fGNocm9tZTp8I3xcXC8pLy50ZXN0KHZhbHVlKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmViYXNlZFBhdGggPSByZWxhdGl2ZSh0aGlzLmVudHJ5RGlyZWN0b3J5LCBqb2luKHN0eWxlc2hlZXREaXJlY3RvcnksIHZhbHVlKSk7XG5cbiAgICAgIC8vIE5vcm1hbGl6ZSBwYXRoIHNlcGFyYXRvcnMgYW5kIGVzY2FwZSBjaGFyYWN0ZXJzXG4gICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvdXJsI3N5bnRheFxuICAgICAgY29uc3QgcmViYXNlZFVybCA9ICcuLycgKyByZWJhc2VkUGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJykucmVwbGFjZSgvWygpXFxzJ1wiXS9nLCAnXFxcXCQmJyk7XG5cbiAgICAgIHVwZGF0ZWRDb250ZW50cyA/Pz0gbmV3IE1hZ2ljU3RyaW5nKGNvbnRlbnRzKTtcbiAgICAgIHVwZGF0ZWRDb250ZW50cy51cGRhdGUoc3RhcnQsIGVuZCwgcmViYXNlZFVybCk7XG4gICAgfVxuXG4gICAgLy8gQWRkIHJlc29sdXRpb24gZGlyZWN0b3J5IGluZm9ybWF0aW9uIHRvIG1vZHVsZSBzcGVjaWZpZXJzIHRvIGZhY2lsaXRhdGUgcmVzb2x1dGlvblxuICAgIGZvciAoY29uc3QgeyBzdGFydCwgZW5kLCBzcGVjaWZpZXIgfSBvZiBmaW5kSW1wb3J0cyhjb250ZW50cykpIHtcbiAgICAgIC8vIEN1cnJlbnRseSBvbmx5IHByb3ZpZGUgZGlyZWN0b3J5IGluZm9ybWF0aW9uIGZvciBrbm93bi9jb21tb24gcGFja2FnZXM6XG4gICAgICAvLyAqIGBAbWF0ZXJpYWwvYFxuICAgICAgLy8gKiBgQGFuZ3VsYXIvYFxuICAgICAgLy9cbiAgICAgIC8vIENvbXByZWhlbnNpdmUgcHJlLXJlc29sdXRpb24gc3VwcG9ydCBtYXkgYmUgYWRkZWQgaW4gdGhlIGZ1dHVyZS4gVGhpcyBpcyBjb21wbGljYXRlZCBieSBDU1MvU2FzcyBub3RcbiAgICAgIC8vIHJlcXVpcmluZyBhIGAuL2Agb3IgYC4uL2AgcHJlZml4IHRvIHNpZ25pZnkgcmVsYXRpdmUgcGF0aHMuIEEgYmFyZSBzcGVjaWZpZXIgY291bGQgYmUgZWl0aGVyIHJlbGF0aXZlXG4gICAgICAvLyBvciBhIG1vZHVsZSBzcGVjaWZpZXIuIFRvIGRpZmZlcmVudGlhdGUsIGEgcmVsYXRpdmUgcmVzb2x1dGlvbiB3b3VsZCBuZWVkIHRvIGJlIGF0dGVtcHRlZCBmaXJzdC5cbiAgICAgIGlmICghc3BlY2lmaWVyLnN0YXJ0c1dpdGgoJ0Bhbmd1bGFyLycpICYmICFzcGVjaWZpZXIuc3RhcnRzV2l0aCgnQG1hdGVyaWFsLycpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB1cGRhdGVkQ29udGVudHMgPz89IG5ldyBNYWdpY1N0cmluZyhjb250ZW50cyk7XG4gICAgICB1cGRhdGVkQ29udGVudHMudXBkYXRlKFxuICAgICAgICBzdGFydCxcbiAgICAgICAgZW5kLFxuICAgICAgICBgXCIke3BhY2tNb2R1bGVTcGVjaWZpZXIoc3BlY2lmaWVyLCBzdHlsZXNoZWV0RGlyZWN0b3J5KX1cImAsXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh1cGRhdGVkQ29udGVudHMpIHtcbiAgICAgIGNvbnRlbnRzID0gdXBkYXRlZENvbnRlbnRzLnRvU3RyaW5nKCk7XG4gICAgICBpZiAodGhpcy5yZWJhc2VTb3VyY2VNYXBzKSB7XG4gICAgICAgIC8vIEdlbmVyYXRlIGFuIGludGVybWVkaWF0ZSBzb3VyY2UgbWFwIGZvciB0aGUgcmViYXNpbmcgY2hhbmdlc1xuICAgICAgICBjb25zdCBtYXAgPSB1cGRhdGVkQ29udGVudHMuZ2VuZXJhdGVNYXAoe1xuICAgICAgICAgIGhpcmVzOiB0cnVlLFxuICAgICAgICAgIGluY2x1ZGVDb250ZW50OiB0cnVlLFxuICAgICAgICAgIHNvdXJjZTogY2Fub25pY2FsVXJsLmhyZWYsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlYmFzZVNvdXJjZU1hcHMuc2V0KGNhbm9uaWNhbFVybC5ocmVmLCBtYXAgYXMgUmF3U291cmNlTWFwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgc3ludGF4OiBTeW50YXggfCB1bmRlZmluZWQ7XG4gICAgc3dpdGNoIChleHRuYW1lKHN0eWxlc2hlZXRQYXRoKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICBjYXNlICcuY3NzJzpcbiAgICAgICAgc3ludGF4ID0gJ2Nzcyc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnLnNhc3MnOlxuICAgICAgICBzeW50YXggPSAnaW5kZW50ZWQnO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHN5bnRheCA9ICdzY3NzJztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnRzLFxuICAgICAgc3ludGF4LFxuICAgICAgc291cmNlTWFwVXJsOiBjYW5vbmljYWxVcmwsXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIHRoZSBTYXNzIGltcG9ydGVyIGxvZ2ljIHRvIHJlc29sdmUgcmVsYXRpdmUgc3R5bGVzaGVldCBpbXBvcnRzIHZpYSBib3RoIGltcG9ydCBhbmQgdXNlIHJ1bGVzXG4gKiBhbmQgYWxzbyByZWJhc2UgYW55IGB1cmwoKWAgZnVuY3Rpb24gdXNhZ2Ugd2l0aGluIHRob3NlIHN0eWxlc2hlZXRzLiBUaGUgcmViYXNpbmcgd2lsbCBlbnN1cmUgdGhhdFxuICogdGhlIFVSTHMgaW4gdGhlIG91dHB1dCBvZiB0aGUgU2FzcyBjb21waWxlciByZWZsZWN0IHRoZSBmaW5hbCBmaWxlc3lzdGVtIGxvY2F0aW9uIG9mIHRoZSBvdXRwdXQgQ1NTIGZpbGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBSZWxhdGl2ZVVybFJlYmFzaW5nSW1wb3J0ZXIgZXh0ZW5kcyBVcmxSZWJhc2luZ0ltcG9ydGVyIHtcbiAgY29uc3RydWN0b3IoXG4gICAgZW50cnlEaXJlY3Rvcnk6IHN0cmluZyxcbiAgICBwcml2YXRlIGRpcmVjdG9yeUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIERpcmVjdG9yeUVudHJ5PigpLFxuICAgIHJlYmFzZVNvdXJjZU1hcHM/OiBNYXA8c3RyaW5nLCBSYXdTb3VyY2VNYXA+LFxuICApIHtcbiAgICBzdXBlcihlbnRyeURpcmVjdG9yeSwgcmViYXNlU291cmNlTWFwcyk7XG4gIH1cblxuICBjYW5vbmljYWxpemUodXJsOiBzdHJpbmcsIG9wdGlvbnM6IHsgZnJvbUltcG9ydDogYm9vbGVhbiB9KTogVVJMIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMucmVzb2x2ZUltcG9ydCh1cmwsIG9wdGlvbnMuZnJvbUltcG9ydCwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gcmVzb2x2ZSBhIHByb3ZpZGVkIFVSTCB0byBhIHN0eWxlc2hlZXQgZmlsZSB1c2luZyB0aGUgU2FzcyBjb21waWxlcidzIHJlc29sdXRpb24gYWxnb3JpdGhtLlxuICAgKiBCYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vc2Fzcy9kYXJ0LXNhc3MvYmxvYi80NGQ2YmI2YWM3MmZlNmI5M2Y1YmZlYzM3MWExZmZmYjE4ZTZiNzZkL2xpYi9zcmMvaW1wb3J0ZXIvdXRpbHMuZGFydFxuICAgKiBAcGFyYW0gdXJsIFRoZSBmaWxlIHByb3RvY29sIFVSTCB0byByZXNvbHZlLlxuICAgKiBAcGFyYW0gZnJvbUltcG9ydCBJZiB0cnVlLCBVUkwgd2FzIGZyb20gYW4gaW1wb3J0IHJ1bGU7IG90aGVyd2lzZSBmcm9tIGEgdXNlIHJ1bGUuXG4gICAqIEBwYXJhbSBjaGVja0RpcmVjdG9yeSBJZiB0cnVlLCB0cnkgY2hlY2tpbmcgZm9yIGEgZGlyZWN0b3J5IHdpdGggdGhlIGJhc2UgbmFtZSBjb250YWluaW5nIGFuIGluZGV4IGZpbGUuXG4gICAqIEByZXR1cm5zIEEgZnVsbCByZXNvbHZlZCBVUkwgb2YgdGhlIHN0eWxlc2hlZXQgZmlsZSBvciBgbnVsbGAgaWYgbm90IGZvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSByZXNvbHZlSW1wb3J0KHVybDogc3RyaW5nLCBmcm9tSW1wb3J0OiBib29sZWFuLCBjaGVja0RpcmVjdG9yeTogYm9vbGVhbik6IFVSTCB8IG51bGwge1xuICAgIGxldCBzdHlsZXNoZWV0UGF0aDtcbiAgICB0cnkge1xuICAgICAgc3R5bGVzaGVldFBhdGggPSBmaWxlVVJMVG9QYXRoKHVybCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBPbmx5IGZpbGUgcHJvdG9jb2wgVVJMcyBhcmUgc3VwcG9ydGVkIGJ5IHRoaXMgaW1wb3J0ZXJcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdG9yeSA9IGRpcm5hbWUoc3R5bGVzaGVldFBhdGgpO1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGV4dG5hbWUoc3R5bGVzaGVldFBhdGgpO1xuICAgIGNvbnN0IGhhc1N0eWxlRXh0ZW5zaW9uID1cbiAgICAgIGV4dGVuc2lvbiA9PT0gJy5zY3NzJyB8fCBleHRlbnNpb24gPT09ICcuc2FzcycgfHwgZXh0ZW5zaW9uID09PSAnLmNzcyc7XG4gICAgLy8gUmVtb3ZlIHRoZSBzdHlsZSBleHRlbnNpb24gaWYgcHJlc2VudCB0byBhbGxvdyBhZGRpbmcgdGhlIGAuaW1wb3J0YCBzdWZmaXhcbiAgICBjb25zdCBmaWxlbmFtZSA9IGJhc2VuYW1lKHN0eWxlc2hlZXRQYXRoLCBoYXNTdHlsZUV4dGVuc2lvbiA/IGV4dGVuc2lvbiA6IHVuZGVmaW5lZCk7XG5cbiAgICBjb25zdCBpbXBvcnRQb3RlbnRpYWxzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgY29uc3QgZGVmYXVsdFBvdGVudGlhbHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIGlmIChoYXNTdHlsZUV4dGVuc2lvbikge1xuICAgICAgaWYgKGZyb21JbXBvcnQpIHtcbiAgICAgICAgaW1wb3J0UG90ZW50aWFscy5hZGQoZmlsZW5hbWUgKyAnLmltcG9ydCcgKyBleHRlbnNpb24pO1xuICAgICAgICBpbXBvcnRQb3RlbnRpYWxzLmFkZCgnXycgKyBmaWxlbmFtZSArICcuaW1wb3J0JyArIGV4dGVuc2lvbik7XG4gICAgICB9XG4gICAgICBkZWZhdWx0UG90ZW50aWFscy5hZGQoZmlsZW5hbWUgKyBleHRlbnNpb24pO1xuICAgICAgZGVmYXVsdFBvdGVudGlhbHMuYWRkKCdfJyArIGZpbGVuYW1lICsgZXh0ZW5zaW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGZyb21JbXBvcnQpIHtcbiAgICAgICAgaW1wb3J0UG90ZW50aWFscy5hZGQoZmlsZW5hbWUgKyAnLmltcG9ydC5zY3NzJyk7XG4gICAgICAgIGltcG9ydFBvdGVudGlhbHMuYWRkKGZpbGVuYW1lICsgJy5pbXBvcnQuc2FzcycpO1xuICAgICAgICBpbXBvcnRQb3RlbnRpYWxzLmFkZChmaWxlbmFtZSArICcuaW1wb3J0LmNzcycpO1xuICAgICAgICBpbXBvcnRQb3RlbnRpYWxzLmFkZCgnXycgKyBmaWxlbmFtZSArICcuaW1wb3J0LnNjc3MnKTtcbiAgICAgICAgaW1wb3J0UG90ZW50aWFscy5hZGQoJ18nICsgZmlsZW5hbWUgKyAnLmltcG9ydC5zYXNzJyk7XG4gICAgICAgIGltcG9ydFBvdGVudGlhbHMuYWRkKCdfJyArIGZpbGVuYW1lICsgJy5pbXBvcnQuY3NzJyk7XG4gICAgICB9XG4gICAgICBkZWZhdWx0UG90ZW50aWFscy5hZGQoZmlsZW5hbWUgKyAnLnNjc3MnKTtcbiAgICAgIGRlZmF1bHRQb3RlbnRpYWxzLmFkZChmaWxlbmFtZSArICcuc2FzcycpO1xuICAgICAgZGVmYXVsdFBvdGVudGlhbHMuYWRkKGZpbGVuYW1lICsgJy5jc3MnKTtcbiAgICAgIGRlZmF1bHRQb3RlbnRpYWxzLmFkZCgnXycgKyBmaWxlbmFtZSArICcuc2NzcycpO1xuICAgICAgZGVmYXVsdFBvdGVudGlhbHMuYWRkKCdfJyArIGZpbGVuYW1lICsgJy5zYXNzJyk7XG4gICAgICBkZWZhdWx0UG90ZW50aWFscy5hZGQoJ18nICsgZmlsZW5hbWUgKyAnLmNzcycpO1xuICAgIH1cblxuICAgIGxldCBmb3VuZERlZmF1bHRzO1xuICAgIGxldCBmb3VuZEltcG9ydHM7XG4gICAgbGV0IGhhc1BvdGVudGlhbEluZGV4ID0gZmFsc2U7XG5cbiAgICBsZXQgY2FjaGVkRW50cmllcyA9IHRoaXMuZGlyZWN0b3J5Q2FjaGUuZ2V0KGRpcmVjdG9yeSk7XG4gICAgaWYgKGNhY2hlZEVudHJpZXMpIHtcbiAgICAgIC8vIElmIHRoZXJlIGlzIGEgcHJlcHJvY2Vzc2VkIGNhY2hlIG9mIHRoZSBkaXJlY3RvcnksIHBlcmZvcm0gYW4gaW50ZXJzZWN0aW9uIG9mIHRoZSBwb3RlbnRpYWxzXG4gICAgICAvLyBhbmQgdGhlIGRpcmVjdG9yeSBmaWxlcy5cbiAgICAgIGNvbnN0IHsgZmlsZXMsIGRpcmVjdG9yaWVzIH0gPSBjYWNoZWRFbnRyaWVzO1xuICAgICAgZm91bmREZWZhdWx0cyA9IFsuLi5kZWZhdWx0UG90ZW50aWFsc10uZmlsdGVyKChwb3RlbnRpYWwpID0+IGZpbGVzLmhhcyhwb3RlbnRpYWwpKTtcbiAgICAgIGZvdW5kSW1wb3J0cyA9IFsuLi5pbXBvcnRQb3RlbnRpYWxzXS5maWx0ZXIoKHBvdGVudGlhbCkgPT4gZmlsZXMuaGFzKHBvdGVudGlhbCkpO1xuICAgICAgaGFzUG90ZW50aWFsSW5kZXggPSBjaGVja0RpcmVjdG9yeSAmJiAhaGFzU3R5bGVFeHRlbnNpb24gJiYgZGlyZWN0b3JpZXMuaGFzKGZpbGVuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgbm8gcHJlcHJvY2Vzc2VkIGNhY2hlIGV4aXN0cywgZ2V0IHRoZSBlbnRyaWVzIGZyb20gdGhlIGZpbGUgc3lzdGVtIGFuZCwgd2hpbGUgc2VhcmNoaW5nLFxuICAgICAgLy8gZ2VuZXJhdGUgdGhlIGNhY2hlIGZvciBsYXRlciByZXF1ZXN0cy5cbiAgICAgIGxldCBlbnRyaWVzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZW50cmllcyA9IHJlYWRkaXJTeW5jKGRpcmVjdG9yeSwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBmb3VuZERlZmF1bHRzID0gW107XG4gICAgICBmb3VuZEltcG9ydHMgPSBbXTtcbiAgICAgIGNhY2hlZEVudHJpZXMgPSB7IGZpbGVzOiBuZXcgU2V0PHN0cmluZz4oKSwgZGlyZWN0b3JpZXM6IG5ldyBTZXQ8c3RyaW5nPigpIH07XG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgY29uc3QgaXNEaXJlY3RvcnkgPSBlbnRyeS5pc0RpcmVjdG9yeSgpO1xuICAgICAgICBpZiAoaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICBjYWNoZWRFbnRyaWVzLmRpcmVjdG9yaWVzLmFkZChlbnRyeS5uYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlY29yZCBpZiB0aGUgbmFtZSBzaG91bGQgYmUgY2hlY2tlZCBhcyBhIGRpcmVjdG9yeSB3aXRoIGFuIGluZGV4IGZpbGVcbiAgICAgICAgaWYgKGNoZWNrRGlyZWN0b3J5ICYmICFoYXNTdHlsZUV4dGVuc2lvbiAmJiBlbnRyeS5uYW1lID09PSBmaWxlbmFtZSAmJiBpc0RpcmVjdG9yeSkge1xuICAgICAgICAgIGhhc1BvdGVudGlhbEluZGV4ID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhY2hlZEVudHJpZXMuZmlsZXMuYWRkKGVudHJ5Lm5hbWUpO1xuXG4gICAgICAgIGlmIChpbXBvcnRQb3RlbnRpYWxzLmhhcyhlbnRyeS5uYW1lKSkge1xuICAgICAgICAgIGZvdW5kSW1wb3J0cy5wdXNoKGVudHJ5Lm5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlZmF1bHRQb3RlbnRpYWxzLmhhcyhlbnRyeS5uYW1lKSkge1xuICAgICAgICAgIGZvdW5kRGVmYXVsdHMucHVzaChlbnRyeS5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmRpcmVjdG9yeUNhY2hlLnNldChkaXJlY3RvcnksIGNhY2hlZEVudHJpZXMpO1xuICAgIH1cblxuICAgIC8vIGBmb3VuZEltcG9ydHNgIHdpbGwgb25seSBjb250YWluIGVsZW1lbnRzIGlmIGBvcHRpb25zLmZyb21JbXBvcnRgIGlzIHRydWVcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLmNoZWNrRm91bmQoZm91bmRJbXBvcnRzKSA/PyB0aGlzLmNoZWNrRm91bmQoZm91bmREZWZhdWx0cyk7XG4gICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHBhdGhUb0ZpbGVVUkwoam9pbihkaXJlY3RvcnksIHJlc3VsdCkpO1xuICAgIH1cblxuICAgIGlmIChoYXNQb3RlbnRpYWxJbmRleCkge1xuICAgICAgLy8gQ2hlY2sgZm9yIGluZGV4IGZpbGVzIHVzaW5nIGZpbGVuYW1lIGFzIGEgZGlyZWN0b3J5XG4gICAgICByZXR1cm4gdGhpcy5yZXNvbHZlSW1wb3J0KHVybCArICcvaW5kZXgnLCBmcm9tSW1wb3J0LCBmYWxzZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGFuIGFycmF5IG9mIHBvdGVudGlhbCBzdHlsZXNoZWV0IGZpbGVzIHRvIGRldGVybWluZSBpZiB0aGVyZSBpcyBhIHZhbGlkXG4gICAqIHN0eWxlc2hlZXQgZmlsZS4gTW9yZSB0aGFuIG9uZSBkaXNjb3ZlcmVkIGZpbGUgbWF5IGluZGljYXRlIGFuIGVycm9yLlxuICAgKiBAcGFyYW0gZm91bmQgQW4gYXJyYXkgb2YgZGlzY292ZXJlZCBzdHlsZXNoZWV0IGZpbGVzLlxuICAgKiBAcmV0dXJucyBBIGZ1bGx5IHJlc29sdmVkIHBhdGggZm9yIGEgc3R5bGVzaGVldCBmaWxlIG9yIGBudWxsYCBpZiBub3QgZm91bmQuXG4gICAqIEB0aHJvd3MgSWYgdGhlcmUgYXJlIGFtYmlndW91cyBmaWxlcyBkaXNjb3ZlcmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBjaGVja0ZvdW5kKGZvdW5kOiBzdHJpbmdbXSk6IHN0cmluZyB8IG51bGwge1xuICAgIGlmIChmb3VuZC5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIE5vdCBmb3VuZFxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gTW9yZSB0aGFuIG9uZSBmb3VuZCBmaWxlIG1heSBiZSBhbiBlcnJvclxuICAgIGlmIChmb3VuZC5sZW5ndGggPiAxKSB7XG4gICAgICAvLyBQcmVzZW5jZSBvZiBDU1MgZmlsZXMgYWxvbmdzaWRlIGEgU2FzcyBmaWxlIGRvZXMgbm90IGNhdXNlIGFuIGVycm9yXG4gICAgICBjb25zdCBmb3VuZFdpdGhvdXRDc3MgPSBmb3VuZC5maWx0ZXIoKGVsZW1lbnQpID0+IGV4dG5hbWUoZWxlbWVudCkgIT09ICcuY3NzJyk7XG4gICAgICAvLyBJZiB0aGUgbGVuZ3RoIGlzIHplcm8gdGhlbiB0aGVyZSBhcmUgdHdvIG9yIG1vcmUgY3NzIGZpbGVzXG4gICAgICAvLyBJZiB0aGUgbGVuZ3RoIGlzIG1vcmUgdGhhbiBvbmUgdGhhbiB0aGVyZSBhcmUgdHdvIG9yIG1vcmUgc2Fzcy9zY3NzIGZpbGVzXG4gICAgICBpZiAoZm91bmRXaXRob3V0Q3NzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FtYmlndW91cyBpbXBvcnQgZGV0ZWN0ZWQuJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybiB0aGUgbm9uLUNTUyBmaWxlIChzYXNzL3Njc3MgZmlsZXMgaGF2ZSBwcmlvcml0eSlcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9zYXNzL2RhcnQtc2Fzcy9ibG9iLzQ0ZDZiYjZhYzcyZmU2YjkzZjViZmVjMzcxYTFmZmZiMThlNmI3NmQvbGliL3NyYy9pbXBvcnRlci91dGlscy5kYXJ0I0w0NC1MNDdcbiAgICAgIHJldHVybiBmb3VuZFdpdGhvdXRDc3NbMF07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZvdW5kWzBdO1xuICB9XG59XG5cbi8qKlxuICogUHJvdmlkZXMgdGhlIFNhc3MgaW1wb3J0ZXIgbG9naWMgdG8gcmVzb2x2ZSBtb2R1bGUgKG5wbSBwYWNrYWdlKSBzdHlsZXNoZWV0IGltcG9ydHMgdmlhIGJvdGggaW1wb3J0IGFuZFxuICogdXNlIHJ1bGVzIGFuZCBhbHNvIHJlYmFzZSBhbnkgYHVybCgpYCBmdW5jdGlvbiB1c2FnZSB3aXRoaW4gdGhvc2Ugc3R5bGVzaGVldHMuIFRoZSByZWJhc2luZyB3aWxsIGVuc3VyZSB0aGF0XG4gKiB0aGUgVVJMcyBpbiB0aGUgb3V0cHV0IG9mIHRoZSBTYXNzIGNvbXBpbGVyIHJlZmxlY3QgdGhlIGZpbmFsIGZpbGVzeXN0ZW0gbG9jYXRpb24gb2YgdGhlIG91dHB1dCBDU1MgZmlsZS5cbiAqL1xuZXhwb3J0IGNsYXNzIE1vZHVsZVVybFJlYmFzaW5nSW1wb3J0ZXIgZXh0ZW5kcyBSZWxhdGl2ZVVybFJlYmFzaW5nSW1wb3J0ZXIge1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbnRyeURpcmVjdG9yeTogc3RyaW5nLFxuICAgIGRpcmVjdG9yeUNhY2hlOiBNYXA8c3RyaW5nLCBEaXJlY3RvcnlFbnRyeT4sXG4gICAgcmViYXNlU291cmNlTWFwczogTWFwPHN0cmluZywgUmF3U291cmNlTWFwPiB8IHVuZGVmaW5lZCxcbiAgICBwcml2YXRlIGZpbmRlcjogKFxuICAgICAgc3BlY2lmaWVyOiBzdHJpbmcsXG4gICAgICBvcHRpb25zOiB7IGZyb21JbXBvcnQ6IGJvb2xlYW47IHJlc29sdmVEaXI/OiBzdHJpbmcgfSxcbiAgICApID0+IFVSTCB8IG51bGwsXG4gICkge1xuICAgIHN1cGVyKGVudHJ5RGlyZWN0b3J5LCBkaXJlY3RvcnlDYWNoZSwgcmViYXNlU291cmNlTWFwcyk7XG4gIH1cblxuICBvdmVycmlkZSBjYW5vbmljYWxpemUodXJsOiBzdHJpbmcsIG9wdGlvbnM6IHsgZnJvbUltcG9ydDogYm9vbGVhbiB9KTogVVJMIHwgbnVsbCB7XG4gICAgaWYgKHVybC5zdGFydHNXaXRoKCdmaWxlOi8vJykpIHtcbiAgICAgIHJldHVybiBzdXBlci5jYW5vbmljYWxpemUodXJsLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHNwZWNpZmllciwgcmVzb2x2ZURpciB9ID0gdW5wYWNrTW9kdWxlU3BlY2lmaWVyKHVybCk7XG5cbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5maW5kZXIoc3BlY2lmaWVyLCB7IC4uLm9wdGlvbnMsIHJlc29sdmVEaXIgfSk7XG4gICAgcmVzdWx0ICYmPSBzdXBlci5jYW5vbmljYWxpemUocmVzdWx0LmhyZWYsIG9wdGlvbnMpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIHRoZSBTYXNzIGltcG9ydGVyIGxvZ2ljIHRvIHJlc29sdmUgbG9hZCBwYXRocyBsb2NhdGVkIHN0eWxlc2hlZXQgaW1wb3J0cyB2aWEgYm90aCBpbXBvcnQgYW5kXG4gKiB1c2UgcnVsZXMgYW5kIGFsc28gcmViYXNlIGFueSBgdXJsKClgIGZ1bmN0aW9uIHVzYWdlIHdpdGhpbiB0aG9zZSBzdHlsZXNoZWV0cy4gVGhlIHJlYmFzaW5nIHdpbGwgZW5zdXJlIHRoYXRcbiAqIHRoZSBVUkxzIGluIHRoZSBvdXRwdXQgb2YgdGhlIFNhc3MgY29tcGlsZXIgcmVmbGVjdCB0aGUgZmluYWwgZmlsZXN5c3RlbSBsb2NhdGlvbiBvZiB0aGUgb3V0cHV0IENTUyBmaWxlLlxuICovXG5leHBvcnQgY2xhc3MgTG9hZFBhdGhzVXJsUmViYXNpbmdJbXBvcnRlciBleHRlbmRzIFJlbGF0aXZlVXJsUmViYXNpbmdJbXBvcnRlciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGVudHJ5RGlyZWN0b3J5OiBzdHJpbmcsXG4gICAgZGlyZWN0b3J5Q2FjaGU6IE1hcDxzdHJpbmcsIERpcmVjdG9yeUVudHJ5PixcbiAgICByZWJhc2VTb3VyY2VNYXBzOiBNYXA8c3RyaW5nLCBSYXdTb3VyY2VNYXA+IHwgdW5kZWZpbmVkLFxuICAgIHByaXZhdGUgbG9hZFBhdGhzOiBJdGVyYWJsZTxzdHJpbmc+LFxuICApIHtcbiAgICBzdXBlcihlbnRyeURpcmVjdG9yeSwgZGlyZWN0b3J5Q2FjaGUsIHJlYmFzZVNvdXJjZU1hcHMpO1xuICB9XG5cbiAgb3ZlcnJpZGUgY2Fub25pY2FsaXplKHVybDogc3RyaW5nLCBvcHRpb25zOiB7IGZyb21JbXBvcnQ6IGJvb2xlYW4gfSk6IFVSTCB8IG51bGwge1xuICAgIGlmICh1cmwuc3RhcnRzV2l0aCgnZmlsZTovLycpKSB7XG4gICAgICByZXR1cm4gc3VwZXIuY2Fub25pY2FsaXplKHVybCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XG4gICAgZm9yIChjb25zdCBsb2FkUGF0aCBvZiB0aGlzLmxvYWRQYXRocykge1xuICAgICAgcmVzdWx0ID0gc3VwZXIuY2Fub25pY2FsaXplKHBhdGhUb0ZpbGVVUkwoam9pbihsb2FkUGF0aCwgdXJsKSkuaHJlZiwgb3B0aW9ucyk7XG4gICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBXb3JrYXJvdW5kIGZvciBTYXNzIG5vdCBjYWxsaW5nIGluc3RhbmNlIG1ldGhvZHMgd2l0aCBgdGhpc2AuXG4gKiBUaGUgYGNhbm9uaWNhbGl6ZWAgYW5kIGBsb2FkYCBtZXRob2RzIHdpbGwgYmUgYm91bmQgdG8gdGhlIGNsYXNzIGluc3RhbmNlLlxuICogQHBhcmFtIGltcG9ydGVyIEEgU2FzcyBpbXBvcnRlciB0byBiaW5kLlxuICogQHJldHVybnMgVGhlIGJvdW5kIFNhc3MgaW1wb3J0ZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYXNzQmluZFdvcmthcm91bmQ8VCBleHRlbmRzIEltcG9ydGVyPihpbXBvcnRlcjogVCk6IFQge1xuICBpbXBvcnRlci5jYW5vbmljYWxpemUgPSBpbXBvcnRlci5jYW5vbmljYWxpemUuYmluZChpbXBvcnRlcik7XG4gIGltcG9ydGVyLmxvYWQgPSBpbXBvcnRlci5sb2FkLmJpbmQoaW1wb3J0ZXIpO1xuXG4gIHJldHVybiBpbXBvcnRlcjtcbn1cbiJdfQ==