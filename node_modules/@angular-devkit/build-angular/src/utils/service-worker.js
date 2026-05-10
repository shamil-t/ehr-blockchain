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
exports.augmentAppWithServiceWorkerCore = exports.augmentAppWithServiceWorkerEsbuild = exports.augmentAppWithServiceWorker = void 0;
const crypto = __importStar(require("crypto"));
const node_fs_1 = require("node:fs");
const path = __importStar(require("path"));
const error_1 = require("./error");
const load_esm_1 = require("./load-esm");
class CliFilesystem {
    constructor(fs, base) {
        this.fs = fs;
        this.base = base;
    }
    list(dir) {
        return this._recursiveList(this._resolve(dir), []);
    }
    read(file) {
        return this.fs.readFile(this._resolve(file), 'utf-8');
    }
    async hash(file) {
        return crypto
            .createHash('sha1')
            .update(await this.fs.readFile(this._resolve(file)))
            .digest('hex');
    }
    write(_file, _content) {
        throw new Error('This should never happen.');
    }
    _resolve(file) {
        return path.join(this.base, file);
    }
    async _recursiveList(dir, items) {
        const subdirectories = [];
        for (const entry of await this.fs.readdir(dir)) {
            const entryPath = path.join(dir, entry);
            const stats = await this.fs.stat(entryPath);
            if (stats.isFile()) {
                // Uses posix paths since the service worker expects URLs
                items.push('/' + path.relative(this.base, entryPath).replace(/\\/g, '/'));
            }
            else if (stats.isDirectory()) {
                subdirectories.push(entryPath);
            }
        }
        for (const subdirectory of subdirectories) {
            await this._recursiveList(subdirectory, items);
        }
        return items;
    }
}
class ResultFilesystem {
    constructor(outputFiles, assetFiles) {
        this.fileReaders = new Map();
        for (const file of outputFiles) {
            this.fileReaders.set('/' + file.path.replace(/\\/g, '/'), async () => file.contents);
        }
        for (const file of assetFiles) {
            this.fileReaders.set('/' + file.destination.replace(/\\/g, '/'), () => node_fs_1.promises.readFile(file.source));
        }
    }
    async list(dir) {
        if (dir !== '/') {
            throw new Error('Serviceworker manifest generator should only list files from root.');
        }
        return [...this.fileReaders.keys()];
    }
    async read(file) {
        const reader = this.fileReaders.get(file);
        if (reader === undefined) {
            throw new Error('File does not exist.');
        }
        const contents = await reader();
        return Buffer.from(contents.buffer, contents.byteOffset, contents.byteLength).toString('utf-8');
    }
    async hash(file) {
        const reader = this.fileReaders.get(file);
        if (reader === undefined) {
            throw new Error('File does not exist.');
        }
        return crypto
            .createHash('sha1')
            .update(await reader())
            .digest('hex');
    }
    write() {
        throw new Error('Serviceworker manifest generator should not attempted to write.');
    }
}
async function augmentAppWithServiceWorker(appRoot, workspaceRoot, outputPath, baseHref, ngswConfigPath, inputputFileSystem = node_fs_1.promises, outputFileSystem = node_fs_1.promises) {
    // Determine the configuration file path
    const configPath = ngswConfigPath
        ? path.join(workspaceRoot, ngswConfigPath)
        : path.join(appRoot, 'ngsw-config.json');
    // Read the configuration file
    let config;
    try {
        const configurationData = await inputputFileSystem.readFile(configPath, 'utf-8');
        config = JSON.parse(configurationData);
    }
    catch (error) {
        (0, error_1.assertIsError)(error);
        if (error.code === 'ENOENT') {
            throw new Error('Error: Expected to find an ngsw-config.json configuration file' +
                ` in the ${appRoot} folder. Either provide one or` +
                ' disable Service Worker in the angular.json configuration file.');
        }
        else {
            throw error;
        }
    }
    const result = await augmentAppWithServiceWorkerCore(config, new CliFilesystem(outputFileSystem, outputPath), baseHref);
    const copy = async (src, dest) => {
        const resolvedDest = path.join(outputPath, dest);
        return inputputFileSystem === outputFileSystem
            ? // Native FS (Builder).
                inputputFileSystem.copyFile(src, resolvedDest, node_fs_1.constants.COPYFILE_FICLONE)
            : // memfs (Webpack): Read the file from the input FS (disk) and write it to the output FS (memory).
                outputFileSystem.writeFile(resolvedDest, await inputputFileSystem.readFile(src));
    };
    await outputFileSystem.writeFile(path.join(outputPath, 'ngsw.json'), result.manifest);
    for (const { source, destination } of result.assetFiles) {
        await copy(source, destination);
    }
}
exports.augmentAppWithServiceWorker = augmentAppWithServiceWorker;
// This is currently used by the esbuild-based builder
async function augmentAppWithServiceWorkerEsbuild(workspaceRoot, configPath, baseHref, outputFiles, assetFiles) {
    // Read the configuration file
    let config;
    try {
        const configurationData = await node_fs_1.promises.readFile(configPath, 'utf-8');
        config = JSON.parse(configurationData);
    }
    catch (error) {
        (0, error_1.assertIsError)(error);
        if (error.code === 'ENOENT') {
            // TODO: Generate an error object that can be consumed by the esbuild-based builder
            const message = `Service worker configuration file "${path.relative(workspaceRoot, configPath)}" could not be found.`;
            throw new Error(message);
        }
        else {
            throw error;
        }
    }
    return augmentAppWithServiceWorkerCore(config, new ResultFilesystem(outputFiles, assetFiles), baseHref);
}
exports.augmentAppWithServiceWorkerEsbuild = augmentAppWithServiceWorkerEsbuild;
async function augmentAppWithServiceWorkerCore(config, serviceWorkerFilesystem, baseHref) {
    // Load ESM `@angular/service-worker/config` using the TypeScript dynamic import workaround.
    // Once TypeScript provides support for keeping the dynamic import this workaround can be
    // changed to a direct dynamic import.
    const GeneratorConstructor = (await (0, load_esm_1.loadEsmModule)('@angular/service-worker/config')).Generator;
    // Generate the manifest
    const generator = new GeneratorConstructor(serviceWorkerFilesystem, baseHref);
    const output = await generator.process(config);
    // Write the manifest
    const manifest = JSON.stringify(output, null, 2);
    // Find the service worker package
    const workerPath = require.resolve('@angular/service-worker/ngsw-worker.js');
    const result = {
        manifest,
        // Main worker code
        assetFiles: [{ source: workerPath, destination: 'ngsw-worker.js' }],
    };
    // If present, write the safety worker code
    const safetyPath = path.join(path.dirname(workerPath), 'safety-worker.js');
    if ((0, node_fs_1.existsSync)(safetyPath)) {
        result.assetFiles.push({ source: safetyPath, destination: 'worker-basic.min.js' });
        result.assetFiles.push({ source: safetyPath, destination: 'safety-worker.js' });
    }
    return result;
}
exports.augmentAppWithServiceWorkerCore = augmentAppWithServiceWorkerCore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS13b3JrZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9zZXJ2aWNlLXdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdILCtDQUFpQztBQUVqQyxxQ0FBdUY7QUFDdkYsMkNBQTZCO0FBQzdCLG1DQUF3QztBQUN4Qyx5Q0FBMkM7QUFFM0MsTUFBTSxhQUFhO0lBQ2pCLFlBQW9CLEVBQXFCLEVBQVUsSUFBWTtRQUEzQyxPQUFFLEdBQUYsRUFBRSxDQUFtQjtRQUFVLFNBQUksR0FBSixJQUFJLENBQVE7SUFBRyxDQUFDO0lBRW5FLElBQUksQ0FBQyxHQUFXO1FBQ2QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFZO1FBQ2YsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQVk7UUFDckIsT0FBTyxNQUFNO2FBQ1YsVUFBVSxDQUFDLE1BQU0sQ0FBQzthQUNsQixNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDbkQsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFRCxLQUFLLENBQUMsS0FBYSxFQUFFLFFBQWdCO1FBQ25DLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMs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QUMsQ0FBQztJQUM5RSxNQUFNLE1BQU0sR0FBRyxNQUFNLFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFL0MscUJBQXFCO0lBQ3JCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVqRCxrQ0FBa0M7SUFDbEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO0lBRTdFLE1BQU0sTUFBTSxHQUFHO1FBQ2IsUUFBUTtRQUNSLG1CQUFtQjtRQUNuQixVQUFVLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLENBQUM7S0FDcEUsQ0FBQztJQUVGLDJDQUEyQztJQUMzQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUMzRSxJQUFJLElBQUEsb0JBQVUsRUFBQyxVQUFVLENBQUMsRUFBRTtRQUMxQixNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQztRQUNuRixNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQztLQUNqRjtJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUF0Q0QsMEVBc0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgQ29uZmlnLCBGaWxlc3lzdGVtIH0gZnJvbSAnQGFuZ3VsYXIvc2VydmljZS13b3JrZXIvY29uZmlnJztcbmltcG9ydCAqIGFzIGNyeXB0byBmcm9tICdjcnlwdG8nO1xuaW1wb3J0IHR5cGUgeyBPdXRwdXRGaWxlIH0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCBjb25zdGFudHMgYXMgZnNDb25zdGFudHMsIHByb21pc2VzIGFzIGZzUHJvbWlzZXMgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBhc3NlcnRJc0Vycm9yIH0gZnJvbSAnLi9lcnJvcic7XG5pbXBvcnQgeyBsb2FkRXNtTW9kdWxlIH0gZnJvbSAnLi9sb2FkLWVzbSc7XG5cbmNsYXNzIENsaUZpbGVzeXN0ZW0gaW1wbGVtZW50cyBGaWxlc3lzdGVtIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBmczogdHlwZW9mIGZzUHJvbWlzZXMsIHByaXZhdGUgYmFzZTogc3RyaW5nKSB7fVxuXG4gIGxpc3QoZGlyOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIHRoaXMuX3JlY3Vyc2l2ZUxpc3QodGhpcy5fcmVzb2x2ZShkaXIpLCBbXSk7XG4gIH1cblxuICByZWFkKGZpbGU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZnMucmVhZEZpbGUodGhpcy5fcmVzb2x2ZShmaWxlKSwgJ3V0Zi04Jyk7XG4gIH1cblxuICBhc3luYyBoYXNoKGZpbGU6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGNyeXB0b1xuICAgICAgLmNyZWF0ZUhhc2goJ3NoYTEnKVxuICAgICAgLnVwZGF0ZShhd2FpdCB0aGlzLmZzLnJlYWRGaWxlKHRoaXMuX3Jlc29sdmUoZmlsZSkpKVxuICAgICAgLmRpZ2VzdCgnaGV4Jyk7XG4gIH1cblxuICB3cml0ZShfZmlsZTogc3RyaW5nLCBfY29udGVudDogc3RyaW5nKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhpcyBzaG91bGQgbmV2ZXIgaGFwcGVuLicpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVzb2x2ZShmaWxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBwYXRoLmpvaW4odGhpcy5iYXNlLCBmaWxlKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX3JlY3Vyc2l2ZUxpc3QoZGlyOiBzdHJpbmcsIGl0ZW1zOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCBzdWJkaXJlY3RvcmllcyA9IFtdO1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgYXdhaXQgdGhpcy5mcy5yZWFkZGlyKGRpcikpIHtcbiAgICAgIGNvbnN0IGVudHJ5UGF0aCA9IHBhdGguam9pbihkaXIsIGVudHJ5KTtcbiAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgdGhpcy5mcy5zdGF0KGVudHJ5UGF0aCk7XG5cbiAgICAgIGlmIChzdGF0cy5pc0ZpbGUoKSkge1xuICAgICAgICAvLyBVc2VzIHBvc2l4IHBhdGhzIHNpbmNlIHRoZSBzZXJ2aWNlIHdvcmtlciBleHBlY3RzIFVSTHNcbiAgICAgICAgaXRlbXMucHVzaCgnLycgKyBwYXRoLnJlbGF0aXZlKHRoaXMuYmFzZSwgZW50cnlQYXRoKS5yZXBsYWNlKC9cXFxcL2csICcvJykpO1xuICAgICAgfSBlbHNlIGlmIChzdGF0cy5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgIHN1YmRpcmVjdG9yaWVzLnB1c2goZW50cnlQYXRoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHN1YmRpcmVjdG9yeSBvZiBzdWJkaXJlY3Rvcmllcykge1xuICAgICAgYXdhaXQgdGhpcy5fcmVjdXJzaXZlTGlzdChzdWJkaXJlY3RvcnksIGl0ZW1zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlbXM7XG4gIH1cbn1cblxuY2xhc3MgUmVzdWx0RmlsZXN5c3RlbSBpbXBsZW1lbnRzIEZpbGVzeXN0ZW0ge1xuICBwcml2YXRlIHJlYWRvbmx5IGZpbGVSZWFkZXJzID0gbmV3IE1hcDxzdHJpbmcsICgpID0+IFByb21pc2U8VWludDhBcnJheT4+KCk7XG5cbiAgY29uc3RydWN0b3Iob3V0cHV0RmlsZXM6IE91dHB1dEZpbGVbXSwgYXNzZXRGaWxlczogeyBzb3VyY2U6IHN0cmluZzsgZGVzdGluYXRpb246IHN0cmluZyB9W10pIHtcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2Ygb3V0cHV0RmlsZXMpIHtcbiAgICAgIHRoaXMuZmlsZVJlYWRlcnMuc2V0KCcvJyArIGZpbGUucGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyksIGFzeW5jICgpID0+IGZpbGUuY29udGVudHMpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgYXNzZXRGaWxlcykge1xuICAgICAgdGhpcy5maWxlUmVhZGVycy5zZXQoJy8nICsgZmlsZS5kZXN0aW5hdGlvbi5yZXBsYWNlKC9cXFxcL2csICcvJyksICgpID0+XG4gICAgICAgIGZzUHJvbWlzZXMucmVhZEZpbGUoZmlsZS5zb3VyY2UpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBsaXN0KGRpcjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmIChkaXIgIT09ICcvJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTZXJ2aWNld29ya2VyIG1hbmlmZXN0IGdlbmVyYXRvciBzaG91bGQgb25seSBsaXN0IGZpbGVzIGZyb20gcm9vdC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gWy4uLnRoaXMuZmlsZVJlYWRlcnMua2V5cygpXTtcbiAgfVxuXG4gIGFzeW5jIHJlYWQoZmlsZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZWFkZXIgPSB0aGlzLmZpbGVSZWFkZXJzLmdldChmaWxlKTtcbiAgICBpZiAocmVhZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmlsZSBkb2VzIG5vdCBleGlzdC4nKTtcbiAgICB9XG4gICAgY29uc3QgY29udGVudHMgPSBhd2FpdCByZWFkZXIoKTtcblxuICAgIHJldHVybiBCdWZmZXIuZnJvbShjb250ZW50cy5idWZmZXIsIGNvbnRlbnRzLmJ5dGVPZmZzZXQsIGNvbnRlbnRzLmJ5dGVMZW5ndGgpLnRvU3RyaW5nKCd1dGYtOCcpO1xuICB9XG5cbiAgYXN5bmMgaGFzaChmaWxlOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlYWRlciA9IHRoaXMuZmlsZVJlYWRlcnMuZ2V0KGZpbGUpO1xuICAgIGlmIChyZWFkZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGaWxlIGRvZXMgbm90IGV4aXN0LicpO1xuICAgIH1cblxuICAgIHJldHVybiBjcnlwdG9cbiAgICAgIC5jcmVhdGVIYXNoKCdzaGExJylcbiAgICAgIC51cGRhdGUoYXdhaXQgcmVhZGVyKCkpXG4gICAgICAuZGlnZXN0KCdoZXgnKTtcbiAgfVxuXG4gIHdyaXRlKCk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlcnZpY2V3b3JrZXIgbWFuaWZlc3QgZ2VuZXJhdG9yIHNob3VsZCBub3QgYXR0ZW1wdGVkIHRvIHdyaXRlLicpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhdWdtZW50QXBwV2l0aFNlcnZpY2VXb3JrZXIoXG4gIGFwcFJvb3Q6IHN0cmluZyxcbiAgd29ya3NwYWNlUm9vdDogc3RyaW5nLFxuICBvdXRwdXRQYXRoOiBzdHJpbmcsXG4gIGJhc2VIcmVmOiBzdHJpbmcsXG4gIG5nc3dDb25maWdQYXRoPzogc3RyaW5nLFxuICBpbnB1dHB1dEZpbGVTeXN0ZW0gPSBmc1Byb21pc2VzLFxuICBvdXRwdXRGaWxlU3lzdGVtID0gZnNQcm9taXNlcyxcbik6IFByb21pc2U8dm9pZD4ge1xuICAvLyBEZXRlcm1pbmUgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZSBwYXRoXG4gIGNvbnN0IGNvbmZpZ1BhdGggPSBuZ3N3Q29uZmlnUGF0aFxuICAgID8gcGF0aC5qb2luKHdvcmtzcGFjZVJvb3QsIG5nc3dDb25maWdQYXRoKVxuICAgIDogcGF0aC5qb2luKGFwcFJvb3QsICduZ3N3LWNvbmZpZy5qc29uJyk7XG5cbiAgLy8gUmVhZCB0aGUgY29uZmlndXJhdGlvbiBmaWxlXG4gIGxldCBjb25maWc6IENvbmZpZyB8IHVuZGVmaW5lZDtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWd1cmF0aW9uRGF0YSA9IGF3YWl0IGlucHV0cHV0RmlsZVN5c3RlbS5yZWFkRmlsZShjb25maWdQYXRoLCAndXRmLTgnKTtcbiAgICBjb25maWcgPSBKU09OLnBhcnNlKGNvbmZpZ3VyYXRpb25EYXRhKSBhcyBDb25maWc7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgYXNzZXJ0SXNFcnJvcihlcnJvcik7XG4gICAgaWYgKGVycm9yLmNvZGUgPT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdFcnJvcjogRXhwZWN0ZWQgdG8gZmluZCBhbiBuZ3N3LWNvbmZpZy5qc29uIGNvbmZpZ3VyYXRpb24gZmlsZScgK1xuICAgICAgICAgIGAgaW4gdGhlICR7YXBwUm9vdH0gZm9sZGVyLiBFaXRoZXIgcHJvdmlkZSBvbmUgb3JgICtcbiAgICAgICAgICAnIGRpc2FibGUgU2VydmljZSBXb3JrZXIgaW4gdGhlIGFuZ3VsYXIuanNvbiBjb25maWd1cmF0aW9uIGZpbGUuJyxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGF1Z21lbnRBcHBXaXRoU2VydmljZVdvcmtlckNvcmUoXG4gICAgY29uZmlnLFxuICAgIG5ldyBDbGlGaWxlc3lzdGVtKG91dHB1dEZpbGVTeXN0ZW0sIG91dHB1dFBhdGgpLFxuICAgIGJhc2VIcmVmLFxuICApO1xuXG4gIGNvbnN0IGNvcHkgPSBhc3luYyAoc3JjOiBzdHJpbmcsIGRlc3Q6IHN0cmluZyk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGNvbnN0IHJlc29sdmVkRGVzdCA9IHBhdGguam9pbihvdXRwdXRQYXRoLCBkZXN0KTtcblxuICAgIHJldHVybiBpbnB1dHB1dEZpbGVTeXN0ZW0gPT09IG91dHB1dEZpbGVTeXN0ZW1cbiAgICAgID8gLy8gTmF0aXZlIEZTIChCdWlsZGVyKS5cbiAgICAgICAgaW5wdXRwdXRGaWxlU3lzdGVtLmNvcHlGaWxlKHNyYywgcmVzb2x2ZWREZXN0LCBmc0NvbnN0YW50cy5DT1BZRklMRV9GSUNMT05FKVxuICAgICAgOiAvLyBtZW1mcyAoV2VicGFjayk6IFJlYWQgdGhlIGZpbGUgZnJvbSB0aGUgaW5wdXQgRlMgKGRpc2spIGFuZCB3cml0ZSBpdCB0byB0aGUgb3V0cHV0IEZTIChtZW1vcnkpLlxuICAgICAgICBvdXRwdXRGaWxlU3lzdGVtLndyaXRlRmlsZShyZXNvbHZlZERlc3QsIGF3YWl0IGlucHV0cHV0RmlsZVN5c3RlbS5yZWFkRmlsZShzcmMpKTtcbiAgfTtcblxuICBhd2FpdCBvdXRwdXRGaWxlU3lzdGVtLndyaXRlRmlsZShwYXRoLmpvaW4ob3V0cHV0UGF0aCwgJ25nc3cuanNvbicpLCByZXN1bHQubWFuaWZlc3QpO1xuXG4gIGZvciAoY29uc3QgeyBzb3VyY2UsIGRlc3RpbmF0aW9uIH0gb2YgcmVzdWx0LmFzc2V0RmlsZXMpIHtcbiAgICBhd2FpdCBjb3B5KHNvdXJjZSwgZGVzdGluYXRpb24pO1xuICB9XG59XG5cbi8vIFRoaXMgaXMgY3VycmVudGx5IHVzZWQgYnkgdGhlIGVzYnVpbGQtYmFzZWQgYnVpbGRlclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGF1Z21lbnRBcHBXaXRoU2VydmljZVdvcmtlckVzYnVpbGQoXG4gIHdvcmtzcGFjZVJvb3Q6IHN0cmluZyxcbiAgY29uZmlnUGF0aDogc3RyaW5nLFxuICBiYXNlSHJlZjogc3RyaW5nLFxuICBvdXRwdXRGaWxlczogT3V0cHV0RmlsZVtdLFxuICBhc3NldEZpbGVzOiB7IHNvdXJjZTogc3RyaW5nOyBkZXN0aW5hdGlvbjogc3RyaW5nIH1bXSxcbik6IFByb21pc2U8eyBtYW5pZmVzdDogc3RyaW5nOyBhc3NldEZpbGVzOiB7IHNvdXJjZTogc3RyaW5nOyBkZXN0aW5hdGlvbjogc3RyaW5nIH1bXSB9PiB7XG4gIC8vIFJlYWQgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZVxuICBsZXQgY29uZmlnOiBDb25maWcgfCB1bmRlZmluZWQ7XG4gIHRyeSB7XG4gICAgY29uc3QgY29uZmlndXJhdGlvbkRhdGEgPSBhd2FpdCBmc1Byb21pc2VzLnJlYWRGaWxlKGNvbmZpZ1BhdGgsICd1dGYtOCcpO1xuICAgIGNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlndXJhdGlvbkRhdGEpIGFzIENvbmZpZztcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBhc3NlcnRJc0Vycm9yKGVycm9yKTtcbiAgICBpZiAoZXJyb3IuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgIC8vIFRPRE86IEdlbmVyYXRlIGFuIGVycm9yIG9iamVjdCB0aGF0IGNhbiBiZSBjb25zdW1lZCBieSB0aGUgZXNidWlsZC1iYXNlZCBidWlsZGVyXG4gICAgICBjb25zdCBtZXNzYWdlID0gYFNlcnZpY2Ugd29ya2VyIGNvbmZpZ3VyYXRpb24gZmlsZSBcIiR7cGF0aC5yZWxhdGl2ZShcbiAgICAgICAgd29ya3NwYWNlUm9vdCxcbiAgICAgICAgY29uZmlnUGF0aCxcbiAgICAgICl9XCIgY291bGQgbm90IGJlIGZvdW5kLmA7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdWdtZW50QXBwV2l0aFNlcnZpY2VXb3JrZXJDb3JlKFxuICAgIGNvbmZpZyxcbiAgICBuZXcgUmVzdWx0RmlsZXN5c3RlbShvdXRwdXRGaWxlcywgYXNzZXRGaWxlcyksXG4gICAgYmFzZUhyZWYsXG4gICk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhdWdtZW50QXBwV2l0aFNlcnZpY2VXb3JrZXJDb3JlKFxuICBjb25maWc6IENvbmZpZyxcbiAgc2VydmljZVdvcmtlckZpbGVzeXN0ZW06IEZpbGVzeXN0ZW0sXG4gIGJhc2VIcmVmOiBzdHJpbmcsXG4pOiBQcm9taXNlPHsgbWFuaWZlc3Q6IHN0cmluZzsgYXNzZXRGaWxlczogeyBzb3VyY2U6IHN0cmluZzsgZGVzdGluYXRpb246IHN0cmluZyB9W10gfT4ge1xuICAvLyBMb2FkIEVTTSBgQGFuZ3VsYXIvc2VydmljZS13b3JrZXIvY29uZmlnYCB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydCB3b3JrYXJvdW5kLlxuICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZVxuICAvLyBjaGFuZ2VkIHRvIGEgZGlyZWN0IGR5bmFtaWMgaW1wb3J0LlxuICBjb25zdCBHZW5lcmF0b3JDb25zdHJ1Y3RvciA9IChcbiAgICBhd2FpdCBsb2FkRXNtTW9kdWxlPHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL3NlcnZpY2Utd29ya2VyL2NvbmZpZycpPihcbiAgICAgICdAYW5ndWxhci9zZXJ2aWNlLXdvcmtlci9jb25maWcnLFxuICAgIClcbiAgKS5HZW5lcmF0b3I7XG5cbiAgLy8gR2VuZXJhdGUgdGhlIG1hbmlmZXN0XG4gIGNvbnN0IGdlbmVyYXRvciA9IG5ldyBHZW5lcmF0b3JDb25zdHJ1Y3RvcihzZXJ2aWNlV29ya2VyRmlsZXN5c3RlbSwgYmFzZUhyZWYpO1xuICBjb25zdCBvdXRwdXQgPSBhd2FpdCBnZW5lcmF0b3IucHJvY2Vzcyhjb25maWcpO1xuXG4gIC8vIFdyaXRlIHRoZSBtYW5pZmVzdFxuICBjb25zdCBtYW5pZmVzdCA9IEpTT04uc3RyaW5naWZ5KG91dHB1dCwgbnVsbCwgMik7XG5cbiAgLy8gRmluZCB0aGUgc2VydmljZSB3b3JrZXIgcGFja2FnZVxuICBjb25zdCB3b3JrZXJQYXRoID0gcmVxdWlyZS5yZXNvbHZlKCdAYW5ndWxhci9zZXJ2aWNlLXdvcmtlci9uZ3N3LXdvcmtlci5qcycpO1xuXG4gIGNvbnN0IHJlc3VsdCA9IHtcbiAgICBtYW5pZmVzdCxcbiAgICAvLyBNYWluIHdvcmtlciBjb2RlXG4gICAgYXNzZXRGaWxlczogW3sgc291cmNlOiB3b3JrZXJQYXRoLCBkZXN0aW5hdGlvbjogJ25nc3ctd29ya2VyLmpzJyB9XSxcbiAgfTtcblxuICAvLyBJZiBwcmVzZW50LCB3cml0ZSB0aGUgc2FmZXR5IHdvcmtlciBjb2RlXG4gIGNvbnN0IHNhZmV0eVBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHdvcmtlclBhdGgpLCAnc2FmZXR5LXdvcmtlci5qcycpO1xuICBpZiAoZXhpc3RzU3luYyhzYWZldHlQYXRoKSkge1xuICAgIHJlc3VsdC5hc3NldEZpbGVzLnB1c2goeyBzb3VyY2U6IHNhZmV0eVBhdGgsIGRlc3RpbmF0aW9uOiAnd29ya2VyLWJhc2ljLm1pbi5qcycgfSk7XG4gICAgcmVzdWx0LmFzc2V0RmlsZXMucHVzaCh7IHNvdXJjZTogc2FmZXR5UGF0aCwgZGVzdGluYXRpb246ICdzYWZldHktd29ya2VyLmpzJyB9KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG4iXX0=