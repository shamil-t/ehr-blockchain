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
exports.TestingArchitectHost = void 0;
const src_1 = require("../src");
class TestingArchitectHost {
    /**
     * Can provide a backend host, in case of integration tests.
     * @param workspaceRoot The workspace root to use.
     * @param currentDirectory The current directory to use.
     * @param _backendHost A host to defer calls that aren't resolved here.
     */
    constructor(workspaceRoot = '', currentDirectory = workspaceRoot, _backendHost = null) {
        this.workspaceRoot = workspaceRoot;
        this.currentDirectory = currentDirectory;
        this._backendHost = _backendHost;
        this._builderImportMap = new Map();
        this._builderMap = new Map();
        this._targetMap = new Map();
    }
    addBuilder(builderName, builder, description = 'Testing only builder.', optionSchema = { type: 'object' }) {
        this._builderImportMap.set(builderName, builder);
        this._builderMap.set(builderName, { builderName, description, optionSchema });
    }
    async addBuilderFromPackage(packageName) {
        const packageJson = await Promise.resolve(`${packageName + '/package.json'}`).then(s => __importStar(require(s)));
        if (!('builders' in packageJson)) {
            throw new Error('Invalid package.json, builders key not found.');
        }
        if (!packageJson.name) {
            throw new Error('Invalid package name');
        }
        const builderJsonPath = packageName + '/' + packageJson['builders'];
        const builderJson = await Promise.resolve(`${builderJsonPath}`).then(s => __importStar(require(s)));
        const builders = builderJson['builders'];
        if (!builders) {
            throw new Error('Invalid builders.json, builders key not found.');
        }
        for (const builderName of Object.keys(builders)) {
            const b = builders[builderName];
            // TODO: remove this check as v1 is not supported anymore.
            if (!b.implementation) {
                continue;
            }
            const handler = (await Promise.resolve(`${builderJsonPath + '/../' + b.implementation}`).then(s => __importStar(require(s)))).default;
            const optionsSchema = await Promise.resolve(`${builderJsonPath + '/../' + b.schema}`).then(s => __importStar(require(s)));
            this.addBuilder(`${packageJson.name}:${builderName}`, handler, b.description, optionsSchema);
        }
    }
    addTarget(target, builderName, options = {}) {
        this._targetMap.set((0, src_1.targetStringFromTarget)(target), { builderName, options });
    }
    async getBuilderNameForTarget(target) {
        const name = (0, src_1.targetStringFromTarget)(target);
        const maybeTarget = this._targetMap.get(name);
        if (!maybeTarget) {
            return this._backendHost && this._backendHost.getBuilderNameForTarget(target);
        }
        return maybeTarget.builderName;
    }
    /**
     * Resolve a builder. This needs to return a string which will be used in a dynamic `import()`
     * clause. This should throw if no builder can be found. The dynamic import will throw if
     * it is unsupported.
     * @param builderName The name of the builder to be used.
     * @returns All the info needed for the builder itself.
     */
    async resolveBuilder(builderName) {
        return (this._builderMap.get(builderName) ||
            (this._backendHost && this._backendHost.resolveBuilder(builderName)));
    }
    async getCurrentDirectory() {
        return this.currentDirectory;
    }
    async getWorkspaceRoot() {
        return this.workspaceRoot;
    }
    async getOptionsForTarget(target) {
        const name = (0, src_1.targetStringFromTarget)(target);
        const maybeTarget = this._targetMap.get(name);
        if (!maybeTarget) {
            return this._backendHost && this._backendHost.getOptionsForTarget(target);
        }
        return maybeTarget.options;
    }
    async getProjectMetadata(target) {
        return this._backendHost && this._backendHost.getProjectMetadata(target);
    }
    async loadBuilder(info) {
        return (this._builderImportMap.get(info.builderName) ||
            (this._backendHost && this._backendHost.loadBuilder(info)));
    }
}
exports.TestingArchitectHost = TestingArchitectHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZy1hcmNoaXRlY3QtaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2FyY2hpdGVjdC90ZXN0aW5nL3Rlc3RpbmctYXJjaGl0ZWN0LWhvc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCxnQ0FBcUU7QUFHckUsTUFBYSxvQkFBb0I7SUFLL0I7Ozs7O09BS0c7SUFDSCxZQUNTLGdCQUFnQixFQUFFLEVBQ2xCLG1CQUFtQixhQUFhLEVBQy9CLGVBQXFDLElBQUk7UUFGMUMsa0JBQWEsR0FBYixhQUFhLENBQUs7UUFDbEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFnQjtRQUMvQixpQkFBWSxHQUFaLFlBQVksQ0FBNkI7UUFiM0Msc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQW1CLENBQUM7UUFDL0MsZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztRQUM3QyxlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQTZELENBQUM7SUFZdkYsQ0FBQztJQUVKLFVBQVUsQ0FDUixXQUFtQixFQUNuQixPQUFnQixFQUNoQixXQUFXLEdBQUcsdUJBQXVCLEVBQ3JDLGVBQXVDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtRQUV6RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7SUFDaEYsQ0FBQztJQUNELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxXQUFtQjtRQUM3QyxNQUFNLFdBQVcsR0FBRyx5QkFBYSxXQUFXLEdBQUcsZUFBZSx1Q0FBQyxDQUFDO1FBQ2hFLElBQUks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QUM7UUFDOUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNoQixPQUFPLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMzRTtRQUVELE9BQU8sV0FBVyxDQUFDLE9BQU8sQ0FBQztJQUM3QixDQUFDO0lBRUQsS0FBSyxDQUFDLGtCQUFrQixDQUFDLE1BQXVCO1FBQzlDLE9BQU8sSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLE1BQWdCLENBQUMsQ0FBQztJQUNyRixDQUFDO0lBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFpQjtRQUNqQyxPQUFPLENBQ0wsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQzVDLENBQUMsSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUMzRCxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBN0dELG9EQTZHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBqc29uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgQnVpbGRlckluZm8sIFRhcmdldCwgdGFyZ2V0U3RyaW5nRnJvbVRhcmdldCB9IGZyb20gJy4uL3NyYyc7XG5pbXBvcnQgeyBBcmNoaXRlY3RIb3N0LCBCdWlsZGVyIH0gZnJvbSAnLi4vc3JjL2ludGVybmFsJztcblxuZXhwb3J0IGNsYXNzIFRlc3RpbmdBcmNoaXRlY3RIb3N0IGltcGxlbWVudHMgQXJjaGl0ZWN0SG9zdCB7XG4gIHByaXZhdGUgX2J1aWxkZXJJbXBvcnRNYXAgPSBuZXcgTWFwPHN0cmluZywgQnVpbGRlcj4oKTtcbiAgcHJpdmF0ZSBfYnVpbGRlck1hcCA9IG5ldyBNYXA8c3RyaW5nLCBCdWlsZGVySW5mbz4oKTtcbiAgcHJpdmF0ZSBfdGFyZ2V0TWFwID0gbmV3IE1hcDxzdHJpbmcsIHsgYnVpbGRlck5hbWU6IHN0cmluZzsgb3B0aW9uczoganNvbi5Kc29uT2JqZWN0IH0+KCk7XG5cbiAgLyoqXG4gICAqIENhbiBwcm92aWRlIGEgYmFja2VuZCBob3N0LCBpbiBjYXNlIG9mIGludGVncmF0aW9uIHRlc3RzLlxuICAgKiBAcGFyYW0gd29ya3NwYWNlUm9vdCBUaGUgd29ya3NwYWNlIHJvb3QgdG8gdXNlLlxuICAgKiBAcGFyYW0gY3VycmVudERpcmVjdG9yeSBUaGUgY3VycmVudCBkaXJlY3RvcnkgdG8gdXNlLlxuICAgKiBAcGFyYW0gX2JhY2tlbmRIb3N0IEEgaG9zdCB0byBkZWZlciBjYWxscyB0aGF0IGFyZW4ndCByZXNvbHZlZCBoZXJlLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHdvcmtzcGFjZVJvb3QgPSAnJyxcbiAgICBwdWJsaWMgY3VycmVudERpcmVjdG9yeSA9IHdvcmtzcGFjZVJvb3QsXG4gICAgcHJpdmF0ZSBfYmFja2VuZEhvc3Q6IEFyY2hpdGVjdEhvc3QgfCBudWxsID0gbnVsbCxcbiAgKSB7fVxuXG4gIGFkZEJ1aWxkZXIoXG4gICAgYnVpbGRlck5hbWU6IHN0cmluZyxcbiAgICBidWlsZGVyOiBCdWlsZGVyLFxuICAgIGRlc2NyaXB0aW9uID0gJ1Rlc3Rpbmcgb25seSBidWlsZGVyLicsXG4gICAgb3B0aW9uU2NoZW1hOiBqc29uLnNjaGVtYS5Kc29uU2NoZW1hID0geyB0eXBlOiAnb2JqZWN0JyB9LFxuICApIHtcbiAgICB0aGlzLl9idWlsZGVySW1wb3J0TWFwLnNldChidWlsZGVyTmFtZSwgYnVpbGRlcik7XG4gICAgdGhpcy5fYnVpbGRlck1hcC5zZXQoYnVpbGRlck5hbWUsIHsgYnVpbGRlck5hbWUsIGRlc2NyaXB0aW9uLCBvcHRpb25TY2hlbWEgfSk7XG4gIH1cbiAgYXN5bmMgYWRkQnVpbGRlckZyb21QYWNrYWdlKHBhY2thZ2VOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBwYWNrYWdlSnNvbiA9IGF3YWl0IGltcG9ydChwYWNrYWdlTmFtZSArICcvcGFja2FnZS5qc29uJyk7XG4gICAgaWYgKCEoJ2J1aWxkZXJzJyBpbiBwYWNrYWdlSnNvbikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYWNrYWdlLmpzb24sIGJ1aWxkZXJzIGtleSBub3QgZm91bmQuJyk7XG4gICAgfVxuXG4gICAgaWYgKCFwYWNrYWdlSnNvbi5uYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGFja2FnZSBuYW1lJyk7XG4gICAgfVxuXG4gICAgY29uc3QgYnVpbGRlckpzb25QYXRoID0gcGFja2FnZU5hbWUgKyAnLycgKyBwYWNrYWdlSnNvblsnYnVpbGRlcnMnXTtcbiAgICBjb25zdCBidWlsZGVySnNvbiA9IGF3YWl0IGltcG9ydChidWlsZGVySnNvblBhdGgpO1xuICAgIGNvbnN0IGJ1aWxkZXJzID0gYnVpbGRlckpzb25bJ2J1aWxkZXJzJ107XG4gICAgaWYgKCFidWlsZGVycykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJ1aWxkZXJzLmpzb24sIGJ1aWxkZXJzIGtleSBub3QgZm91bmQuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBidWlsZGVyTmFtZSBvZiBPYmplY3Qua2V5cyhidWlsZGVycykpIHtcbiAgICAgIGNvbnN0IGIgPSBidWlsZGVyc1tidWlsZGVyTmFtZV07XG4gICAgICAvLyBUT0RPOiByZW1vdmUgdGhpcyBjaGVjayBhcyB2MSBpcyBub3Qgc3VwcG9ydGVkIGFueW1vcmUuXG4gICAgICBpZiAoIWIuaW1wbGVtZW50YXRpb24pIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBoYW5kbGVyID0gKGF3YWl0IGltcG9ydChidWlsZGVySnNvblBhdGggKyAnLy4uLycgKyBiLmltcGxlbWVudGF0aW9uKSkuZGVmYXVsdDtcbiAgICAgIGNvbnN0IG9wdGlvbnNTY2hlbWEgPSBhd2FpdCBpbXBvcnQoYnVpbGRlckpzb25QYXRoICsgJy8uLi8nICsgYi5zY2hlbWEpO1xuICAgICAgdGhpcy5hZGRCdWlsZGVyKGAke3BhY2thZ2VKc29uLm5hbWV9OiR7YnVpbGRlck5hbWV9YCwgaGFuZGxlciwgYi5kZXNjcmlwdGlvbiwgb3B0aW9uc1NjaGVtYSk7XG4gICAgfVxuICB9XG4gIGFkZFRhcmdldCh0YXJnZXQ6IFRhcmdldCwgYnVpbGRlck5hbWU6IHN0cmluZywgb3B0aW9uczoganNvbi5Kc29uT2JqZWN0ID0ge30pIHtcbiAgICB0aGlzLl90YXJnZXRNYXAuc2V0KHRhcmdldFN0cmluZ0Zyb21UYXJnZXQodGFyZ2V0KSwgeyBidWlsZGVyTmFtZSwgb3B0aW9ucyB9KTtcbiAgfVxuXG4gIGFzeW5jIGdldEJ1aWxkZXJOYW1lRm9yVGFyZ2V0KHRhcmdldDogVGFyZ2V0KTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgY29uc3QgbmFtZSA9IHRhcmdldFN0cmluZ0Zyb21UYXJnZXQodGFyZ2V0KTtcbiAgICBjb25zdCBtYXliZVRhcmdldCA9IHRoaXMuX3RhcmdldE1hcC5nZXQobmFtZSk7XG4gICAgaWYgKCFtYXliZVRhcmdldCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2JhY2tlbmRIb3N0ICYmIHRoaXMuX2JhY2tlbmRIb3N0LmdldEJ1aWxkZXJOYW1lRm9yVGFyZ2V0KHRhcmdldCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1heWJlVGFyZ2V0LmJ1aWxkZXJOYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmUgYSBidWlsZGVyLiBUaGlzIG5lZWRzIHRvIHJldHVybiBhIHN0cmluZyB3aGljaCB3aWxsIGJlIHVzZWQgaW4gYSBkeW5hbWljIGBpbXBvcnQoKWBcbiAgICogY2xhdXNlLiBUaGlzIHNob3VsZCB0aHJvdyBpZiBubyBidWlsZGVyIGNhbiBiZSBmb3VuZC4gVGhlIGR5bmFtaWMgaW1wb3J0IHdpbGwgdGhyb3cgaWZcbiAgICogaXQgaXMgdW5zdXBwb3J0ZWQuXG4gICAqIEBwYXJhbSBidWlsZGVyTmFtZSBUaGUgbmFtZSBvZiB0aGUgYnVpbGRlciB0byBiZSB1c2VkLlxuICAgKiBAcmV0dXJucyBBbGwgdGhlIGluZm8gbmVlZGVkIGZvciB0aGUgYnVpbGRlciBpdHNlbGYuXG4gICAqL1xuICBhc3luYyByZXNvbHZlQnVpbGRlcihidWlsZGVyTmFtZTogc3RyaW5nKTogUHJvbWlzZTxCdWlsZGVySW5mbyB8IG51bGw+IHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5fYnVpbGRlck1hcC5nZXQoYnVpbGRlck5hbWUpIHx8XG4gICAgICAodGhpcy5fYmFja2VuZEhvc3QgJiYgdGhpcy5fYmFja2VuZEhvc3QucmVzb2x2ZUJ1aWxkZXIoYnVpbGRlck5hbWUpKVxuICAgICk7XG4gIH1cblxuICBhc3luYyBnZXRDdXJyZW50RGlyZWN0b3J5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudERpcmVjdG9yeTtcbiAgfVxuICBhc3luYyBnZXRXb3Jrc3BhY2VSb290KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMud29ya3NwYWNlUm9vdDtcbiAgfVxuXG4gIGFzeW5jIGdldE9wdGlvbnNGb3JUYXJnZXQodGFyZ2V0OiBUYXJnZXQpOiBQcm9taXNlPGpzb24uSnNvbk9iamVjdCB8IG51bGw+IHtcbiAgICBjb25zdCBuYW1lID0gdGFyZ2V0U3RyaW5nRnJvbVRhcmdldCh0YXJnZXQpO1xuICAgIGNvbnN0IG1heWJlVGFyZ2V0ID0gdGhpcy5fdGFyZ2V0TWFwLmdldChuYW1lKTtcbiAgICBpZiAoIW1heWJlVGFyZ2V0KSB7XG4gICAgICByZXR1cm4gdGhpcy5fYmFja2VuZEhvc3QgJiYgdGhpcy5fYmFja2VuZEhvc3QuZ2V0T3B0aW9uc0ZvclRhcmdldCh0YXJnZXQpO1xuICAgIH1cblxuICAgIHJldHVybiBtYXliZVRhcmdldC5vcHRpb25zO1xuICB9XG5cbiAgYXN5bmMgZ2V0UHJvamVjdE1ldGFkYXRhKHRhcmdldDogVGFyZ2V0IHwgc3RyaW5nKTogUHJvbWlzZTxqc29uLkpzb25PYmplY3QgfCBudWxsPiB7XG4gICAgcmV0dXJuIHRoaXMuX2JhY2tlbmRIb3N0ICYmIHRoaXMuX2JhY2tlbmRIb3N0LmdldFByb2plY3RNZXRhZGF0YSh0YXJnZXQgYXMgc3RyaW5nKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRCdWlsZGVyKGluZm86IEJ1aWxkZXJJbmZvKTogUHJvbWlzZTxCdWlsZGVyIHwgbnVsbD4ge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLl9idWlsZGVySW1wb3J0TWFwLmdldChpbmZvLmJ1aWxkZXJOYW1lKSB8fFxuICAgICAgKHRoaXMuX2JhY2tlbmRIb3N0ICYmIHRoaXMuX2JhY2tlbmRIb3N0LmxvYWRCdWlsZGVyKGluZm8pKVxuICAgICk7XG4gIH1cbn1cbiJdfQ==