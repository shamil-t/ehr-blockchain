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
const schematics_1 = require("@angular-devkit/schematics");
const tools_1 = require("@angular-devkit/schematics/tools");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const module_1 = require("module");
const npm_package_arg_1 = __importDefault(require("npm-package-arg"));
const npm_pick_manifest_1 = __importDefault(require("npm-pick-manifest"));
const path = __importStar(require("path"));
const path_1 = require("path");
const semver = __importStar(require("semver"));
const workspace_schema_1 = require("../../../lib/config/workspace-schema");
const command_module_1 = require("../../command-builder/command-module");
const schematic_engine_host_1 = require("../../command-builder/utilities/schematic-engine-host");
const schematic_workflow_1 = require("../../command-builder/utilities/schematic-workflow");
const color_1 = require("../../utilities/color");
const environment_options_1 = require("../../utilities/environment-options");
const error_1 = require("../../utilities/error");
const log_file_1 = require("../../utilities/log-file");
const package_metadata_1 = require("../../utilities/package-metadata");
const package_tree_1 = require("../../utilities/package-tree");
const prompt_1 = require("../../utilities/prompt");
const tty_1 = require("../../utilities/tty");
const version_1 = require("../../utilities/version");
const ANGULAR_PACKAGES_REGEXP = /^@(?:angular|nguniversal)\//;
const UPDATE_SCHEMATIC_COLLECTION = path.join(__dirname, 'schematic/collection.json');
class UpdateCommandModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.scope = command_module_1.CommandScope.In;
        this.shouldReportAnalytics = false;
        this.command = 'update [packages..]';
        this.describe = 'Updates your workspace and its dependencies. See https://update.angular.io/.';
        this.longDescriptionPath = (0, path_1.join)(__dirname, 'long-description.md');
    }
    builder(localYargs) {
        return localYargs
            .positional('packages', {
            description: 'The names of package(s) to update.',
            type: 'string',
            array: true,
        })
            .option('force', {
            description: 'Ignore peer dependency version mismatches.',
            type: 'boolean',
            default: false,
        })
            .option('next', {
            description: 'Use the prerelease version, including beta and RCs.',
            type: 'boolean',
            default: false,
        })
            .option('migrate-only', {
            description: 'Only perform a migration, do not update the installed version.',
            type: 'boolean',
        })
            .option('name', {
            description: 'The name of the migration to run. Only available when a single package is updated.',
            type: 'string',
            conflicts: ['to', 'from'],
        })
            .option('from', {
            description: 'Version from which to migrate from. ' +
                `Only available when a single package is updated, and only with 'migrate-only'.`,
            type: 'string',
            implies: ['migrate-only'],
            conflicts: ['name'],
        })
            .option('to', {
            describe: 'Version up to which to apply migrations. Only available when a single package is updated, ' +
                `and only with 'migrate-only' option. Requires 'from' to be specified. Default to the installed version detected.`,
            type: 'string',
            implies: ['from', 'migrate-only'],
            conflicts: ['name'],
        })
            .option('allow-dirty', {
            describe: 'Whether to allow updating when the repository contains modified or untracked files.',
            type: 'boolean',
            default: false,
        })
            .option('verbose', {
            describe: 'Display additional details about internal operations during execution.',
            type: 'boolean',
            default: false,
        })
            .option('create-commits', {
            describe: 'Create source control commits for updates and migrations.',
            type: 'boolean',
            alias: ['C'],
            default: false,
        })
            .middleware((argv) => {
            if (argv.name) {
                argv['migrate-only'] = true;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return argv;
        })
            .check(({ packages, 'allow-dirty': allowDirty, 'migrate-only': migrateOnly }) => {
            const { logger } = this.context;
            // This allows the user to easily reset any changes from the update.
            if (packages?.length && !this.checkCleanGit()) {
                if (allowDirty) {
                    logger.warn('Repository is not clean. Update changes will be mixed with pre-existing changes.');
                }
                else {
                    throw new command_module_1.CommandModuleError('Repository is not clean. Please commit or stash any changes before updating.');
                }
            }
            if (migrateOnly) {
                if (packages?.length !== 1) {
                    throw new command_module_1.CommandModuleError(`A single package must be specified when using the 'migrate-only' option.`);
                }
            }
            return true;
        })
            .strict();
    }
    async run(options) {
        const { logger, packageManager } = this.context;
        packageManager.ensureCompatibility();
        // Check if the current installed CLI version is older than the latest compatible version.
        // Skip when running `ng update` without a package name as this will not trigger an actual update.
        if (!environment_options_1.disableVersionCheck && options.packages?.length) {
            const cliVersionToInstall = await this.checkCLIVersion(options.packages, options.verbose, options.next);
            if (cliVersionToInstall) {
                logger.warn('The installed Angular CLI version is outdated.\n' +
                    `Installing a temporary Angular CLI versioned ${cliVersionToInstall} to perform the update.`);
                return this.runTempBinary(`@angular/cli@${cliVersionToInstall}`, process.argv.slice(2));
            }
        }
        const packages = [];
        for (const request of options.packages ?? []) {
            try {
                const packageIdentifier = (0, npm_package_arg_1.default)(request);
                // only registry identifiers are supported
                if (!packageIdentifier.registry) {
                    logger.error(`Package '${request}' is not a registry package identifer.`);
                    return 1;
                }
                if (packages.some((v) => v.name === packageIdentifier.name)) {
                    logger.error(`Duplicate package '${packageIdentifier.name}' specified.`);
                    return 1;
                }
                if (options.migrateOnly && packageIdentifier.rawSpec !== '*') {
                    logger.warn('Package specifier has no effect when using "migrate-only" option.');
                }
                // If next option is used and no specifier supplied, use next tag
                if (options.next && packageIdentifier.rawSpec === '*') {
                    packageIdentifier.fetchSpec = 'next';
                }
                packages.push(packageIdentifier);
            }
            catch (e) {
                (0, error_1.assertIsError)(e);
                logger.error(e.message);
                return 1;
            }
        }
        logger.info(`Using package manager: ${color_1.colors.grey(packageManager.name)}`);
        logger.info('Collecting installed dependencies...');
        const rootDependencies = await (0, package_tree_1.getProjectDependencies)(this.context.root);
        logger.info(`Found ${rootDependencies.size} dependencies.`);
        const workflow = new tools_1.NodeWorkflow(this.context.root, {
            packageManager: packageManager.name,
            packageManagerForce: this.packageManagerForce(options.verbose),
            // __dirname -> favor @schematics/update from this package
            // Otherwise, use packages from the active workspace (migrations)
            resolvePaths: [__dirname, this.context.root],
            schemaValidation: true,
            engineHostCreator: (options) => new schematic_engine_host_1.SchematicEngineHost(options.resolvePaths),
        });
        if (packages.length === 0) {
            // Show status
            const { success } = await this.executeSchematic(workflow, UPDATE_SCHEMATIC_COLLECTION, 'update', {
                force: options.force,
                next: options.next,
                verbose: options.verbose,
                packageManager: packageManager.name,
                packages: [],
            });
            return success ? 0 : 1;
        }
        return options.migrateOnly
            ? this.migrateOnly(workflow, (options.packages ?? [])[0], rootDependencies, options)
            : this.updatePackagesAndMigrate(workflow, rootDependencies, options, packages);
    }
    async executeSchematic(workflow, collection, schematic, options = {}) {
        const { logger } = this.context;
        const workflowSubscription = (0, schematic_workflow_1.subscribeToWorkflow)(workflow, logger);
        // TODO: Allow passing a schematic instance directly
        try {
            await workflow
                .execute({
                collection,
                schematic,
                options,
                logger,
            })
                .toPromise();
            return { success: !workflowSubscription.error, files: workflowSubscription.files };
        }
        catch (e) {
            if (e instanceof schematics_1.UnsuccessfulWorkflowExecution) {
                logger.error(`${color_1.colors.symbols.cross} Migration failed. See above for further details.\n`);
            }
            else {
                (0, error_1.assertIsError)(e);
                const logPath = (0, log_file_1.writeErrorToLogFile)(e);
                logger.fatal(`${color_1.colors.symbols.cross} Migration failed: ${e.message}\n` +
                    `  See "${logPath}" for further details.\n`);
            }
            return { success: false, files: workflowSubscription.files };
        }
        finally {
            workflowSubscription.unsubscribe();
        }
    }
    /**
     * @return Whether or not the migration was performed successfully.
     */
    async executeMigration(workflow, packageName, collectionPath, migrationName, commit) {
        const { logger } = this.context;
        const collection = workflow.engine.createCollection(collectionPath);
        const name = collection.listSchematicNames().find((name) => name === migrationName);
        if (!name) {
            logger.error(`Cannot find migration '${migrationName}' in '${packageName}'.`);
            return 1;
        }
        logger.info(color_1.colors.cyan(`** Executing '${migrationName}' of package '${packageName}' **\n`));
        const schematic = workflow.engine.createSchematic(name, collection);
        return this.executePackageMigrations(workflow, [schematic.description], packageName, commit);
    }
    /**
     * @return Whether or not the migrations were performed successfully.
     */
    async executeMigrations(workflow, packageName, collectionPath, from, to, commit) {
        const collection = workflow.engine.createCollection(collectionPath);
        const migrationRange = new semver.Range('>' + (semver.prerelease(from) ? from.split('-')[0] + '-0' : from) + ' <=' + to.split('-')[0]);
        const requiredMigrations = [];
        const optionalMigrations = [];
        for (const name of collection.listSchematicNames()) {
            const schematic = workflow.engine.createSchematic(name, collection);
            const description = schematic.description;
            description.version = coerceVersionNumber(description.version);
            if (!description.version) {
                continue;
            }
            if (semver.satisfies(description.version, migrationRange, { includePrerelease: true })) {
                (description.optional ? optionalMigrations : requiredMigrations).push(description);
            }
        }
        if (requiredMigrations.length === 0 && optionalMigrations.length === 0) {
            return 0;
        }
        // Required migrations
        if (requiredMigrations.length) {
            this.context.logger.info(color_1.colors.cyan(`** Executing migrations of package '${packageName}' **\n`));
            requiredMigrations.sort((a, b) => semver.compare(a.version, b.version) || a.name.localeCompare(b.name));
            const result = await this.executePackageMigrations(workflow, requiredMigrations, packageName, commit);
            if (result === 1) {
                return 1;
            }
        }
        // Optional migrations
        if (optionalMigrations.length) {
            this.context.logger.info(color_1.colors.magenta(`** Optional migrations of package '${packageName}' **\n`));
            optionalMigrations.sort((a, b) => semver.compare(a.version, b.version) || a.name.localeCompare(b.name));
            const migrationsToRun = await this.getOptionalMigrationsToRun(optionalMigrations, packageName);
            if (migrationsToRun?.length) {
                return this.executePackageMigrations(workflow, migrationsToRun, packageName, commit);
            }
        }
        return 0;
    }
    async executePackageMigrations(workflow, migrations, packageName, commit = false) {
        const { logger } = this.context;
        for (const migration of migrations) {
            const { title, description } = getMigrationTitleAndDescription(migration);
            logger.info(color_1.colors.cyan(color_1.colors.symbols.pointer) + ' ' + color_1.colors.bold(title));
            if (description) {
                logger.info('  ' + description);
            }
            const { success, files } = await this.executeSchematic(workflow, migration.collection.name, migration.name);
            if (!success) {
                return 1;
            }
            let modifiedFilesText;
            switch (files.size) {
                case 0:
                    modifiedFilesText = 'No changes made';
                    break;
                case 1:
                    modifiedFilesText = '1 file modified';
                    break;
                default:
                    modifiedFilesText = `${files.size} files modified`;
                    break;
            }
            logger.info(`  Migration completed (${modifiedFilesText}).`);
            // Commit migration
            if (commit) {
                const commitPrefix = `${packageName} migration - ${migration.name}`;
                const commitMessage = migration.description
                    ? `${commitPrefix}\n\n${migration.description}`
                    : commitPrefix;
                const committed = this.commit(commitMessage);
                if (!committed) {
                    // Failed to commit, something went wrong. Abort the update.
                    return 1;
                }
            }
            logger.info(''); // Extra trailing newline.
        }
        return 0;
    }
    async migrateOnly(workflow, packageName, rootDependencies, options) {
        const { logger } = this.context;
        const packageDependency = rootDependencies.get(packageName);
        let packagePath = packageDependency?.path;
        let packageNode = packageDependency?.package;
        if (packageDependency && !packageNode) {
            logger.error('Package found in package.json but is not installed.');
            return 1;
        }
        else if (!packageDependency) {
            // Allow running migrations on transitively installed dependencies
            // There can technically be nested multiple versions
            // TODO: If multiple, this should find all versions and ask which one to use
            const packageJson = (0, package_tree_1.findPackageJson)(this.context.root, packageName);
            if (packageJson) {
                packagePath = path.dirname(packageJson);
                packageNode = await (0, package_tree_1.readPackageJson)(packageJson);
            }
        }
        if (!packageNode || !packagePath) {
            logger.error('Package is not installed.');
            return 1;
        }
        const updateMetadata = packageNode['ng-update'];
        let migrations = updateMetadata?.migrations;
        if (migrations === undefined) {
            logger.error('Package does not provide migrations.');
            return 1;
        }
        else if (typeof migrations !== 'string') {
            logger.error('Package contains a malformed migrations field.');
            return 1;
        }
        else if (path.posix.isAbsolute(migrations) || path.win32.isAbsolute(migrations)) {
            logger.error('Package contains an invalid migrations field. Absolute paths are not permitted.');
            return 1;
        }
        // Normalize slashes
        migrations = migrations.replace(/\\/g, '/');
        if (migrations.startsWith('../')) {
            logger.error('Package contains an invalid migrations field. Paths outside the package root are not permitted.');
            return 1;
        }
        // Check if it is a package-local location
        const localMigrations = path.join(packagePath, migrations);
        if ((0, fs_1.existsSync)(localMigrations)) {
            migrations = localMigrations;
        }
        else {
            // Try to resolve from package location.
            // This avoids issues with package hoisting.
            try {
                const packageRequire = (0, module_1.createRequire)(packagePath + '/');
                migrations = packageRequire.resolve(migrations);
            }
            catch (e) {
                (0, error_1.assertIsError)(e);
                if (e.code === 'MODULE_NOT_FOUND') {
                    logger.error('Migrations for package were not found.');
                }
                else {
                    logger.error(`Unable to resolve migrations for package.  [${e.message}]`);
                }
                return 1;
            }
        }
        if (options.name) {
            return this.executeMigration(workflow, packageName, migrations, options.name, options.createCommits);
        }
        const from = coerceVersionNumber(options.from);
        if (!from) {
            logger.error(`"from" value [${options.from}] is not a valid version.`);
            return 1;
        }
        return this.executeMigrations(workflow, packageName, migrations, from, options.to || packageNode.version, options.createCommits);
    }
    // eslint-disable-next-line max-lines-per-function
    async updatePackagesAndMigrate(workflow, rootDependencies, options, packages) {
        const { logger } = this.context;
        const logVerbose = (message) => {
            if (options.verbose) {
                logger.info(message);
            }
        };
        const requests = [];
        // Validate packages actually are part of the workspace
        for (const pkg of packages) {
            const node = rootDependencies.get(pkg.name);
            if (!node?.package) {
                logger.error(`Package '${pkg.name}' is not a dependency.`);
                return 1;
            }
            // If a specific version is requested and matches the installed version, skip.
            if (pkg.type === 'version' && node.package.version === pkg.fetchSpec) {
                logger.info(`Package '${pkg.name}' is already at '${pkg.fetchSpec}'.`);
                continue;
            }
            requests.push({ identifier: pkg, node });
        }
        if (requests.length === 0) {
            return 0;
        }
        logger.info('Fetching dependency metadata from registry...');
        const packagesToUpdate = [];
        for (const { identifier: requestIdentifier, node } of requests) {
            const packageName = requestIdentifier.name;
            let metadata;
            try {
                // Metadata requests are internally cached; multiple requests for same name
                // does not result in additional network traffic
                metadata = await (0, package_metadata_1.fetchPackageMetadata)(packageName, logger, {
                    verbose: options.verbose,
                });
            }
            catch (e) {
                (0, error_1.assertIsError)(e);
                logger.error(`Error fetching metadata for '${packageName}': ` + e.message);
                return 1;
            }
            // Try to find a package version based on the user requested package specifier
            // registry specifier types are either version, range, or tag
            let manifest;
            if (requestIdentifier.type === 'version' ||
                requestIdentifier.type === 'range' ||
                requestIdentifier.type === 'tag') {
                try {
                    manifest = (0, npm_pick_manifest_1.default)(metadata, requestIdentifier.fetchSpec);
                }
                catch (e) {
                    (0, error_1.assertIsError)(e);
                    if (e.code === 'ETARGET') {
                        // If not found and next was used and user did not provide a specifier, try latest.
                        // Package may not have a next tag.
                        if (requestIdentifier.type === 'tag' &&
                            requestIdentifier.fetchSpec === 'next' &&
                            !requestIdentifier.rawSpec) {
                            try {
                                manifest = (0, npm_pick_manifest_1.default)(metadata, 'latest');
                            }
                            catch (e) {
                                (0, error_1.assertIsError)(e);
                                if (e.code !== 'ETARGET' && e.code !== 'ENOVERSIONS') {
                                    throw e;
                                }
                            }
                        }
                    }
                    else if (e.code !== 'ENOVERSIONS') {
                        throw e;
                    }
                }
            }
            if (!manifest) {
                logger.error(`Package specified by '${requestIdentifier.raw}' does not exist within the registry.`);
                return 1;
            }
            if (manifest.version === node.package?.version) {
                logger.info(`Package '${packageName}' is already up to date.`);
                continue;
            }
            if (node.package && ANGULAR_PACKAGES_REGEXP.test(node.package.name)) {
                const { name, version } = node.package;
                const toBeInstalledMajorVersion = +manifest.version.split('.')[0];
                const currentMajorVersion = +version.split('.')[0];
                if (toBeInstalledMajorVersion - currentMajorVersion > 1) {
                    // Only allow updating a single version at a time.
                    if (currentMajorVersion < 6) {
                        // Before version 6, the major versions were not always sequential.
                        // Example @angular/core skipped version 3, @angular/cli skipped versions 2-5.
                        logger.error(`Updating multiple major versions of '${name}' at once is not supported. Please migrate each major version individually.\n` +
                            `For more information about the update process, see https://update.angular.io/.`);
                    }
                    else {
                        const nextMajorVersionFromCurrent = currentMajorVersion + 1;
                        logger.error(`Updating multiple major versions of '${name}' at once is not supported. Please migrate each major version individually.\n` +
                            `Run 'ng update ${name}@${nextMajorVersionFromCurrent}' in your workspace directory ` +
                            `to update to latest '${nextMajorVersionFromCurrent}.x' version of '${name}'.\n\n` +
                            `For more information about the update process, see https://update.angular.io/?v=${currentMajorVersion}.0-${nextMajorVersionFromCurrent}.0`);
                    }
                    return 1;
                }
            }
            packagesToUpdate.push(requestIdentifier.toString());
        }
        if (packagesToUpdate.length === 0) {
            return 0;
        }
        const { success } = await this.executeSchematic(workflow, UPDATE_SCHEMATIC_COLLECTION, 'update', {
            verbose: options.verbose,
            force: options.force,
            next: options.next,
            packageManager: this.context.packageManager.name,
            packages: packagesToUpdate,
        });
        if (success) {
            try {
                await fs_1.promises.rm(path.join(this.context.root, 'node_modules'), {
                    force: true,
                    recursive: true,
                    maxRetries: 3,
                });
            }
            catch { }
            const installationSuccess = await this.context.packageManager.installAll(this.packageManagerForce(options.verbose) ? ['--force'] : [], this.context.root);
            if (!installationSuccess) {
                return 1;
            }
        }
        if (success && options.createCommits) {
            if (!this.commit(`Angular CLI update for packages - ${packagesToUpdate.join(', ')}`)) {
                return 1;
            }
        }
        // This is a temporary workaround to allow data to be passed back from the update schematic
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const migrations = global.externalMigrations;
        if (success && migrations) {
            const rootRequire = (0, module_1.createRequire)(this.context.root + '/');
            for (const migration of migrations) {
                // Resolve the package from the workspace root, as otherwise it will be resolved from the temp
                // installed CLI version.
                let packagePath;
                logVerbose(`Resolving migration package '${migration.package}' from '${this.context.root}'...`);
                try {
                    try {
                        packagePath = path.dirname(
                        // This may fail if the `package.json` is not exported as an entry point
                        rootRequire.resolve(path.join(migration.package, 'package.json')));
                    }
                    catch (e) {
                        (0, error_1.assertIsError)(e);
                        if (e.code === 'MODULE_NOT_FOUND') {
                            // Fallback to trying to resolve the package's main entry point
                            packagePath = rootRequire.resolve(migration.package);
                        }
                        else {
                            throw e;
                        }
                    }
                }
                catch (e) {
                    (0, error_1.assertIsError)(e);
                    if (e.code === 'MODULE_NOT_FOUND') {
                        logVerbose(e.toString());
                        logger.error(`Migrations for package (${migration.package}) were not found.` +
                            ' The package could not be found in the workspace.');
                    }
                    else {
                        logger.error(`Unable to resolve migrations for package (${migration.package}).  [${e.message}]`);
                    }
                    return 1;
                }
                let migrations;
                // Check if it is a package-local location
                const localMigrations = path.join(packagePath, migration.collection);
                if ((0, fs_1.existsSync)(localMigrations)) {
                    migrations = localMigrations;
                }
                else {
                    // Try to resolve from package location.
                    // This avoids issues with package hoisting.
                    try {
                        const packageRequire = (0, module_1.createRequire)(packagePath + '/');
                        migrations = packageRequire.resolve(migration.collection);
                    }
                    catch (e) {
                        (0, error_1.assertIsError)(e);
                        if (e.code === 'MODULE_NOT_FOUND') {
                            logger.error(`Migrations for package (${migration.package}) were not found.`);
                        }
                        else {
                            logger.error(`Unable to resolve migrations for package (${migration.package}).  [${e.message}]`);
                        }
                        return 1;
                    }
                }
                const result = await this.executeMigrations(workflow, migration.package, migrations, migration.from, migration.to, options.createCommits);
                // A non-zero value is a failure for the package's migrations
                if (result !== 0) {
                    return result;
                }
            }
        }
        return success ? 0 : 1;
    }
    /**
     * @return Whether or not the commit was successful.
     */
    commit(message) {
        const { logger } = this.context;
        // Check if a commit is needed.
        let commitNeeded;
        try {
            commitNeeded = hasChangesToCommit();
        }
        catch (err) {
            logger.error(`  Failed to read Git tree:\n${err.stderr}`);
            return false;
        }
        if (!commitNeeded) {
            logger.info('  No changes to commit after migration.');
            return true;
        }
        // Commit changes and abort on error.
        try {
            createCommit(message);
        }
        catch (err) {
            logger.error(`Failed to commit update (${message}):\n${err.stderr}`);
            return false;
        }
        // Notify user of the commit.
        const hash = findCurrentGitSha();
        const shortMessage = message.split('\n')[0];
        if (hash) {
            logger.info(`  Committed migration step (${getShortHash(hash)}): ${shortMessage}.`);
        }
        else {
            // Commit was successful, but reading the hash was not. Something weird happened,
            // but nothing that would stop the update. Just log the weirdness and continue.
            logger.info(`  Committed migration step: ${shortMessage}.`);
            logger.warn('  Failed to look up hash of most recent commit, continuing anyways.');
        }
        return true;
    }
    checkCleanGit() {
        try {
            const topLevel = (0, child_process_1.execSync)('git rev-parse --show-toplevel', {
                encoding: 'utf8',
                stdio: 'pipe',
            });
            const result = (0, child_process_1.execSync)('git status --porcelain', { encoding: 'utf8', stdio: 'pipe' });
            if (result.trim().length === 0) {
                return true;
            }
            // Only files inside the workspace root are relevant
            for (const entry of result.split('\n')) {
                const relativeEntry = path.relative(path.resolve(this.context.root), path.resolve(topLevel.trim(), entry.slice(3).trim()));
                if (!relativeEntry.startsWith('..') && !path.isAbsolute(relativeEntry)) {
                    return false;
                }
            }
        }
        catch { }
        return true;
    }
    /**
     * Checks if the current installed CLI version is older or newer than a compatible version.
     * @returns the version to install or null when there is no update to install.
     */
    async checkCLIVersion(packagesToUpdate, verbose = false, next = false) {
        const { version } = await (0, package_metadata_1.fetchPackageManifest)(`@angular/cli@${this.getCLIUpdateRunnerVersion(packagesToUpdate, next)}`, this.context.logger, {
            verbose,
            usingYarn: this.context.packageManager.name === workspace_schema_1.PackageManager.Yarn,
        });
        return version_1.VERSION.full === version ? null : version;
    }
    getCLIUpdateRunnerVersion(packagesToUpdate, next) {
        if (next) {
            return 'next';
        }
        const updatingAngularPackage = packagesToUpdate?.find((r) => ANGULAR_PACKAGES_REGEXP.test(r));
        if (updatingAngularPackage) {
            // If we are updating any Angular package we can update the CLI to the target version because
            // migrations for @angular/core@13 can be executed using Angular/cli@13.
            // This is same behaviour as `npx @angular/cli@13 update @angular/core@13`.
            // `@angular/cli@13` -> ['', 'angular/cli', '13']
            // `@angular/cli` -> ['', 'angular/cli']
            const tempVersion = coerceVersionNumber(updatingAngularPackage.split('@')[2]);
            return semver.parse(tempVersion)?.major ?? 'latest';
        }
        // When not updating an Angular package we cannot determine which schematic runtime the migration should to be executed in.
        // Typically, we can assume that the `@angular/cli` was updated previously.
        // Example: Angular official packages are typically updated prior to NGRX etc...
        // Therefore, we only update to the latest patch version of the installed major version of the Angular CLI.
        // This is important because we might end up in a scenario where locally Angular v12 is installed, updating NGRX from 11 to 12.
        // We end up using Angular ClI v13 to run the migrations if we run the migrations using the CLI installed major version + 1 logic.
        return version_1.VERSION.major;
    }
    async runTempBinary(packageName, args = []) {
        const { success, tempNodeModules } = await this.context.packageManager.installTemp(packageName);
        if (!success) {
            return 1;
        }
        // Remove version/tag etc... from package name
        // Ex: @angular/cli@latest -> @angular/cli
        const packageNameNoVersion = packageName.substring(0, packageName.lastIndexOf('@'));
        const pkgLocation = (0, path_1.join)(tempNodeModules, packageNameNoVersion);
        const packageJsonPath = (0, path_1.join)(pkgLocation, 'package.json');
        // Get a binary location for this package
        let binPath;
        if ((0, fs_1.existsSync)(packageJsonPath)) {
            const content = await fs_1.promises.readFile(packageJsonPath, 'utf-8');
            if (content) {
                const { bin = {} } = JSON.parse(content);
                const binKeys = Object.keys(bin);
                if (binKeys.length) {
                    binPath = (0, path_1.resolve)(pkgLocation, bin[binKeys[0]]);
                }
            }
        }
        if (!binPath) {
            throw new Error(`Cannot locate bin for temporary package: ${packageNameNoVersion}.`);
        }
        const { status, error } = (0, child_process_1.spawnSync)(process.execPath, [binPath, ...args], {
            stdio: 'inherit',
            env: {
                ...process.env,
                NG_DISABLE_VERSION_CHECK: 'true',
                NG_CLI_ANALYTICS: 'false',
            },
        });
        if (status === null && error) {
            throw error;
        }
        return status ?? 0;
    }
    packageManagerForce(verbose) {
        // npm 7+ can fail due to it incorrectly resolving peer dependencies that have valid SemVer
        // ranges during an update. Update will set correct versions of dependencies within the
        // package.json file. The force option is set to workaround these errors.
        // Example error:
        // npm ERR! Conflicting peer dependency: @angular/compiler-cli@14.0.0-rc.0
        // npm ERR! node_modules/@angular/compiler-cli
        // npm ERR!   peer @angular/compiler-cli@"^14.0.0 || ^14.0.0-rc" from @angular-devkit/build-angular@14.0.0-rc.0
        // npm ERR!   node_modules/@angular-devkit/build-angular
        // npm ERR!     dev @angular-devkit/build-angular@"~14.0.0-rc.0" from the root project
        if (this.context.packageManager.name === workspace_schema_1.PackageManager.Npm &&
            this.context.packageManager.version &&
            semver.gte(this.context.packageManager.version, '7.0.0')) {
            if (verbose) {
                this.context.logger.info('NPM 7+ detected -- enabling force option for package installation');
            }
            return true;
        }
        return false;
    }
    async getOptionalMigrationsToRun(optionalMigrations, packageName) {
        const { logger } = this.context;
        const numberOfMigrations = optionalMigrations.length;
        logger.info(`This package has ${numberOfMigrations} optional migration${numberOfMigrations > 1 ? 's' : ''} that can be executed.`);
        logger.info(''); // Extra trailing newline.
        if (!(0, tty_1.isTTY)()) {
            for (const migration of optionalMigrations) {
                const { title } = getMigrationTitleAndDescription(migration);
                logger.info(color_1.colors.cyan(color_1.colors.symbols.pointer) + ' ' + color_1.colors.bold(title));
                logger.info(color_1.colors.gray(`  ng update ${packageName} --name ${migration.name}`));
                logger.info(''); // Extra trailing newline.
            }
            return undefined;
        }
        const answer = await (0, prompt_1.askChoices)(`Select the migrations that you'd like to run`, optionalMigrations.map((migration) => {
            const { title } = getMigrationTitleAndDescription(migration);
            return {
                name: title,
                value: migration.name,
            };
        }), null);
        logger.info(''); // Extra trailing newline.
        return optionalMigrations.filter(({ name }) => answer?.includes(name));
    }
}
exports.default = UpdateCommandModule;
/**
 * @return Whether or not the working directory has Git changes to commit.
 */
function hasChangesToCommit() {
    // List all modified files not covered by .gitignore.
    // If any files are returned, then there must be something to commit.
    return (0, child_process_1.execSync)('git ls-files -m -d -o --exclude-standard').toString() !== '';
}
/**
 * Precondition: Must have pending changes to commit, they do not need to be staged.
 * Postcondition: The Git working tree is committed and the repo is clean.
 * @param message The commit message to use.
 */
function createCommit(message) {
    // Stage entire working tree for commit.
    (0, child_process_1.execSync)('git add -A', { encoding: 'utf8', stdio: 'pipe' });
    // Commit with the message passed via stdin to avoid bash escaping issues.
    (0, child_process_1.execSync)('git commit --no-verify -F -', { encoding: 'utf8', stdio: 'pipe', input: message });
}
/**
 * @return The Git SHA hash of the HEAD commit. Returns null if unable to retrieve the hash.
 */
function findCurrentGitSha() {
    try {
        return (0, child_process_1.execSync)('git rev-parse HEAD', { encoding: 'utf8', stdio: 'pipe' }).trim();
    }
    catch {
        return null;
    }
}
function getShortHash(commitHash) {
    return commitHash.slice(0, 9);
}
function coerceVersionNumber(version) {
    if (!version) {
        return undefined;
    }
    if (!/^\d{1,30}\.\d{1,30}\.\d{1,30}/.test(version)) {
        const match = version.match(/^\d{1,30}(\.\d{1,30})*/);
        if (!match) {
            return undefined;
        }
        if (!match[1]) {
            version = version.substring(0, match[0].length) + '.0.0' + version.substring(match[0].length);
        }
        else if (!match[2]) {
            version = version.substring(0, match[0].length) + '.0' + version.substring(match[0].length);
        }
        else {
            return undefined;
        }
    }
    return semver.valid(version) ?? undefined;
}
function getMigrationTitleAndDescription(migration) {
    const [title, ...description] = migration.description.split('. ');
    return {
        title: title.endsWith('.') ? title : title + '.',
        description: description.join('.\n  '),
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL3VwZGF0ZS9jbGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILDJEQUFpRztBQUNqRyw0REFJMEM7QUFDMUMsaURBQXNFO0FBQ3RFLDJCQUFnRDtBQUNoRCxtQ0FBdUM7QUFDdkMsc0VBQWtDO0FBQ2xDLDBFQUE2QztBQUM3QywyQ0FBNkI7QUFDN0IsK0JBQXFDO0FBQ3JDLCtDQUFpQztBQUVqQywyRUFBc0U7QUFDdEUseUVBSzhDO0FBQzlDLGlHQUE0RjtBQUM1RiwyRkFBeUY7QUFDekYsaURBQStDO0FBQy9DLDZFQUEwRTtBQUMxRSxpREFBc0Q7QUFDdEQsdURBQStEO0FBQy9ELHVFQUswQztBQUMxQywrREFLc0M7QUFDdEMsbURBQW9EO0FBQ3BELDZDQUE0QztBQUM1QyxxREFBa0Q7QUF5QmxELE1BQU0sdUJBQXVCLEdBQUcsNkJBQTZCLENBQUM7QUFDOUQsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO0FBRXRGLE1BQXFCLG1CQUFvQixTQUFRLDhCQUFnQztJQUFqRjs7UUFDVyxVQUFLLEdBQUcsNkJBQVksQ0FBQyxFQUFFLENBQUM7UUFDZCwwQkFBcUIsR0FBRyxLQUFLLENBQUM7UUFFakQsWUFBTyxHQUFHLHFCQUFxQixDQUFDO1FBQ2hDLGFBQVEsR0FBRyw4RUFBOEUsQ0FBQztRQUMxRix3QkFBbUIsR0FBRyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQXdnQy9ELENBQUM7SUF0Z0NDLE9BQU8sQ0FBQyxVQUFnQjtRQUN0QixPQUFPLFVBQVU7YUFDZCxVQUFVLENBQUMsVUFBVSxFQUFFO1lB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QyxHQUFHLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMvRjthQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDcEIsT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDN0Y7YUFBTTtZQUNMLE9BQU8sU0FBUyxDQUFDO1NBQ2xCO0tBQ0Y7SUFFRCxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksU0FBUyxDQUFDO0FBQzVDLENBQUM7QUFFRCxTQUFTLCtCQUErQixDQUFDLFNBQXdDO0lBSS9FLE1BQU0sQ0FBQyxLQUFLLEVBQUUsR0FBRyxXQUFXLENBQUMsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUVsRSxPQUFPO1FBQ0wsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUc7UUFDaEQsV0FBVyxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO0tBQ3ZDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFNjaGVtYXRpY0Rlc2NyaXB0aW9uLCBVbnN1Y2Nlc3NmdWxXb3JrZmxvd0V4ZWN1dGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7XG4gIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24sXG4gIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbixcbiAgTm9kZVdvcmtmbG93LFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90b29scyc7XG5pbXBvcnQgeyBTcGF3blN5bmNSZXR1cm5zLCBleGVjU3luYywgc3Bhd25TeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCBwcm9taXNlcyBhcyBmcyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGNyZWF0ZVJlcXVpcmUgfSBmcm9tICdtb2R1bGUnO1xuaW1wb3J0IG5wYSBmcm9tICducG0tcGFja2FnZS1hcmcnO1xuaW1wb3J0IHBpY2tNYW5pZmVzdCBmcm9tICducG0tcGljay1tYW5pZmVzdCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBBcmd2IH0gZnJvbSAneWFyZ3MnO1xuaW1wb3J0IHsgUGFja2FnZU1hbmFnZXIgfSBmcm9tICcuLi8uLi8uLi9saWIvY29uZmlnL3dvcmtzcGFjZS1zY2hlbWEnO1xuaW1wb3J0IHtcbiAgQ29tbWFuZE1vZHVsZSxcbiAgQ29tbWFuZE1vZHVsZUVycm9yLFxuICBDb21tYW5kU2NvcGUsXG4gIE9wdGlvbnMsXG59IGZyb20gJy4uLy4uL2NvbW1hbmQtYnVpbGRlci9jb21tYW5kLW1vZHVsZSc7XG5pbXBvcnQgeyBTY2hlbWF0aWNFbmdpbmVIb3N0IH0gZnJvbSAnLi4vLi4vY29tbWFuZC1idWlsZGVyL3V0aWxpdGllcy9zY2hlbWF0aWMtZW5naW5lLWhvc3QnO1xuaW1wb3J0IHsgc3Vic2NyaWJlVG9Xb3JrZmxvdyB9IGZyb20gJy4uLy4uL2NvbW1hbmQtYnVpbGRlci91dGlsaXRpZXMvc2NoZW1hdGljLXdvcmtmbG93JztcbmltcG9ydCB7IGNvbG9ycyB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9jb2xvcic7XG5pbXBvcnQgeyBkaXNhYmxlVmVyc2lvbkNoZWNrIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2Vudmlyb25tZW50LW9wdGlvbnMnO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy9lcnJvcic7XG5pbXBvcnQgeyB3cml0ZUVycm9yVG9Mb2dGaWxlIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL2xvZy1maWxlJztcbmltcG9ydCB7XG4gIFBhY2thZ2VJZGVudGlmaWVyLFxuICBQYWNrYWdlTWFuaWZlc3QsXG4gIGZldGNoUGFja2FnZU1hbmlmZXN0LFxuICBmZXRjaFBhY2thZ2VNZXRhZGF0YSxcbn0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL3BhY2thZ2UtbWV0YWRhdGEnO1xuaW1wb3J0IHtcbiAgUGFja2FnZVRyZWVOb2RlLFxuICBmaW5kUGFja2FnZUpzb24sXG4gIGdldFByb2plY3REZXBlbmRlbmNpZXMsXG4gIHJlYWRQYWNrYWdlSnNvbixcbn0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL3BhY2thZ2UtdHJlZSc7XG5pbXBvcnQgeyBhc2tDaG9pY2VzIH0gZnJvbSAnLi4vLi4vdXRpbGl0aWVzL3Byb21wdCc7XG5pbXBvcnQgeyBpc1RUWSB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy90dHknO1xuaW1wb3J0IHsgVkVSU0lPTiB9IGZyb20gJy4uLy4uL3V0aWxpdGllcy92ZXJzaW9uJztcblxuaW50ZXJmYWNlIFVwZGF0ZUNvbW1hbmRBcmdzIHtcbiAgcGFja2FnZXM/OiBzdHJpbmdbXTtcbiAgZm9yY2U6IGJvb2xlYW47XG4gIG5leHQ6IGJvb2xlYW47XG4gICdtaWdyYXRlLW9ubHknPzogYm9vbGVhbjtcbiAgbmFtZT86IHN0cmluZztcbiAgZnJvbT86IHN0cmluZztcbiAgdG8/OiBzdHJpbmc7XG4gICdhbGxvdy1kaXJ0eSc6IGJvb2xlYW47XG4gIHZlcmJvc2U6IGJvb2xlYW47XG4gICdjcmVhdGUtY29tbWl0cyc6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBNaWdyYXRpb25TY2hlbWF0aWNEZXNjcmlwdGlvblxuICBleHRlbmRzIFNjaGVtYXRpY0Rlc2NyaXB0aW9uPEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzY3JpcHRpb24sIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjcmlwdGlvbj4ge1xuICB2ZXJzaW9uPzogc3RyaW5nO1xuICBvcHRpb25hbD86IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBNaWdyYXRpb25TY2hlbWF0aWNEZXNjcmlwdGlvbldpdGhWZXJzaW9uIGV4dGVuZHMgTWlncmF0aW9uU2NoZW1hdGljRGVzY3JpcHRpb24ge1xuICB2ZXJzaW9uOiBzdHJpbmc7XG59XG5cbmNvbnN0IEFOR1VMQVJfUEFDS0FHRVNfUkVHRVhQID0gL15AKD86YW5ndWxhcnxuZ3VuaXZlcnNhbClcXC8vO1xuY29uc3QgVVBEQVRFX1NDSEVNQVRJQ19DT0xMRUNUSU9OID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ3NjaGVtYXRpYy9jb2xsZWN0aW9uLmpzb24nKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVXBkYXRlQ29tbWFuZE1vZHVsZSBleHRlbmRzIENvbW1hbmRNb2R1bGU8VXBkYXRlQ29tbWFuZEFyZ3M+IHtcbiAgb3ZlcnJpZGUgc2NvcGUgPSBDb21tYW5kU2NvcGUuSW47XG4gIHByb3RlY3RlZCBvdmVycmlkZSBzaG91bGRSZXBvcnRBbmFseXRpY3MgPSBmYWxzZTtcblxuICBjb21tYW5kID0gJ3VwZGF0ZSBbcGFja2FnZXMuLl0nO1xuICBkZXNjcmliZSA9ICdVcGRhdGVzIHlvdXIgd29ya3NwYWNlIGFuZCBpdHMgZGVwZW5kZW5jaWVzLiBTZWUgaHR0cHM6Ly91cGRhdGUuYW5ndWxhci5pby8uJztcbiAgbG9uZ0Rlc2NyaXB0aW9uUGF0aCA9IGpvaW4oX19kaXJuYW1lLCAnbG9uZy1kZXNjcmlwdGlvbi5tZCcpO1xuXG4gIGJ1aWxkZXIobG9jYWxZYXJnczogQXJndik6IEFyZ3Y8VXBkYXRlQ29tbWFuZEFyZ3M+IHtcbiAgICByZXR1cm4gbG9jYWxZYXJnc1xuICAgICAgLnBvc2l0aW9uYWwoJ3BhY2thZ2VzJywge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBuYW1lcyBvZiBwYWNrYWdlKHMpIHRvIHVwZGF0ZS4nLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgYXJyYXk6IHRydWUsXG4gICAgICB9KVxuICAgICAgLm9wdGlvbignZm9yY2UnLCB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSWdub3JlIHBlZXIgZGVwZW5kZW5jeSB2ZXJzaW9uIG1pc21hdGNoZXMuJyxcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIH0pXG4gICAgICAub3B0aW9uKCduZXh0Jywge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ1VzZSB0aGUgcHJlcmVsZWFzZSB2ZXJzaW9uLCBpbmNsdWRpbmcgYmV0YSBhbmQgUkNzLicsXG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICB9KVxuICAgICAgLm9wdGlvbignbWlncmF0ZS1vbmx5Jywge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ09ubHkgcGVyZm9ybSBhIG1pZ3JhdGlvbiwgZG8gbm90IHVwZGF0ZSB0aGUgaW5zdGFsbGVkIHZlcnNpb24uJyxcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgfSlcbiAgICAgIC5vcHRpb24oJ25hbWUnLCB7XG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICdUaGUgbmFtZSBvZiB0aGUgbWlncmF0aW9uIHRvIHJ1bi4gT25seSBhdmFpbGFibGUgd2hlbiBhIHNpbmdsZSBwYWNrYWdlIGlzIHVwZGF0ZWQuJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGNvbmZsaWN0czogWyd0bycsICdmcm9tJ10sXG4gICAgICB9KVxuICAgICAgLm9wdGlvbignZnJvbScsIHtcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgJ1ZlcnNpb24gZnJvbSB3aGljaCB0byBtaWdyYXRlIGZyb20uICcgK1xuICAgICAgICAgIGBPbmx5IGF2YWlsYWJsZSB3aGVuIGEgc2luZ2xlIHBhY2thZ2UgaXMgdXBkYXRlZCwgYW5kIG9ubHkgd2l0aCAnbWlncmF0ZS1vbmx5Jy5gLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgaW1wbGllczogWydtaWdyYXRlLW9ubHknXSxcbiAgICAgICAgY29uZmxpY3RzOiBbJ25hbWUnXSxcbiAgICAgIH0pXG4gICAgICAub3B0aW9uKCd0bycsIHtcbiAgICAgICAgZGVzY3JpYmU6XG4gICAgICAgICAgJ1ZlcnNpb24gdXAgdG8gd2hpY2ggdG8gYXBwbHkgbWlncmF0aW9ucy4gT25seSBhdmFpbGFibGUgd2hlbiBhIHNpbmdsZSBwYWNrYWdlIGlzIHVwZGF0ZWQsICcgK1xuICAgICAgICAgIGBhbmQgb25seSB3aXRoICdtaWdyYXRlLW9ubHknIG9wdGlvbi4gUmVxdWlyZXMgJ2Zyb20nIHRvIGJlIHNwZWNpZmllZC4gRGVmYXVsdCB0byB0aGUgaW5zdGFsbGVkIHZlcnNpb24gZGV0ZWN0ZWQuYCxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGltcGxpZXM6IFsnZnJvbScsICdtaWdyYXRlLW9ubHknXSxcbiAgICAgICAgY29uZmxpY3RzOiBbJ25hbWUnXSxcbiAgICAgIH0pXG4gICAgICAub3B0aW9uKCdhbGxvdy1kaXJ0eScsIHtcbiAgICAgICAgZGVzY3JpYmU6XG4gICAgICAgICAgJ1doZXRoZXIgdG8gYWxsb3cgdXBkYXRpbmcgd2hlbiB0aGUgcmVwb3NpdG9yeSBjb250YWlucyBtb2RpZmllZCBvciB1bnRyYWNrZWQgZmlsZXMuJyxcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIH0pXG4gICAgICAub3B0aW9uKCd2ZXJib3NlJywge1xuICAgICAgICBkZXNjcmliZTogJ0Rpc3BsYXkgYWRkaXRpb25hbCBkZXRhaWxzIGFib3V0IGludGVybmFsIG9wZXJhdGlvbnMgZHVyaW5nIGV4ZWN1dGlvbi4nLFxuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgfSlcbiAgICAgIC5vcHRpb24oJ2NyZWF0ZS1jb21taXRzJywge1xuICAgICAgICBkZXNjcmliZTogJ0NyZWF0ZSBzb3VyY2UgY29udHJvbCBjb21taXRzIGZvciB1cGRhdGVzIGFuZCBtaWdyYXRpb25zLicsXG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgYWxpYXM6IFsnQyddLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIH0pXG4gICAgICAubWlkZGxld2FyZSgoYXJndikgPT4ge1xuICAgICAgICBpZiAoYXJndi5uYW1lKSB7XG4gICAgICAgICAgYXJndlsnbWlncmF0ZS1vbmx5J10gPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgICAgcmV0dXJuIGFyZ3YgYXMgYW55O1xuICAgICAgfSlcbiAgICAgIC5jaGVjaygoeyBwYWNrYWdlcywgJ2FsbG93LWRpcnR5JzogYWxsb3dEaXJ0eSwgJ21pZ3JhdGUtb25seSc6IG1pZ3JhdGVPbmx5IH0pID0+IHtcbiAgICAgICAgY29uc3QgeyBsb2dnZXIgfSA9IHRoaXMuY29udGV4dDtcblxuICAgICAgICAvLyBUaGlzIGFsbG93cyB0aGUgdXNlciB0byBlYXNpbHkgcmVzZXQgYW55IGNoYW5nZXMgZnJvbSB0aGUgdXBkYXRlLlxuICAgICAgICBpZiAocGFja2FnZXM/Lmxlbmd0aCAmJiAhdGhpcy5jaGVja0NsZWFuR2l0KCkpIHtcbiAgICAgICAgICBpZiAoYWxsb3dEaXJ0eSkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm4oXG4gICAgICAgICAgICAgICdSZXBvc2l0b3J5IGlzIG5vdCBjbGVhbi4gVXBkYXRlIGNoYW5nZXMgd2lsbCBiZSBtaXhlZCB3aXRoIHByZS1leGlzdGluZyBjaGFuZ2VzLicsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29tbWFuZE1vZHVsZUVycm9yKFxuICAgICAgICAgICAgICAnUmVwb3NpdG9yeSBpcyBub3QgY2xlYW4uIFBsZWFzZSBjb21taXQgb3Igc3Rhc2ggYW55IGNoYW5nZXMgYmVmb3JlIHVwZGF0aW5nLicsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtaWdyYXRlT25seSkge1xuICAgICAgICAgIGlmIChwYWNrYWdlcz8ubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ29tbWFuZE1vZHVsZUVycm9yKFxuICAgICAgICAgICAgICBgQSBzaW5nbGUgcGFja2FnZSBtdXN0IGJlIHNwZWNpZmllZCB3aGVuIHVzaW5nIHRoZSAnbWlncmF0ZS1vbmx5JyBvcHRpb24uYCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KVxuICAgICAgLnN0cmljdCgpO1xuICB9XG5cbiAgYXN5bmMgcnVuKG9wdGlvbnM6IE9wdGlvbnM8VXBkYXRlQ29tbWFuZEFyZ3M+KTogUHJvbWlzZTxudW1iZXIgfCB2b2lkPiB7XG4gICAgY29uc3QgeyBsb2dnZXIsIHBhY2thZ2VNYW5hZ2VyIH0gPSB0aGlzLmNvbnRleHQ7XG5cbiAgICBwYWNrYWdlTWFuYWdlci5lbnN1cmVDb21wYXRpYmlsaXR5KCk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgY3VycmVudCBpbnN0YWxsZWQgQ0xJIHZlcnNpb24gaXMgb2xkZXIgdGhhbiB0aGUgbGF0ZXN0IGNvbXBhdGlibGUgdmVyc2lvbi5cbiAgICAvLyBTa2lwIHdoZW4gcnVubmluZyBgbmcgdXBkYXRlYCB3aXRob3V0IGEgcGFja2FnZSBuYW1lIGFzIHRoaXMgd2lsbCBub3QgdHJpZ2dlciBhbiBhY3R1YWwgdXBkYXRlLlxuICAgIGlmICghZGlzYWJsZVZlcnNpb25DaGVjayAmJiBvcHRpb25zLnBhY2thZ2VzPy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGNsaVZlcnNpb25Ub0luc3RhbGwgPSBhd2FpdCB0aGlzLmNoZWNrQ0xJVmVyc2lvbihcbiAgICAgICAgb3B0aW9ucy5wYWNrYWdlcyxcbiAgICAgICAgb3B0aW9ucy52ZXJib3NlLFxuICAgICAgICBvcHRpb25zLm5leHQsXG4gICAgICApO1xuXG4gICAgICBpZiAoY2xpVmVyc2lvblRvSW5zdGFsbCkge1xuICAgICAgICBsb2dnZXIud2FybihcbiAgICAgICAgICAnVGhlIGluc3RhbGxlZCBBbmd1bGFyIENMSSB2ZXJzaW9uIGlzIG91dGRhdGVkLlxcbicgK1xuICAgICAgICAgICAgYEluc3RhbGxpbmcgYSB0ZW1wb3JhcnkgQW5ndWxhciBDTEkgdmVyc2lvbmVkICR7Y2xpVmVyc2lvblRvSW5zdGFsbH0gdG8gcGVyZm9ybSB0aGUgdXBkYXRlLmAsXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucnVuVGVtcEJpbmFyeShgQGFuZ3VsYXIvY2xpQCR7Y2xpVmVyc2lvblRvSW5zdGFsbH1gLCBwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHBhY2thZ2VzOiBQYWNrYWdlSWRlbnRpZmllcltdID0gW107XG4gICAgZm9yIChjb25zdCByZXF1ZXN0IG9mIG9wdGlvbnMucGFja2FnZXMgPz8gW10pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBhY2thZ2VJZGVudGlmaWVyID0gbnBhKHJlcXVlc3QpO1xuXG4gICAgICAgIC8vIG9ubHkgcmVnaXN0cnkgaWRlbnRpZmllcnMgYXJlIHN1cHBvcnRlZFxuICAgICAgICBpZiAoIXBhY2thZ2VJZGVudGlmaWVyLnJlZ2lzdHJ5KSB7XG4gICAgICAgICAgbG9nZ2VyLmVycm9yKGBQYWNrYWdlICcke3JlcXVlc3R9JyBpcyBub3QgYSByZWdpc3RyeSBwYWNrYWdlIGlkZW50aWZlci5gKTtcblxuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhY2thZ2VzLnNvbWUoKHYpID0+IHYubmFtZSA9PT0gcGFja2FnZUlkZW50aWZpZXIubmFtZSkpIHtcbiAgICAgICAgICBsb2dnZXIuZXJyb3IoYER1cGxpY2F0ZSBwYWNrYWdlICcke3BhY2thZ2VJZGVudGlmaWVyLm5hbWV9JyBzcGVjaWZpZWQuYCk7XG5cbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLm1pZ3JhdGVPbmx5ICYmIHBhY2thZ2VJZGVudGlmaWVyLnJhd1NwZWMgIT09ICcqJykge1xuICAgICAgICAgIGxvZ2dlci53YXJuKCdQYWNrYWdlIHNwZWNpZmllciBoYXMgbm8gZWZmZWN0IHdoZW4gdXNpbmcgXCJtaWdyYXRlLW9ubHlcIiBvcHRpb24uJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBuZXh0IG9wdGlvbiBpcyB1c2VkIGFuZCBubyBzcGVjaWZpZXIgc3VwcGxpZWQsIHVzZSBuZXh0IHRhZ1xuICAgICAgICBpZiAob3B0aW9ucy5uZXh0ICYmIHBhY2thZ2VJZGVudGlmaWVyLnJhd1NwZWMgPT09ICcqJykge1xuICAgICAgICAgIHBhY2thZ2VJZGVudGlmaWVyLmZldGNoU3BlYyA9ICduZXh0JztcbiAgICAgICAgfVxuXG4gICAgICAgIHBhY2thZ2VzLnB1c2gocGFja2FnZUlkZW50aWZpZXIgYXMgUGFja2FnZUlkZW50aWZpZXIpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBhc3NlcnRJc0Vycm9yKGUpO1xuICAgICAgICBsb2dnZXIuZXJyb3IoZS5tZXNzYWdlKTtcblxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsb2dnZXIuaW5mbyhgVXNpbmcgcGFja2FnZSBtYW5hZ2VyOiAke2NvbG9ycy5ncmV5KHBhY2thZ2VNYW5hZ2VyLm5hbWUpfWApO1xuICAgIGxvZ2dlci5pbmZvKCdDb2xsZWN0aW5nIGluc3RhbGxlZCBkZXBlbmRlbmNpZXMuLi4nKTtcblxuICAgIGNvbnN0IHJvb3REZXBlbmRlbmNpZXMgPSBhd2FpdCBnZXRQcm9qZWN0RGVwZW5kZW5jaWVzKHRoaXMuY29udGV4dC5yb290KTtcbiAgICBsb2dnZXIuaW5mbyhgRm91bmQgJHtyb290RGVwZW5kZW5jaWVzLnNpemV9IGRlcGVuZGVuY2llcy5gKTtcblxuICAgIGNvbnN0IHdvcmtmbG93ID0gbmV3IE5vZGVXb3JrZmxvdyh0aGlzLmNvbnRleHQucm9vdCwge1xuICAgICAgcGFja2FnZU1hbmFnZXI6IHBhY2thZ2VNYW5hZ2VyLm5hbWUsXG4gICAgICBwYWNrYWdlTWFuYWdlckZvcmNlOiB0aGlzLnBhY2thZ2VNYW5hZ2VyRm9yY2Uob3B0aW9ucy52ZXJib3NlKSxcbiAgICAgIC8vIF9fZGlybmFtZSAtPiBmYXZvciBAc2NoZW1hdGljcy91cGRhdGUgZnJvbSB0aGlzIHBhY2thZ2VcbiAgICAgIC8vIE90aGVyd2lzZSwgdXNlIHBhY2thZ2VzIGZyb20gdGhlIGFjdGl2ZSB3b3Jrc3BhY2UgKG1pZ3JhdGlvbnMpXG4gICAgICByZXNvbHZlUGF0aHM6IFtfX2Rpcm5hbWUsIHRoaXMuY29udGV4dC5yb290XSxcbiAgICAgIHNjaGVtYVZhbGlkYXRpb246IHRydWUsXG4gICAgICBlbmdpbmVIb3N0Q3JlYXRvcjogKG9wdGlvbnMpID0+IG5ldyBTY2hlbWF0aWNFbmdpbmVIb3N0KG9wdGlvbnMucmVzb2x2ZVBhdGhzKSxcbiAgICB9KTtcblxuICAgIGlmIChwYWNrYWdlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIFNob3cgc3RhdHVzXG4gICAgICBjb25zdCB7IHN1Y2Nlc3MgfSA9IGF3YWl0IHRoaXMuZXhlY3V0ZVNjaGVtYXRpYyhcbiAgICAgICAgd29ya2Zsb3csXG4gICAgICAgIFVQREFURV9TQ0hFTUFUSUNfQ09MTEVDVElPTixcbiAgICAgICAgJ3VwZGF0ZScsXG4gICAgICAgIHtcbiAgICAgICAgICBmb3JjZTogb3B0aW9ucy5mb3JjZSxcbiAgICAgICAgICBuZXh0OiBvcHRpb25zLm5leHQsXG4gICAgICAgICAgdmVyYm9zZTogb3B0aW9ucy52ZXJib3NlLFxuICAgICAgICAgIHBhY2thZ2VNYW5hZ2VyOiBwYWNrYWdlTWFuYWdlci5uYW1lLFxuICAgICAgICAgIHBhY2thZ2VzOiBbXSxcbiAgICAgICAgfSxcbiAgICAgICk7XG5cbiAgICAgIHJldHVybiBzdWNjZXNzID8gMCA6IDE7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdGlvbnMubWlncmF0ZU9ubHlcbiAgICAgID8gdGhpcy5taWdyYXRlT25seSh3b3JrZmxvdywgKG9wdGlvbnMucGFja2FnZXMgPz8gW10pWzBdLCByb290RGVwZW5kZW5jaWVzLCBvcHRpb25zKVxuICAgICAgOiB0aGlzLnVwZGF0ZVBhY2thZ2VzQW5kTWlncmF0ZSh3b3JrZmxvdywgcm9vdERlcGVuZGVuY2llcywgb3B0aW9ucywgcGFja2FnZXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlU2NoZW1hdGljKFxuICAgIHdvcmtmbG93OiBOb2RlV29ya2Zsb3csXG4gICAgY29sbGVjdGlvbjogc3RyaW5nLFxuICAgIHNjaGVtYXRpYzogc3RyaW5nLFxuICAgIG9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge30sXG4gICk6IFByb21pc2U8eyBzdWNjZXNzOiBib29sZWFuOyBmaWxlczogU2V0PHN0cmluZz4gfT4ge1xuICAgIGNvbnN0IHsgbG9nZ2VyIH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3Qgd29ya2Zsb3dTdWJzY3JpcHRpb24gPSBzdWJzY3JpYmVUb1dvcmtmbG93KHdvcmtmbG93LCBsb2dnZXIpO1xuXG4gICAgLy8gVE9ETzogQWxsb3cgcGFzc2luZyBhIHNjaGVtYXRpYyBpbnN0YW5jZSBkaXJlY3RseVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB3b3JrZmxvd1xuICAgICAgICAuZXhlY3V0ZSh7XG4gICAgICAgICAgY29sbGVjdGlvbixcbiAgICAgICAgICBzY2hlbWF0aWMsXG4gICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICBsb2dnZXIsXG4gICAgICAgIH0pXG4gICAgICAgIC50b1Byb21pc2UoKTtcblxuICAgICAgcmV0dXJuIHsgc3VjY2VzczogIXdvcmtmbG93U3Vic2NyaXB0aW9uLmVycm9yLCBmaWxlczogd29ya2Zsb3dTdWJzY3JpcHRpb24uZmlsZXMgfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIFVuc3VjY2Vzc2Z1bFdvcmtmbG93RXhlY3V0aW9uKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcihgJHtjb2xvcnMuc3ltYm9scy5jcm9zc30gTWlncmF0aW9uIGZhaWxlZC4gU2VlIGFib3ZlIGZvciBmdXJ0aGVyIGRldGFpbHMuXFxuYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhc3NlcnRJc0Vycm9yKGUpO1xuICAgICAgICBjb25zdCBsb2dQYXRoID0gd3JpdGVFcnJvclRvTG9nRmlsZShlKTtcbiAgICAgICAgbG9nZ2VyLmZhdGFsKFxuICAgICAgICAgIGAke2NvbG9ycy5zeW1ib2xzLmNyb3NzfSBNaWdyYXRpb24gZmFpbGVkOiAke2UubWVzc2FnZX1cXG5gICtcbiAgICAgICAgICAgIGAgIFNlZSBcIiR7bG9nUGF0aH1cIiBmb3IgZnVydGhlciBkZXRhaWxzLlxcbmAsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBmaWxlczogd29ya2Zsb3dTdWJzY3JpcHRpb24uZmlsZXMgfTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgd29ya2Zsb3dTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiBXaGV0aGVyIG9yIG5vdCB0aGUgbWlncmF0aW9uIHdhcyBwZXJmb3JtZWQgc3VjY2Vzc2Z1bGx5LlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlTWlncmF0aW9uKFxuICAgIHdvcmtmbG93OiBOb2RlV29ya2Zsb3csXG4gICAgcGFja2FnZU5hbWU6IHN0cmluZyxcbiAgICBjb2xsZWN0aW9uUGF0aDogc3RyaW5nLFxuICAgIG1pZ3JhdGlvbk5hbWU6IHN0cmluZyxcbiAgICBjb21taXQ/OiBib29sZWFuLFxuICApOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHsgbG9nZ2VyIH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IHdvcmtmbG93LmVuZ2luZS5jcmVhdGVDb2xsZWN0aW9uKGNvbGxlY3Rpb25QYXRoKTtcbiAgICBjb25zdCBuYW1lID0gY29sbGVjdGlvbi5saXN0U2NoZW1hdGljTmFtZXMoKS5maW5kKChuYW1lKSA9PiBuYW1lID09PSBtaWdyYXRpb25OYW1lKTtcbiAgICBpZiAoIW5hbWUpIHtcbiAgICAgIGxvZ2dlci5lcnJvcihgQ2Fubm90IGZpbmQgbWlncmF0aW9uICcke21pZ3JhdGlvbk5hbWV9JyBpbiAnJHtwYWNrYWdlTmFtZX0nLmApO1xuXG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICBsb2dnZXIuaW5mbyhjb2xvcnMuY3lhbihgKiogRXhlY3V0aW5nICcke21pZ3JhdGlvbk5hbWV9JyBvZiBwYWNrYWdlICcke3BhY2thZ2VOYW1lfScgKipcXG5gKSk7XG4gICAgY29uc3Qgc2NoZW1hdGljID0gd29ya2Zsb3cuZW5naW5lLmNyZWF0ZVNjaGVtYXRpYyhuYW1lLCBjb2xsZWN0aW9uKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWN1dGVQYWNrYWdlTWlncmF0aW9ucyh3b3JrZmxvdywgW3NjaGVtYXRpYy5kZXNjcmlwdGlvbl0sIHBhY2thZ2VOYW1lLCBjb21taXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4gV2hldGhlciBvciBub3QgdGhlIG1pZ3JhdGlvbnMgd2VyZSBwZXJmb3JtZWQgc3VjY2Vzc2Z1bGx5LlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlTWlncmF0aW9ucyhcbiAgICB3b3JrZmxvdzogTm9kZVdvcmtmbG93LFxuICAgIHBhY2thZ2VOYW1lOiBzdHJpbmcsXG4gICAgY29sbGVjdGlvblBhdGg6IHN0cmluZyxcbiAgICBmcm9tOiBzdHJpbmcsXG4gICAgdG86IHN0cmluZyxcbiAgICBjb21taXQ/OiBib29sZWFuLFxuICApOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSB3b3JrZmxvdy5lbmdpbmUuY3JlYXRlQ29sbGVjdGlvbihjb2xsZWN0aW9uUGF0aCk7XG4gICAgY29uc3QgbWlncmF0aW9uUmFuZ2UgPSBuZXcgc2VtdmVyLlJhbmdlKFxuICAgICAgJz4nICsgKHNlbXZlci5wcmVyZWxlYXNlKGZyb20pID8gZnJvbS5zcGxpdCgnLScpWzBdICsgJy0wJyA6IGZyb20pICsgJyA8PScgKyB0by5zcGxpdCgnLScpWzBdLFxuICAgICk7XG5cbiAgICBjb25zdCByZXF1aXJlZE1pZ3JhdGlvbnM6IE1pZ3JhdGlvblNjaGVtYXRpY0Rlc2NyaXB0aW9uV2l0aFZlcnNpb25bXSA9IFtdO1xuICAgIGNvbnN0IG9wdGlvbmFsTWlncmF0aW9uczogTWlncmF0aW9uU2NoZW1hdGljRGVzY3JpcHRpb25XaXRoVmVyc2lvbltdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgY29sbGVjdGlvbi5saXN0U2NoZW1hdGljTmFtZXMoKSkge1xuICAgICAgY29uc3Qgc2NoZW1hdGljID0gd29ya2Zsb3cuZW5naW5lLmNyZWF0ZVNjaGVtYXRpYyhuYW1lLCBjb2xsZWN0aW9uKTtcbiAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gc2NoZW1hdGljLmRlc2NyaXB0aW9uIGFzIE1pZ3JhdGlvblNjaGVtYXRpY0Rlc2NyaXB0aW9uO1xuXG4gICAgICBkZXNjcmlwdGlvbi52ZXJzaW9uID0gY29lcmNlVmVyc2lvbk51bWJlcihkZXNjcmlwdGlvbi52ZXJzaW9uKTtcbiAgICAgIGlmICghZGVzY3JpcHRpb24udmVyc2lvbikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNlbXZlci5zYXRpc2ZpZXMoZGVzY3JpcHRpb24udmVyc2lvbiwgbWlncmF0aW9uUmFuZ2UsIHsgaW5jbHVkZVByZXJlbGVhc2U6IHRydWUgfSkpIHtcbiAgICAgICAgKGRlc2NyaXB0aW9uLm9wdGlvbmFsID8gb3B0aW9uYWxNaWdyYXRpb25zIDogcmVxdWlyZWRNaWdyYXRpb25zKS5wdXNoKFxuICAgICAgICAgIGRlc2NyaXB0aW9uIGFzIE1pZ3JhdGlvblNjaGVtYXRpY0Rlc2NyaXB0aW9uV2l0aFZlcnNpb24sXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJlcXVpcmVkTWlncmF0aW9ucy5sZW5ndGggPT09IDAgJiYgb3B0aW9uYWxNaWdyYXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgLy8gUmVxdWlyZWQgbWlncmF0aW9uc1xuICAgIGlmIChyZXF1aXJlZE1pZ3JhdGlvbnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLmNvbnRleHQubG9nZ2VyLmluZm8oXG4gICAgICAgIGNvbG9ycy5jeWFuKGAqKiBFeGVjdXRpbmcgbWlncmF0aW9ucyBvZiBwYWNrYWdlICcke3BhY2thZ2VOYW1lfScgKipcXG5gKSxcbiAgICAgICk7XG5cbiAgICAgIHJlcXVpcmVkTWlncmF0aW9ucy5zb3J0KFxuICAgICAgICAoYSwgYikgPT4gc2VtdmVyLmNvbXBhcmUoYS52ZXJzaW9uLCBiLnZlcnNpb24pIHx8IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSksXG4gICAgICApO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmV4ZWN1dGVQYWNrYWdlTWlncmF0aW9ucyhcbiAgICAgICAgd29ya2Zsb3csXG4gICAgICAgIHJlcXVpcmVkTWlncmF0aW9ucyxcbiAgICAgICAgcGFja2FnZU5hbWUsXG4gICAgICAgIGNvbW1pdCxcbiAgICAgICk7XG5cbiAgICAgIGlmIChyZXN1bHQgPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gT3B0aW9uYWwgbWlncmF0aW9uc1xuICAgIGlmIChvcHRpb25hbE1pZ3JhdGlvbnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLmNvbnRleHQubG9nZ2VyLmluZm8oXG4gICAgICAgIGNvbG9ycy5tYWdlbnRhKGAqKiBPcHRpb25hbCBtaWdyYXRpb25zIG9mIHBhY2thZ2UgJyR7cGFja2FnZU5hbWV9JyAqKlxcbmApLFxuICAgICAgKTtcblxuICAgICAgb3B0aW9uYWxNaWdyYXRpb25zLnNvcnQoXG4gICAgICAgIChhLCBiKSA9PiBzZW12ZXIuY29tcGFyZShhLnZlcnNpb24sIGIudmVyc2lvbikgfHwgYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKSxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IG1pZ3JhdGlvbnNUb1J1biA9IGF3YWl0IHRoaXMuZ2V0T3B0aW9uYWxNaWdyYXRpb25zVG9SdW4oXG4gICAgICAgIG9wdGlvbmFsTWlncmF0aW9ucyxcbiAgICAgICAgcGFja2FnZU5hbWUsXG4gICAgICApO1xuXG4gICAgICBpZiAobWlncmF0aW9uc1RvUnVuPy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY3V0ZVBhY2thZ2VNaWdyYXRpb25zKHdvcmtmbG93LCBtaWdyYXRpb25zVG9SdW4sIHBhY2thZ2VOYW1lLCBjb21taXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlUGFja2FnZU1pZ3JhdGlvbnMoXG4gICAgd29ya2Zsb3c6IE5vZGVXb3JrZmxvdyxcbiAgICBtaWdyYXRpb25zOiBNaWdyYXRpb25TY2hlbWF0aWNEZXNjcmlwdGlvbltdLFxuICAgIHBhY2thZ2VOYW1lOiBzdHJpbmcsXG4gICAgY29tbWl0ID0gZmFsc2UsXG4gICk6IFByb21pc2U8MSB8IDA+IHtcbiAgICBjb25zdCB7IGxvZ2dlciB9ID0gdGhpcy5jb250ZXh0O1xuICAgIGZvciAoY29uc3QgbWlncmF0aW9uIG9mIG1pZ3JhdGlvbnMpIHtcbiAgICAgIGNvbnN0IHsgdGl0bGUsIGRlc2NyaXB0aW9uIH0gPSBnZXRNaWdyYXRpb25UaXRsZUFuZERlc2NyaXB0aW9uKG1pZ3JhdGlvbik7XG5cbiAgICAgIGxvZ2dlci5pbmZvKGNvbG9ycy5jeWFuKGNvbG9ycy5zeW1ib2xzLnBvaW50ZXIpICsgJyAnICsgY29sb3JzLmJvbGQodGl0bGUpKTtcblxuICAgICAgaWYgKGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCcgICcgKyBkZXNjcmlwdGlvbik7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgc3VjY2VzcywgZmlsZXMgfSA9IGF3YWl0IHRoaXMuZXhlY3V0ZVNjaGVtYXRpYyhcbiAgICAgICAgd29ya2Zsb3csXG4gICAgICAgIG1pZ3JhdGlvbi5jb2xsZWN0aW9uLm5hbWUsXG4gICAgICAgIG1pZ3JhdGlvbi5uYW1lLFxuICAgICAgKTtcbiAgICAgIGlmICghc3VjY2Vzcykge1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgbGV0IG1vZGlmaWVkRmlsZXNUZXh0OiBzdHJpbmc7XG4gICAgICBzd2l0Y2ggKGZpbGVzLnNpemUpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgIG1vZGlmaWVkRmlsZXNUZXh0ID0gJ05vIGNoYW5nZXMgbWFkZSc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBtb2RpZmllZEZpbGVzVGV4dCA9ICcxIGZpbGUgbW9kaWZpZWQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIG1vZGlmaWVkRmlsZXNUZXh0ID0gYCR7ZmlsZXMuc2l6ZX0gZmlsZXMgbW9kaWZpZWRgO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBsb2dnZXIuaW5mbyhgICBNaWdyYXRpb24gY29tcGxldGVkICgke21vZGlmaWVkRmlsZXNUZXh0fSkuYCk7XG5cbiAgICAgIC8vIENvbW1pdCBtaWdyYXRpb25cbiAgICAgIGlmIChjb21taXQpIHtcbiAgICAgICAgY29uc3QgY29tbWl0UHJlZml4ID0gYCR7cGFja2FnZU5hbWV9IG1pZ3JhdGlvbiAtICR7bWlncmF0aW9uLm5hbWV9YDtcbiAgICAgICAgY29uc3QgY29tbWl0TWVzc2FnZSA9IG1pZ3JhdGlvbi5kZXNjcmlwdGlvblxuICAgICAgICAgID8gYCR7Y29tbWl0UHJlZml4fVxcblxcbiR7bWlncmF0aW9uLmRlc2NyaXB0aW9ufWBcbiAgICAgICAgICA6IGNvbW1pdFByZWZpeDtcbiAgICAgICAgY29uc3QgY29tbWl0dGVkID0gdGhpcy5jb21taXQoY29tbWl0TWVzc2FnZSk7XG4gICAgICAgIGlmICghY29tbWl0dGVkKSB7XG4gICAgICAgICAgLy8gRmFpbGVkIHRvIGNvbW1pdCwgc29tZXRoaW5nIHdlbnQgd3JvbmcuIEFib3J0IHRoZSB1cGRhdGUuXG4gICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbG9nZ2VyLmluZm8oJycpOyAvLyBFeHRyYSB0cmFpbGluZyBuZXdsaW5lLlxuICAgIH1cblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBtaWdyYXRlT25seShcbiAgICB3b3JrZmxvdzogTm9kZVdvcmtmbG93LFxuICAgIHBhY2thZ2VOYW1lOiBzdHJpbmcsXG4gICAgcm9vdERlcGVuZGVuY2llczogTWFwPHN0cmluZywgUGFja2FnZVRyZWVOb2RlPixcbiAgICBvcHRpb25zOiBPcHRpb25zPFVwZGF0ZUNvbW1hbmRBcmdzPixcbiAgKTogUHJvbWlzZTxudW1iZXIgfCB2b2lkPiB7XG4gICAgY29uc3QgeyBsb2dnZXIgfSA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCBwYWNrYWdlRGVwZW5kZW5jeSA9IHJvb3REZXBlbmRlbmNpZXMuZ2V0KHBhY2thZ2VOYW1lKTtcbiAgICBsZXQgcGFja2FnZVBhdGggPSBwYWNrYWdlRGVwZW5kZW5jeT8ucGF0aDtcbiAgICBsZXQgcGFja2FnZU5vZGUgPSBwYWNrYWdlRGVwZW5kZW5jeT8ucGFja2FnZTtcbiAgICBpZiAocGFja2FnZURlcGVuZGVuY3kgJiYgIXBhY2thZ2VOb2RlKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoJ1BhY2thZ2UgZm91bmQgaW4gcGFja2FnZS5qc29uIGJ1dCBpcyBub3QgaW5zdGFsbGVkLicpO1xuXG4gICAgICByZXR1cm4gMTtcbiAgICB9IGVsc2UgaWYgKCFwYWNrYWdlRGVwZW5kZW5jeSkge1xuICAgICAgLy8gQWxsb3cgcnVubmluZyBtaWdyYXRpb25zIG9uIHRyYW5zaXRpdmVseSBpbnN0YWxsZWQgZGVwZW5kZW5jaWVzXG4gICAgICAvLyBUaGVyZSBjYW4gdGVjaG5pY2FsbHkgYmUgbmVzdGVkIG11bHRpcGxlIHZlcnNpb25zXG4gICAgICAvLyBUT0RPOiBJZiBtdWx0aXBsZSwgdGhpcyBzaG91bGQgZmluZCBhbGwgdmVyc2lvbnMgYW5kIGFzayB3aGljaCBvbmUgdG8gdXNlXG4gICAgICBjb25zdCBwYWNrYWdlSnNvbiA9IGZpbmRQYWNrYWdlSnNvbih0aGlzLmNvbnRleHQucm9vdCwgcGFja2FnZU5hbWUpO1xuICAgICAgaWYgKHBhY2thZ2VKc29uKSB7XG4gICAgICAgIHBhY2thZ2VQYXRoID0gcGF0aC5kaXJuYW1lKHBhY2thZ2VKc29uKTtcbiAgICAgICAgcGFja2FnZU5vZGUgPSBhd2FpdCByZWFkUGFja2FnZUpzb24ocGFja2FnZUpzb24pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcGFja2FnZU5vZGUgfHwgIXBhY2thZ2VQYXRoKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoJ1BhY2thZ2UgaXMgbm90IGluc3RhbGxlZC4nKTtcblxuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlTWV0YWRhdGEgPSBwYWNrYWdlTm9kZVsnbmctdXBkYXRlJ107XG4gICAgbGV0IG1pZ3JhdGlvbnMgPSB1cGRhdGVNZXRhZGF0YT8ubWlncmF0aW9ucztcbiAgICBpZiAobWlncmF0aW9ucyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoJ1BhY2thZ2UgZG9lcyBub3QgcHJvdmlkZSBtaWdyYXRpb25zLicpO1xuXG4gICAgICByZXR1cm4gMTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtaWdyYXRpb25zICE9PSAnc3RyaW5nJykge1xuICAgICAgbG9nZ2VyLmVycm9yKCdQYWNrYWdlIGNvbnRhaW5zIGEgbWFsZm9ybWVkIG1pZ3JhdGlvbnMgZmllbGQuJyk7XG5cbiAgICAgIHJldHVybiAxO1xuICAgIH0gZWxzZSBpZiAocGF0aC5wb3NpeC5pc0Fic29sdXRlKG1pZ3JhdGlvbnMpIHx8IHBhdGgud2luMzIuaXNBYnNvbHV0ZShtaWdyYXRpb25zKSkge1xuICAgICAgbG9nZ2VyLmVycm9yKFxuICAgICAgICAnUGFja2FnZSBjb250YWlucyBhbiBpbnZhbGlkIG1pZ3JhdGlvbnMgZmllbGQuIEFic29sdXRlIHBhdGhzIGFyZSBub3QgcGVybWl0dGVkLicsXG4gICAgICApO1xuXG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICAvLyBOb3JtYWxpemUgc2xhc2hlc1xuICAgIG1pZ3JhdGlvbnMgPSBtaWdyYXRpb25zLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcblxuICAgIGlmIChtaWdyYXRpb25zLnN0YXJ0c1dpdGgoJy4uLycpKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoXG4gICAgICAgICdQYWNrYWdlIGNvbnRhaW5zIGFuIGludmFsaWQgbWlncmF0aW9ucyBmaWVsZC4gUGF0aHMgb3V0c2lkZSB0aGUgcGFja2FnZSByb290IGFyZSBub3QgcGVybWl0dGVkLicsXG4gICAgICApO1xuXG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiBpdCBpcyBhIHBhY2thZ2UtbG9jYWwgbG9jYXRpb25cbiAgICBjb25zdCBsb2NhbE1pZ3JhdGlvbnMgPSBwYXRoLmpvaW4ocGFja2FnZVBhdGgsIG1pZ3JhdGlvbnMpO1xuICAgIGlmIChleGlzdHNTeW5jKGxvY2FsTWlncmF0aW9ucykpIHtcbiAgICAgIG1pZ3JhdGlvbnMgPSBsb2NhbE1pZ3JhdGlvbnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRyeSB0byByZXNvbHZlIGZyb20gcGFja2FnZSBsb2NhdGlvbi5cbiAgICAgIC8vIFRoaXMgYXZvaWRzIGlzc3VlcyB3aXRoIHBhY2thZ2UgaG9pc3RpbmcuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBwYWNrYWdlUmVxdWlyZSA9IGNyZWF0ZVJlcXVpcmUocGFja2FnZVBhdGggKyAnLycpO1xuICAgICAgICBtaWdyYXRpb25zID0gcGFja2FnZVJlcXVpcmUucmVzb2x2ZShtaWdyYXRpb25zKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgYXNzZXJ0SXNFcnJvcihlKTtcbiAgICAgICAgaWYgKGUuY29kZSA9PT0gJ01PRFVMRV9OT1RfRk9VTkQnKSB7XG4gICAgICAgICAgbG9nZ2VyLmVycm9yKCdNaWdyYXRpb25zIGZvciBwYWNrYWdlIHdlcmUgbm90IGZvdW5kLicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvZ2dlci5lcnJvcihgVW5hYmxlIHRvIHJlc29sdmUgbWlncmF0aW9ucyBmb3IgcGFja2FnZS4gIFske2UubWVzc2FnZX1dYCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5uYW1lKSB7XG4gICAgICByZXR1cm4gdGhpcy5leGVjdXRlTWlncmF0aW9uKFxuICAgICAgICB3b3JrZmxvdyxcbiAgICAgICAgcGFja2FnZU5hbWUsXG4gICAgICAgIG1pZ3JhdGlvbnMsXG4gICAgICAgIG9wdGlvbnMubmFtZSxcbiAgICAgICAgb3B0aW9ucy5jcmVhdGVDb21taXRzLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBmcm9tID0gY29lcmNlVmVyc2lvbk51bWJlcihvcHRpb25zLmZyb20pO1xuICAgIGlmICghZnJvbSkge1xuICAgICAgbG9nZ2VyLmVycm9yKGBcImZyb21cIiB2YWx1ZSBbJHtvcHRpb25zLmZyb219XSBpcyBub3QgYSB2YWxpZCB2ZXJzaW9uLmApO1xuXG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5leGVjdXRlTWlncmF0aW9ucyhcbiAgICAgIHdvcmtmbG93LFxuICAgICAgcGFja2FnZU5hbWUsXG4gICAgICBtaWdyYXRpb25zLFxuICAgICAgZnJvbSxcbiAgICAgIG9wdGlvbnMudG8gfHwgcGFja2FnZU5vZGUudmVyc2lvbixcbiAgICAgIG9wdGlvbnMuY3JlYXRlQ29tbWl0cyxcbiAgICApO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1saW5lcy1wZXItZnVuY3Rpb25cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGVQYWNrYWdlc0FuZE1pZ3JhdGUoXG4gICAgd29ya2Zsb3c6IE5vZGVXb3JrZmxvdyxcbiAgICByb290RGVwZW5kZW5jaWVzOiBNYXA8c3RyaW5nLCBQYWNrYWdlVHJlZU5vZGU+LFxuICAgIG9wdGlvbnM6IE9wdGlvbnM8VXBkYXRlQ29tbWFuZEFyZ3M+LFxuICAgIHBhY2thZ2VzOiBQYWNrYWdlSWRlbnRpZmllcltdLFxuICApOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHsgbG9nZ2VyIH0gPSB0aGlzLmNvbnRleHQ7XG5cbiAgICBjb25zdCBsb2dWZXJib3NlID0gKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKG9wdGlvbnMudmVyYm9zZSkge1xuICAgICAgICBsb2dnZXIuaW5mbyhtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgcmVxdWVzdHM6IHtcbiAgICAgIGlkZW50aWZpZXI6IFBhY2thZ2VJZGVudGlmaWVyO1xuICAgICAgbm9kZTogUGFja2FnZVRyZWVOb2RlO1xuICAgIH1bXSA9IFtdO1xuXG4gICAgLy8gVmFsaWRhdGUgcGFja2FnZXMgYWN0dWFsbHkgYXJlIHBhcnQgb2YgdGhlIHdvcmtzcGFjZVxuICAgIGZvciAoY29uc3QgcGtnIG9mIHBhY2thZ2VzKSB7XG4gICAgICBjb25zdCBub2RlID0gcm9vdERlcGVuZGVuY2llcy5nZXQocGtnLm5hbWUpO1xuICAgICAgaWYgKCFub2RlPy5wYWNrYWdlKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcihgUGFja2FnZSAnJHtwa2cubmFtZX0nIGlzIG5vdCBhIGRlcGVuZGVuY3kuYCk7XG5cbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGEgc3BlY2lmaWMgdmVyc2lvbiBpcyByZXF1ZXN0ZWQgYW5kIG1hdGNoZXMgdGhlIGluc3RhbGxlZCB2ZXJzaW9uLCBza2lwLlxuICAgICAgaWYgKHBrZy50eXBlID09PSAndmVyc2lvbicgJiYgbm9kZS5wYWNrYWdlLnZlcnNpb24gPT09IHBrZy5mZXRjaFNwZWMpIHtcbiAgICAgICAgbG9nZ2VyLmluZm8oYFBhY2thZ2UgJyR7cGtnLm5hbWV9JyBpcyBhbHJlYWR5IGF0ICcke3BrZy5mZXRjaFNwZWN9Jy5gKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHJlcXVlc3RzLnB1c2goeyBpZGVudGlmaWVyOiBwa2csIG5vZGUgfSk7XG4gICAgfVxuXG4gICAgaWYgKHJlcXVlc3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgbG9nZ2VyLmluZm8oJ0ZldGNoaW5nIGRlcGVuZGVuY3kgbWV0YWRhdGEgZnJvbSByZWdpc3RyeS4uLicpO1xuXG4gICAgY29uc3QgcGFja2FnZXNUb1VwZGF0ZTogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHsgaWRlbnRpZmllcjogcmVxdWVzdElkZW50aWZpZXIsIG5vZGUgfSBvZiByZXF1ZXN0cykge1xuICAgICAgY29uc3QgcGFja2FnZU5hbWUgPSByZXF1ZXN0SWRlbnRpZmllci5uYW1lO1xuXG4gICAgICBsZXQgbWV0YWRhdGE7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBNZXRhZGF0YSByZXF1ZXN0cyBhcmUgaW50ZXJuYWxseSBjYWNoZWQ7IG11bHRpcGxlIHJlcXVlc3RzIGZvciBzYW1lIG5hbWVcbiAgICAgICAgLy8gZG9lcyBub3QgcmVzdWx0IGluIGFkZGl0aW9uYWwgbmV0d29yayB0cmFmZmljXG4gICAgICAgIG1ldGFkYXRhID0gYXdhaXQgZmV0Y2hQYWNrYWdlTWV0YWRhdGEocGFja2FnZU5hbWUsIGxvZ2dlciwge1xuICAgICAgICAgIHZlcmJvc2U6IG9wdGlvbnMudmVyYm9zZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGFzc2VydElzRXJyb3IoZSk7XG4gICAgICAgIGxvZ2dlci5lcnJvcihgRXJyb3IgZmV0Y2hpbmcgbWV0YWRhdGEgZm9yICcke3BhY2thZ2VOYW1lfSc6IGAgKyBlLm1lc3NhZ2UpO1xuXG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuXG4gICAgICAvLyBUcnkgdG8gZmluZCBhIHBhY2thZ2UgdmVyc2lvbiBiYXNlZCBvbiB0aGUgdXNlciByZXF1ZXN0ZWQgcGFja2FnZSBzcGVjaWZpZXJcbiAgICAgIC8vIHJlZ2lzdHJ5IHNwZWNpZmllciB0eXBlcyBhcmUgZWl0aGVyIHZlcnNpb24sIHJhbmdlLCBvciB0YWdcbiAgICAgIGxldCBtYW5pZmVzdDogUGFja2FnZU1hbmlmZXN0IHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKFxuICAgICAgICByZXF1ZXN0SWRlbnRpZmllci50eXBlID09PSAndmVyc2lvbicgfHxcbiAgICAgICAgcmVxdWVzdElkZW50aWZpZXIudHlwZSA9PT0gJ3JhbmdlJyB8fFxuICAgICAgICByZXF1ZXN0SWRlbnRpZmllci50eXBlID09PSAndGFnJ1xuICAgICAgKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbWFuaWZlc3QgPSBwaWNrTWFuaWZlc3QobWV0YWRhdGEsIHJlcXVlc3RJZGVudGlmaWVyLmZldGNoU3BlYyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBhc3NlcnRJc0Vycm9yKGUpO1xuICAgICAgICAgIGlmIChlLmNvZGUgPT09ICdFVEFSR0VUJykge1xuICAgICAgICAgICAgLy8gSWYgbm90IGZvdW5kIGFuZCBuZXh0IHdhcyB1c2VkIGFuZCB1c2VyIGRpZCBub3QgcHJvdmlkZSBhIHNwZWNpZmllciwgdHJ5IGxhdGVzdC5cbiAgICAgICAgICAgIC8vIFBhY2thZ2UgbWF5IG5vdCBoYXZlIGEgbmV4dCB0YWcuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHJlcXVlc3RJZGVudGlmaWVyLnR5cGUgPT09ICd0YWcnICYmXG4gICAgICAgICAgICAgIHJlcXVlc3RJZGVudGlmaWVyLmZldGNoU3BlYyA9PT0gJ25leHQnICYmXG4gICAgICAgICAgICAgICFyZXF1ZXN0SWRlbnRpZmllci5yYXdTcGVjXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBtYW5pZmVzdCA9IHBpY2tNYW5pZmVzdChtZXRhZGF0YSwgJ2xhdGVzdCcpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgYXNzZXJ0SXNFcnJvcihlKTtcbiAgICAgICAgICAgICAgICBpZiAoZS5jb2RlICE9PSAnRVRBUkdFVCcgJiYgZS5jb2RlICE9PSAnRU5PVkVSU0lPTlMnKSB7XG4gICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoZS5jb2RlICE9PSAnRU5PVkVSU0lPTlMnKSB7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIW1hbmlmZXN0KSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcihcbiAgICAgICAgICBgUGFja2FnZSBzcGVjaWZpZWQgYnkgJyR7cmVxdWVzdElkZW50aWZpZXIucmF3fScgZG9lcyBub3QgZXhpc3Qgd2l0aGluIHRoZSByZWdpc3RyeS5gLFxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuXG4gICAgICBpZiAobWFuaWZlc3QudmVyc2lvbiA9PT0gbm9kZS5wYWNrYWdlPy52ZXJzaW9uKSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKGBQYWNrYWdlICcke3BhY2thZ2VOYW1lfScgaXMgYWxyZWFkeSB1cCB0byBkYXRlLmApO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5vZGUucGFja2FnZSAmJiBBTkdVTEFSX1BBQ0tBR0VTX1JFR0VYUC50ZXN0KG5vZGUucGFja2FnZS5uYW1lKSkge1xuICAgICAgICBjb25zdCB7IG5hbWUsIHZlcnNpb24gfSA9IG5vZGUucGFja2FnZTtcbiAgICAgICAgY29uc3QgdG9CZUluc3RhbGxlZE1ham9yVmVyc2lvbiA9ICttYW5pZmVzdC52ZXJzaW9uLnNwbGl0KCcuJylbMF07XG4gICAgICAgIGNvbnN0IGN1cnJlbnRNYWpvclZlcnNpb24gPSArdmVyc2lvbi5zcGxpdCgnLicpWzBdO1xuXG4gICAgICAgIGlmICh0b0JlSW5zdGFsbGVkTWFqb3JWZXJzaW9uIC0gY3VycmVudE1ham9yVmVyc2lvbiA+IDEpIHtcbiAgICAgICAgICAvLyBPbmx5IGFsbG93IHVwZGF0aW5nIGEgc2luZ2xlIHZlcnNpb24gYXQgYSB0aW1lLlxuICAgICAgICAgIGlmIChjdXJyZW50TWFqb3JWZXJzaW9uIDwgNikge1xuICAgICAgICAgICAgLy8gQmVmb3JlIHZlcnNpb24gNiwgdGhlIG1ham9yIHZlcnNpb25zIHdlcmUgbm90IGFsd2F5cyBzZXF1ZW50aWFsLlxuICAgICAgICAgICAgLy8gRXhhbXBsZSBAYW5ndWxhci9jb3JlIHNraXBwZWQgdmVyc2lvbiAzLCBAYW5ndWxhci9jbGkgc2tpcHBlZCB2ZXJzaW9ucyAyLTUuXG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgIGBVcGRhdGluZyBtdWx0aXBsZSBtYWpvciB2ZXJzaW9ucyBvZiAnJHtuYW1lfScgYXQgb25jZSBpcyBub3Qgc3VwcG9ydGVkLiBQbGVhc2UgbWlncmF0ZSBlYWNoIG1ham9yIHZlcnNpb24gaW5kaXZpZHVhbGx5LlxcbmAgK1xuICAgICAgICAgICAgICAgIGBGb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdXBkYXRlIHByb2Nlc3MsIHNlZSBodHRwczovL3VwZGF0ZS5hbmd1bGFyLmlvLy5gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgbmV4dE1ham9yVmVyc2lvbkZyb21DdXJyZW50ID0gY3VycmVudE1ham9yVmVyc2lvbiArIDE7XG5cbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcihcbiAgICAgICAgICAgICAgYFVwZGF0aW5nIG11bHRpcGxlIG1ham9yIHZlcnNpb25zIG9mICcke25hbWV9JyBhdCBvbmNlIGlzIG5vdCBzdXBwb3J0ZWQuIFBsZWFzZSBtaWdyYXRlIGVhY2ggbWFqb3IgdmVyc2lvbiBpbmRpdmlkdWFsbHkuXFxuYCArXG4gICAgICAgICAgICAgICAgYFJ1biAnbmcgdXBkYXRlICR7bmFtZX1AJHtuZXh0TWFqb3JWZXJzaW9uRnJvbUN1cnJlbnR9JyBpbiB5b3VyIHdvcmtzcGFjZSBkaXJlY3RvcnkgYCArXG4gICAgICAgICAgICAgICAgYHRvIHVwZGF0ZSB0byBsYXRlc3QgJyR7bmV4dE1ham9yVmVyc2lvbkZyb21DdXJyZW50fS54JyB2ZXJzaW9uIG9mICcke25hbWV9Jy5cXG5cXG5gICtcbiAgICAgICAgICAgICAgICBgRm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHVwZGF0ZSBwcm9jZXNzLCBzZWUgaHR0cHM6Ly91cGRhdGUuYW5ndWxhci5pby8/dj0ke2N1cnJlbnRNYWpvclZlcnNpb259LjAtJHtuZXh0TWFqb3JWZXJzaW9uRnJvbUN1cnJlbnR9LjBgLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBwYWNrYWdlc1RvVXBkYXRlLnB1c2gocmVxdWVzdElkZW50aWZpZXIudG9TdHJpbmcoKSk7XG4gICAgfVxuXG4gICAgaWYgKHBhY2thZ2VzVG9VcGRhdGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCB7IHN1Y2Nlc3MgfSA9IGF3YWl0IHRoaXMuZXhlY3V0ZVNjaGVtYXRpYyhcbiAgICAgIHdvcmtmbG93LFxuICAgICAgVVBEQVRFX1NDSEVNQVRJQ19DT0xMRUNUSU9OLFxuICAgICAgJ3VwZGF0ZScsXG4gICAgICB7XG4gICAgICAgIHZlcmJvc2U6IG9wdGlvbnMudmVyYm9zZSxcbiAgICAgICAgZm9yY2U6IG9wdGlvbnMuZm9yY2UsXG4gICAgICAgIG5leHQ6IG9wdGlvbnMubmV4dCxcbiAgICAgICAgcGFja2FnZU1hbmFnZXI6IHRoaXMuY29udGV4dC5wYWNrYWdlTWFuYWdlci5uYW1lLFxuICAgICAgICBwYWNrYWdlczogcGFja2FnZXNUb1VwZGF0ZSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmcy5ybShwYXRoLmpvaW4odGhpcy5jb250ZXh0LnJvb3QsICdub2RlX21vZHVsZXMnKSwge1xuICAgICAgICAgIGZvcmNlOiB0cnVlLFxuICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZSxcbiAgICAgICAgICBtYXhSZXRyaWVzOiAzLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2gge31cblxuICAgICAgY29uc3QgaW5zdGFsbGF0aW9uU3VjY2VzcyA9IGF3YWl0IHRoaXMuY29udGV4dC5wYWNrYWdlTWFuYWdlci5pbnN0YWxsQWxsKFxuICAgICAgICB0aGlzLnBhY2thZ2VNYW5hZ2VyRm9yY2Uob3B0aW9ucy52ZXJib3NlKSA/IFsnLS1mb3JjZSddIDogW10sXG4gICAgICAgIHRoaXMuY29udGV4dC5yb290LFxuICAgICAgKTtcblxuICAgICAgaWYgKCFpbnN0YWxsYXRpb25TdWNjZXNzKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdWNjZXNzICYmIG9wdGlvbnMuY3JlYXRlQ29tbWl0cykge1xuICAgICAgaWYgKCF0aGlzLmNvbW1pdChgQW5ndWxhciBDTEkgdXBkYXRlIGZvciBwYWNrYWdlcyAtICR7cGFja2FnZXNUb1VwZGF0ZS5qb2luKCcsICcpfWApKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRoaXMgaXMgYSB0ZW1wb3Jhcnkgd29ya2Fyb3VuZCB0byBhbGxvdyBkYXRhIHRvIGJlIHBhc3NlZCBiYWNrIGZyb20gdGhlIHVwZGF0ZSBzY2hlbWF0aWNcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIGNvbnN0IG1pZ3JhdGlvbnMgPSAoZ2xvYmFsIGFzIGFueSkuZXh0ZXJuYWxNaWdyYXRpb25zIGFzIHtcbiAgICAgIHBhY2thZ2U6IHN0cmluZztcbiAgICAgIGNvbGxlY3Rpb246IHN0cmluZztcbiAgICAgIGZyb206IHN0cmluZztcbiAgICAgIHRvOiBzdHJpbmc7XG4gICAgfVtdO1xuXG4gICAgaWYgKHN1Y2Nlc3MgJiYgbWlncmF0aW9ucykge1xuICAgICAgY29uc3Qgcm9vdFJlcXVpcmUgPSBjcmVhdGVSZXF1aXJlKHRoaXMuY29udGV4dC5yb290ICsgJy8nKTtcbiAgICAgIGZvciAoY29uc3QgbWlncmF0aW9uIG9mIG1pZ3JhdGlvbnMpIHtcbiAgICAgICAgLy8gUmVzb2x2ZSB0aGUgcGFja2FnZSBmcm9tIHRoZSB3b3Jrc3BhY2Ugcm9vdCwgYXMgb3RoZXJ3aXNlIGl0IHdpbGwgYmUgcmVzb2x2ZWQgZnJvbSB0aGUgdGVtcFxuICAgICAgICAvLyBpbnN0YWxsZWQgQ0xJIHZlcnNpb24uXG4gICAgICAgIGxldCBwYWNrYWdlUGF0aDtcbiAgICAgICAgbG9nVmVyYm9zZShcbiAgICAgICAgICBgUmVzb2x2aW5nIG1pZ3JhdGlvbiBwYWNrYWdlICcke21pZ3JhdGlvbi5wYWNrYWdlfScgZnJvbSAnJHt0aGlzLmNvbnRleHQucm9vdH0nLi4uYCxcbiAgICAgICAgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcGFja2FnZVBhdGggPSBwYXRoLmRpcm5hbWUoXG4gICAgICAgICAgICAgIC8vIFRoaXMgbWF5IGZhaWwgaWYgdGhlIGBwYWNrYWdlLmpzb25gIGlzIG5vdCBleHBvcnRlZCBhcyBhbiBlbnRyeSBwb2ludFxuICAgICAgICAgICAgICByb290UmVxdWlyZS5yZXNvbHZlKHBhdGguam9pbihtaWdyYXRpb24ucGFja2FnZSwgJ3BhY2thZ2UuanNvbicpKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgYXNzZXJ0SXNFcnJvcihlKTtcbiAgICAgICAgICAgIGlmIChlLmNvZGUgPT09ICdNT0RVTEVfTk9UX0ZPVU5EJykge1xuICAgICAgICAgICAgICAvLyBGYWxsYmFjayB0byB0cnlpbmcgdG8gcmVzb2x2ZSB0aGUgcGFja2FnZSdzIG1haW4gZW50cnkgcG9pbnRcbiAgICAgICAgICAgICAgcGFja2FnZVBhdGggPSByb290UmVxdWlyZS5yZXNvbHZlKG1pZ3JhdGlvbi5wYWNrYWdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgYXNzZXJ0SXNFcnJvcihlKTtcbiAgICAgICAgICBpZiAoZS5jb2RlID09PSAnTU9EVUxFX05PVF9GT1VORCcpIHtcbiAgICAgICAgICAgIGxvZ1ZlcmJvc2UoZS50b1N0cmluZygpKTtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcihcbiAgICAgICAgICAgICAgYE1pZ3JhdGlvbnMgZm9yIHBhY2thZ2UgKCR7bWlncmF0aW9uLnBhY2thZ2V9KSB3ZXJlIG5vdCBmb3VuZC5gICtcbiAgICAgICAgICAgICAgICAnIFRoZSBwYWNrYWdlIGNvdWxkIG5vdCBiZSBmb3VuZCBpbiB0aGUgd29ya3NwYWNlLicsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgIGBVbmFibGUgdG8gcmVzb2x2ZSBtaWdyYXRpb25zIGZvciBwYWNrYWdlICgke21pZ3JhdGlvbi5wYWNrYWdlfSkuICBbJHtlLm1lc3NhZ2V9XWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1pZ3JhdGlvbnM7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgaXQgaXMgYSBwYWNrYWdlLWxvY2FsIGxvY2F0aW9uXG4gICAgICAgIGNvbnN0IGxvY2FsTWlncmF0aW9ucyA9IHBhdGguam9pbihwYWNrYWdlUGF0aCwgbWlncmF0aW9uLmNvbGxlY3Rpb24pO1xuICAgICAgICBpZiAoZXhpc3RzU3luYyhsb2NhbE1pZ3JhdGlvbnMpKSB7XG4gICAgICAgICAgbWlncmF0aW9ucyA9IGxvY2FsTWlncmF0aW9ucztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBUcnkgdG8gcmVzb2x2ZSBmcm9tIHBhY2thZ2UgbG9jYXRpb24uXG4gICAgICAgICAgLy8gVGhpcyBhdm9pZHMgaXNzdWVzIHdpdGggcGFja2FnZSBob2lzdGluZy5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcGFja2FnZVJlcXVpcmUgPSBjcmVhdGVSZXF1aXJlKHBhY2thZ2VQYXRoICsgJy8nKTtcbiAgICAgICAgICAgIG1pZ3JhdGlvbnMgPSBwYWNrYWdlUmVxdWlyZS5yZXNvbHZlKG1pZ3JhdGlvbi5jb2xsZWN0aW9uKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBhc3NlcnRJc0Vycm9yKGUpO1xuICAgICAgICAgICAgaWYgKGUuY29kZSA9PT0gJ01PRFVMRV9OT1RfRk9VTkQnKSB7XG4gICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihgTWlncmF0aW9ucyBmb3IgcGFja2FnZSAoJHttaWdyYXRpb24ucGFja2FnZX0pIHdlcmUgbm90IGZvdW5kLmApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgICAgIGBVbmFibGUgdG8gcmVzb2x2ZSBtaWdyYXRpb25zIGZvciBwYWNrYWdlICgke21pZ3JhdGlvbi5wYWNrYWdlfSkuICBbJHtlLm1lc3NhZ2V9XWAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmV4ZWN1dGVNaWdyYXRpb25zKFxuICAgICAgICAgIHdvcmtmbG93LFxuICAgICAgICAgIG1pZ3JhdGlvbi5wYWNrYWdlLFxuICAgICAgICAgIG1pZ3JhdGlvbnMsXG4gICAgICAgICAgbWlncmF0aW9uLmZyb20sXG4gICAgICAgICAgbWlncmF0aW9uLnRvLFxuICAgICAgICAgIG9wdGlvbnMuY3JlYXRlQ29tbWl0cyxcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBBIG5vbi16ZXJvIHZhbHVlIGlzIGEgZmFpbHVyZSBmb3IgdGhlIHBhY2thZ2UncyBtaWdyYXRpb25zXG4gICAgICAgIGlmIChyZXN1bHQgIT09IDApIHtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1Y2Nlc3MgPyAwIDogMTtcbiAgfVxuICAvKipcbiAgICogQHJldHVybiBXaGV0aGVyIG9yIG5vdCB0aGUgY29tbWl0IHdhcyBzdWNjZXNzZnVsLlxuICAgKi9cbiAgcHJpdmF0ZSBjb21taXQobWVzc2FnZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgeyBsb2dnZXIgfSA9IHRoaXMuY29udGV4dDtcblxuICAgIC8vIENoZWNrIGlmIGEgY29tbWl0IGlzIG5lZWRlZC5cbiAgICBsZXQgY29tbWl0TmVlZGVkOiBib29sZWFuO1xuICAgIHRyeSB7XG4gICAgICBjb21taXROZWVkZWQgPSBoYXNDaGFuZ2VzVG9Db21taXQoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxvZ2dlci5lcnJvcihgICBGYWlsZWQgdG8gcmVhZCBHaXQgdHJlZTpcXG4keyhlcnIgYXMgU3Bhd25TeW5jUmV0dXJuczxzdHJpbmc+KS5zdGRlcnJ9YCk7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWNvbW1pdE5lZWRlZCkge1xuICAgICAgbG9nZ2VyLmluZm8oJyAgTm8gY2hhbmdlcyB0byBjb21taXQgYWZ0ZXIgbWlncmF0aW9uLicpO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBDb21taXQgY2hhbmdlcyBhbmQgYWJvcnQgb24gZXJyb3IuXG4gICAgdHJ5IHtcbiAgICAgIGNyZWF0ZUNvbW1pdChtZXNzYWdlKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxvZ2dlci5lcnJvcihcbiAgICAgICAgYEZhaWxlZCB0byBjb21taXQgdXBkYXRlICgke21lc3NhZ2V9KTpcXG4keyhlcnIgYXMgU3Bhd25TeW5jUmV0dXJuczxzdHJpbmc+KS5zdGRlcnJ9YCxcbiAgICAgICk7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBOb3RpZnkgdXNlciBvZiB0aGUgY29tbWl0LlxuICAgIGNvbnN0IGhhc2ggPSBmaW5kQ3VycmVudEdpdFNoYSgpO1xuICAgIGNvbnN0IHNob3J0TWVzc2FnZSA9IG1lc3NhZ2Uuc3BsaXQoJ1xcbicpWzBdO1xuICAgIGlmIChoYXNoKSB7XG4gICAgICBsb2dnZXIuaW5mbyhgICBDb21taXR0ZWQgbWlncmF0aW9uIHN0ZXAgKCR7Z2V0U2hvcnRIYXNoKGhhc2gpfSk6ICR7c2hvcnRNZXNzYWdlfS5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ29tbWl0IHdhcyBzdWNjZXNzZnVsLCBidXQgcmVhZGluZyB0aGUgaGFzaCB3YXMgbm90LiBTb21ldGhpbmcgd2VpcmQgaGFwcGVuZWQsXG4gICAgICAvLyBidXQgbm90aGluZyB0aGF0IHdvdWxkIHN0b3AgdGhlIHVwZGF0ZS4gSnVzdCBsb2cgdGhlIHdlaXJkbmVzcyBhbmQgY29udGludWUuXG4gICAgICBsb2dnZXIuaW5mbyhgICBDb21taXR0ZWQgbWlncmF0aW9uIHN0ZXA6ICR7c2hvcnRNZXNzYWdlfS5gKTtcbiAgICAgIGxvZ2dlci53YXJuKCcgIEZhaWxlZCB0byBsb29rIHVwIGhhc2ggb2YgbW9zdCByZWNlbnQgY29tbWl0LCBjb250aW51aW5nIGFueXdheXMuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIGNoZWNrQ2xlYW5HaXQoKTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRvcExldmVsID0gZXhlY1N5bmMoJ2dpdCByZXYtcGFyc2UgLS1zaG93LXRvcGxldmVsJywge1xuICAgICAgICBlbmNvZGluZzogJ3V0ZjgnLFxuICAgICAgICBzdGRpbzogJ3BpcGUnLFxuICAgICAgfSk7XG4gICAgICBjb25zdCByZXN1bHQgPSBleGVjU3luYygnZ2l0IHN0YXR1cyAtLXBvcmNlbGFpbicsIHsgZW5jb2Rpbmc6ICd1dGY4Jywgc3RkaW86ICdwaXBlJyB9KTtcbiAgICAgIGlmIChyZXN1bHQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gT25seSBmaWxlcyBpbnNpZGUgdGhlIHdvcmtzcGFjZSByb290IGFyZSByZWxldmFudFxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiByZXN1bHQuc3BsaXQoJ1xcbicpKSB7XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlRW50cnkgPSBwYXRoLnJlbGF0aXZlKFxuICAgICAgICAgIHBhdGgucmVzb2x2ZSh0aGlzLmNvbnRleHQucm9vdCksXG4gICAgICAgICAgcGF0aC5yZXNvbHZlKHRvcExldmVsLnRyaW0oKSwgZW50cnkuc2xpY2UoMykudHJpbSgpKSxcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIXJlbGF0aXZlRW50cnkuc3RhcnRzV2l0aCgnLi4nKSAmJiAhcGF0aC5pc0Fic29sdXRlKHJlbGF0aXZlRW50cnkpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBjdXJyZW50IGluc3RhbGxlZCBDTEkgdmVyc2lvbiBpcyBvbGRlciBvciBuZXdlciB0aGFuIGEgY29tcGF0aWJsZSB2ZXJzaW9uLlxuICAgKiBAcmV0dXJucyB0aGUgdmVyc2lvbiB0byBpbnN0YWxsIG9yIG51bGwgd2hlbiB0aGVyZSBpcyBubyB1cGRhdGUgdG8gaW5zdGFsbC5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgY2hlY2tDTElWZXJzaW9uKFxuICAgIHBhY2thZ2VzVG9VcGRhdGU6IHN0cmluZ1tdLFxuICAgIHZlcmJvc2UgPSBmYWxzZSxcbiAgICBuZXh0ID0gZmFsc2UsXG4gICk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGNvbnN0IHsgdmVyc2lvbiB9ID0gYXdhaXQgZmV0Y2hQYWNrYWdlTWFuaWZlc3QoXG4gICAgICBgQGFuZ3VsYXIvY2xpQCR7dGhpcy5nZXRDTElVcGRhdGVSdW5uZXJWZXJzaW9uKHBhY2thZ2VzVG9VcGRhdGUsIG5leHQpfWAsXG4gICAgICB0aGlzLmNvbnRleHQubG9nZ2VyLFxuICAgICAge1xuICAgICAgICB2ZXJib3NlLFxuICAgICAgICB1c2luZ1lhcm46IHRoaXMuY29udGV4dC5wYWNrYWdlTWFuYWdlci5uYW1lID09PSBQYWNrYWdlTWFuYWdlci5ZYXJuLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgcmV0dXJuIFZFUlNJT04uZnVsbCA9PT0gdmVyc2lvbiA/IG51bGwgOiB2ZXJzaW9uO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRDTElVcGRhdGVSdW5uZXJWZXJzaW9uKFxuICAgIHBhY2thZ2VzVG9VcGRhdGU6IHN0cmluZ1tdIHwgdW5kZWZpbmVkLFxuICAgIG5leHQ6IGJvb2xlYW4sXG4gICk6IHN0cmluZyB8IG51bWJlciB7XG4gICAgaWYgKG5leHQpIHtcbiAgICAgIHJldHVybiAnbmV4dCc7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRpbmdBbmd1bGFyUGFja2FnZSA9IHBhY2thZ2VzVG9VcGRhdGU/LmZpbmQoKHIpID0+IEFOR1VMQVJfUEFDS0FHRVNfUkVHRVhQLnRlc3QocikpO1xuICAgIGlmICh1cGRhdGluZ0FuZ3VsYXJQYWNrYWdlKSB7XG4gICAgICAvLyBJZiB3ZSBhcmUgdXBkYXRpbmcgYW55IEFuZ3VsYXIgcGFja2FnZSB3ZSBjYW4gdXBkYXRlIHRoZSBDTEkgdG8gdGhlIHRhcmdldCB2ZXJzaW9uIGJlY2F1c2VcbiAgICAgIC8vIG1pZ3JhdGlvbnMgZm9yIEBhbmd1bGFyL2NvcmVAMTMgY2FuIGJlIGV4ZWN1dGVkIHVzaW5nIEFuZ3VsYXIvY2xpQDEzLlxuICAgICAgLy8gVGhpcyBpcyBzYW1lIGJlaGF2aW91ciBhcyBgbnB4IEBhbmd1bGFyL2NsaUAxMyB1cGRhdGUgQGFuZ3VsYXIvY29yZUAxM2AuXG5cbiAgICAgIC8vIGBAYW5ndWxhci9jbGlAMTNgIC0+IFsnJywgJ2FuZ3VsYXIvY2xpJywgJzEzJ11cbiAgICAgIC8vIGBAYW5ndWxhci9jbGlgIC0+IFsnJywgJ2FuZ3VsYXIvY2xpJ11cbiAgICAgIGNvbnN0IHRlbXBWZXJzaW9uID0gY29lcmNlVmVyc2lvbk51bWJlcih1cGRhdGluZ0FuZ3VsYXJQYWNrYWdlLnNwbGl0KCdAJylbMl0pO1xuXG4gICAgICByZXR1cm4gc2VtdmVyLnBhcnNlKHRlbXBWZXJzaW9uKT8ubWFqb3IgPz8gJ2xhdGVzdCc7XG4gICAgfVxuXG4gICAgLy8gV2hlbiBub3QgdXBkYXRpbmcgYW4gQW5ndWxhciBwYWNrYWdlIHdlIGNhbm5vdCBkZXRlcm1pbmUgd2hpY2ggc2NoZW1hdGljIHJ1bnRpbWUgdGhlIG1pZ3JhdGlvbiBzaG91bGQgdG8gYmUgZXhlY3V0ZWQgaW4uXG4gICAgLy8gVHlwaWNhbGx5LCB3ZSBjYW4gYXNzdW1lIHRoYXQgdGhlIGBAYW5ndWxhci9jbGlgIHdhcyB1cGRhdGVkIHByZXZpb3VzbHkuXG4gICAgLy8gRXhhbXBsZTogQW5ndWxhciBvZmZpY2lhbCBwYWNrYWdlcyBhcmUgdHlwaWNhbGx5IHVwZGF0ZWQgcHJpb3IgdG8gTkdSWCBldGMuLi5cbiAgICAvLyBUaGVyZWZvcmUsIHdlIG9ubHkgdXBkYXRlIHRvIHRoZSBsYXRlc3QgcGF0Y2ggdmVyc2lvbiBvZiB0aGUgaW5zdGFsbGVkIG1ham9yIHZlcnNpb24gb2YgdGhlIEFuZ3VsYXIgQ0xJLlxuXG4gICAgLy8gVGhpcyBpcyBpbXBvcnRhbnQgYmVjYXVzZSB3ZSBtaWdodCBlbmQgdXAgaW4gYSBzY2VuYXJpbyB3aGVyZSBsb2NhbGx5IEFuZ3VsYXIgdjEyIGlzIGluc3RhbGxlZCwgdXBkYXRpbmcgTkdSWCBmcm9tIDExIHRvIDEyLlxuICAgIC8vIFdlIGVuZCB1cCB1c2luZyBBbmd1bGFyIENsSSB2MTMgdG8gcnVuIHRoZSBtaWdyYXRpb25zIGlmIHdlIHJ1biB0aGUgbWlncmF0aW9ucyB1c2luZyB0aGUgQ0xJIGluc3RhbGxlZCBtYWpvciB2ZXJzaW9uICsgMSBsb2dpYy5cbiAgICByZXR1cm4gVkVSU0lPTi5tYWpvcjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuVGVtcEJpbmFyeShwYWNrYWdlTmFtZTogc3RyaW5nLCBhcmdzOiBzdHJpbmdbXSA9IFtdKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCB7IHN1Y2Nlc3MsIHRlbXBOb2RlTW9kdWxlcyB9ID0gYXdhaXQgdGhpcy5jb250ZXh0LnBhY2thZ2VNYW5hZ2VyLmluc3RhbGxUZW1wKHBhY2thZ2VOYW1lKTtcbiAgICBpZiAoIXN1Y2Nlc3MpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSB2ZXJzaW9uL3RhZyBldGMuLi4gZnJvbSBwYWNrYWdlIG5hbWVcbiAgICAvLyBFeDogQGFuZ3VsYXIvY2xpQGxhdGVzdCAtPiBAYW5ndWxhci9jbGlcbiAgICBjb25zdCBwYWNrYWdlTmFtZU5vVmVyc2lvbiA9IHBhY2thZ2VOYW1lLnN1YnN0cmluZygwLCBwYWNrYWdlTmFtZS5sYXN0SW5kZXhPZignQCcpKTtcbiAgICBjb25zdCBwa2dMb2NhdGlvbiA9IGpvaW4odGVtcE5vZGVNb2R1bGVzLCBwYWNrYWdlTmFtZU5vVmVyc2lvbik7XG4gICAgY29uc3QgcGFja2FnZUpzb25QYXRoID0gam9pbihwa2dMb2NhdGlvbiwgJ3BhY2thZ2UuanNvbicpO1xuXG4gICAgLy8gR2V0IGEgYmluYXJ5IGxvY2F0aW9uIGZvciB0aGlzIHBhY2thZ2VcbiAgICBsZXQgYmluUGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIGlmIChleGlzdHNTeW5jKHBhY2thZ2VKc29uUGF0aCkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShwYWNrYWdlSnNvblBhdGgsICd1dGYtOCcpO1xuICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgY29uc3QgeyBiaW4gPSB7fSB9ID0gSlNPTi5wYXJzZShjb250ZW50KTtcbiAgICAgICAgY29uc3QgYmluS2V5cyA9IE9iamVjdC5rZXlzKGJpbik7XG5cbiAgICAgICAgaWYgKGJpbktleXMubGVuZ3RoKSB7XG4gICAgICAgICAgYmluUGF0aCA9IHJlc29sdmUocGtnTG9jYXRpb24sIGJpbltiaW5LZXlzWzBdXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJpblBhdGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGxvY2F0ZSBiaW4gZm9yIHRlbXBvcmFyeSBwYWNrYWdlOiAke3BhY2thZ2VOYW1lTm9WZXJzaW9ufS5gKTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHN0YXR1cywgZXJyb3IgfSA9IHNwYXduU3luYyhwcm9jZXNzLmV4ZWNQYXRoLCBbYmluUGF0aCwgLi4uYXJnc10sIHtcbiAgICAgIHN0ZGlvOiAnaW5oZXJpdCcsXG4gICAgICBlbnY6IHtcbiAgICAgICAgLi4ucHJvY2Vzcy5lbnYsXG4gICAgICAgIE5HX0RJU0FCTEVfVkVSU0lPTl9DSEVDSzogJ3RydWUnLFxuICAgICAgICBOR19DTElfQU5BTFlUSUNTOiAnZmFsc2UnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGlmIChzdGF0dXMgPT09IG51bGwgJiYgZXJyb3IpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIHJldHVybiBzdGF0dXMgPz8gMDtcbiAgfVxuXG4gIHByaXZhdGUgcGFja2FnZU1hbmFnZXJGb3JjZSh2ZXJib3NlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgLy8gbnBtIDcrIGNhbiBmYWlsIGR1ZSB0byBpdCBpbmNvcnJlY3RseSByZXNvbHZpbmcgcGVlciBkZXBlbmRlbmNpZXMgdGhhdCBoYXZlIHZhbGlkIFNlbVZlclxuICAgIC8vIHJhbmdlcyBkdXJpbmcgYW4gdXBkYXRlLiBVcGRhdGUgd2lsbCBzZXQgY29ycmVjdCB2ZXJzaW9ucyBvZiBkZXBlbmRlbmNpZXMgd2l0aGluIHRoZVxuICAgIC8vIHBhY2thZ2UuanNvbiBmaWxlLiBUaGUgZm9yY2Ugb3B0aW9uIGlzIHNldCB0byB3b3JrYXJvdW5kIHRoZXNlIGVycm9ycy5cbiAgICAvLyBFeGFtcGxlIGVycm9yOlxuICAgIC8vIG5wbSBFUlIhIENvbmZsaWN0aW5nIHBlZXIgZGVwZW5kZW5jeTogQGFuZ3VsYXIvY29tcGlsZXItY2xpQDE0LjAuMC1yYy4wXG4gICAgLy8gbnBtIEVSUiEgbm9kZV9tb2R1bGVzL0Bhbmd1bGFyL2NvbXBpbGVyLWNsaVxuICAgIC8vIG5wbSBFUlIhICAgcGVlciBAYW5ndWxhci9jb21waWxlci1jbGlAXCJeMTQuMC4wIHx8IF4xNC4wLjAtcmNcIiBmcm9tIEBhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyQDE0LjAuMC1yYy4wXG4gICAgLy8gbnBtIEVSUiEgICBub2RlX21vZHVsZXMvQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXJcbiAgICAvLyBucG0gRVJSISAgICAgZGV2IEBhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyQFwifjE0LjAuMC1yYy4wXCIgZnJvbSB0aGUgcm9vdCBwcm9qZWN0XG4gICAgaWYgKFxuICAgICAgdGhpcy5jb250ZXh0LnBhY2thZ2VNYW5hZ2VyLm5hbWUgPT09IFBhY2thZ2VNYW5hZ2VyLk5wbSAmJlxuICAgICAgdGhpcy5jb250ZXh0LnBhY2thZ2VNYW5hZ2VyLnZlcnNpb24gJiZcbiAgICAgIHNlbXZlci5ndGUodGhpcy5jb250ZXh0LnBhY2thZ2VNYW5hZ2VyLnZlcnNpb24sICc3LjAuMCcpXG4gICAgKSB7XG4gICAgICBpZiAodmVyYm9zZSkge1xuICAgICAgICB0aGlzLmNvbnRleHQubG9nZ2VyLmluZm8oXG4gICAgICAgICAgJ05QTSA3KyBkZXRlY3RlZCAtLSBlbmFibGluZyBmb3JjZSBvcHRpb24gZm9yIHBhY2thZ2UgaW5zdGFsbGF0aW9uJyxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRPcHRpb25hbE1pZ3JhdGlvbnNUb1J1bihcbiAgICBvcHRpb25hbE1pZ3JhdGlvbnM6IE1pZ3JhdGlvblNjaGVtYXRpY0Rlc2NyaXB0aW9uW10sXG4gICAgcGFja2FnZU5hbWU6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxNaWdyYXRpb25TY2hlbWF0aWNEZXNjcmlwdGlvbltdIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgeyBsb2dnZXIgfSA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCBudW1iZXJPZk1pZ3JhdGlvbnMgPSBvcHRpb25hbE1pZ3JhdGlvbnMubGVuZ3RoO1xuICAgIGxvZ2dlci5pbmZvKFxuICAgICAgYFRoaXMgcGFja2FnZSBoYXMgJHtudW1iZXJPZk1pZ3JhdGlvbnN9IG9wdGlvbmFsIG1pZ3JhdGlvbiR7XG4gICAgICAgIG51bWJlck9mTWlncmF0aW9ucyA+IDEgPyAncycgOiAnJ1xuICAgICAgfSB0aGF0IGNhbiBiZSBleGVjdXRlZC5gLFxuICAgICk7XG4gICAgbG9nZ2VyLmluZm8oJycpOyAvLyBFeHRyYSB0cmFpbGluZyBuZXdsaW5lLlxuXG4gICAgaWYgKCFpc1RUWSgpKSB7XG4gICAgICBmb3IgKGNvbnN0IG1pZ3JhdGlvbiBvZiBvcHRpb25hbE1pZ3JhdGlvbnMpIHtcbiAgICAgICAgY29uc3QgeyB0aXRsZSB9ID0gZ2V0TWlncmF0aW9uVGl0bGVBbmREZXNjcmlwdGlvbihtaWdyYXRpb24pO1xuICAgICAgICBsb2dnZXIuaW5mbyhjb2xvcnMuY3lhbihjb2xvcnMuc3ltYm9scy5wb2ludGVyKSArICcgJyArIGNvbG9ycy5ib2xkKHRpdGxlKSk7XG4gICAgICAgIGxvZ2dlci5pbmZvKGNvbG9ycy5ncmF5KGAgIG5nIHVwZGF0ZSAke3BhY2thZ2VOYW1lfSAtLW5hbWUgJHttaWdyYXRpb24ubmFtZX1gKSk7XG4gICAgICAgIGxvZ2dlci5pbmZvKCcnKTsgLy8gRXh0cmEgdHJhaWxpbmcgbmV3bGluZS5cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCBhbnN3ZXIgPSBhd2FpdCBhc2tDaG9pY2VzKFxuICAgICAgYFNlbGVjdCB0aGUgbWlncmF0aW9ucyB0aGF0IHlvdSdkIGxpa2UgdG8gcnVuYCxcbiAgICAgIG9wdGlvbmFsTWlncmF0aW9ucy5tYXAoKG1pZ3JhdGlvbikgPT4ge1xuICAgICAgICBjb25zdCB7IHRpdGxlIH0gPSBnZXRNaWdyYXRpb25UaXRsZUFuZERlc2NyaXB0aW9uKG1pZ3JhdGlvbik7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBuYW1lOiB0aXRsZSxcbiAgICAgICAgICB2YWx1ZTogbWlncmF0aW9uLm5hbWUsXG4gICAgICAgIH07XG4gICAgICB9KSxcbiAgICAgIG51bGwsXG4gICAgKTtcblxuICAgIGxvZ2dlci5pbmZvKCcnKTsgLy8gRXh0cmEgdHJhaWxpbmcgbmV3bGluZS5cblxuICAgIHJldHVybiBvcHRpb25hbE1pZ3JhdGlvbnMuZmlsdGVyKCh7IG5hbWUgfSkgPT4gYW5zd2VyPy5pbmNsdWRlcyhuYW1lKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcmV0dXJuIFdoZXRoZXIgb3Igbm90IHRoZSB3b3JraW5nIGRpcmVjdG9yeSBoYXMgR2l0IGNoYW5nZXMgdG8gY29tbWl0LlxuICovXG5mdW5jdGlvbiBoYXNDaGFuZ2VzVG9Db21taXQoKTogYm9vbGVhbiB7XG4gIC8vIExpc3QgYWxsIG1vZGlmaWVkIGZpbGVzIG5vdCBjb3ZlcmVkIGJ5IC5naXRpZ25vcmUuXG4gIC8vIElmIGFueSBmaWxlcyBhcmUgcmV0dXJuZWQsIHRoZW4gdGhlcmUgbXVzdCBiZSBzb21ldGhpbmcgdG8gY29tbWl0LlxuXG4gIHJldHVybiBleGVjU3luYygnZ2l0IGxzLWZpbGVzIC1tIC1kIC1vIC0tZXhjbHVkZS1zdGFuZGFyZCcpLnRvU3RyaW5nKCkgIT09ICcnO1xufVxuXG4vKipcbiAqIFByZWNvbmRpdGlvbjogTXVzdCBoYXZlIHBlbmRpbmcgY2hhbmdlcyB0byBjb21taXQsIHRoZXkgZG8gbm90IG5lZWQgdG8gYmUgc3RhZ2VkLlxuICogUG9zdGNvbmRpdGlvbjogVGhlIEdpdCB3b3JraW5nIHRyZWUgaXMgY29tbWl0dGVkIGFuZCB0aGUgcmVwbyBpcyBjbGVhbi5cbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSBjb21taXQgbWVzc2FnZSB0byB1c2UuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUNvbW1pdChtZXNzYWdlOiBzdHJpbmcpIHtcbiAgLy8gU3RhZ2UgZW50aXJlIHdvcmtpbmcgdHJlZSBmb3IgY29tbWl0LlxuICBleGVjU3luYygnZ2l0IGFkZCAtQScsIHsgZW5jb2Rpbmc6ICd1dGY4Jywgc3RkaW86ICdwaXBlJyB9KTtcblxuICAvLyBDb21taXQgd2l0aCB0aGUgbWVzc2FnZSBwYXNzZWQgdmlhIHN0ZGluIHRvIGF2b2lkIGJhc2ggZXNjYXBpbmcgaXNzdWVzLlxuICBleGVjU3luYygnZ2l0IGNvbW1pdCAtLW5vLXZlcmlmeSAtRiAtJywgeyBlbmNvZGluZzogJ3V0ZjgnLCBzdGRpbzogJ3BpcGUnLCBpbnB1dDogbWVzc2FnZSB9KTtcbn1cblxuLyoqXG4gKiBAcmV0dXJuIFRoZSBHaXQgU0hBIGhhc2ggb2YgdGhlIEhFQUQgY29tbWl0LiBSZXR1cm5zIG51bGwgaWYgdW5hYmxlIHRvIHJldHJpZXZlIHRoZSBoYXNoLlxuICovXG5mdW5jdGlvbiBmaW5kQ3VycmVudEdpdFNoYSgpOiBzdHJpbmcgfCBudWxsIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZXhlY1N5bmMoJ2dpdCByZXYtcGFyc2UgSEVBRCcsIHsgZW5jb2Rpbmc6ICd1dGY4Jywgc3RkaW86ICdwaXBlJyB9KS50cmltKCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFNob3J0SGFzaChjb21taXRIYXNoOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gY29tbWl0SGFzaC5zbGljZSgwLCA5KTtcbn1cblxuZnVuY3Rpb24gY29lcmNlVmVyc2lvbk51bWJlcih2ZXJzaW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBpZiAoIXZlcnNpb24pIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgaWYgKCEvXlxcZHsxLDMwfVxcLlxcZHsxLDMwfVxcLlxcZHsxLDMwfS8udGVzdCh2ZXJzaW9uKSkge1xuICAgIGNvbnN0IG1hdGNoID0gdmVyc2lvbi5tYXRjaCgvXlxcZHsxLDMwfShcXC5cXGR7MSwzMH0pKi8pO1xuXG4gICAgaWYgKCFtYXRjaCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAoIW1hdGNoWzFdKSB7XG4gICAgICB2ZXJzaW9uID0gdmVyc2lvbi5zdWJzdHJpbmcoMCwgbWF0Y2hbMF0ubGVuZ3RoKSArICcuMC4wJyArIHZlcnNpb24uc3Vic3RyaW5nKG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgfSBlbHNlIGlmICghbWF0Y2hbMl0pIHtcbiAgICAgIHZlcnNpb24gPSB2ZXJzaW9uLnN1YnN0cmluZygwLCBtYXRjaFswXS5sZW5ndGgpICsgJy4wJyArIHZlcnNpb24uc3Vic3RyaW5nKG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHNlbXZlci52YWxpZCh2ZXJzaW9uKSA/PyB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGdldE1pZ3JhdGlvblRpdGxlQW5kRGVzY3JpcHRpb24obWlncmF0aW9uOiBNaWdyYXRpb25TY2hlbWF0aWNEZXNjcmlwdGlvbik6IHtcbiAgdGl0bGU6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbn0ge1xuICBjb25zdCBbdGl0bGUsIC4uLmRlc2NyaXB0aW9uXSA9IG1pZ3JhdGlvbi5kZXNjcmlwdGlvbi5zcGxpdCgnLiAnKTtcblxuICByZXR1cm4ge1xuICAgIHRpdGxlOiB0aXRsZS5lbmRzV2l0aCgnLicpID8gdGl0bGUgOiB0aXRsZSArICcuJyxcbiAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24uam9pbignLlxcbiAgJyksXG4gIH07XG59XG4iXX0=