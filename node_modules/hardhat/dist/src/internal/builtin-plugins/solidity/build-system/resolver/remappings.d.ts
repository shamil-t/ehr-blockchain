import type { Remapping } from "./types.js";
/**
 * Tries to parse a remapping string, returning undefined if it's invalid.
 */
export declare function parseRemappingString(remapping: string): Remapping | undefined;
/**
 * Selects the best remapping for a direct import, if any.
 *
 * @param fromInputSourceName The input source name of the file with the import.
 * @param directImport The import path, which must be a direct import.
 * @param remappings The array of remappings to consider.
 * @returns The best remappings index or undefined if none is found.
 */
export declare function selectBestRemapping(fromInputSourceName: string, directImport: string, remappings: Remapping[]): number | undefined;
/**
 * Applies a remapping assuming that it's valid for this importPath.
 */
export declare function applyValidRemapping(importPath: string, remapping: Remapping): string;
export declare function formatRemapping(remapping: Remapping): string;
//# sourceMappingURL=remappings.d.ts.map