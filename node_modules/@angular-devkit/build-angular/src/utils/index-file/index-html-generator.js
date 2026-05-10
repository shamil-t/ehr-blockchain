"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexHtmlGenerator = void 0;
const fs = __importStar(require("fs"));
const path_1 = require("path");
const strip_bom_1 = require("../strip-bom");
const augment_index_html_1 = require("./augment-index-html");
const inline_critical_css_1 = require("./inline-critical-css");
const inline_fonts_1 = require("./inline-fonts");
const style_nonce_1 = require("./style-nonce");
class IndexHtmlGenerator {
    constructor(options) {
        this.options = options;
        const extraPlugins = [];
        if (this.options.optimization?.fonts.inline) {
            extraPlugins.push(inlineFontsPlugin(this));
        }
        if (this.options.optimization?.styles.inlineCritical) {
            extraPlugins.push(inlineCriticalCssPlugin(this));
        }
        this.plugins = [
            augmentIndexHtmlPlugin(this),
            ...extraPlugins,
            // Runs after the `extraPlugins` to capture any nonce or
            // `style` tags that might've been added by them.
            addStyleNoncePlugin(),
            postTransformPlugin(this),
        ];
    }
    async process(options) {
        let content = (0, strip_bom_1.stripBom)(await this.readIndex(this.options.indexPath));
        const warnings = [];
        const errors = [];
        for (const plugin of this.plugins) {
            const result = await plugin(content, options);
            if (typeof result === 'string') {
                content = result;
            }
            else {
                content = result.content;
                if (result.warnings.length) {
                    warnings.push(...result.warnings);
                }
                if (result.errors.length) {
                    errors.push(...result.errors);
                }
            }
        }
        return {
            content,
            warnings,
            errors,
        };
    }
    async readAsset(path) {
        return fs.promises.readFile(path, 'utf-8');
    }
    async readIndex(path) {
        return fs.promises.readFile(path, 'utf-8');
    }
}
exports.IndexHtmlGenerator = IndexHtmlGenerator;
function augmentIndexHtmlPlugin(generator) {
    const { deployUrl, crossOrigin, sri = false, entrypoints } = generator.options;
    return async (html, options) => {
        const { lang, baseHref, outputPath = '', files, hints } = options;
        return (0, augment_index_html_1.augmentIndexHtml)({
            html,
            baseHref,
            deployUrl,
            crossOrigin,
            sri,
            lang,
            entrypoints,
            loadOutputFile: (filePath) => generator.readAsset((0, path_1.join)(outputPath, filePath)),
            files,
            hints,
        });
    };
}
function inlineFontsPlugin({ options }) {
    const inlineFontsProcessor = new inline_fonts_1.InlineFontsProcessor({
        minify: options.optimization?.styles.minify,
    });
    return async (html) => inlineFontsProcessor.process(html);
}
function inlineCriticalCssPlugin(generator) {
    const inlineCriticalCssProcessor = new inline_critical_css_1.InlineCriticalCssProcessor({
        minify: generator.options.optimization?.styles.minify,
        deployUrl: generator.options.deployUrl,
        readAsset: (filePath) => generator.readAsset(filePath),
    });
    return async (html, options) => inlineCriticalCssProcessor.process(html, { outputPath: options.outputPath });
}
function addStyleNoncePlugin() {
    return (html) => (0, style_nonce_1.addStyleNonce)(html);
}
function postTransformPlugin({ options }) {
    return async (html) => (options.postTransform ? options.postTransform(html) : html);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgtaHRtbC1nZW5lcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9pbmRleC1maWxlL2luZGV4LWh0bWwtZ2VuZXJhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsdUNBQXlCO0FBQ3pCLCtCQUE0QjtBQUc1Qiw0Q0FBd0M7QUFDeEMsNkRBQWdHO0FBQ2hHLCtEQUFtRTtBQUNuRSxpREFBc0Q7QUFDdEQsK0NBQThDO0FBb0M5QyxNQUFhLGtCQUFrQjtJQUc3QixZQUFxQixPQUFrQztRQUFsQyxZQUFPLEdBQVAsT0FBTyxDQUEyQjtRQUNyRCxNQUFNLFlBQVksR0FBK0IsRUFBRSxDQUFDO1FBQ3BELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUMzQyxZQUFZLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDNUM7UUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxjQUFjLEVBQUU7WUFDcEQsWUFBWSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ2xEO1FBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRztZQUNiLHNCQUFzQixDQUFDLElBQUksQ0FBQztZQUM1QixHQUFHLFlBQVk7WUFDZix3REFBd0Q7WUFDeEQsaURBQWlEO1lBQ2pELG1CQUFtQixFQUFFO1lBQ3JCLG1CQUFtQixDQUFDLElBQUksQ0FBQztTQUMxQixDQUFDO0lBQ0osQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBeUM7UUFDckQsSUFBSSxPQUFPLEdBQUcsSUFB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LEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO0tBQ3ZELENBQUMsQ0FBQztJQUVILE9BQU8sS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUM3QiwwQkFBMEIsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0FBQ2pGLENBQUM7QUFFRCxTQUFTLG1CQUFtQjtJQUMxQixPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFBLDJCQUFhLEVBQUMsSUFBSSxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUVELFNBQVMsbUJBQW1CLENBQUMsRUFBRSxPQUFPLEVBQXNCO0lBQzFELE9BQU8sS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IE5vcm1hbGl6ZWRDYWNoZWRPcHRpb25zIH0gZnJvbSAnLi4vbm9ybWFsaXplLWNhY2hlJztcbmltcG9ydCB7IE5vcm1hbGl6ZWRPcHRpbWl6YXRpb25PcHRpb25zIH0gZnJvbSAnLi4vbm9ybWFsaXplLW9wdGltaXphdGlvbic7XG5pbXBvcnQgeyBzdHJpcEJvbSB9IGZyb20gJy4uL3N0cmlwLWJvbSc7XG5pbXBvcnQgeyBDcm9zc09yaWdpblZhbHVlLCBFbnRyeXBvaW50LCBGaWxlSW5mbywgYXVnbWVudEluZGV4SHRtbCB9IGZyb20gJy4vYXVnbWVudC1pbmRleC1odG1sJztcbmltcG9ydCB7IElubGluZUNyaXRpY2FsQ3NzUHJvY2Vzc29yIH0gZnJvbSAnLi9pbmxpbmUtY3JpdGljYWwtY3NzJztcbmltcG9ydCB7IElubGluZUZvbnRzUHJvY2Vzc29yIH0gZnJvbSAnLi9pbmxpbmUtZm9udHMnO1xuaW1wb3J0IHsgYWRkU3R5bGVOb25jZSB9IGZyb20gJy4vc3R5bGUtbm9uY2UnO1xuXG50eXBlIEluZGV4SHRtbEdlbmVyYXRvclBsdWdpbiA9IChcbiAgaHRtbDogc3RyaW5nLFxuICBvcHRpb25zOiBJbmRleEh0bWxHZW5lcmF0b3JQcm9jZXNzT3B0aW9ucyxcbikgPT4gUHJvbWlzZTxzdHJpbmcgfCBJbmRleEh0bWxUcmFuc2Zvcm1SZXN1bHQ+O1xuXG5leHBvcnQgdHlwZSBIaW50TW9kZSA9ICdwcmVmZXRjaCcgfCAncHJlbG9hZCcgfCAnbW9kdWxlcHJlbG9hZCcgfCAncHJlY29ubmVjdCcgfCAnZG5zLXByZWZldGNoJztcblxuZXhwb3J0IGludGVyZmFjZSBJbmRleEh0bWxHZW5lcmF0b3JQcm9jZXNzT3B0aW9ucyB7XG4gIGxhbmc6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgYmFzZUhyZWY6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgb3V0cHV0UGF0aDogc3RyaW5nO1xuICBmaWxlczogRmlsZUluZm9bXTtcbiAgaGludHM/OiB7IHVybDogc3RyaW5nOyBtb2RlOiBIaW50TW9kZTsgYXM/OiBzdHJpbmcgfVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluZGV4SHRtbEdlbmVyYXRvck9wdGlvbnMge1xuICBpbmRleFBhdGg6IHN0cmluZztcbiAgZGVwbG95VXJsPzogc3RyaW5nO1xuICBzcmk/OiBib29sZWFuO1xuICBlbnRyeXBvaW50czogRW50cnlwb2ludFtdO1xuICBwb3N0VHJhbnNmb3JtPzogSW5kZXhIdG1sVHJhbnNmb3JtO1xuICBjcm9zc09yaWdpbj86IENyb3NzT3JpZ2luVmFsdWU7XG4gIG9wdGltaXphdGlvbj86IE5vcm1hbGl6ZWRPcHRpbWl6YXRpb25PcHRpb25zO1xuICBjYWNoZT86IE5vcm1hbGl6ZWRDYWNoZWRPcHRpb25zO1xufVxuXG5leHBvcnQgdHlwZSBJbmRleEh0bWxUcmFuc2Zvcm0gPSAoY29udGVudDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz47XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5kZXhIdG1sVHJhbnNmb3JtUmVzdWx0IHtcbiAgY29udGVudDogc3RyaW5nO1xuICB3YXJuaW5nczogc3RyaW5nW107XG4gIGVycm9yczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjbGFzcyBJbmRleEh0bWxHZW5lcmF0b3Ige1xuICBwcml2YXRlIHJlYWRvbmx5IHBsdWdpbnM6IEluZGV4SHRtbEdlbmVyYXRvclBsdWdpbltdO1xuXG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IG9wdGlvbnM6IEluZGV4SHRtbEdlbmVyYXRvck9wdGlvbnMpIHtcbiAgICBjb25zdCBleHRyYVBsdWdpbnM6IEluZGV4SHRtbEdlbmVyYXRvclBsdWdpbltdID0gW107XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vcHRpbWl6YXRpb24/LmZvbnRzLmlubGluZSkge1xuICAgICAgZXh0cmFQbHVnaW5zLnB1c2goaW5saW5lRm9udHNQbHVnaW4odGhpcykpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMub3B0aW1pemF0aW9uPy5zdHlsZXMuaW5saW5lQ3JpdGljYWwpIHtcbiAgICAgIGV4dHJhUGx1Z2lucy5wdXNoKGlubGluZUNyaXRpY2FsQ3NzUGx1Z2luKHRoaXMpKTtcbiAgICB9XG5cbiAgICB0aGlzLnBsdWdpbnMgPSBbXG4gICAgICBhdWdtZW50SW5kZXhIdG1sUGx1Z2luKHRoaXMpLFxuICAgICAgLi4uZXh0cmFQbHVnaW5zLFxuICAgICAgLy8gUnVucyBhZnRlciB0aGUgYGV4dHJhUGx1Z2luc2AgdG8gY2FwdHVyZSBhbnkgbm9uY2Ugb3JcbiAgICAgIC8vIGBzdHlsZWAgdGFncyB0aGF0IG1pZ2h0J3ZlIGJlZW4gYWRkZWQgYnkgdGhlbS5cbiAgICAgIGFkZFN0eWxlTm9uY2VQbHVnaW4oKSxcbiAgICAgIHBvc3RUcmFuc2Zvcm1QbHVnaW4odGhpcyksXG4gICAgXTtcbiAgfVxuXG4gIGFzeW5jIHByb2Nlc3Mob3B0aW9uczogSW5kZXhIdG1sR2VuZXJhdG9yUHJvY2Vzc09wdGlvbnMpOiBQcm9taXNlPEluZGV4SHRtbFRyYW5zZm9ybVJlc3VsdD4ge1xuICAgIGxldCBjb250ZW50ID0gc3RyaXBCb20oYXdhaXQgdGhpcy5yZWFkSW5kZXgodGhpcy5vcHRpb25zLmluZGV4UGF0aCkpO1xuICAgIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgcGx1Z2luIG9mIHRoaXMucGx1Z2lucykge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcGx1Z2luKGNvbnRlbnQsIG9wdGlvbnMpO1xuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnRlbnQgPSByZXN1bHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250ZW50ID0gcmVzdWx0LmNvbnRlbnQ7XG5cbiAgICAgICAgaWYgKHJlc3VsdC53YXJuaW5ncy5sZW5ndGgpIHtcbiAgICAgICAgICB3YXJuaW5ncy5wdXNoKC4uLnJlc3VsdC53YXJuaW5ncyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVzdWx0LmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaCguLi5yZXN1bHQuZXJyb3JzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50LFxuICAgICAgd2FybmluZ3MsXG4gICAgICBlcnJvcnMsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIHJlYWRBc3NldChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBmcy5wcm9taXNlcy5yZWFkRmlsZShwYXRoLCAndXRmLTgnKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyByZWFkSW5kZXgocGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gZnMucHJvbWlzZXMucmVhZEZpbGUocGF0aCwgJ3V0Zi04Jyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXVnbWVudEluZGV4SHRtbFBsdWdpbihnZW5lcmF0b3I6IEluZGV4SHRtbEdlbmVyYXRvcik6IEluZGV4SHRtbEdlbmVyYXRvclBsdWdpbiB7XG4gIGNvbnN0IHsgZGVwbG95VXJsLCBjcm9zc09yaWdpbiwgc3JpID0gZmFsc2UsIGVudHJ5cG9pbnRzIH0gPSBnZW5lcmF0b3Iub3B0aW9ucztcblxuICByZXR1cm4gYXN5bmMgKGh0bWwsIG9wdGlvbnMpID0+IHtcbiAgICBjb25zdCB7IGxhbmcsIGJhc2VIcmVmLCBvdXRwdXRQYXRoID0gJycsIGZpbGVzLCBoaW50cyB9ID0gb3B0aW9ucztcblxuICAgIHJldHVybiBhdWdtZW50SW5kZXhIdG1sKHtcbiAgICAgIGh0bWwsXG4gICAgICBiYXNlSHJlZixcbiAgICAgIGRlcGxveVVybCxcbiAgICAgIGNyb3NzT3JpZ2luLFxuICAgICAgc3JpLFxuICAgICAgbGFuZyxcbiAgICAgIGVudHJ5cG9pbnRzLFxuICAgICAgbG9hZE91dHB1dEZpbGU6IChmaWxlUGF0aCkgPT4gZ2VuZXJhdG9yLnJlYWRBc3NldChqb2luKG91dHB1dFBhdGgsIGZpbGVQYXRoKSksXG4gICAgICBmaWxlcyxcbiAgICAgIGhpbnRzLFxuICAgIH0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiBpbmxpbmVGb250c1BsdWdpbih7IG9wdGlvbnMgfTogSW5kZXhIdG1sR2VuZXJhdG9yKTogSW5kZXhIdG1sR2VuZXJhdG9yUGx1Z2luIHtcbiAgY29uc3QgaW5saW5lRm9udHNQcm9jZXNzb3IgPSBuZXcgSW5saW5lRm9udHNQcm9jZXNzb3Ioe1xuICAgIG1pbmlmeTogb3B0aW9ucy5vcHRpbWl6YXRpb24/LnN0eWxlcy5taW5pZnksXG4gIH0pO1xuXG4gIHJldHVybiBhc3luYyAoaHRtbCkgPT4gaW5saW5lRm9udHNQcm9jZXNzb3IucHJvY2VzcyhodG1sKTtcbn1cblxuZnVuY3Rpb24gaW5saW5lQ3JpdGljYWxDc3NQbHVnaW4oZ2VuZXJhdG9yOiBJbmRleEh0bWxHZW5lcmF0b3IpOiBJbmRleEh0bWxHZW5lcmF0b3JQbHVnaW4ge1xuICBjb25zdCBpbmxpbmVDcml0aWNhbENzc1Byb2Nlc3NvciA9IG5ldyBJbmxpbmVDcml0aWNhbENzc1Byb2Nlc3Nvcih7XG4gICAgbWluaWZ5OiBnZW5lcmF0b3Iub3B0aW9ucy5vcHRpbWl6YXRpb24/LnN0eWxlcy5taW5pZnksXG4gICAgZGVwbG95VXJsOiBnZW5lcmF0b3Iub3B0aW9ucy5kZXBsb3lVcmwsXG4gICAgcmVhZEFzc2V0OiAoZmlsZVBhdGgpID0+IGdlbmVyYXRvci5yZWFkQXNzZXQoZmlsZVBhdGgpLFxuICB9KTtcblxuICByZXR1cm4gYXN5bmMgKGh0bWwsIG9wdGlvbnMpID0+XG4gICAgaW5saW5lQ3JpdGljYWxDc3NQcm9jZXNzb3IucHJvY2VzcyhodG1sLCB7IG91dHB1dFBhdGg6IG9wdGlvbnMub3V0cHV0UGF0aCB9KTtcbn1cblxuZnVuY3Rpb24gYWRkU3R5bGVOb25jZVBsdWdpbigpOiBJbmRleEh0bWxHZW5lcmF0b3JQbHVnaW4ge1xuICByZXR1cm4gKGh0bWwpID0+IGFkZFN0eWxlTm9uY2UoaHRtbCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RUcmFuc2Zvcm1QbHVnaW4oeyBvcHRpb25zIH06IEluZGV4SHRtbEdlbmVyYXRvcik6IEluZGV4SHRtbEdlbmVyYXRvclBsdWdpbiB7XG4gIHJldHVybiBhc3luYyAoaHRtbCkgPT4gKG9wdGlvbnMucG9zdFRyYW5zZm9ybSA/IG9wdGlvbnMucG9zdFRyYW5zZm9ybShodG1sKSA6IGh0bWwpO1xufVxuIl19