type PackageManager = "npm" | "yarn" | "pnpm" | "bun" | "deno";
/**
 * getPackageManager returns the name of the package manager used to run Hardhat
 *
 * This logic is based on the env variable `npm_config_user_agent`, which is set
 * by all major package manager, both when running a package that has been
 * installed, and when it hasn't.
 *
 * Here's how to reproduce it, with the value of the env var:
 *
 * npm:
 *
 *   uninstalled: npx -y print-environment
 *     "npm/11.6.1 node/v24.10.0 linux arm64 workspaces/false"
 *
 *   installed: npm init -y && npm i print-environment && npx print-environment
 *     "npm/11.6.1 node/v24.10.0 linux arm64 workspaces/false"
 *
 *
 * pnpm:
 *
 *   uninstalled: pnpm dlx print-environment
 *     "pnpm/10.18.3 npm/? node/v24.10.0 linux arm64"
 *
 *   installed: pnpm init && pnpm add print-environment && pnpm print-environment
 *     "pnpm/10.18.3 npm/? node/v24.10.0 linux arm64"
 *
 *
 * yarn classic:
 *   uninstalled: unsupported
 *
 *   installed: yarn init -y && yarn add print-environment && yarn print-environment
 *     "yarn/1.22.22 npm/? node/v24.10.0 linux arm64"
 *
 * yarn berry:
 *
 *   uninstalled: yarn set version berry && yarn dlx print-environment
 *     "yarn/4.10.3 npm/? node/v24.10.0 linux arm64"
 *
 *   installed: yarn set version berry && yarn add print-environment && yarn print-environment
 *     "yarn/4.10.3 npm/? node/v24.10.0 linux arm64"
 *
 * bun:
 *
 *   uninstalled: bunx print-environment
 *     "bun/1.3.1 npm/? node/v24.3.0 linux arm64"
 *
 *   installed: bun init -y && bun add print-environment && bun print-environment
 *     "bun/1.3.1 npm/? node/v24.3.0 linux arm64"
 *
 * deno:
 *
 *   uninstalled: deno run -A npm:print-environment
 *     "deno/2.5.6 npm/? deno/2.5.6 linux aarch64"
 *
 *   installed: deno init && deno add npm:print-environment && deno --allow-env print-environment
 *     "deno/2.5.6 npm/? deno/2.5.6 linux aarch64"
 *
 * @returns The name of the package manager used to run hardhat.
 */
export declare function getPackageManager(): PackageManager;
/**
 * getDevDependenciesInstallationCommand returns the command to install the given dependencies
 * as dev dependencies using the given package manager. The returned command should
 * be safe to run on the command line.
 *
 * @param packageManager The package manager to use.
 * @param dependencies The dependencies to install.
 * @returns The installation command.
 */
export declare function getDevDependenciesInstallationCommand(packageManager: PackageManager, dependencies: string[]): string[];
/**
 * installsPeerDependenciesByDefault returns true if the package manager
 * installs peer dependencies by default.
 *
 * @param workspace The path to the workspace where the package manager will operate.
 * @param packageManager The package manager to use.
 * @param version The version of the package manager to use. This parameter is used only for testing.
 * @param config The configuration of the package manager to use. This parameter is used only for testing.
 * @returns True if the package manager installs peer dependencies by default, false otherwise.
 */
export declare function installsPeerDependenciesByDefault(workspace: string, packageManager: PackageManager, version?: string, config?: Record<string, string>): Promise<boolean>;
export {};
//# sourceMappingURL=package-manager.d.ts.map