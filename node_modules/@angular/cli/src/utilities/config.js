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
exports.isWarningEnabled = exports.getSchematicDefaults = exports.getConfiguredPackageManager = exports.getProjectByCwd = exports.validateWorkspace = exports.getWorkspaceRaw = exports.getWorkspace = exports.AngularWorkspace = exports.workspaceSchemaPath = void 0;
const core_1 = require("@angular-devkit/core");
const fs_1 = require("fs");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const find_up_1 = require("./find-up");
const json_file_1 = require("./json-file");
function isJsonObject(value) {
    return value !== undefined && core_1.json.isJsonObject(value);
}
function createWorkspaceHost() {
    return {
        readFile(path) {
            return fs_1.promises.readFile(path, 'utf-8');
        },
        async writeFile(path, data) {
            await fs_1.promises.writeFile(path, data);
        },
        async isDirectory(path) {
            try {
                const stats = await fs_1.promises.stat(path);
                return stats.isDirectory();
            }
            catch {
                return false;
            }
        },
        async isFile(path) {
            try {
                const stats = await fs_1.promises.stat(path);
                return stats.isFile();
            }
            catch {
                return false;
            }
        },
    };
}
exports.workspaceSchemaPath = path.join(__dirname, '../../lib/config/schema.json');
const configNames = ['angular.json', '.angular.json'];
const globalFileName = '.angular-config.json';
const defaultGlobalFilePath = path.join(os.homedir(), globalFileName);
function xdgConfigHome(home, configFile) {
    // https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html
    const xdgConfigHome = process.env['XDG_CONFIG_HOME'] || path.join(home, '.config');
    const xdgAngularHome = path.join(xdgConfigHome, 'angular');
    return configFile ? path.join(xdgAngularHome, configFile) : xdgAngularHome;
}
function xdgConfigHomeOld(home) {
    // Check the configuration files in the old location that should be:
    // - $XDG_CONFIG_HOME/.angular-config.json (if XDG_CONFIG_HOME is set)
    // - $HOME/.config/angular/.angular-config.json (otherwise)
    const p = process.env['XDG_CONFIG_HOME'] || path.join(home, '.config', 'angular');
    return path.join(p, '.angular-config.json');
}
function projectFilePath(projectPath) {
    // Find the configuration, either where specified, in the Angular CLI project
    // (if it's in node_modules) or from the current process.
    return ((projectPath && (0, find_up_1.findUp)(configNames, projectPath)) ||
        (0, find_up_1.findUp)(configNames, process.cwd()) ||
        (0, find_up_1.findUp)(configNames, __dirname));
}
function globalFilePath() {
    const home = os.homedir();
    if (!home) {
        return null;
    }
    // follow XDG Base Directory spec
    // note that createGlobalSettings() will continue creating
    // global file in home directory, with this user will have
    // choice to move change its location to meet XDG convention
    const xdgConfig = xdgConfigHome(home, 'config.json');
    if ((0, fs_1.existsSync)(xdgConfig)) {
        return xdgConfig;
    }
    // NOTE: This check is for the old configuration location, for more
    // information see https://github.com/angular/angular-cli/pull/20556
    const xdgConfigOld = xdgConfigHomeOld(home);
    if ((0, fs_1.existsSync)(xdgConfigOld)) {
        /* eslint-disable no-console */
        console.warn(`Old configuration location detected: ${xdgConfigOld}\n` +
            `Please move the file to the new location ~/.config/angular/config.json`);
        return xdgConfigOld;
    }
    if ((0, fs_1.existsSync)(defaultGlobalFilePath)) {
        return defaultGlobalFilePath;
    }
    return null;
}
class AngularWorkspace {
    constructor(workspace, filePath) {
        this.workspace = workspace;
        this.filePath = filePath;
        this.basePath = path.dirname(filePath);
    }
    get extensions() {
        return this.workspace.extensions;
    }
    get projects() {
        return this.workspace.projects;
    }
    // Temporary helper functions to support refactoring
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getCli() {
        return this.workspace.extensions['cli'];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getProjectCli(projectName) {
        const project = this.workspace.projects.get(projectName);
        return project?.extensions['cli'];
    }
    save() {
        return core_1.workspaces.writeWorkspace(this.workspace, createWorkspaceHost(), this.filePath, core_1.workspaces.WorkspaceFormat.JSON);
    }
    static async load(workspaceFilePath) {
        const result = await core_1.workspaces.readWorkspace(workspaceFilePath, createWorkspaceHost(), core_1.workspaces.WorkspaceFormat.JSON);
        return new AngularWorkspace(result.workspace, workspaceFilePath);
    }
}
exports.AngularWorkspace = AngularWorkspace;
const cachedWorkspaces = new Map();
async function getWorkspace(level) {
    if (cachedWorkspaces.has(level)) {
        return cachedWorkspaces.get(level);
    }
    const configPath = level === 'local' ? projectFilePath() : globalFilePath();
    if (!configPath) {
        if (level === 'global') {
            // Unlike a local config, a global config is not mandatory.
            // So we create an empty one in memory and keep it as such until it has been modified and saved.
            const globalWorkspace = new AngularWorkspace({ extensions: {}, projects: new core_1.workspaces.ProjectDefinitionCollection() }, defaultGlobalFilePath);
            cachedWorkspaces.set(level, globalWorkspace);
            return globalWorkspace;
        }
        cachedWorkspaces.set(level, undefined);
        return undefined;
    }
    try {
        const workspace = await AngularWorkspace.load(configPath);
        cachedWorkspaces.set(level, workspace);
        return workspace;
    }
    catch (error) {
        throw new Error(`Workspace config file cannot be loaded: ${configPath}` +
            `\n${error instanceof Error ? error.message : error}`);
    }
}
exports.getWorkspace = getWorkspace;
/**
 * This method will load the workspace configuration in raw JSON format.
 * When `level` is `global` and file doesn't exists, it will be created.
 *
 * NB: This method is intended to be used only for `ng config`.
 */
async function getWorkspaceRaw(level = 'local') {
    let configPath = level === 'local' ? projectFilePath() : globalFilePath();
    if (!configPath) {
        if (level === 'global') {
            configPath = defaultGlobalFilePath;
            // Config doesn't exist, force create it.
            const globalWorkspace = await getWorkspace('global');
            await globalWorkspace.save();
        }
        else {
            return [null, null];
        }
    }
    return [new json_file_1.JSONFile(configPath), configPath];
}
exports.getWorkspaceRaw = getWorkspaceRaw;
async function validateWorkspace(data, isGlobal) {
    const schema = (0, json_file_1.readAndParseJson)(exports.workspaceSchemaPath);
    // We should eventually have a dedicated global config schema and use that to validate.
    const schemaToValidate = isGlobal
        ? {
            '$ref': '#/definitions/global',
            definitions: schema['definitions'],
        }
        : schema;
    const { formats } = await Promise.resolve().then(() => __importStar(require('@angular-devkit/schematics')));
    const registry = new core_1.json.schema.CoreSchemaRegistry(formats.standardFormats);
    const validator = await registry.compile(schemaToValidate);
    const { success, errors } = await validator(data);
    if (!success) {
        throw new core_1.json.schema.SchemaValidationException(errors);
    }
}
exports.validateWorkspace = validateWorkspace;
function findProjectByPath(workspace, location) {
    const isInside = (base, potential) => {
        const absoluteBase = path.resolve(workspace.basePath, base);
        const absolutePotential = path.resolve(workspace.basePath, potential);
        const relativePotential = path.relative(absoluteBase, absolutePotential);
        if (!relativePotential.startsWith('..') && !path.isAbsolute(relativePotential)) {
            return true;
        }
        return false;
    };
    const projects = Array.from(workspace.projects)
        .map(([name, project]) => [project.root, name])
        .filter((tuple) => isInside(tuple[0], location))
        // Sort tuples by depth, with the deeper ones first. Since the first member is a path and
        // we filtered all invalid paths, the longest will be the deepest (and in case of equality
        // the sort is stable and the first declared project will win).
        .sort((a, b) => b[0].length - a[0].length);
    if (projects.length === 0) {
        return null;
    }
    else if (projects.length > 1) {
        const found = new Set();
        const sameRoots = projects.filter((v) => {
            if (!found.has(v[0])) {
                found.add(v[0]);
                return false;
            }
            return true;
        });
        if (sameRoots.length > 0) {
            // Ambiguous location - cannot determine a project
            return null;
        }
    }
    return projects[0][1];
}
function getProjectByCwd(workspace) {
    if (workspace.projects.size === 1) {
        // If there is only one project, return that one.
        return Array.from(workspace.projects.keys())[0];
    }
    const project = findProjectByPath(workspace, process.cwd());
    if (project) {
        return project;
    }
    return null;
}
exports.getProjectByCwd = getProjectByCwd;
async function getConfiguredPackageManager() {
    const getPackageManager = (source) => {
        if (isJsonObject(source)) {
            const value = source['packageManager'];
            if (value && typeof value === 'string') {
                return value;
            }
        }
        return null;
    };
    let result = null;
    const workspace = await getWorkspace('local');
    if (workspace) {
        const project = getProjectByCwd(workspace);
        if (project) {
            result = getPackageManager(workspace.projects.get(project)?.extensions['cli']);
        }
        result ?? (result = getPackageManager(workspace.extensions['cli']));
    }
    if (!result) {
        const globalOptions = await getWorkspace('global');
        result = getPackageManager(globalOptions?.extensions['cli']);
    }
    return result;
}
exports.getConfiguredPackageManager = getConfiguredPackageManager;
async function getSchematicDefaults(collection, schematic, project) {
    const result = {};
    const mergeOptions = (source) => {
        if (isJsonObject(source)) {
            // Merge options from the qualified name
            Object.assign(result, source[`${collection}:${schematic}`]);
            // Merge options from nested collection schematics
            const collectionOptions = source[collection];
            if (isJsonObject(collectionOptions)) {
                Object.assign(result, collectionOptions[schematic]);
            }
        }
    };
    // Global level schematic options
    const globalOptions = await getWorkspace('global');
    mergeOptions(globalOptions?.extensions['schematics']);
    const workspace = await getWorkspace('local');
    if (workspace) {
        // Workspace level schematic options
        mergeOptions(workspace.extensions['schematics']);
        project = project || getProjectByCwd(workspace);
        if (project) {
            // Project level schematic options
            mergeOptions(workspace.projects.get(project)?.extensions['schematics']);
        }
    }
    return result;
}
exports.getSchematicDefaults = getSchematicDefaults;
async function isWarningEnabled(warning) {
    const getWarning = (source) => {
        if (isJsonObject(source)) {
            const warnings = source['warnings'];
            if (isJsonObject(warnings)) {
                const value = warnings[warning];
                if (typeof value == 'boolean') {
                    return value;
                }
            }
        }
    };
    let result;
    const workspace = await getWorkspace('local');
    if (workspace) {
        const project = getProjectByCwd(workspace);
        if (project) {
            result = getWarning(workspace.projects.get(project)?.extensions['cli']);
        }
        result = result ?? getWarning(workspace.extensions['cli']);
    }
    if (result === undefined) {
        const globalOptions = await getWorkspace('global');
        result = getWarning(globalOptions?.extensions['cli']);
    }
    // All warnings are enabled by default
    return result ?? true;
}
exports.isWarningEnabled = isWarningEnabled;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL3V0aWxpdGllcy9jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwrQ0FBd0Q7QUFDeEQsMkJBQWdEO0FBQ2hELHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFFN0IsdUNBQW1DO0FBQ25DLDJDQUF5RDtBQUV6RCxTQUFTLFlBQVksQ0FBQyxLQUFpQztJQUNyRCxPQUFPLEtBQUssS0FBSyxTQUFTLElBQUksV0FBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBRUQsU0FBUyxtQkFBbUI7SUFDMUIsT0FBTztRQUNMLFFBQVEsQ0FBQyxJQUFJO1lBQ1gsT0FBTyxhQUFFLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBQ0QsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSTtZQUN4QixNQUFNLGFBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFDRCxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUk7WUFDcEIsSUFBSTtnQkFDRixNQUFNLEtBQUssR0FBRyxNQUFNLGFBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRWxDLE9BQU8sS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO2FBQzVCO1lBQUMsTUFBTTtnQkFDTixPQUFPLEtBQUssQ0FBQzthQUNkO1FBQ0gsQ0FBQztRQUNELEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSTtZQUNmLElBQUk7Z0JBQ0YsTUFBTSxLQUFLLEdBQUcsTUFBTSxhQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVsQyxPQUFP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Q0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQzVEO0lBRUQsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO1FBQ3hCLE1BQU0sYUFBYSxHQUFHLE1BQU0sWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sR0FBRyxVQUFVLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQ3ZEO0lBRUQsc0NBQXNDO0lBQ3RDLE9BQU8sTUFBTSxJQUFJLElBQUksQ0FBQztBQUN4QixDQUFDO0FBaENELDRDQWdDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBqc29uLCB3b3Jrc3BhY2VzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgcHJvbWlzZXMgYXMgZnMgfSBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBvcyBmcm9tICdvcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgUGFja2FnZU1hbmFnZXIgfSBmcm9tICcuLi8uLi9saWIvY29uZmlnL3dvcmtzcGFjZS1zY2hlbWEnO1xuaW1wb3J0IHsgZmluZFVwIH0gZnJvbSAnLi9maW5kLXVwJztcbmltcG9ydCB7IEpTT05GaWxlLCByZWFkQW5kUGFyc2VKc29uIH0gZnJvbSAnLi9qc29uLWZpbGUnO1xuXG5mdW5jdGlvbiBpc0pzb25PYmplY3QodmFsdWU6IGpzb24uSnNvblZhbHVlIHwgdW5kZWZpbmVkKTogdmFsdWUgaXMganNvbi5Kc29uT2JqZWN0IHtcbiAgcmV0dXJuIHZhbHVlICE9PSB1bmRlZmluZWQgJiYganNvbi5pc0pzb25PYmplY3QodmFsdWUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVXb3Jrc3BhY2VIb3N0KCk6IHdvcmtzcGFjZXMuV29ya3NwYWNlSG9zdCB7XG4gIHJldHVybiB7XG4gICAgcmVhZEZpbGUocGF0aCkge1xuICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlKHBhdGgsICd1dGYtOCcpO1xuICAgIH0sXG4gICAgYXN5bmMgd3JpdGVGaWxlKHBhdGgsIGRhdGEpIHtcbiAgICAgIGF3YWl0IGZzLndyaXRlRmlsZShwYXRoLCBkYXRhKTtcbiAgICB9LFxuICAgIGFzeW5jIGlzRGlyZWN0b3J5KHBhdGgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMuc3RhdChwYXRoKTtcblxuICAgICAgICByZXR1cm4gc3RhdHMuaXNEaXJlY3RvcnkoKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBpc0ZpbGUocGF0aCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5zdGF0KHBhdGgpO1xuXG4gICAgICAgIHJldHVybiBzdGF0cy5pc0ZpbGUoKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IHdvcmtzcGFjZVNjaGVtYVBhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vbGliL2NvbmZpZy9zY2hlbWEuanNvbicpO1xuXG5jb25zdCBjb25maWdOYW1lcyA9IFsnYW5ndWxhci5qc29uJywgJy5hbmd1bGFyLmpzb24nXTtcbmNvbnN0IGdsb2JhbEZpbGVOYW1lID0gJy5hbmd1bGFyLWNvbmZpZy5qc29uJztcbmNvbnN0IGRlZmF1bHRHbG9iYWxGaWxlUGF0aCA9IHBhdGguam9pbihvcy5ob21lZGlyKCksIGdsb2JhbEZpbGVOYW1lKTtcblxuZnVuY3Rpb24geGRnQ29uZmlnSG9tZShob21lOiBzdHJpbmcsIGNvbmZpZ0ZpbGU/OiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyBodHRwczovL3NwZWNpZmljYXRpb25zLmZyZWVkZXNrdG9wLm9yZy9iYXNlZGlyLXNwZWMvYmFzZWRpci1zcGVjLWxhdGVzdC5odG1sXG4gIGNvbnN0IHhkZ0NvbmZpZ0hvbWUgPSBwcm9jZXNzLmVudlsnWERHX0NPTkZJR19IT01FJ10gfHwgcGF0aC5qb2luKGhvbWUsICcuY29uZmlnJyk7XG4gIGNvbnN0IHhkZ0FuZ3VsYXJIb21lID0gcGF0aC5qb2luKHhkZ0NvbmZpZ0hvbWUsICdhbmd1bGFyJyk7XG5cbiAgcmV0dXJuIGNvbmZpZ0ZpbGUgPyBwYXRoLmpvaW4oeGRnQW5ndWxhckhvbWUsIGNvbmZpZ0ZpbGUpIDogeGRnQW5ndWxhckhvbWU7XG59XG5cbmZ1bmN0aW9uIHhkZ0NvbmZpZ0hvbWVPbGQoaG9tZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgLy8gQ2hlY2sgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZXMgaW4gdGhlIG9sZCBsb2NhdGlvbiB0aGF0IHNob3VsZCBiZTpcbiAgLy8gLSAkWERHX0NPTkZJR19IT01FLy5hbmd1bGFyLWNvbmZpZy5qc29uIChpZiBYREdfQ09ORklHX0hPTUUgaXMgc2V0KVxuICAvLyAtICRIT01FLy5jb25maWcvYW5ndWxhci8uYW5ndWxhci1jb25maWcuanNvbiAob3RoZXJ3aXNlKVxuICBjb25zdCBwID0gcHJvY2Vzcy5lbnZbJ1hER19DT05GSUdfSE9NRSddIHx8IHBhdGguam9pbihob21lLCAnLmNvbmZpZycsICdhbmd1bGFyJyk7XG5cbiAgcmV0dXJuIHBhdGguam9pbihwLCAnLmFuZ3VsYXItY29uZmlnLmpzb24nKTtcbn1cblxuZnVuY3Rpb24gcHJvamVjdEZpbGVQYXRoKHByb2plY3RQYXRoPzogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIC8vIEZpbmQgdGhlIGNvbmZpZ3VyYXRpb24sIGVpdGhlciB3aGVyZSBzcGVjaWZpZWQsIGluIHRoZSBBbmd1bGFyIENMSSBwcm9qZWN0XG4gIC8vIChpZiBpdCdzIGluIG5vZGVfbW9kdWxlcykgb3IgZnJvbSB0aGUgY3VycmVudCBwcm9jZXNzLlxuICByZXR1cm4gKFxuICAgIChwcm9qZWN0UGF0aCAmJiBmaW5kVXAoY29uZmlnTmFtZXMsIHByb2plY3RQYXRoKSkgfHxcbiAgICBmaW5kVXAoY29uZmlnTmFtZXMsIHByb2Nlc3MuY3dkKCkpIHx8XG4gICAgZmluZFVwKGNvbmZpZ05hbWVzLCBfX2Rpcm5hbWUpXG4gICk7XG59XG5cbmZ1bmN0aW9uIGdsb2JhbEZpbGVQYXRoKCk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBob21lID0gb3MuaG9tZWRpcigpO1xuICBpZiAoIWhvbWUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIGZvbGxvdyBYREcgQmFzZSBEaXJlY3Rvcnkgc3BlY1xuICAvLyBub3RlIHRoYXQgY3JlYXRlR2xvYmFsU2V0dGluZ3MoKSB3aWxsIGNvbnRpbnVlIGNyZWF0aW5nXG4gIC8vIGdsb2JhbCBmaWxlIGluIGhvbWUgZGlyZWN0b3J5LCB3aXRoIHRoaXMgdXNlciB3aWxsIGhhdmVcbiAgLy8gY2hvaWNlIHRvIG1vdmUgY2hhbmdlIGl0cyBsb2NhdGlvbiB0byBtZWV0IFhERyBjb252ZW50aW9uXG4gIGNvbnN0IHhkZ0NvbmZpZyA9IHhkZ0NvbmZpZ0hvbWUoaG9tZSwgJ2NvbmZpZy5qc29uJyk7XG4gIGlmIChleGlzdHNTeW5jKHhkZ0NvbmZpZykpIHtcbiAgICByZXR1cm4geGRnQ29uZmlnO1xuICB9XG4gIC8vIE5PVEU6IFRoaXMgY2hlY2sgaXMgZm9yIHRoZSBvbGQgY29uZmlndXJhdGlvbiBsb2NhdGlvbiwgZm9yIG1vcmVcbiAgLy8gaW5mb3JtYXRpb24gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXItY2xpL3B1bGwvMjA1NTZcbiAgY29uc3QgeGRnQ29uZmlnT2xkID0geGRnQ29uZmlnSG9tZU9sZChob21lKTtcbiAgaWYgKGV4aXN0c1N5bmMoeGRnQ29uZmlnT2xkKSkge1xuICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbiAgICBjb25zb2xlLndhcm4oXG4gICAgICBgT2xkIGNvbmZpZ3VyYXRpb24gbG9jYXRpb24gZGV0ZWN0ZWQ6ICR7eGRnQ29uZmlnT2xkfVxcbmAgK1xuICAgICAgICBgUGxlYXNlIG1vdmUgdGhlIGZpbGUgdG8gdGhlIG5ldyBsb2NhdGlvbiB+Ly5jb25maWcvYW5ndWxhci9jb25maWcuanNvbmAsXG4gICAgKTtcblxuICAgIHJldHVybiB4ZGdDb25maWdPbGQ7XG4gIH1cblxuICBpZiAoZXhpc3RzU3luYyhkZWZhdWx0R2xvYmFsRmlsZVBhdGgpKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRHbG9iYWxGaWxlUGF0aDtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgQW5ndWxhcldvcmtzcGFjZSB7XG4gIHJlYWRvbmx5IGJhc2VQYXRoOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB3b3Jrc3BhY2U6IHdvcmtzcGFjZXMuV29ya3NwYWNlRGVmaW5pdGlvbixcbiAgICByZWFkb25seSBmaWxlUGF0aDogc3RyaW5nLFxuICApIHtcbiAgICB0aGlzLmJhc2VQYXRoID0gcGF0aC5kaXJuYW1lKGZpbGVQYXRoKTtcbiAgfVxuXG4gIGdldCBleHRlbnNpb25zKCk6IFJlY29yZDxzdHJpbmcsIGpzb24uSnNvblZhbHVlIHwgdW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIHRoaXMud29ya3NwYWNlLmV4dGVuc2lvbnM7XG4gIH1cblxuICBnZXQgcHJvamVjdHMoKTogd29ya3NwYWNlcy5Qcm9qZWN0RGVmaW5pdGlvbkNvbGxlY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLndvcmtzcGFjZS5wcm9qZWN0cztcbiAgfVxuXG4gIC8vIFRlbXBvcmFyeSBoZWxwZXIgZnVuY3Rpb25zIHRvIHN1cHBvcnQgcmVmYWN0b3JpbmdcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBnZXRDbGkoKTogUmVjb3JkPHN0cmluZywgYW55PiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMud29ya3NwYWNlLmV4dGVuc2lvbnNbJ2NsaSddIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgZ2V0UHJvamVjdENsaShwcm9qZWN0TmFtZTogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgYW55PiB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgcHJvamVjdCA9IHRoaXMud29ya3NwYWNlLnByb2plY3RzLmdldChwcm9qZWN0TmFtZSk7XG5cbiAgICByZXR1cm4gcHJvamVjdD8uZXh0ZW5zaW9uc1snY2xpJ10gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gIH1cblxuICBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB3b3Jrc3BhY2VzLndyaXRlV29ya3NwYWNlKFxuICAgICAgdGhpcy53b3Jrc3BhY2UsXG4gICAgICBjcmVhdGVXb3Jrc3BhY2VIb3N0KCksXG4gICAgICB0aGlzLmZpbGVQYXRoLFxuICAgICAgd29ya3NwYWNlcy5Xb3Jrc3BhY2VGb3JtYXQuSlNPTixcbiAgICApO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIGxvYWQod29ya3NwYWNlRmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8QW5ndWxhcldvcmtzcGFjZT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHdvcmtzcGFjZXMucmVhZFdvcmtzcGFjZShcbiAgICAgIHdvcmtzcGFjZUZpbGVQYXRoLFxuICAgICAgY3JlYXRlV29ya3NwYWNlSG9zdCgpLFxuICAgICAgd29ya3NwYWNlcy5Xb3Jrc3BhY2VGb3JtYXQuSlNPTixcbiAgICApO1xuXG4gICAgcmV0dXJuIG5ldyBBbmd1bGFyV29ya3NwYWNlKHJlc3VsdC53b3Jrc3BhY2UsIHdvcmtzcGFjZUZpbGVQYXRoKTtcbiAgfVxufVxuXG5jb25zdCBjYWNoZWRXb3Jrc3BhY2VzID0gbmV3IE1hcDxzdHJpbmcsIEFuZ3VsYXJXb3Jrc3BhY2UgfCB1bmRlZmluZWQ+KCk7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRXb3Jrc3BhY2UobGV2ZWw6ICdnbG9iYWwnKTogUHJvbWlzZTxBbmd1bGFyV29ya3NwYWNlPjtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRXb3Jrc3BhY2UobGV2ZWw6ICdsb2NhbCcpOiBQcm9taXNlPEFuZ3VsYXJXb3Jrc3BhY2UgfCB1bmRlZmluZWQ+O1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFdvcmtzcGFjZShcbiAgbGV2ZWw6ICdsb2NhbCcgfCAnZ2xvYmFsJyxcbik6IFByb21pc2U8QW5ndWxhcldvcmtzcGFjZSB8IHVuZGVmaW5lZD47XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRXb3Jrc3BhY2UoXG4gIGxldmVsOiAnbG9jYWwnIHwgJ2dsb2JhbCcsXG4pOiBQcm9taXNlPEFuZ3VsYXJXb3Jrc3BhY2UgfCB1bmRlZmluZWQ+IHtcbiAgaWYgKGNhY2hlZFdvcmtzcGFjZXMuaGFzKGxldmVsKSkge1xuICAgIHJldHVybiBjYWNoZWRXb3Jrc3BhY2VzLmdldChsZXZlbCk7XG4gIH1cblxuICBjb25zdCBjb25maWdQYXRoID0gbGV2ZWwgPT09ICdsb2NhbCcgPyBwcm9qZWN0RmlsZVBhdGgoKSA6IGdsb2JhbEZpbGVQYXRoKCk7XG4gIGlmICghY29uZmlnUGF0aCkge1xuICAgIGlmIChsZXZlbCA9PT0gJ2dsb2JhbCcpIHtcbiAgICAgIC8vIFVubGlrZSBhIGxvY2FsIGNvbmZpZywgYSBnbG9iYWwgY29uZmlnIGlzIG5vdCBtYW5kYXRvcnkuXG4gICAgICAvLyBTbyB3ZSBjcmVhdGUgYW4gZW1wdHkgb25lIGluIG1lbW9yeSBhbmQga2VlcCBpdCBhcyBzdWNoIHVudGlsIGl0IGhhcyBiZWVuIG1vZGlmaWVkIGFuZCBzYXZlZC5cbiAgICAgIGNvbnN0IGdsb2JhbFdvcmtzcGFjZSA9IG5ldyBBbmd1bGFyV29ya3NwYWNlKFxuICAgICAgICB7IGV4dGVuc2lvbnM6IHt9LCBwcm9qZWN0czogbmV3IHdvcmtzcGFjZXMuUHJvamVjdERlZmluaXRpb25Db2xsZWN0aW9uKCkgfSxcbiAgICAgICAgZGVmYXVsdEdsb2JhbEZpbGVQYXRoLFxuICAgICAgKTtcblxuICAgICAgY2FjaGVkV29ya3NwYWNlcy5zZXQobGV2ZWwsIGdsb2JhbFdvcmtzcGFjZSk7XG5cbiAgICAgIHJldHVybiBnbG9iYWxXb3Jrc3BhY2U7XG4gICAgfVxuXG4gICAgY2FjaGVkV29ya3NwYWNlcy5zZXQobGV2ZWwsIHVuZGVmaW5lZCk7XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBhd2FpdCBBbmd1bGFyV29ya3NwYWNlLmxvYWQoY29uZmlnUGF0aCk7XG4gICAgY2FjaGVkV29ya3NwYWNlcy5zZXQobGV2ZWwsIHdvcmtzcGFjZSk7XG5cbiAgICByZXR1cm4gd29ya3NwYWNlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBXb3Jrc3BhY2UgY29uZmlnIGZpbGUgY2Fubm90IGJlIGxvYWRlZDogJHtjb25maWdQYXRofWAgK1xuICAgICAgICBgXFxuJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWAsXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgbWV0aG9kIHdpbGwgbG9hZCB0aGUgd29ya3NwYWNlIGNvbmZpZ3VyYXRpb24gaW4gcmF3IEpTT04gZm9ybWF0LlxuICogV2hlbiBgbGV2ZWxgIGlzIGBnbG9iYWxgIGFuZCBmaWxlIGRvZXNuJ3QgZXhpc3RzLCBpdCB3aWxsIGJlIGNyZWF0ZWQuXG4gKlxuICogTkI6IFRoaXMgbWV0aG9kIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgb25seSBmb3IgYG5nIGNvbmZpZ2AuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRXb3Jrc3BhY2VSYXcoXG4gIGxldmVsOiAnbG9jYWwnIHwgJ2dsb2JhbCcgPSAnbG9jYWwnLFxuKTogUHJvbWlzZTxbSlNPTkZpbGUgfCBudWxsLCBzdHJpbmcgfCBudWxsXT4ge1xuICBsZXQgY29uZmlnUGF0aCA9IGxldmVsID09PSAnbG9jYWwnID8gcHJvamVjdEZpbGVQYXRoKCkgOiBnbG9iYWxGaWxlUGF0aCgpO1xuXG4gIGlmICghY29uZmlnUGF0aCkge1xuICAgIGlmIChsZXZlbCA9PT0gJ2dsb2JhbCcpIHtcbiAgICAgIGNvbmZpZ1BhdGggPSBkZWZhdWx0R2xvYmFsRmlsZVBhdGg7XG4gICAgICAvLyBDb25maWcgZG9lc24ndCBleGlzdCwgZm9yY2UgY3JlYXRlIGl0LlxuXG4gICAgICBjb25zdCBnbG9iYWxXb3Jrc3BhY2UgPSBhd2FpdCBnZXRXb3Jrc3BhY2UoJ2dsb2JhbCcpO1xuICAgICAgYXdhaXQgZ2xvYmFsV29ya3NwYWNlLnNhdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtudWxsLCBudWxsXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW25ldyBKU09ORmlsZShjb25maWdQYXRoKSwgY29uZmlnUGF0aF07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2YWxpZGF0ZVdvcmtzcGFjZShkYXRhOiBqc29uLkpzb25PYmplY3QsIGlzR2xvYmFsOiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHNjaGVtYSA9IHJlYWRBbmRQYXJzZUpzb24od29ya3NwYWNlU2NoZW1hUGF0aCk7XG5cbiAgLy8gV2Ugc2hvdWxkIGV2ZW50dWFsbHkgaGF2ZSBhIGRlZGljYXRlZCBnbG9iYWwgY29uZmlnIHNjaGVtYSBhbmQgdXNlIHRoYXQgdG8gdmFsaWRhdGUuXG4gIGNvbnN0IHNjaGVtYVRvVmFsaWRhdGU6IGpzb24uc2NoZW1hLkpzb25TY2hlbWEgPSBpc0dsb2JhbFxuICAgID8ge1xuICAgICAgICAnJHJlZic6ICcjL2RlZmluaXRpb25zL2dsb2JhbCcsXG4gICAgICAgIGRlZmluaXRpb25zOiBzY2hlbWFbJ2RlZmluaXRpb25zJ10sXG4gICAgICB9XG4gICAgOiBzY2hlbWE7XG5cbiAgY29uc3QgeyBmb3JtYXRzIH0gPSBhd2FpdCBpbXBvcnQoJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJyk7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gbmV3IGpzb24uc2NoZW1hLkNvcmVTY2hlbWFSZWdpc3RyeShmb3JtYXRzLnN0YW5kYXJkRm9ybWF0cyk7XG4gIGNvbnN0IHZhbGlkYXRvciA9IGF3YWl0IHJlZ2lzdHJ5LmNvbXBpbGUoc2NoZW1hVG9WYWxpZGF0ZSk7XG4gIGNvbnN0IHsgc3VjY2VzcywgZXJyb3JzIH0gPSBhd2FpdCB2YWxpZGF0b3IoZGF0YSk7XG4gIGlmICghc3VjY2Vzcykge1xuICAgIHRocm93IG5ldyBqc29uLnNjaGVtYS5TY2hlbWFWYWxpZGF0aW9uRXhjZXB0aW9uKGVycm9ycyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZFByb2plY3RCeVBhdGgod29ya3NwYWNlOiBBbmd1bGFyV29ya3NwYWNlLCBsb2NhdGlvbjogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGlzSW5zaWRlID0gKGJhc2U6IHN0cmluZywgcG90ZW50aWFsOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbiAgICBjb25zdCBhYnNvbHV0ZUJhc2UgPSBwYXRoLnJlc29sdmUod29ya3NwYWNlLmJhc2VQYXRoLCBiYXNlKTtcbiAgICBjb25zdCBhYnNvbHV0ZVBvdGVudGlhbCA9IHBhdGgucmVzb2x2ZSh3b3Jrc3BhY2UuYmFzZVBhdGgsIHBvdGVudGlhbCk7XG4gICAgY29uc3QgcmVsYXRpdmVQb3RlbnRpYWwgPSBwYXRoLnJlbGF0aXZlKGFic29sdXRlQmFzZSwgYWJzb2x1dGVQb3RlbnRpYWwpO1xuICAgIGlmICghcmVsYXRpdmVQb3RlbnRpYWwuc3RhcnRzV2l0aCgnLi4nKSAmJiAhcGF0aC5pc0Fic29sdXRlKHJlbGF0aXZlUG90ZW50aWFsKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIGNvbnN0IHByb2plY3RzID0gQXJyYXkuZnJvbSh3b3Jrc3BhY2UucHJvamVjdHMpXG4gICAgLm1hcCgoW25hbWUsIHByb2plY3RdKSA9PiBbcHJvamVjdC5yb290LCBuYW1lXSBhcyBbc3RyaW5nLCBzdHJpbmddKVxuICAgIC5maWx0ZXIoKHR1cGxlKSA9PiBpc0luc2lkZSh0dXBsZVswXSwgbG9jYXRpb24pKVxuICAgIC8vIFNvcnQgdHVwbGVzIGJ5IGRlcHRoLCB3aXRoIHRoZSBkZWVwZXIgb25lcyBmaXJzdC4gU2luY2UgdGhlIGZpcnN0IG1lbWJlciBpcyBhIHBhdGggYW5kXG4gICAgLy8gd2UgZmlsdGVyZWQgYWxsIGludmFsaWQgcGF0aHMsIHRoZSBsb25nZXN0IHdpbGwgYmUgdGhlIGRlZXBlc3QgKGFuZCBpbiBjYXNlIG9mIGVxdWFsaXR5XG4gICAgLy8gdGhlIHNvcnQgaXMgc3RhYmxlIGFuZCB0aGUgZmlyc3QgZGVjbGFyZWQgcHJvamVjdCB3aWxsIHdpbikuXG4gICAgLnNvcnQoKGEsIGIpID0+IGJbMF0ubGVuZ3RoIC0gYVswXS5sZW5ndGgpO1xuXG4gIGlmIChwcm9qZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSBlbHNlIGlmIChwcm9qZWN0cy5sZW5ndGggPiAxKSB7XG4gICAgY29uc3QgZm91bmQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBzYW1lUm9vdHMgPSBwcm9qZWN0cy5maWx0ZXIoKHYpID0+IHtcbiAgICAgIGlmICghZm91bmQuaGFzKHZbMF0pKSB7XG4gICAgICAgIGZvdW5kLmFkZCh2WzBdKTtcblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIGlmIChzYW1lUm9vdHMubGVuZ3RoID4gMCkge1xuICAgICAgLy8gQW1iaWd1b3VzIGxvY2F0aW9uIC0gY2Fubm90IGRldGVybWluZSBhIHByb2plY3RcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwcm9qZWN0c1swXVsxXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RCeUN3ZCh3b3Jrc3BhY2U6IEFuZ3VsYXJXb3Jrc3BhY2UpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHdvcmtzcGFjZS5wcm9qZWN0cy5zaXplID09PSAxKSB7XG4gICAgLy8gSWYgdGhlcmUgaXMgb25seSBvbmUgcHJvamVjdCwgcmV0dXJuIHRoYXQgb25lLlxuICAgIHJldHVybiBBcnJheS5mcm9tKHdvcmtzcGFjZS5wcm9qZWN0cy5rZXlzKCkpWzBdO1xuICB9XG5cbiAgY29uc3QgcHJvamVjdCA9IGZpbmRQcm9qZWN0QnlQYXRoKHdvcmtzcGFjZSwgcHJvY2Vzcy5jd2QoKSk7XG4gIGlmIChwcm9qZWN0KSB7XG4gICAgcmV0dXJuIHByb2plY3Q7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvbmZpZ3VyZWRQYWNrYWdlTWFuYWdlcigpOiBQcm9taXNlPFBhY2thZ2VNYW5hZ2VyIHwgbnVsbD4ge1xuICBjb25zdCBnZXRQYWNrYWdlTWFuYWdlciA9IChzb3VyY2U6IGpzb24uSnNvblZhbHVlIHwgdW5kZWZpbmVkKTogUGFja2FnZU1hbmFnZXIgfCBudWxsID0+IHtcbiAgICBpZiAoaXNKc29uT2JqZWN0KHNvdXJjZSkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gc291cmNlWydwYWNrYWdlTWFuYWdlciddO1xuICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIGFzIFBhY2thZ2VNYW5hZ2VyO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG4gIGxldCByZXN1bHQ6IFBhY2thZ2VNYW5hZ2VyIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IGdldFdvcmtzcGFjZSgnbG9jYWwnKTtcbiAgaWYgKHdvcmtzcGFjZSkge1xuICAgIGNvbnN0IHByb2plY3QgPSBnZXRQcm9qZWN0QnlDd2Qod29ya3NwYWNlKTtcbiAgICBpZiAocHJvamVjdCkge1xuICAgICAgcmVzdWx0ID0gZ2V0UGFja2FnZU1hbmFnZXIod29ya3NwYWNlLnByb2plY3RzLmdldChwcm9qZWN0KT8uZXh0ZW5zaW9uc1snY2xpJ10pO1xuICAgIH1cblxuICAgIHJlc3VsdCA/Pz0gZ2V0UGFja2FnZU1hbmFnZXIod29ya3NwYWNlLmV4dGVuc2lvbnNbJ2NsaSddKTtcbiAgfVxuXG4gIGlmICghcmVzdWx0KSB7XG4gICAgY29uc3QgZ2xvYmFsT3B0aW9ucyA9IGF3YWl0IGdldFdvcmtzcGFjZSgnZ2xvYmFsJyk7XG4gICAgcmVzdWx0ID0gZ2V0UGFja2FnZU1hbmFnZXIoZ2xvYmFsT3B0aW9ucz8uZXh0ZW5zaW9uc1snY2xpJ10pO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNjaGVtYXRpY0RlZmF1bHRzKFxuICBjb2xsZWN0aW9uOiBzdHJpbmcsXG4gIHNjaGVtYXRpYzogc3RyaW5nLFxuICBwcm9qZWN0Pzogc3RyaW5nIHwgbnVsbCxcbik6IFByb21pc2U8e30+IHtcbiAgY29uc3QgcmVzdWx0ID0ge307XG4gIGNvbnN0IG1lcmdlT3B0aW9ucyA9IChzb3VyY2U6IGpzb24uSnNvblZhbHVlIHwgdW5kZWZpbmVkKTogdm9pZCA9PiB7XG4gICAgaWYgKGlzSnNvbk9iamVjdChzb3VyY2UpKSB7XG4gICAgICAvLyBNZXJnZSBvcHRpb25zIGZyb20gdGhlIHF1YWxpZmllZCBuYW1lXG4gICAgICBPYmplY3QuYXNzaWduKHJlc3VsdCwgc291cmNlW2Ake2NvbGxlY3Rpb259OiR7c2NoZW1hdGljfWBdKTtcblxuICAgICAgLy8gTWVyZ2Ugb3B0aW9ucyBmcm9tIG5lc3RlZCBjb2xsZWN0aW9uIHNjaGVtYXRpY3NcbiAgICAgIGNvbnN0IGNvbGxlY3Rpb25PcHRpb25zID0gc291cmNlW2NvbGxlY3Rpb25dO1xuICAgICAgaWYgKGlzSnNvbk9iamVjdChjb2xsZWN0aW9uT3B0aW9ucykpIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihyZXN1bHQsIGNvbGxlY3Rpb25PcHRpb25zW3NjaGVtYXRpY10pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBHbG9iYWwgbGV2ZWwgc2NoZW1hdGljIG9wdGlvbnNcbiAgY29uc3QgZ2xvYmFsT3B0aW9ucyA9IGF3YWl0IGdldFdvcmtzcGFjZSgnZ2xvYmFsJyk7XG4gIG1lcmdlT3B0aW9ucyhnbG9iYWxPcHRpb25zPy5leHRlbnNpb25zWydzY2hlbWF0aWNzJ10pO1xuXG4gIGNvbnN0IHdvcmtzcGFjZSA9IGF3YWl0IGdldFdvcmtzcGFjZSgnbG9jYWwnKTtcbiAgaWYgKHdvcmtzcGFjZSkge1xuICAgIC8vIFdvcmtzcGFjZSBsZXZlbCBzY2hlbWF0aWMgb3B0aW9uc1xuICAgIG1lcmdlT3B0aW9ucyh3b3Jrc3BhY2UuZXh0ZW5zaW9uc1snc2NoZW1hdGljcyddKTtcblxuICAgIHByb2plY3QgPSBwcm9qZWN0IHx8IGdldFByb2plY3RCeUN3ZCh3b3Jrc3BhY2UpO1xuICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICAvLyBQcm9qZWN0IGxldmVsIHNjaGVtYXRpYyBvcHRpb25zXG4gICAgICBtZXJnZU9wdGlvbnMod29ya3NwYWNlLnByb2plY3RzLmdldChwcm9qZWN0KT8uZXh0ZW5zaW9uc1snc2NoZW1hdGljcyddKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaXNXYXJuaW5nRW5hYmxlZCh3YXJuaW5nOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgY29uc3QgZ2V0V2FybmluZyA9IChzb3VyY2U6IGpzb24uSnNvblZhbHVlIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB8IHVuZGVmaW5lZCA9PiB7XG4gICAgaWYgKGlzSnNvbk9iamVjdChzb3VyY2UpKSB7XG4gICAgICBjb25zdCB3YXJuaW5ncyA9IHNvdXJjZVsnd2FybmluZ3MnXTtcbiAgICAgIGlmIChpc0pzb25PYmplY3Qod2FybmluZ3MpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gd2FybmluZ3Nbd2FybmluZ107XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGxldCByZXN1bHQ6IGJvb2xlYW4gfCB1bmRlZmluZWQ7XG5cbiAgY29uc3Qgd29ya3NwYWNlID0gYXdhaXQgZ2V0V29ya3NwYWNlKCdsb2NhbCcpO1xuICBpZiAod29ya3NwYWNlKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IGdldFByb2plY3RCeUN3ZCh3b3Jrc3BhY2UpO1xuICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICByZXN1bHQgPSBnZXRXYXJuaW5nKHdvcmtzcGFjZS5wcm9qZWN0cy5nZXQocHJvamVjdCk/LmV4dGVuc2lvbnNbJ2NsaSddKTtcbiAgICB9XG5cbiAgICByZXN1bHQgPSByZXN1bHQgPz8gZ2V0V2FybmluZyh3b3Jrc3BhY2UuZXh0ZW5zaW9uc1snY2xpJ10pO1xuICB9XG5cbiAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgZ2xvYmFsT3B0aW9ucyA9IGF3YWl0IGdldFdvcmtzcGFjZSgnZ2xvYmFsJyk7XG4gICAgcmVzdWx0ID0gZ2V0V2FybmluZyhnbG9iYWxPcHRpb25zPy5leHRlbnNpb25zWydjbGknXSk7XG4gIH1cblxuICAvLyBBbGwgd2FybmluZ3MgYXJlIGVuYWJsZWQgYnkgZGVmYXVsdFxuICByZXR1cm4gcmVzdWx0ID8/IHRydWU7XG59XG4iXX0=