import type { Template } from "./template.js";
import type { PackageJson } from "@nomicfoundation/hardhat-utils/package";
export interface InitHardhatOptions {
    hardhatVersion?: "hardhat-2" | "hardhat-3";
    workspace?: string;
    migrateToEsm?: boolean;
    template?: string;
    force?: boolean;
    install?: boolean;
}
/**
 * initHardhat implements the project initialization wizard flow.
 *
 * It can be called with the following options:
 * - workspace: The path to the workspace to initialize the project in.
 *   If not provided, the user will be prompted to select the workspace.
 * - template: The name of the template to use for the project initialization.
 *   If not provided, the user will be prompted to select the template.
 * - force: Whether to overwrite existing files in the workspace.
 *   If not provided and there are files that would be overwritten,
 *   the user will be prompted to confirm.
 * - install: Whether to install the project dependencies.
 *   If not provided and there are dependencies that should be installed,
 *   the user will be prompted to confirm.
 *
 * The flow is as follows:
 * 1. Print the ascii logo.
 * 2. Print the welcome message.
 * 3. Optionally, ask the user for the workspace to initialize the project in.
 * 4. Validate that the package.json exists; otherwise, create it.
 * 5. Validate that the package.json is an esm package; otherwise, ask the user if they want to set it.
 * 6. Optionally, ask the user for the template to use for the project initialization.
 * 7. Optionally, ask the user if files should be overwritten.
 * 8. Copy the template files to the workspace.
 * 9. Ensure telemetry consent.
 * 10. Print the commands to install the project dependencies.
 * 11. Optionally, ask the user if the project dependencies should be installed.
 * 12. Optionally, run the commands to install the project dependencies.
 * 13. Print a message to star the project on GitHub.
 */
export declare function initHardhat(options?: InitHardhatOptions): Promise<void>;
export declare function printWelcomeMessage(): Promise<void>;
/**
 * getWorkspace asks the user for the workspace to initialize the project in
 * if the input workspace is undefined.
 *
 * It also validates that the workspace is not already initialized.
 *
 * NOTE: This function is exported for testing purposes
 *
 * @param workspace The path to the workspace to initialize the project in.
 * @returns The path to the workspace.
 */
export declare function getWorkspace(workspace?: string): Promise<string>;
/**
 * getTemplate asks the user for the template to use for the project initialization
 * if the input template is undefined.
 *
 * It also validates that the template exists.
 *
 * NOTE: This function is exported for testing purposes
 *
 * @param template The name of the template to use for the project initialization.
 * @returns A tuple with two elements: the template and a promise with the analytics hit.
 */
export declare function getTemplate(hardhatVersion: "hardhat-2" | "hardhat-3", template?: string): Promise<[Template, Promise<boolean>]>;
/**
 * validatePackageJson creates the package.json file if it does not exist
 * in the workspace.
 *
 * It also validates that the package.json file is an esm package.
 *
 * NOTE: This function is exported for testing purposes
 *
 * @param workspace The path to the workspace to initialize the project in.
 */
export declare function validatePackageJson(workspace: string, templatePkg: PackageJson, migrateToEsm?: boolean): Promise<void>;
/**
 * The following two functions are used to convert between relative workspace
 * and template paths. To begin with, they are used to handle the special case
 * of .gitignore.
 *
 * The reason for this is that npm ignores .gitignore files
 * during npm pack (see https://github.com/npm/npm/issues/3763). That's why when
 * we encounter a gitignore file in the template, we assume that it should be
 * called .gitignore in the workspace (and vice versa).
 *
 * They are exported for testing purposes only.
 */
export declare function relativeWorkspaceToTemplatePath(file: string): string;
export declare function relativeTemplateToWorkspacePath(file: string): string;
/**
 * copyProjectFiles copies the template files to the workspace.
 *
 * If there are clashing files in the workspace, they will be overwritten only
 * if the force option is true or if the user opts-in to it.
 *
 * NOTE: This function is exported for testing purposes
 *
 * @param workspace The path to the workspace to initialize the project in.
 * @param template The template to use for the project initialization.
 * @param force Whether to overwrite existing files in the workspace.
 */
export declare function copyProjectFiles(workspace: string, template: Template, force?: boolean): Promise<void>;
/**
 * installProjectDependencies prints the commands to install the project dependencies
 * and runs them if the install option is true or if the user opts-in to it.
 *
 * NOTE: This function is exported for testing purposes
 *
 * @param workspace The path to the workspace to initialize the project in.
 * @param template The template to use for the project initialization.
 * @param install Whether to install the project dependencies.
 * @param update Whether to update the project dependencies.
 */
export declare function installProjectDependencies(workspace: string, template: Template, install?: boolean, update?: boolean): Promise<void>;
export declare function shouldUpdateDependency(workspaceVersion: string | undefined, templateVersion: string): boolean;
//# sourceMappingURL=init.d.ts.map