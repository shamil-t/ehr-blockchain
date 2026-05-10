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
exports.hasGlobalCliInstall = exports.initializeAutocomplete = exports.considerSettingUpAutocompletion = void 0;
const core_1 = require("@angular-devkit/core");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const process_1 = require("process");
const color_1 = require("../utilities/color");
const config_1 = require("../utilities/config");
const environment_options_1 = require("../utilities/environment-options");
const tty_1 = require("../utilities/tty");
const error_1 = require("./error");
/**
 * Checks if it is appropriate to prompt the user to setup autocompletion. If not, does nothing. If
 * so prompts and sets up autocompletion for the user. Returns an exit code if the program should
 * terminate, otherwise returns `undefined`.
 * @returns an exit code if the program should terminate, undefined otherwise.
 */
async function considerSettingUpAutocompletion(command, logger) {
    // Check if we should prompt the user to setup autocompletion.
    const completionConfig = await getCompletionConfig();
    if (!(await shouldPromptForAutocompletionSetup(command, completionConfig))) {
        return undefined; // Already set up or prompted previously, nothing to do.
    }
    // Prompt the user and record their response.
    const shouldSetupAutocompletion = await promptForAutocompletion();
    if (!shouldSetupAutocompletion) {
        // User rejected the prompt and doesn't want autocompletion.
        logger.info(`
Ok, you won't be prompted again. Should you change your mind, the following command will set up autocompletion for you:

    ${color_1.colors.yellow(`ng completion`)}
    `.trim());
        // Save configuration to remember that the user was prompted and avoid prompting again.
        await setCompletionConfig({ ...completionConfig, prompted: true });
        return undefined;
    }
    // User accepted the prompt, set up autocompletion.
    let rcFile;
    try {
        rcFile = await initializeAutocomplete();
    }
    catch (err) {
        (0, error_1.assertIsError)(err);
        // Failed to set up autocompeletion, log the error and abort.
        logger.error(err.message);
        return 1;
    }
    // Notify the user autocompletion was set up successfully.
    logger.info(`
Appended \`source <(ng completion script)\` to \`${rcFile}\`. Restart your terminal or run the following to autocomplete \`ng\` commands:

    ${color_1.colors.yellow(`source <(ng completion script)`)}
    `.trim());
    if (!(await hasGlobalCliInstall())) {
        logger.warn('Setup completed successfully, but there does not seem to be a global install of the' +
            ' Angular CLI. For autocompletion to work, the CLI will need to be on your `$PATH`, which' +
            ' is typically done with the `-g` flag in `npm install -g @angular/cli`.' +
            '\n\n' +
            'For more information, see https://angular.io/cli/completion#global-install');
    }
    // Save configuration to remember that the user was prompted.
    await setCompletionConfig({ ...completionConfig, prompted: true });
    return undefined;
}
exports.considerSettingUpAutocompletion = considerSettingUpAutocompletion;
async function getCompletionConfig() {
    const wksp = await (0, config_1.getWorkspace)('global');
    return wksp?.getCli()?.['completion'];
}
async function setCompletionConfig(config) {
    var _a;
    const wksp = await (0, config_1.getWorkspace)('global');
    if (!wksp) {
        throw new Error(`Could not find global workspace`);
    }
    (_a = wksp.extensions)['cli'] ?? (_a['cli'] = {});
    const cli = wksp.extensions['cli'];
    if (!core_1.json.isJsonObject(cli)) {
        throw new Error(`Invalid config found at ${wksp.filePath}. \`extensions.cli\` should be an object.`);
    }
    cli.completion = config;
    await wksp.save();
}
async function shouldPromptForAutocompletionSetup(command, config) {
    // Force whether or not to prompt for autocomplete to give an easy path for e2e testing to skip.
    if (environment_options_1.forceAutocomplete !== undefined) {
        return environment_options_1.forceAutocomplete;
    }
    // Don't prompt on `ng update` or `ng completion`.
    if (command === 'update' || command === 'completion') {
        return false;
    }
    // Non-interactive and continuous integration systems don't care about autocompletion.
    if (!(0, tty_1.isTTY)()) {
        return false;
    }
    // Skip prompt if the user has already been prompted.
    if (config?.prompted) {
        return false;
    }
    // `$HOME` variable is necessary to find RC files to modify.
    const home = process_1.env['HOME'];
    if (!home) {
        return false;
    }
    // Get possible RC files for the current shell.
    const shell = process_1.env['SHELL'];
    if (!shell) {
        return false;
    }
    const rcFiles = getShellRunCommandCandidates(shell, home);
    if (!rcFiles) {
        return false; // Unknown shell.
    }
    // Don't prompt if the user is missing a global CLI install. Autocompletion won't work after setup
    // anyway and could be annoying for users running one-off commands via `npx` or using `npm start`.
    if ((await hasGlobalCliInstall()) === false) {
        return false;
    }
    // Check each RC file if they already use `ng completion script` in any capacity and don't prompt.
    for (const rcFile of rcFiles) {
        const contents = await fs_1.promises.readFile(rcFile, 'utf-8').catch(() => undefined);
        if (contents?.includes('ng completion script')) {
            return false;
        }
    }
    return true;
}
async function promptForAutocompletion() {
    // Dynamically load `inquirer` so users don't have to pay the cost of parsing and executing it for
    // the 99% of builds that *don't* prompt for autocompletion.
    const { prompt } = await Promise.resolve().then(() => __importStar(require('inquirer')));
    const { autocomplete } = await prompt([
        {
            name: 'autocomplete',
            type: 'confirm',
            message: `
Would you like to enable autocompletion? This will set up your terminal so pressing TAB while typing
Angular CLI commands will show possible options and autocomplete arguments. (Enabling autocompletion
will modify configuration files in your home directory.)
      `
                .split('\n')
                .join(' ')
                .trim(),
            default: true,
        },
    ]);
    return autocomplete;
}
/**
 * Sets up autocompletion for the user's terminal. This attempts to find the configuration file for
 * the current shell (`.bashrc`, `.zshrc`, etc.) and append a command which enables autocompletion
 * for the Angular CLI. Supports only Bash and Zsh. Returns whether or not it was successful.
 * @return The full path of the configuration file modified.
 */
async function initializeAutocomplete() {
    // Get the currently active `$SHELL` and `$HOME` environment variables.
    const shell = process_1.env['SHELL'];
    if (!shell) {
        throw new Error('`$SHELL` environment variable not set. Angular CLI autocompletion only supports Bash or' +
            " Zsh. If you're on Windows, Cmd and Powershell don't support command autocompletion," +
            ' but Git Bash or Windows Subsystem for Linux should work, so please try again in one of' +
            ' those environments.');
    }
    const home = process_1.env['HOME'];
    if (!home) {
        throw new Error('`$HOME` environment variable not set. Setting up autocompletion modifies configuration files' +
            ' in the home directory and must be set.');
    }
    // Get all the files we can add `ng completion` to which apply to the user's `$SHELL`.
    const runCommandCandidates = getShellRunCommandCandidates(shell, home);
    if (!runCommandCandidates) {
        throw new Error(`Unknown \`$SHELL\` environment variable value (${shell}). Angular CLI autocompletion only supports Bash or Zsh.`);
    }
    // Get the first file that already exists or fallback to a new file of the first candidate.
    const candidates = await Promise.allSettled(runCommandCandidates.map((rcFile) => fs_1.promises.access(rcFile).then(() => rcFile)));
    const rcFile = candidates.find((result) => result.status === 'fulfilled')?.value ?? runCommandCandidates[0];
    // Append Angular autocompletion setup to RC file.
    try {
        await fs_1.promises.appendFile(rcFile, '\n\n# Load Angular CLI autocompletion.\nsource <(ng completion script)\n');
    }
    catch (err) {
        (0, error_1.assertIsError)(err);
        throw new Error(`Failed to append autocompletion setup to \`${rcFile}\`:\n${err.message}`);
    }
    return rcFile;
}
exports.initializeAutocomplete = initializeAutocomplete;
/** Returns an ordered list of possible candidates of RC files used by the given shell. */
function getShellRunCommandCandidates(shell, home) {
    if (shell.toLowerCase().includes('bash')) {
        return ['.bashrc', '.bash_profile', '.profile'].map((file) => path.join(home, file));
    }
    else if (shell.toLowerCase().includes('zsh')) {
        return ['.zshrc', '.zsh_profile', '.profile'].map((file) => path.join(home, file));
    }
    else {
        return undefined;
    }
}
/**
 * Returns whether the user has a global CLI install.
 * Execution from `npx` is *not* considered a global CLI install.
 *
 * This does *not* mean the current execution is from a global CLI install, only that a global
 * install exists on the system.
 */
function hasGlobalCliInstall() {
    // List all binaries with the `ng` name on the user's `$PATH`.
    return new Promise((resolve) => {
        (0, child_process_1.execFile)('which', ['-a', 'ng'], (error, stdout) => {
            if (error) {
                // No instances of `ng` on the user's `$PATH`
                // `which` returns exit code 2 if an invalid option is specified and `-a` doesn't appear to be
                // supported on all systems. Other exit codes mean unknown errors occurred. Can't tell whether
                // CLI is globally installed, so treat this as inconclusive.
                // `which` was killed by a signal and did not exit gracefully. Maybe it hung or something else
                // went very wrong, so treat this as inconclusive.
                resolve(false);
                return;
            }
            // Successfully listed all `ng` binaries on the `$PATH`. Look for at least one line which is a
            // global install. We can't easily identify global installs, but local installs are typically
            // placed in `node_modules/.bin` by NPM / Yarn. `npx` also currently caches files at
            // `~/.npm/_npx/*/node_modules/.bin/`, so the same logic applies.
            const lines = stdout.split('\n').filter((line) => line !== '');
            const hasGlobalInstall = lines.some((line) => {
                // A binary is a local install if it is a direct child of a `node_modules/.bin/` directory.
                const parent = path.parse(path.parse(line).dir);
                const grandparent = path.parse(parent.dir);
                const localInstall = grandparent.base === 'node_modules' && parent.base === '.bin';
                return !localInstall;
            });
            return resolve(hasGlobalInstall);
        });
    });
}
exports.hasGlobalCliInstall = hasGlobalCliInstall;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxldGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXIvY2xpL3NyYy91dGlsaXRpZXMvY29tcGxldGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUFxRDtBQUNyRCxpREFBeUM7QUFDekMsMkJBQW9DO0FBQ3BDLDJDQUE2QjtBQUM3QixxQ0FBOEI7QUFDOUIsOENBQTRDO0FBQzVDLGdEQUFtRDtBQUNuRCwwRUFBcUU7QUFDckUsMENBQXlDO0FBQ3pDLG1DQUF3QztBQVd4Qzs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSwrQkFBK0IsQ0FDbkQsT0FBZSxFQUNmLE1BQXNCO0lBRXRCLDhEQUE4RDtJQUM5RCxNQUFNLGdCQUFnQixHQUFHLE1BQU0sbUJBQW1CLEVBQUUsQ0FBQztJQUNyRCxJQUFJLENBQUMsQ0FBQyxNQUFNLGtDQUFrQyxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUU7UUFDMUUsT0FBTyxTQUFTLENBQUMsQ0FBQyx3REFBd0Q7S0FDM0U7SUFFRCw2Q0FBNkM7SUFDN0MsTUFBTSx5QkFBeUIsR0FBRyxNQUFNLHVCQUF1QixFQUFFLENBQUM7SUFDbEUsSUFBSSxDQUFDLHlCQUF5QixFQUFFO1FBQzlCLDREQUE0RDtRQUM1RCxNQUFNLENBQUMsSUFBSSxDQUNUOzs7TUFHQSxjQUFNLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQztLQUMvQixDQUFDLElBQUksRUFBRSxDQUNQLENBQUM7UUFFRix1RkFBdUY7UUFDdkYsTUFBTSxtQkFBbUIsQ0FBQyxFQUFFLEdBQUcsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFbkUsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFFRCxtREFBbUQ7SUFDbkQsSUFBSSxNQUFjLENBQUM7SUFD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QUU1RCw4RkFBOEY7Z0JBQzlGLGtEQUFrRDtnQkFDbEQsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUVmLE9BQU87YUFDUjtZQUVELDhGQUE4RjtZQUM5Riw2RkFBNkY7WUFDN0Ysb0ZBQW9GO1lBQ3BGLGlFQUFpRTtZQUNqRSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUMzQywyRkFBMkY7Z0JBQzNGLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzNDLE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQyxJQUFJLEtBQUssY0FBYyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDO2dCQUVuRixPQUFPLENBQUMsWUFBWSxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNuQyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQW5DRCxrREFtQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsganNvbiwgbG9nZ2luZyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IGV4ZWNGaWxlIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBlbnYgfSBmcm9tICdwcm9jZXNzJztcbmltcG9ydCB7IGNvbG9ycyB9IGZyb20gJy4uL3V0aWxpdGllcy9jb2xvcic7XG5pbXBvcnQgeyBnZXRXb3Jrc3BhY2UgfSBmcm9tICcuLi91dGlsaXRpZXMvY29uZmlnJztcbmltcG9ydCB7IGZvcmNlQXV0b2NvbXBsZXRlIH0gZnJvbSAnLi4vdXRpbGl0aWVzL2Vudmlyb25tZW50LW9wdGlvbnMnO1xuaW1wb3J0IHsgaXNUVFkgfSBmcm9tICcuLi91dGlsaXRpZXMvdHR5JztcbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcblxuLyoqIEludGVyZmFjZSBmb3IgdGhlIGF1dG9jb21wbGV0aW9uIGNvbmZpZ3VyYXRpb24gc3RvcmVkIGluIHRoZSBnbG9iYWwgd29ya3NwYWNlLiAqL1xuaW50ZXJmYWNlIENvbXBsZXRpb25Db25maWcge1xuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIHVzZXIgaGFzIGJlZW4gcHJvbXB0ZWQgdG8gc2V0IHVwIGF1dG9jb21wbGV0aW9uLiBJZiBgdHJ1ZWAsIHNob3VsZCAqbm90KlxuICAgKiBwcm9tcHQgdGhlbSBhZ2Fpbi5cbiAgICovXG4gIHByb21wdGVkPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgaXQgaXMgYXBwcm9wcmlhdGUgdG8gcHJvbXB0IHRoZSB1c2VyIHRvIHNldHVwIGF1dG9jb21wbGV0aW9uLiBJZiBub3QsIGRvZXMgbm90aGluZy4gSWZcbiAqIHNvIHByb21wdHMgYW5kIHNldHMgdXAgYXV0b2NvbXBsZXRpb24gZm9yIHRoZSB1c2VyLiBSZXR1cm5zIGFuIGV4aXQgY29kZSBpZiB0aGUgcHJvZ3JhbSBzaG91bGRcbiAqIHRlcm1pbmF0ZSwgb3RoZXJ3aXNlIHJldHVybnMgYHVuZGVmaW5lZGAuXG4gKiBAcmV0dXJucyBhbiBleGl0IGNvZGUgaWYgdGhlIHByb2dyYW0gc2hvdWxkIHRlcm1pbmF0ZSwgdW5kZWZpbmVkIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbnNpZGVyU2V0dGluZ1VwQXV0b2NvbXBsZXRpb24oXG4gIGNvbW1hbmQ6IHN0cmluZyxcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlcixcbik6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiB7XG4gIC8vIENoZWNrIGlmIHdlIHNob3VsZCBwcm9tcHQgdGhlIHVzZXIgdG8gc2V0dXAgYXV0b2NvbXBsZXRpb24uXG4gIGNvbnN0IGNvbXBsZXRpb25Db25maWcgPSBhd2FpdCBnZXRDb21wbGV0aW9uQ29uZmlnKCk7XG4gIGlmICghKGF3YWl0IHNob3VsZFByb21wdEZvckF1dG9jb21wbGV0aW9uU2V0dXAoY29tbWFuZCwgY29tcGxldGlvbkNvbmZpZykpKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDsgLy8gQWxyZWFkeSBzZXQgdXAgb3IgcHJvbXB0ZWQgcHJldmlvdXNseSwgbm90aGluZyB0byBkby5cbiAgfVxuXG4gIC8vIFByb21wdCB0aGUgdXNlciBhbmQgcmVjb3JkIHRoZWlyIHJlc3BvbnNlLlxuICBjb25zdCBzaG91bGRTZXR1cEF1dG9jb21wbGV0aW9uID0gYXdhaXQgcHJvbXB0Rm9yQXV0b2NvbXBsZXRpb24oKTtcbiAgaWYgKCFzaG91bGRTZXR1cEF1dG9jb21wbGV0aW9uKSB7XG4gICAgLy8gVXNlciByZWplY3RlZCB0aGUgcHJvbXB0IGFuZCBkb2Vzbid0IHdhbnQgYXV0b2NvbXBsZXRpb24uXG4gICAgbG9nZ2VyLmluZm8oXG4gICAgICBgXG5PaywgeW91IHdvbid0IGJlIHByb21wdGVkIGFnYWluLiBTaG91bGQgeW91IGNoYW5nZSB5b3VyIG1pbmQsIHRoZSBmb2xsb3dpbmcgY29tbWFuZCB3aWxsIHNldCB1cCBhdXRvY29tcGxldGlvbiBmb3IgeW91OlxuXG4gICAgJHtjb2xvcnMueWVsbG93KGBuZyBjb21wbGV0aW9uYCl9XG4gICAgYC50cmltKCksXG4gICAgKTtcblxuICAgIC8vIFNhdmUgY29uZmlndXJhdGlvbiB0byByZW1lbWJlciB0aGF0IHRoZSB1c2VyIHdhcyBwcm9tcHRlZCBhbmQgYXZvaWQgcHJvbXB0aW5nIGFnYWluLlxuICAgIGF3YWl0IHNldENvbXBsZXRpb25Db25maWcoeyAuLi5jb21wbGV0aW9uQ29uZmlnLCBwcm9tcHRlZDogdHJ1ZSB9KTtcblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBVc2VyIGFjY2VwdGVkIHRoZSBwcm9tcHQsIHNldCB1cCBhdXRvY29tcGxldGlvbi5cbiAgbGV0IHJjRmlsZTogc3RyaW5nO1xuICB0cnkge1xuICAgIHJjRmlsZSA9IGF3YWl0IGluaXRpYWxpemVBdXRvY29tcGxldGUoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXNzZXJ0SXNFcnJvcihlcnIpO1xuICAgIC8vIEZhaWxlZCB0byBzZXQgdXAgYXV0b2NvbXBlbGV0aW9uLCBsb2cgdGhlIGVycm9yIGFuZCBhYm9ydC5cbiAgICBsb2dnZXIuZXJyb3IoZXJyLm1lc3NhZ2UpO1xuXG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvLyBOb3RpZnkgdGhlIHVzZXIgYXV0b2NvbXBsZXRpb24gd2FzIHNldCB1cCBzdWNjZXNzZnVsbHkuXG4gIGxvZ2dlci5pbmZvKFxuICAgIGBcbkFwcGVuZGVkIFxcYHNvdXJjZSA8KG5nIGNvbXBsZXRpb24gc2NyaXB0KVxcYCB0byBcXGAke3JjRmlsZX1cXGAuIFJlc3RhcnQgeW91ciB0ZXJtaW5hbCBvciBydW4gdGhlIGZvbGxvd2luZyB0byBhdXRvY29tcGxldGUgXFxgbmdcXGAgY29tbWFuZHM6XG5cbiAgICAke2NvbG9ycy55ZWxsb3coYHNvdXJjZSA8KG5nIGNvbXBsZXRpb24gc2NyaXB0KWApfVxuICAgIGAudHJpbSgpLFxuICApO1xuXG4gIGlmICghKGF3YWl0IGhhc0dsb2JhbENsaUluc3RhbGwoKSkpIHtcbiAgICBsb2dnZXIud2FybihcbiAgICAgICdTZXR1cCBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5LCBidXQgdGhlcmUgZG9lcyBub3Qgc2VlbSB0byBiZSBhIGdsb2JhbCBpbnN0YWxsIG9mIHRoZScgK1xuICAgICAgICAnIEFuZ3VsYXIgQ0xJLiBGb3IgYXV0b2NvbXBsZXRpb24gdG8gd29yaywgdGhlIENMSSB3aWxsIG5lZWQgdG8gYmUgb24geW91ciBgJFBBVEhgLCB3aGljaCcgK1xuICAgICAgICAnIGlzIHR5cGljYWxseSBkb25lIHdpdGggdGhlIGAtZ2AgZmxhZyBpbiBgbnBtIGluc3RhbGwgLWcgQGFuZ3VsYXIvY2xpYC4nICtcbiAgICAgICAgJ1xcblxcbicgK1xuICAgICAgICAnRm9yIG1vcmUgaW5mb3JtYXRpb24sIHNlZSBodHRwczovL2FuZ3VsYXIuaW8vY2xpL2NvbXBsZXRpb24jZ2xvYmFsLWluc3RhbGwnLFxuICAgICk7XG4gIH1cblxuICAvLyBTYXZlIGNvbmZpZ3VyYXRpb24gdG8gcmVtZW1iZXIgdGhhdCB0aGUgdXNlciB3YXMgcHJvbXB0ZWQuXG4gIGF3YWl0IHNldENvbXBsZXRpb25Db25maWcoeyAuLi5jb21wbGV0aW9uQ29uZmlnLCBwcm9tcHRlZDogdHJ1ZSB9KTtcblxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRDb21wbGV0aW9uQ29uZmlnKCk6IFByb21pc2U8Q29tcGxldGlvbkNvbmZpZyB8IHVuZGVmaW5lZD4ge1xuICBjb25zdCB3a3NwID0gYXdhaXQgZ2V0V29ya3NwYWNlKCdnbG9iYWwnKTtcblxuICByZXR1cm4gd2tzcD8uZ2V0Q2xpKCk/LlsnY29tcGxldGlvbiddO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzZXRDb21wbGV0aW9uQ29uZmlnKGNvbmZpZzogQ29tcGxldGlvbkNvbmZpZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB3a3NwID0gYXdhaXQgZ2V0V29ya3NwYWNlKCdnbG9iYWwnKTtcbiAgaWYgKCF3a3NwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZmluZCBnbG9iYWwgd29ya3NwYWNlYCk7XG4gIH1cblxuICB3a3NwLmV4dGVuc2lvbnNbJ2NsaSddID8/PSB7fTtcbiAgY29uc3QgY2xpID0gd2tzcC5leHRlbnNpb25zWydjbGknXTtcbiAgaWYgKCFqc29uLmlzSnNvbk9iamVjdChjbGkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEludmFsaWQgY29uZmlnIGZvdW5kIGF0ICR7d2tzcC5maWxlUGF0aH0uIFxcYGV4dGVuc2lvbnMuY2xpXFxgIHNob3VsZCBiZSBhbiBvYmplY3QuYCxcbiAgICApO1xuICB9XG4gIGNsaS5jb21wbGV0aW9uID0gY29uZmlnIGFzIGpzb24uSnNvbk9iamVjdDtcbiAgYXdhaXQgd2tzcC5zYXZlKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNob3VsZFByb21wdEZvckF1dG9jb21wbGV0aW9uU2V0dXAoXG4gIGNvbW1hbmQ6IHN0cmluZyxcbiAgY29uZmlnPzogQ29tcGxldGlvbkNvbmZpZyxcbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAvLyBGb3JjZSB3aGV0aGVyIG9yIG5vdCB0byBwcm9tcHQgZm9yIGF1dG9jb21wbGV0ZSB0byBnaXZlIGFuIGVhc3kgcGF0aCBmb3IgZTJlIHRlc3RpbmcgdG8gc2tpcC5cbiAgaWYgKGZvcmNlQXV0b2NvbXBsZXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm9yY2VBdXRvY29tcGxldGU7XG4gIH1cblxuICAvLyBEb24ndCBwcm9tcHQgb24gYG5nIHVwZGF0ZWAgb3IgYG5nIGNvbXBsZXRpb25gLlxuICBpZiAoY29tbWFuZCA9PT0gJ3VwZGF0ZScgfHwgY29tbWFuZCA9PT0gJ2NvbXBsZXRpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gTm9uLWludGVyYWN0aXZlIGFuZCBjb250aW51b3VzIGludGVncmF0aW9uIHN5c3RlbXMgZG9uJ3QgY2FyZSBhYm91dCBhdXRvY29tcGxldGlvbi5cbiAgaWYgKCFpc1RUWSgpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gU2tpcCBwcm9tcHQgaWYgdGhlIHVzZXIgaGFzIGFscmVhZHkgYmVlbiBwcm9tcHRlZC5cbiAgaWYgKGNvbmZpZz8ucHJvbXB0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBgJEhPTUVgIHZhcmlhYmxlIGlzIG5lY2Vzc2FyeSB0byBmaW5kIFJDIGZpbGVzIHRvIG1vZGlmeS5cbiAgY29uc3QgaG9tZSA9IGVudlsnSE9NRSddO1xuICBpZiAoIWhvbWUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBHZXQgcG9zc2libGUgUkMgZmlsZXMgZm9yIHRoZSBjdXJyZW50IHNoZWxsLlxuICBjb25zdCBzaGVsbCA9IGVudlsnU0hFTEwnXTtcbiAgaWYgKCFzaGVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCByY0ZpbGVzID0gZ2V0U2hlbGxSdW5Db21tYW5kQ2FuZGlkYXRlcyhzaGVsbCwgaG9tZSk7XG4gIGlmICghcmNGaWxlcykge1xuICAgIHJldHVybiBmYWxzZTsgLy8gVW5rbm93biBzaGVsbC5cbiAgfVxuXG4gIC8vIERvbid0IHByb21wdCBpZiB0aGUgdXNlciBpcyBtaXNzaW5nIGEgZ2xvYmFsIENMSSBpbnN0YWxsLiBBdXRvY29tcGxldGlvbiB3b24ndCB3b3JrIGFmdGVyIHNldHVwXG4gIC8vIGFueXdheSBhbmQgY291bGQgYmUgYW5ub3lpbmcgZm9yIHVzZXJzIHJ1bm5pbmcgb25lLW9mZiBjb21tYW5kcyB2aWEgYG5weGAgb3IgdXNpbmcgYG5wbSBzdGFydGAuXG4gIGlmICgoYXdhaXQgaGFzR2xvYmFsQ2xpSW5zdGFsbCgpKSA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBDaGVjayBlYWNoIFJDIGZpbGUgaWYgdGhleSBhbHJlYWR5IHVzZSBgbmcgY29tcGxldGlvbiBzY3JpcHRgIGluIGFueSBjYXBhY2l0eSBhbmQgZG9uJ3QgcHJvbXB0LlxuICBmb3IgKGNvbnN0IHJjRmlsZSBvZiByY0ZpbGVzKSB7XG4gICAgY29uc3QgY29udGVudHMgPSBhd2FpdCBmcy5yZWFkRmlsZShyY0ZpbGUsICd1dGYtOCcpLmNhdGNoKCgpID0+IHVuZGVmaW5lZCk7XG4gICAgaWYgKGNvbnRlbnRzPy5pbmNsdWRlcygnbmcgY29tcGxldGlvbiBzY3JpcHQnKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5hc3luYyBmdW5jdGlvbiBwcm9tcHRGb3JBdXRvY29tcGxldGlvbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgLy8gRHluYW1pY2FsbHkgbG9hZCBgaW5xdWlyZXJgIHNvIHVzZXJzIGRvbid0IGhhdmUgdG8gcGF5IHRoZSBjb3N0IG9mIHBhcnNpbmcgYW5kIGV4ZWN1dGluZyBpdCBmb3JcbiAgLy8gdGhlIDk5JSBvZiBidWlsZHMgdGhhdCAqZG9uJ3QqIHByb21wdCBmb3IgYXV0b2NvbXBsZXRpb24uXG4gIGNvbnN0IHsgcHJvbXB0IH0gPSBhd2FpdCBpbXBvcnQoJ2lucXVpcmVyJyk7XG4gIGNvbnN0IHsgYXV0b2NvbXBsZXRlIH0gPSBhd2FpdCBwcm9tcHQ8eyBhdXRvY29tcGxldGU6IGJvb2xlYW4gfT4oW1xuICAgIHtcbiAgICAgIG5hbWU6ICdhdXRvY29tcGxldGUnLFxuICAgICAgdHlwZTogJ2NvbmZpcm0nLFxuICAgICAgbWVzc2FnZTogYFxuV291bGQgeW91IGxpa2UgdG8gZW5hYmxlIGF1dG9jb21wbGV0aW9uPyBUaGlzIHdpbGwgc2V0IHVwIHlvdXIgdGVybWluYWwgc28gcHJlc3NpbmcgVEFCIHdoaWxlIHR5cGluZ1xuQW5ndWxhciBDTEkgY29tbWFuZHMgd2lsbCBzaG93IHBvc3NpYmxlIG9wdGlvbnMgYW5kIGF1dG9jb21wbGV0ZSBhcmd1bWVudHMuIChFbmFibGluZyBhdXRvY29tcGxldGlvblxud2lsbCBtb2RpZnkgY29uZmlndXJhdGlvbiBmaWxlcyBpbiB5b3VyIGhvbWUgZGlyZWN0b3J5LilcbiAgICAgIGBcbiAgICAgICAgLnNwbGl0KCdcXG4nKVxuICAgICAgICAuam9pbignICcpXG4gICAgICAgIC50cmltKCksXG4gICAgICBkZWZhdWx0OiB0cnVlLFxuICAgIH0sXG4gIF0pO1xuXG4gIHJldHVybiBhdXRvY29tcGxldGU7XG59XG5cbi8qKlxuICogU2V0cyB1cCBhdXRvY29tcGxldGlvbiBmb3IgdGhlIHVzZXIncyB0ZXJtaW5hbC4gVGhpcyBhdHRlbXB0cyB0byBmaW5kIHRoZSBjb25maWd1cmF0aW9uIGZpbGUgZm9yXG4gKiB0aGUgY3VycmVudCBzaGVsbCAoYC5iYXNocmNgLCBgLnpzaHJjYCwgZXRjLikgYW5kIGFwcGVuZCBhIGNvbW1hbmQgd2hpY2ggZW5hYmxlcyBhdXRvY29tcGxldGlvblxuICogZm9yIHRoZSBBbmd1bGFyIENMSS4gU3VwcG9ydHMgb25seSBCYXNoIGFuZCBac2guIFJldHVybnMgd2hldGhlciBvciBub3QgaXQgd2FzIHN1Y2Nlc3NmdWwuXG4gKiBAcmV0dXJuIFRoZSBmdWxsIHBhdGggb2YgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZSBtb2RpZmllZC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemVBdXRvY29tcGxldGUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgLy8gR2V0IHRoZSBjdXJyZW50bHkgYWN0aXZlIGAkU0hFTExgIGFuZCBgJEhPTUVgIGVudmlyb25tZW50IHZhcmlhYmxlcy5cbiAgY29uc3Qgc2hlbGwgPSBlbnZbJ1NIRUxMJ107XG4gIGlmICghc2hlbGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnYCRTSEVMTGAgZW52aXJvbm1lbnQgdmFyaWFibGUgbm90IHNldC4gQW5ndWxhciBDTEkgYXV0b2NvbXBsZXRpb24gb25seSBzdXBwb3J0cyBCYXNoIG9yJyArXG4gICAgICAgIFwiIFpzaC4gSWYgeW91J3JlIG9uIFdpbmRvd3MsIENtZCBhbmQgUG93ZXJzaGVsbCBkb24ndCBzdXBwb3J0IGNvbW1hbmQgYXV0b2NvbXBsZXRpb24sXCIgK1xuICAgICAgICAnIGJ1dCBHaXQgQmFzaCBvciBXaW5kb3dzIFN1YnN5c3RlbSBmb3IgTGludXggc2hvdWxkIHdvcmssIHNvIHBsZWFzZSB0cnkgYWdhaW4gaW4gb25lIG9mJyArXG4gICAgICAgICcgdGhvc2UgZW52aXJvbm1lbnRzLicsXG4gICAgKTtcbiAgfVxuICBjb25zdCBob21lID0gZW52WydIT01FJ107XG4gIGlmICghaG9tZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdgJEhPTUVgIGVudmlyb25tZW50IHZhcmlhYmxlIG5vdCBzZXQuIFNldHRpbmcgdXAgYXV0b2NvbXBsZXRpb24gbW9kaWZpZXMgY29uZmlndXJhdGlvbiBmaWxlcycgK1xuICAgICAgICAnIGluIHRoZSBob21lIGRpcmVjdG9yeSBhbmQgbXVzdCBiZSBzZXQuJyxcbiAgICApO1xuICB9XG5cbiAgLy8gR2V0IGFsbCB0aGUgZmlsZXMgd2UgY2FuIGFkZCBgbmcgY29tcGxldGlvbmAgdG8gd2hpY2ggYXBwbHkgdG8gdGhlIHVzZXIncyBgJFNIRUxMYC5cbiAgY29uc3QgcnVuQ29tbWFuZENhbmRpZGF0ZXMgPSBnZXRTaGVsbFJ1bkNvbW1hbmRDYW5kaWRhdGVzKHNoZWxsLCBob21lKTtcbiAgaWYgKCFydW5Db21tYW5kQ2FuZGlkYXRlcykge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBVbmtub3duIFxcYCRTSEVMTFxcYCBlbnZpcm9ubWVudCB2YXJpYWJsZSB2YWx1ZSAoJHtzaGVsbH0pLiBBbmd1bGFyIENMSSBhdXRvY29tcGxldGlvbiBvbmx5IHN1cHBvcnRzIEJhc2ggb3IgWnNoLmAsXG4gICAgKTtcbiAgfVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZmlsZSB0aGF0IGFscmVhZHkgZXhpc3RzIG9yIGZhbGxiYWNrIHRvIGEgbmV3IGZpbGUgb2YgdGhlIGZpcnN0IGNhbmRpZGF0ZS5cbiAgY29uc3QgY2FuZGlkYXRlcyA9IGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChcbiAgICBydW5Db21tYW5kQ2FuZGlkYXRlcy5tYXAoKHJjRmlsZSkgPT4gZnMuYWNjZXNzKHJjRmlsZSkudGhlbigoKSA9PiByY0ZpbGUpKSxcbiAgKTtcbiAgY29uc3QgcmNGaWxlID1cbiAgICBjYW5kaWRhdGVzLmZpbmQoXG4gICAgICAocmVzdWx0KTogcmVzdWx0IGlzIFByb21pc2VGdWxmaWxsZWRSZXN1bHQ8c3RyaW5nPiA9PiByZXN1bHQuc3RhdHVzID09PSAnZnVsZmlsbGVkJyxcbiAgICApPy52YWx1ZSA/PyBydW5Db21tYW5kQ2FuZGlkYXRlc1swXTtcblxuICAvLyBBcHBlbmQgQW5ndWxhciBhdXRvY29tcGxldGlvbiBzZXR1cCB0byBSQyBmaWxlLlxuICB0cnkge1xuICAgIGF3YWl0IGZzLmFwcGVuZEZpbGUoXG4gICAgICByY0ZpbGUsXG4gICAgICAnXFxuXFxuIyBMb2FkIEFuZ3VsYXIgQ0xJIGF1dG9jb21wbGV0aW9uLlxcbnNvdXJjZSA8KG5nIGNvbXBsZXRpb24gc2NyaXB0KVxcbicsXG4gICAgKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXNzZXJ0SXNFcnJvcihlcnIpO1xuICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGFwcGVuZCBhdXRvY29tcGxldGlvbiBzZXR1cCB0byBcXGAke3JjRmlsZX1cXGA6XFxuJHtlcnIubWVzc2FnZX1gKTtcbiAgfVxuXG4gIHJldHVybiByY0ZpbGU7XG59XG5cbi8qKiBSZXR1cm5zIGFuIG9yZGVyZWQgbGlzdCBvZiBwb3NzaWJsZSBjYW5kaWRhdGVzIG9mIFJDIGZpbGVzIHVzZWQgYnkgdGhlIGdpdmVuIHNoZWxsLiAqL1xuZnVuY3Rpb24gZ2V0U2hlbGxSdW5Db21tYW5kQ2FuZGlkYXRlcyhzaGVsbDogc3RyaW5nLCBob21lOiBzdHJpbmcpOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCB7XG4gIGlmIChzaGVsbC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdiYXNoJykpIHtcbiAgICByZXR1cm4gWycuYmFzaHJjJywgJy5iYXNoX3Byb2ZpbGUnLCAnLnByb2ZpbGUnXS5tYXAoKGZpbGUpID0+IHBhdGguam9pbihob21lLCBmaWxlKSk7XG4gIH0gZWxzZSBpZiAoc2hlbGwudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnenNoJykpIHtcbiAgICByZXR1cm4gWycuenNocmMnLCAnLnpzaF9wcm9maWxlJywgJy5wcm9maWxlJ10ubWFwKChmaWxlKSA9PiBwYXRoLmpvaW4oaG9tZSwgZmlsZSkpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHVzZXIgaGFzIGEgZ2xvYmFsIENMSSBpbnN0YWxsLlxuICogRXhlY3V0aW9uIGZyb20gYG5weGAgaXMgKm5vdCogY29uc2lkZXJlZCBhIGdsb2JhbCBDTEkgaW5zdGFsbC5cbiAqXG4gKiBUaGlzIGRvZXMgKm5vdCogbWVhbiB0aGUgY3VycmVudCBleGVjdXRpb24gaXMgZnJvbSBhIGdsb2JhbCBDTEkgaW5zdGFsbCwgb25seSB0aGF0IGEgZ2xvYmFsXG4gKiBpbnN0YWxsIGV4aXN0cyBvbiB0aGUgc3lzdGVtLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzR2xvYmFsQ2xpSW5zdGFsbCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgLy8gTGlzdCBhbGwgYmluYXJpZXMgd2l0aCB0aGUgYG5nYCBuYW1lIG9uIHRoZSB1c2VyJ3MgYCRQQVRIYC5cbiAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KChyZXNvbHZlKSA9PiB7XG4gICAgZXhlY0ZpbGUoJ3doaWNoJywgWyctYScsICduZyddLCAoZXJyb3IsIHN0ZG91dCkgPT4ge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIC8vIE5vIGluc3RhbmNlcyBvZiBgbmdgIG9uIHRoZSB1c2VyJ3MgYCRQQVRIYFxuXG4gICAgICAgIC8vIGB3aGljaGAgcmV0dXJucyBleGl0IGNvZGUgMiBpZiBhbiBpbnZhbGlkIG9wdGlvbiBpcyBzcGVjaWZpZWQgYW5kIGAtYWAgZG9lc24ndCBhcHBlYXIgdG8gYmVcbiAgICAgICAgLy8gc3VwcG9ydGVkIG9uIGFsbCBzeXN0ZW1zLiBPdGhlciBleGl0IGNvZGVzIG1lYW4gdW5rbm93biBlcnJvcnMgb2NjdXJyZWQuIENhbid0IHRlbGwgd2hldGhlclxuICAgICAgICAvLyBDTEkgaXMgZ2xvYmFsbHkgaW5zdGFsbGVkLCBzbyB0cmVhdCB0aGlzIGFzIGluY29uY2x1c2l2ZS5cblxuICAgICAgICAvLyBgd2hpY2hgIHdhcyBraWxsZWQgYnkgYSBzaWduYWwgYW5kIGRpZCBub3QgZXhpdCBncmFjZWZ1bGx5LiBNYXliZSBpdCBodW5nIG9yIHNvbWV0aGluZyBlbHNlXG4gICAgICAgIC8vIHdlbnQgdmVyeSB3cm9uZywgc28gdHJlYXQgdGhpcyBhcyBpbmNvbmNsdXNpdmUuXG4gICAgICAgIHJlc29sdmUoZmFsc2UpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gU3VjY2Vzc2Z1bGx5IGxpc3RlZCBhbGwgYG5nYCBiaW5hcmllcyBvbiB0aGUgYCRQQVRIYC4gTG9vayBmb3IgYXQgbGVhc3Qgb25lIGxpbmUgd2hpY2ggaXMgYVxuICAgICAgLy8gZ2xvYmFsIGluc3RhbGwuIFdlIGNhbid0IGVhc2lseSBpZGVudGlmeSBnbG9iYWwgaW5zdGFsbHMsIGJ1dCBsb2NhbCBpbnN0YWxscyBhcmUgdHlwaWNhbGx5XG4gICAgICAvLyBwbGFjZWQgaW4gYG5vZGVfbW9kdWxlcy8uYmluYCBieSBOUE0gLyBZYXJuLiBgbnB4YCBhbHNvIGN1cnJlbnRseSBjYWNoZXMgZmlsZXMgYXRcbiAgICAgIC8vIGB+Ly5ucG0vX25weC8qL25vZGVfbW9kdWxlcy8uYmluL2AsIHNvIHRoZSBzYW1lIGxvZ2ljIGFwcGxpZXMuXG4gICAgICBjb25zdCBsaW5lcyA9IHN0ZG91dC5zcGxpdCgnXFxuJykuZmlsdGVyKChsaW5lKSA9PiBsaW5lICE9PSAnJyk7XG4gICAgICBjb25zdCBoYXNHbG9iYWxJbnN0YWxsID0gbGluZXMuc29tZSgobGluZSkgPT4ge1xuICAgICAgICAvLyBBIGJpbmFyeSBpcyBhIGxvY2FsIGluc3RhbGwgaWYgaXQgaXMgYSBkaXJlY3QgY2hpbGQgb2YgYSBgbm9kZV9tb2R1bGVzLy5iaW4vYCBkaXJlY3RvcnkuXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHBhdGgucGFyc2UocGF0aC5wYXJzZShsaW5lKS5kaXIpO1xuICAgICAgICBjb25zdCBncmFuZHBhcmVudCA9IHBhdGgucGFyc2UocGFyZW50LmRpcik7XG4gICAgICAgIGNvbnN0IGxvY2FsSW5zdGFsbCA9IGdyYW5kcGFyZW50LmJhc2UgPT09ICdub2RlX21vZHVsZXMnICYmIHBhcmVudC5iYXNlID09PSAnLmJpbic7XG5cbiAgICAgICAgcmV0dXJuICFsb2NhbEluc3RhbGw7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHJlc29sdmUoaGFzR2xvYmFsSW5zdGFsbCk7XG4gICAgfSk7XG4gIH0pO1xufVxuIl19