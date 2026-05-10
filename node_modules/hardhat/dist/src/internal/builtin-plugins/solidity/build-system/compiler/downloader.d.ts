import type { Compiler } from "../../../../../../src/types/solidity.js";
import { download } from "@nomicfoundation/hardhat-utils/request";
export declare enum CompilerPlatform {
    LINUX = "linux-amd64",
    LINUX_ARM64 = "linux-arm64",
    WINDOWS = "windows-amd64",
    MACOS = "macosx-amd64",
    WASM = "wasm"
}
/**
 * A compiler downloader which must be specialized per-platform. It can't and
 * shouldn't support multiple platforms at the same time.
 *
 * This is expected to be used like this:
 *    1. First, the downloader is created for the given platform.
 *    2. Then, call `downloader.updateCompilerListIfNeeded(versionsToUse)` to
 *       update the compiler list if one of the versions is not found.
 *    3. Then, call `downloader.isCompilerDownloaded()` to check if the
 *       compiler is already downloaded.
 *    4. If the compiler is not downloaded, call
 *       `downloader.downloadCompiler()` to download it.
 *    5. Finally, call `downloader.getCompiler()` to get the compiler.
 *
 * Important things to note:
 *   1. If a compiler version is not found, this downloader may fail.
 *      1.1.1 If a user tries to download a new compiler before X amount of time
 *      has passed since its release, they may need to clean the cache, as
 *      indicated in the error messages.
 */
export interface CompilerDownloader {
    /**
     * Updates the compiler list if any of the versions is not found in the
     * currently downloaded list, or if none has been downloaded yet.
     */
    updateCompilerListIfNeeded(versions: Set<string>): Promise<void>;
    /**
     * Returns true if the compiler has been downloaded.
     *
     * This function access the filesystem, but doesn't modify it.
     */
    isCompilerDownloaded(version: string): Promise<boolean>;
    /**
     * Downloads the compiler for a given version, which can later be obtained
     * with getCompiler.
     *
     * @returns `true` if the compiler was downloaded and verified correctly,
     * including validating the checksum and if the native compiler can be run.
     */
    downloadCompiler(version: string): Promise<boolean>;
    /**
     * Returns the compiler, which MUST be downloaded before calling this function.
     *
     * Returns undefined if the compiler has been downloaded but can't be run.
     *
     * This function access the filesystem, but doesn't modify it.
     */
    getCompiler(version: string): Promise<Compiler | undefined>;
}
/**
 * Default implementation of CompilerDownloader.
 */
export declare class CompilerDownloaderImplementation implements CompilerDownloader {
    #private;
    static getCompilerPlatform(): CompilerPlatform;
    constructor(platform: CompilerPlatform, compilersDir: string, downloadFunction?: typeof download);
    updateCompilerListIfNeeded(versions: Set<string>): Promise<void>;
    isCompilerDownloaded(version: string): Promise<boolean>;
    downloadCompiler(version: string): Promise<boolean>;
    getCompiler(version: string): Promise<Compiler | undefined>;
}
//# sourceMappingURL=downloader.d.ts.map