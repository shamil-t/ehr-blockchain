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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tree = exports.workflow = exports.strings = exports.formats = exports.SchematicsException = void 0;
const core_1 = require("@angular-devkit/core");
Object.defineProperty(exports, "strings", { enumerable: true, get: function () { return core_1.strings; } });
const formats = __importStar(require("./formats/index"));
exports.formats = formats;
const interface_1 = require("./tree/interface");
const static_1 = require("./tree/static");
const workflow = __importStar(require("./workflow/index"));
exports.workflow = workflow;
var exception_1 = require("./exception/exception");
Object.defineProperty(exports, "SchematicsException", { enumerable: true, get: function () { return exception_1.SchematicsException; } });
__exportStar(require("./tree/action"), exports);
__exportStar(require("./engine/index"), exports);
__exportStar(require("./exception/exception"), exports);
__exportStar(require("./tree/interface"), exports);
__exportStar(require("./rules/base"), exports);
__exportStar(require("./rules/call"), exports);
__exportStar(require("./rules/move"), exports);
__exportStar(require("./rules/random"), exports);
__exportStar(require("./rules/schematic"), exports);
__exportStar(require("./rules/template"), exports);
__exportStar(require("./rules/url"), exports);
__exportStar(require("./tree/delegate"), exports);
__exportStar(require("./tree/empty"), exports);
__exportStar(require("./tree/host-tree"), exports);
__exportStar(require("./engine/schematic"), exports);
__exportStar(require("./sink/dryrun"), exports);
__exportStar(require("./sink/host"), exports);
__exportStar(require("./sink/sink"), exports);
exports.Tree = {
    empty() {
        return (0, static_1.empty)();
    },
    branch(tree) {
        return (0, static_1.branch)(tree);
    },
    merge(tree, other, strategy = interface_1.MergeStrategy.Default) {
        return (0, static_1.merge)(tree, other, strategy);
    },
    partition(tree, predicate) {
        return (0, static_1.partition)(tree, predicate);
    },
    optimize(tree) {
        return tree;
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUErQztBQTRCN0Isd0ZBNUJULGNBQU8sT0E0QlM7QUEzQnpCLHlEQUEyQztBQTJCbEMsMEJBQU87QUExQmhCLGdEQUF1RjtBQUN2RiwwQ0FBZ0U7QUFFaEUsMkRBQTZDO0FBdUJsQiw0QkFBUTtBQXJCbkMsbURBQTREO0FBQW5ELGdIQUFBLG1CQUFtQixPQUFBO0FBRTVCLGdEQUE4QjtBQUM5QixpREFBK0I7QUFDL0Isd0RBQXNDO0FBQ3RDLG1EQUFpQztBQUNqQywrQ0FBNkI7QUFDN0IsK0NBQTZCO0FBQzdCLCtDQUE2QjtBQUM3QixpREFBK0I7QUFDL0Isb0RBQWtDO0FBQ2xDLG1EQUFpQztBQUNqQyw4Q0FBNEI7QUFDNUIsa0RBQWdDO0FBQ2hDLCtDQUE2QjtBQUM3QixtREFBaUM7QUFFakMscURBQW1DO0FBQ25DLGdEQUE4QjtBQUM5Qiw4Q0FBNEI7QUFDNUIsOENBQTRCO0FBWWYsUUFBQSxJQUFJLEdBQW9CO0lBQ25DLEtBQUs7UUFDSCxPQUFPLElBQUEsY0FBSyxHQUFFLENBQUM7SUFDakIsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFtQjtRQUN4QixPQUFPLElBQUEsZUFBTSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFDRCxLQUFLLENBQ0gsSUFBbUIsRUFDbkIsS0FBb0IsRUFDcEIsV0FBMEIseUJBQWEsQ0FBQyxPQUFPO1FBRS9DLE9BQU8sSUFBQSxjQUFLLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsU0FBUyxDQUFDLElBQW1CLEVBQUUsU0FBaUM7UUFDOUQsT0FBTyxJQUFBLGtCQUFTLEVBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRCxRQUFRLENBQUMsSUFBbUI7UUFDMUIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBzdHJpbmdzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0ICogYXMgZm9ybWF0cyBmcm9tICcuL2Zvcm1hdHMvaW5kZXgnO1xuaW1wb3J0IHsgRmlsZVByZWRpY2F0ZSwgTWVyZ2VTdHJhdGVneSwgVHJlZSBhcyBUcmVlSW50ZXJmYWNlIH0gZnJvbSAnLi90cmVlL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBicmFuY2gsIGVtcHR5LCBtZXJnZSwgcGFydGl0aW9uIH0gZnJvbSAnLi90cmVlL3N0YXRpYyc7XG5cbmltcG9ydCAqIGFzIHdvcmtmbG93IGZyb20gJy4vd29ya2Zsb3cvaW5kZXgnO1xuXG5leHBvcnQgeyBTY2hlbWF0aWNzRXhjZXB0aW9uIH0gZnJvbSAnLi9leGNlcHRpb24vZXhjZXB0aW9uJztcblxuZXhwb3J0ICogZnJvbSAnLi90cmVlL2FjdGlvbic7XG5leHBvcnQgKiBmcm9tICcuL2VuZ2luZS9pbmRleCc7XG5leHBvcnQgKiBmcm9tICcuL2V4Y2VwdGlvbi9leGNlcHRpb24nO1xuZXhwb3J0ICogZnJvbSAnLi90cmVlL2ludGVyZmFjZSc7XG5leHBvcnQgKiBmcm9tICcuL3J1bGVzL2Jhc2UnO1xuZXhwb3J0ICogZnJvbSAnLi9ydWxlcy9jYWxsJztcbmV4cG9ydCAqIGZyb20gJy4vcnVsZXMvbW92ZSc7XG5leHBvcnQgKiBmcm9tICcuL3J1bGVzL3JhbmRvbSc7XG5leHBvcnQgKiBmcm9tICcuL3J1bGVzL3NjaGVtYXRpYyc7XG5leHBvcnQgKiBmcm9tICcuL3J1bGVzL3RlbXBsYXRlJztcbmV4cG9ydCAqIGZyb20gJy4vcnVsZXMvdXJsJztcbmV4cG9ydCAqIGZyb20gJy4vdHJlZS9kZWxlZ2F0ZSc7XG5leHBvcnQgKiBmcm9tICcuL3RyZWUvZW1wdHknO1xuZXhwb3J0ICogZnJvbSAnLi90cmVlL2hvc3QtdHJlZSc7XG5leHBvcnQgeyBVcGRhdGVSZWNvcmRlciB9IGZyb20gJy4vdHJlZS9pbnRlcmZhY2UnO1xuZXhwb3J0ICogZnJvbSAnLi9lbmdpbmUvc2NoZW1hdGljJztcbmV4cG9ydCAqIGZyb20gJy4vc2luay9kcnlydW4nO1xuZXhwb3J0ICogZnJvbSAnLi9zaW5rL2hvc3QnO1xuZXhwb3J0ICogZnJvbSAnLi9zaW5rL3NpbmsnO1xuZXhwb3J0IHsgZm9ybWF0cywgc3RyaW5ncywgd29ya2Zsb3cgfTtcblxuZXhwb3J0IGludGVyZmFjZSBUcmVlQ29uc3RydWN0b3Ige1xuICBlbXB0eSgpOiBUcmVlSW50ZXJmYWNlO1xuICBicmFuY2godHJlZTogVHJlZUludGVyZmFjZSk6IFRyZWVJbnRlcmZhY2U7XG4gIG1lcmdlKHRyZWU6IFRyZWVJbnRlcmZhY2UsIG90aGVyOiBUcmVlSW50ZXJmYWNlLCBzdHJhdGVneT86IE1lcmdlU3RyYXRlZ3kpOiBUcmVlSW50ZXJmYWNlO1xuICBwYXJ0aXRpb24odHJlZTogVHJlZUludGVyZmFjZSwgcHJlZGljYXRlOiBGaWxlUHJlZGljYXRlPGJvb2xlYW4+KTogW1RyZWVJbnRlcmZhY2UsIFRyZWVJbnRlcmZhY2VdO1xuICBvcHRpbWl6ZSh0cmVlOiBUcmVlSW50ZXJmYWNlKTogVHJlZUludGVyZmFjZTtcbn1cblxuZXhwb3J0IHR5cGUgVHJlZSA9IFRyZWVJbnRlcmZhY2U7XG5leHBvcnQgY29uc3QgVHJlZTogVHJlZUNvbnN0cnVjdG9yID0ge1xuICBlbXB0eSgpIHtcbiAgICByZXR1cm4gZW1wdHkoKTtcbiAgfSxcbiAgYnJhbmNoKHRyZWU6IFRyZWVJbnRlcmZhY2UpIHtcbiAgICByZXR1cm4gYnJhbmNoKHRyZWUpO1xuICB9LFxuICBtZXJnZShcbiAgICB0cmVlOiBUcmVlSW50ZXJmYWNlLFxuICAgIG90aGVyOiBUcmVlSW50ZXJmYWNlLFxuICAgIHN0cmF0ZWd5OiBNZXJnZVN0cmF0ZWd5ID0gTWVyZ2VTdHJhdGVneS5EZWZhdWx0LFxuICApIHtcbiAgICByZXR1cm4gbWVyZ2UodHJlZSwgb3RoZXIsIHN0cmF0ZWd5KTtcbiAgfSxcbiAgcGFydGl0aW9uKHRyZWU6IFRyZWVJbnRlcmZhY2UsIHByZWRpY2F0ZTogRmlsZVByZWRpY2F0ZTxib29sZWFuPikge1xuICAgIHJldHVybiBwYXJ0aXRpb24odHJlZSwgcHJlZGljYXRlKTtcbiAgfSxcbiAgb3B0aW1pemUodHJlZTogVHJlZUludGVyZmFjZSkge1xuICAgIHJldHVybiB0cmVlO1xuICB9LFxufTtcbiJdfQ==