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
exports.BuiltinTaskExecutor = void 0;
const options_1 = require("../package-manager/options");
const options_2 = require("../repo-init/options");
const options_3 = require("../run-schematic/options");
class BuiltinTaskExecutor {
}
exports.BuiltinTaskExecutor = BuiltinTaskExecutor;
BuiltinTaskExecutor.NodePackage = {
    name: options_1.NodePackageName,
    create: (options) => Promise.resolve().then(() => __importStar(require('../package-manager/executor'))).then((mod) => mod.default(options)),
};
BuiltinTaskExecutor.RepositoryInitializer = {
    name: options_2.RepositoryInitializerName,
    create: (options) => Promise.resolve().then(() => __importStar(require('../repo-init/executor'))).then((mod) => mod.default(options)),
};
BuiltinTaskExecutor.RunSchematic = {
    name: options_3.RunSchematicName,
    create: () => Promise.resolve().then(() => __importStar(require('../run-schematic/executor'))).then((mod) => mod.default()),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL25vZGUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCx3REFBNEY7QUFDNUYsa0RBRzhCO0FBQzlCLHNEQUE0RDtBQUU1RCxNQUFhLG1CQUFtQjs7QUFBaEMsa0RBa0JDO0FBakJpQiwrQkFBVyxHQUF1RDtJQUNoRixJQUFJLEVBQUUseUJBQWU7SUFDckIsTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FDbEIsa0RBQU8sNkJBQTZCLElBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUV2RTtDQUNKLENBQUM7QUFDYyx5Q0FBcUIsR0FDbkM7SUFDRSxJQUFJLEVBQUUsbUNBQXlCO0lBQy9CLE1BQU0sRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsa0RBQU8sdUJBQXVCLElBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0NBQ3pGLENBQUM7QUFDWSxnQ0FBWSxHQUE0QjtJQUN0RCxJQUFJLEVBQUUsMEJBQWdCO0lBQ3RCLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FDWCxrREFBTywyQkFBMkIsSUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBOEI7Q0FDaEcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBUYXNrRXhlY3V0b3IsIFRhc2tFeGVjdXRvckZhY3RvcnkgfSBmcm9tICcuLi8uLi9zcmMnO1xuaW1wb3J0IHsgTm9kZVBhY2thZ2VOYW1lLCBOb2RlUGFja2FnZVRhc2tGYWN0b3J5T3B0aW9ucyB9IGZyb20gJy4uL3BhY2thZ2UtbWFuYWdlci9vcHRpb25zJztcbmltcG9ydCB7XG4gIFJlcG9zaXRvcnlJbml0aWFsaXplck5hbWUsXG4gIFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tGYWN0b3J5T3B0aW9ucyxcbn0gZnJvbSAnLi4vcmVwby1pbml0L29wdGlvbnMnO1xuaW1wb3J0IHsgUnVuU2NoZW1hdGljTmFtZSB9IGZyb20gJy4uL3J1bi1zY2hlbWF0aWMvb3B0aW9ucyc7XG5cbmV4cG9ydCBjbGFzcyBCdWlsdGluVGFza0V4ZWN1dG9yIHtcbiAgc3RhdGljIHJlYWRvbmx5IE5vZGVQYWNrYWdlOiBUYXNrRXhlY3V0b3JGYWN0b3J5PE5vZGVQYWNrYWdlVGFza0ZhY3RvcnlPcHRpb25zPiA9IHtcbiAgICBuYW1lOiBOb2RlUGFja2FnZU5hbWUsXG4gICAgY3JlYXRlOiAob3B0aW9ucykgPT5cbiAgICAgIGltcG9ydCgnLi4vcGFja2FnZS1tYW5hZ2VyL2V4ZWN1dG9yJykudGhlbigobW9kKSA9PiBtb2QuZGVmYXVsdChvcHRpb25zKSkgYXMgUHJvbWlzZTxcbiAgICAgICAgVGFza0V4ZWN1dG9yPHt9PlxuICAgICAgPixcbiAgfTtcbiAgc3RhdGljIHJlYWRvbmx5IFJlcG9zaXRvcnlJbml0aWFsaXplcjogVGFza0V4ZWN1dG9yRmFjdG9yeTxSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrRmFjdG9yeU9wdGlvbnM+ID1cbiAgICB7XG4gICAgICBuYW1lOiBSZXBvc2l0b3J5SW5pdGlhbGl6ZXJOYW1lLFxuICAgICAgY3JlYXRlOiAob3B0aW9ucykgPT4gaW1wb3J0KCcuLi9yZXBvLWluaXQvZXhlY3V0b3InKS50aGVuKChtb2QpID0+IG1vZC5kZWZhdWx0KG9wdGlvbnMpKSxcbiAgICB9O1xuICBzdGF0aWMgcmVhZG9ubHkgUnVuU2NoZW1hdGljOiBUYXNrRXhlY3V0b3JGYWN0b3J5PHt9PiA9IHtcbiAgICBuYW1lOiBSdW5TY2hlbWF0aWNOYW1lLFxuICAgIGNyZWF0ZTogKCkgPT5cbiAgICAgIGltcG9ydCgnLi4vcnVuLXNjaGVtYXRpYy9leGVjdXRvcicpLnRoZW4oKG1vZCkgPT4gbW9kLmRlZmF1bHQoKSkgYXMgUHJvbWlzZTxUYXNrRXhlY3V0b3I8e30+PixcbiAgfTtcbn1cbiJdfQ==