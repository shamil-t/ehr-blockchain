"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressPlugin = void 0;
const webpack_1 = require("webpack");
const spinner_1 = require("../../../utils/spinner");
class ProgressPlugin extends webpack_1.ProgressPlugin {
    constructor(platform) {
        const platformCapitalFirst = platform.replace(/^\w/, (s) => s.toUpperCase());
        const spinner = new spinner_1.Spinner();
        spinner.start(`Generating ${platform} application bundles (phase: setup)...`);
        super({
            handler: (percentage, message) => {
                const phase = message ? ` (phase: ${message})` : '';
                spinner.text = `Generating ${platform} application bundles${phase}...`;
                switch (percentage) {
                    case 1:
                        if (spinner.isSpinning) {
                            spinner.succeed(`${platformCapitalFirst} application bundle generation complete.`);
                        }
                        break;
                    case 0:
                        if (!spinner.isSpinning) {
                            spinner.start();
                        }
                        break;
                }
            },
        });
    }
}
exports.ProgressPlugin = ProgressPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3MtcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdG9vbHMvd2VicGFjay9wbHVnaW5zL3Byb2dyZXNzLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxxQ0FBa0U7QUFDbEUsb0RBQWlEO0FBRWpELE1BQWEsY0FBZSxTQUFRLHdCQUFxQjtJQUN2RCxZQUFZLFFBQThCO1FBQ3hDLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQzdFLE1BQU0sT0FBTyxHQUFHLElBQUksaUJBQU8sRUFBRSxDQUFDO1FBQzlCLE9BQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxRQUFRLHdDQUF3QyxDQUFDLENBQUM7UUFFOUUsS0FBSyxDQUFDO1lBQ0osT0FBTyxFQUFFLENBQUMsVUFBa0IsRUFBRSxPQUFlLEVBQUUsRUFBRTtnQkFDL0MsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxZQUFZLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BELE9BQU8sQ0FBQyxJQUFJLEdBQUcsY0FBYyxRQUFRLHVCQUF1QixLQUFLLEtBQUssQ0FBQztnQkFFdkUsUUFBUSxVQUFVLEVBQUU7b0JBQ2xCLEtBQUssQ0FBQzt3QkFDSixJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUU7NEJBQ3RCLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxvQkFBb0IsMENBQTBDLENBQUMsQ0FBQzt5QkFDcEY7d0JBQ0QsTUFBTTtvQkFDUixLQUFLLENBQUM7d0JBQ0osSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7NEJBQ3ZCLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQzt5QkFDakI7d0JBQ0QsTUFBTTtpQkFDVDtZQUNILENBQUM7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUExQkQsd0NBMEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IFByb2dyZXNzUGx1Z2luIGFzIFdlYnBhY2tQcm9ncmVzc1BsdWdpbiB9IGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0IHsgU3Bpbm5lciB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3NwaW5uZXInO1xuXG5leHBvcnQgY2xhc3MgUHJvZ3Jlc3NQbHVnaW4gZXh0ZW5kcyBXZWJwYWNrUHJvZ3Jlc3NQbHVnaW4ge1xuICBjb25zdHJ1Y3RvcihwbGF0Zm9ybTogJ3NlcnZlcicgfCAnYnJvd3NlcicpIHtcbiAgICBjb25zdCBwbGF0Zm9ybUNhcGl0YWxGaXJzdCA9IHBsYXRmb3JtLnJlcGxhY2UoL15cXHcvLCAocykgPT4gcy50b1VwcGVyQ2FzZSgpKTtcbiAgICBjb25zdCBzcGlubmVyID0gbmV3IFNwaW5uZXIoKTtcbiAgICBzcGlubmVyLnN0YXJ0KGBHZW5lcmF0aW5nICR7cGxhdGZvcm19IGFwcGxpY2F0aW9uIGJ1bmRsZXMgKHBoYXNlOiBzZXR1cCkuLi5gKTtcblxuICAgIHN1cGVyKHtcbiAgICAgIGhhbmRsZXI6IChwZXJjZW50YWdlOiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBwaGFzZSA9IG1lc3NhZ2UgPyBgIChwaGFzZTogJHttZXNzYWdlfSlgIDogJyc7XG4gICAgICAgIHNwaW5uZXIudGV4dCA9IGBHZW5lcmF0aW5nICR7cGxhdGZvcm19IGFwcGxpY2F0aW9uIGJ1bmRsZXMke3BoYXNlfS4uLmA7XG5cbiAgICAgICAgc3dpdGNoIChwZXJjZW50YWdlKSB7XG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgaWYgKHNwaW5uZXIuaXNTcGlubmluZykge1xuICAgICAgICAgICAgICBzcGlubmVyLnN1Y2NlZWQoYCR7cGxhdGZvcm1DYXBpdGFsRmlyc3R9IGFwcGxpY2F0aW9uIGJ1bmRsZSBnZW5lcmF0aW9uIGNvbXBsZXRlLmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgaWYgKCFzcGlubmVyLmlzU3Bpbm5pbmcpIHtcbiAgICAgICAgICAgICAgc3Bpbm5lci5zdGFydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==