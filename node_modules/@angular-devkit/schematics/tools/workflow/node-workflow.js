"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeWorkflow = void 0;
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const schematics_1 = require("@angular-devkit/schematics");
const node_2 = require("../../tasks/node");
const node_module_engine_host_1 = require("../node-module-engine-host");
const schema_option_transform_1 = require("../schema-option-transform");
/**
 * A workflow specifically for Node tools.
 */
class NodeWorkflow extends schematics_1.workflow.BaseWorkflow {
    constructor(hostOrRoot, options) {
        let host;
        let root;
        if (typeof hostOrRoot === 'string') {
            root = (0, core_1.normalize)(hostOrRoot);
            host = new core_1.virtualFs.ScopedHost(new node_1.NodeJsSyncHost(), root);
        }
        else {
            host = hostOrRoot;
            root = options.root;
        }
        const engineHost = options.engineHostCreator?.(options) || new node_module_engine_host_1.NodeModulesEngineHost(options.resolvePaths);
        super({
            host,
            engineHost,
            force: options.force,
            dryRun: options.dryRun,
            registry: options.registry,
        });
        engineHost.registerTaskExecutor(node_2.BuiltinTaskExecutor.NodePackage, {
            allowPackageManagerOverride: true,
            packageManager: options.packageManager,
            force: options.packageManagerForce,
            rootDirectory: root && (0, core_1.getSystemPath)(root),
            registry: options.packageRegistry,
        });
        engineHost.registerTaskExecutor(node_2.BuiltinTaskExecutor.RepositoryInitializer, {
            rootDirectory: root && (0, core_1.getSystemPath)(root),
        });
        engineHost.registerTaskExecutor(node_2.BuiltinTaskExecutor.RunSchematic);
        if (options.optionTransforms) {
            for (const transform of options.optionTransforms) {
                engineHost.registerOptionsTransform(transform);
            }
        }
        if (options.schemaValidation) {
            engineHost.registerOptionsTransform((0, schema_option_transform_1.validateOptionsWithSchema)(this.registry));
        }
        this._context = [];
    }
    get engine() {
        return this._engine;
    }
    get engineHost() {
        return this._engineHost;
    }
}
exports.NodeWorkflow = NodeWorkflow;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS13b3JrZmxvdy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3MvdG9vbHMvd29ya2Zsb3cvbm9kZS13b3JrZmxvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBeUY7QUFDekYsb0RBQTJEO0FBQzNELDJEQUFzRDtBQUN0RCwyQ0FBdUQ7QUFHdkQsd0VBQW1FO0FBQ25FLHdFQUF1RTtBQWV2RTs7R0FFRztBQUNILE1BQWEsWUFBYSxTQUFRLHFCQUFRLENBQUMsWUFBWTtJQUtyRCxZQUFZLFVBQW1DLEVBQUUsT0FBOEM7UUFDN0YsSUFBSSxJQUFJLENBQUM7UUFDVCxJQUFJLElBQUksQ0FBQztRQUNULElBQUksT0FBTyxVQUFVLEtBQUssUUFBUSxFQUFFO1lBQ2xDLElBQUksR0FBRyxJQUFBLGdCQUFTLEVBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0IsSUFBSSxHQUFHLElBQUksZ0JBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxxQkFBYyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDN0Q7YUFBTTtZQUNMLElBQUksR0FBRyxVQUFVLENBQUM7WUFDbEIsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7U0FDckI7UUFFRCxNQUFNLFVBQVUsR0FDZCxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLCtDQUFxQixDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMxRixLQUFLLENBQUM7WUFDSixJQUFJO1lBQ0osVUFBVTtZQUVWLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSztZQUNwQixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07WUFDdEIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO1NBQzNCLENBQUMsQ0FBQztRQUVILFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQywwQkFBbUIsQ0FBQyxXQUFXLEVBQUU7WUFDL0QsMkJBQTJCLEVBQUUsSUFBSTtZQUNqQyxjQUFjLEVBQUUsT0FBTyxDQUFDLGNBQWM7WUFDdEMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxtQkFBbUI7WUFDbEMsYUFBYSxFQUFFLElBQUksSUFBSSxJQUFBLG9CQUFhLEVBQUMsSUFBSSxDQUFDO1lBQzFDLFFBQVEsRUFBRSxPQUFPLENBQUMsZUFBZTtTQUNsQyxDQUFDLENBQUM7UUFDSCxVQUFVLENBQUMsb0JBQW9CLENBQUMsMEJBQW1CLENBQUMscUJBQXFCLEVBQUU7WUFDekUsYUFBYSxFQUFFLElBQUksSUFBSSxJQUFBLG9CQUFhLEVBQUMsSUFBSSxDQUFDO1NBQzNDLENBQUMsQ0FBQztRQUNILFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQywwQkFBbUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUVsRSxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRTtZQUM1QixLQUFLLE1BQU0sU0FBUyxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDaEQsVUFBVSxDQUFDLHdCQUF3QixDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ2hEO1NBQ0Y7UUFFRCxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRTtZQUM1QixVQUFVLENBQUMsd0JBQXdCLENBQUMsSUFBQSxtREFBeUIsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztTQUMvRTtRQUVELElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxJQUFhLE1BQU07UUFDakIsT0FBTyxJQUFJLENBQUMsT0FBMkIsQ0FBQztJQUMxQyxDQUFDO0lBQ0QsSUFBYSxVQUFVO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLFdBQW9DLENBQUM7SUFDbkQsQ0FBQztDQUNGO0FBMURELG9DQTBEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBQYXRoLCBnZXRTeXN0ZW1QYXRoLCBub3JtYWxpemUsIHNjaGVtYSwgdmlydHVhbEZzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgTm9kZUpzU3luY0hvc3QgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZS9ub2RlJztcbmltcG9ydCB7IHdvcmtmbG93IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHsgQnVpbHRpblRhc2tFeGVjdXRvciB9IGZyb20gJy4uLy4uL3Rhc2tzL25vZGUnO1xuaW1wb3J0IHsgRmlsZVN5c3RlbUVuZ2luZSB9IGZyb20gJy4uL2Rlc2NyaXB0aW9uJztcbmltcG9ydCB7IE9wdGlvblRyYW5zZm9ybSB9IGZyb20gJy4uL2ZpbGUtc3lzdGVtLWVuZ2luZS1ob3N0LWJhc2UnO1xuaW1wb3J0IHsgTm9kZU1vZHVsZXNFbmdpbmVIb3N0IH0gZnJvbSAnLi4vbm9kZS1tb2R1bGUtZW5naW5lLWhvc3QnO1xuaW1wb3J0IHsgdmFsaWRhdGVPcHRpb25zV2l0aFNjaGVtYSB9IGZyb20gJy4uL3NjaGVtYS1vcHRpb24tdHJhbnNmb3JtJztcblxuZXhwb3J0IGludGVyZmFjZSBOb2RlV29ya2Zsb3dPcHRpb25zIHtcbiAgZm9yY2U/OiBib29sZWFuO1xuICBkcnlSdW4/OiBib29sZWFuO1xuICBwYWNrYWdlTWFuYWdlcj86IHN0cmluZztcbiAgcGFja2FnZU1hbmFnZXJGb3JjZT86IGJvb2xlYW47XG4gIHBhY2thZ2VSZWdpc3RyeT86IHN0cmluZztcbiAgcmVnaXN0cnk/OiBzY2hlbWEuQ29yZVNjaGVtYVJlZ2lzdHJ5O1xuICByZXNvbHZlUGF0aHM/OiBzdHJpbmdbXTtcbiAgc2NoZW1hVmFsaWRhdGlvbj86IGJvb2xlYW47XG4gIG9wdGlvblRyYW5zZm9ybXM/OiBPcHRpb25UcmFuc2Zvcm08UmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsLCBvYmplY3Q+W107XG4gIGVuZ2luZUhvc3RDcmVhdG9yPzogKG9wdGlvbnM6IE5vZGVXb3JrZmxvd09wdGlvbnMpID0+IE5vZGVNb2R1bGVzRW5naW5lSG9zdDtcbn1cblxuLyoqXG4gKiBBIHdvcmtmbG93IHNwZWNpZmljYWxseSBmb3IgTm9kZSB0b29scy5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVXb3JrZmxvdyBleHRlbmRzIHdvcmtmbG93LkJhc2VXb3JrZmxvdyB7XG4gIGNvbnN0cnVjdG9yKHJvb3Q6IHN0cmluZywgb3B0aW9uczogTm9kZVdvcmtmbG93T3B0aW9ucyk7XG5cbiAgY29uc3RydWN0b3IoaG9zdDogdmlydHVhbEZzLkhvc3QsIG9wdGlvbnM6IE5vZGVXb3JrZmxvd09wdGlvbnMgJiB7IHJvb3Q/OiBQYXRoIH0pO1xuXG4gIGNvbnN0cnVjdG9yKGhvc3RPclJvb3Q6IHZpcnR1YWxGcy5Ib3N0IHwgc3RyaW5nLCBvcHRpb25zOiBOb2RlV29ya2Zsb3dPcHRpb25zICYgeyByb290PzogUGF0aCB9KSB7XG4gICAgbGV0IGhvc3Q7XG4gICAgbGV0IHJvb3Q7XG4gICAgaWYgKHR5cGVvZiBob3N0T3JSb290ID09PSAnc3RyaW5nJykge1xuICAgICAgcm9vdCA9IG5vcm1hbGl6ZShob3N0T3JSb290KTtcbiAgICAgIGhvc3QgPSBuZXcgdmlydHVhbEZzLlNjb3BlZEhvc3QobmV3IE5vZGVKc1N5bmNIb3N0KCksIHJvb3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICBob3N0ID0gaG9zdE9yUm9vdDtcbiAgICAgIHJvb3QgPSBvcHRpb25zLnJvb3Q7XG4gICAgfVxuXG4gICAgY29uc3QgZW5naW5lSG9zdCA9XG4gICAgICBvcHRpb25zLmVuZ2luZUhvc3RDcmVhdG9yPy4ob3B0aW9ucykgfHwgbmV3IE5vZGVNb2R1bGVzRW5naW5lSG9zdChvcHRpb25zLnJlc29sdmVQYXRocyk7XG4gICAgc3VwZXIoe1xuICAgICAgaG9zdCxcbiAgICAgIGVuZ2luZUhvc3QsXG5cbiAgICAgIGZvcmNlOiBvcHRpb25zLmZvcmNlLFxuICAgICAgZHJ5UnVuOiBvcHRpb25zLmRyeVJ1bixcbiAgICAgIHJlZ2lzdHJ5OiBvcHRpb25zLnJlZ2lzdHJ5LFxuICAgIH0pO1xuXG4gICAgZW5naW5lSG9zdC5yZWdpc3RlclRhc2tFeGVjdXRvcihCdWlsdGluVGFza0V4ZWN1dG9yLk5vZGVQYWNrYWdlLCB7XG4gICAgICBhbGxvd1BhY2thZ2VNYW5hZ2VyT3ZlcnJpZGU6IHRydWUsXG4gICAgICBwYWNrYWdlTWFuYWdlcjogb3B0aW9ucy5wYWNrYWdlTWFuYWdlcixcbiAgICAgIGZvcmNlOiBvcHRpb25zLnBhY2thZ2VNYW5hZ2VyRm9yY2UsXG4gICAgICByb290RGlyZWN0b3J5OiByb290ICYmIGdldFN5c3RlbVBhdGgocm9vdCksXG4gICAgICByZWdpc3RyeTogb3B0aW9ucy5wYWNrYWdlUmVnaXN0cnksXG4gICAgfSk7XG4gICAgZW5naW5lSG9zdC5yZWdpc3RlclRhc2tFeGVjdXRvcihCdWlsdGluVGFza0V4ZWN1dG9yLlJlcG9zaXRvcnlJbml0aWFsaXplciwge1xuICAgICAgcm9vdERpcmVjdG9yeTogcm9vdCAmJiBnZXRTeXN0ZW1QYXRoKHJvb3QpLFxuICAgIH0pO1xuICAgIGVuZ2luZUhvc3QucmVnaXN0ZXJUYXNrRXhlY3V0b3IoQnVpbHRpblRhc2tFeGVjdXRvci5SdW5TY2hlbWF0aWMpO1xuXG4gICAgaWYgKG9wdGlvbnMub3B0aW9uVHJhbnNmb3Jtcykge1xuICAgICAgZm9yIChjb25zdCB0cmFuc2Zvcm0gb2Ygb3B0aW9ucy5vcHRpb25UcmFuc2Zvcm1zKSB7XG4gICAgICAgIGVuZ2luZUhvc3QucmVnaXN0ZXJPcHRpb25zVHJhbnNmb3JtKHRyYW5zZm9ybSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuc2NoZW1hVmFsaWRhdGlvbikge1xuICAgICAgZW5naW5lSG9zdC5yZWdpc3Rlck9wdGlvbnNUcmFuc2Zvcm0odmFsaWRhdGVPcHRpb25zV2l0aFNjaGVtYSh0aGlzLnJlZ2lzdHJ5KSk7XG4gICAgfVxuXG4gICAgdGhpcy5fY29udGV4dCA9IFtdO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IGVuZ2luZSgpOiBGaWxlU3lzdGVtRW5naW5lIHtcbiAgICByZXR1cm4gdGhpcy5fZW5naW5lIGFzIEZpbGVTeXN0ZW1FbmdpbmU7XG4gIH1cbiAgb3ZlcnJpZGUgZ2V0IGVuZ2luZUhvc3QoKTogTm9kZU1vZHVsZXNFbmdpbmVIb3N0IHtcbiAgICByZXR1cm4gdGhpcy5fZW5naW5lSG9zdCBhcyBOb2RlTW9kdWxlc0VuZ2luZUhvc3Q7XG4gIH1cbn1cbiJdfQ==