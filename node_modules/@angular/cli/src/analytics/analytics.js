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
exports.getAnalyticsInfoString = exports.getAnalyticsUserId = exports.promptAnalytics = exports.setAnalyticsConfig = exports.isPackageNameSafeForAnalytics = exports.analyticsPackageSafelist = void 0;
const core_1 = require("@angular-devkit/core");
const crypto_1 = require("crypto");
const color_1 = require("../utilities/color");
const config_1 = require("../utilities/config");
const environment_options_1 = require("../utilities/environment-options");
const tty_1 = require("../utilities/tty");
/* eslint-disable no-console */
/**
 * This is the ultimate safelist for checking if a package name is safe to report to analytics.
 */
exports.analyticsPackageSafelist = [
    /^@angular\//,
    /^@angular-devkit\//,
    /^@nguniversal\//,
    '@schematics/angular',
];
function isPackageNameSafeForAnalytics(name) {
    return exports.analyticsPackageSafelist.some((pattern) => {
        if (typeof pattern == 'string') {
            return pattern === name;
        }
        else {
            return pattern.test(name);
        }
    });
}
exports.isPackageNameSafeForAnalytics = isPackageNameSafeForAnalytics;
/**
 * Set analytics settings. This does not work if the user is not inside a project.
 * @param global Which config to use. "global" for user-level, and "local" for project-level.
 * @param value Either a user ID, true to generate a new User ID, or false to disable analytics.
 */
async function setAnalyticsConfig(global, value) {
    var _a;
    const level = global ? 'global' : 'local';
    const workspace = await (0, config_1.getWorkspace)(level);
    if (!workspace) {
        throw new Error(`Could not find ${level} workspace.`);
    }
    const cli = ((_a = workspace.extensions)['cli'] ?? (_a['cli'] = {}));
    if (!workspace || !core_1.json.isJsonObject(cli)) {
        throw new Error(`Invalid config found at ${workspace.filePath}. CLI should be an object.`);
    }
    cli.analytics = value === true ? (0, crypto_1.randomUUID)() : value;
    await workspace.save();
}
exports.setAnalyticsConfig = setAnalyticsConfig;
/**
 * Prompt the user for usage gathering permission.
 * @param force Whether to ask regardless of whether or not the user is using an interactive shell.
 * @return Whether or not the user was shown a prompt.
 */
async function promptAnalytics(context, global, force = false) {
    const level = global ? 'global' : 'local';
    const workspace = await (0, config_1.getWorkspace)(level);
    if (!workspace) {
        throw new Error(`Could not find a ${level} workspace. Are you in a project?`);
    }
    if (force || (0, tty_1.isTTY)()) {
        const { prompt } = await Promise.resolve().then(() => __importStar(require('inquirer')));
        const answers = await prompt([
            {
                type: 'confirm',
                name: 'analytics',
                message: core_1.tags.stripIndents `
           Would you like to share pseudonymous usage data about this project with the Angular Team
           at Google under Google's Privacy Policy at https://policies.google.com/privacy. For more
           details and how to change this setting, see https://angular.io/analytics.

         `,
                default: false,
            },
        ]);
        await setAnalyticsConfig(global, answers.analytics);
        if (answers.analytics) {
            console.log('');
            console.log(core_1.tags.stripIndent `
         Thank you for sharing pseudonymous usage data. Should you change your mind, the following
         command will disable this feature entirely:

             ${color_1.colors.yellow(`ng analytics disable${global ? ' --global' : ''}`)}
       `);
            console.log('');
        }
        process.stderr.write(await getAnalyticsInfoString(context));
        return true;
    }
    return false;
}
exports.promptAnalytics = promptAnalytics;
/**
 * Get the analytics user id.
 *
 * @returns
 * - `string` user id.
 * - `false` when disabled.
 * - `undefined` when not configured.
 */
async function getAnalyticsUserIdForLevel(level) {
    if (environment_options_1.analyticsDisabled) {
        return false;
    }
    const workspace = await (0, config_1.getWorkspace)(level);
    const analyticsConfig = workspace?.getCli()?.['analytics'];
    if (analyticsConfig === false) {
        return false;
    }
    else if (analyticsConfig === undefined || analyticsConfig === null) {
        return undefined;
    }
    else {
        if (typeof analyticsConfig == 'string') {
            return analyticsConfig;
        }
        else if (typeof analyticsConfig == 'object' && typeof analyticsConfig['uid'] == 'string') {
            return analyticsConfig['uid'];
        }
        return undefined;
    }
}
async function getAnalyticsUserId(context, skipPrompt = false) {
    const { workspace } = context;
    // Global config takes precedence over local config only for the disabled check.
    // IE:
    // global: disabled & local: enabled = disabled
    // global: id: 123 & local: id: 456 = 456
    // check global
    const globalConfig = await getAnalyticsUserIdForLevel('global');
    if (globalConfig === false) {
        return undefined;
    }
    // Not disabled globally, check locally or not set globally and command is run outside of workspace example: `ng new`
    if (workspace || globalConfig === undefined) {
        const level = workspace ? 'local' : 'global';
        let localOrGlobalConfig = await getAnalyticsUserIdForLevel(level);
        if (localOrGlobalConfig === undefined) {
            if (!skipPrompt) {
                // config is unset, prompt user.
                // TODO: This should honor the `no-interactive` option.
                // It is currently not an `ng` option but rather only an option for specific commands.
                // The concept of `ng`-wide options are needed to cleanly handle this.
                await promptAnalytics(context, !workspace /** global */);
                localOrGlobalConfig = await getAnalyticsUserIdForLevel(level);
            }
        }
        if (localOrGlobalConfig === false) {
            return undefined;
        }
        else if (typeof localOrGlobalConfig === 'string') {
            return localOrGlobalConfig;
        }
    }
    return globalConfig;
}
exports.getAnalyticsUserId = getAnalyticsUserId;
function analyticsConfigValueToHumanFormat(value) {
    if (value === false) {
        return 'disabled';
    }
    else if (typeof value === 'string' || value === true) {
        return 'enabled';
    }
    else {
        return 'not set';
    }
}
async function getAnalyticsInfoString(context) {
    const analyticsInstance = await getAnalyticsUserId(context, true /** skipPrompt */);
    const { globalConfiguration, workspace: localWorkspace } = context;
    const globalSetting = globalConfiguration?.getCli()?.['analytics'];
    const localSetting = localWorkspace?.getCli()?.['analytics'];
    return (core_1.tags.stripIndents `
     Global setting: ${analyticsConfigValueToHumanFormat(globalSetting)}
     Local setting: ${localWorkspace
        ? analyticsConfigValueToHumanFormat(localSetting)
        : 'No local workspace configuration file.'}
     Effective status: ${analyticsInstance ? 'enabled' : 'disabled'}
   ` + '\n');
}
exports.getAnalyticsInfoString = getAnalyticsInfoString;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl0aWNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2FuYWx5dGljcy9hbmFseXRpY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwrQ0FBa0Q7QUFDbEQsbUNBQW9DO0FBRXBDLDhDQUE0QztBQUM1QyxnREFBbUQ7QUFDbkQsMEVBQXFFO0FBQ3JFLDBDQUF5QztBQUV6QywrQkFBK0I7QUFFL0I7O0dBRUc7QUFDVSxRQUFBLHdCQUF3QixHQUFHO0lBQ3RDLGFBQWE7SUFDYixvQkFBb0I7SUFDcEIsaUJBQWlCO0lBQ2pCLHFCQUFxQjtDQUN0QixDQUFDO0FBRUYsU0FBZ0IsNkJBQTZCLENBQUMsSUFBWTtJQUN4RCxPQUFPLGdDQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1FBQy9DLElBQUksT0FBTyxPQUFPLElBQUksUUFBUSxFQUFFO1lBQzlCLE9BQU8sT0FBTyxLQUFLLElBQUksQ0FBQztTQUN6QjthQUFNO1lBQ0wsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzNCO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBUkQsc0VBUUM7QUFFRDs7OztHQUlHO0FBQ0ksS0FBSyxVQUFVLGtCQUFrQixDQUFDLE1BQWUsRUFBRSxLQUF1Qjs7SUFDL0UsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztJQUMxQyxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEscUJBQVksRUFBQyxLQUFLLENBQUMsQ0FBQztJQUM1QyxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsS0FBSyxhQUFhLENBQUMsQ0FBQztL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IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBqc29uLCB0YWdzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgcmFuZG9tVVVJRCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgdHlwZSB7IENvbW1hbmRDb250ZXh0IH0gZnJvbSAnLi4vY29tbWFuZC1idWlsZGVyL2NvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7IGNvbG9ycyB9IGZyb20gJy4uL3V0aWxpdGllcy9jb2xvcic7XG5pbXBvcnQgeyBnZXRXb3Jrc3BhY2UgfSBmcm9tICcuLi91dGlsaXRpZXMvY29uZmlnJztcbmltcG9ydCB7IGFuYWx5dGljc0Rpc2FibGVkIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2Vudmlyb25tZW50LW9wdGlvbnMnO1xuaW1wb3J0IHsgaXNUVFkgfSBmcm9tICcuLi91dGlsaXRpZXMvdHR5JztcblxuLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuXG4vKipcbiAqIFRoaXMgaXMgdGhlIHVsdGltYXRlIHNhZmVsaXN0IGZvciBjaGVja2luZyBpZiBhIHBhY2thZ2UgbmFtZSBpcyBzYWZlIHRvIHJlcG9ydCB0byBhbmFseXRpY3MuXG4gKi9cbmV4cG9ydCBjb25zdCBhbmFseXRpY3NQYWNrYWdlU2FmZWxpc3QgPSBbXG4gIC9eQGFuZ3VsYXJcXC8vLFxuICAvXkBhbmd1bGFyLWRldmtpdFxcLy8sXG4gIC9eQG5ndW5pdmVyc2FsXFwvLyxcbiAgJ0BzY2hlbWF0aWNzL2FuZ3VsYXInLFxuXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzUGFja2FnZU5hbWVTYWZlRm9yQW5hbHl0aWNzKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gYW5hbHl0aWNzUGFja2FnZVNhZmVsaXN0LnNvbWUoKHBhdHRlcm4pID0+IHtcbiAgICBpZiAodHlwZW9mIHBhdHRlcm4gPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBwYXR0ZXJuID09PSBuYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcGF0dGVybi50ZXN0KG5hbWUpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKlxuICogU2V0IGFuYWx5dGljcyBzZXR0aW5ncy4gVGhpcyBkb2VzIG5vdCB3b3JrIGlmIHRoZSB1c2VyIGlzIG5vdCBpbnNpZGUgYSBwcm9qZWN0LlxuICogQHBhcmFtIGdsb2JhbCBXaGljaCBjb25maWcgdG8gdXNlLiBcImdsb2JhbFwiIGZvciB1c2VyLWxldmVsLCBhbmQgXCJsb2NhbFwiIGZvciBwcm9qZWN0LWxldmVsLlxuICogQHBhcmFtIHZhbHVlIEVpdGhlciBhIHVzZXIgSUQsIHRydWUgdG8gZ2VuZXJhdGUgYSBuZXcgVXNlciBJRCwgb3IgZmFsc2UgdG8gZGlzYWJsZSBhbmFseXRpY3MuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRBbmFseXRpY3NDb25maWcoZ2xvYmFsOiBib29sZWFuLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBsZXZlbCA9IGdsb2JhbCA/ICdnbG9iYWwnIDogJ2xvY2FsJztcbiAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgZ2V0V29ya3NwYWNlKGxldmVsKTtcbiAgaWYgKCF3b3Jrc3BhY2UpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaW5kICR7bGV2ZWx9IHdvcmtzcGFjZS5gKTtcbiAgfVxuXG4gIGNvbnN0IGNsaSA9ICh3b3Jrc3BhY2UuZXh0ZW5zaW9uc1snY2xpJ10gPz89IHt9KTtcbiAgaWYgKCF3b3Jrc3BhY2UgfHwgIWpzb24uaXNKc29uT2JqZWN0KGNsaSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgY29uZmlnIGZvdW5kIGF0ICR7d29ya3NwYWNlLmZpbGVQYXRofS4gQ0xJIHNob3VsZCBiZSBhbiBvYmplY3QuYCk7XG4gIH1cblxuICBjbGkuYW5hbHl0aWNzID0gdmFsdWUgPT09IHRydWUgPyByYW5kb21VVUlEKCkgOiB2YWx1ZTtcbiAgYXdhaXQgd29ya3NwYWNlLnNhdmUoKTtcbn1cblxuLyoqXG4gKiBQcm9tcHQgdGhlIHVzZXIgZm9yIHVzYWdlIGdhdGhlcmluZyBwZXJtaXNzaW9uLlxuICogQHBhcmFtIGZvcmNlIFdoZXRoZXIgdG8gYXNrIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciBvciBub3QgdGhlIHVzZXIgaXMgdXNpbmcgYW4gaW50ZXJhY3RpdmUgc2hlbGwuXG4gKiBAcmV0dXJuIFdoZXRoZXIgb3Igbm90IHRoZSB1c2VyIHdhcyBzaG93biBhIHByb21wdC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByb21wdEFuYWx5dGljcyhcbiAgY29udGV4dDogQ29tbWFuZENvbnRleHQsXG4gIGdsb2JhbDogYm9vbGVhbixcbiAgZm9yY2UgPSBmYWxzZSxcbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zdCBsZXZlbCA9IGdsb2JhbCA/ICdnbG9iYWwnIDogJ2xvY2FsJztcbiAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgZ2V0V29ya3NwYWNlKGxldmVsKTtcbiAgaWYgKCF3b3Jrc3BhY2UpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaW5kIGEgJHtsZXZlbH0gd29ya3NwYWNlLiBBcmUgeW91IGluIGEgcHJvamVjdD9gKTtcbiAgfVxuXG4gIGlmIChmb3JjZSB8fCBpc1RUWSgpKSB7XG4gICAgY29uc3QgeyBwcm9tcHQgfSA9IGF3YWl0IGltcG9ydCgnaW5xdWlyZXInKTtcbiAgICBjb25zdCBhbnN3ZXJzID0gYXdhaXQgcHJvbXB0PHsgYW5hbHl0aWNzOiBib29sZWFuIH0+KFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ2NvbmZpcm0nLFxuICAgICAgICBuYW1lOiAnYW5hbHl0aWNzJyxcbiAgICAgICAgbWVzc2FnZTogdGFncy5zdHJpcEluZGVudHNgXG4gICAgICAgICAgIFdvdWxkIHlvdSBsaWtlIHRvIHNoYXJlIHBzZXVkb255bW91cyB1c2FnZSBkYXRhIGFib3V0IHRoaXMgcHJvamVjdCB3aXRoIHRoZSBBbmd1bGFyIFRlYW1cbiAgICAgICAgICAgYXQgR29vZ2xlIHVuZGVyIEdvb2dsZSdzIFByaXZhY3kgUG9saWN5IGF0IGh0dHBzOi8vcG9saWNpZXMuZ29vZ2xlLmNvbS9wcml2YWN5LiBGb3IgbW9yZVxuICAgICAgICAgICBkZXRhaWxzIGFuZCBob3cgdG8gY2hhbmdlIHRoaXMgc2V0dGluZywgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9hbmFseXRpY3MuXG5cbiAgICAgICAgIGAsXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgfSxcbiAgICBdKTtcblxuICAgIGF3YWl0IHNldEFuYWx5dGljc0NvbmZpZyhnbG9iYWwsIGFuc3dlcnMuYW5hbHl0aWNzKTtcblxuICAgIGlmIChhbnN3ZXJzLmFuYWx5dGljcykge1xuICAgICAgY29uc29sZS5sb2coJycpO1xuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgIHRhZ3Muc3RyaXBJbmRlbnRgXG4gICAgICAgICBUaGFuayB5b3UgZm9yIHNoYXJpbmcgcHNldWRvbnltb3VzIHVzYWdlIGRhdGEuIFNob3VsZCB5b3UgY2hhbmdlIHlvdXIgbWluZCwgdGhlIGZvbGxvd2luZ1xuICAgICAgICAgY29tbWFuZCB3aWxsIGRpc2FibGUgdGhpcyBmZWF0dXJlIGVudGlyZWx5OlxuXG4gICAgICAgICAgICAgJHtjb2xvcnMueWVsbG93KGBuZyBhbmFseXRpY3MgZGlzYWJsZSR7Z2xvYmFsID8gJyAtLWdsb2JhbCcgOiAnJ31gKX1cbiAgICAgICBgLFxuICAgICAgKTtcbiAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG5cbiAgICBwcm9jZXNzLnN0ZGVyci53cml0ZShhd2FpdCBnZXRBbmFseXRpY3NJbmZvU3RyaW5nKGNvbnRleHQpKTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEdldCB0aGUgYW5hbHl0aWNzIHVzZXIgaWQuXG4gKlxuICogQHJldHVybnNcbiAqIC0gYHN0cmluZ2AgdXNlciBpZC5cbiAqIC0gYGZhbHNlYCB3aGVuIGRpc2FibGVkLlxuICogLSBgdW5kZWZpbmVkYCB3aGVuIG5vdCBjb25maWd1cmVkLlxuICovXG5hc3luYyBmdW5jdGlvbiBnZXRBbmFseXRpY3NVc2VySWRGb3JMZXZlbChcbiAgbGV2ZWw6ICdsb2NhbCcgfCAnZ2xvYmFsJyxcbik6IFByb21pc2U8c3RyaW5nIHwgZmFsc2UgfCB1bmRlZmluZWQ+IHtcbiAgaWYgKGFuYWx5dGljc0Rpc2FibGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgZ2V0V29ya3NwYWNlKGxldmVsKTtcbiAgY29uc3QgYW5hbHl0aWNzQ29uZmlnOiBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsIHwgeyB1aWQ/OiBzdHJpbmcgfSB8IGJvb2xlYW4gPVxuICAgIHdvcmtzcGFjZT8uZ2V0Q2xpKCk/LlsnYW5hbHl0aWNzJ107XG5cbiAgaWYgKGFuYWx5dGljc0NvbmZpZyA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSBpZiAoYW5hbHl0aWNzQ29uZmlnID09PSB1bmRlZmluZWQgfHwgYW5hbHl0aWNzQ29uZmlnID09PSBudWxsKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICBpZiAodHlwZW9mIGFuYWx5dGljc0NvbmZpZyA9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGFuYWx5dGljc0NvbmZpZztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhbmFseXRpY3NDb25maWcgPT0gJ29iamVjdCcgJiYgdHlwZW9mIGFuYWx5dGljc0NvbmZpZ1sndWlkJ10gPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBhbmFseXRpY3NDb25maWdbJ3VpZCddO1xuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFuYWx5dGljc1VzZXJJZChcbiAgY29udGV4dDogQ29tbWFuZENvbnRleHQsXG4gIHNraXBQcm9tcHQgPSBmYWxzZSxcbik6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gIGNvbnN0IHsgd29ya3NwYWNlIH0gPSBjb250ZXh0O1xuICAvLyBHbG9iYWwgY29uZmlnIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBsb2NhbCBjb25maWcgb25seSBmb3IgdGhlIGRpc2FibGVkIGNoZWNrLlxuICAvLyBJRTpcbiAgLy8gZ2xvYmFsOiBkaXNhYmxlZCAmIGxvY2FsOiBlbmFibGVkID0gZGlzYWJsZWRcbiAgLy8gZ2xvYmFsOiBpZDogMTIzICYgbG9jYWw6IGlkOiA0NTYgPSA0NTZcblxuICAvLyBjaGVjayBnbG9iYWxcbiAgY29uc3QgZ2xvYmFsQ29uZmlnID0gYXdhaXQgZ2V0QW5hbHl0aWNzVXNlcklkRm9yTGV2ZWwoJ2dsb2JhbCcpO1xuICBpZiAoZ2xvYmFsQ29uZmlnID09PSBmYWxzZSkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBOb3QgZGlzYWJsZWQgZ2xvYmFsbHksIGNoZWNrIGxvY2FsbHkgb3Igbm90IHNldCBnbG9iYWxseSBhbmQgY29tbWFuZCBpcyBydW4gb3V0c2lkZSBvZiB3b3Jrc3BhY2UgZXhhbXBsZTogYG5nIG5ld2BcbiAgaWYgKHdvcmtzcGFjZSB8fCBnbG9iYWxDb25maWcgPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGxldmVsID0gd29ya3NwYWNlID8gJ2xvY2FsJyA6ICdnbG9iYWwnO1xuICAgIGxldCBsb2NhbE9yR2xvYmFsQ29uZmlnID0gYXdhaXQgZ2V0QW5hbHl0aWNzVXNlcklkRm9yTGV2ZWwobGV2ZWwpO1xuICAgIGlmIChsb2NhbE9yR2xvYmFsQ29uZmlnID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICghc2tpcFByb21wdCkge1xuICAgICAgICAvLyBjb25maWcgaXMgdW5zZXQsIHByb21wdCB1c2VyLlxuICAgICAgICAvLyBUT0RPOiBUaGlzIHNob3VsZCBob25vciB0aGUgYG5vLWludGVyYWN0aXZlYCBvcHRpb24uXG4gICAgICAgIC8vIEl0IGlzIGN1cnJlbnRseSBub3QgYW4gYG5nYCBvcHRpb24gYnV0IHJhdGhlciBvbmx5IGFuIG9wdGlvbiBmb3Igc3BlY2lmaWMgY29tbWFuZHMuXG4gICAgICAgIC8vIFRoZSBjb25jZXB0IG9mIGBuZ2Atd2lkZSBvcHRpb25zIGFyZSBuZWVkZWQgdG8gY2xlYW5seSBoYW5kbGUgdGhpcy5cbiAgICAgICAgYXdhaXQgcHJvbXB0QW5hbHl0aWNzKGNvbnRleHQsICF3b3Jrc3BhY2UgLyoqIGdsb2JhbCAqLyk7XG4gICAgICAgIGxvY2FsT3JHbG9iYWxDb25maWcgPSBhd2FpdCBnZXRBbmFseXRpY3NVc2VySWRGb3JMZXZlbChsZXZlbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxvY2FsT3JHbG9iYWxDb25maWcgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGxvY2FsT3JHbG9iYWxDb25maWcgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gbG9jYWxPckdsb2JhbENvbmZpZztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZ2xvYmFsQ29uZmlnO1xufVxuXG5mdW5jdGlvbiBhbmFseXRpY3NDb25maWdWYWx1ZVRvSHVtYW5Gb3JtYXQodmFsdWU6IHVua25vd24pOiAnZW5hYmxlZCcgfCAnZGlzYWJsZWQnIHwgJ25vdCBzZXQnIHtcbiAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xuICAgIHJldHVybiAnZGlzYWJsZWQnO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgfHwgdmFsdWUgPT09IHRydWUpIHtcbiAgICByZXR1cm4gJ2VuYWJsZWQnO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAnbm90IHNldCc7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFuYWx5dGljc0luZm9TdHJpbmcoY29udGV4dDogQ29tbWFuZENvbnRleHQpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBhbmFseXRpY3NJbnN0YW5jZSA9IGF3YWl0IGdldEFuYWx5dGljc1VzZXJJZChjb250ZXh0LCB0cnVlIC8qKiBza2lwUHJvbXB0ICovKTtcblxuICBjb25zdCB7IGdsb2JhbENvbmZpZ3VyYXRpb24sIHdvcmtzcGFjZTogbG9jYWxXb3Jrc3BhY2UgfSA9IGNvbnRleHQ7XG4gIGNvbnN0IGdsb2JhbFNldHRpbmcgPSBnbG9iYWxDb25maWd1cmF0aW9uPy5nZXRDbGkoKT8uWydhbmFseXRpY3MnXTtcbiAgY29uc3QgbG9jYWxTZXR0aW5nID0gbG9jYWxXb3Jrc3BhY2U/LmdldENsaSgpPy5bJ2FuYWx5dGljcyddO1xuXG4gIHJldHVybiAoXG4gICAgdGFncy5zdHJpcEluZGVudHNgXG4gICAgIEdsb2JhbCBzZXR0aW5nOiAke2FuYWx5dGljc0NvbmZpZ1ZhbHVlVG9IdW1hbkZvcm1hdChnbG9iYWxTZXR0aW5nKX1cbiAgICAgTG9jYWwgc2V0dGluZzogJHtcbiAgICAgICBsb2NhbFdvcmtzcGFjZVxuICAgICAgICAgPyBhbmFseXRpY3NDb25maWdWYWx1ZVRvSHVtYW5Gb3JtYXQobG9jYWxTZXR0aW5nKVxuICAgICAgICAgOiAnTm8gbG9jYWwgd29ya3NwYWNlIGNvbmZpZ3VyYXRpb24gZmlsZS4nXG4gICAgIH1cbiAgICAgRWZmZWN0aXZlIHN0YXR1czogJHthbmFseXRpY3NJbnN0YW5jZSA/ICdlbmFibGVkJyA6ICdkaXNhYmxlZCd9XG4gICBgICsgJ1xcbidcbiAgKTtcbn1cbiJdfQ==