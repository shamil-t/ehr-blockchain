"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeModulesTestEngineHost = void 0;
const node_module_engine_host_1 = require("./node-module-engine-host");
/**
 * An EngineHost that uses a registry to super seed locations of collection.json files, but
 * revert back to using node modules resolution. This is done for testing.
 */
class NodeModulesTestEngineHost extends node_module_engine_host_1.NodeModulesEngineHost {
    constructor() {
        super(...arguments);
        this._collections = new Map();
        this._tasks = [];
    }
    get tasks() {
        return this._tasks;
    }
    clearTasks() {
        this._tasks = [];
    }
    registerCollection(name, path) {
        this._collections.set(name, path);
    }
    transformContext(context) {
        const oldAddTask = context.addTask;
        context.addTask = (task, dependencies) => {
            this._tasks.push(task.toConfiguration());
            return oldAddTask.call(context, task, dependencies);
        };
        return context;
    }
    _resolveCollectionPath(name, requester) {
        const maybePath = this._collections.get(name);
        if (maybePath) {
            return maybePath;
        }
        return super._resolveCollectionPath(name, requester);
    }
}
exports.NodeModulesTestEngineHost = NodeModulesTestEngineHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS1tb2R1bGVzLXRlc3QtZW5naW5lLWhvc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rvb2xzL25vZGUtbW9kdWxlcy10ZXN0LWVuZ2luZS1ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUlILHVFQUFrRTtBQUVsRTs7O0dBR0c7QUFDSCxNQUFhLHlCQUEwQixTQUFRLCtDQUFxQjtJQUFwRTs7UUFDVSxpQkFBWSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1FBQ3pDLFdBQU0sR0FBRyxFQUF5QixDQUFDO0lBaUM3QyxDQUFDO0lBL0JDLElBQUksS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBRUQsVUFBVTtRQUNSLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFFRCxrQkFBa0IsQ0FBQyxJQUFZLEVBQUUsSUFBWTtRQUMzQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVRLGdCQUFnQixDQUFDLE9BQW1DO1FBQzNELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFDbkMsT0FBTyxDQUFDLE9BQU8sR0FBRyxDQUFDLElBQW9DLEVBQUUsWUFBNEIsRUFBRSxFQUFFO1lBQ3ZGLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1lBRXpDLE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQztRQUVGLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFa0Isc0JBQXNCLENBQUMsSUFBWSxFQUFFLFNBQWtCO1FBQ3hFLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlDLElBQUksU0FBUyxFQUFFO1lBQ2IsT0FBTyxTQUFTLENBQUM7U0FDbEI7UUFFRCxPQUFPLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdkQsQ0FBQztDQUNGO0FBbkNELDhEQW1DQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBUYXNrQ29uZmlndXJhdGlvbiwgVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3IsIFRhc2tJZCB9IGZyb20gJy4uL3NyYy9lbmdpbmUnO1xuaW1wb3J0IHsgRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQgfSBmcm9tICcuL2Rlc2NyaXB0aW9uJztcbmltcG9ydCB7IE5vZGVNb2R1bGVzRW5naW5lSG9zdCB9IGZyb20gJy4vbm9kZS1tb2R1bGUtZW5naW5lLWhvc3QnO1xuXG4vKipcbiAqIEFuIEVuZ2luZUhvc3QgdGhhdCB1c2VzIGEgcmVnaXN0cnkgdG8gc3VwZXIgc2VlZCBsb2NhdGlvbnMgb2YgY29sbGVjdGlvbi5qc29uIGZpbGVzLCBidXRcbiAqIHJldmVydCBiYWNrIHRvIHVzaW5nIG5vZGUgbW9kdWxlcyByZXNvbHV0aW9uLiBUaGlzIGlzIGRvbmUgZm9yIHRlc3RpbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBOb2RlTW9kdWxlc1Rlc3RFbmdpbmVIb3N0IGV4dGVuZHMgTm9kZU1vZHVsZXNFbmdpbmVIb3N0IHtcbiAgcHJpdmF0ZSBfY29sbGVjdGlvbnMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBwcml2YXRlIF90YXNrcyA9IFtdIGFzIFRhc2tDb25maWd1cmF0aW9uW107XG5cbiAgZ2V0IHRhc2tzKCkge1xuICAgIHJldHVybiB0aGlzLl90YXNrcztcbiAgfVxuXG4gIGNsZWFyVGFza3MoKSB7XG4gICAgdGhpcy5fdGFza3MgPSBbXTtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29sbGVjdGlvbihuYW1lOiBzdHJpbmcsIHBhdGg6IHN0cmluZykge1xuICAgIHRoaXMuX2NvbGxlY3Rpb25zLnNldChuYW1lLCBwYXRoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHRyYW5zZm9ybUNvbnRleHQoY29udGV4dDogRmlsZVN5c3RlbVNjaGVtYXRpY0NvbnRleHQpOiBGaWxlU3lzdGVtU2NoZW1hdGljQ29udGV4dCB7XG4gICAgY29uc3Qgb2xkQWRkVGFzayA9IGNvbnRleHQuYWRkVGFzaztcbiAgICBjb250ZXh0LmFkZFRhc2sgPSAodGFzazogVGFza0NvbmZpZ3VyYXRpb25HZW5lcmF0b3I8e30+LCBkZXBlbmRlbmNpZXM/OiBBcnJheTxUYXNrSWQ+KSA9PiB7XG4gICAgICB0aGlzLl90YXNrcy5wdXNoKHRhc2sudG9Db25maWd1cmF0aW9uKCkpO1xuXG4gICAgICByZXR1cm4gb2xkQWRkVGFzay5jYWxsKGNvbnRleHQsIHRhc2ssIGRlcGVuZGVuY2llcyk7XG4gICAgfTtcblxuICAgIHJldHVybiBjb250ZXh0O1xuICB9XG5cbiAgcHJvdGVjdGVkIG92ZXJyaWRlIF9yZXNvbHZlQ29sbGVjdGlvblBhdGgobmFtZTogc3RyaW5nLCByZXF1ZXN0ZXI/OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1heWJlUGF0aCA9IHRoaXMuX2NvbGxlY3Rpb25zLmdldChuYW1lKTtcbiAgICBpZiAobWF5YmVQYXRoKSB7XG4gICAgICByZXR1cm4gbWF5YmVQYXRoO1xuICAgIH1cblxuICAgIHJldHVybiBzdXBlci5fcmVzb2x2ZUNvbGxlY3Rpb25QYXRoKG5hbWUsIHJlcXVlc3Rlcik7XG4gIH1cbn1cbiJdfQ==