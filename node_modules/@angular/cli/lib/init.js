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
require("symbol-observable");
// symbol polyfill must go first
const fs_1 = require("fs");
const module_1 = require("module");
const path = __importStar(require("path"));
const semver_1 = require("semver");
const color_1 = require("../src/utilities/color");
const config_1 = require("../src/utilities/config");
const environment_options_1 = require("../src/utilities/environment-options");
const version_1 = require("../src/utilities/version");
/**
 * Angular CLI versions prior to v14 may not exit correctly if not forcibly exited
 * via `process.exit()`. When bootstrapping, `forceExit` will be set to `true`
 * if the local CLI version is less than v14 to prevent the CLI from hanging on
 * exit in those cases.
 */
let forceExit = false;
(async () => {
    /**
     * Disable Browserslist old data warning as otherwise with every release we'd need to update this dependency
     * which is cumbersome considering we pin versions and the warning is not user actionable.
     * `Browserslist: caniuse-lite is outdated. Please run next command `npm update`
     * See: https://github.com/browserslist/browserslist/blob/819c4337456996d19db6ba953014579329e9c6e1/node.js#L324
     */
    process.env.BROWSERSLIST_IGNORE_OLD_DATA = '1';
    const rawCommandName = process.argv[2];
    /**
     * Disable CLI version mismatch checks and forces usage of the invoked CLI
     * instead of invoking the local installed version.
     *
     * When running `ng new` always favor the global version. As in some
     * cases orphan `node_modules` would cause the non global CLI to be used.
     * @see: https://github.com/angular/angular-cli/issues/14603
     */
    if (environment_options_1.disableVersionCheck || rawCommandName === 'new') {
        return (await Promise.resolve().then(() => __importStar(require('./cli')))).default;
    }
    let cli;
    try {
        // No error implies a projectLocalCli, which will load whatever
        // version of ng-cli you have installed in a local package.json
        const cwdRequire = (0, module_1.createRequire)(process.cwd() + '/');
        const projectLocalCli = cwdRequire.resolve('@angular/cli');
        cli = await Promise.resolve(`${projectLocalCli}`).then(s => __importStar(require(s)));
        const globalVersion = new semver_1.SemVer(version_1.VERSION.full);
        // Older versions might not have the VERSION export
        let localVersion = cli.VERSION?.full;
        if (!localVersion) {
            try {
                const localPackageJson = await fs_1.promises.readFile(path.join(path.dirname(projectLocalCli), '../../package.json'), 'utf-8');
                localVersion = JSON.parse(localPackageJson).version;
            }
            catch (error) {
                // eslint-disable-next-line  no-console
                console.error('Version mismatch check skipped. Unable to retrieve local version: ' + error);
            }
        }
        // Ensure older versions of the CLI fully exit
        const localMajorVersion = (0, semver_1.major)(localVersion);
        if (localMajorVersion > 0 && localMajorVersion < 14) {
            forceExit = true;
            // Versions prior to 14 didn't implement completion command.
            if (rawCommandName === 'completion') {
                return null;
            }
        }
        let isGlobalGreater = false;
        try {
            isGlobalGreater = localVersion > 0 && globalVersion.compare(localVersion) > 0;
        }
        catch (error) {
            // eslint-disable-next-line  no-console
            console.error('Version mismatch check skipped. Unable to compare local version: ' + error);
        }
        // When using the completion command, don't show the warning as otherwise this will break completion.
        if (isGlobalGreater &&
            rawCommandName !== '--get-yargs-completions' &&
            rawCommandName !== 'completion') {
            // If using the update command and the global version is greater, use the newer update command
            // This allows improvements in update to be used in older versions that do not have bootstrapping
            if (rawCommandName === 'update' &&
                cli.VERSION &&
                cli.VERSION.major - globalVersion.major <= 1) {
                cli = await Promise.resolve().then(() => __importStar(require('./cli')));
            }
            else if (await (0, config_1.isWarningEnabled)('versionMismatch')) {
                // Otherwise, use local version and warn if global is newer than local
                const warning = `Your global Angular CLI version (${globalVersion}) is greater than your local ` +
                    `version (${localVersion}). The local Angular CLI version is used.\n\n` +
                    'To disable this warning use "ng config -g cli.warnings.versionMismatch false".';
                // eslint-disable-next-line  no-console
                console.error(color_1.colors.yellow(warning));
            }
        }
    }
    catch {
        // If there is an error, resolve could not find the ng-cli
        // library from a package.json. Instead, include it from a relative
        // path to this script file (which is likely a globally installed
        // npm package). Most common cause for hitting this is `ng new`
        cli = await Promise.resolve().then(() => __importStar(require('./cli')));
    }
    if ('default' in cli) {
        cli = cli['default'];
    }
    return cli;
})()
    .then((cli) => cli?.({
    cliArgs: process.argv.slice(2),
}))
    .then((exitCode = 0) => {
    if (forceExit) {
        process.exit(exitCode);
    }
    process.exitCode = exitCode;
})
    .catch((err) => {
    // eslint-disable-next-line  no-console
    console.error('Unknown error: ' + err.toString());
    process.exit(127);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXIvY2xpL2xpYi9pbml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCw2QkFBMkI7QUFDM0IsZ0NBQWdDO0FBQ2hDLDJCQUFvQztBQUNwQyxtQ0FBdUM7QUFDdkMsMkNBQTZCO0FBQzdCLG1DQUF1QztBQUN2QyxrREFBZ0Q7QUFDaEQsb0RBQTJEO0FBQzNELDhFQUEyRTtBQUMzRSxzREFBbUQ7QUFFbkQ7Ozs7O0dBS0c7QUFDSCxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFFdEIsQ0FBQyxLQUFLLElBQW9ELEVBQUU7SUFDMUQ7Ozs7O09BS0c7SUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixHQUFHLEdBQUcsQ0FBQztJQUMvQyxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXZDOzs7Ozs7O09BT0c7SUFDSCxJQUFJLHlDQUFtQixJQUFJLGNBQWMsS0FBSyxLQUFLLEVBQUU7UUFDbkQsT0FBTyxDQUFDLHdEQUFhLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0tBQ3hDO0lBRUQsSUFBSSxHQUFHLENBQUM7SUFFUixJQUFJO1FBQ0YsK0RBQStEO1FBQy9ELCtEQUErRDtRQUMvRCxNQUFNLFVBQVUsR0FBRyxJQUFBLHNCQUFhLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sZUFBZSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDM0QsR0FBRyxHQUFHLHlCQUFhLGVBQWUsdUNBQUMsQ0FBQztRQUVwQyxNQUFNLGFBQWEsR0FBRyxJQUFJLGVBQU0sQ0FBQyxpQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFD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Q0FBQztLQUN4QjtJQUNELE9BQU8sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQzlCLENBQUMsQ0FBQztLQUNELEtBQUssQ0FBQyxDQUFDLEdBQVUsRUFBRSxFQUFFO0lBQ3BCLHVDQUF1QztJQUN2QyxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ2xELE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICdzeW1ib2wtb2JzZXJ2YWJsZSc7XG4vLyBzeW1ib2wgcG9seWZpbGwgbXVzdCBnbyBmaXJzdFxuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBjcmVhdGVSZXF1aXJlIH0gZnJvbSAnbW9kdWxlJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBTZW1WZXIsIG1ham9yIH0gZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IGNvbG9ycyB9IGZyb20gJy4uL3NyYy91dGlsaXRpZXMvY29sb3InO1xuaW1wb3J0IHsgaXNXYXJuaW5nRW5hYmxlZCB9IGZyb20gJy4uL3NyYy91dGlsaXRpZXMvY29uZmlnJztcbmltcG9ydCB7IGRpc2FibGVWZXJzaW9uQ2hlY2sgfSBmcm9tICcuLi9zcmMvdXRpbGl0aWVzL2Vudmlyb25tZW50LW9wdGlvbnMnO1xuaW1wb3J0IHsgVkVSU0lPTiB9IGZyb20gJy4uL3NyYy91dGlsaXRpZXMvdmVyc2lvbic7XG5cbi8qKlxuICogQW5ndWxhciBDTEkgdmVyc2lvbnMgcHJpb3IgdG8gdjE0IG1heSBub3QgZXhpdCBjb3JyZWN0bHkgaWYgbm90IGZvcmNpYmx5IGV4aXRlZFxuICogdmlhIGBwcm9jZXNzLmV4aXQoKWAuIFdoZW4gYm9vdHN0cmFwcGluZywgYGZvcmNlRXhpdGAgd2lsbCBiZSBzZXQgdG8gYHRydWVgXG4gKiBpZiB0aGUgbG9jYWwgQ0xJIHZlcnNpb24gaXMgbGVzcyB0aGFuIHYxNCB0byBwcmV2ZW50IHRoZSBDTEkgZnJvbSBoYW5naW5nIG9uXG4gKiBleGl0IGluIHRob3NlIGNhc2VzLlxuICovXG5sZXQgZm9yY2VFeGl0ID0gZmFsc2U7XG5cbihhc3luYyAoKTogUHJvbWlzZTx0eXBlb2YgaW1wb3J0KCcuL2NsaScpLmRlZmF1bHQgfCBudWxsPiA9PiB7XG4gIC8qKlxuICAgKiBEaXNhYmxlIEJyb3dzZXJzbGlzdCBvbGQgZGF0YSB3YXJuaW5nIGFzIG90aGVyd2lzZSB3aXRoIGV2ZXJ5IHJlbGVhc2Ugd2UnZCBuZWVkIHRvIHVwZGF0ZSB0aGlzIGRlcGVuZGVuY3lcbiAgICogd2hpY2ggaXMgY3VtYmVyc29tZSBjb25zaWRlcmluZyB3ZSBwaW4gdmVyc2lvbnMgYW5kIHRoZSB3YXJuaW5nIGlzIG5vdCB1c2VyIGFjdGlvbmFibGUuXG4gICAqIGBCcm93c2Vyc2xpc3Q6IGNhbml1c2UtbGl0ZSBpcyBvdXRkYXRlZC4gUGxlYXNlIHJ1biBuZXh0IGNvbW1hbmQgYG5wbSB1cGRhdGVgXG4gICAqIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Jyb3dzZXJzbGlzdC9icm93c2Vyc2xpc3QvYmxvYi84MTljNDMzNzQ1Njk5NmQxOWRiNmJhOTUzMDE0NTc5MzI5ZTljNmUxL25vZGUuanMjTDMyNFxuICAgKi9cbiAgcHJvY2Vzcy5lbnYuQlJPV1NFUlNMSVNUX0lHTk9SRV9PTERfREFUQSA9ICcxJztcbiAgY29uc3QgcmF3Q29tbWFuZE5hbWUgPSBwcm9jZXNzLmFyZ3ZbMl07XG5cbiAgLyoqXG4gICAqIERpc2FibGUgQ0xJIHZlcnNpb24gbWlzbWF0Y2ggY2hlY2tzIGFuZCBmb3JjZXMgdXNhZ2Ugb2YgdGhlIGludm9rZWQgQ0xJXG4gICAqIGluc3RlYWQgb2YgaW52b2tpbmcgdGhlIGxvY2FsIGluc3RhbGxlZCB2ZXJzaW9uLlxuICAgKlxuICAgKiBXaGVuIHJ1bm5pbmcgYG5nIG5ld2AgYWx3YXlzIGZhdm9yIHRoZSBnbG9iYWwgdmVyc2lvbi4gQXMgaW4gc29tZVxuICAgKiBjYXNlcyBvcnBoYW4gYG5vZGVfbW9kdWxlc2Agd291bGQgY2F1c2UgdGhlIG5vbiBnbG9iYWwgQ0xJIHRvIGJlIHVzZWQuXG4gICAqIEBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXItY2xpL2lzc3Vlcy8xNDYwM1xuICAgKi9cbiAgaWYgKGRpc2FibGVWZXJzaW9uQ2hlY2sgfHwgcmF3Q29tbWFuZE5hbWUgPT09ICduZXcnKSB7XG4gICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4vY2xpJykpLmRlZmF1bHQ7XG4gIH1cblxuICBsZXQgY2xpO1xuXG4gIHRyeSB7XG4gICAgLy8gTm8gZXJyb3IgaW1wbGllcyBhIHByb2plY3RMb2NhbENsaSwgd2hpY2ggd2lsbCBsb2FkIHdoYXRldmVyXG4gICAgLy8gdmVyc2lvbiBvZiBuZy1jbGkgeW91IGhhdmUgaW5zdGFsbGVkIGluIGEgbG9jYWwgcGFja2FnZS5qc29uXG4gICAgY29uc3QgY3dkUmVxdWlyZSA9IGNyZWF0ZVJlcXVpcmUocHJvY2Vzcy5jd2QoKSArICcvJyk7XG4gICAgY29uc3QgcHJvamVjdExvY2FsQ2xpID0gY3dkUmVxdWlyZS5yZXNvbHZlKCdAYW5ndWxhci9jbGknKTtcbiAgICBjbGkgPSBhd2FpdCBpbXBvcnQocHJvamVjdExvY2FsQ2xpKTtcblxuICAgIGNvbnN0IGdsb2JhbFZlcnNpb24gPSBuZXcgU2VtVmVyKFZFUlNJT04uZnVsbCk7XG5cbiAgICAvLyBPbGRlciB2ZXJzaW9ucyBtaWdodCBub3QgaGF2ZSB0aGUgVkVSU0lPTiBleHBvcnRcbiAgICBsZXQgbG9jYWxWZXJzaW9uID0gY2xpLlZFUlNJT04/LmZ1bGw7XG4gICAgaWYgKCFsb2NhbFZlcnNpb24pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGxvY2FsUGFja2FnZUpzb24gPSBhd2FpdCBmcy5yZWFkRmlsZShcbiAgICAgICAgICBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHByb2plY3RMb2NhbENsaSksICcuLi8uLi9wYWNrYWdlLmpzb24nKSxcbiAgICAgICAgICAndXRmLTgnLFxuICAgICAgICApO1xuICAgICAgICBsb2NhbFZlcnNpb24gPSAoSlNPTi5wYXJzZShsb2NhbFBhY2thZ2VKc29uKSBhcyB7IHZlcnNpb246IHN0cmluZyB9KS52ZXJzaW9uO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lICBuby1jb25zb2xlXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1ZlcnNpb24gbWlzbWF0Y2ggY2hlY2sgc2tpcHBlZC4gVW5hYmxlIHRvIHJldHJpZXZlIGxvY2FsIHZlcnNpb246ICcgKyBlcnJvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRW5zdXJlIG9sZGVyIHZlcnNpb25zIG9mIHRoZSBDTEkgZnVsbHkgZXhpdFxuICAgIGNvbnN0IGxvY2FsTWFqb3JWZXJzaW9uID0gbWFqb3IobG9jYWxWZXJzaW9uKTtcbiAgICBpZiAobG9jYWxNYWpvclZlcnNpb24gPiAwICYmIGxvY2FsTWFqb3JWZXJzaW9uIDwgMTQpIHtcbiAgICAgIGZvcmNlRXhpdCA9IHRydWU7XG5cbiAgICAgIC8vIFZlcnNpb25zIHByaW9yIHRvIDE0IGRpZG4ndCBpbXBsZW1lbnQgY29tcGxldGlvbiBjb21tYW5kLlxuICAgICAgaWYgKHJhd0NvbW1hbmROYW1lID09PSAnY29tcGxldGlvbicpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGlzR2xvYmFsR3JlYXRlciA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICBpc0dsb2JhbEdyZWF0ZXIgPSBsb2NhbFZlcnNpb24gPiAwICYmIGdsb2JhbFZlcnNpb24uY29tcGFyZShsb2NhbFZlcnNpb24pID4gMDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lICBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLmVycm9yKCdWZXJzaW9uIG1pc21hdGNoIGNoZWNrIHNraXBwZWQuIFVuYWJsZSB0byBjb21wYXJlIGxvY2FsIHZlcnNpb246ICcgKyBlcnJvcik7XG4gICAgfVxuXG4gICAgLy8gV2hlbiB1c2luZyB0aGUgY29tcGxldGlvbiBjb21tYW5kLCBkb24ndCBzaG93IHRoZSB3YXJuaW5nIGFzIG90aGVyd2lzZSB0aGlzIHdpbGwgYnJlYWsgY29tcGxldGlvbi5cbiAgICBpZiAoXG4gICAgICBpc0dsb2JhbEdyZWF0ZXIgJiZcbiAgICAgIHJhd0NvbW1hbmROYW1lICE9PSAnLS1nZXQteWFyZ3MtY29tcGxldGlvbnMnICYmXG4gICAgICByYXdDb21tYW5kTmFtZSAhPT0gJ2NvbXBsZXRpb24nXG4gICAgKSB7XG4gICAgICAvLyBJZiB1c2luZyB0aGUgdXBkYXRlIGNvbW1hbmQgYW5kIHRoZSBnbG9iYWwgdmVyc2lvbiBpcyBncmVhdGVyLCB1c2UgdGhlIG5ld2VyIHVwZGF0ZSBjb21tYW5kXG4gICAgICAvLyBUaGlzIGFsbG93cyBpbXByb3ZlbWVudHMgaW4gdXBkYXRlIHRvIGJlIHVzZWQgaW4gb2xkZXIgdmVyc2lvbnMgdGhhdCBkbyBub3QgaGF2ZSBib290c3RyYXBwaW5nXG4gICAgICBpZiAoXG4gICAgICAgIHJhd0NvbW1hbmROYW1lID09PSAndXBkYXRlJyAmJlxuICAgICAgICBjbGkuVkVSU0lPTiAmJlxuICAgICAgICBjbGkuVkVSU0lPTi5tYWpvciAtIGdsb2JhbFZlcnNpb24ubWFqb3IgPD0gMVxuICAgICAgKSB7XG4gICAgICAgIGNsaSA9IGF3YWl0IGltcG9ydCgnLi9jbGknKTtcbiAgICAgIH0gZWxzZSBpZiAoYXdhaXQgaXNXYXJuaW5nRW5hYmxlZCgndmVyc2lvbk1pc21hdGNoJykpIHtcbiAgICAgICAgLy8gT3RoZXJ3aXNlLCB1c2UgbG9jYWwgdmVyc2lvbiBhbmQgd2FybiBpZiBnbG9iYWwgaXMgbmV3ZXIgdGhhbiBsb2NhbFxuICAgICAgICBjb25zdCB3YXJuaW5nID1cbiAgICAgICAgICBgWW91ciBnbG9iYWwgQW5ndWxhciBDTEkgdmVyc2lvbiAoJHtnbG9iYWxWZXJzaW9ufSkgaXMgZ3JlYXRlciB0aGFuIHlvdXIgbG9jYWwgYCArXG4gICAgICAgICAgYHZlcnNpb24gKCR7bG9jYWxWZXJzaW9ufSkuIFRoZSBsb2NhbCBBbmd1bGFyIENMSSB2ZXJzaW9uIGlzIHVzZWQuXFxuXFxuYCArXG4gICAgICAgICAgJ1RvIGRpc2FibGUgdGhpcyB3YXJuaW5nIHVzZSBcIm5nIGNvbmZpZyAtZyBjbGkud2FybmluZ3MudmVyc2lvbk1pc21hdGNoIGZhbHNlXCIuJztcblxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgIG5vLWNvbnNvbGVcbiAgICAgICAgY29uc29sZS5lcnJvcihjb2xvcnMueWVsbG93KHdhcm5pbmcpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIElmIHRoZXJlIGlzIGFuIGVycm9yLCByZXNvbHZlIGNvdWxkIG5vdCBmaW5kIHRoZSBuZy1jbGlcbiAgICAvLyBsaWJyYXJ5IGZyb20gYSBwYWNrYWdlLmpzb24uIEluc3RlYWQsIGluY2x1ZGUgaXQgZnJvbSBhIHJlbGF0aXZlXG4gICAgLy8gcGF0aCB0byB0aGlzIHNjcmlwdCBmaWxlICh3aGljaCBpcyBsaWtlbHkgYSBnbG9iYWxseSBpbnN0YWxsZWRcbiAgICAvLyBucG0gcGFja2FnZSkuIE1vc3QgY29tbW9uIGNhdXNlIGZvciBoaXR0aW5nIHRoaXMgaXMgYG5nIG5ld2BcbiAgICBjbGkgPSBhd2FpdCBpbXBvcnQoJy4vY2xpJyk7XG4gIH1cblxuICBpZiAoJ2RlZmF1bHQnIGluIGNsaSkge1xuICAgIGNsaSA9IGNsaVsnZGVmYXVsdCddO1xuICB9XG5cbiAgcmV0dXJuIGNsaTtcbn0pKClcbiAgLnRoZW4oKGNsaSkgPT5cbiAgICBjbGk/Lih7XG4gICAgICBjbGlBcmdzOiBwcm9jZXNzLmFyZ3Yuc2xpY2UoMiksXG4gICAgfSksXG4gIClcbiAgLnRoZW4oKGV4aXRDb2RlID0gMCkgPT4ge1xuICAgIGlmIChmb3JjZUV4aXQpIHtcbiAgICAgIHByb2Nlc3MuZXhpdChleGl0Q29kZSk7XG4gICAgfVxuICAgIHByb2Nlc3MuZXhpdENvZGUgPSBleGl0Q29kZTtcbiAgfSlcbiAgLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lICBuby1jb25zb2xlXG4gICAgY29uc29sZS5lcnJvcignVW5rbm93biBlcnJvcjogJyArIGVyci50b1N0cmluZygpKTtcbiAgICBwcm9jZXNzLmV4aXQoMTI3KTtcbiAgfSk7XG4iXX0=