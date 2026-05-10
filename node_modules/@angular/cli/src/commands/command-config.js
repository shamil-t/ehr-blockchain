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
exports.RootCommandsAliases = exports.RootCommands = void 0;
exports.RootCommands = {
    'add': {
        factory: () => Promise.resolve().then(() => __importStar(require('./add/cli'))),
    },
    'analytics': {
        factory: () => Promise.resolve().then(() => __importStar(require('./analytics/cli'))),
    },
    'build': {
        factory: () => Promise.resolve().then(() => __importStar(require('./build/cli'))),
        aliases: ['b'],
    },
    'cache': {
        factory: () => Promise.resolve().then(() => __importStar(require('./cache/cli'))),
    },
    'completion': {
        factory: () => Promise.resolve().then(() => __importStar(require('./completion/cli'))),
    },
    'config': {
        factory: () => Promise.resolve().then(() => __importStar(require('./config/cli'))),
    },
    'deploy': {
        factory: () => Promise.resolve().then(() => __importStar(require('./deploy/cli'))),
    },
    'doc': {
        factory: () => Promise.resolve().then(() => __importStar(require('./doc/cli'))),
        aliases: ['d'],
    },
    'e2e': {
        factory: () => Promise.resolve().then(() => __importStar(require('./e2e/cli'))),
        aliases: ['e'],
    },
    'extract-i18n': {
        factory: () => Promise.resolve().then(() => __importStar(require('./extract-i18n/cli'))),
    },
    'generate': {
        factory: () => Promise.resolve().then(() => __importStar(require('./generate/cli'))),
        aliases: ['g'],
    },
    'lint': {
        factory: () => Promise.resolve().then(() => __importStar(require('./lint/cli'))),
    },
    'make-this-awesome': {
        factory: () => Promise.resolve().then(() => __importStar(require('./make-this-awesome/cli'))),
    },
    'new': {
        factory: () => Promise.resolve().then(() => __importStar(require('./new/cli'))),
        aliases: ['n'],
    },
    'run': {
        factory: () => Promise.resolve().then(() => __importStar(require('./run/cli'))),
    },
    'serve': {
        factory: () => Promise.resolve().then(() => __importStar(require('./serve/cli'))),
        aliases: ['s'],
    },
    'test': {
        factory: () => Promise.resolve().then(() => __importStar(require('./test/cli'))),
        aliases: ['t'],
    },
    'update': {
        factory: () => Promise.resolve().then(() => __importStar(require('./update/cli'))),
    },
    'version': {
        factory: () => Promise.resolve().then(() => __importStar(require('./version/cli'))),
        aliases: ['v'],
    },
};
exports.RootCommandsAliases = Object.values(exports.RootCommands).reduce((prev, current) => {
    current.aliases?.forEach((alias) => {
        prev[alias] = current;
    });
    return prev;
}, {});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC1jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL2NsaS9zcmMvY29tbWFuZHMvY29tbWFuZC1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE4QlUsUUFBQSxZQUFZLEdBR3JCO0lBQ0YsS0FBSyxFQUFFO1FBQ0wsT0FBTyxFQUFFLEdBQUcsRUFBRSxtREFBUSxXQUFXLEdBQUM7S0FDbkM7SUFDRCxXQUFXLEVBQUU7UUFDWCxPQUFPLEVBQUUsR0FBRyxFQUFFLG1EQUFRLGlCQUFpQixHQUFDO0tBQ3pDO0lBQ0QsT0FBTyxFQUFFO1FBQ1AsT0FBTyxFQUFFLEdBQUcsRUFBRSxtREFBUSxhQUFhLEdBQUM7UUFDcEMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO0tBQ2Y7SUFDRCxPQUFPLEVBQUU7UUFDUCxPQUFPLEVBQUUsR0FBRyxFQUFFLG1EQUFRLGFBQWEsR0FBQztLQUNyQztJQUNELFlBQVksRUFBRTtRQUNaLE9BQU8sRUFBRSxHQUFHLEVBQUUsbURBQVEsa0JBQWtCLEdBQUM7S0FDMUM7SUFDRCxRQUFRLEVBQUU7UUFDUixPQUFPLEVBQUUsR0FBRyxFQUFFLG1EQUFRLGNBQWMsR0FBQztLQUN0QztJQUNELFFBQVEsRUFBRTtRQUNSLE9BQU8sRUFBRSxHQUFHLEVBQUUsbURBQVEsY0FBYyxHQUFDO0tBQ3RDO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsT0FBTyxFQUFFLEdBQUcsRUFBRSxtREFBUSxXQUFXLEdBQUM7UUFDbEMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO0tBQ2Y7SUFDRCxLQUFLLEVBQUU7UUFDTCxPQUFPLEVBQUUsR0FBRyxFQUFFLG1EQUFRLFdBQVcsR0FBQztRQUNsQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUM7S0FDZjtJQUNELGNBQWMsRUFBRTtRQUNkLE9BQU8sRUFBRSxHQUFHLEVBQUUsbURBQVEsb0JBQW9CLEdBQUM7S0FDNUM7SUFDRCxVQUFVLEVBQUU7UUFDVixPQUFPLEVBQUUsR0FBRyxFQUFFLG1EQUFRLGdCQUFnQixHQUFDO1FBQ3ZDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQztLQUNmO0lBQ0QsTUFBTSxFQUFFO1FBQ04sT0FBTyxFQUFFLEdBQUcsRUFBRSxtREFBUSxZQUFZLEdBQUM7S0FDcEM7SUFDRCxtQkFBbUIsRUFBRTtRQUNuQixPQUFPLEVBQUUsR0FBRyxFQUFFLG1EQUFRLHlCQUF5QixHQUFDO0tBQ2pEO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsT0FBTyxFQUFFLEdBQUcsRUFBRSxtREFBUSxXQUFXLEdBQUM7UUFDbEMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO0tBQ2Y7SUFDRCxLQUFLLEVBQUU7UUFDTCxPQUFPLEVBQUUsR0FBRyxFQUFFLG1EQUFRLFdBQVcsR0FBQztLQUNuQztJQUNELE9BQU8sRUFBRTtRQUNQLE9BQU8sRUFBRSxHQUFHLEVBQUUsbURBQVEsYUFBYSxHQUFDO1FBQ3BDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQztLQUNmO0lBQ0QsTUFBTSxFQUFFO1FBQ04sT0FBTyxFQUFFLEdBQUcsRUFBRSxtREFBUSxZQUFZLEdBQUM7UUFDbkMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO0tBQ2Y7SUFDRCxRQUFRLEVBQUU7UUFDUixPQUFPLEVBQUUsR0FBRyxFQUFFLG1EQUFRLGNBQWMsR0FBQztLQUN0QztJQUNELFNBQVMsRUFBRTtRQUNULE9BQU8sRUFBRSxHQUFHLEVBQUUsbURBQVEsZUFBZSxHQUFDO1FBQ3RDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQztLQUNmO0NBQ0YsQ0FBQztBQUVXLFFBQUEsbUJBQW1CLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxvQkFBWSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFO0lBQ3RGLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDakMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQztJQUN4QixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyxFQUFFLEVBQW1DLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBDb21tYW5kTW9kdWxlQ29uc3RydWN0b3IgfSBmcm9tICcuLi9jb21tYW5kLWJ1aWxkZXIvdXRpbGl0aWVzL2NvbW1hbmQnO1xuXG5leHBvcnQgdHlwZSBDb21tYW5kTmFtZXMgPVxuICB8ICdhZGQnXG4gIHwgJ2FuYWx5dGljcydcbiAgfCAnYnVpbGQnXG4gIHwgJ2NhY2hlJ1xuICB8ICdjb21wbGV0aW9uJ1xuICB8ICdjb25maWcnXG4gIHwgJ2RlcGxveSdcbiAgfCAnZG9jJ1xuICB8ICdlMmUnXG4gIHwgJ2V4dHJhY3QtaTE4bidcbiAgfCAnZ2VuZXJhdGUnXG4gIHwgJ2xpbnQnXG4gIHwgJ21ha2UtdGhpcy1hd2Vzb21lJ1xuICB8ICduZXcnXG4gIHwgJ3J1bidcbiAgfCAnc2VydmUnXG4gIHwgJ3Rlc3QnXG4gIHwgJ3VwZGF0ZSdcbiAgfCAndmVyc2lvbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tbWFuZENvbmZpZyB7XG4gIGFsaWFzZXM/OiBzdHJpbmdbXTtcbiAgZmFjdG9yeTogKCkgPT4gUHJvbWlzZTx7IGRlZmF1bHQ6IENvbW1hbmRNb2R1bGVDb25zdHJ1Y3RvciB9Pjtcbn1cblxuZXhwb3J0IGNvbnN0IFJvb3RDb21tYW5kczogUmVjb3JkPFxuICAvKiBDb21tYW5kICovIENvbW1hbmROYW1lcyAmIHN0cmluZyxcbiAgLyogQ29tbWFuZCBDb25maWcgKi8gQ29tbWFuZENvbmZpZ1xuPiA9IHtcbiAgJ2FkZCc6IHtcbiAgICBmYWN0b3J5OiAoKSA9PiBpbXBvcnQoJy4vYWRkL2NsaScpLFxuICB9LFxuICAnYW5hbHl0aWNzJzoge1xuICAgIGZhY3Rvcnk6ICgpID0+IGltcG9ydCgnLi9hbmFseXRpY3MvY2xpJyksXG4gIH0sXG4gICdidWlsZCc6IHtcbiAgICBmYWN0b3J5OiAoKSA9PiBpbXBvcnQoJy4vYnVpbGQvY2xpJyksXG4gICAgYWxpYXNlczogWydiJ10sXG4gIH0sXG4gICdjYWNoZSc6IHtcbiAgICBmYWN0b3J5OiAoKSA9PiBpbXBvcnQoJy4vY2FjaGUvY2xpJyksXG4gIH0sXG4gICdjb21wbGV0aW9uJzoge1xuICAgIGZhY3Rvcnk6ICgpID0+IGltcG9ydCgnLi9jb21wbGV0aW9uL2NsaScpLFxuICB9LFxuICAnY29uZmlnJzoge1xuICAgIGZhY3Rvcnk6ICgpID0+IGltcG9ydCgnLi9jb25maWcvY2xpJyksXG4gIH0sXG4gICdkZXBsb3knOiB7XG4gICAgZmFjdG9yeTogKCkgPT4gaW1wb3J0KCcuL2RlcGxveS9jbGknKSxcbiAgfSxcbiAgJ2RvYyc6IHtcbiAgICBmYWN0b3J5OiAoKSA9PiBpbXBvcnQoJy4vZG9jL2NsaScpLFxuICAgIGFsaWFzZXM6IFsnZCddLFxuICB9LFxuICAnZTJlJzoge1xuICAgIGZhY3Rvcnk6ICgpID0+IGltcG9ydCgnLi9lMmUvY2xpJyksXG4gICAgYWxpYXNlczogWydlJ10sXG4gIH0sXG4gICdleHRyYWN0LWkxOG4nOiB7XG4gICAgZmFjdG9yeTogKCkgPT4gaW1wb3J0KCcuL2V4dHJhY3QtaTE4bi9jbGknKSxcbiAgfSxcbiAgJ2dlbmVyYXRlJzoge1xuICAgIGZhY3Rvcnk6ICgpID0+IGltcG9ydCgnLi9nZW5lcmF0ZS9jbGknKSxcbiAgICBhbGlhc2VzOiBbJ2cnXSxcbiAgfSxcbiAgJ2xpbnQnOiB7XG4gICAgZmFjdG9yeTogKCkgPT4gaW1wb3J0KCcuL2xpbnQvY2xpJyksXG4gIH0sXG4gICdtYWtlLXRoaXMtYXdlc29tZSc6IHtcbiAgICBmYWN0b3J5OiAoKSA9PiBpbXBvcnQoJy4vbWFrZS10aGlzLWF3ZXNvbWUvY2xpJyksXG4gIH0sXG4gICduZXcnOiB7XG4gICAgZmFjdG9yeTogKCkgPT4gaW1wb3J0KCcuL25ldy9jbGknKSxcbiAgICBhbGlhc2VzOiBbJ24nXSxcbiAgfSxcbiAgJ3J1bic6IHtcbiAgICBmYWN0b3J5OiAoKSA9PiBpbXBvcnQoJy4vcnVuL2NsaScpLFxuICB9LFxuICAnc2VydmUnOiB7XG4gICAgZmFjdG9yeTogKCkgPT4gaW1wb3J0KCcuL3NlcnZlL2NsaScpLFxuICAgIGFsaWFzZXM6IFsncyddLFxuICB9LFxuICAndGVzdCc6IHtcbiAgICBmYWN0b3J5OiAoKSA9PiBpbXBvcnQoJy4vdGVzdC9jbGknKSxcbiAgICBhbGlhc2VzOiBbJ3QnXSxcbiAgfSxcbiAgJ3VwZGF0ZSc6IHtcbiAgICBmYWN0b3J5OiAoKSA9PiBpbXBvcnQoJy4vdXBkYXRlL2NsaScpLFxuICB9LFxuICAndmVyc2lvbic6IHtcbiAgICBmYWN0b3J5OiAoKSA9PiBpbXBvcnQoJy4vdmVyc2lvbi9jbGknKSxcbiAgICBhbGlhc2VzOiBbJ3YnXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBSb290Q29tbWFuZHNBbGlhc2VzID0gT2JqZWN0LnZhbHVlcyhSb290Q29tbWFuZHMpLnJlZHVjZSgocHJldiwgY3VycmVudCkgPT4ge1xuICBjdXJyZW50LmFsaWFzZXM/LmZvckVhY2goKGFsaWFzKSA9PiB7XG4gICAgcHJldlthbGlhc10gPSBjdXJyZW50O1xuICB9KTtcblxuICByZXR1cm4gcHJldjtcbn0sIHt9IGFzIFJlY29yZDxzdHJpbmcsIENvbW1hbmRDb25maWc+KTtcbiJdfQ==