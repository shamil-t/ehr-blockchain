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
exports.setupJitPluginCallbacks = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const bundle_options_1 = require("../stylesheets/bundle-options");
const uri_1 = require("./uri");
/**
 * Loads/extracts the contents from a load callback Angular JIT entry.
 * An Angular JIT entry represents either a file path for a component resource or base64
 * encoded data for an inline component resource.
 * @param entry The value that represents content to load.
 * @param root The absolute path for the root of the build (typically the workspace root).
 * @param skipRead If true, do not attempt to read the file; if false, read file content from disk.
 * This option has no effect if the entry does not originate from a file. Defaults to false.
 * @returns An object containing the absolute path of the contents and optionally the actual contents.
 * For inline entries the contents will always be provided.
 */
async function loadEntry(entry, root, skipRead) {
    if (entry.startsWith('file:')) {
        const specifier = node_path_1.default.join(root, entry.slice(5));
        return {
            path: specifier,
            contents: skipRead ? undefined : await (0, promises_1.readFile)(specifier, 'utf-8'),
        };
    }
    else if (entry.startsWith('inline:')) {
        const [importer, data] = entry.slice(7).split(';', 2);
        return {
            path: node_path_1.default.join(root, importer),
            contents: Buffer.from(data, 'base64').toString(),
        };
    }
    else {
        throw new Error('Invalid data for Angular JIT entry.');
    }
}
/**
 * Sets up esbuild resolve and load callbacks to support Angular JIT mode processing
 * for both Component stylesheets and templates. These callbacks work alongside the JIT
 * resource TypeScript transformer to convert and then bundle Component resources as
 * static imports.
 * @param build An esbuild {@link PluginBuild} instance used to add callbacks.
 * @param styleOptions The options to use when bundling stylesheets.
 * @param stylesheetResourceFiles An array where stylesheet resources will be added.
 */
function setupJitPluginCallbacks(build, styleOptions, stylesheetResourceFiles, cache) {
    const root = build.initialOptions.absWorkingDir ?? '';
    // Add a resolve callback to capture and parse any JIT URIs that were added by the
    // JIT resource TypeScript transformer.
    // Resources originating from a file are resolved as relative from the containing file (importer).
    build.onResolve({ filter: uri_1.JIT_NAMESPACE_REGEXP }, (args) => {
        const parsed = (0, uri_1.parseJitUri)(args.path);
        if (!parsed) {
            return undefined;
        }
        const { namespace, origin, specifier } = parsed;
        if (origin === 'file') {
            return {
                // Use a relative path to prevent fully resolved paths in the metafile (JSON stats file).
                // This is only necessary for custom namespaces. esbuild will handle the file namespace.
                path: 'file:' + node_path_1.default.relative(root, node_path_1.default.join(node_path_1.default.dirname(args.importer), specifier)),
                namespace,
            };
        }
        else {
            // Inline data may need the importer to resolve imports/references within the content
            const importer = node_path_1.default.relative(root, args.importer);
            return {
                path: `inline:${importer};${specifier}`,
                namespace,
            };
        }
    });
    // Add a load callback to handle Component stylesheets (both inline and external)
    build.onLoad({ filter: /./, namespace: uri_1.JIT_STYLE_NAMESPACE }, async (args) => {
        // skipRead is used here because the stylesheet bundling will read a file stylesheet
        // directly either via a preprocessor or esbuild itself.
        const entry = await loadEntry(args.path, root, true /* skipRead */);
        const { contents, resourceFiles, errors, warnings } = await (0, bundle_options_1.bundleComponentStylesheet)(styleOptions.inlineStyleLanguage, 
        // The `data` parameter is only needed for a stylesheet if it was inline
        entry.contents ?? '', entry.path, entry.contents !== undefined, styleOptions, cache);
        stylesheetResourceFiles.push(...resourceFiles);
        return {
            errors,
            warnings,
            contents,
            loader: 'text',
        };
    });
    // Add a load callback to handle Component templates
    // NOTE: While this callback supports both inline and external templates, the transformer
    // currently only supports generating URIs for external templates.
    build.onLoad({ filter: /./, namespace: uri_1.JIT_TEMPLATE_NAMESPACE }, async (args) => {
        const { contents } = await loadEntry(args.path, root);
        return {
            contents,
            loader: 'text',
        };
    });
}
exports.setupJitPluginCallbacks = setupJitPluginCallbacks;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaml0LXBsdWdpbi1jYWxsYmFja3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy9lc2J1aWxkL2FuZ3VsYXIvaml0LXBsdWdpbi1jYWxsYmFja3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7O0FBR0gsK0NBQTRDO0FBQzVDLDBEQUE2QjtBQUU3QixrRUFBbUc7QUFDbkcsK0JBS2U7QUFFZjs7Ozs7Ozs7OztHQVVHO0FBQ0gsS0FBSyxVQUFVLFNBQVMsQ0FDdEIsS0FBYSxFQUNiLElBQVksRUFDWixRQUFrQjtJQUVsQixJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDN0IsTUFBTSxTQUFTLEdBQUcsbUJBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVsRCxPQUFPO1lBQ0wsSUFBSSxFQUFFLFNBQVM7WUFDZixRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBQSxtQkFBUSxFQUFDLFNBQVMsRUFBRSxPQUFPLENBQUM7U0FDcEUsQ0FBQztLQUNIO1NBQU0sSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQ3RDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXRELE9BQU87WUFDTCxJQUFJLEVBQUUsbUJBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztZQUMvQixRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJ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dEQsT0FBTztZQUNMLFFBQVE7WUFDUixNQUFNLEVBQUUsTUFBTTtTQUNmLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUExRUQsMERBMEVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgT3V0cHV0RmlsZSwgUGx1Z2luQnVpbGQgfSBmcm9tICdlc2J1aWxkJztcbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgTG9hZFJlc3VsdENhY2hlIH0gZnJvbSAnLi4vbG9hZC1yZXN1bHQtY2FjaGUnO1xuaW1wb3J0IHsgQnVuZGxlU3R5bGVzaGVldE9wdGlvbnMsIGJ1bmRsZUNvbXBvbmVudFN0eWxlc2hlZXQgfSBmcm9tICcuLi9zdHlsZXNoZWV0cy9idW5kbGUtb3B0aW9ucyc7XG5pbXBvcnQge1xuICBKSVRfTkFNRVNQQUNFX1JFR0VYUCxcbiAgSklUX1NUWUxFX05BTUVTUEFDRSxcbiAgSklUX1RFTVBMQVRFX05BTUVTUEFDRSxcbiAgcGFyc2VKaXRVcmksXG59IGZyb20gJy4vdXJpJztcblxuLyoqXG4gKiBMb2Fkcy9leHRyYWN0cyB0aGUgY29udGVudHMgZnJvbSBhIGxvYWQgY2FsbGJhY2sgQW5ndWxhciBKSVQgZW50cnkuXG4gKiBBbiBBbmd1bGFyIEpJVCBlbnRyeSByZXByZXNlbnRzIGVpdGhlciBhIGZpbGUgcGF0aCBmb3IgYSBjb21wb25lbnQgcmVzb3VyY2Ugb3IgYmFzZTY0XG4gKiBlbmNvZGVkIGRhdGEgZm9yIGFuIGlubGluZSBjb21wb25lbnQgcmVzb3VyY2UuXG4gKiBAcGFyYW0gZW50cnkgVGhlIHZhbHVlIHRoYXQgcmVwcmVzZW50cyBjb250ZW50IHRvIGxvYWQuXG4gKiBAcGFyYW0gcm9vdCBUaGUgYWJzb2x1dGUgcGF0aCBmb3IgdGhlIHJvb3Qgb2YgdGhlIGJ1aWxkICh0eXBpY2FsbHkgdGhlIHdvcmtzcGFjZSByb290KS5cbiAqIEBwYXJhbSBza2lwUmVhZCBJZiB0cnVlLCBkbyBub3QgYXR0ZW1wdCB0byByZWFkIHRoZSBmaWxlOyBpZiBmYWxzZSwgcmVhZCBmaWxlIGNvbnRlbnQgZnJvbSBkaXNrLlxuICogVGhpcyBvcHRpb24gaGFzIG5vIGVmZmVjdCBpZiB0aGUgZW50cnkgZG9lcyBub3Qgb3JpZ2luYXRlIGZyb20gYSBmaWxlLiBEZWZhdWx0cyB0byBmYWxzZS5cbiAqIEByZXR1cm5zIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBhYnNvbHV0ZSBwYXRoIG9mIHRoZSBjb250ZW50cyBhbmQgb3B0aW9uYWxseSB0aGUgYWN0dWFsIGNvbnRlbnRzLlxuICogRm9yIGlubGluZSBlbnRyaWVzIHRoZSBjb250ZW50cyB3aWxsIGFsd2F5cyBiZSBwcm92aWRlZC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEVudHJ5KFxuICBlbnRyeTogc3RyaW5nLFxuICByb290OiBzdHJpbmcsXG4gIHNraXBSZWFkPzogYm9vbGVhbixcbik6IFByb21pc2U8eyBwYXRoOiBzdHJpbmc7IGNvbnRlbnRzPzogc3RyaW5nIH0+IHtcbiAgaWYgKGVudHJ5LnN0YXJ0c1dpdGgoJ2ZpbGU6JykpIHtcbiAgICBjb25zdCBzcGVjaWZpZXIgPSBwYXRoLmpvaW4ocm9vdCwgZW50cnkuc2xpY2UoNSkpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHBhdGg6IHNwZWNpZmllcixcbiAgICAgIGNvbnRlbnRzOiBza2lwUmVhZCA/IHVuZGVmaW5lZCA6IGF3YWl0IHJlYWRGaWxlKHNwZWNpZmllciwgJ3V0Zi04JyksXG4gICAgfTtcbiAgfSBlbHNlIGlmIChlbnRyeS5zdGFydHNXaXRoKCdpbmxpbmU6JykpIHtcbiAgICBjb25zdCBbaW1wb3J0ZXIsIGRhdGFdID0gZW50cnkuc2xpY2UoNykuc3BsaXQoJzsnLCAyKTtcblxuICAgIHJldHVybiB7XG4gICAgICBwYXRoOiBwYXRoLmpvaW4ocm9vdCwgaW1wb3J0ZXIpLFxuICAgICAgY29udGVudHM6IEJ1ZmZlci5mcm9tKGRhdGEsICdiYXNlNjQnKS50b1N0cmluZygpLFxuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRhdGEgZm9yIEFuZ3VsYXIgSklUIGVudHJ5LicpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBlc2J1aWxkIHJlc29sdmUgYW5kIGxvYWQgY2FsbGJhY2tzIHRvIHN1cHBvcnQgQW5ndWxhciBKSVQgbW9kZSBwcm9jZXNzaW5nXG4gKiBmb3IgYm90aCBDb21wb25lbnQgc3R5bGVzaGVldHMgYW5kIHRlbXBsYXRlcy4gVGhlc2UgY2FsbGJhY2tzIHdvcmsgYWxvbmdzaWRlIHRoZSBKSVRcbiAqIHJlc291cmNlIFR5cGVTY3JpcHQgdHJhbnNmb3JtZXIgdG8gY29udmVydCBhbmQgdGhlbiBidW5kbGUgQ29tcG9uZW50IHJlc291cmNlcyBhc1xuICogc3RhdGljIGltcG9ydHMuXG4gKiBAcGFyYW0gYnVpbGQgQW4gZXNidWlsZCB7QGxpbmsgUGx1Z2luQnVpbGR9IGluc3RhbmNlIHVzZWQgdG8gYWRkIGNhbGxiYWNrcy5cbiAqIEBwYXJhbSBzdHlsZU9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gdXNlIHdoZW4gYnVuZGxpbmcgc3R5bGVzaGVldHMuXG4gKiBAcGFyYW0gc3R5bGVzaGVldFJlc291cmNlRmlsZXMgQW4gYXJyYXkgd2hlcmUgc3R5bGVzaGVldCByZXNvdXJjZXMgd2lsbCBiZSBhZGRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldHVwSml0UGx1Z2luQ2FsbGJhY2tzKFxuICBidWlsZDogUGx1Z2luQnVpbGQsXG4gIHN0eWxlT3B0aW9uczogQnVuZGxlU3R5bGVzaGVldE9wdGlvbnMgJiB7IGlubGluZVN0eWxlTGFuZ3VhZ2U6IHN0cmluZyB9LFxuICBzdHlsZXNoZWV0UmVzb3VyY2VGaWxlczogT3V0cHV0RmlsZVtdLFxuICBjYWNoZT86IExvYWRSZXN1bHRDYWNoZSxcbik6IHZvaWQge1xuICBjb25zdCByb290ID0gYnVpbGQuaW5pdGlhbE9wdGlvbnMuYWJzV29ya2luZ0RpciA/PyAnJztcblxuICAvLyBBZGQgYSByZXNvbHZlIGNhbGxiYWNrIHRvIGNhcHR1cmUgYW5kIHBhcnNlIGFueSBKSVQgVVJJcyB0aGF0IHdlcmUgYWRkZWQgYnkgdGhlXG4gIC8vIEpJVCByZXNvdXJjZSBUeXBlU2NyaXB0IHRyYW5zZm9ybWVyLlxuICAvLyBSZXNvdXJjZXMgb3JpZ2luYXRpbmcgZnJvbSBhIGZpbGUgYXJlIHJlc29sdmVkIGFzIHJlbGF0aXZlIGZyb20gdGhlIGNvbnRhaW5pbmcgZmlsZSAoaW1wb3J0ZXIpLlxuICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IEpJVF9OQU1FU1BBQ0VfUkVHRVhQIH0sIChhcmdzKSA9PiB7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VKaXRVcmkoYXJncy5wYXRoKTtcbiAgICBpZiAoIXBhcnNlZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCB7IG5hbWVzcGFjZSwgb3JpZ2luLCBzcGVjaWZpZXIgfSA9IHBhcnNlZDtcblxuICAgIGlmIChvcmlnaW4gPT09ICdmaWxlJykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLy8gVXNlIGEgcmVsYXRpdmUgcGF0aCB0byBwcmV2ZW50IGZ1bGx5IHJlc29sdmVkIHBhdGhzIGluIHRoZSBtZXRhZmlsZSAoSlNPTiBzdGF0cyBmaWxlKS5cbiAgICAgICAgLy8gVGhpcyBpcyBvbmx5IG5lY2Vzc2FyeSBmb3IgY3VzdG9tIG5hbWVzcGFjZXMuIGVzYnVpbGQgd2lsbCBoYW5kbGUgdGhlIGZpbGUgbmFtZXNwYWNlLlxuICAgICAgICBwYXRoOiAnZmlsZTonICsgcGF0aC5yZWxhdGl2ZShyb290LCBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGFyZ3MuaW1wb3J0ZXIpLCBzcGVjaWZpZXIpKSxcbiAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSW5saW5lIGRhdGEgbWF5IG5lZWQgdGhlIGltcG9ydGVyIHRvIHJlc29sdmUgaW1wb3J0cy9yZWZlcmVuY2VzIHdpdGhpbiB0aGUgY29udGVudFxuICAgICAgY29uc3QgaW1wb3J0ZXIgPSBwYXRoLnJlbGF0aXZlKHJvb3QsIGFyZ3MuaW1wb3J0ZXIpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBwYXRoOiBgaW5saW5lOiR7aW1wb3J0ZXJ9OyR7c3BlY2lmaWVyfWAsXG4gICAgICAgIG5hbWVzcGFjZSxcbiAgICAgIH07XG4gICAgfVxuICB9KTtcblxuICAvLyBBZGQgYSBsb2FkIGNhbGxiYWNrIHRvIGhhbmRsZSBDb21wb25lbnQgc3R5bGVzaGVldHMgKGJvdGggaW5saW5lIGFuZCBleHRlcm5hbClcbiAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvLi8sIG5hbWVzcGFjZTogSklUX1NUWUxFX05BTUVTUEFDRSB9LCBhc3luYyAoYXJncykgPT4ge1xuICAgIC8vIHNraXBSZWFkIGlzIHVzZWQgaGVyZSBiZWNhdXNlIHRoZSBzdHlsZXNoZWV0IGJ1bmRsaW5nIHdpbGwgcmVhZCBhIGZpbGUgc3R5bGVzaGVldFxuICAgIC8vIGRpcmVjdGx5IGVpdGhlciB2aWEgYSBwcmVwcm9jZXNzb3Igb3IgZXNidWlsZCBpdHNlbGYuXG4gICAgY29uc3QgZW50cnkgPSBhd2FpdCBsb2FkRW50cnkoYXJncy5wYXRoLCByb290LCB0cnVlIC8qIHNraXBSZWFkICovKTtcblxuICAgIGNvbnN0IHsgY29udGVudHMsIHJlc291cmNlRmlsZXMsIGVycm9ycywgd2FybmluZ3MgfSA9IGF3YWl0IGJ1bmRsZUNvbXBvbmVudFN0eWxlc2hlZXQoXG4gICAgICBzdHlsZU9wdGlvbnMuaW5saW5lU3R5bGVMYW5ndWFnZSxcbiAgICAgIC8vIFRoZSBgZGF0YWAgcGFyYW1ldGVyIGlzIG9ubHkgbmVlZGVkIGZvciBhIHN0eWxlc2hlZXQgaWYgaXQgd2FzIGlubGluZVxuICAgICAgZW50cnkuY29udGVudHMgPz8gJycsXG4gICAgICBlbnRyeS5wYXRoLFxuICAgICAgZW50cnkuY29udGVudHMgIT09IHVuZGVmaW5lZCxcbiAgICAgIHN0eWxlT3B0aW9ucyxcbiAgICAgIGNhY2hlLFxuICAgICk7XG5cbiAgICBzdHlsZXNoZWV0UmVzb3VyY2VGaWxlcy5wdXNoKC4uLnJlc291cmNlRmlsZXMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGVycm9ycyxcbiAgICAgIHdhcm5pbmdzLFxuICAgICAgY29udGVudHMsXG4gICAgICBsb2FkZXI6ICd0ZXh0JyxcbiAgICB9O1xuICB9KTtcblxuICAvLyBBZGQgYSBsb2FkIGNhbGxiYWNrIHRvIGhhbmRsZSBDb21wb25lbnQgdGVtcGxhdGVzXG4gIC8vIE5PVEU6IFdoaWxlIHRoaXMgY2FsbGJhY2sgc3VwcG9ydHMgYm90aCBpbmxpbmUgYW5kIGV4dGVybmFsIHRlbXBsYXRlcywgdGhlIHRyYW5zZm9ybWVyXG4gIC8vIGN1cnJlbnRseSBvbmx5IHN1cHBvcnRzIGdlbmVyYXRpbmcgVVJJcyBmb3IgZXh0ZXJuYWwgdGVtcGxhdGVzLlxuICBidWlsZC5vbkxvYWQoeyBmaWx0ZXI6IC8uLywgbmFtZXNwYWNlOiBKSVRfVEVNUExBVEVfTkFNRVNQQUNFIH0sIGFzeW5jIChhcmdzKSA9PiB7XG4gICAgY29uc3QgeyBjb250ZW50cyB9ID0gYXdhaXQgbG9hZEVudHJ5KGFyZ3MucGF0aCwgcm9vdCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudHMsXG4gICAgICBsb2FkZXI6ICd0ZXh0JyxcbiAgICB9O1xuICB9KTtcbn1cbiJdfQ==