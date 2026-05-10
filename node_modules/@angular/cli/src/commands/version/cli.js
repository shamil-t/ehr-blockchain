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
const module_1 = __importDefault(require("module"));
const path_1 = require("path");
const command_module_1 = require("../../command-builder/command-module");
const color_1 = require("../../utilities/color");
const command_config_1 = require("../command-config");
/**
 * Major versions of Node.js that are officially supported by Angular.
 */
const SUPPORTED_NODE_MAJORS = [16, 18];
const PACKAGE_PATTERNS = [
    /^@angular\/.*/,
    /^@angular-devkit\/.*/,
    /^@bazel\/.*/,
    /^@ngtools\/.*/,
    /^@nguniversal\/.*/,
    /^@schematics\/.*/,
    /^rxjs$/,
    /^typescript$/,
    /^ng-packagr$/,
    /^webpack$/,
    /^zone\.js$/,
];
class VersionCommandModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.command = 'version';
        this.aliases = command_config_1.RootCommands['version'].aliases;
        this.describe = 'Outputs Angular CLI version.';
    }
    builder(localYargs) {
        return localYargs;
    }
    async run() {
        const { packageManager, logger, root } = this.context;
        const localRequire = module_1.default.createRequire((0, path_1.resolve)(__filename, '../../../'));
        // Trailing slash is used to allow the path to be treated as a directory
        const workspaceRequire = module_1.default.createRequire(root + '/');
        const cliPackage = localRequire('./package.json');
        let workspacePackage;
        try {
            workspacePackage = workspaceRequire('./package.json');
        }
        catch { }
        const [nodeMajor] = process.versions.node.split('.').map((part) => Number(part));
        const unsupportedNodeVersion = !SUPPORTED_NODE_MAJORS.includes(nodeMajor);
        const packageNames = new Set(Object.keys({
            ...cliPackage.dependencies,
            ...cliPackage.devDependencies,
            ...workspacePackage?.dependencies,
            ...workspacePackage?.devDependencies,
        }));
        const versions = {};
        for (const name of packageNames) {
            if (PACKAGE_PATTERNS.some((p) => p.test(name))) {
                versions[name] = this.getVersion(name, workspaceRequire, localRequire);
            }
        }
        const ngCliVersion = cliPackage.version;
        let angularCoreVersion = '';
        const angularSameAsCore = [];
        if (workspacePackage) {
            // Filter all angular versions that are the same as core.
            angularCoreVersion = versions['@angular/core'];
            if (angularCoreVersion) {
                for (const [name, version] of Object.entries(versions)) {
                    if (version === angularCoreVersion && name.startsWith('@angular/')) {
                        angularSameAsCore.push(name.replace(/^@angular\//, ''));
                        delete versions[name];
                    }
                }
                // Make sure we list them in alphabetical order.
                angularSameAsCore.sort();
            }
        }
        const namePad = ' '.repeat(Object.keys(versions).sort((a, b) => b.length - a.length)[0].length + 3);
        const asciiArt = `
     _                      _                 ____ _     ___
    / \\   _ __   __ _ _   _| | __ _ _ __     / ___| |   |_ _|
   / △ \\ | '_ \\ / _\` | | | | |/ _\` | '__|   | |   | |    | |
  / ___ \\| | | | (_| | |_| | | (_| | |      | |___| |___ | |
 /_/   \\_\\_| |_|\\__, |\\__,_|_|\\__,_|_|       \\____|_____|___|
                |___/
    `
            .split('\n')
            .map((x) => color_1.colors.red(x))
            .join('\n');
        logger.info(asciiArt);
        logger.info(`
      Angular CLI: ${ngCliVersion}
      Node: ${process.versions.node}${unsupportedNodeVersion ? ' (Unsupported)' : ''}
      Package Manager: ${packageManager.name} ${packageManager.version ?? '<error>'}
      OS: ${process.platform} ${process.arch}

      Angular: ${angularCoreVersion}
      ... ${angularSameAsCore
            .reduce((acc, name) => {
            // Perform a simple word wrap around 60.
            if (acc.length == 0) {
                return [name];
            }
            const line = acc[acc.length - 1] + ', ' + name;
            if (line.length > 60) {
                acc.push(name);
            }
            else {
                acc[acc.length - 1] = line;
            }
            return acc;
        }, [])
            .join('\n... ')}

      Package${namePad.slice(7)}Version
      -------${namePad.replace(/ /g, '-')}------------------
      ${Object.keys(versions)
            .map((module) => `${module}${namePad.slice(module.length)}${versions[module]}`)
            .sort()
            .join('\n')}
    `.replace(/^ {6}/gm, ''));
        if (unsupportedNodeVersion) {
            logger.warn(`Warning: The current version of Node (${process.versions.node}) is not supported by Angular.`);
        }
    }
    getVersion(moduleName, workspaceRequire, localRequire) {
        let packageInfo;
        let cliOnly = false;
        // Try to find the package in the workspace
        try {
            packageInfo = workspaceRequire(`${moduleName}/package.json`);
        }
        catch { }
        // If not found, try to find within the CLI
        if (!packageInfo) {
            try {
                packageInfo = localRequire(`${moduleName}/package.json`);
                cliOnly = true;
            }
            catch { }
        }
        // If found, attempt to get the version
        if (packageInfo) {
            try {
                return packageInfo.version + (cliOnly ? ' (cli-only)' : '');
            }
            catch { }
        }
        return '<error>';
    }
}
exports.default = VersionCommandModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL3ZlcnNpb24vY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7O0FBRUgsb0RBQWdDO0FBQ2hDLCtCQUErQjtBQUUvQix5RUFBa0c7QUFDbEcsaURBQStDO0FBQy9DLHNEQUFpRDtBQVNqRDs7R0FFRztBQUNILE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFdkMsTUFBTSxnQkFBZ0IsR0FBRztJQUN2QixlQUFlO0lBQ2Ysc0JBQXNCO0lBQ3RCLGFBQWE7SUFDYixlQUFlO0lBQ2YsbUJBQW1CO0lBQ25CLGtCQUFrQjtJQUNsQixRQUFRO0lBQ1IsY0FBYztJQUNkLGNBQWM7SUFDZCxXQUFXO0lBQ1gsWUFBWTtDQUNiLENBQUM7QUFFRixNQUFxQixvQkFDbkIsU0FBUSw4QkFBYTtJQUR2Qjs7UUFJRSxZQUFPLEdBQUcsU0FBUyxDQUFDO1FBQ3BCLFlBQU8sR0FBRyw2QkFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUMxQyxhQUFRLEdBQUcsOEJBQThCLENBQUM7SUFpSjVDLENBQUM7SUE5SUMsT0FBTyxDQUFDLFVBQWdCO1FBQ3RCLE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxLQUFLLENBQUMsR0FBRztRQUNQLE1BQU0sRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDdEQsTUFBTSxZQUFZLEdBQUcsZ0JBQVUsQ0FBQyxhQUFhLENBQUMsSUFBQSxjQUFPLEVBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDaEYsd0VBQXdFO1FBQ3hFLE1BQU0sZ0JBQWdCLEdBQUcsZ0JBQVUsQ0FBQyxhQUFhLENBQUMs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TSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7YUFDOUUsSUFBSSxFQUFFO2FBQ04sSUFBSSxDQUFDLElBQUksQ0FBQztLQUNkLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FDdkIsQ0FBQztRQUVGLElBQUksc0JBQXNCLEVBQUU7WUFDMUIsTUFBTSxDQUFDLElBQUksQ0FDVCx5Q0FBeUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLGdDQUFnQyxDQUMvRixDQUFDO1NBQ0g7SUFDSCxDQUFDO0lBRU8sVUFBVSxDQUNoQixVQUFrQixFQUNsQixnQkFBNkIsRUFDN0IsWUFBeUI7UUFFekIsSUFBSSxXQUEyQyxDQUFDO1FBQ2hELElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztRQUVwQiwyQ0FBMkM7UUFDM0MsSUFBSTtZQUNGLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLFVBQVUsZUFBZSxDQUFDLENBQUM7U0FDOUQ7UUFBQyxNQUFNLEdBQUU7UUFFViwyQ0FBMkM7UUFDM0MsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNoQixJQUFJO2dCQUNGLFdBQVcsR0FBRyxZQUFZLENBQUMsR0FBRyxVQUFVLGVBQWUsQ0FBQyxDQUFDO2dCQUN6RCxPQUFPLEdBQUcsSUFBSSxDQUFDO2FBQ2hCO1lBQUMsTUFBTSxHQUFFO1NBQ1g7UUFFRCx1Q0FBdUM7UUFDdkMsSUFBSSxXQUFXLEVBQUU7WUFDZixJQUFJO2dCQUNGLE9BQU8sV0FBVyxDQUFDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUM3RDtZQUFDLE1BQU0sR0FBRTtTQUNYO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztDQUNGO0FBdkpELHVDQXVKQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgbm9kZU1vZHVsZSBmcm9tICdtb2R1bGUnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgQXJndiB9IGZyb20gJ3lhcmdzJztcbmltcG9ydCB7IENvbW1hbmRNb2R1bGUsIENvbW1hbmRNb2R1bGVJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uLy4uL2NvbW1hbmQtYnVpbGRlci9jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvY29sb3InO1xuaW1wb3J0IHsgUm9vdENvbW1hbmRzIH0gZnJvbSAnLi4vY29tbWFuZC1jb25maWcnO1xuXG5pbnRlcmZhY2UgUGFydGlhbFBhY2thZ2VJbmZvIHtcbiAgbmFtZTogc3RyaW5nO1xuICB2ZXJzaW9uOiBzdHJpbmc7XG4gIGRlcGVuZGVuY2llcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIGRldkRlcGVuZGVuY2llcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbi8qKlxuICogTWFqb3IgdmVyc2lvbnMgb2YgTm9kZS5qcyB0aGF0IGFyZSBvZmZpY2lhbGx5IHN1cHBvcnRlZCBieSBBbmd1bGFyLlxuICovXG5jb25zdCBTVVBQT1JURURfTk9ERV9NQUpPUlMgPSBbMTYsIDE4XTtcblxuY29uc3QgUEFDS0FHRV9QQVRURVJOUyA9IFtcbiAgL15AYW5ndWxhclxcLy4qLyxcbiAgL15AYW5ndWxhci1kZXZraXRcXC8uKi8sXG4gIC9eQGJhemVsXFwvLiovLFxuICAvXkBuZ3Rvb2xzXFwvLiovLFxuICAvXkBuZ3VuaXZlcnNhbFxcLy4qLyxcbiAgL15Ac2NoZW1hdGljc1xcLy4qLyxcbiAgL15yeGpzJC8sXG4gIC9edHlwZXNjcmlwdCQvLFxuICAvXm5nLXBhY2thZ3IkLyxcbiAgL153ZWJwYWNrJC8sXG4gIC9eem9uZVxcLmpzJC8sXG5dO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZXJzaW9uQ29tbWFuZE1vZHVsZVxuICBleHRlbmRzIENvbW1hbmRNb2R1bGVcbiAgaW1wbGVtZW50cyBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb25cbntcbiAgY29tbWFuZCA9ICd2ZXJzaW9uJztcbiAgYWxpYXNlcyA9IFJvb3RDb21tYW5kc1sndmVyc2lvbiddLmFsaWFzZXM7XG4gIGRlc2NyaWJlID0gJ091dHB1dHMgQW5ndWxhciBDTEkgdmVyc2lvbi4nO1xuICBsb25nRGVzY3JpcHRpb25QYXRoPzogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gIGJ1aWxkZXIobG9jYWxZYXJnczogQXJndik6IEFyZ3Yge1xuICAgIHJldHVybiBsb2NhbFlhcmdzO1xuICB9XG5cbiAgYXN5bmMgcnVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgcGFja2FnZU1hbmFnZXIsIGxvZ2dlciwgcm9vdCB9ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IGxvY2FsUmVxdWlyZSA9IG5vZGVNb2R1bGUuY3JlYXRlUmVxdWlyZShyZXNvbHZlKF9fZmlsZW5hbWUsICcuLi8uLi8uLi8nKSk7XG4gICAgLy8gVHJhaWxpbmcgc2xhc2ggaXMgdXNlZCB0byBhbGxvdyB0aGUgcGF0aCB0byBiZSB0cmVhdGVkIGFzIGEgZGlyZWN0b3J5XG4gICAgY29uc3Qgd29ya3NwYWNlUmVxdWlyZSA9IG5vZGVNb2R1bGUuY3JlYXRlUmVxdWlyZShyb290ICsgJy8nKTtcblxuICAgIGNvbnN0IGNsaVBhY2thZ2U6IFBhcnRpYWxQYWNrYWdlSW5mbyA9IGxvY2FsUmVxdWlyZSgnLi9wYWNrYWdlLmpzb24nKTtcbiAgICBsZXQgd29ya3NwYWNlUGFja2FnZTogUGFydGlhbFBhY2thZ2VJbmZvIHwgdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICB3b3Jrc3BhY2VQYWNrYWdlID0gd29ya3NwYWNlUmVxdWlyZSgnLi9wYWNrYWdlLmpzb24nKTtcbiAgICB9IGNhdGNoIHt9XG5cbiAgICBjb25zdCBbbm9kZU1ham9yXSA9IHByb2Nlc3MudmVyc2lvbnMubm9kZS5zcGxpdCgnLicpLm1hcCgocGFydCkgPT4gTnVtYmVyKHBhcnQpKTtcbiAgICBjb25zdCB1bnN1cHBvcnRlZE5vZGVWZXJzaW9uID0gIVNVUFBPUlRFRF9OT0RFX01BSk9SUy5pbmNsdWRlcyhub2RlTWFqb3IpO1xuXG4gICAgY29uc3QgcGFja2FnZU5hbWVzID0gbmV3IFNldChcbiAgICAgIE9iamVjdC5rZXlzKHtcbiAgICAgICAgLi4uY2xpUGFja2FnZS5kZXBlbmRlbmNpZXMsXG4gICAgICAgIC4uLmNsaVBhY2thZ2UuZGV2RGVwZW5kZW5jaWVzLFxuICAgICAgICAuLi53b3Jrc3BhY2VQYWNrYWdlPy5kZXBlbmRlbmNpZXMsXG4gICAgICAgIC4uLndvcmtzcGFjZVBhY2thZ2U/LmRldkRlcGVuZGVuY2llcyxcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICBjb25zdCB2ZXJzaW9uczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIGZvciAoY29uc3QgbmFtZSBvZiBwYWNrYWdlTmFtZXMpIHtcbiAgICAgIGlmIChQQUNLQUdFX1BBVFRFUk5TLnNvbWUoKHApID0+IHAudGVzdChuYW1lKSkpIHtcbiAgICAgICAgdmVyc2lvbnNbbmFtZV0gPSB0aGlzLmdldFZlcnNpb24obmFtZSwgd29ya3NwYWNlUmVxdWlyZSwgbG9jYWxSZXF1aXJlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBuZ0NsaVZlcnNpb24gPSBjbGlQYWNrYWdlLnZlcnNpb247XG4gICAgbGV0IGFuZ3VsYXJDb3JlVmVyc2lvbiA9ICcnO1xuICAgIGNvbnN0IGFuZ3VsYXJTYW1lQXNDb3JlOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKHdvcmtzcGFjZVBhY2thZ2UpIHtcbiAgICAgIC8vIEZpbHRlciBhbGwgYW5ndWxhciB2ZXJzaW9ucyB0aGF0IGFyZSB0aGUgc2FtZSBhcyBjb3JlLlxuICAgICAgYW5ndWxhckNvcmVWZXJzaW9uID0gdmVyc2lvbnNbJ0Bhbmd1bGFyL2NvcmUnXTtcbiAgICAgIGlmIChhbmd1bGFyQ29yZVZlcnNpb24pIHtcbiAgICAgICAgZm9yIChjb25zdCBbbmFtZSwgdmVyc2lvbl0gb2YgT2JqZWN0LmVudHJpZXModmVyc2lvbnMpKSB7XG4gICAgICAgICAgaWYgKHZlcnNpb24gPT09IGFuZ3VsYXJDb3JlVmVyc2lvbiAmJiBuYW1lLnN0YXJ0c1dpdGgoJ0Bhbmd1bGFyLycpKSB7XG4gICAgICAgICAgICBhbmd1bGFyU2FtZUFzQ29yZS5wdXNoKG5hbWUucmVwbGFjZSgvXkBhbmd1bGFyXFwvLywgJycpKTtcbiAgICAgICAgICAgIGRlbGV0ZSB2ZXJzaW9uc1tuYW1lXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNYWtlIHN1cmUgd2UgbGlzdCB0aGVtIGluIGFscGhhYmV0aWNhbCBvcmRlci5cbiAgICAgICAgYW5ndWxhclNhbWVBc0NvcmUuc29ydCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG5hbWVQYWQgPSAnICcucmVwZWF0KFxuICAgICAgT2JqZWN0LmtleXModmVyc2lvbnMpLnNvcnQoKGEsIGIpID0+IGIubGVuZ3RoIC0gYS5sZW5ndGgpWzBdLmxlbmd0aCArIDMsXG4gICAgKTtcbiAgICBjb25zdCBhc2NpaUFydCA9IGBcbiAgICAgXyAgICAgICAgICAgICAgICAgICAgICBfICAgICAgICAgICAgICAgICBfX19fIF8gICAgIF9fX1xuICAgIC8gXFxcXCAgIF8gX18gICBfXyBfIF8gICBffCB8IF9fIF8gXyBfXyAgICAgLyBfX198IHwgICB8XyBffFxuICAgLyDilrMgXFxcXCB8ICdfIFxcXFwgLyBfXFxgIHwgfCB8IHwgfC8gX1xcYCB8ICdfX3wgICB8IHwgICB8IHwgICAgfCB8XG4gIC8gX19fIFxcXFx8IHwgfCB8IChffCB8IHxffCB8IHwgKF98IHwgfCAgICAgIHwgfF9fX3wgfF9fXyB8IHxcbiAvXy8gICBcXFxcX1xcXFxffCB8X3xcXFxcX18sIHxcXFxcX18sX3xffFxcXFxfXyxffF98ICAgICAgIFxcXFxfX19ffF9fX19ffF9fX3xcbiAgICAgICAgICAgICAgICB8X19fL1xuICAgIGBcbiAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgIC5tYXAoKHgpID0+IGNvbG9ycy5yZWQoeCkpXG4gICAgICAuam9pbignXFxuJyk7XG5cbiAgICBsb2dnZXIuaW5mbyhhc2NpaUFydCk7XG4gICAgbG9nZ2VyLmluZm8oXG4gICAgICBgXG4gICAgICBBbmd1bGFyIENMSTogJHtuZ0NsaVZlcnNpb259XG4gICAgICBOb2RlOiAke3Byb2Nlc3MudmVyc2lvbnMubm9kZX0ke3Vuc3VwcG9ydGVkTm9kZVZlcnNpb24gPyAnIChVbnN1cHBvcnRlZCknIDogJyd9XG4gICAgICBQYWNrYWdlIE1hbmFnZXI6ICR7cGFja2FnZU1hbmFnZXIubmFtZX0gJHtwYWNrYWdlTWFuYWdlci52ZXJzaW9uID8/ICc8ZXJyb3I+J31cbiAgICAgIE9TOiAke3Byb2Nlc3MucGxhdGZvcm19ICR7cHJvY2Vzcy5hcmNofVxuXG4gICAgICBBbmd1bGFyOiAke2FuZ3VsYXJDb3JlVmVyc2lvbn1cbiAgICAgIC4uLiAke2FuZ3VsYXJTYW1lQXNDb3JlXG4gICAgICAgIC5yZWR1Y2U8c3RyaW5nW10+KChhY2MsIG5hbWUpID0+IHtcbiAgICAgICAgICAvLyBQZXJmb3JtIGEgc2ltcGxlIHdvcmQgd3JhcCBhcm91bmQgNjAuXG4gICAgICAgICAgaWYgKGFjYy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFtuYW1lXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgbGluZSA9IGFjY1thY2MubGVuZ3RoIC0gMV0gKyAnLCAnICsgbmFtZTtcbiAgICAgICAgICBpZiAobGluZS5sZW5ndGggPiA2MCkge1xuICAgICAgICAgICAgYWNjLnB1c2gobmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFjY1thY2MubGVuZ3RoIC0gMV0gPSBsaW5lO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH0sIFtdKVxuICAgICAgICAuam9pbignXFxuLi4uICcpfVxuXG4gICAgICBQYWNrYWdlJHtuYW1lUGFkLnNsaWNlKDcpfVZlcnNpb25cbiAgICAgIC0tLS0tLS0ke25hbWVQYWQucmVwbGFjZSgvIC9nLCAnLScpfS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgJHtPYmplY3Qua2V5cyh2ZXJzaW9ucylcbiAgICAgICAgLm1hcCgobW9kdWxlKSA9PiBgJHttb2R1bGV9JHtuYW1lUGFkLnNsaWNlKG1vZHVsZS5sZW5ndGgpfSR7dmVyc2lvbnNbbW9kdWxlXX1gKVxuICAgICAgICAuc29ydCgpXG4gICAgICAgIC5qb2luKCdcXG4nKX1cbiAgICBgLnJlcGxhY2UoL14gezZ9L2dtLCAnJyksXG4gICAgKTtcblxuICAgIGlmICh1bnN1cHBvcnRlZE5vZGVWZXJzaW9uKSB7XG4gICAgICBsb2dnZXIud2FybihcbiAgICAgICAgYFdhcm5pbmc6IFRoZSBjdXJyZW50IHZlcnNpb24gb2YgTm9kZSAoJHtwcm9jZXNzLnZlcnNpb25zLm5vZGV9KSBpcyBub3Qgc3VwcG9ydGVkIGJ5IEFuZ3VsYXIuYCxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRWZXJzaW9uKFxuICAgIG1vZHVsZU5hbWU6IHN0cmluZyxcbiAgICB3b3Jrc3BhY2VSZXF1aXJlOiBOb2RlUmVxdWlyZSxcbiAgICBsb2NhbFJlcXVpcmU6IE5vZGVSZXF1aXJlLFxuICApOiBzdHJpbmcge1xuICAgIGxldCBwYWNrYWdlSW5mbzogUGFydGlhbFBhY2thZ2VJbmZvIHwgdW5kZWZpbmVkO1xuICAgIGxldCBjbGlPbmx5ID0gZmFsc2U7XG5cbiAgICAvLyBUcnkgdG8gZmluZCB0aGUgcGFja2FnZSBpbiB0aGUgd29ya3NwYWNlXG4gICAgdHJ5IHtcbiAgICAgIHBhY2thZ2VJbmZvID0gd29ya3NwYWNlUmVxdWlyZShgJHttb2R1bGVOYW1lfS9wYWNrYWdlLmpzb25gKTtcbiAgICB9IGNhdGNoIHt9XG5cbiAgICAvLyBJZiBub3QgZm91bmQsIHRyeSB0byBmaW5kIHdpdGhpbiB0aGUgQ0xJXG4gICAgaWYgKCFwYWNrYWdlSW5mbykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGFja2FnZUluZm8gPSBsb2NhbFJlcXVpcmUoYCR7bW9kdWxlTmFtZX0vcGFja2FnZS5qc29uYCk7XG4gICAgICAgIGNsaU9ubHkgPSB0cnVlO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cblxuICAgIC8vIElmIGZvdW5kLCBhdHRlbXB0IHRvIGdldCB0aGUgdmVyc2lvblxuICAgIGlmIChwYWNrYWdlSW5mbykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHBhY2thZ2VJbmZvLnZlcnNpb24gKyAoY2xpT25seSA/ICcgKGNsaS1vbmx5KScgOiAnJyk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfVxuXG4gICAgcmV0dXJuICc8ZXJyb3I+JztcbiAgfVxufVxuIl19