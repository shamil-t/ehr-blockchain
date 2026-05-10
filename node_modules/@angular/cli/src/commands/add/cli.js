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
const core_1 = require("@angular-devkit/core");
const tools_1 = require("@angular-devkit/schematics/tools");
const module_1 = require("module");
const npm_package_arg_1 = __importDefault(require("npm-package-arg"));
const path_1 = require("path");
const semver_1 = require("semver");
const workspace_schema_1 = require("../../../lib/config/workspace-schema");
const schematics_command_module_1 = require("../../command-builder/schematics-command-module");
const color_1 = require("../../utilities/color");
const error_1 = require("../../utilities/error");
const package_metadata_1 = require("../../utilities/package-metadata");
const prompt_1 = require("../../utilities/prompt");
const spinner_1 = require("../../utilities/spinner");
const tty_1 = require("../../utilities/tty");
const version_1 = require("../../utilities/version");
/**
 * The set of packages that should have certain versions excluded from consideration
 * when attempting to find a compatible version for a package.
 * The key is a package name and the value is a SemVer range of versions to exclude.
 */
const packageVersionExclusions = {
    // @angular/localize@9.x and earlier versions as well as @angular/localize@10.0 prereleases do not have peer dependencies setup.
    '@angular/localize': '<10.0.0',
    // @angular/material@7.x versions have unbounded peer dependency ranges (>=7.0.0).
    '@angular/material': '7.x',
};
class AddCommadModule extends schematics_command_module_1.SchematicsCommandModule {
    constructor() {
        super(...arguments);
        this.command = 'add <collection>';
        this.describe = 'Adds support for an external library to your project.';
        this.longDescriptionPath = (0, path_1.join)(__dirname, 'long-description.md');
        this.allowPrivateSchematics = true;
        this.schematicName = 'ng-add';
        this.rootRequire = (0, module_1.createRequire)(this.context.root + '/');
    }
    async builder(argv) {
        const localYargs = (await super.builder(argv))
            .positional('collection', {
            description: 'The package to be added.',
            type: 'string',
            demandOption: true,
        })
            .option('registry', { description: 'The NPM registry to use.', type: 'string' })
            .option('verbose', {
            description: 'Display additional details about internal operations during execution.',
            type: 'boolean',
            default: false,
        })
            .option('skip-confirmation', {
            description: 'Skip asking a confirmation prompt before installing and executing the package. ' +
                'Ensure package name is correct prior to using this option.',
            type: 'boolean',
            default: false,
        })
            // Prior to downloading we don't know the full schema and therefore we cannot be strict on the options.
            // Possibly in the future update the logic to use the following syntax:
            // `ng add @angular/localize -- --package-options`.
            .strict(false);
        const collectionName = await this.getCollectionName();
        const workflow = await this.getOrCreateWorkflowForBuilder(collectionName);
        try {
            const collection = workflow.engine.createCollection(collectionName);
            const options = await this.getSchematicOptions(collection, this.schematicName, workflow);
            return this.addSchemaOptionsToCommand(localYargs, options);
        }
        catch (error) {
            // During `ng add` prior to the downloading of the package
            // we are not able to resolve and create a collection.
            // Or when the the collection value is a path to a tarball.
        }
        return localYargs;
    }
    // eslint-disable-next-line max-lines-per-function
    async run(options) {
        const { logger, packageManager } = this.context;
        const { verbose, registry, collection, skipConfirmation } = options;
        packageManager.ensureCompatibility();
        let packageIdentifier;
        try {
            packageIdentifier = (0, npm_package_arg_1.default)(collection);
        }
        catch (e) {
            (0, error_1.assertIsError)(e);
            logger.error(e.message);
            return 1;
        }
        if (packageIdentifier.name &&
            packageIdentifier.registry &&
            this.isPackageInstalled(packageIdentifier.name)) {
            const validVersion = await this.isProjectVersionValid(packageIdentifier);
            if (validVersion) {
                // Already installed so just run schematic
                logger.info('Skipping installation: Package already installed');
                return this.executeSchematic({ ...options, collection: packageIdentifier.name });
            }
        }
        const spinner = new spinner_1.Spinner();
        spinner.start('Determining package manager...');
        const usingYarn = packageManager.name === workspace_schema_1.PackageManager.Yarn;
        spinner.info(`Using package manager: ${color_1.colors.grey(packageManager.name)}`);
        if (packageIdentifier.name &&
            packageIdentifier.type === 'range' &&
            packageIdentifier.rawSpec === '*') {
            // only package name provided; search for viable version
            // plus special cases for packages that did not have peer deps setup
            spinner.start('Searching for compatible package version...');
            let packageMetadata;
            try {
                packageMetadata = await (0, package_metadata_1.fetchPackageMetadata)(packageIdentifier.name, logger, {
                    registry,
                    usingYarn,
                    verbose,
                });
            }
            catch (e) {
                (0, error_1.assertIsError)(e);
                spinner.fail(`Unable to load package information from registry: ${e.message}`);
                return 1;
            }
            // Start with the version tagged as `latest` if it exists
            const latestManifest = packageMetadata.tags['latest'];
            if (latestManifest) {
                packageIdentifier = npm_package_arg_1.default.resolve(latestManifest.name, latestManifest.version);
            }
            // Adjust the version based on name and peer dependencies
            if (latestManifest?.peerDependencies &&
                Object.keys(latestManifest.peerDependencies).length === 0) {
                spinner.succeed(`Found compatible package version: ${color_1.colors.grey(packageIdentifier.toString())}.`);
            }
            else if (!latestManifest || (await this.hasMismatchedPeer(latestManifest))) {
                // 'latest' is invalid so search for most recent matching package
                // Allow prelease versions if the CLI itself is a prerelease
                const allowPrereleases = (0, semver_1.prerelease)(version_1.VERSION.full);
                const versionExclusions = packageVersionExclusions[packageMetadata.name];
                const versionManifests = Object.values(packageMetadata.versions).filter((value) => {
                    // Prerelease versions are not stable and should not be considered by default
                    if (!allowPrereleases && (0, semver_1.prerelease)(value.version)) {
                        return false;
                    }
                    // Deprecated versions should not be used or considered
                    if (value.deprecated) {
                        return false;
                    }
                    // Excluded package versions should not be considered
                    if (versionExclusions &&
                        (0, semver_1.satisfies)(value.version, versionExclusions, { includePrerelease: true })) {
                        return false;
                    }
                    return true;
                });
                // Sort in reverse SemVer order so that the newest compatible version is chosen
                versionManifests.sort((a, b) => (0, semver_1.compare)(b.version, a.version, true));
                let newIdentifier;
                for (const versionManifest of versionManifests) {
                    if (!(await this.hasMismatchedPeer(versionManifest))) {
                        newIdentifier = npm_package_arg_1.default.resolve(versionManifest.name, versionManifest.version);
                        break;
                    }
                }
                if (!newIdentifier) {
                    spinner.warn("Unable to find compatible package. Using 'latest' tag.");
                }
                else {
                    packageIdentifier = newIdentifier;
                    spinner.succeed(`Found compatible package version: ${color_1.colors.grey(packageIdentifier.toString())}.`);
                }
            }
            else {
                spinner.succeed(`Found compatible package version: ${color_1.colors.grey(packageIdentifier.toString())}.`);
            }
        }
        let collectionName = packageIdentifier.name;
        let savePackage;
        try {
            spinner.start('Loading package information from registry...');
            const manifest = await (0, package_metadata_1.fetchPackageManifest)(packageIdentifier.toString(), logger, {
                registry,
                verbose,
                usingYarn,
            });
            savePackage = manifest['ng-add']?.save;
            collectionName = manifest.name;
            if (await this.hasMismatchedPeer(manifest)) {
                spinner.warn('Package has unmet peer dependencies. Adding the package may not succeed.');
            }
            else {
                spinner.succeed(`Package information loaded.`);
            }
        }
        catch (e) {
            (0, error_1.assertIsError)(e);
            spinner.fail(`Unable to fetch package information for '${packageIdentifier}': ${e.message}`);
            return 1;
        }
        if (!skipConfirmation) {
            const confirmationResponse = await (0, prompt_1.askConfirmation)(`\nThe package ${color_1.colors.blue(packageIdentifier.raw)} will be installed and executed.\n` +
                'Would you like to proceed?', true, false);
            if (!confirmationResponse) {
                if (!(0, tty_1.isTTY)()) {
                    logger.error('No terminal detected. ' +
                        `'--skip-confirmation' can be used to bypass installation confirmation. ` +
                        `Ensure package name is correct prior to '--skip-confirmation' option usage.`);
                }
                logger.error('Command aborted.');
                return 1;
            }
        }
        if (savePackage === false) {
            // Temporary packages are located in a different directory
            // Hence we need to resolve them using the temp path
            const { success, tempNodeModules } = await packageManager.installTemp(packageIdentifier.raw, registry ? [`--registry="${registry}"`] : undefined);
            const tempRequire = (0, module_1.createRequire)(tempNodeModules + '/');
            const resolvedCollectionPath = tempRequire.resolve((0, path_1.join)(collectionName, 'package.json'));
            if (!success) {
                return 1;
            }
            collectionName = (0, path_1.dirname)(resolvedCollectionPath);
        }
        else {
            const success = await packageManager.install(packageIdentifier.raw, savePackage, registry ? [`--registry="${registry}"`] : undefined);
            if (!success) {
                return 1;
            }
        }
        return this.executeSchematic({ ...options, collection: collectionName });
    }
    async isProjectVersionValid(packageIdentifier) {
        if (!packageIdentifier.name) {
            return false;
        }
        const installedVersion = await this.findProjectVersion(packageIdentifier.name);
        if (!installedVersion) {
            return false;
        }
        if (packageIdentifier.rawSpec === '*') {
            return true;
        }
        if (packageIdentifier.type === 'range' &&
            packageIdentifier.fetchSpec &&
            packageIdentifier.fetchSpec !== '*') {
            return (0, semver_1.satisfies)(installedVersion, packageIdentifier.fetchSpec);
        }
        if (packageIdentifier.type === 'version') {
            const v1 = (0, semver_1.valid)(packageIdentifier.fetchSpec);
            const v2 = (0, semver_1.valid)(installedVersion);
            return v1 !== null && v1 === v2;
        }
        return false;
    }
    async getCollectionName() {
        const [, collectionName] = this.context.args.positional;
        return collectionName;
    }
    isPackageInstalled(name) {
        try {
            this.rootRequire.resolve((0, path_1.join)(name, 'package.json'));
            return true;
        }
        catch (e) {
            (0, error_1.assertIsError)(e);
            if (e.code !== 'MODULE_NOT_FOUND') {
                throw e;
            }
        }
        return false;
    }
    async executeSchematic(options) {
        try {
            const { verbose, skipConfirmation, interactive, force, dryRun, registry, defaults, collection: collectionName, ...schematicOptions } = options;
            return await this.runSchematic({
                schematicOptions,
                schematicName: this.schematicName,
                collectionName,
                executionOptions: {
                    interactive,
                    force,
                    dryRun,
                    defaults,
                    packageRegistry: registry,
                },
            });
        }
        catch (e) {
            if (e instanceof tools_1.NodePackageDoesNotSupportSchematics) {
                this.context.logger.error(core_1.tags.oneLine `
          The package that you are trying to add does not support schematics. You can try using
          a different version of the package or contact the package author to add ng-add support.
        `);
                return 1;
            }
            throw e;
        }
    }
    async findProjectVersion(name) {
        const { logger, root } = this.context;
        let installedPackage;
        try {
            installedPackage = this.rootRequire.resolve((0, path_1.join)(name, 'package.json'));
        }
        catch { }
        if (installedPackage) {
            try {
                const installed = await (0, package_metadata_1.fetchPackageManifest)((0, path_1.dirname)(installedPackage), logger);
                return installed.version;
            }
            catch { }
        }
        let projectManifest;
        try {
            projectManifest = await (0, package_metadata_1.fetchPackageManifest)(root, logger);
        }
        catch { }
        if (projectManifest) {
            const version = projectManifest.dependencies?.[name] || projectManifest.devDependencies?.[name];
            if (version) {
                return version;
            }
        }
        return null;
    }
    async hasMismatchedPeer(manifest) {
        for (const peer in manifest.peerDependencies) {
            let peerIdentifier;
            try {
                peerIdentifier = npm_package_arg_1.default.resolve(peer, manifest.peerDependencies[peer]);
            }
            catch {
                this.context.logger.warn(`Invalid peer dependency ${peer} found in package.`);
                continue;
            }
            if (peerIdentifier.type === 'version' || peerIdentifier.type === 'range') {
                try {
                    const version = await this.findProjectVersion(peer);
                    if (!version) {
                        continue;
                    }
                    const options = { includePrerelease: true };
                    if (!(0, semver_1.intersects)(version, peerIdentifier.rawSpec, options) &&
                        !(0, semver_1.satisfies)(version, peerIdentifier.rawSpec, options)) {
                        return true;
                    }
                }
                catch {
                    // Not found or invalid so ignore
                    continue;
                }
            }
            else {
                // type === 'tag' | 'file' | 'directory' | 'remote' | 'git'
                // Cannot accurately compare these as the tag/location may have changed since install
            }
        }
        return false;
    }
}
exports.default = AddCommadModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2FkZC9jbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCwrQ0FBNEM7QUFDNUMsNERBQXVGO0FBQ3ZGLG1DQUF1QztBQUN2QyxzRUFBa0M7QUFDbEMsK0JBQXFDO0FBQ3JDLG1DQUFrRjtBQUVsRiwyRUFBc0U7QUFNdEUsK0ZBR3lEO0FBQ3pELGlEQUErQztBQUMvQyxpREFBc0Q7QUFDdEQsdUVBSzBDO0FBQzFDLG1EQUF5RDtBQUN6RCxxREFBa0Q7QUFDbEQsNkNBQTRDO0FBQzVDLHFEQUFrRDtBQVNsRDs7OztHQUlHO0FBQ0gsTUFBTSx3QkFBd0IsR0FBbUM7SUFDL0QsZ0lBQWdJO0lBQ2hJLG1CQUFtQixFQUFFLFNBQVM7SUFDOUIsa0ZBQWtGO0lBQ2xGLG1CQUFtQixFQUFFLEtBQUs7Q0FDM0IsQ0FBQztBQUVGLE1BQXFCLGVBQ25CLFNBQVEsbURBQXVCO0lBRGpDOztRQUlFLFlBQU8sR0FBRyxrQkFBa0IsQ0FBQztRQUM3QixhQUFRLEdBQUcsdURBQXVELENBQUM7UUFDbkUsd0JBQW1CLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFDMUMsMkJBQXNCLEdBQUcsSUFBSSxDQUFDO1FBQ2hDLGtCQUFhLEdBQUcsUUFBUSxDQUFDO1FBQ2xDLGdCQUFXLEdBQUcsSUFBQSxzQkFBYSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO0lBOFovRCxDQUFDO0lBNVpVLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBVTtRQUMvQixNQUFNLFVBQVUsR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMzQyxVQUFVLENBQUMsWUFB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QVM7cUJBQ1Y7b0JBRUQsTUFBTSxPQUFPLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsQ0FBQztvQkFFNUMsSUFDRSxDQUFDLElBQUEsbUJBQVUsRUFBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUM7d0JBQ3JELENBQUMsSUFBQSxrQkFBUyxFQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUNwRDt3QkFDQSxPQUFPLElBQUksQ0FBQztxQkFDYjtpQkFDRjtnQkFBQyxNQUFNO29CQUNOLGlDQUFpQztvQkFDakMsU0FBUztpQkFDVjthQUNGO2lCQUFNO2dCQUNMLDJEQUEyRDtnQkFDM0QscUZBQXFGO2FBQ3RGO1NBQ0Y7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FDRjtBQXZhRCxrQ0F1YUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgdGFncyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE5vZGVQYWNrYWdlRG9lc05vdFN1cHBvcnRTY2hlbWF0aWNzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMnO1xuaW1wb3J0IHsgY3JlYXRlUmVxdWlyZSB9IGZyb20gJ21vZHVsZSc7XG5pbXBvcnQgbnBhIGZyb20gJ25wbS1wYWNrYWdlLWFyZyc7XG5pbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBSYW5nZSwgY29tcGFyZSwgaW50ZXJzZWN0cywgcHJlcmVsZWFzZSwgc2F0aXNmaWVzLCB2YWxpZCB9IGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBBcmd2IH0gZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHsgUGFja2FnZU1hbmFnZXIgfSBmcm9tICcuLi8uLi8uLi9saWIvY29uZmlnL3dvcmtzcGFjZS1zY2hlbWEnO1xuaW1wb3J0IHtcbiAgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uLFxuICBPcHRpb25zLFxuICBPdGhlck9wdGlvbnMsXG59IGZyb20gJy4uLy4uL2NvbW1hbmQtYnVpbGRlci9jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQge1xuICBTY2hlbWF0aWNzQ29tbWFuZEFyZ3MsXG4gIFNjaGVtYXRpY3NDb21tYW5kTW9kdWxlLFxufSBmcm9tICcuLi8uLi9jb21tYW5kLWJ1aWxkZXIvc2NoZW1hdGljcy1jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvY29sb3InO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9lcnJvcic7XG5pbXBvcnQge1xuICBOZ0FkZFNhdmVEZXBlbmRlbmN5LFxuICBQYWNrYWdlTWFuaWZlc3QsXG4gIGZldGNoUGFja2FnZU1hbmlmZXN0LFxuICBmZXRjaFBhY2thZ2VNZXRhZGF0YSxcbn0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL3BhY2thZ2UtbWV0YWRhdGEnO1xuaW1wb3J0IHsgYXNrQ29uZmlybWF0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL3Byb21wdCc7XG5pbXBvcnQgeyBTcGlubmVyIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL3NwaW5uZXInO1xuaW1wb3J0IHsgaXNUVFkgfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvdHR5JztcbmltcG9ydCB7IFZFUlNJT04gfSBmcm9tICcuLi8uLi91dGlsaXRpZXMvdmVyc2lvbic7XG5cbmludGVyZmFjZSBBZGRDb21tYW5kQXJncyBleHRlbmRzIFNjaGVtYXRpY3NDb21tYW5kQXJncyB7XG4gIGNvbGxlY3Rpb246IHN0cmluZztcbiAgdmVyYm9zZT86IGJvb2xlYW47XG4gIHJlZ2lzdHJ5Pzogc3RyaW5nO1xuICAnc2tpcC1jb25maXJtYXRpb24nPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBUaGUgc2V0IG9mIHBhY2thZ2VzIHRoYXQgc2hvdWxkIGhhdmUgY2VydGFpbiB2ZXJzaW9ucyBleGNsdWRlZCBmcm9tIGNvbnNpZGVyYXRpb25cbiAqIHdoZW4gYXR0ZW1wdGluZyB0byBmaW5kIGEgY29tcGF0aWJsZSB2ZXJzaW9uIGZvciBhIHBhY2thZ2UuXG4gKiBUaGUga2V5IGlzIGEgcGFja2FnZSBuYW1lIGFuZCB0aGUgdmFsdWUgaXMgYSBTZW1WZXIgcmFuZ2Ugb2YgdmVyc2lvbnMgdG8gZXhjbHVkZS5cbiAqL1xuY29uc3QgcGFja2FnZVZlcnNpb25FeGNsdXNpb25zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBSYW5nZT4gPSB7XG4gIC8vIEBhbmd1bGFyL2xvY2FsaXplQDkueCBhbmQgZWFybGllciB2ZXJzaW9ucyBhcyB3ZWxsIGFzIEBhbmd1bGFyL2xvY2FsaXplQDEwLjAgcHJlcmVsZWFzZXMgZG8gbm90IGhhdmUgcGVlciBkZXBlbmRlbmNpZXMgc2V0dXAuXG4gICdAYW5ndWxhci9sb2NhbGl6ZSc6ICc8MTAuMC4wJyxcbiAgLy8gQGFuZ3VsYXIvbWF0ZXJpYWxANy54IHZlcnNpb25zIGhhdmUgdW5ib3VuZGVkIHBlZXIgZGVwZW5kZW5jeSByYW5nZXMgKD49Ny4wLjApLlxuICAnQGFuZ3VsYXIvbWF0ZXJpYWwnOiAnNy54Jyxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFkZENvbW1hZE1vZHVsZVxuICBleHRlbmRzIFNjaGVtYXRpY3NDb21tYW5kTW9kdWxlXG4gIGltcGxlbWVudHMgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uPEFkZENvbW1hbmRBcmdzPlxue1xuICBjb21tYW5kID0gJ2FkZCA8Y29sbGVjdGlvbj4nO1xuICBkZXNjcmliZSA9ICdBZGRzIHN1cHBvcnQgZm9yIGFuIGV4dGVybmFsIGxpYnJhcnkgdG8geW91ciBwcm9qZWN0Lic7XG4gIGxvbmdEZXNjcmlwdGlvblBhdGggPSBqb2luKF9fZGlybmFtZSwgJ2xvbmctZGVzY3JpcHRpb24ubWQnKTtcbiAgcHJvdGVjdGVkIG92ZXJyaWRlIGFsbG93UHJpdmF0ZVNjaGVtYXRpY3MgPSB0cnVlO1xuICBwcml2YXRlIHJlYWRvbmx5IHNjaGVtYXRpY05hbWUgPSAnbmctYWRkJztcbiAgcHJpdmF0ZSByb290UmVxdWlyZSA9IGNyZWF0ZVJlcXVpcmUodGhpcy5jb250ZXh0LnJvb3QgKyAnLycpO1xuXG4gIG92ZXJyaWRlIGFzeW5jIGJ1aWxkZXIoYXJndjogQXJndik6IFByb21pc2U8QXJndjxBZGRDb21tYW5kQXJncz4+IHtcbiAgICBjb25zdCBsb2NhbFlhcmdzID0gKGF3YWl0IHN1cGVyLmJ1aWxkZXIoYXJndikpXG4gICAgICAucG9zaXRpb25hbCgnY29sbGVjdGlvbicsIHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgcGFja2FnZSB0byBiZSBhZGRlZC4nLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZGVtYW5kT3B0aW9uOiB0cnVlLFxuICAgICAgfSlcbiAgICAgIC5vcHRpb24oJ3JlZ2lzdHJ5JywgeyBkZXNjcmlwdGlvbjogJ1RoZSBOUE0gcmVnaXN0cnkgdG8gdXNlLicsIHR5cGU6ICdzdHJpbmcnIH0pXG4gICAgICAub3B0aW9uKCd2ZXJib3NlJywge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0Rpc3BsYXkgYWRkaXRpb25hbCBkZXRhaWxzIGFib3V0IGludGVybmFsIG9wZXJhdGlvbnMgZHVyaW5nIGV4ZWN1dGlvbi4nLFxuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgfSlcbiAgICAgIC5vcHRpb24oJ3NraXAtY29uZmlybWF0aW9uJywge1xuICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICAnU2tpcCBhc2tpbmcgYSBjb25maXJtYXRpb24gcHJvbXB0IGJlZm9yZSBpbnN0YWxsaW5nIGFuZCBleGVjdXRpbmcgdGhlIHBhY2thZ2UuICcgK1xuICAgICAgICAgICdFbnN1cmUgcGFja2FnZSBuYW1lIGlzIGNvcnJlY3QgcHJpb3IgdG8gdXNpbmcgdGhpcyBvcHRpb24uJyxcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIH0pXG4gICAgICAvLyBQcmlvciB0byBkb3dubG9hZGluZyB3ZSBkb24ndCBrbm93IHRoZSBmdWxsIHNjaGVtYSBhbmQgdGhlcmVmb3JlIHdlIGNhbm5vdCBiZSBzdHJpY3Qgb24gdGhlIG9wdGlvbnMuXG4gICAgICAvLyBQb3NzaWJseSBpbiB0aGUgZnV0dXJlIHVwZGF0ZSB0aGUgbG9naWMgdG8gdXNlIHRoZSBmb2xsb3dpbmcgc3ludGF4OlxuICAgICAgLy8gYG5nIGFkZCBAYW5ndWxhci9sb2NhbGl6ZSAtLSAtLXBhY2thZ2Utb3B0aW9uc2AuXG4gICAgICAuc3RyaWN0KGZhbHNlKTtcblxuICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gYXdhaXQgdGhpcy5nZXRDb2xsZWN0aW9uTmFtZSgpO1xuICAgIGNvbnN0IHdvcmtmbG93ID0gYXdhaXQgdGhpcy5nZXRPckNyZWF0ZVdvcmtmbG93Rm9yQnVpbGRlcihjb2xsZWN0aW9uTmFtZSk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgY29sbGVjdGlvbiA9IHdvcmtmbG93LmVuZ2luZS5jcmVhdGVDb2xsZWN0aW9uKGNvbGxlY3Rpb25OYW1lKTtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBhd2FpdCB0aGlzLmdldFNjaGVtYXRpY09wdGlvbnMoY29sbGVjdGlvbiwgdGhpcy5zY2hlbWF0aWNOYW1lLCB3b3JrZmxvdyk7XG5cbiAgICAgIHJldHVybiB0aGlzLmFkZFNjaGVtYU9wdGlvbnNUb0NvbW1hbmQobG9jYWxZYXJncywgb3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIER1cmluZyBgbmcgYWRkYCBwcmlvciB0byB0aGUgZG93bmxvYWRpbmcgb2YgdGhlIHBhY2thZ2VcbiAgICAgIC8vIHdlIGFyZSBub3QgYWJsZSB0byByZXNvbHZlIGFuZCBjcmVhdGUgYSBjb2xsZWN0aW9uLlxuICAgICAgLy8gT3Igd2hlbiB0aGUgdGhlIGNvbGxlY3Rpb24gdmFsdWUgaXMgYSBwYXRoIHRvIGEgdGFyYmFsbC5cbiAgICB9XG5cbiAgICByZXR1cm4gbG9jYWxZYXJncztcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBtYXgtbGluZXMtcGVyLWZ1bmN0aW9uXG4gIGFzeW5jIHJ1bihvcHRpb25zOiBPcHRpb25zPEFkZENvbW1hbmRBcmdzPiAmIE90aGVyT3B0aW9ucyk6IFByb21pc2U8bnVtYmVyIHwgdm9pZD4ge1xuICAgIGNvbnN0IHsgbG9nZ2VyLCBwYWNrYWdlTWFuYWdlciB9ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHsgdmVyYm9zZSwgcmVnaXN0cnksIGNvbGxlY3Rpb24sIHNraXBDb25maXJtYXRpb24gfSA9IG9wdGlvbnM7XG4gICAgcGFja2FnZU1hbmFnZXIuZW5zdXJlQ29tcGF0aWJpbGl0eSgpO1xuXG4gICAgbGV0IHBhY2thZ2VJZGVudGlmaWVyO1xuICAgIHRyeSB7XG4gICAgICBwYWNrYWdlSWRlbnRpZmllciA9IG5wYShjb2xsZWN0aW9uKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBhc3NlcnRJc0Vycm9yKGUpO1xuICAgICAgbG9nZ2VyLmVycm9yKGUubWVzc2FnZSk7XG5cbiAgICAgIHJldHVybiAxO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHBhY2thZ2VJZGVudGlmaWVyLm5hbWUgJiZcbiAgICAgIHBhY2thZ2VJZGVudGlmaWVyLnJlZ2lzdHJ5ICYmXG4gICAgICB0aGlzLmlzUGFja2FnZUluc3RhbGxlZChwYWNrYWdlSWRlbnRpZmllci5uYW1lKVxuICAgICkge1xuICAgICAgY29uc3QgdmFsaWRWZXJzaW9uID0gYXdhaXQgdGhpcy5pc1Byb2plY3RWZXJzaW9uVmFsaWQocGFja2FnZUlkZW50aWZpZXIpO1xuICAgICAgaWYgKHZhbGlkVmVyc2lvbikge1xuICAgICAgICAvLyBBbHJlYWR5IGluc3RhbGxlZCBzbyBqdXN0IHJ1biBzY2hlbWF0aWNcbiAgICAgICAgbG9nZ2VyLmluZm8oJ1NraXBwaW5nIGluc3RhbGxhdGlvbjogUGFja2FnZSBhbHJlYWR5IGluc3RhbGxlZCcpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmV4ZWN1dGVTY2hlbWF0aWMoeyAuLi5vcHRpb25zLCBjb2xsZWN0aW9uOiBwYWNrYWdlSWRlbnRpZmllci5uYW1lIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNwaW5uZXIgPSBuZXcgU3Bpbm5lcigpO1xuXG4gICAgc3Bpbm5lci5zdGFydCgnRGV0ZXJtaW5pbmcgcGFja2FnZSBtYW5hZ2VyLi4uJyk7XG4gICAgY29uc3QgdXNpbmdZYXJuID0gcGFja2FnZU1hbmFnZXIubmFtZSA9PT0gUGFja2FnZU1hbmFnZXIuWWFybjtcbiAgICBzcGlubmVyLmluZm8oYFVzaW5nIHBhY2thZ2UgbWFuYWdlcjogJHtjb2xvcnMuZ3JleShwYWNrYWdlTWFuYWdlci5uYW1lKX1gKTtcblxuICAgIGlmIChcbiAgICAgIHBhY2thZ2VJZGVudGlmaWVyLm5hbWUgJiZcbiAgICAgIHBhY2thZ2VJZGVudGlmaWVyLnR5cGUgPT09ICdyYW5nZScgJiZcbiAgICAgIHBhY2thZ2VJZGVudGlmaWVyLnJhd1NwZWMgPT09ICcqJ1xuICAgICkge1xuICAgICAgLy8gb25seSBwYWNrYWdlIG5hbWUgcHJvdmlkZWQ7IHNlYXJjaCBmb3IgdmlhYmxlIHZlcnNpb25cbiAgICAgIC8vIHBsdXMgc3BlY2lhbCBjYXNlcyBmb3IgcGFja2FnZXMgdGhhdCBkaWQgbm90IGhhdmUgcGVlciBkZXBzIHNldHVwXG4gICAgICBzcGlubmVyLnN0YXJ0KCdTZWFyY2hpbmcgZm9yIGNvbXBhdGlibGUgcGFja2FnZSB2ZXJzaW9uLi4uJyk7XG5cbiAgICAgIGxldCBwYWNrYWdlTWV0YWRhdGE7XG4gICAgICB0cnkge1xuICAgICAgICBwYWNrYWdlTWV0YWRhdGEgPSBhd2FpdCBmZXRjaFBhY2thZ2VNZXRhZGF0YShwYWNrYWdlSWRlbnRpZmllci5uYW1lLCBsb2dnZXIsIHtcbiAgICAgICAgICByZWdpc3RyeSxcbiAgICAgICAgICB1c2luZ1lhcm4sXG4gICAgICAgICAgdmVyYm9zZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGFzc2VydElzRXJyb3IoZSk7XG4gICAgICAgIHNwaW5uZXIuZmFpbChgVW5hYmxlIHRvIGxvYWQgcGFja2FnZSBpbmZvcm1hdGlvbiBmcm9tIHJlZ2lzdHJ5OiAke2UubWVzc2FnZX1gKTtcblxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RhcnQgd2l0aCB0aGUgdmVyc2lvbiB0YWdnZWQgYXMgYGxhdGVzdGAgaWYgaXQgZXhpc3RzXG4gICAgICBjb25zdCBsYXRlc3RNYW5pZmVzdCA9IHBhY2thZ2VNZXRhZGF0YS50YWdzWydsYXRlc3QnXTtcbiAgICAgIGlmIChsYXRlc3RNYW5pZmVzdCkge1xuICAgICAgICBwYWNrYWdlSWRlbnRpZmllciA9IG5wYS5yZXNvbHZlKGxhdGVzdE1hbmlmZXN0Lm5hbWUsIGxhdGVzdE1hbmlmZXN0LnZlcnNpb24pO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGp1c3QgdGhlIHZlcnNpb24gYmFzZWQgb24gbmFtZSBhbmQgcGVlciBkZXBlbmRlbmNpZXNcbiAgICAgIGlmIChcbiAgICAgICAgbGF0ZXN0TWFuaWZlc3Q/LnBlZXJEZXBlbmRlbmNpZXMgJiZcbiAgICAgICAgT2JqZWN0LmtleXMobGF0ZXN0TWFuaWZlc3QucGVlckRlcGVuZGVuY2llcykubGVuZ3RoID09PSAwXG4gICAgICApIHtcbiAgICAgICAgc3Bpbm5lci5zdWNjZWVkKFxuICAgICAgICAgIGBGb3VuZCBjb21wYXRpYmxlIHBhY2thZ2UgdmVyc2lvbjogJHtjb2xvcnMuZ3JleShwYWNrYWdlSWRlbnRpZmllci50b1N0cmluZygpKX0uYCxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoIWxhdGVzdE1hbmlmZXN0IHx8IChhd2FpdCB0aGlzLmhhc01pc21hdGNoZWRQZWVyKGxhdGVzdE1hbmlmZXN0KSkpIHtcbiAgICAgICAgLy8gJ2xhdGVzdCcgaXMgaW52YWxpZCBzbyBzZWFyY2ggZm9yIG1vc3QgcmVjZW50IG1hdGNoaW5nIHBhY2thZ2VcblxuICAgICAgICAvLyBBbGxvdyBwcmVsZWFzZSB2ZXJzaW9ucyBpZiB0aGUgQ0xJIGl0c2VsZiBpcyBhIHByZXJlbGVhc2VcbiAgICAgICAgY29uc3QgYWxsb3dQcmVyZWxlYXNlcyA9IHByZXJlbGVhc2UoVkVSU0lPTi5mdWxsKTtcblxuICAgICAgICBjb25zdCB2ZXJzaW9uRXhjbHVzaW9ucyA9IHBhY2thZ2VWZXJzaW9uRXhjbHVzaW9uc1twYWNrYWdlTWV0YWRhdGEubmFtZV07XG4gICAgICAgIGNvbnN0IHZlcnNpb25NYW5pZmVzdHMgPSBPYmplY3QudmFsdWVzKHBhY2thZ2VNZXRhZGF0YS52ZXJzaW9ucykuZmlsdGVyKFxuICAgICAgICAgICh2YWx1ZTogUGFja2FnZU1hbmlmZXN0KSA9PiB7XG4gICAgICAgICAgICAvLyBQcmVyZWxlYXNlIHZlcnNpb25zIGFyZSBub3Qgc3RhYmxlIGFuZCBzaG91bGQgbm90IGJlIGNvbnNpZGVyZWQgYnkgZGVmYXVsdFxuICAgICAgICAgICAgaWYgKCFhbGxvd1ByZXJlbGVhc2VzICYmIHByZXJlbGVhc2UodmFsdWUudmVyc2lvbikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRGVwcmVjYXRlZCB2ZXJzaW9ucyBzaG91bGQgbm90IGJlIHVzZWQgb3IgY29uc2lkZXJlZFxuICAgICAgICAgICAgaWYgKHZhbHVlLmRlcHJlY2F0ZWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRXhjbHVkZWQgcGFja2FnZSB2ZXJzaW9ucyBzaG91bGQgbm90IGJlIGNvbnNpZGVyZWRcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdmVyc2lvbkV4Y2x1c2lvbnMgJiZcbiAgICAgICAgICAgICAgc2F0aXNmaWVzKHZhbHVlLnZlcnNpb24sIHZlcnNpb25FeGNsdXNpb25zLCB7IGluY2x1ZGVQcmVyZWxlYXNlOiB0cnVlIH0pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9LFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFNvcnQgaW4gcmV2ZXJzZSBTZW1WZXIgb3JkZXIgc28gdGhhdCB0aGUgbmV3ZXN0IGNvbXBhdGlibGUgdmVyc2lvbiBpcyBjaG9zZW5cbiAgICAgICAgdmVyc2lvbk1hbmlmZXN0cy5zb3J0KChhLCBiKSA9PiBjb21wYXJlKGIudmVyc2lvbiwgYS52ZXJzaW9uLCB0cnVlKSk7XG5cbiAgICAgICAgbGV0IG5ld0lkZW50aWZpZXI7XG4gICAgICAgIGZvciAoY29uc3QgdmVyc2lvbk1hbmlmZXN0IG9mIHZlcnNpb25NYW5pZmVzdHMpIHtcbiAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmhhc01pc21hdGNoZWRQZWVyKHZlcnNpb25NYW5pZmVzdCkpKSB7XG4gICAgICAgICAgICBuZXdJZGVudGlmaWVyID0gbnBhLnJlc29sdmUodmVyc2lvbk1hbmlmZXN0Lm5hbWUsIHZlcnNpb25NYW5pZmVzdC52ZXJzaW9uKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbmV3SWRlbnRpZmllcikge1xuICAgICAgICAgIHNwaW5uZXIud2FybihcIlVuYWJsZSB0byBmaW5kIGNvbXBhdGlibGUgcGFja2FnZS4gVXNpbmcgJ2xhdGVzdCcgdGFnLlwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYWNrYWdlSWRlbnRpZmllciA9IG5ld0lkZW50aWZpZXI7XG4gICAgICAgICAgc3Bpbm5lci5zdWNjZWVkKFxuICAgICAgICAgICAgYEZvdW5kIGNvbXBhdGlibGUgcGFja2FnZSB2ZXJzaW9uOiAke2NvbG9ycy5ncmV5KHBhY2thZ2VJZGVudGlmaWVyLnRvU3RyaW5nKCkpfS5gLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNwaW5uZXIuc3VjY2VlZChcbiAgICAgICAgICBgRm91bmQgY29tcGF0aWJsZSBwYWNrYWdlIHZlcnNpb246ICR7Y29sb3JzLmdyZXkocGFja2FnZUlkZW50aWZpZXIudG9TdHJpbmcoKSl9LmAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGNvbGxlY3Rpb25OYW1lID0gcGFja2FnZUlkZW50aWZpZXIubmFtZTtcbiAgICBsZXQgc2F2ZVBhY2thZ2U6IE5nQWRkU2F2ZURlcGVuZGVuY3kgfCB1bmRlZmluZWQ7XG5cbiAgICB0cnkge1xuICAgICAgc3Bpbm5lci5zdGFydCgnTG9hZGluZyBwYWNrYWdlIGluZm9ybWF0aW9uIGZyb20gcmVnaXN0cnkuLi4nKTtcbiAgICAgIGNvbnN0IG1hbmlmZXN0ID0gYXdhaXQgZmV0Y2hQYWNrYWdlTWFuaWZlc3QocGFja2FnZUlkZW50aWZpZXIudG9TdHJpbmcoKSwgbG9nZ2VyLCB7XG4gICAgICAgIHJlZ2lzdHJ5LFxuICAgICAgICB2ZXJib3NlLFxuICAgICAgICB1c2luZ1lhcm4sXG4gICAgICB9KTtcblxuICAgICAgc2F2ZVBhY2thZ2UgPSBtYW5pZmVzdFsnbmctYWRkJ10/LnNhdmU7XG4gICAgICBjb2xsZWN0aW9uTmFtZSA9IG1hbmlmZXN0Lm5hbWU7XG5cbiAgICAgIGlmIChhd2FpdCB0aGlzLmhhc01pc21hdGNoZWRQZWVyKG1hbmlmZXN0KSkge1xuICAgICAgICBzcGlubmVyLndhcm4oJ1BhY2thZ2UgaGFzIHVubWV0IHBlZXIgZGVwZW5kZW5jaWVzLiBBZGRpbmcgdGhlIHBhY2thZ2UgbWF5IG5vdCBzdWNjZWVkLicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3Bpbm5lci5zdWNjZWVkKGBQYWNrYWdlIGluZm9ybWF0aW9uIGxvYWRlZC5gKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBhc3NlcnRJc0Vycm9yKGUpO1xuICAgICAgc3Bpbm5lci5mYWlsKGBVbmFibGUgdG8gZmV0Y2ggcGFja2FnZSBpbmZvcm1hdGlvbiBmb3IgJyR7cGFja2FnZUlkZW50aWZpZXJ9JzogJHtlLm1lc3NhZ2V9YCk7XG5cbiAgICAgIHJldHVybiAxO1xuICAgIH1cblxuICAgIGlmICghc2tpcENvbmZpcm1hdGlvbikge1xuICAgICAgY29uc3QgY29uZmlybWF0aW9uUmVzcG9uc2UgPSBhd2FpdCBhc2tDb25maXJtYXRpb24oXG4gICAgICAgIGBcXG5UaGUgcGFja2FnZSAke2NvbG9ycy5ibHVlKHBhY2thZ2VJZGVudGlmaWVyLnJhdyl9IHdpbGwgYmUgaW5zdGFsbGVkIGFuZCBleGVjdXRlZC5cXG5gICtcbiAgICAgICAgICAnV291bGQgeW91IGxpa2UgdG8gcHJvY2VlZD8nLFxuICAgICAgICB0cnVlLFxuICAgICAgICBmYWxzZSxcbiAgICAgICk7XG5cbiAgICAgIGlmICghY29uZmlybWF0aW9uUmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKCFpc1RUWSgpKSB7XG4gICAgICAgICAgbG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgJ05vIHRlcm1pbmFsIGRldGVjdGVkLiAnICtcbiAgICAgICAgICAgICAgYCctLXNraXAtY29uZmlybWF0aW9uJyBjYW4gYmUgdXNlZCB0byBieXBhc3MgaW5zdGFsbGF0aW9uIGNvbmZpcm1hdGlvbi4gYCArXG4gICAgICAgICAgICAgIGBFbnN1cmUgcGFja2FnZSBuYW1lIGlzIGNvcnJlY3QgcHJpb3IgdG8gJy0tc2tpcC1jb25maXJtYXRpb24nIG9wdGlvbiB1c2FnZS5gLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsb2dnZXIuZXJyb3IoJ0NvbW1hbmQgYWJvcnRlZC4nKTtcblxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc2F2ZVBhY2thZ2UgPT09IGZhbHNlKSB7XG4gICAgICAvLyBUZW1wb3JhcnkgcGFja2FnZXMgYXJlIGxvY2F0ZWQgaW4gYSBkaWZmZXJlbnQgZGlyZWN0b3J5XG4gICAgICAvLyBIZW5jZSB3ZSBuZWVkIHRvIHJlc29sdmUgdGhlbSB1c2luZyB0aGUgdGVtcCBwYXRoXG4gICAgICBjb25zdCB7IHN1Y2Nlc3MsIHRlbXBOb2RlTW9kdWxlcyB9ID0gYXdhaXQgcGFja2FnZU1hbmFnZXIuaW5zdGFsbFRlbXAoXG4gICAgICAgIHBhY2thZ2VJZGVudGlmaWVyLnJhdyxcbiAgICAgICAgcmVnaXN0cnkgPyBbYC0tcmVnaXN0cnk9XCIke3JlZ2lzdHJ5fVwiYF0gOiB1bmRlZmluZWQsXG4gICAgICApO1xuICAgICAgY29uc3QgdGVtcFJlcXVpcmUgPSBjcmVhdGVSZXF1aXJlKHRlbXBOb2RlTW9kdWxlcyArICcvJyk7XG4gICAgICBjb25zdCByZXNvbHZlZENvbGxlY3Rpb25QYXRoID0gdGVtcFJlcXVpcmUucmVzb2x2ZShqb2luKGNvbGxlY3Rpb25OYW1lLCAncGFja2FnZS5qc29uJykpO1xuXG4gICAgICBpZiAoIXN1Y2Nlc3MpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG5cbiAgICAgIGNvbGxlY3Rpb25OYW1lID0gZGlybmFtZShyZXNvbHZlZENvbGxlY3Rpb25QYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc3VjY2VzcyA9IGF3YWl0IHBhY2thZ2VNYW5hZ2VyLmluc3RhbGwoXG4gICAgICAgIHBhY2thZ2VJZGVudGlmaWVyLnJhdyxcbiAgICAgICAgc2F2ZVBhY2thZ2UsXG4gICAgICAgIHJlZ2lzdHJ5ID8gW2AtLXJlZ2lzdHJ5PVwiJHtyZWdpc3RyeX1cImBdIDogdW5kZWZpbmVkLFxuICAgICAgKTtcblxuICAgICAgaWYgKCFzdWNjZXNzKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmV4ZWN1dGVTY2hlbWF0aWMoeyAuLi5vcHRpb25zLCBjb2xsZWN0aW9uOiBjb2xsZWN0aW9uTmFtZSB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaXNQcm9qZWN0VmVyc2lvblZhbGlkKHBhY2thZ2VJZGVudGlmaWVyOiBucGEuUmVzdWx0KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKCFwYWNrYWdlSWRlbnRpZmllci5uYW1lKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgaW5zdGFsbGVkVmVyc2lvbiA9IGF3YWl0IHRoaXMuZmluZFByb2plY3RWZXJzaW9uKHBhY2thZ2VJZGVudGlmaWVyLm5hbWUpO1xuICAgIGlmICghaW5zdGFsbGVkVmVyc2lvbikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChwYWNrYWdlSWRlbnRpZmllci5yYXdTcGVjID09PSAnKicpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHBhY2thZ2VJZGVudGlmaWVyLnR5cGUgPT09ICdyYW5nZScgJiZcbiAgICAgIHBhY2thZ2VJZGVudGlmaWVyLmZldGNoU3BlYyAmJlxuICAgICAgcGFja2FnZUlkZW50aWZpZXIuZmV0Y2hTcGVjICE9PSAnKidcbiAgICApIHtcbiAgICAgIHJldHVybiBzYXRpc2ZpZXMoaW5zdGFsbGVkVmVyc2lvbiwgcGFja2FnZUlkZW50aWZpZXIuZmV0Y2hTcGVjKTtcbiAgICB9XG5cbiAgICBpZiAocGFja2FnZUlkZW50aWZpZXIudHlwZSA9PT0gJ3ZlcnNpb24nKSB7XG4gICAgICBjb25zdCB2MSA9IHZhbGlkKHBhY2thZ2VJZGVudGlmaWVyLmZldGNoU3BlYyk7XG4gICAgICBjb25zdCB2MiA9IHZhbGlkKGluc3RhbGxlZFZlcnNpb24pO1xuXG4gICAgICByZXR1cm4gdjEgIT09IG51bGwgJiYgdjEgPT09IHYyO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0Q29sbGVjdGlvbk5hbWUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBbLCBjb2xsZWN0aW9uTmFtZV0gPSB0aGlzLmNvbnRleHQuYXJncy5wb3NpdGlvbmFsO1xuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb25OYW1lO1xuICB9XG5cbiAgcHJpdmF0ZSBpc1BhY2thZ2VJbnN0YWxsZWQobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucm9vdFJlcXVpcmUucmVzb2x2ZShqb2luKG5hbWUsICdwYWNrYWdlLmpzb24nKSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGFzc2VydElzRXJyb3IoZSk7XG4gICAgICBpZiAoZS5jb2RlICE9PSAnTU9EVUxFX05PVF9GT1VORCcpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVTY2hlbWF0aWMoXG4gICAgb3B0aW9uczogT3B0aW9uczxBZGRDb21tYW5kQXJncz4gJiBPdGhlck9wdGlvbnMsXG4gICk6IFByb21pc2U8bnVtYmVyIHwgdm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHZlcmJvc2UsXG4gICAgICAgIHNraXBDb25maXJtYXRpb24sXG4gICAgICAgIGludGVyYWN0aXZlLFxuICAgICAgICBmb3JjZSxcbiAgICAgICAgZHJ5UnVuLFxuICAgICAgICByZWdpc3RyeSxcbiAgICAgICAgZGVmYXVsdHMsXG4gICAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25OYW1lLFxuICAgICAgICAuLi5zY2hlbWF0aWNPcHRpb25zXG4gICAgICB9ID0gb3B0aW9ucztcblxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucnVuU2NoZW1hdGljKHtcbiAgICAgICAgc2NoZW1hdGljT3B0aW9ucyxcbiAgICAgICAgc2NoZW1hdGljTmFtZTogdGhpcy5zY2hlbWF0aWNOYW1lLFxuICAgICAgICBjb2xsZWN0aW9uTmFtZSxcbiAgICAgICAgZXhlY3V0aW9uT3B0aW9uczoge1xuICAgICAgICAgIGludGVyYWN0aXZlLFxuICAgICAgICAgIGZvcmNlLFxuICAgICAgICAgIGRyeVJ1bixcbiAgICAgICAgICBkZWZhdWx0cyxcbiAgICAgICAgICBwYWNrYWdlUmVnaXN0cnk6IHJlZ2lzdHJ5LFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBOb2RlUGFja2FnZURvZXNOb3RTdXBwb3J0U2NoZW1hdGljcykge1xuICAgICAgICB0aGlzLmNvbnRleHQubG9nZ2VyLmVycm9yKHRhZ3Mub25lTGluZWBcbiAgICAgICAgICBUaGUgcGFja2FnZSB0aGF0IHlvdSBhcmUgdHJ5aW5nIHRvIGFkZCBkb2VzIG5vdCBzdXBwb3J0IHNjaGVtYXRpY3MuIFlvdSBjYW4gdHJ5IHVzaW5nXG4gICAgICAgICAgYSBkaWZmZXJlbnQgdmVyc2lvbiBvZiB0aGUgcGFja2FnZSBvciBjb250YWN0IHRoZSBwYWNrYWdlIGF1dGhvciB0byBhZGQgbmctYWRkIHN1cHBvcnQuXG4gICAgICAgIGApO1xuXG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmluZFByb2plY3RWZXJzaW9uKG5hbWU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGNvbnN0IHsgbG9nZ2VyLCByb290IH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgbGV0IGluc3RhbGxlZFBhY2thZ2U7XG4gICAgdHJ5IHtcbiAgICAgIGluc3RhbGxlZFBhY2thZ2UgPSB0aGlzLnJvb3RSZXF1aXJlLnJlc29sdmUoam9pbihuYW1lLCAncGFja2FnZS5qc29uJykpO1xuICAgIH0gY2F0Y2gge31cblxuICAgIGlmIChpbnN0YWxsZWRQYWNrYWdlKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBpbnN0YWxsZWQgPSBhd2FpdCBmZXRjaFBhY2thZ2VNYW5pZmVzdChkaXJuYW1lKGluc3RhbGxlZFBhY2thZ2UpLCBsb2dnZXIpO1xuXG4gICAgICAgIHJldHVybiBpbnN0YWxsZWQudmVyc2lvbjtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9XG5cbiAgICBsZXQgcHJvamVjdE1hbmlmZXN0O1xuICAgIHRyeSB7XG4gICAgICBwcm9qZWN0TWFuaWZlc3QgPSBhd2FpdCBmZXRjaFBhY2thZ2VNYW5pZmVzdChyb290LCBsb2dnZXIpO1xuICAgIH0gY2F0Y2gge31cblxuICAgIGlmIChwcm9qZWN0TWFuaWZlc3QpIHtcbiAgICAgIGNvbnN0IHZlcnNpb24gPVxuICAgICAgICBwcm9qZWN0TWFuaWZlc3QuZGVwZW5kZW5jaWVzPy5bbmFtZV0gfHwgcHJvamVjdE1hbmlmZXN0LmRldkRlcGVuZGVuY2llcz8uW25hbWVdO1xuICAgICAgaWYgKHZlcnNpb24pIHtcbiAgICAgICAgcmV0dXJuIHZlcnNpb247XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGhhc01pc21hdGNoZWRQZWVyKG1hbmlmZXN0OiBQYWNrYWdlTWFuaWZlc3QpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBmb3IgKGNvbnN0IHBlZXIgaW4gbWFuaWZlc3QucGVlckRlcGVuZGVuY2llcykge1xuICAgICAgbGV0IHBlZXJJZGVudGlmaWVyO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGVlcklkZW50aWZpZXIgPSBucGEucmVzb2x2ZShwZWVyLCBtYW5pZmVzdC5wZWVyRGVwZW5kZW5jaWVzW3BlZXJdKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICB0aGlzLmNvbnRleHQubG9nZ2VyLndhcm4oYEludmFsaWQgcGVlciBkZXBlbmRlbmN5ICR7cGVlcn0gZm91bmQgaW4gcGFja2FnZS5gKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChwZWVySWRlbnRpZmllci50eXBlID09PSAndmVyc2lvbicgfHwgcGVlcklkZW50aWZpZXIudHlwZSA9PT0gJ3JhbmdlJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHZlcnNpb24gPSBhd2FpdCB0aGlzLmZpbmRQcm9qZWN0VmVyc2lvbihwZWVyKTtcbiAgICAgICAgICBpZiAoIXZlcnNpb24pIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7IGluY2x1ZGVQcmVyZWxlYXNlOiB0cnVlIH07XG5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAhaW50ZXJzZWN0cyh2ZXJzaW9uLCBwZWVySWRlbnRpZmllci5yYXdTcGVjLCBvcHRpb25zKSAmJlxuICAgICAgICAgICAgIXNhdGlzZmllcyh2ZXJzaW9uLCBwZWVySWRlbnRpZmllci5yYXdTcGVjLCBvcHRpb25zKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAvLyBOb3QgZm91bmQgb3IgaW52YWxpZCBzbyBpZ25vcmVcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdHlwZSA9PT0gJ3RhZycgfCAnZmlsZScgfCAnZGlyZWN0b3J5JyB8ICdyZW1vdGUnIHwgJ2dpdCdcbiAgICAgICAgLy8gQ2Fubm90IGFjY3VyYXRlbHkgY29tcGFyZSB0aGVzZSBhcyB0aGUgdGFnL2xvY2F0aW9uIG1heSBoYXZlIGNoYW5nZWQgc2luY2UgaW5zdGFsbFxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIl19