"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeBlock = void 0;
const typescript_1 = __importDefault(require("../../third_party/github.com/Microsoft/TypeScript/lib/typescript"));
const ast_utils_1 = require("../ast-utils");
const change_1 = require("../change");
/** Counter used to generate unique IDs. */
let uniqueIdCounter = 0;
/**
 * Utility class used to generate blocks of code that
 * can be inserted by the devkit into a user's app.
 */
class CodeBlock {
    constructor() {
        this._imports = new Map();
        // Note: the methods here are defined as arrow function so that they can be destructured by
        // consumers without losing their context. This makes the API more concise.
        /** Function used to tag a code block in order to produce a `PendingCode` object. */
        this.code = (strings, ...params) => {
            return {
                expression: strings.map((part, index) => part + (params[index] || '')).join(''),
                imports: this._imports,
            };
        };
        /**
         * Used inside of a code block to mark external symbols and which module they should be imported
         * from. When the code is inserted, the required import statements will be produced automatically.
         * @param symbolName Name of the external symbol.
         * @param moduleName Module from which the symbol should be imported.
         */
        this.external = (symbolName, moduleName) => {
            if (!this._imports.has(moduleName)) {
                this._imports.set(moduleName, new Map());
            }
            const symbolsPerModule = this._imports.get(moduleName);
            if (!symbolsPerModule.has(symbolName)) {
                symbolsPerModule.set(symbolName, `@@__SCHEMATIC_PLACEHOLDER_${uniqueIdCounter++}__@@`);
            }
            return symbolsPerModule.get(symbolName);
        };
    }
    /**
     * Produces the necessary rules to transform a `PendingCode` object into valid code.
     * @param initialCode Code pending transformed.
     * @param filePath Path of the file in which the code will be inserted.
     */
    static transformPendingCode(initialCode, filePath) {
        const code = { ...initialCode };
        const rules = [];
        code.imports.forEach((symbols, moduleName) => {
            symbols.forEach((placeholder, symbolName) => {
                rules.push((tree) => {
                    const recorder = tree.beginUpdate(filePath);
                    const sourceFile = typescript_1.default.createSourceFile(filePath, tree.readText(filePath), typescript_1.default.ScriptTarget.Latest, true);
                    // Note that this could still technically clash if there's a top-level symbol called
                    // `${symbolName}_alias`, however this is unlikely. We can revisit this if it becomes
                    // a problem.
                    const alias = (0, ast_utils_1.hasTopLevelIdentifier)(sourceFile, symbolName, moduleName)
                        ? symbolName + '_alias'
                        : undefined;
                    code.expression = code.expression.replace(new RegExp(placeholder, 'g'), alias || symbolName);
                    (0, change_1.applyToUpdateRecorder)(recorder, [
                        (0, ast_utils_1.insertImport)(sourceFile, filePath, symbolName, moduleName, false, alias),
                    ]);
                    tree.commitUpdate(recorder);
                });
            });
        });
        return { code, rules };
    }
}
exports.CodeBlock = CodeBlock;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZV9ibG9jay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3N0YW5kYWxvbmUvY29kZV9ibG9jay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFHSCxrSEFBa0Y7QUFDbEYsNENBQW1FO0FBQ25FLHNDQUFrRDtBQWNsRCwyQ0FBMkM7QUFDM0MsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDO0FBUXhCOzs7R0FHRztBQUNILE1BQWEsU0FBUztJQUF0QjtRQUNVLGFBQVEsR0FBbUIsSUFBSSxHQUFHLEVBQStCLENBQUM7UUFFMUUsMkZBQTJGO1FBQzNGLDJFQUEyRTtRQUUzRSxvRkFBb0Y7UUFDcEYsU0FBSSxHQUFHLENBQUMsT0FBNkIsRUFBRSxHQUFHLE1BQWlCLEVBQWUsRUFBRTtZQUMxRSxPQUFPO2dCQUNMLFVBQVUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDL0UsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRO2FBQ3ZCLENBQUM7UUFDSixDQUFDLENBQUM7UUFFRjs7Ozs7V0FLRztRQUNILGFBQVEsR0FBRyxDQUFDLFVBQWtCLEVBQUUsVUFBa0IsRUFBVSxFQUFFO1lBQzVELElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQzthQUMxQztZQUVELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUF3QixDQUFDO1lBRTlFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ3JDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsNkJBQTZCLGVBQWUsRUFBRSxNQUFNLENBQUMsQ0FBQzthQUN4RjtZQUVELE9BQU8sZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBVyxDQUFDO1FBQ3BELENBQUMsQ0FBQztJQTRDSixDQUFDO0lBMUNDOzs7O09BSUc7SUFDSCxNQUFNLENBQUMsb0JBQW9CLENBQUMsV0FBd0IsRUFBRSxRQUFnQjtRQUNwRSxNQUFNLElBQUksR0FBRyxFQUFFLEdBQUcsV0FBVyxFQUFFLENBQUM7UUFDaEMsTUFBTSxLQUFLLEdBQVcsRUFBRSxDQUFDO1FBRXpCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFO1lBQzNDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLEVBQUU7Z0JBQzFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFVLEVBQUUsRUFBRTtvQkFDeEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDNUMsTUFBTSxVQUFVLEdBQUcsb0JBQUUsQ0FBQyxnQkFBZ0IsQ0FDcEMsUUFBUSxFQUNSLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQ3ZCLG9CQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFDdEIsSUFBSSxDQUNMLENBQUM7b0JBRUYsb0ZBQW9GO29CQUNwRixxRkFBcUY7b0JBQ3JGLGFBQWE7b0JBQ2IsTUFBTSxLQUFLLEdBQUcsSUFBQSxpQ0FBcUIsRUFBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQzt3QkFDckUsQ0FBQyxDQUFDLFVBQVUsR0FBRyxRQUFRO3dCQUN2QixDQUFDLENBQUMsU0FBUyxDQUFDO29CQUVkLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQ3ZDLElBQUksTUFBTSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsRUFDNUIsS0FBSyxJQUFJLFVBQVUsQ0FDcEIsQ0FBQztvQkFFRixJQUFBLDhCQUFxQixFQUFDLFFBQVEsRUFBRTt3QkFDOUIsSUFBQSx3QkFBWSxFQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO3FCQUN6RSxDQUFDLENBQUM7b0JBQ0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDOUIsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQztJQUN6QixDQUFDO0NBQ0Y7QUE1RUQsOEJBNEVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFJ1bGUsIFRyZWUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgdHMgZnJvbSAnLi4vLi4vdGhpcmRfcGFydHkvZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9saWIvdHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBoYXNUb3BMZXZlbElkZW50aWZpZXIsIGluc2VydEltcG9ydCB9IGZyb20gJy4uL2FzdC11dGlscyc7XG5pbXBvcnQgeyBhcHBseVRvVXBkYXRlUmVjb3JkZXIgfSBmcm9tICcuLi9jaGFuZ2UnO1xuXG4vKiogR2VuZXJhdGVkIGNvZGUgdGhhdCBoYXNuJ3QgYmVlbiBpbnRlcnBvbGF0ZWQgeWV0LiAqL1xuZXhwb3J0IGludGVyZmFjZSBQZW5kaW5nQ29kZSB7XG4gIC8qKiBDb2RlIHRoYXQgd2lsbCBiZSBpbnNlcnRlZC4gKi9cbiAgZXhwcmVzc2lvbjogc3RyaW5nO1xuXG4gIC8qKiBJbXBvcnRzIHRoYXQgbmVlZCB0byBiZSBhZGRlZCB0byB0aGUgZmlsZSBpbiB3aGljaCB0aGUgY29kZSBpcyBpbnNlcnRlZC4gKi9cbiAgaW1wb3J0czogUGVuZGluZ0ltcG9ydHM7XG59XG5cbi8qKiBNYXAga2VlcGluZyB0cmFjayBvZiBpbXBvcnRzIGFuZCBhbGlhc2VzIHVuZGVyIHdoaWNoIHRoZXkncmUgcmVmZXJyZWQgdG8gaW4gYW4gZXhwcmVzaW9uLiAqL1xudHlwZSBQZW5kaW5nSW1wb3J0cyA9IE1hcDxzdHJpbmcsIE1hcDxzdHJpbmcsIHN0cmluZz4+O1xuXG4vKiogQ291bnRlciB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRHMuICovXG5sZXQgdW5pcXVlSWRDb3VudGVyID0gMDtcblxuLyoqXG4gKiBDYWxsYmFjayBpbnZva2VkIGJ5IGEgUnVsZSB0aGF0IHByb2R1Y2VzIHRoZSBjb2RlXG4gKiB0aGF0IG5lZWRzIHRvIGJlIGluc2VydGVkIHNvbWV3aGVyZSBpbiB0aGUgYXBwLlxuICovXG5leHBvcnQgdHlwZSBDb2RlQmxvY2tDYWxsYmFjayA9IChibG9jazogQ29kZUJsb2NrKSA9PiBQZW5kaW5nQ29kZTtcblxuLyoqXG4gKiBVdGlsaXR5IGNsYXNzIHVzZWQgdG8gZ2VuZXJhdGUgYmxvY2tzIG9mIGNvZGUgdGhhdFxuICogY2FuIGJlIGluc2VydGVkIGJ5IHRoZSBkZXZraXQgaW50byBhIHVzZXIncyBhcHAuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb2RlQmxvY2sge1xuICBwcml2YXRlIF9pbXBvcnRzOiBQZW5kaW5nSW1wb3J0cyA9IG5ldyBNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBzdHJpbmc+PigpO1xuXG4gIC8vIE5vdGU6IHRoZSBtZXRob2RzIGhlcmUgYXJlIGRlZmluZWQgYXMgYXJyb3cgZnVuY3Rpb24gc28gdGhhdCB0aGV5IGNhbiBiZSBkZXN0cnVjdHVyZWQgYnlcbiAgLy8gY29uc3VtZXJzIHdpdGhvdXQgbG9zaW5nIHRoZWlyIGNvbnRleHQuIFRoaXMgbWFrZXMgdGhlIEFQSSBtb3JlIGNvbmNpc2UuXG5cbiAgLyoqIEZ1bmN0aW9uIHVzZWQgdG8gdGFnIGEgY29kZSBibG9jayBpbiBvcmRlciB0byBwcm9kdWNlIGEgYFBlbmRpbmdDb2RlYCBvYmplY3QuICovXG4gIGNvZGUgPSAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIC4uLnBhcmFtczogdW5rbm93bltdKTogUGVuZGluZ0NvZGUgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBleHByZXNzaW9uOiBzdHJpbmdzLm1hcCgocGFydCwgaW5kZXgpID0+IHBhcnQgKyAocGFyYW1zW2luZGV4XSB8fCAnJykpLmpvaW4oJycpLFxuICAgICAgaW1wb3J0czogdGhpcy5faW1wb3J0cyxcbiAgICB9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBVc2VkIGluc2lkZSBvZiBhIGNvZGUgYmxvY2sgdG8gbWFyayBleHRlcm5hbCBzeW1ib2xzIGFuZCB3aGljaCBtb2R1bGUgdGhleSBzaG91bGQgYmUgaW1wb3J0ZWRcbiAgICogZnJvbS4gV2hlbiB0aGUgY29kZSBpcyBpbnNlcnRlZCwgdGhlIHJlcXVpcmVkIGltcG9ydCBzdGF0ZW1lbnRzIHdpbGwgYmUgcHJvZHVjZWQgYXV0b21hdGljYWxseS5cbiAgICogQHBhcmFtIHN5bWJvbE5hbWUgTmFtZSBvZiB0aGUgZXh0ZXJuYWwgc3ltYm9sLlxuICAgKiBAcGFyYW0gbW9kdWxlTmFtZSBNb2R1bGUgZnJvbSB3aGljaCB0aGUgc3ltYm9sIHNob3VsZCBiZSBpbXBvcnRlZC5cbiAgICovXG4gIGV4dGVybmFsID0gKHN5bWJvbE5hbWU6IHN0cmluZywgbW9kdWxlTmFtZTogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICBpZiAoIXRoaXMuX2ltcG9ydHMuaGFzKG1vZHVsZU5hbWUpKSB7XG4gICAgICB0aGlzLl9pbXBvcnRzLnNldChtb2R1bGVOYW1lLCBuZXcgTWFwKCkpO1xuICAgIH1cblxuICAgIGNvbnN0IHN5bWJvbHNQZXJNb2R1bGUgPSB0aGlzLl9pbXBvcnRzLmdldChtb2R1bGVOYW1lKSBhcyBNYXA8c3RyaW5nLCBzdHJpbmc+O1xuXG4gICAgaWYgKCFzeW1ib2xzUGVyTW9kdWxlLmhhcyhzeW1ib2xOYW1lKSkge1xuICAgICAgc3ltYm9sc1Blck1vZHVsZS5zZXQoc3ltYm9sTmFtZSwgYEBAX19TQ0hFTUFUSUNfUExBQ0VIT0xERVJfJHt1bmlxdWVJZENvdW50ZXIrK31fX0BAYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN5bWJvbHNQZXJNb2R1bGUuZ2V0KHN5bWJvbE5hbWUpIGFzIHN0cmluZztcbiAgfTtcblxuICAvKipcbiAgICogUHJvZHVjZXMgdGhlIG5lY2Vzc2FyeSBydWxlcyB0byB0cmFuc2Zvcm0gYSBgUGVuZGluZ0NvZGVgIG9iamVjdCBpbnRvIHZhbGlkIGNvZGUuXG4gICAqIEBwYXJhbSBpbml0aWFsQ29kZSBDb2RlIHBlbmRpbmcgdHJhbnNmb3JtZWQuXG4gICAqIEBwYXJhbSBmaWxlUGF0aCBQYXRoIG9mIHRoZSBmaWxlIGluIHdoaWNoIHRoZSBjb2RlIHdpbGwgYmUgaW5zZXJ0ZWQuXG4gICAqL1xuICBzdGF0aWMgdHJhbnNmb3JtUGVuZGluZ0NvZGUoaW5pdGlhbENvZGU6IFBlbmRpbmdDb2RlLCBmaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgY29kZSA9IHsgLi4uaW5pdGlhbENvZGUgfTtcbiAgICBjb25zdCBydWxlczogUnVsZVtdID0gW107XG5cbiAgICBjb2RlLmltcG9ydHMuZm9yRWFjaCgoc3ltYm9scywgbW9kdWxlTmFtZSkgPT4ge1xuICAgICAgc3ltYm9scy5mb3JFYWNoKChwbGFjZWhvbGRlciwgc3ltYm9sTmFtZSkgPT4ge1xuICAgICAgICBydWxlcy5wdXNoKCh0cmVlOiBUcmVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKGZpbGVQYXRoKTtcbiAgICAgICAgICBjb25zdCBzb3VyY2VGaWxlID0gdHMuY3JlYXRlU291cmNlRmlsZShcbiAgICAgICAgICAgIGZpbGVQYXRoLFxuICAgICAgICAgICAgdHJlZS5yZWFkVGV4dChmaWxlUGF0aCksXG4gICAgICAgICAgICB0cy5TY3JpcHRUYXJnZXQuTGF0ZXN0LFxuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgY291bGQgc3RpbGwgdGVjaG5pY2FsbHkgY2xhc2ggaWYgdGhlcmUncyBhIHRvcC1sZXZlbCBzeW1ib2wgY2FsbGVkXG4gICAgICAgICAgLy8gYCR7c3ltYm9sTmFtZX1fYWxpYXNgLCBob3dldmVyIHRoaXMgaXMgdW5saWtlbHkuIFdlIGNhbiByZXZpc2l0IHRoaXMgaWYgaXQgYmVjb21lc1xuICAgICAgICAgIC8vIGEgcHJvYmxlbS5cbiAgICAgICAgICBjb25zdCBhbGlhcyA9IGhhc1RvcExldmVsSWRlbnRpZmllcihzb3VyY2VGaWxlLCBzeW1ib2xOYW1lLCBtb2R1bGVOYW1lKVxuICAgICAgICAgICAgPyBzeW1ib2xOYW1lICsgJ19hbGlhcydcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgY29kZS5leHByZXNzaW9uID0gY29kZS5leHByZXNzaW9uLnJlcGxhY2UoXG4gICAgICAgICAgICBuZXcgUmVnRXhwKHBsYWNlaG9sZGVyLCAnZycpLFxuICAgICAgICAgICAgYWxpYXMgfHwgc3ltYm9sTmFtZSxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgYXBwbHlUb1VwZGF0ZVJlY29yZGVyKHJlY29yZGVyLCBbXG4gICAgICAgICAgICBpbnNlcnRJbXBvcnQoc291cmNlRmlsZSwgZmlsZVBhdGgsIHN5bWJvbE5hbWUsIG1vZHVsZU5hbWUsIGZhbHNlLCBhbGlhcyksXG4gICAgICAgICAgXSk7XG4gICAgICAgICAgdHJlZS5jb21taXRVcGRhdGUocmVjb3JkZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHsgY29kZSwgcnVsZXMgfTtcbiAgfVxufVxuIl19