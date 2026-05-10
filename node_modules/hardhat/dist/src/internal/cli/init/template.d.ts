import { type PackageJson } from "@nomicfoundation/hardhat-utils/package";
/**
 * This type describes a hardhat project template. It consists of:
 * - name: The name of the template;
 * - packageJson: The parsed package.json file of the template;
 * - path: The absolute path to the template directory;
 * - files: The relative paths to template files within the template directory,
 *   excluding the package.json file.
 */
export interface Template {
    name: string;
    packageJson: PackageJson;
    path: string;
    files: string[];
}
/**
 * getTemplates returns the list of available templates. It retrieves them from
 * the "templates" folder in the package root.
 *
 * @returns The list of available templates.
 */
export declare function getTemplates(templatesDir: "hardhat-2" | "hardhat-3"): Promise<Template[]>;
//# sourceMappingURL=template.d.ts.map