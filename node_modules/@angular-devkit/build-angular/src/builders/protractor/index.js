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
exports.execute = void 0;
const architect_1 = require("@angular-devkit/architect");
const core_1 = require("@angular-devkit/core");
const path_1 = require("path");
const url = __importStar(require("url"));
const utils_1 = require("../../utils");
const error_1 = require("../../utils/error");
function runProtractor(root, options) {
    const additionalProtractorConfig = {
        baseUrl: options.baseUrl,
        specs: options.specs && options.specs.length ? options.specs : undefined,
        suite: options.suite,
        jasmineNodeOpts: {
            grep: options.grep,
            invertGrep: options.invertGrep,
        },
    };
    // TODO: Protractor manages process.exit itself, so this target will allways quit the
    // process. To work around this we run it in a subprocess.
    // https://github.com/angular/protractor/issues/4160
    return (0, utils_1.runModuleAsObservableFork)(root, 'protractor/built/launcher', 'init', [
        (0, path_1.resolve)(root, options.protractorConfig),
        additionalProtractorConfig,
    ]).toPromise();
}
async function updateWebdriver() {
    // The webdriver-manager update command can only be accessed via a deep import.
    const webdriverDeepImport = 'webdriver-manager/built/lib/cmds/update';
    let path;
    try {
        const protractorPath = require.resolve('protractor');
        path = require.resolve(webdriverDeepImport, { paths: [protractorPath] });
    }
    catch (error) {
        (0, error_1.assertIsError)(error);
        if (error.code !== 'MODULE_NOT_FOUND') {
            throw error;
        }
    }
    if (!path) {
        throw new Error(core_1.tags.stripIndents `
      Cannot automatically find webdriver-manager to update.
      Update webdriver-manager manually and run 'ng e2e --no-webdriver-update' instead.
    `);
    }
    const webdriverUpdate = await Promise.resolve(`${path}`).then(s => __importStar(require(s)));
    // const webdriverUpdate = await import(path) as typeof import ('webdriver-manager/built/lib/cmds/update');
    // run `webdriver-manager update --standalone false --gecko false --quiet`
    // if you change this, update the command comment in prev line
    return webdriverUpdate.program.run({
        standalone: false,
        gecko: false,
        quiet: true,
    });
}
/**
 * @experimental Direct usage of this function is considered experimental.
 */
async function execute(options, context) {
    context.logger.warn('Protractor has reached end-of-life and is no longer supported by the Angular team. The `protractor` builder will be removed in a future Angular major version. For additional information and alternatives, please see https://blog.angular.io/protractor-deprecation-update-august-2023-2beac7402ce0.');
    // ensure that only one of these options is used
    if (options.devServerTarget && options.baseUrl) {
        throw new Error(core_1.tags.stripIndents `
    The 'baseUrl' option cannot be used with 'devServerTarget'.
    When present, 'devServerTarget' will be used to automatically setup 'baseUrl' for Protractor.
    `);
    }
    if (options.webdriverUpdate) {
        await updateWebdriver();
    }
    let baseUrl = options.baseUrl;
    let server;
    try {
        if (options.devServerTarget) {
            const target = (0, architect_1.targetFromTargetString)(options.devServerTarget);
            const serverOptions = await context.getTargetOptions(target);
            const overrides = {
                watch: false,
                liveReload: false,
            };
            if (options.host !== undefined) {
                overrides.host = options.host;
            }
            else if (typeof serverOptions.host === 'string') {
                options.host = serverOptions.host;
            }
            else {
                options.host = overrides.host = 'localhost';
            }
            if (options.port !== undefined) {
                overrides.port = options.port;
            }
            else if (typeof serverOptions.port === 'number') {
                options.port = serverOptions.port;
            }
            server = await context.scheduleTarget(target, overrides);
            const result = await server.result;
            if (!result.success) {
                return { success: false };
            }
            if (typeof serverOptions.publicHost === 'string') {
                let publicHost = serverOptions.publicHost;
                if (!/^\w+:\/\//.test(publicHost)) {
                    publicHost = `${serverOptions.ssl ? 'https' : 'http'}://${publicHost}`;
                }
                const clientUrl = url.parse(publicHost);
                baseUrl = url.format(clientUrl);
            }
            else if (typeof result.baseUrl === 'string') {
                baseUrl = result.baseUrl;
            }
            else if (typeof result.port === 'number') {
                baseUrl = url.format({
                    protocol: serverOptions.ssl ? 'https' : 'http',
                    hostname: options.host,
                    port: result.port.toString(),
                });
            }
        }
        // Like the baseUrl in protractor config file when using the API we need to add
        // a trailing slash when provide to the baseUrl.
        if (baseUrl && !baseUrl.endsWith('/')) {
            baseUrl += '/';
        }
        return await runProtractor(context.workspaceRoot, { ...options, baseUrl });
    }
    catch {
        return { success: false };
    }
    finally {
        await server?.stop();
    }
}
exports.execute = execute;
exports.default = (0, architect_1.createBuilder)(execute);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9wcm90cmFjdG9yL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgseURBS21DO0FBQ25DLCtDQUFrRDtBQUNsRCwrQkFBK0I7QUFDL0IseUNBQTJCO0FBQzNCLHVDQUF3RDtBQUN4RCw2Q0FBa0Q7QUFXbEQsU0FBUyxhQUFhLENBQUMsSUFBWSxFQUFFLE9BQWlDO0lBQ3BFLE1BQU0sMEJBQTBCLEdBQWlFO1FBQy9GLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTztRQUN4QixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUztRQUN4RSxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7UUFDcEIsZUFBZSxFQUFFO1lBQ2YsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1lBQ2xCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtTQUMvQjtLQUNGLENBQUM7SUFFRixxRkFBcUY7SUFDckYsMERBQTBEO0lBQzFELG9EQUFvRDtJQUNwRCxPQUFPLElBQUEsaUNBQXlCLEVBQUMsSUFBSSxFQUFFLDJCQUEyQixFQUFFLE1BQU0sRUFBRTtRQUMxRSxJQUFBLGNBQU8sRUFBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixDQUFDO1FBQ3ZDLDBCQUEwQjtLQUMzQixDQUFDLENBQUMsU0FBUyxFQUE0QixDQUFDO0FBQzNDLENBQUM7QUFFRCxLQUFLLFVBQVUsZUFBZTtJQUM1QiwrRUFBK0U7SUFDL0UsTUFBTSxtQkFBbUIsR0FBRyx5Q0FBeUMsQ0FB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QUVELE9BQU8sTUFBTSxhQUFhLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFLEdBQUcsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7S0FDNUU7SUFBQyxNQUFNO1FBQ04sT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQztLQUMzQjtZQUFTO1FBQ1IsTUFBTSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUM7S0FDdEI7QUFDSCxDQUFDO0FBbkZELDBCQW1GQztBQUVELGtCQUFlLElBQUEseUJBQWEsRUFBMkIsT0FBTyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQnVpbGRlckNvbnRleHQsXG4gIEJ1aWxkZXJPdXRwdXQsXG4gIGNyZWF0ZUJ1aWxkZXIsXG4gIHRhcmdldEZyb21UYXJnZXRTdHJpbmcsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9hcmNoaXRlY3QnO1xuaW1wb3J0IHsganNvbiwgdGFncyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IHsgcnVuTW9kdWxlQXNPYnNlcnZhYmxlRm9yayB9IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy9lcnJvcic7XG5pbXBvcnQgeyBEZXZTZXJ2ZXJCdWlsZGVyT3B0aW9ucyB9IGZyb20gJy4uL2Rldi1zZXJ2ZXIvaW5kZXgnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIFByb3RyYWN0b3JCdWlsZGVyT3B0aW9ucyB9IGZyb20gJy4vc2NoZW1hJztcblxuaW50ZXJmYWNlIEphc21pbmVOb2RlT3B0cyB7XG4gIGphc21pbmVOb2RlT3B0czoge1xuICAgIGdyZXA/OiBzdHJpbmc7XG4gICAgaW52ZXJ0R3JlcD86IGJvb2xlYW47XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1blByb3RyYWN0b3Iocm9vdDogc3RyaW5nLCBvcHRpb25zOiBQcm90cmFjdG9yQnVpbGRlck9wdGlvbnMpOiBQcm9taXNlPEJ1aWxkZXJPdXRwdXQ+IHtcbiAgY29uc3QgYWRkaXRpb25hbFByb3RyYWN0b3JDb25maWc6IFBhcnRpYWw8UHJvdHJhY3RvckJ1aWxkZXJPcHRpb25zPiAmIFBhcnRpYWw8SmFzbWluZU5vZGVPcHRzPiA9IHtcbiAgICBiYXNlVXJsOiBvcHRpb25zLmJhc2VVcmwsXG4gICAgc3BlY3M6IG9wdGlvbnMuc3BlY3MgJiYgb3B0aW9ucy5zcGVjcy5sZW5ndGggPyBvcHRpb25zLnNwZWNzIDogdW5kZWZpbmVkLFxuICAgIHN1aXRlOiBvcHRpb25zLnN1aXRlLFxuICAgIGphc21pbmVOb2RlT3B0czoge1xuICAgICAgZ3JlcDogb3B0aW9ucy5ncmVwLFxuICAgICAgaW52ZXJ0R3JlcDogb3B0aW9ucy5pbnZlcnRHcmVwLFxuICAgIH0sXG4gIH07XG5cbiAgLy8gVE9ETzogUHJvdHJhY3RvciBtYW5hZ2VzIHByb2Nlc3MuZXhpdCBpdHNlbGYsIHNvIHRoaXMgdGFyZ2V0IHdpbGwgYWxsd2F5cyBxdWl0IHRoZVxuICAvLyBwcm9jZXNzLiBUbyB3b3JrIGFyb3VuZCB0aGlzIHdlIHJ1biBpdCBpbiBhIHN1YnByb2Nlc3MuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL3Byb3RyYWN0b3IvaXNzdWVzLzQxNjBcbiAgcmV0dXJuIHJ1bk1vZHVsZUFzT2JzZXJ2YWJsZUZvcmsocm9vdCwgJ3Byb3RyYWN0b3IvYnVpbHQvbGF1bmNoZXInLCAnaW5pdCcsIFtcbiAgICByZXNvbHZlKHJvb3QsIG9wdGlvbnMucHJvdHJhY3RvckNvbmZpZyksXG4gICAgYWRkaXRpb25hbFByb3RyYWN0b3JDb25maWcsXG4gIF0pLnRvUHJvbWlzZSgpIGFzIFByb21pc2U8QnVpbGRlck91dHB1dD47XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVdlYmRyaXZlcigpIHtcbiAgLy8gVGhlIHdlYmRyaXZlci1tYW5hZ2VyIHVwZGF0ZSBjb21tYW5kIGNhbiBvbmx5IGJlIGFjY2Vzc2VkIHZpYSBhIGRlZXAgaW1wb3J0LlxuICBjb25zdCB3ZWJkcml2ZXJEZWVwSW1wb3J0ID0gJ3dlYmRyaXZlci1tYW5hZ2VyL2J1aWx0L2xpYi9jbWRzL3VwZGF0ZSc7XG5cbiAgbGV0IHBhdGg7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJvdHJhY3RvclBhdGggPSByZXF1aXJlLnJlc29sdmUoJ3Byb3RyYWN0b3InKTtcblxuICAgIHBhdGggPSByZXF1aXJlLnJlc29sdmUod2ViZHJpdmVyRGVlcEltcG9ydCwgeyBwYXRoczogW3Byb3RyYWN0b3JQYXRoXSB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBhc3NlcnRJc0Vycm9yKGVycm9yKTtcbiAgICBpZiAoZXJyb3IuY29kZSAhPT0gJ01PRFVMRV9OT1RfRk9VTkQnKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBpZiAoIXBhdGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IodGFncy5zdHJpcEluZGVudHNgXG4gICAgICBDYW5ub3QgYXV0b21hdGljYWxseSBmaW5kIHdlYmRyaXZlci1tYW5hZ2VyIHRvIHVwZGF0ZS5cbiAgICAgIFVwZGF0ZSB3ZWJkcml2ZXItbWFuYWdlciBtYW51YWxseSBhbmQgcnVuICduZyBlMmUgLS1uby13ZWJkcml2ZXItdXBkYXRlJyBpbnN0ZWFkLlxuICAgIGApO1xuICB9XG5cbiAgY29uc3Qgd2ViZHJpdmVyVXBkYXRlID0gYXdhaXQgaW1wb3J0KHBhdGgpO1xuICAvLyBjb25zdCB3ZWJkcml2ZXJVcGRhdGUgPSBhd2FpdCBpbXBvcnQocGF0aCkgYXMgdHlwZW9mIGltcG9ydCAoJ3dlYmRyaXZlci1tYW5hZ2VyL2J1aWx0L2xpYi9jbWRzL3VwZGF0ZScpO1xuXG4gIC8vIHJ1biBgd2ViZHJpdmVyLW1hbmFnZXIgdXBkYXRlIC0tc3RhbmRhbG9uZSBmYWxzZSAtLWdlY2tvIGZhbHNlIC0tcXVpZXRgXG4gIC8vIGlmIHlvdSBjaGFuZ2UgdGhpcywgdXBkYXRlIHRoZSBjb21tYW5kIGNvbW1lbnQgaW4gcHJldiBsaW5lXG4gIHJldHVybiB3ZWJkcml2ZXJVcGRhdGUucHJvZ3JhbS5ydW4oe1xuICAgIHN0YW5kYWxvbmU6IGZhbHNlLFxuICAgIGdlY2tvOiBmYWxzZSxcbiAgICBxdWlldDogdHJ1ZSxcbiAgfSBhcyB1bmtub3duIGFzIEpTT04pO1xufVxuXG5leHBvcnQgeyBQcm90cmFjdG9yQnVpbGRlck9wdGlvbnMgfTtcblxuLyoqXG4gKiBAZXhwZXJpbWVudGFsIERpcmVjdCB1c2FnZSBvZiB0aGlzIGZ1bmN0aW9uIGlzIGNvbnNpZGVyZWQgZXhwZXJpbWVudGFsLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZShcbiAgb3B0aW9uczogUHJvdHJhY3RvckJ1aWxkZXJPcHRpb25zLFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbik6IFByb21pc2U8QnVpbGRlck91dHB1dD4ge1xuICBjb250ZXh0LmxvZ2dlci53YXJuKFxuICAgICdQcm90cmFjdG9yIGhhcyByZWFjaGVkIGVuZC1vZi1saWZlIGFuZCBpcyBubyBsb25nZXIgc3VwcG9ydGVkIGJ5IHRoZSBBbmd1bGFyIHRlYW0uIFRoZSBgcHJvdHJhY3RvcmAgYnVpbGRlciB3aWxsIGJlIHJlbW92ZWQgaW4gYSBmdXR1cmUgQW5ndWxhciBtYWpvciB2ZXJzaW9uLiBGb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBhbmQgYWx0ZXJuYXRpdmVzLCBwbGVhc2Ugc2VlIGh0dHBzOi8vYmxvZy5hbmd1bGFyLmlvL3Byb3RyYWN0b3ItZGVwcmVjYXRpb24tdXBkYXRlLWF1Z3VzdC0yMDIzLTJiZWFjNzQwMmNlMC4nLFxuICApO1xuXG4gIC8vIGVuc3VyZSB0aGF0IG9ubHkgb25lIG9mIHRoZXNlIG9wdGlvbnMgaXMgdXNlZFxuICBpZiAob3B0aW9ucy5kZXZTZXJ2ZXJUYXJnZXQgJiYgb3B0aW9ucy5iYXNlVXJsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHRhZ3Muc3RyaXBJbmRlbnRzYFxuICAgIFRoZSAnYmFzZVVybCcgb3B0aW9uIGNhbm5vdCBiZSB1c2VkIHdpdGggJ2RldlNlcnZlclRhcmdldCcuXG4gICAgV2hlbiBwcmVzZW50LCAnZGV2U2VydmVyVGFyZ2V0JyB3aWxsIGJlIHVzZWQgdG8gYXV0b21hdGljYWxseSBzZXR1cCAnYmFzZVVybCcgZm9yIFByb3RyYWN0b3IuXG4gICAgYCk7XG4gIH1cblxuICBpZiAob3B0aW9ucy53ZWJkcml2ZXJVcGRhdGUpIHtcbiAgICBhd2FpdCB1cGRhdGVXZWJkcml2ZXIoKTtcbiAgfVxuXG4gIGxldCBiYXNlVXJsID0gb3B0aW9ucy5iYXNlVXJsO1xuICBsZXQgc2VydmVyO1xuXG4gIHRyeSB7XG4gICAgaWYgKG9wdGlvbnMuZGV2U2VydmVyVGFyZ2V0KSB7XG4gICAgICBjb25zdCB0YXJnZXQgPSB0YXJnZXRGcm9tVGFyZ2V0U3RyaW5nKG9wdGlvbnMuZGV2U2VydmVyVGFyZ2V0KTtcbiAgICAgIGNvbnN0IHNlcnZlck9wdGlvbnMgPSBhd2FpdCBjb250ZXh0LmdldFRhcmdldE9wdGlvbnModGFyZ2V0KTtcblxuICAgICAgY29uc3Qgb3ZlcnJpZGVzID0ge1xuICAgICAgICB3YXRjaDogZmFsc2UsXG4gICAgICAgIGxpdmVSZWxvYWQ6IGZhbHNlLFxuICAgICAgfSBhcyBEZXZTZXJ2ZXJCdWlsZGVyT3B0aW9ucyAmIGpzb24uSnNvbk9iamVjdDtcblxuICAgICAgaWYgKG9wdGlvbnMuaG9zdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG92ZXJyaWRlcy5ob3N0ID0gb3B0aW9ucy5ob3N0O1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VydmVyT3B0aW9ucy5ob3N0ID09PSAnc3RyaW5nJykge1xuICAgICAgICBvcHRpb25zLmhvc3QgPSBzZXJ2ZXJPcHRpb25zLmhvc3Q7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zLmhvc3QgPSBvdmVycmlkZXMuaG9zdCA9ICdsb2NhbGhvc3QnO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5wb3J0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgb3ZlcnJpZGVzLnBvcnQgPSBvcHRpb25zLnBvcnQ7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXJ2ZXJPcHRpb25zLnBvcnQgPT09ICdudW1iZXInKSB7XG4gICAgICAgIG9wdGlvbnMucG9ydCA9IHNlcnZlck9wdGlvbnMucG9ydDtcbiAgICAgIH1cblxuICAgICAgc2VydmVyID0gYXdhaXQgY29udGV4dC5zY2hlZHVsZVRhcmdldCh0YXJnZXQsIG92ZXJyaWRlcyk7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2ZXIucmVzdWx0O1xuICAgICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSB9O1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHNlcnZlck9wdGlvbnMucHVibGljSG9zdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgbGV0IHB1YmxpY0hvc3QgPSBzZXJ2ZXJPcHRpb25zLnB1YmxpY0hvc3Q7XG4gICAgICAgIGlmICghL15cXHcrOlxcL1xcLy8udGVzdChwdWJsaWNIb3N0KSkge1xuICAgICAgICAgIHB1YmxpY0hvc3QgPSBgJHtzZXJ2ZXJPcHRpb25zLnNzbCA/ICdodHRwcycgOiAnaHR0cCd9Oi8vJHtwdWJsaWNIb3N0fWA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2xpZW50VXJsID0gdXJsLnBhcnNlKHB1YmxpY0hvc3QpO1xuICAgICAgICBiYXNlVXJsID0gdXJsLmZvcm1hdChjbGllbnRVcmwpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcmVzdWx0LmJhc2VVcmwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGJhc2VVcmwgPSByZXN1bHQuYmFzZVVybDtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlc3VsdC5wb3J0ID09PSAnbnVtYmVyJykge1xuICAgICAgICBiYXNlVXJsID0gdXJsLmZvcm1hdCh7XG4gICAgICAgICAgcHJvdG9jb2w6IHNlcnZlck9wdGlvbnMuc3NsID8gJ2h0dHBzJyA6ICdodHRwJyxcbiAgICAgICAgICBob3N0bmFtZTogb3B0aW9ucy5ob3N0LFxuICAgICAgICAgIHBvcnQ6IHJlc3VsdC5wb3J0LnRvU3RyaW5nKCksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExpa2UgdGhlIGJhc2VVcmwgaW4gcHJvdHJhY3RvciBjb25maWcgZmlsZSB3aGVuIHVzaW5nIHRoZSBBUEkgd2UgbmVlZCB0byBhZGRcbiAgICAvLyBhIHRyYWlsaW5nIHNsYXNoIHdoZW4gcHJvdmlkZSB0byB0aGUgYmFzZVVybC5cbiAgICBpZiAoYmFzZVVybCAmJiAhYmFzZVVybC5lbmRzV2l0aCgnLycpKSB7XG4gICAgICBiYXNlVXJsICs9ICcvJztcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgcnVuUHJvdHJhY3Rvcihjb250ZXh0LndvcmtzcGFjZVJvb3QsIHsgLi4ub3B0aW9ucywgYmFzZVVybCB9KTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UgfTtcbiAgfSBmaW5hbGx5IHtcbiAgICBhd2FpdCBzZXJ2ZXI/LnN0b3AoKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVCdWlsZGVyPFByb3RyYWN0b3JCdWlsZGVyT3B0aW9ucz4oZXhlY3V0ZSk7XG4iXX0=