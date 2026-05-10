"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const generate_from_files_1 = require("../utility/generate-from-files");
const schema_1 = require("./schema");
function default_1(options) {
    if (!options.implements) {
        throw new schematics_1.SchematicsException('Option "implements" is required.');
    }
    if (options.implements.length > 1 && options.functional) {
        throw new schematics_1.SchematicsException('Can only specify one value for implements when generating a functional guard.');
    }
    if (options.functional) {
        const guardType = options.implements[0] + 'Fn';
        return (0, generate_from_files_1.generateFromFiles)({ ...options, templateFilesDirectory: './type-files' }, { guardType });
    }
    else {
        const implementations = options.implements
            .map((implement) => (implement === 'CanDeactivate' ? 'CanDeactivate<unknown>' : implement))
            .join(', ');
        const commonRouterNameImports = ['ActivatedRouteSnapshot', 'RouterStateSnapshot'];
        const routerNamedImports = [...options.implements, 'UrlTree'];
        if (options.implements.includes(schema_1.Implement.CanMatch)) {
            routerNamedImports.push('Route', 'UrlSegment');
            if (options.implements.length > 1) {
                routerNamedImports.push(...commonRouterNameImports);
            }
        }
        else {
            routerNamedImports.push(...commonRouterNameImports);
        }
        routerNamedImports.sort();
        const routerImports = routerNamedImports.join(', ');
        return (0, generate_from_files_1.generateFromFiles)({ ...options, templateFilesDirectory: './implements-files' }, {
            implementations,
            routerImports,
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9zY2hlbWF0aWNzL2FuZ3VsYXIvZ3VhcmQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCwyREFBdUU7QUFFdkUsd0VBQW1FO0FBRW5FLHFDQUErRTtBQUUvRSxtQkFBeUIsT0FBcUI7SUFDNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7UUFDdkIsTUFBTSxJQUFJLGdDQUFtQixDQUFDLGtDQUFrQyxDQUFDLENBQUM7S0FDbkU7SUFDRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxFQUFFO1FBQ3ZELE1BQU0sSUFBSSxnQ0FBbUIsQ0FDM0IsK0VBQStFLENBQ2hGLENBQUM7S0FDSDtJQUVELElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRTtRQUN0QixNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUUvQyxPQUFPLElBQUEsdUNBQWlCLEVBQUMsRUFBRSxHQUFHLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxjQUFjLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7S0FDakc7U0FBTTtRQUNMLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxVQUFVO2FBQ3ZDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxTQUFTLEtBQUssZUFBZSxDQUFDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDMUYsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2QsTUFBTSx1QkFBdUIsR0FBRyxDQUFDLHdCQUF3QixFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFDbEYsTUFBTSxrQkFBa0IsR0FBYSxDQUFDLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUV4RSxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLGtCQUFjLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDeEQsa0JBQWtCLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUUvQyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDakMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEdBQUcsdUJBQXVCLENBQUMsQ0FBQzthQUNyRDtTQUNGO2FBQU07WUFDTCxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsR0FBRyx1QkFBdUIsQ0FBQyxDQUFDO1NBQ3JEO1FBRUQsa0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFMUIsTUFBTSxhQUFhLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXBELE9BQU8sSUFBQSx1Q0FBaUIsRUFDdEIsRUFBRSxHQUFHLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxvQkFBb0IsRUFBRSxFQUM1RDtZQUNFLGVBQWU7WUFDZixhQUFhO1NBQ2QsQ0FDRixDQUFDO0tBQ0g7QUFDSCxDQUFDO0FBM0NELDRCQTJDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBSdWxlLCBTY2hlbWF0aWNzRXhjZXB0aW9uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuXG5pbXBvcnQgeyBnZW5lcmF0ZUZyb21GaWxlcyB9IGZyb20gJy4uL3V0aWxpdHkvZ2VuZXJhdGUtZnJvbS1maWxlcyc7XG5cbmltcG9ydCB7IEltcGxlbWVudCBhcyBHdWFyZEludGVyZmFjZSwgU2NoZW1hIGFzIEd1YXJkT3B0aW9ucyB9IGZyb20gJy4vc2NoZW1hJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM6IEd1YXJkT3B0aW9ucyk6IFJ1bGUge1xuICBpZiAoIW9wdGlvbnMuaW1wbGVtZW50cykge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKCdPcHRpb24gXCJpbXBsZW1lbnRzXCIgaXMgcmVxdWlyZWQuJyk7XG4gIH1cbiAgaWYgKG9wdGlvbnMuaW1wbGVtZW50cy5sZW5ndGggPiAxICYmIG9wdGlvbnMuZnVuY3Rpb25hbCkge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgJ0NhbiBvbmx5IHNwZWNpZnkgb25lIHZhbHVlIGZvciBpbXBsZW1lbnRzIHdoZW4gZ2VuZXJhdGluZyBhIGZ1bmN0aW9uYWwgZ3VhcmQuJyxcbiAgICApO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuZnVuY3Rpb25hbCkge1xuICAgIGNvbnN0IGd1YXJkVHlwZSA9IG9wdGlvbnMuaW1wbGVtZW50c1swXSArICdGbic7XG5cbiAgICByZXR1cm4gZ2VuZXJhdGVGcm9tRmlsZXMoeyAuLi5vcHRpb25zLCB0ZW1wbGF0ZUZpbGVzRGlyZWN0b3J5OiAnLi90eXBlLWZpbGVzJyB9LCB7IGd1YXJkVHlwZSB9KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBpbXBsZW1lbnRhdGlvbnMgPSBvcHRpb25zLmltcGxlbWVudHNcbiAgICAgIC5tYXAoKGltcGxlbWVudCkgPT4gKGltcGxlbWVudCA9PT0gJ0NhbkRlYWN0aXZhdGUnID8gJ0NhbkRlYWN0aXZhdGU8dW5rbm93bj4nIDogaW1wbGVtZW50KSlcbiAgICAgIC5qb2luKCcsICcpO1xuICAgIGNvbnN0IGNvbW1vblJvdXRlck5hbWVJbXBvcnRzID0gWydBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90JywgJ1JvdXRlclN0YXRlU25hcHNob3QnXTtcbiAgICBjb25zdCByb3V0ZXJOYW1lZEltcG9ydHM6IHN0cmluZ1tdID0gWy4uLm9wdGlvbnMuaW1wbGVtZW50cywgJ1VybFRyZWUnXTtcblxuICAgIGlmIChvcHRpb25zLmltcGxlbWVudHMuaW5jbHVkZXMoR3VhcmRJbnRlcmZhY2UuQ2FuTWF0Y2gpKSB7XG4gICAgICByb3V0ZXJOYW1lZEltcG9ydHMucHVzaCgnUm91dGUnLCAnVXJsU2VnbWVudCcpO1xuXG4gICAgICBpZiAob3B0aW9ucy5pbXBsZW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgcm91dGVyTmFtZWRJbXBvcnRzLnB1c2goLi4uY29tbW9uUm91dGVyTmFtZUltcG9ydHMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByb3V0ZXJOYW1lZEltcG9ydHMucHVzaCguLi5jb21tb25Sb3V0ZXJOYW1lSW1wb3J0cyk7XG4gICAgfVxuXG4gICAgcm91dGVyTmFtZWRJbXBvcnRzLnNvcnQoKTtcblxuICAgIGNvbnN0IHJvdXRlckltcG9ydHMgPSByb3V0ZXJOYW1lZEltcG9ydHMuam9pbignLCAnKTtcblxuICAgIHJldHVybiBnZW5lcmF0ZUZyb21GaWxlcyhcbiAgICAgIHsgLi4ub3B0aW9ucywgdGVtcGxhdGVGaWxlc0RpcmVjdG9yeTogJy4vaW1wbGVtZW50cy1maWxlcycgfSxcbiAgICAgIHtcbiAgICAgICAgaW1wbGVtZW50YXRpb25zLFxuICAgICAgICByb3V0ZXJJbXBvcnRzLFxuICAgICAgfSxcbiAgICApO1xuICB9XG59XG4iXX0=