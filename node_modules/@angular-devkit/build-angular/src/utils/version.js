"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertCompatibleAngularVersion = void 0;
/* eslint-disable no-console */
const core_1 = require("@angular-devkit/core");
const semver_1 = require("semver");
function assertCompatibleAngularVersion(projectRoot) {
    let angularCliPkgJson;
    let angularPkgJson;
    const resolveOptions = { paths: [projectRoot] };
    try {
        const angularPackagePath = require.resolve('@angular/core/package.json', resolveOptions);
        angularPkgJson = require(angularPackagePath);
    }
    catch {
        console.error(core_1.tags.stripIndents `
      You seem to not be depending on "@angular/core". This is an error.
    `);
        process.exit(2);
    }
    if (!(angularPkgJson && angularPkgJson['version'])) {
        console.error(core_1.tags.stripIndents `
      Cannot determine versions of "@angular/core".
      This likely means your local installation is broken. Please reinstall your packages.
    `);
        process.exit(2);
    }
    try {
        const angularCliPkgPath = require.resolve('@angular/cli/package.json', resolveOptions);
        angularCliPkgJson = require(angularCliPkgPath);
        if (!(angularCliPkgJson && angularCliPkgJson['version'])) {
            return;
        }
    }
    catch {
        // Not using @angular-devkit/build-angular with @angular/cli is ok too.
        // In this case we don't provide as many version checks.
        return;
    }
    if (angularCliPkgJson['version'] === '0.0.0' || angularPkgJson['version'] === '0.0.0') {
        // Internal CLI testing version or integration testing in the angular/angular
        // repository with the generated development @angular/core npm package which is versioned "0.0.0".
        return;
    }
    const supportedAngularSemver = require('../../package.json')['peerDependencies']['@angular/compiler-cli'];
    const angularVersion = new semver_1.SemVer(angularPkgJson['version']);
    if (!(0, semver_1.satisfies)(angularVersion, supportedAngularSemver, { includePrerelease: true })) {
        console.error(core_1.tags.stripIndents `
        This version of CLI is only compatible with Angular versions ${supportedAngularSemver},
        but Angular version ${angularVersion} was found instead.

        Please visit the link below to find instructions on how to update Angular.
        https://update.angular.io/
      ` + '\n');
        process.exit(3);
    }
}
exports.assertCompatibleAngularVersion = assertCompatibleAngularVersion;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3V0aWxzL3ZlcnNpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0JBQStCO0FBRS9CLCtDQUE0QztBQUM1QyxtQ0FBMkM7QUFFM0MsU0FBZ0IsOEJBQThCLENBQUMsV0FBbUI7SUFDaEUsSUFBSSxpQkFBaUIsQ0FBQztJQUN0QixJQUFJLGNBQWMsQ0FBQztJQUNuQixNQUFNLGNBQWMsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7SUFFaEQsSUFBSTtRQUNGLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyw0QkFBNEIsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUV6RixjQUFjLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7S0FDOUM7SUFBQyxNQUFNO1FBQ04sT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFJLENBQUMsWUFBWSxDQUFBOztLQUU5QixDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2pCO0lBRUQsSUFBSSxDQUFDLENBQUMsY0FBYyxJQUFJLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFO1FBQ2xELE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBSSxDQUFDLFlBQVksQ0FBQTs7O0tBRzlCLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDakI7SUFFRCxJQUFJO1FBQ0YsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLDJCQUEyQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3ZGLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxDQUFDLGlCQUFpQixJQUFJLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUU7WUFDeEQsT0FBTztTQUNSO0tBQ0Y7SUFBQyxNQUFNO1FBQ04sdUVBQXVFO1FBQ3ZFLHdEQUF3RDtRQUN4RCxPQUFPO0tBQ1I7SUFFRCxJQUFJLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxLQUFLLE9BQU8sSUFBSSxjQUFjLENBQUMsU0FBUyxDQUFDLEtBQUssT0FBTyxFQUFFO1FBQ3JGLDZFQUE2RTtRQUM3RSxrR0FBa0c7UUFDbEcsT0FBTztLQUNSO0lBRUQsTUFBTSxzQkFBc0IsR0FDMUIsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQzdFLE1BQU0sY0FBYyxHQUFHLElBQUksZUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBRTdELElBQUksQ0FBQyxJQUFBLGtCQUFTLEVBQUMsY0FBYyxFQUFFLHNCQUFzQixFQUFFLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTtRQUNuRixPQUFPLENBQUMsS0FBSyxDQUNYLFdBQUksQ0FBQyxZQUFZLENBQUE7dUVBQ2dELHNCQUFzQjs4QkFDL0QsY0FBYzs7OztPQUlyQyxHQUFHLElBQUksQ0FDVCxDQUFDO1FBRUYsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNqQjtBQUNILENBQUM7QUE3REQsd0VBNkRDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cblxuaW1wb3J0IHsgdGFncyB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IFNlbVZlciwgc2F0aXNmaWVzIH0gZnJvbSAnc2VtdmVyJztcblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydENvbXBhdGlibGVBbmd1bGFyVmVyc2lvbihwcm9qZWN0Um9vdDogc3RyaW5nKTogdm9pZCB8IG5ldmVyIHtcbiAgbGV0IGFuZ3VsYXJDbGlQa2dKc29uO1xuICBsZXQgYW5ndWxhclBrZ0pzb247XG4gIGNvbnN0IHJlc29sdmVPcHRpb25zID0geyBwYXRoczogW3Byb2plY3RSb290XSB9O1xuXG4gIHRyeSB7XG4gICAgY29uc3QgYW5ndWxhclBhY2thZ2VQYXRoID0gcmVxdWlyZS5yZXNvbHZlKCdAYW5ndWxhci9jb3JlL3BhY2thZ2UuanNvbicsIHJlc29sdmVPcHRpb25zKTtcblxuICAgIGFuZ3VsYXJQa2dKc29uID0gcmVxdWlyZShhbmd1bGFyUGFja2FnZVBhdGgpO1xuICB9IGNhdGNoIHtcbiAgICBjb25zb2xlLmVycm9yKHRhZ3Muc3RyaXBJbmRlbnRzYFxuICAgICAgWW91IHNlZW0gdG8gbm90IGJlIGRlcGVuZGluZyBvbiBcIkBhbmd1bGFyL2NvcmVcIi4gVGhpcyBpcyBhbiBlcnJvci5cbiAgICBgKTtcblxuICAgIHByb2Nlc3MuZXhpdCgyKTtcbiAgfVxuXG4gIGlmICghKGFuZ3VsYXJQa2dKc29uICYmIGFuZ3VsYXJQa2dKc29uWyd2ZXJzaW9uJ10pKSB7XG4gICAgY29uc29sZS5lcnJvcih0YWdzLnN0cmlwSW5kZW50c2BcbiAgICAgIENhbm5vdCBkZXRlcm1pbmUgdmVyc2lvbnMgb2YgXCJAYW5ndWxhci9jb3JlXCIuXG4gICAgICBUaGlzIGxpa2VseSBtZWFucyB5b3VyIGxvY2FsIGluc3RhbGxhdGlvbiBpcyBicm9rZW4uIFBsZWFzZSByZWluc3RhbGwgeW91ciBwYWNrYWdlcy5cbiAgICBgKTtcblxuICAgIHByb2Nlc3MuZXhpdCgyKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgYW5ndWxhckNsaVBrZ1BhdGggPSByZXF1aXJlLnJlc29sdmUoJ0Bhbmd1bGFyL2NsaS9wYWNrYWdlLmpzb24nLCByZXNvbHZlT3B0aW9ucyk7XG4gICAgYW5ndWxhckNsaVBrZ0pzb24gPSByZXF1aXJlKGFuZ3VsYXJDbGlQa2dQYXRoKTtcbiAgICBpZiAoIShhbmd1bGFyQ2xpUGtnSnNvbiAmJiBhbmd1bGFyQ2xpUGtnSnNvblsndmVyc2lvbiddKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gTm90IHVzaW5nIEBhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyIHdpdGggQGFuZ3VsYXIvY2xpIGlzIG9rIHRvby5cbiAgICAvLyBJbiB0aGlzIGNhc2Ugd2UgZG9uJ3QgcHJvdmlkZSBhcyBtYW55IHZlcnNpb24gY2hlY2tzLlxuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChhbmd1bGFyQ2xpUGtnSnNvblsndmVyc2lvbiddID09PSAnMC4wLjAnIHx8IGFuZ3VsYXJQa2dKc29uWyd2ZXJzaW9uJ10gPT09ICcwLjAuMCcpIHtcbiAgICAvLyBJbnRlcm5hbCBDTEkgdGVzdGluZyB2ZXJzaW9uIG9yIGludGVncmF0aW9uIHRlc3RpbmcgaW4gdGhlIGFuZ3VsYXIvYW5ndWxhclxuICAgIC8vIHJlcG9zaXRvcnkgd2l0aCB0aGUgZ2VuZXJhdGVkIGRldmVsb3BtZW50IEBhbmd1bGFyL2NvcmUgbnBtIHBhY2thZ2Ugd2hpY2ggaXMgdmVyc2lvbmVkIFwiMC4wLjBcIi5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdXBwb3J0ZWRBbmd1bGFyU2VtdmVyID1cbiAgICByZXF1aXJlKCcuLi8uLi9wYWNrYWdlLmpzb24nKVsncGVlckRlcGVuZGVuY2llcyddWydAYW5ndWxhci9jb21waWxlci1jbGknXTtcbiAgY29uc3QgYW5ndWxhclZlcnNpb24gPSBuZXcgU2VtVmVyKGFuZ3VsYXJQa2dKc29uWyd2ZXJzaW9uJ10pO1xuXG4gIGlmICghc2F0aXNmaWVzKGFuZ3VsYXJWZXJzaW9uLCBzdXBwb3J0ZWRBbmd1bGFyU2VtdmVyLCB7IGluY2x1ZGVQcmVyZWxlYXNlOiB0cnVlIH0pKSB7XG4gICAgY29uc29sZS5lcnJvcihcbiAgICAgIHRhZ3Muc3RyaXBJbmRlbnRzYFxuICAgICAgICBUaGlzIHZlcnNpb24gb2YgQ0xJIGlzIG9ubHkgY29tcGF0aWJsZSB3aXRoIEFuZ3VsYXIgdmVyc2lvbnMgJHtzdXBwb3J0ZWRBbmd1bGFyU2VtdmVyfSxcbiAgICAgICAgYnV0IEFuZ3VsYXIgdmVyc2lvbiAke2FuZ3VsYXJWZXJzaW9ufSB3YXMgZm91bmQgaW5zdGVhZC5cblxuICAgICAgICBQbGVhc2UgdmlzaXQgdGhlIGxpbmsgYmVsb3cgdG8gZmluZCBpbnN0cnVjdGlvbnMgb24gaG93IHRvIHVwZGF0ZSBBbmd1bGFyLlxuICAgICAgICBodHRwczovL3VwZGF0ZS5hbmd1bGFyLmlvL1xuICAgICAgYCArICdcXG4nLFxuICAgICk7XG5cbiAgICBwcm9jZXNzLmV4aXQoMyk7XG4gIH1cbn1cbiJdfQ==