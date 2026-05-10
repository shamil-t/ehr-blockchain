"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const workspace_1 = require("../../utility/workspace");
const workspace_models_1 = require("../../utility/workspace-models");
function default_1() {
    return (0, workspace_1.updateWorkspace)((workspace) => {
        for (const project of workspace.projects.values()) {
            for (const target of project.targets.values()) {
                if (target.builder !== workspace_models_1.Builders.Server) {
                    continue;
                }
                for (const [, options] of (0, workspace_1.allTargetOptions)(target)) {
                    // Set 'buildOptimizer' to match the 'optimization' option.
                    if (options.buildOptimizer === undefined && options.optimization !== undefined) {
                        options.buildOptimizer = !!options.optimization;
                    }
                }
            }
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLXNlcnZlci1idWlsZGVyLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3NjaGVtYXRpY3MvYW5ndWxhci9taWdyYXRpb25zL3VwZGF0ZS0xNi91cGRhdGUtc2VydmVyLWJ1aWxkZXItY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBR0gsdURBQTRFO0FBQzVFLHFFQUEwRDtBQUUxRDtJQUNFLE9BQU8sSUFBQSwyQkFBZSxFQUFDLENBQUMsU0FBUyxFQUFFLEVBQUU7UUFDbkMsS0FBSyxNQUFNLE9BQU8sSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2pELEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDN0MsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLDJCQUFRLENBQUMsTUFBTSxFQUFFO29CQUN0QyxTQUFTO2lCQUNWO2dCQUVELEtBQUssTUFBTSxDQUFDLEVBQUUsT0FBTyxDQUFDLElBQUksSUFBQSw0QkFBZ0IsRUFBQyxNQUFNLENBQUMsRUFBRTtvQkFDbEQsMkRBQTJEO29CQUMzRCxJQUFJLE9BQU8sQ0FBQyxjQUFjLEtBQUssU0FBUyxJQUFJLE9BQU8sQ0FBQyxZQUFZLEtBQUssU0FBUyxFQUFFO3dCQUM5RSxPQUFPLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDO3FCQUNqRDtpQkFDRjthQUNGO1NBQ0Y7SUFDSCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFqQkQsNEJBaUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFJ1bGUgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgeyBhbGxUYXJnZXRPcHRpb25zLCB1cGRhdGVXb3Jrc3BhY2UgfSBmcm9tICcuLi8uLi91dGlsaXR5L3dvcmtzcGFjZSc7XG5pbXBvcnQgeyBCdWlsZGVycyB9IGZyb20gJy4uLy4uL3V0aWxpdHkvd29ya3NwYWNlLW1vZGVscyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICgpOiBSdWxlIHtcbiAgcmV0dXJuIHVwZGF0ZVdvcmtzcGFjZSgod29ya3NwYWNlKSA9PiB7XG4gICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHdvcmtzcGFjZS5wcm9qZWN0cy52YWx1ZXMoKSkge1xuICAgICAgZm9yIChjb25zdCB0YXJnZXQgb2YgcHJvamVjdC50YXJnZXRzLnZhbHVlcygpKSB7XG4gICAgICAgIGlmICh0YXJnZXQuYnVpbGRlciAhPT0gQnVpbGRlcnMuU2VydmVyKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IFssIG9wdGlvbnNdIG9mIGFsbFRhcmdldE9wdGlvbnModGFyZ2V0KSkge1xuICAgICAgICAgIC8vIFNldCAnYnVpbGRPcHRpbWl6ZXInIHRvIG1hdGNoIHRoZSAnb3B0aW1pemF0aW9uJyBvcHRpb24uXG4gICAgICAgICAgaWYgKG9wdGlvbnMuYnVpbGRPcHRpbWl6ZXIgPT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLm9wdGltaXphdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBvcHRpb25zLmJ1aWxkT3B0aW1pemVyID0gISFvcHRpb25zLm9wdGltaXphdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuIl19