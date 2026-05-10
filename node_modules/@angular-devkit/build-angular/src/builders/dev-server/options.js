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
exports.normalizeOptions = void 0;
const architect_1 = require("@angular-devkit/architect");
const node_path_1 = __importDefault(require("node:path"));
const normalize_cache_1 = require("../../utils/normalize-cache");
/**
 * Normalize the user provided options by creating full paths for all path based options
 * and converting multi-form options into a single form that can be directly used
 * by the build process.
 *
 * @param context The context for current builder execution.
 * @param projectName The name of the project for the current execution.
 * @param options An object containing the options to use for the build.
 * @returns An object containing normalized options required to perform the build.
 */
async function normalizeOptions(context, projectName, options) {
    const workspaceRoot = context.workspaceRoot;
    const projectMetadata = await context.getProjectMetadata(projectName);
    const projectRoot = node_path_1.default.join(workspaceRoot, projectMetadata.root ?? '');
    const cacheOptions = (0, normalize_cache_1.normalizeCacheOptions)(projectMetadata, workspaceRoot);
    const browserTarget = (0, architect_1.targetFromTargetString)(options.browserTarget);
    // Initial options to keep
    const { host, port, poll, open, verbose, watch, allowedHosts, disableHostCheck, liveReload, hmr, headers, proxyConfig, servePath, publicHost, ssl, sslCert, sslKey, forceEsbuild, } = options;
    // Return all the normalized options
    return {
        browserTarget,
        host: host ?? 'localhost',
        port: port ?? 4200,
        poll,
        open,
        verbose,
        watch,
        liveReload,
        hmr,
        headers,
        workspaceRoot,
        projectRoot,
        cacheOptions,
        allowedHosts,
        disableHostCheck,
        proxyConfig,
        servePath,
        publicHost,
        ssl,
        sslCert,
        sslKey,
        forceEsbuild,
    };
}
exports.normalizeOptions = normalizeOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2Rldi1zZXJ2ZXIvb3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCx5REFBbUY7QUFDbkYsMERBQTZCO0FBQzdCLGlFQUFvRTtBQUtwRTs7Ozs7Ozs7O0dBU0c7QUFDSSxLQUFLLFVBQVUsZ0JBQWdCLENBQ3BDLE9BQXVCLEVBQ3ZCLFdBQW1CLEVBQ25CLE9BQXlCO0lBRXpCLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7SUFDNUMsTUFBTSxlQUFlLEdBQUcsTUFBTSxPQUFPLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdEUsTUFBTSxXQUFXLEdBQUcsbUJBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFHLGVBQWUsQ0FBQyxJQUEyQixJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRWpHLE1BQU0sWUFBWSxHQUFHLElBQUEsdUNBQXFCLEVBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRTNFLE1BQU0sYUFBYSxHQUFHLElBQUEsa0NBQXNCLEVBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRXBFLDBCQUEwQjtJQUMxQixNQUFNLEVBQ0osSUFBSSxFQUNKLElBQUksRUFDSixJQUFJLEVBQ0osSUFBSSxFQUNKLE9BQU8sRUFDUCxLQUFLLEVBQ0wsWUFBWSxFQUNaLGdCQUFnQixFQUNoQixVQUFVLEVBQ1YsR0FBRyxFQUNILE9BQU8sRUFDUCxXQUFXLEVBQ1gsU0FBUyxFQUNULFVBQVUsRUFDVixHQUFHLEVBQ0gsT0FBTyxFQUNQLE1BQU0sRUFDTixZQUFZLEdBQ2IsR0FBRyxPQUFPLENBQUM7SUFFWixvQ0FBb0M7SUFDcEMsT0FBTztRQUNMLGFBQWE7UUFDYixJQUFJLEVBQUUsSUFBSSxJQUFJLFdBQVc7UUFDekIsSUFBSSxFQUFFLElBQUksSUFBSSxJQUFJO1FBQ2xCLElBQUk7UUFDSixJQUFJO1FBQ0osT0FBTztRQUNQLEtBQUs7UUFDTCxVQUFVO1FBQ1YsR0FBRztRQUNILE9BQU87UUFDUCxhQUFhO1FBQ2IsV0FBVztRQUNYLFlBQVk7UUFDWixZQUFZO1FBQ1osZ0JBQWdCO1FBQ2hCLFdBQVc7UUFDWCxTQUFTO1FBQ1QsVUFBVTtRQUNWLEdBQUc7UUFDSCxPQUFPO1FBQ1AsTUFBTTtRQUNOLFlBQVk7S0FDYixDQUFDO0FBQ0osQ0FBQztBQTVERCw0Q0E0REMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQnVpbGRlckNvbnRleHQsIHRhcmdldEZyb21UYXJnZXRTdHJpbmcgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvYXJjaGl0ZWN0JztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBub3JtYWxpemVDYWNoZU9wdGlvbnMgfSBmcm9tICcuLi8uLi91dGlscy9ub3JtYWxpemUtY2FjaGUnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIERldlNlcnZlck9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cbmV4cG9ydCB0eXBlIE5vcm1hbGl6ZWREZXZTZXJ2ZXJPcHRpb25zID0gQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBub3JtYWxpemVPcHRpb25zPj47XG5cbi8qKlxuICogTm9ybWFsaXplIHRoZSB1c2VyIHByb3ZpZGVkIG9wdGlvbnMgYnkgY3JlYXRpbmcgZnVsbCBwYXRocyBmb3IgYWxsIHBhdGggYmFzZWQgb3B0aW9uc1xuICogYW5kIGNvbnZlcnRpbmcgbXVsdGktZm9ybSBvcHRpb25zIGludG8gYSBzaW5nbGUgZm9ybSB0aGF0IGNhbiBiZSBkaXJlY3RseSB1c2VkXG4gKiBieSB0aGUgYnVpbGQgcHJvY2Vzcy5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgY29udGV4dCBmb3IgY3VycmVudCBidWlsZGVyIGV4ZWN1dGlvbi5cbiAqIEBwYXJhbSBwcm9qZWN0TmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvamVjdCBmb3IgdGhlIGN1cnJlbnQgZXhlY3V0aW9uLlxuICogQHBhcmFtIG9wdGlvbnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG9wdGlvbnMgdG8gdXNlIGZvciB0aGUgYnVpbGQuXG4gKiBAcmV0dXJucyBBbiBvYmplY3QgY29udGFpbmluZyBub3JtYWxpemVkIG9wdGlvbnMgcmVxdWlyZWQgdG8gcGVyZm9ybSB0aGUgYnVpbGQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBub3JtYWxpemVPcHRpb25zKFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbiAgcHJvamVjdE5hbWU6IHN0cmluZyxcbiAgb3B0aW9uczogRGV2U2VydmVyT3B0aW9ucyxcbikge1xuICBjb25zdCB3b3Jrc3BhY2VSb290ID0gY29udGV4dC53b3Jrc3BhY2VSb290O1xuICBjb25zdCBwcm9qZWN0TWV0YWRhdGEgPSBhd2FpdCBjb250ZXh0LmdldFByb2plY3RNZXRhZGF0YShwcm9qZWN0TmFtZSk7XG4gIGNvbnN0IHByb2plY3RSb290ID0gcGF0aC5qb2luKHdvcmtzcGFjZVJvb3QsIChwcm9qZWN0TWV0YWRhdGEucm9vdCBhcyBzdHJpbmcgfCB1bmRlZmluZWQpID8/ICcnKTtcblxuICBjb25zdCBjYWNoZU9wdGlvbnMgPSBub3JtYWxpemVDYWNoZU9wdGlvbnMocHJvamVjdE1ldGFkYXRhLCB3b3Jrc3BhY2VSb290KTtcblxuICBjb25zdCBicm93c2VyVGFyZ2V0ID0gdGFyZ2V0RnJvbVRhcmdldFN0cmluZyhvcHRpb25zLmJyb3dzZXJUYXJnZXQpO1xuXG4gIC8vIEluaXRpYWwgb3B0aW9ucyB0byBrZWVwXG4gIGNvbnN0IHtcbiAgICBob3N0LFxuICAgIHBvcnQsXG4gICAgcG9sbCxcbiAgICBvcGVuLFxuICAgIHZlcmJvc2UsXG4gICAgd2F0Y2gsXG4gICAgYWxsb3dlZEhvc3RzLFxuICAgIGRpc2FibGVIb3N0Q2hlY2ssXG4gICAgbGl2ZVJlbG9hZCxcbiAgICBobXIsXG4gICAgaGVhZGVycyxcbiAgICBwcm94eUNvbmZpZyxcbiAgICBzZXJ2ZVBhdGgsXG4gICAgcHVibGljSG9zdCxcbiAgICBzc2wsXG4gICAgc3NsQ2VydCxcbiAgICBzc2xLZXksXG4gICAgZm9yY2VFc2J1aWxkLFxuICB9ID0gb3B0aW9ucztcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBub3JtYWxpemVkIG9wdGlvbnNcbiAgcmV0dXJuIHtcbiAgICBicm93c2VyVGFyZ2V0LFxuICAgIGhvc3Q6IGhvc3QgPz8gJ2xvY2FsaG9zdCcsXG4gICAgcG9ydDogcG9ydCA/PyA0MjAwLFxuICAgIHBvbGwsXG4gICAgb3BlbixcbiAgICB2ZXJib3NlLFxuICAgIHdhdGNoLFxuICAgIGxpdmVSZWxvYWQsXG4gICAgaG1yLFxuICAgIGhlYWRlcnMsXG4gICAgd29ya3NwYWNlUm9vdCxcbiAgICBwcm9qZWN0Um9vdCxcbiAgICBjYWNoZU9wdGlvbnMsXG4gICAgYWxsb3dlZEhvc3RzLFxuICAgIGRpc2FibGVIb3N0Q2hlY2ssXG4gICAgcHJveHlDb25maWcsXG4gICAgc2VydmVQYXRoLFxuICAgIHB1YmxpY0hvc3QsXG4gICAgc3NsLFxuICAgIHNzbENlcnQsXG4gICAgc3NsS2V5LFxuICAgIGZvcmNlRXNidWlsZCxcbiAgfTtcbn1cbiJdfQ==