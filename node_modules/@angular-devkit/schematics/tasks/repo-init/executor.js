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
const core_1 = require("@angular-devkit/core");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
function default_1(factoryOptions = {}) {
    const rootDirectory = factoryOptions.rootDirectory || process.cwd();
    return async (options = {}, context) => {
        const authorName = options.authorName;
        const authorEmail = options.authorEmail;
        const execute = (args, ignoreErrorStream) => {
            const outputStream = 'ignore';
            const errorStream = ignoreErrorStream ? 'ignore' : process.stderr;
            const spawnOptions = {
                stdio: [process.stdin, outputStream, errorStream],
                shell: true,
                cwd: path.join(rootDirectory, options.workingDirectory || ''),
                env: {
                    ...process.env,
                    ...(authorName ? { GIT_AUTHOR_NAME: authorName, GIT_COMMITTER_NAME: authorName } : {}),
                    ...(authorEmail
                        ? { GIT_AUTHOR_EMAIL: authorEmail, GIT_COMMITTER_EMAIL: authorEmail }
                        : {}),
                },
            };
            return new Promise((resolve, reject) => {
                (0, child_process_1.spawn)('git', args, spawnOptions).on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    }
                    else {
                        reject(code);
                    }
                });
            });
        };
        const hasCommand = await execute(['--version']).then(() => true, () => false);
        if (!hasCommand) {
            return;
        }
        const insideRepo = await execute(['rev-parse', '--is-inside-work-tree'], true).then(() => true, () => false);
        if (insideRepo) {
            context.logger.info(core_1.tags.oneLine `
        Directory is already under version control.
        Skipping initialization of git.
      `);
            return;
        }
        // if git is not found or an error was thrown during the `git`
        // init process just swallow any errors here
        // NOTE: This will be removed once task error handling is implemented
        try {
            await execute(['init']);
            await execute(['add', '.']);
            if (options.commit) {
                const message = options.message || 'initial commit';
                await execute(['commit', `-m "${message}"`]);
            }
            context.logger.info('Successfully initialized git.');
        }
        catch { }
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9zY2hlbWF0aWNzL3Rhc2tzL3JlcG8taW5pdC9leGVjdXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0NBQTRDO0FBQzVDLGlEQUFvRDtBQUNwRCwyQ0FBNkI7QUFPN0IsbUJBQ0UsaUJBQTBELEVBQUU7SUFFNUQsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLGFBQWEsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFcEUsT0FBTyxLQUFLLEVBQUUsVUFBNEMsRUFBRSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtRQUN6RixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBQ3RDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFFeEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFjLEVBQUUsaUJBQTJCLEVBQUUsRUFBRTtZQUM5RCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUM7WUFDOUIsTUFBTSxXQUFXLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNsRSxNQUFNLFlBQVksR0FBaUI7Z0JBQ2pDLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBQztnQkFDakQsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFLENBQUM7Z0JBQzdELEdBQUcsRUFBRTtvQkFDSCxHQUFHLE9BQU8sQ0FBQyxHQUFHO29CQUNkLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUN0RixHQUFHLENBQUMsV0FBVzt3QkFDYixDQUFDLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFO3dCQUNyRSxDQUFDLENBQUMsRUFBRSxDQUFDO2lCQUNSO2FBQ0YsQ0FBQztZQUVGLE9BQU8sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQzNDLElBQUEscUJBQUssRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRTtvQkFDNUQsSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFO3dCQUNkLE9BQU8sRUFBRSxDQUFDO3FCQUNYO3lCQUFNO3dCQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztxQkFDZDtnQkFDSCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBRUYsTUFBTSxVQUFVLEdBQUcsTUFBTSxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDbEQsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUNWLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FDWixDQUFDO1FBQ0YsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNmLE9BQU87U0FDUjtRQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLHVCQUF1QixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUNqRixHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQ1YsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUNaLENBQUM7UUFDRixJQUFJLFVBQVUsRUFBRTtZQUNkLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQUksQ0FBQyxPQUFPLENBQUE7OztPQUcvQixDQUFDLENBQUM7WUFFSCxPQUFPO1NBQ1I7UUFFRCw4REFBOEQ7UUFDOUQsNENBQTRDO1FBQzVDLHFFQUFxRTtRQUNyRSxJQUFJO1lBQ0YsTUFBTSxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFNUIsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFO2dCQUNsQixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLGdCQUFnQixDQUFDO2dCQUVwRCxNQUFNLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQzthQUM5QztZQUVELE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLCtCQUErQixDQUFDLENBQUM7U0FDdEQ7UUFBQyxNQUFNLEdBQUU7SUFDWixDQUFDLENBQUM7QUFDSixDQUFDO0FBekVELDRCQXlFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyB0YWdzIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgU3Bhd25PcHRpb25zLCBzcGF3biB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IFNjaGVtYXRpY0NvbnRleHQsIFRhc2tFeGVjdXRvciB9IGZyb20gJy4uLy4uL3NyYyc7XG5pbXBvcnQge1xuICBSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrRmFjdG9yeU9wdGlvbnMsXG4gIFJlcG9zaXRvcnlJbml0aWFsaXplclRhc2tPcHRpb25zLFxufSBmcm9tICcuL29wdGlvbnMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoXG4gIGZhY3RvcnlPcHRpb25zOiBSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrRmFjdG9yeU9wdGlvbnMgPSB7fSxcbik6IFRhc2tFeGVjdXRvcjxSZXBvc2l0b3J5SW5pdGlhbGl6ZXJUYXNrT3B0aW9ucz4ge1xuICBjb25zdCByb290RGlyZWN0b3J5ID0gZmFjdG9yeU9wdGlvbnMucm9vdERpcmVjdG9yeSB8fCBwcm9jZXNzLmN3ZCgpO1xuXG4gIHJldHVybiBhc3luYyAob3B0aW9uczogUmVwb3NpdG9yeUluaXRpYWxpemVyVGFza09wdGlvbnMgPSB7fSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IGF1dGhvck5hbWUgPSBvcHRpb25zLmF1dGhvck5hbWU7XG4gICAgY29uc3QgYXV0aG9yRW1haWwgPSBvcHRpb25zLmF1dGhvckVtYWlsO1xuXG4gICAgY29uc3QgZXhlY3V0ZSA9IChhcmdzOiBzdHJpbmdbXSwgaWdub3JlRXJyb3JTdHJlYW0/OiBib29sZWFuKSA9PiB7XG4gICAgICBjb25zdCBvdXRwdXRTdHJlYW0gPSAnaWdub3JlJztcbiAgICAgIGNvbnN0IGVycm9yU3RyZWFtID0gaWdub3JlRXJyb3JTdHJlYW0gPyAnaWdub3JlJyA6IHByb2Nlc3Muc3RkZXJyO1xuICAgICAgY29uc3Qgc3Bhd25PcHRpb25zOiBTcGF3bk9wdGlvbnMgPSB7XG4gICAgICAgIHN0ZGlvOiBbcHJvY2Vzcy5zdGRpbiwgb3V0cHV0U3RyZWFtLCBlcnJvclN0cmVhbV0sXG4gICAgICAgIHNoZWxsOiB0cnVlLFxuICAgICAgICBjd2Q6IHBhdGguam9pbihyb290RGlyZWN0b3J5LCBvcHRpb25zLndvcmtpbmdEaXJlY3RvcnkgfHwgJycpLFxuICAgICAgICBlbnY6IHtcbiAgICAgICAgICAuLi5wcm9jZXNzLmVudixcbiAgICAgICAgICAuLi4oYXV0aG9yTmFtZSA/IHsgR0lUX0FVVEhPUl9OQU1FOiBhdXRob3JOYW1lLCBHSVRfQ09NTUlUVEVSX05BTUU6IGF1dGhvck5hbWUgfSA6IHt9KSxcbiAgICAgICAgICAuLi4oYXV0aG9yRW1haWxcbiAgICAgICAgICAgID8geyBHSVRfQVVUSE9SX0VNQUlMOiBhdXRob3JFbWFpbCwgR0lUX0NPTU1JVFRFUl9FTUFJTDogYXV0aG9yRW1haWwgfVxuICAgICAgICAgICAgOiB7fSksXG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBzcGF3bignZ2l0JywgYXJncywgc3Bhd25PcHRpb25zKS5vbignY2xvc2UnLCAoY29kZTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KGNvZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgaGFzQ29tbWFuZCA9IGF3YWl0IGV4ZWN1dGUoWyctLXZlcnNpb24nXSkudGhlbihcbiAgICAgICgpID0+IHRydWUsXG4gICAgICAoKSA9PiBmYWxzZSxcbiAgICApO1xuICAgIGlmICghaGFzQ29tbWFuZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGluc2lkZVJlcG8gPSBhd2FpdCBleGVjdXRlKFsncmV2LXBhcnNlJywgJy0taXMtaW5zaWRlLXdvcmstdHJlZSddLCB0cnVlKS50aGVuKFxuICAgICAgKCkgPT4gdHJ1ZSxcbiAgICAgICgpID0+IGZhbHNlLFxuICAgICk7XG4gICAgaWYgKGluc2lkZVJlcG8pIHtcbiAgICAgIGNvbnRleHQubG9nZ2VyLmluZm8odGFncy5vbmVMaW5lYFxuICAgICAgICBEaXJlY3RvcnkgaXMgYWxyZWFkeSB1bmRlciB2ZXJzaW9uIGNvbnRyb2wuXG4gICAgICAgIFNraXBwaW5nIGluaXRpYWxpemF0aW9uIG9mIGdpdC5cbiAgICAgIGApO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gaWYgZ2l0IGlzIG5vdCBmb3VuZCBvciBhbiBlcnJvciB3YXMgdGhyb3duIGR1cmluZyB0aGUgYGdpdGBcbiAgICAvLyBpbml0IHByb2Nlc3MganVzdCBzd2FsbG93IGFueSBlcnJvcnMgaGVyZVxuICAgIC8vIE5PVEU6IFRoaXMgd2lsbCBiZSByZW1vdmVkIG9uY2UgdGFzayBlcnJvciBoYW5kbGluZyBpcyBpbXBsZW1lbnRlZFxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBleGVjdXRlKFsnaW5pdCddKTtcbiAgICAgIGF3YWl0IGV4ZWN1dGUoWydhZGQnLCAnLiddKTtcblxuICAgICAgaWYgKG9wdGlvbnMuY29tbWl0KSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2UgfHwgJ2luaXRpYWwgY29tbWl0JztcblxuICAgICAgICBhd2FpdCBleGVjdXRlKFsnY29tbWl0JywgYC1tIFwiJHttZXNzYWdlfVwiYF0pO1xuICAgICAgfVxuXG4gICAgICBjb250ZXh0LmxvZ2dlci5pbmZvKCdTdWNjZXNzZnVsbHkgaW5pdGlhbGl6ZWQgZ2l0LicpO1xuICAgIH0gY2F0Y2gge31cbiAgfTtcbn1cbiJdfQ==