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
exports.UnknownPackageManagerException = void 0;
const core_1 = require("@angular-devkit/core");
const child_process_1 = require("child_process");
const ora_1 = __importDefault(require("ora"));
const path = __importStar(require("path"));
const rxjs_1 = require("rxjs");
const src_1 = require("../../src");
const packageManagers = {
    'npm': {
        commands: {
            installAll: 'install',
            installPackage: 'install',
        },
    },
    'cnpm': {
        commands: {
            installAll: 'install',
            installPackage: 'install',
        },
    },
    'yarn': {
        commands: {
            installPackage: 'add',
        },
    },
    'pnpm': {
        commands: {
            installAll: 'install',
            installPackage: 'install',
        },
    },
};
class UnknownPackageManagerException extends core_1.BaseException {
    constructor(name) {
        super(`Unknown package manager "${name}".`);
    }
}
exports.UnknownPackageManagerException = UnknownPackageManagerException;
function default_1(factoryOptions = {}) {
    const packageManagerName = factoryOptions.packageManager || 'npm';
    const packageManagerProfile = packageManagers[packageManagerName];
    if (!packageManagerProfile) {
        throw new UnknownPackageManagerException(packageManagerName);
    }
    const rootDirectory = factoryOptions.rootDirectory || process.cwd();
    return (options = { command: 'install' }) => {
        let taskPackageManagerProfile = packageManagerProfile;
        let taskPackageManagerName = packageManagerName;
        if (factoryOptions.allowPackageManagerOverride && options.packageManager) {
            taskPackageManagerProfile = packageManagers[options.packageManager];
            if (!taskPackageManagerProfile) {
                throw new UnknownPackageManagerException(options.packageManager);
            }
            taskPackageManagerName = options.packageManager;
        }
        const bufferedOutput = [];
        const spawnOptions = {
            shell: true,
            cwd: path.join(rootDirectory, options.workingDirectory || ''),
        };
        if (options.hideOutput) {
            spawnOptions.stdio = options.quiet ? ['ignore', 'ignore', 'pipe'] : 'pipe';
        }
        else {
            spawnOptions.stdio = options.quiet ? ['ignore', 'ignore', 'inherit'] : 'inherit';
        }
        const args = [];
        if (options.packageName) {
            if (options.command === 'install') {
                args.push(taskPackageManagerProfile.commands.installPackage);
            }
            args.push(options.packageName);
        }
        else if (options.command === 'install' && taskPackageManagerProfile.commands.installAll) {
            args.push(taskPackageManagerProfile.commands.installAll);
        }
        if (!options.allowScripts) {
            // Yarn requires special handling since Yarn 2+ no longer has the `--ignore-scripts` flag
            if (taskPackageManagerName === 'yarn') {
                spawnOptions.env = {
                    ...process.env,
                    // Supported with yarn 1
                    'npm_config_ignore_scripts': 'true',
                    // Supported with yarn 2+
                    'YARN_ENABLE_SCRIPTS': 'false',
                };
            }
            else {
                args.push('--ignore-scripts');
            }
        }
        if (factoryOptions.registry) {
            args.push(`--registry="${factoryOptions.registry}"`);
        }
        if (factoryOptions.force) {
            args.push('--force');
        }
        return new rxjs_1.Observable((obs) => {
            const spinner = (0, ora_1.default)({
                text: `Installing packages (${taskPackageManagerName})...`,
                // Workaround for https://github.com/sindresorhus/ora/issues/136.
                discardStdin: process.platform != 'win32',
            }).start();
            const childProcess = (0, child_process_1.spawn)(taskPackageManagerName, args, spawnOptions).on('close', (code) => {
                if (code === 0) {
                    spinner.succeed('Packages installed successfully.');
                    spinner.stop();
                    obs.next();
                    obs.complete();
                }
                else {
                    if (options.hideOutput) {
                        bufferedOutput.forEach(({ stream, data }) => stream.write(data));
                    }
                    spinner.fail('Package install failed, see above.');
                    obs.error(new src_1.UnsuccessfulWorkflowExecution());
                }
            });
            if (options.hideOutput) {
                childProcess.stdout?.on('data', (data) => bufferedOutput.push({ stream: process.stdout, data: data }));
                childProcess.stderr?.on('data', (data) => bufferedOutput.push({ stream: process.stderr, data: data }));
            }
        });
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL3BhY2thZ2UtbWFuYWdlci9leGVjdXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUFxRDtBQUNyRCxpREFBb0Q7QUFDcEQsOENBQXNCO0FBQ3RCLDJDQUE2QjtBQUM3QiwrQkFBa0M7QUFDbEMsbUNBQXdFO0FBVXhFLE1BQU0sZUFBZSxHQUE4QztJQUNqRSxLQUFLLEVBQUU7UUFDTCxRQUFRLEVBQUU7WUFDUixVQUFVLEVBQUUsU0FBUztZQUNyQixjQUFjLEVBQUUsU0FBUztTQUMxQjtLQUNGO0lBQ0QsTUFBTSxFQUFFO1FBQ04sUUFBUSxFQUFFO1lBQ1IsVUFBVSxFQUFFLFNBQVM7WUFDckIsY0FBYyxFQUFFLFNBQVM7U0FDMUI7S0FDRjtJQUNELE1BQU0sRUFBRTtRQUNOLFFBQVEsRUFBRTtZQUNSLGNBQWMsRUFBRSxLQUFLO1NBQ3RCO0tBQ0Y7SUFDRCxNQUFNLEVBQUU7UUFDTixRQUFRLEVBQUU7WUFDUixVQUFVLEVBQUUsU0FBUztZQUNyQixjQUFjLEVBQUUsU0FBUztTQUMxQjtLQUNGO0NBQ0YsQ0FBQztBQUVGLE1BQWEsOEJBQStCLFNBQVEsb0JBQWE7SUFDL0QsWUFBWSxJQUFZO1FBQ3RCLEtBQUssQ0FBQyw0QkFBNEIsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDO0NBQ0Y7QUFKRCx3RUFJQztBQUVELG1CQUNFLGlCQUFnRCxFQUFFO0lBRWxELE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFDLGNBQWMsSUFBSSxLQUFLLENBQUM7SUFDbEUsTUFBTSxxQkFBcUIsR0FBRyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNsRSxJQUFJLENBQUMscUJB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LElBQUksRUFBRSxDQUFDLENBQzVELENBQUM7Z0JBQ0YsWUFBWSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FDL0MsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUM1RCxDQUFDO2FBQ0g7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQztBQUNKLENBQUM7QUFwR0QsNEJBb0dDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24gfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBTcGF3bk9wdGlvbnMsIHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgb3JhIGZyb20gJ29yYSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgVGFza0V4ZWN1dG9yLCBVbnN1Y2Nlc3NmdWxXb3JrZmxvd0V4ZWN1dGlvbiB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQgeyBOb2RlUGFja2FnZVRhc2tGYWN0b3J5T3B0aW9ucywgTm9kZVBhY2thZ2VUYXNrT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cbmludGVyZmFjZSBQYWNrYWdlTWFuYWdlclByb2ZpbGUge1xuICBjb21tYW5kczoge1xuICAgIGluc3RhbGxBbGw/OiBzdHJpbmc7XG4gICAgaW5zdGFsbFBhY2thZ2U6IHN0cmluZztcbiAgfTtcbn1cblxuY29uc3QgcGFja2FnZU1hbmFnZXJzOiB7IFtuYW1lOiBzdHJpbmddOiBQYWNrYWdlTWFuYWdlclByb2ZpbGUgfSA9IHtcbiAgJ25wbSc6IHtcbiAgICBjb21tYW5kczoge1xuICAgICAgaW5zdGFsbEFsbDogJ2luc3RhbGwnLFxuICAgICAgaW5zdGFsbFBhY2thZ2U6ICdpbnN0YWxsJyxcbiAgICB9LFxuICB9LFxuICAnY25wbSc6IHtcbiAgICBjb21tYW5kczoge1xuICAgICAgaW5zdGFsbEFsbDogJ2luc3RhbGwnLFxuICAgICAgaW5zdGFsbFBhY2thZ2U6ICdpbnN0YWxsJyxcbiAgICB9LFxuICB9LFxuICAneWFybic6IHtcbiAgICBjb21tYW5kczoge1xuICAgICAgaW5zdGFsbFBhY2thZ2U6ICdhZGQnLFxuICAgIH0sXG4gIH0sXG4gICdwbnBtJzoge1xuICAgIGNvbW1hbmRzOiB7XG4gICAgICBpbnN0YWxsQWxsOiAnaW5zdGFsbCcsXG4gICAgICBpbnN0YWxsUGFja2FnZTogJ2luc3RhbGwnLFxuICAgIH0sXG4gIH0sXG59O1xuXG5leHBvcnQgY2xhc3MgVW5rbm93blBhY2thZ2VNYW5hZ2VyRXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKGBVbmtub3duIHBhY2thZ2UgbWFuYWdlciBcIiR7bmFtZX1cIi5gKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoXG4gIGZhY3RvcnlPcHRpb25zOiBOb2RlUGFja2FnZVRhc2tGYWN0b3J5T3B0aW9ucyA9IHt9LFxuKTogVGFza0V4ZWN1dG9yPE5vZGVQYWNrYWdlVGFza09wdGlvbnM+IHtcbiAgY29uc3QgcGFja2FnZU1hbmFnZXJOYW1lID0gZmFjdG9yeU9wdGlvbnMucGFja2FnZU1hbmFnZXIgfHwgJ25wbSc7XG4gIGNvbnN0IHBhY2thZ2VNYW5hZ2VyUHJvZmlsZSA9IHBhY2thZ2VNYW5hZ2Vyc1twYWNrYWdlTWFuYWdlck5hbWVdO1xuICBpZiAoIXBhY2thZ2VNYW5hZ2VyUHJvZmlsZSkge1xuICAgIHRocm93IG5ldyBVbmtub3duUGFja2FnZU1hbmFnZXJFeGNlcHRpb24ocGFja2FnZU1hbmFnZXJOYW1lKTtcbiAgfVxuXG4gIGNvbnN0IHJvb3REaXJlY3RvcnkgPSBmYWN0b3J5T3B0aW9ucy5yb290RGlyZWN0b3J5IHx8IHByb2Nlc3MuY3dkKCk7XG5cbiAgcmV0dXJuIChvcHRpb25zOiBOb2RlUGFja2FnZVRhc2tPcHRpb25zID0geyBjb21tYW5kOiAnaW5zdGFsbCcgfSkgPT4ge1xuICAgIGxldCB0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlID0gcGFja2FnZU1hbmFnZXJQcm9maWxlO1xuICAgIGxldCB0YXNrUGFja2FnZU1hbmFnZXJOYW1lID0gcGFja2FnZU1hbmFnZXJOYW1lO1xuICAgIGlmIChmYWN0b3J5T3B0aW9ucy5hbGxvd1BhY2thZ2VNYW5hZ2VyT3ZlcnJpZGUgJiYgb3B0aW9ucy5wYWNrYWdlTWFuYWdlcikge1xuICAgICAgdGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZSA9IHBhY2thZ2VNYW5hZ2Vyc1tvcHRpb25zLnBhY2thZ2VNYW5hZ2VyXTtcbiAgICAgIGlmICghdGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZSkge1xuICAgICAgICB0aHJvdyBuZXcgVW5rbm93blBhY2thZ2VNYW5hZ2VyRXhjZXB0aW9uKG9wdGlvbnMucGFja2FnZU1hbmFnZXIpO1xuICAgICAgfVxuICAgICAgdGFza1BhY2thZ2VNYW5hZ2VyTmFtZSA9IG9wdGlvbnMucGFja2FnZU1hbmFnZXI7XG4gICAgfVxuXG4gICAgY29uc3QgYnVmZmVyZWRPdXRwdXQ6IHsgc3RyZWFtOiBOb2RlSlMuV3JpdGVTdHJlYW07IGRhdGE6IEJ1ZmZlciB9W10gPSBbXTtcbiAgICBjb25zdCBzcGF3bk9wdGlvbnM6IFNwYXduT3B0aW9ucyA9IHtcbiAgICAgIHNoZWxsOiB0cnVlLFxuICAgICAgY3dkOiBwYXRoLmpvaW4ocm9vdERpcmVjdG9yeSwgb3B0aW9ucy53b3JraW5nRGlyZWN0b3J5IHx8ICcnKSxcbiAgICB9O1xuICAgIGlmIChvcHRpb25zLmhpZGVPdXRwdXQpIHtcbiAgICAgIHNwYXduT3B0aW9ucy5zdGRpbyA9IG9wdGlvbnMucXVpZXQgPyBbJ2lnbm9yZScsICdpZ25vcmUnLCAncGlwZSddIDogJ3BpcGUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBzcGF3bk9wdGlvbnMuc3RkaW8gPSBvcHRpb25zLnF1aWV0ID8gWydpZ25vcmUnLCAnaWdub3JlJywgJ2luaGVyaXQnXSA6ICdpbmhlcml0JztcbiAgICB9XG5cbiAgICBjb25zdCBhcmdzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKG9wdGlvbnMucGFja2FnZU5hbWUpIHtcbiAgICAgIGlmIChvcHRpb25zLmNvbW1hbmQgPT09ICdpbnN0YWxsJykge1xuICAgICAgICBhcmdzLnB1c2godGFza1BhY2thZ2VNYW5hZ2VyUHJvZmlsZS5jb21tYW5kcy5pbnN0YWxsUGFja2FnZSk7XG4gICAgICB9XG4gICAgICBhcmdzLnB1c2gob3B0aW9ucy5wYWNrYWdlTmFtZSk7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmNvbW1hbmQgPT09ICdpbnN0YWxsJyAmJiB0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlLmNvbW1hbmRzLmluc3RhbGxBbGwpIHtcbiAgICAgIGFyZ3MucHVzaCh0YXNrUGFja2FnZU1hbmFnZXJQcm9maWxlLmNvbW1hbmRzLmluc3RhbGxBbGwpO1xuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy5hbGxvd1NjcmlwdHMpIHtcbiAgICAgIC8vIFlhcm4gcmVxdWlyZXMgc3BlY2lhbCBoYW5kbGluZyBzaW5jZSBZYXJuIDIrIG5vIGxvbmdlciBoYXMgdGhlIGAtLWlnbm9yZS1zY3JpcHRzYCBmbGFnXG4gICAgICBpZiAodGFza1BhY2thZ2VNYW5hZ2VyTmFtZSA9PT0gJ3lhcm4nKSB7XG4gICAgICAgIHNwYXduT3B0aW9ucy5lbnYgPSB7XG4gICAgICAgICAgLi4ucHJvY2Vzcy5lbnYsXG4gICAgICAgICAgLy8gU3VwcG9ydGVkIHdpdGggeWFybiAxXG4gICAgICAgICAgJ25wbV9jb25maWdfaWdub3JlX3NjcmlwdHMnOiAndHJ1ZScsXG4gICAgICAgICAgLy8gU3VwcG9ydGVkIHdpdGggeWFybiAyK1xuICAgICAgICAgICdZQVJOX0VOQUJMRV9TQ1JJUFRTJzogJ2ZhbHNlJyxcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFyZ3MucHVzaCgnLS1pZ25vcmUtc2NyaXB0cycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChmYWN0b3J5T3B0aW9ucy5yZWdpc3RyeSkge1xuICAgICAgYXJncy5wdXNoKGAtLXJlZ2lzdHJ5PVwiJHtmYWN0b3J5T3B0aW9ucy5yZWdpc3RyeX1cImApO1xuICAgIH1cblxuICAgIGlmIChmYWN0b3J5T3B0aW9ucy5mb3JjZSkge1xuICAgICAgYXJncy5wdXNoKCctLWZvcmNlJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKChvYnMpID0+IHtcbiAgICAgIGNvbnN0IHNwaW5uZXIgPSBvcmEoe1xuICAgICAgICB0ZXh0OiBgSW5zdGFsbGluZyBwYWNrYWdlcyAoJHt0YXNrUGFja2FnZU1hbmFnZXJOYW1lfSkuLi5gLFxuICAgICAgICAvLyBXb3JrYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vc2luZHJlc29yaHVzL29yYS9pc3N1ZXMvMTM2LlxuICAgICAgICBkaXNjYXJkU3RkaW46IHByb2Nlc3MucGxhdGZvcm0gIT0gJ3dpbjMyJyxcbiAgICAgIH0pLnN0YXJ0KCk7XG4gICAgICBjb25zdCBjaGlsZFByb2Nlc3MgPSBzcGF3bih0YXNrUGFja2FnZU1hbmFnZXJOYW1lLCBhcmdzLCBzcGF3bk9wdGlvbnMpLm9uKFxuICAgICAgICAnY2xvc2UnLFxuICAgICAgICAoY29kZTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICAgIHNwaW5uZXIuc3VjY2VlZCgnUGFja2FnZXMgaW5zdGFsbGVkIHN1Y2Nlc3NmdWxseS4nKTtcbiAgICAgICAgICAgIHNwaW5uZXIuc3RvcCgpO1xuICAgICAgICAgICAgb2JzLm5leHQoKTtcbiAgICAgICAgICAgIG9icy5jb21wbGV0ZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5oaWRlT3V0cHV0KSB7XG4gICAgICAgICAgICAgIGJ1ZmZlcmVkT3V0cHV0LmZvckVhY2goKHsgc3RyZWFtLCBkYXRhIH0pID0+IHN0cmVhbS53cml0ZShkYXRhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzcGlubmVyLmZhaWwoJ1BhY2thZ2UgaW5zdGFsbCBmYWlsZWQsIHNlZSBhYm92ZS4nKTtcbiAgICAgICAgICAgIG9icy5lcnJvcihuZXcgVW5zdWNjZXNzZnVsV29ya2Zsb3dFeGVjdXRpb24oKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgKTtcbiAgICAgIGlmIChvcHRpb25zLmhpZGVPdXRwdXQpIHtcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZG91dD8ub24oJ2RhdGEnLCAoZGF0YTogQnVmZmVyKSA9PlxuICAgICAgICAgIGJ1ZmZlcmVkT3V0cHV0LnB1c2goeyBzdHJlYW06IHByb2Nlc3Muc3Rkb3V0LCBkYXRhOiBkYXRhIH0pLFxuICAgICAgICApO1xuICAgICAgICBjaGlsZFByb2Nlc3Muc3RkZXJyPy5vbignZGF0YScsIChkYXRhOiBCdWZmZXIpID0+XG4gICAgICAgICAgYnVmZmVyZWRPdXRwdXQucHVzaCh7IHN0cmVhbTogcHJvY2Vzcy5zdGRlcnIsIGRhdGE6IGRhdGEgfSksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59XG4iXX0=