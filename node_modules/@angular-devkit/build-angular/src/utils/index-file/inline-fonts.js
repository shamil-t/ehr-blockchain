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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineFontsProcessor = void 0;
const https_proxy_agent_1 = __importDefault(require("https-proxy-agent"));
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const https = __importStar(require("node:https"));
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
const package_version_1 = require("../package-version");
const html_rewriting_stream_1 = require("./html-rewriting-stream");
const SUPPORTED_PROVIDERS = {
    'fonts.googleapis.com': {
        preconnectUrl: 'https://fonts.gstatic.com',
    },
    'use.typekit.net': {
        preconnectUrl: 'https://use.typekit.net',
    },
};
/**
 * Hash algorithm used for cached files.
 */
const CONTENT_HASH_ALGORITHM = 'sha256';
/**
 * String length of the SHA-256 content hash stored in cached files.
 */
const CONTENT_HASH_LENGTH = 64;
class InlineFontsProcessor {
    constructor(options) {
        this.options = options;
        const { path: cacheDirectory, enabled } = this.options.cache || {};
        if (cacheDirectory && enabled) {
            this.cachePath = (0, node_path_1.join)(cacheDirectory, 'angular-build-fonts');
        }
    }
    async process(content) {
        const hrefList = [];
        const existingPreconnect = new Set();
        // Collector link tags with href
        const { rewriter: collectorStream, transformedContent: initCollectorStream } = await (0, html_rewriting_stream_1.htmlRewritingStream)(content);
        collectorStream.on('startTag', (tag) => {
            const { tagName, attrs } = tag;
            if (tagName !== 'link') {
                return;
            }
            let hrefValue;
            let relValue;
            for (const { name, value } of attrs) {
                switch (name) {
                    case 'rel':
                        relValue = value;
                        break;
                    case 'href':
                        hrefValue = value;
                        break;
                }
                if (hrefValue && relValue) {
                    switch (relValue) {
                        case 'stylesheet':
                            // <link rel="stylesheet" href="https://example.com/main.css">
                            hrefList.push(hrefValue);
                            break;
                        case 'preconnect':
                            // <link rel="preconnect" href="https://example.com">
                            existingPreconnect.add(hrefValue.replace(/\/$/, ''));
                            break;
                    }
                    return;
                }
            }
        });
        initCollectorStream().catch(() => {
            // We don't really care about any errors here because it just initializes
            // the rewriting stream, as we are waiting for `finish` below.
        });
        await new Promise((resolve) => collectorStream.on('finish', resolve));
        // Download stylesheets
        const hrefsContent = new Map();
        const newPreconnectUrls = new Set();
        for (const hrefItem of hrefList) {
            const url = this.createNormalizedUrl(hrefItem);
            if (!url) {
                continue;
            }
            const content = await this.processHref(url);
            if (content === undefined) {
                continue;
            }
            hrefsContent.set(hrefItem, content);
            // Add preconnect
            const preconnectUrl = this.getFontProviderDetails(url)?.preconnectUrl;
            if (preconnectUrl && !existingPreconnect.has(preconnectUrl)) {
                newPreconnectUrls.add(preconnectUrl);
            }
        }
        if (hrefsContent.size === 0) {
            return content;
        }
        // Replace link with style tag.
        const { rewriter, transformedContent } = await (0, html_rewriting_stream_1.htmlRewritingStream)(content);
        rewriter.on('startTag', (tag) => {
            const { tagName, attrs } = tag;
            switch (tagName) {
                case 'head':
                    rewriter.emitStartTag(tag);
                    for (const url of newPreconnectUrls) {
                        rewriter.emitRaw(`<link rel="preconnect" href="${url}" crossorigin>`);
                    }
                    break;
                case 'link':
                    const hrefAttr = attrs.some(({ name, value }) => name === 'rel' && value === 'stylesheet') &&
                        attrs.find(({ name, value }) => name === 'href' && hrefsContent.has(value));
                    if (hrefAttr) {
                        const href = hrefAttr.value;
                        const cssContent = hrefsContent.get(href);
                        rewriter.emitRaw(`<style type="text/css">${cssContent}</style>`);
                    }
                    else {
                        rewriter.emitStartTag(tag);
                    }
                    break;
                default:
                    rewriter.emitStartTag(tag);
                    break;
            }
        });
        return transformedContent();
    }
    async getResponse(url) {
        let cacheFile;
        if (this.cachePath) {
            const key = (0, node_crypto_1.createHash)(CONTENT_HASH_ALGORITHM).update(`${package_version_1.VERSION}|${url}`).digest('hex');
            cacheFile = (0, node_path_1.join)(this.cachePath, key);
        }
        if (cacheFile) {
            try {
                const data = await (0, promises_1.readFile)(cacheFile, 'utf8');
                // Check for valid content via stored hash
                if (data.length > CONTENT_HASH_LENGTH) {
                    const storedHash = data.slice(0, CONTENT_HASH_LENGTH);
                    const content = data.slice(CONTENT_HASH_LENGTH);
                    const contentHash = (0, node_crypto_1.createHash)(CONTENT_HASH_ALGORITHM).update(content).digest('base64');
                    if (storedHash === contentHash) {
                        // Return valid content
                        return content;
                    }
                    else {
                        // Delete corrupted cache content
                        await (0, promises_1.rm)(cacheFile);
                    }
                }
            }
            catch { }
        }
        let agent;
        const httpsProxy = process.env.HTTPS_PROXY ?? process.env.https_proxy;
        if (httpsProxy) {
            agent = (0, https_proxy_agent_1.default)(httpsProxy);
        }
        const data = await new Promise((resolve, reject) => {
            let rawResponse = '';
            https
                .get(url, {
                agent,
                headers: {
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                },
            }, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Inlining of fonts failed. ${url} returned status code: ${res.statusCode}.`));
                    return;
                }
                res.on('data', (chunk) => (rawResponse += chunk)).on('end', () => resolve(rawResponse));
            })
                .on('error', (e) => reject(new Error(`Inlining of fonts failed. An error has occurred while retrieving ${url} over the internet.\n` +
                e.message)));
        });
        if (cacheFile) {
            try {
                const dataHash = (0, node_crypto_1.createHash)(CONTENT_HASH_ALGORITHM).update(data).digest('hex');
                await (0, promises_1.writeFile)(cacheFile, dataHash + data);
            }
            catch { }
        }
        return data;
    }
    async processHref(url) {
        const provider = this.getFontProviderDetails(url);
        if (!provider) {
            return undefined;
        }
        let cssContent = await this.getResponse(url);
        if (this.options.minify) {
            cssContent = cssContent
                // Comments.
                .replace(/\/\*([\s\S]*?)\*\//g, '')
                // New lines.
                .replace(/\n/g, '')
                // Safe spaces.
                .replace(/\s?[{:;]\s+/g, (s) => s.trim());
        }
        return cssContent;
    }
    getFontProviderDetails(url) {
        return SUPPORTED_PROVIDERS[url.hostname];
    }
    createNormalizedUrl(value) {
        // Need to convert '//' to 'https://' because the URL parser will fail with '//'.
        const normalizedHref = value.startsWith('//') ? `https:${value}` : value;
        if (!normalizedHref.startsWith('http')) {
            // Non valid URL.
            // Example: relative path styles.css.
            return undefined;
        }
        const url = new node_url_1.URL(normalizedHref);
        // Force HTTPS protocol
        url.protocol = 'https:';
        return url;
    }
}
exports.InlineFontsProcessor = InlineFontsProcessor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lLWZvbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvaW5kZXgtZmlsZS9pbmxpbmUtZm9udHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwwRUFBMkM7QUFDM0MsNkNBQXlDO0FBQ3pDLCtDQUEyRDtBQUMzRCxrREFBb0M7QUFDcEMseUNBQWlDO0FBQ2pDLHVDQUErQjtBQUUvQix3REFBNkM7QUFDN0MsbUVBQThEO0FBVzlELE1BQU0sbUJBQW1CLEdBQXdDO0lBQy9ELHNCQUFzQixFQUFFO1FBQ3RCLGFBQWEsRUFBRSwyQkFBMkI7S0FDM0M7SUFDRCxpQkFBaUIsRUFBRTtRQUNqQixhQUFhLEVBQUUseUJBQXlCO0tBQ3pDO0NBQ0YsQ0FBQztBQUVGOztHQUVHO0FBQ0gsTUFBTSxzQkFBc0IsR0FBRyxRQUFRLENBQUM7QUFFeEM7O0dBRUc7QUFDSCxNQUFNLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztBQUUvQixNQUFhLG9CQUFvQjtJQUUvQixZQUFvQixPQUEyQjtRQUEzQixZQUFPLEdBQVAsT0FBTyxDQUFvQjtRQUM3QyxNQUFNLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDbkUsSUFBSSxjQUFjLElBQUksT0FBTyxFQUFFO1lBQzdCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBQSxnQkFBSSxFQUFDLGNBQWMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1NBQzlEO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBZTtRQUMzQixNQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7UUFDOUIsTUFBTSxrQkFB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QUFDO1FBQ3pFLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3RDLGlCQUFpQjtZQUNqQixxQ0FBcUM7WUFDckMsT0FBTyxTQUFTLENBQUM7U0FDbEI7UUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLGNBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNwQyx1QkFBdUI7UUFDdkIsR0FBRyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFFeEIsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0NBQ0Y7QUFyUEQsb0RBcVBDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCBwcm94eUFnZW50IGZyb20gJ2h0dHBzLXByb3h5LWFnZW50JztcbmltcG9ydCB7IGNyZWF0ZUhhc2ggfSBmcm9tICdub2RlOmNyeXB0byc7XG5pbXBvcnQgeyByZWFkRmlsZSwgcm0sIHdyaXRlRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnbm9kZTpodHRwcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IFVSTCB9IGZyb20gJ25vZGU6dXJsJztcbmltcG9ydCB7IE5vcm1hbGl6ZWRDYWNoZWRPcHRpb25zIH0gZnJvbSAnLi4vbm9ybWFsaXplLWNhY2hlJztcbmltcG9ydCB7IFZFUlNJT04gfSBmcm9tICcuLi9wYWNrYWdlLXZlcnNpb24nO1xuaW1wb3J0IHsgaHRtbFJld3JpdGluZ1N0cmVhbSB9IGZyb20gJy4vaHRtbC1yZXdyaXRpbmctc3RyZWFtJztcblxuaW50ZXJmYWNlIEZvbnRQcm92aWRlckRldGFpbHMge1xuICBwcmVjb25uZWN0VXJsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5saW5lRm9udHNPcHRpb25zIHtcbiAgbWluaWZ5PzogYm9vbGVhbjtcbiAgY2FjaGU/OiBOb3JtYWxpemVkQ2FjaGVkT3B0aW9ucztcbn1cblxuY29uc3QgU1VQUE9SVEVEX1BST1ZJREVSUzogUmVjb3JkPHN0cmluZywgRm9udFByb3ZpZGVyRGV0YWlscz4gPSB7XG4gICdmb250cy5nb29nbGVhcGlzLmNvbSc6IHtcbiAgICBwcmVjb25uZWN0VXJsOiAnaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbScsXG4gIH0sXG4gICd1c2UudHlwZWtpdC5uZXQnOiB7XG4gICAgcHJlY29ubmVjdFVybDogJ2h0dHBzOi8vdXNlLnR5cGVraXQubmV0JyxcbiAgfSxcbn07XG5cbi8qKlxuICogSGFzaCBhbGdvcml0aG0gdXNlZCBmb3IgY2FjaGVkIGZpbGVzLlxuICovXG5jb25zdCBDT05URU5UX0hBU0hfQUxHT1JJVEhNID0gJ3NoYTI1Nic7XG5cbi8qKlxuICogU3RyaW5nIGxlbmd0aCBvZiB0aGUgU0hBLTI1NiBjb250ZW50IGhhc2ggc3RvcmVkIGluIGNhY2hlZCBmaWxlcy5cbiAqL1xuY29uc3QgQ09OVEVOVF9IQVNIX0xFTkdUSCA9IDY0O1xuXG5leHBvcnQgY2xhc3MgSW5saW5lRm9udHNQcm9jZXNzb3Ige1xuICBwcml2YXRlIHJlYWRvbmx5IGNhY2hlUGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG9wdGlvbnM6IElubGluZUZvbnRzT3B0aW9ucykge1xuICAgIGNvbnN0IHsgcGF0aDogY2FjaGVEaXJlY3RvcnksIGVuYWJsZWQgfSA9IHRoaXMub3B0aW9ucy5jYWNoZSB8fCB7fTtcbiAgICBpZiAoY2FjaGVEaXJlY3RvcnkgJiYgZW5hYmxlZCkge1xuICAgICAgdGhpcy5jYWNoZVBhdGggPSBqb2luKGNhY2hlRGlyZWN0b3J5LCAnYW5ndWxhci1idWlsZC1mb250cycpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHByb2Nlc3MoY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBocmVmTGlzdDogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBleGlzdGluZ1ByZWNvbm5lY3QgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIC8vIENvbGxlY3RvciBsaW5rIHRhZ3Mgd2l0aCBocmVmXG4gICAgY29uc3QgeyByZXdyaXRlcjogY29sbGVjdG9yU3RyZWFtLCB0cmFuc2Zvcm1lZENvbnRlbnQ6IGluaXRDb2xsZWN0b3JTdHJlYW0gfSA9XG4gICAgICBhd2FpdCBodG1sUmV3cml0aW5nU3RyZWFtKGNvbnRlbnQpO1xuXG4gICAgY29sbGVjdG9yU3RyZWFtLm9uKCdzdGFydFRhZycsICh0YWcpID0+IHtcbiAgICAgIGNvbnN0IHsgdGFnTmFtZSwgYXR0cnMgfSA9IHRhZztcblxuICAgICAgaWYgKHRhZ05hbWUgIT09ICdsaW5rJykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGxldCBocmVmVmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGxldCByZWxWYWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgZm9yIChjb25zdCB7IG5hbWUsIHZhbHVlIH0gb2YgYXR0cnMpIHtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgY2FzZSAncmVsJzpcbiAgICAgICAgICAgIHJlbFZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ2hyZWYnOlxuICAgICAgICAgICAgaHJlZlZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChocmVmVmFsdWUgJiYgcmVsVmFsdWUpIHtcbiAgICAgICAgICBzd2l0Y2ggKHJlbFZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlICdzdHlsZXNoZWV0JzpcbiAgICAgICAgICAgICAgLy8gPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIGhyZWY9XCJodHRwczovL2V4YW1wbGUuY29tL21haW4uY3NzXCI+XG4gICAgICAgICAgICAgIGhyZWZMaXN0LnB1c2goaHJlZlZhbHVlKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ3ByZWNvbm5lY3QnOlxuICAgICAgICAgICAgICAvLyA8bGluayByZWw9XCJwcmVjb25uZWN0XCIgaHJlZj1cImh0dHBzOi8vZXhhbXBsZS5jb21cIj5cbiAgICAgICAgICAgICAgZXhpc3RpbmdQcmVjb25uZWN0LmFkZChocmVmVmFsdWUucmVwbGFjZSgvXFwvJC8sICcnKSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaW5pdENvbGxlY3RvclN0cmVhbSgpLmNhdGNoKCgpID0+IHtcbiAgICAgIC8vIFdlIGRvbid0IHJlYWxseSBjYXJlIGFib3V0IGFueSBlcnJvcnMgaGVyZSBiZWNhdXNlIGl0IGp1c3QgaW5pdGlhbGl6ZXNcbiAgICAgIC8vIHRoZSByZXdyaXRpbmcgc3RyZWFtLCBhcyB3ZSBhcmUgd2FpdGluZyBmb3IgYGZpbmlzaGAgYmVsb3cuXG4gICAgfSk7XG5cbiAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gY29sbGVjdG9yU3RyZWFtLm9uKCdmaW5pc2gnLCByZXNvbHZlKSk7XG5cbiAgICAvLyBEb3dubG9hZCBzdHlsZXNoZWV0c1xuICAgIGNvbnN0IGhyZWZzQ29udGVudCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gICAgY29uc3QgbmV3UHJlY29ubmVjdFVybHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIGZvciAoY29uc3QgaHJlZkl0ZW0gb2YgaHJlZkxpc3QpIHtcbiAgICAgIGNvbnN0IHVybCA9IHRoaXMuY3JlYXRlTm9ybWFsaXplZFVybChocmVmSXRlbSk7XG4gICAgICBpZiAoIXVybCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMucHJvY2Vzc0hyZWYodXJsKTtcbiAgICAgIGlmIChjb250ZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGhyZWZzQ29udGVudC5zZXQoaHJlZkl0ZW0sIGNvbnRlbnQpO1xuXG4gICAgICAvLyBBZGQgcHJlY29ubmVjdFxuICAgICAgY29uc3QgcHJlY29ubmVjdFVybCA9IHRoaXMuZ2V0Rm9udFByb3ZpZGVyRGV0YWlscyh1cmwpPy5wcmVjb25uZWN0VXJsO1xuICAgICAgaWYgKHByZWNvbm5lY3RVcmwgJiYgIWV4aXN0aW5nUHJlY29ubmVjdC5oYXMocHJlY29ubmVjdFVybCkpIHtcbiAgICAgICAgbmV3UHJlY29ubmVjdFVybHMuYWRkKHByZWNvbm5lY3RVcmwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChocmVmc0NvbnRlbnQuc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuXG4gICAgLy8gUmVwbGFjZSBsaW5rIHdpdGggc3R5bGUgdGFnLlxuICAgIGNvbnN0IHsgcmV3cml0ZXIsIHRyYW5zZm9ybWVkQ29udGVudCB9ID0gYXdhaXQgaHRtbFJld3JpdGluZ1N0cmVhbShjb250ZW50KTtcbiAgICByZXdyaXRlci5vbignc3RhcnRUYWcnLCAodGFnKSA9PiB7XG4gICAgICBjb25zdCB7IHRhZ05hbWUsIGF0dHJzIH0gPSB0YWc7XG5cbiAgICAgIHN3aXRjaCAodGFnTmFtZSkge1xuICAgICAgICBjYXNlICdoZWFkJzpcbiAgICAgICAgICByZXdyaXRlci5lbWl0U3RhcnRUYWcodGFnKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IHVybCBvZiBuZXdQcmVjb25uZWN0VXJscykge1xuICAgICAgICAgICAgcmV3cml0ZXIuZW1pdFJhdyhgPGxpbmsgcmVsPVwicHJlY29ubmVjdFwiIGhyZWY9XCIke3VybH1cIiBjcm9zc29yaWdpbj5gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnbGluayc6XG4gICAgICAgICAgY29uc3QgaHJlZkF0dHIgPVxuICAgICAgICAgICAgYXR0cnMuc29tZSgoeyBuYW1lLCB2YWx1ZSB9KSA9PiBuYW1lID09PSAncmVsJyAmJiB2YWx1ZSA9PT0gJ3N0eWxlc2hlZXQnKSAmJlxuICAgICAgICAgICAgYXR0cnMuZmluZCgoeyBuYW1lLCB2YWx1ZSB9KSA9PiBuYW1lID09PSAnaHJlZicgJiYgaHJlZnNDb250ZW50Lmhhcyh2YWx1ZSkpO1xuICAgICAgICAgIGlmIChocmVmQXR0cikge1xuICAgICAgICAgICAgY29uc3QgaHJlZiA9IGhyZWZBdHRyLnZhbHVlO1xuICAgICAgICAgICAgY29uc3QgY3NzQ29udGVudCA9IGhyZWZzQ29udGVudC5nZXQoaHJlZik7XG4gICAgICAgICAgICByZXdyaXRlci5lbWl0UmF3KGA8c3R5bGUgdHlwZT1cInRleHQvY3NzXCI+JHtjc3NDb250ZW50fTwvc3R5bGU+YCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJld3JpdGVyLmVtaXRTdGFydFRhZyh0YWcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJld3JpdGVyLmVtaXRTdGFydFRhZyh0YWcpO1xuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdHJhbnNmb3JtZWRDb250ZW50KCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldFJlc3BvbnNlKHVybDogVVJMKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgY2FjaGVGaWxlO1xuICAgIGlmICh0aGlzLmNhY2hlUGF0aCkge1xuICAgICAgY29uc3Qga2V5ID0gY3JlYXRlSGFzaChDT05URU5UX0hBU0hfQUxHT1JJVEhNKS51cGRhdGUoYCR7VkVSU0lPTn18JHt1cmx9YCkuZGlnZXN0KCdoZXgnKTtcbiAgICAgIGNhY2hlRmlsZSA9IGpvaW4odGhpcy5jYWNoZVBhdGgsIGtleSk7XG4gICAgfVxuXG4gICAgaWYgKGNhY2hlRmlsZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlYWRGaWxlKGNhY2hlRmlsZSwgJ3V0ZjgnKTtcbiAgICAgICAgLy8gQ2hlY2sgZm9yIHZhbGlkIGNvbnRlbnQgdmlhIHN0b3JlZCBoYXNoXG4gICAgICAgIGlmIChkYXRhLmxlbmd0aCA+IENPTlRFTlRfSEFTSF9MRU5HVEgpIHtcbiAgICAgICAgICBjb25zdCBzdG9yZWRIYXNoID0gZGF0YS5zbGljZSgwLCBDT05URU5UX0hBU0hfTEVOR1RIKTtcbiAgICAgICAgICBjb25zdCBjb250ZW50ID0gZGF0YS5zbGljZShDT05URU5UX0hBU0hfTEVOR1RIKTtcbiAgICAgICAgICBjb25zdCBjb250ZW50SGFzaCA9IGNyZWF0ZUhhc2goQ09OVEVOVF9IQVNIX0FMR09SSVRITSkudXBkYXRlKGNvbnRlbnQpLmRpZ2VzdCgnYmFzZTY0Jyk7XG4gICAgICAgICAgaWYgKHN0b3JlZEhhc2ggPT09IGNvbnRlbnRIYXNoKSB7XG4gICAgICAgICAgICAvLyBSZXR1cm4gdmFsaWQgY29udGVudFxuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIERlbGV0ZSBjb3JydXB0ZWQgY2FjaGUgY29udGVudFxuICAgICAgICAgICAgYXdhaXQgcm0oY2FjaGVGaWxlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge31cbiAgICB9XG5cbiAgICBsZXQgYWdlbnQ6IHByb3h5QWdlbnQuSHR0cHNQcm94eUFnZW50IHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IGh0dHBzUHJveHkgPSBwcm9jZXNzLmVudi5IVFRQU19QUk9YWSA/PyBwcm9jZXNzLmVudi5odHRwc19wcm94eTtcblxuICAgIGlmIChodHRwc1Byb3h5KSB7XG4gICAgICBhZ2VudCA9IHByb3h5QWdlbnQoaHR0cHNQcm94eSk7XG4gICAgfVxuXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IHJhd1Jlc3BvbnNlID0gJyc7XG4gICAgICBodHRwc1xuICAgICAgICAuZ2V0KFxuICAgICAgICAgIHVybCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhZ2VudCxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ3VzZXItYWdlbnQnOlxuICAgICAgICAgICAgICAgICdNb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV82KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvODUuMC40MTgzLjEyMSBTYWZhcmkvNTM3LjM2JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICAocmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzLnN0YXR1c0NvZGUgIT09IDIwMCkge1xuICAgICAgICAgICAgICByZWplY3QoXG4gICAgICAgICAgICAgICAgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgYElubGluaW5nIG9mIGZvbnRzIGZhaWxlZC4gJHt1cmx9IHJldHVybmVkIHN0YXR1cyBjb2RlOiAke3Jlcy5zdGF0dXNDb2RlfS5gLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXMub24oJ2RhdGEnLCAoY2h1bmspID0+IChyYXdSZXNwb25zZSArPSBjaHVuaykpLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKHJhd1Jlc3BvbnNlKSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgKVxuICAgICAgICAub24oJ2Vycm9yJywgKGUpID0+XG4gICAgICAgICAgcmVqZWN0KFxuICAgICAgICAgICAgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgSW5saW5pbmcgb2YgZm9udHMgZmFpbGVkLiBBbiBlcnJvciBoYXMgb2NjdXJyZWQgd2hpbGUgcmV0cmlldmluZyAke3VybH0gb3ZlciB0aGUgaW50ZXJuZXQuXFxuYCArXG4gICAgICAgICAgICAgICAgZS5tZXNzYWdlLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgIH0pO1xuXG4gICAgaWYgKGNhY2hlRmlsZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZGF0YUhhc2ggPSBjcmVhdGVIYXNoKENPTlRFTlRfSEFTSF9BTEdPUklUSE0pLnVwZGF0ZShkYXRhKS5kaWdlc3QoJ2hleCcpO1xuICAgICAgICBhd2FpdCB3cml0ZUZpbGUoY2FjaGVGaWxlLCBkYXRhSGFzaCArIGRhdGEpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwcm9jZXNzSHJlZih1cmw6IFVSTCk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgcHJvdmlkZXIgPSB0aGlzLmdldEZvbnRQcm92aWRlckRldGFpbHModXJsKTtcbiAgICBpZiAoIXByb3ZpZGVyKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGxldCBjc3NDb250ZW50ID0gYXdhaXQgdGhpcy5nZXRSZXNwb25zZSh1cmwpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5taW5pZnkpIHtcbiAgICAgIGNzc0NvbnRlbnQgPSBjc3NDb250ZW50XG4gICAgICAgIC8vIENvbW1lbnRzLlxuICAgICAgICAucmVwbGFjZSgvXFwvXFwqKFtcXHNcXFNdKj8pXFwqXFwvL2csICcnKVxuICAgICAgICAvLyBOZXcgbGluZXMuXG4gICAgICAgIC5yZXBsYWNlKC9cXG4vZywgJycpXG4gICAgICAgIC8vIFNhZmUgc3BhY2VzLlxuICAgICAgICAucmVwbGFjZSgvXFxzP1t7OjtdXFxzKy9nLCAocykgPT4gcy50cmltKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBjc3NDb250ZW50O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRGb250UHJvdmlkZXJEZXRhaWxzKHVybDogVVJMKTogRm9udFByb3ZpZGVyRGV0YWlscyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIFNVUFBPUlRFRF9QUk9WSURFUlNbdXJsLmhvc3RuYW1lXTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlTm9ybWFsaXplZFVybCh2YWx1ZTogc3RyaW5nKTogVVJMIHwgdW5kZWZpbmVkIHtcbiAgICAvLyBOZWVkIHRvIGNvbnZlcnQgJy8vJyB0byAnaHR0cHM6Ly8nIGJlY2F1c2UgdGhlIFVSTCBwYXJzZXIgd2lsbCBmYWlsIHdpdGggJy8vJy5cbiAgICBjb25zdCBub3JtYWxpemVkSHJlZiA9IHZhbHVlLnN0YXJ0c1dpdGgoJy8vJykgPyBgaHR0cHM6JHt2YWx1ZX1gIDogdmFsdWU7XG4gICAgaWYgKCFub3JtYWxpemVkSHJlZi5zdGFydHNXaXRoKCdodHRwJykpIHtcbiAgICAgIC8vIE5vbiB2YWxpZCBVUkwuXG4gICAgICAvLyBFeGFtcGxlOiByZWxhdGl2ZSBwYXRoIHN0eWxlcy5jc3MuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwobm9ybWFsaXplZEhyZWYpO1xuICAgIC8vIEZvcmNlIEhUVFBTIHByb3RvY29sXG4gICAgdXJsLnByb3RvY29sID0gJ2h0dHBzOic7XG5cbiAgICByZXR1cm4gdXJsO1xuICB9XG59XG4iXX0=