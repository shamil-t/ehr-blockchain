"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetDefinitionCollection = exports.ProjectDefinitionCollection = void 0;
class DefinitionCollection {
    constructor(initial, _listener) {
        this._listener = _listener;
        this._map = new Map(initial && Object.entries(initial));
    }
    delete(key) {
        const result = this._map.delete(key);
        if (result) {
            this._listener?.(key, undefined, this);
        }
        return result;
    }
    set(key, value) {
        const updatedValue = value !== this.get(key);
        if (updatedValue) {
            this._map.set(key, value);
            this._listener?.(key, value, this);
        }
        return this;
    }
    forEach(callbackfn, thisArg) {
        this._map.forEach((value, key) => callbackfn(value, key, this), thisArg);
    }
    get(key) {
        return this._map.get(key);
    }
    has(key) {
        return this._map.has(key);
    }
    get size() {
        return this._map.size;
    }
    [Symbol.iterator]() {
        return this._map[Symbol.iterator]();
    }
    entries() {
        return this._map.entries();
    }
    keys() {
        return this._map.keys();
    }
    values() {
        return this._map.values();
    }
}
function isJsonValue(value) {
    const visited = new Set();
    switch (typeof value) {
        case 'boolean':
        case 'number':
        case 'string':
            return true;
        case 'object':
            if (value === null) {
                return true;
            }
            visited.add(value);
            for (const property of Object.values(value)) {
                if (typeof value === 'object' && visited.has(property)) {
                    continue;
                }
                if (!isJsonValue(property)) {
                    return false;
                }
            }
            return true;
        default:
            return false;
    }
}
class ProjectDefinitionCollection extends DefinitionCollection {
    constructor(initial, listener) {
        super(initial, listener);
    }
    add(definition) {
        if (this.has(definition.name)) {
            throw new Error('Project name already exists.');
        }
        this._validateName(definition.name);
        const project = {
            root: definition.root,
            prefix: definition.prefix,
            sourceRoot: definition.sourceRoot,
            targets: new TargetDefinitionCollection(),
            extensions: {},
        };
        if (definition.targets) {
            for (const [name, target] of Object.entries(definition.targets)) {
                if (target) {
                    project.targets.set(name, target);
                }
            }
        }
        for (const [name, value] of Object.entries(definition)) {
            switch (name) {
                case 'name':
                case 'root':
                case 'sourceRoot':
                case 'prefix':
                case 'targets':
                    break;
                default:
                    if (isJsonValue(value)) {
                        project.extensions[name] = value;
                    }
                    else {
                        throw new TypeError(`"${name}" must be a JSON value.`);
                    }
                    break;
            }
        }
        super.set(definition.name, project);
        return project;
    }
    set(name, value) {
        this._validateName(name);
        super.set(name, value);
        return this;
    }
    _validateName(name) {
        if (typeof name !== 'string' || !/^(?:@\w[\w.-]*\/)?\w[\w.-]*$/.test(name)) {
            throw new Error('Project name must be a valid npm package name.');
        }
    }
}
exports.ProjectDefinitionCollection = ProjectDefinitionCollection;
class TargetDefinitionCollection extends DefinitionCollection {
    constructor(initial, listener) {
        super(initial, listener);
    }
    add(definition) {
        if (this.has(definition.name)) {
            throw new Error('Target name already exists.');
        }
        this._validateName(definition.name);
        const target = {
            builder: definition.builder,
            options: definition.options,
            configurations: definition.configurations,
            defaultConfiguration: definition.defaultConfiguration,
        };
        super.set(definition.name, target);
        return target;
    }
    set(name, value) {
        this._validateName(name);
        super.set(name, value);
        return this;
    }
    _validateName(name) {
        if (typeof name !== 'string') {
            throw new TypeError('Target name must be a string.');
        }
    }
}
exports.TargetDefinitionCollection = TargetDefinitionCollection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy93b3Jrc3BhY2UvZGVmaW5pdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBK0JILE1BQU0sb0JBQW9CO0lBR3hCLFlBQVksT0FBMkIsRUFBVSxTQUEyQztRQUEzQyxjQUFTLEdBQVQsU0FBUyxDQUFrQztRQUMxRixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFXO1FBQ2hCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXJDLElBQUksTUFBTSxFQUFFO1lBQ1YsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDeEM7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsR0FBRyxDQUFDLEdBQVcsRUFBRSxLQUFRO1FBQ3ZCLE1BQU0sWUFBWSxHQUFHLEtBQUssS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTdDLElBQUksWUFBWSxFQUFFO1lBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNwQztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE9BQU8sQ0FDTCxVQUF5RSxFQUN6RSxPQUFXO1FBRVgsSUFBSSxDQUFD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ZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEpzb25WYWx1ZSB9IGZyb20gJy4uL2pzb24nO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtzcGFjZURlZmluaXRpb24ge1xuICByZWFkb25seSBleHRlbnNpb25zOiBSZWNvcmQ8c3RyaW5nLCBKc29uVmFsdWUgfCB1bmRlZmluZWQ+O1xuICByZWFkb25seSBwcm9qZWN0czogUHJvamVjdERlZmluaXRpb25Db2xsZWN0aW9uO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByb2plY3REZWZpbml0aW9uIHtcbiAgcmVhZG9ubHkgZXh0ZW5zaW9uczogUmVjb3JkPHN0cmluZywgSnNvblZhbHVlIHwgdW5kZWZpbmVkPjtcbiAgcmVhZG9ubHkgdGFyZ2V0czogVGFyZ2V0RGVmaW5pdGlvbkNvbGxlY3Rpb247XG5cbiAgcm9vdDogc3RyaW5nO1xuICBwcmVmaXg/OiBzdHJpbmc7XG4gIHNvdXJjZVJvb3Q/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFyZ2V0RGVmaW5pdGlvbiB7XG4gIG9wdGlvbnM/OiBSZWNvcmQ8c3RyaW5nLCBKc29uVmFsdWUgfCB1bmRlZmluZWQ+O1xuICBjb25maWd1cmF0aW9ucz86IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIEpzb25WYWx1ZSB8IHVuZGVmaW5lZD4gfCB1bmRlZmluZWQ+O1xuICBkZWZhdWx0Q29uZmlndXJhdGlvbj86IHN0cmluZztcbiAgYnVpbGRlcjogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBEZWZpbml0aW9uQ29sbGVjdGlvbkxpc3RlbmVyPFYgZXh0ZW5kcyBvYmplY3Q+ID0gKFxuICBuYW1lOiBzdHJpbmcsXG4gIG5ld1ZhbHVlOiBWIHwgdW5kZWZpbmVkLFxuICBjb2xsZWN0aW9uOiBEZWZpbml0aW9uQ29sbGVjdGlvbjxWPixcbikgPT4gdm9pZDtcblxuY2xhc3MgRGVmaW5pdGlvbkNvbGxlY3Rpb248ViBleHRlbmRzIG9iamVjdD4gaW1wbGVtZW50cyBSZWFkb25seU1hcDxzdHJpbmcsIFY+IHtcbiAgcHJpdmF0ZSBfbWFwOiBNYXA8c3RyaW5nLCBWPjtcblxuICBjb25zdHJ1Y3Rvcihpbml0aWFsPzogUmVjb3JkPHN0cmluZywgVj4sIHByaXZhdGUgX2xpc3RlbmVyPzogRGVmaW5pdGlvbkNvbGxlY3Rpb25MaXN0ZW5lcjxWPikge1xuICAgIHRoaXMuX21hcCA9IG5ldyBNYXAoaW5pdGlhbCAmJiBPYmplY3QuZW50cmllcyhpbml0aWFsKSk7XG4gIH1cblxuICBkZWxldGUoa2V5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9tYXAuZGVsZXRlKGtleSk7XG5cbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICB0aGlzLl9saXN0ZW5lcj8uKGtleSwgdW5kZWZpbmVkLCB0aGlzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogVik6IHRoaXMge1xuICAgIGNvbnN0IHVwZGF0ZWRWYWx1ZSA9IHZhbHVlICE9PSB0aGlzLmdldChrZXkpO1xuXG4gICAgaWYgKHVwZGF0ZWRWYWx1ZSkge1xuICAgICAgdGhpcy5fbWFwLnNldChrZXksIHZhbHVlKTtcbiAgICAgIHRoaXMuX2xpc3RlbmVyPy4oa2V5LCB2YWx1ZSwgdGhpcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBmb3JFYWNoPFQ+KFxuICAgIGNhbGxiYWNrZm46ICh2YWx1ZTogViwga2V5OiBzdHJpbmcsIG1hcDogRGVmaW5pdGlvbkNvbGxlY3Rpb248Vj4pID0+IHZvaWQsXG4gICAgdGhpc0FyZz86IFQsXG4gICk6IHZvaWQge1xuICAgIHRoaXMuX21hcC5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiBjYWxsYmFja2ZuKHZhbHVlLCBrZXksIHRoaXMpLCB0aGlzQXJnKTtcbiAgfVxuXG4gIGdldChrZXk6IHN0cmluZyk6IFYgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9tYXAuZ2V0KGtleSk7XG4gIH1cblxuICBoYXMoa2V5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fbWFwLmhhcyhrZXkpO1xuICB9XG5cbiAgZ2V0IHNpemUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fbWFwLnNpemU7XG4gIH1cblxuICBbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPFtzdHJpbmcsIFZdPiB7XG4gICAgcmV0dXJuIHRoaXMuX21hcFtTeW1ib2wuaXRlcmF0b3JdKCk7XG4gIH1cblxuICBlbnRyaWVzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8W3N0cmluZywgVl0+IHtcbiAgICByZXR1cm4gdGhpcy5fbWFwLmVudHJpZXMoKTtcbiAgfVxuXG4gIGtleXMoKTogSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5fbWFwLmtleXMoKTtcbiAgfVxuXG4gIHZhbHVlcygpOiBJdGVyYWJsZUl0ZXJhdG9yPFY+IHtcbiAgICByZXR1cm4gdGhpcy5fbWFwLnZhbHVlcygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzSnNvblZhbHVlKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgSnNvblZhbHVlIHtcbiAgY29uc3QgdmlzaXRlZCA9IG5ldyBTZXQoKTtcblxuICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgIGNhc2UgJ251bWJlcic6XG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2aXNpdGVkLmFkZCh2YWx1ZSk7XG4gICAgICBmb3IgKGNvbnN0IHByb3BlcnR5IG9mIE9iamVjdC52YWx1ZXModmFsdWUpKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZpc2l0ZWQuaGFzKHByb3BlcnR5KSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNKc29uVmFsdWUocHJvcGVydHkpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFByb2plY3REZWZpbml0aW9uQ29sbGVjdGlvbiBleHRlbmRzIERlZmluaXRpb25Db2xsZWN0aW9uPFByb2plY3REZWZpbml0aW9uPiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGluaXRpYWw/OiBSZWNvcmQ8c3RyaW5nLCBQcm9qZWN0RGVmaW5pdGlvbj4sXG4gICAgbGlzdGVuZXI/OiBEZWZpbml0aW9uQ29sbGVjdGlvbkxpc3RlbmVyPFByb2plY3REZWZpbml0aW9uPixcbiAgKSB7XG4gICAgc3VwZXIoaW5pdGlhbCwgbGlzdGVuZXIpO1xuICB9XG5cbiAgYWRkKGRlZmluaXRpb246IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgcm9vdDogc3RyaW5nO1xuICAgIHNvdXJjZVJvb3Q/OiBzdHJpbmc7XG4gICAgcHJlZml4Pzogc3RyaW5nO1xuICAgIHRhcmdldHM/OiBSZWNvcmQ8c3RyaW5nLCBUYXJnZXREZWZpbml0aW9uIHwgdW5kZWZpbmVkPjtcbiAgICBba2V5OiBzdHJpbmddOiB1bmtub3duO1xuICB9KTogUHJvamVjdERlZmluaXRpb24ge1xuICAgIGlmICh0aGlzLmhhcyhkZWZpbml0aW9uLm5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb2plY3QgbmFtZSBhbHJlYWR5IGV4aXN0cy4nKTtcbiAgICB9XG4gICAgdGhpcy5fdmFsaWRhdGVOYW1lKGRlZmluaXRpb24ubmFtZSk7XG5cbiAgICBjb25zdCBwcm9qZWN0OiBQcm9qZWN0RGVmaW5pdGlvbiA9IHtcbiAgICAgIHJvb3Q6IGRlZmluaXRpb24ucm9vdCxcbiAgICAgIHByZWZpeDogZGVmaW5pdGlvbi5wcmVmaXgsXG4gICAgICBzb3VyY2VSb290OiBkZWZpbml0aW9uLnNvdXJjZVJvb3QsXG4gICAgICB0YXJnZXRzOiBuZXcgVGFyZ2V0RGVmaW5pdGlvbkNvbGxlY3Rpb24oKSxcbiAgICAgIGV4dGVuc2lvbnM6IHt9LFxuICAgIH07XG5cbiAgICBpZiAoZGVmaW5pdGlvbi50YXJnZXRzKSB7XG4gICAgICBmb3IgKGNvbnN0IFtuYW1lLCB0YXJnZXRdIG9mIE9iamVjdC5lbnRyaWVzKGRlZmluaXRpb24udGFyZ2V0cykpIHtcbiAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgIHByb2plY3QudGFyZ2V0cy5zZXQobmFtZSwgdGFyZ2V0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgW25hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhkZWZpbml0aW9uKSkge1xuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgJ25hbWUnOlxuICAgICAgICBjYXNlICdyb290JzpcbiAgICAgICAgY2FzZSAnc291cmNlUm9vdCc6XG4gICAgICAgIGNhc2UgJ3ByZWZpeCc6XG4gICAgICAgIGNhc2UgJ3RhcmdldHMnOlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmIChpc0pzb25WYWx1ZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHByb2plY3QuZXh0ZW5zaW9uc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBcIiR7bmFtZX1cIiBtdXN0IGJlIGEgSlNPTiB2YWx1ZS5gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3VwZXIuc2V0KGRlZmluaXRpb24ubmFtZSwgcHJvamVjdCk7XG5cbiAgICByZXR1cm4gcHJvamVjdDtcbiAgfVxuXG4gIG92ZXJyaWRlIHNldChuYW1lOiBzdHJpbmcsIHZhbHVlOiBQcm9qZWN0RGVmaW5pdGlvbik6IHRoaXMge1xuICAgIHRoaXMuX3ZhbGlkYXRlTmFtZShuYW1lKTtcblxuICAgIHN1cGVyLnNldChuYW1lLCB2YWx1ZSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHByaXZhdGUgX3ZhbGlkYXRlTmFtZShuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnIHx8ICEvXig/OkBcXHdbXFx3Li1dKlxcLyk/XFx3W1xcdy4tXSokLy50ZXN0KG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb2plY3QgbmFtZSBtdXN0IGJlIGEgdmFsaWQgbnBtIHBhY2thZ2UgbmFtZS4nKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRhcmdldERlZmluaXRpb25Db2xsZWN0aW9uIGV4dGVuZHMgRGVmaW5pdGlvbkNvbGxlY3Rpb248VGFyZ2V0RGVmaW5pdGlvbj4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICBpbml0aWFsPzogUmVjb3JkPHN0cmluZywgVGFyZ2V0RGVmaW5pdGlvbj4sXG4gICAgbGlzdGVuZXI/OiBEZWZpbml0aW9uQ29sbGVjdGlvbkxpc3RlbmVyPFRhcmdldERlZmluaXRpb24+LFxuICApIHtcbiAgICBzdXBlcihpbml0aWFsLCBsaXN0ZW5lcik7XG4gIH1cblxuICBhZGQoXG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgbmFtZTogc3RyaW5nO1xuICAgIH0gJiBUYXJnZXREZWZpbml0aW9uLFxuICApOiBUYXJnZXREZWZpbml0aW9uIHtcbiAgICBpZiAodGhpcy5oYXMoZGVmaW5pdGlvbi5uYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUYXJnZXQgbmFtZSBhbHJlYWR5IGV4aXN0cy4nKTtcbiAgICB9XG4gICAgdGhpcy5fdmFsaWRhdGVOYW1lKGRlZmluaXRpb24ubmFtZSk7XG5cbiAgICBjb25zdCB0YXJnZXQgPSB7XG4gICAgICBidWlsZGVyOiBkZWZpbml0aW9uLmJ1aWxkZXIsXG4gICAgICBvcHRpb25zOiBkZWZpbml0aW9uLm9wdGlvbnMsXG4gICAgICBjb25maWd1cmF0aW9uczogZGVmaW5pdGlvbi5jb25maWd1cmF0aW9ucyxcbiAgICAgIGRlZmF1bHRDb25maWd1cmF0aW9uOiBkZWZpbml0aW9uLmRlZmF1bHRDb25maWd1cmF0aW9uLFxuICAgIH07XG5cbiAgICBzdXBlci5zZXQoZGVmaW5pdGlvbi5uYW1lLCB0YXJnZXQpO1xuXG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxuXG4gIG92ZXJyaWRlIHNldChuYW1lOiBzdHJpbmcsIHZhbHVlOiBUYXJnZXREZWZpbml0aW9uKTogdGhpcyB7XG4gICAgdGhpcy5fdmFsaWRhdGVOYW1lKG5hbWUpO1xuXG4gICAgc3VwZXIuc2V0KG5hbWUsIHZhbHVlKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcHJpdmF0ZSBfdmFsaWRhdGVOYW1lKG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RhcmdldCBuYW1lIG11c3QgYmUgYSBzdHJpbmcuJyk7XG4gICAgfVxuICB9XG59XG4iXX0=