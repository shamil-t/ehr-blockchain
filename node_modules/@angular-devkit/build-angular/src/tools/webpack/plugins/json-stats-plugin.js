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
exports.JsonStatsPlugin = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const error_1 = require("../../../utils/error");
const webpack_diagnostics_1 = require("../../../utils/webpack-diagnostics");
class JsonStatsPlugin {
    constructor(statsOutputPath) {
        this.statsOutputPath = statsOutputPath;
    }
    apply(compiler) {
        compiler.hooks.done.tapPromise('angular-json-stats', async (stats) => {
            const { stringifyStream } = await Promise.resolve().then(() => __importStar(require('@discoveryjs/json-ext')));
            const data = stats.toJson('verbose');
            try {
                await fs_1.promises.mkdir((0, path_1.dirname)(this.statsOutputPath), { recursive: true });
                await new Promise((resolve, reject) => stringifyStream(data)
                    .pipe((0, fs_1.createWriteStream)(this.statsOutputPath))
                    .on('close', resolve)
                    .on('error', reject));
            }
            catch (error) {
                (0, error_1.assertIsError)(error);
                (0, webpack_diagnostics_1.addError)(stats.compilation, `Unable to write stats file: ${error.message || 'unknown error'}`);
            }
        });
    }
}
exports.JsonStatsPlugin = JsonStatsPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1zdGF0cy1wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy90b29scy93ZWJwYWNrL3BsdWdpbnMvanNvbi1zdGF0cy1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCwyQkFBK0Q7QUFDL0QsK0JBQStCO0FBRS9CLGdEQUFxRDtBQUNyRCw0RUFBOEQ7QUFFOUQsTUFBYSxlQUFlO0lBQzFCLFlBQTZCLGVBQXVCO1FBQXZCLG9CQUFlLEdBQWYsZUFBZSxDQUFRO0lBQUcsQ0FBQztJQUV4RCxLQUFLLENBQUMsUUFBa0I7UUFDdEIsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLG9CQUFvQixFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNuRSxNQUFNLEVBQUUsZUFBZSxFQUFFLEdBQUcsd0RBQWEsdUJBQXVCLEdBQUMsQ0FBQztZQUNsRSxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXJDLElBQUk7Z0JBQ0YsTUFBTSxhQUFVLENBQUMsS0FBSyxDQUFDLElBQUEsY0FBTyxFQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQzFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7cUJBQ2xCLElBQUksQ0FBQyxJQUFBLHNCQUFpQixFQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztxQkFDN0MsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUM7cUJBQ3BCLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQ3ZCLENBQUM7YUFDSDtZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUNkLElBQUEscUJBQWEsRUFBQyxLQUFLLENBQUMsQ0FBQztnQkFDckIsSUFBQSw4QkFBUSxFQUNOLEtBQUssQ0FBQyxXQUFXLEVBQ2pCLCtCQUErQixLQUFLLENBQUMsT0FBTyxJQUFJLGVBQWUsRUFBRSxDQUNsRSxDQUFDO2FBQ0g7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXpCRCwwQ0F5QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgY3JlYXRlV3JpdGVTdHJlYW0sIHByb21pc2VzIGFzIGZzUHJvbWlzZXMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBDb21waWxlciB9IGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2Vycm9yJztcbmltcG9ydCB7IGFkZEVycm9yIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvd2VicGFjay1kaWFnbm9zdGljcyc7XG5cbmV4cG9ydCBjbGFzcyBKc29uU3RhdHNQbHVnaW4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHN0YXRzT3V0cHV0UGF0aDogc3RyaW5nKSB7fVxuXG4gIGFwcGx5KGNvbXBpbGVyOiBDb21waWxlcikge1xuICAgIGNvbXBpbGVyLmhvb2tzLmRvbmUudGFwUHJvbWlzZSgnYW5ndWxhci1qc29uLXN0YXRzJywgYXN5bmMgKHN0YXRzKSA9PiB7XG4gICAgICBjb25zdCB7IHN0cmluZ2lmeVN0cmVhbSB9ID0gYXdhaXQgaW1wb3J0KCdAZGlzY292ZXJ5anMvanNvbi1leHQnKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBzdGF0cy50b0pzb24oJ3ZlcmJvc2UnKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZnNQcm9taXNlcy5ta2RpcihkaXJuYW1lKHRoaXMuc3RhdHNPdXRwdXRQYXRoKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgICAgICAgc3RyaW5naWZ5U3RyZWFtKGRhdGEpXG4gICAgICAgICAgICAucGlwZShjcmVhdGVXcml0ZVN0cmVhbSh0aGlzLnN0YXRzT3V0cHV0UGF0aCkpXG4gICAgICAgICAgICAub24oJ2Nsb3NlJywgcmVzb2x2ZSlcbiAgICAgICAgICAgIC5vbignZXJyb3InLCByZWplY3QpLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgYXNzZXJ0SXNFcnJvcihlcnJvcik7XG4gICAgICAgIGFkZEVycm9yKFxuICAgICAgICAgIHN0YXRzLmNvbXBpbGF0aW9uLFxuICAgICAgICAgIGBVbmFibGUgdG8gd3JpdGUgc3RhdHMgZmlsZTogJHtlcnJvci5tZXNzYWdlIHx8ICd1bmtub3duIGVycm9yJ31gLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXX0=