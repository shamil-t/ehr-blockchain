"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.augmentIndexHtml = void 0;
const node_crypto_1 = require("node:crypto");
const node_path_1 = require("node:path");
const load_esm_1 = require("../load-esm");
const html_rewriting_stream_1 = require("./html-rewriting-stream");
/*
 * Helper function used by the IndexHtmlWebpackPlugin.
 * Can also be directly used by builder, e. g. in order to generate an index.html
 * after processing several configurations in order to build different sets of
 * bundles for differential serving.
 */
async function augmentIndexHtml(params) {
    const { loadOutputFile, files, entrypoints, sri, deployUrl = '', lang, baseHref, html } = params;
    const warnings = [];
    const errors = [];
    let { crossOrigin = 'none' } = params;
    if (sri && crossOrigin === 'none') {
        crossOrigin = 'anonymous';
    }
    const stylesheets = new Set();
    const scripts = new Map();
    // Sort files in the order we want to insert them by entrypoint
    for (const [entrypoint, isModule] of entrypoints) {
        for (const { extension, file, name } of files) {
            if (name !== entrypoint || scripts.has(file) || stylesheets.has(file)) {
                continue;
            }
            switch (extension) {
                case '.js':
                    // Also, non entrypoints need to be loaded as no module as they can contain problematic code.
                    scripts.set(file, isModule);
                    break;
                case '.mjs':
                    if (!isModule) {
                        // It would be very confusing to link an `*.mjs` file in a non-module script context,
                        // so we disallow it entirely.
                        throw new Error('`.mjs` files *must* set `isModule` to `true`.');
                    }
                    scripts.set(file, true /* isModule */);
                    break;
                case '.css':
                    stylesheets.add(file);
                    break;
            }
        }
    }
    let scriptTags = [];
    for (const [src, isModule] of scripts) {
        const attrs = [`src="${deployUrl}${src}"`];
        // This is also need for non entry-points as they may contain problematic code.
        if (isModule) {
            attrs.push('type="module"');
        }
        else {
            attrs.push('defer');
        }
        if (crossOrigin !== 'none') {
            attrs.push(`crossorigin="${crossOrigin}"`);
        }
        if (sri) {
            const content = await loadOutputFile(src);
            attrs.push(generateSriAttributes(content));
        }
        scriptTags.push(`<script ${attrs.join(' ')}></script>`);
    }
    let linkTags = [];
    for (const src of stylesheets) {
        const attrs = [`rel="stylesheet"`, `href="${deployUrl}${src}"`];
        if (crossOrigin !== 'none') {
            attrs.push(`crossorigin="${crossOrigin}"`);
        }
        if (sri) {
            const content = await loadOutputFile(src);
            attrs.push(generateSriAttributes(content));
        }
        linkTags.push(`<link ${attrs.join(' ')}>`);
    }
    if (params.hints?.length) {
        for (const hint of params.hints) {
            const attrs = [`rel="${hint.mode}"`, `href="${deployUrl}${hint.url}"`];
            if (hint.mode !== 'modulepreload' && crossOrigin !== 'none') {
                // Value is considered anonymous by the browser when not present or empty
                attrs.push(crossOrigin === 'anonymous' ? 'crossorigin' : `crossorigin="${crossOrigin}"`);
            }
            if (hint.mode === 'preload' || hint.mode === 'prefetch') {
                switch ((0, node_path_1.extname)(hint.url)) {
                    case '.js':
                        attrs.push('as="script"');
                        break;
                    case '.css':
                        attrs.push('as="style"');
                        break;
                    default:
                        if (hint.as) {
                            attrs.push(`as="${hint.as}"`);
                        }
                        break;
                }
            }
            if (sri &&
                (hint.mode === 'preload' || hint.mode === 'prefetch' || hint.mode === 'modulepreload')) {
                const content = await loadOutputFile(hint.url);
                attrs.push(generateSriAttributes(content));
            }
            linkTags.push(`<link ${attrs.join(' ')}>`);
        }
    }
    const dir = lang ? await getLanguageDirection(lang, warnings) : undefined;
    const { rewriter, transformedContent } = await (0, html_rewriting_stream_1.htmlRewritingStream)(html);
    const baseTagExists = html.includes('<base');
    rewriter
        .on('startTag', (tag) => {
        switch (tag.tagName) {
            case 'html':
                // Adjust document locale if specified
                if (isString(lang)) {
                    updateAttribute(tag, 'lang', lang);
                }
                if (dir) {
                    updateAttribute(tag, 'dir', dir);
                }
                break;
            case 'head':
                // Base href should be added before any link, meta tags
                if (!baseTagExists && isString(baseHref)) {
                    rewriter.emitStartTag(tag);
                    rewriter.emitRaw(`<base href="${baseHref}">`);
                    return;
                }
                break;
            case 'base':
                // Adjust base href if specified
                if (isString(baseHref)) {
                    updateAttribute(tag, 'href', baseHref);
                }
                break;
        }
        rewriter.emitStartTag(tag);
    })
        .on('endTag', (tag) => {
        switch (tag.tagName) {
            case 'head':
                for (const linkTag of linkTags) {
                    rewriter.emitRaw(linkTag);
                }
                linkTags = [];
                break;
            case 'body':
                // Add script tags
                for (const scriptTag of scriptTags) {
                    rewriter.emitRaw(scriptTag);
                }
                scriptTags = [];
                break;
        }
        rewriter.emitEndTag(tag);
    });
    const content = await transformedContent();
    return {
        content: linkTags.length || scriptTags.length
            ? // In case no body/head tags are not present (dotnet partial templates)
                linkTags.join('') + scriptTags.join('') + content
            : content,
        warnings,
        errors,
    };
}
exports.augmentIndexHtml = augmentIndexHtml;
function generateSriAttributes(content) {
    const algo = 'sha384';
    const hash = (0, node_crypto_1.createHash)(algo).update(content, 'utf8').digest('base64');
    return `integrity="${algo}-${hash}"`;
}
function updateAttribute(tag, name, value) {
    const index = tag.attrs.findIndex((a) => a.name === name);
    const newValue = { name, value };
    if (index === -1) {
        tag.attrs.push(newValue);
    }
    else {
        tag.attrs[index] = newValue;
    }
}
function isString(value) {
    return typeof value === 'string';
}
async function getLanguageDirection(locale, warnings) {
    const dir = await getLanguageDirectionFromLocales(locale);
    if (!dir) {
        warnings.push(`Locale data for '${locale}' cannot be found. 'dir' attribute will not be set for this locale.`);
    }
    return dir;
}
async function getLanguageDirectionFromLocales(locale) {
    try {
        const localeData = (await (0, load_esm_1.loadEsmModule)(`@angular/common/locales/${locale}`)).default;
        const dir = localeData[localeData.length - 2];
        return isString(dir) ? dir : undefined;
    }
    catch {
        // In some cases certain locales might map to files which are named only with language id.
        // Example: `en-US` -> `en`.
        const [languageId] = locale.split('-', 1);
        if (languageId !== locale) {
            return getLanguageDirectionFromLocales(languageId);
        }
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVnbWVudC1pbmRleC1odG1sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvaW5kZXgtZmlsZS9hdWdtZW50LWluZGV4LWh0bWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsNkNBQXlDO0FBQ3pDLHlDQUFvQztBQUNwQywwQ0FBNEM7QUFDNUMsbUVBQThEO0FBc0M5RDs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSxnQkFBZ0IsQ0FDcEMsTUFBK0I7SUFFL0IsTUFBTSxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxTQUFTLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDO0lBRWpHLE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztJQUM5QixNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7SUFFNUIsSUFBSSxFQUFFLFdBQVcsR0FBRyxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUM7SUFDdEMsSUFBSSxHQUFHLElBQUksV0FBVyxLQUFLLE1BQU0sRUFBRTtRQUNqQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0tBQzNCO0lBRUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztJQUN0QyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBb0QsQ0FBQztJQUU1RSwrREFBK0Q7SUFDL0QsS0FBSyxNQUFNLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxJQUFJLFdBQVcsRUFBRTtRQUNoRCxLQUFLLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEtBQUssRUFBRTtZQUM3QyxJQUFJLElBQUksS0FBSyxVQUFVLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNyRSxTQUFTO2FBQ1Y7WUFFRCxRQUFRLFNBQVMsRUFBRTtnQkFDakIsS0FBSyxLQUFLO29CQUNSLDZGQUE2RjtvQkFDN0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzVCLE1BQU07Z0JBQ1IsS0FBSyxNQUFNO29CQUNULElBQUksQ0FBQyxRQUFRLEVBQUU7d0JBQ2IscUZBQXFGO3dCQUNyRiw4QkFBOEI7d0JBQzlCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztxQkFDbEU7b0JBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUN2QyxNQUFNO2dCQUNSLEtBQUssTUFBTTtvQkFDVCxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN0QixNQUFNO2FBQ1Q7U0FDRjtLQUNGO0lBRUQsSUFBSSxVQUFVLEdBQWEsRUFBRSxDQUFDO0lBQzlCLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsSUFBSSxPQUFPLEVBQUU7UUFDckMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxRQUFRLFNBQVMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBRTNDLCtFQUErRTtRQUMvRSxJQUFJLFFBQVEsRUFBRTtZQUNaLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7U0FDN0I7YUFBTTtZQUNMLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDckI7UUFFRCxJQUFJLFdBQVcsS0FBSyxNQUFNLEVBQUU7WUFDMUIsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsV0FBVyxHQUFHLENBQUMsQ0FBQztTQUM1QztRQUVELElBQUksR0FBRyxFQUFFO1lBQ1AsTUFBTSxPQUFPLEdBQUcsTUFBTSxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsS0FBSyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1NBQzVDO1FBRUQsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQ3pEO0lBRUQsSUFBSSxRQUFRLEdBQWEsRUFBRSxDQUFDO0lBQzVCLEtBQUssTUFBTSxHQUFHLElBQUksV0FBVyxFQUFFO1FBQzdCLE1BQU0sS0FBSyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxTQUFTLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUVoRSxJQUFJLFdBQVcsS0FBSyxNQUFNLEVBQUU7WUFDMUIsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsV0FBVyxHQUFHLENBQUMsQ0FBQztTQUM1QztRQUVELElBQUksR0FBRyxFQUFFO1lBQ1AsTUFBTSxPQUFPLEdBQUcsTUFBTSxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsS0FBSyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1NBQzVDO1FBRUQsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzVDO0lBRUQsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRTtRQUN4QixLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUU7WUFDL0IsTUFBTSxLQUFLLEdBQUcsQ0FBQyxRQUFRLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxTQUFTLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUV2RSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssZUFBZSxJQUFJLFdBQVcsS0FBSyxNQUFNLEVBQUU7Z0JBQzNELHlFQUF5RTtnQkFDekUsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixXQUFXLEdBQUcsQ0FBQyxDQUFDO2FBQzFGO1lBRUQsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFBRTtnQkFDdkQsUUFBUSxJQUFBLG1CQUFPLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUN6QixLQUFLLEtBQUs7d0JBQ1IsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDMUIsTUFBTTtvQkFDUixLQUFLLE1BQU07d0JBQ1QsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQzt3QkFDekIsTUFBTTtvQkFDUjt3QkFDRSxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUU7NEJBQ1gsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO3lCQUMvQjt3QkFDRCxNQUFNO2lCQUNUO2FBQ0Y7WUFFRCxJQUNFLEdBQUc7Z0JBQ0gsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFVBQVUsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLGVBQWUsQ0FBQyxFQUN0RjtnQkFDQSxNQUFNLE9BQU8sR0FBRyxNQUFNLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQy9DLEtBQUssQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzthQUM1QztZQUVELFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QztLQUNGO0lBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLG9CQUFvQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQzFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUUsR0FBRyxNQUFNLElBQUEsMkNBQW1CLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDekUsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUU3QyxRQUFRO1NBQ0wsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQ3RCLFFBQVEsR0FBRyxDQUFDLE9BQU8sRUFBRTtZQUNuQixLQUFLLE1BQU07Z0JBQ1Qsc0NBQXNDO2dCQUN0QyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDbEIsZUFBZSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ3BDO2dCQUVELElBQUksR0FBRyxFQUFFO29CQUNQLGVBQWUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUNsQztnQkFDRCxNQUFNO1lBQ1IsS0FBSyxNQUFNO2dCQUNULHVEQUF1RDtnQkFDdkQsSUFBSSxDQUFDLGFBQWEsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ3hDLFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzNCLFFBQVEsQ0FBQyxPQUFPLENBQUMsZUFBZSxRQUFRLElBQUksQ0FBQyxDQUFDO29CQUU5QyxPQUFPO2lCQUNSO2dCQUNELE1BQU07WUFDUixLQUFLLE1BQU07Z0JBQ1QsZ0NBQWdDO2dCQUNoQyxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDdEIsZUFBZSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7aUJBQ3hDO2dCQUNELE1BQU07U0FDVDtRQUVELFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDN0IsQ0FBQyxDQUFDO1NBQ0QsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQ3BCLFFBQVEsR0FBRyxDQUFDLE9BQU8sRUFBRTtZQUNuQixLQUFLLE1BQU07Z0JBQ1QsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7b0JBQzlCLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQzNCO2dCQUVELFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBQ2QsTUFBTTtZQUNSLEtBQUssTUFBTTtnQkFDVCxrQkFBa0I7Z0JBQ2xCLEtBQUssTUFBTSxTQUFTLElBQUksVUFBVSxFQUFFO29CQUNsQyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUM3QjtnQkFFRCxVQUFVLEdBQUcsRUFBRSxDQUFDO2dCQUNoQixNQUFNO1NBQ1Q7UUFFRCxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzNCLENBQUMsQ0FBQyxDQUFDO0lBRUwsTUFBTSxPQUFPLEdBQUcsTUFBTSxrQkFBa0IsRUFBRSxDQUFDO0lBRTNDLE9BQU87UUFDTCxPQUFPLEVBQ0wsUUFBUSxDQUFDLE1BQU0sSUFBSSxVQUFVLENBQUMsTUFBTTtZQUNsQyxDQUFDLENBQUMsdUVBQXVFO2dCQUN2RSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTztZQUNuRCxDQUFDLENBQUMsT0FBTztRQUNiLFFBQVE7UUFDUixNQUFNO0tBQ1AsQ0FBQztBQUNKLENBQUM7QUE1TEQsNENBNExDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxPQUFlO0lBQzVDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQztJQUN0QixNQUFNLElBQUksR0FBRyxJQUFBLHdCQUFVLEVBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFdkUsT0FBTyxjQUFjLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUN2QyxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQ3RCLEdBQWlELEVBQ2pELElBQVksRUFDWixLQUFhO0lBRWIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUM7SUFDMUQsTUFBTSxRQUFRLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFFakMsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDaEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDMUI7U0FBTTtRQUNMLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsUUFBUSxDQUFDO0tBQzdCO0FBQ0gsQ0FBQztBQUVELFNBQVMsUUFBUSxDQUFDLEtBQWM7SUFDOUIsT0FBTyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUM7QUFDbkMsQ0FBQztBQUVELEtBQUssVUFBVSxvQkFBb0IsQ0FDakMsTUFBYyxFQUNkLFFBQWtCO0lBRWxCLE1BQU0sR0FBRyxHQUFHLE1BQU0sK0JBQStCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFMUQsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNSLFFBQVEsQ0FBQyxJQUFJLENBQ1gsb0JBQW9CLE1BQU0scUVBQXFFLENBQ2hHLENBQUM7S0FDSDtJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVELEtBQUssVUFBVSwrQkFBK0IsQ0FBQyxNQUFjO0lBQzNELElBQUk7UUFDRixNQUFNLFVBQVUsR0FBRyxDQUNqQixNQUFNLElBQUEsd0JBQWEsRUFDakIsMkJBQTJCLE1BQU0sRUFBRSxDQUNwQyxDQUNGLENBQUMsT0FBTyxDQUFDO1FBRVYsTUFBTSxHQUFHLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFOUMsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0tBQ3hDO0lBQUMsTUFBTTtRQUNOLDBGQUEwRjtRQUMxRiw0QkFBNEI7UUFDNUIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFDLElBQUksVUFBVSxLQUFLLE1BQU0sRUFBRTtZQUN6QixPQUFPLCtCQUErQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3BEO0tBQ0Y7SUFFRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IGNyZWF0ZUhhc2ggfSBmcm9tICdub2RlOmNyeXB0byc7XG5pbXBvcnQgeyBleHRuYW1lIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IGxvYWRFc21Nb2R1bGUgfSBmcm9tICcuLi9sb2FkLWVzbSc7XG5pbXBvcnQgeyBodG1sUmV3cml0aW5nU3RyZWFtIH0gZnJvbSAnLi9odG1sLXJld3JpdGluZy1zdHJlYW0nO1xuXG5leHBvcnQgdHlwZSBMb2FkT3V0cHV0RmlsZUZ1bmN0aW9uVHlwZSA9IChmaWxlOiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPjtcblxuZXhwb3J0IHR5cGUgQ3Jvc3NPcmlnaW5WYWx1ZSA9ICdub25lJyB8ICdhbm9ueW1vdXMnIHwgJ3VzZS1jcmVkZW50aWFscyc7XG5cbmV4cG9ydCB0eXBlIEVudHJ5cG9pbnQgPSBbbmFtZTogc3RyaW5nLCBpc01vZHVsZTogYm9vbGVhbl07XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXVnbWVudEluZGV4SHRtbE9wdGlvbnMge1xuICAvKiBJbnB1dCBjb250ZW50cyAqL1xuICBodG1sOiBzdHJpbmc7XG4gIGJhc2VIcmVmPzogc3RyaW5nO1xuICBkZXBsb3lVcmw/OiBzdHJpbmc7XG4gIHNyaTogYm9vbGVhbjtcbiAgLyoqIGNyb3Nzb3JpZ2luIGF0dHJpYnV0ZSBzZXR0aW5nIG9mIGVsZW1lbnRzIHRoYXQgcHJvdmlkZSBDT1JTIHN1cHBvcnQgKi9cbiAgY3Jvc3NPcmlnaW4/OiBDcm9zc09yaWdpblZhbHVlO1xuICAvKlxuICAgKiBGaWxlcyBlbWl0dGVkIGJ5IHRoZSBidWlsZC5cbiAgICovXG4gIGZpbGVzOiBGaWxlSW5mb1tdO1xuICAvKlxuICAgKiBGdW5jdGlvbiB0aGF0IGxvYWRzIGEgZmlsZSB1c2VkLlxuICAgKiBUaGlzIGFsbG93cyB1cyB0byB1c2UgZGlmZmVyZW50IHJvdXRpbmVzIHdpdGhpbiB0aGUgSW5kZXhIdG1sV2VicGFja1BsdWdpbiBhbmRcbiAgICogd2hlbiB1c2VkIHdpdGhvdXQgdGhpcyBwbHVnaW4uXG4gICAqL1xuICBsb2FkT3V0cHV0RmlsZTogTG9hZE91dHB1dEZpbGVGdW5jdGlvblR5cGU7XG4gIC8qKiBVc2VkIHRvIHNvcnQgdGhlIGluc2VyYXRpb24gb2YgZmlsZXMgaW4gdGhlIEhUTUwgZmlsZSAqL1xuICBlbnRyeXBvaW50czogRW50cnlwb2ludFtdO1xuICAvKiogVXNlZCB0byBzZXQgdGhlIGRvY3VtZW50IGRlZmF1bHQgbG9jYWxlICovXG4gIGxhbmc/OiBzdHJpbmc7XG4gIGhpbnRzPzogeyB1cmw6IHN0cmluZzsgbW9kZTogc3RyaW5nOyBhcz86IHN0cmluZyB9W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmlsZUluZm8ge1xuICBmaWxlOiBzdHJpbmc7XG4gIG5hbWU/OiBzdHJpbmc7XG4gIGV4dGVuc2lvbjogc3RyaW5nO1xufVxuLypcbiAqIEhlbHBlciBmdW5jdGlvbiB1c2VkIGJ5IHRoZSBJbmRleEh0bWxXZWJwYWNrUGx1Z2luLlxuICogQ2FuIGFsc28gYmUgZGlyZWN0bHkgdXNlZCBieSBidWlsZGVyLCBlLiBnLiBpbiBvcmRlciB0byBnZW5lcmF0ZSBhbiBpbmRleC5odG1sXG4gKiBhZnRlciBwcm9jZXNzaW5nIHNldmVyYWwgY29uZmlndXJhdGlvbnMgaW4gb3JkZXIgdG8gYnVpbGQgZGlmZmVyZW50IHNldHMgb2ZcbiAqIGJ1bmRsZXMgZm9yIGRpZmZlcmVudGlhbCBzZXJ2aW5nLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXVnbWVudEluZGV4SHRtbChcbiAgcGFyYW1zOiBBdWdtZW50SW5kZXhIdG1sT3B0aW9ucyxcbik6IFByb21pc2U8eyBjb250ZW50OiBzdHJpbmc7IHdhcm5pbmdzOiBzdHJpbmdbXTsgZXJyb3JzOiBzdHJpbmdbXSB9PiB7XG4gIGNvbnN0IHsgbG9hZE91dHB1dEZpbGUsIGZpbGVzLCBlbnRyeXBvaW50cywgc3JpLCBkZXBsb3lVcmwgPSAnJywgbGFuZywgYmFzZUhyZWYsIGh0bWwgfSA9IHBhcmFtcztcblxuICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCB7IGNyb3NzT3JpZ2luID0gJ25vbmUnIH0gPSBwYXJhbXM7XG4gIGlmIChzcmkgJiYgY3Jvc3NPcmlnaW4gPT09ICdub25lJykge1xuICAgIGNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XG4gIH1cblxuICBjb25zdCBzdHlsZXNoZWV0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBzY3JpcHRzID0gbmV3IE1hcDwvKiogZmlsZSBuYW1lICovIHN0cmluZywgLyoqIGlzTW9kdWxlICovIGJvb2xlYW4+KCk7XG5cbiAgLy8gU29ydCBmaWxlcyBpbiB0aGUgb3JkZXIgd2Ugd2FudCB0byBpbnNlcnQgdGhlbSBieSBlbnRyeXBvaW50XG4gIGZvciAoY29uc3QgW2VudHJ5cG9pbnQsIGlzTW9kdWxlXSBvZiBlbnRyeXBvaW50cykge1xuICAgIGZvciAoY29uc3QgeyBleHRlbnNpb24sIGZpbGUsIG5hbWUgfSBvZiBmaWxlcykge1xuICAgICAgaWYgKG5hbWUgIT09IGVudHJ5cG9pbnQgfHwgc2NyaXB0cy5oYXMoZmlsZSkgfHwgc3R5bGVzaGVldHMuaGFzKGZpbGUpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKGV4dGVuc2lvbikge1xuICAgICAgICBjYXNlICcuanMnOlxuICAgICAgICAgIC8vIEFsc28sIG5vbiBlbnRyeXBvaW50cyBuZWVkIHRvIGJlIGxvYWRlZCBhcyBubyBtb2R1bGUgYXMgdGhleSBjYW4gY29udGFpbiBwcm9ibGVtYXRpYyBjb2RlLlxuICAgICAgICAgIHNjcmlwdHMuc2V0KGZpbGUsIGlzTW9kdWxlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnLm1qcyc6XG4gICAgICAgICAgaWYgKCFpc01vZHVsZSkge1xuICAgICAgICAgICAgLy8gSXQgd291bGQgYmUgdmVyeSBjb25mdXNpbmcgdG8gbGluayBhbiBgKi5tanNgIGZpbGUgaW4gYSBub24tbW9kdWxlIHNjcmlwdCBjb250ZXh0LFxuICAgICAgICAgICAgLy8gc28gd2UgZGlzYWxsb3cgaXQgZW50aXJlbHkuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2AubWpzYCBmaWxlcyAqbXVzdCogc2V0IGBpc01vZHVsZWAgdG8gYHRydWVgLicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzY3JpcHRzLnNldChmaWxlLCB0cnVlIC8qIGlzTW9kdWxlICovKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnLmNzcyc6XG4gICAgICAgICAgc3R5bGVzaGVldHMuYWRkKGZpbGUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBzY3JpcHRUYWdzOiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IFtzcmMsIGlzTW9kdWxlXSBvZiBzY3JpcHRzKSB7XG4gICAgY29uc3QgYXR0cnMgPSBbYHNyYz1cIiR7ZGVwbG95VXJsfSR7c3JjfVwiYF07XG5cbiAgICAvLyBUaGlzIGlzIGFsc28gbmVlZCBmb3Igbm9uIGVudHJ5LXBvaW50cyBhcyB0aGV5IG1heSBjb250YWluIHByb2JsZW1hdGljIGNvZGUuXG4gICAgaWYgKGlzTW9kdWxlKSB7XG4gICAgICBhdHRycy5wdXNoKCd0eXBlPVwibW9kdWxlXCInKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXR0cnMucHVzaCgnZGVmZXInKTtcbiAgICB9XG5cbiAgICBpZiAoY3Jvc3NPcmlnaW4gIT09ICdub25lJykge1xuICAgICAgYXR0cnMucHVzaChgY3Jvc3NvcmlnaW49XCIke2Nyb3NzT3JpZ2lufVwiYCk7XG4gICAgfVxuXG4gICAgaWYgKHNyaSkge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGxvYWRPdXRwdXRGaWxlKHNyYyk7XG4gICAgICBhdHRycy5wdXNoKGdlbmVyYXRlU3JpQXR0cmlidXRlcyhjb250ZW50KSk7XG4gICAgfVxuXG4gICAgc2NyaXB0VGFncy5wdXNoKGA8c2NyaXB0ICR7YXR0cnMuam9pbignICcpfT48L3NjcmlwdD5gKTtcbiAgfVxuXG4gIGxldCBsaW5rVGFnczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBzcmMgb2Ygc3R5bGVzaGVldHMpIHtcbiAgICBjb25zdCBhdHRycyA9IFtgcmVsPVwic3R5bGVzaGVldFwiYCwgYGhyZWY9XCIke2RlcGxveVVybH0ke3NyY31cImBdO1xuXG4gICAgaWYgKGNyb3NzT3JpZ2luICE9PSAnbm9uZScpIHtcbiAgICAgIGF0dHJzLnB1c2goYGNyb3Nzb3JpZ2luPVwiJHtjcm9zc09yaWdpbn1cImApO1xuICAgIH1cblxuICAgIGlmIChzcmkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBsb2FkT3V0cHV0RmlsZShzcmMpO1xuICAgICAgYXR0cnMucHVzaChnZW5lcmF0ZVNyaUF0dHJpYnV0ZXMoY29udGVudCkpO1xuICAgIH1cblxuICAgIGxpbmtUYWdzLnB1c2goYDxsaW5rICR7YXR0cnMuam9pbignICcpfT5gKTtcbiAgfVxuXG4gIGlmIChwYXJhbXMuaGludHM/Lmxlbmd0aCkge1xuICAgIGZvciAoY29uc3QgaGludCBvZiBwYXJhbXMuaGludHMpIHtcbiAgICAgIGNvbnN0IGF0dHJzID0gW2ByZWw9XCIke2hpbnQubW9kZX1cImAsIGBocmVmPVwiJHtkZXBsb3lVcmx9JHtoaW50LnVybH1cImBdO1xuXG4gICAgICBpZiAoaGludC5tb2RlICE9PSAnbW9kdWxlcHJlbG9hZCcgJiYgY3Jvc3NPcmlnaW4gIT09ICdub25lJykge1xuICAgICAgICAvLyBWYWx1ZSBpcyBjb25zaWRlcmVkIGFub255bW91cyBieSB0aGUgYnJvd3NlciB3aGVuIG5vdCBwcmVzZW50IG9yIGVtcHR5XG4gICAgICAgIGF0dHJzLnB1c2goY3Jvc3NPcmlnaW4gPT09ICdhbm9ueW1vdXMnID8gJ2Nyb3Nzb3JpZ2luJyA6IGBjcm9zc29yaWdpbj1cIiR7Y3Jvc3NPcmlnaW59XCJgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGhpbnQubW9kZSA9PT0gJ3ByZWxvYWQnIHx8IGhpbnQubW9kZSA9PT0gJ3ByZWZldGNoJykge1xuICAgICAgICBzd2l0Y2ggKGV4dG5hbWUoaGludC51cmwpKSB7XG4gICAgICAgICAgY2FzZSAnLmpzJzpcbiAgICAgICAgICAgIGF0dHJzLnB1c2goJ2FzPVwic2NyaXB0XCInKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJy5jc3MnOlxuICAgICAgICAgICAgYXR0cnMucHVzaCgnYXM9XCJzdHlsZVwiJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKGhpbnQuYXMpIHtcbiAgICAgICAgICAgICAgYXR0cnMucHVzaChgYXM9XCIke2hpbnQuYXN9XCJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgc3JpICYmXG4gICAgICAgIChoaW50Lm1vZGUgPT09ICdwcmVsb2FkJyB8fCBoaW50Lm1vZGUgPT09ICdwcmVmZXRjaCcgfHwgaGludC5tb2RlID09PSAnbW9kdWxlcHJlbG9hZCcpXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGxvYWRPdXRwdXRGaWxlKGhpbnQudXJsKTtcbiAgICAgICAgYXR0cnMucHVzaChnZW5lcmF0ZVNyaUF0dHJpYnV0ZXMoY29udGVudCkpO1xuICAgICAgfVxuXG4gICAgICBsaW5rVGFncy5wdXNoKGA8bGluayAke2F0dHJzLmpvaW4oJyAnKX0+YCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZGlyID0gbGFuZyA/IGF3YWl0IGdldExhbmd1YWdlRGlyZWN0aW9uKGxhbmcsIHdhcm5pbmdzKSA6IHVuZGVmaW5lZDtcbiAgY29uc3QgeyByZXdyaXRlciwgdHJhbnNmb3JtZWRDb250ZW50IH0gPSBhd2FpdCBodG1sUmV3cml0aW5nU3RyZWFtKGh0bWwpO1xuICBjb25zdCBiYXNlVGFnRXhpc3RzID0gaHRtbC5pbmNsdWRlcygnPGJhc2UnKTtcblxuICByZXdyaXRlclxuICAgIC5vbignc3RhcnRUYWcnLCAodGFnKSA9PiB7XG4gICAgICBzd2l0Y2ggKHRhZy50YWdOYW1lKSB7XG4gICAgICAgIGNhc2UgJ2h0bWwnOlxuICAgICAgICAgIC8vIEFkanVzdCBkb2N1bWVudCBsb2NhbGUgaWYgc3BlY2lmaWVkXG4gICAgICAgICAgaWYgKGlzU3RyaW5nKGxhbmcpKSB7XG4gICAgICAgICAgICB1cGRhdGVBdHRyaWJ1dGUodGFnLCAnbGFuZycsIGxhbmcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgICAgIHVwZGF0ZUF0dHJpYnV0ZSh0YWcsICdkaXInLCBkaXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnaGVhZCc6XG4gICAgICAgICAgLy8gQmFzZSBocmVmIHNob3VsZCBiZSBhZGRlZCBiZWZvcmUgYW55IGxpbmssIG1ldGEgdGFnc1xuICAgICAgICAgIGlmICghYmFzZVRhZ0V4aXN0cyAmJiBpc1N0cmluZyhiYXNlSHJlZikpIHtcbiAgICAgICAgICAgIHJld3JpdGVyLmVtaXRTdGFydFRhZyh0YWcpO1xuICAgICAgICAgICAgcmV3cml0ZXIuZW1pdFJhdyhgPGJhc2UgaHJlZj1cIiR7YmFzZUhyZWZ9XCI+YCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2Jhc2UnOlxuICAgICAgICAgIC8vIEFkanVzdCBiYXNlIGhyZWYgaWYgc3BlY2lmaWVkXG4gICAgICAgICAgaWYgKGlzU3RyaW5nKGJhc2VIcmVmKSkge1xuICAgICAgICAgICAgdXBkYXRlQXR0cmlidXRlKHRhZywgJ2hyZWYnLCBiYXNlSHJlZik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICByZXdyaXRlci5lbWl0U3RhcnRUYWcodGFnKTtcbiAgICB9KVxuICAgIC5vbignZW5kVGFnJywgKHRhZykgPT4ge1xuICAgICAgc3dpdGNoICh0YWcudGFnTmFtZSkge1xuICAgICAgICBjYXNlICdoZWFkJzpcbiAgICAgICAgICBmb3IgKGNvbnN0IGxpbmtUYWcgb2YgbGlua1RhZ3MpIHtcbiAgICAgICAgICAgIHJld3JpdGVyLmVtaXRSYXcobGlua1RhZyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlua1RhZ3MgPSBbXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYm9keSc6XG4gICAgICAgICAgLy8gQWRkIHNjcmlwdCB0YWdzXG4gICAgICAgICAgZm9yIChjb25zdCBzY3JpcHRUYWcgb2Ygc2NyaXB0VGFncykge1xuICAgICAgICAgICAgcmV3cml0ZXIuZW1pdFJhdyhzY3JpcHRUYWcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHNjcmlwdFRhZ3MgPSBbXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmV3cml0ZXIuZW1pdEVuZFRhZyh0YWcpO1xuICAgIH0pO1xuXG4gIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0cmFuc2Zvcm1lZENvbnRlbnQoKTtcblxuICByZXR1cm4ge1xuICAgIGNvbnRlbnQ6XG4gICAgICBsaW5rVGFncy5sZW5ndGggfHwgc2NyaXB0VGFncy5sZW5ndGhcbiAgICAgICAgPyAvLyBJbiBjYXNlIG5vIGJvZHkvaGVhZCB0YWdzIGFyZSBub3QgcHJlc2VudCAoZG90bmV0IHBhcnRpYWwgdGVtcGxhdGVzKVxuICAgICAgICAgIGxpbmtUYWdzLmpvaW4oJycpICsgc2NyaXB0VGFncy5qb2luKCcnKSArIGNvbnRlbnRcbiAgICAgICAgOiBjb250ZW50LFxuICAgIHdhcm5pbmdzLFxuICAgIGVycm9ycyxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVTcmlBdHRyaWJ1dGVzKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGFsZ28gPSAnc2hhMzg0JztcbiAgY29uc3QgaGFzaCA9IGNyZWF0ZUhhc2goYWxnbykudXBkYXRlKGNvbnRlbnQsICd1dGY4JykuZGlnZXN0KCdiYXNlNjQnKTtcblxuICByZXR1cm4gYGludGVncml0eT1cIiR7YWxnb30tJHtoYXNofVwiYDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQXR0cmlidXRlKFxuICB0YWc6IHsgYXR0cnM6IHsgbmFtZTogc3RyaW5nOyB2YWx1ZTogc3RyaW5nIH1bXSB9LFxuICBuYW1lOiBzdHJpbmcsXG4gIHZhbHVlOiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSB0YWcuYXR0cnMuZmluZEluZGV4KChhKSA9PiBhLm5hbWUgPT09IG5hbWUpO1xuICBjb25zdCBuZXdWYWx1ZSA9IHsgbmFtZSwgdmFsdWUgfTtcblxuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgdGFnLmF0dHJzLnB1c2gobmV3VmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIHRhZy5hdHRyc1tpbmRleF0gPSBuZXdWYWx1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1N0cmluZyh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIHN0cmluZyB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRMYW5ndWFnZURpcmVjdGlvbihcbiAgbG9jYWxlOiBzdHJpbmcsXG4gIHdhcm5pbmdzOiBzdHJpbmdbXSxcbik6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gIGNvbnN0IGRpciA9IGF3YWl0IGdldExhbmd1YWdlRGlyZWN0aW9uRnJvbUxvY2FsZXMobG9jYWxlKTtcblxuICBpZiAoIWRpcikge1xuICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICBgTG9jYWxlIGRhdGEgZm9yICcke2xvY2FsZX0nIGNhbm5vdCBiZSBmb3VuZC4gJ2RpcicgYXR0cmlidXRlIHdpbGwgbm90IGJlIHNldCBmb3IgdGhpcyBsb2NhbGUuYCxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIGRpcjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0TGFuZ3VhZ2VEaXJlY3Rpb25Gcm9tTG9jYWxlcyhsb2NhbGU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgbG9jYWxlRGF0YSA9IChcbiAgICAgIGF3YWl0IGxvYWRFc21Nb2R1bGU8dHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tbW9uL2xvY2FsZXMvZW4nKT4oXG4gICAgICAgIGBAYW5ndWxhci9jb21tb24vbG9jYWxlcy8ke2xvY2FsZX1gLFxuICAgICAgKVxuICAgICkuZGVmYXVsdDtcblxuICAgIGNvbnN0IGRpciA9IGxvY2FsZURhdGFbbG9jYWxlRGF0YS5sZW5ndGggLSAyXTtcblxuICAgIHJldHVybiBpc1N0cmluZyhkaXIpID8gZGlyIDogdW5kZWZpbmVkO1xuICB9IGNhdGNoIHtcbiAgICAvLyBJbiBzb21lIGNhc2VzIGNlcnRhaW4gbG9jYWxlcyBtaWdodCBtYXAgdG8gZmlsZXMgd2hpY2ggYXJlIG5hbWVkIG9ubHkgd2l0aCBsYW5ndWFnZSBpZC5cbiAgICAvLyBFeGFtcGxlOiBgZW4tVVNgIC0+IGBlbmAuXG4gICAgY29uc3QgW2xhbmd1YWdlSWRdID0gbG9jYWxlLnNwbGl0KCctJywgMSk7XG4gICAgaWYgKGxhbmd1YWdlSWQgIT09IGxvY2FsZSkge1xuICAgICAgcmV0dXJuIGdldExhbmd1YWdlRGlyZWN0aW9uRnJvbUxvY2FsZXMobGFuZ3VhZ2VJZCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cbiJdfQ==