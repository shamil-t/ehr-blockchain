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
exports.AnalyticsCollector = void 0;
const crypto_1 = require("crypto");
const https = __importStar(require("https"));
const os = __importStar(require("os"));
const querystring = __importStar(require("querystring"));
const semver = __importStar(require("semver"));
const environment_options_1 = require("../utilities/environment-options");
const error_1 = require("../utilities/error");
const version_1 = require("../utilities/version");
const analytics_parameters_1 = require("./analytics-parameters");
const TRACKING_ID_PROD = 'G-VETNJBW8L4';
const TRACKING_ID_STAGING = 'G-TBMPRL1BTM';
class AnalyticsCollector {
    constructor(context, userId) {
        this.context = context;
        const requestParameters = {
            [analytics_parameters_1.RequestParameter.ProtocolVersion]: 2,
            [analytics_parameters_1.RequestParameter.ClientId]: userId,
            [analytics_parameters_1.RequestParameter.UserId]: userId,
            [analytics_parameters_1.RequestParameter.TrackingId]: /^\d+\.\d+\.\d+$/.test(version_1.VERSION.full) && version_1.VERSION.full !== '0.0.0'
                ? TRACKING_ID_PROD
                : TRACKING_ID_STAGING,
            // Built-in user properties
            [analytics_parameters_1.RequestParameter.SessionId]: (0, crypto_1.randomUUID)(),
            [analytics_parameters_1.RequestParameter.UserAgentArchitecture]: os.arch(),
            [analytics_parameters_1.RequestParameter.UserAgentPlatform]: os.platform(),
            [analytics_parameters_1.RequestParameter.UserAgentPlatformVersion]: os.release(),
            [analytics_parameters_1.RequestParameter.UserAgentMobile]: 0,
            [analytics_parameters_1.RequestParameter.SessionEngaged]: 1,
            // The below is needed for tech details to be collected.
            [analytics_parameters_1.RequestParameter.UserAgentFullVersionList]: 'Google%20Chrome;111.0.5563.64|Not(A%3ABrand;8.0.0.0|Chromium;111.0.5563.64',
        };
        if (environment_options_1.ngDebug) {
            requestParameters[analytics_parameters_1.RequestParameter.DebugView] = 1;
        }
        this.requestParameterStringified = querystring.stringify(requestParameters);
        const parsedVersion = semver.parse(process.version);
        const packageManagerVersion = context.packageManager.version;
        this.userParameters = {
            // While architecture is being collect by GA as UserAgentArchitecture.
            // It doesn't look like there is a way to query this. Therefore we collect this as a custom user dimension too.
            [analytics_parameters_1.UserCustomDimension.OsArchitecture]: os.arch(),
            // While User ID is being collected by GA, this is not visible in reports/for filtering.
            [analytics_parameters_1.UserCustomDimension.UserId]: userId,
            [analytics_parameters_1.UserCustomDimension.NodeVersion]: parsedVersion
                ? `${parsedVersion.major}.${parsedVersion.minor}.${parsedVersion.patch}`
                : 'other',
            [analytics_parameters_1.UserCustomDimension.NodeMajorVersion]: parsedVersion?.major,
            [analytics_parameters_1.UserCustomDimension.PackageManager]: context.packageManager.name,
            [analytics_parameters_1.UserCustomDimension.PackageManagerVersion]: packageManagerVersion,
            [analytics_parameters_1.UserCustomDimension.PackageManagerMajorVersion]: packageManagerVersion
                ? +packageManagerVersion.split('.', 1)[0]
                : undefined,
            [analytics_parameters_1.UserCustomDimension.AngularCLIVersion]: version_1.VERSION.full,
            [analytics_parameters_1.UserCustomDimension.AngularCLIMajorVersion]: version_1.VERSION.major,
        };
    }
    reportWorkspaceInfoEvent(parameters) {
        this.event('workspace_info', parameters);
    }
    reportRebuildRunEvent(parameters) {
        this.event('run_rebuild', parameters);
    }
    reportBuildRunEvent(parameters) {
        this.event('run_build', parameters);
    }
    reportArchitectRunEvent(parameters) {
        this.event('run_architect', parameters);
    }
    reportSchematicRunEvent(parameters) {
        this.event('run_schematic', parameters);
    }
    reportCommandRunEvent(command) {
        this.event('run_command', { [analytics_parameters_1.EventCustomDimension.Command]: command });
    }
    event(eventName, parameters) {
        this.trackingEventsQueue ?? (this.trackingEventsQueue = []);
        this.trackingEventsQueue.push({
            ...this.userParameters,
            ...parameters,
            'en': eventName,
        });
    }
    /**
     * Flush on an interval (if the event loop is waiting).
     *
     * @returns a method that when called will terminate the periodic
     * flush and call flush one last time.
     */
    periodFlush() {
        let analyticsFlushPromise = Promise.resolve();
        const analyticsFlushInterval = setInterval(() => {
            if (this.trackingEventsQueue?.length) {
                analyticsFlushPromise = analyticsFlushPromise.then(() => this.flush());
            }
        }, 4000);
        return () => {
            clearInterval(analyticsFlushInterval);
            // Flush one last time.
            return analyticsFlushPromise.then(() => this.flush());
        };
    }
    async flush() {
        const pendingTrackingEvents = this.trackingEventsQueue;
        this.context.logger.debug(`Analytics flush size. ${pendingTrackingEvents?.length}.`);
        if (!pendingTrackingEvents?.length) {
            return;
        }
        // The below is needed so that if flush is called multiple times,
        // we don't report the same event multiple times.
        this.trackingEventsQueue = undefined;
        try {
            await this.send(pendingTrackingEvents);
        }
        catch (error) {
            // Failure to report analytics shouldn't crash the CLI.
            (0, error_1.assertIsError)(error);
            this.context.logger.debug(`Send analytics error. ${error.message}.`);
        }
    }
    async send(data) {
        return new Promise((resolve, reject) => {
            const request = https.request({
                host: 'www.google-analytics.com',
                method: 'POST',
                path: '/g/collect?' + this.requestParameterStringified,
                headers: {
                    // The below is needed for tech details to be collected even though we provide our own information from the OS Node.js module
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                },
            }, (response) => {
                // The below is needed as otherwise the response will never close which will cause the CLI not to terminate.
                response.on('data', () => { });
                if (response.statusCode !== 200 && response.statusCode !== 204) {
                    reject(new Error(`Analytics reporting failed with status code: ${response.statusCode}.`));
                }
                else {
                    resolve();
                }
            });
            request.on('error', reject);
            const queryParameters = data.map((p) => querystring.stringify(p)).join('\n');
            request.write(queryParameters);
            request.end();
        });
    }
}
exports.AnalyticsCollector = AnalyticsCollector;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl0aWNzLWNvbGxlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXIvY2xpL3NyYy9hbmFseXRpY3MvYW5hbHl0aWNzLWNvbGxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILG1DQUFvQztBQUNwQyw2Q0FBK0I7QUFDL0IsdUNBQXlCO0FBQ3pCLHlEQUEyQztBQUMzQywrQ0FBaUM7QUFFakMsMEVBQTJEO0FBQzNELDhDQUFtRDtBQUNuRCxrREFBK0M7QUFDL0MsaUVBTWdDO0FBRWhDLE1BQU0sZ0JBQWdCLEdBQUcsY0FBYyxDQUFDO0FBQ3hDLE1BQU0sbUJBQW1CLEdBQUcsY0FBYyxDQUFDO0FBRTNDLE1BQWEsa0JBQWtCO0lBSzdCLFlBQW9CLE9BQXVCLEVBQUUsTUFBYztRQUF2QyxZQUFPLEdBQVAsT0FBTyxDQUFnQjtRQUN6QyxNQUFNLGlCQUFpQixHQUFzRDtZQUMzRSxDQUFDLHVDQUFnQixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFDckMsQ0FBQyx1Q0FBZ0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNO1lBQ25DLENBQUMsdUNBQWdCLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTTtZQUNqQyxDQUFDLHVDQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUMzQixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsaUJBQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxpQkFBTyxDQUFDLElBQUksS0FBSyxPQUFPO2dCQUM5RCxDQUFDLENBQUMsZ0JBQWdCO2dCQUNsQixDQUFDLENBQUMsbUJBQW1CO1lBRXpCLDJCQUEyQjtZQUMzQixDQUFDLHVDQUFnQixDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUEsbUJBQVUsR0FBRTtZQUMxQyxDQUFDLHVDQUFnQixDQUFDLHFCQUFxQixDQUFDLEVBQUUsRUFB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O2lCQUNYO1lBQ0gsQ0FBQyxDQUNGLENBQUM7WUFFRixPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1QixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdFLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDL0IsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBL0tELGdEQStLQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyByYW5kb21VVUlEIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIG9zIGZyb20gJ29zJztcbmltcG9ydCAqIGFzIHF1ZXJ5c3RyaW5nIGZyb20gJ3F1ZXJ5c3RyaW5nJztcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHR5cGUgeyBDb21tYW5kQ29udGV4dCB9IGZyb20gJy4uL2NvbW1hbmQtYnVpbGRlci9jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBuZ0RlYnVnIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2Vudmlyb25tZW50LW9wdGlvbnMnO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4uL3V0aWxpdGllcy9lcnJvcic7XG5pbXBvcnQgeyBWRVJTSU9OIH0gZnJvbSAnLi4vdXRpbGl0aWVzL3ZlcnNpb24nO1xuaW1wb3J0IHtcbiAgRXZlbnRDdXN0b21EaW1lbnNpb24sXG4gIEV2ZW50Q3VzdG9tTWV0cmljLFxuICBQcmltaXRpdmVUeXBlcyxcbiAgUmVxdWVzdFBhcmFtZXRlcixcbiAgVXNlckN1c3RvbURpbWVuc2lvbixcbn0gZnJvbSAnLi9hbmFseXRpY3MtcGFyYW1ldGVycyc7XG5cbmNvbnN0IFRSQUNLSU5HX0lEX1BST0QgPSAnRy1WRVROSkJXOEw0JztcbmNvbnN0IFRSQUNLSU5HX0lEX1NUQUdJTkcgPSAnRy1UQk1QUkwxQlRNJztcblxuZXhwb3J0IGNsYXNzIEFuYWx5dGljc0NvbGxlY3RvciB7XG4gIHByaXZhdGUgdHJhY2tpbmdFdmVudHNRdWV1ZTogUmVjb3JkPHN0cmluZywgUHJpbWl0aXZlVHlwZXMgfCB1bmRlZmluZWQ+W10gfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgcmVxdWVzdFBhcmFtZXRlclN0cmluZ2lmaWVkOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgdXNlclBhcmFtZXRlcnM6IFJlY29yZDxVc2VyQ3VzdG9tRGltZW5zaW9uLCBQcmltaXRpdmVUeXBlcyB8IHVuZGVmaW5lZD47XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb250ZXh0OiBDb21tYW5kQ29udGV4dCwgdXNlcklkOiBzdHJpbmcpIHtcbiAgICBjb25zdCByZXF1ZXN0UGFyYW1ldGVyczogUGFydGlhbDxSZWNvcmQ8UmVxdWVzdFBhcmFtZXRlciwgUHJpbWl0aXZlVHlwZXM+PiA9IHtcbiAgICAgIFtSZXF1ZXN0UGFyYW1ldGVyLlByb3RvY29sVmVyc2lvbl06IDIsXG4gICAgICBbUmVxdWVzdFBhcmFtZXRlci5DbGllbnRJZF06IHVzZXJJZCxcbiAgICAgIFtSZXF1ZXN0UGFyYW1ldGVyLlVzZXJJZF06IHVzZXJJZCxcbiAgICAgIFtSZXF1ZXN0UGFyYW1ldGVyLlRyYWNraW5nSWRdOlxuICAgICAgICAvXlxcZCtcXC5cXGQrXFwuXFxkKyQvLnRlc3QoVkVSU0lPTi5mdWxsKSAmJiBWRVJTSU9OLmZ1bGwgIT09ICcwLjAuMCdcbiAgICAgICAgICA/IFRSQUNLSU5HX0lEX1BST0RcbiAgICAgICAgICA6IFRSQUNLSU5HX0lEX1NUQUdJTkcsXG5cbiAgICAgIC8vIEJ1aWx0LWluIHVzZXIgcHJvcGVydGllc1xuICAgICAgW1JlcXVlc3RQYXJhbWV0ZXIuU2Vzc2lvbklkXTogcmFuZG9tVVVJRCgpLFxuICAgICAgW1JlcXVlc3RQYXJhbWV0ZXIuVXNlckFnZW50QXJjaGl0ZWN0dXJlXTogb3MuYXJjaCgpLFxuICAgICAgW1JlcXVlc3RQYXJhbWV0ZXIuVXNlckFnZW50UGxhdGZvcm1dOiBvcy5wbGF0Zm9ybSgpLFxuICAgICAgW1JlcXVlc3RQYXJhbWV0ZXIuVXNlckFnZW50UGxhdGZvcm1WZXJzaW9uXTogb3MucmVsZWFzZSgpLFxuICAgICAgW1JlcXVlc3RQYXJhbWV0ZXIuVXNlckFnZW50TW9iaWxlXTogMCxcbiAgICAgIFtSZXF1ZXN0UGFyYW1ldGVyLlNlc3Npb25FbmdhZ2VkXTogMSxcbiAgICAgIC8vIFRoZSBiZWxvdyBpcyBuZWVkZWQgZm9yIHRlY2ggZGV0YWlscyB0byBiZSBjb2xsZWN0ZWQuXG4gICAgICBbUmVxdWVzdFBhcmFtZXRlci5Vc2VyQWdlbnRGdWxsVmVyc2lvbkxpc3RdOlxuICAgICAgICAnR29vZ2xlJTIwQ2hyb21lOzExMS4wLjU1NjMuNjR8Tm90KEElM0FCcmFuZDs4LjAuMC4wfENocm9taXVtOzExMS4wLjU1NjMuNjQnLFxuICAgIH07XG5cbiAgICBpZiAobmdEZWJ1Zykge1xuICAgICAgcmVxdWVzdFBhcmFtZXRlcnNbUmVxdWVzdFBhcmFtZXRlci5EZWJ1Z1ZpZXddID0gMTtcbiAgICB9XG5cbiAgICB0aGlzLnJlcXVlc3RQYXJhbWV0ZXJTdHJpbmdpZmllZCA9IHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShyZXF1ZXN0UGFyYW1ldGVycyk7XG5cbiAgICBjb25zdCBwYXJzZWRWZXJzaW9uID0gc2VtdmVyLnBhcnNlKHByb2Nlc3MudmVyc2lvbik7XG4gICAgY29uc3QgcGFja2FnZU1hbmFnZXJWZXJzaW9uID0gY29udGV4dC5wYWNrYWdlTWFuYWdlci52ZXJzaW9uO1xuXG4gICAgdGhpcy51c2VyUGFyYW1ldGVycyA9IHtcbiAgICAgIC8vIFdoaWxlIGFyY2hpdGVjdHVyZSBpcyBiZWluZyBjb2xsZWN0IGJ5IEdBIGFzIFVzZXJBZ2VudEFyY2hpdGVjdHVyZS5cbiAgICAgIC8vIEl0IGRvZXNuJ3QgbG9vayBsaWtlIHRoZXJlIGlzIGEgd2F5IHRvIHF1ZXJ5IHRoaXMuIFRoZXJlZm9yZSB3ZSBjb2xsZWN0IHRoaXMgYXMgYSBjdXN0b20gdXNlciBkaW1lbnNpb24gdG9vLlxuICAgICAgW1VzZXJDdXN0b21EaW1lbnNpb24uT3NBcmNoaXRlY3R1cmVdOiBvcy5hcmNoKCksXG4gICAgICAvLyBXaGlsZSBVc2VyIElEIGlzIGJlaW5nIGNvbGxlY3RlZCBieSBHQSwgdGhpcyBpcyBub3QgdmlzaWJsZSBpbiByZXBvcnRzL2ZvciBmaWx0ZXJpbmcuXG4gICAgICBbVXNlckN1c3RvbURpbWVuc2lvbi5Vc2VySWRdOiB1c2VySWQsXG4gICAgICBbVXNlckN1c3RvbURpbWVuc2lvbi5Ob2RlVmVyc2lvbl06IHBhcnNlZFZlcnNpb25cbiAgICAgICAgPyBgJHtwYXJzZWRWZXJzaW9uLm1ham9yfS4ke3BhcnNlZFZlcnNpb24ubWlub3J9LiR7cGFyc2VkVmVyc2lvbi5wYXRjaH1gXG4gICAgICAgIDogJ290aGVyJyxcbiAgICAgIFtVc2VyQ3VzdG9tRGltZW5zaW9uLk5vZGVNYWpvclZlcnNpb25dOiBwYXJzZWRWZXJzaW9uPy5tYWpvcixcbiAgICAgIFtVc2VyQ3VzdG9tRGltZW5zaW9uLlBhY2thZ2VNYW5hZ2VyXTogY29udGV4dC5wYWNrYWdlTWFuYWdlci5uYW1lLFxuICAgICAgW1VzZXJDdXN0b21EaW1lbnNpb24uUGFja2FnZU1hbmFnZXJWZXJzaW9uXTogcGFja2FnZU1hbmFnZXJWZXJzaW9uLFxuICAgICAgW1VzZXJDdXN0b21EaW1lbnNpb24uUGFja2FnZU1hbmFnZXJNYWpvclZlcnNpb25dOiBwYWNrYWdlTWFuYWdlclZlcnNpb25cbiAgICAgICAgPyArcGFja2FnZU1hbmFnZXJWZXJzaW9uLnNwbGl0KCcuJywgMSlbMF1cbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICBbVXNlckN1c3RvbURpbWVuc2lvbi5Bbmd1bGFyQ0xJVmVyc2lvbl06IFZFUlNJT04uZnVsbCxcbiAgICAgIFtVc2VyQ3VzdG9tRGltZW5zaW9uLkFuZ3VsYXJDTElNYWpvclZlcnNpb25dOiBWRVJTSU9OLm1ham9yLFxuICAgIH07XG4gIH1cblxuICByZXBvcnRXb3Jrc3BhY2VJbmZvRXZlbnQoXG4gICAgcGFyYW1ldGVyczogUGFydGlhbDxSZWNvcmQ8RXZlbnRDdXN0b21NZXRyaWMsIHN0cmluZyB8IGJvb2xlYW4gfCBudW1iZXIgfCB1bmRlZmluZWQ+PixcbiAgKTogdm9pZCB7XG4gICAgdGhpcy5ldmVudCgnd29ya3NwYWNlX2luZm8nLCBwYXJhbWV0ZXJzKTtcbiAgfVxuXG4gIHJlcG9ydFJlYnVpbGRSdW5FdmVudChcbiAgICBwYXJhbWV0ZXJzOiBQYXJ0aWFsPFxuICAgICAgUmVjb3JkPEV2ZW50Q3VzdG9tTWV0cmljICYgRXZlbnRDdXN0b21EaW1lbnNpb24sIHN0cmluZyB8IGJvb2xlYW4gfCBudW1iZXIgfCB1bmRlZmluZWQ+XG4gICAgPixcbiAgKTogdm9pZCB7XG4gICAgdGhpcy5ldmVudCgncnVuX3JlYnVpbGQnLCBwYXJhbWV0ZXJzKTtcbiAgfVxuXG4gIHJlcG9ydEJ1aWxkUnVuRXZlbnQoXG4gICAgcGFyYW1ldGVyczogUGFydGlhbDxcbiAgICAgIFJlY29yZDxFdmVudEN1c3RvbU1ldHJpYyAmIEV2ZW50Q3VzdG9tRGltZW5zaW9uLCBzdHJpbmcgfCBib29sZWFuIHwgbnVtYmVyIHwgdW5kZWZpbmVkPlxuICAgID4sXG4gICk6IHZvaWQge1xuICAgIHRoaXMuZXZlbnQoJ3J1bl9idWlsZCcsIHBhcmFtZXRlcnMpO1xuICB9XG5cbiAgcmVwb3J0QXJjaGl0ZWN0UnVuRXZlbnQocGFyYW1ldGVyczogUGFydGlhbDxSZWNvcmQ8RXZlbnRDdXN0b21EaW1lbnNpb24sIFByaW1pdGl2ZVR5cGVzPj4pOiB2b2lkIHtcbiAgICB0aGlzLmV2ZW50KCdydW5fYXJjaGl0ZWN0JywgcGFyYW1ldGVycyk7XG4gIH1cblxuICByZXBvcnRTY2hlbWF0aWNSdW5FdmVudChwYXJhbWV0ZXJzOiBQYXJ0aWFsPFJlY29yZDxFdmVudEN1c3RvbURpbWVuc2lvbiwgUHJpbWl0aXZlVHlwZXM+Pik6IHZvaWQge1xuICAgIHRoaXMuZXZlbnQoJ3J1bl9zY2hlbWF0aWMnLCBwYXJhbWV0ZXJzKTtcbiAgfVxuXG4gIHJlcG9ydENvbW1hbmRSdW5FdmVudChjb21tYW5kOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmV2ZW50KCdydW5fY29tbWFuZCcsIHsgW0V2ZW50Q3VzdG9tRGltZW5zaW9uLkNvbW1hbmRdOiBjb21tYW5kIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBldmVudChldmVudE5hbWU6IHN0cmluZywgcGFyYW1ldGVycz86IFJlY29yZDxzdHJpbmcsIFByaW1pdGl2ZVR5cGVzPik6IHZvaWQge1xuICAgIHRoaXMudHJhY2tpbmdFdmVudHNRdWV1ZSA/Pz0gW107XG4gICAgdGhpcy50cmFja2luZ0V2ZW50c1F1ZXVlLnB1c2goe1xuICAgICAgLi4udGhpcy51c2VyUGFyYW1ldGVycyxcbiAgICAgIC4uLnBhcmFtZXRlcnMsXG4gICAgICAnZW4nOiBldmVudE5hbWUsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmx1c2ggb24gYW4gaW50ZXJ2YWwgKGlmIHRoZSBldmVudCBsb29wIGlzIHdhaXRpbmcpLlxuICAgKlxuICAgKiBAcmV0dXJucyBhIG1ldGhvZCB0aGF0IHdoZW4gY2FsbGVkIHdpbGwgdGVybWluYXRlIHRoZSBwZXJpb2RpY1xuICAgKiBmbHVzaCBhbmQgY2FsbCBmbHVzaCBvbmUgbGFzdCB0aW1lLlxuICAgKi9cbiAgcGVyaW9kRmx1c2goKTogKCkgPT4gUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGFuYWx5dGljc0ZsdXNoUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgIGNvbnN0IGFuYWx5dGljc0ZsdXNoSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy50cmFja2luZ0V2ZW50c1F1ZXVlPy5sZW5ndGgpIHtcbiAgICAgICAgYW5hbHl0aWNzRmx1c2hQcm9taXNlID0gYW5hbHl0aWNzRmx1c2hQcm9taXNlLnRoZW4oKCkgPT4gdGhpcy5mbHVzaCgpKTtcbiAgICAgIH1cbiAgICB9LCA0MDAwKTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBjbGVhckludGVydmFsKGFuYWx5dGljc0ZsdXNoSW50ZXJ2YWwpO1xuXG4gICAgICAvLyBGbHVzaCBvbmUgbGFzdCB0aW1lLlxuICAgICAgcmV0dXJuIGFuYWx5dGljc0ZsdXNoUHJvbWlzZS50aGVuKCgpID0+IHRoaXMuZmx1c2goKSk7XG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGZsdXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHBlbmRpbmdUcmFja2luZ0V2ZW50cyA9IHRoaXMudHJhY2tpbmdFdmVudHNRdWV1ZTtcbiAgICB0aGlzLmNvbnRleHQubG9nZ2VyLmRlYnVnKGBBbmFseXRpY3MgZmx1c2ggc2l6ZS4gJHtwZW5kaW5nVHJhY2tpbmdFdmVudHM/Lmxlbmd0aH0uYCk7XG5cbiAgICBpZiAoIXBlbmRpbmdUcmFja2luZ0V2ZW50cz8ubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVGhlIGJlbG93IGlzIG5lZWRlZCBzbyB0aGF0IGlmIGZsdXNoIGlzIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyxcbiAgICAvLyB3ZSBkb24ndCByZXBvcnQgdGhlIHNhbWUgZXZlbnQgbXVsdGlwbGUgdGltZXMuXG4gICAgdGhpcy50cmFja2luZ0V2ZW50c1F1ZXVlID0gdW5kZWZpbmVkO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuc2VuZChwZW5kaW5nVHJhY2tpbmdFdmVudHMpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBGYWlsdXJlIHRvIHJlcG9ydCBhbmFseXRpY3Mgc2hvdWxkbid0IGNyYXNoIHRoZSBDTEkuXG4gICAgICBhc3NlcnRJc0Vycm9yKGVycm9yKTtcbiAgICAgIHRoaXMuY29udGV4dC5sb2dnZXIuZGVidWcoYFNlbmQgYW5hbHl0aWNzIGVycm9yLiAke2Vycm9yLm1lc3NhZ2V9LmApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2VuZChkYXRhOiBSZWNvcmQ8c3RyaW5nLCBQcmltaXRpdmVUeXBlcyB8IHVuZGVmaW5lZD5bXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0gaHR0cHMucmVxdWVzdChcbiAgICAgICAge1xuICAgICAgICAgIGhvc3Q6ICd3d3cuZ29vZ2xlLWFuYWx5dGljcy5jb20nLFxuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIHBhdGg6ICcvZy9jb2xsZWN0PycgKyB0aGlzLnJlcXVlc3RQYXJhbWV0ZXJTdHJpbmdpZmllZCxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAvLyBUaGUgYmVsb3cgaXMgbmVlZGVkIGZvciB0ZWNoIGRldGFpbHMgdG8gYmUgY29sbGVjdGVkIGV2ZW4gdGhvdWdoIHdlIHByb3ZpZGUgb3VyIG93biBpbmZvcm1hdGlvbiBmcm9tIHRoZSBPUyBOb2RlLmpzIG1vZHVsZVxuICAgICAgICAgICAgJ3VzZXItYWdlbnQnOlxuICAgICAgICAgICAgICAnTW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzExMS4wLjAuMCBTYWZhcmkvNTM3LjM2JyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAvLyBUaGUgYmVsb3cgaXMgbmVlZGVkIGFzIG90aGVyd2lzZSB0aGUgcmVzcG9uc2Ugd2lsbCBuZXZlciBjbG9zZSB3aGljaCB3aWxsIGNhdXNlIHRoZSBDTEkgbm90IHRvIHRlcm1pbmF0ZS5cbiAgICAgICAgICByZXNwb25zZS5vbignZGF0YScsICgpID0+IHt9KTtcblxuICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlICE9PSAyMDAgJiYgcmVzcG9uc2Uuc3RhdHVzQ29kZSAhPT0gMjA0KSB7XG4gICAgICAgICAgICByZWplY3QoXG4gICAgICAgICAgICAgIG5ldyBFcnJvcihgQW5hbHl0aWNzIHJlcG9ydGluZyBmYWlsZWQgd2l0aCBzdGF0dXMgY29kZTogJHtyZXNwb25zZS5zdGF0dXNDb2RlfS5gKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICApO1xuXG4gICAgICByZXF1ZXN0Lm9uKCdlcnJvcicsIHJlamVjdCk7XG4gICAgICBjb25zdCBxdWVyeVBhcmFtZXRlcnMgPSBkYXRhLm1hcCgocCkgPT4gcXVlcnlzdHJpbmcuc3RyaW5naWZ5KHApKS5qb2luKCdcXG4nKTtcbiAgICAgIHJlcXVlc3Qud3JpdGUocXVlcnlQYXJhbWV0ZXJzKTtcbiAgICAgIHJlcXVlc3QuZW5kKCk7XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==