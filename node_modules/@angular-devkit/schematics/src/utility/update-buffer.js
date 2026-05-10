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
exports.UpdateBuffer = exports.UpdateBufferBase = exports.IndexOutOfBoundException = void 0;
const core_1 = require("@angular-devkit/core");
const magic_string_1 = __importDefault(require("magic-string"));
const node_util_1 = require("node:util");
class IndexOutOfBoundException extends core_1.BaseException {
    constructor(index, min, max = Infinity) {
        super(`Index ${index} outside of range [${min}, ${max}].`);
    }
}
exports.IndexOutOfBoundException = IndexOutOfBoundException;
/**
 * Base class for an update buffer implementation that allows buffers to be inserted to the _right
 * or _left, or deleted, while keeping indices to the original buffer.
 */
class UpdateBufferBase {
    constructor(_originalContent) {
        this._originalContent = _originalContent;
    }
    /**
     * Creates an UpdateBufferBase instance.
     *
     * @param contentPath The path of the update buffer instance.
     * @param originalContent The original content of the update buffer instance.
     * @returns An UpdateBufferBase instance.
     */
    static create(contentPath, originalContent) {
        try {
            // We only support utf8 encoding.
            new node_util_1.TextDecoder('utf8', { fatal: true }).decode(originalContent);
            return new UpdateBuffer(originalContent);
        }
        catch (e) {
            if (e instanceof TypeError) {
                throw new Error(`Failed to decode "${contentPath}" as UTF-8 text.`);
            }
            throw e;
        }
    }
}
exports.UpdateBufferBase = UpdateBufferBase;
/**
 * An utility class that allows buffers to be inserted to the _right or _left, or deleted, while
 * keeping indices to the original buffer.
 */
class UpdateBuffer extends UpdateBufferBase {
    constructor() {
        super(...arguments);
        this._mutatableContent = new magic_string_1.default(this._originalContent.toString());
    }
    _assertIndex(index) {
        if (index < 0 || index > this._originalContent.length) {
            throw new IndexOutOfBoundException(index, 0, this._originalContent.length);
        }
    }
    get length() {
        return this._mutatableContent.length();
    }
    get original() {
        return this._originalContent;
    }
    toString() {
        return this._mutatableContent.toString();
    }
    generate() {
        return Buffer.from(this.toString());
    }
    insertLeft(index, content) {
        this._assertIndex(index);
        this._mutatableContent.appendLeft(index, content.toString());
    }
    insertRight(index, content) {
        this._assertIndex(index);
        this._mutatableContent.appendRight(index, content.toString());
    }
    remove(index, length) {
        this._assertIndex(index);
        this._mutatableContent.remove(index, index + length);
    }
}
exports.UpdateBuffer = UpdateBuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLWJ1ZmZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3V0aWxpdHkvdXBkYXRlLWJ1ZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCwrQ0FBcUQ7QUFDckQsZ0VBQXVDO0FBQ3ZDLHlDQUF3QztBQUV4QyxNQUFhLHdCQUF5QixTQUFRLG9CQUFhO0lBQ3pELFlBQVksS0FBYSxFQUFFLEdBQVcsRUFBRSxHQUFHLEdBQUcsUUFBUTtRQUNwRCxLQUFLLENBQUMsU0FBUyxLQUFLLHNCQUFzQixHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM3RCxDQUFDO0NBQ0Y7QUFKRCw0REFJQztBQUVEOzs7R0FHRztBQUNILE1BQXNCLGdCQUFnQjtJQUNwQyxZQUFzQixnQkFBd0I7UUFBeEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFRO0lBQUcsQ0FBQztJQVNsRDs7Ozs7O09BTUc7SUFDSCxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQW1CLEVBQUUsZUFBdUI7UUFDeEQsSUFBSTtZQUNGLGlDQUFpQztZQUNqQyxJQUFJLHVCQUFXLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRWpFLE9BQU8sSUFBSSxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUM7U0FDMUM7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLElBQUksQ0FBQyxZQUFZLFNBQVMsRUFBRTtnQkFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsV0FBVyxrQkFBa0IsQ0FBQyxDQUFDO2FBQ3JFO1lBRUQsTUFBTSxDQUFDLENBQUM7U0FDVDtJQUNILENBQUM7Q0FDRjtBQS9CRCw0Q0ErQkM7QUFFRDs7O0dBR0c7QUFDSCxNQUFhLFlBQWEsU0FBUSxnQkFBZ0I7SUFBbEQ7O1FBQ1ksc0JBQWlCLEdBQWdCLElBQUksc0JBQVcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQXFDL0YsQ0FBQztJQW5DVyxZQUFZLENBQUMsS0FBYTtRQUNsQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUU7WUFDckQsTUFBTSxJQUFJLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzVFO0lBQ0gsQ0FBQztJQUVELElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFDRCxJQUFJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztJQUMvQixDQUFDO0lBRUQsUUFBUTtRQUNOLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzNDLENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxVQUFVLENBQUMsS0FBYSxFQUFFLE9BQWU7UUFDdkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQsV0FBVyxDQUFDLEtBQWEsRUFBRSxPQUFlO1FBQ3hDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVELE1BQU0sQ0FBQyxLQUFhLEVBQUUsTUFBYztRQUNsQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQztJQUN2RCxDQUFDO0NBQ0Y7QUF0Q0Qsb0NBc0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24gfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgTWFnaWNTdHJpbmcgZnJvbSAnbWFnaWMtc3RyaW5nJztcbmltcG9ydCB7IFRleHREZWNvZGVyIH0gZnJvbSAnbm9kZTp1dGlsJztcblxuZXhwb3J0IGNsYXNzIEluZGV4T3V0T2ZCb3VuZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcihpbmRleDogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4ID0gSW5maW5pdHkpIHtcbiAgICBzdXBlcihgSW5kZXggJHtpbmRleH0gb3V0c2lkZSBvZiByYW5nZSBbJHttaW59LCAke21heH1dLmApO1xuICB9XG59XG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgYW4gdXBkYXRlIGJ1ZmZlciBpbXBsZW1lbnRhdGlvbiB0aGF0IGFsbG93cyBidWZmZXJzIHRvIGJlIGluc2VydGVkIHRvIHRoZSBfcmlnaHRcbiAqIG9yIF9sZWZ0LCBvciBkZWxldGVkLCB3aGlsZSBrZWVwaW5nIGluZGljZXMgdG8gdGhlIG9yaWdpbmFsIGJ1ZmZlci5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFVwZGF0ZUJ1ZmZlckJhc2Uge1xuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX29yaWdpbmFsQ29udGVudDogQnVmZmVyKSB7fVxuICBhYnN0cmFjdCBnZXQgbGVuZ3RoKCk6IG51bWJlcjtcbiAgYWJzdHJhY3QgZ2V0IG9yaWdpbmFsKCk6IEJ1ZmZlcjtcbiAgYWJzdHJhY3QgdG9TdHJpbmcoZW5jb2Rpbmc/OiBzdHJpbmcpOiBzdHJpbmc7XG4gIGFic3RyYWN0IGdlbmVyYXRlKCk6IEJ1ZmZlcjtcbiAgYWJzdHJhY3QgaW5zZXJ0TGVmdChpbmRleDogbnVtYmVyLCBjb250ZW50OiBCdWZmZXIsIGFzc2VydD86IGJvb2xlYW4pOiB2b2lkO1xuICBhYnN0cmFjdCBpbnNlcnRSaWdodChpbmRleDogbnVtYmVyLCBjb250ZW50OiBCdWZmZXIsIGFzc2VydD86IGJvb2xlYW4pOiB2b2lkO1xuICBhYnN0cmFjdCByZW1vdmUoaW5kZXg6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIFVwZGF0ZUJ1ZmZlckJhc2UgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBjb250ZW50UGF0aCBUaGUgcGF0aCBvZiB0aGUgdXBkYXRlIGJ1ZmZlciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIG9yaWdpbmFsQ29udGVudCBUaGUgb3JpZ2luYWwgY29udGVudCBvZiB0aGUgdXBkYXRlIGJ1ZmZlciBpbnN0YW5jZS5cbiAgICogQHJldHVybnMgQW4gVXBkYXRlQnVmZmVyQmFzZSBpbnN0YW5jZS5cbiAgICovXG4gIHN0YXRpYyBjcmVhdGUoY29udGVudFBhdGg6IHN0cmluZywgb3JpZ2luYWxDb250ZW50OiBCdWZmZXIpOiBVcGRhdGVCdWZmZXJCYXNlIHtcbiAgICB0cnkge1xuICAgICAgLy8gV2Ugb25seSBzdXBwb3J0IHV0ZjggZW5jb2RpbmcuXG4gICAgICBuZXcgVGV4dERlY29kZXIoJ3V0ZjgnLCB7IGZhdGFsOiB0cnVlIH0pLmRlY29kZShvcmlnaW5hbENvbnRlbnQpO1xuXG4gICAgICByZXR1cm4gbmV3IFVwZGF0ZUJ1ZmZlcihvcmlnaW5hbENvbnRlbnQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgVHlwZUVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGRlY29kZSBcIiR7Y29udGVudFBhdGh9XCIgYXMgVVRGLTggdGV4dC5gKTtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBbiB1dGlsaXR5IGNsYXNzIHRoYXQgYWxsb3dzIGJ1ZmZlcnMgdG8gYmUgaW5zZXJ0ZWQgdG8gdGhlIF9yaWdodCBvciBfbGVmdCwgb3IgZGVsZXRlZCwgd2hpbGVcbiAqIGtlZXBpbmcgaW5kaWNlcyB0byB0aGUgb3JpZ2luYWwgYnVmZmVyLlxuICovXG5leHBvcnQgY2xhc3MgVXBkYXRlQnVmZmVyIGV4dGVuZHMgVXBkYXRlQnVmZmVyQmFzZSB7XG4gIHByb3RlY3RlZCBfbXV0YXRhYmxlQ29udGVudDogTWFnaWNTdHJpbmcgPSBuZXcgTWFnaWNTdHJpbmcodGhpcy5fb3JpZ2luYWxDb250ZW50LnRvU3RyaW5nKCkpO1xuXG4gIHByb3RlY3RlZCBfYXNzZXJ0SW5kZXgoaW5kZXg6IG51bWJlcikge1xuICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPiB0aGlzLl9vcmlnaW5hbENvbnRlbnQubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgSW5kZXhPdXRPZkJvdW5kRXhjZXB0aW9uKGluZGV4LCAwLCB0aGlzLl9vcmlnaW5hbENvbnRlbnQubGVuZ3RoKTtcbiAgICB9XG4gIH1cblxuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX211dGF0YWJsZUNvbnRlbnQubGVuZ3RoKCk7XG4gIH1cbiAgZ2V0IG9yaWdpbmFsKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuX29yaWdpbmFsQ29udGVudDtcbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX211dGF0YWJsZUNvbnRlbnQudG9TdHJpbmcoKTtcbiAgfVxuXG4gIGdlbmVyYXRlKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHRoaXMudG9TdHJpbmcoKSk7XG4gIH1cblxuICBpbnNlcnRMZWZ0KGluZGV4OiBudW1iZXIsIGNvbnRlbnQ6IEJ1ZmZlcik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydEluZGV4KGluZGV4KTtcbiAgICB0aGlzLl9tdXRhdGFibGVDb250ZW50LmFwcGVuZExlZnQoaW5kZXgsIGNvbnRlbnQudG9TdHJpbmcoKSk7XG4gIH1cblxuICBpbnNlcnRSaWdodChpbmRleDogbnVtYmVyLCBjb250ZW50OiBCdWZmZXIpOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnRJbmRleChpbmRleCk7XG4gICAgdGhpcy5fbXV0YXRhYmxlQ29udGVudC5hcHBlbmRSaWdodChpbmRleCwgY29udGVudC50b1N0cmluZygpKTtcbiAgfVxuXG4gIHJlbW92ZShpbmRleDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcikge1xuICAgIHRoaXMuX2Fzc2VydEluZGV4KGluZGV4KTtcbiAgICB0aGlzLl9tdXRhdGFibGVDb250ZW50LnJlbW92ZShpbmRleCwgaW5kZXggKyBsZW5ndGgpO1xuICB9XG59XG4iXX0=