import type { Template } from "./template.js";
export declare function promptForHardhatVersion(): Promise<"hardhat-2" | "hardhat-3">;
export declare function promptForWorkspace(): Promise<string>;
export declare function promptForMigrateToEsm(absolutePathToPackageJson: string): Promise<boolean>;
export declare function promptForTemplate(templates: Template[]): Promise<string>;
export declare function promptForForce(files: string[]): Promise<boolean>;
export declare function promptForInstall(safelyFormattedCommand: string): Promise<boolean>;
export declare function promptForUpdate(safelyFormattedCommand: string): Promise<boolean>;
//# sourceMappingURL=prompt.d.ts.map