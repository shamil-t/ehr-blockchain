"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageManagerUtils = void 0;
const core_1 = require("@angular-devkit/core");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const semver_1 = require("semver");
const workspace_schema_1 = require("../../lib/config/workspace-schema");
const config_1 = require("./config");
const memoize_1 = require("./memoize");
const spinner_1 = require("./spinner");
class PackageManagerUtils {
    constructor(context) {
        this.context = context;
    }
    /** Get the package manager name. */
    get name() {
        return this.getName();
    }
    /** Get the package manager version. */
    get version() {
        return this.getVersion(this.name);
    }
    /**
     * Checks if the package manager is supported. If not, display a warning.
     */
    ensureCompatibility() {
        if (this.name !== workspace_schema_1.PackageManager.Npm) {
            return;
        }
        try {
            const version = (0, semver_1.valid)(this.version);
            if (!version) {
                return;
            }
            if ((0, semver_1.satisfies)(version, '>=7 <7.5.6')) {
                // eslint-disable-next-line no-console
                console.warn(`npm version ${version} detected.` +
                    ' When using npm 7 with the Angular CLI, npm version 7.5.6 or higher is recommended.');
            }
        }
        catch {
            // npm is not installed.
        }
    }
    /** Install a single package. */
    async install(packageName, save = true, extraArgs = [], cwd) {
        const packageManagerArgs = this.getArguments();
        const installArgs = [packageManagerArgs.install, packageName];
        if (save === 'devDependencies') {
            installArgs.push(packageManagerArgs.saveDev);
        }
        return this.run([...installArgs, ...extraArgs], { cwd, silent: true });
    }
    /** Install all packages. */
    async installAll(extraArgs = [], cwd) {
        const packageManagerArgs = this.getArguments();
        const installArgs = [];
        if (packageManagerArgs.installAll) {
            installArgs.push(packageManagerArgs.installAll);
        }
        return this.run([...installArgs, ...extraArgs], { cwd, silent: true });
    }
    /** Install a single package temporary. */
    async installTemp(packageName, extraArgs) {
        const tempPath = await fs_1.promises.mkdtemp((0, path_1.join)((0, fs_1.realpathSync)((0, os_1.tmpdir)()), 'angular-cli-packages-'));
        // clean up temp directory on process exit
        process.on('exit', () => {
            try {
                (0, fs_1.rmSync)(tempPath, { recursive: true, maxRetries: 3 });
            }
            catch { }
        });
        // NPM will warn when a `package.json` is not found in the install directory
        // Example:
        // npm WARN enoent ENOENT: no such file or directory, open '/tmp/.ng-temp-packages-84Qi7y/package.json'
        // npm WARN .ng-temp-packages-84Qi7y No description
        // npm WARN .ng-temp-packages-84Qi7y No repository field.
        // npm WARN .ng-temp-packages-84Qi7y No license field.
        // While we can use `npm init -y` we will end up needing to update the 'package.json' anyways
        // because of missing fields.
        await fs_1.promises.writeFile((0, path_1.join)(tempPath, 'package.json'), JSON.stringify({
            name: 'temp-cli-install',
            description: 'temp-cli-install',
            repository: 'temp-cli-install',
            license: 'MIT',
        }));
        // setup prefix/global modules path
        const packageManagerArgs = this.getArguments();
        const tempNodeModules = (0, path_1.join)(tempPath, 'node_modules');
        // Yarn will not append 'node_modules' to the path
        const prefixPath = this.name === workspace_schema_1.PackageManager.Yarn ? tempNodeModules : tempPath;
        const installArgs = [
            ...(extraArgs ?? []),
            `${packageManagerArgs.prefix}="${prefixPath}"`,
            packageManagerArgs.noLockfile,
        ];
        return {
            success: await this.install(packageName, true, installArgs, tempPath),
            tempNodeModules,
        };
    }
    getArguments() {
        switch (this.name) {
            case workspace_schema_1.PackageManager.Yarn:
                return {
                    saveDev: '--dev',
                    install: 'add',
                    prefix: '--modules-folder',
                    noLockfile: '--no-lockfile',
                };
            case workspace_schema_1.PackageManager.Pnpm:
                return {
                    saveDev: '--save-dev',
                    install: 'add',
                    installAll: 'install',
                    prefix: '--prefix',
                    noLockfile: '--no-lockfile',
                };
            default:
                return {
                    saveDev: '--save-dev',
                    install: 'install',
                    installAll: 'install',
                    prefix: '--prefix',
                    noLockfile: '--no-package-lock',
                };
        }
    }
    async run(args, options = {}) {
        const { cwd = process.cwd(), silent = false } = options;
        const spinner = new spinner_1.Spinner();
        spinner.start('Installing packages...');
        return new Promise((resolve) => {
            const bufferedOutput = [];
            const childProcess = (0, child_process_1.spawn)(this.name, args, {
                // Always pipe stderr to allow for failures to be reported
                stdio: silent ? ['ignore', 'ignore', 'pipe'] : 'pipe',
                shell: true,
                cwd,
            }).on('close', (code) => {
                if (code === 0) {
                    spinner.succeed('Packages successfully installed.');
                    resolve(true);
                }
                else {
                    spinner.stop();
                    bufferedOutput.forEach(({ stream, data }) => stream.write(data));
                    spinner.fail('Packages installation failed, see above.');
                    resolve(false);
                }
            });
            childProcess.stdout?.on('data', (data) => bufferedOutput.push({ stream: process.stdout, data: data }));
            childProcess.stderr?.on('data', (data) => bufferedOutput.push({ stream: process.stderr, data: data }));
        });
    }
    getVersion(name) {
        try {
            return (0, child_process_1.execSync)(`${name} --version`, {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
                env: {
                    ...process.env,
                    //  NPM updater notifier will prevents the child process from closing until it timeout after 3 minutes.
                    NO_UPDATE_NOTIFIER: '1',
                    NPM_CONFIG_UPDATE_NOTIFIER: 'false',
                },
            }).trim();
        }
        catch {
            return undefined;
        }
    }
    getName() {
        const packageManager = this.getConfiguredPackageManager();
        if (packageManager) {
            return packageManager;
        }
        const hasNpmLock = this.hasLockfile(workspace_schema_1.PackageManager.Npm);
        const hasYarnLock = this.hasLockfile(workspace_schema_1.PackageManager.Yarn);
        const hasPnpmLock = this.hasLockfile(workspace_schema_1.PackageManager.Pnpm);
        // PERF NOTE: `this.getVersion` spawns the package a the child_process which can take around ~300ms at times.
        // Therefore, we should only call this method when needed. IE: don't call `this.getVersion(PackageManager.Pnpm)` unless truly needed.
        // The result of this method is not stored in a variable because it's memoized.
        if (hasNpmLock) {
            // Has NPM lock file.
            if (!hasYarnLock && !hasPnpmLock && this.getVersion(workspace_schema_1.PackageManager.Npm)) {
                // Only NPM lock file and NPM binary is available.
                return workspace_schema_1.PackageManager.Npm;
            }
        }
        else {
            // No NPM lock file.
            if (hasYarnLock && this.getVersion(workspace_schema_1.PackageManager.Yarn)) {
                // Yarn lock file and Yarn binary is available.
                return workspace_schema_1.PackageManager.Yarn;
            }
            else if (hasPnpmLock && this.getVersion(workspace_schema_1.PackageManager.Pnpm)) {
                // PNPM lock file and PNPM binary is available.
                return workspace_schema_1.PackageManager.Pnpm;
            }
        }
        if (!this.getVersion(workspace_schema_1.PackageManager.Npm)) {
            // Doesn't have NPM installed.
            const hasYarn = !!this.getVersion(workspace_schema_1.PackageManager.Yarn);
            const hasPnpm = !!this.getVersion(workspace_schema_1.PackageManager.Pnpm);
            if (hasYarn && !hasPnpm) {
                return workspace_schema_1.PackageManager.Yarn;
            }
            else if (!hasYarn && hasPnpm) {
                return workspace_schema_1.PackageManager.Pnpm;
            }
        }
        // TODO: This should eventually inform the user of ambiguous package manager usage.
        //       Potentially with a prompt to choose and optionally set as the default.
        return workspace_schema_1.PackageManager.Npm;
    }
    hasLockfile(packageManager) {
        let lockfileName;
        switch (packageManager) {
            case workspace_schema_1.PackageManager.Yarn:
                lockfileName = 'yarn.lock';
                break;
            case workspace_schema_1.PackageManager.Pnpm:
                lockfileName = 'pnpm-lock.yaml';
                break;
            case workspace_schema_1.PackageManager.Npm:
            default:
                lockfileName = 'package-lock.json';
                break;
        }
        return (0, fs_1.existsSync)((0, path_1.join)(this.context.root, lockfileName));
    }
    getConfiguredPackageManager() {
        const getPackageManager = (source) => {
            if (source && (0, core_1.isJsonObject)(source)) {
                const value = source['packageManager'];
                if (typeof value === 'string') {
                    return value;
                }
            }
            return undefined;
        };
        let result;
        const { workspace: localWorkspace, globalConfiguration: globalWorkspace } = this.context;
        if (localWorkspace) {
            const project = (0, config_1.getProjectByCwd)(localWorkspace);
            if (project) {
                result = getPackageManager(localWorkspace.projects.get(project)?.extensions['cli']);
            }
            result ?? (result = getPackageManager(localWorkspace.extensions['cli']));
        }
        if (!result) {
            result = getPackageManager(globalWorkspace.extensions['cli']);
        }
        return result;
    }
}
exports.PackageManagerUtils = PackageManagerUtils;
__decorate([
    memoize_1.memoize,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], PackageManagerUtils.prototype, "getVersion", null);
__decorate([
    memoize_1.memoize,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], PackageManagerUtils.prototype, "getName", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2FnZS1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL3V0aWxpdGllcy9wYWNrYWdlLW1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0FBRUgsK0NBQTBEO0FBQzFELGlEQUFnRDtBQUNoRCwyQkFBc0U7QUFDdEUsMkJBQTRCO0FBQzVCLCtCQUE0QjtBQUM1QixtQ0FBMEM7QUFDMUMsd0VBQW1FO0FBQ25FLHFDQUE2RDtBQUM3RCx1Q0FBb0M7QUFDcEMsdUNBQW9DO0FBZ0JwQyxNQUFhLG1CQUFtQjtJQUM5QixZQUE2QixPQUFtQztRQUFuQyxZQUFPLEdBQVAsT0FBTyxDQUE0QjtJQUFHLENBQUM7SUFFcEUsb0NBQW9DO0lBQ3BDLElBQUksSUFBSTtRQUNOLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFRCx1Q0FBdUM7SUFDdkMsSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxtQkFBbUI7UUFDakIsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLGlDQUFjLENBQUMsR0FBRyxFQUFFO1lBQ3BDLE9BQU87U0FDUjtRQUVELElBQUk7WUFDRixNQUFNLE9BQU8sR0FBRyxJQUFBLGNBQUssRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDWixPQUFPO2FBQ1I7WUFFRCxJQUFJLElBQUEsa0JBQVMsRUFBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLEVBQUU7Z0JBQ3BDLHNDQUFzQztnQkFDdEMsT0FBTyxDQUFDLElBQUksQ0FDVixlQUFlLE9BQU8sWUFBWTtvQkFDaEMscUZBQXFGLENBQ3hG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LE1BQU0sS0FBTixNQUFNLEdBQUssaUJBQWlCLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFDO1NBQ2hFO1FBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDL0Q7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0NBQ0Y7QUE1U0Qsa0RBNFNDO0FBakhTO0lBRFAsaUJBQU87Ozs7cURBZ0JQO0FBR087SUFEUCxpQkFBTzs7OztrREErQ1AiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgaXNKc29uT2JqZWN0LCBqc29uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgZXhlY1N5bmMsIHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCBwcm9taXNlcyBhcyBmcywgcmVhbHBhdGhTeW5jLCBybVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyB0bXBkaXIgfSBmcm9tICdvcyc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBzYXRpc2ZpZXMsIHZhbGlkIH0gZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IFBhY2thZ2VNYW5hZ2VyIH0gZnJvbSAnLi4vLi4vbGliL2NvbmZpZy93b3Jrc3BhY2Utc2NoZW1hJztcbmltcG9ydCB7IEFuZ3VsYXJXb3Jrc3BhY2UsIGdldFByb2plY3RCeUN3ZCB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7IG1lbW9pemUgfSBmcm9tICcuL21lbW9pemUnO1xuaW1wb3J0IHsgU3Bpbm5lciB9IGZyb20gJy4vc3Bpbm5lcic7XG5cbmludGVyZmFjZSBQYWNrYWdlTWFuYWdlck9wdGlvbnMge1xuICBzYXZlRGV2OiBzdHJpbmc7XG4gIGluc3RhbGw6IHN0cmluZztcbiAgaW5zdGFsbEFsbD86IHN0cmluZztcbiAgcHJlZml4OiBzdHJpbmc7XG4gIG5vTG9ja2ZpbGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYWNrYWdlTWFuYWdlclV0aWxzQ29udGV4dCB7XG4gIGdsb2JhbENvbmZpZ3VyYXRpb246IEFuZ3VsYXJXb3Jrc3BhY2U7XG4gIHdvcmtzcGFjZT86IEFuZ3VsYXJXb3Jrc3BhY2U7XG4gIHJvb3Q6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFBhY2thZ2VNYW5hZ2VyVXRpbHMge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNvbnRleHQ6IFBhY2thZ2VNYW5hZ2VyVXRpbHNDb250ZXh0KSB7fVxuXG4gIC8qKiBHZXQgdGhlIHBhY2thZ2UgbWFuYWdlciBuYW1lLiAqL1xuICBnZXQgbmFtZSgpOiBQYWNrYWdlTWFuYWdlciB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TmFtZSgpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgcGFja2FnZSBtYW5hZ2VyIHZlcnNpb24uICovXG4gIGdldCB2ZXJzaW9uKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VmVyc2lvbih0aGlzLm5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgcGFja2FnZSBtYW5hZ2VyIGlzIHN1cHBvcnRlZC4gSWYgbm90LCBkaXNwbGF5IGEgd2FybmluZy5cbiAgICovXG4gIGVuc3VyZUNvbXBhdGliaWxpdHkoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubmFtZSAhPT0gUGFja2FnZU1hbmFnZXIuTnBtKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHZlcnNpb24gPSB2YWxpZCh0aGlzLnZlcnNpb24pO1xuICAgICAgaWYgKCF2ZXJzaW9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHNhdGlzZmllcyh2ZXJzaW9uLCAnPj03IDw3LjUuNicpKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBgbnBtIHZlcnNpb24gJHt2ZXJzaW9ufSBkZXRlY3RlZC5gICtcbiAgICAgICAgICAgICcgV2hlbiB1c2luZyBucG0gNyB3aXRoIHRoZSBBbmd1bGFyIENMSSwgbnBtIHZlcnNpb24gNy41LjYgb3IgaGlnaGVyIGlzIHJlY29tbWVuZGVkLicsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBucG0gaXMgbm90IGluc3RhbGxlZC5cbiAgICB9XG4gIH1cblxuICAvKiogSW5zdGFsbCBhIHNpbmdsZSBwYWNrYWdlLiAqL1xuICBhc3luYyBpbnN0YWxsKFxuICAgIHBhY2thZ2VOYW1lOiBzdHJpbmcsXG4gICAgc2F2ZTogJ2RlcGVuZGVuY2llcycgfCAnZGV2RGVwZW5kZW5jaWVzJyB8IHRydWUgPSB0cnVlLFxuICAgIGV4dHJhQXJnczogc3RyaW5nW10gPSBbXSxcbiAgICBjd2Q/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHBhY2thZ2VNYW5hZ2VyQXJncyA9IHRoaXMuZ2V0QXJndW1lbnRzKCk7XG4gICAgY29uc3QgaW5zdGFsbEFyZ3M6IHN0cmluZ1tdID0gW3BhY2thZ2VNYW5hZ2VyQXJncy5pbnN0YWxsLCBwYWNrYWdlTmFtZV07XG5cbiAgICBpZiAoc2F2ZSA9PT0gJ2RldkRlcGVuZGVuY2llcycpIHtcbiAgICAgIGluc3RhbGxBcmdzLnB1c2gocGFja2FnZU1hbmFnZXJBcmdzLnNhdmVEZXYpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnJ1bihbLi4uaW5zdGFsbEFyZ3MsIC4uLmV4dHJhQXJnc10sIHsgY3dkLCBzaWxlbnQ6IHRydWUgfSk7XG4gIH1cblxuICAvKiogSW5zdGFsbCBhbGwgcGFja2FnZXMuICovXG4gIGFzeW5jIGluc3RhbGxBbGwoZXh0cmFBcmdzOiBzdHJpbmdbXSA9IFtdLCBjd2Q/OiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBwYWNrYWdlTWFuYWdlckFyZ3MgPSB0aGlzLmdldEFyZ3VtZW50cygpO1xuICAgIGNvbnN0IGluc3RhbGxBcmdzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChwYWNrYWdlTWFuYWdlckFyZ3MuaW5zdGFsbEFsbCkge1xuICAgICAgaW5zdGFsbEFyZ3MucHVzaChwYWNrYWdlTWFuYWdlckFyZ3MuaW5zdGFsbEFsbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucnVuKFsuLi5pbnN0YWxsQXJncywgLi4uZXh0cmFBcmdzXSwgeyBjd2QsIHNpbGVudDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBJbnN0YWxsIGEgc2luZ2xlIHBhY2thZ2UgdGVtcG9yYXJ5LiAqL1xuICBhc3luYyBpbnN0YWxsVGVtcChcbiAgICBwYWNrYWdlTmFtZTogc3RyaW5nLFxuICAgIGV4dHJhQXJncz86IHN0cmluZ1tdLFxuICApOiBQcm9taXNlPHtcbiAgICBzdWNjZXNzOiBib29sZWFuO1xuICAgIHRlbXBOb2RlTW9kdWxlczogc3RyaW5nO1xuICB9PiB7XG4gICAgY29uc3QgdGVtcFBhdGggPSBhd2FpdCBmcy5ta2R0ZW1wKGpvaW4ocmVhbHBhdGhTeW5jKHRtcGRpcigpKSwgJ2FuZ3VsYXItY2xpLXBhY2thZ2VzLScpKTtcblxuICAgIC8vIGNsZWFuIHVwIHRlbXAgZGlyZWN0b3J5IG9uIHByb2Nlc3MgZXhpdFxuICAgIHByb2Nlc3Mub24oJ2V4aXQnLCAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBybVN5bmModGVtcFBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlLCBtYXhSZXRyaWVzOiAzIH0pO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH0pO1xuXG4gICAgLy8gTlBNIHdpbGwgd2FybiB3aGVuIGEgYHBhY2thZ2UuanNvbmAgaXMgbm90IGZvdW5kIGluIHRoZSBpbnN0YWxsIGRpcmVjdG9yeVxuICAgIC8vIEV4YW1wbGU6XG4gICAgLy8gbnBtIFdBUk4gZW5vZW50IEVOT0VOVDogbm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeSwgb3BlbiAnL3RtcC8ubmctdGVtcC1wYWNrYWdlcy04NFFpN3kvcGFja2FnZS5qc29uJ1xuICAgIC8vIG5wbSBXQVJOIC5uZy10ZW1wLXBhY2thZ2VzLTg0UWk3eSBObyBkZXNjcmlwdGlvblxuICAgIC8vIG5wbSBXQVJOIC5uZy10ZW1wLXBhY2thZ2VzLTg0UWk3eSBObyByZXBvc2l0b3J5IGZpZWxkLlxuICAgIC8vIG5wbSBXQVJOIC5uZy10ZW1wLXBhY2thZ2VzLTg0UWk3eSBObyBsaWNlbnNlIGZpZWxkLlxuXG4gICAgLy8gV2hpbGUgd2UgY2FuIHVzZSBgbnBtIGluaXQgLXlgIHdlIHdpbGwgZW5kIHVwIG5lZWRpbmcgdG8gdXBkYXRlIHRoZSAncGFja2FnZS5qc29uJyBhbnl3YXlzXG4gICAgLy8gYmVjYXVzZSBvZiBtaXNzaW5nIGZpZWxkcy5cbiAgICBhd2FpdCBmcy53cml0ZUZpbGUoXG4gICAgICBqb2luKHRlbXBQYXRoLCAncGFja2FnZS5qc29uJyksXG4gICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG5hbWU6ICd0ZW1wLWNsaS1pbnN0YWxsJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICd0ZW1wLWNsaS1pbnN0YWxsJyxcbiAgICAgICAgcmVwb3NpdG9yeTogJ3RlbXAtY2xpLWluc3RhbGwnLFxuICAgICAgICBsaWNlbnNlOiAnTUlUJyxcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICAvLyBzZXR1cCBwcmVmaXgvZ2xvYmFsIG1vZHVsZXMgcGF0aFxuICAgIGNvbnN0IHBhY2thZ2VNYW5hZ2VyQXJncyA9IHRoaXMuZ2V0QXJndW1lbnRzKCk7XG4gICAgY29uc3QgdGVtcE5vZGVNb2R1bGVzID0gam9pbih0ZW1wUGF0aCwgJ25vZGVfbW9kdWxlcycpO1xuICAgIC8vIFlhcm4gd2lsbCBub3QgYXBwZW5kICdub2RlX21vZHVsZXMnIHRvIHRoZSBwYXRoXG4gICAgY29uc3QgcHJlZml4UGF0aCA9IHRoaXMubmFtZSA9PT0gUGFja2FnZU1hbmFnZXIuWWFybiA/IHRlbXBOb2RlTW9kdWxlcyA6IHRlbXBQYXRoO1xuICAgIGNvbnN0IGluc3RhbGxBcmdzOiBzdHJpbmdbXSA9IFtcbiAgICAgIC4uLihleHRyYUFyZ3MgPz8gW10pLFxuICAgICAgYCR7cGFja2FnZU1hbmFnZXJBcmdzLnByZWZpeH09XCIke3ByZWZpeFBhdGh9XCJgLFxuICAgICAgcGFja2FnZU1hbmFnZXJBcmdzLm5vTG9ja2ZpbGUsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBhd2FpdCB0aGlzLmluc3RhbGwocGFja2FnZU5hbWUsIHRydWUsIGluc3RhbGxBcmdzLCB0ZW1wUGF0aCksXG4gICAgICB0ZW1wTm9kZU1vZHVsZXMsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QXJndW1lbnRzKCk6IFBhY2thZ2VNYW5hZ2VyT3B0aW9ucyB7XG4gICAgc3dpdGNoICh0aGlzLm5hbWUpIHtcbiAgICAgIGNhc2UgUGFja2FnZU1hbmFnZXIuWWFybjpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzYXZlRGV2OiAnLS1kZXYnLFxuICAgICAgICAgIGluc3RhbGw6ICdhZGQnLFxuICAgICAgICAgIHByZWZpeDogJy0tbW9kdWxlcy1mb2xkZXInLFxuICAgICAgICAgIG5vTG9ja2ZpbGU6ICctLW5vLWxvY2tmaWxlJyxcbiAgICAgICAgfTtcbiAgICAgIGNhc2UgUGFja2FnZU1hbmFnZXIuUG5wbTpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzYXZlRGV2OiAnLS1zYXZlLWRldicsXG4gICAgICAgICAgaW5zdGFsbDogJ2FkZCcsXG4gICAgICAgICAgaW5zdGFsbEFsbDogJ2luc3RhbGwnLFxuICAgICAgICAgIHByZWZpeDogJy0tcHJlZml4JyxcbiAgICAgICAgICBub0xvY2tmaWxlOiAnLS1uby1sb2NrZmlsZScsXG4gICAgICAgIH07XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHNhdmVEZXY6ICctLXNhdmUtZGV2JyxcbiAgICAgICAgICBpbnN0YWxsOiAnaW5zdGFsbCcsXG4gICAgICAgICAgaW5zdGFsbEFsbDogJ2luc3RhbGwnLFxuICAgICAgICAgIHByZWZpeDogJy0tcHJlZml4JyxcbiAgICAgICAgICBub0xvY2tmaWxlOiAnLS1uby1wYWNrYWdlLWxvY2snLFxuICAgICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuKFxuICAgIGFyZ3M6IHN0cmluZ1tdLFxuICAgIG9wdGlvbnM6IHsgY3dkPzogc3RyaW5nOyBzaWxlbnQ/OiBib29sZWFuIH0gPSB7fSxcbiAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgeyBjd2QgPSBwcm9jZXNzLmN3ZCgpLCBzaWxlbnQgPSBmYWxzZSB9ID0gb3B0aW9ucztcblxuICAgIGNvbnN0IHNwaW5uZXIgPSBuZXcgU3Bpbm5lcigpO1xuICAgIHNwaW5uZXIuc3RhcnQoJ0luc3RhbGxpbmcgcGFja2FnZXMuLi4nKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgY29uc3QgYnVmZmVyZWRPdXRwdXQ6IHsgc3RyZWFtOiBOb2RlSlMuV3JpdGVTdHJlYW07IGRhdGE6IEJ1ZmZlciB9W10gPSBbXTtcblxuICAgICAgY29uc3QgY2hpbGRQcm9jZXNzID0gc3Bhd24odGhpcy5uYW1lLCBhcmdzLCB7XG4gICAgICAgIC8vIEFsd2F5cyBwaXBlIHN0ZGVyciB0byBhbGxvdyBmb3IgZmFpbHVyZXMgdG8gYmUgcmVwb3J0ZWRcbiAgICAgICAgc3RkaW86IHNpbGVudCA/IFsnaWdub3JlJywgJ2lnbm9yZScsICdwaXBlJ10gOiAncGlwZScsXG4gICAgICAgIHNoZWxsOiB0cnVlLFxuICAgICAgICBjd2QsXG4gICAgICB9KS5vbignY2xvc2UnLCAoY29kZTogbnVtYmVyKSA9PiB7XG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XG4gICAgICAgICAgc3Bpbm5lci5zdWNjZWVkKCdQYWNrYWdlcyBzdWNjZXNzZnVsbHkgaW5zdGFsbGVkLicpO1xuICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3Bpbm5lci5zdG9wKCk7XG4gICAgICAgICAgYnVmZmVyZWRPdXRwdXQuZm9yRWFjaCgoeyBzdHJlYW0sIGRhdGEgfSkgPT4gc3RyZWFtLndyaXRlKGRhdGEpKTtcbiAgICAgICAgICBzcGlubmVyLmZhaWwoJ1BhY2thZ2VzIGluc3RhbGxhdGlvbiBmYWlsZWQsIHNlZSBhYm92ZS4nKTtcbiAgICAgICAgICByZXNvbHZlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQ/Lm9uKCdkYXRhJywgKGRhdGE6IEJ1ZmZlcikgPT5cbiAgICAgICAgYnVmZmVyZWRPdXRwdXQucHVzaCh7IHN0cmVhbTogcHJvY2Vzcy5zdGRvdXQsIGRhdGE6IGRhdGEgfSksXG4gICAgICApO1xuICAgICAgY2hpbGRQcm9jZXNzLnN0ZGVycj8ub24oJ2RhdGEnLCAoZGF0YTogQnVmZmVyKSA9PlxuICAgICAgICBidWZmZXJlZE91dHB1dC5wdXNoKHsgc3RyZWFtOiBwcm9jZXNzLnN0ZGVyciwgZGF0YTogZGF0YSB9KSxcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICBAbWVtb2l6ZVxuICBwcml2YXRlIGdldFZlcnNpb24obmFtZTogUGFja2FnZU1hbmFnZXIpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gZXhlY1N5bmMoYCR7bmFtZX0gLS12ZXJzaW9uYCwge1xuICAgICAgICBlbmNvZGluZzogJ3V0ZjgnLFxuICAgICAgICBzdGRpbzogWydpZ25vcmUnLCAncGlwZScsICdpZ25vcmUnXSxcbiAgICAgICAgZW52OiB7XG4gICAgICAgICAgLi4ucHJvY2Vzcy5lbnYsXG4gICAgICAgICAgLy8gIE5QTSB1cGRhdGVyIG5vdGlmaWVyIHdpbGwgcHJldmVudHMgdGhlIGNoaWxkIHByb2Nlc3MgZnJvbSBjbG9zaW5nIHVudGlsIGl0IHRpbWVvdXQgYWZ0ZXIgMyBtaW51dGVzLlxuICAgICAgICAgIE5PX1VQREFURV9OT1RJRklFUjogJzEnLFxuICAgICAgICAgIE5QTV9DT05GSUdfVVBEQVRFX05PVElGSUVSOiAnZmFsc2UnLFxuICAgICAgICB9LFxuICAgICAgfSkudHJpbSgpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICBAbWVtb2l6ZVxuICBwcml2YXRlIGdldE5hbWUoKTogUGFja2FnZU1hbmFnZXIge1xuICAgIGNvbnN0IHBhY2thZ2VNYW5hZ2VyID0gdGhpcy5nZXRDb25maWd1cmVkUGFja2FnZU1hbmFnZXIoKTtcbiAgICBpZiAocGFja2FnZU1hbmFnZXIpIHtcbiAgICAgIHJldHVybiBwYWNrYWdlTWFuYWdlcjtcbiAgICB9XG5cbiAgICBjb25zdCBoYXNOcG1Mb2NrID0gdGhpcy5oYXNMb2NrZmlsZShQYWNrYWdlTWFuYWdlci5OcG0pO1xuICAgIGNvbnN0IGhhc1lhcm5Mb2NrID0gdGhpcy5oYXNMb2NrZmlsZShQYWNrYWdlTWFuYWdlci5ZYXJuKTtcbiAgICBjb25zdCBoYXNQbnBtTG9jayA9IHRoaXMuaGFzTG9ja2ZpbGUoUGFja2FnZU1hbmFnZXIuUG5wbSk7XG5cbiAgICAvLyBQRVJGIE5PVEU6IGB0aGlzLmdldFZlcnNpb25gIHNwYXducyB0aGUgcGFja2FnZSBhIHRoZSBjaGlsZF9wcm9jZXNzIHdoaWNoIGNhbiB0YWtlIGFyb3VuZCB+MzAwbXMgYXQgdGltZXMuXG4gICAgLy8gVGhlcmVmb3JlLCB3ZSBzaG91bGQgb25seSBjYWxsIHRoaXMgbWV0aG9kIHdoZW4gbmVlZGVkLiBJRTogZG9uJ3QgY2FsbCBgdGhpcy5nZXRWZXJzaW9uKFBhY2thZ2VNYW5hZ2VyLlBucG0pYCB1bmxlc3MgdHJ1bHkgbmVlZGVkLlxuICAgIC8vIFRoZSByZXN1bHQgb2YgdGhpcyBtZXRob2QgaXMgbm90IHN0b3JlZCBpbiBhIHZhcmlhYmxlIGJlY2F1c2UgaXQncyBtZW1vaXplZC5cblxuICAgIGlmIChoYXNOcG1Mb2NrKSB7XG4gICAgICAvLyBIYXMgTlBNIGxvY2sgZmlsZS5cbiAgICAgIGlmICghaGFzWWFybkxvY2sgJiYgIWhhc1BucG1Mb2NrICYmIHRoaXMuZ2V0VmVyc2lvbihQYWNrYWdlTWFuYWdlci5OcG0pKSB7XG4gICAgICAgIC8vIE9ubHkgTlBNIGxvY2sgZmlsZSBhbmQgTlBNIGJpbmFyeSBpcyBhdmFpbGFibGUuXG4gICAgICAgIHJldHVybiBQYWNrYWdlTWFuYWdlci5OcG07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE5vIE5QTSBsb2NrIGZpbGUuXG4gICAgICBpZiAoaGFzWWFybkxvY2sgJiYgdGhpcy5nZXRWZXJzaW9uKFBhY2thZ2VNYW5hZ2VyLllhcm4pKSB7XG4gICAgICAgIC8vIFlhcm4gbG9jayBmaWxlIGFuZCBZYXJuIGJpbmFyeSBpcyBhdmFpbGFibGUuXG4gICAgICAgIHJldHVybiBQYWNrYWdlTWFuYWdlci5ZYXJuO1xuICAgICAgfSBlbHNlIGlmIChoYXNQbnBtTG9jayAmJiB0aGlzLmdldFZlcnNpb24oUGFja2FnZU1hbmFnZXIuUG5wbSkpIHtcbiAgICAgICAgLy8gUE5QTSBsb2NrIGZpbGUgYW5kIFBOUE0gYmluYXJ5IGlzIGF2YWlsYWJsZS5cbiAgICAgICAgcmV0dXJuIFBhY2thZ2VNYW5hZ2VyLlBucG07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmdldFZlcnNpb24oUGFja2FnZU1hbmFnZXIuTnBtKSkge1xuICAgICAgLy8gRG9lc24ndCBoYXZlIE5QTSBpbnN0YWxsZWQuXG4gICAgICBjb25zdCBoYXNZYXJuID0gISF0aGlzLmdldFZlcnNpb24oUGFja2FnZU1hbmFnZXIuWWFybik7XG4gICAgICBjb25zdCBoYXNQbnBtID0gISF0aGlzLmdldFZlcnNpb24oUGFja2FnZU1hbmFnZXIuUG5wbSk7XG5cbiAgICAgIGlmIChoYXNZYXJuICYmICFoYXNQbnBtKSB7XG4gICAgICAgIHJldHVybiBQYWNrYWdlTWFuYWdlci5ZYXJuO1xuICAgICAgfSBlbHNlIGlmICghaGFzWWFybiAmJiBoYXNQbnBtKSB7XG4gICAgICAgIHJldHVybiBQYWNrYWdlTWFuYWdlci5QbnBtO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86IFRoaXMgc2hvdWxkIGV2ZW50dWFsbHkgaW5mb3JtIHRoZSB1c2VyIG9mIGFtYmlndW91cyBwYWNrYWdlIG1hbmFnZXIgdXNhZ2UuXG4gICAgLy8gICAgICAgUG90ZW50aWFsbHkgd2l0aCBhIHByb21wdCB0byBjaG9vc2UgYW5kIG9wdGlvbmFsbHkgc2V0IGFzIHRoZSBkZWZhdWx0LlxuICAgIHJldHVybiBQYWNrYWdlTWFuYWdlci5OcG07XG4gIH1cblxuICBwcml2YXRlIGhhc0xvY2tmaWxlKHBhY2thZ2VNYW5hZ2VyOiBQYWNrYWdlTWFuYWdlcik6IGJvb2xlYW4ge1xuICAgIGxldCBsb2NrZmlsZU5hbWU6IHN0cmluZztcbiAgICBzd2l0Y2ggKHBhY2thZ2VNYW5hZ2VyKSB7XG4gICAgICBjYXNlIFBhY2thZ2VNYW5hZ2VyLllhcm46XG4gICAgICAgIGxvY2tmaWxlTmFtZSA9ICd5YXJuLmxvY2snO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUGFja2FnZU1hbmFnZXIuUG5wbTpcbiAgICAgICAgbG9ja2ZpbGVOYW1lID0gJ3BucG0tbG9jay55YW1sJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFBhY2thZ2VNYW5hZ2VyLk5wbTpcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxvY2tmaWxlTmFtZSA9ICdwYWNrYWdlLWxvY2suanNvbic7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiBleGlzdHNTeW5jKGpvaW4odGhpcy5jb250ZXh0LnJvb3QsIGxvY2tmaWxlTmFtZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRDb25maWd1cmVkUGFja2FnZU1hbmFnZXIoKTogUGFja2FnZU1hbmFnZXIgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGdldFBhY2thZ2VNYW5hZ2VyID0gKHNvdXJjZToganNvbi5Kc29uVmFsdWUgfCB1bmRlZmluZWQpOiBQYWNrYWdlTWFuYWdlciB8IHVuZGVmaW5lZCA9PiB7XG4gICAgICBpZiAoc291cmNlICYmIGlzSnNvbk9iamVjdChzb3VyY2UpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gc291cmNlWydwYWNrYWdlTWFuYWdlciddO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHJldHVybiB2YWx1ZSBhcyBQYWNrYWdlTWFuYWdlcjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH07XG5cbiAgICBsZXQgcmVzdWx0OiBQYWNrYWdlTWFuYWdlciB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCB7IHdvcmtzcGFjZTogbG9jYWxXb3Jrc3BhY2UsIGdsb2JhbENvbmZpZ3VyYXRpb246IGdsb2JhbFdvcmtzcGFjZSB9ID0gdGhpcy5jb250ZXh0O1xuICAgIGlmIChsb2NhbFdvcmtzcGFjZSkge1xuICAgICAgY29uc3QgcHJvamVjdCA9IGdldFByb2plY3RCeUN3ZChsb2NhbFdvcmtzcGFjZSk7XG4gICAgICBpZiAocHJvamVjdCkge1xuICAgICAgICByZXN1bHQgPSBnZXRQYWNrYWdlTWFuYWdlcihsb2NhbFdvcmtzcGFjZS5wcm9qZWN0cy5nZXQocHJvamVjdCk/LmV4dGVuc2lvbnNbJ2NsaSddKTtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0ID8/PSBnZXRQYWNrYWdlTWFuYWdlcihsb2NhbFdvcmtzcGFjZS5leHRlbnNpb25zWydjbGknXSk7XG4gICAgfVxuXG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIHJlc3VsdCA9IGdldFBhY2thZ2VNYW5hZ2VyKGdsb2JhbFdvcmtzcGFjZS5leHRlbnNpb25zWydjbGknXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuIl19