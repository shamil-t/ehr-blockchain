"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeModulesEngineHost = exports.NodePackageDoesNotSupportSchematics = void 0;
const core_1 = require("@angular-devkit/core");
const path_1 = require("path");
const export_ref_1 = require("./export-ref");
const file_system_engine_host_base_1 = require("./file-system-engine-host-base");
const file_system_utility_1 = require("./file-system-utility");
class NodePackageDoesNotSupportSchematics extends core_1.BaseException {
    constructor(name) {
        super(`Package ${JSON.stringify(name)} was found but does not support schematics.`);
    }
}
exports.NodePackageDoesNotSupportSchematics = NodePackageDoesNotSupportSchematics;
/**
 * A simple EngineHost that uses NodeModules to resolve collections.
 */
class NodeModulesEngineHost extends file_system_engine_host_base_1.FileSystemEngineHostBase {
    constructor(paths) {
        super();
        this.paths = paths;
    }
    resolve(name, requester, references = new Set()) {
        // Keep track of the package requesting the schematic, in order to avoid infinite recursion
        if (requester) {
            if (references.has(requester)) {
                references.add(requester);
                throw new Error('Circular schematic reference detected: ' + JSON.stringify(Array.from(references)));
            }
            else {
                references.add(requester);
            }
        }
        const relativeBase = requester ? (0, path_1.dirname)(requester) : process.cwd();
        let collectionPath = undefined;
        if (name.startsWith('.')) {
            name = (0, path_1.resolve)(relativeBase, name);
        }
        const resolveOptions = {
            paths: requester ? [(0, path_1.dirname)(requester), ...(this.paths || [])] : this.paths,
        };
        // Try to resolve as a package
        try {
            const packageJsonPath = require.resolve((0, path_1.join)(name, 'package.json'), resolveOptions);
            const { schematics } = require(packageJsonPath);
            if (!schematics || typeof schematics !== 'string') {
                throw new NodePackageDoesNotSupportSchematics(name);
            }
            // If this is a relative path to the collection, then create the collection
            // path in relation to the package path
            if (schematics.startsWith('.')) {
                const packageDirectory = (0, path_1.dirname)(packageJsonPath);
                collectionPath = (0, path_1.resolve)(packageDirectory, schematics);
            }
            // Otherwise treat this as a package, and recurse to find the collection path
            else {
                collectionPath = this.resolve(schematics, packageJsonPath, references);
            }
        }
        catch (e) {
            if (e.code !== 'MODULE_NOT_FOUND') {
                throw e;
            }
        }
        // If not a package, try to resolve as a file
        if (!collectionPath) {
            try {
                collectionPath = require.resolve(name, resolveOptions);
            }
            catch (e) {
                if (e.code !== 'MODULE_NOT_FOUND') {
                    throw e;
                }
            }
        }
        // If not a package or a file, error
        if (!collectionPath) {
            throw new file_system_engine_host_base_1.CollectionCannotBeResolvedException(name);
        }
        return collectionPath;
    }
    _resolveCollectionPath(name, requester) {
        const collectionPath = this.resolve(name, requester);
        (0, file_system_utility_1.readJsonFile)(collectionPath);
        return collectionPath;
    }
    _resolveReferenceString(refString, parentPath, collectionDescription) {
        const ref = new export_ref_1.ExportStringRef(refString, parentPath);
        if (!ref.ref) {
            return null;
        }
        return { ref: ref.ref, path: ref.module };
    }
    _transformCollectionDescription(name, desc) {
        if (!desc.schematics || typeof desc.schematics != 'object') {
            throw new file_system_engine_host_base_1.CollectionMissingSchematicsMapException(name);
        }
        return {
            ...desc,
            name,
        };
    }
    _transformSchematicDescription(name, _collection, desc) {
        if (!desc.factoryFn || !desc.path || !desc.description) {
            throw new file_system_engine_host_base_1.SchematicMissingFieldsException(name);
        }
        return desc;
    }
}
exports.NodeModulesEngineHost = NodeModulesEngineHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS1tb2R1bGUtZW5naW5lLWhvc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rvb2xzL25vZGUtbW9kdWxlLWVuZ2luZS1ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUFxRDtBQUNyRCwrQkFBOEM7QUFHOUMsNkNBQStDO0FBQy9DLGlGQUt3QztBQUN4QywrREFBcUQ7QUFFckQsTUFBYSxtQ0FBb0MsU0FBUSxvQkFBYTtJQUNwRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLFdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsNkNBQTZDLENBQUMsQ0FBQztJQUN0RixDQUFDO0NBQ0Y7QUFKRCxrRkFJQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxxQkFBc0IsU0FBUSx1REFBd0I7SUFDakUsWUFBNkIsS0FBZ0I7UUFDM0MsS0FBSyxFQUFFLENBQUM7UUFEbUIsVUFBSyxHQUFMLEtBQUssQ0FBVztJQUU3QyxDQUFDO0lBRU8sT0FBTyxDQUFDLElBQVksRUFBRSxTQUFrQixFQUFFLGFBQWEsSUFBSSxHQUFHLEVBQVU7UUFDOUUsMkZBQTJGO1FBQzNGLElBQUksU0FBUyxFQUFFO1lBQ2IsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUM3QixVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLElBQUksS0FBSyxDQUNiLHlDQUF5QyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUNuRixDQUFDO2FBQ0g7aUJBQU07Z0JBQ0wsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUMzQjtTQUNGO1FBRUQsTUFBTSxZQUFZLEdBQUcsU0FBUyxD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QUFNLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBRVMsK0JBQStCLENBQ3ZDLElBQVksRUFDWixJQUF1QztRQUV2QyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxPQUFPLElBQUksQ0FBQyxVQUFVLElBQUksUUFBUSxFQUFFO1lBQzFELE1BQU0sSUFBSSxzRUFBdUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN6RDtRQUVELE9BQU87WUFDTCxHQUFHLElBQUk7WUFDUCxJQUFJO1NBQ3VCLENBQUM7SUFDaEMsQ0FBQztJQUVTLDhCQUE4QixDQUN0QyxJQUFZLEVBQ1osV0FBcUMsRUFDckMsSUFBc0M7UUFFdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUN0RCxNQUFNLElBQUksOERBQStCLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakQ7UUFFRCxPQUFPLElBQStCLENBQUM7SUFDekMsQ0FBQztDQUNGO0FBdEhELHNEQXNIQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgZGlybmFtZSwgam9pbiwgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgUnVsZUZhY3RvcnkgfSBmcm9tICcuLi9zcmMnO1xuaW1wb3J0IHsgRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLCBGaWxlU3lzdGVtU2NoZW1hdGljRGVzYyB9IGZyb20gJy4vZGVzY3JpcHRpb24nO1xuaW1wb3J0IHsgRXhwb3J0U3RyaW5nUmVmIH0gZnJvbSAnLi9leHBvcnQtcmVmJztcbmltcG9ydCB7XG4gIENvbGxlY3Rpb25DYW5ub3RCZVJlc29sdmVkRXhjZXB0aW9uLFxuICBDb2xsZWN0aW9uTWlzc2luZ1NjaGVtYXRpY3NNYXBFeGNlcHRpb24sXG4gIEZpbGVTeXN0ZW1FbmdpbmVIb3N0QmFzZSxcbiAgU2NoZW1hdGljTWlzc2luZ0ZpZWxkc0V4Y2VwdGlvbixcbn0gZnJvbSAnLi9maWxlLXN5c3RlbS1lbmdpbmUtaG9zdC1iYXNlJztcbmltcG9ydCB7IHJlYWRKc29uRmlsZSB9IGZyb20gJy4vZmlsZS1zeXN0ZW0tdXRpbGl0eSc7XG5cbmV4cG9ydCBjbGFzcyBOb2RlUGFja2FnZURvZXNOb3RTdXBwb3J0U2NoZW1hdGljcyBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgUGFja2FnZSAke0pTT04uc3RyaW5naWZ5KG5hbWUpfSB3YXMgZm91bmQgYnV0IGRvZXMgbm90IHN1cHBvcnQgc2NoZW1hdGljcy5gKTtcbiAgfVxufVxuXG4vKipcbiAqIEEgc2ltcGxlIEVuZ2luZUhvc3QgdGhhdCB1c2VzIE5vZGVNb2R1bGVzIHRvIHJlc29sdmUgY29sbGVjdGlvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBOb2RlTW9kdWxlc0VuZ2luZUhvc3QgZXh0ZW5kcyBGaWxlU3lzdGVtRW5naW5lSG9zdEJhc2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHBhdGhzPzogc3RyaW5nW10pIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZXNvbHZlKG5hbWU6IHN0cmluZywgcmVxdWVzdGVyPzogc3RyaW5nLCByZWZlcmVuY2VzID0gbmV3IFNldDxzdHJpbmc+KCkpOiBzdHJpbmcge1xuICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIHBhY2thZ2UgcmVxdWVzdGluZyB0aGUgc2NoZW1hdGljLCBpbiBvcmRlciB0byBhdm9pZCBpbmZpbml0ZSByZWN1cnNpb25cbiAgICBpZiAocmVxdWVzdGVyKSB7XG4gICAgICBpZiAocmVmZXJlbmNlcy5oYXMocmVxdWVzdGVyKSkge1xuICAgICAgICByZWZlcmVuY2VzLmFkZChyZXF1ZXN0ZXIpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ0NpcmN1bGFyIHNjaGVtYXRpYyByZWZlcmVuY2UgZGV0ZWN0ZWQ6ICcgKyBKU09OLnN0cmluZ2lmeShBcnJheS5mcm9tKHJlZmVyZW5jZXMpKSxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZmVyZW5jZXMuYWRkKHJlcXVlc3Rlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcmVsYXRpdmVCYXNlID0gcmVxdWVzdGVyID8gZGlybmFtZShyZXF1ZXN0ZXIpIDogcHJvY2Vzcy5jd2QoKTtcbiAgICBsZXQgY29sbGVjdGlvblBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgIGlmIChuYW1lLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgbmFtZSA9IHJlc29sdmUocmVsYXRpdmVCYXNlLCBuYW1lKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNvbHZlT3B0aW9ucyA9IHtcbiAgICAgIHBhdGhzOiByZXF1ZXN0ZXIgPyBbZGlybmFtZShyZXF1ZXN0ZXIpLCAuLi4odGhpcy5wYXRocyB8fCBbXSldIDogdGhpcy5wYXRocyxcbiAgICB9O1xuXG4gICAgLy8gVHJ5IHRvIHJlc29sdmUgYXMgYSBwYWNrYWdlXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhY2thZ2VKc29uUGF0aCA9IHJlcXVpcmUucmVzb2x2ZShqb2luKG5hbWUsICdwYWNrYWdlLmpzb24nKSwgcmVzb2x2ZU9wdGlvbnMpO1xuICAgICAgY29uc3QgeyBzY2hlbWF0aWNzIH0gPSByZXF1aXJlKHBhY2thZ2VKc29uUGF0aCk7XG5cbiAgICAgIGlmICghc2NoZW1hdGljcyB8fCB0eXBlb2Ygc2NoZW1hdGljcyAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IE5vZGVQYWNrYWdlRG9lc05vdFN1cHBvcnRTY2hlbWF0aWNzKG5hbWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGlzIGlzIGEgcmVsYXRpdmUgcGF0aCB0byB0aGUgY29sbGVjdGlvbiwgdGhlbiBjcmVhdGUgdGhlIGNvbGxlY3Rpb25cbiAgICAgIC8vIHBhdGggaW4gcmVsYXRpb24gdG8gdGhlIHBhY2thZ2UgcGF0aFxuICAgICAgaWYgKHNjaGVtYXRpY3Muc3RhcnRzV2l0aCgnLicpKSB7XG4gICAgICAgIGNvbnN0IHBhY2thZ2VEaXJlY3RvcnkgPSBkaXJuYW1lKHBhY2thZ2VKc29uUGF0aCk7XG4gICAgICAgIGNvbGxlY3Rpb25QYXRoID0gcmVzb2x2ZShwYWNrYWdlRGlyZWN0b3J5LCBzY2hlbWF0aWNzKTtcbiAgICAgIH1cbiAgICAgIC8vIE90aGVyd2lzZSB0cmVhdCB0aGlzIGFzIGEgcGFja2FnZSwgYW5kIHJlY3Vyc2UgdG8gZmluZCB0aGUgY29sbGVjdGlvbiBwYXRoXG4gICAgICBlbHNlIHtcbiAgICAgICAgY29sbGVjdGlvblBhdGggPSB0aGlzLnJlc29sdmUoc2NoZW1hdGljcywgcGFja2FnZUpzb25QYXRoLCByZWZlcmVuY2VzKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoKGUgYXMgTm9kZUpTLkVycm5vRXhjZXB0aW9uKS5jb2RlICE9PSAnTU9EVUxFX05PVF9GT1VORCcpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBub3QgYSBwYWNrYWdlLCB0cnkgdG8gcmVzb2x2ZSBhcyBhIGZpbGVcbiAgICBpZiAoIWNvbGxlY3Rpb25QYXRoKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb2xsZWN0aW9uUGF0aCA9IHJlcXVpcmUucmVzb2x2ZShuYW1lLCByZXNvbHZlT3B0aW9ucyk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmICgoZSBhcyBOb2RlSlMuRXJybm9FeGNlcHRpb24pLmNvZGUgIT09ICdNT0RVTEVfTk9UX0ZPVU5EJykge1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBub3QgYSBwYWNrYWdlIG9yIGEgZmlsZSwgZXJyb3JcbiAgICBpZiAoIWNvbGxlY3Rpb25QYXRoKSB7XG4gICAgICB0aHJvdyBuZXcgQ29sbGVjdGlvbkNhbm5vdEJlUmVzb2x2ZWRFeGNlcHRpb24obmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb25QYXRoO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZTogc3RyaW5nLCByZXF1ZXN0ZXI/OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbGxlY3Rpb25QYXRoID0gdGhpcy5yZXNvbHZlKG5hbWUsIHJlcXVlc3Rlcik7XG4gICAgcmVhZEpzb25GaWxlKGNvbGxlY3Rpb25QYXRoKTtcblxuICAgIHJldHVybiBjb2xsZWN0aW9uUGF0aDtcbiAgfVxuXG4gIHByb3RlY3RlZCBfcmVzb2x2ZVJlZmVyZW5jZVN0cmluZyhcbiAgICByZWZTdHJpbmc6IHN0cmluZyxcbiAgICBwYXJlbnRQYXRoOiBzdHJpbmcsXG4gICAgY29sbGVjdGlvbkRlc2NyaXB0aW9uPzogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjLFxuICApIHtcbiAgICBjb25zdCByZWYgPSBuZXcgRXhwb3J0U3RyaW5nUmVmPFJ1bGVGYWN0b3J5PHt9Pj4ocmVmU3RyaW5nLCBwYXJlbnRQYXRoKTtcbiAgICBpZiAoIXJlZi5yZWYpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB7IHJlZjogcmVmLnJlZiwgcGF0aDogcmVmLm1vZHVsZSB9O1xuICB9XG5cbiAgcHJvdGVjdGVkIF90cmFuc2Zvcm1Db2xsZWN0aW9uRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGRlc2M6IFBhcnRpYWw8RmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjPixcbiAgKTogRmlsZVN5c3RlbUNvbGxlY3Rpb25EZXNjIHtcbiAgICBpZiAoIWRlc2Muc2NoZW1hdGljcyB8fCB0eXBlb2YgZGVzYy5zY2hlbWF0aWNzICE9ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgQ29sbGVjdGlvbk1pc3NpbmdTY2hlbWF0aWNzTWFwRXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAuLi5kZXNjLFxuICAgICAgbmFtZSxcbiAgICB9IGFzIEZpbGVTeXN0ZW1Db2xsZWN0aW9uRGVzYztcbiAgfVxuXG4gIHByb3RlY3RlZCBfdHJhbnNmb3JtU2NoZW1hdGljRGVzY3JpcHRpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIF9jb2xsZWN0aW9uOiBGaWxlU3lzdGVtQ29sbGVjdGlvbkRlc2MsXG4gICAgZGVzYzogUGFydGlhbDxGaWxlU3lzdGVtU2NoZW1hdGljRGVzYz4sXG4gICk6IEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjIHtcbiAgICBpZiAoIWRlc2MuZmFjdG9yeUZuIHx8ICFkZXNjLnBhdGggfHwgIWRlc2MuZGVzY3JpcHRpb24pIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNNaXNzaW5nRmllbGRzRXhjZXB0aW9uKG5hbWUpO1xuICAgIH1cblxuICAgIHJldHVybiBkZXNjIGFzIEZpbGVTeXN0ZW1TY2hlbWF0aWNEZXNjO1xuICB9XG59XG4iXX0=