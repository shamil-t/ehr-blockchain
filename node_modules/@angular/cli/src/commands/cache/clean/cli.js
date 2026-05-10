"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheCleanModule = void 0;
const fs_1 = require("fs");
const command_module_1 = require("../../../command-builder/command-module");
const utilities_1 = require("../utilities");
class CacheCleanModule extends command_module_1.CommandModule {
    constructor() {
        super(...arguments);
        this.command = 'clean';
        this.describe = 'Deletes persistent disk cache from disk.';
        this.scope = command_module_1.CommandScope.In;
    }
    builder(localYargs) {
        return localYargs.strict();
    }
    run() {
        const { path } = (0, utilities_1.getCacheConfig)(this.context.workspace);
        return fs_1.promises.rm(path, {
            force: true,
            recursive: true,
            maxRetries: 3,
        });
    }
}
exports.CacheCleanModule = CacheCleanModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL2NvbW1hbmRzL2NhY2hlL2NsZWFuL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwyQkFBb0M7QUFFcEMsNEVBSWlEO0FBQ2pELDRDQUE4QztBQUU5QyxNQUFhLGdCQUFpQixTQUFRLDhCQUFhO0lBQW5EOztRQUNFLFlBQU8sR0FBRyxPQUFPLENBQUM7UUFDbEIsYUFBUSxHQUFHLDBDQUEwQyxDQUFDO1FBRTdDLFVBQUssR0FBRyw2QkFBWSxDQUFDLEVBQUUsQ0FBQztJQWVuQyxDQUFDO0lBYkMsT0FBTyxDQUFDLFVBQWdCO1FBQ3RCLE9BQU8sVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFRCxHQUFHO1FBQ0QsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUEsMEJBQWMsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXhELE9BQU8sYUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUU7WUFDakIsS0FBSyxFQUFFLElBQUk7WUFDWCxTQUFTLEVBQUUsSUFBSTtZQUNmLFVBQVUsRUFBRSxDQUFDO1NBQ2QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbkJELDRDQW1CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IEFyZ3YgfSBmcm9tICd5YXJncyc7XG5pbXBvcnQge1xuICBDb21tYW5kTW9kdWxlLFxuICBDb21tYW5kTW9kdWxlSW1wbGVtZW50YXRpb24sXG4gIENvbW1hbmRTY29wZSxcbn0gZnJvbSAnLi4vLi4vLi4vY29tbWFuZC1idWlsZGVyL2NvbW1hbmQtbW9kdWxlJztcbmltcG9ydCB7IGdldENhY2hlQ29uZmlnIH0gZnJvbSAnLi4vdXRpbGl0aWVzJztcblxuZXhwb3J0IGNsYXNzIENhY2hlQ2xlYW5Nb2R1bGUgZXh0ZW5kcyBDb21tYW5kTW9kdWxlIGltcGxlbWVudHMgQ29tbWFuZE1vZHVsZUltcGxlbWVudGF0aW9uIHtcbiAgY29tbWFuZCA9ICdjbGVhbic7XG4gIGRlc2NyaWJlID0gJ0RlbGV0ZXMgcGVyc2lzdGVudCBkaXNrIGNhY2hlIGZyb20gZGlzay4nO1xuICBsb25nRGVzY3JpcHRpb25QYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIG92ZXJyaWRlIHNjb3BlID0gQ29tbWFuZFNjb3BlLkluO1xuXG4gIGJ1aWxkZXIobG9jYWxZYXJnczogQXJndik6IEFyZ3Yge1xuICAgIHJldHVybiBsb2NhbFlhcmdzLnN0cmljdCgpO1xuICB9XG5cbiAgcnVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgcGF0aCB9ID0gZ2V0Q2FjaGVDb25maWcodGhpcy5jb250ZXh0LndvcmtzcGFjZSk7XG5cbiAgICByZXR1cm4gZnMucm0ocGF0aCwge1xuICAgICAgZm9yY2U6IHRydWUsXG4gICAgICByZWN1cnNpdmU6IHRydWUsXG4gICAgICBtYXhSZXRyaWVzOiAzLFxuICAgIH0pO1xuICB9XG59XG4iXX0=