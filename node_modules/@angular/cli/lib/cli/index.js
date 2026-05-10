"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = void 0;
const core_1 = require("@angular-devkit/core");
const util_1 = require("util");
const command_module_1 = require("../../src/command-builder/command-module");
const command_runner_1 = require("../../src/command-builder/command-runner");
const color_1 = require("../../src/utilities/color");
const environment_options_1 = require("../../src/utilities/environment-options");
const log_file_1 = require("../../src/utilities/log-file");
var version_1 = require("../../src/utilities/version");
Object.defineProperty(exports, "VERSION", { enumerable: true, get: function () { return version_1.VERSION; } });
const MIN_NODEJS_VERSION = [16, 13];
/* eslint-disable no-console */
async function default_1(options) {
    // This node version check ensures that the requirements of the project instance of the CLI are met
    const [major, minor] = process.versions.node.split('.').map((part) => Number(part));
    if (major < MIN_NODEJS_VERSION[0] ||
        (major === MIN_NODEJS_VERSION[0] && minor < MIN_NODEJS_VERSION[1])) {
        process.stderr.write(`Node.js version ${process.version} detected.\n` +
            `The Angular CLI requires a minimum of v${MIN_NODEJS_VERSION[0]}.${MIN_NODEJS_VERSION[1]}.\n\n` +
            'Please update your Node.js version or visit https://nodejs.org/ for additional instructions.\n');
        return 3;
    }
    const colorLevels = {
        info: (s) => s,
        debug: (s) => s,
        warn: (s) => color_1.colors.bold.yellow(s),
        error: (s) => color_1.colors.bold.red(s),
        fatal: (s) => color_1.colors.bold.red(s),
    };
    const logger = new core_1.logging.IndentLogger('cli-main-logger');
    const logInfo = console.log;
    const logError = console.error;
    const loggerFinished = logger.forEach((entry) => {
        if (!environment_options_1.ngDebug && entry.level === 'debug') {
            return;
        }
        const color = color_1.colors.enabled ? colorLevels[entry.level] : color_1.removeColor;
        const message = color(entry.message);
        switch (entry.level) {
            case 'warn':
            case 'fatal':
            case 'error':
                logError(message);
                break;
            default:
                logInfo(message);
                break;
        }
    });
    // Redirect console to logger
    console.info = console.log = function (...args) {
        logger.info((0, util_1.format)(...args));
    };
    console.warn = function (...args) {
        logger.warn((0, util_1.format)(...args));
    };
    console.error = function (...args) {
        logger.error((0, util_1.format)(...args));
    };
    try {
        return await (0, command_runner_1.runCommand)(options.cliArgs, logger);
    }
    catch (err) {
        if (err instanceof command_module_1.CommandModuleError) {
            logger.fatal(`Error: ${err.message}`);
        }
        else if (err instanceof Error) {
            try {
                const logPath = (0, log_file_1.writeErrorToLogFile)(err);
                logger.fatal(`An unhandled exception occurred: ${err.message}\n` +
                    `See "${logPath}" for further details.`);
            }
            catch (e) {
                logger.fatal(`An unhandled exception occurred: ${err.message}\n` +
                    `Fatal error writing debug log file: ${e}`);
                if (err.stack) {
                    logger.fatal(err.stack);
                }
            }
            return 127;
        }
        else if (typeof err === 'string') {
            logger.fatal(err);
        }
        else if (typeof err === 'number') {
            // Log nothing.
        }
        else {
            logger.fatal(`An unexpected error occurred: ${err}`);
        }
        return 1;
    }
    finally {
        logger.complete();
        await loggerFinished;
    }
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL2NsaS9saWIvY2xpL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUErQztBQUMvQywrQkFBOEI7QUFDOUIsNkVBQThFO0FBQzlFLDZFQUFzRTtBQUN0RSxxREFBZ0U7QUFDaEUsaUZBQWtFO0FBQ2xFLDJEQUFtRTtBQUVuRSx1REFBc0Q7QUFBN0Msa0dBQUEsT0FBTyxPQUFBO0FBRWhCLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFVLENBQUM7QUFFN0MsK0JBQStCO0FBQ2hCLEtBQUssb0JBQVcsT0FBOEI7SUFDM0QsbUdBQW1HO0lBQ25HLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDcEYsSUFDRSxLQUFLLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBQzdCLENBQUMsS0FBSyxLQUFLLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUNsRTtRQUNBLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNsQixtQkFBbUIsT0FBTyxDQUFDLE9BQU8sY0FBYztZQUM5QywwQ0FBMEMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLElBQUksa0JBQWtCLENBQUMsQ0FBQyxDQUFDLE9BQU87WUFDL0YsZ0dBQWdHLENBQ25HLENBQUM7UUFFRixPQUFPLENBQUMsQ0FBQztLQUNWO0lBRUQsTUFBTSxXQUFXLEdBQWdEO1FBQy9ELElBQUksRUFB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SyxDQUNWLG9DQUFvQyxHQUFHLENBQUMsT0FBTyxJQUFJO29CQUNqRCx1Q0FBdUMsQ0FBQyxFQUFFLENBQzdDLENBQUM7Z0JBQ0YsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFO29CQUNiLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUN6QjthQUNGO1lBRUQsT0FBTyxHQUFHLENBQUM7U0FDWjthQUFNLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO1lBQ2xDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDbkI7YUFBTSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtZQUNsQyxlQUFlO1NBQ2hCO2FBQU07WUFDTCxNQUFNLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQ3REO1FBRUQsT0FBTyxDQUFDLENBQUM7S0FDVjtZQUFTO1FBQ1IsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2xCLE1BQU0sY0FBYyxDQUFDO0tBQ3RCO0FBQ0gsQ0FBQztBQTlGRCw0QkE4RkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgbG9nZ2luZyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IGZvcm1hdCB9IGZyb20gJ3V0aWwnO1xuaW1wb3J0IHsgQ29tbWFuZE1vZHVsZUVycm9yIH0gZnJvbSAnLi4vLi4vc3JjL2NvbW1hbmQtYnVpbGRlci9jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBydW5Db21tYW5kIH0gZnJvbSAnLi4vLi4vc3JjL2NvbW1hbmQtYnVpbGRlci9jb21tYW5kLXJ1bm5lcic7XG5pbXBvcnQgeyBjb2xvcnMsIHJlbW92ZUNvbG9yIH0gZnJvbSAnLi4vLi4vc3JjL3V0aWxpdGllcy9jb2xvcic7XG5pbXBvcnQgeyBuZ0RlYnVnIH0gZnJvbSAnLi4vLi4vc3JjL3V0aWxpdGllcy9lbnZpcm9ubWVudC1vcHRpb25zJztcbmltcG9ydCB7IHdyaXRlRXJyb3JUb0xvZ0ZpbGUgfSBmcm9tICcuLi8uLi9zcmMvdXRpbGl0aWVzL2xvZy1maWxlJztcblxuZXhwb3J0IHsgVkVSU0lPTiB9IGZyb20gJy4uLy4uL3NyYy91dGlsaXRpZXMvdmVyc2lvbic7XG5cbmNvbnN0IE1JTl9OT0RFSlNfVkVSU0lPTiA9IFsxNiwgMTNdIGFzIGNvbnN0O1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiAob3B0aW9uczogeyBjbGlBcmdzOiBzdHJpbmdbXSB9KSB7XG4gIC8vIFRoaXMgbm9kZSB2ZXJzaW9uIGNoZWNrIGVuc3VyZXMgdGhhdCB0aGUgcmVxdWlyZW1lbnRzIG9mIHRoZSBwcm9qZWN0IGluc3RhbmNlIG9mIHRoZSBDTEkgYXJlIG1ldFxuICBjb25zdCBbbWFqb3IsIG1pbm9yXSA9IHByb2Nlc3MudmVyc2lvbnMubm9kZS5zcGxpdCgnLicpLm1hcCgocGFydCkgPT4gTnVtYmVyKHBhcnQpKTtcbiAgaWYgKFxuICAgIG1ham9yIDwgTUlOX05PREVKU19WRVJTSU9OWzBdIHx8XG4gICAgKG1ham9yID09PSBNSU5fTk9ERUpTX1ZFUlNJT05bMF0gJiYgbWlub3IgPCBNSU5fTk9ERUpTX1ZFUlNJT05bMV0pXG4gICkge1xuICAgIHByb2Nlc3Muc3RkZXJyLndyaXRlKFxuICAgICAgYE5vZGUuanMgdmVyc2lvbiAke3Byb2Nlc3MudmVyc2lvbn0gZGV0ZWN0ZWQuXFxuYCArXG4gICAgICAgIGBUaGUgQW5ndWxhciBDTEkgcmVxdWlyZXMgYSBtaW5pbXVtIG9mIHYke01JTl9OT0RFSlNfVkVSU0lPTlswXX0uJHtNSU5fTk9ERUpTX1ZFUlNJT05bMV19LlxcblxcbmAgK1xuICAgICAgICAnUGxlYXNlIHVwZGF0ZSB5b3VyIE5vZGUuanMgdmVyc2lvbiBvciB2aXNpdCBodHRwczovL25vZGVqcy5vcmcvIGZvciBhZGRpdGlvbmFsIGluc3RydWN0aW9ucy5cXG4nLFxuICAgICk7XG5cbiAgICByZXR1cm4gMztcbiAgfVxuXG4gIGNvbnN0IGNvbG9yTGV2ZWxzOiBSZWNvcmQ8c3RyaW5nLCAobWVzc2FnZTogc3RyaW5nKSA9PiBzdHJpbmc+ID0ge1xuICAgIGluZm86IChzKSA9PiBzLFxuICAgIGRlYnVnOiAocykgPT4gcyxcbiAgICB3YXJuOiAocykgPT4gY29sb3JzLmJvbGQueWVsbG93KHMpLFxuICAgIGVycm9yOiAocykgPT4gY29sb3JzLmJvbGQucmVkKHMpLFxuICAgIGZhdGFsOiAocykgPT4gY29sb3JzLmJvbGQucmVkKHMpLFxuICB9O1xuICBjb25zdCBsb2dnZXIgPSBuZXcgbG9nZ2luZy5JbmRlbnRMb2dnZXIoJ2NsaS1tYWluLWxvZ2dlcicpO1xuICBjb25zdCBsb2dJbmZvID0gY29uc29sZS5sb2c7XG4gIGNvbnN0IGxvZ0Vycm9yID0gY29uc29sZS5lcnJvcjtcblxuICBjb25zdCBsb2dnZXJGaW5pc2hlZCA9IGxvZ2dlci5mb3JFYWNoKChlbnRyeSkgPT4ge1xuICAgIGlmICghbmdEZWJ1ZyAmJiBlbnRyeS5sZXZlbCA9PT0gJ2RlYnVnJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbG9yID0gY29sb3JzLmVuYWJsZWQgPyBjb2xvckxldmVsc1tlbnRyeS5sZXZlbF0gOiByZW1vdmVDb2xvcjtcbiAgICBjb25zdCBtZXNzYWdlID0gY29sb3IoZW50cnkubWVzc2FnZSk7XG5cbiAgICBzd2l0Y2ggKGVudHJ5LmxldmVsKSB7XG4gICAgICBjYXNlICd3YXJuJzpcbiAgICAgIGNhc2UgJ2ZhdGFsJzpcbiAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgbG9nRXJyb3IobWVzc2FnZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbG9nSW5mbyhtZXNzYWdlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9KTtcblxuICAvLyBSZWRpcmVjdCBjb25zb2xlIHRvIGxvZ2dlclxuICBjb25zb2xlLmluZm8gPSBjb25zb2xlLmxvZyA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgbG9nZ2VyLmluZm8oZm9ybWF0KC4uLmFyZ3MpKTtcbiAgfTtcbiAgY29uc29sZS53YXJuID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBsb2dnZXIud2Fybihmb3JtYXQoLi4uYXJncykpO1xuICB9O1xuICBjb25zb2xlLmVycm9yID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBsb2dnZXIuZXJyb3IoZm9ybWF0KC4uLmFyZ3MpKTtcbiAgfTtcblxuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBydW5Db21tYW5kKG9wdGlvbnMuY2xpQXJncywgbG9nZ2VyKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIENvbW1hbmRNb2R1bGVFcnJvcikge1xuICAgICAgbG9nZ2VyLmZhdGFsKGBFcnJvcjogJHtlcnIubWVzc2FnZX1gKTtcbiAgICB9IGVsc2UgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBsb2dQYXRoID0gd3JpdGVFcnJvclRvTG9nRmlsZShlcnIpO1xuICAgICAgICBsb2dnZXIuZmF0YWwoXG4gICAgICAgICAgYEFuIHVuaGFuZGxlZCBleGNlcHRpb24gb2NjdXJyZWQ6ICR7ZXJyLm1lc3NhZ2V9XFxuYCArXG4gICAgICAgICAgICBgU2VlIFwiJHtsb2dQYXRofVwiIGZvciBmdXJ0aGVyIGRldGFpbHMuYCxcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgbG9nZ2VyLmZhdGFsKFxuICAgICAgICAgIGBBbiB1bmhhbmRsZWQgZXhjZXB0aW9uIG9jY3VycmVkOiAke2Vyci5tZXNzYWdlfVxcbmAgK1xuICAgICAgICAgICAgYEZhdGFsIGVycm9yIHdyaXRpbmcgZGVidWcgbG9nIGZpbGU6ICR7ZX1gLFxuICAgICAgICApO1xuICAgICAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICAgICAgbG9nZ2VyLmZhdGFsKGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIDEyNztcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlcnIgPT09ICdzdHJpbmcnKSB7XG4gICAgICBsb2dnZXIuZmF0YWwoZXJyKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlcnIgPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBMb2cgbm90aGluZy5cbiAgICB9IGVsc2Uge1xuICAgICAgbG9nZ2VyLmZhdGFsKGBBbiB1bmV4cGVjdGVkIGVycm9yIG9jY3VycmVkOiAke2Vycn1gKTtcbiAgICB9XG5cbiAgICByZXR1cm4gMTtcbiAgfSBmaW5hbGx5IHtcbiAgICBsb2dnZXIuY29tcGxldGUoKTtcbiAgICBhd2FpdCBsb2dnZXJGaW5pc2hlZDtcbiAgfVxufVxuIl19