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
exports.getNpmPackageJson = exports.fetchPackageManifest = exports.fetchPackageMetadata = void 0;
const lockfile = __importStar(require("@yarnpkg/lockfile"));
const fs_1 = require("fs");
const ini = __importStar(require("ini"));
const os_1 = require("os");
const path = __importStar(require("path"));
let npmrc;
const npmPackageJsonCache = new Map();
function ensureNpmrc(logger, usingYarn, verbose) {
    if (!npmrc) {
        try {
            npmrc = readOptions(logger, false, verbose);
        }
        catch { }
        if (usingYarn) {
            try {
                npmrc = { ...npmrc, ...readOptions(logger, true, verbose) };
            }
            catch { }
        }
    }
}
function readOptions(logger, yarn = false, showPotentials = false) {
    const cwd = process.cwd();
    const baseFilename = yarn ? 'yarnrc' : 'npmrc';
    const dotFilename = '.' + baseFilename;
    let globalPrefix;
    if (process.env.PREFIX) {
        globalPrefix = process.env.PREFIX;
    }
    else {
        globalPrefix = path.dirname(process.execPath);
        if (process.platform !== 'win32') {
            globalPrefix = path.dirname(globalPrefix);
        }
    }
    const defaultConfigLocations = [
        (!yarn && process.env.NPM_CONFIG_GLOBALCONFIG) || path.join(globalPrefix, 'etc', baseFilename),
        (!yarn && process.env.NPM_CONFIG_USERCONFIG) || path.join((0, os_1.homedir)(), dotFilename),
    ];
    const projectConfigLocations = [path.join(cwd, dotFilename)];
    if (yarn) {
        const root = path.parse(cwd).root;
        for (let curDir = path.dirname(cwd); curDir && curDir !== root; curDir = path.dirname(curDir)) {
            projectConfigLocations.unshift(path.join(curDir, dotFilename));
        }
    }
    if (showPotentials) {
        logger.info(`Locating potential ${baseFilename} files:`);
    }
    let rcOptions = {};
    for (const location of [...defaultConfigLocations, ...projectConfigLocations]) {
        if ((0, fs_1.existsSync)(location)) {
            if (showPotentials) {
                logger.info(`Trying '${location}'...found.`);
            }
            const data = (0, fs_1.readFileSync)(location, 'utf8');
            // Normalize RC options that are needed by 'npm-registry-fetch'.
            // See: https://github.com/npm/npm-registry-fetch/blob/ebddbe78a5f67118c1f7af2e02c8a22bcaf9e850/index.js#L99-L126
            const rcConfig = yarn ? lockfile.parse(data) : ini.parse(data);
            rcOptions = normalizeOptions(rcConfig, location, rcOptions);
        }
    }
    const envVariablesOptions = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (!value) {
            continue;
        }
        let normalizedName = key.toLowerCase();
        if (normalizedName.startsWith('npm_config_')) {
            normalizedName = normalizedName.substring(11);
        }
        else if (yarn && normalizedName.startsWith('yarn_')) {
            normalizedName = normalizedName.substring(5);
        }
        else {
            continue;
        }
        if (normalizedName === 'registry' &&
            rcOptions['registry'] &&
            value === 'https://registry.yarnpkg.com' &&
            process.env['npm_config_user_agent']?.includes('yarn')) {
            // When running `ng update` using yarn (`yarn ng update`), yarn will set the `npm_config_registry` env variable to `https://registry.yarnpkg.com`
            // even when an RC file is present with a different repository.
            // This causes the registry specified in the RC to always be overridden with the below logic.
            continue;
        }
        normalizedName = normalizedName.replace(/(?!^)_/g, '-'); // don't replace _ at the start of the key.s
        envVariablesOptions[normalizedName] = value;
    }
    return normalizeOptions(envVariablesOptions, undefined, rcOptions);
}
function normalizeOptions(rawOptions, location = process.cwd(), existingNormalizedOptions = {}) {
    const options = { ...existingNormalizedOptions };
    for (const [key, value] of Object.entries(rawOptions)) {
        let substitutedValue = value;
        // Substitute any environment variable references.
        if (typeof value === 'string') {
            substitutedValue = value.replace(/\$\{([^}]+)\}/, (_, name) => process.env[name] || '');
        }
        switch (key) {
            // Unless auth options are scope with the registry url it appears that npm-registry-fetch ignores them,
            // even though they are documented.
            // https://github.com/npm/npm-registry-fetch/blob/8954f61d8d703e5eb7f3d93c9b40488f8b1b62ac/README.md
            // https://github.com/npm/npm-registry-fetch/blob/8954f61d8d703e5eb7f3d93c9b40488f8b1b62ac/auth.js#L45-L91
            case '_authToken':
            case 'token':
            case 'username':
            case 'password':
            case '_auth':
            case 'auth':
                options['forceAuth'] ?? (options['forceAuth'] = {});
                options['forceAuth'][key] = substitutedValue;
                break;
            case 'noproxy':
            case 'no-proxy':
                options['noProxy'] = substitutedValue;
                break;
            case 'maxsockets':
                options['maxSockets'] = substitutedValue;
                break;
            case 'https-proxy':
            case 'proxy':
                options['proxy'] = substitutedValue;
                break;
            case 'strict-ssl':
                options['strictSSL'] = substitutedValue;
                break;
            case 'local-address':
                options['localAddress'] = substitutedValue;
                break;
            case 'cafile':
                if (typeof substitutedValue === 'string') {
                    const cafile = path.resolve(path.dirname(location), substitutedValue);
                    try {
                        options['ca'] = (0, fs_1.readFileSync)(cafile, 'utf8').replace(/\r?\n/g, '\n');
                    }
                    catch { }
                }
                break;
            case 'before':
                options['before'] =
                    typeof substitutedValue === 'string' ? new Date(substitutedValue) : substitutedValue;
                break;
            default:
                options[key] = substitutedValue;
                break;
        }
    }
    return options;
}
async function fetchPackageMetadata(name, logger, options) {
    const { usingYarn, verbose, registry } = {
        registry: undefined,
        usingYarn: false,
        verbose: false,
        ...options,
    };
    ensureNpmrc(logger, usingYarn, verbose);
    const { packument } = await Promise.resolve().then(() => __importStar(require('pacote')));
    const response = await packument(name, {
        fullMetadata: true,
        ...npmrc,
        ...(registry ? { registry } : {}),
    });
    // Normalize the response
    const metadata = {
        ...response,
        tags: {},
    };
    if (response['dist-tags']) {
        for (const [tag, version] of Object.entries(response['dist-tags'])) {
            const manifest = metadata.versions[version];
            if (manifest) {
                metadata.tags[tag] = manifest;
            }
            else if (verbose) {
                logger.warn(`Package ${metadata.name} has invalid version metadata for '${tag}'.`);
            }
        }
    }
    return metadata;
}
exports.fetchPackageMetadata = fetchPackageMetadata;
async function fetchPackageManifest(name, logger, options = {}) {
    const { usingYarn = false, verbose = false, registry } = options;
    ensureNpmrc(logger, usingYarn, verbose);
    const { manifest } = await Promise.resolve().then(() => __importStar(require('pacote')));
    const response = await manifest(name, {
        fullMetadata: true,
        ...npmrc,
        ...(registry ? { registry } : {}),
    });
    return response;
}
exports.fetchPackageManifest = fetchPackageManifest;
async function getNpmPackageJson(packageName, logger, options = {}) {
    const cachedResponse = npmPackageJsonCache.get(packageName);
    if (cachedResponse) {
        return cachedResponse;
    }
    const { usingYarn = false, verbose = false, registry } = options;
    ensureNpmrc(logger, usingYarn, verbose);
    const { packument } = await Promise.resolve().then(() => __importStar(require('pacote')));
    const response = packument(packageName, {
        fullMetadata: true,
        ...npmrc,
        ...(registry ? { registry } : {}),
    });
    npmPackageJsonCache.set(packageName, response);
    return response;
}
exports.getNpmPackageJson = getNpmPackageJson;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2FnZS1tZXRhZGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXIvY2xpL3NyYy91dGlsaXRpZXMvcGFja2FnZS1tZXRhZGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdILDREQUE4QztBQUM5QywyQkFBOEM7QUFDOUMseUNBQTJCO0FBQzNCLDJCQUE2QjtBQUU3QiwyQ0FBNkI7QUEyQzdCLElBQUksS0FBNEIsQ0FBQztBQUNqQyxNQUFNLG1CQUFtQixHQUFHLElBQUksR0FBRyxFQUFzRCxDQUFDO0FBRTFGLFNBQVMsV0FBVyxDQUFDLE1BQXlCLEVBQUUsU0FBa0IsRUFBRSxPQUFnQjtJQUNsRixJQUFJLENBQUMsS0FBSyxFQUFFO1FBQ1YsSUFBSTtZQUNGLEtBQUssR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM3QztRQUFDLE1BQU0sR0FBRTtRQUVWLElBQUksU0FBUyxFQUFFO1lBQ2IsSUFBSTtnQkFDRixLQUFLLEdBQUcsRUFBRSxHQUFHLEtBQUssRUFBRSxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUM7YUFDN0Q7WUFBQyxNQUFNLEdBQUU7U0FDWDtLQUNGO0FBQ0gsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUNsQixNQUF5QixFQUN6QixJQUFJLEdBQUcsS0FBSyxFQUNaLGNBQWMsR0FBRyxLQUFLO0lBRXRCLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUMxQixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0lBQy9DLE1BQU0sV0FBVyxHQUFHLEdBQUcsR0FBRyxZQUFZLENBQUM7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LENBQUMsRUFBRSxDQUFDO0tBQ2xDLENBQUMsQ0FBQztJQUVILE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUFwQkQsb0RBb0JDO0FBRU0sS0FBSyxVQUFVLGlCQUFpQixDQUNyQyxXQUFtQixFQUNuQixNQUF5QixFQUN6QixVQUlJLEVBQUU7SUFFTixNQUFNLGNBQWMsR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDNUQsSUFBSSxjQUFjLEVBQUU7UUFDbEIsT0FBTyxjQUFjLENBQUM7S0FDdkI7SUFFRCxNQUFNLEVBQUUsU0FBUyxHQUFHLEtBQUssRUFBRSxPQUFPLEdBQUcsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQztJQUNqRSxXQUFXLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN4QyxNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsd0RBQWEsUUFBUSxHQUFDLENBQUM7SUFDN0MsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLFdBQVcsRUFBRTtRQUN0QyxZQUFZLEVBQUUsSUFBSTtRQUNsQixHQUFHLEtBQUs7UUFDUixHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7S0FDbEMsQ0FBQyxDQUFDO0lBRUgsbUJBQW1CLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUUvQyxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDO0FBMUJELDhDQTBCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBsb2dnaW5nIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0ICogYXMgbG9ja2ZpbGUgZnJvbSAnQHlhcm5wa2cvbG9ja2ZpbGUnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgaW5pIGZyb20gJ2luaSc7XG5pbXBvcnQgeyBob21lZGlyIH0gZnJvbSAnb3MnO1xuaW1wb3J0IHR5cGUgeyBNYW5pZmVzdCwgUGFja3VtZW50IH0gZnJvbSAncGFjb3RlJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFja2FnZU1ldGFkYXRhIGV4dGVuZHMgUGFja3VtZW50LCBOZ1BhY2thZ2VNYW5pZmVzdFByb3BlcnRpZXMge1xuICB0YWdzOiBSZWNvcmQ8c3RyaW5nLCBQYWNrYWdlTWFuaWZlc3Q+O1xuICB2ZXJzaW9uczogUmVjb3JkPHN0cmluZywgUGFja2FnZU1hbmlmZXN0Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBOcG1SZXBvc2l0b3J5UGFja2FnZUpzb24gZXh0ZW5kcyBQYWNrYWdlTWV0YWRhdGEge1xuICByZXF1ZXN0ZWROYW1lPzogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBOZ0FkZFNhdmVEZXBlbmRlbmN5ID0gJ2RlcGVuZGVuY2llcycgfCAnZGV2RGVwZW5kZW5jaWVzJyB8IGJvb2xlYW47XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFja2FnZUlkZW50aWZpZXIge1xuICB0eXBlOiAnZ2l0JyB8ICd0YWcnIHwgJ3ZlcnNpb24nIHwgJ3JhbmdlJyB8ICdmaWxlJyB8ICdkaXJlY3RvcnknIHwgJ3JlbW90ZSc7XG4gIG5hbWU6IHN0cmluZztcbiAgc2NvcGU6IHN0cmluZyB8IG51bGw7XG4gIHJlZ2lzdHJ5OiBib29sZWFuO1xuICByYXc6IHN0cmluZztcbiAgZmV0Y2hTcGVjOiBzdHJpbmc7XG4gIHJhd1NwZWM6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBOZ1BhY2thZ2VNYW5pZmVzdFByb3BlcnRpZXMge1xuICAnbmctYWRkJz86IHtcbiAgICBzYXZlPzogTmdBZGRTYXZlRGVwZW5kZW5jeTtcbiAgfTtcbiAgJ25nLXVwZGF0ZSc/OiB7XG4gICAgbWlncmF0aW9ucz86IHN0cmluZztcbiAgICBwYWNrYWdlR3JvdXA/OiBzdHJpbmdbXSB8IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgcGFja2FnZUdyb3VwTmFtZT86IHN0cmluZztcbiAgICByZXF1aXJlbWVudHM/OiBzdHJpbmdbXSB8IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFja2FnZU1hbmlmZXN0IGV4dGVuZHMgTWFuaWZlc3QsIE5nUGFja2FnZU1hbmlmZXN0UHJvcGVydGllcyB7XG4gIGRlcHJlY2F0ZWQ/OiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgUGFja2FnZU1hbmFnZXJPcHRpb25zIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICBmb3JjZUF1dGg/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbn1cblxubGV0IG5wbXJjOiBQYWNrYWdlTWFuYWdlck9wdGlvbnM7XG5jb25zdCBucG1QYWNrYWdlSnNvbkNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFByb21pc2U8UGFydGlhbDxOcG1SZXBvc2l0b3J5UGFja2FnZUpzb24+Pj4oKTtcblxuZnVuY3Rpb24gZW5zdXJlTnBtcmMobG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSwgdXNpbmdZYXJuOiBib29sZWFuLCB2ZXJib3NlOiBib29sZWFuKTogdm9pZCB7XG4gIGlmICghbnBtcmMpIHtcbiAgICB0cnkge1xuICAgICAgbnBtcmMgPSByZWFkT3B0aW9ucyhsb2dnZXIsIGZhbHNlLCB2ZXJib3NlKTtcbiAgICB9IGNhdGNoIHt9XG5cbiAgICBpZiAodXNpbmdZYXJuKSB7XG4gICAgICB0cnkge1xuICAgICAgICBucG1yYyA9IHsgLi4ubnBtcmMsIC4uLnJlYWRPcHRpb25zKGxvZ2dlciwgdHJ1ZSwgdmVyYm9zZSkgfTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZE9wdGlvbnMoXG4gIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGksXG4gIHlhcm4gPSBmYWxzZSxcbiAgc2hvd1BvdGVudGlhbHMgPSBmYWxzZSxcbik6IFBhY2thZ2VNYW5hZ2VyT3B0aW9ucyB7XG4gIGNvbnN0IGN3ZCA9IHByb2Nlc3MuY3dkKCk7XG4gIGNvbnN0IGJhc2VGaWxlbmFtZSA9IHlhcm4gPyAneWFybnJjJyA6ICducG1yYyc7XG4gIGNvbnN0IGRvdEZpbGVuYW1lID0gJy4nICsgYmFzZUZpbGVuYW1lO1xuXG4gIGxldCBnbG9iYWxQcmVmaXg6IHN0cmluZztcbiAgaWYgKHByb2Nlc3MuZW52LlBSRUZJWCkge1xuICAgIGdsb2JhbFByZWZpeCA9IHByb2Nlc3MuZW52LlBSRUZJWDtcbiAgfSBlbHNlIHtcbiAgICBnbG9iYWxQcmVmaXggPSBwYXRoLmRpcm5hbWUocHJvY2Vzcy5leGVjUGF0aCk7XG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICd3aW4zMicpIHtcbiAgICAgIGdsb2JhbFByZWZpeCA9IHBhdGguZGlybmFtZShnbG9iYWxQcmVmaXgpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGRlZmF1bHRDb25maWdMb2NhdGlvbnMgPSBbXG4gICAgKCF5YXJuICYmIHByb2Nlc3MuZW52Lk5QTV9DT05GSUdfR0xPQkFMQ09ORklHKSB8fCBwYXRoLmpvaW4oZ2xvYmFsUHJlZml4LCAnZXRjJywgYmFzZUZpbGVuYW1lKSxcbiAgICAoIXlhcm4gJiYgcHJvY2Vzcy5lbnYuTlBNX0NPTkZJR19VU0VSQ09ORklHKSB8fCBwYXRoLmpvaW4oaG9tZWRpcigpLCBkb3RGaWxlbmFtZSksXG4gIF07XG5cbiAgY29uc3QgcHJvamVjdENvbmZpZ0xvY2F0aW9uczogc3RyaW5nW10gPSBbcGF0aC5qb2luKGN3ZCwgZG90RmlsZW5hbWUpXTtcbiAgaWYgKHlhcm4pIHtcbiAgICBjb25zdCByb290ID0gcGF0aC5wYXJzZShjd2QpLnJvb3Q7XG4gICAgZm9yIChsZXQgY3VyRGlyID0gcGF0aC5kaXJuYW1lKGN3ZCk7IGN1ckRpciAmJiBjdXJEaXIgIT09IHJvb3Q7IGN1ckRpciA9IHBhdGguZGlybmFtZShjdXJEaXIpKSB7XG4gICAgICBwcm9qZWN0Q29uZmlnTG9jYXRpb25zLnVuc2hpZnQocGF0aC5qb2luKGN1ckRpciwgZG90RmlsZW5hbWUpKTtcbiAgICB9XG4gIH1cblxuICBpZiAoc2hvd1BvdGVudGlhbHMpIHtcbiAgICBsb2dnZXIuaW5mbyhgTG9jYXRpbmcgcG90ZW50aWFsICR7YmFzZUZpbGVuYW1lfSBmaWxlczpgKTtcbiAgfVxuXG4gIGxldCByY09wdGlvbnM6IFBhY2thZ2VNYW5hZ2VyT3B0aW9ucyA9IHt9O1xuICBmb3IgKGNvbnN0IGxvY2F0aW9uIG9mIFsuLi5kZWZhdWx0Q29uZmlnTG9jYXRpb25zLCAuLi5wcm9qZWN0Q29uZmlnTG9jYXRpb25zXSkge1xuICAgIGlmIChleGlzdHNTeW5jKGxvY2F0aW9uKSkge1xuICAgICAgaWYgKHNob3dQb3RlbnRpYWxzKSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKGBUcnlpbmcgJyR7bG9jYXRpb259Jy4uLmZvdW5kLmApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkYXRhID0gcmVhZEZpbGVTeW5jKGxvY2F0aW9uLCAndXRmOCcpO1xuICAgICAgLy8gTm9ybWFsaXplIFJDIG9wdGlvbnMgdGhhdCBhcmUgbmVlZGVkIGJ5ICducG0tcmVnaXN0cnktZmV0Y2gnLlxuICAgICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbnBtL25wbS1yZWdpc3RyeS1mZXRjaC9ibG9iL2ViZGRiZTc4YTVmNjcxMThjMWY3YWYyZTAyYzhhMjJiY2FmOWU4NTAvaW5kZXguanMjTDk5LUwxMjZcbiAgICAgIGNvbnN0IHJjQ29uZmlnOiBQYWNrYWdlTWFuYWdlck9wdGlvbnMgPSB5YXJuID8gbG9ja2ZpbGUucGFyc2UoZGF0YSkgOiBpbmkucGFyc2UoZGF0YSk7XG5cbiAgICAgIHJjT3B0aW9ucyA9IG5vcm1hbGl6ZU9wdGlvbnMocmNDb25maWcsIGxvY2F0aW9uLCByY09wdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGVudlZhcmlhYmxlc09wdGlvbnM6IFBhY2thZ2VNYW5hZ2VyT3B0aW9ucyA9IHt9O1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhwcm9jZXNzLmVudikpIHtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBsZXQgbm9ybWFsaXplZE5hbWUgPSBrZXkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAobm9ybWFsaXplZE5hbWUuc3RhcnRzV2l0aCgnbnBtX2NvbmZpZ18nKSkge1xuICAgICAgbm9ybWFsaXplZE5hbWUgPSBub3JtYWxpemVkTmFtZS5zdWJzdHJpbmcoMTEpO1xuICAgIH0gZWxzZSBpZiAoeWFybiAmJiBub3JtYWxpemVkTmFtZS5zdGFydHNXaXRoKCd5YXJuXycpKSB7XG4gICAgICBub3JtYWxpemVkTmFtZSA9IG5vcm1hbGl6ZWROYW1lLnN1YnN0cmluZyg1KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgbm9ybWFsaXplZE5hbWUgPT09ICdyZWdpc3RyeScgJiZcbiAgICAgIHJjT3B0aW9uc1sncmVnaXN0cnknXSAmJlxuICAgICAgdmFsdWUgPT09ICdodHRwczovL3JlZ2lzdHJ5Lnlhcm5wa2cuY29tJyAmJlxuICAgICAgcHJvY2Vzcy5lbnZbJ25wbV9jb25maWdfdXNlcl9hZ2VudCddPy5pbmNsdWRlcygneWFybicpXG4gICAgKSB7XG4gICAgICAvLyBXaGVuIHJ1bm5pbmcgYG5nIHVwZGF0ZWAgdXNpbmcgeWFybiAoYHlhcm4gbmcgdXBkYXRlYCksIHlhcm4gd2lsbCBzZXQgdGhlIGBucG1fY29uZmlnX3JlZ2lzdHJ5YCBlbnYgdmFyaWFibGUgdG8gYGh0dHBzOi8vcmVnaXN0cnkueWFybnBrZy5jb21gXG4gICAgICAvLyBldmVuIHdoZW4gYW4gUkMgZmlsZSBpcyBwcmVzZW50IHdpdGggYSBkaWZmZXJlbnQgcmVwb3NpdG9yeS5cbiAgICAgIC8vIFRoaXMgY2F1c2VzIHRoZSByZWdpc3RyeSBzcGVjaWZpZWQgaW4gdGhlIFJDIHRvIGFsd2F5cyBiZSBvdmVycmlkZGVuIHdpdGggdGhlIGJlbG93IGxvZ2ljLlxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgbm9ybWFsaXplZE5hbWUgPSBub3JtYWxpemVkTmFtZS5yZXBsYWNlKC8oPyFeKV8vZywgJy0nKTsgLy8gZG9uJ3QgcmVwbGFjZSBfIGF0IHRoZSBzdGFydCBvZiB0aGUga2V5LnNcbiAgICBlbnZWYXJpYWJsZXNPcHRpb25zW25vcm1hbGl6ZWROYW1lXSA9IHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIG5vcm1hbGl6ZU9wdGlvbnMoZW52VmFyaWFibGVzT3B0aW9ucywgdW5kZWZpbmVkLCByY09wdGlvbnMpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVPcHRpb25zKFxuICByYXdPcHRpb25zOiBQYWNrYWdlTWFuYWdlck9wdGlvbnMsXG4gIGxvY2F0aW9uID0gcHJvY2Vzcy5jd2QoKSxcbiAgZXhpc3RpbmdOb3JtYWxpemVkT3B0aW9uczogUGFja2FnZU1hbmFnZXJPcHRpb25zID0ge30sXG4pOiBQYWNrYWdlTWFuYWdlck9wdGlvbnMge1xuICBjb25zdCBvcHRpb25zID0geyAuLi5leGlzdGluZ05vcm1hbGl6ZWRPcHRpb25zIH07XG5cbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocmF3T3B0aW9ucykpIHtcbiAgICBsZXQgc3Vic3RpdHV0ZWRWYWx1ZSA9IHZhbHVlO1xuXG4gICAgLy8gU3Vic3RpdHV0ZSBhbnkgZW52aXJvbm1lbnQgdmFyaWFibGUgcmVmZXJlbmNlcy5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgc3Vic3RpdHV0ZWRWYWx1ZSA9IHZhbHVlLnJlcGxhY2UoL1xcJFxceyhbXn1dKylcXH0vLCAoXywgbmFtZSkgPT4gcHJvY2Vzcy5lbnZbbmFtZV0gfHwgJycpO1xuICAgIH1cblxuICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAvLyBVbmxlc3MgYXV0aCBvcHRpb25zIGFyZSBzY29wZSB3aXRoIHRoZSByZWdpc3RyeSB1cmwgaXQgYXBwZWFycyB0aGF0IG5wbS1yZWdpc3RyeS1mZXRjaCBpZ25vcmVzIHRoZW0sXG4gICAgICAvLyBldmVuIHRob3VnaCB0aGV5IGFyZSBkb2N1bWVudGVkLlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL25wbS9ucG0tcmVnaXN0cnktZmV0Y2gvYmxvYi84OTU0ZjYxZDhkNzAzZTVlYjdmM2Q5M2M5YjQwNDg4ZjhiMWI2MmFjL1JFQURNRS5tZFxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL25wbS9ucG0tcmVnaXN0cnktZmV0Y2gvYmxvYi84OTU0ZjYxZDhkNzAzZTVlYjdmM2Q5M2M5YjQwNDg4ZjhiMWI2MmFjL2F1dGguanMjTDQ1LUw5MVxuICAgICAgY2FzZSAnX2F1dGhUb2tlbic6XG4gICAgICBjYXNlICd0b2tlbic6XG4gICAgICBjYXNlICd1c2VybmFtZSc6XG4gICAgICBjYXNlICdwYXNzd29yZCc6XG4gICAgICBjYXNlICdfYXV0aCc6XG4gICAgICBjYXNlICdhdXRoJzpcbiAgICAgICAgb3B0aW9uc1snZm9yY2VBdXRoJ10gPz89IHt9O1xuICAgICAgICBvcHRpb25zWydmb3JjZUF1dGgnXVtrZXldID0gc3Vic3RpdHV0ZWRWYWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdub3Byb3h5JzpcbiAgICAgIGNhc2UgJ25vLXByb3h5JzpcbiAgICAgICAgb3B0aW9uc1snbm9Qcm94eSddID0gc3Vic3RpdHV0ZWRWYWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtYXhzb2NrZXRzJzpcbiAgICAgICAgb3B0aW9uc1snbWF4U29ja2V0cyddID0gc3Vic3RpdHV0ZWRWYWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdodHRwcy1wcm94eSc6XG4gICAgICBjYXNlICdwcm94eSc6XG4gICAgICAgIG9wdGlvbnNbJ3Byb3h5J10gPSBzdWJzdGl0dXRlZFZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3N0cmljdC1zc2wnOlxuICAgICAgICBvcHRpb25zWydzdHJpY3RTU0wnXSA9IHN1YnN0aXR1dGVkVmFsdWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbG9jYWwtYWRkcmVzcyc6XG4gICAgICAgIG9wdGlvbnNbJ2xvY2FsQWRkcmVzcyddID0gc3Vic3RpdHV0ZWRWYWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjYWZpbGUnOlxuICAgICAgICBpZiAodHlwZW9mIHN1YnN0aXR1dGVkVmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgY29uc3QgY2FmaWxlID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShsb2NhdGlvbiksIHN1YnN0aXR1dGVkVmFsdWUpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBvcHRpb25zWydjYSddID0gcmVhZEZpbGVTeW5jKGNhZmlsZSwgJ3V0ZjgnKS5yZXBsYWNlKC9cXHI/XFxuL2csICdcXG4nKTtcbiAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdiZWZvcmUnOlxuICAgICAgICBvcHRpb25zWydiZWZvcmUnXSA9XG4gICAgICAgICAgdHlwZW9mIHN1YnN0aXR1dGVkVmFsdWUgPT09ICdzdHJpbmcnID8gbmV3IERhdGUoc3Vic3RpdHV0ZWRWYWx1ZSkgOiBzdWJzdGl0dXRlZFZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIG9wdGlvbnNba2V5XSA9IHN1YnN0aXR1dGVkVmFsdWU7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvcHRpb25zO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hQYWNrYWdlTWV0YWRhdGEoXG4gIG5hbWU6IHN0cmluZyxcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbiAgb3B0aW9ucz86IHtcbiAgICByZWdpc3RyeT86IHN0cmluZztcbiAgICB1c2luZ1lhcm4/OiBib29sZWFuO1xuICAgIHZlcmJvc2U/OiBib29sZWFuO1xuICB9LFxuKTogUHJvbWlzZTxQYWNrYWdlTWV0YWRhdGE+IHtcbiAgY29uc3QgeyB1c2luZ1lhcm4sIHZlcmJvc2UsIHJlZ2lzdHJ5IH0gPSB7XG4gICAgcmVnaXN0cnk6IHVuZGVmaW5lZCxcbiAgICB1c2luZ1lhcm46IGZhbHNlLFxuICAgIHZlcmJvc2U6IGZhbHNlLFxuICAgIC4uLm9wdGlvbnMsXG4gIH07XG5cbiAgZW5zdXJlTnBtcmMobG9nZ2VyLCB1c2luZ1lhcm4sIHZlcmJvc2UpO1xuICBjb25zdCB7IHBhY2t1bWVudCB9ID0gYXdhaXQgaW1wb3J0KCdwYWNvdGUnKTtcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBwYWNrdW1lbnQobmFtZSwge1xuICAgIGZ1bGxNZXRhZGF0YTogdHJ1ZSxcbiAgICAuLi5ucG1yYyxcbiAgICAuLi4ocmVnaXN0cnkgPyB7IHJlZ2lzdHJ5IH0gOiB7fSksXG4gIH0pO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcmVzcG9uc2VcbiAgY29uc3QgbWV0YWRhdGE6IFBhY2thZ2VNZXRhZGF0YSA9IHtcbiAgICAuLi5yZXNwb25zZSxcbiAgICB0YWdzOiB7fSxcbiAgfTtcblxuICBpZiAocmVzcG9uc2VbJ2Rpc3QtdGFncyddKSB7XG4gICAgZm9yIChjb25zdCBbdGFnLCB2ZXJzaW9uXSBvZiBPYmplY3QuZW50cmllcyhyZXNwb25zZVsnZGlzdC10YWdzJ10pKSB7XG4gICAgICBjb25zdCBtYW5pZmVzdCA9IG1ldGFkYXRhLnZlcnNpb25zW3ZlcnNpb25dO1xuICAgICAgaWYgKG1hbmlmZXN0KSB7XG4gICAgICAgIG1ldGFkYXRhLnRhZ3NbdGFnXSA9IG1hbmlmZXN0O1xuICAgICAgfSBlbHNlIGlmICh2ZXJib3NlKSB7XG4gICAgICAgIGxvZ2dlci53YXJuKGBQYWNrYWdlICR7bWV0YWRhdGEubmFtZX0gaGFzIGludmFsaWQgdmVyc2lvbiBtZXRhZGF0YSBmb3IgJyR7dGFnfScuYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1ldGFkYXRhO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hQYWNrYWdlTWFuaWZlc3QoXG4gIG5hbWU6IHN0cmluZyxcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbiAgb3B0aW9uczoge1xuICAgIHJlZ2lzdHJ5Pzogc3RyaW5nO1xuICAgIHVzaW5nWWFybj86IGJvb2xlYW47XG4gICAgdmVyYm9zZT86IGJvb2xlYW47XG4gIH0gPSB7fSxcbik6IFByb21pc2U8UGFja2FnZU1hbmlmZXN0PiB7XG4gIGNvbnN0IHsgdXNpbmdZYXJuID0gZmFsc2UsIHZlcmJvc2UgPSBmYWxzZSwgcmVnaXN0cnkgfSA9IG9wdGlvbnM7XG4gIGVuc3VyZU5wbXJjKGxvZ2dlciwgdXNpbmdZYXJuLCB2ZXJib3NlKTtcbiAgY29uc3QgeyBtYW5pZmVzdCB9ID0gYXdhaXQgaW1wb3J0KCdwYWNvdGUnKTtcblxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IG1hbmlmZXN0KG5hbWUsIHtcbiAgICBmdWxsTWV0YWRhdGE6IHRydWUsXG4gICAgLi4ubnBtcmMsXG4gICAgLi4uKHJlZ2lzdHJ5ID8geyByZWdpc3RyeSB9IDoge30pLFxuICB9KTtcblxuICByZXR1cm4gcmVzcG9uc2U7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXROcG1QYWNrYWdlSnNvbihcbiAgcGFja2FnZU5hbWU6IHN0cmluZyxcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbiAgb3B0aW9uczoge1xuICAgIHJlZ2lzdHJ5Pzogc3RyaW5nO1xuICAgIHVzaW5nWWFybj86IGJvb2xlYW47XG4gICAgdmVyYm9zZT86IGJvb2xlYW47XG4gIH0gPSB7fSxcbik6IFByb21pc2U8UGFydGlhbDxOcG1SZXBvc2l0b3J5UGFja2FnZUpzb24+PiB7XG4gIGNvbnN0IGNhY2hlZFJlc3BvbnNlID0gbnBtUGFja2FnZUpzb25DYWNoZS5nZXQocGFja2FnZU5hbWUpO1xuICBpZiAoY2FjaGVkUmVzcG9uc2UpIHtcbiAgICByZXR1cm4gY2FjaGVkUmVzcG9uc2U7XG4gIH1cblxuICBjb25zdCB7IHVzaW5nWWFybiA9IGZhbHNlLCB2ZXJib3NlID0gZmFsc2UsIHJlZ2lzdHJ5IH0gPSBvcHRpb25zO1xuICBlbnN1cmVOcG1yYyhsb2dnZXIsIHVzaW5nWWFybiwgdmVyYm9zZSk7XG4gIGNvbnN0IHsgcGFja3VtZW50IH0gPSBhd2FpdCBpbXBvcnQoJ3BhY290ZScpO1xuICBjb25zdCByZXNwb25zZSA9IHBhY2t1bWVudChwYWNrYWdlTmFtZSwge1xuICAgIGZ1bGxNZXRhZGF0YTogdHJ1ZSxcbiAgICAuLi5ucG1yYyxcbiAgICAuLi4ocmVnaXN0cnkgPyB7IHJlZ2lzdHJ5IH0gOiB7fSksXG4gIH0pO1xuXG4gIG5wbVBhY2thZ2VKc29uQ2FjaGUuc2V0KHBhY2thZ2VOYW1lLCByZXNwb25zZSk7XG5cbiAgcmV0dXJuIHJlc3BvbnNlO1xufVxuIl19