"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJson = exports.readAndParseJson = exports.JSONFile = void 0;
const fs_1 = require("fs");
const jsonc_parser_1 = require("jsonc-parser");
/** @internal */
class JSONFile {
    constructor(path) {
        this.path = path;
        const buffer = (0, fs_1.readFileSync)(this.path);
        if (buffer) {
            this.content = buffer.toString();
        }
        else {
            throw new Error(`Could not read '${path}'.`);
        }
    }
    get JsonAst() {
        if (this._jsonAst) {
            return this._jsonAst;
        }
        const errors = [];
        this._jsonAst = (0, jsonc_parser_1.parseTree)(this.content, errors, { allowTrailingComma: true });
        if (errors.length) {
            formatError(this.path, errors);
        }
        return this._jsonAst;
    }
    get(jsonPath) {
        const jsonAstNode = this.JsonAst;
        if (!jsonAstNode) {
            return undefined;
        }
        if (jsonPath.length === 0) {
            return (0, jsonc_parser_1.getNodeValue)(jsonAstNode);
        }
        const node = (0, jsonc_parser_1.findNodeAtLocation)(jsonAstNode, jsonPath);
        return node === undefined ? undefined : (0, jsonc_parser_1.getNodeValue)(node);
    }
    modify(jsonPath, value, insertInOrder) {
        if (value === undefined && this.get(jsonPath) === undefined) {
            // Cannot remove a value which doesn't exist.
            return false;
        }
        let getInsertionIndex;
        if (insertInOrder === undefined) {
            const property = jsonPath.slice(-1)[0];
            getInsertionIndex = (properties) => [...properties, property].sort().findIndex((p) => p === property);
        }
        else if (insertInOrder !== false) {
            getInsertionIndex = insertInOrder;
        }
        const edits = (0, jsonc_parser_1.modify)(this.content, jsonPath, value, {
            getInsertionIndex,
            // TODO: use indentation from original file.
            formattingOptions: {
                insertSpaces: true,
                tabSize: 2,
            },
        });
        if (edits.length === 0) {
            return false;
        }
        this.content = (0, jsonc_parser_1.applyEdits)(this.content, edits);
        this._jsonAst = undefined;
        return true;
    }
    save() {
        (0, fs_1.writeFileSync)(this.path, this.content);
    }
}
exports.JSONFile = JSONFile;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readAndParseJson(path) {
    const errors = [];
    const content = (0, jsonc_parser_1.parse)((0, fs_1.readFileSync)(path, 'utf-8'), errors, { allowTrailingComma: true });
    if (errors.length) {
        formatError(path, errors);
    }
    return content;
}
exports.readAndParseJson = readAndParseJson;
function formatError(path, errors) {
    const { error, offset } = errors[0];
    throw new Error(`Failed to parse "${path}" as JSON AST Object. ${(0, jsonc_parser_1.printParseErrorCode)(error)} at location: ${offset}.`);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJson(content) {
    return (0, jsonc_parser_1.parse)(content, undefined, { allowTrailingComma: true });
}
exports.parseJson = parseJson;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1maWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL3V0aWxpdGllcy9qc29uLWZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBR0gsMkJBQWlEO0FBQ2pELCtDQVVzQjtBQUt0QixnQkFBZ0I7QUFDaEIsTUFBYSxRQUFRO0lBR25CLFlBQTZCLElBQVk7UUFBWixTQUFJLEdBQUosSUFBSSxDQUFRO1FBQ3ZDLE1BQU0sTUFBTSxHQUFHLElBQUEsaUJBQVksRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsSUFBSSxNQUFNLEVBQUU7WUFDVixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUNsQzthQUFNO1lBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsSUFBSSxJQUFJLENBQUMsQ0FBQztTQUM5QztJQUNILENBQUM7SUFHRCxJQUFZLE9BQU87UUFDakIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztTQUN0QjtRQUVELE1BQU0sTUFBTSxHQUFpQixFQUFFLENBQUM7UUFDaEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFBLHdCQUFTLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzlFLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTtZQUNqQixXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztTQUNoQztRQUVELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztJQUN2QixDQUFDO0lBRUQsR0FBRyxDQUFDLFFBQWtCO1FBQ3BCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDakMsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNoQixPQUFPLFNBQVMsQ0FBQztTQUNsQjtRQUVELElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDekIsT0FBTyxJQUFBLDJCQUFZLEVBQUMsV0FBVyxDQUFDLENBQUM7U0FDbEM7UUFFRCxNQUFNLElBQUksR0FBRyxJQUFBLGlDQUFrQixFQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUV2RCxPQUFPLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBQSwyQkFBWSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxNQUFNLENBQ0osUUFBa0IsRUFDbEIsS0FBNEIsRUFDNUIsYUFBc0M7UUFFdEMsSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssU0FBUyxFQUFFO1lBQzNELDZDQUE2QztZQUM3QyxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsSUFBSSxpQkFBNkMsQ0FBQztRQUNsRCxJQUFJLGFBQWEsS0FBSyxTQUFTLEVBQUU7WUFDL0IsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGlCQUFpQixHQUFHLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FDakMsQ0FBQyxHQUFHLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQztTQUNyRTthQUFNLElBQUksYUFBYSxLQUFLLEtBQUssRUFBRTtZQUNsQyxpQkFBaUIsR0FBRyxhQUFhLENBQUM7U0FDbkM7UUFFRCxNQUFNLEtBQUssR0FBRyxJQUFBLHFCQUFNLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFO1lBQ2xELGlCQUFpQjtZQUNqQiw0Q0FBNEM7WUFDNUMsaUJBQWlCLEVBQUU7Z0JBQ2pCLFlBQVksRUFBRSxJQUFJO2dCQUNsQixPQUFPLEVBQUUsQ0FBQzthQUNYO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUN0QixPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLHlCQUFVLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQztRQUUxQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxJQUFJO1FBQ0YsSUFBQSxrQkFBYSxFQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLENBQUM7Q0FDRjtBQW5GRCw0QkFtRkM7QUFFRCw4REFBOEQ7QUFDOUQsU0FBZ0IsZ0JBQWdCLENBQUMsSUFBWTtJQUMzQyxNQUFNLE1BQU0sR0FBaUIsRUFBRSxDQUFDO0lBQ2hDLE1BQU0sT0FBTyxHQUFHLElBQUEsb0JBQUssRUFBQyxJQUFBLGlCQUFZLEVBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDekYsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2pCLFdBQVcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDM0I7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBUkQsNENBUUM7QUFFRCxTQUFTLFdBQVcsQ0FBQyxJQUFZLEVBQUUsTUFBb0I7SUFDckQsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEMsTUFBTSxJQUFJLEtBQUssQ0FDYixvQkFBb0IsSUFBSSx5QkFBeUIsSUFBQSxrQ0FBbUIsRUFDbEUsS0FBSyxDQUNOLGlCQUFpQixNQUFNLEdBQUcsQ0FDNUIsQ0FBQztBQUNKLENBQUM7QUFFRCw4REFBOEQ7QUFDOUQsU0FBZ0IsU0FBUyxDQUFDLE9BQWU7SUFDdkMsT0FBTyxJQUFBLG9CQUFLLEVBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUZELDhCQUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEpzb25WYWx1ZSB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYywgd3JpdGVGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7XG4gIE5vZGUsXG4gIFBhcnNlRXJyb3IsXG4gIGFwcGx5RWRpdHMsXG4gIGZpbmROb2RlQXRMb2NhdGlvbixcbiAgZ2V0Tm9kZVZhbHVlLFxuICBtb2RpZnksXG4gIHBhcnNlLFxuICBwYXJzZVRyZWUsXG4gIHByaW50UGFyc2VFcnJvckNvZGUsXG59IGZyb20gJ2pzb25jLXBhcnNlcic7XG5cbmV4cG9ydCB0eXBlIEluc2VydGlvbkluZGV4ID0gKHByb3BlcnRpZXM6IHN0cmluZ1tdKSA9PiBudW1iZXI7XG5leHBvcnQgdHlwZSBKU09OUGF0aCA9IChzdHJpbmcgfCBudW1iZXIpW107XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCBjbGFzcyBKU09ORmlsZSB7XG4gIGNvbnRlbnQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHJlYWRGaWxlU3luYyh0aGlzLnBhdGgpO1xuICAgIGlmIChidWZmZXIpIHtcbiAgICAgIHRoaXMuY29udGVudCA9IGJ1ZmZlci50b1N0cmluZygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCByZWFkICcke3BhdGh9Jy5gKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9qc29uQXN0OiBOb2RlIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGdldCBKc29uQXN0KCk6IE5vZGUgfCB1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLl9qc29uQXN0KSB7XG4gICAgICByZXR1cm4gdGhpcy5fanNvbkFzdDtcbiAgICB9XG5cbiAgICBjb25zdCBlcnJvcnM6IFBhcnNlRXJyb3JbXSA9IFtdO1xuICAgIHRoaXMuX2pzb25Bc3QgPSBwYXJzZVRyZWUodGhpcy5jb250ZW50LCBlcnJvcnMsIHsgYWxsb3dUcmFpbGluZ0NvbW1hOiB0cnVlIH0pO1xuICAgIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgICBmb3JtYXRFcnJvcih0aGlzLnBhdGgsIGVycm9ycyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2pzb25Bc3Q7XG4gIH1cblxuICBnZXQoanNvblBhdGg6IEpTT05QYXRoKTogdW5rbm93biB7XG4gICAgY29uc3QganNvbkFzdE5vZGUgPSB0aGlzLkpzb25Bc3Q7XG4gICAgaWYgKCFqc29uQXN0Tm9kZSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAoanNvblBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZ2V0Tm9kZVZhbHVlKGpzb25Bc3ROb2RlKTtcbiAgICB9XG5cbiAgICBjb25zdCBub2RlID0gZmluZE5vZGVBdExvY2F0aW9uKGpzb25Bc3ROb2RlLCBqc29uUGF0aCk7XG5cbiAgICByZXR1cm4gbm9kZSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogZ2V0Tm9kZVZhbHVlKG5vZGUpO1xuICB9XG5cbiAgbW9kaWZ5KFxuICAgIGpzb25QYXRoOiBKU09OUGF0aCxcbiAgICB2YWx1ZTogSnNvblZhbHVlIHwgdW5kZWZpbmVkLFxuICAgIGluc2VydEluT3JkZXI/OiBJbnNlcnRpb25JbmRleCB8IGZhbHNlLFxuICApOiBib29sZWFuIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCAmJiB0aGlzLmdldChqc29uUGF0aCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gQ2Fubm90IHJlbW92ZSBhIHZhbHVlIHdoaWNoIGRvZXNuJ3QgZXhpc3QuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IGdldEluc2VydGlvbkluZGV4OiBJbnNlcnRpb25JbmRleCB8IHVuZGVmaW5lZDtcbiAgICBpZiAoaW5zZXJ0SW5PcmRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBwcm9wZXJ0eSA9IGpzb25QYXRoLnNsaWNlKC0xKVswXTtcbiAgICAgIGdldEluc2VydGlvbkluZGV4ID0gKHByb3BlcnRpZXMpID0+XG4gICAgICAgIFsuLi5wcm9wZXJ0aWVzLCBwcm9wZXJ0eV0uc29ydCgpLmZpbmRJbmRleCgocCkgPT4gcCA9PT0gcHJvcGVydHkpO1xuICAgIH0gZWxzZSBpZiAoaW5zZXJ0SW5PcmRlciAhPT0gZmFsc2UpIHtcbiAgICAgIGdldEluc2VydGlvbkluZGV4ID0gaW5zZXJ0SW5PcmRlcjtcbiAgICB9XG5cbiAgICBjb25zdCBlZGl0cyA9IG1vZGlmeSh0aGlzLmNvbnRlbnQsIGpzb25QYXRoLCB2YWx1ZSwge1xuICAgICAgZ2V0SW5zZXJ0aW9uSW5kZXgsXG4gICAgICAvLyBUT0RPOiB1c2UgaW5kZW50YXRpb24gZnJvbSBvcmlnaW5hbCBmaWxlLlxuICAgICAgZm9ybWF0dGluZ09wdGlvbnM6IHtcbiAgICAgICAgaW5zZXJ0U3BhY2VzOiB0cnVlLFxuICAgICAgICB0YWJTaXplOiAyLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGlmIChlZGl0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRlbnQgPSBhcHBseUVkaXRzKHRoaXMuY29udGVudCwgZWRpdHMpO1xuICAgIHRoaXMuX2pzb25Bc3QgPSB1bmRlZmluZWQ7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHNhdmUoKTogdm9pZCB7XG4gICAgd3JpdGVGaWxlU3luYyh0aGlzLnBhdGgsIHRoaXMuY29udGVudCk7XG4gIH1cbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCBmdW5jdGlvbiByZWFkQW5kUGFyc2VKc29uKHBhdGg6IHN0cmluZyk6IGFueSB7XG4gIGNvbnN0IGVycm9yczogUGFyc2VFcnJvcltdID0gW107XG4gIGNvbnN0IGNvbnRlbnQgPSBwYXJzZShyZWFkRmlsZVN5bmMocGF0aCwgJ3V0Zi04JyksIGVycm9ycywgeyBhbGxvd1RyYWlsaW5nQ29tbWE6IHRydWUgfSk7XG4gIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgZm9ybWF0RXJyb3IocGF0aCwgZXJyb3JzKTtcbiAgfVxuXG4gIHJldHVybiBjb250ZW50O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcihwYXRoOiBzdHJpbmcsIGVycm9yczogUGFyc2VFcnJvcltdKTogbmV2ZXIge1xuICBjb25zdCB7IGVycm9yLCBvZmZzZXQgfSA9IGVycm9yc1swXTtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgIGBGYWlsZWQgdG8gcGFyc2UgXCIke3BhdGh9XCIgYXMgSlNPTiBBU1QgT2JqZWN0LiAke3ByaW50UGFyc2VFcnJvckNvZGUoXG4gICAgICBlcnJvcixcbiAgICApfSBhdCBsb2NhdGlvbjogJHtvZmZzZXR9LmAsXG4gICk7XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5leHBvcnQgZnVuY3Rpb24gcGFyc2VKc29uKGNvbnRlbnQ6IHN0cmluZyk6IGFueSB7XG4gIHJldHVybiBwYXJzZShjb250ZW50LCB1bmRlZmluZWQsIHsgYWxsb3dUcmFpbGluZ0NvbW1hOiB0cnVlIH0pO1xufVxuIl19