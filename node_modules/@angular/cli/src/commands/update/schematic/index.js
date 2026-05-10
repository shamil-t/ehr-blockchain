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
exports.angularMajorCompatGuarantee = void 0;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const npa = __importStar(require("npm-package-arg"));
const semver = __importStar(require("semver"));
const error_1 = require("../../../utilities/error");
const package_metadata_1 = require("../../../utilities/package-metadata");
// Angular guarantees that a major is compatible with its following major (so packages that depend
// on Angular 5 are also compatible with Angular 6). This is, in code, represented by verifying
// that all other packages that have a peer dependency of `"@angular/core": "^5.0.0"` actually
// supports 6.0, by adding that compatibility to the range, so it is `^5.0.0 || ^6.0.0`.
// We export it to allow for testing.
function angularMajorCompatGuarantee(range) {
    let newRange = semver.validRange(range);
    if (!newRange) {
        return range;
    }
    let major = 1;
    while (!semver.gtr(major + '.0.0', newRange)) {
        major++;
        if (major >= 99) {
            // Use original range if it supports a major this high
            // Range is most likely unbounded (e.g., >=5.0.0)
            return newRange;
        }
    }
    // Add the major version as compatible with the angular compatible, with all minors. This is
    // already one major above the greatest supported, because we increment `major` before checking.
    // We add minors like this because a minor beta is still compatible with a minor non-beta.
    newRange = range;
    for (let minor = 0; minor < 20; minor++) {
        newRange += ` || ^${major}.${minor}.0-alpha.0 `;
    }
    return semver.validRange(newRange) || range;
}
exports.angularMajorCompatGuarantee = angularMajorCompatGuarantee;
// This is a map of packageGroupName to range extending function. If it isn't found, the range is
// kept the same.
const knownPeerCompatibleList = {
    '@angular/core': angularMajorCompatGuarantee,
};
function _updatePeerVersion(infoMap, name, range) {
    // Resolve packageGroupName.
    const maybePackageInfo = infoMap.get(name);
    if (!maybePackageInfo) {
        return range;
    }
    if (maybePackageInfo.target) {
        name = maybePackageInfo.target.updateMetadata.packageGroupName || name;
    }
    else {
        name = maybePackageInfo.installed.updateMetadata.packageGroupName || name;
    }
    const maybeTransform = knownPeerCompatibleList[name];
    if (maybeTransform) {
        if (typeof maybeTransform == 'function') {
            return maybeTransform(range);
        }
        else {
            return maybeTransform;
        }
    }
    return range;
}
function _validateForwardPeerDependencies(name, infoMap, peers, peersMeta, logger, next) {
    let validationFailed = false;
    for (const [peer, range] of Object.entries(peers)) {
        logger.debug(`Checking forward peer ${peer}...`);
        const maybePeerInfo = infoMap.get(peer);
        const isOptional = peersMeta[peer] && !!peersMeta[peer].optional;
        if (!maybePeerInfo) {
            if (!isOptional) {
                logger.warn([
                    `Package ${JSON.stringify(name)} has a missing peer dependency of`,
                    `${JSON.stringify(peer)} @ ${JSON.stringify(range)}.`,
                ].join(' '));
            }
            continue;
        }
        const peerVersion = maybePeerInfo.target && maybePeerInfo.target.packageJson.version
            ? maybePeerInfo.target.packageJson.version
            : maybePeerInfo.installed.version;
        logger.debug(`  Range intersects(${range}, ${peerVersion})...`);
        if (!semver.satisfies(peerVersion, range, { includePrerelease: next || undefined })) {
            logger.error([
                `Package ${JSON.stringify(name)} has an incompatible peer dependency to`,
                `${JSON.stringify(peer)} (requires ${JSON.stringify(range)},`,
                `would install ${JSON.stringify(peerVersion)})`,
            ].join(' '));
            validationFailed = true;
            continue;
        }
    }
    return validationFailed;
}
function _validateReversePeerDependencies(name, version, infoMap, logger, next) {
    for (const [installed, installedInfo] of infoMap.entries()) {
        const installedLogger = logger.createChild(installed);
        installedLogger.debug(`${installed}...`);
        const peers = (installedInfo.target || installedInfo.installed).packageJson.peerDependencies;
        for (const [peer, range] of Object.entries(peers || {})) {
            if (peer != name) {
                // Only check peers to the packages we're updating. We don't care about peers
                // that are unmet but we have no effect on.
                continue;
            }
            // Ignore peerDependency mismatches for these packages.
            // They are deprecated and removed via a migration.
            const ignoredPackages = [
                'codelyzer',
                '@schematics/update',
                '@angular-devkit/build-ng-packagr',
                'tsickle',
            ];
            if (ignoredPackages.includes(installed)) {
                continue;
            }
            // Override the peer version range if it's known as a compatible.
            const extendedRange = _updatePeerVersion(infoMap, peer, range);
            if (!semver.satisfies(version, extendedRange, { includePrerelease: next || undefined })) {
                logger.error([
                    `Package ${JSON.stringify(installed)} has an incompatible peer dependency to`,
                    `${JSON.stringify(name)} (requires`,
                    `${JSON.stringify(range)}${extendedRange == range ? '' : ' (extended)'},`,
                    `would install ${JSON.stringify(version)}).`,
                ].join(' '));
                return true;
            }
        }
    }
    return false;
}
function _validateUpdatePackages(infoMap, force, next, logger) {
    logger.debug('Updating the following packages:');
    infoMap.forEach((info) => {
        if (info.target) {
            logger.debug(`  ${info.name} => ${info.target.version}`);
        }
    });
    let peerErrors = false;
    infoMap.forEach((info) => {
        const { name, target } = info;
        if (!target) {
            return;
        }
        const pkgLogger = logger.createChild(name);
        logger.debug(`${name}...`);
        const { peerDependencies = {}, peerDependenciesMeta = {} } = target.packageJson;
        peerErrors =
            _validateForwardPeerDependencies(name, infoMap, peerDependencies, peerDependenciesMeta, pkgLogger, next) || peerErrors;
        peerErrors =
            _validateReversePeerDependencies(name, target.version, infoMap, pkgLogger, next) ||
                peerErrors;
    });
    if (!force && peerErrors) {
        throw new schematics_1.SchematicsException(core_1.tags.stripIndents `Incompatible peer dependencies found.
      Peer dependency warnings when installing dependencies means that those dependencies might not work correctly together.
      You can use the '--force' option to ignore incompatible peer dependencies and instead address these warnings later.`);
    }
}
function _performUpdate(tree, context, infoMap, logger, migrateOnly) {
    const packageJsonContent = tree.read('/package.json');
    if (!packageJsonContent) {
        throw new schematics_1.SchematicsException('Could not find a package.json. Are you in a Node project?');
    }
    let packageJson;
    try {
        packageJson = JSON.parse(packageJsonContent.toString());
    }
    catch (e) {
        (0, error_1.assertIsError)(e);
        throw new schematics_1.SchematicsException('package.json could not be parsed: ' + e.message);
    }
    const updateDependency = (deps, name, newVersion) => {
        const oldVersion = deps[name];
        // We only respect caret and tilde ranges on update.
        const execResult = /^[\^~]/.exec(oldVersion);
        deps[name] = `${execResult ? execResult[0] : ''}${newVersion}`;
    };
    const toInstall = [...infoMap.values()]
        .map((x) => [x.name, x.target, x.installed])
        .filter(([name, target, installed]) => {
        return !!name && !!target && !!installed;
    });
    toInstall.forEach(([name, target, installed]) => {
        logger.info(`Updating package.json with dependency ${name} ` +
            `@ ${JSON.stringify(target.version)} (was ${JSON.stringify(installed.version)})...`);
        if (packageJson.dependencies && packageJson.dependencies[name]) {
            updateDependency(packageJson.dependencies, name, target.version);
            if (packageJson.devDependencies && packageJson.devDependencies[name]) {
                delete packageJson.devDependencies[name];
            }
            if (packageJson.peerDependencies && packageJson.peerDependencies[name]) {
                delete packageJson.peerDependencies[name];
            }
        }
        else if (packageJson.devDependencies && packageJson.devDependencies[name]) {
            updateDependency(packageJson.devDependencies, name, target.version);
            if (packageJson.peerDependencies && packageJson.peerDependencies[name]) {
                delete packageJson.peerDependencies[name];
            }
        }
        else if (packageJson.peerDependencies && packageJson.peerDependencies[name]) {
            updateDependency(packageJson.peerDependencies, name, target.version);
        }
        else {
            logger.warn(`Package ${name} was not found in dependencies.`);
        }
    });
    const newContent = JSON.stringify(packageJson, null, 2);
    if (packageJsonContent.toString() != newContent || migrateOnly) {
        if (!migrateOnly) {
            tree.overwrite('/package.json', JSON.stringify(packageJson, null, 2));
        }
        const externalMigrations = [];
        // Run the migrate schematics with the list of packages to use. The collection contains
        // version information and we need to do this post installation. Please note that the
        // migration COULD fail and leave side effects on disk.
        // Run the schematics task of those packages.
        toInstall.forEach(([name, target, installed]) => {
            if (!target.updateMetadata.migrations) {
                return;
            }
            externalMigrations.push({
                package: name,
                collection: target.updateMetadata.migrations,
                from: installed.version,
                to: target.version,
            });
            return;
        });
        if (externalMigrations.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            global.externalMigrations = externalMigrations;
        }
    }
}
function _getUpdateMetadata(packageJson, logger) {
    const metadata = packageJson['ng-update'];
    const result = {
        packageGroup: {},
        requirements: {},
    };
    if (!metadata || typeof metadata != 'object' || Array.isArray(metadata)) {
        return result;
    }
    if (metadata['packageGroup']) {
        const packageGroup = metadata['packageGroup'];
        // Verify that packageGroup is an array of strings or an map of versions. This is not an error
        // but we still warn the user and ignore the packageGroup keys.
        if (Array.isArray(packageGroup) && packageGroup.every((x) => typeof x == 'string')) {
            result.packageGroup = packageGroup.reduce((group, name) => {
                group[name] = packageJson.version;
                return group;
            }, result.packageGroup);
        }
        else if (typeof packageGroup == 'object' &&
            packageGroup &&
            !Array.isArray(packageGroup) &&
            Object.values(packageGroup).every((x) => typeof x == 'string')) {
            result.packageGroup = packageGroup;
        }
        else {
            logger.warn(`packageGroup metadata of package ${packageJson.name} is malformed. Ignoring.`);
        }
        result.packageGroupName = Object.keys(result.packageGroup)[0];
    }
    if (typeof metadata['packageGroupName'] == 'string') {
        result.packageGroupName = metadata['packageGroupName'];
    }
    if (metadata['requirements']) {
        const requirements = metadata['requirements'];
        // Verify that requirements are
        if (typeof requirements != 'object' ||
            Array.isArray(requirements) ||
            Object.keys(requirements).some((name) => typeof requirements[name] != 'string')) {
            logger.warn(`requirements metadata of package ${packageJson.name} is malformed. Ignoring.`);
        }
        else {
            result.requirements = requirements;
        }
    }
    if (metadata['migrations']) {
        const migrations = metadata['migrations'];
        if (typeof migrations != 'string') {
            logger.warn(`migrations metadata of package ${packageJson.name} is malformed. Ignoring.`);
        }
        else {
            result.migrations = migrations;
        }
    }
    return result;
}
function _usageMessage(options, infoMap, logger) {
    const packageGroups = new Map();
    const packagesToUpdate = [...infoMap.entries()]
        .map(([name, info]) => {
        let tag = options.next
            ? info.npmPackageJson['dist-tags']['next']
                ? 'next'
                : 'latest'
            : 'latest';
        let version = info.npmPackageJson['dist-tags'][tag];
        let target = info.npmPackageJson.versions[version];
        const versionDiff = semver.diff(info.installed.version, version);
        if (versionDiff !== 'patch' &&
            versionDiff !== 'minor' &&
            /^@(?:angular|nguniversal)\//.test(name)) {
            const installedMajorVersion = semver.parse(info.installed.version)?.major;
            const toInstallMajorVersion = semver.parse(version)?.major;
            if (installedMajorVersion !== undefined &&
                toInstallMajorVersion !== undefined &&
                installedMajorVersion < toInstallMajorVersion - 1) {
                const nextMajorVersion = `${installedMajorVersion + 1}.`;
                const nextMajorVersions = Object.keys(info.npmPackageJson.versions)
                    .filter((v) => v.startsWith(nextMajorVersion))
                    .sort((a, b) => (a > b ? -1 : 1));
                if (nextMajorVersions.length) {
                    version = nextMajorVersions[0];
                    target = info.npmPackageJson.versions[version];
                    tag = '';
                }
            }
        }
        return {
            name,
            info,
            version,
            tag,
            target,
        };
    })
        .filter(({ info, version, target }) => target?.['ng-update'] && semver.compare(info.installed.version, version) < 0)
        .map(({ name, info, version, tag, target }) => {
        // Look for packageGroup.
        const packageGroup = target['ng-update']?.['packageGroup'];
        if (packageGroup) {
            const packageGroupNames = Array.isArray(packageGroup)
                ? packageGroup
                : Object.keys(packageGroup);
            const packageGroupName = target['ng-update']?.['packageGroupName'] || packageGroupNames[0];
            if (packageGroupName) {
                if (packageGroups.has(name)) {
                    return null;
                }
                packageGroupNames.forEach((x) => packageGroups.set(x, packageGroupName));
                packageGroups.set(packageGroupName, packageGroupName);
                name = packageGroupName;
            }
        }
        let command = `ng update ${name}`;
        if (!tag) {
            command += `@${semver.parse(version)?.major || version}`;
        }
        else if (tag == 'next') {
            command += ' --next';
        }
        return [name, `${info.installed.version} -> ${version} `, command];
    })
        .filter((x) => x !== null)
        .sort((a, b) => (a && b ? a[0].localeCompare(b[0]) : 0));
    if (packagesToUpdate.length == 0) {
        logger.info('We analyzed your package.json and everything seems to be in order. Good work!');
        return;
    }
    logger.info('We analyzed your package.json, there are some packages to update:\n');
    // Find the largest name to know the padding needed.
    let namePad = Math.max(...[...infoMap.keys()].map((x) => x.length)) + 2;
    if (!Number.isFinite(namePad)) {
        namePad = 30;
    }
    const pads = [namePad, 25, 0];
    logger.info('  ' + ['Name', 'Version', 'Command to update'].map((x, i) => x.padEnd(pads[i])).join(''));
    logger.info(' ' + '-'.repeat(pads.reduce((s, x) => (s += x), 0) + 20));
    packagesToUpdate.forEach((fields) => {
        if (!fields) {
            return;
        }
        logger.info('  ' + fields.map((x, i) => x.padEnd(pads[i])).join(''));
    });
    logger.info(`\nThere might be additional packages which don't provide 'ng update' capabilities that are outdated.\n` +
        `You can update the additional packages by running the update command of your package manager.`);
    return;
}
function _buildPackageInfo(tree, packages, allDependencies, npmPackageJson, logger) {
    const name = npmPackageJson.name;
    const packageJsonRange = allDependencies.get(name);
    if (!packageJsonRange) {
        throw new schematics_1.SchematicsException(`Package ${JSON.stringify(name)} was not found in package.json.`);
    }
    // Find out the currently installed version. Either from the package.json or the node_modules/
    // TODO: figure out a way to read package-lock.json and/or yarn.lock.
    let installedVersion;
    const packageContent = tree.read(`/node_modules/${name}/package.json`);
    if (packageContent) {
        const content = JSON.parse(packageContent.toString());
        installedVersion = content.version;
    }
    const packageVersionsNonDeprecated = [];
    const packageVersionsDeprecated = [];
    for (const [version, { deprecated }] of Object.entries(npmPackageJson.versions)) {
        if (deprecated) {
            packageVersionsDeprecated.push(version);
        }
        else {
            packageVersionsNonDeprecated.push(version);
        }
    }
    const findSatisfyingVersion = (targetVersion) => (semver.maxSatisfying(packageVersionsNonDeprecated, targetVersion) ??
        semver.maxSatisfying(packageVersionsDeprecated, targetVersion)) ??
        undefined;
    if (!installedVersion) {
        // Find the version from NPM that fits the range to max.
        installedVersion = findSatisfyingVersion(packageJsonRange);
    }
    if (!installedVersion) {
        throw new schematics_1.SchematicsException(`An unexpected error happened; could not determine version for package ${name}.`);
    }
    const installedPackageJson = npmPackageJson.versions[installedVersion] || packageContent;
    if (!installedPackageJson) {
        throw new schematics_1.SchematicsException(`An unexpected error happened; package ${name} has no version ${installedVersion}.`);
    }
    let targetVersion = packages.get(name);
    if (targetVersion) {
        if (npmPackageJson['dist-tags'][targetVersion]) {
            targetVersion = npmPackageJson['dist-tags'][targetVersion];
        }
        else if (targetVersion == 'next') {
            targetVersion = npmPackageJson['dist-tags']['latest'];
        }
        else {
            targetVersion = findSatisfyingVersion(targetVersion);
        }
    }
    if (targetVersion && semver.lte(targetVersion, installedVersion)) {
        logger.debug(`Package ${name} already satisfied by package.json (${packageJsonRange}).`);
        targetVersion = undefined;
    }
    const target = targetVersion
        ? {
            version: targetVersion,
            packageJson: npmPackageJson.versions[targetVersion],
            updateMetadata: _getUpdateMetadata(npmPackageJson.versions[targetVersion], logger),
        }
        : undefined;
    // Check if there's an installed version.
    return {
        name,
        npmPackageJson,
        installed: {
            version: installedVersion,
            packageJson: installedPackageJson,
            updateMetadata: _getUpdateMetadata(installedPackageJson, logger),
        },
        target,
        packageJsonRange,
    };
}
function _buildPackageList(options, projectDeps, logger) {
    // Parse the packages options to set the targeted version.
    const packages = new Map();
    const commandLinePackages = options.packages && options.packages.length > 0 ? options.packages : [];
    for (const pkg of commandLinePackages) {
        // Split the version asked on command line.
        const m = pkg.match(/^((?:@[^/]{1,100}\/)?[^@]{1,100})(?:@(.{1,100}))?$/);
        if (!m) {
            logger.warn(`Invalid package argument: ${JSON.stringify(pkg)}. Skipping.`);
            continue;
        }
        const [, npmName, maybeVersion] = m;
        const version = projectDeps.get(npmName);
        if (!version) {
            logger.warn(`Package not installed: ${JSON.stringify(npmName)}. Skipping.`);
            continue;
        }
        packages.set(npmName, (maybeVersion || (options.next ? 'next' : 'latest')));
    }
    return packages;
}
function _addPackageGroup(tree, packages, allDependencies, npmPackageJson, logger) {
    const maybePackage = packages.get(npmPackageJson.name);
    if (!maybePackage) {
        return;
    }
    const info = _buildPackageInfo(tree, packages, allDependencies, npmPackageJson, logger);
    const version = (info.target && info.target.version) ||
        npmPackageJson['dist-tags'][maybePackage] ||
        maybePackage;
    if (!npmPackageJson.versions[version]) {
        return;
    }
    const ngUpdateMetadata = npmPackageJson.versions[version]['ng-update'];
    if (!ngUpdateMetadata) {
        return;
    }
    const packageGroup = ngUpdateMetadata['packageGroup'];
    if (!packageGroup) {
        return;
    }
    let packageGroupNormalized = {};
    if (Array.isArray(packageGroup) && !packageGroup.some((x) => typeof x != 'string')) {
        packageGroupNormalized = packageGroup.reduce((acc, curr) => {
            acc[curr] = maybePackage;
            return acc;
        }, {});
    }
    else if (typeof packageGroup == 'object' &&
        packageGroup &&
        !Array.isArray(packageGroup) &&
        Object.values(packageGroup).every((x) => typeof x == 'string')) {
        packageGroupNormalized = packageGroup;
    }
    else {
        logger.warn(`packageGroup metadata of package ${npmPackageJson.name} is malformed. Ignoring.`);
        return;
    }
    for (const [name, value] of Object.entries(packageGroupNormalized)) {
        // Don't override names from the command line.
        // Remove packages that aren't installed.
        if (!packages.has(name) && allDependencies.has(name)) {
            packages.set(name, value);
        }
    }
}
/**
 * Add peer dependencies of packages on the command line to the list of packages to update.
 * We don't do verification of the versions here as this will be done by a later step (and can
 * be ignored by the --force flag).
 * @private
 */
function _addPeerDependencies(tree, packages, allDependencies, npmPackageJson, npmPackageJsonMap, logger) {
    const maybePackage = packages.get(npmPackageJson.name);
    if (!maybePackage) {
        return;
    }
    const info = _buildPackageInfo(tree, packages, allDependencies, npmPackageJson, logger);
    const version = (info.target && info.target.version) ||
        npmPackageJson['dist-tags'][maybePackage] ||
        maybePackage;
    if (!npmPackageJson.versions[version]) {
        return;
    }
    const packageJson = npmPackageJson.versions[version];
    const error = false;
    for (const [peer, range] of Object.entries(packageJson.peerDependencies || {})) {
        if (packages.has(peer)) {
            continue;
        }
        const peerPackageJson = npmPackageJsonMap.get(peer);
        if (peerPackageJson) {
            const peerInfo = _buildPackageInfo(tree, packages, allDependencies, peerPackageJson, logger);
            if (semver.satisfies(peerInfo.installed.version, range)) {
                continue;
            }
        }
        packages.set(peer, range);
    }
    if (error) {
        throw new schematics_1.SchematicsException('An error occured, see above.');
    }
}
function _getAllDependencies(tree) {
    const packageJsonContent = tree.read('/package.json');
    if (!packageJsonContent) {
        throw new schematics_1.SchematicsException('Could not find a package.json. Are you in a Node project?');
    }
    let packageJson;
    try {
        packageJson = JSON.parse(packageJsonContent.toString());
    }
    catch (e) {
        (0, error_1.assertIsError)(e);
        throw new schematics_1.SchematicsException('package.json could not be parsed: ' + e.message);
    }
    return [
        ...Object.entries(packageJson.peerDependencies || {}),
        ...Object.entries(packageJson.devDependencies || {}),
        ...Object.entries(packageJson.dependencies || {}),
    ];
}
function _formatVersion(version) {
    if (version === undefined) {
        return undefined;
    }
    if (!version.match(/^\d{1,30}\.\d{1,30}\.\d{1,30}/)) {
        version += '.0';
    }
    if (!version.match(/^\d{1,30}\.\d{1,30}\.\d{1,30}/)) {
        version += '.0';
    }
    if (!semver.valid(version)) {
        throw new schematics_1.SchematicsException(`Invalid migration version: ${JSON.stringify(version)}`);
    }
    return version;
}
/**
 * Returns whether or not the given package specifier (the value string in a
 * `package.json` dependency) is hosted in the NPM registry.
 * @throws When the specifier cannot be parsed.
 */
function isPkgFromRegistry(name, specifier) {
    const result = npa.resolve(name, specifier);
    return !!result.registry;
}
function default_1(options) {
    if (!options.packages) {
        // We cannot just return this because we need to fetch the packages from NPM still for the
        // help/guide to show.
        options.packages = [];
    }
    else {
        // We split every packages by commas to allow people to pass in multiple and make it an array.
        options.packages = options.packages.reduce((acc, curr) => {
            return acc.concat(curr.split(','));
        }, []);
    }
    if (options.migrateOnly && options.from) {
        if (options.packages.length !== 1) {
            throw new schematics_1.SchematicsException('--from requires that only a single package be passed.');
        }
    }
    options.from = _formatVersion(options.from);
    options.to = _formatVersion(options.to);
    const usingYarn = options.packageManager === 'yarn';
    return async (tree, context) => {
        const logger = context.logger;
        const npmDeps = new Map(_getAllDependencies(tree).filter(([name, specifier]) => {
            try {
                return isPkgFromRegistry(name, specifier);
            }
            catch {
                logger.warn(`Package ${name} was not found on the registry. Skipping.`);
                return false;
            }
        }));
        const packages = _buildPackageList(options, npmDeps, logger);
        // Grab all package.json from the npm repository. This requires a lot of HTTP calls so we
        // try to parallelize as many as possible.
        const allPackageMetadata = await Promise.all(Array.from(npmDeps.keys()).map((depName) => (0, package_metadata_1.getNpmPackageJson)(depName, logger, {
            registry: options.registry,
            usingYarn,
            verbose: options.verbose,
        })));
        // Build a map of all dependencies and their packageJson.
        const npmPackageJsonMap = allPackageMetadata.reduce((acc, npmPackageJson) => {
            // If the package was not found on the registry. It could be private, so we will just
            // ignore. If the package was part of the list, we will error out, but will simply ignore
            // if it's either not requested (so just part of package.json. silently).
            if (!npmPackageJson.name) {
                if (npmPackageJson.requestedName && packages.has(npmPackageJson.requestedName)) {
                    throw new schematics_1.SchematicsException(`Package ${JSON.stringify(npmPackageJson.requestedName)} was not found on the ` +
                        'registry. Cannot continue as this may be an error.');
                }
            }
            else {
                // If a name is present, it is assumed to be fully populated
                acc.set(npmPackageJson.name, npmPackageJson);
            }
            return acc;
        }, new Map());
        // Augment the command line package list with packageGroups and forward peer dependencies.
        // Each added package may uncover new package groups and peer dependencies, so we must
        // repeat this process until the package list stabilizes.
        let lastPackagesSize;
        do {
            lastPackagesSize = packages.size;
            npmPackageJsonMap.forEach((npmPackageJson) => {
                _addPackageGroup(tree, packages, npmDeps, npmPackageJson, logger);
                _addPeerDependencies(tree, packages, npmDeps, npmPackageJson, npmPackageJsonMap, logger);
            });
        } while (packages.size > lastPackagesSize);
        // Build the PackageInfo for each module.
        const packageInfoMap = new Map();
        npmPackageJsonMap.forEach((npmPackageJson) => {
            packageInfoMap.set(npmPackageJson.name, _buildPackageInfo(tree, packages, npmDeps, npmPackageJson, logger));
        });
        // Now that we have all the information, check the flags.
        if (packages.size > 0) {
            if (options.migrateOnly && options.from && options.packages) {
                return;
            }
            const sublog = new core_1.logging.LevelCapLogger('validation', logger.createChild(''), 'warn');
            _validateUpdatePackages(packageInfoMap, !!options.force, !!options.next, sublog);
            _performUpdate(tree, context, packageInfoMap, logger, !!options.migrateOnly);
        }
        else {
            _usageMessage(options, packageInfoMap, logger);
        }
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL2NsaS9zcmMvY29tbWFuZHMvdXBkYXRlL3NjaGVtYXRpYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUFxRDtBQUNyRCwyREFBK0Y7QUFDL0YscURBQXVDO0FBRXZDLCtDQUFpQztBQUNqQyxvREFBeUQ7QUFDekQsMEVBSTZDO0FBVTdDLGtHQUFrRztBQUNsRywrRkFBK0Y7QUFDL0YsOEZBQThGO0FBQzlGLHdGQUF3RjtBQUN4RixxQ0FBcUM7QUFDckMsU0FBZ0IsMkJBQTJCLENBQUMsS0FBYTtJQUN2RCxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hDLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDYixPQUFPLEtBQUssQ0FBQztLQUNkO0lBQ0QsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLE1BQU0sRUFBRSxRQUFRLENBQUMsRUFBRTtRQUM1QyxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksS0FBSyxJQUFJLEVBQUUsRUFBRTtZQUNmLHNEQUFzRDtZQUN0RCxpREFBaUQ7WUFDakQsT0FBTyxRQUFRLENBQUM7U0FDakI7S0FDRjtJQUVELDRGQUE0RjtJQUM1RixnR0FBZ0c7SUFDaEcsMEZBQTBGO0lBQzFGLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFDakIsS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUN2QyxRQUFRLElBQUksUUFBUSxLQUFLLElBQUksS0FBSyxhQUFhLENBQUM7S0FDakQ7SUFFRCxPQUFPLE1B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QUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUM5RTthQUFNO1lBQ0wsYUFBYSxDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDaEQ7SUFDSCxDQUFDLENBQUM7QUFDSixDQUFDO0FBeEdELDRCQXdHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBsb2dnaW5nLCB0YWdzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgUnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCAqIGFzIG5wYSBmcm9tICducG0tcGFja2FnZS1hcmcnO1xuaW1wb3J0IHR5cGUgeyBNYW5pZmVzdCB9IGZyb20gJ3BhY290ZSc7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tICcuLi8uLi8uLi91dGlsaXRpZXMvZXJyb3InO1xuaW1wb3J0IHtcbiAgTmdQYWNrYWdlTWFuaWZlc3RQcm9wZXJ0aWVzLFxuICBOcG1SZXBvc2l0b3J5UGFja2FnZUpzb24sXG4gIGdldE5wbVBhY2thZ2VKc29uLFxufSBmcm9tICcuLi8uLi8uLi91dGlsaXRpZXMvcGFja2FnZS1tZXRhZGF0YSc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgVXBkYXRlU2NoZW1hIH0gZnJvbSAnLi9zY2hlbWEnO1xuXG5pbnRlcmZhY2UgSnNvblNjaGVtYUZvck5wbVBhY2thZ2VKc29uRmlsZXMgZXh0ZW5kcyBNYW5pZmVzdCwgTmdQYWNrYWdlTWFuaWZlc3RQcm9wZXJ0aWVzIHtcbiAgcGVlckRlcGVuZGVuY2llc01ldGE/OiBSZWNvcmQ8c3RyaW5nLCB7IG9wdGlvbmFsPzogYm9vbGVhbiB9Pjtcbn1cblxudHlwZSBWZXJzaW9uUmFuZ2UgPSBzdHJpbmcgJiB7IF9fVkVSU0lPTl9SQU5HRTogdm9pZCB9O1xudHlwZSBQZWVyVmVyc2lvblRyYW5zZm9ybSA9IHN0cmluZyB8ICgocmFuZ2U6IHN0cmluZykgPT4gc3RyaW5nKTtcblxuLy8gQW5ndWxhciBndWFyYW50ZWVzIHRoYXQgYSBtYWpvciBpcyBjb21wYXRpYmxlIHdpdGggaXRzIGZvbGxvd2luZyBtYWpvciAoc28gcGFja2FnZXMgdGhhdCBkZXBlbmRcbi8vIG9uIEFuZ3VsYXIgNSBhcmUgYWxzbyBjb21wYXRpYmxlIHdpdGggQW5ndWxhciA2KS4gVGhpcyBpcywgaW4gY29kZSwgcmVwcmVzZW50ZWQgYnkgdmVyaWZ5aW5nXG4vLyB0aGF0IGFsbCBvdGhlciBwYWNrYWdlcyB0aGF0IGhhdmUgYSBwZWVyIGRlcGVuZGVuY3kgb2YgYFwiQGFuZ3VsYXIvY29yZVwiOiBcIl41LjAuMFwiYCBhY3R1YWxseVxuLy8gc3VwcG9ydHMgNi4wLCBieSBhZGRpbmcgdGhhdCBjb21wYXRpYmlsaXR5IHRvIHRoZSByYW5nZSwgc28gaXQgaXMgYF41LjAuMCB8fCBeNi4wLjBgLlxuLy8gV2UgZXhwb3J0IGl0IHRvIGFsbG93IGZvciB0ZXN0aW5nLlxuZXhwb3J0IGZ1bmN0aW9uIGFuZ3VsYXJNYWpvckNvbXBhdEd1YXJhbnRlZShyYW5nZTogc3RyaW5nKSB7XG4gIGxldCBuZXdSYW5nZSA9IHNlbXZlci52YWxpZFJhbmdlKHJhbmdlKTtcbiAgaWYgKCFuZXdSYW5nZSkge1xuICAgIHJldHVybiByYW5nZTtcbiAgfVxuICBsZXQgbWFqb3IgPSAxO1xuICB3aGlsZSAoIXNlbXZlci5ndHIobWFqb3IgKyAnLjAuMCcsIG5ld1JhbmdlKSkge1xuICAgIG1ham9yKys7XG4gICAgaWYgKG1ham9yID49IDk5KSB7XG4gICAgICAvLyBVc2Ugb3JpZ2luYWwgcmFuZ2UgaWYgaXQgc3VwcG9ydHMgYSBtYWpvciB0aGlzIGhpZ2hcbiAgICAgIC8vIFJhbmdlIGlzIG1vc3QgbGlrZWx5IHVuYm91bmRlZCAoZS5nLiwgPj01LjAuMClcbiAgICAgIHJldHVybiBuZXdSYW5nZTtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgdGhlIG1ham9yIHZlcnNpb24gYXMgY29tcGF0aWJsZSB3aXRoIHRoZSBhbmd1bGFyIGNvbXBhdGlibGUsIHdpdGggYWxsIG1pbm9ycy4gVGhpcyBpc1xuICAvLyBhbHJlYWR5IG9uZSBtYWpvciBhYm92ZSB0aGUgZ3JlYXRlc3Qgc3VwcG9ydGVkLCBiZWNhdXNlIHdlIGluY3JlbWVudCBgbWFqb3JgIGJlZm9yZSBjaGVja2luZy5cbiAgLy8gV2UgYWRkIG1pbm9ycyBsaWtlIHRoaXMgYmVjYXVzZSBhIG1pbm9yIGJldGEgaXMgc3RpbGwgY29tcGF0aWJsZSB3aXRoIGEgbWlub3Igbm9uLWJldGEuXG4gIG5ld1JhbmdlID0gcmFuZ2U7XG4gIGZvciAobGV0IG1pbm9yID0gMDsgbWlub3IgPCAyMDsgbWlub3IrKykge1xuICAgIG5ld1JhbmdlICs9IGAgfHwgXiR7bWFqb3J9LiR7bWlub3J9LjAtYWxwaGEuMCBgO1xuICB9XG5cbiAgcmV0dXJuIHNlbXZlci52YWxpZFJhbmdlKG5ld1JhbmdlKSB8fCByYW5nZTtcbn1cblxuLy8gVGhpcyBpcyBhIG1hcCBvZiBwYWNrYWdlR3JvdXBOYW1lIHRvIHJhbmdlIGV4dGVuZGluZyBmdW5jdGlvbi4gSWYgaXQgaXNuJ3QgZm91bmQsIHRoZSByYW5nZSBpc1xuLy8ga2VwdCB0aGUgc2FtZS5cbmNvbnN0IGtub3duUGVlckNvbXBhdGlibGVMaXN0OiB7IFtuYW1lOiBzdHJpbmddOiBQZWVyVmVyc2lvblRyYW5zZm9ybSB9ID0ge1xuICAnQGFuZ3VsYXIvY29yZSc6IGFuZ3VsYXJNYWpvckNvbXBhdEd1YXJhbnRlZSxcbn07XG5cbmludGVyZmFjZSBQYWNrYWdlVmVyc2lvbkluZm8ge1xuICB2ZXJzaW9uOiBWZXJzaW9uUmFuZ2U7XG4gIHBhY2thZ2VKc29uOiBKc29uU2NoZW1hRm9yTnBtUGFja2FnZUpzb25GaWxlcztcbiAgdXBkYXRlTWV0YWRhdGE6IFVwZGF0ZU1ldGFkYXRhO1xufVxuXG5pbnRlcmZhY2UgUGFja2FnZUluZm8ge1xuICBuYW1lOiBzdHJpbmc7XG4gIG5wbVBhY2thZ2VKc29uOiBOcG1SZXBvc2l0b3J5UGFja2FnZUpzb247XG4gIGluc3RhbGxlZDogUGFja2FnZVZlcnNpb25JbmZvO1xuICB0YXJnZXQ/OiBQYWNrYWdlVmVyc2lvbkluZm87XG4gIHBhY2thZ2VKc29uUmFuZ2U6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFVwZGF0ZU1ldGFkYXRhIHtcbiAgcGFja2FnZUdyb3VwTmFtZT86IHN0cmluZztcbiAgcGFja2FnZUdyb3VwOiB7IFtwYWNrYWdlTmFtZTogc3RyaW5nXTogc3RyaW5nIH07XG4gIHJlcXVpcmVtZW50czogeyBbcGFja2FnZU5hbWU6IHN0cmluZ106IHN0cmluZyB9O1xuICBtaWdyYXRpb25zPzogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBfdXBkYXRlUGVlclZlcnNpb24oaW5mb01hcDogTWFwPHN0cmluZywgUGFja2FnZUluZm8+LCBuYW1lOiBzdHJpbmcsIHJhbmdlOiBzdHJpbmcpIHtcbiAgLy8gUmVzb2x2ZSBwYWNrYWdlR3JvdXBOYW1lLlxuICBjb25zdCBtYXliZVBhY2thZ2VJbmZvID0gaW5mb01hcC5nZXQobmFtZSk7XG4gIGlmICghbWF5YmVQYWNrYWdlSW5mbykge1xuICAgIHJldHVybiByYW5nZTtcbiAgfVxuICBpZiAobWF5YmVQYWNrYWdlSW5mby50YXJnZXQpIHtcbiAgICBuYW1lID0gbWF5YmVQYWNrYWdlSW5mby50YXJnZXQudXBkYXRlTWV0YWRhdGEucGFja2FnZUdyb3VwTmFtZSB8fCBuYW1lO1xuICB9IGVsc2Uge1xuICAgIG5hbWUgPSBtYXliZVBhY2thZ2VJbmZvLmluc3RhbGxlZC51cGRhdGVNZXRhZGF0YS5wYWNrYWdlR3JvdXBOYW1lIHx8IG5hbWU7XG4gIH1cblxuICBjb25zdCBtYXliZVRyYW5zZm9ybSA9IGtub3duUGVlckNvbXBhdGlibGVMaXN0W25hbWVdO1xuICBpZiAobWF5YmVUcmFuc2Zvcm0pIHtcbiAgICBpZiAodHlwZW9mIG1heWJlVHJhbnNmb3JtID09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBtYXliZVRyYW5zZm9ybShyYW5nZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtYXliZVRyYW5zZm9ybTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmFuZ2U7XG59XG5cbmZ1bmN0aW9uIF92YWxpZGF0ZUZvcndhcmRQZWVyRGVwZW5kZW5jaWVzKFxuICBuYW1lOiBzdHJpbmcsXG4gIGluZm9NYXA6IE1hcDxzdHJpbmcsIFBhY2thZ2VJbmZvPixcbiAgcGVlcnM6IHsgW25hbWU6IHN0cmluZ106IHN0cmluZyB9LFxuICBwZWVyc01ldGE6IHsgW25hbWU6IHN0cmluZ106IHsgb3B0aW9uYWw/OiBib29sZWFuIH0gfSxcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbiAgbmV4dDogYm9vbGVhbixcbik6IGJvb2xlYW4ge1xuICBsZXQgdmFsaWRhdGlvbkZhaWxlZCA9IGZhbHNlO1xuICBmb3IgKGNvbnN0IFtwZWVyLCByYW5nZV0gb2YgT2JqZWN0LmVudHJpZXMocGVlcnMpKSB7XG4gICAgbG9nZ2VyLmRlYnVnKGBDaGVja2luZyBmb3J3YXJkIHBlZXIgJHtwZWVyfS4uLmApO1xuICAgIGNvbnN0IG1heWJlUGVlckluZm8gPSBpbmZvTWFwLmdldChwZWVyKTtcbiAgICBjb25zdCBpc09wdGlvbmFsID0gcGVlcnNNZXRhW3BlZXJdICYmICEhcGVlcnNNZXRhW3BlZXJdLm9wdGlvbmFsO1xuICAgIGlmICghbWF5YmVQZWVySW5mbykge1xuICAgICAgaWYgKCFpc09wdGlvbmFsKSB7XG4gICAgICAgIGxvZ2dlci53YXJuKFxuICAgICAgICAgIFtcbiAgICAgICAgICAgIGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGhhcyBhIG1pc3NpbmcgcGVlciBkZXBlbmRlbmN5IG9mYCxcbiAgICAgICAgICAgIGAke0pTT04uc3RyaW5naWZ5KHBlZXIpfSBAICR7SlNPTi5zdHJpbmdpZnkocmFuZ2UpfS5gLFxuICAgICAgICAgIF0uam9pbignICcpLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBwZWVyVmVyc2lvbiA9XG4gICAgICBtYXliZVBlZXJJbmZvLnRhcmdldCAmJiBtYXliZVBlZXJJbmZvLnRhcmdldC5wYWNrYWdlSnNvbi52ZXJzaW9uXG4gICAgICAgID8gbWF5YmVQZWVySW5mby50YXJnZXQucGFja2FnZUpzb24udmVyc2lvblxuICAgICAgICA6IG1heWJlUGVlckluZm8uaW5zdGFsbGVkLnZlcnNpb247XG5cbiAgICBsb2dnZXIuZGVidWcoYCAgUmFuZ2UgaW50ZXJzZWN0cygke3JhbmdlfSwgJHtwZWVyVmVyc2lvbn0pLi4uYCk7XG4gICAgaWYgKCFzZW12ZXIuc2F0aXNmaWVzKHBlZXJWZXJzaW9uLCByYW5nZSwgeyBpbmNsdWRlUHJlcmVsZWFzZTogbmV4dCB8fCB1bmRlZmluZWQgfSkpIHtcbiAgICAgIGxvZ2dlci5lcnJvcihcbiAgICAgICAgW1xuICAgICAgICAgIGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkobmFtZSl9IGhhcyBhbiBpbmNvbXBhdGlibGUgcGVlciBkZXBlbmRlbmN5IHRvYCxcbiAgICAgICAgICBgJHtKU09OLnN0cmluZ2lmeShwZWVyKX0gKHJlcXVpcmVzICR7SlNPTi5zdHJpbmdpZnkocmFuZ2UpfSxgLFxuICAgICAgICAgIGB3b3VsZCBpbnN0YWxsICR7SlNPTi5zdHJpbmdpZnkocGVlclZlcnNpb24pfSlgLFxuICAgICAgICBdLmpvaW4oJyAnKSxcbiAgICAgICk7XG5cbiAgICAgIHZhbGlkYXRpb25GYWlsZWQgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHZhbGlkYXRpb25GYWlsZWQ7XG59XG5cbmZ1bmN0aW9uIF92YWxpZGF0ZVJldmVyc2VQZWVyRGVwZW5kZW5jaWVzKFxuICBuYW1lOiBzdHJpbmcsXG4gIHZlcnNpb246IHN0cmluZyxcbiAgaW5mb01hcDogTWFwPHN0cmluZywgUGFja2FnZUluZm8+LFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuICBuZXh0OiBib29sZWFuLFxuKSB7XG4gIGZvciAoY29uc3QgW2luc3RhbGxlZCwgaW5zdGFsbGVkSW5mb10gb2YgaW5mb01hcC5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCBpbnN0YWxsZWRMb2dnZXIgPSBsb2dnZXIuY3JlYXRlQ2hpbGQoaW5zdGFsbGVkKTtcbiAgICBpbnN0YWxsZWRMb2dnZXIuZGVidWcoYCR7aW5zdGFsbGVkfS4uLmApO1xuICAgIGNvbnN0IHBlZXJzID0gKGluc3RhbGxlZEluZm8udGFyZ2V0IHx8IGluc3RhbGxlZEluZm8uaW5zdGFsbGVkKS5wYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzO1xuXG4gICAgZm9yIChjb25zdCBbcGVlciwgcmFuZ2VdIG9mIE9iamVjdC5lbnRyaWVzKHBlZXJzIHx8IHt9KSkge1xuICAgICAgaWYgKHBlZXIgIT0gbmFtZSkge1xuICAgICAgICAvLyBPbmx5IGNoZWNrIHBlZXJzIHRvIHRoZSBwYWNrYWdlcyB3ZSdyZSB1cGRhdGluZy4gV2UgZG9uJ3QgY2FyZSBhYm91dCBwZWVyc1xuICAgICAgICAvLyB0aGF0IGFyZSB1bm1ldCBidXQgd2UgaGF2ZSBubyBlZmZlY3Qgb24uXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZ25vcmUgcGVlckRlcGVuZGVuY3kgbWlzbWF0Y2hlcyBmb3IgdGhlc2UgcGFja2FnZXMuXG4gICAgICAvLyBUaGV5IGFyZSBkZXByZWNhdGVkIGFuZCByZW1vdmVkIHZpYSBhIG1pZ3JhdGlvbi5cbiAgICAgIGNvbnN0IGlnbm9yZWRQYWNrYWdlcyA9IFtcbiAgICAgICAgJ2NvZGVseXplcicsXG4gICAgICAgICdAc2NoZW1hdGljcy91cGRhdGUnLFxuICAgICAgICAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLW5nLXBhY2thZ3InLFxuICAgICAgICAndHNpY2tsZScsXG4gICAgICBdO1xuICAgICAgaWYgKGlnbm9yZWRQYWNrYWdlcy5pbmNsdWRlcyhpbnN0YWxsZWQpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBPdmVycmlkZSB0aGUgcGVlciB2ZXJzaW9uIHJhbmdlIGlmIGl0J3Mga25vd24gYXMgYSBjb21wYXRpYmxlLlxuICAgICAgY29uc3QgZXh0ZW5kZWRSYW5nZSA9IF91cGRhdGVQZWVyVmVyc2lvbihpbmZvTWFwLCBwZWVyLCByYW5nZSk7XG5cbiAgICAgIGlmICghc2VtdmVyLnNhdGlzZmllcyh2ZXJzaW9uLCBleHRlbmRlZFJhbmdlLCB7IGluY2x1ZGVQcmVyZWxlYXNlOiBuZXh0IHx8IHVuZGVmaW5lZCB9KSkge1xuICAgICAgICBsb2dnZXIuZXJyb3IoXG4gICAgICAgICAgW1xuICAgICAgICAgICAgYFBhY2thZ2UgJHtKU09OLnN0cmluZ2lmeShpbnN0YWxsZWQpfSBoYXMgYW4gaW5jb21wYXRpYmxlIHBlZXIgZGVwZW5kZW5jeSB0b2AsXG4gICAgICAgICAgICBgJHtKU09OLnN0cmluZ2lmeShuYW1lKX0gKHJlcXVpcmVzYCxcbiAgICAgICAgICAgIGAke0pTT04uc3RyaW5naWZ5KHJhbmdlKX0ke2V4dGVuZGVkUmFuZ2UgPT0gcmFuZ2UgPyAnJyA6ICcgKGV4dGVuZGVkKSd9LGAsXG4gICAgICAgICAgICBgd291bGQgaW5zdGFsbCAke0pTT04uc3RyaW5naWZ5KHZlcnNpb24pfSkuYCxcbiAgICAgICAgICBdLmpvaW4oJyAnKSxcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF92YWxpZGF0ZVVwZGF0ZVBhY2thZ2VzKFxuICBpbmZvTWFwOiBNYXA8c3RyaW5nLCBQYWNrYWdlSW5mbz4sXG4gIGZvcmNlOiBib29sZWFuLFxuICBuZXh0OiBib29sZWFuLFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKTogdm9pZCB7XG4gIGxvZ2dlci5kZWJ1ZygnVXBkYXRpbmcgdGhlIGZvbGxvd2luZyBwYWNrYWdlczonKTtcbiAgaW5mb01hcC5mb3JFYWNoKChpbmZvKSA9PiB7XG4gICAgaWYgKGluZm8udGFyZ2V0KSB7XG4gICAgICBsb2dnZXIuZGVidWcoYCAgJHtpbmZvLm5hbWV9ID0+ICR7aW5mby50YXJnZXQudmVyc2lvbn1gKTtcbiAgICB9XG4gIH0pO1xuXG4gIGxldCBwZWVyRXJyb3JzID0gZmFsc2U7XG4gIGluZm9NYXAuZm9yRWFjaCgoaW5mbykgPT4ge1xuICAgIGNvbnN0IHsgbmFtZSwgdGFyZ2V0IH0gPSBpbmZvO1xuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGtnTG9nZ2VyID0gbG9nZ2VyLmNyZWF0ZUNoaWxkKG5hbWUpO1xuICAgIGxvZ2dlci5kZWJ1ZyhgJHtuYW1lfS4uLmApO1xuXG4gICAgY29uc3QgeyBwZWVyRGVwZW5kZW5jaWVzID0ge30sIHBlZXJEZXBlbmRlbmNpZXNNZXRhID0ge30gfSA9IHRhcmdldC5wYWNrYWdlSnNvbjtcbiAgICBwZWVyRXJyb3JzID1cbiAgICAgIF92YWxpZGF0ZUZvcndhcmRQZWVyRGVwZW5kZW5jaWVzKFxuICAgICAgICBuYW1lLFxuICAgICAgICBpbmZvTWFwLFxuICAgICAgICBwZWVyRGVwZW5kZW5jaWVzLFxuICAgICAgICBwZWVyRGVwZW5kZW5jaWVzTWV0YSxcbiAgICAgICAgcGtnTG9nZ2VyLFxuICAgICAgICBuZXh0LFxuICAgICAgKSB8fCBwZWVyRXJyb3JzO1xuICAgIHBlZXJFcnJvcnMgPVxuICAgICAgX3ZhbGlkYXRlUmV2ZXJzZVBlZXJEZXBlbmRlbmNpZXMobmFtZSwgdGFyZ2V0LnZlcnNpb24sIGluZm9NYXAsIHBrZ0xvZ2dlciwgbmV4dCkgfHxcbiAgICAgIHBlZXJFcnJvcnM7XG4gIH0pO1xuXG4gIGlmICghZm9yY2UgJiYgcGVlckVycm9ycykge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKHRhZ3Muc3RyaXBJbmRlbnRzYEluY29tcGF0aWJsZSBwZWVyIGRlcGVuZGVuY2llcyBmb3VuZC5cbiAgICAgIFBlZXIgZGVwZW5kZW5jeSB3YXJuaW5ncyB3aGVuIGluc3RhbGxpbmcgZGVwZW5kZW5jaWVzIG1lYW5zIHRoYXQgdGhvc2UgZGVwZW5kZW5jaWVzIG1pZ2h0IG5vdCB3b3JrIGNvcnJlY3RseSB0b2dldGhlci5cbiAgICAgIFlvdSBjYW4gdXNlIHRoZSAnLS1mb3JjZScgb3B0aW9uIHRvIGlnbm9yZSBpbmNvbXBhdGlibGUgcGVlciBkZXBlbmRlbmNpZXMgYW5kIGluc3RlYWQgYWRkcmVzcyB0aGVzZSB3YXJuaW5ncyBsYXRlci5gKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfcGVyZm9ybVVwZGF0ZShcbiAgdHJlZTogVHJlZSxcbiAgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCxcbiAgaW5mb01hcDogTWFwPHN0cmluZywgUGFja2FnZUluZm8+LFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuICBtaWdyYXRlT25seTogYm9vbGVhbixcbik6IHZvaWQge1xuICBjb25zdCBwYWNrYWdlSnNvbkNvbnRlbnQgPSB0cmVlLnJlYWQoJy9wYWNrYWdlLmpzb24nKTtcbiAgaWYgKCFwYWNrYWdlSnNvbkNvbnRlbnQpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignQ291bGQgbm90IGZpbmQgYSBwYWNrYWdlLmpzb24uIEFyZSB5b3UgaW4gYSBOb2RlIHByb2plY3Q/Jyk7XG4gIH1cblxuICBsZXQgcGFja2FnZUpzb246IEpzb25TY2hlbWFGb3JOcG1QYWNrYWdlSnNvbkZpbGVzO1xuICB0cnkge1xuICAgIHBhY2thZ2VKc29uID0gSlNPTi5wYXJzZShwYWNrYWdlSnNvbkNvbnRlbnQudG9TdHJpbmcoKSkgYXMgSnNvblNjaGVtYUZvck5wbVBhY2thZ2VKc29uRmlsZXM7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhc3NlcnRJc0Vycm9yKGUpO1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdwYWNrYWdlLmpzb24gY291bGQgbm90IGJlIHBhcnNlZDogJyArIGUubWVzc2FnZSk7XG4gIH1cblxuICBjb25zdCB1cGRhdGVEZXBlbmRlbmN5ID0gKGRlcHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sIG5hbWU6IHN0cmluZywgbmV3VmVyc2lvbjogc3RyaW5nKSA9PiB7XG4gICAgY29uc3Qgb2xkVmVyc2lvbiA9IGRlcHNbbmFtZV07XG4gICAgLy8gV2Ugb25seSByZXNwZWN0IGNhcmV0IGFuZCB0aWxkZSByYW5nZXMgb24gdXBkYXRlLlxuICAgIGNvbnN0IGV4ZWNSZXN1bHQgPSAvXltcXF5+XS8uZXhlYyhvbGRWZXJzaW9uKTtcbiAgICBkZXBzW25hbWVdID0gYCR7ZXhlY1Jlc3VsdCA/IGV4ZWNSZXN1bHRbMF0gOiAnJ30ke25ld1ZlcnNpb259YDtcbiAgfTtcblxuICBjb25zdCB0b0luc3RhbGwgPSBbLi4uaW5mb01hcC52YWx1ZXMoKV1cbiAgICAubWFwKCh4KSA9PiBbeC5uYW1lLCB4LnRhcmdldCwgeC5pbnN0YWxsZWRdKVxuICAgIC5maWx0ZXIoKFtuYW1lLCB0YXJnZXQsIGluc3RhbGxlZF0pID0+IHtcbiAgICAgIHJldHVybiAhIW5hbWUgJiYgISF0YXJnZXQgJiYgISFpbnN0YWxsZWQ7XG4gICAgfSkgYXMgW3N0cmluZywgUGFja2FnZVZlcnNpb25JbmZvLCBQYWNrYWdlVmVyc2lvbkluZm9dW107XG5cbiAgdG9JbnN0YWxsLmZvckVhY2goKFtuYW1lLCB0YXJnZXQsIGluc3RhbGxlZF0pID0+IHtcbiAgICBsb2dnZXIuaW5mbyhcbiAgICAgIGBVcGRhdGluZyBwYWNrYWdlLmpzb24gd2l0aCBkZXBlbmRlbmN5ICR7bmFtZX0gYCArXG4gICAgICAgIGBAICR7SlNPTi5zdHJpbmdpZnkodGFyZ2V0LnZlcnNpb24pfSAod2FzICR7SlNPTi5zdHJpbmdpZnkoaW5zdGFsbGVkLnZlcnNpb24pfSkuLi5gLFxuICAgICk7XG5cbiAgICBpZiAocGFja2FnZUpzb24uZGVwZW5kZW5jaWVzICYmIHBhY2thZ2VKc29uLmRlcGVuZGVuY2llc1tuYW1lXSkge1xuICAgICAgdXBkYXRlRGVwZW5kZW5jeShwYWNrYWdlSnNvbi5kZXBlbmRlbmNpZXMsIG5hbWUsIHRhcmdldC52ZXJzaW9uKTtcblxuICAgICAgaWYgKHBhY2thZ2VKc29uLmRldkRlcGVuZGVuY2llcyAmJiBwYWNrYWdlSnNvbi5kZXZEZXBlbmRlbmNpZXNbbmFtZV0pIHtcbiAgICAgICAgZGVsZXRlIHBhY2thZ2VKc29uLmRldkRlcGVuZGVuY2llc1tuYW1lXTtcbiAgICAgIH1cbiAgICAgIGlmIChwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzICYmIHBhY2thZ2VKc29uLnBlZXJEZXBlbmRlbmNpZXNbbmFtZV0pIHtcbiAgICAgICAgZGVsZXRlIHBhY2thZ2VKc29uLnBlZXJEZXBlbmRlbmNpZXNbbmFtZV07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwYWNrYWdlSnNvbi5kZXZEZXBlbmRlbmNpZXMgJiYgcGFja2FnZUpzb24uZGV2RGVwZW5kZW5jaWVzW25hbWVdKSB7XG4gICAgICB1cGRhdGVEZXBlbmRlbmN5KHBhY2thZ2VKc29uLmRldkRlcGVuZGVuY2llcywgbmFtZSwgdGFyZ2V0LnZlcnNpb24pO1xuXG4gICAgICBpZiAocGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llcyAmJiBwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzW25hbWVdKSB7XG4gICAgICAgIGRlbGV0ZSBwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzW25hbWVdO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llcyAmJiBwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzW25hbWVdKSB7XG4gICAgICB1cGRhdGVEZXBlbmRlbmN5KHBhY2thZ2VKc29uLnBlZXJEZXBlbmRlbmNpZXMsIG5hbWUsIHRhcmdldC52ZXJzaW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nZ2VyLndhcm4oYFBhY2thZ2UgJHtuYW1lfSB3YXMgbm90IGZvdW5kIGluIGRlcGVuZGVuY2llcy5gKTtcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IG5ld0NvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShwYWNrYWdlSnNvbiwgbnVsbCwgMik7XG4gIGlmIChwYWNrYWdlSnNvbkNvbnRlbnQudG9TdHJpbmcoKSAhPSBuZXdDb250ZW50IHx8IG1pZ3JhdGVPbmx5KSB7XG4gICAgaWYgKCFtaWdyYXRlT25seSkge1xuICAgICAgdHJlZS5vdmVyd3JpdGUoJy9wYWNrYWdlLmpzb24nLCBKU09OLnN0cmluZ2lmeShwYWNrYWdlSnNvbiwgbnVsbCwgMikpO1xuICAgIH1cblxuICAgIGNvbnN0IGV4dGVybmFsTWlncmF0aW9uczoge31bXSA9IFtdO1xuXG4gICAgLy8gUnVuIHRoZSBtaWdyYXRlIHNjaGVtYXRpY3Mgd2l0aCB0aGUgbGlzdCBvZiBwYWNrYWdlcyB0byB1c2UuIFRoZSBjb2xsZWN0aW9uIGNvbnRhaW5zXG4gICAgLy8gdmVyc2lvbiBpbmZvcm1hdGlvbiBhbmQgd2UgbmVlZCB0byBkbyB0aGlzIHBvc3QgaW5zdGFsbGF0aW9uLiBQbGVhc2Ugbm90ZSB0aGF0IHRoZVxuICAgIC8vIG1pZ3JhdGlvbiBDT1VMRCBmYWlsIGFuZCBsZWF2ZSBzaWRlIGVmZmVjdHMgb24gZGlzay5cbiAgICAvLyBSdW4gdGhlIHNjaGVtYXRpY3MgdGFzayBvZiB0aG9zZSBwYWNrYWdlcy5cbiAgICB0b0luc3RhbGwuZm9yRWFjaCgoW25hbWUsIHRhcmdldCwgaW5zdGFsbGVkXSkgPT4ge1xuICAgICAgaWYgKCF0YXJnZXQudXBkYXRlTWV0YWRhdGEubWlncmF0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGV4dGVybmFsTWlncmF0aW9ucy5wdXNoKHtcbiAgICAgICAgcGFja2FnZTogbmFtZSxcbiAgICAgICAgY29sbGVjdGlvbjogdGFyZ2V0LnVwZGF0ZU1ldGFkYXRhLm1pZ3JhdGlvbnMsXG4gICAgICAgIGZyb206IGluc3RhbGxlZC52ZXJzaW9uLFxuICAgICAgICB0bzogdGFyZ2V0LnZlcnNpb24sXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuO1xuICAgIH0pO1xuXG4gICAgaWYgKGV4dGVybmFsTWlncmF0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgKGdsb2JhbCBhcyBhbnkpLmV4dGVybmFsTWlncmF0aW9ucyA9IGV4dGVybmFsTWlncmF0aW9ucztcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gX2dldFVwZGF0ZU1ldGFkYXRhKFxuICBwYWNrYWdlSnNvbjogSnNvblNjaGVtYUZvck5wbVBhY2thZ2VKc29uRmlsZXMsXG4gIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGksXG4pOiBVcGRhdGVNZXRhZGF0YSB7XG4gIGNvbnN0IG1ldGFkYXRhID0gcGFja2FnZUpzb25bJ25nLXVwZGF0ZSddO1xuXG4gIGNvbnN0IHJlc3VsdDogVXBkYXRlTWV0YWRhdGEgPSB7XG4gICAgcGFja2FnZUdyb3VwOiB7fSxcbiAgICByZXF1aXJlbWVudHM6IHt9LFxuICB9O1xuXG4gIGlmICghbWV0YWRhdGEgfHwgdHlwZW9mIG1ldGFkYXRhICE9ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkobWV0YWRhdGEpKSB7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGlmIChtZXRhZGF0YVsncGFja2FnZUdyb3VwJ10pIHtcbiAgICBjb25zdCBwYWNrYWdlR3JvdXAgPSBtZXRhZGF0YVsncGFja2FnZUdyb3VwJ107XG4gICAgLy8gVmVyaWZ5IHRoYXQgcGFja2FnZUdyb3VwIGlzIGFuIGFycmF5IG9mIHN0cmluZ3Mgb3IgYW4gbWFwIG9mIHZlcnNpb25zLiBUaGlzIGlzIG5vdCBhbiBlcnJvclxuICAgIC8vIGJ1dCB3ZSBzdGlsbCB3YXJuIHRoZSB1c2VyIGFuZCBpZ25vcmUgdGhlIHBhY2thZ2VHcm91cCBrZXlzLlxuICAgIGlmIChBcnJheS5pc0FycmF5KHBhY2thZ2VHcm91cCkgJiYgcGFja2FnZUdyb3VwLmV2ZXJ5KCh4KSA9PiB0eXBlb2YgeCA9PSAnc3RyaW5nJykpIHtcbiAgICAgIHJlc3VsdC5wYWNrYWdlR3JvdXAgPSBwYWNrYWdlR3JvdXAucmVkdWNlKChncm91cCwgbmFtZSkgPT4ge1xuICAgICAgICBncm91cFtuYW1lXSA9IHBhY2thZ2VKc29uLnZlcnNpb247XG5cbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfSwgcmVzdWx0LnBhY2thZ2VHcm91cCk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHR5cGVvZiBwYWNrYWdlR3JvdXAgPT0gJ29iamVjdCcgJiZcbiAgICAgIHBhY2thZ2VHcm91cCAmJlxuICAgICAgIUFycmF5LmlzQXJyYXkocGFja2FnZUdyb3VwKSAmJlxuICAgICAgT2JqZWN0LnZhbHVlcyhwYWNrYWdlR3JvdXApLmV2ZXJ5KCh4KSA9PiB0eXBlb2YgeCA9PSAnc3RyaW5nJylcbiAgICApIHtcbiAgICAgIHJlc3VsdC5wYWNrYWdlR3JvdXAgPSBwYWNrYWdlR3JvdXA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZ2dlci53YXJuKGBwYWNrYWdlR3JvdXAgbWV0YWRhdGEgb2YgcGFja2FnZSAke3BhY2thZ2VKc29uLm5hbWV9IGlzIG1hbGZvcm1lZC4gSWdub3JpbmcuYCk7XG4gICAgfVxuXG4gICAgcmVzdWx0LnBhY2thZ2VHcm91cE5hbWUgPSBPYmplY3Qua2V5cyhyZXN1bHQucGFja2FnZUdyb3VwKVswXTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgbWV0YWRhdGFbJ3BhY2thZ2VHcm91cE5hbWUnXSA9PSAnc3RyaW5nJykge1xuICAgIHJlc3VsdC5wYWNrYWdlR3JvdXBOYW1lID0gbWV0YWRhdGFbJ3BhY2thZ2VHcm91cE5hbWUnXTtcbiAgfVxuXG4gIGlmIChtZXRhZGF0YVsncmVxdWlyZW1lbnRzJ10pIHtcbiAgICBjb25zdCByZXF1aXJlbWVudHMgPSBtZXRhZGF0YVsncmVxdWlyZW1lbnRzJ107XG4gICAgLy8gVmVyaWZ5IHRoYXQgcmVxdWlyZW1lbnRzIGFyZVxuICAgIGlmIChcbiAgICAgIHR5cGVvZiByZXF1aXJlbWVudHMgIT0gJ29iamVjdCcgfHxcbiAgICAgIEFycmF5LmlzQXJyYXkocmVxdWlyZW1lbnRzKSB8fFxuICAgICAgT2JqZWN0LmtleXMocmVxdWlyZW1lbnRzKS5zb21lKChuYW1lKSA9PiB0eXBlb2YgcmVxdWlyZW1lbnRzW25hbWVdICE9ICdzdHJpbmcnKVxuICAgICkge1xuICAgICAgbG9nZ2VyLndhcm4oYHJlcXVpcmVtZW50cyBtZXRhZGF0YSBvZiBwYWNrYWdlICR7cGFja2FnZUpzb24ubmFtZX0gaXMgbWFsZm9ybWVkLiBJZ25vcmluZy5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnJlcXVpcmVtZW50cyA9IHJlcXVpcmVtZW50cztcbiAgICB9XG4gIH1cblxuICBpZiAobWV0YWRhdGFbJ21pZ3JhdGlvbnMnXSkge1xuICAgIGNvbnN0IG1pZ3JhdGlvbnMgPSBtZXRhZGF0YVsnbWlncmF0aW9ucyddO1xuICAgIGlmICh0eXBlb2YgbWlncmF0aW9ucyAhPSAnc3RyaW5nJykge1xuICAgICAgbG9nZ2VyLndhcm4oYG1pZ3JhdGlvbnMgbWV0YWRhdGEgb2YgcGFja2FnZSAke3BhY2thZ2VKc29uLm5hbWV9IGlzIG1hbGZvcm1lZC4gSWdub3JpbmcuYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5taWdyYXRpb25zID0gbWlncmF0aW9ucztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBfdXNhZ2VNZXNzYWdlKFxuICBvcHRpb25zOiBVcGRhdGVTY2hlbWEsXG4gIGluZm9NYXA6IE1hcDxzdHJpbmcsIFBhY2thZ2VJbmZvPixcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbikge1xuICBjb25zdCBwYWNrYWdlR3JvdXBzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgY29uc3QgcGFja2FnZXNUb1VwZGF0ZSA9IFsuLi5pbmZvTWFwLmVudHJpZXMoKV1cbiAgICAubWFwKChbbmFtZSwgaW5mb10pID0+IHtcbiAgICAgIGxldCB0YWcgPSBvcHRpb25zLm5leHRcbiAgICAgICAgPyBpbmZvLm5wbVBhY2thZ2VKc29uWydkaXN0LXRhZ3MnXVsnbmV4dCddXG4gICAgICAgICAgPyAnbmV4dCdcbiAgICAgICAgICA6ICdsYXRlc3QnXG4gICAgICAgIDogJ2xhdGVzdCc7XG4gICAgICBsZXQgdmVyc2lvbiA9IGluZm8ubnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddW3RhZ107XG4gICAgICBsZXQgdGFyZ2V0ID0gaW5mby5ucG1QYWNrYWdlSnNvbi52ZXJzaW9uc1t2ZXJzaW9uXTtcblxuICAgICAgY29uc3QgdmVyc2lvbkRpZmYgPSBzZW12ZXIuZGlmZihpbmZvLmluc3RhbGxlZC52ZXJzaW9uLCB2ZXJzaW9uKTtcbiAgICAgIGlmIChcbiAgICAgICAgdmVyc2lvbkRpZmYgIT09ICdwYXRjaCcgJiZcbiAgICAgICAgdmVyc2lvbkRpZmYgIT09ICdtaW5vcicgJiZcbiAgICAgICAgL15AKD86YW5ndWxhcnxuZ3VuaXZlcnNhbClcXC8vLnRlc3QobmFtZSlcbiAgICAgICkge1xuICAgICAgICBjb25zdCBpbnN0YWxsZWRNYWpvclZlcnNpb24gPSBzZW12ZXIucGFyc2UoaW5mby5pbnN0YWxsZWQudmVyc2lvbik/Lm1ham9yO1xuICAgICAgICBjb25zdCB0b0luc3RhbGxNYWpvclZlcnNpb24gPSBzZW12ZXIucGFyc2UodmVyc2lvbik/Lm1ham9yO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgaW5zdGFsbGVkTWFqb3JWZXJzaW9uICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICB0b0luc3RhbGxNYWpvclZlcnNpb24gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgIGluc3RhbGxlZE1ham9yVmVyc2lvbiA8IHRvSW5zdGFsbE1ham9yVmVyc2lvbiAtIDFcbiAgICAgICAgKSB7XG4gICAgICAgICAgY29uc3QgbmV4dE1ham9yVmVyc2lvbiA9IGAke2luc3RhbGxlZE1ham9yVmVyc2lvbiArIDF9LmA7XG4gICAgICAgICAgY29uc3QgbmV4dE1ham9yVmVyc2lvbnMgPSBPYmplY3Qua2V5cyhpbmZvLm5wbVBhY2thZ2VKc29uLnZlcnNpb25zKVxuICAgICAgICAgICAgLmZpbHRlcigodikgPT4gdi5zdGFydHNXaXRoKG5leHRNYWpvclZlcnNpb24pKVxuICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IChhID4gYiA/IC0xIDogMSkpO1xuXG4gICAgICAgICAgaWYgKG5leHRNYWpvclZlcnNpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgdmVyc2lvbiA9IG5leHRNYWpvclZlcnNpb25zWzBdO1xuICAgICAgICAgICAgdGFyZ2V0ID0gaW5mby5ucG1QYWNrYWdlSnNvbi52ZXJzaW9uc1t2ZXJzaW9uXTtcbiAgICAgICAgICAgIHRhZyA9ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBpbmZvLFxuICAgICAgICB2ZXJzaW9uLFxuICAgICAgICB0YWcsXG4gICAgICAgIHRhcmdldCxcbiAgICAgIH07XG4gICAgfSlcbiAgICAuZmlsdGVyKFxuICAgICAgKHsgaW5mbywgdmVyc2lvbiwgdGFyZ2V0IH0pID0+XG4gICAgICAgIHRhcmdldD8uWyduZy11cGRhdGUnXSAmJiBzZW12ZXIuY29tcGFyZShpbmZvLmluc3RhbGxlZC52ZXJzaW9uLCB2ZXJzaW9uKSA8IDAsXG4gICAgKVxuICAgIC5tYXAoKHsgbmFtZSwgaW5mbywgdmVyc2lvbiwgdGFnLCB0YXJnZXQgfSkgPT4ge1xuICAgICAgLy8gTG9vayBmb3IgcGFja2FnZUdyb3VwLlxuICAgICAgY29uc3QgcGFja2FnZUdyb3VwID0gdGFyZ2V0WyduZy11cGRhdGUnXT8uWydwYWNrYWdlR3JvdXAnXTtcbiAgICAgIGlmIChwYWNrYWdlR3JvdXApIHtcbiAgICAgICAgY29uc3QgcGFja2FnZUdyb3VwTmFtZXMgPSBBcnJheS5pc0FycmF5KHBhY2thZ2VHcm91cClcbiAgICAgICAgICA/IHBhY2thZ2VHcm91cFxuICAgICAgICAgIDogT2JqZWN0LmtleXMocGFja2FnZUdyb3VwKTtcblxuICAgICAgICBjb25zdCBwYWNrYWdlR3JvdXBOYW1lID0gdGFyZ2V0WyduZy11cGRhdGUnXT8uWydwYWNrYWdlR3JvdXBOYW1lJ10gfHwgcGFja2FnZUdyb3VwTmFtZXNbMF07XG4gICAgICAgIGlmIChwYWNrYWdlR3JvdXBOYW1lKSB7XG4gICAgICAgICAgaWYgKHBhY2thZ2VHcm91cHMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwYWNrYWdlR3JvdXBOYW1lcy5mb3JFYWNoKCh4OiBzdHJpbmcpID0+IHBhY2thZ2VHcm91cHMuc2V0KHgsIHBhY2thZ2VHcm91cE5hbWUpKTtcbiAgICAgICAgICBwYWNrYWdlR3JvdXBzLnNldChwYWNrYWdlR3JvdXBOYW1lLCBwYWNrYWdlR3JvdXBOYW1lKTtcbiAgICAgICAgICBuYW1lID0gcGFja2FnZUdyb3VwTmFtZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsZXQgY29tbWFuZCA9IGBuZyB1cGRhdGUgJHtuYW1lfWA7XG4gICAgICBpZiAoIXRhZykge1xuICAgICAgICBjb21tYW5kICs9IGBAJHtzZW12ZXIucGFyc2UodmVyc2lvbik/Lm1ham9yIHx8IHZlcnNpb259YDtcbiAgICAgIH0gZWxzZSBpZiAodGFnID09ICduZXh0Jykge1xuICAgICAgICBjb21tYW5kICs9ICcgLS1uZXh0JztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFtuYW1lLCBgJHtpbmZvLmluc3RhbGxlZC52ZXJzaW9ufSAtPiAke3ZlcnNpb259IGAsIGNvbW1hbmRdO1xuICAgIH0pXG4gICAgLmZpbHRlcigoeCkgPT4geCAhPT0gbnVsbClcbiAgICAuc29ydCgoYSwgYikgPT4gKGEgJiYgYiA/IGFbMF0ubG9jYWxlQ29tcGFyZShiWzBdKSA6IDApKTtcblxuICBpZiAocGFja2FnZXNUb1VwZGF0ZS5sZW5ndGggPT0gMCkge1xuICAgIGxvZ2dlci5pbmZvKCdXZSBhbmFseXplZCB5b3VyIHBhY2thZ2UuanNvbiBhbmQgZXZlcnl0aGluZyBzZWVtcyB0byBiZSBpbiBvcmRlci4gR29vZCB3b3JrIScpO1xuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbG9nZ2VyLmluZm8oJ1dlIGFuYWx5emVkIHlvdXIgcGFja2FnZS5qc29uLCB0aGVyZSBhcmUgc29tZSBwYWNrYWdlcyB0byB1cGRhdGU6XFxuJyk7XG5cbiAgLy8gRmluZCB0aGUgbGFyZ2VzdCBuYW1lIHRvIGtub3cgdGhlIHBhZGRpbmcgbmVlZGVkLlxuICBsZXQgbmFtZVBhZCA9IE1hdGgubWF4KC4uLlsuLi5pbmZvTWFwLmtleXMoKV0ubWFwKCh4KSA9PiB4Lmxlbmd0aCkpICsgMjtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobmFtZVBhZCkpIHtcbiAgICBuYW1lUGFkID0gMzA7XG4gIH1cbiAgY29uc3QgcGFkcyA9IFtuYW1lUGFkLCAyNSwgMF07XG5cbiAgbG9nZ2VyLmluZm8oXG4gICAgJyAgJyArIFsnTmFtZScsICdWZXJzaW9uJywgJ0NvbW1hbmQgdG8gdXBkYXRlJ10ubWFwKCh4LCBpKSA9PiB4LnBhZEVuZChwYWRzW2ldKSkuam9pbignJyksXG4gICk7XG4gIGxvZ2dlci5pbmZvKCcgJyArICctJy5yZXBlYXQocGFkcy5yZWR1Y2UoKHMsIHgpID0+IChzICs9IHgpLCAwKSArIDIwKSk7XG5cbiAgcGFja2FnZXNUb1VwZGF0ZS5mb3JFYWNoKChmaWVsZHMpID0+IHtcbiAgICBpZiAoIWZpZWxkcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvZ2dlci5pbmZvKCcgICcgKyBmaWVsZHMubWFwKCh4LCBpKSA9PiB4LnBhZEVuZChwYWRzW2ldKSkuam9pbignJykpO1xuICB9KTtcblxuICBsb2dnZXIuaW5mbyhcbiAgICBgXFxuVGhlcmUgbWlnaHQgYmUgYWRkaXRpb25hbCBwYWNrYWdlcyB3aGljaCBkb24ndCBwcm92aWRlICduZyB1cGRhdGUnIGNhcGFiaWxpdGllcyB0aGF0IGFyZSBvdXRkYXRlZC5cXG5gICtcbiAgICAgIGBZb3UgY2FuIHVwZGF0ZSB0aGUgYWRkaXRpb25hbCBwYWNrYWdlcyBieSBydW5uaW5nIHRoZSB1cGRhdGUgY29tbWFuZCBvZiB5b3VyIHBhY2thZ2UgbWFuYWdlci5gLFxuICApO1xuXG4gIHJldHVybjtcbn1cblxuZnVuY3Rpb24gX2J1aWxkUGFja2FnZUluZm8oXG4gIHRyZWU6IFRyZWUsXG4gIHBhY2thZ2VzOiBNYXA8c3RyaW5nLCBWZXJzaW9uUmFuZ2U+LFxuICBhbGxEZXBlbmRlbmNpZXM6IFJlYWRvbmx5TWFwPHN0cmluZywgVmVyc2lvblJhbmdlPixcbiAgbnBtUGFja2FnZUpzb246IE5wbVJlcG9zaXRvcnlQYWNrYWdlSnNvbixcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbik6IFBhY2thZ2VJbmZvIHtcbiAgY29uc3QgbmFtZSA9IG5wbVBhY2thZ2VKc29uLm5hbWU7XG4gIGNvbnN0IHBhY2thZ2VKc29uUmFuZ2UgPSBhbGxEZXBlbmRlbmNpZXMuZ2V0KG5hbWUpO1xuICBpZiAoIXBhY2thZ2VKc29uUmFuZ2UpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgUGFja2FnZSAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSB3YXMgbm90IGZvdW5kIGluIHBhY2thZ2UuanNvbi5gKTtcbiAgfVxuXG4gIC8vIEZpbmQgb3V0IHRoZSBjdXJyZW50bHkgaW5zdGFsbGVkIHZlcnNpb24uIEVpdGhlciBmcm9tIHRoZSBwYWNrYWdlLmpzb24gb3IgdGhlIG5vZGVfbW9kdWxlcy9cbiAgLy8gVE9ETzogZmlndXJlIG91dCBhIHdheSB0byByZWFkIHBhY2thZ2UtbG9jay5qc29uIGFuZC9vciB5YXJuLmxvY2suXG4gIGxldCBpbnN0YWxsZWRWZXJzaW9uOiBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsO1xuICBjb25zdCBwYWNrYWdlQ29udGVudCA9IHRyZWUucmVhZChgL25vZGVfbW9kdWxlcy8ke25hbWV9L3BhY2thZ2UuanNvbmApO1xuICBpZiAocGFja2FnZUNvbnRlbnQpIHtcbiAgICBjb25zdCBjb250ZW50ID0gSlNPTi5wYXJzZShwYWNrYWdlQ29udGVudC50b1N0cmluZygpKSBhcyBKc29uU2NoZW1hRm9yTnBtUGFja2FnZUpzb25GaWxlcztcbiAgICBpbnN0YWxsZWRWZXJzaW9uID0gY29udGVudC52ZXJzaW9uO1xuICB9XG5cbiAgY29uc3QgcGFja2FnZVZlcnNpb25zTm9uRGVwcmVjYXRlZDogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgcGFja2FnZVZlcnNpb25zRGVwcmVjYXRlZDogc3RyaW5nW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IFt2ZXJzaW9uLCB7IGRlcHJlY2F0ZWQgfV0gb2YgT2JqZWN0LmVudHJpZXMobnBtUGFja2FnZUpzb24udmVyc2lvbnMpKSB7XG4gICAgaWYgKGRlcHJlY2F0ZWQpIHtcbiAgICAgIHBhY2thZ2VWZXJzaW9uc0RlcHJlY2F0ZWQucHVzaCh2ZXJzaW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFja2FnZVZlcnNpb25zTm9uRGVwcmVjYXRlZC5wdXNoKHZlcnNpb24pO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGZpbmRTYXRpc2Z5aW5nVmVyc2lvbiA9ICh0YXJnZXRWZXJzaW9uOiBWZXJzaW9uUmFuZ2UpOiBWZXJzaW9uUmFuZ2UgfCB1bmRlZmluZWQgPT5cbiAgICAoKHNlbXZlci5tYXhTYXRpc2Z5aW5nKHBhY2thZ2VWZXJzaW9uc05vbkRlcHJlY2F0ZWQsIHRhcmdldFZlcnNpb24pID8/XG4gICAgICBzZW12ZXIubWF4U2F0aXNmeWluZyhwYWNrYWdlVmVyc2lvbnNEZXByZWNhdGVkLCB0YXJnZXRWZXJzaW9uKSkgYXMgVmVyc2lvblJhbmdlIHwgbnVsbCkgPz9cbiAgICB1bmRlZmluZWQ7XG5cbiAgaWYgKCFpbnN0YWxsZWRWZXJzaW9uKSB7XG4gICAgLy8gRmluZCB0aGUgdmVyc2lvbiBmcm9tIE5QTSB0aGF0IGZpdHMgdGhlIHJhbmdlIHRvIG1heC5cbiAgICBpbnN0YWxsZWRWZXJzaW9uID0gZmluZFNhdGlzZnlpbmdWZXJzaW9uKHBhY2thZ2VKc29uUmFuZ2UpO1xuICB9XG5cbiAgaWYgKCFpbnN0YWxsZWRWZXJzaW9uKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICBgQW4gdW5leHBlY3RlZCBlcnJvciBoYXBwZW5lZDsgY291bGQgbm90IGRldGVybWluZSB2ZXJzaW9uIGZvciBwYWNrYWdlICR7bmFtZX0uYCxcbiAgICApO1xuICB9XG5cbiAgY29uc3QgaW5zdGFsbGVkUGFja2FnZUpzb24gPSBucG1QYWNrYWdlSnNvbi52ZXJzaW9uc1tpbnN0YWxsZWRWZXJzaW9uXSB8fCBwYWNrYWdlQ29udGVudDtcbiAgaWYgKCFpbnN0YWxsZWRQYWNrYWdlSnNvbikge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgYEFuIHVuZXhwZWN0ZWQgZXJyb3IgaGFwcGVuZWQ7IHBhY2thZ2UgJHtuYW1lfSBoYXMgbm8gdmVyc2lvbiAke2luc3RhbGxlZFZlcnNpb259LmAsXG4gICAgKTtcbiAgfVxuXG4gIGxldCB0YXJnZXRWZXJzaW9uOiBWZXJzaW9uUmFuZ2UgfCB1bmRlZmluZWQgPSBwYWNrYWdlcy5nZXQobmFtZSk7XG4gIGlmICh0YXJnZXRWZXJzaW9uKSB7XG4gICAgaWYgKG5wbVBhY2thZ2VKc29uWydkaXN0LXRhZ3MnXVt0YXJnZXRWZXJzaW9uXSkge1xuICAgICAgdGFyZ2V0VmVyc2lvbiA9IG5wbVBhY2thZ2VKc29uWydkaXN0LXRhZ3MnXVt0YXJnZXRWZXJzaW9uXSBhcyBWZXJzaW9uUmFuZ2U7XG4gICAgfSBlbHNlIGlmICh0YXJnZXRWZXJzaW9uID09ICduZXh0Jykge1xuICAgICAgdGFyZ2V0VmVyc2lvbiA9IG5wbVBhY2thZ2VKc29uWydkaXN0LXRhZ3MnXVsnbGF0ZXN0J10gYXMgVmVyc2lvblJhbmdlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YXJnZXRWZXJzaW9uID0gZmluZFNhdGlzZnlpbmdWZXJzaW9uKHRhcmdldFZlcnNpb24pO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0YXJnZXRWZXJzaW9uICYmIHNlbXZlci5sdGUodGFyZ2V0VmVyc2lvbiwgaW5zdGFsbGVkVmVyc2lvbikpIHtcbiAgICBsb2dnZXIuZGVidWcoYFBhY2thZ2UgJHtuYW1lfSBhbHJlYWR5IHNhdGlzZmllZCBieSBwYWNrYWdlLmpzb24gKCR7cGFja2FnZUpzb25SYW5nZX0pLmApO1xuICAgIHRhcmdldFZlcnNpb24gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCB0YXJnZXQ6IFBhY2thZ2VWZXJzaW9uSW5mbyB8IHVuZGVmaW5lZCA9IHRhcmdldFZlcnNpb25cbiAgICA/IHtcbiAgICAgICAgdmVyc2lvbjogdGFyZ2V0VmVyc2lvbixcbiAgICAgICAgcGFja2FnZUpzb246IG5wbVBhY2thZ2VKc29uLnZlcnNpb25zW3RhcmdldFZlcnNpb25dLFxuICAgICAgICB1cGRhdGVNZXRhZGF0YTogX2dldFVwZGF0ZU1ldGFkYXRhKG5wbVBhY2thZ2VKc29uLnZlcnNpb25zW3RhcmdldFZlcnNpb25dLCBsb2dnZXIpLFxuICAgICAgfVxuICAgIDogdW5kZWZpbmVkO1xuXG4gIC8vIENoZWNrIGlmIHRoZXJlJ3MgYW4gaW5zdGFsbGVkIHZlcnNpb24uXG4gIHJldHVybiB7XG4gICAgbmFtZSxcbiAgICBucG1QYWNrYWdlSnNvbixcbiAgICBpbnN0YWxsZWQ6IHtcbiAgICAgIHZlcnNpb246IGluc3RhbGxlZFZlcnNpb24gYXMgVmVyc2lvblJhbmdlLFxuICAgICAgcGFja2FnZUpzb246IGluc3RhbGxlZFBhY2thZ2VKc29uLFxuICAgICAgdXBkYXRlTWV0YWRhdGE6IF9nZXRVcGRhdGVNZXRhZGF0YShpbnN0YWxsZWRQYWNrYWdlSnNvbiwgbG9nZ2VyKSxcbiAgICB9LFxuICAgIHRhcmdldCxcbiAgICBwYWNrYWdlSnNvblJhbmdlLFxuICB9O1xufVxuXG5mdW5jdGlvbiBfYnVpbGRQYWNrYWdlTGlzdChcbiAgb3B0aW9uczogVXBkYXRlU2NoZW1hLFxuICBwcm9qZWN0RGVwczogTWFwPHN0cmluZywgVmVyc2lvblJhbmdlPixcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbik6IE1hcDxzdHJpbmcsIFZlcnNpb25SYW5nZT4ge1xuICAvLyBQYXJzZSB0aGUgcGFja2FnZXMgb3B0aW9ucyB0byBzZXQgdGhlIHRhcmdldGVkIHZlcnNpb24uXG4gIGNvbnN0IHBhY2thZ2VzID0gbmV3IE1hcDxzdHJpbmcsIFZlcnNpb25SYW5nZT4oKTtcbiAgY29uc3QgY29tbWFuZExpbmVQYWNrYWdlcyA9XG4gICAgb3B0aW9ucy5wYWNrYWdlcyAmJiBvcHRpb25zLnBhY2thZ2VzLmxlbmd0aCA+IDAgPyBvcHRpb25zLnBhY2thZ2VzIDogW107XG5cbiAgZm9yIChjb25zdCBwa2cgb2YgY29tbWFuZExpbmVQYWNrYWdlcykge1xuICAgIC8vIFNwbGl0IHRoZSB2ZXJzaW9uIGFza2VkIG9uIGNvbW1hbmQgbGluZS5cbiAgICBjb25zdCBtID0gcGtnLm1hdGNoKC9eKCg/OkBbXi9dezEsMTAwfVxcLyk/W15AXXsxLDEwMH0pKD86QCguezEsMTAwfSkpPyQvKTtcbiAgICBpZiAoIW0pIHtcbiAgICAgIGxvZ2dlci53YXJuKGBJbnZhbGlkIHBhY2thZ2UgYXJndW1lbnQ6ICR7SlNPTi5zdHJpbmdpZnkocGtnKX0uIFNraXBwaW5nLmApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgWywgbnBtTmFtZSwgbWF5YmVWZXJzaW9uXSA9IG07XG5cbiAgICBjb25zdCB2ZXJzaW9uID0gcHJvamVjdERlcHMuZ2V0KG5wbU5hbWUpO1xuICAgIGlmICghdmVyc2lvbikge1xuICAgICAgbG9nZ2VyLndhcm4oYFBhY2thZ2Ugbm90IGluc3RhbGxlZDogJHtKU09OLnN0cmluZ2lmeShucG1OYW1lKX0uIFNraXBwaW5nLmApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcGFja2FnZXMuc2V0KG5wbU5hbWUsIChtYXliZVZlcnNpb24gfHwgKG9wdGlvbnMubmV4dCA/ICduZXh0JyA6ICdsYXRlc3QnKSkgYXMgVmVyc2lvblJhbmdlKTtcbiAgfVxuXG4gIHJldHVybiBwYWNrYWdlcztcbn1cblxuZnVuY3Rpb24gX2FkZFBhY2thZ2VHcm91cChcbiAgdHJlZTogVHJlZSxcbiAgcGFja2FnZXM6IE1hcDxzdHJpbmcsIFZlcnNpb25SYW5nZT4sXG4gIGFsbERlcGVuZGVuY2llczogUmVhZG9ubHlNYXA8c3RyaW5nLCBWZXJzaW9uUmFuZ2U+LFxuICBucG1QYWNrYWdlSnNvbjogTnBtUmVwb3NpdG9yeVBhY2thZ2VKc29uLFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKTogdm9pZCB7XG4gIGNvbnN0IG1heWJlUGFja2FnZSA9IHBhY2thZ2VzLmdldChucG1QYWNrYWdlSnNvbi5uYW1lKTtcbiAgaWYgKCFtYXliZVBhY2thZ2UpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBpbmZvID0gX2J1aWxkUGFja2FnZUluZm8odHJlZSwgcGFja2FnZXMsIGFsbERlcGVuZGVuY2llcywgbnBtUGFja2FnZUpzb24sIGxvZ2dlcik7XG5cbiAgY29uc3QgdmVyc2lvbiA9XG4gICAgKGluZm8udGFyZ2V0ICYmIGluZm8udGFyZ2V0LnZlcnNpb24pIHx8XG4gICAgbnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddW21heWJlUGFja2FnZV0gfHxcbiAgICBtYXliZVBhY2thZ2U7XG4gIGlmICghbnBtUGFja2FnZUpzb24udmVyc2lvbnNbdmVyc2lvbl0pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgbmdVcGRhdGVNZXRhZGF0YSA9IG5wbVBhY2thZ2VKc29uLnZlcnNpb25zW3ZlcnNpb25dWyduZy11cGRhdGUnXTtcbiAgaWYgKCFuZ1VwZGF0ZU1ldGFkYXRhKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgcGFja2FnZUdyb3VwID0gbmdVcGRhdGVNZXRhZGF0YVsncGFja2FnZUdyb3VwJ107XG4gIGlmICghcGFja2FnZUdyb3VwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxldCBwYWNrYWdlR3JvdXBOb3JtYWxpemVkOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGlmIChBcnJheS5pc0FycmF5KHBhY2thZ2VHcm91cCkgJiYgIXBhY2thZ2VHcm91cC5zb21lKCh4KSA9PiB0eXBlb2YgeCAhPSAnc3RyaW5nJykpIHtcbiAgICBwYWNrYWdlR3JvdXBOb3JtYWxpemVkID0gcGFja2FnZUdyb3VwLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7XG4gICAgICBhY2NbY3Vycl0gPSBtYXliZVBhY2thZ2U7XG5cbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30gYXMgeyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH0pO1xuICB9IGVsc2UgaWYgKFxuICAgIHR5cGVvZiBwYWNrYWdlR3JvdXAgPT0gJ29iamVjdCcgJiZcbiAgICBwYWNrYWdlR3JvdXAgJiZcbiAgICAhQXJyYXkuaXNBcnJheShwYWNrYWdlR3JvdXApICYmXG4gICAgT2JqZWN0LnZhbHVlcyhwYWNrYWdlR3JvdXApLmV2ZXJ5KCh4KSA9PiB0eXBlb2YgeCA9PSAnc3RyaW5nJylcbiAgKSB7XG4gICAgcGFja2FnZUdyb3VwTm9ybWFsaXplZCA9IHBhY2thZ2VHcm91cDtcbiAgfSBlbHNlIHtcbiAgICBsb2dnZXIud2FybihgcGFja2FnZUdyb3VwIG1ldGFkYXRhIG9mIHBhY2thZ2UgJHtucG1QYWNrYWdlSnNvbi5uYW1lfSBpcyBtYWxmb3JtZWQuIElnbm9yaW5nLmApO1xuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZm9yIChjb25zdCBbbmFtZSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHBhY2thZ2VHcm91cE5vcm1hbGl6ZWQpKSB7XG4gICAgLy8gRG9uJ3Qgb3ZlcnJpZGUgbmFtZXMgZnJvbSB0aGUgY29tbWFuZCBsaW5lLlxuICAgIC8vIFJlbW92ZSBwYWNrYWdlcyB0aGF0IGFyZW4ndCBpbnN0YWxsZWQuXG4gICAgaWYgKCFwYWNrYWdlcy5oYXMobmFtZSkgJiYgYWxsRGVwZW5kZW5jaWVzLmhhcyhuYW1lKSkge1xuICAgICAgcGFja2FnZXMuc2V0KG5hbWUsIHZhbHVlIGFzIFZlcnNpb25SYW5nZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQWRkIHBlZXIgZGVwZW5kZW5jaWVzIG9mIHBhY2thZ2VzIG9uIHRoZSBjb21tYW5kIGxpbmUgdG8gdGhlIGxpc3Qgb2YgcGFja2FnZXMgdG8gdXBkYXRlLlxuICogV2UgZG9uJ3QgZG8gdmVyaWZpY2F0aW9uIG9mIHRoZSB2ZXJzaW9ucyBoZXJlIGFzIHRoaXMgd2lsbCBiZSBkb25lIGJ5IGEgbGF0ZXIgc3RlcCAoYW5kIGNhblxuICogYmUgaWdub3JlZCBieSB0aGUgLS1mb3JjZSBmbGFnKS5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIF9hZGRQZWVyRGVwZW5kZW5jaWVzKFxuICB0cmVlOiBUcmVlLFxuICBwYWNrYWdlczogTWFwPHN0cmluZywgVmVyc2lvblJhbmdlPixcbiAgYWxsRGVwZW5kZW5jaWVzOiBSZWFkb25seU1hcDxzdHJpbmcsIFZlcnNpb25SYW5nZT4sXG4gIG5wbVBhY2thZ2VKc29uOiBOcG1SZXBvc2l0b3J5UGFja2FnZUpzb24sXG4gIG5wbVBhY2thZ2VKc29uTWFwOiBNYXA8c3RyaW5nLCBOcG1SZXBvc2l0b3J5UGFja2FnZUpzb24+LFxuICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuKTogdm9pZCB7XG4gIGNvbnN0IG1heWJlUGFja2FnZSA9IHBhY2thZ2VzLmdldChucG1QYWNrYWdlSnNvbi5uYW1lKTtcbiAgaWYgKCFtYXliZVBhY2thZ2UpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBpbmZvID0gX2J1aWxkUGFja2FnZUluZm8odHJlZSwgcGFja2FnZXMsIGFsbERlcGVuZGVuY2llcywgbnBtUGFja2FnZUpzb24sIGxvZ2dlcik7XG5cbiAgY29uc3QgdmVyc2lvbiA9XG4gICAgKGluZm8udGFyZ2V0ICYmIGluZm8udGFyZ2V0LnZlcnNpb24pIHx8XG4gICAgbnBtUGFja2FnZUpzb25bJ2Rpc3QtdGFncyddW21heWJlUGFja2FnZV0gfHxcbiAgICBtYXliZVBhY2thZ2U7XG4gIGlmICghbnBtUGFja2FnZUpzb24udmVyc2lvbnNbdmVyc2lvbl0pIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwYWNrYWdlSnNvbiA9IG5wbVBhY2thZ2VKc29uLnZlcnNpb25zW3ZlcnNpb25dO1xuICBjb25zdCBlcnJvciA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgW3BlZXIsIHJhbmdlXSBvZiBPYmplY3QuZW50cmllcyhwYWNrYWdlSnNvbi5wZWVyRGVwZW5kZW5jaWVzIHx8IHt9KSkge1xuICAgIGlmIChwYWNrYWdlcy5oYXMocGVlcikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHBlZXJQYWNrYWdlSnNvbiA9IG5wbVBhY2thZ2VKc29uTWFwLmdldChwZWVyKTtcbiAgICBpZiAocGVlclBhY2thZ2VKc29uKSB7XG4gICAgICBjb25zdCBwZWVySW5mbyA9IF9idWlsZFBhY2thZ2VJbmZvKHRyZWUsIHBhY2thZ2VzLCBhbGxEZXBlbmRlbmNpZXMsIHBlZXJQYWNrYWdlSnNvbiwgbG9nZ2VyKTtcbiAgICAgIGlmIChzZW12ZXIuc2F0aXNmaWVzKHBlZXJJbmZvLmluc3RhbGxlZC52ZXJzaW9uLCByYW5nZSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGFja2FnZXMuc2V0KHBlZXIsIHJhbmdlIGFzIFZlcnNpb25SYW5nZSk7XG4gIH1cblxuICBpZiAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignQW4gZXJyb3Igb2NjdXJlZCwgc2VlIGFib3ZlLicpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9nZXRBbGxEZXBlbmRlbmNpZXModHJlZTogVHJlZSk6IEFycmF5PHJlYWRvbmx5IFtzdHJpbmcsIFZlcnNpb25SYW5nZV0+IHtcbiAgY29uc3QgcGFja2FnZUpzb25Db250ZW50ID0gdHJlZS5yZWFkKCcvcGFja2FnZS5qc29uJyk7XG4gIGlmICghcGFja2FnZUpzb25Db250ZW50KSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oJ0NvdWxkIG5vdCBmaW5kIGEgcGFja2FnZS5qc29uLiBBcmUgeW91IGluIGEgTm9kZSBwcm9qZWN0PycpO1xuICB9XG5cbiAgbGV0IHBhY2thZ2VKc29uOiBKc29uU2NoZW1hRm9yTnBtUGFja2FnZUpzb25GaWxlcztcbiAgdHJ5IHtcbiAgICBwYWNrYWdlSnNvbiA9IEpTT04ucGFyc2UocGFja2FnZUpzb25Db250ZW50LnRvU3RyaW5nKCkpIGFzIEpzb25TY2hlbWFGb3JOcG1QYWNrYWdlSnNvbkZpbGVzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYXNzZXJ0SXNFcnJvcihlKTtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbigncGFja2FnZS5qc29uIGNvdWxkIG5vdCBiZSBwYXJzZWQ6ICcgKyBlLm1lc3NhZ2UpO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICAuLi4oT2JqZWN0LmVudHJpZXMocGFja2FnZUpzb24ucGVlckRlcGVuZGVuY2llcyB8fCB7fSkgYXMgQXJyYXk8W3N0cmluZywgVmVyc2lvblJhbmdlXT4pLFxuICAgIC4uLihPYmplY3QuZW50cmllcyhwYWNrYWdlSnNvbi5kZXZEZXBlbmRlbmNpZXMgfHwge30pIGFzIEFycmF5PFtzdHJpbmcsIFZlcnNpb25SYW5nZV0+KSxcbiAgICAuLi4oT2JqZWN0LmVudHJpZXMocGFja2FnZUpzb24uZGVwZW5kZW5jaWVzIHx8IHt9KSBhcyBBcnJheTxbc3RyaW5nLCBWZXJzaW9uUmFuZ2VdPiksXG4gIF07XG59XG5cbmZ1bmN0aW9uIF9mb3JtYXRWZXJzaW9uKHZlcnNpb246IHN0cmluZyB8IHVuZGVmaW5lZCkge1xuICBpZiAodmVyc2lvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmICghdmVyc2lvbi5tYXRjaCgvXlxcZHsxLDMwfVxcLlxcZHsxLDMwfVxcLlxcZHsxLDMwfS8pKSB7XG4gICAgdmVyc2lvbiArPSAnLjAnO1xuICB9XG4gIGlmICghdmVyc2lvbi5tYXRjaCgvXlxcZHsxLDMwfVxcLlxcZHsxLDMwfVxcLlxcZHsxLDMwfS8pKSB7XG4gICAgdmVyc2lvbiArPSAnLjAnO1xuICB9XG4gIGlmICghc2VtdmVyLnZhbGlkKHZlcnNpb24pKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oYEludmFsaWQgbWlncmF0aW9uIHZlcnNpb246ICR7SlNPTi5zdHJpbmdpZnkodmVyc2lvbil9YCk7XG4gIH1cblxuICByZXR1cm4gdmVyc2lvbjtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBwYWNrYWdlIHNwZWNpZmllciAodGhlIHZhbHVlIHN0cmluZyBpbiBhXG4gKiBgcGFja2FnZS5qc29uYCBkZXBlbmRlbmN5KSBpcyBob3N0ZWQgaW4gdGhlIE5QTSByZWdpc3RyeS5cbiAqIEB0aHJvd3MgV2hlbiB0aGUgc3BlY2lmaWVyIGNhbm5vdCBiZSBwYXJzZWQuXG4gKi9cbmZ1bmN0aW9uIGlzUGtnRnJvbVJlZ2lzdHJ5KG5hbWU6IHN0cmluZywgc3BlY2lmaWVyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgcmVzdWx0ID0gbnBhLnJlc29sdmUobmFtZSwgc3BlY2lmaWVyKTtcblxuICByZXR1cm4gISFyZXN1bHQucmVnaXN0cnk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zOiBVcGRhdGVTY2hlbWEpOiBSdWxlIHtcbiAgaWYgKCFvcHRpb25zLnBhY2thZ2VzKSB7XG4gICAgLy8gV2UgY2Fubm90IGp1c3QgcmV0dXJuIHRoaXMgYmVjYXVzZSB3ZSBuZWVkIHRvIGZldGNoIHRoZSBwYWNrYWdlcyBmcm9tIE5QTSBzdGlsbCBmb3IgdGhlXG4gICAgLy8gaGVscC9ndWlkZSB0byBzaG93LlxuICAgIG9wdGlvbnMucGFja2FnZXMgPSBbXTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXZSBzcGxpdCBldmVyeSBwYWNrYWdlcyBieSBjb21tYXMgdG8gYWxsb3cgcGVvcGxlIHRvIHBhc3MgaW4gbXVsdGlwbGUgYW5kIG1ha2UgaXQgYW4gYXJyYXkuXG4gICAgb3B0aW9ucy5wYWNrYWdlcyA9IG9wdGlvbnMucGFja2FnZXMucmVkdWNlKChhY2MsIGN1cnIpID0+IHtcbiAgICAgIHJldHVybiBhY2MuY29uY2F0KGN1cnIuc3BsaXQoJywnKSk7XG4gICAgfSwgW10gYXMgc3RyaW5nW10pO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMubWlncmF0ZU9ubHkgJiYgb3B0aW9ucy5mcm9tKSB7XG4gICAgaWYgKG9wdGlvbnMucGFja2FnZXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbignLS1mcm9tIHJlcXVpcmVzIHRoYXQgb25seSBhIHNpbmdsZSBwYWNrYWdlIGJlIHBhc3NlZC4nKTtcbiAgICB9XG4gIH1cblxuICBvcHRpb25zLmZyb20gPSBfZm9ybWF0VmVyc2lvbihvcHRpb25zLmZyb20pO1xuICBvcHRpb25zLnRvID0gX2Zvcm1hdFZlcnNpb24ob3B0aW9ucy50byk7XG4gIGNvbnN0IHVzaW5nWWFybiA9IG9wdGlvbnMucGFja2FnZU1hbmFnZXIgPT09ICd5YXJuJztcblxuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcbiAgICBjb25zdCBucG1EZXBzID0gbmV3IE1hcChcbiAgICAgIF9nZXRBbGxEZXBlbmRlbmNpZXModHJlZSkuZmlsdGVyKChbbmFtZSwgc3BlY2lmaWVyXSkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBpc1BrZ0Zyb21SZWdpc3RyeShuYW1lLCBzcGVjaWZpZXIpO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICBsb2dnZXIud2FybihgUGFja2FnZSAke25hbWV9IHdhcyBub3QgZm91bmQgb24gdGhlIHJlZ2lzdHJ5LiBTa2lwcGluZy5gKTtcblxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKTtcbiAgICBjb25zdCBwYWNrYWdlcyA9IF9idWlsZFBhY2thZ2VMaXN0KG9wdGlvbnMsIG5wbURlcHMsIGxvZ2dlcik7XG5cbiAgICAvLyBHcmFiIGFsbCBwYWNrYWdlLmpzb24gZnJvbSB0aGUgbnBtIHJlcG9zaXRvcnkuIFRoaXMgcmVxdWlyZXMgYSBsb3Qgb2YgSFRUUCBjYWxscyBzbyB3ZVxuICAgIC8vIHRyeSB0byBwYXJhbGxlbGl6ZSBhcyBtYW55IGFzIHBvc3NpYmxlLlxuICAgIGNvbnN0IGFsbFBhY2thZ2VNZXRhZGF0YSA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgQXJyYXkuZnJvbShucG1EZXBzLmtleXMoKSkubWFwKChkZXBOYW1lKSA9PlxuICAgICAgICBnZXROcG1QYWNrYWdlSnNvbihkZXBOYW1lLCBsb2dnZXIsIHtcbiAgICAgICAgICByZWdpc3RyeTogb3B0aW9ucy5yZWdpc3RyeSxcbiAgICAgICAgICB1c2luZ1lhcm4sXG4gICAgICAgICAgdmVyYm9zZTogb3B0aW9ucy52ZXJib3NlLFxuICAgICAgICB9KSxcbiAgICAgICksXG4gICAgKTtcblxuICAgIC8vIEJ1aWxkIGEgbWFwIG9mIGFsbCBkZXBlbmRlbmNpZXMgYW5kIHRoZWlyIHBhY2thZ2VKc29uLlxuICAgIGNvbnN0IG5wbVBhY2thZ2VKc29uTWFwID0gYWxsUGFja2FnZU1ldGFkYXRhLnJlZHVjZSgoYWNjLCBucG1QYWNrYWdlSnNvbikgPT4ge1xuICAgICAgLy8gSWYgdGhlIHBhY2thZ2Ugd2FzIG5vdCBmb3VuZCBvbiB0aGUgcmVnaXN0cnkuIEl0IGNvdWxkIGJlIHByaXZhdGUsIHNvIHdlIHdpbGwganVzdFxuICAgICAgLy8gaWdub3JlLiBJZiB0aGUgcGFja2FnZSB3YXMgcGFydCBvZiB0aGUgbGlzdCwgd2Ugd2lsbCBlcnJvciBvdXQsIGJ1dCB3aWxsIHNpbXBseSBpZ25vcmVcbiAgICAgIC8vIGlmIGl0J3MgZWl0aGVyIG5vdCByZXF1ZXN0ZWQgKHNvIGp1c3QgcGFydCBvZiBwYWNrYWdlLmpzb24uIHNpbGVudGx5KS5cbiAgICAgIGlmICghbnBtUGFja2FnZUpzb24ubmFtZSkge1xuICAgICAgICBpZiAobnBtUGFja2FnZUpzb24ucmVxdWVzdGVkTmFtZSAmJiBwYWNrYWdlcy5oYXMobnBtUGFja2FnZUpzb24ucmVxdWVzdGVkTmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAgIGBQYWNrYWdlICR7SlNPTi5zdHJpbmdpZnkobnBtUGFja2FnZUpzb24ucmVxdWVzdGVkTmFtZSl9IHdhcyBub3QgZm91bmQgb24gdGhlIGAgK1xuICAgICAgICAgICAgICAncmVnaXN0cnkuIENhbm5vdCBjb250aW51ZSBhcyB0aGlzIG1heSBiZSBhbiBlcnJvci4nLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElmIGEgbmFtZSBpcyBwcmVzZW50LCBpdCBpcyBhc3N1bWVkIHRvIGJlIGZ1bGx5IHBvcHVsYXRlZFxuICAgICAgICBhY2Muc2V0KG5wbVBhY2thZ2VKc29uLm5hbWUsIG5wbVBhY2thZ2VKc29uIGFzIE5wbVJlcG9zaXRvcnlQYWNrYWdlSnNvbik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgbmV3IE1hcDxzdHJpbmcsIE5wbVJlcG9zaXRvcnlQYWNrYWdlSnNvbj4oKSk7XG5cbiAgICAvLyBBdWdtZW50IHRoZSBjb21tYW5kIGxpbmUgcGFja2FnZSBsaXN0IHdpdGggcGFja2FnZUdyb3VwcyBhbmQgZm9yd2FyZCBwZWVyIGRlcGVuZGVuY2llcy5cbiAgICAvLyBFYWNoIGFkZGVkIHBhY2thZ2UgbWF5IHVuY292ZXIgbmV3IHBhY2thZ2UgZ3JvdXBzIGFuZCBwZWVyIGRlcGVuZGVuY2llcywgc28gd2UgbXVzdFxuICAgIC8vIHJlcGVhdCB0aGlzIHByb2Nlc3MgdW50aWwgdGhlIHBhY2thZ2UgbGlzdCBzdGFiaWxpemVzLlxuICAgIGxldCBsYXN0UGFja2FnZXNTaXplO1xuICAgIGRvIHtcbiAgICAgIGxhc3RQYWNrYWdlc1NpemUgPSBwYWNrYWdlcy5zaXplO1xuICAgICAgbnBtUGFja2FnZUpzb25NYXAuZm9yRWFjaCgobnBtUGFja2FnZUpzb24pID0+IHtcbiAgICAgICAgX2FkZFBhY2thZ2VHcm91cCh0cmVlLCBwYWNrYWdlcywgbnBtRGVwcywgbnBtUGFja2FnZUpzb24sIGxvZ2dlcik7XG4gICAgICAgIF9hZGRQZWVyRGVwZW5kZW5jaWVzKHRyZWUsIHBhY2thZ2VzLCBucG1EZXBzLCBucG1QYWNrYWdlSnNvbiwgbnBtUGFja2FnZUpzb25NYXAsIGxvZ2dlcik7XG4gICAgICB9KTtcbiAgICB9IHdoaWxlIChwYWNrYWdlcy5zaXplID4gbGFzdFBhY2thZ2VzU2l6ZSk7XG5cbiAgICAvLyBCdWlsZCB0aGUgUGFja2FnZUluZm8gZm9yIGVhY2ggbW9kdWxlLlxuICAgIGNvbnN0IHBhY2thZ2VJbmZvTWFwID0gbmV3IE1hcDxzdHJpbmcsIFBhY2thZ2VJbmZvPigpO1xuICAgIG5wbVBhY2thZ2VKc29uTWFwLmZvckVhY2goKG5wbVBhY2thZ2VKc29uKSA9PiB7XG4gICAgICBwYWNrYWdlSW5mb01hcC5zZXQoXG4gICAgICAgIG5wbVBhY2thZ2VKc29uLm5hbWUsXG4gICAgICAgIF9idWlsZFBhY2thZ2VJbmZvKHRyZWUsIHBhY2thZ2VzLCBucG1EZXBzLCBucG1QYWNrYWdlSnNvbiwgbG9nZ2VyKSxcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIGFsbCB0aGUgaW5mb3JtYXRpb24sIGNoZWNrIHRoZSBmbGFncy5cbiAgICBpZiAocGFja2FnZXMuc2l6ZSA+IDApIHtcbiAgICAgIGlmIChvcHRpb25zLm1pZ3JhdGVPbmx5ICYmIG9wdGlvbnMuZnJvbSAmJiBvcHRpb25zLnBhY2thZ2VzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3VibG9nID0gbmV3IGxvZ2dpbmcuTGV2ZWxDYXBMb2dnZXIoJ3ZhbGlkYXRpb24nLCBsb2dnZXIuY3JlYXRlQ2hpbGQoJycpLCAnd2FybicpO1xuICAgICAgX3ZhbGlkYXRlVXBkYXRlUGFja2FnZXMocGFja2FnZUluZm9NYXAsICEhb3B0aW9ucy5mb3JjZSwgISFvcHRpb25zLm5leHQsIHN1YmxvZyk7XG5cbiAgICAgIF9wZXJmb3JtVXBkYXRlKHRyZWUsIGNvbnRleHQsIHBhY2thZ2VJbmZvTWFwLCBsb2dnZXIsICEhb3B0aW9ucy5taWdyYXRlT25seSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIF91c2FnZU1lc3NhZ2Uob3B0aW9ucywgcGFja2FnZUluZm9NYXAsIGxvZ2dlcik7XG4gICAgfVxuICB9O1xufVxuIl19