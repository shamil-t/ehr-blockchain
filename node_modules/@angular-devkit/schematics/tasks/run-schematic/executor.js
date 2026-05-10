"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
function default_1() {
    return (options, context) => {
        if (!options?.name) {
            throw new Error('RunSchematicTask requires an options object with a non-empty name property.');
        }
        const maybeWorkflow = context.engine.workflow;
        const collection = options.collection || context.schematic.collection.description.name;
        if (!maybeWorkflow) {
            throw new Error('Need Workflow to support executing schematics as post tasks.');
        }
        return maybeWorkflow.execute({
            collection: collection,
            schematic: options.name,
            options: options.options,
            // Allow private when calling from the same collection.
            allowPrivate: collection == context.schematic.collection.description.name,
        });
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL3J1bi1zY2hlbWF0aWMvZXhlY3V0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFLSDtJQUNFLE9BQU8sQ0FBQyxPQUFnRCxFQUFFLE9BQXlCLEVBQUUsRUFBRTtRQUNyRixJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRTtZQUNsQixNQUFNLElBQUksS0FBSyxDQUNiLDZFQUE2RSxDQUM5RSxDQUFDO1NBQ0g7UUFFRCxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUM5QyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7UUFFdkYsSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLDhEQUE4RCxDQUFDLENBQUM7U0FDakY7UUFFRCxPQUFPLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFDM0IsVUFBVSxFQUFFLFVBQVU7WUFDdEIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxJQUFJO1lBQ3ZCLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTztZQUN4Qix1REFBdUQ7WUFDdkQsWUFBWSxFQUFFLFVBQVUsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSTtTQUMxRSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7QUFDSixDQUFDO0FBdkJELDRCQXVCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBTY2hlbWF0aWNDb250ZXh0LCBUYXNrRXhlY3V0b3IgfSBmcm9tICcuLi8uLi9zcmMnO1xuaW1wb3J0IHsgUnVuU2NoZW1hdGljVGFza09wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoKTogVGFza0V4ZWN1dG9yPFJ1blNjaGVtYXRpY1Rhc2tPcHRpb25zPHt9Pj4ge1xuICByZXR1cm4gKG9wdGlvbnM6IFJ1blNjaGVtYXRpY1Rhc2tPcHRpb25zPHt9PiB8IHVuZGVmaW5lZCwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGlmICghb3B0aW9ucz8ubmFtZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnUnVuU2NoZW1hdGljVGFzayByZXF1aXJlcyBhbiBvcHRpb25zIG9iamVjdCB3aXRoIGEgbm9uLWVtcHR5IG5hbWUgcHJvcGVydHkuJyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgbWF5YmVXb3JrZmxvdyA9IGNvbnRleHQuZW5naW5lLndvcmtmbG93O1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBvcHRpb25zLmNvbGxlY3Rpb24gfHwgY29udGV4dC5zY2hlbWF0aWMuY29sbGVjdGlvbi5kZXNjcmlwdGlvbi5uYW1lO1xuXG4gICAgaWYgKCFtYXliZVdvcmtmbG93KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05lZWQgV29ya2Zsb3cgdG8gc3VwcG9ydCBleGVjdXRpbmcgc2NoZW1hdGljcyBhcyBwb3N0IHRhc2tzLicpO1xuICAgIH1cblxuICAgIHJldHVybiBtYXliZVdvcmtmbG93LmV4ZWN1dGUoe1xuICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbixcbiAgICAgIHNjaGVtYXRpYzogb3B0aW9ucy5uYW1lLFxuICAgICAgb3B0aW9uczogb3B0aW9ucy5vcHRpb25zLFxuICAgICAgLy8gQWxsb3cgcHJpdmF0ZSB3aGVuIGNhbGxpbmcgZnJvbSB0aGUgc2FtZSBjb2xsZWN0aW9uLlxuICAgICAgYWxsb3dQcml2YXRlOiBjb2xsZWN0aW9uID09IGNvbnRleHQuc2NoZW1hdGljLmNvbGxlY3Rpb24uZGVzY3JpcHRpb24ubmFtZSxcbiAgICB9KTtcbiAgfTtcbn1cbiJdfQ==