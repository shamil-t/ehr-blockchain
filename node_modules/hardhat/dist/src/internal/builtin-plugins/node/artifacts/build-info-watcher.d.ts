import type { FSWatcher } from "chokidar";
export type BuildInfoWatcher = FSWatcher;
export type BuildInfoHandler = (buildId: string) => Promise<void>;
/**
 * `listener` is a callback function invoked when a new file is added to the
 * build info directory. It processes the received event to check whether it is
 * for a build info file.
 *
 * If so, it extracts the build id from it and triggers the provided handler
 * with the extracted build id as an argument. Any errors encountered during
 * handler execution are captured and logged.
 *
 * @param absolutePath - The absolute path of the file added to the build info directory.
 *
 * This function is exposed for testing purposes only.
 */
export declare function listener(handler: BuildInfoHandler, absolutePath: string): Promise<void>;
/**
 * `watchBuildInfo` is a function that creates a watch over provided build info
 * directory. If it encounters a build info file being added, it will trigger
 * the provided handler, passing the build id as an argument. This allows for
 * further processing or actions to be taken upon completion of a build.
 */
export declare function watchBuildInfo(buildInfoDirPath: string, handler: BuildInfoHandler): Promise<BuildInfoWatcher>;
//# sourceMappingURL=build-info-watcher.d.ts.map