"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopedHost = void 0;
const path_1 = require("../path");
const resolver_1 = require("./resolver");
class ScopedHost extends resolver_1.ResolverHost {
    constructor(delegate, _root = path_1.NormalizedRoot) {
        super(delegate);
        this._root = _root;
    }
    _resolve(path) {
        return (0, path_1.join)(this._root, path);
    }
}
exports.ScopedHost = ScopedHost;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvY29yZS9zcmMvdmlydHVhbC1mcy9ob3N0L3Njb3BlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxrQ0FBcUQ7QUFFckQseUNBQTBDO0FBRTFDLE1BQWEsVUFBNkIsU0FBUSx1QkFBZTtJQUMvRCxZQUFZLFFBQWlCLEVBQVksUUFBYyxxQkFBYztRQUNuRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFEdUIsVUFBSyxHQUFMLEtBQUssQ0FBdUI7SUFFckUsQ0FBQztJQUVTLFFBQVEsQ0FBQyxJQUFVO1FBQzNCLE9BQU8sSUFBQSxXQUFJLEVBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNoQyxDQUFDO0NBQ0Y7QUFSRCxnQ0FRQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBOb3JtYWxpemVkUm9vdCwgUGF0aCwgam9pbiB9IGZyb20gJy4uL3BhdGgnO1xuaW1wb3J0IHsgSG9zdCB9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IFJlc29sdmVySG9zdCB9IGZyb20gJy4vcmVzb2x2ZXInO1xuXG5leHBvcnQgY2xhc3MgU2NvcGVkSG9zdDxUIGV4dGVuZHMgb2JqZWN0PiBleHRlbmRzIFJlc29sdmVySG9zdDxUPiB7XG4gIGNvbnN0cnVjdG9yKGRlbGVnYXRlOiBIb3N0PFQ+LCBwcm90ZWN0ZWQgX3Jvb3Q6IFBhdGggPSBOb3JtYWxpemVkUm9vdCkge1xuICAgIHN1cGVyKGRlbGVnYXRlKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfcmVzb2x2ZShwYXRoOiBQYXRoKTogUGF0aCB7XG4gICAgcmV0dXJuIGpvaW4odGhpcy5fcm9vdCwgcGF0aCk7XG4gIH1cbn1cbiJdfQ==