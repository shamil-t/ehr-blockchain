import path from "node:path";
import { move, readJsonFile, writeJsonFileAsStream, } from "@nomicfoundation/hardhat-utils/fs";
const CACHE_FILE_NAME = `compile-cache.json`;
export async function loadCache(cacheDirectory) {
    let cache;
    try {
        cache = await readJsonFile(path.join(cacheDirectory, CACHE_FILE_NAME));
    }
    catch (_error) {
        cache = {};
    }
    return cache;
}
export async function saveCache(cacheDirectory, cache) {
    const filePath = path.join(cacheDirectory, CACHE_FILE_NAME);
    const tmpPath = `${filePath}.tmp`;
    // NOTE: We are writing to a temporary file first because the value might
    // be large and we don't want to end up with corrupted files in the cache.
    await writeJsonFileAsStream(tmpPath, cache);
    await move(tmpPath, filePath);
}
//# sourceMappingURL=cache.js.map