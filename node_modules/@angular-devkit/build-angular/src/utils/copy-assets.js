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
exports.copyAssets = void 0;
const fast_glob_1 = __importDefault(require("fast-glob"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
async function copyAssets(entries, basePaths, root, changed) {
    const defaultIgnore = ['.gitkeep', '**/.DS_Store', '**/Thumbs.db'];
    const outputFiles = [];
    for (const entry of entries) {
        const cwd = node_path_1.default.resolve(root, entry.input);
        const files = await (0, fast_glob_1.default)(entry.glob, {
            cwd,
            dot: true,
            ignore: entry.ignore ? defaultIgnore.concat(entry.ignore) : defaultIgnore,
            followSymbolicLinks: entry.followSymlinks,
        });
        const directoryExists = new Set();
        for (const file of files) {
            const src = node_path_1.default.join(cwd, file);
            if (changed && !changed.has(src)) {
                continue;
            }
            const filePath = entry.flatten ? node_path_1.default.basename(file) : file;
            outputFiles.push({ source: src, destination: node_path_1.default.join(entry.output, filePath) });
            for (const base of basePaths) {
                const dest = node_path_1.default.join(base, entry.output, filePath);
                const dir = node_path_1.default.dirname(dest);
                if (!directoryExists.has(dir)) {
                    if (!node_fs_1.default.existsSync(dir)) {
                        node_fs_1.default.mkdirSync(dir, { recursive: true });
                    }
                    directoryExists.add(dir);
                }
                node_fs_1.default.copyFileSync(src, dest, node_fs_1.default.constants.COPYFILE_FICLONE);
            }
        }
    }
    return outputFiles;
}
exports.copyAssets = copyAssets;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weS1hc3NldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9jb3B5LWFzc2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCwwREFBNkI7QUFDN0Isc0RBQXlCO0FBQ3pCLDBEQUE2QjtBQUV0QixLQUFLLFVBQVUsVUFBVSxDQUM5QixPQU9HLEVBQ0gsU0FBMkIsRUFDM0IsSUFBWSxFQUNaLE9BQXFCO0lBRXJCLE1BQU0sYUFBYSxHQUFHLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUVuRSxNQUFNLFdBQVcsR0FBOEMsRUFBRSxDQUFDO0lBRWxFLEtBQUssTUFBTSxLQUFLLElBQUksT0FBTyxFQUFFO1FBQzNCLE1BQU0sR0FBRyxHQUFHLG1CQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUMsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFBLG1CQUFJLEVBQUMsS0FBSyxDQUFDLElBQUksRUFBRTtZQUNuQyxHQUFHO1lBQ0gsR0FBRyxFQUFFLElBQUk7WUFDVCxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWE7WUFDekUsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLGNBQWM7U0FDMUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxlQUFlLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUUxQyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtZQUN4QixNQUFNLEdBQUcsR0FBRyxtQkFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakMsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNoQyxTQUFTO2FBQ1Y7WUFFRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxtQkFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBRTVELFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxtQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVsRixLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsRUFBRTtnQkFDNUIsTUFBTSxJQUFJLEdBQUcsbUJBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3JELE1BQU0sR0FBRyxHQUFHLG1CQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMvQixJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFDN0IsSUFBSSxDQUFDLGlCQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO3dCQUN2QixpQkFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztxQkFDeEM7b0JBQ0QsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDMUI7Z0JBQ0QsaUJBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxpQkFBRSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2FBQzNEO1NBQ0Y7S0FDRjtJQUVELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUM7QUFyREQsZ0NBcURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCBnbG9iIGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29weUFzc2V0cyhcbiAgZW50cmllczoge1xuICAgIGdsb2I6IHN0cmluZztcbiAgICBpZ25vcmU/OiBzdHJpbmdbXTtcbiAgICBpbnB1dDogc3RyaW5nO1xuICAgIG91dHB1dDogc3RyaW5nO1xuICAgIGZsYXR0ZW4/OiBib29sZWFuO1xuICAgIGZvbGxvd1N5bWxpbmtzPzogYm9vbGVhbjtcbiAgfVtdLFxuICBiYXNlUGF0aHM6IEl0ZXJhYmxlPHN0cmluZz4sXG4gIHJvb3Q6IHN0cmluZyxcbiAgY2hhbmdlZD86IFNldDxzdHJpbmc+LFxuKSB7XG4gIGNvbnN0IGRlZmF1bHRJZ25vcmUgPSBbJy5naXRrZWVwJywgJyoqLy5EU19TdG9yZScsICcqKi9UaHVtYnMuZGInXTtcblxuICBjb25zdCBvdXRwdXRGaWxlczogeyBzb3VyY2U6IHN0cmluZzsgZGVzdGluYXRpb246IHN0cmluZyB9W10gPSBbXTtcblxuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICBjb25zdCBjd2QgPSBwYXRoLnJlc29sdmUocm9vdCwgZW50cnkuaW5wdXQpO1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZ2xvYihlbnRyeS5nbG9iLCB7XG4gICAgICBjd2QsXG4gICAgICBkb3Q6IHRydWUsXG4gICAgICBpZ25vcmU6IGVudHJ5Lmlnbm9yZSA/IGRlZmF1bHRJZ25vcmUuY29uY2F0KGVudHJ5Lmlnbm9yZSkgOiBkZWZhdWx0SWdub3JlLFxuICAgICAgZm9sbG93U3ltYm9saWNMaW5rczogZW50cnkuZm9sbG93U3ltbGlua3MsXG4gICAgfSk7XG5cbiAgICBjb25zdCBkaXJlY3RvcnlFeGlzdHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgICAgY29uc3Qgc3JjID0gcGF0aC5qb2luKGN3ZCwgZmlsZSk7XG4gICAgICBpZiAoY2hhbmdlZCAmJiAhY2hhbmdlZC5oYXMoc3JjKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmlsZVBhdGggPSBlbnRyeS5mbGF0dGVuID8gcGF0aC5iYXNlbmFtZShmaWxlKSA6IGZpbGU7XG5cbiAgICAgIG91dHB1dEZpbGVzLnB1c2goeyBzb3VyY2U6IHNyYywgZGVzdGluYXRpb246IHBhdGguam9pbihlbnRyeS5vdXRwdXQsIGZpbGVQYXRoKSB9KTtcblxuICAgICAgZm9yIChjb25zdCBiYXNlIG9mIGJhc2VQYXRocykge1xuICAgICAgICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKGJhc2UsIGVudHJ5Lm91dHB1dCwgZmlsZVBhdGgpO1xuICAgICAgICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoZGVzdCk7XG4gICAgICAgIGlmICghZGlyZWN0b3J5RXhpc3RzLmhhcyhkaXIpKSB7XG4gICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkaXJlY3RvcnlFeGlzdHMuYWRkKGRpcik7XG4gICAgICAgIH1cbiAgICAgICAgZnMuY29weUZpbGVTeW5jKHNyYywgZGVzdCwgZnMuY29uc3RhbnRzLkNPUFlGSUxFX0ZJQ0xPTkUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXRwdXRGaWxlcztcbn1cbiJdfQ==