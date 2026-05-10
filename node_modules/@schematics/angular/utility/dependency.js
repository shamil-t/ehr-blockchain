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
exports.addDependency = exports.ExistingBehavior = exports.InstallBehavior = exports.DependencyType = void 0;
const tasks_1 = require("@angular-devkit/schematics/tasks");
const path = __importStar(require("path"));
const installTasks = new WeakMap();
/**
 * An enum used to specify the type of a dependency found within a package manifest
 * file (`package.json`).
 */
var DependencyType;
(function (DependencyType) {
    DependencyType["Default"] = "dependencies";
    DependencyType["Dev"] = "devDependencies";
    DependencyType["Peer"] = "peerDependencies";
})(DependencyType || (exports.DependencyType = DependencyType = {}));
/**
 * An enum used to specify the dependency installation behavior for the {@link addDependency}
 * schematics rule. The installation behavior affects if and when {@link NodePackageInstallTask}
 * will be scheduled when using the rule.
 */
var InstallBehavior;
(function (InstallBehavior) {
    /**
     * No installation will occur as a result of the rule when specified.
     *
     * NOTE: This does not prevent other rules from scheduling a {@link NodePackageInstallTask}
     * which may install the dependency.
     */
    InstallBehavior[InstallBehavior["None"] = 0] = "None";
    /**
     * Automatically determine the need to schedule a {@link NodePackageInstallTask} based on
     * previous usage of the {@link addDependency} within the schematic.
     */
    InstallBehavior[InstallBehavior["Auto"] = 1] = "Auto";
    /**
     * Always schedule a {@link NodePackageInstallTask} when the rule is executed.
     */
    InstallBehavior[InstallBehavior["Always"] = 2] = "Always";
})(InstallBehavior || (exports.InstallBehavior = InstallBehavior = {}));
/**
 * An enum used to specify the existing dependency behavior for the {@link addDependency}
 * schematics rule. The existing behavior affects whether the named dependency will be added
 * to the `package.json` when the dependency is already present with a differing specifier.
 */
var ExistingBehavior;
(function (ExistingBehavior) {
    /**
     * The dependency will not be added or otherwise changed if it already exists.
     */
    ExistingBehavior[ExistingBehavior["Skip"] = 0] = "Skip";
    /**
     * The dependency's existing specifier will be replaced with the specifier provided in the
     * {@link addDependency} call. A warning will also be shown during schematic execution to
     * notify the user of the replacement.
     */
    ExistingBehavior[ExistingBehavior["Replace"] = 1] = "Replace";
})(ExistingBehavior || (exports.ExistingBehavior = ExistingBehavior = {}));
/**
 * Adds a package as a dependency to a `package.json`. By default the `package.json` located
 * at the schematic's root will be used. The `manifestPath` option can be used to explicitly specify
 * a `package.json` in different location. The type of the dependency can also be specified instead
 * of the default of the `dependencies` section by using the `type` option for either `devDependencies`
 * or `peerDependencies`.
 *
 * When using this rule, {@link NodePackageInstallTask} does not need to be included directly by
 * a schematic. A package manager install task will be automatically scheduled as needed.
 *
 * @param name The name of the package to add.
 * @param specifier The package specifier for the package to add. Typically a SemVer range.
 * @param options An optional object that can contain the `type` of the dependency
 * and/or a path (`packageJsonPath`) of a manifest file (`package.json`) to modify.
 * @returns A Schematics {@link Rule}
 */
function addDependency(name, specifier, options = {}) {
    const { type = DependencyType.Default, packageJsonPath = '/package.json', install = InstallBehavior.Auto, existing = ExistingBehavior.Replace, } = options;
    return (tree, context) => {
        const manifest = tree.readJson(packageJsonPath);
        const dependencySection = manifest[type];
        if (!dependencySection) {
            // Section is not present. The dependency can be added to a new object literal for the section.
            manifest[type] = { [name]: specifier };
        }
        else {
            const existingSpecifier = dependencySection[name];
            if (existingSpecifier === specifier) {
                // Already present with same specifier
                return;
            }
            if (existingSpecifier) {
                // Already present but different specifier
                if (existing === ExistingBehavior.Skip) {
                    return;
                }
                // ExistingBehavior.Replace is the only other behavior currently
                context.logger.warn(`Package dependency "${name}" already exists with a different specifier. ` +
                    `"${existingSpecifier}" will be replaced with "${specifier}".`);
            }
            // Add new dependency in alphabetical order
            const entries = Object.entries(dependencySection);
            entries.push([name, specifier]);
            entries.sort((a, b) => a[0].localeCompare(b[0]));
            manifest[type] = Object.fromEntries(entries);
        }
        tree.overwrite(packageJsonPath, JSON.stringify(manifest, null, 2));
        const installPaths = installTasks.get(context) ?? new Set();
        if (install === InstallBehavior.Always ||
            (install === InstallBehavior.Auto && !installPaths.has(packageJsonPath))) {
            context.addTask(new tasks_1.NodePackageInstallTask({ workingDirectory: path.dirname(packageJsonPath) }));
            installPaths.add(packageJsonPath);
            installTasks.set(context, installPaths);
        }
    };
}
exports.addDependency = addDependency;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwZW5kZW5jeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L2RlcGVuZGVuY3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCw0REFBMEU7QUFDMUUsMkNBQTZCO0FBRTdCLE1BQU0sWUFBWSxHQUFHLElBQUksT0FBTyxFQUFpQyxDQUFDO0FBUWxFOzs7R0FHRztBQUNILElBQVksY0FJWDtBQUpELFdBQVksY0FBYztJQUN4QiwwQ0FBd0IsQ0FBQTtJQUN4Qix5Q0FBdUIsQ0FBQTtJQUN2QiwyQ0FBeUIsQ0FBQTtBQUMzQixDQUFDLEVBSlcsY0FBYyw4QkFBZCxjQUFjLFFBSXpCO0FBRUQ7Ozs7R0FJRztBQUNILElBQVksZUFpQlg7QUFqQkQsV0FBWSxlQUFlO0lBQ3pCOzs7OztPQUtHO0lBQ0gscURBQUksQ0FBQTtJQUNKOzs7T0FHRztJQUNILHFEQUFJLENBQUE7SUFDSjs7T0FFRztJQUNILHlEQUFNLENBQUE7QUFDUixDQUFDLEVBakJXLGVBQWUsK0JBQWYsZUFBZSxRQWlCMUI7QUFFRDs7OztHQUlHO0FBQ0gsSUFBWSxnQkFXWDtBQVhELFdBQVksZ0JBQWdCO0lBQzFCOztPQUVHO0lBQ0gsdURBQUksQ0FBQTtJQUNKOzs7O09BSUc7SUFDSCw2REFBTyxDQUFBO0FBQ1QsQ0FBQyxFQVhXLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBVzNCO0FBRUQ7Ozs7Ozs7Ozs7Ozs7OztHQWVHO0FBQ0gsU0FBZ0IsYUFBYSxDQUMzQixJQUFZLEVBQ1osU0FBaUIsRUFDakIsVUFzQkksRUFBRTtJQUVOLE1BQU0sRUFDSixJQUFJLEdBQUcsY0FBYyxDQUFDLE9BQU8sRUFDN0IsZUFBZSxHQUFHLGVBQWUsRUFDakMsT0FBTyxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQzlCLFFBQVEsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLEdBQ3BDLEdBQUcsT0FBTyxDQUFDO0lBRVosT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRTtRQUN2QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBMkIsQ0FBQztRQUMxRSxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV6QyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDdEIsK0ZBQStGO1lBQy9GLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUM7U0FDeEM7YUFBTTtZQUNMLE1BQU0saUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFbEQsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLEVBQUU7Z0JBQ25DLHNDQUFzQztnQkFDdEMsT0FBTzthQUNSO1lBRUQsSUFBSSxpQkFBaUIsRUFBRTtnQkFDckIsMENBQTBDO2dCQUUxQyxJQUFJLFFBQVEsS0FBSyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUU7b0JBQ3RDLE9BQU87aUJBQ1I7Z0JBRUQsZ0VBQWdFO2dCQUNoRSxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDakIsdUJBQXVCLElBQUksK0NBQStDO29CQUN4RSxJQUFJLGlCQUFpQiw0QkFBNEIsU0FBUyxJQUFJLENBQ2pFLENBQUM7YUFDSDtZQUVELDJDQUEyQztZQUMzQyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDbEQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakQsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVuRSxNQUFNLFlBQVksR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFVLENBQUM7UUFDcEUsSUFDRSxPQUFPLEtBQUssZUFBZSxDQUFDLE1BQU07WUFDbEMsQ0FBQyxPQUFPLEtBQUssZUFBZSxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsRUFDeEU7WUFDQSxPQUFPLENBQUMsT0FBTyxDQUNiLElBQUksOEJBQXNCLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FDaEYsQ0FBQztZQUNGLFlBQVksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDbEMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7U0FDekM7SUFDSCxDQUFDLENBQUM7QUFDSixDQUFDO0FBcEZELHNDQW9GQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBSdWxlLCBTY2hlbWF0aWNDb250ZXh0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgTm9kZVBhY2thZ2VJbnN0YWxsVGFzayB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rhc2tzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmNvbnN0IGluc3RhbGxUYXNrcyA9IG5ldyBXZWFrTWFwPFNjaGVtYXRpY0NvbnRleHQsIFNldDxzdHJpbmc+PigpO1xuXG5pbnRlcmZhY2UgTWluaW1hbFBhY2thZ2VNYW5pZmVzdCB7XG4gIGRlcGVuZGVuY2llcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIGRldkRlcGVuZGVuY2llcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIHBlZXJEZXBlbmRlbmNpZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG4vKipcbiAqIEFuIGVudW0gdXNlZCB0byBzcGVjaWZ5IHRoZSB0eXBlIG9mIGEgZGVwZW5kZW5jeSBmb3VuZCB3aXRoaW4gYSBwYWNrYWdlIG1hbmlmZXN0XG4gKiBmaWxlIChgcGFja2FnZS5qc29uYCkuXG4gKi9cbmV4cG9ydCBlbnVtIERlcGVuZGVuY3lUeXBlIHtcbiAgRGVmYXVsdCA9ICdkZXBlbmRlbmNpZXMnLFxuICBEZXYgPSAnZGV2RGVwZW5kZW5jaWVzJyxcbiAgUGVlciA9ICdwZWVyRGVwZW5kZW5jaWVzJyxcbn1cblxuLyoqXG4gKiBBbiBlbnVtIHVzZWQgdG8gc3BlY2lmeSB0aGUgZGVwZW5kZW5jeSBpbnN0YWxsYXRpb24gYmVoYXZpb3IgZm9yIHRoZSB7QGxpbmsgYWRkRGVwZW5kZW5jeX1cbiAqIHNjaGVtYXRpY3MgcnVsZS4gVGhlIGluc3RhbGxhdGlvbiBiZWhhdmlvciBhZmZlY3RzIGlmIGFuZCB3aGVuIHtAbGluayBOb2RlUGFja2FnZUluc3RhbGxUYXNrfVxuICogd2lsbCBiZSBzY2hlZHVsZWQgd2hlbiB1c2luZyB0aGUgcnVsZS5cbiAqL1xuZXhwb3J0IGVudW0gSW5zdGFsbEJlaGF2aW9yIHtcbiAgLyoqXG4gICAqIE5vIGluc3RhbGxhdGlvbiB3aWxsIG9jY3VyIGFzIGEgcmVzdWx0IG9mIHRoZSBydWxlIHdoZW4gc3BlY2lmaWVkLlxuICAgKlxuICAgKiBOT1RFOiBUaGlzIGRvZXMgbm90IHByZXZlbnQgb3RoZXIgcnVsZXMgZnJvbSBzY2hlZHVsaW5nIGEge0BsaW5rIE5vZGVQYWNrYWdlSW5zdGFsbFRhc2t9XG4gICAqIHdoaWNoIG1heSBpbnN0YWxsIHRoZSBkZXBlbmRlbmN5LlxuICAgKi9cbiAgTm9uZSxcbiAgLyoqXG4gICAqIEF1dG9tYXRpY2FsbHkgZGV0ZXJtaW5lIHRoZSBuZWVkIHRvIHNjaGVkdWxlIGEge0BsaW5rIE5vZGVQYWNrYWdlSW5zdGFsbFRhc2t9IGJhc2VkIG9uXG4gICAqIHByZXZpb3VzIHVzYWdlIG9mIHRoZSB7QGxpbmsgYWRkRGVwZW5kZW5jeX0gd2l0aGluIHRoZSBzY2hlbWF0aWMuXG4gICAqL1xuICBBdXRvLFxuICAvKipcbiAgICogQWx3YXlzIHNjaGVkdWxlIGEge0BsaW5rIE5vZGVQYWNrYWdlSW5zdGFsbFRhc2t9IHdoZW4gdGhlIHJ1bGUgaXMgZXhlY3V0ZWQuXG4gICAqL1xuICBBbHdheXMsXG59XG5cbi8qKlxuICogQW4gZW51bSB1c2VkIHRvIHNwZWNpZnkgdGhlIGV4aXN0aW5nIGRlcGVuZGVuY3kgYmVoYXZpb3IgZm9yIHRoZSB7QGxpbmsgYWRkRGVwZW5kZW5jeX1cbiAqIHNjaGVtYXRpY3MgcnVsZS4gVGhlIGV4aXN0aW5nIGJlaGF2aW9yIGFmZmVjdHMgd2hldGhlciB0aGUgbmFtZWQgZGVwZW5kZW5jeSB3aWxsIGJlIGFkZGVkXG4gKiB0byB0aGUgYHBhY2thZ2UuanNvbmAgd2hlbiB0aGUgZGVwZW5kZW5jeSBpcyBhbHJlYWR5IHByZXNlbnQgd2l0aCBhIGRpZmZlcmluZyBzcGVjaWZpZXIuXG4gKi9cbmV4cG9ydCBlbnVtIEV4aXN0aW5nQmVoYXZpb3Ige1xuICAvKipcbiAgICogVGhlIGRlcGVuZGVuY3kgd2lsbCBub3QgYmUgYWRkZWQgb3Igb3RoZXJ3aXNlIGNoYW5nZWQgaWYgaXQgYWxyZWFkeSBleGlzdHMuXG4gICAqL1xuICBTa2lwLFxuICAvKipcbiAgICogVGhlIGRlcGVuZGVuY3kncyBleGlzdGluZyBzcGVjaWZpZXIgd2lsbCBiZSByZXBsYWNlZCB3aXRoIHRoZSBzcGVjaWZpZXIgcHJvdmlkZWQgaW4gdGhlXG4gICAqIHtAbGluayBhZGREZXBlbmRlbmN5fSBjYWxsLiBBIHdhcm5pbmcgd2lsbCBhbHNvIGJlIHNob3duIGR1cmluZyBzY2hlbWF0aWMgZXhlY3V0aW9uIHRvXG4gICAqIG5vdGlmeSB0aGUgdXNlciBvZiB0aGUgcmVwbGFjZW1lbnQuXG4gICAqL1xuICBSZXBsYWNlLFxufVxuXG4vKipcbiAqIEFkZHMgYSBwYWNrYWdlIGFzIGEgZGVwZW5kZW5jeSB0byBhIGBwYWNrYWdlLmpzb25gLiBCeSBkZWZhdWx0IHRoZSBgcGFja2FnZS5qc29uYCBsb2NhdGVkXG4gKiBhdCB0aGUgc2NoZW1hdGljJ3Mgcm9vdCB3aWxsIGJlIHVzZWQuIFRoZSBgbWFuaWZlc3RQYXRoYCBvcHRpb24gY2FuIGJlIHVzZWQgdG8gZXhwbGljaXRseSBzcGVjaWZ5XG4gKiBhIGBwYWNrYWdlLmpzb25gIGluIGRpZmZlcmVudCBsb2NhdGlvbi4gVGhlIHR5cGUgb2YgdGhlIGRlcGVuZGVuY3kgY2FuIGFsc28gYmUgc3BlY2lmaWVkIGluc3RlYWRcbiAqIG9mIHRoZSBkZWZhdWx0IG9mIHRoZSBgZGVwZW5kZW5jaWVzYCBzZWN0aW9uIGJ5IHVzaW5nIHRoZSBgdHlwZWAgb3B0aW9uIGZvciBlaXRoZXIgYGRldkRlcGVuZGVuY2llc2BcbiAqIG9yIGBwZWVyRGVwZW5kZW5jaWVzYC5cbiAqXG4gKiBXaGVuIHVzaW5nIHRoaXMgcnVsZSwge0BsaW5rIE5vZGVQYWNrYWdlSW5zdGFsbFRhc2t9IGRvZXMgbm90IG5lZWQgdG8gYmUgaW5jbHVkZWQgZGlyZWN0bHkgYnlcbiAqIGEgc2NoZW1hdGljLiBBIHBhY2thZ2UgbWFuYWdlciBpbnN0YWxsIHRhc2sgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IHNjaGVkdWxlZCBhcyBuZWVkZWQuXG4gKlxuICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHBhY2thZ2UgdG8gYWRkLlxuICogQHBhcmFtIHNwZWNpZmllciBUaGUgcGFja2FnZSBzcGVjaWZpZXIgZm9yIHRoZSBwYWNrYWdlIHRvIGFkZC4gVHlwaWNhbGx5IGEgU2VtVmVyIHJhbmdlLlxuICogQHBhcmFtIG9wdGlvbnMgQW4gb3B0aW9uYWwgb2JqZWN0IHRoYXQgY2FuIGNvbnRhaW4gdGhlIGB0eXBlYCBvZiB0aGUgZGVwZW5kZW5jeVxuICogYW5kL29yIGEgcGF0aCAoYHBhY2thZ2VKc29uUGF0aGApIG9mIGEgbWFuaWZlc3QgZmlsZSAoYHBhY2thZ2UuanNvbmApIHRvIG1vZGlmeS5cbiAqIEByZXR1cm5zIEEgU2NoZW1hdGljcyB7QGxpbmsgUnVsZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZERlcGVuZGVuY3koXG4gIG5hbWU6IHN0cmluZyxcbiAgc3BlY2lmaWVyOiBzdHJpbmcsXG4gIG9wdGlvbnM6IHtcbiAgICAvKipcbiAgICAgKiBUaGUgdHlwZSBvZiB0aGUgZGVwZW5kZW5jeSBkZXRlcm1pbmVzIHRoZSBzZWN0aW9uIG9mIHRoZSBgcGFja2FnZS5qc29uYCB0byB3aGljaCB0aGVcbiAgICAgKiBkZXBlbmRlbmN5IHdpbGwgYmUgYWRkZWQuIERlZmF1bHRzIHRvIHtAbGluayBEZXBlbmRlbmN5VHlwZS5EZWZhdWx0fSAoYGRlcGVuZGVuY2llc2ApLlxuICAgICAqL1xuICAgIHR5cGU/OiBEZXBlbmRlbmN5VHlwZTtcbiAgICAvKipcbiAgICAgKiBUaGUgcGF0aCBvZiB0aGUgcGFja2FnZSBtYW5pZmVzdCBmaWxlIChgcGFja2FnZS5qc29uYCkgdGhhdCB3aWxsIGJlIG1vZGlmaWVkLlxuICAgICAqIERlZmF1bHRzIHRvIGAvcGFja2FnZS5qc29uYC5cbiAgICAgKi9cbiAgICBwYWNrYWdlSnNvblBhdGg/OiBzdHJpbmc7XG4gICAgLyoqXG4gICAgICogVGhlIGRlcGVuZGVuY3kgaW5zdGFsbGF0aW9uIGJlaGF2aW9yIHRvIHVzZSB0byBkZXRlcm1pbmUgd2hldGhlciBhXG4gICAgICoge0BsaW5rIE5vZGVQYWNrYWdlSW5zdGFsbFRhc2t9IHNob3VsZCBiZSBzY2hlZHVsZWQgYWZ0ZXIgYWRkaW5nIHRoZSBkZXBlbmRlbmN5LlxuICAgICAqIERlZmF1bHRzIHRvIHtAbGluayBJbnN0YWxsQmVoYXZpb3IuQXV0b30uXG4gICAgICovXG4gICAgaW5zdGFsbD86IEluc3RhbGxCZWhhdmlvcjtcbiAgICAvKipcbiAgICAgKiBUaGUgYmVoYXZpb3IgdG8gdXNlIHdoZW4gdGhlIGRlcGVuZGVuY3kgYWxyZWFkeSBleGlzdHMgd2l0aGluIHRoZSBgcGFja2FnZS5qc29uYC5cbiAgICAgKiBEZWZhdWx0cyB0byB7QGxpbmsgRXhpc3RpbmdCZWhhdmlvci5SZXBsYWNlfS5cbiAgICAgKi9cbiAgICBleGlzdGluZz86IEV4aXN0aW5nQmVoYXZpb3I7XG4gIH0gPSB7fSxcbik6IFJ1bGUge1xuICBjb25zdCB7XG4gICAgdHlwZSA9IERlcGVuZGVuY3lUeXBlLkRlZmF1bHQsXG4gICAgcGFja2FnZUpzb25QYXRoID0gJy9wYWNrYWdlLmpzb24nLFxuICAgIGluc3RhbGwgPSBJbnN0YWxsQmVoYXZpb3IuQXV0byxcbiAgICBleGlzdGluZyA9IEV4aXN0aW5nQmVoYXZpb3IuUmVwbGFjZSxcbiAgfSA9IG9wdGlvbnM7XG5cbiAgcmV0dXJuICh0cmVlLCBjb250ZXh0KSA9PiB7XG4gICAgY29uc3QgbWFuaWZlc3QgPSB0cmVlLnJlYWRKc29uKHBhY2thZ2VKc29uUGF0aCkgYXMgTWluaW1hbFBhY2thZ2VNYW5pZmVzdDtcbiAgICBjb25zdCBkZXBlbmRlbmN5U2VjdGlvbiA9IG1hbmlmZXN0W3R5cGVdO1xuXG4gICAgaWYgKCFkZXBlbmRlbmN5U2VjdGlvbikge1xuICAgICAgLy8gU2VjdGlvbiBpcyBub3QgcHJlc2VudC4gVGhlIGRlcGVuZGVuY3kgY2FuIGJlIGFkZGVkIHRvIGEgbmV3IG9iamVjdCBsaXRlcmFsIGZvciB0aGUgc2VjdGlvbi5cbiAgICAgIG1hbmlmZXN0W3R5cGVdID0geyBbbmFtZV06IHNwZWNpZmllciB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBleGlzdGluZ1NwZWNpZmllciA9IGRlcGVuZGVuY3lTZWN0aW9uW25hbWVdO1xuXG4gICAgICBpZiAoZXhpc3RpbmdTcGVjaWZpZXIgPT09IHNwZWNpZmllcikge1xuICAgICAgICAvLyBBbHJlYWR5IHByZXNlbnQgd2l0aCBzYW1lIHNwZWNpZmllclxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChleGlzdGluZ1NwZWNpZmllcikge1xuICAgICAgICAvLyBBbHJlYWR5IHByZXNlbnQgYnV0IGRpZmZlcmVudCBzcGVjaWZpZXJcblxuICAgICAgICBpZiAoZXhpc3RpbmcgPT09IEV4aXN0aW5nQmVoYXZpb3IuU2tpcCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEV4aXN0aW5nQmVoYXZpb3IuUmVwbGFjZSBpcyB0aGUgb25seSBvdGhlciBiZWhhdmlvciBjdXJyZW50bHlcbiAgICAgICAgY29udGV4dC5sb2dnZXIud2FybihcbiAgICAgICAgICBgUGFja2FnZSBkZXBlbmRlbmN5IFwiJHtuYW1lfVwiIGFscmVhZHkgZXhpc3RzIHdpdGggYSBkaWZmZXJlbnQgc3BlY2lmaWVyLiBgICtcbiAgICAgICAgICAgIGBcIiR7ZXhpc3RpbmdTcGVjaWZpZXJ9XCIgd2lsbCBiZSByZXBsYWNlZCB3aXRoIFwiJHtzcGVjaWZpZXJ9XCIuYCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIG5ldyBkZXBlbmRlbmN5IGluIGFscGhhYmV0aWNhbCBvcmRlclxuICAgICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKGRlcGVuZGVuY3lTZWN0aW9uKTtcbiAgICAgIGVudHJpZXMucHVzaChbbmFtZSwgc3BlY2lmaWVyXSk7XG4gICAgICBlbnRyaWVzLnNvcnQoKGEsIGIpID0+IGFbMF0ubG9jYWxlQ29tcGFyZShiWzBdKSk7XG4gICAgICBtYW5pZmVzdFt0eXBlXSA9IE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzKTtcbiAgICB9XG5cbiAgICB0cmVlLm92ZXJ3cml0ZShwYWNrYWdlSnNvblBhdGgsIEpTT04uc3RyaW5naWZ5KG1hbmlmZXN0LCBudWxsLCAyKSk7XG5cbiAgICBjb25zdCBpbnN0YWxsUGF0aHMgPSBpbnN0YWxsVGFza3MuZ2V0KGNvbnRleHQpID8/IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGlmIChcbiAgICAgIGluc3RhbGwgPT09IEluc3RhbGxCZWhhdmlvci5BbHdheXMgfHxcbiAgICAgIChpbnN0YWxsID09PSBJbnN0YWxsQmVoYXZpb3IuQXV0byAmJiAhaW5zdGFsbFBhdGhzLmhhcyhwYWNrYWdlSnNvblBhdGgpKVxuICAgICkge1xuICAgICAgY29udGV4dC5hZGRUYXNrKFxuICAgICAgICBuZXcgTm9kZVBhY2thZ2VJbnN0YWxsVGFzayh7IHdvcmtpbmdEaXJlY3Rvcnk6IHBhdGguZGlybmFtZShwYWNrYWdlSnNvblBhdGgpIH0pLFxuICAgICAgKTtcbiAgICAgIGluc3RhbGxQYXRocy5hZGQocGFja2FnZUpzb25QYXRoKTtcbiAgICAgIGluc3RhbGxUYXNrcy5zZXQoY29udGV4dCwgaW5zdGFsbFBhdGhzKTtcbiAgICB9XG4gIH07XG59XG4iXX0=